/**
 * GUARDA DE «NO PUDE COMPROBARLO» CONTRA «NO SIRVE».
 *
 * Run with: npm run check:sesion
 *
 * ─── EL DEFECTO QUE ESTO CIERRA ────────────────────────────────────────────
 *
 * `userFromToken` devolvía `null` tanto para un token inválido como para un
 * fallo al hablar con el servicio de autenticación. El middleware lo convertía
 * en 401 y el navegador trata cualquier 401 como sesión perdida: BORRA la
 * sesión y devuelve al login.
 *
 * Resultado: un tropiezo de red, un 5xx de Supabase o un arranque en frío
 * lento echaban al abogado en mitad del trabajo con su token intacto. Y la
 * aplicación sondea el saldo cada 20 s y soporte cada 30 s —unas trescientas
 * verificaciones por hora—, así que bastaba con que una fallara.
 *
 * ─── LAS DOS DIRECCIONES DEL ERROR NO VALEN LO MISMO ───────────────────────
 *
 * Tratar un fallo transitorio como token inválido es MOLESTO: se cierra una
 * sesión buena. Tratar un token inválido como fallo transitorio es GRAVE: se
 * deja pasar a quien no debe. Por eso la clasificación solo reconoce lo que
 * sabe que es transporte, y todo lo demás —incluido lo desconocido— cuenta
 * como token inválido.
 *
 * La mitad de este archivo comprueba justamente eso: que no se relajó.
 */
import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

console.log('SESIÓN — «no pude comprobarlo» no puede salir por el mismo 401 que «no sirve»');
console.log('');

/*
 * ─── LA CLASIFICACIÓN, REPRODUCIDA AQUÍ ────────────────────────────────────
 *
 * `esFalloDeTransporte` no se exporta: es un detalle del servicio, y sacarlo
 * solo para probarlo ensancharía su superficie. Se reproduce su regla y se
 * comprueba aparte que el servicio sigue diciendo lo mismo — así, si alguien
 * la cambia allí sin cambiarla aquí, el check cae.
 */
const esFalloDeTransporte = (error: unknown): boolean => {
  if (error instanceof AuthRetryableFetchError) return true;
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status !== 'number') return false;
  return status === 0 || status === 429 || status >= 500;
};

/* ─── 1. LO QUE SÍ ES TRANSITORIO: LA SESIÓN SE CONSERVA ─────────────────── */

check(
  'la red caída, que auth-js ya marca como reintentable',
  esFalloDeTransporte(new AuthRetryableFetchError('fetch failed', 0))
);
check('un 500 del servicio de autenticación', esFalloDeTransporte({ status: 500 }));
check('un 502 de la puerta de enlace', esFalloDeTransporte({ status: 502 }));
check('un 504, que es el arranque en frío que tardó de más', esFalloDeTransporte({ status: 504 }));
check('un 429: cuota agotada no es token falso', esFalloDeTransporte({ status: 429 }));
check('status 0: la petición ni salió', esFalloDeTransporte({ status: 0 }));

/* ─── 2. LO QUE NO, Y ESTA MITAD ES LA QUE PROTEGE ───────────────────────── */

check('un 401 del servicio: el token no sirve', !esFalloDeTransporte({ status: 401 }));
check('un 403: tampoco sirve', !esFalloDeTransporte({ status: 403 }));
check('un 400: petición mal formada, no transporte', !esFalloDeTransporte({ status: 400 }));
check(
  'un error DESCONOCIDO cuenta como token inválido',
  !esFalloDeTransporte(new Error('algo raro')),
  'equivocarse hacia «vuelva a entrar» es molesto; hacia «siga» es dejar pasar a quien no debe'
);
check('null no es un fallo de transporte', !esFalloDeTransporte(null));
check('un error sin status no lo es', !esFalloDeTransporte({ message: 'vaya' }));

/* ─── 3. Y EL CÓDIGO DE VERDAD SIGUE DICIENDO LO MISMO ───────────────────── */
/*
 * Lo de arriba prueba una copia de la regla. Esto prueba que la copia no se
 * quedó atrás: si alguien añade o quita un caso en el servicio y no aquí, o
 * afloja la clasificación, este bloque cae.
 */
const raiz = join(process.cwd(), 'src/modules/auth');
const servicio = readFileSync(join(raiz, 'auth.service.ts'), 'utf8');
const middleware = readFileSync(join(raiz, 'auth.middleware.ts'), 'utf8');

check(
  'el servicio clasifica con `isAuthRetryableFetchError`',
  /isAuthRetryableFetchError\(error\)/.test(servicio)
);
check(
  'y con los mismos tres estados que se probaron arriba',
  /status === 0/.test(servicio) && /status === 429/.test(servicio) && /status >= 500/.test(servicio),
  'si la regla del servicio cambia, la copia de este check deja de valer'
);
check(
  'lo desconocido NO se clasifica como transporte en el servicio',
  /if \(typeof status !== 'number'\) return false;/.test(servicio),
  'el `return false` por defecto es lo que impide dejar pasar un token malo'
);
check(
  'verificarToken devuelve los TRES desenlaces',
  /'VALIDO'/.test(servicio) && /'INVALIDO'/.test(servicio) && /'NO_DISPONIBLE'/.test(servicio)
);
check(
  'y atrapa lo que `getUser` lance, no solo lo que devuelva',
  /catch \(err\)[\s\S]{0,400}NO_DISPONIBLE/.test(servicio),
  'un fetch abortado o un fallo de DNS llegan lanzados, y antes contaban como token inválido'
);

/* ─── 4. EL MIDDLEWARE MAPEA CADA DESENLACE A SU ESTADO HTTP ─────────────── */

/*
 * SE ANCLA EN EL CODIGO Y NO EN LA DISTANCIA. La primera version medía cuántos
 * caracteres había entre la rama y su `status(...)`, y se puso roja al añadir
 * un comentario en medio: una asercion que depende del largo de la prosa mide
 * la prosa, no el codigo. Cada codigo de error sale en una sola rama, asi que
 * pegarlo a su estado es exacto y no se mueve.
 */
check(
  'NO_DISPONIBLE responde 503, no 401',
  /status\(503\)[\s\S]{0,200}AUTH_NO_DISPONIBLE/.test(middleware) &&
    !/status\(401\)[\s\S]{0,200}AUTH_NO_DISPONIBLE/.test(middleware),
  'con 401 el navegador borra la sesion: ese es el defecto entero'
);
check(
  'INVALIDO sigue respondiendo 401',
  /status\(401\)[\s\S]{0,200}INVALID_SESSION/.test(middleware)
);
check(
  'y el 503 viaja con un codigo propio para que el cliente lo reconozca',
  /AUTH_NO_DISPONIBLE/.test(middleware)
);
check(
  'la ruta publica tambien distingue, en vez de servir el catalogo sin curaduria',
  /optionalAuthMiddleware[\s\S]*NO_DISPONIBLE[\s\S]{0,600}status\(503\)/.test(middleware),
  'seguir como visitante mostraria la ficha de fabrica donde la firma ya habia corregido el termino'
);
check(
  'pero sin token sigue pasando: es una ruta publica',
  /if \(!header\?\.startsWith\('Bearer '\)\) \{[\s\S]{0,200}next\(\);/.test(middleware)
);

/* ─── 5. Y EL NAVEGADOR SOLO BORRA LA SESION CON 401 ─────────────────────── */

const cliente = readFileSync(join(process.cwd(), '../frontend/src/config/httpClient.ts'), 'utf8');

/*
 * HAY TRES `clearSession()` EN EL CLIENTE y contarlos contra los 401 era una
 * asercion burda: el tercero vive en el refresco, que no responde con status
 * propio. Lo que hay que sostener no es la cuenta sino de que cuelga cada uno.
 */
check(
  'los borrados del camino normal cuelgan de un 401',
  (cliente.match(/response\.status === 401/g) ?? []).length === 2,
  'peticion y subida: los dos sitios donde una respuesta puede decir que la sesion murio'
);
check(
  'y el del refresco cuelga de un RECHAZO explicito, no de cualquier fallo',
  /refrescoRechazado\(err\)/.test(cliente) && /if \(!refrescoRechazado\(err\)\) return session\.accessToken;/.test(cliente),
  'antes CUALQUIER excepcion aqui borraba la sesion, incluida una red caida dos segundos'
);
check(
  'el rechazo se enumera, y 5xx/429 NO estan en la lista',
  /RECHAZOS = new Set\(\[400, 401, 403\]\)/.test(cliente),
  'enumerar lo que si es rechazo deja todo lo demas del lado seguro'
);
check(
  'y el refresco conserva el token actual en vez de cerrar',
  /return session\.accessToken;/.test(cliente),
  'la renovacion empieza cinco minutos antes de caducar: el token de ahora todavia sirve'
);
check(
  'authApi lanza ApiError con estado, no un Error pelado',
  /throw new ApiError\(/.test(readFileSync(join(process.cwd(), '../frontend/src/modules/auth/auth.api.ts'), 'utf8')),
  'sin estado en la excepcion, «rechazado» y «no se pudo» eran la misma cosa'
);
check(
  'el refresco del servidor tambien distingue',
  /AUTH_NO_DISPONIBLE[\s\S]{0,200}503/.test(servicio) && /esFalloDeTransporte\(error\)/.test(servicio),
  'un 5xx renovando echaba al abogado con un token de refresco bueno'
);
check(
  'y reintenta una vez el 503 de autenticacion',
  /AUTH_NO_DISPONIBLE/.test(cliente) && /ESPERA_DE_REINTENTO_MS/.test(cliente),
  'ese 503 sale antes de que corra ningun manejador, asi que reintentar no repite ningun cobro'
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — un fallo al comprobar la sesión ya no la cierra.');
}
