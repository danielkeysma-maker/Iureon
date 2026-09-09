/**
 * El TÍTULO DE TRABAJO, del lado de la pantalla.
 *
 * Espejo de `backend/src/modules/catalog/tituloDeTrabajo.ts`, y espejo a la
 * fuerza: el navegador no puede importar del backend. Lo que se copia son tres
 * líneas sin lógica —un prefijo y dos cortes de cadena—, y `check:tipo`
 * comprueba que las dos copias digan lo mismo, porque el día que se separen el
 * escrito saldría marcado y la pantalla no, o al revés.
 *
 * QUÉ MARCA. Que a ese escrito nadie le puso nombre de actuación: lo que se ve
 * es una DESCRIPCIÓN de lo que el escrito debe lograr, escrita por el abogado.
 * No es una figura del derecho, no tiene artículo, no tiene término y no tiene
 * autoridad — y por eso la marca tiene que viajar hasta donde se lee el nombre.
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
