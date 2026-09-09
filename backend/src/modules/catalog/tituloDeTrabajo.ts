/**
 * El TÍTULO DE TRABAJO: cómo se llama un escrito al que nadie le puso nombre.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * «Ninguna de estas: escribir el nombre…» resolvió el caso de la actuación que
 * el catálogo no trae, y falla justo para quien no sabe cómo se llama — que es
 * el abogado para el que se construyó todo esto. Exigirle un nombre no mejora
 * el escrito: lo que Redacción consume de una ficha son las secciones
 * obligatorias, la autoridad, el fundamento y el término, y sin ficha ningún
 * nombre —tecleado o propuesto— aporta ninguno de los cuatro. Lo único que
 * consigue el campo obligatorio es empujar a inventarlo.
 *
 * ─── POR QUÉ ES UN PREFIJO Y NO UNA COLUMNA ─────────────────────────────────
 *
 * `firm_actuaciones` no tiene una columna que diga «esto no es el nombre de una
 * figura», y añadirla exige una migración. El prefijo viaja dentro del propio
 * `exact_name`, así que la marca llega SOLA a todos los sitios donde ese nombre
 * ya viajaba: el desplegable, la barra de procedencia del borrador, la lista de
 * Catálogo, las instrucciones del motor y el título del documento. Una columna
 * nueva habría dejado esos cinco sitios pintando el título como si fuera una
 * denominación jurídica hasta que alguien los tocara uno por uno.
 *
 * ─── LA LÍNEA QUE NO SE CRUZA ───────────────────────────────────────────────
 *
 * «Recurso de reposición» es una figura del derecho: tiene su artículo, su
 * término y su autoridad, y bautizar así un escrito que nadie verificó es
 * afirmar las tres cosas de un golpe. El título de trabajo dice qué se busca
 * —«que se levante el embargo sobre un bien inembargable»— y no dice qué es.
 * Lo escribe el abogado con sus palabras; ningún modelo bautiza nada.
 */

/**
 * Va delante del objetivo, con el guion largo del sistema.
 *
 * `normalizarNombre` borra la puntuación al construir el identificador, así que
 * el prefijo no ensucia el slug ni puede chocar con el de una ficha publicada.
 */
export const PREFIJO_TITULO_DE_TRABAJO = 'Sin nombre — ';

/** Lo que le queda al objetivo dentro del límite de 120 del nombre. */
export const MAX_OBJETIVO = 120 - PREFIJO_TITULO_DE_TRABAJO.length;

/** Ni una etiqueta de tres palabras ni un párrafo: tiene que decir qué se logra. */
export const MIN_OBJETIVO = 15;

export const tituloDeTrabajo = (objetivo: string): string =>
  `${PREFIJO_TITULO_DE_TRABAJO}${objetivo.trim().replace(/\s+/g, ' ')}`;

export const esTituloDeTrabajo = (exactName: string): boolean =>
  exactName.trimStart().startsWith(PREFIJO_TITULO_DE_TRABAJO);

/** El objetivo que escribió el abogado, sin la marca. */
export const objetivoDelTitulo = (exactName: string): string =>
  exactName.trimStart().slice(PREFIJO_TITULO_DE_TRABAJO.length).trim();
