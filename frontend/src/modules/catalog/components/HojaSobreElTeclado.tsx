import React from 'react';
import { createPortal } from 'react-dom';

/**
 * La hoja inferior del Catálogo en el teléfono, medida contra lo que se VE.
 *
 * ─── EL DEFECTO (reportado en producción, 14 de septiembre de 2026) ─────────
 *
 * La hoja de verificación medía `92dvh` y ese alto es el de la ventana de
 * diseño, no el de la parte visible. En el teléfono el teclado no encoge esa
 * ventana (Chrome para Android desde la versión 108 y Safari solo encogen la
 * ventana visual), así que al tocar un campo el teclado tapaba el pie con
 * «Guardar verificación» y el poco cuerpo que quedaba. Y quedaba poco: la
 * cabecera y el resumen no se desplazaban y el pie apilado medía 136 px, de
 * modo que en un teléfono de 664 px el cuerpo desplazable tenía 274 px; con un
 * teclado de unos 300 px, cero. El emulador del escritorio no abre teclado y
 * por eso no se veía.
 *
 * ─── EL REMEDIO ─────────────────────────────────────────────────────────────
 *
 * · La capa sigue a `window.visualViewport`: su alto y su borde superior son
 *   los de la parte visible, y se recalculan cuando el teclado aparece o se va.
 *   Sin esa API, el CSS cae en `100dvh`.
 * · Se monta en `document.body` con su propia raíz `.cara-nueva`, fuera de la
 *   columna desplazable del Catálogo: ningún ancestro con `transform`,
 *   `overflow` o contexto de apilamiento futuro puede recortarla ni dejarla
 *   debajo de la barra inferior.
 * · El campo enfocado se centra DESPUÉS de que el teclado termina de abrir; el
 *   navegador solo lo acerca a la ventana de diseño, que es la que el teclado
 *   tapa.
 */

interface HojaSobreElTecladoProps {
  etiqueta: string;
  onCerrar: () => void;
  children: React.ReactNode;
}

/** Lo que tarda un teclado en terminar de abrir; antes, centrar el campo es centrarlo detrás de él. */
const ESPERA_DEL_TECLADO_MS = 320;

const esCampoDeTexto = (el: EventTarget | null): el is HTMLElement =>
  el instanceof HTMLElement &&
  el.matches('textarea, select, input:not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="submit"])');

export const HojaSobreElTeclado: React.FC<HojaSobreElTecladoProps> = ({ etiqueta, onCerrar, children }) => {
  const capa = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const vista = window.visualViewport;
    const el = capa.current;
    if (!vista || !el) return;
    const ajustar = () => {
      el.style.setProperty('--hoja-alto', `${Math.round(vista.height)}px`);
      el.style.setProperty('--hoja-arriba', `${Math.round(vista.offsetTop)}px`);
    };
    ajustar();
    vista.addEventListener('resize', ajustar);
    vista.addEventListener('scroll', ajustar);
    return () => {
      vista.removeEventListener('resize', ajustar);
      vista.removeEventListener('scroll', ajustar);
    };
  }, []);

  React.useEffect(() => {
    const el = capa.current;
    if (!el) return;
    let espera: number | undefined;
    const alEnfocar = (e: FocusEvent) => {
      const campo = e.target;
      if (!esCampoDeTexto(campo)) return;
      window.clearTimeout(espera);
      espera = window.setTimeout(() => campo.scrollIntoView({ block: 'center' }), ESPERA_DEL_TECLADO_MS);
    };
    el.addEventListener('focusin', alEnfocar);
    return () => {
      el.removeEventListener('focusin', alEnfocar);
      window.clearTimeout(espera);
    };
  }, []);

  return createPortal(
    <div className="cara-nueva cn-cat">
      <div ref={capa} className="cn-cat-hoja-capa" role="dialog" aria-modal="true" aria-label={etiqueta}>
        <div className="cn-cat-velo" onClick={onCerrar} aria-hidden="true" />
        <section className="cn-cat-hoja">
          <span className="cn-cat-asidero" aria-hidden="true" />
          {children}
        </section>
      </div>
    </div>,
    document.body
  );
};
