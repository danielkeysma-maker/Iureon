-- ==============================================================================
-- MIGRACIÓN: el archivo original de una revisión
-- ==============================================================================
-- Ejecutar UNA vez en el SQL Editor de Supabase. Es idempotente: se puede
-- correr de nuevo sin efecto.
--
-- QUÉ RESUELVE. El taller mostraba el TEXTO extraído del escrito, reflujado a
-- un solo párrafo continuo. Para revisar bien hay que ver el documento como lo
-- verá el juez: qué está en negrita, qué es título, qué es tabla, qué es nota
-- al pie. Todo eso lo pierde la extracción, que es justo lo primero que un
-- litigante lee. Ahora el archivo tal como se subió se conserva y se muestra
-- con su diagramación.
--
-- EL BINARIO NO VIVE EN POSTGRES. El archivo se sube directo del navegador a
-- Backblaze B2 bajo el prefijo de la firma —el mismo camino del audio de las
-- audiencias, por la misma razón: Vercel rechaza cuerpos de más de 4,5 MB— y
-- aquí solo quedan su CLAVE, su tipo y su tamaño. Guardar quince megas de PDF
-- en una columna convertiría cada lectura de la lista en una descarga.
--
-- CON LA MISMA AUTORIZACIÓN QUE EL TEXTO. Conservar el original cambia lo que
-- Iureon guarda de la firma exactamente igual que conservar el texto, así que
-- lo gobierna la misma decisión del socio administrador
-- (`firms.guarda_escritos_revisados`, migration-taller-revision.sql). Sin ella
-- el original vive solo en la pestaña abierta y la pantalla lo dice.
--
-- CÓMO SE BORRA. Al borrar la revisión, el servidor borra antes el objeto de
-- B2. Al borrar la firma entera, el barrido de `borrarFirmaConTodo` lista y
-- borra TODO lo que cuelga del prefijo `<firm_id>/`, así que estos archivos
-- entran solos; no hace falta tocar `borrar_firma_completa`, que ya elimina la
-- fila de `document_reviews` donde vive la clave.
-- ==============================================================================

ALTER TABLE public.document_reviews
    ADD COLUMN IF NOT EXISTS archivo_original_clave TEXT,
    ADD COLUMN IF NOT EXISTS archivo_original_tipo  TEXT,
    ADD COLUMN IF NOT EXISTS archivo_original_bytes BIGINT;

COMMENT ON COLUMN public.document_reviews.archivo_original_clave IS
    'Clave del archivo tal como se subió, en Backblaze B2, bajo el prefijo de la firma. NULL cuando no se conservó (firma sin autorización, texto pegado, o revisión anterior a esta migración).';
COMMENT ON COLUMN public.document_reviews.archivo_original_tipo IS
    'Tipo MIME declarado por el navegador al subirlo: decide con qué visor se abre (PDF, Word, imagen).';
COMMENT ON COLUMN public.document_reviews.archivo_original_bytes IS
    'Tamaño en bytes, para anunciarlo antes de descargarlo.';
