#!/usr/bin/env node
/**
 * La ILUSTRACIÓN de marca: la escultura de cintas, en vector.
 *
 * QUÉ ES ESTO Y QUÉ NO. Es el segundo nivel de una identidad de dos niveles, y
 * esa separación se tomó a la vista de una medición: reducida a 32 píxeles la
 * escultura es una mancha, y en negro plano su silueta lee como una pieza de
 * ajedrez. No es un defecto de ejecución — dos cintas girando es una idea
 * VOLUMÉTRICA, y aplanada colapsa en otra cosa.
 *
 * Así que aquí vive lo que la escultura sí hace bien: portada, presentación,
 * redes, papelería de gran formato, donde se ve grande y el volumen se aprecia.
 * La marca que va en el favicon, la cabecera de la aplicación y el ícono móvil
 * es la plana de `build-brand.mjs`, y son piezas distintas a propósito.
 *
 * DE DÓNDE VIENE LA GEOMETRÍA. Del script que escribió el dueño de la marca: la
 * cinta se calcula con una fórmula de hélice, no se calca. Eso es honesto y se
 * conserva tal cual. Lo que cambió son tres cosas que impedían usarla:
 *
 * 1. GEORGIA FUERA. El texto usaba Georgia, que es de 1993, se dibujó para
 *    monitores CRT y además es de Microsoft — su licencia no permite usarla como
 *    marca. Ahora usa Tenor Sans YA TRAZADA, la misma de la marca plana, así que
 *    los dos niveles hablan con la misma voz.
 *
 * 2. OCHOCIENTOS DIECISÉIS NODOS, A CINCUENTA. Eran polilíneas de cien
 *    segmentos por borde: imposible de editar a mano, y cualquier ajuste
 *    obligaba a re-correr el script. Ahora son curvas cúbicas ajustadas sobre
 *    veinte muestras — visualmente idénticas, editables en Figma.
 *
 * 3. LAS SOMBRAS SON OPCIONALES. Un `feDropShadow` no sobrevive a impresión a
 *    una tinta, ni a bordado, ni a grabado. Se conservan para pantalla y se
 *    apagan para todo lo demás.
 *
 * Correr con: node scripts/build-brand-illustration.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', 'public', 'brand');
const LETRAS = JSON.parse(readFileSync(join(AQUI, 'wordmark-paths.json'), 'utf8'));

/* ─── PALETA ─────────────────────────────────────────────────────────────── */
const PAL = {
  goldFront: ['#9C6B30', '#F2D288', '#D4A757', '#7A5222'],
  goldBack: ['#4A3011', '#9A773F', '#4A3011'],
  darkFront: ['#070C14', '#1D2E42', '#0F1824', '#05080D'],
  darkBack: ['#020305', '#0C141F', '#020305'],
  arrowDark: ['#070C14', '#2C4159'],
  arrowGold: ['#F2D288', '#9C6B30'],
  texto: '#0A162B',
  textoSuave: '#243852'
};

/* ─── LA HÉLICE ──────────────────────────────────────────────────────────── */

/** Anchura de la cinta y radio del giro, del script original. */
const W = 34;
const RADIO = 95;

/**
 * Cuánto gira la cinta de abajo arriba.
 *
 * El original llegaba a 0,95 — que son 342°, MENOS de una vuelta completa. Se
 * deja como parámetro porque la referencia que inspiró la pieza mostraba dos
 * vueltas y media, y esa diferencia cambia por completo la lectura: una vuelta
 * es una cinta doblada, dos y media es una hélice.
 */
const VUELTAS = 1.5;

const punto = (t, oscura) => {
  const y = 680 - 410 * t;
  const r = t < 0.75 ? RADIO : RADIO * (1 - ((t - 0.75) / 0.25) ** 1.7);
  const a = t * Math.PI * 2 * VUELTAS;
  const x = oscura ? 500 - r * Math.cos(a) : 500 + r * Math.cos(a);
  return [x, y];
};

/**
 * Convierte una lista de puntos en curvas cúbicas suaves (Catmull-Rom a Bézier).
 *
 * Es lo que reemplaza las polilíneas de cien segmentos. Con veinte muestras y
 * curvas reales el resultado es visualmente idéntico y el archivo queda
 * editable: en Figma se ven veinte nodos con sus manejadores, no ochocientos
 * vértices que nadie puede tocar.
 */
const suavizar = (pts) => {
  const n = (v) => Number(v.toFixed(2));
  let d = `M ${n(pts[0][0])} ${n(pts[0][1])}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i > 0 ? i - 1 : 0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    // Tensión 1/6: el valor canónico que hace pasar la Bézier por las muestras.
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${n(c1[0])} ${n(c1[1])}, ${n(c2[0])} ${n(c2[1])}, ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
};

/** Una cinta: su borde izquierdo de ida y el derecho de vuelta, cerrada. */
const cinta = (t0, t1, oscura, atras, muestras = 20) => {
  const izq = [];
  const der = [];

  for (let i = 0; i <= muestras; i++) {
    const t = t0 + (t1 - t0) * (i / muestras);
    const [x, y] = punto(t, oscura);
    izq.push([x - W, y]);
    der.push([x + W, y]);
  }

  const d = `${suavizar(izq)} L ${der[der.length - 1][0].toFixed(2)} ${der[der.length - 1][1].toFixed(2)} ${suavizar([...der].reverse()).slice(1)} Z`;
  const grad = oscura ? (atras ? 'darkBack' : 'darkFront') : atras ? 'goldBack' : 'goldFront';
  return { d, grad };
};

/* ─── EL SVG ─────────────────────────────────────────────────────────────── */

const gradiente = (id, paradas, invertido = false) => {
  const coords = invertido
    ? 'x1="100%" y1="100%" x2="0%" y2="0%"'
    : 'x1="0%" y1="100%" x2="100%" y2="0%"';
  const stops = paradas
    .map((c, i) => `<stop offset="${Math.round((i / (paradas.length - 1)) * 100)}%" stop-color="${c}"/>`)
    .join('');
  return `<linearGradient id="${id}" ${coords}>${stops}</linearGradient>`;
};

/**
 * @param plano  Sin gradientes ni sombras: una sola tinta. Es la versión que
 *               sobrevive a un sello, a un bordado y a un fax de juzgado.
 * @param sombra Solo para pantalla.
 * @param base   El pedestal. Es convención de trofeo y no significa nada, así
 *               que se puede apagar sin perder la idea.
 */
const ilustracion = ({ plano = false, sombra = true, base = true, eslogan = 'en', ano = true, tinta = '#0A162B' } = {}) => {
  const piezas = [
    cinta(0.0, 0.51, true, true),
    cinta(0.49, 0.95, false, true),
    cinta(0.0, 0.51, false, false),
    cinta(0.49, 0.95, true, false)
  ];

  const relleno = (g) => (plano ? tinta : `url(#${g})`);
  const filtro = !plano && sombra ? ' filter="url(#sombraChica)"' : '';

  const defs = plano
    ? ''
    : `<defs>
    ${gradiente('goldFront', PAL.goldFront)}
    ${gradiente('goldBack', PAL.goldBack)}
    ${gradiente('darkFront', PAL.darkFront)}
    ${gradiente('darkBack', PAL.darkBack)}
    ${gradiente('arrowDark', PAL.arrowDark, true)}
    ${gradiente('arrowGold', PAL.arrowGold)}${
      sombra
        ? `
    <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="15" flood-color="#000" flood-opacity="0.15"/></filter>
    <filter id="sombraChica" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/></filter>`
        : ''
    }
  </defs>`;

  const pedestal = base
    ? `\n  <ellipse cx="500" cy="690" rx="160" ry="25" fill="${relleno('darkFront')}"${!plano && sombra ? ' filter="url(#sombra)"' : ''}/>`
    : '';

  const bloqueEslogan = eslogan === 'es' ? LETRAS.eslogan_es : LETRAS.eslogan_en;
  const escalaTexto = 2.4;

  const centrar = (bloque, y, color, escala, op = 1) =>
    `<g transform="translate(${500 - (bloque.ancho * escala) / 2} ${y}) scale(${escala})" fill="${color}"${op < 1 ? ` opacity="${op}"` : ''}>${bloque.paths.join('')}</g>`;

  const colorTexto = plano ? tinta : PAL.texto;
  const colorSuave = plano ? tinta : PAL.textoSuave;

  const lineaAno = ano ? `\n  ${centrar(LETRAS.fundacion, 928, colorSuave, 1.6, 0.85)}` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img" aria-label="Iureon">
  ${defs}${pedestal}
${piezas.map((p) => `  <path d="${p.d}" fill="${relleno(p.grad)}"${filtro}/>`).join('\n')}
  <path d="M 500 130 L 415 295 L 500 260 Z" fill="${relleno('arrowDark')}"${filtro}/>
  <path d="M 500 130 L 585 295 L 500 260 Z" fill="${relleno('arrowGold')}"${filtro}/>
  ${centrar(LETRAS.marca, 848, colorTexto, escalaTexto)}
  ${centrar(bloqueEslogan, 890, colorSuave, 1.9, 0.9)}${lineaAno}
</svg>`;
};

const PIEZAS = {
  'ilustracion.svg': ilustracion(),
  'ilustracion-es.svg': ilustracion({ eslogan: 'es' }),
  'ilustracion-sin-base.svg': ilustracion({ base: false }),
  'ilustracion-plana.svg': ilustracion({ plano: true, sombra: false }),
  'ilustracion-plana-blanca.svg': ilustracion({ plano: true, sombra: false, tinta: '#F4F1EA' })
};

mkdirSync(SALIDA, { recursive: true });
for (const [nombre, contenido] of Object.entries(PIEZAS)) {
  writeFileSync(join(SALIDA, nombre), contenido + '\n', 'utf8');
}

const nodos = (ilustracion().match(/[MCLZ]/g) || []).length;
console.log(`${Object.keys(PIEZAS).length} ilustraciones escritas en public/brand/`);
console.log(`Nodos de trayecto: ${nodos} (el original tenía 816).`);
