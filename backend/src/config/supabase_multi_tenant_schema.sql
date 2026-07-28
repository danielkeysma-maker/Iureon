-- ==============================================================================
-- IUREON LEGALTECH B2B - ESQUEMA DE BASE DE DATOS MULTI-TENANT (SUPABASE + PGVECTOR)
-- ==============================================================================

-- 1. Habilitar extensión de vectores para RAG y embeddings jurídicos
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: FIRMS (Organizaciones / Firmas de Abogados Clientes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.firms (
    firm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled'
    max_tokens_monthly INT NOT NULL DEFAULT 5000000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para búsquedas rápidas por estado de suscripción
CREATE INDEX IF NOT EXISTS idx_firms_subscription ON public.firms(subscription_status);

-- ==============================================================================
-- 3. TABLA: LEGAL_DOCUMENTS (Expedientes y Providencias aisladas por firm_id)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(firm_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    b2_file_url TEXT NOT NULL, -- Ruta aislada b2://iureon-vault/{firm_id}/{case_id}/{doc_id}.pdf
    file_size_bytes BIGINT,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    metadata JSONB DEFAULT '{}'::jsonb, -- Folios, Juzgado origen, Tipo de actuación
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de consulta multi-tenant
CREATE INDEX IF NOT EXISTS idx_legal_documents_firm ON public.legal_documents(firm_id);

-- ==============================================================================
-- 4. TABLA: DOCUMENT_EMBEDDINGS (Vectores RAG con vector(1536) y aislamiento por firm_id)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    firm_id UUID NOT NULL REFERENCES public.firms(firm_id) ON DELETE CASCADE,
    content_chunk TEXT NOT NULL,
    embedding vector(1536) NOT NULL, -- Dimensión estándar para embeddings de OpenAI/BGE
    chunk_index INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de aislamiento por firma y consulta vectorial HNSW por distancia coseno
CREATE INDEX IF NOT EXISTS idx_document_embeddings_firm ON public.document_embeddings(firm_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw 
ON public.document_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - AISLAMIENTO ESTRICTO MULTI-TENANT
-- ==============================================================================

-- A. Habilitar RLS en todas las tablas sensibles
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- B. Políticas para LEGAL_DOCUMENTS
-- La firma solo puede leer, insertar, actualizar y eliminar sus propios documentos
CREATE POLICY "Strict Tenant Isolation for Legal Documents - Select"
ON public.legal_documents
FOR SELECT
USING (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

CREATE POLICY "Strict Tenant Isolation for Legal Documents - Insert"
ON public.legal_documents
FOR INSERT
WITH CHECK (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

CREATE POLICY "Strict Tenant Isolation for Legal Documents - Update"
ON public.legal_documents
FOR UPDATE
USING (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

CREATE POLICY "Strict Tenant Isolation for Legal Documents - Delete"
ON public.legal_documents
FOR DELETE
USING (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

-- C. Políticas para DOCUMENT_EMBEDDINGS
CREATE POLICY "Strict Tenant Isolation for Document Embeddings - Select"
ON public.document_embeddings
FOR SELECT
USING (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

CREATE POLICY "Strict Tenant Isolation for Document Embeddings - Insert"
ON public.document_embeddings
FOR INSERT
WITH CHECK (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

CREATE POLICY "Strict Tenant Isolation for Document Embeddings - Delete"
ON public.document_embeddings
FOR DELETE
USING (
    firm_id = (auth.jwt() -> 'app_metadata' ->> 'firm_id')::uuid 
    OR firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
);

-- ==============================================================================
-- 6. FUNCIÓN RPC PARA BÚSQUEDA RAG VECTORIAL SCOPED POR FIRM_ID
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_document_chunks_multi_tenant(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    filter_firm_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    firm_id UUID,
    content_chunk TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        de.firm_id,
        de.content_chunk,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM public.document_embeddings de
    WHERE de.firm_id = filter_firm_id
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
