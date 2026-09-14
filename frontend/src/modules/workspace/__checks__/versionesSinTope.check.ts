/**
 * Guards the workshop versions against a count cap coming back.
 *
 * Run with: npm run check:versiones-sin-tope
 *
 * ─── EL DEFECTO QUE VIGILA ─────────────────────────────────────────────────
 *
 * El taller conservaba las últimas quince versiones del texto y la decimosexta
 * borraba la primera sin avisar. El titular decidió el 14 de septiembre de
 * 2026 que ninguna versión se sobreescribe. Un `.slice(-N)` sobre la lista es
 * una línea fácil de volver a escribir «para que no crezca», y no falla nada:
 * la versión vieja simplemente deja de existir.
 *
 * Y LA PROMESA ESCRITA. La pantalla y el manual decían «se conservan las
 * últimas quince». Si el tope vuelve, la frase vuelve con él; si la frase
 * vuelve sin el tope, se le miente al abogado. Se vigilan las dos.
 *
 * La mitad del servidor la vigila `check:versiones-sin-tope` del backend.
 *
 * Se lee el código como TEXTO y sin comentarios: los comentarios que explican
 * por qué ya no hay tope nombran el tope.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const TALLER = sinComentarios(readFileSync(join(AQUI, '..', 'components', 'TallerDeEscrito.tsx'), 'utf8'));
const MANUAL = readFileSync(join(AQUI, '..', '..', 'help', 'content', 'manual.ts'), 'utf8');

/* ─── El tope ─────────────────────────────────────────────────────────────── */

const lineasDeVersiones = TALLER.split('\n').filter((l) => /setVersiones|versiones\s*[=:]/i.test(l));
const conCorte = lineasDeVersiones.filter((l) => /\.slice\(\s*-/.test(l));
check('ninguna lista de versiones del taller se corta con slice(-N)', conCorte.length === 0, conCorte.map((l) => l.trim()).join(' | '));
check('no existe una constante MAX_VERSIONES', !/MAX_VERSIONES/.test(TALLER));

/* ─── La promesa ──────────────────────────────────────────────────────────── */

const PROMESA_DE_CONTEO = /(últimas|ultimas)\s+(\{|\d+|quince|diez|veinte|treinta)/i;
check('la pantalla no promete conservar solo las últimas N', !PROMESA_DE_CONTEO.test(TALLER), TALLER.match(PROMESA_DE_CONTEO)?.[0] ?? '');
check('el manual no promete conservar solo las últimas N', !PROMESA_DE_CONTEO.test(MANUAL), MANUAL.match(PROMESA_DE_CONTEO)?.[0] ?? '');

/* ─── Sin tope, pero sin reenviar la lista entera en cada guardado ────────── */

check(
  'los guardados omiten las versiones cuando no cambiaron',
  /===\s*versionesGuardadas\.current/.test(TALLER),
  'sin esto, cada guardado de texto reenvía todas las versiones y choca con el límite de 4,5 MB'
);

if (fallos > 0) {
  console.log(`\n${fallos} comprobación(es) fallaron.`);
  process.exit(1);
}
console.log('\nLas versiones del taller no tienen tope.');
