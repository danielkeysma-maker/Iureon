import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { auditService } from '../../audit/audit.service';
import { BillingError, recordUsage, refundReservation, reserveForOperation, settleOperation } from '../../billing/billing.service';
import type { LegalBranch } from '../../catalog/types';
import { buildCatalogGuidance } from '../catalogGuidance';
import { ENGINE, callOpenRouterWithUsage } from '../openrouter.client';
import { prepararTexto } from './documentReview';
import { LIMITE_LLAMADA_MS, TiempoAgotado, conLimite } from './documentReview.controller';
import { MAX_CARACTERES_MENSAJE, buildTallerSystemPrompt, buildTallerUserPrompt, parsearRespuestaDelTaller, type TurnoDelTaller } from './taller';

/**
 * POST /api/agent/escrito/chat
 *
 * La guía conversa sobre un escrito que la app generó en Redacción — o sobre
 * cualquier texto que el abogado tenga en el lienzo —, sin informe previo y
 * sin id: el navegador manda el texto actual y el historial, y el servidor
 * contesta con la respuesta, las ediciones aplicables y las referencias a los
 * pasajes de los que habla. Nada se persiste aquí; si el borrador está
 * guardado, el navegador guarda la conversación con él (PUT /drafts/:id).
 *
 * Mismo revisor, mismo cobro (CONSULTA_REVISION) y mismo reloj que el taller
 * de revisión: la única diferencia es que no hay informe que resumir.
 */
export const escritoChatController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const documentType = String(req.body.documentType ?? '').trim() || 'Escrito';
  const legalBranch = typeof req.body.legalBranch === 'string' && req.body.legalBranch ? (req.body.legalBranch as LegalBranch) : undefined;
  const titulo = String(req.body.titulo ?? documentType).trim().slice(0, 160);
  const mensaje = String(req.body.mensaje ?? '').trim();
  const historial: TurnoDelTaller[] = Array.isArray(req.body.historial) ? (req.body.historial as TurnoDelTaller[]) : [];
  const texto = prepararTexto(typeof req.body.textoActual === 'string' ? req.body.textoActual : '');
  const anotacionesDelAbogado = Array.isArray(req.body.anotaciones)
    ? (req.body.anotaciones as unknown[]).map((a) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return { cita: String(o.cita ?? '').slice(0, 2000), color: String(o.color ?? '') };
      })
    : [];

  if (!mensaje) {
    res.status(400).json({ success: false, error: 'MISSING_MESSAGE', message: 'Escriba qué quiere preguntar o pedir.' });
    return;
  }
  if (mensaje.length > MAX_CARACTERES_MENSAJE) {
    res.status(413).json({ success: false, error: 'MESSAGE_TOO_LONG', message: `El mensaje supera ${MAX_CARACTERES_MENSAJE.toLocaleString('es-CO')} caracteres.` });
    return;
  }
  if (texto.caracteres < 50) {
    res.status(422).json({ success: false, error: 'TEXT_MISSING', message: 'No hay texto del escrito sobre el cual conversar. Genere o abra un borrador primero.' });
    return;
  }

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'CONSULTA_REVISION' }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    const guidance = buildCatalogGuidance(documentType, legalBranch);
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildTallerSystemPrompt(),
        buildTallerUserPrompt({ documentType, guidance, informe: null, textoActual: texto.texto, historial, mensaje, anotaciones: anotacionesDelAbogado }),
        1500
      ),
      LIMITE_LLAMADA_MS
    );
    await recordUsage({ firmId, userEmail, operation: 'CONSULTA_REVISION', operationId, usage: llamada.usage ?? null });
    if (!llamada.text || !llamada.text.trim()) {
      await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la guía no respondió' });
      res.status(502).json({ success: false, error: 'CHAT_FAILED', message: 'La guía no respondió. No se descontó saldo.' });
      return;
    }
    const respuesta = parsearRespuestaDelTaller(llamada.text);
    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'CONSULTA_REVISION',
      operationId,
      reserved: reservado,
      description: `Consulta sobre el escrito: ${titulo}`
    });
    const ahora = new Date().toISOString();
    const turnos: TurnoDelTaller[] = [
      { rol: 'abogado', texto: mensaje, fecha: ahora },
      { rol: 'revisor', texto: respuesta.respuesta, ediciones: respuesta.ediciones, referencias: respuesta.referencias, fecha: ahora }
    ];
    await auditService.record({
      firmId,
      userEmail,
      action: 'REVIEW_CHAT',
      resource: `Escrito de Redacción · ${titulo}`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });
    res.json({ success: true, ...respuesta, turnos, guardado: false, cobradoCop: cobro.charged, saldoCop: cobro.balance });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la consulta superó el tiempo de la plataforma' });
      res.status(504).json({ success: false, error: 'CHAT_TIMEOUT', message: 'La guía tardó más de lo que la plataforma permite. No se descontó saldo.' });
      return;
    }
    console.error('[ESCRITO] Error en la consulta sobre el escrito:', err);
    await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la consulta falló' });
    res.status(500).json({ success: false, error: 'CHAT_FAILED', message: 'No se pudo consultar a la guía. No se descontó saldo.' });
  }
};
