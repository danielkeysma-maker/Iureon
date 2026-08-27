import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import { aplicarLoUltimoConocido } from './modules/settings/preferences';

/*
 * El tema se aplica ANTES de montar React.
 *
 * Si se esperara al primer render, quien tiene tema oscuro vería un destello
 * blanco en cada carga. Se pinta con lo último que se supo —guardado en el
 * navegador— y el valor del servidor llega después sin que se note.
 */
aplicarLoUltimoConocido()
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
