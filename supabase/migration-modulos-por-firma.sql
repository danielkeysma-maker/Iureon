-- ==============================================================================
-- MIGRACIÓN: módulos desactivados por firma (ajuste del operador)
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase, después de
-- migration-suscripciones.sql. Es idempotente: volver a correrla no rompe nada.
--
-- QUÉ ES. El plan sigue siendo la base de lo que una firma puede usar
-- (Esencial abre nueve módulos; Premium y Firma, todos). Esta columna deja que
-- el operador RESTE módulos a una firma concreta sin tocarle el plan —
-- «desactivar Audiencias para esta firma hasta que se ponga al día»— y los
-- devuelva después. La firma ve el módulo como no disponible; nunca se le
-- muestra como «no incluido en el plan», porque no es verdad.
--
-- POR QUÉ UNA LISTA DE LO DESACTIVADO Y NO DE LO PERMITIDO. Lo permitido lo
-- dicta el plan y cambia cuando la firma paga otro; si aquí se guardara la
-- lista completa, un pago de Premium tendría que reescribirla y una firma que
-- sube de plan seguiría con la lista vieja. Guardando solo la resta, el plan
-- manda y el ajuste sobrevive a cualquier cambio de plan: lo que el operador
-- quitó sigue quitado hasta que él mismo lo devuelva.
--
-- POR QUÉ NO HAY CHECK SOBRE LOS VALORES. El catálogo de módulos vive en el
-- código (backend/src/modules/subscriptions/plan.catalog.ts) y es el servicio
-- quien rechaza un identificador desconocido con INVALID_MODULE. Un CHECK aquí
-- obligaría a una migración por cada módulo nuevo y, peor, dejaría la base
-- rechazando lo que el código ya acepta.
--
-- LAS FIRMAS QUE YA EXISTEN NO SE TOCAN: el vacío ('{}') es «nada restado».
-- Hasta que esta migración corra, el backend lee la columna ausente como vacía
-- y lo dice una vez en el log; el ajuste desde la consola responde 503
-- MIGRATION_REQUIRED nombrando este archivo.
-- ==============================================================================

ALTER TABLE public.firms
    ADD COLUMN IF NOT EXISTS modulos_desactivados TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.firms.modulos_desactivados IS
    'Módulos que el operador restó a esta firma por encima de su plan (identificadores de plan.catalog.ts). Vacío = el plan manda entero.';
