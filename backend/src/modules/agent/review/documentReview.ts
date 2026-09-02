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

/** About 15 pages of dense legal prose. Enough for a tutela; not for an expediente. */
export const MAX_CARACTERES_REVISION = 60_000;

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
Escribe en español jurídico colombiano, neutro y preciso. Cada elemento de las listas es una frase completa y autónoma.`;

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
 * The model's JSON, or null. Never throws: a report that cannot be read is
 * handed over as free text by the controller, not lost.
 */
export const parsearInforme = (crudo: string): InformeDeRevision | null => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  const fin = sinCerca.lastIndexOf('}');
  if (inicio === -1 || fin <= inicio) return null;

  let objeto: Record<string, unknown>;
  try {
    objeto = JSON.parse(sinCerca.slice(inicio, fin + 1)) as Record<string, unknown>;
  } catch {
    return null;
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
