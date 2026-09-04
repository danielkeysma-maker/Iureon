import { pushApi } from './push.api';

/**
 * Lo que el navegador sabe de los avisos en ESTE dispositivo.
 *
 * Una suscripción vive en el navegador, no en la cuenta: el mismo abogado
 * puede tenerlos activados en el teléfono y no en el portátil. Por eso todo
 * aquí pregunta al `pushManager` local y solo después al servidor.
 */

export type EstadoDeAvisos =
  | 'cargando'
  /** El navegador no tiene Push API (o no hay service worker registrado). */
  | 'no-soportado'
  /** iPhone/iPad en Safari sin añadir a inicio: Apple solo permite push a la app instalada. */
  | 'ios-sin-instalar'
  /** El servidor no tiene llaves VAPID: no es culpa del dispositivo. */
  | 'servidor-sin-llaves'
  /** El usuario dijo que no; el navegador no vuelve a preguntar hasta que lo cambie en sus ajustes. */
  | 'denegado'
  | 'activados'
  | 'desactivados';

export const soportaPush = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const esIOS = (): boolean =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  // iPadOS se presenta como Mac, pero un Mac no tiene pantalla táctil.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Abierta desde el icono de inicio, no desde una pestaña. */
export const enStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** La llave VAPID viene en base64 «URL-safe»; `subscribe` la quiere como bytes. */
export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = window.atob(normal);
  const bytes = new Uint8Array(crudo.length);
  for (let i = 0; i < crudo.length; i += 1) bytes[i] = crudo.charCodeAt(i);
  return bytes;
};

/**
 * El service worker activo, o null. `navigator.serviceWorker.ready` no
 * resuelve nunca si no hay registro (por ejemplo, en el servidor de
 * desarrollo con otro host), así que se le pone plazo.
 */
const workerListo = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!soportaPush()) return null;
  const registro = await navigator.serviceWorker.getRegistration('/');
  if (!registro) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
  ]);
};

export const suscripcionActual = async (): Promise<PushSubscription | null> => {
  const registro = await workerListo();
  return registro ? registro.pushManager.getSubscription() : null;
};

export const leerEstado = async (): Promise<EstadoDeAvisos> => {
  if (!soportaPush()) return esIOS() && !enStandalone() ? 'ios-sin-instalar' : 'no-soportado';
  if (Notification.permission === 'denied') return 'denegado';
  const registro = await workerListo();
  if (!registro) return 'no-soportado';
  const suscripcion = await registro.pushManager.getSubscription();
  return suscripcion ? 'activados' : 'desactivados';
};

/**
 * Pide permiso, suscribe este navegador y se lo entrega al servidor. Si el
 * servidor rechaza la suscripción, se deshace la local: una suscripción que
 * el servidor no conoce no recibe nada y confundiría el estado.
 */
export const activarAvisos = async (): Promise<EstadoDeAvisos> => {
  const { enabled, publicKey } = await pushApi.llavePublica();
  if (!enabled || !publicKey) return 'servidor-sin-llaves';

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso === 'denied' ? 'denegado' : 'desactivados';

  const registro = await workerListo();
  if (!registro) return 'no-soportado';

  const existente = await registro.pushManager.getSubscription();
  const suscripcion =
    existente ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
    }));

  try {
    await pushApi.suscribir(suscripcion.toJSON());
  } catch (error) {
    if (!existente) await suscripcion.unsubscribe();
    throw error;
  }
  return 'activados';
};

/** Da de baja los dos lados: el navegador y el servidor. */
export const desactivarAvisos = async (): Promise<EstadoDeAvisos> => {
  const suscripcion = await suscripcionActual();
  if (!suscripcion) return 'desactivados';
  const endpoint = suscripcion.endpoint;
  await suscripcion.unsubscribe();
  try {
    await pushApi.cancelar(endpoint);
  } catch {
    /* El servidor lo borrará solo al primer envío fallido (410). */
  }
  return 'desactivados';
};

/**
 * Al abrir la aplicación con una suscripción viva, se le reenvía al servidor.
 * Cuesta una llamada y cubre dos casos reales: la fila se perdió (o la tabla
 * se creó después) y el rol del usuario cambió desde que se suscribió.
 */
export const renovarSuscripcionSiExiste = async (): Promise<void> => {
  try {
    const suscripcion = await suscripcionActual();
    if (suscripcion) await pushApi.suscribir(suscripcion.toJSON());
  } catch {
    /* Silencioso: es mantenimiento, no una acción del usuario. */
  }
};
