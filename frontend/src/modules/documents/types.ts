/**
 * Document domain types.
 *
 * Kept apart from the viewer and modal components so any module can describe a
 * draft without importing React UI. The workspace, the export service and the
 * persistence layer all speak these shapes.
 */

/** A draft as produced by the three-engine pipeline. */
export interface GeneratedDraft {
  title: string;
  documentType: string;
  jurisprudenciaCitada: string[];
  excepcionesFormuladas: string[];
  legalText: string;
  tokensConsumed: number;
}

/** A draft persisted for a firm, either in Supabase or localStorage. */
export interface SavedDraftEntry {
  id: string;
  savedAt: string;
  draft: GeneratedDraft;
}
