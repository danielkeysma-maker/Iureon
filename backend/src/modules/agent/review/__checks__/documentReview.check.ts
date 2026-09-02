/**
 * Guards the document review («Revisar un escrito»): the pure half.
 *
 * Run with: npm run check:revision
 *
 * A lawyer uploads a brief they already wrote and asks what is weak, what is
 * strong, what they applied wrongly. The model answers; this module decides
 * what the model is asked and how its answer is read. What has to hold:
 *
 *   · the objective part comes from the catalogue ficha, so the prompt must
 *     carry the guidance when there is one, and say so when there is not;
 *   · long documents are cut at a declared limit, and the cut is declared to
 *     the model and to the lawyer — a review of half a brief that pretends to
 *     be whole is worse than no review;
 *   · the answer is parsed defensively: fences, missing arrays, garbage.
 */
import {
  MAX_CARACTERES_REVISION,
  PREGUNTA_POR_DEFECTO,
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  parsearInforme,
  prepararTexto
} from '../documentReview';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── EL TEXTO SE NORMALIZA Y SE CORTA DONDE SE DICE ───────────────────────── */
const corto = prepararTexto('  HECHOS\n\n1.   El día   3 de marzo…  ');
check('el texto se normaliza en espacios', corto.texto === 'HECHOS 1. El día 3 de marzo…', corto.texto);
check('y no se marca truncado si cabe', corto.truncado === false && corto.caracteres === corto.texto.length);

const largo = prepararTexto('a'.repeat(MAX_CARACTERES_REVISION + 500));
check('un texto largo se corta al máximo declarado', largo.texto.length === MAX_CARACTERES_REVISION, String(largo.texto.length));
check('y se marca truncado con el tamaño original', largo.truncado === true && largo.caracteres === MAX_CARACTERES_REVISION + 500);

const vacio = prepararTexto('   ');
check('un texto vacío queda vacío, no revienta', vacio.texto === '' && vacio.caracteres === 0);

/* ─── EL PROMPT LLEVA LA FICHA, LA PREGUNTA Y EL TEXTO ─────────────────────── */
const guidance = 'ESTRUCTURA EXIGIDA POR LA NORMA:\n- Juramento de no haber presentado otra tutela [OBLIGATORIA]';
const conFicha = buildReviewUserPrompt({
  documentType: 'Acción de tutela',
  guidance,
  pregunta: '¿Qué apliqué mal?',
  texto: 'HECHOS 1. …',
  truncado: false
});
check('el prompt nombra la actuación', /Acción de tutela/.test(conFicha));
check('lleva la ficha verificada del catálogo', conFicha.includes(guidance));
check('lleva la pregunta del abogado', conFicha.includes('¿Qué apliqué mal?'));
check('lleva el texto del escrito', conFicha.includes('HECHOS 1. …'));
check('sin truncar, no habla de recorte', !/recort/i.test(conFicha));

const sinFicha = buildReviewUserPrompt({
  documentType: 'Escrito no catalogado',
  guidance: null,
  pregunta: '',
  texto: 'x',
  truncado: true
});
check('sin ficha, lo dice y no inventa estructura', /no está catalogada|sin ficha/i.test(sinFicha), sinFicha.slice(0, 200));
check('sin pregunta, usa la pregunta por defecto', sinFicha.includes(PREGUNTA_POR_DEFECTO));
check('truncado, se lo dice al modelo', /recortad/i.test(sinFicha));

const system = buildReviewSystemPrompt();
check('el sistema prohíbe citar providencias', /NO cites|no cites/i.test(system) && /providencia|sentencia/i.test(system));
check('el sistema separa lo objetivo (norma) de lo valorativo', /norma/i.test(system) && /criterio|valorativ/i.test(system));
check('el sistema pide JSON', /JSON/.test(system));

/* ─── LA RESPUESTA SE LEE A LA DEFENSIVA ───────────────────────────────────── */
const crudo = '```json\n' + JSON.stringify({
  resumen: 'Escrito sólido en hechos, flojo en petición.',
  fortalezas: ['Hechos numerados y cronológicos'],
  debilidades: ['La petición no es concreta'],
  seccionesFaltantes: ['Juramento de no haber presentado otra tutela'],
  erroresDeAplicacion: [{ donde: 'Fundamentos', problema: 'Invoca el art. 86 sin desarrollar la subsidiariedad', correccion: 'Explicar por qué no hay otro medio idóneo' }],
  recomendaciones: ['Redactar la petición como orden concreta al accionado']
}) + '\n```';
const informe = parsearInforme(crudo);
check('lee el JSON aunque venga con cerca de código', informe !== null && informe.resumen.startsWith('Escrito sólido'));
check('conserva las secciones faltantes', informe?.seccionesFaltantes[0] === 'Juramento de no haber presentado otra tutela');
check('conserva los errores de aplicación con sus tres campos', informe?.erroresDeAplicacion[0]?.correccion === 'Explicar por qué no hay otro medio idóneo');

const parcial = parsearInforme('{"resumen":"Solo esto"}');
check('un JSON parcial rellena las listas vacías, no undefined', parcial !== null && Array.isArray(parcial.fortalezas) && parcial.fortalezas.length === 0);

const basura = parsearInforme('El escrito está bien en general, pero…');
check('prosa sin JSON devuelve null (el controlador la entrega como texto libre)', basura === null);

const conBasuraDentro = parsearInforme('{"resumen": 5, "fortalezas": "una sola", "erroresDeAplicacion": [{"donde": 1}]}');
check('tipos equivocados se saneán a cadenas y listas', conBasuraDentro !== null && conBasuraDentro.resumen === '5' && conBasuraDentro.fortalezas.length === 1 && conBasuraDentro.erroresDeAplicacion[0]?.donde === '1');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
