import { Request } from 'express';
import type { AuthenticatedUser } from '../modules/auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      /**
       * The tenant, resolved from the caller's verified token by
       * `authMiddleware`. Never read from a request header: it used to be, and
       * that made the tenant boundary something the browser chose.
       */
      firmId?: string;
      user?: AuthenticatedUser;
    }
  }
}
