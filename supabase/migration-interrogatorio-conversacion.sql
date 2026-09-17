-- ─────────────────────────────────────────────────────────────────────────────
-- LA CONVERSACIÓN SOBRE UN INTERROGATORIO YA PREPARADO
--
-- Decisión del dueño, 16 de septiembre de 2026: después de recibir la tanda, el
-- colega quiere seguir hablando con la guía sobre ella —afinar una pregunta,
-- preguntar por dónde atacar una respuesta, pedir el orden de un tramo—, y cada
-- turno se cobra.
--
-- ─── POR QUÉ LA CONVERSACIÓN VIVE CON LA TANDA Y NO EN UNA TABLA APARTE ──────
--
-- Nace de ella, no se entiende sin ella y muere con ella: borrar el
-- interrogatorio tiene que llevarse lo que se habló encima. Con una tabla
-- aparte eso sería una FK más que recordar en el borrado de la firma —el mismo
-- olvido que ya dejó 194 filas huérfanas una vez—. Aquí se va con la fila y con
-- el `ON DELETE CASCADE` que el expediente ya tiene.
--
-- FORMATO: un arreglo de turnos `{rol: 'abogado'|'guia', texto, fecha}`. Es el
-- mismo que el taller usa en su conversación, para que la pantalla no tenga que
-- aprender dos.
--
-- Ejecutar en el SQL Editor de Supabase. Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.expediente_interrogatorios
    ADD COLUMN IF NOT EXISTS conversacion JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.expediente_interrogatorios.conversacion IS
    'Los turnos de la conversación sobre esta tanda: [{rol, texto, fecha}]. Se borra con ella, porque sin ella no se entiende.';
