import webpush, { WebPushError, type PushSubscription as SuscripcionWebPush } from 'web-push';
import { config } from '../../config/env.config';
import { supabase } from '../../config/supabase.config';
import { auditService } from '../audit/audit.service';

/**
 * Avisos por Web Push.
 *
 * ─── POR QUÉ PUSH Y NO CORREO ───────────────────────────────────────────────
 *
 * Este backend no tiene correo saliente: ni proveedor SMTP, ni plantillas, ni
 * cola. Web Push no necesita nada de eso: el navegador entrega el aviso por el
 * servicio de su fabricante (Google, Apple, Mozilla) sin cuenta ni costo, y
 * llega al teléfono aunque la pestaña esté cerrada. Lo único que hace falta es
 * un par de llaves VAPID, que se generan una vez y no caducan.
 *
 * ─── QUÉ SE GUARDA Y POR QUÉ ────────────────────────────────────────────────
 *
 * Una suscripción es UN NAVEGADOR EN UN DISPOSITIVO, no una persona: el mismo
 * abogado puede tener tres (teléfono, portátil, computador de la oficina). Se
 * guarda con la firma y el correo para poder avisar «a toda la firma menos a
 * quien actuó», y con el ROL porque el operador de la plataforma no pertenece
 * a la firma que escribe: para encontrarlo hay que preguntar por su rol, no
 * por su firma.
 *
 * ─── NUNCA ROMPE AL QUE LLAMA ───────────────────────────────────────────────
 *
 * Un aviso que no sale es una molestia; un mensaje de soporte que no se guarda
 * porque el aviso falló es un defecto. Todas las funciones de envío atrapan
 * sus errores, los registran con el prefijo `[PUSH]` y devuelven cuántos
 * salieron y cuántos no. Con las llaves ausentes devuelven ceros al instante.
 *
 * ─── ANTES DE RESPONDER ─────────────────────────────────────────────────────
 *
 * Una función serverless se congela al enviar la respuesta. Quien llame a
 * `enviarAFirma` o `enviarAlOperador` debe hacer `await` ANTES de `res.json`;
 * lanzarlo «en segundo plano» equivale a no lanzarlo en producción.
 */

export interface Aviso {
  title: string;
  body: string;
  /** Adónde lleva el toque: un camino relativo que `App.tsx` sabe abrir. */
  url: string;
  /** Agrupa: dos avisos con el mismo tag se reemplazan en vez de apilarse. */
  tag: string;
}

export interface ResultadoDeEnvio {
  enviados: number;
  fallidos: number;
}

export class PushError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'PushError';
  }
}

interface PushSubscriptionRow {
  id: string;
  firm_id: string;
  user_email: string;
  role: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string | null;
  failed_at: string | null;
}

/** Tope de destinatarios por envío: una firma no tiene más de 50 navegadores activos y una función serverless tiene su propio reloj. */
const MAX_SUSCRIPCIONES = 50;
/** Un servicio de push que no contesta en 8 s no va a contestar; no se espera más. */
const TIMEOUT_MS = 8_000;
/** Lo que el navegador muestra en una línea. */
const CUERPO_MAX = 140;

const SIN_ENVIO: ResultadoDeEnvio = { enviados: 0, fallidos: 0 };

let configurado = false;

/**
 * Le entrega a web-push las llaves VAPID. Se llama una vez por proceso; sin
 * llaves no hace nada y el resto del módulo responde como apagado.
 */
export const configurarWebPush = (): boolean => {
  if (configurado) return true;
  if (!config.push.enabled) return false;
  webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
  configurado = true;
  return true;
};

export const pushHabilitado = (): boolean => config.push.enabled;

export const llavePublica = (): string => config.push.publicKey;

const requireClient = () => {
  if (!supabase) {
    throw new PushError('DATABASE_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

const requirePush = (): void => {
  if (!config.push.enabled) {
    throw new PushError(
      'PUSH_DISABLED',
      'Los avisos no están configurados en este servidor: faltan las llaves VAPID.',
      503
    );
  }
};

/** Recorta un texto para el cuerpo del aviso, sin partir la última palabra a medias si se puede. */
export const vistaPreviaDeAviso = (texto: string, max = CUERPO_MAX): string => {
  const plano = texto.replace(/\s+/g, ' ').trim();
  if (plano.length <= max) return plano;
  const corte = plano.lastIndexOf(' ', max - 1);
  return `${plano.slice(0, corte > max / 2 ? corte : max - 1)}…`;
};

/** La forma que manda el navegador con `pushManager.subscribe()`. */
export interface SuscripcionDelNavegador {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const suscripcionValida = (valor: unknown): SuscripcionDelNavegador => {
  const s = valor as Partial<SuscripcionDelNavegador> | null;
  const endpoint = typeof s?.endpoint === 'string' ? s.endpoint.trim() : '';
  const p256dh = typeof s?.keys?.p256dh === 'string' ? s.keys.p256dh : '';
  const auth = typeof s?.keys?.auth === 'string' ? s.keys.auth : '';
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 2000 || !p256dh || !auth) {
    throw new PushError('INVALID_SUBSCRIPTION', 'La suscripción del navegador no tiene la forma esperada.', 400);
  }
  return { endpoint, keys: { p256dh, auth } };
};

/**
 * Registra (o renueva) la suscripción de un navegador. Upsert por endpoint:
 * el navegador puede volver a mandar la misma tras recargar, y una fila
 * duplicada sería dos avisos iguales en el mismo teléfono.
 */
export const suscribir = async (input: {
  firmId: string;
  userEmail: string;
  role: string;
  subscription: unknown;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<void> => {
  requirePush();
  const client = requireClient();
  const s = suscripcionValida(input.subscription);

  const { error } = await client.from('push_subscriptions').upsert(
    {
      firm_id: input.firmId,
      user_email: input.userEmail,
      role: input.role,
      endpoint: s.endpoint,
      p256dh: s.keys.p256dh,
      auth: s.keys.auth,
      user_agent: input.userAgent ? input.userAgent.slice(0, 300) : null,
      failed_at: null
    },
    { onConflict: 'endpoint' }
  );

  if (error) throw new PushError('SUBSCRIBE_FAILED', error.message, 500);

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.userEmail,
    action: 'PUSH_SUBSCRIBED',
    resource: 'Avisos activados en un dispositivo',
    ipAddress: input.ipAddress ?? null
  });
};

/**
 * Borra la suscripción de un navegador. Solo la propia: el endpoint es un
 * secreto del navegador, pero exigir además el correo evita que una sesión
 * borre la de otra si el secreto se filtró.
 */
export const cancelar = async (input: {
  endpoint: string;
  userEmail: string;
  firmId: string;
  ipAddress?: string | null;
}): Promise<void> => {
  const client = requireClient();
  const endpoint = typeof input.endpoint === 'string' ? input.endpoint.trim() : '';
  if (!endpoint) throw new PushError('INVALID_SUBSCRIPTION', 'Falta el endpoint.', 400);

  const { error } = await client
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_email', input.userEmail);

  if (error) throw new PushError('UNSUBSCRIBE_FAILED', error.message, 500);

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.userEmail,
    action: 'PUSH_UNSUBSCRIBED',
    resource: 'Avisos desactivados en un dispositivo',
    ipAddress: input.ipAddress ?? null
  });
};

/** Cuántos navegadores tiene suscritos este usuario. Para la pantalla de estado. */
export const contarDelUsuario = async (userEmail: string): Promise<number> => {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', userEmail);
  if (error) {
    console.error('[PUSH] No se pudo contar suscripciones:', error.message);
    return 0;
  }
  return count ?? 0;
};

const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error(`Sin respuesta del servicio de push en ${ms} ms`)), ms);
    promesa.then(
      (v) => {
        clearTimeout(reloj);
        resolve(v);
      },
      (e) => {
        clearTimeout(reloj);
        reject(e);
      }
    );
  });

/**
 * Envía el aviso a una lista de suscripciones y limpia lo que el servicio
 * declara muerto. 404 y 410 significan «este navegador ya no existe» (el
 * usuario revocó el permiso o desinstaló): se borra la fila, porque reintentar
 * para siempre solo gasta tiempo de función. Cualquier otro fallo se anota en
 * `failed_at` y la fila se queda: un servicio caído un minuto no es un
 * dispositivo perdido.
 */
const enviarA = async (filas: PushSubscriptionRow[], aviso: Aviso): Promise<ResultadoDeEnvio> => {
  if (!configurarWebPush()) return SIN_ENVIO;
  const client = supabase;
  if (!client || filas.length === 0) return SIN_ENVIO;

  const destinos = filas.slice(0, MAX_SUSCRIPCIONES);
  const payload = JSON.stringify({
    title: aviso.title,
    body: vistaPreviaDeAviso(aviso.body),
    url: aviso.url,
    tag: aviso.tag
  });

  const resultados = await Promise.allSettled(
    destinos.map((fila) => {
      const suscripcion: SuscripcionWebPush = {
        endpoint: fila.endpoint,
        keys: { p256dh: fila.p256dh, auth: fila.auth }
      };
      return conPlazo(webpush.sendNotification(suscripcion, payload, { TTL: 60 * 60 * 24 }), TIMEOUT_MS);
    })
  );

  const ahora = new Date().toISOString();
  const exitosos: string[] = [];
  const muertos: string[] = [];
  const fallados: string[] = [];

  resultados.forEach((r, i) => {
    const fila = destinos[i];
    if (r.status === 'fulfilled') {
      exitosos.push(fila.id);
      return;
    }
    const codigo = r.reason instanceof WebPushError ? r.reason.statusCode : null;
    if (codigo === 404 || codigo === 410) {
      muertos.push(fila.id);
    } else {
      fallados.push(fila.id);
      const motivo = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.warn(`[PUSH] Fallo al enviar a ${fila.user_email} (${codigo ?? 'sin código'}): ${motivo}`);
    }
  });

  // Las tres escrituras se esperan: después de responder no corre nada.
  if (exitosos.length > 0) {
    await client.from('push_subscriptions').update({ last_used_at: ahora, failed_at: null }).in('id', exitosos);
  }
  if (muertos.length > 0) {
    await client.from('push_subscriptions').delete().in('id', muertos);
  }
  if (fallados.length > 0) {
    await client.from('push_subscriptions').update({ failed_at: ahora }).in('id', fallados);
  }

  return { enviados: exitosos.length, fallidos: muertos.length + fallados.length };
};

type Consulta = ReturnType<ReturnType<NonNullable<typeof supabase>['from']>['select']>;

const leerSuscripciones = async (filtrar: (q: Consulta) => Consulta): Promise<PushSubscriptionRow[]> => {
  if (!supabase) return [];
  const { data, error } = await filtrar(supabase.from('push_subscriptions').select('*')).limit(MAX_SUSCRIPCIONES);
  if (error) {
    console.error('[PUSH] No se pudieron leer suscripciones:', error.message);
    return [];
  }
  return (data ?? []) as PushSubscriptionRow[];
};

/**
 * A todos los navegadores de la firma, menos los del actor: quien escribió
 * el mensaje no necesita que su propio teléfono se lo cuente.
 */
export const enviarAFirma = async (input: {
  firmId: string;
  exceptoEmail?: string | null;
  aviso: Aviso;
}): Promise<ResultadoDeEnvio> => {
  if (!config.push.enabled) return SIN_ENVIO;
  try {
    const filas = await leerSuscripciones((q) => {
      const propias = q.eq('firm_id', input.firmId);
      return input.exceptoEmail ? propias.neq('user_email', input.exceptoEmail) : propias;
    });
    return await enviarA(filas, input.aviso);
  } catch (error) {
    console.error('[PUSH] enviarAFirma falló:', error instanceof Error ? error.message : error);
    return SIN_ENVIO;
  }
};

/** A quien opera la plataforma, esté donde esté: se le encuentra por el rol, no por la firma. */
export const enviarAlOperador = async (aviso: Aviso): Promise<ResultadoDeEnvio> => {
  if (!config.push.enabled) return SIN_ENVIO;
  try {
    const filas = await leerSuscripciones((q) => q.eq('role', 'SUPER_ADMIN'));
    return await enviarA(filas, aviso);
  } catch (error) {
    console.error('[PUSH] enviarAlOperador falló:', error instanceof Error ? error.message : error);
    return SIN_ENVIO;
  }
};

/** Un aviso de prueba a los navegadores del propio usuario, para comprobar que el camino entero funciona. */
export const enviarPrueba = async (input: { userEmail: string }): Promise<ResultadoDeEnvio> => {
  requirePush();
  try {
    const filas = await leerSuscripciones((q) => q.eq('user_email', input.userEmail));
    return await enviarA(filas, {
      title: 'Prueba de avisos de Iureon',
      body: 'Si lee esto, los avisos llegan a este dispositivo.',
      url: '/',
      tag: 'prueba'
    });
  } catch (error) {
    console.error('[PUSH] enviarPrueba falló:', error instanceof Error ? error.message : error);
    return SIN_ENVIO;
  }
};
