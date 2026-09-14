import React from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  Paperclip,
  PenLine,
  Search,
  ShieldCheck,
  ShieldOff,
  X
} from 'lucide-react';
import {
  catalogApi,
  triageApi,
  type OrientacionGuardada,
  type TriageResponse
} from '../services/catalog.api';
import { indiceDelPrimario, porTerminoMasCorto } from '../triageOrder';
import { AvisoDePlazoEnElAdjunto } from './AvisoDePlazoEnElAdjunto';
import { SelectorDeExpediente } from '../../expedientes/components/SelectorDeExpediente';
import { ARCHIVOS_DE_HECHOS, useHechosDesdeArchivo } from '../hechosDesdeArchivo';
import { PanelDeInstruccion } from './PanelDeInstruccion';
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
 *
 * LA CARA NUEVA (`public/handoff/app-orientacion.html`). La piel vive en
 * `design/cara-nueva.css`, bajo `.cara-nueva .cn-ori-*`. Del artboard se tomó la
 * forma, no las promesas: no hay «Dónde buscar» por rama ni las 28 ramas, ni
 * «Consultas parecidas», ni precio fijo en el botón, ni «Ninguna encaja», ni la
 * ficha completa en diálogo, ni «Poner el término en la agenda». Ninguna de esas
 * cosas existe en el servidor, y pintarlas sería prometer lo que no se hace. El
 * orden de las candidatas sigue siendo el del término más corto, no la
 * cercanía a los hechos que dibuja la maqueta.
 */

interface TriageViewProps {
  /**
   * Lleva el documento adjuntado a «Revisiones», ya leido, para que lo lea la
   * pantalla que si extrae plazos. Se ofrece SOLO cuando el documento anuncia
   * un termino; ver `AvisoDePlazoEnElAdjunto`.
   *
   * OPCIONAL, Y SU AUSENCIA ES UNA RESPUESTA: quien monte esta pantalla sin
   * saber navegar a Revisiones ve el aviso sin boton, en vez de un boton que
   * no hace nada.
   */
  onLeerRecibido?: (texto: string, nombre: string) => void;

  /**
   * Turns a suggestion into a draft carrying the name AND the facts.
   *
   * The facts travel because the lawyer already wrote them here. Asking for
   * them again is how a two-screen flow becomes two transcriptions of the same
   * story, and the second one is always shorter than the first.
   *
   * @param instruccion lo que se escribe en el cuadro «Qué debe hacer este
   *        escrito». Viaja APARTE de los hechos y puede venir vacía: escoger
   *        una sugerencia es opcional y la instrucción en blanco es válida,
   *        que es como funcionaba este camino antes de que existiera.
   */
  onDraft: (actuacionName: string, branch: string, hechos: string, instruccion: string) => void;
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

export const TriageView: React.FC<TriageViewProps> = ({ onDraft, setMainView, onLeerRecibido }) => {
  const [hechos, setHechos] = React.useState('');
  /*
   * DE QUE CASO SON ESTOS HECHOS. Opcional: quien orienta sobre un asunto que
   * todavia no es expediente lo deja vacio, que es el caso normal de esta
   * pantalla — se entra aqui justamente cuando no se sabe que es lo que se
   * tiene. Con caso escogido, la orientacion queda contada dentro de el.
   */
  const [expedienteId, setExpedienteId] = React.useState('');
  /*
   * EL DOCUMENTO QUE LLEGÓ, ADJUNTO. Lo que el abogado tiene delante es el
   * oficio o la demanda, no un resumen; la regla de qué pasa con el cuadro de
   * hechos vive en el gancho, compartida con la pantalla del teléfono.
   */
  const adjuntoHechos = useHechosDesdeArchivo(setHechos);
  const [arrastrando, setArrastrando] = React.useState(false);
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
      setResult(await triageApi.orientar(consulta, undefined, expedienteId || undefined));
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

  /*
   * LA TARJETA CUYO PANEL DE INSTRUCCIÓN ESTÁ ABIERTO. Uno a la vez: dos
   * paneles abiertos con dos instrucciones a medio escribir es una forma de
   * llevar a Redacción la de la ficha que no era.
   *
   * Se cierra al llegar un resultado nuevo, o quedaría abierto sobre una
   * actuación que ya no está en la lista.
   */
  const [eligiendo, setEligiendo] = React.useState<string | null>(null);
  React.useEffect(() => {
    setEligiendo(null);
  }, [result]);

  const campoHechos = React.useRef<HTMLTextAreaElement>(null);

  /*
   * MARGEN DE 16 EN MOVIL, 40 DESDE `lg` (en `.cn-ori-cuerpo`). Esta pantalla
   * es texto largo: cada pixel de ancho es una palabra menos por renglon. Una
   * sola columna de 760 px como máximo, igual que Inicio: más ancha, los
   * renglones de los hechos dejan de leerse de un vistazo.
   */
  return (
    <div data-visita="vista-orientacion" className="cara-nueva cn-ori min-w-0 flex-1 overflow-y-auto">
      <div className="cn-ori-cuerpo">
        {/* ─── ENCABEZADO ──────────────────────────────────────────────────── */}
        <header>
          <h1 className="cn-ori-h1">¿Qué actuación necesita?</h1>
          <p className="cn-ori-bajada">
            Cuente qué pasó y el catálogo le propone candidatas, cada una con su término y su
            norma.
          </p>
          {censo && (
            <p className="cn-ori-censo">
              {censo.total} actuaciones · {censo.verificadas} verificadas
            </p>
          )}
        </header>

        <section className="cn-ori-form" aria-label="Los hechos del caso">
          <div>
            <label htmlFor="hechos-de-la-orientacion" className="cn-ori-etiqueta">
              Los hechos, como se los contaría a un colega
            </label>
            <textarea
              id="hechos-de-la-orientacion"
              ref={campoHechos}
              value={hechos}
              onChange={(e) => setHechos(e.target.value)}
              placeholder="Cuente qué pasó, a quién y qué se busca. En lenguaje corriente: no hace falta redactar."
              rows={5}
              className="cn-ori-hechos"
            />
          </div>

          {/* ─── ADJUNTAR EL DOCUMENTO ────────────────────────────────────────
              Se lee aquí mismo, en el navegador, y el texto CAE EN EL CUADRO de
              arriba, que sigue siendo editable: el abogado ve exactamente lo
              que va a viajar y puede recortarlo. Nada se sube ni se cobra.

              Sin borde discontinuo: en este sistema el guion dice «sin
              verificar», y una zona de soltar no es una afirmación sin
              comprobar. Al arrastrar se enciende el anillo azul del foco. */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              void adjuntoHechos.leer(e.dataTransfer.files?.[0]);
            }}
            className={`cn-ori-adjunto ${arrastrando ? 'cn-ori-adjunto--arrastrando' : ''}`}
          >
            {adjuntoHechos.leyendo ? (
              /*
                ESPERA PROPIA, NO DE TODA LA PANTALLA. Un PDF de cuarenta
                páginas tarda un par de segundos y el resto de la vista sigue
                siendo usable mientras tanto.
              */
              <p className="cn-ori-adjunto-fila">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Leyendo el archivo…
              </p>
            ) : adjuntoHechos.adjunto ? (
              <div className="min-w-0">
                <div className="cn-ori-adjunto-fila">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {/*
                    El nombre de un archivo puede ser una sola palabra larguísima
                    —un radicado, un guion bajo tras otro—: la clase lo parte
                    en cualquier punto para que no se pinte fuera de su caja.
                  */}
                  <span className="cn-ori-adjunto-nombre">{adjuntoHechos.adjunto.nombre}</span>
                  <span className="cn-ori-adjunto-nota">
                    {adjuntoHechos.adjunto.caracteres} caracteres
                  </span>
                  <button type="button" onClick={adjuntoHechos.quitar} className="cn-ori-quitar">
                    <X className="h-4 w-4" aria-hidden="true" />
                    Quitar
                  </button>
                </div>
                {adjuntoHechos.adjunto.recortado && (
                  <p className="cn-ori-adjunto-texto">
                    El documento es largo: se leyó el comienzo del documento.
                  </p>
                )}
                {adjuntoHechos.adjunto.plazo && (
                  <AvisoDePlazoEnElAdjunto
                    plazo={adjuntoHechos.adjunto.plazo}
                    onLeer={
                      onLeerRecibido && adjuntoHechos.adjunto
                        ? () => onLeerRecibido(adjuntoHechos.adjunto!.texto, adjuntoHechos.adjunto!.nombre)
                        : undefined
                    }
                  />
                )}
              </div>
            ) : (
              <label className="cn-ori-adjunto-fila">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                <span>Arrastre aquí el oficio, la demanda o la notificación</span>
                <span className="cn-ori-adjunto-escoger">o escoja el archivo</span>
                <span className="cn-ori-adjunto-nota">PDF · Word · texto</span>
                <input
                  type="file"
                  accept={ARCHIVOS_DE_HECHOS}
                  className="hidden"
                  onChange={(e) => {
                    void adjuntoHechos.leer(e.target.files?.[0]);
                    /* Sin esto, volver a escoger el MISMO archivo no dispara nada. */
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          {adjuntoHechos.motivo && (
            /*
              No se pudo leer, y el cuadro de hechos quedó INTACTO. Se dice en
              el tono de las advertencias y no en el de las averías: un escaneo
              sin texto no es una falla de la aplicación.
            */
            <p className="cn-ori-aviso">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span className="min-w-0">{adjuntoHechos.motivo}</span>
            </p>
          )}

          {/*
            EL CASO, OPCIONAL Y DESPUÉS DE LOS HECHOS. Ésta es la pantalla de
            quien NO sabe todavía qué tiene, así que pedirle el expediente
            antes de contar el caso sería pedirle lo que quizá no existe. Va
            debajo, y solo si la firma tiene expedientes.
          */}
          <div className="cn-ori-selector">
            <SelectorDeExpediente
              valor={expedienteId}
              onCambio={setExpedienteId}
              id="expediente-de-la-orientacion"
              pie="La orientación queda contada dentro del caso. Déjelo vacío si el asunto todavía no es un expediente."
            />
          </div>

          <div className="cn-ori-pie-form">
            {/*
              SIN DATOS PERSONALES DEL CLIENTE (1f). Va junto al campo y no en
              una política: es donde se decide qué se escribe. Los hechos viajan
              a un modelo externo, y el nombre y la cédula del cliente no hacen
              falta para saber qué actuación corresponde.
            */}
            <p className="cn-ori-privacidad">
              <ShieldOff className="h-4 w-4" aria-hidden="true" />
              Sin datos personales del cliente
            </p>

            <p className="cn-ori-contador">
              {hechos.trim().length < 20
                ? 'Cuéntelo con algo más de detalle: quién, qué pasó y qué se busca.'
                : `${hechos.trim().length} caracteres`}
            </p>

            <button
              type="button"
              onClick={() => void orientar()}
              disabled={hechos.trim().length < 20 || cargando}
              className="cn-ini-boton cn-ini-boton--primario cn-ori-orientar"
            >
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              {cargando ? 'Orientando…' : 'Orientar'}
            </button>
          </div>

          {!result && !cargando && (
            <div className="cn-ori-ejemplos">
              <p className="cn-ori-ejemplos-titulo">O pruebe con uno de estos:</p>
              <div className="cn-ori-ejemplos-lista">
                {EJEMPLOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => void orientar(e)}
                    className="cn-ori-ejemplo"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="cn-error" role="alert">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {sinSaldo && (
          <div className="cn-ori-estado">
            <div className="cn-ori-estado-cabeza">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <div className="min-w-0">
                <p className="cn-ori-estado-titulo">Cupo gratuito de hoy agotado</p>
                <p className="cn-ori-estado-texto">{sinSaldo}</p>
                <button
                  type="button"
                  onClick={() => setMainView('search')}
                  className="cn-ini-enlace"
                >
                  Buscar jurisprudencia mientras tanto →
                </button>
              </div>
            </div>
          </div>
        )}

        {result?.cupoRestante !== undefined && result.cupoRestante <= 5 && (
          <p className="cn-ori-cupo">
            {result.cupoRestante > 0
              ? `Le quedan ${result.cupoRestante} orientaciones gratuitas hoy.${
                  result.precioOrientacionCop
                    ? ` Después de eso, cada una descuenta $${result.precioOrientacionCop.toLocaleString('es-CO')} del saldo.`
                    : ''
                }`
              : `Ya usó las gratuitas de hoy${
                  result.cobradoCop ? `; esta descontó $${result.cobradoCop} del saldo` : ''
                }. Mañana se reinicia el cupo.`}
          </p>
        )}

        {/* ─── 1f′ · EL CATÁLOGO NO RECONOCE NADA ──────────────────────────
            Respuesta legítima, con salidas. No pide disculpas ni sugiere
            reintentar: nombra el hecho, lista los datos que suelen faltar y
            ofrece salidas reales, con la consecuencia de la más riesgosa
            escrita antes de tomarla.

            La maqueta añade «No se le cobró esta consulta», y aquí NO va:
            pasado el cupo gratuito del día la consulta sin actuación también
            descuenta. La línea del cupo, arriba, dice lo que de verdad pasó. */}
        {result && result.status !== 'OK' && (
          <div className="cn-ori-estado cn-ori-estado--hueco">
            <div className="cn-ori-estado-cabeza">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <div className="min-w-0">
                <p className="cn-ori-estado-titulo">
                  {result.status === 'SIN_COINCIDENCIA'
                    ? 'El catálogo no reconoce una actuación para estos hechos'
                    : 'La orientación no está disponible'}
                </p>
                <p className="cn-ori-estado-texto">{result.reason}</p>

                {result.status === 'SIN_COINCIDENCIA' && (result.preguntas?.length ?? 0) > 0 && (
                  <div>
                    <p className="cn-ori-estado-rotulo">Puede que falte precisar</p>
                    <ol className="cn-ori-preguntas">
                      {result.preguntas!.map((q, i) => (
                        <li key={i}>
                          <span className="cn-ori-preguntas-num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="min-w-0">{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {result.status === 'SIN_COINCIDENCIA' && (
                  <>
                    <div className="cn-ori-botones">
                      <button
                        type="button"
                        onClick={() => {
                          campoHechos.current?.focus();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="cn-ini-boton cn-ini-boton--primario"
                      >
                        Completar los hechos
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainView('search')}
                        className="cn-ini-boton cn-ini-boton--blanco"
                      >
                        Buscar en jurisprudencia
                      </button>
                      <button
                        type="button"
                        onClick={() => onDraft('', '', hechos.trim(), '')}
                        className="cn-ini-boton cn-ini-boton--texto"
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
                    <p className="cn-ori-consecuencia">
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
          <section className="cn-ori-resultados" aria-label="Actuaciones posibles">
            {/* ─── EL ORDEN, DICHO ─────────────────────────────────────────── */}
            <div>
              <h2 className="cn-ori-h2">
                {/*
                  «actuaciones», no «actuaciónes»: la palabra PIERDE la tilde
                  al pasar al plural, porque deja de ser aguda terminada en n.
                  Añadir «es» al singular es el error que sale de tratar el
                  plural español como una concatenación.
                */}
                {sugerencias.length}{' '}
                {sugerencias.length === 1 ? 'actuación posible' : 'actuaciones posibles'}
              </h2>
              {/*
                El artboard dice que se ordenan «por cercanía a los hechos». No
                es lo que hace el código: `porTerminoMasCorto`. Se dice el orden
                real, que es además la razón de ser del orden.
              */}
              <p className="cn-ori-orden">
                Ordenadas por término más corto — lo que se vence primero va primero.
              </p>
            </div>

            {/*
              LA ADVERTENCIA VA ARRIBA DE LAS CANDIDATAS (README-app §2), no al
              pie: leída después de escoger, ya no advierte de nada. Es la
              misma frase que antes cerraba la lista.
            */}
            <p className="cn-ori-advertencia">
              <Info className="h-4 w-4" aria-hidden="true" />
              <span>Esto orienta, no decide. La calificación jurídica del caso es suya.</span>
            </p>

            {/* ─── LO QUE EL CATÁLOGO LEYÓ ─────────────────────────────────── */}
            {result.senales && (result.senales.rama || result.senales.elementos.length > 0) && (
              <div className="cn-ori-leyo">
                <p className="cn-ori-leyo-titulo">Lo que el catálogo leyó</p>
                <div className="cn-ori-chips">
                  {result.senales.rama && (
                    <span className="cn-ori-chip cn-ori-chip--rama">{result.senales.rama}</span>
                  )}
                  {result.senales.elementos.map((e) => (
                    <span key={e} className="cn-ori-chip">
                      {e}
                    </span>
                  ))}
                </div>
                <p className="cn-ori-leyo-nota">
                  Si algo de esto no corresponde a su caso, corrija los hechos y vuelva a orientar.
                </p>
              </div>
            )}

            <div className="cn-ori-lista">
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
                    className={`cn-ori-tarjeta ${sinVerificar ? 'cn-ori-tarjeta--sin' : ''}`}
                  >
                    <header className="cn-ori-tarjeta-cabeza">
                      <div className="cn-ori-tarjeta-textos">
                        <h3 className="cn-ori-tarjeta-titulo">{a.exactName}</h3>
                        <p className="cn-ori-tarjeta-rama">{BRANCH_LABELS[a.branch] ?? a.branch}</p>
                        {/*
                          LA LÍNEA DE ARRIBA DICE LA RAMA DE LA FICHA, y cuando
                          la ficha llega prestada esa rama NO es la que el
                          abogado eligió: la tarjeta diría «Civil» dentro de una
                          orientación de familia sin explicar por qué. Esto lo
                          explica, y de paso dice que el plazo no está
                          comprobado para su rama.
                        */}
                        {a.porRemision && (
                          <p className="cn-ori-tarjeta-remision">{a.porRemision.marca}</p>
                        )}
                      </div>
                      <span
                        className={`cn-ori-estado-chip ${
                          sinVerificar
                            ? 'cn-ori-estado-chip--sin'
                            : a.term.status === 'NO_CADUCA'
                            ? 'cn-ori-estado-chip--neutro'
                            : 'cn-ori-estado-chip--ok'
                        }`}
                      >
                        {sinVerificar
                          ? 'Sin verificar'
                          : a.term.status === 'NO_CADUCA'
                          ? 'No caduca'
                          : 'Verificado'}
                      </span>
                    </header>
                    {razon && <p className="cn-ori-razon">{razon}</p>}

                    {/*
                      ORDEN FIJO EN TODAS LAS TARJETAS (1f): término, norma,
                      autoridad. Fijo para poder compararlas de un vistazo — si
                      cada tarjeta ordena sus datos distinto, hay que leerlas
                      enteras. La norma va en mono porque es lo citable.

                      EL «VENCE <fecha>» DEL ARTBOARD NO SE PINTA, Y ES A
                      PROPÓSITO. Calcular la fecha exige saber desde cuándo corre
                      el término —la notificación, el despido, la estructuración—
                      y eso no está en unos hechos escritos en prosa. Una fecha de
                      vencimiento inventada es lo más peligroso que esta pantalla
                      podría mostrar.
                    */}
                    <dl className="cn-ori-datos">
                      <div className="cn-ori-dato">
                        <dt>{sinVerificar ? 'Término*' : 'Término'}</dt>
                        <dd>
                          {a.term.status === 'NO_CADUCA'
                            ? 'No aplica término de caducidad.'
                            : a.term.description ??
                              'Nadie ha comprobado este término. No lo dé por cierto.'}
                        </dd>
                      </div>

                      <div className="cn-ori-dato">
                        <dt>Norma</dt>
                        <dd className="cn-ori-mono">{a.legalBasis}</dd>
                      </div>

                      {a.competentAuthority && (
                        <div className="cn-ori-dato">
                          <dt>Autoridad</dt>
                          <dd>{a.competentAuthority}</dd>
                        </div>
                      )}
                    </dl>

                    {sinVerificar && (
                      <p className="cn-ori-nota-sin">
                        El modelo la propone por los hechos, pero su término no está verificado
                        contra la norma. No la dé por cierta.
                      </p>
                    )}

                    {/* ─── ACCIONES ───────────────────────────────────────────
                        Un solo primario en toda la lista, y solo si está
                        verificada: seis primarios equivalen a ninguno. En la
                        tarjeta sin verificar la acción principal no es redactar
                        sino VERIFICAR Y CATALOGAR — convierte el hallazgo en un
                        activo de la firma en vez de en un escrito sin respaldo. */}
                    <div className="cn-ori-acciones">
                      {sinVerificar ? (
                        <button
                          type="button"
                          onClick={() => setMainView('catalogo')}
                          className="cn-ini-boton cn-ini-boton--suave cn-ori-boton--verificar"
                        >
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          Verificar y catalogar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEligiendo(eligiendo === a.id ? null : a.id)}
                          aria-expanded={eligiendo === a.id}
                          className={`cn-ini-boton ${
                            esPrimario ? 'cn-ini-boton--primario' : 'cn-ini-boton--suave'
                          }`}
                        >
                          <PenLine className="h-4 w-4" aria-hidden="true" />
                          Redactar esta
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setMainView('catalogo')}
                        className="cn-ini-boton cn-ini-boton--texto"
                      >
                        Ver ficha
                      </button>

                      {a.sourceUrl && (
                        <a
                          href={a.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cn-ini-boton cn-ini-boton--texto"
                        >
                          Ver norma
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      )}
                    </div>

                    {/*
                      EL PANEL VA PEGADO A SU TARJETA, no al final de la lista.
                      Es la misma lección del panel de dividir en Audiencias: si
                      una acción responde lejos de donde se pulsa, con la lista
                      larga —y aquí son hasta seis fichas— el abogado pulsa, el
                      estado cambia, y no ve ocurrir nada.
                    */}
                    {eligiendo === a.id && (
                      <div className="cn-ori-panel">
                        <PanelDeInstruccion
                          actuacion={a}
                          hechos={hechos}
                          onCancelar={() => setEligiendo(null)}
                          onLlevar={(instruccion) =>
                            onDraft(a.exactName, a.branch, hechos.trim(), instruccion)
                          }
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {result.suggestions.length > sugerencias.length && (
              <p className="cn-ori-pie">
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
              <details className="cn-ori-descartadas">
                <summary>
                  {result.descartadas.length} propuesta
                  {result.descartadas.length === 1 ? '' : 's'} que el catálogo no reconoció
                </summary>
                <ul>
                  {result.descartadas.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        {/*
          El historial VACIO tambien se anuncia: sin esta linea, el modulo entero
          parece no haber cambiado hasta la primera consulta — y nadie descubre
          una capacidad que no se presenta.
        */}
        {historial.length === 0 && (
          <p className="cn-ori-vacio">
            Desde ahora, cada orientación queda guardada aquí para toda la firma: se busca por los
            hechos, se reutiliza para otro cliente, y las consultas sin actuación se agrupan como la
            lista de trabajo del catálogo.
          </p>
        )}

        {/* ─── HISTORIAL (13a) · cada consulta vale para la siguiente ───────── */}
        {historial.length > 0 && (
          <section className="cn-ori-historial" aria-label="Orientaciones de la firma">
            <div className="cn-ori-historial-cabeza">
              <h2 className="cn-ori-h3">Orientaciones de la firma · {historial.length}</h2>
              <input
                value={busquedaHist}
                onChange={(e) => setBusquedaHist(e.target.value)}
                placeholder="Buscar por hechos: «despido incapacidad inspector»"
                aria-label="Buscar en las orientaciones de la firma"
                className="cn-campo cn-ori-buscar"
              />
            </div>

            <div className="cn-ori-filas">
              {historial
                .filter(
                  (h) =>
                    !busquedaHist.trim() ||
                    h.hechos.toLowerCase().includes(busquedaHist.trim().toLowerCase())
                )
                .slice(0, 15)
                .map((h) => (
                  <div key={h.id} className="cn-ori-fila">
                    <span className="cn-ori-fila-textos">
                      <span className="cn-ori-fila-hechos">{h.hechos}</span>
                      <span className="cn-ori-fila-meta">
                        {h.userEmail.split('@')[0]} ·{' '}
                        {new Date(h.createdAt).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short'
                        })}
                        {h.senales?.rama ? ` · ${h.senales.rama}` : ''}
                      </span>
                    </span>

                    {/*
                      EN MOVIL LA SUGERENCIA BAJA A SU PROPIO RENGLON. Un ancho
                      fijo junto a la fecha y la rama no cabe en 375 y empujaba
                      la fila fuera del borde.

                      «Sin actuación en catálogo» no lleva guion: no es una
                      afirmación sin verificar sino un hueco, y el guion de este
                      sistema solo dice lo primero.
                    */}
                    <span className="cn-ori-fila-sugerencia">
                      {h.status === 'OK' ? (
                        <>
                          {h.sugerencias[0]?.nombre ?? ''}
                          {h.sugerencias.length > 1 && (
                            <span className="cn-ori-fila-de"> · de {h.sugerencias.length}</span>
                          )}
                        </>
                      ) : (
                        <span className="cn-ori-fila-hueco">Sin actuación en catálogo</span>
                      )}
                    </span>

                    {/*
                      REUTILIZAR copia los HECHOS, nunca los datos del cliente
                      anterior — es el atajo real de una firma que ve el mismo
                      caso dos veces por semana.
                    */}
                    <button
                      type="button"
                      onClick={() => {
                        setHechos(h.hechos);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="cn-ini-boton cn-ini-boton--suave"
                      title="Copia los hechos al cuadro de consulta. Nunca los datos del cliente anterior."
                    >
                      Reutilizar
                    </button>
                  </div>
                ))}
            </div>

            {/* ─── LOS HUECOS DEL CATÁLOGO · la lista de trabajo ─────────────── */}
            {huecos.length > 0 && (
              <div className="cn-ori-huecos">
                <h3 className="cn-ori-estado-titulo">
                  Huecos del catálogo · {huecos.reduce((n, x) => n + x.veces, 0)} consultas sin
                  actuación
                </h3>
                <p className="cn-ori-estado-texto">
                  Consultas iguales agrupadas y contadas: dicen exactamente qué le falta curar a la
                  firma, antes que cualquier métrica.
                </p>
                <ul className="cn-ori-huecos-lista">
                  {huecos.slice(0, 6).map((hu) => (
                    <li key={hu.hechos}>
                      <span className="cn-ori-huecos-veces">{hu.veces}×</span>
                      <span className="cn-ori-huecos-hechos">{hu.hechos}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
