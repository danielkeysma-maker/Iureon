import React from 'react';
import {
  AlertTriangle,
  Clock,
  Compass,
  ExternalLink,
  Loader2,
  PenLine,
  Search,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import {
  catalogApi,
  triageApi,
  type OrientacionGuardada,
  type TriageResponse
} from '../services/catalog.api';
import { indiceDelPrimario, porTerminoMasCorto } from '../triageOrder';
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

/*
 * Los ejemplos van en la voz del producto —USTED, como el resto del sistema— y
 * escritos como se los contaria un colega: hechos, no nombres juridicos. Si
 * trajeran la palabra «tutela» o «ejecutivo» ensenarian justo lo contrario de
 * lo que esta pantalla existe para permitir.
 */
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

  /*
   * EL TAMAÑO DEL CATÁLOGO, EN EL ENCABEZADO (1f: «651 actuaciones · 612
   * verificadas»). No es adorno: es lo que le dice al abogado contra qué se
   * está comparando lo que escribió. Se cuenta del catálogo real y, si no
   * llega, la línea no se pinta — nunca una cifra supuesta.
   */
  const [censo, setCenso] = React.useState<{ total: number; verificadas: number } | null>(null);

  React.useEffect(() => {
    let cancelado = false;
    catalogApi
      .list()
      .then((r) => {
        if (cancelado) return;
        setCenso({
          total: r.actuaciones.length,
          verificadas: r.actuaciones.filter((a) => a.term.status === 'VERIFICADO').length
        });
      })
      .catch(() => {
        /* Sin censo el encabezado calla; la consulta sigue funcionando. */
      });
    return () => {
      cancelado = true;
    };
  }, []);

  /*
   * HASTA SEIS, Y ORDENADAS POR LO QUE SE VENCE PRIMERO.
   *
   * El límite es del artboard («hasta 6 actuaciones») y tiene la misma razón
   * que el orden: una lista larga de opciones plausibles no orienta, reparte
   * la duda. El orden vive en `triageOrder` y está probado aparte.
   */
  const sugerencias = React.useMemo(
    () => (result?.status === 'OK' ? porTerminoMasCorto(result.suggestions).slice(0, 6) : []),
    [result]
  );
  const idxPrimario = React.useMemo(() => indiceDelPrimario(sugerencias), [sugerencias]);

  const campoHechos = React.useRef<HTMLTextAreaElement>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-6">
      <div className="mx-auto max-w-4xl space-y-4 font-sans">
        {/* ─── ENCABEZADO (1f) ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-brand-700">
            <Compass className="h-5 w-5 text-on-brand" />
          </div>
          <div className="min-w-0">
            <h2 className="text-title text-ink-900">Orientación</h2>
            <p className="text-meta text-ink-500">
              Describa los hechos; el catálogo propone la actuación.
            </p>
          </div>
          {censo && (
            <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-400">
              {censo.total} actuaciones · {censo.verificadas} verificadas
            </span>
          )}
        </div>

        <section className="space-y-3 rounded-card border border-line-200 bg-surface p-4">
          <label className="block">
            <span className="text-ui font-medium text-ink-900">
              Los hechos, como se los contaría a un colega
            </span>
            <textarea
              ref={campoHechos}
              value={hechos}
              onChange={(e) => setHechos(e.target.value)}
              placeholder="A mi cliente lo despidieron sin justa causa el 3 de febrero. Estaba incapacitado desde diciembre por una lesión de hombro que se originó cargando en la bodega. La empresa nunca reportó el accidente a la ARL y no pidió permiso al inspector de trabajo."
              rows={5}
              className="field-area mt-1.5 w-full resize-y text-justify [text-wrap:pretty]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {/*
              SIN DATOS PERSONALES DEL CLIENTE (1f). Va junto al campo y no en
              una política: es donde se decide qué se escribe. Los hechos viajan
              a un modelo externo, y el nombre y la cédula del cliente no hacen
              falta para saber qué actuación corresponde.
            */}
            <p className="flex items-center gap-1.5 text-meta text-ink-500">
              <ShieldOff className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              Sin datos personales del cliente
            </p>

            <p className="font-mono text-[11px] text-ink-400">
              {hechos.trim().length < 20
                ? 'Cuéntelo con algo más de detalle: quién, qué pasó y qué se busca.'
                : `${hechos.trim().length} caracteres`}
            </p>

            <button
              onClick={() => void orientar()}
              disabled={hechos.trim().length < 20 || cargando}
              className="btn-primary ml-auto shrink-0"
            >
              {cargando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              {cargando ? 'Orientando…' : 'Orientar'}
            </button>
          </div>

          {!result && !cargando && (
            <div className="border-t border-line-100 pt-2.5">
              <p className="mb-1.5 text-meta text-ink-400">O pruebe con uno de estos:</p>
              <div className="space-y-1">
                {EJEMPLOS.map((e) => (
                  <button
                    key={e}
                    onClick={() => void orientar(e)}
                    className="block text-left text-meta text-brand-700 hover:underline"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-meta text-danger">{error}</p>
          </div>
        )}

        {sinSaldo && (
          <div className="flex items-start gap-3 rounded-card border border-line-200 bg-canvas p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
            <div className="text-ui leading-relaxed text-ink-700">
              <p className="mb-1 font-semibold text-ink-900">Cupo gratuito de hoy agotado</p>
              <p className="text-justify [text-wrap:pretty]">{sinSaldo}</p>
              <button
                onClick={() => setMainView('search')}
                className="mt-2 text-meta text-brand-700 hover:underline"
              >
                Buscar jurisprudencia mientras tanto →
              </button>
            </div>
          </div>
        )}

        {result?.cupoRestante !== undefined && result.cupoRestante <= 5 && (
          <p className="px-1 text-meta text-ink-500">
            {result.cupoRestante > 0
              ? `Le quedan ${result.cupoRestante} orientaciones gratuitas hoy. Después de eso, cada una descuenta $50 del saldo.`
              : `Ya usó las gratuitas de hoy${
                  result.cobradoCop ? `; esta descontó $${result.cobradoCop} del saldo` : ''
                }. Mañana se reinicia el cupo.`}
          </p>
        )}

        {/* ─── 1f′ · EL CATÁLOGO NO RECONOCE NADA ──────────────────────────
            Respuesta legítima, con salidas. No pide disculpas ni sugiere
            reintentar: nombra el hecho, lista los datos que suelen faltar y
            ofrece salidas reales, con la consecuencia de la más riesgosa
            escrita antes de tomarla. */}
        {result && result.status !== 'OK' && (
          <div className="rounded-card border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))]/60 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
              <div className="min-w-0 text-ui leading-relaxed text-ink-900">
                <p className="font-semibold">
                  {result.status === 'SIN_COINCIDENCIA'
                    ? 'El catálogo no reconoce una actuación para estos hechos'
                    : 'La orientación no está disponible'}
                </p>
                <p className="mt-1 text-justify [text-wrap:pretty]">{result.reason}</p>

                {result.status === 'SIN_COINCIDENCIA' && (result.preguntas?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      Puede que falte precisar
                    </p>
                    <ol className="mt-1.5 space-y-1">
                      {result.preguntas!.map((q, i) => (
                        <li key={i} className="flex gap-2 text-ui text-ink-900">
                          <span className="shrink-0 font-mono text-[10.5px] text-ink-400">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 text-justify [text-wrap:pretty]">{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.status === 'SIN_COINCIDENCIA' && (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          campoHechos.current?.focus();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-primary btn-sm"
                      >
                        Completar los hechos
                      </button>
                      <button onClick={() => setMainView('search')} className="btn-secondary btn-sm">
                        Buscar en jurisprudencia
                      </button>
                      <button
                        onClick={() => onDraft('', '', hechos.trim())}
                        className="btn-neutral btn-sm"
                        title="Lleva los hechos al taller. Tendrá que elegir allí la actuación."
                      >
                        Redactar sin catálogo
                      </button>
                    </div>
                    {/*
                      LA CONSECUENCIA, ESCRITA ANTES DE TOMAR LA SALIDA (1f′).
                      Prohibir redactar sería paternalista; dejar que ocurra en
                      silencio sería peor.
                    */}
                    <p className="mt-2 text-justify text-meta leading-[1.5] text-ink-700 [text-wrap:pretty]">
                      Si redacta sin catálogo, ningún término ni artículo del escrito quedará
                      verificado: todo saldrá marcado como sin verificar.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {result?.status === 'OK' && (
          <div className="space-y-3">
            {/* ─── LO QUE EL CATÁLOGO LEYÓ ─────────────────────────────────── */}
            {result.senales && (result.senales.rama || result.senales.elementos.length > 0) && (
              <div className="rounded-card border border-line-200 bg-surface px-4 py-3">
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  Lo que el catálogo leyó
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {result.senales.rama && (
                    <span className="rounded-control bg-brand-700 px-2 py-0.5 text-meta font-semibold text-on-brand">
                      {result.senales.rama}
                    </span>
                  )}
                  {result.senales.elementos.map((e) => (
                    <span key={e} className="chip-neutral">
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-meta text-ink-400">
                  Corrija un elemento y las sugerencias se recalculan: es más rápido corregir una
                  etiqueta que reescribir el párrafo.
                </p>
              </div>
            )}

            {/* ─── EL ORDEN, DICHO ─────────────────────────────────────────── */}
            <div className="flex flex-wrap items-baseline gap-x-2 px-1">
              <p className="text-ui font-semibold text-ink-900">
                {sugerencias.length} actuación{sugerencias.length === 1 ? '' : 'es'} posible
                {sugerencias.length === 1 ? '' : 's'}
              </p>
              <p className="text-meta text-ink-500">
                ordenadas por término más corto — lo que se vence primero va primero
              </p>
            </div>

            {sugerencias.map(({ actuacion: a, razon }, i) => {
              const sinVerificar = a.term.status === 'NO_VERIFICADO';
              const esPrimario = i === idxPrimario;

              return (
                <article
                  key={a.id}
                  /*
                    LA TARJETA SIN VERIFICAR CAMBIA DE TEXTURA, no solo de color
                    (1f): el borde punteado la distingue sin depender de que
                    alguien vea el ámbar, que es la regla de redundancia del
                    sistema.
                  */
                  className={`overflow-hidden rounded-card bg-surface ${
                    sinVerificar
                      ? 'border border-dashed border-[rgb(var(--unverified-line))]'
                      : 'border border-line-200'
                  }`}
                >
                  <header className="border-b border-line-100 bg-canvas px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">
                          {BRANCH_LABELS[a.branch] ?? a.branch}
                        </span>
                        <h3 className="text-subtitle text-ink-900">{a.exactName}</h3>
                      </div>
                      <span
                        className={`shrink-0 ${
                          sinVerificar
                            ? 'chip-unverified'
                            : a.term.status === 'NO_CADUCA'
                            ? 'chip-neutral'
                            : 'chip-verified'
                        }`}
                      >
                        {sinVerificar
                          ? 'Sin verificar'
                          : a.term.status === 'NO_CADUCA'
                          ? 'No caduca'
                          : 'Verificado'}
                      </span>
                    </div>
                    {razon && (
                      <p className="mt-1.5 text-justify text-meta italic leading-[1.5] text-ink-500 [text-wrap:pretty]">
                        {razon}
                      </p>
                    )}
                  </header>

                  {/*
                    ORDEN FIJO EN TODAS LAS TARJETAS (1f): término, norma,
                    autoridad. Fijo para poder compararlas de un vistazo — si
                    cada tarjeta ordena sus datos distinto, hay que leerlas
                    enteras.

                    EL «VENCE <fecha>» DEL ARTBOARD NO SE PINTA, Y ES A
                    PROPÓSITO. Calcular la fecha exige saber desde cuándo corre
                    el término —la notificación, el despido, la estructuración—
                    y eso no está en unos hechos escritos en prosa. Una fecha de
                    vencimiento inventada es lo más peligroso que esta pantalla
                    podría mostrar.
                  */}
                  <dl className="space-y-2 p-4">
                    <div className="flex gap-2">
                      <dt className="w-[74px] shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                        {sinVerificar ? 'Término*' : 'Término'}
                      </dt>
                      <dd className="min-w-0 flex-1 text-justify text-ui leading-[1.5] text-ink-900 [text-wrap:pretty]">
                        {a.term.status === 'NO_CADUCA'
                          ? 'No aplica término de caducidad.'
                          : a.term.description ??
                            'Nadie ha comprobado este término. No lo dé por cierto.'}
                      </dd>
                    </div>

                    <div className="flex gap-2">
                      <dt className="w-[74px] shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                        Norma
                      </dt>
                      <dd className="min-w-0 flex-1 text-justify text-ui leading-[1.5] text-ink-700 [text-wrap:pretty]">
                        {a.legalBasis}
                      </dd>
                    </div>

                    {a.competentAuthority && (
                      <div className="flex gap-2">
                        <dt className="w-[74px] shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                          Autoridad
                        </dt>
                        <dd className="min-w-0 flex-1 text-justify text-ui leading-[1.5] text-ink-700 [text-wrap:pretty]">
                          {a.competentAuthority}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {sinVerificar && (
                    <p className="mx-4 mb-3 rounded-control border border-dashed border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-3 py-2 text-justify text-meta leading-[1.5] text-ink-900 [text-wrap:pretty]">
                      El modelo la propone por los hechos, pero su término no está verificado contra
                      la norma. No la dé por cierta.
                    </p>
                  )}

                  {/* ─── ACCIONES ───────────────────────────────────────────
                      Un solo primario en toda la lista, y solo si está
                      verificada: seis primarios equivalen a ninguno. En la
                      tarjeta sin verificar la acción principal no es redactar
                      sino VERIFICAR Y CATALOGAR — convierte el hallazgo en un
                      activo de la firma en vez de en un escrito sin respaldo. */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-line-100 px-4 py-2.5">
                    {sinVerificar ? (
                      <button
                        onClick={() => setMainView('catalogo')}
                        className="btn-secondary btn-sm"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Verificar y catalogar
                      </button>
                    ) : (
                      <button
                        onClick={() => onDraft(a.exactName, a.branch, hechos.trim())}
                        className={esPrimario ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                      >
                        <PenLine className="h-3 w-3" />
                        Redactar esta
                      </button>
                    )}

                    <button onClick={() => setMainView('catalogo')} className="btn-neutral btn-sm">
                      Ver ficha
                    </button>

                    {a.sourceUrl && (
                      <a
                        href={a.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-neutral btn-sm"
                      >
                        Ver norma
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}

            {result.suggestions.length > sugerencias.length && (
              <p className="px-1 text-meta text-ink-500">
                El catálogo devolvió {result.suggestions.length}; se muestran las{' '}
                {sugerencias.length} de término más corto. Una lista más larga no orienta: reparte
                la duda.
              </p>
            )}

            {/*
              Lo que el modelo propuso y el catálogo tumbó. Visible a propósito:
              si el motor empieza a inventar nombres, esta lista lo dice antes de
              que alguien lo note por otra vía.
            */}
            {result.descartadas.length > 0 && (
              <details className="rounded-card border border-line-200 bg-canvas p-3">
                <summary className="cursor-pointer text-meta text-ink-500">
                  {result.descartadas.length} propuesta
                  {result.descartadas.length === 1 ? '' : 's'} que el catálogo no reconoció
                </summary>
                <ul className="mt-2 space-y-0.5">
                  {result.descartadas.map((d) => (
                    <li key={d} className="text-meta text-ink-500">
                      {d}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <p className="px-1 pb-2 text-meta text-ink-500">
              Esto orienta, no decide. La calificación jurídica del caso es suya.
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
        <p className="mx-auto mt-6 max-w-3xl rounded-card border border-line-200 bg-surface px-4 py-3 text-justify text-meta leading-[1.6] text-ink-500 [text-wrap:pretty]">
          Desde ahora, cada orientación queda guardada aquí para toda la firma: se busca por los
          hechos, se reutiliza para otro cliente, y las consultas sin actuación se agrupan como la
          lista de trabajo del catálogo.
        </p>
      )}

      {/* ─── HISTORIAL (13a) · cada consulta vale para la siguiente ───────── */}
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
                    <span className="block text-justify text-ui leading-snug text-ink-900 [text-wrap:pretty]">
                      {h.hechos}
                    </span>
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
                      <span className="block truncate text-ui text-ink-900">
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
              <p className="mt-0.5 text-justify text-meta leading-[1.5] text-ink-700 [text-wrap:pretty]">
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
