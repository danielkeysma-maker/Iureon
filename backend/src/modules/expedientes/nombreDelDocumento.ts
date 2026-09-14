/**
 * EL NOMBRE VISIBLE DE UN DOCUMENTO DEL EXPEDIENTE.
 *
 * ─── UNA SOLA FUENTE: `legal_documents.title` ──────────────────────────────
 *
 * Se revisó dónde vivía el nombre antes de construir el renombrado, y la
 * respuesta evitó una migración: la ingesta del expediente escribe el nombre
 * UNA vez, en `legal_documents.title`, y NO lo copia en los fragmentos
 * (`document_embeddings.file_name` queda nulo para los documentos de una
 * firma; esa columna solo la llenan el corpus de jurisprudencia y los
 * conceptos). Renombrar es, por tanto, una sola actualización sobre una sola
 * columna, sin reescribir cientos de fragmentos.
 *
 * Lo que sí estaba mal era la LECTURA: la búsqueda del expediente y el material
 * que se le entrega al motor rotulaban cada pasaje con `file_name`, que para
 * estos documentos es nulo. El abogado veía un identificador y el motor leía
 * «documento del caso». Ahora ambos resuelven el título por `document_id`, y
 * por eso un renombrado se ve de inmediato en los dos sitios.
 *
 * ─── LA CLAVE DEL ALMACENAMIENTO NO SE TOCA ────────────────────────────────
 *
 * La clave de B2 es interna: de ella dependen la descarga firmada y el borrado
 * del original. Renombrar un objeto en B2 es copiar y borrar, y un fallo a
 * mitad de camino dejaría la fila apuntando a nada. El nombre visible y la
 * clave son dos cosas distintas y así se quedan.
 *
 * Este archivo es puro —sin base ni red— para que su guarda pueda correr en
 * cualquier máquina.
 */

/** Tope del nombre, en caracteres. Suficiente para «Contestación de la demanda — Juzgado 3 Civil…». */
export const MAX_NOMBRE_DE_DOCUMENTO = 160;

export type CodigoDeNombreInvalido = 'MISSING_NOMBRE' | 'NOMBRE_LARGO' | 'NOMBRE_INVALIDO';

export type NombreValidado =
  | { ok: true; nombre: string }
  | { ok: false; code: CodigoDeNombreInvalido; message: string };

/*
 * Sin expresiones regulares, por la regla de la casa: una regex escrita desde
 * otro lenguaje puede perder sus escapes y seguir compilando sin coincidir con
 * nada. Aquí se compara por código de carácter, que no tiene escapes que perder.
 */
const BARRA = 47;
const CONTRABARRA = 92;
const esDeControl = (codigo: number): boolean => codigo < 32 || codigo === 127;

/**
 * Valida y limpia el nombre que propone el abogado.
 *
 * ─── POR QUÉ SE RECHAZA CADA COSA ──────────────────────────────────────────
 *
 * - VACÍO: un documento sin nombre no se puede reconocer en la lista.
 * - MÁS DE 160: rompe la fila de la lista y el rótulo que lee el motor.
 * - BARRAS: el nombre se parece a una ruta y sugiere carpetas que no existen;
 *   las carpetas de verdad se crean aparte.
 * - CARACTERES DE CONTROL: un salto de línea dentro del rótulo partiría el
 *   bloque de pasajes que recibe el motor, y un carácter invisible hace que dos
 *   nombres iguales en pantalla no lo sean en la base.
 *
 * ─── LA EXTENSIÓN NO SE EXIGE NI SE PROTEGE ────────────────────────────────
 *
 * El título nunca la llevó: la pantalla de indexar la quita del nombre del
 * archivo al proponerlo. El tipo real del original vive en `mime_type` y en la
 * clave de B2, que es de donde lo toma el visor. Si el abogado escribe «.pdf»
 * se respeta como parte del nombre; si no, nada se pierde.
 */
export const validarNombreDeDocumento = (valor: unknown): NombreValidado =>
  validarNombreVisible(valor, {
    vacio: 'El documento no se puede quedar sin nombre.',
    barras: 'El nombre no puede llevar barras. Para agrupar documentos, use una carpeta.'
  });

/**
 * Valida y limpia el nombre de una carpeta del expediente.
 *
 * ─── LAS MISMAS REGLAS QUE EL DOCUMENTO, Y POR EL MISMO NÚCLEO ─────────────
 *
 * Las carpetas aceptaban cualquier cosa que no fuera vacía. Las razones para
 * rechazar un nombre de documento valen igual aquí: un nombre de dos mil
 * caracteres rompe el árbol de la pantalla, un salto de línea parte la fila y
 * un carácter invisible hace que dos «Pruebas» iguales en pantalla no choquen en
 * el índice único de hermanas. La barra, además, haría creer que «Pruebas/
 * Testimonios» es una carpeta dentro de otra cuando no lo es.
 *
 * Por eso ambas funciones delegan en `validarNombreVisible` y solo difieren en
 * el texto que lee el abogado: una copia de la regla acabaría divergiendo.
 */
export const validarNombreDeCarpeta = (valor: unknown): NombreValidado =>
  validarNombreVisible(valor, {
    vacio: 'La carpeta no se puede quedar sin nombre.',
    barras:
      'El nombre de la carpeta no puede llevar barras. Para poner una carpeta dentro de otra, créela dentro de ella.'
  });

/** Los textos que cambian según lo que se nombra; los códigos y las reglas no cambian. */
interface TextosDelNombre {
  vacio: string;
  barras: string;
}

const validarNombreVisible = (valor: unknown, textos: TextosDelNombre): NombreValidado => {
  const limpio = typeof valor === 'string' ? valor.trim() : '';
  if (!limpio) {
    return { ok: false, code: 'MISSING_NOMBRE', message: textos.vacio };
  }

  /* Por puntos de código y no por unidades UTF-16: una tilde o un emoji cuentan como uno. */
  const caracteres = Array.from(limpio);
  if (caracteres.length > MAX_NOMBRE_DE_DOCUMENTO) {
    return {
      ok: false,
      code: 'NOMBRE_LARGO',
      message: `El nombre admite hasta ${MAX_NOMBRE_DE_DOCUMENTO} caracteres; el propuesto tiene ${caracteres.length}.`
    };
  }

  for (const c of caracteres) {
    const codigo = c.codePointAt(0) ?? 0;
    if (codigo === BARRA || codigo === CONTRABARRA) {
      return { ok: false, code: 'NOMBRE_INVALIDO', message: textos.barras };
    }
    if (esDeControl(codigo)) {
      return {
        ok: false,
        code: 'NOMBRE_INVALIDO',
        message: 'El nombre no puede llevar saltos de línea ni caracteres invisibles.'
      };
    }
  }

  return { ok: true, nombre: limpio };
};

/** Lo mínimo de un documento que hace falta para juzgar el repetido. */
export interface DocumentoConNombre {
  documentId: string;
  titulo: string;
  carpetaId: string | null;
}

const clave = (nombre: string): string => nombre.trim().toLowerCase();

/**
 * ¿Hay OTRO documento con ese nombre en el mismo sitio?
 *
 * ─── LA MISMA REGLA QUE LAS CARPETAS, A PROPÓSITO ──────────────────────────
 *
 * Las carpetas hermanas no pueden llamarse igual (índice único sobre
 * `lower(btrim(nombre))` por padre), porque dos «Pruebas» son indistinguibles
 * en pantalla. Con dos documentos «Poder» en la misma carpeta ocurre lo mismo:
 * el abogado abre uno creyendo abrir el otro. Por coherencia se rechaza igual:
 * mismo sitio, sin distinguir mayúsculas ni espacios de los extremos. En
 * carpetas distintas sí se permite, como con las carpetas.
 *
 * Renombrarse a sí mismo —corregir solo mayúsculas— no es repetido.
 *
 * Esta comprobación vive en la aplicación y no en un índice único porque
 * `legal_documents` no tiene columna de expediente (la pertenencia la dicen los
 * fragmentos) y porque los documentos indexados hasta hoy pueden traer ya
 * nombres repetidos: un índice nuevo fallaría al crearse sobre esos datos.
 */
export const nombreRepetidoEnCarpeta = (
  nombre: string,
  carpetaId: string | null,
  documentId: string,
  documentos: readonly DocumentoConNombre[]
): boolean => {
  const buscado = clave(nombre);
  return documentos.some(
    (d) => d.documentId !== documentId && (d.carpetaId ?? null) === (carpetaId ?? null) && clave(d.titulo) === buscado
  );
};

/**
 * El rótulo de un pasaje recuperado: el título vigente del documento.
 *
 * Se cae al `file_name` del fragmento solo cuando no hay título, que es el
 * caso del corpus compartido. `null` cuando no hay ninguno: quien rinde decide
 * el texto de reemplazo.
 */
export const rotuloDelPasaje = (
  titulos: ReadonlyMap<string, string>,
  documentId: string | null | undefined,
  fileName: string | null | undefined
): string | null => (documentId ? titulos.get(documentId) : undefined) ?? fileName ?? null;
