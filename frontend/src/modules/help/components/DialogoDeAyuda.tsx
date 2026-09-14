import React from 'react';
import { createPortal } from 'react-dom';

/**
 * La cáscara de los diálogos de Aprender: la puerta y el cierre de la visita,
 * «Nueva conversación» de soporte y la solicitud de acceso de soporte.
 *
 * ─── DE DÓNDE SALE LA FORMA ─────────────────────────────────────────────────
 *
 * `public/handoff/app-manual-y-soporte.html` dibuja la puerta y el cierre de la
 * visita (:78, :305) y «Escribir a soporte» (:491) como diálogos blancos de
 * 620–680 px, radio 16 y sombra de diálogo; y `app-dialogos-y-estados.html`
 * dice que en el teléfono todo diálogo es hoja inferior con asidero. La
 * anatomía de foco es la de `design/Dialog.tsx` y `LecturaAmpliaDelInforme`:
 * el foco entra al abrir y vuelve a quien lo abrió, `Esc` cierra, el tabulador
 * no se escapa y el fondo no se desplaza.
 *
 * ─── POR QUÉ NO ES `design/Dialog.tsx` ──────────────────────────────────────
 *
 * Ese diálogo lo usa toda la aplicación y todavía lleva la piel vieja: su
 * cabecera con filete y su pie fijo no son los de estas maquetas, que ponen
 * el título dentro del cuerpo. Cambiarlo movería once diálogos ajenos; esta
 * cáscara viste solo los de este bloque, bajo su propio `.cara-nueva`.
 *
 * ─── POR QUÉ SE MONTA EN EL CUERPO DEL DOCUMENTO ────────────────────────────
 *
 * La visita se dibuja en la raíz de `App`, fuera de todo `.cara-nueva`, y la
 * solicitud de acceso puede abrirse sobre cualquier módulo: un portal evita
 * quedar atrapado bajo el apilamiento de la pantalla que esté debajo.
 */

/**
 * LA TRAMPA DEL TABULADOR, como función pura: cuántos enfocables hay, en cuál
 * está el foco (-1 si fuera) y si se retrocede. Devuelve a cuál llevarlo, o -1
 * para dejar que el navegador siga su orden natural.
 */
export const destinoDelTabulador = (total: number, actual: number, atras: boolean): number => {
  if (total === 0) return -1;
  if (actual === -1) return atras ? total - 1 : 0;
  if (!atras && actual === total - 1) return 0;
  if (atras && actual === 0) return total - 1;
  return -1;
};

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Atrapa el tabulador dentro de `panel`. Devuelve `true` si consumió la tecla. */
export const atraparTabulador = (e: KeyboardEvent, panel: HTMLElement): boolean => {
  if (e.key !== 'Tab') return false;
  const enfocables = Array.from(panel.querySelectorAll<HTMLElement>(ENFOCABLES)).filter(
    (el) => el.offsetParent !== null
  );
  const destino = destinoDelTabulador(
    enfocables.length,
    enfocables.indexOf(document.activeElement as HTMLElement),
    e.shiftKey
  );
  if (destino !== -1) {
    e.preventDefault();
    enfocables[destino].focus();
    return true;
  }
  if (enfocables.length === 0) {
    e.preventDefault();
    return true;
  }
  return false;
};

interface DialogoDeAyudaProps {
  abierto: boolean;
  onCerrar: () => void;
  /** El `id` del título que el cuerpo pinta: lo lee el lector de pantalla. */
  tituloId: string;
  /** Clase de la raíz, para el ancho y la piel de cada diálogo. */
  clase: string;
  /**
   * El velo cierra solo lo que no tiene nada que perder. Un formulario a medio
   * escribir no se cierra por un toque fuera de él.
   */
  cierraConVelo?: boolean;
  children: React.ReactNode;
}

export const DialogoDeAyuda: React.FC<DialogoDeAyudaProps> = ({
  abierto,
  onCerrar,
  tituloId,
  clase,
  cierraConVelo = true,
  children
}) => {
  const panel = React.useRef<HTMLDivElement>(null);
  /* `onCerrar` por ref, por la misma razón que en `design/Dialog.tsx`: el padre se repinta solo y no debe mover el foco. */
  const alCerrarRef = React.useRef(onCerrar);
  React.useEffect(() => {
    alCerrarRef.current = onCerrar;
  });

  React.useEffect(() => {
    if (!abierto) return;
    const invocador = document.activeElement as HTMLElement | null;
    /* El primer enfocable recibe el foco: en la puerta de la visita es «Empezar la visita». */
    const primero = panel.current?.querySelector<HTMLElement>('[data-foco-inicial]');
    (primero ?? panel.current)?.focus();

    const alPulsar = (e: KeyboardEvent) => {
      if (!panel.current) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        alCerrarRef.current();
        return;
      }
      atraparTabulador(e, panel.current);
    };
    document.addEventListener('keydown', alPulsar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
      invocador?.focus?.({ preventScroll: true });
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div className={`cara-nueva cn-man-dialogo ${clase}`}>
      <div
        className="cn-man-dialogo-velo"
        onClick={cierraConVelo ? onCerrar : undefined}
        aria-hidden="true"
      />
      <div
        ref={panel}
        tabIndex={-1}
        className="cn-man-dialogo-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <span className="cn-man-dialogo-asidero" aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body
  );
};
