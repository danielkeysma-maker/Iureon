import type { RolDelEstilo } from './types';

/**
 * Lo que se le pide al motor al «Leer el formato».
 *
 * El motor es Gemini Flash en modo JSON: es extracción contra un esquema
 * cerrado, no redacción, y pagar un motor de redacción por eso encarecería una
 * operación que cuesta $100. Recibe el escrito YA SANEADO —con marcadores en
 * lugar de datos— y la instrucción repite lo que la guarda impone de todos
 * modos: la instrucción reduce lo que hay que descartar, la guarda es la que
 * garantiza.
 */
export const PROMPT_LECTOR_DE_FORMATO = `Eres un lector de FORMATO de escritos jurídicos colombianos. Recibes un escrito ya anonimizado: los datos del caso vienen como marcadores entre corchetes ([PARTE], [IDENTIFICACIÓN], [RADICADO], [VALOR], [FECHA], [DIRECCIÓN], [CORREO], [TELÉFONO], [DESPACHO]).

Tu tarea es extraer SOLO LA FORMA del escrito —cómo está escrito—, nunca su contenido. Devuelve EXCLUSIVAMENTE un objeto JSON con esta forma:

{
  "titulosDeSeccion": [{ "titulo": "HECHOS", "numeracion": "ROMANOS" }],
  "numeracionHechos": "ORDINALES",
  "ordenDeSecciones": ["HECHOS", "PRETENSIONES", "PRUEBAS"],
  "encabezado": "Señor [DESPACHO]",
  "formulasDeApertura": ["..."],
  "formulasDeCierre": ["..."],
  "bloqueDeFirma": ["[NOMBRE DEL APODERADO]", "C.C. [IDENTIFICACIÓN]", "T.P. [TARJETA PROFESIONAL]"],
  "tratamiento": { "formula": "su señoría", "persona": "PRIMERA_SINGULAR" },
  "glosario": [{ "preferido": "libelo", "variantes": ["demanda"], "ejemplo": "..." }]
}

VALORES PERMITIDOS: "numeracion" y "numeracionHechos" ∈ ROMANOS | ARABIGOS | ORDINALES | NINGUNA (o null si el escrito no numera hechos). "persona" ∈ PRIMERA_SINGULAR | PRIMERA_PLURAL | TERCERA.

REGLAS:
- Cada cadena tiene como máximo 300 caracteres.
- Los títulos van SIN su numeral («HECHOS», no «I. HECHOS»); la numeración va en su campo.
- El encabezado y el bloque de firma llevan marcadores en lugar de datos. Nunca un nombre, un número ni un despacho concreto.
- Las fórmulas de apertura y de cierre son frases de cortesía y de estilo («Con todo respeto, me permito», «Del señor Juez,»), sin hechos del caso.
- El glosario recoge solo vocabulario que el escrito prefiere sobre un sinónimo corriente, con una frase de ejemplo sin datos del caso.
- NUNCA incluyas artículos, leyes, decretos, códigos, sentencias ni providencias, plazos o términos, cifras, nombres de personas o entidades, hechos ni pretensiones. Si una fórmula los trae, no la incluyas.
- Si algo no aparece en el escrito, déjalo vacío ([], "" o null). No inventes nada que el escrito no traiga.`;

export const mensajeDelLector = (input: {
  escritoSaneado: string;
  rol: RolDelEstilo;
  rama: string | null;
  documentType?: string | null;
}): string =>
  `ROL: ${input.rol} · RAMA: ${input.rama ?? 'general del rol'} · ACTUACIÓN: ${input.documentType || 'sin indicar'}

ESCRITO ANONIMIZADO:
"""
${input.escritoSaneado}
"""`;

/** El JSON de la respuesta, tolerando que el proveedor lo envuelva en texto o en un bloque de código. */
export const extraerJson = (texto: string): unknown | null => {
  const t = texto.trim();
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    const desde = t.indexOf('{');
    const hasta = t.lastIndexOf('}');
    if (desde === -1 || hasta <= desde) return null;
    try {
      return JSON.parse(t.slice(desde, hasta + 1));
    } catch {
      return null;
    }
  }
};
