import { config } from '../../config/env.config';
import { ENGINE, callOpenRouterWithUsage } from '../agent/openrouter.client';
import { catalogService } from './catalog.service';
import type { Actuacion, LegalBranch } from './types';

/**
 * Turns a description of facts into the actuaciones that might apply.
 *
 * WHO THIS IS FOR. The search demands that a lawyer already know the legal
 * question: "desembargo de salario mínimo" IS law. Somebody who does not know
 * writes "a mi cliente le están descontando todo el sueldo y tiene tres hijos".
 * Those are facts, and until now the catalogue — the only verified knowledge
 * this product owns — could not be reached from them. The answer was in the
 * building and there was no door.
 *
 * THE MODEL NEVER WRITES LAW. It receives the facts and the complete list of
 * catalogued names, and it does exactly one thing: pick from that list. Every
 * name it returns is then looked up in the catalogue, and a name that does not
 * resolve is DROPPED — so a model that invents "Demanda de reconvención
 * anticipada" produces nothing rather than an entry nobody verified.
 *
 * What the lawyer gets back is never the model's prose: it is the catalogue's
 * own record — term, article, competent authority, required sections — for
 * entries whose names the model recognised. The model chooses the door; the
 * catalogue says what is behind it.
 *
 * IT SUGGESTS AND NEVER CONCLUDES. A junior who is told "this is a tutela"
 * believes it. So every suggestion carries the reason the model gave for it, and
 * nothing is presented as a determination of what the case IS.
 */

export interface TriageSuggestion {
  actuacion: Actuacion;
  /** Why the model proposed it, in its words, for the lawyer to dismiss or keep. */
  razon: string;
}

export type TriageStatus =
  | 'OK'
  /** The catalogue recognised nothing. Said plainly rather than padded. */
  | 'SIN_COINCIDENCIA'
  | 'NO_PROVIDER'
  | 'FAILED';

export interface TriageResult {
  status: TriageStatus;
  suggestions: TriageSuggestion[];
  /** Names the model returned that do not exist in the catalogue. */
  descartadas: string[];
  reason?: string;
  /**
   * Lo que el catalogo LEYO de los hechos: la rama dominante y los elementos
   * facticos que produjeron las sugerencias. Es lectura del modelo y se
   * presenta como tal — su valor es dejar corregir el rumbo temprano.
   */
  senales?: { rama: string | null; elementos: string[] };
  /** Solo con SIN_COINCIDENCIA: los datos que faltan y definirian la via. */
  preguntas?: string[];
}

/** More than this and the answer stops being a shortlist and becomes a menu. */
const MAX_SUGGESTIONS = 6;

const SYSTEM_PROMPT = `Eres un abogado colombiano que orienta a un colega sobre qué actuación procesal corresponde a unos hechos.

REGLA ABSOLUTA: solo puedes escoger nombres de la lista que se te entrega, copiados EXACTAMENTE como aparecen allí. No inventes nombres, no los adaptes, no los traduzcas, no los abrevies. Un nombre que no esté en la lista se descarta y tu respuesta pierde valor.

No expliques derecho, no cites normas y no afirmes plazos: el sistema ya tiene el término verificado de cada actuación y lo mostrará por su cuenta. Tu único trabajo es escoger cuáles vienen al caso y decir en una frase por qué.

Si los hechos no corresponden a ninguna actuación de la lista, devuelve una lista vacía. Es una respuesta correcta y útil: es preferible a proponer algo que no aplica.

Ademas de las actuaciones, di QUE LEISTE: la rama que dominan los hechos y los elementos facticos que te llevaron a las sugerencias (3 a 6, en dos o tres palabras cada uno, tomados de los hechos y no inventados).

Si devuelves la lista vacia, incluye "preguntas": 2 a 4 datos que faltan y definirian la via procesal (ej. "¿Contra quien se dirige: entidad publica o particular?"). Solo preguntas cuya respuesta cambiaria la actuacion.

Responde SOLO con JSON válido, sin texto alrededor:
{"actuaciones":[{"nombre":"<nombre exacto de la lista>","rama":"<RAMA>","razon":"<una frase>"}],"senales":{"rama":"<RAMA dominante>","elementos":["<hecho clave>"]},"preguntas":["<solo si actuaciones quedo vacia>"]}`;

/** The closed list the model must choose from: every catalogued name, by branch. */
const catalogueMenu = (): string => {
  /*
   * Las transversales van UNA vez, en su propia seccion. list(branch) ahora
   * las incluye en toda rama (derecho de peticion visible para el laboralista),
   * pero repetir 18 nombres en 22 ramas inflaria el prompt y le sugeriria al
   * modelo que son 396 actuaciones distintas.
   */
  const porRama = catalogService
    .listBranches()
    .map((branch) => {
      const nombres = catalogService
        .list(branch)
        .filter((a) => a.branch === branch)
        .map((a) => `  - ${a.exactName}`)
        .join('\n');
      return `${branch}:\n${nombres}`;
    })
    .join('\n\n');

  const transversales = catalogService
    .list()
    .filter((a) => a.transversal)
    .map((a) => `  - ${a.exactName}`)
    .join('\n');

  return transversales
    ? `${porRama}\n\nTRANSVERSAL (aplican en cualquier rama):\n${transversales}`
    : porRama;
};

interface ModelPick {
  nombre?: string;
  rama?: string;
  razon?: string;
}

/**
 * Reads the model's JSON, tolerating the fences it sometimes wraps it in.
 *
 * Returns null when nothing parseable came back, which the caller reports as a
 * failure rather than as "no match" — a model that answered badly and a
 * catalogue that has nothing to offer are different facts about the case.
 */
interface ParsedTriage {
  picks: ModelPick[];
  senales: { rama: string | null; elementos: string[] };
  preguntas: string[];
}

const parsePicks = (text: string): ParsedTriage | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      actuaciones?: ModelPick[];
      senales?: { rama?: unknown; elementos?: unknown };
      preguntas?: unknown;
    };
    if (!Array.isArray(parsed.actuaciones)) return null;

    return {
      picks: parsed.actuaciones,
      /*
       * Lo que el modelo LEYO, saneado: solo strings cortas, maximo 6. Es la
       * lectura que produjo las sugerencias — mostrarla deja corregir el rumbo
       * ("no, no es laboral") antes de perder tiempo en fichas equivocadas.
       */
      senales: {
        rama: typeof parsed.senales?.rama === 'string' ? parsed.senales.rama : null,
        elementos: Array.isArray(parsed.senales?.elementos)
          ? (parsed.senales!.elementos as unknown[])
              .filter((e): e is string => typeof e === 'string' && e.length > 1 && e.length < 60)
              .slice(0, 6)
          : []
      },
      preguntas: Array.isArray(parsed.preguntas)
        ? (parsed.preguntas as unknown[])
            .filter((q): q is string => typeof q === 'string' && q.length > 5 && q.length < 160)
            .slice(0, 4)
        : []
    };
  } catch {
    return null;
  }
};

export const triageFacts = async (facts: string): Promise<TriageResult> => {
  const clean = facts.trim();

  if (clean.length < 20) {
    return {
      status: 'SIN_COINCIDENCIA',
      suggestions: [],
      descartadas: [],
      reason: 'Describe los hechos con algo más de detalle: quién, qué pasó y qué se busca.'
    };
  }

  /*
   * Se pregunta por la configuración, no se deduce del silencio.
   *
   * Antes esto inferia "no hay motor" de una respuesta vacia, y por eso una
   * consulta sin coincidencia — que devuelve una lista vacia de 18 caracteres —
   * se reportaba como que la IA no estaba configurada. Un rechazo correcto
   * presentado como una averia.
   */
  if (!config.openRouter.apiKey) {
    return {
      status: 'NO_PROVIDER',
      suggestions: [],
      descartadas: [],
      reason: 'El motor de IA no está configurado, así que la orientación por hechos no está disponible.'
    };
  }

  let raw: string;

  try {
    const result = await callOpenRouterWithUsage(
      // The cheap engine on purpose: this is a classification against a closed
      // list, not drafting. Paying Opus rates to pick from a menu would make
      // the feature cost more than the document it leads to.
      ENGINE.GEMINI,
      SYSTEM_PROMPT,
      `HECHOS:\n${clean}\n\nACTUACIONES DISPONIBLES:\n${catalogueMenu()}`,
      2000,
      // Una lista vacía son 18 caracteres y es la respuesta correcta cuando
      // el catálogo no reconoce nada. El piso por defecto la tiraría.
      0
    );
    raw = result.text;
  } catch (error) {
    return {
      status: 'FAILED',
      suggestions: [],
      descartadas: [],
      reason: `No se pudo consultar el motor: ${(error as Error).message}`
    };
  }

  if (!raw.trim()) {
    return {
      status: 'FAILED',
      suggestions: [],
      descartadas: [],
      reason: 'El motor no devolvió respuesta.'
    };
  }

  const parsed = parsePicks(raw);

  if (parsed === null) {
    return {
      status: 'FAILED',
      suggestions: [],
      descartadas: [],
      reason: 'El motor respondió en un formato que no se pudo leer.'
    };
  }

  const suggestions: TriageSuggestion[] = [];
  const descartadas: string[] = [];
  const vistas = new Set<string>();

  for (const pick of parsed.picks) {
    const nombre = (pick.nombre ?? '').trim();
    if (!nombre || vistas.has(nombre)) continue;
    vistas.add(nombre);

    // THE GUARD. A name the catalogue does not resolve never reaches the lawyer,
    // however plausible it sounds. `findByDocumentType` also refuses a label
    // that fits more than one branch, which is why the branch travels with it.
    const actuacion = catalogService.findByDocumentType(
      nombre,
      (pick.rama as LegalBranch) || undefined
    );

    if (!actuacion) {
      descartadas.push(nombre);
      continue;
    }

    suggestions.push({ actuacion, razon: (pick.razon ?? '').trim() });
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }

  if (suggestions.length === 0) {
    return {
      status: 'SIN_COINCIDENCIA',
      suggestions: [],
      descartadas,
      senales: parsed.senales,
      preguntas: parsed.preguntas,
      reason:
        'El catálogo no reconoce una actuación para estos hechos. Puede ser una materia que aún no está catalogada, o que los hechos necesiten más detalle.'
    };
  }

  return { status: 'OK', suggestions, descartadas, senales: parsed.senales };
};
