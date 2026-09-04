import { httpClient } from '../../../config/httpClient';
import type {
  CalendarioAnual,
  CuantiaRequest,
  CuantiaResult,
  IndexacionRequest,
  IndexacionResult,
  InteresesRequest,
  InteresesResult,
  ParametrosHerramientas
} from '../types';

interface Respuesta<T> {
  success: boolean;
  result?: T;
  message?: string;
}

/**
 * FAILS OUT LOUD. Same rule as the terms and settlement clients: a computation
 * the server refuses (unknown SMLMV year, no IBC entered, date out of range)
 * surfaces its Spanish reason; nothing here ever substitutes a figure.
 */
const desempacar = <T>(data: Respuesta<T>, fallo: string): T => {
  if (data.success && data.result) return data.result;
  throw new Error(data.message ?? fallo);
};

export const toolsApi = {
  async parametros(): Promise<ParametrosHerramientas> {
    return desempacar(
      await httpClient.get<Respuesta<ParametrosHerramientas>>('/api/tools/parametros'),
      'No se pudieron leer los parámetros de las herramientas.'
    );
  },

  async indexacion(body: IndexacionRequest): Promise<IndexacionResult> {
    return desempacar(
      await httpClient.post<Respuesta<IndexacionResult>>('/api/tools/indexacion', { body }),
      'No se pudo indexar el valor.'
    );
  },

  async intereses(body: InteresesRequest): Promise<InteresesResult> {
    return desempacar(
      await httpClient.post<Respuesta<InteresesResult>>('/api/tools/intereses', { body }),
      'No se pudieron liquidar los intereses.'
    );
  },

  async cuantia(body: CuantiaRequest): Promise<CuantiaResult> {
    return desempacar(
      await httpClient.post<Respuesta<CuantiaResult>>('/api/tools/cuantia', { body }),
      'No se pudo determinar la cuantía.'
    );
  },

  async calendario(anio: number, semanaSantaCompleta: boolean): Promise<CalendarioAnual> {
    // The server defaults to discounting Semana Santa; only the opt-out travels.
    const query = `anio=${anio}${semanaSantaCompleta ? '' : '&semanaSanta=0'}`;
    return desempacar(
      await httpClient.get<Respuesta<CalendarioAnual>>(`/api/tools/calendario?${query}`),
      'No se pudo construir el calendario.'
    );
  }
};
