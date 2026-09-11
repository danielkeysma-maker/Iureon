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
--
-- ==============================================================================
-- HISTÓRICA (10/09/2026): LA COLUMNA QUEDÓ SIN USO. NO HACE FALTA CORRERLA.
-- ==============================================================================
-- Las preguntas para la audiencia se llevaron al módulo de Expedientes, donde
-- se preparan por persona y no en tres cajones fijos. El camino viejo
-- —controlador, prompt, ruta y check— se retiró, así que nadie escribe ni lee
-- ya `preguntas_audiencia`.
--
-- LA COLUMNA SE DEJA EN PIE, y no por descuido. Antes de retirar el código se
-- comprobó contra la base de producción que no tiene UNA SOLA FILA no nula: no
-- hay un juego de preguntas generado y pagado que se quede huérfano. Un DROP
-- exige un SQL que corre el dueño y no gana nada; una columna vacía que nadie
-- toca no le cuesta nada a nadie.
-- ==============================================================================

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS preguntas_audiencia JSONB;

COMMENT ON COLUMN public.document_reviews.preguntas_audiencia IS
    'SIN USO desde el 10/09/2026: las preguntas para la audiencia se prepararon desde entonces en el módulo de Expedientes y nadie escribe ni lee esta columna. Se conserva vacía; se comprobó que no tenía filas no nulas antes de retirar el código que la llenaba.';
