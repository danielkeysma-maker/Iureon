import { Router } from 'express';
import { calculateSettlementController } from './settlement.controller';

const router = Router();

router.post('/settlement/calculate', calculateSettlementController);

export const settlementRoutes = router;
