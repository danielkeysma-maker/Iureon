import { Request, Response } from 'express';
import { triageFacts } from './triage.service';
import { consumirCupo } from './orientacionQuota.service';

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

  const cupo = await consumirCupo(firmId);

  if (!cupo.permitido) {
    // 429 y no 403: no es que no tenga derecho, es que ya usó el de hoy.
    res.status(429).json({ success: false, error: 'CUPO_AGOTADO', message: cupo.motivo });
    return;
  }

  const result = await triageFacts(hechos);

  if (result.status === 'FAILED') {
    res.status(502).json({ success: false, error: result.status, message: result.reason });
    return;
  }

  res.json({
    success: true,
    status: result.status,
    reason: result.reason,
    suggestions: result.suggestions,
    // Lo que el modelo inventó y el catálogo tumbó. Se devuelve porque es la
    // única forma de ver si está proponiendo cosas que no existen.
    descartadas: result.descartadas,
    // Para que la pantalla pueda avisar antes de que se acabe, en vez de
    // sorprender al abogado con una puerta cerrada.
    cupoRestante: cupo.restantes
  });
};
