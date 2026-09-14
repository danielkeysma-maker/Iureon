import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  capturarEnlaceDeRecuperacion,
  leerEnlaceDeRecuperacion,
  type EnlaceDeRecuperacion
} from '../enlaceDeRecuperacion';
import { MIN_CONTRASENA, problemaDeContrasenaNueva } from '../contrasena';

/**
 * EL ENLACE DE RECUPERACIÓN: QUE SE LEA BIEN Y QUE SALGA DE LA BARRA.
 *
 * Run with: npm run check:recuperacion
 *
 * Un token que se queda en la dirección vive en el historial, en la
 * sincronización entre dispositivos y en la captura que alguien le manda a
 * soporte. Este check prueba el lector con las formas reales que llegan —la de
 * Iureon (`#token_hash`), la redirección de Supabase (`#access_token…
 * &type=recovery`) y su error (`#error_code=otp_expired`)— y que la dirección
 * que queda no contiene ninguna.
 *
 * Y lee el código de las pantallas para lo que no se ejecuta sin navegador: la
 * regla de contraseña compartida con el registro, el enlace en Entrar, y que
 * nada escriba el token en la consola.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const SITIO = 'https://www.iureoncolombia.com';
const igual = (a: EnlaceDeRecuperacion | null, b: EnlaceDeRecuperacion | null) => JSON.stringify(a) === JSON.stringify(b);

/* ─── 1. LAS FORMAS QUE LLEGAN ─────────────────────────────────────────── */

const casos: Array<{ nombre: string; href: string; enlace: EnlaceDeRecuperacion | null; limpia: string | null }> = [
  {
    nombre: 'enlace de Iureon: token_hash en el fragmento',
    href: `${SITIO}/?restablecer=1#token_hash=abc123`,
    enlace: { tipo: 'TOKEN_HASH', tokenHash: 'abc123' },
    limpia: '/'
  },
  {
    nombre: 'redirección de Supabase con sesión de recuperación',
    href: `${SITIO}/?restablecer=1#access_token=FAKE&expires_in=3600&refresh_token=R1&token_type=bearer&type=recovery`,
    enlace: { tipo: 'SESION', accessToken: 'FAKE' },
    limpia: '/'
  },
  {
    nombre: 'redirección a la raíz (Site URL) con la sesión solo en el fragmento',
    href: `${SITIO}/#access_token=FAKE2&refresh_token=R2&type=recovery`,
    enlace: { tipo: 'SESION', accessToken: 'FAKE2' },
    limpia: '/'
  },
  {
    nombre: 'enlace vencido o usado (otp_expired en el fragmento)',
    href: `${SITIO}/?restablecer=1#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`,
    enlace: { tipo: 'VENCIDO' },
    limpia: '/'
  },
  {
    nombre: 'otp_expired en la consulta y sin la marca',
    href: `${SITIO}/?error=access_denied&error_code=otp_expired`,
    enlace: { tipo: 'VENCIDO' },
    limpia: '/'
  },
  {
    nombre: '?restablecer=1 sin token: el enlace no sirve',
    href: `${SITIO}/?restablecer=1`,
    enlace: { tipo: 'VENCIDO' },
    limpia: '/'
  },
  {
    nombre: 'token_hash en la consulta también se lee y se quita',
    href: `${SITIO}/?restablecer=1&token_hash=q9`,
    enlace: { tipo: 'TOKEN_HASH', tokenHash: 'q9' },
    limpia: '/'
  },
  {
    nombre: 'lo que no es del enlace se conserva',
    href: `${SITIO}/?restablecer=1&plan=PREMIUM#token_hash=x1`,
    enlace: { tipo: 'TOKEN_HASH', tokenHash: 'x1' },
    limpia: '/?plan=PREMIUM'
  },
  {
    nombre: 'un code de PKCE no se puede canjear aquí: vencido, y se quita',
    href: `${SITIO}/?restablecer=1&code=pkce123`,
    enlace: { tipo: 'VENCIDO' },
    limpia: '/'
  },
  { nombre: 'Entrar no es un enlace de recuperación', href: `${SITIO}/?entrar=1`, enlace: null, limpia: null },
  { nombre: 'un ancla corriente no se toca', href: `${SITIO}/?ir=manual#seccion`, enlace: null, limpia: null },
  {
    nombre: 'un access_token que no es de recuperación no se acepta',
    href: `${SITIO}/#access_token=OTRO&type=signup`,
    enlace: null,
    limpia: null
  }
];

for (const c of casos) {
  const r = leerEnlaceDeRecuperacion(c.href);
  check(c.nombre, igual(r.enlace, c.enlace) && r.urlLimpia === c.limpia, `obtuvo ${JSON.stringify(r)}`);
  if (r.urlLimpia !== null) {
    const secreto = ['abc123', 'FAKE', 'R1', 'R2', 'q9', 'x1', 'pkce123', 'otp_expired'].find((s) => r.urlLimpia!.includes(s));
    check(`  …y la dirección que queda no trae secretos`, !secreto, secreto ?? '');
  }
}

/* ─── 2. SE BORRA DE LA BARRA, UNA SOLA VEZ ────────────────────────────── */

const reemplazos: string[] = [];
(globalThis as unknown as { window: unknown }).window = {
  location: { href: `${SITIO}/?restablecer=1#token_hash=deLaBarra` },
  history: { replaceState: (_e: unknown, _t: string, url: string) => reemplazos.push(url) }
};
const primera = capturarEnlaceDeRecuperacion();
const segunda = capturarEnlaceDeRecuperacion();
check('la captura lee el token', igual(primera, { tipo: 'TOKEN_HASH', tokenHash: 'deLaBarra' }));
check('y reemplaza la dirección por una sin token', reemplazos.length === 1 && reemplazos[0] === '/');
check('la segunda llamada (modo estricto) no vuelve a leer la barra ya limpia', igual(segunda, primera) && reemplazos.length === 1);

/* ─── 3. LA CONTRASEÑA ─────────────────────────────────────────────────── */

check('la regla de la pantalla es la del servidor (10)', MIN_CONTRASENA === 10);
check('corta: se dice', problemaDeContrasenaNueva('x'.repeat(MIN_CONTRASENA - 1), 'x'.repeat(MIN_CONTRASENA - 1)) !== null);
check('distintas: se dice', problemaDeContrasenaNueva('a'.repeat(MIN_CONTRASENA), 'b'.repeat(MIN_CONTRASENA)) === 'Las dos contraseñas no coinciden.');
check('larga e igual: sirve', problemaDeContrasenaNueva('a'.repeat(MIN_CONTRASENA), 'a'.repeat(MIN_CONTRASENA)) === null);

/* ─── 4. EL CÓDIGO DE LAS PANTALLAS ────────────────────────────────────── */

const SRC = join(process.cwd(), 'src');
const leer = (...p: string[]) => readFileSync(join(SRC, ...p), 'utf8');

const registro = leer('modules', 'tenant', 'components', 'RegistroView.tsx');
const restablecer = leer('modules', 'tenant', 'components', 'RestablecerContrasenaView.tsx');
const recuperar = leer('modules', 'tenant', 'components', 'RecuperarContrasenaView.tsx');
const entrar = leer('modules', 'tenant', 'components', 'LoginPortalView.tsx');
const api = leer('modules', 'auth', 'auth.api.ts');
const lector = leer('modules', 'auth', 'enlaceDeRecuperacion.ts');
const app = leer('App.tsx');

for (const [nombre, texto] of [
  ['RegistroView', registro],
  ['RestablecerContrasenaView', restablecer]
] as const) {
  check(
    `${nombre} usa la regla compartida y no escribe la suya`,
    texto.includes("from '../../auth/contrasena'") && !texto.includes('const MIN_CONTRASENA')
  );
}

check('Entrar enlaza a la recuperación', entrar.includes('href="/?recuperar=1"') && entrar.includes('¿Olvidó su contraseña?'));
check('Entrar ya no manda a pedir la contraseña a operación como única salida', !entrar.includes('nos pide que se la restablezcamos'));
check(
  'la confirmación no confirma que el correo exista',
  recuperar.includes('Si ese correo tiene cuenta, ya salió el enlace') && !recuperar.includes('Le enviamos el enlace a')
);
check('la vía del socio sigue nombrada para cuando el correo no llega', recuperar.includes('socio administrador'));
check(
  'ningún archivo del enlace escribe en la consola',
  ![lector, restablecer, recuperar].some((t) => t.includes('console.'))
);
check(
  'el token nunca viaja en la dirección de la API',
  api.includes("'/api/auth/restablecer'") && !api.includes('restablecer?') && !api.includes('token_hash=')
);
check(
  'App lee el enlace ANTES de decidir la portada (una redirección a la raíz perdería el token)',
  app.indexOf('capturarEnlaceDeRecuperacion()') > -1 &&
    app.indexOf('capturarEnlaceDeRecuperacion()') < app.indexOf('const [debeIrALaPortada]')
);
check('App abre la solicitud con ?recuperar=1', app.includes("parametros.has('recuperar')") && app.includes("params.has('recuperar')"));

console.log('');
if (fallos > 0) {
  console.log(`${fallos} fallo(s).`);
  process.exit(1);
}
console.log('Enlace de recuperación: todo en su sitio.');
