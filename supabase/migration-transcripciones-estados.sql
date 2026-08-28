-- ==============================================================================
-- MIGRACIÓN: una audiencia se revisa; una entrevista se decide
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. Las dos listas nuevas no se ordenan por fecha sino por lo que FALTA:
-- una audiencia sin revisar no es un acta, y una entrevista sin decidir es un
-- cliente sin respuesta. Ninguno de esos dos estados existía en la tabla, así
-- que las listas solo podían ordenarse por fecha — que es justo lo que no
-- responde ninguna de las dos preguntas.
-- ==============================================================================

-- ─── AUDIENCIAS: LA REVISIÓN ──────────────────────────────────────────────────
--
-- "Acta lista" SOLO LO DA UNA PERSONA. La transcripción automática no es un
-- acta hasta que un humano la lee; por eso el estado nace en POR_REVISAR y no
-- hay ningún camino automático que lo cambie. Quién lo marcó y cuándo quedan
-- registrados, porque ese acto es el que convierte el texto en citable.
ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS estado_revision TEXT NOT NULL DEFAULT 'POR_REVISAR';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'transcriptions_revision_check'
    ) THEN
        ALTER TABLE public.transcriptions
            ADD CONSTRAINT transcriptions_revision_check
            CHECK (estado_revision IN ('POR_REVISAR', 'ACTA_LISTA'));
    END IF;
END $$;

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS revisada_por TEXT;

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS revisada_el TIMESTAMPTZ;

-- ─── ENTREVISTAS: LA DECISIÓN ─────────────────────────────────────────────────
--
-- Cada entrevista termina en una decisión: se toma el caso o se declina — y
-- DECLINAR TAMBIÉN SE REGISTRA, con su motivo. La firma necesita saber qué
-- está rechazando y por qué, y el consultante merece una respuesta. Una
-- entrevista sin decidir es el estado por defecto, no una celda vacía.
ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS decision TEXT NOT NULL DEFAULT 'SIN_DECIDIR';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'transcriptions_decision_check'
    ) THEN
        ALTER TABLE public.transcriptions
            ADD CONSTRAINT transcriptions_decision_check
            CHECK (decision IN ('SIN_DECIDIR', 'TOMADO', 'DECLINADO'));
    END IF;
END $$;

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS decision_motivo TEXT;

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS decidido_por TEXT;

ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS decidido_el TIMESTAMPTZ;

-- Un declinado sin motivo no le sirve a nadie: ni a la firma para revisar qué
-- rechaza, ni al consultante que espera una razón. Lo impone la base, no la
-- pantalla.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'transcriptions_declinar_con_motivo'
    ) THEN
        ALTER TABLE public.transcriptions
            ADD CONSTRAINT transcriptions_declinar_con_motivo
            CHECK (decision <> 'DECLINADO' OR decision_motivo IS NOT NULL);
    END IF;
END $$;

-- ─── ÍNDICE ───────────────────────────────────────────────────────────────────
-- Las dos listas piden "de esta firma, de este tipo, lo pendiente primero".
CREATE INDEX IF NOT EXISTS idx_transcriptions_firma_kind
    ON public.transcriptions(firm_id, kind, transcribed_at DESC);
