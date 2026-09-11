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

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — se deduce cuando se puede y se calla cuando no.');
}
