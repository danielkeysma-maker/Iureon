/**
 * Guards the review workshop conversation: the pure half.
 * Run with: npm run check:taller
 */
import {
  MAX_TURNOS_EN_CONTEXTO,
  buildTallerSystemPrompt,
  buildTallerUserPrompt,
  parsearRespuestaDelTaller,
  recortarHistorial,
  type TurnoDelTaller
} from '../taller';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const system = buildTallerSystemPrompt();
check('el sistema prohíbe citar providencias', /NO cit(?:es|as)/i.test(system) && /providencia|sentencia/i.test(system));
check('el sistema pide ediciones con cita literal y reemplazo', /"ediciones"/.test(system) && /LITERAL/.test(system));
check('el sistema contesta sobre el texto ACTUAL', /TEXTO ACTUAL/.test(system));
check('el sistema no reescribe el escrito entero por su cuenta', /no reescribes el escrito entero/i.test(system));

const informe = {
  resumen: 'Sólido en hechos, flojo en petición.',
  fortalezas: ['A'],
  debilidades: ['La petición no es concreta'],
  seccionesFaltantes: ['Juramento'],
  erroresDeAplicacion: [{ donde: 'Fundamentos', problema: 'Cita sin verificar', correccion: 'Suprimir' }],
  correccionesTextuales: [{ cita: 'solicito se ordene lo pertinente', problema: 'vaga', reemplazo: 'solicito ORDENAR…' }],
  recomendaciones: ['R']
};

const historial: TurnoDelTaller[] = Array.from({ length: 15 }, (_, k) => ({
  rol: k % 2 === 0 ? 'abogado' : 'revisor',
  texto: `turno ${k + 1}`,
  fecha: '2026-09-03T10:00:00Z'
}));

const prompt = buildTallerUserPrompt({
  documentType: 'Acción de tutela',
  guidance: 'ESTRUCTURA EXIGIDA: juramento [OBLIGATORIA]',
  informe,
  textoActual: 'HECHOS 1. El accionante… PRETENSIONES solicito ORDENAR a la EPS…',
  historial,
  mensaje: '¿Así queda bien la petición?'
});
check('el prompt lleva el texto actual completo', /solicito ORDENAR a la EPS/.test(prompt));
check('lleva el resumen del informe original, con los pasajes propuestos', /INFORME ORIGINAL/.test(prompt) && /solicito se ordene lo pertinente/.test(prompt));
check('lleva la ficha', /ESTRUCTURA EXIGIDA/.test(prompt));
check('lleva el mensaje del abogado', /¿Así queda bien la petición\?/.test(prompt));
check(`solo viajan los últimos ${MAX_TURNOS_EN_CONTEXTO} turnos y se declara la omisión`, /se omiten 3 turnos/.test(prompt) && !/turno 3\b/.test(prompt) && /turno 15/.test(prompt));
check('recortarHistorial conserva el orden y los más recientes', recortarHistorial(historial).map((t) => t.texto)[0] === 'turno 4');

const sinHistorial = buildTallerUserPrompt({ documentType: 'Demanda', guidance: null, informe: null, textoActual: 'x', historial: [], mensaje: 'hola' });
check('sin historial ni informe lo dice, no inventa', /primer mensaje/.test(sinHistorial) && /No hay informe previo/.test(sinHistorial) && /no hay ficha/.test(sinHistorial));

/* ─── LA RESPUESTA ──────────────────────────────────────────────────────────── */
const buena = parsearRespuestaDelTaller('```json\n{"respuesta":"Mejor así.\\nFalta el juramento.","ediciones":[{"cita":"solicito se ordene lo pertinente","reemplazo":"solicito ORDENAR a la EPS autorizar"},{"cita":"","reemplazo":"x"}]}\n```');
check('lee la respuesta y las ediciones completas', buena.respuesta.startsWith('Mejor así.') && buena.ediciones.length === 1 && buena.ediciones[0].reemplazo === 'solicito ORDENAR a la EPS autorizar');
check('una edición sin cita se descarta: no hay dónde aplicarla', buena.ediciones.every((e) => e.cita));

const prosa = parsearRespuestaDelTaller('Así queda bien, solo falta el juramento del artículo 37.');
check('prosa sin JSON se entrega tal cual, sin ediciones', prosa.respuesta.includes('falta el juramento') && prosa.ediciones.length === 0);

const vacia = parsearRespuestaDelTaller('{"respuesta":"","ediciones":[]}');
check('un JSON con respuesta vacía cae a la prosa cruda, nunca a nada', vacia.respuesta.length > 0);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
