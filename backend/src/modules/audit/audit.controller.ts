import { Request, Response } from 'express';
import { AuditService } from './audit.service';

const auditService = new AuditService();

export const getAuditLogsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    const logs = await auditService.getAuditLogs(firmId);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: 'AUDIT_LOGS_ERROR', message: error.message });
  }
};
