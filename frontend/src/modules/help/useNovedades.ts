import React from 'react';
import { NOVEDADES } from './content/novedades';
import { contarNuevas, fechaMasReciente, visiblesParaRol } from './novedades.logica';

/**
 * La señal «Nuevo» de Novedades.
 *
 * ─── QUÉ SE RECUERDA, Y DÓNDE ───────────────────────────────────────────────
 *
 * Una fecha ISO EN ESTE NAVEGADOR (no por usuario ni en el servidor): la de la
 * entrada más reciente que el lector tenía delante la última vez que salió de
 * Novedades o pulsó «Marcar todo como visto». Es una comodidad —«esto no lo ha
 * mirado»—, no un registro de nada, así que `localStorage` es su sitio y todo
 * acceso va envuelto: una ventana privada simplemente vuelve a mostrar el punto.
 * La clave es la misma de antes, para no volver a marcar como nuevo lo que ya
 * se vio cuando Novedades vivía dentro del Manual.
 *
 * ─── POR QUÉ UN ALMACÉN MÍNIMO Y NO ESTADO DE LA APLICACIÓN ─────────────────
 *
 * El panel lateral (contador y punto del sello de versión) y la propia página
 * leen la misma señal; `useSyncExternalStore` los mantiene al paso sin pasar
 * nada por `App`. Abrir Novedades ya no necesita una «solicitud» aparte: es un
 * módulo de la barra y se llega a él como a cualquier otro.
 */

const CLAVE_VISTAS = 'iureon.novedades.vistas';

const oyentes = new Set<() => void>();
const suscribir = (fn: () => void): (() => void) => {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
};

const leerVistas = (): string | null => {
  try {
    return window.localStorage.getItem(CLAVE_VISTAS);
  } catch {
    return null;
  }
};

/** Todo lo publicado hasta hoy queda visto para este navegador. */
export const marcarNovedadesVistas = (): void => {
  try {
    window.localStorage.setItem(CLAVE_VISTAS, fechaMasReciente(NOVEDADES));
  } catch {
    /* Sin almacenamiento el punto vuelve a salir la próxima vez. Nada que hacer. */
  }
  oyentes.forEach((fn) => fn());
};

/** La fecha que el lector vio por última vez; se lee una vez al entrar, para marcar lo nuevo DESDE entonces. */
export const vistasHasta = leerVistas;

/**
 * Cuántas novedades no ha visto: solo las que su rol ve y, con el plan ya
 * leído, solo las que le afectan. Sin plan cuenta todas las nuevas.
 */
export const useNovedadesNuevas = (modulosPermitidos: readonly string[] | null, esOperador: boolean): number => {
  const vistas = React.useSyncExternalStore(suscribir, leerVistas, () => null);
  return React.useMemo(
    () => contarNuevas(visiblesParaRol(NOVEDADES, esOperador), vistas, modulosPermitidos),
    [vistas, modulosPermitidos, esOperador]
  );
};
