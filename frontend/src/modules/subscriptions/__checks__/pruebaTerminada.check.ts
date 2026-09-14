/**
 * Guards the block screen of a free trial that ended unpaid.
 *
 * Run with: npm run check:prueba-terminada
 *
 * EL DEFECTO QUE VIGILA. La pantalla dice cuántos días duró la prueba, y el
 * frontend no importa del backend: el número es una COPIA. La maqueta ya lo
 * copió mal una vez —«Los 14 días se acabaron», el plazo del alta por operador—
 * y nada lanza error cuando una promesa comercial envejece. Aquí se lee la
 * fuente de verdad del backend como TEXTO y se compara.
 *
 * Y LA SALIDA QUE NO EXISTE. El titular decidió que la prueba terminada pierde
 * todo el acceso: no hay «exportar el trabajo». Si alguien vuelve a pintar ese
 * botón desde la maqueta, este check lo detiene.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODIGO_PRUEBA_TERMINADA, DIAS_DE_PRUEBA_GRATUITA } from '../pruebaTerminada';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* Se mira el código sin comentarios: el comentario que explica por qué no hay «exportar» contiene la palabra. */
const sinComentarios = (texto: string): string =>
  texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const REGLAS = readFileSync(join(BACKEND, 'modules', 'trial', 'trial.rules.ts'), 'utf8');
const diasDelBackend = Number(REGLAS.match(/DIAS_DE_PRUEBA_GRATUITA\s*=\s*(\d+)/)?.[1]);

check('el backend declara los días de la prueba', Number.isFinite(diasDelBackend), String(diasDelBackend));
check(
  'la pantalla usa los mismos días que trial.rules.ts',
  DIAS_DE_PRUEBA_GRATUITA === diasDelBackend,
  `frontend ${DIAS_DE_PRUEBA_GRATUITA} · backend ${diasDelBackend}`
);

const VISTA = sinComentarios(
  readFileSync(join(SRC, 'modules', 'subscriptions', 'components', 'PruebaTerminadaView.tsx'), 'utf8')
);
check('la pantalla toma los días de la constante', VISTA.includes('{DIAS_DE_PRUEBA_GRATUITA}'));
check('la pantalla no escribe un plazo a mano', !/\b(7|14)\s+días/.test(VISTA));
check('la pantalla no ofrece exportar el trabajo', !/export(ar|e)\b/i.test(VISTA.replace(/export const|export interface|import /g, '')));
check('la pantalla tiene un solo h1', (VISTA.match(/<h1\b/g) ?? []).length === 1);
check('los botones miden al menos 44 px', (VISTA.match(/<button\b[^>]*min-h-\[44px\]/g) ?? []).length === (VISTA.match(/<button\b/g) ?? []).length);
check('no inventa un 0 para lo que no se pudo contar', VISTA.includes('n === null'));

const HTTP = sinComentarios(readFileSync(join(SRC, 'config', 'httpClient.ts'), 'utf8'));
check('el cliente HTTP reconoce el código del servidor', HTTP.includes(`'${CODIGO_PRUEBA_TERMINADA}'`) && HTTP.includes('status === 403'));

const APP = sinComentarios(readFileSync(join(SRC, 'App.tsx'), 'utf8'));
check('la cáscara registra el aviso del 403', APP.includes('setPruebaTerminadaHandler('));
check(
  'la pantalla de bloqueo abre la compra de planes de siempre',
  /if \(pruebaTerminada\)[\s\S]{0,900}<PruebaTerminadaView[\s\S]{0,600}<FirmSubscriptionModal/.test(APP)
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} fallo(s).`);
  process.exit(1);
}
console.log('Todo en orden.');
