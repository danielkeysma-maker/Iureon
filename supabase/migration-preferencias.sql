-- ==============================================================================
-- MIGRACIÓN: preferencias de apariencia, por persona
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ EN LA BASE Y NO EN `localStorage`. El diseño lo dice explícitamente:
-- "solo su sesión, en este y en sus demás dispositivos". Un abogado que trabaja
-- en el portátil del despacho y en el de la casa espera encontrar la misma
-- aplicación en los dos; `localStorage` le daría dos configuraciones distintas
-- sin decírselo, y la segunda parecería que se le borró.
--
-- SON DE LA PERSONA, NO DE LA FIRMA, y esa frontera es la que evita el error más
-- caro de una app de despacho: cambiarle el membrete a todos creyendo que se
-- cambiaba el propio. Lo de la firma —membrete, formato del escrito, roles— vive
-- en otras tablas y lo cambia un socio.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: una tabla creada después
-- nace sin permisos para la API. Por eso esta migración concede explícitamente.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    -- El correo y no un uuid: es lo que ya viaja en el token verificado y lo
    -- que el resto de los módulos usa para atribuir consumo y auditoría.
    user_email TEXT PRIMARY KEY,

    -- La firma se guarda para poder aislar por inquilino en RLS. Una preferencia
    -- es inocua, pero la regla de este esquema es que TODO lo de una persona
    -- quede dentro de su firma, sin excepciones que después haya que recordar.
    firm_id TEXT NOT NULL,

    /*
     * `system` | `light` | `dark`.
     *
     * TRES ESTADOS Y NO DOS: por defecto sigue al sistema operativo, que es lo
     * correcto porque quien trabaja de noche ya lo configuró en su equipo. Pero
     * forzarlo tiene que poder GANARLE al sistema, o "Claro siempre" no haría
     * nada justo cuando alguien lo elige.
     */
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),

    /*
     * La familia de la interfaz. La MONOESPACIADA no es elegible y por eso no
     * está aquí: términos, radicados y saldos van siempre en mono, que es lo que
     * impide confundir un 1 con una l en un radicado de veintitrés dígitos.
     */
    ui_font TEXT NOT NULL DEFAULT 'plex'
        CHECK (ui_font IN ('plex', 'jakarta', 'manrope', 'instrument', 'public', 'system')),

    /*
     * Cambia altos de fila y de control, NUNCA tamaños de letra: bajar la letra
     * para caber más filas es lo que convierte una tabla densa en ilegible.
     */
    density TEXT NOT NULL DEFAULT 'normal'
        CHECK (density IN ('compact', 'normal', 'comfortable')),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_firm ON public.user_preferences(firm_id);

-- ==============================================================================
-- RLS
-- ==============================================================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_user_preferences" ON public.user_preferences;
CREATE POLICY "tenant_isolation_user_preferences"
    ON public.user_preferences FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.user_preferences TO service_role;
GRANT SELECT ON public.user_preferences TO authenticated;
