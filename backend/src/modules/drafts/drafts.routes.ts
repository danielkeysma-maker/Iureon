import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  listDraftsController,
  createDraftController,
  updateDraftController,
  deleteDraftController
} from './drafts.controller';

const router = Router();

router.get('/drafts', listDraftsController as any);
router.post('/drafts', bloquearSiPlanVencido, createDraftController as any);
router.put('/drafts/:id', bloquearSiPlanVencido, updateDraftController as any);
router.delete('/drafts/:id', bloquearSiPlanVencido, deleteDraftController as any);

export const draftsRoutes = router;
