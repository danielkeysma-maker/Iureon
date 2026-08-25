import { httpClient } from '../../../config/httpClient';

export interface SettlementCalculationRequest {
  monthlySalary: number;
  startDate: string;
  endDate: string;
  terminationType: string;
}

interface SettlementResponse<T> {
  success?: boolean;
  result?: T;
}

/**
 * Labour settlement calculator (CST). Resolves to null on failure so the
 * caller can fall back to its own estimate.
 */
export const settlementsApi = {
  async calculate<T>(body: SettlementCalculationRequest): Promise<T | null> {
    try {
      const data = await httpClient.post<SettlementResponse<T>>('/api/settlement/calculate', {
        body
      });
      return data.success && data.result ? data.result : null;
    } catch {
      return null;
    }
  }
};
