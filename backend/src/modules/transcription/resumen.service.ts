import { ENGINE, callOpenRouterWithUsage } from '../agent/openrouter.client';
import type { TranscriptSegment } from './types';

/*
 * Etiquetas legibles de los roles, aqui y no importadas: el backend no tiene
 * un ROLE_LABELS (vive en el frontend), y este servicio solo las necesita para
 * que el modelo lea "Demandante" en vez de "DEMANDANTE".
 */
const ETIQUETA: Record<string, string> = {
  JUEZ: 'Juez',
  DEMANDANTE: 'Demandante',
  DEMANDADO: 'Demandado',
  APODERADO_DEMANDANTE: 'Apoderado del demandante',
  APODERADO_DEMANDADO: 'Apoderado del demandado',
  TESTIGO: 'Testigo',
  FISCAL: 'Fiscal',
  ABOGADO: 'Abogado',
  CLIENTE: 'Cliente',
  FAMILIAR: 'Familiar',
  DESCONOCIDO: 'Interlocutor'
};

/**
 * El resumen y los hechos relevantes de una transcripción, extraídos por el
 * motor. Sirve igual para una audiencia y para una entrevista: las dos son una
 * conversación transcrita de la que un abogado necesita lo esencial sin releer
 * dos horas.
 *
 * ─── EL CONTRATO, QUE ES LO QUE IMPORTA ─────────────────────────────────────
 *
 * Cada hecho viene ANCLADO: con el minuto y con quién lo dijo. No es adorno —
 * es lo que permite verificarlo contra el audio en segundos, y es la misma
 * regla de todo el producto: lo que la máquina ofrece, el humano lo comprueba.
 * Un "hecho" sin ancla es una afirmación del modelo; con ancla es un puntero a
 * lo que la persona dijo.
 *
 * Por lo mismo, el prompt prohíbe conclusiones jurídicas. "La incapacidad iba
 * hasta el 20 de febrero" es un hecho de la transcripción; "hubo despido
 * ineficaz por fuero de salud" es una tesis, y las tesis se construyen en
 * redacción con el abogado al frente.
 */

export interface HechoRelevante {
  /** Segundos desde el inicio, o null si el segmento no traía tiempo. */
  t: number | null;
  /** Quién lo dijo, con el nombre ya asignado si lo hay. */
  quien: string;
  hecho: string;
}

export interface ResumenDeTranscripcion {
  resumen: string;
  hechos: HechoRelevante[];
  modelo: string;
  generadoEl: string;
}

/** Lo que costó la llamada, para el registro de consumo del llamador. */
export interface ResumenConCosto {
  resumen: ResumenDeTranscripcion | null;
  costUsd: number;
}

const SYSTEM_PROMPT = `Eres un asistente de un despacho jurídico colombiano. Recibes la transcripción de una AUDIENCIA JUDICIAL o una ENTREVISTA CON CLIENTE, con marcas de tiempo e interlocutores.

Tu única tarea: extraer lo que se DIJO. Reglas estrictas:

1. HECHOS, NO TESIS. "La incapacidad iba hasta el 20 de febrero" es un hecho dicho. "Hubo despido ineficaz" es una conclusión jurídica: PROHIBIDA. No calificas, no concluyes, no recomiendas.
2. SOLO LO QUE ESTÁ EN EL TEXTO. Si un dato no aparece en la transcripción, no existe. No completes fechas, nombres ni cifras que no estén escritas.
3. CADA HECHO CON SU ANCLA. Copia el tiempo en segundos ("t") y el interlocutor ("quien") del segmento de donde salió el hecho, exactamente como vienen en la transcripción.
4. Si la transcripción no contiene hechos relevantes, responde con la lista vacía. Es una respuesta válida.

Responde SOLO este JSON, sin markdown ni texto alrededor:
{"resumen":"3 a 5 frases sobre qué fue esta conversación y qué se trató","hechos":[{"t":671,"quien":"Sr. Mosquera","hecho":"..."}]}`;

/**
 * La transcripción como la ve el modelo: tiempo · quién · texto.
 *
 * Con tope de caracteres, porque una audiencia de dos horas supera cualquier
 * presupuesto razonable de entrada. El corte es por SEGMENTOS completos y no
 * por caracteres a mitad de frase — un hecho cortado por la mitad es un hecho
 * inventado a medias.
 */
const MAX_ENTRADA = 90_000;

const formatear = (segments: TranscriptSegment[]): { texto: string; truncado: boolean } => {
  const lineas: string[] = [];
  let total = 0;

  for (const s of segments) {
    // Un rol sin etiqueta se lee legible ("APODERADO_VICTIMA" -> "Apoderado victima"),
    // nunca como "speaker_2": el modelo ancla los hechos a este nombre.
    const rolLegible =
      ETIQUETA[s.role] ??
      (s.role !== 'DESCONOCIDO'
        ? s.role.charAt(0) + s.role.slice(1).toLowerCase().replace(/_/g, ' ')
        : s.speakerLabel);
    const quien = s.speakerName ?? rolLegible;
    const t = s.startSeconds !== null && s.startSeconds !== undefined ? Math.round(s.startSeconds) : '';
    const linea = `[${t}] ${quien}: ${s.text.trim()}`;

    if (total + linea.length > MAX_ENTRADA) {
      return { texto: lineas.join('\n'), truncado: true };
    }
    lineas.push(linea);
    total += linea.length;
  }

  return { texto: lineas.join('\n'), truncado: false };
};

/** El JSON del modelo, o null. Nunca lanza: un resumen fallido no es un error de la pantalla. */
const parsear = (crudo: string): { resumen: string; hechos: HechoRelevante[] } | null => {
  try {
    // El modelo a veces envuelve en ```json pese a la instrucción.
    const limpio = crudo.replace(/```json?/g, '').replace(/```/g, '').trim();
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (inicio === -1 || fin <= inicio) return null;

    const obj = JSON.parse(limpio.slice(inicio, fin + 1)) as {
      resumen?: unknown;
      hechos?: unknown;
    };

    if (typeof obj.resumen !== 'string' || obj.resumen.length < 10) return null;

    const hechos: HechoRelevante[] = Array.isArray(obj.hechos)
      ? obj.hechos
          .filter(
            (h): h is { t?: unknown; quien?: unknown; hecho?: unknown } =>
              typeof h === 'object' && h !== null
          )
          .map((h) => ({
            t: typeof h.t === 'number' && Number.isFinite(h.t) ? h.t : null,
            quien: typeof h.quien === 'string' ? h.quien : 'Interlocutor',
            hecho: typeof h.hecho === 'string' ? h.hecho : ''
          }))
          .filter((h) => h.hecho.length > 5)
      : [];

    return { resumen: obj.resumen, hechos };
  } catch {
    return null;
  }
};

/** El parser, expuesto solo para el check determinista. */
export const parsearParaCheck = parsear;

/**
 * Genera el resumen. Gemini y no Opus: es la etapa de LEER mucho y devolver
 * poco, exactamente el perfil por el que Gemini corre la extracción de hechos
 * del pipeline de redacción.
 */
export const generarResumen = async (
  segments: TranscriptSegment[],
  kind: string
): Promise<ResumenConCosto> => {
  if (segments.length === 0) return { resumen: null, costUsd: 0 };

  const { texto, truncado } = formatear(segments);

  const userPrompt = `Tipo de conversación: ${kind === 'ENTREVISTA' ? 'ENTREVISTA CON CLIENTE' : 'AUDIENCIA JUDICIAL'}.
${truncado ? 'NOTA: la transcripción fue recortada por longitud; resume solo lo presente.\n' : ''}
TRANSCRIPCIÓN:
${texto}`;

  const llamada = await callOpenRouterWithUsage(ENGINE.GEMINI, SYSTEM_PROMPT, userPrompt, 2048);
  const costUsd = llamada.usage?.costUsd ?? 0;
  const parseado = parsear(llamada.text);

  if (!parseado) return { resumen: null, costUsd };

  return {
    resumen: {
      ...parseado,
      modelo: ENGINE.GEMINI,
      generadoEl: new Date().toISOString()
    },
    costUsd
  };
};
