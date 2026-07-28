import { CorteConstitucionalScraper } from '../modules/scrapers/corteConstitucionalScraper';
import { CorteSupremaScraper } from '../modules/scrapers/corteSupremaScraper';
import { ConsejoEstadoScraper } from '../modules/scrapers/consejoEstadoScraper';
import { TribunalesScraper } from '../modules/scrapers/tribunalesScraper';
import { JurisprudenceIngestionPipeline } from '../modules/ingestion/jurisprudenceIngestion.service';

async function main() {
  const args = process.argv.slice(2);
  const isFullScan = args.includes('--full');
  const limitPerCorp = isFullScan ? 1000 : 10;
  const yearRange = isFullScan ? '1992-2026' : '2024-2026';

  console.log('================================================================');
  console.log('🚀 IUREON LEGALTECH - CANALIZACIÓN MASIVA DE INGESTA JURISPRUDENCIAL');
  console.log(`📌 Modo: ${isFullScan ? 'ESCANEO HISTÓRICO MASIVO COMPLETO' : 'LOTE DE PRUEBA Y VALIDACIÓN RAG'}`);
  console.log(`📅 Rango de Años: ${yearRange} | Límite por Corporación: ${limitPerCorp}`);
  console.log('================================================================');

  const ccScraper = new CorteConstitucionalScraper();
  const csjScraper = new CorteSupremaScraper();
  const ceScraper = new ConsejoEstadoScraper();
  const tribScraper = new TribunalesScraper();
  const pipeline = new JurisprudenceIngestionPipeline();

  let totalSentencias = 0;
  let totalChunks = 0;

  // 1. Recolección de la Corte Constitucional
  console.log('\n--- 1. PROCESANDO CORTE CONSTITUCIONAL ---');
  const ccRulings = await ccScraper.fetchRulings(10);
  for (const ruling of ccRulings) {
    const res = await pipeline.ingestRuling(ruling);
    if (res.success) {
      totalSentencias++;
      totalChunks += res.chunksIngested;
    }
  }

  // 2. Recolección de la Corte Suprema de Justicia
  console.log('\n--- 2. PROCESANDO CORTE SUPREMA DE JUSTICIA ---');
  const csjRulings = await csjScraper.fetchRulings(10);
  for (const ruling of csjRulings) {
    const res = await pipeline.ingestRuling(ruling);
    if (res.success) {
      totalSentencias++;
      totalChunks += res.chunksIngested;
    }
  }

  // 3. Recolección del Consejo de Estado
  console.log('\n--- 3. PROCESANDO CONSEJO DE ESTADO ---');
  const ceRulings = await ceScraper.fetchRulings(10);
  for (const ruling of ceRulings) {
    const res = await pipeline.ingestRuling(ruling);
    if (res.success) {
      totalSentencias++;
      totalChunks += res.chunksIngested;
    }
  }

  // 4. Recolección de Tribunales
  console.log('\n--- 4. PROCESANDO TRIBUNALES SUPERIORES Y ADMINISTRATIVOS ---');
  const tribRulings = await tribScraper.fetchRulings(10);
  for (const ruling of tribRulings) {
    const res = await pipeline.ingestRuling(ruling);
    if (res.success) {
      totalSentencias++;
      totalChunks += res.chunksIngested;
    }
  }

  console.log('\n================================================================');
  console.log(`✅ PROCESO FINALIZADO EXITOSAMENTE`);
  console.log(`📊 Providencias Ingestadas: ${totalSentencias}`);
  console.log(`📦 Fragmentos Vectoriales Creados (SYSTEM_CORPUS): ${totalChunks}`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('❌ Error fatal en el script de ingesta:', err);
  process.exit(1);
});
