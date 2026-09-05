/**
 * Guards the structure recognizer of the workshop. Run with: npm run check:estructura
 *
 * Fixtures are realistic Colombian briefs. The flattened ones are built from
 * their ideal lines joined with a single space, so each expectation is literally
 * "this line comes back on its own line".
 */
import { reconocerEstructura, reflujoDeSecciones } from '../services/estructuraDelEscrito';
import { capasTipograficas } from '../services/marcas';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const palabras = (t: string): string => t.replace(/\s+/g, ' ').trim();
const tieneLinea = (texto: string, linea: string): boolean => `\n${texto}\n`.includes(`\n${linea}\n`);
const lineasAusentes = (texto: string, lineas: string[]): string[] => lineas.filter((l) => !tieneLinea(texto, l));

/* ─── 1. Tutela aplanada: cero saltos ────────────────────────────────────────── */

const tutela = [
  'Señor',
  'JUEZ CIVIL MUNICIPAL DE SINCELEJO (REPARTO)',
  'E. S. D.',
  'REFERENCIA: ACCIÓN DE TUTELA',
  'ACCIONANTE: ALFONSO MONTERROZA AVILA',
  'ACCIONADO: NUEVA EPS S.A.',
  'DERECHOS INVOCADOS: SALUD, VIDA DIGNA Y SEGURIDAD SOCIAL',
  'ANIBAL G. DIAZ CONTRERAS, mayor de edad, identificado con la cédula de ciudadanía No. 6.815.567 de Sincelejo, abogado en ejercicio con tarjeta profesional No. 98.765 del Consejo Superior de la Judicatura, actuando como apoderado del señor ALFONSO MONTERROZA AVILA, respetuosamente acudo ante su despacho para interponer acción de tutela contra la entidad de la referencia, con fundamento en los siguientes hechos.',
  'HECHOS',
  'PRIMERO. El señor ALFONSO MONTERROZA AVILA se encuentra afiliado a la NUEVA EPS S.A. en el régimen contributivo desde el año 2015 y padece una enfermedad renal crónica diagnosticada por su médico tratante.',
  'SEGUNDO. El día 3 de marzo de 2026 el médico tratante ordenó un procedimiento de hemodiálisis y la entidad negó la autorización argumentando que no se encontraba incluido en el plan de beneficios.',
  'TERCERO. El día 10 de marzo de 2026 se radicó una petición ante la entidad y a la fecha no ha sido respondida en el término legal.',
  'PRETENSIONES',
  'PRIMERA: Que se tutelen los derechos fundamentales a la salud, a la vida digna y a la seguridad social del señor ALFONSO MONTERROZA AVILA.',
  'SEGUNDA: Que se ordene a la NUEVA EPS S.A. autorizar y practicar el procedimiento ordenado por el médico tratante en un término no superior a cuarenta y ocho horas.',
  'FUNDAMENTOS DE DERECHO',
  'El artículo 86 de la Constitución Política consagra la acción de tutela como mecanismo preferente y sumario para la protección de los derechos fundamentales. La ley estatutaria de salud reconoce la salud como derecho fundamental autónomo.',
  'PRUEBAS',
  'Solicito se tengan como pruebas los documentos que se relacionan en el acápite de anexos.',
  'ANEXOS',
  'Copia de la historia clínica del accionante. Copia de la orden médica del 3 de marzo de 2026. Copia de la petición radicada el 10 de marzo de 2026.',
  'NOTIFICACIONES',
  'El accionante las recibirá en la Carrera 20 No. 22-30 de Sincelejo.',
  'Correo electrónico: alfonso.monterroza@correo.com.',
  'El accionado en la Calle 25 No. 18-40 de Sincelejo.',
  'Atentamente,',
  'ANIBAL G. DIAZ CONTRERAS',
  'C.C. No. 6.815.567 de Sincelejo',
  'T.P. No. 98.765 del C. S. de la J.',
  'Correo: anibaldiaz@correo.com'
];
const tutelaPlana = tutela.join(' ');
const r1 = reconocerEstructura(tutelaPlana);

check('la tutela aplanada no tiene ningún salto de partida', !tutelaPlana.includes('\n'));
{
  const ausentes = lineasAusentes(r1.texto, tutela);
  check('cada línea de la anatomía vuelve a su propia línea', ausentes.length === 0, ausentes.join(' | '));
}
check('la firma no queda pegada al párrafo anterior', /\n\nAtentamente,\nANIBAL G\. DIAZ CONTRERAS\nC\.C\. No\./.test(r1.texto));
check('las notificaciones separan al accionante, su correo y al accionado', /NOTIFICACIONES\nEl accionante las recibirá[^\n]+\nCorreo electrónico: [^\n]+\n\nEl accionado en la Calle/.test(r1.texto));
check('el bloque de referencia va una etiqueta por línea', /\nREFERENCIA: ACCIÓN DE TUTELA\nACCIONANTE: ALFONSO MONTERROZA AVILA\nACCIONADO: NUEVA EPS S\.A\.\nDERECHOS INVOCADOS: SALUD, VIDA DIGNA Y SEGURIDAD SOCIAL\n/.test(r1.texto));
check('el destinatario baja la autoridad y E. S. D. a sus líneas', r1.texto.startsWith('Señor\nJUEZ CIVIL MUNICIPAL DE SINCELEJO (REPARTO)\nE. S. D.\n'));
check('la presentación abre párrafo tras el bloque de referencia', /SEGURIDAD SOCIAL\n\nANIBAL G\. DIAZ CONTRERAS, mayor de edad/.test(r1.texto));
check('los hechos y las pretensiones abren párrafo en cada ordinal', /HECHOS\nPRIMERO\. El señor/.test(r1.texto) && /\n\nSEGUNDO\. El día 3/.test(r1.texto) && /\n\nTERCERO\. El día 10/.test(r1.texto) && /PRETENSIONES\nPRIMERA: Que/.test(r1.texto) && /\n\nSEGUNDA: Que se ordene/.test(r1.texto));
check('la presentación no se parte en «C.C.» ni en «identificado»', /identificado con la cédula de ciudadanía No\. 6\.815\.567 de Sincelejo, abogado/.test(r1.texto));
check('la cédula dentro del hecho no abre línea', !/\nC\.C\. No\. 6\.815\.567 de Sincelejo, abogado/.test(r1.texto));
{
  const tipos = r1.secciones.map((s) => `${s.tipo}:${s.titulo}`);
  check(
    'las secciones se indexan en orden con su tipo',
    tipos.join('|') ===
      'destinatario:Señor|referencia:REFERENCIA: ACCIÓN DE TUTELA|presentacion:ANIBAL G. DIAZ CONTRERAS, mayor de edad, identificado con la cédula de ciudadanía No. 6.815.567 de Sincelejo, abogado en ejercicio con tarjeta profesional No. 98.765 del Consejo Superior de la Judicatura, actuando como apoderado del señor ALFONSO MONTERROZA AVILA, respetuosamente acudo ante su despacho para interponer acción de tutela contra la entidad de la referencia, con fundamento en los siguientes hechos.|seccion:HECHOS|seccion:PRETENSIONES|seccion:FUNDAMENTOS DE DERECHO|seccion:PRUEBAS|seccion:ANEXOS|notificaciones:NOTIFICACIONES|firma:Atentamente,',
    tipos.join('|')
  );
  const hechos = r1.secciones.find((s) => s.titulo === 'HECHOS');
  check('los desplazamientos de una sección recortan su texto', !!hechos && r1.texto.slice(hechos.inicio, hechos.fin).startsWith('HECHOS\nPRIMERO.') && r1.texto.slice(hechos.inicio, hechos.fin).trimEnd().endsWith('término legal.'));
  check('las secciones cubren el texto sin huecos ni solapes', r1.secciones.every((s, i) => (i === 0 ? s.inicio === 0 : s.inicio === r1.secciones[i - 1].fin)) && r1.secciones[r1.secciones.length - 1].fin === r1.texto.length);
}
{
  const negritas = capasTipograficas(r1.texto).filter((c) => c.capa === 'negrita').map((c) => r1.texto.slice(c.inicio, c.fin));
  check('los encabezados recuperados van en negrita con el mismo catálogo', ['HECHOS', 'PRETENSIONES', 'FUNDAMENTOS DE DERECHO', 'PRUEBAS', 'ANEXOS', 'NOTIFICACIONES', 'ACCIONANTE: ALFONSO MONTERROZA AVILA'].every((h) => negritas.includes(h)));
}

/* ─── 2. Texto con párrafos: título partido por salto de página y otro pegado ── */

const conParrafos = [
  'HECHOS',
  '',
  'PRIMERO. El accionante presentó demanda ordinaria laboral contra la empresa, que fue resuelta en primera instancia con sentencia desfavorable a sus intereses.',
  '',
  'SEGUNDO. La sala laboral confirmó la decisión sin pronunciarse sobre la prueba documental aportada oportunamente dentro del proceso ordinario. CRITERIOS ESPECÍFICOS DE LA',
  'PROCEDENCIA',
  'DE LA ACCIÓN DE TUTELA CONTRA PROVIDENCIAS JUDICIALES: El defecto fáctico se configura cuando el juez omite valorar una prueba determinante para la decisión. En este caso la sala no valoró el contrato aportado. FUNDAMENTOS DE',
  'DERECHO',
  '',
  'El artículo 86 de la Constitución Política y el decreto que reglamenta la acción de tutela.',
  '',
  'PRUEBAS',
  '',
  'Copia de la sentencia de segunda instancia.'
].join('\n');
const r2 = reflujoDeSecciones(conParrafos);

check('un título partido por salto de página se vuelve a unir en una sola línea', tieneLinea(r2, 'CRITERIOS ESPECÍFICOS DE LA PROCEDENCIA DE LA ACCIÓN DE TUTELA CONTRA PROVIDENCIAS JUDICIALES:'), JSON.stringify(r2.slice(0, 700)));
check('y no se corta en «PROCEDENCIA»', !tieneLinea(r2, 'PROCEDENCIA'));
check('el título largo con dos puntos deja el cuerpo en la línea siguiente', /JUDICIALES:\nEl defecto fáctico/.test(r2));
check('un encabezado pegado al final del párrafo y partido por la página queda solo en su línea', /contrato aportado\.\n\nFUNDAMENTOS DE DERECHO\n\nEl artículo 86/.test(r2));
check('los párrafos que ya estaban bien no se tocan', /HECHOS\n\nPRIMERO\. El accionante presentó[^\n]+intereses\.\n\nSEGUNDO\. La sala/.test(r2) && /\n\nPRUEBAS\n\nCopia de la sentencia/.test(r2));

/* ─── 3. Un texto ya bien estructurado sale idéntico ─────────────────────────── */

const bienEstructurado = [
  'Señores',
  'TRIBUNAL ADMINISTRATIVO DE SUCRE',
  'SALA DE DECISIÓN',
  'E. S. D.',
  '',
  'REFERENCIA: ACCIÓN DE TUTELA CONTRA PROVIDENCIA JUDICIAL',
  'ACCIONANTE: MARÍA FERNANDA RUIZ PÉREZ',
  'ACCIONADO: JUZGADO TERCERO ADMINISTRATIVO ORAL DEL CIRCUITO DE SINCELEJO',
  '',
  'MARÍA FERNANDA RUIZ PÉREZ, mayor de edad, identificada con la cédula de ciudadanía No. 1.102.811.692 de Sincelejo, actuando en nombre propio, presento acción de tutela contra el despacho de la referencia por la vulneración de mi derecho fundamental al debido proceso, con fundamento en lo siguiente.',
  '',
  'I. HECHOS',
  '',
  '1. El 15 de octubre de 2025 el juzgado accionado profirió sentencia dentro del proceso de nulidad y restablecimiento del derecho que promoví contra el municipio.',
  '',
  '2. La sentencia no se pronunció sobre la excepción de prescripción que propuse en la contestación, pese a que el art. 5 del decreto aplicable la ordena resolver de oficio.',
  '',
  'II. PRETENSIONES',
  '',
  'PRIMERA: Que se ampare mi derecho fundamental al debido proceso.',
  '',
  'SEGUNDA: Que se deje sin efectos la sentencia y se ordene al juzgado proferir una nueva decisión que resuelva todas las excepciones propuestas.',
  '',
  'III. FUNDAMENTOS DE DERECHO',
  '',
  'La acción de tutela contra providencias judiciales procede cuando se cumplen los requisitos generales y al menos uno de los defectos específicos desarrollados por la jurisprudencia constitucional. El defecto procedimental por exceso ritual manifiesto es uno de ellos.',
  '',
  'IV. NOTIFICACIONES',
  '',
  'La accionante las recibirá en la Calle 22 No. 19-15 de Sincelejo.',
  'Correo electrónico: mariafernanda.ruiz@correo.com',
  '',
  'Respetuosamente,',
  'MARÍA FERNANDA RUIZ PÉREZ',
  'C.C. No. 1.102.811.692 de Sincelejo'
].join('\n');
const r3 = reflujoDeSecciones(bienEstructurado);
check('un escrito ya bien estructurado sale idéntico', r3 === bienEstructurado, JSON.stringify(r3).slice(0, 600));
check('y aplicar el reflujo dos veces da lo mismo que una', reflujoDeSecciones(r1.texto) === r1.texto && reflujoDeSecciones(r2) === r2);
{
  const tipos = reconocerEstructura(bienEstructurado).secciones.map((s) => `${s.tipo}:${s.titulo}`);
  check(
    'la autoridad en varios renglones queda dentro del destinatario y los encabezados numerados se indexan',
    tipos.join('|') ===
      'destinatario:Señores|referencia:REFERENCIA: ACCIÓN DE TUTELA CONTRA PROVIDENCIA JUDICIAL|presentacion:' +
        bienEstructurado.split('\n')[9] +
        '|seccion:I. HECHOS|seccion:II. PRETENSIONES|seccion:III. FUNDAMENTOS DE DERECHO|notificaciones:IV. NOTIFICACIONES|firma:Respetuosamente,',
    tipos.join('|')
  );
}

/* ─── 4. Conservación de palabras en todos los fixtures ─────────────────────── */

const fixtures: [string, string][] = [
  ['tutela aplanada', tutelaPlana],
  ['texto con párrafos', conParrafos],
  ['bien estructurado', bienEstructurado]
];

/* ─── 5. Sin corte de encabezado dentro de una tirada en mayúscula ──────────── */

const tirada =
  'La jurisprudencia constitucional ha decantado los requisitos aplicables al caso. CRITERIOS ESPECÍFICOS DE LA PROCEDENCIA DE LA ACCIÓN DE TUTELA CONTRA PROVIDENCIAS JUDICIALES. El defecto fáctico constituye una de las causales específicas de procedibilidad. Se refiere a los REQUISITOS GENERALES DE PROCEDIBILIDAD DE LA ACCIÓN y a la LEGITIMACIÓN EN LA CAUSA POR ACTIVA del señor ALFONSO MONTERROZA AVILA. Solicito se decreten las PRUEBAS Y ANEXOS que relaciono. La ENTIDAD ACCIONADA no respondió. PETICIONES PRIMERO: AMPARAR los derechos fundamentales del señor Alfonso. SEGUNDO: ORDENAR a la accionada expedir la resolución.';
const r5 = reflujoDeSecciones(tirada);
fixtures.push(['tirada en mayúscula', tirada]);
check('un encabezado en medio de una tirada en mayúscula no se corta', tieneLinea(r5, 'CRITERIOS ESPECÍFICOS DE LA PROCEDENCIA DE LA ACCIÓN DE TUTELA CONTRA PROVIDENCIAS JUDICIALES.') && !tieneLinea(r5, 'PROCEDENCIA'), JSON.stringify(r5));
check('los títulos mencionados dentro de una oración en minúscula no abren línea', /Se refiere a los REQUISITOS GENERALES DE PROCEDIBILIDAD DE LA ACCIÓN y a la LEGITIMACIÓN EN LA CAUSA POR ACTIVA del señor/.test(r5) && /decreten las PRUEBAS Y ANEXOS que relaciono\. La ENTIDAD ACCIONADA no respondió\./.test(r5));
check('el encabezado seguido de su ordinal abre línea y el ordinal abre párrafo', /no respondió\.\n\nPETICIONES\nPRIMERO: AMPARAR/.test(r5) && /\n\nSEGUNDO: ORDENAR/.test(r5));
check('un nombre en mayúscula después de un ordinal no se toma por título', !/\n\nALFONSO MONTERROZA AVILA/.test(reflujoDeSecciones('Se probó lo siguiente. PRIMERO. ALFONSO MONTERROZA AVILA es afiliado a la entidad desde el año dos mil quince. SEGUNDO. La entidad negó el servicio.')));

/* ─── 6. Hechos numerados en cifras ─────────────────────────────────────────── */

const cifras =
  'Señor JUEZ PROMISCUO MUNICIPAL DE COROZAL E. S. D. REFERENCIA: ACCIÓN DE TUTELA ACCIONANTE: PEDRO PABLO MERCADO VERGARA ACCIONADO: ALCALDÍA MUNICIPAL DE COROZAL PEDRO PABLO MERCADO VERGARA, identificado con cédula de ciudadanía No. 92.500.123 de Corozal, obrando en nombre propio, presento acción de tutela por la violación del derecho fundamental de petición. HECHOS 1. El 2 de febrero de 2026 radiqué ante la alcaldía una petición solicitando copia del expediente del predio. 2. Han transcurrido más de treinta días sin respuesta, pese a que el art. 14 de la ley aplicable fija quince días. 3. El silencio de la administración me impide ejercer la defensa de mis derechos. 3.1 La copia es indispensable para el proceso de pertenencia. PRETENSIONES 1) Que se ampare mi derecho fundamental de petición. 2) Que se ordene a la alcaldía responder de fondo en cuarenta y ocho horas. ANEXOS a) Copia de la petición radicada. b) Copia de la cédula. NOTIFICACIONES Las recibiré en la Carrera 25 No. 30-12 de Corozal. Celular 3001234567. Correo pedromercado@correo.com. Del señor Juez, PEDRO PABLO MERCADO VERGARA C.C. No. 92.500.123 de Corozal';
const r6 = reflujoDeSecciones(cifras);
fixtures.push(['hechos en cifras', cifras]);
{
  const esperadas = [
    'HECHOS',
    '1. El 2 de febrero de 2026 radiqué ante la alcaldía una petición solicitando copia del expediente del predio.',
    '2. Han transcurrido más de treinta días sin respuesta, pese a que el art. 14 de la ley aplicable fija quince días.',
    '3. El silencio de la administración me impide ejercer la defensa de mis derechos.',
    '3.1 La copia es indispensable para el proceso de pertenencia.',
    'PRETENSIONES',
    '1) Que se ampare mi derecho fundamental de petición.',
    '2) Que se ordene a la alcaldía responder de fondo en cuarenta y ocho horas.',
    'ANEXOS',
    'a) Copia de la petición radicada.',
    'b) Copia de la cédula.',
    'NOTIFICACIONES',
    'Las recibiré en la Carrera 25 No. 30-12 de Corozal.',
    'Celular 3001234567.',
    'Correo pedromercado@correo.com.',
    'Del señor Juez,',
    'PEDRO PABLO MERCADO VERGARA',
    'C.C. No. 92.500.123 de Corozal'
  ];
  const ausentes = lineasAusentes(r6, esperadas);
  check('los hechos en cifras, los literales y la firma con «Del señor Juez» abren sus líneas', ausentes.length === 0, ausentes.join(' | ') || JSON.stringify(r6));
  check('«art. 14» no se toma por un hecho numerado', !/\n14 de la ley/.test(r6) && !/\n\n14\./.test(r6));
  check('el nombre del accionante que se presenta abre párrafo tras el bloque de referencia', /DE COROZAL\n\nPEDRO PABLO MERCADO VERGARA, identificado/.test(r6));
}

/* ─── 7. Casos sueltos que el taller encontró ───────────────────────────────── */

{
  const glosa = 'ASUNTO: SOLICITUD DE MEDIDA PROVISIONAL\nRADICADO: 2026-00123\n\nEl suscrito solicita la medida.';
  check('el valor de una etiqueta que empieza por un encabezado del catálogo no baja de línea', reflujoDeSecciones(glosa) === glosa, JSON.stringify(reflujoDeSecciones(glosa)));
  const versalita = 'Con fundamento en lo anterior formulo las siguientes Pretensiones: Primera. Que se ampare el derecho. Segunda. Que se ordene el pago.';
  const rv = reflujoDeSecciones(versalita);
  check('un encabezado en versalita a mitad de frase no abre línea, pero sus ítems sí', !/\nPretensiones:/.test(rv) && /\n\nSegunda\. Que se ordene/.test(rv), JSON.stringify(rv));
  const pie = 'La entidad negó el servicio sin motivación alguna. Página 3 de 12 El accionante insistió en la solicitud.';
  check('el pie de página queda en su línea y no se borra', tieneLinea(reflujoDeSecciones(pie), 'Página 3 de 12'));
  const menciones = 'El apoderado de la Señora MARÍA PÉREZ solicitó copias. Respetuosamente solicito se acceda. Honorables Magistrados, el caso es claro.';
  check('«Señora» y «Respetuosamente» dentro de una oración no abren línea', !reflujoDeSecciones(menciones).includes('\n'), JSON.stringify(reflujoDeSecciones(menciones)));
  fixtures.push(['pie de página', pie], ['menciones', menciones], ['versalita', versalita]);
}

for (const [nombre, entrada] of fixtures) {
  check(`el reflujo conserva todas las palabras: ${nombre}`, palabras(reflujoDeSecciones(entrada)) === palabras(entrada));
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
