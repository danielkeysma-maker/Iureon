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
import { conLimite, TiempoAgotado } from '../agent/review/documentReview.controller';
import { exigirFuncion, responderPlanError } from '../subscriptions/plan.service';
import {
  MAX_CARACTERES_DEL_MENSAJE,
  buildConsultaSystemPrompt,
  buildConsultaUserPrompt,
  type TurnoDelInterrogatorio
} from './consultaDelInterrogatorio';
import { ExpedienteError, obtenerExpediente } from './expedientes.service';
import { anotarConsulta, obtenerInterrogatorio } from './interrogatorios.service';
import { buscarPasajesDelExpediente } from './materialDelExpediente';

/**
 * POST /api/expedientes/:id/interrogatorios/:interrogatorioId/consulta
 *
 * Seguir hablando con la guía sobre una tanda YA PREPARADA. Por qué existe y
 * qué no hace, en `consultaDelInterrogatorio.ts`.
 *
 * ─── SE COBRA COMO UNA CONSULTA DEL TALLER, Y AQUÍ SÍ ES EL MISMO TRABAJO ──
 *
 * Un turno de esta conversación es lo mismo que un turno del taller de
 * revisión: el motor relee lo que hay y contesta una pregunta. El
 * interrogatorio tiene operación propia porque escribe una lista nueva; esto
 * no escribe ninguna. Piso de `CONSULTA_REVISION` y, como siempre, si el turno
 * sale caro se cobra lo medido.
 *
 * ─── LA TANDA SE LEE DEL SERVIDOR, NO SE RECIBE DEL NAVEGADOR ──────────────
 *
 * El navegador manda el mensaje y nada más. Si mandara también las preguntas,
 * la conversación podría contestar sobre un interrogatorio que no es el que
 * está guardado —el mismo defecto que se evita leyendo la fila—, y además
 * cualquiera con la sesión abierta podría hacer pagar a su firma por analizar
 * un texto cualquiera. La lectura filtra por firma y por expediente, como todas.
 */

const OPERACION = 'CONSULTA_REVISION' as const;
/** Una respuesta en prosa sobre un interrogatorio: no necesita más, y el reloj lo agradece. */
const TOKENS_DE_LA_RESPUESTA = 2_000;
/** Por debajo del reloj de la función, para que corte este código y devuelva la reserva. */
const LIMITE_DE_LA_CONSULTA_MS = 120_000;

export const consultaDelInterrogatorioController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const expedienteId = String(req.params.id ?? '');
  const interrogatorioId = String(req.params.interrogatorioId ?? '');

  const mensaje = String(req.body?.mensaje ?? '').trim();
  if (!mensaje) {
    res.status(400).json({ success: false, error: 'MISSING_MESSAGE', message: 'Escriba qué quiere preguntarle a la guía.' });
    return;
  }
  if (mensaje.length > MAX_CARACTERES_DEL_MENSAJE) {
    res.status(413).json({
      success: false,
      error: 'MESSAGE_TOO_LONG',
      message: `El mensaje supera ${MAX_CARACTERES_DEL_MENSAJE.toLocaleString('es-CO')} caracteres.`
    });
    return;
  }

  let expediente;
  let tanda;
  try {
    /*
     * LA MISMA PUERTA QUE PREPARARLO. Quien no tiene la función no puede
     * preguntar sobre ella: sería cobrarle a una firma por un módulo que su
     * plan no incluye.
     */
    await exigirFuncion(firmId, 'EXPEDIENTES.PREGUNTAS_AUDIENCIA');
    expediente = await obtenerExpediente(firmId, expedienteId);
    tanda = await obtenerInterrogatorio(firmId, expedienteId, interrogatorioId);
  } catch (err) {
    if (responderPlanError(res, err)) return;
    if (err instanceof ExpedienteError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    console.error('[EXPEDIENTES/CONSULTA] Error inesperado antes de cobrar:', err);
    res.status(500).json({ success: false, error: 'CONSULTA_FAILED', message: 'No se pudo abrir el interrogatorio.' });
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
    /*
     * EL MATERIAL SE BUSCA CON LA PREGUNTA DEL COLEGA, no con la consulta que
     * armó la tanda: está preguntando por otra cosa que la de aquel día, y los
     * pasajes que necesita son los de AHORA. Nunca tumba nada: sin índice o con
     * un fallo de red se contesta sin material, diciendo que no lo hay.
     */
    const pasajes = await buscarPasajesDelExpediente(firmId, expedienteId, mensaje);
    const material =
      pasajes.length > 0
        ? {
            que: `${pasajes.length} pasaje(s) del expediente indexado`,
            texto: pasajes.map((p) => `[${p.archivo ?? 'documento del caso'}] ${p.texto}`).join('\n\n'),
            truncado: true
          }
        : null;

    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildConsultaSystemPrompt(),
        buildConsultaUserPrompt({
          expediente,
          listas: tanda.preguntas.porPersona,
          queSeQueriaProbar: tanda.queSeQueriaProbar ?? undefined,
          audiencia: tanda.audiencia ?? undefined,
          historial: tanda.conversacion,
          mensaje,
          material
        }),
        TOKENS_DE_LA_RESPUESTA,
        undefined,
        { timeoutMs: LIMITE_DE_LA_CONSULTA_MS - 10_000 }
      ),
      LIMITE_DE_LA_CONSULTA_MS
    );
    await recordUsage({ firmId, userEmail, operation: OPERACION, operationId, usage: llamada.usage ?? null });

    const respuesta = (llamada.text ?? '').trim();
    if (!respuesta) {
      /* Nadie paga por lo que no recibió, y se devuelve ANTES de responder: la función se congela al hacerlo. */
      await refundReservation({ firmId, userEmail, operation: OPERACION, reason: 'la guía no respondió la consulta' });
      res.status(502).json({
        success: false,
        error: 'CONSULTA_FAILED',
        message: 'La guía no respondió. No se descontó saldo. Inténtelo de nuevo.'
      });
      return;
    }

    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: OPERACION,
      operationId,
      reserved: reservado,
      description: `Consulta sobre el interrogatorio: ${expediente.caratula}`
    });

    const ahora = new Date().toISOString();
    const turnos: TurnoDelInterrogatorio[] = [
      { rol: 'abogado', texto: mensaje, fecha: ahora },
      { rol: 'guia', texto: respuesta, fecha: ahora }
    ];
    const guardado = await anotarConsulta({ firmId, expedienteId, id: interrogatorioId, turnos });

    /*
     * LA AUDITORÍA REGISTRA QUE SE CONSULTÓ, NUNCA QUÉ SE PREGUNTÓ. Copiar el
     * mensaje al registro sería llevar la estrategia del caso a una tabla que
     * nadie puede borrar — la misma razón por la que las preguntas tampoco van.
     */
    await auditService.record({
      firmId,
      userEmail,
      action: 'EXPEDIENTE_INTERROGATORIO_CONSULTA',
      resource: `Interrogatorio de ${expediente.caratula}`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({
      success: true,
      turnos,
      /* `false` cuando la conversación no quedó escrita: la pantalla lo dice en vez de prometerlo. */
      guardado,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance,
      precioCop: PRICE_COP[OPERACION]
    });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: OPERACION, reason: 'la consulta superó el tiempo de la plataforma' });
      res.status(504).json({
        success: false,
        error: 'CONSULTA_TIMEOUT',
        message: 'La guía tardó más de lo que la plataforma permite. No se descontó saldo.'
      });
      return;
    }
    console.error('[EXPEDIENTES/CONSULTA] Error inesperado:', err);
    await refundReservation({ firmId, userEmail, operation: OPERACION, reason: 'la consulta falló' });
    res.status(500).json({
      success: false,
      error: 'CONSULTA_FAILED',
      message: 'No se pudo consultar a la guía. No se descontó saldo.'
    });
  }
};
