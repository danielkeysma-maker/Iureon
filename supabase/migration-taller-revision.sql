-- ==============================================================================
-- MIGRACIÓN: el taller de revisión — el escrito de trabajo y la conversación
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. Después del informe, el abogado corrige el escrito y sigue
-- hablando con el revisor. Ese trabajo no puede vivir solo en una pestaña: el
-- abogado sale a las cinco y vuelve mañana. Se guardan el texto original que
-- se revisó, el texto de trabajo con sus cambios y la conversación, junto al
-- informe, por firma.
--
-- CON AUTORIZACIÓN EXPRESA DE LA FIRMA. Hasta hoy el escrito revisado no se
-- conservaba, y así lo dice el manual. Conservarlo cambia lo que Iureon
-- guarda de la firma, así que lo decide un socio administrador una vez, con
-- su correo y su fecha, y queda en la auditoría. Sin esa autorización, el
-- taller funciona igual pero el texto y la conversación viven solo en la
-- sesión, y la pantalla lo dice.
-- ==============================================================================

ALTER TABLE public.firms
    ADD COLUMN IF NOT EXISTS guarda_escritos_revisados BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS guarda_escritos_por TEXT,
    ADD COLUMN IF NOT EXISTS guarda_escritos_el TIMESTAMPTZ;

COMMENT ON COLUMN public.firms.guarda_escritos_revisados IS
    'Autorización del socio administrador para que Iureon conserve el texto de los escritos revisados y su conversación con el revisor.';

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS texto_original TEXT,
    ADD COLUMN IF NOT EXISTS texto_trabajo TEXT,
    ADD COLUMN IF NOT EXISTS conversacion JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.document_reviews.texto_original IS
    'El texto del escrito tal como se revisó. NULL cuando la firma no autorizó conservar escritos.';
COMMENT ON COLUMN public.document_reviews.texto_trabajo IS
    'El texto con los cambios que el abogado hizo en el taller. NULL cuando la firma no autorizó conservar escritos.';
COMMENT ON COLUMN public.document_reviews.conversacion IS
    'Turnos del taller: [{rol: abogado|revisor, texto, ediciones?, fecha}]. Vacío cuando la firma no autorizó conservar.';
