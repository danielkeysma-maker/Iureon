import { createHmac } from 'node:crypto';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { SITIO } from '../mail/plantilla';
import { MIN_CONTRASENA } from '../trial/trial.rules';

/**
 * LAS REGLAS DE LA RECUPERACIÓN DE CONTRASEÑA POR CORREO, SIN RED NI BASE.
 *
 * Todo lo que aquí se decide lo prueba `check:recuperacion` con datos falsos.
 * El servicio (`recuperacion.service.ts`) solo habla con Supabase, con la tabla
 * del límite y con el correo; las decisiones viven en este archivo.
 *
 * ─── EL CONTRATO (SPEC-entrada-y-sesion.md §2) ─────────────────────────────
 *
 *  1. Pedir el enlace responde LO MISMO exista o no el correo, esté o no
 *     desactivada la cuenta. Decir otra cosa confirma a un extraño qué correos
 *     tienen cuenta en Iureon.
 *  2. El enlace vence y sirve una sola vez. Lo guarda Supabase (hash del token,
 *     invalidado al usarse y al emitir uno nuevo); aquí no se guarda nada suyo.
 *  3. Al restablecer se cierran TODAS las sesiones de ese usuario.
 *  4. Límite por correo y por dirección IP, porque el endpoint manda correos.
 *  5. El correo solo lleva el enlace: nada de casos ni de clientes.
 */

/**
 * CUÁNTO VIVE EL ENLACE, EN MINUTOS.
 *
 * DEBE COINCIDIR CON SUPABASE › Authentication › Sign In / Providers › Email ›
 * «Email OTP Expiration» = 1800 segundos. Ese valor, y no esta constante, es el
 * que de verdad vence el enlace: esta solo lo anuncia en el correo. Si alguien
 * cambia uno sin el otro, el correo promete un plazo que no se cumple.
 *
 * GEMELO de `MINUTOS_DE_VIGENCIA_DEL_ENLACE` en
 * `frontend/src/modules/auth/enlaceDeRecuperacion.ts`, que lo anuncia en
 * pantalla. `check:recuperacion` lee los dos y falla si difieren.
 */
export const MINUTOS_DE_VIGENCIA_DEL_ENLACE = 30;

/**
 * TRES ENLACES POR CORREO CADA 30 MINUTOS. Quien no recibe el primero pide un
 * segundo y a veces un tercero; más que eso es alguien llenándole la bandeja a
 * otra persona. La ventana coincide con la vida del enlace: pasado ese tiempo
 * los enlaces anteriores ya no sirven y pedir otro es legítimo.
 */
export const MAX_SOLICITUDES_POR_CORREO = 3;
export const VENTANA_POR_CORREO_MS = 30 * 60 * 1000;

/**
 * DIEZ POR DIRECCIÓN CADA HORA. Una oficina entera sale a internet por una sola
 * dirección, así que el tope por IP tiene que admitir a varios abogados que
 * olvidaron la contraseña la misma mañana; diez por hora ya es un guion
 * recorriendo una lista de correos.
 */
export const MAX_SOLICITUDES_POR_IP = 10;
export const VENTANA_POR_IP_MS = 60 * 60 * 1000;

/**
 * EL PISO DE TIEMPO DE LA RESPUESTA.
 *
 * Un correo sin cuenta se resuelve en una consulta; uno con cuenta genera el
 * enlace y lo envía. Sin piso, lo que tarda la respuesta diría lo que el texto
 * calla. No se puede hacer el envío después de responder: una función
 * serverless se congela al contestar y el correo no saldría. Se espera hasta
 * este piso en todos los casos.
 *
 * LO QUE NO CUBRE, dicho: si Supabase o Resend tardan más de tres segundos, la
 * respuesta con cuenta sale más tarde que el piso y la diferencia vuelve a
 * medirse. Es un residuo de tiempo, ruidoso y caro de explotar, no una
 * confirmación en el texto.
 */
export const PISO_DE_RESPUESTA_MS = 3000;

/** La única respuesta de éxito que da la solicitud, pase lo que pase detrás. */
export const MENSAJE_NEUTRAL =
  'Si ese correo tiene cuenta en Iureon, le enviamos un enlace para poner una contraseña nueva. Revise también el correo no deseado.';

/** Sin cuenta que atender: formato de correo. No depende de si existe. */
export const correoNormalizado = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const correo = raw.trim().toLowerCase();
  if (correo.length < 3 || correo.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? correo : null;
};

/**
 * LA HUELLA DE UN CORREO O DE UNA IP: HMAC-SHA256, NUNCA EL DATO.
 *
 * Un SHA-256 a secas de un correo se revierte con una lista de correos: no
 * protege nada. Con HMAC y una llave que solo tiene el servidor, la tabla del
 * límite y el registro no dicen a quién pertenecen. La llave es la del service
 * role, que ya existe y nunca sale del backend; el `ambito` separa las huellas
 * de correo de las de IP para que una no se pueda cruzar con la otra.
 * Rotar esa llave pone el conteo del límite en cero: consecuencia inocua.
 */
export const huella = (valor: string, llave: string, ambito: 'correo' | 'ip'): string =>
  createHmac('sha256', llave).update(`iureon:recuperacion:v1:${ambito}:${valor}`).digest('hex');

/** Doce caracteres de la huella: bastan para seguir un caso en el registro. */
export const huellaCorta = (h: string): string => h.slice(0, 12);

export type DecisionDeLimite = 'PERMITIDO' | 'LIMITE_CORREO' | 'LIMITE_IP';

/**
 * Los conteos son de solicitudes ANTERIORES dentro de su ventana, incluidas las
 * de correos sin cuenta: el límite no puede depender de que el correo exista,
 * o el propio límite lo delataría.
 *
 * La IP va primero porque su respuesta (429) se puede decir: no habla de
 * ningún correo. El límite por correo, en cambio, responde lo neutral y no
 * envía nada: los enlaces anteriores de ese correo ya salieron.
 */
export const decidirLimite = (conteos: { porCorreo: number; porIp: number }): DecisionDeLimite => {
  if (conteos.porIp >= MAX_SOLICITUDES_POR_IP) return 'LIMITE_IP';
  if (conteos.porCorreo >= MAX_SOLICITUDES_POR_CORREO) return 'LIMITE_CORREO';
  return 'PERMITIDO';
};

/**
 * LOS SITIOS A LOS QUE PUEDE LLEVAR EL ENLACE.
 *
 * Se devuelve al mismo sitio desde el que se pidió, si está en esta lista. El
 * `Origin` lo dice el navegador y lo puede decir cualquiera: aceptarlo sin
 * lista sería mandar el enlace de otra persona a una página ajena, con el token
 * dentro. Coincide con las Redirect URLs configuradas en Supabase.
 */
export const ORIGENES_PERMITIDOS: readonly string[] = [
  SITIO,
  'https://iureoncolombia.com',
  'https://iureon-app.vercel.app'
];

/** Solo fuera de Vercel: el servidor de desarrollo de Vite. */
export const ORIGENES_DE_DESARROLLO: readonly string[] = ['http://localhost:5173'];

export const baseDelEnlace = (origen: string | undefined, opciones: { desarrollo: boolean }): string => {
  const limpio = (origen ?? '').trim().replace(/\/+$/, '').toLowerCase();
  const permitidos = opciones.desarrollo ? [...ORIGENES_PERMITIDOS, ...ORIGENES_DE_DESARROLLO] : ORIGENES_PERMITIDOS;
  return permitidos.find((p) => p === limpio) ?? SITIO;
};

/**
 * EL ENLACE DEL CORREO: EL TOKEN VA EN EL FRAGMENTO (#), NUNCA EN LA CONSULTA.
 *
 * El fragmento no viaja al servidor que sirve la página ni queda en sus
 * registros, ni en la cabecera `Referer` de lo que la página cargue. La
 * aplicación lo lee, lo borra de la barra de direcciones en el acto y lo manda
 * por POST.
 *
 * POR QUÉ NO EL `action_link` DE SUPABASE. Ese enlace se canjea con un GET: el
 * primero que lo abre lo gasta. Los filtros de correo corporativo (Outlook Safe
 * Links y similares) abren cada enlace antes que la persona, así que el
 * abogado recibiría un enlace ya usado. Esta página, abierta por un robot, no
 * canjea nada: el canje exige un POST con la contraseña nueva.
 */
export const enlaceDeRestablecimiento = (base: string, tokenHash: string): string =>
  `${base}/?restablecer=1#token_hash=${encodeURIComponent(tokenHash)}`;

/** Cuánto falta para llegar al piso. Cero si ya se pasó. */
export const esperaRestante = (inicioMs: number, ahoraMs: number, piso = PISO_DE_RESPUESTA_MS): number =>
  Math.max(0, piso - (ahoraMs - inicioMs));

export type ValidacionDeContrasena = { ok: true; contrasena: string } | { ok: false; mensaje: string };

/**
 * LA MISMA REGLA QUE EL REGISTRO PÚBLICO: `MIN_CONTRASENA` de `trial.rules.ts`,
 * importada y no copiada. Quien restablece desde un enlace es, igual que quien
 * se registra, alguien sin sesión en un formulario público.
 */
export const validarContrasenaNueva = (raw: unknown): ValidacionDeContrasena => {
  if (typeof raw !== 'string' || raw.length < MIN_CONTRASENA) {
    return { ok: false, mensaje: `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.` };
  }
  return { ok: true, contrasena: raw };
};

export { MIN_CONTRASENA };

type CuentaDeAuth = {
  banned_until?: string | null;
  app_metadata?: Record<string, unknown> | null;
};

/**
 * POR QUÉ NO SE ENVÍA (O NO SE ACEPTA) UN ENLACE A UNA CUENTA QUE EXISTE.
 *
 * Una cuenta desactivada por su firma no recibe un enlace que funcione: sería
 * la puerta trasera de la desactivación. Una cuenta sin firma no es una cuenta
 * de Iureon que pueda usar nada. Ninguno de los dos casos cambia la respuesta.
 */
export const motivoParaNoEnviar = (cuenta: CuentaDeAuth, ahora: Date): 'CUENTA_DESACTIVADA' | 'SIN_FIRMA' | null => {
  if (cuenta.banned_until && new Date(cuenta.banned_until).getTime() > ahora.getTime()) return 'CUENTA_DESACTIVADA';
  const firmId = cuenta.app_metadata?.firm_id;
  if (typeof firmId !== 'string' || !firmId) return 'SIN_FIRMA';
  return null;
};

/** El `firm_id` de la cuenta, o null. */
export const firmaDeLaCuenta = (cuenta: CuentaDeAuth): string | null => {
  const firmId = cuenta.app_metadata?.firm_id;
  return typeof firmId === 'string' && firmId ? firmId : null;
};

/** Métodos de `amr` que prueban que la sesión nació de un enlace de recuperación. */
export const METODOS_DE_RECUPERACION: readonly string[] = ['recovery', 'otp'];

/**
 * ¿ESTE TOKEN ES UNA SESIÓN DE RECUPERACIÓN RECIENTE?
 *
 * Solo para la vía de respaldo: el enlace que redirige desde Supabase con
 * `#access_token=…&type=recovery` (el correo que Supabase manda por su cuenta,
 * por ejemplo desde su panel). Una sesión corriente —de contraseña— NO debe
 * poder cambiar la contraseña sin la actual: quien encuentra una pestaña
 * abierta no tiene por qué quedarse con la cuenta.
 *
 * NO VERIFICA LA FIRMA: quien llama ya comprobó el token con `getUser`. Aquí
 * solo se lee el `amr` que ese token trae y se exige un método de enlace por
 * correo con marca de tiempo dentro de la vida del enlace (más un margen para
 * escribir la contraseña). `otp` se admite porque GoTrue ha registrado la
 * recuperación con ese método en algunas versiones; Iureon no ofrece ingreso
 * por código ni por enlace mágico, así que ninguna otra sesión suya lo lleva.
 */
export const esSesionDeRecuperacion = (token: string, ahoraMs: number): boolean => {
  const partes = token.split('.');
  if (partes.length !== 3) return false;

  let amr: unknown;
  try {
    amr = (JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8')) as { amr?: unknown }).amr;
  } catch {
    return false;
  }
  if (!Array.isArray(amr)) return false;

  const vidaMs = (MINUTOS_DE_VIGENCIA_DEL_ENLACE + 30) * 60 * 1000;

  return amr.some((entrada) => {
    if (!entrada || typeof entrada !== 'object') return false;
    const { method, timestamp } = entrada as { method?: unknown; timestamp?: unknown };
    if (typeof method !== 'string' || !METODOS_DE_RECUPERACION.includes(method)) return false;
    if (typeof timestamp !== 'number') return false;
    const edad = ahoraMs - timestamp * 1000;
    return edad >= -60_000 && edad <= vidaMs;
  });
};

/** Red caída, 5xx, 0 o 429: «no sé», no «no». La misma regla que `auth.service`. */
export const esFalloDeTransporte = (error: unknown): boolean => {
  if (isAuthRetryableFetchError(error)) return true;
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status !== 'number') return false;
  return status === 0 || status >= 500;
};

export type FalloDeRestablecimiento = {
  status: 400 | 410 | 429 | 502 | 503;
  codigo:
    | 'ENLACE_INVALIDO'
    | 'DEMASIADOS_INTENTOS'
    | 'RECUPERACION_NO_DISPONIBLE'
    | 'CONTRASENA_RECHAZADA'
    | 'CONTRASENA_NO_GUARDADA';
  mensaje: string;
};

export const MENSAJE_ENLACE_INVALIDO = `Este enlace ya no sirve: vence a los ${MINUTOS_DE_VIGENCIA_DEL_ENLACE} minutos y solo se usa una vez.`;

export const MENSAJE_NO_DISPONIBLE =
  'No se pudo completar en este momento. Intente de nuevo en unos minutos, o pídale a un socio administrador de su firma que le ponga una contraseña nueva.';

/**
 * EL ENLACE NO SE PUDO CANJEAR. Vencido, usado, inventado o de una cuenta
 * desactivada salen con la misma frase (410): distinguirlos le diría a quien
 * prueba enlaces cuáles fueron reales. Lo que sí se distingue es no haber
 * podido preguntar (503), igual que en el ingreso: «no sé» no es «no sirve».
 */
export const clasificarFalloDelEnlace = (error: unknown): FalloDeRestablecimiento => {
  if (esFalloDeTransporte(error)) {
    return { status: 503, codigo: 'RECUPERACION_NO_DISPONIBLE', mensaje: MENSAJE_NO_DISPONIBLE };
  }
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  if (status === 429 || code === 'over_request_rate_limit') {
    return {
      status: 429,
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: 'Demasiados intentos. Espere unos minutos y vuelva a intentarlo.'
    };
  }
  return { status: 410, codigo: 'ENLACE_INVALIDO', mensaje: MENSAJE_ENLACE_INVALIDO };
};

/**
 * EL ENLACE SIRVIÓ PERO LA CONTRASEÑA NO SE GUARDÓ.
 *
 * `weak_password` es la política de contraseñas del proyecto de Supabase, que
 * puede exigir más que `MIN_CONTRASENA`. Para entonces el enlace ya se canjeó
 * —no hay forma de preguntar antes—, así que el mensaje pide otro enlace en vez
 * de invitar a reintentar con uno gastado.
 */
export const clasificarFalloAlGuardar = (error: unknown): FalloDeRestablecimiento => {
  if (esFalloDeTransporte(error)) {
    return { status: 503, codigo: 'RECUPERACION_NO_DISPONIBLE', mensaje: MENSAJE_NO_DISPONIBLE };
  }
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  if (code === 'weak_password' || status === 422) {
    return {
      status: 400,
      codigo: 'CONTRASENA_RECHAZADA',
      mensaje:
        'El servicio de autenticación rechazó esa contraseña por débil y el enlace ya se usó. Pida otro enlace y elija una contraseña más larga, con letras y números.'
    };
  }
  return {
    status: 502,
    codigo: 'CONTRASENA_NO_GUARDADA',
    mensaje: 'No se pudo guardar la contraseña nueva y el enlace ya se usó. Pida otro enlace.'
  };
};

/** Clase, estado y código de un error de Supabase, para el registro. Nunca su mensaje crudo ni el correo. */
export const describirError = (error: unknown): string => {
  if (error === null || error === undefined) return 'sin error';
  const e = error as { name?: unknown; status?: unknown; code?: unknown };
  const nombre = typeof e.name === 'string' ? e.name : typeof error;
  return `${nombre} status=${String(e.status ?? '—')} code=${String(e.code ?? '—')}`;
};
