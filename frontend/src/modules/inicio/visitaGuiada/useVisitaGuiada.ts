import React from 'react';
import type { MainView } from '../../tenant/types';
import { PASOS_DE_VISITA, type PasoDeVisita } from './pasos';

/**
 * The state of the guided tour: which stop is open, and whether this browser
 * has ever been offered it.
 *
 * ─── WHAT IS REMEMBERED, AND WHERE ──────────────────────────────────────────
 *
 * One flag in `localStorage`: the tour was completed, or declined, in this
 * browser. It is a per-browser convenience — «do not offer it again» — and
 * not a record of anything, so `localStorage` is the right place and every
 * access is wrapped: a private window simply sees the invitation again.
 *
 * ─── WHY THE HOOK LIVES IN `App` ────────────────────────────────────────────
 *
 * Every stop first opens its module and only then measures the element to
 * highlight. Opening a module is `setMainView`, which only `App` owns; the
 * overlay is drawn at the root so it sits above every layout. Inicio and the
 * manual receive `iniciar` as a prop and know nothing else.
 *
 * ─── SKIPPING ───────────────────────────────────────────────────────────────
 *
 * A stop whose module the plan hides is skipped here, before navigating:
 * `App` sends a hidden view back to Inicio, and the tour would have pointed
 * at the wrong screen. A stop whose element cannot be found on screen is
 * skipped by the overlay, which is the only one that can measure; it calls
 * `saltar` with the direction the reader was moving in.
 */

const CLAVE = 'iureon.visita.completada';

const leerCompletada = (): boolean => {
  try {
    return window.localStorage.getItem(CLAVE) === '1';
  } catch {
    return true; // Without storage the invitation would return on every load; better not to nag.
  }
};

const marcarCompletada = (): void => {
  try {
    window.localStorage.setItem(CLAVE, '1');
  } catch {
    /* Sin almacenamiento la invitación vuelve a salir; nada que hacer. */
  }
};

export type Direccion = 1 | -1;

export interface VisitaGuiada {
  /** The open stop, or `null` when the tour is not running. */
  paso: PasoDeVisita | null;
  /** 1-based position among the stops the plan allows, for «3 de 12». */
  numero: number;
  total: number;
  /** True while this browser has never accepted nor declined the tour. */
  invitacionPendiente: boolean;
  iniciar: () => void;
  siguiente: () => void;
  anterior: () => void;
  /** The overlay could not find the stop's element: move on in the same direction. */
  saltar: (direccion: Direccion) => void;
  salir: () => void;
  declinarInvitacion: () => void;
}

interface Opciones {
  setMainView: (view: MainView) => void;
  /** Modules the plan hides: their stops are left out. */
  ocultas: readonly MainView[];
  /** Runs when the tour ends, by finishing or by leaving. */
  alTerminar?: () => void;
}

export const useVisitaGuiada = ({ setMainView, ocultas, alTerminar }: Opciones): VisitaGuiada => {
  const [indice, setIndice] = React.useState<number | null>(null);
  const [invitacionPendiente, setInvitacionPendiente] = React.useState(() => !leerCompletada());

  const pasos = React.useMemo(
    () => PASOS_DE_VISITA.filter((p) => !p.vista || !ocultas.includes(p.vista)),
    [ocultas]
  );

  const setMainViewRef = React.useRef(setMainView);
  setMainViewRef.current = setMainView;
  const alTerminarRef = React.useRef(alTerminar);
  alTerminarRef.current = alTerminar;

  /* Opening a stop opens its module first; the overlay measures afterwards. */
  const abrir = React.useCallback(
    (i: number) => {
      const paso = pasos[i];
      if (!paso) return;
      if (paso.vista) setMainViewRef.current(paso.vista);
      setIndice(i);
    },
    [pasos]
  );

  const terminar = React.useCallback(() => {
    setIndice(null);
    marcarCompletada();
    setInvitacionPendiente(false);
    alTerminarRef.current?.();
  }, []);

  const iniciar = React.useCallback(() => {
    marcarCompletada();
    setInvitacionPendiente(false);
    abrir(0);
  }, [abrir]);

  const mover = React.useCallback(
    (direccion: Direccion) => {
      if (indice === null) return;
      const destino = indice + direccion;
      /*
       * Going back past the first stop happens only when the first stop's
       * element is missing on the way back: move forward again instead of
       * leaving the overlay with nothing to point at.
       */
      if (destino < 0) {
        if (indice + 1 < pasos.length) abrir(indice + 1);
        else terminar();
        return;
      }
      if (destino >= pasos.length) {
        terminar();
        return;
      }
      abrir(destino);
    },
    [indice, pasos.length, abrir, terminar]
  );

  const declinarInvitacion = React.useCallback(() => {
    marcarCompletada();
    setInvitacionPendiente(false);
  }, []);

  return {
    paso: indice === null ? null : (pasos[indice] ?? null),
    numero: indice === null ? 0 : indice + 1,
    total: pasos.length,
    invitacionPendiente,
    iniciar,
    siguiente: () => mover(1),
    anterior: () => mover(-1),
    saltar: mover,
    salir: terminar,
    declinarInvitacion
  };
};
