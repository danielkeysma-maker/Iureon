-- ==============================================================================
-- IUREON LEGALTECH B2B — CANONICAL MULTI-TENANT SCHEMA (Supabase + pgvector)
-- ==============================================================================
-- This file is the SINGLE SOURCE OF TRUTH for the database schema.
-- Run it in: Supabase Dashboard -> SQL Editor -> Run
--
-- DESIGN NOTE — why firm_id is TEXT and not UUID:
-- The application uses non-UUID sentinel tenant identifiers ('INDEPENDENT' for
-- solo lawyers, 'N/A' for the global super admin) and generates document ids as
-- 'doc-<n>' strings (see backend/src/modules/ingestion/ingestion.service.ts).
-- A UUID column with a foreign key to firms would reject every one of those
-- writes at runtime. The schema therefore models tenant and document ids as
-- TEXT. Migrating to real UUIDs requires changing tenant identity in the app
-- first; it is not a schema-only change.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. FIRMS — client law firms (tenants)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.firms (
    firm_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nit TEXT UNIQUE,
    plan_tier TEXT NOT NULL DEFAULT 'PRO_FIRM',
    subscription_status TEXT NOT NULL DEFAULT 'active', -- active | past_due | canceled
    credit_balance_cop NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_firms_subscription ON public.firms(subscription_status);

-- ==============================================================================
-- 2. LEGAL_DOCUMENTS — case files stored in Backblaze B2, isolated per tenant
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id TEXT PRIMARY KEY,
    firm_id TEXT NOT NULL,
    title TEXT NOT NULL,
    b2_file_url TEXT NOT NULL, -- b2://iureon-vault/{firm_id}/{case_id}/{doc_id}.pdf
    file_size_bytes BIGINT,
    mime_type TEXT DEFAULT 'application/pdf',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_firm ON public.legal_documents(firm_id);

-- ==============================================================================
-- 3. DOCUMENT_EMBEDDINGS — RAG vectors (1536d), isolated per tenant
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id TEXT REFERENCES public.legal_documents(id) ON DELETE CASCADE,
    firm_id TEXT NOT NULL, -- 'SYSTEM_CORPUS' holds the shared public law corpus
    branch TEXT,           -- LABORAL | CIVIL | ADMINISTRATIVO | PENAL | CONSTITUCIONAL | ...
    file_name TEXT,
    content_chunk TEXT NOT NULL,
    embedding vector(1536),
    chunk_index INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_firm ON public.document_embeddings(firm_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw
    ON public.document_embeddings USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- 4. SAVED_DRAFTS — persisted AI drafts per firm and user
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL,
    legal_text TEXT NOT NULL,
    jurisprudencia_citada JSONB NOT NULL DEFAULT '[]'::jsonb,
    excepciones_formuladas JSONB NOT NULL DEFAULT '[]'::jsonb,
    tokens_consumed INT NOT NULL DEFAULT 0,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_drafts_firm ON public.saved_drafts(firm_id);
CREATE INDEX IF NOT EXISTS idx_saved_drafts_firm_user ON public.saved_drafts(firm_id, user_email);

-- ==============================================================================
-- 5. FIRM_STYLE_PROFILES — "Enseñar Estilo" learned formatting per firm
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.firm_style_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT UNIQUE NOT NULL,
    preferred_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
    frequent_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_format TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. AUDIT_LOGS — immutable B2B compliance trail
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_firm ON public.audit_logs(firm_id);

-- ==============================================================================
-- 7. CATALOG_VERIFICATIONS — procedural knowledge curated inside the product
-- ==============================================================================
-- The shipped catalogue (backend/src/modules/catalog/data/*.ts) is the base
-- knowledge. This table is how a firm corrects or confirms an entry WITHOUT a
-- developer editing source: a lawyer verifies an actuación's deadline against
-- the norm once, and every future draft for that firm uses it.
--
-- Scope is deliberately per-firm. One tenant's verification must never silently
-- change the legal advice another tenant receives; confirmed entries are
-- promoted into the shipped catalogue by review, not by cross-tenant write.
--
-- verified_by is NOT NULL because this is legal knowledge: every claim about a
-- caducidad has to be attributable to the person who checked it.
CREATE TABLE IF NOT EXISTS public.catalog_verifications (
    firm_id TEXT NOT NULL,
    actuacion_id TEXT NOT NULL,   -- e.g. 'administrativo/demanda-de-nulidad-simple'
    term_status TEXT NOT NULL CHECK (term_status IN ('VERIFICADO', 'NO_CADUCA', 'NO_VERIFICADO')),
    term_description TEXT,        -- NULL exactly when term_status = 'NO_VERIFICADO'
    legal_basis TEXT,             -- overrides the shipped article when the firm corrects it
    source_url TEXT,              -- where it was verified; required to claim a term
    note TEXT,
    verified_by TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (firm_id, actuacion_id),
    CONSTRAINT chk_unverified_has_no_term CHECK (
        (term_status = 'NO_VERIFICADO' AND term_description IS NULL)
        OR (term_status <> 'NO_VERIFICADO' AND term_description IS NOT NULL AND source_url IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_catalog_verifications_firm ON public.catalog_verifications(firm_id);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY — strict tenant isolation
-- ==============================================================================
-- The backend connects with the service role key, which bypasses RLS by design;
-- isolation there is enforced by the x-firm-id middleware. These policies are
-- the second line of defence for any anon/authenticated client and for the
-- shared read-only law corpus.
--
-- app.current_firm_id is the session GUC a tenant-scoped connection must set.

ALTER TABLE public.legal_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_drafts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_verifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_firm_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        NULLIF(auth.jwt() -> 'app_metadata' ->> 'firm_id', ''),
        NULLIF(current_setting('app.current_firm_id', true), '')
    );
$$;

DROP POLICY IF EXISTS "tenant_isolation_legal_documents" ON public.legal_documents;
CREATE POLICY "tenant_isolation_legal_documents"
    ON public.legal_documents FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- Embeddings: a tenant reads its own vectors plus the shared public law corpus,
-- but may only write its own.
DROP POLICY IF EXISTS "tenant_read_document_embeddings" ON public.document_embeddings;
CREATE POLICY "tenant_read_document_embeddings"
    ON public.document_embeddings FOR SELECT
    USING (firm_id = public.current_firm_id() OR firm_id = 'SYSTEM_CORPUS');

DROP POLICY IF EXISTS "tenant_write_document_embeddings" ON public.document_embeddings;
CREATE POLICY "tenant_write_document_embeddings"
    ON public.document_embeddings FOR INSERT
    WITH CHECK (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_delete_document_embeddings" ON public.document_embeddings;
CREATE POLICY "tenant_delete_document_embeddings"
    ON public.document_embeddings FOR DELETE
    USING (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_isolation_saved_drafts" ON public.saved_drafts;
CREATE POLICY "tenant_isolation_saved_drafts"
    ON public.saved_drafts FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_isolation_firm_style_profiles" ON public.firm_style_profiles;
CREATE POLICY "tenant_isolation_firm_style_profiles"
    ON public.firm_style_profiles FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- Audit logs are append-only: a tenant may read and insert its own, never
-- update or delete them.
DROP POLICY IF EXISTS "tenant_read_audit_logs" ON public.audit_logs;
CREATE POLICY "tenant_read_audit_logs"
    ON public.audit_logs FOR SELECT
    USING (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_append_audit_logs" ON public.audit_logs;
CREATE POLICY "tenant_append_audit_logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (firm_id = public.current_firm_id());

DROP POLICY IF EXISTS "tenant_isolation_catalog_verifications" ON public.catalog_verifications;
CREATE POLICY "tenant_isolation_catalog_verifications"
    ON public.catalog_verifications FOR ALL
    USING (firm_id = public.current_firm_id())
    WITH CHECK (firm_id = public.current_firm_id());

-- ==============================================================================
-- 9. RPC — tenant-scoped vector similarity search
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.match_document_chunks_multi_tenant(
    query_embedding vector(1536),
    match_count INT DEFAULT 5,
    filter_firm_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id TEXT,
    firm_id TEXT,
    content_chunk TEXT,
    similarity FLOAT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        de.id,
        de.document_id,
        de.firm_id,
        de.content_chunk,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM public.document_embeddings de
    WHERE de.embedding IS NOT NULL
      AND (de.firm_id = filter_firm_id OR de.firm_id = 'SYSTEM_CORPUS')
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
$$;
