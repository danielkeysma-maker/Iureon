/**
 * GUARDA DEL DETECTOR DE PLAZO ANUNCIADO.
 *
 * Run with: npm run check:plazo-anunciado
 *
 * ─── EL AGUJERO QUE ESTE DETECTOR TAPA ─────────────────────────────────────
 *
 * Orientación acepta adjuntar el documento que llegó, y NO LEE PLAZOS: entrega
 * actuaciones del catálogo con el término de la norma, y su instrucción le
 * prohíbe al modelo afirmar términos. Así que quien adjunta ahí un auto que
 * dice «subsane dentro de los cinco (5) días» se va con una lista correcta y
 * sin el número cinco. La otra puerta —Revisiones, «Un documento que recibí»—
 * sí lo lee, y desde fuera las dos se ven igual de razonables.
 *
 * ─── Y LA MITAD DEL VALOR DE ESTE ARCHIVO SON LAS FALSAS ALARMAS ───────────
 *
 * «El arrendatario lleva tres (3) meses sin pagar» es un HECHO con la misma
 * forma que un plazo: número y unidad de tiempo. Un detector que solo busque
 * eso salta en cada demanda de restitución del país, y un aviso que sale
 * siempre es papel tapiz — deja de leerse justo el día que importa.
 *
 * Por eso la mayoría de los casos de abajo son documentos que NO deben
 * disparar el aviso.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plazoAnunciado } from '../plazoAnunciado';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

console.log('PLAZO ANUNCIADO — cuándo mandar a leer el documento antes de orientar');
console.log('');

/* ─── 1. LOS QUE SÍ ANUNCIAN UN TÉRMINO ──────────────────────────────────── */

const CASOS_CON_PLAZO: [string, string][] = [
  ['auto inadmisorio', 'SE INADMITE la demanda. Subsane el demandante dentro de los cinco (5) días siguientes a la notificación de este auto, so pena de rechazo.'],
  ['auto admisorio', 'Notifíquese al demandado para que conteste en el término de veinte (20) días.'],
  ['sin cifra entre paréntesis', 'Se concede el término de diez días hábiles para descorrer el traslado.'],
  ['con adjetivo intercalado', 'Aporte el dictamen dentro del término improrrogable de cinco (5) días.'],
  ['traslado', 'Córrase traslado por el término de tres (3) días.'],
  ['requerimiento en meses', 'Deberá acreditar el pago dentro de los dos (2) meses siguientes.'],
  ['en horas', 'Rinda el informe dentro de las cuarenta y ocho horas siguientes.'],
  ['plazo y no término', 'Presente los documentos en un plazo de quince (15) días.']
];

for (const [nombre, texto] of CASOS_CON_PLAZO) {
  const cita = plazoAnunciado(texto);
  check(`SÍ avisa: ${nombre}`, cita !== null, cita ?? '(no detectó nada)');
}

/* ─── 2. LOS QUE NO, QUE ES LA MITAD QUE SOSTIENE EL AVISO ───────────────── */

const CASOS_SIN_PLAZO: [string, string][] = [
  [
    'mora del arrendatario: es un hecho, no un plazo',
    'El arrendatario lleva tres (3) meses sin pagar el canon y se niega a restituir el inmueble.'
  ],
  [
    'duración de una relación laboral',
    'Trabajó para la empresa durante cinco (5) años y ocho (8) meses sin que se le pagaran las prestaciones.'
  ],
  [
    'una ventana hacia el pasado no es un término',
    'El despido se produjo dentro de los seis (6) meses anteriores a la presentación de esta demanda.'
  ],
  [
    'una medida que no es de tiempo',
    'La servidumbre corre dentro de los linderos del predio, que mide cinco (5) metros de ancho.'
  ],
  [
    'hechos corrientes sin cifras de tiempo',
    'Mi representado celebró contrato de compraventa sobre el inmueble y pagó la totalidad del precio.'
  ],
  [
    'la duración de un contrato tiene la fórmula y no es un plazo',
    'El término de duración del contrato es de cinco (5) años, prorrogables por acuerdo de las partes.'
  ],
  ['texto vacío', ''],
  [
    'fecha, no plazo',
    'El contrato se firmó el 5 de septiembre de 2026 ante la Notaría Tercera del Círculo de Bogotá.'
  ]
];

for (const [nombre, texto] of CASOS_SIN_PLAZO) {
  const cita = plazoAnunciado(texto);
  check(`NO avisa: ${nombre}`, cita === null, cita ? `disparó con «${cita}»` : '');
}

/* ─── 3. LA CITA ES DEL DOCUMENTO, NO NUESTRA ────────────────────────────── */

const AUTO = 'SE INADMITE la demanda. Subsane el demandante dentro de los cinco (5) días siguientes, so pena de rechazo.';
const citaDelAuto = plazoAnunciado(AUTO) ?? '';

check(
  'la cita se copia del documento, con sus tildes',
  citaDelAuto.includes('días'),
  citaDelAuto
);
check('la cita empieza en la fórmula que la disparó', citaDelAuto.startsWith('dentro de los'), citaDelAuto);
check('la cita aparece LITERAL en el documento', AUTO.includes(citaDelAuto), citaDelAuto);
check(
  'la cita se corta en el punto y no arrastra la frase siguiente',
  !citaDelAuto.includes('SE INADMITE'),
  citaDelAuto
);

/* ─── 4. LA TRAMPA DE LAS TILDES DESCOMPUESTAS ───────────────────────────── */
/*
 * Un PDF puede entregar «días» como «di» + «a» + tilde combinante + «s». Si la
 * búsqueda se hace sin tildes sobre ese texto, la cadena se ACORTA y los
 * índices se corren una posición por cada tilde previa: la cita saldría
 * desplazada, cortando palabras por la mitad. No falla — se ve raro, que es la
 * peor forma de tener un defecto.
 */
const DESCOMPUESTO = AUTO.normalize('NFD');
const citaDescompuesta = plazoAnunciado(DESCOMPUESTO) ?? '';

check('detecta igual con el texto descompuesto', citaDescompuesta !== '', citaDescompuesta);
check(
  'y la cita sale alineada, no corrida',
  citaDescompuesta.normalize('NFC').startsWith('dentro de los cinco (5)'),
  citaDescompuesta.normalize('NFC')
);

/* ─── 5. GANA LA PRIMERA DEL DOCUMENTO, NO LA DE LA PRIMERA FÓRMULA ──────── */
/*
 * Las fórmulas se recorren en el orden de una lista, y el documento no las
 * trae en ese orden. Devolver la primera que acertara daría la cita de la
 * página nueve por delante de la del primer renglón: sale una cita real, y es
 * la equivocada. Aquí «en el término de» va antes en el texto y «dentro de
 * los» va antes en la lista.
 */
const DOS_PLAZOS =
  'Conteste en el término de veinte (20) días. Además, aporte el dictamen dentro de los treinta (30) días siguientes.';
const primera = plazoAnunciado(DOS_PLAZOS) ?? '';

check(
  'con dos plazos, gana el que aparece primero en el documento',
  primera.includes('veinte (20)') && !primera.includes('treinta (30)'),
  primera
);

/* ─── 7. LA CITA NO SE PARTE A MEDIA PALABRA ─────────────────────────────── */
/*
 * Es pequeño y es caro: la cita es lo único que sostiene el aviso, y una
 * cortada en seco —«a la notificación de este au»— se lee como que la
 * aplicación no entendió el documento. Lo destapó este mismo guarda.
 */
const SIN_PUNTO_CERCA =
  'Subsane la demanda dentro de los cinco (5) días siguientes a la notificación personal de este auto proferido por el juzgado';
const citaLarga = plazoAnunciado(SIN_PUNTO_CERCA) ?? '';

check(
  'la cita recortada termina en palabra completa',
  citaLarga.length > 0 && /[\wáéíóúñ)»]…?$/i.test(citaLarga),
  citaLarga
);
check(
  'y si se recortó, lo declara con puntos suspensivos',
  !citaLarga.endsWith('…') || SIN_PUNTO_CERCA.includes(citaLarga.slice(0, -1)),
  citaLarga
);
check(
  'nunca supera el tope de la cita',
  citaLarga.length <= 141,
  `${citaLarga.length} caracteres`
);

/* ─── 6. UN DOCUMENTO LARGO NO CAMBIA NADA ───────────────────────────────── */

const LARGO = `${'Hechos del caso, narrados con detalle. '.repeat(400)}Subsane dentro de los cinco (5) días.`;
check('lo encuentra también al final de un documento largo', plazoAnunciado(LARGO) !== null);

/* ─── 8. LAS DOS PANTALLAS DE ORIENTACION, NO UNA ───────────────────────── */
/*
 * Escritorio y telefono son dos archivos distintos que pintan lo mismo, y el
 * gancho compartido existe justamente porque se separan a la primera
 * correccion. El aviso es la parte que no puede faltar en ninguno: el abogado
 * que adjunta un auto desde el telefono pierde el plazo igual.
 */
/*
 * Se lee desde la raiz del proyecto y no con `import.meta.url`: el check se
 * empaqueta a `node_modules/.cache` antes de correr, asi que ahi las rutas
 * relativas apuntan al bundle y no al fuente.
 */
const fuente = (r: string): string => readFileSync(join(process.cwd(), 'src/modules/catalog', r), 'utf8');

for (const pantalla of ['TriageView.tsx', 'TriageMobileView.tsx']) {
  const codigo = fuente(`components/${pantalla}`);
  check(
    `${pantalla} monta el aviso de plazo`,
    /AvisoDePlazoEnElAdjunto/.test(codigo) && /adjunto\.plazo/.test(codigo)
  );
}

check(
  'el detector vive en el gancho compartido, no en cada pantalla',
  /plazoAnunciado/.test(fuente('hechosDesdeArchivo.ts')) &&
    !/plazoAnunciado\(/.test(fuente('components/TriageView.tsx')),
  'calcularlo en cada vista es como se separan el escritorio y el telefono'
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — el aviso de plazo salta con los términos y calla con los hechos.');
}
