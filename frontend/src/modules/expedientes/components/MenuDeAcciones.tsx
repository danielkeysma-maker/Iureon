import React from 'react';
import { createPortal } from 'react-dom';

/**
 * EL MENÚ «MÁS ACCIONES» DE UNA CARPETA O UN DOCUMENTO.
 *
 * Existe para que el abogado borre, mueva o renombre SIN abrir el archivo: el
 * mismo menú sale del botón «⋮» de cada tarjeta y fila y del clic derecho sobre
 * ella. Un solo menú para las tres vistas —tarjetas, árbol y detalle— evita que
 * cada vista ofrezca acciones distintas sobre la misma cosa.
 *
 * ─── POR QUÉ SE PINTA FUERA, EN `document.body` ────────────────────────────
 *
 * La columna del caso se desplaza por dentro. Un menú absoluto dentro de ella
 * quedaría recortado en la última fila, y uno fijo dentro de un ancestro con
 * transformación dejaría de ser fijo. En el `body` nada lo recorta, y se lleva
 * su propia raíz `.cara-nueva` para no perder los colores ni el modo oscuro.
 *
 * ─── LO QUE EL TECLADO NECESITA ─────────────────────────────────────────────
 *
 * Al abrir, el foco va a la primera acción; las flechas recorren, Inicio y Fin
 * saltan, Escape y Tab cierran. Al cerrar, el foco VUELVE a quien lo abrió: sin
 * eso, quien navega con teclado pierde su lugar en una lista larga.
 *
 * En el teléfono (≤ 640 px) el CSS lo convierte en una hoja inferior con
 * botones del tamaño del dedo; la posición calculada aquí solo rige en pantalla
 * ancha.
 */

export interface AccionDelMenu {
  etiqueta: string;
  onElegir: () => void;
  /** Lo destructivo va al final, separado y en el color de peligro. */
  peligro?: boolean;
  deshabilitado?: boolean;
}

/**
 * Dónde abrir. `yArriba` es el borde al que se voltea si abajo no cabe;
 * `alinearDerecha` pega el borde derecho del menú a `x` (el botón «⋮»).
 */
export interface PosicionDelMenu {
  x: number;
  y: number;
  yArriba: number;
  alinearDerecha: boolean;
}

const MARGEN = 8;

export const MenuDeAcciones: React.FC<{
  /** El nombre de la carpeta o el documento: nombra el menú y encabeza la hoja del teléfono. */
  titulo: string;
  posicion: PosicionDelMenu;
  acciones: AccionDelMenu[];
  /** A quién se le devuelve el foco al cerrar. */
  disparador: HTMLElement | null;
  onCerrar: () => void;
}> = ({ titulo, posicion, acciones, disparador, onCerrar }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [colocado, setColocado] = React.useState<{ x: number; y: number } | null>(null);

  const cerrar = React.useCallback(
    (devolverFoco: boolean) => {
      onCerrar();
      if (devolverFoco) disparador?.focus();
    },
    [disparador, onCerrar]
  );

  /*
   * SE MIDE ANTES DE PINTARSE. El menú nace invisible, se mide su tamaño real
   * y se coloca dentro de la ventana: a la izquierda si a la derecha no cabe y
   * encima del punto si abajo no cabe. Así la última fila de una lista larga
   * no abre un menú cortado por el borde inferior.
   */
  React.useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    let x = posicion.alinearDerecha ? posicion.x - width : posicion.x;
    x = Math.min(Math.max(MARGEN, x), Math.max(MARGEN, ancho - width - MARGEN));
    let y = posicion.y;
    if (y + height > alto - MARGEN) y = posicion.yArriba - height;
    y = Math.min(Math.max(MARGEN, y), Math.max(MARGEN, alto - height - MARGEN));
    setColocado({ x, y });
  }, [posicion]);

  /*
   * EL FOCO ENTRA DESPUÉS DE COLOCARLO. Mientras se mide, el menú está en
   * `visibility: hidden` y un elemento oculto no recibe el foco: se quedaba en
   * el `body` y Escape no llegaba al menú.
   */
  const yaColocado = colocado !== null;
  React.useEffect(() => {
    if (!yaColocado) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not([disabled])')?.focus();
  }, [yaColocado]);

  /* Escape cierra aunque el foco se haya ido a otra parte (un clic en el velo, por ejemplo). */
  React.useEffect(() => {
    const alTeclear = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      cerrar(true);
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [cerrar]);

  /*
   * UN MENÚ FIJO NO SIGUE A SU FILA. Si la página se desplaza o la ventana
   * cambia de tamaño, el menú quedaría flotando sobre otra cosa: se cierra.
   * Los desplazamientos DENTRO del propio menú (hoja larga en el teléfono) no
   * cuentan.
   */
  React.useEffect(() => {
    const alDesplazar = (e: Event): void => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      cerrar(false);
    };
    const alRedimensionar = (): void => cerrar(false);
    window.addEventListener('scroll', alDesplazar, true);
    window.addEventListener('resize', alRedimensionar);
    return () => {
      window.removeEventListener('scroll', alDesplazar, true);
      window.removeEventListener('resize', alRedimensionar);
    };
  }, [cerrar]);

  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []
    );
    const actual = items.indexOf(document.activeElement as HTMLButtonElement);
    const ir = (i: number): void => items[(i + items.length) % items.length]?.focus();
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cerrar(true);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      cerrar(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      ir(actual + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      ir(actual - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      ir(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      ir(items.length - 1);
    }
  };

  const comunes = acciones.filter((a) => !a.peligro);
  const peligrosas = acciones.filter((a) => a.peligro);

  const item = (a: AccionDelMenu): React.ReactNode => (
    <button
      key={a.etiqueta}
      type="button"
      role="menuitem"
      disabled={a.deshabilitado}
      className={`cn-exp-menu-item ${a.peligro ? 'cn-exp-menu-item--peligro' : ''}`}
      onClick={() => {
        /*
         * El foco vuelve al disparador ANTES de la acción: si la acción abre
         * un diálogo, el diálogo lo recuerda como el sitio al que regresar.
         */
        cerrar(true);
        a.onElegir();
      }}
    >
      {a.etiqueta}
    </button>
  );

  return createPortal(
    <div className="cara-nueva cn-exp-flotante">
      <button
        type="button"
        className="cn-exp-menu-velo cn-exp-menu-velo--flotante"
        aria-label="Cerrar el menú"
        tabIndex={-1}
        onClick={() => cerrar(true)}
        onContextMenu={(e) => {
          e.preventDefault();
          cerrar(true);
        }}
      />
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Acciones para «${titulo}»`}
        className="cn-exp-menu cn-exp-menu--flotante"
        onKeyDown={alTeclear}
        style={{
          ['--menu-x' as string]: `${colocado?.x ?? posicion.x}px`,
          ['--menu-y' as string]: `${colocado?.y ?? posicion.y}px`,
          visibility: colocado ? 'visible' : 'hidden'
        }}
      >
        <p className="cn-exp-menu-titulo" aria-hidden="true">
          {titulo}
        </p>
        {comunes.map(item)}
        {peligrosas.length > 0 && comunes.length > 0 && <div role="separator" className="cn-exp-menu-raya" />}
        {peligrosas.map(item)}
      </div>
    </div>,
    document.body
  );
};
