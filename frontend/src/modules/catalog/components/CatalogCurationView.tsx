import React, { useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Infinity as InfinityIcon,
  Loader2,
  Search,
  ShieldAlert
} from 'lucide-react';
import { useCatalogCuration } from '../hooks/useCatalogCuration';
import { VerificationForm } from './VerificationForm';
import type { Actuacion, TermStatus } from '../types';

/*
 * Los tres estados del sistema, no una paleta propia. "Con término" iba en
 * rojo, y el rojo de este producto significa exactamente dos cosas: grabando y
 * destruir. Un término VERIFICADO es un dato confiable — verde —; que el plazo
 * corra es información del término mismo, no una alarma del estado.
 */
const STATUS_BADGE: Record<TermStatus, { label: string; className: string; icon: typeof CalendarClock }> = {
  VERIFICADO: {
    label: 'Con término',
    className: 'bg-[rgb(var(--verified-surf))] text-verified border-[rgb(var(--verified-line))]',
    icon: CalendarClock
  },
  NO_CADUCA: {
    label: 'No caduca',
    className: 'bg-canvas text-ink-500 border-line-200',
    icon: InfinityIcon
  },
  NO_VERIFICADO: {
    label: 'Sin verificar',
    className: 'border-dashed bg-[rgb(var(--unverified-surf))] text-unverified border-[rgb(var(--unverified-line))]',
    icon: AlertTriangle
  }
};

/**
 * The firm's knowledge base, editable.
 *
 * This is what makes the catalogue the product's rather than the developer's:
 * an actuación verified here is verified once and applies to every later draft,
 * for everyone in the firm. It is not per-document review — no draft should
 * ever require that — it is the one-time confirmation that a deadline is what
 * the norm says it is.
 */
export const CatalogCurationView: React.FC = () => {
  const curation = useCatalogCuration();
  const [selected, setSelected] = useState<Actuacion | null>(null);

  // Follows the branch filter: reading eleven branches' caveats at once is the
  // same as reading none.
  const visibleGaps = curation.meta
    .filter((m) => curation.branchFilter === 'TODAS' || m.branch === curation.branchFilter)
    .flatMap((m) => m.gaps.map((text) => ({ branch: m.branch, text })));

  // The list is reloaded after each write, so the open actuación is re-read
  // from the fresh data rather than kept as a stale snapshot.
  const openActuacion = selected
    ? curation.actuaciones.find((a) => a.id === selected.id) ?? selected
    : null;

  return (
    <div className="flex-1 flex overflow-hidden bg-canvas">
      <section className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-line-200 bg-surface">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-base font-bold text-ink-900">Catálogo procesal</h1>
            <p className="text-[12px] text-ink-500">
              {curation.total} actuaciones ·{' '}
              <span className={curation.pending > 0 ? 'text-unverified font-semibold' : 'text-verified font-semibold'}>
                {curation.pending} sin verificar
              </span>
            </p>
          </div>
          <p className="text-[11px] text-ink-500 mt-1 leading-snug max-w-2xl">
            Lo que verifiques aquí queda para toda la firma y la aplicación lo usará en cada
            redacción. Se verifica una vez, no documento por documento.
          </p>

          {curation.curation === 'UNAVAILABLE' && (
            <div className="mt-3 flex items-start gap-2 rounded-control border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-3 py-2.5">
              <ShieldAlert className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <p className="text-[11px] text-danger leading-snug">
                No se pudieron leer las verificaciones de tu firma. Lo que ves es el catálogo base:
                puede no incluir correcciones que ya hiciste. No lo tomes como vigente.
              </p>
            </div>
          )}

          {curation.curation === 'NOT_CONFIGURED' && (
            <div className="mt-3 flex items-start gap-2 rounded-control border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-unverified shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-900 leading-snug">
                La base de datos no está configurada, así que las verificaciones no pueden guardarse
                todavía. Puedes consultar el catálogo base.
              </p>
            </div>
          )}

          {/* Declared coverage gaps. These are the things the catalogue knows
              it does not cover — including, for labour, that a whole transition
              regime runs alongside the code it was verified against. Leaving
              them in a research file would make the catalogue look complete. */}
          {visibleGaps.length > 0 && (
            <details className="mt-3 rounded-control border border-line-200 bg-surface">
              <summary className="cursor-pointer px-3 py-2 text-[11px] font-semibold text-ink-700 select-none">
                Lo que este catálogo NO cubre
                <span className="ml-1.5 font-normal text-ink-500">
                  ({visibleGaps.length} advertencia{visibleGaps.length === 1 ? '' : 's'})
                </span>
              </summary>
              <ul className="px-3 pb-3 pt-1 space-y-1.5">
                {visibleGaps.map((gap) => (
                  <li key={gap.branch + gap.text} className="text-[11px] text-ink-700 leading-snug flex gap-1.5">
                    <span className="shrink-0 font-bold text-ink-400">{gap.branch}</span>
                    <span>{gap.text}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={curation.query}
                onChange={(e) => curation.setQuery(e.target.value)}
                placeholder="Buscar actuación o norma"
                className="w-64 text-[12px] border border-line-200 rounded-control pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700"
              />
            </div>

            <select
              value={curation.branchFilter}
              onChange={(e) => curation.setBranchFilter(e.target.value as typeof curation.branchFilter)}
              className="text-[12px] border border-line-200 rounded-control px-2.5 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700"
            >
              <option value="TODAS">Todas las ramas</option>
              {curation.branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 text-[12px] text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={curation.onlyUnverified}
                onChange={(e) => curation.setOnlyUnverified(e.target.checked)}
                className="rounded border-line-200"
              />
              Solo pendientes
            </label>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {curation.isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-[12px] text-ink-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando catálogo…
            </div>
          )}

          {!curation.isLoading && curation.loadError && (
            <div className="m-6 rounded-control border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-4 py-3">
              <p className="text-[12px] text-danger leading-snug">{curation.loadError}</p>
              <button
                onClick={() => void curation.reload()}
                className="mt-2 text-[11px] font-semibold text-danger underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {!curation.isLoading && !curation.loadError && curation.actuaciones.length === 0 && (
            <p className="px-6 py-16 text-center text-[12px] text-ink-500">
              Ninguna actuación coincide con el filtro.
            </p>
          )}

          <ul className="divide-y divide-line-100">
            {curation.actuaciones.map((actuacion) => {
              const badge = STATUS_BADGE[actuacion.term.status];
              const BadgeIcon = badge.icon;
              const isOpen = openActuacion?.id === actuacion.id;

              return (
                <li key={actuacion.id}>
                  <button
                    onClick={() => setSelected(actuacion)}
                    className={`w-full text-left px-6 py-3 transition-colors ${
                      isOpen ? 'bg-brand-50/60' : 'hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-ink-900 leading-tight">
                          {actuacion.exactName}
                        </p>
                        <p className="text-[11px] text-ink-500 mt-0.5 leading-tight">
                          {actuacion.legalBasis}
                        </p>
                        {actuacion.term.description && (
                          <p className="text-[11px] text-ink-500 mt-1 leading-snug">
                            {actuacion.term.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        {actuacion.verification && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700"
                            title={`Verificado por ${actuacion.verification.verifiedBy}`}
                          >
                            <BadgeCheck className="w-3 h-3" />
                            Tu firma
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {openActuacion && (
        <aside className="w-[380px] shrink-0 border-l border-line-200 overflow-hidden">
          <VerificationForm
            actuacion={openActuacion}
            isSaving={curation.isSaving}
            error={curation.saveError}
            onSave={curation.save}
            onRevert={async (id) => {
              const done = await curation.revert(id);
              if (done) setSelected(null);
              return done;
            }}
            onClose={() => setSelected(null)}
          />
        </aside>
      )}
    </div>
  );
};
