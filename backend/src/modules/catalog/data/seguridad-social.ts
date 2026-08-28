import type { BranchCatalog } from '../types';

/**
 * SEGURIDAD_SOCIAL catalogue.
 *
 * Generated from research/actuaciones-seguridad-social.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const SEGURIDAD_SOCIAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'SEGURIDAD_SOCIAL',
    verifiedAt: '2026-08-28',
    sourceOfTruth: 'Ley 100 de 1993, Ley 797 de 2003, Ley 860 de 2003, Ley 776 de 2002, Decreto 1072 de 2015',
    gaps: [

    ]
  },
  actuaciones: [
  {
    id: 'seguridad_social/manifestacion-de-inconformidad-contra-el-dictamen-de-perdida-de-capacidad-laboral-de-primera-oportunidad',
    exactName: 'Manifestación de inconformidad contra el dictamen de pérdida de capacidad laboral de primera oportunidad',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, art. 41, modificado por el art. 142 del Decreto-ley 019 de 2012',
    competentAuthority: 'Se presenta ante la MISMA entidad que calificó — Colpensiones, la administradora de riesgos laborales, la compañía de seguros o la EPS. Ninguna es un juzgado, y ninguna decide la inconformidad: su deber es remitir el caso a la Junta Regional de Calificación de Invalidez',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS, RELOJ DEL CLIENTE, PRECLUSIVO, Y ES EL PLAZO MÁS LETAL DE TODO EL RÉGIMEN PENSIONAL PORQUE NADIE LO ANUNCIA COMO UN RECURSO. «En caso de que el interesado NO ESTÉ DE ACUERDO con la calificación DEBERÁ MANIFESTAR SU INCONFORMIDAD DENTRO DE LOS DIEZ (10) DÍAS SIGUIENTES y la entidad deberá remitirlo a las Juntas Regionales de Calificación de Invalidez del orden regional dentro de los cinco (5) días siguientes, cuya decisión será apelable ante la Junta Nacional de Calificación de Invalidez, la cual decidirá en un término de cinco (5) días» (art. 41). LOS OTROS DOS PLAZOS DEL MISMO ARTÍCULO NO SON DEL CLIENTE: los cinco (5) días de remisión son de la entidad calificadora y los cinco (5) de decisión son de la Junta Nacional. Publicar cualquiera de esos como término del afiliado invierte de quién es el reloj. LO QUE SE PIERDE AL DEJAR VENCER LOS DIEZ DÍAS es la puerta a la Junta Regional: el porcentaje que fijó la propia entidad interesada en no reconocer la prestación queda en firme. GARANTÍA QUE HAY QUE EXIGIR Y QUE SUELE INCUMPLIRSE: el acto que declara la invalidez «deberá contener expresamente los fundamentos de hecho y de derecho […] así como la forma y oportunidad en que el interesado puede solicitar la calificación por parte de la Junta Regional». REMISIÓN OBLIGATORIA Y GRATUITA que se pasa por alto: cuando la incapacidad declarada es inferior en no menos del diez por ciento (10%) a los límites del estado de invalidez, «tendrá que acudirse EN FORMA OBLIGATORIA a la Junta Regional de Calificación de Invalidez POR CUENTA DE LA RESPECTIVA ENTIDAD».' },
    requiredSections: [
      { n: 1, name: 'Identificación del dictamen de primera oportunidad y de la fecha de su notificación', mandatory: true, basis: 'Ley 100 de 1993, art. 41' },
      { n: 2, name: 'Manifestación expresa de inconformidad con el porcentaje, el origen o la fecha de estructuración', mandatory: true, basis: 'Ley 100 de 1993, art. 41' },
      { n: 3, name: 'Petición de remisión a la Junta Regional de Calificación de Invalidez', mandatory: true, basis: 'Ley 100 de 1993, art. 41' },
      { n: 4, name: 'Constancia de presentación dentro de los diez (10) días siguientes', mandatory: true, basis: 'Ley 100 de 1993, art. 41' },
      { n: 5, name: 'Historia clínica y soportes médicos que sustentan el desacuerdo', mandatory: true, basis: 'Ley 100 de 1993, art. 41' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html'
  },
  {
    id: 'seguridad_social/recurso-de-reposicion-y-apelacion-contra-el-dictamen-de-la-junta-regional-de-calificacion-de-invalidez',
    exactName: 'Recurso de reposición y apelación contra el dictamen de la Junta Regional de Calificación de Invalidez',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1072 de 2015, art. 2.2.5.1.41 (que compila el art. 43 del Decreto 1352 de 2013) y art. 2.2.5.1.43 (firmeza del dictamen)',
    competentAuthority: 'Se presentan ANTE LA JUNTA REGIONAL QUE PROFIRIÓ EL DICTAMEN, no ante la Nacional, aunque la apelación la resuelva esta última. Las Juntas son particulares que ejercen función pública y sus dictámenes NO son actos administrativos',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS DESDE LA NOTIFICACIÓN, RELOJ DEL CLIENTE, Y VENCIDOS EL DICTAMEN QUEDA EN FIRME. «Contra el dictamen emitido por la Junta Regional de Calificación de Invalidez proceden los recursos de reposición y/o apelación, presentados por cualquiera de los interesados ANTE LA JUNTA REGIONAL DE CALIFICACIÓN DE INVALIDEZ QUE LO PROFIRIÓ […] DENTRO DE LOS DIEZ (10) DÍAS SIGUIENTES A SU NOTIFICACIÓN, sin que requiera de formalidades especiales, exponiendo los motivos de inconformidad, acreditando las pruebas que se pretendan hacer valer y la respectiva consignación de los honorarios de la Junta Nacional si se presenta en subsidio el de apelación» (art. 2.2.5.1.41). La consecuencia está escrita aparte: «Los dictámenes adquieren firmeza cuando: 1. Contra el dictamen no se haya interpuesto el recurso de reposición y/o apelación dentro del término de diez (10) días siguientes a su notificación» (art. 2.2.5.1.43). DOS TRAMPAS DE FORMA QUE HUNDEN EL RECURSO: hay que CONSIGNAR LOS HONORARIOS DE LA JUNTA NACIONAL si se apela en subsidio, y hay que APORTAR LAS PRUEBAS CON EL ESCRITO. ADVERTENCIA DE CÓMPUTO QUE HAY QUE DARLE AL CLIENTE: la norma dice «diez (10) días» SIN DECIR si son hábiles o calendario, aunque en otros incisos del mismo artículo sí precisa «calendario» y «hábiles». Ante esa ambigüedad, cuéntese en el escenario más corto. LOS PLAZOS DE LA JUNTA NO SON DEL CLIENTE: diez días calendario para resolver la reposición y dos días hábiles para remitir el expediente a la Nacional.' },
    requiredSections: [
      { n: 1, name: 'Identificación del dictamen de la Junta Regional y de la fecha de su notificación', mandatory: true, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.41' },
      { n: 2, name: 'Motivos de inconformidad expuestos de manera concreta', mandatory: true, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.41' },
      { n: 3, name: 'Pruebas que se pretenden hacer valer, aportadas con el escrito', mandatory: true, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.41' },
      { n: 4, name: 'Consignación de los honorarios de la Junta Nacional, si se apela en subsidio', mandatory: true, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.41' },
      { n: 5, name: 'Constancia de presentación ante la Junta Regional dentro de los diez (10) días', mandatory: true, basis: 'Decreto 1072 de 2015, arts. 2.2.5.1.41 y 2.2.5.1.43' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=62506'
  },
  {
    id: 'seguridad_social/solicitud-de-calificacion-directamente-ante-la-junta-regional-de-calificacion-de-invalidez',
    exactName: 'Solicitud de calificación directamente ante la Junta Regional de Calificación de Invalidez',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1072 de 2015, art. 2.2.5.1.25 (que compila el art. 29 del Decreto 1352 de 2013); Decreto 1507 de 2014 (manual único de calificación vigente)',
    competentAuthority: 'La Junta Regional de Calificación de Invalidez, directamente, sin pasar por la entidad calificadora',
    term: { status: 'VERIFICADO', description: 'NO ES UN PLAZO QUE CORRA CONTRA EL CLIENTE SINO UNA PUERTA QUE SE LE ABRE CUANDO LA ENTIDAD SE DEMORA, Y POR ESO CONVIENE TENER LAS FECHAS A LA MANO. Puede acudirse directamente a la Junta: «1. Si transcurridos TREINTA (30) DÍAS CALENDARIO después de terminado el proceso de rehabilitación integral aún no ha sido calificado en primera oportunidad, en todos los casos, la calificación NO PODRÍA PASAR DE LOS QUINIENTOS CUARENTA (540) DÍAS de ocurrido el accidente o diagnosticada la enfermedad, caso en el cual tendrá derecho a recurrir directamente a la junta. 2. Cuando dentro de los CINCO (5) DÍAS siguientes a la manifestación de la inconformidad […] las entidades de seguridad social NO REMITAN EL CASO ante la junta regional» (art. 2.2.5.1.25). ES DECIR: la inercia de la entidad no deja al afiliado sin salida, pero solo si alguien lleva la cuenta de los treinta días, de los quinientos cuarenta y de los cinco. MANUAL APLICABLE: el vigente es el del Decreto 1507 de 2014, que derogó el Decreto 917 de 1999; el manual que se aplica es el vigente A LA FECHA DE CALIFICACIÓN (Ley 100, art. 41).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la causal que habilita acudir directamente: demora en calificar o falta de remisión', mandatory: true, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.25' },
      { n: 2, name: 'Fechas del accidente o del diagnóstico y de terminación de la rehabilitación integral', mandatory: true, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.25' },
      { n: 3, name: 'Historia clínica completa y soportes de la pérdida de capacidad laboral', mandatory: true, basis: 'Decreto 1507 de 2014' },
      { n: 4, name: 'Constancia de la manifestación de inconformidad previa, cuando la causal es la falta de remisión', mandatory: false, basis: 'Decreto 1072 de 2015, art. 2.2.5.1.25' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=62506'
  },
  {
    id: 'seguridad_social/reclamacion-administrativa-de-pension-de-vejez',
    exactName: 'Reclamación administrativa de pensión de vejez',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, art. 33, modificado por el art. 9 de la Ley 797 de 2003; Ley 2452 de 2025, arts. 11 y 319 lit. b; Ley 1755 de 2015, art. 14',
    competentAuthority: 'Colpensiones si el afiliado está en el régimen de prima media, o la Administradora de Fondos de Pensiones si está en el de ahorro individual. Ninguna es un juzgado: es trámite administrativo, y el control judicial posterior corresponde al juez laboral',
    term: { status: 'VERIFICADO', description: 'EL DERECHO A LA PENSIÓN NO PRESCRIBE, PERO LAS MESADAS SÍ, Y ESE ES EL RELOJ QUE CORRE CONTRA EL CLIENTE MIENTRAS ESPERA: TRES (3) AÑOS. «Las acciones que emanen de las leyes sociales prescribirán en TRES (3) AÑOS, que se contarán desde que la respectiva obligación se haya hecho exigible» (Ley 2452 de 2025, art. 317). Cada mes que pasa sin reclamar, el cliente pierde una mesada por el otro extremo aunque conserve intacto el derecho. EL PLAZO DE CUATRO MESES ES DE LA ENTIDAD, NO DEL CLIENTE, y conviene invocarlo pero no confundirlo: «Los fondos encargados reconocerán la pensión en un tiempo NO SUPERIOR A CUATRO (4) MESES después de radicada la solicitud por el peticionario, con la correspondiente documentación que acredite su derecho. LOS FONDOS NO PODRÁN ADUCIR QUE LAS DIFERENTES CAJAS NO LES HAN EXPEDIDO EL BONO PENSIONAL O LA CUOTA PARTE» (art. 33, par. 1). LA RECLAMACIÓN YA NO ES REQUISITO DE PROCEDIBILIDAD, y quien la siga presentando por esa razón cita una regla derogada: «se iniciarán cuando se haya agotado la reclamación de derechos, SIN QUE EN NINGÚN CASO SEA REQUISITO DE PROCEDIBILIDAD […] y se agota cuando se haya decidido o cuando TRANSCURRIDO UN MES desde su presentación no haya sido resuelta» (Ley 2452 de 2025, art. 11). PARA QUÉ SIRVE ENTONCES, Y ES LA RAZÓN REAL DE PRESENTARLA: interrumpe la prescripción (art. 319 lit. b) y fija la competencia territorial a elección del demandante (art. 12). REQUISITOS VIGENTES DE VEJEZ: 57 años la mujer y 62 el hombre desde el 1 de enero de 2014, y 1.300 semanas concluido el escalonamiento del art. 9 de la Ley 797. ADVERTENCIA DE VIGENCIA CON FECHA CIERTA: la Ley 2381 de 2024 cambia estos requisitos, y las normas declaradas exequibles por la Sala Plena el 25 de agosto de 2026 empiezan a regir el 1 DE ABRIL DE 2027.' },
    requiredSections: [
      { n: 1, name: 'Identificación del afiliado y del régimen al que pertenece', mandatory: true, basis: 'Ley 100 de 1993, art. 33' },
      { n: 2, name: 'Acreditación de la edad y de las semanas cotizadas, con la historia laboral', mandatory: true, basis: 'Ley 100 de 1993, art. 33' },
      { n: 3, name: 'Petición concreta de reconocimiento y pago de la pensión de vejez', mandatory: true, basis: 'Ley 2452 de 2025, art. 11' },
      { n: 4, name: 'Reclamación de las mesadas retroactivas, limitada por la prescripción trienal', mandatory: true, basis: 'Ley 2452 de 2025, art. 317' },
      { n: 5, name: 'Constancia de radicación, que interrumpe la prescripción y fija la competencia', mandatory: true, basis: 'Ley 2452 de 2025, arts. 12 y 319 lit. b' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=7223'
  },
  {
    id: 'seguridad_social/reclamacion-administrativa-de-pension-de-invalidez',
    exactName: 'Reclamación administrativa de pensión de invalidez',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, arts. 38 y 39, este último modificado por el art. 1 de la Ley 860 de 2003; Ley 2452 de 2025, art. 317',
    competentAuthority: 'Colpensiones o la Administradora de Fondos de Pensiones, según el régimen. Trámite administrativo, no judicial',
    term: { status: 'VERIFICADO', description: 'EL DERECHO NO PRESCRIBE; LAS MESADAS SÍ, A LOS TRES (3) AÑOS (Ley 2452 de 2025, art. 317), Y EL PLAZO DE CUATRO MESES PARA RESOLVER ES DE LA ENTIDAD. UMBRAL: «se considera inválida la persona que por cualquier causa de origen no profesional, no provocada intencionalmente, hubiere perdido el 50% O MÁS DE SU CAPACIDAD LABORAL» (art. 38) — por eso el dictamen de pérdida de capacidad laboral, y su impugnación en diez días, decide este caso antes de que exista. REQUISITO DE COTIZACIÓN VIGENTE: «Que haya cotizado CINCUENTA (50) SEMANAS DENTRO DE LOS ÚLTIMOS TRES (3) AÑOS inmediatamente anteriores a la fecha de estructuración» (art. 39, modificado por la Ley 860 de 2003), y con una regla más benigna que suele olvidarse: «Cuando el afiliado haya cotizado por lo menos el 75% de las semanas mínimas requeridas para acceder a la pensión de vejez, SOLO SE REQUERIRÁ QUE HAYA COTIZADO 25 SEMANAS en los últimos tres (3) años» (par. 2). REQUISITO DERROTADO QUE TODAVÍA SE EXIGE EN VENTANILLA: el de FIDELIDAD al sistema fue declarado INEXEQUIBLE por la sentencia C-428 de 2009. Negar la pensión por fidelidad hoy es negarla con una norma que no existe, y conviene decirlo en la reclamación.' },
    requiredSections: [
      { n: 1, name: 'Dictamen en firme de pérdida de capacidad laboral igual o superior al cincuenta por ciento (50%)', mandatory: true, basis: 'Ley 100 de 1993, art. 38' },
      { n: 2, name: 'Fecha de estructuración y semanas cotizadas en los tres (3) años anteriores', mandatory: true, basis: 'Ley 100 de 1993, art. 39' },
      { n: 3, name: 'Invocación de la regla del setenta y cinco por ciento (75%) que reduce el requisito a veinticinco (25) semanas, si aplica', mandatory: false, basis: 'Ley 100 de 1993, art. 39 par. 2' },
      { n: 4, name: 'Manifestación de que el requisito de fidelidad fue declarado inexequible por la C-428 de 2009', mandatory: false, basis: 'Corte Constitucional, C-428 de 2009' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html'
  },
  {
    id: 'seguridad_social/reclamacion-administrativa-de-pension-de-sobrevivientes',
    exactName: 'Reclamación administrativa de pensión de sobrevivientes',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, art. 46, modificado por el art. 12 de la Ley 797 de 2003, y art. 47, modificado por el art. 13 de la misma ley; Ley 717 de 2001, art. 1',
    competentAuthority: 'Colpensiones, la Administradora de Fondos de Pensiones o la entidad de previsión social correspondiente. Trámite administrativo',
    term: { status: 'VERIFICADO', description: 'EL RELOJ DE LA ENTIDAD AQUÍ ES MÁS CORTO QUE EN LAS DEMÁS PENSIONES Y CASI NADIE LO INVOCA: DOS (2) MESES, NO CUATRO. «El reconocimiento del derecho a la pensión de sobrevivientes por parte de la entidad de Previsión Social correspondiente, deberá efectuarse A MÁS TARDAR DOS (2) MESES DESPUÉS DE RADICADA LA SOLICITUD por el peticionario» (Ley 717 de 2001, art. 1). EL RELOJ DEL CLIENTE es la prescripción trienal de las mesadas (Ley 2452 de 2025, art. 317); el derecho en sí no prescribe. REQUISITO DE COTIZACIÓN DEL CAUSANTE: «Los miembros del grupo familiar del afiliado al sistema que fallezca, siempre y cuando éste hubiere cotizado CINCUENTA SEMANAS DENTRO DE LOS TRES ÚLTIMOS AÑOS inmediatamente anteriores al fallecimiento» (art. 46 num. 2). REQUISITOS DERROTADOS QUE TODAVÍA SE EXIGEN: los literales a) y b) del art. 46, los de FIDELIDAD, fueron declarados INEXEQUIBLES por la sentencia C-556 de 2009. BENEFICIARIOS Y SU ORDEN: los del art. 47, modificado por el art. 13 de la Ley 797, donde se juegan la convivencia de cinco años del cónyuge o compañero y la cuota parte cuando concurren.' },
    requiredSections: [
      { n: 1, name: 'Registro civil de defunción del causante y prueba de su calidad de afiliado o pensionado', mandatory: true, basis: 'Ley 100 de 1993, art. 46' },
      { n: 2, name: 'Acreditación de las cincuenta (50) semanas cotizadas en los tres (3) años anteriores al fallecimiento', mandatory: true, basis: 'Ley 100 de 1993, art. 46 num. 2' },
      { n: 3, name: 'Prueba de la calidad de beneficiario y, en su caso, de la convivencia exigida', mandatory: true, basis: 'Ley 100 de 1993, art. 47' },
      { n: 4, name: 'Manifestación de que los requisitos de fidelidad fueron declarados inexequibles por la C-556 de 2009', mandatory: false, basis: 'Corte Constitucional, C-556 de 2009' },
      { n: 5, name: 'Invocación del plazo de dos (2) meses de la Ley 717 de 2001 para resolver', mandatory: false, basis: 'Ley 717 de 2001, art. 1' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=7223'
  },
  {
    id: 'seguridad_social/reclamacion-de-prestaciones-economicas-y-asistenciales-ante-la-administradora-de-riesgos-laborales',
    exactName: 'Reclamación de prestaciones económicas y asistenciales ante la administradora de riesgos laborales',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 776 de 2002, arts. 1, 2, 3 y 18; Decreto-ley 1295 de 1994, arts. 5 y 7',
    competentAuthority: 'La administradora de riesgos laborales — entidad privada, no un juzgado',
    term: { status: 'VERIFICADO', description: 'UN (1) AÑO, RELOJ DEL CLIENTE, Y ES LA TRAMPA MÁS GRAVE DE TODO EL RÉGIMEN PORQUE CONTRADICE EL TRIENIO QUE TODO EL MUNDO DA POR SENTADO. «Las prestaciones establecidas en el Decreto-ley 1295 de 1994 y en esta ley prescriben: a) Las MESADAS PENSIONALES en el término de TRES (3) AÑOS; b) LAS DEMÁS PRESTACIONES en el término de UN (1) AÑO. La prescripción se cuenta DESDE EL MOMENTO EN QUE SE LE DEFINE EL DERECHO AL TRABAJADOR» (art. 18). Es decir: en riesgos laborales la prescripción trienal general NO se aplica a lo que no sea mesada pensional — el subsidio por incapacidad temporal y la indemnización por incapacidad permanente parcial prescriben en un año. EL PUNTO DE PARTIDA ES DEFENSIVO Y HAY QUE ALEGARLO: el año no corre desde el accidente sino «desde el momento en que se le define el derecho», o sea desde la firmeza del dictamen. EL RELOJ DE LA ARL, que se invoca para pedir intereses: debe reconocer y pagar «dentro de los DOS (2) MESES siguientes contados desde la fecha en la cual se alleguen o acrediten los requisitos exigidos para su reconocimiento. VENCIDO ESTE TÉRMINO, la administradora de riesgos profesionales DEBERÁ RECONOCER Y PAGAR, EN ADICIÓN A LA PRESTACIÓN ECONÓMICA, UN INTERÉS MORATORIO igual al que rige para el impuesto de renta y complementarios en proporción a la duración de la mora» (art. 1 par. 2). SUBSIDIO POR INCAPACIDAD TEMPORAL: «recibirá un subsidio equivalente al cien (100%) de su salario base de cotización […] hasta por ciento ochenta (180) días, que podrán ser prorrogados hasta por períodos que no superen otros ciento ochenta (180) días continuos adicionales» (art. 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación del accidente de trabajo o de la enfermedad laboral y de su calificación de origen', mandatory: true, basis: 'Decreto-ley 1295 de 1994, art. 5' },
      { n: 2, name: 'Fecha en que se definió el derecho, de la que corre el año de prescripción', mandatory: true, basis: 'Ley 776 de 2002, art. 18' },
      { n: 3, name: 'Prestación que se reclama, con su liquidación', mandatory: true, basis: 'Ley 776 de 2002, arts. 2 y 3' },
      { n: 4, name: 'Solicitud de intereses moratorios si transcurrieron los dos (2) meses', mandatory: false, basis: 'Ley 776 de 2002, art. 1 par. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=16752'
  },
  {
    id: 'seguridad_social/reclamacion-de-indemnizacion-por-incapacidad-permanente-parcial',
    exactName: 'Reclamación de indemnización por incapacidad permanente parcial',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 776 de 2002, arts. 5, 7 y 18',
    competentAuthority: 'La administradora de riesgos laborales',
    term: { status: 'VERIFICADO', description: 'UN (1) AÑO, RELOJ DEL CLIENTE, contado «desde el momento en que se le define el derecho al trabajador» (art. 18 lit. b) — no es mesada pensional, así que NO le aplica el trienio. UMBRAL QUE HAY QUE MEDIR ANTES DE RECLAMAR: «Se considera como incapacitado permanente parcial, al afiliado que, como consecuencia de un accidente de trabajo o de una enfermedad profesional, presenta una disminución definitiva, IGUAL O SUPERIOR AL CINCO POR CIENTO 5%, PERO INFERIOR AL CINCUENTA POR CIENTO 50% de su capacidad laboral, para lo cual ha sido contratado o capacitado» (art. 5). Por debajo del 5% no hay indemnización; del 50% en adelante ya no es esta prestación sino la pensión de invalidez. EL MONTO NO ESTÁ EN EL ARTÍCULO QUE DEFINE LA FIGURA SINO EN EL SIGUIENTE, y por eso se cita mal: «tendrá derecho a que se le reconozca una indemnización en proporción al daño sufrido, a cargo de la entidad administradora de riesgos profesionales, en una suma NO INFERIOR A DOS (2) SALARIOS BASE DE LIQUIDACIÓN, NI SUPERIOR A VEINTICUATRO (24) VECES su salario base de liquidación» (art. 7).' },
    requiredSections: [
      { n: 1, name: 'Dictamen en firme con porcentaje de pérdida de capacidad laboral entre el cinco por ciento (5%) y el cincuenta por ciento (50%)', mandatory: true, basis: 'Ley 776 de 2002, art. 5' },
      { n: 2, name: 'Calificación del origen laboral de la contingencia', mandatory: true, basis: 'Ley 776 de 2002, art. 5' },
      { n: 3, name: 'Salario base de liquidación y cálculo de la indemnización dentro del rango legal', mandatory: true, basis: 'Ley 776 de 2002, art. 7' },
      { n: 4, name: 'Fecha en que se definió el derecho, de la que corre el año de prescripción', mandatory: true, basis: 'Ley 776 de 2002, art. 18' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=16752'
  },
  {
    id: 'seguridad_social/solicitud-de-indemnizacion-sustitutiva-de-la-pension',
    exactName: 'Solicitud de indemnización sustitutiva de la pensión',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, arts. 37 (vejez), 45 (invalidez) y 49 (sobrevivientes)',
    competentAuthority: 'Colpensiones o la caja o entidad del régimen de prima media que corresponda',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN LA NORMA, NI PARA PEDIRLA NI PARA RESOLVERLA MÁS ALLÁ DEL TÉRMINO GENÉRICO DE LAS PETICIONES. La ley no fija caducidad y la jurisprudencia laboral la trata como prestación pensional, por tanto imprescriptible en su núcleo. REQUISITO QUE DEBE QUEDAR EXPRESO EN EL ESCRITO Y QUE SE OLVIDA: «Las personas que habiendo cumplido la edad para obtener la pensión de vejez no hayan cotizado el mínimo de semanas exigidas, Y DECLAREN SU IMPOSIBILIDAD DE CONTINUAR COTIZANDO, tendrán derecho a recibir, en sustitución, una indemnización equivalente a un salario base de liquidación promedio semanal multiplicado por el número de semanas cotizadas» (art. 37). Sin esa declaración expresa la solicitud se niega. DECISIÓN QUE HAY QUE TOMAR CON EL CLIENTE ANTES DE RADICAR: aceptar la indemnización sustitutiva cierra la puerta a seguir cotizando para la pensión; conviene comparar cuántas semanas faltan antes de renunciar al derecho pensional por un pago único. Los arts. 45 y 49 remiten al 37 para invalidez y sobrevivientes.' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la edad cumplida y de las semanas efectivamente cotizadas', mandatory: true, basis: 'Ley 100 de 1993, art. 37' },
      { n: 2, name: 'Declaración expresa de imposibilidad de continuar cotizando', mandatory: true, basis: 'Ley 100 de 1993, art. 37' },
      { n: 3, name: 'Historia laboral con el salario base de liquidación promedio semanal', mandatory: true, basis: 'Ley 100 de 1993, art. 37' },
      { n: 4, name: 'Constancia de haber advertido al solicitante que la indemnización sustituye el derecho pensional', mandatory: true, basis: 'Ley 100 de 1993, art. 37' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html'
  },
  {
    id: 'seguridad_social/solicitud-de-devolucion-de-saldos-en-el-regimen-de-ahorro-individual',
    exactName: 'Solicitud de devolución de saldos en el régimen de ahorro individual',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, arts. 66 (vejez), 72 (invalidez) y 78 (sobrevivientes)',
    competentAuthority: 'La Administradora de Fondos de Pensiones — entidad privada, no un juzgado',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN LA NORMA. Es el equivalente de la indemnización sustitutiva para quien está en el régimen de ahorro individual, y la condición es doble: «Quienes a las edades previstas en el artículo anterior NO HAYAN COTIZADO EL NÚMERO MÍNIMO DE SEMANAS EXIGIDAS, Y NO HAYAN ACUMULADO EL CAPITAL NECESARIO para financiar una pensión por lo menos igual al salario mínimo, tendrán derecho a la devolución del capital acumulado» (art. 66). NO SE CONFUNDE CON LA INDEMNIZACIÓN SUSTITUTIVA: aquella corresponde al régimen de prima media y se calcula sobre semanas; esta devuelve el capital de la cuenta individual con sus rendimientos y el bono pensional si lo hay. Antes de radicarla conviene verificar en qué régimen está el afiliado, porque pedir la figura del otro régimen produce una negativa que cuesta meses.' },
    requiredSections: [
      { n: 1, name: 'Acreditación del régimen de ahorro individual y de la edad cumplida', mandatory: true, basis: 'Ley 100 de 1993, art. 66' },
      { n: 2, name: 'Certificación de que el capital acumulado no financia una pensión de un salario mínimo', mandatory: true, basis: 'Ley 100 de 1993, art. 66' },
      { n: 3, name: 'Estado de la cuenta de ahorro individual con sus rendimientos', mandatory: true, basis: 'Ley 100 de 1993, art. 66' },
      { n: 4, name: 'Bono pensional, si lo hay, y su valor', mandatory: false, basis: 'Ley 100 de 1993, art. 66' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html'
  },
  {
    id: 'seguridad_social/solicitud-de-traslado-de-regimen-pensional-con-doble-asesoria',
    exactName: 'Solicitud de traslado de régimen pensional con doble asesoría',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, art. 13 lit. e), modificado por el art. 2 de la Ley 797 de 2003 (declarado exequible condicionalmente por la C-1024 de 2004, en los términos de la C-789 de 2002); Ley 1748 de 2014',
    competentAuthority: 'Colpensiones y la Administradora de Fondos de Pensiones, que deben rendir la doble asesoría antes del traslado. No es trámite judicial',
    term: { status: 'VERIFICADO', description: 'DOS RESTRICCIONES, AMBAS CONTRA EL AFILIADO, Y LA SEGUNDA NO ES UN PLAZO SINO UNA PUERTA QUE SE CIERRA PARA SIEMPRE. «Una vez efectuada la selección inicial, estos SÓLO PODRÁN TRASLADARSE DE RÉGIMEN POR UNA SOLA VEZ CADA CINCO (5) AÑOS, contados a partir de la selección inicial. Después de un (1) año de la vigencia de la presente ley, el afiliado NO PODRÁ TRASLADARSE DE RÉGIMEN CUANDO LE FALTAREN DIEZ (10) AÑOS O MENOS para cumplir la edad para tener derecho a la pensión de vejez» (art. 13 lit. e). Los cinco años son un intervalo que se cuenta desde la última selección; los diez años finales son una prohibición absoluta. EXCEPCIÓN QUE SALVA CASOS QUE PARECEN PERDIDOS: la C-1024 de 2004 declaró exequible ese aparte bajo el entendido de que quienes reúnen las condiciones del régimen de transición del art. 36 y se trasladaron al ahorro individual PUEDEN REGRESAR AL RÉGIMEN DE PRIMA MEDIA EN CUALQUIER TIEMPO, conforme a la C-789 de 2002 — ahí el reloj no corre. DOBLE ASESORÍA OBLIGATORIA de la Ley 1748 de 2014: su omisión es el fundamento de las demandas de ineficacia del traslado, que se tramitan ante el juez laboral. VENTANA EXTRAORDINARIA YA CERRADA, y hay que decírselo al cliente que llega preguntando por ella: el art. 76 de la Ley 2381 de 2024 dio dos años desde la promulgación —16 de julio de 2024— para trasladarse a quienes tuvieran 750 semanas las mujeres o 900 los hombres y les faltaran menos de diez años; ese plazo venció el 16 de julio de 2026.' },
    requiredSections: [
      { n: 1, name: 'Fecha de la selección inicial o del último traslado, para verificar los cinco (5) años', mandatory: true, basis: 'Ley 100 de 1993, art. 13 lit. e)' },
      { n: 2, name: 'Cálculo del tiempo que falta para la edad de pensión, para verificar la prohibición de los diez (10) años', mandatory: true, basis: 'Ley 100 de 1993, art. 13 lit. e)' },
      { n: 3, name: 'Invocación del régimen de transición del art. 36, si el afiliado es beneficiario, que permite regresar en cualquier tiempo', mandatory: false, basis: 'Corte Constitucional, C-1024 de 2004 y C-789 de 2002' },
      { n: 4, name: 'Constancia de la doble asesoría rendida por ambas administradoras', mandatory: true, basis: 'Ley 1748 de 2014' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=7223'
  },
  {
    id: 'seguridad_social/requerimiento-al-empleador-moroso-en-aportes-y-liquidacion-con-merito-ejecutivo',
    exactName: 'Requerimiento al empleador moroso en aportes y liquidación con mérito ejecutivo',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 100 de 1993, arts. 23 y 24; Decreto 2633 de 1994, arts. 2, 3 y 5',
    competentAuthority: 'La propia entidad administradora expide el requerimiento y la liquidación. El cobro posterior se bifurca: las administradoras públicas del régimen de prima media van por jurisdicción coactiva (art. 3), y las privadas y del ahorro individual por la jurisdicción ordinaria (art. 5)',
    term: { status: 'VERIFICADO', description: 'QUINCE (15) DÍAS, Y EL RELOJ ES DEL EMPLEADOR, NO DE LA ADMINISTRADORA NI DEL TRABAJADOR: SU SILENCIO ES LO QUE HABILITA EL TÍTULO. «Vencidos los plazos señalados para efectuar las consignaciones respectivas por parte de los empleadores, la entidad administradora, mediante comunicación dirigida al empleador moroso lo requerirá, si DENTRO DE LOS QUINCE (15) DÍAS siguientes a dicho requerimiento EL EMPLEADOR NO SE HA PRONUNCIADO, se procederá a elaborar la liquidación, LA CUAL PRESENTARÁ MÉRITO EJECUTIVO de conformidad con el artículo 24 de la Ley 100 de 1993» (Decreto 2633 de 1994, art. 2). LA BIFURCACIÓN DE JURISDICCIÓN DECIDE DÓNDE SE COBRA Y HAY QUE RESOLVERLA ANTES DE REDACTAR, porque equivocarla pierde el proceso entero. INTERÉS DE MORA: el art. 23 de la Ley 100 lo fija «igual al que rige para el impuesto sobre la renta y complementarios».' },
    requiredSections: [
      { n: 1, name: 'Identificación del empleador y de los períodos en mora, con su liquidación', mandatory: true, basis: 'Decreto 2633 de 1994, art. 2' },
      { n: 2, name: 'Constancia del requerimiento previo y del transcurso de los quince (15) días sin pronunciamiento', mandatory: true, basis: 'Decreto 2633 de 1994, art. 2' },
      { n: 3, name: 'Liquidación de los intereses de mora a la tasa del impuesto sobre la renta', mandatory: true, basis: 'Ley 100 de 1993, art. 23' },
      { n: 4, name: 'Determinación de la jurisdicción competente según la naturaleza de la administradora', mandatory: true, basis: 'Decreto 2633 de 1994, arts. 3 y 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=8809'
  },
  {
    id: 'seguridad_social/reclamacion-ante-la-entidad-promotora-de-salud',
    exactName: 'Reclamación ante la entidad promotora de salud',
    branch: 'SEGURIDAD_SOCIAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, art. 14; Constitución Política, art. 48',
    competentAuthority: 'La entidad promotora de salud — particular que ejerce funciones públicas, no un juzgado. Agotada, el conflicto puede llevarse a la función jurisdiccional de la Superintendencia Nacional de Salud',
    term: { status: 'VERIFICADO', description: 'NINGUNA NORMA FIJA PLAZO AL USUARIO PARA RECLAMAR EN SALUD, Y ESO HAY QUE DECIRLO EXPRESAMENTE PORQUE ES LO CONTRARIO DE LO QUE LA GENTE TEME. El derecho a la seguridad social es irrenunciable por mandato del art. 48 de la Constitución, y no se encontró norma que establezca caducidad o preclusión contra el afiliado. LO QUE SÍ PRESCRIBE, y no es lo mismo, son las acreencias patrimoniales derivadas —mesadas y prestaciones económicas— a los tres (3) años desde su exigibilidad. EL PLAZO DE QUINCE DÍAS ES DE LA ENTIDAD, NO DEL CIUDADANO: «Salvo norma legal especial y so pena de sanción disciplinaria, toda petición deberá resolverse dentro de los QUINCE (15) DÍAS siguientes a su recepción» (art. 14). Con dos reglas especiales que conviene aprovechar: las peticiones de documentos e información se resuelven en diez (10) días, y «Si en ese lapso NO SE HA DADO RESPUESTA al peticionario, SE ENTENDERÁ, PARA TODOS LOS EFECTOS LEGALES, QUE LA RESPECTIVA SOLICITUD HA SIDO ACEPTADA», con entrega de las copias dentro de los tres (3) días siguientes; y las consultas, en treinta (30) días. PRÓRROGA QUE LA ENTIDAD DEBE JUSTIFICAR ANTES DE VENCERSE: solo excepcionalmente, informando los motivos y un plazo que «no podrá exceder del doble del inicialmente previsto».' },
    requiredSections: [
      { n: 1, name: 'Identificación del afiliado, de la entidad y del servicio o prestación negados', mandatory: true, basis: 'Ley 1755 de 2015, art. 14' },
      { n: 2, name: 'Petición concreta, con las circunstancias de tiempo, modo y lugar', mandatory: true, basis: 'Ley 1755 de 2015, art. 14' },
      { n: 3, name: 'Soportes médicos: órdenes, historia clínica y concepto del médico tratante', mandatory: true, basis: 'Ley 1755 de 2015, art. 14' },
      { n: 4, name: 'Constancia de radicación, de la que corre el plazo de la entidad', mandatory: true, basis: 'Ley 1755 de 2015, art. 14' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  }
  ]
};
