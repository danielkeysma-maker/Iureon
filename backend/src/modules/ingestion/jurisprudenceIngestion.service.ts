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
      const chunks = this.chunkText(ruling.fullText, 2500);
      let count = 0;

      // The shared SYSTEM_CORPUS is read by every tenant, so a fabricated
      // vector here would corrupt search for all of them at once. This used to
      // write Math.random() values, which is worse than sine noise: the same
      // ruling produced a different vector on every run.
      if (!embeddingsService.isAvailable()) {
        console.warn('[JURISPRUDENCE] Sin proveedor de embeddings: no se ingesta.');
        return { success: false, chunksIngested: 0 };
      }

      // Same rule the catalogue lives by: a legal statement with no source is
      // not knowledge. A ruling indexed without the URL it was read at cannot
      // be checked by the lawyer who ends up citing it, and the corpus is
      // shared by every tenant — one unverifiable entry misleads all of them.
      if (!ruling.pdfUrl || !/^https?:\/\//.test(ruling.pdfUrl)) {
        console.warn(
          `[JURISPRUDENCE] ${ruling.numeroProvidencia} no trae pdfUrl http(s): no se ingesta.`
        );
        return { success: false, chunksIngested: 0 };
      }

      // Only long rulings report progress, and only every so often. A short one
      // finishes before anyone wonders; the noise would just bury the per-ruling
      // line that actually matters.
      const REPORT_EVERY = 50;
      const NOISY_ENOUGH = 150;

      // Counted against the last report, not with a modulo: `done` advances by
      // the provider's batch size, so `done % 50` would simply never be 0 for a
      // batch of 8 and the progress line would never appear.
      let lastReported = 0;

      const vectors = await embeddingsService.embedAll(chunks, (done, total) => {
        if (total < NOISY_ENOUGH) return;
        if (done !== total && done - lastReported < REPORT_EVERY) return;

        lastReported = done;

        const pct = Math.round((done / total) * 100);
        console.log(`    ${ruling.numeroProvidencia}: ${done}/${total} chunks vectorizados (${pct}%)`);
      });

      for (const [index, chunk] of chunks.entries()) {

        const contentWithMetadata = `[CORPORACIÓN: ${ruling.corporacion}] [TIPO: ${ruling.tipoSentencia}] [PROVIDENCIA: ${ruling.numeroProvidencia}] [PONENTE: ${ruling.magistradoPonente}] [RESULTADO: ${ruling.resuelveOutcome}]\nHECHOS: ${ruling.hechosClave}\nRATIO: ${ruling.ratioDecidendi}\n\n${chunk}`;

        if (supabase) {
          // `expediente_id` was written here for months and that column has
          // never existed, so every corpus insert failed and the pipeline
          // reported success anyway — the try/catch swallowed it into a
          // console.error. The providencia number goes in `metadata`, NOT in
          // `document_id`: that column carries a foreign key to
          // legal_documents, and a ruling is not a tenant's case file.
          const { error } = await supabase.from('document_embeddings').insert({
            firm_id: 'SYSTEM_CORPUS', // Corpus legal público accesible para todas las firmas
            branch: ruling.rama,
            file_name: `${ruling.numeroProvidencia}.pdf`,
            content_chunk: contentWithMetadata,
            embedding: vectors[index],
            chunk_index: index,
            metadata: {
              // Explícito aunque la búsqueda trate lo ausente como
              // jurisprudencia: una fila nueva que no dice qué es depende de un
              // default para no mentir, y un default es más fácil de cambiar
              // que un dato.
              sourceKind: 'JURISPRUDENCIA',
              providencia: ruling.numeroProvidencia,
              corporacion: ruling.corporacion,
              tipoSentencia: ruling.tipoSentencia,
              magistradoPonente: ruling.magistradoPonente,
              resuelveOutcome: ruling.resuelveOutcome,
              sourceUrl: ruling.pdfUrl
            }
          });

          // Surfaced, not swallowed. A corpus that silently fails to grow is
          // indistinguishable from one nobody has fed.
          if (error) {
            throw new Error(`Insert falló para ${ruling.numeroProvidencia}: ${error.message}`);
          }
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
   * Divide una providencia en fragmentos con traslape.
   *
   * Two things changed here on 2026-08-14, both for retrieval quality:
   *
   *  - 1000 characters was about one paragraph. bge-m3 accepts ~8000 tokens, so
   *    that size threw away the context the model was chosen for; a ratio
   *    decidendi rarely fits in a paragraph.
   *  - there was NO overlap. A holding that straddled a boundary was cut in
   *    half and lost from both chunks — the retrieval failure nobody notices,
   *    because the search still returns something.
   */
  private chunkText(text: string, chunkSize: number, overlap = 200): string[] {
    const chunks: string[] = [];
    const step = Math.max(chunkSize - overlap, 1);

    for (let i = 0; i < text.length; i += step) {
      const chunk = text.slice(i, i + chunkSize).trim();
      if (chunk) chunks.push(chunk);
      if (i + chunkSize >= text.length) break;
    }

    return chunks;
  }
}
