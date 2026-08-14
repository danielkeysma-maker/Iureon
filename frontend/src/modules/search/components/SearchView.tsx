import React, { useState } from 'react';
import { Search, Scale, ThumbsUp, ThumbsDown, Copy, Check, Filter, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { useTenant } from '../../tenant/TenantContext';
import { searchPrecedents } from '../services/legalSearch.api';
import type { CorpusPrecedent, CorpusStatus } from '../services/legalSearch.api';

/**
 * Jurisprudence search over the ingested corpus.
 *
 * This screen used to hold seventeen rulings written by hand, each with a
 * magistrado ponente, a citation ready to paste into a brief, and a `fullText`
 * carrying CONSIDERANDO and RESUELVE composed here. One of them cited
 * "SU-049 de 2022" — a providencia that does not exist; the real unification on
 * estabilidad laboral reforzada is SU-049 de 2017. The doctrine read roughly
 * right, which is what made it dangerous: nobody re-checks a number that looks
 * correct, and the citation was one click from a real brief.
 *
 * Two rules follow from that and are load-bearing here:
 *
 *  1. Nothing is rendered that the server did not source. When the corpus is
 *     empty the screen SAYS the corpus is empty — it never fills the space.
 *  2. A chunk is not a ruling. There is no "read the full sentencia" view,
 *     because holding a thousand characters and calling it the providencia
 *     would be the same lie in a new place. The card links to the official
 *     source instead.
 */

const CORPORACIONES = [
  { id: 'TODAS', label: 'Todas las corporaciones' },
  { id: 'CORTE_CONSTITUCIONAL', label: 'Corte Constitucional' },
  { id: 'CORTE_SUPREMA', label: 'Corte Suprema' },
  { id: 'CONSEJO_ESTADO', label: 'Consejo de Estado' }
];

/** What to tell the lawyer when there is nothing to show, per status. */
const emptyMessage = (status: CorpusStatus, reason: string | undefined, query: string): string => {
  switch (status) {
    case 'NOT_SEEDED':
      return reason ?? 'El corpus de jurisprudencia todavía no tiene providencias indexadas.';
    case 'NO_PROVIDER':
      return reason ?? 'No hay un proveedor de embeddings configurado, así que la consulta no se puede convertir en vector.';
    case 'NO_INDEX':
      return reason ?? 'La base de datos no está configurada, así que no hay índice sobre el cual buscar.';
    case 'FAILED':
      return reason ?? 'La búsqueda no pudo completarse.';
    default:
      return `Sin coincidencias para "${query}" en el corpus indexado.`;
  }
};

export const SearchView: React.FC = () => {
  const { firmId } = useTenant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorp, setSelectedCorp] = useState('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [results, setResults] = useState<CorpusPrecedent[]>([]);
  const [status, setStatus] = useState<CorpusStatus | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (!query || !firmId) return;

    setIsLoading(true);
    setLastQuery(query);

    try {
      const response = await searchPrecedents(firmId, query);
      setResults(response.items ?? []);
      setStatus(response.status);
      setReason(response.reason);
    } catch (error) {
      setResults([]);
      setStatus('FAILED');
      setReason(error instanceof Error ? error.message : 'La búsqueda no pudo completarse.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering happens on provenance the server actually sent. An entry with no
  // recorded corporación is not silently assigned one.
  const visible = results.filter(
    (item) => selectedCorp === 'TODAS' || item.corporacion === selectedCorp
  );

  const handleCopyCitation = (item: CorpusPrecedent) => {
    // Only what the record holds. No composed citation string: a citation is
    // the one thing here that ends up verbatim inside a legal brief.
    const parts = [item.providencia, item.corporacion?.replace(/_/g, ' '), item.magistradoPonente && `M.P. ${item.magistradoPonente}`];
    const citation = parts.filter(Boolean).join(', ');
    if (!citation) return;

    navigator.clipboard.writeText(citation);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-slate-50/50 p-6 lg:p-8 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Buscar en el corpus indexado (ej. estabilidad laboral reforzada, mínimo vital, contrato realidad)..."
                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40"
              />
            </div>

            <button
              onClick={runSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2.5 bg-blue-950 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-900 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              <span>{isLoading ? 'Buscando' : 'Buscar'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[12px] flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Corporación:
            </span>
            {CORPORACIONES.map((corp) => (
              <button
                key={corp.id}
                onClick={() => setSelectedCorp(corp.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  selectedCorp === corp.id ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {corp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {status === null && !isLoading && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-400 text-[13px]">
              Escriba una consulta para buscar en el corpus indexado.
            </div>
          )}

          {status !== null && visible.length === 0 && !isLoading && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-6 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">Sin resultados</p>
                <p>{emptyMessage(status, reason, lastQuery)}</p>
              </div>
            </div>
          )}

          {visible.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {item.outcome && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.outcome === 'CONCEDIDO' ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}>
                      {item.outcome === 'CONCEDIDO'
                        ? <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        : <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-[14px] leading-tight">
                      {item.providencia ?? 'Fragmento sin providencia registrada'}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                      {[item.corporacion?.replace(/_/g, ' '), item.magistradoPonente && `M.P. ${item.magistradoPonente}`, item.branch]
                        .filter(Boolean)
                        .join(' · ') || 'Procedencia no registrada'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {(item.similarity * 100).toFixed(0)}%
                  </span>
                  {item.isSharedCorpus && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                      CORPUS
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[12px] text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg whitespace-pre-wrap">
                {item.contentChunk}
              </div>

              <div className="flex items-center justify-between pt-1">
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-900 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                    <span>Leer la providencia en la fuente oficial</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Este fragmento no registró su fuente.
                  </span>
                )}

                <button
                  onClick={() => handleCopyCitation(item)}
                  disabled={!item.providencia}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copiedId === item.id ? 'Copiado' : 'Copiar cita'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
