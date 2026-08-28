-- ==============================================================================
-- MIGRACIÓN: la auditoría se vuelve inalterable de verdad
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. La pantalla de auditoría dice «inalterable», y hasta esta migración
-- eso era una promesa de la aplicación, no una propiedad de los datos: el
-- código no tenía operación de editar ni borrar, pero cualquiera con acceso a
-- la base podía UPDATE o DELETE. Un registro que no se puede demostrar íntegro
-- no sirve ante un tercero — y la palabra «inalterable» solo se puede escribir
-- en la pantalla si la base la hace cumplir.
--
-- El disparador bloquea UPDATE y DELETE para todos, incluido el rol de
-- servicio. Si algún día una norma exige purgar un dato personal del registro,
-- ese caso se resuelve con una migración específica y documentada — no con un
-- DELETE silencioso.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.impedir_alterar_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'El registro de auditoría es inalterable: los eventos no se editan ni se borran.';
END;
$$;

DROP TRIGGER IF EXISTS trg_auditoria_inmutable ON public.audit_logs;
CREATE TRIGGER trg_auditoria_inmutable
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.impedir_alterar_auditoria();

REVOKE ALL ON FUNCTION public.impedir_alterar_auditoria() FROM PUBLIC;
