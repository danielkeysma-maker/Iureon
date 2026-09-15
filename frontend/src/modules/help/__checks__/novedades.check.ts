/**
 * Guarda Novedades (módulo 13): que la lista diga solo lo que existe, en la
 * voz del abogado, y que «Le afecta» y «Nuevo» signifiquen lo que dicen.
 *
 * Run with: npm run check:novedades
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. EL ORDEN Y LA FECHA. La lista va de lo más reciente a lo más antiguo, y
 *    una fecha futura sería anunciar como hecho algo que todavía no llegó.
 *
 * 2. EL MÓDULO QUE NO EXISTE. Cada entrada nombra módulos por su id de
 *    navegación; un id mal escrito deja un filtro que no filtra nada y un
 *    «Ir a…» que abre una vista en blanco.
 *
 * 3. EL ENLACE AL MANUAL ROTO. El manual se reescribe en paralelo: «Cómo
 *    usarlo» solo puede apuntar a un artículo que exista hoy.
 *
 * 4. LA JERGA DE LA CASA. «commit», «check», «agente», «CSS», «migración»:
 *    quien lee esta lista usa la aplicación, no la construye.
 *
 * 5. «LE AFECTA» INVENTADO. Se deriva de los módulos que el plan de la firma
 *    abre; sin datos del plan no se afirma nada. No se deriva de versiones de
 *    ficha por escrito: ese dato no existe.
 *
 * 6. «NUEVO» PARA TODO. Con visita registrada, nuevo es lo posterior a ella;
 *    sin visita, los últimos 30 días y no la historia entera.
 *
 * 7. LA PIEL FUERA DE SU ALCANCE: raíz `.cara-nueva`, los dos oscuros, letra
 *    de 13,5 px o más, sin oro y controles de 44 px.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOVEDADES, type Novedad } from '../content/novedades';
import { entradaPorId } from '../content/manual';
import { NAV_GROUPS, NAV_MODULES } from '../../tenant/navigation';
import {
  DIAS_SIN_VISITA,
  alcanceDelPlan,
  contarNuevas,
  esNueva,
  filtrarNovedades,
  leAfecta,
  paraInicio,
  visiblesParaRol
} from '../novedades.logica';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

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
const leer = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');

/* ─── 1. ORDEN Y FECHAS ─────────────────────────────────────────────────── */
const HOY_EN_BOGOTA = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
const fechaValida = (iso: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
};
check('hay novedades', NOVEDADES.length >= 20, String(NOVEDADES.length));
const malas = NOVEDADES.filter((n) => !fechaValida(n.fecha));
check('toda fecha es real y en formato AAAA-MM-DD', malas.length === 0, malas.map((n) => n.id).join(', '));
const futuras = NOVEDADES.filter((n) => n.fecha > HOY_EN_BOGOTA);
check(`ninguna fecha es posterior a hoy (${HOY_EN_BOGOTA})`, futuras.length === 0, futuras.map((n) => `${n.id} ${n.fecha}`).join(', '));
const desordenadas = NOVEDADES.filter((n, i) => i > 0 && n.fecha > NOVEDADES[i - 1].fecha);
check('de la más reciente a la más antigua', desordenadas.length === 0, desordenadas.map((n) => n.id).join(', '));
const ids = NOVEDADES.map((n) => n.id);
check('cada id es único y legible', new Set(ids).size === ids.length && ids.every((i) => /^[a-z0-9-]+$/.test(i)));

/* ─── 2. MÓDULOS QUE EXISTEN ────────────────────────────────────────────── */
const vistas = new Set<string>(NAV_MODULES.map((m) => m.id));
const sinModulo = NOVEDADES.filter((n) => n.modulos.length === 0 || n.modulos.some((m) => !vistas.has(m)));
check('cada entrada nombra al menos un módulo y todos existen en la navegación', sinModulo.length === 0, sinModulo.map((n) => `${n.id}: ${n.modulos.join('/')}`).join(', '));
check(
  'Novedades es un módulo de la barra, en «Aprender», después de Soporte',
  vistas.has('novedades') &&
    (NAV_GROUPS.find((g) => g.titulo === 'Aprender')?.modulos.join('|') ?? '').endsWith('soporte|novedades')
);

/* ─── 3. «CÓMO USARLO» APUNTA A UN ARTÍCULO QUE EXISTE ─────────────────── */
const rotos = NOVEDADES.filter((n) => n.comoUsarlo !== undefined && !entradaPorId(n.comoUsarlo));
check('todo «Cómo usarlo» abre un artículo del manual que existe hoy', rotos.length === 0, rotos.map((n) => `${n.id}→${n.comoUsarlo}`).join(', '));

/* ─── 4. LA VOZ DEL ABOGADO ─────────────────────────────────────────────── */
const JERGA =
  /\bcommits?\b|\bchecks?\b|\bagentes?\b|\bCSS\b|\bdeploy|\bdespleg|\bCI\b|\bmigraci[oó]n|\bendpoint|\bbackend\b|\bfrontend\b|\bSupabase\b|\bVercel\b|\bprompt\b|\bJSON\b|\bJSONB\b|\bhelper\b|\bOpenRouter\b/i;
const conJerga = NOVEDADES.filter((n) => JERGA.test(`${n.titulo} ${n.queCambio}`));
check(
  'sin jerga interna (commit, check, agente, CSS…)',
  conJerga.length === 0,
  conJerga.map((n) => `${n.id} «${`${n.titulo} ${n.queCambio}`.match(JERGA)?.[0]}»`).join(', ')
);
const oraciones = (t: string): number => (t.match(/[.?!](?=\s|$)/g) ?? []).length;
const largas = NOVEDADES.filter((n) => oraciones(n.queCambio) < 2 || oraciones(n.queCambio) > 4);
check('«qué cambió» en dos a cuatro oraciones', largas.length === 0, largas.map((n) => `${n.id} (${oraciones(n.queCambio)})`).join(', '));
const tituloLargo = NOVEDADES.filter((n) => n.titulo.length > 110 || /[.]$/.test(n.titulo));
check('títulos de hasta 110 caracteres y sin punto final', tituloLargo.length === 0, tituloLargo.map((n) => n.id).join(', '));
check(
  'trato de «usted», nunca de «tú»',
  !NOVEDADES.some((n) => /\b(puedes|tienes|tu escrito|tus |quieres)\b/i.test(n.queCambio))
);

/* ─── 5. «LE AFECTA» SALE DEL PLAN ─────────────────────────────────────── */
const ESENCIAL = ['REDACCION', 'BORRADORES', 'REVISIONES', 'BUSCADOR', 'CATALOGO', 'HERRAMIENTAS', 'EXPEDIENTES'];
check('sin datos del plan no se afirma nada', alcanceDelPlan(['audiencias'], null) === null);
check('un módulo que el plan abre: incluido', alcanceDelPlan(['workspace'], ESENCIAL) === 'incluido');
check('un módulo que el plan no abre: no incluido', alcanceDelPlan(['audiencias'], ESENCIAL) === 'no-incluido');
check('basta con uno de sus módulos abierto', alcanceDelPlan(['audiencias', 'taller'], ESENCIAL) === 'incluido');
check('Ajustes o Inicio no los recorta ningún plan: general', alcanceDelPlan(['ajustes', 'inicio'], ESENCIAL) === 'general');
check('general le afecta; no incluido no', leAfecta('general') && leAfecta('incluido') && !leAfecta('no-incluido') && !leAfecta(null));

const muestra: Novedad[] = [
  { id: 'a', fecha: '2026-09-14', modulos: ['audiencias'], titulo: 'A', queCambio: 'Uno. Dos.', tipo: 'nuevo' },
  { id: 'b', fecha: '2026-09-10', modulos: ['workspace'], titulo: 'B', queCambio: 'Uno. Dos.', tipo: 'mejora' },
  { id: 'c', fecha: '2026-08-01', modulos: ['ajustes'], titulo: 'C', queCambio: 'Uno. Dos.', tipo: 'correccion' },
  { id: 'd', fecha: '2026-09-12', modulos: ['audit'], titulo: 'D', queCambio: 'Uno. Dos.', tipo: 'nuevo', soloOperacion: true }
];
check('lo de operación no lo ve la firma', visiblesParaRol(muestra, false).map((n) => n.id).join() === 'a,b,c');
check('el operador sí lo ve', visiblesParaRol(muestra, true).length === 4);
check(
  'el filtro «Le afecta» deja fuera lo que el plan no abre',
  filtrarNovedades(muestra.slice(0, 3), { modulo: null, soloLeAfecta: true }, ESENCIAL).map((n) => n.id).join() === 'b,c'
);
check(
  'sin plan, «Le afecta» no filtra: no hay con qué decidir',
  filtrarNovedades(muestra.slice(0, 3), { modulo: null, soloLeAfecta: true }, null).length === 3
);
check('el filtro por módulo', filtrarNovedades(muestra, { modulo: 'workspace', soloLeAfecta: false }, null).map((n) => n.id).join() === 'b');
check('Inicio prefiere lo que le afecta', paraInicio(muestra.slice(0, 3), ESENCIAL, 2).map((n) => n.id).join() === 'b,c');
check('Inicio sin plan: las más recientes', paraInicio(muestra.slice(0, 3), null, 2).map((n) => n.id).join() === 'a,b');

/* ─── 6. «NUEVO» ────────────────────────────────────────────────────────── */
check('con visita: nuevo es lo posterior a ella', esNueva('2026-09-12', '2026-09-11', '2026-09-14') && !esNueva('2026-09-11', '2026-09-11', '2026-09-14'));
check(`sin visita: solo los últimos ${DIAS_SIN_VISITA} días`, esNueva('2026-08-16', null, '2026-09-14') && !esNueva('2026-08-15', null, '2026-09-14'));
check('el contador cuenta solo lo nuevo', contarNuevas(muestra.slice(0, 3), '2026-09-11', null) === 1);
check('y con plan, solo lo nuevo que le afecta', contarNuevas(muestra.slice(0, 3), '2026-09-01', ESENCIAL) === 1);

/* ─── 7. PANTALLAS Y PIEL ──────────────────────────────────────────────── */
const VISTA = sinComentarios(leer('modules/help/components/NovedadesView.tsx'));
const INICIO = sinComentarios(leer('modules/inicio/components/InicioView.tsx'));
const CSS = leer('design/cara-nueva.css');
check('la vista abre su alcance de la cara nueva', /className=\{?`?"?cara-nueva cn-nov/.test(VISTA));
check('la vista tiene lista, detalle y vacío', ['cn-nov-lista', 'cn-nov-detalle', 'cn-nov-vacio'].every((c) => VISTA.includes(c)));
check('«Le afecta» solo se ofrece con datos del plan', /modulosPermitidos\s*!==\s*null\s*&&/.test(VISTA));
check('Inicio usa la misma selección', INICIO.includes('paraInicio('));
check('ninguna pantalla promete aviso por correo', !/por correo|al correo/i.test(VISTA));
const DIMINUTA = /text-\[(?:[0-9]|1[0-3])(?:\.\d+)?px\]|text-meta\b/;
check('la vista no usa letra diminuta de Tailwind', !DIMINUTA.test(VISTA), VISTA.match(DIMINUTA)?.[0] ?? '');

const INI = CSS.indexOf('/* ─── Novedades ─── */');
const FIN = CSS.indexOf('/* ─── fin Novedades ─── */');
check('el bloque de CSS existe, una sola vez', INI > -1 && FIN > INI && CSS.lastIndexOf('/* ─── Novedades ─── */') === INI);
const BLOQUE = INI > -1 && FIN > INI ? CSS.slice(INI, FIN).replace(/\/\*[\s\S]*?\*\//g, ' ') : '';
const selectores = [...BLOQUE.matchAll(/(^|\})\s*([^{}@]+)\{/g)].map((m) => m[2].trim()).filter((s) => s && !/^(from|to|\d+%)$/.test(s));
const fuera = selectores
  .flatMap((s) => s.split(','))
  .map((s) => s.trim())
  .filter((s) => !/^(:root(\[data-theme='dark'\]|:not\(\[data-theme='light'\]\)) )?\.cara-nueva[.\s]/.test(s));
check('toda regla vive bajo .cara-nueva', selectores.length > 0 && fuera.length === 0, fuera.slice(0, 3).join(' | '));
const ajenas = [...BLOQUE.matchAll(/\.(cn-[a-z0-9]+)-/g)].map((m) => m[1]).filter((c) => c !== 'cn-nov');
check('solo el prefijo cn-nov', ajenas.length === 0, [...new Set(ajenas)].join(', '));
check(
  'trae los dos oscuros',
  BLOQUE.includes('@media (prefers-color-scheme: dark)') &&
    BLOQUE.includes(":root:not([data-theme='light']) .cara-nueva") &&
    BLOQUE.includes(":root[data-theme='dark'] .cara-nueva")
);
const tamanos = [...BLOQUE.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
check('nada por debajo de 13,5 px', tamanos.length > 0 && tamanos.every((t) => t >= 13.5), tamanos.filter((t) => t < 13.5).join(', '));
check('sin oro: el oro es del módulo activo', !/--gold|#c8a046|#d9b45c/i.test(BLOQUE));
const botones = [...BLOQUE.matchAll(/([^{}]*(?:boton|chip|fila)[^{}]*)\{([^}]*)\}/g)]
  .filter((m) => /min-height/.test(m[2]))
  .map((m) => ({ s: m[1].trim(), alto: Number(/min-height:\s*(\d+)px/.exec(m[2])?.[1] ?? 0) }));
check('botones, chips y filas miden 44 px o más', botones.length > 0 && botones.every((b) => b.alto >= 44), botones.filter((b) => b.alto < 44).map((b) => b.s).join(' | '));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
