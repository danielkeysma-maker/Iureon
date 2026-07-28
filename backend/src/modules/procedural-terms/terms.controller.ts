import { Request, Response } from 'express';
import { ProceduralTermsService } from './terms.service';

const termsService = new ProceduralTermsService();

export const calculateTermsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { notifiedDate, termInDays, jurisdictionType } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!notifiedDate || !termInDays) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requieren los campos notifiedDate y termInDays' });
      return;
    }

    const result = termsService.calculateJudicialTerm({
      firmId,
      notifiedDate,
      termInDays: Number(termInDays),
      jurisdictionType: jurisdictionType || 'LABORAL'
    });

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: 'TERMS_CALCULATION_ERROR', message: error.message });
  }
};
