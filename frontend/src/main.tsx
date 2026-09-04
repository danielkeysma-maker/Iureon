import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import { aplicarLoUltimoConocido } from './modules/settings/preferences';
// Registra el oyente de `beforeinstallprompt` antes de que React monte: el evento llega una sola vez y temprano.
import './modules/pwa/instalable';

/*
 * El tema se aplica ANTES de montar React.
 *
 * Si se esperara al primer render, quien tiene tema oscuro vería un destello
 * blanco en cada carga. Se pinta con lo último que se supo —guardado en el
 * navegador— y el valor del servidor llega después sin que se note.
 */
aplicarLoUltimoConocido()
import App from './App.tsx'

/*
 * El service worker existe para dos cosas: que el navegador ofrezca «Instalar»
 * y que los avisos por Web Push lleguen con la pestaña cerrada. NO cachea la
 * aplicación (ver `public/sw.js`). Solo en producción o en localhost: en el
 * servidor de desarrollo de Vite un worker registrado sobrevive al reinicio y
 * confunde cada recarga.
 */
if ('serviceWorker' in navigator && (import.meta.env.PROD || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[PWA] No se pudo registrar el service worker:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
