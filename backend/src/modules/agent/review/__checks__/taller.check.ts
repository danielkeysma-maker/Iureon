/**
 * Guards the review workshop conversation: the pure half.
 * Run with: npm run check:taller
 */
import {
  MAX_TURNOS_EN_CONTEXTO,
  buildTallerSystemPrompt,
  buildTallerSystemPromptRecibido,
  buildTallerUserPrompt,
  parsearRespuestaDelTaller,
  recortarHistorial,
  type TurnoDelTaller
} from '../taller';
import { citasEnTexto, renderVerificaciones } from '../verificarProvidencias';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const system = buildTallerSystemPrompt();
check('el sistema prohíbe citar providencias', /NO cit(?:es|as)/i.test(system) && /providencia|sentencia/i.test(system));
check('el sistema pide ediciones con cita literal y reemplazo', /"ediciones"/.test(system) && /LITERAL/.test(system));
check('el sistema contesta sobre el texto ACTUAL', /TEXTO ACTUAL/.test(system));
check('el sistema pide referencias literales a los pasajes de los que habla', /"referencias"/.test(system) && /resalte/.test(system));
check('el sistema no reescribe el escrito entero por su cuenta', /no reescribes el escrito entero/i.test(system));
check('el sistema sabe leer las marcas de colores del abogado', /MARCAS DEL ABOGADO/.test(system) && /amarillo/i.test(system) && /tach/i.test(system));

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

const conMarcas = buildTallerUserPrompt({ documentType: 'Demanda', guidance: null, informe: null, textoActual: 'x', historial: [], mensaje: '¿qué opinas de lo amarillo?', anotaciones: [{ cita: 'solicito se ordene', color: 'amarillo' }, { cita: 'en costas', color: 'tachado' }, { cita: 'x', color: 'morado' }] });
const conComentario = buildTallerUserPrompt({ documentType: 'Demanda', guidance: null, informe: null, textoActual: 'x', historial: [], mensaje: 'mira mi comentario', anotaciones: [{ cita: 'según la sentencia T-760', color: 'comentario', nota: 'Te equivocaste: esa sentencia no dice eso.' }, { cita: 'otro', color: 'comentario', nota: '  ' }] });
check('los comentarios del abogado viajan con su pasaje y su nota; los vacíos se omiten', /COMENTARIOS DEL ABOGADO/.test(conComentario) && /Sobre «según la sentencia T-760»: Te equivocaste/.test(conComentario) && !/«otro»/.test(conComentario));
check('el sistema sabe qué hacer con un comentario que lo corrige', /COMENTARIOS DEL ABOGADO/.test(system) && /corrige/i.test(system));
check('las marcas del abogado viajan con su color y las de color desconocido se omiten', /AMARILLO: «solicito se ordene»/.test(conMarcas) && /TACHADO por el abogado: «en costas»/.test(conMarcas) && !/morado/i.test(conMarcas));

const sinHistorial = buildTallerUserPrompt({ documentType: 'Demanda', guidance: null, informe: null, textoActual: 'x', historial: [], mensaje: 'hola' });
check('sin historial ni informe lo dice, no inventa', /primer mensaje/.test(sinHistorial) && /No hay informe previo/.test(sinHistorial) && /no hay ficha/.test(sinHistorial));
check('sin marcas, lo dice', /no ha resaltado ni tachado/.test(sinHistorial));

/* ─── LA RESPUESTA ──────────────────────────────────────────────────────────── */
const buena = parsearRespuestaDelTaller('```json\n{"respuesta":"Mejor así.\\nFalta el juramento.","ediciones":[{"cita":"solicito se ordene lo pertinente","reemplazo":"solicito ORDENAR a la EPS autorizar"},{"cita":"","reemplazo":"x"}]}\n```');
check('lee la respuesta y las ediciones completas', buena.respuesta.startsWith('Mejor así.') && buena.ediciones.length === 1 && buena.ediciones[0].reemplazo === 'solicito ORDENAR a la EPS autorizar');
check('una edición sin cita se descarta: no hay dónde aplicarla', buena.ediciones.every((e) => e.cita));
const conRefs = parsearRespuestaDelTaller('{"respuesta":"El juramento está bien.","ediciones":[],"referencias":["bajo la gravedad del juramento manifiesto","x",1,"dos","tres","cuatro","cinco","seis","siete"]}');
check('las referencias se leen, se limpian las cortas y se limitan a seis', conRefs.referencias.length === 6 && conRefs.referencias[0] === 'bajo la gravedad del juramento manifiesto' && !conRefs.referencias.includes('x'));
check('sin referencias, lista vacía', parsearRespuestaDelTaller('{"respuesta":"Bien.","ediciones":[]}').referencias.length === 0);

const prosa = parsearRespuestaDelTaller('Así queda bien, solo falta el juramento del artículo 37.');
check('prosa sin JSON se entrega tal cual, sin ediciones', prosa.respuesta.includes('falta el juramento') && prosa.ediciones.length === 0);

const vacia = parsearRespuestaDelTaller('{"respuesta":"","ediciones":[]}');
check('un JSON con respuesta vacía cae a la prosa cruda, nunca a nada', vacia.respuesta.length > 0);

{
  const citas = citasEnTexto('Te equivocaste: la sentencia T-760 de 2008 sí existe, igual que la SU 075/18 y la C-355 del 2006; la t-760 de 2008 la repito. El auto A-123 de 2020 no cuenta.');
  check('las citas constitucionales del mensaje se extraen normalizadas, sin repetir y sin autos', JSON.stringify(citas) === JSON.stringify(['T-760/2008', 'SU-75/2018', 'C-355/2006']), JSON.stringify(citas));
  check('un mensaje sin citas no produce verificaciones ni bloque', citasEnTexto('¿cómo va la pretensión tercera?').length === 0 && renderVerificaciones([]) === '');
  const bloque = renderVerificaciones([
    { cita: 'T-760/2008', estado: 'EXISTE', detalle: 'Sentencia de tutela · 31 de julio de 2008', url: 'https://www.corteconstitucional.gov.co/relatoria/2008/T-760-08.htm', extracto: 'La Sala Segunda de Revisión...' },
    { cita: 'C-1/1999', estado: 'NO_ESTA_EN_EL_INDICE', detalle: 'el índice de la Corte no la tiene' },
    { cita: 'SU-2/2020', estado: 'NO_VERIFICABLE', detalle: 'no respondió' }
  ]);
  check('el bloque de verificación distingue existe, no está y no verificable, con fuente y extracto', /VERIFICACIÓN DE PROVIDENCIAS/.test(bloque) && /T-760\/2008: EXISTE/.test(bloque) && /relatoria\/2008/.test(bloque) && /Extracto oficial/.test(bloque) && /C-1\/1999: NO ESTÁ/.test(bloque) && /SU-2\/2020: NO SE PUDO VERIFICAR/.test(bloque));
  const conVerificacion = buildTallerUserPrompt({ documentType: 'Acción de tutela', guidance: null, informe: null, textoActual: 'x', historial: [], mensaje: 'mira', anotaciones: [], verificaciones: [{ cita: 'T-760/2008', estado: 'EXISTE', detalle: 'd', url: 'u' }] });
  const sinVerificacion = buildTallerUserPrompt({ documentType: 'Acción de tutela', guidance: null, informe: null, textoActual: 'x', historial: [], mensaje: 'mira', anotaciones: [] });
  check('la verificación entra al prompt solo cuando hubo citas', /VERIFICACIÓN DE PROVIDENCIAS/.test(conVerificacion) && !/VERIFICACIÓN DE PROVIDENCIAS/.test(sinVerificacion));
  check('el sistema sabe que la verificación manda sobre su memoria y qué decir en cada caso', /VERIFICACIÓN DE PROVIDENCIAS/.test(system) && /manda sobre tu memoria/.test(system) && /NO SE PUDO VERIFICAR/.test(system) && /Corte Suprema/.test(system));
}

{
  const cortado = '{"respuesta":"Le respondo en tres planos.\\n\\n1) HECHOS: aquí sí hay congruencia, y dijo \\"funcionario de hecho\\".\\n\\nDos desajustes reales:\\n- El cargo se constru';
  const r = parsearRespuestaDelTaller(cortado);
  check('un JSON cortado a mitad de la respuesta se rescata como prosa legible, sin barras ni comillas escapadas', r.respuesta.startsWith('Le respondo en tres planos.') && r.respuesta.includes('\n\n1) HECHOS') && r.respuesta.includes('"funcionario de hecho"') && !r.respuesta.includes('\\n') && r.ediciones.length === 0);
  const cortadoEnEdiciones = '{"respuesta":"Texto completo.","ediciones":[{"cita":"a","reempl';
  check('si el corte cae en las ediciones, la respuesta se conserva entera y las ediciones se pierden', parsearRespuestaDelTaller(cortadoEnEdiciones).respuesta === 'Texto completo.');
}

/*
 * ─── EL CHAT SOBRE UN DOCUMENTO RECIBIDO ────────────────────────────────────
 *
 * Un auto del juez YA ESTÁ PROFERIDO: no se corrige. El prompt del escrito
 * propio decía «acompañas al abogado mientras lo CORRIGE» y devolvía ediciones
 * con botón «Aplicar»; usado sobre una providencia ajena, proponía corregirla
 * —y cobraba—. Estos casos fijan que los dos modos no vuelvan a ser uno.
 */
{
  const recibido = buildTallerSystemPromptRecibido();
  check('el modo recibido dice que el documento no es del abogado y no se corrige', /NO ES SUYO/.test(recibido) && /no se corrige|NO SE PUEDE CORREGIR/i.test(recibido));
  check('y prohíbe proponer ediciones, con el campo siempre vacío', /"ediciones"\s*:\s*\[\]/.test(recibido) && /SIEMPRE vac[íi]o/i.test(recibido));
  check('no le pide al revisor corregir el escrito, como sí hace el otro modo', !/mientras lo corrige/i.test(recibido));
  check('ancla lo que afirme en el texto del propio documento', /EN EL TEXTO DEL DOCUMENTO/.test(recibido) && /lo citas/.test(recibido));
  check('prohíbe afirmar normas que el documento no transcriba y citar jurisprudencia de memoria', /no transcribe/i.test(recibido) && /de memoria/i.test(recibido));
  check('y prohíbe declarar que algo es ilegal o nulo: señala el flanco y concluye el abogado', /ilegal o nulo/i.test(recibido) && /concluye el abogado/i.test(recibido));
  check('un plazo que el documento no anuncia no se completa de memoria', /no anuncia/i.test(recibido));

  /*
   * EL PROMPT DE USUARIO NO PUEDE FINGIR UNA ACTUACIÓN NI UNA FICHA. Decía
   * «ACTUACIÓN: "Documento recibido"», que es la etiqueta del producto, no una
   * actuación del catálogo.
   */
  const base = {
    documentType: 'Documento recibido',
    guidance: null,
    informe: null,
    textoActual: 'AUTO. Se decreta la practica de pruebas.',
    historial: [] as TurnoDelTaller[],
    mensaje: '¿Qué me exige este auto?'
  };
  const uRecibido = buildTallerUserPrompt({ ...base, recibido: true });
  check('el prompt de usuario del modo recibido no anuncia una actuación', !/ACTUACIÓN: "/.test(uRecibido));
  check('ni anuncia una ficha verificada que no existe', /NO HAY FICHA/.test(uRecibido) && !/FICHA VERIFICADA DE LA ACTUACIÓN/.test(uRecibido));
  check('y llama al texto por lo que es, un documento recibido', /TEXTO DEL DOCUMENTO RECIBIDO/.test(uRecibido) && !/TEXTO ACTUAL DEL ESCRITO/.test(uRecibido));

  /*
   * Y NO PUEDE VIAJAR CIEGO. Se le pasaba `informe`, que en este modo es null,
   * así que el revisor entraba sin ver lo que él mismo había hallado.
   */
  const conInforme = buildTallerUserPrompt({
    ...base,
    recibido: true,
    informeRecibido: {
      queEs: 'Auto que decreta pruebas',
      quienLoProfirio: 'Juzgado Primero Civil del Circuito',
      radicado: '2026-00345',
      fecha: '3 de septiembre de 2026',
      decide: ['Decreta la práctica de interrogatorio'],
      cargas: [
        {
          carga: 'Aportar el dictamen',
          aQuien: 'la parte demandada',
          plazo: 'treinta (30) días',
          cita: 'por el término de treinta (30) días'
        }
      ],
      loQueSigue: ['Audiencia por fijar'],
      noLoDiceElDocumento: ['No dice desde cuándo corre el término'],
      porDondeSeAtaca: [
        { clase: 'NO_RESUELVE', cita: 'ABRIR PERIODO PROBATORIO', norma: '', citaDeLaNorma: '', lectura: 'No se pronuncia sobre el vencimiento del término que él mismo fijó' }
      ]
    }
  });
  check('el informe del documento recibido llega al chat, con sus cargas', /INFORME DEL DOCUMENTO RECIBIDO/.test(conInforme) && /Aportar el dictamen/.test(conInforme));
  check('y con el plazo que el documento anuncia, tal como lo anuncia', /treinta \(30\) días/.test(conInforme));
  check('y con los flancos que el informe halló', /No se pronuncia sobre el vencimiento/.test(conInforme));
  check('sin el informe, se dice que no lo hay en vez de callarlo', /No hay informe previo estructurado/.test(uRecibido));

  /* El modo propio no cambia: si lo hiciera, el arreglo habría roto lo que funcionaba. */
  const uPropio = buildTallerUserPrompt({ ...base, documentType: 'Recurso de reposición', guidance: 'FICHA' });
  check('el modo del escrito propio sigue anunciando su actuación y su texto actual', /ACTUACIÓN: "Recurso de reposición"/.test(uPropio) && /TEXTO ACTUAL DEL ESCRITO/.test(uPropio));
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
