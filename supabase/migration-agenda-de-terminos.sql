-- ==============================================================================
-- MIGRACIÓN: agenda de términos de la firma
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada ni pierde una fila.
--
-- POR QUÉ EXISTE. La tarjeta del calendario judicial pintaba días hábiles,
-- festivos y vacancia — el calendario del país, igual para todo el mundo. Lo
-- que el titular pidió es otra cosa: «este día se me viene este proceso y tengo
-- tantos días para responder». Eso no es un calendario, es un registro de
-- vencimientos DE LA FIRMA, y hasta hoy no existía en ninguna tabla.
--
-- LOS GRANT DE schema.sql SON UNA FOTO, NO UNA REGLA: solo alcanzan las tablas
-- que existían cuando corrieron. Una tabla creada después nace sin permisos
-- para la API — la petición responde "permission denied" con la política RLS
-- perfecta — y con los privilegios por defecto de anon intactos. Por eso esta
-- migración concede y revoca explícitamente.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agenda_terminos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,

    -- CÓMO RECONOCE EL ABOGADO LA ENTRADA ENTRE TREINTA. El asunto es
    -- obligatorio porque un vencimiento sin caso no se puede atender; el
    -- radicado es opcional porque muchos términos corren ANTES de que exista
    -- (el de presentar la demanda, el de un recurso administrativo).
    asunto TEXT NOT NULL,
    radicado TEXT,
    cliente TEXT,

    -- LA ACTUACIÓN DEL CATÁLOGO. `actuacion_id` es NULL cuando la actuación no
    -- está catalogada; el nombre se guarda SIEMPRE, porque el catálogo es un
    -- artefacto de compilación y una ficha puede cambiar de identificador entre
    -- versiones: si solo se guardara el id, una entrada vieja quedaría sin
    -- nombre que mostrar. El nombre viaja tal cual vino del catálogo — es el
    -- mismo contrato que tiene el motor de redacción.
    actuacion_id TEXT,
    actuacion_nombre TEXT NOT NULL,
    rama TEXT,

    -- ─── EL VENCIMIENTO SE CALCULA, NO SE ESCRIBE ─────────────────────────────
    --
    -- `fecha_notificacion` es el hecho que el abogado conoce: el día en que le
    -- notificaron. `fecha_limite` la calcula el SERVIDOR con el mismo motor del
    -- contador de términos (CGP art. 118, festivos de la Ley 51 de 1983,
    -- vacancia del Decreto 1660 de 1978), nunca el navegador.
    --
    -- `dias_termino` y `tipo_dias` quedan escritos junto al resultado para que
    -- la cuenta se pueda rehacer años después: una fecha límite sin el plazo
    -- del que salió es un número que nadie puede auditar.
    fecha_notificacion DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    dias_termino INTEGER,
    tipo_dias TEXT CHECK (tipo_dias IN ('HABILES', 'CALENDARIO')),

    -- ─── SI NADIE COMPROBÓ EL PLAZO, LA ENTRADA LO DICE ───────────────────────
    --
    -- `termino_verificado` es verdadero SOLO cuando el plazo salió de una ficha
    -- del catálogo cuyo término está VERIFICADO y del que se pudo leer una
    -- cantidad de días inequívoca. En cualquier otro caso es falso y la pantalla
    -- lo marca: el abogado tiene derecho a saber si el reloj que ve lo confirmó
    -- alguien o lo escribió él.
    --
    -- `origen_fecha` distingue las dos formas de llegar a la fecha límite:
    -- CALCULADA (el motor contó los días) o MANUAL (el abogado escribió la
    -- fecha porque la ficha no fija plazo o no está catalogada). Una fecha
    -- MANUAL nunca es `termino_verificado`.
    termino_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    origen_fecha TEXT NOT NULL DEFAULT 'CALCULADA' CHECK (origen_fecha IN ('CALCULADA', 'MANUAL')),
    -- La frase literal de la ficha de la que se leyó el plazo. Se guarda para
    -- que la afirmación sea comprobable sin abrir el catálogo, y porque una
    -- ficha corregida después no debe reescribir en silencio la razón por la
    -- que esta entrada quedó como quedó.
    termino_evidencia TEXT,

    -- ─── EL AVISO VA A TODA LA FIRMA, SALVO QUE HAYA RESPONSABLE ──────────────
    -- Correo de la persona a cargo. NULL significa «de la firma», no «de nadie».
    responsable TEXT,

    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CUMPLIDA', 'ARCHIVADA')),
    cumplida_el TIMESTAMPTZ,
    notas TEXT,

    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- El trabajo diario recorre TODAS las firmas ordenando por fecha límite, y la
-- pantalla lista lo pendiente de UNA firma: dos índices distintos, y el segundo
-- no sirve para lo primero porque `firm_id` va de primera columna.
CREATE INDEX IF NOT EXISTS idx_agenda_firm_estado
    ON public.agenda_terminos(firm_id, estado, fecha_limite);
CREATE INDEX IF NOT EXISTS idx_agenda_vencimiento
    ON public.agenda_terminos(fecha_limite)
    WHERE estado = 'PENDIENTE';

-- ==============================================================================
-- QUÉ AVISOS YA SE ENVIARON — Y POR QUÉ ES UNA TABLA Y NO UNA COLUMNA
-- ==============================================================================
-- El trabajo diario corre una vez al día, pero un reintento de la plataforma,
-- un redespliegue o una invocación manual pueden repetirlo. Si «ya avisé» fuera
-- una columna leída y luego escrita, dos ejecuciones simultáneas leerían las dos
-- «todavía no» y el teléfono del abogado sonaría dos veces por el mismo
-- vencimiento — y un aviso que se repite se aprende a ignorar.
--
-- Con llave primaria compuesta, la idempotencia la impone la BASE: el envío se
-- ANOTA PRIMERO con `ON CONFLICT DO NOTHING`; quien gana la fila envía, quien
-- la pierde no recibe fila de vuelta y no envía nada. Es el mismo razonamiento
-- por el que acreditar un pago de Wompi es idempotente en una sentencia y no en
-- un `if`.
--
-- `hito` es el número de días que faltaban cuando se avisó: 5, 2 y 0. Se guarda
-- el hito y no la fecha del envío como llave porque el mismo día puede
-- corresponder a hitos distintos si la fecha límite se corrige.
CREATE TABLE IF NOT EXISTS public.agenda_avisos (
    entrada_id UUID NOT NULL REFERENCES public.agenda_terminos(id) ON DELETE CASCADE,
    hito SMALLINT NOT NULL CHECK (hito IN (0, 2, 5)),
    enviado_el TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    destinatarios INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (entrada_id, hito)
);

-- ==============================================================================
-- RLS — el mismo patrón de todas las tablas de inquilino
-- ==============================================================================
ALTER TABLE public.agenda_terminos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_agenda_terminos" ON public.agenda_terminos;
CREATE POLICY "tenant_isolation_agenda_terminos"
    ON public.agenda_terminos FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- `agenda_avisos` no tiene `firm_id` propio a propósito: duplicarlo abriría la
-- puerta a que una fila de aviso apunte a una entrada de otra firma. Su
-- aislamiento es el de la entrada a la que pertenece, comprobado con EXISTS.
ALTER TABLE public.agenda_avisos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_agenda_avisos" ON public.agenda_avisos;
CREATE POLICY "tenant_isolation_agenda_avisos"
    ON public.agenda_avisos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.agenda_terminos t
            WHERE t.id = agenda_avisos.entrada_id
              AND t.firm_id = public.current_firm_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agenda_terminos t
            WHERE t.id = agenda_avisos.entrada_id
              AND t.firm_id = public.current_firm_id()
        )
    );

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.agenda_terminos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_terminos TO authenticated;

GRANT ALL PRIVILEGES ON public.agenda_avisos TO service_role;
-- La firma LEE qué avisos salieron; quién los anota es el trabajo diario, que
-- corre como service_role. Un cliente que pudiera escribir aquí podría
-- silenciar su propio recordatorio marcándolo como enviado.
GRANT SELECT ON public.agenda_avisos TO authenticated;

-- anon no tiene nada que hacer aquí: los vencimientos de una firma son suyos.
REVOKE ALL ON public.agenda_terminos FROM anon;
REVOKE ALL ON public.agenda_avisos FROM anon;
