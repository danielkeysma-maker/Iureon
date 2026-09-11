/**
 * GUARDA DE LA POSICIÓN PROCESAL DEL LECTOR.
 *
 * Run with: npm run check:posicion
 *
 * ─── EL CASO QUE OBLIGA A QUE ESTE ARCHIVO EXISTA ──────────────────────────
 *
 * Un auto inadmisorio ordena: «subsane el demandante dentro de los cinco (5)
 * días siguientes». El informe del documento recibido lo publicaba bajo el
 * rótulo «QUÉ LE EXIGE Y PARA CUÁNDO», en segunda persona, SIN SABER qué parte
 * es el lector. Al apoderado del demandado le decía que él debía subsanar en
 * cinco días; y al revés —un plazo suyo presentado como ajeno— es peor.
 *
 * Es el defecto característico de esta casa en sitio nuevo: PUBLICAR EL RELOJ
 * DE LA CONTRAPARTE. Exacto, citado, real, y dirigido a otra persona.
 *
 * ─── Y LA MITAD DEL VALOR DE ESTE CHECK SON LOS SILENCIOS ──────────────────
 *
 * Un comparador que dijera «no es suya» a todo cerraría el defecto y abriría
 * uno peor: el abogado que ignora un plazo que sí era suyo. Por eso la mayoría
 * de los casos de abajo comprueban que NO se afirma nada —documento que no
 * dice a quién, que nombra a los dos, reconvención, posición sin declarar—, y
 * por eso están los dos sentidos de cada acierto.
 */
import {
  PAPELES_REPRESENTABLES,
  aQuienLeToca,
  esPapelRepresentable,
  familiaDelPapel,
  familiasNombradas
} from '../posicionProcesal';
import { buildRecibidoSystemPrompt, parsearInformeRecibido } from '../documentReview';
import { PAPELES } from '../../../expedientes/types';
import type { PapelEnElExpediente } from '../../../expedientes/types';

const PROMPT_RECIBIDO = buildRecibidoSystemPrompt();

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

console.log('POSICIÓN PROCESAL — de quién es la carga que el documento impone');
console.log('');

/* ─── 1. EL CASO REAL, EN SUS DOS SENTIDOS ───────────────────────────────── */

const AUTO_INADMISORIO = 'el demandante';

check(
  'el auto ordena al demandante y lo lee el apoderado del DEMANDADO: no es suya',
  aQuienLeToca(AUTO_INADMISORIO, 'DEMANDADO') === 'DE_OTRO'
);
check(
  'el mismo auto leído por el apoderado del DEMANDANTE: sí es suya',
  aQuienLeToca(AUTO_INADMISORIO, 'DEMANDANTE') === 'SUYA'
);

/* ─── 2. LOS SILENCIOS, QUE SON LA MITAD DEL VALOR ───────────────────────── */

check('el documento no dice a quién: no se atribuye', aQuienLeToca('', 'DEMANDADO') === 'NO_SE_SABE');
check(
  'el documento nombra a las partes en bloque: no se atribuye',
  aQuienLeToca('las partes', 'DEMANDADO') === 'NO_SE_SABE'
);
check(
  'el documento nombra a los DOS bandos: no se atribuye',
  aQuienLeToca('el demandante y el demandado', 'DEMANDADO') === 'NO_SE_SABE'
);
check(
  'el abogado no declaró posición: no se atribuye aunque el documento sea clarísimo',
  aQuienLeToca('el demandante', 'DESCONOCIDO') === 'NO_SE_SABE'
);
check('sin papel alguno: no se atribuye', aQuienLeToca('el demandante', null) === 'NO_SE_SABE');
check(
  'la RECONVENCIÓN invierte los papeles, así que ahí se calla',
  aQuienLeToca('el demandante en reconvención', 'DEMANDADO') === 'NO_SE_SABE',
  'quien reconviene es demandado en la principal y demandante en la suya'
);

/* ─── 3. CADA PROCESO LLAMA DISTINTO A LA MISMA PARTE ────────────────────── */

check('ejecutivo: «el ejecutado» es la parte pasiva', aQuienLeToca('el ejecutado', 'DEMANDADO') === 'SUYA');
check('tutela: «el accionante» es la parte actora', aQuienLeToca('el accionante', 'DEMANDANTE') === 'SUYA');
check(
  'arbitraje: «la parte convocante» leída por el convocado',
  aQuienLeToca('la parte convocante', 'DEMANDADO') === 'DE_OTRO'
);
check(
  'la fórmula larga: «el apoderado de la parte demandada»',
  aQuienLeToca('el apoderado de la parte demandada', 'DEMANDANTE') === 'DE_OTRO'
);

/* ─── 4. LA TRAMPA DE LA FRONTERA DE PALABRA ─────────────────────────────── */
/*
 * «demandante» y «demandado» comparten las siete primeras letras. Sin `\b`
 * final, la señal de la parte actora encontraría también a la pasiva y toda
 * atribución quedaría ambigua — es decir, el módulo entero se volvería mudo
 * sin que ninguna prueba de las de arriba fallara.
 */
check(
  '«el demandante» activa SOLO la familia actora',
  JSON.stringify(familiasNombradas('el demandante')) === JSON.stringify(['ACTORA'])
);
check(
  '«el demandado» activa SOLO la familia pasiva',
  JSON.stringify(familiasNombradas('el demandado')) === JSON.stringify(['PASIVA'])
);
check('«la demanda» a secas no nombra a ningún bando', familiasNombradas('la demanda') .length === 0);

/* ─── 5. TILDES Y MAYÚSCULAS ─────────────────────────────────────────────── */

check(
  'un encabezado en mayúsculas con tilde: «LA VÍCTIMA»',
  aQuienLeToca('LA VÍCTIMA', 'VICTIMA') === 'SUYA'
);

/* ─── 6. PENAL: LA ETAPA CAMBIA, LA FAMILIA NO ───────────────────────────── */
/*
 * Indiciado, imputado, acusado, procesado y condenado son la MISMA persona en
 * cinco momentos. Un auto que nombra al «procesado» se dirige a quien el
 * expediente registró como imputado, y tratarlos como bandos distintos haría
 * que la app le dijera «esto no es suyo» a su propio defendido.
 */
check(
  'un auto sobre «el procesado» leído por quien representa al IMPUTADO: es suya',
  aQuienLeToca('el procesado', 'IMPUTADO') === 'SUYA'
);
check(
  'y la víctima no es la persona procesada',
  aQuienLeToca('el imputado', 'VICTIMA') === 'DE_OTRO'
);

/* ─── 7. INVARIANTES DE LA LISTA, NO CONTEOS ─────────────────────────────── */
/*
 * No se asevera «son nueve»: la lista puede crecer con razón y una cuenta
 * fija se rompería sin que nada estuviera mal. Se aseveran las propiedades
 * que sí tienen que seguir siendo ciertas.
 */

check(
  'ningún papel representable es un APODERADO',
  !PAPELES_REPRESENTABLES.some((p) => p.startsWith('APODERADO')),
  'se pregunta por el papel del CLIENTE; escoger «apoderado» diría que su cliente es el abogado ajeno'
);
check(
  'no se ofrece representar al estrado ni a la prueba',
  !PAPELES_REPRESENTABLES.some((p) =>
    (['JUEZ', 'SECRETARIO', 'TESTIGO', 'PERITO', 'INTERPRETE'] as PapelEnElExpediente[]).includes(p)
  )
);
check(
  'todo papel representable existe en el vocabulario del expediente',
  PAPELES_REPRESENTABLES.every((p) => (PAPELES as readonly string[]).includes(p)),
  'no se inventa una lista paralela: esa lección ya se pagó con expediente_actores'
);
check(
  'DESCONOCIDO se ofrece, y es el único sin familia',
  PAPELES_REPRESENTABLES.includes('DESCONOCIDO') &&
    PAPELES_REPRESENTABLES.filter((p) => familiaDelPapel(p) === null).length === 1
);
check(
  'la posicion NO se le manda al motor: la instruccion del recibido no la nombra',
  !/representa\s+a/i.test(PROMPT_RECIBIDO) && /PROHIBIDO que escribas si la carga es o no del abogado/.test(PROMPT_RECIBIDO),
  'diciendole a quien representa, el modelo filtra las cargas y esconde las de la otra parte'
);
check(
  'y la instruccion sigue pidiendo el destinatario de cada carga',
  /"aQuien"/.test(PROMPT_RECIBIDO) && /copia como nombra el documento/i.test(PROMPT_RECIBIDO.normalize('NFD').replace(/[̀-ͯ]/g,'')),
  'sin `aQuien` transcrito no hay nada que comparar y el aviso nunca aparece'
);
check(
  'esPapelRepresentable rechaza lo que no se puede representar',
  !esPapelRepresentable('JUEZ') && !esPapelRepresentable('APODERADO_DEMANDADO') && !esPapelRepresentable(42),
  'llega del cuerpo de una petición: si no se filtra aquí, entra cualquier cosa'
);
check('esPapelRepresentable acepta los de la lista', PAPELES_REPRESENTABLES.every((p) => esPapelRepresentable(p)));

/* ─── 8. EL MODELO NO PUEDE PONER EL VEREDICTO ──────────────────────────── */
/*
 * `deQuienEs` lo calcula el controlador. Si el parser lo leyera de la
 * respuesta, bastaria con que el modelo escribiera «SUYA» para saltarse la
 * comparacion entera — y lo haria con la mejor intencion, porque es el campo
 * que mas se parece a lo que le estan preguntando.
 */
const CRUDO_MALICIOSO = JSON.stringify({
  queEs: 'Auto inadmisorio',
  quienLoProfirio: 'Juzgado 3 Civil Municipal',
  radicado: '2026-00123',
  fecha: '10 de septiembre de 2026',
  decide: ['Inadmite la demanda'],
  cargas: [
    { carga: 'Subsanar la demanda', aQuien: 'el demandante', plazo: 'cinco (5) dias', cita: 'subsane dentro de los cinco (5) dias', deQuienEs: 'SUYA' }
  ],
  loQueSigue: [],
  noLoDiceElDocumento: [],
  porDondeSeAtaca: []
});

const leido = parsearInformeRecibido(CRUDO_MALICIOSO);

check('el informe se lee', leido !== null);
check(
  'el `aQuien` transcrito SI se conserva',
  leido?.cargas[0]?.aQuien === 'el demandante'
);
check(
  'pero el veredicto que mando el modelo se DESCARTA',
  leido?.cargas[0]?.deQuienEs === undefined,
  'si se leyera, el modelo podria declarar suya una carga ajena y saltarse la comparacion'
);
check(
  'y la posicion tampoco se lee de la respuesta del modelo',
  leido?.posicion === undefined,
  'la sella el controlador con lo que declaro el abogado, no con lo que diga el motor'
);
/* Y el veredicto que SI vale es el que sale de comparar, con ese mismo caso. */
check(
  'comparando de verdad, esa carga NO es del demandado',
  aQuienLeToca(leido?.cargas[0]?.aQuien ?? '', 'DEMANDADO') === 'DE_OTRO'
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — la posición procesal atribuye solo cuando puede, y calla cuando no.');
}
