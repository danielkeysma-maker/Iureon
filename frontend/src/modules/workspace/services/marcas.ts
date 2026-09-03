/**
 * Marcar en el texto del escrito los pasajes que el revisor citó, y aplicar
 * un reemplazo. Puro: sin React, sin DOM.
 *
 * ─── EL PROBLEMA DE ENCONTRAR LA CITA ───────────────────────────────────────
 *
 * El modelo copia «tal cual», pero el texto que tenemos viene de un PDF con
 * los espacios normalizados, y el modelo a veces cambia una comilla tipográfica
 * o un guion. La búsqueda tolera eso: compara con espacios colapsados,
 * comillas y guiones unificados y sin distinguir mayúsculas. Si aun así no
 * aparece, la cita se declara «no localizada» y la pantalla lo dice; no se
 * marca otra cosa parecida, porque tachar el pasaje equivocado es peor que no
 * tachar.
 */

export interface Marca {
  /** Índice del pasaje en la lista de citas que se pasó. */
  indice: number;
  inicio: number;
  fin: number;
}

export interface Segmento {
  texto: string;
  /** null = texto sin marcar; número = índice de la cita que lo marca. */
  marca: number | null;
}

const canon = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[«»“”"]/g, '"')
    .replace(/[‘’´`]/g, "'")
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ');

/**
 * Mapa de posiciones: para cada carácter del texto canónico, su posición en
 * el original. Colapsar espacios cambia los índices; sin este mapa la marca
 * caería unos caracteres corrida.
 */
const canonizarConMapa = (texto: string): { canon: string; mapa: number[] } => {
  let out = '';
  const mapa: number[] = [];
  let enEspacio = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (/\s/.test(c)) {
      if (enEspacio) continue;
      enEspacio = true;
      out += ' ';
      mapa.push(i);
      continue;
    }
    enEspacio = false;
    out += canon(c);
    mapa.push(i);
  }
  return { canon: out, mapa };
};

/** Localiza cada cita en el texto. Devuelve las marcas encontradas, sin solapamientos, y los índices no localizados. */
export const localizarCitas = (texto: string, citas: string[]): { marcas: Marca[]; noLocalizadas: number[] } => {
  const { canon: base, mapa } = canonizarConMapa(texto);
  const marcas: Marca[] = [];
  const noLocalizadas: number[] = [];

  citas.forEach((cita, indice) => {
    const aguja = canon(cita).trim();
    if (aguja.length < 4) {
      noLocalizadas.push(indice);
      return;
    }
    const pos = base.indexOf(aguja);
    if (pos === -1) {
      noLocalizadas.push(indice);
      return;
    }
    const inicio = mapa[pos];
    const finCanon = pos + aguja.length - 1;
    const fin = mapa[finCanon] + 1;
    const solapa = marcas.some((m) => inicio < m.fin && fin > m.inicio);
    if (solapa) {
      noLocalizadas.push(indice);
      return;
    }
    marcas.push({ indice, inicio, fin });
  });

  marcas.sort((a, b) => a.inicio - b.inicio);
  return { marcas, noLocalizadas };
};

/** El texto partido en segmentos marcados y sin marcar, en orden, para pintarlo. */
export const segmentar = (texto: string, marcas: Marca[]): Segmento[] => {
  const salida: Segmento[] = [];
  let cursor = 0;
  for (const m of [...marcas].sort((a, b) => a.inicio - b.inicio)) {
    if (m.inicio > cursor) salida.push({ texto: texto.slice(cursor, m.inicio), marca: null });
    salida.push({ texto: texto.slice(m.inicio, m.fin), marca: m.indice });
    cursor = m.fin;
  }
  if (cursor < texto.length) salida.push({ texto: texto.slice(cursor), marca: null });
  return salida;
};

/**
 * Sustituye la PRIMERA aparición de la cita por el reemplazo, con la misma
 * tolerancia con que se localizó. Devuelve el texto nuevo, o null si la cita
 * no está: aplicar sobre nada no cambia nada, y la pantalla debe saberlo.
 */
export const aplicarReemplazo = (texto: string, cita: string, reemplazo: string): string | null => {
  const { marcas } = localizarCitas(texto, [cita]);
  if (marcas.length === 0) return null;
  const m = marcas[0];
  return texto.slice(0, m.inicio) + reemplazo + texto.slice(m.fin);
};

/* ─── CAPAS: citas del revisor, resaltados del abogado y referencias a la vez ─── */

export interface MarcaEnCapa extends Marca {
  /** 'cita' (informe), 'referencia' (última respuesta), o un color del resaltador: amarillo|verde|azul|rosa|tachado. */
  capa: string;
}

export interface SegmentoEnCapas {
  texto: string;
  /** Las marcas que cubren este tramo, en el orden en que se pasaron. Vacío = texto llano. */
  capas: MarcaEnCapa[];
}

/**
 * Parte el texto en tramos donde el conjunto de marcas que lo cubren es
 * constante. Las marcas pueden solaparse entre capas (un pasaje citado por el
 * revisor y resaltado en verde por el abogado a la vez): cada tramo lleva
 * todas las que lo cubren y la pantalla las pinta superpuestas. Reconstruye el
 * texto entero; nunca pierde un carácter.
 */
export const segmentarCapas = (texto: string, marcas: MarcaEnCapa[]): SegmentoEnCapas[] => {
  const cortes = new Set<number>([0, texto.length]);
  for (const m of marcas) {
    if (m.inicio < m.fin) {
      cortes.add(Math.max(0, m.inicio));
      cortes.add(Math.min(texto.length, m.fin));
    }
  }
  const puntos = [...cortes].sort((a, b) => a - b);
  const salida: SegmentoEnCapas[] = [];
  for (let k = 0; k < puntos.length - 1; k++) {
    const ini = puntos[k];
    const fin = puntos[k + 1];
    if (fin <= ini) continue;
    salida.push({ texto: texto.slice(ini, fin), capas: marcas.filter((m) => m.inicio <= ini && m.fin >= fin && m.inicio < m.fin) });
  }
  return salida;
};

/** Localiza cada anotación (cita + color) y la devuelve como marca de su capa. Las que no están, se omiten. */
export const marcasDeAnotaciones = (texto: string, anotaciones: { cita: string; color: string }[]): MarcaEnCapa[] => {
  const salida: MarcaEnCapa[] = [];
  anotaciones.forEach((a, indice) => {
    const { marcas } = localizarCitas(texto, [a.cita]);
    if (marcas.length) salida.push({ ...marcas[0], indice, capa: a.color });
  });
  return salida;
};
