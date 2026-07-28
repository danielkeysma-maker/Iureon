-- =================================================================
-- IUREON LEGALTECH - SCRIPT DE MIGRACIÓN SUPABASE PGVECTOR & RLS B2B
-- Copia y pega este script en: Supabase Dashboard -> SQL Editor -> Run
-- =================================================================

-- 1. Habilitar extensión vectorial para embeddings de 1536 dimensiones (OpenAI / Claude / Gemini)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabla de Firmas Cliente (Multi-Tenant B2B)
CREATE TABLE IF NOT EXISTS public.firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nit TEXT UNIQUE NOT NULL,
  plan_tier TEXT DEFAULT 'PRO_FIRM',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Embeddings de Documentos, Códigos y Expedientes (RAG Vector)
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT NOT NULL,
  expediente_id TEXT,
  branch TEXT NOT NULL, -- LABORAL, CIVIL, ADMINISTRATIVO, PENAL, CONSTITUCIONAL, INTERNACIONAL
  file_name TEXT NOT NULL,
  content_chunk TEXT NOT NULL,
  embedding vector(1536), -- Vector de 1536d
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar Seguridad por Filas (Row Level Security - RLS)
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;

-- 5. Política RLS Aislada por firm_id
CREATE POLICY "Aislamiento por firm_id en embeddings"
ON public.document_embeddings
FOR ALL
USING (firm_id = current_setting('app.current_firm_id', true) OR firm_id = 'SYSTEM_CORPUS');

-- 6. Tabla de Aprendizaje de Jerga y Estilo Jurídico por Firma
CREATE TABLE IF NOT EXISTS public.firm_style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT UNIQUE NOT NULL,
  preferred_terms JSONB DEFAULT '{}'::jsonb,
  frequent_phrases JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla de Auditoría Inmutable Compliance B2B
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
