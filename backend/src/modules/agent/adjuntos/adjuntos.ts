import { repararJsonCortado } from '../review/documentReview';

/**
 * Attachments to a draft: the pure half (limits, parsing, rendering).
 *
 * The lawyer attaches a comparendo, an oficio, a photo of a cédula, and until
 * now the draft never saw them — the panel listed the files and the request
 * carried only the prompt, so the escrito came out with [•] where the plate,
 * the docket number or the place already sat in the attachment. This module
 * decides what an attachment may be, cuts what is read down to what the
 * pipeline can afford, and renders it as one block every stage receives.
 *
 * No I/O here on purpose: `leerAdjuntos.ts` downloads, decodes and calls the
 * vision model; this file is what `check:adjuntos` exercises without a key,
 * a bucket or the network.
 */

/** What the browser sends per attached file. Exactly one of the two payloads. */
export interface AdjuntoEntrante {
  nombre: string;
  tipo: string;
  contentBase64?: string;
  storageKey?: string;
}

/** What reading one attachment produced, success or not. */
export interface AdjuntoLeido {
  nombre: string;
  clase: 'documento' | 'imagen';
  ok: boolean;
  /** Characters that reach the pipeline after the caps. 0 when not read. */
  caracteres: number;
  /** Why it was not read, or how it was cut. Spanish: it is shown to the lawyer. */
  motivo?: string;
  texto?: string;
  /** For images: which identifiable data the model reported (placa, fecha, …). */
  datos?: string[];
}

/*
 * ─── LIMITS ─────────────────────────────────────────────────────────────────
 *
 * Eight files: a demanda with its annexes, not a whole expediente. 40.000
 * characters per file and 120.000 in total because the block is appended to
 * THREE model calls — Gemini, GPT and Opus each read it — so every character
 * here costs three times, and a 300-page scan would push the drafting call
 * past what the balance of an ordinary firm affords. Above the cap the text
 * is cut and the cut is declared, never hidden.
 */
export const MAX_ADJUNTOS = 8;
export const MAX_CARACTERES_POR_ADJUNTO = 40_000;
export const MAX_CARACTERES_TOTAL = 120_000;
/** A document via storage: a tutela with scanned annexes. Same as the review flow. */
export const MAX_BYTES_DOCUMENTO = 15 * 1024 * 1024;
/** An image after the browser downscaled it to 2000 px. Bigger is a scan, not a photo. */
export const MAX_BYTES_IMAGEN = 6 * 1024 * 1024;
/*
 * 20 s per file, all files in parallel. The whole request has 60 s on Vercel
 * and three model calls still to make: an attachment that takes longer is
 * reported as not read and the draft continues without it, instead of the
 * platform killing the function after the balance was reserved.
 */
export const PLAZO_POR_ADJUNTO_MS = 20_000;

/** Text shorter than this is a title, not a document: the reader failed. */
export const TEXTO_MINIMO = 20;

const TIPOS_IMAGEN = /^image\/(jpeg|jpg|png|webp)$/i;
const EXTENSION_IMAGEN = /\.(jpe?g|png|webp)$/i;

export const esImagen = (adjunto: Pick<AdjuntoEntrante, 'tipo' | 'nombre'>): boolean =>
  TIPOS_IMAGEN.test(adjunto.tipo) || (!adjunto.tipo && EXTENSION_IMAGEN.test(adjunto.nombre));

export type ValidacionAdjuntos =
  | { ok: true; adjuntos: AdjuntoEntrante[] }
  | { ok: false; motivo: string };

/**
 * Shapes the raw body field into attachments, refusing what cannot be one.
 *
 * Absent or empty is fine — most drafts have no attachments. Anything present
 * must be a list of at most MAX_ADJUNTOS entries, each with a name and exactly
 * one payload: a file with both, or neither, is a client bug and is said so
 * before a peso is reserved.
 */
export const validarAdjuntos = (raw: unknown): ValidacionAdjuntos => {
  if (raw === undefined || raw === null) return { ok: true, adjuntos: [] };
  if (!Array.isArray(raw)) return { ok: false, motivo: 'adjuntos debe ser una lista' };
  if (raw.length > MAX_ADJUNTOS) {
    return { ok: false, motivo: `Se aceptan hasta ${MAX_ADJUNTOS} adjuntos por escrito; llegaron ${raw.length}.` };
  }

  const adjuntos: AdjuntoEntrante[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return { ok: false, motivo: 'un adjunto no tiene forma de objeto' };
    const a = item as Record<string, unknown>;
    const nombre = typeof a.nombre === 'string' ? a.nombre.trim().slice(0, 200) : '';
    if (!nombre) return { ok: false, motivo: 'un adjunto llegó sin nombre' };
    const tipo = typeof a.tipo === 'string' ? a.tipo.trim().toLowerCase() : '';
    const contentBase64 = typeof a.contentBase64 === 'string' && a.contentBase64 ? a.contentBase64 : undefined;
    const storageKey = typeof a.storageKey === 'string' && a.storageKey ? a.storageKey : undefined;
    if (Boolean(contentBase64) === Boolean(storageKey)) {
      return { ok: false, motivo: `«${nombre}» debe traer contentBase64 o storageKey, y solo uno.` };
    }
    adjuntos.push({ nombre, tipo, contentBase64, storageKey });
  }
  return { ok: true, adjuntos };
};

/** Cuts a text at the per-file cap and says so at the cut. */
export const recortar = (texto: string, max = MAX_CARACTERES_POR_ADJUNTO): { texto: string; recortado: boolean } => {
  const limpio = texto.trim();
  if (limpio.length <= max) return { texto: limpio, recortado: false };
  return {
    texto: `${limpio.slice(0, max)}\n[… recortado: el adjunto sigue, pero solo se leen los primeros ${max.toLocaleString('es-CO')} caracteres]`,
    recortado: true
  };
};

/**
 * Enforces the total cap across files, in the order the lawyer attached them.
 *
 * The first files keep their text; whatever no longer fits is cut, and a file
 * that loses everything is reported as not read for that reason — a silent
 * drop would look, to the lawyer, exactly like the defect being fixed.
 */
export const aplicarTopeTotal = (leidos: AdjuntoLeido[], max = MAX_CARACTERES_TOTAL): AdjuntoLeido[] => {
  let restante = max;
  return leidos.map((l) => {
    if (!l.ok || !l.texto) return l;
    if (l.texto.length <= restante) {
      restante -= l.texto.length;
      return l;
    }
    if (restante < TEXTO_MINIMO) {
      return {
        ...l,
        ok: false,
        caracteres: 0,
        texto: undefined,
        motivo: `no leído: los adjuntos anteriores ya ocupan los ${max.toLocaleString('es-CO')} caracteres que el escrito puede recibir`
      };
    }
    const texto = `${l.texto.slice(0, restante)}\n[… recortado por el tope total de ${max.toLocaleString('es-CO')} caracteres entre todos los adjuntos]`;
    restante = 0;
    return { ...l, texto, caracteres: texto.length, motivo: 'recortado por el tope total' };
  });
};

/*
 * ─── IMAGES ─────────────────────────────────────────────────────────────────
 */

/**
 * What the vision model is told. Two parts in a fixed order so the answer can
 * be split without guessing: the faithful transcription first, then the JSON.
 * «No inventes» is the rule that matters — a plate number the model completes
 * from habit lands in the escrito with the same face as a real one.
 */
export const PROMPT_IMAGEN = `Eres un transcriptor de documentos para un abogado en Colombia. Recibes la foto de un documento (comparendo, oficio, cédula, factura, acta, pantallazo).

Responde EXACTAMENTE con esta forma, sin nada antes ni después:

TRANSCRIPCIÓN:
<transcribe fielmente todo el texto legible de la imagen, en el orden en que aparece; conserva números, fechas y nombres tal cual se leen>

DATOS:
<un solo objeto JSON con esta forma: {"tipo_documento": "", "numeros": {"comparendo": "", "radicado": "", "placa": "", "cedula": "", "nit": "", "otros": ""}, "fechas": [], "lugares": [], "personas_entidades": [], "valores": [], "autoridad": "", "otros": ""}>

REGLAS: No inventes. Si un dato no se lee o no está, omite la clave o déjala vacía. No completes números parciales. No interpretes: transcribe. Si la imagen no tiene texto legible, escribe en TRANSCRIPCIÓN «sin texto legible» y en DATOS {}.`;

export interface LecturaDeImagen {
  transcripcion: string;
  /** Parsed JSON, or null when the model returned none (or an unrepairable one). */
  datos: Record<string, unknown> | null;
  /** Keys that carry a value, flattened one level: "placa", "fecha", "lugar"… */
  datosLegibles: string[];
}

const ETIQUETAS: Record<string, string> = {
  tipo_documento: 'tipo de documento',
  fechas: 'fecha',
  lugares: 'lugar',
  personas_entidades: 'personas/entidades',
  valores: 'valor',
  autoridad: 'autoridad',
  cedula: 'cédula',
  otros: 'otros'
};

const tieneValor = (v: unknown): boolean =>
  Array.isArray(v) ? v.some(tieneValor) : typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined && v !== '';

/** Human names for what was found, so the status line can say «datos: placa, fecha, lugar». */
export const datosLegiblesDe = (datos: Record<string, unknown> | null): string[] => {
  if (!datos) return [];
  const salida: string[] = [];
  for (const [clave, valor] of Object.entries(datos)) {
    if (clave === 'numeros' && valor && typeof valor === 'object' && !Array.isArray(valor)) {
      for (const [sub, v] of Object.entries(valor as Record<string, unknown>)) {
        if (tieneValor(v)) salida.push(ETIQUETAS[sub] ?? sub);
      }
      continue;
    }
    if (tieneValor(valor)) salida.push(ETIQUETAS[clave] ?? clave);
  }
  return salida;
};

/**
 * Splits the model's answer into transcription and data.
 *
 * Tolerates the three ways a model breaks the contract: no DATOS section at
 * all (transcription only), JSON cut by the token budget (repaired with the
 * review module's repairer — the plate read in the first line must not be
 * lost because the closing brace was not), and prose where JSON should be
 * (data becomes null; the transcription still counts).
 */
export const parsearRespuestaImagen = (respuesta: string): LecturaDeImagen => {
  const texto = respuesta.trim();
  const marcaDatos = texto.search(/\bDATOS:\s*/);
  const marcaTrans = texto.search(/\bTRANSCRIPCI[ÓO]N:\s*/i);

  const cuerpoTrans = marcaDatos >= 0 ? texto.slice(0, marcaDatos) : texto;
  const transcripcion = cuerpoTrans
    .slice(marcaTrans >= 0 && marcaTrans < cuerpoTrans.length ? marcaTrans : 0)
    .replace(/^\s*TRANSCRIPCI[ÓO]N:\s*/i, '')
    .trim();

  let datos: Record<string, unknown> | null = null;
  if (marcaDatos >= 0) {
    const crudo = texto.slice(marcaDatos).replace(/^DATOS:\s*/, '').replace(/^```(?:json)?\s*|\s*```$/g, '');
    const intentos = [crudo, repararJsonCortado(crudo)].filter((c): c is string => typeof c === 'string');
    for (const candidato of intentos) {
      try {
        const parsed = JSON.parse(candidato);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          datos = parsed as Record<string, unknown>;
          break;
        }
      } catch {
        /* next attempt */
      }
    }
  }

  return { transcripcion, datos, datosLegibles: datosLegiblesDe(datos) };
};

/** What an image contributes to the block: its transcription plus the data as JSON. */
export const textoDeLecturaDeImagen = (lectura: LecturaDeImagen): string => {
  const partes = [lectura.transcripcion ? `TEXTO LEÍDO EN LA IMAGEN:\n${lectura.transcripcion}` : ''];
  if (lectura.datos && Object.keys(lectura.datos).length > 0) {
    partes.push(`DATOS IDENTIFICADOS:\n${JSON.stringify(lectura.datos)}`);
  }
  return partes.filter(Boolean).join('\n\n').trim();
};

/*
 * ─── THE BLOCK EVERY STAGE RECEIVES ─────────────────────────────────────────
 */

export const ENCABEZADO_BLOQUE =
  'DATOS DE LOS ADJUNTOS (leídos de los archivos que el abogado adjuntó; úsalos para llenar nombres, números, fechas, lugares y valores del escrito; si un dato falta, deja el marcador [•] como hasta ahora)';

/**
 * Renders what was read as one block, or nothing at all.
 *
 * Empty when no attachment was read: an empty header would be a slot, and a
 * model fills slots — the same lesson `renderJurisprudencia` learned the day
 * a draft cited a providencia that does not exist. The files that could not
 * be read are listed with their reason so the model does not assume the
 * comparendo it was promised is in the text.
 */
export const renderBloqueAdjuntos = (leidos: AdjuntoLeido[]): string => {
  const legibles = leidos.filter((l) => l.ok && l.texto);
  if (legibles.length === 0) return '';

  const cuerpo = leidos
    .map((l, i) => {
      const cabecera = `── Adjunto ${i + 1}: ${l.nombre} (${l.clase === 'imagen' ? 'imagen' : 'documento'}${
        l.ok ? `, ${l.caracteres.toLocaleString('es-CO')} caracteres` : ''
      }) ──`;
      return l.ok && l.texto ? `${cabecera}\n${l.texto}` : `${cabecera}\nNO SE PUDO LEER (${l.motivo ?? 'sin motivo'}): no asumas su contenido.`;
    })
    .join('\n\n');

  return `${ENCABEZADO_BLOQUE}\n\n${cuerpo}`;
};

/** «Leyendo 2 adjuntos…» — the line streamed before the work starts. */
export const mensajeInicioLectura = (n: number): string =>
  n === 1 ? 'Leyendo 1 adjunto…' : `Leyendo ${n} adjuntos…`;

/**
 * «Adjuntos leídos: comparendo.pdf (1.204 caracteres), foto.jpg (datos: placa,
 * fecha, lugar); no leídos: anexo.pdf (PDF ilegible)». One line, so it fits
 * the execution console the lawyer already watches.
 */
export const resumenDeLectura = (leidos: AdjuntoLeido[]): string => {
  const ok = leidos.filter((l) => l.ok);
  const mal = leidos.filter((l) => !l.ok);
  const describir = (l: AdjuntoLeido): string => {
    if (l.clase === 'imagen') {
      return l.datos && l.datos.length > 0
        ? `${l.nombre} (datos: ${l.datos.join(', ')})`
        : `${l.nombre} (${l.caracteres.toLocaleString('es-CO')} caracteres, sin datos estructurados)`;
    }
    return `${l.nombre} (${l.caracteres.toLocaleString('es-CO')} caracteres${l.motivo ? `, ${l.motivo}` : ''})`;
  };
  const partes: string[] = [];
  if (ok.length > 0) partes.push(`Adjuntos leídos: ${ok.map(describir).join(', ')}`);
  if (mal.length > 0) partes.push(`no leídos: ${mal.map((l) => `${l.nombre} (${l.motivo ?? 'sin motivo'})`).join(', ')}`);
  if (partes.length === 0) return 'Sin adjuntos leídos.';
  return partes.join('; ') + '.';
};
