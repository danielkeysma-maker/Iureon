/**
 * Guards the word diff used to compare versions in the workshop. Run with: npm run check:diff
 */
import { diferencias, resumenDeCambios } from '../services/diff';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const antes = 'PRIMERA: solicito se ordene lo pertinente a la EPS. SEGUNDA: que se condene en costas.';
const despues = 'PRIMERA: solicito ORDENAR a la EPS autorizar el procedimiento. SEGUNDA: que se condene en costas.';
const { tramos, fino } = diferencias(antes, despues);
const reconstruyeAntes = tramos.filter((t) => t.tipo !== 'anadido').map((t) => t.texto).join('');
const reconstruyeDespues = tramos.filter((t) => t.tipo !== 'quitado').map((t) => t.texto).join('');
check('los tramos reconstruyen el texto anterior', reconstruyeAntes === antes);
check('y el texto nuevo', reconstruyeDespues === despues);
check('la comparación es por palabras', fino === true);
check('lo que no cambió queda como igual', tramos.some((t) => t.tipo === 'igual' && /SEGUNDA: que se condene en costas/.test(t.texto)));
check('lo quitado y lo añadido se distinguen', tramos.some((t) => t.tipo === 'quitado' && /pertinente/.test(t.texto)) && tramos.some((t) => t.tipo === 'anadido' && /ORDENAR/.test(t.texto)));

const r = resumenDeCambios(tramos);
check('el resumen cuenta palabras añadidas y quitadas', r.anadidas > 0 && r.quitadas > 0, JSON.stringify(r));

const igual = diferencias('a b c', 'a b c');
check('textos iguales dan un solo tramo igual', igual.tramos.length === 1 && igual.tramos[0].tipo === 'igual');

const vacioAntes = diferencias('', 'texto nuevo');
check('desde vacío todo es añadido', vacioAntes.tramos.every((t) => t.tipo === 'anadido'));

/* Un escrito largo cae a párrafos y lo dice, sin colgar. */
const parrafo = 'palabra '.repeat(4000).trim();
const largoA = Array.from({ length: 6 }, (_, k) => `${k} ${parrafo}`).join('\n\n');
const largoB = largoA.replace('3 palabra', '3 CAMBIO');
const t0 = Date.now();
const grueso = diferencias(largoA, largoB);
check('un escrito de 24.000 palabras se compara por párrafos', grueso.fino === false);
check('y termina rápido', Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
check('y detecta el párrafo cambiado', grueso.tramos.some((t) => t.tipo === 'anadido' && /3 CAMBIO/.test(t.texto)));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
