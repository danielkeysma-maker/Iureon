import type { TranscriptSegment } from '../transcription/types';

/**
 * El guion sugerido de la entrevista. Artboard 2a.
 *
 * ─── QUÉ PROBLEMA RESUELVE, EN LAS PALABRAS DEL ARTBOARD ────────────────────
 *
 *   «El guion sugerido tacha lo ya cubierto en vivo: es la única forma de que
 *    el abogado no salga de la reunión SIN LA FECHA QUE DEFINE EL TÉRMINO.»
 *
 * No es una lista de tareas ni un cuestionario. Es que hay datos cuya ausencia
 * no se nota hasta ir a redactar —y para entonces el término lleva días
 * corriendo—. Puede haber una segunda entrevista, claro: el producto las
 * cuenta. Lo que no se recupera es el tiempo.
 *
 * ─── SE TACHA POR LO QUE SE DIJO, NO POR LO QUE SE MARCÓ ────────────────────
 *
 * Nadie va a ir marcando casillas con el cliente enfrente. La cobertura se
 * deduce del transcrito: si en la conversación aparecieron las palabras de una
 * pregunta, se da por cubierta. Es una heurística y se comporta como tal —
 * **tachar de más es el error caro aquí**, porque deja al abogado tranquilo
 * sobre algo que no preguntó. Por eso exige DOS términos distintos, no uno:
 * «inspector» suelto aparece en cualquier conversación laboral; «inspector» y
 * «permiso» juntos ya describen el hecho.
 *
 * ─── POR QUÉ NO LO DECIDE UN MODELO ─────────────────────────────────────────
 *
 * Preguntarle a un modelo «¿ya cubrieron la fecha del despido?» daría una
 * respuesta mejor y a veces equivocada, sin forma de saber cuándo. Una regla de
 * dos palabras se equivoca de manera predecible y se puede leer. En la pantalla
 * que decide si el abogado se va tranquilo, prefiero un error que se entiende.
 */

export interface PreguntaDelGuion {
  id: string;
  texto: string;
  /** Dos o más deben aparecer para darla por cubierta. */
  senales: readonly string[];
  /**
   * Lo que se pierde si no se pregunta HOY. Vacío cuando el dato se puede
   * conseguir después sin costo — no todo urge, y decir que sí todo urge es
   * la manera más rápida de que no urja nada.
   */
  loQueCuesta?: string;
}

/**
 * El guion base, común a cualquier entrevista.
 *
 * Deliberadamente corto. Un guion de veinte preguntas no se lee en una reunión;
 * se lee uno de cuatro, y por eso las cuatro son las que definen términos o
 * cierran la puerta a un medio de prueba.
 */
export const GUION_BASE: readonly PreguntaDelGuion[] = [
  {
    id: 'fecha-hecho',
    texto: '¿Cuándo ocurrió el hecho, con día exacto?',
    senales: ['fecha', 'día', 'dia', 'ocurrió', 'ocurrio', 'pasó', 'paso', 'fue el'],
    loQueCuesta: 'Sin el día, ningún término se puede contar.'
  },
  {
    id: 'fecha-notificacion',
    texto: '¿Cuándo se lo notificaron o se enteró?',
    senales: ['notific', 'me entere', 'me enteré', 'me avisaron', 'recibí', 'recibi'],
    loQueCuesta:
      'La mayoría de los términos corren desde la notificación, no desde el hecho.'
  },
  {
    id: 'actuacion-previa',
    texto: '¿Se presentó algún recurso o reclamación antes?',
    senales: ['recurso', 'reclamacion', 'reclamación', 'apel', 'reposicion', 'reposición', 'peticion', 'petición'],
    loQueCuesta: 'Un requisito de procedibilidad sin agotar tumba la demanda entera.'
  },
  {
    id: 'documentos',
    texto: '¿Qué documentos puede aportar, y los tiene hoy?',
    senales: ['documento', 'copia', 'carta', 'certificado', 'historia', 'dictamen', 'contrato'],
    loQueCuesta: 'Lo que el cliente trae hoy no hay que ir a pedirlo después.'
  }
];

/**
 * Cuáles preguntas ya se cubrieron, leyendo lo que se dijo.
 *
 * Compara sin tildes y en minúsculas: un transcrito escribe «notificó» y el
 * abogado dice «notifico», y esa diferencia no debería decidir si una pregunta
 * queda tachada.
 */
const plano = (t: string): string =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const preguntasCubiertas = (
  segmentos: readonly TranscriptSegment[],
  guion: readonly PreguntaDelGuion[] = GUION_BASE
): Set<string> => {
  const dicho = plano(segmentos.map((s) => s.text).join(' '));
  const cubiertas = new Set<string>();

  for (const pregunta of guion) {
    /*
     * LAS SEÑALES SE APLANAN Y SE DEDUPLICAN ANTES DE CONTAR.
     *
     * Sin esto, «día» y «dia» —la misma palabra con y sin tilde— contaban DOS
     * al comparar sin acentos, y una sola palabra dicha de pasada tachaba la
     * pregunta. Es exactamente el error que este módulo declara como el caro:
     * dejar al abogado tranquilo sobre algo que no preguntó.
     *
     * Lo destapó una prueba de la heurística, no la lectura del código: las dos
     * variantes están escritas una debajo de la otra en la lista y se ven como
     * dos señales distintas.
     */
    const senales = new Set(pregunta.senales.map(plano));
    const encontradas = [...senales].filter((s) => dicho.includes(s)).length;
    /*
     * DOS SEÑALES, NO UNA. Con una sola, «documento» tacharía la pregunta de
     * los documentos en cualquier entrevista donde alguien dijera la palabra
     * de paso — y tachar de más es el error caro: deja al abogado tranquilo
     * sobre algo que no preguntó.
     */
    if (encontradas >= 2) cubiertas.add(pregunta.id);
  }

  return cubiertas;
};

/**
 * Lo mínimo que hace falta de una entrevista anterior para saber qué cubrió.
 * Es un subconjunto de la fila guardada, para que la función no dependa del
 * tipo entero de la API.
 */
export interface EntrevistaPrevia {
  id: string;
  /** ISO. Puede faltar en filas viejas; entonces se ordena al final. */
  transcribedAt: string | null;
  segments: readonly TranscriptSegment[];
}

export interface CoberturaPrevia {
  entrevistaId: string;
  transcribedAt: string | null;
}

/**
 * Qué preguntas quedaron cubiertas en entrevistas ANTERIORES con el mismo
 * cliente, y en cuál.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * El guion arrancaba entero en cada entrevista. En la segunda con el mismo
 * cliente, el abogado veía «¿Cuándo ocurrió el hecho?» sin tachar y volvía a
 * preguntarlo — o, peor, lo daba por preguntado sin saber si de verdad quedó
 * dicho. La pregunta la hizo el usuario: «¿y no puede haber una segunda
 * entrevista?». Sí puede, y el producto las cuenta; lo que no hacía era
 * recordar.
 *
 * ─── SE ATRIBUYE A LA PRIMERA QUE LA CUBRIÓ ─────────────────────────────────
 *
 * Si tres entrevistas hablaron de la fecha, la que importa es la primera:
 * es donde está la respuesta original y la que hay que releer. Las previas
 * se ordenan por fecha ascendente; las que no tienen fecha van al final para
 * no ganarle a una que sí la tiene.
 *
 * ─── LO QUE NO HACE ─────────────────────────────────────────────────────────
 *
 * No filtra por cliente: recibe la lista ya filtrada. Decidir qué entrevistas
 * son «del mismo cliente» es de quien tiene la fila con el `client_id`, y
 * mezclar esa decisión aquí volvería la función imposible de probar sin
 * fabricar filas enteras.
 */
export const cubiertasEnEntrevistasPrevias = (
  previas: readonly EntrevistaPrevia[],
  guion: readonly PreguntaDelGuion[] = GUION_BASE
): Map<string, CoberturaPrevia> => {
  const ordenadas = [...previas].sort((a, b) => {
    if (a.transcribedAt === b.transcribedAt) return 0;
    if (a.transcribedAt === null) return 1;
    if (b.transcribedAt === null) return -1;
    return a.transcribedAt < b.transcribedAt ? -1 : 1;
  });

  const resultado = new Map<string, CoberturaPrevia>();

  for (const previa of ordenadas) {
    for (const id of preguntasCubiertas(previa.segments, guion)) {
      if (!resultado.has(id)) {
        resultado.set(id, { entrevistaId: previa.id, transcribedAt: previa.transcribedAt });
      }
    }
  }

  return resultado;
};

export type EstadoDePregunta =
  | { estado: 'pendiente' }
  | { estado: 'hoy' }
  | { estado: 'antes'; origen: CoberturaPrevia };

/**
 * El estado de cada pregunta para la pantalla, con una regla de prioridad:
 * lo dicho HOY gana a lo dicho antes. Si el cliente vuelve a contar la fecha
 * en la segunda entrevista, la pregunta queda cubierta hoy y no remite a la
 * anterior — la respuesta más reciente es la que el abogado tiene delante.
 */
export const estadoDelGuion = (
  hoy: ReadonlySet<string>,
  antes: ReadonlyMap<string, CoberturaPrevia>,
  guion: readonly PreguntaDelGuion[] = GUION_BASE
): Map<string, EstadoDePregunta> => {
  const estados = new Map<string, EstadoDePregunta>();
  for (const p of guion) {
    if (hoy.has(p.id)) estados.set(p.id, { estado: 'hoy' });
    else {
      const origen = antes.get(p.id);
      estados.set(p.id, origen ? { estado: 'antes', origen } : { estado: 'pendiente' });
    }
  }
  return estados;
};
