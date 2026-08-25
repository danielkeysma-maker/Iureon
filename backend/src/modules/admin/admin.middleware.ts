import { NextFunction, Request, Response } from 'express';

/**
 * Gate for the operator of the platform.
 *
 * WHY THE ROLE CANNOT BE ASKED FOR. `SUPER_ADMIN` lives in `app_metadata`,
 * which only the service role writes, and no endpoint hands it out — the
 * add-user route deliberately coerces anything that is not FIRM_ADMIN down to
 * LAWYER. The first one is created by a script run against the database with
 * the service key, because a power that can grant itself is not a power, it is
 * an opening.
 *
 * WHAT IT DELIBERATELY DOES NOT GRANT. Reading another firm's transcripts,
 * drafts or documents. Managing a tenant — its plan, its balance, its accounts,
 * whether it is active — is running the business. Reading a hearing is reading
 * privileged material a Colombian firm holds under professional secrecy, for
 * which Iureon is the *encargado* and not a party (Ley 1581/2012). Those are
 * different powers and this gate only opens the first, so the platform cannot
 * become a place where every client's case files are one role away.
 *
 * The operator uses the product like anyone else: through their own firm, with
 * their own balance. That is what makes the separation practical rather than
 * merely principled — nothing forces them into somebody else's tenant to work.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    // Deliberately the same answer a firm administrator gets: the existence of
    // an operator console is not something an ordinary session needs to learn.
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'No tienes permiso para esta operación.'
    });
    return;
  }

  next();
};

/** The caller's address, for the audit trail. */
export const callerIp = (req: Request): string | null => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? null;
};
