import { supabase } from '../../config/supabase.config';
import { BackblazeB2TenantStorageService } from '../documents/b2.service';
import { textoDesdeFragmentos, type FragmentoGuardado } from './textoIndexado';
import { ExpedienteError } from './expedientes.service';
import type { TipoDePieza } from './types';

/**
 * LO QUE LA FIRMA YA TIENE Y SE PUEDE TRAER A UN EXPEDIENTE.
 *
 * ─── POR QUÉ SE TIRA DESDE EL EXPEDIENTE Y NO SE EMPUJA DESDE CADA PANTALLA ─
 *
 * El gesto natural parecía ser el contrario: un botón «atar a un expediente»
 * en Entrevistas, en Revisiones, en Borradores y en la Agenda. Se descartó por
 * dos razones, y la segunda pesa más que la primera.
 *
 * La barata: esas cuatro listas seleccionan columnas EXPLÍCITAS —ninguna trae
 * `expediente_id`— así que el botón obligaría a tocar cuatro módulos, sus
 * tipos de fila, sus mapeadores y sus espejos del frontend, para un vínculo
 * que casi nunca se pone desde ahí.
 *
 * La de fondo: un abogado no ata piezas sueltas mientras navega listas. Abre
 * el asunto en el que va a trabajar y trae lo suyo. Poner el gesto donde está
 * la carpeta es poner el gesto donde está la intención.
 *
 * ─── SE MUESTRA LO QUE ESTÁ LIBRE Y LO QUE YA ES DE OTRO ───────────────────
 *
 * Esconder lo ya atado dejaría al abogado buscando una entrevista que existe y
 * no aparece, sin saber por qué. Se muestra, se dice de qué expediente es, y
 * se puede mover: cambiar de carpeta es una corrección legítima y frecuente.
 */

/* Una sola instancia, perezosa: el servicio no guarda estado entre llamadas. */
let b2: BackblazeB2TenantStorageService | null = null;
const almacen = (): BackblazeB2TenantStorageService => (b2 ??= new BackblazeB2TenantStorageService());

const db = () => {
  if (!supabase) throw new ExpedienteError('NO_DB', 'La base de datos no está configurada.', 503);
  return supabase;
};

export interface Candidato {
  tipo: TipoDePieza;
  id: string;
  /** Lo que el abogado lee para reconocerla. */
  titulo: string;
  /** Fecha, ya formateada por quien la guardó (ISO). */
  cuando: string;
  /** A qué expediente pertenece hoy. `null` si está libre. */
  expedienteId: string | null;
}

/**
 * Cuántas se ofrecen por tipo.
 *
 * Es una lista para reconocer algo que se hizo hace poco, no un archivo
 * histórico: quien busca una entrevista de hace ocho meses la encuentra por su
 * pantalla, no aquí. Un tope alto convertiría este panel en un segundo
 * listado de todo, cinco veces.
 */
const POR_TIPO = 25;

const recortar = (texto: string | null | undefined, largo = 90): string => {
  const t = (texto ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '(sin título)';
  return t.length > largo ? `${t.slice(0, largo)}…` : t;
};

/**
 * Las piezas de la firma que se pueden traer a un expediente.
 *
 * Cinco consultas y no una por pieza: cada tabla se lee entera una vez, con
 * columnas explícitas y tope. Traer los cuerpos —el informe de una revisión,
 * el texto de un borrador, los hechos de una orientación— haría de este
 * endpoint el más pesado del producto para pintar una lista de rótulos.
 */
export const candidatosDeLaFirma = async (firmId: string): Promise<Candidato[]> => {
  const [transcritos, revisiones, borradores, terminos, orientaciones] = await Promise.all([
    db()
      .from('transcriptions')
      .select('id, title, kind, transcribed_at, expediente_id')
      .eq('firm_id', firmId)
      .order('transcribed_at', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('document_reviews')
      .select('id, document_type, file_name, created_at, expediente_id')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('saved_drafts')
      .select('id, title, document_type, saved_at, expediente_id')
      .eq('firm_id', firmId)
      .order('saved_at', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('agenda_terminos')
      .select('id, asunto, fecha_limite, expediente_id')
      .eq('firm_id', firmId)
      .order('fecha_limite', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('orientaciones')
      .select('id, hechos, created_at, expediente_id')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(POR_TIPO)
  ]);

  const out: Candidato[] = [];

  for (const r of (transcritos.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      /*
       * ENTREVISTA Y AUDIENCIA SON LA MISMA TABLA —es una decisión vieja y
       * buena: una entrevista es una transcripción con un cliente detrás— así
       * que el tipo que viaja es `transcripcion` y lo que distingue es el
       * rótulo. El servidor no necesita saber cuál es para atarla.
       */
      tipo: 'transcripcion',
      id: String(r.id),
      titulo: `${r.kind === 'ENTREVISTA' ? 'Entrevista' : 'Audiencia'} · ${recortar(r.title as string)}`,
      cuando: String(r.transcribed_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (revisiones.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'revision',
      id: String(r.id),
      titulo: `Revisión · ${recortar(r.document_type as string, 40)} — ${recortar(r.file_name as string, 40)}`,
      cuando: String(r.created_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (borradores.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'borrador',
      id: String(r.id),
      titulo: `Borrador · ${recortar((r.title as string) || (r.document_type as string))}`,
      cuando: String(r.saved_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (terminos.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'termino',
      id: String(r.id),
      titulo: `Término · ${recortar(r.asunto as string)} (vence ${String(r.fecha_limite ?? '')})`,
      cuando: String(r.fecha_limite ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (orientaciones.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'orientacion',
      id: String(r.id),
      /*
       * De la orientación solo se muestra el arranque de los hechos, que es lo
       * único con lo que se reconoce: no tiene título. Recortado, porque un
       * relato entero en una lista de rótulos no se lee.
       */
      titulo: `Orientación · ${recortar(r.hechos as string)}`,
      cuando: String(r.created_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  /* Lo más reciente primero, mezclando los cinco tipos: así se busca. */
  return out.sort((a, b) => (a.cuando < b.cuando ? 1 : a.cuando > b.cuando ? -1 : 0));
};

// ─── LOS DOCUMENTOS INDEXADOS DE UN EXPEDIENTE ──────────────────────────────

export interface DocumentoIndexado {
  documentId: string;
  titulo: string;
  fragmentos: number;
  indexadoEl: string;
  /** En qué carpeta está. `null` = en la raíz del expediente. */
  carpetaId: string | null;
}

/**
 * Qué documentos tiene indexados el expediente, y con cuántos fragmentos cada uno.
 *
 * ─── POR QUÉ ESTO NO ES UN ADORNO ──────────────────────────────────────────
 *
 * Un expediente que se llena EN EL TIEMPO —el caso de un cliente nuevo, con
 * los archivos llegando de a poco— necesita mostrar lo que ya tiene. Sin esta
 * lista, indexar decía «295 fragmentos» y después no había forma de saber qué
 * hay dentro: a la tercera semana nadie recuerda si el poder ya se subió, y la
 * salida natural es volver a subirlo. Un documento indexado dos veces duplica
 * sus fragmentos y hace que la búsqueda devuelva el mismo párrafo dos veces,
 * desplazando a otro que sí hacía falta.
 *
 * ─── SE CUENTA DESDE LOS FRAGMENTOS, NO DESDE `legal_documents` ────────────
 *
 * Y es deliberado: la lista tiene que decir lo que está BUSCABLE, no lo que se
 * subió. Un documento cuya vectorización falló deja fila en `legal_documents`
 * y ni un fragmento — mostrarlo diría que el expediente lo tiene cuando
 * ninguna búsqueda lo va a encontrar.
 *
 * Se traen solo los `document_id`, sin cuerpos ni vectores: diez documentos de
 * trescientas páginas son unas tres mil filas de un identificador corto.
 */
export const documentosDelExpediente = async (
  firmId: string,
  expedienteId: string
): Promise<DocumentoIndexado[]> => {
  const { data: fragmentos, error } = await db()
    .from('document_embeddings')
    .select('document_id')
    .eq('firm_id', firmId)
    .eq('expediente_id', expedienteId);

  if (error) {
    console.error('[EXPEDIENTES] No se pudieron listar los documentos:', error.message);
    throw new ExpedienteError('DOCS_FAILED', 'No se pudieron cargar los documentos del expediente.', 502);
  }

  const cuantos = new Map<string, number>();
  for (const f of (fragmentos ?? []) as Array<{ document_id: string | null }>) {
    if (!f.document_id) continue;
    cuantos.set(f.document_id, (cuantos.get(f.document_id) ?? 0) + 1);
  }
  if (cuantos.size === 0) return [];

  const { data: docs } = await db()
    .from('legal_documents')
    .select('id, title, created_at, carpeta_id')
    .eq('firm_id', firmId)
    .in('id', [...cuantos.keys()]);

  const porId = new Map(
    (
      (docs ?? []) as Array<{ id: string; title: string; created_at: string; carpeta_id: string | null }>
    ).map((d) => [d.id, d])
  );

  return [...cuantos.entries()]
    .map(([documentId, fragmentosDelDoc]) => ({
      documentId,
      /* Sin ficha en `legal_documents` el documento sigue siendo buscable: se nombra por su id antes que esconderlo. */
      titulo: porId.get(documentId)?.title ?? `Documento ${documentId}`,
      fragmentos: fragmentosDelDoc,
      indexadoEl: porId.get(documentId)?.created_at ?? '',
      carpetaId: porId.get(documentId)?.carpeta_id ?? null
    }))
    .sort((a, b) => (a.indexadoEl < b.indexadoEl ? 1 : -1));
};

/**
 * Quita un documento del expediente: sus fragmentos y su ficha.
 *
 * Se borran los FRAGMENTOS primero. Al revés, el CASCADE de
 * `legal_documents` ya se los habría llevado y el conteo que se devuelve sería
 * cero siempre — un borrado que dice «0 fragmentos» se lee como que no borró
 * nada.
 */
export const quitarDocumento = async (
  firmId: string,
  expedienteId: string,
  documentId: string
): Promise<number> => {
  const { data, error } = await db()
    .from('document_embeddings')
    .delete()
    .eq('firm_id', firmId)
    .eq('expediente_id', expedienteId)
    .eq('document_id', documentId)
    .select('id');

  if (error) {
    console.error('[EXPEDIENTES] No se pudo quitar el documento:', error.message);
    throw new ExpedienteError('DOC_DELETE_FAILED', 'No se pudo quitar el documento.', 502);
  }

  const quitados = (data ?? []).length;
  if (quitados === 0) {
    throw new ExpedienteError('DOC_NOT_FOUND', 'Ese documento no está en este expediente.', 404);
  }

  await borrarOriginales(firmId, [documentId]);
  await db().from('legal_documents').delete().eq('firm_id', firmId).eq('id', documentId);
  return quitados;
};

/**
 * BORRAR TAMBIÉN EL ARCHIVO, y no solo su fila.
 *
 * Desde que el expediente guarda el documento original en el almacenamiento,
 * borrar la fila y dejar el objeto sería lo peor de las dos opciones: el
 * abogado ve desaparecer el documento y cree que se fue, mientras un papel
 * privilegiado de su cliente sigue en el bucket sin nada que lo reclame — sin
 * fila, ya no hay ni forma de encontrarlo para borrarlo después.
 *
 * NO TUMBA EL BORRADO SI FALLA. La fila se va igual: dejar el documento
 * visible porque el almacenamiento tuvo una mala tarde le diría al abogado que
 * su orden no se cumplió, cuando lo que quedó pendiente es una limpieza. Se
 * registra para poder barrerlo.
 */
export const borrarOriginales = async (firmId: string, documentIds: readonly string[]): Promise<void> => {
  if (documentIds.length === 0) return;

  const { data } = await db()
    .from('legal_documents')
    .select('id, b2_file_url')
    .eq('firm_id', firmId)
    .in('id', [...documentIds]);

  for (const d of (data ?? []) as Array<{ id: string; b2_file_url: string | null }>) {
    const clave = (d.b2_file_url ?? '').trim();
    /* Sin clave no hay archivo: se indexó pegando el texto, o antes de que se guardara. */
    if (!clave) continue;
    const ok = await almacen().deleteObject(firmId, clave).catch(() => false);
    if (!ok) console.error(`[EXPEDIENTES] Quedó sin borrar en el almacenamiento: ${clave}`);
  }
};

/**
 * Un enlace firmado al archivo original, o `null` si ese documento no tiene.
 *
 * Se filtra por firma Y por expediente antes de firmar nada: el id llega de la
 * URL, y una URL firmada es acceso directo al objeto — entregarla sin
 * comprobar de quién es sería peor que devolver la fila.
 */
export interface OriginalDelExpediente {
  url: string;
  /** Con qué nombre se guardó: el visor decide por él cuando el tipo calla. */
  nombre: string;
  /** MIME real, guardado al indexar. Decide si se pinta una página o un HTML. */
  tipo: string;
}

export const enlaceAlOriginal = async (
  firmId: string,
  expedienteId: string,
  documentId: string
): Promise<OriginalDelExpediente | null> => {
  /* Que el documento sea DE ESTE expediente: lo dicen sus fragmentos. */
  const { data: pertenece } = await db()
    .from('document_embeddings')
    .select('id')
    .eq('firm_id', firmId)
    .eq('expediente_id', expedienteId)
    .eq('document_id', documentId)
    .limit(1)
    .maybeSingle();
  if (!pertenece) throw new ExpedienteError('DOC_NOT_FOUND', 'Ese documento no está en este expediente.', 404);

  const { data: fila } = await db()
    .from('legal_documents')
    .select('b2_file_url, title, mime_type')
    .eq('firm_id', firmId)
    .eq('id', documentId)
    .maybeSingle();

  const doc = fila as { b2_file_url: string | null; title: string; mime_type: string | null } | null;
  const clave = (doc?.b2_file_url ?? '').trim();
  if (!clave) return null;

  return {
    url: await almacen().generateDownloadPresignedUrl(firmId, clave),
    /*
     * EL NOMBRE DEL ARCHIVO, no el título del documento: la clave de B2 acaba
     * en el nombre con que se subió, y de ahí sale la extensión. El visor la
     * usa cuando el tipo calla, y un título sin extensión lo dejaría sin saber
     * qué está abriendo.
     */
    nombre: clave.split('/').pop() || doc?.title || 'documento',
    tipo: (doc?.mime_type ?? '').trim() || 'application/octet-stream'
  };
};


/**
 * EL TEXTO DE UN DOCUMENTO INDEXADO, PARA PODER LEERLO.
 *
 * Un documento se podia listar y no abrir: la pantalla decia «56 fragmentos
 * buscables» y al pulsarlo no pasaba nada, asi que el abogado tenia que
 * creerle a la aplicacion que ahi dentro estaba lo que subio.
 *
 * NO ES EL PDF: el archivo nunca sale del navegador —se lee alli y solo viaja
 * su texto—, de modo que no hay copia del original en el servidor y no hay
 * nada que previsualizar. Lo que se devuelve es el texto guardado, que ademas
 * es EXACTAMENTE lo que ven la busqueda y el interrogatorio. Para la pregunta
 * que se hace de verdad —«¿de verdad quedo esto adentro?»— esa es la respuesta
 * correcta, no una copia bonita.
 *
 * Se filtra por firma Y por expediente: el `document_id` llega de la URL, y
 * sin las dos condiciones bastaria con acertar un id para leer el documento de
 * otro caso, o de otra firma.
 */
export const textoDelDocumentoIndexado = async (
  firmId: string,
  expedienteId: string,
  documentId: string
): Promise<{ titulo: string; texto: string; fragmentos: number }> => {
  const { data, error } = await db()
    .from('document_embeddings')
    .select('chunk_index, content_chunk')
    .eq('firm_id', firmId)
    .eq('expediente_id', expedienteId)
    .eq('document_id', documentId)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error('[EXPEDIENTES] No se pudo leer el documento:', error.message);
    throw new ExpedienteError('DOC_READ_FAILED', 'No se pudo leer el documento.', 502);
  }

  const fragmentos = (data ?? []) as FragmentoGuardado[];
  if (fragmentos.length === 0) {
    throw new ExpedienteError('DOC_NOT_FOUND', 'Ese documento no esta en este expediente.', 404);
  }

  const { data: fila } = await db()
    .from('legal_documents')
    .select('title')
    .eq('firm_id', firmId)
    .eq('id', documentId)
    .maybeSingle();

  return {
    titulo: (fila as { title: string } | null)?.title ?? `Documento ${documentId}`,
    texto: textoDesdeFragmentos(fragmentos),
    fragmentos: fragmentos.length
  };
};
