import { Request, Response } from 'express';
import { AuthError } from '../auth/auth.service';
import { auditService } from '../audit/audit.service';
import { callerIp } from './admin.middleware';
import { addCredits, addUserToAnyFirm, createFirm, listFirms, updateFirm } from './admin.service';

/**
 * The operator console.
 *
 * Every mutation records itself in the AFFECTED firm's audit trail, naming the
 * operator who did it. A power that crosses tenants is only acceptable if its
 * use is visible to the tenant it crossed into.
 */

const fail = (res: Response, err: unknown, fallback: string): void => {
  if (err instanceof AuthError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }

  console.error('[ADMIN] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'ADMIN_FAILED', message: fallback });
};

/** GET /api/admin/firms — every firm on the platform, with volume figures. */
export const listFirmsController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, firms: await listFirms() });
  } catch (err) {
    fail(res, err, 'No se pudieron listar las firmas.');
  }
};

/** POST /api/admin/firms — onboards a client firm and its first administrator. */
export const createFirmController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firm = await createFirm({
      firmName: String(req.body.firmName ?? ''),
      nit: String(req.body.nit ?? ''),
      adminEmail: String(req.body.adminEmail ?? ''),
      adminPassword: String(req.body.adminPassword ?? ''),
      initialCredits: Number(req.body.initialCredits ?? 0)
    });

    await auditService.record({
      firmId: firm.id,
      userEmail: req.user!.email,
      action: 'FIRM_CREATED',
      resource: `${firm.name} (NIT ${firm.nit}) · administrador ${req.body.adminEmail}`,
      ipAddress: callerIp(req)
    });

    res.status(201).json({ success: true, firm });
  } catch (err) {
    fail(res, err, 'No se pudo crear la firma.');
  }
};

/** POST /api/admin/firms/:firmId/credits — recharges a firm's balance. */
export const addCreditsController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);
  const amount = Number(req.body.amount);

  try {
    const balance = await addCredits(firmId, amount);

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: 'FIRM_CREDITS_ADDED',
      // Both figures, because "recharged" alone settles no dispute.
      resource: `+$${amount.toLocaleString('es-CO')} COP · saldo resultante $${balance.toLocaleString('es-CO')} COP`,
      ipAddress: callerIp(req)
    });

    res.json({ success: true, creditsBalance: balance });
  } catch (err) {
    fail(res, err, 'No se pudo aplicar la recarga.');
  }
};

/** PATCH /api/admin/firms/:firmId — plan, status or name. */
export const updateFirmController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);

  const changes = {
    planTier: typeof req.body.planTier === 'string' ? req.body.planTier : undefined,
    status: typeof req.body.status === 'string' ? req.body.status : undefined,
    name: typeof req.body.name === 'string' ? req.body.name : undefined
  };

  try {
    await updateFirm(firmId, changes);

    const descrito = Object.entries(changes)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: changes.status ? 'FIRM_STATUS_CHANGED' : 'FIRM_UPDATED',
      resource: descrito,
      ipAddress: callerIp(req)
    });

    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'No se pudo actualizar la firma.');
  }
};

/** POST /api/admin/firms/:firmId/users — adds an account to any firm. */
export const addUserController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);

  try {
    const user = await addUserToAnyFirm(firmId, {
      email: String(req.body.email ?? ''),
      password: String(req.body.password ?? ''),
      role: req.body.role === 'FIRM_ADMIN' ? 'FIRM_ADMIN' : 'LAWYER'
    });

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: 'USER_CREATED',
      resource: `${user.email} (${req.body.role === 'FIRM_ADMIN' ? 'FIRM_ADMIN' : 'LAWYER'})`,
      ipAddress: callerIp(req)
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    fail(res, err, 'No se pudo crear la cuenta.');
  }
};
