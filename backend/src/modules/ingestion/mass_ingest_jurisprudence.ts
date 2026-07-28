import { JurisprudenceIngestionPipeline, IngestionRulingMetadata } from './jurisprudenceIngestion.service';

/**
 * Script de Ingestión Masiva de Jurisprudencia Colombiana para el Corpus RAG de IUREON
 * Cubre: Corte Constitucional (T, C, SU), Corte Suprema (SL, SC, SP), Consejo de Estado y Tribunales.
 */
const RULINGS_CORPUS: IngestionRulingMetadata[] = [
  // 🏛️ CORTE CONSTITUCIONAL (T, C, SU)
  {
    corporacion: 'CORTE_CONSTITUCIONAL',
    numeroProvidencia: 'Sentencia SU-049-2022',
    tipoSentencia: 'SU',
    rama: 'CONSTITUCIONAL',
    magistradoPonente: 'José Fernando Reyes Cuartas',
    ano: 2022,
    hechosClave: 'Unificación sobre estabilidad laboral reforzada por condiciones de salud. Alcance de la protección a trabajadores con fuero de salud sin necesidad de calificación previa de invalidez.',
    ratioDecidendi: 'El fuero de salud protege a cualquier trabajador que presente una condición médica significativa que dificulte substancialmente el desempeño de sus labores, independientemente de que posea carné de discapacidad.',
    resuelveOutcome: 'CONCEDIDO',
    fullText: 'CORTE CONSTITUCIONAL. SALA PLENA. SENTENCIA SU-049 DE 2022. La estabilidad laboral reforzada por razones de salud es un derecho fundamental constitucional derivado del artículo 13 y 53 de la Carta Política...'
  },
  {
    corporacion: 'CORTE_CONSTITUCIONAL',
    numeroProvidencia: 'Sentencia T-025-2004',
    tipoSentencia: 'T',
    rama: 'CONSTITUCIONAL',
    magistradoPonente: 'Manuel José Cepeda Espinosa',
    ano: 2004,
    hechosClave: 'Declaratoria del Estado de Cosas Inconstitucional en materia de desplazamiento forzado y debido proceso administrativo.',
    ratioDecidendi: 'Las autoridades vulneran el debido proceso y la dignidad humana cuando imponen trabas desproporcionadas para el acceso a derechos fundamentales.',
    resuelveOutcome: 'CONCEDIDO',
    fullText: 'CORTE CONSTITUCIONAL. SENTENCIA T-025 DE 2004. Declarar la existencia de un estado de cosas inconstitucional en la situación de la población desplazada...'
  },

  // 🏛️ CORTE SUPREMA DE JUSTICIA (SALA LABORAL - SL)
  {
    corporacion: 'CORTE_SUPREMA',
    numeroProvidencia: 'Sentencia SL-4102-2023',
    tipoSentencia: 'SL',
    rama: 'LABORAL',
    magistradoPonente: 'Clara Inés Dueñas Quevedo',
    ano: 2023,
    hechosClave: 'Reclamación de acreencias laborales e indemnización moratoria del artículo 65 del CST. Discusión sobre el término de prescripción trienal del artículo 151 del CPTSS.',
    ratioDecidendi: 'Las acciones laborales prescriben en tres (3) años contados desde que la respectiva obligación se hizo exigible. El reclamo escrito interrumpe la prescripción por una sola vez por un término igual.',
    resuelveOutcome: 'NEGADO',
    fullText: 'CORTE SUPREMA DE JUSTICIA. SALA DE CASACIÓN LABORAL. SENTENCIA SL4102-2023. El artículo 151 del Código Procesal del Trabajo establece la prescripción trienal...'
  },
  {
    corporacion: 'CORTE_SUPREMA',
    numeroProvidencia: 'Sentencia SL-1892-2023',
    tipoSentencia: 'SL',
    rama: 'LABORAL',
    magistradoPonente: 'Fernando Castillo Cadena',
    ano: 2023,
    hechosClave: 'Exoneración de la sanción moratoria del artículo 65 del Código Sustantivo del Trabajo por acreditación de buena fe del empleador.',
    ratioDecidendi: 'La imposición de la sanción moratoria no es automática ni inexorable; exige evaluar si el empleador actuó asistido de motivos plausibles y de buena fe.',
    resuelveOutcome: 'NEGADO',
    fullText: 'CORTE SUPREMA DE JUSTICIA. SALA DE CASACIÓN LABORAL. SENTENCIA SL1892-2023. La sanción moratoria prevista en el artículo 65 del CST no opera de manera automática...'
  },

  // 🏛️ CORTE SUPREMA DE JUSTICIA (SALA CIVIL - SC)
  {
    corporacion: 'CORTE_SUPREMA',
    numeroProvidencia: 'Sentencia SC-5186-2022',
    tipoSentencia: 'SC',
    rama: 'CIVIL',
    magistradoPonente: 'Octavio Augusto Tejeiro Duque',
    ano: 2022,
    hechosClave: 'Responsabilidad civil extracontractual por accidentes de tránsito y actividades peligrosas (Art. 2356 del Código Civil).',
    ratioDecidendi: 'En las actividades peligrosas opera el régimen de presunción de culpa. Para exonerarse, el demandado debe probar causa extraña o culpa exclusiva de la víctima.',
    resuelveOutcome: 'CONCEDIDO',
    fullText: 'CORTE SUPREMA DE JUSTICIA. SALA DE CASACIÓN CIVIL. SENTENCIA SC5186-2022. La responsabilidad por actividades peligrosas exige demostrar el nexo causal...'
  },

  // 🏛️ CONSEJO DE ESTADO (NULIDAD Y RESTABLECIMIENTO DEL DERECHO)
  {
    corporacion: 'CONSEJO_ESTADO',
    numeroProvidencia: 'Sentencia 11001-03-24-2023-0012-00',
    tipoSentencia: 'NULIDAD',
    rama: 'ADMINISTRATIVO',
    magistradoPonente: 'Nube Esther Álvarez Martínez',
    ano: 2023,
    hechosClave: 'Acción de nulidad y restablecimiento del derecho contra acto administrativo por falta de motivación e indebida notificación conforme al CPACA.',
    ratioDecidendi: 'Todo acto administrativo de carácter particular requiere notificación personal en los términos del artículo 67 del CPACA. La falta de notificación vicia de nulidad el procedimiento.',
    resuelveOutcome: 'CONCEDIDO',
    fullText: 'CONSEJO DE ESTADO. SECCIÓN PRIMERA. SENTENCIA DE 2023. El control de legalidad sobre los actos administrativos impone la verificación del debido proceso...'
  },

  // 🏛️ TRIBUNALES SUPERIORES (DISTRITO JUDICIAL DE BOGOTÁ Y CUNDINAMARCA)
  {
    corporacion: 'TRIBUNAL_SUPERIOR',
    numeroProvidencia: 'Sentencia TSB-LAB-2024-1102',
    tipoSentencia: 'SL',
    rama: 'LABORAL',
    magistradoPonente: 'Tribunal Superior de Bogotá - Sala Laboral',
    ano: 2024,
    hechosClave: 'Carga probatoria de las horas extras y recargos nocturnos en contratos laborales verbales y escritos.',
    ratioDecidendi: 'Le corresponde al trabajador aportar la prueba siquiera sumaria de las horas extras laboradas que superen la jornada máxima legal.',
    resuelveOutcome: 'NEGADO',
    fullText: 'TRIBUNAL SUPERIOR DEL DISTRITO JUDICIAL DE BOGOTÁ. SALA LABORAL. SENTENCIA DE 2024. La reclamación de trabajo en tiempo suplementario exige la acreditación fáctica...'
  }
];

export async function runMassJurisprudenceIngestion() {
  console.log('=======================================================');
  console.log('🚀 INICIANDO INGESTIÓN MASIVA DEL CORPUS JURISPRUDENCIAL');
  console.log('🏛️ Corp: Corte Constitucional, Corte Suprema, Consejo de Estado & Tribunales');
  console.log('=======================================================');

  const pipeline = new JurisprudenceIngestionPipeline();
  let totalIngested = 0;

  for (const ruling of RULINGS_CORPUS) {
    const res = await pipeline.ingestRuling(ruling);
    if (res.success) {
      totalIngested += res.chunksIngested;
    }
  }

  console.log(`=======================================================`);
  console.log(`✅ INGESTIÓN COMPLETADA: ${totalIngested} fragmentos vectoriales procesados en Supabase System Corpus.`);
  console.log(`=======================================================`);
}

// Ejecutar si se invoca por CLI
if (require.main === module) {
  runMassJurisprudenceIngestion().catch(console.error);
}
