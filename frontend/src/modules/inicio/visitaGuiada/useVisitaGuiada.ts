import React from 'react';
import type { MainView } from '../../tenant/types';
import { PUERTAS_DE_INICIO, type PuertaDeInicio } from '../puertas';
import { agruparEnCapitulos, type CapituloDeVisita } from './capitulos';
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
 *
 * ─── PUERTA, PARADAS Y CIERRE ───────────────────────────────────────────────
 *
 * La visita vieja empezaba en la primera parada y terminaba devolviendo a
 * Inicio sin decir nada. Ahora tiene tres fases: la PUERTA dice los capítulos
 * con su duración y deja entrar por cualquiera; las PARADAS son las de siempre;
 * el CIERRE ofrece tres cosas concretas para empezar. `iniciar` abre la puerta,
 * así que los dos sitios que ya la llamaban —Inicio y el manual— la estrenan
 * sin cambiar.
 *
 * Salir desde la puerta no lleva a Inicio: no se había movido nada y mandar al
 * lector a otra pantalla por cerrar un diálogo sería un salto sin motivo. Salir
 * de una parada sí, como antes, porque la visita ya lo había llevado de módulo
 * en módulo.
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
export type FaseDeVisita = 'puerta' | 'paso' | 'cierre';

export interface VisitaGuiada {
  /** `null` cuando la visita no está abierta. */
  fase: FaseDeVisita | null;
  /** The open stop, or `null` outside the «paso» phase. */
  paso: PasoDeVisita | null;
  /** 1-based position among the stops the plan allows. */
  numero: number;
  total: number;
  /** Los capítulos que el plan deja ver, con sus paradas y su duración. */
  capitulos: readonly CapituloDeVisita[];
  /** El capítulo de la parada abierta. */
  capitulo: CapituloDeVisita | null;
  /** 1-based position of the open stop inside its chapter. */
  paradaEnCapitulo: number;
  /** Tres puertas de Inicio a módulos que el plan incluye, para el cierre. */
  paraEmpezar: readonly PuertaDeInicio[];
  /** True while this browser has never accepted nor declined the tour. */
  invitacionPendiente: boolean;
  /** Abre la puerta de la visita. */
  iniciar: () => void;
  /** Entra a la primera parada de un capítulo (índice 0-based). */
  empezar: (capitulo?: number) => void;
  siguiente: () => void;
  anterior: () => void;
  /** The overlay could not find the stop's element: move on in the same direction. */
  saltar: (direccion: Direccion) => void;
  salir: () => void;
  /** Cierra la visita y abre un módulo, sin pasar por Inicio. */
  irA: (vista: MainView) => void;
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
  const [fase, setFase] = React.useState<FaseDeVisita | null>(null);
  const [indice, setIndice] = React.useState<number | null>(null);
  const [invitacionPendiente, setInvitacionPendiente] = React.useState(() => !leerCompletada());

  const pasos = React.useMemo(
    () => PASOS_DE_VISITA.filter((p) => !p.vista || !ocultas.includes(p.vista)),
    [ocultas]
  );
  const capitulos = React.useMemo(() => agruparEnCapitulos(pasos), [pasos]);

  /*
   * EL CIERRE OFRECE LO QUE SE PUEDE ABRIR. Las puertas de Inicio, en su orden,
   * sin las que el plan oculta y sin «Me llegó un documento», que necesita el
   * traspaso de Inicio a Revisiones para abrir el diálogo ya en modo recibido:
   * desde aquí llevaría a una lista y no a lo que la tarjeta promete.
   */
  const paraEmpezar = React.useMemo(
    () => PUERTAS_DE_INICIO.filter((p) => !p.abreDocumentoRecibido && !ocultas.includes(p.destino)).slice(0, 3),
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
      setFase('paso');
    },
    [pasos]
  );

  const cerrarSinMover = React.useCallback(() => {
    setIndice(null);
    setFase(null);
    marcarCompletada();
    setInvitacionPendiente(false);
  }, []);

  const terminar = React.useCallback(() => {
    cerrarSinMover();
    alTerminarRef.current?.();
  }, [cerrarSinMover]);

  const iniciar = React.useCallback(() => {
    marcarCompletada();
    setInvitacionPendiente(false);
    setIndice(null);
    setFase('puerta');
  }, []);

  const empezar = React.useCallback(
    (capitulo = 0) => {
      const destino = capitulos[capitulo]?.pasos[0];
      const i = destino ? pasos.indexOf(destino) : 0;
      abrir(i < 0 ? 0 : i);
    },
    [capitulos, pasos, abrir]
  );

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
        else setFase('cierre');
        return;
      }
      if (destino >= pasos.length) {
        setIndice(null);
        setFase('cierre');
        return;
      }
      abrir(destino);
    },
    [indice, pasos.length, abrir]
  );

  const salir = React.useCallback(() => {
    if (fase === 'puerta') cerrarSinMover();
    else terminar();
  }, [fase, cerrarSinMover, terminar]);

  const irA = React.useCallback(
    (vista: MainView) => {
      cerrarSinMover();
      setMainViewRef.current(vista);
    },
    [cerrarSinMover]
  );

  const declinarInvitacion = React.useCallback(() => {
    marcarCompletada();
    setInvitacionPendiente(false);
  }, []);

  const paso = fase === 'paso' && indice !== null ? (pasos[indice] ?? null) : null;
  const capitulo = paso ? (capitulos.find((c) => c.id === paso.capitulo) ?? null) : null;

  return {
    fase,
    paso,
    numero: indice === null ? 0 : indice + 1,
    total: pasos.length,
    capitulos,
    capitulo,
    paradaEnCapitulo: paso && capitulo ? capitulo.pasos.indexOf(paso) + 1 : 0,
    paraEmpezar,
    invitacionPendiente,
    iniciar,
    empezar,
    siguiente: () => mover(1),
    anterior: () => mover(-1),
    saltar: mover,
    salir,
    irA,
    declinarInvitacion
  };
};
