import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import { validateVerificationInput } from './verification.validate';
import { verificationStore, VerificationStoreError } from './verification.store';
import type { ActuacionRole, LegalBranch } from './types';

/**
 * Read endpoints are firm-scoped: they return the shipped catalogue with the
 * firm's own verifications overlaid, plus a `curation` flag saying whether that
 * overlay could actually be read.
 *
 * Write endpoints are how procedural knowledge gets corrected without a
 * developer editing source — the point of the module.
 */

const requireFirmId = (req: Request, res: Response): string | null => {
  const firmId = req.firmId;

  if (!firmId) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
    return null;
  }

  return firmId;
};

/**
 * GET /api/catalog/actuaciones?branch=&role=
 * Lists catalogued filings for this firm, optionally filtered.
 */
export const listActuacionesController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const branch = req.query.branch as LegalBranch | undefined;
  const role = req.query.role as ActuacionRole | undefined;

  const { actuaciones, curation } = await catalogService.listForFirm(firmId, branch, role);

  res.json({
    success: true,
    branches: catalogService.listBranches(),
    curation,
    actuaciones
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
export const resolveActuacionController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const documentType = (req.query.documentType as string) || '';

  if (!documentType.trim()) {
    res.status(400).json({
      error: 'MISSING_DOCUMENT_TYPE',
      message: 'Se requiere el parámetro documentType.'
    });
    return;
  }

  const { actuacion, curation } = await catalogService.resolveForFirm(firmId, documentType);

  res.json({ success: true, curation, actuacion });
};

/**
 * GET /api/catalog/verifications — this firm's curation, without the catalogue
 * around it. Lets the curation screen show what the firm has changed.
 */
export const listVerificationsController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const load = await verificationStore.listForFirm(firmId);

  res.json({ success: true, curation: load.status, verifications: load.verifications });
};

/**
 * PUT /api/catalog/verifications
 *
 * Records the firm's verification of one catalogued actuación. The id travels
 * in the body rather than the path because actuación ids contain a slash
 * ("administrativo/demanda-de-nulidad-simple").
 */
export const saveVerificationController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const validation = validateVerificationInput(body, String(body.actuacionId ?? ''));

  if (!validation.ok) {
    res.status(400).json({ error: validation.error.code, message: validation.error.message });
    return;
  }

  // Curation corrects the shipped catalogue; it cannot invent entries. An
  // unknown id is rejected rather than stored as an orphan row that would never
  // surface anywhere.
  const base = catalogService.getById(validation.value.actuacionId);
  if (!base) {
    res.status(404).json({
      error: 'ACTUACION_NOT_FOUND',
      message: `La actuación "${validation.value.actuacionId}" no está en el catálogo.`
    });
    return;
  }

  try {
    const saved = await verificationStore.save(firmId, validation.value);
    const { actuacion } = await catalogService.getByIdForFirm(firmId, base.id);

    res.json({ success: true, verification: saved, actuacion });
  } catch (error) {
    if (error instanceof VerificationStoreError) {
      res.status(503).json({ error: error.code, message: error.message });
      return;
    }
    throw error;
  }
};

/**
 * DELETE /api/catalog/verifications?actuacionId=
 * Drops the firm's override so the shipped catalogue applies again.
 */
export const deleteVerificationController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const actuacionId = String(req.query.actuacionId ?? '').trim();

  if (!actuacionId) {
    res.status(400).json({
      error: 'MISSING_ACTUACION_ID',
      message: 'Se requiere el parámetro actuacionId.'
    });
    return;
  }

  try {
    await verificationStore.remove(firmId, actuacionId);
    res.json({ success: true, actuacionId });
  } catch (error) {
    if (error instanceof VerificationStoreError) {
      res.status(503).json({ error: error.code, message: error.message });
      return;
    }
    throw error;
  }
};

/**
 * GET /api/catalog/:branch — Catalogue for one branch, including its declared
 * coverage gaps so the UI can be honest about what is not verified.
 */
export const getBranchCatalogController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

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

  const { actuaciones, curation } = await catalogService.listForFirm(firmId, branch);

  res.json({
    success: true,
    curation,
    catalog: { meta: catalog.meta, actuaciones }
  });
};
