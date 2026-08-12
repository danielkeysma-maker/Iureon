import { config } from '../../config/env.config';
import { supabase } from '../../config/supabase.config';
import { embeddingsService } from '../embeddings/embeddings.service';

export type { IngestionRulingMetadata } from './types';
import type { IngestionRulingMetadata } from './types';

export class JurisprudenceIngestionPipeline {
  /**
   * Procesa e ingesta una providencia descargada de las relatorías oficiales
   * (CENDOJ, Relatoría Corte Constitucional, CSJ o Consejo de Estado)
   */
  public async ingestRuling(ruling: IngestionRulingMetadata): Promise<{ success: boolean; chunksIngested: number }> {
    try {
      // 1. Fragmentación del texto procesal en bloques semánticos (Chunks de ~1000 caracteres)
      const chunks = this.chunkText(ruling.fullText, 1000);
      let count = 0;

      // The shared SYSTEM_CORPUS is read by every tenant, so a fabricated
      // vector here would corrupt search for all of them at once. This used to
      // write Math.random() values, which is worse than sine noise: the same
      // ruling produced a different vector on every run.
      if (!embeddingsService.isAvailable()) {
        console.warn(
          '[JURISPRUDENCE] Sin proveedor de embeddings: no se ingesta. Configura OPENAI_API_KEY.'
        );
        return { success: false, chunksIngested: 0 };
      }

      const vectors = await embeddingsService.embedAll(chunks);

      for (const [index, chunk] of chunks.entries()) {

        const contentWithMetadata = `[CORPORACIÓN: ${ruling.corporacion}] [TIPO: ${ruling.tipoSentencia}] [PROVIDENCIA: ${ruling.numeroProvidencia}] [PONENTE: ${ruling.magistradoPonente}] [RESULTADO: ${ruling.resuelveOutcome}]\nHECHOS: ${ruling.hechosClave}\nRATIO: ${ruling.ratioDecidendi}\n\n${chunk}`;

        if (supabase) {
          await supabase.from('document_embeddings').insert({
            firm_id: 'SYSTEM_CORPUS', // Corpus legal público accesible para todas las firmas
            expediente_id: ruling.numeroProvidencia,
            branch: ruling.rama,
            file_name: `${ruling.numeroProvidencia}.pdf`,
            content_chunk: contentWithMetadata,
            embedding: vectors[index]
          });
        }
        count++;
      }

      console.log(`[Ingestion Pipeline] ${ruling.numeroProvidencia} ingestada exitosamente en SYSTEM_CORPUS (${count} chunks).`);
      return { success: true, chunksIngested: count };
    } catch (err) {
      console.error(`[Ingestion Pipeline Error] Error al ingestar ${ruling.numeroProvidencia}:`, err);
      return { success: false, chunksIngested: 0 };
    }
  }

  /**
   * Helper para dividir textos largos de providencias en chunks homogéneos
   */
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }
}
