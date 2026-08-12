-- ==============================================================================
-- DIAGNÓSTICO — qué hay realmente en la base de datos
-- ==============================================================================
-- Pégalo en: Supabase -> SQL Editor -> New query -> Run
-- No modifica nada. Solo informa.
--
-- Para qué sirve: schema.sql usa CREATE TABLE IF NOT EXISTS, que NO altera una
-- tabla que ya existe con otra forma. Si una tabla vieja tiene columnas
-- distintas, el script pasará en verde y la aplicación seguirá fallando. Este
-- diagnóstico muestra ese caso antes de que ocurra.
-- ==============================================================================

-- 1. ¿Qué tablas existen y cuáles faltan?
SELECT
    esperada.tabla,
    CASE WHEN t.tablename IS NULL THEN 'FALTA' ELSE 'existe' END AS estado,
    COALESCE(t.rowsecurity::text, '-')                            AS rls_activo
FROM (
    VALUES
        ('firms'),
        ('legal_documents'),
        ('document_embeddings'),
        ('saved_drafts'),
        ('firm_style_profiles'),
        ('audit_logs'),
        ('catalog_verifications')
) AS esperada(tabla)
LEFT JOIN pg_tables t
       ON t.schemaname = 'public'
      AND t.tablename  = esperada.tabla
ORDER BY estado DESC, esperada.tabla;

-- 2. Columnas reales de cada tabla que sí existe.
--    Compáralas con supabase/schema.sql: si "firms" no tiene firm_id, es una
--    tabla de un esquema anterior y hay que migrarla o renombrarla.
SELECT table_name, ordinal_position AS n, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
      'firms', 'legal_documents', 'document_embeddings',
      'saved_drafts', 'firm_style_profiles', 'audit_logs',
      'catalog_verifications'
  )
ORDER BY table_name, ordinal_position;

-- 3. ¿Está instalada la extensión de vectores? Sin ella no hay búsqueda semántica.
SELECT extname AS extension, extversion AS version
FROM pg_extension
WHERE extname IN ('vector', 'uuid-ossp');

-- 4. Permisos concedidos. Un "permission denied" en la aplicación aparece aquí
--    como la ausencia de la fila correspondiente.
SELECT table_name, grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS permisos
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;

-- 5. ¿Existe la función de búsqueda vectorial?
SELECT proname AS funcion,
       CASE prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS modo
FROM pg_proc
WHERE proname = 'match_document_chunks_multi_tenant';
