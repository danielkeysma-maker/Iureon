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

export interface PedidoDeAuditoria {
  desde: number;
  limite: number;
  /** Inicio del periodo en ISO; null para todo el registro. */
  inicio: string | null;
}

export interface PaginaDeAuditoria {
  logs: AuditLogEntry[];
  /** Total de eventos del periodo; null si el servidor no lo pudo contar. */
  total: number | null;
  hayMas: boolean;
}

interface AuditLogsResponse {
  success?: boolean;
  logs?: AuditLogEntry[];
  total?: number | null;
  hayMas?: boolean;
  message?: string;
}

/**
 * FALLA HABLANDO. La versión anterior devolvía null «para que el llamador
 * conservara sus datos de muestra» — una auditoría con eventos de muestra es
 * una contradicción en los términos. Y hoy el servidor ya no responde `[]` al
 * fallar: responde 500, `httpClient` lanza, y la pantalla dice «no se pudo
 * leer» en vez de «no hay eventos».
 *
 * POR PÁGINAS. El servidor sirve una página con su total (`check:auditoria-
 * paginas`). Un servidor viejo, sin `total` ni `hayMas`, se lee como página
 * única sin total: la pantalla no inventa cuántos quedan.
 */
export const auditApi = {
  async listLogs(pedido: PedidoDeAuditoria): Promise<PaginaDeAuditoria> {
    const params = new URLSearchParams({ desde: String(pedido.desde), limite: String(pedido.limite) });
    if (pedido.inicio) params.set('inicio', pedido.inicio);
    const data = await httpClient.get<AuditLogsResponse>(`/api/audit/logs?${params.toString()}`, {});
    if (data.success && data.logs) {
      return {
        logs: data.logs,
        total: typeof data.total === 'number' ? data.total : null,
        hayMas: data.hayMas === true
      };
    }
    throw new Error(data.message ?? 'No se pudo leer la auditoría.');
  }
};
