import { Request, Response } from 'express';
import { triageFacts } from './triage.service';

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
 */
export const triageController = async (req: Request, res: Response): Promise<void> => {
  const hechos = String(req.body?.hechos ?? '').trim();

  if (!hechos) {
    res.status(400).json({ success: false, error: 'MISSING_FACTS', message: 'Describe los hechos.' });
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
    descartadas: result.descartadas
  });
};
