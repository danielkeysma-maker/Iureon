import { NextFunction, Request, Response } from 'express';
import { userFromToken } from './auth.service';

/**
 * Resolves the tenant from the CALLER'S TOKEN, never from a header they wrote.
 *
 * WHAT THIS REPLACES. `tenantMiddleware` read `x-firm-id` and believed it. The
 * database isolation was real — every query filters by firm — but the filter
 * ran on a value the browser chose, so reading another firm's hearings required
 * knowing their id and nothing else. No password, no session, no account.
 *
 * The firm now comes out of a signature Supabase verifies, from the half of the
 * metadata only the service role can write. A client can forge the header all
 * it likes; nothing reads it any more.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'MISSING_SESSION',
      message: 'Inicia sesión para continuar.'
    });
    return;
  }

  const user = await userFromToken(header.slice('Bearer '.length).trim());

  if (!user) {
    // One answer for an expired token, a forged one, and an account with no
    // firm. The client's move is the same in all three — sign in again — and
    // distinguishing them tells a prober which tokens are merely stale.
    res.status(401).json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'La sesión no es válida o expiró. Vuelve a iniciar sesión.'
    });
    return;
  }

  req.firmId = user.firmId;
  req.user = user;

  next();
};

/**
 * Attaches the caller's firm WHEN they have a valid session, and lets everyone
 * else through.
 *
 * For the routes that serve shared product knowledge — the actuación catalogue,
 * the jurisprudence corpus — which must answer a visitor with no firm at all,
 * but overlay a firm's own curation for a lawyer who has one.
 *
 * It exists because the catalogue read that overlay from `x-firm-id` on a route
 * mounted before any middleware: an unauthenticated caller could name someone
 * else's firm and read their curation. The overlay is tenant data, so the only
 * safe source is a verified token.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    const user = await userFromToken(header.slice('Bearer '.length).trim());

    if (user) {
      req.firmId = user.firmId;
      req.user = user;
    }
  }

  next();
};
