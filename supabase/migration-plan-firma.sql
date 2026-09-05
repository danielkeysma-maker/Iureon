-- ==============================================================================
-- MIGRACIÓN: tercer plan FIRMA
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase, después de
-- migration-suscripciones.sql. Es idempotente: volver a correrla no rompe nada.
--
-- QUÉ ES. Se suma un tercer plan al catálogo, para la firma que ya no cabe en
-- las cinco cuentas de Premium:
--
--   FIRMA   $250.000/mes · $2.500.000/año · hasta 15 usuarios · todos los
--           módulos (los mismos de Premium).
--
-- El año sigue siendo doce meses por el precio de diez. Los precios incluyen IVA.
--
-- POR QUÉ HAY QUE TOCAR LA BASE. Los planes válidos están fijados en tres
-- CHECK de columna (firms.plan, payment_intents.plan, subscription_payments.plan)
-- y el cupo de usuarios lo escribe la función apply_subscription_payment con un
-- CASE. Sin esto, el primer pago de FIRMA fallaría al insertar y, si pasara, la
-- firma quedaría con cupo de 1. El backend ya conoce el plan; aquí se le
-- permite guardarlo.
--
-- LOS CHECK ORIGINALES NO TIENEN NOMBRE. Se crearon inline en ADD COLUMN, así
-- que Postgres les puso el suyo (normalmente <tabla>_plan_check, pero no hay
-- garantía si hubo choques). Por eso se buscan en pg_constraint por tabla,
-- columna y definición, en lugar de adivinar el nombre; los nuevos sí llevan
-- nombre para que la próxima ampliación sea un DROP CONSTRAINT directo.
--
-- Las firmas existentes no cambian: ningún dato se reescribe, solo se amplía
-- lo que la columna acepta.
-- ==============================================================================

-- ==============================================================================
-- 1. Quitar los CHECK anónimos de `plan` en las tres tablas
-- ==============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.conname, c.conrelid::regclass AS tabla
          FROM pg_constraint c
          JOIN pg_namespace n ON n.oid = c.connamespace
          JOIN pg_attribute a ON a.attrelid = c.conrelid
                             AND a.attnum = ANY (c.conkey)
         WHERE n.nspname = 'public'
           AND c.contype = 'c'
           AND c.conrelid IN ('public.firms'::regclass,
                              'public.payment_intents'::regclass,
                              'public.subscription_payments'::regclass)
           AND a.attname = 'plan'
           AND pg_get_constraintdef(c.oid) LIKE '%ESENCIAL%'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tabla, r.conname);
    END LOOP;
END;
$$;

-- ==============================================================================
-- 2. Volver a ponerlos, con nombre y con FIRMA
-- ==============================================================================
ALTER TABLE public.firms
    DROP CONSTRAINT IF EXISTS firms_plan_valido,
    ADD CONSTRAINT firms_plan_valido
        CHECK (plan IS NULL OR plan IN ('ESENCIAL', 'PREMIUM', 'FIRMA'));

ALTER TABLE public.payment_intents
    DROP CONSTRAINT IF EXISTS payment_intents_plan_valido,
    ADD CONSTRAINT payment_intents_plan_valido
        CHECK (plan IS NULL OR plan IN ('ESENCIAL', 'PREMIUM', 'FIRMA'));

ALTER TABLE public.subscription_payments
    DROP CONSTRAINT IF EXISTS subscription_payments_plan_valido,
    ADD CONSTRAINT subscription_payments_plan_valido
        CHECK (plan IN ('ESENCIAL', 'PREMIUM', 'FIRMA'));

-- ==============================================================================
-- 3. APLICAR UN PAGO DE SUSCRIPCIÓN — mismo cuerpo, cupo de FIRMA añadido
-- ==============================================================================
-- Copia íntegra de la función de migration-suscripciones.sql; lo único que
-- cambia es el CASE del cupo: PREMIUM 5, FIRMA 15, cualquier otro 1. Se copia
-- completa porque CREATE OR REPLACE sustituye el cuerpo entero, y un cuerpo
-- parcial dejaría la idempotencia de los reintentos de Wompi a medias.
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

    -- El cupo va con el plan pagado. Debe coincidir con `maxUsuarios` del
    -- catálogo del backend (plan.catalog.ts): 1 / 5 / 15.
    v_max_users := CASE v_plan
                       WHEN 'PREMIUM' THEN 5
                       WHEN 'FIRMA' THEN 15
                       ELSE 1
                   END;

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

-- Los permisos de la función no cambian con CREATE OR REPLACE, pero se
-- reafirman por si esta migración corre en una base donde la anterior no
-- llegó a revocar.
REVOKE ALL ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(TEXT, TEXT) TO service_role;
