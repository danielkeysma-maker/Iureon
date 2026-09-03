/**
 * Guards the quote marking in the review workshop. Run with: npm run check:marcas
 */
import { aplicarReemplazo, localizarCitas, marcasDeAnotaciones, segmentar, segmentarCapas } from '../services/marcas';

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

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
