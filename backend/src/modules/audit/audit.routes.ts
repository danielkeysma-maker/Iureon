import { Router } from 'express';
import { getAuditLogsController } from './audit.controller';

const router = Router();

router.get('/audit/logs', getAuditLogsController);

export const auditRoutes = router;
