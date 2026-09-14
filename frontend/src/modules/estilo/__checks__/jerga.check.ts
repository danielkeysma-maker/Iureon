/**
 * «Jerga de su firma»: dónde se propone cambiar una palabra y dónde jamás.
 *
 * Run with: npm run check:jerga
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. CAMBIAR UNA PALABRA DENTRO DE LO QUE NO ES DEL ABOGADO. Una cita de
 *    jurisprudencia, la mención de un artículo, un texto entre comillas o un
 *    marcador entre corchetes se copian tal cual: «demanda» dentro de «el
 *    artículo 90 de la demanda» o de una transcripción entre «…» no es jerga,
 *    es la cita. Reemplazar ahí es falsear lo que se cita.
 * 2. LA PALABRA DENTRO DE OTRA. «auto» no es jerga dentro de «autoridad».
 * 3. EL REEMPLAZO QUE CAE EN OTRA APARICIÓN. Reemplazar «la primera que se
 *    encuentre» cambia la que el abogado no eligió; se reemplaza por POSICIÓN.
 * 4. «TODAS (N)» QUE NO SON N. El contador tiene que ser exactamente las
 *    posiciones que se van a cambiar.
 *
 * Puro: sin red, sin React.
 */
import {
  TEXTO_SELECCION_SIN_HALLAZGOS,
  TEXTO_SIN_GLOSARIO,
  TEXTO_SIN_HALLAZGOS,
  agruparHallazgos,
  buscarJerga,
  conLaFormaDe,
  filtrarPorSeleccion,
  plegar,
  reemplazarTodas,
  reemplazarUno,
  vistoEnEscritos,
  zonasProtegidas,
  type EntradaDeJerga
} from '../jerga';
import { aplicarReemplazoEnPosicion } from '../../workspace/services/marcas';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const GLOSARIO: EntradaDeJerga[] = [
  { preferido: 'libelo', variantes: ['demanda'], vistoEn: 4 },
  { preferido: 'auto admisorio', variantes: ['auto que admite'], vistoEn: 2 },
  { preferido: 'proveído', variantes: ['auto'], vistoEn: 1 },
  { preferido: 'apoderado', variantes: ['abogado'], vistoEn: 3 }
];

/* ─── 1. Plegado: sin tildes, mismo largo ───────────────────────────────── */

check('plegar quita tildes y pasa a minúscula sin cambiar el largo', plegar('ÁRBOL Ídem acción') === 'arbol idem accion' && plegar('ÁRBOL Ídem acción').length === 'ÁRBOL Ídem acción'.length);
check('la ñ no se pliega a n: «año» no es «ano»', plegar('Año') === 'año');

/* ─── 2. Palabra entera y tildes ────────────────────────────────────────── */

const t1 = 'La Demanda fue radicada. La autoridad revisó la demandante y el autoadmisorio.';
const h1 = buscarJerga(t1, GLOSARIO, []);
check(
  'encuentra «Demanda» con mayúscula y no «demandante» ni «autoridad» ni «autoadmisorio»',
  h1.length === 1 && t1.slice(h1[0].inicio, h1[0].fin) === 'Demanda',
  JSON.stringify(h1.map((h) => t1.slice(h.inicio, h.fin)))
);
const t2 = 'El abogado presentó el ABOGADO y el abógado.';
const h2 = buscarJerga(t2, GLOSARIO, []);
check('sin distinguir tildes ni mayúsculas: «abogado», «ABOGADO», «abógado»', h2.length === 3, String(h2.length));
const t3 = 'Se profirió auto que\n admite la demanda y otro auto.';
const h3 = buscarJerga(t3, GLOSARIO, []);
check(
  'la variante de varias palabras cruza saltos de línea y gana a la corta («auto» no se cuenta dentro de «auto que admite»)',
  h3.length === 3 &&
    h3[0].preferido === 'auto admisorio' &&
    t3.slice(h3[0].inicio, h3[0].fin) === 'auto que\n admite' &&
    h3.filter((h) => h.preferido === 'proveído').length === 1,
  JSON.stringify(h3.map((h) => [h.preferido, t3.slice(h.inicio, h.fin)]))
);

/* ─── 3. Nunca dentro de lo protegido ───────────────────────────────────── */

const protegido = [
  'PRIMERO. La demanda cumple.',
  'Según el artículo 82 de la demanda civil del C.G.P., y los arts. 90 y 91 demanda, se decide.',
  'El testigo dijo «presenté la demanda ayer» y luego "otra demanda más".',
  'Firma: [NOMBRE DE LA DEMANDA] del apoderado.',
  'La **demanda** en negrita.',
  'Sentencia T-406 de 1992 demanda. La Ley 1564 de 2012 regula la demanda.'
].join('\n');
const citas = ['Sentencia T-406 de 1992 demanda'];
const zonas = zonasProtegidas(protegido, citas);
const h4 = buscarJerga(protegido, GLOSARIO, citas);
const encontrados = h4.map((h) => protegido.slice(Math.max(0, h.inicio - 12), h.fin + 6));
const dentro = (pedazo: string): boolean => {
  const i = protegido.indexOf(pedazo);
  return h4.some((h) => h.inicio >= i && h.fin <= i + pedazo.length);
};
check('no dentro de la mención de un artículo («artículo 82 de la demanda civil del C.G.P.»)', !dentro('artículo 82 de la demanda civil'), encontrados.join(' | '));
check('no dentro de «arts. 90 y 91 demanda»', !dentro('arts. 90 y 91 demanda'));
check('no dentro de «…» ni de "…"', !dentro('«presenté la demanda ayer»') && !dentro('"otra demanda más"'));
check('no dentro de corchetes', !dentro('[NOMBRE DE LA DEMANDA]'));
check('no dentro de **negrita**', !dentro('**demanda**'));
check('no dentro de una cita de jurisprudencia del borrador', !dentro('Sentencia T-406 de 1992 demanda'));
check('no dentro de «Ley 1564 de 2012»… pero sí la demanda que sigue a la cita', dentro('regula la demanda'));
check(
  'fuera de lo protegido sí: «La demanda cumple.» y «regula la demanda»',
  h4.length === 2 && dentro('La demanda cumple') && dentro('regula la demanda'),
  encontrados.join(' | ')
);
check('las zonas traen su motivo', ['ARTICULO', 'COMILLAS', 'CORCHETES', 'NEGRITA', 'CITA'].every((m) => zonas.some((z) => z.motivo === m)), [...new Set(zonas.map((z) => z.motivo))].join(','));
check('una comilla que no cierra protege hasta el fin del párrafo', buscarJerga('Dijo «la demanda\nsigue la demanda.\n\nOtra demanda.', GLOSARIO, []).length === 1);

/* ─── 4. Muerde: sin zonas, la cita se tocaría ──────────────────────────── */

check('muerde: la misma frase sin comillas SÍ tiene hallazgo', buscarJerga('El testigo dijo presenté la demanda ayer.', GLOSARIO, []).length === 1);
check('muerde: sin la palabra «artículo» la demanda civil SÍ se encuentra', buscarJerga('Según el 82 de la demanda civil.', GLOSARIO, []).length === 1);

/* ─── 5. La forma del reemplazo ─────────────────────────────────────────── */

check('mayúscula inicial se conserva', conLaFormaDe('Demanda', 'libelo') === 'Libelo');
check('todo en mayúscula se conserva', conLaFormaDe('DEMANDA', 'libelo') === 'LIBELO');
check('minúscula queda como el glosario', conLaFormaDe('demanda', 'libelo') === 'libelo');

/* ─── 6. Por posición, y «Todas» son las posiciones ─────────────────────── */

const t6 = 'La demanda uno. La demanda dos. La demanda tres.';
const h6 = buscarJerga(t6, GLOSARIO, []);
const segunda = h6[1];
const r6 = reemplazarUno(t6, segunda);
check(
  'reemplazar la SEGUNDA cambia la segunda y deja intactas la primera y la tercera',
  r6 === 'La demanda uno. La libelo dos. La demanda tres.',
  String(r6)
);
check('muerde: reemplazar la primera coincidencia daría otro texto', r6 !== t6.replace('demanda', 'libelo'));
check('si el texto cambió bajo el hallazgo, no se reemplaza nada', reemplazarUno('La demandas uno. La demanda dos.', segunda) === null);
const grupos = agruparHallazgos(h6);
check('un grupo por variante con sus N posiciones', grupos.length === 1 && grupos[0].hallazgos.length === 3 && grupos[0].vistoEn === 4);
const todas = reemplazarTodas(t6, grupos[0].hallazgos);
check(
  '«Reemplazar todas (3)» cambia exactamente 3',
  todas !== null && todas.reemplazados === 3 && todas.texto === 'La libelo uno. La libelo dos. La libelo tres.',
  JSON.stringify(todas)
);
const mixto = 'La demanda. Dijo «la demanda». La demanda.';
const gm = agruparHallazgos(buscarJerga(mixto, GLOSARIO, []));
const tm = reemplazarTodas(mixto, gm[0].hallazgos);
check('«Todas» respeta lo protegido: 2 y no 3', gm[0].hallazgos.length === 2 && tm?.texto === 'La libelo. Dijo «la demanda». La libelo.', JSON.stringify(tm));
check('aplicarReemplazoEnPosicion exige que el texto esperado siga ahí', aplicarReemplazoEnPosicion('abc', 0, 1, 'a', 'X') === 'Xbc' && aplicarReemplazoEnPosicion('abc', 0, 1, 'b', 'X') === null);
check('el hallazgo trae su contexto sin asteriscos', h6[1].contexto.includes('demanda') && !h6[1].contexto.includes('**'));

/* ─── 7. Selección ──────────────────────────────────────────────────────── */

const t7 = 'El abogado radicó la demanda.\n\nOtro abogado más.';
const h7 = buscarJerga(t7, GLOSARIO, []);
const porRango = filtrarPorSeleccion(t7, h7, { inicio: 0, fin: 29 });
check('selección por rango: solo lo que cae dentro', porRango.length === 2 && porRango.every((h) => h.fin <= 29));
const porTexto = filtrarPorSeleccion(t7, h7, { texto: 'Otro abogado' });
check('selección por texto: el abogado del segundo párrafo, no el del primero', porTexto.length === 1 && porTexto[0].inicio > 29, JSON.stringify(porTexto));
/* En el papel la negrita se ve sin `**`: seleccionar «demanda y la demanda» cruza los asteriscos del texto. */
const tNegrita = 'La **demanda** y la demanda final.';
const conNegrita = filtrarPorSeleccion(tNegrita, buscarJerga(tNegrita, GLOSARIO, []), { texto: 'demanda y la demanda' });
check('la selección del papel sin asteriscos se ubica en el texto con asteriscos', conNegrita.length === 1 && conNegrita[0].inicio > tNegrita.indexOf('** y'));
check('selección sin nada del glosario: vacío', filtrarPorSeleccion(t7, h7, { texto: 'radicó la' }).length === 0);

/* ─── 8. Las frases ─────────────────────────────────────────────────────── */

check('visto en N escritos', vistoEnEscritos(1) === 'visto en 1 escrito de la firma' && vistoEnEscritos(4) === 'visto en 4 escritos de la firma');
check('sin glosario', TEXTO_SIN_GLOSARIO === 'Su firma aún no tiene glosario. Se forma al enseñar un formato desde un escrito terminado.');
check('sin hallazgos', TEXTO_SIN_HALLAZGOS === 'Este borrador ya usa la jerga de su firma.');
check('selección sin hallazgos', TEXTO_SELECCION_SIN_HALLAZGOS === 'Ninguna expresión de la selección está en el glosario de su firma.');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
