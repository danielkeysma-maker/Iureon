import { Router } from 'express';
import { streamAgentDraftController } from '../controllers/agent.controller.js';

const router = Router();

// Endpoint SSE para streaming del borrador jurídico multi-motor
router.post('/agent/stream-draft', streamAgentDraftController);

export default router;
