import React from 'react';
import { X } from 'lucide-react';
import { NAV_GROUPS, navModule } from '../navigation';
import { MODULOS_EN_MAS } from './MobileTabBar';
import type { MainView } from '../types';

/**
 * «Más»: los módulos que no caben en la barra inferior. Artboard 4d.
 *
 * ─── HOJA INFERIOR, NO PANTALLA ─────────────────────────────────────────────
 *
 * Sube desde abajo, junto al pulgar y junto al botón que la abrió. Una pantalla
 * completa obligaría a un «atrás» para volver a donde se estaba, y esto no es
 * un destino: es un cajón que se abre y se cierra.
 *
 * ─── CONSERVA LOS VERBOS DE LA BARRA LATERAL ────────────────────────────────
 *
 * Los grupos —Producir, Registrar, Consultar, Aprender, Administrar— vienen de
 * `NAV_GROUPS`, la misma lista del escritorio. Reagruparlos aquí crearía dos
 * mapas mentales del mismo producto, y quien aprendió dónde vive Catálogo en el
 * computador tendría que volver a aprenderlo en el teléfono. Los grupos que
 * quedan vacíos —porque sus módulos ya están en la barra— no se pintan.
 *
 * ─── LO QUE NO SE HEREDA: EL PLIEGUE ────────────────────────────────────────
 *
 * «Administrar» arranca plegado en el escritorio para no competir con el
 * trabajo diario. Aquí no: la hoja ya está cerrada por defecto, así que plegar
 * dentro de algo cerrado son dos toques para llegar a Ajustes. Un pliegue
 * dentro de un cajón es un cajón dentro de un cajón.
 */

interface MobileMoreSheetProps {
  abierto: boolean;
  mainView: MainView;
  onElegir: (view: MainView) => void;
  onCerrar: () => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({
  abierto,
  mainView,
  onElegir,
  onCerrar
}) => {
  React.useEffect(() => {
    if (!abierto) return;
    const alEscapar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alEscapar);
    return () => document.removeEventListener('keydown', alEscapar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const grupos = NAV_GROUPS.map((g) => ({
    titulo: g.titulo,
    modulos: g.modulos.filter((id) => MODULOS_EN_MAS.includes(id))
  })).filter((g) => g.modulos.length > 0);

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
      {/* El velo cierra: es el gesto que ya espera quien abrió una hoja. */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="flex-1 bg-black/40"
      />

      <div className="max-h-[75vh] overflow-y-auto rounded-t-card border-t border-line-200 bg-surface pb-[env(safe-area-inset-bottom)]">
        <header className="sticky top-0 flex items-center justify-between border-b border-line-200 bg-surface px-4 py-3">
          <h2 className="text-[14px] font-semibold text-ink-900">Todo lo demás</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center text-ink-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-2 py-2">
          {grupos.map((grupo) => (
            <section key={grupo.titulo} className="mb-3 last:mb-0">
              <p className="px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                {grupo.titulo}
              </p>
              <ul>
                {grupo.modulos.map((id) => {
                  const modulo = navModule(id);
                  const Icono = modulo.icon;
                  const activo = mainView === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => {
                          onElegir(id);
                          onCerrar();
                        }}
                        aria-current={activo ? 'page' : undefined}
                        className={`flex min-h-[52px] w-full items-center gap-3 rounded-control px-2 text-left ${
                          activo ? 'bg-brand-50 text-brand-700' : 'text-ink-900'
                        }`}
                      >
                        <Icono
                          className={`h-[18px] w-[18px] shrink-0 ${
                            activo ? 'text-brand-700' : 'text-ink-400'
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-medium leading-tight">
                            {modulo.label}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] leading-tight text-ink-500">
                            {modulo.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
