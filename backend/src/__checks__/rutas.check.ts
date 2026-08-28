/**
 * Contrato de rutas: cada camino /api/... que el frontend llama existe en el
 * backend.
 *
 * Nació de un 404 real: la calculadora de liquidación llamaba
 * /api/settlements/calculate (plural) y la ruta era /settlement/calculate
 * (singular). El fallback viejo se tragaba el fallo y mostraba cifras
 * inventadas; al volverlo visible, el 404 quedó a la vista — pero un check lo
 * habría atrapado antes de llegar a una pantalla.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

const listar = (dir: string, filtro: (f: string) => boolean): string[] => {
  const out: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) {
      if (nombre === 'node_modules' || nombre === 'dist' || nombre === '.git') continue;
      out.push(...listar(ruta, filtro));
    } else if (filtro(nombre)) {
      out.push(ruta);
    }
  }
  return out;
};

/*
 * ── Las rutas del backend, con :params normalizados a * ──
 *
 * Dos puntos ciegos que la primera version tuvo y esta cubre:
 *  1. Routers con otro nombre (publicRouter, tenantRouter): el patron acepta
 *     cualquier identificador que termine en "outer.".
 *  2. Prefijos de montaje: adminRoutes cuelga de app.use('/api/admin', ...) y
 *     sus caminos son '/firms'. El prefijo se lee de index.ts, por nombre de
 *     export — asumirlo '/api' invento 11 huerfanos falsos.
 */
const INDEX = readFileSync(join(__dirname, '..', 'index.ts'), 'utf8');
/*
 * SIN REGEX EN STRINGS, y esta vez con cicatriz propia: la primera version
 * escribio new RegExp("...\s*...") y el backslash colapso al escribir el
 * archivo — el patron busco ",s*" literal, nunca coincidio, y los cuatro
 * montajes de admin aparecieron como huerfanos falsos. Texto puro:
 */
const prefijoDe = (nombreExport: string): string => {
  const aguja = ', ' + nombreExport + ')';
  const fin = INDEX.indexOf(aguja);
  if (fin === -1) return '/api';

  const inicio = INDEX.lastIndexOf("app.use('", fin);
  if (inicio === -1) return '/api';

  const desde = inicio + "app.use('".length;
  const cierre = INDEX.indexOf("'", desde);
  return cierre > desde ? INDEX.slice(desde, cierre) : '/api';
};

const RUTAS = new Set<string>();
for (const archivo of listar(join(__dirname, '..'), (f) => f.endsWith('.routes.ts'))) {
  const contenido = readFileSync(archivo, 'utf8');

  // Cada export const X = <router> define un montaje con su propio prefijo.
  const exportsDeRouter: Array<{ nombre: string; routerVar: string }> = [];
  const patronExport = /export const (\w+) = (\w+);/g;
  let e: RegExpExecArray | null;
  while ((e = patronExport.exec(contenido)) !== null) {
    exportsDeRouter.push({ nombre: e[1], routerVar: e[2] });
  }

  const patron = /(\w+)\.(get|post|put|patch|delete)\(\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = patron.exec(contenido)) !== null) {
    const routerVar = m[1];
    if (!routerVar.toLowerCase().includes('router')) continue;

    const exportado = exportsDeRouter.find((x) => x.routerVar === routerVar);
    const prefijo = exportado ? prefijoDe(exportado.nombre) : '/api';

    RUTAS.add(
      prefijo +
        m[3]
          .split('/')
          .map((s) => (s.startsWith(':') ? '*' : s))
          .join('/')
    );
  }
}

// ── Los caminos que el frontend llama, con ${...} normalizado a * ──
const FRONTEND = join(__dirname, '..', '..', '..', 'frontend', 'src');
const llamadas = new Map<string, string>();
for (const archivo of listar(FRONTEND, (f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
  const contenido = readFileSync(archivo, 'utf8');
  const patron = /['"`](\/api\/[^'"`\s?]+)/g;
  let m: RegExpExecArray | null;
  while ((m = patron.exec(contenido)) !== null) {
    const camino = m[1]
      .split('/')
      .map((s) => (s.includes('${') ? '*' : s))
      .join('/')
      .split('?')[0];
    llamadas.set(camino, archivo.slice(FRONTEND.length + 1));
  }
}

const coincide = (llamada: string): boolean => {
  for (const ruta of RUTAS) {
    const a = llamada.split('/');
    const b = ruta.split('/');
    if (a.length !== b.length) continue;
    if (a.every((seg, i) => b[i] === '*' || seg === '*' || seg === b[i])) return true;
  }
  return false;
};

console.log(`${RUTAS.size} rutas de backend · ${llamadas.size} caminos llamados por el frontend`);

const huerfanos: string[] = [];
for (const [camino, archivo] of llamadas) {
  if (!coincide(camino)) huerfanos.push(`${camino} (${archivo})`);
}

check(
  'todo camino que el frontend llama existe en el backend',
  huerfanos.length === 0,
  huerfanos.length ? `sin ruta: ${huerfanos.join(' · ')}` : ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
