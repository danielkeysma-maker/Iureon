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

/**
 * The closed list the model must choose from.
 *
 * CON RAMA, EL MENÚ ES SOLO DE ESA RAMA, y eso cambia dos cosas a la vez. La
 * primera es la exactitud: quien ya escogió «Laboral» en Redacción no quiere
 * que se le proponga una tutela, y una sugerencia fuera de rama es una
 * sugerencia que hay que descartar a mano. La segunda es el precio: el menú
 * completo son unos 37.000 caracteres en CADA consulta, y una rama son unos
 * pocos cientos.
 *
 * Sigue siendo OPCIONAL: la pantalla de Orientación no sabe la rama —esa es
 * justo la pregunta que le hace al catálogo— y tiene que seguir viendo el menú
 * entero.
 */
const catalogueMenu = (branch?: LegalBranch): string => {
  if (branch) {
    /*
     * `list(branch)` ya incluye las transversales, y aquí van dentro de la
     * misma lista y no en sección aparte: no hay 22 ramas de las que
     * distinguirlas, y separarlas sugeriría que son de otro catálogo.
     */
    /*
     * LO PRESTADO SE NOMBRA COMO PRESTADO, tambien para el modelo. Si el menu
     * dijera «Recurso de reposicion» a secas dentro de FAMILIA, el modelo
     * tendria motivos para creer que familia tiene ficha propia con plazo
     * propio, y lo repetiria en la razon que le entrega al abogado.
     */
    const nombres = catalogService
      .list(branch)
      .map((a) => (a.porRemision ? `  - ${a.exactName} (${a.porRemision.marca})` : `  - ${a.exactName}`))
      .join('\n');

    return `${branch}:\n${nombres}`;
  }

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

/*
 * EL MOTOR NO SIEMPRE DEVUELVE JSON LIMPIO, y una de cada seis respuestas se
 * perdía por eso: medido el 9 de septiembre de 2026 con la misma pregunta
 * repetida, el mismo motor contestó cinco veces con JSON válido y una con un
 * texto que `JSON.parse` rechazó — comillas rectas dentro de una «razon», una
 * coma final, o prosa alrededor del objeto—. Para el abogado eso era «sale un
 * error» sin más. El lector prueba primero el JSON tal cual; si falla, lo
 * limpia de cercas y comas finales; y si aun así no se lee, rescata los
 * «nombre» uno a uno con una expresión regular. Ese último rescate es seguro
 * porque cada nombre se valida después contra el catálogo: un nombre que no
 * exista se descarta igual que siempre. Y el texto crudo que no se pudo leer
 * queda en el registro del servidor, recortado, para que la próxima vez no
 * haya que adivinar.
 */
/** Último recurso: los «nombre» sueltos; cada uno se valida luego contra el catálogo. */
const rescatarNombres = (objeto: string): Record<string, unknown> | null => {
  const nombres = [...objeto.matchAll(/"nombre"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  if (nombres.length === 0) return null;
  return { actuaciones: nombres.map((nombre) => ({ nombre, rama: '', razon: 'El motor propuso esta actuación; la razón no se pudo leer.' })) };
};

const intentarJson = (fragmento: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(fragmento) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const parsePicks = (text: string): ParsedTriage | null => {
  const sinCercas = text.replace(/```(?:json)?/gi, '').trim();
  const start = sinCercas.indexOf('{');
  const end = sinCercas.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const objeto = sinCercas.slice(start, end + 1);

  const parsed = (intentarJson(objeto) ??
    intentarJson(objeto.replace(/,\s*([}\]])/g, '$1')) ??
    rescatarNombres(objeto)) as {
    actuaciones?: ModelPick[];
    senales?: { rama?: unknown; elementos?: unknown };
    preguntas?: unknown;
  } | null;

  if (!parsed) {
    console.error('[TRIAGE] Respuesta ilegible del motor:', text.slice(0, 600).replace(/\s+/g, ' '));
    return null;
  }

  try {
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

/**
 * @param branch cuando el abogado YA eligió la rama en Redacción. Acota el menú
 *        y descarta lo que caiga fuera; sin ella, el comportamiento es el de
 *        siempre y `TriageView` no cambia.
 */
export const triageFacts = async (facts: string, branch?: LegalBranch): Promise<TriageResult> => {
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
      `HECHOS:\n${clean}\n\nACTUACIONES DISPONIBLES:\n${catalogueMenu(branch)}`,
      /*
       * 6.000 y modo JSON, no 2.000 y texto libre. Con CIVIL —121 nombres en
       * el menú— el motor gastaba los 2.000 razonando en el texto y el
       * proveedor cortaba a los 300 caracteres: la propuesta fallaba SIEMPRE
       * en la rama más usada. El modo JSON le quita la prosa y el tope le
       * deja terminar la lista.
       */
      6000,
      // Una lista vacía son 18 caracteres y es la respuesta correcta cuando
      // el catálogo no reconoce nada. El piso por defecto la tiraría.
      0,
      { json: true }
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
      branch ?? ((pick.rama as LegalBranch) || undefined)
    );

    if (!actuacion) {
      descartadas.push(nombre);
      continue;
    }

    /*
     * SEGUNDA GUARDA, y no sobra. Acotar el menú no impide que el modelo
     * devuelva un nombre de otra rama —lo hace, sobre todo con las que se
     * parecen— y una sugerencia fuera de la rama que el abogado ya eligió
     * cambiaría el escrito por debajo sin decirlo. Se descarta, y se ve en
     * `descartadas`.
     */
    if (
      branch &&
      actuacion.branch !== branch &&
      actuacion.transversal !== true &&
      actuacion.porRemision?.paraRama !== branch
    ) {
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
