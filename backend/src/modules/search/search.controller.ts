import { Request, Response } from 'express';
import { LegalSearchService } from './search.service';
import { vectorSearchService } from './vectorSearch.service';

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

/**
 * GET /api/legal/semantic?query=&limit=
 *
 * Semantic search over the firm's indexed documents and the shared law corpus.
 * Answers 200 with an explicit status when the index or the embeddings provider
 * is missing: an empty result and an unconfigured system must not look alike.
 */
export const semanticSearchController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;

  if (!firmId) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
    return;
  }

  const query = String(req.query.query ?? '').trim();

  if (!query) {
    res.status(400).json({ error: 'MISSING_QUERY', message: 'Se requiere el parámetro query.' });
    return;
  }

  const parsedLimit = Number(req.query.limit);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 25) : undefined;

  const result = await vectorSearchService.search(firmId, query, limit);

  res.json({ success: true, ...result });
};
