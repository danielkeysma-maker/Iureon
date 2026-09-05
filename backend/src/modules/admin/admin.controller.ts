import { Request, Response } from 'express';
import { AuthError } from '../auth/auth.service';
import { auditService } from '../audit/audit.service';
import { callerIp } from './admin.middleware';
import {
  addCredits,
  addUserToAnyFirm,
  createFirm,
  getFirmDetail,
  listFirms,
  updateFirm,
  updateFirmPlan,
  suspenderAccesoDeFirma,
  describirCambioDePlan,
  eliminarFirmaCompleta,
  restablecerContrasenaDeUsuario
} from './admin.service';
import { calcularRunway } from './runway.service';

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

/**
 * GET /api/admin/firms/:firmId — la ficha completa de una firma (7b).
 *
 * LO QUE TRAE Y LO QUE NO. Identidad, saldo, consumo, sus cuentas con lo que
 * gastó cada una, la salud de su catálogo y el registro de lo que operación ha
 * hecho sobre ella. Ni un transcrito, ni un borrador, ni un expediente:
 * gestionar un inquilino y leer su material privilegiado son poderes distintos
 * y este endpoint solo tiene el primero.
 */
export const firmDetailController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, firm: await getFirmDetail(String(req.params.firmId)) });
  } catch (err) {
    fail(res, err, 'No se pudo leer la ficha de la firma.');
  }
};

/** POST /api/admin/firms — onboards a client firm and its first administrator. */
export const createFirmController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firm = await createFirm({
      firmName: String(req.body.firmName ?? ''),
      nit: typeof req.body.nit === 'string' ? req.body.nit : '',
      adminEmail: String(req.body.adminEmail ?? ''),
      adminPassword: String(req.body.adminPassword ?? ''),
      initialCredits: Number(req.body.initialCredits ?? 0)
    });

    await auditService.record({
      firmId: firm.id,
      userEmail: req.user!.email,
      action: 'FIRM_CREATED',
      resource: `${firm.name} (${firm.nit ? `NIT ${firm.nit}` : 'sin NIT'}) · administrador ${req.body.adminEmail}`,
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
    const { balance, reason } = await addCredits(firmId, amount, req.body.reason, req.user!.email);

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      // Dos acciones distintas: acreditar y descontar no se buscan igual en un registro.
      action: amount > 0 ? 'FIRM_CREDITS_ADDED' : 'FIRM_CREDITS_ADJUSTED',
      /*
       * Las dos cifras Y EL MOTIVO. «Recargado» a secas no resuelve una
       * disputa, y sin el porqué el socio de la firma lee un movimiento de
       * dinero que nadie le explicó.
       */
      resource: `${amount > 0 ? '+' : '−'}$${Math.abs(amount).toLocaleString('es-CO')} COP · saldo resultante $${balance.toLocaleString('es-CO')} COP · motivo: ${reason}`,
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
    const reason = await updateFirm(firmId, changes, req.body.reason);

    const descrito = Object.entries(changes)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: changes.status ? 'FIRM_STATUS_CHANGED' : 'FIRM_UPDATED',
      resource: `${descrito} · motivo: ${reason}`,
      ipAddress: callerIp(req)
    });

    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'No se pudo actualizar la firma.');
  }
};

/**
 * PATCH /api/admin/firms/:firmId/plan — sets plan, period and expiry by hand.
 *
 * Audited as PLAN_ACTUALIZADO in the firm's own trail with the reason: a firm
 * whose trial was extended, or whose plan was changed after a phone call, must
 * be able to read who did it and why.
 */
export const updateFirmPlanController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);

  try {
    const cambio = await updateFirmPlan(
      firmId,
      { plan: req.body.plan, period: req.body.period, validUntil: req.body.validUntil },
      req.body.motivo ?? req.body.reason
    );

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: 'PLAN_ACTUALIZADO',
      resource: `${describirCambioDePlan(cambio)} · motivo: ${cambio.reason}`,
      ipAddress: callerIp(req)
    });

    res.json({ success: true, plan: cambio });
  } catch (err) {
    fail(res, err, 'No se pudo fijar el plan de la firma.');
  }
};

/**
 * POST /api/admin/firms/:firmId/suspender — cuts access now, with a reason.
 *
 * Audited as PLAN_SUSPENDIDO in the firm's own trail: its partners must be
 * able to read who closed the door and why, next to the payment that reopens it.
 */
export const suspenderFirmaController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);

  try {
    const cambio = await suspenderAccesoDeFirma(firmId, req.body.motivo ?? req.body.reason);

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: 'PLAN_SUSPENDIDO',
      resource: `Acceso suspendido por operación · ${describirCambioDePlan(cambio)} · motivo: ${cambio.reason}`,
      ipAddress: callerIp(req)
    });

    res.json({ success: true, plan: cambio });
  } catch (err) {
    fail(res, err, 'No se pudo suspender el acceso de la firma.');
  }
};

/** POST /api/admin/firms/:firmId/users — adds an account to any firm. */
export const addUserController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);

  try {
    const { user, role, reason } = await addUserToAnyFirm(firmId, {
      email: String(req.body.email ?? ''),
      password: String(req.body.password ?? ''),
      role: req.body.role === 'FIRM_ADMIN' ? 'FIRM_ADMIN' : 'LAWYER',
      reason: req.body.reason
    });

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: 'USER_CREATED',
      /*
       * El ROL EFECTIVO que devolvió el servicio, no el que pidió el cuerpo:
       * las rutas degradan a LAWYER cualquier cosa que no sea FIRM_ADMIN, y
       * la auditoría debe registrar lo que quedó, no lo que se pidió.
       */
      resource: `${user.email} (${role}) · motivo: ${reason}`,
      ipAddress: callerIp(req)
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    fail(res, err, 'No se pudo crear la cuenta.');
  }
};

/**
 * POST /api/admin/firms/:firmId/users/:userId/password — sets a password by hand.
 *
 * Audited in the FIRM's trail naming the account, never the password: the
 * partners must be able to read that operation touched a credential of theirs.
 */
export const restablecerContrasenaController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);
  const userId = String(req.params.userId);

  try {
    const { email } = await restablecerContrasenaDeUsuario(firmId, userId, req.body?.contrasena);

    await auditService.record({
      firmId,
      userEmail: req.user!.email,
      action: 'CLAVE_RESTABLECIDA_POR_OPERADOR',
      resource: `Contraseña de ${email} restablecida por operación; entregada por canal seguro, sin correo`,
      ipAddress: callerIp(req)
    });

    res.json({ success: true, email });
  } catch (err) {
    fail(res, err, 'No se pudo restablecer la contraseña.');
  }
};

/**
 * DELETE /api/admin/firms/:firmId — the firm and everything it owns.
 *
 * Body: `{ motivo, confirmacion }`, where `confirmacion` must be the firm's
 * exact name. Audited under the OPERATOR's firm (`req.firmId`): the deleted
 * firm's own trail is gone with it, and this is the one record that says who
 * did it, when, and on whose authority.
 */
export const eliminarFirmaController = async (req: Request, res: Response): Promise<void> => {
  const firmId = String(req.params.firmId);

  try {
    const resultado = await eliminarFirmaCompleta({
      firmId,
      firmIdDelOperador: req.firmId ?? req.user!.firmId,
      motivo: req.body?.motivo,
      confirmacion: req.body?.confirmacion
    });

    await auditService.record({
      firmId: req.firmId ?? req.user!.firmId,
      userEmail: req.user!.email,
      action: 'FIRMA_ELIMINADA',
      resource:
        `Firma «${resultado.nombre}» (${firmId}) eliminada con todos sus datos · ` +
        `${resultado.usuariosEliminados} usuarios · motivo: ${resultado.motivo}`,
      ipAddress: callerIp(req)
    });

    res.json({
      success: true,
      eliminada: true,
      tablas: resultado.tablas,
      usuariosEliminados: resultado.usuariosEliminados,
      advertencias: resultado.advertencias
    });
  } catch (err) {
    fail(res, err, 'No se pudo eliminar la firma.');
  }
};

/**
 * Cuánto crédito de OpenRouter hace falta para honrar lo que ya se vendió.
 *
 * Es del superadmin y no de la firma: el saldo de una firma es suyo, pero el
 * pasivo agregado y el crédito del proveedor son de la casa.
 */
export const runwayController = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, runway: await calcularRunway() });
  } catch (error) {
    res.status(502).json({
      success: false,
      error: 'RUNWAY_UNAVAILABLE',
      message: (error as Error).message
    });
  }
};
