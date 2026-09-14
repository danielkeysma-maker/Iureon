/**
 * Guarda la cara nueva de Borradores y de la lista de Revisiones contra lo que
 * la maqueta promete y el producto no hace.
 *
 * Run with: npm run check:borradores-cara
 *
 * ─── EL DEFECTO QUE VIGILA ─────────────────────────────────────────────────
 *
 * El artboard 3 de `public/handoff/app-redaccion-revision.html` se dibujó con
 * un conmutador «Míos · 4 / De la firma · 11» y solo dos estados de borrador.
 * El producto no filtra por autor y tiene CUATRO estados —borrador, revisar,
 * listo, radicado—: copiar la maqueta al pie de la letra quita dos estados que
 * el servidor sí guarda y pinta un filtro que no filtra nada, sin que nada
 * falle.
 *
 * Y lo que la piel no puede tumbar: la raíz con su visita guiada y la clase de
 * la cara nueva, los ejemplos de los campos como ceros evidentes (README-app
 * §3), el caso que la fila de Revisiones lleva al taller —del que depende
 * `check:posicion-expediente` del backend— y la escala que empieza en 14.
 *
 * Se lee el componente como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se pinta «Míos» contienen la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const ESCRITORIO = leer('modules/documents/components/SavedDraftsView.tsx');
const MOVIL = leer('modules/documents/components/SavedDraftsMobileView.tsx');
const REVISIONES = leer('modules/workspace/components/RevisionesView.tsx');

const PANTALLAS: Record<string, string> = {
  'SavedDraftsView.tsx': ESCRITORIO,
  'SavedDraftsMobileView.tsx': MOVIL,
  'RevisionesView.tsx': REVISIONES
};

/* ─── 1. LA RAÍZ: VISITA GUIADA Y CARA NUEVA ─────────────────────────────── */
check(
  'SavedDraftsView.tsx: la raíz conserva la visita guiada y lleva la cara nueva',
  /data-visita="vista-borradores"\s+className="cara-nueva [^"]*"/.test(ESCRITORIO)
);
check(
  'SavedDraftsMobileView.tsx: la raíz conserva la visita guiada y lleva la cara nueva',
  /data-visita="vista-borradores"\s+className="cara-nueva [^"]*"/.test(MOVIL)
);
check(
  'RevisionesView.tsx: la raíz conserva la visita guiada y lleva la cara nueva',
  /data-visita="vista-taller"\s+className="cara-nueva [^"]*"/.test(REVISIONES)
);

/* ─── 2. LO QUE LA MAQUETA DIBUJA Y EL PRODUCTO NO TIENE ────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(`${nombre} no pinta el conmutador «Míos ·»`, !/M[ií]os\s*·/.test(codigo), 'no hay filtro por autor');
  check(`${nombre} no pinta «De la firma ·»`, !/De la firma\s*·/.test(codigo), 'no hay filtro por autor');
  check(`${nombre} no dice «Sin terminar»`, !/Sin terminar/.test(codigo), 'ese estado no existe');
}

/* ─── 3. LOS CUATRO ESTADOS Y LO QUE LA PIEL NO PUEDE TUMBAR ────────────── */
check(
  'el formulario de datos conserva los cuatro estados',
  ['BORRADOR', 'REVISAR', 'LISTO', 'RADICADO'].every((e) => new RegExp(`<option value="${e}">`).test(ESCRITORIO))
);
check(
  'la píldora de estado tiene tono para los cuatro',
  ['BORRADOR', 'REVISAR', 'LISTO', 'RADICADO'].every((e) => new RegExp(`${e}: 'cn-bor-estado`).test(ESCRITORIO))
);
check(
  'el escritorio conserva exportar, redactar, buscar, estado, rama, limpiar y agrupar',
  [
    'Exportar lista',
    'Redactar escrito',
    'Buscar por cliente, radicado o actuación',
    "'sin radicar' : 'todos'",
    'Rama: todas',
    'Limpiar',
    'agruparPorTermino(',
    'Ninguno coincide con estos filtros.',
    'Todavía no hay borradores guardados.'
  ].every((t) => ESCRITORIO.includes(t))
);
check(
  'el escritorio conserva las acciones de fila',
  ['Datos del proceso', 'Poner en la agenda', 'Duplicar', 'Marcar radicado', '¿Eliminar este borrador?', 'dejarPendiente('].every((t) =>
    ESCRITORIO.includes(t)
  )
);
check('la fila conserva versión y autoría', /v\{e\.version \?\? 1\}/.test(ESCRITORIO) && /editado por \$\{e\.editadoPor\}/.test(ESCRITORIO));
check('lo que falta de respaldo sigue con borde discontinuo', /cn-bor-sin">\{faltaDeRespaldo\(e\)\}/.test(ESCRITORIO) && /cn-bor-sin">\{faltaDeRespaldo\(e\)\}/.test(MOVIL));

check('Revisiones lleva el caso al taller', REVISIONES.includes('expedienteId: c.expedienteId'));
check(
  'Revisiones conserva la autorización con confirmación, el vacío y la recogida del documento',
  ['ConfirmarDialog', 'Autorizar guardado', 'Retirar autorización', 'Todavía no hay revisiones.', 'tomarDocumentoParaLeer()', 'reviewApi.eliminar('].every(
    (t) => REVISIONES.includes(t)
  )
);

/* ─── 4. EJEMPLOS DE MENTIRA A LA VISTA ─────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(`${nombre} no trae un despacho verosímil`, !/Juzgado\s+(?!00\b)\d+/.test(codigo), 'README-app §3: «Juzgado 00 …»');
  check(`${nombre} no trae un radicado verosímil`, !/\b(?!0+\b)\d{15,}\b/.test(codigo), 'README-app §3: ceros');
}

/* ─── 5. LA ESCALA EMPIEZA EN 14 ────────────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(
    `${nombre}: nada por debajo de 13 px escrito a mano`,
    !/text-\[(?:\d|1[0-2])(?:\.\d+)?px\]|\btext-(?:meta|label|ui)\b/.test(codigo),
    'la escala de la cara nueva empieza en 14'
  );
}

/* ─── 6. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Borradores y Revisiones ─── */';
const inicio = CSS.indexOf(MARCA);
check('cara-nueva.css tiene el bloque de Borradores y Revisiones', inicio !== -1);
/* El bloque termina donde empieza el de la pantalla siguiente: leer hasta el final del archivo le cobraba sus reglas a este. */
const siguiente = CSS.indexOf('/* ─── ', inicio + MARCA.length);
const bloque = CSS.slice(inicio, siguiente === -1 ? undefined : siguiente).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{/g)) {
  const cabeza = m[1].trim();
  if (cabeza.startsWith('@media')) continue;
  for (const sel of cabeza.split(',').map((s) => s.trim())) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    /* Cada regla nombra una clase propia: el bloque no restiliza lo de otras pantallas. */
    if (!/\.cn-(?:bor|rev)\b|\.cn-(?:bor|rev)-/.test(sel)) ajenos.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-bor o cn-rev', ajenos.length === 0, ajenos.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
