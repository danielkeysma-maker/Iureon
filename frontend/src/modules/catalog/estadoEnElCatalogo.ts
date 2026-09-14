import type { Actuacion, TermStatus } from './types';
import { articuloDe, estadoDeLaFicha } from '../workspace/services/fichaEnLaLista';
import { esTituloDeTrabajo } from './tituloDeTrabajo';

/**
 * Cómo se lee una ficha en la lista del Catálogo, en funciones puras.
 *
 * El estado REUTILIZA `estadoDeLaFicha` de Redacción, y no por ahorrar líneas:
 * la doctrina tiene que decir lo mismo donde se elige la actuación y donde se
 * verifica. Si el catálogo dijera «comprobada» y Redacción «término
 * verificado», el abogado leería dos grados de certeza donde hay uno.
 *
 * `check:buscador-catalogo-cara` las prueba sin montar React.
 */

export type TonoEnElCatalogo = 'ok' | 'sin' | 'neutro';

export interface CeldaDelCatalogo {
  texto: string;
  tono: TonoEnElCatalogo;
}

export interface FilaDelCatalogo {
  /** El estado, con la palabra de la doctrina: «Término verificado», nunca «verificada» a secas. */
  estado: CeldaDelCatalogo;
  termino: CeldaDelCatalogo;
  /** El artículo tal como está escrito en el fundamento; en mono solo si es una cita. */
  fundamento: CeldaDelCatalogo & { mono: boolean };
  /** La marca de la ficha prestada, como la manda el servidor. */
  marca: string | null;
}

const conMayuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

/*
 * LA PRIMERA FRASE DEL TÉRMINO, NO EL PÁRRAFO.
 *
 * Varios términos del catálogo son párrafos de cuatro plazos distintos; dentro
 * de una fila dejan de leerse. La ficha lo publica entero, a un clic.
 */
export const primeraFrase = (descripcion: string | null | undefined): string => {
  const primera = (descripcion ?? '').split(/(?<=\.)\s|·/)[0].trim();
  return primera.length > 60 ? `${primera.slice(0, 57).trimEnd()}…` : primera;
};

export const filaDelCatalogo = (a: Actuacion): FilaDelCatalogo => {
  const estado = estadoDeLaFicha(a, esTituloDeTrabajo(a.exactName));
  const articulo = articuloDe(a.legalBasis);

  const termino: CeldaDelCatalogo = (() => {
    if (a.term.status === 'NO_CADUCA') return { texto: 'No caduca', tono: 'neutro' };
    if (a.term.status === 'NO_VERIFICADO') return { texto: a.firmDefined ? 'Sin término' : 'Sin verificar', tono: 'sin' };
    return { texto: primeraFrase(a.term.description) || 'Término verificado', tono: 'neutro' };
  })();

  /*
   * SIN ARTÍCULO SE DICE, NO SE COMPLETA. Y lo que la firma añadió sin norma no
   * tiene fundamento que mostrar: decirlo es la advertencia.
   */
  const fundamento = articulo
    ? { texto: articulo, tono: 'neutro' as const, mono: true }
    : a.firmDefined
      ? { texto: 'Sin norma verificada', tono: 'sin' as const, mono: false }
      : { texto: 'Sin artículo confirmado', tono: 'sin' as const, mono: false };

  return {
    estado: { texto: conMayuscula(estado.texto), tono: estado.tono },
    termino,
    fundamento,
    marca: a.porRemision?.marca ?? null
  };
};

export interface CensoDelCatalogo {
  total: number;
  /** De fábrica y verificado. Lo que la firma añadió se cuenta aparte. */
  conTerminoVerificado: number;
  noCaduca: number;
  sinVerificar: number;
  deLaFirma: number;
  ramas: number;
}

/*
 * LAS CIFRAS DEL ENCABEZADO SE CUENTAN. La maqueta imprime «883 actuaciones de
 * 28 ramas» y la entrada ya envejeció tres veces por copias escritas a mano.
 */
export const censoDelCatalogo = (actuaciones: readonly Actuacion[], ramas: readonly string[]): CensoDelCatalogo => {
  const con = (s: TermStatus) => actuaciones.filter((a) => a.term.status === s);
  return {
    total: actuaciones.length,
    conTerminoVerificado: con('VERIFICADO').filter((a) => !a.firmDefined).length,
    noCaduca: con('NO_CADUCA').length,
    sinVerificar: con('NO_VERIFICADO').length,
    deLaFirma: actuaciones.filter((a) => a.firmDefined).length,
    ramas: ramas.length
  };
};
