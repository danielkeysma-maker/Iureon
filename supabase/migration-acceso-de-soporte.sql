-- ==============================================================================
-- ACCESO DE SOPORTE — se pide, no se toma. Artboard 8a.
-- ==============================================================================
--
-- QUÉ RESUELVE. Hasta hoy, operación no podía leer NADA del material de una
-- firma: ni un escrito, ni un borrador, ni una transcripción. Esa restricción es
-- correcta y es la promesa que Privacidad le hace al cliente. Pero deja sin
-- salida un caso real: la firma reporta que un término aparece sin verificar en
-- un escrito ya generado, y soporte no puede reproducirlo sin ver ese escrito.
--
-- La respuesta no es abrir el acceso: es hacerlo PEDIBLE, TEMPORAL, VISIBLE y
-- REVOCABLE. Quien decide es un socio de la firma, no operación.
--
-- ─── EL ACCESO CADUCA POR CÁLCULO, NO POR UN TRABAJO PROGRAMADO ──────────────
--
-- No hay columna `activo`. Una sesión está activa si y solo si
--   status = 'AUTHORIZED' AND revoked_at IS NULL AND expires_at > now()
-- y esa condición se evalúa EN CADA LECTURA. La alternativa —un cron que marca
-- las vencidas— falla hacia el lado peligroso: si el trabajo no corre, el acceso
-- sobrevive a su plazo y nadie se entera. Aquí, si todo lo demás se cae, el
-- acceso se cierra solo.
--
-- ─── LA DURACIÓN ES DEL CATÁLOGO, NO DEL SOLICITANTE ────────────────────────
--
-- `duration_minutes` está restringido a 60, 240 y 1440 —las tres del artboard—.
-- Dejarlo libre permitiría pedir 20.000 minutos y que un socio lo autorizara sin
-- leer el número. Un plazo que se puede escribir a mano no es un plazo máximo.
--
-- ─── LO QUE SE ABRE, SE ANOTA ───────────────────────────────────────────────
--
-- Cada pantalla que soporte abra durante la sesión queda en `support_access_views`
-- Y en la auditoría de la firma. El panel «qué ha abierto» no es cortesía: es lo
-- que convierte la promesa en verificable. Sin él, «solo lectura» es una palabra.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.support_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,

    -- Quién pide. Siempre una cuenta de operación.
    requested_by TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- El motivo lo lee un socio ANTES de autorizar, así que no puede quedar
    -- vacío ni ser una palabra: sin motivo legible, autorizar es un trámite.
    motive TEXT NOT NULL CHECK (char_length(btrim(motive)) >= 30),

    -- Qué se pide ver, en las palabras del artboard: «Un escrito y su ficha».
    scope TEXT NOT NULL CHECK (char_length(btrim(scope)) >= 3),

    duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (60, 240, 1440)),

    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'AUTHORIZED', 'DENIED')),

    -- Quién decidió y cuándo. NULL mientras está pendiente.
    decided_by TEXT,
    decided_at TIMESTAMPTZ,

    -- Se calcula al autorizar: decided_at + duration. Nunca se prorroga —
    -- el artboard es explícito: «No hay prórroga automática: se vuelve a pedir».
    expires_at TIMESTAMPTZ,

    -- La revocación es un hecho aparte de la caducidad, y se conserva: saber que
    -- la firma cortó el acceso a los 12 minutos dice algo que el vencimiento no.
    revoked_at TIMESTAMPTZ,
    revoked_by TEXT,

    -- Una autorización sin fecha de decisión sería un acceso sin dueño, y una
    -- fecha de expiración sin autorización sería un acceso sin permiso.
    CONSTRAINT chk_decidida_tiene_autor CHECK (
        (status = 'PENDING' AND decided_by IS NULL AND decided_at IS NULL AND expires_at IS NULL)
        OR (status = 'DENIED' AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
        OR (status = 'AUTHORIZED' AND decided_by IS NOT NULL AND decided_at IS NOT NULL
            AND expires_at IS NOT NULL)
    ),

    CONSTRAINT chk_revocada_tiene_autor CHECK (
        (revoked_at IS NULL AND revoked_by IS NULL)
        OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND status = 'AUTHORIZED')
    )
);

CREATE INDEX IF NOT EXISTS idx_support_access_firm
    ON public.support_access(firm_id, requested_at DESC);

-- La consulta caliente es «¿hay acceso activo en esta firma AHORA?», y la hace
-- cada carga de la aplicación para decidir si pinta la franja ámbar.
CREATE INDEX IF NOT EXISTS idx_support_access_activas
    ON public.support_access(firm_id, expires_at)
    WHERE status = 'AUTHORIZED' AND revoked_at IS NULL;

-- SOLO UNA SOLICITUD PENDIENTE POR FIRMA A LA VEZ. Sin esto, operación podría
-- inundar a los socios con solicitudes hasta que alguna se autorice por cansancio.
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_access_una_pendiente
    ON public.support_access(firm_id)
    WHERE status = 'PENDING';

-- ==============================================================================
-- LO QUE SOPORTE ABRIÓ DURANTE LA SESIÓN
-- ==============================================================================
-- Se escribe desde el servidor en cada lectura autorizada, no desde el cliente:
-- un registro que el observado no controla y el observador tampoco.

CREATE TABLE IF NOT EXISTS public.support_access_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_id UUID NOT NULL REFERENCES public.support_access(id) ON DELETE CASCADE,
    firm_id TEXT NOT NULL,
    -- Qué se abrió, en lenguaje del abogado: «Borrador v4 · sección II».
    resource TEXT NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_views_access
    ON public.support_access_views(access_id, viewed_at DESC);
