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

export const prepararTexto = (bruto: string): TextoPreparado => {
  const limpio = bruto.replace(/\s+/g, ' ').trim();
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
  "recomendaciones": ["qué haría antes de presentarlo, en orden de importancia"]
}
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

export interface InformeDeRevision {
  resumen: string;
  fortalezas: string[];
  debilidades: string[];
  seccionesFaltantes: string[];
  erroresDeAplicacion: ErrorDeAplicacion[];
  recomendaciones: string[];
}

const cadena = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim();

const lista = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(cadena).filter(Boolean);
  const una = cadena(v);
  return una ? [una] : [];
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
export const parsearInforme = (crudo: string): InformeDeRevision | null => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  if (inicio === -1) return null;

  const intentos: string[] = [];
  const fin = sinCerca.lastIndexOf('}');
  if (fin > inicio) intentos.push(sinCerca.slice(inicio, fin + 1));
  const reparado = repararJsonCortado(sinCerca);
  if (reparado) intentos.push(reparado);

  let objeto: Record<string, unknown> | null = null;
  for (const intento of intentos) {
    try {
      objeto = JSON.parse(intento) as Record<string, unknown>;
      break;
    } catch {
      objeto = null;
    }
  }
  if (!objeto || typeof objeto !== 'object' || Array.isArray(objeto)) return null;

  return {
    resumen: cadena(objeto.resumen),
    fortalezas: lista(objeto.fortalezas),
    debilidades: lista(objeto.debilidades),
    seccionesFaltantes: lista(objeto.seccionesFaltantes),
    erroresDeAplicacion: errores(objeto.erroresDeAplicacion),
    recomendaciones: lista(objeto.recomendaciones)
  };
};
