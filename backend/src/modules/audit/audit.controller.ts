import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { hayMasEventos, leerPedidoDePagina } from './paginaDeAuditoria';

const auditService = new AuditService();

/**
 * La auditoría de la firma, por páginas.
 *
 * `?desde=&limite=&inicio=` — ver `paginaDeAuditoria.ts`. La respuesta trae el
 * total y si hay más, para que la pantalla diga «leídos N de TOTAL» en vez de
 * presentar la primera página como el registro entero.
 *
 * El `firmId` sale del token, nunca de la consulta: el navegador no escoge qué
 * auditoría lee. Sin filtro de rol, como estaba: hoy la ve todo usuario de la
 * firma, y cambiar quién la ve es una decisión de producto, no de paginación.
 *
 * Una lectura fallida responde 500 con el mensaje: nunca `logs: []`.
 */
export const getAuditLogsController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;
  if (!firmId) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere req.firmId autenticado' });
    return;
  }

  try {
    const pedido = leerPedidoDePagina(req.query as Record<string, unknown>);
    const { logs, total } = await auditService.leerPagina(firmId, pedido);
    res.json({
      success: true,
      logs,
      total,
      desde: pedido.desde,
      limite: pedido.limite,
      hayMas: hayMasEventos({ desde: pedido.desde, recibidos: logs.length, limite: pedido.limite, total })
    });
  } catch (error: any) {
    res.status(500).json({ error: 'AUDIT_LOGS_ERROR', message: error?.message ?? 'No se pudo leer la auditoría.' });
  }
};
