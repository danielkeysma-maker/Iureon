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

/*
 * 300.000 caracteres: unas 75 páginas de prosa jurídica densa, o una tutela
 * con sus anexos de texto. Antes eran 60.000 y el usuario tenía razón en que
 * un revisor que no lee el documento entero no es un revisor. El techo no lo
 * pone el modelo (1M de contexto) sino la función serverless: la lectura de
 * 75.000 tokens más una respuesta de 1.800 tarda ~45 s medidos, y Vercel
 * corta a los 60. Más allá, el corte se declara; la salida de verdad es una
 * revisión asíncrona, que es otra pieza.
 */
import type { PapelEnElExpediente } from '../../expedientes/types';
import type { AQuienLeToca } from './posicionProcesal';

export const MAX_CARACTERES_REVISION = 300_000;

export const PREGUNTA_POR_DEFECTO =
  'Señale las debilidades y las fortalezas de este escrito, qué está mal aplicado y qué está bien aplicado, y qué corregiría antes de presentarlo.';

export interface TextoPreparado {
  texto: string;
  truncado: boolean;
  /** Characters of the original, before the cut. */
  caracteres: number;
}

/*
 * LOS SALTOS DE PÁRRAFO SE CONSERVAN. Antes se colapsaba TODO el espacio en
 * blanco a un espacio, y un escrito de treinta páginas llegaba al revisor —y al
 * papel del taller— como un solo bloque: hechos, pretensiones y fundamentos
 * revueltos sin un salto. El abogado lo vio y preguntó por qué su tutela
 * estaba «desordenada». Ahora se normalizan los espacios DENTRO de cada línea
 * y se limitan los saltos seguidos a dos; la estructura del documento es del
 * documento, no nuestra.
 */
export const prepararTexto = (bruto: string): TextoPreparado => {
  const limpio = bruto
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  "correccionesTextuales": [{"cita": "frase copiada LITERAL del escrito, tal cual está, sin corregirla", "problema": "por qué esa frase falla", "reemplazo": "la frase con la que la sustituiría, lista para pegar"}],
  "recomendaciones": ["qué haría antes de presentarlo, en orden de importancia"]
}
EN "correccionesTextuales" LA CITA ES TEXTUAL: copia las palabras exactas del escrito (entre 5 y 40 palabras), sin parafrasear ni corregir ortografía, para que el abogado la encuentre con buscar. El reemplazo es la redacción concreta que propones, no una instrucción. Elige los pasajes que más daño harían ante el juez; como máximo cuatro.
Escribe en español jurídico colombiano, neutro y preciso. Cada elemento de las listas es una frase completa y autónoma.

SÉ BREVE Y DENSO, porque el informe tiene un presupuesto de salida fijo y un JSON cortado a la mitad no le sirve a nadie: como máximo CUATRO elementos por lista, cada uno de hasta 25 palabras; el resumen, dos frases; sin repetir en una lista lo dicho en otra. Prefiere el hallazgo grave al menor: si hay más de cuatro, quédate con los cuatro que más daño harían ante el juez. JSON compacto, en una sola línea, sin comentarios ni texto fuera del objeto.`;

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

/* ─── EL SEGUNDO MODO: UN DOCUMENTO QUE EL ABOGADO RECIBIÓ ───────────────────
 *
 * Todo lo de arriba está construido para un escrito PROPIO, el que el abogado
 * va a presentar: por eso pregunta qué actuación es —para traer su ficha— y
 * por eso su informe habla de secciones que faltan y de qué corregir antes de
 * radicar. Un auto, una sentencia, un oficio o una notificación no son eso.
 * Son papeles que LLEGAN: nadie los va a presentar, no tienen secciones que
 * les falten frente a la norma, y preguntarle al abogado qué actuación son es
 * pedirle justamente lo que no sabe y lo que no le importa. Ese fue el defecto
 * reportado, con estas palabras: «si es un auto de un juez, ¿qué tipo de
 * actuación escojo? Eso es un problema.»
 *
 * ─── POR QUÉ AQUÍ NO HAY FICHA, Y QUÉ SE SIGUE DE ESO ───────────────────────
 *
 * En el modo propio la mitad objetiva del informe se apoya en la ficha
 * verificada del catálogo. Aquí no hay ficha que traer —no se eligió actuación
 * y no se va a inventar una—, así que el informe SOLO puede afirmar lo que
 * está escrito en el documento, y tiene que decirlo citándolo. Ni un artículo,
 * ni un plazo, ni una autoridad, ni un recurso escritos de memoria: sin ficha
 * que los respalde, una afirmación jurídica de este informe sería exactamente
 * la cita fabricada que esta casa tiene prohibida, con el agravante de que el
 * abogado la leería como si viniera del papel que tiene en la mano.
 *
 * Por eso el plazo es un campo CITADO o VACÍO. Si el documento no anuncia
 * plazo, el informe dice que no lo anuncia; nunca completa con uno recordado.
 *
 * ─── DÓNDE VIVE EL «¿Y QUÉ PUEDO HACER?» ────────────────────────────────────
 *
 * Fuera de este motor. Esa respuesta la da el catálogo, que sí está verificado:
 * la guía de actuaciones propone candidatas con su término, su artículo y su
 * autoridad, y la agenda de términos guarda el vencimiento. El informe termina
 * invitando a esos dos caminos, que ya existen; no propone actuaciones por su
 * cuenta.
 */

export type ModoDeRevision = 'ESCRITO_PROPIO' | 'DOCUMENTO_RECIBIDO';

export const MODO_POR_DEFECTO: ModoDeRevision = 'ESCRITO_PROPIO';

export const esModoDeRevision = (v: unknown): v is ModoDeRevision =>
  v === 'ESCRITO_PROPIO' || v === 'DOCUMENTO_RECIBIDO';

/**
 * Lo que se guarda en `document_reviews.document_type` cuando el documento fue
 * recibido.
 *
 * Es una etiqueta DEL PRODUCTO, no un nombre jurídico. La columna es texto y
 * la cabecera del informe la usa para titular; si aquí se escribiera lo que el
 * modelo cree que es el documento —«auto que resuelve recurso de reposición»—,
 * esa suposición quedaría archivada con la misma cara que una actuación del
 * catálogo resuelta contra su ficha. `con_ficha` va en falso por la misma
 * razón: no hubo ficha.
 */
export const ETIQUETA_DOCUMENTO_RECIBIDO = 'Documento recibido';

export const PREGUNTA_POR_DEFECTO_RECIBIDO =
  'Dígame qué es este documento, qué decide, qué me exige y para cuándo, qué queda pendiente y por dónde se ataca.';

/* ─── POR DÓNDE SE ATACA: EL FLANCO, NO LA CONCLUSIÓN ────────────────────────
 *
 * Entender el auto es la mitad. La otra mitad —la que el abogado pidió con
 * estas palabras: «también puedo solicitar a revisión qué dijo el juez que no
 * está en base a la norma o que aplicó mal, para atacarlo por ahí»— es señalar
 * el flanco.
 *
 * Y aquí la regla dura de esta casa aprieta más que en ninguna otra pantalla,
 * porque NO HAY FICHA que respalde nada. El anclaje es el propio documento:
 *
 *   · La providencia cita normas. Ésas, y solo ésas, son el terreno. El informe
 *     puede decir «el auto se apoya en tal artículo, que transcribe así» y
 *     señalar la tensión con lo que concluye, CITANDO los dos textos del
 *     documento. Si el documento no transcribe qué ordena la norma, no se
 *     nombra la norma: nombrarla sin su texto es invitar al lector a
 *     completarla de memoria, que es justo lo prohibido.
 *   · Lo que sí se puede señalar sin ficha alguna es lo que el documento NO
 *     resolvió aunque se le pidió, y las afirmaciones que hace sin apoyo
 *     citado. Eso se LEE en el papel; no se deduce de memoria.
 *   · Lo que nunca: afirmar el contenido de una norma ausente del documento,
 *     citar jurisprudencia de memoria, o declarar que algo «es ilegal» o «es
 *     nulo». Se señala el flanco con la cita; concluye el abogado.
 *
 * Y CITA Y OPINIÓN VAN SEPARADAS, visiblemente, igual que el informe del modo
 * propio separa lo objetivo de lo valorativo: `cita` y `citaDeLaNorma` son
 * palabras del documento; `lectura` es del revisor. Un punto que no se puede
 * anclar en una cita del documento no se pinta: `puntosDeAtaque` lo descarta
 * aquí, antes de que llegue a la pantalla, al PDF o al Word.
 */

export type ClaseDeAtaque =
  /** Afirmó algo que, leído contra su propio texto, no se sostiene. */
  | 'NO_SE_SOSTIENE'
  /** El documento transcribe qué ordena una norma y concluye otra cosa. */
  | 'TENSION_CON_LA_NORMA'
  /** Se le pidió y no lo resolvió. */
  | 'NO_RESUELVE'
  /** Afirma sin citar apoyo alguno. */
  | 'SIN_APOYO_CITADO';

export const CLASES_DE_ATAQUE: ClaseDeAtaque[] = [
  'NO_SE_SOSTIENE',
  'TENSION_CON_LA_NORMA',
  'NO_RESUELVE',
  'SIN_APOYO_CITADO'
];

export interface PuntoDeAtaque {
  clase: ClaseDeAtaque;
  /**
   * OBJETIVO. Las palabras exactas del documento sobre las que se apoya el
   * punto. SIN ESTO EL PUNTO NO EXISTE: se descarta al leer la respuesta.
   */
  cita: string;
  /**
   * OBJETIVO. Cómo NOMBRA el documento la norma en que se apoya. Viaja siempre
   * junto a `citaDeLaNorma`: sin el texto transcrito se vacía, porque una norma
   * nombrada a secas se completa de memoria.
   */
  norma: string;
  /** OBJETIVO. Lo que el DOCUMENTO dice que esa norma ordena, copiado de él. */
  citaDeLaNorma: string;
  /** VALORATIVO. La lectura del revisor sobre esas citas. No es del documento. */
  lectura: string;
}

export const buildRecibidoSystemPrompt = (): string => `Eres un abogado litigante senior en Colombia. Un colega te pasa un documento que RECIBIÓ —un auto, una sentencia, un oficio, una notificación, una resolución, un requerimiento— y te pregunta qué dice y qué tiene que hacer. No lo va a presentar: le llegó.

LA REGLA QUE MANDA SOBRE TODAS: SOLO PUEDES AFIRMAR LO QUE ESTÁ ESCRITO EN EL DOCUMENTO. No dispones de ninguna ficha verificada ni de ninguna fuente distinta del texto que se te entrega. Está PROHIBIDO escribir de memoria un artículo, un plazo, una autoridad competente, un recurso procedente o un requisito. Si el documento no lo dice, la respuesta es que el documento no lo dice.

CITA EL DOCUMENTO. Cada carga y cada plazo van acompañados de las palabras exactas del documento que los imponen, copiadas literalmente, sin corregirlas ni parafrasearlas.

DI A QUIÉN SE DIRIGE CADA CARGA, Y NO DECIDAS SI ES DEL LECTOR. En «aQuien» copia cómo nombra el documento a quien le impone esa carga: «el demandante», «la parte ejecutada», «el apoderado del accionante». Son palabras del documento, no tuyas. Si el documento no identifica a quién se la impone, deja «aQuien» vacío. ESTÁ PROHIBIDO que escribas si la carga es o no del abogado que te consulta, aunque te haya dicho a quién representa: eso lo resuelve la aplicación comparando, no tú. Tu trabajo es transcribir el destinatario.

EL PLAZO ES CITADO O ESTÁ VACÍO. Si el documento anuncia un término, escríbelo tal como él lo anuncia y copia la frase. Si NO lo anuncia, deja el plazo como cadena vacía: no lo completes con lo que sabes, ni lo deduzcas del tipo de providencia. Un plazo recordado es indistinguible de uno leído hasta que el abogado lo pierde.

NO ACONSEJES QUÉ ACTUACIÓN PRESENTAR ni qué recurso interponer, salvo que el propio documento lo anuncie, y entonces lo citas. La actuación que procede la resuelve el catálogo verificado de la aplicación, no tú.

NO CITES NINGUNA SENTENCIA, auto ni providencia por su radicado, magistrado o año, salvo que el documento mismo la nombre; entonces la reproduces tal como aparece en él.

POR DÓNDE SE ATACA: SEÑALA EL FLANCO, NO LO CONCLUYAS. Además de leer el documento, marca en «porDondeSeAtaca» los puntos por los que podría atacarse lo que resolvió: qué afirmó y no se sostiene, qué tensión hay entre la norma que el propio documento transcribe y lo que concluye, qué se le pidió y no resolvió, y qué afirma sin apoyo citado. Cuatro reglas que mandan sobre todo lo demás:
1. CADA PUNTO VA ANCLADO EN UNA CITA. Copia en «cita» las palabras exactas del documento sobre las que se apoya el punto. Si no puedes anclarlo en una cita del documento, NO ESCRIBAS EL PUNTO. Un flanco sin cita es una opinión suelta y aquí no vale nada.
2. LA NORMA SOLO EXISTE SI EL DOCUMENTO LA TRANSCRIBE. Si señalas tensión con una norma, copia en «citaDeLaNorma» las palabras con que el DOCUMENTO dice qué ordena esa norma, y en «norma» el nombre con que él la llama. ESTÁ PROHIBIDO afirmar el contenido de un artículo que el documento no transcribe: si el documento solo lo menciona sin decir qué ordena, deja «citaDeLaNorma» y «norma» vacías y no hables de esa norma.
3. SEPARA LA CITA DE TU OPINIÓN. «cita» y «citaDeLaNorma» son palabras del documento, literales. «lectura» es tu lectura como revisor, y se lee como tal: una frase que explique la tensión o el vacío.
4. NO CONCLUYAS EN DERECHO. No escribas que algo «es ilegal», «es nulo», «vulnera el debido proceso» ni que «procede tal recurso»; no invoques jurisprudencia de memoria. Señalas el flanco con la cita; concluye el abogado.
Si el documento no cita ninguna norma, los puntos de las otras tres clases siguen siendo posibles. Si no hay ningún flanco anclable en una cita, «porDondeSeAtaca» va vacío: un informe honesto que no encontró por dónde atacar vale más que uno que se lo inventa.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON, sin texto antes ni después, con esta forma exacta:
{
  "queEs": "qué clase de documento es, según su propio encabezado y su parte resolutiva",
  "quienLoProfirio": "juzgado, despacho o autoridad, tal como se nombra en el documento; vacío si no se identifica",
  "radicado": "el radicado o número de proceso tal como aparece; vacío si no aparece",
  "fecha": "la fecha del documento tal como aparece; vacío si no aparece",
  "decide": ["qué decide u ordena, en concreto, una frase por punto"],
  "cargas": [{"carga": "qué exige el documento, en concreto", "aQuien": "a quién se lo exige, con las palabras del documento, o vacío si no lo identifica", "plazo": "el término tal como lo anuncia el documento, o vacío si no lo anuncia", "cita": "las palabras exactas del documento que imponen esa carga y ese plazo"}],
  "loQueSigue": ["qué queda pendiente o cuál es el paso siguiente del trámite, SEGÚN LO QUE EL PROPIO DOCUMENTO DIGA"],
  "noLoDiceElDocumento": ["lo que un abogado esperaría encontrar aquí y este documento no dice: el plazo, la autoridad ante quien se acude, el recurso procedente, la fecha de notificación"],
  "porDondeSeAtaca": [{"clase": "NO_SE_SOSTIENE | TENSION_CON_LA_NORMA | NO_RESUELVE | SIN_APOYO_CITADO", "cita": "las palabras exactas del documento en que se apoya el punto", "norma": "el artículo tal como el documento lo nombra, o vacío", "citaDeLaNorma": "lo que el DOCUMENTO dice que esa norma ordena, copiado de él, o vacío", "lectura": "tu lectura de esa tensión o de ese vacío, en una frase, sin concluir en derecho"}]
}
Si el documento no impone ninguna carga, "cargas" va vacío y lo dices en "loQueSigue". Escribe en español jurídico colombiano, neutro y preciso.

SÉ BREVE Y DENSO, porque el informe tiene un presupuesto de salida fijo y un JSON cortado a la mitad no le sirve a nadie: como máximo CUATRO elementos por lista, cada uno de hasta 25 palabras; TRES puntos en "porDondeSeAtaca", los que más daño hagan; las citas, de hasta 40 palabras. JSON compacto, en una sola línea, sin comentarios ni texto fuera del objeto.`;

export const buildRecibidoUserPrompt = (input: {
  pregunta: string;
  texto: string;
  truncado: boolean;
}): string => {
  const pregunta = input.pregunta.trim() || PREGUNTA_POR_DEFECTO_RECIBIDO;
  const recorte = input.truncado
    ? `\nNOTA: el documento fue recortado por longitud a ${MAX_CARACTERES_REVISION.toLocaleString('es-CO')} caracteres. Léelo solo hasta donde llega y NO reportes como ausente lo que pudo quedar después del corte.\n`
    : '';

  return `El abogado RECIBIÓ este documento; no lo escribió y no lo va a presentar. No se sabe de qué actuación se trata y no hay ficha verificada: no la supongas.

PREGUNTA DEL ABOGADO: ${pregunta}
${recorte}
DOCUMENTO RECIBIDO:
"""
${input.texto}
"""`;
};

/** Una carga que el documento impone, con el plazo que él mismo anuncia. */
export interface CargaDelDocumento {
  carga: string;
  /** Tal como lo anuncia el documento. Vacío cuando el documento no anuncia ninguno. */
  plazo: string;
  /** Las palabras exactas del documento que la imponen. */
  cita: string;
  /**
   * A QUIÉN SE LA IMPONE EL DOCUMENTO, con las palabras del documento.
   *
   * «el demandante», «la parte ejecutada», «el apoderado del accionante». Es
   * transcripción, no juicio: el motor NO decide si la carga es del lector.
   * Esa comparación la hace `posicionProcesal.ts` contra la posición que el
   * abogado declaró, de forma determinista y reproducible.
   *
   * Vacío cuando el documento no identifica destinatario, y entonces no se
   * atribuye nada. Puede faltar en informes guardados antes de que existiera.
   */
  aQuien: string;
  /**
   * EL VEREDICTO, Y LO PONE EL SERVIDOR — NUNCA EL MODELO.
   *
   * `parsearInformeRecibido` NO lo lee de la respuesta: lo calcula el
   * controlador con `aQuienLeToca`, comparando `aQuien` contra la posicion
   * que declaro el abogado. Si algun dia el modelo devolviera este campo, se
   * ignora, y hay un guarda que lo asevera.
   *
   * Se guarda junto al informe en vez de recalcularse al pintar: el informe
   * es la lectura de un dia, bajo una posicion concreta.
   */
  deQuienEs?: AQuienLeToca;
}

export interface InformeDeDocumentoRecibido {
  queEs: string;
  quienLoProfirio: string;
  radicado: string;
  fecha: string;
  decide: string[];
  cargas: CargaDelDocumento[];
  loQueSigue: string[];
  /** Lo que el documento calla y el abogado esperaría: se declara, no se rellena. */
  noLoDiceElDocumento: string[];
  /**
   * Por dónde se ataca. Cada punto viene anclado en una cita del documento;
   * los que no lo estén se descartan al leer la respuesta, así que esta lista
   * solo contiene flancos que se pueden mostrar con el papel en la mano.
   *
   * Puede faltar en informes guardados antes de que existiera: quien la lea
   * debe tolerar `undefined`.
   */
  porDondeSeAtaca: PuntoDeAtaque[];
  /**
   * A QUIÉN REPRESENTA EL ABOGADO, tal como él lo declaró al pedir el informe.
   *
   * Viaja DENTRO del informe y no en columna propia por lo mismo que los dos
   * informes comparten la columna `informe`: es JSONB y añadir una columna
   * hermana obliga a una migración para un dato que solo esta forma usa.
   *
   * Y se GUARDA, no se recalcula al pintar: un informe que se abre tres
   * semanas después tiene que atribuir las cargas igual que el día que se
   * pidió. Si mañana el abogado cambia de posición en el expediente, el
   * informe viejo sigue diciendo lo que dijo, que es lo correcto — fue leído
   * bajo esa posición.
   *
   * Ausente en todo informe anterior a este campo: quien lo lea tolera
   * `undefined` y entonces no atribuye nada.
   */
  posicion?: PapelEnElExpediente | null;
}

export interface ErrorDeAplicacion {
  donde: string;
  problema: string;
  correccion: string;
}

export interface CorreccionTextual {
  /** Palabras exactas del escrito, para encontrarlas con buscar. */
  cita: string;
  problema: string;
  /** La redacción propuesta, lista para pegar. */
  reemplazo: string;
}

export interface InformeDeRevision {
  resumen: string;
  fortalezas: string[];
  debilidades: string[];
  seccionesFaltantes: string[];
  erroresDeAplicacion: ErrorDeAplicacion[];
  correccionesTextuales: CorreccionTextual[];
  recomendaciones: string[];
}

const cadena = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim();

const lista = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(cadena).filter(Boolean);
  const una = cadena(v);
  return una ? [una] : [];
};

const citas = (v: unknown): CorreccionTextual[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => {
      const o = (e ?? {}) as Record<string, unknown>;
      return { cita: cadena(o.cita), problema: cadena(o.problema), reemplazo: cadena(o.reemplazo) };
    })
    .filter((e) => e.cita || e.reemplazo);
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
 * Repairs a JSON object the model left unfinished: a review measured against
 * OpenRouter filled its whole output budget and stopped mid-string, and the
 * whole report — including the parts that were complete — was thrown away as
 * unreadable. What can be saved is saved: the text is cut back to the last
 * complete element, then every open string, array and object is closed.
 * Returns null when there is nothing whole to keep.
 */
export const repararJsonCortado = (texto: string): string | null => {
  const inicio = texto.indexOf('{');
  if (inicio === -1) return null;
  const s = texto.slice(inicio);

  // Walk once, tracking string state and the bracket stack, and remember the
  // last position at which an element ended cleanly (after a value, before a
  // comma or closer).
  const pila: string[] = [];
  let enCadena = false;
  let escape = false;
  let ultimoLimpio = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (enCadena) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') {
        enCadena = false;
        ultimoLimpio = i + 1;
      }
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === '{' || c === '[') pila.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') {
      pila.pop();
      ultimoLimpio = i + 1;
    } else if (/[0-9el]/.test(c)) ultimoLimpio = i + 1; // numbers, true/false/null end cleanly too
  }
  if (ultimoLimpio <= 0) return null;

  // What is still open at a given cut, innermost last.
  const abiertosEn = (fragmento: string): string[] => {
    const abiertos: string[] = [];
    let dentro = false;
    let esc = false;
    for (const c of fragmento) {
      if (dentro) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') dentro = false;
        continue;
      }
      if (c === '"') dentro = true;
      else if (c === '{' || c === '[') abiertos.push(c === '{' ? '}' : ']');
      else if (c === '}' || c === ']') abiertos.pop();
    }
    return abiertos;
  };

  // Cut at the last clean point, then peel off whatever cannot stand on its
  // own at the tail: a trailing comma, a `"clave":` whose value never started,
  // and — inside an object — a bare `"clave"` with no colon yet (inside an
  // array the same bare string is a complete element and stays).
  let corte = s.slice(0, ultimoLimpio);
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    const antes = corte;
    corte = corte.replace(/,\s*$/, '').replace(/,?\s*"(?:[^"\\]|\\.)*"\s*:\s*$/, '');
    const abiertos = abiertosEn(corte);
    if (abiertos[abiertos.length - 1] === '}') {
      corte = corte.replace(/([{,])\s*"(?:[^"\\]|\\.)*"\s*$/, '$1').replace(/,\s*$/, '');
    }
    if (corte === antes) break;
  }
  if (!corte.trim() || corte.trim() === '{') return null;
  return corte + abiertosEn(corte).reverse().join('');
};

/**
 * The model's JSON, or null. Never throws: a report that cannot be read is
 * handed over as free text by the controller, not lost. A cut-off JSON is
 * repaired first, so the complete findings survive the missing tail.
 */
/**
 * Control characters inside strings (raw newlines, tabs) are the commonest
 * way a model breaks its own JSON. They become spaces; outside strings they
 * are left alone. Trailing commas before a closer go too.
 */
const sanearJson = (s: string): string => {
  let out = '';
  let enCadena = false;
  let escape = false;
  for (const c of s) {
    if (enCadena) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') enCadena = false;
      else if (c === '\n' || c === '\r' || c === '\t') {
        out += ' ';
        continue;
      }
    } else if (c === '"') enCadena = true;
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
};

const desescapar = (s: string): string =>
  s.replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

/**
 * Last resort when the text is not JSON at all any more — unescaped quotes
 * inside a value, for instance. The fields are pulled out by pattern: each
 * list is the run between its key and the next known key, and each item is a
 * quoted run. Loses nothing that was whole; never throws.
 */
const CLAVES = ['resumen', 'fortalezas', 'debilidades', 'seccionesFaltantes', 'erroresDeAplicacion', 'correccionesTextuales', 'recomendaciones'];

const extraerCampos = (s: string): InformeDeRevision | null => {
  const tramo = (clave: string): string | null => {
    const m = new RegExp(`"${clave}"\\s*:\\s*`).exec(s);
    if (!m) return null;
    const desde = m.index + m[0].length;
    let hasta = s.length;
    for (const otra of CLAVES) {
      if (otra === clave) continue;
      const o = s.indexOf(`"${otra}"`, desde);
      if (o !== -1 && o < hasta) hasta = o;
    }
    return s.slice(desde, hasta);
  };
  const cadenaDe = (clave: string): string => {
    const t = tramo(clave);
    if (!t) return '';
    const m = /^\s*"([\s\S]*?)"\s*(?:,\s*)?$/.exec(t.replace(/,\s*$/, ''));
    return desescapar((m ? m[1] : t.replace(/^\s*"|"\s*,?\s*$/g, '')).trim());
  };
  const listaDe = (clave: string): string[] => {
    const t = tramo(clave);
    if (!t) return [];
    const cuerpo = t.replace(/^\s*\[/, '').replace(/\]\s*,?\s*}?\s*$/, '');
    // Items are separated by `","` (the only reliable boundary once quotes inside values are suspect).
    return cuerpo
      .split(/"\s*,\s*"/)
      .map((x) => desescapar(x.replace(/^\s*"|"\s*$/g, '').trim()))
      .filter(Boolean);
  };
  const erroresDe = (): ErrorDeAplicacion[] => {
    const t = tramo('erroresDeAplicacion');
    if (!t) return [];
    const salida: ErrorDeAplicacion[] = [];
    const objetos = t.split(/}\s*,\s*{/);
    for (const o of objetos) {
      const campo = (k: string): string => {
        const m = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,\\s*"(?:donde|problema|correccion)"|\\s*}|\\s*$)`).exec(o);
        return m ? desescapar(m[1].trim()) : '';
      };
      const e = { donde: campo('donde'), problema: campo('problema'), correccion: campo('correccion') };
      if (e.donde || e.problema || e.correccion) salida.push(e);
    }
    return salida;
  };

  const citasDe = (): CorreccionTextual[] => {
    const t = tramo('correccionesTextuales');
    if (!t) return [];
    const salida: CorreccionTextual[] = [];
    for (const o of t.split(/}\s*,\s*{/)) {
      const campo = (k: string): string => {
        const m = new RegExp(`"${k}"\\s*:\\s*"([\\s\\S]*?)"\\s*(?=,\\s*"(?:cita|problema|reemplazo)"|\\s*}|\\s*$)`).exec(o);
        return m ? desescapar(m[1].trim()) : '';
      };
      const e = { cita: campo('cita'), problema: campo('problema'), reemplazo: campo('reemplazo') };
      if (e.cita || e.reemplazo) salida.push(e);
    }
    return salida;
  };

  const informe: InformeDeRevision = {
    resumen: cadenaDe('resumen'),
    fortalezas: listaDe('fortalezas'),
    debilidades: listaDe('debilidades'),
    seccionesFaltantes: listaDe('seccionesFaltantes'),
    erroresDeAplicacion: erroresDe(),
    correccionesTextuales: citasDe(),
    recomendaciones: listaDe('recomendaciones')
  };
  const algo =
    informe.resumen || informe.fortalezas.length || informe.debilidades.length || informe.recomendaciones.length;
  return algo ? informe : null;
};

/**
 * The model's JSON, or null. Never throws. Reads in order of confidence:
 * clean JSON; JSON with control characters or trailing commas sanitised; a
 * cut-off JSON repaired; and, last, the fields pulled out by pattern from a
 * text that is no longer JSON at all. The report the lawyer paid for is not
 * thrown away because the model forgot to escape a quote.
 */
export const parsearInforme = (crudo: string): InformeDeRevision | null => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  if (inicio === -1) return null;

  /*
   * Los cuatro intentos de lectura viven en `objetoDelModelo`, compartidos con
   * el informe del documento recibido: el modelo rompe su JSON de las mismas
   * maneras en los dos modos, y tener dos copias de esa reparación garantiza
   * que una de las dos se quede atrás.
   */
  const objeto = objetoDelModelo(crudo);
  if (!objeto) return extraerCampos(sinCerca.slice(inicio));

  return {
    resumen: cadena(objeto.resumen),
    fortalezas: lista(objeto.fortalezas),
    debilidades: lista(objeto.debilidades),
    seccionesFaltantes: lista(objeto.seccionesFaltantes),
    erroresDeAplicacion: errores(objeto.erroresDeAplicacion),
    correccionesTextuales: citas(objeto.correccionesTextuales),
    recomendaciones: lista(objeto.recomendaciones)
  };
};

/* ─── EL PARSEO HERMANO: EL INFORME DE UN DOCUMENTO RECIBIDO ─────────────────
 *
 * Mismo camino de lectura que `parsearInforme` —vallas de código, JSON limpio,
 * JSON saneado, JSON cortado y reparado— porque el defecto que lo motivó es el
 * mismo: un informe pagado no se tira porque al modelo se le olvidó escapar
 * una comilla. Lo que cambia son los campos, que aquí son los del papel que
 * llegó y no los de un escrito por presentar.
 *
 * NO HAY RESCATE POR PATRONES como el de `extraerCampos`, y es deliberado: ahí
 * el peor caso es una lista incompleta, mientras que aquí una carga a la que se
 * le pierde la cita o el plazo se leería como una afirmación sin respaldo. Si
 * el objeto no se puede leer, se devuelve null y el controlador entrega el
 * texto del modelo tal cual, declarado como texto libre.
 */

/** El objeto del modelo, leído en orden de confianza. Nunca lanza. */
const objetoDelModelo = (crudo: string): Record<string, unknown> | null => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  if (inicio === -1) return null;

  const intentos: string[] = [];
  const fin = sinCerca.lastIndexOf('}');
  if (fin > inicio) {
    const bruto = sinCerca.slice(inicio, fin + 1);
    intentos.push(bruto, sanearJson(bruto));
  }
  const reparado = repararJsonCortado(sanearJson(sinCerca.slice(inicio)));
  if (reparado) intentos.push(reparado);

  for (const intento of intentos) {
    try {
      const o = JSON.parse(intento) as unknown;
      if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, unknown>;
    } catch {
      /* siguiente intento */
    }
  }
  return null;
};

/**
 * Las cargas, con su plazo y su cita.
 *
 * EL PLAZO SE DEJA VACÍO CUANDO EL MODELO NO LO TRAE, y esa es la regla dura:
 * `cadena` de un `undefined` es la cadena vacía, así que un documento que no
 * anuncia término llega a la pantalla con el plazo en blanco y la pantalla dice
 * que el documento no lo anuncia. Nada rellena ese hueco aquí.
 */
const cargas = (v: unknown): CargaDelDocumento[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => {
      const o = (e ?? {}) as Record<string, unknown>;
      return { carga: cadena(o.carga), plazo: cadena(o.plazo), cita: cadena(o.cita), aQuien: cadena(o.aQuien) };
    })
    .filter((e) => e.carga || e.cita);
};

/**
 * Los puntos de ataque, con la regla dura aplicada aquí y no en la pantalla.
 *
 * DOS DESCARTES, Y LOS DOS SON DELIBERADOS:
 *
 *   · SIN CITA DEL DOCUMENTO NO HAY PUNTO. El anclaje es lo único que separa
 *     «el auto afirma esto y aquí está la frase» de una opinión sobre un
 *     documento que el lector ya no tiene delante. Un punto sin cita se cae
 *     aquí, no se pinta en gris ni se marca con una advertencia.
 *   · SIN EL TEXTO DE LA NORMA NO SE NOMBRA LA NORMA. `norma` y `citaDeLaNorma`
 *     viajan juntas: si el documento no transcribe qué ordena el artículo, el
 *     nombre solo del artículo invita a completarlo de memoria, y el punto de
 *     clase TENSION_CON_LA_NORMA —que ES la afirmación sobre lo que la norma
 *     ordena— desaparece entero.
 *
 * Una clase que no se reconoce cae en NO_SE_SOSTIENE, que es la que menos
 * afirma: no se apoya en ninguna norma y se sostiene sola con su cita.
 */
const puntosDeAtaque = (v: unknown): PuntoDeAtaque[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => {
      const o = (e ?? {}) as Record<string, unknown>;
      const bruta = cadena(o.clase).toUpperCase().replace(/[^A-Z_]/g, '');
      const clase = (CLASES_DE_ATAQUE as string[]).includes(bruta) ? (bruta as ClaseDeAtaque) : 'NO_SE_SOSTIENE';
      const citaDeLaNorma = cadena(o.citaDeLaNorma);
      return {
        clase,
        cita: cadena(o.cita),
        /* La norma sin su texto no se nombra: se completaría de memoria. */
        norma: citaDeLaNorma ? cadena(o.norma) : '',
        citaDeLaNorma,
        lectura: cadena(o.lectura)
      };
    })
    .filter((p) => Boolean(p.cita) && (p.clase !== 'TENSION_CON_LA_NORMA' || Boolean(p.citaDeLaNorma)));
};

export const parsearInformeRecibido = (crudo: string): InformeDeDocumentoRecibido | null => {
  const objeto = objetoDelModelo(crudo);
  if (!objeto) return null;

  const informe: InformeDeDocumentoRecibido = {
    queEs: cadena(objeto.queEs),
    quienLoProfirio: cadena(objeto.quienLoProfirio),
    radicado: cadena(objeto.radicado),
    fecha: cadena(objeto.fecha),
    decide: lista(objeto.decide),
    cargas: cargas(objeto.cargas),
    loQueSigue: lista(objeto.loQueSigue),
    noLoDiceElDocumento: lista(objeto.noLoDiceElDocumento),
    porDondeSeAtaca: puntosDeAtaque(objeto.porDondeSeAtaca)
  };

  /*
   * Un objeto que no dice ni qué es el documento ni qué decide ni qué exige no
   * es un informe: es un JSON con las llaves correctas y nada dentro. Se
   * devuelve null y el abogado ve el texto del modelo, que al menos es honesto
   * sobre lo poco que dijo.
   */
  const algo =
    informe.queEs ||
    informe.decide.length ||
    informe.cargas.length ||
    informe.loQueSigue.length ||
    informe.porDondeSeAtaca.length;
  return algo ? informe : null;
};
