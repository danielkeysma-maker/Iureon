/**
 * Transcription domain types. Mirrors the backend contract in
 * backend/src/modules/transcription/types.ts.
 */

export type SpeakerRole =
  | 'JUEZ'
  | 'SECRETARIO'
  | 'FISCAL'
  | 'MINISTERIO_PUBLICO'
  | 'DEFENSOR_PUEBLO'
  | 'DEFENSOR'
  | 'PROCESADO'
  | 'VICTIMA'
  | 'REPRESENTANTE_VICTIMAS'
  | 'APODERADO_DEMANDANTE'
  | 'APODERADO_DEMANDADO'
  | 'DEMANDANTE'
  | 'DEMANDADO'
  | 'TESTIGO'
  | 'PERITO'
  | 'INTERPRETE'
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
/**
 * What the lawyer can pick, per kind of recording.
 *
 * A hearing is not two lawyers and a judge. The bench has a secretary; the
 * State appears as Fiscalía, Ministerio Público or Defensoría del Pueblo; a
 * criminal matter has a defensor and the person being prosecuted; victims speak
 * and so do their representatives; and in civil, labour or administrative
 * matters the PARTY is a different voice from their apoderado — an interrogatorio
 * de parte is the demandante speaking, not their lawyer.
 *
 * Ordered as a hearing is populated rather than alphabetically, so the eye
 * finds the bench first and the evidence last.
 */
export const ROLE_OPTIONS: Record<TranscriptionKind, SpeakerRole[]> = {
  AUDIENCIA: [
    'JUEZ',
    'SECRETARIO',
    'FISCAL',
    'MINISTERIO_PUBLICO',
    'DEFENSOR_PUEBLO',
    'DEFENSOR',
    'PROCESADO',
    'VICTIMA',
    'REPRESENTANTE_VICTIMAS',
    'APODERADO_DEMANDANTE',
    'APODERADO_DEMANDADO',
    'DEMANDANTE',
    'DEMANDADO',
    'TESTIGO',
    'PERITO',
    'INTERPRETE',
    'DESCONOCIDO'
  ],
  ENTREVISTA: ['ABOGADO', 'CLIENTE', 'TESTIGO', 'INTERPRETE', 'DESCONOCIDO']
};

export const ROLE_LABELS: Record<SpeakerRole, string> = {
  JUEZ: 'Juez',
  SECRETARIO: 'Secretario',
  FISCAL: 'Fiscal',
  MINISTERIO_PUBLICO: 'Ministerio Público',
  DEFENSOR_PUEBLO: 'Defensor del Pueblo',
  DEFENSOR: 'Defensor',
  PROCESADO: 'Procesado',
  VICTIMA: 'Víctima',
  REPRESENTANTE_VICTIMAS: 'Representante de víctimas',
  APODERADO_DEMANDANTE: 'Apoderado demandante',
  APODERADO_DEMANDADO: 'Apoderado demandado',
  DEMANDANTE: 'Demandante',
  DEMANDADO: 'Demandado',
  TESTIGO: 'Testigo',
  PERITO: 'Perito',
  INTERPRETE: 'Intérprete',
  CLIENTE: 'Cliente',
  ABOGADO: 'Abogado',
  DESCONOCIDO: 'Sin identificar'
};

export const SUPPORTED_AUDIO_EXTENSIONS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];

/**
 * Used only until the server reports the real ceiling, which belongs to the
 * configured provider — 25 MB on OpenAI, 200 on Deepgram. This was THE limit
 * once, hardcoded in the browser, and after switching provider it would have
 * refused a two-hour hearing the backend was willing to take.
 */
export const FALLBACK_MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/**
 * A role the app proposes for an anonymous voice, and the phrase behind it.
 *
 * Kept apart from `TranscriptSegment.role` on purpose: that field is what a
 * human decided, this one is what the app inferred from procedural formulas in
 * the transcript. Merging them would make a guess indistinguishable from a
 * confirmation, which is the whole failure this design avoids.
 */
export interface RoleEvidence {
  /** The transcribed phrase that triggered the proposal. */
  phrase: string;
  /** Second in the recording where it was said, when known. */
  atSeconds: number | null;
}

export interface RoleProposal {
  speakerLabel: string;
  proposedRole: SpeakerRole;
  /** Markers found. Zero means nothing was proposed, not that nothing matched. */
  matches: number;
  evidence: RoleEvidence[];
}
