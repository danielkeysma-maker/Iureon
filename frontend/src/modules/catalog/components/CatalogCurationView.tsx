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

const STATUS_BADGE: Record<TermStatus, { label: string; className: string; icon: typeof CalendarClock }> = {
  VERIFICADO: {
    label: 'Con término',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: CalendarClock
  },
  NO_CADUCA: {
    label: 'No caduca',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: InfinityIcon
  },
  NO_VERIFICADO: {
    label: 'Sin verificar',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
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

  // The list is reloaded after each write, so the open actuación is re-read
  // from the fresh data rather than kept as a stale snapshot.
  const openActuacion = selected
    ? curation.actuaciones.find((a) => a.id === selected.id) ?? selected
    : null;

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50">
      <section className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-base font-bold text-slate-900">Catálogo procesal</h1>
            <p className="text-[12px] text-slate-500">
              {curation.total} actuaciones ·{' '}
              <span className={curation.pending > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                {curation.pending} sin verificar
              </span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug max-w-2xl">
            Lo que verifiques aquí queda para toda la firma y la aplicación lo usará en cada
            redacción. Se verifica una vez, no documento por documento.
          </p>

          {curation.curation === 'UNAVAILABLE' && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-900 leading-snug">
                No se pudieron leer las verificaciones de tu firma. Lo que ves es el catálogo base:
                puede no incluir correcciones que ya hiciste. No lo tomes como vigente.
              </p>
            </div>
          )}

          {curation.curation === 'NOT_CONFIGURED' && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 leading-snug">
                La base de datos no está configurada, así que las verificaciones no pueden guardarse
                todavía. Puedes consultar el catálogo base.
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={curation.query}
                onChange={(e) => curation.setQuery(e.target.value)}
                placeholder="Buscar actuación o norma"
                className="w-64 text-[12px] border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
            </div>

            <select
              value={curation.branchFilter}
              onChange={(e) => curation.setBranchFilter(e.target.value as typeof curation.branchFilter)}
              className="text-[12px] border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
            >
              <option value="TODAS">Todas las ramas</option>
              {curation.branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-1.5 text-[12px] text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={curation.onlyUnverified}
                onChange={(e) => curation.setOnlyUnverified(e.target.checked)}
                className="rounded border-slate-300"
              />
              Solo pendientes
            </label>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {curation.isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-[12px] text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando catálogo…
            </div>
          )}

          {!curation.isLoading && curation.loadError && (
            <div className="m-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-[12px] text-rose-900 leading-snug">{curation.loadError}</p>
              <button
                onClick={() => void curation.reload()}
                className="mt-2 text-[11px] font-semibold text-rose-900 underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {!curation.isLoading && !curation.loadError && curation.actuaciones.length === 0 && (
            <p className="px-6 py-16 text-center text-[12px] text-slate-500">
              Ninguna actuación coincide con el filtro.
            </p>
          )}

          <ul className="divide-y divide-slate-100">
            {curation.actuaciones.map((actuacion) => {
              const badge = STATUS_BADGE[actuacion.term.status];
              const BadgeIcon = badge.icon;
              const isOpen = openActuacion?.id === actuacion.id;

              return (
                <li key={actuacion.id}>
                  <button
                    onClick={() => setSelected(actuacion)}
                    className={`w-full text-left px-6 py-3 transition-colors ${
                      isOpen ? 'bg-blue-50/60' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-slate-900 leading-tight">
                          {actuacion.exactName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {actuacion.legalBasis}
                        </p>
                        {actuacion.term.description && (
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
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
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-900"
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
        <aside className="w-[380px] shrink-0 border-l border-slate-200 overflow-hidden">
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
