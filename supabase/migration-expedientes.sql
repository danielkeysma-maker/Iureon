-- ==============================================================================
-- MIGRACIÓN: el EXPEDIENTE, y las tres nociones de caso que hoy no se hablan
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- ── POR QUÉ EXISTE ───────────────────────────────────────────────────────────
--
-- Hoy la plataforma tiene TRES formas distintas de decir «este caso», y ninguna
-- sabe de las otras dos:
--
--   1. `transcriptions.client_id` — una llave real (FK a `clients`), y la única.
--   2. `cliente` como TEXTO LIBRE, en `document_reviews`, `saved_drafts` y
--      `agenda_terminos`.
--   3. `radicado` como TEXTO LIBRE, en `saved_drafts` y `agenda_terminos`.
--
-- El mismo asunto puede ser «Mosquera» en un borrador, «Mosquera vs. ACME» en
-- la agenda y un UUID de cliente en una entrevista. Nada los une, así que el
-- motor recibe cada petición huérfana y el abogado vuelve a escribir el
-- contexto que ya escribió tres veces.
--
-- El expediente es la cuarta noción, pero con una diferencia: es la única que
-- puede APUNTAR a las demás.
--
-- ── LO QUE ESTA MIGRACIÓN NO HACE, Y ES DELIBERADO ───────────────────────────
--
-- NO borra ni migra los campos de texto libre. `cliente`, `radicado` y
-- `despacho` se quedan donde están, diciendo lo que decían. Un borrador de hace
-- tres meses que dice «Mosquera» sigue diciendo «Mosquera», con o sin
-- expediente.
--
-- La razón es que adivinar a qué expediente pertenece una fila vieja es
-- exactamente el trabajo que esta casa no puede hacer sola: dos borradores que
-- dicen «Mosquera» pueden ser dos casos distintos del mismo cliente. Atarlos
-- mal sería peor que no atarlos, porque el motor recibiría contexto ajeno y
-- nadie lo notaría. El vínculo lo pone el abogado, una fila a la vez, y por eso
-- `expediente_id` nace NULO en todas partes.
--
-- ── LOS GRANT DE schema.sql SON UNA FOTO, NO UNA REGLA ───────────────────────
-- Una tabla creada después nace sin permisos para la API. Por eso esta
-- migración concede y revoca explícitamente, como las anteriores.
-- ==============================================================================


-- ==============================================================================
-- 1. EL EXPEDIENTE
-- ==============================================================================
-- Un asunto del despacho. No un cliente —un cliente puede tener varios— ni un
-- proceso judicial —hay asuntos que nunca llegan a juzgado y también son
-- expedientes: una sucesión notarial, una actuación administrativa, una
-- negociación—.
CREATE TABLE IF NOT EXISTS public.expedientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,

    -- Lo único obligatorio. Un expediente sin nombre no se encuentra después, y
    -- el radicado NO sirve de nombre: la mayoría de los asuntos nacen antes de
    -- tenerlo, que es justamente cuando más falta hace el expediente.
    caratula TEXT NOT NULL,

    -- El radicado de 23 dígitos, cuando existe. Sin CHECK de formato a
    -- propósito: los hay de 21, de 23, con y sin guiones, y los administrativos
    -- no siguen ninguno. Rechazar un radicado real por no caber en un patrón
    -- sería impedir registrar el caso por culpa del validador.
    radicado TEXT,
    despacho TEXT,

    -- La rama, para que la ficha del catálogo se pueda resolver desde el
    -- expediente y no desde la etiqueta de una revisión suelta. Sin CHECK
    -- contra una lista: las ramas viven en el catálogo (TypeScript) y
    -- duplicarlas aquí crearía dos verdades que envejecen por separado.
    rama TEXT,

    -- EL CLIENTE ES UNA LLAVE, no un texto. Es la mitad del punto de esta
    -- tabla: por aquí el expediente alcanza las ENTREVISTAS, que ya cuelgan de
    -- `clients` (`transcriptions.client_id`).
    --
    -- ON DELETE SET NULL, igual que en transcripciones: borrar un cliente no
    -- puede borrar el expediente del asunto que se le llevó.
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

    -- Y el nombre de la contraparte como texto, porque casi nunca es cliente de
    -- la firma y crearle una ficha para poder nombrarla sería obligar a
    -- registrar a alguien que no se representa.
    contraparte TEXT,

    estado TEXT NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'TERMINADO', 'ARCHIVADO')),

    -- Lo que el abogado quiera dejar dicho. No lo lee el motor por ahora.
    notas TEXT,

    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Por firma y por lo último tocado: es el orden en que se lista.
CREATE INDEX IF NOT EXISTS idx_expedientes_firma
    ON public.expedientes(firm_id, updated_at DESC);

-- Para «los expedientes de este cliente», que es como se entra desde una
-- entrevista.
CREATE INDEX IF NOT EXISTS idx_expedientes_cliente
    ON public.expedientes(cliente_id) WHERE cliente_id IS NOT NULL;

-- El radicado se busca escribiéndolo, y solo hay uno por asunto: índice
-- parcial, porque la mayoría de los expedientes no lo tienen todavía.
CREATE INDEX IF NOT EXISTS idx_expedientes_radicado
    ON public.expedientes(firm_id, radicado) WHERE radicado IS NOT NULL;


-- ==============================================================================
-- 2. LOS ACTORES — quién es quién en el asunto
-- ==============================================================================
-- ÉSTA ES LA TABLA QUE DESBLOQUEA LAS PREGUNTAS DE AUDIENCIA.
--
-- Hoy las preguntas salen en tres listas fijas —contraparte, mis testigos,
-- testigos de la contraparte— escritas en el tipo, en el prompt y en el JSONB
-- guardado. Esa forma no le sirve al modo de documento recibido, y sobre todo
-- no sabe A QUIÉN se le pregunta: el prompt declara literalmente que «no
-- conoces el expediente, las pruebas, a las partes ni a los testigos».
--
-- Con esta tabla, las listas dejan de ser tres cajones fijos y pasan a ser LA
-- GENTE QUE HAY EN EL CASO, con su nombre y su lado. Un interrogatorio se
-- prepara contra una persona, no contra una categoría.
--
-- Sin `firm_id` propio, a propósito: su aislamiento se hace por EXISTS contra
-- el expediente. Duplicarlo abriría la puerta a que una fila apunte al
-- expediente de otra firma — el mismo criterio de `agenda_avisos`.
CREATE TABLE IF NOT EXISTS public.expediente_actores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,

    nombre TEXT NOT NULL,

    -- QUÉ ES en el proceso. La lista es corta a propósito: son los papeles que
    -- cambian CÓMO se le pregunta a alguien, no todos los que existen. Un
    -- perito se contrainterroga distinto que un testigo, y un apoderado no se
    -- interroga.
    papel TEXT NOT NULL
        CHECK (papel IN ('PARTE', 'APODERADO', 'TESTIGO', 'PERITO', 'AUTORIDAD', 'OTRO')),

    -- DE QUÉ LADO. Es lo que decide la técnica: al propio se le interroga, al
    -- ajeno se le contrainterroga. NEUTRAL es para el perito de oficio, el juez
    -- y el Ministerio Público, que no son de nadie.
    lado TEXT NOT NULL DEFAULT 'NEUTRAL'
        CHECK (lado IN ('PROPIO', 'CONTRARIO', 'NEUTRAL')),

    -- Sobre qué puede declarar. Es lo que convierte una lista de nombres en
    -- preguntas útiles: sin esto, el motor solo sabe que existe un testigo.
    sobre_que TEXT,

    identificacion TEXT,
    notas TEXT,

    -- Cuando el actor ES un cliente de la firma. Casi nunca —la contraparte y
    -- sus testigos no lo son— pero cuando lo es, por aquí se llega a sus
    -- entrevistas.
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actores_expediente
    ON public.expediente_actores(expediente_id, papel);


-- ==============================================================================
-- 3. EL VÍNCULO: una columna nula en cada cosa que ya existe
-- ==============================================================================
-- ADITIVO Y NULO. Nada de lo que hay hoy cambia de significado, y nada deja de
-- funcionar sin expediente: la plataforma entera sigue andando exactamente
-- igual para quien nunca cree uno.
--
-- ON DELETE SET NULL en todas: borrar un expediente NO puede llevarse por
-- delante un borrador que costó saldo, una revisión que se pagó, ni un
-- vencimiento que todavía corre. Se desatan y siguen ahí, que es lo que ya hace
-- `clients` con las transcripciones.
ALTER TABLE public.transcriptions
    ADD COLUMN IF NOT EXISTS expediente_id UUID
    REFERENCES public.expedientes(id) ON DELETE SET NULL;

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS expediente_id UUID
    REFERENCES public.expedientes(id) ON DELETE SET NULL;

ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS expediente_id UUID
    REFERENCES public.expedientes(id) ON DELETE SET NULL;

ALTER TABLE public.agenda_terminos
    ADD COLUMN IF NOT EXISTS expediente_id UUID
    REFERENCES public.expedientes(id) ON DELETE SET NULL;

-- Las orientaciones también, y es el eslabón que más falta hacía: la
-- orientación es literalmente el punto de entrada de un caso nuevo, y hasta hoy
-- era la única entidad sin ninguna noción de a quién pertenece.
ALTER TABLE public.orientaciones
    ADD COLUMN IF NOT EXISTS expediente_id UUID
    REFERENCES public.expedientes(id) ON DELETE SET NULL;

-- Índices parciales: la inmensa mayoría de las filas de hoy tienen NULL, y un
-- índice completo sobre una columna casi vacía es peso muerto en cada
-- escritura.
CREATE INDEX IF NOT EXISTS idx_transcriptions_expediente
    ON public.transcriptions(expediente_id) WHERE expediente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_expediente
    ON public.document_reviews(expediente_id) WHERE expediente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drafts_expediente
    ON public.saved_drafts(expediente_id) WHERE expediente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_expediente
    ON public.agenda_terminos(expediente_id) WHERE expediente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orientaciones_expediente
    ON public.orientaciones(expediente_id) WHERE expediente_id IS NOT NULL;


-- ==============================================================================
-- 4. RLS
-- ==============================================================================
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_expedientes" ON public.expedientes;
CREATE POLICY "tenant_isolation_expedientes"
    ON public.expedientes FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

ALTER TABLE public.expediente_actores ENABLE ROW LEVEL SECURITY;

-- Por EXISTS contra el padre, no por una copia de `firm_id`. Una copia se puede
-- desincronizar y entonces la fila hija apuntaría al expediente de otra firma
-- diciendo que es de la propia.
DROP POLICY IF EXISTS "tenant_isolation_actores" ON public.expediente_actores;
CREATE POLICY "tenant_isolation_actores"
    ON public.expediente_actores FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.expedientes e
            WHERE e.id = public.expediente_actores.expediente_id
              AND e.firm_id = public.current_firm_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expedientes e
            WHERE e.id = public.expediente_actores.expediente_id
              AND e.firm_id = public.current_firm_id()
        )
    );


-- ==============================================================================
-- 5. GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.expedientes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expedientes TO authenticated;
REVOKE ALL ON public.expedientes FROM anon;

GRANT ALL PRIVILEGES ON public.expediente_actores TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expediente_actores TO authenticated;
REVOKE ALL ON public.expediente_actores FROM anon;


-- ==============================================================================
-- 6. Y LA FIRMA SE PUEDE BORRAR ENTERA — que es donde ya se falló una vez
-- ==============================================================================
-- `borrar_firma_completa` enumera las tablas A MANO, así que toda tabla nueva
-- hay que añadirla o queda huérfana al borrar la firma. Ya pasó: `agenda_terminos`
-- y `agenda_avisos` son posteriores a esa función y NO están en ella, así que
-- hoy borrar una firma deja sus vencimientos en la base.
--
-- Aquí se arreglan las tres de una vez. `expediente_actores` se va sola por el
-- CASCADE del expediente, pero se cuenta aparte para que el informe del borrado
-- diga la verdad de cuántas filas se llevó.
CREATE OR REPLACE FUNCTION public.borrar_expedientes_de_la_firma(p_firm_id TEXT)
RETURNS TABLE(tabla TEXT, filas BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_filas BIGINT;
BEGIN
    IF p_firm_id IS NULL OR btrim(p_firm_id) = '' THEN
        RAISE EXCEPTION 'borrar_expedientes_de_la_firma: se requiere el id de la firma';
    END IF;

    DELETE FROM public.expediente_actores a
     USING public.expedientes e
     WHERE a.expediente_id = e.id AND e.firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'expediente_actores'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.agenda_avisos av
     USING public.agenda_terminos t
     WHERE av.entrada_id = t.id AND t.firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'agenda_avisos'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.agenda_terminos WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'agenda_terminos'; filas := v_filas; RETURN NEXT;

    DELETE FROM public.expedientes WHERE firm_id = p_firm_id;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    tabla := 'expedientes'; filas := v_filas; RETURN NEXT;

    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.borrar_expedientes_de_la_firma(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.borrar_expedientes_de_la_firma(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.borrar_expedientes_de_la_firma(TEXT) TO service_role;


-- ==============================================================================
-- 7. COMPROBACIÓN
-- ==============================================================================
-- Debe devolver 8 filas: las dos tablas nuevas y SEIS columnas `expediente_id`
-- —las cinco que se añaden a lo que ya existía (transcriptions,
-- document_reviews, saved_drafts, agenda_terminos, orientaciones) más la de
-- `expediente_actores`, que es la llave foránea de la propia tabla hija—.
SELECT 'tabla' AS que, table_name AS nombre
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name IN ('expedientes', 'expediente_actores')
UNION ALL
SELECT 'columna', table_name || '.expediente_id'
  FROM information_schema.columns
 WHERE table_schema = 'public' AND column_name = 'expediente_id'
 ORDER BY 1, 2;
