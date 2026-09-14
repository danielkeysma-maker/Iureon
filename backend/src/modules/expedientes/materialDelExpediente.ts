import { supabase } from '../../config/supabase.config';
import { vectorSearchService } from '../search/vectorSearch.service';
import { rotuloDelPasaje } from './nombreDelDocumento';

/**
 * Los títulos vigentes de unos documentos de la firma, por id.
 *
 * Es la única lectura del nombre visible para los pasajes: la usan la búsqueda
 * del expediente y el material que recibe el motor. Filtra por firma de forma
 * explícita porque el cliente de base salta RLS.
 *
 * NUNCA LANZA: sin base o con un fallo devuelve un mapa vacío y el pasaje cae
 * al rótulo de reemplazo. Quedarse sin nombre es un defecto menor; tumbar la
 * búsqueda o la redacción por él sería uno mayor.
 */
export const titulosDeDocumentos = async (
  firmId: string,
  documentIds: ReadonlyArray<string | null | undefined>
): Promise<Map<string, string>> => {
  const unicos = [...new Set(documentIds.filter((id): id is string => Boolean(id)))];
  if (unicos.length === 0 || !supabase) return new Map();

  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, title')
    .eq('firm_id', firmId)
    .in('id', unicos);

  if (error) {
    console.warn('[EXPEDIENTE-MATERIAL] No se pudieron leer los nombres de los documentos:', error.message);
    return new Map();
  }
  return new Map(((data ?? []) as Array<{ id: string; title: string }>).map((d) => [d.id, d.title]));
};

/**
 * LO QUE EL EXPEDIENTE YA SABE, PUESTO SOBRE LA MESA DEL MOTOR.
 *
 * ─── QUÉ PROBLEMA RESUELVE ─────────────────────────────────────────────────
 *
 * La firma sube la demanda, el auto admisorio y la contestación al expediente;
 * la aplicación los indexa; y al día siguiente, para redactar un recurso de ese
 * mismo caso, el abogado vuelve a teclear el radicado, el juzgado, los nombres
 * de las partes y la fecha de notificación. El caso estaba adentro y el escrito
 * nacía en blanco.
 *
 * ─── POR QUÉ VIVE AQUÍ Y NO EN CADA PANTALLA ───────────────────────────────
 *
 * El interrogatorio de audiencia (`preguntas.controller.ts`) ya hacía esta
 * misma recuperación a mano. Escribirla otra vez en Redacción —y una tercera en
 * Revisión— es cómo se separan: alguien corrige el filtro por firma en una y
 * las otras dos se quedan atrás, sin que nada falle a la vista. Es el mismo
 * defecto que este proyecto ya documentó con las dos barras de configuración y
 * con las seis copias del selector de expediente.
 *
 * ─── LA BÚSQUEDA VA CERCADA AL EXPEDIENTE ──────────────────────────────────
 *
 * `search` recibe el `expedienteId`, así que la RPC filtra por `firm_id` Y por
 * expediente. Sin la cerca, redactar el recurso de un cliente traería pasajes
 * de los casos de los demás clientes de la firma: no es fuga entre firmas, pero
 * sí es llevarle al motor el caso de otro. El filtro por firma se repite aquí
 * sobre lo devuelto porque el corpus compartido (`SYSTEM_CORPUS`) entra por la
 * misma RPC, y la jurisprudencia tiene su propio camino en el pipeline.
 *
 * ─── Y NUNCA TUMBA NADA ────────────────────────────────────────────────────
 *
 * Sin proveedor de embeddings, sin índice, con un fallo de red o con un
 * expediente que no tiene un solo documento indexado, esto devuelve `undefined`
 * y el escrito se redacta como antes. Es un extra, no un requisito: nadie deja
 * de redactar porque el buscador no respondió.
 */

/**
 * Cuántos pasajes se traen.
 *
 * Seis fragmentos de 400 palabras son unas 2.400 palabras: bastante para cubrir
 * carátula, partes, radicado y antecedentes, y poco para que no desplacen a la
 * ficha del catálogo ni a la instrucción del abogado dentro del encargo. Traer
 * treinta convertiría el escrito en un resumen del expediente.
 * `bestPerDocument` ya evita que los seis salgan del mismo archivo.
 */
export const FRAGMENTOS_DEL_EXPEDIENTE = 6;

/**
 * El encabezado dice DE DÓNDE VIENE y QUÉ SE PUEDE HACER CON ELLO, y las dos
 * mitades importan.
 *
 * Un pasaje del expediente NO es un adjunto: el abogado no lo escogió para este
 * escrito, lo escogió un buscador por parecido. Puede ser viejo, puede ser de
 * otra etapa del proceso, y puede citar una norma que ya no rige. Por eso sirve
 * para datos —nombres, radicado, fechas, cuantías, antecedentes— y NO como
 * fuente de derecho: el fundamento normativo sale de la ficha del catálogo y de
 * la jurisprudencia verificada, que llegan por su propio camino.
 */
export const ENCABEZADO_DEL_EXPEDIENTE =
  'PASAJES DEL EXPEDIENTE (fragmentos de documentos que la firma ya cargó a ESTE caso; los recuperó un buscador por parecido, no los escogió el abogado). ÚSALOS para nombres de las partes, radicado, juzgado, fechas, cuantías y antecedentes procesales. NO LOS USES como fuente de derecho: no cites un pasaje como norma ni como jurisprudencia. Si un pasaje contradice lo que escribió el abogado, prevalece el abogado. Si un dato no aparece, deja el marcador [•] como siempre.';

export interface PasajeDelExpediente {
  /** Nombre del archivo del que salió, para que el motor sepa qué está leyendo. */
  archivo: string | null;
  texto: string;
}

/**
 * Los pasajes, ya con encabezado. Cadena vacía cuando no hay ninguno: quien la
 * reciba decide si la manda o no, y un bloque vacío nunca deja un título
 * colgando.
 */
export const renderBloqueExpediente = (pasajes: readonly PasajeDelExpediente[]): string => {
  const utiles = pasajes.filter((p) => p.texto.trim().length > 0);
  if (utiles.length === 0) return '';

  const cuerpo = utiles
    .map((p, i) => `[${i + 1}] (${p.archivo ?? 'documento del caso'}) ${p.texto.trim()}`)
    .join('\n\n');

  return `${ENCABEZADO_DEL_EXPEDIENTE}\n\n${cuerpo}`;
};

/**
 * LA RECUPERACIÓN, que es la parte que no se puede escribir dos veces.
 *
 * Aquí viven la cerca al expediente y el filtro por firma sobre lo devuelto.
 * Rendirlos como bloque es cosa de cada pantalla —el interrogatorio arma su
 * propio encargo—, pero de dónde salen los pasajes es una sola decisión.
 *
 * Devuelve una lista vacía por cualquier motivo: sin expediente, sin consulta,
 * sin proveedor, sin índice o con la red caída. Nunca lanza.
 */
export const buscarPasajesDelExpediente = async (
  firmId: string,
  expedienteId: string | null | undefined,
  consulta: string
): Promise<PasajeDelExpediente[]> => {
  if (!expedienteId) return [];
  const pregunta = consulta.trim();
  if (pregunta.length === 0) return [];

  try {
    const hallado = await vectorSearchService.search(
      firmId,
      pregunta,
      FRAGMENTOS_DEL_EXPEDIENTE,
      expedienteId
    );
    /* Solo lo del propio expediente: el corpus público entra por otra puerta. */
    const propios = hallado.matches.filter((m) => m.firmId === firmId);
    /*
     * EL RÓTULO `[n] (archivo)` SALE DEL TÍTULO VIGENTE. Los fragmentos de un
     * documento de la firma no llevan `file_name`, así que el motor leía
     * «documento del caso» en todos; y un nombre copiado en otro sitio quedaría
     * viejo al renombrar. Una sola fuente: `legal_documents.title`.
     */
    const titulos = await titulosDeDocumentos(
      firmId,
      propios.map((m) => m.documentId)
    );
    return propios.map((m) => ({
      archivo: rotuloDelPasaje(titulos, m.documentId, m.fileName),
      texto: m.contentChunk
    }));
  } catch (err) {
    console.warn(
      '[EXPEDIENTE-MATERIAL] No se pudo leer el expediente indexado:',
      err instanceof Error ? err.message : err
    );
    return [];
  }
};

/**
 * Trae los pasajes del expediente que se parecen a `consulta` y los devuelve ya
 * rendidos como bloque. `undefined` cuando no hay expediente, cuando la
 * consulta viene vacía, o cuando la búsqueda no trajo nada — por lo que sea.
 */
export const traerMaterialDelExpediente = async (
  firmId: string,
  expedienteId: string | null | undefined,
  consulta: string
): Promise<string | undefined> => (await traerPasajesDelExpediente(firmId, expedienteId, consulta)).bloque;

/**
 * El bloque y CUÁNTOS pasajes útiles lleva.
 *
 * Revisión necesita el número para decirle al abogado «se cruzó con N pasajes
 * del caso»: sin él, un informe que cotejó el expediente y uno que no lo tocó se
 * leen igual. Se cuenta con el mismo filtro con que se rinde el bloque —pasajes
 * con texto—, para que el número nunca diga más de lo que el motor leyó.
 */
export const traerPasajesDelExpediente = async (
  firmId: string,
  expedienteId: string | null | undefined,
  consulta: string
): Promise<{ bloque: string | undefined; pasajes: number }> => {
  const pasajes = await buscarPasajesDelExpediente(firmId, expedienteId, consulta);
  const bloque = renderBloqueExpediente(pasajes) || undefined;
  return { bloque, pasajes: bloque ? pasajes.filter((p) => p.texto.trim().length > 0).length : 0 };
};
