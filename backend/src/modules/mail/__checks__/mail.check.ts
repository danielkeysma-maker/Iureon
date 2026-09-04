/**
 * Guards the transactional mail module without sending anything.
 *
 * Run with: npm run check:mail
 *
 * No SMTP, no network, no Gmail account: it proves the pure parts — the
 * templates say the right amounts in es-CO, the subjects are the agreed ones,
 * the cuenta de cobro is a real PDF — and that a disabled mailer refuses
 * quietly instead of throwing into the webhook that called it.
 */
import { generarCuentaDeCobro, nombreDeArchivo, numeroDeCuenta } from '../cuentaDeCobro.pdf';
import { EMISOR } from '../emisor';
import { enviarCorreo, loQueIncluye, plantillaDeRecarga, plantillaDeSuscripcion, enmascarar } from '../mail.service';
import { config } from '../../../config/env.config';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const REFERENCIA = 'IUR-firma-demo-1725400000000-a1b2c3d4e5f6';

/* ── Recarga ── */
const recarga = plantillaDeRecarga({
  para: 'socia@firma.example',
  firma: 'Firma & Asociados <Sucre>',
  montoCop: 150_000,
  referencia: REFERENCIA,
  saldoCop: 1_250_000,
  fecha: '2026-09-04T15:00:00.000Z'
});

check('asunto de recarga', recarga.asunto === 'Recarga de saldo confirmada · Iureon', recarga.asunto);
check('monto de recarga en es-CO (html)', recarga.html.includes('$150.000 COP'));
check('saldo resultante en es-CO (html)', recarga.html.includes('$1.250.000 COP'));
check('monto de recarga en es-CO (texto)', recarga.texto.includes('$150.000 COP'));
check('referencia Wompi en el cuerpo', recarga.html.includes(REFERENCIA) && recarga.texto.includes(REFERENCIA));
check('nombre de firma escapado en el HTML', recarga.html.includes('Firma &amp; Asociados &lt;Sucre&gt;') && !recarga.html.includes('<Sucre>'));
check('remite al extracto en la app', recarga.html.includes('Saldo › Extracto'));
check('fecha en zona de Bogotá', recarga.html.includes('4 de septiembre de 2026'));
check('barra de marca #17456B', recarga.html.includes('#17456B'));
check('sin imágenes', !/<img\b/i.test(recarga.html));

const sinSaldo = plantillaDeRecarga({
  para: 'x@y.example',
  firma: 'F',
  montoCop: 100_000,
  referencia: REFERENCIA,
  fecha: '2026-09-04T15:00:00.000Z'
});
check('sin saldo no pinta la fila de saldo', !sinSaldo.html.includes('Saldo disponible'));

/* ── Suscripción ── */
const suscripcion = plantillaDeSuscripcion({
  para: 'socia@firma.example',
  firma: 'Firma Demo',
  plan: 'PREMIUM',
  periodo: 'ANUAL',
  montoCop: 1_500_000,
  validoDesde: '2026-09-04T15:00:00.000Z',
  validoHasta: '2027-09-04T15:00:00.000Z',
  referencia: REFERENCIA
});

check('asunto de suscripción nombra el plan', suscripcion.asunto === 'Suscripción al plan Premium confirmada · Iureon', suscripcion.asunto);
check('monto de suscripción en es-CO', suscripcion.html.includes('$1.500.000 COP') && suscripcion.texto.includes('$1.500.000 COP'));
check('periodo de cobertura', suscripcion.html.includes('del 4 de septiembre de 2026 al 4 de septiembre de 2027'));
check('lo que incluye sale del catálogo', suscripcion.html.includes('Audiencias') && suscripcion.html.includes('Orientación'));
check('Esencial no promete Audiencias', !loQueIncluye('ESENCIAL').includes('Audiencias') && loQueIncluye('ESENCIAL').includes('Redacción'));
check('aviso de que no es factura DIAN', suscripcion.html.includes('No es factura electrónica de venta validada por la DIAN'));

const esencial = plantillaDeSuscripcion({
  para: 'a@b.example',
  firma: 'F',
  plan: 'ESENCIAL',
  periodo: 'MENSUAL',
  montoCop: 70_000,
  validoDesde: '2026-09-04T15:00:00.000Z',
  validoHasta: '2026-10-04T15:00:00.000Z',
  referencia: REFERENCIA
});
check('asunto Esencial', esencial.asunto === 'Suscripción al plan Esencial confirmada · Iureon');
check('precio mensual Esencial en es-CO', esencial.html.includes('$70.000 COP'));

/* ── Cuenta de cobro (PDF en Node) ── */
const pdf = generarCuentaDeCobro(
  {
    reference: REFERENCIA,
    plan: 'PREMIUM',
    period: 'ANUAL',
    amountCop: 1_500_000,
    validFrom: '2026-09-04T15:00:00.000Z',
    validUntil: '2027-09-04T15:00:00.000Z',
    userEmail: 'socia@firma.example',
    createdAt: '2026-09-04T15:00:00.000Z'
  },
  { nombre: 'Firma Demo', nit: '900123456-7', correo: 'socia@firma.example' }
);

check('el PDF no está vacío', pdf.length > 1000, `${pdf.length} bytes`);
check('el PDF empieza con %PDF', pdf.subarray(0, 4).toString('latin1') === '%PDF');
check('el PDF termina con %%EOF', pdf.toString('latin1').trimEnd().endsWith('%%EOF'));
check('número de cuenta derivado de la referencia', numeroDeCuenta(REFERENCIA).startsWith('CC-') && numeroDeCuenta(REFERENCIA).length <= 40);
check('nombre de archivo del adjunto', nombreDeArchivo(REFERENCIA) === `Cuenta-de-cobro-${numeroDeCuenta(REFERENCIA)}.pdf`);
check('el emisor del servidor es el titular', EMISOR.nit === '1102811692-8' && EMISOR.correo === 'ingdanielma@gmail.com');

/*
 * The PDF's text streams are uncompressed by default in jsPDF, so the words
 * are searchable in the raw bytes: that is how the title and the footer are
 * proven present without a PDF reader. Helvetica in jsPDF encodes text as
 * WinAnsi, and the letters used here are plain ASCII.
 */
const crudo = pdf.toString('latin1');
check('título CUENTA DE COBRO en el PDF', crudo.includes('CUENTA DE COBRO'));
check('aviso DIAN en el PDF', crudo.includes('No es factura electr'));
check('IVA no discriminado en el PDF', crudo.includes('Este documento no discrimina IVA.'));
check('cliente en el PDF', crudo.includes('Firma Demo') && crudo.includes('NIT 900123456-7'));

/* ── Envío apagado: nunca lanza ── */
const correr = async (): Promise<void> => {
  if (config.mail.enabled) {
    console.log('skip el correo está configurado en este entorno; no se prueba el camino apagado');
  } else {
    let lanzo = false;
    let resultado: { enviado: boolean; error?: string } = { enviado: true };
    try {
      resultado = await enviarCorreo({ para: 'a@b.example', asunto: 'x', html: '<p>x</p>', texto: 'x' });
    } catch {
      lanzo = true;
    }
    check('sin configuración no lanza', !lanzo);
    check('sin configuración devuelve enviado=false', resultado.enviado === false && resultado.error === 'MAIL_DISABLED');
  }

  check('enmascarar deja la inicial y el dominio', enmascarar('daniel@gmail.com') === 'd***@gmail.com');

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
};

void correr();
