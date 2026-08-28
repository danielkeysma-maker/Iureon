import { httpClient } from '../../../config/httpClient';
import type {
  Actuacion,
  ActuacionRole,
  CatalogMeta,
  CurationStatus,
  LegalBranch,
  VerificationInput
} from '../types';

interface ResolveResponse {
  success: boolean;
  curation: CurationStatus;
  actuacion: Actuacion | null;
}

interface ListResponse {
  success: boolean;
  curation: CurationStatus;
  branches: LegalBranch[];
  meta: CatalogMeta[];
  actuaciones: Actuacion[];
}

interface SaveResponse {
  success: boolean;
  actuacion: Actuacion | null;
}

/**
 * Catalogue access.
 *
 * Reads and writes are treated differently on purpose. A failed lookup is a
 * normal state — the panel simply does not appear, and guessing an actuación
 * would be worse than showing none. A failed write is not: the lawyer must
 * learn that the verification was not recorded, so it throws.
 */
export const catalogApi = {
  async resolve(documentType: string, branch?: string): Promise<Actuacion | null> {
    if (!documentType.trim()) return null;

    const params = new URLSearchParams({ documentType });
    if (branch) params.set('branch', branch);

    try {
      const data = await httpClient.get<ResolveResponse>(
        `/api/catalog/actuaciones/resolve?${params.toString()}`,
        {}
      );

      return data.actuacion;
    } catch {
      return null;
    }
  },

  async list(
    
    filters: { branch?: LegalBranch; role?: ActuacionRole } = {}
  ): Promise<{
    actuaciones: Actuacion[];
    branches: LegalBranch[];
    meta: CatalogMeta[];
    curation: CurationStatus;
  }> {
    const params = new URLSearchParams();
    if (filters.branch) params.set('branch', filters.branch);
    if (filters.role) params.set('role', filters.role);

    const query = params.toString();
    const data = await httpClient.get<ListResponse>(
      `/api/catalog/actuaciones${query ? `?${query}` : ''}`,
      {}
    );

    return {
      actuaciones: data.actuaciones,
      branches: data.branches,
      meta: data.meta ?? [],
      curation: data.curation
    };
  },

  /** Records the firm's verification. Throws with the API's message on rejection. */
  async saveVerification(input: VerificationInput): Promise<Actuacion | null> {
    const data = await httpClient.put<SaveResponse>('/api/catalog/verifications', {
      body: input
    });

    return data.actuacion;
  },

  /** Drops the firm's override so the shipped catalogue applies again. */
  async deleteVerification(actuacionId: string): Promise<void> {
    await httpClient.delete(
      `/api/catalog/verifications?actuacionId=${encodeURIComponent(actuacionId)}`,
      {}
    );
  }
};

/**
 * Orientacion desde unos hechos hacia las actuaciones que podrian aplicar.
 *
 * `descartadas` son los nombres que el modelo propuso y el catalogo no
 * reconocio. Se devuelven a proposito: si el motor empieza a inventar, esa
 * lista lo dice antes de que nadie lo note por otra via.
 */
export interface TriageSuggestion {
  actuacion: Actuacion;
  razon: string;
}

export interface TriageResponse {
  status: 'OK' | 'SIN_COINCIDENCIA' | 'NO_PROVIDER' | 'FAILED';
  reason?: string;
  suggestions: TriageSuggestion[];
  descartadas: string[];
  /** Lo que el catálogo leyó: rama dominante y elementos fácticos. Lectura del modelo. */
  senales?: { rama: string | null; elementos: string[] };
  /** Solo sin coincidencia: los datos que faltan y definirían la vía. */
  preguntas?: string[];
  /** Orientaciones gratuitas que le quedan hoy a la firma. */
  cupoRestante?: number;
  /** Lo que costó ESTA consulta. 0 mientras haya cupo gratuito. */
  cobradoCop?: number;
}

export const triageApi = {
  orientar: (hechos: string) =>
    httpClient.post<TriageResponse>('/api/catalog/triage', { body: { hechos } })
};
