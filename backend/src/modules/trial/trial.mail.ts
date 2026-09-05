import { enviarCorreo } from '../mail/mail.service';
import type { ResultadoDeEnvio } from '../mail/mail.service';
import { PLANES, type Plan } from '../subscriptions/plan.catalog';
import { DIAS_DE_PRUEBA_GRATUITA } from './trial.rules';

/**
 * The welcome e-mail of the free trial.
 *
 * Its own template, not one of `mail.service`'s: those wrap every message in
 * a footer that says "se envía automáticamente al confirmarse un pago", which
 * is false here and would be the first thing a new user reads. Same visual
 * frame, same colours, an honest footer.
 *
 * Sent AFTER the firm exists and never blocks the response: with mail
 * disabled the trial still opens (the session is returned directly), so a
 * missing e-mail is a missing courtesy, not a missing account.
 */

const COLOR_MARCA = '#17456B';

const escapar = (texto: string): string =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota'
  });

const NOMBRE_DE_MODULO: Record<string, string> = {
  REDACCION: 'Redacción',
  BORRADORES: 'Borradores',
  REVISIONES: 'Revisiones',
  BUSCADOR: 'Buscador',
  CATALOGO: 'Catálogo',
  HERRAMIENTAS: 'Herramientas',
  MANUAL: 'Manual',
  SOPORTE: 'Soporte',
  MEMBRETE: 'Membrete'
};

export interface DatosDeBienvenida {
  para: string;
  nombre: string;
  firma: string;
  /** ISO. */
  venceEl: string;
}

export const plantillaDeBienvenida = (
  d: DatosDeBienvenida
): { asunto: string; html: string; texto: string } => {
  const modulos = PLANES.ESENCIAL.modulos.map((m) => NOMBRE_DE_MODULO[m] ?? m).join(', ');
  const asunto = `Su prueba gratuita de Iureon está abierta · ${DIAS_DE_PRUEBA_GRATUITA} días`;
  const vence = fechaLarga(d.venceEl);

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Helvetica,Arial,sans-serif;color:#101822;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e3e7ec;">
        <tr><td style="background:${COLOR_MARCA};color:#ffffff;padding:16px 24px;font-size:18px;font-weight:bold;">Iureon</td></tr>
        <tr><td style="padding:24px;font-size:15px;line-height:1.5;">
          <h1 style="margin:0 0 16px 0;font-size:20px;color:${COLOR_MARCA};">Bienvenido, ${escapar(d.nombre)}</h1>
          <p style="margin:0 0 16px 0;">La firma <strong>${escapar(d.firma)}</strong> ya tiene su cuenta en Iureon con el plan Esencial en prueba gratuita hasta el <strong>${vence}</strong>. No pedimos tarjeta y nada se cobra al terminar.</p>
          <p style="margin:0 0 8px 0;"><strong>Qué incluye la prueba</strong></p>
          <p style="margin:0 0 16px 0;">${escapar(modulos)}. Un usuario.</p>
          <p style="margin:0 0 8px 0;"><strong>Sobre el saldo de inteligencia artificial</strong></p>
          <p style="margin:0 0 16px 0;">El plan es el derecho a usar la aplicación; cada escrito o revisión que genera la inteligencia artificial se descuenta de un saldo aparte, que empieza en cero. Para probar la redacción recargue desde <strong>Saldo › Recargar</strong> (mínimo $100.000 COP); el Catálogo, el Buscador, las Herramientas y el Manual no consumen saldo.</p>
          <p style="margin:0 0 8px 0;"><strong>Al terminar los ${DIAS_DE_PRUEBA_GRATUITA} días</strong></p>
          <p style="margin:0 0 16px 0;">La aplicación pasa a solo lectura: conserva lo que hizo y puede seguir leyéndolo y exportándolo. Para continuar, contrate Esencial u otro plan desde <strong>Plan › Contratar</strong>; el saldo que haya recargado no se pierde.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e3e7ec;font-size:12px;color:#667487;line-height:1.5;">
          Este correo se envía al abrir una prueba gratuita en Iureon. Si usted no la solicitó, responda a este mensaje y cerramos la cuenta.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const texto = [
    `Bienvenido, ${d.nombre}.`,
    '',
    `La firma ${d.firma} ya tiene su cuenta en Iureon con el plan Esencial en prueba gratuita hasta el ${vence}. No pedimos tarjeta y nada se cobra al terminar.`,
    '',
    `Qué incluye la prueba: ${modulos}. Un usuario.`,
    '',
    'Sobre el saldo de inteligencia artificial: el plan es el derecho a usar la aplicación; cada escrito o revisión que genera la IA se descuenta de un saldo aparte, que empieza en cero. Para probar la redacción recargue desde Saldo › Recargar (mínimo $100.000 COP). El Catálogo, el Buscador, las Herramientas y el Manual no consumen saldo.',
    '',
    `Al terminar los ${DIAS_DE_PRUEBA_GRATUITA} días la aplicación pasa a solo lectura: conserva lo que hizo. Para continuar, contrate Esencial u otro plan desde Plan › Contratar; el saldo recargado no se pierde.`,
    '',
    'Si usted no solicitó esta prueba, responda a este mensaje y cerramos la cuenta.'
  ].join('\n');

  return { asunto, html, texto };
};

export const enviarBienvenida = async (d: DatosDeBienvenida): Promise<ResultadoDeEnvio> => {
  const { asunto, html, texto } = plantillaDeBienvenida(d);
  return enviarCorreo({ para: d.para, asunto, html, texto });
};

export interface DatosDeBienvenidaDeCompra {
  para: string;
  nombre: string;
  firma: string;
  plan: Plan;
}

const pesos = (valor: number): string => `$${valor.toLocaleString('es-CO')}`;

/**
 * The welcome of a firm that signed up to BUY: the account exists, the plan
 * does not yet. Said plainly, because the first screen this person sees is
 * the read-only bar, and an e-mail that congratulated them on "their plan"
 * would contradict it.
 */
export const plantillaDeBienvenidaDeCompra = (
  d: DatosDeBienvenidaDeCompra
): { asunto: string; html: string; texto: string } => {
  const def = PLANES[d.plan];
  const modulos = def.modulos.map((m) => NOMBRE_DE_MODULO[m] ?? m).join(', ');
  const asunto = `Su cuenta en Iureon está creada · active el plan ${def.nombre}`;
  const usuarios = def.maxUsuarios === 1 ? 'Un usuario.' : `Hasta ${def.maxUsuarios} usuarios.`;

  const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Helvetica,Arial,sans-serif;color:#101822;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f8fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e3e7ec;">
        <tr><td style="background:${COLOR_MARCA};color:#ffffff;padding:16px 24px;font-size:18px;font-weight:bold;">Iureon</td></tr>
        <tr><td style="padding:24px;font-size:15px;line-height:1.5;">
          <h1 style="margin:0 0 16px 0;font-size:20px;color:${COLOR_MARCA};">Bienvenido, ${escapar(d.nombre)}</h1>
          <p style="margin:0 0 16px 0;">La cuenta de <strong>${escapar(d.firma)}</strong> ya está creada. Para activar el plan <strong>${escapar(def.nombre)}</strong>, complete el pago desde <strong>«Plan»</strong> dentro de la aplicación: ${pesos(def.precioMensualCop)} al mes o ${pesos(def.precioAnualCop)} al año, IVA incluido.</p>
          <p style="margin:0 0 8px 0;"><strong>Qué incluye ${escapar(def.nombre)}</strong></p>
          <p style="margin:0 0 16px 0;">${escapar(modulos)}. ${usuarios}</p>
          <p style="margin:0 0 8px 0;"><strong>Mientras no se pague</strong></p>
          <p style="margin:0 0 16px 0;">La aplicación abre en solo lectura y la pantalla del plan queda a la vista. Al confirmarse el pago en Wompi todo se habilita en el acto y el periodo cuenta desde ese día; no se guarda tarjeta ni se renueva solo.</p>
          <p style="margin:0 0 8px 0;"><strong>Sobre el saldo de inteligencia artificial</strong></p>
          <p style="margin:0 0 16px 0;">El plan es el derecho a usar la aplicación; cada escrito o revisión que genera la inteligencia artificial se descuenta de un saldo aparte, que se recarga desde <strong>Saldo › Recargar</strong>.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e3e7ec;font-size:12px;color:#667487;line-height:1.5;">
          Este correo se envía al crear una cuenta en Iureon desde la página pública. Si usted no la solicitó, responda a este mensaje y cerramos la cuenta.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const texto = [
    `Bienvenido, ${d.nombre}.`,
    '',
    `La cuenta de ${d.firma} ya está creada. Para activar el plan ${def.nombre}, complete el pago desde «Plan» dentro de la aplicación: ${pesos(def.precioMensualCop)} al mes o ${pesos(def.precioAnualCop)} al año, IVA incluido.`,
    '',
    `Qué incluye ${def.nombre}: ${modulos}. ${usuarios}`,
    '',
    'Mientras no se pague, la aplicación abre en solo lectura y la pantalla del plan queda a la vista. Al confirmarse el pago en Wompi todo se habilita en el acto y el periodo cuenta desde ese día; no se guarda tarjeta ni se renueva solo.',
    '',
    'El saldo de inteligencia artificial es aparte y se recarga desde Saldo › Recargar.',
    '',
    'Si usted no solicitó esta cuenta, responda a este mensaje y la cerramos.'
  ].join('\n');

  return { asunto, html, texto };
};

export const enviarBienvenidaDeCompra = async (d: DatosDeBienvenidaDeCompra): Promise<ResultadoDeEnvio> => {
  const { asunto, html, texto } = plantillaDeBienvenidaDeCompra(d);
  return enviarCorreo({ para: d.para, asunto, html, texto });
};
