import { Router } from 'express';
import {
  getUploadUrlController,
  getDownloadUrlController,
  listDocumentsController
} from '../controllers/document.controller.js';

const router = Router();

// Endpoint para solicitar URL de subida pre-firmada a Backblaze B2
router.post('/documents/upload-url', getUploadUrlController);

// Endpoint para solicitar URL de descarga/lectura firmada (15 minutos)
router.get('/documents/download-url', getDownloadUrlController);

// Endpoint para listar los expedientes en PDF de la firma activa
router.get('/documents', listDocumentsController);

export default router;
