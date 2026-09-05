import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import { ingestDocumentController } from './ingestion.controller';

const router = Router();

// Endpoint de ingestión y vectorización de expedientes PDF
router.post('/documents/ingest', bloquearSiPlanVencido, ingestDocumentController);

export const ingestionRoutes = router;
