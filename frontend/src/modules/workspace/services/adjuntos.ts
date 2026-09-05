import { uploadFileToStorage } from '../../documents/services/storageUpload';
import { archivoABase64 } from './review.api';

/**
 * Adjuntos del taller de redacción: lo que viaja con la petición de generar.
 *
 * ─── EL PROBLEMA QUE ESTO CIERRA ────────────────────────────────────────────
 * El abogado adjuntaba el comparendo y el escrito salía con [•] donde ya
 * estaban la placa, el número y el lugar: los archivos se listaban y la
 * petición llevaba solo el prompt. Ahora cada archivo se convierte en algo
 * que el servidor puede leer — base64 dentro del cuerpo, o una clave de B2
 * para lo que no cabe — y el servidor lo lee ANTES de llamar a los motores.
 *
 * ─── POR QUÉ HAY DOS CAMINOS Y UN PRESUPUESTO DE CUERPO ─────────────────────
 * Vercel rechaza cuerpos de más de 4,5 MB y base64 infla un 33%. Con varios
 * adjuntos no basta mirar cada archivo: dos PDF de 2 MB caben cada uno y
 * juntos no. Por eso el reparto se decide sobre el TOTAL que ya va en el
 * cuerpo — lo que no quepa sube directo a B2 con la misma ayuda que usa la
 * revisión de escritos, y el servidor lo borra antes de responder.
 */

/** Hasta 8 archivos: una demanda con sus anexos, no un expediente entero. */
export const MAX_ADJUNTOS = 8;
/** Suma de todos los archivos tal como los eligió el abogado. */
export const MAX_BYTES_TOTAL = 20 * 1024 * 1024;
/** Un documento: una tutela con anexos escaneados. Igual que la revisión. */
export const MAX_BYTES_DOCUMENTO = 15 * 1024 * 1024;
/** Una imagen DESPUÉS de reducirla: más que esto no es una foto, es un escaneo. */
export const MAX_BYTES_IMAGEN = 6 * 1024 * 1024;
/** Base64 que cabe en un cuerpo de Vercel dejando sitio al prompt y al borrador. */
export const PRESUPUESTO_CUERPO_BASE64 = 3_300_000;
/** Lado mayor al que se reduce una foto: suficiente para leer un comparendo. */
export const LADO_MAXIMO_IMAGEN = 2000;
export const CALIDAD_JPEG = 0.85;

export const EXTENSIONES_ACEPTADAS = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*';

export type EstadoDeAdjunto = 'listo' | 'leyendo' | 'enviado' | 'error';

/** Un archivo elegido por el abogado, con su estado para la lista. */
export interface ArchivoAdjunto {
  id: string;
  file: File;
  name: string;
  size: string;
  esImagen: boolean;
  estado: EstadoDeAdjunto;
  /** Qué pasó, cuando el estado lo pide (error) o ayuda (subiendo · 40%). */
  detalle?: string;
}

/** Lo que va en el cuerpo por cada adjunto. Exactamente uno de los dos payloads. */
export interface AdjuntoParaEnviar {
  nombre: string;
  tipo: string;
  contentBase64?: string;
  storageKey?: string;
}

const RE_IMAGEN_MIME = /^image\//i;
const RE_IMAGEN_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const RE_DOCUMENTO_EXT = /\.(pdf|docx?|txt)$/i;

export const esArchivoImagen = (file: Pick<File, 'type' | 'name'>): boolean =>
  RE_IMAGEN_MIME.test(file.type) || (!file.type && RE_IMAGEN_EXT.test(file.name));

export const formatoMb = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Decide si un archivo entra a la lista, y por qué no.
 *
 * Se comprueba al elegir, no al generar: un rechazo al pulsar «Generar» tras
 * escribir la instrucción es el peor momento para enterarse. Los adjuntos ya
 * listados cuentan para el cupo y el total.
 */
export const admitirArchivo = (
  file: Pick<File, 'type' | 'name' | 'size'>,
  yaListados: Pick<ArchivoAdjunto, 'file'>[]
): { ok: true } | { ok: false; motivo: string } => {
  if (yaListados.length >= MAX_ADJUNTOS) return { ok: false, motivo: `Máximo ${MAX_ADJUNTOS} adjuntos por escrito.` };
  const imagen = esArchivoImagen(file);
  if (!imagen && !RE_DOCUMENTO_EXT.test(file.name)) {
    return { ok: false, motivo: 'Solo se leen PDF, Word (.doc, .docx), texto e imágenes.' };
  }
  if (!imagen && file.size > MAX_BYTES_DOCUMENTO) {
    return { ok: false, motivo: `Supera ${formatoMb(MAX_BYTES_DOCUMENTO)}. Quite anexos o divídalo.` };
  }
  const total = yaListados.reduce((suma, a) => suma + a.file.size, 0) + file.size;
  if (total > MAX_BYTES_TOTAL) {
    return { ok: false, motivo: `Entre todos los adjuntos no pueden pasar de ${formatoMb(MAX_BYTES_TOTAL)}.` };
  }
  return { ok: true };
};

/**
 * Reparte los adjuntos entre cuerpo y almacenamiento con el presupuesto total.
 *
 * Pura para poder comprobarla: recibe tamaños en bytes de base64 y devuelve,
 * por índice, por dónde viaja cada uno. El orden es el del abogado; el primero
 * que no cabe va al almacén y NO desplaza a los que vienen detrás si estos sí
 * caben — un archivo pequeño no debe pagar el viaje largo por culpa de uno
 * grande que lo precede.
 */
export const repartirPorCuerpo = (
  tamanosBase64: number[],
  presupuesto = PRESUPUESTO_CUERPO_BASE64
): Array<'cuerpo' | 'almacen'> => {
  let usado = 0;
  return tamanosBase64.map((n) => {
    if (usado + n <= presupuesto) {
      usado += n;
      return 'cuerpo';
    }
    return 'almacen';
  });
};

/** Bytes → caracteres base64 (cada 3 bytes son 4 caracteres, con relleno). */
export const tamanoBase64 = (bytes: number): number => Math.ceil(bytes / 3) * 4;

/**
 * Reduce una foto a JPEG de lado máximo 2000 px con el canvas del navegador.
 *
 * Una foto de teléfono pesa 4-12 MB y mide 4000 px: el modelo de visión no
 * lee mejor con más, y el cuerpo sí lo paga. HEIC entra solo si el navegador
 * lo decodifica (Safari sí, Chrome no): si `createImageBitmap` falla, se
 * informa, no se envía algo que el servidor tampoco podrá leer.
 */
export const reducirImagen = async (file: File): Promise<File> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('El navegador no puede leer esta imagen (¿HEIC?). Conviértala a JPG o PNG.');
  }
  try {
    const escala = Math.min(1, LADO_MAXIMO_IMAGEN / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('El navegador no pudo preparar la imagen.');
    // Fondo blanco: un PNG con transparencia se volvería negro al pasar a JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD_JPEG));
    if (!blob) throw new Error('El navegador no pudo convertir la imagen.');
    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre, { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
};

/**
 * Convierte la lista en lo que viaja, avisando por archivo.
 *
 * Primero se preparan todos (imágenes reducidas, tamaños conocidos), después
 * se reparte con el presupuesto, y solo entonces se lee o se sube. Un archivo
 * que falla no detiene a los demás: se marca con su motivo y el escrito sale
 * con lo que sí se pudo leer, que es lo que el servidor también hace.
 */
export const prepararAdjuntos = async (
  archivos: ArchivoAdjunto[],
  onEstado: (id: string, estado: EstadoDeAdjunto, detalle?: string) => void
): Promise<AdjuntoParaEnviar[]> => {
  const listos: Array<{ a: ArchivoAdjunto; file: File } | null> = await Promise.all(
    archivos.map(async (a) => {
      onEstado(a.id, 'leyendo');
      try {
        const file = a.esImagen ? await reducirImagen(a.file) : a.file;
        if (a.esImagen && file.size > MAX_BYTES_IMAGEN) {
          throw new Error(`La imagen sigue pesando ${formatoMb(file.size)} tras reducirla (máximo ${formatoMb(MAX_BYTES_IMAGEN)}).`);
        }
        return { a, file };
      } catch (err) {
        onEstado(a.id, 'error', err instanceof Error ? err.message : 'No se pudo preparar.');
        return null;
      }
    })
  );

  const validos = listos.filter((x): x is { a: ArchivoAdjunto; file: File } => x !== null);
  const rutas = repartirPorCuerpo(validos.map(({ file }) => tamanoBase64(file.size)));

  const enviados = await Promise.all(
    validos.map(async ({ a, file }, i): Promise<AdjuntoParaEnviar | null> => {
      try {
        const tipo = file.type || (a.esImagen ? 'image/jpeg' : '');
        if (rutas[i] === 'cuerpo') {
          const contentBase64 = await archivoABase64(file);
          onEstado(a.id, 'enviado');
          return { nombre: file.name, tipo, contentBase64 };
        }
        const storageKey = await uploadFileToStorage(
          file,
          'adjuntos',
          (p) => onEstado(a.id, 'leyendo', `subiendo · ${p}%`),
          file.name
        );
        onEstado(a.id, 'enviado');
        return { nombre: file.name, tipo, storageKey };
      } catch (err) {
        onEstado(a.id, 'error', err instanceof Error ? err.message : 'No se pudo enviar.');
        return null;
      }
    })
  );

  return enviados.filter((x): x is AdjuntoParaEnviar => x !== null);
};

/*
 * ─── LA ENTREGA AL FLUJO DE GENERACIÓN ──────────────────────────────────────
 *
 * El panel prepara los adjuntos y `useLegalAgentWorkflow` arma la petición,
 * pero entre los dos está App, que envuelve `handleSendPrompt` en una función
 * de UN argumento y hoy la edita otro autor. Un segundo parámetro no pasaría.
 * Así que el panel deja aquí lo preparado justo antes de llamar y el hook lo
 * recoge en la misma vuelta del evento: `set` y `take` ocurren en el mismo
 * tick, sin render entre medias, y `take` vacía para que una generación sin
 * adjuntos nunca herede los de la anterior.
 */
let pendientes: AdjuntoParaEnviar[] = [];

export const adjuntosPendientes = {
  set(lista: AdjuntoParaEnviar[]): void {
    pendientes = lista;
  },
  take(): AdjuntoParaEnviar[] {
    const lista = pendientes;
    pendientes = [];
    return lista;
  }
};
