import React from 'react';
import { AlertTriangle, ArrowLeft, Copy, CheckCircle2, FileDown, FileText, Upload, UserRound } from 'lucide-react';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { TranscriptSegments } from '../../transcription/components/TranscriptSegments';
import { StoredTranscriptions } from '../../transcription/components/StoredTranscriptions';
import { NotPersistedWarning } from '../../transcription/components/RoleProposals';
import { exportTranscriptToPdf, exportTranscriptToWord } from '../../transcription/transcriptExport';
import { buildSpeakerNames } from '../../transcription/speakerNames';
import { ROLE_LABELS, SUPPORTED_AUDIO_EXTENSIONS } from '../../transcription/types';
import { toPlainText } from '../../transcription/toPlainText';
import { ClientPicker } from './ClientPicker';
import { InterviewInsights } from './InterviewInsights';
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
  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <header className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
      <span className="w-5 h-5 rounded-full bg-blue-950 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {numero}
      </span>
      <h3 className="text-xs font-bold text-slate-900">{titulo}</h3>
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export const InterviewView: React.FC = () => {
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
    void transcribe(file);
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
  if (!isAvailable) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2 m-6">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-900">
          El motor de transcripción no está configurado en el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-4 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center shrink-0">
          <UserRound className="w-5 h-5 text-blue-200" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Entrevista de cliente</h2>
          <p className="text-[11px] text-slate-500">
            Graba la conversación, identifica quién habla y mira qué dice la jurisprudencia.
          </p>
        </div>
      </div>

      {!hasFirm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900">
            Sin una firma no se puede guardar la entrevista.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-800">{error}</p>
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
                <p className="text-xs font-bold text-slate-900">
                  {isUploading ? 'Enviando la grabación…' : 'Transcribiendo…'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Separando las voces y ordenando la conversación.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AudioRecorder onRecorded={empezar} disabled={!hasFirm} />

                {/*
                  Uploading stays, second. Not every interview happens at the
                  desk — a call recorded on a phone is still an interview — but
                  recording is the ordinary case and gets the ordinary place.
                */}
                <div className="text-center border-t border-slate-100 pt-3">
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
                    disabled={!hasFirm}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 mx-auto disabled:opacity-50"
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
                  <p className="text-[10px] text-slate-400 mt-1">
                    {SUPPORTED_AUDIO_EXTENSIONS.join(', ')} · máximo {megabytes(maxAudioBytes)} MB
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <b className="text-slate-700">Qué se guarda:</b> el texto queda guardado en tu firma
                  y puedes borrarlo cuando quieras.{' '}
                  <b className="text-slate-700">La grabación no se guarda</b>: se borra del
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
          <StoredTranscriptions
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
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
            <span className="text-[11px] text-slate-600">
              <b className="text-slate-900">{result.segments.length}</b> intervenciones ·{' '}
              <b className="text-slate-900">{result.speakerLabels.length}</b> voces
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void copiar()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              >
                {copiado ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiado ? 'Copiado' : 'Copiar texto'}</span>
              </button>

              <button
                onClick={() => void exportTranscriptToWord(result, titulo || 'entrevista')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>

              <button
                onClick={() => exportTranscriptToPdf(result, titulo || 'entrevista')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                onClick={reset}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Otra entrevista</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-2">Cliente de la entrevista</h3>
            <ClientPicker value={clientId} onChange={setClientId} />
          </div>

          {!persisted && <NotPersistedWarning />}

          {transcriptionId && <InterviewInsights transcriptionId={transcriptionId} />}

          <TranscriptSegments
            result={result}
            kind="ENTREVISTA"
            onAssignRole={assignRole}
            onEditSegment={canEdit ? editSegment : undefined}
            onSplitSegment={canEdit ? splitSegment : undefined}
            onReassignSpeaker={canEdit ? reassignSpeaker : undefined}
            onAssignSpeakerName={canEdit ? assignSpeakerName : undefined}
            voiceConflicts={voiceConflicts}
            nameProposals={nameProposals}
          />
        </>
      )}
      </div>
    </div>
  );
};
