import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../../design/cara-nueva.css';

/**
 * Confirmación de una acción, con la cara nueva.
 *
 * ─── DE DÓNDE SALE LA FORMA ────────────────────────────────────────────────
 *
 * `public/handoff/app-dialogos-y-estados.html`, las confirmaciones de tamaño S
 * («¿Quitar este documento del caso?», «¿Volver a revisar el escrito?»): panel
 * de radio 16 sin filete superior ni icono, título de 21 px, texto de 15 px y
 * un pie sobre el lavado con los dos botones a la derecha. El artboard no
 * dibuja un diálogo de cierre de sesión; se usa esa anatomía tal cual y las
 * palabras las pone quien lo invoca.
 *
 * LO QUE HABÍA: un filete degradado arriba, un círculo con icono, texto de
 * 13,5 y 12 px y la tarjeta del sistema viejo, montado FUERA de `.cara-nueva`.
 *
 * ─── DESVÍOS DEL ARTBOARD, con la razón ────────────────────────────────────
 *
 * · Botones de 44 px y no de 42: es el mínimo táctil del resto de la cara
 *   nueva, y este diálogo también se abre desde el teléfono.
 * · En el teléfono es hoja inferior (radio 20 arriba, botones a lo ancho), como
 *   la hoja de acciones desde donde se llega: a la mano del pulgar.
 *
 * ─── COMPORTAMIENTO ────────────────────────────────────────────────────────
 *
 * `Esc` y el velo equivalen a cancelar, nunca a confirmar. El foco entra al
 * botón seguro —cancelar— para que un Intro distraído no ejecute la acción; el
 * tabulador queda atrapado entre los dos botones; al cerrar, el foco vuelve a
 * quien abrió el diálogo (o a `focoAlCerrar`, cuando ese elemento ya no existe,
 * como la hoja de acciones del teléfono que se cierra al elegir). La página de
 * detrás no se desplaza mientras está abierto.
 *
 * SE MONTA EN EL CUERPO DEL DOCUMENTO con su propio alcance `.cara-nueva`: la
 * cabecera y la hoja del teléfono tienen su propio apilamiento, y dentro de
 * ellas el velo quedaría bajo la barra inferior.
 */

interface ActionConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Segunda línea, más suave: contexto (quién, dónde). */
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  /** `primary` para acciones inocuas (salir); `danger` solo para lo que borra. */
  confirmVariant?: 'danger' | 'primary';
  /** A dónde vuelve el foco si quien abrió el diálogo ya no está en la página. */
  focoAlCerrar?: React.RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  detail,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  focoAlCerrar,
  onConfirm,
  onCancel
}) => {
  const panel = useRef<HTMLDivElement | null>(null);
  const cancelar = useRef<HTMLButtonElement | null>(null);
  const id = useId();
  const idTitulo = `${id}-titulo`;
  const idTexto = `${id}-texto`;
  const idDetalle = `${id}-detalle`;

  /* `onCancel` por ref: el padre se repinta solo y eso no debe volver a mover el foco. */
  const alCancelarRef = useRef(onCancel);
  useEffect(() => {
    alCancelarRef.current = onCancel;
  });

  useEffect(() => {
    if (!isOpen) return;
    const invocador = document.activeElement as HTMLElement | null;
    cancelar.current?.focus();

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        /* Se detiene aquí: el taller en «Pantalla completa» también escucha `Esc`. */
        e.stopPropagation();
        alCancelarRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const botones = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (botones.length === 0) return;
      const actual = botones.indexOf(document.activeElement as HTMLElement);
      const primero = botones[0];
      const ultimo = botones[botones.length - 1];
      if (e.shiftKey && (actual <= 0)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (actual === -1 || actual === botones.length - 1)) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', alPulsar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
      const destino = invocador && invocador.isConnected && invocador !== document.body ? invocador : focoAlCerrar?.current;
      destino?.focus?.({ preventScroll: true });
    };
  }, [isOpen, focoAlCerrar]);

  if (!isOpen) return null;

  const peligro = confirmVariant === 'danger';

  return createPortal(
    <div className="cara-nueva cn-sal">
      {/* El velo cancela: tocar fuera nunca ejecuta la acción. */}
      <div className="cn-sal-velo" onClick={onCancel} aria-hidden="true" />
      <div
        ref={panel}
        className="cn-sal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={detail ? `${idTexto} ${idDetalle}` : idTexto}
      >
        <div className="cn-sal-cuerpo">
          <h2 id={idTitulo} className="cn-sal-titulo">
            {title}
          </h2>
          <p id={idTexto} className="cn-sal-texto">
            {message}
          </p>
          {detail && (
            <p id={idDetalle} className="cn-sal-detalle">
              {detail}
            </p>
          )}
        </div>
        <div className="cn-sal-pie">
          <button ref={cancelar} type="button" onClick={onCancel} className="cn-sal-boton cn-sal-boton--seguro">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`cn-sal-boton ${peligro ? 'cn-sal-boton--peligro' : 'cn-sal-boton--primario'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
