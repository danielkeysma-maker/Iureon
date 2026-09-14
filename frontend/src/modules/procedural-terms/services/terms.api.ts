import { httpClient } from '../../../config/httpClient';

/** La clase de término. Sin campo, el servidor cuenta días hábiles. */
export type TermUnit = 'DIAS_HABILES' | 'DIAS_CALENDARIO' | 'MESES' | 'ANIOS';

export interface TermsCalculationRequest {
  notifiedDate: string;
  /** La cantidad: días, meses o años según `termUnit`. */
  termInDays: number;
  jurisdictionType: 'LABORAL' | 'CIVIL' | 'CONSTITUCIONAL' | 'PENAL';
  termUnit?: TermUnit;
}

type FilaDeDia = { date: string; reason: string };

export interface TermsCalculationResult {
  notifiedDate: string;
  startDate: string;
  dueDate: string;
  dueTime: string;
  /** Días hábiles contados; 0 cuando el término no se cuenta en días hábiles. */
  totalBusinessDays: number;
  excludedDays: FilaDeDia[];
  normativeReference: string;
  /** Official sources behind the calendar (Ley 51 de 1983, CGP art. 118). */
  fuentes?: Array<{ nombre: string; norma: string; url: string; consultadoEl: string }>;
  /*
   * Opcionales: un servidor anterior al selector no los manda, y entonces la
   * pantalla lee la respuesta como días hábiles, que es lo que ese servidor contó.
   */
  termUnit?: TermUnit;
  termAmount?: number;
  modeLabel?: string;
  countedNonBusinessDays?: FilaDeDia[];
  nominalDueDate?: string | null;
  extensionDays?: FilaDeDia[];
  dueOnNonBusinessDay?: string | null;
  notes?: string[];
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
