-- ==============================================================================
-- MIGRACIÓN: el resumen y los hechos relevantes de una transcripción
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. El motor extrae de la transcripción un resumen y los hechos
-- relevantes, cada hecho anclado al minuto y al interlocutor que lo dijo. Esa
-- llamada al modelo cuesta dinero; sin esta columna, reabrir la transcripción
-- mañana la pagaría de nuevo. Generado una vez, guardado aquí, y solo se
-- regenera a pedido — que es lo correcto tras corregir intervenciones, porque
-- el resumen viejo resume un texto que ya no existe.
--
-- JSONB y no columnas sueltas: el resumen es un documento con forma propia
-- ({resumen, hechos[], modelo, generadoEl}) que viaja entero al cliente y no
-- se consulta por partes en SQL.
-- ==============================================================================

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS resumen JSONB;
