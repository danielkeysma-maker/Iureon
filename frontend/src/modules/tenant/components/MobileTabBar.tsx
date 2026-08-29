import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { NAV_MODULES, navModule } from '../navigation';
import type { MainView } from '../types';

/**
 * La navegación de móvil. Artboard 4d.
 *
 * ─── NO ES LA BARRA LATERAL ENCOGIDA ────────────────────────────────────────
 *
 * El artboard lo dice en su propio título: «la estructura repensada, no
 * encogida». Trece módulos en una barra inferior serían trece destinos de 30px
 * que nadie acierta con el pulgar. Se convierten en **cuatro destinos** —lo que
 * no puede esperar— y el resto vive en «Más».
 *
 * ─── POR QUÉ «GRABAR» ES LA ENTREVISTA Y NO LA AUDIENCIA ────────────────────
 *
 * Los dos módulos graban, así que la elección necesita una razón y no un gusto.
 * La da el propio artboard: «la entrevista es el módulo que más gana en móvil:
 * el teléfono es la grabadora real». Y la mecánica lo confirma — una audiencia
 * se SUBE como archivo de cincuenta megas, cosa que nadie hace desde un
 * teléfono en un juzgado; una entrevista se graba ahí mismo, con el cliente
 * enfrente. Audiencias queda de primera en «Más», a un toque.
 *
 * ─── EL TAMAÑO ES LA ACCESIBILIDAD ──────────────────────────────────────────
 *
 * Cada destino mide 44px de alto como mínimo, que es el umbral táctil, y la
 * barra reserva el área segura del sistema (`env(safe-area-inset-bottom)`) para
 * no quedar bajo la franja del gesto de inicio en los teléfonos sin botón. Los
 * controles de 34 y 28px del escritorio no existen aquí.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · El botón primario de 48px fijo SOBRE la barra con el costo debajo
 *   («Generar escrito · ~$3.400»). Pertenece a la pantalla de redacción, no a
 *   la navegación: ponerlo aquí lo mostraría también en Orientación y en la
 *   entrevista, donde no hay nada que generar.
 * · Los contadores por módulo. La barra lateral ya los declara prohibidos
 *   mientras nadie los calcule de verdad, y esa regla no cambia por ser móvil.
 */

/** Los cuatro del artboard. El quinto es «Más», que no es un módulo. */
const DESTINOS: ReadonlyArray<{ id: MainView; etiqueta: string }> = [
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
}

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
      className="flex shrink-0 border-t border-nav-line bg-nav pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {DESTINOS.map(({ id, etiqueta }) => {
        const Icono = navModule(id).icon;
        const activo = mainView === id && !masAbierto;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setMainView(id)}
            aria-current={activo ? 'page' : undefined}
            className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 ${
              activo ? 'text-white' : 'text-nav-ink'
            }`}
          >
            <Icono className="h-[18px] w-[18px]" />
            <span className="text-[10.5px] font-medium leading-none">{etiqueta}</span>
          </button>
        );
      })}

      <button
        type="button"
        onClick={onAbrirMas}
        aria-expanded={masAbierto}
        aria-current={enMas && !masAbierto ? 'page' : undefined}
        className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 ${
          masAbierto || enMas ? 'text-white' : 'text-nav-ink'
        }`}
      >
        <LayoutGrid className="h-[18px] w-[18px]" />
        <span className="text-[10.5px] font-medium leading-none">Más</span>
      </button>
    </nav>
  );
};
