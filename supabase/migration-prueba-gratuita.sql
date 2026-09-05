-- ==============================================================================
-- MIGRACIÓN: prueba gratuita de 7 días del plan Esencial (autoservicio)
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada.
--
-- QUÉ ES. Un visitante de la portada abre una firma por su cuenta —plan
-- ESENCIAL, periodo PRUEBA, siete días, un usuario, saldo cero— sin pasar por
-- el operador. La firma y su administrador se escriben donde siempre (`firms`
-- y Supabase Auth); esta tabla guarda SOLO el rastro de cada alta: quién,
-- desde qué dirección, cuándo y qué firma nació de ahí.
--
-- POR QUÉ UNA TABLA Y NO UN MAPA EN MEMORIA. El límite de altas por dirección
-- IP (tres cada 24 horas) tiene que sobrevivir a la instancia que lo cuenta.
-- El backend corre en funciones serverless: cada petición puede caer en un
-- proceso distinto, y un contador en memoria se pone a cero solo, así que el
-- límite existiría en el código y no en la realidad. Contar aquí hace que el
-- límite sea el mismo desde cualquier instancia.
--
-- QUÉ NO SE BORRA. Las filas no caducan: sirven para responder, meses después,
-- de dónde salió una firma que nunca pagó. La dirección IP es dato personal
-- (Ley 1581 de 2012) y se conserva con esa única finalidad —prevenir abuso—,
-- declarada en la política de tratamiento que el visitante acepta al pedir la
-- prueba.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: solo alcanzan las tablas
-- que existían cuando corrieron. Por eso esta migración concede y revoca
-- explícitamente.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.trial_signups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- En minúsculas, tal como Supabase Auth lo guarda: la unicidad real del
    -- correo la impone Auth (una cuenta por dirección); aquí solo se anota.
    email TEXT NOT NULL,
    ip TEXT,
    -- Sin FOREIGN KEY a propósito: si algún día se borra una firma de prueba
    -- abandonada, el rastro de que esa dirección ya usó su prueba debe quedar.
    firm_id TEXT NOT NULL,
    -- PRUEBA o COMPRA: la regla «una prueba gratuita por dirección, para
    -- siempre» solo cuenta las pruebas; quien compra no gasta la prueba de
    -- nadie ni queda bloqueado por ella.
    modo TEXT NOT NULL DEFAULT 'PRUEBA' CHECK (modo IN ('PRUEBA', 'COMPRA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Índices: el conteo por dirección en la ventana de 24 horas y la búsqueda
-- por correo cuando un visitante dice que «ya tiene cuenta».
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_trial_signups_ip_created
    ON public.trial_signups(ip, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trial_signups_email
    ON public.trial_signups(email);

-- ==============================================================================
-- RLS: solo el rol de servicio.
-- ==============================================================================
-- Ninguna firma tiene nada que leer aquí: la fila se escribe ANTES de que
-- exista una sesión, desde el backend, y contiene direcciones IP de terceros.
-- RLS activo sin ninguna política equivale a «nadie que no sea service_role».
ALTER TABLE public.trial_signups ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.trial_signups TO service_role;
REVOKE ALL ON public.trial_signups FROM authenticated;
REVOKE ALL ON public.trial_signups FROM anon;
