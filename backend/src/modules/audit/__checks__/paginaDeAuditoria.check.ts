/**
 * Guarda la lectura por páginas de la auditoría de la firma.
 *
 * Run with: npm run check:auditoria-paginas
 *
 * ─── EL DEFECTO QUE CIERRA ─────────────────────────────────────────────────
 *
 * `GET /api/audit/logs` devolvía los CIEN eventos más recientes y nada más:
 * `limit(100)` fijo, sin rango ni total. Una firma con un año de trabajo tenía
 * miles de eventos y la pantalla mostraba cien, sin decir que había más; el CSV
 * «de la auditoría» salía con esos cien. Y un error de lectura devolvía `[]`,
 * que la pantalla pintaba como «todavía no hay eventos»: una auditoría que no
 * se pudo leer se presentaba como una firma que no ha hecho nada.
 *
 * Además PostgREST corta cualquier `select` en 1.000 filas sin avisar (ver
 * `config/leerTodasLasFilas.ts`), así que subir el límite no arreglaba nada:
 * pasadas las mil, la lista se acababa en silencio.
 *
 * ─── QUÉ SE COMPRUEBA ──────────────────────────────────────────────────────
 *
 *  1. La lectura del pedido (puro): desde, límite con techo en el máximo que
 *     sirve PostgREST, inicio del periodo solo si es una fecha real.
 *  2. El rango y la pregunta «¿hay más?» (puro), también en la frontera de mil.
 *  3. El servicio y el controlador, leídos como TEXTO: que la página use
 *     `range` con total exacto y desempate por `id`, y que un error se lance
 *     en vez de volverse lista vacía. No se importa el servicio: importarlo
 *     arrastra el cliente de Supabase, y este check no toca la base.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { FILAS_POR_PARTE } from '../../../config/leerTodasLasFilas';
import {
  LIMITE_PREDETERMINADO,
  hayMasEventos,
  leerPedidoDePagina,
  rangoDeLaPagina
} from '../paginaDeAuditoria';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. EL PEDIDO ──────────────────────────────────────────────────────── */
const vacio = leerPedidoDePagina({});
check('sin parámetros: desde 0, límite predeterminado, sin periodo', vacio.desde === 0 && vacio.limite === LIMITE_PREDETERMINADO && vacio.inicio === null, JSON.stringify(vacio));
check('el límite predeterminado cabe en una parte de PostgREST', LIMITE_PREDETERMINADO > 0 && LIMITE_PREDETERMINADO <= FILAS_POR_PARTE);

const enorme = leerPedidoDePagina({ limite: '50000' });
check('un límite mayor que el que sirve PostgREST se recorta a ese máximo', enorme.limite === FILAS_POR_PARTE, String(enorme.limite));

const basura = leerPedidoDePagina({ desde: '-40', limite: 'abc', inicio: 'ayer' });
check('desde negativo o ilegible vuelve a 0', basura.desde === 0, String(basura.desde));
check('un límite ilegible usa el predeterminado', basura.limite === LIMITE_PREDETERMINADO, String(basura.limite));
check('un inicio que no es fecha no filtra nada', basura.inicio === null, String(basura.inicio));

const cero = leerPedidoDePagina({ limite: '0' });
check('un límite de cero no pide una página vacía', cero.limite >= 1, String(cero.limite));

const fraccion = leerPedidoDePagina({ desde: '12.7', limite: '20.2' });
check('desde y límite se leen como enteros', fraccion.desde === 12 && fraccion.limite === 20, JSON.stringify(fraccion));

const conPeriodo = leerPedidoDePagina({ desde: '1000', limite: '200', inicio: '2026-08-15T05:00:00.000Z' });
check('un inicio ISO se conserva en ISO', conPeriodo.inicio === '2026-08-15T05:00:00.000Z', String(conPeriodo.inicio));
check('desde 1000 se respeta: la página pasa la frontera de PostgREST', conPeriodo.desde === 1000);

const repetido = leerPedidoDePagina({ desde: ['5', '9'] });
check('un parámetro repetido no rompe la lectura', repetido.desde === 5, String(repetido.desde));

/* ─── 2. EL RANGO Y «¿HAY MÁS?» ─────────────────────────────────────────── */
check('rango de la primera página', JSON.stringify(rangoDeLaPagina({ desde: 0, limite: 200 })) === '[0,199]');
check('rango de la página que cruza las mil filas', JSON.stringify(rangoDeLaPagina({ desde: 1000, limite: 1000 })) === '[1000,1999]');

check('con total: quedan si lo leído no llega al total', hayMasEventos({ desde: 1000, recibidos: 200, limite: 200, total: 1500 }) === true);
check('con total: no quedan si lo leído llega al total', hayMasEventos({ desde: 1400, recibidos: 100, limite: 200, total: 1500 }) === false);
check('sin total: una página llena puede tener más detrás', hayMasEventos({ desde: 0, recibidos: 200, limite: 200, total: null }) === true);
check('sin total: una página corta es la última', hayMasEventos({ desde: 0, recibidos: 37, limite: 200, total: null }) === false);

/* ─── 3. EL SERVICIO Y EL CONTROLADOR, COMO TEXTO ───────────────────────── */
const sinComentarios = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const AQUI = join(__dirname, '..');
const servicio = sinComentarios(readFileSync(join(AQUI, 'audit.service.ts'), 'utf8'));
const controlador = sinComentarios(readFileSync(join(AQUI, 'audit.controller.ts'), 'utf8'));

const inicioPagina = servicio.indexOf('async leerPagina(');
const cuerpoPagina = inicioPagina > -1 ? servicio.slice(inicioPagina, servicio.indexOf('\n  }\n', inicioPagina)) : '';
check('el servicio tiene la lectura por páginas', inicioPagina > -1);
check('la página se pide con `range`, no con un `limit` fijo', cuerpoPagina.includes('.range(') && !cuerpoPagina.includes('.limit('));
check('la página trae el total exacto', cuerpoPagina.includes("count: 'exact'"));
check(
  'el orden desempata por id: sin eso dos páginas pueden repetir o saltarse una fila',
  cuerpoPagina.includes(".order('created_at'") && cuerpoPagina.includes(".order('id'")
);
check('un error de lectura se lanza, no se vuelve lista vacía', cuerpoPagina.includes('throw') && !cuerpoPagina.includes('return []'));
check('el periodo filtra en la base, no en la pantalla', cuerpoPagina.includes(".gte('created_at'"));

check('el controlador lee el pedido de la consulta', controlador.includes('leerPedidoDePagina(req.query'));
check('el controlador usa la lectura por páginas', controlador.includes('leerPagina('));
check('el controlador responde el total y si hay más', controlador.includes('total') && controlador.includes('hayMas'));
check('el controlador responde 500 cuando la lectura falla', controlador.includes('500'));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
