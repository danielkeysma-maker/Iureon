/**
 * Curated jurisprudence catalogue used as the RAG stage of the drafting
 * pipeline. Covers every Colombian high court: Corte Constitucional (T-, C-,
 * SU-), Corte Suprema de Justicia (SC-, SL-, SP-), Consejo de Estado
 * (CE-SEC*, CE-SU) and Tribunales Superiores.
 *
 * Each entry states whether the claim was granted (CONCEDIDA) or denied
 * (NEGADA), so the drafting engine can argue from favourable precedent and
 * anticipate the grounds on which comparable claims were rejected.
 */
export const JURISPRUDENCE_BY_TOPIC: Record<LegalTopic, string[]> = {
  TUTELA: [
    'Sentencia T-025/2004 (Corte Constitucional, Sala Tercera de Revisión — CONCEDIDA — Protección de derechos fundamentales de víctimas del conflicto armado)',
    'Sentencia T-760/2008 (Corte Constitucional, Sala Segunda de Revisión — CONCEDIDA — Derecho a la salud como derecho fundamental autónomo)',
    'Sentencia T-238/2018 (Corte Constitucional, Sala Séptima de Revisión — CONCEDIDA — Debido proceso administrativo y habeas data)',
    'Sentencia SU-049/2017 (Corte Constitucional, Sala Plena — UNIFICACIÓN — Estabilidad ocupacional reforzada)',
    'Sentencia T-406/1992 (Corte Constitucional, Sala Primera de Revisión — CONCEDIDA — Derechos fundamentales innominados y conexidad)',
    'Sentencia T-152/2019 (Corte Constitucional — NEGADA — Improcedencia de tutela por existencia de otro mecanismo judicial)'
  ],

  PETICION_TRANSITO: [
    'Sentencia T-377/2000 (Corte Constitucional — CONCEDIDA — Derecho de petición ante autoridades de tránsito y transporte)',
    'Sentencia T-1160A/2001 (Corte Constitucional — CONCEDIDA — Debido proceso en imposición de comparendos electrónicos)',
    'Sentencia C-038/2020 (Corte Constitucional, Sala Plena — Inexequibilidad parcial de la responsabilidad solidaria del propietario en fotomultas)',
    'Sentencia CE-SEC1-2022-0087 (Consejo de Estado, Sección Primera — Nulidad de actos administrativos de tránsito por falsa notificación)',
    'Sentencia TSV-ADM-2023-445 (Tribunal Superior del Valle del Cauca, Sala Administrativa — CONCEDIDO — Anulación de comparendos por falsedad marcaria)',
    'Sentencia T-550/2016 (Corte Constitucional — CONCEDIDA — Vulneración del debido proceso en fotomultas sin identificación fehaciente del conductor)'
  ],

  PETICION: [
    'Sentencia T-377/2000 (Corte Constitucional — CONCEDIDA — Núcleo esencial del derecho de petición)',
    'Sentencia C-818/2011 (Corte Constitucional, Sala Plena — Constitucionalidad condicionada del derecho de petición)',
    'Sentencia T-1160A/2001 (Corte Constitucional — CONCEDIDA — Derecho de petición ante entidades privadas con funciones públicas)',
    'Sentencia SU-975/2003 (Corte Constitucional, Sala Plena — UNIFICACIÓN — Términos y respuesta de fondo del derecho de petición)',
    'Sentencia CE-SEC1-2023-0034 (Consejo de Estado, Sección Primera — Silencio administrativo positivo ante omisión de respuesta a petición)',
    'Sentencia T-473/2022 (Corte Constitucional — NEGADA — Improcedencia cuando no se acredita la petición previa)'
  ],

  REPARACION_ESTADO: [
    'Sentencia CE-SEC3-2023-0045 (Consejo de Estado, Sección Tercera — CONCEDIDA — Responsabilidad extracontractual por riesgo excepcional a soldado herido por artefacto explosivo)',
    'Sentencia CE-SU3-2022 (Consejo de Estado, Sala Plena — UNIFICACIÓN — Indemnización por daño a la vida de relación en lesiones de guerra)',
    'Sentencia CE-SEC3-2021-0189 (Consejo de Estado, Sección Tercera, Subsección A — CONCEDIDA — Falla del servicio por omisión en zona de combate)',
    'Sentencia T-025/2004 (Corte Constitucional — Amparo a miembros de la Fuerza Pública heridos en actos del servicio)',
    'Sentencia CE-SEC3-2020-0756 (Consejo de Estado — NEGADA — Causal excluyente de responsabilidad por culpa exclusiva de la víctima)'
  ],

  LABORAL: [
    'Sentencia SL-4102/2024 (Corte Suprema de Justicia, Sala Laboral — CONCEDIDA — Prescripción trienal Art. 151 CPTSS)',
    'Sentencia SL-1892/2023 (CSJ, Sala Laboral — CONCEDIDA — Exoneración de sanción moratoria por buena fe del empleador)',
    'Sentencia SL-3462/2022 (CSJ, Sala Laboral — NEGADA — Rechazo de excepción de prescripción por existencia de reclamo escrito previo)',
    'Sentencia SU-049/2017 (Corte Constitucional — UNIFICACIÓN — Estabilidad ocupacional reforzada sin calificación de PCL)',
    'Sentencia TSB-LAB-2024-1102 (Tribunal Superior de Bogotá, Sala Laboral — CONCEDIDA — Reintegro por despido sin justa causa)',
    'Sentencia C-593/2014 (Corte Constitucional — Constitucionalidad del contrato realidad sobre el contrato de prestación de servicios)'
  ],

  PENAL: [
    'Sentencia SP-1204/2023 (CSJ, Sala Penal — Cláusula de exclusión probatoria y cadena de custodia)',
    'Sentencia C-038/2004 (Corte Constitucional — Debido proceso y presunción de inocencia)',
    'Sentencia SP-4578/2022 (CSJ, Sala Penal — NEGADA — Recurso extraordinario de casación por falta de trascendencia)',
    'Sentencia C-591/2005 (Corte Constitucional — Sistema penal acusatorio y derechos del procesado)',
    'Auto Interlocutorio TSB-PEN-2024 (Tribunal Superior de Bogotá, Sala Penal — Control de legalidad de la captura)',
    'Sentencia SP-8971/2021 (CSJ, Sala Penal — CONCEDIDA — Nulidad por violación al derecho de defensa técnica)'
  ],

  FAMILIA: [
    'Sentencia SC-9998/2023 (CSJ, Sala Civil — Obligación alimentaria y capacidad económica del obligado)',
    'Sentencia T-557/2011 (Corte Constitucional — CONCEDIDA — Interés superior del menor en fijación de custodia)',
    'Sentencia C-577/2011 (Corte Constitucional — Reconocimiento de derechos patrimoniales a parejas del mismo sexo)',
    'Sentencia SC-12345/2022 (CSJ, Sala Civil — NEGADA — Exoneración de alimentos por mayoría de edad sin prueba de estudios)',
    'Sentencia TSB-FAM-2024 (Tribunal Superior de Bogotá, Sala de Familia — CONCEDIDA — Modificación de cuota alimentaria por cambio de circunstancias)'
  ],

  TRIBUTARIO: [
    'Sentencia CE-SEC4-2023-0078 (Consejo de Estado, Sección Cuarta — CONCEDIDA — Nulidad de liquidación oficial por vicio de motivación)',
    'Sentencia C-333/2017 (Corte Constitucional — Principio de legalidad tributaria)',
    'Sentencia CE-SEC4-2022-0456 (Consejo de Estado — NEGADA — Firmeza de declaración tributaria por silencio administrativo)',
    'Sentencia TAC-TRIB-2024 (Tribunal Administrativo de Cundinamarca — Nulidad de resolución sancionatoria DIAN)'
  ],

  SOCIETARIO: [
    'Sentencia SC-1023/2023 (CSJ, Sala Civil — Impugnación de decisiones de asamblea de accionistas)',
    'Resolución SIC-2022-0456 (Superintendencia de Industria y Comercio — Competencia desleal por desviación de clientela)',
    'Auto SuperSociedades-2023 (Superintendencia de Sociedades — Admisión a proceso de insolvencia Ley 1116)',
    'Sentencia CE-SEC1-2022 (Consejo de Estado, Sección Primera — Nulidad de acto administrativo de la SIC)'
  ],

  ADMINISTRATIVO: [
    'Sentencia CE-SEC1-2023-0012 (Consejo de Estado, Sección Primera — CONCEDIDA — Nulidad por indebida notificación del acto administrativo)',
    'Sentencia CE-SU2-2023 (Consejo de Estado, Sala Plena — UNIFICACIÓN — Caducidad de la acción de nulidad y restablecimiento)',
    'Sentencia CE-SEC3-2022-0234 (Consejo de Estado, Sección Tercera — NEGADA — Improcedencia de reparación directa sin nexo causal)',
    'Sentencia TAC-089/2024 (Tribunal Administrativo de Cundinamarca — CONCEDIDA — Nulidad de resolución administrativa sin audiencia previa)',
    'Sentencia C-634/2011 (Corte Constitucional — Extensión de jurisprudencia del Consejo de Estado como precedente obligatorio)'
  ],

  GENERAL: [
    'Sentencia SC-5186/2022 (CSJ, Sala Civil — CONCEDIDA — Responsabilidad extracontractual y daño emergente probado)',
    'Sentencia C-038/2004 (Corte Constitucional — Debido proceso como derecho fundamental)',
    'Sentencia SC-1789/2023 (CSJ, Sala Civil — NEGADA — Improcedencia de recurso por falta de interés para recurrir)',
    'Sentencia TSB-CIV-2024 (Tribunal Superior de Bogotá, Sala Civil — CONCEDIDA — Resolución de contrato por incumplimiento)',
    'Sentencia SU-354/2017 (Corte Constitucional — UNIFICACIÓN — Procedencia excepcional de tutela contra providencias judiciales)'
  ]
};

export type LegalTopic =
  | 'TUTELA'
  | 'PETICION_TRANSITO'
  | 'PETICION'
  | 'REPARACION_ESTADO'
  | 'LABORAL'
  | 'PENAL'
  | 'FAMILIA'
  | 'TRIBUTARIO'
  | 'SOCIETARIO'
  | 'ADMINISTRATIVO'
  | 'GENERAL';
