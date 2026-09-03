-- ==============================================================================
-- MIGRACIÓN: versiones del escrito en el taller
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. En el taller el texto cambia muchas veces: se aplican
-- reemplazos, se edita a mano, se pide una revisión nueva. El abogado quiere
-- volver a ver cómo estaba antes —«se me fue algo que no debía irse», «el de
-- antes era mejor»— y comparar. Se guardan instantáneas del texto con fecha y
-- motivo (revisión nueva, guardado manual, antes de una consulta que cambió
-- el texto), acotadas a las últimas quince, junto al escrito al que pertenecen.
-- ==============================================================================

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS versiones JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS versiones JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.document_reviews.versiones IS
    'Instantáneas del texto de trabajo: [{fecha, motivo, texto, resumen?}], las últimas quince.';
COMMENT ON COLUMN public.saved_drafts.versiones IS
    'Instantáneas del texto del borrador en el taller: [{fecha, motivo, texto, resumen?}], las últimas quince.';
