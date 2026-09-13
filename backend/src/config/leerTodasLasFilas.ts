/**
 * TODAS LAS FILAS DE UNA CONSULTA, POR PARTES, Y SI UNA PARTE FALLA, QUE SE DIGA.
 *
 * ─── EL DEFECTO QUE CIERRA, MEDIDO EN ESTE PROYECTO ────────────────────────
 *
 * Supabase sirve las consultas por PostgREST, y PostgREST corta cualquier
 * `select` en un máximo de filas SIN AVISAR. Medido el 13 de septiembre de 2026
 * contra esta base: `document_embeddings` tenía 7.922 filas y un `select` sin
 * rango devolvió 1.000, con `error` nulo. Nada falla: la lista simplemente se
 * acaba antes.
 *
 * Donde eso duele es en lo que se CUENTA en memoria: la consola del operador
 * suma transcritos, consumo de 30 días y catálogo curado leyendo filas. Pasadas
 * las mil, cada número sale por debajo del real, y un consumo contado de menos
 * hace que el saldo de una firma parezca durar más de lo que dura.
 *
 * ─── EL ORDEN ES OBLIGATORIO, NO COSMÉTICO ─────────────────────────────────
 *
 * Pedir por rangos (`range(0, 999)`, `range(1000, 1999)`…) sin un orden fijo no
 * es seguro: Postgres no promete el mismo orden entre dos consultas, y una fila
 * puede salir en dos partes o en ninguna. Por eso quien llama DEBE ordenar por
 * una columna única dentro de `pedirParte` — la guarda lo exige en cada uso.
 *
 * ─── POR QUÉ DEVUELVE LA FALLA EN VEZ DE LANZAR ────────────────────────────
 *
 * Misma razón que `listarTodasLasCuentas`: quien llama decide qué hacer con una
 * lectura incompleta. Lo que no puede hacer es no enterarse. Si una parte falla,
 * se devuelven las filas leídas hasta ahí CON la falla; esa lista no es la
 * completa.
 */

/** El máximo que sirve PostgREST en este proyecto, medido. Pedir más no trae más. */
export const FILAS_POR_PARTE = 1000;

export interface LecturaCompleta<T> {
  filas: T[];
  /** Nula si se leyeron TODAS las partes. Si trae texto, `filas` está incompleta. */
  falla: string | null;
}

export const leerTodasLasFilas = async <T>(
  pedirParte: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<LecturaCompleta<T>> => {
  const filas: T[] = [];
  for (let desde = 0; ; desde += FILAS_POR_PARTE) {
    let respuesta;
    try {
      respuesta = await pedirParte(desde, desde + FILAS_POR_PARTE - 1);
    } catch (err) {
      return { filas, falla: `filas ${desde}-${desde + FILAS_POR_PARTE - 1}: ${(err as Error).message}` };
    }
    const { data, error } = respuesta;
    if (error) return { filas, falla: `filas ${desde}-${desde + FILAS_POR_PARTE - 1}: ${error.message}` };
    const parte = data ?? [];
    filas.push(...parte);
    if (parte.length < FILAS_POR_PARTE) return { filas, falla: null };
  }
};
