import { decodeDocument } from '../../ingestion/documentFetch';
import { textoDeDocx } from '../../ingestion/docxText';
import { BackblazeB2TenantStorageService } from '../../documents/b2.service';
import { ENGINE, callOpenRouterMultimodal } from '../openrouter.client';
import { recordUsage } from '../../billing/billing.service';
import {
  MAX_BYTES_DOCUMENTO,
  MAX_BYTES_IMAGEN,
  PLAZO_POR_ADJUNTO_MS,
  PROMPT_IMAGEN,
  TEXTO_MINIMO,
  aplicarTopeTotal,
  esImagen,
  parsearRespuestaImagen,
  recortar,
  textoDeLecturaDeImagen,
  type AdjuntoEntrante,
  type AdjuntoLeido
} from './adjuntos';

/**
 * Attachments to a draft: the I/O half.
 *
 * Gets the bytes (from the body, or from B2 for what did not fit in it),
 * turns them into text — PDF and Word 97 through the corpus decoder, .docx
 * through the shared reader, .txt as is, images through the vision model —
 * and returns one record per file saying what happened. Nothing here throws
 * for a single bad file: the draft continues with the rest, and the lawyer
 * reads which one failed and why in the execution console.
 *
 * ─── STORAGE IS A CORRIDOR, NOT A SHELF ─────────────────────────────────────
 * A file that came through B2 is deleted as soon as its bytes are in memory,
 * success or failure, and BEFORE this function returns — which is before the
 * response starts. A serverless function freezes on reply, so a delete left
 * for later never runs, and a comparendo nobody can account for must not sit
 * in a bucket. Same doctrine as hearing audio and the review workshop.
 */

/** Tokens for the transcription of one image: a full comparendo is ~600 words. */
const MAX_TOKENS_IMAGEN = 1_800;

/*
 * Lazily built: the module is imported by the controller at boot, and the
 * B2 client should not be constructed for a process that never receives an
 * attachment via storage.
 */
let b2: BackblazeB2TenantStorageService | null = null;
const almacen = (): BackblazeB2TenantStorageService => (b2 ??= new BackblazeB2TenantStorageService());

class PlazoVencido extends Error {}

const conPlazo = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new PlazoVencido(`no leído: tardó más de ${ms / 1000} s`)), ms);
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

const tipoPorNombre = (nombre: string, tipo: string): string => {
  if (tipo && tipo !== 'application/octet-stream') return tipo;
  const ext = nombre.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'txt') return 'text/plain';
  return tipo || 'application/octet-stream';
};

const bytesDe = async (firmId: string, adjunto: AdjuntoEntrante, maxBytes: number): Promise<Buffer> => {
  if (adjunto.contentBase64) {
    const buffer = Buffer.from(adjunto.contentBase64, 'base64');
    if (buffer.length > maxBytes) throw new Error(`supera ${Math.round(maxBytes / 1024 / 1024)} MB`);
    return buffer;
  }
  const storageKey = adjunto.storageKey as string;
  try {
    const url = await almacen().generateDownloadPresignedUrl(firmId, storageKey);
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error(`el almacenamiento no entregó el archivo (${r.status})`);
    const declarado = Number(r.headers.get('content-length') ?? 0);
    if (declarado > maxBytes) throw new Error(`supera ${Math.round(maxBytes / 1024 / 1024)} MB`);
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error(`supera ${Math.round(maxBytes / 1024 / 1024)} MB`);
    return buffer;
  } finally {
    // Before returning, not in a response hook: see the module comment.
    await almacen().deleteObject(firmId, storageKey).catch(() => false);
  }
};

const textoDeDocumento = async (nombre: string, tipo: string, buffer: Buffer): Promise<string> => {
  const contentType = tipoPorNombre(nombre, tipo);

  // Plain text keeps its line breaks: a numbered list of hechos must arrive as lines.
  if (/^text\/plain/i.test(contentType) && buffer.subarray(0, 4).toString() !== '%PDF') {
    return buffer.toString('utf8').replace(/\r\n/g, '\n').trim();
  }

  if (contentType.includes('wordprocessingml') || buffer.subarray(0, 2).toString() === 'PK') {
    const texto = await textoDeDocx(buffer);
    if (texto !== null) return texto.trim();
  }

  const doc = await decodeDocument(buffer, contentType, TEXTO_MINIMO);
  if (!doc.ok) throw new Error(doc.reason);
  return doc.text;
};

interface ContextoDeLectura {
  firmId: string;
  userEmail: string;
  /** The draft's operation id, so the vision call lands on the same ledger line as the three engines. */
  operationId: string;
}

const leerImagen = async (ctx: ContextoDeLectura, adjunto: AdjuntoEntrante, buffer: Buffer): Promise<AdjuntoLeido> => {
  const mime = /^image\/(png|webp)$/i.test(adjunto.tipo) ? adjunto.tipo.toLowerCase() : 'image/jpeg';
  const { text, usage } = await callOpenRouterMultimodal(
    ENGINE.GEMINI,
    PROMPT_IMAGEN,
    [
      { type: 'text', text: `Archivo: ${adjunto.nombre}. Transcribe y extrae los datos según las reglas.` },
      { type: 'image_url', image_url: { url: `data:${mime};base64,${buffer.toString('base64')}` } }
    ],
    MAX_TOKENS_IMAGEN,
    // «sin texto legible» is a short and honest answer; the drafting floor would discard it.
    10
  );

  /*
   * Recorded, not charged: reading an image is part of BORRADOR, and the
   * firm pays one price for the document. The ledger still needs the real
   * cost of that price, and the vision call is real cost.
   */
  await recordUsage({
    firmId: ctx.firmId,
    userEmail: ctx.userEmail,
    operation: 'BORRADOR',
    operationId: ctx.operationId,
    usage
  });

  if (!text) throw new Error('el modelo de visión no devolvió lectura');
  const lectura = parsearRespuestaImagen(text);
  const { texto, recortado } = recortar(textoDeLecturaDeImagen(lectura));
  if (texto.length < TEXTO_MINIMO && lectura.datosLegibles.length === 0) {
    throw new Error('sin texto legible en la imagen');
  }
  return {
    nombre: adjunto.nombre,
    clase: 'imagen',
    ok: true,
    caracteres: texto.length,
    texto,
    datos: lectura.datosLegibles,
    motivo: recortado ? 'recortado' : undefined
  };
};

const leerUno = async (ctx: ContextoDeLectura, adjunto: AdjuntoEntrante): Promise<AdjuntoLeido> => {
  const imagen = esImagen(adjunto);
  const clase: AdjuntoLeido['clase'] = imagen ? 'imagen' : 'documento';
  try {
    const trabajo = (async (): Promise<AdjuntoLeido> => {
      const buffer = await bytesDe(ctx.firmId, adjunto, imagen ? MAX_BYTES_IMAGEN : MAX_BYTES_DOCUMENTO);
      if (imagen) return leerImagen(ctx, adjunto, buffer);
      const { texto, recortado } = recortar(await textoDeDocumento(adjunto.nombre, adjunto.tipo, buffer));
      if (texto.length < TEXTO_MINIMO) throw new Error(`rindió ${texto.length} caracteres: no hay texto que leer`);
      return {
        nombre: adjunto.nombre,
        clase,
        ok: true,
        caracteres: texto.length,
        texto,
        motivo: recortado ? 'recortado' : undefined
      };
    })();
    return await conPlazo(trabajo, PLAZO_POR_ADJUNTO_MS);
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err);
    console.warn(`[ADJUNTOS] ${adjunto.nombre}: ${motivo}`);
    return { nombre: adjunto.nombre, clase, ok: false, caracteres: 0, motivo };
  }
};

/**
 * Reads every attachment in parallel and returns one record per file, in the
 * order the lawyer attached them, with the total cap already applied.
 */
export const leerAdjuntos = async (ctx: ContextoDeLectura, adjuntos: AdjuntoEntrante[]): Promise<AdjuntoLeido[]> => {
  if (adjuntos.length === 0) return [];
  const leidos = await Promise.all(adjuntos.map((a) => leerUno(ctx, a)));
  return aplicarTopeTotal(leidos);
};
