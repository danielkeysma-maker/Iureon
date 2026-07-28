import { Router } from 'express';
import {
  getGlossaryController,
  searchLegalDatabaseController,
  searchWebPrecedentsController
} from './search.controller';

const router = Router();

router.get('/legal/glossary', getGlossaryController);
router.get('/legal/search', searchLegalDatabaseController);
router.get('/legal/web-precedents', searchWebPrecedentsController);

export const searchRoutes = router;
