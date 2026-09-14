/**
 * En qué orden se pintan las dos zonas del desplegable de la actuación.
 *
 * ─── LA REGLA, Y POR QUÉ CAMBIA CON EL FILTRO ──────────────────────────────
 *
 * SIN TEXTO EN EL FILTRO, las tres salidas van ANTES de la lista del catálogo.
 * Es la regla que fijó el titular: quien abre la lista sin saber el nombre debe
 * ver primero que existe otra forma de llegar, y no descubrirla al fondo
 * después de recorrer cuarenta fichas.
 *
 * CON TEXTO EN EL FILTRO, las fichas que coinciden van PRIMERO, justo debajo de
 * la caja de búsqueda. El dueño lo reportó en producción: escribía «recurso» y
 * las coincidencias quedaban debajo del bloque de salidas, casi fuera de la
 * vista. Quien escribe ya está buscando un nombre, y lo que busca tiene que
 * aparecer donde está mirando. Las salidas siguen ahí, después: nunca se
 * filtran ni se mezclan con las fichas.
 *
 * Es una función pura y aparte para que `check:redaccion-cara` pruebe la regla
 * ejecutándola, no leyendo el orden del JSX.
 */
export type ZonaDelDesplegable = 'antesDeLaLista' | 'filas';

export function ordenDelDesplegable(filtro: string): ZonaDelDesplegable[] {
  return filtro.trim() ? ['filas', 'antesDeLaLista'] : ['antesDeLaLista', 'filas'];
}
