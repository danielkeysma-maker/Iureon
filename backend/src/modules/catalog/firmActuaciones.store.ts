import { supabase } from '../../config/supabase.config';
import type { ActuacionRole, FirmActuacion, LegalBranch, TermStatus } from './types';

/**
 * Persistencia de las actuaciones que la firma añadió por su cuenta.
 *
 * LEER DISTINGUE TRES DESENLACES, igual que `verification.store`. «No tiene
 * ninguna» y «no pude leerlas» no son el mismo hecho: si una firma añadió su
 * actuación y la lectura falla en silencio, el desplegable vuelve a no
 * ofrecerla y el abogado concluye que se perdió. El llamador se entera de si
 * la capa se consultó de verdad.
 *
 * LOS ERRORES DE ESCRITURA NO SE TRAGAN NUNCA: perder una actuación en
 * silencio dejaría al abogado creyendo que quedó guardada, y la buscaría en la
 * lista de la rama para siempre.
 */

interface FirmActuacionRow {
  id: string;
  area: string;
  exact_name: string;
  role: ActuacionRole;
  term_status: TermStatus;
  legal_basis: string | null;
  term_description: string | null;
  source_url: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
}

export type FirmActuacionesLoad =
  | { status: 'OK'; actuaciones: FirmActuacion[] }
  /** Supabase no está configurado (desarrollo local). No hay nada que leer. */
  | { status: 'NOT_CONFIGURED'; actuaciones: FirmActuacion[] }
  /** Configurado y no alcanzable. La lista mostrada puede estar incompleta. */
  | { status: 'UNAVAILABLE'; actuaciones: FirmActuacion[]; reason: string }
  /** Sin firma todavía: no hay actuaciones propias que superponer. */
  | { status: 'NO_TENANT'; actuaciones: FirmActuacion[] };

export class FirmActuacionStoreError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = 'FirmActuacionStoreError';
  }
}

const toDomain = (row: FirmActuacionRow): FirmActuacion => ({
  id: row.id,
  area: row.area as LegalBranch,
  exactName: row.exact_name,
  role: row.role,
  termStatus: row.term_status,
  legalBasis: row.legal_basis,
  /*
   * El término solo viaja acompañado de su fuente. La base ya lo impone con
   * `chk_firm_actuacion_unverified_has_no_term`, y se repite al leer porque una
   * fila escrita antes de esa restricción —o por otra vía— no debe poder
   * publicar un plazo huérfano.
   */
  termDescription: row.term_status === 'NO_VERIFICADO' || !row.source_url ? null : row.term_description,
  sourceUrl: row.source_url,
  note: row.note,
  createdBy: row.created_by,
  createdAt: row.created_at
});

const COLUMNS = 'id, area, exact_name, role, term_status, legal_basis, term_description, source_url, note, created_by, created_at';

export class FirmActuacionStore {
  async listForFirm(firmId: string): Promise<FirmActuacionesLoad> {
    if (!supabase) return { status: 'NOT_CONFIGURED', actuaciones: [] };

    const { data, error } = await supabase
      .from('firm_actuaciones')
      .select(COLUMNS)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[CATALOG] No se pudieron leer las actuaciones de la firma:', error.message);
      return { status: 'UNAVAILABLE', actuaciones: [], reason: error.message };
    }

    return {
      status: 'OK',
      actuaciones: (data ?? []).map((row) => toDomain(row as unknown as FirmActuacionRow))
    };
  }

  async create(
    firmId: string,
    actuacion: Omit<FirmActuacion, 'createdAt'>
  ): Promise<FirmActuacion> {
    if (!supabase) {
      throw new FirmActuacionStoreError(
        'Añadir una actuación propia requiere Supabase configurado; sin él no quedaría guardada.',
        'STORE_NOT_CONFIGURED'
      );
    }

    const { data, error } = await supabase
      .from('firm_actuaciones')
      .insert({
        firm_id: firmId,
        id: actuacion.id,
        area: actuacion.area,
        exact_name: actuacion.exactName,
        role: actuacion.role,
        term_status: actuacion.termStatus,
        legal_basis: actuacion.legalBasis,
        term_description: actuacion.termDescription,
        source_url: actuacion.sourceUrl,
        note: actuacion.note,
        created_by: actuacion.createdBy
      })
      .select(COLUMNS)
      .single();

    if (error || !data) {
      /*
       * 23505 es el índice único de (firma, rama, nombre). Se traduce aquí en
       * vez de dejar salir el mensaje de Postgres: el abogado tiene que leer
       * qué hizo mal, no el nombre de un índice.
       */
      const duplicada = (error as { code?: string } | null)?.code === '23505';
      throw new FirmActuacionStoreError(
        duplicada
          ? 'Su firma ya tiene una actuación con ese nombre en esta rama.'
          : error?.message ?? 'La actuación no pudo guardarse.',
        duplicada ? 'DUPLICATE_NAME' : 'STORE_WRITE_FAILED'
      );
    }

    return toDomain(data as unknown as FirmActuacionRow);
  }

  /**
   * Escribe la curaduría de una actuación propia: norma, término y fuente.
   *
   * Es el mismo acto que curar una ficha de fábrica, sobre otra tabla, porque
   * `catalog_verifications` exige un `actuacion_id` publicado y esta no lo es.
   */
  async curate(
    firmId: string,
    id: string,
    campos: {
      termStatus: TermStatus;
      legalBasis: string | null;
      termDescription: string | null;
      sourceUrl: string | null;
      note: string | null;
    }
  ): Promise<FirmActuacion | null> {
    if (!supabase) {
      throw new FirmActuacionStoreError(
        'La curaduría requiere Supabase configurado.',
        'STORE_NOT_CONFIGURED'
      );
    }

    const { data, error } = await supabase
      .from('firm_actuaciones')
      .update({
        term_status: campos.termStatus,
        legal_basis: campos.legalBasis,
        term_description: campos.termDescription,
        source_url: campos.sourceUrl,
        note: campos.note
      })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select(COLUMNS)
      .maybeSingle();

    if (error) {
      throw new FirmActuacionStoreError(error.message, 'STORE_WRITE_FAILED');
    }

    return data ? toDomain(data as unknown as FirmActuacionRow) : null;
  }

  async remove(firmId: string, id: string): Promise<void> {
    if (!supabase) {
      throw new FirmActuacionStoreError(
        'Borrar una actuación propia requiere Supabase configurado.',
        'STORE_NOT_CONFIGURED'
      );
    }

    const { error } = await supabase
      .from('firm_actuaciones')
      .delete()
      .eq('firm_id', firmId)
      .eq('id', id);

    if (error) throw new FirmActuacionStoreError(error.message, 'STORE_DELETE_FAILED');
  }
}

export const firmActuacionStore = new FirmActuacionStore();
