/**
 * Guards the workshop versions against a count cap on the server.
 *
 * Run with: npm run check:versiones-sin-tope
 *
 * Los dos controladores que reciben `versiones` —el PATCH del borrador y el
 * autoguardado de la revisión— la cortaban con `.slice(-15)`. El navegador
 * podía conservarlas todas y aun así el servidor tiraba la más antigua al
 * guardar. El titular decidió el 14 de septiembre de 2026 que ninguna versión
 * se sobreescribe; este check falla si el corte vuelve a cualquiera de los dos.
 *
 * La mitad del navegador la vigila `check:versiones-sin-tope` del frontend.
 *
 * Solo lee código fuente: sin red y sin base de datos.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string => codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const BORRADORES = sinComentarios(readFileSync(join(__dirname, '..', '..', '..', 'drafts', 'drafts.controller.ts'), 'utf8'));
const REVISION = sinComentarios(readFileSync(join(__dirname, '..', 'documentReview.controller.ts'), 'utf8'));

const lineaDelBorrador = BORRADORES.split('\n').find((l) => /cambios\.versiones\s*=/.test(l)) ?? '';
check('el PATCH del borrador guarda versiones', lineaDelBorrador !== '');
check('el PATCH del borrador no corta las versiones', !/\.slice\(/.test(lineaDelBorrador), lineaDelBorrador.trim());

/* El bloque va de `const versiones =` al primer `: undefined;`: ahí se normaliza la lista. */
const inicio = REVISION.indexOf('const versiones =');
const bloque = inicio >= 0 ? REVISION.slice(inicio, REVISION.indexOf(': undefined;', inicio)) : '';
check('el autoguardado de la revisión normaliza versiones', bloque !== '');
check('el autoguardado de la revisión no corta la lista de versiones', !/\.slice\(\s*-/.test(bloque), bloque.match(/\.slice\(\s*-[^)]*\)/)?.[0] ?? '');

if (fallos > 0) {
  console.log(`\n${fallos} comprobación(es) fallaron.`);
  process.exit(1);
}
/* El ejecutor reconoce el veredicto por uno de sus tres banners; sin él marca el check ROTO. */
console.log('\nEl servidor guarda todas las versiones.\nALL CHECKS PASSED');
