import { Request, Response } from 'express';
import { fetchOfficialRuling } from './officialRuling.service';
import { discoverRulings } from './discovery.service';
import { buscarEnCndj } from './cndjRuling.service';
import { autoIngest } from './autoIngest.service';

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
 * GET /api/jurisprudence/disciplinaria?tema=...
 *
 * La Comisión Nacional de Disciplina Judicial, que es la que juzga la conducta
 * de abogados y funcionarios judiciales.
 *
 * VA APARTE DEL DESCUBRIMIENTO Y NO ES CAPRICHO. `discover` busca en la
 * relatoría de la Corte Constitucional y confirma cada candidata contra el
 * registro abierto del Estado; la CNDJ tiene su propia relatoría, con su propio
 * formato de radicación y sin registro externo que la respalde. Mezclarlas en
 * un endpoint obligaría a la pantalla a adivinar de dónde vino cada cosa, y de
 * dónde viene una providencia es justo lo que decide si se puede citar.
 *
 * LOS TRES ESTADOS SE DEVUELVEN DISTINTOS, por la misma razón que en `ruling`:
 * «no tiene nada» y «no se pudo consultar» son respuestas opuestas para quien
 * pregunta.
 */
export const disciplinariaController = async (req: Request, res: Response): Promise<void> => {
  const tema = String(req.query.tema ?? '').trim();

  if (!tema) {
    res.status(400).json({ success: false, error: 'MISSING_TOPIC', message: 'Falta el tema.' });
    return;
  }

  const outcome = await buscarEnCndj(tema);

  switch (outcome.status) {
    case 'FOUND':
      res.json({ success: true, rulings: outcome.rulings });
      return;
    case 'NOT_FOUND':
      res.json({ success: true, rulings: [], reason: outcome.reason });
      return;
    case 'UNAVAILABLE':
      // 503: la relatoría no respondió. No es lo mismo que decir que no hay
      // providencias sobre el asunto.
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

/**
 * POST /api/jurisprudence/index   { citas: string[] }
 *
 * Indexa en el corpus compartido las sentencias que el descubrimiento acaba de
 * traer, para que la proxima consulta las tenga sin salir a internet.
 *
 * ES UNA PETICION APARTE, y no un remate de la anterior. Una funcion sin
 * servidor SE CONGELA al responder: cualquier trabajo que quede despues de
 * `res.json()` no esta garantizado donde esto se despliega, y una ingesta a
 * medias deja el corpus con la mitad de una sentencia. Asi que el navegador
 * pide primero los resultados y luego la indexacion, y esta responde cuando
 * termino de verdad.
 *
 * Solo viajan CITAS. El texto se vuelve a descargar del sitio oficial: un
 * navegador que suministra el texto de una sentencia es un navegador que decide
 * que dice esa sentencia.
 */
export const indexRulingsController = async (req: Request, res: Response): Promise<void> => {
  const citas = Array.isArray(req.body?.citas) ? req.body.citas.map(String).slice(0, 10) : [];

  if (citas.length === 0) {
    res.status(400).json({ success: false, error: 'MISSING_CITATIONS', message: 'Faltan las citas.' });
    return;
  }

  res.json({ success: true, results: await autoIngest(citas) });
};
