-- ==============================================================================
-- MIGRACIÓN: medición y cobro del consumo de IA
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: una tabla creada después
-- nace sin permisos para la API. Por eso esta migración concede y revoca
-- explícitamente.
-- ==============================================================================

-- ==============================================================================
-- 1. AI_USAGE — qué consumió cada firma, qué costó y qué se le cobró
-- ==============================================================================
-- Iureon es cliente de OpenRouter; las firmas son clientes de Iureon. Una sola
-- cuenta de OpenRouter es la arquitectura correcta — ninguna firma la ve — pero
-- entonces el consumo tiene que ATRIBUIRSE, o el saldo de una firma es una
-- cifra decorativa.
--
-- Se guardan las DOS cantidades a propósito: lo que costó en dólares y lo que
-- se cobró en pesos. Con una sola no se puede responder si el precio cubre el
-- costo, que es la pregunta que decide si el negocio existe.
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    -- Qué la originó: BORRADOR, TRANSCRIPCION, BUSQUEDA…
    operation TEXT NOT NULL,
    -- Un borrador llama a tres modelos; cada llamada es una fila y todas
    -- comparten este identificador, para poder sumar el costo real de UN
    -- documento y no solo el de una etapa.
    operation_id UUID NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    -- Lo que OpenRouter cobró de verdad por ESTA llamada. Reportado por su API
    -- con usage.include, no estimado a partir de una tabla de precios que
    -- envejece.
    cost_usd NUMERIC(14,8) NOT NULL DEFAULT 0,
    -- Lo que se le descontó a la firma. Cero en las llamadas internas que no se
    -- cobran, y en las etapas intermedias de una operación que se cobra entera.
    charged_cop NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_firm ON public.ai_usage(firm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_operation ON public.ai_usage(operation_id);

-- ==============================================================================
-- 2. CREDIT_MOVEMENTS — por qué el saldo de una firma es el que es
-- ==============================================================================
-- Una recarga y un consumo cambian el mismo número en direcciones contrarias.
-- Sin un registro de movimientos, una firma que discute su saldo solo puede
-- recibir la palabra del proveedor, que es exactamente la posición en la que un
-- abogado no acepta estar.
CREATE TABLE IF NOT EXISTS public.credit_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    -- RECARGA (positivo) | CONSUMO (negativo) | AJUSTE (cualquiera)
    kind TEXT NOT NULL,
    amount_cop NUMERIC(14,2) NOT NULL,
    balance_after_cop NUMERIC(14,2) NOT NULL,
    description TEXT NOT NULL,
    -- Quién lo provocó: el operador que recargó, o el usuario que redactó.
    actor_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_movements_firm
    ON public.credit_movements(firm_id, created_at DESC);

-- ==============================================================================
-- 3. DÉBITO ATÓMICO
-- ==============================================================================
-- Leer el saldo, restar en la aplicación y volver a escribirlo pierde dinero en
-- cuanto hay dos peticiones a la vez: ambas leen 10.000, ambas escriben 8.000, y
-- la firma pagó un borrador de dos. Con dos abogados de la misma firma
-- redactando al tiempo eso no es una carrera improbable, es el martes.
--
-- Esta función resta y devuelve el saldo en UNA sentencia. El WHERE con el
-- saldo suficiente es la guarda: si no alcanza, no actualiza ninguna fila y
-- devuelve NULL, y quien llama sabe que no se cobró nada.
CREATE OR REPLACE FUNCTION public.debit_firm_credits(
    p_firm_id TEXT,
    p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    UPDATE public.firms
       SET credit_balance_cop = credit_balance_cop - p_amount,
           updated_at = NOW()
     WHERE firm_id = p_firm_id
       AND credit_balance_cop >= p_amount
    RETURNING credit_balance_cop INTO v_balance;

    RETURN v_balance;
END;
$$;

-- ==============================================================================
-- 4. RLS
-- ==============================================================================
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_ai_usage" ON public.ai_usage;
CREATE POLICY "tenant_isolation_ai_usage"
    ON public.ai_usage FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_isolation_credit_movements" ON public.credit_movements;
CREATE POLICY "tenant_isolation_credit_movements"
    ON public.credit_movements FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- 5. GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.ai_usage TO service_role;
GRANT ALL PRIVILEGES ON public.credit_movements TO service_role;
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT SELECT ON public.credit_movements TO authenticated;

-- El débito solo lo ejecuta el servidor: una firma que pudiera llamarlo podría
-- cobrarse a sí misma cero.
GRANT EXECUTE ON FUNCTION public.debit_firm_credits(TEXT, NUMERIC) TO service_role;
REVOKE EXECUTE ON FUNCTION public.debit_firm_credits(TEXT, NUMERIC) FROM anon, authenticated;

REVOKE ALL ON public.ai_usage FROM anon;
REVOKE ALL ON public.credit_movements FROM anon;
