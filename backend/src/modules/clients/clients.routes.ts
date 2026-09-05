import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
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
router.post('/clients', bloquearSiPlanVencido, createClientController as any);
router.patch('/clients/link', bloquearSiPlanVencido, linkTranscriptionController as any);
router.patch('/clients/:id', bloquearSiPlanVencido, updateClientController as any);
router.delete('/clients/:id', bloquearSiPlanVencido, deleteClientController as any);
router.get('/clients/interviews/:transcriptionId/insights', interviewInsightsController as any);

export const clientsRoutes = router;
