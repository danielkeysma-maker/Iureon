/**
 * EL ENLACE DE RECUPERACIÓN QUE LLEGA POR CORREO: LEERLO Y BORRARLO DE LA BARRA.
 *
 * ─── LAS DOS FORMAS QUE PUEDE TRAER ────────────────────────────────────────
 *
 * 1. La de Iureon (la que manda el backend): `/restablecer#token_hash=…`.
 *    El token va en el fragmento y la aplicación lo canjea por POST junto con
 *    la contraseña nueva. Un filtro de correo que abra el enlace antes que la
 *    persona no gasta nada: abrir la página no canjea. Los correos enviados
 *    antes del 14 de septiembre de 2026 traen la forma vieja, con la marca en
 *    la consulta (`restablecer=1`); `rutas.ts` la traduce a `/restablecer`
 *    conservando el fragmento, y este lector reconoce las dos marcas.
 *
 * 2. La de Supabase, de respaldo (un correo enviado desde su propio panel):
 *    Supabase canjea el token en su servidor y redirige con
 *    `#access_token=…&refresh_token=…&type=recovery`, o con
 *    `#error=access_denied&error_code=otp_expired&…` si el enlace venció o ya
 *    se usó. Algunas configuraciones lo ponen en la consulta (`?error_code=`)
 *    en vez del fragmento; se leen las dos.
 *
 * ─── LOS SECRETOS SALEN DE LA BARRA EN EL ACTO ─────────────────────────────
 *
 * Un token en la dirección queda en el historial del navegador, en la
 * sincronización del historial entre dispositivos y en la captura de pantalla
 * que alguien le manda a soporte. Se lee UNA vez, se borra con
 * `history.replaceState` antes de pintar nada, y vive solo en memoria mientras
 * la pantalla lo necesita. Nunca se registra en consola ni viaja en una URL.
 *
 * Puro salvo `capturarEnlaceDeRecuperacion`, que toca `window` y se recuerda:
 * en modo estricto React ejecuta dos veces los inicializadores, y la segunda
 * lectura encontraría la barra ya limpia y perdería el enlace.
 */

/**
 * CUÁNTO VIVE EL ENLACE, EN MINUTOS, para decirlo en pantalla.
 *
 * DEBE COINCIDIR CON SUPABASE › Authentication › Email › «Email OTP
 * Expiration» = 1800 segundos, que es lo que de verdad lo vence.
 *
 * GEMELO de `MINUTOS_DE_VIGENCIA_DEL_ENLACE` en
 * `backend/src/modules/auth/recuperacion.rules.ts`, que lo dice en el correo.
 * `check:recuperacion` del backend lee los dos archivos y falla si difieren:
 * dos proyectos no comparten código, y un plazo distinto en el correo y en la
 * pantalla sería peor que no decirlo.
 */
export const MINUTOS_DE_VIGENCIA_DEL_ENLACE = 30;

export type EnlaceDeRecuperacion =
  | { tipo: 'TOKEN_HASH'; tokenHash: string }
  | { tipo: 'SESION'; accessToken: string }
  /** Vencido, usado, sin token, o una forma que no se puede canjear. Mismo aviso. */
  | { tipo: 'VENCIDO' };

/** Todo lo que se retira de la dirección si aparece: tokens, errores y la marca. */
export const CLAVES_A_RETIRAR: readonly string[] = [
  'restablecer',
  'token_hash',
  'access_token',
  'refresh_token',
  'provider_token',
  'provider_refresh_token',
  'expires_in',
  'expires_at',
  'token_type',
  'type',
  'code',
  'error',
  'error_code',
  'error_description',
  'sb'
];

export interface Lectura {
  enlace: EnlaceDeRecuperacion | null;
  /** La dirección sin secretos, o null si no había nada que quitar. */
  urlLimpia: string | null;
}

export const leerEnlaceDeRecuperacion = (href: string): Lectura => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { enlace: null, urlLimpia: null };
  }

  const fragmento = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  const consulta = url.searchParams;
  const leer = (clave: string): string | null => fragmento.get(clave) ?? consulta.get(clave);

  /* La dirección `/restablecer` es la marca; la clave de consulta, la de los correos viejos. */
  const marcada = url.pathname === '/restablecer' || consulta.has('restablecer');
  const tokenHash = leer('token_hash');
  const accessToken = leer('access_token');
  const tipo = leer('type');
  const errorCode = leer('error_code') ?? leer('error');

  let enlace: EnlaceDeRecuperacion | null = null;
  if (tokenHash && (marcada || tipo === 'recovery')) {
    enlace = { tipo: 'TOKEN_HASH', tokenHash };
  } else if (accessToken && tipo === 'recovery') {
    enlace = { tipo: 'SESION', accessToken };
  } else if (marcada || (errorCode && (tipo === 'recovery' || errorCode === 'otp_expired'))) {
    // `/restablecer` sin token usable (fragmento perdido, `code` de PKCE que
    // aquí no se puede canjear, error de Supabase): el enlace no sirve.
    enlace = { tipo: 'VENCIDO' };
  }

  if (!enlace) return { enlace: null, urlLimpia: null };

  const limpia = new URL(url.href);
  for (const clave of CLAVES_A_RETIRAR) limpia.searchParams.delete(clave);
  const fragmentoTraiaSecretos = CLAVES_A_RETIRAR.some((clave) => fragmento.has(clave));
  const resto = limpia.searchParams.toString();
  const urlLimpia = `${limpia.pathname}${resto ? `?${resto}` : ''}${fragmentoTraiaSecretos ? '' : limpia.hash}`;

  return { enlace, urlLimpia };
};

let capturado: { enlace: EnlaceDeRecuperacion | null } | null = null;

/**
 * Lee el enlace de la dirección actual UNA vez, la limpia y recuerda el
 * resultado para las llamadas siguientes.
 */
export const capturarEnlaceDeRecuperacion = (): EnlaceDeRecuperacion | null => {
  if (capturado) return capturado.enlace;
  if (typeof window === 'undefined') return null;

  const { enlace, urlLimpia } = leerEnlaceDeRecuperacion(window.location.href);
  if (urlLimpia !== null) window.history.replaceState(null, '', urlLimpia);
  capturado = { enlace };
  return enlace;
};

/** Suelta el token de la memoria cuando ya no sirve (canjeado o descartado). */
export const descartarEnlaceDeRecuperacion = (): void => {
  capturado = { enlace: null };
};
