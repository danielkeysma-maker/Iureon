-- ==============================================================================
-- BORRADO COMPLETO DE UNA FIRMA, VERSIÓN 3: TODO LO QUE ES DE LA FIRMA, Y LA
-- AUDITORÍA FUERA DE LA LISTA
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente
-- (CREATE OR REPLACE) y reemplaza a la de migration-borrar-firma-estilo.sql.
--
-- REQUIERE que ya hayan corrido: migration-expedientes.sql,
-- migration-expediente-carpetas.sql, migration-agenda-de-terminos.sql,
-- migration-actuaciones-de-la-firma.sql y todas las que ya exigía la versión
-- anterior. plpgsql no comprueba las tablas al crear la función sino al
-- ejecutarla: una tabla ausente la haría fallar entera, que es lo correcto
-- (mejor no borrar que borrar a medias), pero conviene saberlo antes.
--
-- POR QUÉ UN ARCHIVO NUEVO. Las dos versiones anteriores ya corrieron en la
-- base. Editarlas dejaría el repositorio diciendo una cosa y la base haciendo
-- otra, sin nada que avise de que falta volver a correrlas.
--
-- LOS DOS DEFECTOS QUE CORRIGE (hallados el 14 de septiembre de 2026):
--
--   1. FALTABAN TABLAS. Una firma que pedía la supresión de sus datos dejaba
--      en la base sus `expedientes`, los `expediente_actores` y las
--      `expediente_carpetas` de cada uno, su `agenda_terminos` con los
--      `agenda_avisos`, y las `firm_actuaciones` de su catálogo propio.
--      `borrar_expedientes_de_la_firma` (migration-expedientes.sql) se escribió
--      para las cuatro primeras y nadie la llamaba: ni esta función ni el
--      servidor. Esta versión NO la llama y borra esas tablas aquí mismo, por
--      dos razones: la lista de lo que se borra queda en UN solo sitio, que es
--      el que lee `npm run check:borrado-firma-completo`; y no se depende de
--      que otra función exista y siga al día. Aquella queda en la base, sin
--      uso.
--
--   2. BORRABA `audit_logs`, Y ESO LA HACÍA FALLAR ENTERA.
--      migration-auditoria-inmutable.sql pone en esa tabla un disparador que
--      rechaza TODO DELETE, también el de una función SECURITY DEFINER. Con los
--      dos archivos corridos, la función abortaba en ese paso, la transacción
--      se deshacía y la firma no se podía borrar. Ver «LO QUE NO SE BORRA».
--
-- EL ORDEN: PRIMERO LAS HIJAS, DESPUÉS LOS PADRES. Ninguna tabla tiene llave
-- foránea hacia `firms`, pero entre ellas sí hay: los documentos cuelgan de
-- carpetas, las carpetas y los actores de un expediente, cinco tablas apuntan
-- a `expedientes` con SET NULL, el expediente y la transcripción apuntan a
-- `clients`. Borrar un padre primero no rompería —las llaves son CASCADE o
-- SET NULL—, pero reescribiría con NULL filas que un instante después se
-- borran, y dejaría el resultado dependiendo de la acción de cada llave. Hijas
-- primero, y el orden deja de importar. El check lo verifica llave por llave.
--
-- LAS TABLAS SIN `firm_id` PROPIO (`expediente_carpetas`, `expediente_actores`,
-- `agenda_avisos`) se borran por su padre, con USING, y ANTES de borrar al
-- padre: después ya no quedaría cómo saber cuáles eran de esta firma.
--
-- LO QUE NO SE BORRA, Y POR QUÉ:
--   · `audit_logs`: inalterable por disparador (ver arriba). Queda con el
--     `firm_id` de una firma que ya no existe, el correo de cada usuario, la
--     IP y una descripción breve de cada acción. Si algún día hay que
--     purgarlo, el propio migration-auditoria-inmutable.sql dice cómo: con una
--     migración específica y documentada, no con un DELETE aquí. La constancia
--     de borrado que recibe la firma dice que ese registro se conserva.
--   · `trial_signups`, las cuentas de Supabase Auth y los archivos en B2: sin
--     cambios respecto de migration-borrar-firma.sql, donde está la razón.
--
-- `SYSTEM_CORPUS` sigue rechazado por nombre, y los permisos son los mismos.
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
