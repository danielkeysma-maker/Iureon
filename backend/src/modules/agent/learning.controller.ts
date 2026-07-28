import { Request, Response } from 'express';
import { LearningService } from './learning.service';

const learningService = new LearningService();

export const getStyleProfileController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    const profile = await learningService.getFirmStyleProfile(firmId);
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ error: 'STYLE_PROFILE_ERROR', message: error.message });
  }
};

export const saveLawyerEditsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { originalText, editedText } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    await learningService.learnFromLawyerEdits(firmId, originalText, editedText);
    res.json({ success: true, message: 'Aprendizaje de jerga y estilo registrado para la firma' });
  } catch (error: any) {
    res.status(500).json({ error: 'LEARN_EDITS_ERROR', message: error.message });
  }
};

export const suggestTerminologyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    const { selectedText, contextSentence } = req.body;

    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
      return;
    }

    if (!selectedText) {
      res.status(400).json({ error: 'BAD_REQUEST', message: 'Se requiere el parámetro selectedText' });
      return;
    }

    const suggestions = learningService.suggestLegalTerminology({
      firmId,
      selectedText,
      contextSentence: contextSentence || ''
    });

    res.json({ success: true, suggestions });
  } catch (error: any) {
    res.status(500).json({ error: 'SUGGESTION_ERROR', message: error.message });
  }
};
