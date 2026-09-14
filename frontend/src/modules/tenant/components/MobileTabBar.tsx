import React from 'react';
import { ICONO_MAS, NAV_MODULES, navModule, type NavIcon } from '../navigation';
import type { MainView } from '../types';
import '../../../design/cara-nueva.css';

/**
 * La navegación de móvil. Artboard 4d en su estructura; la cara nueva
 * (README-app §1) en su aspecto.
 *
 * ─── LA ESTRUCTURA, LEÍDA Y NO DEDUCIDA ─────────────────────────────────────
 *
 * La primera versión de esta barra se hizo desde la descripción del artboard y
 * salió AZUL OSCURA, como la barra lateral del escritorio. La maqueta decía
 * otra cosa: 62 px de alto, fondo blanco, cinco columnas, cada destino con un
 * ícono de 20 px sobre su etiqueta. Eso se conserva.
 *
 * La lección de la equivocación vale más que el arreglo: **una barra inferior
 * NO es la barra lateral acostada**. Se apoya sobre el contenido y, oscura,
 * competiría con el documento, que es lo que tiene que resaltar.
 *
 * ─── LO QUE CAMBIA CON LA CARA NUEVA ────────────────────────────────────────
 *
 * · Sin raya gris de 1 px: un filo del color de línea del sistema, más suave.
 * · El destino abierto va en tinta plena con la barra de oro de 3 px arriba,
 *   la misma que marca el módulo activo en el panel lateral: el oro es el
 *   marcador de módulo activo y nada más. Antes era azul de enlace, que en
 *   este sistema significa «esto se puede pulsar», no «aquí está usted».
 * · Inactivos en #667487, la tinta mínima AA sobre blanco; el #8B96A6 de
 *   antes daba 3,0:1.
 * · Etiqueta de 13 px y no 14: cinco columnas en 320 px dejan 62 px por
 *   destino, y «Orientar» a 14 px roza el borde de la suya.
 *
 * ─── POR QUÉ «GRABAR» ES LA ENTREVISTA ──────────────────────────────────────
 *
 * Los dos módulos graban. Lo decide el artboard: la tercera pantalla de 4d bajo
 * este destino es la entrevista, y su nota lo razona — «el teléfono es la
 * grabadora real». La mecánica lo confirma: una audiencia se SUBE como archivo
 * de cincuenta megas, cosa que nadie hace en un juzgado; una entrevista se graba
 * con el cliente enfrente. Audiencias queda primera en «Más».
 *
 * ─── LOS ÍCONOS VIENEN DE `navigation.ts`, NO DE AQUÍ ───────────────────────
 *
 * Esta barra dibujaba los trazos de la maqueta y el panel lateral usaba
 * `lucide-react`, así que un mismo módulo tenía dos caras. Desde el 14 de
 * septiembre de 2026 toda la navegación usa lucide, elegido por lo que quiere
 * decir cada dibujo de la maqueta y no por parecido: BOMBILLA en «Orientar»
 * (una brújula dice «ubíquese»; una bombilla, «aquí se le ocurre qué hacer») y
 * TRES PUNTOS en «Más», no una cuadrícula, que promete una parrilla de
 * aplicaciones.
 */

/*
 * EL ÍCONO NO SE DECLARA AQUÍ. Esta barra tenía su propia tabla de íconos y el
 * panel lateral otra, y un mismo módulo se veía distinto en el teléfono y en el
 * escritorio. Ahora cada destino toma el suyo de `navigation.ts`, así que no
 * pueden separarse. La
 * etiqueta sí es propia: «Redactar» y «Grabar» son verbos para el pulgar, y el
 * panel lateral nombra el módulo.
 */
interface Destino {
  id: MainView;
  etiqueta: string;
}

const DESTINOS: readonly Destino[] = [
  /* Inicio primero: es donde se entra y adonde lleva el logo. Cinco columnas desde entonces. */
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'workspace', etiqueta: 'Redactar' },
  { id: 'orientacion', etiqueta: 'Orientar' },
  { id: 'entrevistas', etiqueta: 'Grabar' }
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
  /** Módulos que el plan no incluye. Un destino oculto deja su celda vacía. */
  ocultas?: readonly MainView[];
}

/** Un destino: ícono de 20 px sobre su etiqueta, en toda la altura de la barra. */
const Destino: React.FC<{
  Icono: NavIcon;
  etiqueta: string;
  activo: boolean;
  onClick: () => void;
  expandido?: boolean;
  visita?: string;
}> = ({ Icono, etiqueta, activo, onClick, expandido, visita }) => (
  <button
    type="button"
    data-visita={visita}
    onClick={onClick}
    aria-current={activo ? 'page' : undefined}
    aria-expanded={expandido}
    className="cn-tab"
  >
    <Icono className="h-5 w-5" strokeWidth={activo ? 2 : 1.8} />
    <span>{etiqueta}</span>
  </button>
);

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  mainView,
  setMainView,
  onAbrirMas,
  masAbierto,
  ocultas = []
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
      /* `grid` y `lg:hidden` quedan en Tailwind: la hoja nueva no declara `display` para no ganarle al corte de escritorio. */
      className="cara-nueva cn-tabs grid grid-cols-5 lg:hidden"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      {DESTINOS.filter(({ id }) => !ocultas.includes(id)).map(({ id, etiqueta }) => (
        <Destino
          key={id}
          Icono={navModule(id).icon}
          etiqueta={etiqueta}
          activo={mainView === id && !masAbierto}
          onClick={() => setMainView(id)}
          visita={`nav-${id}`}
        />
      ))}

      <Destino
        Icono={ICONO_MAS}
        etiqueta="Más"
        activo={masAbierto || enMas}
        onClick={onAbrirMas}
        expandido={masAbierto}
      />
    </nav>
  );
};
