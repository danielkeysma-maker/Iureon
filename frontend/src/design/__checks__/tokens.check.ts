/**
 * Guards the design tokens.
 *
 * Run with: npm run check:tokens
 *
 * EL DEFECTO QUE VIGILA. El tema tiene tres estados —seguir al sistema, forzar
 * claro, forzar oscuro— y eso obliga a que el mapeo oscuro aparezca en DOS
 * selectores: el del `@media` y el del `[data-theme='dark']`. Si alguien agrega
 * un token y solo lo pone en uno, ese token se queda claro sobre fondo oscuro
 * para la mitad de los usuarios — los que forzaron el tema, o los que no.
 *
 * No lanza error, no aparece en consola, y no se ve hasta que alguien abre esa
 * pantalla con esa preferencia. Por eso se comprueba aquí.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(AQUI, '..', 'tokens.css'), 'utf8');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/** Los tokens que un bloque remapea, en orden de aparición. */
const remapeados = (bloque: string): string[] =>
  [...bloque.matchAll(/(--[a-z0-9-]+)\s*:\s*var\(--dark-/g)].map((m) => m[1]);

const bloqueMedia = CSS.slice(
  CSS.indexOf(":root:not([data-theme='light'])"),
  CSS.indexOf(":root[data-theme='dark']")
);
const bloqueForzado = CSS.slice(CSS.indexOf(":root[data-theme='dark']"));

const enMedia = remapeados(bloqueMedia);
const enForzado = remapeados(bloqueForzado);

check(
  'el bloque del sistema remapea tokens',
  enMedia.length > 20,
  `${enMedia.length} tokens`
);

/*
 * LA COMPROBACIÓN QUE IMPORTA. Los dos bloques tienen que remapear exactamente
 * el mismo conjunto: uno solo con un token de más o de menos deja ese color sin
 * cambiar para una mitad de los usuarios.
 */
const soloEnMedia = enMedia.filter((t) => !enForzado.includes(t));
const soloEnForzado = enForzado.filter((t) => !enMedia.includes(t));

check(
  'los dos bloques de tema oscuro remapean los mismos tokens',
  soloEnMedia.length === 0 && soloEnForzado.length === 0,
  [
    soloEnMedia.length ? `solo en @media: ${soloEnMedia.join(', ')}` : '',
    soloEnForzado.length ? `solo en [data-theme=dark]: ${soloEnForzado.join(', ')}` : ''
  ]
    .filter(Boolean)
    .join(' | ')
);

/*
 * Y todo `--dark-*` definido tiene que usarse. Uno huérfano es un color que
 * alguien calculó, escribió, y que ninguna pantalla llega a mostrar nunca.
 */
const definidos = [...CSS.matchAll(/^\s*(--dark-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
const usados = new Set([...CSS.matchAll(/var\((--dark-[a-z0-9-]+)\)/g)].map((m) => m[1]));
const huerfanos = definidos.filter((d) => !usados.has(d));

check('ningún valor oscuro queda sin usar', huerfanos.length === 0, huerfanos.join(', '));

/*
 * ─── LA REGLA QUE NO SE PUEDE PERDER ────────────────────────────────────────
 *
 * `:not([data-theme='light'])` es lo único que hace que "Claro siempre" gane
 * sobre un sistema operativo en oscuro. Sin él, esa opción de Ajustes existe,
 * se puede elegir, y no hace absolutamente nada — justo para el usuario que la
 * buscó a propósito.
 */
check(
  'forzar tema claro vence al sistema operativo',
  bloqueMedia.includes(":root:not([data-theme='light'])"),
  ''
);

/*
 * ─── LA DENSIDAD NO TOCA LA LETRA ───────────────────────────────────────────
 *
 * Cambia altos de fila y de control. Reducir el tamaño de letra para caber más
 * filas es lo que convierte una tabla densa en una tabla ilegible, y el mínimo
 * de 11px de las etiquetas no se toca en ninguna opción.
 */
const bloquesDensidad = [...CSS.matchAll(/\[data-density='[a-z]+'\]\s*\{([^}]*)\}/g)].map(
  (m) => m[1]
);

check(
  'las tres densidades están definidas',
  bloquesDensidad.length >= 2,
  `${bloquesDensidad.length} explícitas + la normal`
);

check(
  'ninguna densidad cambia tamaños de letra',
  !bloquesDensidad.some((b) => /font-size|--text-/.test(b)),
  ''
);

/*
 * ─── LA MONOESPACIADA NO ES ELEGIBLE ────────────────────────────────────────
 *
 * Términos, radicados y saldos van siempre en mono, cualquiera sea la familia
 * de interfaz elegida: es lo que impide confundir un 1 con una l en un radicado
 * de veintitrés dígitos. Si algún día una opción de fuente tocara `--font-mono`,
 * esa garantía se pierde en silencio.
 */
const bloquesFuente = [...CSS.matchAll(/\[data-font='[a-z]+'\]\s*\{([^}]*)\}/g)].map((m) => m[1]);

check(
  'hay varias familias de interfaz para elegir',
  bloquesFuente.length >= 4,
  `${bloquesFuente.length} alternativas + la de por defecto`
);

check(
  'ninguna elección de fuente toca la monoespaciada',
  !bloquesFuente.some((b) => /--font-mono|--font-legal/.test(b)),
  ''
);

/* ─── EL TONO QUE NO EXISTE, Y LA CLASE QUE NO EMITE NADA ──────────────────
 *
 * `border-brand-line` se usaba en seis archivos y NO EXISTE: `brand` solo
 * declara 50, 700 y 800. Tailwind no avisa de una clase que no reconoce —
 * simplemente no emite regla—, así que el borde se quedaba en el gris por
 * defecto y nadie lo notó. Lo mismo vale para `bg-`, `text-` y `ring-`.
 *
 * Es la clase de defecto que este archivo existe para cazar: no lanza error,
 * no sale en consola, y solo se ve si alguien compara la pantalla con el
 * diseño que tenía en la cabeza.
 *
 * SE COMPRUEBAN SOLO LAS FAMILIAS QUE ESTE PROYECTO DECLARA. Tailwind trae las
 * suyas —`text-white`, `bg-red-500`— y validarlas aquí obligaría a copiar su
 * paleta entera, que envejecería a la primera actualización. Lo que se puede
 * sostener es lo propio: si una clase nombra `brand`, `ink`, `line`, `nav` o
 * `rail`, su tono tiene que estar en `tailwind.config.js`.
 */
const CONFIG = readFileSync(join(AQUI, '..', '..', '..', 'tailwind.config.js'), 'utf8');

/** Los tonos declarados de una familia, leídos del config y no de una lista. */
const tonosDe = (familia: string): Set<string> => {
  const abre = CONFIG.indexOf(`        ${familia}: {`);
  if (abre === -1) return new Set();
  const cierra = CONFIG.indexOf('\n        },', abre);
  const bloque = CONFIG.slice(abre, cierra === -1 ? undefined : cierra);
  const tonos = [...bloque.matchAll(/^\s*'?([A-Za-z0-9-]+)'?\s*:/gm)].map((m) => m[1]);
  /* La primera coincidencia es el nombre de la familia. */
  return new Set(tonos.slice(1).map((t) => t.toLowerCase()));
};

/*
 * `nav` y `rail` traen `DEFAULT`, que en Tailwind se escribe sin tono
 * (`bg-nav`). Se acepta como tono vacío.
 */
const FAMILIAS = ['ink', 'line', 'brand', 'nav', 'rail'];
const PREFIJOS = ['bg', 'text', 'border', 'ring', 'divide', 'outline', 'from', 'via', 'to', 'fill', 'stroke', 'shadow', 'accent', 'caret', 'decoration'];

/*
 * SE MIRA EL CODIGO SIN COMENTARIOS, Y ESTA LECCION YA SE PAGO EN ESTA CASA
 * TRES VECES. Un comentario que EXPLICA una clase rota —«`border-brand-line`
 * NO existe»— la contiene, asi que un barrido ingenuo la denuncia y el arreglo
 * documentado se vuelve la falsa alarma. El propio archivo de este check es el
 * peor caso: su cabecera nombra la clase para explicarla.
 */
const sinComentarios = (codigo: string): string =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');

const fuentes: string[] = [];
const recorrer = (dir: string): void => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    /* Los checks hablan DE las clases rotas; no las usan. */
    if (e.isDirectory() && e.name !== '__checks__') recorrer(ruta);
    else if (!e.isDirectory() && (e.name.endsWith('.tsx') || e.name.endsWith('.ts'))) fuentes.push(ruta);
  }
};
recorrer(join(AQUI, '..', '..'));

const rotas: string[] = [];
for (const familia of FAMILIAS) {
  const tonos = tonosDe(familia);
  /*
   * `[^\]]` tras el tono descarta las clases arbitrarias
   * `border-[rgb(var(--brand-line))]`, que son la forma CORRECTA de usar un
   * token sin escala: ahí `brand-line` es el nombre de una variable CSS, no
   * un tono de Tailwind.
   */
  const uso = new RegExp(`\\b(?:${PREFIJOS.join('|')})-${familia}-([a-z0-9-]+)\\b`, 'g');
  for (const ruta of fuentes) {
    const codigo = sinComentarios(readFileSync(ruta, 'utf8'));
    for (const m of codigo.matchAll(uso)) {
      const tono = m[1].toLowerCase();
      if (tonos.has(tono)) continue;
      /* Dentro de una clase arbitraria no es un tono: es una variable CSS. */
      const antes = codigo.slice(Math.max(0, m.index - 30), m.index);
      if (antes.includes('var(--')) continue;
      rotas.push(`${ruta.split('src')[1] ?? ruta}: ${m[0]}`);
    }
  }
}

check(
  'ninguna clase nombra un tono que la paleta no declara',
  rotas.length === 0,
  rotas.length > 0
    ? `NO EMITEN NADA: ${[...new Set(rotas)].join(' · ')}`
    : `${FAMILIAS.length} familias comprobadas en ${fuentes.length} archivos`
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
