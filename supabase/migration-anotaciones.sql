-- ==============================================================================
-- MIGRACIÓN: resaltados, tachados y conversación sobre el escrito
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. El taller deja de ser solo de las revisiones: también se abre
-- sobre un borrador generado en Redacción, con la misma guía al lado. Y en
-- ambos casos el abogado puede resaltar en varios colores y tachar a mano.
-- Esas marcas se anclan al TEXTO citado, no a posiciones, para que sobrevivan
-- a las ediciones; se guardan como [{cita, color}] con la misma licencia de
-- guardado que el resto del taller.
--
-- En los borradores la conversación y las marcas se conservan junto al texto,
-- porque el borrador ya es de la firma y ya se guarda; no hace falta una
-- autorización aparte.
-- ==============================================================================

ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS conversacion JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS anotaciones JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.saved_drafts.conversacion IS
    'Turnos del taller sobre este borrador: [{rol: abogado|revisor, texto, ediciones?, referencias?, fecha}].';
COMMENT ON COLUMN public.saved_drafts.anotaciones IS
    'Resaltados y tachados del abogado, anclados al texto: [{cita, color}] con color en amarillo|verde|azul|rosa|tachado.';

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS anotaciones JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.document_reviews.anotaciones IS
    'Resaltados y tachados del abogado sobre el escrito revisado: [{cita, color}]. Se conservan solo si la firma autorizó el taller.';
