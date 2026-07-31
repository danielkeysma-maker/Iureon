import { Router } from 'express';
import {
  listDraftsController,
  createDraftController,
  updateDraftController,
  deleteDraftController
} from './drafts.controller';

const router = Router();

router.get('/drafts', listDraftsController as any);
router.post('/drafts', createDraftController as any);
router.put('/drafts/:id', updateDraftController as any);
router.delete('/drafts/:id', deleteDraftController as any);

export const draftsRoutes = router;
