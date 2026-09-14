/**
 * Qué pantalla de Herramientas se abre, y cómo se busca en la portada.
 *
 * ─── POR QUÉ UN SOLO IDENTIFICADOR Y NO OCHO INTERRUPTORES ─────────────────
 *
 * Mientras cada calculadora fue un diálogo, la vista llevaba ocho booleanos, y
 * nada impedía que dos quedaran encendidos a la vez: la agenda abría el detalle
 * de festivos cerrándose primero a mano. Desde que cada una es una pantalla
 * entera, abierta hay a lo sumo una, y eso se escribe con un solo valor.
 *
 * ─── LO RECORDADO SE VALIDA ────────────────────────────────────────────────
 *
 * El identificador vive en `sessionStorage` y sobrevive a una recarga. Uno que
 * ya no existe —una calculadora retirada, un valor mal escrito— no abre una
 * pantalla vacía: abre la portada, que es donde se elige.
 */

export type IdDeHerramienta =
  | 'terminos'
  | 'intereses'
  | 'indexacion'
  | 'cuantia'
  | 'liquidacion'
  | 'agenda'
  | 'glosario'
  | 'calendario';

export const HERRAMIENTAS: readonly IdDeHerramienta[] = [
  'terminos',
  'intereses',
  'indexacion',
  'cuantia',
  'liquidacion',
  'agenda',
  'glosario',
  'calendario'
];

export const esHerramienta = (valor: unknown): valor is IdDeHerramienta =>
  typeof valor === 'string' && (HERRAMIENTAS as readonly string[]).includes(valor);

/**
 * LO QUE TRAE UN BORRADOR MANDA SOBRE LO RECORDADO. «Poner en la agenda» deja
 * el caso preparado y trae al abogado aquí; si se abriera la última calculadora
 * que usó, el botón habría cambiado de módulo sin hacer lo que promete.
 */
export const herramientaAlAbrir = (recordada: string | null, hayPendiente: boolean): IdDeHerramienta | null => {
  if (hayPendiente) return 'agenda';
  return esHerramienta(recordada) ? recordada : null;
};

/** Sin tildes ni mayúsculas: quien busca «indexacion» busca «Indexación». */
const normal = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const coincideConLaBusqueda = (textos: string[], busqueda: string): boolean => {
  const q = normal(busqueda.trim());
  if (!q) return true;
  return textos.some((t) => normal(t).includes(q));
};
