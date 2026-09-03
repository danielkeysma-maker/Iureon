import { Router } from 'express';
import { streamAgentDraftController } from './agent.controller';
import {
  deleteReviewController,
  getReviewController,
  getStorageConsentController,
  listReviewsController,
  reReviewController,
  reviewChatController,
  reviewDocumentController,
  saveWorkingTextController,
  setStorageConsentController
} from './review/documentReview.controller';
import { escritoChatController } from './review/escritoChat.controller';
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
/* La autorizacion de la firma va ANTES de /:id para que «settings» no se lea como un id. */
router.get('/agent/reviews/settings/guardado', getStorageConsentController as any);
router.post('/agent/reviews/settings/guardado', setStorageConsentController as any);
router.get('/agent/reviews/:id', getReviewController as any);
router.delete('/agent/reviews/:id', deleteReviewController as any);
/* El taller: texto de trabajo, conversacion y nueva revision sobre el texto corregido. */
router.put('/agent/reviews/:id/texto', saveWorkingTextController as any);
router.post('/agent/reviews/:id/chat', reviewChatController as any);
router.post('/agent/reviews/:id/rerevisar', reReviewController as any);
/* La guia conversa sobre un escrito generado en Redaccion: sin informe ni id; el navegador manda texto e historial. */
router.post('/agent/escrito/chat', escritoChatController as any);

// Aprendizaje de Jerga y Sugerencia Inteligente de Vocabulario
router.get('/agent/style-profile', getStyleProfileController);
router.post('/agent/learn-edits', saveLawyerEditsController);
router.post('/agent/suggest-terminology', suggestTerminologyController);

export const agentRoutes = router;
