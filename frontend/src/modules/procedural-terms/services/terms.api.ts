import { httpClient } from '../../../config/httpClient';

export interface TermsCalculationRequest {
  notifiedDate: string;
  termInDays: number;
  jurisdictionType: string;
}

interface TermsResponse<T> {
  success?: boolean;
  result?: T;
}

/**
 * Procedural deadline calculator (CGP / CPTSS business days).
 * Resolves to null on failure so the caller can fall back to its own estimate.
 */
export const termsApi = {
  async calculate<T>(body: TermsCalculationRequest): Promise<T | null> {
    try {
      const data = await httpClient.post<TermsResponse<T>>('/api/terms/calculate', { body });
      return data.success && data.result ? data.result : null;
    } catch {
      return null;
    }
  }
};
