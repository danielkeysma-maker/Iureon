import { isAuthRetryableFetchError } from '@supabase/supabase-js';

/**
 * LO QUE SE LE DICE A QUIEN NO PUDO ENTRAR, SEGÚN POR QUÉ NO PUDO.
 *
 * Regla pura, sin red ni base, para que `ingreso.check.ts` la pruebe con
 * errores falsos. Devuelve una descripción y no un `AuthError` para no
 * importar el servicio desde aquí.
 *
 * ─── EL DEFECTO QUE ESTO CIERRA ────────────────────────────────────────────
 *
 * `signIn` convertía cualquier error de `signInWithPassword` en «Correo o
 * contraseña incorrectos.». El 14 de septiembre de 2026 el titular, con la
 * contraseña correcta, recibió esa frase durante un rato y luego pudo entrar:
 * lo más probable, el límite de intentos de Supabase o un fallo transitorio.
 * Se le dijo que se había equivocado, y nada quedó registrado.
 *
 * ─── LOS TRES DESENLACES ───────────────────────────────────────────────────
 *
 *  · 401 INVALID_CREDENTIALS — Supabase atendió y rechazó (cualquier 4xx
 *    distinto de 429). Una sola frase para contraseña equivocada y correo
 *    inexistente: distinguirlos dice qué correos tienen cuenta.
 *
 *    `user_banned` y `email_not_confirmed` salen por aquí A PROPÓSITO. GoTrue
 *    comprueba el bloqueo ANTES que la contraseña, así que responder «cuenta
 *    bloqueada» a cualquiera que escriba ese correo confirmaría que existe.
 *    `email_not_confirmed` se agrupa con ellos por la misma prudencia: las
 *    cuentas de Iureon se crean ya confirmadas desde el servidor, así que en la
 *    práctica no ocurre, y si ocurre el aviso del servidor lo deja ver.
 *
 *  · 429 DEMASIADOS_INTENTOS — el límite de peticiones de GoTrue. No delata
 *    cuentas: ese límite se aplica por dirección IP como intermediario, antes
 *    de buscar al usuario, exista o no el correo.
 *
 *  · 503 ACCESO_NO_VERIFICABLE — red caída, 5xx, respuesta ilegible o
 *    cualquier cosa no reconocida. «No sé» no es «no»: es la misma distinción
 *    que `verificarToken` hace entre INVALIDO y NO_DISPONIBLE.
 *
 * A DIFERENCIA DE LA VERIFICACIÓN DEL TOKEN, lo desconocido cae del lado del
 * 503 y no del rechazo. Allí equivocarse hacia «siga» dejaba pasar a quien no
 * debía; aquí ningún desenlace de error concede nada —no hay sesión que
 * entregar— y equivocarse hacia «contraseña incorrecta» es exactamente el
 * defecto que se cierra.
 */

export type DesenlaceDeIngreso = {
  status: 401 | 429 | 503;
  codigo: 'INVALID_CREDENTIALS' | 'DEMASIADOS_INTENTOS' | 'ACCESO_NO_VERIFICABLE';
  mensaje: string;
  /**
   * Para el registro del servidor, nunca para la respuesta: nombre de la
   * clase, estado y código de Supabase. Nunca el correo ni el mensaje crudo.
   */
  causa: string;
};

const describirCausa = (error: unknown): string => {
  if (error === null || error === undefined) return 'sin error y sin sesión';
  const e = error as { name?: unknown; status?: unknown; code?: unknown };
  const nombre = typeof e.name === 'string' ? e.name : typeof error;
  return `${nombre} status=${String(e.status ?? '—')} code=${String(e.code ?? '—')}`;
};

export const clasificarFalloDeIngreso = (error: unknown): DesenlaceDeIngreso => {
  const causa = describirCausa(error);

  const noVerificable: DesenlaceDeIngreso = {
    status: 503,
    codigo: 'ACCESO_NO_VERIFICABLE',
    mensaje: 'No se pudo verificar el acceso en este momento. Intente de nuevo en unos minutos.',
    causa
  };

  if (error === null || error === undefined) return noVerificable;
  if (isAuthRetryableFetchError(error)) return noVerificable;

  const { status, code } = error as { status?: unknown; code?: unknown };

  if (code === 'over_request_rate_limit' || status === 429) {
    return {
      status: 429,
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos. Espere unos minutos y vuelva a intentarlo.',
      causa
    };
  }

  if (typeof status === 'number' && status >= 400 && status < 500) {
    return {
      status: 401,
      codigo: 'INVALID_CREDENTIALS',
      mensaje: 'Correo o contraseña incorrectos.',
      causa
    };
  }

  return noVerificable;
};
