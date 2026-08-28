import type { BranchCatalog } from '../types';

/**
 * INSOLVENCIA catalogue.
 *
 * Generated from research/actuaciones-insolvencia.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const INSOLVENCIA_CATALOG: BranchCatalog = {
  meta: {
    branch: 'INSOLVENCIA',
    verifiedAt: '2026-08-26',
    sourceOfTruth: 'Codigo General del Proceso, Titulo IV (arts. 531 a 576A), reescrito integramente por la Ley 2445 de 2025, vigente desde el 11 de febrero de 2025, con los yerros corregidos por el Decreto 1136 de 2025. Cobija a la persona natural no comerciante y, desde la reforma, tambien a la pequena comerciante con activos totales inferiores a 1.000 smlmv, excluidas vivienda familiar y vehiculo de trabajo: ese umbral, y ya no la calidad de no comerciante, es lo que separa esta rama de la insolvencia empresarial de la Ley 1116 de 2006 que vive en SOCIETARIO. El tramite de negociacion corre ante centros de conciliacion y notarias, pero siempre a traves de conciliadores inscritos en las listas (art. 533): la notaria es sede, no firmante. La competencia judicial es de unica instancia, del juez civil municipal si el capital de los pasivos no supera la menor cuantia y del circuito si es de mayor cuantia (art. 534).',
    gaps: [
    'INSOLVENCIA: ACTOS DE SECRETARÍA. No se abrieron fichas SECRETARÍA. La fase judicial de la liquidación patrimonial y de las controversias de los arts. 549, 552, 557 y 560 se surte ante jueces civiles y se rige por los actos de secretaría generales del CGP, que la rama CIVIL ya cataloga: \'Constancia de ejecutoria\' (art. 302), \'Estado para notificación de providencias\' (art. 295), \'Constancia de traslado en secretaría\' (art. 110), \'Emplazamiento y remisión al Registro Nacional de Personas Emplazadas\' (art. 108), \'Oficio de comunicación judicial\' (arts. 111 y 112). Duplicarlas produciría exact_name ambiguo. El único traslado propio del título, el del art. 567 sobre observaciones al inventario valorado, se corre por secretaría pero no tiene forma ni contenido distintos del art. 110. En la fase conciliatoria no hay secretaría: el conciliador comunica y certifica el mismo, y esas piezas quedaron como fichas de rol DESPACHO.',
    'INSOLVENCIA: FUNCIONES Y HONORARIOS DEL LIQUIDADOR (arts. 564 y 569). El liquidador es auxiliar de la justicia; sus informes y actas de gestión no son escritos de parte ni providencias, y sus honorarios se fijan \'de conformidad con lo regulado al respecto por el Consejo Superior de la Judicatura\' (art. 564 num. 1), reglamentación que no se leyó en fuente oficial. Se deja como hueco declarado en vez de inventar términos.',
    'INSOLVENCIA: TARIFAS Y GRATUIDAD DEL PROCEDIMIENTO (arts. 535 y 536). El art. 535, modificado por el art. 7 de la Ley 2445 de 2025 y corregido por el art. 5 del Decreto 1136 de 2025, ordena la gratuidad ante centros de conciliación de consultorios jurídicos y de entidades públicas y difiere al Ministerio de Justicia y del Derecho la reglamentación; el art. 536 remite al Gobierno la fijación de tarifas de centros y notarías. Sin esa reglamentación leída en fuente oficial no hay ficha con término verificable.',
    'INSOLVENCIA: ACUERDO DE NEGOCIACIÓN DE DEUDAS DENTRO DE LA LIQUIDACIÓN (art. 569, modificado por el art. 35 de la Ley 2445 de 2025) y ACUERDO DE ADJUDICACIÓN (art. 569A, adicionado por el art. 36). Son acuerdos de parte cuyo contenido remite íntegramente a los arts. 553, 554 y 570; sus reglas y plazos quedaron recogidos en las fichas \'Providencia de adjudicación\' y \'Auto que resuelve objeciones, aprueba inventarios y avalúos y cita a audiencia de adjudicación\'. Abrir fichas propias habría producido escritos con secciones idénticas a las del acuerdo de pago.',
    'INSOLVENCIA: INFORMACIÓN CREDITICIA (art. 573). Es un deber de reporte del conciliador o del juez a las bases de datos, no un escrito autónomo; quedó como sección obligatoria de las fichas de aceptación, apertura, convalidación y certificación de cumplimiento. Se deja constancia del término que si corre para el cliente: \'el término de caducidad del dato negativo empezará a contarse un (1) año después de la fecha de dicha providencia\'.',
    'INSOLVENCIA: PROCESOS EJECUTIVOS ALIMENTARIOS (art. 546) y TERCEROS GARANTES Y CODEUDORES (art. 547). Son reglas de excepción a los efectos de la aceptación, no actuaciones con escrito propio; su contenido se citó en las fichas correspondientes. Los procesos ejecutivos de alimentos siguen su curso y no se suspenden ni se levantan sus medidas cautelares.',
    'INSOLVENCIA, verificado el esta pasada: NORMA VIGENTE: Ley 1564 de 2012 (Código General del Proceso), Libro Tercero, Sección Tercera, TÍTULO IV, hoy titulado \'INSOLVENCIA DE LA PERSONA NATURAL NO COMERCIANTE Y DE LA PEQUEÑA COMERCIANTE\', arts. 531 a 576A. REFORMA VERIFICADA: la Ley 2445 de 2025 (11 de febrero de 2025, Diario Oficial 53.027 de 11 de febrero de 2025, disponible en la web de la Imprenta Nacional el 14 de febrero de 2025) reescribió el título entero: sus 45 artículos modifican los arts. 531, 532, 533, 534, 535, 537 (nums. 2 y 12 y parágrafo, más un num. 13 nuevo), 538, 539, 541, 542, 543, 544, 545, 548, 549, 550, 552, 553, 554 (nums. 1, 2, 3 y 6), 557, 558 (parágrafo), 559, 560, 561, 562 (num. 6), 563, 564, 565 (nums. 1 a 4 y 7 y parágrafo), 566, 567, 568, 569, 570, 571, 574 y 575, y ADICIONAN los arts. 539A, 569A, 570A, 571A, 572A y 576A. Su art. 45 dispone que rige desde su promulgación. Además, el Decreto 1136 de 2025 corrigió yerros: su art. 1 el epígrafe de la ley y sus arts. 2 a 12 varios incisos y numerales de los arts. 532, 533, 534, 535, 553, 557, 563 num. 4, 566 y 571. Todo se leyó en el texto consolidado oficial del CGP, no en el texto de la ley reformatoria aisladamente, y se contó la numeración del título: 52 artículos de 531 a 576A, sin huecos. RESPUESTA AL DATO CLAVE DEL ENCARGO -QUIEN ES COMPETENTE HOY-: CONFIRMADO, y la lectura del otro agente es correcta. El art. 533 vigente dice, literalmente: \'Conocerán de los procedimientos de negociación de deudas y convalidación de acuerdos de la'
    ]
  },
  actuaciones: [
  {
    id: 'insolvencia/solicitud-de-negociacion-de-deudas-de-persona-natural',
    exactName: 'Solicitud de negociación de deudas de persona natural',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 539 (requisitos de la solicitud), modificado por el art. 10 de la Ley 2445 de 2025; art. 538 (supuestos de insolvencia), modificado por el art. 9 de la Ley 2445 de 2025; art. 532 (ámbito de aplicación), modificado por el art. 4 de la Ley 2445 de 2025 y corregido por el art. 2 del Decreto 1136 de 2025; art. 533 (competencia), modificado por el art. 5 de la Ley 2445 de 2025 y corregido por el art. 3 del Decreto 1136 de 2025; art. 539A (núcleo familiar), adicionado por el art. 11 de la Ley 2445 de 2025; art. 574 (nuevo procedimiento), modificado por el art. 42 de la Ley 2445 de 2025',
    competentAuthority: 'NO ES EL JUEZ NI EL NOTARIO: es el CONCILIADOR. Art. 533: \'Conocerán de los procedimientos de negociación de deudas y convalidación de acuerdos de la persona natural los centros de conciliación del lugar del domicilio del deudor expresamente autorizados por el Ministerio de Justicia y del Derecho para adelantar este tipo de procedimientos, a través de los conciliadores inscritos en sus listas. Las notarías del lugar de domicilio del deudor lo harán a través de los conciliadores inscritos en las listas conformadas para el efecto de acuerdo con el reglamento. Los abogados conciliadores no podrán conocer directamente de estos procedimientos y en consecuencia, ellos solo podrán conocer de estos asuntos a través de la designación que realice el correspondiente centro de conciliación.\' Cuando en el municipio del domicilio del deudor no existan centros autorizados ni notaría con lista de conciliadores, el deudor podrá elegir cualquier centro autorizado o notaría del mismo circuito judicial o círculo notarial. Los centros autorizados y las notarías con conciliadores inscritos pueden adelantar el trámite virtualmente cualquiera que sea el domicilio del deudor, incluso si esta domiciliado en el exterior, si cuentan con la infraestructura tecnológica.',
    term: { status: 'VERIFICADO', description: 'No hay plazo para presentarla, pero hay tres relojes del deudor que deciden si es admisible. (1) PRESUPUESTO DE ACCESO, art. 538: \'Estará en cesación de pagos la persona natural que como deudor o garante incumpla el pago de dos (2) o más obligaciones a favor de dos (2) o más acreedores por más de noventa (90) días, o contra el cual se hayan iniciado dos (2) o más procedimientos públicos o privados de cobro de obligaciones dineradas, de ejecución especial o de restitución de bienes por mora en el pago de cánones. En cualquier caso, el valor porcentual de las obligaciones deberá representar no menos del treinta por ciento (30%) del pasivo total a su cargo\'; basta la declaración del deudor bajo juramento. (2) INHABILIDAD TEMPORAL, art. 574: quien cumplió un acuerdo de pago \'solo podrá solicitar un nuevo procedimiento de insolvencia una vez transcurridos cinco (5) años desde la fecha de cumplimiento total del acuerdo anterior\'; igual término para quien desistió, contado desde la aceptación del desistimiento; quien se beneficio de la mutación a obligaciones naturales del art. 571 num. 1 solo puede pedir nueva liquidación \'a los diez (10) años de iniciado el anterior proceso de liquidación\'; quien cubrio con sus bienes el total reconocido, a los cinco (5) años; y a quien se le negó ese beneficio, quince (15) años desde la apertura de la liquidación. (3) SUBSANACIÓN, art. 542: presentada la solicitud, el conciliador verifica requisitos dentro de los tres (3) días siguientes a la aceptación del cargo y, si adolece de defectos, \'otorgará al deudor un plazo de cinco (5) días para que la corrija. Si dentro del plazo otorgado el deudor no subsana los defectos de la solicitud, esta será rechazada\'. ÁMBITO: desde la Ley 2445 de 2025 el régimen cobija también a las personas naturales comerciantes con activos totales inferiores a mil (1.000) smlmv, excluida la vivienda familiar y el vehículo instrumento de trabajo, llamadas pequeñas comerciantes (art. 532). Asistencia con apoderado judicial obligatoria cuando se supere la mínima cuantía (art. 539).' },
    requiredSections: [
      { n: 1, name: 'Informe preciso de las causas que llevaron a la cesación de pagos', mandatory: true, basis: 'Art. 539 num. 1' },
      { n: 2, name: 'Propuesta para la negociación de deudas, clara, expresa y objetiva', mandatory: true, basis: 'Art. 539 num. 2' },
      { n: 3, name: 'Relación completa y actualizada de todos los acreedores, en el orden de prelación de créditos de los arts. 2488 y ss. del Código Civil, con datos, cuantía discriminada entre capital e intereses, tasas, documentos, fechas y codeudores', mandatory: true, basis: 'Art. 539 num. 3' },
      { n: 4, name: 'Relación completa y detallada de bienes, incluidos los del exterior, con gravámenes, medidas cautelares, afectación a vivienda familiar y patrimonio de familia, y documentos que la acrediten', mandatory: true, basis: 'Art. 539 num. 4' },
      { n: 5, name: 'Relación de procesos judiciales y de actuaciones administrativas o privadas de carácter patrimonial, con juzgado u oficina y estado actual', mandatory: true, basis: 'Art. 539 num. 5' },
      { n: 6, name: 'Certificación de ingresos del empleador o fondo de pensiones, o declaración si es trabajador independiente', mandatory: true, basis: 'Art. 539 num. 6' },
      { n: 7, name: 'Monto de los recursos disponibles para el pago, descontados los gastos de subsistencia, de conservación de bienes y del procedimiento', mandatory: true, basis: 'Art. 539 num. 7' },
      { n: 8, name: 'Información sobre sociedad conyugal o patrimonial vigente o liquidada en los dos años anteriores, con la escritura o sentencia', mandatory: true, basis: 'Art. 539 num. 8' },
      { n: 9, name: 'Discriminación de las obligaciones alimentarias, con cuantía y beneficiarios, y certificado del Redam', mandatory: true, basis: 'Art. 539 num. 9' },
      { n: 10, name: 'Constancia de matrícula mercantil, si el solicitante es pequeño comerciante', mandatory: false, basis: 'Art. 539 num. 10' },
      { n: 11, name: 'Manifestación expresa, bajo juramento, de no haber incurrido en omisiones o imprecisiones', mandatory: true, basis: 'Art. 539 parágrafo 1' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html'
  },
  {
    id: 'insolvencia/subsanacion-de-la-solicitud-de-negociacion-de-deudas',
    exactName: 'Subsanación de la solicitud de negociación de deudas',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 542 (decisión de la solicitud de negociación), modificado por el art. 13 de la Ley 2445 de 2025; art. 539 (requisitos que deben quedar cumplidos), modificado por el art. 10 de la Ley 2445 de 2025; art. 541 (designación y aceptación del conciliador), modificado por el art. 12 de la Ley 2445 de 2025',
    competentAuthority: 'El conciliador designado por el centro de conciliación o por la notaría, ante quien se presenta la subsanación y quien decide. Contra el rechazo \'solo procederá el recurso de reposición ante el mismo conciliador\' (art. 542): no hay apelación ni intervención del juez en esta fase.',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días, y su vencimiento produce el rechazo. Art. 542: \'Dentro de los tres (3) días siguientes a la aceptación del cargo, el conciliador verificará si la solicitud cumple con los requisitos legales. Si la solicitud no cumple con alguna de las exigencias requeridas, el conciliador inmediatamente señalará los defectos de que adolezca y otorgará al deudor un plazo de cinco (5) días para que la corrija. Si dentro del plazo otorgado el deudor no subsana los defectos de la solicitud, esta será rechazada. Contra esta decisión solo procederá el recurso de reposición ante el mismo conciliador.\' Los tres días de verificación son del CONCILIADOR y corren desde que acepta el cargo, no desde la radicación; los cinco días de subsanación son del DEUDOR. Antes de ambos corren dos plazos que el deudor no controla: el centro designa conciliador \'al día siguiente a la presentación de la solicitud\' y este manifiesta su aceptación \'dentro de los dos (2) días siguientes a la notificación del encargo, so pena de ser excluido de la lista\' (art. 541).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la solicitud y del conciliador que señaló los defectos', mandatory: true, basis: 'Art. 542' },
      { n: 2, name: 'Enumeración de cada defecto señalado', mandatory: true, basis: 'Art. 542' },
      { n: 3, name: 'Corrección o complemento concreto de cada uno, con el documento faltante', mandatory: true, basis: 'Arts. 539 y 542' },
      { n: 4, name: 'Petición de que se tenga por subsanada y se acepte la solicitud', mandatory: true, basis: 'Arts. 542 y 543' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html'
  },
  {
    id: 'insolvencia/relacion-actualizada-de-obligaciones-bienes-y-procesos-del-deudor-insolvente',
    exactName: 'Relación actualizada de obligaciones, bienes y procesos del deudor insolvente',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 545 num. 4 (deber de actualización tras la aceptación), modificado por el art. 16 de la Ley 2445 de 2025; art. 548 (la comunicación a los acreedores depende de esta actualización), modificado por el art. 17 de la Ley 2445 de 2025; art. 571 num. 1 (pérdida del beneficio de mutación a obligaciones naturales por omisión de actualizar), modificado por el art. 39 de la Ley 2445 de 2025 y corregido por el art. 12 del Decreto 1136 de 2025',
    competentAuthority: 'Se presenta ante el conciliador del centro de conciliación o de la notaría que conoce del procedimiento',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días, y omitirlo puede costarle al deudor el beneficio central del régimen. Art. 545 num. 4: \'Dentro de los cinco (5) días siguientes a la aceptación del trámite de negociación de deudas el deudor deberá presentar una relación actualizada de sus obligaciones, bienes y procesos, en la que deberá incluir todas sus acreencias causadas al día inmediatamente anterior a la aceptación, conforme al orden de prefación legal previsto en el Código Civil. La ausencia de esta actualización se tendrá como manifestación de que la relación presentada con la solicitud no ha variado.\' El mismo numeral impone informar cualquier cambio relevante de la situación económica entre la aceptación y la apertura de la liquidación, y cualquier cambio de domicilio, residencia o direcciones de notificación. El reloj que mata el derecho esta en otro artículo: según el art. 571 num. 1, el saldo insoluto NO mutara a obligación natural si el juez encuentra, en incidente promovido por cualquier acreedor, que el deudor omitió dolosamente información relevante o \'que durante el trámite de la negociación de deudas o de la convalidación de acuerdos privados se abstuvo de actualizar la información que dispone el numeral 4 del artículo 545\'. Además, el conciliador solo comunica la aceptación a los acreedores \'a más tardar al día siguiente a aquel en que reciba la información actualizada\' (art. 548): sin actualización, el procedimiento no avanza.' },
    requiredSections: [
      { n: 1, name: 'Identificación del procedimiento y de la fecha de aceptación de la solicitud', mandatory: true, basis: 'Art. 545 num. 4' },
      { n: 2, name: 'Relación de todas las acreencias causadas al día inmediatamente anterior a la aceptación, en el orden de prelación legal', mandatory: true, basis: 'Art. 545 num. 4' },
      { n: 3, name: 'Relación actualizada de bienes', mandatory: true, basis: 'Art. 545 num. 4' },
      { n: 4, name: 'Relación actualizada de procesos y actuaciones de cobro', mandatory: true, basis: 'Art. 545 num. 4' },
      { n: 5, name: 'Informe de cualquier cambio relevante en la situación de crisis económica', mandatory: true, basis: 'Art. 545 num. 4' },
      { n: 6, name: 'Actualización de domicilio, residencia y direcciones física y electrónica de notificación', mandatory: true, basis: 'Art. 545 num. 4' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html'
  },
  {
    id: 'insolvencia/objecion-a-la-relacion-de-acreencias-en-la-negociacion-de-deudas',
    exactName: 'Objeción a la relación de acreencias en la negociación de deudas',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 550 nums. 2 a 4 (planteamiento de la objeción en la audiencia), modificado por el art. 19 de la Ley 2445 de 2025; art. 552 (sustentación escrita, pruebas y decisión judicial), modificado por el art. 20 de la Ley 2445 de 2025; art. 534 (juez competente), modificado por el art. 6 de la Ley 2445 de 2025 y corregido por el art. 4 del Decreto 1136 de 2025',
    competentAuthority: 'La objeción se plantea ante el CONCILIADOR en la audiencia y se sustenta por escrito ante el, pero la resuelve el JUEZ: \'Los escritos presentados, junto con las pruebas allegadas por las partes y el acta correspondiente al día en que las objeciones fueron planteadas, serán remitidos de manera inmediata por el conciliador al juez, quien, previo decreto y práctica de pruebas, incluidas las que de oficio disponga, las resolverá mediante auto que no admite recurso, y ordenará la devolución de las diligencias al conciliador\' (art. 552). Es competente, en única instancia, el juez civil del domicilio del deudor o del lugar donde se adelante el procedimiento: municipal si el capital de los pasivos relacionados no supera la menor cuantía, del circuito si es de mayor cuantía (art. 534).',
    term: { status: 'VERIFICADO', description: 'Dos plazos encadenados y ambos del objetante. Primero, la objeción debe PLANTEARSE EN LA AUDIENCIA: el conciliador pone en conocimiento la relación detallada de acreencias y pregunta si hay discrepancias, y \'si no se presentaren objeciones, ella constituirá la relación definitiva de acreencias\' (art. 550 num. 2). Segundo, la sustentación: art. 552, \'Si no se conciliaren las objeciones en la audiencia, el conciliador la suspenderá por una única vez, durante diez (10) días, para que dentro de los cinco (5) primeros días inmediatamente siguientes a la suspensión, los objetantes presenten ante el y por escrito la objeción, junto con las pruebas que pretendan hacer valer y las que pidan al juez.\' Los cinco días siguientes son de la contraparte y de los titulares de los créditos objetados. \'La sustentación no podrá versar sobre objeciones diferentes a las manifestadas de manera precisa en la audiencia\', y \'si dentro del término a que alude el inciso primero de esta disposición no se sustentaren por escrito las objeciones, quedará en firme la relación de acreencias hecha por el conciliador y la audiencia continuará al décimo día siguiente a aquel en que se hubiere suspendido\'. Las obligaciones no objetadas, y las objetadas y conciliadas, quedan en firme al suspenderse la audiencia. El auto del juez no admite recurso.' },
    requiredSections: [
      { n: 1, name: 'Identificación del procedimiento, del objetante y de la audiencia en que se planteo la objeción', mandatory: true, basis: 'Art. 552' },
      { n: 2, name: 'Individualización de cada crédito objetado', mandatory: true, basis: 'Art. 550 num. 2' },
      { n: 3, name: 'Motivo de la objeción: existencia, naturaleza, cuantía o calificación del crédito', mandatory: true, basis: 'Art. 550 num. 2' },
      { n: 4, name: 'Sustentación limitada a las objeciones manifestadas de manera precisa en la audiencia', mandatory: true, basis: 'Art. 552' },
      { n: 5, name: 'Pruebas que se aportan y las que se piden al juez', mandatory: true, basis: 'Art. 552' },
      { n: 6, name: 'Petición concreta sobre la relación definitiva de acreencias', mandatory: true, basis: 'Art. 552' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/impugnacion-del-acuerdo-de-pago',
    exactName: 'Impugnación del acuerdo de pago',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 557 (causales y trámite de la impugnación del acuerdo o de su reforma), modificado por el art. 23 de la Ley 2445 de 2025 y corregido por el art. 9 del Decreto 1136 de 2025; art. 553 (reglas del acuerdo), modificado por el art. 21 de la Ley 2445 de 2025; art. 563 num. 2 (la nulidad no saneada abre la liquidación patrimonial), modificado por el art. 29 de la Ley 2445 de 2025',
    competentAuthority: 'Se anuncia ante el conciliador en la audiencia y se sustenta por escrito ante el, pero la resuelve el juez civil municipal o del circuito según la cuantía de los pasivos (art. 534). \'Los escritos presentados serán remitidos de manera inmediata por el conciliador al juez, quien resolverá sobre la impugnación\' (art. 557).',
    term: { status: 'VERIFICADO', description: 'El plazo se juega en dos actos y perderlo cierra el ataque al acuerdo. Art. 557: \'Los acreedores disidentes deberán impugnar el acuerdo en la misma audiencia en que este se haya votado, anunciando concretamente sus reparos al texto aprobado. El impugnante sustentará su inconformidad por escrito ante el conciliador dentro de los cinco (5) días siguientes a la audiencia, limitando sus alegatos a los motivos presentados en la audiencia y allegando las pruebas que pretenda hacer valer, so pena de ser considerada desierta. Vencido este término, correrá uno igual para que el deudor y los demás acreedores se pronuncien por escrito sobre la sustentación y aporten las pruebas documentales a que hubiere lugar.\' Los primeros cinco días son del IMPUGNANTE, los cinco siguientes de la contraparte. Solo puede impugnar el acreedor DISIDENTE, y solo por las seis causales del art. 557: violación del orden legal de prelación; privilegios dentro de una misma clase o quebranto de la igualdad; no comprender a todos los acreedores anteriores a la aceptación; cualquier otra cláusula contraria a la Constitución o a la ley; falta de la mayoría necesaria; y dación en pago al acreedor garantizado por un valor que difiera en más del diez por ciento (10%) del que defina el juez. Si se invoca la causal 6 el juez puede decretar pericia a costa del impugnante. Riesgo: la nulidad no saneada del acuerdo abre la liquidación patrimonial (art. 563 num. 2).' },
    requiredSections: [
      { n: 1, name: 'Identificación del acuerdo o de su reforma, de la audiencia de votación y del voto disidente', mandatory: true, basis: 'Art. 557' },
      { n: 2, name: 'Constancia de los reparos anunciados concretamente en la audiencia', mandatory: true, basis: 'Art. 557' },
      { n: 3, name: 'Causal invocada de las seis del art. 557', mandatory: true, basis: 'Art. 557' },
      { n: 4, name: 'Sustentación limitada a los motivos presentados en la audiencia', mandatory: true, basis: 'Art. 557' },
      { n: 5, name: 'Pruebas que se allegan', mandatory: true, basis: 'Art. 557' },
      { n: 6, name: 'Petición concreta de nulidad total o parcial del acuerdo', mandatory: true, basis: 'Arts. 557 y 563' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/solicitud-de-convalidacion-de-acuerdo-privado-de-la-persona-natural',
    exactName: 'Solicitud de convalidación de acuerdo privado de la persona natural',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 562 (convalidación del acuerdo privado; su num. 6 fue modificado por el art. 28 de la Ley 2445 de 2025); art. 533 (competencia), modificado por el art. 5 de la Ley 2445 de 2025; art. 539 (requisitos de la solicitud), modificado por el art. 10 de la Ley 2445 de 2025; arts. 553 y 554 (requisitos que debe reunir el acuerdo privado); art. 574 (nuevo procedimiento), modificado por el art. 42 de la Ley 2445 de 2025',
    competentAuthority: 'Centro de conciliación autorizado por el Ministerio de Justicia y del Derecho o notaría del domicilio del deudor, en ambos casos A TRAVÉS DEL CONCILIADOR inscrito en las listas: el art. 533 atribuye a esos organismos los procedimientos \'de negociación de deudas y convalidación de acuerdos de la persona natural\'. Las controversias que se susciten y la providencia de convalidación corresponden al juez civil municipal o del circuito según la cuantía (art. 534).',
    term: { status: 'VERIFICADO', description: 'El presupuesto de acceso es un pronostico con plazo, distinto del de la negociación de deudas. Art. 562: \'La persona natural no comerciante que por la pérdida de su empleo, la disolución y liquidación de la sociedad conyugal o de otras circunstancias similares, enfrente dificultades para la atención de su pasivo, que se traduzcan en una cesación de pagos dentro de los siguientes 120 días, podrá solicitar que se convalide el acuerdo privado que hubiere celebrado con un número plural de acreedores que representen más del sesenta por ciento (60%) del monto total del capital de sus obligaciones.\' Es decir, aquí NO se exige estar ya en cesación de pagos: se exige que se prevea dentro de los ciento veinte (120) días siguientes. Reglas propias que cambian el cálculo del cliente: la aceptación de la solicitud NO produce los efectos de los numerales 1, 2 y 5 del art. 545 ni los del art. 547 -no suspende ejecuciones ni descuentos de nómina-, y esos efectos \'solo se producirán a partir de la providencia que lo convalide\' (num. 3); los acreedores que suscribieron el acuerdo no pueden objetar ni impugnar (num. 4); y el acuerdo convalidado obliga a todos, incluso a quienes no concurrieron o votaron en contra (num. 5). Si el juez no convalida, esa decisión \'impedirá que el deudor presente una nueva solicitud de convalidación durante el término previsto en el artículo 574\', aunque podrá pedir negociación de deudas o liquidación patrimonial directa si ya esta en cesación de pagos (num. 6).' },
    requiredSections: [
      { n: 1, name: 'Los mismos requisitos del art. 539, salvo que el acuerdo privado reemplaza la propuesta del numeral 2', mandatory: true, basis: 'Art. 562 num. 1' },
      { n: 2, name: 'Acuerdo privado por escrito, reconocido ante autoridad judicial o notarial por quienes lo suscriben', mandatory: true, basis: 'Art. 562 num. 2' },
      { n: 3, name: 'Demostración de que los suscriptores representan más del sesenta por ciento del capital de las obligaciones', mandatory: true, basis: 'Art. 562' },
      { n: 4, name: 'Acreditación de la circunstancia que hace previsible la cesación de pagos dentro de los 120 días siguientes', mandatory: true, basis: 'Art. 562' },
      { n: 5, name: 'Cumplimiento en el acuerdo de la totalidad de los requisitos de los arts. 553 y 554', mandatory: true, basis: 'Art. 562 num. 2' },
      { n: 6, name: 'Relación de los acreedores que no suscribieron el acuerdo', mandatory: true, basis: 'Arts. 539 num. 3 y 562 num. 5' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/solicitud-de-reforma-del-acuerdo-de-pago',
    exactName: 'Solicitud de reforma del acuerdo de pago',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 556 (reforma del acuerdo); art. 560 (reforma forzada por incumplimiento), modificado por el art. 26 de la Ley 2445 de 2025; art. 553 (reglas del acuerdo), modificado por el art. 21 de la Ley 2445 de 2025',
    competentAuthority: 'Conciliador del centro de conciliación o de la notaría que conocio del procedimiento inicial. \'Cuando el centro de conciliación o la notaría ante la que se desarrollo el trámite de negociación de deudas hubiere dejado de existir la solicitud podrá ser presentada ante cualquier otro centro o notaría\' (art. 556).',
    term: { status: 'VERIFICADO', description: 'No hay plazo de caducidad para pedir la reforma, pero si legitimación y una audiencia con reglas estrictas. Art. 556: \'El acuerdo podrá ser objeto de reformas posteriores a solicitud del deudor o de un grupo de acreedores que represente por lo menos una cuarta parte de los créditos insolutos, conforme a la certificación que para el efecto expida el conciliador producida con el reporte de pagos que para el efecto le presente el deudor... Aceptada dicha solicitud, el conciliador comunicará a los acreedores en la forma prevista para la aceptación de la solicitud y los citará a audiencia de reforma del acuerdo dentro de los diez (10) días siguientes... En esta audiencia no se admitirán suspensiones.\' La prohibición de suspender es el dato que cambia la preparación del escrito: todo debe estar probado antes. \'Si no se logra dicha aprobación, continuará vigente el acuerdo anterior.\' Cuando la reforma es la consecuencia de un incumplimiento declarado, el reloj es otro: el conciliador cita a audiencia \'dentro de los diez (10) días hábiles siguientes al recibo de dicha solicitud\' y, \'si al cabo de la audiencia de reforma no se modifica el acuerdo, el conciliador remitirá el proceso al juez civil de conocimiento para que decrete la apertura del proceso de liquidación patrimonial\' (art. 560).' },
    requiredSections: [
      { n: 1, name: 'Identificación del acuerdo vigente y del procedimiento en que se celebró', mandatory: true, basis: 'Art. 556' },
      { n: 2, name: 'Legitimación: calidad de deudor o certificación de representar al menos una cuarta parte de los créditos insolutos', mandatory: true, basis: 'Art. 556' },
      { n: 3, name: 'Actualización de la relación definitiva de acreedores', mandatory: true, basis: 'Art. 556' },
      { n: 4, name: 'Información sobre fechas y condiciones de los pagos ya realizados', mandatory: true, basis: 'Art. 556' },
      { n: 5, name: 'Propuesta concreta de modificación', mandatory: true, basis: 'Art. 556' },
      { n: 6, name: 'Pruebas, teniendo en cuenta que en la audiencia de reforma no se admiten suspensiones', mandatory: true, basis: 'Art. 556' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/denuncia-de-incumplimiento-del-acuerdo-de-pago',
    exactName: 'Denuncia de incumplimiento del acuerdo de pago',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 560 (incumplimiento del acuerdo), modificado por el art. 26 de la Ley 2445 de 2025; art. 556 (procedimiento de reforma al que remite); art. 563 num. 3 (apertura de la liquidación), modificado por el art. 29 de la Ley 2445 de 2025',
    competentAuthority: 'Se presenta por escrito ante el conciliador, que cita a audiencia. Las diferencias sobre la ocurrencia del incumplimiento las resuelve el juez civil municipal o del circuito según la cuantía, \'de plano sobre el asunto, mediante auto que no admite ningún recurso\' (art. 560).',
    term: { status: 'VERIFICADO', description: 'Dos plazos, y el segundo tiene sanción de desistimiento. Art. 560: \'Si el deudor no cumple las obligaciones convenidas en el acuerdo de pago, cualquiera de los acreedores o el mismo deudor, informarán por escrito de dicha situación al conciliador, dando cuenta precisa de los hechos constitutivos de incumplimiento. Dentro de los diez (10) días hábiles siguientes al recibo de dicha solicitud el conciliador citará a audiencia a fin de revisar y estudiar por una sola vez la reforma del acuerdo de pago.\' Si en la audiencia hay diferencias no conciliadas, el conciliador suspende \'para que quien haya alegado el incumplimiento formule su queja por escrito dentro de los cinco (5) días siguientes, junto con la correspondiente sustentación y las pruebas que pretenda hacer valer. Vencido este término, correrá uno igual para que el deudor o los restantes acreedores se pronuncien.\' Y la sanción: \'Si dentro del término a que alude el inciso anterior no se presentare el escrito de sustentación, se entenderá desistida la inconformidad y se continuará la ejecución del acuerdo.\' Los diez días hábiles son del CONCILIADOR; los cinco días de sustentación son del denunciante. Probado el incumplimiento, se va a reforma del acuerdo; si la reforma no se logra, el conciliador remite al juez para que decrete la liquidación patrimonial, y si tras la modificación el deudor incumple de nuevo, el juez decreta la liquidación en el mismo auto que declare el incumplimiento.' },
    requiredSections: [
      { n: 1, name: 'Identificación del acuerdo y del procedimiento', mandatory: true, basis: 'Art. 560' },
      { n: 2, name: 'Cuenta precisa de los hechos constitutivos de incumplimiento', mandatory: true, basis: 'Art. 560' },
      { n: 3, name: 'Obligaciones incumplidas, con fechas y montos', mandatory: true, basis: 'Art. 560' },
      { n: 4, name: 'Sustentación escrita dentro de los cinco días siguientes a la suspensión de la audiencia', mandatory: true, basis: 'Art. 560' },
      { n: 5, name: 'Pruebas que se pretenden hacer valer', mandatory: true, basis: 'Art. 560' },
      { n: 6, name: 'Petición de reforma del acuerdo o de apertura de la liquidación patrimonial', mandatory: true, basis: 'Arts. 560 y 563' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/solicitud-de-liquidacion-patrimonial-de-persona-natural',
    exactName: 'Solicitud de liquidación patrimonial de persona natural',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 563 (apertura de la liquidación patrimonial), modificado por el art. 29 de la Ley 2445 de 2025 y corregido en su num. 4 por el art. 10 del Decreto 1136 de 2025; art. 534 (competencia de la jurisdicción ordinaria civil), modificado por el art. 6 de la Ley 2445 de 2025 y corregido por el art. 4 del Decreto 1136 de 2025; art. 539 (requisitos aplicables, excepto su num. 2); art. 564 (providencia de apertura), modificado por el art. 30 de la Ley 2445 de 2025; art. 574 (inhabilidad temporal), modificado por el art. 42 de la Ley 2445 de 2025',
    competentAuthority: 'JUEZ CIVIL, no el conciliador ni la notaría. Art. 534: \'De las controversias previstas en los artículos 549, 552, 557 y 560 conocerá, en única instancia, el juez civil del domicilio del deudor o en su defecto del domicilio en donde se adelante el procedimiento de negociación de deudas o convalidación del acuerdo. Cuando el monto total del capital de los pasivos relacionados por el deudor en la solicitud no supere la menor cuantía, la competencia será del juez municipal, y cuando sea de mayor cuantía lo será el del circuito. En los mismos términos, dichos jueces serán competentes para conocer del procedimiento de liquidación patrimonial.\' El juez que conozca la primera controversia conoce privativamente de todas las demás, sin reparto (art. 534 parágrafo).',
    term: { status: 'VERIFICADO', description: 'La liquidación se abre por cuatro caminos y solo uno es voluntario. Art. 563: por fracaso de la negociación del acuerdo de pago; como consecuencia de la nulidad no saneada del acuerdo o de su reforma forzada por un primer incumplimiento; por incumplimiento del acuerdo que no pudo subsanarse; y \'por solicitud de la persona natural al juez competente, independientemente de si tiene o no bienes o de si estos son suficientes o no para cubrir su pasivo total. En este caso, a la solicitud le serán aplicables los artículos 539, excepto su numeral 2, y 539A, excepto su parágrafo.\' Es decir, la liquidación directa no exige propuesta de pago. El reloj que puede cerrar la puerta es el del art. 574: quien se beneficio de la mutación de saldos a obligaciones naturales \'solo podrá presentar una nueva solicitud de liquidación judicial o patrimonial a los diez (10) años de iniciado el anterior proceso de liquidación\'; quien cubrio con sus bienes el total reconocido, a los cinco (5) años; y a quien se le negó ese beneficio, \'transcurridos quince (15) años contados a partir de la apertura de la liquidación\'. Nota de gasto: \'a menos que en el inventario hubiera recursos en efectivo que pudieran destinarse al efecto, el deudor correrá con los gastos de la liquidación\' (art. 564 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Informe de las causas de la cesación de pagos', mandatory: true, basis: 'Arts. 539 num. 1 y 563 num. 4' },
      { n: 2, name: 'Relación completa de acreedores en el orden de prelación legal', mandatory: true, basis: 'Art. 539 num. 3' },
      { n: 3, name: 'Relación detallada de bienes, con gravámenes, medidas cautelares y afectaciones', mandatory: true, basis: 'Art. 539 num. 4' },
      { n: 4, name: 'Relación de procesos y actuaciones de cobro', mandatory: true, basis: 'Art. 539 num. 5' },
      { n: 5, name: 'Certificación de ingresos', mandatory: true, basis: 'Art. 539 num. 6' },
      { n: 6, name: 'Información sobre sociedad conyugal o patrimonial', mandatory: true, basis: 'Art. 539 num. 8' },
      { n: 7, name: 'Discriminación de obligaciones alimentarias y certificado del Redam', mandatory: true, basis: 'Art. 539 num. 9' },
      { n: 8, name: 'Solicitud de designación del propio deudor como liquidador, si procede el amparo de pobreza o la coadyuvan acreedores que representen más del 65% del capital', mandatory: false, basis: 'Art. 564 num. 1' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/presentacion-de-creditos-en-la-liquidacion-patrimonial',
    exactName: 'Presentación de créditos en la liquidación patrimonial',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 566 (término para hacerse parte y presentación de objeciones), modificado por el art. 32 de la Ley 2445 de 2025 y corregido en su inciso 2 por el art. 11 del Decreto 1136 de 2025; art. 564 num. 2 (aviso a los acreedores y publicación en prensa), modificado por el art. 30 de la Ley 2445 de 2025; art. 572A (créditos legalmente postergados), adicionado por el art. 41 de la Ley 2445 de 2025',
    competentAuthority: 'Juez civil municipal o del circuito que conoce de la liquidación patrimonial, según la cuantía de los pasivos (art. 534)',
    term: { status: 'VERIFICADO', description: 'Hasta el VIGÉSIMO DÍA SIGUIENTE A LA PUBLICACIÓN EN PRENSA, no a la providencia de apertura. Art. 566: \'A partir de la providencia de admisión y hasta el vigésimo día siguiente a la publicación en prensa del aviso que de cuenta de la apertura de la liquidación, los acreedores que no hubieren sido parte dentro del procedimiento de negociación de deudas deberán presentarse personalmente al proceso o por medio de apoderado judicial, presentando prueba siquiera sumaria de la existencia de su crédito.\' El aviso lo pública el liquidador dentro de los cinco (5) días siguientes a su posesión (art. 564 num. 2), de modo que el punto de partida depende de un acto ajeno que el acreedor debe vigilar. Vencido el plazo, \'el juez, por medio de auto que no tiene recursos, correrá traslado de los escritos recibidos y de la relación de acreencias actualizada por el liquidador por un término de cinco (5) días, para que los acreedores y el deudor presenten objeciones y acompañen las pruebas que pretendan hacer valer. Vencido este término, correrá uno igual para que se contradigan las objeciones\'. Advertencia sobre la calidad del crédito: por el art. 572A quedan postergados y sin derecho de voto -salvo los del numeral 1- los créditos del cónyuge y parientes hasta el cuarto grado de consanguinidad, segundo de afinidad o único civil; los intereses y sanciones legales o pactadas; y los de quien adelanto cobranzas sabiendo que el deudor ya estaba admitido al procedimiento.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de liquidación patrimonial y del deudor', mandatory: true, basis: 'Art. 566' },
      { n: 2, name: 'Identificación del acreedor y poder, si comparece por apoderado judicial', mandatory: true, basis: 'Art. 566' },
      { n: 3, name: 'Individualización del crédito: capital, intereses, naturaleza y clase en la prelación legal', mandatory: true, basis: 'Arts. 539 num. 3 y 566' },
      { n: 4, name: 'Prueba siquiera sumaria de la existencia del crédito', mandatory: true, basis: 'Art. 566' },
      { n: 5, name: 'Manifestación sobre garantías, codeudores o procesos en curso', mandatory: true, basis: 'Art. 547' },
      { n: 6, name: 'Manifestación sobre la eventual postergación del crédito', mandatory: false, basis: 'Art. 572A' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/observaciones-al-inventario-valorado-de-bienes-del-deudor-insolvente',
    exactName: 'Observaciones al inventario valorado de bienes del deudor insolvente',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 567 (traslado del inventario valorado), modificado por el art. 33 de la Ley 2445 de 2025; art. 568 (providencia que lo resuelve y cita a audiencia de adjudicación), modificado por el art. 34 de la Ley 2445 de 2025; art. 564 num. 3 (plazo del liquidador para actualizar el inventario), modificado por el art. 30 de la Ley 2445 de 2025; art. 570A (venta de bienes), adicionado por el art. 38 de la Ley 2445 de 2025',
    competentAuthority: 'Juez civil municipal o del circuito que conoce de la liquidación patrimonial (art. 534)',
    term: { status: 'VERIFICADO', description: 'Diez (10) días, mediante auto que no admite recursos, y cinco (5) más para el pronunciamiento cruzado. Art. 567: \'Del inventario valorado presentado por el liquidador el juez correrá traslado a las partes por diez (10) días por medio de auto que no admite recursos, para que presenten observaciones y si lo estiman pertinente, alleguen un avalúo diferente. De tales observaciones inmediatamente se correrá traslado por secretaría a las demás partes interesadas, por el término de cinco (5) días, para que se pronuncien sobre las observaciones presentadas. El juez resolverá sobre el inventario valorado en el mismo auto que cita a audiencia de adjudicación.\' El plazo previo es del liquidador, que debe actualizar el inventario valorado \'dentro de los veinte (20) días siguientes a su posesión\' (art. 564 num. 3). Por que importa el avalúo y no solo el inventario: en firme el auto que lo aprueba, cualquier interesado puede ofrecer comprar bienes \'a un valor igual o superior al de la valoración aprobada\' (art. 570A), y la dación en pago al acreedor garantizado por un valor que difiera en más del diez por ciento del que defina el juez es causal de impugnación del acuerdo (art. 557 num. 6). Un avalúo bajo que no se objeta en estos diez días fija el precio de todo lo que sigue.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y del inventario valorado objeto de observaciones', mandatory: true, basis: 'Art. 567' },
      { n: 2, name: 'Observaciones concretas sobre inclusión, exclusión o descripción de bienes', mandatory: true, basis: 'Art. 567' },
      { n: 3, name: 'Observaciones sobre la valoración de cada bien', mandatory: true, basis: 'Art. 567' },
      { n: 4, name: 'Avalúo diferente que se allega, si se estima pertinente', mandatory: false, basis: 'Art. 567' },
      { n: 5, name: 'Petición concreta sobre el inventario y su valoración', mandatory: true, basis: 'Arts. 567 y 568' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/oferta-de-compra-de-bienes-en-la-liquidacion-patrimonial',
    exactName: 'Oferta de compra de bienes en la liquidación patrimonial',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 570A (venta de bienes del deudor), adicionado por el art. 38 de la Ley 2445 de 2025; art. 567 (aprobación del inventario valorado), modificado por el art. 33 de la Ley 2445 de 2025; art. 571 num. 1 (pérdida del beneficio del deudor que impida la venta), modificado por el art. 39 de la Ley 2445 de 2025 y corregido por el art. 12 del Decreto 1136 de 2025',
    competentAuthority: 'Juez civil municipal o del circuito que conoce de la liquidación patrimonial (art. 534). El depósito judicial se constituye a órdenes del juez.',
    term: { status: 'VERIFICADO', description: 'Ventana precisa: se abre con la firmeza del auto que aprueba el inventario valorado y se cierra con la presentación de un acuerdo. Art. 570A: \'En firme el auto que aprueba el inventario valorado de los bienes del deudor y antes de que se presente un acuerdo de negociación de deudas o un acuerdo de adjudicación, cualquier interesado podrá presentar, directamente o a través de apoderado, oferta de compra de uno, varios o todos ellos, a un valor igual o superior al de la valoración aprobada, a la que adjuntará el original del depósito judicial de la suma ofrecida, a órdenes del juez.\' El depósito debe acompañar la oferta: no hay oferta sin título. Luego, \'mediante auto contra el que no cabe recurso, el juez correrá traslado de todas las ofertas durante cinco (5) días a los acreedores, el deudor y el liquidador, al cabo del cual decidirá mediante auto contra el que cabe recurso de reposición. Durante el término del traslado, cualquiera de los acreedores podrá hacer oferta o mejorar la ya realizada, acompañando el depósito judicial del monto ofrecido o del mayor valor.\' Si hay varios oferentes sobre un mismo bien el juez resuelve cual es el más conveniente y, en igualdad de condiciones, \'lo adjudicará a quien primero haya radicado la oferta\': la hora de radicación decide. El deudor esta obligado a cooperar con los interesados, y quien impida u obstaculice la venta pierde el beneficio de mutación de saldos a obligaciones naturales (art. 571 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de liquidación y del oferente', mandatory: true, basis: 'Art. 570A' },
      { n: 2, name: 'Identificación de los bienes ofrecidos, según el inventario valorado aprobado', mandatory: true, basis: 'Art. 570A' },
      { n: 3, name: 'Precio ofrecido, igual o superior al de la valoración aprobada', mandatory: true, basis: 'Art. 570A' },
      { n: 4, name: 'Original del depósito judicial de la suma ofrecida, a órdenes del juez', mandatory: true, basis: 'Art. 570A' },
      { n: 5, name: 'Poder, si se actúa por apoderado', mandatory: false, basis: 'Art. 570A' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/solicitud-de-verificacion-del-cumplimiento-del-acuerdo-de-pago',
    exactName: 'Solicitud de verificación del cumplimiento del acuerdo de pago',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 558 (cumplimiento del acuerdo), con parágrafo adicionado por el art. 24 de la Ley 2445 de 2025; art. 574 (término para un nuevo procedimiento), modificado por el art. 42 de la Ley 2445 de 2025; art. 573 (información crediticia)',
    competentAuthority: 'Conciliador del centro de conciliación o de la notaría que conocio del procedimiento, quien expide la certificación y comunica a los jueces de los procesos ejecutivos',
    term: { status: 'VERIFICADO', description: 'El deudor pide la verificación al vencer el plazo del acuerdo, y de ella dependen tres consecuencias. Art. 558: \'Vencido el término previsto en el acuerdo para su cumplimiento, el deudor solicitará al conciliador la verificación de su cumplimiento, para lo cual discriminará la forma en que las obligaciones fueron satisfechas, acompañando los documentos que den cuenta de ello. El conciliador comunicará a los acreedores a fin de que dentro de los cinco (5) días siguientes se pronuncien con relación a tal hecho. Si el acreedor guarda silencio, se entenderá que consintió en lo afirmado por el deudor. Si el acreedor discute lo afirmado por el deudor, se seguirá el trámite previsto para el incumplimiento del acuerdo.\' Los cinco días son de los ACREEDORES y su silencio favorece al deudor. Verificado el cumplimiento, el conciliador expide la certificación y comunica a los jueces de los procesos ejecutivos contra el deudor o contra terceros codeudores o garantes \'a fin de que los den por terminados\'. Y el reloj largo: \'El deudor podrá solicitar el inicio de un nuevo trámite de negociación de deudas, únicamente después de transcurridos cinco (5) años desde la fecha de cumplimiento total del acuerdo anterior, con base en la certificación expedida por el conciliador\' (arts. 558 y 574). El parágrafo adicionado permite pedir verificación y certificación parcial respecto de algunos acreedores, pero en ese caso el conciliador verificará además \'el cumplimento del acuerdo en todo lo que haya sido pactado hasta la fecha de la verificación\'.' },
    requiredSections: [
      { n: 1, name: 'Identificación del acuerdo de pago y de la fecha de vencimiento de su plazo', mandatory: true, basis: 'Art. 558' },
      { n: 2, name: 'Discriminación de la forma en que cada obligación fue satisfecha', mandatory: true, basis: 'Art. 558' },
      { n: 3, name: 'Documentos que acreditan los pagos', mandatory: true, basis: 'Art. 558' },
      { n: 4, name: 'Relación de los procesos ejecutivos suspendidos cuya terminación se busca', mandatory: true, basis: 'Art. 558' },
      { n: 5, name: 'Petición de expedición de la certificación de cumplimiento', mandatory: true, basis: 'Arts. 558 y 574' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/demanda-de-accion-revocatoria-concursal',
    exactName: 'Demanda de acción revocatoria concursal',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 572 (acciones revocatorias y de simulación en los procedimientos de insolvencia de persona natural); art. 534 parágrafo (competencia privativa del mismo juez); art. 568 num. 3 (decisión de las acciones revocatorias en la providencia de resolución de objeciones), modificado por el art. 34 de la Ley 2445 de 2025; art. 571 num. 1 (efecto sobre la mutación a obligaciones naturales), modificado por el art. 39 de la Ley 2445 de 2025',
    competentAuthority: '\'La solicitud de revocatoria concursal prevista en este artículo seguirá el trámite del proceso verbal sumario, y de ella conocerá el mismo juez que conoce de las objeciones, la impugnación del acuerdo, el incumplimiento o la liquidación patrimonial, sin que sea necesario nuevo reparto\' (art. 572): juez civil municipal o del circuito según la cuantía de los pasivos (art. 534).',
    term: { status: 'VERIFICADO', description: 'CADUCIDAD ATADA AL PROCEDIMIENTO, no a un plazo de años: \'Podrá solicitar la revocatoria cualquier acreedor anterior al inicio del procedimiento de negociación de deudas, convalidación del acuerdo privado o liquidación patrimonial, según fuere el caso, y solo podrá interponerse durante el trámite de dichos procedimientos, so pena de caducidad\' (art. 572). Terminado el procedimiento, la acción se pierde. Los periodos sospechosos, contados hacia atrás desde la aceptación, son tres: dieciocho (18) meses para \'los contratos a título oneroso, la constitución de hipotecas, prendas, y en general todo acto a título oneroso que implique transferencia, disposición, limitación o desmembración del dominio sobre bienes que representen más del diez por ciento (10%) del total de sus activos\'; veinticuatro (24) meses para todo acto a título gratuito celebrado en perjuicio de los acreedores; y veinticuatro (24) meses para los actos entre cónyuges o compañeros permanentes y las separaciones de bienes de común acuerdo, siempre que hayan causado perjuicio. En el acto oneroso la revocatoria exige además probar el daño a los acreedores y que el tercero adquirente \'conocia o debia conocer el mal estado de los negocios del deudor\'. La providencia que declare la revocatoria \'solo beneficiará a los acreedores que fueren reconocidos dentro del procedimiento respectivo\', y al acreedor que la promueva con éxito se le reconoce como recompensa el diez por ciento (10%) del valor recuperado.' },
    requiredSections: [
      { n: 1, name: 'Identificación del procedimiento de insolvencia en curso y prueba de ser acreedor anterior a su inicio', mandatory: true, basis: 'Art. 572' },
      { n: 2, name: 'Identificación del acto que se pide revocar o declarar simulado, con su fecha', mandatory: true, basis: 'Art. 572' },
      { n: 3, name: 'Encuadramiento en uno de los tres supuestos y dentro del periodo de dieciocho o veinticuatro meses', mandatory: true, basis: 'Art. 572' },
      { n: 4, name: 'Demostración del daño causado a los acreedores', mandatory: true, basis: 'Art. 572' },
      { n: 5, name: 'Demostración de que el tercero conocia o debia conocer el mal estado de los negocios del deudor, en los actos onerosos', mandatory: true, basis: 'Art. 572' },
      { n: 6, name: 'Pretensiones, incluida la recompensa del diez por ciento del valor recuperado', mandatory: true, basis: 'Art. 572' },
      { n: 7, name: 'Petición de pruebas conforme al proceso verbal sumario', mandatory: true, basis: 'Arts. 390 y 572' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/decision-de-aceptacion-de-la-solicitud-de-negociacion-de-deudas',
    exactName: 'Decisión de aceptación de la solicitud de negociación de deudas',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 543 (aceptación de la solicitud y fijación de la audiencia), modificado por el art. 14 de la Ley 2445 de 2025; art. 545 (efectos de la aceptación), modificado por el art. 16 de la Ley 2445 de 2025; art. 542 (verificación previa), modificado por el art. 13 de la Ley 2445 de 2025; art. 573 (reporte a las bases de datos crediticias)',
    competentAuthority: 'El CONCILIADOR designado por el centro de conciliación o por la notaría; no el notario y no el juez. Art. 533: los centros de conciliación autorizados conocen \'a través de los conciliadores inscritos en sus listas\' y las notarías \'lo harán a través de los conciliadores inscritos en las listas conformadas para el efecto\'.',
    term: { status: 'VERIFICADO', description: 'Diez (10) días para la audiencia. Art. 543: \'Una vez el conciliador verifique el cumplimiento de los requisitos en la solicitud de negociación de deudas, el conciliador designado por el centro de conciliación, según fuere el caso, la aceptará, dará inicio al procedimiento de negociación de deudas y fijará fecha para audiencia de negociación dentro de los diez (10) días siguientes a la aceptación de la solicitud.\' Si el deudor es persona comerciante, \'en la providencia se dispondrá su inscripción inmediata en el registro mercantil de la cámara de comercio del domicilio del deudor\'. Y una regla de preclusión que corre contra los acreedores: \'Las controversias relacionadas con la aceptación de la solicitud de negociación de deudas solamente se podrán proponer al iniciarse la primera sesión de la audiencia correspondiente\' (parágrafo 2), en concordancia con el art. 550 num. 1, según el cual, si no se presentan reparos contra la aceptación, \'se considerará saneada cualquier irregularidad que se hubiera presentado en ella\'. Desde la aceptación corren los efectos del art. 545: prohibición de nuevos procesos de ejecución y suspensión de los existentes, suspensión de descuentos de nómina y libranzas, prohibición de suspender servicios públicos domiciliarios, e interrupción de la prescripción.' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor solicitante y del procedimiento', mandatory: true, basis: 'Art. 543' },
      { n: 2, name: 'Constancia de verificación del cumplimiento de los requisitos del art. 539', mandatory: true, basis: 'Arts. 542 y 543' },
      { n: 3, name: 'Decisión de aceptar la solicitud y de dar inicio al procedimiento', mandatory: true, basis: 'Art. 543' },
      { n: 4, name: 'Fijación de fecha y hora de la audiencia de negociación, dentro de los diez días siguientes', mandatory: true, basis: 'Art. 543' },
      { n: 5, name: 'Orden de inscripción en el registro mercantil, si el deudor es persona comerciante', mandatory: false, basis: 'Art. 543 parágrafo 1' },
      { n: 6, name: 'Advertencia de los efectos del art. 545 y del deber de actualización en cinco días', mandatory: true, basis: 'Art. 545' },
      { n: 7, name: 'Reporte a las entidades que administran bases de datos crediticias', mandatory: true, basis: 'Art. 573' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html'
  },
  {
    id: 'insolvencia/comunicacion-de-la-aceptacion-de-la-solicitud-a-los-acreedores',
    exactName: 'Comunicación de la aceptación de la solicitud a los acreedores',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 548 (comunicación de la aceptación y oficios a jueces y pagadores), modificado por el art. 17 de la Ley 2445 de 2025; art. 545 nums. 1 y 2 (efectos que se comunican), modificado por el art. 16 de la Ley 2445 de 2025; art. 108 (Registro Nacional de Personas Emplazadas)',
    competentAuthority: 'El conciliador. Los destinatarios son los acreedores relacionados por el deudor y, además, \'los jueces de conocimiento de los procesos de ejecución y restitución y a los servidores públicos y empleados privados encargados de los cobros coactivos y contractuales de obligaciones dineradas y de los descuentos de nómina\' (art. 548).',
    term: { status: 'VERIFICADO', description: 'Un (1) día, contado desde un hecho que depende del deudor. Art. 548: \'A más tardar al día siguiente a aquel en que reciba la información actualizada de las acreencias por parte del deudor, el conciliador comunicará a todos los acreedores relacionados por el deudor la aceptación de la solicitud, adjuntando copia de la misma y de sus anexos, e indicándoles la fecha en que se llevará a cabo la audiencia de negociación de deudas.\' No corre desde la aceptación sino desde la actualización del art. 545 num. 4, que el deudor debe presentar dentro de los cinco días siguientes a aquella. En la misma oportunidad el conciliador oficia a jueces y pagadores para que se sujeten a los efectos de la aceptación, y esos destinatarios deben realizar control de legalidad y \'dejara sin efecto cualquier actuación que se haya adelantado en su despacho público o privado o por parte de funcionario comisionado o particular mandatario con posterioridad a la aceptación\', incluida la orden de restituir al deudor los bienes secuestrados o retenidos después de ella. Cuando el deudor ignore el lugar donde puede ser citado un acreedor, \'la citación se entenderá cumplida con la inscripción de la decisión de aceptación de la solicitud en el Registro Nacional de Personas Emplazadas de que trata el artículo 108 de este código\'.' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor, del procedimiento y del conciliador', mandatory: true, basis: 'Art. 548' },
      { n: 2, name: 'Comunicación de la aceptación, con copia de la solicitud y de sus anexos', mandatory: true, basis: 'Art. 548' },
      { n: 3, name: 'Fecha, hora y medio de realización de la audiencia de negociación', mandatory: true, basis: 'Arts. 543 y 548' },
      { n: 4, name: 'Oficio a los jueces de los procesos de ejecución y restitución', mandatory: true, basis: 'Art. 548' },
      { n: 5, name: 'Oficio a los encargados de cobros coactivos y de descuentos de nómina y libranzas', mandatory: true, basis: 'Arts. 545 num. 2 y 548' },
      { n: 6, name: 'Inscripción en el Registro Nacional de Personas Emplazadas, cuando se ignore el lugar de citación de un acreedor', mandatory: false, basis: 'Art. 548 parágrafo' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr018.html'
  },
  {
    id: 'insolvencia/acta-de-la-audiencia-de-negociacion-de-deudas',
    exactName: 'Acta de la audiencia de negociación de deudas',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 550 (desarrollo de la audiencia y suscripción del acta), modificado por el art. 19 de la Ley 2445 de 2025; art. 551 (suspensión de la audiencia); art. 544 (duración del procedimiento), modificado por el art. 15 de la Ley 2445 de 2025; art. 553 (acuerdo de pago), modificado por el art. 21 de la Ley 2445 de 2025',
    competentAuthority: 'Conciliador del centro de conciliación o de la notaría. \'De la audiencia se levantará un acta que será suscrita por el conciliador y el deudor. El original del acta y sus modificaciones deberán reposar en los archivos del centro de conciliación o de la notaría\' (art. 550 num. 8). Firma el CONCILIADOR, no el notario.',
    term: { status: 'VERIFICADO', description: 'El acta se levanta en la audiencia, que debe celebrarse dentro de los diez (10) días siguientes a la aceptación (art. 543) y desarrollarse dentro del término total del procedimiento: sesenta (60) días desde la firmeza de la aceptación, prorrogables por treinta (30) días más a solicitud conjunta del deudor y de cualquier acreedor con quien se hayan conciliado definitivamente sus derechos y, para el deudor comerciante, hasta por otros noventa (90) días con el voto favorable de la mayoría (art. 544). Ese término se suspende mientras se tramitan las controversias que deba resolver la jurisdicción ordinaria civil y durante la vacancia judicial. Suspensiones internas: el conciliador puede suspender la audiencia las veces necesarias, reanudandola \'a más tardar dentro de los diez (10) días siguientes\', pero \'las deliberaciones no podrán extenderse más allá del término legal para la celebración del acuerdo, so pena de que el procedimiento se de por fracasado\' (art. 551). Y una carga del deudor con sanción inmediata: \'La inasistencia del deudor o su apoderado a dos citaciones a audiencia consecutivas, no justificadas dentro de los tres (3) días siguientes, será causal de fracaso de la negociación\', salvo que los acreedores presentes en la segunda reunión fallida que representen más del cincuenta por ciento (50%) de los créditos dispongan continuarla (art. 550 parágrafo).' },
    requiredSections: [
      { n: 1, name: 'Fecha, hora y forma de realización de la audiencia, y constancia de asistentes', mandatory: true, basis: 'Art. 550' },
      { n: 2, name: 'Pregunta a los acreedores sobre reparos jurídicos a la decisión de aceptación y su decisión', mandatory: true, basis: 'Art. 550 num. 1' },
      { n: 3, name: 'Puesta en conocimiento de la relación detallada de acreencias y pregunta sobre existencia, naturaleza y cuantía', mandatory: true, basis: 'Art. 550 num. 2' },
      { n: 4, name: 'Constancia de las discrepancias, de las formulas de arreglo propuestas y de las objeciones no conciliadas', mandatory: true, basis: 'Art. 550 nums. 3 y 4' },
      { n: 5, name: 'Relación definitiva de acreencias', mandatory: true, basis: 'Art. 550 num. 2' },
      { n: 6, name: 'Exposición de la propuesta de pago del deudor y opiniones de los acreedores', mandatory: true, basis: 'Art. 550 nums. 6 y 7' },
      { n: 7, name: 'Constancia de la votación y del acuerdo alcanzado, o de su ausencia', mandatory: true, basis: 'Arts. 550 y 553' },
      { n: 8, name: 'Constancia del término transcurrido y de las suspensiones decretadas', mandatory: true, basis: 'Arts. 544 y 551' },
      { n: 9, name: 'Firma del conciliador y del deudor', mandatory: true, basis: 'Art. 550 num. 8' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/acta-de-fracaso-de-la-negociacion-de-deudas',
    exactName: 'Acta de fracaso de la negociación de deudas',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 559 (fracaso de la negociación), modificado por el art. 25 de la Ley 2445 de 2025; art. 549 (fracaso por mora en gastos de administración), modificado por el art. 18 de la Ley 2445 de 2025; art. 550 parágrafo (fracaso por inasistencia), modificado por el art. 19 de la Ley 2445 de 2025; art. 551 (fracaso por extenderse las deliberaciones); art. 561 (efectos), modificado por el art. 27 de la Ley 2445 de 2025',
    competentAuthority: 'El conciliador declara el fracaso y remite. La apertura de la liquidación la decreta el juez civil de conocimiento: municipal si el capital de los pasivos no supera la menor cuantía, del circuito si es de mayor cuantía (art. 534).',
    term: { status: 'VERIFICADO', description: 'El fracaso se declara al vencer el término del art. 544 o antes, en tres supuestos, y la consecuencia es inmediata. Art. 559: \'Si transcurrido el término previsto en el artículo 544 no se celebra el acuerdo de pago, el conciliador declarará el fracaso de la negociación e inmediatamente remitirá las diligencias al juez civil de conocimiento, para que decrete la apertura del proceso de liquidación patrimonial. El conciliador también declarará el fracaso cuando en el transcurso de la audiencia se haya efectuado una votación formal que no alcance la mayoría de los votos, a menos que el deudor manifieste que mejorará su propuesta de pago, y el término previsto en el citado artículo 544 no haya vencido.\' Los otros dos supuestos: la inasistencia del deudor o su apoderado a dos citaciones consecutivas no justificadas dentro de los tres (3) días siguientes (art. 550 parágrafo), y el incumplimiento en el pago de los gastos de administración, caso en el cual el conciliador \'dejara constancia de todo ello en el acta de fracaso y remitirá lo actuado al juez competente, quien decretará la apertura de la liquidación patrimonial si esta conforme con la conclusión del conciliador. En caso de no estarlo, así lo declarará mediante auto que no admite recurso y devolverá la actuación al conciliador para que continue con la audiencia\' (art. 549). El fracaso \'dará lugar a la apertura del procedimiento de liquidación patrimonial\' (art. 561): no hay archivo del asunto.' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor, del procedimiento y de la fecha de firmeza de la aceptación', mandatory: true, basis: 'Art. 544' },
      { n: 2, name: 'Causal de fracaso: vencimiento del término, votación sin mayoría, inasistencia o mora en gastos de administración', mandatory: true, basis: 'Arts. 549, 550, 551 y 559' },
      { n: 3, name: 'Cómputo del término del art. 544, con prórrogas y suspensiones', mandatory: true, basis: 'Art. 544' },
      { n: 4, name: 'Relación definitiva de acreencias y estado de las objeciones', mandatory: true, basis: 'Arts. 550 y 552' },
      { n: 5, name: 'Declaración de fracaso de la negociación', mandatory: true, basis: 'Art. 559' },
      { n: 6, name: 'Orden de remisión inmediata de las diligencias al juez civil de conocimiento', mandatory: true, basis: 'Arts. 559 y 561' },
      { n: 7, name: 'Firma del conciliador', mandatory: true, basis: 'Art. 550 num. 8' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/certificacion-de-cumplimiento-del-acuerdo-de-pago',
    exactName: 'Certificación de cumplimiento del acuerdo de pago',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 558 (cumplimiento del acuerdo y expedición de la certificación), con parágrafo adicionado por el art. 24 de la Ley 2445 de 2025; art. 574 (uso de la certificación para un nuevo procedimiento), modificado por el art. 42 de la Ley 2445 de 2025; art. 573 (información crediticia)',
    competentAuthority: 'Conciliador del centro de conciliación o de la notaría que conocio del procedimiento. La certificación se comunica a los jueces que conocen de los procesos ejecutivos contra el deudor o contra los terceros codeudores o garantes.',
    term: { status: 'VERIFICADO', description: 'La certificación se expide una vez verificado el cumplimiento, tras dar a los acreedores cinco (5) días para pronunciarse, con silencio a favor del deudor (art. 558). Sus efectos: \'Verificado el cumplimiento, el conciliador expedirá la certificación correspondiente, y comunicará a los jueces que conocen de los procesos ejecutivos contra el deudor o contra los terceros codeudores o garantes, a fin de que los den por terminados. El deudor podrá solicitar el inicio de un nuevo trámite de negociación de deudas, únicamente después de transcurridos cinco (5) años desde la fecha de cumplimiento total del acuerdo anterior, con base en la certificación expedida por el conciliador.\' La fecha que consigne la certificación es, por tanto, el punto de partida del plazo de cinco años del art. 574. Si el acreedor discute lo afirmado por el deudor, no se certifica: \'se seguirá el trámite previsto para el incumplimiento del acuerdo\' (art. 560). El parágrafo adicionado permite certificaciones parciales respecto de algunos acreedores, pero obliga a verificar también el cumplimiento del acuerdo en todo lo pactado hasta la fecha de la verificación. Además, el conciliador debe reportar el cumplimiento a las entidades que administran bases de datos crediticias (art. 573).' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor, del acuerdo y del procedimiento', mandatory: true, basis: 'Art. 558' },
      { n: 2, name: 'Constancia de la solicitud del deudor y de la discriminación de pagos aportada', mandatory: true, basis: 'Art. 558' },
      { n: 3, name: 'Constancia de la comunicación a los acreedores y del vencimiento de los cinco días', mandatory: true, basis: 'Art. 558' },
      { n: 4, name: 'Declaración de cumplimiento total o parcial y su alcance', mandatory: true, basis: 'Art. 558 y parágrafo' },
      { n: 5, name: 'Fecha de cumplimiento total, como punto de partida del término de cinco años', mandatory: true, basis: 'Arts. 558 y 574' },
      { n: 6, name: 'Comunicación a los jueces de los procesos ejecutivos para que los den por terminados', mandatory: true, basis: 'Art. 558' },
      { n: 7, name: 'Reporte a las entidades que administran bases de datos crediticias', mandatory: true, basis: 'Art. 573' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/auto-que-resuelve-las-objeciones-a-la-relacion-de-acreencias',
    exactName: 'Auto que resuelve las objeciones a la relación de acreencias',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 552 (decisión sobre objeciones), modificado por el art. 20 de la Ley 2445 de 2025; art. 534 (competencia y única instancia), modificado por el art. 6 de la Ley 2445 de 2025; art. 544 (suspensión del término del procedimiento mientras decide el juez), modificado por el art. 15 de la Ley 2445 de 2025; art. 167 (carga de la prueba)',
    competentAuthority: 'Juez civil del domicilio del deudor o del lugar donde se adelante el procedimiento, en ÚNICA INSTANCIA: municipal si el capital de los pasivos relacionados no supera la menor cuantía, del circuito si es de mayor cuantía (art. 534). El juez que conozca la primera controversia conoce privativamente de todas las demás, sin reparto.',
    term: { status: 'VERIFICADO', description: 'El auto se profiere previo decreto y práctica de pruebas y NO ADMITE RECURSO. Art. 552: \'Los escritos presentados, junto con las pruebas allegadas por las partes y el acta correspondiente al día en que las objeciones fueron planteadas, serán remitidos de manera inmediata por el conciliador al juez, quien, previo decreto y práctica de pruebas, incluidas las que de oficio disponga, las resolverá mediante auto que no admite recurso, y ordenará la devolución de las diligencias al conciliador.\' Mientras el juez decide, el término de sesenta días del procedimiento se suspende y \'se reanudará a partir de la fecha en que la audiencia se reinicie por convocatoria que hará el conciliador al recibir la decisión judicial\' (art. 544). Recibida la decisión, el conciliador señala fecha y hora para continuar la audiencia y la comunica en la misma forma prevista para la aceptación. Regla probatoria expresa: \'En la evaluación probatoria, el juez tendrá en cuenta lo dispuesto en el artículo 167, y valorará las pruebas bajo las reglas de la sana critica, aplicando el principio de esencia sobre forma\' (art. 552 parágrafo).' },
    requiredSections: [
      { n: 1, name: 'Identificación del procedimiento, del deudor y del conciliador remitente', mandatory: true, basis: 'Art. 552' },
      { n: 2, name: 'Relación de las objeciones planteadas en la audiencia y de las sustentadas por escrito', mandatory: true, basis: 'Art. 552' },
      { n: 3, name: 'Decreto y práctica de pruebas, incluidas las de oficio', mandatory: true, basis: 'Art. 552' },
      { n: 4, name: 'Valoración probatoria bajo la sana critica y el principio de esencia sobre forma', mandatory: true, basis: 'Art. 552 parágrafo' },
      { n: 5, name: 'Decisión sobre cada crédito objetado', mandatory: true, basis: 'Art. 552' },
      { n: 6, name: 'Orden de devolución de las diligencias al conciliador', mandatory: true, basis: 'Art. 552' },
      { n: 7, name: 'Advertencia de que el auto no admite recurso', mandatory: true, basis: 'Art. 552' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/providencia-de-apertura-de-la-liquidacion-patrimonial',
    exactName: 'Providencia de apertura de la liquidación patrimonial',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 563 (eventos de apertura), modificado por el art. 29 de la Ley 2445 de 2025 y corregido en su num. 4 por el art. 10 del Decreto 1136 de 2025; art. 564 (contenido de la providencia de apertura), modificado por el art. 30 de la Ley 2445 de 2025; art. 565 (efectos), cuyos numerales 1, 2, 3, 4 y 7 y parágrafo fueron modificados por el art. 31 de la Ley 2445 de 2025; art. 573 (información crediticia)',
    competentAuthority: 'Juez civil municipal si el capital de los pasivos relacionados no supera la menor cuantía, o juez civil del circuito si es de mayor cuantía, del domicilio del deudor o del lugar donde se adelanto la negociación (art. 534)',
    term: { status: 'VERIFICADO', description: 'La providencia fija cuatro relojes distintos, y solo uno es del juez. Art. 564: nombra liquidador y dos suplentes y fija sus honorarios provisionales; ordena al liquidador que \'dentro de los cinco (5) días siguientes a su posesión notifique por aviso a los acreedores del deudor incluidos en la relación definitiva de acreencias o en la solicitud de liquidación patrimonial directa, según el caso, y al cónyuge o compañero permanente, si fuere el caso, acerca de la existencia del proceso, y para que publique un aviso en un periódico de amplia circulación nacional en el que se convoque a los acreedores\'; y le ordena que \'dentro de los veinte (20) días siguientes a su posesión actualice el inventario valorado de los bienes\'. El reloj de los ACREEDORES nace de la publicación: pueden hacerse parte \'hasta el vigésimo día siguiente a la publicación en prensa\' (art. 566). El cargo de liquidador es de forzosa aceptación salvo excusa aceptada por el juez. A solicitud del propio deudor el juez lo designará liquidador junto con un profesional del derecho o un consultorio jurídico cuando fuera procedente el amparo de pobreza, cuando la solicitud este coadyuvada por acreedores que representen más del sesenta y cinco por ciento (65%) del capital adeudado, cuando no aparezca prueba de bienes, o cuando hayan transcurrido cinco (5) meses sin que se posesione ninguno de los liquidadores designados. Desde la apertura corren los efectos del art. 565, entre ellos la prohibición al deudor de hacer pagos, compensaciones, daciones en pago, arreglos, desistimientos, allanamientos, terminaciones de procesos, conciliaciones o transacciones sobre obligaciones anteriores, y la prohibición a los acreedores de ejecutar garantías.' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor y del evento de apertura del art. 563', mandatory: true, basis: 'Art. 563' },
      { n: 2, name: 'Nombramiento del liquidador y de dos suplentes y fijación de honorarios provisionales', mandatory: true, basis: 'Art. 564 num. 1' },
      { n: 3, name: 'Orden de notificar por aviso a los acreedores y al cónyuge o compañero permanente dentro de los cinco días siguientes a la posesión', mandatory: true, basis: 'Art. 564 num. 2' },
      { n: 4, name: 'Orden de publicar aviso en periódico de amplia circulación nacional', mandatory: true, basis: 'Art. 564 num. 2' },
      { n: 5, name: 'Orden de inscripción en el registro mercantil, si el deudor es persona comerciante', mandatory: false, basis: 'Art. 564 num. 2' },
      { n: 6, name: 'Orden de actualizar el inventario valorado dentro de los veinte días siguientes a la posesión', mandatory: true, basis: 'Art. 564 num. 3' },
      { n: 7, name: 'Advertencia de los efectos del art. 565', mandatory: true, basis: 'Art. 565' },
      { n: 8, name: 'Reporte a las entidades que administran bases de datos crediticias', mandatory: true, basis: 'Art. 573' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/auto-que-resuelve-objeciones-aprueba-inventarios-y-avaluos-y-cita-a-audiencia-de-adjudicacion',
    exactName: 'Auto que resuelve objeciones, aprueba inventarios y avalúos y cita a audiencia de adjudicación',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 568 (providencia de resolución de objeciones, aprobación de inventarios y avalúos y citación a audiencia), modificado por el art. 34 de la Ley 2445 de 2025; art. 566 (traslado de créditos y objeciones), modificado por el art. 32 de la Ley 2445 de 2025; art. 567 (traslado del inventario valorado), modificado por el art. 33 de la Ley 2445 de 2025; art. 462 (bienes que garantizan obligaciones de terceros); art. 571 (efectos de la adjudicación), modificado por el art. 39 de la Ley 2445 de 2025',
    competentAuthority: 'Juez civil municipal o del circuito que conoce de la liquidación patrimonial (art. 534)',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días para la audiencia y diez (10) para el proyecto de adjudicación. Art. 568: \'En la misma providencia el juez citará a audiencia de adjudicación a realizarse dentro de los treinta (30) días siguientes, y ordenará al liquidador que presente un proyecto de adjudicación dentro de los diez (10) días siguientes. El proyecto de adjudicación permanecerá en la secretaría a disposición de las partes interesadas, quienes podrán consultarlo antes de la celebración de la audiencia.\' En un mismo auto el juez resuelve sobre los créditos presentados y las objeciones, sobre el inventario valorado y las observaciones, sobre las acciones revocatorias o de simulación o cualquier otro asunto pendiente, y sobre los derechos de voto de los acreedores. Dos consecuencias que suelen omitirse. Primera: \'Si no hubiere bienes que adjudicar, el juez omitirá la audiencia de adjudicación y declarará terminado el proceso, señalando expresamente los mismos efectos previstos en el artículo 571 de la presente ley, según el caso\' (parágrafo 2), es decir, la mutación de saldos a obligaciones naturales opera aunque no haya nada que repartir. Segunda: si en el inventario hay bienes sujetos a registro que garantizan obligaciones de las que el concursado no es deudor, el juez comunica al acreedor para los efectos del art. 462, y ese acreedor \'solamente podrá hacer valer sus derechos dentro de este proceso, con arreglo a las normas de prelación establecidas en esta ley\' (parágrafo 1).' },
    requiredSections: [
      { n: 1, name: 'Decisión sobre los créditos presentados, los actualizados por el liquidador y las objeciones propuestas', mandatory: true, basis: 'Art. 568 num. 1' },
      { n: 2, name: 'Decisión sobre el inventario valorado y las observaciones formuladas', mandatory: true, basis: 'Art. 568 num. 2' },
      { n: 3, name: 'Decisión sobre las acciones revocatorias o de simulación y demás asuntos pendientes', mandatory: true, basis: 'Art. 568 num. 3' },
      { n: 4, name: 'Determinación de los derechos de voto de los acreedores', mandatory: true, basis: 'Art. 568 num. 4' },
      { n: 5, name: 'Citación a audiencia de adjudicación dentro de los treinta días siguientes', mandatory: true, basis: 'Art. 568' },
      { n: 6, name: 'Orden al liquidador de presentar proyecto de adjudicación dentro de los diez días siguientes', mandatory: true, basis: 'Art. 568' },
      { n: 7, name: 'Comunicación al acreedor garantizado con bienes que respaldan obligaciones ajenas', mandatory: false, basis: 'Art. 568 parágrafo 1' },
      { n: 8, name: 'Terminación del proceso con los efectos del art. 571, si no hubiere bienes que adjudicar', mandatory: false, basis: 'Art. 568 parágrafo 2' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/providencia-de-adjudicacion',
    exactName: 'Providencia de adjudicación',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 570 (audiencia de adjudicación y reglas de la providencia), modificado por el art. 37 de la Ley 2445 de 2025; art. 569A (acuerdo de adjudicación), adicionado por el art. 36 de la Ley 2445 de 2025; art. 571 (efectos de la adjudicación), modificado por el art. 39 de la Ley 2445 de 2025 y corregido por el art. 12 del Decreto 1136 de 2025; art. 571A (entrega de los bienes), adicionado por el art. 40 de la Ley 2445 de 2025; art. 574 (nuevo procedimiento), modificado por el art. 42 de la Ley 2445 de 2025',
    competentAuthority: 'Juez civil municipal o del circuito que conoce de la liquidación patrimonial (art. 534)',
    term: { status: 'VERIFICADO', description: 'La providencia se profiere en la audiencia de adjudicación, y lo que sigue tiene plazos cortos. Art. 570: si hay acuerdo de adjudicación el juez oye a las partes no firmantes y decide sobre su legalidad, y los interesados pueden modificarlo en la misma audiencia para sanear los reparos; si no lo hay o no se aprueba, el juez oye alegaciones sobre el proyecto del liquidador y profiere la providencia, que reparte primero el dinero, luego los inmuebles, después los muebles corporales y finalmente las cosas incorporales, respetando la prelación legal y la igualdad entre acreedores de la misma clase, y prefiriendo la adjudicación en bloque. Carga del acreedor con sanción inmediata: \'So pena de tener la adjudicación por rechazada, la misma deberá ser aceptada de manera expresa por cada acreedor, dentro de la audiencia o mediante comunicación remitida al juzgado.\' Entrega: el liquidador procede a la entrega material \'dentro de los treinta (30) días siguientes a la ejecutoria de la providencia de adjudicación\', comunicando día, hora y lugar dentro de los tres (3) días siguientes a esa ejecutoria; el adjudicatario que no concurra queda representado por el liquidador como agente oficioso y tiene un (1) mes para reclamarle lo recibido en su nombre, tras lo cual los bienes no reclamados se ofrecen a los demás acreedores (art. 571A). Efecto central y su excepción: los saldos mutan a obligaciones naturales del art. 1527 del Código Civil, sin ganancia ocasional, salvo que el juez halle en incidente que el deudor omitió dolosamente información relevante, oculto o simulo, no actualizó la información del art. 545 num. 4, impidio la venta del art. 570A, o deterioro los activos con dolo o culpa grave, y tampoco respecto de los saldos por obligaciones alimentarias (art. 571 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Decisión sobre la legalidad del acuerdo de adjudicación, si se presentó', mandatory: true, basis: 'Arts. 569A y 570' },
      { n: 2, name: 'Forma en que serán atendidas las obligaciones con los bienes del deudor, en el orden de prelación legal', mandatory: true, basis: 'Art. 570 num. 1' },
      { n: 3, name: 'Comprensión de la totalidad de los bienes a adjudicar, incluido el dinero existente', mandatory: true, basis: 'Art. 570 num. 2' },
      { n: 4, name: 'Respeto de la igualdad entre acreedores de la misma clase', mandatory: true, basis: 'Art. 570 num. 3' },
      { n: 5, name: 'Orden de reparto: dinero, inmuebles, muebles corporales y cosas incorporales', mandatory: true, basis: 'Art. 570 num. 4' },
      { n: 6, name: 'Preferencia por la adjudicación en bloque y, en su defecto, separada', mandatory: true, basis: 'Art. 570 num. 5' },
      { n: 7, name: 'Constancia de la aceptación expresa de cada acreedor, so pena de tener la adjudicación por rechazada', mandatory: true, basis: 'Art. 570 num. 8' },
      { n: 8, name: 'Pronunciamiento sobre la mutación de los saldos insolutos a obligaciones naturales y sus excepciones', mandatory: true, basis: 'Art. 571 num. 1' },
      { n: 9, name: 'Órdenes de entrega material al liquidador', mandatory: true, basis: 'Art. 571A' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/auto-que-declara-el-incumplimiento-del-acuerdo-de-pago',
    exactName: 'Auto que declara el incumplimiento del acuerdo de pago',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 560 (incumplimiento del acuerdo), modificado por el art. 26 de la Ley 2445 de 2025; art. 561 (efectos del incumplimiento), modificado por el art. 27 de la Ley 2445 de 2025; art. 563 num. 3 (apertura de la liquidación), modificado por el art. 29 de la Ley 2445 de 2025; art. 556 (audiencia de reforma)',
    competentAuthority: 'Juez civil municipal o del circuito según la cuantía de los pasivos (art. 534). El conciliador instruye y remite, pero no declara el incumplimiento cuando hay controversia.',
    term: { status: 'VERIFICADO', description: 'El juez \'resolverá de plano sobre el asunto, mediante auto que no admite ningún recurso\' (art. 560). El efecto depende de si es el primer incumplimiento o el segundo. Primero: \'En caso de encontrar probado el incumplimiento, en el mismo auto que lo declare, el juez ordenará que se devuelvan las diligencias al conciliador, para que se proceda a la reforma del acuerdo. Si al cabo de la audiencia de reforma no se modifica el acuerdo, el conciliador remitirá el proceso al juez civil de conocimiento para que decrete la apertura del proceso de liquidación patrimonial.\' Segundo: \'Si, pactada la modificación, el deudor incumple nuevamente, se seguirá el trámite previsto en este mismo artículo, pero, en caso de encontrar el juez probado el incumplimiento, en el mismo auto que lo declare decretará la apertura del proceso de liquidación patrimonial.\' Si no halla probado el incumplimiento, ordena devolver las diligencias y continuar la ejecución del acuerdo. Costos: los que hayan asumido los acreedores para activar la actuación \'serán incluidos en el acuerdo reformado o en la liquidación patrimonial en primer orden de pago después de las obligaciones por alimentos y de los créditos laborales\', salvo que se demuestre que el deudor no tuvo responsabilidad o que hubo concurrencia de culpas.' },
    requiredSections: [
      { n: 1, name: 'Identificación del acuerdo, del deudor y del acreedor que alegó el incumplimiento', mandatory: true, basis: 'Art. 560' },
      { n: 2, name: 'Relación de la queja escrita, de su sustentación y del pronunciamiento de la contraparte', mandatory: true, basis: 'Art. 560' },
      { n: 3, name: 'Valoración de las pruebas aportadas', mandatory: true, basis: 'Art. 560' },
      { n: 4, name: 'Declaración sobre la ocurrencia o no del incumplimiento', mandatory: true, basis: 'Art. 560' },
      { n: 5, name: 'Orden de devolución al conciliador para reforma, o decreto de apertura de la liquidación patrimonial según el caso', mandatory: true, basis: 'Arts. 560, 561 y 563' },
      { n: 6, name: 'Decisión sobre los costos asumidos por los acreedores y su orden de pago', mandatory: true, basis: 'Art. 560' },
      { n: 7, name: 'Advertencia de que el auto no admite recurso', mandatory: true, basis: 'Art. 560' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/providencia-de-convalidacion-del-acuerdo-privado',
    exactName: 'Providencia de convalidación del acuerdo privado',
    branch: 'INSOLVENCIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 562 (convalidación del acuerdo privado; num. 6 modificado por el art. 28 de la Ley 2445 de 2025); art. 545 (efectos que solo nacen con la convalidación), modificado por el art. 16 de la Ley 2445 de 2025; art. 553 y art. 554 (requisitos que debe reunir el acuerdo); art. 574 (inhabilidad temporal si no se convalida), modificado por el art. 42 de la Ley 2445 de 2025; art. 573 (información crediticia)',
    competentAuthority: 'El procedimiento lo adelanta el conciliador del centro de conciliación o de la notaría (art. 533); la decisión sobre reparos de legalidad y objeciones, y la providencia que convalida o niega la convalidación, corresponden al juez civil municipal o del circuito según la cuantía (art. 534). \'Si dentro de la audiencia no se formularon reparos de legalidad al acuerdo o a los créditos que fueron tomados en cuenta para su celebración, el acuerdo quedará en firme y así lo hará constar el Conciliador en la audiencia\' (art. 562 num. 5).',
    term: { status: 'VERIFICADO', description: 'El momento de la convalidación es el que activa los efectos, y esa es la diferencia práctica con la negociación de deudas. Art. 562 num. 3: \'La aceptación de la solicitud de convalidación no producirá los efectos previstos en los numerales 1, 2 y 5 del artículo 545, ni los dispuestos en el artículo 547. Estos efectos solo se producirán a partir de la providencia que lo convalide.\' Es decir, entre la aceptación y la convalidación el deudor sigue expuesto a ejecuciones, descuentos de nómina y acciones contra sus codeudores y garantes. Convalidado, \'el acuerdo convalidado, será oponible y obligará a todos los acreedores del deudor, incluyendo a quienes no concurrieron a su celebración o votaron en contra\' (num. 5). Los acreedores que suscribieron el acuerdo privado \'no podrán presentar objeciones ni impugnar el contenido del acuerdo, pero podrán pronunciarse y aportar pruebas para contradecir los reparos que presenten los demás acreedores\' (num. 4). Y si el juez no convalida, esa decisión \'impedirá que el deudor presente una nueva solicitud de convalidación durante el término previsto en el artículo 574\', sin perjuicio de que pueda pedir negociación de deudas o liquidación patrimonial directa si ya esta en cesación de pagos (num. 6).' },
    requiredSections: [
      { n: 1, name: 'Identificación del deudor, del acuerdo privado y de sus suscriptores', mandatory: true, basis: 'Art. 562' },
      { n: 2, name: 'Verificación del reconocimiento del acuerdo ante autoridad judicial o notarial', mandatory: true, basis: 'Art. 562 num. 2' },
      { n: 3, name: 'Verificación de la mayoría de más del sesenta por ciento del capital', mandatory: true, basis: 'Art. 562' },
      { n: 4, name: 'Verificación del cumplimiento de los requisitos de los arts. 553 y 554', mandatory: true, basis: 'Art. 562 num. 2' },
      { n: 5, name: 'Decisión sobre los reparos de legalidad y las objeciones a los créditos', mandatory: true, basis: 'Art. 562 num. 5' },
      { n: 6, name: 'Decisión de convalidar o de no convalidar, con sus efectos', mandatory: true, basis: 'Arts. 562 nums. 3, 5 y 6' },
      { n: 7, name: 'Reporte a las entidades que administran bases de datos crediticias', mandatory: true, basis: 'Art. 573' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr019.html'
  },
  {
    id: 'insolvencia/solicitud-de-exclusion-de-bienes-en-garantia-mobiliaria-en-la-liquidacion-judicial',
    exactName: 'Solicitud de exclusión de bienes en garantía mobiliaria en la liquidación judicial',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 52 (exclusión y sanción por no comparecer); Ley 1116 de 2006, arts. 37 y 56; Decreto 1074 de 2015, art. 2.2.2.4.2.47',
    competentAuthority: 'El juez del concurso: la Superintendencia de Sociedades o el juez civil del circuito, según a quién corresponda el proceso de liquidación',
    term: { status: 'VERIFICADO', description: 'SEIS (6) MESES, Y EL RELOJ ES DEL ACREEDOR GARANTIZADO. «A partir de la apertura del proceso de liquidación judicial y dentro de los SEIS (6) MESES siguientes al inicio del proceso o dentro del plazo previsto en el artículo 37 de la Ley 1116 de 2006, el acreedor garantizado podrá solicitar al juez del concurso la exclusión de los bienes en garantía» (art. 52). CALLAR EQUIVALE A CONSENTIR, y eso está escrito: el parágrafo del mismo artículo dispone que no concurrir, o concurrir fuera del término del art. 56 de la Ley 1116, «se entenderá en el sentido de que accede a que su bien se trate» dentro de la masa. Es decir, el acreedor que no pide la exclusión a tiempo pierde el bien como garantía y entra a la fila con los demás. ADVERTENCIA DE VIGENCIA: el art. 21 de la Ley 2437 de 2024 DEROGÓ los arts. 37 y 38 de la Ley 1116 de 2006 — «En todos los casos en que resultaría aplicable la liquidación por adjudicación procederá la liquidación judicial o la liquidación judicial simplificada según corresponda»—, de modo que la remisión al art. 37 debe leerse contra el régimen vigente. LÍMITE CONSTITUCIONAL: C-145 de 2018 declaró condicionalmente exequibles los arts. 50 y 51, de manera que el derecho del acreedor garantizado opera «siempre que los demás bienes del deudor sean suficientes para asegurar el pago de las obligaciones alimentarias de los niños y las salariales y prestacionales».' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de liquidación judicial y de su fecha de apertura', mandatory: true, basis: 'Ley 1676 de 2013, art. 52' },
      { n: 2, name: 'Prueba de la inscripción de la garantía mobiliaria ANTES de la inscripción del concurso', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.2.58' },
      { n: 3, name: 'Individualización de los bienes cuya exclusión de la masa se solicita', mandatory: true, basis: 'Ley 1676 de 2013, art. 52' },
      { n: 4, name: 'Constancia de presentación dentro de los seis (6) meses siguientes al inicio del proceso', mandatory: true, basis: 'Ley 1676 de 2013, art. 52' },
      { n: 5, name: 'Pronunciamiento sobre la suficiencia de los demás bienes para las acreencias alimentarias y laborales', mandatory: false, basis: 'Corte Constitucional, C-145 de 2018' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'insolvencia/solicitud-de-autorizacion-para-ejecutar-la-garantia-mobiliaria-en-reorganizacion',
    exactName: 'Solicitud de autorización para ejecutar la garantía mobiliaria en reorganización',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 50 (condicionalmente exequible, C-145 de 2018); Decreto 1074 de 2015, art. 2.2.2.4.2.33; Ley 1116 de 2006',
    competentAuthority: 'El juez del concurso: la Superintendencia de Sociedades o el juez civil del circuito',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN DÍAS: EL RELOJ ESTÁ ATADO A UN HITO DEL PROCESO Y NO A UN CALENDARIO, así que se vigila el expediente, no la agenda. El juez «resolverá la solicitud de ejecución una vez en firme la aprobación del inventario valorado y la providencia de calificación y graduación de créditos» (art. 50). Pedirla antes no la adelanta. LÍMITE CONSTITUCIONAL VIGENTE: C-145 de 2018 condicionó los arts. 50 y 51 a que «los demás bienes del deudor sean suficientes para asegurar el pago de las obligaciones alimentarias de los niños y las salariales y prestacionales». C-483 de 2024 volvió a examinarlos y se declaró INHIBIDA, de modo que el condicionamiento sigue en pie. ADVERTENCIA DE VIGENCIA: el último inciso del art. 50 remite a la «liquidación por adjudicación», figura suprimida por el art. 21 de la Ley 2437 de 2024; hoy se lee como liquidación judicial o judicial simplificada.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de reorganización y del crédito garantizado', mandatory: true, basis: 'Ley 1676 de 2013, art. 50' },
      { n: 2, name: 'Prueba de la inscripción de la garantía y de su prelación', mandatory: true, basis: 'Ley 1676 de 2013, arts. 21 y 48' },
      { n: 3, name: 'Demostración de que el bien no es necesario para la actividad económica del deudor', mandatory: true, basis: 'Ley 1676 de 2013, art. 50' },
      { n: 4, name: 'Constancia de que están en firme el inventario valorado y la calificación y graduación de créditos', mandatory: true, basis: 'Ley 1676 de 2013, art. 50' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'insolvencia/solicitud-de-medidas-de-proteccion-del-acreedor-garantizado-por-depreciacion-del-bien',
    exactName: 'Solicitud de medidas de protección del acreedor garantizado por depreciación del bien',
    branch: 'INSOLVENCIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 50 inciso 4 (condicionalmente exequible, C-145 de 2018); Ley 1116 de 2006',
    competentAuthority: 'El juez del concurso: la Superintendencia de Sociedades o el juez civil del circuito',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO LEGAL, PERO ES LA ÚNICA DEFENSA MIENTRAS EL BIEN SE DETERIORA DENTRO DEL CONCURSO. Cuando el bien en garantía queda afecto al proceso y pierde valor, el acreedor puede pedir su sustitución, la constitución de reservas o pagos periódicos que compensen la depreciación (art. 50 inc. 4). Se pide en cualquier momento del proceso, y su utilidad depende de pedirla temprano: la depreciación no se recupera hacia atrás.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de insolvencia y del bien dado en garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 50' },
      { n: 2, name: 'Demostración de la depreciación o del riesgo de pérdida de valor del bien', mandatory: true, basis: 'Ley 1676 de 2013, art. 50 inc. 4' },
      { n: 3, name: 'Medida concreta que se solicita: sustitución del bien, reservas o pagos periódicos', mandatory: true, basis: 'Ley 1676 de 2013, art. 50 inc. 4' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  }
  ]
};
