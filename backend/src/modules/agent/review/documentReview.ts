/**
 * Revisar un escrito: the pure half.
 *
 * ─── WHAT THIS IS ────────────────────────────────────────────────────────────
 *
 * A lawyer uploads a brief they already wrote — a tutela, a demand, an
 * appeal — and asks what is weak, what is strong, what they applied wrongly.
 * The answer is a report, not a draft. It is the third thing the drafting
 * module can do, next to drafting from scratch and correcting a saved draft.
 *
 * ─── WHY THE CATALOGUE IS IN THE PROMPT ─────────────────────────────────────
 *
 * Any chat can opine on a brief. What makes this review worth paying for is
 * that the objective part comes from the verified ficha of the actuación:
 * which sections the norm demands (and which are missing), which authority,
 * which deadline. The model is told to keep the two apart — what the norm says
 * versus what its criterion says — so the lawyer knows which findings they
 * can take to the bank and which are an opinion to weigh.
 *
 * ─── THE CUT IS DECLARED ────────────────────────────────────────────────────
 *
 * Long documents are cut at MAX_CARACTERES_REVISION. The cut is declared to
 * the model (so it does not report the ending as missing) and returned to the
 * lawyer (so they know the review covers part of the text). A review of half
 * a brief that pretends to be whole is worse than no review.
 *
 * Pure: no network, no database. The controller reads the file and pays.
 */

/*
 * 300.000 caracteres: unas 75 páginas de prosa jurídica densa, o una tutela
 * con sus anexos de texto. Antes eran 60.000 y el usuario tenía razón en que
 * un revisor que no lee el documento entero no es un revisor. El techo no lo
 * pone el modelo (1M de contexto) sino la función serverless: la lectura de
 * 75.000 tokens más una respuesta de 1.800 tarda ~45 s medidos, y Vercel
 * corta a los 60. Más allá, el corte se declara; la salida de verdad es una
 * revisión asíncrona, que es otra pieza.
 */
export const MAX_CARACTERES_REVISION = 300_000;

export const PREGUNTA_POR_DEFECTO =
  'Señale las debilidades y las fortalezas de este escrito, qué está mal aplicado y qué está bien aplicado, y qué corregiría antes de presentarlo.';

export interface TextoPreparado {
  texto: string;
  truncado: boolean;
  /** Characters of the original, before the cut. */
  caracteres: number;
}

/*
 * LOS SALTOS DE PÁRRAFO SE CONSERVAN. Antes se colapsaba TODO el espacio en
 * blanco a un espacio, y un escrito de treinta páginas llegaba al revisor —y al
 * papel del taller— como un solo bloque: hechos, pretensiones y fundamentos
 * revueltos sin un salto. El abogado lo vio y preguntó por qué su tutela
 * estaba «desordenada». Ahora se normalizan los espacios DENTRO de cada línea
 * y se limitan los saltos seguidos a dos; la estructura del documento es del
 * documento, no nuestra.
 */
export const prepararTexto = (bruto: string): TextoPreparado => {
  const limpio = bruto
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const truncado = limpio.length > MAX_CARACTERES_REVISION;
  return {
    texto: truncado ? limpio.slice(0, MAX_CARACTERES_REVISION) : limpio,
    truncado,
    caracteres: limpio.length
  };
};

export const buildReviewSystemPrompt = (): string => `Eres un abogado litigante senior en Colombia, con veinticinco años de práctica ante jueces, tribunales y altas cortes, y un revisor exigente de escritos ajenos. Revisas el escrito que te entrega otro abogado y le dices, con franqueza profesional, qué está bien, qué está mal y qué corregiría antes de presentarlo.

SEPARA DOS PLANOS Y DILO EN CADA HALLAZGO:
1. Lo que exige la NORMA: secciones obligatorias, autoridad competente, término, requisitos formales. Aquí eres categórico y citas el artículo. Si te dan la ficha verificada de la actuación, es tu fuente; no la contradigas ni la amplíes con requisitos que no estén en ella.
2. Lo que dicta tu CRITERIO profesional: claridad, orden, fuerza argumentativa, precisión, riesgos. Aquí eres directo pero lo marcas como valoración, no como requisito legal.

REGLA DE CITACIÓN JURISPRUDENCIAL: NO cites ninguna sentencia, auto ni providencia; no escribas radicados, magistrados ni años de providencias. Si un punto necesita respaldo jurisprudencial, dilo así: «este punto debe respaldarse con precedente verificado» y explica qué debería sostener ese precedente. Un radicado inventado es peor que su ausencia, porque el abogado lo firma.

NO REESCRIBAS EL ESCRITO. Señala, explica y propón la corrección concreta de cada punto; la redacción la hará el abogado.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON, sin texto antes ni después, con esta forma exacta:
{
  "resumen": "dos o tres frases con el juicio global",
  "fortalezas": ["…"],
  "debilidades": ["…"],
  "seccionesFaltantes": ["secciones que la norma exige y el escrito no trae; vacío si no falta ninguna"],
  "erroresDeAplicacion": [{"donde": "sección o párrafo", "problema": "qué está mal aplicado y por qué", "correccion": "cómo debería quedar"}],
  "correccionesTextuales": [{"cita": "frase copiada LITERAL del escrito, tal cual está, sin corregirla", "problema": "por qué esa frase falla", "reemplazo": "la frase con la que la sustituiría, lista para pegar"}],
  "recomendaciones": ["qué haría antes de presentarlo, en orden de importancia"]
}
EN "correccionesTextuales" LA CITA ES TEXTUAL: copia las palabras exactas del escrito (entre 5 y 40 palabras), sin parafrasear ni corregir ortografía, para que el abogado la encuentre con buscar. El reemplazo es la redacción concreta que propones, no una instrucción. Elige los pasajes que más daño harían ante el juez; como máximo cuatro.
Escribe en español jurídico colombiano, neutro y preciso. Cada elemento de las listas es una frase completa y autónoma.

SÉ BREVE Y DENSO, porque el informe tiene un presupuesto de salida fijo y un JSON cortado a la mitad no le sirve a nadie: como máximo CUATRO elementos por lista, cada uno de hasta 25 palabras; el resumen, dos frases; sin repetir en una lista lo dicho en otra. Prefiere el hallazgo grave al menor: si hay más de cuatro, quédate con los cuatro que más daño harían ante el juez. JSON compacto, en una sola línea, sin comentarios ni texto fuera del objeto.`;

export const buildReviewUserPrompt = (input: {
  documentType: string;
  guidance: string | null;
  pregunta: string;
  texto: string;
  truncado: boolean;
}): string => {
  const pregunta = input.pregunta.trim() || PREGUNTA_POR_DEFECTO;
  const ficha = input.guidance
    ? `FICHA VERIFICADA DE LA ACTUACIÓN (fuente oficial; úsala para lo objetivo):\n${input.guidance}`
    : 'La actuación no está catalogada todavía: no hay ficha verificada. Limita lo objetivo a lo que puedas sostener con el artículo exacto de la norma; todo lo demás va como criterio.';
  const recorte = input.truncado
    ? `\nNOTA: el escrito fue recortado por longitud a ${MAX_CARACTERES_REVISION.toLocaleString('es-CO')} caracteres. Revisa solo lo presente y NO reportes como faltante lo que pudo quedar después del corte.\n`
    : '';

  return `ACTUACIÓN: "${input.documentType}".

${ficha}

PREGUNTA DEL ABOGADO: ${pregunta}
${recorte}
ESCRITO A REVISAR:
"""
${input.texto}
"""`;
};

export interface ErrorDeAplicacion {
  donde: string;
  problema: string;
  correccion: string;
}

export interface CorreccionTextual {
  /** Palabras exactas del escrito, para encontrarlas con buscar. */
  cita: string;
  problema: string;
  /** La redacción propuesta, lista para pegar. */
  reemplazo: string;
}

export interface InformeDeRevision {
  resumen: string;
  fortalezas: string[];
  debilidades: string[];
  seccionesFaltantes: string[];
  erroresDeAplicacion: ErrorDeAplicacion[];
  correccionesTextuales: CorreccionTextual[];
  recomendaciones: string[];
}

const cadena = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim();

const lista = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(cadena).filter(Boolean);
  const una = cadena(v);
  return una ? [una] : [];
};

const citas = (v: unknown): CorreccionTextual[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => {
      const o = (e ?? {}) as Record<string, unknown>;
      return { cita: cadena(o.cita), problema: cadena(o.problema), reemplazo: cadena(o.reemplazo) };
    })
    .filter((e) => e.cita || e.reemplazo);
};

const errores = (v: unknown): ErrorDeAplicacion[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => {
      const o = (e ?? {}) as Record<string, unknown>;
      return { donde: cadena(o.donde), problema: cadena(o.problema), correccion: cadena(o.correccion) };
    })
    .filter((e) => e.donde || e.problema || e.correccion);
};

/**
 * Repairs a JSON object the model left unfinished: a review measured against
 * OpenRouter filled its whole output budget and stopped mid-string, and the
 * whole report — including the parts that were complete — was thrown away as
 * unreadable. What can be saved is saved: the text is cut back to the last
 * complete element, then every open string, array and object is closed.
 * Returns null when there is nothing whole to keep.
 */
export const repararJsonCortado = (texto: string): string | null => {
  const inicio = texto.indexOf('{');
  if (inicio === -1) return null;
  const s = texto.slice(inicio);

  // Walk once, tracking string state and the bracket stack, and remember the
  // last position at which an element ended cleanly (after a value, before a
  // comma or closer).
  const pila: string[] = [];
  let enCadena = false;
  let escape = false;
  let ultimoLimpio = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (enCadena) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') {
        enCadena = false;
        ultimoLimpio = i + 1;
      }
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === '{' || c === '[') pila.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') {
      pila.pop();
      ultimoLimpio = i + 1;
    } else if (/[0-9el]/.test(c)) ultimoLimpio = i + 1; // numbers, true/false/null end cleanly too
  }
  if (ultimoLimpio <= 0) return null;

  // What is still open at a given cut, innermost last.
  const abiertosEn = (fragmento: string): string[] => {
    const abiertos: string[] = [];
    let dentro = false;
    let esc = false;
    for (const c of fragmento) {
      if (dentro) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') dentro = false;
        continue;
      }
      if (c === '"') dentro = true;
      else if (c === '{' || c === '[') abiertos.push(c === '{' ? '}' : ']');
      else if (c === '}' || c === ']') abiertos.pop();
    }
    return abiertos;
  };

  // Cut at the last clean point, then peel off whatever cannot stand on its
  // own at the tail: a trailing comma, a `"clave":` whose value never started,
  // and — inside an object — a bare `"clave"` with no colon yet (inside an
  // array the same bare string is a complete element and stays).
  let corte = s.slice(0, ultimoLimpio);
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    const antes = corte;
    corte = corte.replace(/,\s*$/, '').replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:\s*$/, '');
    const abiertos = abiertosEn(corte);
    if (abiertos[abiertos.length - 1] === '}') {
      corte = corte.replace(/([{,])\s*"(?:[^"\\]|\\.)*"\s*$/, '$1').replace(/,\s*$/, '');
    }
    if (corte === antes) break;
  }
  if (!corte.trim() || corte.trim() === '{') return null;
  return corte + abiertosEn(corte).reverse().join('');
};

/**
 * The model's JSON, or null. Never throws: a report that cannot be read is
 * handed over as free text by the controller, not lost. A cut-off JSON is
 * repaired first, so the complete findings survive the missing tail.
 */
/**
 * Control characters inside strings (raw newlines, tabs) are the commonest
 * way a model breaks its own JSON. They become spaces; outside strings they
 * are left alone. Trailing commas before a closer go too.
 */
const sanearJson = (s: string): string => {
  let out = '';
  let enCadena = false;
  let escape = false;
  for (const c of s) {
    if (enCadena) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') enCadena = false;
      else if (c === '\n' || c === '\r' || c === '\t') {
        out += ' ';
        continue;
      }
    } else if (c === '"') enCadena = true;
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
};

const desescapar = (s: string): string =>
  s.replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

/**
 * Last resort when the text is not JSON at all any more — unescaped quotes
 * inside a value, for instance. The fields are pulled out by pattern: each
 * list is the run between its key and the next known key, and each item is a
 * quoted run. Loses nothing that was whole; never throws.
 */
const CLAVES = ['resumen', 'fortalezas', 'debilidades', 'seccionesFaltantes', 'erroresDeAplicacion', 'correccionesTextuales', 'recomendaciones'];

const extraerCampos = (s: string): InformeDeRevision | null => {
  const tramo = (clave: string): string | null => {
    const m = new RegExp(`"${clave}"\\s*:\\s*`).exec(s);
    if (!m) return null;
    const desde = m.index + m[0].length;
    let hasta = s.length;
    for (const otra of CLAVES) {
      if (otra === clave) continue;
      const o = s.indexOf(`"${otra}"`, desde);
      if (o !== -1 && o < hasta) hasta = o;
    }
    return s.slice(desde, hasta);
  };
  const cadenaDe = (clave: string): string => {
    const t = tramo(clave);
    if (!t) return '';
    const m = /^\s*"([\s\S]*?)"\s*(?:,\s*)?$/.exec(t.replace(/,\s*$/, ''));
    return desescapar((m ? m[1] : t.replace(/^\s*"|"\s*,?\s*$/g, '')).trim());
  };
  const listaDe = (clave: string): string[] => {
    const t = tramo(clave);
    if (!t) return [];
    const cuerpo = t.replace(/^\s*\[/, '').replace(/\]\s*,?\s*}?\s*$/, '');
    // Items are separated by `","` (the only reliable boundary once quotes inside values are suspect).
    return cuerpo
      .split(/"\s*,\s*"/)
      .map((x) => desescapar(x.replace(/^\s*"|"\s*$/g, '').trim()))
      .filter(Boolean);
  };
  const erroresDe = (): ErrorDeAplicacion[] => {
    const t = tramo('erroresDeAplicacion');
    if (!t) return [];
    const salida: ErrorDeAplicacion[] = [];
    const objetos = t.split(/}\s*,\s*{/);
    for (const o of objetos) {
      const campo = (k: string): string => {
        const m = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,\\s*"(?:donde|problema|correccion)"|\\s*}|\\s*$)`).exec(o);
        return m ? desescapar(m[1].trim()) : '';
      };
      const e = { donde: campo('donde'), problema: campo('problema'), correccion: campo('correccion') };
      if (e.donde || e.problema || e.correccion) salida.push(e);
    }
    return salida;
  };

  const citasDe = (): CorreccionTextual[] => {
    const t = tramo('correccionesTextuales');
    if (!t) return [];
    const salida: CorreccionTextual[] = [];
    for (const o of t.split(/}\s*,\s*{/)) {
      const campo = (k: string): string => {
        const m = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,\\s*"(?:cita|problema|reemplazo)"|\\s*}|\\s*$)`).exec(o);
        return m ? desescapar(m[1].trim()) : '';
      };
      const e = { cita: campo('cita'), problema: campo('problema'), reemplazo: campo('reemplazo') };
      if (e.cita || e.reemplazo) salida.push(e);
    }
    return salida;
  };

  const informe: InformeDeRevision = {
    resumen: cadenaDe('resumen'),
    fortalezas: listaDe('fortalezas'),
    debilidades: listaDe('debilidades'),
    seccionesFaltantes: listaDe('seccionesFaltantes'),
    erroresDeAplicacion: erroresDe(),
    correccionesTextuales: citasDe(),
    recomendaciones: listaDe('recomendaciones')
  };
  const algo =
    informe.resumen || informe.fortalezas.length || informe.debilidades.length || informe.recomendaciones.length;
  return algo ? informe : null;
};

/**
 * The model's JSON, or null. Never throws. Reads in order of confidence:
 * clean JSON; JSON with control characters or trailing commas sanitised; a
 * cut-off JSON repaired; and, last, the fields pulled out by pattern from a
 * text that is no longer JSON at all. The report the lawyer paid for is not
 * thrown away because the model forgot to escape a quote.
 */
export const parsearInforme = (crudo: string): InformeDeRevision | null => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  if (inicio === -1) return null;

  const intentos: string[] = [];
  const fin = sinCerca.lastIndexOf('}');
  if (fin > inicio) {
    const bruto = sinCerca.slice(inicio, fin + 1);
    intentos.push(bruto, sanearJson(bruto));
  }
  const saneado = sanearJson(sinCerca.slice(inicio));
  const reparado = repararJsonCortado(saneado);
  if (reparado) intentos.push(reparado);

  let objeto: Record<string, unknown> | null = null;
  for (const intento of intentos) {
    try {
      const o = JSON.parse(intento) as unknown;
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        objeto = o as Record<string, unknown>;
        break;
      }
    } catch {
      objeto = null;
    }
  }

  if (!objeto) return extraerCampos(sinCerca.slice(inicio));

  return {
    resumen: cadena(objeto.resumen),
    fortalezas: lista(objeto.fortalezas),
    debilidades: lista(objeto.debilidades),
    seccionesFaltantes: lista(objeto.seccionesFaltantes),
    erroresDeAplicacion: errores(objeto.erroresDeAplicacion),
    correccionesTextuales: citas(objeto.correccionesTextuales),
    recomendaciones: lista(objeto.recomendaciones)
  };
};
