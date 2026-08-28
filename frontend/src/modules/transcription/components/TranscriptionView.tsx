import React, { useEffect, useRef, useState } from 'react';
import { Upload, AlertTriangle, Copy, CheckCircle2, RotateCcw, FileText } from 'lucide-react';
import { useTranscription } from '../hooks/useTranscription';
import { TranscriptSegments } from './TranscriptSegments';
import { TranscriptSummary } from './TranscriptSummary';
import { AudioPreview } from './AudioPreview';
import { NotPersistedWarning, RoleProposals } from './RoleProposals';
import { AudienciasList } from './AudienciasList';
import { SubirAudienciaDialog } from './SubirAudienciaDialog';
import { transcriptionApi } from '../services/transcription.api';
import { exportTranscriptToPdf, exportTranscriptToWord } from '../transcriptExport';
import { buildSpeakerNames } from '../speakerNames';
import { toPlainText } from '../toPlainText';
import { ROLE_LABELS, type SpeakerRole, type TranscriptionKind } from '../types';

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
  const { hasFirm, isAvailable, isUploading, isTranscribing, result, error, roleProposals, persisted, maxAudioBytes, transcribe,
    marcarRevisada, assignRole, editSegment, splitSegment, reassignSpeaker, voiceConflicts, nameProposals, assignSpeakerName, stored, isLoadingStored, loadStored, openStored, deleteStored, canEdit, reset, transcriptionId } =
    useTranscription(kind);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /**
   * Which voices the lawyer has confirmed. A suggestion disappears once
   * accepted so the panel shows only what still needs a decision.
   */
  const [confirmed, setConfirmed] = useState<Record<string, SpeakerRole>>({});
  const [, setContextPrompt] = useState('');
  /*
   * Loaded on entry, because the whole point is that the lawyer does not have
   * to be told their hearings are stored — they see them.
   */
  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  const [copied, setCopied] = useState(false);
  const [subirAbierto, setSubirAbierto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * The name the export carries.
   *
   * The uploaded file while one is in hand, the stored title after reopening —
   * a transcript exported from the saved list must not be called "grabación".
   */
  const [openedTitle, setOpenedTitle] = useState('');
  const exportTitle = selectedFile?.name || openedTitle || 'transcripcion';


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
      hechosClave: fila?.resumen?.hechos
    };
  };

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

        {!result && (
          /*
            El primario del modulo: la audiencia es un archivo que LLEGA — el
            juzgado la publica y el abogado la trae — no un evento que se
            inicia. Por eso aqui se sube, y en Entrevistas se graba.
          */
          <button onClick={() => setSubirAbierto(true)} className="btn-primary btn-sm">
            <Upload className="h-3.5 w-3.5" />
            Subir audio
          </button>
        )}

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
                onClick={() => result && void exportTranscriptToWord(result, exportTitle, armarActa())}
                className="btn-secondary btn-sm rounded-r-none"
                title="El .docx es el que se edita para el acta"
              >
                <FileText className="h-3 w-3" />
                Word
              </button>
              <button
                onClick={() => result && exportTranscriptToPdf(result, exportTitle, armarActa())}
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

        <SubirAudienciaDialog
          abierto={subirAbierto}
          onCerrar={() => setSubirAbierto(false)}
          maxAudioBytes={maxAudioBytes}
          isUploading={isUploading}
          isTranscribing={isTranscribing}
          error={error}
          onTranscribir={(archivo, contexto) => {
            setSelectedFile(archivo);
            setContextPrompt(contexto);
            void transcribe(archivo, contexto).then(() => setSubirAbierto(false));
          }}
        />

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
              onMarcarRevisada={canEdit ? marcarRevisada : undefined}
              voiceConflicts={voiceConflicts}
              nameProposals={nameProposals}
              onAssignSpeakerName={canEdit ? assignSpeakerName : undefined}
            />
          </>
        )}
        </div>

        {/*
          EL REPRODUCTOR, ANCLADO ABAJO. No se mueve con el scroll: comprobar
          la palabra dudosa del minuto 44 exige oir y leer a la vez.
        */}
        {result && selectedFile && (
          <div className="sticky bottom-0 z-20 mx-auto max-w-4xl px-0 pb-2 pt-1">
            <AudioPreview file={selectedFile} anclado />
          </div>
        )}
      </div>
    </div>
  );
};
