import React from 'react';
import { Check, ChevronLeft, Copy, FileText, Plus } from 'lucide-react';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { useAutorizacionDeGrabacion } from '../useAutorizacionDeGrabacion';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { TranscriptSegments } from '../../transcription/components/TranscriptSegments';
import { EntrevistasList, nombreLegible } from './EntrevistasList';
import { CerrarEntrevistaDialog } from './CerrarEntrevistaDialog';
import { NuevaEntrevistaDialog } from './NuevaEntrevistaDialog';
import { NotPersistedWarning } from '../../transcription/components/RoleProposals';
import { buildSpeakerNames } from '../../transcription/speakerNames';
import { ROLE_LABELS, ROLES_DEL_RELATO } from '../../transcription/types';
import { toPlainText } from '../../transcription/toPlainText';
import { ClientPicker } from './ClientPicker';
import { GUION_BASE, cubiertasEnEntrevistasPrevias, estadoDelGuion, preguntasCubiertas } from '../guionDeEntrevista';
import { InterviewInsights } from './InterviewInsights';
import { TranscriptSummary } from '../../transcription/components/TranscriptSummary';
import { AudioRecorder, type EstadoDeGrabadora } from './AudioRecorder';
import { clientsApi, type Client } from '../clients.api';
import { transcriptionApi, type StoredTranscription } from '../../transcription/services/transcription.api';
import { Dialog } from '../../../design/Dialog';
import { useFuncionHabilitada, usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import {
  decisionEnPalabras,
  duracionEnPalabras,
  horaEnPalabras,
  intervinientes,
  puedeEmpezarAGrabar,
  revisionEnPalabras
} from '../entrevistaEnPantalla';

/**
 * The client interview, as its own screen.
 *
 * WHY IT IS NOT THE TRANSCRIPTION SCREEN WITH A DROPDOWN. It was, and a lawyer
 * said so: an audiencia and an interview are different work. A hearing arrives
 * as a file the court published, is read for what the judge ordered, and gets
 * quoted in a filing. An interview happens in the office, right now, with a
 * person sitting there; it starts with who they are, it is recorded rather than
 * uploaded, and what comes out of it is a case to take or decline.
 *
 * WHAT IS STILL SHARED, DELIBERATELY. The engine underneath: diarization, role
 * assignment, cutting an intervention that holds two voices, moving one to
 * another speaker, naming, in-place correction, export. Duplicating it would
 * mean fixing every one of its defects twice, and the second copy is the one
 * nobody notices is broken.
 *
 * ─── LA CARA NUEVA: TRES PANTALLAS, NO UNA COLUMNA DE PASOS ────────────────
 *
 * Maqueta `public/handoff/app-audiencias-entrevistas.html`. Se adoptó el FLUJO,
 * no solo el color:
 *   · la LISTA es la entrada (Entrevistas, con «Nueva entrevista» arriba);
 *   · «Nueva entrevista» (:78) es un diálogo que pregunta con quién y la
 *     autorización ANTES de grabar, y solo entonces abre
 *   · la pantalla de GRABACIÓN (:107): banda con el cronómetro, pausar y
 *     terminar; debajo el guion, y a la derecha lo que hay que saber mientras
 *     se graba;
 *   · el DETALLE (:482): el guion tachado, «¿Toma el caso?» con sus tres
 *     salidas, y el acta al lado con los datos que la entrevista SÍ tiene.
 *
 * Lo que la maqueta dibuja y aquí no está —notas al margen con su minuto,
 * preguntas marcadas tocándolas, una autorización de datos «pendiente de
 * firma», el audio «guardado en la cuenta de la firma»— no existe en el
 * producto, y `check:entrevistas-cara` impide que vuelva a entrar.
 */

interface InterviewViewProps {
  /**
   * Lleva a redacción lo que la persona NARRÓ, no la entrevista entera.
   *
   * Una entrevista es en su mayoría el abogado: saludos, preguntas y
   * explicaciones de procedimiento. Mandarla completa haría que el extractor de
   * hechos trabajara sobre el interrogatorio, y los hechos del caso quedarían
   * ahogados en la voz de quien pregunta.
   */
  onDraft?: (hechos: string) => void;
  /*
   * Lleva al registro de subencargados (2c). La pregunta «¿quién más ve
   * esto?» se hace en la sala, antes de grabar.
   */
  onPrivacidad?: () => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({ onDraft, onPrivacidad }) => {
  const {
    hasFirm,
    isAvailable,
    isUploading,
    uploadProgress,
    isTranscribing,
    result,
    error,
    persisted,
    voiceConflicts,
    nameProposals,
    stored,
    maxAudioBytes,
    isLoadingStored,
    loadStored,
    openStored,
    deleteStored,
    transcribe,
    marcarRevisada,
    marcarHechoClave,
    assignRole,
    assignSpeakerName,
    editSegment,
    splitSegment,
    reassignSpeaker,
    transcriptionId,
    canEdit,
    reset
  } = useTranscription('ENTREVISTA');

  const [clientId, setClientId] = React.useState<string | null>(null);
  /*
   * La ficha del consultante, no solo su id: el acta de entrevista (14b)
   * imprime su nombre y su cedula en los metadatos y en la linea de firma que
   * se le lee o se le entrega, y el detalle se titula con su nombre.
   */
  const [cliente, setCliente] = React.useState<Client | null>(null);
  const elegirCliente = (id: string | null, ficha: Client | null): void => {
    setClientId(id);
    setCliente(ficha);
  };

  const [copiado, setCopiado] = React.useState(false);
  const [titulo, setTitulo] = React.useState('');
  /*
   * LA AUTORIZACION DE GRABACION ES BLOQUEANTE y vive en su propio gancho,
   * compartido con la pantalla movil. La voz es un dato biometrico (Ley 1581 de
   * 2012): sin la casilla marcada, ni el grabador ni la subida se habilitan, y
   * la hora del clic viaja con la transcripcion a
   * `transcriptions.autorizo_grabacion_el` — la constancia demostrable.
   */
  const { autorizado, autorizadoEl, marcar: marcarAutorizacion } = useAutorizacionDeGrabacion();
  const permiso = puedeEmpezarAGrabar({ hayFirma: hasFirm, autorizado });
  const soloLectura = usePlanSoloLectura();

  const [nuevaAbierta, setNuevaAbierta] = React.useState(false);
  const [enGrabacion, setEnGrabacion] = React.useState(false);
  const [iniciarAlMontar, setIniciarAlMontar] = React.useState(false);
  const [estadoGrabadora, setEstadoGrabadora] = React.useState<EstadoDeGrabadora>('inactiva');
  const [confirmarSalida, setConfirmarSalida] = React.useState(false);
  const [declinarAbierto, setDeclinarAbierto] = React.useState(false);
  const [decidiendo, setDecidiendo] = React.useState(false);
  const [errorDecision, setErrorDecision] = React.useState('');

  React.useEffect(() => {
    void loadStored();
  }, [loadStored]);

  /*
   * ABRIR UNA GUARDADA TRAE SU CLIENTE. Antes el detalle abría con «sin
   * cliente» aunque la fila lo tuviera atado, así que el acta salía sin
   * consultante y el guion no sabía de las entrevistas anteriores.
   */
  const abrir = React.useCallback(
    (item: StoredTranscription) => {
      setTitulo(item.title);
      setClientId(item.client_id ?? null);
      setCliente(null);
      openStored(item);
    },
    [openStored]
  );

  /*
   * After a reload the interview that was open comes back, through the same
   * path as a click on its row — once the list is here, once per mount, and
   * only if it is still in the list; otherwise the list is what stays.
   */
  const restaurada = React.useRef(false);
  React.useEffect(() => {
    if (restaurada.current || stored.length === 0) return;
    restaurada.current = true;
    if (result) return;
    const id = recordado(PANTALLAS.transcripcion('ENTREVISTA'));
    if (!id) return;
    const item = stored.find((i) => i.id === id);
    if (!item) {
      recordar(PANTALLAS.transcripcion('ENTREVISTA'), null);
      return;
    }
    abrir(item);
  }, [stored, result, abrir]);

  const fila = transcriptionId ? stored.find((i) => i.id === transcriptionId) : undefined;

  /*
   * La ficha del cliente de una entrevista reabierta. `ClientPicker` ya tiene
   * la lista, pero no la devuelve hasta que alguien elige; sin la ficha el
   * título diría el nombre del archivo y el acta no tendría consultante.
   */
  React.useEffect(() => {
    if (!clientId || cliente?.id === clientId) return;
    let vigente = true;
    clientsApi
      .list()
      .then((lista) => {
        if (vigente) setCliente(lista.find((c) => c.id === clientId) ?? null);
      })
      .catch(() => {
        /* Sin ficha el título cae al nombre del archivo; nada se inventa. */
      });
    return () => {
      vigente = false;
    };
  }, [clientId, cliente?.id]);

  // Written as soon as there is a transcript to attach it to, so the choice
  // made before recording is never lost between the two moments. The row that
  // already carries this client is not written again.
  const clienteDeLaFila = fila?.client_id ?? null;
  React.useEffect(() => {
    if (!transcriptionId || !clientId || clienteDeLaFila === clientId) return;

    void clientsApi.linkInterview(transcriptionId, clientId).catch(() => {
      /* The transcript itself is safe; the link can be made again. */
    });
  }, [transcriptionId, clientId, clienteDeLaFila]);

  const empezar = (file: File) => {
    setTitulo(file.name);
    void transcribe(file, undefined, autorizadoEl ?? undefined);
  };

  /*
   * CADA ENTREVISTA PIDE SU PROPIA AUTORIZACIÓN. Abrir el diálogo desmarca la
   * casilla: una hora sellada para la persona anterior no puede quedar como
   * constancia de la siguiente.
   */
  const abrirNueva = () => {
    marcarAutorizacion(false);
    elegirCliente(null, null);
    setNuevaAbierta(true);
  };

  const empezarAGrabar = () => {
    if (!permiso.puede) return;
    setNuevaAbierta(false);
    setIniciarAlMontar(true);
    setEnGrabacion(true);
  };

  const subir = (file: File) => {
    if (!permiso.puede) return;
    setNuevaAbierta(false);
    setIniciarAlMontar(false);
    setEnGrabacion(true);
    empezar(file);
  };

  const irALaLista = () => {
    setConfirmarSalida(false);
    setEnGrabacion(false);
    setIniciarAlMontar(false);
    setEstadoGrabadora('inactiva');
    setErrorDecision('');
    marcarAutorizacion(false);
    reset();
    void loadStored();
  };

  /* Salir con una grabación en curso o sin transcribir la perdería: se pregunta. */
  const volverDeLaGrabacion = () => {
    if (estadoGrabadora !== 'inactiva') setConfirmarSalida(true);
    else irALaLista();
  };

  /*
   * El ACTA con datos reales — y SIN RED. Todo sale de la fila que la lista ya
   * tiene en memoria: la hora de autorizacion, quien reviso, y el resumen si
   * alguna vez se genero.
   */
  const armarActa = () => {
    if (!transcriptionId) return undefined;
    return {
      autorizadoEl: fila?.autorizo_grabacion_el ?? null,
      revisadaPor: fila?.revisada_por ?? null,
      actaLista: fila?.estado_revision === 'ACTA_LISTA',
      hechosClave: fila?.resumen?.hechos,
      decision: fila?.decision,
      decisionMotivo: fila?.decision_motivo ?? null,
      consultante: cliente ? { nombre: cliente.fullName, documento: cliente.documentId } : null
    };
  };

  const copiar = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(toPlainText(result.segments, buildSpeakerNames(result.segments, ROLE_LABELS)));
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  };

  /** Solo los turnos de quien narra, con su rol al frente para dar contexto. */
  const relatoDelCliente = (): string =>
    (result?.segments ?? [])
      .filter((s) => ROLES_DEL_RELATO.has(s.role))
      .map((s) => `${ROLE_LABELS[s.role] ?? s.role}: ${s.text.trim()}`)
      .filter((linea) => linea.length > 40)
      .join('\n\n');

  const trabajando = isUploading || isTranscribing;

  /*
   * EL GUION SUGERIDO (2a). Se tacha por lo que se DIJO, no por lo que alguien
   * marco: nadie va marcando casillas con el cliente enfrente. Mientras no hay
   * transcrito no hay nada cubierto, que es correcto — la lista arranca entera.
   */
  const cubiertas = React.useMemo(() => preguntasCubiertas(result?.segments ?? []), [result]);

  /*
   * LA SEGUNDA ENTREVISTA SABE QUE RESPONDIO LA PRIMERA. Las entrevistas
   * anteriores del mismo cliente ya estan en `stored` con su `client_id` y sus
   * intervenciones; se excluye la que se esta viendo, porque lo que ella cubre
   * es «hoy», no «antes».
   */
  const previas = React.useMemo(
    () =>
      clientId
        ? stored
            .filter((i) => i.client_id === clientId && i.id !== transcriptionId)
            .map((i) => ({ id: i.id, transcribedAt: i.transcribed_at ?? null, segments: i.segments ?? [] }))
        : [],
    [stored, clientId, transcriptionId]
  );
  const cubiertasAntes = React.useMemo(() => cubiertasEnEntrevistasPrevias(previas), [previas]);
  const estados = React.useMemo(() => estadoDelGuion(cubiertas, cubiertasAntes), [cubiertas, cubiertasAntes]);
  const respondidasAntes = [...estados.values()].filter((e) => e.estado === 'antes').length;
  /* La lista es una función de Entrevistas que el operador puede apagar: la sección queda, con el aviso en vez de las preguntas. */
  const guionHabilitado = useFuncionHabilitada('ENTREVISTAS.GUION');

  const fechaCorta = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : 'una entrevista anterior';

  const tomarElCaso = async () => {
    if (!transcriptionId) return;
    setErrorDecision('');
    setDecidiendo(true);
    const r = await transcriptionApi.decidir(transcriptionId, 'TOMADO');
    setDecidiendo(false);
    if (!r.item) {
      setErrorDecision(r.error ?? 'No se pudo registrar la decisión.');
      return;
    }
    void loadStored();
    const relato = relatoDelCliente();
    if (onDraft && relato.length > 0) onDraft(relato);
  };

  const reabrirDecision = async () => {
    if (!transcriptionId) return;
    setErrorDecision('');
    setDecidiendo(true);
    const r = await transcriptionApi.decidir(transcriptionId, 'SIN_DECIDIR');
    setDecidiendo(false);
    if (!r.item) setErrorDecision(r.error ?? 'No se pudo reabrir la decisión.');
    void loadStored();
  };

  /*
   * `=== false`, and the difference is the whole defect. `isAvailable` is
   * `boolean | null`: null means the status request has not come back yet.
   * Written as a plain negation it read as "not available", so every visit
   * flashed "no está configurado" for the length of one round trip.
   */
  if (isAvailable === false) {
    return (
      <div data-visita="vista-entrevistas" className="cara-nueva cn-ent cn-ent-escritorio">
        <div className="cn-ent-pagina">
          <div className="cn-ent-vacio cn-ent-vacio--aviso">
            <p className="cn-ent-vacio-titulo">El motor de transcripción no está configurado</p>
            <p className="cn-ent-vacio-texto">
              Sin él no se puede grabar ni transcribir una entrevista. Lo configura el equipo que administra el
              servidor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── El guion, en sus dos momentos ─────────────────────────────────────── */
  const guion = (momento: 'vivo' | 'detalle') => (
    <section className="cn-ent-seccion" aria-labelledby={`cn-ent-guion-${momento}`}>
      <h2 id={`cn-ent-guion-${momento}`} className="cn-ent-h2">
        Lo que no puede quedar sin preguntar
      </h2>
      {!guionHabilitado ? (
        <p className="cn-ent-aviso cn-ent-aviso--info">{AVISO_FUNCION_DESHABILITADA}</p>
      ) : (
        <>
          <p className="cn-ent-texto">
            {momento === 'vivo'
              ? 'Téngalas delante durante la conversación. Se tachan solas cuando esté transcrita, leyendo lo que se dijo — no mientras se graba.'
              : 'Se tacharon leyendo el transcrito. Es una ayuda de memoria, no una comprobación: que una quede tachada no garantiza que la respuesta sirva, y que quede sin tachar no significa que no se habló del tema.'}
          </p>
          {/*
            LO QUE YA QUEDO DICHO EN OTRA ENTREVISTA se anuncia arriba, una sola
            vez, y se marca abajo pregunta por pregunta con la fecha. Distinto
            del tachado de hoy a proposito: una respuesta de hace tres semanas
            se relee, no se da por hecha.
          */}
          {previas.length > 0 && (
            <p className="cn-ent-aviso cn-ent-aviso--info">
              {previas.length === 1 ? 'Hay una entrevista anterior' : `Hay ${previas.length} entrevistas anteriores`} con
              este cliente.{' '}
              {respondidasAntes === 0
                ? 'Ninguna de estas preguntas quedó respondida en ellas.'
                : respondidasAntes === 1
                  ? 'Una de estas preguntas ya quedó respondida allí; abajo dice cuándo.'
                  : `${respondidasAntes} de estas preguntas ya quedaron respondidas allí; abajo dice cuándo.`}
            </p>
          )}
          <ul className="cn-ent-guion">
            {GUION_BASE.map((p) => {
              const estado = estados.get(p.id) ?? { estado: 'pendiente' as const };
              const clase =
                estado.estado === 'hoy'
                  ? 'cn-ent-pregunta--hoy'
                  : estado.estado === 'antes'
                    ? 'cn-ent-pregunta--antes'
                    : momento === 'detalle'
                      ? 'cn-ent-pregunta--falta'
                      : 'cn-ent-pregunta--pendiente';
              return (
                <li key={p.id} className={`cn-ent-pregunta ${clase}`}>
                  <span className="cn-ent-pregunta-marca" aria-hidden="true">
                    {estado.estado !== 'pendiente' && <Check size={16} strokeWidth={2.4} />}
                  </span>
                  <span className="cn-ent-pregunta-cuerpo">
                    <span className="cn-ent-pregunta-texto">{p.texto}</span>
                    {estado.estado === 'hoy' && (
                      <span className="cn-ent-pregunta-nota">Quedó dicha en la conversación.</span>
                    )}
                    {estado.estado === 'antes' && (
                      <span className="cn-ent-pregunta-nota">
                        Ya se habló de esto en la entrevista del {fechaCorta(estado.origen.transcribedAt)}. Confírmelo,
                        no lo vuelva a preguntar desde cero.
                      </span>
                    )}
                    {/*
                      LO QUE CUESTA NO PREGUNTARLO, y solo mientras no se haya
                      cubierto. Repetirlo tachado convertiria la advertencia en
                      decorado — y no todas las preguntas lo llevan, porque decir
                      que todo urge es la forma mas rapida de que no urja nada.
                    */}
                    {estado.estado === 'pendiente' && (momento === 'detalle' || p.loQueCuesta) && (
                      <span className="cn-ent-pregunta-nota">
                        {momento === 'detalle' ? (p.loQueCuesta ? `Sin cubrir · ${p.loQueCuesta}` : 'Sin cubrir') : p.loQueCuesta}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );

  const exportar = (formato: 'word' | 'pdf') => {
    if (!result) return;
    void import('../../transcription/transcriptExport').then((m) =>
      formato === 'word'
        ? m.exportTranscriptToWord(result, cliente?.fullName || titulo || 'entrevista', armarActa())
        : m.exportTranscriptToPdf(result, cliente?.fullName || titulo || 'entrevista', armarActa())
    );
  };

  /*
   * LA CONSTANCIA SE EXPORTA AUNQUE NO HAYA TRANSCRITO TODAVÍA (2a): el abogado
   * que declina durante la reunión igual necesita dejar constancia de lo
   * conversado. Lo que sale NO es una transcripción —`model` lo dice— sino
   * quién, cuándo y que autorizó la grabación.
   */
  const exportarConstancia = () => {
    if (!cliente) return;
    void import('../../transcription/transcriptExport').then((m) =>
      m.exportTranscriptToWord(
        {
          kind: 'ENTREVISTA',
          fullText: '',
          segments: [],
          speakerLabels: [],
          language: 'es',
          durationSeconds: null,
          model: 'sin transcribir',
          transcribedAt: new Date().toISOString()
        },
        `constancia-${cliente.fullName}`,
        {
          autorizadoEl,
          revisadaPor: null,
          actaLista: false,
          consultante: { nombre: cliente.fullName, documento: cliente.documentId }
        }
      )
    );
  };

  const horaAutorizada = horaEnPalabras(autorizadoEl);

  return (
    <div data-visita="vista-entrevistas" className="cara-nueva cn-ent cn-ent-escritorio">
      {result ? (
        /* ─── EL DETALLE (maqueta :482) ─────────────────────────────────────── */
        (() => {
          const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);
          const voces = intervinientes(result.segments);
          const decision = decisionEnPalabras(fila ?? {});
          const horaDeLaFila = horaEnPalabras(fila?.autorizo_grabacion_el);
          const revision = revisionEnPalabras(result.segments);
          const bajada = [
            new Date(result.transcribedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
            duracionEnPalabras(result.durationSeconds),
            `${result.segments.length} ${result.segments.length === 1 ? 'intervención' : 'intervenciones'}`,
            `${result.speakerLabels.length} ${result.speakerLabels.length === 1 ? 'voz' : 'voces'}`
          ]
            .filter(Boolean)
            .join(' · ');
          const relato = relatoDelCliente();

          return (
            <div className="cn-ent-detalle">
              <div className="cn-ent-detalle-principal">
                <div className="cn-ent-detalle-ancho">
                  <button type="button" onClick={irALaLista} className="cn-ent-volver">
                    <ChevronLeft size={18} aria-hidden="true" />
                    Entrevistas
                  </button>
                  <h1 className="cn-ent-h1">
                    {cliente ? `Entrevista con ${cliente.fullName}` : nombreLegible(titulo) || 'Entrevista'}
                  </h1>
                  <p className="cn-ent-bajada">{bajada}</p>

                  {!persisted && <NotPersistedWarning />}
                  {error && <p className="cn-ent-aviso cn-ent-aviso--peligro">{error}</p>}

                  <section className="cn-ent-seccion" aria-labelledby="cn-ent-quien">
                    <h2 id="cn-ent-quien" className="cn-ent-h2">
                      Quién consulta
                    </h2>
                    <ClientPicker value={clientId} onChange={elegirCliente} />
                  </section>

                  {guion('detalle')}

                  <section className="cn-ent-seccion" aria-labelledby="cn-ent-decision">
                    <h2 id="cn-ent-decision" className="cn-ent-h2">
                      ¿Toma el caso?
                    </h2>
                    {decision.tono === 'pendiente' ? (
                      <>
                        <p className="cn-ent-texto">
                          Si lo declina, deje el motivo en una línea: su firma necesita saber qué está dejando pasar, y
                          el consultante merece una respuesta.
                        </p>
                        {!transcriptionId && (
                          <p className="cn-ent-aviso cn-ent-aviso--aviso">
                            La decisión se registra cuando la entrevista esté guardada en la firma.
                          </p>
                        )}
                        <div className="cn-ent-botones cn-ent-botones--inicio">
                          <button
                            type="button"
                            onClick={() => void tomarElCaso()}
                            disabled={!transcriptionId || decidiendo}
                            className="cn-ini-boton cn-ini-boton--primario cn-ent-boton"
                          >
                            {decidiendo ? 'Registrando…' : onDraft && relato.length > 0 ? 'Tomar el caso y redactar' : 'Tomar el caso'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeclinarAbierto(true)}
                            disabled={!transcriptionId || decidiendo}
                            className="cn-ini-boton cn-ini-boton--suave cn-ent-boton"
                          >
                            Declinar con motivo
                          </button>
                          <button type="button" onClick={irALaLista} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton">
                            Decidir después
                          </button>
                        </div>
                        <p className="cn-ent-nota">
                          «Decidir después» la deja en «esperan decisión», con los días de espera a la vista en la lista.
                        </p>
                      </>
                    ) : (
                      <div className="cn-ent-decidida">
                        <span className={`cn-ent-chip ${decision.tono === 'ok' ? 'cn-ent-chip--ok' : 'cn-ent-chip--neutro'}`}>
                          {decision.titulo}
                        </span>
                        {decision.detalle && <span className="cn-ent-texto">{decision.detalle}</span>}
                        <button
                          type="button"
                          onClick={() => void reabrirDecision()}
                          disabled={decidiendo}
                          className="cn-ini-boton cn-ini-boton--texto cn-ent-boton"
                        >
                          Reabrir la decisión
                        </button>
                      </div>
                    )}
                    {errorDecision && <p className="cn-ent-aviso cn-ent-aviso--peligro">{errorDecision}</p>}
                  </section>
                </div>

                {/*
                  EL TRANSCRITO, DEBAJO Y A TODO EL ANCHO. Sus componentes son
                  del motor compartido con Audiencias y conservan su interior:
                  aquí solo se les da la mesa.
                */}
                <div className="cn-ent-transcrito">
                  {transcriptionId && <TranscriptSummary transcriptionId={transcriptionId} kind="ENTREVISTA" />}
                  {transcriptionId && <InterviewInsights transcriptionId={transcriptionId} />}
                  <TranscriptSegments
                    result={result}
                    kind="ENTREVISTA"
                    onAssignRole={assignRole}
                    onEditSegment={canEdit ? editSegment : undefined}
                    onSplitSegment={canEdit ? splitSegment : undefined}
                    onReassignSpeaker={canEdit ? reassignSpeaker : undefined}
                    onMarcarRevisada={canEdit ? marcarRevisada : undefined}
                    onMarcarHechoClave={marcarHechoClave}
                    onAssignSpeakerName={canEdit ? assignSpeakerName : undefined}
                    voiceConflicts={voiceConflicts}
                    nameProposals={nameProposals}
                  />
                </div>
              </div>

              {/*
                EL ACTA AL LADO, con lo que la entrevista SÍ registra. La maqueta
                pone «Tratamiento de datos: pendiente de firma» y una acompañante
                escrita a mano; ninguno de los dos existe. Los intervinientes
                salen de las voces del transcrito y la hora, de la fila.
              */}
              <aside className="cn-ent-acta" aria-labelledby="cn-ent-acta-titulo">
                <h2 id="cn-ent-acta-titulo" className="cn-ent-acta-titulo">
                  El acta de la entrevista
                </h2>
                <dl className="cn-ent-acta-datos">
                  <div>
                    <dt className="cn-ent-acta-rotulo">Intervinientes</dt>
                    {cliente && (
                      <dd className="cn-ent-acta-valor">
                        {cliente.fullName} — consultante
                      </dd>
                    )}
                    {voces.map((v) => (
                      <dd key={v.voz} className="cn-ent-acta-valor">
                        {nombres[v.voz] ?? v.voz}
                        <span className="cn-ent-acta-detalle">
                          {' '}
                          · {v.intervenciones} {v.intervenciones === 1 ? 'intervención' : 'intervenciones'}
                        </span>
                      </dd>
                    ))}
                  </div>
                  <div>
                    <dt className="cn-ent-acta-rotulo">Grabación</dt>
                    <dd className="cn-ent-acta-valor">
                      {horaDeLaFila ? (
                        <>
                          Autorizada · <span className="cn-ent-mono">{horaDeLaFila}</span>
                        </>
                      ) : (
                        'Sin hora de autorización registrada'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="cn-ent-acta-rotulo">Decisión</dt>
                    <dd className={`cn-ent-acta-valor ${decision.tono === 'pendiente' ? 'cn-ent-acta-valor--aviso' : ''}`}>
                      {decision.titulo}
                      {decision.detalle ? ` · ${decision.detalle}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="cn-ent-acta-rotulo">Revisión</dt>
                    <dd className="cn-ent-acta-valor">{revision ?? 'Sin intervenciones'}</dd>
                  </div>
                </dl>
                <div className="cn-ent-acta-botones">
                  <button type="button" onClick={() => exportar('word')} className="cn-ini-boton cn-ini-boton--blanco cn-ent-boton">
                    <FileText size={16} aria-hidden="true" />
                    Word
                  </button>
                  <button type="button" onClick={() => exportar('pdf')} className="cn-ini-boton cn-ini-boton--blanco cn-ent-boton">
                    <FileText size={16} aria-hidden="true" />
                    PDF
                  </button>
                </div>
                <button type="button" onClick={() => void copiar()} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton cn-ent-boton--ancho">
                  {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  {copiado ? 'Copiado' : 'Copiar el texto'}
                </button>
                <p className="cn-ent-nota">
                  {cliente
                    ? 'El acta lleva dos líneas de firma, la de quien revisó y la del consultante: es el documento que se le entrega o se le lee.'
                    : 'El acta lleva la línea de firma de quien revisó. Con un consultante asignado, lleva también la suya.'}
                </p>
              </aside>
            </div>
          );
        })()
      ) : enGrabacion ? (
        /* ─── LA GRABACIÓN (maqueta :107) ───────────────────────────────────── */
        <div className="cn-ent-grabacion">
          <div className="cn-ent-barra">
            <button type="button" onClick={volverDeLaGrabacion} className="cn-ent-volver">
              <ChevronLeft size={18} aria-hidden="true" />
              Entrevistas
            </button>
            <span className="cn-ent-barra-titulo">{cliente ? `Entrevista con ${cliente.fullName}` : 'Nueva entrevista'}</span>
          </div>

          {trabajando && (
            <div className="cn-ent-banda cn-ent-banda--trabajando" aria-live="polite">
              <span className="cn-ent-giro" aria-hidden="true" />
              <div className="cn-ent-banda-texto">
                <p className="cn-ent-banda-titulo">
                  {isUploading
                    ? uploadProgress > 0
                      ? `Enviando la grabación · ${uploadProgress} %`
                      : 'Enviando la grabación…'
                    : 'Transcribiendo…'}
                </p>
                <p className="cn-ent-banda-linea">
                  Separando las voces y ordenando la conversación. Mantenga esta pestaña abierta hasta que termine.
                </p>
              </div>
            </div>
          )}

          {/*
            LA GRABADORA SIGUE MONTADA MIENTRAS SE TRANSCRIBE, solo oculta. Antes
            se desmontaba al empezar el envío, y si la transcripción fallaba la
            grabación se perdía con ella: una hora de entrevista por un error de
            red. Oculta, conserva el archivo y el botón para reintentar.
          */}
          <div hidden={trabajando}>
            <AudioRecorder
              onRecorded={empezar}
              disabled={!permiso.puede}
              iniciarAlMontar={iniciarAlMontar}
              onEstado={setEstadoGrabadora}
              linea={
                horaAutorizada ? (
                  <>
                    {cliente ? cliente.fullName : 'Sin cliente asignado'} · grabación autorizada a las{' '}
                    <span className="cn-ent-mono">{horaAutorizada}</span>
                  </>
                ) : undefined
              }
            />
          </div>

          <div className="cn-ent-grabacion-cuerpo">
            <div className="cn-ent-principal">
              {!permiso.puede && permiso.razon && !trabajando && (
                <div className="cn-ent-aviso cn-ent-aviso--aviso cn-ent-aviso--con-accion">
                  <span>{permiso.razon}</span>
                  <button type="button" onClick={() => setNuevaAbierta(true)} className="cn-ini-boton cn-ini-boton--blanco cn-ent-boton">
                    Registrar la autorización
                  </button>
                </div>
              )}
              {error && <p className="cn-ent-aviso cn-ent-aviso--peligro">{error}</p>}
              {guion('vivo')}
            </div>

            <aside className="cn-ent-lateral" aria-label="Mientras graba">
              <div className="cn-ent-lateral-bloque">
                <p className="cn-ent-lateral-titulo">Con quién</p>
                {cliente ? (
                  <>
                    <p className="cn-ent-texto cn-ent-fuerte">{cliente.fullName}</p>
                    <p className="cn-ent-nota">
                      <span className="cn-ent-mono">C.C. {cliente.documentId}</span> ·{' '}
                      {cliente.interviews === 0
                        ? 'cliente nuevo'
                        : `${cliente.interviews} ${cliente.interviews === 1 ? 'entrevista previa' : 'entrevistas previas'}`}
                    </p>
                  </>
                ) : (
                  <p className="cn-ent-nota">Sin cliente asignado. Puede atarlo después, desde el detalle de la entrevista.</p>
                )}
              </div>
              <p className="cn-ent-nota cn-ent-lateral-bloque">
                Se graba en este navegador y no sale de aquí hasta que pulse transcribir. La grabación no se guarda: se
                borra del almacenamiento apenas termina de transcribirse. El texto sí queda en su firma.
              </p>
              {onPrivacidad && (
                <p className="cn-ent-nota cn-ent-lateral-bloque">
                  ¿Quién más ve esto?{' '}
                  <button type="button" onClick={onPrivacidad} className="cn-ent-enlace">
                    El registro de subencargados
                  </button>{' '}
                  dice quién procesa sus datos, para qué y dónde.
                </p>
              )}
              {cliente && (
                <button type="button" onClick={exportarConstancia} className="cn-ini-boton cn-ini-boton--blanco cn-ent-boton cn-ent-boton--ancho">
                  <FileText size={16} aria-hidden="true" />
                  Exportar la constancia
                </button>
              )}
            </aside>
          </div>
        </div>
      ) : (
        /* ─── LA LISTA ──────────────────────────────────────────────────────── */
        <div className="cn-ent-pagina">
          <header className="cn-ent-cabeza">
            <div className="cn-ent-cabeza-textos">
              <h1 className="cn-ent-h1">Entrevistas</h1>
              <p className="cn-ent-bajada">
                Grabe la conversación con quien consulta, con su autorización registrada, y termine en una decisión.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirNueva}
              disabled={soloLectura}
              title={soloLectura ? 'Con el plan vencido no se graban entrevistas nuevas.' : undefined}
              className="cn-ini-boton cn-ini-boton--primario cn-ent-boton"
            >
              <Plus size={16} aria-hidden="true" />
              Nueva entrevista
            </button>
          </header>

          {!hasFirm && (
            <p className="cn-ent-aviso cn-ent-aviso--aviso">Sin una firma no se puede guardar la entrevista.</p>
          )}
          {error && <p className="cn-ent-aviso cn-ent-aviso--peligro">{error}</p>}

          <EntrevistasList
            items={stored}
            isLoading={isLoadingStored}
            onOpen={abrir}
            onDelete={deleteStored}
            onRefresh={() => void loadStored()}
            onNueva={soloLectura ? undefined : abrirNueva}
          />
        </div>
      )}

      <NuevaEntrevistaDialog
        abierto={nuevaAbierta}
        onCerrar={() => setNuevaAbierta(false)}
        clientId={clientId}
        onCliente={elegirCliente}
        autorizado={autorizado}
        autorizadoEl={autorizadoEl}
        onAutorizar={marcarAutorizacion}
        permiso={permiso}
        onEmpezar={empezarAGrabar}
        onSubir={subir}
        maxAudioBytes={maxAudioBytes}
        onPrivacidad={onPrivacidad}
      />

      {/* ─── SALIR SIN TRANSCRIBIR · confirmación destructiva (app-dialogos-y-estados.html:232) ─── */}
      <Dialog
        abierto={confirmarSalida}
        onCerrar={() => setConfirmarSalida(false)}
        tamano="S"
        titulo="¿Salir sin transcribir?"
        acciones={
          <>
            <button type="button" onClick={() => setConfirmarSalida(false)} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton">
              No, seguir aquí
            </button>
            <button type="button" onClick={irALaLista} className="cn-ini-boton cn-ent-boton cn-ent-boton--peligro">
              Sí, descartarla
            </button>
          </>
        }
      >
        <p className="cn-ent-dlg-texto">
          La grabación vive solo en este navegador. Si sale ahora, se pierde y no se puede recuperar.
        </p>
      </Dialog>

      {transcriptionId && (
        <CerrarEntrevistaDialog
          abierto={declinarAbierto}
          modo="declinar"
          onCerrar={() => setDeclinarAbierto(false)}
          transcriptionId={transcriptionId}
          titulo={cliente?.fullName ?? (nombreLegible(titulo) || 'Entrevista')}
          onDecidido={() => void loadStored()}
        />
      )}
    </div>
  );
};
