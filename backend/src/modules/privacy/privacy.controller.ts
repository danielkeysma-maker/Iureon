import { Request, Response } from 'express';
import { disclosure, subprocessors } from './subprocessors.service';

/**
 * Who processes this firm's data.
 *
 * Read-only and derived, so there is nothing to keep in sync. Behind the
 * session because it is the firm's own compliance record, not a marketing page.
 */
export const subprocessorsController = (_req: Request, res: Response): void => {
  res.json({ success: true, disclosure: disclosure(), subprocessors: subprocessors() });
};
