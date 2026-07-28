import { Request, Response } from 'express';
import { LegalSearchService } from './search.service';

const searchService = new LegalSearchService();

export const getGlossaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category } = req.query;
    const terms = searchService.getGlossaryTerms(query as string, category as string);
    res.json({ success: true, terms });
  } catch (error: any) {
    res.status(500).json({ error: 'GLOSSARY_ERROR', message: error.message });
  }
};

export const searchLegalDatabaseController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, filterType } = req.query;
    const results = searchService.searchLegalDatabase((query as string) || '', filterType as any);
    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: 'LEGAL_SEARCH_ERROR', message: error.message });
  }
};

export const searchWebPrecedentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, branch } = req.query;
    const precedents = searchService.searchWebPrecedents((query as string) || '', (branch as string) || 'GENERAL');
    res.json({ success: true, precedents });
  } catch (error: any) {
    res.status(500).json({ error: 'WEB_PRECEDENTS_ERROR', message: error.message });
  }
};
