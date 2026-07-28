import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Aislamiento Estricto Multi-Tenant (x-firm-id)
 */
export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const firmIdHeader = req.headers['x-firm-id'];

  if (!firmIdHeader || typeof firmIdHeader !== 'string' || firmIdHeader.trim() === '') {
    res.status(401).json({
      success: false,
      error: 'MISSING_TENANT_ID',
      message: 'Acceso denegado: Se requiere el encabezado "x-firm-id" para autenticar la firma en el entorno SaaS multi-tenant.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.firmId = firmIdHeader.trim();
  console.log(`[MULTI-TENANT-OK] Petición autenticada para la firma: ${req.firmId} -> ${req.method} ${req.originalUrl}`);

  next();
};
