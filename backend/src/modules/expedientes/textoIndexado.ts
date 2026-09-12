/**
 * VOLVER A ARMAR EL TEXTO DE UN DOCUMENTO INDEXADO.
 *
 * ─── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
 *
 * Un documento indexado se podía listar y no LEER. La pantalla mostraba su
 * nombre y sus «56 fragmentos buscables», y al pulsarlo no pasaba nada — así
 * que el abogado tenía que creerle a la aplicación que ahí dentro estaba lo
 * que él subió, sin forma de comprobarlo.
 *
 * Y es la pregunta que más se hace cuando una búsqueda no encuentra algo:
 * «¿de verdad quedó esto adentro?». Sin poder mirar, la unica respuesta
 * posible era volver a indexar por si acaso — y un documento indexado dos
 * veces sale repetido en las busquedas y desplaza a otro que si hacia falta.
 *
 * ─── EL TEXTO ESTÁ, PARTIDO Y CON TRASLAPE ─────────────────────────────────
 *
 * Cada fragmento guarda su contenido y su orden. Pero se cortan de 400
 * palabras avanzando de 360, así que CADA UNO REPITE LAS 40 ÚLTIMAS PALABRAS
 * DEL ANTERIOR — el traslape existe para que una frase partida en dos no se
 * pierda al buscar.
 *
 * Pegarlos sin más devolvería un documento con cuarenta palabras repetidas en
 * cada costura. No falla, no avisa, y produce un texto que el abogado leería
 * como suyo estando mal: la peor forma de equivocarse aquí.
 *
 * Como el corte es determinista, deshacerlo también lo es: el primer fragmento
 * entero, y de cada uno de los siguientes se quitan sus primeras 40 palabras.
 *
 * ─── LO QUE ESTO NO ES, Y HAY QUE DECIRLO EN PANTALLA ──────────────────────
 *
 * NO es el PDF original. El archivo nunca sale del navegador —se lee ahí y
 * solo viaja su texto—, así que no hay nada que previsualizar: no existe copia
 * del documento en el servidor.
 *
 * Y el texto viene SIN SU DIAGRAMACIÓN. El troceo parte por espacios en
 * blanco, de modo que se pierden los saltos de párrafo y la sangría. Lo que se
 * devuelve es exactamente lo que la aplicación tiene guardado, que además es
 * lo que ven la búsqueda y el interrogatorio — y para la pregunta «¿quedó esto
 * adentro?» esa es la respuesta correcta, no una copia bonita.
 */

/** El mismo traslape con que `ingestion.service.ts` corta. Si allí cambia, aquí también. */
export const PALABRAS_DE_TRASLAPE = 40;

export interface FragmentoGuardado {
  chunk_index: number;
  content_chunk: string;
}

/**
 * Devuelve el texto del documento, sin las costuras repetidas.
 *
 * Ordena por `chunk_index` y no confía en el orden en que la base devolvió las
 * filas: sin `ORDER BY` explícito Postgres no promete ninguno, y un documento
 * armado en desorden se lee como si le faltaran páginas.
 */
export const textoDesdeFragmentos = (fragmentos: readonly FragmentoGuardado[]): string => {
  if (fragmentos.length === 0) return '';

  const ordenados = [...fragmentos].sort((a, b) => a.chunk_index - b.chunk_index);

  const partes = ordenados.map((f, i) => {
    if (i === 0) return f.content_chunk;
    /*
     * Se quitan las 40 primeras PALABRAS, no 40 caracteres ni un prefijo
     * literal: el troceo cuenta palabras, y comparar cadenas fallaría en
     * cuanto un espacio doble se normalizara de un lado y no del otro.
     */
    const palabras = f.content_chunk.split(/\s+/).filter(Boolean);
    return palabras.slice(PALABRAS_DE_TRASLAPE).join(' ');
  });

  return partes.filter((p) => p.length > 0).join(' ').trim();
};
