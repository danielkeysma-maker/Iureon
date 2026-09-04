/* GENERADO POR scripts/build-brand.mjs — NO EDITAR A MANO */
import React from 'react';

interface IureonMarkProps {
  /** Alto en píxeles. El símbolo es cuadrado. */
  size?: number;
  /**
   * Cuando es `true`, ambas hebras y la flecha usan `currentColor`.
   *
   * Es lo que se necesita sobre un fondo de color o dentro de un botón: la
   * versión de dos colores desaparece contra un azul marino, y la de una tinta
   * hereda el color del texto que la rodea.
   */
  mono?: boolean;
  className?: string;
}

export const IureonMark: React.FC<IureonMarkProps & { onDark?: boolean }> = ({ size = 32, mono = false, onDark = false, className }) => {
  /*
   * SOBRE FONDO OSCURO, LOS COLORES DEL ICONO DE LA APP: oro y crema sobre el
   * azul, que es como se ve en el icono instalado y en el favicon. La versión
   * mono teñida con el acento de la barra (#7FA8C4) casi desaparecía sobre el
   * azul de navegación; el titular lo notó a simple vista.
   */
  const oro = mono ? 'currentColor' : '#C8A046';
  const tinta = mono ? 'currentColor' : onDark ? '#F4F1EA' : '#14294A';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Iureon">
      <g fill="none" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M39 57C39 48 25 44 25 34C25 27 30 23 32 21" stroke={oro} />
        <path d="M25 57C25 48 39 44 39 34C39 27 34 23 32 21" stroke={tinta} />
      </g>
      <path d="M32 6L40 19H24Z" fill={tinta} />
    </svg>
  );
};
