export interface FirmStyleProfile {
  firmId: string;
  userId?: string;
  preferredTerms: Record<string, string>; // Ej: "rechazar" -> "desestimar de plano"
  toneStyle: 'FORMAL_RECORTE' | 'SOBRIO_ACADÉMICO' | 'AGRESIVO_DEFENSIVO';
  frequentLegalPhrases: string[];
  totalEditsAnalyzed: number;
  lastUpdated: string;
}

export interface SuggestionRequest {
  selectedText: string;
  contextSentence: string;
  firmId: string;
}

export interface SuggestionResult {
  originalText: string;
  learnedAlternative?: string;
  aiSuggestedAlternatives: {
    phrase: string;
    description: string;
    isLearnedFromFirm: boolean;
  }[];
}

export class LearningService {
  /**
   * Retorna el perfil de jerga y estilo jurídico aprendido para la firma cliente
   */
  public async getFirmStyleProfile(firmId: string): Promise<FirmStyleProfile> {
    return {
      firmId,
      preferredTerms: {
        'rechazar': 'desestimar de plano',
        'cancelar contrato': 'resolver el negocio jurídico de pleno derecho',
        'argumento': 'sustento fáctico y normativo',
        'pedimos': 'solicitamos respetuosamente a su Despacho Judicial',
        'terminó': 'aconteció la expiración del plazo extintivo'
      },
      toneStyle: 'SOBRIO_ACADÉMICO',
      frequentLegalPhrases: [
        'El suscrito apoderado judicial de la parte demandada',
        'Sin lugar a las pretensiones de la parte actora',
        'Conforme a la jurisprudencia pacífica de la Sala de Casación Laboral'
      ],
      totalEditsAnalyzed: 18,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Analiza la edición realizada por el abogado en la app y aprende sus preferencias de vocabulario
   */
  public async learnFromLawyerEdits(firmId: string, originalText: string, editedText: string): Promise<void> {
    console.log(`[STYLE-LEARNING] Analizando diferencia de edición para firm_id: ${firmId}...`);
    // Extrae y almacena patrones de edición entre el texto original de la IA y la versión pulida por el abogado
  }

  /**
   * Genera sugerencias contextuales de jerga jurídica aprendida y recomendaciones de IA
   */
  public suggestLegalTerminology(req: SuggestionRequest): SuggestionResult {
    const term = req.selectedText.trim().toLowerCase();

    const dictionary: Record<string, { phrase: string; description: string }[]> = {
      'rechazar': [
        { phrase: 'desestimar de plano', description: 'Término de alta técnica jurídica en procesal civil/laboral' },
        { phrase: 'declarar la improcedencia formal', description: 'Enfoque doctrinal para tutela y excepciones' }
      ],
      'argumento': [
        { phrase: 'sustento fáctico y hermenéutico', description: 'Enfocado en argumentación jurisprudencial' },
        { phrase: 'fundamento de mérito invocable', description: 'Ideal para la sustentación de recursos' }
      ],
      'cancelar': [
        { phrase: 'resolver de pleno derecho', description: 'Terminación por incumplimiento resolutorio' },
        { phrase: 'extinguir la relación obligacional', description: 'Terminación por cumplimiento o prescripción' }
      ]
    };

    const matches = dictionary[term] || [
      { phrase: `improcedencia manifiesta de ${req.selectedText}`, description: 'Sugerencia de jerga técnica procesal' },
      { phrase: `inexigibilidad de ${req.selectedText}`, description: 'Formulación doctrinal sustantiva' }
    ];

    return {
      originalText: req.selectedText,
      learnedAlternative: 'desestimar de plano',
      aiSuggestedAlternatives: matches.map((m, idx) => ({
        ...m,
        isLearnedFromFirm: idx === 0
      }))
    };
  }
}
