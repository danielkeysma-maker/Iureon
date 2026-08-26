-- ==============================================================================
-- MIGRACIÓN: recargas por pasarela (Wompi)
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: una tabla creada después
-- nace sin permisos para la API. Por eso esta migración concede explícitamente.
-- ==============================================================================

-- ==============================================================================
-- 1. PAYMENT_INTENTS — qué firma está pagando qué, antes de que pague
-- ==============================================================================
-- Una pasarela devuelve una confirmación que dice "esta referencia se pagó". No
-- dice de quién es el saldo ni cuánto se prometió acreditar; eso hay que haberlo
-- escrito ANTES, o el servidor solo puede creerle al navegador lo que le cuente.
--
-- Y ahí está el ataque obvio: si el monto a acreditar viene del cliente, el
-- cliente paga $100.000 y pide que le acrediten $10.000.000. La intención se
-- guarda aquí primero y la confirmación solo puede emparejarse contra ella.
CREATE TABLE IF NOT EXISTS public.payment_intents (
    -- La referencia que viaja a Wompi y vuelve en el evento. Es la única cuerda
    -- entre un pago y una firma, así que es la llave.
    reference TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    -- Quién la inició, para el movimiento y para la auditoría.
    user_email TEXT NOT NULL,
    -- Lo que se acreditará si el pago se aprueba. Fijado aquí, nunca leído de
    -- la confirmación ni del navegador.
    amount_cop NUMERIC(14,2) NOT NULL CHECK (amount_cop > 0),
    -- PENDING | APPROVED | DECLINED | VOIDED | ERROR
    status TEXT NOT NULL DEFAULT 'PENDING',
    -- El id de la transacción en Wompi, para conciliar contra su dashboard.
    wompi_transaction_id TEXT,
    -- Cuándo se convirtió en saldo. NULL mientras no se haya acreditado, y es
    -- esta columna la que hace que acreditar dos veces sea imposible.
    credited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_firm
    ON public.payment_intents(firm_id, created_at DESC);

-- Una transacción de Wompi no puede pertenecer a dos intenciones. Si su sistema
-- reintenta con otra referencia, esto lo detiene en la base y no en un if.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intents_transaction
    ON public.payment_intents(wompi_transaction_id)
    WHERE wompi_transaction_id IS NOT NULL;

-- ==============================================================================
-- 2. ACREDITAR UNA RECARGA, UNA SOLA VEZ
-- ==============================================================================
-- UNA PASARELA REENVÍA. Wompi reintenta un webhook que no respondió 200, y una
-- red que se cae después de acreditar y antes de responder produce exactamente
-- eso: el mismo pago llega dos veces. Comprobar en la aplicación "¿ya estaba
-- acreditado?" y luego sumar deja una ventana entre las dos consultas por la
-- que caben los dos reintentos, y la firma recibe el doble de lo que pagó.
--
-- Aquí el UPDATE de la intención es la guarda Y la operación: solo una fila
-- puede pasar de PENDING a APPROVED, y quien la gane es el único que suma. El
-- segundo intento no encuentra nada que actualizar y devuelve NULL, que quien
-- llama debe leer como "ya estaba hecho", no como un fallo.
CREATE OR REPLACE FUNCTION public.credit_payment_intent(
    p_reference TEXT,
    p_transaction_id TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_firm_id TEXT;
    v_amount NUMERIC;
    v_balance NUMERIC;
BEGIN
    UPDATE public.payment_intents
       SET status = 'APPROVED',
           wompi_transaction_id = p_transaction_id,
           credited_at = NOW(),
           updated_at = NOW()
     WHERE reference = p_reference
       AND status = 'PENDING'
       AND credited_at IS NULL
    RETURNING firm_id, amount_cop INTO v_firm_id, v_amount;

    -- Ya estaba acreditada, o no existe. En ambos casos no se suma nada.
    IF v_firm_id IS NULL THEN
        RETURN NULL;
    END IF;

    UPDATE public.firms
       SET credit_balance_cop = credit_balance_cop + v_amount,
           updated_at = NOW()
     WHERE firm_id = v_firm_id
    RETURNING credit_balance_cop INTO v_balance;

    INSERT INTO public.credit_movements
        (firm_id, kind, amount_cop, balance_after_cop, description, actor_email)
    SELECT v_firm_id,
           'RECARGA',
           v_amount,
           v_balance,
           'Recarga por Wompi · ' || p_reference,
           user_email
      FROM public.payment_intents
     WHERE reference = p_reference;

    RETURN v_balance;
END;
$$;

-- ==============================================================================
-- 3. RLS
-- ==============================================================================
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_payment_intents" ON public.payment_intents;
CREATE POLICY "tenant_isolation_payment_intents"
    ON public.payment_intents FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- 4. GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.payment_intents TO service_role;
GRANT SELECT ON public.payment_intents TO authenticated;
REVOKE ALL ON public.payment_intents FROM anon;

-- Acreditar solo lo hace el servidor, y solo tras verificar la firma del evento.
-- Una firma que pudiera llamar esta función se recargaría sola.
GRANT EXECUTE ON FUNCTION public.credit_payment_intent(TEXT, TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION public.credit_payment_intent(TEXT, TEXT) FROM anon, authenticated;
