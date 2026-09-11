import { supabase } from '../../../config/supabase.config';
import { ETIQUETA_DOCUMENTO_RECIBIDO, type InformeDeDocumentoRecibido, type InformeDeRevision, type ModoDeRevision } from './documentReview';
import type { TurnoDelTaller } from './taller';

/**
 * Where a review's report lives after the request ends.
 *
 * ─── WHAT IS KEPT, AND WHAT IS NOT ──────────────────────────────────────────
 *
 * The report, the question, the actuación and the FILE NAME. Never the text
 * of the brief: it is read once and discarded, as before. What the firm paid
 * for is the report, and that is what it can come back to.
 *
 * ─── BEST EFFORT, NEVER IN THE WAY ──────────────────────────────────────────
 *
 * Saving happens after the model answered and the charge settled. If the
 * table is missing (migration not run) or the insert fails, the review is
 * still returned and the response says `guardada: false`: a report the firm
 * paid for is never withheld because the archive hiccupped. The drafts
 * taught this the hard way — a silent fallback hid a missing migration for
 * weeks — so here the failure is reported, not swallowed.
 *
 * ─── `preguntas_audiencia` ESTÁ EN LA TABLA Y YA NO LA LEE NADIE ────────────
 *
 * Las preguntas para la audiencia vivían aquí, colgadas de la revisión, y se
 * llevaron al módulo de Expedientes: allí se preparan por persona y no en tres
 * cajones fijos, así que este camino quedó muerto y se retiró junto con su
 * controlador, su prompt y su check.
 *
 * LA COLUMNA SE DEJA. Quitarla exige un SQL que corre el dueño, y antes de
 * retirar el código se comprobó contra la base de producción que no tiene una
 * sola fila no nula: no hay un juego de preguntas generado y pagado que se
 * quede huérfano. Una columna vacía que nadie escribe ni lee no le cuesta nada
 * a nadie; un DROP a destiempo sí.
 */

export interface RevisionGuardada {
  id: string;
  /**
   * Cuál de los dos modos leyó este documento. NO HAY COLUMNA PROPIA y no
   * hace falta: los dos informes tienen formas disjuntas, así que el modo se
   * deduce del informe guardado —`queEs` solo existe en el del documento
   * recibido—. Deducirlo de `document_type` habría atado el archivo a una
   * etiqueta de producto que alguien puede cambiar; deducirlo de la forma del
   * dato lo ata a lo que el dato es.
   */
  modo: ModoDeRevision;
  documentType: string;
  legalBranch: string | null;
  fileName: string;
  /** Cliente o proceso al que pertenece el escrito; texto libre de quien pidió la revisión. */
  cliente: string;
  pregunta: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  /** El informe del escrito propio. null en el modo recibido. */
  informe: InformeDeRevision | null;
  /** El informe del documento recibido. null en el modo propio. */
  informeRecibido: InformeDeDocumentoRecibido | null;
  informeLibre: string | null;
  cobradoCop: number;
  userEmail: string;
  createdAt: string;
  /** El taller: solo cuando la firma autorizó conservar escritos; si no, null y []. */
  textoOriginal: string | null;
  textoTrabajo: string | null;
  conversacion: TurnoDelTaller[];
  /** Resaltados y tachados del abogado: [{cita, color}]. */
  anotaciones: Anotacion[];
  /** Instantáneas del texto, las últimas quince. */
  versiones: VersionDelTexto[];
  /**
   * El archivo tal como se subió, si se conservó. null cuando la firma no
   * autorizó guardar escritos, cuando el escrito llegó pegado como texto, o
   * cuando la revisión es anterior a `migration-revision-archivo-original.sql`.
   * El binario vive en B2 bajo el prefijo de la firma; aquí solo su clave.
   */
  archivoOriginal: ArchivoOriginalGuardado | null;
}

export interface ArchivoOriginalGuardado {
  /** Clave en B2. Siempre empieza por `<firmId>/`; el servicio de almacenamiento lo exige. */
  clave: string;
  /** MIME declarado al subirlo: decide el visor. */
  tipo: string;
  bytes: number;
}

export interface VersionDelTexto {
  fecha: string;
  motivo: string;
  texto: string;
  resumen?: string;
}

export interface Anotacion {
  cita: string;
  color: string;
  /** Solo en comentarios. */
  nota?: string;
  fecha?: string;
}

export interface ConsentimientoDeGuardado {
  guarda: boolean;
  por: string | null;
  el: string | null;
}

export interface NuevaRevision {
  firmId: string;
  userEmail: string;
  documentType: string;
  legalBranch?: string | null;
  fileName: string;
  cliente: string;
  pregunta: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  informe: InformeDeRevision | null;
  /** Se guarda en la MISMA columna `informe`: es el informe de esta revisión, con otra forma. */
  informeRecibido?: InformeDeDocumentoRecibido | null;
  informeLibre: string | null;
  cobradoCop: number;
  /** El texto revisado, solo si la firma autorizó conservarlo. */
  textoOriginal?: string | null;
  /**
   * DE QUÉ CASO ES, cuando el abogado lo dijo al pedir la revisión.
   *
   * La columna existía desde la migración de expedientes y solo la escribía
   * «Traer al expediente», es decir, DESPUÉS y a mano. Una revisión puede
   * nacer atada, y entonces el expediente la cuenta sin que nadie vuelva a
   * buscarla.
   *
   * El controlador comprueba que el expediente sea de la firma antes de
   * pasarla: llega del cuerpo de una petición y aquí no se valida nada.
   */
  expedienteId?: string | null;
}

/** A row as Supabase returns it → what the API hands out. Pure; tolerant to nulls. */
/**
 * Qué forma tiene el informe guardado. `queEs` es el primer campo del informe
 * del documento recibido y no existe en el del escrito propio, así que basta
 * mirarlo: una revisión guardada antes de que este modo existiera nunca lo
 * trae y sigue leyéndose como escrito propio.
 */
const esInformeRecibido = (v: unknown): boolean =>
  Boolean(v) && typeof v === 'object' && 'queEs' in (v as Record<string, unknown>);

/**
 * El modo de una fila.
 *
 * LA LISTA NO TRAE EL INFORME —`COLUMNAS_DE_LISTA` lo deja fuera a propósito,
 * porque los cuerpos son largos—, así que ahí la forma del dato no está
 * disponible y la etiqueta es lo único que hay. De ahí las dos vías: la forma
 * manda cuando el informe viene, y la etiqueta responde en la lista. Con una
 * sola de las dos, la lista rotularía como escrito propio todo lo recibido.
 */
const modoDeLaFila = (row: Record<string, unknown>): ModoDeRevision =>
  esInformeRecibido(row.informe) || String(row.document_type ?? '') === ETIQUETA_DOCUMENTO_RECIBIDO
    ? 'DOCUMENTO_RECIBIDO'
    : 'ESCRITO_PROPIO';

export const aRevisionGuardada = (row: Record<string, unknown>): RevisionGuardada => ({
  id: String(row.id),
  modo: modoDeLaFila(row),
  documentType: String(row.document_type ?? ''),
  legalBranch: row.legal_branch ? String(row.legal_branch) : null,
  fileName: String(row.file_name ?? ''),
  cliente: String(row.cliente ?? ''),
  pregunta: String(row.pregunta ?? ''),
  caracteres: Number(row.caracteres ?? 0),
  truncado: Boolean(row.truncado),
  conFicha: Boolean(row.con_ficha),
  informe:
    row.informe && typeof row.informe === 'object' && !esInformeRecibido(row.informe) ? (row.informe as InformeDeRevision) : null,
  informeRecibido: esInformeRecibido(row.informe) ? (row.informe as InformeDeDocumentoRecibido) : null,
  informeLibre: row.informe_libre ? String(row.informe_libre) : null,
  cobradoCop: Number(row.cobrado_cop ?? 0),
  userEmail: String(row.user_email ?? ''),
  createdAt: String(row.created_at ?? ''),
  textoOriginal: row.texto_original ? String(row.texto_original) : null,
  textoTrabajo: row.texto_trabajo ? String(row.texto_trabajo) : null,
  conversacion: Array.isArray(row.conversacion) ? (row.conversacion as TurnoDelTaller[]) : [],
  anotaciones: Array.isArray(row.anotaciones) ? (row.anotaciones as Anotacion[]) : [],
  versiones: Array.isArray(row.versiones) ? (row.versiones as VersionDelTexto[]) : [],
  archivoOriginal: row.archivo_original_clave
    ? {
        clave: String(row.archivo_original_clave),
        tipo: String(row.archivo_original_tipo ?? 'application/octet-stream'),
        bytes: Number(row.archivo_original_bytes ?? 0)
      }
    : null
});

/** Columns for the list: everything but the report bodies, which can be long. */
const COLUMNAS_DE_LISTA =
  'id, document_type, legal_branch, file_name, cliente, pregunta, caracteres, truncado, con_ficha, cobrado_cop, user_email, created_at';

export const documentReviewStore = {
  /** Returns the saved id, or null when it could not be saved (and logs why). */
  async guardar(n: NuevaRevision): Promise<string | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('document_reviews')
      .insert({
        firm_id: n.firmId,
        user_email: n.userEmail,
        document_type: n.documentType,
        legal_branch: n.legalBranch ?? null,
        file_name: n.fileName,
        cliente: n.cliente,
        pregunta: n.pregunta,
        caracteres: n.caracteres,
        truncado: n.truncado,
        con_ficha: n.conFicha,
        /*
         * UNA SOLA COLUMNA PARA LOS DOS INFORMES, y sin migración: `informe` es
         * JSONB y cada modo escribe su propia forma. Añadir una columna hermana
         * habría exigido SQL que aquí no se escribe, y habría dejado filas con
         * las dos vacías o las dos llenas, que es peor que una sola verdad.
         */
        informe: n.informe ?? n.informeRecibido ?? null,
        informe_libre: n.informeLibre,
        cobrado_cop: n.cobradoCop,
        texto_original: n.textoOriginal ?? null,
        texto_trabajo: n.textoOriginal ?? null,
        expediente_id: n.expedienteId ?? null
      })
      .select('id')
      .single();
    if (error) {
      console.error('[REVIEW] No se pudo guardar el informe:', error.message);
      return null;
    }
    return String((data as { id: string }).id);
  },

  async listar(firmId: string, limit = 30): Promise<RevisionGuardada[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('document_reviews')
      .select(COLUMNAS_DE_LISTA)
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[REVIEW] No se pudo listar las revisiones:', error.message);
      return [];
    }
    return ((data ?? []) as Record<string, unknown>[]).map(aRevisionGuardada);
  },

  async obtener(firmId: string, id: string): Promise<RevisionGuardada | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('document_reviews')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return aRevisionGuardada(data as Record<string, unknown>);
  },

  async eliminar(firmId: string, id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('document_reviews').delete().eq('firm_id', firmId).eq('id', id);
    return !error;
  },

  /* ─── El taller ──────────────────────────────────────────────────────────── */

  /**
   * `conversacion`, cuando llega, REEMPLAZA la guardada: el navegador manda su
   * historial completo (el que el servidor le devolvió más lo que añadió), así
   * que sirve para la firma que autoriza a mitad del taller —los turnos de
   * antes de autorizar solo existen en la pestaña— y para el vaciado al cerrar.
   */
  async actualizarTextoTrabajo(
    firmId: string,
    id: string,
    texto: string,
    anotaciones?: Anotacion[],
    versiones?: VersionDelTexto[],
    conversacion?: TurnoDelTaller[]
  ): Promise<boolean> {
    if (!supabase) return false;
    const cambios: Record<string, unknown> = { texto_trabajo: texto, updated_at: new Date().toISOString() };
    if (anotaciones) cambios.anotaciones = anotaciones;
    if (versiones) cambios.versiones = versiones;
    if (conversacion) cambios.conversacion = conversacion;
    const { error } = await supabase
      .from('document_reviews')
      .update(cambios)
      .eq('firm_id', firmId)
      .eq('id', id);
    if (error) console.error('[REVIEW] No se pudo guardar el texto de trabajo:', error.message);
    return !error;
  },

  /** Añade turnos al final de la conversación guardada. Lee y escribe; el taller es de una persona a la vez. */
  async agregarTurnos(firmId: string, id: string, turnos: TurnoDelTaller[], textoTrabajo?: string): Promise<boolean> {
    if (!supabase) return false;
    const actual = await this.obtener(firmId, id);
    if (!actual) return false;
    const cambios: Record<string, unknown> = {
      conversacion: [...actual.conversacion, ...turnos],
      updated_at: new Date().toISOString()
    };
    if (typeof textoTrabajo === 'string') cambios.texto_trabajo = textoTrabajo;
    const { error } = await supabase.from('document_reviews').update(cambios).eq('firm_id', firmId).eq('id', id);
    if (error) console.error('[REVIEW] No se pudo guardar la conversación:', error.message);
    return !error;
  },

  /** Una nueva revisión sobre el texto corregido reemplaza el informe; el anterior queda en la conversación. */
  async actualizarInforme(
    firmId: string,
    id: string,
    informe: InformeDeRevision | null,
    informeLibre: string | null,
    textoTrabajo: string
  ): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('document_reviews')
      .update({ informe, informe_libre: informeLibre, texto_trabajo: textoTrabajo, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id);
    if (error) console.error('[REVIEW] No se pudo guardar la nueva revisión:', error.message);
    return !error;
  },

  /* ─── El archivo original ─────────────────────────────────────────────────── */

  /**
   * Ata a la revisión el archivo tal como se subió. Se escribe APARTE del
   * insert a propósito: si la migración no ha corrido, PostgREST rechaza el
   * insert ENTERO por una columna que no está en su caché de esquema, y con él
   * se perdería el informe que la firma ya pagó. Aquí, en cambio, un fallo se
   * declara en consola y la revisión queda intacta sin su original.
   */
  async adjuntarOriginal(firmId: string, id: string, archivo: ArchivoOriginalGuardado): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('document_reviews')
      .update({
        archivo_original_clave: archivo.clave,
        archivo_original_tipo: archivo.tipo,
        archivo_original_bytes: archivo.bytes,
        updated_at: new Date().toISOString()
      })
      .eq('firm_id', firmId)
      .eq('id', id);
    if (error) {
      console.warn('[REVIEW] No se pudo guardar el archivo original (¿falta supabase/migration-revision-archivo-original.sql?):', error.message);
      return false;
    }
    return true;
  },

  /** Suelta la referencia al archivo. Quien llama borra el objeto de B2: la fila no sabe borrar archivos. */
  async olvidarOriginal(firmId: string, id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('document_reviews')
      .update({ archivo_original_clave: null, archivo_original_tipo: null, archivo_original_bytes: null, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id);
    if (error) console.warn('[REVIEW] No se pudo soltar el archivo original:', error.message);
    return !error;
  },

  /* ─── La autorización de la firma ────────────────────────────────────────── */

  async consentimiento(firmId: string): Promise<ConsentimientoDeGuardado> {
    if (!supabase) return { guarda: false, por: null, el: null };
    const { data, error } = await supabase
      .from('firms')
      .select('guarda_escritos_revisados, guarda_escritos_por, guarda_escritos_el')
      .eq('firm_id', firmId)
      .maybeSingle();
    if (error || !data) {
      // Sin la migración la columna no existe: se trata como no autorizado y se dice en consola.
      if (error) console.warn('[REVIEW] No se pudo leer la autorización de guardado:', error.message);
      return { guarda: false, por: null, el: null };
    }
    const fila = data as { guarda_escritos_revisados?: boolean; guarda_escritos_por?: string | null; guarda_escritos_el?: string | null };
    return { guarda: Boolean(fila.guarda_escritos_revisados), por: fila.guarda_escritos_por ?? null, el: fila.guarda_escritos_el ?? null };
  },

  async autorizarGuardado(firmId: string, email: string, autorizar: boolean): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('firms')
      .update({
        guarda_escritos_revisados: autorizar,
        guarda_escritos_por: email,
        guarda_escritos_el: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('firm_id', firmId);
    if (error) console.error('[REVIEW] No se pudo guardar la autorización:', error.message);
    return !error;
  }
};
