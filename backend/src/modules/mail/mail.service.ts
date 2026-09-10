import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../config/env.config';
import { PLANES } from '../subscriptions/plan.catalog';
import { PRICE_COP } from '../billing/billing.service';
import { generarCuentaDeCobro, generarCuentaDeCobroDeRecarga, nombreDeArchivo } from './cuentaDeCobro.pdf';
import type { PagoDePlanServidor, PeriodoPagado, PlanPagado } from './cuentaDeCobro.pdf';
import {
  URL_ENTRAR,
  botones,
  dato,
  documento,
  fechaCorta,
  fechaLarga,
  fechaYHora,
  nota,
  pares,
  pasos,
  pesos,
  titular
} from './plantilla';
import { QUE_CUESTA, SIN_CONSUMO, loQueIncluye, modulosDe, usuariosDe } from './vocabulario';

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

/*
 * EL DIBUJO NO VIVE AQUÍ. Cabecera, filete, dato grande, tabla de pares,
 * botón, lista numerada y pie son de `plantilla.ts`, y los seis correos de la
 * plataforma usan esa misma pieza. Este archivo solo decide QUÉ dicen los dos
 * que confirman dinero.
 */

interface Plantilla {
  asunto: string;
  html: string;
  texto: string;
}

/** Reexportadas: nacieron aquí y hay quien las importa por este nombre. */
export { pesos, fechaLarga };
export { loQueIncluye };

export interface DatosDeRecarga {
  para: string;
  firma: string;
  montoCop: number;
  referencia: string;
  saldoCop?: number;
  /** ISO. La fecha en que se aplicó, no la del correo. */
  fecha: string;
  /** Para la cuenta de cobro adjunta; ausente se imprime «Sin NIT registrado». */
  nitDeLaFirma?: string | null;
}

/**
 * La confirmación de una recarga ya acreditada.
 *
 * EL DATO GRANDE ES EL SALDO RESULTANTE cuando se conoce, y no el monto
 * recargado: lo que el abogado necesita saber es con cuánto se queda, no
 * cuánto acaba de mover. Sin saldo legible cae al monto, que es el otro hecho
 * cierto — nunca a una cifra estimada.
 *
 * «CON ESTE SALDO PUEDE GENERAR N ESCRITOS» SE DICE COMO MÁXIMO, NO COMO
 * PROMEDIO. `priceFor` cobra `max(piso, costo medido)`, así que dividir el
 * saldo por el piso da el TOPE de escritos, y un escrito largo cuesta más.
 * Presentar ese tope como una previsión sería inventar una cifra con cara de
 * cálculo, que es justo lo que esta casa tiene prohibido.
 */
export const plantillaDeRecarga = (d: DatosDeRecarga): Plantilla => {
  const asunto = 'Recarga de saldo confirmada · Iureon';
  const saldoConocido = typeof d.saldoCop === 'number';
  const protagonista = saldoConocido
    ? dato('SALDO DISPONIBLE', pesos(d.saldoCop as number), `Recarga de ${pesos(d.montoCop)} ya acreditada`)
    : dato('RECARGA ACREDITADA', pesos(d.montoCop), 'El saldo ya está disponible para toda la firma');

  const topeDeEscritos = saldoConocido ? Math.floor((d.saldoCop as number) / PRICE_COP.BORRADOR) : 0;

  const { html, texto } = documento({
    titulo: 'Su recarga quedó acreditada',
    numero: '03',
    seccion: 'RECARGA DE SALDO',
    mencionaPrecios: true,
    adelanto: saldoConocido
      ? `Su recarga de ${pesos(d.montoCop)} quedó acreditada. Saldo disponible de la firma: ${pesos(d.saldoCop as number)}.`
      : `Su recarga de ${pesos(d.montoCop)} quedó acreditada.`,
    razonDelPie:
      'Recibe este correo porque el saldo de su firma fue recargado. Es un correo de facturación y no se puede desactivar.',
    bloques: [
      titular(
        'Su recarga quedó acreditada.',
        'El saldo es de la firma y lo usan todos sus abogados. Se descuenta por consumo, solo cuando se genera un escrito, se revisa uno o se consulta la guía del taller.'
      ),
      protagonista,
      pares('LA TRANSACCIÓN', [
        ['Valor recargado', pesos(d.montoCop)],
        ['Medio de pago', `Wompi · ${d.referencia}`],
        ['Fecha', fechaYHora(d.fecha)],
        ['Firma', d.firma]
      ]),
      /*
       * El botón lleva a la aplicación y no a «Saldo», que la maqueta enlazaba
       * como `/saldo`: esa ruta no existe. El saldo es un panel dentro de la
       * aplicación, y dónde está lo dice la nota de abajo con su nombre real.
       */
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }),
      pasos('QUÉ CUESTA CADA COSA', [...QUE_CUESTA]),
      nota(
        `${SIN_CONSUMO}${
          topeDeEscritos > 0
            ? ` Con este saldo puede generar hasta ${topeDeEscritos.toLocaleString('es-CO')} escritos o revisiones; es un máximo, porque un escrito largo cuesta más que el mínimo.`
            : ''
        }`
      ),
      nota(
        'Adjuntamos la cuenta de cobro en PDF. No es factura electrónica de venta validada por la DIAN y no discrimina IVA. El extracto del periodo se descarga desde la aplicación, en Saldo › Extracto.'
      )
    ]
  });

  return { asunto, html, texto };
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

/**
 * La confirmación de un plan YA PAGADO. Este sí puede decir «activo»: sale de
 * `apply_subscription_payment`, que ya escribió el periodo en la fila de la
 * firma. La bienvenida de quien apenas se registró para comprar no puede, y
 * por eso es otro correo.
 *
 * LO QUE QUEDA HABILITADO SE LEE DEL CATÁLOGO. La maqueta prometía Audiencias,
 * Entrevistas y Orientación en un correo que también podía confirmar un plan
 * Esencial, que no tiene ninguno de los tres.
 */
export const plantillaDeSuscripcion = (d: DatosDeSuscripcion): Plantilla => {
  const def = PLANES[d.plan];
  const nombrePeriodo = d.periodo === 'ANUAL' ? 'anual' : 'mensual';
  const asunto = `Suscripción al plan ${def.nombre} confirmada · Iureon`;
  const cobertura = `del ${fechaLarga(d.validoDesde)} al ${fechaLarga(d.validoHasta)}`;
  const precio = d.periodo === 'ANUAL' ? def.precioAnualCop : def.precioMensualCop;

  const { html, texto } = documento({
    titulo: `Plan ${def.nombre} activo`,
    numero: '02',
    seccion: 'PLAN CONTRATADO',
    mencionaPrecios: true,
    adelanto: `Pago recibido por Wompi. Su plan ${def.nombre} queda activo hasta el ${fechaLarga(d.validoHasta)}.`,
    razonDelPie:
      'Recibe este correo porque es el socio administrador de la firma que contrató el plan. Es un correo de facturación y no se puede desactivar.',
    bloques: [
      titular(
        `Su plan ${def.nombre} está activo.`,
        'Recibimos el pago por Wompi. No guardamos su tarjeta y no habrá cobro automático: cuando quiera continuar, usted paga de nuevo desde la aplicación.'
      ),
      dato(
        'VIGENTE HASTA',
        fechaCorta(d.validoHasta),
        `${def.nombre} · ${usuariosDe(def.maxUsuarios)} · ${pesos(precio)} al ${nombrePeriodo === 'anual' ? 'año' : 'mes'}, IVA incluido`
      ),
      pares('EL PAGO', [
        ['Valor pagado', `${pesos(d.montoCop)} (IVA incluido)`],
        ['Plan', `${def.nombre} · ${nombrePeriodo}`],
        ['Periodo cubierto', cobertura],
        ['Medio de pago', `Wompi · ${d.referencia}`],
        ['Firma', d.firma]
      ]),
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }),
      pasos('QUÉ QUEDA HABILITADO', [
        {
          titulo: `Los módulos de ${def.nombre}.`,
          // Del catálogo de planes: Esencial no abre Audiencias, Entrevistas ni Orientación.
          detalle: `${modulosDe(d.plan)}.`
        },
        {
          titulo: 'El periodo se suma, no se reinicia.',
          detalle:
            'Si paga antes del vencimiento, los días que le quedaban se conservan y el periodo nuevo arranca donde terminaba el anterior.'
        },
        {
          titulo: 'Sin cobro automático.',
          detalle: 'No guardamos su tarjeta. Para continuar después del vencimiento, usted paga de nuevo desde «Plan».'
        }
      ]),
      nota(
        `El plan incluye ${usuariosDe(def.maxUsuarios)}. El uso de inteligencia artificial se paga aparte, con recargas de saldo dentro de la aplicación: un escrito o una revisión desde ${pesos(PRICE_COP.BORRADOR)} y una consulta a la guía del taller ${pesos(PRICE_COP.CONSULTA_REVISION)}. Si paga antes del vencimiento se suma el periodo, nunca se pierden días.`
      ),
      nota(
        'Adjuntamos la cuenta de cobro en PDF. No es factura electrónica de venta validada por la DIAN y no discrimina IVA.'
      )
    ]
  });

  return { asunto, html, texto };
};

/* ────────────────────────── Envíos ────────────────────────── */

/**
 * La recarga también viaja con su cuenta de cobro.
 *
 * POR QUÉ NO LA TENÍA. El PDF nació para la suscripción y se quedó ahí, pero
 * una recarga de saldo es dinero que entró exactamente igual y el contador de
 * la firma necesita el mismo soporte. El documento es el mismo que el de la
 * suscripción, con el concepto que le corresponde y sin periodo cubierto: una
 * recarga acredita saldo, no compra tiempo.
 *
 * Si el PDF no se pudiera producir, el correo sale igual sin adjunto: la
 * confirmación de que el saldo está disponible importa más que el soporte.
 */
export const correoDeRecarga = (d: DatosDeRecarga): Promise<ResultadoDeEnvio> => {
  let adjuntos: Adjunto[] | undefined;
  try {
    adjuntos = [
      {
        filename: nombreDeArchivo(d.referencia),
        content: generarCuentaDeCobroDeRecarga(
          {
            reference: d.referencia,
            amountCop: d.montoCop,
            userEmail: d.para,
            createdAt: d.fecha
          },
          { nombre: d.firma, nit: d.nitDeLaFirma, correo: d.para }
        ),
        contentType: 'application/pdf'
      }
    ];
  } catch (err) {
    console.error('[MAIL] No se pudo generar la cuenta de cobro de la recarga; el correo sale sin adjunto:', err);
  }

  return enviarCorreo({ para: d.para, adjuntos, ...plantillaDeRecarga(d) });
};

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

/**
 * El mensaje de prueba que `POST /api/admin/mail/test` manda al propio operador.
 *
 * Usa la MISMA pieza que los correos reales, y no un HTML suelto, porque su
 * único trabajo es responder «¿llega y se ve bien?». Un mensaje de prueba con
 * otro dibujo contesta la primera mitad de la pregunta y calla la segunda.
 */
export const correoDePrueba = (para: string): Promise<ResultadoDeEnvio> => {
  const ahora = new Date().toISOString();
  const { html, texto } = documento({
    titulo: 'Prueba de correo de Iureon',
    numero: '00',
    seccion: 'PRUEBA DE CORREO',
    mencionaPrecios: false,
    adelanto: 'Si lee este mensaje, el correo saliente de Iureon está configurado.',
    razonDelPie:
      'Recibe este correo porque alguien pulsó «Probar el correo» en la consola de operación de Iureon. No se envía a ninguna firma.',
    bloques: [
      titular(
        'El correo saliente funciona.',
        'Este es un mensaje de prueba. Si lo está leyendo, las credenciales del proveedor de envío están bien configuradas y los correos de la plataforma pueden salir.'
      ),
      dato('ENVIADO EL', fechaCorta(ahora), fechaYHora(ahora)),
      pares('LA PRUEBA', [
        ['Destinatario', para],
        ['Proveedor', config.mail.provider === 'resend' ? 'Resend' : 'Gmail'],
        ['Remitente', config.mail.fromName]
      ]),
      botones({ texto: 'Entrar a Iureon', url: URL_ENTRAR }),
      nota(
        'Compruebe de paso que la cabecera, el filete dorado, el dato grande y la tabla se ven como aquí: es la misma pieza con la que salen los correos de bienvenida, de plan, de recarga y de borrado.'
      )
    ]
  });

  return enviarCorreo({ para, asunto: 'Prueba de correo · Iureon', html, texto });
};
