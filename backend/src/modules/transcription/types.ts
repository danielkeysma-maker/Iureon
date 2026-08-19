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
  /**
   * Largest upload this backend accepts, in bytes.
   *
   * It belongs to the adapter because it is a vendor fact, and treating it as a
   * domain constant cost real capability: a flat 25 MB ceiling — OpenAI's limit
   * — was rejecting two-hour hearings even after moving to a provider that
   * accepts 2 GB.
   */
  readonly maxAudioBytes: number;
  /** True when the provider has credentials and can actually be called. */
  isConfigured(): boolean;
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
  /**
   * Transcribes audio the provider fetches itself, from a URL we hand it.
   *
   * Declared optional because it is a real capability difference, not a detail:
   * Deepgram reads remote audio, OpenAI's endpoint does not. It matters because
   * the deployment target rejects request bodies over 4.5 MB, so a two-hour
   * hearing cannot travel through the API at all — the browser uploads it
   * straight to storage and only this path can reach it.
   */
  transcribeFromUrl?(url: string, request: RemoteTranscriptionRequest): Promise<TranscriptionResult>;
}

/** Everything a transcription needs except the audio itself. */
export interface RemoteTranscriptionRequest {
  kind: TranscriptionKind;
  contextPrompt?: string;
  language?: string;
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
 * Ceiling used when no provider is configured, so an upload can still be
 * rejected with a size message instead of a missing-credentials one.
 *
 * The real limit comes from the provider — see `maxAudioBytes` on the port.
 * This used to be THE limit, fixed at OpenAI's 25 MB, and it turned a vendor
 * constraint into a product one: a two-hour hearing is around 50 MB, so the
 * headline feature was unusable for the thing it was built for.
 */
export const FALLBACK_MAX_AUDIO_BYTES = 25 * 1024 * 1024;
