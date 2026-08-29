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
  | 'INDICIADO'
  | 'IMPUTADO'
  | 'ACUSADO'
  | 'PROCESADO'
  | 'CONDENADO'
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
  /** Who this voice is, once a human has said so. Absent until then. */
  speakerName?: string;
  /** Un humano leyó esta intervención. La fracción revisadas/total hace el acta. */
  revisada?: boolean;
  /**
   * Confianza del proveedor, de 0 a 1. Ausente NO es «poco clara»: es «no se
   * midió» — los transcritos anteriores a esta columna no la traen, y
   * advertirlos sería inventarles un problema.
   */
  confianza?: number;
  /**
   * Un humano marcó esta intervención como decisiva. Artboard 2a.
   *
   * Distinta de `revisada`, y la diferencia importa: revisada dice «la leí y
   * está bien transcrita»; hecho clave dice «esto decide el caso». Se puede
   * revisar una frase intrascendente y marcar como clave una que todavía haya
   * que corregir.
   */
  hechoClave?: boolean;
  /**
   * Los trozos que el proveedor oyó mal, por posición en el texto. 1g pide
   * marcar SOLO el fragmento afectado: colorear la intervención entera manda a
   * releer trescientas palabras para encontrar las cuatro dudosas.
   */
  fragmentosDudosos?: { desde: number; hasta: number; confianza: number }[];
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
    'INDICIADO',
    'IMPUTADO',
    'ACUSADO',
    'PROCESADO',
    'CONDENADO',
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
  INDICIADO: 'Indiciado',
  IMPUTADO: 'Imputado',
  ACUSADO: 'Acusado',
  PROCESADO: 'Procesado',
  CONDENADO: 'Condenado',
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

/**
 * One diarization label that introduced itself as two different people.
 *
 * The acoustic engine merges voices it cannot tell apart, and a Colombian
 * hearing makes everyone identify themselves on the record — so the text
 * betrays the merge even when the audio hides it. Warned, never auto-fixed:
 * the lawyer moves the intervention, or decides a name was just misheard.
 */
/**
 * The name a voice gave for itself, proposed from the transcript.
 *
 * Never applied on its own: a name invented by the app would be a fabricated
 * attribution in a document meant to be quoted in court.
 */
export interface SpeakerNameProposal {
  speakerLabel: string;
  name: string;
  phrase: string;
  atSeconds: number | null;
}

export interface VoiceIdentity {
  name: string;
  phrase: string;
  atSeconds: number | null;
  segmentIndex: number;
}

export interface VoiceConflict {
  speakerLabel: string;
  identities: VoiceIdentity[];
}

export interface RoleProposal {
  speakerLabel: string;
  proposedRole: SpeakerRole;
  /** Markers found. Zero means nothing was proposed, not that nothing matched. */
  matches: number;
  evidence: RoleEvidence[];
}

/**
 * Quien narra los hechos en una entrevista.
 *
 * Una entrevista es en su mayoría el abogado: saludos, preguntas, explicaciones
 * de procedimiento. Los HECHOS están en lo que cuenta la persona, y separarlos
 * es lo que permite llevarlos a la redacción sin arrastrar el interrogatorio.
 *
 * El backend tiene esta misma lista para sugerir jurisprudencia. Son dos
 * copias y lo son a propósito: la de allá decide qué se busca en el corpus, la
 * de acá qué se le muestra al abogado para llevarse. Si un día divergen, lo
 * peor que pasa es que una pantalla ofrezca un rol que la otra no busca — no
 * que algo se afirme sin comprobar.
 */
export const ROLES_DEL_RELATO: ReadonlySet<string> = new Set([
  'CLIENTE',
  'DEMANDANTE',
  'DEMANDADO',
  'VICTIMA',
  'TESTIGO'
]);
