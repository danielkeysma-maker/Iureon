-- ==============================================================================
-- MIGRACIÓN: las revisiones de escritos se guardan para volver a leerlas
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. La revisión de un escrito cuesta saldo y produce un informe
-- que el abogado necesita releer días después, cuando corrige el escrito. La
-- primera versión no guardaba nada: cerrar el diálogo lo perdía. Se guarda EL
-- INFORME, no el documento: el escrito del abogado sigue leyéndose una sola
-- vez y descartándose; lo que queda es lo que la firma pagó.
--
-- RLS por firma, como todas las tablas de trabajo: una revisión es material
-- de la firma que la pidió y de nadie más. El servidor entra con la llave de
-- servicio; las políticas están para que ningún otro camino la salte.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.document_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    -- Contra qué ficha se revisó y de qué archivo venía. El nombre del archivo
    -- es lo único del documento que se conserva.
    document_type TEXT NOT NULL,
    legal_branch TEXT,
    file_name TEXT NOT NULL,
    pregunta TEXT NOT NULL DEFAULT '',
    caracteres INTEGER NOT NULL DEFAULT 0,
    truncado BOOLEAN NOT NULL DEFAULT FALSE,
    con_ficha BOOLEAN NOT NULL DEFAULT FALSE,
    -- El informe estructurado; si el modelo no dio JSON legible, el texto tal cual.
    informe JSONB,
    informe_libre TEXT,
    cobrado_cop NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_reviews_firm
    ON public.document_reviews(firm_id, created_at DESC);

ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_document_reviews" ON public.document_reviews;
CREATE POLICY "tenant_isolation_document_reviews"
    ON public.document_reviews FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

REVOKE ALL ON public.document_reviews FROM anon;
REVOKE ALL ON public.document_reviews FROM authenticated;

COMMENT ON TABLE public.document_reviews IS
    'Informes de revisión de escritos, por firma. Se guarda el informe y el nombre del archivo, nunca el texto del escrito.';
