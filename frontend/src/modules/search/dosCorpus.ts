import type { CorpusPrecedent } from './services/legalSearch.api';

/**
 * Los dos corpus del Buscador, en funciones puras.
 *
 * README-app lo fija: «El Buscador tiene dos corpus que no se mezclan». Lo que
 * una persona leyó antes de indexarlo lleva sus hechos y su ratio; lo que trajo
 * el descubrimiento automático lleva el texto de la fuente y nada más. Es igual
 * de real y NO es lo mismo, y mezclarlos en una lista promovería en silencio lo
 * que nadie ha leído.
 *
 * VIVEN AQUÍ Y NO EN LOS COMPONENTES porque la separación es la garantía, y una
 * garantía escrita a mano en dos pantallas diverge: el móvil aplicaba otra lista
 * de corporaciones y ningún umbral, así que presentaba como hallazgo el ruido que
 * el escritorio ya callaba. `check:buscador-catalogo-cara` las prueba sin montar
 * React y exige que las dos pantallas las usen.
 */

/*
 * EL UMBRAL DE COBERTURA, MEDIDO Y NO ADIVINADO.
 *
 * La búsqueda vectorial siempre devuelve vecinos: no sabe contestar «no sé».
 * Medido en producción: 66-69 % cuando el corpus cubre la consulta, 50-51 % en
 * un tema adyacente, 36-41 % ante un disparate. Por debajo de 0,60 lo más
 * cercano es ruido, y presentarlo sería el modo de fabricación con otro traje:
 * no una cita inventada, sino una real disfrazada de pertinente.
 */
export const UMBRAL_COBERTURA = 0.6;

/*
 * El piso medido de «el corpus sí cubre esto» (66 %). Separa las dos formas de
 * decir el parecido; no es un juicio sobre el valor jurídico de la providencia.
 */
const PISO_DE_COBERTURA_MEDIDA = 0.66;

/*
 * LAS CORPORACIONES CON LA ETIQUETA QUE EL CORPUS ARCHIVA.
 *
 * `CONSEJO_ESTADO`, sin «DE»: así la archiva la ingesta (ver
 * `backend/.../officialRuling.service.ts`). El móvil ofrecía
 * `CONSEJO_DE_ESTADO`, que no coincide con ninguna fila, así que elegirlo
 * vaciaba la lista y enseñaba que el filtro no sirve.
 */
export const CORPORACIONES = [
  { id: 'TODAS', label: 'Todas las corporaciones' },
  { id: 'CORTE_CONSTITUCIONAL', label: 'Corte Constitucional' },
  { id: 'CORTE_SUPREMA', label: 'Corte Suprema de Justicia' },
  { id: 'CONSEJO_ESTADO', label: 'Consejo de Estado' },
  { id: 'COMISION_DISCIPLINA', label: 'Comisión Nacional de Disciplina Judicial' }
] as const;

export interface FiltrosDelBuscador {
  corporacion: string;
  anio: string;
  /** «Solo lo que alguien leyó»: esconde el bloque automático, nunca lo traslada. */
  soloLeidas: boolean;
}

export interface DosCorpus<T> {
  leidas: T[];
  sinLeer: T[];
}

/** La corporación en palabras; lo desconocido se muestra tal cual, sin guiones bajos. */
export const corporacionEnPalabras = (id: string | null | undefined): string | null => {
  if (!id) return null;
  return CORPORACIONES.find((c) => c.id === id)?.label ?? id.replace(/_/g, ' ');
};

/*
 * Lo ausente se lee como leído: las 62 providencias del corpus original no
 * traen el campo y todas las abrió una persona. Solo `false` explícito baja al
 * bloque automático — así lo marca la ingesta de lo descubierto.
 */
export const separarCorpus = <T extends { curado?: boolean }>(items: readonly T[]): DosCorpus<T> => ({
  leidas: items.filter((i) => i.curado !== false),
  sinLeer: items.filter((i) => i.curado === false)
});

/** Lo que alcanza el umbral. Lo demás no se presenta como resultado. */
export const alcanzanLaConsulta = <T extends { similarity: number }>(items: readonly T[]): T[] =>
  items.filter((i) => i.similarity >= UMBRAL_COBERTURA);

/** Lo más parecido que devolvió el corpus, para decir qué tan lejos quedó. */
export const cercaniaMaxima = (items: readonly { similarity: number }[]): number | null =>
  items.length === 0 ? null : Math.max(...items.map((i) => i.similarity));

/*
 * El año se LEE de la providencia en vez de pedirse a un campo que el corpus no
 * tiene. Una entrada sin año no se esconde bajo un filtro de año: la volvería
 * invisible por un defecto de metadatos, no por su contenido.
 */
export const anioDe = (providencia: string | null | undefined): string | null => {
  const m = providencia?.match(/(19|20)\d{2}/);
  return m ? m[0] : null;
};

export const aniosDisponibles = (items: readonly CorpusPrecedent[]): string[] =>
  Array.from(new Set(items.map((r) => anioDe(r.providencia)).filter((a): a is string => a !== null))).sort((a, b) =>
    b.localeCompare(a)
  );

/** Filtra por la procedencia que mandó el servidor y separa en los dos bloques. */
export const resultadosVisibles = (
  items: readonly CorpusPrecedent[],
  filtros: FiltrosDelBuscador
): DosCorpus<CorpusPrecedent> => {
  const pasan = items.filter((item) => {
    if (filtros.corporacion !== 'TODAS' && item.corporacion !== filtros.corporacion) return false;
    if (filtros.anio !== 'TODOS') {
      const a = anioDe(item.providencia);
      if (a !== null && a !== filtros.anio) return false;
    }
    return true;
  });
  const dos = separarCorpus(pasan);
  return filtros.soloLeidas ? { leidas: dos.leidas, sinLeer: [] } : dos;
};

/*
 * EL PARECIDO EN PALABRAS, Y DEL TEXTO.
 *
 * Un «67 %» se lee como peso jurídico y no lo es: la C-590 de 2005, que fijó
 * los requisitos de la tutela contra providencias, queda detrás de sentencias
 * que solo los repiten con palabras más cercanas a la consulta. Por eso se dice
 * de qué es el parecido —del texto con la consulta— y nunca se ordena ni se
 * rotula como «más relevante».
 */
export const parecidoEnPalabras = (similarity: number): string => {
  if (similarity >= PISO_DE_COBERTURA_MEDIDA) return 'Texto muy parecido a su consulta';
  if (similarity >= UMBRAL_COBERTURA) return 'Texto parecido a su consulta';
  return 'Texto lejano a su consulta';
};

export interface FichaLeida {
  hechos: string | null;
  ratio: string | null;
  /** El fragmento sin la cabecera que la ingesta antepone para el vector. */
  texto: string;
}

/*
 * LOS HECHOS Y LA RATIO SALEN DE LO QUE GUARDÓ LA INGESTA, no se componen.
 *
 * Cada fragmento se guarda como `[CORPORACIÓN: …] [TIPO: …] …` + `HECHOS: …` +
 * `RATIO: …`, una línea en blanco y el texto. Esos dos renglones los escribió la
 * persona que leyó la providencia. Un valor `undefined` o vacío —lo que deja un
 * hallazgo automático que nadie leyó— se devuelve como null y no se pinta.
 */
export const leerFicha = (contentChunk: string): FichaLeida => {
  const partes = contentChunk.split(/\n\s*\n/);
  const cabeza = partes[0] ?? '';
  if (!cabeza.trimStart().startsWith('[')) return { hechos: null, ratio: null, texto: contentChunk.trim() };

  const valor = (clave: string): string | null => {
    const linea = cabeza.split('\n').find((l) => l.trimStart().startsWith(`${clave}:`));
    const v = linea?.slice(linea.indexOf(':') + 1).trim();
    return v && v !== 'undefined' && v !== 'null' ? v : null;
  };

  return {
    hechos: valor('HECHOS'),
    ratio: valor('RATIO'),
    texto: partes.slice(1).join('\n\n').trim() || contentChunk.trim()
  };
};

/*
 * Solo lo que el registro trae. Ninguna cita compuesta: una cita es lo único de
 * esta pantalla que termina, tal cual, dentro de un escrito.
 */
export const citaCopiable = (item: CorpusPrecedent): string | null => {
  if (!item.providencia) return null;
  return [item.providencia, corporacionEnPalabras(item.corporacion), item.magistradoPonente && `M.P. ${item.magistradoPonente}`]
    .filter(Boolean)
    .join(', ');
};
