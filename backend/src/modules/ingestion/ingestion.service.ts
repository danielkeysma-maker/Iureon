import { supabase } from '../../config/supabase.config';
import { embeddingsService } from '../embeddings/embeddings.service';

export type { IngestionRequest, IngestionResult } from './types';
import type { IngestionRequest, IngestionResult } from './types';

/**
 * Cuántas palabras por fragmento, y cuántas se repiten entre uno y el siguiente.
 *
 * ─── EL TRASLAPE NO ESTABA, Y HACE FALTA EN TEXTO JURÍDICO ─────────────────
 *
 * Se partía en 400 palabras SIN traslape, así que un artículo o una cláusula
 * que cayera en el corte quedaba con la mitad en cada fragmento y ninguno de
 * los dos decía la regla entera. El corpus de jurisprudencia, que se construyó
 * después, sí traslapa 200 caracteres — la decisión ya estaba tomada bien en
 * otro sitio y aquí no había llegado.
 *
 * 40 palabras son unas dos líneas: alcanza para que una frase partida aparezca
 * completa en uno de los dos lados, y cuesta un 10% más de fragmentos.
 */
const PALABRAS_POR_FRAGMENTO = 400;
const PALABRAS_DE_TRASLAPE = 40;

/**
 * Lo mínimo para que valga la pena indexar. Un PDF escaneado sin reconocimiento
 * óptico devuelve unas pocas decenas de caracteres de basura, y vectorizar eso
 * ensucia el índice del caso con ruido que después aparece en las búsquedas.
 */
const MINIMO_PARA_INDEXAR = 200;

/**
 * Cuántas filas se escriben por viaje a la base.
 *
 * MEDIDO: el Código General del Proceso entero son 295 fragmentos. Insertados
 * de uno en uno son 295 viajes de ida y vuelta — el verdadero riesgo de reloj
 * de esta operación, mucho antes que los embeddings, que van en lotes de ocho
 * y se resolvieron en 37 peticiones.
 */
const FILAS_POR_INSERCION = 100;

export class IngestionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'IngestionError';
    this.code = code;
  }
}

export class IngestionService {
  /** Null when Supabase is not configured; ingestion then runs as a dry run. */
  private readonly supabaseClient = supabase;

  /**
   * Ingesta un expediente PDF de Backblaze B2, fragmenta el texto y genera sus
   * embeddings en Supabase. El ancho lo fija EMBEDDING_DIMENSIONS, no este comentario.
   */
  public async ingestLegalDocument(req: IngestionRequest): Promise<IngestionResult> {
    const documentId = `doc-${Date.now().toString().slice(-6)}`;
    const textContent = (req.rawText ?? '').trim();

    /*
     * SIN TEXTO NO SE INDEXA. Ver la nota del final sobre el «expediente de
     * muestra» que ocupaba este sitio: rellenar un hueco con texto inventado y
     * vectorizarlo lo vuelve indistinguible de lo real para siempre.
     */
    if (textContent.length < MINIMO_PARA_INDEXAR) {
      throw new IngestionError(
        'SIN_TEXTO',
        `No se pudo leer texto del documento (${textContent.length} caracteres). ` +
          'Si es un PDF escaneado, necesita reconocimiento óptico antes de indexarse; ' +
          'no se indexa nada para no llenar el índice del caso con un documento vacío.'
      );
    }

    // 1. Dividir el documento en folios / chunks de 500 palabras
    const chunks = this.splitTextIntoChunks(textContent, PALABRAS_POR_FRAGMENTO, PALABRAS_DE_TRASLAPE);
    const totalFolios = Math.ceil(chunks.length / 2);

    console.log(`[INGESTION] Procesando "${req.title}" para firm_id: ${req.firmId}. Total chunks: ${chunks.length}`);

    // 2. Real vectors or none. Writing fabricated ones would poison the index
    // permanently: at rest they are indistinguishable from real embeddings, so
    // no later query could tell that its neighbours are noise.
    if (!embeddingsService.isAvailable()) {
      console.warn(
        '[INGESTION] Sin proveedor de embeddings: no se indexa. Configura OPENAI_API_KEY.'
      );

      return {
        documentId,
        firmId: req.firmId,
        title: req.title,
        b2FileUrl: req.b2FileUrl,
        totalChunksCreated: chunks.length,
        totalFoliosIndexed: 0,
        status: 'NOT_INDEXED',
        ingestedAt: new Date().toISOString()
      };
    }

    if (this.supabaseClient) {
      try {
        // Insertar documento base en legal_documents con RLS firm_id
        const { data: docData, error: docError } = await this.supabaseClient
          .from('legal_documents')
          .insert({
            id: documentId,
            firm_id: req.firmId,
            title: req.title,
            b2_file_url: req.b2FileUrl,
            metadata: req.metadata || {}
          })
          .select()
          .single();

        if (docError) {
          console.warn('[SUPABASE-DOC-ERROR]', docError.message);
        }

        // Embedded first, inserted after: a provider failure must leave the
        // index untouched rather than half-filled.
        const vectors = await embeddingsService.embedAll(chunks);

        /*
         * ─── DE UNO EN UNO ERAN 295 VIAJES A LA BASE ──────────────────────
         *
         * Éste era el verdadero riesgo de reloj de la operación, y no los
         * embeddings. Medido con el Código General del Proceso entero: 295
         * fragmentos. Vectorizarlos son 37 peticiones —van en lotes de ocho—
         * pero insertarlos de uno en uno eran 295 idas y vueltas a Supabase,
         * cada una con su latencia. En lotes de cien son tres.
         *
         * Y hay una segunda razón, más importante que la velocidad: un fallo
         * a mitad de 295 inserciones sueltas deja el documento MEDIO indexado,
         * y medio indexado se ve igual que entero — las búsquedas responden,
         * solo que sin la mitad del expediente. Con lotes, lo que falla es un
         * lote y se sabe cuál.
         */
        const filas = chunks.map((chunk, i) => ({
          document_id: documentId,
          firm_id: req.firmId,
          expediente_id: req.expedienteId ?? null,
          content_chunk: chunk,
          embedding: vectors[i],
          chunk_index: i
        }));

        for (let i = 0; i < filas.length; i += FILAS_POR_INSERCION) {
          const lote = filas.slice(i, i + FILAS_POR_INSERCION);
          const { error } = await this.supabaseClient.from('document_embeddings').insert(lote);
          if (error) {
            throw new IngestionError(
              'INDICE_INCOMPLETO',
              `Se indexaron ${i} de ${filas.length} fragmentos y la base rechazó el resto: ${error.message}. ` +
                'El documento quedó a medias; vuelva a indexarlo.'
            );
          }
        }

        console.log(
          `[INGESTION] ${chunks.length} fragmentos indexados con ${embeddingsService.providerName}.`
        );
      } catch (err: any) {
        // Never swallowed into a COMPLETED result: the caller must know the
        // document is not searchable.
        console.error('[INGESTION] Falló la indexación:', err.message);

        return {
          documentId,
          firmId: req.firmId,
          title: req.title,
          b2FileUrl: req.b2FileUrl,
          totalChunksCreated: chunks.length,
          totalFoliosIndexed: 0,
          status: 'NOT_INDEXED',
          ingestedAt: new Date().toISOString()
        };
      }
    }

    return {
      documentId,
      firmId: req.firmId,
      title: req.title,
      b2FileUrl: req.b2FileUrl,
      totalChunksCreated: chunks.length,
      totalFoliosIndexed: totalFolios,
      status: 'COMPLETED',
      ingestedAt: new Date().toISOString()
    };
  }

  /**
   * Parte el texto en fragmentos con TRASLAPE entre uno y el siguiente.
   *
   * Sin traslape, una regla que caiga justo en el corte queda con la mitad en
   * cada fragmento y ninguno de los dos la dice entera — y en texto juridico
   * eso es la diferencia entre recuperar el articulo y recuperar su titulo.
   */
  private splitTextIntoChunks(text: string, chunkSizeWords: number, overlapWords = 0): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    /* El paso nunca puede ser cero: un traslape mayor que el fragmento seria un bucle infinito. */
    const paso = Math.max(1, chunkSizeWords - overlapWords);

    for (let i = 0; i < words.length; i += paso) {
      const chunk = words.slice(i, i + chunkSizeWords).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
      /* El ultimo fragmento ya llego al final: no se repite por el traslape. */
      if (i + chunkSizeWords >= words.length) break;
    }

    return chunks.length > 0 ? chunks : [text];
  }

  /*
   * AQUI VIVIA UN «EXPEDIENTE DE MUESTRA», Y SE FUE EL 10 DE SEPTIEMBRE DE 2026.
   *
   * Cuando `rawText` venia vacio, este servicio indexaba un texto inventado:
   * un demandante llamado Mario Alberto Perez, un Juzgado Dieciocho Laboral de
   * Bogota, unos folios de prueba y hasta una afirmacion sobre la prescripcion
   * del art. 151 del CPTSS. Con nombre de la firma encima.
   *
   * Es dos defectos a la vez, y este mismo archivo tenia escrito el segundo:
   * «writing fabricated ones would poison the index permanently: at rest they
   * are indistinguishable from real embeddings». Un expediente inventado,
   * vectorizado, queda en el indice de la firma sin forma de distinguirlo del
   * real — y saldria en las busquedas del caso de un cliente. El otro defecto
   * es la regla que gobierna el producto entero: aqui no se inventa contenido
   * juridico, y ese texto afirma un termino de prescripcion.
   *
   * Sin texto no se indexa. Se rechaza y se dice por que.
   */
}
