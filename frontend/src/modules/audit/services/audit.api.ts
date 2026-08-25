import { httpClient } from '../../../config/httpClient';

export interface AuditLogEntry {
  id: string;
  userName: string;
  action: string;
  targetResource: string;
  tokensConsumed: number;
  [key: string]: unknown;
}

interface AuditLogsResponse {
  success?: boolean;
  logs?: AuditLogEntry[];
}

/**
 * Returns null when the API is unreachable or reports success:false, so the
 * caller keeps its local sample data rather than showing an empty audit trail.
 */
export const auditApi = {
  async listLogs(): Promise<AuditLogEntry[] | null> {
    try {
      const data = await httpClient.get<AuditLogsResponse>('/api/audit/logs', {});
      return data.success && data.logs ? data.logs : null;
    } catch {
      return null;
    }
  }
};
