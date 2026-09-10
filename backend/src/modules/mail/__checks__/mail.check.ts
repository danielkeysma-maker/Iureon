/**
 * Guarda el módulo de correo transaccional sin enviar nada.
 *
 * Se corre con: npm run check:mail
 *
 * Sin SMTP, sin red y sin cuenta de Gmail: prueba las partes puras —que las
 * plantillas digan las cifras correctas en es-CO, que los asuntos sean los
 * pactados, que la cuenta de cobro sea un PDF de verdad— y que un enviador
 * apagado se niegue en silencio en vez de lanzar hacia el webhook que lo llamó.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * LO QUE ESTE ARCHIVO EXISTE PARA IMPEDIR, escrito desde el defecto que lo
 * produjo. Las cuatro maquetas del rediseño AFIRMABAN COSAS FALSAS y el correo
 * real estuvo a punto de heredarlas:
 *
 *   · «14 días de Plan Premium completo» en la bienvenida de la prueba, cuando
 *     `trial.rules.ts` abre SIETE días de ESENCIAL con UN usuario. De ahí el
 *     bloque «las cifras salen de las constantes»: la comparación se hace
 *     contra la constante, no contra el número, para que un cambio de política
 *     rompa el check en vez de dejar el correo mintiendo.
 *   · La bienvenida de quien apenas se registró para COMPRAR no puede decir que
 *     su plan está activo: la firma nace con el plan vencido y la primera
 *     pantalla que ve es la franja de solo lectura.
 *   · La maqueta del borrado anunciaba solicitud, treinta días de plazo, firma
 *     «en solo lectura», botón para cancelar y botón para exportar.
 *     `borrarFirmaConTodo` borra DE INMEDIATO y el correo sale DESPUÉS.
 *   · Esa misma maqueta afirmaba que la auditoría «se conserva por obligación
 *     legal»: ni se conserva —`borrar_firma_completa` borra `audit_logs`— ni
 *     esta casa afirma obligaciones legales en ningún texto.
 *   · Los enlaces apuntaban a `app.iureon.co` y a rutas que no existen
 *     (`/preferencias`, `/exportar`, `/facturas`, `/datos`).
 * ══════════════════════════════════════════════════════════════════════════
 */
import {
  generarCuentaDeCobro,
  generarCuentaDeCobroDeRecarga,
  nombreDeArchivo,
  numeroDeCuenta
} from '../cuentaDeCobro.pdf';
import { EMISOR } from '../emisor';
import { enviarCorreo, plantillaDeRecarga, plantillaDeSuscripcion, enmascarar } from '../mail.service';
import {
  fechaYHora,
  plantillaDeBorrado,
  plantillaDeCambioDePlan,
  plantillaDeCancelacion,
  plantillaDeFirmaCreada
} from '../avisos.mail';
import { plantillaDeBienvenida, plantillaDeBienvenidaDeCompra } from '../../trial/trial.mail';
import { DIAS_DE_PRUEBA_GRATUITA, PLAN_DE_PRUEBA, USUARIOS_DE_PRUEBA } from '../../trial/trial.rules';
import { DIAS_DE_PRUEBA, PLANES } from '../../subscriptions/plan.catalog';
import { PRICE_COP } from '../../billing/billing.service';
import { SITIO, URL_ENTRAR, URL_MANUAL, URL_PRIVACIDAD, URL_SOPORTE, pesos } from '../plantilla';
import { loQueIncluye } from '../vocabulario';
import { config } from '../../../config/env.config';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const REFERENCIA = 'IUR-firma-demo-1725400000000-a1b2c3d4e5f6';
const INSTANTE = '2026-09-04T15:00:00.000Z';

interface Plantilla {
  asunto: string;
  html: string;
  texto: string;
}

/* ══════════════════════ Las seis plantillas ══════════════════════ */

const recarga = plantillaDeRecarga({
  para: 'socia@firma.example',
  firma: 'Firma & Asociados <Sucre>',
  montoCop: 150_000,
  referencia: REFERENCIA,
  saldoCop: 1_250_000,
  fecha: INSTANTE
});

const sinSaldo = plantillaDeRecarga({
  para: 'x@y.example',
  firma: 'F',
  montoCop: 100_000,
  referencia: REFERENCIA,
  fecha: INSTANTE
});

const suscripcion = plantillaDeSuscripcion({
  para: 'socia@firma.example',
  firma: 'Firma Demo',
  plan: 'PREMIUM',
  periodo: 'ANUAL',
  montoCop: 1_500_000,
  validoDesde: INSTANTE,
  validoHasta: '2027-09-04T15:00:00.000Z',
  referencia: REFERENCIA
});

const esencial = plantillaDeSuscripcion({
  para: 'a@b.example',
  firma: 'F',
  plan: 'ESENCIAL',
  periodo: 'MENSUAL',
  montoCop: PLANES.ESENCIAL.precioMensualCop,
  validoDesde: INSTANTE,
  validoHasta: '2026-10-04T15:00:00.000Z',
  referencia: REFERENCIA
});

const bienvenida = plantillaDeBienvenida({
  para: 'socia@firma.example',
  nombre: 'Miguel Pérez Ortega',
  firma: 'Firma & Asociados <Sucre>',
  venceEl: '2026-09-11T15:00:00.000Z'
});

const compra = plantillaDeBienvenidaDeCompra({
  para: 'socia@firma.example',
  nombre: 'Miguel Pérez Ortega',
  firma: 'Pérez & Asociados',
  plan: 'PREMIUM'
});

const firmaCreada = plantillaDeFirmaCreada({
  para: 'socia@firma.example',
  nombre: 'Miguel Pérez Ortega',
  firma: 'Pérez & Asociados',
  plan: 'PREMIUM',
  periodo: 'PRUEBA',
  validoHasta: '2026-09-18T15:00:00.000Z',
  diasDeVigencia: DIAS_DE_PRUEBA,
  maxUsuarios: PLANES.PREMIUM.maxUsuarios,
  saldoInicialCop: 0
});

const borrado = plantillaDeBorrado({
  firma: 'Firma & Asociados <Sucre>',
  fecha: INSTANTE,
  quien: 'ADMINISTRADOR',
  solicitante: 'socia@firma.example',
  tablas: [
    { tabla: 'legal_documents', filas: 42 },
    { tabla: 'saved_drafts', filas: 7 },
    { tabla: 'clients', filas: 0 },
    { tabla: 'tabla_que_nadie_tradujo', filas: 3 }
  ],
  usuariosEliminados: 2,
  advertencias: []
});

const borradoPorOperador = plantillaDeBorrado({
  firma: 'F',
  fecha: INSTANTE,
  quien: 'OPERADOR',
  solicitante: 'operacion@iureon.example',
  tablas: [],
  usuariosEliminados: 0,
  advertencias: ['Archivo en B2 no borrado: firma/x.pdf']
});

const cambio = plantillaDeCambioDePlan({
  firma: 'Firma Demo',
  plan: 'PREMIUM',
  periodo: 'MENSUAL',
  // 23:59 del 4 de octubre en Bogotá, tal como lo manda el navegador del operador.
  validoHasta: '2026-10-05T04:59:59.000Z',
  desde: INSTANTE
});

const cortesia = plantillaDeCambioDePlan({
  firma: 'Firma Demo',
  plan: 'ESENCIAL',
  periodo: 'CORTESIA',
  validoHasta: null,
  desde: INSTANTE
});

const cancelacion = plantillaDeCancelacion({
  firma: 'Firma Demo',
  plan: 'PREMIUM',
  periodo: 'MENSUAL',
  finDelPlan: INSTANTE
});

/** Todo lo que sale de esta plataforma hacia la bandeja de una firma. */
const TODOS: ReadonlyArray<Plantilla> = [
  recarga,
  sinSaldo,
  suscripcion,
  esencial,
  bienvenida,
  compra,
  firmaCreada,
  borrado,
  borradoPorOperador,
  cambio,
  cortesia,
  cancelacion
];

/* ══════════════════════ 1. La pieza común ══════════════════════ */

/*
 * EL ESQUELETO ES UNO SOLO Y SE COMPRUEBA EN LOS DOCE. Cuatro copias del mismo
 * HTML divergen a la primera corrección; estas aserciones son lo que hace
 * imposible que un correo nazca con otro marco sin que nadie lo note.
 */
check('todos declaran DOCTYPE', TODOS.every((p) => p.html.startsWith('<!DOCTYPE html>')));
check('todos maquetan con tablas de presentación', TODOS.every((p) => p.html.includes('role="presentation"')));
check('todos miden 600 px con max-width', TODOS.every((p) => p.html.includes('width:600px;max-width:600px')));
check('todos fijan el interlineado para Outlook', TODOS.every((p) => p.html.includes('mso-line-height-rule:exactly')));
check('todos traen el condicional de PPP de Outlook', TODOS.every((p) => p.html.includes('<!--[if mso]>')));
check('todos traen la media query de 600 px', TODOS.every((p) => p.html.includes('@media only screen and (max-width:600px)')));
/*
 * UNA SOLA IMAGEN, Y QUE EL CORREO SE SOSTENGA SIN ELLA.
 *
 * Antes la regla era «ninguna imagen», y era buena por un motivo concreto: la
 * mayoría de los clientes las bloquean hasta que el destinatario las pide, así
 * que un correo hecho de imágenes llega vacío en la primera impresión, que es
 * la que cuenta. El titular pidió el logotipo el 9 de septiembre de 2026 y la
 * regla se ESTRECHA en vez de levantarse: cabe exactamente una, la del
 * logotipo, y el nombre «Iureon» sigue escrito como TEXTO a su lado — con la
 * imagen bloqueada, la cabecera se ve como se veía antes de tenerla.
 */
const IMAGENES = (html: string): string[] => html.match(/<img\b[^>]*>/gi) ?? [];
check('cada correo trae como mucho una imagen', TODOS.every((p) => IMAGENES(p.html).length <= 1));
check('y la única que cabe es el logotipo', TODOS.every((p) => IMAGENES(p.html).every((i) => i.includes('/brand/logo-correo.png'))));
check('el logotipo declara ancho y alto, para que su hueco no descuadre la cabecera', TODOS.every((p) => IMAGENES(p.html).every((i) => /\bwidth="\d+"/.test(i) && /\bheight="\d+"/.test(i))));
check('y lleva alt vacío, porque el nombre ya está escrito al lado', TODOS.every((p) => IMAGENES(p.html).every((i) => /\balt=""/.test(i))));
check('el nombre sigue siendo texto, no la imagen', TODOS.every((p) => /<span[^>]*>Iureon<\/span>/.test(p.html) && p.texto.includes('Iureon')));
check('ninguno usa JavaScript', TODOS.every((p) => !/<script\b/i.test(p.html) && !/\son[a-z]+\s*=/i.test(p.html)));
check('todos llevan la tipografía de marca con caída a system fonts', TODOS.every((p) => p.html.includes("'Plus Jakarta Sans', -apple-system")));
check('fondo crema, tarjeta, marino y oro', TODOS.every((p) => ['#EDE9DF', '#FCFBF7', '#14294A', '#C8A046'].every((c) => p.html.includes(c))));
check('todos traen la cabecera con el rótulo numerado', TODOS.every((p) => /Iureon<\/span><\/td>[\s\S]{0,400}&mdash;&nbsp;/.test(p.html)));
check('todos traen la línea oculta de adelanto', TODOS.every((p) => p.html.includes('mso-hide:all;font-size:1px')));
/*
 * LA CIUDAD, NO LA CALLE. El titular retiró la dirección física el 9 de
 * septiembre de 2026. Se asevera que la ciudad SIGUE —un transaccional sin
 * procedencia se lee como sospechoso— y que la calle no vuelve por descuido.
 */
check('todos traen la ciudad en el pie', TODOS.every((p) => p.html.includes('Sincelejo, Sucre, Colombia') && p.texto.includes('Sincelejo, Sucre, Colombia')));
check('y ninguno publica la direccion fisica', TODOS.every((p) => !/Calle\s+20|oficina\s+302/i.test(p.html) && !/Calle\s+20|oficina\s+302/i.test(p.texto)));

/*
 * LA LETRA MENUDA DE FACTURACIÓN VA DONDE HAY UN PRECIO. La maqueta la repetía
 * en los cuatro correos, incluido el del borrado: hablarle de IVA a quien acaba
 * de perder sus datos es ruido en el peor momento posible.
 */
const IVA = 'Los precios incluyen IVA';
check('los correos con dinero llevan la letra de facturación', [recarga, suscripcion, esencial, compra].every((p) => p.html.includes(IVA)));
check('la constancia de borrado NO habla de precios ni de IVA', !borrado.html.includes(IVA) && !borrado.texto.includes(IVA) && !/\$\d/.test(borrado.html));
check('la cancelación no habla de IVA', !cancelacion.html.includes(IVA));

/* Texto plano de verdad: sin etiquetas y sin escapes de HTML sueltos. */
const SIN_ETIQUETAS = /<\/?(p|br|table|tr|td|ul|li|strong|span|div|h1|a|doctype)\b/i;
check(
  'todos llevan texto plano y dice algo',
  TODOS.every((p) => p.texto.trim().length > 250 && !SIN_ETIQUETAS.test(p.texto) && !/&(amp|lt|gt|quot|nbsp|mdash);/.test(p.texto))
);
check('todos llevan asunto', TODOS.every((p) => p.asunto.trim().length > 10));

/* ══════════════════════ 2. Los enlaces existen ══════════════════════ */

/*
 * NINGÚN ENLACE INVENTADO. Las maquetas enlazaban `app.iureon.co/entrar`,
 * `iureon.co/manual`, `iureon.co/datos`, `iureon.co/preferencias`,
 * `app.iureon.co/plan`, `app.iureon.co/saldo`, `app.iureon.co/facturas`,
 * `app.iureon.co/eliminacion`, `app.iureon.co/exportar` y un WhatsApp con
 * número de marcador. NINGUNA de esas rutas existe: la aplicación es una sola
 * página que navega con `?ir=<vista>` sobre un dominio distinto. Un enlace roto
 * en un correo de facturación es peor que no tenerlo, así que la lista blanca
 * es exacta y se compara contra ella, no contra un patrón.
 */
const PERMITIDOS = new Set([URL_ENTRAR, URL_MANUAL, URL_SOPORTE, URL_PRIVACIDAD]);
const hrefs = (html: string): string[] =>
  [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith('https://fonts.googleapis.com'));

const enlacesMalos = TODOS.flatMap((p) => hrefs(p.html).filter((u) => !PERMITIDOS.has(u)));
check('todo enlace apunta a una pantalla que existe', enlacesMalos.length === 0, enlacesMalos.slice(0, 4).join(' · '));
check('el dominio es iureoncolombia.com', SITIO === 'https://www.iureoncolombia.com');
check(
  'ningún correo nombra el dominio de la maqueta',
  TODOS.every((p) => !/app\.iureon\.co|iureon\.co\//.test(p.html) && !/app\.iureon\.co|iureon\.co\//.test(p.texto))
);
check(
  'ningún correo enlaza un WhatsApp de marcador',
  TODOS.every((p) => !/wa\.me|573000000000/.test(p.html) && !/wa\.me|573000000000/.test(p.texto))
);
check(
  'ningún correo promete unas preferencias de aviso que no existen',
  TODOS.every((p) => !/preferencias de aviso/i.test(p.html) && !/preferencias de aviso/i.test(p.texto))
);
/* Los enlaces del texto plano son los mismos: si uno se olvida, se rompe aquí. */
check(
  'el texto plano trae los tres enlaces del pie',
  TODOS.every((p) => p.texto.includes(URL_MANUAL) && p.texto.includes(URL_SOPORTE) && p.texto.includes(URL_PRIVACIDAD))
);

/* ══════════════════════ 3. Ningún correo cita una norma ══════════════════════ */

/*
 * NI UNA CITA LEGAL NI UNA OBLIGACIÓN AFIRMADA, EN NINGUNO DE LOS DOCE.
 * La maqueta del borrado decía que la auditoría «se conserva por obligación
 * legal». Aquí no se cita derecho: en el momento en que un correo dijera
 * «conforme al artículo tal» estaría prometiendo un respaldo que este
 * repositorio no verifica, que es exactamente lo que la doctrina de
 * verificación prohíbe. Y esa auditoría ni siquiera se conserva.
 */
const FORMA_DE_CITA =
  /\bart(?:í|i)culo\s+\d|\bart\.\s*\d|\bley\s+\d|\bdecreto\s+\d|\bsentencia\s+[CTS]U?-\d|c(?:ó|o)digo\s+(?:civil|penal|general|sustantivo)/i;
const FORMA_DE_DEBER = /obligaci(?:ó|o)n legal|por mandato de la ley|exigencia legal|habeas data|conforme a la ley/i;

for (const p of TODOS) {
  check(
    `sin forma de cita legal · ${p.asunto}`,
    !FORMA_DE_CITA.test(p.html) && !FORMA_DE_CITA.test(p.texto) && !FORMA_DE_DEBER.test(p.texto)
  );
}

/* ══════════════════════ 4. Bienvenida con prueba: de las constantes ══════════════════════ */

/*
 * LAS CIFRAS SE COMPARAN CONTRA LA CONSTANTE, NO CONTRA EL NÚMERO. Escribir
 * aquí `'7 días'` reproduciría el defecto que se está corrigiendo: bajar la
 * prueba a cinco días dejaría el correo prometiendo siete y el check en verde.
 */
const DIAS = `${DIAS_DE_PRUEBA_GRATUITA} días`;
const PLAN_PRUEBA = PLANES[PLAN_DE_PRUEBA];

check('la bienvenida dice los días de la constante', bienvenida.html.includes(DIAS) && bienvenida.texto.includes(DIAS));
check('el asunto de la bienvenida trae los mismos días', bienvenida.asunto.includes(DIAS), bienvenida.asunto);
check(
  'la bienvenida nombra el plan de prueba del código',
  bienvenida.html.includes(`Plan ${PLAN_PRUEBA.nombre}`) && bienvenida.texto.includes(PLAN_PRUEBA.nombre)
);
/*
 * Y NO NOMBRA NINGÚN OTRO PLAN NI NINGÚN OTRO NÚMERO DE DÍAS. Se comparan los
 * candidatos contra la constante en tiempo de ejecución en vez de escribir
 * «Premium» o «14» a mano: si mañana la prueba pasa a ser de Premium, este
 * check acompaña el cambio en vez de estorbarlo, pero sigue prohibiendo que en
 * el mismo correo convivan dos planes o dos plazos.
 */
const NOMBRES_DE_PLAN = (['ESENCIAL', 'PREMIUM', 'FIRMA'] as const).filter((p) => p !== PLAN_DE_PRUEBA);
check(
  'la bienvenida no nombra otro plan que el de la prueba',
  NOMBRES_DE_PLAN.every(
    (p) => !bienvenida.html.includes(`Plan ${PLANES[p].nombre}`) && !bienvenida.html.includes(`plan ${PLANES[p].nombre}`)
  ),
  'la maqueta prometía «Plan Premium completo»'
);
check(
  'la bienvenida no promete un plazo distinto del de la constante',
  [5, 7, 14, 15, 30].filter((n) => n !== DIAS_DE_PRUEBA_GRATUITA).every((n) => !bienvenida.html.includes(`${n} días`)),
  'la maqueta prometía 14 días'
);
check(
  'la bienvenida dice el cupo de usuarios de la constante',
  USUARIOS_DE_PRUEBA === 1 ? bienvenida.html.includes('1 usuario') : bienvenida.html.includes(`hasta ${USUARIOS_DE_PRUEBA} usuarios`)
);
check(
  'la bienvenida solo ofrece módulos del plan de prueba',
  PLAN_PRUEBA.modulos.every((m) => m !== 'ORIENTACION') && !/Orientación/.test(bienvenida.html),
  'la maqueta invitaba a «empezar por Redacción u Orientación», que Esencial no tiene'
);
check('la bienvenida dice cuándo vence, en Bogotá', bienvenida.html.includes('11 de septiembre de 2026'));
check('la bienvenida dice que el saldo empieza aparte', /saldo/i.test(bienvenida.html) && bienvenida.html.includes('$100.000'));
check('la bienvenida escapa el nombre de la firma', bienvenida.html.includes('Firma &amp; Asociados &lt;Sucre&gt;') && !bienvenida.html.includes('<Sucre>'));

/* ══════════════════════ 5. Bienvenida de compra: el plan NO está activo ══════════════════════ */

/*
 * `trial.rules.ts` crea la firma de una COMPRA con `plan_valid_until = ahora`,
 * es decir NACIDA VENCIDA. La primera pantalla que esa persona ve es la franja
 * roja de solo lectura; un correo que la felicitara por «su plan activo» la
 * contradiría antes de que abriera la aplicación.
 */
const AFIRMA_ACTIVO = /(plan|premium|esencial|firma)[^.]{0,40}(est[áa] activ|qued[óo] activ|activad)/i;
/*
 * La negación se retira ANTES de buscar la afirmación. Sin esto, la frase
 * honesta —«el plan Premium todavía no está activo»— dispararía el mismo patrón
 * que la mentira que se persigue, y el check pediría borrar justo la línea que
 * dice la verdad.
 */
const sinNegacion = (t: string): string => t.replace(/(todav[íi]a )?no est[áa] activ\w*/gi, '');
check(
  'el correo de compra NO afirma que el plan está activo',
  !AFIRMA_ACTIVO.test(sinNegacion(compra.html)) && !AFIRMA_ACTIVO.test(sinNegacion(compra.texto))
);
check('el correo de compra dice que todavía no lo está', compra.html.includes('todavía no está activo') && compra.texto.includes('todavía no está activo'));
check('el correo de compra dice qué falta', /confirme el primer pago|a la espera del primer pago/i.test(compra.html));
check('el correo de compra dice que abre en solo lectura', compra.html.includes('solo lectura'));
check(
  'el precio de la compra sale del catálogo',
  compra.html.includes(pesos(PLANES.PREMIUM.precioMensualCop)) && compra.html.includes(pesos(PLANES.PREMIUM.precioAnualCop))
);
check('el asunto de la compra no celebra un plan activo', !AFIRMA_ACTIVO.test(compra.asunto), compra.asunto);

/* La confirmación de un plan YA PAGADO sí puede decirlo, y ahí está la diferencia. */
check('la suscripción pagada sí dice que está activo', suscripcion.html.includes('está activo'));

/* ══════════════════════ 6. Firma creada por el operador ══════════════════════ */

check('la bienvenida del operador existe y tiene asunto propio', firmaCreada.asunto === 'Su firma ya está creada en Iureon · Pérez & Asociados', firmaCreada.asunto);
check('dice quién creó la firma', firmaCreada.html.includes('operador de Iureon creó'));
check('dice que la persona quedó como socio administrador', firmaCreada.html.includes('socio administrador'));
check('el dato grande sale de los días que se escribieron', firmaCreada.html.includes(`${DIAS_DE_PRUEBA} días`));
check('dice hasta cuándo, en Bogotá', firmaCreada.html.includes('18 de septiembre de 2026') && firmaCreada.texto.includes('18 de septiembre de 2026'));
check('dice con qué plan queda', firmaCreada.html.includes(PLANES.PREMIUM.nombre) && firmaCreada.html.includes('hasta 5 usuarios'));
check('NO trae la contraseña ni la promete en el mensaje', /este correo no la trae/.test(firmaCreada.html) && !/contrase(ñ|n)a[:=]\s*\S/i.test(firmaCreada.texto));
check('sin nombre del socio no inventa uno', (() => {
  const anonimo = plantillaDeFirmaCreada({
    para: 'x@y.example',
    nombre: null,
    firma: 'Firma Sin Nombre',
    plan: 'ESENCIAL',
    periodo: 'CORTESIA',
    validoHasta: '2027-01-01T05:00:00.000Z',
    diasDeVigencia: 0,
    maxUsuarios: 1,
    saldoInicialCop: 0
  });
  return !anonimo.html.includes('Socio administrador') && anonimo.html.includes('El operador de Iureon creó');
})());
check('una cortesía sin días no finge una prueba', (() => {
  const cortesiaAlta = plantillaDeFirmaCreada({
    para: 'x@y.example',
    nombre: 'Ana Ruiz',
    firma: 'F',
    plan: 'FIRMA',
    periodo: 'CORTESIA',
    validoHasta: '2027-01-01T05:00:00.000Z',
    diasDeVigencia: 0,
    maxUsuarios: PLANES.FIRMA.maxUsuarios,
    saldoInicialCop: 20_000
  });
  return !cortesiaAlta.html.includes('PRUEBA INCLUIDA') && cortesiaAlta.html.includes('PLAN VIGENTE HASTA') && cortesiaAlta.html.includes(pesos(20_000));
})());

/* ══════════════════════ 7. Recarga ══════════════════════ */

check('asunto de recarga', recarga.asunto === 'Recarga de saldo confirmada · Iureon', recarga.asunto);
check('monto de recarga en es-CO', recarga.html.includes('$150.000') && recarga.texto.includes('$150.000'));
check('saldo resultante como dato grande', recarga.html.includes('SALDO DISPONIBLE') && recarga.html.includes('$1.250.000'));
check('referencia Wompi en el cuerpo', recarga.html.includes(REFERENCIA) && recarga.texto.includes(REFERENCIA));
check('nombre de firma escapado', recarga.html.includes('Firma &amp; Asociados &lt;Sucre&gt;') && !recarga.html.includes('<Sucre>'));
check('remite al extracto en la app', recarga.html.includes('Saldo › Extracto'));
check('fecha y hora en zona de Bogotá', recarga.html.includes('4 de septiembre de 2026 a las') && recarga.html.includes('hora de Colombia'));
check('sin saldo legible no inventa uno', !sinSaldo.html.includes('SALDO DISPONIBLE') && sinSaldo.html.includes('RECARGA ACREDITADA'));
check('el correo de recarga anuncia el adjunto', recarga.html.includes('cuenta de cobro en PDF') && recarga.texto.includes('cuenta de cobro en PDF'));
check('la recarga lleva a la aplicación, no a una ruta inventada', recarga.html.includes(URL_ENTRAR) && !recarga.html.includes('/saldo'));

/*
 * LOS PRECIOS SALEN DE `PRICE_COP`, Y SE DICEN COMO PISO. `priceFor` cobra
 * `max(piso, costo medido)`: anunciar el piso como precio fijo prometería un
 * cobro que el sistema no hace.
 */
check('el precio del borrador sale del código', recarga.html.includes(pesos(PRICE_COP.BORRADOR)) && PRICE_COP.BORRADOR === 2000);
check('el precio de la revisión sale del código', recarga.html.includes(pesos(PRICE_COP.REVISION)) && PRICE_COP.REVISION === 2000);
check('el precio de la consulta sale del código', recarga.html.includes(pesos(PRICE_COP.CONSULTA_REVISION)) && PRICE_COP.CONSULTA_REVISION === 300);
check('los precios se anuncian como piso, no como tarifa fija', recarga.html.includes(`desde ${pesos(PRICE_COP.BORRADOR)}`) && recarga.html.includes('cuesta más'));
check('no publica un precio para lo que no se cobra', !/transcrip\w+:\s*\$/i.test(recarga.html) && PRICE_COP.TRANSCRIPCION === 0);
check(
  'el tope de escritos es un máximo derivado, no una previsión',
  recarga.html.includes(`hasta ${Math.floor(1_250_000 / PRICE_COP.BORRADOR).toLocaleString('es-CO')} escritos`) &&
    recarga.html.includes('es un máximo')
);
check('sin saldo legible no calcula cuántos escritos alcanzan', !/hasta [\d.]+ escritos/.test(sinSaldo.html));

/* ══════════════════════ 8. Suscripción pagada ══════════════════════ */

check('asunto de suscripción nombra el plan', suscripcion.asunto === 'Suscripción al plan Premium confirmada · Iureon', suscripcion.asunto);
check('monto de suscripción en es-CO', suscripcion.html.includes('$1.500.000') && suscripcion.texto.includes('$1.500.000'));
check('periodo de cobertura', suscripcion.html.includes('del 4 de septiembre de 2026 al 4 de septiembre de 2027'));
check('el precio de lista sale del catálogo', suscripcion.html.includes(pesos(PLANES.PREMIUM.precioAnualCop)));
check('lo que queda habilitado sale del catálogo', suscripcion.html.includes('Audiencias') && suscripcion.html.includes('Orientación'));
check(
  'Esencial no promete los módulos que no tiene',
  !esencial.html.includes('Audiencias') && !esencial.html.includes('Entrevistas') && !esencial.html.includes('Orientación') && esencial.html.includes('Redacción'),
  'la maqueta prometía los tres en un correo que también confirma un Esencial'
);
check('loQueIncluye lee el catálogo', loQueIncluye('ESENCIAL').includes('1 usuario') && !loQueIncluye('ESENCIAL').includes('Audiencias'));
check('asunto Esencial', esencial.asunto === 'Suscripción al plan Esencial confirmada · Iureon');
check('precio mensual Esencial en es-CO', esencial.html.includes(pesos(PLANES.ESENCIAL.precioMensualCop)) && PLANES.ESENCIAL.precioMensualCop === 85_000);
check('aviso de que no es factura DIAN', suscripcion.html.includes('No es factura electrónica de venta validada por la DIAN'));
check('dice que el periodo se suma y no se pierde', suscripcion.html.includes('se conservan'));

/* ══════════════════════ 9. Constancia de borrado ══════════════════════ */

check('asunto de la constancia', borrado.asunto === 'Constancia de borrado de datos · Iureon', borrado.asunto);
check('la constancia dice la fecha Y la hora', borrado.html.includes('4 de septiembre de 2026 a las') && borrado.html.includes('hora de Colombia'));
check('la hora se calcula en Bogotá, no en UTC', fechaYHora('2026-09-04T02:00:00.000Z').includes('3 de septiembre de 2026'));
check('la constancia nombra lo que se borró', borrado.html.includes('Documentos cargados: 42') && borrado.texto.includes('Borradores guardados: 7'));
check('una tabla sin filas no se lista', !borrado.html.includes('Clientes y sus expedientes'));
check('una tabla sin traducir se nombra igual', borrado.html.includes('tabla_que_nadie_tradujo: 3'));
check('la constancia cuenta las cuentas eliminadas', borrado.html.includes('Cuentas de usuario eliminadas'));
check('la constancia dice que no queda copia', borrado.html.includes('no queda copia de lo borrado'));
check('el borrado por el administrador lo dice', borrado.html.includes('socio administrador'));
check('el borrado por el operador lo dice', borradoPorOperador.html.includes('operación de Iureon'));
check('sin tablas se dice, no se calla', borradoPorOperador.html.includes('No quedaban registros almacenados'));
check('las advertencias se publican', borradoPorOperador.html.includes('LO QUE QUEDÓ PENDIENTE') && borradoPorOperador.texto.includes('firma/x.pdf'));
check('nombre de firma escapado en la constancia', borrado.html.includes('Firma &amp; Asociados &lt;Sucre&gt;'));

/*
 * LO QUE LA MAQUETA 4 PROMETÍA Y EL SISTEMA NO HACE. `borrarFirmaConTodo`
 * borra de inmediato y el correo sale DESPUÉS: cuando llega no hay plazo que
 * correr, ni firma en solo lectura, ni nada que cancelar, ni nada que exportar.
 */
const PROMESA_DE_PLAZO = /30 d[ií]as|treinta d[ií]as|hasta esa fecha|antes de que sea irreversible|queda programad|puede volver/i;
const PROMESA_DE_CANCELAR = /cancelar la eliminaci[óo]n|cancele la solicitud|puede cancelar|cancelarla/i;
const PROMESA_DE_EXPORTAR = /exportar mis escritos|puede exportar|podr[áa] exportar/i;
/*
 * «Solo lectura» se persigue COMO PROMESA, no como palabra. La constancia sí
 * puede —y debe— decir que NO hubo periodo de solo lectura; lo que no puede es
 * afirmar que la firma quedó en ese estado, que es lo que decía la maqueta.
 */
const PROMESA_DE_SOLO_LECTURA = /(queda|pasa|permanece)[^.]{0,20}en solo lectura/i;

for (const p of [borrado, borradoPorOperador]) {
  check(`la constancia no promete un plazo · ${p.asunto}`, !PROMESA_DE_PLAZO.test(p.html) && !PROMESA_DE_PLAZO.test(p.texto));
  check(`la constancia no ofrece cancelar · ${p.asunto}`, !PROMESA_DE_CANCELAR.test(p.html) && !PROMESA_DE_CANCELAR.test(p.texto));
  check(`la constancia no ofrece exportar · ${p.asunto}`, !PROMESA_DE_EXPORTAR.test(p.html) && !PROMESA_DE_EXPORTAR.test(p.texto));
  check(`la constancia no deja la firma en solo lectura · ${p.asunto}`, !PROMESA_DE_SOLO_LECTURA.test(p.html));
  check(`la constancia no lleva botón a ninguna parte · ${p.asunto}`, !p.html.includes('border-radius:999px'));
}
check('la constancia niega expresamente el periodo de solo lectura', borrado.html.includes('ni periodo de solo lectura'));
check('la constancia dice que ya se ejecutó', borrado.html.includes('El borrado ya se ejecutó') && borrado.html.includes('no se puede deshacer'));
check('la constancia dice que la auditoría también se borró', /registro de auditor[íi]a de la firma se borraron/.test(borrado.html));
check(
  'la constancia NO afirma que la auditoría se conserva',
  !/auditor[íi]a[^.]{0,60}se conserva/i.test(borrado.html) && !/queda el registro de auditor/i.test(borrado.html)
);
check('la constancia dice qué sí se conserva, sin invocar norma', borrado.html.includes('límite de pruebas gratuitas por dirección'));
check('la constancia explica el audio con la verdad', borrado.html.includes('se borra en el mismo momento de transcribirse'));

/* ══════════════════════ 10. Plan cambiado y plan cancelado ══════════════════════ */

check('asunto del cambio de plan nombra el plan', cambio.asunto === 'Su plan en Iureon fue actualizado · Premium', cambio.asunto);
check('el cambio dice desde cuándo', cambio.html.includes('4 de septiembre de 2026'));
check('el vencimiento no se corre un día', cambio.html.includes('4 de octubre de 2026') && !cambio.html.includes('5 de octubre de 2026'));
check('el cambio aclara que no se cobró por la pasarela', cambio.html.includes('no se cobró por la pasarela'));
check('el cambio tiene texto plano', cambio.texto.includes('Vigente hasta: 4 de octubre de 2026'));
check('una cortesía sin fecha lo dice', cortesia.html.includes('Sin fecha de vencimiento') && cortesia.html.includes('no caduca'));

check('asunto de la cancelación', cancelacion.asunto === 'Su plan en Iureon quedó cancelado · Iureon', cancelacion.asunto);
check('la cancelación dice hasta cuándo hay plan', cancelacion.html.includes('4 de septiembre de 2026'));
check('la cancelación dice que nada se borra', cancelacion.html.includes('Nada se borra'));
check('la cancelación dice que el saldo no se pierde', cancelacion.html.includes('no se pierde ni se descuenta'));
check('la cancelación dice que no hay renovación automática', cancelacion.html.includes('No hay renovación automática'));
check('la cancelación separa el borrado de datos', cancelacion.html.includes('operación aparte'));
check('la cancelación no promete un plazo de gracia al borrar', cancelacion.html.includes('se ejecuta de inmediato'));
check('la cancelación tiene texto plano', cancelacion.texto.includes('Con plan hasta: 4 de septiembre de 2026'));

/* ══════════════════════ 11. Cuenta de cobro (PDF en Node) ══════════════════════ */

const pdf = generarCuentaDeCobro(
  {
    reference: REFERENCIA,
    plan: 'PREMIUM',
    period: 'ANUAL',
    amountCop: 1_500_000,
    validFrom: INSTANTE,
    validUntil: '2027-09-04T15:00:00.000Z',
    userEmail: 'socia@firma.example',
    createdAt: INSTANTE
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
 * Los flujos de texto del PDF salen sin comprimir en jsPDF, así que las
 * palabras son buscables en los bytes crudos: así se prueba que el título y el
 * pie están, sin un lector de PDF.
 */
const crudo = pdf.toString('latin1');
check('título CUENTA DE COBRO en el PDF', crudo.includes('CUENTA DE COBRO'));
check('aviso DIAN en el PDF', crudo.includes('No es factura electr'));
check('IVA no discriminado en el PDF', crudo.includes('Este documento no discrimina IVA.'));
check('cliente en el PDF', crudo.includes('Firma Demo') && crudo.includes('NIT 900123456-7'));

const pdfRecarga = generarCuentaDeCobroDeRecarga(
  { reference: REFERENCIA, amountCop: 150_000, userEmail: 'socia@firma.example', createdAt: INSTANTE },
  { nombre: 'Firma Demo', nit: '900123456-7', correo: 'socia@firma.example' }
);
const crudoRecarga = pdfRecarga.toString('latin1');

check('el PDF de la recarga es un PDF', pdfRecarga.subarray(0, 4).toString('latin1') === '%PDF' && pdfRecarga.length > 1000);
check('la recarga se titula CUENTA DE COBRO', crudoRecarga.includes('CUENTA DE COBRO'));
check('el concepto de la recarga habla de saldo', crudoRecarga.includes('Recarga de saldo'));
check('la recarga NO inventa un periodo cubierto', !crudoRecarga.includes('Periodo cubierto'));
check('la recarga no nombra un plan', !/Plan (Esencial|Premium|Firma)/.test(crudoRecarga));
check('el aviso DIAN sigue en la recarga', crudoRecarga.includes('No es factura electr'));
check('la suscripción conserva su periodo cubierto', crudo.includes('Periodo cubierto'));

/* ══════════════════════ 12. Envío apagado: nunca lanza ══════════════════════ */

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
