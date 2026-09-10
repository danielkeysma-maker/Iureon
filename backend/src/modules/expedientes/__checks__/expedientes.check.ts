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

console.log('');
console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
