import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { auditService } from '../../audit/audit.service';
import { BillingError, recordUsage, refundReservation, reserveForOperation, settleOperation } from '../../billing/billing.service';
import type { LegalBranch } from '../../catalog/types';
import { buildCatalogGuidance } from '../catalogGuidance';
import { ENGINE, callOpenRouterWithUsage } from '../openrouter.client';
import { LIMITE_LLAMADA_MS, TiempoAgotado, conLimite } from './documentReview.controller';
import { prepararTexto } from './documentReview';
import { documentReviewStore, type PreguntasAudienciaGuardadas } from './documentReview.store';
import { buildPreguntasSystemPrompt, buildPreguntasUserPrompt, normalizarParametros, parsearPreguntas, totalDePreguntas } from './preguntasAudiencia.prompt';

/**
 * POST /api/agent/reviews/:id/preguntas
 * Body: { posicion, quiereProbar?, audiencia?, textoActual? }
 *
 * Tres listas de preguntas para la audiencia a partir del escrito del taller.
 * Mismas tres jugadas que el chat: reservar antes del modelo, liquidar
 * después, devolver si falla. Cobra como CONSULTA_REVISION.
 *
 * El texto sale del navegador (`textoActual`) o, si la firma autorizó
 * conservar escritos, del texto de trabajo guardado — la misma regla que el
 * chat. Tres listas con 6 a 12 preguntas cada una caben holgadas en 3.500
 * tokens; si el modelo se pasa, el JSON cortado se rescata en vez de tirarse.
 */
const MAX_TOKENS_PREGUNTAS = 3_500;
const OPERACION = 'CONSULTA_REVISION' as const;

const ipDe = (req: Request): string => (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? '';

export const preguntasAudienciaController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const id = String(req.params.id);

  const parametros = normalizarParametros((req.body ?? {}) as Record<string, unknown>);
  if (!parametros.ok) {
    res.status(400).json({ success: false, error: 'MISSING_POSITION', message: parametros.message });
    return;
  }

  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  const textoActual = typeof req.body.textoActual === 'string' ? req.body.textoActual : '';
  const texto = prepararTexto(textoActual || revision.textoTrabajo || revision.textoOriginal || '');
  if (texto.caracteres < 200) {
    res.status(422).json({ success: false, error: 'TEXT_MISSING', message: 'No hay texto del escrito del cual sacar preguntas. Ábralo de nuevo desde el archivo.' });
    return;
  }

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: OPERACION }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    const guidance = buildCatalogGuidance(revision.documentType, (revision.legalBranch ?? undefined) as LegalBranch | undefined);
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildPreguntasSystemPrompt(),
        buildPreguntasUserPrompt({ documentType: revision.documentType, guidance, parametros: parametros.parametros, texto: texto.texto, truncado: texto.truncado }),
        MAX_TOKENS_PREGUNTAS
      ),
      LIMITE_LLAMADA_MS
    );
    await recordUsage({ firmId, userEmail, operation: OPERACION, operationId, usage: llamada.usage ?? null });

    const preguntas = llamada.text ? parsearPreguntas(llamada.text) : { contraparte: [], misTestigos: [], testigosContraparte: [] };
    if (totalDePreguntas(preguntas) === 0) {
      await refundReservation({ firmId, userEmail, operation: OPERACION, reason: 'la guía no produjo preguntas legibles' });
      res.status(502).json({ success: false, error: 'QUESTIONS_FAILED', message: 'La guía no devolvió preguntas legibles. No se descontó saldo. Inténtelo de nuevo.' });
      return;
    }

    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: OPERACION,
      operationId,
      reserved: reservado,
      description: `Preguntas para la audiencia · ${revision.fileName}`
    });

    const generadas: PreguntasAudienciaGuardadas = { parametros: parametros.parametros, preguntas, generadoEl: new Date().toISOString(), por: userEmail };
    const guardado = await documentReviewStore.guardarPreguntas(firmId, id, generadas);

    // Antes de responder: la función se congela al contestar. Nombra el archivo y la posición, nunca las preguntas.
    await auditService.record({
      firmId,
      userEmail,
      action: 'HEARING_QUESTIONS_GENERATED',
      resource: `${revision.documentType} · ${revision.fileName} · posición: ${parametros.parametros.posicion} · ${totalDePreguntas(preguntas)} preguntas`,
      ipAddress: ipDe(req)
    });

    res.json({ success: true, ...generadas, guardado, cobradoCop: cobro.charged, saldoCop: cobro.balance });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: OPERACION, reason: 'las preguntas superaron el tiempo de la plataforma' });
      res.status(504).json({ success: false, error: 'QUESTIONS_TIMEOUT', message: 'La guía tardó más de lo que la plataforma permite. No se descontó saldo. Pruebe con un escrito más corto.' });
      return;
    }
    console.error('[REVIEW] Error generando preguntas para la audiencia:', err);
    await refundReservation({ firmId, userEmail, operation: OPERACION, reason: 'las preguntas fallaron' });
    res.status(500).json({ success: false, error: 'QUESTIONS_FAILED', message: 'No se pudieron generar las preguntas. No se descontó saldo.' });
  }
};
