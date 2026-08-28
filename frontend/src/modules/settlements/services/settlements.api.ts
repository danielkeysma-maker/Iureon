import { httpClient } from '../../../config/httpClient';

export interface SettlementCalculationRequest {
  monthlySalary: number;
  startDate: string;
  endDate: string;
  terminationType: 'INJUSTA_CAUSA' | 'MUTUO_ACUERDO' | 'JUSTA_CAUSA';
}

export interface SettlementResult {
  daysWorked: number;
  severanceIndemnification: number;
  cesantias: number;
  interesesCesantias: number;
  primaServicios: number;
  vacaciones: number;
  totalSettlement: number;
  agenciasEnDerechoEstimadas: number;
}

interface SettlementResponse {
  success: boolean;
  result?: SettlementResult;
  message?: string;
}

/**
 * FALLA HABLANDO, nunca en silencio.
 *
 * Devolvía null «para que el llamador cayera a su propia estimación» — y esa
 * estimación era una liquidación de $44.441.250 escrita en el código, la misma
 * para cualquier salario y cualquier fecha, mostrada como cálculo hecho.
 * Cifras de dinero inventadas en una herramienta cuyo resultado termina en las
 * pretensiones de una demanda. Ahora un fallo del servidor es un error visible.
 */
export const settlementsApi = {
  async calculate(body: SettlementCalculationRequest): Promise<SettlementResult> {
    const data = await httpClient.post<SettlementResponse>('/api/settlements/calculate', { body });
    if (data.success && data.result) return data.result;
    throw new Error(data.message ?? 'No se pudo calcular la liquidación.');
  }
};
