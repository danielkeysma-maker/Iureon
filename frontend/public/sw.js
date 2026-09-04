/*
 * Service worker de Iureon.
 *
 * ─── NO CACHEA LA APLICACIÓN, Y ES A PROPÓSITO ──────────────────────────────
 *
 * Un service worker que guarda el «app shell» sirve el bundle de ayer hasta
 * que decide actualizarse, y en esta casa ya está documentado lo que cuesta
 * una pestaña vieja: exporta con el código viejo y nadie sabe por qué. Sin
 * conexión no hay nada útil que hacer aquí —todo pasa por el servidor—, así
 * que un bundle rancio haría más daño que el poco bien que hace un «offline».
 *
 * Existe por dos razones: (1) algunos navegadores exigen un service worker
 * con manejador de `fetch` para ofrecer «Instalar»; (2) los avisos por Web
 * Push solo se reciben aquí, con la pestaña cerrada o abierta.
 */

self.addEventListener('install', () => {
  // Sin caché que preparar: el nuevo worker toma el control sin esperar.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo navegaciones, y solo de paso: la red decide, como si no hubiera worker.
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request));
});

/*
 * El aviso llega como JSON {title, body, url, tag}. `renotify` por tag: un
 * segundo mensaje del mismo hilo de soporte reemplaza al anterior y vuelve
 * a sonar, en vez de apilar tres tarjetas iguales.
 */
self.addEventListener('push', (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : '' };
  }
  const titulo = datos.title || 'Iureon';
  const opciones = {
    body: datos.body || '',
    icon: '/pwa/icon-192.png',
    badge: '/pwa/badge-96.png',
    tag: datos.tag || 'iureon',
    renotify: Boolean(datos.tag),
    data: { url: datos.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

/*
 * Al tocar el aviso: si hay una pestaña de Iureon abierta se le pide que
 * navegue (postMessage) y se trae al frente; si no, se abre una nueva con la
 * URL del aviso. `App.tsx` lee `?ir=` y el mensaje {type:'abrir', url}.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  const destino = new URL(url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientes) => {
      const abierta = clientes.find((c) => new URL(c.url).origin === self.location.origin);
      if (abierta) {
        abierta.postMessage({ type: 'abrir', url: destino });
        return 'focus' in abierta ? abierta.focus() : undefined;
      }
      return self.clients.openWindow(destino);
    })
  );
});
