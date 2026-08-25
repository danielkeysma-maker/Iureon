import { Request, Response } from 'express';
import { LegalSearchService } from './search.service';
import { vectorSearchService } from './vectorSearch.service';

const searchService = new LegalSearchService();

export const getGlossaryController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, category } = req.query;
    const result = searchService.getGlossaryTerms(query as string, category as string);
    // `terms` kept alongside `items` so an older client does not break on the
    // rename; both point at the same array.
    res.json({ success: true, ...result, terms: result.items });
  } catch (error: any) {
    res.status(500).json({ error: 'GLOSSARY_ERROR', message: error.message });
  }
};

export const searchLegalDatabaseController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, branch } = req.query;
    const result = searchService.searchLegalDatabase((query as string) || '', branch as string);
    res.json({ success: true, ...result, results: result.items });
  } catch (error: any) {
    res.status(500).json({ error: 'LEGAL_SEARCH_ERROR', message: error.message });
  }
};

/**
 * GET /api/legal/precedents?query=&limit=
 *
 * Searches the ingested corpus, not the live web. The endpoint it replaced was
 * called `web-precedents` and returned three hand-written rulings with invented
 * URLs; the name promised something the code never did.
 */
export const searchPrecedentsController = async (req: Request, res: Response): Promise<void> => {
  // The jurisprudence corpus is product knowledge, exactly like the actuación
  // catalogue: SYSTEM_CORPUS is the same 62 providencias for every tenant, and
  // requiring a firm made them invisible to every new user — the screen simply
  // did nothing. That is the defect the catalogue already fixed by mounting its
  // reads before the tenant middleware, and this route now follows it.
  //
  // The firm is NOT taken from the caller, and this route is reachable without
  // a session at all. Pinning SYSTEM_CORPUS server-side is what makes that
  // safe: the shared corpus is the same for everyone, so there is no tenant to
  // resolve. Searching a firm's OWN files stays on /api/legal/semantic, behind
  // the session middleware, where the firm comes from the verified token.
  const SHARED_CORPUS = 'SYSTEM_CORPUS';

  const query = String(req.query.query ?? '').trim();

  if (!query) {
    res.status(400).json({ error: 'MISSING_QUERY', message: 'Se requiere el parámetro query.' });
    return;
  }

  const parsedLimit = Number(req.query.limit);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 25) : undefined;

  const result = await searchService.searchPrecedents(SHARED_CORPUS, query, limit);
  res.json({ success: true, ...result, precedents: result.items });
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
