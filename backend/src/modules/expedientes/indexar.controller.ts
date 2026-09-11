import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { IngestionError, IngestionService } from '../ingestion/ingestion.service';
import { exigirModulo, responderPlanError } from '../subscriptions/plan.service';
import { ExpedienteError, obtenerExpediente } from './expedientes.service';

/**
 * POST /api/expedientes/:id/indexar — el expediente de 300 páginas.
 *
 * ─── POR QUÉ ESTO EXISTE, Y POR QUÉ NO ES «SUBIR UN ARCHIVO MÁS» ───────────
 *
 * La revisión corta el texto en 300.000 caracteres y lo dice. Para un escrito
 * de veinte páginas sobra; para un expediente de trescientas, no alcanza — y
 * ningún motor lee trescientas páginas de un tirón ni cabría en el reloj de la
 * función.
 *
 * Indexar es la otra forma de leer: el documento se parte en fragmentos, se
 * vectoriza una vez, y a partir de ahí el motor recupera los pedazos que vienen
 * al caso en vez del texto entero. Es exactamente lo que sostiene el corpus de
 * jurisprudencia desde hace meses; lo único que faltaba era que los fragmentos
 * supieran de qué expediente son.
 *
 * ─── EL TEXTO LLEGA EXTRAÍDO, Y NO ES UN ATAJO ─────────────────────────────
 *
 * El PDF NO pasa por aquí. Vercel rechaza cuerpos de más de 4,5 MB y un
 * expediente escaneado pesa mucho más; además la extracción es trabajo de CPU
 * que no tiene por qué gastar el reloj del servidor. El navegador ya sabe
 * hacerlo —`frontend/src/modules/workspace/services/textoDelArchivo.ts`, con
 * pdfjs— y manda el texto.
 *
 * MEDIDO con el Código General del Proceso entero, 336 páginas: el texto plano
 * pesa 0,73 MB. Cabe de sobra bajo el tope de cuerpo.
 *
 * ─── LO QUE SE MIDIÓ ANTES DE ESCRIBIRLO ───────────────────────────────────
 *
 * Ese mismo documento produce 295 fragmentos, que son 37 peticiones al
 * proveedor de embeddings en lotes de ocho —unos 37 segundos a un segundo por
 * petición, contra un tope de función de 300—. Se temía que hubiera que
 * indexar por tandas o montar una cola de fondo; no hace falta. El riesgo real
 * estaba en otro sitio: insertar 295 filas de una en una. Eso se arregló en el
 * propio servicio con lotes de cien.
 */

/* Una instancia, como la del controlador de ingesta: el servicio no guarda estado. */
const ingestionService = new IngestionService();

const fallar = (res: Response, err: unknown, mensaje: string): void => {
  if (responderPlanError(res, err)) return;
  if (err instanceof ExpedienteError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }
  if (err instanceof IngestionError) {
    res.status(422).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error('[EXPEDIENTES/INDEXAR] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'INDEX_FAILED', message: mensaje });
};

export const indexarEnExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    const userEmail = req.user?.email ?? 'desconocido';
    await exigirModulo(firmId, 'EXPEDIENTES');

    /*
     * El expediente se lee ANTES de indexar, y no solo para tener su nombre:
     * comprueba que sea de esta firma. Sin eso, un id ajeno llegado por la URL
     * dejaría los fragmentos de un cliente colgando del caso de otro.
     */
    const expediente = await obtenerExpediente(firmId, String(req.params.id));

    const titulo = String(req.body?.titulo ?? '').trim();
    const texto = String(req.body?.texto ?? '');
    const claveB2 = String(req.body?.claveB2 ?? '').trim();

    if (!titulo) {
      res.status(400).json({
        success: false,
        error: 'MISSING_TITLE',
        message: 'El documento necesita un nombre con el que reconocerlo después.'
      });
      return;
    }

    const resultado = await ingestionService.ingestLegalDocument({
      firmId,
      title: titulo,
      /*
       * La clave de B2, cuando el archivo se subió allí. Vacía cuando el
       * abogado solo pegó el texto: se indexa igual, y lo que se pierde es
       * poder volver al original, no la búsqueda.
       */
      b2FileUrl: claveB2,
      rawText: texto,
      expedienteId: expediente.id,
      metadata: { expediente: expediente.caratula, radicado: expediente.radicado }
    });

    /*
     * A la auditoría van el asunto, el nombre del documento y CUÁNTOS
     * fragmentos. El contenido no: es el expediente del cliente.
     */
    await auditService.record({
      firmId,
      userEmail,
      action: 'EXPEDIENTE_INDEXED',
      resource: `${expediente.caratula} · ${titulo} · ${resultado.totalChunksCreated} fragmentos`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({
      success: true,
      resultado,
      /*
       * SE DICE SI QUEDÓ BUSCABLE O NO. `NOT_INDEXED` significa que el
       * documento se leyó pero no hay proveedor de embeddings: sin este aviso,
       * el abogado creería que su expediente está indexado y las búsquedas
       * saldrían vacías sin explicación.
       */
      buscable: resultado.status === 'COMPLETED'
    });
  } catch (err) {
    fallar(res, err, 'No se pudo indexar el documento.');
  }
};
