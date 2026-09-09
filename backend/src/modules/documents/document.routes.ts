import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  getUploadUrlController,
  getDownloadUrlController,
  listDocumentsController
} from './document.controller';
import {
  deleteRevisionOriginalController,
  getRevisionOriginalController,
  putRevisionOriginalController
} from './revisionOriginal.controller';

const router = Router();

router.post('/documents/upload-url', bloquearSiPlanVencido, getUploadUrlController);
router.get('/documents/download-url', getDownloadUrlController);
router.get('/documents/list', listDocumentsController);

/*
 * El archivo original de una revisión, para el visor fiel del taller. Cuelga
 * de aquí y no de las rutas del agente porque lo que se entrega es un objeto
 * del almacenamiento —una URL firmada bajo el prefijo de la firma—, que es el
 * oficio de este módulo. Leerlo no exige plan vigente: un plan vencido debe
 * dejar leer lo ya hecho; atarlo o retirarlo sí, porque escriben.
 */
router.get('/documents/revisiones/:id/original', getRevisionOriginalController);
router.put('/documents/revisiones/:id/original', bloquearSiPlanVencido, putRevisionOriginalController);
router.delete('/documents/revisiones/:id/original', bloquearSiPlanVencido, deleteRevisionOriginalController);

export const documentRoutes = router;
