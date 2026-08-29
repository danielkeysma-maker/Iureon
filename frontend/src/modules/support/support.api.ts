import { httpClient } from '../../config/httpClient';

/**
 * Acceso de soporte, lado de la firma. Artboard 8a.
 *
 * El `firmId` no viaja en ninguna de estas llamadas, y su ausencia es la
 * garantía: el servidor lo lee del token. Si fuera un parámetro, el navegador
 * escogería a qué firma le concede la entrada.
 */

export type SupportAccessStatus = 'PENDING' | 'AUTHORIZED' | 'DENIED';

export interface SupportAccess {
  id: string;
  firmId: string;
  /** La cuenta de operación que pidió entrar. Un nombre, no «el sistema». */
  requestedBy: string;
  requestedAt: string;
  motive: string;
  scope: string;
  durationMinutes: number;
  status: SupportAccessStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
}

export interface SupportAccessView {
  id: string;
  resource: string;
  viewedAt: string;
}

export interface EstadoDeAcceso {
  activo: SupportAccess | null;
  minutosRestantes: number | null;
  pendiente: SupportAccess | null;
}

export interface EstadoConLecturas {
  estado: EstadoDeAcceso;
  lecturas: SupportAccessView[];
}

export const supportApi = {
  estado: (): Promise<EstadoConLecturas> =>
    httpClient
      .get<{ estado: EstadoDeAcceso; lecturas: SupportAccessView[] }>('/api/support-access')
      .then((r) => ({ estado: r.estado, lecturas: r.lecturas })),

  decidir: (accessId: string, autoriza: boolean): Promise<SupportAccess> =>
    httpClient
      .post<{ acceso: SupportAccess }>(`/api/support-access/${accessId}/decision`, { body: { autoriza } })
      .then((r) => r.acceso),

  revocar: (accessId: string): Promise<SupportAccess> =>
    httpClient
      .post<{ acceso: SupportAccess }>(`/api/support-access/${accessId}/revoke`, { body: {} })
      .then((r) => r.acceso)
};
