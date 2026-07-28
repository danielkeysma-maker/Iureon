import { Router } from 'express';
import {
  getUploadUrlController,
  getDownloadUrlController,
  listDocumentsController
} from './document.controller';

const router = Router();

router.post('/documents/upload-url', getUploadUrlController);
router.get('/documents/download-url', getDownloadUrlController);
router.get('/documents/list', listDocumentsController);

export const documentRoutes = router;
