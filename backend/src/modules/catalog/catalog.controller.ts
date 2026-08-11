import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import type { ActuacionRole, LegalBranch } from './types';

/**
 * GET /api/catalog/actuaciones?branch=&role=
 * Lists catalogued filings, optionally filtered.
 */
export const listActuacionesController = (req: Request, res: Response): void => {
  const branch = req.query.branch as LegalBranch | undefined;
  const role = req.query.role as ActuacionRole | undefined;

  res.json({
    success: true,
    branches: catalogService.listBranches(),
    actuaciones: catalogService.list(branch, role)
  });
};

/**
 * GET /api/catalog/actuaciones/resolve?documentType=
 *
 * Resolves a UI label to a catalogued actuación so the workspace can show the
 * deadline and legal basis before the draft is generated. Answers 200 with
 * actuacion:null when nothing matches confidently — an unmatched label is a
 * normal state, not an error.
 */
export const resolveActuacionController = (req: Request, res: Response): void => {
  const documentType = (req.query.documentType as string) || '';

  if (!documentType.trim()) {
    res.status(400).json({
      error: 'MISSING_DOCUMENT_TYPE',
      message: 'Se requiere el parámetro documentType.'
    });
    return;
  }

  res.json({ success: true, actuacion: catalogService.findByDocumentType(documentType) });
};

/**
 * GET /api/catalog/:branch — Catalogue for one branch, including its declared
 * coverage gaps so the UI can be honest about what is not verified.
 */
export const getBranchCatalogController = (req: Request, res: Response): void => {
  const rawBranch = String(req.params.branch ?? '');
  const branch = rawBranch.toUpperCase() as LegalBranch;
  const catalog = catalogService.getCatalog(branch);

  if (!catalog) {
    res.status(404).json({
      error: 'BRANCH_NOT_CATALOGUED',
      message: `La rama "${rawBranch}" aún no tiene catálogo verificado.`,
      availableBranches: catalogService.listBranches()
    });
    return;
  }

  res.json({ success: true, catalog });
};
