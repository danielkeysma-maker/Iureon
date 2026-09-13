/**
 * GUARDA: NINGÚN SITIO LISTA CUENTAS POR SU CUENTA.
 *
 * Run with: npm run check:listar-cuentas
 *
 * `auth.admin.listUsers()` devuelve UNA página —50 sin argumentos, mil con
 * `perPage: 1000`— y siete sitios del backend la trataban como la lista entera.
 * Ninguno fallaba: la consola del operador contaba de menos, el cupo del plan
 * medía contra una lista corta, y un script decía «no existe esa cuenta» sobre
 * una que existía. Ver `listarCuentas.ts`.
 *
 * La regla es estructural y por eso se vigila leyendo el código: `listUsers(`
 * solo puede aparecer dentro de `listarCuentas.ts`. Cualquier otro sitio que lo
 * llame —con o sin argumentos, porque `{ page: 1, perPage: 1000 }` también se
 * queda en la primera página— vuelve a abrir el defecto.
 *
 * Y el helper tiene que paginar de verdad y devolver la falla: un helper único
 * que se quedara en la página uno haría el defecto universal en vez de cerrarlo.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CUENTAS_POR_PAGINA, listarTodasLasCuentas } from '../listarCuentas';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const RAIZ = join(process.cwd(), 'src');
const HELPER = join('modules', 'auth', 'listarCuentas.ts');

/*
 * Los comentarios fuera: un archivo que EXPLICA el defecto nombra `listUsers(`
 * para explicarlo, y esa lección ya se pagó tres veces en esta casa.
 */
const sinComentarios = (fuente: string): string =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const fuentes: string[] = [];
const recorrer = (dir: string): void => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) {
      /* Los checks hablan del defecto; `_tmp` son mediciones desechables que no se versionan. */
      if (e.name !== '__checks__' && e.name !== '_tmp' && e.name !== 'node_modules') recorrer(ruta);
    } else if (e.name.endsWith('.ts')) {
      fuentes.push(ruta);
    }
  }
};
recorrer(RAIZ);

/* ─── 1. NADIE MÁS LLAMA A listUsers ─────────────────────────────────────── */

const infractores = fuentes
  .filter((ruta) => relative(RAIZ, ruta) !== HELPER)
  .filter((ruta) => /\blistUsers\s*\(/.test(sinComentarios(readFileSync(ruta, 'utf8'))))
  .map((ruta) => relative(RAIZ, ruta));

check(
  'fuera de listarCuentas.ts nadie llama a listUsers',
  infractores.length === 0,
  infractores.length > 0
    ? `LEEN SOLO UNA PÁGINA: ${infractores.join(' · ')}`
    : `${fuentes.length} archivos revisados`
);

/* ─── 2. EL HELPER PAGINA DE VERDAD ──────────────────────────────────────── */
/*
 * No se lee su código: se le da un cliente postizo con 2.345 cuentas repartidas
 * en páginas, y se comprueba que las trae todas. Leer el texto probaría que
 * dice «page», no que recorre.
 */

type Pagina = { data: { users: { id: string }[] }; error: { message: string } | null };

const clientePostizo = (total: number, fallarEnPagina?: number) => {
  const pedidas: number[] = [];
  return {
    pedidas,
    cliente: {
      auth: {
        admin: {
          listUsers: async ({ page, perPage }: { page: number; perPage: number }): Promise<Pagina> => {
            pedidas.push(page);
            if (page === fallarEnPagina) return { data: { users: [] }, error: { message: 'red caída' } };
            const desde = (page - 1) * perPage;
            const cuantas = Math.max(0, Math.min(perPage, total - desde));
            return { data: { users: Array.from({ length: cuantas }, (_, i) => ({ id: `u${desde + i}` })) }, error: null };
          }
        }
      }
    }
  };
};

void (async () => {
  const muchas = clientePostizo(2345);
  const todas = await listarTodasLasCuentas(muchas.cliente as never);
  check(
    'trae TODAS las cuentas, no la primera página',
    todas.usuarios.length === 2345 && todas.falla === null,
    `trajo ${todas.usuarios.length} de 2345 en ${muchas.pedidas.length} página(s)`
  );
  check('y pide las páginas en orden hasta la última', muchas.pedidas.join(',') === '1,2,3', muchas.pedidas.join(','));

  const exacta = clientePostizo(CUENTAS_POR_PAGINA);
  const justas = await listarTodasLasCuentas(exacta.cliente as never);
  check(
    'con un múltiplo exacto de la página no se queda corto ni se cuelga',
    justas.usuarios.length === CUENTAS_POR_PAGINA && justas.falla === null && exacta.pedidas.length === 2,
    `pidió ${exacta.pedidas.length} página(s)`
  );

  const rota = clientePostizo(2345, 2);
  const incompleta = await listarTodasLasCuentas(rota.cliente as never);
  check(
    'si una página falla, la falla VIENE en el resultado',
    incompleta.falla !== null && incompleta.falla.includes('red caída'),
    String(incompleta.falla)
  );
  check(
    'y no se presenta como lista completa',
    incompleta.usuarios.length === CUENTAS_POR_PAGINA,
    'devuelve lo leído hasta la falla, con la falla al lado; nunca «cero» ni «todo»'
  );

  const lanza = await listarTodasLasCuentas({
    auth: { admin: { listUsers: async () => { throw new Error('timeout'); } } }
  } as never);
  check('una excepción del cliente también se devuelve como falla', lanza.falla?.includes('timeout') === true);

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
})();
