import React, { useState } from 'react';
import { Search, Scale, ThumbsUp, ThumbsDown, Copy, Check, Filter, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import {
  searchPrecedents,
  fetchOfficialRuling,
  discoverRulings,
  indexDiscovered,
  citationShape
} from '../services/legalSearch.api';
import type {
  CorpusPrecedent,
  CorpusStatus,
  OfficialRuling,
  DiscoveryResponse
} from '../services/legalSearch.api';

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
  /*
   * El descubrimiento se dispara SOLO cuando el corpus vuelve vacío.
   *
   * Ese vacío es la señal de demanda: dice que un abogado preguntó algo que la
   * cobertura no alcanza. Buscar en cada consulta gastaría dinero en preguntas
   * que el corpus ya responde bien, y no enseñaría nada nuevo sobre dónde falta.
   */
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [indexed, setIndexed] = useState(0);

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
    setDiscovery(null);
    setIndexed(0);
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
      /*
       * El corpus no tuvo nada, y la consulta no es una cita: se busca en el
       * sitio de la Corte. Lo que vuelva se confirma contra el registro oficial
       * antes de mostrarse — el buscador solo apunta.
       */
      if (response.status === 'EMPTY' && !citationShape(query)) {
        setLoadingDiscovery(true);
        try {
          const hallazgo = await discoverRulings(query);
          setDiscovery(hallazgo);

          /*
           * Se indexa en una petición APARTE, después de mostrar.
           *
           * Una función sin servidor se congela al responder: dejar la ingesta
           * detrás de la respuesta no garantiza que termine, y una a medias
           * deja el corpus con la mitad de una sentencia. Así el abogado ve el
           * resultado de inmediato y el corpus crece en segundo plano, pero con
           * una petición que sí espera a terminar.
           *
           * Solo viajan las citas. El servidor vuelve a descargar el texto.
           */
          if (hallazgo.status === 'OK' && hallazgo.found.length > 0) {
            try {
              const { results } = await indexDiscovered(hallazgo.found.map((f) => f.ruling.citation));
              setIndexed(results.filter((r) => r.status === 'INDEXED').length);
            } catch {
              // No indexar no invalida lo encontrado: sigue en pantalla, con su
              // fuente. Solo significa que la próxima consulta volverá a salir.
            }
          }
        } catch {
          // El descubrimiento es un extra: si falla, la pantalla ya dijo que el
          // corpus no tiene nada, que sigue siendo verdad.
        } finally {
          setLoadingDiscovery(false);
        }
      }

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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      <header className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line-200 bg-surface px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink-900">Buscador</h1>
          <p className="mt-0.5 text-meta text-ink-500">
            Jurisprudencia del corpus, y del registro oficial cuando el corpus no alcanza.
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-surface border border-line-200 rounded-card p-4 space-y-3 shadow-e1">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Buscar en el corpus indexado (ej. estabilidad laboral reforzada, mínimo vital, contrato realidad)..."
                className="w-full bg-canvas border border-line-200 rounded-card pl-10 pr-4 py-2.5 text-ink-900 text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-brand-700/20 focus:border-brand-700"
              />
            </div>

            <button
              onClick={runSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2.5 bg-brand-700 text-white rounded-card text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-800 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              <span>{isLoading ? 'Buscando' : 'Buscar'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-line-100 text-[12px] flex-wrap">
            <span className="text-ink-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Corporación:
            </span>
            {CORPORACIONES.map((corp) => (
              <button
                key={corp.id}
                onClick={() => setSelectedCorp(corp.id)}
                className={`px-2.5 py-1 rounded-control text-[11px] font-semibold transition-all ${
                  selectedCorp === corp.id ? 'bg-brand-700 text-white' : 'bg-canvas text-ink-500 hover:bg-line-100'
                }`}
              >
                {corp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {status === null && !isLoading && (
            <div className="bg-surface border border-line-200 rounded-card p-8 text-center text-ink-400 text-[13px]">
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
            <div className="bg-surface border border-line-200 rounded-card p-4 flex items-center gap-2 text-[13px] text-ink-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando la sentencia en el sitio de la Corte…
            </div>
          )}

          {rulingError && !loadingRuling && (
            <div className="bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-unverified flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-ink-900 leading-relaxed">{rulingError}</p>
            </div>
          )}

          {ruling && (
            <div className="bg-surface border-2 border-brand-700 rounded-card overflow-hidden shadow-e1">
              <header className="px-4 py-3 bg-brand-700 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-on-brand font-bold">
                      Traída del sitio oficial de la Corte, no del corpus
                    </p>
                    <h3 className="text-sm font-black">Sentencia {ruling.citation}</h3>
                  </div>
                  <a
                    href={ruling.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-on-brand hover:text-on-brand flex items-center gap-1 flex-shrink-0"
                  >
                    Abrir en la relatoría <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-on-brand mt-1">
                  {[ruling.proceso, ruling.sala, ruling.fecha, ruling.magistrado && `M.P. ${ruling.magistrado}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </header>

              <div className="p-4">
                <p className="text-[13px] text-ink-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {ruling.text.slice(0, 4000)}
                  {ruling.text.length > 4000 && '…'}
                </p>
                {ruling.text.length > 4000 && (
                  <p className="text-[11px] text-ink-500 mt-2">
                    Se muestran los primeros 4.000 de {ruling.text.length.toLocaleString('es-CO')}{' '}
                    caracteres. El texto completo está en la relatoría.
                  </p>
                )}
              </div>
            </div>
          )}

          {loadingDiscovery && (
            <div className="bg-surface border border-line-200 rounded-card p-4 flex items-center gap-2 text-[13px] text-ink-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              El corpus no tiene nada sobre esto. Buscando en el sitio de la Corte…
            </div>
          )}

          {/*
            Lo traído por tema va marcado como lo que es, igual que una cita.

            No estaba en el corpus: se encontró hace segundos porque nadie había
            preguntado esto antes. Mostrarlo junto a lo indexado haría que un
            hallazgo recién descargado pareciera curado.
          */}
          {discovery?.status === 'OK' && discovery.found.length > 0 && (
            <div className="space-y-3">
              <div className="bg-brand-700 text-white rounded-card px-4 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-on-brand font-bold">
                  No estaba en el corpus · traído del sitio oficial de la Corte
                </p>
                <p className="text-[12px]">
                  {discovery.found.length} sentencia{discovery.found.length === 1 ? '' : 's'}{' '}
                  confirmada{discovery.found.length === 1 ? '' : 's'} contra el registro oficial y
                  descargada{discovery.found.length === 1 ? '' : 's'}.
                </p>
                {indexed > 0 && (
                  <p className="text-[11px] text-on-brand mt-0.5">
                    {indexed} quedó{indexed === 1 ? '' : 'aron'} en el corpus: la próxima consulta
                    sobre esto responde al instante.
                  </p>
                )}
              </div>

              {discovery.found.map(({ ruling: r, motivo }) => (
                <div key={r.citation} className="bg-surface border border-line-200 rounded-card overflow-hidden">
                  <header className="px-4 py-3 border-b border-line-100 bg-canvas">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-black text-ink-900">Sentencia {r.citation}</h3>
                        <p className="text-[11px] text-ink-500">
                          {[r.proceso, r.sala, r.fecha, r.magistrado && `M.P. ${r.magistrado}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-brand-700 hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    {motivo && <p className="text-[10px] text-ink-400 mt-1 truncate">{motivo}</p>}
                  </header>
                  <p className="p-4 text-[13px] text-ink-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {r.text.slice(0, 2500)}
                    {r.text.length > 2500 && '…'}
                  </p>
                </div>
              ))}

              {/*
                Lo que el buscador propuso y el registro rechazó. Se muestra a
                propósito: es la única forma de que alguien pueda juzgar si el
                motor está apuntando bien, y esconderlo dejaría un buscador cuya
                puntería nadie puede evaluar.
              */}
              {discovery.descartadas.length > 0 && (
                <details className="bg-canvas border border-line-200 rounded-card p-3">
                  <summary className="text-[11px] text-ink-500 cursor-pointer">
                    {discovery.descartadas.length} propuesta
                    {discovery.descartadas.length === 1 ? '' : 's'} que el registro oficial rechazó
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {discovery.descartadas.map((d) => (
                      <li key={d.cita} className="text-[10px] text-ink-500">
                        <span className="font-semibold">{d.cita}</span> — {d.razon}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {status !== null && visible.length === 0 && !isLoading && (
            <div className="bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card p-6 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-unverified flex-shrink-0 mt-0.5" />
              <div className="text-[13px] text-ink-900 leading-relaxed">
                <p className="font-semibold mb-1">Sin resultados</p>
                <p>{emptyMessage(status, reason, lastQuery)}</p>
              </div>
            </div>
          )}

          {/*
            Lo traído automáticamente se marca en su propia tarjeta.

            Es igual de real que lo curado y no es lo mismo: nadie lo ha leído,
            así que no lleva hechos ni ratio escritos por una persona. Dejarlo
            pasar por curado sería promoverlo en silencio.
          */}
          {/*
            DOS BLOQUES CON ENCABEZADO PROPIO, no un chip perdido en la tarjeta.

            Lo curado lo leyo una persona y lleva sus hechos y su ratio; lo
            automatico lo trajo el buscador del registro oficial y NADIE lo ha
            leido. La diferencia no es un matiz de estilo: citar algo que nadie
            leyo debe costar un clic mas — por eso el bloque automatico no tiene
            boton de copiar cita, solo el camino a la fuente.
          */}
          {visible.filter((i) => i.curado !== false).length > 0 && (
            <p className="t-head rounded-t-card border border-b-0 border-line-200">
              Corpus curado · {visible.filter((i) => i.curado !== false).length} — una persona la leyó y extrajo sus hechos y su ratio
            </p>
          )}
          {visible.filter((i) => i.curado !== false).map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-line-200 rounded-card p-5 space-y-3 shadow-e1"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {item.outcome && (
                    <div className={`w-7 h-7 rounded-control flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.outcome === 'CONCEDIDO' ? 'bg-[rgb(var(--verified-surf))]' : 'bg-[rgb(var(--danger)/0.08)]'
                    }`}>
                      {item.outcome === 'CONCEDIDO'
                        ? <ThumbsUp className="w-3.5 h-3.5 text-verified" />
                        : <ThumbsDown className="w-3.5 h-3.5 text-danger" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    {/* En mono y de primero: es el dato que el abogado copia. */}
                    <h3 className="font-mono text-[13.5px] font-semibold leading-tight text-ink-900">
                      {item.providencia ?? 'Fragmento sin providencia registrada'}
                    </h3>
                    <span className="text-[11px] text-ink-400 font-medium mt-0.5 block">
                      {[item.corporacion?.replace(/_/g, ' '), item.magistradoPonente && `M.P. ${item.magistradoPonente}`, item.branch]
                        .filter(Boolean)
                        .join(' · ') || 'Procedencia no registrada'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-canvas text-ink-700 border border-line-200">
                    {(item.similarity * 100).toFixed(0)}%
                  </span>
                  {item.isSharedCorpus && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                      CORPUS
                    </span>
                  )}
                </div>
              </div>

              <blockquote className="whitespace-pre-wrap border-l-2 border-brand-700 pl-3.5 font-legal text-[13px] leading-[1.7] text-ink-700">
                {readableChunk(item.contentChunk)}
              </blockquote>

              <div className="flex items-center justify-between pt-1">
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brand-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-700" />
                    <span>Leer la providencia en la fuente oficial</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-ink-400 font-medium">
                    Este fragmento no registró su fuente.
                  </span>
                )}

                <button
                  onClick={() => handleCopyCitation(item)}
                  disabled={!item.providencia}
                  className="px-3 py-1.5 bg-canvas hover:bg-line-100 text-ink-700 rounded-control text-[11px] font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copiedId === item.id ? <Check className="w-3 h-3 text-verified" /> : <Copy className="w-3 h-3 text-ink-400" />}
                  <span>{copiedId === item.id ? 'Copiada' : 'Citar en el escrito'}</span>
                </button>
              </div>
            </div>
          ))}

          {/* ─── DESCUBRIMIENTO AUTOMÁTICO · nadie de la firma la ha leído ── */}
          {visible.filter((i) => i.curado === false).length > 0 && (
            <>
              <p className="t-head mt-4 rounded-t-card border border-b-0 border-line-200">
                Descubrimiento automático · {visible.filter((i) => i.curado === false).length} —
                relevancia del modelo, sin lectura humana
              </p>
              {visible.filter((i) => i.curado === false).map((item) => (
                <div
                  key={item.id}
                  /* Más bajo en contraste a propósito: es igual de real y no es lo mismo. */
                  className="space-y-2.5 rounded-card border border-line-200 bg-canvas p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {/* La providencia en mono: es el dato que se copia. */}
                      <h3 className="font-mono text-[13.5px] font-semibold text-ink-900">
                        {item.providencia ?? 'Fragmento sin providencia registrada'}
                      </h3>
                      <span className="mt-0.5 block text-[12px] text-ink-500">
                        {[item.corporacion?.replace(/_/g, ' '), item.magistradoPonente && `M.P. ${item.magistradoPonente}`]
                          .filter(Boolean)
                          .join(' · ') || 'Procedencia no registrada'}
                      </span>
                    </div>
                    <span className="chip-unverified shrink-0">Automático</span>
                  </div>

                  {/* Filete PUNTEADO: la cita de algo que nadie ha leído. */}
                  <blockquote className="border-l-2 border-dashed border-line-200 pl-3 font-legal text-[13px] leading-[1.7] text-ink-700">
                    {readableChunk(item.contentChunk).slice(0, 600)}
                  </blockquote>

                  {/*
                    SIN BOTÓN DE CITAR. El único camino es leerla en la fuente:
                    citar algo que nadie leyó debe costar un clic más.
                  */}
                  <div className="flex items-center justify-between">
                    <span className="text-meta text-ink-400">
                      Hallada en el registro oficial · sin lectura humana
                    </span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11.5px] font-semibold text-brand-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Leer en la fuente oficial
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
