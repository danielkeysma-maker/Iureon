-- ==============================================================================
-- MIGRACIÓN: las revisiones dicen de qué cliente o proceso son
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. La lista de revisiones anteriores mostraba archivo, actuación,
-- fecha y quién la pidió, pero no de qué asunto era: con tres tutelas de tres
-- clientes distintos, «tutela.pdf» tres veces no le dice nada al abogado que
-- vuelve una semana después. El cliente o proceso lo escribe quien pide la
-- revisión; es texto libre porque un litigante no siempre tiene el asunto
-- creado en la app cuando revisa el escrito.
-- ==============================================================================

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS cliente TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.document_reviews.cliente IS
    'Cliente o proceso al que pertenece el escrito revisado, escrito por quien pidió la revisión.';
