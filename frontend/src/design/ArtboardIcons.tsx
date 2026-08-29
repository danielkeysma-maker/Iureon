import React from 'react';

/**
 * Los íconos de las maquetas de Claude Design, con sus trazos EXACTOS.
 *
 * ─── POR QUÉ NO SE USA LA LIBRERÍA DE ÍCONOS AQUÍ ───────────────────────────
 *
 * Las pantallas móviles se hicieron primero con equivalentes de `lucide-react`
 * elegidos «por parecido», y el resultado se desviaba del diseño en cosas que
 * cambian el significado. La más clara: en la barra inferior, **«Orientar» es
 * una BOMBILLA en el artboard** —`M12 3a7 7 0 00-4 12.7V19h8v-3.3A7 7 0 0012 3z`—
 * y se había puesto una brújula. Una brújula dice «ubíquese»; una bombilla dice
 * «aquí se le ocurre qué hacer», que es exactamente lo que hace Orientación.
 * También el cuarto destino: tres círculos en fila, no una cuadrícula — la
 * cuadrícula promete una parrilla de aplicaciones.
 *
 * Estos `d` están copiados del HTML de los artboards, no redibujados. Todos
 * comparten el mismo lienzo `0 0 24 24`, `fill:none`, y las terminaciones
 * redondeadas que usan las maquetas.
 *
 * ─── EL COLOR Y EL GROSOR LOS PONE QUIEN LO USA ─────────────────────────────
 *
 * `stroke="currentColor"` y `strokeWidth` como propiedad: las maquetas usan 2
 * en la navegación y 2.4 en los indicadores de estado, y el color siempre sale
 * de un token —brand-700 cuando está activo, ink-400 cuando no—. Fijarlos aquí
 * obligaría a un ícono por color, que es como se acaban colando valores sueltos.
 */

export interface IconoProps {
  className?: string;
  strokeWidth?: number;
}

const Svg: React.FC<IconoProps & { children: React.ReactNode }> = ({
  className,
  strokeWidth = 2,
  children
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

/** Documento con esquina doblada. «Redactar» en la barra inferior. */
export const IconoDocumento: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
);

/** BOMBILLA. «Orientar» — no una brújula, que es lo que se había puesto. */
export const IconoOrientar: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3a7 7 0 00-4 12.7V19h8v-3.3A7 7 0 0012 3z" />
  </Svg>
);

/** Micrófono. «Grabar». */
export const IconoMicrofono: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M12 15a4 4 0 004-4V7a4 4 0 10-8 0v4a4 4 0 004 4z" />
    <path d="M12 19v2" />
  </Svg>
);

/** Tres círculos en fila. «Más» — el HTML no usa cuadrícula. */
export const IconoMas: React.FC<IconoProps> = ({ className, strokeWidth = 2 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
);

/** Verificado: círculo con palomita. Las maquetas lo trazan a 2.4. */
export const IconoVerificado: React.FC<IconoProps> = (p) => (
  <Svg strokeWidth={2.4} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.6 2.6L16 9.5" />
  </Svg>
);

/** Sin verificar: triángulo de aviso con su barra. */
export const IconoSinVerificar: React.FC<IconoProps> = (p) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M12 4.5L21 19.5H3z" />
    <path d="M12 10v4" />
  </Svg>
);

/** No caduca / no aplica: una raya. El HTML usa solo el trazo horizontal. */
export const IconoNoAplica: React.FC<IconoProps> = (p) => (
  <Svg strokeWidth={2.4} {...p}>
    <path d="M4 12h16" />
  </Svg>
);

/** Lupa. Buscar. */
export const IconoBuscar: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </Svg>
);

/** Chevron a la izquierda. Volver. */
export const IconoVolver: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

/** Tres rayas. El menú de la cabecera móvil. */
export const IconoMenu: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </Svg>
);

/** Clip. Adjuntar. */
export const IconoAdjuntar: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M21 12.5l-8.5 8.5a5 5 0 01-7-7l8.5-8.5a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3l8-8" />
  </Svg>
);

/** Candado. Lo que no se comparte. */
export const IconoCandado: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" />
  </Svg>
);

/** Globo de conversación. Soporte. */
export const IconoConversacion: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3z" />
  </Svg>
);

/** Rayo. Lo inmediato. */
export const IconoRayo: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M13 3L5 14h6l-1 7 8-11h-6z" />
  </Svg>
);

/** Palomita suelta, sin círculo. Confirmar. */
export const IconoPalomita: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
);

/** Más (signo). Añadir. */
export const IconoAnadir: React.FC<IconoProps> = (p) => (
  <Svg {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);
