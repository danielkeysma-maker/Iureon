import React from 'react';
import {
  IconoDocumento,
  IconoMas,
  IconoMicrofono,
  IconoOrientar,
  type IconoProps
} from '../../../design/ArtboardIcons';
import { NAV_MODULES } from '../navigation';
import type { MainView } from '../types';

/**
 * La navegación de móvil. Artboard 4d, COPIADA de su HTML.
 *
 * ─── LA ESPECIFICACIÓN, LEÍDA Y NO DEDUCIDA ─────────────────────────────────
 *
 * La primera versión de esta barra se hizo desde la descripción del artboard y
 * salió AZUL OSCURA, como la barra lateral del escritorio. La maqueta dice otra
 * cosa, y se puede citar:
 *
 *     height:62px; background:#fff; border-top:1px solid #E3E7EC;
 *     display:grid; grid-template-columns:repeat(4,1fr);
 *     align-items:center; padding:0 4px 8px
 *
 * Cada destino: columna centrada con `gap:3px`, ícono de 20px y etiqueta de
 * 10.5px. Activo en `#17456B` con peso 600; inactivo en `#8B96A6` con peso 500.
 * Todos esos colores ya son tokens del sistema —brand-700, ink-400, line-200—,
 * así que no se introduce ni un valor suelto.
 *
 * La lección de la equivocación vale más que el arreglo: **una barra inferior
 * NO es la barra lateral acostada**. La lateral es oscura porque es un panel
 * permanente que enmarca el trabajo; esta se apoya sobre el contenido y en
 * oscuro competiría con el documento, que es lo que tiene que resaltar.
 *
 * ─── POR QUÉ «GRABAR» ES LA ENTREVISTA ──────────────────────────────────────
 *
 * Los dos módulos graban. Lo decide el artboard: la tercera pantalla de 4d bajo
 * este destino es la entrevista, y su nota lo razona — «el teléfono es la
 * grabadora real». La mecánica lo confirma: una audiencia se SUBE como archivo
 * de cincuenta megas, cosa que nadie hace en un juzgado; una entrevista se graba
 * con el cliente enfrente. Audiencias queda primera en «Más».
 *
 * ─── LOS ÍCONOS SON LOS DE LA MAQUETA ───────────────────────────────────────
 *
 * NO son equivalentes «parecidos» de una libreria: son los trazos del HTML,
 * en `design/ArtboardIcons.tsx`. La diferencia cambia el significado — la
 * maqueta pone una BOMBILLA en «Orientar» y aqui habia una brujula. Una brujula
 * dice «ubiquese»; una bombilla dice «aqui se le ocurre que hacer», que es lo
 * que hace Orientacion. Y el cuarto son TRES CIRCULOS en fila, no una
 * cuadricula: la cuadricula promete una parrilla de aplicaciones.
 */

interface Destino {
  id: MainView;
  etiqueta: string;
  Icono: React.FC<IconoProps>;
}

const DESTINOS: readonly Destino[] = [
  { id: 'workspace', etiqueta: 'Redactar', Icono: IconoDocumento },
  /* BOMBILLA, no brujula: es el trazo del artboard y dice otra cosa. */
  { id: 'orientacion', etiqueta: 'Orientar', Icono: IconoOrientar },
  { id: 'entrevistas', etiqueta: 'Grabar', Icono: IconoMicrofono }
];

/** Lo que queda, en el orden de la barra lateral. Audiencias primero. */
export const MODULOS_EN_MAS: readonly MainView[] = NAV_MODULES.map((m) => m.id).filter(
  (id) => !DESTINOS.some((d) => d.id === id)
);

interface MobileTabBarProps {
  mainView: MainView;
  setMainView: (view: MainView) => void;
  onAbrirMas: () => void;
  masAbierto: boolean;
}

/** 62px de alto con `padding:0 4px 8px`, más el área segura del sistema. */
const Destino: React.FC<{
  Icono: React.FC<IconoProps>;
  etiqueta: string;
  activo: boolean;
  onClick: () => void;
  expandido?: boolean;
}> = ({ Icono, etiqueta, activo, onClick, expandido }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={activo ? 'page' : undefined}
    aria-expanded={expandido}
    className="flex h-full flex-col items-center justify-center gap-[3px]"
  >
    <Icono
      className={`h-5 w-5 ${activo ? 'text-brand-700' : 'text-ink-400'}`}
      strokeWidth={2}
    />
    <span
      className={`text-[10.5px] leading-none ${
        activo ? 'font-semibold text-brand-700' : 'font-medium text-ink-400'
      }`}
    >
      {etiqueta}
    </span>
  </button>
);

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  mainView,
  setMainView,
  onAbrirMas,
  masAbierto
}) => {
  /*
   * «Más» se marca activo cuando la pantalla actual vive dentro de él: sin eso,
   * quien está en Catálogo no vería resaltado ningún destino y la barra diría
   * que no está en ninguna parte.
   */
  const enMas = MODULOS_EN_MAS.includes(mainView);

  return (
    <nav
      aria-label="Navegación principal"
      className="grid h-[62px] shrink-0 grid-cols-4 items-center border-t border-line-200 bg-surface px-1 pb-2 lg:hidden"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      {DESTINOS.map(({ id, etiqueta, Icono }) => (
        <Destino
          key={id}
          Icono={Icono}
          etiqueta={etiqueta}
          activo={mainView === id && !masAbierto}
          onClick={() => setMainView(id)}
        />
      ))}

      <Destino
        Icono={IconoMas}
        etiqueta="Más"
        activo={masAbierto || enMas}
        onClick={onAbrirMas}
        expandido={masAbierto}
      />
    </nav>
  );
};
