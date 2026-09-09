import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import { validateVerificationInput } from './verification.validate';
import { auditService } from '../audit/audit.service';
import { verificationStore, VerificationStoreError } from './verification.store';
import { firmActuacionStore, FirmActuacionStoreError } from './firmActuaciones.store';
import { actuacionPropiaComoCatalogo } from './firmActuaciones.validate';
import type { ActuacionRole, CatalogVerificationInput, LegalBranch } from './types';

/**
 * Read endpoints are firm-scoped: they return the shipped catalogue with the
 * firm's own verifications overlaid, plus a `curation` flag saying whether that
 * overlay could actually be read.
 *
 * Write endpoints are how procedural knowledge gets corrected without a
 * developer editing source — the point of the module.
 */

/**
 * Answers a store failure without echoing the database's own error text, which
 * would leak schema details to the client. The detail goes to the server log,
 * where it is actually useful.
 */
const respondStoreError = (res: Response, error: VerificationStoreError): void => {
  console.error(`[CATALOG] ${error.code}: ${error.message}`);

  const message =
    error.code === 'STORE_NOT_CONFIGURED'
      ? error.message
      : 'La verificación no pudo guardarse. Revisa la conexión con la base de datos e inténtalo de nuevo.';

  res.status(503).json({ error: error.code, message });
};

/**
 * Tenant for a READ of the catalogue.
 *
 * Optional on purpose: the shipped catalogue is product knowledge, the same for
 * everyone, and only the curation overlay is per firm — so a visitor with no
 * session still gets the 378 actuaciones.
 *
 * IT USED TO READ THE HEADER, AND THAT LEAKED. These routes are mounted before
 * the session middleware, and the old line fell back to `x-firm-id` when
 * `req.firmId` was absent — which on a route with no middleware was always. Any
 * unauthenticated caller could name another firm and read its curation, the one
 * piece of this endpoint that IS tenant data. Now the value can only arrive
 * from `optionalAuthMiddleware`, which sets it from a verified token or not at
 * all.
 */
const optionalFirmId = (req: Request): string | null => {
  const value = req.firmId;
  return value?.trim() ? value.trim() : null;
};

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
  const firmId = optionalFirmId(req);

  const branch = req.query.branch as LegalBranch | undefined;
  const role = req.query.role as ActuacionRole | undefined;

  const { actuaciones, meta, curation } = await catalogService.listForFirm(firmId, branch, role);

  res.json({
    success: true,
    branches: catalogService.listBranches(),
    curation,
    // Declared coverage gaps travel with the list so the screen can show what
    // the catalogue does NOT cover, instead of leaving it in a research file.
    meta,
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
  const firmId = optionalFirmId(req);

  const documentType = (req.query.documentType as string) || '';

  if (!documentType.trim()) {
    res.status(400).json({
      error: 'MISSING_DOCUMENT_TYPE',
      message: 'Se requiere el parámetro documentType.'
    });
    return;
  }

  // Optional, but supplying it is what lets a name shared by two branches
  // resolve at all: without it the service refuses rather than guesses.
  const branch = (req.query.branch as LegalBranch | undefined) || undefined;

  const { actuacion, curation } = await catalogService.resolveForFirm(
    firmId,
    documentType,
    branch
  );

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
 * Cura una actuación propia de la firma, si el id es de una.
 *
 * Devuelve true cuando ya respondió (curada o error de guardado) y false
 * cuando ese id no es de ninguna actuación de esta firma, para que el llamador
 * siga con su 404 de siempre.
 */
const curarActuacionPropia = async (
  req: Request,
  res: Response,
  firmId: string,
  value: CatalogVerificationInput
): Promise<boolean> => {
  const load = await firmActuacionStore.listForFirm(firmId);
  const propia = load.actuaciones.find((a) => a.id === value.actuacionId);

  if (!propia) return false;

  try {
    const guardada = await firmActuacionStore.curate(firmId, propia.id, {
      termStatus: value.termStatus,
      legalBasis: value.legalBasis ?? null,
      termDescription: value.termDescription ?? null,
      sourceUrl: value.sourceUrl ?? null,
      note: value.note ?? null
    });

    if (!guardada) {
      res.status(404).json({
        error: 'ACTUACION_NOT_FOUND',
        message: `La actuación "${value.actuacionId}" no está entre las que añadió su firma.`
      });
      return true;
    }

    await auditService.record({
      firmId,
      userEmail: req.user?.email ?? 'desconocido',
      action: 'CATALOG_TERM_VERIFIED',
      resource: `Verificó actuación propia · ${guardada.exactName}`
    });

    res.json({
      success: true,
      verification: null,
      actuacion: actuacionPropiaComoCatalogo(guardada)
    });
  } catch (error) {
    if (error instanceof FirmActuacionStoreError) {
      console.error(`[CATALOG] ${error.code}: ${error.message}`);
      res.status(503).json({
        error: error.code,
        message:
          error.code === 'STORE_NOT_CONFIGURED'
            ? error.message
            : 'La verificación no pudo guardarse. Revise la conexión con la base de datos e inténtelo de nuevo.'
      });
      return true;
    }
    throw error;
  }

  return true;
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
  /*
   * LA UNICA FRONTERA QUE IMPORTA: verificar es de administradores de la
   * firma. De eso depende que "612 actuaciones verificadas" signifique algo —
   * si cualquiera puede marcar verificado, el chip verde no certifica nada.
   * Un abogado litigante PROPONE; un socio VERIFICA.
   */
  if (req.user?.role !== 'FIRM_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Verificar el catálogo es de los administradores de la firma. Puede proponer la corrección a un socio.'
    });
    return;
  }


  const body = (req.body ?? {}) as Record<string, unknown>;
  const validation = validateVerificationInput(
    body,
    String(body.actuacionId ?? ''),
    catalogService.listBranches()
  );

  if (!validation.ok) {
    res.status(400).json({ error: validation.error.code, message: validation.error.message });
    return;
  }

  // Curation corrects the shipped catalogue; it cannot invent entries. An
  // unknown id is rejected rather than stored as an orphan row that would never
  // surface anywhere.
  const base = catalogService.getById(validation.value.actuacionId);

  /*
   * VERIFICAR EN UNA RAMA QUE NO ALCANZA ESA FICHA NO ES VERIFICAR NADA.
   *
   * La rama solo viaja cuando la ficha llega alli por remision. Si no llega, la
   * fila se guardaria contra una clave que ninguna pantalla consulta: la firma
   * habria escrito un termino, veria el mensaje de guardado, y la ficha
   * seguiria sin verificar. Se rechaza antes de escribir.
   */
  const rama = validation.value.rama ?? null;
  if (base && rama && !catalogService.alcanzaPorRemision(base.id, rama)) {
    res.status(400).json({
      error: 'RAMA_SIN_REMISION',
      message: `La rama "${rama}" no alcanza la actuación "${base.exactName}" por remisión, así que la verificación no se mostraría en ninguna parte.`
    });
    return;
  }

  if (!base) {
    /*
     * PUEDE SER UNA ACTUACIÓN QUE LA FIRMA AÑADIÓ, y curarla es exactamente el
     * punto del producto: nació sin norma, y aquí es donde deja de estarlo.
     *
     * Se escribe en `firm_actuaciones` y no en `catalog_verifications` porque
     * esa tabla corrige una ficha PUBLICADA —su `actuacion_id` tiene que
     * existir en el catálogo— y esta no lo es. Misma pantalla, mismo
     * formulario, misma regla de que un término sin fuente no entra; otra
     * tabla, porque es otro objeto.
     */
    const propia = await curarActuacionPropia(req, res, firmId, validation.value);
    if (propia) return;

    res.status(404).json({
      error: 'ACTUACION_NOT_FOUND',
      message: `La actuación "${validation.value.actuacionId}" no está en el catálogo.`
    });
    return;
  }

  try {
    const saved = await verificationStore.save(firmId, validation.value);
    const { actuacion } = await catalogService.getByIdForFirm(firmId, base.id, rama ?? undefined);

    /*
     * El acto que hace confiable el catalogo, con nombre en el registro. Un
     * termino verificado sin rastro de quien lo verifico no es auditable — y
     * "651 actuaciones no valen sin la firma de quien las reviso".
     */
    await auditService.record({
      firmId,
      userEmail: req.user?.email ?? 'desconocido',
      action: 'CATALOG_TERM_VERIFIED',
      resource: rama
        ? `Verificó actuación · ${base.exactName} · en ${rama} por remisión`
        : `Verificó actuación · ${base.exactName}`
    });

    res.json({ success: true, verification: saved, actuacion });
  } catch (error) {
    if (error instanceof VerificationStoreError) {
      respondStoreError(res, error);
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
  /*
   * LA UNICA FRONTERA QUE IMPORTA: verificar es de administradores de la
   * firma. De eso depende que "612 actuaciones verificadas" signifique algo —
   * si cualquiera puede marcar verificado, el chip verde no certifica nada.
   * Un abogado litigante PROPONE; un socio VERIFICA.
   */
  if (req.user?.role !== 'FIRM_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Verificar el catálogo es de los administradores de la firma. Quitar una verificación también es de socios.'
    });
    return;
  }


  const actuacionId = String(req.query.actuacionId ?? '').trim();
  /*
   * La misma clave con la que se guardo. Sin `rama`, se retira la curaduria de
   * la rama propia de la ficha: quitar la de familia no puede tumbar la civil.
   */
  const ramaCruda = String(req.query.rama ?? '').trim().toUpperCase();
  const rama = ramaCruda ? (ramaCruda as LegalBranch) : null;

  if (!actuacionId) {
    res.status(400).json({
      error: 'MISSING_ACTUACION_ID',
      message: 'Se requiere el parámetro actuacionId.'
    });
    return;
  }

  try {
    /*
     * REVERTIR UNA ACTUACIÓN PROPIA NO LA BORRA: le quita lo verificado.
     *
     * «Volver al catálogo base» no significa nada para una actuación que el
     * catálogo base no trae; lo que sí significa es dejarla como nació, sin
     * término y sin fuente, y así vuelve a mostrarse advertida. Retirarla de la
     * lista es otro acto y tiene su propia ruta, `/catalog/firm-actuaciones`.
     */
    if (!catalogService.getById(actuacionId)) {
      const load = await firmActuacionStore.listForFirm(firmId);
      const propia = load.actuaciones.find((a) => a.id === actuacionId);

      if (propia) {
        await firmActuacionStore.curate(firmId, propia.id, {
          termStatus: 'NO_VERIFICADO',
          legalBasis: null,
          termDescription: null,
          sourceUrl: null,
          note: propia.note
        });
        res.json({ success: true, actuacionId });
        return;
      }
    }

    await verificationStore.remove(firmId, actuacionId, rama);
    res.json({ success: true, actuacionId, rama });
  } catch (error) {
    if (error instanceof VerificationStoreError) {
      respondStoreError(res, error);
      return;
    }
    if (error instanceof FirmActuacionStoreError) {
      console.error(`[CATALOG] ${error.code}: ${error.message}`);
      res.status(503).json({ error: error.code, message: 'No se pudo revertir la verificación.' });
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
  const firmId = optionalFirmId(req);

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
