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

import { FUENTE_DE_ENCABEZADOS, FUENTE_DE_ETIQUETAS, esLineaDeTitulo, reflujoDeSecciones, unirTitulosPartidos } from './estructuraDelEscrito';

/* La estructura del escrito vive en estructuraDelEscrito.ts; se reexporta para que quien pintaba no cambie de importación. */
export { esLineaDeTitulo, reflujoDeSecciones, unirTitulosPartidos };

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

/*
 * ─── EL REEMPLAZO SE PEGA LIMPIO ─────────────────────────────────────────────
 *
 * Las comprobaciones automáticas de vigencia y de glosa del backend escribían
 * sus corchetes de advertencia también dentro de `reemplazo`, y «Aplicar
 * reemplazo» pega ese texto tal cual: la advertencia terminaba dentro del
 * escrito que el abogado radica. El backend ya no marca el reemplazo, pero los
 * informes guardados antes lo siguen trayendo marcado, y esos no se reescriben.
 *
 * SE RECONOCE CADA MARCA POR SU APERTURA Y SU CIERRE EXACTOS, y no por un `[`
 * cualquiera hasta un `]`: el detalle de la fuente, el extracto oficial y el
 * motivo del juez son texto libre y pueden traer corchetes y comillas «». Un
 * reemplazo del revisor también puede traer corchetes propios, y esos se pegan.
 * Las plantillas viven en backend/src/modules/agent/review/vigenciaDelInforme.ts
 * y glosaDelInforme.ts; si allá cambian, esta lista cambia con ellas (la guarda
 * reemplazoLimpio.check.ts las copia).
 *
 * LO QUITADO NO SE DESCARTA: vuelve en `avisos` para que la pantalla lo muestre
 * junto al reemplazo. Quitar la advertencia en silencio sería cambiar un texto
 * sucio por un abogado que no se entera de que la norma está derogada.
 */
/*
 * Desde el 14 de septiembre de 2026 el backend ya no escribe NINGUNA de estas
 * marcas: manda la comprobación como dato (`informe.comprobaciones`). La lista
 * sigue aquí para leer los informes guardados antes, y la guarda del backend
 * `comprobacionesDelInforme.check.ts` lee este archivo para comprobar que sus
 * mensajes nuevos, puestos entre corchetes, siguen casando con estas parejas.
 */
const MARCAS_DEL_INFORME: ReadonlyArray<{ apertura: string; cierre: string; clase: ClaseDeMarcaGuardada }> = [
  {
    apertura: '[NORMA DEROGADA — este artículo NO está vigente: ',
    cierre: '. La revisión lo nombró de todos modos; no se apoye en él.]',
    clase: 'DEROGADA'
  },
  {
    apertura: '[NORMA VIGENTE PERO MODULADA POR LA CORTE — rige, pero su texto publicado no es el que rige: ',
    cierre: ' Léalo en la sentencia antes de usarlo.]',
    clase: 'MODULADA'
  },
  {
    apertura: '[LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo — ',
    cierre: ' Esta casa no elige: compruébelo usted.]',
    clase: 'FUENTES_EN_DESACUERDO'
  },
  {
    apertura: '[LO QUE ESTA REVISIÓN AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «',
    cierre: ' No se apoye en este punto sin leer la norma.]',
    clase: 'NO_LO_DICE_EL_ARTICULO'
  }
];

export type ClaseDeMarcaGuardada = 'DEROGADA' | 'MODULADA' | 'FUENTES_EN_DESACUERDO' | 'NO_LO_DICE_EL_ARTICULO';

export interface MarcaGuardada {
  clase: ClaseDeMarcaGuardada;
  /** La marca tal como estaba, con sus corchetes. */
  marca: string;
  /** El artículo junto al que el backend la pegó; null si no se puede leer. */
  articulo: number | null;
  /**
   * Si era el aviso que el arreglo del 14 de septiembre subía al `problema`
   * con «Sobre el artículo N que cita el reemplazo propuesto:». Entonces la
   * marca es del REEMPLAZO, aunque viviera en el problema.
   */
  delReemplazo: boolean;
  /** Posición en el texto original, para devolverlas en orden. */
  en: number;
}

/* El prefijo con que `correccionTextualMarcada.ts` subía al problema el aviso del reemplazo. */
const PREFIJO_DEL_REEMPLAZO = /\s?Sobre el artículo (\d+) que cita el reemplazo propuesto:\s?$/;

/**
 * Las marcas de las comprobaciones automáticas en un texto guardado, y el texto
 * sin ellas.
 *
 * Se quita siempre la apertura que empieza MÁS A LA DERECHA: si una marca cayó
 * dentro de otra (la glosa corría sobre el informe ya marcado por la vigencia),
 * la de adentro sale primero y la de afuera encuentra después su propio cierre.
 * Una apertura sin su cierre exacto no se toca: sin cierre no hay certeza de
 * dónde termina, y borrar de más dañaría el texto que sí es del revisor.
 *
 * EL ARTÍCULO se lee de lo que va justo antes: el backend insertaba « » + marca
 * inmediatamente después del número («artículo 2035 [NORMA…]»).
 */
export const extraerMarcasGuardadas = (original: string): { texto: string; marcas: MarcaGuardada[] } => {
  let texto = original;
  const marcas: MarcaGuardada[] = [];
  let tope = texto.length;
  while (tope >= 0) {
    let mejor: { inicio: number; cierre: string; clase: ClaseDeMarcaGuardada } | null = null;
    for (const { apertura, cierre, clase } of MARCAS_DEL_INFORME) {
      const inicio = texto.lastIndexOf(apertura, tope);
      if (inicio !== -1 && (mejor === null || inicio > mejor.inicio)) mejor = { inicio, cierre, clase };
    }
    if (mejor === null) break;
    const finDelCierre = texto.indexOf(mejor.cierre, mejor.inicio);
    if (finDelCierre === -1) {
      tope = mejor.inicio - 1;
      continue;
    }
    const fin = finDelCierre + mejor.cierre.length;
    /* El backend inserta « » + marca: se quita también ese espacio. */
    let desde = mejor.inicio > 0 && texto[mejor.inicio - 1] === ' ' ? mejor.inicio - 1 : mejor.inicio;
    const antes = texto.slice(0, desde);
    const prefijo = PREFIJO_DEL_REEMPLAZO.exec(antes);
    const numero = /(\d+)\s*$/.exec(antes);
    if (prefijo) desde = prefijo.index;
    marcas.push({
      clase: mejor.clase,
      marca: texto.slice(mejor.inicio, fin),
      articulo: prefijo ? Number(prefijo[1]) : numero ? Number(numero[1]) : null,
      delReemplazo: Boolean(prefijo),
      en: mejor.inicio
    });
    texto = texto.slice(0, desde) + texto.slice(fin);
    tope = Math.min(desde, texto.length);
  }
  return { texto, marcas: marcas.sort((a, b) => a.en - b.en) };
};

/**
 * El reemplazo sin las marcas de las comprobaciones automáticas, y las marcas
 * quitadas, en el orden en que aparecían. Se aplica a TODO lo que se pega en
 * el escrito: el reemplazo del informe y las ediciones que propone la guía en
 * el chat, que pueden copiar un corchete de un informe viejo.
 */
export const reemplazoParaPegar = (reemplazo: string): { texto: string; avisos: string[] } => {
  const { texto, marcas } = extraerMarcasGuardadas(reemplazo);
  return { texto, avisos: marcas.map((m) => m.marca) };
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

/**
 * Encabezados de sección y etiquetas de referencia que en un escrito
 * colombiano van siempre en negrita, aunque aparezcan como una sola palabra:
 * «HECHOS», «PRETENSIONES», «ANEXOS», «ACCIONANTE:». Es el mismo catálogo con
 * el que estructuraDelEscrito.ts abre líneas, para que negrita y estructura
 * coincidan. Se aceptan seguidos de dos puntos, punto o fin de línea, para no
 * marcar la palabra «pruebas» en medio de una frase en minúscula (la lista
 * exige mayúscula sostenida).
 */
const ENCABEZADO_SUELTO = new RegExp(`(?<!\\p{L})(?:${FUENTE_DE_ENCABEZADOS}|${FUENTE_DE_ETIQUETAS})(?=\\s*[:.\\n]|\\s*$)`, 'gu');

/** Números de identificación y radicados: «C.C. No. 6.815.567», «cédula de ciudadanía 1.102.811.692», «NIT 900.123.456-7», «radicado 2024-00003». */
const NUMERO_DE_IDENTIFICACION =
  /(?:\bC\.?\s?C\.?|\bc[ée]dula(?:\s+de\s+ciudadan[ií]a)?|\bNIT|\bT\.?\s?P\.?|\bradicad[oa](?:\s+No\.?|\s+n[úu]mero|\s+N[°º]\.?)?|\bexpediente)\s*(?:No\.?|N[°º]\.?|n[úu]mero|#)?\s*[\d][\d.\-–/]{4,}\d/giu;

/** Fechas en letras: «15 de octubre de 2025». */
const FECHA_LARGA = /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de\s+|del\s+)?\d{4}\b/giu;

/** Una palabra suelta en mayúscula sostenida de cinco letras o más: «AMPARAR», «ORDENAR», «DECLARAR», «SENTENCIA». Las siglas cortas («EPS», «DIAN») quedan fuera. */
const PALABRA_EN_MAYUSCULA = /(?<!\p{L})[A-ZÁÉÍÓÚÜÑ]{5,}(?!\p{L})/gu;

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
    for (const re of [ENCABEZADO_SUELTO, NUMERO_DE_IDENTIFICACION, FECHA_LARGA, PALABRA_EN_MAYUSCULA]) {
      re.lastIndex = 0;
      let x: RegExpExecArray | null;
      while ((x = re.exec(linea)) !== null) {
        if (x[0].length === 0) {
          re.lastIndex++;
          continue;
        }
        salida.push(negrita(base + x.index, base + x.index + x[0].length));
      }
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
