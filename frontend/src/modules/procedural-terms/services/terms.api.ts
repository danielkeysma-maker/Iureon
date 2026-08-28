import { httpClient } from '../../../config/httpClient';

export interface TermsCalculationRequest {
  notifiedDate: string;
  termInDays: number;
  jurisdictionType: 'LABORAL' | 'CIVIL' | 'CONSTITUCIONAL';
}

export interface TermsCalculationResult {
  notifiedDate: string;
  startDate: string;
  dueDate: string;
  dueTime: string;
  totalBusinessDays: number;
  excludedDays: { date: string; reason: string }[];
  normativeReference: string;
}

interface TermsResponse {
  success: boolean;
  result?: TermsCalculationResult;
  message?: string;
}

/**
 * FALLA HABLANDO, nunca en silencio.
 *
 * Devolvía null «para que el llamador cayera a su propia estimación» — y el
 * llamador tenía una: una fecha de vencimiento ESCRITA EN EL CÓDIGO que se
 * mostraba como cálculo hecho. Un plazo inventado es la única cosa que este
 * producto no puede emitir. Ahora el error se lanza con el mensaje del
 * servidor, que dice exactamente por qué no hay fecha — por ejemplo, que el
 * término pisa un periodo cuyo calendario de festivos no está cargado.
 */
export const termsApi = {
  async calculate(body: TermsCalculationRequest): Promise<TermsCalculationResult> {
    const data = await httpClient.post<TermsResponse>('/api/terms/calculate', { body });
    if (data.success && data.result) return data.result;
    throw new Error(data.message ?? 'No se pudo calcular el término.');
  }
};
