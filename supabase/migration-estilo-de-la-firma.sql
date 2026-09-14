-- ==============================================================================
-- MIGRACIÓN: el estilo de la firma, en lecciones que enseña el socio administrador
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
-- Correr ANTES que migration-borrar-firma-estilo.sql, que borra esta tabla.
--
-- POR QUÉ EXISTE. «Enseñar estilo» y «Sugerir jerga» estuvieron en pantalla
-- meses sin nada detrás: el servidor devolvía un perfil inventado, las
-- «ediciones aprendidas» eran una línea en la consola y las sugerencias de
-- jerga eran frases fabricadas. Se retiraron el 14 de septiembre de 2026. Esta
-- tabla es la base de la versión de verdad.
--
-- QUÉ GUARDA. Una fila por lección de estilo: la FORMA de un escrito de la
-- firma, ya anonimizada —estructura, orden de las secciones, fórmulas de
-- apertura y cierre, jerga preferida—, en `contenido` (JSONB). El alcance es
-- firma × rol (LITIGANTE | DESPACHO | SECRETARIA) × rama; `rama` NULL es el
-- estilo general del rol, que se usa cuando la rama del escrito no tiene
-- lecciones propias. La rama sale del escrito o del expediente, nunca de lo
-- que mande el navegador. `fuente` dice de dónde salió la lección y
-- `taught_by` quién la enseñó: solo el socio administrador (FIRM_ADMIN) enseña
-- y retira, y la auditoría tiene que poder nombrarlo.
--
-- QUÉ NO GUARDA, NUNCA. Ni el texto del escrito, ni nombres de partes, ni
-- cédulas, radicados, direcciones, cuantías o hechos del caso. La lección es la
-- forma sin el contenido: si una fila permitiera reconstruir de qué caso salió,
-- la anonimización falló y el defecto es del servidor, no de esta tabla.
--
-- EL SERVIDOR ENTRA CON LA LLAVE DE SERVICIO, que salta el RLS por diseño. Las
-- políticas de abajo son la segunda línea para cualquier otro camino; la
-- primera es que TODA consulta del backend a esta tabla filtre por `firm_id`.
-- Una consulta sin ese filtro le enseñaría a una firma el estilo de otra.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.estilo_lecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('LITIGANTE', 'DESPACHO', 'SECRETARIA')),
    -- NULL = estilo general del rol, el respaldo cuando la rama no tiene lecciones.
    rama TEXT NULL,
    fuente TEXT NOT NULL CHECK (fuente IN ('BORRADOR', 'ESCRITO_SUBIDO', 'EDICION')),
    -- La forma anonimizada. Nunca el texto del escrito.
    contenido JSONB NOT NULL,
    taught_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- La lectura de siempre: las lecciones de una firma para un rol y una rama, las
-- más recientes primero.
CREATE INDEX IF NOT EXISTS idx_estilo_lecciones_alcance
    ON public.estilo_lecciones(firm_id, rol, rama, created_at DESC);

ALTER TABLE public.estilo_lecciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_estilo_lecciones" ON public.estilo_lecciones;
CREATE POLICY "tenant_isolation_estilo_lecciones"
    ON public.estilo_lecciones FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- Los GRANT de schema.sql son una FOTO: solo alcanzan las tablas que existían
-- cuando se corrió. Una tabla creada después desde el SQL Editor nace con los
-- permisos por defecto de supabase_admin, que le dan a anon y a authenticated
-- el juego completo. Se quita todo y se devuelve lo justo.
--
-- SIN UPDATE, a propósito: una lección no se corrige, se retira y se enseña
-- otra. Así cada fila es lo que el socio enseñó ese día, y la auditoría de
-- ESTILO_ENSENADO / ESTILO_RETIRADO cuenta la historia completa.
REVOKE ALL ON public.estilo_lecciones FROM anon;
REVOKE ALL ON public.estilo_lecciones FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.estilo_lecciones TO authenticated;
GRANT ALL ON public.estilo_lecciones TO service_role;

COMMENT ON TABLE public.estilo_lecciones IS
    'Lecciones de estilo por firma, rol y rama (rama NULL = general del rol). Guarda la forma anonimizada del escrito, nunca su texto ni datos del caso. Enseña y retira solo el socio administrador.';
COMMENT ON COLUMN public.estilo_lecciones.contenido IS
    'Forma anonimizada: estructura, fórmulas y jerga. Nunca partes, cédulas, radicados, cuantías ni hechos.';

-- ==============================================================================
-- COMPROBACIÓN
-- ==============================================================================
-- Debe devolver una fila con rls_activo = true.
SELECT tablename, rowsecurity AS rls_activo
  FROM pg_tables
 WHERE schemaname = 'public' AND tablename = 'estilo_lecciones';


-- ==============================================================================
-- APARTE, Y COMENTADO: la tabla vieja `firm_style_profiles`
-- ==============================================================================
-- Nació en schema.sql para el «Enseñar estilo» simulado y ningún código la lee
-- ni la escribe. NO se borra en esta migración: primero hay que ver que esté
-- vacía. Correr a mano, en este orden:
--
-- 1) ¿Tiene filas?
-- select count(*) from public.firm_style_profiles;
--
-- 2) SOLO si el paso 1 devolvió 0. Correr migration-borrar-firma-estilo.sql
--    ANTES o DESPUÉS da igual: su función borra `firm_style_profiles` solo si
--    la tabla todavía existe.
-- drop policy if exists "tenant_isolation_firm_style_profiles" on public.firm_style_profiles;
-- drop table if exists public.firm_style_profiles;
--
-- Después de borrarla quedan referencias de nombre, sin efecto en ejecución:
-- schema.sql (secciones 5 y 8), diagnose.sql y la etiqueta de la constancia de
-- borrado en backend/src/modules/mail/avisos.mail.ts.
