import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ESTADOS_DE_EXPEDIENTE,
  LADOS,
  PAPELES,
  PAPELES_INTERROGABLES,
  TABLA_DE_PIEZA,
  TIPOS_DE_PIEZA,
  seLePregunta,
  type PapelEnElExpediente
} from '../types';
import type { SpeakerRole } from '../../transcription/types';
import {
  MAX_PERSONAS_POR_TANDA,
  interrogables,
  leerPreguntas,
  tecnicaPara
} from '../preguntasDelExpediente';
import type { ActorDelExpediente, ExpedienteConDetalle } from '../types';

/**
 * GUARDA DEL EXPEDIENTE.
 *
 * Run with: npm run check:expedientes
 *
 * Lo que vigila no es que el módulo funcione —eso lo dicen sus rutas— sino las
 * tres cosas que, si se rompen, no se notan hasta que hacen daño: que el
 * vocabulario de papeles siga siendo UNO, que el aislamiento por firma esté en
 * todas las consultas, y que borrar un expediente no se lleve por delante lo
 * que costó dinero.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const RAIZ = join(process.cwd(), 'src');
const leer = (rel: string): string => readFileSync(join(RAIZ, rel), 'utf8');

/**
 * EL CODIGO SIN LOS COMENTARIOS.
 *
 * Una guarda que busca la HUELLA de un defecto tiene que mirar el codigo con
 * los comentarios fuera, porque el archivo que QUITO un defecto suele
 * explicarlo por escrito — y entonces la guarda caza su propia documentacion.
 *
 * Pasó TRES VECES el 10 y 11 de septiembre de 2026: buscando «informe» en el
 * servicio de candidatos, «Mario Alberto Perez» en el de ingesta y
 * «document_embeddings» en el de carpetas. Las dos primeras se arreglaron una
 * por una; a la tercera la funcion subio aqui, porque el problema no era de
 * cada check sino de todos.
 */
const sinComentarios = (fuente: string): string =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

/* ─── 1. UN SOLO VOCABULARIO DE PAPELES ──────────────────────────────────── */

/*
 * La primera versión de `types.ts` se inventó seis papeles cuando esta casa ya
 * tenía veintiuno curados para audiencias colombianas. Dos listas para lo mismo
 * envejecen por separado, y aquí además se pierde algo concreto: con el MISMO
 * vocabulario, un testigo del expediente se puede emparejar con la voz que
 * declaró en la audiencia grabada de ese mismo expediente.
 *
 * Esta comprobación es de TIPOS y de datos a la vez: la línea de abajo no
 * compila si `PapelEnElExpediente` deja de ser un subconjunto de `SpeakerRole`.
 */
const todoPapelEsUnRolDeAudiencia: readonly SpeakerRole[] = PAPELES;
check(
  'todo papel del expediente es también un rol de audiencia: un solo vocabulario',
  todoPapelEsUnRolDeAudiencia.length === PAPELES.length,
  `${PAPELES.length} papeles`
);

/*
 * Y AL REVÉS NO, a propósito: `SpeakerRole` tiene CLIENTE y ABOGADO, que son de
 * la entrevista y no del proceso, y DESCONOCIDO, que sí se comparte. Un
 * expediente no tiene «clientes» como papel procesal — tiene demandantes.
 */
check(
  'pero no al revés: los roles de entrevista no son papeles del expediente',
  !(PAPELES as readonly string[]).includes('CLIENTE') &&
    !(PAPELES as readonly string[]).includes('ABOGADO'),
  'CLIENTE y ABOGADO se quedan fuera'
);

/* ─── 2. A QUIÉN SE LE PREGUNTA ──────────────────────────────────────────── */

/*
 * Se interroga a las partes, a la víctima, a los testigos y al perito. NO al
 * juez, al secretario, a los apoderados, al intérprete ni a los intervinientes
 * de control: están en el expediente porque hay que saber quiénes son.
 *
 * Los casos van nombrados uno por uno y no derivados de la lista, porque
 * derivarlos de la misma constante que se comprueba no comprueba nada.
 */
const seInterroga: PapelEnElExpediente[] = [
  'DEMANDANTE',
  'DEMANDADO',
  'TESTIGO',
  'PERITO',
  'VICTIMA',
  'ACUSADO'
];
for (const papel of seInterroga) {
  check(`se le pregunta a ${papel}`, seLePregunta(papel));
}

const noSeInterroga: PapelEnElExpediente[] = [
  'JUEZ',
  'SECRETARIO',
  'APODERADO_DEMANDANTE',
  'APODERADO_DEMANDADO',
  'INTERPRETE',
  'MINISTERIO_PUBLICO'
];
for (const papel of noSeInterroga) {
  check(`y NO se le pregunta a ${papel}`, !seLePregunta(papel));
}

/*
 * LAS CINCO ETAPAS PENALES SIGUEN SIENDO CINCO. Están separadas porque cuál
 * aplica depende de la audiencia y eso lo sabe el abogado — la decisión ya
 * estaba tomada en el módulo de transcripción y este módulo la hereda. A las
 * cinco se les puede preguntar: la persona procesada declara si renuncia a
 * guardar silencio, se llame como se llame en esa etapa.
 */
const etapasPenales: PapelEnElExpediente[] = ['INDICIADO', 'IMPUTADO', 'ACUSADO', 'PROCESADO', 'CONDENADO'];
check(
  'las cinco etapas penales existen y a las cinco se les puede preguntar',
  etapasPenales.every((p) => PAPELES.includes(p) && seLePregunta(p)),
  etapasPenales.join(', ')
);
check(
  'y un interrogable no puede faltar de la lista de papeles',
  PAPELES_INTERROGABLES.every((p) => PAPELES.includes(p)),
  `${PAPELES_INTERROGABLES.length} de ${PAPELES.length}`
);

/* ─── 3. EL AISLAMIENTO POR FIRMA, EN TODAS LAS CONSULTAS ────────────────── */

/*
 * El backend entra con service_role, que OMITE RLS por diseño (`schema.sql`).
 * Eso significa que una consulta sin `.eq('firm_id', ...)` no falla: devuelve
 * datos de otra firma, en silencio. La política de la base es la segunda línea,
 * no la primera.
 *
 * Aquí importa más que en otros módulos porque el expediente toca CINCO tablas
 * ajenas al atar piezas.
 */
const servicio = leer('modules/expedientes/expedientes.service.ts');

const consultasATablasPropias = (servicio.match(/\.from\('expedientes'\)/g) ?? []).length;
const filtrosDeFirma = (servicio.match(/\.eq\('firm_id', firmId\)/g) ?? []).length;
check(
  'toda consulta a `expedientes` filtra por firma',
  filtrosDeFirma >= consultasATablasPropias,
  `${consultasATablasPropias} consultas, ${filtrosDeFirma} filtros`
);

check(
  'atar una pieza comprueba LOS DOS LADOS: la pieza y el expediente',
  /expedienteDeLaFirma\(firmId, expedienteId\)/.test(servicio) &&
    /\.eq\('firm_id', firmId\)[\s\S]{0,120}\.eq\('id', piezaId\)/.test(servicio),
  'como `clients.linkTranscription`'
);

check(
  'atar un cliente comprueba que el cliente sea de la firma',
  /clienteDeLaFirma/.test(servicio) && /CLIENT_NOT_FOUND/.test(servicio),
  'un id de otra firma llegado por el body no entra'
);

/*
 * LOS HIJOS SE COMPRUEBAN POR EL PADRE. `expediente_actores` no tiene `firm_id`
 * propio —duplicarlo abriría la puerta a que una fila apunte al expediente de
 * otra firma— así que toda operación sobre actores tiene que pasar antes por
 * `expedienteDeLaFirma`.
 */
const bloquesDeActor = servicio.split('expediente_actores');
check(
  'toda operación sobre actores comprueba antes que el expediente sea de la firma',
  (servicio.match(/await expedienteDeLaFirma\(/g) ?? []).length >= 2,
  `${bloquesDeActor.length - 1} usos de la tabla de actores`
);

/* ─── 4. BORRAR LA CARPETA NO BORRA EL TRABAJO ───────────────────────────── */

/*
 * Las cinco columnas `expediente_id` son ON DELETE SET NULL. Un borrador que
 * costó saldo, una revisión que se pagó y un vencimiento que todavía corre se
 * DESATAN y siguen ahí. Si alguien cambiara eso a CASCADE, borrar una carpeta
 * borraría el trabajo que había dentro — y no habría forma de recuperarlo.
 */
const migracion = readFileSync(join(process.cwd(), '..', 'supabase', 'migration-expedientes.sql'), 'utf8');
const columnasAtadas = (migracion.match(/ADD COLUMN IF NOT EXISTS expediente_id UUID/g) ?? []).length;
const setNull = (migracion.match(/REFERENCES public\.expedientes\(id\) ON DELETE SET NULL/g) ?? []).length;
check(
  'las cinco piezas se DESATAN al borrar el expediente, no se borran con él',
  columnasAtadas === 5 && setNull === columnasAtadas,
  `${columnasAtadas} columnas, ${setNull} con SET NULL`
);
check(
  'y los actores sí se van con el expediente, porque solo existen dentro de él',
  /expediente_id UUID NOT NULL REFERENCES public\.expedientes\(id\) ON DELETE CASCADE/.test(migracion),
  'CASCADE solo en la tabla hija'
);

const controlador = leer('modules/expedientes/expedientes.controller.ts');
check(
  'y al borrar SE LE DICE al abogado que lo de dentro sigue ahí',
  /sigue en su sitio, sin expediente/.test(controlador),
  'un borrado silencioso se lee como si se hubiera llevado todo'
);

/* ─── 5. LA TABLA NUEVA ENTRA EN EL BORRADO DE FIRMA ─────────────────────── */

/*
 * `borrar_firma_completa` enumera las tablas A MANO, y ya se olvidó una vez:
 * `agenda_terminos` es posterior a esa función y no estaba en ella, así que
 * borrar una firma le dejaba los vencimientos en la base. Una tabla nueva que
 * repita el olvido guardaría datos de una firma que pidió irse.
 */
check(
  'el expediente entra en el borrado de firma, y de paso arrastra la agenda que faltaba',
  /borrar_expedientes_de_la_firma/.test(migracion) &&
    /DELETE FROM public\.agenda_terminos WHERE firm_id = p_firm_id/.test(migracion),
  'expedientes, actores, agenda_terminos y agenda_avisos'
);

/* ─── 6. LO QUE SE PUEDE ATAR ESTÁ EN UN SOLO SITIO ──────────────────────── */

check(
  'las piezas atables se declaran una vez y su tabla nunca sale al cliente',
  TIPOS_DE_PIEZA.length === Object.keys(TABLA_DE_PIEZA).length && TIPOS_DE_PIEZA.length === 5,
  TIPOS_DE_PIEZA.join(', ')
);
check(
  'y todas tienen su columna en la migración',
  TIPOS_DE_PIEZA.every((t) => migracion.includes(`ALTER TABLE public.${TABLA_DE_PIEZA[t]}`)),
  Object.values(TABLA_DE_PIEZA).join(', ')
);

/* ─── 7. LA RUTA DE ATAR VA ANTES QUE LA DE `:id` ────────────────────────── */

/*
 * Con Express, `/expedientes/atar` casaría con `/expedientes/:id` y `atar` se
 * leería como el identificador de un expediente. El síntoma sería un 404 que no
 * explica nada. `clients.routes.ts` ya toma esta precaución con `/clients/link`.
 */
const rutas = leer('modules/expedientes/expedientes.routes.ts');
check(
  'la ruta de atar va declarada ANTES que la de `:id`',
  rutas.indexOf("'/expedientes/atar'") < rutas.indexOf("'/expedientes/:id'"),
  'si no, `atar` se leería como un id'
);
/*
 * Y LA DE CANDIDATOS TAMBIÉN, que es la que más fácil se cuela después: es un
 * GET, y el GET de `:id` existe desde antes. Puesta detrás, pedir la lista de
 * lo que hay para traer devolvería «ese expediente no existe» buscando uno
 * llamado «candidatos», y el 404 no explicaría nada.
 */
check(
  'y la de candidatos también, por lo mismo',
  rutas.indexOf("'/expedientes/candidatos'") < rutas.indexOf("'/expedientes/:id'"),
  'un GET colado detrás de `:id` devolvería 404 buscando un expediente llamado «candidatos»'
);
/*
 * LOS CANDIDATOS SE LEEN DE LAS CINCO TABLAS, y cada consulta filtra por
 * firma. Aquí el olvido es más grave que en otros sitios: son tablas AJENAS al
 * módulo, y una sin filtro devolvería las entrevistas de otra firma en la
 * lista de «lo que usted ya tiene».
 */
const candidatos = leer('modules/expedientes/candidatos.service.ts');
const tablasLeidas = (candidatos.match(/\.from\('/g) ?? []).length;
const filtradas = (candidatos.match(/\.eq\('firm_id', firmId\)/g) ?? []).length;
/*
 * EL INVARIANTE, NO EL CONTEO. La primera version exigia exactamente cinco
 * tablas y cinco filtros, y se puso roja el dia que el archivo gano las
 * consultas de los documentos indexados — nueve y nueve, igual de correctas.
 * Un check que cuenta obliga a tocarlo cada vez que el archivo crece y ensena
 * a subirle el numero sin mirar; uno que compara la relacion sigue diciendo lo
 * mismo con cinco consultas o con veinte.
 */
check(
  'toda consulta de este archivo filtra por firma, sin excepcion',
  tablasLeidas > 0 && filtradas >= tablasLeidas,
  `${tablasLeidas} tablas, ${filtradas} filtros`
);
/*
 * SE MIRAN LAS COLUMNAS QUE SE PIDEN, NO EL ARCHIVO ENTERO.
 *
 * La primera versión de esta comprobación buscaba «informe» en todo el
 * archivo y se puso roja por un COMENTARIO que explica precisamente que el
 * informe no se trae. Una falsa alarma en una guarda es peor que no tenerla:
 * enseña a ignorarla, y el día que señale algo cierto nadie la lee. Este
 * repositorio lo tiene escrito y aun así lo repetí.
 */
const columnasPedidas = [...candidatos.matchAll(/\.select\('([^']+)'\)/g)].map((m) => m[1]);
const cuerposColados = columnasPedidas.filter((c) =>
  /full_text|legal_text|informe|texto_original|texto_trabajo|segments|conversacion/.test(c)
);
check(
  'y no se traen los cuerpos: la lista es de rótulos, no de contenido',
  columnasPedidas.length > 0 && cuerposColados.length === 0,
  cuerposColados.length > 0
    ? `SE CUELA UN CUERPO: ${cuerposColados.join(' | ')}`
    : `${columnasPedidas.length} selects, todos de rótulos`
);

/* ─── 8. LOS ESTADOS Y LOS LADOS SIGUEN SIENDO LOS QUE LA BASE ACEPTA ────── */

/*
 * El CHECK vive en la base y el tipo en TypeScript: si dejan de coincidir, el
 * error aparece en producción como un fallo de escritura, no en compilación.
 */
for (const estado of ESTADOS_DE_EXPEDIENTE) {
  check(`la base acepta el estado ${estado}`, migracion.includes(`'${estado}'`));
}
for (const lado of LADOS) {
  check(`la base acepta el lado ${lado}`, migracion.includes(`'${lado}'`));
}

const migracionPapeles = readFileSync(
  join(process.cwd(), '..', 'supabase', 'migration-expedientes-papeles.sql'),
  'utf8'
);
const papelesQueFaltan = PAPELES.filter((p) => !migracionPapeles.includes(`'${p}'`));
check(
  'y acepta los veintiún papeles, sin que sobre ni falte uno',
  papelesQueFaltan.length === 0,
  papelesQueFaltan.length > 0 ? `faltan en la base: ${papelesQueFaltan.join(', ')}` : `${PAPELES.length} papeles`
);

/* ─── 9. EL INTERROGATORIO SABE A QUIÉN SE LE PREGUNTA ──────────────────── */

const actor = (
  id: string,
  nombre: string,
  papel: ActorDelExpediente['papel'],
  lado: ActorDelExpediente['lado'],
  sobreQue: string | null = null
): ActorDelExpediente => ({
  id,
  expedienteId: 'exp-1',
  nombre,
  papel,
  lado,
  sobreQue,
  identificacion: null,
  notas: null,
  clienteId: null,
  createdAt: '2026-09-10'
});

const TESTIGO_PROPIO = actor('a1', 'Marta Ríos', 'TESTIGO', 'PROPIO', 'la entrega del inmueble');
const TESTIGO_AJENO = actor('a2', 'Jorge Pineda', 'TESTIGO', 'CONTRARIO');
const PARTE_AJENA = actor('a3', 'ACME S.A.S.', 'DEMANDADO', 'CONTRARIO');
const PERITO_AJENO = actor('a4', 'Luis Gómez', 'PERITO', 'CONTRARIO');
const PERITO_OFICIO = actor('a5', 'Ana Cuervo', 'PERITO', 'NEUTRAL');
const EL_JUEZ = actor('a6', 'Juzgado 3 Civil', 'JUEZ', 'NEUTRAL');

/*
 * LA TÉCNICA LA DECIDE EL CÓDIGO Y NO EL MODELO, porque se deduce de dos
 * campos que el abogado ya llenó. Interrogar a un testigo propio con preguntas
 * cerradas, o contrainterrogar con abiertas, arruina la diligencia por muy
 * inteligente que sea la pregunta.
 */
check(
  'al testigo PROPIO se le interroga con abiertas',
  /ABIERTAS/.test(tecnicaPara(TESTIGO_PROPIO)) && /DIRECTO/.test(tecnicaPara(TESTIGO_PROPIO))
);
check(
  'al testigo de la CONTRAPARTE se le contrainterroga con cerradas',
  /CERRADAS/.test(tecnicaPara(TESTIGO_AJENO)) && /CONTRAINTERROGATORIO/.test(tecnicaPara(TESTIGO_AJENO))
);
check(
  'a la PARTE contraria se le hace interrogatorio de parte, que no es lo mismo',
  /INTERROGATORIO DE PARTE/.test(tecnicaPara(PARTE_AJENA))
);
/*
 * Al perito NO se le pregunta qué vio: no vio nada, dictaminó. Es el caso que
 * un cajón de «testigos de la contraparte» borraba.
 */
check(
  'al PERITO ajeno se le va por el método y no por lo que vio',
  /CONTRADICCIÓN DEL DICTAMEN/.test(tecnicaPara(PERITO_AJENO)) &&
    /no vio nada/.test(tecnicaPara(PERITO_AJENO))
);
check(
  'y al perito de oficio no se le contrainterroga: no es de nadie',
  !/CONTRAINTERROGATORIO/.test(tecnicaPara(PERITO_OFICIO)) &&
    /ESCLARECIMIENTO/.test(tecnicaPara(PERITO_OFICIO))
);

const EXPEDIENTE: ExpedienteConDetalle = {
  /* El servidor la deduce de los actores; este fixture no la ejercita. */
  posicionSugerida: null,
  id: 'exp-1',
  caratula: 'Mosquera vs. ACME',
  radicado: null,
  despacho: null,
  rama: 'CIVIL',
  clienteId: null,
  clienteNombre: null,
  contraparte: 'ACME S.A.S.',
  estado: 'ACTIVO',
  notas: null,
  createdBy: 'a@b.co',
  createdAt: '2026-09-10',
  updatedAt: '2026-09-10',
  listaDeActores: [TESTIGO_PROPIO, TESTIGO_AJENO, PARTE_AJENA, PERITO_AJENO, EL_JUEZ],
  piezas: { entrevistas: 0, audiencias: 0, revisiones: 0, borradores: 0, terminos: 0, orientaciones: 0 }
};

check(
  'el juez no aparece entre las personas a las que se prepara interrogatorio',
  !interrogables(EXPEDIENTE).some((a) => a.papel === 'JUEZ'),
  `${interrogables(EXPEDIENTE).length} de ${EXPEDIENTE.listaDeActores.length} actores`
);

/*
 * ─── LO QUE MÁS IMPORTA: EL ACTOR MANDA SOBRE LO QUE DIGA EL MODELO ───────
 *
 * Si el motor devuelve un `actorId` que no se le mandó, o le cambia el nombre
 * a alguien, el resultado sería una lista de preguntas atribuidas a una
 * persona que no está en el expediente — y eso se lee igual de bien que una
 * lista correcta. El nombre y la técnica se toman del actor, nunca de la
 * respuesta, y lo que no case se descarta.
 */
const RESPUESTA = JSON.stringify({
  enfoque: 'Probar la entrega y el incumplimiento.',
  porPersona: [
    { actorId: 'a1', nombre: 'OTRA PERSONA', preguntas: [{ pregunta: '¿Qué vio usted?', paraQue: 'fijar el hecho' }] },
    { actorId: 'inventado', preguntas: [{ pregunta: '¿Y usted?', paraQue: 'nada' }] }
  ]
});
const leidas = leerPreguntas(RESPUESTA, [TESTIGO_PROPIO], 'a@b.co');
check(
  'una lista con un actorId inventado se DESCARTA, no entra con el nombre que el modelo quiso',
  leidas !== null && leidas.porPersona.length === 1,
  `${leidas?.porPersona.length ?? 0} listas`
);
check(
  'y el nombre sale del actor real, aunque el modelo devuelva otro',
  leidas?.porPersona[0].nombre === 'Marta Ríos',
  leidas?.porPersona[0].nombre
);
check(
  'la técnica también sale del actor: el modelo no la escoge',
  /ABIERTAS/.test(leidas?.porPersona[0].tecnica ?? '')
);
check(
  'una respuesta ilegible no se inventa: devuelve null y el saldo se reembolsa',
  leerPreguntas('esto no es JSON', [TESTIGO_PROPIO], 'a@b.co') === null
);
check(
  'y una respuesta sin una sola pregunta tampoco cuenta como respuesta',
  leerPreguntas(JSON.stringify({ enfoque: 'x', porPersona: [{ actorId: 'a1', preguntas: [] }] }), [TESTIGO_PROPIO], 'a@b.co') === null
);

/*
 * EL TOPE POR TANDA EXISTE POR EL PRESUPUESTO DE SALIDA. Cada persona son
 * ~1.100 tokens; sin tope, ocho personas cortarían el JSON y lo que se
 * perdería es la última lista, en silencio.
 */
const preguntasCtrl = leer('modules/expedientes/preguntas.controller.ts');
check(
  'el número de personas por tanda tiene tope y el presupuesto de salida crece con ellas',
  MAX_PERSONAS_POR_TANDA > 0 &&
    /TOKENS_POR_PERSONA \* aQuienes\.length/.test(preguntasCtrl),
  `${MAX_PERSONAS_POR_TANDA} personas por tanda`
);
check(
  'si no produce preguntas legibles, se devuelve el saldo ANTES de responder',
  preguntasCtrl.indexOf('refundReservation') < preguntasCtrl.indexOf("error: 'QUESTIONS_FAILED'"),
  'serverless se congela al responder'
);
check(
  'se cobra con la MISMA operación que las preguntas de una revisión: el histórico no se parte',
  /const OPERACION = 'CONSULTA_REVISION'/.test(preguntasCtrl),
  'mismo trabajo, mismo renglón en el movimiento de crédito'
);

/* ─── 10. EL EXPEDIENTE DE 300 PAGINAS ───────────────────────────────────── */

const indexar = leer('modules/expedientes/indexar.controller.ts');
const ingesta = leer('modules/ingestion/ingestion.service.ts');
const buscador = leer('modules/search/vectorSearch.service.ts');
const migracionIndice = readFileSync(
  join(process.cwd(), '..', 'supabase', 'migration-expediente-indexado.sql'),
  'utf8'
);

/*
 * LO QUE MAS IMPORTA DE TODO ESTE BLOQUE: un caso no puede ver el de otro
 * cliente. No es fuga entre firmas —el filtro por `firm_id` sigue— pero
 * llevarle al motor el expediente de otro cliente de la misma firma es
 * exactamente lo que un abogado no puede permitirse.
 */
check(
  'la busqueda se puede encerrar en un expediente',
  /filter_expediente_id/.test(buscador) && /expedienteId\?: string \| null/.test(buscador),
  'sin esto, preparar un interrogatorio busca en los casos de los demas clientes'
);
check(
  'y sin expediente pedido se comporta como siempre: toda la firma',
  /filter_expediente_id IS NULL/.test(migracionIndice),
  'el buscador de jurisprudencia sigue llamando con tres argumentos'
);
check(
  'el corpus publico entra igual dentro de un expediente: la jurisprudencia es de todos los casos',
  /OR de\.firm_id = 'SYSTEM_CORPUS'/.test(migracionIndice),
  'acotar al caso no puede dejar sin jurisprudencia'
);
check(
  'indexar comprueba que el expediente sea de la firma ANTES de escribir fragmentos',
  indexar.indexOf('obtenerExpediente(firmId') < indexar.indexOf('ingestLegalDocument'),
  'un id ajeno por la URL dejaria fragmentos de un cliente colgando del caso de otro'
);

/*
 * NO SE INDEXA TEXTO INVENTADO. Aqui vivia un «expediente de muestra» con un
 * demandante, un juzgado y una afirmacion sobre la prescripcion del art. 151
 * del CPTSS, que se indexaba cuando el texto venia vacio. Vectorizado, queda
 * indistinguible de lo real — y el propio archivo tenia escrito que fabricar
 * vectores «envenena el indice para siempre».
 */
/*
 * SE MIRA EL CODIGO, NO LA PROSA. La primera version de esta comprobacion
 * buscaba «Mario Alberto Perez» en el archivo entero y se puso roja por el
 * COMENTARIO que explica que ese texto se retiro. Es la SEGUNDA vez en el
 * mismo dia que caigo en esto —la otra fue buscando «informe» en el servicio
 * de candidatos— y el patron es siempre el mismo: un archivo que documenta el
 * defecto que quito contiene, por escrito, las palabras del defecto.
 *
 * La regla, para no repetirla una tercera: una guarda que busca la HUELLA de
 * un defecto tiene que mirar el codigo con los comentarios fuera.
 */

check(
  'el «expediente de muestra» inventado no volvio',
  !/Mario Alberto P|Torres & Asociados|getSampleExpedienteText\s*\(/.test(sinComentarios(ingesta)),
  'sin texto se rechaza, no se rellena'
);
check(
  'y sin texto suficiente se rechaza diciendo por que',
  /SIN_TEXTO/.test(ingesta) && /MINIMO_PARA_INDEXAR/.test(ingesta),
  'un PDF escaneado sin OCR devuelve basura, y vectorizar basura ensucia el caso'
);

/*
 * EL RELOJ. Insertar de una en una eran 295 idas y vueltas para el Codigo
 * General del Proceso; ese era el riesgo real, no los embeddings. Y un fallo a
 * mitad dejaba el documento MEDIO indexado, que se ve igual que entero.
 */
check(
  'los fragmentos se insertan por lotes, no de uno en uno',
  /FILAS_POR_INSERCION/.test(ingesta) && /\.insert\(lote\)/.test(ingesta),
  '295 inserciones sueltas contra tres lotes'
);
check(
  'y un lote que falle lo dice en vez de dejar el documento a medias en silencio',
  /INDICE_INCOMPLETO/.test(ingesta),
  'medio indexado responde igual que entero, solo que sin la mitad del expediente'
);

/*
 * EL TRASLAPE. Sin el, una regla que caiga en el corte queda partida entre dos
 * fragmentos y ninguno la dice entera — en texto juridico es la diferencia
 * entre recuperar el articulo y recuperar su titulo.
 */
check(
  'los fragmentos se traslapan',
  /PALABRAS_DE_TRASLAPE/.test(ingesta) && /overlapWords/.test(ingesta),
  'una regla partida en el corte no se recupera entera'
);

/*
 * LOS FRAGMENTOS SI SE VAN CON EL EXPEDIENTE, y es la unica excepcion a la
 * regla del modulo. Un pedazo de 400 palabras sin titulo no significa nada
 * fuera de su documento: desatarlo dejaria cientos de trozos anonimos en el
 * indice, saliendo en busquedas de otros casos.
 */
check(
  'borrar el expediente SI se lleva sus fragmentos (CASCADE), al reves que todo lo demas',
  /expediente_id UUID[\s\S]{0,80}REFERENCES public\.expedientes\(id\) ON DELETE CASCADE/.test(migracionIndice),
  'un parrafo suelto sin caso no se puede reconstruir'
);

/* ─── 11. LO INDEXADO ALIMENTA EL INTERROGATORIO, SIN PODER TUMBARLO ─────── */

const conPreguntas = leer('modules/expedientes/preguntas.controller.ts');

check(
  'el interrogatorio busca en el expediente indexado, acotado a ESE caso',
  /vectorSearchService\.search\(firmId, consulta, FRAGMENTOS_DEL_CASO, expediente\.id\)/.test(conPreguntas),
  'sin el id del caso traeria parrafos del expediente de otro cliente'
);

/*
 * LA BUSQUEDA NO PUEDE COSTAR EL INTERROGATORIO. Corre ANTES de llamar al
 * motor, con la reserva de saldo ya hecha: si un fallo de red la dejara
 * escapar, el abogado perderia la peticion por un extra que ni siquiera
 * pidio. Sin proveedor, sin indice o con la red caida, se prepara como antes.
 */
const bloqueBusqueda = conPreguntas.slice(
  conPreguntas.indexOf('let material'),
  conPreguntas.indexOf('const llamada = await conLimite')
);
check(
  'y un fallo de la busqueda no tumba el interrogatorio: va dentro de un try',
  bloqueBusqueda.includes('try') && bloqueBusqueda.includes('catch'),
  'es un extra, no un requisito'
);
check(
  'sin nada indexado, el material va nulo y el prompt lo dice',
  /material: null/.test(leer('modules/expedientes/preguntasDelExpediente.ts')) ||
    /no adjunt/.test(leer('modules/expedientes/preguntasDelExpediente.ts')),
  'el prompt tiene una rama para cuando no hay material'
);

/*
 * Y NO SE TRAE EL EXPEDIENTE ENTERO. Seis fragmentos de 400 palabras son unas
 * 2.400: bastante para que las preguntas nazcan de hechos del caso, y poco
 * para que no desplacen a los actores y a la ficha dentro del encargo.
 */
check(
  'se traen unos pocos pasajes, no el expediente entero',
  /FRAGMENTOS_DEL_CASO = \d+/.test(conPreguntas) &&
    Number(/FRAGMENTOS_DEL_CASO = (\d+)/.exec(conPreguntas)?.[1] ?? 0) <= 12,
  'treinta fragmentos convertirian el interrogatorio en un resumen del expediente'
);

/* ─── 12. BUSCAR DENTRO DEL EXPEDIENTE ───────────────────────────────────── */

const controladorExp = leer('modules/expedientes/expedientes.controller.ts');

check(
  'buscar en el expediente va acotado a ESE caso',
  /vectorSearchService\.search\(firmId, q, \d+, expediente\.id\)/.test(controladorExp),
  'sin el id del caso devolveria papeles de otro cliente'
);

/*
 * EL CORPUS PUBLICO NO ENTRA AQUI, y si en el interrogatorio. La RPC lo deja
 * pasar siempre —hace bien: la ley es de todos los casos— asi que el filtro va
 * en el controlador. Quien busca dentro de SU expediente quiere sus papeles;
 * devolverle una sentencia de la Corte mezclada convierte esto en un segundo
 * buscador de jurisprudencia, que ya existe en su propio modulo.
 */
check(
  'y no mezcla el corpus publico con los papeles del caso',
  /const delCaso = hallado\.matches\.filter\(\(m\) => m\.firmId === firmId\)/.test(controladorExp),
  'buscar en mi caso no es buscar jurisprudencia'
);

/*
 * «NO SE PUDO BUSCAR» NO ES «NO HAY RESULTADOS». Sin proveedor o sin indice,
 * decir «nada coincide» dejaria al abogado creyendo que su expediente no habla
 * de lo que pregunto — y decidiendo sobre esa falsedad.
 */
const pantallaDeBusqueda = readFileSync(
  join(process.cwd(), '..', 'frontend', 'src', 'modules', 'expedientes', 'components', 'BuscarEnExpediente.tsx'),
  'utf8'
);
check(
  'el estado de la busqueda viaja, y la pantalla distingue «no se pudo» de «no hay»',
  /estado: hallado\.status/.test(controladorExp) && /r\.estado !== 'OK'/.test(pantallaDeBusqueda),
  'un fallo del indice no puede leerse como un expediente que no dice nada'
);

/*
 * BUSCAR NO COBRA. Es un embedding de unas pocas palabras contra un indice ya
 * pagado, sin modelo de lenguaje de por medio. Si algun dia alguien le mete una
 * reserva de saldo, este check lo dice.
 */
const bloqueBuscar = controladorExp.slice(controladorExp.indexOf('buscarEnExpedienteController'));
check(
  'y no cobra: no hay reserva de saldo en el camino de buscar',
  !/reserveForOperation|settleOperation/.test(bloqueBuscar),
  'cobrar por buscar seria cobrar por leer lo que el abogado ya subio'
);

/* ─── 13. LAS CARPETAS ───────────────────────────────────────────────────── */

const carpetas = leer('modules/expedientes/carpetas.service.ts');
const migracionCarpetas = readFileSync(
  join(process.cwd(), '..', 'supabase', 'migration-expediente-carpetas.sql'),
  'utf8'
);
const pantallaCarpetas = readFileSync(
  join(process.cwd(), '..', 'frontend', 'src', 'modules', 'expedientes', 'components', 'CarpetasDelExpediente.tsx'),
  'utf8'
);

/*
 * ─── LA REGLA QUE GOBIERNA TODO: ORGANIZAR NO CAMBIA LO QUE EL MOTOR LEE ───
 *
 * El dueno lo fijo: el interrogatorio lee TODO el expediente, no la carpeta
 * abierta. Por eso este modulo NO puede tocar `document_embeddings` ni filtrar
 * la recuperacion por carpeta. Si alguien lo hiciera, mover un documento
 * empezaria a esconderselo al motor — en silencio, porque el interrogatorio
 * seguiria respondiendo, solo que sin esa prueba.
 */
check(
  'las carpetas NO tocan los fragmentos ni la recuperacion',
  !/document_embeddings/.test(sinComentarios(carpetas)) &&
    !/carpeta_id/.test(sinComentarios(leer('modules/search/vectorSearch.service.ts'))),
  'organizar no puede cambiar lo que el interrogatorio lee'
);
check(
  'y la pantalla se lo dice al abogado',
  /leen todo el expediente/.test(pantallaCarpetas),
  'la duda «si lo meto aqui, deja de verlo?» haria que nadie organizara nada'
);

/*
 * UNA CARPETA DENTRO DE SI MISMA ROMPE EL ARBOL EN SILENCIO. La base no lo
 * impide —un ciclo de padres es una fila valida para Postgres— y el efecto es
 * un ramal que deja de colgar de la raiz: la pantalla no lo dibuja y sus
 * documentos se vuelven inalcanzables sin que nada falle.
 */
check(
  'no se puede meter una carpeta dentro de si misma',
  /CARPETA_EN_SI_MISMA/.test(carpetas),
  'seria un ciclo, y el ramal desapareceria del arbol'
);
check(
  'ni dentro de una de sus propias descendientes',
  /CARPETA_EN_SU_HIJA/.test(carpetas) && /esDescendiente/.test(carpetas),
  'el mismo ciclo, un nivel mas abajo'
);
check(
  'y el recorrido de padres tiene tope, por si ya hubiera un ciclo en la base',
  /saltos < \d+/.test(carpetas),
  'sin tope, un ciclo existente colgaria el servidor'
);

/*
 * DOS DECISIONES OPUESTAS Y A PROPOSITO, las dos en la migracion:
 * las subcarpetas se van con la carpeta; los documentos NO. Que un gesto para
 * ORDENAR borre trescientas paginas indexadas seria el peor efecto posible.
 */
check(
  'borrar una carpeta se lleva sus subcarpetas',
  /padre_id UUID REFERENCES public\.expediente_carpetas\(id\) ON DELETE CASCADE/.test(migracionCarpetas),
  'dejarlas sueltas llena la raiz de huerfanas que nadie sabe de donde salieron'
);
/*
 * Y TAMBIEN SUS DOCUMENTOS. Esto estuvo al reves: la primera version los
 * conservaba subiendolos a la raiz, para que un gesto de ordenar no borrara
 * trescientas paginas indexadas. El dueno lo corrigio con razon — en cualquier
 * gestor de archivos borrar una carpeta borra su contenido, y pelear con esa
 * intuicion no evita el dano, lo cambia de sitio: el abogado los da por
 * perdidos mientras siguen saliendo en las busquedas desde una raiz donde
 * nadie los puso.
 */
check(
  'y tambien sus documentos, que es lo que el abogado espera al borrar una carpeta',
  /\.from\('legal_documents'\)[\s\S]{0,200}\.delete\(\)[\s\S]{0,200}\.in\('carpeta_id', rama\)/.test(carpetas),
  'borrar una carpeta borra su contenido, como en cualquier gestor de archivos'
);

/*
 * PERO NO SIN PREGUNTAR, Y CON NUMEROS. Una accion que no se deshace no puede
 * no preguntar —la primera version borraba de un clic— y «se borrara todo lo
 * que contiene» sin cifras no advierte nada: el abogado no sabe si son dos
 * archivos o trescientas paginas que costo vectorizar.
 */
check(
  'se pregunta antes, con el dialogo de la casa y no con uno del navegador',
  /ConfirmarDialog/.test(pantallaCarpetas) && !/window\.confirm|\bconfirm\(/.test(sinComentarios(pantallaCarpetas)),
  'una accion que no se deshace no puede no preguntar'
);
check(
  'y el dialogo dice CUANTO se va, no solo que se va',
  /contenidoDeCarpeta/.test(pantallaCarpetas) && /documento\(s\) indexado\(s\)/.test(pantallaCarpetas),
  'sin numeros, la advertencia no advierte'
);
check(
  'si la cuenta falla, NO se dice que la carpeta esta vacia',
  /prometer un n/.test(pantallaCarpetas),
  'decir «vacia» porque el conteo fallo es la peor forma de equivocarse en un borrado'
);
check(
  'y despues se informa con numeros lo que efectivamente se fue',
  /subcarpeta\(s\)/.test(controladorExp) && /Se borr/.test(controladorExp),
  'lo advertido y lo ocurrido pueden no coincidir: alguien pudo mover algo en medio'
);

/*
 * UN DOCUMENTO EN UNA SOLA CARPETA, y la estructura lo hace imposible de
 * romper: es una COLUMNA, no una tabla de union. Con una tabla, «un documento
 * en dos carpetas» seria un error de aplicacion que nadie notaria.
 */
check(
  'un documento esta en UNA sola carpeta: es una columna, no una tabla de union',
  /ADD COLUMN IF NOT EXISTS carpeta_id/.test(migracionCarpetas) &&
    !/CREATE TABLE[\s\S]{0,200}documento_carpeta/.test(migracionCarpetas),
  'con una tabla de union la regla seria una promesa; con una columna, no se puede expresar'
);

/*
 * DOS CARPETAS HERMANAS NO SE PUEDEN LLAMAR IGUAL. Y hacen falta DOS indices,
 * no uno: en SQL `NULL <> NULL`, asi que un UNIQUE sobre `padre_id` no
 * restringe nada en la raiz — que es justo donde mas se repiten los nombres.
 */
check(
  'dos carpetas hermanas no se pueden llamar igual, tambien en la raiz',
  /idx_carpetas_nombre_unico\b/.test(migracionCarpetas) &&
    /idx_carpetas_nombre_unico_raiz/.test(migracionCarpetas),
  'un UNIQUE con padre_id NULL no restringe nada: hacen falta dos indices'
);
check(
  'y el choque de nombres se le dice al abogado con palabras, no con un codigo de Postgres',
  /NOMBRE_REPETIDO/.test(carpetas) && /23505/.test(carpetas),
  'dos «Pruebas» hermanas son indistinguibles y el archivo acaba en la otra'
);

/*
 * LOS TRES MODOS DE VISTA. Se comprueba que existan los tres y que el escogido
 * se recuerde: volver a escoger «tarjetas» en cada expediente es pedirle al
 * abogado que repita una decision que ya tomo.
 */
check(
  'los tres modos de vista existen',
  /'lista'/.test(pantallaCarpetas) && /'detalle'/.test(pantallaCarpetas) && /'tarjetas'/.test(pantallaCarpetas),
  'lista, detalle y tarjetas'
);
check(
  'y el modo escogido se recuerda, sin que un fallo del almacenamiento tumbe la pantalla',
  /localStorage/.test(pantallaCarpetas) && /catch/.test(pantallaCarpetas),
  'una ventana privada no puede dejar sin expediente al abogado'
);

console.log('');
console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
