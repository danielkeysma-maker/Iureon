import { Router } from 'express';
import { streamAgentDraftController } from './agent.controller';
import {
  deleteReviewController,
  getReviewController,
  listReviewsController,
  reviewDocumentController
} from './review/documentReview.controller';
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
/* Los informes guardados de la firma: se releen dias despues, cuando se corrige el escrito. */
router.get('/agent/reviews', listReviewsController as any);
router.get('/agent/reviews/:id', getReviewController as any);
router.delete('/agent/reviews/:id', deleteReviewController as any);

// Aprendizaje de Jerga y Sugerencia Inteligente de Vocabulario
router.get('/agent/style-profile', getStyleProfileController);
router.post('/agent/learn-edits', saveLawyerEditsController);
router.post('/agent/suggest-terminology', suggestTerminologyController);

export const agentRoutes = router;
