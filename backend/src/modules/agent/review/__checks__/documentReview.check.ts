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
  CLASES_DE_ATAQUE,
  ETIQUETA_DOCUMENTO_RECIBIDO,
  MAX_CARACTERES_REVISION,
  PREGUNTA_POR_DEFECTO,
  PREGUNTA_POR_DEFECTO_RECIBIDO,
  buildRecibidoSystemPrompt,
  buildRecibidoUserPrompt,
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  esModoDeRevision,
  parsearInforme,
  parsearInformeRecibido,
  prepararTexto,
  repararJsonCortado
} from '../documentReview';
import { aRevisionGuardada } from '../documentReview.store';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── EL TEXTO SE NORMALIZA Y SE CORTA DONDE SE DICE ───────────────────────── */
const corto = prepararTexto('  HECHOS\n\n1.   El día   3 de marzo…  ');
check('el texto se normaliza en espacios y CONSERVA los saltos de párrafo', corto.texto === 'HECHOS\n\n1. El día 3 de marzo…', JSON.stringify(corto.texto));
check('los saltos de tres o más se limitan a dos y el retorno de carro se unifica', prepararTexto('A\r\n\r\n\r\n\r\nB\r\nC').texto === 'A\n\nB\nC');
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
check('el sistema pide citas textuales del escrito con su reemplazo', /correccionesTextuales/.test(system) && /textual|literal/i.test(system));
check('y pide brevedad, porque la salida tiene presupuesto fijo y un JSON cortado no sirve', /seis elementos|BREVE/i.test(system));

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

const conCitas = parsearInforme(JSON.stringify({
  resumen: 'Bien.',
  correccionesTextuales: [
    { cita: 'solicito se ordene lo pertinente', problema: 'La petición no es concreta.', reemplazo: 'solicito ORDENAR a la EPS autorizar el procedimiento dentro de las cuarenta y ocho (48) horas siguientes' },
    { cita: 5, problema: null }
  ]
}));
check('las citas textuales se leen con cita, problema y reemplazo', conCitas?.correccionesTextuales[0]?.reemplazo?.startsWith('solicito ORDENAR') === true);
check('una cita a medias se conserva con lo que tenga, sin reventar', conCitas?.correccionesTextuales.length === 2 && conCitas?.correccionesTextuales[1]?.cita === '5');

const parcial = parsearInforme('{"resumen":"Solo esto"}');
check('un JSON parcial rellena las listas vacías, no undefined', parcial !== null && Array.isArray(parcial.fortalezas) && parcial.fortalezas.length === 0 && Array.isArray(parcial.correccionesTextuales) && parcial.correccionesTextuales.length === 0);

/* ─── UN JSON CORTADO POR EL PRESUPUESTO SE REPARA, NO SE TIRA ─────────────── */
// Exactamente lo que devolvió el modelo al agotar 1.800 tokens: la cadena a medias.
const cortado = '{"resumen":"Escrito sólido en hechos.","fortalezas":["Hechos numerados","Petición clara"],"debilidades":["Falta el juramento","La subsidiariedad no se desarr';
const salvado = parsearInforme(cortado);
check('un JSON cortado a mitad de cadena se lee', salvado !== null, String(repararJsonCortado(cortado)));
check('conserva todo lo que estaba completo', salvado?.fortalezas.length === 2 && salvado?.debilidades[0] === 'Falta el juramento');
check('y descarta solo el elemento a medias', salvado?.debilidades.length === 1);

const cortadoEnClave = '{"resumen":"Bien.","fortalezas":["Una"],"debilidades":';
const salvado2 = parsearInforme(cortadoEnClave);
check('cortado justo tras una clave, la clave huérfana se descarta', salvado2 !== null && salvado2.fortalezas[0] === 'Una' && salvado2.debilidades.length === 0, String(repararJsonCortado(cortadoEnClave)));

const cortadoEnObjeto = '{"resumen":"Bien.","erroresDeAplicacion":[{"donde":"Fundamentos","problema":"Invoca el art. 86 sin';
const salvado3 = parsearInforme(cortadoEnObjeto);
check('cortado dentro de un objeto de la lista, se conserva lo que ese objeto ya tenía', salvado3 !== null && salvado3.erroresDeAplicacion[0]?.donde === 'Fundamentos', String(repararJsonCortado(cortadoEnObjeto)));

/* ─── LO QUE UN MODELO HACE MAL CON EL JSON, Y AUN ASI SE LEE ──────────────── */
// Saltos de linea crudos dentro de las cadenas (JSON invalido, muy comun).
const NL = String.fromCharCode(10);
const TAB = String.fromCharCode(9);
const conSaltos = '{"resumen":"Primera frase.' + NL + 'Segunda frase.","fortalezas":["Uno' + NL + TAB + 'dos"],"debilidades":[]}';
const leidoConSaltos = parsearInforme(conSaltos);
check('saltos de linea crudos dentro de una cadena no lo tumban', leidoConSaltos !== null && /Primera frase\. Segunda frase\./.test(leidoConSaltos.resumen), leidoConSaltos?.resumen);

// Texto antes y despues del objeto.
const conProsa = 'Claro, aqui esta el informe:' + NL + '{"resumen":"Bien.","fortalezas":["A"]}' + NL + 'Espero que sirva.';
check('prosa antes y despues del objeto se ignora', parsearInforme(conProsa)?.fortalezas[0] === 'A');

// Coma final antes de cerrar (JSON invalido, comun).
const comaFinal = '{"resumen":"Bien.","fortalezas":["A","B",],"debilidades":["C"],}';
check('una coma final antes del cierre se tolera', parsearInforme(comaFinal)?.debilidades[0] === 'C', String(parsearInforme(comaFinal)));

// Comillas tipograficas o dobles sin escapar dentro de una cadena: el JSON es
// irrecuperable como JSON, pero los campos se pueden extraer por patron.
const irrecuperable = '{"resumen":"El escrito cita la "sentencia" sin verificar.","fortalezas":["Hechos claros"],"debilidades":["Cita sin verificar"],"seccionesFaltantes":[],"erroresDeAplicacion":[{"donde":"Fundamentos","problema":"Cita una "sentencia"","correccion":"Suprimirla"}],"recomendaciones":["Verificar"]}';
const extraido = parsearInforme(irrecuperable);
check('si el JSON es irrecuperable, los campos se extraen por patron', extraido !== null && extraido.fortalezas[0] === 'Hechos claros' && extraido.recomendaciones[0] === 'Verificar', JSON.stringify(extraido));
check('y los errores de aplicacion conservan donde y correccion', extraido?.erroresDeAplicacion[0]?.donde === 'Fundamentos' && extraido?.erroresDeAplicacion[0]?.correccion === 'Suprimirla');

/* ─── LA FILA GUARDADA VUELVE ENTERA Y TOLERA NULOS ─────────────────────────── */
const fila = aRevisionGuardada({
  id: 'abc', document_type: 'Acción de tutela', legal_branch: null, file_name: 'tutela.pdf', cliente: 'Joel Ayús · EPS Sanitas', pregunta: '',
  caracteres: '4912', truncado: false, con_ficha: true, informe: { resumen: 'Bien.', fortalezas: ['A'] },
  informe_libre: null, cobrado_cop: '2000.00', user_email: 'a@b.co', created_at: '2026-09-02T20:00:00Z'
});
check('la fila guardada se lee con sus tipos', fila.caracteres === 4912 && fila.cobradoCop === 2000 && fila.conFicha === true && fila.legalBranch === null && fila.cliente === 'Joel Ayús · EPS Sanitas');
check('y el informe JSON vuelve como objeto', fila.informe?.resumen === 'Bien.');
const filaDeLista = aRevisionGuardada({ id: 'x', document_type: 'Demanda', file_name: 'd.docx', created_at: '2026-09-01T10:00:00Z' });
check('una fila de lista, sin cuerpos, no revienta', filaDeLista.informe === null && filaDeLista.informeLibre === null && filaDeLista.caracteres === 0 && filaDeLista.cliente === '' && filaDeLista.anotaciones.length === 0 && filaDeLista.conversacion.length === 0);
const filaConTaller = aRevisionGuardada({ id: 'y', document_type: 'Tutela', file_name: 't.pdf', created_at: '2026-09-03T10:00:00Z', anotaciones: [{ cita: 'solicito', color: 'amarillo' }], conversacion: [{ rol: 'abogado', texto: 'hola', fecha: 'x' }] });
check('las anotaciones y la conversacion vuelven como listas', filaConTaller.anotaciones[0]?.color === 'amarillo' && filaConTaller.conversacion.length === 1);

const basura = parsearInforme('El escrito está bien en general, pero…');
check('prosa sin JSON devuelve null (el controlador la entrega como texto libre)', basura === null);

const conBasuraDentro = parsearInforme('{"resumen": 5, "fortalezas": "una sola", "erroresDeAplicacion": [{"donde": 1}]}');
check('tipos equivocados se saneán a cadenas y listas', conBasuraDentro !== null && conBasuraDentro.resumen === '5' && conBasuraDentro.fortalezas.length === 1 && conBasuraDentro.erroresDeAplicacion[0]?.donde === '1');

/* ─── EL SEGUNDO MODO: UN DOCUMENTO QUE EL ABOGADO RECIBIÓ ──────────────────
 *
 * Lo que estas comprobaciones sostienen es la regla que hizo nacer el modo: sin
 * ficha del catálogo detrás, el informe SOLO puede afirmar lo que el documento
 * dice, citándolo, y un plazo que el documento no anuncia se queda vacío. Un
 * plazo rellenado de memoria es indistinguible de uno leído hasta que el
 * abogado lo pierde.
 */
check('el modo se reconoce y cualquier otra cosa se rechaza', esModoDeRevision('DOCUMENTO_RECIBIDO') && esModoDeRevision('ESCRITO_PROPIO') && !esModoDeRevision('RECIBIDO') && !esModoDeRevision(undefined));

const sistemaRecibido = buildRecibidoSystemPrompt();
check('el prompt del modo recibido PROHÍBE completar de memoria', /PROHIBIDO escribir de memoria/.test(sistemaRecibido));
check('y exige que el plazo esté citado o vacío', /EL PLAZO ES CITADO O ESTÁ VACÍO/.test(sistemaRecibido) && /cadena vacía/.test(sistemaRecibido));
check('y no le pide al modelo que aconseje qué actuación presentar', /NO ACONSEJES QUÉ ACTUACIÓN PRESENTAR/.test(sistemaRecibido));
check('y no habla de secciones que la norma exige, que es lo del escrito propio', !/seccionesFaltantes/.test(sistemaRecibido));

const usuarioRecibido = buildRecibidoUserPrompt({ pregunta: '', texto: 'AUTO. El juzgado ordena…', truncado: false });
check('sin pregunta va la del modo recibido, no la del propio', usuarioRecibido.includes(PREGUNTA_POR_DEFECTO_RECIBIDO) && !usuarioRecibido.includes(PREGUNTA_POR_DEFECTO));
check('el prompt del usuario NO nombra ninguna actuación ni ficha', !/ACTUACIÓN:/.test(usuarioRecibido) && /no hay ficha verificada: no la supongas/.test(usuarioRecibido));
check('el recorte se declara también aquí', buildRecibidoUserPrompt({ pregunta: '', texto: 'x', truncado: true }).includes('recortado'));

const recibido = parsearInformeRecibido(
  '{"queEs":"Auto que ordena subsanar la demanda.","quienLoProfirio":"Juzgado Tercero Civil Municipal de Sincelejo","radicado":"2026-00345","fecha":"3 de septiembre de 2026","decide":["Inadmite la demanda."],"cargas":[{"carga":"Subsanar la demanda.","plazo":"cinco (5) días","cita":"concédese el término de cinco (5) días para subsanar"}],"loQueSigue":["Vencido el término se resolverá sobre la admisión."],"noLoDiceElDocumento":["No indica desde cuándo se cuenta el término."]}'
);
check('el informe del documento recibido se lee entero', recibido?.queEs.startsWith('Auto') === true && recibido?.radicado === '2026-00345' && recibido?.decide.length === 1);
check('la carga trae su plazo y su cita textual', recibido?.cargas[0]?.plazo === 'cinco (5) días' && recibido?.cargas[0]?.cita.includes('cinco (5) días'));

/* EL CASO QUE MANDA: el documento no anuncia plazo. */
const sinPlazo = parsearInformeRecibido('{"queEs":"Oficio.","cargas":[{"carga":"Remitir copia del expediente.","cita":"sírvase remitir copia del expediente"}],"decide":["Requiere información."]}');
check('sin plazo en el documento el campo queda VACÍO, nunca relleno', sinPlazo?.cargas[0]?.plazo === '', JSON.stringify(sinPlazo?.cargas[0]));
check('y la carga y su cita sobreviven intactas', sinPlazo?.cargas[0]?.carga === 'Remitir copia del expediente.' && sinPlazo?.cargas[0]?.cita.startsWith('sírvase'));

check('un plazo nulo tampoco se convierte en texto', parsearInformeRecibido('{"queEs":"Auto.","cargas":[{"carga":"Comparecer.","plazo":null,"cita":"comparezca"}]}')?.cargas[0]?.plazo === '');
check('prosa sin JSON devuelve null y el controlador la entrega como texto libre', parsearInformeRecibido('El auto ordena subsanar.') === null);
check('un objeto vacío de contenido no pasa por informe', parsearInformeRecibido('{"queEs":"","decide":[],"cargas":[],"loQueSigue":[]}') === null);
check('un JSON cortado a la mitad se repara igual que en el modo propio', parsearInformeRecibido('{"queEs":"Auto que inadmite.","decide":["Inadmite la demanda."],"cargas":[{"carga":"Subsan') !== null);

/* La etiqueta con que se archiva es del producto, nunca un nombre jurídico. */
check('la etiqueta del modo recibido es neutra', ETIQUETA_DOCUMENTO_RECIBIDO === 'Documento recibido');
const filaRecibida = aRevisionGuardada({
  id: 'r1', document_type: ETIQUETA_DOCUMENTO_RECIBIDO, file_name: 'auto.pdf', created_at: '2026-09-09T10:00:00Z', con_ficha: false,
  informe: { queEs: 'Auto que inadmite.', decide: ['Inadmite.'], cargas: [], loQueSigue: [], noLoDiceElDocumento: [] }
});
check('la fila de un documento recibido se rotula por la FORMA de su informe', filaRecibida.modo === 'DOCUMENTO_RECIBIDO' && filaRecibida.informe === null && filaRecibida.informeRecibido?.queEs === 'Auto que inadmite.');
check('y sin ficha, porque no hubo ninguna', filaRecibida.conFicha === false);
const filaRecibidaDeLista = aRevisionGuardada({ id: 'r2', document_type: ETIQUETA_DOCUMENTO_RECIBIDO, file_name: 'auto.pdf', created_at: '2026-09-09T10:00:00Z' });
check('en la lista, que no trae informe, lo rotula la etiqueta', filaRecibidaDeLista.modo === 'DOCUMENTO_RECIBIDO');
check('una revisión de escrito propio sigue siendo del modo propio', fila.modo === 'ESCRITO_PROPIO' && fila.informeRecibido === null);
check('y una guardada antes de que el modo existiera también', filaDeLista.modo === 'ESCRITO_PROPIO');

/* ─── POR DÓNDE SE ATACA ────────────────────────────────────────────────────
 *
 * Entender el auto es la mitad; la otra es atacarlo. Y aquí, donde NO HAY FICHA
 * detrás de nada, el único anclaje posible es el propio documento. Lo que estas
 * comprobaciones fijan es exactamente eso: un punto de ataque sin cita del
 * documento se descarta, y el informe nunca afirma el contenido de una norma
 * que el documento no transcribe.
 */
check('el prompt exige que cada punto de ataque vaya anclado en una cita', /CADA PUNTO VA ANCLADO EN UNA CITA/.test(sistemaRecibido) && /NO ESCRIBAS EL PUNTO/.test(sistemaRecibido));
check('y prohíbe afirmar el contenido de una norma que el documento no transcribe', /PROHIBIDO afirmar el contenido de un artículo que el documento no transcribe/.test(sistemaRecibido));
check('y prohíbe concluir en derecho: nada de «es nulo», «es ilegal» ni «procede tal recurso»', /NO CONCLUYAS EN DERECHO/.test(sistemaRecibido) && /es nulo/.test(sistemaRecibido) && /procede tal recurso/.test(sistemaRecibido));
check('y separa la cita del documento de la lectura del revisor', /SEPARA LA CITA DE TU OPINIÓN/.test(sistemaRecibido) && /porDondeSeAtaca/.test(sistemaRecibido));
check('y admite que la sección vaya vacía si no hay flanco anclable', /«porDondeSeAtaca» va vacío/.test(sistemaRecibido));

const conAtaque = parsearInformeRecibido(
  '{"queEs":"Auto que inadmite la demanda.","decide":["Inadmite."],"cargas":[],"loQueSigue":[],"noLoDiceElDocumento":[],"porDondeSeAtaca":[' +
    '{"clase":"TENSION_CON_LA_NORMA","cita":"inadmítese la demanda por no aportarse el poder","norma":"artículo 90 del Código General del Proceso","citaDeLaNorma":"el juez señalará los defectos para que se subsanen en el término de cinco días","lectura":"El auto transcribe una norma que manda conceder término para subsanar y sin embargo no lo concede."},' +
    '{"clase":"NO_RESUELVE","cita":"no se hace pronunciamiento sobre lo demás","lectura":"La solicitud de medida cautelar quedó sin resolver."}' +
    ']}'
);
check('un punto de ataque se lee con su clase, su cita y su lectura', conAtaque?.porDondeSeAtaca.length === 2 && conAtaque?.porDondeSeAtaca[0]?.clase === 'TENSION_CON_LA_NORMA');
check('la cita del documento y la de la norma se conservan por separado de la opinión', conAtaque?.porDondeSeAtaca[0]?.cita.startsWith('inadmítese') === true && conAtaque?.porDondeSeAtaca[0]?.citaDeLaNorma.includes('cinco días') === true && conAtaque?.porDondeSeAtaca[0]?.lectura.startsWith('El auto transcribe') === true);
check('un punto que no se apoya en ninguna norma no necesita una: viaja con la norma vacía', conAtaque?.porDondeSeAtaca[1]?.norma === '' && conAtaque?.porDondeSeAtaca[1]?.citaDeLaNorma === '');

/* EL DESCARTE QUE MANDA: sin cita del documento no hay punto. */
const sinCita = parsearInformeRecibido(
  '{"queEs":"Auto.","porDondeSeAtaca":[{"clase":"NO_SE_SOSTIENE","cita":"","lectura":"El juez se equivocó al valorar la prueba."},{"clase":"SIN_APOYO_CITADO","cita":"se declara probada la excepción","lectura":"No dice de qué prueba lo deduce."}]}'
);
check('un punto de ataque SIN CITA del documento se descarta, no se pinta', sinCita?.porDondeSeAtaca.length === 1 && sinCita?.porDondeSeAtaca[0]?.clase === 'SIN_APOYO_CITADO', JSON.stringify(sinCita?.porDondeSeAtaca));

/* EL OTRO DESCARTE: una norma sin su texto no se nombra, y la tensión con ella desaparece. */
const normaSinTexto = parsearInformeRecibido(
  '{"queEs":"Auto.","porDondeSeAtaca":[{"clase":"TENSION_CON_LA_NORMA","cita":"con fundamento en el artículo 121","norma":"artículo 121 del Código General del Proceso","citaDeLaNorma":"","lectura":"Ese artículo exige que el término se cuente desde la notificación."}]}'
);
check('una tensión con una norma que el documento NO transcribe se descarta entera', normaSinTexto?.porDondeSeAtaca.length === 0, JSON.stringify(normaSinTexto?.porDondeSeAtaca));

const normaSoloNombrada = parsearInformeRecibido(
  '{"queEs":"Auto.","porDondeSeAtaca":[{"clase":"NO_SE_SOSTIENE","cita":"conforme al artículo 121 se rechaza","norma":"artículo 121 del Código General del Proceso","citaDeLaNorma":"","lectura":"El auto no dice qué ordena ese artículo."}]}'
);
check('y en cualquier otra clase la norma nombrada sin su texto se vacía: nunca se completa de memoria', normaSoloNombrada?.porDondeSeAtaca[0]?.norma === '' && normaSoloNombrada?.porDondeSeAtaca[0]?.cita.includes('artículo 121') === true);

const claseRara = parsearInformeRecibido('{"queEs":"Auto.","porDondeSeAtaca":[{"clase":"ES_NULO","cita":"se rechaza de plano","lectura":"No explica por qué."}]}');
check('una clase que no existe cae en la que menos afirma, no revienta ni inventa una', claseRara?.porDondeSeAtaca[0]?.clase === 'NO_SE_SOSTIENE');

const ataqueBasura = parsearInformeRecibido('{"queEs":"Auto.","porDondeSeAtaca":"no es una lista"}');
check('si la sección no viene como lista, queda vacía y el informe se lee igual', ataqueBasura?.porDondeSeAtaca.length === 0 && ataqueBasura?.queEs === 'Auto.');

check('un informe anterior a la sección se lee con la lista vacía, no undefined', Array.isArray(recibido?.porDondeSeAtaca) && recibido?.porDondeSeAtaca.length === 0);
check('la clase de ataque se declara entera y sin repetidos', CLASES_DE_ATAQUE.length === 4 && new Set(CLASES_DE_ATAQUE).size === 4);

/* Un informe que SOLO trae flancos sigue siendo un informe: se pagó por él. */
check('un informe cuyo único contenido son los puntos de ataque no se descarta', parsearInformeRecibido('{"queEs":"","decide":[],"cargas":[],"loQueSigue":[],"porDondeSeAtaca":[{"clase":"NO_RESUELVE","cita":"nada se dijo de la nulidad alegada","lectura":"Quedó sin resolver."}]}') !== null);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
