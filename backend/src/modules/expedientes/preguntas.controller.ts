import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { auditService } from '../audit/audit.service';
import {
  BillingError,
  PRICE_COP,
  recordUsage,
  refundReservation,
  reserveForOperation,
  settleOperation
} from '../billing/billing.service';
import { ENGINE, callOpenRouterWithUsage } from '../agent/openrouter.client';
import { conLimite, LIMITE_LLAMADA_MS } from '../agent/review/documentReview.controller';
import { exigirModulo, responderPlanError } from '../subscriptions/plan.service';
import { ExpedienteError, obtenerExpediente } from './expedientes.service';
import {
  MAX_AUDIENCIA,
  MAX_PERSONAS_POR_TANDA,
  MAX_QUIERE_PROBAR,
  buildPreguntasSystemPrompt,
  buildPreguntasUserPrompt,
  interrogables,
  leerPreguntas
} from './preguntasDelExpediente';

/**
 * POST /api/expedientes/:id/preguntas
 *
 * Prepara el interrogatorio de personas CONCRETAS del expediente. Ver
 * `preguntasDelExpediente.ts` para el porqué de la forma.
 *
 * ─── SE COBRA COMO `CONSULTA_REVISION`, Y NO ES PEREZA ─────────────────────
 *
 * Es la misma operación que ya cobran las preguntas colgadas de una revisión,
 * al mismo precio y con el mismo nombre. Inventar una operación nueva partiría
 * el histórico en dos: los movimientos de crédito de antes seguirían diciendo
 * «consulta de revisión» y los de después otra cosa, para un trabajo que el
 * abogado vive como el mismo. Mientras el trabajo sea el mismo, el renglón
 * también.
 *
 * ─── EL PRESUPUESTO DE SALIDA CRECE CON LA GENTE ───────────────────────────
 *
 * Las preguntas por revisión piden 3.500 tokens para tres listas. Aquí las
 * listas son tantas como personas se preparen, así que el tope se calcula por
 * cabeza en vez de fijarse: cuatro personas con doce preguntas cada una no
 * caben en el presupuesto de tres listas, y lo que se corta es la última
 * persona — la que el abogado puso de última porque le importaba menos, sí,
 * pero sin avisar.
 */

const OPERACION = 'CONSULTA_REVISION' as const;

/** Por persona, medido sobre el tamaño de las listas del endpoint que ya existe. */
const TOKENS_POR_PERSONA = 1_100;
/** El enfoque y la estructura del JSON, que no dependen de cuánta gente haya. */
const TOKENS_DE_BASE = 600;

const fallar = (res: Response, err: unknown, mensaje: string): void => {
  if (responderPlanError(res, err)) return;
  if (err instanceof ExpedienteError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error('[EXPEDIENTES/PREGUNTAS] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'QUESTIONS_FAILED', message: mensaje });
};

export const preguntasDelExpedienteController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';

  let expediente;
  let aQuienes;
  try {
    await exigirModulo(firmId, 'EXPEDIENTES');
    expediente = await obtenerExpediente(firmId, String(req.params.id));

    /*
     * SE PREGUNTA A QUIEN EL COLEGA ESCOGE, DE ENTRE LOS INTERROGABLES. Si no
     * escoge a nadie, se toman los primeros de la lista: obligar a marcar
     * casillas antes de ver una sola pregunta convierte una ayuda en un
     * formulario.
     */
    const pedidos: string[] = Array.isArray(req.body?.actorIds)
      ? (req.body.actorIds as unknown[]).map((x) => String(x))
      : [];
    const disponibles = interrogables(expediente);

    if (disponibles.length === 0) {
      res.status(422).json({
        success: false,
        error: 'SIN_INTERROGABLES',
        message:
          'Este expediente no tiene a nadie a quien preparar interrogatorio. Agregue las partes, los testigos o el perito, con su lado y sobre qué declaran.'
      });
      return;
    }

    aQuienes = (pedidos.length > 0 ? disponibles.filter((a) => pedidos.includes(a.id)) : disponibles).slice(
      0,
      MAX_PERSONAS_POR_TANDA
    );

    if (aQuienes.length === 0) {
      res.status(422).json({
        success: false,
        error: 'NADIE_ESCOGIDO',
        message: 'A ninguna de las personas escogidas se le prepara interrogatorio en este expediente.'
      });
      return;
    }
  } catch (err) {
    fallar(res, err, 'No se pudo preparar el interrogatorio.');
    return;
  }

  const quiereProbar = String(req.body?.quiereProbar ?? '').slice(0, MAX_QUIERE_PROBAR);
  const audiencia = String(req.body?.audiencia ?? '').slice(0, MAX_AUDIENCIA);

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
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildPreguntasSystemPrompt(),
        buildPreguntasUserPrompt({ expediente, aQuienes, quiereProbar, audiencia, material: null }),
        TOKENS_DE_BASE + TOKENS_POR_PERSONA * aQuienes.length
      ),
      LIMITE_LLAMADA_MS
    );

    await recordUsage({ firmId, userEmail, operation: OPERACION, operationId, usage: llamada.usage ?? null });

    const preguntas = llamada.text ? leerPreguntas(llamada.text, aQuienes, userEmail) : null;
    if (!preguntas) {
      /*
       * NADIE PAGA POR LO QUE NO RECIBIÓ. Se devuelve la reserva ANTES de
       * responder, porque una función serverless se congela al responder y un
       * reembolso «para después» no ocurre.
       */
      await refundReservation({
        firmId,
        userEmail,
        operation: OPERACION,
        reason: 'la guía no produjo preguntas legibles'
      });
      res.status(502).json({
        success: false,
        error: 'QUESTIONS_FAILED',
        message: 'La guía no devolvió preguntas legibles. No se descontó saldo. Inténtelo de nuevo.'
      });
      return;
    }

    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: OPERACION,
      operationId,
      reserved: reservado,
      description: `Interrogatorio: ${expediente.caratula}`
    });

    /*
     * A LA AUDITORÍA VA EL ASUNTO Y CUÁNTA GENTE, no las preguntas. Qué se le
     * va a preguntar a un testigo es estrategia del abogado y del cliente.
     */
    await auditService.record({
      firmId,
      userEmail,
      action: 'HEARING_QUESTIONS_GENERATED',
      resource: `${expediente.caratula} · ${aQuienes.length} persona(s)`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({
      success: true,
      preguntas,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance,
      precioCop: PRICE_COP[OPERACION]
    });
  } catch (err) {
    await refundReservation({
      firmId,
      userEmail,
      operation: OPERACION,
      reason: 'la guía no pudo completarse'
    });
    fallar(res, err, 'No se pudo preparar el interrogatorio. No se descontó saldo.');
  }
};
