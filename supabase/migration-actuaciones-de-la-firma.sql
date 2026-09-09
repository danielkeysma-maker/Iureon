-- ==============================================================================
-- MIGRACIÓN: actuaciones propias de la firma
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- QUÉ RESUELVE. El catálogo de fábrica cubre lo que se pudo verificar, y no
-- cubre todo: cuando el abogado no encuentra su actuación en la rama, hoy no
-- tiene salida — o escribe con una ficha que no es la suya, o no escribe. Esta
-- tabla le deja escribir el nombre de la actuación que sí necesita y que
-- aparezca desde entonces en la lista de esa rama, para esa firma.
--
-- POR QUÉ NO CABE EN `catalog_verifications`. Esa tabla corrige una ficha que
-- YA EXISTE: su `actuacion_id` tiene que estar en el catálogo publicado, y el
-- controlador rechaza cualquier otro como huérfano. Una actuación inventada por
-- la firma no tiene ficha que corregir, así que necesita tabla propia. Lo que
-- sí se copia de allí, palabra por palabra, es la regla que importa.
--
-- NINGÚN TÉRMINO SE GUARDA SIN SU FUENTE. `chk_unverified_has_no_term` es el
-- mismo CHECK de `catalog_verifications`, y aquí es todavía más necesario:
-- estas actuaciones nacen SIN norma verificada y se muestran advertidas. El día
-- en que la firma escriba su término, la base exige que escriba también dónde
-- lo leyó — o el término no entra. Un plazo afirmado sin fuente es exactamente
-- el defecto que este producto existe para impedir, y la firma no está exenta.
--
-- ÁMBITO POR FIRMA, COMO LA CURADURÍA. Lo que una firma inventa no puede
-- aparecerle a otra: no está verificado por nadie, y ofrecerlo a un tercero
-- sería presentarle como catálogo lo que es la nota de un colega ajeno.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.firm_actuaciones (
    firm_id TEXT NOT NULL,
    -- Slug derivado del área y del nombre, p. ej. 'civil/demanda-de-oposicion'.
    id TEXT NOT NULL,
    area TEXT NOT NULL,            -- la rama del catálogo en la que aparecerá
    exact_name TEXT NOT NULL,      -- el nombre tal como el abogado lo escribió
    role TEXT NOT NULL DEFAULT 'LITIGANTE'
        CHECK (role IN ('LITIGANTE', 'DESPACHO', 'SECRETARIA')),

    -- Lo que la firma puede completar después, en la pantalla de Catálogo, con
    -- el mismo formulario con el que cura una ficha de fábrica. Mientras estén
    -- vacíos, la actuación se muestra y se redacta ADVERTIDA.
    term_status TEXT NOT NULL DEFAULT 'NO_VERIFICADO'
        CHECK (term_status IN ('VERIFICADO', 'NO_CADUCA', 'NO_VERIFICADO')),
    legal_basis TEXT,
    term_description TEXT,
    source_url TEXT,
    note TEXT,

    created_by TEXT NOT NULL,      -- correo de quien la creó: es legal, es atribuible
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (firm_id, id),

    -- Copiado palabra por palabra de `catalog_verifications`. «No caduca» es una
    -- respuesta comprobada y «sin verificar» es la ausencia de comprobación: la
    -- restricción existe para que la segunda no pueda llevar texto de término.
    CONSTRAINT chk_firm_actuacion_unverified_has_no_term CHECK (
        (term_status = 'NO_VERIFICADO' AND term_description IS NULL)
        OR (term_status <> 'NO_VERIFICADO' AND term_description IS NOT NULL AND source_url IS NOT NULL)
    )
);

COMMENT ON TABLE public.firm_actuaciones IS
    'Actuaciones que la firma añadió a una rama porque el catálogo publicado no las trae. Sin norma verificada mientras no tengan término y fuente.';
COMMENT ON COLUMN public.firm_actuaciones.area IS
    'Rama del catálogo (LegalBranch) en cuya lista aparece. Se valida contra las ramas conocidas antes de escribir.';
COMMENT ON COLUMN public.firm_actuaciones.term_status IS
    'VERIFICADO | NO_CADUCA | NO_VERIFICADO. Nace NO_VERIFICADO: la actuación la escribió la firma y nadie leyó una norma por ella.';
COMMENT ON COLUMN public.firm_actuaciones.term_description IS
    'Término que la firma verificó. Solo puede existir junto a source_url: un plazo sin fuente no está verificado, solo lo parece.';

-- El nombre no se repite dentro de la misma rama de la misma firma: dos
-- opciones idénticas en el desplegable no se pueden distinguir al elegir.
CREATE UNIQUE INDEX IF NOT EXISTS idx_firm_actuaciones_nombre
    ON public.firm_actuaciones(firm_id, area, lower(exact_name));

CREATE INDEX IF NOT EXISTS idx_firm_actuaciones_firm
    ON public.firm_actuaciones(firm_id);

-- ==============================================================================
-- RLS Y PRIVILEGIOS — como catalog_verifications
-- ==============================================================================
-- Los GRANT del esquema son una FOTO: solo alcanzan las tablas que existían
-- cuando corrieron. Una tabla creada después responde «permission denied» con
-- la política RLS perfecta, así que aquí se concede y se revoca explícitamente.

ALTER TABLE public.firm_actuaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_actuaciones_tenant_isolation ON public.firm_actuaciones;
CREATE POLICY firm_actuaciones_tenant_isolation ON public.firm_actuaciones
    FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

REVOKE ALL ON public.firm_actuaciones FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firm_actuaciones TO authenticated;
GRANT ALL ON public.firm_actuaciones TO service_role;
