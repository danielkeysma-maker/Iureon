import React from 'react';
import { FECHA_MAS_RECIENTE, contarNuevas } from './content/novedades';

/**
 * The «Nuevo» signal for Novedades, and the door the sidebar uses to open it.
 *
 * ─── WHAT IS REMEMBERED, AND WHERE ──────────────────────────────────────────
 *
 * One ISO date in this browser: the newest entry the reader had in front of
 * them the last time they opened Novedades. Entries newer than that count as
 * unseen. It is a per-browser convenience — «you have not looked at this
 * yet» — not a record of anything, so `localStorage` is the right place and
 * every access is wrapped: a private window or a browser that blocks site
 * data simply shows the dot again.
 *
 * ─── WHY A TINY STORE AND NOT APP STATE ─────────────────────────────────────
 *
 * The version stamp in the sidebar and the manual index both draw the dot,
 * and the stamp has to open Manual → Novedades. Threading that through App
 * would touch a component that owns thirty other things; a module-level
 * store with `useSyncExternalStore` keeps every reader in step without it.
 */

const CLAVE_VISTAS = 'iureon.novedades.vistas';

const oyentes = new Set<() => void>();
const suscribir = (fn: () => void): (() => void) => {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
};
const avisar = (): void => {
  oyentes.forEach((fn) => fn());
};

const leerVistas = (): string | null => {
  try {
    return window.localStorage.getItem(CLAVE_VISTAS);
  } catch {
    return null;
  }
};

/** Called by the panel once it is on screen: everything up to today is now seen. */
export const marcarNovedadesVistas = (): void => {
  try {
    window.localStorage.setItem(CLAVE_VISTAS, FECHA_MAS_RECIENTE);
  } catch {
    /* Sin almacenamiento el punto vuelve a salir la próxima vez. Nada que hacer. */
  }
  avisar();
};

/** The date the reader last saw, read once at mount — to mark what is new SINCE then. */
export const vistasHasta = leerVistas;

/** How many entries the reader has not seen. Re-renders when the panel marks them. */
export const useNovedadesNuevas = (): number => {
  const vistas = React.useSyncExternalStore(suscribir, leerVistas, () => null);
  return contarNuevas(vistas);
};

/* ─── OPENING FROM OUTSIDE THE MANUAL ───────────────────────────────────────
 *
 * A request is a serial number plus the moment it was made. The manual views
 * (desktop and mobile are BOTH mounted, one hidden by CSS) each react to a
 * change of serial, and on mount only honour a request younger than a couple
 * of seconds — so navigating back to the manual an hour later does not reopen
 * Novedades because of a click long since served.
 */

interface Solicitud {
  readonly n: number;
  readonly en: number;
}

let solicitud: Solicitud = { n: 0, en: 0 };
const leerSolicitud = (): Solicitud => solicitud;
const VENTANA_MS = 2000;

/** The sidebar stamp calls this, then navigates to the manual. */
export const solicitarAbrirNovedades = (): void => {
  solicitud = { n: solicitud.n + 1, en: Date.now() };
  avisar();
};

/** Opens Novedades in the calling view when a request arrives, or arrived just now. */
export const useAperturaNovedades = (abrir: () => void): void => {
  const actual = React.useSyncExternalStore(suscribir, leerSolicitud, leerSolicitud);
  React.useEffect(() => {
    if (actual.n > 0 && Date.now() - actual.en < VENTANA_MS) abrir();
  }, [actual, abrir]);
};
