#!/usr/bin/env node
/**
 * Genera TODAS las piezas de marca desde una sola definición de geometría.
 *
 * POR QUÉ UN GENERADOR Y NO DOCE ARCHIVOS A MANO. Doce archivos dibujados por
 * separado se desincronizan: alguien ajusta el grosor del trazo en el favicon y
 * el imagotipo horizontal se queda con el viejo, y a partir de ahí la marca
 * tiene dos versiones de sí misma sin que nadie lo note. Aquí la forma se
 * define UNA vez y las doce piezas son proyecciones de ella.
 *
 * DE DÓNDE SALE ESTA FORMA. Del render 3D que se generó primero — dos hebras
 * entrelazadas que resuelven hacia arriba en una flecha — pero destilada a
 * geometría plana. El render no era vectorizable: su forma existía gracias al
 * mármol, al metal cepillado y a la sombra, y nada de eso sobrevive a 32px ni a
 * una tinta. La IDEA sí sobrevive; la ejecución fotográfica no.
 *
 * DECISIONES QUE VALE LA PENA CONOCER:
 *
 * - UN SOLO CRUCE, no dos y medio. El render tenía dos giros y medio, que a 32
 *   píxeles son una mancha. Un cruce basta para decir "entrelazado" y sigue
 *   legible en la pestaña del navegador, que es donde este logo va a vivir la
 *   mayor parte del tiempo.
 *
 * - SIN PEDESTAL. La base de mármol es convención de trofeo, no elemento de
 *   marca: no significa nada y a tamaño pequeño solo agrega masa.
 *
 * - TRAZO, NO CONTORNO RELLENO. Las hebras son `stroke` con `linecap` redondo,
 *   así que engordarlas para el modo oscuro es cambiar un número, no redibujar.
 *
 * - EL MODO OSCURO NO ES LA MARCA INVERTIDA. El azul marino desaparece sobre
 *   carbón, así que en oscuro esa hebra pasa a blanco cálido y los trazos
 *   engordan un punto: un trazo fino que se lee sobre blanco se pierde sobre
 *   negro.
 *
 * Correr con: node scripts/build-brand.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, '..', 'public', 'brand');

/* ─── PALETA ──────────────────────────────────────────────────────────────
 *
 * Dos colores y nada más. Un tercero obligaría a decidir cuál cede en la
 * versión a una tinta, y esa decisión ya está tomada aquí.
 */
const NAVY = '#14294A';
const GOLD = '#C8A046';
const HUESO = '#F4F1EA';
const CARBON = '#141821';

/* ─── LA GEOMETRÍA, EN UN LIENZO DE 64×64 ─────────────────────────────────
 *
 * Cuadrado a propósito: el favicon y el ícono de app son cuadrados, y una
 * forma diseñada en vertical obliga a recortarla para ellos — que es como se
 * mutila un logo sin darse cuenta.
 */
const HEBRA_A = 'M25 57C25 48 39 44 39 34C39 27 34 23 32 21';
const HEBRA_B = 'M39 57C39 48 25 44 25 34C25 27 30 23 32 21';
const FLECHA = 'M32 6L40 19H24Z';

/**
 * El isotipo.
 *
 * `colorA`/`colorB` son las dos hebras; en monocromo llegan iguales y la forma
 * tiene que seguir leyéndose — esa es la prueba de que no depende del color.
 */
const isotipo = ({ colorA, colorB, grosor = 7, fondo = null }) => {
  const rect = fondo ? `\n  <rect width="64" height="64" fill="${fondo}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Iureon">${rect}
  <g fill="none" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${HEBRA_B}" stroke="${colorB}"/>
    <path d="${HEBRA_A}" stroke="${colorA}"/>
  </g>
  <path d="${FLECHA}" fill="${colorA}"/>
</svg>`;
};

/**
 * El favicon que responde al modo del sistema, en UN archivo.
 *
 * Chrome y Firefox respetan `prefers-color-scheme` dentro del propio SVG. Aun
 * así se exportan las dos versiones sueltas, porque hay sitios que no aceptan
 * SVG y hay que darles PNG.
 */
const faviconAdaptativo = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Iureon">
  <style>
    .a { stroke: ${NAVY}; }
    .b { stroke: ${GOLD}; }
    .p { fill: ${NAVY}; }
    @media (prefers-color-scheme: dark) {
      .a { stroke: ${HUESO}; }
      .p { fill: ${HUESO}; }
    }
  </style>
  <g fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
    <path d="${HEBRA_B}" class="b"/>
    <path d="${HEBRA_A}" class="a"/>
  </g>
  <path d="${FLECHA}" class="p"/>
</svg>`;

/* ─── EL WORDMARK ─────────────────────────────────────────────────────────
 *
 * En texto vivo y no en trazados, a propósito para este repositorio: así se
 * puede leer, buscar y traducir, y pesa nada. Para imprenta y para terceros hay
 * que convertirlo a trazados (`Texto → Contornos`), o la palabra se dibuja con
 * la tipografía que el lector tenga.
 *
 * La serif es deliberada: es lo que hace que se lea como despacho jurídico y no
 * como aplicación de consumo.
 */
const wordmark = (color, ancho = 300) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} 60" width="${ancho}" height="60" role="img" aria-label="Iureon">
  <text x="0" y="44" font-family="Georgia, 'Times New Roman', serif" font-size="46" letter-spacing="6" fill="${color}">IUREON</text>
</svg>`;

/** Imagotipo horizontal: símbolo a la izquierda, nombre a la derecha. */
const horizontal = ({ colorA, colorB, fondo = null }) => {
  const rect = fondo ? `\n  <rect width="340" height="72" fill="${fondo}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 72" width="340" height="72" role="img" aria-label="Iureon">${rect}
  <g transform="translate(4 4)">
    <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="${HEBRA_B}" stroke="${colorB}"/>
      <path d="${HEBRA_A}" stroke="${colorA}"/>
    </g>
    <path d="${FLECHA}" fill="${colorA}"/>
  </g>
  <text x="88" y="47" font-family="Georgia, 'Times New Roman', serif" font-size="36" letter-spacing="5" fill="${colorA}">IUREON</text>
</svg>`;
};

/** Imagotipo vertical: símbolo arriba, nombre debajo. Para espacios estrechos. */
const vertical = ({ colorA, colorB, fondo = null }) => {
  const rect = fondo ? `\n  <rect width="200" height="132" fill="${fondo}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 132" width="200" height="132" role="img" aria-label="Iureon">${rect}
  <g transform="translate(68 4)">
    <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="${HEBRA_B}" stroke="${colorB}"/>
      <path d="${HEBRA_A}" stroke="${colorA}"/>
    </g>
    <path d="${FLECHA}" fill="${colorA}"/>
  </g>
  <text x="100" y="112" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" letter-spacing="4" fill="${colorA}">IUREON</text>
</svg>`;
};

/**
 * El ícono de app móvil NO es el favicon ampliado.
 *
 * iOS le aplica su propia máscara de esquinas y Android puede recortar más
 * todavía, así que el símbolo va con margen interno generoso: sin él, la punta
 * de la flecha se pierde en el recorte. Y lleva fondo opaco porque una tienda
 * no acepta transparencia.
 */
const iconoApp = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img" aria-label="Iureon">
  <rect width="1024" height="1024" fill="${NAVY}"/>
  <g transform="translate(256 256) scale(8)">
    <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="${HEBRA_B}" stroke="${GOLD}"/>
      <path d="${HEBRA_A}" stroke="${HUESO}"/>
    </g>
    <path d="${FLECHA}" fill="${HUESO}"/>
  </g>
</svg>`;

const PIEZAS = {
  // 1-2 · Favicon
  'favicon.svg': faviconAdaptativo(),
  'favicon-light.svg': isotipo({ colorA: NAVY, colorB: GOLD }),
  'favicon-dark.svg': isotipo({ colorA: HUESO, colorB: GOLD, grosor: 8 }),

  // 3 · Ícono de app
  'app-icon-1024.svg': iconoApp(),

  // 4-5 · Isotipo
  'isotipo-light.svg': isotipo({ colorA: NAVY, colorB: GOLD }),
  'isotipo-dark.svg': isotipo({ colorA: HUESO, colorB: GOLD, grosor: 8, fondo: CARBON }),

  // 6-7 · Wordmark
  'wordmark-light.svg': wordmark(NAVY),
  'wordmark-dark.svg': wordmark(HUESO),

  // 8-9 · Imagotipo horizontal
  'horizontal-light.svg': horizontal({ colorA: NAVY, colorB: GOLD }),
  'horizontal-dark.svg': horizontal({ colorA: HUESO, colorB: GOLD, fondo: CARBON }),

  // 10-11 · Imagotipo vertical
  'vertical-light.svg': vertical({ colorA: NAVY, colorB: GOLD }),
  'vertical-dark.svg': vertical({ colorA: HUESO, colorB: GOLD, fondo: CARBON }),

  // 12 · Monocromo. La prueba de fuego: mismas hebras, un solo color.
  'mono-black.svg': isotipo({ colorA: '#000000', colorB: '#000000' }),
  'mono-white.svg': isotipo({ colorA: '#FFFFFF', colorB: '#FFFFFF', grosor: 8, fondo: CARBON })
};

mkdirSync(SALIDA, { recursive: true });

for (const [nombre, contenido] of Object.entries(PIEZAS)) {
  writeFileSync(join(SALIDA, nombre), contenido + '\n', 'utf8');
}

console.log(`${Object.keys(PIEZAS).length} piezas escritas en public/brand/`);
console.log('Todas desde la misma geometría: cambiar HEBRA_A/HEBRA_B/FLECHA las cambia todas.');
