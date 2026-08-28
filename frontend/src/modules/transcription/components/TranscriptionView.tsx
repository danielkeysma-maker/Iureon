import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileAudio, AlertTriangle, Cpu, Copy, CheckCircle2, RotateCcw, FileText } from 'lucide-react';
import { useTranscription } from '../hooks/useTranscription';
import { TranscriptSegments } from './TranscriptSegments';
import { TranscriptSummary } from './TranscriptSummary';
import { AudioPreview } from './AudioPreview';
import { NotPersistedWarning, RoleProposals } from './RoleProposals';
import { AudienciasList } from './AudienciasList';
import { transcriptionApi } from '../services/transcription.api';
import { exportTranscriptToPdf, exportTranscriptToWord } from '../transcriptExport';
import { buildSpeakerNames } from '../speakerNames';
import { toPlainText } from '../toPlainText';
import {
  ROLE_LABELS,
  SUPPORTED_AUDIO_EXTENSIONS,
  type SpeakerRole,
  type TranscriptionKind
} from '../types';

interface TranscriptionViewProps {
  kind?: TranscriptionKind;
  /**
   * Lleva la transcripcion al panel de redaccion como hechos del caso.
   *
   * ES EL PRIMARIO DE ESTA PANTALLA, no exportar: lo que un juez dijo en
   * audiencia es exactamente el material del proximo escrito, y hasta ahora el
   * unico camino era copiar al portapapeles y pegar a mano.
   */
  onUsarEnRedaccion?: (texto: string) => void;
}

const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

/**
 * Hearing transcription.
 *
 * The recording is uploaded — a court publishes it and the lawyer downloads it
 * afterwards — separated by speaker, and the lawyer assigns the procedural role
 * of each voice. Context (party names, court, radicado) is offered up front
 * because Colombian legal vocabulary is frequently mis-transcribed without it.
 *
 * Client interviews are their own screen: see modules/clients/InterviewView.
 * They share this engine and nothing of the flow, because a hearing arrives as
 * a file and an interview happens in the room.
 */
export const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  kind = 'AUDIENCIA',
  onUsarEnRedaccion
}) => {
  const { hasFirm, isAvailable, isUploading, isTranscribing, result, error, roleProposals, persisted, maxAudioBytes, transcribe, assignRole, editSegment, splitSegment, reassignSpeaker, voiceConflicts, nameProposals, assignSpeakerName, stored, isLoadingStored, loadStored, openStored, deleteStored, canEdit, reset, transcriptionId } =
    useTranscription(kind);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /**
   * Which voices the lawyer has confirmed. A suggestion disappears once
   * accepted so the panel shows only what still needs a decision.
   */
  const [confirmed, setConfirmed] = useState<Record<string, SpeakerRole>>({});
  const [contextPrompt, setContextPrompt] = useState('');
  /*
   * Loaded on entry, because the whole point is that the lawyer does not have
   * to be told their hearings are stored — they see them.
   */
  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * The name the export carries.
   *
   * The uploaded file while one is in hand, the stored title after reopening —
   * a transcript exported from the saved list must not be called "grabación".
   */
  const [openedTitle, setOpenedTitle] = useState('');
  const exportTitle = selectedFile?.name || openedTitle || 'transcripcion';

  const handleCopy = async () => {
    if (!result) return;

    await navigator.clipboard.writeText(
      toPlainText(result.segments, buildSpeakerNames(result.segments, ROLE_LABELS))
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartOver = () => {
    reset();
    setSelectedFile(null);
    // Cleared too, or the next recording opens with the previous hearing's
    // confirmations already applied and its suggestions hidden.
    setConfirmed({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      <header className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line-200 bg-surface px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink-900">
            {kind === 'AUDIENCIA' ? 'Audiencias' : 'Entrevistas'}
          </h1>
          <p className="mt-0.5 text-meta text-ink-500">
            {result
              ? `${result.segments.length} intervenciones · ${result.speakerLabels.length} interlocutores`
              : 'La grabación, separada por interlocutor y con cada voz nombrada.'}
          </p>
        </div>

        {result && (
          <>
            <button onClick={handleCopy} className="btn-neutral btn-sm">
              {copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-verified" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </button>

            {/* Word y PDF unidos, como en el taller: un formato, no dos decisiones. */}
            <div className="flex">
              <button
                onClick={() => result && void exportTranscriptToWord(result, exportTitle)}
                className="btn-secondary btn-sm rounded-r-none"
                title="El .docx es el que se edita para el acta"
              >
                <FileText className="h-3 w-3" />
                Word
              </button>
              <button
                onClick={() => result && exportTranscriptToPdf(result, exportTitle)}
                className="btn-secondary btn-sm -ml-px rounded-l-none"
                title="El PDF es el que se anexa al expediente"
              >
                PDF
              </button>
            </div>

            <button onClick={handleStartOver} className="btn-neutral btn-sm">
              <RotateCcw className="h-3.5 w-3.5" />
              Otra grabación
            </button>

            {/*
              EL PRIMARIO: exportar no es el objetivo de esta pantalla. Lo que
              se dijo en audiencia es el material del proximo escrito.
            */}
            {onUsarEnRedaccion && (
              <button
                onClick={() =>
                  onUsarEnRedaccion(
                    toPlainText(result.segments, buildSpeakerNames(result.segments, ROLE_LABELS))
                  )
                }
                className="btn-primary btn-sm"
              >
                Usar en redacción
              </button>
            )}
          </>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-4xl space-y-4">

        {/*
          Two different problems, two different messages. One banner used to
          cover both, and it named the wrong one: with no firm registered the
          status request came back 401, the client read that as "unavailable",
          and the screen told the user to configure an API key that was already
          correct. Telling someone to fix the wrong thing costs more than saying
          nothing.
        */}
        {isAvailable === false && (
          <div className="p-3 bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card text-ink-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-unverified shrink-0 mt-0.5" />
            <span>
              El motor de transcripción no está configurado en el servidor. Falta la variable
              <b className="font-mono"> DEEPGRAM_API_KEY</b>. Puedes preparar el envío, pero la
              transcripción fallará hasta que se configure.
            </span>
          </div>
        )}

        {isAvailable && !hasFirm && (
          <div className="p-3 bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card text-ink-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-unverified shrink-0 mt-0.5" />
            <span>
              El motor de transcripción está listo, pero todavía no hay una firma registrada.
              La transcripción necesita una firma para guardarse: regístrala desde el menú lateral.
            </span>
          </div>
        )}

        {!result && (
          <AudienciasList
            items={stored}
            isLoading={isLoadingStored}
            onOpen={(item) => {
              setOpenedTitle(item.title);
              openStored(item);
            }}
            onDelete={deleteStored}
            onRefresh={() => void loadStored()}
            onMarcarRevision={(id, estado) => {
              void transcriptionApi.marcarRevision(id, estado).then(() => void loadStored());
            }}
          />
        )}

        {!result && (
          <div className="bg-surface border border-line-200 rounded-card p-5 space-y-4">
            <div className="border-2 border-dashed border-line-200 hover:border-brand-700 rounded-card p-6 flex flex-col items-center text-center bg-canvas transition-colors relative">
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                disabled={isTranscribing}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="w-12 h-12 rounded-card bg-surface border border-line-200 flex items-center justify-center text-brand-700 mb-3 shadow-e1">
                <FileAudio className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-1">
                  <span className="font-bold text-ink-900 font-mono block text-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-verified font-mono font-semibold">
                    {megabytes(selectedFile.size)} MB
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-ink-900 block text-xs">
                    Arrastra la grabación aquí
                  </span>
                  <span className="text-[11px] text-ink-500">
                    {/* From the server, because the ceiling is the configured
                        provider's. Typed as a literal "25 MB" here, it kept
                        announcing OpenAI's limit after the switch to Deepgram
                        raised it eightfold — telling lawyers to split hearings
                        the product could already accept whole. */}
                    {SUPPORTED_AUDIO_EXTENSIONS.join(', ')} · máximo {megabytes(maxAudioBytes)} MB
                  </span>
                </div>
              )}
            </div>

            {/*
              SAID BEFORE, NOT DISCOVERED AFTER.
              
              The transcript is stored the moment the provider answers, which is
              what keeps a two-hour hearing from being lost by closing a tab —
              but nothing said so, and a user found out only by being told
              weeks later. Retention of privileged material is not something to
              learn afterwards, and the sentence is here rather than in a
              settings page because this is the moment the material arrives.
            */}
            <p className="text-[11px] text-ink-500 bg-canvas border border-line-200 rounded-control p-2.5">
              <b className="text-ink-700">Qué se guarda:</b> el texto de la transcripción queda
              guardado en tu firma para que no lo pierdas al cerrar la pestaña, y puedes borrarlo
              cuando quieras desde la lista de arriba. <b className="text-ink-700">La grabación no
              se guarda</b>: se borra del almacenamiento apenas termina de transcribirse.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-ink-700 block mb-1">
                Contexto del caso (opcional, mejora la precisión):
              </label>
              <input
                type="text"
                value={contextPrompt}
                onChange={(e) => setContextPrompt(e.target.value)}
                placeholder="Ej. Juzgado 18 Laboral de Bogotá, demandante Mario Pérez, radicado 2026-00904"
                disabled={isTranscribing}
                className="w-full bg-canvas border border-line-200 rounded-control p-2 text-xs text-ink-900 focus:outline-none focus:border-brand-700"
              />
              <p className="text-[10px] text-ink-400 mt-1">
                Nombres de las partes, juzgado y radicado. Ayuda a que los términos jurídicos se
                transcriban bien.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[rgb(var(--danger)/0.06)] border border-[rgb(var(--danger)/0.35)] rounded-control text-danger text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => selectedFile && transcribe(selectedFile, contextPrompt)}
              disabled={!selectedFile || isTranscribing}
              className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-card text-xs flex items-center justify-center gap-2 transition-colors shadow-e1"
            >
              {/* Two phases, named separately: a two-hour hearing spends real
                  minutes travelling to storage before anything is transcribed,
                  and one label for both would look stalled. */}
              {isUploading ? (
                <>
                  <Upload className="w-4 h-4 animate-pulse" />
                  <span>Enviando la grabación...</span>
                </>
              ) : isTranscribing ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>Transcribiendo y separando interlocutores...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Transcribir grabación</span>
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <>
            {!persisted && <NotPersistedWarning />}


            {/*
              The mutation errors, IN the result view. The only other error
              display lives inside the upload panel, which unmounts the moment a
              transcript exists — so a failed correction, cut, move or role
              assignment set an error nobody could ever see. The edit stayed on
              screen looking saved while the server still had the old text: a
              silent lie in a legal transcript editor. Reported by review, not
              by a user, but reachable by any transient network failure.
            */}
            {error && (
              <div className="bg-[rgb(var(--danger)/0.06)] border border-[rgb(var(--danger)/0.35)] rounded-card p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-[11px] text-danger">
                  {error} La pantalla se devolvió a lo último que sí quedó guardado.
                </p>
              </div>
            )}

            <RoleProposals
              proposals={roleProposals}
              assigned={confirmed}
              onAccept={(speakerLabel, role) => {
                assignRole(speakerLabel, role);
                setConfirmed((current) => ({ ...current, [speakerLabel]: role }));
              }}
            />

            {/* The recording plays from the browser's own copy of the file, so
                a doubtful word can be checked against what was actually said —
                the audio itself is deleted from storage once transcribed. */}
            <AudioPreview file={selectedFile} />

            {/* Lo esencial sin releer dos horas: mismo componente que en Entrevistas. */}
            {transcriptionId && (
              <TranscriptSummary transcriptionId={transcriptionId} kind="AUDIENCIA" />
            )}

            <TranscriptSegments
              result={result}
              kind={kind}
              onAssignRole={assignRole}
              onEditSegment={canEdit ? editSegment : undefined}
              onSplitSegment={canEdit ? splitSegment : undefined}
              onReassignSpeaker={canEdit ? reassignSpeaker : undefined}
              voiceConflicts={voiceConflicts}
              nameProposals={nameProposals}
              onAssignSpeakerName={canEdit ? assignSpeakerName : undefined}
            />
          </>
        )}
        </div>
      </div>
    </div>
  );
};
