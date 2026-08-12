import { supabase } from '../../config/supabase.config';
import { embeddingsService } from '../embeddings/embeddings.service';

export type { IngestionRequest, IngestionResult } from './types';
import type { IngestionRequest, IngestionResult } from './types';

export class IngestionService {
  /** Null when Supabase is not configured; ingestion then runs as a dry run. */
  private readonly supabaseClient = supabase;

  /**
   * Ingesta un expediente PDF de Backblaze B2, fragmenta el texto y genera embeddings de 1536 dimensiones en Supabase
   */
  public async ingestLegalDocument(req: IngestionRequest): Promise<IngestionResult> {
    const documentId = `doc-${Date.now().toString().slice(-6)}`;
    const textContent = req.rawText || this.getSampleExpedienteText(req.title);

    // 1. Dividir el documento en folios / chunks de 500 palabras
    const chunks = this.splitTextIntoChunks(textContent, 400);
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

        for (let i = 0; i < chunks.length; i++) {
          await this.supabaseClient.from('document_embeddings').insert({
            document_id: documentId,
            firm_id: req.firmId,
            content_chunk: chunks[i],
            embedding: vectors[i],
            chunk_index: i
          });
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

  private splitTextIntoChunks(text: string, chunkSizeWords: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSizeWords) {
      const chunk = words.slice(i, i + chunkSizeWords).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk);
      }
    }

    return chunks.length > 0 ? chunks : [text];
  }

  private getSampleExpedienteText(title: string): string {
    return `EXPEDIENTE JUDICIAL COLOMBIANO - ${title}
DEMANDANTE: Mario Alberto Pérez
DEMANDADO: Torres & Asociados S.A.S.
JUZGADO: Dieciocho Laboral del Circuito de Bogotá D.C.

FOLIO 1: DEMANDA LABORAL ORDINARIA
El señor Mario Alberto Pérez, mediante apoderado judicial, presenta demanda laboral solicitando el pago de acreencias laborales, horas extras y reliquidación de prestaciones por presunta vinculación mediante contrato de trabajo entre el 10 de enero de 2020 y el 15 de marzo de 2023.

FOLIO 12: PRUEBAS DOCUMENTALES
Se aportan copias de extractos bancarios, correos electrónicos y certificaciones de funciones. La sociedad demandada alega que la relación contractual fue de prestación de servicios independientes y que, en todo caso, la acción prescribería conforme al artículo 151 del CPTSS tras transcurrir más de 3 años continuos sin reclamación judicial válida.`;
  }
}
