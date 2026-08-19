import React, { useRef, useState } from 'react';
import { Mic, Upload, FileAudio, AlertTriangle, Cpu, Copy, CheckCircle2, RotateCcw } from 'lucide-react';
import { useTranscription } from '../hooks/useTranscription';
import { TranscriptSegments } from './TranscriptSegments';
import { AudioPreview } from './AudioPreview';
import { NotPersistedWarning, RoleProposals } from './RoleProposals';
import { buildSpeakerNames } from '../speakerNames';
import { ROLE_LABELS, SUPPORTED_AUDIO_EXTENSIONS, type SpeakerRole, type TranscriptSegment, type TranscriptionKind } from '../types';

interface TranscriptionViewProps {
  kind?: TranscriptionKind;
}

const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

/**
 * Plain text of the transcript, ready to paste into a filing.
 *
 * Prefixed by the disambiguated speaker name rather than the bare role. With
 * two apoderados or three witnesses the old form wrote "Testigo:" over and
 * over and the reader could not tell which one spoke — in a document that gets
 * quoted, that is not untidy, it is unusable.
 */
const toPlainText = (
  segments: TranscriptSegment[],
  names: Record<string, string>
): string =>
  segments.map((s) => `${names[s.speakerLabel] ?? s.speakerLabel}: ${s.text}`).join('\n\n');

/**
 * Hearing and interview transcription.
 *
 * The recording is uploaded, separated by speaker, and the lawyer assigns the
 * procedural role of each voice. Context (party names, court, radicado) is
 * offered up front because Colombian legal vocabulary is frequently
 * mis-transcribed without it.
 */
export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ kind = 'AUDIENCIA' }) => {
  const { hasFirm, isAvailable, isUploading, isTranscribing, result, error, roleProposals, persisted, maxAudioBytes, transcribe, assignRole, editSegment, splitSegment, reassignSpeaker, canEdit, reset } =
    useTranscription(kind);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /**
   * Which voices the lawyer has confirmed. A suggestion disappears once
   * accepted so the panel shows only what still needs a decision.
   */
  const [confirmed, setConfirmed] = useState<Record<string, SpeakerRole>>({});
  const [contextPrompt, setContextPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-5 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-white shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {kind === 'AUDIENCIA' ? 'Transcripción de Audiencias' : 'Transcripción de Entrevista'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Sube la grabación y obtén la transcripción separada por interlocutor.
            </p>
          </div>
        </div>

        {/*
          Two different problems, two different messages. One banner used to
          cover both, and it named the wrong one: with no firm registered the
          status request came back 401, the client read that as "unavailable",
          and the screen told the user to configure an API key that was already
          correct. Telling someone to fix the wrong thing costs more than saying
          nothing.
        */}
        {isAvailable === false && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              El motor de transcripción no está configurado en el servidor. Falta la variable
              <b className="font-mono"> DEEPGRAM_API_KEY</b>. Puedes preparar el envío, pero la
              transcripción fallará hasta que se configure.
            </span>
          </div>
        )}

        {isAvailable && !hasFirm && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              El motor de transcripción está listo, pero todavía no hay una firma registrada.
              La transcripción necesita una firma para guardarse: regístrala desde el menú lateral.
            </span>
          </div>
        )}

        {!result && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-900/60 rounded-xl p-6 flex flex-col items-center text-center bg-slate-50/60 transition-colors relative">
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                disabled={isTranscribing}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-900 mb-3 shadow-xs">
                <FileAudio className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 font-mono block text-xs">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                    {megabytes(selectedFile.size)} MB
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">
                    Arrastra la grabación aquí
                  </span>
                  <span className="text-[11px] text-slate-500">
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

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Contexto del caso (opcional, mejora la precisión):
              </label>
              <input
                type="text"
                value={contextPrompt}
                onChange={(e) => setContextPrompt(e.target.value)}
                placeholder="Ej. Juzgado 18 Laboral de Bogotá, demandante Mario Pérez, radicado 2026-00904"
                disabled={isTranscribing}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nombres de las partes, juzgado y radicado. Ayuda a que los términos jurídicos se
                transcriban bien.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => selectedFile && transcribe(selectedFile, contextPrompt)}
              disabled={!selectedFile || isTranscribing}
              className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
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
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="text-[11px] text-slate-600">
                <b className="text-slate-900">{result.segments.length}</b> intervenciones ·{' '}
                <b className="text-slate-900">{result.speakerLabels.length}</b> interlocutores
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
                </button>
                <button
                  onClick={handleStartOver}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Otra grabación</span>
                </button>
              </div>
            </div>

            {!persisted && <NotPersistedWarning />}

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

            <TranscriptSegments
              result={result}
              kind={kind}
              onAssignRole={assignRole}
              onEditSegment={canEdit ? editSegment : undefined}
              onSplitSegment={canEdit ? splitSegment : undefined}
              onReassignSpeaker={canEdit ? reassignSpeaker : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
};
