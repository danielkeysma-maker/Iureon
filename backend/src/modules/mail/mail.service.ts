import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../config/env.config';
import { PLANES } from '../subscriptions/plan.catalog';
import type { Modulo } from '../subscriptions/plan.catalog';
import { generarCuentaDeCobro, nombreDeArchivo } from './cuentaDeCobro.pdf';
import type { PagoDePlanServidor, PeriodoPagado, PlanPagado } from './cuentaDeCobro.pdf';

/**
 * Correo transaccional de la plataforma.
 *
 * POR QUÉ GMAIL Y NO UN PROVEEDOR DE ENVÍO. Un proveedor transaccional (SES,
 * Resend, Postmark) exige verificar un dominio propio, y el operador no tiene
 * uno: la aplicación vive en vercel.app. Gmail con contraseña de aplicación
 * envía desde la cuenta del titular sin verificar nada, con un tope de unos
 * 500 correos al día que sobra para confirmar pagos. El día que exista un
 * dominio, este archivo es el único que cambia: los que llaman a
 * `enviarCorreo` no saben por dónde sale.
 *
 * NUNCA LANZA HACIA QUIEN LLAMA. El correo confirma un pago que YA se aplicó:
 * si el envío falla, el saldo sigue acreditado y el plan sigue extendido, y un
 * throw aquí haría que el webhook respondiera 5xx y Wompi reintentara un pago
 * que no se puede volver a aplicar. Se devuelve `{ enviado, error }` y se
 * escribe en el registro con el prefijo `[MAIL]`, que es lo que el operador
 * busca cuando una firma dice que no le llegó nada.
 *
 * SIN CORREO CONFIGURADO NADA SE ROMPE: se avisa una vez y se omite el envío.
 */

export interface Adjunto {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface Correo {
  para: string;
  asunto: string;
  html: string;
  texto: string;
  adjuntos?: Adjunto[];
}

export interface ResultadoDeEnvio {
  enviado: boolean;
  error?: string;
}

/** Cuánto se espera al servidor SMTP antes de darse por vencido. */
const PLAZO_MS = 10_000;

let transporte: Transporter | null = null;
let yaAviseQueEstaApagado = false;

const transportador = (): Transporter => {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.mail.user, pass: config.mail.appPassword },
      connectionTimeout: PLAZO_MS,
      greetingTimeout: PLAZO_MS,
      socketTimeout: PLAZO_MS
    });
  }
  return transporte;
};

/** `d***@gmail.com`: suficiente para reconocer la cuenta en un registro, sin publicarla. */
export const enmascarar = (correo: string): string => {
  const [usuario, dominio] = correo.split('@');
  if (!dominio) return '***';
  return `${usuario.slice(0, 1)}***@${dominio}`;
};

export const enviarCorreo = async (correo: Correo): Promise<ResultadoDeEnvio> => {
  if (!config.mail.enabled) {
    if (!yaAviseQueEstaApagado) {
      console.warn(
        '[MAIL] Correo saliente apagado: faltan RESEND_API_KEY y MAIL_FROM (o GMAIL_USER y GMAIL_APP_PASSWORD). ' +
          'Los pagos se aplican igual; solo no se confirma por correo.'
      );
      yaAviseQueEstaApagado = true;
    }
    return { enviado: false, error: 'MAIL_DISABLED' };
  }

  /*
   * Plazo propio además de los del transporte: los de nodemailer cubren
   * conectar y hablar con el servidor, pero no una respuesta que nunca llega a
   * mitad del envío. En una función serverless una promesa colgada es una
   * respuesta que no sale y un webhook que Wompi reintenta.
   */
  let temporizador: NodeJS.Timeout | undefined;
  const plazo = new Promise<never>((_, reject) => {
    temporizador = setTimeout(() => reject(new Error(`SMTP no respondió en ${PLAZO_MS / 1000} s`)), PLAZO_MS);
  });

  try {
    if (config.mail.provider === 'resend') {
      /*
       * Resend por HTTP: una función serverless habla mejor HTTPS que SMTP
       * (sin apretón de manos largo ni puertos que Vercel pueda cerrar), y los
       * adjuntos viajan en base64 dentro del JSON.
       */
      const respuesta = await Promise.race([
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.mail.resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${config.mail.fromName} <${config.mail.user}>`,
            to: [correo.para],
            subject: correo.asunto,
            text: correo.texto,
            html: correo.html,
            attachments: correo.adjuntos?.map((a) => ({ filename: a.filename, content: a.content.toString('base64') }))
          }),
          signal: AbortSignal.timeout(PLAZO_MS)
        }),
        plazo
      ]);
      if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Resend respondió ${respuesta.status}: ${detalle.slice(0, 300)}`);
      }
      console.log(`[MAIL] Enviado por Resend a ${enmascarar(correo.para)}: ${correo.asunto}`);
      return { enviado: true };
    }

    await Promise.race([
      transportador().sendMail({
        from: `"${config.mail.fromName}" <${config.mail.user}>`,
        to: correo.para,
        subject: correo.asunto,
        text: correo.texto,
        html: correo.html,
        attachments: correo.adjuntos?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType ?? 'application/pdf'
        }))
      }),
      plazo
    ]);
    console.log(`[MAIL] Enviado a ${enmascarar(correo.para)}: ${correo.asunto}`);
    return { enviado: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[MAIL] No se pudo enviar a ${enmascarar(correo.para)} (${correo.asunto}): ${error}`);
    return { enviado: false, error };
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
};

/* ────────────────────────── Plantillas ────────────────────────── */

/** Color de marca (brand-700), el mismo de la barra lateral de la aplicación. */
const COLOR_MARCA = '#17456B';

export const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')} COP`;

export const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });

/*
 * Todo lo que viene de la base (nombre de la firma, referencia) pasa por aquí
 * antes de entrar al HTML. Un nombre de firma con `<` no es un ataque probable,
 * pero un correo mal formado sí es una queja segura.
 */
const escapar = (texto: string): string =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

interface Plantilla {
  asunto: string;
  html: string;
  texto: string;
}

/**
 * El marco común: barra de marca, cuerpo en párrafos y pie. Sin imágenes, para
 * que se lea igual con las imágenes bloqueadas, que es como llegan la mayoría
 * de correos a una bandeja corporativa.
 */
const envolver = (titulo: string, cuerpoHtml: string): string => `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Helvetica,Arial,sans-serif;color:#101822;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e3e7ec;">
        <tr><td style="background:${COLOR_MARCA};color:#ffffff;padding:16px 24px;font-size:18px;font-weight:bold;">Iureon</td></tr>
        <tr><td style="padding:24px;font-size:15px;line-height:1.5;">
          <h1 style="margin:0 0 16px 0;font-size:20px;color:${COLOR_MARCA};">${titulo}</h1>
          ${cuerpoHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e3e7ec;font-size:12px;color:#667487;line-height:1.5;">
          Este correo se envía automáticamente al confirmarse un pago en Iureon. Si usted no reconoce esta operación, responda a este mensaje y lo revisamos.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const fila = (etiqueta: string, valor: string): string =>
  `<tr><td style="padding:6px 12px 6px 0;color:#667487;white-space:nowrap;">${etiqueta}</td><td style="padding:6px 0;font-weight:bold;">${valor}</td></tr>`;

export interface DatosDeRecarga {
  para: string;
  firma: string;
  montoCop: number;
  referencia: string;
  saldoCop?: number;
  /** ISO. La fecha en que se aplicó, no la del correo. */
  fecha: string;
}

export const plantillaDeRecarga = (d: DatosDeRecarga): Plantilla => {
  const asunto = 'Recarga de saldo confirmada · Iureon';
  const filas = [
    fila('Firma', escapar(d.firma)),
    fila('Monto acreditado', pesos(d.montoCop)),
    ...(typeof d.saldoCop === 'number' ? [fila('Saldo disponible', pesos(d.saldoCop))] : []),
    fila('Referencia Wompi', escapar(d.referencia)),
    fila('Fecha', fechaLarga(d.fecha))
  ].join('');

  const html = envolver(
    'Su recarga quedó aplicada',
    `<p style="margin:0 0 16px 0;">Recibimos el pago y el saldo ya está disponible para generar escritos, revisiones y transcripciones.</p>
     <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:15px;margin:0 0 16px 0;">${filas}</table>
     <p style="margin:0;color:#667487;font-size:13px;">El comprobante y el extracto del periodo se descargan desde la aplicación, en <strong>Saldo › Extracto</strong>.</p>`
  );

  const texto = [
    'Su recarga quedó aplicada.',
    '',
    `Firma: ${d.firma}`,
    `Monto acreditado: ${pesos(d.montoCop)}`,
    ...(typeof d.saldoCop === 'number' ? [`Saldo disponible: ${pesos(d.saldoCop)}`] : []),
    `Referencia Wompi: ${d.referencia}`,
    `Fecha: ${fechaLarga(d.fecha)}`,
    '',
    'El saldo ya está disponible. El comprobante y el extracto se descargan en la aplicación (Saldo › Extracto).'
  ].join('\n');

  return { asunto, html, texto };
};

const NOMBRE_DE_MODULO: Record<Modulo, string> = {
  REDACCION: 'Redacción',
  BORRADORES: 'Borradores',
  REVISIONES: 'Revisiones',
  BUSCADOR: 'Buscador',
  CATALOGO: 'Catálogo',
  HERRAMIENTAS: 'Herramientas',
  MANUAL: 'Manual',
  SOPORTE: 'Soporte',
  MEMBRETE: 'Membrete',
  AUDIENCIAS: 'Audiencias',
  ENTREVISTAS: 'Entrevistas',
  ORIENTACION: 'Orientación'
};

/** Una línea leída del catálogo de planes, no escrita a mano: si el plan cambia, el correo cambia. */
export const loQueIncluye = (plan: PlanPagado): string => {
  const def = PLANES[plan];
  const usuarios = def.maxUsuarios === 1 ? '1 usuario' : `hasta ${def.maxUsuarios} usuarios`;
  return `${usuarios} · ${def.modulos.map((m) => NOMBRE_DE_MODULO[m]).join(', ')}`;
};

export interface DatosDeSuscripcion {
  para: string;
  firma: string;
  plan: PlanPagado;
  periodo: PeriodoPagado;
  montoCop: number;
  validoDesde: string;
  validoHasta: string;
  referencia: string;
}

export const plantillaDeSuscripcion = (d: DatosDeSuscripcion): Plantilla => {
  const nombrePlan = PLANES[d.plan].nombre;
  const nombrePeriodo = d.periodo === 'ANUAL' ? 'anual' : 'mensual';
  const asunto = `Suscripción al plan ${nombrePlan} confirmada · Iureon`;
  const cobertura = `del ${fechaLarga(d.validoDesde)} al ${fechaLarga(d.validoHasta)}`;

  const filas = [
    fila('Firma', escapar(d.firma)),
    fila('Plan', `${nombrePlan} · ${nombrePeriodo}`),
    fila('Periodo cubierto', cobertura),
    fila('Valor pagado', pesos(d.montoCop)),
    fila('Referencia Wompi', escapar(d.referencia))
  ].join('');

  const html = envolver(
    `Plan ${nombrePlan} activo`,
    `<p style="margin:0 0 16px 0;">Recibimos el pago y el plan ${nombrePlan} quedó vigente ${cobertura}.</p>
     <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:15px;margin:0 0 16px 0;">${filas}</table>
     <p style="margin:0 0 16px 0;">El plan incluye: ${escapar(loQueIncluye(d.plan))}.</p>
     <p style="margin:0;color:#667487;font-size:13px;">Adjuntamos la cuenta de cobro en PDF. No es factura electrónica de venta validada por la DIAN y no discrimina IVA.</p>`
  );

  const texto = [
    `Plan ${nombrePlan} activo.`,
    '',
    `Firma: ${d.firma}`,
    `Plan: ${nombrePlan} · ${nombrePeriodo}`,
    `Periodo cubierto: ${cobertura}`,
    `Valor pagado: ${pesos(d.montoCop)}`,
    `Referencia Wompi: ${d.referencia}`,
    '',
    `El plan incluye: ${loQueIncluye(d.plan)}.`,
    'Adjuntamos la cuenta de cobro en PDF. No es factura electrónica de venta validada por la DIAN y no discrimina IVA.'
  ].join('\n');

  return { asunto, html, texto };
};

/* ────────────────────────── Envíos ────────────────────────── */

export const correoDeRecarga = (d: DatosDeRecarga): Promise<ResultadoDeEnvio> =>
  enviarCorreo({ para: d.para, ...plantillaDeRecarga(d) });

/**
 * La cuenta de cobro viaja adjunta, generada aquí con el mismo trazado que la
 * que el navegador descarga. Si el PDF no se pudiera producir, el correo sale
 * igual sin adjunto: la confirmación importa más que el soporte contable, que
 * la firma siempre puede bajar desde la aplicación.
 */
export const correoDeSuscripcion = async (
  d: DatosDeSuscripcion & { pago: PagoDePlanServidor; nitDeLaFirma?: string | null }
): Promise<ResultadoDeEnvio> => {
  let adjuntos: Adjunto[] | undefined;
  try {
    adjuntos = [
      {
        filename: nombreDeArchivo(d.referencia),
        content: generarCuentaDeCobro(d.pago, { nombre: d.firma, nit: d.nitDeLaFirma, correo: d.para }),
        contentType: 'application/pdf'
      }
    ];
  } catch (err) {
    console.error('[MAIL] No se pudo generar la cuenta de cobro; el correo sale sin adjunto:', err);
  }

  return enviarCorreo({ para: d.para, adjuntos, ...plantillaDeSuscripcion(d) });
};

/** Lo que el operador ve en `GET /api/admin/mail/status`. */
export const estadoDelCorreo = (): { enabled: boolean; user: string | null; fromName: string } => ({
  enabled: config.mail.enabled,
  user: config.mail.enabled ? enmascarar(config.mail.user) : null,
  fromName: config.mail.fromName
});

/** El mensaje de prueba que `POST /api/admin/mail/test` manda al propio operador. */
export const correoDePrueba = (para: string): Promise<ResultadoDeEnvio> =>
  enviarCorreo({
    para,
    asunto: 'Prueba de correo · Iureon',
    texto: `Este es un mensaje de prueba enviado desde Iureon el ${fechaLarga(new Date().toISOString())}. Si lo lee, el correo saliente está configurado.`,
    html: envolver(
      'El correo saliente funciona',
      `<p style="margin:0;">Este es un mensaje de prueba enviado el ${fechaLarga(new Date().toISOString())}. Si lo lee, la cuenta de Gmail y su contraseña de aplicación están bien configuradas.</p>`
    )
  });
