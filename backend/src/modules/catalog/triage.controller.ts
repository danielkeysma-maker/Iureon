import { Request, Response } from 'express';
import { triageFacts } from './triage.service';
import { guardarOrientacion, listarOrientaciones, huecosDelCatalogo } from './orientacionHistory.service';
import { consumirCupo, TOPE_DIARIO } from './orientacionQuota.service';
import { reserveForOperation, refundReservation, BillingError, PRICE_COP } from '../billing/billing.service';
import { exigirModulo, responderPlanError } from '../subscriptions/plan.service';

/**
 * POST /api/catalog/triage   { hechos: string }
 *
 * Orienta desde unos hechos hacia las actuaciones del catálogo que podrían
 * aplicar.
 *
 * `SIN_COINCIDENCIA` responde 200, no 404: que el catálogo no reconozca una
 * materia es una respuesta sobre el caso, no un error de la petición. Devolver
 * un error haría que la pantalla mostrara una avería cuando lo que hubo fue un
 * "no sé", que es justo lo que se quiere poder decir.
 *
 * PASADO EL CUPO NO SE NIEGA, SE COBRA. Un muro duro castiga igual al uso
 * legítimo intenso que al abusivo, y la firma que de verdad necesita la número
 * treinta y uno se queda sin ella. Cobrando, el gancho gratuito queda intacto
 * para quien nunca ha pagado, y el consumo de más lo paga quien lo genera.
 *
 * EL CUPO SE CONSUME ANTES DE LLAMAR AL MODELO, y ese orden es el tope entero.
 * Esta pantalla le manda el catálogo completo a un motor pago y no le cobra
 * nada a la firma; contar después dejaría que la llamada abusiva se pague y
 * luego se registre, con lo cual el tope describiría el daño en vez de
 * impedirlo. Si el modelo falla después, ese intento igual se gastó: un tope
 * que se esquiva haciendo fallar las llamadas no es un tope.
 */
export const triageController = async (req: Request, res: Response): Promise<void> => {
  const hechos = String(req.body?.hechos ?? '').trim();

  if (!hechos) {
    res.status(400).json({ success: false, error: 'MISSING_FACTS', message: 'Describe los hechos.' });
    return;
  }

  /*
   * Sin firma no se orienta. La ruta va detrás de `authMiddleware`, así que
   * esto no debería pasar; comprobarlo igual evita que un cambio de montaje
   * convierta el tope en decorativo sin que nadie lo note.
   */
  const firmId = req.firmId;

  if (!firmId) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere una sesión.' });
    return;
  }

  /*
   * Orientación is not in ESENCIAL, and an expired plan does not orient. Asked
   * BEFORE the daily quota is consumed: a refused request must not spend one of
   * the thirty free ones.
   */
  try {
    await exigirModulo(firmId, 'ORIENTACION');
  } catch (err) {
    if (responderPlanError(res, err)) return;
    throw err;
  }

  const cupo = await consumirCupo(firmId);
  const userEmail = req.user?.email ?? 'desconocido';

  if (cupo.cobrar) {
    try {
      await reserveForOperation({ firmId, userEmail, operation: 'ORIENTACION' });
    } catch (error) {
      if (error instanceof BillingError) {
        /*
         * 402 y no 429: la diferencia importa para el abogado. 429 diría "ya
         * usaste lo tuyo, vuelve mañana"; 402 dice "puedes seguir hoy mismo,
         * recargando". La primera es una puerta cerrada y la segunda es una
         * puerta con precio, y solo una de las dos es cierta.
         */
        res.status(402).json({
          success: false,
          error: 'SALDO_INSUFICIENTE',
          message:
            `Usaste las ${TOPE_DIARIO} orientaciones gratuitas de hoy. A partir de aquí cada una ` +
            `cuesta $${PRICE_COP.ORIENTACION} COP y la firma no tiene saldo. ` +
            'Recarga para seguir, o vuelve mañana cuando el cupo gratuito se reinicie.'
        });
        return;
      }
      throw error;
    }
  }

  const result = await triageFacts(hechos);

  if (result.status === 'FAILED') {
    /*
     * Se devuelve lo cobrado, y solo aquí.
     *
     * Dentro del cupo gratuito un intento fallido SÍ se gasta, a propósito: un
     * tope que se esquiva haciendo fallar las llamadas no es un tope. Pero
     * cuando hay dinero de la firma de por medio la regla se invierte — nadie
     * paga por una orientación que no recibió —, y aquí no reabre el hueco
     * porque el cliente no puede provocar este fallo: depende de nuestro motor,
     * no de lo que él escriba.
     */
    if (cupo.cobrar) {
      await refundReservation({
        firmId,
        userEmail,
        operation: 'ORIENTACION',
        reason: 'la orientación no produjo resultado'
      });
    }

    res.status(502).json({ success: false, error: result.status, message: result.reason });
    return;
  }

  /*
   * Al historial ANTES de responder: serverless se congela al responder y un
   * guardado "para despues" no ocurre. Nunca bloquea la respuesta — el
   * historial es un extra y la orientacion no puede fallar por el.
   */
  await guardarOrientacion({
    firmId,
    userEmail,
    hechos,
    status: result.status === 'OK' ? 'OK' : 'SIN_COINCIDENCIA',
    senales: result.senales ?? null,
    sugerencias: result.suggestions.map((s) => ({ id: s.actuacion.id, nombre: s.actuacion.exactName }))
  });

  res.json({
    success: true,
    status: result.status,
    reason: result.reason,
    suggestions: result.suggestions,
    // Lo que el modelo inventó y el catálogo tumbó. Se devuelve porque es la
    // única forma de ver si está proponiendo cosas que no existen.
    descartadas: result.descartadas,
    // Para que la pantalla pueda avisar antes de que se acabe, en vez de
    // sorprender al abogado con un cobro que no esperaba.
    cupoRestante: cupo.restantes,
    /** Lo que se cobró por ESTA consulta: 0 dentro del cupo. */
    cobradoCop: cupo.cobrar ? PRICE_COP.ORIENTACION : 0
  });
};


/** GET /api/catalog/orientaciones — el historial de la firma, con sus huecos. */
export const listarOrientacionesController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;
  if (!firmId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Se requiere una sesión.' });
    return;
  }

  const historial = await listarOrientaciones(firmId);
  res.json({ success: true, historial, huecos: huecosDelCatalogo(historial) });
};
