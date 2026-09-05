import React from 'react';
import {
  ETIQUETA_TIPO,
  MODULOS_NOVEDADES,
  NOVEDADES,
  agruparPorFecha,
  fechaLarga
} from '../content/novedades';
import type { Novedad } from '../content/novedades';
import { marcarNovedadesVistas, vistasHasta } from '../useNovedades';

/**
 * Novedades: the list of what changed, grouped by day.
 *
 * Shared by the desktop manual and the phone. `compacto` only tightens
 * spacing and type; the content and the order are the same on both — a
 * changelog that says different things per device would be two changelogs.
 *
 * The «nuevo» chip is brand, «mejora» is the verified green and «corrección»
 * the neutral grey: the product's own three chip classes, so the reader has
 * nothing new to learn here.
 */

const CHIP_POR_TIPO: Record<Novedad['tipo'], string> = {
  nuevo: 'chip-curated',
  mejora: 'chip-verified',
  correccion: 'chip-neutral'
};

interface NovedadesPanelProps {
  compacto?: boolean;
}

export const NovedadesPanel: React.FC<NovedadesPanelProps> = ({ compacto = false }) => {
  /*
   * Read the "seen until" date ONCE, before marking: the entries newer than it
   * get a dot for the length of this visit. Marking runs after paint so the
   * counter elsewhere clears as the reader is looking at the list.
   */
  const [vistasAntes] = React.useState<string | null>(() => vistasHasta());
  React.useEffect(() => {
    marcarNovedadesVistas();
  }, []);

  const [modulo, setModulo] = React.useState<string | null>(null);

  const visibles = React.useMemo(
    () => (modulo ? NOVEDADES.filter((n) => n.modulo === modulo) : NOVEDADES),
    [modulo]
  );
  const grupos = React.useMemo(() => agruparPorFecha(visibles), [visibles]);
  const esNueva = (n: Novedad): boolean => !vistasAntes || n.fecha > vistasAntes;

  const primera = NOVEDADES[NOVEDADES.length - 1]?.fecha;
  const ultima = NOVEDADES[0]?.fecha;

  return (
    <div className={compacto ? '' : 'mx-auto w-full max-w-[780px] pb-10'}>
      {!compacto && (
        <>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Historial de actualizaciones
          </p>
          <h1 className="mt-1.5 text-display text-ink-900 [text-wrap:pretty]">Novedades</h1>
        </>
      )}
      <p
        className={`text-ink-700 [text-wrap:pretty] ${
          compacto ? 'mt-1.5 text-[13px] leading-snug text-ink-500' : 'mt-2.5 text-[15px] leading-[1.7]'
        }`}
      >
        Lo que cambió en Iureon y cuándo. Solo aparece lo que ya está en la aplicación: {NOVEDADES.length}{' '}
        cambios entre el {primera ? fechaLarga(primera) : ''} y el {ultima ? fechaLarga(ultima) : ''}.
      </p>

      {/* ─── FILTRO POR MÓDULO ──────────────────────────────────────────── */}
      <div
        className={`flex flex-wrap gap-1.5 ${compacto ? 'mt-3' : 'mt-4'}`}
        role="group"
        aria-label="Filtrar por módulo"
      >
        <button
          type="button"
          onClick={() => setModulo(null)}
          aria-pressed={modulo === null}
          className={modulo === null ? 'chip-curated' : 'chip-auto hover:text-ink-700'}
        >
          Todos
        </button>
        {MODULOS_NOVEDADES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModulo(modulo === m ? null : m)}
            aria-pressed={modulo === m}
            className={modulo === m ? 'chip-curated' : 'chip-auto hover:text-ink-700'}
          >
            {m}
          </button>
        ))}
      </div>

      {/* ─── POR FECHA ──────────────────────────────────────────────────── */}
      {grupos.map(({ fecha, entradas }) => (
        <section key={fecha} className={compacto ? 'mt-5' : 'mt-7'}>
          <h2 className={compacto ? 'text-[14px] font-semibold text-ink-900' : 'text-subtitle text-ink-900'}>
            {fechaLarga(fecha)}
            <span className="mt-1.5 block h-[2px] w-9 rounded-full bg-brand-700" aria-hidden />
          </h2>

          <ul className={`flex flex-col ${compacto ? 'mt-2.5 gap-2' : 'mt-3 gap-2.5'}`}>
            {entradas.map((n) => (
              <li
                key={`${n.fecha}-${n.titulo}`}
                className={`rounded-card border border-line-200 bg-surface ${
                  compacto ? 'px-3 py-2.5' : 'px-4 py-3'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={CHIP_POR_TIPO[n.tipo]}>{ETIQUETA_TIPO[n.tipo]}</span>
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    {n.modulo}
                  </span>
                  {esNueva(n) && (
                    <span
                      className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-brand-700"
                      title="Nuevo desde su última visita a Novedades"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-700" aria-hidden />
                      nuevo para usted
                    </span>
                  )}
                </div>
                <p
                  className={`font-semibold text-ink-900 [text-wrap:pretty] ${
                    compacto ? 'mt-1.5 text-[13.5px] leading-tight' : 'mt-2 text-ui leading-[1.4]'
                  }`}
                >
                  {n.titulo}
                </p>
                <p
                  className={`text-ink-700 [text-wrap:pretty] ${
                    compacto ? 'mt-1 text-justify text-[12.5px] leading-snug [text-wrap:pretty]' : 'mt-1 text-justify text-body leading-[1.65] [text-wrap:pretty]'
                  }`}
                >
                  {n.detalle}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {grupos.length === 0 && (
        <p className="mt-6 text-meta text-ink-500">Ningún cambio registrado para ese módulo.</p>
      )}
    </div>
  );
};
