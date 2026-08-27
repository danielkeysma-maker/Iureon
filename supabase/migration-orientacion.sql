-- ==============================================================================
-- MIGRACIÓN: tope diario de Orientación
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ EXISTE. Orientación llama a un modelo pago y no le cobra nada a la
-- firma: es la puerta de entrada del producto y ponerle precio ahuyentaría a
-- quien todavía no sabe si el producto le sirve. Pero gratis y SIN TOPE no es
-- una decisión comercial, es un grifo abierto sobre la tarjeta de la casa —
-- nada impide que una sesión legítima lo pulse cinco mil veces.
--
-- El tope convierte un riesgo sin fondo en un costo conocido: peor caso al día
-- = firmas × tope × costo por consulta.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: una tabla creada después
-- nace sin permisos para la API. Por eso esta migración concede explícitamente.
-- ==============================================================================

-- ==============================================================================
-- 1. LA TABLA — una fila por firma y por día, y nada más
-- ==============================================================================
-- No guarda la consulta ni los hechos que el abogado escribió. Cuántas veces
-- una firma pidió orientación es información de facturación; QUÉ preguntó es
-- del cliente, y guardarlo para contar sería recolectar el caso de alguien
-- para resolver un problema de cuota.
CREATE TABLE IF NOT EXISTS public.orientacion_diaria (
    firm_id TEXT NOT NULL,
    -- El día en la zona del negocio, no en UTC: un tope "diario" que se
    -- reinicia a las 7 de la noche hora Colombia sería incomprensible para
    -- quien lo vive. Lo fija el servidor al llamar, nunca el cliente.
    dia DATE NOT NULL,
    consultas INTEGER NOT NULL DEFAULT 0 CHECK (consultas >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (firm_id, dia)
);

-- ==============================================================================
-- 2. EL CONTADOR — comprobar y sumar en la MISMA sentencia
-- ==============================================================================
-- Leer el conteo, decidir, y después sumar es una carrera: dos pestañas del
-- mismo abogado leen 19, ambas deciden que caben, y ambas suman. Con un tope de
-- 20 pasan 21, y con concurrencia real pasan muchas más. Es exactamente la
-- forma del defecto que credit_payment_intent evita al acreditar.
--
-- Aquí el INSERT ... ON CONFLICT DO UPDATE con la condición en el WHERE hace
-- las dos cosas a la vez: si la fila ya llegó al tope, el UPDATE no toca nada y
-- no hay fila devuelta. El que llama distingue por eso, no por un conteo que
-- leyó antes.
CREATE OR REPLACE FUNCTION public.consumir_orientacion(
    p_firm_id TEXT,
    p_dia DATE,
    p_tope INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_consultas INTEGER;
BEGIN
    INSERT INTO public.orientacion_diaria (firm_id, dia, consultas)
    VALUES (p_firm_id, p_dia, 1)
    ON CONFLICT (firm_id, dia) DO UPDATE
        SET consultas = public.orientacion_diaria.consultas + 1,
            updated_at = NOW()
        -- La guarda vive aquí, dentro de la misma sentencia que suma.
        WHERE public.orientacion_diaria.consultas < p_tope
    RETURNING consultas INTO v_consultas;

    -- NULL significa "el tope ya estaba alcanzado y no se sumó nada".
    RETURN v_consultas;
END;
$$;

-- ==============================================================================
-- 3. RLS
-- ==============================================================================
ALTER TABLE public.orientacion_diaria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_orientacion" ON public.orientacion_diaria;
CREATE POLICY "tenant_isolation_orientacion"
    ON public.orientacion_diaria FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- 4. GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.orientacion_diaria TO service_role;
-- La firma puede VER su propio consumo del día; no puede escribirlo.
GRANT SELECT ON public.orientacion_diaria TO authenticated;

-- El contador solo lo ejecuta el servidor. Una firma que pudiera llamarlo
-- podría pasarse un tope de mil millones y el tope dejaría de existir.
REVOKE ALL ON FUNCTION public.consumir_orientacion(TEXT, DATE, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consumir_orientacion(TEXT, DATE, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_orientacion(TEXT, DATE, INTEGER) TO service_role;
