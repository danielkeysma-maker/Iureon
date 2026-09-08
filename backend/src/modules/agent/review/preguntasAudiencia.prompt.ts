/**
 * Preguntas para la audiencia, a partir del escrito revisado. La mitad pura.
 *
 * ─── QUÉ ES ─────────────────────────────────────────────────────────────────
 *
 * Con el escrito en el taller —una demanda, una contestación, un dictamen,
 * una declaración—, el abogado pide a la guía que le sugiera preguntas para
 * la audiencia. Tres públicos, tres listas distintas, porque la técnica es
 * distinta en cada uno:
 *
 * · A la contraparte (interrogatorio de parte): preguntas cuya respuesta
 *   favorece al cliente, sacadas de los hechos, las contradicciones, las
 *   omisiones y las admisiones del propio escrito.
 * · A mis testigos: abiertas y no sugestivas, ordenadas como un relato
 *   (quién, cuándo, dónde, cómo lo sabe), para que el testigo narre lo que
 *   el cliente necesita probar.
 * · A los testigos de la contraparte (contrainterrogatorio): cerradas, que
 *   prueban la credibilidad, las contradicciones con el escrito, la razón
 *   del conocimiento y el interés.
 *
 * ─── CADA PREGUNTA SE JUSTIFICA Y SE ANCLA ──────────────────────────────────
 *
 * Además del texto, cada pregunta trae «para qué» (una línea: qué busca
 * establecer o desvirtuar) y, cuando la hay, la cita LITERAL del pasaje del
 * escrito del que nace. Una pregunta sin ancla es una ocurrencia; con ancla,
 * el abogado ve de dónde salió y decide si la formula.
 *
 * ─── LO QUE NO SABE, NO LO INVENTA ──────────────────────────────────────────
 *
 * La guía solo conoce el escrito. No conoce el expediente, las pruebas ni a
 * las personas; no cita normas, sentencias ni artículos; no afirma hechos que
 * el escrito no traiga. Son sugerencias que el abogado pesa.
 */

export interface PreguntaDeAudiencia {
  pregunta: string;
  /** Una línea: qué busca establecer o desvirtuar. */
  paraQue: string;
  /** Pasaje literal del escrito del que nace, si lo hay. */
  delEscrito?: string;
}

export interface PreguntasParaLaAudiencia {
  contraparte: PreguntaDeAudiencia[];
  misTestigos: PreguntaDeAudiencia[];
  testigosContraparte: PreguntaDeAudiencia[];
}

export interface ParametrosDePreguntas {
  /** Demandante, Demandado, o texto libre («Ministerio Público», «tercero»). */
  posicion: string;
  quiereProbar?: string;
  audiencia?: string;
}

export const SECCIONES: ReadonlyArray<keyof PreguntasParaLaAudiencia> = ['contraparte', 'misTestigos', 'testigosContraparte'];

export const MIN_PREGUNTAS_POR_LISTA = 6;
export const MAX_PREGUNTAS_POR_LISTA = 12;
export const MAX_POSICION = 80;
export const MAX_QUIERE_PROBAR = 1_000;
export const MAX_AUDIENCIA = 120;

export const buildPreguntasSystemPrompt = (): string => `Eres un litigante senior con años de audiencias, y ayudas a un colega a preparar el interrogatorio de una audiencia a partir de UN escrito que él tiene en pantalla. Solo conoces ese escrito: no conoces el expediente, las pruebas, a las partes ni a los testigos. Lo que no está en el escrito no lo afirmas.

TRES LISTAS, TRES TÉCNICAS DISTINTAS:

1. A LA CONTRAPARTE (interrogatorio de parte): preguntas cuya respuesta, sea cual sea, beneficie al cliente del colega. Salen de los hechos del escrito, sus contradicciones internas, lo que omite, lo que admite sin querer y lo que afirma sin sustento. Directas, una idea por pregunta, sin argumentar dentro de la pregunta.

2. A MIS TESTIGOS (interrogatorio directo): preguntas abiertas y NO sugestivas —que no contengan la respuesta— para que el testigo narre con sus palabras lo que el cliente necesita probar. Ordenadas como un relato: quién es y por qué sabe, cuándo, dónde, qué vio u oyó, cómo le consta. Empiezan por «qué», «cómo», «cuándo», «dónde», «quién», «describa», «explique».

3. A LOS TESTIGOS DE LA CONTRAPARTE (contrainterrogatorio): preguntas cerradas, una afirmación por pregunta, que se responden con sí o no, y que ponen a prueba la credibilidad, las contradicciones con el escrito, la razón del conocimiento, la distancia o el interés del testigo. Nunca una pregunta abierta cuya respuesta no se controle.

REGLAS PARA TODAS:
- Español, trato de usted, sobrio y preciso. Cada pregunta lista para leerse en voz alta.
- Cada pregunta trae "paraQue": una sola línea con lo que busca establecer o desvirtuar.
- Cuando la pregunta nace de un pasaje concreto del escrito, "delEscrito" trae ese pasaje COPIADO LITERAL (5 a 60 palabras, tal cual está). Si no nace de un pasaje concreto, omite "delEscrito"; no lo inventes ni lo parafrasees.
- NO cites normas, artículos, sentencias, autos ni radicados. NO afirmes hechos que el escrito no traiga. NO des consejos fuera de las preguntas.
- Entre ${MIN_PREGUNTAS_POR_LISTA} y ${MAX_PREGUNTAS_POR_LISTA} preguntas por lista, de la más importante a la menos. Si el escrito da para menos en alguna lista, entrega las que tengan sustento y ninguna de relleno.
- Adapta las tres listas a la POSICIÓN del colega: lo que conviene probar es lo que le conviene a su cliente, y «la contraparte» es la parte contraria a ESA posición.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON, sin texto antes ni después, sin cercas de código:
{
  "contraparte": [{"pregunta": "…", "paraQue": "…", "delEscrito": "…"}],
  "misTestigos": [{"pregunta": "…", "paraQue": "…", "delEscrito": "…"}],
  "testigosContraparte": [{"pregunta": "…", "paraQue": "…", "delEscrito": "…"}]
}`;

export const buildPreguntasUserPrompt = (input: {
  documentType: string;
  guidance: string | null;
  parametros: ParametrosDePreguntas;
  texto: string;
  truncado: boolean;
}): string => {
  const ficha = input.guidance
    ? `FICHA VERIFICADA DE LA ACTUACIÓN (contexto de qué es este escrito; no la cites en las preguntas):\n${input.guidance}`
    : 'La actuación no está catalogada: no hay ficha de contexto.';
  const quiereProbar = (input.parametros.quiereProbar ?? '').trim();
  const audiencia = (input.parametros.audiencia ?? '').trim();
  return `ESCRITO: "${input.documentType}".

${ficha}

POSICIÓN DEL COLEGA EN EL PROCESO: ${input.parametros.posicion.trim()}.
${quiereProbar ? `QUÉ QUIERE PROBAR EN LA AUDIENCIA: ${quiereProbar}` : 'El colega no indicó qué quiere probar: dedúcelo de la posición y del escrito.'}
${audiencia ? `TIPO DE AUDIENCIA: ${audiencia}` : 'El colega no indicó el tipo de audiencia.'}

TEXTO DEL ESCRITO${input.truncado ? ' (recortado por extensión; trabaja con lo que hay)' : ''}:
"""
${input.texto}
"""

Entrega las tres listas en el JSON indicado.`;
};

const cadena = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim();

const aPregunta = (v: unknown): PreguntaDeAudiencia | null => {
  const o = (v ?? {}) as Record<string, unknown>;
  const pregunta = cadena(o.pregunta);
  if (!pregunta) return null;
  const delEscrito = cadena(o.delEscrito);
  return { pregunta, paraQue: cadena(o.paraQue), ...(delEscrito ? { delEscrito } : {}) };
};

const limpiarListas = (o: Record<string, unknown>): PreguntasParaLaAudiencia => {
  const lista = (k: keyof PreguntasParaLaAudiencia): PreguntaDeAudiencia[] =>
    Array.isArray(o[k]) ? (o[k] as unknown[]).map(aPregunta).filter((p): p is PreguntaDeAudiencia => p !== null).slice(0, MAX_PREGUNTAS_POR_LISTA) : [];
  return { contraparte: lista('contraparte'), misTestigos: lista('misTestigos'), testigosContraparte: lista('testigosContraparte') };
};

export const totalDePreguntas = (p: PreguntasParaLaAudiencia): number => p.contraparte.length + p.misTestigos.length + p.testigosContraparte.length;

/**
 * Rescate de un JSON cortado. Recorre el texto llevando la lista en la que
 * está —por la última clave de sección vista— y extrae cada objeto {…}
 * completo con un autómata que respeta cadenas y escapes. Lo que quedó a
 * medias al final se pierde; todo lo cerrado se conserva en su lista.
 */
const rescatarCortado = (texto: string): PreguntasParaLaAudiencia => {
  const salida: PreguntasParaLaAudiencia = { contraparte: [], misTestigos: [], testigosContraparte: [] };
  let seccion: keyof PreguntasParaLaAudiencia | null = null;
  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    if (c === '"') {
      // Una clave de sección, o el inicio de una cadena que hay que saltar entera.
      const fin = finDeCadena(texto, i);
      const contenido = texto.slice(i + 1, fin);
      if ((SECCIONES as readonly string[]).includes(contenido) && /^\s*:\s*\[/.test(texto.slice(fin + 1, fin + 12))) {
        seccion = contenido as keyof PreguntasParaLaAudiencia;
      }
      i = fin + 1;
      continue;
    }
    if (c === '{' && seccion) {
      const cierre = finDeObjeto(texto, i);
      if (cierre === -1) break;
      try {
        const p = aPregunta(JSON.parse(texto.slice(i, cierre + 1)));
        if (p && salida[seccion].length < MAX_PREGUNTAS_POR_LISTA) salida[seccion].push(p);
      } catch {
        /* objeto ilegible: se salta */
      }
      i = cierre + 1;
      continue;
    }
    i++;
  }
  return salida;
};

/** Índice de la comilla que cierra la cadena abierta en `desde`; el final del texto si no cierra. */
const finDeCadena = (texto: string, desde: number): number => {
  let i = desde + 1;
  while (i < texto.length) {
    if (texto[i] === '\\') {
      i += 2;
      continue;
    }
    if (texto[i] === '"') return i;
    i++;
  }
  return texto.length;
};

/** Índice de la llave que cierra el objeto abierto en `desde`, o -1 si quedó cortado. */
const finDeObjeto = (texto: string, desde: number): number => {
  let nivel = 0;
  let i = desde;
  while (i < texto.length) {
    const c = texto[i];
    if (c === '"') {
      i = finDeCadena(texto, i) + 1;
      continue;
    }
    if (c === '{') nivel++;
    else if (c === '}') {
      nivel--;
      if (nivel === 0) return i;
    }
    i++;
  }
  return -1;
};

/** La respuesta del modelo, entera o cortada. Nunca lanza; una respuesta sin nada útil devuelve las tres listas vacías. */
export const parsearPreguntas = (crudo: string): PreguntasParaLaAudiencia => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  const fin = sinCerca.lastIndexOf('}');
  if (inicio !== -1 && fin > inicio) {
    try {
      const o = JSON.parse(sinCerca.slice(inicio, fin + 1)) as Record<string, unknown>;
      const listas = limpiarListas(o);
      if (totalDePreguntas(listas) > 0) return listas;
    } catch {
      /* cae al rescate */
    }
  }
  return rescatarCortado(inicio === -1 ? sinCerca : sinCerca.slice(inicio));
};

/** Valida y recorta lo que manda el navegador. Devuelve el mensaje de error, o los parámetros limpios. */
export const normalizarParametros = (body: Record<string, unknown>): { ok: true; parametros: ParametrosDePreguntas } | { ok: false; message: string } => {
  const posicion = cadena(body.posicion).slice(0, MAX_POSICION);
  if (!posicion) return { ok: false, message: 'Indique su posición en el proceso: Demandante, Demandado u otra.' };
  const quiereProbar = cadena(body.quiereProbar).slice(0, MAX_QUIERE_PROBAR);
  const audiencia = cadena(body.audiencia).slice(0, MAX_AUDIENCIA);
  return { ok: true, parametros: { posicion, ...(quiereProbar ? { quiereProbar } : {}), ...(audiencia ? { audiencia } : {}) } };
};
