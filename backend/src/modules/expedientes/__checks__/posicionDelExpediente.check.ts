/**
 * GUARDA DE LA POSICIÓN DEDUCIDA DEL EXPEDIENTE.
 *
 * Run with: npm run check:posicion-expediente
 *
 * ─── QUÉ SE JUEGA AQUÍ ─────────────────────────────────────────────────────
 *
 * Lo que esto devuelve prellena el desplegable «A quién representa» del
 * informe de un documento recibido, y ese desplegable decide si una carga se
 * le marca al abogado como suya o como de la contraparte. Deducir la posición
 * CONTRARIA le diría «esta carga no es suya» sobre el plazo que sí tiene que
 * cumplir.
 *
 * ─── EL VALOR POR DEFECTO ES LA TRAMPA ─────────────────────────────────────
 *
 * «De qué lado» nace en «De mi lado». Quien registre al demandante y al
 * demandado sin tocar ese campo deja a los dos como propios; quedarse con el
 * primero acertaría la mitad de las veces. Por eso la regla del lado exige
 * EXACTAMENTE UNO, y la mayoría de los casos de abajo comprueban silencios.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { posicionSegunElExpediente, type ActorParaDeducir } from '../posicionDelExpediente';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const actor = (
  papel: ActorParaDeducir['papel'],
  lado: ActorParaDeducir['lado'] = 'PROPIO',
  clienteId: string | null = null
): ActorParaDeducir => ({ papel, lado, clienteId });

console.log('POSICIÓN DEDUCIDA DEL EXPEDIENTE — prellenar sin adivinar');
console.log('');

/* ─── 1. LA SEÑAL FUERTE: EL ACTOR QUE ES EL CLIENTE ─────────────────────── */

check(
  'el actor atado al cliente del expediente manda',
  posicionSegunElExpediente(
    [actor('DEMANDANTE', 'CONTRARIO'), actor('DEMANDADO', 'PROPIO', 'cli-1')],
    'cli-1'
  ) === 'DEMANDADO'
);
check(
  'y manda AUNQUE su lado diga otra cosa: alguien escogió ese cliente a mano, dos veces',
  posicionSegunElExpediente([actor('DEMANDADO', 'CONTRARIO', 'cli-1')], 'cli-1') === 'DEMANDADO',
  'el lado tiene valor por defecto; la atadura al cliente no'
);
check(
  'el cliente de OTRO expediente no cuenta',
  posicionSegunElExpediente([actor('DEMANDADO', 'CONTRARIO', 'cli-9')], 'cli-1') === null
);
check(
  'el mismo cliente registrado con dos papeles distintos: se calla',
  posicionSegunElExpediente(
    [actor('DEMANDANTE', 'PROPIO', 'cli-1'), actor('DEMANDADO', 'PROPIO', 'cli-1')],
    'cli-1'
  ) === null,
  'no hay una respuesta, y escoger una seria inventarla'
);
check(
  'si el cliente está registrado con un papel que no se representa, se calla',
  posicionSegunElExpediente([actor('TESTIGO', 'PROPIO', 'cli-1')], 'cli-1') === null,
  'a un testigo no se le representa; caer a la regla del lado aqui elegiria a otro'
);

/* ─── 2. LA SEÑAL DÉBIL: EL ÚNICO PROPIO ────────────────────────────────── */

check(
  'sin cliente atado, el único propio representable sirve',
  posicionSegunElExpediente(
    [actor('DEMANDADO', 'PROPIO'), actor('DEMANDANTE', 'CONTRARIO'), actor('TESTIGO', 'PROPIO')],
    null
  ) === 'DEMANDADO',
  'el testigo es propio y no es representable, asi que no compite'
);
check(
  'penal: el imputado propio',
  posicionSegunElExpediente([actor('IMPUTADO', 'PROPIO'), actor('FISCAL', 'CONTRARIO')], null) === 'IMPUTADO'
);

/* ─── 3. LOS SILENCIOS, QUE SON LA MITAD DEL VALOR ───────────────────────── */

check(
  'DOS propios representables: se calla',
  posicionSegunElExpediente([actor('DEMANDANTE', 'PROPIO'), actor('DEMANDADO', 'PROPIO')], null) === null,
  'es el caso de quien registro a los dos sin tocar «De que lado», que nace en propio'
);
check(
  'ningún propio representable: se calla',
  posicionSegunElExpediente([actor('DEMANDANTE', 'CONTRARIO'), actor('JUEZ', 'NEUTRAL')], null) === null
);
check('sin actores: se calla', posicionSegunElExpediente([], 'cli-1') === null);
check(
  'DESCONOCIDO no se deduce nunca',
  posicionSegunElExpediente([actor('DESCONOCIDO', 'PROPIO')], null) === null,
  'es la opcion «prefiero no decirlo»; deducirla no dice nada'
);
check(
  'y un DESCONOCIDO propio no tapa al propio de verdad',
  posicionSegunElExpediente([actor('DESCONOCIDO', 'PROPIO'), actor('DEMANDADO', 'PROPIO')], null) === 'DEMANDADO',
  'contarlo dejaria dos y se callaria teniendo la respuesta delante'
);
check(
  'un expediente sin cliente cae a la regla del lado, no falla',
  posicionSegunElExpediente([actor('DEMANDANTE', 'PROPIO', 'cli-7')], null) === 'DEMANDANTE'
);

/* ─── 4. EL CASO QUE ORIGINA TODO, DE PUNTA A PUNTA ─────────────────────── */
/*
 * Restitución de inmueble: la firma representa al arrendatario demandado. El
 * expediente tiene al demandante, al demandado (que es el cliente) y a dos
 * testigos. Llega un auto que ordena subsanar AL DEMANDANTE.
 */
const CASO_REAL: ActorParaDeducir[] = [
  actor('DEMANDANTE', 'CONTRARIO'),
  actor('DEMANDADO', 'PROPIO', 'cli-mosquera'),
  actor('TESTIGO', 'PROPIO'),
  actor('TESTIGO', 'CONTRARIO')
];
check(
  'el caso real deduce DEMANDADO',
  posicionSegunElExpediente(CASO_REAL, 'cli-mosquera') === 'DEMANDADO',
  'con eso, el auto que manda subsanar al demandante sale marcado «no es suya»'
);

/* ─── 5. Y LA TUBERIA ESTA CONECTADA, NO SOLO ESCRITA ───────────────────── */
/*
 * Una funcion pura que nadie llama es un comentario largo, y esta casa ya
 * encontro ese defecto dos veces —`modulosSinGrupo` exportada y sin llamar,
 * `verificarVigencia` viviendo en una carpeta que no la importaba—. Se
 * asevera que la deduccion llega al detalle y que la revision guarda su caso.
 */
const raiz = join(process.cwd(), 'src/modules');
const leer = (r: string): string => readFileSync(join(raiz, r), 'utf8');

const servicio = leer('expedientes/expedientes.service.ts');
const almacen = leer('agent/review/documentReview.store.ts');
const controlador = leer('agent/review/documentReview.controller.ts');

check(
  'el detalle del expediente devuelve la posicion deducida',
  /posicionSugerida: posicionSegunElExpediente\(/.test(servicio),
  'sin esto la pantalla no tendria de donde prellenar'
);
check(
  'la revision GUARDA su expediente',
  /expediente_id: n\.expedienteId/.test(almacen),
  'era la columna que solo escribia «Traer al expediente», despues y a mano'
);
check(
  'y el controlador comprueba que el expediente sea de la firma',
  /esExpedienteDeLaFirma\(firmId, expedienteId\)/.test(controlador),
  'el id llega del cuerpo de la peticion: sin comprobarlo, una revision podria atarse al caso de otra firma'
);
check(
  'la comprobacion va ANTES de reservar saldo',
  controlador.indexOf('esExpedienteDeLaFirma(firmId, expedienteId)') <
    controlador.indexOf("reserveForOperation({ firmId, userEmail, operation: 'REVISION' })"),
  'comprobarlo al final seria descubrir el error con el informe escrito y pagado'
);

/* ─── 6. LA CADENA: DOCUMENTO → REVISION → TERMINO, SIN REPETIR EL CASO ─── */
/*
 * Un vencimiento pertenece a un caso por naturaleza, y el suyo salia sin
 * expediente: la columna existia y solo la escribia «Traer al expediente».
 * Peor: cuando el termino nace DESDE una revision ya atada, el caso es el
 * mismo y volver a preguntarlo es pedir un dato que la fila de origen trae.
 */
const agenda = leer('agenda/agenda.service.ts');

check(
  'el termino GUARDA su expediente',
  /expediente_id: expedienteId/.test(agenda)
);
check(
  'y el servicio comprueba que sea de la firma',
  /esExpedienteDeLaFirma\(input\.firmId, expedienteId\)/.test(agenda),
  'el id llega del cuerpo de la peticion'
);
check(
  'un expediente ajeno se RECHAZA, no se ignora',
  /EXPEDIENTE_NO_ENCONTRADO/.test(agenda),
  'aqui no hay nada pagado que perder, y guardarlo desatado en silencio dejaria al abogado creyendo que su caso lo vigila'
);
check(
  'la revision EXPONE su caso, para que el termino lo herede',
  /expedienteId: row\.expediente_id/.test(almacen)
);

const vista = readFileSync(
  join(process.cwd(), '../frontend/src/modules/workspace/components/RevisionesView.tsx'),
  'utf8'
);
check(
  '«Poner en la agenda» lo hereda de la revision',
  /expedienteId: r\.expedienteId/.test(vista),
  'sin esto la cadena se corta justo donde el dato ya estaba'
);

/* ─── 7. Y EL BORRADOR QUE NACE DE UNA REVISION ATADA ───────────────────── */
/*
 * «Llevar a Redaccion» guarda una COPIA del escrito como borrador de la
 * firma. Si la revision era de un caso, la copia es del mismo caso: nacer
 * suelta obliga a volver a jalarla desde Expedientes, que es el paso a mano
 * que toda esta cadena existe para quitar.
 */
const draftsSrv = leer('drafts/drafts.service.ts');
const draftsCtl = leer('drafts/drafts.controller.ts');
const front = (r: string): string => readFileSync(join(process.cwd(), '../frontend/src', r), 'utf8');

check('el borrador GUARDA su expediente', /expediente_id: draft\.expediente_id/.test(draftsSrv));
check(
  'y el controlador comprueba que sea de la firma',
  /esExpedienteDeLaFirma\(firmId, expedienteDelBorrador\)/.test(draftsCtl)
);
check(
  'el taller lleva el caso de la revision',
  /expedienteId: c\.expedienteId/.test(front('modules/workspace/components/RevisionesView.tsx'))
);
check(
  'y «Llevar a Redaccion» lo pasa al borrador',
  /expedienteId: datos\.expedienteId/.test(front('App.tsx')),
  'es donde se corta la herencia si alguien la olvida'
);
check(
  'el borrador recuerda su caso al volverse a abrir',
  /expedienteId: row\.expediente_id/.test(front('modules/documents/services/drafts.api.ts')),
  'sin esto, editarlo y guardarlo lo soltaria del expediente sin decir nada'
);

/* ─── 8. LAS DOS BARRAS DE REDACCION, NO UNA ────────────────────────────── */
/*
 * Escritorio y telefono son dos archivos que pintan la misma configuracion, y
 * no comparten gancho: lo unico que impide que se separen es tocarlas a la
 * vez. Si el selector de caso falta en una, quien redacte desde ahi guarda un
 * borrador suelto sin enterarse — y lo descubrira semanas despues, cuando el
 * expediente no lo cuente.
 */
for (const barra of ['WorkshopConfigBar.tsx', 'WorkshopConfigMobile.tsx']) {
  const codigo = front(`modules/workspace/components/${barra}`);
  check(
    `${barra} ofrece escoger el caso`,
    /expedienteId/.test(codigo) && /De qu[eé] caso/.test(codigo)
  );
}

check(
  'el borrador normal guarda el caso elegido en la barra',
  /expedienteId: expedienteDeRedaccion \|\| null/.test(front('App.tsx'))
);
check(
  'y al abrir un borrador, el caso vuelve a la barra',
  /setExpedienteDeRedaccion\(entry\.expedienteId/.test(front('App.tsx')),
  'sin esto, abrirlo y guardarlo lo ataria al caso que quedara elegido de antes'
);

/* ─── 9. LOS DOS ULTIMOS: TRANSCRITO Y ORIENTACION ──────────────────────── */
/*
 * Cierran la cadena. Las cinco columnas `expediente_id` existian desde la
 * migracion y ninguna se escribia fuera de «Traer al expediente».
 */
const transcritos = leer('transcription/transcriptionStore.service.ts');
const transCtl = leer('transcription/transcription.controller.ts');
const orientHist = leer('catalog/orientacionHistory.service.ts');
const triage = leer('catalog/triage.controller.ts');

check('el transcrito GUARDA su expediente', /fila\.expediente_id = expedienteId/.test(transcritos));
check(
  'y solo manda la llave cuando trae valor',
  /if \(expedienteId\) fila\.expediente_id/.test(transcritos),
  'mandarla en null rompe todo guardado entre el deploy y la migracion; ya paso con la autorizacion de grabacion'
);
check(
  'un expediente ajeno NO tumba el transcrito',
  /el transcrito se guarda sin atar/.test(transCtl),
  'llegados ahi el audio ya se transcribio: perder una audiencia de dos horas por una atadura invalida seria peor'
);
check('la orientacion GUARDA su expediente', /expediente_id: input\.expedienteId/.test(orientHist));
check(
  'y el triaje lo comprueba ANTES de consumir cupo',
  triage.indexOf('esExpedienteDeLaFirma(firmId, expedienteId)') < triage.indexOf('await consumirCupo(firmId)'),
  'descubrirlo al guardar seria descubrirlo con la orientacion ya pagada'
);

/* ─── 10. UN SOLO SELECTOR, NO SEIS ──────────────────────────────────────── */
/*
 * El control «De que caso es» se escribio a mano cuatro veces en dos dias y
 * hacian falta dos mas. Copiarlo es como se separan: la primera correccion se
 * hace en uno y los otros se quedan atras sin que nada falle.
 */
const DE_BLOQUE = [
  'modules/catalog/components/TriageView.tsx',
  'modules/catalog/components/TriageMobileView.tsx',
  'modules/transcription/components/SubirAudienciaDialog.tsx',
  'modules/workspace/components/RevisarEscritoDialog.tsx',
  'modules/agenda/components/AgendaForm.tsx'
];
for (const r of DE_BLOQUE) {
  check(`${r.split('/').pop()} usa el selector compartido`, /SelectorDeExpediente/.test(front(r)));
}

/*
 * LAS DOS BARRAS DE REDACCION NO CABEN EN EL BLOQUE —su control es un
 * `Combobox` horizontal con su busqueda y su pie— y aun asi comparten los
 * DATOS. Se parte por donde de verdad se comparte: el gancho.
 */
const DE_BARRA = [
  'modules/workspace/components/WorkshopConfigBar.tsx',
  'modules/workspace/components/WorkshopConfigMobile.tsx'
];
for (const r of DE_BARRA) {
  check(`${r.split('/').pop()} lee la lista del gancho compartido`, /useExpedientes\(\)/.test(front(r)));
}

/*
 * Y NADIE VUELVE A CARGARLA POR SU CUENTA. Es la copia que se separa: seis
 * llamadas iguales a `expedientesApi.listar()`, y la primera correccion —un
 * orden, un filtro por estado, un tope— se hace en una sola.
 */
const copiaronLaCarga = [...DE_BLOQUE, ...DE_BARRA].filter((r) =>
  /expedientesApi[\s\S]{0,40}\.listar\(\)/.test(front(r))
);
check(
  'ninguna pantalla carga la lista por su cuenta',
  copiaronLaCarga.length === 0,
  copiaronLaCarga.length > 0
    ? `LA COPIARON: ${copiaronLaCarga.map((r) => r.split('/').pop()).join(', ')}`
    : `${DE_BLOQUE.length + DE_BARRA.length} pantallas, una sola carga`
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — se deduce cuando se puede y se calla cuando no.');
}
