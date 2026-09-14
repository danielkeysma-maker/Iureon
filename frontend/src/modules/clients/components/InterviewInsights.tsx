import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { clientsApi, type InterviewSuggestion } from '../clients.api';
import { cercaniaEnPalabras } from '../entrevistaEnPantalla';

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
 *
 * LA CERCANÍA VA EN PALABRAS Y NO EN PORCENTAJE (cara nueva). «64 %» se lee
 * como la probabilidad de que la providencia aplique; es parecido de lenguaje,
 * y la pantalla no debe sugerir más que eso.
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
    <section className="cn-ent-sugerencias" aria-labelledby="cn-ent-sugerencias-titulo">
      <div className="cn-ent-seccion-cabeza">
        <div className="cn-ent-seccion-textos">
          <h2 id="cn-ent-sugerencias-titulo" className="cn-ent-h2">Jurisprudencia relacionada</h2>
          <p className="cn-ent-texto">Se busca en el corpus a partir de lo que dijo el cliente, no de sus preguntas.</p>
        </div>

        <button
          type="button"
          onClick={() => void consultar()}
          disabled={cargando}
          className="cn-ini-boton cn-ini-boton--suave cn-ent-boton"
        >
          <RefreshCw size={16} className={cargando ? 'cn-ent-girando' : undefined} aria-hidden="true" />
          {cargando ? 'Buscando…' : consultado ? 'Buscar de nuevo' : 'Buscar'}
        </button>
      </div>

      {reason && <p className="cn-ent-nota cn-ent-nota--caja">{reason}</p>}

      {consultado && !cargando && suggestions.length === 0 && !reason && (
        <p className="cn-ent-nota cn-ent-nota--caja">
          El corpus no tiene nada suficientemente cercano a lo que narró el cliente. Eso es una
          respuesta, no un fallo: son 62 providencias, no toda la jurisprudencia colombiana.
        </p>
      )}

      {suggestions.length > 0 && (
        <>
          <ul className="cn-ent-sugerencia-lista">
            {suggestions.map((s, i) => (
              <li key={`${s.providencia}-${i}`} className="cn-ent-sugerencia">
                <div className="cn-ent-sugerencia-cabeza">
                  <div className="cn-ent-sugerencia-id">
                    <span className="cn-ent-sugerencia-titulo cn-ent-mono">
                      {s.providencia ?? 'Providencia sin identificar'}
                    </span>
                    {(s.corporacion || s.ponente) && (
                      <span className="cn-ent-nota">{[s.corporacion, s.ponente].filter(Boolean).join(' · ')}</span>
                    )}
                  </div>
                  <span className="cn-ent-chip cn-ent-chip--neutro" title="Cercanía de lenguaje, no aplicabilidad">
                    {cercaniaEnPalabras(s.similarity)}
                  </span>
                </div>

                <p className="cn-ent-texto">{s.excerpt}</p>

                {/*
                  What the client said that produced this. Without it the card is
                  an assertion; with it the lawyer can dismiss it in a second.
                */}
                <p className="cn-ent-cita">Sale de: «{s.fromClient}»</p>

                {s.sourceUrl && (
                  <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-ent-enlace">
                    Ver la providencia
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>

          <p className="cn-ent-nota">
            Son sugerencias por cercanía de lenguaje, no dictámenes de aplicabilidad: los hechos pueden
            parecerse y la providencia no gobernar el caso. Verifique cada una antes de citarla.
          </p>
        </>
      )}
    </section>
  );
};
