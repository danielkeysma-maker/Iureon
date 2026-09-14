import type { TranscriptSegment } from './types';

/**
 * Lo que la pantalla de Audiencias dice con palabras, calculado sin React.
 *
 * Vive aparte de los componentes por la misma razón que `casoEnPantalla` en
 * Expedientes: cada frase de aquí es una afirmación sobre un acta judicial —
 * cuánta certeza hubo, cuánto falta revisar, cuánto admite el servidor— y una
 * afirmación así se prueba con datos, no mirando la pantalla.
 */

/**
 * Por debajo de este valor Deepgram se equivoca lo bastante como para que
 * citar sin volver a escuchar sea imprudente. Es el mismo umbral con que el
 * servidor calcula `fragmentosDudosos`: si divergieran, una intervención
 * llegaría con tramos dudosos y sin marca, o al revés.
 */
export const UMBRAL_DE_CERTEZA = 0.75;

export interface CertezaDeIntervencion {
  /** La intervención entera se marca. */
  baja: boolean;
  /** De 0 a 100, redondeado. Null cuando el proveedor no la midió. */
  porcentaje: number | null;
}

/**
 * La certeza es DE LA INTERVENCIÓN, no de sus palabras.
 *
 * La maqueta pinta «61 %» sobre tres palabras, y el proveedor no mide eso: da
 * una confianza por intervención (la más baja cuando se unen turnos
 * consecutivos) y sus tramos dudosos cubren enteras las emisiones bajo el
 * umbral. Un porcentaje sobre tres palabras sería una precisión que nadie
 * midió, en el texto que un abogado va a citar.
 *
 * Un transcrito sin `confianza` pero con tramos —guardado entre las dos
 * columnas— toma el tramo más bajo, que sigue siendo una medida real. Sin
 * ninguna de las dos no hay marca: «no se midió» no es «poco clara», y
 * advertirlo sería inventarle un problema a un transcrito viejo.
 */
export const certezaDeIntervencion = (
  segmento: Pick<TranscriptSegment, 'confianza' | 'fragmentosDudosos'>
): CertezaDeIntervencion => {
  const tramos = segmento.fragmentosDudosos ?? [];
  const valor =
    segmento.confianza !== undefined
      ? segmento.confianza
      : tramos.length > 0
        ? Math.min(...tramos.map((t) => t.confianza))
        : null;

  if (valor === null) return { baja: false, porcentaje: null };
  return { baja: valor < UMBRAL_DE_CERTEZA, porcentaje: Math.round(valor * 100) };
};

/** Cuántas intervenciones quedaron marcadas. Las que no se midieron no cuentan. */
export const conPocaCerteza = (
  segmentos: Array<Pick<TranscriptSegment, 'confianza' | 'fragmentosDudosos'>>
): number => segmentos.filter((s) => certezaDeIntervencion(s).baja).length;

const dos = (n: number): string => String(n).padStart(2, '0');

/**
 * 00:03:08, con horas siempre. Una audiencia pasa de la hora con frecuencia, y
 * una marca que cambia de forma a mitad del transcrito obliga a releer cuál es
 * cuál al citarla.
 */
export const marcaDeTiempo = (segundos: number | null): string => {
  if (segundos === null) return '';
  const total = Math.max(0, Math.floor(segundos));
  return `${dos(Math.floor(total / 3600))}:${dos(Math.floor((total % 3600) / 60))}:${dos(total % 60)}`;
};

/** «34 min», «1 h 12 min». Menos de medio minuto no se redondea a «0 min», que parece un archivo vacío. */
export const duracionEnPalabras = (segundos: number | null): string => {
  if (segundos === null || segundos <= 0) return '';
  const minutos = Math.round(segundos / 60);
  if (minutos === 0) return 'menos de 1 min';
  return minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
};

export const vocesEnPalabras = (n: number): string => `${n} ${n === 1 ? 'voz' : 'voces'}`;

export const intervencionesEnPalabras = (n: number): string =>
  `${n} ${n === 1 ? 'intervención' : 'intervenciones'}`;

export interface Revision {
  revisadas: number;
  total: number;
  entera: boolean;
  /** Para la barra: 0 a 100. */
  porcentaje: number;
  texto: string;
}

/**
 * La fracción contada de las marcas reales. Un transcrito sin intervenciones
 * no está «revisado entero»: no hay nada que leer, y decirlo en verde lo
 * confundiría con un acta lista.
 */
export const revisionDe = (segmentos: Array<Pick<TranscriptSegment, 'revisada'>>): Revision => {
  const total = segmentos.length;
  const revisadas = segmentos.filter((s) => s.revisada).length;
  const entera = total > 0 && revisadas === total;
  return {
    revisadas,
    total,
    entera,
    porcentaje: total === 0 ? 0 : Math.round((revisadas / total) * 100),
    texto: total === 0 ? 'Sin intervenciones' : entera ? 'Revisada entera' : `${revisadas} de ${total} revisadas`
  };
};

/**
 * «200 MB», «4,5 MB»: coma decimal y sin «.0» cuando el número es entero. Por
 * debajo de una décima no se redondea a «0 MB», que se lee como archivo vacío
 * justo cuando el abogado comprueba que eligió el correcto.
 */
export const megabytesEnPalabras = (bytes: number): string => {
  const mb = Math.round((bytes / (1024 * 1024)) * 10) / 10;
  if (mb === 0 && bytes > 0) return 'menos de 0,1 MB';
  return `${Number.isInteger(mb) ? String(mb) : String(mb).replace('.', ',')} MB`;
};

/**
 * El límite que se anuncia es el que el SERVIDOR informa y los formatos son
 * los que el código acepta. La maqueta dice «Hasta 500 MB · mp3, m4a, wav,
 * mp4», que no es el límite de ningún proveedor y deja fuera webm y mpga.
 */
export const limiteDeSubida = (maxBytes: number, extensiones: readonly string[]): string =>
  `Hasta ${megabytesEnPalabras(maxBytes)} · ${extensiones.join(', ')}`;

export interface Espera {
  paso: 'enviando' | 'transcribiendo';
  titulo: string;
  detalle: string;
}

/**
 * La espera, con los DOS estados que el gancho de verdad tiene.
 *
 * Transcribir es una sola llamada: el servidor no informa voces separadas ni
 * intervenciones escritas mientras trabaja, y no hay aviso posterior porque
 * no hay trabajo en segundo plano. La maqueta pinta «Separadas 4 voces · 34
 * de 58 intervenciones» y «le avisamos cuando esté»; aquí solo se dice lo que
 * se sabe. La cifra del envío aparece cuando el navegador la mide: un «0 %»
 * clavado dice menos que ninguna cifra.
 */
export const esperaDeTranscripcion = (estado: {
  subiendo: boolean;
  progreso: number;
  transcribiendo: boolean;
}): Espera | null => {
  if (estado.subiendo) {
    return {
      paso: 'enviando',
      titulo: 'Enviando la grabación',
      detalle: estado.progreso > 0 ? `${estado.progreso} % enviado` : 'Midiendo el envío…'
    };
  }
  if (estado.transcribiendo) {
    return {
      paso: 'transcribiendo',
      titulo: 'Transcribiendo y separando las voces',
      detalle:
        'Es una sola espera, sin avance parcial: tarda según la duración de la grabación. No cierre esta pestaña mientras tanto.'
    };
  }
  return null;
};

/** El nombre del archivo sin el sello numérico que le pone el almacenamiento. */
export const nombreLegible = (title: string): string => title.replace(/^\d{10,}_/, '');
