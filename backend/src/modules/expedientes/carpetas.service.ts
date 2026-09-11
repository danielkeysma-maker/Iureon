import { supabase } from '../../config/supabase.config';
import { ExpedienteError } from './expedientes.service';

/**
 * LAS CARPETAS DEL EXPEDIENTE.
 *
 * ─── LAS TRES REGLAS, Y LA QUE GOBIERNA EL DISEÑO ──────────────────────────
 *
 *   1. Se ANIDAN: una carpeta dentro de otra.
 *   2. Un documento está en UNA sola.
 *   3. El interrogatorio lee TODO el expediente, no solo la carpeta abierta.
 *
 * La tercera es la que manda: LAS CARPETAS SON ORGANIZACIÓN PARA EL ABOGADO,
 * NO ALCANCE DE BÚSQUEDA. Este archivo no toca `document_embeddings` ni la
 * recuperación — un párrafo pertenece al expediente, esté donde esté guardado.
 * Por eso las carpetas se pueden reorganizar sin miedo: mover un documento no
 * cambia una sola respuesta del motor.
 */

const db = () => {
  if (!supabase) throw new ExpedienteError('NO_DB', 'La base de datos no está configurada.', 503);
  return supabase;
};

export interface Carpeta {
  id: string;
  expedienteId: string;
  padreId: string | null;
  nombre: string;
  createdAt: string;
}

interface FilaDeCarpeta {
  id: string;
  expediente_id: string;
  padre_id: string | null;
  nombre: string;
  created_at: string;
}

const aCarpeta = (row: FilaDeCarpeta): Carpeta => ({
  id: row.id,
  expedienteId: row.expediente_id,
  padreId: row.padre_id,
  nombre: row.nombre,
  createdAt: row.created_at
});

/**
 * TODAS las carpetas del expediente, planas.
 *
 * El árbol lo arma la pantalla a partir de `padreId`. Devolverlo ya anidado
 * desde aquí obligaría a recorrerlo entero para encontrar una carpeta al
 * mover, y un expediente no tiene tantas como para que la diferencia importe.
 */
export const carpetasDelExpediente = async (
  firmId: string,
  expedienteId: string
): Promise<Carpeta[]> => {
  await expedienteDeLaFirma(firmId, expedienteId);

  const { data, error } = await db()
    .from('expediente_carpetas')
    .select('*')
    .eq('expediente_id', expedienteId)
    .order('nombre', { ascending: true });

  if (error) {
    console.error('[CARPETAS] No se pudieron listar:', error.message);
    throw new ExpedienteError('CARPETAS_FAILED', 'No se pudieron cargar las carpetas.', 502);
  }
  return ((data ?? []) as FilaDeCarpeta[]).map(aCarpeta);
};

/** Que el expediente sea de la firma. Lo mismo que hacen los actores. */
const expedienteDeLaFirma = async (firmId: string, expedienteId: string): Promise<void> => {
  const { data } = await db()
    .from('expedientes')
    .select('id')
    .eq('firm_id', firmId)
    .eq('id', expedienteId)
    .maybeSingle();
  if (!data) throw new ExpedienteError('NOT_FOUND', 'Ese expediente no existe.', 404);
};

/** Y que la carpeta sea de ESE expediente, cuando se nombra una. */
const carpetaDelExpediente = async (
  expedienteId: string,
  carpetaId: string | null | undefined
): Promise<string | null> => {
  if (!carpetaId) return null;
  const { data } = await db()
    .from('expediente_carpetas')
    .select('id')
    .eq('expediente_id', expedienteId)
    .eq('id', carpetaId)
    .maybeSingle();
  if (!data) throw new ExpedienteError('CARPETA_NOT_FOUND', 'Esa carpeta no existe en este expediente.', 404);
  return carpetaId;
};

export const crearCarpeta = async (
  firmId: string,
  expedienteId: string,
  userEmail: string,
  nombre: string,
  padreId?: string | null
): Promise<Carpeta> => {
  await expedienteDeLaFirma(firmId, expedienteId);
  const limpio = (nombre ?? '').trim();
  if (!limpio) throw new ExpedienteError('MISSING_NOMBRE', 'La carpeta necesita un nombre.');

  const padre = await carpetaDelExpediente(expedienteId, padreId);

  const { data, error } = await db()
    .from('expediente_carpetas')
    .insert({ expediente_id: expedienteId, padre_id: padre, nombre: limpio, created_by: userEmail })
    .select()
    .single();

  if (error) {
    /*
     * EL NOMBRE REPETIDO SE DICE CON SU NOMBRE. La base lo impide con un índice
     * único —dos «Pruebas» hermanas son indistinguibles en pantalla y el
     * archivo acaba en la otra— y aquí se traduce a algo que el abogado
     * entienda en vez de un error de restricción.
     */
    if (error.code === '23505') {
      throw new ExpedienteError('NOMBRE_REPETIDO', `Ya hay una carpeta «${limpio}» en ese mismo sitio.`, 409);
    }
    console.error('[CARPETAS] No se pudo crear:', error.message);
    throw new ExpedienteError('CARPETA_FAILED', 'No se pudo crear la carpeta.', 502);
  }
  return aCarpeta(data as FilaDeCarpeta);
};

/**
 * Renombra o mueve una carpeta.
 *
 * ─── UNA CARPETA NO PUEDE METERSE DENTRO DE SÍ MISMA ───────────────────────
 *
 * Ni dentro de una de sus propias descendientes. La base no lo impide —un
 * ciclo de padres es una fila perfectamente válida para Postgres— y el efecto
 * sería un ramal que desaparece del árbol: la pantalla lo dibuja desde la raíz
 * y ese grupo ya no cuelga de ninguna, así que sus documentos se vuelven
 * inalcanzables sin que nada falle. Se comprueba subiendo por los padres.
 */
export const moverCarpeta = async (
  firmId: string,
  expedienteId: string,
  carpetaId: string,
  cambios: { nombre?: string; padreId?: string | null }
): Promise<Carpeta> => {
  await expedienteDeLaFirma(firmId, expedienteId);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (cambios.nombre !== undefined) {
    const limpio = cambios.nombre.trim();
    if (!limpio) throw new ExpedienteError('MISSING_NOMBRE', 'La carpeta no se puede quedar sin nombre.');
    patch.nombre = limpio;
  }

  if (cambios.padreId !== undefined) {
    const destino = await carpetaDelExpediente(expedienteId, cambios.padreId);
    if (destino === carpetaId) {
      throw new ExpedienteError('CARPETA_EN_SI_MISMA', 'Una carpeta no puede estar dentro de sí misma.');
    }
    if (destino && (await esDescendiente(expedienteId, destino, carpetaId))) {
      throw new ExpedienteError(
        'CARPETA_EN_SU_HIJA',
        'No se puede mover una carpeta dentro de una que ella misma contiene: el grupo entero quedaría fuera del árbol.'
      );
    }
    patch.padre_id = destino;
  }

  const { data, error } = await db()
    .from('expediente_carpetas')
    .update(patch)
    .eq('expediente_id', expedienteId)
    .eq('id', carpetaId)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw new ExpedienteError('NOMBRE_REPETIDO', 'Ya hay una carpeta con ese nombre en ese sitio.', 409);
    }
    console.error('[CARPETAS] No se pudo actualizar:', error.message);
    throw new ExpedienteError('CARPETA_FAILED', 'No se pudo guardar la carpeta.', 502);
  }
  if (!data) throw new ExpedienteError('CARPETA_NOT_FOUND', 'Esa carpeta no existe en este expediente.', 404);
  return aCarpeta(data as FilaDeCarpeta);
};

/**
 * ¿`posibleDescendiente` cuelga, directa o indirectamente, de `ancestro`?
 *
 * Sube por los padres en vez de bajar por los hijos: un expediente tiene pocas
 * carpetas y la cadena hasta la raíz es corta, mientras que bajar obligaría a
 * recorrer ramas enteras que no vienen al caso. El tope de saltos existe por si
 * ya hubiera un ciclo en la base —creado a mano, por ejemplo—: sin él, este
 * bucle no terminaría nunca.
 */
const esDescendiente = async (
  expedienteId: string,
  posibleDescendiente: string,
  ancestro: string
): Promise<boolean> => {
  let actual: string | null = posibleDescendiente;
  for (let saltos = 0; actual && saltos < 50; saltos += 1) {
    if (actual === ancestro) return true;
    const consulta: { data: unknown } = await db()
      .from('expediente_carpetas')
      .select('padre_id')
      .eq('expediente_id', expedienteId)
      .eq('id', actual)
      .maybeSingle();
    actual = (consulta.data as { padre_id: string | null } | null)?.padre_id ?? null;
  }
  return false;
};

/**
 * Borra la carpeta. Sus SUBCARPETAS se van con ella; sus DOCUMENTOS no.
 *
 * Las dos cosas son decisiones opuestas y a propósito, y viven en la migración:
 * dejar subcarpetas sueltas en la raíz llena el expediente de huérfanas que
 * nadie sabe de dónde salieron, mientras que llevarse los documentos borraría
 * trescientas páginas indexadas por un gesto que el abogado hizo para ordenar.
 * Los documentos suben a la raíz y siguen buscándose.
 */
export const borrarCarpeta = async (
  firmId: string,
  expedienteId: string,
  carpetaId: string
): Promise<void> => {
  await expedienteDeLaFirma(firmId, expedienteId);

  const { data, error } = await db()
    .from('expediente_carpetas')
    .delete()
    .eq('expediente_id', expedienteId)
    .eq('id', carpetaId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[CARPETAS] No se pudo borrar:', error.message);
    throw new ExpedienteError('CARPETA_DELETE_FAILED', 'No se pudo borrar la carpeta.', 502);
  }
  if (!data) throw new ExpedienteError('CARPETA_NOT_FOUND', 'Esa carpeta no existe en este expediente.', 404);
};

/**
 * Mueve un documento a una carpeta, o a la raíz con `carpetaId: null`.
 *
 * Se comprueban los dos lados: que el documento sea de la firma y que la
 * carpeta sea de ESTE expediente. Sin lo segundo, un id de carpeta de otro
 * asunto llegado por el cuerpo dejaría el documento colgando de un árbol que
 * su pantalla no dibuja — invisible, sin que nada falle.
 */
export const moverDocumento = async (
  firmId: string,
  expedienteId: string,
  documentId: string,
  carpetaId: string | null
): Promise<void> => {
  await expedienteDeLaFirma(firmId, expedienteId);
  const destino = await carpetaDelExpediente(expedienteId, carpetaId);

  const { data, error } = await db()
    .from('legal_documents')
    .update({ carpeta_id: destino })
    .eq('firm_id', firmId)
    .eq('id', documentId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[CARPETAS] No se pudo mover el documento:', error.message);
    throw new ExpedienteError('DOC_MOVE_FAILED', 'No se pudo mover el documento.', 502);
  }
  if (!data) throw new ExpedienteError('DOC_NOT_FOUND', 'Ese documento no existe en su firma.', 404);
};
