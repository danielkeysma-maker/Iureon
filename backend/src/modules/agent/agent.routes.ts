import { Router } from 'express';
import { streamAgentDraftController } from './agent.controller';
import { reviewDocumentController } from './review/documentReview.controller';
import {
  getStyleProfileController,
  saveLawyerEditsController,
  suggestTerminologyController
} from './learning.controller';

const router = Router();

// Orquestador RAG SSE
router.post('/agent/stream-draft', streamAgentDraftController);
/* Revisar un escrito ya redactado: informe, no borrador. Cobra como REVISION. */
router.post('/agent/review-document', reviewDocumentController as any);

// Aprendizaje de Jerga y Sugerencia Inteligente de Vocabulario
router.get('/agent/style-profile', getStyleProfileController);
router.post('/agent/learn-edits', saveLawyerEditsController);
router.post('/agent/suggest-terminology', suggestTerminologyController);

export const agentRoutes = router;
