import { Request, Response } from 'express';
import { SettlementService } from './settlement.service';

const settlementService = new SettlementService();

export const calculateSettlementController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { monthlySalary, startDate, endDate, terminationType } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!monthlySalary || !startDate || !endDate) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requieren los campos monthlySalary, startDate y endDate' });
      return;
    }

    const result = settlementService.calculateLaborSettlement({
      firmId,
      monthlySalary: Number(monthlySalary),
      startDate,
      endDate,
      terminationType: terminationType || 'INJUSTA_CAUSA'
    });

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: 'SETTLEMENT_CALCULATION_ERROR', message: error.message });
  }
};
