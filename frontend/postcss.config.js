/**
 * `postcss-import` va PRIMERO, y no es opcional.
 *
 * Vite resuelve un `@import` de CSS local DESPUÉS de que Tailwind procesó el
 * archivo, así que un `@apply` dentro del importado nunca se resuelve: la capa
 * de componentes se compilaba a nada y las clases `.btn-primary`, `.field` o
 * `.chip-verified` simplemente no existían en la salida. Lo peor es que no da
 * error — la aplicación compila y los botones salen sin estilo.
 *
 * Con este plugin los imports se pegan ANTES, así que Tailwind ve el archivo
 * completo. Comprobado mirando el CSS construido, no suponiéndolo.
 */
export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {}
  }
};
