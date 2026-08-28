import type { BranchCatalog } from '../types';

/**
 * CONTRATACION catalogue.
 *
 * Generated from research/actuaciones-contratacion.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const CONTRATACION_CATALOG: BranchCatalog = {
  meta: {
    branch: 'CONTRATACION',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Ley 80 de 1993 (Estatuto General de Contratación de la Administración Pública); Ley 1150 de 2007; Ley 1474 de 2011 (Estatuto Anticorrupción); Decreto 1082 de 2015. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma. Esta rama cubre la etapa precontractual y contractual ante la entidad; las acciones judiciales contractuales están en la rama ADMINISTRATIVO.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'LEY 80 DE 1993 SIGUE VIGENTE. El Proyecto de Ley 554 de 2025 propone reformarla integralmente —poder preferente del Estado para ejecutar directamente, incidente de objeciones ciudadanas, audiencias públicas obligatorias— pero NO ha sido aprobado. Es un proyecto, no derecho vigente. Este catálogo refleja la ley en vigor.',
    'EL ACTO DE ADJUDICACIÓN ES IRREVOCABLE. El art. 9 de la Ley 1150 de 2007 dispone que la adjudicación se hace obligatoriamente en audiencia pública, mediante resolución motivada, y que el acto de adjudicación es IRREVOCABLE y obliga a la entidad y al adjudicatario. No se ataca por revocatoria directa: la vía es judicial, ante la jurisdicción contencioso administrativa. Confundir esto pierde la oportunidad de impugnar.',
    'Términos para interponer los recursos contra los actos de caducidad, multa y declaratoria de incumplimiento: se rigen por el CPACA y no los fija la Ley 80 ni la Ley 1474. Están en la rama ADMINISTRATIVO y por eso figuran sin verificar en estas entradas.',
    'El art. 86 de la Ley 1474 de 2011 fija las etapas del procedimiento sancionatorio contractual —citación, audiencia, cargos, descargos, pruebas— pero no plazos en días para cada una. Quedan sin verificar.',
    'Los regímenes exceptuados del Estatuto General —empresas de servicios públicos domiciliarios, entidades financieras estatales, salud, ciencia y tecnología, entre otros— se rigen por el derecho privado y sus propias normas. No están cubiertos.',
    'Los plazos específicos de cada modalidad de selección —selección abreviada, concurso de méritos, mínima cuantía— están reglamentados en el Decreto 1082 de 2015 y no se verificaron aquí; sólo se catalogó la licitación pública de la Ley 80.'
    ]
  },
  actuaciones: [
  {
    id: 'contratacion/observaciones-al-proyecto-de-pliego-de-condiciones',
    exactName: 'Observaciones al proyecto de pliego de condiciones',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, art. 30; Decreto 1082 de 2015',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Los interesados pueden hacer comentarios al proyecto de pliego de condiciones a partir de la fecha de su publicación en el SECOP: (a) durante un término de diez (10) días hábiles en la licitación pública, y (b) durante un término de cinco (5) días hábiles en la selección abreviada y el concurso de méritos (Decreto 1082 de 2015, art. 2.2.1.1.2.1.4, que compiló el art. 23 del Decreto 1510 de 2013). La obligación de publicar el proyecto de pliego para que se presenten observaciones o se soliciten aclaraciones dentro de ese término está en el art. 2.2.1.1.1.7.1 del mismo decreto. El término no lo fija la Ley 80 de 1993, art. 30, sino el reglamento.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de selección y del proyecto de pliego observado', mandatory: true, basis: 'Art. 30' },
      { n: 2, name: 'Identificación del observante y de su interés en el proceso', mandatory: true, basis: null },
      { n: 3, name: 'Observación concreta por cada numeral del pliego', mandatory: true, basis: 'Art. 30' },
      { n: 4, name: 'Fundamento legal o técnico de cada observación', mandatory: true, basis: null },
      { n: 5, name: 'Petición concreta de modificación', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=77653'
  },
  {
    id: 'contratacion/solicitud-de-aclaracion-de-pliegos-en-audiencia-de-precision',
    exactName: 'Solicitud de aclaración de pliegos en audiencia de precisión',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, art. 30 num. 4',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Dentro de los tres (3) días hábiles siguientes al inicio del plazo para la presentación de propuestas pueden solicitarse aclaraciones o precisiones sobre el contenido y alcance de los pliegos (art. 30 num. 4).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y del numeral del pliego que se aclara', mandatory: true, basis: 'Art. 30 num. 4' },
      { n: 2, name: 'Punto concreto que ofrece duda sobre el contenido o alcance', mandatory: true, basis: 'Art. 30 num. 4' },
      { n: 3, name: 'Incidencia de la duda en la formulación de la propuesta', mandatory: true, basis: null },
      { n: 4, name: 'Solicitud de que la respuesta se consigne en acta y adenda', mandatory: true, basis: 'Art. 30 num. 4' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/presentacion-de-propuesta-en-licitacion-publica',
    exactName: 'Presentación de propuesta en licitación pública',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, arts. 24 y 30; Ley 1150 de 2007, art. 5',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'El plazo de la licitación se señala en los pliegos según la naturaleza, objeto y cuantía del contrato, y puede prorrogarse hasta por seis (6) días hábiles (art. 30).' },
    requiredSections: [
      { n: 1, name: 'Carta de presentación de la propuesta suscrita por el representante legal', mandatory: true, basis: 'Art. 30' },
      { n: 2, name: 'Documentos de existencia y representación legal del proponente', mandatory: true, basis: 'Art. 30' },
      { n: 3, name: 'Acreditación de los requisitos habilitantes: capacidad jurídica, financiera y experiencia', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 4, name: 'Registro Único de Proponentes vigente y en firme', mandatory: true, basis: 'Ley 1150 de 2007, art. 6' },
      { n: 5, name: 'Oferta económica conforme al formato del pliego', mandatory: true, basis: 'Art. 30' },
      { n: 6, name: 'Garantía de seriedad de la oferta', mandatory: true, basis: 'Art. 30' },
      { n: 7, name: 'Declaración de ausencia de inhabilidades e incompatibilidades', mandatory: true, basis: 'Art. 8' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/observaciones-al-informe-de-evaluacion-de-propuestas',
    exactName: 'Observaciones al informe de evaluación de propuestas',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, art. 30 num. 8',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Los informes de evaluación permanecen a disposición de los oferentes por un término de cinco (5) días hábiles para que presenten observaciones, sin que puedan modificar ni mejorar sus propuestas (art. 30 num. 8).' },
    requiredSections: [
      { n: 1, name: 'Identificación del informe de evaluación observado', mandatory: true, basis: 'Art. 30 num. 8' },
      { n: 2, name: 'Observación concreta sobre la calificación propia o de otros proponentes', mandatory: true, basis: 'Art. 30 num. 8' },
      { n: 3, name: 'Fundamento en el pliego y en la propuesta ya presentada', mandatory: true, basis: 'Art. 30 num. 8' },
      { n: 4, name: 'Constancia de que no se modifica ni mejora la propuesta', mandatory: true, basis: 'Art. 30 num. 8' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/subsanacion-de-requisitos-habilitantes',
    exactName: 'Subsanación de requisitos habilitantes',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1150 de 2007, art. 5 par. 1',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Todos los requisitos de la propuesta que no afecten la asignación de puntaje deben ser solicitados por la entidad y entregados por los proponentes hasta el término de traslado del informe de evaluación que corresponda a cada modalidad de selección —en la licitación pública ese traslado es de cinco (5) días hábiles, Ley 80 de 1993, art. 30 num. 8—, salvo lo dispuesto para mínima cuantía y para el proceso por subasta; vencido ese plazo se rechaza la oferta que no aporte lo pedido (Ley 1150 de 2007, art. 5 par. 1, en el texto vigente sustituido por el art. 5 de la Ley 1882 de 2018). En los procesos por subasta, los documentos no necesarios para comparar las propuestas deben solicitarse hasta el momento previo a su realización (art. 5 par. 4). Durante el término para subsanar no pueden acreditarse circunstancias ocurridas con posterioridad al cierre del proceso. La no entrega de la garantía de seriedad junto con la propuesta no es subsanable (art. 5 par. 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación del requerimiento de subsanación de la entidad', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 2, name: 'Documento que acredita el requisito habilitante echado de menos', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 3, name: 'Constancia de que el requisito no otorga puntaje', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 4, name: 'Manifestación de que no se modifica la oferta económica', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=184686'
  },
  {
    id: 'contratacion/descargos-en-audiencia-de-incumplimiento-contractual',
    exactName: 'Descargos en audiencia de incumplimiento contractual',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1474 de 2011, art. 86',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'La ley no fija un plazo en días para los descargos: se presentan oralmente en la audiencia de que trata el art. 86 de la Ley 1474 de 2011. La entidad cita al contratista y al garante indicando lugar, fecha y hora de la audiencia, la que «podrá tener lugar a la mayor brevedad posible, atendida la naturaleza del contrato» (lit. a). Ya en la audiencia, tras la exposición de la entidad, se concede el uso de la palabra al contratista y al garante para presentar descargos, rendir explicaciones, aportar pruebas y controvertir las de la entidad (lit. b). El jefe de la entidad puede suspender la audiencia para allegar o practicar pruebas, señalando en la misma decisión fecha y hora de reanudación (lit. d). El art. 86 no señala un término mínimo entre la citación y la audiencia.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la citación, de los hechos imputados y del contrato', mandatory: true, basis: 'Art. 86' },
      { n: 2, name: 'Pronunciamiento sobre cada cargo formulado por la entidad', mandatory: true, basis: 'Art. 86' },
      { n: 3, name: 'Controversia del informe de interventoría o supervisión que soporta los hechos', mandatory: true, basis: 'Art. 86' },
      { n: 4, name: 'Pruebas que se aportan o cuya práctica se solicita', mandatory: true, basis: 'Art. 86' },
      { n: 5, name: 'Alegación de causa extraña, fuerza mayor o hecho de la entidad, cuando proceda', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=43292'
  },
  {
    id: 'contratacion/solicitud-de-liquidacion-bilateral-del-contrato-estatal',
    exactName: 'Solicitud de liquidación bilateral del contrato estatal',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1150 de 2007, art. 11',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'De mutuo acuerdo dentro del término fijado en los pliegos o el que acuerden las partes. A falta de ese término, dentro de los cuatro (4) meses siguientes a la expiración del plazo previsto para la ejecución del contrato o a la expedición del acto que ordene su terminación. Vencido, la entidad puede liquidar unilateralmente dentro de los dos (2) meses siguientes; y si tampoco se hizo, puede liquidarse en cualquier tiempo dentro de los dos (2) años siguientes (art. 11).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato y de la fecha de expiración de su plazo de ejecución', mandatory: true, basis: 'Art. 11' },
      { n: 2, name: 'Balance de las prestaciones ejecutadas y de los pagos realizados', mandatory: true, basis: 'Art. 11' },
      { n: 3, name: 'Determinación del saldo a favor o en contra de cada parte', mandatory: true, basis: 'Art. 11' },
      { n: 4, name: 'Salvedades y reclamaciones que se dejan constando', mandatory: true, basis: 'Art. 11' },
      { n: 5, name: 'Constancia de paz y salvo, cuando no haya salvedades', mandatory: false, basis: 'Art. 11' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=184686'
  },
  {
    id: 'contratacion/solicitud-de-restablecimiento-del-equilibrio-economico-del-contrato',
    exactName: 'Solicitud de restablecimiento del equilibrio económico del contrato',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, arts. 4 num. 8, 5 num. 1 y 27; Ley 1437 de 2011, art. 164 num. 2 lit. j) (caducidad de dos años de las controversias contractuales)',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'HUECO CERRADO en la petición ante la entidad: el art. 27 de la Ley 80 de 1993 NO fija término; se limita a ordenar que «las partes adoptarán en el menor tiempo posible las medidas necesarias para su restablecimiento». Tampoco lo fijan los arts. 4 num. 8 ni 5 num. 1. RELOJ DEL CONTRATISTA, que la ficha callaba y que sí es legal y computable: la reclamación judicial caduca a los dos (2) años — «En las relativas a contratos el término para demandar será de dos (2) años que se contarán a partir del día siguiente a la ocurrencia de los motivos de hecho o de derecho que les sirvan de fundamento» (Ley 1437 de 2011, art. 164 num. 2 lit. j). El mismo literal fija el dies a quo según el contrato: «i) En los de ejecución instantánea desde el día siguiente a cuando se cumplió o debió cumplirse el objeto del contrato; ii) En los que no requieran de liquidación, desde el día siguiente al de la terminación del contrato por cualquier causa; iii) En los que requieran de liquidación y esta sea efectuada de común acuerdo por las partes, desde el día siguiente al de la firma del acta; iv) En los que requieran de liquidación y esta sea efectuada unilateralmente por la administración, desde el día siguiente al de la ejecutoria del acto administrativo que la apruebe; v) En los que requieran de liquidación y esta no se logre por mutuo acuerdo o no se practique por la administración unilateralmente, una vez cumplido el término de dos (2) meses contados a partir del vencimiento del plazo convenido para hacerlo bilateralmente o, en su defecto, del término de los cuatro (4) meses siguientes a la terminación del contrato». La carga de dejar la salvedad al suscribir el acta de liquidación, so pena de entenderse renunciada la reclamación, es jurisprudencia del Consejo de Estado y no texto de la norma: no se cataloga como término legal.' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato y de su ecuación contractual inicial', mandatory: true, basis: 'Art. 27' },
      { n: 2, name: 'Hecho que rompió el equilibrio: hecho del príncipe, imprevisión o incumplimiento de la entidad', mandatory: true, basis: 'Art. 27' },
      { n: 3, name: 'Demostración de que el hecho fue imprevisible y no imputable al contratista', mandatory: true, basis: 'Art. 27' },
      { n: 4, name: 'Cuantificación del mayor valor o del perjuicio sufrido', mandatory: true, basis: 'Art. 27' },
      { n: 5, name: 'Constancia de haber dejado la salvedad oportunamente', mandatory: true, basis: 'Ley 1150 de 2007, art. 11' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/solicitud-de-adicion-o-prorroga-del-contrato-estatal',
    exactName: 'Solicitud de adición o prórroga del contrato estatal',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, art. 40, parágrafo (límite de cuantía: el 50% del valor inicial expresado en salarios mínimos legales mensuales; incisos adicionados por el art. 8 del Decreto 537 de 2020, de vigencia atada a la Emergencia Sanitaria por COVID-19)',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'HUECO CERRADO: el parágrafo del art. 40 de la Ley 80 de 1993 fija un límite de CUANTÍA, no un término. Ni ese parágrafo ni el resto del art. 40 señalan plazo para solicitar o suscribir la adición o la prórroga: el cronograma lo fijan el contrato y el pliego, y la regla práctica de pedirla antes del vencimiento del plazo de ejecución deriva de que un contrato ya vencido no puede prorrogarse, no de un plazo legal expreso. PRECISIÓN DEL TEXTO OFICIAL que la ficha recortaba: el límite del cincuenta por ciento (50%) va referido al valor inicial «expresado éste en salarios mínimos legales mensuales», no al valor nominal; y el mismo parágrafo limita el pago anticipado y el anticipo, cuyo «monto no podrá exceder del cincuenta por ciento (50%) del valor del respectivo contrato». EXCEPCIÓN DE VIGENCIA AGOTADA, que consta en el texto oficial: los incisos adicionados por el art. 8 del Decreto 537 de 2020 permitieron adicionar «sin limitación al valor» los contratos relacionados con la mitigación de la pandemia, pero solo «durante la vigencia de la Emergencia Sanitaria declarada por el Ministerio de Salud y Protección Social» y «durante el término que dicho estado esté vigente»: no habilita adiciones hoy.' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato, de su valor y de su plazo vigente', mandatory: true, basis: 'Art. 40' },
      { n: 2, name: 'Justificación técnica de la adición o prórroga', mandatory: true, basis: 'Art. 40' },
      { n: 3, name: 'Verificación del límite: la adición no puede superar el cincuenta por ciento (50%) del valor inicial expresado en salarios mínimos legales mensuales', mandatory: true, basis: 'Art. 40 par.' },
      { n: 4, name: 'Solicitud presentada antes del vencimiento del plazo de ejecución', mandatory: true, basis: null },
      { n: 5, name: 'Ajuste de las garantías', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/recurso-de-reposicion-contra-la-declaratoria-de-caducidad',
    exactName: 'Recurso de reposición contra la declaratoria de caducidad',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 80 de 1993, arts. 18 y 77; Ley 1437 de 2011, art. 76',
    competentAuthority: 'La misma entidad que profirió el acto',
    term: { status: 'VERIFICADO', description: 'El art. 77 de la Ley 80 de 1993 dispone que los actos administrativos expedidos con motivo u ocasión de la actividad contractual «sólo serán susceptibles de recurso de reposición y del ejercicio de la acción contractual», de acuerdo con las reglas del Código Contencioso Administrativo, hoy Ley 1437 de 2011. La Ley 80 no fija el término: lo fija el art. 76 del CPACA, conforme al cual la reposición debe interponerse por escrito en la diligencia de notificación personal, o dentro de los diez (10) días siguientes a ella, o a la notificación por aviso, o al vencimiento del término de publicación, según el caso. ADVERTENCIA: cuando la caducidad se declara dentro de la audiencia del art. 86 de la Ley 1474 de 2011, ese artículo ordena que el recurso de reposición «se interpondrá, sustentará y decidirá en la misma audiencia», y la decisión se entiende notificada en ese acto público; en ese escenario no hay término de diez (10) días.' },
    requiredSections: [
      { n: 1, name: 'Identificación del acto de caducidad y de su fecha de notificación', mandatory: true, basis: 'Art. 18' },
      { n: 2, name: 'Controversia del hecho constitutivo de incumplimiento grave invocado', mandatory: true, basis: 'Art. 18' },
      { n: 3, name: 'Demostración de que el incumplimiento no afecta de manera grave y directa la ejecución', mandatory: true, basis: 'Art. 18' },
      { n: 4, name: 'Pronunciamiento sobre las inhabilidades que la caducidad genera', mandatory: true, basis: 'Art. 18' },
      { n: 5, name: 'Petición de revocatoria del acto', mandatory: true, basis: 'Art. 77' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'contratacion/recurso-de-reposicion-contra-la-resolucion-que-impone-multa',
    exactName: 'Recurso de reposición contra la resolución que impone multa',
    branch: 'CONTRATACION',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1474 de 2011, art. 86; Ley 1437 de 2011, art. 76',
    competentAuthority: 'La misma entidad que impuso la multa',
    term: { status: 'VERIFICADO', description: 'Contra la resolución que impone la multa, la sanción o declara el incumplimiento «sólo procede el recurso de reposición que se interpondrá, sustentará y decidirá en la misma audiencia», y la decisión sobre el recurso se entiende notificada en esa misma audiencia (Ley 1474 de 2011, art. 86 lit. c). No hay término en días ni traslado posterior: quien no interpone y sustenta oralmente en la audiencia pierde el recurso. No aplica aquí el término de diez (10) días del art. 76 del CPACA.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la resolución sancionatoria y de su notificación', mandatory: true, basis: 'Art. 86' },
      { n: 2, name: 'Controversia de los cargos y de las pruebas valoradas en la audiencia', mandatory: true, basis: 'Art. 86' },
      { n: 3, name: 'Cuestionamiento de la cuantificación de la multa o de los perjuicios', mandatory: true, basis: 'Art. 86' },
      { n: 4, name: 'Petición de revocatoria o de reducción', mandatory: true, basis: 'Art. 86' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=43292'
  },
  {
    id: 'contratacion/aviso-de-convocatoria-publica',
    exactName: 'Aviso de convocatoria pública',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 30 num. 3',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Dentro de los diez (10) a veinte (20) días calendario anteriores a la apertura de la licitación se publican hasta tres (3) avisos, en la página web de la entidad y en el SECOP (art. 30 num. 3).' },
    requiredSections: [
      { n: 1, name: 'Objeto del contrato y modalidad de selección', mandatory: true, basis: 'Art. 30 num. 3' },
      { n: 2, name: 'Presupuesto oficial estimado', mandatory: true, basis: 'Art. 30 num. 3' },
      { n: 3, name: 'Fecha de apertura de la licitación y cronograma', mandatory: true, basis: 'Art. 30 num. 3' },
      { n: 4, name: 'Lugar de consulta del pliego de condiciones', mandatory: true, basis: 'Art. 30 num. 3' },
      { n: 5, name: 'Constancia de publicación en la página web y en el SECOP', mandatory: true, basis: 'Art. 30 num. 3' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/estudios-previos-y-analisis-del-sector',
    exactName: 'Estudios previos y análisis del sector',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 25 nums. 7 y 12; Decreto 1082 de 2015',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Deben elaborarse «previo a la apertura de un proceso de selección, o a la firma del contrato en el caso en que la modalidad de selección sea contratación directa» (Ley 80 de 1993, art. 25 num. 12, en el texto vigente sustituido por el art. 87 de la Ley 1474 de 2011). Cuando el objeto incluya la realización de una obra, en esa misma oportunidad la entidad debe contar con los estudios y diseños que permitan establecer la viabilidad del proyecto y su impacto social, económico y ambiental, incluso en los contratos que incluyan el diseño dentro del objeto. La norma no fija plazo en días, sino esa oportunidad procesal preclusiva.' },
    requiredSections: [
      { n: 1, name: 'Descripción de la necesidad que se pretende satisfacer', mandatory: true, basis: 'Art. 25 num. 12' },
      { n: 2, name: 'Objeto a contratar y sus especificaciones técnicas', mandatory: true, basis: 'Art. 25 num. 12' },
      { n: 3, name: 'Modalidad de selección y su justificación jurídica', mandatory: true, basis: 'Ley 1150 de 2007, art. 2' },
      { n: 4, name: 'Valor estimado del contrato y su fundamento', mandatory: true, basis: 'Art. 25 num. 12' },
      { n: 5, name: 'Criterios de selección y requisitos habilitantes', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 6, name: 'Análisis de riesgos y su asignación', mandatory: true, basis: 'Ley 1150 de 2007, art. 4' },
      { n: 7, name: 'Garantías exigidas', mandatory: true, basis: 'Art. 25 num. 19' },
      { n: 8, name: 'Certificado de disponibilidad presupuestal', mandatory: true, basis: 'Art. 25 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=43292'
  },
  {
    id: 'contratacion/pliego-de-condiciones-definitivo',
    exactName: 'Pliego de condiciones definitivo',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 24 num. 5 y art. 30',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'El plazo de la licitación se señala en el pliego y puede prorrogarse hasta por seis (6) días hábiles (art. 30).' },
    requiredSections: [
      { n: 1, name: 'Objeto, alcance y especificaciones técnicas', mandatory: true, basis: 'Art. 24 num. 5' },
      { n: 2, name: 'Requisitos habilitantes objetivos, sin puntaje', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 3, name: 'Reglas de evaluación y factores de escogencia con su ponderación', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 4, name: 'Cronograma completo del proceso', mandatory: true, basis: 'Art. 30' },
      { n: 5, name: 'Minuta del contrato a celebrar', mandatory: true, basis: 'Art. 24 num. 5' },
      { n: 6, name: 'Reglas que no induzcan a error ni permitan la formulación de ofrecimientos de extensión ilimitada', mandatory: true, basis: 'Art. 24 num. 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/informe-de-evaluacion-de-propuestas',
    exactName: 'Informe de evaluación de propuestas',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 30 num. 8',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Permanece a disposición de los oferentes por cinco (5) días hábiles para que presenten observaciones, sin que puedan modificar ni mejorar sus propuestas (art. 30 num. 8).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los requisitos habilitantes de cada proponente', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 2, name: 'Calificación de los factores de escogencia según la ponderación del pliego', mandatory: true, basis: 'Ley 1150 de 2007, art. 5' },
      { n: 3, name: 'Orden de elegibilidad resultante', mandatory: true, basis: 'Art. 30 num. 8' },
      { n: 4, name: 'Motivación de los rechazos', mandatory: true, basis: 'Art. 30 num. 8' },
      { n: 5, name: 'Constancia de traslado por cinco (5) días hábiles', mandatory: true, basis: 'Art. 30 num. 8' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/resolucion-de-adjudicacion',
    exactName: 'Resolución de adjudicación',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 30 nums. 10 y 11; Ley 1150 de 2007, art. 9',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Se hace obligatoriamente en audiencia pública, mediante resolución motivada. El acto de adjudicación es IRREVOCABLE y obliga a la entidad y al adjudicatario (Ley 1150 de 2007, art. 9). El plazo para adjudicar se fija en el pliego y el jefe de la entidad puede prorrogarlo por un período máximo igual a la mitad del inicialmente fijado (Ley 80, art. 30).' },
    requiredSections: [
      { n: 1, name: 'Constancia de celebración de la audiencia pública de adjudicación', mandatory: true, basis: 'Ley 1150 de 2007, art. 9' },
      { n: 2, name: 'Motivación: análisis de las propuestas y del orden de elegibilidad', mandatory: true, basis: 'Ley 1150 de 2007, art. 9' },
      { n: 3, name: 'Respuesta a las observaciones presentadas al informe de evaluación', mandatory: true, basis: 'Art. 30 num. 8' },
      { n: 4, name: 'Identificación del adjudicatario y del valor adjudicado', mandatory: true, basis: 'Art. 30 num. 11' },
      { n: 5, name: 'Advertencia de irrevocabilidad del acto', mandatory: true, basis: 'Ley 1150 de 2007, art. 9' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=184686'
  },
  {
    id: 'contratacion/resolucion-de-declaratoria-de-desierta',
    exactName: 'Resolución de declaratoria de desierta',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 25 num. 18 (causal y deber de motivación expresa y detallada) y art. 30 num. 9 (oportunidad: dentro del mismo término de adjudicación fijado en el pliego, prorrogable por un término total no mayor a la mitad del inicial); Ley 1150 de 2007, art. 32 (derogatoria de la expresión «concurso»)',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'LA LEY NO FIJA UN PLAZO EN DÍAS PARA DECLARAR DESIERTA, PERO SÍ FIJA SU MARCO, Y ESE MARCO ES CONTRACTUAL: «Dentro del MISMO TÉRMINO DE ADJUDICACIÓN, podrá declararse desierta la licitación o concurso conforme a lo previsto en este estatuto» (art. 30 num. 9 inc. 3). DÓNDE VIVE ESE TÉRMINO: lo señala el PLIEGO DE CONDICIONES «teniendo en cuenta su naturaleza, objeto y cuantía», y solo puede prorrogarlo el jefe o representante de la entidad, ANTES DE SU VENCIMIENTO, «por un término total no mayor a la MITAD del inicialmente fijado». Vencido sin acto de adjudicación ni de declaratoria de desierta, LA ENTIDAD PIERDE LA OPORTUNIDAD. Sin leer el pliego del proceso concreto no puede afirmarse un número de días: el término existe, pero su medida es contractual, no legal. CAUSAL Y MOTIVACIÓN, que es por donde se ataca el acto: «La declaratoria de desierta de la licitación o concurso ÚNICAMENTE PROCEDERÁ POR MOTIVOS O CAUSAS QUE IMPIDAN LA ESCOGENCIA OBJETIVA y se declarará en acto administrativo en el que se señalarán en forma EXPRESA Y DETALLADA las razones que han conducido a esa decisión» (art. 25 num. 18). Una declaratoria motivada en conveniencia, y no en la imposibilidad de escoger objetivamente, es demandable. ADVERTENCIA DE VIGENCIA: la expresión «concurso» de ambos artículos fue derogada por el art. 32 de la Ley 1150 de 2007.' },
    requiredSections: [
      { n: 1, name: 'Motivos precisos y detallados que impiden la selección objetiva', mandatory: true, basis: 'Art. 25 num. 18' },
      { n: 2, name: 'Constancia de que no obedece a motivos o causas inconvenientes', mandatory: true, basis: 'Art. 25 num. 18' },
      { n: 3, name: 'Análisis de cada propuesta y de por qué ninguna resulta admisible', mandatory: true, basis: 'Art. 25 num. 18' },
      { n: 4, name: 'Indicación del recurso de reposición que procede', mandatory: true, basis: 'Art. 77' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/acto-de-declaratoria-de-caducidad-del-contrato',
    exactName: 'Acto de declaratoria de caducidad del contrato',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 80 de 1993, art. 18',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Procede si se presenta alguno de los hechos constitutivos de incumplimiento que afecte de manera grave y directa la ejecución del contrato y evidencie que puede conducir a su paralización (art. 18).' },
    requiredSections: [
      { n: 1, name: 'Identificación del hecho constitutivo de incumplimiento', mandatory: true, basis: 'Art. 18' },
      { n: 2, name: 'Demostración de que afecta de manera grave y directa la ejecución', mandatory: true, basis: 'Art. 18' },
      { n: 3, name: 'Constancia del procedimiento previo con audiencia del contratista', mandatory: true, basis: 'Ley 1474 de 2011, art. 86' },
      { n: 4, name: 'Declaratoria de terminación y orden de liquidación en el estado en que se encuentre', mandatory: true, basis: 'Art. 18' },
      { n: 5, name: 'Constancia de que no habrá lugar a indemnización para el contratista', mandatory: true, basis: 'Art. 18' },
      { n: 6, name: 'Advertencia sobre las inhabilidades que genera la caducidad', mandatory: true, basis: 'Arts. 8 y 18' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=304'
  },
  {
    id: 'contratacion/resolucion-que-impone-multa-o-hace-efectiva-la-clausula-penal',
    exactName: 'Resolución que impone multa o hace efectiva la cláusula penal',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 1474 de 2011, art. 86',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'La ley no fija plazo en días. La decisión se adopta «mediante resolución motivada en la que se consigne lo ocurrido en desarrollo de la audiencia y la cual se entenderá notificada en dicho acto público», al término de la audiencia de que trata el art. 86 de la Ley 1474 de 2011 (lit. c). La audiencia puede suspenderse para practicar pruebas o por razón debidamente sustentada, señalando en la misma decisión fecha y hora de reanudación (lit. d), y la entidad puede dar por terminado el procedimiento en cualquier momento si conoce la cesación de la situación de incumplimiento.' },
    requiredSections: [
      { n: 1, name: 'Constancia de la citación previa con los hechos y el informe de interventoría o supervisión', mandatory: true, basis: 'Art. 86' },
      { n: 2, name: 'Constancia de la audiencia y de la formulación sustentada de cargos', mandatory: true, basis: 'Art. 86' },
      { n: 3, name: 'Valoración de los descargos y de las pruebas practicadas', mandatory: true, basis: 'Art. 86' },
      { n: 4, name: 'Declaratoria de incumplimiento y cuantificación de los perjuicios', mandatory: true, basis: 'Art. 86' },
      { n: 5, name: 'Liquidación de la multa o efectividad de la cláusula penal', mandatory: true, basis: 'Art. 86' },
      { n: 6, name: 'Indicación de los recursos que proceden', mandatory: true, basis: 'Art. 86' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=43292'
  },
  {
    id: 'contratacion/acta-de-liquidacion-bilateral-del-contrato',
    exactName: 'Acta de liquidación bilateral del contrato',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 1150 de 2007, art. 11',
    competentAuthority: 'Entidad estatal contratante y contratista',
    term: { status: 'VERIFICADO', description: 'Dentro del término del pliego o el acordado; a falta de él, dentro de los cuatro (4) meses siguientes a la expiración del plazo de ejecución o al acto que ordene la terminación (art. 11).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato y de sus modificaciones', mandatory: true, basis: 'Art. 11' },
      { n: 2, name: 'Balance de prestaciones ejecutadas y pagos efectuados', mandatory: true, basis: 'Art. 11' },
      { n: 3, name: 'Saldo a favor o en contra de cada parte', mandatory: true, basis: 'Art. 11' },
      { n: 4, name: 'Salvedades del contratista, cuando las formule', mandatory: true, basis: 'Art. 11' },
      { n: 5, name: 'Firma de ambas partes', mandatory: true, basis: 'Art. 11' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=184686'
  },
  {
    id: 'contratacion/acto-de-liquidacion-unilateral-del-contrato',
    exactName: 'Acto de liquidación unilateral del contrato',
    branch: 'CONTRATACION',
    role: 'DESPACHO',
    legalBasis: 'Ley 1150 de 2007, art. 11',
    competentAuthority: 'Entidad estatal contratante',
    term: { status: 'VERIFICADO', description: 'Procede cuando el contratista no comparece a la liquidación previa notificación o convocatoria, o cuando las partes no llegan a acuerdo sobre su contenido. Debe expedirse dentro de los dos (2) meses siguientes al vencimiento del término de la liquidación bilateral; vencido, aún puede liquidarse en cualquier tiempo dentro de los dos (2) años siguientes (art. 11).' },
    requiredSections: [
      { n: 1, name: 'Constancia de la notificación o convocatoria al contratista para liquidar', mandatory: true, basis: 'Art. 11' },
      { n: 2, name: 'Constancia de su inasistencia o de la falta de acuerdo', mandatory: true, basis: 'Art. 11' },
      { n: 3, name: 'Balance final de la ejecución y de los pagos', mandatory: true, basis: 'Art. 11' },
      { n: 4, name: 'Determinación del saldo y orden de pago o de reintegro', mandatory: true, basis: 'Art. 11' },
      { n: 5, name: 'Verificación del cómputo de los dos (2) meses y, en su caso, de los dos (2) años', mandatory: true, basis: 'Art. 11' },
      { n: 6, name: 'Indicación de los recursos que proceden', mandatory: true, basis: 'Art. 77' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=184686'
  }
  ]
};
