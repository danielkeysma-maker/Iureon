/**
 * Guards the hearing-questions feature: the pure half.
 * Run with: npm run check:preguntas
 */
import {
  MAX_PREGUNTAS_POR_LISTA,
  MIN_PREGUNTAS_POR_LISTA,
  buildPreguntasSystemPrompt,
  buildPreguntasUserPrompt,
  normalizarParametros,
  parsearPreguntas,
  totalDePreguntas
} from '../preguntasAudiencia.prompt';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── El sistema ─────────────────────────────────────────────────────────── */
const system = buildPreguntasSystemPrompt();
check('el sistema describe las tres listas', /A LA CONTRAPARTE/.test(system) && /A MIS TESTIGOS/.test(system) && /TESTIGOS DE LA CONTRAPARTE/.test(system));
check('el sistema exige las tres claves del JSON', /"contraparte"/.test(system) && /"misTestigos"/.test(system) && /"testigosContraparte"/.test(system));
check('cada pregunta lleva paraQue y delEscrito literal', /"paraQue"/.test(system) && /"delEscrito"/.test(system) && /LITERAL/.test(system));
check('el sistema prohíbe citar normas y providencias', /NO cites normas/i.test(system) && /sentencias/.test(system));
check('el sistema no inventa hechos fuera del escrito', /NO afirmes hechos que el escrito no traiga/.test(system));
check('los testigos propios van con preguntas abiertas y no sugestivas', /NO sugestivas/.test(system));
check('el contrainterrogatorio va con preguntas cerradas', /cerradas/.test(system) && /sí o no/.test(system));
check(`pide entre ${MIN_PREGUNTAS_POR_LISTA} y ${MAX_PREGUNTAS_POR_LISTA} por lista`, system.includes(`Entre ${MIN_PREGUNTAS_POR_LISTA} y ${MAX_PREGUNTAS_POR_LISTA} preguntas por lista`));
check('trato de usted', /trato de usted/.test(system));
check('la actuación manda: la ficha dice qué se prueba y cómo se llaman las partes', /LA ACTUACIÓN MANDA/.test(system) && /accionante y accionado/.test(system) && /audiencia de ese proceso/.test(system));
check('el JSON abre con el enfoque de la actuación', /"enfoque": "…"/.test(system) && /"enfoque" va PRIMERO/.test(system));

/* ─── El prompt de usuario ───────────────────────────────────────────────── */
const prompt = buildPreguntasUserPrompt({
  documentType: 'Contestación de la demanda',
  legalBranch: 'CIVIL',
  guidance: 'ESTRUCTURA EXIGIDA: excepciones [OBLIGATORIA]',
  parametros: { posicion: 'Demandado', quiereProbar: 'Que el pago se hizo a tiempo', audiencia: 'Audiencia inicial' },
  texto: 'HECHOS 1. El demandado pagó el 3 de marzo. 2. El demandante recibió la consignación.',
  truncado: false
});
check('el prompt lleva la posición', /POSICIÓN DEL COLEGA EN EL PROCESO: Demandado\./.test(prompt));
check('el prompt lleva qué quiere probar', /QUÉ QUIERE PROBAR EN LA AUDIENCIA: Que el pago se hizo a tiempo/.test(prompt));
check('el prompt lleva el tipo de audiencia', /TIPO DE AUDIENCIA: Audiencia inicial/.test(prompt));
check('el prompt lleva el texto del escrito completo', /recibió la consignación/.test(prompt));
check('el prompt lleva la ficha como contexto, no para citarla', /ESTRUCTURA EXIGIDA/.test(prompt) && /no la cites/.test(prompt));
check('la ficha se presenta como la fuente de qué se prueba', /QUÉ se debe probar/.test(prompt));
check('el prompt lleva la rama', /RAMA: CIVIL/.test(prompt));
check('sin públicos elegidos pide las tres listas', /LISTAS QUE PIDE: a la contraparte \(interrogatorio de parte\), a mis testigos \(interrogatorio directo\), a los testigos de la contraparte \(contrainterrogatorio\)\./.test(prompt) && !/como \[\]/.test(prompt));
const soloContraparte = buildPreguntasUserPrompt({ documentType: 'Demanda', guidance: null, parametros: { posicion: 'Demandante', publicos: ['contraparte'] }, texto: 'y'.repeat(50), truncado: false });
check('con un solo público, pide esa lista y manda vaciar las otras dos', /LISTAS QUE PIDE: a la contraparte \(interrogatorio de parte\)\./.test(soloContraparte) && /Deja "misTestigos", "testigosContraparte" como \[\]/.test(soloContraparte));
const conPublicos = normalizarParametros({ posicion: 'Demandado', publicos: ['misTestigos', 'basura', 'misTestigos'] });
check('los públicos se filtran a las claves válidas', conPublicos.ok && JSON.stringify(conPublicos.parametros.publicos) === '["misTestigos"]');
const todos = normalizarParametros({ posicion: 'Demandado', publicos: ['contraparte', 'misTestigos', 'testigosContraparte'] });
check('pedir los tres equivale a no restringir', todos.ok && todos.parametros.publicos === undefined);

const sinOpcionales = buildPreguntasUserPrompt({ documentType: 'Demanda', guidance: null, parametros: { posicion: 'Ministerio Público' }, texto: 'x'.repeat(50), truncado: true });
check('sin qué probar ni audiencia, lo declara en vez de dejar huecos', /no indicó qué quiere probar/.test(sinOpcionales) && /no indicó el tipo de audiencia/.test(sinOpcionales));
check('la posición libre («Ministerio Público») viaja tal cual', /Ministerio Público/.test(sinOpcionales));
check('el recorte del texto se declara', /recortado por extensión/.test(sinOpcionales));
check('sin ficha, pide deducir el enfoque del escrito', /deduce del propio escrito/.test(sinOpcionales) && !/RAMA:/.test(sinOpcionales));

/* ─── El parser: entero ──────────────────────────────────────────────────── */
const entero = JSON.stringify({
  contraparte: [
    { pregunta: '¿Recibió usted la consignación del 3 de marzo?', paraQue: 'Fijar el pago', delEscrito: 'El demandante recibió la consignación' },
    { pregunta: '¿Firmó el recibo?', paraQue: 'Admisión' }
  ],
  misTestigos: [{ pregunta: '¿Qué vio ese día?', paraQue: 'Relato', delEscrito: '' }],
  testigosContraparte: [{ pregunta: '¿Usted trabaja para el demandante?', paraQue: 'Interés' }, { pregunta: '' }]
});
const p1 = parsearPreguntas('```json\n' + entero + '\n```');
check('lee el JSON entero aunque venga con cercas', p1.contraparte.length === 2 && p1.misTestigos.length === 1 && p1.testigosContraparte.length === 1);
check('conserva delEscrito cuando viene y lo omite cuando está vacío', p1.contraparte[0].delEscrito === 'El demandante recibió la consignación' && !('delEscrito' in p1.misTestigos[0]));
check('descarta una entrada sin pregunta', p1.testigosContraparte.every((q) => q.pregunta));

/* ─── El parser: cortado por el límite de tokens ─────────────────────────── */
const cortado = `{
  "contraparte": [
    {"pregunta": "¿Recibió usted la consignación del 3 de marzo?", "paraQue": "Fijar el pago", "delEscrito": "El demandante recibió la consignación"},
    {"pregunta": "¿Firmó el recibo con la leyenda \\"pago total\\"?", "paraQue": "Admisión {con llaves} en la cita"}
  ],
  "misTestigos": [
    {"pregunta": "¿Qué vio ese día?", "paraQue": "Relato"},
    {"pregunta": "¿Dónde estaba usted cuando se hizo el pa`;
const p2 = parsearPreguntas(cortado);
check('rescata las preguntas completas de un JSON cortado', p2.contraparte.length === 2 && p2.misTestigos.length === 1, JSON.stringify(p2));
check('el rescate respeta comillas escapadas y llaves dentro de cadenas', p2.contraparte[1].pregunta.includes('"pago total"') && p2.contraparte[1].paraQue.includes('{con llaves}'));
check('la pregunta cortada a medias se pierde, no se inventa', !p2.misTestigos.some((q) => q.pregunta.startsWith('¿Dónde estaba')));
check('la lista que nunca empezó queda vacía', p2.testigosContraparte.length === 0);

const basura = parsearPreguntas('No puedo ayudar con eso.');
check('una respuesta sin JSON devuelve las tres listas vacías, sin lanzar', totalDePreguntas(basura) === 0);

const exceso = JSON.stringify({ contraparte: Array.from({ length: 20 }, (_, i) => ({ pregunta: `P${i}`, paraQue: 'x' })), misTestigos: [], testigosContraparte: [] });
check(`recorta cada lista a ${MAX_PREGUNTAS_POR_LISTA}`, parsearPreguntas(exceso).contraparte.length === MAX_PREGUNTAS_POR_LISTA);

/* ─── Los parámetros ─────────────────────────────────────────────────────── */
const sinPosicion = normalizarParametros({ quiereProbar: 'algo' });
check('sin posición se rechaza con mensaje', !sinPosicion.ok && /posición/.test((sinPosicion as { message: string }).message));
const largo = normalizarParametros({ posicion: '  Demandante ', quiereProbar: 'a'.repeat(5000), audiencia: '' });
check('la posición se recorta y los opcionales vacíos no viajan', largo.ok && largo.parametros.posicion === 'Demandante' && largo.parametros.quiereProbar?.length === 1000 && !('audiencia' in largo.parametros));

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo en orden.');
process.exitCode = fallos ? 1 : 0;
