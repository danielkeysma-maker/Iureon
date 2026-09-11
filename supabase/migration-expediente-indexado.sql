-- ==============================================================================
-- MIGRACIÓN: el expediente de 300 páginas — indexarlo y buscarlo DENTRO del caso
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- ── EL PROBLEMA QUE RESUELVE ─────────────────────────────────────────────────
--
-- La revisión corta el texto en 300.000 caracteres y lo dice. Para un escrito
-- de veinte páginas eso sobra; para un expediente de trescientas, no alcanza —
-- y ningún motor lee trescientas páginas de un tirón, ni cabría en el reloj de
-- la función.
--
-- La pieza que lo resuelve ya estaba construida y funcionando: el corpus de
-- jurisprudencia parte los documentos en fragmentos, los vectoriza y recupera
-- los que vienen al caso. Es lo que sostiene las 62 providencias buscables.
-- Incluso el endpoint existe —`POST /api/documents/ingest`, cuyo comentario
-- dice literalmente «vectorización de expedientes PDF»—.
--
-- Lo que faltaba es que esos fragmentos supieran DE QUÉ CASO son.
--
-- ── MEDIDO ANTES DE ESCRIBIR ESTO, para no construir contra un miedo ────────
--
-- Con el Código General del Proceso entero como documento de prueba —336
-- páginas, 765.835 caracteres, texto jurídico real—:
--
--     fragmentos de 400 palabras ......... 295
--     peticiones al proveedor (lotes de 8)  37
--     a 1 s por petición ................. 37 s   (el tope de Vercel son 300)
--     el texto plano pesa ................ 0,73 MB (el tope de cuerpo, 4,5 MB)
--
-- Se temía que 340 fragmentos no cupieran en una petición y hubiera que
-- indexar por tandas o montar una cola. No hace falta: van en lotes de ocho y
-- caben holgados. El miedo era razonable y estaba equivocado, y por eso se
-- midió antes de construir la cola que no se necesitaba.
--
-- ── POR QUÉ EL FILTRO POR EXPEDIENTE NO ES OPCIONAL ─────────────────────────
--
-- Hoy la búsqueda trae las filas de la firma más las del corpus compartido. Sin
-- una columna de caso, preparar el interrogatorio de «Mosquera» buscaría
-- también dentro de los expedientes de los demás clientes de la firma. No es
-- una fuga entre firmas —el aislamiento por `firm_id` sigue intacto— pero sí
-- traer al motor el caso de otro cliente, que es exactamente lo que un abogado
-- no puede permitirse.
-- ==============================================================================


-- ==============================================================================
-- 1. DE QUÉ CASO ES CADA FRAGMENTO
-- ==============================================================================
-- NULO para todo lo que ya existe, y eso es lo correcto: el corpus de
-- jurisprudencia no es de ningún expediente, y los documentos que la firma
-- indexó antes de que esto existiera tampoco. Un fragmento sin caso se sigue
-- viendo desde toda la firma, como hasta hoy.
ALTER TABLE public.document_embeddings
    ADD COLUMN IF NOT EXISTS expediente_id UUID
    REFERENCES public.expedientes(id) ON DELETE CASCADE;

-- ── CASCADE Y NO SET NULL, y es la excepción a la regla del expediente ──────
--
-- Las otras cinco tablas se DESATAN al borrar el expediente, porque una
-- revisión pagada o un vencimiento que corre valen por sí mismos. Un fragmento
-- vectorizado NO: es un pedazo de 400 palabras sin título ni contexto, que solo
-- significa algo dentro del documento del que salió. Desatarlo dejaría cientos
-- de trozos anónimos flotando en el índice de la firma, apareciendo en
-- búsquedas de otros casos sin que nadie sepa de dónde vinieron.
--
-- Borrar la carpeta sí se lleva su índice. Se puede volver a indexar el
-- documento; no se puede reconstruir de qué caso era un párrafo suelto.

CREATE INDEX IF NOT EXISTS idx_embeddings_expediente
    ON public.document_embeddings(expediente_id) WHERE expediente_id IS NOT NULL;


-- ==============================================================================
-- 2. LA BÚSQUEDA APRENDE A ENCERRARSE EN UN CASO
-- ==============================================================================
-- Se AÑADE un parámetro con valor por defecto en vez de cambiar la firma de la
-- función: así las llamadas de hoy —el buscador de jurisprudencia, que pasa
-- tres argumentos— siguen funcionando sin tocar una línea, y la nueva pasa
-- cuatro.
--
-- `filter_expediente_id` NULO significa «como siempre»: la firma entera más el
-- corpus. Con un id, se acota a los fragmentos de ESE expediente más el corpus
-- compartido —que sigue entrando, porque la jurisprudencia pública es de todos
-- los casos—.
CREATE OR REPLACE FUNCTION public.match_document_chunks_multi_tenant(
    query_embedding vector(1024),
    match_count INT DEFAULT 5,
    filter_firm_id TEXT DEFAULT NULL,
    filter_expediente_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id TEXT,
    firm_id TEXT,
    branch TEXT,
    file_name TEXT,
    metadata JSONB,
    content_chunk TEXT,
    similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        de.id,
        de.document_id,
        de.firm_id,
        de.branch,
        de.file_name,
        de.metadata,
        de.content_chunk,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM public.document_embeddings de
    WHERE de.embedding IS NOT NULL
      AND (de.firm_id = filter_firm_id OR de.firm_id = 'SYSTEM_CORPUS')
      -- Sin expediente pedido, todo como antes. Con expediente, solo ese caso
      -- y el corpus público: el caso del cliente de al lado no entra.
      AND (
        filter_expediente_id IS NULL
        OR de.expediente_id = filter_expediente_id
        OR de.firm_id = 'SYSTEM_CORPUS'
      )
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_document_chunks_multi_tenant(vector, INT, TEXT, UUID)
    TO authenticated, service_role;


-- ==============================================================================
-- 3. Y EL BORRADO DE FIRMA SE LOS LLEVA
-- ==============================================================================
-- `borrar_firma_completa` ya borra `document_embeddings` por `firm_id`, así que
-- los fragmentos de un expediente se van con la firma sin tocar nada. Se deja
-- dicho para que la próxima persona no lo busque: no falta nada aquí.


-- ==============================================================================
-- 4. COMPROBACIÓN
-- ==============================================================================
-- Debe devolver dos filas: la columna nueva y la función con sus CUATRO
-- argumentos.
SELECT 'columna' AS que, table_name || '.' || column_name AS nombre
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'document_embeddings'
   AND column_name = 'expediente_id'
UNION ALL
SELECT 'funcion', p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname = 'match_document_chunks_multi_tenant'
   AND pg_get_function_arguments(p.oid) LIKE '%filter_expediente_id%';
