import React from 'react';
import { AlertTriangle, Clock, Compass, ExternalLink, Loader2, PenLine, Search } from 'lucide-react';
import { triageApi, type OrientacionGuardada, type TriageResponse } from '../services/catalog.api';
import { ApiError } from '../../../config/httpClient';
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
  /**
   * Turns a suggestion into a draft carrying the name AND the facts.
   *
   * The facts travel because the lawyer already wrote them here. Asking for
   * them again is how a two-screen flow becomes two transcriptions of the same
   * story, and the second one is always shorter than the first.
   */
  onDraft: (actuacionName: string, branch: string, hechos: string) => void;
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
  /*
   * El historial: cada consulta guardada vale para la siguiente — la mitad de
   * los casos que entran a una firma se parecen a uno anterior. Y los huecos
   * (consultas iguales sin actuacion, contadas) son la lista de trabajo del
   * catalogo.
   */
  const [historial, setHistorial] = React.useState<OrientacionGuardada[]>([]);
  const [huecos, setHuecos] = React.useState<Array<{ hechos: string; veces: number }>>([]);
  const [busquedaHist, setBusquedaHist] = React.useState('');

  const cargarHistorial = React.useCallback(() => {
    triageApi
      .historial()
      .then((r) => {
        if (r.success) {
          setHistorial(r.historial);
          setHuecos(r.huecos);
        }
      })
      .catch(() => {
        /* El historial es un extra: sin el, la consulta sigue funcionando. */
      });
  }, []);

  React.useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  /*
   * El cupo agotado se separa del error, y no es un detalle de estilo.
   *
   * Pintarlo en rojo junto a las averías le enseña al abogado que la aplicación
   * se rompió, cuando lo que pasó es que usó su cupo del día. Una es una falla
   * nuestra y la otra es una regla nuestra; confundirlas hace que deje de leer
   * las dos.
   */
  /*
   * Sin saldo Y sin cupo. No es lo mismo que un error, ni que un muro: el
   * abogado puede seguir hoy mismo recargando, y decirlo en rojo junto a las
   * averías le enseñaría que la aplicación se rompió.
   */
  const [sinSaldo, setSinSaldo] = React.useState('');

  const orientar = async (texto?: string) => {
    const consulta = (texto ?? hechos).trim();
    if (consulta.length < 20 || cargando) return;

    if (texto) setHechos(texto);
    setCargando(true);
    setError('');
    setSinSaldo('');
    setResult(null);

    try {
      setResult(await triageApi.orientar(consulta));
      // La consulta recien hecha aparece en el historial sin recargar la pantalla.
      cargarHistorial();
    } catch (err) {
      // 429 es "ya usaste el de hoy", no "esto falló".
      if (err instanceof ApiError && err.status === 402) {
        setSinSaldo(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo obtener la orientación.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
      <div className="max-w-4xl mx-auto space-y-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-card bg-brand-700 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-on-brand" />
          </div>
          <div>
            <h2 className="text-lg font-black text-ink-900 tracking-tight">
              ¿Qué actuación corresponde?
            </h2>
            <p className="text-[11px] text-ink-500">
              Describe los hechos como te los contaron. No necesitas saber el nombre jurídico.
            </p>
          </div>
        </div>

        <section className="bg-surface border border-line-200 rounded-card p-4 space-y-3">
          <textarea
            value={hechos}
            onChange={(e) => setHechos(e.target.value)}
            placeholder="Ej: a mi cliente lo detuvieron anoche y no le han dicho de qué lo acusan…"
            rows={4}
            className="w-full text-[13px] text-ink-900 border border-line-200 rounded-control p-3 resize-y focus:outline-none focus:ring-1 focus:ring-brand-700"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-ink-400">
              {hechos.trim().length < 20
                ? 'Cuéntalo con algo más de detalle: quién, qué pasó y qué se busca.'
                : `${hechos.trim().length} caracteres`}
            </p>
            <button
              onClick={() => void orientar()}
              disabled={hechos.trim().length < 20 || cargando}
              className="px-4 py-2 bg-brand-700 text-white text-[11px] font-bold rounded-control disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-800 shrink-0 flex items-center gap-2"
            >
              {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {cargando ? 'Buscando…' : 'Orientarme'}
            </button>
          </div>

          {!result && !cargando && (
            <div className="pt-1 border-t border-line-100">
              <p className="text-[10px] text-ink-400 mb-1.5">O prueba con uno de estos:</p>
              <div className="space-y-1">
                {EJEMPLOS.map((e) => (
                  <button
                    key={e}
                    onClick={() => void orientar(e)}
                    className="block text-left text-[11px] text-brand-700 hover:underline"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-[rgb(var(--danger)/0.06)] border border-[rgb(var(--danger)/0.35)] rounded-card p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <p className="text-[11px] text-danger">{error}</p>
          </div>
        )}

        {/*
          El silencio se dice, no se rellena.

          Un catálogo que responde tres actuaciones al azar ante unos hechos que
          no reconoce presenta su propio vacío como tres hallazgos. Y a un junior
          eso lo manda por un camino que nadie eligió.
        */}
        {sinSaldo && (
          <div className="bg-canvas border border-line-200 rounded-card p-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-ink-500 shrink-0 mt-0.5" />
            <div className="text-[12px] text-ink-700 leading-relaxed">
              <p className="font-semibold mb-1 text-ink-900">Cupo gratuito de hoy agotado</p>
              <p>{sinSaldo}</p>
              <button
                onClick={() => setMainView('search')}
                className="mt-2 text-[11px] text-brand-700 hover:underline"
              >
                Buscar jurisprudencia mientras tanto →
              </button>
            </div>
          </div>
        )}

        {/*
          El aviso va ANTES del cobro, no después.
          Enterarse de que una consulta costaba cuando ya se cobró es la forma
          más rápida de que un abogado deje de confiar en el saldo.
        */}
        {result?.cupoRestante !== undefined && result.cupoRestante <= 5 && (
          <p className="text-[11px] text-ink-500 px-1">
            {result.cupoRestante > 0
              ? `Te quedan ${result.cupoRestante} orientaciones gratuitas hoy. Después de eso, cada una descuenta $50 del saldo.`
              : `Ya usaste las gratuitas de hoy${
                  result.cobradoCop ? `; esta descontó $${result.cobradoCop} del saldo` : ''
                }. Mañana se reinicia el cupo.`}
          </p>
        )}

        {result && result.status !== 'OK' && (
          <div className="bg-[rgb(var(--unverified-surf))]/60 border border-[rgb(var(--unverified-line))] rounded-card p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-unverified shrink-0 mt-0.5" />
            <div className="text-[12px] text-ink-900 leading-relaxed">
              <p className="font-semibold mb-1">
                {result.status === 'SIN_COINCIDENCIA'
                  ? 'El catálogo no reconoce una actuación para estos hechos'
                  : 'La orientación no está disponible'}
              </p>
              <p>{result.reason}</p>

              {/*
                LO QUE PUEDE FALTAR PRECISAR: las preguntas vienen del motor y
                se presentan como lo que son — datos cuya respuesta cambiaria
                la via procesal. No es un error del abogado: es la conversacion
                que un colega tendria.
              */}
              {result.status === 'SIN_COINCIDENCIA' && (result.preguntas?.length ?? 0) > 0 && (
                <div className="mt-2.5">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                    Puede que falte precisar
                  </p>
                  <ol className="mt-1 space-y-1">
                    {result.preguntas!.map((q, i) => (
                      <li key={i} className="flex gap-2 text-[12px] text-ink-900">
                        <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {result.status === 'SIN_COINCIDENCIA' && (
                <button
                  onClick={() => setMainView('search')}
                  className="mt-2 text-[11px] text-brand-700 hover:underline"
                >
                  Buscar jurisprudencia sobre estos hechos →
                </button>
              )}
            </div>
          </div>
        )}

        {result?.status === 'OK' && (
          <div className="space-y-3">
            {/*
              LO QUE EL CATALOGO LEYO. La lectura del modelo que produjo las
              sugerencias, como chips: si dice LABORAL y el caso es de familia,
              el abogado corrige el rumbo aqui — antes de abrir fichas
              equivocadas. Se etiqueta como lectura, no como hecho.
            */}
            {result.senales && (result.senales.rama || result.senales.elementos.length > 0) && (
              <div className="rounded-card border border-line-200 bg-surface px-4 py-3">
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  Lo que el catálogo leyó
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {result.senales.rama && (
                    <span className="rounded-control bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {result.senales.rama}
                    </span>
                  )}
                  {result.senales.elementos.map((e) => (
                    <span key={e} className="chip-neutral">
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-ink-400">
                  Lectura del motor, no un hecho: si algo no corresponde, corrija los hechos y
                  vuelva a orientar.
                </p>
              </div>
            )}

            <p className="text-[11px] text-ink-500 px-1">
              {result.suggestions.length} actuación{result.suggestions.length === 1 ? '' : 'es'} del
              catálogo que podrían aplicar. Cada una con su término verificado — decide tú cuál
              corresponde.
            </p>

            {result.suggestions.map(({ actuacion: a, razon }) => (
              <article key={a.id} className="bg-surface border border-line-200 rounded-card overflow-hidden">
                <header className="px-4 py-3 border-b border-line-100 bg-canvas">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wide">
                        {BRANCH_LABELS[a.branch] ?? a.branch}
                      </span>
                      <h3 className="text-[13px] font-black text-ink-900">{a.exactName}</h3>
                    </div>
                    <button
                      onClick={() => onDraft(a.exactName, a.branch, hechos.trim())}
                      className="text-[10px] font-bold text-white bg-brand-700 hover:bg-brand-800 px-2.5 py-1.5 rounded-control flex items-center gap-1 shrink-0"
                    >
                      <PenLine className="w-3 h-3" />
                      Redactar
                    </button>
                  </div>
                  {razon && <p className="text-[11px] text-ink-500 mt-1.5 italic">{razon}</p>}
                </header>

                <div className="p-4 space-y-2">
                  {/*
                    El término va primero porque es lo que se vence mientras
                    alguien decide qué hacer, y es exactamente lo que este
                    usuario no sabe que tiene que preguntar.
                  */}
                  <div
                    className={`rounded-control p-2.5 border ${
                      a.term.status === 'NO_VERIFICADO'
                        ? 'bg-[rgb(var(--unverified-surf))] border-[rgb(var(--unverified-line))]'
                        : 'bg-canvas border-line-200'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-ink-700 uppercase tracking-wide mb-0.5">
                      {a.term.status === 'NO_CADUCA'
                        ? 'No caduca'
                        : a.term.status === 'NO_VERIFICADO'
                        ? 'Término no verificado'
                        : 'Término'}
                    </p>
                    <p className="text-[11px] text-ink-900 leading-relaxed">
                      {a.term.description ?? 'Nadie ha comprobado este término. No lo des por cierto.'}
                    </p>
                  </div>

                  <p className="text-[11px] text-ink-500">
                    <span className="font-semibold text-ink-900">Fundamento:</span> {a.legalBasis}
                  </p>

                  {a.competentAuthority && (
                    <p className="text-[11px] text-ink-500">
                      <span className="font-semibold text-ink-900">Ante quién:</span>{' '}
                      {a.competentAuthority}
                    </p>
                  )}

                  {a.sourceUrl && (
                    <a
                      href={a.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-brand-700 hover:underline inline-flex items-center gap-1"
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
              <details className="bg-canvas border border-line-200 rounded-card p-3">
                <summary className="text-[11px] text-ink-500 cursor-pointer">
                  {result.descartadas.length} propuesta
                  {result.descartadas.length === 1 ? '' : 's'} que el catálogo no reconoció
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {result.descartadas.map((d) => (
                    <li key={d} className="text-[10px] text-ink-500">
                      {d}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <p className="text-[10px] text-ink-500 px-1 pb-2">
              Esto orienta, no decide. La calificación jurídica del caso es tuya.
            </p>
          </div>
        )}
      </div>

      {/*
        El historial VACIO tambien se anuncia: sin esta linea, el modulo entero
        parece no haber cambiado hasta la primera consulta — y nadie descubre
        una capacidad que no se presenta.
      */}
      {historial.length === 0 && (
        <p className="mx-auto mt-6 max-w-3xl rounded-card border border-line-200 bg-surface px-4 py-3 text-meta leading-[1.6] text-ink-500">
          Desde ahora, cada orientación queda guardada aquí para toda la firma: se busca por los
          hechos, se reutiliza para otro cliente, y las consultas sin actuación se agrupan como la
          lista de trabajo del catálogo.
        </p>
      )}

      {/* ─── HISTORIAL · cada consulta vale para la siguiente ─────────────── */}
      {historial.length > 0 && (
        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-ui font-semibold text-ink-900">
              Orientaciones de la firma · {historial.length}
            </h2>
            <input
              value={busquedaHist}
              onChange={(e) => setBusquedaHist(e.target.value)}
              placeholder="Buscar por hechos: «despido incapacidad inspector»"
              className="field ml-auto w-[280px] max-w-full"
            />
          </div>

          <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
            {historial
              .filter(
                (h) =>
                  !busquedaHist.trim() ||
                  h.hechos.toLowerCase().includes(busquedaHist.trim().toLowerCase())
              )
              .slice(0, 15)
              .map((h) => (
                <div key={h.id} className="t-row flex flex-wrap items-start gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-ui leading-snug text-ink-900">{h.hechos}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-500">
                      {h.userEmail.split('@')[0]} ·{' '}
                      {new Date(h.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short'
                      })}
                      {h.senales?.rama ? ` · ${h.senales.rama}` : ''}
                    </span>
                  </span>

                  <span className="w-[190px] shrink-0">
                    {h.status === 'OK' ? (
                      <span className="block truncate text-[12px] text-ink-900">
                        {h.sugerencias[0]?.nombre ?? ''}
                        {h.sugerencias.length > 1 && (
                          <span className="text-ink-400"> · de {h.sugerencias.length}</span>
                        )}
                      </span>
                    ) : (
                      <span className="chip-unverified">Sin actuación en catálogo</span>
                    )}
                  </span>

                  {/*
                    REUTILIZAR copia los HECHOS, nunca los datos del cliente
                    anterior — es el atajo real de una firma que ve el mismo
                    caso dos veces por semana.
                  */}
                  <button
                    onClick={() => {
                      setHechos(h.hechos);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="btn-neutral btn-sm shrink-0"
                    title="Copia los hechos al cuadro de consulta. Nunca los datos del cliente anterior."
                  >
                    Reutilizar
                  </button>
                </div>
              ))}
          </div>

          {/* ─── LOS HUECOS DEL CATÁLOGO · la lista de trabajo ─────────────── */}
          {huecos.length > 0 && (
            <div className="rounded-card border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] p-4">
              <h3 className="text-ui font-semibold text-ink-900">
                Huecos del catálogo · {huecos.reduce((n, x) => n + x.veces, 0)} consultas sin
                actuación
              </h3>
              <p className="mt-0.5 text-meta leading-[1.5] text-ink-700">
                Consultas iguales agrupadas y contadas: dicen exactamente qué le falta curar a la
                firma, antes que cualquier métrica.
              </p>
              <ul className="mt-2 space-y-1">
                {huecos.slice(0, 6).map((hu) => (
                  <li key={hu.hechos} className="flex items-start gap-2 text-ui text-ink-900">
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-unverified">
                      {hu.veces}×
                    </span>
                    <span className="min-w-0 truncate">{hu.hechos}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
