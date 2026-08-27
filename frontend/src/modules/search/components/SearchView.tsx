import React, { useState } from 'react';
import { Search, Scale, ThumbsUp, ThumbsDown, Copy, Check, Filter, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import {
  searchPrecedents,
  fetchOfficialRuling,
  citationShape
} from '../services/legalSearch.api';
import type { CorpusPrecedent, CorpusStatus, OfficialRuling } from '../services/legalSearch.api';

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

/**
 * Strips the header the ingestion pipeline prepends to every stored chunk.
 *
 * Each chunk is saved as `[CORPORACIÓN: …] [TIPO: …] [PROVIDENCIA: …] [PONENTE:
 * …] [RESULTADO: …]` followed by HECHOS and RATIO lines, because the embedding
 * is computed over that whole string and the metadata helps it match. Useful to
 * the model, noise to a reader: the card already shows the providencia, the
 * corporación and the ponente in their own fields, so the block repeated them in
 * shouting brackets before the actual text of the ruling began.
 *
 * Falls back to the raw chunk if the shape is not what we expect. Showing a
 * little plumbing beats showing nothing.
 */
const readableChunk = (chunk: string): string => {
  const body = chunk.split(/\n\s*\n/).slice(1).join('\n\n').trim();
  return body || chunk;
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorp, setSelectedCorp] = useState('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [results, setResults] = useState<CorpusPrecedent[]>([]);
  const [status, setStatus] = useState<CorpusStatus | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  /*
   * Una sentencia traída del sitio oficial vive aparte de los resultados del
   * corpus, y esa separación es el punto.
   *
   * El corpus contiene providencias leídas e indexadas; esto se descargó hace
   * dos segundos porque el abogado la nombró. Mezclarlas en la misma lista haría
   * que un texto recién traído pareciera curado — la misma confusión que ya se
   * evitó entre un concepto y una sentencia.
   */
  const [ruling, setRuling] = useState<OfficialRuling | null>(null);
  const [rulingError, setRulingError] = useState('');
  const [loadingRuling, setLoadingRuling] = useState(false);

  const runSearch = async () => {
    const query = searchQuery.trim();

    // This used to also require a firm, and returned SILENTLY without one: the
    // user typed, pressed Buscar, and nothing happened — no results, no error,
    // no reason — while the screen still read "Escriba una consulta", blaming
    // them for it. The corpus is shared product knowledge, so no firm is needed
    // to read it.
    if (!query) return;

    setIsLoading(true);
    setRuling(null);
    setRulingError('');
    setLastQuery(query);

    try {
      const response = await searchPrecedents(query);
      setResults(response.items ?? []);
      setStatus(response.status);
      setReason(response.reason);

      /*
       * Si la consulta tiene forma de cita, se pide también al sitio oficial.
       *
       * El corpus tiene 62 providencias de 29.424, así que un abogado que nombra
       * una sentencia casi siempre nombra una que no está. Decirle que no hay
       * nada cuando la Corte la publica sería falso; el servidor la confirma
       * contra el registro del Estado antes de descargar nada.
       */
      if (citationShape(query)) {
        setLoadingRuling(true);
        try {
          const { ruling: traida } = await fetchOfficialRuling(query);
          setRuling(traida);
        } catch (err) {
          // El mensaje del servidor distingue "no existe" de "no se pudo
          // consultar", y esa diferencia es la que el abogado necesita.
          setRulingError(err instanceof Error ? err.message : 'No se pudo traer la sentencia.');
        } finally {
          setLoadingRuling(false);
        }
      }
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

          {/*
            La sentencia traída del sitio oficial va ARRIBA y se ve distinta.

            No es un resultado del corpus y no puede parecerlo: se descargó al
            momento porque el abogado la nombró, y lo que se muestra es el texto
            que respondió la relatoría, no un fragmento curado. La procedencia
            —ponente, fecha, sala— viene del registro oficial del Estado, que es
            además lo que confirmó que la sentencia existe antes de descargarla.
          */}
          {loadingRuling && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center gap-2 text-[13px] text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando la sentencia en el sitio de la Corte…
            </div>
          )}

          {rulingError && !loadingRuling && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-900 leading-relaxed">{rulingError}</p>
            </div>
          )}

          {ruling && (
            <div className="bg-white border-2 border-blue-900/25 rounded-xl overflow-hidden shadow-sm">
              <header className="px-4 py-3 bg-blue-950 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-blue-300 font-bold">
                      Traída del sitio oficial de la Corte, no del corpus
                    </p>
                    <h3 className="text-sm font-black">Sentencia {ruling.citation}</h3>
                  </div>
                  <a
                    href={ruling.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-200 hover:text-white flex items-center gap-1 flex-shrink-0"
                  >
                    Abrir en la relatoría <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-blue-200 mt-1">
                  {[ruling.proceso, ruling.sala, ruling.fecha, ruling.magistrado && `M.P. ${ruling.magistrado}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </header>

              <div className="p-4">
                <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {ruling.text.slice(0, 4000)}
                  {ruling.text.length > 4000 && '…'}
                </p>
                {ruling.text.length > 4000 && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Se muestran los primeros 4.000 de {ruling.text.length.toLocaleString('es-CO')}{' '}
                    caracteres. El texto completo está en la relatoría.
                  </p>
                )}
              </div>
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
                {readableChunk(item.contentChunk)}
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
