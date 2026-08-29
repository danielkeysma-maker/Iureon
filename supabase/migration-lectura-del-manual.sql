-- ==============================================================================
-- QUÉ HA LEÍDO CADA PERSONA DEL MANUAL
-- ==============================================================================
--
-- QUÉ RESUELVE, y por qué no era un adorno. El artboard 9a lo razona: un socio
-- necesita saber si el abogado nuevo leyó el artículo de verificación ANTES de
-- darle permisos de curaduría. Sin registro, esa pregunta no tiene respuesta.
--
-- Se declaró ausente durante un tiempo con la razón correcta —«es un dato por
-- usuario en el servidor y no existe»— pero eso describía el estado, no un
-- límite. La tabla es esta.
--
-- ─── POR QUÉ EN EL SERVIDOR Y NO EN EL NAVEGADOR ────────────────────────────
--
-- `localStorage` respondería la pregunta del socio con algo que solo sabe ese
-- teléfono: el mismo abogado en el computador aparecería sin haber leído nada.
-- En la pantalla cuyo tema entero es no confiar en lo que nadie comprobó, un
-- registro que no se puede consultar desde fuera no es un registro.
--
-- ─── LA LLAVE ES (FIRMA, PERSONA, ARTÍCULO) ─────────────────────────────────
--
-- La firma va en la llave aunque el correo ya sea único: es lo que permite al
-- socio preguntar «qué ha leído MI gente» sin poder ver la de otra firma, y lo
-- que hace que la política de aislamiento funcione igual que en el resto.
--
-- ─── SIN COLUMNA `LEIDO` ────────────────────────────────────────────────────
--
-- La fila EXISTE o no existe. Un booleano permitiría `leido = false`, que es un
-- estado sin significado: nadie «marca como no leído» un artículo, lo desmarca,
-- y eso es borrar la fila. Menos estados, menos formas de contradecirse.

CREATE TABLE IF NOT EXISTS public.manual_reads (
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    /* El id del artículo en `content/manual.ts`, no un número de orden: el
       orden del manual cambia y lo leído no debería mudarse de artículo. */
    article_id TEXT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (firm_id, user_email, article_id)
);

CREATE INDEX IF NOT EXISTS idx_manual_reads_persona
    ON public.manual_reads(firm_id, user_email);

ALTER TABLE public.manual_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_manual_reads" ON public.manual_reads;
CREATE POLICY "tenant_isolation_manual_reads"
    ON public.manual_reads FOR ALL
    USING (firm_id = current_setting('app.current_firm_id', true));
