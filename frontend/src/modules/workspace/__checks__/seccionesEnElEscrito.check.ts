/**
 * Guarda la comprobación de «Secciones que pide la ficha» en la columna «Lo que
 * respalda este escrito».
 *
 * Run with: npm run check:secciones-escrito
 *
 * ─── EL DEFECTO QUE VIGILA ─────────────────────────────────────────────────
 *
 * El lienzo pintaba «Secciones exigidas N/M encontradas» con una búsqueda
 * escrita dentro del componente. La columna nueva dice CUÁL se encontró y salta
 * a su párrafo, así que ya no basta con contar: el índice del párrafo tiene que
 * ser el mismo que pinta el papel, o el salto lleva a otro sitio y el abogado
 * lee un párrafo que no es el que se le anunció.
 *
 * Lo que la búsqueda afirma es poco y así debe seguir: que el RÓTULO de la
 * sección aparece en el texto, sin tildes ni mayúsculas. No afirma que la
 * sección esté bien escrita; por eso la pantalla dice «encontrada» y no
 * «cumplida».
 */
import type { RequiredSection } from '../../catalog/types';
import { parrafosDelEscrito, seccionesEnElEscrito } from '../services/seccionesEnElEscrito';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const seccion = (n: number, name: string, mandatory = true): RequiredSection => ({ n, name, mandatory, basis: null });

const ESCRITO = [
  'Señor Juez 00 Civil Municipal',
  '**I. HECHOS**\nPrimero. Lo que pasó.',
  'II. Pretensiones\nQue se declare lo pedido.',
  'III. NOTIFICACIONES\nEn la dirección que consta.'
].join('\n\n');

{
  const r = seccionesEnElEscrito(ESCRITO, [seccion(1, 'Hechos'), seccion(2, 'Pretensiones'), seccion(3, 'Notificaciones')]);
  check('encuentra cada rótulo y dice en qué párrafo está', r.map((x) => x.parrafo).join(',') === '1,2,3', r.map((x) => x.parrafo).join(','));
  check('marca como encontradas las tres', r.every((x) => x.encontrada));
  check('conserva el orden de la ficha', r.map((x) => x.seccion.n).join(',') === '1,2,3');
}

{
  const r = seccionesEnElEscrito('FUNDAMENTOS DE DERECHO\n\nPETICIÓN', [seccion(1, 'Fundamentos de derecho'), seccion(2, 'Petición')]);
  check('ni las tildes ni las mayúsculas cuentan', r.every((x) => x.encontrada), r.map((x) => String(x.encontrada)).join(','));
}

{
  const r = seccionesEnElEscrito('Texto con **Pruebas** en negrita', [seccion(1, 'Pruebas')]);
  check('las marcas de negrita no esconden el rótulo', r[0].encontrada && r[0].parrafo === 0);
}

{
  const r = seccionesEnElEscrito(ESCRITO, [seccion(1, 'Juramento estimatorio')]);
  check('lo que no aparece queda sin encontrar y sin párrafo', !r[0].encontrada && r[0].parrafo === null);
}

{
  const r = seccionesEnElEscrito('', [seccion(1, 'Hechos')]);
  check('sin texto no se encuentra nada', !r[0].encontrada && r[0].parrafo === null);
  const vacio = seccionesEnElEscrito(ESCRITO, [seccion(1, '   ')]);
  check('un rótulo vacío no se da por encontrado', !vacio[0].encontrada);
}

{
  const r = seccionesEnElEscrito('Hechos del caso\n\nI. HECHOS', [seccion(1, 'Hechos')]);
  check('salta a la PRIMERA aparición', r[0].parrafo === 0);
}

{
  /* El papel parte el texto en párrafos por la línea en blanco; el salto usa el mismo corte. */
  check('los párrafos se cortan igual que en el papel', parrafosDelEscrito(ESCRITO).length === 4 && parrafosDelEscrito('').length === 1);
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
