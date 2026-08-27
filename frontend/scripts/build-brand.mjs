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

/* ─── TIPOGRAFÍA ──────────────────────────────────────────────────────────
 *
 * ESTO EMPEZÓ EN GEORGIA Y ERA UN ERROR. Se eligió por "serif = serio", sin
 * preguntarse CUÁL serif: Georgia es de 1993 y se dibujó para monitores CRT de
 * baja resolución, con serifas gruesas y proporciones anchas. Lee como página
 * web de Windows 95, que es exactamente lo contrario de lo que este producto
 * quiere decir.
 *
 * Y HAY UN PROBLEMA LEGAL QUE DECIDE MÁS QUE EL GUSTO. Georgia, Constantia,
 * Candara, Segoe y Trebuchet son de Microsoft: su licencia permite mostrarlas
 * en pantalla, NO usarlas como marca registrada. Una identidad construida
 * sobre ellas nace impugnable. Lato, Montserrat, Open Sans y Roboto son Open
 * Font License, que sí permite uso comercial y conversión a trazados para un
 * logo.
 *
 * LA ELEGIDA ES PLUS JAKARTA SANS, y la decidio una prueba, no el gusto.
 *
 * Se comparo contra Inter, Libre Franklin, Archivo, Instrument Serif, Spectral,
 * Newsreader y Lora — todas de Google Fonts, todas OFL — renderizando el lockup
 * a tamano de lamina Y a veinte pixeles, que es el tamano al que esta marca se
 * va a ver el noventa por ciento del tiempo. A veinte pixeles Jakarta se
 * sostiene con mas fuerza que cualquier serif de la lista: las serifas de Lora
 * y Newsreader se enturbian, y los trazos finos de Instrument Serif se pierden.
 *
 * Un logo se elige por como sobrevive a su uso MAS FRECUENTE, no por como luce
 * en la lamina de presentacion.
 *
 * Y es de 2020, asi que no puede leerse como antigua — que era la queja que
 * mato a Georgia. Ademas YA ESTA CARGADA en la aplicacion: no agrega una cuarta
 * familia a las tres que ya viajan, y hace que el logo y la interfaz hablen el
 * mismo idioma tipografico en vez de convivir a la fuerza.
 *
 * PENDIENTE ANTES DE PUBLICAR FUERA: convertir el texto a TRAZADOS. Mientras
 * sea `<text font-family="Lato">`, la palabra se dibuja con la tipografía que
 * tenga el lector — y quien no tenga Lato verá otra marca. Dentro de la
 * aplicación no pasa porque la fuente se carga; en un SVG que viaje por correo,
 * sí. En Figma o Illustrator: `Texto → Contornos`.
 */
const FUENTE = "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif";
const PESO_MARCA = 700;
const PESO_DISPLAY = 500;

/* ─── EL WORDMARK ───────────────────────────────────────────────────────── */
const wordmark = (color, ancho = 300) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} 60" width="${ancho}" height="60" role="img" aria-label="Iureon">
  <text x="0" y="44" font-family="${FUENTE}" font-weight="${PESO_MARCA}" font-size="46" letter-spacing="7" fill="${color}">IUREON</text>
</svg>`;

/**
 * El eslogan y el ano fundacional, en piezas APARTE de la marca primaria.
 *
 * POR QUE NO VAN EN EL LOCKUP PRINCIPAL. La marca primaria vive en la cabecera
 * de la aplicacion y en el favicon, donde el nombre mide veinte pixeles de alto
 * y un renglon de "SMART JUSTICE" a esa escala no se lee: es una franja gris. Y
 * lo que no se lee no comunica, solo ensucia.
 *
 * Por eso hay tres niveles y cada uno tiene su sitio: la marca sola para la
 * aplicacion, la extendida con eslogan para presentaciones y firma de correo, y
 * la formal con el ano para membrete, contratos y papeleria.
 *
 * SOBRE "FOUNDED 2026", y lo digo una vez: un ano dentro del logo envejece con
 * el. En 2031 dice "llevamos cinco anos", que es informacion, pero en 2045 dira
 * "somos de otra epoca". Ademas obliga a rehacer el archivo si alguna vez se
 * discute la fecha de constitucion. Se incluye porque asi se pidio, y se aisla
 * en la version formal para que ese costo lo pague solo el membrete.
 *
 * En espanol tambien, porque el producto es colombiano y sus usuarios son
 * abogados colombianos: un eslogan en ingles en la firma de un correo a un
 * juzgado desentona.
 */
const ESLOGAN_EN = 'SMART JUSTICE';
const ESLOGAN_ES = 'JUSTICIA VERIFICADA';
const FUNDACION = 'FOUNDED 2026';

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
  <text x="88" y="47" font-family="${FUENTE}" font-weight="${PESO_MARCA}" font-size="34" letter-spacing="6" fill="${colorA}">IUREON</text>
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
  <text x="100" y="112" text-anchor="middle" font-family="${FUENTE}" font-weight="${PESO_MARCA}" font-size="28" letter-spacing="5" fill="${colorA}">IUREON</text>
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

/** Imagotipo vertical extendido: simbolo, nombre y eslogan. */
const verticalExtendido = ({ colorA, colorB, fondo = null, eslogan = ESLOGAN_EN, ano = null }) => {
  const alto = ano ? 168 : 152;
  const rect = fondo ? `
  <rect width="220" height="${alto}" fill="${fondo}"/>` : '';
  const lineaAno = ano
    ? `
  <text x="110" y="152" text-anchor="middle" font-family="${FUENTE}" font-weight="${PESO_DISPLAY}" font-size="10" letter-spacing="3" fill="${colorB}">${ano}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 ${alto}" width="220" height="${alto}" role="img" aria-label="Iureon — ${eslogan}">${rect}
  <g transform="translate(78 4)">
    <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="${HEBRA_B}" stroke="${colorB}"/>
      <path d="${HEBRA_A}" stroke="${colorA}"/>
    </g>
    <path d="${FLECHA}" fill="${colorA}"/>
  </g>
  <text x="110" y="110" text-anchor="middle" font-family="${FUENTE}" font-weight="${PESO_MARCA}" font-size="28" letter-spacing="5" fill="${colorA}">IUREON</text>
  <text x="110" y="132" text-anchor="middle" font-family="${FUENTE}" font-weight="${PESO_DISPLAY}" font-size="12" letter-spacing="5.5" fill="${colorA}" opacity="0.72">${eslogan}</text>${lineaAno}
</svg>`;
};

/** Imagotipo horizontal extendido: el eslogan bajo el nombre, no al lado. */
const horizontalExtendido = ({ colorA, colorB, fondo = null, eslogan = ESLOGAN_EN }) => {
  const rect = fondo ? `
  <rect width="360" height="72" fill="${fondo}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 72" width="360" height="72" role="img" aria-label="Iureon — ${eslogan}">${rect}
  <g transform="translate(4 4)">
    <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="${HEBRA_B}" stroke="${colorB}"/>
      <path d="${HEBRA_A}" stroke="${colorA}"/>
    </g>
    <path d="${FLECHA}" fill="${colorA}"/>
  </g>
  <text x="88" y="42" font-family="${FUENTE}" font-weight="${PESO_MARCA}" font-size="32" letter-spacing="6" fill="${colorA}">IUREON</text>
  <text x="90" y="60" font-family="${FUENTE}" font-weight="${PESO_DISPLAY}" font-size="11" letter-spacing="5" fill="${colorA}" opacity="0.72">${eslogan}</text>
</svg>`;
};

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

  // 13-16 · Extendidos con eslogan, para presentaciones y firma de correo
  'horizontal-tagline-light.svg': horizontalExtendido({ colorA: NAVY, colorB: GOLD }),
  'horizontal-tagline-dark.svg': horizontalExtendido({ colorA: HUESO, colorB: GOLD, fondo: CARBON }),
  'vertical-tagline-light.svg': verticalExtendido({ colorA: NAVY, colorB: GOLD }),
  'vertical-tagline-dark.svg': verticalExtendido({ colorA: HUESO, colorB: GOLD, fondo: CARBON }),

  // 17-18 · En español, para uso en Colombia
  'horizontal-tagline-es-light.svg': horizontalExtendido({ colorA: NAVY, colorB: GOLD, eslogan: ESLOGAN_ES }),
  'vertical-tagline-es-light.svg': verticalExtendido({ colorA: NAVY, colorB: GOLD, eslogan: ESLOGAN_ES }),

  // 19-20 · Formal con año fundacional: membrete, contratos, papelería
  'formal-light.svg': verticalExtendido({ colorA: NAVY, colorB: GOLD, ano: FUNDACION }),
  'formal-dark.svg': verticalExtendido({ colorA: HUESO, colorB: GOLD, fondo: CARBON, ano: FUNDACION }),

  // Monocromo. La prueba de fuego: mismas hebras, un solo color.
  'mono-black.svg': isotipo({ colorA: '#000000', colorB: '#000000' }),
  'mono-white.svg': isotipo({ colorA: '#FFFFFF', colorB: '#FFFFFF', grosor: 8, fondo: CARBON })
};

mkdirSync(SALIDA, { recursive: true });

for (const [nombre, contenido] of Object.entries(PIEZAS)) {
  writeFileSync(join(SALIDA, nombre), contenido + '\n', 'utf8');
}

console.log(`${Object.keys(PIEZAS).length} piezas escritas en public/brand/`);
console.log('Todas desde la misma geometría: cambiar HEBRA_A/HEBRA_B/FLECHA las cambia todas.');
