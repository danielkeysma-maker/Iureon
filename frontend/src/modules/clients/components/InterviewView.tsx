import React from 'react';
import { AlertTriangle, ArrowLeft, Copy, CheckCircle2, FileText, PenLine, Upload } from 'lucide-react';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { TranscriptSegments } from '../../transcription/components/TranscriptSegments';
import { EntrevistasList } from './EntrevistasList';
import { transcriptionApi } from '../../transcription/services/transcription.api';
import { CerrarEntrevistaDialog } from './CerrarEntrevistaDialog';
import { NotPersistedWarning } from '../../transcription/components/RoleProposals';
import { exportTranscriptToPdf, exportTranscriptToWord } from '../../transcription/transcriptExport';
import { buildSpeakerNames } from '../../transcription/speakerNames';
import { ROLE_LABELS, ROLES_DEL_RELATO, SUPPORTED_AUDIO_EXTENSIONS } from '../../transcription/types';
import { toPlainText } from '../../transcription/toPlainText';
import { ClientPicker } from './ClientPicker';
import { InterviewInsights } from './InterviewInsights';
import { TranscriptSummary } from '../../transcription/components/TranscriptSummary';
import { AudioRecorder } from './AudioRecorder';
import { clientsApi } from '../clients.api';

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
}

export const InterviewView: React.FC<InterviewViewProps> = ({ onDraft }) => {
  const {
    hasFirm,
    isAvailable,
    isUploading,
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
  const [autorizado, setAutorizado] = React.useState(false);
  const [autorizadoEl, setAutorizadoEl] = React.useState<string | null>(null);
  const [cerrarAbierto, setCerrarAbierto] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    void loadStored();
  }, [loadStored]);

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
   * El ACTA con datos reales: la hora de autorizacion y la revision salen de
   * la fila guardada; los hechos clave, del resumen del motor (cacheado — si
   * nunca se pidio, esta llamada lo genera y lo deja guardado). Nada se
   * inventa: lo que no exista simplemente no aparece en el documento.
   */
  const armarActa = async () => {
    if (!transcriptionId) return undefined;
    const fila = stored.find((i) => i.id === transcriptionId);
    const resumen = await transcriptionApi.resumen(transcriptionId, true);
    return {
      autorizadoEl: fila?.autorizo_grabacion_el ?? null,
      revisadaPor: fila?.revisada_por ?? null,
      actaLista: fila?.estado_revision === 'ACTA_LISTA',
      hechosClave: resumen?.hechos
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
                onClick={() => void armarActa().then((a) => exportTranscriptToWord(result, titulo || 'entrevista', a))}
                className="btn-secondary btn-sm rounded-r-none"
              >
                <FileText className="h-3 w-3" />
                Word
              </button>
              <button
                onClick={() => void armarActa().then((a) => exportTranscriptToPdf(result, titulo || 'entrevista', a))}
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
        <div className="mx-auto max-w-4xl space-y-4">

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
          <Paso numero={1} titulo="¿Con quién es la entrevista?">
            <ClientPicker value={clientId} onChange={setClientId} />
          </Paso>

          <Paso numero={2} titulo="Captura la conversación">
            {trabajando ? (
              <div className="py-6 text-center">
                <p className="text-xs font-bold text-ink-900">
                  {isUploading ? 'Enviando la grabación…' : 'Transcribiendo…'}
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
                    onChange={(e) => {
                      setAutorizado(e.target.checked);
                      // La hora del CLIC: el consentimiento ocurrio aqui, no al subir.
                      setAutorizadoEl(e.target.checked ? new Date().toISOString() : null);
                    }}
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
            <ClientPicker value={clientId} onChange={setClientId} />
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
