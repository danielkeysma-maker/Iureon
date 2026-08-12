import { httpClient } from '../../../config/httpClient';
import type { Actuacion } from '../types';

interface ResolveResponse {
  success: boolean;
  actuacion: Actuacion | null;
}

/**
 * Catalogue lookup.
 *
 * Resolves to null both when nothing matches and when the request fails: an
 * uncatalogued document type is a normal state, and the panel simply does not
 * appear. Never guess an actuación — showing the wrong deadline is worse than
 * showing none.
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
  }
};
