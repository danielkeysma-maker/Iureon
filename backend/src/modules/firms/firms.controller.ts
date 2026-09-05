import { Request, Response } from 'express';
import { AuthError, signIn } from '../auth/auth.service';
import { leerContrasena, validarBorradoDeFirmaPropia } from '../auth/borrado.rules';
import { auditService } from '../audit/audit.service';
import { borrarFirmaConTodo, firmIdDelOperador, nombreDeLaFirma } from './borradoDeFirma.service';

/** Turns a thrown AuthError into its own status; anything else is a 500. */
const fail = (res: Response, err: unknown, fallback: string): void => {
  if (err instanceof AuthError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error('[FIRMS] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'FIRM_FAILED', message: fallback });
};

/**
 * DELETE /api/firms/me — the caller's own firm with everything it owns.
 *
 * Body: `{ contrasena, confirmacion }`. FIRM_ADMIN only; the password is
 * checked by signing in again, and `confirmacion` must be the firm's exact
 * name. Deliberately NOT behind `bloquearSiPlanVencido`: a firm whose plan
 * expired must still be able to take its data away.
 *
 * There is no firm left to audit under afterwards, so the deletion is written
 * to the log and, when the operator's firm can be found, to the operator's
 * trail as `FIRMA_ELIMINADA`, marked as done by the firm itself.
 */
export const eliminarMiFirmaController = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const firmId = req.firmId ?? user.firmId;

  try {
    const nombre = await nombreDeLaFirma(firmId);
    validarBorradoDeFirmaPropia({
      role: user.role,
      nombreDeLaFirma: nombre,
      confirmacion: req.body?.confirmacion
    });

    const contrasena = leerContrasena(req.body?.contrasena);
    try {
      await signIn(user.email, contrasena);
    } catch {
      throw new AuthError('WRONG_PASSWORD', 'La contraseña no es correcta.', 401);
    }

    const resultado = await borrarFirmaConTodo({ firmId, nombre });

    const traza =
      `Firma «${nombre}» (${firmId}) eliminada por su administrador ${user.email} · ` +
      `${resultado.usuariosEliminados} usuarios · ${resultado.advertencias.length} advertencias`;
    console.info('[FIRMS]', traza);

    const firmaDelOperador = await firmIdDelOperador().catch(() => null);
    if (firmaDelOperador && firmaDelOperador !== firmId) {
      await auditService.record({
        firmId: firmaDelOperador,
        userEmail: user.email,
        action: 'FIRMA_ELIMINADA',
        resource: traza
      });
    }

    res.json({ success: true, advertencias: resultado.advertencias });
  } catch (err) {
    fail(res, err, 'No se pudo eliminar la firma.');
  }
};
