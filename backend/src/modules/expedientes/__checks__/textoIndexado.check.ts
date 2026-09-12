/**
 * GUARDA DE LA RECONSTRUCCIÓN DEL TEXTO INDEXADO.
 *
 * Run with: npm run check:texto-indexado
 *
 * ─── LO QUE SE JUEGA ───────────────────────────────────────────────────────
 *
 * El abogado abre un documento indexado para comprobar que quedó completo. Si
 * la reconstrucción repite las costuras, lee su propio escrito con cuarenta
 * palabras duplicadas cada pocas líneas y concluye que la aplicación le rompió
 * el documento. Si se salta texto, concluye lo contrario y vuelve a indexar —
 * y un documento indexado dos veces sale repetido en las búsquedas.
 *
 * No falla, no avisa: solo produce un texto que se lee como suyo estando mal.
 *
 * ─── SE PRUEBA CONTRA EL TROCEADOR DE VERDAD ───────────────────────────────
 *
 * Los fragmentos de abajo NO se escriben a mano: se generan con el mismo corte
 * que usa la ingesta —400 palabras avanzando de 360— y se comprueba que
 * rearmarlos devuelve EXACTAMENTE el texto de partida. Un fixture escrito a
 * mano probaría la reconstrucción contra mi idea del corte, no contra el corte.
 */
import { textoDesdeFragmentos, PALABRAS_DE_TRASLAPE, type FragmentoGuardado } from '../textoIndexado';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/* La copia exacta de `splitTextIntoChunks`, para generar fragmentos de verdad. */
const trocear = (text: string, chunkSizeWords = 400, overlapWords = PALABRAS_DE_TRASLAPE): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  const paso = Math.max(1, chunkSizeWords - overlapWords);
  for (let i = 0; i < words.length; i += paso) {
    const chunk = words.slice(i, i + chunkSizeWords).join(' ');
    if (chunk.trim().length > 0) chunks.push(chunk);
    if (i + chunkSizeWords >= words.length) break;
  }
  return chunks.length > 0 ? chunks : [text];
};

const enFilas = (chunks: string[]): FragmentoGuardado[] =>
  chunks.map((c, i) => ({ chunk_index: i, content_chunk: c }));

/** Un texto de `n` palabras, cada una distinta: así una repetición se ve. */
const textoDe = (n: number): string =>
  Array.from({ length: n }, (_, i) => `p${i}`).join(' ');

console.log('TEXTO INDEXADO — rearmar sin repetir las costuras');
console.log('');

/* ─── 1. IDA Y VUELTA, EN VARIOS TAMAÑOS ─────────────────────────────────── */

for (const palabras of [50, 400, 401, 760, 1000, 3600]) {
  const original = textoDe(palabras);
  const trozos = trocear(original);
  const rearmado = textoDesdeFragmentos(enFilas(trozos));
  check(
    `${palabras} palabras (${trozos.length} fragmento(s)) vuelven exactas`,
    rearmado === original,
    rearmado === original ? '' : `salieron ${rearmado.split(' ').length}`
  );
}

/* ─── 2. LA COSTURA, QUE ES LO QUE SE PUEDE ROMPER EN SILENCIO ───────────── */

const LARGO = textoDe(1000);
const rearmado = textoDesdeFragmentos(enFilas(trocear(LARGO)));

check(
  'ninguna palabra sale repetida',
  new Set(rearmado.split(' ')).size === rearmado.split(' ').length,
  'con el traslape sin quitar, cuarenta palabras se repiten en cada costura'
);
check(
  'y no se pierde ninguna',
  rearmado.split(' ').length === 1000,
  `salieron ${rearmado.split(' ').length} de 1000`
);
check(
  'la palabra justo despues de la costura esta en su sitio',
  rearmado.split(' ')[400] === 'p400',
  'si el traslape se quitara del lado equivocado, aqui aparecería otra'
);

/* ─── 3. EL ORDEN NO SE HEREDA DE LA BASE ────────────────────────────────── */
/*
 * Sin `ORDER BY` explícito Postgres no promete ningún orden, y un documento
 * armado al revés se lee como si le faltaran páginas. La función ordena por
 * `chunk_index` en vez de confiar en cómo llegaron las filas.
 */
const desordenados = [...enFilas(trocear(textoDe(1000)))].reverse();
check(
  'llegando al reves, el texto sale igual de bien',
  textoDesdeFragmentos(desordenados) === textoDe(1000)
);

/* ─── 4. LOS BORDES ──────────────────────────────────────────────────────── */

check('sin fragmentos, cadena vacia', textoDesdeFragmentos([]) === '');
check(
  'un solo fragmento sale entero: no hay costura que quitar',
  textoDesdeFragmentos([{ chunk_index: 0, content_chunk: 'una sola frase corta' }]) === 'una sola frase corta',
  'quitarle 40 palabras a un documento corto lo dejaria vacio'
);
check(
  'un documento de menos de 40 palabras en dos fragmentos no se vacia del todo',
  textoDesdeFragmentos([
    { chunk_index: 0, content_chunk: 'hola mundo' },
    { chunk_index: 1, content_chunk: 'adios mundo' }
  ]) === 'hola mundo',
  'el segundo se queda sin nada al quitarle el traslape, y eso es correcto: no habia mas texto'
);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} comprobación(es) no pasaron.`);
  process.exitCode = 1;
} else {
  console.log('TODO BIEN — el documento vuelve a armarse palabra por palabra.');
}
