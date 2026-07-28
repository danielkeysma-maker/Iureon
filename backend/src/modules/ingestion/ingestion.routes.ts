import { Router } from 'express';
import { ingestDocumentController } from './ingestion.controller';

const router = Router();

// Endpoint de ingestión y vectorización de expedientes PDF
router.post('/documents/ingest', ingestDocumentController);

export const ingestionRoutes = router;
