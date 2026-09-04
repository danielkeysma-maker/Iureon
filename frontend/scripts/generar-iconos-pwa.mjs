/**
 * Rasteriza el icono oficial de la aplicación (public/brand/app-icon-1024.svg)
 * a los PNG que exigen el manifest de la PWA, iOS y el badge de las
 * notificaciones. Sustituye al script provisional en Python, que dibujaba una
 * «I» genérica porque en ese momento no había rasterizador de SVG a mano.
 *
 * Uso (desde frontend/): npx --yes -p sharp node scripts/generar-iconos-pwa.mjs
 * `sharp` no se añade a las dependencias: se ejecuta una vez cuando cambia el
 * logo, no en cada build.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const icono = readFileSync(path.join(raiz, 'public/brand/app-icon-1024.svg'));
const mono = readFileSync(path.join(raiz, 'public/brand/mono-white.svg'));
const salida = (p) => path.join(raiz, 'public', p);

const tareas = [
  sharp(icono, { density: 384 }).resize(512, 512).png().toFile(salida('pwa/icon-512.png')),
  sharp(icono, { density: 384 }).resize(192, 192).png().toFile(salida('pwa/icon-192.png')),
  sharp(icono, { density: 384 }).resize(180, 180).png().toFile(salida('apple-touch-icon.png')),
  /* Maskable: el propio icono ya deja la marca en el 50 % central, dentro de la zona segura. */
  sharp(icono, { density: 384 }).resize(512, 512).png().toFile(salida('pwa/icon-maskable-512.png')),
  /* Badge: monocromo blanco sobre transparente, como pide Android para la barra de estado. */
  sharp(mono, { density: 384 }).resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(salida('pwa/badge-96.png'))
];

await Promise.all(tareas);
console.log('iconos PWA generados desde app-icon-1024.svg');
