import React from 'react';
import { AlertTriangle, Compass, ExternalLink, Loader2, PenLine, Search } from 'lucide-react';
import { triageApi, type TriageResponse } from '../services/catalog.api';
import { BRANCH_LABELS } from '../branchLabels';
import type { MainView } from '../../tenant/types';

/**
 * Orientation for the lawyer who does not know what to ask.
 *
 * WHY THIS SCREEN EXISTS. Every other entry point assumes the legal question is
 * already formed: the search wants a doctrine, the workspace wants the name of a
 * filing. A junior with a case has neither — they have a person telling them
 * what happened. The catalogue held the answer and there was no door from facts
 * to it.
 *
 * WHAT IT SHOWS, AND WHAT IT DELIBERATELY DOES NOT. Each suggestion is the
 * catalogue's own record: the verified term, the article it was read in, the
 * competent authority. The model's sentence appears too, clearly as its reason
 * for proposing it — never as a statement about the law. A junior told "this is
 * a tutela" believes it, so nothing here is phrased as a determination.
 *
 * The deadline is shown because it is the thing that runs out while somebody is
 * deciding what to do, and it is exactly what this user does not know to ask
 * for.
 */

interface TriageViewProps {
  /** Lets a suggestion become a draft without retyping its name. */
  onDraft: (actuacionName: string, branch: string) => void;
  setMainView: (view: MainView) => void;
}

const EJEMPLOS = [
  'A mi cliente le están descontando todo el sueldo por un embargo y tiene tres hijos menores.',
  'Despidieron a una trabajadora que llevaba dos meses de embarazo.',
  'El padre de los niños no ha dado alimentos en ocho meses.'
];

export const TriageView: React.FC<TriageViewProps> = ({ onDraft, setMainView }) => {
  const [hechos, setHechos] = React.useState('');
  const [result, setResult] = React.useState<TriageResponse | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');

  const orientar = async (texto?: string) => {
    const consulta = (texto ?? hechos).trim();
    if (consulta.length < 20 || cargando) return;

    if (texto) setHechos(texto);
    setCargando(true);
    setError('');
    setResult(null);

    try {
      setResult(await triageApi.orientar(consulta));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener la orientación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              ¿Qué actuación corresponde?
            </h2>
            <p className="text-[11px] text-slate-500">
              Describe los hechos como te los contaron. No necesitas saber el nombre jurídico.
            </p>
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <textarea
            value={hechos}
            onChange={(e) => setHechos(e.target.value)}
            placeholder="Ej: a mi cliente lo detuvieron anoche y no le han dicho de qué lo acusan…"
            rows={4}
            className="w-full text-[13px] text-slate-800 border border-slate-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-blue-900"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-slate-400">
              {hechos.trim().length < 20
                ? 'Cuéntalo con algo más de detalle: quién, qué pasó y qué se busca.'
                : `${hechos.trim().length} caracteres`}
            </p>
            <button
              onClick={() => void orientar()}
              disabled={hechos.trim().length < 20 || cargando}
              className="px-4 py-2 bg-blue-950 text-white text-[11px] font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-900 shrink-0 flex items-center gap-2"
            >
              {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {cargando ? 'Buscando…' : 'Orientarme'}
            </button>
          </div>

          {!result && !cargando && (
            <div className="pt-1 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 mb-1.5">O prueba con uno de estos:</p>
              <div className="space-y-1">
                {EJEMPLOS.map((e) => (
                  <button
                    key={e}
                    onClick={() => void orientar(e)}
                    className="block text-left text-[11px] text-blue-800 hover:underline"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-900">{error}</p>
          </div>
        )}

        {/*
          El silencio se dice, no se rellena.

          Un catálogo que responde tres actuaciones al azar ante unos hechos que
          no reconoce presenta su propio vacío como tres hallazgos. Y a un junior
          eso lo manda por un camino que nadie eligió.
        */}
        {result && result.status !== 'OK' && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[12px] text-amber-900 leading-relaxed">
              <p className="font-semibold mb-1">
                {result.status === 'SIN_COINCIDENCIA'
                  ? 'El catálogo no reconoce una actuación para estos hechos'
                  : 'La orientación no está disponible'}
              </p>
              <p>{result.reason}</p>
              {result.status === 'SIN_COINCIDENCIA' && (
                <button
                  onClick={() => setMainView('search')}
                  className="mt-2 text-[11px] text-blue-800 hover:underline"
                >
                  Buscar jurisprudencia sobre estos hechos →
                </button>
              )}
            </div>
          </div>
        )}

        {result?.status === 'OK' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500 px-1">
              {result.suggestions.length} actuación{result.suggestions.length === 1 ? '' : 'es'} del
              catálogo que podrían aplicar. Cada una con su término verificado — decide tú cuál
              corresponde.
            </p>

            {result.suggestions.map(({ actuacion: a, razon }) => (
              <article key={a.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <header className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-blue-950 uppercase tracking-wide">
                        {BRANCH_LABELS[a.branch] ?? a.branch}
                      </span>
                      <h3 className="text-[13px] font-black text-slate-900">{a.exactName}</h3>
                    </div>
                    <button
                      onClick={() => onDraft(a.exactName, a.branch)}
                      className="text-[10px] font-bold text-white bg-blue-950 hover:bg-blue-900 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <PenLine className="w-3 h-3" />
                      Redactar
                    </button>
                  </div>
                  {razon && <p className="text-[11px] text-slate-600 mt-1.5 italic">{razon}</p>}
                </header>

                <div className="p-4 space-y-2">
                  {/*
                    El término va primero porque es lo que se vence mientras
                    alguien decide qué hacer, y es exactamente lo que este
                    usuario no sabe que tiene que preguntar.
                  */}
                  <div
                    className={`rounded-lg p-2.5 border ${
                      a.term.status === 'NO_VERIFICADO'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-0.5">
                      {a.term.status === 'NO_CADUCA'
                        ? 'No caduca'
                        : a.term.status === 'NO_VERIFICADO'
                        ? 'Término no verificado'
                        : 'Término'}
                    </p>
                    <p className="text-[11px] text-slate-800 leading-relaxed">
                      {a.term.description ?? 'Nadie ha comprobado este término. No lo des por cierto.'}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-800">Fundamento:</span> {a.legalBasis}
                  </p>

                  {a.competentAuthority && (
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">Ante quién:</span>{' '}
                      {a.competentAuthority}
                    </p>
                  )}

                  {a.sourceUrl && (
                    <a
                      href={a.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      Ver la norma <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}

            {/*
              Lo que el modelo propuso y el catálogo tumbó. Visible a propósito:
              si el motor empieza a inventar nombres, esta lista lo dice antes de
              que alguien lo note por otra vía.
            */}
            {result.descartadas.length > 0 && (
              <details className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <summary className="text-[11px] text-slate-600 cursor-pointer">
                  {result.descartadas.length} propuesta
                  {result.descartadas.length === 1 ? '' : 's'} que el catálogo no reconoció
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {result.descartadas.map((d) => (
                    <li key={d} className="text-[10px] text-slate-500">
                      {d}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <p className="text-[10px] text-slate-500 px-1 pb-2">
              Esto orienta, no decide. La calificación jurídica del caso es tuya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
