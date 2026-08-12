import { Router } from 'express';
import {
  getGlossaryController,
  searchLegalDatabaseController,
  searchWebPrecedentsController,
  semanticSearchController
} from './search.controller';

const router = Router();

router.get('/legal/glossary', getGlossaryController);
router.get('/legal/search', searchLegalDatabaseController);
router.get('/legal/web-precedents', searchWebPrecedentsController);
router.get('/legal/semantic', semanticSearchController as any);

export const searchRoutes = router;
