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
