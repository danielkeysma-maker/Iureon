-- ==============================================================================
-- IUREON - MIGRACIÓN: TABLA saved_drafts (Borradores Persistentes Multi-Tenant)
-- Ejecutar en Supabase SQL Editor después del schema principal
-- ==============================================================================

-- 1. Tabla de borradores guardados con aislamiento por firm_id
CREATE TABLE IF NOT EXISTS public.saved_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(255) NOT NULL,
    legal_text TEXT NOT NULL,
    jurisprudencia_citada JSONB DEFAULT '[]'::jsonb,
    excepciones_formuladas JSONB DEFAULT '[]'::jsonb,
    tokens_consumed INT DEFAULT 0,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para aislamiento multi-tenant y búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_saved_drafts_firm ON public.saved_drafts(firm_id);
CREATE INDEX IF NOT EXISTS idx_saved_drafts_user ON public.saved_drafts(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_drafts_firm_user ON public.saved_drafts(firm_id, user_email);

-- 3. RLS: Solo la firma propietaria puede acceder a sus borradores
ALTER TABLE public.saved_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation for Saved Drafts - Select"
ON public.saved_drafts FOR SELECT
USING (
    firm_id = NULLIF(current_setting('app.current_firm_id', true), '')
);

CREATE POLICY "Tenant Isolation for Saved Drafts - Insert"
ON public.saved_drafts FOR INSERT
WITH CHECK (
    firm_id = NULLIF(current_setting('app.current_firm_id', true), '')
);

CREATE POLICY "Tenant Isolation for Saved Drafts - Update"
ON public.saved_drafts FOR UPDATE
USING (
    firm_id = NULLIF(current_setting('app.current_firm_id', true), '')
);

CREATE POLICY "Tenant Isolation for Saved Drafts - Delete"
ON public.saved_drafts FOR DELETE
USING (
    firm_id = NULLIF(current_setting('app.current_firm_id', true), '')
);
