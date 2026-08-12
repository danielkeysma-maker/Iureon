import type { BranchCatalog } from '../types';

/**
 * PENAL catalogue.
 *
 * Generated from research/actuaciones-penal.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const PENAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'PENAL',
    verifiedAt: '2026-08-12',
    sourceOfTruth: 'Ley 906 de 2004 (Código de Procedimiento Penal, sistema acusatorio), vigente con sus modificaciones; texto consultado el 12 de agosto de 2026. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'NO CONFUNDIR PROYECTOS CON LEY VIGENTE. En julio de 2026 circularon publicaciones que anunciaban la supresión de la audiencia de imputación, la audiencia unificada de acusación y preparatoria, y el fallo escrito. Esas descripciones corresponden a PROYECTOS de reforma entregados el 30 de julio de 2026, no a derecho vigente. Se verificó lo contrario en el texto en vigor: los arts. 175 y 317 siguen contando sus términos desde la formulación de la imputación, de modo que esa audiencia existe. Este catálogo refleja el código vigente, no las reformas propuestas.',
    'COEXISTEN DOS SISTEMAS PROCESALES PENALES. La Ley 906 de 2004 rige las conductas cometidas a partir de su entrada en vigencia gradual; las anteriores siguen bajo la Ley 600 de 2000, con instituciones y términos distintos. Antes de aplicar cualquier término, confirme la fecha de la conducta. Este catálogo cubre únicamente la Ley 906.',
    'El procedimiento abreviado y la figura del acusador privado (Ley 1826 de 2017) tienen términos propios que no se verificaron; solo se cataloga su estructura.',
    'Término para interponer el recurso de apelación: el art. 176 define los recursos ordinarios pero no fija el plazo. Queda sin verificar.',
    'Términos de la acción de revisión, del habeas corpus (Ley 1095 de 2006) y del incidente de reparación integral: no verificados.',
    'La justicia penal militar, la Jurisdicción Especial para la Paz y el sistema de responsabilidad penal para adolescentes se rigen por normas propias y no están cubiertos.'
    ]
  },
  actuaciones: [
  {
    id: 'penal/denuncia-penal',
    exactName: 'Denuncia penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 67 y 69',
    competentAuthority: 'Fiscalía General de la Nación; también policía judicial y autoridades habilitadas para recibirla',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del denunciante y su declaración bajo juramento', mandatory: true, basis: 'Art. 69' },
      { n: 2, name: 'Relato detallado de los hechos, con fecha, hora y lugar', mandatory: true, basis: 'Art. 69' },
      { n: 3, name: 'Identificación o descripción del presunto autor, si se conoce', mandatory: false, basis: 'Art. 69' },
      { n: 4, name: 'Elementos materiales probatorios que se aportan', mandatory: false, basis: 'Art. 69' },
      { n: 5, name: 'Dirección para notificaciones', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/69.htm'
  },
  {
    id: 'penal/querella',
    exactName: 'Querella',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 70 a 74, modificados por la Ley 1826 de 2017',
    competentAuthority: 'Fiscalía General de la Nación',
    term: { status: 'VERIFICADO', description: 'Debe presentarse dentro de los seis (6) meses siguientes a la comisión de la conducta punible. Si por fuerza mayor o caso fortuito comprobados el querellante no tuvo conocimiento, el término corre desde que desaparecen esas circunstancias, sin exceder tampoco los seis meses (art. 73).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la calidad de querellante legítimo', mandatory: true, basis: 'Art. 71' },
      { n: 2, name: 'Relato de los hechos con la fecha de comisión', mandatory: true, basis: 'Art. 73' },
      { n: 3, name: 'Manifestación expresa de querer que se investigue', mandatory: true, basis: 'Art. 70' },
      { n: 4, name: 'Acreditación del requisito de conciliación previa, cuando proceda', mandatory: false, basis: 'Art. 522' },
      { n: 5, name: 'Elementos materiales probatorios disponibles', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/73.htm'
  },
  {
    id: 'penal/solicitud-de-control-de-legalidad-de-la-captura',
    exactName: 'Solicitud de control de legalidad de la captura',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, art. 297; Constitución Política, art. 28',
    competentAuthority: 'Juez de control de garantías',
    term: { status: 'VERIFICADO', description: 'La persona capturada debe ser puesta a disposición del juez de control de garantías en el plazo máximo de treinta y seis (36) horas para la audiencia de control de legalidad (art. 297).' },
    requiredSections: [
      { n: 1, name: 'Identificación del capturado y de la autoridad que ejecutó la captura', mandatory: true, basis: 'Art. 297' },
      { n: 2, name: 'Hora y lugar exactos de la captura', mandatory: true, basis: 'Art. 297' },
      { n: 3, name: 'Verificación de la orden judicial escrita, o de la flagrancia o captura excepcional', mandatory: true, basis: 'Art. 297 par.' },
      { n: 4, name: 'Verificación de la lectura de derechos al capturado', mandatory: true, basis: 'Art. 303' },
      { n: 5, name: 'Petición concreta: legalidad o ilegalidad de la captura y libertad inmediata', mandatory: true, basis: 'Art. 297' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/297.htm'
  },
  {
    id: 'penal/solicitud-de-libertad-por-vencimiento-de-terminos',
    exactName: 'Solicitud de libertad por vencimiento de términos',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, art. 317',
    competentAuthority: 'Juez de control de garantías',
    term: { status: 'VERIFICADO', description: 'Procede cuando transcurren sesenta (60) días desde la imputación sin que se presente el escrito de acusación; ciento veinte (120) días desde la presentación del escrito de acusación sin que se inicie la audiencia de juicio; o ciento cincuenta (150) días desde el inicio del juicio sin audiencia de lectura de fallo. Estos términos se duplican en justicia especializada, con tres o más imputados, o en delitos de corrupción (art. 317).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y de la causal de libertad invocada', mandatory: true, basis: 'Art. 317' },
      { n: 2, name: 'Cómputo del término, contado de manera ininterrumpida desde el acto procesal correspondiente', mandatory: true, basis: 'Art. 317' },
      { n: 3, name: 'Acreditación de que la demora no es atribuible a la defensa', mandatory: true, basis: 'Art. 317' },
      { n: 4, name: 'Verificación de si aplica la duplicación del término', mandatory: true, basis: 'Art. 317' },
      { n: 5, name: 'Petición de libertad inmediata', mandatory: true, basis: 'Art. 317' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/317.htm'
  },
  {
    id: 'penal/solicitud-de-preclusion-de-la-investigacion',
    exactName: 'Solicitud de preclusión de la investigación',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 294, 331 a 334',
    competentAuthority: 'Juez de conocimiento',
    term: { status: 'VERIFICADO', description: 'Cuando el fiscal deja vencer el término del art. 175 pierde competencia; el fiscal que lo reemplaza dispone de sesenta (60) días para decidir, o noventa (90) si hay concurso de delitos, tres o más imputados o competencia de jueces penales especializados. Vencidos, el imputado queda en libertad inmediata y la defensa o el Ministerio Público solicitan la preclusión (art. 294).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y del imputado', mandatory: true, basis: 'Art. 332' },
      { n: 2, name: 'Causal de preclusión invocada', mandatory: true, basis: 'Art. 332' },
      { n: 3, name: 'Hechos y elementos materiales que la sustentan', mandatory: true, basis: 'Art. 332' },
      { n: 4, name: 'Cómputo del término vencido, cuando la causal sea esa', mandatory: true, basis: 'Art. 294' },
      { n: 5, name: 'Petición de preclusión y de cesación de la medida de aseguramiento', mandatory: true, basis: 'Art. 334' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/294.htm'
  },
  {
    id: 'penal/recurso-de-reposicion-penal',
    exactName: 'Recurso de reposición penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, art. 176',
    competentAuthority: 'El mismo juez que adoptó la decisión, en la respectiva audiencia',
    term: { status: 'VERIFICADO', description: 'Salvo la sentencia, procede contra todas las decisiones y se sustenta y resuelve de manera oral e inmediata en la respectiva audiencia (art. 176).' },
    requiredSections: [
      { n: 1, name: 'Interposición oral en la audiencia, inmediatamente después de la decisión', mandatory: true, basis: 'Art. 176' },
      { n: 2, name: 'Sustentación oral de las razones de inconformidad', mandatory: true, basis: 'Art. 176' },
      { n: 3, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 176' },
      { n: 4, name: 'Apelación subsidiaria, cuando la decisión sea apelable', mandatory: false, basis: 'Art. 176' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/176.htm'
  },
  {
    id: 'penal/recurso-de-apelacion-penal',
    exactName: 'Recurso de apelación penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 176 a 179',
    competentAuthority: 'El superior del juez que profirió la decisión',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la decisión apelada: auto adoptado en audiencia o sentencia', mandatory: true, basis: 'Art. 176' },
      { n: 2, name: 'Manifestación expresa de interponer la apelación', mandatory: true, basis: 'Art. 176' },
      { n: 3, name: 'Sustentación: reparos concretos contra la decisión', mandatory: true, basis: 'Art. 179' },
      { n: 4, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 179' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/176.htm'
  },
  {
    id: 'penal/interposicion-del-recurso-de-casacion-penal',
    exactName: 'Interposición del recurso de casación penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 181 y 183',
    competentAuthority: 'Se interpone ante el tribunal; lo resuelve la Sala de Casación Penal de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días siguientes a la última notificación (art. 183).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia de segunda instancia recurrida', mandatory: true, basis: 'Art. 183' },
      { n: 2, name: 'Manifestación de interponer el recurso de casación', mandatory: true, basis: 'Art. 183' },
      { n: 3, name: 'Acreditación de que la sentencia es susceptible del recurso', mandatory: true, basis: 'Art. 181' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/183.htm'
  },
  {
    id: 'penal/demanda-de-casacion-penal',
    exactName: 'Demanda de casación penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 183 y 184',
    competentAuthority: 'Sala de Casación Penal de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días siguientes al vencimiento del término de interposición para presentar la demanda; si no se presenta, el recurso se declara desierto mediante auto que admite reposición (art. 183).' },
    requiredSections: [
      { n: 1, name: 'Identificación de los sujetos procesales y de la sentencia impugnada', mandatory: true, basis: 'Art. 183' },
      { n: 2, name: 'Síntesis de los hechos y de la actuación procesal', mandatory: true, basis: 'Art. 183' },
      { n: 3, name: 'Causal de casación invocada para cada cargo', mandatory: true, basis: 'Art. 181' },
      { n: 4, name: 'Formulación separada de los cargos con su fundamento', mandatory: true, basis: 'Art. 183' },
      { n: 5, name: 'Demostración de la trascendencia del error y de su incidencia en el fallo', mandatory: true, basis: 'Art. 184' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/183.htm'
  },
  {
    id: 'penal/accion-de-revision-penal',
    exactName: 'Acción de revisión penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 192 a 198',
    competentAuthority: 'La Sala de Casación Penal de la Corte Suprema de Justicia o el tribunal, según quién profirió la sentencia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia ejecutoriada que se revisa', mandatory: true, basis: 'Art. 192' },
      { n: 2, name: 'Causal de revisión invocada', mandatory: true, basis: 'Art. 192' },
      { n: 3, name: 'Hechos y pruebas nuevas que la configuran', mandatory: true, basis: 'Art. 194' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 194' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/192.htm'
  },
  {
    id: 'penal/solicitud-de-nulidad-procesal-penal',
    exactName: 'Solicitud de nulidad procesal penal',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 455 a 458',
    competentAuthority: 'El juez que conoce de la actuación',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Causal de nulidad invocada', mandatory: true, basis: 'Art. 457' },
      { n: 2, name: 'Identificación del acto procesal afectado', mandatory: true, basis: 'Art. 457' },
      { n: 3, name: 'Demostración de la afectación sustancial al debido proceso o al derecho de defensa', mandatory: true, basis: 'Art. 457' },
      { n: 4, name: 'Petición de invalidez y de rehacer la actuación', mandatory: true, basis: 'Art. 457' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/457.htm'
  },
  {
    id: 'penal/solicitud-de-sustitucion-de-la-detencion-preventiva',
    exactName: 'Solicitud de sustitución de la detención preventiva',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, art. 314',
    competentAuthority: 'Juez de control de garantías',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida de aseguramiento vigente', mandatory: true, basis: 'Art. 314' },
      { n: 2, name: 'Causal de sustitución invocada', mandatory: true, basis: 'Art. 314' },
      { n: 3, name: 'Prueba de la circunstancia alegada: enfermedad grave, edad, maternidad o cabeza de familia', mandatory: true, basis: 'Art. 314' },
      { n: 4, name: 'Ofrecimiento de caución y compromiso de comparecencia', mandatory: false, basis: 'Art. 314' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/314.htm'
  },
  {
    id: 'penal/solicitud-de-preacuerdo-o-negociacion-con-la-fiscalia',
    exactName: 'Solicitud de preacuerdo o negociación con la Fiscalía',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 348 a 354',
    competentAuthority: 'Se acuerda con la Fiscalía y lo aprueba el juez de conocimiento',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del imputado o acusado y de los cargos', mandatory: true, basis: 'Art. 350' },
      { n: 2, name: 'Términos del preacuerdo: cargos aceptados y rebaja convenida', mandatory: true, basis: 'Arts. 350 y 351' },
      { n: 3, name: 'Manifestación libre, voluntaria e informada del imputado', mandatory: true, basis: 'Art. 354' },
      { n: 4, name: 'Pronunciamiento sobre la reparación a las víctimas', mandatory: true, basis: 'Art. 351' },
      { n: 5, name: 'Solicitud de aprobación al juez de conocimiento', mandatory: true, basis: 'Art. 351' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/350.htm'
  },
  {
    id: 'penal/solicitud-de-aplicacion-del-principio-de-oportunidad',
    exactName: 'Solicitud de aplicación del principio de oportunidad',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 321 a 330',
    competentAuthority: 'La Fiscalía lo aplica; el juez de control de garantías ejerce el control de legalidad',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y del imputado', mandatory: true, basis: 'Art. 324' },
      { n: 2, name: 'Causal de aplicación invocada entre las taxativas', mandatory: true, basis: 'Art. 324' },
      { n: 3, name: 'Hechos y elementos que la sustentan', mandatory: true, basis: 'Art. 327' },
      { n: 4, name: 'Pronunciamiento sobre los derechos de las víctimas', mandatory: true, basis: 'Art. 328' },
      { n: 5, name: 'Modalidad solicitada: suspensión, interrupción o renuncia de la acción penal', mandatory: true, basis: 'Art. 323' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/324.htm'
  },
  {
    id: 'penal/solicitud-de-habeas-corpus',
    exactName: 'Solicitud de habeas corpus',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Constitución Política, art. 30; Ley 1095 de 2006',
    competentAuthority: 'Cualquier juez o tribunal del lugar donde se encuentre la persona privada de la libertad',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la persona privada de la libertad', mandatory: true, basis: 'Ley 1095 de 2006' },
      { n: 2, name: 'Lugar de reclusión y autoridad que ordenó o mantiene la privación', mandatory: true, basis: 'Ley 1095 de 2006' },
      { n: 3, name: 'Hechos que configuran la privación ilegal o su prolongación indebida', mandatory: true, basis: 'Ley 1095 de 2006' },
      { n: 4, name: 'Petición de libertad inmediata', mandatory: true, basis: 'C.P. art. 30' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/297.htm'
  },
  {
    id: 'penal/descubrimiento-probatorio-de-la-defensa',
    exactName: 'Descubrimiento probatorio de la defensa',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 344 a 347',
    competentAuthority: 'Ante el juez de conocimiento, en audiencia preparatoria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Relación de los elementos materiales probatorios y evidencia física', mandatory: true, basis: 'Art. 344' },
      { n: 2, name: 'Relación de los testigos y peritos que se pretende hacer comparecer', mandatory: true, basis: 'Art. 344' },
      { n: 3, name: 'Puesta a disposición de la contraparte para su examen', mandatory: true, basis: 'Art. 344' },
      { n: 4, name: 'Advertencia de que lo no descubierto no podrá aducirse en el juicio', mandatory: true, basis: 'Art. 346' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/344.htm'
  },
  {
    id: 'penal/alegatos-de-conclusion-en-juicio-oral',
    exactName: 'Alegatos de conclusión en juicio oral',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, art. 443',
    competentAuthority: 'Juez de conocimiento, en el juicio oral',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Síntesis de la teoría del caso sostenida', mandatory: true, basis: 'Art. 443' },
      { n: 2, name: 'Análisis de la prueba efectivamente practicada en el juicio', mandatory: true, basis: 'Art. 443' },
      { n: 3, name: 'Confrontación con la teoría del caso de la contraparte', mandatory: true, basis: 'Art. 443' },
      { n: 4, name: 'Petición concreta de condena o absolución', mandatory: true, basis: 'Art. 443' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/443.htm'
  },
  {
    id: 'penal/solicitud-de-incidente-de-reparacion-integral',
    exactName: 'Solicitud de incidente de reparación integral',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 102 a 108',
    competentAuthority: 'Juez de conocimiento que profirió el fallo',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Acreditación de la calidad de víctima', mandatory: true, basis: 'Art. 102' },
      { n: 2, name: 'Identificación de la sentencia condenatoria en firme', mandatory: true, basis: 'Art. 102' },
      { n: 3, name: 'Pretensiones de reparación: daño emergente, lucro cesante y perjuicios morales', mandatory: true, basis: 'Art. 103' },
      { n: 4, name: 'Pruebas del daño y de su cuantía', mandatory: true, basis: 'Art. 103' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/102.htm'
  },
  {
    id: 'penal/escrito-de-acusacion-del-acusador-privado',
    exactName: 'Escrito de acusación del acusador privado',
    branch: 'PENAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1826 de 2017; Ley 906 de 2004, arts. 336 y 337',
    competentAuthority: 'Juez de conocimiento, en el procedimiento especial abreviado',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Acreditación de la conversión de la acción penal y de la calidad de acusador privado', mandatory: true, basis: 'Ley 1826 de 2017' },
      { n: 2, name: 'Individualización del acusado', mandatory: true, basis: 'Art. 337 num. 1' },
      { n: 3, name: 'Relación clara y sucinta de los hechos jurídicamente relevantes', mandatory: true, basis: 'Art. 337 num. 2' },
      { n: 4, name: 'Relación de los bienes afectados con fines de comiso', mandatory: false, basis: 'Art. 337 num. 3' },
      { n: 5, name: 'Descubrimiento de los elementos materiales probatorios', mandatory: true, basis: 'Art. 337 num. 5' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/337.htm'
  },
  {
    id: 'penal/escrito-de-acusacion',
    exactName: 'Escrito de acusación',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 175, 336 y 337',
    competentAuthority: 'Fiscalía General de la Nación; se radica ante el juez de conocimiento',
    term: { status: 'VERIFICADO', description: 'La Fiscalía dispone de noventa (90) días contados desde el día siguiente a la formulación de la imputación para presentar el escrito de acusación o solicitar la preclusión. El término es de ciento veinte (120) días cuando hay concurso de delitos, tres o más imputados, o delitos de competencia de jueces penales especializados (art. 175).' },
    requiredSections: [
      { n: 1, name: 'Individualización concreta de los acusados, con nombre y datos que sirvan para identificarlos', mandatory: true, basis: 'Art. 337 num. 1' },
      { n: 2, name: 'Relación clara y sucinta de los hechos jurídicamente relevantes, en lenguaje comprensible', mandatory: true, basis: 'Art. 337 num. 2' },
      { n: 3, name: 'Relación de los bienes y recursos afectados con fines de comiso', mandatory: false, basis: 'Art. 337 num. 3' },
      { n: 4, name: 'Descubrimiento de las pruebas: hechos que no requieren prueba', mandatory: true, basis: 'Art. 337 num. 4' },
      { n: 5, name: 'Descubrimiento de los elementos materiales probatorios y evidencia física', mandatory: true, basis: 'Art. 337 num. 5' },
      { n: 6, name: 'Calificación jurídica de la conducta', mandatory: true, basis: 'Art. 337' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/175.htm'
  },
  {
    id: 'penal/formulacion-de-imputacion',
    exactName: 'Formulación de imputación',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 286 a 288',
    competentAuthority: 'Fiscalía General de la Nación, ante el juez de control de garantías',
    term: { status: 'VERIFICADO', description: 'Desde su formulación corren los términos del art. 175 para acusar o precluir, y los del art. 317 para la libertad por vencimiento de términos.' },
    requiredSections: [
      { n: 1, name: 'Individualización concreta del imputado', mandatory: true, basis: 'Art. 288 num. 1' },
      { n: 2, name: 'Relación clara y sucinta de los hechos jurídicamente relevantes, en lenguaje comprensible', mandatory: true, basis: 'Art. 288 num. 2' },
      { n: 3, name: 'Advertencia sobre la posibilidad de allanarse a la imputación y de negociar', mandatory: true, basis: 'Art. 288 num. 3' },
      { n: 4, name: 'Constancia de que no se descubren elementos materiales probatorios en esta audiencia', mandatory: true, basis: 'Art. 288' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/288.htm'
  },
  {
    id: 'penal/solicitud-de-medida-de-aseguramiento',
    exactName: 'Solicitud de medida de aseguramiento',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 306 a 313',
    competentAuthority: 'Fiscalía o Ministerio Público ante el juez de control de garantías',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Inferencia razonable de autoría o participación, con los elementos que la sustentan', mandatory: true, basis: 'Art. 308' },
      { n: 2, name: 'Demostración del fin constitucional: obstrucción, peligro para la comunidad o para la víctima, o no comparecencia', mandatory: true, basis: 'Art. 308' },
      { n: 3, name: 'Juicio de necesidad, adecuación, proporcionalidad y razonabilidad', mandatory: true, basis: 'Art. 308' },
      { n: 4, name: 'Medida concreta solicitada: privativa o no privativa de la libertad', mandatory: true, basis: 'Arts. 307 y 308' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/308.htm'
  },
  {
    id: 'penal/auto-de-control-de-legalidad-de-la-captura',
    exactName: 'Auto de control de legalidad de la captura',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 297, 302 y 303',
    competentAuthority: 'Juez de control de garantías',
    term: { status: 'VERIFICADO', description: 'Debe realizarse dentro de las treinta y seis (36) horas siguientes a la captura (art. 297).' },
    requiredSections: [
      { n: 1, name: 'Verificación del cumplimiento del término de treinta y seis (36) horas', mandatory: true, basis: 'Art. 297' },
      { n: 2, name: 'Verificación de la orden judicial escrita o de la flagrancia', mandatory: true, basis: 'Arts. 297 y 301' },
      { n: 3, name: 'Verificación de la lectura de derechos al capturado', mandatory: true, basis: 'Art. 303' },
      { n: 4, name: 'Declaración de legalidad o ilegalidad de la captura', mandatory: true, basis: 'Art. 297' },
      { n: 5, name: 'Orden de libertad inmediata cuando la captura sea ilegal', mandatory: true, basis: 'Art. 297' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/297.htm'
  },
  {
    id: 'penal/auto-de-preclusion',
    exactName: 'Auto de preclusión',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 331 a 335',
    competentAuthority: 'Juez de conocimiento',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la causal de preclusión acreditada', mandatory: true, basis: 'Art. 332' },
      { n: 2, name: 'Análisis de los elementos materiales probatorios', mandatory: true, basis: 'Art. 333' },
      { n: 3, name: 'Pronunciamiento sobre la intervención de las víctimas', mandatory: true, basis: 'Art. 333' },
      { n: 4, name: 'Cesación de la medida de aseguramiento y de las cautelares', mandatory: true, basis: 'Art. 334' },
      { n: 5, name: 'Efecto de cosa juzgada de la decisión', mandatory: true, basis: 'Art. 334' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/334.htm'
  },
  {
    id: 'penal/sentencia-penal-condenatoria',
    exactName: 'Sentencia penal condenatoria',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 446 a 448',
    competentAuthority: 'Juez de conocimiento',
    term: { status: 'VERIFICADO', description: 'Si transcurren ciento cincuenta (150) días desde el inicio de la audiencia de juicio sin que se celebre la audiencia de lectura de fallo, procede la libertad por vencimiento de términos (art. 317 num. 6).' },
    requiredSections: [
      { n: 1, name: 'Identificación del acusado y de los cargos por los que se procedió', mandatory: true, basis: 'Art. 446' },
      { n: 2, name: 'Fundamentos de la decisión: análisis de la prueba practicada en el juicio', mandatory: true, basis: 'Art. 448' },
      { n: 3, name: 'Congruencia entre la acusación y el fallo', mandatory: true, basis: 'Art. 448' },
      { n: 4, name: 'Determinación de la pena, con sus circunstancias de agravación y atenuación', mandatory: true, basis: 'Art. 447' },
      { n: 5, name: 'Pronunciamiento sobre subrogados penales y mecanismos sustitutivos', mandatory: true, basis: 'Art. 447' },
      { n: 6, name: 'Pronunciamiento sobre los derechos de las víctimas', mandatory: true, basis: 'Art. 102' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/447.htm'
  },
  {
    id: 'penal/sentencia-penal-absolutoria',
    exactName: 'Sentencia penal absolutoria',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 446 y 448',
    competentAuthority: 'Juez de conocimiento',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del acusado y de los cargos', mandatory: true, basis: 'Art. 446' },
      { n: 2, name: 'Análisis de la prueba practicada y de la duda razonable', mandatory: true, basis: 'Art. 448' },
      { n: 3, name: 'Declaración de absolución', mandatory: true, basis: 'Art. 446' },
      { n: 4, name: 'Orden de libertad inmediata y de cesación de las medidas cautelares', mandatory: true, basis: 'Art. 449' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/448.htm'
  },
  {
    id: 'penal/auto-que-decreta-pruebas-en-audiencia-preparatoria',
    exactName: 'Auto que decreta pruebas en audiencia preparatoria',
    branch: 'PENAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 175, 356 y 357',
    competentAuthority: 'Juez de conocimiento',
    term: { status: 'VERIFICADO', description: 'La audiencia preparatoria debe realizarse en un término máximo de cuarenta y cinco (45) días después de la audiencia de acusación, y la de juicio oral dentro de los cuarenta y cinco (45) días siguientes a la preparatoria (art. 175).' },
    requiredSections: [
      { n: 1, name: 'Verificación del descubrimiento probatorio de ambas partes', mandatory: true, basis: 'Art. 356' },
      { n: 2, name: 'Enunciación de las pruebas solicitadas por cada parte', mandatory: true, basis: 'Art. 357' },
      { n: 3, name: 'Juicio de pertinencia, conducencia y utilidad', mandatory: true, basis: 'Art. 357' },
      { n: 4, name: 'Decisión sobre exclusión, rechazo e inadmisibilidad de pruebas', mandatory: true, basis: 'Art. 359' },
      { n: 5, name: 'Fijación de la fecha de la audiencia de juicio oral', mandatory: true, basis: 'Art. 175' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/357.htm'
  }
  ]
};
