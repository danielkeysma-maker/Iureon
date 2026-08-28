import React from 'react';
import { BookOpen, ExternalLink, Lightbulb, RefreshCw } from 'lucide-react';
import { clientsApi, type InterviewSuggestion } from '../clients.api';

interface InterviewInsightsProps {
  transcriptionId: string;
}

/**
 * Jurisprudence the corpus offers for what the CLIENT said.
 *
 * WHY ON DEMAND AND NOT AUTOMATIC. The suggestions depend on which voice was
 * marked as the client, and that happens after the transcript exists. Running
 * this the moment a transcription lands would search a conversation where
 * nobody is the client yet, and answer with whatever the lawyer's own questions
 * happened to resemble.
 *
 * WHY EVERY CARD SHOWS THE CLIENT'S WORDS. This is vector similarity over a
 * conversation and a similar paragraph is not an applicable precedent — the
 * facts may rhyme and the ruling still not govern. Showing what produced each
 * match lets the lawyer dismiss it in a second, which is what most of them
 * deserve. Same contract as the role proposer and the name suggestions: this
 * offers, and a human decides.
 *
 * WHAT IS ABSENT, SAID OUT LOUD: doctrine. The corpus holds 62 providencias and
 * no doctrinal work, so a "doctrina" tab here would be labelling one thing as
 * another.
 */
export const InterviewInsights: React.FC<InterviewInsightsProps> = ({ transcriptionId }) => {
  const [suggestions, setSuggestions] = React.useState<InterviewSuggestion[]>([]);
  const [reason, setReason] = React.useState('');
  const [cargando, setCargando] = React.useState(false);
  const [consultado, setConsultado] = React.useState(false);

  const consultar = async () => {
    setCargando(true);
    setReason('');

    try {
      const respuesta = await clientsApi.insights(transcriptionId);
      setSuggestions(respuesta.suggestions);
      setReason(respuesta.reason ?? '');
    } catch (err) {
      setReason(err instanceof Error ? err.message : 'No se pudieron obtener sugerencias.');
    } finally {
      setCargando(false);
      setConsultado(true);
    }
  };

  return (
    <div className="bg-surface border border-line-200 rounded-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-unverified shrink-0" />
          <div>
            <h4 className="font-bold text-ink-900 text-xs">Jurisprudencia relacionada</h4>
            <p className="text-[11px] text-ink-500">
              Busca en el corpus a partir de lo que dijo el cliente, no de tus preguntas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void consultar()}
          disabled={cargando}
          className="px-2.5 py-1 bg-canvas hover:bg-line-100 text-ink-700 border border-line-200 rounded-control text-[11px] font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${cargando ? 'animate-spin' : ''}`} />
          <span>{consultado ? 'Buscar de nuevo' : 'Buscar'}</span>
        </button>
      </div>

      {reason && <p className="text-[11px] text-ink-500 bg-canvas border border-line-200 rounded-control p-2">{reason}</p>}

      {consultado && !cargando && suggestions.length === 0 && !reason && (
        <p className="text-[11px] text-ink-500">
          El corpus no tiene nada suficientemente cercano a lo que narró el cliente. Eso es una
          respuesta, no un fallo: son 62 providencias, no toda la jurisprudencia colombiana.
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={`${s.providencia}-${i}`} className="border border-line-200 rounded-control p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-ink-900 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-ink-400 shrink-0" />
                    {s.providencia ?? 'Providencia sin identificar'}
                  </p>
                  <p className="text-[10px] text-ink-500">
                    {[s.corporacion, s.ponente].filter(Boolean).join(' · ')}
                  </p>
                </div>

                <span className="text-[10px] font-mono text-ink-400 shrink-0" title="Cercanía semántica, no aplicabilidad">
                  {(s.similarity * 100).toFixed(0)}%
                </span>
              </div>

              <p className="text-[11px] text-ink-700 leading-relaxed">{s.excerpt}</p>

              {/*
                What the client said that produced this. Without it the card is
                an assertion; with it the lawyer can dismiss it in a second.
              */}
              <p className="text-[10px] text-ink-500 border-l-2 border-line-200 pl-2">
                Sale de: «{s.fromClient}»
              </p>

              {s.sourceUrl && (
                <a
                  href={s.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-brand-700 hover:underline flex items-center gap-1"
                >
                  Ver la providencia
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          ))}

          <p className="text-[10px] text-ink-500">
            Son sugerencias por cercanía de lenguaje, no dictámenes de aplicabilidad: los hechos
            pueden parecerse y la providencia no gobernar el caso. Verifica cada una antes de
            citarla.
          </p>
        </div>
      )}
    </div>
  );
};
