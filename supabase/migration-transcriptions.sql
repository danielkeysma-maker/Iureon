-- ==============================================================================
-- MIGRACIÓN: tabla transcriptions
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: solo alcanzan las tablas
-- que existían cuando corrieron. Una tabla creada después nace sin permisos
-- para la API — la petición responde "permission denied" aunque la política RLS
-- esté perfecta — y con los privilegios por defecto de anon intactos. Por eso
-- esta migración concede y revoca explícitamente en vez de confiar en aquello.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    source_file_name TEXT NOT NULL,
    full_text TEXT NOT NULL,
    segments JSONB NOT NULL DEFAULT '[]'::jsonb,
    speaker_labels JSONB NOT NULL DEFAULT '[]'::jsonb,
    language TEXT,
    duration_seconds NUMERIC,
    model TEXT NOT NULL,
    transcribed_at TIMESTAMPTZ NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_firm ON public.transcriptions(firm_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_firm_user ON public.transcriptions(firm_id, user_email);

-- Aislamiento por firma, igual que saved_drafts.
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_transcriptions" ON public.transcriptions;
CREATE POLICY "tenant_isolation_transcriptions"
    ON public.transcriptions FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- Permisos: el REVOKE va primero. Conceder cuatro privilegios sobre un ALL
-- preexistente no quita nada.
REVOKE ALL ON public.transcriptions FROM anon;
REVOKE ALL ON public.transcriptions FROM authenticated;

GRANT ALL PRIVILEGES ON public.transcriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transcriptions TO authenticated;

-- Comprobación: debe devolver una fila con rowsecurity = true.
SELECT relname, relrowsecurity AS rls_activo
FROM pg_class
WHERE relname = 'transcriptions';
