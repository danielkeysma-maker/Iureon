-- ==============================================================================
-- BORRADO COMPLETO DE UNA FIRMA, VERSIÓN 4: TAMBIÉN LOS INTERROGATORIOS
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase, DESPUÉS de
-- migration-interrogatorios.sql. Es idempotente (CREATE OR REPLACE) y reemplaza
-- a la de migration-borrar-firma-completa-v3.sql.
--
-- POR QUÉ UN ARCHIVO NUEVO Y NO UNA EDICIÓN DE LA v3. La v3 ya corrió en la
-- base. Editarla dejaría el repositorio diciendo una cosa y la base haciendo
-- otra, sin nada que avise de que falta volver a correrla. Misma razón por la
-- que la v3 no editó a la v2.
--
-- QUÉ CAMBIA, Y NADA MÁS QUE ESO. `expediente_interrogatorios` es una tabla
-- nueva (migration-interrogatorios.sql) con `firm_id` propio y llave foránea a
-- `expedientes`: guarda cada tanda de interrogatorio preparada, con las
-- preguntas, las respuestas probables y las citas del expediente. Es material
-- privilegiado del cliente de la firma; una firma que pide la supresión de sus
-- datos no puede dejarlo atrás. Se borra ANTES que `expedientes`, como todo lo
-- que apunta a él: el orden deja de depender de la acción de cada llave.
--
-- El resto —el orden, las exclusiones, los permisos y el rechazo de
-- SYSTEM_CORPUS— es idéntico a la v3, cuya cabecera explica cada decisión.
--
-- LO QUE SIGUE SIN BORRARSE, y por qué está escrito en la v3:
--   · `audit_logs`: inalterable por disparador; un DELETE aborta la función
--     entera y la firma no se podría borrar.
--   · `trial_signups`, las cuentas de Supabase Auth y los archivos en B2.
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

    -- ── Documentos: primero los fragmentos, que cuelgan de ellos ─────────
    -- Por firm_id y no por cascada: hay fragmentos con document_id NULL.
    DELETE FROM public.document_embeddings WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'document_embeddings'; filas := v_filas; RETURN NEXT;

    -- Antes que las carpetas: legal_documents.carpeta_id apunta a ellas.
    DELETE FROM public.legal_documents WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'legal_documents'; filas := v_filas; RETURN NEXT;

    -- ── Lo que cuelga del expediente sin firm_id propio ──────────────────
    -- Un solo DELETE para todas las carpetas: las anidadas caen en la misma
    -- sentencia, y el CASCADE de padre_id no encuentra nada que añadir.
    DELETE FROM public.expediente_carpetas c
     USING public.expedientes e
     WHERE c.expediente_id = e.id AND e.firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'expediente_carpetas'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.expediente_actores a
     USING public.expedientes e
     WHERE a.expediente_id = e.id AND e.firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'expediente_actores'; filas := v_filas; RETURN NEXT;

    -- Los interrogatorios preparados. Tienen firm_id propio, así que se borran
    -- por él; van aquí, antes del expediente al que apuntan.
    DELETE FROM public.expediente_interrogatorios WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'expediente_interrogatorios'; filas := v_filas; RETURN NEXT;

    -- ── Material de trabajo que apunta al expediente (SET NULL) ──────────
    DELETE FROM public.saved_drafts WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'saved_drafts'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.document_reviews WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'document_reviews'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.transcriptions WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'transcriptions'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.orientaciones WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'orientaciones'; filas := v_filas; RETURN NEXT;

    -- ── Agenda: los avisos por su término, y el término antes que el caso ─
    DELETE FROM public.agenda_avisos av
     USING public.agenda_terminos t
     WHERE av.entrada_id = t.id AND t.firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'agenda_avisos'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.agenda_terminos WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'agenda_terminos'; filas := v_filas; RETURN NEXT;


    -- ── El expediente, y después el cliente al que apunta ────────────────
    DELETE FROM public.expedientes WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'expedientes'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.clients WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'clients'; filas := v_filas; RETURN NEXT;

    -- ── Conocimiento propio de la firma ──────────────────────────────────
    DELETE FROM public.firm_actuaciones WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'firm_actuaciones'; filas := v_filas; RETURN NEXT;

    -- Sin uso y en retiro: solo si la tabla sigue existiendo. Un DELETE directo
    -- sobre una tabla ausente haría fallar la función entera en ejecución.
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

    -- ── Soporte: cada hija antes que su padre ────────────────────────────
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

    -- audit_logs NO se toca: ver la cabecera.

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
