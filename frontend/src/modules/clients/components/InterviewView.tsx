import React from 'react';
import { AlertTriangle, ArrowLeft, Copy, CheckCircle2, FileText, PenLine, Upload } from 'lucide-react';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { useAutorizacionDeGrabacion } from '../useAutorizacionDeGrabacion';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { TranscriptSegments } from '../../transcription/components/TranscriptSegments';
import { EntrevistasList } from './EntrevistasList';
import { CerrarEntrevistaDialog } from './CerrarEntrevistaDialog';
import { NotPersistedWarning } from '../../transcription/components/RoleProposals';
// Carga diferida: el acta embebe Plus Jakarta Sans (~500 KB) y solo la paga quien exporta.
import { buildSpeakerNames } from '../../transcription/speakerNames';
import { ROLE_LABELS, ROLES_DEL_RELATO, SUPPORTED_AUDIO_EXTENSIONS } from '../../transcription/types';
import { toPlainText } from '../../transcription/toPlainText';
import { ClientPicker } from './ClientPicker';
import { GUION_BASE, cubiertasEnEntrevistasPrevias, estadoDelGuion, preguntasCubiertas } from '../guionDeEntrevista';
import { InterviewInsights } from './InterviewInsights';
import { TranscriptSummary } from '../../transcription/components/TranscriptSummary';
import { AudioRecorder } from './AudioRecorder';
import { clientsApi, type Client } from '../clients.api';

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
 * another speaker, naming, in-place correction, export. That surface needed
 * eight separate fixes in one day — the cut panel opening off-screen, roles
 * that were never persisted, name suggestions dropped on reopen, Enter breaking
 * the record, a phantom second judge, a label collision. Duplicating it would
 * mean fixing every one of those twice, and the second copy is the one nobody
 * notices is broken.
 *
 * So: two screens, two flows, one engine.
 */
/**
 * A numbered step.
 *
 * The screen was a stack of cards of equal weight — client, saved list, record,
 * two notices — and a stack does not say what to do first. An interview is a
 * procedure: who is this with, capture it, read it. Numbering the first two says
 * so without a paragraph explaining it.
 */
const Paso: React.FC<{ numero: number; titulo: string; children: React.ReactNode }> = ({
  numero,
  titulo,
  children
}) => (
  <section className="overflow-hidden rounded-card border border-line-200 bg-surface">
    <header className="flex items-center gap-2 border-b border-line-100 bg-canvas px-4 py-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 font-mono text-[10px] font-bold text-on-brand">
        {numero}
      </span>
      <h3 className="text-ui font-semibold text-ink-900">{titulo}</h3>
    </header>
    <div className="p-4">{children}</div>
  </section>
);

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
   * Lleva al registro de subencargados (2c). 2a lo quiere enlazado DESDE la
   * ficha del cliente: la pregunta «¿quién más ve esto?» se hace en la sala.
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
   * se le lee o se le entrega.
   */
  const [cliente, setCliente] = React.useState<Client | null>(null);

  const elegirCliente = (id: string | null, ficha: Client | null): void => {
    setClientId(id);
    setCliente(ficha);
  };
  const [copiado, setCopiado] = React.useState(false);
  const [titulo, setTitulo] = React.useState('');
  /*
   * LA AUTORIZACION DE GRABACION ES BLOQUEANTE. La voz es un dato biometrico
   * (Ley 1581 de 2012): sin la casilla marcada, ni el grabador ni la subida se
   * habilitan — el audio no se envia a transcribir. Y desde la migracion
   * migration-revision-y-autorizacion.sql ES un registro: la hora del clic
   * viaja con la transcripcion a transcriptions.autorizo_grabacion_el — la
   * constancia demostrable que la Ley 1581 exige.
   */
  /*
   * LA AUTORIZACION VIVE EN SU PROPIO GANCHO, compartida con la pantalla movil
   * (4d). Dos copias de un consentimiento se desincronizan sin hacer ruido: una
   * guarda la hora y la otra la olvida, y el dia que alguien pida la constancia
   * solo existe para la mitad de las entrevistas.
   */
  const { autorizado, autorizadoEl, marcar: marcarAutorizacion } = useAutorizacionDeGrabacion();
  const [cerrarAbierto, setCerrarAbierto] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    void loadStored();
  }, [loadStored]);

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
    setTitulo(item.title);
    openStored(item);
  }, [stored, result, openStored]);

  // Written as soon as there is a transcript to attach it to, so the choice
  // made before recording is never lost between the two moments.
  React.useEffect(() => {
    if (!transcriptionId || !clientId) return;

    void clientsApi.linkInterview(transcriptionId, clientId).catch(() => {
      /* The transcript itself is safe; the link can be made again. */
    });
  }, [transcriptionId, clientId]);

  const empezar = (file: File) => {
    setTitulo(file.name);
    void transcribe(file, undefined, autorizadoEl ?? undefined);
  };


  /*
   * El ACTA con datos reales — y SIN RED. Todo sale de la fila que la lista ya
   * tiene en memoria: la hora de autorizacion, quien reviso, y el resumen si
   * alguna vez se genero. La version anterior hacia un POST al exportar y el
   * clic pagaba el arranque en frio de la funcion: segundos de boton mudo por
   * datos que ya estaban aqui.
   */
  const armarActa = () => {
    if (!transcriptionId) return undefined;
    const fila = stored.find((i) => i.id === transcriptionId);
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

    await navigator.clipboard.writeText(
      toPlainText(result.segments, buildSpeakerNames(result.segments, ROLE_LABELS))
    );
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  };

  const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

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
  const cubiertas = React.useMemo(
    () => preguntasCubiertas(result?.segments ?? []),
    [result]
  );

  /*
   * LA SEGUNDA ENTREVISTA SABE QUE RESPONDIO LA PRIMERA.
   *
   * Las entrevistas anteriores del mismo cliente ya estan en `stored` con su
   * `client_id` y sus intervenciones: no hace falta una llamada nueva. Se
   * excluye la que se esta viendo, porque lo que ella cubre es «hoy», no
   * «antes». Sin cliente elegido no hay «antes» posible: la lista arranca
   * entera, como siempre.
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

  const fechaCorta = (iso: string | null): string =>
    iso
      ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
      : 'una entrevista anterior';

  /*
   * THE SCROLL CONTAINER, WHICH THIS VIEW SHIPPED WITHOUT.
   *
   * `<main>` in App.tsx is `flex overflow-hidden`, so every module supplies its
   * own scrolling surface — the hearings view and the search view both do. This
   * one returned a bare `space-y-4`, so a two-hour interview rendered its whole
   * transcript into a box that was clipped at the fold with no way to reach the
   * rest. The transcript was there; the page simply had no way to move.
   */
  /*
   * `=== false`, and the difference is the whole defect.
   *
   * `isAvailable` is `boolean | null`: null means the status request has not
   * come back yet. Written as `!isAvailable` that reads as "not available", so
   * every visit to this screen flashed "el motor de transcripción no está
   * configurado" for the length of one round trip and then replaced it with the
   * working page.
   *
   * A warning that appears and vanishes is worse than no warning: the lawyer
   * saw something was wrong and had nothing to act on. Not knowing yet is not
   * the same as knowing it is broken — the hearings view already spelled this
   * `=== false` and I did not carry it across.
   */
  if (isAvailable === false) {
    return (
      <div className="bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card p-4 flex items-start gap-2 m-6">
        <AlertTriangle className="w-4 h-4 text-unverified shrink-0 mt-0.5" />
        <p className="text-[11px] text-ink-900">
          El motor de transcripción no está configurado en el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      {/*
        La cabecera del modulo: quien es y que sale de aqui. La audiencia
        empieza por la grabacion que llega; la entrevista empieza por la
        persona, y por eso el paso 1 es el cliente y no el microfono.
      */}
      <header className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line-200 bg-surface px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink-900">Entrevistas</h1>
          <p className="mt-0.5 text-meta text-ink-500">
            {result
              ? `${result.segments.length} intervenciones · ${result.speakerLabels.length} voces`
              : 'Empieza por quién está al frente; termina en una decisión.'}
          </p>
        </div>

        {/*
          EL ACTA SE EXPORTA AUNQUE NO HAYA TRANSCRITO TODAVÍA (2a).
          
          La nota del artboard lo razona: «el abogado que declina el caso igual
          necesita dejar constancia de lo conversado». Antes esto estaba detrás
          de `result`, así que durante la grabación —justo cuando alguien decide
          no tomar el caso— no había forma de sacar nada.
          
          Lo que sale entonces NO es una transcripción: es la constancia de la
          reunión —quién, cuándo, y que autorizó la grabación— y así se rotula.
          Un acta que promete un transcrito que no existe sería peor que no
          poder exportarla.
        */}
        {!result && cliente && (
          <div className="flex">
            <button
              onClick={() =>
                void import('../../transcription/transcriptExport').then((m) =>
                  m.exportTranscriptToWord(
                    {
                      /*
                        UN RESULTADO VACIO Y DECLARADO COMO TAL: `model` dice
                        que todavia no hubo transcripcion, para que nadie lea el
                        acta creyendo que un motor la produjo.
                      */
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
                    armarActa()
                  )
                )
              }
              className="btn-neutral btn-sm"
              title="Constancia de la reunión, sin transcrito todavía"
            >
              <FileText className="h-3.5 w-3.5" />
              Constancia
            </button>
          </div>
        )}

        {result && (
          <>
            <button onClick={() => void copiar()} className="btn-neutral btn-sm">
              {copiado ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>

            {/* El acta, en dos formatos del mismo peso: el .docx se edita, el PDF se anexa. */}
            <div className="flex">
              <button
                onClick={() => void import('../../transcription/transcriptExport').then((m) => m.exportTranscriptToWord(result, titulo || 'entrevista', armarActa()))}
                className="btn-secondary btn-sm rounded-r-none"
              >
                <FileText className="h-3 w-3" />
                Word
              </button>
              <button
                onClick={() => void import('../../transcription/transcriptExport').then((m) => m.exportTranscriptToPdf(result, titulo || 'entrevista', armarActa()))}
                className="btn-secondary btn-sm -ml-px rounded-l-none"
              >
                PDF
              </button>
            </div>

            <button onClick={reset} className="btn-neutral btn-sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Otra entrevista
            </button>

            {/*
              EL PRIMARIO: tomar el caso y redactar. Solo cuando alguien narro
              algo — sin turnos de relato el boton prometeria un puente que no
              existe.
            */}
            {/*
              El cierre del flujo: la entrevista termina en una decision, y las
              tres salidas viven en el dialogo — tomar, decidir despues,
              declinar con motivo. Solo con la entrevista guardada: sin id no
              hay donde registrar la decision.
            */}
            {transcriptionId && (
              <button onClick={() => setCerrarAbierto(true)} className="btn-primary btn-sm">
                <PenLine className="h-3 w-3" />
                Cerrar la entrevista
              </button>
            )}
          </>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-6xl space-y-4">

      {!hasFirm && (
        <div className="bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-unverified shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-900">
            Sin una firma no se puede guardar la entrevista.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[rgb(var(--danger)/0.06)] border border-[rgb(var(--danger)/0.35)] rounded-card p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-[11px] text-danger">{error}</p>
        </div>
      )}

      {!result ? (
        <>
          {/*
            EL NOMBRE DEL PASO ES EL DE 2a. «¿Con quién es la entrevista?» pedía
            una respuesta; «Quién está al frente» describe lo que hay en la sala,
            que es lo que el abogado está mirando mientras lo llena.
          */}
          <Paso numero={1} titulo="Quién está al frente">
            <ClientPicker value={clientId} onChange={elegirCliente} />

            {/*
              LA FICHA, cuando ya hay cliente. 2a la pone completa —contacto,
              ciudad, relación— y no es adorno: son los datos que el acta
              imprime y los que permiten reconocer a la persona en una lista de
              treinta. Se muestra lo que la ficha TIENE; lo vacío no se pinta,
              porque un rótulo con una raya al lado no informa de nada.
            */}
            {cliente && (
              <div className="mt-3 rounded-card border border-line-200 bg-canvas p-3">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {cliente.phone && (
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                        Contacto
                      </dt>
                      <dd className="mt-0.5 text-[12.5px] text-ink-900">{cliente.phone}</dd>
                    </div>
                  )}
                  {cliente.email && (
                    <div>
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                        Correo
                      </dt>
                      <dd className="mt-0.5 truncate text-[12.5px] text-ink-900">
                        {cliente.email}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      Relación
                    </dt>
                    {/*
                      «Cliente nuevo» es un HECHO contado, no una etiqueta: sale
                      de cuántas entrevistas lleva esa persona. Y sí puede haber
                      una segunda —el modelo las cuenta—; lo que cambia es que la
                      pantalla lo dice en vez de tratar cada una como la primera.
                    */}
                    <dd className="mt-0.5 text-[12.5px] text-ink-900">
                      {cliente.interviews === 0
                        ? 'Cliente nuevo'
                        : `${cliente.interviews} ${
                            cliente.interviews === 1 ? 'entrevista previa' : 'entrevistas previas'
                          }`}
                    </dd>
                  </div>
                </dl>

                {/*
                  EL TRATAMIENTO DE DATOS VIVE AQUÍ, NO EN UN MODAL PREVIO, y la
                  nota de 2a dice por qué: «la pregunta ¿quién más ve esto?
                  aparece en la sala, no después». El enlace va al registro de
                  subencargados (2c), que es la respuesta real y no una promesa.
                */}
                <p className="mt-3 border-t border-line-200 pt-2.5 text-justify text-[11.5px] leading-snug text-ink-500 [text-wrap:pretty]">
                  Si el consultante pregunta quién más ve esto, la respuesta está en{' '}
                  <button
                    type="button"
                    onClick={onPrivacidad}
                    className="font-semibold text-brand-700 underline underline-offset-2"
                  >
                    el registro de subencargados
                  </button>
                  : quién procesa sus datos, para qué y dónde.
                </p>
              </div>
            )}
          </Paso>

          {/*
            EL GUION SUGERIDO, EN SU PROPIO PASO (2a). Va DESPUES del cliente y
            ANTES de grabar, porque es lo que hay que tener delante durante la
            conversacion — no un resumen para leer al final.
          */}
          <Paso numero={2} titulo="Lo que no puede quedarse sin preguntar">
            {/*
              LO QUE YA QUEDO DICHO EN OTRA ENTREVISTA se anuncia arriba, una
              sola vez, y se marca abajo pregunta por pregunta con la fecha.
              Distinto del tachado de hoy a proposito: una respuesta de hace
              tres semanas se relee, no se da por hecha.
            */}
            {previas.length > 0 && (
              <p className="mb-3 rounded-control border border-brand-line bg-brand-50 px-3 py-2 text-[11.5px] leading-snug text-brand-700">
                {previas.length === 1 ? 'Hay una entrevista anterior' : `Hay ${previas.length} entrevistas anteriores`} con
                este cliente.{' '}
                {respondidasAntes === 0
                  ? 'Ninguna de estas preguntas quedó respondida en ellas.'
                  : respondidasAntes === 1
                    ? 'Una de estas preguntas ya quedó respondida allí; abajo dice cuándo.'
                    : `${respondidasAntes} de estas preguntas ya quedaron respondidas allí; abajo dice cuándo.`}
              </p>
            )}
            <ul className="space-y-2">
              {GUION_BASE.map((p) => {
                const estado = estados.get(p.id) ?? { estado: 'pendiente' as const };
                const cubierta = estado.estado === 'hoy';
                const antes = estado.estado === 'antes';
                return (
                  <li key={p.id} className="flex items-start gap-2.5">
                    <span
                      className={`mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                        cubierta
                          ? 'border-verified bg-[rgb(var(--verified-surf))]'
                          : antes
                            ? 'border-brand-line bg-brand-50'
                            : 'border-line-200'
                      }`}
                    >
                      {cubierta && <CheckCircle2 className="h-2.5 w-2.5 text-verified" strokeWidth={3} />}
                      {antes && <CheckCircle2 className="h-2.5 w-2.5 text-brand-700" strokeWidth={2} />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-[12.5px] leading-snug ${
                          cubierta ? 'text-ink-400 line-through' : antes ? 'text-ink-500' : 'text-ink-900'
                        }`}
                      >
                        {p.texto}
                      </span>
                      {estado.estado === 'antes' && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-brand-700">
                          Ya se habló de esto en la entrevista del {fechaCorta(estado.origen.transcribedAt)}. Confírmelo, no lo
                          vuelva a preguntar desde cero.
                        </span>
                      )}
                      {/*
                        LO QUE CUESTA NO PREGUNTARLO, y solo mientras no se haya
                        cubierto. Repetirlo tachado convertiria la advertencia en
                        decorado — y no todas las preguntas lo llevan, porque
                        decir que todo urge es la forma mas rapida de que no
                        urja nada.
                      */}
                      {!cubierta && !antes && p.loQueCuesta && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">
                          {p.loQueCuesta}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-3 border-t border-line-200 pt-2.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
              Se tachan solas una vez transcrita la conversación, leyendo el transcrito — no en
              vivo mientras se graba. Es una ayuda de memoria, no una comprobación: que una quede
              tachada no garantiza que la respuesta sirva, y que quede sin tachar no significa que
              no se habló del tema.
            </p>
          </Paso>

          <Paso numero={3} titulo="Captura la conversación">
            {trabajando ? (
              <div className="py-6 text-center">
                <p className="text-xs font-bold text-ink-900">
                  {isUploading
                    ? uploadProgress > 0
                      ? `Enviando la grabación · ${uploadProgress}%`
                      : 'Enviando la grabación…'
                    : 'Transcribiendo…'}
                </p>
                <p className="text-[11px] text-ink-500 mt-1">
                  Separando las voces y ordenando la conversación.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Sin esto no se graba. Va ANTES del grabador, porque es antes. */}
                <label
                  className={`flex cursor-pointer items-start gap-2.5 rounded-card border px-3 py-2.5 ${
                    autorizado ? 'border-line-200 bg-canvas' : 'border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={autorizado}
                    /* La hora del CLIC la sella el gancho, no esta pantalla. */
                    onChange={(e) => marcarAutorizacion(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block text-ui font-medium text-ink-900">
                      Le informé que la entrevista se graba y lo autorizó
                    </span>
                    <span className="block text-meta leading-[1.5] text-ink-500">
                      La voz es un dato biométrico (Ley 1581 de 2012): sin esta autorización, la
                      grabación no se envía a transcribir. Queda registrada con la hora.
                    </span>
                  </span>
                </label>

                <AudioRecorder onRecorded={empezar} disabled={!hasFirm || !autorizado} />

                {/*
                  Uploading stays, second. Not every interview happens at the
                  desk — a call recorded on a phone is still an interview — but
                  recording is the ordinary case and gets the ordinary place.
                */}
                <div className="text-center border-t border-line-100 pt-3">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="audio/*,video/mp4"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) empezar(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!hasFirm || !autorizado}
                    title={!autorizado ? 'Primero la autorización de grabación' : undefined}
                    className="text-[11px] font-semibold text-ink-500 hover:text-brand-700 flex items-center gap-1.5 mx-auto disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    O sube una grabación que ya tengas
                  </button>

                  {/*
                    Said before choosing, not after. The limits are enforced
                    either way — the hook validates before uploading — but a
                    file rejected once the picker has closed leaves the lawyer
                    guessing which of the two rules they broke. The ceiling is
                    the server's own: it depends on the host and the provider.
                  */}
                  <p className="text-[10px] text-ink-400 mt-1">
                    {SUPPORTED_AUDIO_EXTENSIONS.join(', ')} · máximo {megabytes(maxAudioBytes)} MB
                  </p>
                </div>

                <p className="text-[11px] text-ink-500 bg-canvas border border-line-200 rounded-control p-2.5">
                  <b className="text-ink-700">Qué se guarda:</b> el texto queda guardado en tu firma
                  y puedes borrarlo cuando quieras.{' '}
                  <b className="text-ink-700">La grabación no se guarda</b>: se borra del
                  almacenamiento apenas termina de transcribirse.
                </p>
              </div>
            )}
          </Paso>

          {/*
            Below the two steps, not between them: this is where a lawyer
            returns to work already done, and it must not stand between them and
            starting the interview they came here for.
          */}
          <EntrevistasList
            items={stored}
            isLoading={isLoadingStored}
            onOpen={(item) => {
              setTitulo(item.title);
              openStored(item);
            }}
            onDelete={deleteStored}
            onRefresh={() => void loadStored()}
          />
        </>
      ) : (
        <>
          <div className="bg-surface border border-line-200 rounded-card p-4">
            <h3 className="text-xs font-bold text-ink-900 mb-2">Cliente de la entrevista</h3>
            <ClientPicker value={clientId} onChange={elegirCliente} />
          </div>

          {!persisted && <NotPersistedWarning />}

          {transcriptionId && (
            <TranscriptSummary transcriptionId={transcriptionId} kind="ENTREVISTA" />
          )}
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
        </>
      )}
        </div>
      </div>

      {transcriptionId && (
        <CerrarEntrevistaDialog
          abierto={cerrarAbierto}
          onCerrar={() => setCerrarAbierto(false)}
          transcriptionId={transcriptionId}
          titulo={titulo || 'Entrevista'}
          onDecidido={() => void loadStored()}
          onTomarYRedactar={
            onDraft && relatoDelCliente().length > 0
              ? () => onDraft(relatoDelCliente())
              : undefined
          }
        />
      )}
    </div>
  );
};
