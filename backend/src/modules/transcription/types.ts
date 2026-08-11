/**
 * Transcription domain types.
 *
 * Deliberately provider-agnostic: the shapes here describe what a Colombian
 * hearing or client interview transcript needs, not what any one vendor
 * returns. Swapping provider means writing a new adapter, not touching these.
 */

/** Who is speaking. Diarization gives us labels; a human maps them to roles. */
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

/** One continuous utterance by a single speaker. */
export interface TranscriptSegment {
  /** Provider-assigned speaker label, e.g. "speaker_0". */
  speakerLabel: string;
  /** Procedural role, once a human has mapped the label. */
  role: SpeakerRole;
  text: string;
  /** Seconds from the start of the recording. */
  startSeconds: number | null;
  endSeconds: number | null;
}

export type TranscriptionKind = 'AUDIENCIA' | 'ENTREVISTA';

export interface TranscriptionResult {
  kind: TranscriptionKind;
  /** Full plain text, segments joined in order. */
  fullText: string;
  segments: TranscriptSegment[];
  /** Distinct speaker labels the provider detected. */
  speakerLabels: string[];
  language: string | null;
  durationSeconds: number | null;
  model: string;
  transcribedAt: string;
}

export interface TranscriptionRequest {
  kind: TranscriptionKind;
  audio: Buffer;
  fileName: string;
  mimeType: string;
  /**
   * Domain vocabulary that improves recognition — party names, the court, the
   * radicado. Colombian legal terms are frequently mis-transcribed without it.
   */
  contextPrompt?: string;
  /** Expected language code. Defaults to Spanish. */
  language?: string;
}

/**
 * A transcription backend. The service depends on this, never on a vendor SDK,
 * so replacing the provider is one new file and one line of wiring.
 */
export interface TranscriptionProvider {
  readonly name: string;
  /** True when the provider has credentials and can actually be called. */
  isConfigured(): boolean;
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

/** Audio formats the transcription API accepts. */
export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'm4a',
  'wav',
  'webm'
] as const;

/**
 * Hard limit imposed by the provider. A two-hour hearing exceeds this easily,
 * so long recordings must be split before upload; see the service for how that
 * is currently surfaced to the caller.
 */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
