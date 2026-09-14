import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * EL INFORME, LEÍDO FUERA DE LA COLUMNA.
 *
 * Pedido del 14 de septiembre de 2026: en el taller el informe vive en la
 * columna derecha. En el computador se lee apretado; en el teléfono queda
 * detrás de las pestañas. Este diálogo lo abre en grande —centrado en el
 * escritorio, a pantalla completa en el teléfono— sin cambiar lo que dice.
 *
 * ─── DE DÓNDE SALE LA FORMA ─────────────────────────────────────────────────
 *
 * Ningún artboard de `public/handoff/` dibuja un informe ampliado. Se deriva
 * del sistema de diálogos ya construido: la anatomía de `design/Dialog.tsx`
 * (Esc cierra, el foco entra y vuelve a quien lo abrió, el fondo no se
 * desplaza, cabecera fija y el desplazamiento solo en el cuerpo) y la hoja a
 * pantalla completa del lector de Expedientes (`LeerDocumentoIndexado`).
 *
 * ─── POR QUÉ ES UNA CÁSCARA Y NO OTRO INFORME ───────────────────────────────
 *
 * El cuerpo lo pone quien lo abre, con las mismas piezas del panel. Una segunda
 * copia del marcado se desfasaría de la primera la próxima vez que cambie una
 * sección, y el abogado leería dos informes distintos según dónde lo abra.
 *
 * El cuerpo lleva su propio `data-informe`: «Ir al punto» busca el hallazgo en
 * el informe que contiene el botón, así que dentro del diálogo salta dentro del
 * diálogo y no al panel que quedó detrás.
 *
 * ─── POR QUÉ SE MONTA EN EL CUERPO DEL DOCUMENTO ────────────────────────────
 *
 * El taller puede estar en «Pantalla completa», que es `fixed` con su propio
 * apilamiento; dentro de él, este diálogo quedaría atrapado bajo sus barras.
 * Montado aparte necesita abrir su propio alcance de la cara nueva.
 */

/**
 * LA TRAMPA DEL TABULADOR, como función pura. Recibe cuántos elementos
 * enfocables hay, en cuál está el foco (-1 si está fuera de ellos) y si se
 * retrocede. Devuelve a cuál llevarlo, o -1 para dejar que el navegador siga
 * su orden natural.
 */
export const destinoDelTabulador = (total: number, actual: number, atras: boolean): number => {
  if (total === 0) return -1;
  if (actual === -1) return atras ? total - 1 : 0;
  if (!atras && actual === total - 1) return 0;
  if (atras && actual === 0) return total - 1;
  return -1;
};

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
 * UN DIÁLOGO ENCIMA DE ESTE —la guía de actuaciones que abre el puente al
 * ataque— tiene su propio `Esc` y su propio foco. Mientras exista, este no
 * cierra ni atrapa: cerrar los dos con una tecla perdería lo que el abogado
 * estaba eligiendo.
 */
const hayOtroDialogoEncima = (propio: HTMLElement | null): boolean => {
  const modales = Array.from(document.querySelectorAll('[aria-modal="true"]'));
  return modales.length > 0 && modales[modales.length - 1] !== propio;
};

export interface LecturaAmpliaDelInformeProps {
  abierto: boolean;
  onCerrar: () => void;
  /** «Informe de revisión» o «Lectura del documento recibido». */
  titulo: string;
  /** Qué se leyó: actuación, cliente, archivo. Una línea. */
  detalle?: string;
  /** Las descargas del informe, las mismas del panel. */
  acciones?: React.ReactNode;
  /** Un error de descarga, dicho arriba y no bajo el informe. */
  aviso?: React.ReactNode;
  children: React.ReactNode;
}

export const LecturaAmpliaDelInforme: React.FC<LecturaAmpliaDelInformeProps> = ({ abierto, onCerrar, titulo, detalle, acciones, aviso, children }) => {
  const panel = React.useRef<HTMLDivElement>(null);
  const idDelTitulo = React.useId();
  /* `onCerrar` por ref, por la misma razón que en `design/Dialog.tsx`: el padre se repinta solo y no debe mover el foco. */
  const alCerrarRef = React.useRef(onCerrar);
  React.useEffect(() => {
    alCerrarRef.current = onCerrar;
  });

  React.useEffect(() => {
    if (!abierto) return;
    const invocador = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const alPulsar = (e: KeyboardEvent) => {
      if (hayOtroDialogoEncima(panel.current)) return;
      if (e.key === 'Escape') {
        /*
         * Se detiene aquí: el taller en «Pantalla completa» escucha `Esc` en la
         * ventana para salir de ella, y cerrar la lectura no debe sacarlo.
         */
        e.stopPropagation();
        alCerrarRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const enfocables = Array.from(panel.current.querySelectorAll<HTMLElement>(ENFOCABLES)).filter((el) => el.offsetParent !== null);
      const destino = destinoDelTabulador(enfocables.length, enfocables.indexOf(document.activeElement as HTMLElement), e.shiftKey);
      if (destino !== -1) {
        e.preventDefault();
        enfocables[destino].focus();
      } else if (enfocables.length === 0) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', alPulsar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
      /* Sin desplazar: el panel que quedó detrás conserva su posición de lectura. */
      invocador?.focus?.({ preventScroll: true });
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div className="cara-nueva cn-inf-amplio">
      {/* El velo cierra: es lectura, no hay nada que perder. */}
      <div className="cn-inf-amplio-velo" onClick={onCerrar} aria-hidden="true" />
      <div ref={panel} tabIndex={-1} className="cn-inf-amplio-panel" role="dialog" aria-modal="true" aria-labelledby={idDelTitulo}>
        <header className="cn-inf-amplio-cabeza">
          <div className="cn-inf-amplio-textos">
            <h2 id={idDelTitulo} className="cn-inf-amplio-titulo">
              {titulo}
            </h2>
            {detalle && <p className="cn-inf-amplio-detalle">{detalle}</p>}
          </div>
          <div className="cn-inf-amplio-acciones">
            {acciones}
            <button type="button" onClick={onCerrar} className="cn-tal-boton cn-tal-boton--fantasma cn-inf-amplio-cerrar" title="Cerrar (Esc)">
              <X className="cn-tal-boton-icono" aria-hidden="true" />
              Cerrar
            </button>
          </div>
        </header>
        {aviso}
        <div className="cn-inf-amplio-cuerpo">
          <div className="cn-inf cn-inf--amplio" data-informe>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
