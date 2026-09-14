import type { RequiredSection } from '../../catalog/types';

/**
 * Qué secciones de la ficha aparecen en el escrito, y en qué párrafo.
 *
 * Funciones puras y sin React, para que `check:secciones-escrito` las pruebe sin
 * montar el papel.
 *
 * ─── LO QUE SE AFIRMA, Y LO QUE NO ─────────────────────────────────────────
 *
 * Se busca el RÓTULO de cada sección dentro del texto, sin tildes, sin
 * mayúsculas y sin las marcas de negrita. No es una comprobación jurídica: una
 * sección puede estar escrita con otro encabezado, y una palabra suelta puede
 * coincidir con un rótulo. Por eso la columna dice «encontrada» o «no se
 * encontró el rótulo», nunca «cumplida» ni «falta la sección».
 *
 * ─── EL PÁRRAFO ES EL MISMO QUE PINTA EL PAPEL ─────────────────────────────
 *
 * El visor parte el texto por la línea en blanco y pinta un `<p>` por pedazo.
 * El índice que devuelve esto sale del MISMO corte (`parrafosDelEscrito`): si
 * se contara de otra forma, «ir al párrafo» llevaría a otro sitio y el abogado
 * leería un párrafo distinto del que se le anunció.
 */

export interface SeccionEnElEscrito {
  seccion: RequiredSection;
  encontrada: boolean;
  /** Índice del párrafo del papel donde aparece el rótulo por primera vez. */
  parrafo: number | null;
}

/** El corte del papel: un párrafo por cada bloque separado por línea en blanco. */
export const parrafosDelEscrito = (texto: string): string[] => texto.split('\n\n');

const normalizar = (s: string): string =>
  s
    .replace(/\*\*/g, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const seccionesEnElEscrito = (texto: string, secciones: readonly RequiredSection[]): SeccionEnElEscrito[] => {
  const parrafos = texto ? parrafosDelEscrito(texto).map(normalizar) : [];
  return secciones.map((seccion) => {
    const rotulo = normalizar(seccion.name);
    const indice = rotulo ? parrafos.findIndex((p) => p.includes(rotulo)) : -1;
    return { seccion, encontrada: indice !== -1, parrafo: indice === -1 ? null : indice };
  });
};
