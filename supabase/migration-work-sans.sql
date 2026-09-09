-- Work Sans entra a las tipografias de interfaz.
--
-- QUE RESUELVE. `user_preferences.ui_font` tiene un CHECK con la lista de
-- fuentes admitidas (migration-preferencias.sql, ampliado por
-- migration-fuente-satoshi.sql). El servidor y el frontend ya aceptan
-- 'worksans'; sin ampliar el CHECK, guardar la preferencia falla en la base
-- con una violacion de restriccion y la eleccion no persiste.
--
-- Se reemplaza el CHECK entero: la lista vive en tres sitios (este CHECK,
-- FUENTES en preferences.service.ts y UiFont en el frontend) y deben coincidir.
--
-- Idempotente: se puede correr dos veces.

DO $$
BEGIN
    ALTER TABLE public.user_preferences
        DROP CONSTRAINT IF EXISTS user_preferences_ui_font_check;

    ALTER TABLE public.user_preferences
        ADD CONSTRAINT user_preferences_ui_font_check
        CHECK (ui_font IN ('plex', 'jakarta', 'manrope', 'instrument', 'public', 'satoshi', 'worksans', 'system'));
END
$$;
