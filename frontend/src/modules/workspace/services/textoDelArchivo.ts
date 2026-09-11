import { cargarPdfjs } from './pdfEnPantalla';
import { claseDelOriginal, textoPlanoDelOriginal } from './originalDelEscrito';

/**
 * El TEXTO de un archivo, leído en el navegador.
 *
 * ─── POR QUÉ EN EL NAVEGADOR Y NO EN EL SERVIDOR ────────────────────────────
 *
 * Porque quien necesita este texto todavía no está pidiendo nada cobrable. Dos
 * pantallas lo necesitan antes de gastar un peso:
 *
 *  · Orientación, para que el abogado adjunte el oficio que le llegó en vez de
 *    volver a contar por escrito lo que ya está escrito ahí.
 *  · La revisión, para proponer QUÉ ACTUACIÓN es el escrito. Nadie que sube un
 *    documento a revisar sabe de antemano cómo se llama en el catálogo, y
 *    hasta hoy había que decirlo antes de poder subirlo.
 *
 * Mandar el archivo al servidor solo para leerlo costaría una subida entera
 * antes de que el abogado decida siquiera continuar. El navegador ya trae lo
 * necesario —`pdfjs-dist` para el PDF, `mammoth` para el Word—, y los dos se
 * cargan bajo demanda, así que el que solo escribe hechos no paga nada.
 *
 * ─── LO QUE NO HACE ─────────────────────────────────────────────────────────
 *
 * No reconoce imágenes. Un PDF escaneado no tiene texto, y aquí eso se dice
 * con esas palabras en vez de devolver una cadena vacía que el resto de la
 * pantalla interpretaría como «archivo ilegible» o, peor, como «sin hechos».
 */

/** Con esto sobra para clasificar y para orientar; el resto solo alarga el prompt. */
const MAX_CARACTERES = 60_000;
/** Un escrito judicial no cabe en menos; por debajo casi siempre es un escaneo. */
const MINIMO_UTIL = 200;
/** Leer un expediente de 300 páginas para clasificarlo es tiempo regalado. */
const MAX_PAGINAS = 40;

/**
 * ─── LOS DOS TRABAJOS DE ESTE ARCHIVO, Y POR QUÉ NO SE DUPLICÓ ─────────────
 *
 * Los topes de arriba existen para CLASIFICAR: leer cuarenta páginas basta
 * para proponer qué actuación es un escrito, y leer trescientas para eso es
 * tiempo regalado. Ese razonamiento sigue siendo correcto.
 *
 * Pero desde que el expediente se puede INDEXAR, el mismo lector tiene un
 * segundo trabajo en el que esos topes son justo lo contrario de lo que hace
 * falta: ahí el documento entero ES el producto, y recortarlo a sesenta mil
 * caracteres indexaría el primer quinto del expediente y dejaría el resto
 * fuera —en silencio, porque las búsquedas responderían igual—.
 *
 * Se parametrizan los límites en vez de escribir un segundo lector. Dos
 * lectores de PDF en la misma casa se desincronizan: el arreglo del `hasEOL`
 * que hace legibles los renglones, o el de destruir la TAREA y no el
 * documento para no dejar un trabajador vivo por archivo, se aplicarían a uno
 * y no al otro.
 */
export interface LimitesDeLectura {
  maxCaracteres: number;
  maxPaginas: number;
}

/** Para indexar: el documento entero. Los topes se dejan altos, no infinitos. */
export const PARA_INDEXAR: LimitesDeLectura = { maxCaracteres: 4_000_000, maxPaginas: 2_000 };

export type TextoDelArchivo =
  | { ok: true; texto: string; caracteres: number; recortado: boolean }
  | { ok: false; motivo: string };

const recortar = (bruto: string, maxCaracteres = MAX_CARACTERES): TextoDelArchivo => {
  const limpio = bruto.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (limpio.length < MINIMO_UTIL) {
    return {
      ok: false,
      motivo:
        'El archivo no trae texto que se pueda leer. Si es un PDF escaneado o una foto, son imágenes: copie y pegue el texto en su lugar.'
    };
  }
  const recortado = limpio.length > maxCaracteres;
  return { ok: true, texto: recortado ? limpio.slice(0, maxCaracteres) : limpio, caracteres: limpio.length, recortado };
};

const textoDelPdf = async (bytes: ArrayBuffer, maxPaginas = MAX_PAGINAS): Promise<string> => {
  const pdfjs = await cargarPdfjs();
  /*
   * La tarea se guarda porque es ELLA la que se destruye, no el documento: es
   * la dueña del proceso de trabajo, y soltar solo el documento dejaría vivo un
   * trabajador por cada archivo que alguien adjunte y descarte.
   */
  const tarea = pdfjs.getDocument({
    data: bytes.slice(0),
    standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`
  });
  const documento = await tarea.promise;
  try {
    const paginas: string[] = [];
    for (let n = 1; n <= Math.min(documento.numPages, maxPaginas); n += 1) {
      const contenido = await (await documento.getPage(n)).getTextContent();
      /*
       * `hasEOL` es lo único que distingue un renglón nuevo de una palabra
       * siguiente. Sin él, pdf.js entrega los fragmentos seguidos y el escrito
       * llega como un párrafo único de miles de caracteres: legible para el
       * motor, ilegible para el abogado que lo ve en el cuadro de hechos.
       */
      paginas.push(
        contenido.items
          .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
          .join('')
      );
    }
    return paginas.join('\n\n');
  } finally {
    await tarea.destroy();
  }
};

const textoDelDocx = async (bytes: ArrayBuffer): Promise<string> => {
  const mammoth = await import('mammoth/mammoth.browser.min.js');
  const extraer = mammoth.extractRawText ?? mammoth.default.extractRawText;
  const resultado = await extraer({ arrayBuffer: bytes });
  return resultado.value ?? '';
};

/**
 * Lee el archivo y devuelve su texto, o el motivo por el que no se pudo.
 *
 * Nunca lanza: quien lo llama está en medio de un formulario y necesita poder
 * decirle al abogado qué pasó sin perder lo que ya había escrito.
 */
export const textoDelArchivo = async (
  archivo: File,
  limites: LimitesDeLectura = { maxCaracteres: MAX_CARACTERES, maxPaginas: MAX_PAGINAS }
): Promise<TextoDelArchivo> => {
  const clase = claseDelOriginal(archivo.type, archivo.name);
  if (clase === 'imagen') {
    return { ok: false, motivo: 'Una imagen no trae texto. Copie y pegue lo que dice el documento.' };
  }
  try {
    const bytes = await archivo.arrayBuffer();
    if (clase === 'pdf') return recortar(await textoDelPdf(bytes, limites.maxPaginas), limites.maxCaracteres);
    if (clase === 'docx') return recortar(await textoDelDocx(bytes), limites.maxCaracteres);
    if (clase === 'texto') return recortar(textoPlanoDelOriginal(bytes), limites.maxCaracteres);
    return {
      ok: false,
      motivo: 'De este formato no se puede leer el texto aquí. Guárdelo como PDF, Word o texto, o péguelo.'
    };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : 'No se pudo leer el archivo.' };
  }
};
