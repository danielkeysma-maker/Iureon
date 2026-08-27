-- ==============================================================================
-- MIGRACIÓN: los borradores dejan de ser archivos y pasan a ser plazos
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente.
--
-- POR QUÉ. La tabla guardaba título, tipo y texto, y se ordenaba por última
-- edición. Eso trata un borrador jurídico como un archivo que espera, y no lo
-- es: es un PLAZO QUE CORRE. Un escrito editado hace un mes cuyo término vence
-- pasado mañana importa más que uno tocado esta mañana sin fecha a la vista, y
-- ordenar por fecha de edición los pone al revés.
--
-- Todo lo que se agrega aquí existe para responder tres preguntas que la lista
-- no podía responder: cuándo vence, de qué proceso es, y en qué estado está.
-- ==============================================================================

-- ─── CUÁNDO VENCE ─────────────────────────────────────────────────────────────
--
-- Se guarda la FECHA, no el término.
--
-- El catálogo tiene el término como TEXTO —«Dentro de los diez (10) días
-- siguientes a la presentación de la solicitud»— y de ahí no sale una fecha:
-- falta saber cuándo empezó a correr, y eso solo lo sabe quien lleva el caso.
-- Calcularla nosotros sería inventar un plazo, que es la única cosa que este
-- producto no puede hacer.
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS vence_el DATE;

-- La rama, para poder resolver la actuación y mostrar su ficha en la lista.
-- Sin ella un borrador guardado pierde el vínculo con el catálogo que lo
-- fundamentó, y la lista solo puede mostrar el nombre del archivo.
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS legal_branch TEXT;

-- ─── DE QUÉ PROCESO ES ────────────────────────────────────────────────────────
--
-- "Mosquera · Juzgado 12 Laboral" es lo que le permite a un abogado reconocer
-- su escrito en una lista de treinta y cuatro. El título solo no basta: cinco
-- casos distintos pueden ser todos "Acción de tutela".
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS cliente TEXT;

ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS despacho TEXT;

-- El radicado en mono, que es el dato que se pega en un escrito.
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS radicado TEXT;

-- ─── EN QUÉ ESTADO ────────────────────────────────────────────────────────────
--
-- BORRADOR   se está escribiendo
-- REVISAR    tiene afirmaciones sin comprobar
-- LISTO      revisado, sin radicar
-- RADICADO   se llevó al juzgado
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'BORRADOR';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saved_drafts_estado_check'
    ) THEN
        ALTER TABLE public.saved_drafts
            ADD CONSTRAINT saved_drafts_estado_check
            CHECK (estado IN ('BORRADOR', 'REVISAR', 'LISTO', 'RADICADO'));
    END IF;
END $$;

/*
 * LO RADICADO NO SE EDITA NUNCA MÁS.
 *
 * Un escrito que ya se llevó al juzgado es una copia inmutable: lo que está en
 * el expediente no puede diferir de lo que la firma tiene guardado, porque esa
 * copia es la prueba de qué se presentó. Se consulta y se duplica; no se cambia.
 *
 * La fecha marca el momento, y el disparador de abajo lo hace cumplir en la
 * base — no en la pantalla, donde un `disabled` se salta con una petición.
 */
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS radicado_el TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.impedir_editar_radicado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo bloquea el CONTENIDO. Marcar como radicado, o corregir el número de
    -- radicación, siguen siendo posibles: lo que no puede cambiar es el escrito.
    IF OLD.radicado_el IS NOT NULL AND NEW.legal_text IS DISTINCT FROM OLD.legal_text THEN
        RAISE EXCEPTION 'El escrito ya fue radicado el % y su texto no se puede modificar.', OLD.radicado_el;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_editar_radicado ON public.saved_drafts;
CREATE TRIGGER trg_impedir_editar_radicado
    BEFORE UPDATE ON public.saved_drafts
    FOR EACH ROW EXECUTE FUNCTION public.impedir_editar_radicado();

-- ─── VERSIONES ────────────────────────────────────────────────────────────────
--
-- "v4", "v6". En una firma dos abogados editan el mismo escrito y hay que saber
-- cuál es la buena. El número vive aquí; el historial completo es otra tabla y
-- otra migración.
ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────
--
-- El orden por defecto de la aplicación es por término más próximo, así que ese
-- es el índice que importa. `NULLS LAST` porque un escrito sin fecha —una tutela,
-- que no caduca— va después de los que sí corren, no antes.
CREATE INDEX IF NOT EXISTS idx_saved_drafts_termino
    ON public.saved_drafts(firm_id, vence_el NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_saved_drafts_firma
    ON public.saved_drafts(firm_id, updated_at DESC);

-- ==============================================================================
-- GRANTS
-- ==============================================================================
-- Las columnas nuevas heredan los permisos de la tabla, pero la función es
-- nueva y nace sin ninguno.
REVOKE ALL ON FUNCTION public.impedir_editar_radicado() FROM PUBLIC;
