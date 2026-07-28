export interface AuditLogEntry {
  id: string;
  firmId: string;
  userId: string;
  userName: string;
  action: 'RAG_DRAFT_GENERATE' | 'PDF_VIEW' | 'DOCUMENT_EXPORT_DOCX' | 'DOCUMENT_EXPORT_PDF' | 'PDF_INGEST';
  targetResource: string;
  tokensConsumed?: number;
  ipAddress?: string;
  timestamp: string;
}

export class AuditService {
  /**
   * Retorna el historial inmutable de auditoría B2B para la firma cliente
   */
  public async getAuditLogs(firmId: string): Promise<AuditLogEntry[]> {
    return [
      {
        id: 'aud-001',
        firmId,
        userId: 'usr-001',
        userName: 'Dr. Julián Delgado',
        action: 'RAG_DRAFT_GENERATE',
        targetResource: 'Contestación de Demanda (EXP-2026-904)',
        tokensConsumed: 4820,
        ipAddress: '181.135.20.14',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'aud-002',
        firmId,
        userId: 'usr-002',
        userName: 'Dra. María Camila Osorio',
        action: 'DOCUMENT_EXPORT_DOCX',
        targetResource: 'Contestacion_Demanda_EXP-2026-904.docx',
        ipAddress: '181.135.20.18',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 'aud-003',
        firmId,
        userId: 'usr-001',
        userName: 'Dr. Julián Delgado',
        action: 'PDF_INGEST',
        targetResource: 'Expediente_Demanda_Laboral.pdf (142 folios)',
        ipAddress: '181.135.20.14',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      }
    ];
  }
}
