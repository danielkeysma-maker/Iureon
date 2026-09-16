-- ==============================================================================
-- MIGRACIÓN: los interrogatorios preparados se quedan en el expediente
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- REQUIERE que ya haya corrido migration-expedientes.sql: esta tabla cuelga de
-- `expedientes` por llave foránea.
--
-- ── QUÉ RESUELVE, Y POR QUÉ ERA URGENTE ──────────────────────────────────────
--
-- `POST /api/expedientes/:id/preguntas` prepara el interrogatorio de hasta
-- cuatro personas, se cobra del saldo de la firma y devuelve el resultado en la
-- respuesta. El navegador lo guardaba en memoria de React y en ningún otro
-- sitio: recargar la página, cambiar de caso o cerrar la pestaña lo perdía, y
-- el abogado tenía que PAGARLO OTRA VEZ para leer lo que ya había comprado.
-- Un trabajo cobrado que la aplicación tira es lo más parecido que hay a
-- cobrar dos veces por lo mismo.
--
-- ── SE GUARDA EL RESULTADO ENTERO, EN UNA COLUMNA JSONB ──────────────────────
--
-- `personas` lleva el objeto tal como se le entregó al abogado: el enfoque, una
-- lista por persona con su técnica, y cada pregunta con su «para qué», su
-- respuesta probable, la repregunta y el «con qué» —documento y cita— que el
-- servidor ya comprobó contra los pasajes del expediente.
--
-- NO SE NORMALIZA EN TABLAS DE PREGUNTAS Y DE PERSONAS, y es deliberado: lo
-- que se guarda es un DOCUMENTO CERRADO, la fotografía de lo que el motor
-- entregó ese día con el expediente que había ese día. Nada lo consulta por
-- pregunta, nada lo agrega, nada lo edita; se abre entero o no se abre. Partirlo
-- en filas añadiría tres tablas y un orden que mantener a cambio de consultas
-- que nadie va a escribir, y abriría la puerta a editar una pregunta suelta —lo
-- que convertiría la fotografía en algo que ya no es lo que se cobró.
--
-- ── LAS PREGUNTAS NO VAN A LA AUDITORÍA, PERO SÍ VIVEN AQUÍ ──────────────────
--
-- Qué se le va a preguntar a un testigo es estrategia del abogado y de su
-- cliente, así que el rastro de auditoría anota el caso y cuánta gente, nunca el
-- texto. Esta tabla es lo contrario: es el material de trabajo del propio
-- abogado, dentro de su propia firma, con RLS por firma como todo lo demás.
-- Guardarlo aquí y callarlo en la auditoría no es contradicción: son dos
-- públicos distintos.
--
-- ── LOS GRANT DE schema.sql SON UNA FOTO, NO UNA REGLA ───────────────────────
-- Una tabla creada después nace sin permisos para la API y responde «permission
-- denied» con la política RLS perfecta. Por eso se concede y se revoca aquí,
-- explícitamente, como en migration-actuaciones-de-la-firma.sql.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.expediente_interrogatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- El expediente tiene firm_id y esta tabla también lo lleva. No es
    -- redundancia ociosa: el backend entra con service_role y omite RLS, así
    -- que TODA consulta filtra por firma a mano; sin la columna, ese filtro
    -- exigiría un JOIN en cada lectura y bastaría un olvido para listar los
    -- interrogatorios de otra firma sin que nada fallara.
    firm_id TEXT NOT NULL,
    expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,

    creado_el TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- El correo de quien lo pidió: decide quién puede borrarlo, y es atribuible.
    creado_por TEXT NOT NULL,

    -- Lo que el colega escribió al pedirlo. Se guarda para que al reabrir la
    -- hoja diga con qué se preparó; una tanda sin su encargo no se puede juzgar.
    que_se_queria_probar TEXT,
    audiencia TEXT,

    -- El resultado completo (`PreguntasDelExpediente`). Ver arriba.
    personas JSONB NOT NULL,

    -- Con qué motor se preparó y cuánto se le cobró a la firma por ESTA tanda.
    -- El movimiento de saldo y el consumo detallado siguen viviendo donde
    -- siempre (`credit_movements`, `ai_usage`); esto es la etiqueta de precio
    -- que la hoja enseña al reabrirse, para que reabrir sin pagar se note.
    modelo TEXT,
    cobrado_cop INTEGER,

    -- Un interrogatorio sin una sola persona no es una tanda: es una fila que
    -- ocupa sitio en la lista y no abre nada.
    CONSTRAINT chk_interrogatorio_con_personas CHECK (jsonb_array_length(personas -> 'porPersona') > 0)
);

COMMENT ON TABLE public.expediente_interrogatorios IS
    'Cada tanda de interrogatorio preparada para un expediente, con el resultado completo. Se guarda para que reabrirla no vuelva a cobrar.';
COMMENT ON COLUMN public.expediente_interrogatorios.personas IS
    'El objeto PreguntasDelExpediente entero: enfoque, una lista por persona con su técnica, y cada pregunta con respuesta probable, repregunta y el con qué ya comprobado.';
COMMENT ON COLUMN public.expediente_interrogatorios.creado_por IS
    'Correo de quien la pidió. Solo esa persona o un socio administrador pueden borrarla.';
COMMENT ON COLUMN public.expediente_interrogatorios.cobrado_cop IS
    'Lo que se cobró por esta tanda. Es la etiqueta de precio que la hoja enseña al reabrirse; la contabilidad vive en credit_movements.';

-- La lista del caso se lee siempre igual: esta firma, este expediente, la más
-- nueva primero.
CREATE INDEX IF NOT EXISTS idx_interrogatorios_del_caso
    ON public.expediente_interrogatorios(firm_id, expediente_id, creado_el DESC);

-- ==============================================================================
-- RLS Y PRIVILEGIOS
-- ==============================================================================

ALTER TABLE public.expediente_interrogatorios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interrogatorios_tenant_isolation ON public.expediente_interrogatorios;
CREATE POLICY interrogatorios_tenant_isolation ON public.expediente_interrogatorios
    FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

REVOKE ALL ON public.expediente_interrogatorios FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expediente_interrogatorios TO authenticated;
GRANT ALL ON public.expediente_interrogatorios TO service_role;
