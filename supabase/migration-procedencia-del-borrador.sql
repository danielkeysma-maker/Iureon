-- ==============================================================================
-- LA PROCEDENCIA VIAJA CON EL BORRADOR GUARDADO
-- ==============================================================================
--
-- QUÉ RESUELVE. El motor resuelve la ficha del catálogo para redactar —su
-- artículo, su autoridad, si el término está comprobado— y desde el trabajo de
-- 5a esa procedencia llega al visor. Pero se perdía al GUARDAR: la tabla mapea
-- columnas explícitas, así que un borrador reabierto mañana ya no sabía contra
-- qué ficha se escribió.
--
-- El efecto no es cosmético. Un escrito que afirma un plazo y no recuerda de
-- dónde salió no se puede revisar: hay que volver a adivinar la actuación para
-- comprobarlo. Y la lista de borradores (10c) quiere decir «2 sin verificar»
-- junto al término que corre, que es exactamente este dato.
--
-- ─── POR QUÉ JSONB Y NO COLUMNAS ────────────────────────────────────────────
--
-- La procedencia es una FOTO de la ficha en el momento de redactar, no una
-- referencia viva. Si mañana la firma corrige el término de esa actuación, el
-- escrito ya redactado siguió afirmando lo que afirmó: guardar el `actuacion_id`
-- y releer el catálogo mostraría un plazo que ese texto nunca dijo.
--
-- Un `jsonb` congela lo que se usó. Es deliberadamente inmutable, como el texto.
--
-- ─── NULO SIGNIFICA «NO SE REGISTRÓ», NO «SIN RESPALDO» ─────────────────────
--
-- Los borradores anteriores a esta columna quedan en NULL, y la interfaz NO los
-- advierte: no sabemos que les falte respaldo, sabemos que no lo anotamos. Son
-- cosas distintas y confundirlas llenaría la lista de alarmas falsas sobre
-- escritos que quizá estaban perfectamente respaldados.

ALTER TABLE public.saved_drafts
    ADD COLUMN IF NOT EXISTS procedencia JSONB;

COMMENT ON COLUMN public.saved_drafts.procedencia IS
    'Foto de la ficha del catálogo con la que se redactó: artículo, autoridad, estado del término y secciones sin artículo. NULL = no se registró, que no es lo mismo que sin respaldo.';
