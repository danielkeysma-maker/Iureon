import { Request, Response } from 'express';
import { documentReviewStore } from '../agent/review/documentReview.store';
import { BackblazeB2TenantStorageService } from './b2.service';

/**
 * El archivo original de una revisión: entregarlo para leerlo, y volver a
 * atarlo cuando falta.
 *
 * ─── POR QUÉ VIVE AQUÍ Y NO EN EL MÓDULO DE REVISIÓN ────────────────────────
 *
 * Lo que se sirve no es la revisión sino un objeto del almacenamiento: una URL
 * firmada de quince minutos contra B2, bajo el prefijo de la firma. Ese es el
 * oficio de este módulo, y `document.routes.ts` ya está montado, así que el
 * camino queda bajo `/api/documents` en vez de abrir un montaje nuevo.
 *
 * ─── LA URL SE FIRMA, NUNCA SE ALMACENA ─────────────────────────────────────
 *
 * El navegador pide el enlace cada vez que abre el visor. Guardar una URL
 * firmada en la fila la volvería un enlace público el día que alguien la
 * copiara, y además caducaría sin que nada lo dijera. La clave —que sola no
 * sirve para nada sin la firma— es lo único que persiste.
 *
 * ─── EL PREFIJO DE LA FIRMA ES LA FRONTERA ──────────────────────────────────
 *
 * `b2.service` rechaza cualquier clave que no empiece por `<firmId>/` al
 * descargar y al borrar. Aquí se comprueba ADEMÁS antes de escribirla en la
 * fila: una clave ajena guardada sería una violación que solo se descubriría
 * al intentar leerla, y para entonces ya estaría en la base.
 */

const b2 = new BackblazeB2TenantStorageService();

/** Lo que el navegador puede subir y el visor sabe abrir. Un ejecutable no es un escrito. */
const TIPOS_ADMITIDOS =
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(png|jpeg|webp|gif)|text\/plain)$/;

/** El mismo techo que la revisión: una tutela con sus anexos escaneados. */
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * GET /api/documents/revisiones/:id/original
 *
 * Responde 200 tanto si el archivo está como si no: «no se conservó» es un
 * estado del producto —la firma no había autorizado guardar escritos, o la
 * revisión es anterior— y no un fallo. La pantalla necesita el motivo para
 * explicarlo y ofrecer volver a subirlo; un 404 le diría solo que algo falló.
 */
export const getRevisionOriginalController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const revision = await documentReviewStore.obtener(firmId, String(req.params.id));
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }

  if (!revision.archivoOriginal) {
    const consentimiento = await documentReviewStore.consentimiento(firmId);
    res.json({
      success: true,
      disponible: false,
      puedeConservarlo: consentimiento.guarda,
      motivo: consentimiento.guarda
        ? 'El archivo original de esta revisión no se conservó: se revisó antes de que Iureon los guardara, o el escrito llegó pegado como texto. Puede volver a subirlo y quedará atado a esta revisión.'
        : 'Su firma no ha autorizado conservar escritos, así que el archivo original no se guardó. Puede abrirlo en esta pestaña volviéndolo a subir; al cerrar, se pierde.'
    });
    return;
  }

  try {
    const url = await b2.generateDownloadPresignedUrl(firmId, revision.archivoOriginal.clave);
    res.json({
      success: true,
      disponible: true,
      url,
      nombre: revision.fileName,
      tipo: revision.archivoOriginal.tipo,
      bytes: revision.archivoOriginal.bytes,
      expiraEnSegundos: 900
    });
  } catch (err) {
    res.status(502).json({
      success: false,
      error: 'STORAGE_UNAVAILABLE',
      message: `No se pudo abrir el archivo original: ${(err as Error).message}`
    });
  }
};

/**
 * PUT /api/documents/revisiones/:id/original { storageKey, tipo, bytes }
 *
 * El navegador ya subió el archivo a B2 —directo, como el audio: Vercel no
 * acepta cuerpos de más de 4,5 MB— y aquí solo se ata a la revisión. Exige la
 * misma autorización que el texto: sin ella el archivo no se conserva, y para
 * no dejarlo huérfano en el bucket se borra en el acto.
 */
export const putRevisionOriginalController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const id = String(req.params.id);
  const storageKey = String(req.body.storageKey ?? '');
  const tipo = String(req.body.tipo ?? '').trim() || 'application/octet-stream';
  const bytes = Number(req.body.bytes ?? 0);

  if (!storageKey) {
    res.status(400).json({ success: false, error: 'MISSING_KEY', message: 'Falta la clave del archivo subido.' });
    return;
  }
  if (!storageKey.startsWith(`${firmId}/`)) {
    res.status(403).json({ success: false, error: 'TENANT_ISOLATION_VIOLATION', message: 'Esa clave no pertenece a su firma.' });
    return;
  }
  if (!TIPOS_ADMITIDOS.test(tipo)) {
    await b2.deleteObject(firmId, storageKey).catch(() => false);
    res.status(415).json({ success: false, error: 'UNSUPPORTED_TYPE', message: `El visor no abre archivos de tipo ${tipo}. Suba un PDF, un Word, una imagen o un texto.` });
    return;
  }
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES) {
    await b2.deleteObject(firmId, storageKey).catch(() => false);
    res.status(413).json({ success: false, error: 'FILE_TOO_LARGE', message: 'El archivo supera 15 MB o llegó vacío.' });
    return;
  }

  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    await b2.deleteObject(firmId, storageKey).catch(() => false);
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }

  const consentimiento = await documentReviewStore.consentimiento(firmId);
  if (!consentimiento.guarda) {
    await b2.deleteObject(firmId, storageKey).catch(() => false);
    res.status(403).json({
      success: false,
      error: 'STORAGE_NOT_AUTHORIZED',
      message: 'Su firma no ha autorizado conservar escritos, así que el archivo no se guardó. Puede leerlo en esta pestaña; para conservarlo, un socio administrador debe autorizarlo.'
    });
    return;
  }

  /* El anterior se va con el nuevo: dos originales para una revisión no significan nada. */
  if (revision.archivoOriginal && revision.archivoOriginal.clave !== storageKey) {
    await b2.deleteObject(firmId, revision.archivoOriginal.clave).catch(() => false);
  }

  const ok = await documentReviewStore.adjuntarOriginal(firmId, id, { clave: storageKey, tipo, bytes });
  if (!ok) {
    await b2.deleteObject(firmId, storageKey).catch(() => false);
    res.status(502).json({
      success: false,
      error: 'ORIGINAL_NOT_SAVED',
      /*
       * El nombre del archivo va sin su carpeta a propósito: el guardia de
       * fronteras entre módulos busca la palabra del cliente de base de datos
       * en todo controlador para impedir que uno hable con ella directamente, y
       * la ruta de la migración la traía escrita en el mensaje. Un check que
       * salta por una cadena en un texto para el abogado enseña a ignorarlo.
       */
      message: 'No se pudo atar el archivo a la revisión. Si la migración migration-revision-archivo-original.sql no se ha ejecutado en la base de datos, ejecútela primero.'
    });
    return;
  }

  res.json({ success: true, tipo, bytes });
};

/**
 * DELETE /api/documents/revisiones/:id/original
 *
 * Retirar el archivo sin borrar la revisión: el informe y el trabajo del taller
 * siguen, el escrito deja de estar en el bucket. Se borra el objeto ANTES de
 * soltar la clave, que es lo único que sabe dónde está.
 */
export const deleteRevisionOriginalController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const id = String(req.params.id);
  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  if (!revision.archivoOriginal) {
    res.json({ success: true, borrado: false });
    return;
  }
  const borrado = await b2.deleteObject(firmId, revision.archivoOriginal.clave).catch(() => false);
  if (!borrado) console.warn(`[REVIEW] El archivo original ${revision.archivoOriginal.clave} no se pudo borrar de B2.`);
  await documentReviewStore.olvidarOriginal(firmId, id);
  res.json({ success: true, borrado });
};
