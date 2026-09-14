/**
 * LA RECUPERACIÓN DE CONTRASEÑA POR CORREO, SIN RED, SIN BASE Y SIN CORREO.
 *
 * Se corre con: npm run check:recuperacion
 *
 * Prueba las reglas puras (`recuperacion.rules.ts`), la plantilla del correo y,
 * leyendo el código fuente, las garantías que no se pueden ejercitar sin
 * Supabase: que la solicitud responda neutral en todo lo que depende de la
 * cuenta, que el registro nunca lleve el correo, y que tras guardar la
 * contraseña se cierren todas las sesiones y se olvide la memoria de 60 s.
 *
 * Una lectura de código fuente no prueba que el código funcione; prueba que la
 * forma que lo hace seguro sigue en su sitio. Cada búsqueda es de texto plano
 * (`includes`/`indexOf`) o una expresión literal: una regex escrita dentro de
 * un string ya se rompió una vez en esta casa y pasó en verde sin encontrar
 * nada.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as R from '../recuperacion.rules';
import { MIN_CONTRASENA as MIN_DEL_REGISTRO } from '../../trial/trial.rules';
import { plantillaDeRecuperacion } from '../../mail/recuperacion.mail';
import { DIRECCION, SITIO } from '../../mail/plantilla';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos += 1;
};

const SRC = join(__dirname, '..', '..', '..');
const leer = (...partes: string[]): string => readFileSync(join(SRC, ...partes), 'utf8');

/** El texto entre dos marcas, para no confundir una función con la de al lado. */
const tramo = (texto: string, desde: string, hasta: string): string => {
  const i = texto.indexOf(desde);
  if (i === -1) return '';
  const j = texto.indexOf(hasta, i + desde.length);
  return j === -1 ? texto.slice(i) : texto.slice(i, j);
};

/* ─── 1. EL LÍMITE ─────────────────────────────────────────────────────── */

check('tres solicitudes previas del mismo correo cierran la cuarta', R.decidirLimite({ porCorreo: 3, porIp: 0 }) === 'LIMITE_CORREO');
check('dos solicitudes previas del correo dejan pasar la tercera', R.decidirLimite({ porCorreo: 2, porIp: 0 }) === 'PERMITIDO');
check('diez previas desde la IP cierran la undécima', R.decidirLimite({ porCorreo: 0, porIp: 10 }) === 'LIMITE_IP');
check('nueve previas desde la IP dejan pasar', R.decidirLimite({ porCorreo: 0, porIp: 9 }) === 'PERMITIDO');
check(
  'la IP se decide primero: su 429 no habla de ningún correo',
  R.decidirLimite({ porCorreo: 5, porIp: 10 }) === 'LIMITE_IP'
);
check(
  'ventanas: 3 por correo cada 30 min, 10 por IP cada hora',
  R.MAX_SOLICITUDES_POR_CORREO === 3 &&
    R.VENTANA_POR_CORREO_MS === 30 * 60 * 1000 &&
    R.MAX_SOLICITUDES_POR_IP === 10 &&
    R.VENTANA_POR_IP_MS === 60 * 60 * 1000
);

/* ─── 2. HUELLAS, NUNCA EL DATO ────────────────────────────────────────── */

const LLAVE = 'llave-de-prueba-no-es-ninguna-real';
const h1 = R.huella('camila@firma.co', LLAVE, 'correo');
check('la huella es estable', h1 === R.huella('camila@firma.co', LLAVE, 'correo'));
check('la huella no contiene el correo', !h1.includes('camila') && !h1.includes('firma.co'));
check('otra llave, otra huella: un SHA-256 a secas se revertiría con una lista', h1 !== R.huella('camila@firma.co', 'otra', 'correo'));
check('correo e IP no comparten espacio de huellas', R.huella('x', LLAVE, 'correo') !== R.huella('x', LLAVE, 'ip'));
check('la huella corta tiene 12 caracteres', R.huellaCorta(h1).length === 12);
check('el correo se normaliza antes de la huella', R.correoNormalizado('  Camila@Firma.CO ') === 'camila@firma.co');
check('un correo sin arroba no es correo', R.correoNormalizado('camila') === null && R.correoNormalizado(42) === null);

/* ─── 3. A DÓNDE LLEVA EL ENLACE ───────────────────────────────────────── */

const prod = { desarrollo: false };
check('el sitio oficial es el primero de la lista', R.ORIGENES_PERMITIDOS[0] === SITIO && SITIO === 'https://www.iureoncolombia.com');
check('vuelve al dominio sin www si de ahí se pidió', R.baseDelEnlace('https://iureoncolombia.com', prod) === 'https://iureoncolombia.com');
check('vuelve a iureon-app.vercel.app si de ahí se pidió', R.baseDelEnlace('https://iureon-app.vercel.app/', prod) === 'https://iureon-app.vercel.app');
check('un origen ajeno cae al sitio oficial', R.baseDelEnlace('https://evil.example', prod) === SITIO);
check('un origen que solo EMPIEZA como el oficial cae al oficial', R.baseDelEnlace('https://www.iureoncolombia.com.evil.example', prod) === SITIO);
check('sin origen, el sitio oficial', R.baseDelEnlace(undefined, prod) === SITIO);
check('localhost no se acepta en producción', R.baseDelEnlace('http://localhost:5173', prod) === SITIO);
check('localhost sí en desarrollo', R.baseDelEnlace('http://localhost:5173', { desarrollo: true }) === 'http://localhost:5173');

const enlace = R.enlaceDeRestablecimiento(SITIO, 'abc123');
const urlDelEnlace = new URL(enlace);
check('el enlace lleva ?restablecer=1', urlDelEnlace.searchParams.get('restablecer') === '1');
check('el token NO va en la consulta (viajaría al servidor y a los registros)', !urlDelEnlace.search.includes('abc123'));
check('el token va en el fragmento', urlDelEnlace.hash === '#token_hash=abc123');

/* ─── 4. TIEMPO Y CONTRASEÑA ───────────────────────────────────────────── */

check('espera lo que falta hasta el piso', R.esperaRestante(1000, 1500) === R.PISO_DE_RESPUESTA_MS - 500);
check('pasado el piso no espera', R.esperaRestante(0, R.PISO_DE_RESPUESTA_MS + 1) === 0);

check('la regla de la contraseña ES la del registro público', R.MIN_CONTRASENA === MIN_DEL_REGISTRO);
check('un carácter menos que el registro no sirve', !R.validarContrasenaNueva('x'.repeat(MIN_DEL_REGISTRO - 1)).ok);
check('la longitud del registro sirve', R.validarContrasenaNueva('x'.repeat(MIN_DEL_REGISTRO)).ok);
check('algo que no es texto no sirve', !R.validarContrasenaNueva(undefined).ok);
const reglas = leer('modules', 'auth', 'recuperacion.rules.ts');
check('la cifra se importa del registro, no se copia', reglas.includes("from '../trial/trial.rules'") && !reglas.includes('MIN_CONTRASENA = '));

/* ─── 5. QUÉ CUENTA NO RECIBE NADA ─────────────────────────────────────── */

const ahora = new Date('2026-09-14T12:00:00Z');
const conFirma = { app_metadata: { firm_id: 'F1' } };
check('cuenta activa con firma: se envía', R.motivoParaNoEnviar(conFirma, ahora) === null);
check(
  'cuenta desactivada (ban vigente): no se envía',
  R.motivoParaNoEnviar({ ...conFirma, banned_until: '2126-01-01T00:00:00Z' }, ahora) === 'CUENTA_DESACTIVADA'
);
check('un ban ya vencido no cuenta', R.motivoParaNoEnviar({ ...conFirma, banned_until: '2020-01-01T00:00:00Z' }, ahora) === null);
check('cuenta sin firma: no se envía', R.motivoParaNoEnviar({ app_metadata: {} }, ahora) === 'SIN_FIRMA');

/* ─── 6. LA SESIÓN DE RESPALDO DEBE SER DE RECUPERACIÓN ────────────────── */

const jwt = (carga: object): string =>
  `x.${Buffer.from(JSON.stringify(carga)).toString('base64url')}.y`;
const ahoraMs = ahora.getTime();
const hace = (minutos: number) => Math.floor((ahoraMs - minutos * 60_000) / 1000);
check('amr recovery reciente: sí', R.esSesionDeRecuperacion(jwt({ amr: [{ method: 'recovery', timestamp: hace(2) }] }), ahoraMs));
check('amr password: no (una pestaña abierta no cambia la contraseña)', !R.esSesionDeRecuperacion(jwt({ amr: [{ method: 'password', timestamp: hace(1) }] }), ahoraMs));
check('amr recovery de hace tres horas: no', !R.esSesionDeRecuperacion(jwt({ amr: [{ method: 'recovery', timestamp: hace(180) }] }), ahoraMs));
check('token ilegible: no', !R.esSesionDeRecuperacion('no-es-un-jwt', ahoraMs));
check('sin amr: no', !R.esSesionDeRecuperacion(jwt({ sub: 'u' }), ahoraMs));

/* ─── 7. LOS ERRORES DEL ENLACE ────────────────────────────────────────── */

check('otp_expired → 410, la misma frase que un enlace inventado', R.clasificarFalloDelEnlace({ status: 403, code: 'otp_expired' }).status === 410);
check('un enlace desconocido → 410', R.clasificarFalloDelEnlace({ status: 400 }).codigo === 'ENLACE_INVALIDO');
check('Supabase 5xx → 503, no «enlace vencido»', R.clasificarFalloDelEnlace({ status: 502 }).status === 503);
check('red caída (status 0) → 503', R.clasificarFalloDelEnlace({ status: 0 }).status === 503);
check('429 → 429', R.clasificarFalloDelEnlace({ status: 429 }).status === 429);
check('weak_password al guardar → 400 CONTRASENA_RECHAZADA', R.clasificarFalloAlGuardar({ status: 422, code: 'weak_password' }).codigo === 'CONTRASENA_RECHAZADA');
check('5xx al guardar → 503', R.clasificarFalloAlGuardar({ status: 500 }).status === 503);

/* ─── 8. RESPUESTA NEUTRAL (código fuente) ─────────────────────────────── */

const controlador = leer('modules', 'auth', 'recuperacion.controller.ts');
const recuperar = tramo(controlador, 'export const recuperarController', 'export const restablecerController');
check('el controlador de solicitud existe', recuperar.length > 0);
check(
  'la solicitud tiene UNA sola respuesta de éxito, y es MENSAJE_NEUTRAL',
  recuperar.split('res.json(').length - 1 === 1 && recuperar.includes('message: MENSAJE_NEUTRAL')
);
check('la solicitud nunca responde 500 (un error solo-con-cuenta sería la confirmación)', !recuperar.includes('status(500)'));
check('la respuesta neutral espera el piso de tiempo', recuperar.includes('esperaRestante(inicio'));

const servicio = leer('modules', 'auth', 'recuperacion.service.ts');
const solicitar = tramo(servicio, 'export const solicitarRecuperacion', 'export interface CanjeDeEnlace');
const conCuenta = tramo(solicitar, 'DE AQUÍ EN ADELANTE LA CUENTA EXISTE', 'export interface CanjeDeEnlace');
check('existe el tramo que corre solo cuando la cuenta existe', conCuenta.length > 0);
check('ese tramo no lanza nada hacia quien pide', !conCuenta.includes('throw '));
check('ese tramo está envuelto en try/catch', conCuenta.includes('try {') && conCuenta.includes('} catch'));
check(
  'la solicitud se anota ANTES de buscar la cuenta (el límite no depende de que exista)',
  solicitar.indexOf('.insert(') > -1 && solicitar.indexOf('.insert(') < solicitar.indexOf('generateLink(')
);
check('una cuenta desactivada o sin firma no recibe el correo', conCuenta.indexOf('motivoParaNoEnviar') < conCuenta.indexOf('correoDeRecuperacion('));

/* ─── 9. EL REGISTRO NUNCA LLEVA EL CORREO ─────────────────────────────── */

const lineasDeRegistro = [servicio, controlador]
  .join('\n')
  .split('\n')
  .filter((l) => l.includes('console.'));
const delatoras = lineasDeRegistro.filter(
  (l) => l.includes('${correo') || l.includes('cuenta.email') || l.includes('usuario.email') || l.includes('s.correo') || l.includes('req.body')
);
check(`ninguna de las ${lineasDeRegistro.length} líneas de registro interpola el correo`, delatoras.length === 0, delatoras.join(' | '));
check('el registro identifica el caso por la huella corta', servicio.includes('huellaCorta(huellaCorreo)'));

/* ─── 10. TRAS GUARDAR: TODAS LAS SESIONES, Y LA MEMORIA DE 60 s ───────── */

const restablecer = tramo(servicio, 'export const restablecerContrasena', '\n};\n');
const iValidar = restablecer.indexOf('validarContrasenaNueva(');
const iCanje = restablecer.indexOf('canjearTokenHash(');
const iGuardar = restablecer.indexOf('updateUserById(');
const iCerrar = restablecer.indexOf("signOut(accessToken, 'global')");
const iOlvidar = restablecer.indexOf('olvidarSesionesDe(usuario.id)');
check('la contraseña se valida ANTES de gastar el enlace', iValidar > -1 && iCanje > -1 && iValidar < iCanje);
check('se cierran TODAS las sesiones (global) después de guardar', iGuardar > -1 && iCerrar > iGuardar);
check('y se olvida la memoria de sesiones de ese usuario', iOlvidar > iGuardar);
check('el restablecimiento queda en la auditoría', restablecer.includes("'CONTRASENA_RESTABLECIDA'"));
check(
  'el enlace se canjea en un cliente de un solo uso, nunca en el compartido',
  servicio.includes('clienteDeAuthEfimero()') && !servicio.includes('supabaseAuth.auth.verifyOtp')
);

/* ─── 11. EL CORREO ────────────────────────────────────────────────────── */

const correo = plantillaDeRecuperacion({ enlace, minutos: R.MINUTOS_DE_VIGENCIA_DEL_ENLACE });
const ambos = (frase: string) => correo.html.includes(frase) && correo.texto.includes(frase);

check('asunto pactado', correo.asunto === 'Restablecer su contraseña de Iureon');
check('botón «Elegir una contraseña nueva» con el enlace', correo.html.includes(`href="${enlace}"`) && correo.html.includes('Elegir una contraseña nueva'));
check(
  'el enlace también como texto, para clientes que no pintan el botón',
  correo.html.split(enlace).length - 1 >= 2 && correo.texto.includes(enlace)
);
check(
  'HTML y texto: «El enlace vence en 30 minutos y sirve una sola vez.»',
  R.MINUTOS_DE_VIGENCIA_DEL_ENLACE === 30 && ambos('El enlace vence en 30 minutos y sirve una sola vez.')
);
check(
  'HTML y texto: «Si usted no pidió este cambio, ignore este correo: su contraseña sigue igual.»',
  ambos('Si usted no pidió este cambio, ignore este correo: su contraseña sigue igual.')
);
check('el correo dice que no lleva material de casos', correo.texto.includes('No contiene material de casos'));

/*
 * EL MISMO DIBUJO QUE LOS DEMÁS CORREOS. El archivo no escribe HTML propio: se
 * lo pide a `documento()`. Y la salida trae las piezas del esqueleto común —el
 * logotipo del correo, la dirección del pie y el ancho de 600 px—, que ningún
 * correo tendría si alguien le armara un marco aparte.
 */
const fuenteDelCorreo = leer('modules', 'mail', 'recuperacion.mail.ts');
check(
  'la plantilla usa el esqueleto compartido (plantilla.ts → documento)',
  fuenteDelCorreo.includes("from './plantilla'") && fuenteDelCorreo.includes('documento({')
);
check(
  'y no escribe un marco propio',
  !fuenteDelCorreo.includes('<table') && !fuenteDelCorreo.includes('<!DOCTYPE') && !fuenteDelCorreo.includes('style=')
);
check(
  'la salida trae la cabecera y el pie comunes',
  correo.html.includes(`${SITIO}/brand/logo-correo.png`) && correo.html.includes(DIRECCION) && correo.html.includes('width="600"')
);
const datosDelCorreo = tramo(fuenteDelCorreo, 'export interface DatosDeRecuperacion', '}');
check(
  'no repite credenciales ni nombres: sus datos son solo destinatario, enlace y minutos',
  datosDelCorreo.includes('enlace: string') &&
    datosDelCorreo.includes('minutos: number') &&
    !['contrasena', 'password', 'nombre', 'firma', 'token'].some((c) => datosDelCorreo.includes(`${c}:`) || datosDelCorreo.includes(`${c}?:`))
);

/* ─── 12. EL PLAZO, EL MISMO EN PANTALLA Y EN EL CORREO ────────────────── */

const RAIZ = join(SRC, '..', '..');
const gemelo = join(RAIZ, 'frontend', 'src', 'modules', 'auth', 'enlaceDeRecuperacion.ts');
if (existsSync(gemelo)) {
  const texto = readFileSync(gemelo, 'utf8');
  const marca = 'export const MINUTOS_DE_VIGENCIA_DEL_ENLACE = ';
  const i = texto.indexOf(marca);
  const cifra = i === -1 ? NaN : Number.parseInt(texto.slice(i + marca.length), 10);
  check(
    'el plazo de la pantalla coincide con el del correo (Supabase: Email OTP expiration = 1800 s)',
    cifra === R.MINUTOS_DE_VIGENCIA_DEL_ENLACE && R.MINUTOS_DE_VIGENCIA_DEL_ENLACE * 60 === 1800,
    `pantalla ${cifra}, correo ${R.MINUTOS_DE_VIGENCIA_DEL_ENLACE}`
  );
} else {
  check('el gemelo del frontend existe', false, gemelo);
}

/* ─── 13. RUTAS Y MIGRACIÓN ────────────────────────────────────────────── */

const rutas = leer('modules', 'auth', 'auth.routes.ts');
check(
  'las dos rutas cuelgan del router PÚBLICO (quien olvidó la contraseña no tiene sesión)',
  rutas.includes("publicRouter.post('/auth/recuperar'") && rutas.includes("publicRouter.post('/auth/restablecer'")
);

const migracion = join(RAIZ, 'supabase', 'migration-recuperacion-limite.sql');
const sql = existsSync(migracion) ? readFileSync(migracion, 'utf8') : '';
check('la migración del límite existe', sql.length > 0);
check('RLS activo', sql.includes('ENABLE ROW LEVEL SECURITY'));
check('sin políticas: nadie fuera de service_role', !sql.includes('CREATE POLICY'));
check('anon y authenticated sin privilegios', sql.includes('FROM authenticated;') && sql.includes('FROM anon;'));
check('la tabla guarda huellas, no correos', sql.includes('email_hash') && !sql.includes(' email TEXT'));

console.log('');
if (fallos > 0) {
  console.log(`${fallos} fallo(s).`);
  process.exitCode = 1;
} else {
  // El estandarte que `scripts/run-all-checks.mjs` reconoce; otro texto se marca ROTO.
  console.log('ALL CHECKS PASSED');
}
