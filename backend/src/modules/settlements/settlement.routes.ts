import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import { calculateSettlementController } from './settlement.controller';

const router = Router();

router.post('/settlement/calculate', bloquearSiPlanVencido, calculateSettlementController);

export const settlementRoutes = router;
