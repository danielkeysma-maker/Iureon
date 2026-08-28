-- ==============================================================================
-- MIGRACIÓN: la autorización de grabación queda registrada, con su hora
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. La casilla «le informé que la entrevista se graba y lo autorizó»
-- era un cerrojo de interfaz: bloqueaba el grabador, pero no dejaba rastro.
-- La voz es un dato biométrico (Ley 1581 de 2012), y ante una queja la firma
-- necesita poder decir CUÁNDO se autorizó — una casilla que nadie recuerda no
-- es una autorización demostrable. La pantalla prometía menos de lo que el
-- diseño pedía justamente porque esta columna no existía; ahora existe y la
-- promesa se puede cumplir.
--
-- La revisión POR INTERVENCIÓN no necesita columna: vive dentro de cada
-- segmento del JSONB `segments` (campo `revisada`), porque es un atributo de
-- la intervención y viaja con ella al editarla, cortarla o moverla.
-- ==============================================================================

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS autorizo_grabacion_el TIMESTAMPTZ;
