import { httpClient } from '../../../config/httpClient';

/** Un evento, con la forma REAL que responde el servidor. */
export interface AuditLogEntry {
  id: string;
  firmId: string;
  userEmail: string;
  action: string;
  resource: string;
  ipAddress: string | null;
  timestamp: string;
}

interface AuditLogsResponse {
  success?: boolean;
  logs?: AuditLogEntry[];
  message?: string;
}

/**
 * FALLA HABLANDO. La versión anterior devolvía null «para que el llamador
 * conservara sus datos de muestra» — una auditoría con eventos de muestra es
 * una contradicción en los términos: la pantalla existe para demostrar qué
 * pasó, y mostraba cosas que no pasaron. El tipo tampoco coincidía con el
 * servidor (userName/tokensConsumed contra userEmail/resource), así que lo
 * único que podía mostrarse eran las muestras.
 */
export const auditApi = {
  async listLogs(): Promise<AuditLogEntry[]> {
    const data = await httpClient.get<AuditLogsResponse>('/api/audit/logs', {});
    if (data.success && data.logs) return data.logs;
    throw new Error(data.message ?? 'No se pudo leer la auditoría.');
  }
};
