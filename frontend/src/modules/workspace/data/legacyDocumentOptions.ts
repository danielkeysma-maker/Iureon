/**
 * Hand-written document-type lists, kept for the branches the catalogue does
 * not cover yet.
 *
 * The catalogue is the source of truth wherever it has entries: its names are
 * the ones the drafting engine can attach a verified article and deadline to.
 * These strings can only produce a generic template, so they are a fallback,
 * not an alternative. Remove a branch from here once it is catalogued.
 */

export interface BranchDocumentOptions {
  litigante: string[];
  despacho: string[];
}

  export const LEGACY_DOCUMENT_OPTIONS: Record<string, BranchDocumentOptions> = {
    // ═══ DERECHO CONSTITUCIONAL ═══
    'CONSTITUCIONAL': {
      litigante: [
        'Redacción de Acción de Tutela',
        'Impugnación de Sentencia de Tutela',
        'Acción de Tutela por Vía de Hecho Judicial',
        'Acción Popular / Acción de Grupo',
        'Acción de Cumplimiento',
        'Derecho de Petición (Art. 23 C.P. / Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia de Tutela (Concede / Niega)',
        'Proyección de Auto Admisorio & Medida Cautelar',
        'Proyección de Auto Resolutorio de Impugnación',
        'Contestación / Informe de Respuesta a Tutela (Juzgado/Entidad)'
      ]
    },
    // ═══ DERECHO LABORAL ═══
    'LABORAL': {
      litigante: [
        'Demanda Laboral Ordinaria',
        'Contestación de Demanda Laboral',
        'Sustentación de Recurso de Apelación Laboral',
        'Contestación a Recurso de Apelación Laboral',
        'Recurso de Casación Laboral (CSJ)',
        'Formulación de Excepción de Prescripción Trienal',
        'Solicitud de Conciliación Extrajudicial Laboral',
        'Derecho de Petición Laboral (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia Laboral de Primera Instancia',
        'Proyección de Auto Admisorio de Demanda Laboral',
        'Proyección de Auto Inadmisorio de Demanda Laboral',
        'Proyección de Auto Interlocutorio / Resuelve Excepciones'
      ]
    },
    // ═══ DERECHO CIVIL ═══
    'CIVIL': {
      litigante: [
        'Demanda Civil Ordinaria / Verbal',
        'Contestación de Demanda Civil',
        'Demanda Ejecutiva & Liquidación de Crédito',
        'Recurso de Reposición y en Subsidio Apelación',
        'Contestación a Recurso de Apelación Civil',
        'Recurso Extraordinario de Revisión Civil',
        'Derecho de Petición Civil (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia Civil Ordinaria / Verbal',
        'Proyección de Auto Admisorio de Demanda Civil',
        'Proyección de Auto Inadmisorio de Demanda Civil (Art. 90 CGP)',
        'Proyección de Auto Mandamiento de Pago',
        'Proyección de Auto Resolutorio de Recurso de Reposición'
      ]
    },
    // ═══ DERECHO ADMINISTRATIVO ═══
    'ADMINISTRATIVO': {
      litigante: [
        'Demanda de Nulidad y Restablecimiento del Derecho',
        'Demanda de Reparación Directa (Art. 140 CPACA)',
        'Demanda de Nulidad Simple (Art. 137 CPACA)',
        'Contestación de Demanda Contencioso Administrativa',
        'Solicitud de Medida Cautelar (Art. 229 CPACA)',
        'Recurso de Apelación CPACA',
        'Derecho de Petición Administrativo (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia Contencioso Administrativa',
        'Proyección de Auto Admisorio de Demanda Administrativa',
        'Proyección de Auto de Medida Cautelar',
        'Proyección de Auto Resolutorio de Recurso Administrativo'
      ]
    },
    // ═══ DERECHO PENAL ═══
    'PENAL': {
      litigante: [
        'Sustentación de Apelación Penal (Ley 906)',
        'Contestación / Memorial de Inhabilidad o Libertad',
        'Petición de HÁBEAS CORPUS',
        'Solicitud de Preclusión de la Defensa',
        'Solicitud de Principio de Oportunidad',
        'Solicitud de Sustitución de Medida de Aseguramiento',
        'Derecho de Petición Penal (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia Penal de Primera Instancia',
        'Proyección de Auto de Preclusión / Control de Garantías',
        'Proyección de Auto de Medida de Aseguramiento',
        'Proyección de Auto de Legalización de Captura',
        'Proyección de Auto de Formulación de Imputación'
      ]
    },
    // ═══ DERECHO DE FAMILIA ═══
    'FAMILIA': {
      litigante: [
        'Demanda de Fijación de Cuota Alimentaria',
        'Demanda de Exoneración / Reducción de Alimentos',
        'Contestación de Demanda de Alimentos o Custodia',
        'Demanda de Divorcio Contencioso',
        'Divorcio por Mutuo Acuerdo / Cesación de Efectos Civiles',
        'Demanda de Custodia y Regulación de Visitas',
        'Impugnación / Reconocimiento de Paternidad',
        'Proceso de Sucesión / Liquidación de Sociedad Conyugal',
        'Derecho de Petición de Familia (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia de Familia (Alimentos)',
        'Proyección de Sentencia de Familia (Divorcio)',
        'Proyección de Sentencia de Familia (Custodia)',
        'Proyección de Auto Admisorio de Demanda de Familia',
        'Proyección de Auto de Medidas Cautelares de Familia'
      ]
    },
    // ═══ PEQUEÑAS CAUSAS Y COMPETENCIA MÚLTIPLE ═══
    'PEQUEÑAS_CAUSAS': {
      litigante: [
        'Demanda Verbal Sumaria de Mínima Cuantía',
        'Contestación a Demanda de Pequeñas Causas',
        'Demanda de Restitución de Inmueble Arrendado',
        'Demanda de Proceso Monitorio (Art. 419 CGP)',
        'Derecho de Petición (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia de Única Instancia (Pequeñas Causas)',
        'Proyección de Auto Admisorio de Proceso Verbal Sumario',
        'Proyección de Auto de Lanzamiento de Inmueble',
        'Proyección de Auto de Requerimiento de Pago Monitorio'
      ]
    },
    // ═══ DERECHO TRIBUTARIO ═══
    'TRIBUTARIO': {
      litigante: [
        'Recurso de Reconsideración ante la DIAN',
        'Recurso de Apelación ante la DIAN',
        'Contestación a Liquidación Oficial DIAN',
        'Contestación a Resolución Sancionatoria DIAN',
        'Demanda de Nulidad y Restablecimiento Tributario',
        'Derecho de Petición Tributario (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia de Nulidad Tributaria',
        'Proyección de Auto Admisorio de Demanda Tributaria',
        'Proyección de Auto Resuelve Excepción de Cobro Coactivo'
      ]
    },
    // ═══ DERECHO SOCIETARIO Y COMERCIAL ═══
    'SOCIETARIO': {
      litigante: [
        'Demanda por Competencia Desleal (SIC)',
        'Demanda de Responsabilidad de Administradores',
        'Impugnación de Actas de Asamblea (SuperSociedades)',
        'Contestación a Demanda Societaria',
        'Solicitud de Admisión a Insolvencia (Ley 1116)',
        'Derecho de Petición Societario (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia Societaria (SuperSociedades / SIC)',
        'Proyección de Auto de Admisión a Insolvencia Ley 1116',
        'Proyección de Auto de Calificación de Créditos',
        'Proyección de Sentencia de Competencia Desleal (SIC)'
      ]
    },
    // ═══ DERECHO INTERNACIONAL ═══
    'INTERNACIONAL': {
      litigante: [
        'Petición / Demanda ante la Corte IDH (OEA)',
        'Solicitud de Exequátur ante la CSJ',
        'Demanda de Arbitraje Comercial Internacional (CIADI)',
        'Solicitud de Reconocimiento de Laudo Arbitral Extranjero',
        'Derecho de Petición Internacional (Ley 1755 de 2015)'
      ],
      despacho: [
        'Proyección de Sentencia de Exequátur (CSJ)',
        'Informe del Estado / Despacho ante la Corte IDH',
        'Proyección de Auto de Reconocimiento de Laudo Extranjero'
      ]
    }
  };
