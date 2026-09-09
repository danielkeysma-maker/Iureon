-- ==============================================================================
-- MIGRACIÓN: la curaduría se clava a la RAMA, no solo a la ficha
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente y NO borra
-- ninguna fila: cada verificación existente se conserva tal cual, y queda
-- clavada a la rama propia de su ficha, que es lo que siempre significó.
--
-- QUÉ RESUELVE. Desde hoy una ficha del Código General del Proceso puede
-- aparecer en varias ramas POR REMISIÓN: el recurso de reposición vive en
-- `civil/recurso-de-reposicion` y se alcanza también desde FAMILIA, SOCIETARIO,
-- INSOLVENCIA, PROPIEDAD_INTELECTUAL, CONTRATOS y CONSTITUCIONAL, porque el
-- CGP gobierna esos asuntos. Es UNA sola ficha; no se duplica.
--
-- Y ahí aparece el problema que esta migración existe para cerrar. La ficha
-- prestada llega a esas ramas con el término degradado a NO_VERIFICADO, porque
-- nadie leyó ese plazo para ellas. La firma puede verificarlo — es justo el
-- punto del producto. Pero con la llave vieja, `(firm_id, actuacion_id)`, ese
-- término escrito para FAMILIA se guardaría contra el mismo id que la ficha
-- civil y REEMPLAZARÍA el plazo del proceso civil, que sí está verificado y es
-- otro. Verificar en una rama movería el reloj de otra sin decirlo, que es
-- exactamente el defecto que todo este módulo existe para impedir.
--
-- POR QUÉ CADENA VACÍA Y NO NULL. `rama` forma parte de la llave primaria, y en
-- PostgreSQL dos filas con NULL en una columna de un índice único NO chocan
-- entre sí. Con NULL, una firma podría acabar con dos curadurías de la misma
-- ficha en la misma rama y ninguna regla que dijera cuál gana. La cadena vacía
-- sí choca, que es lo que se quiere. En el código, '' se lee como `null` y
-- significa «la rama propia de la ficha».
--
-- POR QUÉ NO SE VALIDA LA RAMA CONTRA UNA LISTA AQUÍ. Las ramas del catálogo
-- viven en el código, no en la base; una lista de veintiocho valores copiada a
-- un CHECK envejecería el día en que se añada una rama, y fallaría por el lado
-- peligroso: rechazando una verificación legítima. El backend ya rechaza una
-- rama desconocida y también una rama que no alcance esa ficha por remisión.
-- ==============================================================================

BEGIN;

-- ─── 1. La columna, con el valor que las filas viejas ya significaban ────────
ALTER TABLE public.catalog_verifications
    ADD COLUMN IF NOT EXISTS rama TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.catalog_verifications.rama IS
    'Rama en la que se verificó. Cadena vacía = la rama propia de la ficha. Distinta de la propia solo cuando esa rama alcanza la ficha por remisión al CGP.';

-- ─── 2. La llave primaria pasa a ser rama + ficha ───────────────────────────
-- Se hace en dos pasos y con guardas para que correr la migración dos veces no
-- falle. `DROP CONSTRAINT IF EXISTS` no basta por sí solo: hay que saber cómo
-- se llama la llave, y Postgres la nombra `<tabla>_pkey`.
DO $$
DECLARE
    nombre_pk TEXT;
    columnas_pk TEXT[];
BEGIN
    SELECT con.conname,
           array_agg(att.attname ORDER BY att.attname)
      INTO nombre_pk, columnas_pk
      FROM pg_constraint con
      JOIN pg_attribute att
        ON att.attrelid = con.conrelid
       AND att.attnum = ANY (con.conkey)
     WHERE con.conrelid = 'public.catalog_verifications'::regclass
       AND con.contype = 'p'
     GROUP BY con.conname;

    -- Ya está migrada: no se toca nada.
    IF columnas_pk @> ARRAY['rama'] THEN
        RAISE NOTICE 'catalog_verifications ya tiene la llave por rama; nada que hacer.';
        RETURN;
    END IF;

    IF nombre_pk IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.catalog_verifications DROP CONSTRAINT %I', nombre_pk);
    END IF;

    ALTER TABLE public.catalog_verifications
        ADD CONSTRAINT catalog_verifications_pkey
        PRIMARY KEY (firm_id, actuacion_id, rama);
END $$;

COMMIT;

-- ==============================================================================
-- COMPROBACIÓN (opcional, solo lectura)
-- ==============================================================================
-- Ninguna fila se pierde y todas quedan en la rama propia:
--
--   SELECT rama, count(*) FROM public.catalog_verifications GROUP BY rama;
--
-- Debe devolver una sola fila con rama = '' y el mismo total que había antes.
-- ==============================================================================

-- ==============================================================================
-- SI HUBIERA QUE VOLVER ATRÁS
-- ==============================================================================
-- Volver a la llave vieja solo es seguro mientras ninguna firma haya verificado
-- una ficha prestada, porque entonces habría dos filas con el mismo
-- (firm_id, actuacion_id) y la llave no se podría crear. Compruébelo primero:
--
--   SELECT firm_id, actuacion_id, count(*)
--     FROM public.catalog_verifications
--    GROUP BY firm_id, actuacion_id
--   HAVING count(*) > 1;
--
-- Si eso no devuelve nada:
--
--   ALTER TABLE public.catalog_verifications DROP CONSTRAINT catalog_verifications_pkey;
--   ALTER TABLE public.catalog_verifications
--       ADD CONSTRAINT catalog_verifications_pkey PRIMARY KEY (firm_id, actuacion_id);
--   ALTER TABLE public.catalog_verifications DROP COLUMN rama;
--
-- Si devuelve filas, NO se revierte borrando: cada una de esas filas es un
-- término que un socio de la firma leyó en la norma y firmó con su nombre.
-- ==============================================================================
