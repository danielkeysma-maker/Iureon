-- ==============================================================================
-- MIGRACIÓN: los papeles del expediente se alinean con los de la audiencia
-- ==============================================================================
-- Ejecutar UNA vez, DESPUÉS de `migration-expedientes.sql`. Es idempotente.
--
-- ── POR QUÉ, SI LA TABLA SE CREÓ HACE UN RATO ────────────────────────────────
--
-- Porque me inventé una lista de seis papeles —PARTE, APODERADO, TESTIGO,
-- PERITO, AUTORIDAD, OTRO— cuando esta casa YA TENÍA una lista curada de
-- veintidós, escrita para audiencias colombianas y usada por el módulo de
-- transcripción desde hace meses (`backend/src/modules/transcription/types.ts`,
-- `SpeakerRole`).
--
-- Dos listas para lo mismo es el defecto que este repositorio ya conoce con
-- nombre propio: envejecen por separado y un día dicen cosas distintas. Y aquí
-- además se pierde algo concreto: si el papel del actor y el rol de la voz se
-- llaman igual, un testigo del expediente se puede EMPAREJAR con quien habló en
-- la audiencia grabada de ese mismo expediente. Con dos vocabularios, no.
--
-- ── LO QUE LA LISTA CURADA TRAE Y LA MÍA NO ──────────────────────────────────
--
-- 1. LAS ETAPAS PENALES SEPARADAS: indiciado, imputado, acusado, procesado y
--    condenado. Están separadas a propósito —la decisión ya está tomada y
--    escrita en el módulo de transcripción— porque cuál aplica depende de la
--    audiencia, y eso lo sabe el abogado, no el sistema.
-- 2. LA VÍCTIMA y su representante, que en mi lista quedaban en «OTRO».
-- 3. EL APODERADO DE CADA LADO por separado, y no un «APODERADO» a secas.
-- 4. La distinción entre FISCAL, MINISTERIO_PUBLICO y DEFENSOR_PUEBLO, que mi
--    «AUTORIDAD» borraba.
--
-- ── QUIÉN SE INTERROGA Y QUIÉN NO ────────────────────────────────────────────
--
-- No se marca en la base sino en el código (`PAPELES_INTERROGABLES` en
-- `types.ts`), porque es una regla de producto que puede afinarse sin migrar
-- una tabla. Se interroga a: las partes (demandante, demandado y la persona
-- procesada en cualquiera de sus cinco etapas), la víctima, los testigos y el
-- perito —a este último por la contradicción del dictamen—. NO se interroga al
-- juez, al secretario, a los apoderados, al intérprete ni a los intervinientes
-- de control: están en el expediente porque hay que saber quiénes son, no
-- porque se les pregunte.
--
-- ── NO SE PIERDE NADA ────────────────────────────────────────────────────────
-- La tabla se creó hoy y está vacía, pero la conversión va escrita igual: si
-- alguien alcanzó a registrar actores entre una migración y otra, se traducen
-- en vez de rechazarse. Un CHECK nuevo sobre filas viejas que no cumplen falla
-- entero y deja la migración a medias.
-- ==============================================================================


-- ==============================================================================
-- 1. Traducir lo que hubiera con los papeles viejos
-- ==============================================================================
UPDATE public.expediente_actores SET papel = 'DEMANDANTE'  WHERE papel = 'PARTE'     AND lado = 'PROPIO';
UPDATE public.expediente_actores SET papel = 'DEMANDADO'   WHERE papel = 'PARTE'     AND lado <> 'PROPIO';
UPDATE public.expediente_actores SET papel = 'APODERADO_DEMANDANTE' WHERE papel = 'APODERADO' AND lado = 'PROPIO';
UPDATE public.expediente_actores SET papel = 'APODERADO_DEMANDADO'  WHERE papel = 'APODERADO' AND lado <> 'PROPIO';
UPDATE public.expediente_actores SET papel = 'JUEZ'        WHERE papel = 'AUTORIDAD';
UPDATE public.expediente_actores SET papel = 'DESCONOCIDO' WHERE papel = 'OTRO';


-- ==============================================================================
-- 2. El CHECK nuevo
-- ==============================================================================
ALTER TABLE public.expediente_actores
    DROP CONSTRAINT IF EXISTS expediente_actores_papel_check;

ALTER TABLE public.expediente_actores
    ADD CONSTRAINT expediente_actores_papel_check CHECK (papel IN (
        -- El estrado
        'JUEZ', 'SECRETARIO',
        -- Parte acusadora y control estatal
        'FISCAL', 'MINISTERIO_PUBLICO', 'DEFENSOR_PUEBLO',
        -- Defensa penal y la persona procesada, por etapas
        'DEFENSOR', 'INDICIADO', 'IMPUTADO', 'ACUSADO', 'PROCESADO', 'CONDENADO',
        -- Víctimas
        'VICTIMA', 'REPRESENTANTE_VICTIMAS',
        -- Civil, laboral y administrativo: la parte y su apoderado NO son la
        -- misma persona, y en un interrogatorio de parte declara la parte.
        'APODERADO_DEMANDANTE', 'APODERADO_DEMANDADO', 'DEMANDANTE', 'DEMANDADO',
        -- Prueba
        'TESTIGO', 'PERITO', 'INTERPRETE',
        -- Y el que todavía no se sabe qué es
        'DESCONOCIDO'
    ));


-- ==============================================================================
-- 3. COMPROBACIÓN
-- ==============================================================================
-- Debe devolver una fila, con la lista larga dentro.
SELECT conname AS restriccion, pg_get_constraintdef(oid) AS definicion
  FROM pg_constraint
 WHERE conname = 'expediente_actores_papel_check';
