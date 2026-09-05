-- ==============================================================================
-- BORRADO COMPLETO DE UNA FIRMA, DESDE LA CONSOLA DE OPERACIÓN
-- ==============================================================================
-- Idempotente: se puede correr las veces que haga falta. Exige que todas las
-- migraciones anteriores ya hayan corrido: plpgsql no comprueba las tablas al
-- crear la función sino al ejecutarla, y una tabla ausente la haría fallar
-- entera (lo cual es lo correcto: mejor no borrar que borrar a medias).
--
-- POR QUÉ EXISTE. Una firma que se va —o que pidió por escrito que se borre
-- lo suyo— tiene derecho a que no quede nada: ni escritos, ni revisiones, ni
-- transcripciones, ni clientes, ni pagos, ni saldo. Hasta ahora eso se hacía
-- a mano en la base, tabla por tabla, y siempre quedaba alguna: las tablas
-- con `firm_id` son más de veinte y ninguna tiene FOREIGN KEY hacia `firms`
-- (decisión de schema.sql: el tenant es un TEXT estampado, no una relación),
-- así que borrar la fila de `firms` no arrastra nada. Esta función enumera
-- las tablas UNA vez, aquí, y las borra todas en UNA transacción: o se va todo
-- o no se va nada, y nunca queda una firma medio borrada con transcripciones
-- huérfanas de un inquilino que ya no existe.
--
-- POR QUÉ ES UNA FUNCIÓN Y NO VEINTE DELETE DESDE EL SERVIDOR. Veinte
-- llamadas HTTP por PostgREST no son una transacción: si la undécima falla,
-- las diez anteriores ya se fueron. Una función plpgsql corre entera o no
-- corre, y devuelve cuántas filas borró por tabla para que la auditoría del
-- operador diga qué se llevó.
--
-- LO QUE NO SE BORRA, Y POR QUÉ:
--   · `trial_signups`: la regla «una prueba gratuita por dirección, para
--     siempre» vive en esa tabla y debe sobrevivir al borrado. Si borrar la
--     firma borrara su registro de prueba, bastaría pedir el borrado para
--     estrenar otra prueba gratuita con el mismo correo. La tabla se creó sin
--     FOREIGN KEY exactamente por esto (ver migration-prueba-gratuita.sql).
--   · Las cuentas de Supabase Auth: viven en `auth.users`, no en `public`, y
--     las borra el servidor con la API de administración después de que esta
--     función termine. Si se borraran antes y la función fallara, quedaría
--     una firma con datos y sin nadie que pudiera entrar.
--   · Los archivos en B2: no están en Postgres. El servidor los borra antes de
--     llamar aquí, y avisa si alguno no se pudo.
--
-- `SYSTEM_CORPUS` NO ES UNA FIRMA. Es el corpus público de derecho que
-- comparten todas (document_embeddings, legal_documents). Borrarlo dejaría a
-- la plataforma entera sin ley que citar; la función lo rechaza por nombre.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.borrar_firma_completa(p_firm_id TEXT)
RETURNS TABLE(tabla TEXT, filas BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
-- search_path fijo: una función SECURITY DEFINER que resolviera nombres por el
-- search_path del que llama podría ser desviada a una tabla homónima en otro
-- esquema.
SET search_path = public, pg_temp
AS $$
DECLARE
    v_filas BIGINT;
BEGIN
    IF p_firm_id IS NULL OR btrim(p_firm_id) = '' THEN
        RAISE EXCEPTION 'borrar_firma_completa: se requiere el id de la firma';
    END IF;
    IF p_firm_id = 'SYSTEM_CORPUS' THEN
        RAISE EXCEPTION 'borrar_firma_completa: SYSTEM_CORPUS es el corpus público compartido, no una firma';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.firms f WHERE f.firm_id = p_firm_id) THEN
        RAISE EXCEPTION 'borrar_firma_completa: no existe la firma %', p_firm_id;
    END IF;

    -- ── Material de trabajo ──────────────────────────────────────────────
    -- document_embeddings antes que legal_documents: la FK tiene CASCADE, pero
    -- hay trozos con firm_id y document_id NULL que el cascade no alcanza.
    DELETE FROM public.document_embeddings WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'document_embeddings'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.legal_documents WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'legal_documents'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.saved_drafts WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'saved_drafts'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.document_reviews WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'document_reviews'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.transcriptions WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'transcriptions'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.clients WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'clients'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.firm_style_profiles WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'firm_style_profiles'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.catalog_verifications WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'catalog_verifications'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.orientaciones WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'orientaciones'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.orientacion_diaria WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'orientacion_diaria'; filas := v_filas; RETURN NEXT;

    -- ── Cuentas: preferencias, lecturas del manual, avisos ───────────────
    DELETE FROM public.user_preferences WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'user_preferences'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.manual_reads WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'manual_reads'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.push_subscriptions WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'push_subscriptions'; filas := v_filas; RETURN NEXT;

    -- ── Soporte ──────────────────────────────────────────────────────────
    -- support_messages y support_access_views tienen su propio firm_id
    -- (desnormalizado para RLS) ADEMÁS del CASCADE por su padre. Se borran
    -- por firm_id primero: así también cae un mensaje cuyo hilo hubiera
    -- quedado, por lo que fuera, con otro firm_id.
    DELETE FROM public.support_messages WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'support_messages'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.support_conversations WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'support_conversations'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.support_access_views WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'support_access_views'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.support_access WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'support_access'; filas := v_filas; RETURN NEXT;

    -- ── Dinero ───────────────────────────────────────────────────────────
    DELETE FROM public.ai_usage WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'ai_usage'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.credit_movements WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'credit_movements'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.payment_intents WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'payment_intents'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.subscription_payments WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'subscription_payments'; filas := v_filas; RETURN NEXT;

    -- ── Auditoría de la firma ────────────────────────────────────────────
    -- Se va con la firma: su rastro era SUYO. El hecho del borrado queda en la
    -- auditoría de la firma del operador (lo escribe el servidor), que es la
    -- que sobrevive.
    DELETE FROM public.audit_logs WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'audit_logs'; filas := v_filas; RETURN NEXT;

    -- ── Y por último la firma ────────────────────────────────────────────
    DELETE FROM public.firms WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'firms'; filas := v_filas; RETURN NEXT;

    RETURN;
END;
$$;

-- ==============================================================================
-- GRANTS: solo el servidor.
-- ==============================================================================
-- Es SECURITY DEFINER, así que salta el RLS de todas las tablas: una firma que
-- pudiera invocarla podría borrar a otra pasando su id. La ejecuta únicamente
-- el rol de servicio, detrás de `requireSuperAdmin`, con motivo y con el
-- nombre de la firma escrito a mano para confirmar.
REVOKE ALL ON FUNCTION public.borrar_firma_completa(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.borrar_firma_completa(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.borrar_firma_completa(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.borrar_firma_completa(TEXT) TO service_role;
