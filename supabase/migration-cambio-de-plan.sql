-- ==============================================================================
-- MIGRACIÓN: el cambio de plan empieza el día del pago
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase, después de
-- migration-plan-firma.sql. Es idempotente: `CREATE OR REPLACE FUNCTION`
-- sustituye el cuerpo entero, así que volver a correrla deja exactamente lo
-- mismo y no reescribe ningún dato existente.
--
-- ─── EL DEFECTO ─────────────────────────────────────────────────────────────
-- `apply_subscription_payment` calculaba el inicio del periodo así:
--
--     SELECT GREATEST(NOW(), COALESCE(plan_valid_until, NOW()))
--
-- Para RENOVAR el mismo plan eso es correcto y se conserva: quien paga el 10 un
-- plan que vence el 20 suma su periodo al 20 y no pierde los diez días que le
-- quedaban. Es la promesa que la pantalla del plan le hace al socio.
--
-- Para CAMBIAR de plan es un error, y cuesta dinero. La columna `plan` se
-- reescribe en el acto —la firma disfruta el plan nuevo desde que Wompi
-- confirma—, pero el periodo pagado arrancaba en la fecha de vencimiento del
-- plan anterior. De ahí salían dos cosas a la vez: la firma usaba el plan
-- superior GRATIS todos los días que le quedaban del anterior, y su fecha de
-- vencimiento se corría hacia adelante como si esos días también se los
-- hubiera comprado.
--
-- ─── LA REGLA, DECIDIDA POR EL TITULAR ──────────────────────────────────────
-- Se descartó a propósito el prorrateo. Devolver la diferencia por la pasarela
-- obliga a un segundo cobro de Wompi, cuya comisión fija se come un importe
-- pequeño: la operación pierde plata por hacer un favor. Quedan dos vías, y
-- esta función implementa la primera:
--
--   1. DENTRO DE LA APLICACIÓN: cambiar de plan se paga completo y el ciclo
--      empieza el día del pago. Los días que le quedaban del plan anterior no
--      se acreditan ni se devuelven. La pantalla de planes lo advierte ANTES de
--      pagar, no después.
--   2. POR PETICIÓN INTERNA: la firma escribe por Soporte, envía la diferencia
--      por fuera —sin comisiones— y operación actualiza el plan desde la
--      consola CONSERVANDO la fecha de vencimiento que la firma ya tenía. Esa
--      vía no pasa por aquí: la escribe el endpoint de operación, a mano y con
--      motivo en la auditoría de la firma.
--
-- Por tanto:
--
--   * plan pagado DISTINTO del que la firma tiene  →  el periodo arranca en NOW()
--   * plan pagado IGUAL, o la firma no tenía plan  →  se conserva lo de hoy:
--     GREATEST(NOW(), COALESCE(plan_valid_until, NOW()))
--
-- UN CAMBIO DE PERIODO CON EL MISMO PLAN ES UNA RENOVACIÓN, NO UN CAMBIO. Pasar
-- de Premium mensual a Premium anual extiende desde el vencimiento: es el mismo
-- servicio comprado por más tiempo, y castigarlo desincentivaría justo lo que a
-- la casa le conviene. La comparación es sobre `plan`, nunca sobre `plan_period`.
--
-- UNA FIRMA SIN PLAN PREVIO (cortesía o legado, `plan IS NULL`) NO ESTÁ
-- CAMBIANDO DE PLAN: no hay plan anterior que perder, así que se conserva el
-- comportamiento de hoy. Si además no tiene fecha, GREATEST la deja en NOW().
--
-- ─── LO QUE NO CAMBIA ───────────────────────────────────────────────────────
-- La firma de la función (dos TEXT, devuelve JSONB) es idéntica: el webhook de
-- Wompi la llama igual y no hay que tocar el backend. Sigue siendo idempotente
-- —el UPDATE de `payment_intents` con `status = 'PENDING'` es lo que hace que
-- de dos reintentos simultáneos solo uno gane—, sigue bloqueando la fila de la
-- firma con FOR UPDATE, sigue escribiendo el cupo de usuarios con el mismo CASE
-- y sigue dejando constancia en `subscription_payments` con `valid_from` y
-- `valid_until` REALES: la fila del pago dice desde cuándo y hasta cuándo corre
-- lo que se compró, que es lo que después lee la cuenta de cobro.
--
-- EL ÚNICO CAMBIO DE FORMA: antes se leía una sola expresión de `firms` y la
-- firma inexistente se detectaba porque `v_from` salía NULL. Ahora hay que leer
-- `plan` y `plan_valid_until` por separado para poder compararlos, y el plan de
-- una firma que sí existe puede ser NULL legítimamente (cortesía). Por eso la
-- ausencia se detecta con NOT FOUND y no con un NULL, que aquí ya no distingue
-- «no hay firma» de «hay firma sin plan».
-- ==============================================================================

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
    v_plan_actual TEXT;
    v_valid_until TIMESTAMPTZ;
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
    -- vez deben encadenarse, no pisarse. Se leen el plan VIGENTE y su fecha,
    -- porque la decisión de abajo necesita comparar los dos planes.
    SELECT plan, plan_valid_until
      INTO v_plan_actual, v_valid_until
      FROM public.firms
     WHERE firm_id = v_firm_id
       FOR UPDATE;

    IF NOT FOUND THEN
        -- La firma no existe: la intención quedó aprobada para conciliar a
        -- mano, pero no hay a quién extenderle nada.
        RETURN NULL;
    END IF;

    IF v_plan_actual IS NOT NULL AND v_plan_actual <> v_plan THEN
        -- CAMBIO DE PLAN: se paga completo y el ciclo empieza hoy. Los días que
        -- quedaban del plan anterior no se acreditan; quien prefiera conservar
        -- su vencimiento lo pide por Soporte antes de pagar.
        v_from := NOW();
    ELSE
        -- RENOVACIÓN del mismo plan, o primera compra de una firma sin plan:
        -- extiende desde el vencimiento si todavía está en el futuro, así que
        -- pagar antes nunca pierde días.
        v_from := GREATEST(NOW(), COALESCE(v_valid_until, NOW()));
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
