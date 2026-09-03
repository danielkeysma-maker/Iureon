import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { auditService } from '../../audit/audit.service';
import {
  BillingError,
  PRICE_COP,
  recordUsage,
  refundReservation,
  reserveForOperation,
  settleOperation
} from '../../billing/billing.service';
import { decodeDocument } from '../../ingestion/documentFetch';
import { BackblazeB2TenantStorageService } from '../../documents/b2.service';
import type { LegalBranch } from '../../catalog/types';
import { buildCatalogGuidance } from '../catalogGuidance';
import { ENGINE, callOpenRouterWithUsage } from '../openrouter.client';
import {
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  parsearInforme,
  prepararTexto
} from './documentReview';
import { documentReviewStore } from './documentReview.store';
import { MAX_CARACTERES_MENSAJE, buildTallerSystemPrompt, buildTallerUserPrompt, parsearRespuestaDelTaller, type TurnoDelTaller } from './taller';

/**
 * POST /api/agent/review-document
 *
 * Body: { documentType, legalBranch?, pregunta?, fileName?, contentBase64? | texto? }
 *
 * ─── THE FILE COMES IN THE BODY, ON PURPOSE ─────────────────────────────────
 *
 * Audio goes to B2 because a hearing weighs 50 MB. A brief weighs kilobytes:
 * a 30-page tutela in PDF is under 2 MB, and Vercel accepts bodies up to
 * 4.5 MB. Sending it base64 inside the JSON keeps one round trip and no
 * storage — the text is extracted, reviewed and discarded in the same request.
 * Nothing of the document is persisted: not the file, not the text, not the
 * report. It is the lawyer's work product, read once.
 *
 * ─── PAID LIKE A DRAFT ──────────────────────────────────────────────────────
 *
 * Reserve before the model, settle after, refund on failure — the same three
 * moves as the draft and the summary. A review the model could not produce
 * costs nothing.
 */

const b2 = new BackblazeB2TenantStorageService();

/** Text below this is not a brief; it is a title or a botched extraction. */
const TEXTO_MINIMO = 200;
/*
 * Above the body limit the file comes through storage, like hearing audio:
 * the browser uploaded it to B2 under the firm's prefix and sends the key.
 * 15 MB covers a tutela with scanned annexes. The object is deleted BEFORE
 * responding, succeed or fail — a serverless function freezes on reply, and
 * a brief nobody can account for must not sit in a bucket.
 */
const MAX_BYTES_ALMACEN = 15 * 1024 * 1024;

/*
 * EL RELOJ DE LA FUNCIÓN, medido y no supuesto. Una revisión de 40.000
 * caracteres con 2.000 tokens de salida tardó 33 s contra OpenRouter, y la
 * función tenía 30 s: Vercel la mataba, y como la reserva del saldo se hace
 * antes de llamar al modelo, la firma pagaba $2.000 por un informe que nunca
 * llegó y nadie devolvía. De ahí tres decisiones: la función sube a 60 s
 * (vercel.json), la respuesta pide brevedad (cuatro hallazgos por lista) con
 * un presupuesto de 3.000 tokens que no debería agotar — y si lo agota, el
 * JSON cortado se repara en vez de tirarse —, y la llamada tiene su propio límite de 50 s POR DEBAJO del de la
 * función, para que sea este código —y no la plataforma— quien corte, devuelva
 * la reserva y lo diga.
 */
const MAX_TOKENS_INFORME = 3_000;
export const LIMITE_LLAMADA_MS = 50_000;

export class TiempoAgotado extends Error {}

export const conLimite = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TiempoAgotado('la revisión tardó más de lo que la plataforma permite')), ms);
    promesa.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });

const leerDelAlmacen = async (
  firmId: string,
  storageKey: string
): Promise<{ ok: true; buffer: Buffer } | { ok: false; status: number; message: string }> => {
  try {
    const url = await b2.generateDownloadPresignedUrl(firmId, storageKey);
    const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!r.ok) return { ok: false, status: 502, message: `El almacenamiento no entregó el archivo (${r.status}).` };
    const declarado = Number(r.headers.get('content-length') ?? 0);
    if (declarado > MAX_BYTES_ALMACEN) return { ok: false, status: 413, message: 'El archivo supera 15 MB.' };
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length > MAX_BYTES_ALMACEN) return { ok: false, status: 413, message: 'El archivo supera 15 MB.' };
    return { ok: true, buffer };
  } catch (err) {
    return { ok: false, status: 502, message: `No se pudo leer el archivo del almacenamiento: ${(err as Error).message}` };
  } finally {
    await b2.deleteObject(firmId, storageKey).catch(() => false);
  }
};
/** Base64 of ~4 MB. Above it Vercel would refuse the body anyway; here it fails with a reason. */
const MAX_BASE64 = 5_600_000;

const tipoPorNombre = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'doc') return 'application/msword';
  return 'text/plain';
};

/**
 * .docx is a zip of XML; the corpus reader never needed it because courts
 * publish .doc and PDF. Here lawyers do send .docx, so it gets a minimal
 * reader: unzip word/document.xml and strip the tags. Paragraph and break
 * tags become spaces so words do not glue together.
 */
const textoDeDocx = async (buffer: Buffer): Promise<string | null> => {
  try {
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(buffer);
    const entry = zip.getEntry('word/document.xml');
    if (!entry) return null;
    const xml = entry.getData().toString('utf8');
    return xml
      .replace(/<\/w:p>|<w:br\/>|<w:tab\/>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  } catch {
    return null;
  }
};

const extraerTexto = async (
  fileName: string,
  buffer: Buffer
): Promise<{ ok: true; texto: string } | { ok: false; reason: string }> => {
  const contentType = tipoPorNombre(fileName);

  if (contentType.includes('wordprocessingml') || buffer.subarray(0, 2).toString() === 'PK') {
    const texto = await textoDeDocx(buffer);
    if (texto !== null) return { ok: true, texto };
  }

  const doc = await decodeDocument(buffer, contentType, TEXTO_MINIMO);
  if (!doc.ok) return { ok: false, reason: doc.reason };
  return { ok: true, texto: doc.text };
};

export const reviewDocumentController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const documentType = String(req.body.documentType ?? '').trim();
  const legalBranch = typeof req.body.legalBranch === 'string' ? (req.body.legalBranch as LegalBranch) : undefined;
  const pregunta = String(req.body.pregunta ?? '');
  const fileName = String(req.body.fileName ?? 'escrito.txt');
  /* De qué cliente o proceso es el escrito: lo dice quien pide la revisión, y queda en la lista. */
  const cliente = String(req.body.cliente ?? '').trim().slice(0, 160);

  if (!documentType) {
    res.status(400).json({ success: false, error: 'MISSING_DOCUMENT_TYPE', message: 'Indique la actuación del escrito.' });
    return;
  }

  // ─── The text: pasted, or extracted from the file ─────────────────────────
  let bruto: string;
  if (typeof req.body.texto === 'string' && req.body.texto.trim()) {
    bruto = req.body.texto;
  } else if (typeof req.body.contentBase64 === 'string' && req.body.contentBase64) {
    if (req.body.contentBase64.length > MAX_BASE64) {
      res.status(413).json({ success: false, error: 'FILE_TOO_LARGE', message: 'El archivo supera el tamaño que cabe en la petición; el navegador debió subirlo al almacenamiento.' });
      return;
    }
    const extraido = await extraerTexto(fileName, Buffer.from(req.body.contentBase64, 'base64'));
    if (!extraido.ok) {
      res.status(422).json({ success: false, error: 'UNREADABLE_FILE', message: `No se pudo leer el archivo: ${extraido.reason}. Pegue el texto en su lugar.` });
      return;
    }
    bruto = extraido.texto;
  } else if (typeof req.body.storageKey === 'string' && req.body.storageKey) {
    const leido = await leerDelAlmacen(firmId, req.body.storageKey);
    if (!leido.ok) {
      res.status(leido.status).json({ success: false, error: 'STORAGE_READ_FAILED', message: leido.message });
      return;
    }
    const extraido = await extraerTexto(fileName, leido.buffer);
    if (!extraido.ok) {
      res.status(422).json({ success: false, error: 'UNREADABLE_FILE', message: `No se pudo leer el archivo: ${extraido.reason}. Pegue el texto en su lugar.` });
      return;
    }
    bruto = extraido.texto;
  } else {
    res.status(400).json({ success: false, error: 'MISSING_TEXT', message: 'Adjunte el escrito o pegue su texto.' });
    return;
  }

  const preparado = prepararTexto(bruto);
  if (preparado.caracteres < TEXTO_MINIMO) {
    res.status(422).json({
      success: false,
      error: 'TEXT_TOO_SHORT',
      message: `El texto tiene ${preparado.caracteres} caracteres; un escrito revisable tiene al menos ${TEXTO_MINIMO}. Si es un PDF escaneado, no trae texto: péguelo.`
    });
    return;
  }

  // ─── Reserve, review, settle ──────────────────────────────────────────────
  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'REVISION' }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    const guidance = buildCatalogGuidance(documentType, legalBranch);
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildReviewSystemPrompt(),
        buildReviewUserPrompt({ documentType, guidance, pregunta, texto: preparado.texto, truncado: preparado.truncado }),
        MAX_TOKENS_INFORME
      ),
      LIMITE_LLAMADA_MS
    );

    await recordUsage({ firmId, userEmail, operation: 'REVISION', operationId, usage: llamada.usage ?? null });

    if (!llamada.text || !llamada.text.trim()) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la revisión no produjo resultado' });
      res.status(502).json({ success: false, error: 'REVIEW_FAILED', message: 'El revisor no respondió. No se descontó saldo.' });
      return;
    }

    const informe = parsearInforme(llamada.text);
    if (!informe) {
      // Shape only, never content: the brief and the report are the lawyer's.
      console.warn(
        `[REVIEW] Informe no estructurable: ${llamada.text.length} caracteres, empieza con «${llamada.text.trimStart().slice(0, 1)}», termina con «${llamada.text.trimEnd().slice(-1)}», tokens de salida ${llamada.usage?.completionTokens ?? '?'}.`
      );
    }

    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'REVISION',
      operationId,
      reserved: reservado,
      description: `Revisión: ${documentType} · ${fileName}`
    });

    // To the audit BEFORE responding: serverless freezes on response. The
    // resource names the actuación and the file, never the content.
    await auditService.record({
      firmId,
      userEmail,
      action: 'DOCUMENT_REVIEWED',
      resource: `${documentType} · ${fileName} · ${preparado.caracteres.toLocaleString('es-CO')} caracteres${preparado.truncado ? ' (recortado)' : ''}`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    /*
     * EL INFORME SE GUARDA SOLO, sin boton. Un escrito que costo saldo no
     * deberia depender de un clic para conservarse — los borradores ensenaron
     * eso —, y aqui menos: el abogado vuelve al informe dias despues, cuando
     * corrige. Se guarda el informe y el nombre del archivo; el texto del
     * escrito no. Si la tabla no existe todavia, la respuesta lo dice.
     */
    const consentimiento = await documentReviewStore.consentimiento(firmId);
    const guardadaId = await documentReviewStore.guardar({
      firmId,
      userEmail,
      documentType,
      legalBranch: legalBranch ?? null,
      fileName,
      cliente,
      pregunta: pregunta.trim(),
      caracteres: preparado.caracteres,
      truncado: preparado.truncado,
      conFicha: guidance !== null,
      informe,
      informeLibre: informe ? null : llamada.text,
      cobradoCop: cobro.charged,
      textoOriginal: consentimiento.guarda ? preparado.texto : null
    });

    res.json({
      success: true,
      id: guardadaId,
      guardada: guardadaId !== null,
      /*
       * EL TEXTO VUELVE AL NAVEGADOR SIEMPRE: el taller lo necesita para tachar
       * los pasajes y dejar editar. Que ademas se CONSERVE en el servidor
       * depende de la autorizacion de la firma, y la respuesta lo dice.
       */
      texto: preparado.texto,
      guardaTexto: consentimiento.guarda,
      informe,
      informeLibre: informe ? null : llamada.text,
      conFicha: guidance !== null,
      truncado: preparado.truncado,
      caracteres: preparado.caracteres,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance
    });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la revisión superó el tiempo de la plataforma' });
      res.status(504).json({
        success: false,
        error: 'REVIEW_TIMEOUT',
        message: 'La revisión tardó más de lo que la plataforma permite. No se descontó saldo. Pruebe con un escrito más corto o sin anexos.'
      });
      return;
    }
    console.error('[REVIEW] Error revisando el escrito:', err);
    await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la revisión falló' });
    res.status(500).json({ success: false, error: 'REVIEW_FAILED', message: 'No se pudo revisar el escrito. No se descontó saldo.' });
  }
};

export const REVIEW_PRICE_COP = PRICE_COP.REVISION;

/** GET /api/agent/reviews — the firm's saved reports, newest first, without bodies. */
export const listReviewsController = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, revisiones: await documentReviewStore.listar(req.firmId as string) });
};

/** GET /api/agent/reviews/:id — one report, complete. */
export const getReviewController = async (req: Request, res: Response): Promise<void> => {
  const revision = await documentReviewStore.obtener(req.firmId as string, String(req.params.id));
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  res.json({ success: true, revision });
};

/* ─── EL TALLER ──────────────────────────────────────────────────────────────── */

/** GET /api/agent/reviews/settings/guardado — si la firma autorizó conservar escritos. */
export const getStorageConsentController = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, ...(await documentReviewStore.consentimiento(req.firmId as string)) });
};

/**
 * POST /api/agent/reviews/settings/guardado { autorizar: boolean }
 *
 * Solo un socio administrador: conservar los escritos de la firma es una
 * decision de la firma, no de quien revisa. Queda en la auditoria con correo.
 */
export const setStorageConsentController = async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'FIRM_ADMIN') {
    res.status(403).json({ success: false, error: 'ONLY_FIRM_ADMIN', message: 'Solo un socio administrador puede autorizar que se conserven los escritos.' });
    return;
  }
  const autorizar = req.body.autorizar !== false;
  const ok = await documentReviewStore.autorizarGuardado(req.firmId as string, req.user.email, autorizar);
  if (!ok) {
    res.status(502).json({ success: false, error: 'CONSENT_NOT_SAVED', message: 'No se pudo guardar la autorización. Si la migración del taller no se ha ejecutado, ejecútela primero.' });
    return;
  }
  await auditService.record({
    firmId: req.firmId as string,
    userEmail: req.user.email,
    action: 'REVIEW_TEXT_STORAGE_AUTHORIZED',
    resource: autorizar ? 'La firma autoriza conservar los escritos revisados y su conversación' : 'La firma retira la autorización de conservar escritos revisados',
    ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
  });
  res.json({ success: true, ...(await documentReviewStore.consentimiento(req.firmId as string)) });
};

/** PUT /api/agent/reviews/:id/texto { texto } — autoguardado del texto de trabajo, si la firma lo autorizó. */
export const saveWorkingTextController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const texto = typeof req.body.texto === 'string' ? req.body.texto : '';
  if (texto.length > 400_000) {
    res.status(413).json({ success: false, error: 'TEXT_TOO_LONG', message: 'El texto de trabajo supera lo que se guarda.' });
    return;
  }
  const consentimiento = await documentReviewStore.consentimiento(firmId);
  if (!consentimiento.guarda) {
    res.json({ success: true, guardado: false, motivo: 'La firma no ha autorizado conservar escritos: el texto vive solo en esta sesión.' });
    return;
  }
  const anotaciones = Array.isArray(req.body.anotaciones)
    ? (req.body.anotaciones as unknown[])
        .map((a) => {
          const o = (a ?? {}) as Record<string, unknown>;
          return { cita: String(o.cita ?? '').slice(0, 2000), color: String(o.color ?? '') };
        })
        .filter((a) => a.cita && /^(amarillo|verde|azul|rosa|tachado)$/.test(a.color))
        .slice(0, 500)
    : undefined;
  const ok = await documentReviewStore.actualizarTextoTrabajo(firmId, String(req.params.id), texto, anotaciones);
  res.json({ success: true, guardado: ok });
};

const ipDe = (req: Request): string => (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? '';

/**
 * POST /api/agent/reviews/:id/chat { mensaje, textoActual, historial? }
 *
 * Un turno con el revisor sobre el texto ACTUAL. El historial lo manda el
 * navegador (es quien lo tiene completo aunque la firma no guarde); si la
 * firma guarda, se persiste junto con el texto de trabajo.
 */
export const reviewChatController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const id = String(req.params.id);
  const mensaje = String(req.body.mensaje ?? '').trim();
  const textoActual = typeof req.body.textoActual === 'string' ? req.body.textoActual : '';
  const historialCliente: TurnoDelTaller[] = Array.isArray(req.body.historial) ? (req.body.historial as TurnoDelTaller[]) : [];

  if (!mensaje) {
    res.status(400).json({ success: false, error: 'MISSING_MESSAGE', message: 'Escriba qué quiere preguntar o pedir.' });
    return;
  }
  if (mensaje.length > MAX_CARACTERES_MENSAJE) {
    res.status(413).json({ success: false, error: 'MESSAGE_TOO_LONG', message: `El mensaje supera ${MAX_CARACTERES_MENSAJE.toLocaleString('es-CO')} caracteres. Si quiere revisar un texto largo, péguelo en el escrito y pida una nueva revisión.` });
    return;
  }
  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  const texto = prepararTexto(textoActual || revision.textoTrabajo || '');
  if (texto.caracteres < 50) {
    res.status(422).json({ success: false, error: 'TEXT_MISSING', message: 'No hay texto del escrito para conversar sobre él. Ábralo de nuevo desde el archivo.' });
    return;
  }

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'CONSULTA_REVISION' }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    const guidance = buildCatalogGuidance(revision.documentType, (revision.legalBranch ?? undefined) as LegalBranch | undefined);
    const historial = historialCliente.length ? historialCliente : revision.conversacion;
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildTallerSystemPrompt(),
        buildTallerUserPrompt({ documentType: revision.documentType, guidance, informe: revision.informe, textoActual: texto.texto, historial, mensaje }),
        1500
      ),
      LIMITE_LLAMADA_MS
    );
    await recordUsage({ firmId, userEmail, operation: 'CONSULTA_REVISION', operationId, usage: llamada.usage ?? null });
    if (!llamada.text || !llamada.text.trim()) {
      await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'el revisor no respondió' });
      res.status(502).json({ success: false, error: 'CHAT_FAILED', message: 'El revisor no respondió. No se descontó saldo.' });
      return;
    }
    const respuesta = parsearRespuestaDelTaller(llamada.text);
    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'CONSULTA_REVISION',
      operationId,
      reserved: reservado,
      description: `Consulta de revisión: ${revision.documentType} · ${revision.fileName}`
    });

    const ahora = new Date().toISOString();
    const turnos: TurnoDelTaller[] = [
      { rol: 'abogado', texto: mensaje, fecha: ahora },
      { rol: 'revisor', texto: respuesta.respuesta, ediciones: respuesta.ediciones, referencias: respuesta.referencias, fecha: ahora }
    ];
    const consentimiento = await documentReviewStore.consentimiento(firmId);
    const guardado = consentimiento.guarda ? await documentReviewStore.agregarTurnos(firmId, id, turnos, texto.texto) : false;

    await auditService.record({ firmId, userEmail, action: 'REVIEW_CHAT', resource: `${revision.documentType} · ${revision.fileName}`, ipAddress: ipDe(req) });

    res.json({ success: true, ...respuesta, turnos, guardado, cobradoCop: cobro.charged, saldoCop: cobro.balance });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la consulta superó el tiempo de la plataforma' });
      res.status(504).json({ success: false, error: 'CHAT_TIMEOUT', message: 'El revisor tardó más de lo que la plataforma permite. No se descontó saldo.' });
      return;
    }
    console.error('[REVIEW] Error en el taller:', err);
    await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la consulta falló' });
    res.status(500).json({ success: false, error: 'CHAT_FAILED', message: 'No se pudo consultar al revisor. No se descontó saldo.' });
  }
};

/**
 * POST /api/agent/reviews/:id/rerevisar { textoActual }
 *
 * Una revisión completa nueva sobre el texto corregido. Cobra como REVISION.
 * Reemplaza el informe guardado; el anterior queda en la conversación como
 * un turno, para que se vea qué cambió.
 */
export const reReviewController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const id = String(req.params.id);
  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  const preparado = prepararTexto(typeof req.body.textoActual === 'string' ? req.body.textoActual : revision.textoTrabajo || '');
  if (preparado.caracteres < TEXTO_MINIMO) {
    res.status(422).json({ success: false, error: 'TEXT_TOO_SHORT', message: `El texto tiene ${preparado.caracteres} caracteres; un escrito revisable tiene al menos ${TEXTO_MINIMO}.` });
    return;
  }

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'REVISION' }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    const guidance = buildCatalogGuidance(revision.documentType, (revision.legalBranch ?? undefined) as LegalBranch | undefined);
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildReviewSystemPrompt(),
        buildReviewUserPrompt({ documentType: revision.documentType, guidance, pregunta: revision.pregunta, texto: preparado.texto, truncado: preparado.truncado }),
        MAX_TOKENS_INFORME
      ),
      LIMITE_LLAMADA_MS
    );
    await recordUsage({ firmId, userEmail, operation: 'REVISION', operationId, usage: llamada.usage ?? null });
    if (!llamada.text || !llamada.text.trim()) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la nueva revisión no produjo resultado' });
      res.status(502).json({ success: false, error: 'REVIEW_FAILED', message: 'El revisor no respondió. No se descontó saldo.' });
      return;
    }
    const informe = parsearInforme(llamada.text);
    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'REVISION',
      operationId,
      reserved: reservado,
      description: `Revisión: ${revision.documentType} · ${revision.fileName} (nueva revisión)`
    });

    const consentimiento = await documentReviewStore.consentimiento(firmId);
    let guardado = false;
    if (consentimiento.guarda) {
      const anterior = revision.informe?.resumen ? `Informe anterior: ${revision.informe.resumen}` : 'Informe anterior sin resumen legible.';
      await documentReviewStore.agregarTurnos(firmId, id, [
        { rol: 'revisor', texto: `Nueva revisión emitida sobre el texto corregido. ${anterior}`, fecha: new Date().toISOString() }
      ]);
      guardado = await documentReviewStore.actualizarInforme(firmId, id, informe, informe ? null : llamada.text, preparado.texto);
    }
    await auditService.record({ firmId, userEmail, action: 'DOCUMENT_REREVIEWED', resource: `${revision.documentType} · ${revision.fileName}`, ipAddress: ipDe(req) });

    res.json({
      success: true,
      informe,
      informeLibre: informe ? null : llamada.text,
      conFicha: guidance !== null,
      truncado: preparado.truncado,
      caracteres: preparado.caracteres,
      guardado,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance
    });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la nueva revisión superó el tiempo de la plataforma' });
      res.status(504).json({ success: false, error: 'REVIEW_TIMEOUT', message: 'La revisión tardó más de lo que la plataforma permite. No se descontó saldo.' });
      return;
    }
    console.error('[REVIEW] Error en la nueva revisión:', err);
    await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la nueva revisión falló' });
    res.status(500).json({ success: false, error: 'REVIEW_FAILED', message: 'No se pudo revisar de nuevo. No se descontó saldo.' });
  }
};

/** DELETE /api/agent/reviews/:id */
export const deleteReviewController = async (req: Request, res: Response): Promise<void> => {
  const ok = await documentReviewStore.eliminar(req.firmId as string, String(req.params.id));
  res.status(ok ? 200 : 404).json({ success: ok });
};
