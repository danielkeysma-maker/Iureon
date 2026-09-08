-- ==============================================================================
-- MIGRACIÓN: preguntas para la audiencia, guardadas junto a la revisión
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. Desde el taller el abogado pide a la guía tres listas de
-- preguntas para la audiencia (a la contraparte, a sus testigos, a los
-- testigos de la contraparte) a partir del escrito revisado. El último juego
-- generado se conserva con los parámetros con que se pidió (posición, qué
-- quiere probar, tipo de audiencia), para que al recargar siga en pantalla
-- sin volver a pagar.
--
-- SIN ESTA COLUMNA LA FUNCIÓN SIGUE SIRVIENDO: las preguntas viajan en la
-- respuesta y el servidor solo avisa en consola que no pudo guardarlas.
-- ==============================================================================

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS preguntas_audiencia JSONB;

COMMENT ON COLUMN public.document_reviews.preguntas_audiencia IS
    'Último juego de preguntas para la audiencia: {parametros: {posicion, quiereProbar?, audiencia?}, preguntas: {contraparte[], misTestigos[], testigosContraparte[]}, generadoEl, por}. NULL si nunca se pidió.';
