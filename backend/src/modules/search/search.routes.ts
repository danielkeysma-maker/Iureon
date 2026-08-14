import { Router } from 'express';
import {
  getGlossaryController,
  searchLegalDatabaseController,
  searchPrecedentsController,
  semanticSearchController
} from './search.controller';

const router = Router();

router.get('/legal/glossary', getGlossaryController);
router.get('/legal/search', searchLegalDatabaseController);
// Was `/legal/web-precedents`. It never searched the web: it filtered three
// hand-written rulings. The path now says what the handler actually does.
router.get('/legal/precedents', searchPrecedentsController as any);
router.get('/legal/semantic', semanticSearchController as any);

export const searchRoutes = router;
