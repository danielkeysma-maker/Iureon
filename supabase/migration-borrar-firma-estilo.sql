-- ==============================================================================
-- BORRADO COMPLETO DE UNA FIRMA: ENTRAN LAS LECCIONES DE ESTILO
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase, DESPUÉS de
-- migration-estilo-de-la-firma.sql. Es idempotente (CREATE OR REPLACE).
--
-- POR QUÉ UN ARCHIVO NUEVO Y NO EDITAR migration-borrar-firma.sql. Ese archivo
-- ya corrió en la base. Editarlo dejaría el repositorio diciendo una cosa y la
-- base haciendo otra, sin nada que avise de que falta volver a correrlo.
--
-- QUÉ CAMBIA. `borrar_firma_completa` enumera las tablas A MANO: una tabla
-- nueva que no se añade aquí queda en la base cuando la firma pide irse. Ya
-- pasó con `agenda_terminos`. Esta versión es la de migration-borrar-firma.sql
-- con dos cambios, y nada más:
--
--   1. Borra `estilo_lecciones`. Es material de la firma —la forma de sus
--      escritos, enseñada por su socio— y se va con ella.
--
--   2. `firm_style_profiles` se borra SOLO SI LA TABLA TODAVÍA EXISTE. Está sin
--      uso y migration-estilo-de-la-firma.sql deja comentado cómo retirarla. Un
--      DELETE directo sobre una tabla ausente haría fallar la función ENTERA en
--      ejecución —plpgsql no comprueba las tablas al crearla—, y una firma
--      imposible de borrar es peor que una tabla vieja. Con `to_regclass` el
--      orden entre retirar la tabla y correr este archivo deja de importar.
--
-- Lo demás —qué no se borra y por qué, SYSTEM_CORPUS, los GRANT— sigue siendo
-- lo documentado en migration-borrar-firma.sql.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.borrar_firma_completa(p_firm_id TEXT)
RETURNS TABLE(tabla TEXT, filas BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
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

    -- Sin uso y en retiro: solo si la tabla sigue existiendo (ver cabecera).
    IF to_regclass('public.firm_style_profiles') IS NOT NULL THEN
        EXECUTE 'DELETE FROM public.firm_style_profiles WHERE firm_id = $1' USING p_firm_id;
        GET DIAGNOSTICS v_filas = ROW_COUNT;
        tabla := 'firm_style_profiles'; filas := v_filas; RETURN NEXT;
    END IF;

    DELETE FROM public.estilo_lecciones WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'estilo_lecciones'; filas := v_filas; RETURN NEXT;

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

-- CREATE OR REPLACE conserva los permisos de la función, pero se repiten: si
-- este archivo corriera en una base donde la función no existía, nacería
-- ejecutable por PUBLIC, y es SECURITY DEFINER.
REVOKE ALL ON FUNCTION public.borrar_firma_completa(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.borrar_firma_completa(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.borrar_firma_completa(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.borrar_firma_completa(TEXT) TO service_role;
