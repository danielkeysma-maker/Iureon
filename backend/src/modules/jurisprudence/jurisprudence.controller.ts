import { Request, Response } from 'express';
import { fetchOfficialRuling } from './officialRuling.service';
import { discoverRulings } from './discovery.service';

/**
 * GET /api/jurisprudence/ruling?cita=C-590+de+2005
 *
 * Trae del sitio oficial una sentencia que el corpus no tiene.
 *
 * CADA ESTADO SE DEVUELVE DISTINTO A PROPÓSITO. "No existe" y "no se pudo
 * consultar" son respuestas opuestas para un abogado: la primera le dice que
 * revise el número, la segunda que vuelva a intentar. Colapsarlas en un 404 le
 * haría dudar de una cita correcta, o confiar en una que no lo es.
 */
export const rulingController = async (req: Request, res: Response): Promise<void> => {
  const cita = String(req.query.cita ?? '').trim();

  if (!cita) {
    res.status(400).json({ success: false, error: 'MISSING_CITATION', message: 'Falta la cita.' });
    return;
  }

  const outcome = await fetchOfficialRuling(cita);

  switch (outcome.status) {
    case 'FOUND':
      res.json({ success: true, ruling: outcome.ruling });
      return;
    case 'NOT_A_CITATION':
      res.status(400).json({ success: false, error: outcome.status, message: outcome.reason });
      return;
    case 'DOES_NOT_EXIST':
      res.status(404).json({ success: false, error: outcome.status, message: outcome.reason });
      return;
    case 'UNREACHABLE':
      // 503 y no 404: el registro no respondió, que no es lo mismo que decir
      // que la sentencia no existe.
      res.status(503).json({ success: false, error: outcome.status, message: outcome.reason });
      return;
  }
};

/**
 * GET /api/jurisprudence/discover?tema=...
 *
 * Busca en el sitio oficial de la Corte sentencias sobre un tema que el corpus
 * no tiene, las confirma contra el registro del Estado y las descarga.
 *
 * `NO_PROVIDER` responde 200, no un error: el descubrimiento por tema es
 * opcional y estar apagado no es un fallo. Devolver 503 haría que la pantalla
 * mostrara una alarma por una función que nadie encendió.
 */
export const discoverController = async (req: Request, res: Response): Promise<void> => {
  const tema = String(req.query.tema ?? '').trim();

  if (!tema) {
    res.status(400).json({ success: false, error: 'MISSING_TOPIC', message: 'Falta el tema.' });
    return;
  }

  const result = await discoverRulings(tema);

  if (result.status === 'FAILED') {
    res.status(502).json({ success: false, error: result.status, message: result.reason });
    return;
  }

  res.json({
    success: true,
    status: result.status,
    reason: result.reason,
    found: result.found,
    // Las descartadas se devuelven a propósito: dicen qué propuso el buscador
    // y por qué no entró, que es la única forma de ver si está apuntando bien.
    descartadas: result.descartadas
  });
};
