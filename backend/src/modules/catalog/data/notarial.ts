import type { BranchCatalog } from '../types';

/**
 * NOTARIAL catalogue.
 *
 * Generated from research/actuaciones-notarial.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const NOTARIAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'NOTARIAL',
    verifiedAt: '2026-08-12',
    sourceOfTruth: 'Decreto Ley 960 de 1970 (Estatuto del Notariado); Ley 1579 de 2012 (Estatuto de Registro de Instrumentos Públicos); Decreto 902 de 1988 (liquidación de herencias ante notario); Decreto 4436 de 2005 y Ley 962 de 2005 (divorcio ante notario); Ley 1183 de 2008; Ley 1996 de 2019. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'LA VÍA NOTARIAL SÓLO OPERA POR MUTUO ACUERDO. El divorcio, la liquidación de herencias y la de sociedad conyugal ante notario exigen acuerdo total de todos los interesados. Basta la oposición de uno para que el trámite deba adelantarse ante juez, por la vía de la rama FAMILIA o CIVIL. Verifique el acuerdo antes de escoger la vía: el trámite notarial iniciado sin él se pierde.',
    'DESISTIMIENTO TÁCITO A LOS DOS MESES. Tanto en el divorcio notarial (Decreto 4436 de 2005) como en la liquidación de herencia (Decreto 902 de 1988), si transcurren dos (2) meses desde que la escritura quedó a disposición de los interesados sin que concurran a otorgarla, se entiende que desistieron y el notario termina la actuación. Es un plazo que se vence por inacción, sin notificación previa.',
    'Términos para interponer los recursos de reposición y apelación contra los actos de registro: el art. 60 de la Ley 1579 de 2012 los establece pero remite al CPACA para los plazos. Esos términos están en la rama ADMINISTRATIVO, no aquí, y por eso figuran sin verificar en estas entradas.',
    'Términos del trámite de insolvencia de persona natural no comerciante ante notario o centro de conciliación (arts. 531 y siguientes del CGP): no verificados. La estructura judicial está en la rama CIVIL.',
    'Los derechos notariales y de registro se fijan por resolución anual de la Superintendencia de Notariado y Registro; este catálogo no cubre tarifas.',
    'El registro civil de las personas (Decreto 1260 de 1970) sólo está cubierto en lo relativo a su corrección; el resto de sus trámites no está catalogado.'
    ]
  },
  actuaciones: [
  {
    id: 'notarial/solicitud-de-divorcio-ante-notario-por-mutuo-acuerdo',
    exactName: 'Solicitud de divorcio ante notario por mutuo acuerdo',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 962 de 2005, art. 34; Decreto 4436 de 2005',
    competentAuthority: 'Notario del círculo que escojan los interesados; se formaliza mediante escritura pública',
    term: { status: 'VERIFICADO', description: 'Cuando hay hijos menores, el Defensor de Familia debe emitir su concepto dentro de los quince (15) días siguientes a la notificación. Si transcurren dos (2) meses desde que el instrumento quedó a disposición de los cónyuges sin que concurran a su otorgamiento, se entiende que desistieron de la solicitud (Decreto 4436 de 2005).' },
    requiredSections: [
      { n: 1, name: 'Nombres, cédulas, edad y domicilio de ambos cónyuges', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 2, name: 'Acuerdo firmado por ambos con la manifestación de voluntad de divorciarse', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 3, name: 'Estado de las obligaciones alimentarias entre los cónyuges y de la sociedad conyugal', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 4, name: 'Mención de si existen hijos menores', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 5, name: 'Con hijos menores: cuantía de la obligación alimentaria, custodia, cuidado personal y régimen de visitas', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 6, name: 'Registros civiles de matrimonio y de nacimiento de los hijos', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 7, name: 'Poder a abogado con facultad expresa para firmar la escritura; la petición se presenta por intermedio de abogado', mandatory: true, basis: 'Decreto 4436 de 2005' },
      { n: 8, name: 'Concepto del Defensor de Familia, cuando haya hijos menores', mandatory: true, basis: 'Decreto 4436 de 2005' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=18346'
  },
  {
    id: 'notarial/solicitud-de-liquidacion-de-herencia-ante-notario',
    exactName: 'Solicitud de liquidación de herencia ante notario',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 902 de 1988',
    competentAuthority: 'Notario del círculo correspondiente; procede sólo por acuerdo de todos los herederos',
    term: { status: 'VERIFICADO', description: 'Aceptada la solicitud, el notario ordena el emplazamiento mediante edicto que se fija por diez (10) días en lugar visible de la notaría, se publica en periódico de circulación nacional y se radiodifunde una vez. Transcurridos esos diez (10) días sin oposición y cumplidos los requisitos fiscales, se otorga la escritura. Si pasan dos (2) meses desde que debía otorgarse sin que se firme, se entiende desistida la solicitud (Decreto 902 de 1988).' },
    requiredSections: [
      { n: 1, name: 'Identificación del causante y registro civil de defunción', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 2, name: 'Identificación de todos los herederos y prueba de su vocación hereditaria', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 3, name: 'Manifestación de acuerdo unánime sobre la partición', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 4, name: 'Inventario y avalúo de los bienes relictos', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 5, name: 'Relación de deudas y pasivo de la sucesión', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 6, name: 'Testamento, cuando la sucesión sea testada', mandatory: false, basis: 'Decreto 902 de 1988' },
      { n: 7, name: 'Trabajo de partición y adjudicación propuesto', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 8, name: 'Poder conferido a abogado', mandatory: true, basis: 'Decreto 902 de 1988' }
    ],
    sourceUrl: 'https://www.icbf.gov.co/cargues/avance/compilacion/docs/decreto_0902_1988.htm'
  },
  {
    id: 'notarial/solicitud-de-liquidacion-de-sociedad-conyugal-ante-notario',
    exactName: 'Solicitud de liquidación de sociedad conyugal ante notario',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 902 de 1988; Ley 962 de 2005',
    competentAuthority: 'Notario del círculo que escojan los interesados',
    term: { status: 'VERIFICADO', description: 'Si transcurren dos (2) meses desde que la escritura quedó a disposición sin que los interesados concurran a otorgarla, se entiende desistida la solicitud (Decreto 902 de 1988).' },
    requiredSections: [
      { n: 1, name: 'Identificación de los cónyuges o compañeros permanentes', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 2, name: 'Prueba de la disolución de la sociedad conyugal o patrimonial', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 3, name: 'Inventario y avalúo de los bienes sociales', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 4, name: 'Relación de deudas y recompensas', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 5, name: 'Trabajo de partición acordado por ambos', mandatory: true, basis: 'Decreto 902 de 1988' }
    ],
    sourceUrl: 'https://www.icbf.gov.co/cargues/avance/compilacion/docs/decreto_0902_1988.htm'
  },
  {
    id: 'notarial/solicitud-de-registro-de-instrumento-publico',
    exactName: 'Solicitud de registro de instrumento público',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1579 de 2012, arts. 8, 13 y 27',
    competentAuthority: 'Oficina de Registro de Instrumentos Públicos del círculo donde se ubique el inmueble',
    term: { status: 'VERIFICADO', description: 'El proceso de registro debe cumplirse en un término máximo de cinco (5) días hábiles a partir de su radicación, salvo los actos que vinculen más de diez unidades inmobiliarias, para los cuales se dispone de cinco (5) días hábiles adicionales (art. 27).' },
    requiredSections: [
      { n: 1, name: 'Primera copia de la escritura pública que preste mérito ejecutivo, o copia sustitutiva', mandatory: true, basis: 'Decreto Ley 960 de 1970, art. 81' },
      { n: 2, name: 'Identificación del inmueble y de su matrícula inmobiliaria', mandatory: true, basis: 'Art. 8' },
      { n: 3, name: 'Identificación de las partes del acto que se registra', mandatory: true, basis: 'Art. 8' },
      { n: 4, name: 'Constancia de pago de los derechos de registro y del impuesto de beneficencia', mandatory: true, basis: 'Art. 13' },
      { n: 5, name: 'Constancia de radicación con fecha y turno', mandatory: true, basis: 'Art. 27' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/recurso-de-reposicion-contra-acto-de-registro',
    exactName: 'Recurso de reposición contra acto de registro',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1579 de 2012, art. 60; Ley 1437 de 2011, art. 76',
    competentAuthority: 'Registrador de Instrumentos Públicos que profirió el acto',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del acto de registro o de la nota devolutiva recurrida', mandatory: true, basis: 'Art. 60' },
      { n: 2, name: 'Fecha de notificación del acto', mandatory: true, basis: 'Ley 1437 de 2011, art. 76' },
      { n: 3, name: 'Razones por las cuales el título sí reunía los requisitos de inscripción', mandatory: true, basis: 'Art. 60' },
      { n: 4, name: 'Documentos que subsanan la causal de devolución', mandatory: false, basis: null },
      { n: 5, name: 'Apelación subsidiaria ante el Director del Registro', mandatory: false, basis: 'Art. 60' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/recurso-de-apelacion-contra-acto-de-registro',
    exactName: 'Recurso de apelación contra acto de registro',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1579 de 2012, art. 60; Ley 1437 de 2011, art. 76',
    competentAuthority: 'Director del Registro de la Superintendencia de Notariado y Registro, o el funcionario que haga sus veces',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del acto recurrido y de la decisión de reposición, si la hubo', mandatory: true, basis: 'Art. 60' },
      { n: 2, name: 'Reparos concretos contra la calificación registral', mandatory: true, basis: 'Art. 60' },
      { n: 3, name: 'Fundamento legal de la inscripción pretendida', mandatory: true, basis: 'Art. 60' },
      { n: 4, name: 'Petición de revocatoria de la nota devolutiva y de orden de inscripción', mandatory: true, basis: 'Art. 60' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/solicitud-de-correccion-de-error-en-el-registro',
    exactName: 'Solicitud de corrección de error en el registro',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1579 de 2012, arts. 59 y siguientes',
    competentAuthority: 'Registrador de Instrumentos Públicos',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la matrícula inmobiliaria y de la anotación errada', mandatory: true, basis: 'Art. 59' },
      { n: 2, name: 'Descripción precisa del error: aritmético, de nombre o de transcripción', mandatory: true, basis: 'Art. 59' },
      { n: 3, name: 'Documento que acredita el dato correcto', mandatory: true, basis: 'Art. 59' },
      { n: 4, name: 'Petición de corrección y de expedición del folio corregido', mandatory: true, basis: 'Art. 59' }
    ],
    sourceUrl: 'https://actualicese.com/archivo/ley-1579-de-01-10-2012-parte-ii/'
  },
  {
    id: 'notarial/solicitud-de-certificado-de-tradicion-y-libertad',
    exactName: 'Solicitud de certificado de tradición y libertad',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1579 de 2012, art. 68',
    competentAuthority: 'Oficina de Registro de Instrumentos Públicos',
    term: { status: 'VERIFICADO', description: 'Se expide de manera inmediata en las oficinas sistematizadas; en las demás, dentro de un plazo máximo de un (1) día (art. 68).' },
    requiredSections: [
      { n: 1, name: 'Número de matrícula inmobiliaria del predio', mandatory: true, basis: 'Art. 68' },
      { n: 2, name: 'Identificación del solicitante', mandatory: true, basis: 'Art. 68' },
      { n: 3, name: 'Constancia de pago de los derechos', mandatory: true, basis: 'Art. 68' }
    ],
    sourceUrl: 'https://actualicese.com/archivo/ley-1579-de-01-10-2012-parte-ii/'
  },
  {
    id: 'notarial/solicitud-de-certificado-especial-de-registro',
    exactName: 'Solicitud de certificado especial de registro',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1579 de 2012, art. 69',
    competentAuthority: 'Oficina de Registro de Instrumentos Públicos',
    term: { status: 'VERIFICADO', description: 'Se expide en un plazo máximo de cinco (5) días, una vez esté plenamente operativa la base de datos registral (art. 69).' },
    requiredSections: [
      { n: 1, name: 'Objeto y alcance del certificado especial solicitado', mandatory: true, basis: 'Art. 69' },
      { n: 2, name: 'Identificación del inmueble o de la persona sobre la que versa', mandatory: true, basis: 'Art. 69' },
      { n: 3, name: 'Constancia de pago de los derechos', mandatory: true, basis: 'Art. 69' }
    ],
    sourceUrl: 'https://actualicese.com/archivo/ley-1579-de-01-10-2012-parte-ii/'
  },
  {
    id: 'notarial/escritura-publica-de-compraventa-de-inmueble',
    exactName: 'Escritura pública de compraventa de inmueble',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 960 de 1970, arts. 12 y siguientes; Código Civil, art. 1857',
    competentAuthority: 'Notario del círculo; la tradición se perfecciona con la inscripción en el registro',
    term: { status: 'VERIFICADO', description: 'Otorgada la escritura, el registro debe cumplirse dentro de los cinco (5) días hábiles siguientes a su radicación (Ley 1579 de 2012, art. 27).' },
    requiredSections: [
      { n: 1, name: 'Comparecencia e identificación plena de vendedor y comprador', mandatory: true, basis: 'Decreto Ley 960 de 1970' },
      { n: 2, name: 'Determinación del inmueble: linderos, cabida, matrícula y cédula catastral', mandatory: true, basis: 'Decreto Ley 960 de 1970' },
      { n: 3, name: 'Título de adquisición del vendedor y su registro', mandatory: true, basis: 'Decreto Ley 960 de 1970' },
      { n: 4, name: 'Precio y forma de pago', mandatory: true, basis: 'C.C. art. 1857' },
      { n: 5, name: 'Paz y salvo de impuesto predial y de valorización', mandatory: true, basis: null },
      { n: 6, name: 'Certificado de tradición y libertad vigente', mandatory: true, basis: 'Ley 1579 de 2012, art. 68' },
      { n: 7, name: 'Declaración sobre afectación a vivienda familiar o patrimonio de familia', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/escritura-publica-de-constitucion-de-hipoteca',
    exactName: 'Escritura pública de constitución de hipoteca',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, arts. 2432 y siguientes; Decreto Ley 960 de 1970',
    competentAuthority: 'Notario del círculo; se perfecciona con la inscripción en el registro',
    term: { status: 'VERIFICADO', description: 'El registro debe cumplirse dentro de los cinco (5) días hábiles siguientes a la radicación (Ley 1579 de 2012, art. 27).' },
    requiredSections: [
      { n: 1, name: 'Identificación del constituyente y del acreedor hipotecario', mandatory: true, basis: 'C.C. art. 2432' },
      { n: 2, name: 'Determinación del inmueble gravado con su matrícula', mandatory: true, basis: 'C.C. art. 2432' },
      { n: 3, name: 'Obligación garantizada y su cuantía', mandatory: true, basis: 'C.C. art. 2432' },
      { n: 4, name: 'Grado de la hipoteca y su extensión', mandatory: true, basis: 'C.C. art. 2432' },
      { n: 5, name: 'Certificado de tradición y libertad', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/escritura-publica-de-constitucion-de-patrimonio-de-familia-inembargable',
    exactName: 'Escritura pública de constitución de patrimonio de familia inembargable',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 70 de 1931; Ley 495 de 1999',
    competentAuthority: 'Notario del círculo; se perfecciona con la inscripción en el registro',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los constituyentes y de los beneficiarios', mandatory: true, basis: 'Ley 70 de 1931' },
      { n: 2, name: 'Determinación del inmueble y su matrícula', mandatory: true, basis: 'Ley 70 de 1931' },
      { n: 3, name: 'Avalúo del inmueble dentro del límite legal', mandatory: true, basis: 'Ley 495 de 1999' },
      { n: 4, name: 'Certificado de tradición que acredite ausencia de gravámenes', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/escritura-publica-de-afectacion-a-vivienda-familiar',
    exactName: 'Escritura pública de afectación a vivienda familiar',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 258 de 1996; Ley 854 de 2003',
    competentAuthority: 'Notario del círculo; se perfecciona con la inscripción en el registro',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los cónyuges o compañeros permanentes', mandatory: true, basis: 'Ley 258 de 1996' },
      { n: 2, name: 'Determinación del inmueble destinado a vivienda de la familia', mandatory: true, basis: 'Ley 258 de 1996' },
      { n: 3, name: 'Manifestación de que es el único inmueble destinado a ese fin', mandatory: true, basis: 'Ley 258 de 1996' },
      { n: 4, name: 'Efecto: los actos de disposición requerirán el consentimiento de ambos', mandatory: true, basis: 'Ley 258 de 1996' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/solicitud-de-declaracion-de-posesion-regular-ante-notario',
    exactName: 'Solicitud de declaración de posesión regular ante notario',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1183 de 2008',
    competentAuthority: 'Notario del círculo donde se ubique el inmueble',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del poseedor y del inmueble', mandatory: true, basis: 'Ley 1183 de 2008' },
      { n: 2, name: 'Acreditación de la posesión material, pública y pacífica', mandatory: true, basis: 'Ley 1183 de 2008' },
      { n: 3, name: 'Tiempo de la posesión y actos que la evidencian', mandatory: true, basis: 'Ley 1183 de 2008' },
      { n: 4, name: 'Declaraciones extraprocesales de testigos', mandatory: true, basis: 'Ley 1183 de 2008' },
      { n: 5, name: 'Certificado de tradición del inmueble', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/acuerdo-de-apoyo-formalizado-ante-notario',
    exactName: 'Acuerdo de apoyo formalizado ante notario',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1996 de 2019, arts. 15 y siguientes',
    competentAuthority: 'Notario o conciliador extrajudicial en derecho',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la persona titular del acto jurídico y de las personas de apoyo', mandatory: true, basis: 'Ley 1996 de 2019, art. 15' },
      { n: 2, name: 'Constancia de la voluntad y preferencias del titular', mandatory: true, basis: 'Ley 1996 de 2019, art. 15' },
      { n: 3, name: 'Actos jurídicos concretos para los que se prestan los apoyos', mandatory: true, basis: 'Ley 1996 de 2019, art. 16' },
      { n: 4, name: 'Duración del acuerdo y salvaguardias', mandatory: true, basis: 'Ley 1996 de 2019, art. 17' },
      { n: 5, name: 'Advertencia: la interdicción está prohibida y este acuerdo la reemplaza', mandatory: true, basis: 'Ley 1996 de 2019, art. 53' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=99712'
  },
  {
    id: 'notarial/solicitud-de-correccion-del-registro-civil-ante-notario',
    exactName: 'Solicitud de corrección del registro civil ante notario',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1260 de 1970, arts. 89 a 95',
    competentAuthority: 'Notario encargado del registro civil',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del registro civil y del inscrito', mandatory: true, basis: 'Decreto 1260 de 1970' },
      { n: 2, name: 'Error que se pretende corregir', mandatory: true, basis: 'Decreto 1260 de 1970' },
      { n: 3, name: 'Documentos auténticos que acreditan el dato correcto', mandatory: true, basis: 'Decreto 1260 de 1970' },
      { n: 4, name: 'Advertencia: la corrección se hace por escritura pública cuando altera el estado civil', mandatory: true, basis: 'Decreto 1260 de 1970' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/solicitud-de-matrimonio-civil-ante-notario',
    exactName: 'Solicitud de matrimonio civil ante notario',
    branch: 'NOTARIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 2668 de 1988',
    competentAuthority: 'Notario del círculo del domicilio de la mujer o el que escojan los contrayentes',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de ambos contrayentes con sus registros civiles de nacimiento', mandatory: true, basis: 'Decreto 2668 de 1988' },
      { n: 2, name: 'Manifestación libre de contraer matrimonio', mandatory: true, basis: 'Decreto 2668 de 1988' },
      { n: 3, name: 'Información sobre hijos comunes extramatrimoniales, si los hay', mandatory: true, basis: 'Decreto 2668 de 1988' },
      { n: 4, name: 'Prueba de la disolución y liquidación de vínculos anteriores, cuando existan', mandatory: true, basis: 'Decreto 2668 de 1988' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/edicto-emplazatorio-en-sucesion-notarial',
    exactName: 'Edicto emplazatorio en sucesión notarial',
    branch: 'NOTARIAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 902 de 1988',
    competentAuthority: 'Notario ante quien se adelanta la liquidación',
    term: { status: 'VERIFICADO', description: 'Se fija por diez (10) días en lugar visible de la notaría, se publica en un periódico de circulación nacional y se radiodifunde por una vez en una emisora local si la hay. Transcurridos los diez (10) días sin oposición y cumplidos los requisitos fiscales, se procede a otorgar la escritura (Decreto 902 de 1988).' },
    requiredSections: [
      { n: 1, name: 'Identificación del causante y de la fecha de su fallecimiento', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 2, name: 'Identificación de la notaría y del número de la actuación', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 3, name: 'Emplazamiento a quienes se crean con derecho a intervenir', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 4, name: 'Constancia de fijación por diez (10) días en lugar visible', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 5, name: 'Página del periódico donde se publicó y certificación de la emisora', mandatory: true, basis: 'Decreto 902 de 1988' }
    ],
    sourceUrl: 'https://www.icbf.gov.co/cargues/avance/compilacion/docs/decreto_0902_1988.htm'
  },
  {
    id: 'notarial/escritura-publica-de-liquidacion-de-herencia',
    exactName: 'Escritura pública de liquidación de herencia',
    branch: 'NOTARIAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 902 de 1988',
    competentAuthority: 'Notario ante quien se adelanta la liquidación',
    term: { status: 'VERIFICADO', description: 'Se otorga una vez transcurridos los diez (10) días del edicto sin oposición y cumplidos los requisitos fiscales. Si pasan dos (2) meses desde que debía otorgarse sin que se firme, se entiende desistida la solicitud y el notario termina la actuación dejando constancia (Decreto 902 de 1988).' },
    requiredSections: [
      { n: 1, name: 'Constancia del cumplimiento del emplazamiento y de la ausencia de oposición', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 2, name: 'Constancia del cumplimiento de los requisitos ante la autoridad fiscal', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 3, name: 'Inventario y avalúo definitivos', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 4, name: 'Trabajo de partición y adjudicación a cada heredero', mandatory: true, basis: 'Decreto 902 de 1988' },
      { n: 5, name: 'Orden de registro de las adjudicaciones de bienes sujetos a registro', mandatory: true, basis: 'Ley 1579 de 2012' }
    ],
    sourceUrl: 'https://www.icbf.gov.co/cargues/avance/compilacion/docs/decreto_0902_1988.htm'
  },
  {
    id: 'notarial/nota-devolutiva-de-registro',
    exactName: 'Nota devolutiva de registro',
    branch: 'NOTARIAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1579 de 2012, arts. 16, 27 y 60',
    competentAuthority: 'Registrador de Instrumentos Públicos',
    term: { status: 'VERIFICADO', description: 'Debe proferirse dentro del término máximo de cinco (5) días hábiles del proceso de registro, contados desde la radicación (art. 27).' },
    requiredSections: [
      { n: 1, name: 'Identificación del turno de radicación y del título calificado', mandatory: true, basis: 'Art. 27' },
      { n: 2, name: 'Causal precisa por la cual no procede la inscripción', mandatory: true, basis: 'Art. 16' },
      { n: 3, name: 'Fundamento legal de la devolución', mandatory: true, basis: 'Art. 16' },
      { n: 4, name: 'Indicación de los recursos de reposición y apelación que proceden', mandatory: true, basis: 'Art. 60' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  },
  {
    id: 'notarial/acto-de-inscripcion-en-el-folio-de-matricula-inmobiliaria',
    exactName: 'Acto de inscripción en el folio de matrícula inmobiliaria',
    branch: 'NOTARIAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1579 de 2012, arts. 8, 26 y 27',
    competentAuthority: 'Registrador de Instrumentos Públicos',
    term: { status: 'VERIFICADO', description: 'El proceso de registro —radicación, calificación, inscripción y constancia— debe cumplirse en máximo cinco (5) días hábiles desde la radicación, con cinco (5) días hábiles adicionales cuando el acto vincule más de diez unidades inmobiliarias (art. 27).' },
    requiredSections: [
      { n: 1, name: 'Constancia de radicación con fecha y turno', mandatory: true, basis: 'Art. 27' },
      { n: 2, name: 'Calificación del título: examen de los requisitos legales para su inscripción', mandatory: true, basis: 'Art. 26' },
      { n: 3, name: 'Anotación en el folio de matrícula inmobiliaria', mandatory: true, basis: 'Art. 8' },
      { n: 4, name: 'Constancia de haberse ejecutado la inscripción', mandatory: true, basis: 'Art. 27' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49731'
  }
  ]
};
