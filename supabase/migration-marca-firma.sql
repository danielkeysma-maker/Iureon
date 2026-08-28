-- ==============================================================================
-- MIGRACIÓN: la marca y el formato de la firma viven en la firma
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. El membrete, la tipografía del escrito y el bloque de firma vivían
-- en el estado de React: se perdían al recargar la pestaña, y cada abogado de
-- la firma veía una marca distinta. El membrete es DE LA FIRMA — un escrito
-- exportado por cualquiera de sus abogados debe salir con el mismo.
--
-- JSONB y no columnas: es un documento de configuración que viaja entero y
-- cambia de forma cuando el diseño agrega opciones. La validación vive en el
-- servicio, no en el esquema.
-- ==============================================================================

ALTER TABLE public.firms
    ADD COLUMN IF NOT EXISTS branding JSONB;
