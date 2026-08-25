import { Router } from 'express';
import {
  createClientController,
  deleteClientController,
  interviewInsightsController,
  linkTranscriptionController,
  listClientsController,
  updateClientController
} from './clients.controller';

/**
 * Client files and the interviews attached to them.
 *
 * Every route is tenant-scoped through the session middleware: a client's
 * cédula, telephone and the account of what they told their lawyer are the most
 * private material this product holds.
 */
const router = Router();

router.get('/clients', listClientsController as any);
router.post('/clients', createClientController as any);
router.patch('/clients/link', linkTranscriptionController as any);
router.patch('/clients/:id', updateClientController as any);
router.delete('/clients/:id', deleteClientController as any);
router.get('/clients/interviews/:transcriptionId/insights', interviewInsightsController as any);

export const clientsRoutes = router;
