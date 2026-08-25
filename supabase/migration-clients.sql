-- ==============================================================================
-- MIGRACIÓN: tabla clients + vínculo con transcriptions
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

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    -- La cédula identifica a la persona ante el Estado, así que es la clave
    -- natural. Única POR FIRMA y no globalmente: dos despachos pueden atender
    -- al mismo ciudadano y ninguno debe enterarse del otro.
    document_id TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_firm_document
    ON public.clients(firm_id, document_id);

CREATE INDEX IF NOT EXISTS idx_clients_firm ON public.clients(firm_id);

-- ==============================================================================
-- La entrevista ES una transcripción de kind ENTREVISTA, atada a un cliente.
-- ==============================================================================
-- Una tabla `interviews` paralela habría duplicado segmentos, voces, roles y
-- todas sus correcciones. Una entrevista y una audiencia son la misma cosa
-- grabada en dos sitios distintos: lo único que las separa es de quién es.
--
-- ON DELETE SET NULL y no CASCADE: borrar la ficha de un cliente no puede
-- llevarse por delante el registro de lo que se dijo. La transcripción queda
-- huérfana y visible, que es reversible; borrada no lo es.
ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transcriptions_client ON public.transcriptions(client_id);

-- ==============================================================================
-- RLS
-- ==============================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_clients" ON public.clients;
CREATE POLICY "tenant_isolation_clients"
    ON public.clients FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.clients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;

-- anon no tiene nada que hacer aquí: los datos de un cliente son de su firma.
REVOKE ALL ON public.clients FROM anon;
