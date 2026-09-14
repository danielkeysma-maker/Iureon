import { supabase } from '../../config/supabase.config';
import { borrarOriginales, exigirDocumentoDelExpediente } from './candidatos.service';
import { ExpedienteError } from './expedientes.service';
import { validarNombreDeCarpeta } from './nombreDelDocumento';

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

/**
 * Y que la carpeta sea de ESE expediente, cuando se nombra una.
 *
 * Devuelve la fila y no solo el id porque la auditoría necesita nombrar la
 * carpeta y su padre anterior: leerla aquí evita una segunda consulta. Lo
 * ajeno responde 404 igual que lo inexistente, para no confirmarle a nadie
 * que ese id existe en otro caso.
 */
const carpetaDelExpediente = async (
  expedienteId: string,
  carpetaId: string | null | undefined
): Promise<FilaDeCarpeta | null> => {
  if (!carpetaId) return null;
  const { data } = await db()
    .from('expediente_carpetas')
    .select('*')
    .eq('expediente_id', expedienteId)
    .eq('id', carpetaId)
    .maybeSingle();
  if (!data) throw new ExpedienteError('CARPETA_NOT_FOUND', 'Esa carpeta no existe en este expediente.', 404);
  return data as FilaDeCarpeta;
};

export const crearCarpeta = async (
  firmId: string,
  expedienteId: string,
  userEmail: string,
  nombre: unknown,
  padreId?: string | null
): Promise<Carpeta> => {
  const validado = validarNombreDeCarpeta(nombre);
  if (!validado.ok) throw new ExpedienteError(validado.code, validado.message);
  const limpio = validado.nombre;

  await expedienteDeLaFirma(firmId, expedienteId);
  const padre = (await carpetaDelExpediente(expedienteId, padreId))?.id ?? null;

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
 *
 * ─── LAS DOS PUNTAS SON DE ESTE EXPEDIENTE ─────────────────────────────────
 *
 * La carpeta movida se lee primero filtrando por el expediente de la ruta, y
 * el padre destino también. Así un id de carpeta de otro caso de la misma
 * firma responde 404 antes de escribir nada, en vez de depender de que la
 * actualización final no encuentre fila.
 *
 * Devuelve también cómo estaba ANTES —nombre y padre— para que la auditoría
 * pueda escribir de dónde a dónde sin volver a consultar.
 */
export interface CambioDeCarpeta {
  carpeta: Carpeta;
  nombreAnterior: string;
  /** Id del padre antes del cambio. Se compara por id: dos padres distintos pueden llamarse igual. */
  padreIdAnterior: string | null;
  /** Nombre del padre anterior y del nuevo; `null` es la raíz. Solo tienen sentido si cambió el padre. */
  padreAnterior: string | null;
  padreNuevo: string | null;
}

export const moverCarpeta = async (
  firmId: string,
  expedienteId: string,
  carpetaId: string,
  cambios: { nombre?: unknown; padreId?: string | null }
): Promise<CambioDeCarpeta> => {
  await expedienteDeLaFirma(firmId, expedienteId);
  const actual = (await carpetaDelExpediente(expedienteId, carpetaId)) as FilaDeCarpeta;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (cambios.nombre !== undefined) {
    const validado = validarNombreDeCarpeta(cambios.nombre);
    if (!validado.ok) throw new ExpedienteError(validado.code, validado.message);
    patch.nombre = validado.nombre;
  }

  let padreAnterior: string | null = null;
  let padreNuevo: string | null = null;

  if (cambios.padreId !== undefined) {
    const filaDestino = await carpetaDelExpediente(expedienteId, cambios.padreId);
    const destino = filaDestino?.id ?? null;
    padreNuevo = filaDestino?.nombre ?? null;
    padreAnterior = actual.padre_id
      ? (await carpetaDelExpediente(expedienteId, actual.padre_id).catch(() => null))?.nombre ?? null
      : null;
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
  return { carpeta: aCarpeta(data as FilaDeCarpeta), nombreAnterior: actual.nombre,
    padreIdAnterior: actual.padre_id,
    padreAnterior,
    padreNuevo
  };
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

/** Qué hay dentro de una carpeta, contando hacia abajo. */
export interface ContenidoDeCarpeta {
  subcarpetas: number;
  documentos: number;
}

/**
 * La carpeta y TODAS las que cuelgan de ella, incluida ella misma.
 *
 * Baja por niveles en vez de recursivamente por fila: un expediente tiene
 * pocas carpetas y así son tres consultas en vez de una por nodo. El tope de
 * niveles existe por si hubiera un ciclo creado a mano en la base — sin él
 * este bucle no terminaría.
 */
const ramaDeCarpetas = async (expedienteId: string, raiz: string): Promise<string[]> => {
  const todas: { data: unknown } = await db()
    .from('expediente_carpetas')
    .select('id, padre_id')
    .eq('expediente_id', expedienteId);

  const filas = (todas.data ?? []) as Array<{ id: string; padre_id: string | null }>;
  const rama = [raiz];
  for (let nivel = 0; nivel < 50; nivel += 1) {
    const hijas = filas.filter((f) => f.padre_id && rama.includes(f.padre_id) && !rama.includes(f.id));
    if (hijas.length === 0) break;
    rama.push(...hijas.map((h) => h.id));
  }
  return rama;
};

/** Cuántas subcarpetas y cuántos documentos se irían al borrar esta carpeta. */
export const contenidoDeCarpeta = async (
  firmId: string,
  expedienteId: string,
  carpetaId: string
): Promise<ContenidoDeCarpeta> => {
  await expedienteDeLaFirma(firmId, expedienteId);
  const rama = await ramaDeCarpetas(expedienteId, carpetaId);

  const { count } = await db()
    .from('legal_documents')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .in('carpeta_id', rama);

  /* La rama incluye la propia carpeta, que no cuenta como subcarpeta suya. */
  return { subcarpetas: rama.length - 1, documentos: count ?? 0 };
};

/**
 * Borra la carpeta Y TODO LO QUE HAY DENTRO: subcarpetas y documentos.
 *
 * ─── ESTO ESTUVO AL REVÉS, Y EL DUEÑO TENÍA RAZÓN ──────────────────────────
 *
 * La primera versión conservaba los documentos: los subía a la raíz para que
 * un gesto de ordenar no borrara trescientas páginas indexadas. El
 * razonamiento sobre el daño era correcto; la conclusión, no.
 *
 * Porque en cualquier gestor de archivos del mundo, borrar una carpeta borra
 * lo que contiene. Pelear contra esa intuición no evita el daño: lo cambia de
 * sitio. El abogado borra «Pruebas» creyendo que se llevó los cinco
 * documentos, no los ve en la carpeta —claro, ya no existe— y los da por
 * perdidos, mientras siguen apareciendo en las búsquedas del caso desde una
 * raíz donde nadie los puso.
 *
 * La protección correcta no era desobedecer el gesto, sino PREGUNTAR ANTES
 * diciendo exactamente qué se va. Eso lo hace la pantalla con
 * `contenidoDeCarpeta`, y es lo que faltaba de verdad: la versión anterior
 * borraba de un clic, sin confirmación ninguna.
 *
 * LOS DOCUMENTOS SE BORRAN PRIMERO, y no es orden caprichoso: al quitar la
 * carpeta, el `ON DELETE SET NULL` de la columna los habría soltado a la raíz
 * un instante antes, y entonces ya no habría forma de saber cuáles eran.
 * Sus fragmentos se van solos: `document_embeddings` tiene CASCADE contra
 * `legal_documents`.
 */
export const borrarCarpeta = async (
  firmId: string,
  expedienteId: string,
  carpetaId: string
): Promise<ContenidoDeCarpeta & { nombre: string }> => {
  await expedienteDeLaFirma(firmId, expedienteId);
  /*
   * Se lee la carpeta antes de nada: una carpeta de otro caso responde 404 sin
   * haber tocado un solo documento, y la auditoría conserva el nombre de lo que
   * se borró, que después ya no existe en ninguna parte.
   */
  const carpeta = (await carpetaDelExpediente(expedienteId, carpetaId)) as FilaDeCarpeta;
  const rama = await ramaDeCarpetas(expedienteId, carpetaId);
  const contenido = await contenidoDeCarpeta(firmId, expedienteId, carpetaId);

  /*
   * LOS ARCHIVOS SE BORRAN ANTES QUE SUS FILAS, y ese orden importa: la clave
   * del objeto vive EN la fila. Borrando primero la fila ya no habria de donde
   * sacarla, y quedarian papeles privilegiados del cliente en el almacenamiento
   * sin nada que los reclame — invisibles y sin forma de encontrarlos.
   */
  const { data: aBorrar } = await db()
    .from('legal_documents')
    .select('id')
    .eq('firm_id', firmId)
    .in('carpeta_id', rama);
  await borrarOriginales(firmId, ((aBorrar ?? []) as Array<{ id: string }>).map((d) => d.id));

  const { error: errorDocs } = await db()
    .from('legal_documents')
    .delete()
    .eq('firm_id', firmId)
    .in('carpeta_id', rama);

  if (errorDocs) {
    console.error('[CARPETAS] No se pudieron borrar los documentos:', errorDocs.message);
    throw new ExpedienteError(
      'CARPETA_DELETE_FAILED',
      'No se pudieron borrar los documentos de la carpeta, así que la carpeta tampoco se borró.',
      502
    );
  }

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

  return { ...contenido, nombre: carpeta.nombre };
};

/**
 * Mueve un documento a una carpeta, o a la raíz con `carpetaId: null`.
 *
 * ─── SE COMPRUEBAN LOS DOS LADOS CONTRA EL EXPEDIENTE DE LA RUTA ───────────
 *
 * La versión anterior solo comprobaba que el documento fuera de la FIRMA. Con
 * eso, un documento de otro caso de la misma firma se podía colgar de una
 * carpeta de este: desaparecía del árbol de su caso —cuyo `carpeta_id` ya
 * apuntaba a una carpeta que ese árbol no dibuja— sin que nada fallara. Ahora
 * el documento tiene que ser de este expediente y la carpeta destino también.
 */
export const moverDocumento = async (
  firmId: string,
  expedienteId: string,
  documentId: string,
  carpetaId: string | null
): Promise<void> => {
  await expedienteDeLaFirma(firmId, expedienteId);
  await exigirDocumentoDelExpediente(firmId, expedienteId, documentId);
  const destino = (await carpetaDelExpediente(expedienteId, carpetaId))?.id ?? null;

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
