import { seLePregunta, type ActorDelExpediente, type ExpedienteConDetalle } from './types';

/**
 * PREGUNTAS PARA LA AUDIENCIA, PERO SABIENDO A QUIÉN SE LE PREGUNTA.
 *
 * ─── QUÉ CAMBIA RESPECTO DE LO QUE YA HABÍA ────────────────────────────────
 *
 * Las preguntas de audiencia colgaban de una revisión: `POST
 * /agent/reviews/:id/preguntas`. Ese camino YA SE RETIRÓ y éste es su relevo;
 * lo que no podía hacer estaba escrito en su propio prompt, con todas las
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

/**
 * CON QUÉ SE LE CONTRADICE, y las dos mitades son obligatorias.
 *
 * `documento` NO lo escribe el modelo: lo pone el código, tomándolo del pasaje
 * en el que la cita apareció de verdad. Un modelo que acierta la cita y se
 * equivoca de archivo produce una atribución falsa que se lee exactamente igual
 * que una correcta — y en audiencia se descubre delante del juez.
 */
export interface ConQueSeAtaca {
  /** El nombre del documento del expediente del que salió la cita. Lo pone el código. */
  documento: string;
  /** El fragmento, copiado literal del pasaje recuperado. */
  cita: string;
}

export interface PreguntaParaAlguien {
  pregunta: string;
  /** Una línea con lo que la pregunta busca establecer o desvirtuar. */
  paraQue: string;
  /** El pasaje del material que la sostiene, copiado literal. Ausente si no nace de uno. */
  delMaterial?: string;
  /**
   * Qué va a contestar probablemente esa persona, dado su lado, su papel y lo
   * que el expediente dice. Ausente si el modelo no la entregó.
   */
  respuestaProbable?: string;
  /** Qué preguntar DESPUÉS si contesta eso. Ausente si el modelo no la entregó. */
  repregunta?: string;
  /**
   * El pasaje del expediente que contradice o sostiene esa respuesta.
   *
   * AUSENTE SIGNIFICA «EL EXPEDIENTE NO TIENE CON QUÉ», y esa es la razón de
   * que no haya un tercer estado: el campo se cae —lo tira el servidor— cuando
   * la cita no está literalmente en los pasajes recuperados. Quien lo pinte
   * dice esa frase, no una menos comprometida.
   */
  conQue?: ConQueSeAtaca;
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
  /**
   * Si esta tanda tuvo pasajes del expediente indexado con los que cotejar.
   *
   * SIN ESTO, «el expediente no tiene con qué contradecirlo» SE LEERÍA COMO UN
   * HALLAZGO donde solo hubo un expediente sin indexar. Son dos cosas distintas
   * —no hay documento que lo contradiga, y no había documentos— y decir la
   * primera cuando ocurre la segunda es afirmar algo que nadie comprobó.
   * Falta en tandas guardadas antes del campo: se lee tolerando `undefined`.
   */
  conMaterial?: boolean;
  /**
   * Si la respuesta del motor llegó CORTADA y se rescató lo que estaba completo.
   *
   * Un interrogatorio recortado no se distingue por dentro de uno corto: las
   * preguntas que hay son válidas, y las que faltan no dejan hueco. Quien lo
   * lea sin saberlo creerá que el caso no daba para más, cuando lo que pasó es
   * que el presupuesto de salida se acabó a mitad de la lista. Se dice.
   */
  recortado?: boolean;
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

PREPARAR ES ANTICIPAR LA RESPUESTA, NO SOLO ESCRIBIR LA PREGUNTA. Una lista de preguntas sin más deja al colega de pie en la audiencia cuando el testigo contesta lo que le conviene. Por eso cada pregunta trae, además:
- "respuestaProbable": qué va a contestar ESA persona, en una o dos frases, dado su lado, su papel y lo que el expediente dice de ella. Escríbela como la diría quien declara, no como te gustaría que contestara.
- "repregunta": qué preguntar A CONTINUACIÓN si contesta eso. Una sola pregunta, lista para leerse en voz alta, con la misma técnica que se le indicó para esa persona.
- "conQue": el pasaje del material adjunto que CONTRADICE o SOSTIENE esa respuesta probable, con {"documento": el nombre del archivo tal como aparece entre corchetes al principio del pasaje, "cita": el fragmento COPIADO LITERAL de ese pasaje, de 5 a 50 palabras, sin corregirlo ni resumirlo}.

LA REGLA DURA DE "conQue", Y EL SERVIDOR LA APLICA. La "cita" tiene que estar, palabra por palabra, dentro del material adjunto: el servidor la busca allí y TIRA el "conQue" entero si no la encuentra, así que una cita reconstruida de memoria no llega al colega, solo se pierde el trabajo. Cuando el material no tenga nada con qué contradecir esa respuesta, OMITE "conQue" por completo; no lo rellenes con un pasaje que hable de otra cosa. Sin material adjunto, no hay "conQue" en ninguna pregunta.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON, sin texto antes ni después, sin cercas de código. "enfoque" va PRIMERO: una o dos frases con lo que este asunto exige probar y la audiencia en la que se preguntará, sin citar normas. En "porPersona", devuelve el MISMO "actorId" que se te entregó, sin cambiarlo:
{
  "enfoque": "…",
  "porPersona": [
    {"actorId": "…", "preguntas": [{"pregunta": "…", "paraQue": "…", "delMaterial": "…", "respuestaProbable": "…", "repregunta": "…", "conQue": {"documento": "…", "cita": "…"}}]}
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

/** Un pasaje recuperado del expediente, en lo mínimo que hace falta para cotejar. */
export interface PasajeParaCotejar {
  archivo: string | null;
  texto: string;
}

/**
 * Normaliza para comparar: sin tildes, sin mayúsculas y sin la puntuación que
 * el modelo cambia al copiar.
 *
 * Es la misma regla —y la misma razón— que `apoyoEstaEnElTexto` en
 * `agent/review/verificarGlosa.ts`, escrita aquí para que este archivo siga sin
 * dependencias y su guarda corra sin montar nada. NO es laxitud: perdona que
 * escriba «articulo» por «ARTÍCULO», que junte dos espacios o que se coma una
 * coma, cosas que no cambian qué pasaje señaló. Lo único que no perdona —y es
 * lo único que importa— es que el pasaje no esté.
 */
const paraComparar = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * El piso de longitud de una cita, en caracteres ya normalizados.
 *
 * Una cita de tres palabras no prueba que el modelo leyera el expediente: «en
 * el inmueble» aparece en cualquier demanda de restitución. El mismo piso que
 * usa la comprobación de las glosas del informe.
 */
export const MINIMO_DE_CITA = 15;

/**
 * ¿De qué documento del expediente salió esta cita? `null` si de ninguno.
 *
 * ─── AQUÍ SE TIRA LO QUE NO SE PUDO COMPROBAR ──────────────────────────────
 *
 * El nombre del documento se toma del pasaje EN EL QUE LA CITA APARECIÓ, no del
 * que el modelo dijo. Comprobar la cita y creerle el archivo dejaría entrar la
 * atribución falsa por la puerta de atrás: un fragmento real de la contestación
 * presentado como si estuviera en el dictamen es, en audiencia, peor que no
 * tener nada — el colega lo lee en voz alta y el juez abre el otro documento.
 */
export const documentoDeLaCita = (
  cita: string,
  pasajes: readonly PasajeParaCotejar[]
): string | null => {
  const aguja = paraComparar(cita);
  if (aguja.length < MINIMO_DE_CITA) return null;
  for (const p of pasajes) {
    if (paraComparar(p.texto).includes(aguja)) return p.archivo ?? 'documento del caso';
  }
  return null;
};

const aConQue = (v: unknown, pasajes: readonly PasajeParaCotejar[]): ConQueSeAtaca | null => {
  const o = (v ?? {}) as Record<string, unknown>;
  const cita = cadena(o.cita);
  if (!cita) return null;
  const documento = documentoDeLaCita(cita, pasajes);
  if (!documento) return null;
  return { documento, cita };
};

const aPregunta = (v: unknown, pasajes: readonly PasajeParaCotejar[]): PreguntaParaAlguien | null => {
  const o = (v ?? {}) as Record<string, unknown>;
  const pregunta = cadena(o.pregunta);
  if (!pregunta) return null;
  /*
   * CADA CAMPO NUEVO ENTRA POR SU CUENTA. Una respuesta a la que le falte
   * `repregunta`, o que traiga `conQue` sin cita, degrada a la forma de
   * siempre en vez de tumbar la tanda entera: el colega ya pagó, y una lista
   * de preguntas sin la respuesta probable sigue sirviendo para la audiencia.
   */
  const delMaterial = cadena(o.delMaterial);
  const respuestaProbable = cadena(o.respuestaProbable);
  const repregunta = cadena(o.repregunta);
  const conQue = aConQue(o.conQue, pasajes);
  return {
    pregunta,
    paraQue: cadena(o.paraQue),
    ...(delMaterial ? { delMaterial } : {}),
    ...(respuestaProbable ? { respuestaProbable } : {}),
    ...(repregunta ? { repregunta } : {}),
    ...(conQue ? { conQue } : {})
  };
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
/**
 * RESCATAR UNA RESPUESTA CORTADA A MITAD, en vez de perderla entera.
 *
 * ─── EL DEFECTO QUE LA TRAJO (16 de septiembre de 2026) ────────────────────
 *
 * Un interrogatorio real devolvió «la guía no devolvió preguntas legibles» y
 * no pasaba de ahí. No era el modelo: era el presupuesto de salida. Medido
 * sobre este mismo prompt, una persona CON material del expediente consume
 * ~3.100 tokens de los 3.300 que había; basta que el modelo razone un poco más
 * o que una cita sea larga para que el JSON se corte en mitad de una pregunta.
 * `JSON.parse` falla con la llave abierta, `leerPreguntas` devolvía `null`, y
 * once preguntas buenas se tiraban a la basura por culpa de la doceava.
 *
 * Se sube el presupuesto —esa es la corrección de fondo, en el controlador— y
 * ADEMÁS se rescata lo que llegó: el corte siempre cae dentro de una pregunta,
 * así que retroceder hasta el último objeto que cerró bien y cerrar los
 * corchetes que quedaron abiertos devuelve una lista corta pero íntegra.
 *
 * NO SE INVENTA NADA: solo se descarta la mitad de pregunta que no llegó. Y no
 * se calla —`recortado` sube hasta la pantalla—, porque una lista recortada se
 * lee igual que una lista corta y quien la lleva a la audiencia merece saber
 * cuál de las dos tiene en la mano.
 */
export const objetoDeLaRespuesta = (
  crudo: string
): { objeto: Record<string, unknown>; recortado: boolean } | null => {
  const desde = crudo.indexOf('{');
  if (desde < 0) return null;

  const hasta = crudo.lastIndexOf('}');
  if (hasta > desde) {
    try {
      return { objeto: JSON.parse(crudo.slice(desde, hasta + 1)) as Record<string, unknown>, recortado: false };
    } catch {
      /* Cortado, o con basura detrás. Se intenta rescatar abajo. */
    }
  }

  /*
   * Se recorre una sola vez llevando la pila de corchetes abiertos y si se va
   * por dentro de una cadena —una comilla dentro de una cita no abre nada, y
   * `\"` no la cierra—. Cada vez que un objeto cierra bien y quedan al menos
   * dos niveles abiertos, se recuerda ese punto: ahí termina una pregunta
   * completa dentro de su lista.
   */
  let pila: string[] = [];
  let enCadena = false;
  let escapado = false;
  let corte = -1;
  let pilaEnElCorte: string[] = [];

  for (let i = desde; i < crudo.length; i += 1) {
    const c = crudo[i];
    if (enCadena) {
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') enCadena = false;
      continue;
    }
    if (c === '"') {
      enCadena = true;
      continue;
    }
    if (c === '{' || c === '[') {
      pila.push(c);
      continue;
    }
    if (c === '}' || c === ']') {
      pila.pop();
      if (c === '}' && pila.length >= 2) {
        corte = i;
        pilaEnElCorte = [...pila];
      }
    }
  }

  if (corte < 0) return null;

  const cierre = pilaEnElCorte
    .reverse()
    .map((a) => (a === '{' ? '}' : ']'))
    .join('');
  try {
    return {
      objeto: JSON.parse(`${crudo.slice(desde, corte + 1)}${cierre}`) as Record<string, unknown>,
      recortado: true
    };
  } catch {
    return null;
  }
};

export const leerPreguntas = (
  crudo: string,
  aQuienes: ActorDelExpediente[],
  por: string,
  /** Los pasajes con los que se coteja cada `conQue`. Sin ellos, no hay ninguno. */
  pasajes: readonly PasajeParaCotejar[] = []
): PreguntasDelExpediente | null => {
  const leido = objetoDeLaRespuesta(crudo);
  if (!leido) return null;
  const { objeto, recortado } = leido;

  const porId = new Map(aQuienes.map((a) => [a.id, a]));
  const listas = Array.isArray(objeto.porPersona) ? (objeto.porPersona as unknown[]) : [];

  const porPersona: PreguntasParaUnaPersona[] = [];
  for (const bruto of listas) {
    const o = (bruto ?? {}) as Record<string, unknown>;
    const actor = porId.get(cadena(o.actorId));
    if (!actor) continue;
    const preguntas = Array.isArray(o.preguntas)
      ? (o.preguntas as unknown[])
          .map((q) => aPregunta(q, pasajes))
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
    por,
    conMaterial: pasajes.length > 0,
    ...(recortado ? { recortado: true } : {})
  };
};
