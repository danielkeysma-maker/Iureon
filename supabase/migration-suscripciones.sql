-- ==============================================================================
-- MIGRACIÓN: suscripciones de la firma (plan ESENCIAL / PREMIUM)
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada.
--
-- QUÉ ES. La firma paga por PERIODO (un mes o un año) el derecho a usar la
-- aplicación; el consumo de inteligencia artificial sigue siendo prepagado por
-- recargas y no cambia con esto. Dos planes, con IVA incluido:
--
--   ESENCIAL  $70.000/mes · $700.000/año · 1 usuario · sin Audiencias,
--             Entrevistas ni Orientación.
--   PREMIUM   $100.000/mes · $1.000.000/año · hasta 5 usuarios · todo.
--
-- El año son doce meses por el precio de diez.
--
-- POR QUÉ NO HAY COBRO RECURRENTE. Wompi, tal como está integrado, es un
-- checkout web de un solo pago: no se guarda tarjeta ni se cobra solo. Cada
-- periodo se paga con un checkout nuevo, y pagar ANTES de vencer EXTIENDE desde
-- la fecha vigente — nunca se pierden días por adelantarse. Al cambiar de plan
-- en un pago, el plan nuevo rige desde ese pago y el periodo se suma igual;
-- no se prorratea, a propósito: es una regla que un socio entiende sin tabla.
--
-- QUÉ PASA AL VENCER. La firma queda en SOLO LECTURA: entra, lee, exporta y
-- paga; ninguna operación de inteligencia artificial se ejecuta y no se crean
-- transcripciones. Eso lo impone el backend leyendo `plan_valid_until`; aquí
-- solo se guarda la fecha.
--
-- LAS FIRMAS QUE YA EXISTEN NO SE TOCAN. Con `plan` y `plan_valid_until` en NULL
-- una firma es CORTESÍA: sin restricción de módulos, sin vencimiento. Así la
-- migración no deja a ningún cliente actual sin servicio la mañana en que
-- corre; el operador les asigna plan cuando corresponda, con motivo escrito.
--
-- LOS PAGOS DE SUSCRIPCIÓN NO ENTRAN A `credit_movements`. Ese libro es el
-- saldo de consumo y el extracto lo agrupa por el prefijo de la descripción;
-- un pago de plan ahí saldría como recarga y el extracto mentiría. Tienen su
-- propia tabla, `subscription_payments`.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: solo alcanzan las tablas
-- que existían cuando corrieron. Por eso esta migración concede y revoca
-- explícitamente.
-- ==============================================================================

-- ==============================================================================
-- 1. FIRMS — el plan vigente
-- ==============================================================================
ALTER TABLE public.firms
    ADD COLUMN IF NOT EXISTS plan TEXT
        CHECK (plan IS NULL OR plan IN ('ESENCIAL', 'PREMIUM')),
    ADD COLUMN IF NOT EXISTS plan_period TEXT
        CHECK (plan_period IS NULL OR plan_period IN ('MENSUAL', 'ANUAL', 'PRUEBA', 'CORTESIA')),
    -- NULL = sin vencimiento (cortesía). La aplicación compara contra NOW() en
    -- cada lectura; no hay trabajo programado que marque vencidas, porque un
    -- cron que no corre falla hacia el lado peligroso.
    ADD COLUMN IF NOT EXISTS plan_valid_until TIMESTAMPTZ,
    -- Cupo de cuentas del plan. NULL = sin tope (cortesía).
    ADD COLUMN IF NOT EXISTS plan_max_users INT
        CHECK (plan_max_users IS NULL OR plan_max_users > 0);

-- ==============================================================================
-- 2. PAYMENT_INTENTS — una intención puede ser recarga o suscripción
-- ==============================================================================
-- Se reutiliza la misma tabla y el mismo webhook: la firma del evento, la
-- referencia y la idempotencia ya están resueltas ahí. Lo que cambia es qué se
-- hace con un pago aprobado, y eso lo decide `purpose`.
ALTER TABLE public.payment_intents
    ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'RECARGA'
        CHECK (purpose IN ('RECARGA', 'SUSCRIPCION')),
    -- Solo para SUSCRIPCION: qué se compró. Fijado ANTES del pago, como el
    -- monto, para que la confirmación no pueda decir que se pagó otra cosa.
    ADD COLUMN IF NOT EXISTS plan TEXT
        CHECK (plan IS NULL OR plan IN ('ESENCIAL', 'PREMIUM')),
    ADD COLUMN IF NOT EXISTS plan_period TEXT
        CHECK (plan_period IS NULL OR plan_period IN ('MENSUAL', 'ANUAL'));

-- ==============================================================================
-- 3. SUBSCRIPTION_PAYMENTS — el historial de lo pagado por el plan
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    -- La intención que lo originó. Única: un pago se aplica una sola vez.
    reference TEXT NOT NULL UNIQUE,
    wompi_transaction_id TEXT,
    plan TEXT NOT NULL CHECK (plan IN ('ESENCIAL', 'PREMIUM')),
    plan_period TEXT NOT NULL CHECK (plan_period IN ('MENSUAL', 'ANUAL')),
    amount_cop NUMERIC(14,2) NOT NULL CHECK (amount_cop > 0),
    -- El periodo que este pago compró. `valid_from` es la fecha vigente al
    -- pagar (o el momento del pago, lo que sea posterior), para que pagar
    -- antes de vencer no pierda días.
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    user_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_firm
    ON public.subscription_payments(firm_id, created_at DESC);

-- ==============================================================================
-- 4. APLICAR UN PAGO DE SUSCRIPCIÓN, UNA SOLA VEZ
-- ==============================================================================
-- Misma forma que `credit_payment_intent`, y por la misma razón: Wompi
-- reintenta lo que no respondió 2xx, y dos reintentos simultáneos deben
-- producir UN periodo, no dos. El UPDATE de la intención es la guarda y la
-- operación a la vez: solo una fila pasa de PENDING a APPROVED, y quien la
-- gane es el único que extiende el plan. El perdedor recibe NULL, que quien
-- llama lee como "ya estaba hecho".
--
-- EL PERIODO SE SUMA DESDE LA FECHA VIGENTE, NUNCA DESDE HOY A SECAS:
--   valid_from  = GREATEST(NOW(), COALESCE(plan_valid_until, NOW()))
--   valid_until = valid_from + 1 mes | 1 año
-- Una firma vencida arranca hoy; una vigente arranca donde termina lo pagado.
--
-- Devuelve la fila de `subscription_payments` como JSON, o NULL si no había
-- nada que aplicar.
CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
    p_reference TEXT,
    p_transaction_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_firm_id TEXT;
    v_amount NUMERIC;
    v_plan TEXT;
    v_period TEXT;
    v_email TEXT;
    v_from TIMESTAMPTZ;
    v_until TIMESTAMPTZ;
    v_max_users INT;
    v_payment JSONB;
BEGIN
    UPDATE public.payment_intents
       SET status = 'APPROVED',
           wompi_transaction_id = p_transaction_id,
           credited_at = NOW(),
           updated_at = NOW()
     WHERE reference = p_reference
       AND status = 'PENDING'
       AND credited_at IS NULL
       AND purpose = 'SUSCRIPCION'
    RETURNING firm_id, amount_cop, plan, plan_period, user_email
        INTO v_firm_id, v_amount, v_plan, v_period, v_email;

    -- Ya aplicada, no existe, o era una recarga. En todos no se toca nada.
    IF v_firm_id IS NULL OR v_plan IS NULL OR v_period IS NULL THEN
        RETURN NULL;
    END IF;

    -- Bloquea la fila de la firma: dos pagos de la misma firma que lleguen a la
    -- vez deben encadenarse, no pisarse.
    SELECT GREATEST(NOW(), COALESCE(plan_valid_until, NOW()))
      INTO v_from
      FROM public.firms
     WHERE firm_id = v_firm_id
       FOR UPDATE;

    IF v_from IS NULL THEN
        -- La firma no existe: la intención quedó aprobada para conciliar a
        -- mano, pero no hay a quién extenderle nada.
        RETURN NULL;
    END IF;

    v_until := CASE v_period
                   WHEN 'ANUAL' THEN v_from + INTERVAL '1 year'
                   ELSE v_from + INTERVAL '1 month'
               END;

    v_max_users := CASE v_plan WHEN 'PREMIUM' THEN 5 ELSE 1 END;

    UPDATE public.firms
       SET plan = v_plan,
           plan_period = v_period,
           plan_valid_until = v_until,
           plan_max_users = v_max_users,
           subscription_status = 'active',
           updated_at = NOW()
     WHERE firm_id = v_firm_id;

    INSERT INTO public.subscription_payments
        (firm_id, reference, wompi_transaction_id, plan, plan_period,
         amount_cop, valid_from, valid_until, user_email)
    VALUES
        (v_firm_id, p_reference, p_transaction_id, v_plan, v_period,
         v_amount, v_from, v_until, v_email)
    RETURNING to_jsonb(subscription_payments.*) INTO v_payment;

    RETURN v_payment;
END;
$$;

-- ==============================================================================
-- 5. RLS
-- ==============================================================================
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_subscription_payments" ON public.subscription_payments;
CREATE POLICY "tenant_isolation_subscription_payments"
    ON public.subscription_payments FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- 6. GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.subscription_payments TO service_role;
GRANT SELECT ON public.subscription_payments TO authenticated;
REVOKE ALL ON public.subscription_payments FROM anon;

-- Aplicar un pago solo lo hace el servidor, y solo tras verificar la firma del
-- evento de Wompi. Una firma que pudiera llamar esta función se extendería
-- el plan sola.
REVOKE ALL ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) TO service_role;
