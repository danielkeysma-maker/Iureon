/**
 * Transcription domain types.
 *
 * Deliberately provider-agnostic: the shapes here describe what a Colombian
 * hearing or client interview transcript needs, not what any one vendor
 * returns. Swapping provider means writing a new adapter, not touching these.
 */

/** Who is speaking. Diarization gives us labels; a human maps them to roles. */
export type SpeakerRole =
  // El estrado
  | 'JUEZ'
  | 'SECRETARIO'
  // Parte acusadora y control estatal
  | 'FISCAL'
  | 'MINISTERIO_PUBLICO'
  | 'DEFENSOR_PUEBLO'
  // Defensa penal y la persona procesada
  | 'DEFENSOR'
  | 'INDICIADO'
  | 'IMPUTADO'
  | 'ACUSADO'
  | 'PROCESADO'
  | 'CONDENADO'
  // Víctimas
  | 'VICTIMA'
  | 'REPRESENTANTE_VICTIMAS'
  // Proceso civil, laboral y administrativo: el apoderado y la parte NO son la
  // misma voz. En un interrogatorio de parte declara el demandante, no su
  // abogado, y el transcrito tiene que poder distinguirlos.
  | 'APODERADO_DEMANDANTE'
  | 'APODERADO_DEMANDADO'
  | 'DEMANDANTE'
  | 'DEMANDADO'
  // Prueba
  | 'TESTIGO'
  | 'PERITO'
  | 'INTERPRETE'
  // Entrevista de cliente
  | 'CLIENTE'
  | 'ABOGADO'
  | 'DESCONOCIDO';

/** One continuous utterance by a single speaker. */
export interface TranscriptSegment {
  /** Provider-assigned speaker label, e.g. "speaker_0". */
  speakerLabel: string;
  /** Procedural role, once a human has mapped the label. */
  role: SpeakerRole;
  /**
   * Who this voice is, by name.
   *
   * Optional because a hearing does not always put it on the record, and a name
   * this app invented would be worse than none. Carried per segment rather than
   * in a column of its own so it follows exactly the path `role` already
   * follows — set for every segment of a label at once, and needing no schema
   * change to exist.
   */
  speakerName?: string;
  /*
   * Un humano leyo ESTA intervencion. Vive en el segmento y no en una columna:
   * es atributo de la intervencion y viaja con ella al editarla o cortarla.
   * La fraccion revisadas/total es lo que separa una transcripcion de un acta.
   */
  revisada?: boolean;
  /**
   * Que tan seguro estuvo el proveedor de lo que oyo, de 0 a 1.
   *
   * 1g pide marcar los «fragmentos con audio poco claro» y poner
   * `[ininteligible 13:09]` donde no se entendio. Ese dato NO habia que
   * inventarlo: Deepgram lo devuelve por intervencion y aqui se descartaba —
   * ni siquiera estaba declarado en el tipo de su respuesta.
   *
   * Importa mas que en una transcripcion cualquiera: una audiencia se CITA en
   * un escrito, y citar mal lo que dijo un juez es un problema del abogado, no
   * del proveedor. Marcar donde el microfono fallo es decirle exactamente que
   * volver a escuchar.
   *
   * Opcional porque los transcritos anteriores no la traen. Ausente NO es
   * «poco clara»: es «no se midio».
   */
  confianza?: number;
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
