import { supabase } from '../../config/supabase.config';
import type { CatalogVerification, CatalogVerificationInput, TermStatus } from './types';

/**
 * Persistence for firm-curated catalogue entries.
 *
 * Reads distinguish three outcomes on purpose. "No hay verificaciones" and "no
 * pude leerlas" are not the same fact: if a firm retracted a shipped term as
 * wrong and that retraction fails to load, silently showing the shipped term
 * again would hand a lawyer a deadline the firm already rejected. The caller
 * therefore learns whether the curation layer was actually consulted.
 */

interface VerificationRow {
  actuacion_id: string;
  term_status: TermStatus;
  term_description: string | null;
  legal_basis: string | null;
  source_url: string | null;
  note: string | null;
  verified_by: string;
  verified_at: string;
}

export type VerificationLoad =
  | { status: 'OK'; verifications: CatalogVerification[] }
  /** Supabase is not wired up (local development). There is nothing to load. */
  | { status: 'NOT_CONFIGURED'; verifications: CatalogVerification[] }
  /** Configured but unreachable. The catalogue shown may be stale. */
  | { status: 'UNAVAILABLE'; verifications: CatalogVerification[]; reason: string }
  /**
   * No firm selected yet. The shipped catalogue still applies — it is product
   * knowledge, identical for everyone — but no firm curation is overlaid.
   */
  | { status: 'NO_TENANT'; verifications: CatalogVerification[] };

/** Raised when a write cannot be persisted. Never swallowed: losing a
 *  verification silently would leave the lawyer believing it was recorded. */
export class VerificationStoreError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'VerificationStoreError';
  }
}

const toDomain = (row: VerificationRow): CatalogVerification => ({
  actuacionId: row.actuacion_id,
  term: {
    status: row.term_status,
    description: row.term_status === 'NO_VERIFICADO' ? null : row.term_description
  },
  legalBasis: row.legal_basis,
  sourceUrl: row.source_url,
  note: row.note,
  verifiedBy: row.verified_by,
  verifiedAt: row.verified_at
});

export class VerificationStore {
  async listForFirm(firmId: string): Promise<VerificationLoad> {
    if (!supabase) {
      return { status: 'NOT_CONFIGURED', verifications: [] };
    }

    const { data, error } = await supabase
      .from('catalog_verifications')
      .select('*')
      .eq('firm_id', firmId);

    if (error) {
      console.error('[CATALOG] No se pudieron leer las verificaciones de la firma:', error.message);
      return { status: 'UNAVAILABLE', verifications: [], reason: error.message };
    }

    return { status: 'OK', verifications: (data ?? []).map((row) => toDomain(row as VerificationRow)) };
  }

  /** Inserts or replaces this firm's curation of one actuación. */
  async save(firmId: string, input: CatalogVerificationInput): Promise<CatalogVerification> {
    if (!supabase) {
      throw new VerificationStoreError(
        'La curaduría del catálogo requiere Supabase configurado; sin él la verificación no quedaría guardada.',
        'STORE_NOT_CONFIGURED'
      );
    }

    const { data, error } = await supabase
      .from('catalog_verifications')
      .upsert(
        {
          firm_id: firmId,
          actuacion_id: input.actuacionId,
          term_status: input.termStatus,
          term_description: input.termDescription ?? null,
          legal_basis: input.legalBasis ?? null,
          source_url: input.sourceUrl ?? null,
          note: input.note ?? null,
          verified_by: input.verifiedBy,
          verified_at: new Date().toISOString()
        },
        { onConflict: 'firm_id,actuacion_id' }
      )
      .select()
      .single();

    if (error || !data) {
      throw new VerificationStoreError(
        error?.message ?? 'La verificación no pudo guardarse.',
        'STORE_WRITE_FAILED'
      );
    }

    return toDomain(data as VerificationRow);
  }

  /** Drops the firm's curation so the shipped catalogue applies again. */
  async remove(firmId: string, actuacionId: string): Promise<void> {
    if (!supabase) {
      throw new VerificationStoreError(
        'La curaduría del catálogo requiere Supabase configurado.',
        'STORE_NOT_CONFIGURED'
      );
    }

    const { error } = await supabase
      .from('catalog_verifications')
      .delete()
      .eq('firm_id', firmId)
      .eq('actuacion_id', actuacionId);

    if (error) {
      throw new VerificationStoreError(error.message, 'STORE_DELETE_FAILED');
    }
  }
}

export const verificationStore = new VerificationStore();
