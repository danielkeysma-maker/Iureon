import type { BranchCatalog } from '../types';

/**
 * AGRARIO catalogue.
 *
 * Generated from research/actuaciones-agrario.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const AGRARIO_CATALOG: BranchCatalog = {
  meta: {
    branch: 'AGRARIO',
    verifiedAt: '2026-08-26',
    sourceOfTruth: 'Decreto Ley 902 de 2017, Procedimiento Unico de ordenamiento social de la propiedad rural ante la Agencia Nacional de Tierras, con el art. 78 declarado inexequible por la C-073 de 2018 y la fase judicial remitida al verbal sumario del CGP por su art. 79. La jurisdiccion agraria y rural del Acto Legislativo 03 de 2023 y de la Ley Estatutaria 2570 de 2026 NO esta operando: no hay ley de competencias ni procedimiento, ni jueces instalados, y los asuntos agrarios los conocen hoy los jueces civiles por cuantia (CGP arts. 17.1, 18.1 y 20.1). El Decreto 2303 de 1989 fue derogado integramente por el CGP art. 626 lit. c). Esta rama NO cubre la restitucion de tierras de la Ley 1448 de 2011, que es justicia transicional en la jurisdiccion ordinaria.',
    gaps: [
    'AGRARIO: LA JURISDICCIÓN AGRARIA Y RURAL EN SÍ MISMA NO PRODUJO NI UNA FICHA. No hay demanda agraria, contestación agraria, audiencia agraria ni recurso agrario que catalogar: la Ley 2570 de 2026 solo crea órganos, y el proyecto de ley de competencias y procedimiento se archivó en junio de 2026 y se volvió a radicar el 21 de julio de 2026. Inventar aquí un «procedimiento verbal agrario» habría producido citas sistemáticamente falsas.',
    'AGRARIO: El Decreto 2303 de 1989 y todas sus figuras (proceso verbal agrario, posesorios agrarios, deslinde agrario) están derogados por el art. 626 lit. c) del CGP. No se catalogó ninguna: son figuras abolidas.',
    'AGRARIO: Restitución de tierras despojadas: NO pertenece a esta rama. La Ley 1448 de 2011 creó una competencia propia —jueces civiles del circuito y magistrados de Tribunal Superior, ambos especializados en restitución de tierras—, que es justicia transicional dentro de la jurisdicción ordinaria, no la jurisdicción agraria del Acto Legislativo 03 de 2023. El propio Decreto Ley 902 de 2017 la trata como ajena: sus arts. 56 y 57 salvan expresamente «lo dispuesto en el artículo 95 de la Ley 1448 de 2011» de la acumulación y de la suspensión, y su art. 36 parágrafo 2 excluye la formalización administrativa «en tierras y/o territorios afectados por el despojo a causa del conflicto armado». Merece rama y verificación propias (incluida la vigencia de la Ley 1448, prorrogada por la Ley 2078 de 2021, que no se verificó aquí).',
    'AGRARIO: Control judicial de los actos de la ANT por los medios de control del CPACA —adjudicación de baldíos, clarificación de la propiedad, deslinde y recuperación de baldíos, extinción del dominio agrario, expropiación de inmueble agrario—: ya está en ADMINISTRATIVO (Ley 1437 de 2011, art. 164 num. 2 lits. e, f y g). No se duplicó. La acción de nulidad agraria del art. 39 sí se catalogó aquí porque es una acción distinta, con términos propios (4 meses / 3 años), y porque el art. 76 dispone que frente a los actos de cierre del Procedimiento Único «No habrá lugar a la acción de control de nulidad de que trata la Ley 1437 de 2011».',
    'AGRARIO: Deslinde y amojonamiento de predios rurales, declaración de pertenencia y servidumbres: se tramitan hoy por el CGP y ya están en la rama CIVIL (arts. 375 y 400 a 405). No se duplicaron con nombre agrario: dos fichas del mismo contenido con distinto nombre dejarían al motor de redacción escogiendo al azar.',
    'AGRARIO: Procedimientos de la Ley 160 de 1994 en su regulación original (clarificación de la propiedad, extinción del derecho de dominio, deslinde de tierras de la Nación, recuperación de baldíos): el art. 82 del Decreto Ley 902 de 2017 derogó buena parte de sus capítulos procedimentales y esos asuntos se tramitan hoy por el Procedimiento Único (art. 58 nums. 4 a 7). El texto residual de la Ley 160 de 1994 no se leyó en esta pasada y por eso ninguna ficha la cita como base.',
    'AGRARIO: Zonas de Reserva Campesina, Unidad Agrícola Familiar, Fondo de Tierras, Subsidio Integral de Acceso a Tierra y crédito especial de tierras (arts. 20 y ss. y 30 a 35 del Decreto Ley 902 de 2017): son figuras sustantivas o programas, no actuaciones que alguien firme y radique con un término.',
    'AGRARIO: Constitución, ampliación, restructuración, saneamiento y titulación colectiva de territorios étnicos: expresamente excluidos del Procedimiento Único por el art. 59 del Decreto Ley 902 de 2017, que los remite a las Leyes 21 de 1991, 160 de 1994 y 70 de 1993 y al Decreto 2333 de 2014. Normas no verificadas en esta pasada.',
    'AGRARIO, verificado el esta pasada: PASO 0 — LA JURISDICCIÓN AGRARIA Y RURAL EXISTE, PERO HOY NO TIENE NI JUECES INSTALADOS NI PROCEDIMIENTO PROPIO. Verificado el 2026-08-26 contra texto oficial. 1) CREACIÓN CONSTITUCIONAL. El Acto Legislativo 03 de 2023 creó la Jurisdicción Agraria y Rural: su art. 1 la incluyó en el art. 116 de la Constitución y su art. 2 agregó el art. 238A. Su art. 4 ordenó al Congreso expedir en la siguiente legislatura la ley de estructura, funcionamiento, competencias y procedimiento especial agrario y rural. Fuente: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=214630 2) LEY ESTATUTARIA VIGENTE, PERO SOLO DE ESTRUCTURA. La Ley Estatutaria 2570 de 2026 (27 de marzo de 2026, Diario Oficial No. 53.444 de 30 de marzo de 2026) modificó la Ley 270 de 1996 y determinó «la integración y estructura de la jurisdicción agraria y rural»; fue revisada por la Corte Constitucional en la Sentencia C-340 de 2025 (14 de agosto de 2025, M.P. Jorge Enrique Ibáñez Najar), que la declaró constitucional con condicionamientos. Su art. 10 dispone que «rige a partir de su promulgación». Pero NO fija competencias ni procedimiento: solo crea órganos —Sala de Casación Civil, Agraria y Rural de la Corte Suprema, Tribunales Agrarios y Rurales y Juzgados Agrarios y Rurales— y remite a «las funciones que determine la ley procesal» (arts. 51A y 56A), y a un concurso de méritos que el Consejo Superior de la Judicatura debe convocar dentro de los seis (6) meses siguientes a la expedición de la ley y'
    ]
  },
  actuaciones: [
  {
    id: 'agrario/oposicion-en-el-procedimiento-unico-de-ordenamiento-social-de-la-propiedad-rural',
    exactName: 'Oposición en el Procedimiento Único de ordenamiento social de la propiedad rural',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 46 (oportunidad y forma de la oposición); art. 75 (efecto: el cierre ordena presentar la demanda ante el juez competente); art. 36 (formalización de predios privados: la oposición desplaza el asunto a sede judicial); art. 70 (traslado de 10 días)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'Se puede formular «a partir de la expedición del acto administrativo que acepta o promueve alguno de los procedimientos objeto del Procedimiento Único […] y hasta la decisión de cierre en fase administrativa» (art. 46). ATENCIÓN AL RELOJ DEL CLIENTE: la oposición presentada después de cerrada la etapa probatoria no se rechaza, pero pierde contradicción, porque «Si el opositor se constituye como tal cerrada la etapa probatoria del Procedimiento Único, las pruebas que aporte serán valoradas por la Agencia Nacional de Tierras en la decisión de cierre» (art. 46 inc. 2). El momento útil real es el traslado de diez (10) días del art. 70, único plazo en que se pueden aportar Y solicitar pruebas.' },
    requiredSections: [
      { n: 1, name: 'Identificación del opositor y de la calidad en que actúa (propietario total o parcial, poseedor, titular de derecho real, mejor derecho o razón fundada)', mandatory: true, basis: 'art. 46' },
      { n: 2, name: 'Identificación del predio y del procedimiento al que se opone (expediente y acto de apertura)', mandatory: true, basis: 'art. 46 en concordancia con art. 70' },
      { n: 3, name: 'Hechos en que se funda la oposición', mandatory: true, basis: 'art. 46' },
      { n: 4, name: 'Prueba sumaria que funda la oposición («acompañando prueba sumaria en la cual funde su oposición»)', mandatory: true, basis: 'art. 46' },
      { n: 5, name: 'Solicitud de pruebas adicionales', mandatory: false, basis: 'art. 70 inc. final y art. 71' },
      { n: 6, name: 'Petición concreta', mandatory: true, basis: 'art. 46' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017.html'
  },
  {
    id: 'agrario/solicitud-de-pruebas-en-el-traslado-del-acto-de-apertura-del-procedimiento-unico',
    exactName: 'Solicitud de pruebas en el traslado del acto de apertura del Procedimiento Único',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 70 (traslado de 10 días para aportar o solicitar pruebas); art. 71 (decreto de pruebas y pago de gastos); art. 51 (irrecurribilidad de los actos de trámite); art. 4 (sujetos a título gratuito)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'Diez (10) días: «Notificado, comunicado y publicitado el acto administrativo se correrá traslado a las partes por el término de diez (10) días, donde podrán aportar o solicitar las pruebas que consideren necesarias para hacer valer sus derechos» (art. 70 inc. final). SEGUNDO RELOJ DEL CLIENTE, y es el que extingue la prueba: «La práctica de las pruebas decretadas a petición de parte correrá a cargo de quien las solicita, quien deberá sufragar los gastos que correspondan dentro de los cinco (05) días siguientes a la notificación del acto administrativo que las decreta. De no pagarse el valor correspondiente a la práctica de pruebas dentro del término establecido, se entenderá que el solicitante desiste y se continuará con el proceso» (art. 71). Ese pago no se exige a quienes estén categorizados en el RESO como sujetos de acceso a tierras y formalización a título gratuito (art. 71 inc. 2 in fine, en concordancia con el art. 4). Contra el acto de apertura «no procede ningún recurso» (art. 70 parágrafo).' },
    requiredSections: [
      { n: 1, name: 'Identificación del interesado y del expediente predial', mandatory: true, basis: 'art. 70' },
      { n: 2, name: 'Pronunciamiento sobre el informe técnico jurídico preliminar contenido en el acto de apertura', mandatory: true, basis: 'art. 70 en concordancia con art. 67' },
      { n: 3, name: 'Pruebas que se aportan', mandatory: false, basis: 'art. 70 inc. final' },
      { n: 4, name: 'Pruebas que se solicitan, con expresión de su pertinencia, utilidad y conducencia', mandatory: false, basis: 'art. 70 inc. final en concordancia con art. 71' },
      { n: 5, name: 'Manifestación de la calidad de sujeto inscrito en el RESO a título gratuito, si es del caso, para no sufragar los gastos de las pruebas', mandatory: false, basis: 'art. 71 inc. 2 en concordancia con art. 4' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/solicitud-de-formalizacion-de-la-propiedad-privada-rural-ante-la-agencia-nacional-de-tierras',
    exactName: 'Solicitud de formalización de la propiedad privada rural ante la Agencia Nacional de Tierras',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 36 (titulación de la posesión y saneamiento de la falsa tradición sobre inmuebles rurales privados; parágrafos 1 y 2); art. 41 (inicio a solicitud de parte en zonas no focalizadas); arts. 4, 5 y 6 (sujetos y requisitos); art. 58 num. 3 (asunto del Procedimiento Único)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'El art. 36 no fija plazo al solicitante. El plazo que sí corre es el de la ausencia de oposición: «Se dará por acreditada la inexistencia de oposición dentro del Procedimiento Único […] cuando transcurran diez (10) días hábiles desde que se realicen las comunicaciones a que se refiere el artículo 73 del Código de Procedimiento Administrativo y de lo Contencioso Administrativo – CPACA, sin que se presentare el titular de un derecho real o quien aduzca tener derecho» (art. 36 parágrafo 1). Si hay oposición, la ANT no titula: «la Agencia Nacional de Tierras formulará la solicitud de formalización ante el juez competente» (art. 36 inc. 1, condicionalmente exequible por la Sentencia C-099 de 2026). Esta vía NO sustituye la pertenencia: «Lo estipulado en el presente artículo no sustituye ni elimina las disposiciones del Código General del Proceso o el Código Civil sobre declaración de pertenencia, las cuales podrán ser ejercidas por los poseedores por fuera de las zonas focalizadas» (art. 36 inc. 3). No aplica sobre tierras afectadas por despojo a causa del conflicto armado (art. 36 parágrafo 2): esa ruta es la restitución de la Ley 1448 de 2011.' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante y acreditación de la calidad de sujeto de formalización e inscripción en el RESO', mandatory: true, basis: 'art. 36 inc. final en concordancia con arts. 4, 5, 6 y 67' },
      { n: 2, name: 'Identificación del predio rural privado: matrícula inmobiliaria, ubicación, área y linderos', mandatory: true, basis: 'art. 36 en concordancia con art. 62' },
      { n: 3, name: 'Hechos de la posesión o de la falsa tradición cuyo saneamiento se pide', mandatory: true, basis: 'art. 36' },
      { n: 4, name: 'Pruebas de la posesión y de la explotación económica del predio', mandatory: true, basis: 'art. 36 en concordancia con art. 66 num. 3' },
      { n: 5, name: 'Manifestación de que el predio no está afectado por despojo o abandono forzado a causa del conflicto armado', mandatory: true, basis: 'art. 36 parágrafo 2' },
      { n: 6, name: 'Petición de titulación de la posesión o de saneamiento de la falsa tradición', mandatory: true, basis: 'art. 36' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017.html'
  },
  {
    id: 'agrario/intervencion-de-tercero-en-la-audiencia-de-exposicion-de-resultados-del-procedimiento-unico',
    exactName: 'Intervención de tercero en la audiencia de exposición de resultados del Procedimiento Único',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 72 (audiencia pública de presentación de resultados, convocatoria e intervención de terceros); art. 60 num. 1 lit. d (etapa de exposición de resultados); art. 61 (esta etapa se suprime en zonas no focalizadas)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'La audiencia «será convocada con una antelación no inferior a siete (7) días a la celebración de esta» (art. 72 inc. 1): ese es el único aviso que recibe el tercero. La etapa completa «tendrá un término de treinta (30) días. Dicho término podrá prorrogarse por una sola vez, sin que con la prórroga el término total exceda de sesenta (60) días» (art. 72), pero ese plazo es de la ANT, no del ciudadano. CARGA DEL TERCERO: «Lo anterior sólo podrá hacerse si se demuestra sumariamente la imposibilidad de haber asistido a la visita de campo o de haberse vinculado al proceso con antelación» (art. 72 inc. 2), y quien llega toma «el proceso en el estado en que se encuentre». En zonas no focalizadas esta etapa no existe (art. 61).' },
    requiredSections: [
      { n: 1, name: 'Identificación del tercero y del predio', mandatory: true, basis: 'art. 72' },
      { n: 2, name: 'Demostración del interés legítimo en el asunto', mandatory: true, basis: 'art. 72 inc. 2' },
      { n: 3, name: 'Prueba sumaria de la imposibilidad de haber asistido a la visita de campo o de haberse vinculado antes', mandatory: true, basis: 'art. 72 inc. 2' },
      { n: 4, name: 'Manifestación de conformidad o inconformidad con el levantamiento predial, los linderos y el área', mandatory: true, basis: 'art. 72 inc. 3' },
      { n: 5, name: 'Petición concreta', mandatory: true, basis: 'art. 72' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/recurso-de-reposicion-y-en-subsidio-apelacion-contra-la-decision-de-cierre-del-procedimiento-unico',
    exactName: 'Recurso de reposición y en subsidio apelación contra la decisión de cierre del Procedimiento Único',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 76 inc. 1 (procedencia contra los actos de los arts. 73 y 74); art. 73 (cierre en asignación y reconocimiento de derechos); art. 74 (cierre en asuntos sin oposición); art. 77 (notificación personal); art. 39 (acción de nulidad agraria como único control judicial); Ley 1437 de 2011, arts. 74, 76 y 77 (oportunidad y requisitos)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT: la reposición ante el mismo funcionario que expidió el acto y la apelación ante su superior, «en los términos previstos en la Ley 1437 de 2011, en concordancia con lo dispuesto en el Decreto 2363 de 2015» (Decreto Ley 902 de 2017, art. 76)',
    term: { status: 'VERIFICADO', description: 'Diez (10) días siguientes a la notificación personal o por aviso del acto de cierre (Ley 1437 de 2011, art. 76), que en este procedimiento es siempre personal (Decreto Ley 902 de 2017, art. 77). RELOJ QUE MATA EL DERECHO, y vive en otro artículo: agotada la vía administrativa, el único control judicial de estos actos es la acción de nulidad agraria del art. 39 —«Frente a estos actos opera el control judicial ante la jurisdicción agraria mediante la acción de nulidad agraria de la que trata el artículo 39 del presente decreto ley. No habrá lugar a la acción de control de nulidad de que trata la Ley 1437 de 2011» (art. 76)—, con cuatro (4) meses contados desde la ejecutoria del acto. Contra los actos de cierre del art. 75 (asuntos con oposición) no procede recurso alguno ni acción de nulidad agraria, porque la decisión de fondo se toma en sede judicial (art. 76 inc. 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación del recurrente, su apoderado y del acto de cierre recurrido', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 1' },
      { n: 2, name: 'Interposición dentro de los diez (10) días siguientes a la notificación', mandatory: true, basis: 'Ley 1437 de 2011, art. 76' },
      { n: 3, name: 'Sustentación con expresión concreta de los motivos de inconformidad', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 2' },
      { n: 4, name: 'Solicitud y aporte de pruebas', mandatory: false, basis: 'Ley 1437 de 2011, art. 77 num. 3' },
      { n: 5, name: 'Petición subsidiaria de apelación ante el superior', mandatory: true, basis: 'Decreto Ley 902 de 2017, art. 76 inc. 1' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/demanda-de-nulidad-agraria',
    exactName: 'Demanda de nulidad agraria',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 39 (acción de nulidad agraria: legitimación, términos de 4 meses y 3 años, competencia privativa y remisión al medio de control de nulidad y restablecimiento del derecho); art. 76 (esta acción desplaza la nulidad del CPACA contra los actos de cierre); art. 36 inc. 2 (procede contra los actos que declaran la titulación y el saneamiento); art. 80 (valor probatorio del informe técnico jurídico); Ley 1437 de 2011, arts. 162 y 166 (requisitos y anexos, por remisión del parágrafo del art. 39)',
    competentAuthority: 'Juez competente según la materia mientras la jurisdicción agraria y rural no asuma competencias: la jurisdicción de lo contencioso administrativo para el control de los actos administrativos del Procedimiento Único, y «los demás procesos deberán adelantarse ante el juez que corresponda según su materia» (Sentencia C-073 de 2018, que declaró INEXEQUIBLE el art. 78 del Decreto Ley 902 de 2017). La Sentencia C-099 de 2026 (22 de abril de 2026, M.P. Vladimir Fernández Andrade) precisa que esa competencia «continuará siendo ejercida por las autoridades judiciales establecidas en la Sentencia C-073 de 2018 hasta que la justicia agraria y rural asuma las competencias que le corresponden conforme al Acto Legislativo 03 de 2023». En la jurisdicción ordinaria, los asuntos «originados en relaciones de naturaleza agraria» son de los jueces civiles municipales (mínima cuantía, CGP art. 17 num. 1; menor cuantía, art. 18 num. 1) y de los jueces civiles del circuito (mayor cuantía, art. 20 num. 1), con competencia territorial privativa del juez del lugar de ubicación del inmueble (CGP art. 28 num. 7)',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES DISTINTOS, según quién demande. (a) Quien se hizo parte del Procedimiento Único y objeta la legalidad de los actos administrativos definitivos: cuatro (4) meses, «para lo cual tendrán un término de cuatro (04) meses contados a partir de la ejecutoria del acto administrativo» (art. 39 inc. 1). (b) Quien aduzca tener derechos reales sobre predios sometidos a los asuntos de los numerales 3, 4, 5, 6 y 7 del art. 58 y NO compareció: «el término será de 3 años contados a partir de la fecha de inscripción del acto administrativo en el folio de matrícula inmobiliaria, la acción podrá interponerse directamente sin necesidad de haber interpuesto los recursos pertinentes contra el acto administrativo» (art. 39 inc. 2). Para el primero, en cambio, el recurso del art. 76 corre en paralelo y solo diez (10) días. La competencia del juez de esta acción «será privativa» (art. 39 inc. 2).' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: true, basis: 'Ley 1437 de 2011, art. 162 num. 1, por remisión del parágrafo del art. 39' },
      { n: 2, name: 'Identificación de las partes y acreditación de haber sido parte en el Procedimiento Único, o de ser titular de derechos reales que no compareció', mandatory: true, basis: 'Decreto Ley 902 de 2017, art. 39 incs. 1 y 2' },
      { n: 3, name: 'Identificación del acto administrativo definitivo demandado, con su fecha de ejecutoria o de inscripción en el folio de matrícula', mandatory: true, basis: 'Decreto Ley 902 de 2017, art. 39; Ley 1437 de 2011, art. 166 num. 1' },
      { n: 4, name: 'Pretensiones de nulidad y de restablecimiento del derecho', mandatory: true, basis: 'Decreto Ley 902 de 2017, art. 39 parágrafo' },
      { n: 5, name: 'Hechos, normas violadas y concepto de la violación', mandatory: true, basis: 'Ley 1437 de 2011, art. 162 nums. 3 y 4' },
      { n: 6, name: 'Pruebas, con solicitud expresa de las que controviertan el informe técnico jurídico, cuyo contenido se presume veraz y suficiente', mandatory: true, basis: 'Decreto Ley 902 de 2017, art. 80' },
      { n: 7, name: 'Anexo del acto acusado con su constancia de notificación o publicación', mandatory: true, basis: 'Ley 1437 de 2011, art. 166 num. 1' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017.html'
  },
  {
    id: 'agrario/demanda-de-resolucion-de-controversias-sobre-la-adjudicacion',
    exactName: 'Demanda de resolución de controversias sobre la adjudicación',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 38 (acción de resolución de controversias sobre los actos de adjudicación; legitimación de la ANT y de los particulares afectados); art. 58 num. 8 (asunto del Procedimiento Único); art. 75 (el cierre con oposición ordena presentar la demanda); art. 79 (normas procesales aplicables); art. 54 (fallos extra y ultra petita)',
    competentAuthority: 'Juez competente según la materia mientras la jurisdicción agraria y rural no asuma competencias: la jurisdicción de lo contencioso administrativo para el control de los actos administrativos del Procedimiento Único, y «los demás procesos deberán adelantarse ante el juez que corresponda según su materia» (Sentencia C-073 de 2018, que declaró INEXEQUIBLE el art. 78 del Decreto Ley 902 de 2017). La Sentencia C-099 de 2026 (22 de abril de 2026, M.P. Vladimir Fernández Andrade) precisa que esa competencia «continuará siendo ejercida por las autoridades judiciales establecidas en la Sentencia C-073 de 2018 hasta que la justicia agraria y rural asuma las competencias que le corresponden conforme al Acto Legislativo 03 de 2023». En la jurisdicción ordinaria, los asuntos «originados en relaciones de naturaleza agraria» son de los jueces civiles municipales (mínima cuantía, CGP art. 17 num. 1; menor cuantía, art. 18 num. 1) y de los jueces civiles del circuito (mayor cuantía, art. 20 num. 1), con competencia territorial privativa del juez del lugar de ubicación del inmueble (CGP art. 28 num. 7)',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: true, basis: 'art. 38 en concordancia con art. 52' },
      { n: 2, name: 'Identificación del demandante: Agencia Nacional de Tierras o particular afectado', mandatory: true, basis: 'art. 38 inc. 1' },
      { n: 3, name: 'Identificación del acto o instrumento de titulación o adjudicación cuya validez y eficacia se cuestiona', mandatory: true, basis: 'art. 38 inc. 1' },
      { n: 4, name: 'Hechos sobre el cumplimiento, por el beneficiario, de los requisitos vigentes al momento de la adjudicación', mandatory: true, basis: 'art. 38 inc. 2' },
      { n: 5, name: 'Pretensiones: validez o ineficacia del título, fraccionamiento o mejor condición entre herederos, y recuperación material del inmueble', mandatory: true, basis: 'art. 38 incs. 3 y 5' },
      { n: 6, name: 'Pretensión subsidiaria de reconocimiento del Subsidio Integral de Reforma Agraria a título de indemnización para el adjudicatario de buena fe', mandatory: false, basis: 'art. 38 inc. 4' },
      { n: 7, name: 'Pruebas, incluido el informe técnico jurídico', mandatory: true, basis: 'art. 80' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017.html'
  },
  {
    id: 'agrario/solicitud-de-acumulacion-de-procesos-al-procedimiento-unico',
    exactName: 'Solicitud de acumulación de procesos al Procedimiento Único',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 56 (acumulación procesal); art. 57 (suspensión de procesos administrativos y judiciales); Ley 1437 de 2011, art. 165 (reglas de acumulación, por remisión del art. 56)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT cuando se acumulan procedimientos administrativos, caso en el cual los funcionarios «perderán competencia sobre los trámites respectivos y procederán a remitírselos a dicha entidad en el término que esta señale»; el juez competente del Procedimiento Único cuando se trata de procesos judiciales (art. 56 inc. 2). Juez competente según la materia mientras la jurisdicción agraria y rural no asuma competencias: la jurisdicción de lo contencioso administrativo para el control de los actos administrativos del Procedimiento Único, y «los demás procesos deberán adelantarse ante el juez que corresponda según su materia» (Sentencia C-073 de 2018, que declaró INEXEQUIBLE el art. 78 del Decreto Ley 902 de 2017). La Sentencia C-099 de 2026 (22 de abril de 2026, M.P. Vladimir Fernández Andrade) precisa que esa competencia «continuará siendo ejercida por las autoridades judiciales establecidas en la Sentencia C-073 de 2018 hasta que la justicia agraria y rural asuma las competencias que le corresponden conforme al Acto Legislativo 03 de 2023». En la jurisdicción ordinaria, los asuntos «originados en relaciones de naturaleza agraria» son de los jueces civiles municipales (mínima cuantía, CGP art. 17 num. 1; menor cuantía, art. 18 num. 1) y de los jueces civiles del circuito (mayor cuantía, art. 20 num. 1), con competencia territorial privativa del juez del lugar de ubicación del inmueble (CGP art. 28 num. 7)',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del predio rural y del Procedimiento Único en curso', mandatory: true, basis: 'art. 56 inc. 1' },
      { n: 2, name: 'Identificación de los procesos administrativos o judiciales en curso cuyo objeto sea el derecho real de propiedad, la posesión, uso o goce del predio, incluidos los ejecutivos con garantía hipotecaria y las medidas cautelares', mandatory: true, basis: 'art. 56 inc. 1' },
      { n: 3, name: 'Salvedad expresa de lo dispuesto en el artículo 95 de la Ley 1448 de 2011, que no se acumula', mandatory: true, basis: 'art. 56 inc. 1 y art. 57 inc. 1' },
      { n: 4, name: 'Petición de acumulación conforme al art. 165 de la Ley 1437 de 2011', mandatory: true, basis: 'art. 56 inc. 1' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/solicitud-de-conciliacion-en-el-marco-del-procedimiento-unico',
    exactName: 'Solicitud de conciliación en el marco del Procedimiento Único',
    branch: 'AGRARIO',
    role: 'LITIGANTE',
    legalBasis: 'Decreto Ley 902 de 2017, art. 55 (mecanismos alternativos de solución de conflictos y conciliadores habilitados); art. 61 inc. 2 (el acuerdo o la conciliación evitan el paso a etapa judicial); art. 47 (si la conciliación resulta fallida, la ANT acude al juez)',
    competentAuthority: 'Agencia Nacional de Tierras, delegados regionales y seccionales de la Defensoría del Pueblo, personeros municipales y distritales, procuradores y defensores agrarios, centros de conciliación autorizados por el Ministerio de Justicia y del Derecho, y conciliadores en equidad (art. 55 inc. 1)',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de convocantes y convocados y del predio rural', mandatory: true, basis: 'art. 55 inc. 1' },
      { n: 2, name: 'Identificación del Procedimiento Único en curso y del asunto del art. 58', mandatory: true, basis: 'art. 55 inc. 1 en concordancia con art. 61 inc. 2' },
      { n: 3, name: 'Hechos y fórmula de arreglo propuesta', mandatory: true, basis: 'art. 55' },
      { n: 4, name: 'Constancia de que el acta de conciliación que requiera registro no necesita elevarse a escritura pública y está exenta de la tarifa registral', mandatory: false, basis: 'art. 55 inc. final' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/acto-administrativo-de-apertura-del-tramite-del-procedimiento-unico',
    exactName: 'Acto administrativo de apertura del trámite del Procedimiento Único',
    branch: 'AGRARIO',
    role: 'DESPACHO',
    legalBasis: 'Decreto Ley 902 de 2017, art. 70 (apertura para formalización y administración de derechos: asuntos de los nums. 3, 4, 5, 6, 7, 8 y 10 del art. 58); art. 68 (apertura para asignación y reconocimiento de derechos: nums. 1 y 2); art. 67 (informe técnico jurídico preliminar y RESO); art. 51 (irrecurribilidad de los actos de trámite)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'Expedido el acto, la ANT debe notificarlo por aviso conforme al art. 67 y ss. de la Ley 1437 de 2011, sin perjuicio de las notificaciones personales; publicar la parte resolutiva en la página de la entidad y del municipio y en un medio masivo de comunicación del territorio; y correr traslado a las partes por diez (10) días (art. 70). Contra este acto «no procede ningún recurso» (art. 70 parágrafo), como tampoco contra los actos de inicio, preparatorios y de trámite (art. 51).' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes ya identificadas al momento de expedir el acto', mandatory: true, basis: 'art. 70 inc. 1' },
      { n: 2, name: 'Naturaleza del asunto conforme al art. 58', mandatory: true, basis: 'art. 70 inc. 1' },
      { n: 3, name: 'Identificación del predio', mandatory: true, basis: 'art. 70 inc. 1' },
      { n: 4, name: 'Contenido del informe técnico jurídico preliminar', mandatory: true, basis: 'art. 70 inc. 1 en concordancia con art. 67' },
      { n: 5, name: 'Orden a la Oficina de Registro de Instrumentos Públicos de registrar el acto de apertura en el folio de matrícula', mandatory: true, basis: 'art. 70 inc. 1 y art. 40 parágrafo' },
      { n: 6, name: 'Orden de notificación por aviso y de publicación en la página de la entidad y del municipio y en un medio masivo de comunicación', mandatory: true, basis: 'art. 70 inc. 2, en concordancia con el art. 37 de la Ley 1437 de 2011' },
      { n: 7, name: 'Traslado a las partes por diez (10) días para aportar o solicitar pruebas', mandatory: true, basis: 'art. 70 inc. final' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/acto-administrativo-que-decreta-pruebas-en-el-procedimiento-unico',
    exactName: 'Acto administrativo que decreta pruebas en el Procedimiento Único',
    branch: 'AGRARIO',
    role: 'DESPACHO',
    legalBasis: 'Decreto Ley 902 de 2017, art. 71 (decreto de pruebas, notificación por estado y gastos a cargo del solicitante); art. 4 (sujetos de acceso y formalización a título gratuito); Ley 1437 de 2011, art. 76 (recurso de reposición)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'Se profiere «vencido el término del traslado del acto administrativo de apertura» (art. 71 inc. 1). «El acto administrativo será notificado por estado y comunicado a las partes vía electrónica o mensaje de texto, y será susceptible del recurso de reposición de acuerdo con lo indicado en la Ley 1437 de 2011» (art. 71 inc. 1). El acto debe advertir el plazo de cinco (5) días siguientes a su notificación para sufragar los gastos de la prueba pedida a instancia de parte, so pena de que «se entenderá que el solicitante desiste y se continuará con el proceso» (art. 71 inc. 2).' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente y de las partes', mandatory: true, basis: 'art. 71' },
      { n: 2, name: 'Decreto de las pruebas solicitadas por las partes y de las de oficio que se consideren pertinentes, útiles y conducentes', mandatory: true, basis: 'art. 71 inc. 1' },
      { n: 3, name: 'Liquidación de los gastos a cargo de quien solicitó la prueba y advertencia del plazo de cinco (5) días so pena de desistimiento', mandatory: true, basis: 'art. 71 inc. 2' },
      { n: 4, name: 'Salvedad de los sujetos categorizados en el RESO a título gratuito, que no sufragan gastos', mandatory: true, basis: 'art. 71 inc. 2 en concordancia con art. 4' },
      { n: 5, name: 'Constancia de notificación por estado y de comunicación electrónica o por mensaje de texto, con advertencia del recurso de reposición', mandatory: true, basis: 'art. 71 inc. 1' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/acto-administrativo-de-decisiones-y-cierre-del-procedimiento-unico-sin-oposicion',
    exactName: 'Acto administrativo de decisiones y cierre del Procedimiento Único sin oposición',
    branch: 'AGRARIO',
    role: 'DESPACHO',
    legalBasis: 'Decreto Ley 902 de 2017, art. 74 (cierre de los asuntos del num. 3 del art. 58 sin oposición); art. 73 (cierre en asignación y reconocimiento de derechos); art. 72 (informe técnico jurídico definitivo); art. 76 (recursos y control judicial); art. 77 (notificación personal)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'Se profiere con fundamento en el informe técnico jurídico definitivo (arts. 72 y 74) y se notifica personalmente conforme al art. 67 y ss. de la Ley 1437 de 2011 (art. 77). Contra el acto proceden reposición y en subsidio apelación (art. 76 inc. 1), y su único control judicial es la acción de nulidad agraria del art. 39 —cuatro (4) meses desde la ejecutoria—, pues «No habrá lugar a la acción de control de nulidad de que trata la Ley 1437 de 2011» (art. 76 inc. 2). En firme el acto y sufragados los gastos notariales, la ANT lo radica en la Oficina de Registro de Instrumentos Públicos del círculo donde se encuentra el predio (art. 74 parágrafo 2).' },
    requiredSections: [
      { n: 1, name: 'Identificación del predio, del expediente y de los sujetos', mandatory: true, basis: 'art. 74' },
      { n: 2, name: 'Fundamento en el informe técnico jurídico definitivo y en las demás pruebas recaudadas', mandatory: true, basis: 'art. 74 inc. 1 en concordancia con art. 72 inc. final' },
      { n: 3, name: 'Constancia de que no se presentaron oposiciones a lo largo de todo el proceso', mandatory: true, basis: 'art. 74 inc. 1' },
      { n: 4, name: 'Decisión de fondo que corresponda al asunto', mandatory: true, basis: 'art. 74 inc. 1' },
      { n: 5, name: 'Remisión a la notaría cuando se trate de sucesiones por mutuo acuerdo o ratificaciones de ventas', mandatory: false, basis: 'art. 74 parágrafo 1' },
      { n: 6, name: 'Orden de radicación para registro en la Oficina de Registro de Instrumentos Públicos', mandatory: true, basis: 'art. 74 parágrafo 2' },
      { n: 7, name: 'Advertencia de los recursos de reposición y apelación y del control judicial por acción de nulidad agraria', mandatory: true, basis: 'art. 76 incs. 1 y 2' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  },
  {
    id: 'agrario/acto-administrativo-de-cierre-que-ordena-presentar-la-demanda-ante-el-juez-competente',
    exactName: 'Acto administrativo de cierre que ordena presentar la demanda ante el juez competente',
    branch: 'AGRARIO',
    role: 'DESPACHO',
    legalBasis: 'Decreto Ley 902 de 2017, art. 75 (cierre de los asuntos con oposición y de los nums. 5, 6, 7 y 10 del art. 58); art. 60 num. 2 y art. 61 inc. 2 (asuntos que siempre pasan a fase judicial); art. 76 inc. 3 (irrecurribilidad); art. 80 (valor probatorio del informe técnico jurídico que acompaña la demanda)',
    competentAuthority: 'Agencia Nacional de Tierras — ANT (fase administrativa del Procedimiento Único). NO existen jueces agrarios y rurales en funcionamiento: el art. 78 del Decreto Ley 902 de 2017, que fijaba las autoridades judiciales de la fase judicial, fue declarado INEXEQUIBLE por la Sentencia C-073 de 2018',
    term: { status: 'VERIFICADO', description: 'El acto de cierre «dispondrá la presentación de la demanda ante el juez competente» (art. 75). El art. 75 no fija plazo a la ANT para presentarla. Contra este acto no procede recurso alguno, ni acción de nulidad agraria, ni la nulidad del CPACA, «teniendo en cuenta que la decisión de fondo será tomada en sede judicial» (art. 76 inc. 3). En zonas no focalizadas, los asuntos de los nums. 4, 5, 6, 7 y 10 del art. 58 «siempre pasarán a etapa judicial para su decisión de fondo, con independencia de que se hubieren presentado o no oposiciones en el trámite administrativo, salvo que durante el desarrollo del proceso administrativo exista un acuerdo o conciliación entre las partes procesales» (art. 61 inc. 2).' },
    requiredSections: [
      { n: 1, name: 'Identificación del predio, del expediente y de las partes, incluidos los opositores', mandatory: true, basis: 'art. 75 en concordancia con art. 46' },
      { n: 2, name: 'Relación del asunto del art. 58 al que corresponde', mandatory: true, basis: 'art. 75' },
      { n: 3, name: 'Informe técnico jurídico definitivo que acompañará la demanda', mandatory: true, basis: 'art. 72 inc. final y art. 80' },
      { n: 4, name: 'Orden de presentar la demanda ante el juez competente', mandatory: true, basis: 'art. 75' },
      { n: 5, name: 'Advertencia de que contra el acto no proceden recursos ni acción de nulidad', mandatory: true, basis: 'art. 76 inc. 3' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/decreto_0902_2017_pr001.html'
  }
  ]
};
