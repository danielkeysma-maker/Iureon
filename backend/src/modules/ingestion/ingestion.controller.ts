import { Request, Response } from 'express';
import { IngestionService } from './ingestion.service';

const ingestionService = new IngestionService();

export const ingestDocumentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { title, b2FileUrl, rawText, metadata } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!title || !b2FileUrl) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requieren los campos title y b2FileUrl' });
      return;
    }

    const result = await ingestionService.ingestLegalDocument({
      firmId,
      title,
      b2FileUrl,
      rawText,
      metadata
    });

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('[INGESTION-CONTROLLER-ERROR]', error);
    res.status(500).json({ error: 'INGESTION_ERROR', message: error.message });
  }
};
