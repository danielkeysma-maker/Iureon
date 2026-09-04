-- ==============================================================================
-- MIGRACIÓN: avisos por Web Push y autoría de la última edición de un borrador
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada.
--
-- POR QUÉ PUSH Y NO CORREO. Este backend no tiene correo saliente —ni SMTP, ni
-- proveedor, ni plantillas— y montarlo cuesta una cuenta, un dominio verificado
-- y una cola. Web Push no cuesta nada: el navegador entrega el aviso por el
-- servicio de su fabricante con un par de llaves VAPID que se generan una vez.
-- Llega al teléfono con la aplicación cerrada, y llega en segundos, que es lo
-- que una respuesta de soporte o un borrador editado por un colega necesitan.
--
-- UNA SUSCRIPCIÓN ES UN NAVEGADOR, NO UNA PERSONA. El mismo abogado tiene una
-- fila por cada dispositivo donde activó los avisos. `endpoint` es único: el
-- navegador puede mandar la misma suscripción dos veces y no debe recibir dos
-- avisos iguales.
--
-- POR QUÉ SE GUARDA EL ROL. El operador de la plataforma (SUPER_ADMIN) no
-- pertenece a la firma que le escribe a soporte: para avisarle hay que
-- buscarlo por su rol, no por `firm_id`. El rol se copia del token en el
-- momento de suscribirse; si cambia, el dispositivo se vuelve a suscribir al
-- abrir la aplicación y la fila se actualiza.
--
-- `failed_at` marca un envío rechazado por algo distinto de 404/410 (esos dos
-- borran la fila: el navegador ya no existe). Sirve para ver desde la base qué
-- suscripciones llevan tiempo sin recibir nada sin tener que borrarlas a ciegas.
--
-- BORRADORES: `updated_by_email` es quien guardó la última edición —antes solo
-- existía `user_email`, el creador, y un socio que corregía el escrito de otro
-- quedaba invisible—. `notified_at` sostiene el TOPE DE UN AVISO CADA 10
-- MINUTOS por borrador: el taller guarda con cada cambio de texto, y sin ese
-- tope una sesión de edición de media hora serían treinta avisos iguales en
-- el teléfono de cada colega, que es la manera más rápida de enseñar a
-- ignorarlos todos.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: solo alcanzan las tablas
-- que existían cuando corrieron. Por eso esta migración concede y revoca
-- explícitamente.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    role TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

-- Los tres caminos de lectura: la firma entera, el operador por rol, y los
-- dispositivos de un usuario para la pantalla de estado y la prueba.
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_firm ON public.push_subscriptions(firm_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role ON public.push_subscriptions(role);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_email);

ALTER TABLE public.saved_drafts ADD COLUMN IF NOT EXISTS updated_by_email TEXT;
ALTER TABLE public.saved_drafts ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- ==============================================================================
-- RLS: cada firma ve solo sus suscripciones. El backend lee con el rol de
-- servicio, que es el único que cruza firmas para encontrar al operador.
-- ==============================================================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "tenant_isolation_push_subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.push_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- anon no tiene nada que hacer aquí: una suscripción permite escribirle al
-- teléfono de un abogado.
REVOKE ALL ON public.push_subscriptions FROM anon;
