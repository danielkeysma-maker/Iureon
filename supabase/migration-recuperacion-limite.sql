-- ==============================================================================
-- MIGRACIÓN: límite de solicitudes de recuperación de contraseña por correo
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada.
--
-- QUÉ ES. `POST /api/auth/recuperar` manda un correo con un enlace para poner
-- una contraseña nueva. Un endpoint público que envía correos es abusable: se
-- puede usar para llenarle la bandeja a otra persona o para recorrer una lista
-- de direcciones. Esta tabla cuenta las solicitudes: tres por correo cada 30
-- minutos y diez por dirección IP cada hora (`auth/recuperacion.rules.ts`).
--
-- POR QUÉ UNA TABLA Y NO MEMORIA. El backend corre en funciones serverless:
-- cada petición puede caer en un proceso distinto y un contador en memoria se
-- pone a cero solo. Es la misma razón de `trial_signups`.
--
-- SIN ESTA TABLA LA RECUPERACIÓN NO ENVÍA NADA y responde 503 «no disponible»:
-- un límite que desaparece cuando falta una migración no es un límite. Esa
-- respuesta no depende del correo escrito, así que no delata cuentas.
--
-- NI CORREOS NI DIRECCIONES EN CLARO. Se guardan huellas HMAC-SHA256 con una
-- llave que solo tiene el servidor: la tabla no dice quién pidió qué. Tampoco
-- dice si el correo tenía cuenta — se anota ANTES de buscarla, porque el límite
-- no puede depender de que la cuenta exista.
--
-- NO SE CONSERVA. El servidor borra las filas de más de un día en cada
-- solicitud: pasada la ventana más larga (una hora) ya no sirven para nada.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: solo alcanzan las tablas
-- que existían cuando corrieron. Por eso esta migración concede y revoca
-- explícitamente.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.password_recovery_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_hash TEXT NOT NULL,
    -- NULL cuando la petición no trajo dirección utilizable.
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Los dos conteos por ventana y la limpieza por antigüedad.
CREATE INDEX IF NOT EXISTS idx_password_recovery_email_created
    ON public.password_recovery_requests(email_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_recovery_ip_created
    ON public.password_recovery_requests(ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_recovery_created
    ON public.password_recovery_requests(created_at);

-- ==============================================================================
-- Ninguna firma ni ningún usuario tiene nada que leer aquí: la fila se escribe
-- desde el backend, antes de que exista una sesión. RLS activo sin ninguna
-- política equivale a «nadie que no sea service_role».
-- ==============================================================================
ALTER TABLE public.password_recovery_requests ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.password_recovery_requests TO service_role;
REVOKE ALL ON public.password_recovery_requests FROM authenticated;
REVOKE ALL ON public.password_recovery_requests FROM anon;
