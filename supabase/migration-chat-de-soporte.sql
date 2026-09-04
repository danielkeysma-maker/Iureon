-- ==============================================================================
-- MIGRACIÓN: chat de soporte dentro de la aplicación
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: volver a
-- correrla no rompe nada.
--
-- QUÉ ES. Una conversación la abre un abogado de una firma; la responde el
-- operador de la plataforma (rol SUPER_ADMIN), que lee TODAS las conversaciones
-- de todas las firmas a través del rol de servicio. No hay agentes, ni cola de
-- prioridad, ni tiempo de respuesta prometido: lo atiende una persona en
-- horario laboral, y la interfaz lo dice con esas palabras.
--
-- QUÉ NO DEBE VIAJAR POR AQUÍ. La misma regla que rige para WhatsApp: los datos
-- de los clientes de la firma y los documentos del caso no se pegan en el chat
-- más allá de lo estrictamente necesario para describir el problema. El
-- operador no tiene acceso al material de la firma —eso se pide por el acceso
-- de soporte (8a), temporal y autorizado por un socio— y esta tabla no debe
-- convertirse en la puerta de atrás que ese mecanismo cierra.
--
-- POR QUÉ HAY CONTADORES DE NO LEÍDOS EN LA CONVERSACIÓN Y NO UNA TABLA DE
-- LECTURAS. Dos lados, dos contadores. Una tabla de «quién leyó qué» daría
-- lecturas por persona, pero el chat no las necesita: la firma es un solo
-- interlocutor y el operador otro. Los contadores se ponen a cero desde
-- TypeScript al abrir la conversación, y `updated_at` también se escribe desde
-- allí —no hay triggers, como en el resto del esquema—.
--
-- Los GRANT de schema.sql son una FOTO, no una regla: solo alcanzan las tablas
-- que existían cuando corrieron. Por eso esta migración concede y revoca
-- explícitamente en vez de confiar en aquello.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    opened_by_email TEXT NOT NULL,
    -- El asunto lo lee el operador en la bandeja antes de abrir nada: por
    -- debajo de tres caracteres no dice nada, por encima de 140 es un mensaje.
    subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 140),
    status TEXT NOT NULL DEFAULT 'ABIERTA' CHECK (status IN ('ABIERTA', 'CERRADA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Desnormalizado a propósito: la bandeja del operador y la lista de la
    -- firma se pintan sin leer la tabla de mensajes.
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    last_author TEXT CHECK (last_author IN ('FIRMA', 'OPERADOR')),
    unread_for_firm INT NOT NULL DEFAULT 0,
    unread_for_operator INT NOT NULL DEFAULT 0,
    closed_at TIMESTAMPTZ,
    closed_by_email TEXT
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- CASCADE y no SET NULL: un mensaje sin conversación no tiene lectura
    -- posible, y borrar una conversación (cosa que hoy nadie hace) no puede
    -- dejar texto huérfano de una firma en la tabla.
    conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
    -- Repetido desde la conversación para que la política RLS por firma se
    -- evalúe sin un JOIN.
    firm_id TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_side TEXT NOT NULL CHECK (author_side IN ('FIRMA', 'OPERADOR')),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Índices: la lista de la firma, la bandeja del operador y el hilo.
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_support_conversations_firm_updated
    ON public.support_conversations(firm_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_conversations_status_updated
    ON public.support_conversations(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_created
    ON public.support_messages(conversation_id, created_at);

-- ==============================================================================
-- RLS
-- ==============================================================================
-- La firma solo ve lo suyo. El operador no pasa por estas políticas: entra con
-- el rol de servicio desde el backend, que es el único que puede cruzar firmas,
-- y cada respuesta suya queda en la auditoría de la firma a la que respondió.
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_support_conversations" ON public.support_conversations;
CREATE POLICY "tenant_isolation_support_conversations"
    ON public.support_conversations FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_isolation_support_messages" ON public.support_messages;
CREATE POLICY "tenant_isolation_support_messages"
    ON public.support_messages FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- GRANTS explícitos
-- ==============================================================================
GRANT ALL PRIVILEGES ON public.support_conversations TO service_role;
GRANT ALL PRIVILEGES ON public.support_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;

-- anon no tiene nada que hacer aquí: lo que una firma escribe a soporte es suyo.
REVOKE ALL ON public.support_conversations FROM anon;
REVOKE ALL ON public.support_messages FROM anon;
