import { Router } from 'express';
import {
  getGlossaryController,
  searchLegalDatabaseController,
  searchPrecedentsController,
  semanticSearchController
} from './search.controller';

/**
 * Reads of shared product knowledge, mounted BEFORE the tenant middleware.
 *
 * The 62 providencias in SYSTEM_CORPUS are the same for every firm — nobody's
 * private data — and gating them behind x-firm-id made the whole Buscador do
 * nothing for a user with no firm registered: no results, no error, no reason.
 * The actuación catalogue reached the same conclusion first; this mirrors it.
 */
const publicRouter = Router();

// Was `/legal/web-precedents`. It never searched the web: it filtered three
// hand-written rulings. The path now says what the handler actually does.
publicRouter.get('/legal/precedents', searchPrecedentsController as any);

export const searchPublicRoutes = publicRouter;

const router = Router();

router.get('/legal/glossary', getGlossaryController);
router.get('/legal/search', searchLegalDatabaseController);
// Stays tenant-scoped on purpose: unlike /legal/precedents, this one reaches
// the firm's OWN indexed documents alongside the shared corpus.
router.get('/legal/semantic', semanticSearchController as any);

export const searchRoutes = router;
