/**
 * Transcription domain types. Mirrors the backend contract in
 * backend/src/modules/transcription/types.ts.
 */

export type SpeakerRole =
  | 'JUEZ'
  | 'APODERADO_DEMANDANTE'
  | 'APODERADO_DEMANDADO'
  | 'TESTIGO'
  | 'PERITO'
  | 'FISCAL'
  | 'MINISTERIO_PUBLICO'
  | 'CLIENTE'
  | 'ABOGADO'
  | 'DESCONOCIDO';

export interface TranscriptSegment {
  speakerLabel: string;
  role: SpeakerRole;
  text: string;
  startSeconds: number | null;
  endSeconds: number | null;
}

export type TranscriptionKind = 'AUDIENCIA' | 'ENTREVISTA';

export interface TranscriptionResult {
  kind: TranscriptionKind;
  fullText: string;
  segments: TranscriptSegment[];
  speakerLabels: string[];
  language: string | null;
  durationSeconds: number | null;
  model: string;
  transcribedAt: string;
}

/** Labels a lawyer can assign to a diarized speaker, per kind of recording. */
export const ROLE_OPTIONS: Record<TranscriptionKind, SpeakerRole[]> = {
  AUDIENCIA: [
    'JUEZ',
    'APODERADO_DEMANDANTE',
    'APODERADO_DEMANDADO',
    'TESTIGO',
    'PERITO',
    'FISCAL',
    'MINISTERIO_PUBLICO',
    'DESCONOCIDO'
  ],
  ENTREVISTA: ['ABOGADO', 'CLIENTE', 'TESTIGO', 'DESCONOCIDO']
};

export const ROLE_LABELS: Record<SpeakerRole, string> = {
  JUEZ: 'Juez',
  APODERADO_DEMANDANTE: 'Apoderado demandante',
  APODERADO_DEMANDADO: 'Apoderado demandado',
  TESTIGO: 'Testigo',
  PERITO: 'Perito',
  FISCAL: 'Fiscal',
  MINISTERIO_PUBLICO: 'Ministerio Público',
  CLIENTE: 'Cliente',
  ABOGADO: 'Abogado',
  DESCONOCIDO: 'Sin identificar'
};

export const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
