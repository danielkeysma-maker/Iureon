/**
 * Document domain types.
 *
 * Kept apart from the viewer and modal components so any module can describe a
 * draft without importing React UI. The workspace, the export service and the
 * persistence layer all speak these shapes.
 */

/** A draft as produced by the three-engine pipeline. */
/**
 * Contra qué ficha del catálogo se redactó el escrito.
 *
 * `null` cuando la actuación no está catalogada — que es una respuesta, no un
 * fallo: el motor lo dice y el visor lo dice, en vez de callar y dejar que el
 * escrito parezca respaldado.
 */
export interface ProcedenciaDelBorrador {
  actuacionId: string;
  exactName: string;
  legalBasis: string;
  sourceUrl: string | null;
  competentAuthority: string | null;
  termStatus: 'VERIFICADO' | 'NO_CADUCA' | 'NO_VERIFICADO';
  termDescription: string | null;
  curadaPorLaFirma: boolean;
  curadaPor: string | null;
  seccionesSinArticulo: number;
  seccionesTotales: number;
}

export interface GeneratedDraft {
  title: string;
  documentType: string;
  jurisprudenciaCitada: string[];
  excepcionesFormuladas: string[];
  legalText: string;
  tokensConsumed: number;
  /** Ausente en borradores guardados antes de que esto existiera. */
  procedencia?: ProcedenciaDelBorrador | null;
}

/** BORRADOR | REVISAR | LISTO | RADICADO. The same set the database checks. */
export type EstadoBorrador = 'BORRADOR' | 'REVISAR' | 'LISTO' | 'RADICADO';

/**
 * A draft persisted for a firm, either in Supabase or localStorage.
 *
 * EVERYTHING BELOW `draft` IS OPTIONAL, and that is not laziness. The offline
 * fallback writes to localStorage, where these columns do not exist; a draft
 * saved during a backend outage is still a valid draft. The list must render
 * one that only knows its title, so every consumer treats these as absent
 * rather than empty.
 */
export interface SavedDraftEntry {
  id: string;
  savedAt: string;
  draft: GeneratedDraft;

  /**
   * The DATE it expires, never the catalogue term.
   *
   * The term is prose — «Dentro de los diez (10) días siguientes a la
   * presentación» — and no date comes out of it without knowing when the clock
   * started. Only whoever runs the case knows that; computing it here would be
   * inventing a deadline.
   */
  venceEl?: string | null;
  legalBranch?: string | null;

  /** "Mosquera · Juzgado 12 Laboral" — how a lawyer recognises it among thirty. */
  cliente?: string | null;
  despacho?: string | null;
  radicado?: string | null;

  estado?: EstadoBorrador;
  /** Once set, the text can no longer change. The database enforces it. */
  radicadoEl?: string | null;
  version?: number;
  /** Who last saved it. Comes from the token, never from the client. */
  autor?: string | null;
}
