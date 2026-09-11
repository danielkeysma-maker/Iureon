-- ==============================================================================
-- MIGRACIÓN: carpetas dentro del expediente
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- ── LAS TRES REGLAS, DECIDIDAS POR EL DUEÑO ─────────────────────────────────
--
--   1. LAS CARPETAS SE ANIDAN. Una carpeta puede estar dentro de otra.
--   2. UN DOCUMENTO ESTÁ EN UNA SOLA. No se reparte ni se enlaza en dos.
--   3. EL INTERROGATORIO LEE TODO EL EXPEDIENTE, no solo la carpeta abierta.
--
-- La tercera es la que gobierna el diseño, y por eso va escrita aquí: LAS
-- CARPETAS SON ORGANIZACIÓN PARA EL ABOGADO, NO ALCANCE DE BÚSQUEDA. No tocan
-- `document_embeddings` ni la recuperación — un párrafo sigue perteneciendo al
-- expediente, esté en la carpeta que esté. Si algún día se quisiera acotar la
-- búsqueda a una carpeta, eso sería una decisión nueva y contraria a ésta.
--
-- ── POR QUÉ LA CARPETA CUELGA DEL EXPEDIENTE Y NO DE LA FIRMA ───────────────
--
-- Una carpeta «Pruebas» no significa nada suelta: significa las pruebas DE ESTE
-- ASUNTO. Colgarlas de la firma obligaría a inventar carpetas globales que cada
-- expediente tendría que ignorar, y a decidir qué pasa cuando dos asuntos
-- quieren una carpeta con el mismo nombre.
-- ==============================================================================


-- ==============================================================================
-- 1. LA CARPETA
-- ==============================================================================
-- Sin `firm_id` propio, igual que `expediente_actores`: su aislamiento se hace
-- por EXISTS contra el expediente. Duplicarlo abriría la puerta a que una
-- carpeta apunte al expediente de otra firma diciendo que es de la propia.
CREATE TABLE IF NOT EXISTS public.expediente_carpetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,

    -- ── EL ANIDAMIENTO ──────────────────────────────────────────────────────
    -- Una carpeta dentro de otra. NULO = está en la raíz del expediente.
    --
    -- ON DELETE CASCADE: borrar una carpeta se lleva las que tenía dentro. La
    -- alternativa —dejarlas sueltas en la raíz— parece más suave y es peor: el
    -- abogado borra «Pruebas» creyendo que se va con sus tres subcarpetas y se
    -- le llena la raíz de carpetas huérfanas que ya no sabe de dónde salieron.
    --
    -- Lo que NO se lleva son los DOCUMENTOS: ver la columna del punto 2.
    padre_id UUID REFERENCES public.expediente_carpetas(id) ON DELETE CASCADE,

    nombre TEXT NOT NULL CHECK (btrim(nombre) <> ''),

    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Se lista el contenido de una carpeta, o el de la raíz: el índice cubre las dos.
CREATE INDEX IF NOT EXISTS idx_carpetas_expediente
    ON public.expediente_carpetas(expediente_id, padre_id);

-- ── DOS CARPETAS HERMANAS NO SE PUEDEN LLAMAR IGUAL ─────────────────────────
-- Dentro del mismo padre, un nombre repetido es indistinguible en pantalla: el
-- abogado guarda en «Pruebas» y después no encuentra el archivo porque lo puso
-- en la OTRA «Pruebas». Dos índices y no uno, porque en SQL `NULL <> NULL`: un
-- UNIQUE sobre `padre_id` no restringe nada en la raíz, que es justo donde más
-- se repiten los nombres.
CREATE UNIQUE INDEX IF NOT EXISTS idx_carpetas_nombre_unico
    ON public.expediente_carpetas(expediente_id, padre_id, lower(btrim(nombre)))
    WHERE padre_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_carpetas_nombre_unico_raiz
    ON public.expediente_carpetas(expediente_id, lower(btrim(nombre)))
    WHERE padre_id IS NULL;


-- ==============================================================================
-- 2. EN QUÉ CARPETA ESTÁ CADA DOCUMENTO
-- ==============================================================================
-- UNA sola carpeta por documento: una columna, no una tabla de unión. La regla
-- la puso el dueño y la estructura la hace imposible de romper — con una tabla
-- de unión, «un documento en dos carpetas» sería un error de aplicación que
-- nadie notaría; con una columna, no se puede expresar.
--
-- NULO = está en la raíz del expediente. Es el estado de todo lo indexado hasta
-- hoy, y el correcto: nadie ha clasificado nada todavía.
ALTER TABLE public.legal_documents
    ADD COLUMN IF NOT EXISTS carpeta_id UUID
    REFERENCES public.expediente_carpetas(id) ON DELETE SET NULL;

-- ── SET NULL Y NO CASCADE, y aquí sí al revés que las subcarpetas ───────────
-- Borrar una carpeta NO puede borrar los documentos que había dentro. Un
-- documento indexado costó una vectorización y es del expediente, no de la
-- carpeta: se sube a la raíz y sigue buscándose. Que una carpeta se lleve por
-- delante trescientas páginas indexadas sería el peor efecto posible de un
-- gesto que el abogado hace para ordenar.

CREATE INDEX IF NOT EXISTS idx_documentos_carpeta
    ON public.legal_documents(carpeta_id) WHERE carpeta_id IS NOT NULL;


-- ==============================================================================
-- 3. RLS
-- ==============================================================================
ALTER TABLE public.expediente_carpetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_carpetas" ON public.expediente_carpetas;
CREATE POLICY "tenant_isolation_carpetas"
    ON public.expediente_carpetas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.expedientes e
            WHERE e.id = public.expediente_carpetas.expediente_id
              AND e.firm_id = public.current_firm_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expedientes e
            WHERE e.id = public.expediente_carpetas.expediente_id
              AND e.firm_id = public.current_firm_id()
        )
    );


-- ==============================================================================
-- 4. GRANTS explícitos
-- ==============================================================================
-- Los GRANT de `schema.sql` son una FOTO, no una regla: una tabla creada
-- después nace sin permisos para la API.
GRANT ALL PRIVILEGES ON public.expediente_carpetas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expediente_carpetas TO authenticated;
REVOKE ALL ON public.expediente_carpetas FROM anon;


-- ==============================================================================
-- 5. Y EL BORRADO DE FIRMA SE LAS LLEVA
-- ==============================================================================
-- `borrar_expedientes_de_la_firma` borra `public.expedientes`, y el CASCADE de
-- `expediente_id` se lleva las carpetas con él. No hay que añadir nada: se deja
-- dicho para que la próxima persona no lo busque.


-- ==============================================================================
-- 6. COMPROBACIÓN
-- ==============================================================================
-- Debe devolver cuatro filas: la tabla, sus dos columnas de estructura
-- (`padre_id` para anidar) y la columna del documento.
SELECT 'tabla' AS que, table_name AS nombre
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name = 'expediente_carpetas'
UNION ALL
SELECT 'columna', table_name || '.' || column_name
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND (
     (table_name = 'expediente_carpetas' AND column_name IN ('padre_id', 'expediente_id'))
     OR (table_name = 'legal_documents' AND column_name = 'carpeta_id')
   )
 ORDER BY 1, 2;
