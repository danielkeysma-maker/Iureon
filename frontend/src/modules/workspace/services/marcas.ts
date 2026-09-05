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

/* ─── Capas tipográficas ───────────────────────────────────────────────────
 * No son marcas de nadie: solo pintan. Un documento subido llega como texto
 * llano y se veía todo de un mismo color, sin distinguir «PRETENSIONES» del
 * párrafo que le sigue; y un borrador de Redacción trae sus negritas como
 * «**así**», que en el papel del taller se leían con los asteriscos. */

/** 'negrita' pinta en negrita; 'marcador' atenúa los asteriscos de Markdown, que siguen en el texto para que las citas coincidan. */
export const esCapaTipografica = (capa: string): boolean => capa === 'negrita' || capa === 'marcador';

/**
 * Una línea es título si tiene letras y casi todas van en mayúscula:
 * «HECHOS», «I. PRETENSIONES», «ACCIONADO: JUZGADO TERCERO ADMINISTRATIVO ORAL
 * DEL CIRCUITO DE SINCELEJO - SALA QUINTA…». El tope de largo es generoso
 * (260) porque en un escrito real la línea del accionado o la referencia
 * ocupa dos renglones y sigue siendo encabezado. Una numeración sola («1.») o
 * una línea que termina en coma o punto y coma no lo es.
 */
export const esLineaDeTitulo = (linea: string): boolean => {
  const t = linea.trim();
  if (t.length < 2 || t.length > 260 || /[,;]$/.test(t)) return false;
  const letras = t.match(/\p{L}/gu) ?? [];
  if (letras.length < 3 || !/\p{L}{3}/u.test(t)) return false;
  const mayusculas = letras.filter((l) => l === l.toUpperCase() && l !== l.toLowerCase()).length;
  return mayusculas / letras.length >= 0.85;
};

/** «ACCIONANTE:», «ASUNTO:», «REFERENCIA:» al inicio de la línea: la etiqueta va en negrita aunque el resto no. */
const ETIQUETA_INICIAL = /^\s*([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ .()/]{1,60}?):/u;

/** «PRIMERO.», «SEGUNDA:», «DÉCIMO PRIMERO -» al inicio de un párrafo: el ordinal que ordena hechos y pretensiones. */
const ORDINAL_INICIAL =
  /^\s*((?:PRIMER|SEGUND|TERCER|CUART|QUINT|SEXT|S[ÉE]PTIM|OCTAV|NOVEN|D[ÉE]CIM|UND[ÉE]CIM|DUOD[ÉE]CIM|VIG[ÉE]SIM)[OA]S?(?:\s+(?:PRIMER|SEGUND|TERCER|CUART|QUINT|SEXT|S[ÉE]PTIM|OCTAV|NOVEN)[OA]S?)?)\s*[.:)\-–—]/u;

/** «1. Hechos», «2.3. Pretensiones»: numeración corta seguida de un título breve sin coma final. */
const NUMERADO_CORTO = /^\s*(?:\d{1,2}(?:\.\d{1,2})*|[IVXLC]{1,6})[.)]\s+\p{Lu}[^\n,;]{2,45}$/u;

/**
 * Nombres y entidades en mayúscula sostenida dentro del párrafo: «señor ALFONSO
 * MONTERROZA AVILA, identificado…», «ante el JUZGADO TERCERO ADMINISTRATIVO».
 * Se exigen al menos dos palabras seguidas, una de ellas de tres letras o más,
 * para no tocar siglas sueltas como «EPS» o «C.C.».
 */
const NOMBRE_EN_MAYUSCULA = /(?<!\p{L})(?:[A-ZÁÉÍÓÚÜÑ]{2,}\.?)(?:\s+(?:[A-ZÁÉÍÓÚÜÑ]\.|[A-ZÁÉÍÓÚÜÑ]{2,}\.?)){1,7}(?!\p{L})/gu;

const negrita = (inicio: number, fin: number): MarcaEnCapa => ({ inicio, fin, indice: -1, capa: 'negrita' });

/** Títulos, etiquetas, ordinales, nombres en mayúscula y negritas «**…**» del texto, como capas para pintar. */
export const capasTipograficas = (texto: string): MarcaEnCapa[] => {
  const salida: MarcaEnCapa[] = [];
  const lineas = /[^\n]+/g;
  let l: RegExpExecArray | null;
  while ((l = lineas.exec(texto)) !== null) {
    const linea = l[0];
    const base = l.index;
    if (esLineaDeTitulo(linea)) {
      salida.push(negrita(base, base + linea.length));
      continue; // la línea entera ya va en negrita: no hace falta buscar dentro
    }
    const etiqueta = ETIQUETA_INICIAL.exec(linea);
    if (etiqueta) salida.push(negrita(base + etiqueta.index, base + etiqueta.index + etiqueta[0].length));
    const ordinal = ORDINAL_INICIAL.exec(linea);
    if (ordinal) salida.push(negrita(base + ordinal.index, base + ordinal.index + ordinal[0].length));
    if (NUMERADO_CORTO.test(linea)) salida.push(negrita(base, base + linea.length));
    let n: RegExpExecArray | null;
    NOMBRE_EN_MAYUSCULA.lastIndex = 0;
    while ((n = NOMBRE_EN_MAYUSCULA.exec(linea)) !== null) {
      if (!/[A-ZÁÉÍÓÚÜÑ]{3,}/u.test(n[0])) continue; // «C. C.» o «E. U.» no son nombres
      salida.push(negrita(base + n.index, base + n.index + n[0].length));
    }
  }
  const negritas = /\*\*(?=\S)[^*\n]+?(?<=\S)\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = negritas.exec(texto)) !== null) {
    salida.push(negrita(m.index, m.index + m[0].length));
    salida.push({ inicio: m.index, fin: m.index + 2, indice: -1, capa: 'marcador' });
    salida.push({ inicio: m.index + m[0].length - 2, fin: m.index + m[0].length, indice: -1, capa: 'marcador' });
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
