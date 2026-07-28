import { Request, Response } from 'express';
import { PrecedentsAnalyticsService } from './precedents.service';

const precedentsService = new PrecedentsAnalyticsService();

export const getPrecedentsAnalyticsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const expedienteId = (req.query.expedienteId as string) || 'EXP-2026-904';
    const documentType = (req.query.documentType as string) || 'Contestación de Demanda';
    const legalPrompt = (req.query.legalPrompt as string) || 'Prescripción trienal';

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    const evaluation = await precedentsService.evaluateActiveCaseProvidencia(
      expedienteId,
      documentType,
      legalPrompt,
      firmId
    );

    res.json({
      success: true,
      firmId,
      evaluation
    });
  } catch (error: any) {
    console.error('[PRECEDENTS-CONTROLLER-ERROR]', error);
    res.status(500).json({ error: 'PRECEDENTS_ERROR', message: error.message });
  }
};
