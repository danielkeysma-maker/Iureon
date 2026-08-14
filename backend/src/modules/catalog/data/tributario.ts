import type { BranchCatalog } from '../types';

/**
 * TRIBUTARIO catalogue.
 *
 * Generated from research/actuaciones-tributario.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const TRIBUTARIO_CATALOG: BranchCatalog = {
  meta: {
    branch: 'TRIBUTARIO',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Estatuto Tributario (Decreto 624 de 1989) con sus modificaciones, cuya estructura vigente proviene de la Ley 2277 de 2022. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma. Esta rama cubre el procedimiento tributario ante la DIAN; la etapa judicial ante lo contencioso administrativo está en la rama ADMINISTRATIVO.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'HAY NORMAS TRIBUTARIAS VIGENTES PERO PROVISIONALES. El Decreto 1474 del 29 de diciembre de 2025 fue expedido al amparo del Estado de Emergencia Económica, Social y Ecológica declarado el 22 de diciembre de 2025, e introdujo medidas de patrimonio, IVA, sobretasa financiera e hidrocarburos. Está vigente, PERO sujeto a control automático de constitucionalidad, y análisis especializados anticipan su caída con EFECTOS RETROACTIVOS. Antes de liquidar un impuesto sobre esas medidas, confirme el estado del control constitucional: una norma vigente hoy puede desaparecer hacia el pasado. Este catálogo cubre el PROCEDIMIENTO tributario, que esas medidas no alteran.',
    'NO CONFUNDIR PROYECTO CON LEY. La reforma tributaria presentada en 2025 fue hundida en el Senado el 9 de diciembre de 2025 y quedó archivada. Las reglas estructurales vigentes siguen siendo las de la Ley 2277 de 2022.',
    'Término para solicitar la devolución de saldos a favor (art. 854): no se verificó en el texto de la norma. Sí se verificó el término que tiene la DIAN para resolverla (art. 855).',
    'Términos de la corrección voluntaria de declaraciones (arts. 588 y 589), del emplazamiento para corregir (art. 685) y del pliego de cargos (art. 638): no verificados.',
    'Términos del procedimiento administrativo de cobro coactivo (arts. 823 y siguientes), incluidas las excepciones contra el mandamiento de pago: no verificados.',
    'Los tributos territoriales — impuesto de industria y comercio, predial, vehículos — se rigen por los acuerdos y ordenanzas de cada entidad, que remiten al Estatuto Tributario con plazos propios. No están cubiertos.'
    ]
  },
  actuaciones: [
  {
    id: 'tributario/respuesta-al-requerimiento-especial',
    exactName: 'Respuesta al requerimiento especial',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, art. 707',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Tres (3) meses contados a partir de la fecha de notificación del requerimiento especial (art. 707).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contribuyente, del período y del requerimiento respondido', mandatory: true, basis: 'Art. 707' },
      { n: 2, name: 'Objeciones escritas a cada glosa propuesta', mandatory: true, basis: 'Art. 707' },
      { n: 3, name: 'Solicitud de pruebas y de documentos que reposen en los archivos de la Administración', mandatory: false, basis: 'Art. 707' },
      { n: 4, name: 'Subsanación de las omisiones que la ley permite', mandatory: false, basis: 'Art. 707' },
      { n: 5, name: 'Solicitud de práctica de inspecciones tributarias, cuando sean conducentes', mandatory: false, basis: 'Art. 707' },
      { n: 6, name: 'Advertencia sobre el efecto de atender en debida forma el requerimiento: habilita el per saltum del art. 720', mandatory: false, basis: 'Art. 720 par.' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/707-2/'
  },
  {
    id: 'tributario/recurso-de-reconsideracion',
    exactName: 'Recurso de reconsideración',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 720 a 722',
    competentAuthority: 'Oficina competente de la Administración de Impuestos que profirió el acto',
    term: { status: 'VERIFICADO', description: 'Dos (2) meses siguientes a la notificación del acto (art. 720). La Administración tiene un (1) año para resolverlo, contado desde su interposición en debida forma (art. 732).' },
    requiredSections: [
      { n: 1, name: 'Identificación del acto recurrido: liquidación oficial, resolución sancionatoria o de reintegro', mandatory: true, basis: 'Art. 720' },
      { n: 2, name: 'Fecha de notificación del acto, para acreditar la oportunidad', mandatory: true, basis: 'Art. 720' },
      { n: 3, name: 'Razones de inconformidad, hecho por hecho', mandatory: true, basis: 'Art. 722' },
      { n: 4, name: 'Pruebas que se aportan o se solicitan', mandatory: true, basis: 'Art. 722' },
      { n: 5, name: 'Acreditación de la representación y del derecho de postulación', mandatory: true, basis: 'Art. 722' },
      { n: 6, name: 'Petición de revocatoria o modificación del acto', mandatory: true, basis: 'Art. 720' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/720-2/'
  },
  {
    id: 'tributario/demanda-per-saltum-contra-liquidacion-oficial-tributaria',
    exactName: 'Demanda per saltum contra liquidación oficial tributaria',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, art. 720 par.; Ley 1437 de 2011, art. 138',
    competentAuthority: 'Jurisdicción de lo contencioso administrativo',
    term: { status: 'VERIFICADO', description: 'Cuatro (4) meses siguientes a la notificación de la liquidación oficial, cuando el requerimiento especial se atendió en debida forma y se prescinde del recurso de reconsideración (art. 720 par.).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de que el requerimiento especial se atendió en debida forma', mandatory: true, basis: 'Art. 720 par.' },
      { n: 2, name: 'Manifestación expresa de prescindir del recurso de reconsideración', mandatory: true, basis: 'Art. 720 par.' },
      { n: 3, name: 'Identificación de la liquidación oficial demandada y su fecha de notificación', mandatory: true, basis: 'Art. 720 par.' },
      { n: 4, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'Ley 1437 de 2011, art. 162' },
      { n: 5, name: 'Pretensiones de nulidad y de restablecimiento del derecho', mandatory: true, basis: 'Ley 1437 de 2011, art. 138' },
      { n: 6, name: 'Petición de pruebas', mandatory: true, basis: 'Ley 1437 de 2011, art. 162' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/720-2/'
  },
  {
    id: 'tributario/solicitud-de-devolucion-de-saldo-a-favor',
    exactName: 'Solicitud de devolución de saldo a favor',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 850, 854 y 855',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'La DIAN debe devolver dentro de los cincuenta (50) días siguientes a la solicitud presentada oportunamente y en debida forma; treinta (30) días para operadores económicos autorizados. Si la solicitud se formula dentro de los dos meses siguientes a la presentación de la declaración, el término se amplía en un (1) mes (art. 855).' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante, del impuesto y del período', mandatory: true, basis: 'Art. 850' },
      { n: 2, name: 'Determinación del saldo a favor y su origen', mandatory: true, basis: 'Art. 850' },
      { n: 3, name: 'Relación de retenciones, anticipos o pagos en exceso que lo generan', mandatory: true, basis: 'Art. 850' },
      { n: 4, name: 'Garantía, cuando se solicite el trámite con garantía', mandatory: false, basis: 'Art. 860' },
      { n: 5, name: 'Advertencia: presentada la solicitud, el término de firmeza del art. 714 se cuenta desde ella', mandatory: true, basis: 'Art. 714' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/855-2/'
  },
  {
    id: 'tributario/correccion-voluntaria-de-la-declaracion-tributaria',
    exactName: 'Corrección voluntaria de la declaración tributaria',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 588 y 589',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Cuando la corrección aumenta el impuesto o disminuye el saldo a favor: tres (3) años siguientes al vencimiento del plazo para declarar, y siempre antes de que se notifique requerimiento especial o pliego de cargos, liquidando la sanción por corrección del art. 644 (E.T. art. 588, inciso modificado por el art. 107 de la Ley 2010 de 2019). Aun vencido ese término, la corrección es válida si se realiza dentro del término de respuesta al pliego de cargos o al emplazamiento para corregir (art. 588 par. 1). Cuando la corrección disminuye el valor a pagar o aumenta el saldo a favor: dentro del año (1) siguiente al vencimiento del término para presentar la declaración, presentando la respectiva declaración por el medio al que esté obligado el contribuyente (art. 589, modificado por el art. 274 de la Ley 1819 de 2016).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la declaración que se corrige y del período', mandatory: true, basis: 'Art. 588' },
      { n: 2, name: 'Determinación de si la corrección aumenta o disminuye el valor a pagar', mandatory: true, basis: 'Arts. 588 y 589' },
      { n: 3, name: 'Liquidación de la sanción por corrección, cuando proceda', mandatory: true, basis: 'Art. 644' },
      { n: 4, name: 'Soporte de los valores corregidos', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr024.html'
  },
  {
    id: 'tributario/respuesta-al-emplazamiento-para-corregir',
    exactName: 'Respuesta al emplazamiento para corregir',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 685 y 644',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Un (1) mes siguiente a la notificación del emplazamiento para que el emplazado corrija la declaración liquidando la sanción de corrección del art. 644. La no respuesta al emplazamiento no ocasiona sanción alguna (E.T. art. 685). Durante ese mes se suspende el término para notificar el requerimiento especial (art. 706).' },
    requiredSections: [
      { n: 1, name: 'Identificación del emplazamiento y del período', mandatory: true, basis: 'Art. 685' },
      { n: 2, name: 'Decisión de corregir o de sostener la declaración', mandatory: true, basis: 'Art. 685' },
      { n: 3, name: 'Explicación de las inconsistencias señaladas', mandatory: true, basis: 'Art. 685' },
      { n: 4, name: 'Liquidación de la sanción por corrección, si se corrige', mandatory: false, basis: 'Art. 644' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr028.html'
  },
  {
    id: 'tributario/respuesta-al-pliego-de-cargos',
    exactName: 'Respuesta al pliego de cargos',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 637 y 638',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del pliego de cargos y de la sanción propuesta', mandatory: true, basis: 'Art. 638' },
      { n: 2, name: 'Objeciones a cada cargo formulado', mandatory: true, basis: 'Art. 638' },
      { n: 3, name: 'Pruebas que se aportan o se solicitan', mandatory: true, basis: 'Art. 638' },
      { n: 4, name: 'Alegación de la reducción de la sanción, cuando proceda', mandatory: false, basis: 'Art. 640' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/707-2/'
  },
  {
    id: 'tributario/solicitud-de-revocatoria-directa-en-materia-tributaria',
    exactName: 'Solicitud de revocatoria directa en materia tributaria',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 736 a 738',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Dos (2) años contados a partir de la ejecutoria del correspondiente acto administrativo (E.T. art. 737), y solo procede si el contribuyente no interpuso los recursos por la vía gubernativa (art. 736). La Administración debe fallarla dentro de un (1) año contado desde la petición presentada en debida forma; vencido ese término sin decisión, opera silencio administrativo positivo a favor del solicitante (art. 738-1).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de que no se interpusieron los recursos por la vía gubernativa', mandatory: true, basis: 'Art. 736' },
      { n: 2, name: 'Identificación del acto cuya revocatoria se solicita', mandatory: true, basis: 'Art. 736' },
      { n: 3, name: 'Causal invocada: oposición a la Constitución o a la ley, o afectación del interés público', mandatory: true, basis: 'Art. 737' },
      { n: 4, name: 'Hechos y pruebas que la sustentan', mandatory: true, basis: 'Art. 737' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr030.html'
  },
  {
    id: 'tributario/solicitud-de-facilidad-de-pago',
    exactName: 'Solicitud de facilidad de pago',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 814 y 814-1',
    competentAuthority: 'Subdirección de Cobranzas de la DIAN o la dependencia competente',
    term: { status: 'NO_CADUCA', description: 'El Estatuto Tributario no fija término de caducidad para solicitarla: no caduca. Puede pedirse en cualquier etapa del procedimiento administrativo coactivo (art. 841), mientras la obligación sea exigible y no haya prescrito la acción de cobro (cinco (5) años, art. 817). El plazo que puede concederse es de hasta cinco (5) años con garantía, o hasta un (1) año sin garantía cuando el deudor no incumplió facilidades durante el año anterior a la solicitud (E.T. art. 814, incisos modificados por el art. 81 de la Ley 2277 de 2022). El otorgamiento de la facilidad interrumpe la prescripción de la acción de cobro (art. 818).' },
    requiredSections: [
      { n: 1, name: 'Identificación de las obligaciones cuya facilidad se solicita', mandatory: true, basis: 'Art. 814' },
      { n: 2, name: 'Plazo solicitado y propuesta de amortización', mandatory: true, basis: 'Art. 814' },
      { n: 3, name: 'Garantías ofrecidas o bienes para respaldar la deuda', mandatory: true, basis: 'Art. 814' },
      { n: 4, name: 'Relación de bienes del deudor', mandatory: true, basis: 'Art. 814' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr033.html'
  },
  {
    id: 'tributario/excepciones-contra-el-mandamiento-de-pago-en-cobro-coactivo',
    exactName: 'Excepciones contra el mandamiento de pago en cobro coactivo',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 830, 831 y 834',
    competentAuthority: 'Funcionario ejecutor de la DIAN',
    term: { status: 'VERIFICADO', description: 'Quince (15) días siguientes a la notificación del mandamiento de pago, término dentro del cual el deudor debe pagar o proponer por escrito las excepciones del art. 831 (E.T. art. 830). El funcionario competente decide sobre ellas dentro del mes siguiente a la presentación del escrito (art. 832). Contra la resolución que las rechaza solo procede reposición ante el Jefe de la División de Cobranzas, dentro del mes siguiente a su notificación, y quien tiene un mes para resolverla (art. 834, modificado por el art. 80 de la Ley 6 de 1992).' },
    requiredSections: [
      { n: 1, name: 'Identificación del mandamiento de pago y su fecha de notificación', mandatory: true, basis: 'Art. 830' },
      { n: 2, name: 'Excepción invocada entre las taxativas del art. 831', mandatory: true, basis: 'Art. 831' },
      { n: 3, name: 'Hechos y pruebas que la sustentan', mandatory: true, basis: 'Art. 831' },
      { n: 4, name: 'Petición de que se declare probada y cese el procedimiento de cobro', mandatory: true, basis: 'Art. 834' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr033.html'
  },
  {
    id: 'tributario/solicitud-de-conciliacion-contencioso-administrativa-tributaria',
    exactName: 'Solicitud de conciliación contencioso-administrativa tributaria',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario y leyes de conciliación tributaria vigentes',
    competentAuthority: 'Comité de Conciliación y Defensa Judicial de la DIAN',
    term: { status: 'VERIFICADO', description: 'La conciliación tributaria no es una figura permanente del Estatuto Tributario: solo existe cuando una ley o decreto transitorio la autoriza. La habilitación aplicable en 2026 fue el art. 6 del Decreto Legislativo 240 del 12 de marzo de 2026, que exigía que la solicitud «sea presentada ante la Dirección de Impuestos y Aduanas Nacionales -DIAN hasta el día treinta (30) de junio de 2026», respecto de demandas de nulidad y restablecimiento del derecho presentadas antes del 31 de diciembre de 2025 y admitidas. ESE PLAZO YA VENCIÓ: al 14 de agosto de 2026 no hay ventana de conciliación abierta. ADVERTENCIA DE PROVISIONALIDAD: el Decreto 240 de 2026 es decreto legislativo expedido al amparo del Estado de Emergencia declarado por el Decreto Legislativo 150 de 2026 y está sujeto a control automático de constitucionalidad, cuyo resultado no se pudo confirmar; su antecesor, el Decreto 1474 de 2025, fue declarado inexequible con efectos modulados por la Sentencia C-079 de 2026.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso judicial en curso y de su estado', mandatory: true, basis: null },
      { n: 2, name: 'Identificación del acto administrativo demandado', mandatory: true, basis: null },
      { n: 3, name: 'Fórmula conciliatoria propuesta con la liquidación correspondiente', mandatory: true, basis: null },
      { n: 4, name: 'Prueba del pago de los valores no conciliables', mandatory: true, basis: null },
      { n: 5, name: 'Acreditación del cumplimiento de los requisitos de la ley que autoriza la conciliación', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=273176'
  },
  {
    id: 'tributario/objecion-al-acta-de-inspeccion-tributaria',
    exactName: 'Objeción al acta de inspección tributaria',
    branch: 'TRIBUTARIO',
    role: 'LITIGANTE',
    legalBasis: 'Estatuto Tributario, arts. 779 y 782',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'NO_CADUCA', description: 'Los artículos 779 (inspección tributaria) y 782 (inspección contable) no fijan término alguno para objetar el acta: no opera caducidad autónoma para controvertirla. El acta no es un acto autónomo recurrible: cuando de la inspección se deriva una actuación administrativa, «el acta respectiva constituirá parte de la misma» (art. 779, modificado por el art. 137 de la Ley 223 de 1995), y frente a la inspección contable «se considera que los datos consignados en ella están fielmente tomados de los libros, salvo que el contribuyente o responsable demuestre su inconformidad» (art. 782, modificado por el art. 138 de la Ley 223 de 1995), sin plazo señalado. La contradicción se ejerce, en la práctica, dentro del término de respuesta del acto que el acta sustenta (v. gr. tres (3) meses para el requerimiento especial, art. 707).' },
    requiredSections: [
      { n: 1, name: 'Identificación del acta y del auto que decretó la inspección', mandatory: true, basis: 'Art. 779' },
      { n: 2, name: 'Hechos del acta que se objetan', mandatory: true, basis: 'Art. 779' },
      { n: 3, name: 'Pruebas que desvirtúan lo consignado', mandatory: true, basis: 'Art. 779' },
      { n: 4, name: 'Advertencia sobre la suspensión de términos que genera la inspección', mandatory: true, basis: 'Art. 710' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr031.html'
  },
  {
    id: 'tributario/requerimiento-especial',
    exactName: 'Requerimiento especial',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, arts. 703, 704 y 705',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Debe notificarse a más tardar dentro de los tres (3) años siguientes a la fecha de vencimiento del plazo para declarar. Si la declaración se presentó extemporáneamente, los tres años se cuentan desde su presentación; si hay saldo a favor, desde la solicitud de devolución o compensación (art. 705).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contribuyente, del impuesto y del período', mandatory: true, basis: 'Art. 704' },
      { n: 2, name: 'Cuantificación de los impuestos, anticipos, retenciones y sanciones que se pretende adicionar', mandatory: true, basis: 'Art. 703' },
      { n: 3, name: 'Explicación sumaria de las modificaciones propuestas', mandatory: true, basis: 'Art. 704' },
      { n: 4, name: 'Indicación del término de tres (3) meses para responder', mandatory: true, basis: 'Art. 707' },
      { n: 5, name: 'Constancia de notificación dentro del término del art. 705', mandatory: true, basis: 'Art. 705' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/705-2/'
  },
  {
    id: 'tributario/liquidacion-oficial-de-revision',
    exactName: 'Liquidación oficial de revisión',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, arts. 702, 710 y 711',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Debe notificarse dentro de los seis (6) meses siguientes al vencimiento del término para responder el requerimiento especial. El plazo se suspende tres (3) meses cuando se decreta inspección tributaria de oficio, mientras dure la inspección contable solicitada por el contribuyente, y dos (2) meses cuando la prueba solicitada no reposa en el expediente (art. 710).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contribuyente, del impuesto y del período', mandatory: true, basis: 'Art. 712' },
      { n: 2, name: 'Correspondencia con el requerimiento especial: no puede exceder sus glosas', mandatory: true, basis: 'Art. 711' },
      { n: 3, name: 'Análisis de la respuesta del contribuyente', mandatory: true, basis: 'Art. 712' },
      { n: 4, name: 'Liquidación de impuestos, anticipos, retenciones y sanciones', mandatory: true, basis: 'Art. 712' },
      { n: 5, name: 'Verificación del cómputo del término del art. 710 y de sus suspensiones', mandatory: true, basis: 'Art. 710' },
      { n: 6, name: 'Indicación de los recursos que proceden y del término de dos (2) meses', mandatory: true, basis: 'Art. 720' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/710-2/'
  },
  {
    id: 'tributario/liquidacion-oficial-de-aforo',
    exactName: 'Liquidación oficial de aforo',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, arts. 715, 716 y 717',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Cinco (5) años siguientes al vencimiento del plazo señalado para declarar, y solo una vez agotado el procedimiento de los artículos 643, 715 y 716 (E.T. art. 717). El emplazamiento previo por no declarar otorga al omiso un término perentorio de un (1) mes para presentar la declaración (art. 715); vencido sin declarar, se aplica la sanción por no declarar del art. 643 (art. 716).' },
    requiredSections: [
      { n: 1, name: 'Constancia del emplazamiento previo por no declarar', mandatory: true, basis: 'Art. 715' },
      { n: 2, name: 'Constancia de la resolución que impone la sanción por no declarar', mandatory: true, basis: 'Art. 716' },
      { n: 3, name: 'Determinación de la obligación tributaria del contribuyente que no declaró', mandatory: true, basis: 'Art. 717' },
      { n: 4, name: 'Fundamento de los factores tomados para el aforo', mandatory: true, basis: 'Art. 717' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr029.html'
  },
  {
    id: 'tributario/resolucion-que-resuelve-el-recurso-de-reconsideracion',
    exactName: 'Resolución que resuelve el recurso de reconsideración',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, arts. 732, 733 y 734',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'La Administración tiene un (1) año para resolver el recurso de reconsideración, contado a partir de su interposición en debida forma (art. 732).' },
    requiredSections: [
      { n: 1, name: 'Verificación de la oportunidad y de los requisitos del recurso', mandatory: true, basis: 'Art. 722' },
      { n: 2, name: 'Pronunciamiento sobre cada razón de inconformidad', mandatory: true, basis: 'Art. 732' },
      { n: 3, name: 'Valoración de las pruebas aportadas y practicadas', mandatory: true, basis: 'Art. 732' },
      { n: 4, name: 'Verificación del cumplimiento del término de un (1) año', mandatory: true, basis: 'Art. 732' },
      { n: 5, name: 'Decisión: confirma, modifica o revoca el acto recurrido', mandatory: true, basis: 'Art. 732' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/732-2/'
  },
  {
    id: 'tributario/emplazamiento-para-corregir',
    exactName: 'Emplazamiento para corregir',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, art. 685',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'NO_CADUCA', description: 'El artículo 685 no señala término para proferirlo: no opera caducidad propia de este acto. Su límite es externo: solo puede notificarse mientras esté vigente el término para notificar el requerimiento especial (tres (3) años, art. 705). Concede al emplazado un (1) mes para corregir liquidando la sanción del art. 644, y su no respuesta no ocasiona sanción alguna (art. 685). Su notificación suspende el término para notificar el requerimiento especial durante el mes siguiente (art. 706, sustituido por el art. 251 de la Ley 223 de 1995).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contribuyente y del período', mandatory: true, basis: 'Art. 685' },
      { n: 2, name: 'Indicios sobre la inexactitud de la declaración', mandatory: true, basis: 'Art. 685' },
      { n: 3, name: 'Invitación a corregir con la liquidación de la sanción reducida', mandatory: true, basis: 'Arts. 685 y 644' },
      { n: 4, name: 'Advertencia sobre la suspensión del término del art. 705', mandatory: true, basis: 'Art. 706' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr028.html'
  },
  {
    id: 'tributario/resolucion-sancion-tributaria',
    exactName: 'Resolución sanción tributaria',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, arts. 637, 638 y 640',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'Cuando la sanción se impone en resolución independiente, la Administración tiene seis (6) meses para aplicarla contados desde el vencimiento del término de respuesta del pliego de cargos, previa práctica de las pruebas a que hubiere lugar (E.T. art. 638, modificado por el art. 64 de la Ley 6 de 1992). El pliego de cargos previo debe formularse dentro de los dos (2) años siguientes a la fecha en que se presentó la declaración de renta y complementarios o de ingresos y patrimonio del período en que ocurrió o cesó la irregularidad sancionable; la sanción por no declarar, los intereses de mora y las sanciones de los arts. 659, 659-1 y 660 prescriben en cinco (5) años (art. 638). Cuando la sanción se impone en liquidación oficial, la facultad prescribe en el mismo término que existe para practicar esa liquidación (art. 638). Contra la resolución procede reconsideración dentro de los dos (2) meses siguientes a su notificación (art. 720).' },
    requiredSections: [
      { n: 1, name: 'Constancia del pliego de cargos previo y de su respuesta', mandatory: true, basis: 'Art. 638' },
      { n: 2, name: 'Conducta sancionable y norma que la tipifica', mandatory: true, basis: 'Art. 637' },
      { n: 3, name: 'Liquidación de la sanción y su base', mandatory: true, basis: 'Art. 637' },
      { n: 4, name: 'Aplicación de los principios de lesividad, proporcionalidad y gradualidad', mandatory: true, basis: 'Art. 640' },
      { n: 5, name: 'Indicación del recurso de reconsideración y de su término de dos (2) meses', mandatory: true, basis: 'Art. 720' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr026.html'
  },
  {
    id: 'tributario/mandamiento-de-pago-en-cobro-coactivo',
    exactName: 'Mandamiento de pago en cobro coactivo',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, arts. 823, 826 y 828',
    competentAuthority: 'Funcionario ejecutor de la DIAN',
    term: { status: 'NO_CADUCA', description: 'El artículo 826 no fija término para proferirlo: no opera caducidad de este acto. Su límite es la prescripción de la acción de cobro, que es de cinco (5) años contados desde el vencimiento del término para declarar, la presentación extemporánea, la presentación de la corrección o la ejecutoria del acto de determinación o discusión, según el caso (E.T. art. 817, modificado por el art. 53 de la Ley 1739 de 2014); la notificación del mandamiento de pago interrumpe esa prescripción (art. 818). El mandamiento se notifica personalmente previa citación para comparecer en un término de diez (10) días; si no comparece, se notifica por correo (art. 826). Debe indicar el término de quince (15) días para pagar o excepcionar (art. 830).' },
    requiredSections: [
      { n: 1, name: 'Identificación del título ejecutivo que presta mérito', mandatory: true, basis: 'Art. 828' },
      { n: 2, name: 'Determinación del monto: capital, intereses y sanciones', mandatory: true, basis: 'Art. 826' },
      { n: 3, name: 'Orden de pago al deudor', mandatory: true, basis: 'Art. 826' },
      { n: 4, name: 'Indicación del término para proponer excepciones', mandatory: true, basis: 'Art. 830' },
      { n: 5, name: 'Pronunciamiento sobre las medidas cautelares', mandatory: false, basis: 'Art. 837' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario_pr033.html'
  },
  {
    id: 'tributario/constancia-de-firmeza-de-la-declaracion-privada',
    exactName: 'Constancia de firmeza de la declaración privada',
    branch: 'TRIBUTARIO',
    role: 'DESPACHO',
    legalBasis: 'Estatuto Tributario, art. 714',
    competentAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)',
    term: { status: 'VERIFICADO', description: 'La declaración queda en firme si dentro de los tres (3) años siguientes al vencimiento del plazo para declarar no se notificó requerimiento especial. Si se presentó extemporáneamente, los tres años corren desde su presentación; con saldo a favor, desde la solicitud de devolución o compensación. En el régimen de precios de transferencia el término es de seis (6) años (art. 714).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la declaración, del impuesto y del período', mandatory: true, basis: 'Art. 714' },
      { n: 2, name: 'Fecha de vencimiento del plazo para declarar o de presentación extemporánea', mandatory: true, basis: 'Art. 714' },
      { n: 3, name: 'Constancia de que no se notificó requerimiento especial ni liquidación de revisión', mandatory: true, basis: 'Art. 714' },
      { n: 4, name: 'Verificación de si aplica el término especial de seis (6) años', mandatory: true, basis: 'Art. 714' }
    ],
    sourceUrl: 'https://actualicese.com/estatutotributario/714-2/'
  }
  ]
};
