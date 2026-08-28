import type { BranchCatalog } from '../types';

/**
 * SOCIETARIO catalogue.
 *
 * Generated from research/actuaciones-societario.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const SOCIETARIO_CATALOG: BranchCatalog = {
  meta: {
    branch: 'SOCIETARIO',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Código de Comercio (Decreto 410 de 1971); Ley 222 de 1995; Ley 1258 de 2008 (SAS); Ley 1116 de 2006 (insolvencia empresarial); Ley 2437 de 2024, que hizo permanente el régimen de los Decretos 560 y 772 de 2020; Ley 1564 de 2012, art. 24. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'LEY 2437 DE 2024 — RÉGIMEN OBLIGATORIO, NO OPCIONAL. Los deudores del régimen de la Ley 1116 de 2006 cuyos activos sean inferiores o iguales a 5.000 SMMLV SÓLO podrán ser admitidos al proceso de reorganización ABREVIADO. No es una alternativa que el deudor escoja: define a qué proceso puede entrar. Verifique el monto de los activos antes de escoger la vía.',
    'COMPETENCIA A PREVENCIÓN. La Superintendencia de Sociedades ejerce funciones jurisdiccionales sobre conflictos societarios, impugnación de actos de asambleas y juntas, desestimación de la personalidad jurídica y abuso del derecho (art. 24 CGP). Esa competencia opera A PREVENCIÓN y no excluye la de los jueces civiles. La elección de foro cambia el trámite y los recursos disponibles.',
    'Término de prescripción de la acción social de responsabilidad contra administradores: no se verificó en el texto de la norma. Queda sin verificar.',
    'Términos del proceso de validación judicial de acuerdos extrajudiciales de reorganización: no verificados.',
    'El régimen de insolvencia de la persona natural no comerciante (arts. 531 y siguientes del CGP) no está aquí; corresponde a la rama CIVIL.',
    'Las sociedades sometidas a regímenes especiales — financieras, aseguradoras, cooperativas de ahorro y crédito, servicios públicos — están excluidas de la Ley 1116 y se rigen por sus propias normas. No están cubiertas.'
    ]
  },
  actuaciones: [
  {
    id: 'societario/demanda-de-impugnacion-de-decisiones-de-asamblea-o-junta-de-socios',
    exactName: 'Demanda de impugnación de decisiones de asamblea o junta de socios',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 190 y 191; Ley 1564 de 2012, arts. 24 y 382',
    competentAuthority: 'Superintendencia de Sociedades en ejercicio de funciones jurisdiccionales, cuando se trate de personas jurídicas sometidas a su supervisión: Ley 1564 de 2012, art. 24 num. 5 lit. c) — \'La impugnación de actos de asambleas, juntas directivas, juntas de socios o de cualquier otro órgano directivo de personas sometidas a su supervisión\'; también lit. b) para los conflictos societarios entre los accionistas, o entre estos y la sociedad o sus administradores. En sede judicial, juez civil del circuito en primera instancia: art. 20 num. 8 —\'De la impugnación de actos de asambleas, juntas directivas, juntas de socios o de cualquier otro órgano directivo de personas jurídicas sometidas al derecho privado\'— y num. 4 para las controversias del contrato de sociedad. La competencia es A PREVENCIÓN: art. 24 parágrafo 1 — \'Las funciones jurisdiccionales a que se refiere este artículo, generan competencia a prevención y, por ende, no excluyen la competencia otorgada por la ley a las autoridades judiciales\'. LÍMITE: la acción indemnizatoria por los perjuicios que se deriven del acto o decisión declarados nulos es competencia EXCLUSIVA del juez, nunca de la Superintendencia (art. 24 num. 5 lit. c, inciso final).',
    term: { status: 'VERIFICADO', description: 'Dos (2) meses siguientes a la fecha de la reunión en que se adoptaron las decisiones. Si se trata de acuerdos o actos que deban inscribirse en el registro mercantil, los dos meses se cuentan desde la fecha de la inscripción (art. 191 C.Co).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la legitimación: administrador, revisor fiscal o socio ausente o disidente', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 2, name: 'Identificación de la reunión y de la decisión impugnada', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 3, name: 'Fecha de la reunión o de la inscripción en el registro mercantil, para el cómputo del término', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 4, name: 'Demostración de que la decisión no se ajusta a la ley o a los estatutos', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 5, name: 'Copia del acta y de los estatutos vigentes', mandatory: true, basis: 'Art. 382 CGP' },
      { n: 6, name: 'Solicitud de suspensión del acto impugnado', mandatory: false, basis: 'Art. 382 CGP' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr005.html#191'
  },
  {
    id: 'societario/demanda-de-resolucion-de-conflictos-societarios',
    exactName: 'Demanda de resolución de conflictos societarios',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1258 de 2008, art. 40 inciso 1 (habilitación de pacto arbitral o de amigable composición, vigente); Ley 1564 de 2012, art. 24 num. 5 lits. b) y c) — el inciso 2 del art. 40, que era el que asignaba la competencia a la Superintendencia de Sociedades, fue DEROGADO por el literal a) del art. 626 del CGP y su contenido pasó al art. 24 num. 5 del CGP; Ley 1258 de 2008, art. 44 (fundamento constitucional del art. 116); Código de Comercio, art. 191 y Ley 1564 de 2012, art. 382 (caducidad de la impugnación)',
    competentAuthority: 'Superintendencia de Sociedades, con facultades jurisdiccionales en materia societaria sobre «la resolución de conflictos societarios, las diferencias que ocurran entre los accionistas, o entre estos y la sociedad o entre estos y sus administradores, en desarrollo del contrato social o del acto unilateral» (Ley 1564 de 2012, art. 24 num. 5 lit. b) y sobre «la impugnación de actos de asambleas, juntas directivas, juntas de socios o de cualquier otro órgano directivo de personas sometidas a su supervisión» (lit. c), por proceso verbal sumario, salvo que los estatutos pacten arbitramento o amigable composición (Ley 1258 de 2008, art. 40 inc. 1). ADVERTENCIA DE FORO que la ficha no publicaba: cuando se trate de impugnación, «la acción indemnizatoria a que haya lugar por los posibles perjuicios que se deriven del acto o decisión que se declaren nulos será competencia exclusiva del Juez» (art. 24 num. 5 lit. c): los perjuicios no se piden ante la Superintendencia.',
    term: { status: 'NO_CADUCA', description: 'El art. 40 de la Ley 1258 de 2008 no fija término alguno, y NO puede escribirse «no opera caducidad», porque el propio artículo incluye dentro de esos conflictos la impugnación de determinaciones de asamblea o junta directiva, que sí caduca y en plazo corto: «La demanda de impugnación de actos o decisiones de asambleas, juntas directivas, juntas de socios o de cualquier otro órgano directivo de personas jurídicas de derecho privado, solo podrá proponerse, so pena de caducidad, dentro de los dos (2) meses siguientes a la fecha del acto respectivo y deberá dirigirse contra la entidad. Si se tratare de acuerdos o actos sujetos a registro, el término se contará desde la fecha de la inscripción» (Ley 1564 de 2012, art. 382), en el mismo sentido del art. 191 del Código de Comercio: «La impugnación sólo podrá ser intentada dentro de los dos meses siguientes a la fecha de la reunión en la cual sean adoptadas las decisiones, a menos que se trate de acuerdos o actos de la asamblea que deban ser inscritos en el registro mercantil, caso en el cual los dos meses se contarán a partir de la fecha de la inscripción». Con la demanda puede pedirse la suspensión provisional de los efectos del acto impugnado, prestando caución en la cuantía que el juez señale (art. 382 inc. 2). Para las demás diferencias societarias la ley no fija caducidad propia: el término depende del tipo de diferencia que se demande y no es un valor único.' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes: accionistas entre sí, o con la sociedad o sus administradores', mandatory: true, basis: 'Art. 40' },
      { n: 2, name: 'Verificación de que los estatutos no pactan arbitramento ni amigable composición', mandatory: true, basis: 'Art. 40' },
      { n: 3, name: 'Hechos que configuran la diferencia', mandatory: true, basis: 'Art. 40' },
      { n: 4, name: 'Estatutos sociales y certificado de existencia y representación', mandatory: true, basis: null },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34130'
  },
  {
    id: 'societario/demanda-de-desestimacion-de-la-personalidad-juridica',
    exactName: 'Demanda de desestimación de la personalidad jurídica',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1258 de 2008, art. 42; Ley 1564 de 2012, art. 24',
    competentAuthority: 'Superintendencia de Sociedades, por proceso verbal sumario (art. 42)',
    term: { status: 'NO_CADUCA', description: 'El artículo 42 no fija término de caducidad para la acción: no opera caducidad. La norma sólo asigna competencia y trámite — la declaratoria de nulidad de los actos defraudatorios se adelanta ante la Superintendencia de Sociedades por proceso verbal sumario, y la acción indemnizatoria corresponde a prevención a la Superintendencia o a los jueces civiles del circuito especializados, también por proceso verbal sumario (Ley 1258 de 2008, art. 42).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sociedad, de los accionistas y de los administradores demandados', mandatory: true, basis: 'Art. 42' },
      { n: 2, name: 'Demostración del uso de la sociedad en fraude a la ley o en perjuicio de terceros', mandatory: true, basis: 'Art. 42' },
      { n: 3, name: 'Pretensión de declaratoria de nulidad de los actos defraudatorios', mandatory: true, basis: 'Art. 42' },
      { n: 4, name: 'Pretensión de responsabilidad solidaria de accionistas y administradores', mandatory: true, basis: 'Art. 42' },
      { n: 5, name: 'Cuantificación de los perjuicios', mandatory: true, basis: 'Art. 42' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34130'
  },
  {
    id: 'societario/demanda-de-nulidad-por-abuso-del-derecho-de-voto',
    exactName: 'Demanda de nulidad por abuso del derecho de voto',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1258 de 2008, art. 43; Ley 1564 de 2012, art. 24',
    competentAuthority: 'Superintendencia de Sociedades, por proceso verbal sumario (Ley 1258 de 2008, art. 43), con fundamento jurisdiccional en la Ley 1564 de 2012, art. 24 num. 5 lit. e), que le atribuye «la declaratoria de nulidad absoluta de la determinación adoptada en abuso del derecho por ilicitud del objeto y la de indemnización de perjuicios, en los casos de abuso de mayoría, como en los de minoría y de paridad»; y en la Ley 1258 de 2008, art. 44: «Las funciones jurisdiccionales a que se refieren los artículos 24, 40, 42 y 43, serán ejercidas por la Superintendencia de Sociedades, con fundamento en lo previsto en el artículo 116 de la Constitución Política». A diferencia de la impugnación ordinaria, aquí la indemnización de perjuicios sí se tramita ante la Superintendencia.',
    term: { status: 'NO_CADUCA', description: 'HUECO CERRADO en la norma citada: el art. 43 de la Ley 1258 de 2008 NO contiene término alguno; solo habilita la acción de nulidad absoluta por ilicitud del objeto y la indemnizatoria, por proceso verbal sumario. NO debe escribirse «no opera caducidad»: la acción recae sobre una determinación de asamblea, y la impugnación de determinaciones de asamblea caduca en dos (2) meses — «solo podrá proponerse, so pena de caducidad, dentro de los dos (2) meses siguientes a la fecha del acto respectivo […]. Si se tratare de acuerdos o actos sujetos a registro, el término se contará desde la fecha de la inscripción» (Ley 1564 de 2012, art. 382; en igual sentido Código de Comercio, art. 191). Está discutido si esa caducidad alcanza también a la acción de nulidad absoluta del art. 43 o si esta se rige por el régimen general de la nulidad absoluta, y ninguna de las dos normas resuelve la cuestión en su texto: el catálogo no fija aquí un plazo porque la norma no lo fija. ADVERTENCIA PRÁCTICA, no un plazo inventado: mientras la discusión no esté resuelta, demandar después del segundo mes contado desde el acto o desde su inscripción expone la acción a que se declare caducada. Plazo adicional leído en texto oficial: la acción de indemnización contra los administradores que cumplieron la decisión anulada «sólo podrá ser propuesta dentro del año siguiente a la fecha de la ejecutoria de la sentencia que declare nula la decisión impugnada» (Código de Comercio, art. 193).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la decisión y del accionista cuyo voto se cuestiona', mandatory: true, basis: 'Art. 43' },
      { n: 2, name: 'Demostración de que el voto no se ejerció en el interés de la compañía', mandatory: true, basis: 'Art. 43' },
      { n: 3, name: 'Acreditación del propósito de causar daño o de obtener ventaja injustificada', mandatory: true, basis: 'Art. 43' },
      { n: 4, name: 'Pretensión de nulidad de la decisión y de indemnización de perjuicios', mandatory: true, basis: 'Art. 43' },
      { n: 5, name: 'Copia del acta de la reunión', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34130'
  },
  {
    id: 'societario/ejercicio-de-la-accion-social-de-responsabilidad-contra-administradores',
    exactName: 'Ejercicio de la acción social de responsabilidad contra administradores',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 222 de 1995, arts. 23, 24 y 25',
    competentAuthority: 'Superintendencia de Sociedades o juez competente',
    term: { status: 'VERIFICADO', description: 'Requiere decisión previa de la asamblea general o junta de socios, que puede adoptarse aunque no conste en el orden del día. La convocatoria puede hacerla un número de socios que represente al menos el veinte por ciento (20%) del capital, y la decisión se toma por la mitad más una de las acciones, cuotas o partes de interés representadas en la reunión, e implica la remoción del administrador (art. 25).' },
    requiredSections: [
      { n: 1, name: 'Acta de la asamblea o junta que decidió ejercer la acción', mandatory: true, basis: 'Art. 25' },
      { n: 2, name: 'Acreditación del quórum decisorio de la mitad más una', mandatory: true, basis: 'Art. 25' },
      { n: 3, name: 'Identificación de los administradores demandados', mandatory: true, basis: 'Art. 24' },
      { n: 4, name: 'Deberes incumplidos: buena fe, lealtad y diligencia de un buen hombre de negocios', mandatory: true, basis: 'Art. 23' },
      { n: 5, name: 'Daño causado a la sociedad y su cuantificación', mandatory: true, basis: 'Art. 24' },
      { n: 6, name: 'Constancia de la remoción del administrador como efecto de la decisión', mandatory: true, basis: 'Art. 25' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6739'
  },
  {
    id: 'societario/demanda-de-cumplimiento-de-acuerdo-de-accionistas',
    exactName: 'Demanda de cumplimiento de acuerdo de accionistas',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1258 de 2008, art. 24; Ley 1564 de 2012, art. 24',
    competentAuthority: 'Superintendencia de Sociedades en ejercicio de funciones jurisdiccionales (art. 24 CGP)',
    term: { status: 'NO_CADUCA', description: 'El artículo 24 no fija término de caducidad para la acción de ejecución específica: no opera caducidad; los accionistas pueden promoverla ante la Superintendencia de Sociedades por el trámite del proceso verbal sumario. Los plazos que sí fija el artículo son sustanciales: el acuerdo sólo debe ser acatado por la compañía si fue depositado en las oficinas de la administración y su término no es superior a diez (10) años, prorrogables por voluntad unánime de los suscriptores por períodos que no superen los diez (10) años; y el representante de los suscriptores debe responder por escrito las aclaraciones solicitadas por la sociedad dentro de los cinco (5) días comunes siguientes al recibo de la solicitud (Ley 1258 de 2008, art. 24).' },
    requiredSections: [
      { n: 1, name: 'Copia del acuerdo de accionistas y prueba de su depósito en la sociedad', mandatory: true, basis: 'Ley 1258 de 2008, art. 24' },
      { n: 2, name: 'Identificación de las obligaciones incumplidas', mandatory: true, basis: null },
      { n: 3, name: 'Hechos del incumplimiento', mandatory: true, basis: null },
      { n: 4, name: 'Pretensión de cumplimiento y, en su caso, de indemnización', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34130'
  },
  {
    id: 'societario/solicitud-de-admision-al-proceso-de-reorganizacion',
    exactName: 'Solicitud de admisión al proceso de reorganización',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1116 de 2006, arts. 9, 10, 13 y 31',
    competentAuthority: 'Superintendencia de Sociedades como juez del concurso; juez civil del circuito en los casos que la ley señala',
    term: { status: 'VERIFICADO', description: 'Confirmados los créditos, el plazo para celebrar el acuerdo de reorganización no será superior a cuatro (4) meses, prorrogable por un término que en ningún caso podrá exceder de dos (2) meses (art. 31).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de los supuestos de admisión: cesación de pagos o incapacidad de pago inminente', mandatory: true, basis: 'Art. 9' },
      { n: 2, name: 'Estados financieros de los últimos tres ejercicios, certificados y dictaminados', mandatory: true, basis: 'Art. 13' },
      { n: 3, name: 'Estado de inventario de activos y pasivos', mandatory: true, basis: 'Art. 13' },
      { n: 4, name: 'Memoria explicativa de las causas de la crisis', mandatory: true, basis: 'Art. 13' },
      { n: 5, name: 'Relación completa y actualizada de acreedores, con montos y garantías', mandatory: true, basis: 'Art. 13' },
      { n: 6, name: 'Verificación de que los activos superan 5.000 SMMLV; de lo contrario procede el proceso abreviado', mandatory: true, basis: 'Ley 2437 de 2024' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/solicitud-de-admision-al-proceso-de-reorganizacion-abreviado',
    exactName: 'Solicitud de admisión al proceso de reorganización abreviado',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2437 de 2024, art. 18; Ley 1116 de 2006, aplicable en lo no dispuesto',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'Se fija una fecha que tenga lugar dentro de los tres (3) meses siguientes para realizar la reunión de conciliación en la que se celebre el acuerdo (art. 18).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de que los activos del deudor son inferiores o iguales a 5.000 SMMLV', mandatory: true, basis: 'Ley 2437 de 2024' },
      { n: 2, name: 'Acreditación de los supuestos de insolvencia', mandatory: true, basis: 'Ley 1116 de 2006, art. 9' },
      { n: 3, name: 'Estados financieros e inventario de activos y pasivos', mandatory: true, basis: 'Ley 1116 de 2006, art. 13' },
      { n: 4, name: 'Relación de acreedores con montos y garantías', mandatory: true, basis: 'Ley 1116 de 2006, art. 13' },
      { n: 5, name: 'Propuesta de acuerdo para la reunión de conciliación', mandatory: true, basis: 'Ley 2437 de 2024, art. 18' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=256656'
  },
  {
    id: 'societario/solicitud-de-liquidacion-judicial',
    exactName: 'Solicitud de liquidación judicial',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1116 de 2006, arts. 47 y 48',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'Abierto el proceso, el aviso permanece publicado por diez (10) días y los acreedores disponen de veinte (20) días desde la desfijación para presentar sus créditos (art. 48).' },
    requiredSections: [
      { n: 1, name: 'Causal de liquidación judicial invocada', mandatory: true, basis: 'Art. 47' },
      { n: 2, name: 'Estados financieros e inventario de activos', mandatory: true, basis: 'Art. 48' },
      { n: 3, name: 'Relación de acreedores', mandatory: true, basis: 'Art. 48' },
      { n: 4, name: 'Relación de procesos judiciales en curso contra el deudor', mandatory: true, basis: 'Art. 48' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/solicitud-de-liquidacion-judicial-simplificada',
    exactName: 'Solicitud de liquidación judicial simplificada',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2437 de 2024, art. 19',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'El liquidador presenta la estimación de gastos dentro de quince (15) días; los acreedores presentan sus créditos en diez (10) días; se corre traslado de la calificación por cinco (5) días; hay dos (2) meses para vender los bienes y la adjudicación se hace dentro de los diez (10) días siguientes (art. 19).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de que los activos son inferiores o iguales a 5.000 SMMLV', mandatory: true, basis: 'Ley 2437 de 2024' },
      { n: 2, name: 'Causal de liquidación invocada', mandatory: true, basis: 'Ley 1116 de 2006, art. 47' },
      { n: 3, name: 'Inventario de activos y su avalúo', mandatory: true, basis: 'Ley 2437 de 2024, art. 19' },
      { n: 4, name: 'Relación de acreedores', mandatory: true, basis: 'Ley 2437 de 2024, art. 19' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=256656'
  },
  {
    id: 'societario/presentacion-de-creditos-en-proceso-de-insolvencia',
    exactName: 'Presentación de créditos en proceso de insolvencia',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1116 de 2006, art. 48',
    competentAuthority: 'El juez del concurso, por conducto del liquidador o promotor',
    term: { status: 'VERIFICADO', description: 'Veinte (20) días contados a partir de la fecha de desfijación del aviso que informa la apertura del proceso de liquidación judicial (art. 48).' },
    requiredSections: [
      { n: 1, name: 'Identificación del acreedor y del deudor concursado', mandatory: true, basis: 'Art. 48' },
      { n: 2, name: 'Monto del crédito, discriminando capital e intereses', mandatory: true, basis: 'Art. 48' },
      { n: 3, name: 'Clase y prelación legal que se reclama', mandatory: true, basis: 'Art. 48' },
      { n: 4, name: 'Documentos que soportan la existencia y cuantía del crédito', mandatory: true, basis: 'Art. 48' },
      { n: 5, name: 'Garantías constituidas a favor del acreedor', mandatory: false, basis: 'Art. 48' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/objecion-a-la-calificacion-y-graduacion-de-creditos',
    exactName: 'Objeción a la calificación y graduación de créditos',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1116 de 2006, arts. 29 y 48',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'Del proyecto de reconocimiento y graduación de créditos y derechos de voto presentado por el promotor se corre traslado en las oficinas del juez del concurso por el término de cinco (5) días, y es dentro de ese traslado que deben presentarse las objeciones. Vencido, el juez corre traslado de las objeciones por tres (3) días para que los acreedores afectados se pronuncien, y luego corre un término de diez (10) días para provocar la conciliación de las objeciones; las no conciliadas las decide el juez del concurso en audiencia. La única prueba admisible es la documental y debe aportarse con el escrito de objeciones o con el de respuesta (Ley 1116 de 2006, art. 29).' },
    requiredSections: [
      { n: 1, name: 'Identificación del crédito objetado y del proyecto de graduación', mandatory: true, basis: 'Art. 29' },
      { n: 2, name: 'Razones de la objeción: existencia, cuantía o prelación', mandatory: true, basis: 'Art. 29' },
      { n: 3, name: 'Pruebas que la sustentan', mandatory: true, basis: 'Art. 29' },
      { n: 4, name: 'Petición concreta de modificación de la calificación', mandatory: true, basis: 'Art. 29' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/solicitud-de-convocatoria-a-asamblea-o-junta-de-socios',
    exactName: 'Solicitud de convocatoria a asamblea o junta de socios',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 181, 182 y 423; Ley 222 de 1995, art. 25',
    competentAuthority: 'Superintendencia de Sociedades, o el órgano estatutario competente',
    term: { status: 'VERIFICADO', description: 'La ley no fija plazo para presentar la solicitud de convocatoria. El término perentorio es el de la antelación de la convocatoria una vez ordenada: para las reuniones en que hayan de aprobarse los balances de fin de ejercicio, cuando menos quince (15) días hábiles de anticipación; en los demás casos basta una antelación de cinco (5) días comunes; toda convocatoria se hace en la forma prevista en los estatutos y, a falta de estipulación, mediante aviso publicado en un diario de circulación en el domicilio principal de la sociedad, y tratándose de asamblea extraordinaria en el aviso se inserta el orden del día (Código de Comercio, art. 424).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la participación en el capital que legitima la solicitud', mandatory: true, basis: 'Art. 25 Ley 222 de 1995' },
      { n: 2, name: 'Orden del día propuesto', mandatory: true, basis: 'Art. 182 C.Co' },
      { n: 3, name: 'Constancia de la negativa o inacción del administrador', mandatory: true, basis: null },
      { n: 4, name: 'Estatutos vigentes y certificado de existencia y representación', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr013.html'
  },
  {
    id: 'societario/solicitud-de-ejercicio-del-derecho-de-inspeccion',
    exactName: 'Solicitud de ejercicio del derecho de inspección',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 328, 446 y 447; Ley 222 de 1995, art. 48. Debe RETIRARSE de legalBasis el art. 48 del Código de Comercio, que no regula el derecho de inspección sino la conformidad de la contabilidad del comerciante (\'ARTÍCULO 48. <CONFORMIDAD DE LIBROS Y PAPELES DEL COMERCIANTE A LAS NORMAS COMERCIALES...>. Todo comerciante conformará su contabilidad, libros, registros contables, inventarios y estados financieros en general, a las disposiciones de este Código y demás normas sobre la materia.\'). El artículo 48 que sí regula la materia es el de la LEY 222 DE 1995, ya citado en la ficha. Debe AGREGARSE el art. 446 C.Co, porque el art. 447 remite a él (\'los documentos indicados en el artículo anterior\') y es el que enumera el balance y los documentos anexos que la junta directiva y el representante legal presentan a la asamblea.',
    competentAuthority: 'La sociedad, por conducto de la administración, en las oficinas de la administración que funcionen en el domicilio principal (Ley 222 de 1995, art. 48; y, para el balance de fin de ejercicio, C.Co art. 447). Ante la negativa, la Superintendencia de Sociedades por dos vías distintas que la ficha debe separar: (i) en ejercicio de inspección, vigilancia y control, sancionando el incumplimiento —C.Co art. 447 inciso 2: \'Los administradores y funcionarios directivos así como el revisor fiscal que no dieren cumplimiento a lo preceptuado en este artículo, serán sancionados por el superintendente con multas sucesivas\'—; y (ii) en ejercicio de funciones jurisdiccionales sobre personas sometidas a su supervisión, para resolver el conflicto societario de fondo (Ley 1564 de 2012, art. 24 num. 5 lit. b), competencia a prevención con el juez civil del circuito (arts. 20 num. 4 y 24 parágrafo 1).',
    term: { status: 'VERIFICADO', description: 'Los documentos del artículo 446, junto con los libros y demás comprobantes exigidos por la ley, deben ponerse a disposición de los accionistas en las oficinas de la administración durante los quince (15) días hábiles que preceden a la reunión de la asamblea; es dentro de esa ventana que se ejerce el derecho de inspección respecto de los balances de fin de ejercicio (art. 447 C.Co).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la calidad de socio o accionista', mandatory: true, basis: null },
      { n: 2, name: 'Documentos y libros cuya inspección se solicita', mandatory: true, basis: 'Art. 48 Ley 222 de 1995' },
      { n: 3, name: 'Constancia de la negativa de la sociedad', mandatory: true, basis: null },
      { n: 4, name: 'Petición de orden para permitir la inspección', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr013.html#447'
  },
  {
    id: 'societario/demanda-de-disolucion-y-liquidacion-de-sociedad',
    exactName: 'Demanda de disolución y liquidación de sociedad',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 218 y siguientes; Ley 1258 de 2008, art. 34',
    competentAuthority: 'Superintendencia de Sociedades o juez civil del circuito',
    term: { status: 'VERIFICADO', description: 'El art. 218 del Código de Comercio enumera las causales de disolución y no fija término de caducidad para demandar su declaratoria. Cuando la disolución provenga de causales distintas de las indicadas en el art. 219, los asociados pueden evitarla adoptando las modificaciones del caso y observando las reglas de las reformas del contrato, siempre que el acuerdo se formalice dentro de los seis (6) meses siguientes a la ocurrencia de la causal (art. 220 C.Co). En la sociedad por acciones simplificada el enervamiento se rige por el art. 35 de la Ley 1258 de 2008: seis (6) meses siguientes a la fecha en que la asamblea reconozca el acaecimiento de la causal, y dieciocho (18) meses en el caso de la causal del ordinal 7 del art. 34 -hoy causal de disolución por no cumplimiento de la hipótesis de negocio en marcha del art. 4 de la Ley 2069 de 2020-. El numeral 7 del art. 34 de la Ley 1258 de 2008 (disolución por pérdidas) fue DEROGADO por el parágrafo 2 del art. 4 de la Ley 2069 de 2020.' },
    requiredSections: [
      { n: 1, name: 'Causal de disolución invocada', mandatory: true, basis: 'Art. 218 C.Co' },
      { n: 2, name: 'Hechos que la configuran', mandatory: true, basis: null },
      { n: 3, name: 'Certificado de existencia y representación y estatutos', mandatory: true, basis: null },
      { n: 4, name: 'Pretensión de declaratoria de disolución y orden de liquidación', mandatory: true, basis: 'Art. 218 C.Co' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr006.html'
  },
  {
    id: 'societario/demanda-de-nulidad-de-reforma-estatutaria',
    exactName: 'Demanda de nulidad de reforma estatutaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 190 y 191; Ley 1564 de 2012, art. 382',
    competentAuthority: 'Superintendencia de Sociedades en ejercicio de funciones jurisdiccionales, tratándose de personas jurídicas sometidas a su supervisión (Ley 1564 de 2012, art. 24 num. 5 lit. c, impugnación de actos de asambleas, juntas directivas y juntas de socios; y lit. b para los conflictos societarios), o juez civil del circuito en primera instancia (art. 20 num. 8 y num. 4). La competencia es A PREVENCIÓN (art. 24 parágrafo 1), de modo que radicar ante una excluye a la otra por reparto, pero ninguna desplaza legalmente a la otra de antemano. La acción indemnizatoria derivada del acto declarado nulo es competencia exclusiva del juez (art. 24 num. 5 lit. c, inciso final).',
    term: { status: 'VERIFICADO', description: 'Cuando la reforma deba inscribirse en el registro mercantil, los dos (2) meses para impugnarla se cuentan desde la fecha de la inscripción (art. 191 C.Co).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la reforma y de la reunión que la aprobó', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 2, name: 'Fecha de inscripción en el registro mercantil', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 3, name: 'Causal de nulidad: violación de la ley o de los estatutos', mandatory: true, basis: 'Art. 190 C.Co' },
      { n: 4, name: 'Copia de la escritura o del documento de reforma', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr005.html#191'
  },
  {
    id: 'societario/solicitud-de-nombramiento-de-perito-para-avaluo-de-acciones-o-cuotas',
    exactName: 'Solicitud de nombramiento de perito para avalúo de acciones o cuotas',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 222 de 1995, arts. 14, 15 y 16 (derecho de retiro, opción de compra y avalúo por peritos designados por la Cámara de Comercio); Código de Comercio, arts. 363, 364 y 365 (derecho de preferencia sobre cuotas y designación de peritos ante discrepancia sobre precio o plazo). Debe RETIRARSE del legal_basis el art. 136 del Código de Comercio, que no trata del avalúo de cuotas o acciones sino de la calificación de los aportes en especie: «Los aportes de establecimientos de comercio, derechos sobre la propiedad industrial, partes de interés, cuotas o acciones, se considerarán como aportes en especie».',
    competentAuthority: 'Depende de la vía, y «Superintendencia de Sociedades» a secas es dirección equivocada para el caso más frecuente: (a) en el derecho de retiro, los peritos los designa la CÁMARA DE COMERCIO DEL DOMICILIO SOCIAL (Ley 222 de 1995, art. 16); a la entidad estatal que ejerza la inspección, vigilancia o control solo le corresponde dirimir la discrepancia sobre la existencia de la causal de retiro, salvo pacto arbitral (art. 14 inc. 4), y determinar de oficio o a petición de interesado la improcedencia del derecho de retiro «cuando establezca que el reembolso afecte sustancialmente la prenda común de los acreedores», dentro de los dos meses siguientes a la adopción de la decisión (art. 16 inc. 3); (b) en el derecho de preferencia sobre cuotas, la designación de peritos sigue el procedimiento previsto en los ESTATUTOS y, en su defecto, la ley: «Si los socios interesados en adquirir las cuotas discreparen respecto del precio o del plazo, se designarán peritos para que fijen uno u otro. El justiprecio y el plazo determinados serán obligatorios para las partes. […] En los estatutos podrán establecerse otros procedimientos para fijar las condiciones de la cesión» (Código de Comercio, art. 364).',
    term: { status: 'VERIFICADO', description: 'HUECO CERRADO en cuanto a la solicitud misma: ninguna norma fija plazo para pedir el nombramiento del perito ni para que rinda el avalúo, y en el derecho de preferencia el art. 364 del Código de Comercio remite la designación al procedimiento de los ESTATUTOS. Pero los RELOJES DEL SOCIO, que la ficha callaba, sí son legales y son cortos: (a) el derecho de retiro se ejerce «dentro de los ocho días siguientes a la fecha en que se adoptó la respectiva decisión», comunicándolo por escrito al representante legal (Ley 222 de 1995, art. 14) — vencidos esos ocho días el derecho se extingue y no hay avalúo que pedir; (b) si la asamblea o junta revoca la decisión «dentro de los sesenta días siguientes a la adopción de la decisión, caduca el derecho de receso» y los socios que lo ejercieron readquieren sus derechos (art. 14 inc. 5); (c) notificado el retiro, la sociedad ofrece las acciones o cuotas a los demás socios «dentro de los cinco días siguientes a la notificación del retiro», estos las adquieren «dentro de los quince días siguientes» a prorrata, y de no adquirirse todas la sociedad las readquiere «dentro de los cinco días siguientes» si existen utilidades líquidas o reservas (art. 15); (d) el reembolso «deberá realizarse dentro de los dos meses siguientes al acuerdo o al dictamen pericial», salvo pacto en contrario, y la entidad de inspección, vigilancia o control puede establecer «plazos adicionales no superiores a un ano [año]», causándose entre tanto intereses a la tasa corriente bancaria (art. 16); (e) en el derecho de preferencia sobre cuotas, los demás socios tienen quince (15) días desde el traslado de la oferta para manifestar si les interesa adquirirlas (C.Co, art. 363), y si ninguno se interesa la sociedad debe presentar comprador «dentro de los sesenta días siguientes a la petición del presunto cedente» y, «si dentro de los veinte días siguientes no se perfecciona la cesión, los demás socios optarán entre disolver la sociedad o excluir al socio interesado en ceder las cuotas» (C.Co, art. 365). RELOJ DE SALIDA: quien se retira responde subsidiariamente y hasta el monto de lo reembolsado por las obligaciones sociales contraídas hasta la inscripción del retiro, responsabilidad que «cesará transcurrido un año desde la inscripción del retiro en el Registro Mercantil» (Ley 222 de 1995, art. 16, parágrafo).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la calidad de socio o accionista', mandatory: true, basis: null },
      { n: 2, name: 'Hecho que genera la necesidad del avalúo: retiro, ejercicio del derecho de preferencia o exclusión', mandatory: true, basis: 'Art. 14 Ley 222 de 1995' },
      { n: 3, name: 'Constancia de la falta de acuerdo sobre el precio', mandatory: true, basis: null },
      { n: 4, name: 'Estados financieros de la sociedad', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6739'
  },
  {
    id: 'societario/auto-de-admision-al-proceso-de-reorganizacion',
    exactName: 'Auto de admisión al proceso de reorganización',
    branch: 'SOCIETARIO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1116 de 2006, arts. 19 y 31',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'Confirmados los créditos, el plazo para celebrar el acuerdo no será superior a cuatro (4) meses, prorrogable por máximo dos (2) meses adicionales (art. 31).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los supuestos de admisión', mandatory: true, basis: 'Art. 9' },
      { n: 2, name: 'Designación del promotor', mandatory: true, basis: 'Art. 19' },
      { n: 3, name: 'Orden de inscripción del auto en el registro mercantil', mandatory: true, basis: 'Art. 19' },
      { n: 4, name: 'Orden de suspensión de procesos ejecutivos contra el deudor', mandatory: true, basis: 'Art. 20' },
      { n: 5, name: 'Fijación del plazo para celebrar el acuerdo', mandatory: true, basis: 'Art. 31' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/auto-de-apertura-de-liquidacion-judicial',
    exactName: 'Auto de apertura de liquidación judicial',
    branch: 'SOCIETARIO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1116 de 2006, art. 48',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'El aviso se publica por diez (10) días; los acreedores presentan créditos dentro de los veinte (20) días siguientes a la desfijación; el liquidador elabora el inventario en máximo treinta (30) días y presenta el proyecto de graduación en un plazo no inferior a un (1) mes ni superior a tres (3) meses; el juez decide dentro de los quince (15) días siguientes (art. 48).' },
    requiredSections: [
      { n: 1, name: 'Declaración de apertura y designación del liquidador', mandatory: true, basis: 'Art. 48' },
      { n: 2, name: 'Orden de publicación del aviso por diez (10) días', mandatory: true, basis: 'Art. 48' },
      { n: 3, name: 'Fijación del término para presentar créditos', mandatory: true, basis: 'Art. 48' },
      { n: 4, name: 'Orden de elaborar el inventario de activos en máximo treinta (30) días', mandatory: true, basis: 'Art. 48 num. 9' },
      { n: 5, name: 'Orden de inscripción en el registro mercantil', mandatory: true, basis: 'Art. 48' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/providencia-de-confirmacion-del-acuerdo-de-reorganizacion',
    exactName: 'Providencia de confirmación del acuerdo de reorganización',
    branch: 'SOCIETARIO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1116 de 2006, arts. 31 y 35 a 37',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'El acuerdo debe celebrarse dentro de los cuatro (4) meses siguientes a la confirmación de los créditos, prorrogables por máximo dos (2) meses (art. 31).' },
    requiredSections: [
      { n: 1, name: 'Verificación del cumplimiento del plazo del artículo 31', mandatory: true, basis: 'Art. 31' },
      { n: 2, name: 'Verificación de las mayorías exigidas por clase de acreedor', mandatory: true, basis: 'Art. 31' },
      { n: 3, name: 'Control de legalidad del contenido del acuerdo', mandatory: true, basis: 'Art. 35' },
      { n: 4, name: 'Pronunciamiento sobre las objeciones presentadas', mandatory: true, basis: 'Art. 35' },
      { n: 5, name: 'Efectos de la confirmación frente a todos los acreedores', mandatory: true, basis: 'Art. 36' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/auto-de-calificacion-y-graduacion-de-creditos',
    exactName: 'Auto de calificación y graduación de créditos',
    branch: 'SOCIETARIO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1116 de 2006, arts. 29 y 48',
    competentAuthority: 'El juez del concurso',
    term: { status: 'VERIFICADO', description: 'El liquidador presenta el proyecto de graduación en un plazo fijado por el juez, no inferior a un (1) mes ni superior a tres (3) meses; el juez decide dentro de los quince (15) días siguientes (art. 48).' },
    requiredSections: [
      { n: 1, name: 'Relación de los créditos presentados y de los reconocidos', mandatory: true, basis: 'Art. 48' },
      { n: 2, name: 'Aplicación de la prelación legal de créditos', mandatory: true, basis: 'Art. 29' },
      { n: 3, name: 'Resolución de cada objeción presentada', mandatory: true, basis: 'Art. 29' },
      { n: 4, name: 'Determinación de los créditos excluidos y su motivo', mandatory: true, basis: 'Art. 48' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22657'
  },
  {
    id: 'societario/sentencia-de-impugnacion-de-decisiones-sociales',
    exactName: 'Sentencia de impugnación de decisiones sociales',
    branch: 'SOCIETARIO',
    role: 'DESPACHO',
    legalBasis: 'Código de Comercio, arts. 190 y 191; Ley 1564 de 2012, arts. 24 y 382',
    competentAuthority: 'Profiere la sentencia la Superintendencia de Sociedades en ejercicio de funciones jurisdiccionales, cuando la persona jurídica esté sometida a su supervisión (Ley 1564 de 2012, art. 24 num. 5 lit. c), o el juez civil del circuito en primera instancia (art. 20 num. 8); competencia a prevención (art. 24 parágrafo 1). PRECISIÓN QUE FALTABA: la acción indemnizatoria por los perjuicios derivados del acto o decisión que se declaren nulos —la del art. 193 C.Co— es competencia EXCLUSIVA DEL JUEZ y no puede tramitarse ante la Superintendencia (art. 24 num. 5 lit. c, inciso final: \'Con todo, la acción indemnizatoria a que haya lugar por los posibles perjuicios que se deriven del acto o decisión que se declaren nulos será competencia exclusiva del Juez\'). Las apelaciones contra providencias de la Superintendencia en primera instancia las resuelve el superior funcional del juez que habría sido competente (art. 24 parágrafo 3).',
    term: { status: 'VERIFICADO', description: 'DOS (2) MESES PARA IMPUGNAR, contados desde la reunión o desde la inscripción en el registro mercantil si el acto está sujeto a registro (art. 191 C.Co. y art. 382 del CGP). Es lo primero que hay que verificar en la sentencia. UN (1) AÑO PARA LA ACCIÓN DE INDEMNIZACIÓN, Y ESE PLAZO EXTINGUE UN DERECHO DEL CLIENTE: «La acción de indemnización prevista en este artículo SÓLO PODRÁ SER PROPUESTA DENTRO DEL AÑO SIGUIENTE A LA FECHA DE LA EJECUTORIA DE LA SENTENCIA que declare nula la decisión impugnada. La acción podrá ser ejercida por cualquier administrador, por el revisor fiscal o por cualquier asociado en interés de la sociedad» (art. 193 C.Co). Ganar la nulidad y dejar pasar el año es quedarse con la declaración y sin el dinero. CONTRA QUIÉN SE COBRA, y es más amplio de lo que suele pensarse: los perjuicios que sufra la sociedad «LE SERÁN INDEMNIZADOS SOLIDARIAMENTE POR LOS ADMINISTRADORES QUE HAYAN CUMPLIDO LA DECISIÓN, quienes podrán repetir contra los socios que la aprobaron» (art. 193 inc. 1). DEBER QUE LA SENTENCIA ACTIVA DE INMEDIATO EN CABEZA DE LOS ADMINISTRADORES (art. 192 C.Co): declarada la nulidad, deben tomar —bajo su propia responsabilidad por los perjuicios que ocasione su negligencia— las medidas necesarias para que se cumpla la sentencia, y si se trata de decisiones inscritas en el registro mercantil «SE INSCRIBIRÁ LA PARTE RESOLUTIVA de la sentencia respectiva».' },
    requiredSections: [
      { n: 1, name: 'Verificación de la legitimación del impugnante', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 2, name: 'Verificación del término de dos (2) meses', mandatory: true, basis: 'Art. 191 C.Co' },
      { n: 3, name: 'Análisis de la conformidad de la decisión con la ley y los estatutos', mandatory: true, basis: 'Art. 190 C.Co' },
      { n: 4, name: 'Decisión sobre la nulidad o ineficacia de la decisión impugnada', mandatory: true, basis: 'Art. 190 C.Co' },
      { n: 5, name: 'Orden de inscripción de la decisión en el registro mercantil', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr005.html#193'
  },
  {
    id: 'societario/sentencia-de-desestimacion-de-la-personalidad-juridica',
    exactName: 'Sentencia de desestimación de la personalidad jurídica',
    branch: 'SOCIETARIO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1258 de 2008, art. 42; Ley 1564 de 2012, art. 24',
    competentAuthority: 'Superintendencia de Sociedades',
    term: { status: 'NO_CADUCA', description: 'El artículo 42 no fija término de caducidad de la acción ni plazo legal para proferir la sentencia: no opera caducidad. El asunto se tramita por proceso verbal sumario ante la Superintendencia de Sociedades (Ley 1258 de 2008, art. 42), en el que, en firme el auto admisorio y vencido el traslado de la demanda, el juez practica en una sola audiencia las actuaciones de los artículos 372 y 373 del CGP (Ley 1564 de 2012, art. 392).' },
    requiredSections: [
      { n: 1, name: 'Análisis del uso de la sociedad en fraude a la ley o en perjuicio de terceros', mandatory: true, basis: 'Art. 42' },
      { n: 2, name: 'Declaratoria de nulidad de los actos defraudatorios', mandatory: true, basis: 'Art. 42' },
      { n: 3, name: 'Declaración de responsabilidad solidaria de accionistas y administradores', mandatory: true, basis: 'Art. 42' },
      { n: 4, name: 'Liquidación de los perjuicios causados', mandatory: true, basis: 'Art. 42' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=34130'
  },
  {
    id: 'societario/formulario-de-inscripcion-inicial-de-garantia-mobiliaria',
    exactName: 'Formulario de inscripción inicial de garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 21 (oponibilidad por inscripción), 38 a 43 (registro), 48 (prelación) y 44 (tarifas); Decreto 1074 de 2015, arts. 2.2.2.4.1.6 (requisitos previos), 2.2.2.4.1.10, 2.2.2.4.1.12 (inscripción antes del contrato) y 2.2.2.4.1.17',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado de manera centralizada por Confecámaras (Ley 1676 de 2013, art. 39 num. 3). NO es autoridad judicial: sus actos «constituyen actos de trámite y en consecuencia no podrán ser objeto de recurso alguno» (Decreto 1074 de 2015, art. 2.2.2.4.1.40). Se tramita por internet, con cuenta de usuario creada previa verificación de identidad.',
    term: { status: 'VERIFICADO', description: 'NO HAY PLAZO PARA INSCRIBIR, PERO EL RELOJ DEL ACREEDOR CORRE CONTRA OTROS ACREEDORES, NO CONTRA UN FUNCIONARIO. La inscripción no tiene término legal, y sin embargo cada día que pasa sin inscribir es prelación que se cede: «La prelación de una garantía mobiliaria sin tenencia del acreedor garantizado sobre bienes en garantía se determina por el momento de su inscripción en el registro» (art. 48). Es decir, el orden lo fija la hora de inscripción, no la fecha del contrato. SE PUEDE INSCRIBIR ANTES DE FIRMAR: el art. 2.2.2.4.1.12 del Decreto 1074 permite la inscripción anticipada al contrato de garantía, que es la forma de asegurar el puesto en la fila mientras se negocia. LA INSCRIPCIÓN VENCE: su vigencia es la que se indique en el documento de garantía y, si no se indica, CINCO (5) AÑOS (art. 42) — ver la ficha de prórroga, porque nadie avisa. COSTO: la tarifa la fija el MinCIT por resolución a favor de Confecámaras (art. 44); en 2026, $56.000 antes de IVA para la inscripción inicial. Las consultas al archivo son gratuitas.' },
    requiredSections: [
      { n: 1, name: 'Identificación del garante y del acreedor garantizado, con su documento de identidad', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 1' },
      { n: 2, name: 'Monto máximo cubierto por la garantía mobiliaria', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 2' },
      { n: 3, name: 'Descripción genérica o específica de los bienes dados en garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 3' },
      { n: 4, name: 'Descripción de las obligaciones garantizadas', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 4' },
      { n: 5, name: 'Vigencia que se le da a la inscripción; a falta de indicación son cinco (5) años', mandatory: false, basis: 'Ley 1676 de 2013, art. 42' },
      { n: 6, name: 'Comprobante del pago de los derechos de registro', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/formulario-de-prorroga-de-la-inscripcion-de-la-garantia-mobiliaria',
    exactName: 'Formulario de prórroga de la inscripción de la garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 42 (vigencia y prórroga) y 48 (prelación por el momento de la inscripción); Decreto 1074 de 2015, art. 2.2.2.4.1.11 num. 2',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado por Confecámaras (Ley 1676 de 2013, art. 39 num. 3)',
    term: { status: 'VERIFICADO', description: 'EL RELOJ DEL CLIENTE, Y EL PEOR DE TODO ESTE RÉGIMEN PORQUE NADIE LO NOTIFICA: HAY QUE PRORROGAR ANTES DE QUE VENZA LA VIGENCIA INSCRITA. El art. 42 fija la duración: «La inscripción en el registro tendrá vigencia por el plazo que se indique en el documento de garantía, prorrogable por periodos de tres años. En el evento de no especificarse al momento de constituir la garantía este será de cinco (5) años». Y el reglamento fija el cuándo, que es lo que la ley calla: «esta prórroga deberá especificarse en un formulario de modificación EN CUALQUIER MOMENTO ANTES DE LA EXPIRACIÓN DE LA VIGENCIA establecida en el formulario de inscripción inicial, por periodos de hasta tres (3) años» (Decreto 1074 de 2015, art. 2.2.2.4.1.11 num. 2). QUÉ SE PIERDE SI SE DEJA VENCER: no hay requerimiento, ni auto, ni traslado que avise. Vencida la inscripción se pierde la oponibilidad frente a terceros, y con ella la prelación del art. 48, que se determina «por el momento de su inscripción en el registro»: una inscripción nueva entra con fecha nueva, detrás de todo acreedor que se haya inscrito entre tanto. Con el plazo supletivo de cinco años, la garantía suele vencer en el mandato de un abogado distinto del que la constituyó. COSTO: la prórroga NO tiene formulario tarifado propio; se tramita con el formulario de modificación, $15.000 antes de IVA en 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del formulario de inscripción inicial que se prorroga', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.11' },
      { n: 2, name: 'Periodo de prórroga solicitado, que no puede exceder de tres (3) años', mandatory: true, basis: 'Ley 1676 de 2013, art. 42; Decreto 1074 de 2015, art. 2.2.2.4.1.11 num. 2' },
      { n: 3, name: 'Constancia de presentación antes de la expiración de la vigencia inscrita', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.11 num. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/formulario-de-modificacion-de-la-inscripcion-de-la-garantia-mobiliaria',
    exactName: 'Formulario de modificación de la inscripción de la garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 40; Decreto 1074 de 2015, art. 2.2.2.4.1.23',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado por Confecámaras (Ley 1676 de 2013, art. 39 num. 3)',
    term: { status: 'VERIFICADO', description: 'NO HAY PLAZO LEGAL, PERO LO AÑADIDO NO RETROACTÚA Y ESO ES LO QUE HAY QUE SABER ANTES DE DEMORARLO. Cuando la modificación agrega bienes en garantía o un garante nuevo, «será válida respecto de los nuevos bienes en garantía y el garante adicionado, SOLAMENTE A PARTIR DE LA HORA Y FECHA DE INSCRIPCIÓN del formulario de registro de modificación» (Decreto 1074 de 2015, art. 2.2.2.4.1.23). Es decir: lo agregado no hereda la prelación de la inscripción inicial, entra en la fila el día que se inscribe. COSTO: $15.000 antes de IVA en 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del formulario de inscripción inicial que se modifica', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.23' },
      { n: 2, name: 'Descripción precisa de la modificación: bienes, garante, monto u obligaciones', mandatory: true, basis: 'Ley 1676 de 2013, art. 40' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/formulario-de-cancelacion-de-la-inscripcion-de-la-garantia-mobiliaria',
    exactName: 'Formulario de cancelación de la inscripción de la garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 19 num. 5 lit. d), 40 inc. 2 y 76; Decreto 1074 de 2015, arts. 2.2.2.4.1.25 y 2.2.2.4.1.26',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado por Confecámaras. La puede presentar indistintamente el acreedor garantizado o el garante (Ley 1676 de 2013, art. 40 inc. 2).',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO LEGAL PARA PRESENTARLA. Lo que sí tiene reloj es la vía para forzarla cuando el acreedor no cancela: pagada la obligación, si el acreedor garantizado no atiende la solicitud «dentro de los quince (15) días siguientes a la petición», el garante puede acudir al notario (art. 76) — ver la ficha «Solicitud de cancelación de la garantía mobiliaria ante notario por renuencia del acreedor», que es la del deudor. COSTO: $15.000 antes de IVA en 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del formulario de inscripción inicial que se cancela', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.25' },
      { n: 2, name: 'Causal de la cancelación, incluida la extinción de la obligación garantizada', mandatory: true, basis: 'Ley 1676 de 2013, art. 19 num. 5 lit. d)' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/formulario-de-transferencia-o-cesion-de-la-garantia-mobiliaria',
    exactName: 'Formulario de transferencia o cesión de la garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 38; Decreto 1074 de 2015, art. 2.2.2.4.2.53',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado por Confecámaras (Ley 1676 de 2013, art. 39 num. 3)',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO LEGAL. La cesión de la obligación garantizada arrastra la garantía, y su inscripción es lo que la hace oponible frente a terceros en los mismos términos del art. 21. Mientras no se inscriba, el cesionario no puede hacer valer la prelación frente a quien consulte el registro. COSTO: $15.000 antes de IVA en 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del acreedor garantizado cedente y del cesionario', mandatory: true, basis: 'Ley 1676 de 2013, art. 38' },
      { n: 2, name: 'Identificación del formulario de inscripción inicial cuya titularidad se transfiere', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.2.53' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/formulario-de-terminacion-de-la-ejecucion-de-la-garantia-mobiliaria',
    exactName: 'Formulario de terminación de la ejecución de la garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.31; Ley 1676 de 2013, arts. 61 y 72',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado por Confecámaras (Ley 1676 de 2013, art. 39 num. 3)',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES, LOS DOS DEL ACREEDOR GARANTIZADO. EL PRIMERO ES UN DEBER SUYO: «En los eventos previstos en los numerales 1, 2, 3 y 4 el acreedor garantizado deberá efectuar la inscripción de la terminación de la ejecución DENTRO DE LOS QUINCE (15) DÍAS siguientes a la fecha del pago del saldo adeudado o de la suscripción del acuerdo de pago» (art. 2.2.2.4.1.31). EL SEGUNDO MATA LA EJECUCIÓN SOLO, SIN QUE NADIE LO PIDA: el numeral 5 del mismo artículo da por terminada la ejecución cuando «No se inicie el procedimiento de ejecución dentro de los TREINTA (30) DÍAS siguientes a la inscripción del formulario de ejecución». Inscribir la ejecución y no arrancarla dentro del mes la deja sin efecto, y hay que volver a empezar. COSTO: $15.000 antes de IVA en 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del formulario de ejecución cuya terminación se inscribe', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.31' },
      { n: 2, name: 'Causal de terminación: pago del saldo, acuerdo de pago u otra de las previstas', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.31' },
      { n: 3, name: 'Constancia de presentación dentro de los quince (15) días siguientes al pago o al acuerdo', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.1.31' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/contrato-de-garantia-mobiliaria',
    exactName: 'Contrato de garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 9 (constitución), 10, 13, 14 (requisitos del contrato), 15 y 17',
    competentAuthority: 'No se radica ante autoridad: es contrato entre el garante y el acreedor garantizado (Ley 1676 de 2013, art. 9). Su oponibilidad frente a terceros nace de la inscripción en el Registro de Garantías Mobiliarias, no de la firma.',
    term: { status: 'VERIFICADO', description: 'NO HAY PLAZO: ES UN CONTRATO Y NO UNA ACTUACIÓN ANTE AUTORIDAD. El término que importa es el de la INSCRIPCIÓN, que es lo que lo hace oponible y fija la prelación (arts. 21 y 48) — ver la ficha del formulario de inscripción inicial. FORMA OBLIGATORIA, y su ausencia es lo que más contratos tumba: «El contrato de garantía debe otorgarse por escrito y debe contener cuando menos: 1. Nombres, identificación y firmas de los contratantes. 2. El monto máximo cubierto por la garantía mobiliaria. 3. La descripción genérica o específica de los bienes dados en garantía. 4. Una descripción de las obligaciones garantizadas» (art. 14).' },
    requiredSections: [
      { n: 1, name: 'Nombres, identificación y firmas de los contratantes', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 1' },
      { n: 2, name: 'Monto máximo cubierto por la garantía mobiliaria', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 2' },
      { n: 3, name: 'Descripción genérica o específica de los bienes dados en garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 3' },
      { n: 4, name: 'Descripción de las obligaciones garantizadas', mandatory: true, basis: 'Ley 1676 de 2013, art. 14 num. 4' },
      { n: 5, name: 'Cláusula sobre la tenencia de los bienes y las obligaciones del garante que los conserva', mandatory: false, basis: 'Ley 1676 de 2013, art. 17' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/contrato-de-garantia-mobiliaria-prioritaria-de-adquisicion',
    exactName: 'Contrato de garantía mobiliaria prioritaria de adquisición',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 22 (constitución y deber de notificar), 43 y 54 (prelación excepcional); Decreto 1074 de 2015, art. 2.2.2.4.1.18',
    competentAuthority: 'Contrato entre garante y acreedor, con inscripción en el Registro de Garantías Mobiliarias (Confecámaras) y notificación privada a los acreedores precedentes',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN DÍAS, PERO CON UNA CARGA QUE DECIDE LA PRELACIÓN Y ES DEL ACREEDOR NUEVO. Esta garantía existe para ganarle el puesto a acreedores ya inscritos, y ese privilegio se pierde si no se avisa: «Cuando se otorgue esta garantía sobre bienes del inventario, el acreedor beneficiario de la garantía DEBERÁ NOTIFICAR a los acreedores precedentes con las garantías mobiliarias registradas anteriormente que puedan verse perjudicados por su prelación excepcional» (art. 22 inc. 2). Sin esa notificación no se gana la prelación excepcional del art. 54, y la garantía queda como una ordinaria, en la fila por fecha de inscripción.' },
    requiredSections: [
      { n: 1, name: 'Los cuatro requisitos del contrato de garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 14' },
      { n: 2, name: 'Constancia de que el crédito se destinó a adquirir el bien dado en garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 22' },
      { n: 3, name: 'Notificación a los acreedores precedentes inscritos, cuando la garantía recae sobre inventario', mandatory: true, basis: 'Ley 1676 de 2013, art. 22 inc. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'societario/inscripcion-del-formulario-de-ejecucion-concursal-de-la-garantia-mobiliaria',
    exactName: 'Inscripción del formulario de ejecución concursal de la garantía mobiliaria',
    branch: 'SOCIETARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1074 de 2015, art. 2.2.2.4.2.58; Ley 1676 de 2013, arts. 21 y 48; Ley 1116 de 2006',
    competentAuthority: 'Registro de Garantías Mobiliarias, llevado por Confecámaras. Lo inscribe el representante legal del deudor o el liquidador al iniciarse el proceso de insolvencia, no el acreedor.',
    term: { status: 'VERIFICADO', description: 'EL RELOJ MÁS BRUTAL DEL RÉGIMEN, PORQUE ES DEL ACREEDOR GARANTIZADO Y LO DISPARA UN TERCERO SIN AVISARLE. Quien tenía garantía constituida y NO la había inscrito la pierde como garantía en cuanto el concurso se inscribe: «Los acreedores garantizados con garantías mobiliarias constituidas con anterioridad al inicio del proceso de insolvencia que, teniendo la obligación de inscribir la garantía para efectos de oponibilidad y prelación, la inscriban con posterioridad a la inscripción del proceso de insolvencia, TENDRÁN EL TRATAMIENTO DE ACREEDORES QUIROGRAFARIOS en dicho proceso» (art. 2.2.2.4.2.58). No hay plazo que cumplir: hay una carrera que se pierde el día que el deudor o el liquidador inscriben el concurso. CONSECUENCIA PRÁCTICA: una garantía sin inscribir vale lo mismo que ninguna frente a la masa. COSTO: $56.000 antes de IVA en 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor y del proceso de insolvencia que se inicia', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.2.58' },
      { n: 2, name: 'Identificación de las garantías mobiliarias inscritas sobre bienes del deudor', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.2.58' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  }
  ]
};
