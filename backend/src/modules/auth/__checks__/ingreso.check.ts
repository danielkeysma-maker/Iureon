/**
 * GUARDA DE «NO SE PUDO VERIFICAR» CONTRA «CORREO O CONTRASEÑA INCORRECTOS».
 *
 * Run with: npm run check:ingreso
 *
 * ─── EL DEFECTO QUE ESTO CIERRA ────────────────────────────────────────────
 *
 * `signIn` convertía CUALQUIER error de `signInWithPassword` en 401
 * «Correo o contraseña incorrectos.». El 14 de septiembre de 2026 el titular
 * de la cuenta, con la contraseña correcta, recibió ese mensaje durante un
 * rato y después pudo entrar: un límite de intentos o un tropiezo de Supabase
 * dicho como si fuera un error suyo, y sin rastro en el servidor de la causa.
 *
 * ─── LO QUE ESTE CHECK SOSTIENE ────────────────────────────────────────────
 *
 * Que el clasificador separa tres desenlaces —credenciales, límite de
 * intentos, servicio no disponible— y que los casos que delatarían la
 * existencia de un correo (cuenta bloqueada, correo sin confirmar) siguen
 * saliendo por la misma frase que una contraseña equivocada.
 *
 * Es puro: errores falsos construidos aquí, sin red ni base.
 */
import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clasificarFalloDeIngreso } from '../acceso.rules';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

console.log('INGRESO — un fallo de Supabase no puede decirse «Correo o contraseña incorrectos»');
console.log('');

const espera = (nombre: string, error: unknown, status: number, codigo: string): void => {
  const r = clasificarFalloDeIngreso(error);
  check(nombre, r.status === status && r.codigo === codigo, `obtuvo ${r.status} ${r.codigo}`);
};

/* ─── 1. CREDENCIALES: UNA SOLA FRASE ────────────────────────────────────── */

espera(
  'invalid_credentials → 401',
  new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
  401,
  'INVALID_CREDENTIALS'
);
espera(
  'user_not_found → 401, igual que la contraseña equivocada',
  new AuthApiError('User not found', 404, 'user_not_found'),
  401,
  'INVALID_CREDENTIALS'
);
espera(
  'user_banned → 401: GoTrue lo mira ANTES que la contraseña',
  new AuthApiError('User is banned', 400, 'user_banned'),
  401,
  'INVALID_CREDENTIALS'
);
espera(
  'email_not_confirmed → 401',
  new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'),
  401,
  'INVALID_CREDENTIALS'
);
check(
  'y la frase de credenciales no cambió',
  clasificarFalloDeIngreso(new AuthApiError('x', 400, 'invalid_credentials')).mensaje === 'Correo o contraseña incorrectos.'
);

/* ─── 2. LÍMITE DE INTENTOS ──────────────────────────────────────────────── */

espera(
  'over_request_rate_limit 429 → 429',
  new AuthApiError('Request rate limit reached', 429, 'over_request_rate_limit'),
  429,
  'DEMASIADOS_INTENTOS'
);
espera('un 429 sin código también → 429', new AuthApiError('Too many requests', 429, undefined), 429, 'DEMASIADOS_INTENTOS');

/* ─── 3. NO SE PUDO VERIFICAR ────────────────────────────────────────────── */

espera('red caída (AuthRetryableFetchError, status 0) → 503', new AuthRetryableFetchError('fetch failed', 0), 503, 'ACCESO_NO_VERIFICABLE');
espera('500 reintentable → 503', new AuthRetryableFetchError('Internal Server Error', 500), 503, 'ACCESO_NO_VERIFICABLE');
espera('un AuthApiError con 500 → 503', new AuthApiError('unexpected_failure', 500, 'unexpected_failure'), 503, 'ACCESO_NO_VERIFICABLE');
espera(
  'respuesta ilegible (AuthUnknownError, sin status) → 503',
  new AuthUnknownError('Unexpected token <', new SyntaxError('x')),
  503,
  'ACCESO_NO_VERIFICABLE'
);
espera('una excepción cualquiera → 503', new Error('algo raro'), 503, 'ACCESO_NO_VERIFICABLE');
espera('sin error y sin sesión → 503', null, 503, 'ACCESO_NO_VERIFICABLE');

/* ─── 4. EL REGISTRO NUNCA LLEVA EL CORREO ───────────────────────────────── */

const r429 = clasificarFalloDeIngreso(new AuthApiError('Request rate limit reached', 429, 'over_request_rate_limit'));
check(
  'la causa registrable lleva el código y el estado de Supabase',
  /over_request_rate_limit/.test(r429.causa) && /429/.test(r429.causa),
  r429.causa
);

/* ─── 5. EL SERVICIO Y EL NAVEGADOR USAN ESTO ────────────────────────────── */

const servicio = readFileSync(join(process.cwd(), 'src/modules/auth/auth.service.ts'), 'utf8');
const firma = servicio.slice(servicio.indexOf('export const signIn'), servicio.indexOf('export const refreshSession'));

check('signIn clasifica con clasificarFalloDeIngreso', /clasificarFalloDeIngreso\(/.test(firma));
check(
  'signIn ya no lanza INVALID_CREDENTIALS a mano',
  !/new AuthError\('INVALID_CREDENTIALS'/.test(firma),
  'ese `throw` directo era el defecto entero'
);
check('signIn atrapa lo que signInWithPassword lance', /catch \(/.test(firma));
check(
  'el aviso del servidor no registra el correo',
  /console\.warn\(/.test(firma) && !/console\.warn\([^;]*email/.test(firma)
);

const api = readFileSync(join(process.cwd(), '../frontend/src/modules/auth/auth.api.ts'), 'utf8');
check(
  'el login del navegador NO pasa por httpClient',
  /login: \(email: string, password: string\) =>\s*post</.test(api),
  'httpClient borra la sesión con 401 y reintenta 503; aquí el mensaje del servidor tiene que llegar tal cual'
);

const vista = readFileSync(
  join(process.cwd(), '../frontend/src/modules/tenant/components/LoginPortalView.tsx'),
  'utf8'
);
check(
  'la pantalla de ingreso muestra el mensaje del servidor para cualquier estado',
  /err instanceof ApiError\) \{\s*setErrorMsg\(err\.message\);/.test(vista),
  'el 429 y el 503 deben leerse igual que el 401, no como «sin conexión»'
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — el ingreso distingue credenciales, límite de intentos y servicio caído.');
}
