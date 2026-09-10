import { seLePregunta, type ActorDelExpediente, type ExpedienteConDetalle } from './types';

/**
 * PREGUNTAS PARA LA AUDIENCIA, PERO SABIENDO A QUIÉN SE LE PREGUNTA.
 *
 * ─── QUÉ CAMBIA RESPECTO DE LO QUE YA HABÍA ────────────────────────────────
 *
 * Las preguntas de audiencia existen desde hace tiempo y cuelgan de una
 * revisión: `POST /agent/reviews/:id/preguntas`. Funcionan y se siguen usando.
 * Lo que no podían hacer está escrito en su propio prompt, con todas las
 * letras: «no conoces el expediente, las pruebas, a las partes ni a los
 * testigos». De ahí salían TRES CAJONES FIJOS —la contraparte, mis testigos,
 * los testigos de la contraparte— porque sin saber quién hay en el caso, una
 * categoría es lo único que se puede ofrecer.
 *
 * Y esa forma tenía dos costos concretos:
 *
 *   · En el modo DOCUMENTO_RECIBIDO la pestaña ni se ofrecía. De un auto o una
 *     sentencia no salen «mis testigos», así que la pantalla apagaba la función
 *     y explicaba por qué.
 *   · Un interrogatorio se prepara CONTRA UNA PERSONA. «Al testigo de la
 *     contraparte» es media preparación: la otra mitad es que se llama Fulano,
 *     que declara sobre la entrega del inmueble y que es cuñado del demandado.
 *
 * Con los actores del expediente, las listas dejan de ser categorías y pasan a
 * ser gente con nombre, lado y materia. La técnica ya no se escoge por el
 * cajón sino por lo que la persona ES en el proceso.
 *
 * ─── LA TÉCNICA SE DEDUCE, NO SE PREGUNTA ──────────────────────────────────
 *
 * Al propio se le interroga —abiertas, que narre— y al ajeno se le
 * contrainterroga —cerradas, que confirme—. Al perito se le va por el método y
 * la calificación, no por lo que vio, porque no vio nada. Esas tres reglas
 * salen de `papel` y `lado`, que el abogado ya llenó al registrar al actor: no
 * hay que volver a preguntárselo en un formulario.
 */

export const MIN_PREGUNTAS_POR_PERSONA = 6;
export const MAX_PREGUNTAS_POR_PERSONA = 12;
/** Cuántas personas caben en una sola llamada sin que el presupuesto de salida se agote. */
export const MAX_PERSONAS_POR_TANDA = 4;
export const MAX_QUIERE_PROBAR = 1_000;
export const MAX_AUDIENCIA = 120;

export interface PreguntaParaAlguien {
  pregunta: string;
  /** Una línea con lo que la pregunta busca establecer o desvirtuar. */
  paraQue: string;
  /** El pasaje del material que la sostiene, copiado literal. Ausente si no nace de uno. */
  delMaterial?: string;
}

export interface PreguntasParaUnaPersona {
  actorId: string;
  nombre: string;
  /** Cómo se le pregunta, y por qué. Lo decide el código, no el modelo. */
  tecnica: string;
  preguntas: PreguntaParaAlguien[];
}

export interface PreguntasDelExpediente {
  /** Qué exige probar este asunto y en qué audiencia. Una o dos frases. */
  enfoque: string;
  porPersona: PreguntasParaUnaPersona[];
  generadoEl: string;
  por: string;
}

/**
 * LA TÉCNICA QUE CORRESPONDE A CADA QUIÉN.
 *
 * Se decide EN CÓDIGO y viaja al modelo como instrucción, en vez de dejar que
 * la elija él. No es desconfianza: es que la técnica se deduce de dos campos
 * que ya están llenos, y un modelo que la escoge puede escogerla mal en el
 * caso raro —un perito de parte, un testigo neutral— sin que nada lo señale.
 * Una regla determinista que se equivoca, se equivoca igual siempre y se
 * corrige de una vez.
 */
export const tecnicaPara = (actor: ActorDelExpediente): string => {
  /*
   * EL PERITO SE PREGUNTA POR EL MÉTODO, NUNCA POR LO QUE VIO: no vio nada,
   * dictaminó. Ese es el caso que un cajón de «testigos de la contraparte»
   * borraba por completo.
   *
   * Y SON TRES CASOS, NO DOS. La primera versión de esta función preguntaba
   * solo si era propio, así que el PERITO DE OFICIO caía en la rama del perito
   * de la contraparte y se le contrainterrogaba como si fuera del adversario.
   * Lo cazó la guarda de este módulo antes de que existiera un solo
   * expediente: el perito del despacho no es de nadie, y tratarlo como enemigo
   * delante del juez que lo nombró es peor técnica que no preparar nada.
   */
  if (actor.papel === 'PERITO') {
    if (actor.lado === 'PROPIO') {
      return 'INTERROGATORIO AL PERITO PROPIO: que exponga su método, sus datos y por qué su conclusión se sostiene. Abiertas y ordenadas: calificación, encargo, método, hallazgos, conclusión.';
    }
    if (actor.lado === 'CONTRARIO') {
      return 'CONTRADICCIÓN DEL DICTAMEN: cerradas, sobre la calificación del perito, el método empleado, los datos de los que partió, lo que NO examinó y su relación con quien lo contrató. No se le pregunta qué vio: no vio nada, dictaminó.';
    }
    return 'PREGUNTAS DE ESCLARECIMIENTO AL PERITO DE OFICIO: no lo contrainterrogue —no es de ninguna parte y lo nombró el despacho—. Preguntas neutras sobre el método, los datos de los que partió, el alcance de lo que examinó y lo que su dictamen NO resuelve.';
  }
  if (actor.lado === 'PROPIO') {
    return 'INTERROGATORIO DIRECTO: preguntas ABIERTAS y NO sugestivas —que no contengan la respuesta— para que narre con sus palabras. Ordenadas como un relato: quién es y por qué le consta, cuándo, dónde, qué vio u oyó, cómo lo sabe. Empiezan por qué, cómo, cuándo, dónde, quién, describa, explique.';
  }
  if (actor.lado === 'CONTRARIO') {
    const esParte = actor.papel !== 'TESTIGO';
    return esParte
      ? 'INTERROGATORIO DE PARTE: preguntas cuya respuesta, sea cual sea, favorezca al cliente del colega. Directas, una idea por pregunta, sin argumentar dentro de la pregunta. Salen de las contradicciones, de lo que omite y de lo que admite sin querer.'
      : 'CONTRAINTERROGATORIO: preguntas CERRADAS, una afirmación por pregunta, que se contesten sí o no. Ponen a prueba la credibilidad, las contradicciones, la razón del conocimiento, la distancia y el interés. Nunca una abierta cuya respuesta no se controle.';
  }
  return 'PREGUNTAS DE ESCLARECIMIENTO: esta persona no está de ningún lado, así que no se le contrainterroga. Preguntas neutras y precisas, dirigidas a fijar hechos que hoy están en duda.';
};

/** El rótulo de un actor tal como el prompt lo nombra. */
const rotulo = (a: ActorDelExpediente): string => {
  const lado = a.lado === 'PROPIO' ? 'de mi lado' : a.lado === 'CONTRARIO' ? 'de la contraparte' : 'sin lado';
  const sobre = a.sobreQue ? `; declara sobre: ${a.sobreQue}` : '';
  return `${a.nombre} — ${a.papel.replace(/_/g, ' ').toLowerCase()}, ${lado}${sobre}`;
};

/**
 * A quién se le puede preparar interrogatorio, de todos los que hay en el caso.
 *
 * El juez, el secretario, los apoderados y el intérprete quedan fuera: están en
 * el expediente porque hay que saber quiénes son, no porque se les pregunte.
 * Ofrecerlos en la lista sería ofrecer una función que no existe.
 */
export const interrogables = (expediente: ExpedienteConDetalle): ActorDelExpediente[] =>
  expediente.listaDeActores.filter((a) => seLePregunta(a.papel));

export const buildPreguntasSystemPrompt = (): string =>
  `Eres un litigante senior con años de audiencias, y ayudas a un colega a preparar el interrogatorio de una audiencia. Trabajas sobre UN EXPEDIENTE: conoces el asunto, quiénes son sus actores y, cuando el colega lo adjunta, una pieza del proceso. Lo que no esté en ese material no lo afirmas.

UNA LISTA POR PERSONA, Y LA TÉCNICA VIENE DADA. A cada persona se le indica CÓMO se le pregunta; no la elijas tú, aplícala. Interrogar a un testigo propio con preguntas cerradas, o contrainterrogar con abiertas, arruina la diligencia por mucho que la pregunta sea inteligente.

LAS PREGUNTAS SON PARA ESA PERSONA, no para su categoría. Usa su nombre cuando ayude, y apóyate en lo que declara —el campo «declara sobre»— para que cada lista sea distinta de las demás. Dos listas intercambiables significan que no se preparó a nadie.

REGLAS PARA TODAS:
- Español, trato de usted, sobrio y preciso. Cada pregunta lista para leerse en voz alta.
- Una idea por pregunta. Nada de preguntas compuestas.
- Cada pregunta trae "paraQue": una sola línea con lo que busca establecer o desvirtuar.
- Cuando la pregunta nace de un pasaje concreto del material adjunto, "delMaterial" trae ese pasaje COPIADO LITERAL (5 a 60 palabras, tal cual está). Si no nace de un pasaje concreto, omite "delMaterial"; no lo inventes ni lo parafrasees.
- NO cites normas, artículos, sentencias, autos ni radicados. NO afirmes hechos que el material no traiga. NO des consejos fuera de las preguntas.
- Entre ${MIN_PREGUNTAS_POR_PERSONA} y ${MAX_PREGUNTAS_POR_PERSONA} preguntas por persona, de la más importante a la menos. Si el material da para menos con alguien, entrega las que tengan sustento y ninguna de relleno.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON, sin texto antes ni después, sin cercas de código. "enfoque" va PRIMERO: una o dos frases con lo que este asunto exige probar y la audiencia en la que se preguntará, sin citar normas. En "porPersona", devuelve el MISMO "actorId" que se te entregó, sin cambiarlo:
{
  "enfoque": "…",
  "porPersona": [
    {"actorId": "…", "preguntas": [{"pregunta": "…", "paraQue": "…", "delMaterial": "…"}]}
  ]
}`;

export const buildPreguntasUserPrompt = (input: {
  expediente: ExpedienteConDetalle;
  aQuienes: ActorDelExpediente[];
  quiereProbar?: string;
  audiencia?: string;
  /** El texto de una pieza del expediente, cuando el colega adjunta una. */
  material?: { que: string; texto: string; truncado: boolean } | null;
}): string => {
  const e = input.expediente;
  const cabecera = [
    `EXPEDIENTE: ${e.caratula}`,
    e.rama ? `RAMA: ${e.rama}` : null,
    e.radicado ? `RADICADO: ${e.radicado}` : null,
    e.despacho ? `DESPACHO: ${e.despacho}` : null,
    e.clienteNombre ? `CLIENTE DEL COLEGA: ${e.clienteNombre}` : null,
    e.contraparte ? `CONTRAPARTE: ${e.contraparte}` : null
  ]
    .filter(Boolean)
    .join(' · ');

  /*
   * TODOS LOS ACTORES VIAJAN, aunque solo se pregunte a algunos. Saber que
   * existe un apoderado de la contraparte o un perito de oficio cambia cómo se
   * interroga a los demás, y ocultarlos porque no se les pregunta le quitaría
   * al modelo justo el contexto que el expediente existe para darle.
   */
  const todos = e.listaDeActores.length
    ? e.listaDeActores.map((a) => `- ${rotulo(a)}`).join('\n')
    : '- (el expediente no tiene actores registrados)';

  const aQuienes = input.aQuienes
    .map(
      (a) =>
        `### actorId: ${a.id}\nQUIÉN: ${rotulo(a)}\nCÓMO SE LE PREGUNTA: ${tecnicaPara(a)}${
          a.notas ? `\nLO QUE EL COLEGA ANOTÓ: ${a.notas}` : ''
        }`
    )
    .join('\n\n');

  const material = input.material
    ? `MATERIAL ADJUNTO — ${input.material.que}${input.material.truncado ? ' (recortado por extensión; trabaja con lo que hay)' : ''}:\n"""\n${input.material.texto}\n"""`
    : 'El colega no adjuntó ninguna pieza del proceso: trabaja con el expediente y sus actores, y no inventes hechos.';

  return `${cabecera}

QUIÉNES HAY EN EL ASUNTO:
${todos}

${e.notas ? `LO QUE EL COLEGA ANOTÓ DEL ASUNTO: ${e.notas}\n` : ''}
${(input.quiereProbar ?? '').trim() ? `QUÉ QUIERE PROBAR EN LA AUDIENCIA: ${(input.quiereProbar ?? '').trim()}` : 'El colega no indicó qué quiere probar: dedúcelo del expediente y del material.'}
${(input.audiencia ?? '').trim() ? `TIPO DE AUDIENCIA: ${(input.audiencia ?? '').trim()}` : 'El colega no indicó el tipo de audiencia.'}

${material}

PREPARA EL INTERROGATORIO DE ESTAS PERSONAS, una lista por cada una:

${aQuienes}

Entrega el JSON indicado.`;
};

// ─── LECTURA DE LA RESPUESTA ────────────────────────────────────────────────

const cadena = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim();

const aPregunta = (v: unknown): PreguntaParaAlguien | null => {
  const o = (v ?? {}) as Record<string, unknown>;
  const pregunta = cadena(o.pregunta);
  if (!pregunta) return null;
  const delMaterial = cadena(o.delMaterial);
  return { pregunta, paraQue: cadena(o.paraQue), ...(delMaterial ? { delMaterial } : {}) };
};

/**
 * Lee la respuesta del motor y la ata a los actores REALES.
 *
 * ─── EL ACTOR MANDA SOBRE LO QUE DIGA EL MODELO ────────────────────────────
 *
 * El nombre y la técnica de cada lista NO se leen de la respuesta: se toman
 * del actor que se mandó a preguntar. Un modelo que devuelva un `actorId`
 * inventado, o que le cambie el nombre a alguien, produciría una lista de
 * preguntas atribuidas a una persona que no está en el expediente — y eso se
 * lee igual de bien que una correcta. Lo que no case con un actor de la tanda
 * SE DESCARTA, en vez de entrar con el nombre que el modelo quiso.
 */
export const leerPreguntas = (
  crudo: string,
  aQuienes: ActorDelExpediente[],
  por: string
): PreguntasDelExpediente | null => {
  const desde = crudo.indexOf('{');
  const hasta = crudo.lastIndexOf('}');
  if (desde < 0 || hasta <= desde) return null;

  let objeto: Record<string, unknown>;
  try {
    objeto = JSON.parse(crudo.slice(desde, hasta + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }

  const porId = new Map(aQuienes.map((a) => [a.id, a]));
  const listas = Array.isArray(objeto.porPersona) ? (objeto.porPersona as unknown[]) : [];

  const porPersona: PreguntasParaUnaPersona[] = [];
  for (const bruto of listas) {
    const o = (bruto ?? {}) as Record<string, unknown>;
    const actor = porId.get(cadena(o.actorId));
    if (!actor) continue;
    const preguntas = Array.isArray(o.preguntas)
      ? (o.preguntas as unknown[])
          .map(aPregunta)
          .filter((p): p is PreguntaParaAlguien => p !== null)
          .slice(0, MAX_PREGUNTAS_POR_PERSONA)
      : [];
    if (preguntas.length === 0) continue;
    porPersona.push({
      actorId: actor.id,
      nombre: actor.nombre,
      tecnica: tecnicaPara(actor),
      preguntas
    });
  }

  if (porPersona.length === 0) return null;

  return {
    enfoque: cadena(objeto.enfoque),
    porPersona,
    generadoEl: new Date().toISOString(),
    por
  };
};
