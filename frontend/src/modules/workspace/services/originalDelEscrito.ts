import DOMPurify from 'dompurify';
import { uploadFileToStorage } from '../../documents/services/storageUpload';
import { reviewApi, type RespuestaDelOriginal } from './review.api';

/**
 * El archivo del escrito tal como se subió: traerlo y prepararlo para verlo.
 *
 * ─── POR QUÉ EXISTE ESTE CAMINO ─────────────────────────────────────────────
 *
 * El taller trabaja sobre el TEXTO extraído, y esa extracción tira justo lo que
 * un litigante lee primero: qué está en negrita, qué es un título, qué es una
 * tabla y qué es una nota al pie. Para revisar bien hay que ver el documento
 * como lo verá el juez. Aquí se resuelve de dónde salen los bytes y en qué se
 * convierten para pintarlos.
 *
 * ─── LOS BYTES VIENEN DE DOS SITIOS ─────────────────────────────────────────
 *
 * Del archivo que el abogado acaba de elegir, que está en memoria; o del
 * almacenamiento, con una URL firmada que el servidor entrega y que caduca a
 * los quince minutos. Nunca de la base de datos: un PDF de quince megas en una
 * columna convertiría cada lectura de la lista en una descarga.
 *
 * ─── LO QUE SE PIERDE Y SE DICE ─────────────────────────────────────────────
 *
 * El PDF se pinta como es, página por página, porque su formato ES la página.
 * Un `.docx` se convierte a HTML y conserva negritas, cursivas, subrayados,
 * títulos, listas, tablas, imágenes y notas al pie; NO conserva centrados,
 * tipografías ni saltos de página, porque la conversión es semántica y no una
 * maquetación. El visor lo declara en vez de dejar creer que lo muestra todo.
 * Un `.doc` de Word 97 no se convierte: es un binario OLE y no hay lector de
 * su formato en el navegador.
 */

export type ClaseDeOriginal = 'pdf' | 'docx' | 'imagen' | 'texto' | 'sinVisor';

/** El techo de la revisión: una tutela con sus anexos escaneados. */
export const MAX_BYTES_ORIGINAL = 15 * 1024 * 1024;

/**
 * Con qué visor se abre. Manda el tipo declarado y, cuando calla o miente
 * —el navegador deja el tipo vacío en muchos `.docx`—, la extensión.
 */
export const claseDelOriginal = (tipo: string, nombre: string): ClaseDeOriginal => {
  const t = (tipo || '').toLowerCase();
  const ext = (nombre || '').toLowerCase().split('.').pop() ?? '';
  if (t === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (t.includes('wordprocessingml') || ext === 'docx') return 'docx';
  if (t.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'imagen';
  if (t.startsWith('text/') || ['txt', 'md'].includes(ext)) return 'texto';
  return 'sinVisor';
};

/** Por qué un archivo no tiene visor, dicho para la pantalla. */
export const porQueNoHayVisor = (tipo: string, nombre: string): string => {
  const ext = (nombre || '').toLowerCase().split('.').pop() ?? '';
  if (ext === 'doc' || tipo === 'application/msword') {
    return 'Es un documento de Word 97 (.doc), un formato binario que el navegador no sabe abrir. Guárdelo como .docx o expórtelo a PDF y vuelva a subirlo; el texto revisado no cambia.';
  }
  return `No hay visor para archivos de tipo ${tipo || `«.${ext}»`}. Puede descargarlo y abrirlo en su equipo.`;
};

export const formatoDeBytes = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** El archivo listo para pintar: sus bytes, su nombre y con qué visor se abre. */
export interface OriginalCargado {
  nombre: string;
  tipo: string;
  bytes: ArrayBuffer;
  clase: ClaseDeOriginal;
  /** Si vive en el almacenamiento de la firma o solo en esta pestaña. */
  conservado: boolean;
}

/** Lo que el taller sabe del original antes de pedirlo. */
export type FuenteDelOriginal =
  /** El archivo que el abogado acaba de elegir: está en memoria, no hace falta red. */
  | { de: 'sesion'; file: File }
  /** Hay que preguntarle al servidor dónde está. */
  | { de: 'servidor'; revisionId: string };

export type EstadoDelOriginal =
  | { hay: true; original: OriginalCargado }
  | { hay: false; motivo: string; puedeConservarlo: boolean };

/**
 * Descarga los bytes desde la URL firmada.
 *
 * Con progreso por XHR y no con `fetch`: un escrito escaneado pesa diez megas
 * y, con el enlace de una oficina, la diferencia entre «45%» y un panel mudo
 * es la diferencia entre esperar y creer que se colgó. Es la misma razón por
 * la que la subida usa XHR.
 */
export const descargarOriginal = (url: string, onProgreso?: (porcentaje: number) => void): Promise<ArrayBuffer> =>
  new Promise((resolver, rechazar) => {
    const peticion = new XMLHttpRequest();
    peticion.open('GET', url, true);
    peticion.responseType = 'arraybuffer';
    peticion.onprogress = (evento) => {
      if (evento.lengthComputable && onProgreso) onProgreso(Math.min(99, Math.round((evento.loaded / evento.total) * 100)));
    };
    peticion.onload = () => {
      if (peticion.status >= 200 && peticion.status < 300 && peticion.response) {
        resolver(peticion.response as ArrayBuffer);
        return;
      }
      rechazar(new Error(`El almacenamiento no entregó el archivo (${peticion.status}). El enlace pudo caducar; vuelva a abrir la pestaña.`));
    };
    peticion.onerror = () => rechazar(new Error('Se perdió la conexión mientras se traía el archivo original.'));
    peticion.send();
  });

/** El original de una revisión, o el motivo por el que no está. */
export const cargarOriginal = async (fuente: FuenteDelOriginal, onProgreso?: (porcentaje: number) => void): Promise<EstadoDelOriginal> => {
  if (fuente.de === 'sesion') {
    const bytes = await fuente.file.arrayBuffer();
    return {
      hay: true,
      original: {
        nombre: fuente.file.name,
        tipo: fuente.file.type,
        bytes,
        clase: claseDelOriginal(fuente.file.type, fuente.file.name),
        conservado: false
      }
    };
  }

  const respuesta: RespuestaDelOriginal = await reviewApi.originalDeRevision(fuente.revisionId);
  if (!respuesta.disponible) {
    return { hay: false, motivo: respuesta.motivo, puedeConservarlo: respuesta.puedeConservarlo };
  }
  const bytes = await descargarOriginal(respuesta.url, onProgreso);
  return {
    hay: true,
    original: {
      nombre: respuesta.nombre,
      tipo: respuesta.tipo,
      bytes,
      clase: claseDelOriginal(respuesta.tipo, respuesta.nombre),
      conservado: true
    }
  };
};

/**
 * Sube el archivo al almacenamiento de la firma y lo ata a la revisión.
 *
 * Va SIEMPRE por almacenamiento, aunque el archivo sea pequeño: mandarlo en el
 * cuerpo obligaría al servidor a devolverlo a B2 dentro de la función, y una
 * función de Vercel ni acepta cuerpos de más de 4,5 MB ni tiene reloj que
 * gastar en una subida que el navegador ya sabe hacer. Es el mismo camino del
 * audio de las audiencias.
 */
export const conservarOriginalDeRevision = async (
  revisionId: string,
  file: File,
  onProgreso?: (porcentaje: number) => void
): Promise<void> => {
  const storageKey = await uploadFileToStorage(file, 'revisiones', onProgreso, 'el escrito');
  await reviewApi.adjuntarOriginal(revisionId, {
    storageKey,
    tipo: file.type || tipoPorNombre(file.name),
    bytes: file.size
  });
};

/** Cuando el navegador calla el tipo —pasa con muchos `.docx`—, lo dice la extensión. */
export const tipoPorNombre = (nombre: string): string => {
  const ext = (nombre || '').toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'txt') return 'text/plain';
  return 'application/octet-stream';
};

/*
 * ─── EL WORD A HTML ─────────────────────────────────────────────────────────
 *
 * El mapa añade lo que mammoth no trae de fábrica y un escrito judicial sí
 * usa: el subrayado —que en una demanda marca el nombre de la parte y el
 * radicado— y el tachado de una corrección. Lo demás (títulos, listas, tablas,
 * notas al pie, negritas y cursivas) ya lo convierte por defecto.
 */
const MAPA_DE_ESTILOS = ['u => u', 'strike => s', "p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh"];

/**
 * El HTML se sanea SIEMPRE, y no por costumbre: el `.docx` lo escribió alguien
 * de fuera de la firma —la contraparte, un juzgado, un cliente— y va a pintarse
 * dentro de la sesión de un abogado. Fuera scripts, fuera hojas de estilo,
 * fuera marcos y formularios. Las imágenes del documento sí entran: mammoth las
 * incrusta como `data:` y son parte de la prueba.
 */
export const sanearHtmlDelOriginal = (html: string): string =>
  DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'style', 'link', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'base', 'meta'],
    FORBID_ATTR: ['style', 'onerror', 'onload', 'srcset'],
    ALLOW_DATA_ATTR: false
  });

export interface HtmlDelDocx {
  html: string;
  /** Lo que mammoth no supo convertir, dicho tal cual para no fingir fidelidad total. */
  avisos: string[];
}

/**
 * Convierte el `.docx` a HTML conservando su estructura.
 *
 * Se carga bajo demanda: el conversor pesa unos 620 KB y solo lo paga quien
 * abre un Word. La entrada es el paquete ya construido para el navegador —el
 * de Node lee el zip con `Buffer` y sin polyfill falla al abrir el archivo—.
 */
export const htmlDelDocx = async (bytes: ArrayBuffer): Promise<HtmlDelDocx> => {
  const mammoth = await import('mammoth/mammoth.browser.min.js');
  const convertir = mammoth.convertToHtml ?? mammoth.default.convertToHtml;
  const resultado = await convertir({ arrayBuffer: bytes }, { styleMap: MAPA_DE_ESTILOS, includeDefaultStyleMap: true });
  const avisos = [...new Set((resultado.messages ?? []).filter((m) => m.type === 'warning').map((m) => m.message))].slice(0, 6);
  return { html: sanearHtmlDelOriginal(resultado.value), avisos };
};

/** Un `.txt` como texto: se decodifica en UTF-8 y, si sale mojibake, en latin-1. */
export const textoPlanoDelOriginal = (bytes: ArrayBuffer): string => {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  const perdidos = (utf8.match(/�/g) ?? []).length;
  if (perdidos / Math.max(utf8.length, 1) <= 0.001) return utf8;
  return new TextDecoder('windows-1252').decode(bytes);
};
