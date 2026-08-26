import type { BranchCatalog } from '../types';

/**
 * SUPERINTENDENCIAS catalogue.
 *
 * Generated from research/actuaciones-superintendencias.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const SUPERINTENDENCIAS_CATALOG: BranchCatalog = {
  meta: {
    branch: 'SUPERINTENDENCIAS',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Ley 1480 de 2011 (Estatuto del Consumidor); Ley 1581 de 2012 (protección de datos personales); Ley 142 de 1994 (servicios públicos domiciliarios); Ley 1122 de 2007, art. 41, modificado por el art. 6 de la Ley 1949 de 2019 (función jurisdiccional de la Supersalud); Ley 1328 de 2009 (consumidor financiero); Ley 1564 de 2012, art. 24. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'EN CONSUMIDOR ES PRESCRIPCIÓN, NO CADUCIDAD. El plazo de un año del art. 58 num. 3 de la Ley 1480 de 2011 es de PRESCRIPCIÓN, según lo ha sostenido la propia SIC. La diferencia decide casos: la prescripción debe ser ALEGADA por quien quiere beneficiarse, es renunciable, se INTERRUMPE con comunicación escrita del acreedor al deudor, y el juez NO puede declararla de oficio. Tratarla como caducidad hace abandonar reclamaciones que siguen vivas.',
    'AGOTAMIENTO PREVIO OBLIGATORIO. Ante la SIC en consumidor debe anexarse la reclamación directa hecha al productor o proveedor; en protección de datos, el titular sólo puede quejarse ante la SIC una vez agotado el trámite de consulta o reclamo ante el responsable o encargado. Presentar sin agotar ese paso conduce al rechazo.',
    'COMPETENCIA A PREVENCIÓN. Las funciones jurisdiccionales de las superintendencias (art. 24 del CGP) no excluyen la de los jueces ordinarios: operan a prevención. La elección de foro cambia el trámite, los recursos y la segunda instancia.',
    'Términos procesales de la función jurisdiccional de la Superintendencia Nacional de Salud: el art. 41 de la Ley 1122 de 2007 fue modificado por el art. 6 de la Ley 1949 de 2019, que redefinió esos plazos, pero no se verificaron aquí. Sí se verificó que la segunda instancia corresponde a la Sala Laboral del Tribunal Superior del domicilio del apelante.',
    'Términos del trámite ante el Defensor del Consumidor Financiero y ante la Superintendencia Financiera en funciones jurisdiccionales: no verificados.',
    'La Superintendencia de Sociedades está catalogada en la rama SOCIETARIO; el cobro coactivo de las superintendencias sigue el procedimiento del Estatuto Tributario, en la rama TRIBUTARIO.',
    'Los procedimientos administrativos sancionatorios de cada superintendencia se rigen por el CPACA y por sus normas especiales; sólo se catalogó su estructura.'
    ]
  },
  actuaciones: [
  {
    id: 'superintendencias/reclamacion-directa-al-productor-o-proveedor',
    exactName: 'Reclamación directa al productor o proveedor',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1480 de 2011, art. 58 num. 5',
    competentAuthority: 'El productor o proveedor; es requisito previo para acudir a la SIC',
    term: { status: 'VERIFICADO', description: 'El productor o proveedor debe dar respuesta dentro de los quince (15) días hábiles siguientes a la recepción de la reclamación (art. 58).' },
    requiredSections: [
      { n: 1, name: 'Identificación del consumidor y del productor o proveedor', mandatory: true, basis: 'Art. 58' },
      { n: 2, name: 'Descripción del bien o servicio y de la falla o incumplimiento', mandatory: true, basis: 'Art. 58' },
      { n: 3, name: 'Petición concreta: reparación, cambio, devolución del dinero o cumplimiento', mandatory: true, basis: 'Art. 11' },
      { n: 4, name: 'Constancia de la reclamación, que puede presentarse por escrito, por teléfono o verbalmente', mandatory: true, basis: 'Art. 58' },
      { n: 5, name: 'Advertencia: esta reclamación debe anexarse a la demanda ante la SIC', mandatory: true, basis: 'Art. 58' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306'
  },
  {
    id: 'superintendencias/demanda-de-proteccion-al-consumidor',
    exactName: 'Demanda de protección al consumidor',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1480 de 2011, art. 58; Ley 1564 de 2012, art. 24',
    competentAuthority: 'Superintendencia de Industria y Comercio en funciones jurisdiccionales, o juez civil; la competencia opera a prevención',
    term: { status: 'VERIFICADO', description: 'Prescripción de un (1) año: las demandas para efectividad de la garantía deben presentarse dentro del año siguiente a la expiración de la garantía; las controversias contractuales dentro del año siguiente a la terminación del contrato; en los demás casos, dentro del año siguiente a que el consumidor tenga conocimiento de los hechos (art. 58 num. 3). Es prescripción y no caducidad: debe alegarse, es renunciable y se interrumpe.' },
    requiredSections: [
      { n: 1, name: 'Identificación del consumidor demandante y del productor o proveedor demandado', mandatory: true, basis: 'Art. 58' },
      { n: 2, name: 'Reclamación directa previa anexada a la demanda', mandatory: true, basis: 'Art. 58 num. 5' },
      { n: 3, name: 'Hechos: descripción del bien o servicio y de la vulneración', mandatory: true, basis: 'Art. 58' },
      { n: 4, name: 'Fecha que determina el inicio del año de prescripción según el supuesto aplicable', mandatory: true, basis: 'Art. 58 num. 3' },
      { n: 5, name: 'Pretensiones y su cuantificación', mandatory: true, basis: 'Art. 58' },
      { n: 6, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 58' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306'
  },
  {
    id: 'superintendencias/solicitud-de-medidas-preventivas-en-proteccion-al-consumidor',
    exactName: 'Solicitud de medidas preventivas en protección al consumidor',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1480 de 2011, art. 58',
    competentAuthority: 'Superintendencia de Industria y Comercio',
    term: { status: 'VERIFICADO', description: 'La suspensión de la producción o comercialización puede ordenarse por sesenta (60) días, prorrogables por otro período igual (art. 58).' },
    requiredSections: [
      { n: 1, name: 'Identificación del bien o servicio cuya comercialización se pretende suspender', mandatory: true, basis: 'Art. 58' },
      { n: 2, name: 'Riesgo para la salud, la vida o la seguridad de los consumidores', mandatory: true, basis: 'Art. 58' },
      { n: 3, name: 'Pruebas sumarias del riesgo', mandatory: true, basis: 'Art. 58' },
      { n: 4, name: 'Medida concreta solicitada y su duración', mandatory: true, basis: 'Art. 58' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306'
  },
  {
    id: 'superintendencias/demanda-por-competencia-desleal',
    exactName: 'Demanda por competencia desleal',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 256 de 1996; Ley 1564 de 2012, art. 24',
    competentAuthority: 'Superintendencia de Industria y Comercio en funciones jurisdiccionales, o juez civil; competencia a prevención',
    term: { status: 'VERIFICADO', description: 'Prescripción de la acción: dos (2) años a partir del momento en que el legitimado tuvo conocimiento de la persona que realizó el acto de competencia desleal y, en todo caso, tres (3) años contados a partir del momento de la realización del acto (Ley 256 de 1996, art. 23). Es doble plazo prescriptivo —subjetivo de dos (2) años y objetivo de tres (3) años— y no caducidad: es prescripción, debe alegarse y no puede declararse de oficio.' },
    requiredSections: [
      { n: 1, name: 'Identificación del demandante y de su participación en el mercado', mandatory: true, basis: 'Ley 256 de 1996, art. 21' },
      { n: 2, name: 'Acto de competencia desleal invocado entre los tipificados', mandatory: true, basis: 'Ley 256 de 1996, arts. 8 a 19' },
      { n: 3, name: 'Hechos que lo configuran y su realización en el mercado', mandatory: true, basis: 'Ley 256 de 1996, art. 2' },
      { n: 4, name: 'Pretensión declarativa y de indemnización de perjuicios', mandatory: true, basis: 'Ley 256 de 1996, art. 20' },
      { n: 5, name: 'Solicitud de medidas cautelares', mandatory: false, basis: 'Ley 256 de 1996, art. 31' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=38871'
  },
  {
    id: 'superintendencias/consulta-sobre-datos-personales',
    exactName: 'Consulta sobre datos personales',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1581 de 2012, art. 14',
    competentAuthority: 'Responsable o encargado del tratamiento de los datos',
    term: { status: 'VERIFICADO', description: 'Debe atenderse en un término máximo de diez (10) días hábiles contados desde su recibo. Si no fuere posible, se informa al interesado y se señala la fecha, que en ningún caso podrá superar los cinco (5) días hábiles siguientes al vencimiento del primer término (art. 14).' },
    requiredSections: [
      { n: 1, name: 'Identificación del titular del dato o de su causahabiente', mandatory: true, basis: 'Art. 14' },
      { n: 2, name: 'Información o dato personal cuya consulta se solicita', mandatory: true, basis: 'Art. 14' },
      { n: 3, name: 'Canal por el que se solicita la respuesta', mandatory: true, basis: 'Art. 14' },
      { n: 4, name: 'Constancia de la fecha de radicación, para el cómputo de los diez (10) días hábiles', mandatory: true, basis: 'Art. 14' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981'
  },
  {
    id: 'superintendencias/reclamo-sobre-datos-personales',
    exactName: 'Reclamo sobre datos personales',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1581 de 2012, art. 15',
    competentAuthority: 'Responsable o encargado del tratamiento de los datos',
    term: { status: 'VERIFICADO', description: 'El término máximo para atender el reclamo es de quince (15) días hábiles contados desde el día siguiente a su recibo. Si no fuere posible, se informan los motivos y la fecha de respuesta, que en ningún caso podrá superar los ocho (8) días hábiles siguientes al vencimiento del primer término (art. 15).' },
    requiredSections: [
      { n: 1, name: 'Identificación del titular o causahabiente', mandatory: true, basis: 'Art. 15' },
      { n: 2, name: 'Descripción de los hechos que dan lugar al reclamo', mandatory: true, basis: 'Art. 15' },
      { n: 3, name: 'Petición concreta: corregir, actualizar o suprimir la información', mandatory: true, basis: 'Art. 15' },
      { n: 4, name: 'Documentos que se quieran hacer valer', mandatory: true, basis: 'Art. 15' },
      { n: 5, name: 'Dirección para notificaciones', mandatory: true, basis: 'Art. 15' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981'
  },
  {
    id: 'superintendencias/queja-ante-la-sic-por-proteccion-de-datos-personales',
    exactName: 'Queja ante la SIC por protección de datos personales',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1581 de 2012, arts. 16, 19 y siguientes',
    competentAuthority: 'Superintendencia de Industria y Comercio, Delegatura para la Protección de Datos Personales',
    term: { status: 'VERIFICADO', description: 'El titular o causahabiente sólo puede elevar queja ante la SIC UNA VEZ AGOTADO el trámite de consulta o reclamo ante el responsable o encargado del tratamiento (art. 16).' },
    requiredSections: [
      { n: 1, name: 'Constancia del agotamiento previo de la consulta o del reclamo', mandatory: true, basis: 'Art. 16' },
      { n: 2, name: 'Identificación del titular y del responsable o encargado', mandatory: true, basis: 'Art. 15' },
      { n: 3, name: 'Hechos que configuran la infracción al régimen de datos', mandatory: true, basis: 'Art. 19' },
      { n: 4, name: 'Prueba de la respuesta recibida o de su ausencia', mandatory: true, basis: 'Art. 16' },
      { n: 5, name: 'Petición de investigación y de imposición de sanciones', mandatory: true, basis: 'Art. 23' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981'
  },
  {
    id: 'superintendencias/recurso-de-reposicion-ante-empresa-de-servicios-publicos',
    exactName: 'Recurso de reposición ante empresa de servicios públicos',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 142 de 1994, arts. 154 y 155',
    competentAuthority: 'La empresa prestadora del servicio público domiciliario',
    term: { status: 'VERIFICADO', description: 'El recurso de reposición contra los actos que resuelven reclamaciones por facturación debe interponerse dentro de los cinco (5) días siguientes a la fecha de conocimiento de la decisión; contra los demás actos que enumera el inciso primero (negativa del contrato, suspensión, terminación y corte) debe hacerse uso de los recursos dentro de los cinco (5) días siguientes a aquel en que la empresa ponga el acto en conocimiento del suscriptor o usuario, en la forma prevista en las condiciones uniformes del contrato (Ley 142 de 1994, art. 154). En ningún caso proceden reclamaciones contra facturas que tuviesen más de cinco (5) meses de haber sido expedidas (art. 154, inc. 3). El término de quince (15) días hábiles para resolver NO está en el art. 154: está en el art. 158 de la Ley 142 de 1994, subrogado por el art. 123 del Decreto 2150 de 1995 (Sentencia C-451 de 1999), conforme al cual toda entidad o persona vigilada por la Superintendencia de Servicios Públicos y prestadora del servicio debe resolver las peticiones, quejas y recursos dentro de quince (15) días hábiles contados desde la fecha de su presentación.' },
    requiredSections: [
      { n: 1, name: 'Identificación del suscriptor o usuario y del contrato de servicios públicos', mandatory: true, basis: 'Art. 154' },
      { n: 2, name: 'Identificación del acto recurrido: negativa del contrato, suspensión, terminación, corte o facturación', mandatory: true, basis: 'Art. 154' },
      { n: 3, name: 'Fecha en que la empresa puso el acto en conocimiento del usuario', mandatory: true, basis: 'Art. 154' },
      { n: 4, name: 'Razones de inconformidad', mandatory: true, basis: 'Art. 154' },
      { n: 5, name: 'Apelación subsidiaria ante la Superintendencia, en los casos en que la ley la consagra', mandatory: false, basis: 'Art. 154' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0142_1994_pr003.html'
  },
  {
    id: 'superintendencias/recurso-de-apelacion-ante-la-superintendencia-de-servicios-publicos',
    exactName: 'Recurso de apelación ante la Superintendencia de Servicios Públicos',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 142 de 1994, arts. 154 y 159',
    competentAuthority: 'Superintendencia de Servicios Públicos Domiciliarios',
    term: { status: 'VERIFICADO', description: 'Procede sólo en los casos en que expresamente lo consagre la ley y debe hacerse uso de él dentro de los cinco (5) días siguientes a aquel en que la empresa ponga el acto en conocimiento del suscriptor o usuario (Ley 142 de 1994, art. 154). Sólo se puede interponer como subsidiario del de reposición ante el gerente o representante legal de la empresa, quien debe remitir el expediente a la Superintendencia de Servicios Públicos Domiciliarios, y se le da el trámite del Código Contencioso Administrativo (art. 159, modificado por el art. 20 de la Ley 689 de 2001). Si en el trámite de la apelación la Superintendencia estima necesario practicar pruebas, el término probatorio no puede ser superior a treinta (30) días hábiles, prorrogables hasta por otro tanto (art. 159).' },
    requiredSections: [
      { n: 1, name: 'Constancia de haber interpuesto la reposición ante la empresa', mandatory: true, basis: 'Art. 154' },
      { n: 2, name: 'Acreditación de que la ley consagra expresamente la apelación para ese acto', mandatory: true, basis: 'Art. 154' },
      { n: 3, name: 'Reparos concretos contra la decisión de la empresa', mandatory: true, basis: 'Art. 154' },
      { n: 4, name: 'Petición de revocatoria', mandatory: true, basis: 'Art. 159' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0142_1994_pr004.html'
  },
  {
    id: 'superintendencias/solicitud-de-silencio-administrativo-positivo-en-servicios-publicos',
    exactName: 'Solicitud de silencio administrativo positivo en servicios públicos',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 142 de 1994, arts. 123, 154 y 158',
    competentAuthority: 'La empresa prestadora; su reconocimiento puede pedirse ante la Superintendencia',
    term: { status: 'VERIFICADO', description: 'Conforme al art. 158 de la Ley 142 de 1994, subrogado por el art. 123 del Decreto 2150 de 1995, toda entidad o persona vigilada por la Superintendencia de Servicios Públicos y prestadora de servicios públicos domiciliarios debe resolver las peticiones, quejas y recursos de los suscriptores o usuarios dentro de quince (15) días hábiles contados a partir de la fecha de su presentación. Vencido ese término -salvo que se demuestre que el suscriptor o usuario auspició la demora o que se requirió la práctica de pruebas- se entiende que la petición, queja o recurso fue resuelto en forma favorable. Dentro de las setenta y dos (72) horas siguientes al vencimiento de los quince (15) días hábiles, el prestador debe reconocer al usuario los efectos del silencio administrativo positivo; si no lo hace, el peticionario puede pedir a la Superintendencia la imposición de sanciones y las decisiones necesarias para hacer efectiva la ejecutoriedad del acto presunto.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la petición, queja o recurso y de su fecha de radicación', mandatory: true, basis: 'Art. 154' },
      { n: 2, name: 'Cómputo de los quince (15) días hábiles sin respuesta', mandatory: true, basis: 'Art. 154' },
      { n: 3, name: 'Constancia de que no se notificó decisión alguna', mandatory: true, basis: 'Art. 158' },
      { n: 4, name: 'Petición de reconocimiento de los efectos del silencio positivo', mandatory: true, basis: 'Art. 158' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_2150_1995_pr002.html'
  },
  {
    id: 'superintendencias/demanda-ante-la-superintendencia-nacional-de-salud',
    exactName: 'Demanda ante la Superintendencia Nacional de Salud',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1122 de 2007, art. 41, modificado por el art. 6 de la Ley 1949 de 2019',
    competentAuthority: 'Superintendencia Nacional de Salud en funciones jurisdiccionales',
    term: { status: 'VERIFICADO', description: 'El art. 41 de la Ley 1122 de 2007, modificado por el art. 6 de la Ley 1949 de 2019, no fija término para presentar la demanda; fija los términos para fallar: la Superintendencia debe dictar sentencia dentro de los veinte (20) días siguientes a la radicación en los asuntos de los literales a), c), d) y e) (cobertura del Plan de Beneficios, multiafiliación, libre elección y movilidad, y servicios no incluidos); dentro de los sesenta (60) días en el literal b) (reconocimientos económicos); y dentro de los ciento veinte (120) días en el literal f) (glosas y devoluciones de facturas). El trámite es sumario, sin formalidades y sin necesidad de apoderado.' },
    requiredSections: [
      { n: 1, name: 'Identificación del afiliado y de la entidad demandada', mandatory: true, basis: 'Art. 41' },
      { n: 2, name: 'Materia sobre la que versa, entre las de competencia jurisdiccional de la Supersalud', mandatory: true, basis: 'Art. 41' },
      { n: 3, name: 'Hechos de la negación o del incumplimiento', mandatory: true, basis: 'Art. 41' },
      { n: 4, name: 'Pretensión concreta y su fundamento en el plan de beneficios', mandatory: true, basis: 'Art. 41' },
      { n: 5, name: 'Pruebas: historia clínica, órdenes médicas y respuestas de la entidad', mandatory: true, basis: 'Art. 41' }
    ],
    sourceUrl: 'https://normograma.supersalud.gov.co/compilacion/docs/ley_1122_2007.htm'
  },
  {
    id: 'superintendencias/recurso-de-apelacion-contra-sentencia-de-la-superintendencia-nacional-de-salud',
    exactName: 'Recurso de apelación contra sentencia de la Superintendencia Nacional de Salud',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1122 de 2007, art. 41, modificado por el art. 6 de la Ley 1949 de 2019',
    competentAuthority: 'Sala Laboral del Tribunal Superior del Distrito Judicial del domicilio del apelante',
    term: { status: 'VERIFICADO', description: 'La sentencia podrá ser apelada dentro de los tres (3) días siguientes a su notificación; concedido el recurso, el expediente se remite al Tribunal Superior del Distrito Judicial - Sala Laboral del domicilio del apelante (art. 41 de la Ley 1122 de 2007, modificado por el art. 6 de la Ley 1949 de 2019).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia apelada y de su notificación', mandatory: true, basis: 'Art. 41' },
      { n: 2, name: 'Determinación del domicilio del apelante, que fija el tribunal competente', mandatory: true, basis: 'Art. 41' },
      { n: 3, name: 'Reparos concretos contra la sentencia', mandatory: true, basis: 'Art. 41' },
      { n: 4, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 41' }
    ],
    sourceUrl: 'https://normograma.supersalud.gov.co/compilacion/docs/ley_1122_2007.htm'
  },
  {
    id: 'superintendencias/queja-ante-el-defensor-del-consumidor-financiero',
    exactName: 'Queja ante el Defensor del Consumidor Financiero',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1328 de 2009, arts. 13 y siguientes',
    competentAuthority: 'Defensor del Consumidor Financiero de la entidad vigilada',
    term: { status: 'NO_VERIFICADO', description: 'La Ley 1328 de 2009 no fija términos: su art. 13, lit. b) remite al procedimiento que se establezca para el efecto. Los términos están en el art. 5 del Decreto 2281 de 2010 (compilado en el Decreto 2555 de 2010, Libro 34): si la queja se presenta en agencias o sucursales de la entidad, esta debe trasladarla al Defensor dentro de los tres (3) días hábiles siguientes a su recepción (num. 1); el Defensor decide si el asunto es de su competencia y comunica la admisión o inadmisión dentro de los tres (3) días hábiles contados desde el día siguiente al recibo de la solicitud (num. 3); si pide información adicional, la entidad o el consumidor deben responder en el término que fije el Defensor, sin exceder ocho (8) días hábiles desde el día siguiente a la solicitud, y recibida la información el Defensor decide sobre la admisión dentro de máximo tres (3) días hábiles (num. 4), entendiéndose desistida la queja si el consumidor no responde (num. 5); admitida la queja, la entidad debe responder el traslado dentro de ocho (8) días hábiles contados desde el día siguiente al traslado, prorrogables a petición de la entidad y a juicio del Defensor (num. 6); y el Defensor debe resolver en un término que en ningún caso puede exceder ocho (8) días hábiles contados desde el día siguiente al vencimiento del traslado a la entidad, comunicando la decisión el día hábil siguiente a su expedición (num. 8). No conoce hechos sucedidos con tres (3) años o más de anterioridad a la presentación de la solicitud, ni asuntos cuya cuantía supere cien (100) SMLMV (Ley 1328 de 2009, art. 14, lits. g e i).' },
    requiredSections: [
      { n: 1, name: 'Identificación del consumidor financiero y de la entidad vigilada', mandatory: true, basis: 'Ley 1328 de 2009, art. 13' },
      { n: 2, name: 'Descripción del producto o servicio financiero', mandatory: true, basis: null },
      { n: 3, name: 'Hechos de la queja y su fecha', mandatory: true, basis: null },
      { n: 4, name: 'Pretensión concreta', mandatory: true, basis: null },
      { n: 5, name: 'Documentos que soportan la reclamación', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=39943'
  },
  {
    id: 'superintendencias/demanda-ante-la-superintendencia-financiera',
    exactName: 'Demanda ante la Superintendencia Financiera',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 24 num. 2',
    competentAuthority: 'Superintendencia Financiera de Colombia en funciones jurisdiccionales; competencia a prevención con los jueces',
    term: { status: 'VERIFICADO', description: 'El art. 24 no fija términos propios: "Las autoridades administrativas tramitarán los procesos a través de las mismas vías procesales previstas en la ley para los jueces" (art. 24 parágrafo 3). Según la cuantía y la naturaleza del asunto, el trámite será verbal —traslado de veinte (20) días para contestar (art. 369)— o verbal sumario de única instancia —diez (10) días para contestar (arts. 390 y 391)—. La competencia es a prevención con los jueces (art. 24 parágrafo 1): la elección del foro corresponde al demandante. Reglas de impugnación que condicionan la elección del foro y que la ficha no publica: las providencias que la Superintendencia dicta en ejercicio de funciones jurisdiccionales NO son impugnables ante la jurisdicción contencioso administrativa; las apelaciones de las dictadas en primera instancia las resuelve el superior funcional del juez que habría sido competente, y si el juez habría conocido en única instancia el asunto ante la Superintendencia también será de única instancia, es decir, sin apelación (art. 24 parágrafo 3). Reloj de la autoridad: el plazo máximo de duración del proceso del art. 121 se aplica a las autoridades administrativas cuando ejercen funciones jurisdiccionales, y al perder competencia deben remitir el expediente inmediatamente a la autoridad judicial desplazada (art. 121 parágrafo). Ante la Superintendencia las partes pueden concurrir sin abogado solo en los casos en que tampoco habría sido necesario ante el juez (art. 24 parágrafo 4).' },
    requiredSections: [
      { n: 1, name: 'Identificación del consumidor financiero y de la entidad vigilada', mandatory: true, basis: 'Art. 24 num. 2' },
      { n: 2, name: 'Acreditación de que la controversia versa sobre la relación de consumo financiero', mandatory: true, basis: 'Art. 24 num. 2' },
      { n: 3, name: 'Hechos y pretensiones', mandatory: true, basis: null },
      { n: 4, name: 'Constancia del trámite previo ante el Defensor del Consumidor Financiero, cuando aplique', mandatory: false, basis: 'Ley 1328 de 2009' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012.html#24'
  },
  {
    id: 'superintendencias/denuncia-administrativa-por-infraccion-al-estatuto-del-consumidor',
    exactName: 'Denuncia administrativa por infracción al Estatuto del Consumidor',
    branch: 'SUPERINTENDENCIAS',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1480 de 2011, arts. 59 a 61',
    competentAuthority: 'Superintendencia de Industria y Comercio en funciones administrativas',
    term: { status: 'VERIFICADO', description: 'La Ley 1480 de 2011 no fija plazo para presentar la denuncia; su art. 60 remite el procedimiento sancionatorio al Código Contencioso Administrativo, hoy Ley 1437 de 2011. Rige por tanto el art. 52 del CPACA: salvo lo dispuesto en leyes especiales, la facultad de imponer sanciones caduca a los tres (3) años de ocurrido el hecho, la conducta u omisión, término dentro del cual el acto que impone la sanción debe haber sido expedido y notificado; si la conducta es continuada, los tres (3) años se cuentan desde el día siguiente a aquel en que cesó la infracción. Denunciar después de ese término es inútil: la SIC ya no puede sancionar.' },
    requiredSections: [
      { n: 1, name: 'Identificación del denunciante y del investigado', mandatory: true, basis: 'Art. 59' },
      { n: 2, name: 'Conducta que infringe las normas de protección al consumidor', mandatory: true, basis: 'Art. 59' },
      { n: 3, name: 'Pruebas de la conducta', mandatory: true, basis: 'Art. 59' },
      { n: 4, name: 'Advertencia: la vía administrativa sanciona pero no indemniza; para eso está la acción jurisdiccional', mandatory: true, basis: 'Arts. 56 y 61' }
    ],
    sourceUrl: 'https://normograma.supersalud.gov.co/compilacion/docs/ley_1437_2011.htm'
  },
  {
    id: 'superintendencias/sentencia-de-proteccion-al-consumidor',
    exactName: 'Sentencia de protección al consumidor',
    branch: 'SUPERINTENDENCIAS',
    role: 'DESPACHO',
    legalBasis: 'Ley 1480 de 2011, art. 58',
    competentAuthority: 'Superintendencia de Industria y Comercio en funciones jurisdiccionales',
    term: { status: 'VERIFICADO', description: 'Debe verificarse la prescripción anual del num. 3, teniendo presente que es prescripción y no caducidad: no puede declararse de oficio (art. 58 num. 3).' },
    requiredSections: [
      { n: 1, name: 'Verificación del agotamiento de la reclamación directa previa', mandatory: true, basis: 'Art. 58 num. 5' },
      { n: 2, name: 'Pronunciamiento sobre la prescripción sólo si fue alegada', mandatory: true, basis: 'Art. 58 num. 3' },
      { n: 3, name: 'Análisis de la garantía legal y de su alcance', mandatory: true, basis: 'Arts. 7 a 11' },
      { n: 4, name: 'Decisión sobre cada pretensión', mandatory: true, basis: 'Art. 58' },
      { n: 5, name: 'Orden de reparación, cambio, devolución del dinero o cumplimiento', mandatory: true, basis: 'Art. 11' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306'
  },
  {
    id: 'superintendencias/acto-de-medidas-preventivas-de-la-superintendencia-de-industria-y-comercio',
    exactName: 'Acto de medidas preventivas de la Superintendencia de Industria y Comercio',
    branch: 'SUPERINTENDENCIAS',
    role: 'DESPACHO',
    legalBasis: 'Ley 1480 de 2011, art. 58',
    competentAuthority: 'Superintendencia de Industria y Comercio',
    term: { status: 'VERIFICADO', description: 'La suspensión de la producción o comercialización se ordena por sesenta (60) días, prorrogables por otro período igual (art. 58).' },
    requiredSections: [
      { n: 1, name: 'Identificación del bien o servicio y del investigado', mandatory: true, basis: 'Art. 58' },
      { n: 2, name: 'Motivación del riesgo para la salud, la vida o la seguridad', mandatory: true, basis: 'Art. 58' },
      { n: 3, name: 'Determinación de la medida y de su duración de sesenta (60) días', mandatory: true, basis: 'Art. 58' },
      { n: 4, name: 'Constancia de la prórroga, cuando se decrete', mandatory: false, basis: 'Art. 58' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306'
  },
  {
    id: 'superintendencias/resolucion-que-resuelve-recurso-en-servicios-publicos',
    exactName: 'Resolución que resuelve recurso en servicios públicos',
    branch: 'SUPERINTENDENCIAS',
    role: 'DESPACHO',
    legalBasis: 'Ley 142 de 1994, arts. 154, 158 y 159',
    competentAuthority: 'La empresa prestadora en reposición; la Superintendencia de Servicios Públicos en apelación',
    term: { status: 'VERIFICADO', description: 'La empresa prestadora debe resolver la petición, queja o recurso dentro de quince (15) días hábiles contados desde la fecha de su presentación; vencido ese término, salvo demora auspiciada por el usuario o práctica de pruebas, se entiende resuelto en forma favorable al usuario, y dentro de las setenta y dos (72) horas siguientes al vencimiento el prestador debe reconocerle los efectos del silencio administrativo positivo (Ley 142 de 1994, art. 158, subrogado por el art. 123 del Decreto 2150 de 1995). Ese término de quince (15) días hábiles y el silencio positivo están referidos por el texto a la entidad o persona vigilada PRESTADORA del servicio; la decisión de la apelación por la Superintendencia de Servicios Públicos se rige por el trámite del Código Contencioso Administrativo al que remite el art. 159 (modificado por el art. 20 de la Ley 689 de 2001), con término probatorio no superior a treinta (30) días hábiles prorrogables hasta por otro tanto.' },
    requiredSections: [
      { n: 1, name: 'Verificación del cumplimiento del término de quince (15) días hábiles', mandatory: true, basis: 'Art. 154' },
      { n: 2, name: 'Pronunciamiento sobre cada razón de inconformidad', mandatory: true, basis: 'Art. 154' },
      { n: 3, name: 'Análisis del contrato de servicios públicos y de la facturación cuestionada', mandatory: true, basis: 'Art. 154' },
      { n: 4, name: 'Decisión: confirma, modifica o revoca', mandatory: true, basis: 'Art. 159' },
      { n: 5, name: 'Advertencia sobre los efectos del silencio positivo si se excedió el término', mandatory: true, basis: 'Art. 158' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_2150_1995_pr002.html'
  },
  {
    id: 'superintendencias/resolucion-sancionatoria-por-infraccion-al-regimen-de-datos-personales',
    exactName: 'Resolución sancionatoria por infracción al régimen de datos personales',
    branch: 'SUPERINTENDENCIAS',
    role: 'DESPACHO',
    legalBasis: 'Ley 1581 de 2012, arts. 22 a 24',
    competentAuthority: 'Superintendencia de Industria y Comercio, Delegatura para la Protección de Datos Personales',
    term: { status: 'VERIFICADO', description: 'La Ley 1581 de 2012 no fija términos procesales: su art. 22 dispone que en lo no reglado se siguen las normas del Código Contencioso Administrativo, hoy Ley 1437 de 2011. Rigen entonces el art. 47 del CPACA —quince (15) días siguientes a la notificación de la formulación de cargos para presentar descargos y pedir pruebas— y el art. 52 —la facultad sancionatoria caduca a los tres (3) años de ocurrido el hecho, la conducta u omisión, dentro de los cuales la resolución sancionatoria debe haber sido expedida y notificada; los recursos deben resolverse dentro de un (1) año desde su interposición oportuna, so pena de que se entiendan fallados a favor del recurrente, y la sanción impuesta prescribe a los cinco (5) años contados desde la ejecutoria.' },
    requiredSections: [
      { n: 1, name: 'Identificación del responsable o encargado investigado', mandatory: true, basis: 'Art. 22' },
      { n: 2, name: 'Conducta infractora y norma vulnerada', mandatory: true, basis: 'Art. 23' },
      { n: 3, name: 'Valoración de los descargos y de las pruebas', mandatory: true, basis: 'Art. 22' },
      { n: 4, name: 'Aplicación de los criterios de graduación de la sanción', mandatory: true, basis: 'Art. 24' },
      { n: 5, name: 'Sanción impuesta: multa, suspensión, cierre temporal o definitivo', mandatory: true, basis: 'Art. 23' }
    ],
    sourceUrl: 'https://normograma.supersalud.gov.co/compilacion/docs/ley_1437_2011.htm'
  },
  {
    id: 'superintendencias/sentencia-de-la-superintendencia-nacional-de-salud',
    exactName: 'Sentencia de la Superintendencia Nacional de Salud',
    branch: 'SUPERINTENDENCIAS',
    role: 'DESPACHO',
    legalBasis: 'Ley 1122 de 2007, art. 41, modificado por el art. 6 de la Ley 1949 de 2019',
    competentAuthority: 'Superintendencia Nacional de Salud en funciones jurisdiccionales',
    term: { status: 'VERIFICADO', description: 'Contra la sentencia procede apelación, cuya segunda instancia corresponde a la Sala Laboral del Tribunal Superior del Distrito Judicial del domicilio del apelante (art. 41).' },
    requiredSections: [
      { n: 1, name: 'Verificación de la competencia jurisdiccional sobre la materia', mandatory: true, basis: 'Art. 41' },
      { n: 2, name: 'Análisis de las pruebas: historia clínica, órdenes médicas y respuestas de la entidad', mandatory: true, basis: 'Art. 41' },
      { n: 3, name: 'Decisión sobre cada pretensión del afiliado', mandatory: true, basis: 'Art. 41' },
      { n: 4, name: 'Órdenes concretas a la entidad y plazos de cumplimiento', mandatory: true, basis: 'Art. 41' },
      { n: 5, name: 'Indicación del recurso de apelación y del tribunal competente', mandatory: true, basis: 'Art. 41' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=90185'
  }
  ]
};
