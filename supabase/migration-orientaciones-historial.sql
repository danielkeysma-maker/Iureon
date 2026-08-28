-- ==============================================================================
-- MIGRACIÓN: cada orientación queda guardada — la mitad de los casos se parecen
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. La orientación era efímera: el abogado describía los hechos, leía
-- las actuaciones propuestas y todo se perdía al salir de la pantalla. Pero la
-- mitad de los casos que entran a una firma se parecen a uno anterior, y la
-- consulta que no encontró nada vale todavía más: tres consultas iguales sin
-- actuación son la lista de trabajo exacta del catálogo — dicen qué curar
-- antes que cualquier métrica.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.orientaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    -- Los hechos como el abogado los escribió: el historial se busca por
    -- hechos, no por nombre de actuación, igual que la consulta misma.
    hechos TEXT NOT NULL,
    -- OK | SIN_COINCIDENCIA. Un "no encontré" también es un resultado que se
    -- archiva y se trabaja.
    status TEXT NOT NULL,
    -- Lo que el catálogo leyó: {rama, elementos[]}. Lectura del modelo.
    senales JSONB,
    -- Las actuaciones propuestas: [{id, nombre}]. Punteros al catálogo, no
    -- copias: la ficha vigente se resuelve al abrirla.
    sugerencias JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orientaciones_firma
    ON public.orientaciones(firm_id, created_at DESC);

ALTER TABLE public.orientaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_orientaciones" ON public.orientaciones;
CREATE POLICY "tenant_isolation_orientaciones"
    ON public.orientaciones FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());
