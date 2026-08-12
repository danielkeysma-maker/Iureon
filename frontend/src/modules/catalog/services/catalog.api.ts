import { httpClient } from '../../../config/httpClient';
import type {
  Actuacion,
  ActuacionRole,
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
  async resolve(firmId: string, documentType: string): Promise<Actuacion | null> {
    if (!documentType.trim()) return null;

    try {
      const data = await httpClient.get<ResolveResponse>(
        `/api/catalog/actuaciones/resolve?documentType=${encodeURIComponent(documentType)}`,
        { firmId }
      );

      return data.actuacion;
    } catch {
      return null;
    }
  },

  async list(
    firmId: string,
    filters: { branch?: LegalBranch; role?: ActuacionRole } = {}
  ): Promise<{ actuaciones: Actuacion[]; branches: LegalBranch[]; curation: CurationStatus }> {
    const params = new URLSearchParams();
    if (filters.branch) params.set('branch', filters.branch);
    if (filters.role) params.set('role', filters.role);

    const query = params.toString();
    const data = await httpClient.get<ListResponse>(
      `/api/catalog/actuaciones${query ? `?${query}` : ''}`,
      { firmId }
    );

    return { actuaciones: data.actuaciones, branches: data.branches, curation: data.curation };
  },

  /** Records the firm's verification. Throws with the API's message on rejection. */
  async saveVerification(firmId: string, input: VerificationInput): Promise<Actuacion | null> {
    const data = await httpClient.put<SaveResponse>('/api/catalog/verifications', {
      firmId,
      body: input
    });

    return data.actuacion;
  },

  /** Drops the firm's override so the shipped catalogue applies again. */
  async deleteVerification(firmId: string, actuacionId: string): Promise<void> {
    await httpClient.delete(
      `/api/catalog/verifications?actuacionId=${encodeURIComponent(actuacionId)}`,
      { firmId }
    );
  }
};
