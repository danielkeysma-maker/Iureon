/**
 * Guards the quote marking in the review workshop. Run with: npm run check:marcas
 */
import { aplicarReemplazo, localizarCitas, marcasDeAnotaciones, reflujoDeSecciones, segmentar, segmentarCapas, capasTipograficas, esCapaTipografica } from '../services/marcas';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const texto =
  'PRETENSIONES. PRIMERA: solicito se ordene lo pertinente a la EPS.  SEGUNDA: que se “condene” en costas. HECHOS: el día 3 de marzo — a las 9:00 — radicó la petición.';

/* Una cita exacta se localiza en su sitio. */
const r1 = localizarCitas(texto, ['solicito se ordene lo pertinente']);
check('una cita exacta se localiza', r1.marcas.length === 1 && texto.slice(r1.marcas[0].inicio, r1.marcas[0].fin) === 'solicito se ordene lo pertinente');

/* Espacios dobles, comillas tipográficas y guiones distintos no impiden localizar. */
const r2 = localizarCitas(texto, ['SEGUNDA: que se "condene" en costas', 'el día 3 de marzo - a las 9:00 - radicó']);
check('tolera comillas rectas por tipográficas y guion corto por raya', r2.marcas.length === 2 && r2.noLocalizadas.length === 0, JSON.stringify(r2.noLocalizadas));
check('y la marca cae sobre el texto ORIGINAL, no sobre el canónico', texto.slice(r2.marcas[0].inicio, r2.marcas[0].fin) === 'SEGUNDA: que se “condene” en costas', texto.slice(r2.marcas[0].inicio, r2.marcas[0].fin));

/* Lo que no está, no se marca: ni parecido. */
const r3 = localizarCitas(texto, ['solicito se ordene lo procedente', 'xyz']);
check('una cita que no está se declara no localizada', r3.marcas.length === 0 && r3.noLocalizadas.length === 2);

/* Dos citas solapadas: la segunda no se marca encima de la primera. */
const r4 = localizarCitas(texto, ['solicito se ordene lo pertinente a la EPS', 'lo pertinente a la EPS']);
check('las citas solapadas no se pisan', r4.marcas.length === 1 && r4.noLocalizadas[0] === 1);

/* Segmentar reconstruye el texto completo. */
const seg = segmentar(texto, r2.marcas);
check('los segmentos reconstruyen el texto entero', seg.map((s) => s.texto).join('') === texto);
check('y llevan el índice de su cita', seg.filter((s) => s.marca !== null).map((s) => s.marca).join(',') === '0,1');

/* Aplicar reemplaza exactamente el pasaje, una vez. */
const nuevo = aplicarReemplazo(texto, 'solicito se ordene lo pertinente', 'solicito ORDENAR a la EPS autorizar el procedimiento');
check('el reemplazo sustituye el pasaje y conserva el resto', nuevo !== null && nuevo.startsWith('PRETENSIONES. PRIMERA: solicito ORDENAR a la EPS autorizar el procedimiento a la EPS.') && nuevo.includes('HECHOS: el día 3 de marzo'));
check('reemplazar una cita que no está devuelve null', aplicarReemplazo(texto, 'no existe en el texto', 'x') === null);

/* Texto multilínea del PDF con saltos: se localiza igual. */
const multi = 'HECHOS\n\nPRIMERO. El accionante\nsolicitó   la autorización\ndel procedimiento.';
const r5 = localizarCitas(multi, ['El accionante solicitó la autorización del procedimiento']);
check('una cita que en el texto cruza saltos de línea se localiza', r5.marcas.length === 1 && multi.slice(r5.marcas[0].inicio, r5.marcas[0].fin).startsWith('El accionante\nsolicitó'));

/* ─── Capas superpuestas ─────────────────────────────────────────────────────── */
const base = 'ABCDEFGHIJ';
const capas = segmentarCapas(base, [
  { indice: 0, inicio: 2, fin: 6, capa: 'cita' },
  { indice: 0, inicio: 4, fin: 8, capa: 'verde' }
]);
check('las capas reconstruyen el texto entero', capas.map((s) => s.texto).join('') === base);
check('el tramo compartido lleva las dos marcas', capas.find((s) => s.texto === 'EF')?.capas.map((c) => c.capa).join('+') === 'cita+verde');
check('los tramos exclusivos llevan solo la suya', capas.find((s) => s.texto === 'CD')?.capas.length === 1 && capas.find((s) => s.texto === 'GH')?.capas[0].capa === 'verde');
check('el texto llano no lleva capas', capas.find((s) => s.texto === 'AB')?.capas.length === 0 && capas.find((s) => s.texto === 'IJ')?.capas.length === 0);

const anot = marcasDeAnotaciones(texto, [{ cita: 'HECHOS: el día 3 de marzo', color: 'amarillo' }, { cita: 'no existe', color: 'rosa' }]);
check('las anotaciones se localizan con su color y las ausentes se omiten', anot.length === 1 && anot[0].capa === 'amarillo' && texto.slice(anot[0].inicio, anot[0].fin) === 'HECHOS: el día 3 de marzo');

{
  const doc = 'Señor\nJUEZ (REPARTO) — CON JURISDICCIÓN EN EL LUGAR\nE. S. D.\n\nHECHOS:\n1. El día 3 de marzo la EPS negó el servicio,\nPRETENSIONES\n**REFERENCIA:** ACCIÓN DE TUTELA';
  const capas = capasTipograficas(doc);
  const negritas = capas.filter((c) => c.capa === 'negrita').map((c) => doc.slice(c.inicio, c.fin));
  check('los títulos en mayúscula sostenida van en negrita y los párrafos no', negritas.includes('JUEZ (REPARTO) — CON JURISDICCIÓN EN EL LUGAR') && negritas.includes('HECHOS:') && negritas.includes('PRETENSIONES') && !negritas.some((n) => n.startsWith('1. El día')) && !negritas.includes('Señor'));
  check('las negritas de Markdown se pintan enteras y sus asteriscos quedan como marcador', negritas.includes('**REFERENCIA:**') && capas.filter((c) => c.capa === 'marcador').every((c) => doc.slice(c.inicio, c.fin) === '**'));
  check('«E. S. D.» no es título: no tiene una palabra de tres letras seguidas', !negritas.includes('E. S. D.'));
  check('las capas tipográficas se reconocen y las demás no', esCapaTipografica('negrita') && esCapaTipografica('marcador') && !esCapaTipografica('amarillo') && !esCapaTipografica('cita'));

  const escrito = [
    'ACCIONADO: JUZGADO TERCERO ADMINISTRATIVO ORAL DEL CIRCUITO DE SINCELEJO - SALA QUINTA DE DECISION DEL TRIBUNAL ADMINISTRATIVO DE SUCRE.',
    'Asunto: Solicitud de amparo con medida provisional',
    'ANIBAL G. DIAZ CONTRERAS, mayor de edad, actuando como apoderado del señor ALFONSO MONTERROZA AVILA, identificado con C.C. No. 6.815.567, ante la EPS presentó queja.',
    'PRIMERO. El día 3 de marzo se negó el servicio, según consta en el expediente.',
    '1. Hechos',
    'Que se ordene a la accionada, en el término de 48 horas, expedir la resolución.'
  ].join('\n');
  const capas2 = capasTipograficas(escrito).filter((c) => c.capa === 'negrita').map((c) => escrito.slice(c.inicio, c.fin));
  check('una línea larga de encabezado en mayúscula sostenida va entera en negrita', capas2.some((t) => t.startsWith('ACCIONADO: JUZGADO') && t.endsWith('DE SUCRE.')));
  check('la etiqueta inicial va en negrita aunque el resto no', capas2.includes('Asunto:') === false && capas2.includes('PRIMERO.') && capas2.some((t) => t === 'ANIBAL G. DIAZ CONTRERAS'));
  check('los nombres en mayúscula dentro del párrafo van en negrita; las siglas sueltas no', capas2.includes('ALFONSO MONTERROZA AVILA') && !capas2.includes('EPS') && !capas2.some((t) => /^C\.C\.$/.test(t)));
  check('un título numerado corto va en negrita y un párrafo numerado largo no', capas2.includes('1. Hechos') && !capas2.some((t) => t.startsWith('Que se ordene')));

  const plano =
    'Señor JUEZ DE TUTELA E. S. D. REFERENCIA: ACCIÓN DE TUTELA ACCIONANTE: ALFONSO MONTERROZA AVILA ACCIONADO: JUZGADO TERCERO ADMINISTRATIVO DE SINCELEJO ' +
    'ANIBAL G. DIAZ CONTRERAS, mayor de edad, identificado con C.C. No. 6.815.567 de Sincelejo, presento acción de tutela contra la sentencia del 15 de octubre de 2025 proferida por el Juzgado. ' +
    'HECHOS PRIMERO. El día 3 de marzo la EPS negó el servicio y el usuario radicó las pruebas del caso. SEGUNDO. La entidad no respondió en el término legal. ' +
    'PRETENSIONES PRIMERA: Que se tutele el derecho fundamental. FUNDAMENTOS DE DERECHO Artículo 86 de la Constitución. ANEXOS Copia de la historia clínica. NOTIFICACIONES Recibo en la carrera 20 número 22-30 de Sincelejo. '.repeat(2);
  const reflujo = reflujoDeSecciones(plano);
  check('un escrito sin saltos recupera párrafos ante encabezados y ordinales', /\n\nHECHOS\n+PRIMERO\./.test(reflujo) && /\n\nPRETENSIONES\n+PRIMERA:/.test(reflujo) && /\n\nANIBAL G\. DIAZ CONTRERAS, mayor/.test(reflujo) && /\n\nFUNDAMENTOS DE DERECHO/.test(reflujo) && /\n\nANEXOS/.test(reflujo) && /\n\nNOTIFICACIONES/.test(reflujo));
  check('el reflujo no toca un texto que ya tiene sus saltos', reflujoDeSecciones('HECHOS\n\n1. Uno.\n\n2. Dos.\n\nPRETENSIONES\n\nPRIMERA: x.') === 'HECHOS\n\n1. Uno.\n\n2. Dos.\n\nPRETENSIONES\n\nPRIMERA: x.');
  const negras = capasTipograficas(reflujo).filter((c) => c.capa === 'negrita').map((c) => reflujo.slice(c.inicio, c.fin));
  check('tras el reflujo, HECHOS, PRETENSIONES, FUNDAMENTOS DE DERECHO, ANEXOS y NOTIFICACIONES van en negrita', ['HECHOS', 'PRETENSIONES', 'FUNDAMENTOS DE DERECHO', 'ANEXOS', 'NOTIFICACIONES'].every((h) => negras.includes(h)));
  check('la cédula y la fecha en letras van en negrita', negras.some((t) => /^C\.C\. No\. 6\.815\.567$/.test(t)) && negras.includes('15 de octubre de 2025'));
  check('el reflujo conserva todas las palabras', reflujo.replace(/\s+/g, ' ') === plano.replace(/\s+/g, ' ').trim());

  const partido =
    'dentro del proceso ordinario. CRITERIOS ESPECIFICOS DE LA\nPROCEDENCIA\nDE LA ACCION DE TUTELA CONTRA PROVIDENCIAS JUDICIALES DEFECTO FACTICO: El defecto fáctico constituye una de las causales. PETICIONES PRIMERO: AMPARAR los derechos fundamentales del señor Alfonso. 1. El día 3 de marzo ocurrió el hecho. 2. El día 4 de marzo se notificó. ' + 'texto de relleno del escrito para que el bloque sea largo y casi sin saltos, como llega un PDF aplanado. '.repeat(30);
  const r2 = reflujoDeSecciones(partido);
  check('un título partido por salto de página se vuelve a unir y no se corta en «PROCEDENCIA»', /\n\nCRITERIOS ESPECIFICOS DE LA PROCEDENCIA DE LA ACCION DE TUTELA CONTRA PROVIDENCIAS JUDICIALES DEFECTO FACTICO:/.test(r2), JSON.stringify(r2.slice(0, 200)));
  check('los hechos numerados en cifras abren párrafo', /\n\n1\. El día 3 de marzo/.test(r2) && /\n\n2\. El día 4 de marzo/.test(r2));
  const negras2 = capasTipograficas(r2).filter((c) => c.capa === 'negrita').map((c) => r2.slice(c.inicio, c.fin));
  check('una palabra suelta en mayúscula como AMPARAR va en negrita', negras2.includes('AMPARAR'));
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
