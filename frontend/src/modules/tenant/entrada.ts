import { readSession } from '../auth/session';
import { sesionDeVistaPreviaLocal } from '../auth/vistaPreviaLocal';
import { resolverEntrada } from './rutas';

/**
 * LA DIRECCIÓN CON LA QUE ARRANCA LA APLICACIÓN, PUESTA EN ORDEN ANTES DE REACT.
 *
 * Se llama desde `main.tsx` antes de montar, y tiene que ser ahí: el enlace del
 * correo de recuperación viejo (la raíz con la marca `restablecer` en la
 * consulta y el token en el fragmento) debe quedar como
 * `/restablecer#token_hash=…` ANTES de que `enlaceDeRecuperacion.ts` lea y
 * borre el token en el primer render. Hacerlo después perdería el fragmento.
 *
 * La decisión es de `resolverEntrada` (pura, probada en `check:rutas`); aquí
 * solo se aplica. Devuelve `false` cuando la página se va a otra dirección
 * (la portada), para no montar una aplicación que el navegador ya abandona.
 */
export const ponerEnOrdenLaDireccion = (): boolean => {
  const haySesion = Boolean(sesionDeVistaPreviaLocal() ?? readSession());
  const accion = resolverEntrada(
    { pathname: window.location.pathname, search: window.location.search, hash: window.location.hash },
    haySesion
  );
  if (accion.tipo === 'cargar') {
    window.location.replace(accion.url);
    return false;
  }
  if (accion.tipo === 'reemplazar') window.history.replaceState(null, '', accion.url);
  return true;
};
