import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { triageFacts } from './triage.service';
import { catalogService } from './catalog.service';
import type { LegalBranch } from './types';
import { guardarOrientacion, listarOrientaciones, huecosDelCatalogo } from './orientacionHistory.service';
import { consumirCupo, TOPE_DIARIO } from './orientacionQuota.service';
import {
  BillingError,
  PRICE_COP,
  recordUsage,
  refundReservation,
  reserveForOperation
} from '../billing/billing.service';
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

  /*
   * LA RAMA ES OPCIONAL, y por eso el orden importa: cuando la petición viene
   * de Redacción, el abogado YA la eligió, y proponerle actuaciones de otra
   * rama sería cambiarle el escrito por debajo. Cuando viene de Orientación no
   * llega, porque cuál es la rama es justamente lo que se está preguntando.
   *
   * Una rama desconocida se ignora en vez de rechazarse: el peor desenlace de
   * un dato de más y mal escrito no puede ser quedarse sin orientación.
   */
  const ramaPedida = String(req.body?.branch ?? '').trim().toUpperCase();
  const branch = catalogService.listBranches().includes(ramaPedida as LegalBranch)
    ? (ramaPedida as LegalBranch)
    : undefined;

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

  const operationId = randomUUID();
  const result = await triageFacts(hechos, branch);

  /*
   * ─── LO QUE COSTO SE REGISTRA, HAYA COBRO O NO ────────────────────────────
   *
   * Hasta el 10 de septiembre de 2026 esta llamada no dejaba una sola fila en
   * `ai_usage`, y no es una llamada pequena: le manda al motor el MENU ENTERO
   * del catalogo —13.183 tokens de entrada medidos sin rama—, treinta veces
   * gratis por firma y por dia. El techo de gasto diario era un calculo de
   * cabeza en un comentario (`orientacionQuota.service.ts`), no un dato que
   * nadie pudiera consultar.
   *
   * SE REGISTRA TAMBIEN LO GRATUITO, y esa es la mitad del punto. Gratis para
   * la firma no es gratis para la casa: las treinta del cupo son el grueso del
   * consumo de este modulo y eran justamente las invisibles. Registrar solo
   * las cobradas dejaria el agujero donde estaba.
   *
   * Y SE REGISTRA ANTES DE LA RAMA DEL FALLO, a proposito. Una orientacion que
   * fallo se devuelve —nadie paga por lo que no recibio— pero el motor ya leyo
   * el menu y ya cobro por leerlo. El reembolso es de la firma; el costo es de
   * la casa, y esa asimetria es justo lo que hay que poder ver.
   *
   * Nunca tumba la orientacion: `recordUsage` avisa por consola y sigue.
   */
  await recordUsage({ firmId, userEmail, operation: 'ORIENTACION', operationId, usage: result.usage ?? null });

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
