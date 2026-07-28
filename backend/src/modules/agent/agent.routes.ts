import { Router } from 'express';
import { streamAgentDraftController } from './agent.controller';
import {
  getStyleProfileController,
  saveLawyerEditsController,
  suggestTerminologyController
} from './learning.controller';

const router = Router();

// Orquestador RAG SSE
router.post('/agent/stream-draft', streamAgentDraftController);

// Aprendizaje de Jerga y Sugerencia Inteligente de Vocabulario
router.get('/agent/style-profile', getStyleProfileController);
router.post('/agent/learn-edits', saveLawyerEditsController);
router.post('/agent/suggest-terminology', suggestTerminologyController);

export const agentRoutes = router;
