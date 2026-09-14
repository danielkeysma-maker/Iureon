import type { Actuacion } from '../../catalog/types';

/**
 * Cómo se pinta una ficha del catálogo en la lista de actuaciones de Redacción.
 *
 * Funciones puras y sin React, para que `check:redaccion-cara` las pruebe sin
 * montar la pantalla: el orden y el estado de la fila son lo que el abogado lee
 * antes de elegir, y equivocarlos no rompe nada visible.
 */

/*
 * EL ARTÍCULO SALE DEL FUNDAMENTO, NO SE INVENTA.
 *
 * La ficha no trae un campo «artículo»: trae `legalBasis`, que es la norma en
 * prosa —«Ley 1564 de 2012, art. 96»—. Se toma la primera mención de artículo
 * tal como está escrita, y si no hay ninguna la fila no pinta artículo. Nunca
 * se completa ni se normaliza un número.
 */
export const articuloDe = (legalBasis: string | null | undefined): string | null => {
  if (!legalBasis) return null;
  const m = legalBasis.match(/\bart(?:[ií]culos?|s?\.)\s*\d+[A-Za-z0-9-]*/i);
  return m ? m[0] : null;
};

export type TonoDeEstado = 'ok' | 'sin' | 'neutro';

export interface EstadoDeFicha {
  articulo: string | null;
  texto: string;
  tono: TonoDeEstado;
}

/*
 * EL ESTADO DE UNA FICHA, EN PALABRAS Y CON SU TONO.
 *
 * «término verificado» y no «verificado» a secas: lo que el catálogo marca
 * como VERIFICADO es el término, y el artículo que se pinta al lado sale del
 * fundamento. «art. 96 · verificado» afirmaría que alguien comprobó el
 * artículo, y ese dato no viaja en la fila.
 */
export const estadoDeLaFicha = (a: Actuacion, esTitulo: boolean): EstadoDeFicha => {
  if (a.firmDefined) {
    return {
      articulo: null,
      texto: esTitulo ? 'título de trabajo · no es el nombre de una figura' : 'de su firma, sin norma verificada',
      tono: 'sin'
    };
  }
  if (a.term.status === 'NO_VERIFICADO') return { articulo: null, texto: 'sin verificar', tono: 'sin' };
  if (a.term.status === 'NO_CADUCA') return { articulo: articuloDe(a.legalBasis), texto: 'no caduca', tono: 'neutro' };
  return { articulo: articuloDe(a.legalBasis), texto: 'término verificado', tono: 'ok' };
};

/*
 * ORDEN ALFABÉTICO EN ESPAÑOL, PARA ENCONTRAR SIN BUSCAR.
 *
 * La lista llegaba en el orden del catálogo, que es el de quien escribió las
 * fichas: nadie recuerda noventa nombres, y recorrerlos sin orden obliga a
 * leerlos todos. Se compara con la colación española y sensibilidad de base,
 * así las tildes y las mayúsculas no rompen el orden («Acción» antes de
 * «Apelación») y la «ñ» va después de la «n».
 *
 * Se ordena DENTRO de cada bloque: primero las fichas propias de la rama y
 * después las que llegan por remisión, que se pintan bajo su cabecera. Mezclar
 * los dos bloques partiría la cabecera en pedazos.
 *
 * Devuelve una copia: la lista viene del gancho compartido y mutarla la
 * reordenaría también para quien la lea después.
 */
export const compararEnEspanol = (a: string, b: string): number =>
  a.localeCompare(b, 'es', { sensitivity: 'base' });

export const ordenarParaLaLista = <T extends Pick<Actuacion, 'exactName' | 'porRemision'>>(lista: readonly T[]): T[] => {
  const propias = lista.filter((a) => !a.porRemision);
  const prestadas = lista.filter((a) => a.porRemision);
  const porNombre = (x: T, y: T) => compararEnEspanol(x.exactName, y.exactName);
  return [...propias.sort(porNombre), ...prestadas.sort(porNombre)];
};
