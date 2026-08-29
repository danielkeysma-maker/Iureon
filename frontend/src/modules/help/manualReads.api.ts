import { httpClient } from '../../config/httpClient';

/**
 * Lo que esta persona ha marcado como leído del manual. Artboard 9a/9d.
 *
 * El correo y la firma NO viajan: salen del token en el servidor. Si fueran
 * parámetros, cualquiera podría marcar artículos a nombre de otro — y sobre esa
 * afirmación un socio decide permisos de curaduría.
 */
export interface LecturaDelManual {
  articleId: string;
  readAt: string;
}

export const manualReadsApi = {
  listar: (): Promise<LecturaDelManual[]> =>
    httpClient
      .get<{ lecturas: LecturaDelManual[] }>('/api/manual/lecturas')
      .then((r) => r.lecturas ?? []),

  marcar: (articleId: string, leido: boolean): Promise<void> =>
    httpClient
      .post<{ success: boolean }>('/api/manual/lecturas', { body: { articleId, leido } })
      .then(() => undefined)
};
