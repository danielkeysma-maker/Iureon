import type { BranchCatalog } from '../types';

/**
 * ARBITRAJE catalogue.
 *
 * Generated from research/actuaciones-arbitraje.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const ARBITRAJE_CATALOG: BranchCatalog = {
  meta: {
    branch: 'ARBITRAJE',
    verifiedAt: '2026-08-26',
    sourceOfTruth: 'Ley 1563 de 2012, Estatuto de Arbitraje Nacional e Internacional, Seccion Primera (arts. 1 a 58, arbitraje nacional) y Seccion Cuarta (art. 117, arbitraje social). Sin reformas estructurales; la prorroga de los arts. 10 y 11 del Decreto Legislativo 491 de 2020 esta agotada. La anulacion del laudo nacional corresponde a la Sala Civil del Tribunal Superior del lugar donde funciono el tribunal (art. 46 inc. 1), o a la Seccion Tercera del Consejo de Estado si interviene una entidad publica (inc. 3); la revision, en cambio, es de la Sala Civil de la Corte Suprema (art. 46 inc. 2). El arbitraje internacional de la Seccion Tercera (arts. 62 a 116) vive en la rama INTERNACIONAL, con otra competencia.',
    gaps: [
    'ARBITRAJE: AMIGABLE COMPOSICIÓN (Ley 1563 de 2012, arts. 59 a 61, Sección Segunda). No se cataloga: la ley no fija términos ni requisitos formales del escrito. El art. 61 deja el procedimiento a las partes o, en su defecto, al reglamento del centro de arbitraje del domicilio de la parte convocada escogido a prevención por la convocante. Catalogarla produciría fichas sin término y con secciones inventadas. Además el amigable componedor \'obrará como mandatario de las partes\' (art. 60) y su decisión produce los efectos legales propios de la transacción, no de una sentencia.',
    'ARBITRAJE: CREACIÓN Y REGLAMENTO DE CENTROS DE ARBITRAJE (arts. 50 a 52). Es trámite administrativo de autorización ante el Ministerio de Justicia y del Derecho, no una actuación procesal; su lugar natural sería ADMINISTRATIVO y depende de una metodología reglamentaria que no se leyó en fuente oficial.',
    'ARBITRAJE: ARBITRAJE AD HOC (arts. 53 a 57): no se abrieron fichas separadas de demanda, contestación, honorarios ni recursos, porque el art. 57 dispone que a la demanda, su notificación, traslado, contestación, oportunidad para pedir pruebas, fijación y consignación de honorarios y gastos, recursos y en general al trámite \'le serán aplicables las reglas previstas en esta ley para el arbitraje institucional\'. Duplicarlas produciría fichas de idéntico contenido y exact_name ambiguo. Lo específico del ad hoc si quedó recogido: la designación judicial del árbitro (art. 53) esta en \'Solicitud de designación de árbitro por el juez civil del circuito\'; el plazo de quince días del art. 56 para presentar la demanda tras la instalación se menciona allí mismo y no se abrió como ficha propia.',
    'ARBITRAJE: INTERVENCIÓN DEL MINISTERIO PÚBLICO Y DE LA AGENCIA NACIONAL DE DEFENSA JURÍDICA DEL ESTADO (art. 49). Es una facultad de intervención sin escrito de estructura y término propios; el aviso al que obliga la norma quedó como sección de la ficha \'Acta de instalación del tribunal arbitral\'.',
    'ARBITRAJE: EJECUCIÓN DEL LAUDO NACIONAL. El art. 43 inciso final remite a la justicia ordinaria o contencioso administrativa, de modo que el escrito es una demanda ejecutiva regida por el CGP y ya cubierta por CIVIL (\'Demanda ejecutiva singular\') y por CONTRATACIÓN (\'Demanda ejecutiva con títulos derivados del contrato estatal, de decisiones judiciales de la Jurisdicción de lo Contencioso Administrativo o de laudos arbitrales contractuales estatales\'). Abrir una ficha aquí las duplicaría.',
    'ARBITRAJE: PRUEBA PERICIAL EN EL ARBITRAJE (art. 31). Los términos los fija prudencialmente el tribunal (\'el perito rendirá la experticia en el término que prudencialmente le señale el tribunal\'), y el traslado del dictamen es \'por un término de hasta diez (10) días\', tope también discrecional. No hay plazo legal fijo que catalogar sin inventarlo. Se deja constancia de que el art. 31 suprime el trámite especial de objeción por error grave.',
    'ARBITRAJE: AUDIENCIA DE CONCILIACIÓN ARBITRAL (art. 24). Es una actuación del tribunal sin escrito propio del litigante ni término legal de días; su único efecto con plazo -la fijación de honorarios al fracasar- quedó en la ficha \'Auto de fijación de honorarios y gastos del tribunal arbitral\'.',
    'ARBITRAJE, verificado el esta pasada: NORMA VIGENTE: Ley 1563 de 2012, Estatuto de Arbitraje Nacional e Internacional. Se descargó el HTML crudo completo de secretariasenado en sus tres páginas -ley_1563_2012.html (arts. 1 a 45), ley_1563_2012_pr001.html (arts. 46 a 84) y ley_1563_2012_pr002.html (arts. 85 a 119)- y se contaron los artículos: 119, sin huecos. La primera página, leída sola, se corta en el art. 45; no es truncamiento de la fuente sino paginación, y las páginas pr001 y pr002 traen el resto. También se descargó el archivo de notas de vigencia basedoc/js/ley_1563_2012.js: las únicas normas posteriores que allí aparecen son la Ley 1682 de 2013 (art. 14, solución de controversias en proyectos de infraestructura de transporte, como concordancia), la Ley 1952 de 2019 y la Ley 2094 de 2021 (citadas en jurisprudencia sobre el régimen disciplinario de árbitros del art. 19) y el Decreto Legislativo 491 de 2020 art. 11 (prórroga temporal de los términos de los arts. 10 y 11, medida de la emergencia sanitaria, ya agotada). Ninguna reforma estructural del procedimiento arbitral nacional. Última actualización de la fuente: 15 de agosto de 2026 (Diario Oficial 53.578). PASO 0. (1) EXISTE HOY: si. El art. 119 dispone que \'esta ley regula íntegramente la materia de arbitraje\', y sus arts. 1 a 58 rigen el arbitraje nacional. CORRECCIÓN A LA PREMISA DEL ENCARGO: la Sección Primera NO va del art. 1 al 106. La estructura verificada artículo por artículo es: Sección Primera, ARBITRAJE NACIONAL, arts. 1 a 58; Sección Segu'
    ]
  },
  actuaciones: [
  {
    id: 'arbitraje/demanda-arbitral',
    exactName: 'Demanda arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 12 (iniciación del proceso arbitral y presentación ante el centro de arbitraje); art. 3 (pacto arbitral); art. 20 inciso 5 (admisión, inadmisión y rechazo de la demanda); art. 2 (cuantías y necesidad de abogado); Ley 1564 de 2012, art. 82 (requisitos de la demanda, norma que sustituyó al Código de Procedimiento Civil al que remite el art. 12)',
    competentAuthority: 'Se presenta ante el centro de arbitraje acordado por las partes; en su defecto, ante uno del lugar del domicilio de la demandada y, si esta fuere plural, en el de cualquiera de sus integrantes. Si no hubiere centro de arbitraje en el domicilio acordado o en el del demandado, ante el centro de arbitraje más cercano. El centro que no fuere competente remitirá la demanda al que lo fuere, y los conflictos de competencia entre centros los resuelve el Ministerio de Justicia y del Derecho (art. 12). El fondo lo decide el tribunal arbitral, no un juez.',
    term: { status: 'VERIFICADO', description: 'La ley no fija plazo para presentar la demanda arbitral: el reloj que corre contra el cliente es el de prescripción o caducidad de la pretensión sustancial, que solo se interrumpe con la presentación. Dos plazos propios del arbitraje pueden destruir ese efecto y ambos son del DEMANDANTE. (a) Si el tribunal rechaza la demanda -lo que hará de plano cuando no se acompañe prueba de la existencia del pacto arbitral-, \'el demandante tendrá un término de veinte (20) días hábiles para instaurar la demanda ante el juez competente para conservar los efectos derivados de la presentación de la demanda ante el centro de arbitraje\' (art. 20 inciso 5). (b) Si en la primera audiencia de trámite el tribunal se declara incompetente para conocer de ninguna de las pretensiones de la demanda y la reconvención, \'el demandante tendrá un término de veinte (20) días hábiles para instaurar la demanda ante el juez competente\' (art. 30). Vencidos esos veinte días hábiles se pierde la interrupción de la prescripción y opera la caducidad. En procesos de menor cuantía -pretensiones patrimoniales que no superen 400 smlmv- y cuando por la cuantía o la naturaleza del asunto no se requiera abogado ante los jueces ordinarios, las partes pueden intervenir directamente (art. 2).' },
    requiredSections: [
      { n: 1, name: 'Designación del centro de arbitraje al que se dirige', mandatory: true, basis: 'Art. 12' },
      { n: 2, name: 'Partes, su domicilio y representación', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 3, name: 'Pretensiones', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 4, name: 'Hechos', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 6, name: 'Invocación y prueba del pacto arbitral, con el documento que lo contiene', mandatory: true, basis: 'Arts. 3 y 20 inciso 5' },
      { n: 7, name: 'Juramento estimatorio y cuantía', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 8, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 9, name: 'Anexo del pacto arbitral', mandatory: true, basis: 'Art. 12' },
      { n: 10, name: 'Notificaciones', mandatory: true, basis: 'Art. 82 CGP' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/contestacion-de-la-demanda-arbitral',
    exactName: 'Contestación de la demanda arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 21 (traslado y contestación, improcedencia de excepciones previas e incidentes, procedencia de la reconvención); art. 3 parágrafo (efecto de no negar expresamente el pacto arbitral); art. 41 inciso final (exigencia de reposición previa para las causales 1, 2 y 3 de anulación); Ley 1564 de 2012, art. 96 (contenido de la contestación)',
    competentAuthority: 'Tribunal arbitral, ante el cual se surte el traslado',
    term: { status: 'VERIFICADO', description: 'Veinte (20) días. Art. 21: \'De la demanda se correrá traslado por el término de veinte (20) días. Vencido este, se correrá traslado al demandante por el término de cinco (5) días, dentro de los cuales podrá solicitar pruebas adicionales relacionadas con los hechos en que se funden las excepciones de mérito.\' Los veinte días son del DEMANDADO; los cinco días siguientes son del DEMANDANTE y solo sirven para pedir pruebas adicionales sobre las excepciones de mérito. En el arbitraje no proceden las excepciones previas ni los incidentes (art. 21 inciso 2), de modo que todo reparo procesal debe canalizarse por otra via: los vicios de jurisdicción, competencia, caducidad, inexistencia, invalidez o inoponibilidad del pacto y constitución irregular del tribunal solo podrán invocarse después en anulación \'si el recurrente hizo valer los motivos constitutivos de ellas mediante recurso de reposición contra el auto de asunción de competencia\' (art. 41 inciso final). Y guardar silencio sobre el pacto lo da por probado: \'Si en el término de traslado de la demanda, o de su contestación, o de las excepciones previas, una parte invoca la existencia de pacto arbitral y la otra no la niega expresamente, ante los jueces o el tribunal de arbitraje, se entiende válidamente probada la existencia de pacto arbitral\' (art. 3 parágrafo).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y del tribunal', mandatory: true, basis: null },
      { n: 2, name: 'Pronunciamiento expreso sobre cada hecho', mandatory: true, basis: 'Art. 96 CGP' },
      { n: 3, name: 'Pronunciamiento expreso sobre la existencia del pacto arbitral', mandatory: true, basis: 'Art. 3 parágrafo' },
      { n: 4, name: 'Excepciones de mérito, con los hechos que las fundan', mandatory: true, basis: 'Art. 21' },
      { n: 5, name: 'Objeción al juramento estimatorio', mandatory: false, basis: 'Art. 96 CGP' },
      { n: 6, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 96 CGP' },
      { n: 7, name: 'Notificaciones', mandatory: true, basis: 'Art. 96 CGP' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/demanda-de-reconvencion-en-proceso-arbitral',
    exactName: 'Demanda de reconvención en proceso arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 21 inciso 2 (\'Es procedente la demanda de reconvención pero no las excepciones previas ni los incidentes\'); art. 25 (la cuantía mayor sirve de base a los honorarios); art. 27 (oportunidad para consignar); art. 22 (reforma de la demanda); Ley 1564 de 2012, art. 82',
    competentAuthority: 'Tribunal arbitral',
    term: { status: 'VERIFICADO', description: 'Se presenta dentro del término de traslado de la demanda, es decir, dentro de los veinte (20) días del art. 21 y junto con la contestación. Vencido ese término no hay otra oportunidad, porque en el arbitraje no existen las excepciones previas ni los incidentes que en el proceso civil abren nuevas fases. La reconvención trae además un costo que corre contra quien la formula: si hay demanda de reconvención, el tribunal \'tomará como base la de la cuantía mayor\' para fijar honorarios y gastos (art. 25), y esas sumas deberán consignarse \'dentro de los diez (10) días siguientes\' a la firmeza de la regulación (art. 27), so pena de que el tribunal declare concluidas sus funciones y extinguidos los efectos del pacto arbitral para el caso.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y de la demanda que se reconviene', mandatory: true, basis: null },
      { n: 2, name: 'Partes', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 3, name: 'Pretensiones', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 4, name: 'Hechos', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 6, name: 'Demostración de que la reconvención queda cubierta por el pacto arbitral', mandatory: true, basis: 'Art. 21' },
      { n: 7, name: 'Juramento estimatorio y cuantía', mandatory: true, basis: 'Art. 82 CGP' },
      { n: 8, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 CGP' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/recurso-de-reposicion-contra-el-auto-de-asuncion-de-competencia-del-tribunal-arbitral',
    exactName: 'Recurso de reposición contra el auto de asunción de competencia del tribunal arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 30 (el tribunal resuelve sobre su propia competencia en la primera audiencia de trámite \'mediante auto que solo es susceptible de recurso de reposición\'); art. 29 (prevalencia de esa decisión sobre la del juez ordinario o contencioso); art. 41 inciso final (las causales 1, 2 y 3 de anulación solo pueden invocarse si se hizo valer la reposición); Ley 1564 de 2012, art. 319 (trámite de la reposición en audiencia)',
    competentAuthority: 'El propio tribunal arbitral, en la primera audiencia de trámite',
    term: { status: 'VERIFICADO', description: 'Es el plazo que mata el derecho y no esta en el artículo sobre anulación. El auto de asunción de competencia se profiere en la primera audiencia de trámite y \'solo es susceptible de recurso de reposición\' (art. 30). Por tratarse de un auto dictado en audiencia, \'el recurso de reposición se decidirá en la audiencia, previo traslado en ella a la parte contraria\' (Ley 1564 de 2012, art. 319): se interpone y sustenta allí mismo, no después por escrito. Si no se interpone, se pierden para siempre las causales 1, 2 y 3 del recurso extraordinario de anulación -inexistencia, invalidez absoluta o inoponibilidad del pacto arbitral; caducidad de la acción, falta de jurisdicción o de competencia; y no haberse constituido el tribunal en forma legal-, porque el art. 41 dispone: \'Las causales 1, 2 y 3 solo podrán invocarse si el recurrente hizo valer los motivos constitutivos de ellas mediante recurso de reposición contra el auto de asunción de competencia.\' Y no sirve acudir al juez: la decisión del tribunal sobre su propia competencia \'prevalece sobre cualquier otra proferida en sentido contrario por un juez ordinario o contencioso administrativo\' (art. 29).' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto recurrido y de la audiencia en que se profirió', mandatory: true, basis: 'Art. 30' },
      { n: 2, name: 'Motivos concretos de falta de jurisdicción, de competencia, de caducidad, de inexistencia, invalidez o inoponibilidad del pacto, o de constitución irregular del tribunal', mandatory: true, basis: 'Art. 41 nums. 1 a 3' },
      { n: 3, name: 'Sustentación de cada motivo', mandatory: true, basis: 'Art. 41 inciso final' },
      { n: 4, name: 'Petición de revocatoria del auto', mandatory: true, basis: 'Art. 30' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/solicitud-de-medidas-cautelares-en-proceso-arbitral',
    exactName: 'Solicitud de medidas cautelares en proceso arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 32 (medidas cautelares en el arbitraje nacional, comisión al juez, caución del veinte por ciento y caducidad automática); art. 32 parágrafo (medidas cautelares con fines probatorios)',
    competentAuthority: 'El tribunal arbitral las decreta. Para su práctica \'podrá comisionar al juez civil municipal o del circuito del lugar en donde deba practicarse la medida cautelar\'; cuando sea parte una entidad pública o quien desempeñe funciones administrativas, podrá además comisionar al juez administrativo (art. 32).',
    term: { status: 'VERIFICADO', description: 'La solicitud puede formularse en cualquier momento del proceso, pero trae dos relojes propios del solicitante. Primero, la caución: \'Para que sea decretada cualquiera de las anteriores medidas cautelares innominadas, el demandante deberá prestar caución equivalente al veinte por ciento (20%) del valor de las pretensiones estimadas en la demanda, para responder por las costas y perjuicios derivados de su práctica\', monto que el tribunal puede aumentar o disminuir cuando lo considere razonable, o fijar superior al decretar la medida. Segundo, la caducidad de la medida ya practicada, que es el plazo que suele omitirse: \'Si el tribunal omitiere el levantamiento de las medidas cautelares, la medida caducará automáticamente transcurridos tres (3) meses desde la ejecutoria del laudo o de la providencia que decida definitivamente el recurso de anulación. El registrador o a quien le corresponda, a solicitud de parte, procederá a cancelarla\' (art. 32). Frente a medidas relacionadas con pretensiones pecuniarias, el demandado puede impedir su práctica o pedir su levantamiento o modificación prestando caución; no puede hacerlo cuando la medida no este relacionada con pretensiones económicas o procure anticipar materialmente el fallo.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y del solicitante', mandatory: true, basis: null },
      { n: 2, name: 'Medida solicitada y bienes o conductas sobre los que recae', mandatory: true, basis: 'Art. 32' },
      { n: 3, name: 'Legitimación o interés para actuar', mandatory: true, basis: 'Art. 32 inciso 3' },
      { n: 4, name: 'Apariencia de buen derecho, necesidad, efectividad y proporcionalidad de la medida', mandatory: true, basis: 'Art. 32 inciso 4' },
      { n: 5, name: 'Ofrecimiento de la caución del veinte por ciento de las pretensiones estimadas', mandatory: true, basis: 'Art. 32' },
      { n: 6, name: 'Solicitud de comisión al juez del lugar de práctica, si procede', mandatory: false, basis: 'Art. 32' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/recurso-extraordinario-de-anulacion-de-laudo-arbitral',
    exactName: 'Recurso extraordinario de anulación de laudo arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 40 (oportunidad, sustentación y remisión); art. 41 (causales y exigencia de reposición previa); art. 42 (rechazo de plano, término de sentencia y límites); art. 43 (efectos); art. 44 (prescripción y caducidad tras la anulación); art. 46 (competencia)',
    competentAuthority: 'Se interpone ANTE EL TRIBUNAL ARBITRAL, que corre traslado y remite. Lo decide, por regla general, la Sala Civil del Tribunal Superior de Distrito Judicial del lugar en donde hubiese funcionado el tribunal de arbitraje (art. 46 inciso 1). Cuando en el arbitraje intervenga una entidad pública o quien desempeñe funciones administrativas, es competente la Sección Tercera de la Sala de lo Contencioso Administrativo del Consejo de Estado (art. 46 inciso 3). NO es competente la Sala de Casación Civil de la Corte Suprema de Justicia: esa es la regla del arbitraje INTERNACIONAL (art. 68 inciso 2) y no se aplica al laudo nacional.',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días, y el escrito debe ir SUSTENTADO desde la interposición. Art. 40: \'Contra el laudo arbitral procede el recurso extraordinario de anulación, que deberá interponerse debidamente sustentado, ante el tribunal arbitral, con indicación de las causales invocadas, dentro de los treinta (30) días siguientes a su notificación o la de la providencia que resuelva sobre su aclaración, corrección o adición.\' No hay término separado para sustentar: interponer sin sustentar equivale a perderlo, porque \'la autoridad judicial competente rechazará de plano el recurso de anulación cuando su interposición fuere extemporánea, no se hubiere sustentando o las causales invocadas no correspondan a ninguna de las señaladas en esta ley\' (art. 42). Los quince (15) días de traslado son de la OTRA parte y los cinco (5) días de envio son de la secretaría del tribunal (art. 40); los tres (3) meses para sentencia son del juez (art. 42). Dos plazos más son del recurrente: las causales 1, 2 y 3 exigen haber interpuesto reposición contra el auto de asunción de competencia (art. 41 inciso final), y, si prospera la anulación por las causales 3 a 7, \'se considerará interrumpida la prescripción y no operará la caducidad, cuando se anule el laudo por cualquiera de las causales 3 a 7, siempre que la parte interesada presente la solicitud de convocatoria de tribunal arbitral dentro de los tres (3) meses siguientes a la ejecutoria de la sentencia\' (art. 44). La interposición y el trámite no suspenden el cumplimiento de lo resuelto en el laudo, salvo cuando la entidad pública condenada solicite la suspensión (art. 42).' },
    requiredSections: [
      { n: 1, name: 'Identificación del laudo, de su fecha de notificación y del tribunal arbitral', mandatory: true, basis: 'Art. 40' },
      { n: 2, name: 'Indicación expresa de las causales invocadas', mandatory: true, basis: 'Arts. 40 y 41' },
      { n: 3, name: 'Sustentación de cada causal, en el mismo escrito de interposición', mandatory: true, basis: 'Arts. 40 y 42' },
      { n: 4, name: 'Prueba de haber interpuesto reposición contra el auto de asunción de competencia, si se invocan las causales 1, 2 o 3', mandatory: true, basis: 'Art. 41 inciso final' },
      { n: 5, name: 'Petición de anulación, corrección o adición según la causal', mandatory: true, basis: 'Art. 43' },
      { n: 6, name: 'Solicitud de suspensión del cumplimiento del laudo, solo si el recurrente es entidad pública condenada', mandatory: false, basis: 'Art. 42' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/recurso-extraordinario-de-revision-de-laudo-arbitral',
    exactName: 'Recurso extraordinario de revisión de laudo arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 45 (procedencia contra el laudo y contra la sentencia de anulación, por las causales y el trámite del estatuto procesal civil, con límite para quien pudo recurrir en anulación); art. 46 incisos 2 y 3 (competencia); Ley 1564 de 2012, arts. 354 a 358 (procedencia, causales, término y formulación), normas que sustituyeron al Código de Procedimiento Civil al que remite el art. 45',
    competentAuthority: 'Sala Civil de la Corte Suprema de Justicia. Ley 1563 de 2012, art. 46 inciso 2: \'Será competente para conocer del recurso extraordinario de revisión de laudos arbitrales la Sala Civil de la Corte Suprema de Justicia.\' Cuando en el arbitraje intervenga una entidad pública o quien desempeñe funciones administrativas, es competente la Sección Tercera de la Sala de lo Contencioso Administrativo del Consejo de Estado (art. 46 inciso 3). No confundir con la anulación, que va a la Sala Civil del Tribunal Superior del lugar donde funcionó el tribunal.',
    term: { status: 'VERIFICADO', description: 'Dos (2) años, con reglas distintas de conteo según la causal. El art. 45 remite a las causales y al trámite del estatuto procesal civil, hoy la Ley 1564 de 2012, cuyo art. 356 dispone: \'El recurso podrá interponerse dentro de los dos (2) años siguientes a la ejecutoria de la respectiva sentencia cuando se invoque alguna de las causales consagradas en los numerales 1, 6, 8 y 9 del artículo precedente. Cuando se alegue la causal prevista en el numeral 7 del mencionado artículo, los dos (2) años comenzarán a correr desde el día en que la parte perjudicada con la sentencia o su representante haya tenido conocimiento de ella, con límite máximo de cinco (5) años.\' Si la decisión debe inscribirse en un registro público, los términos solo corren desde la inscripción. En las causales 2 a 5 el recurso debe interponerse dentro del mismo término de dos años, y si el proceso penal no ha terminado se suspende la sentencia de revisión hasta la ejecutoria del fallo penal, sin exceder de dos años. Límite propio del arbitraje: \'quien tuvo oportunidad de interponer el recurso de anulación no podrá alegar indebida representación o falta de notificación\' (art. 45), de modo que la causal 7 del art. 355 del CGP queda cerrada para quien pudo recurrir en anulación.' },
    requiredSections: [
      { n: 1, name: 'Nombre y domicilio del recurrente', mandatory: true, basis: 'Art. 357 CGP' },
      { n: 2, name: 'Nombre y domicilio de quienes fueron parte en el proceso arbitral', mandatory: true, basis: 'Art. 357 CGP' },
      { n: 3, name: 'Designación del proceso arbitral, fecha del laudo o de la sentencia de anulación y fecha de ejecutoria', mandatory: true, basis: 'Art. 357 CGP' },
      { n: 4, name: 'Causal invocada y hechos concretos que le sirven de fundamento', mandatory: true, basis: 'Arts. 355 y 357 CGP' },
      { n: 5, name: 'Petición de las pruebas que se pretenda hacer valer', mandatory: true, basis: 'Art. 357 CGP' },
      { n: 6, name: 'Copias del art. 89 del CGP', mandatory: true, basis: 'Art. 357 CGP' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012_pr001.html'
  },
  {
    id: 'arbitraje/solicitud-de-aclaracion-correccion-o-adicion-del-laudo-arbitral',
    exactName: 'Solicitud de aclaración, corrección o adición del laudo arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 39 (oportunidad); art. 40 (efecto sobre el cómputo del recurso de anulación); art. 10 (la providencia que la resuelve debe proferirse y notificarse dentro del término del proceso); art. 41 num. 8 (causal de anulación por errores del laudo alegados oportunamente)',
    competentAuthority: 'El mismo tribunal arbitral que profirió el laudo',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días. Art. 39: \'Dentro de los cinco (5) días siguientes a su notificación, el laudo podrá ser aclarado, corregido y complementado de oficio; asimismo, podrá serlo a solicitud de parte, formulada dentro del mismo término.\' Dos consecuencias que suelen omitirse. Primera, presentar la solicitud desplaza el punto de partida de la anulación, que corre \'dentro de los treinta (30) días siguientes a su notificación o la de la providencia que resuelva sobre su aclaración, corrección o adición\' (art. 40). Segunda, no pedirla puede cerrar una causal: la causal 8 de anulación -disposiciones contradictorias, errores aritméticos o errores por omisión o cambio de palabras o alteración de estas- solo procede si tales errores \'hubieran sido alegados oportunamente ante el tribunal arbitral\' (art. 41 num. 8). El tribunal, por su parte, esta sujeto a su propio reloj: dentro del término de duración del proceso \'deberá proferirse y notificarse, incluso, la providencia que resuelve la solicitud de aclaración, corrección o adición\' (art. 10).' },
    requiredSections: [
      { n: 1, name: 'Identificación del laudo y de su fecha de notificación', mandatory: true, basis: 'Art. 39' },
      { n: 2, name: 'Frase, concepto o cifra cuya aclaración, corrección o adición se pide', mandatory: true, basis: 'Art. 39' },
      { n: 3, name: 'Señalamiento del punto de la parte resolutiva afectado o influido', mandatory: true, basis: 'Art. 41 num. 8' },
      { n: 4, name: 'Petición concreta', mandatory: true, basis: 'Art. 39' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/solicitud-de-amparo-de-pobreza-en-proceso-arbitral',
    exactName: 'Solicitud de amparo de pobreza en proceso arbitral',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 13 (amparo de pobreza arbitral, designación del apoderado a la suerte entre los árbitros del centro y exoneración de honorarios y gastos); art. 27 (oportunidad para la consignación y extinción del pacto por falta de pago); Ley 1564 de 2012, arts. 151 a 158, normas que sustituyeron al Código de Procedimiento Civil al que remite el art. 13',
    competentAuthority: 'Tribunal arbitral. Si hay lugar a designar apoderado, \'esta se hará a la suerte entre los abogados incluidos en la lista de árbitros del respectivo centro de arbitraje, salvo que el interesado lo designe\' (art. 13).',
    term: { status: 'VERIFICADO', description: 'La Ley 1563 de 2012 no fija plazo propio: concede el amparo \'total o parcialmente, en los términos del Código de Procedimiento Civil\' (art. 13), hoy los arts. 151 a 158 de la Ley 1564 de 2012. Lo propio del arbitraje, y decisivo para el cliente, es el alcance: \'Sin perjuicio de lo que resuelva el laudo sobre costas, el amparado quedará exonerado del pago de los honorarios y gastos del tribunal arbitral, sin que le corresponda a su contraparte sufragar lo que al amparado le hubiese correspondido pagar\' (art. 13). El amparo no traslada la carga a la contraparte. Como el reloj que extingue el proceso es el del art. 27 -diez (10) días para consignar honorarios y gastos y cinco (5) días más para que una parte consigne por la otra, tras los cuales \'el tribunal mediante auto declarará concluidas sus funciones y extinguidos los efectos del pacto arbitral para el caso\'-, la solicitud debe presentarse antes de que ese término venza.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y del solicitante', mandatory: true, basis: null },
      { n: 2, name: 'Afirmación bajo juramento de no hallarse en capacidad de atender los gastos del proceso sin menoscabo de lo necesario para la propia subsistencia y la de las personas a cargo', mandatory: true, basis: 'Art. 152 CGP' },
      { n: 3, name: 'Alcance total o parcial del amparo que se pide', mandatory: true, basis: 'Art. 13' },
      { n: 4, name: 'Petición de designación de apoderado, o designación del que el interesado escoja', mandatory: false, basis: 'Art. 13' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/recusacion-de-arbitro',
    exactName: 'Recusación de árbitro',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 15 (deber de información y manifestación de dudas justificadas dentro de cinco días); art. 16 (causales y oportunidades de recusación); art. 17 (trámite y competencia para decidir); art. 48 (pérdida de honorarios del árbitro recusado con éxito); art. 41 num. 3 (constitución irregular del tribunal como causal de anulación)',
    competentAuthority: 'Si el árbitro rechaza la recusación, deciden de plano los demás árbitros. \'Si fueren recusados todos los árbitros o varios, o se tratare de árbitro único, decidirá en la misma forma el juez civil del circuito del lugar donde funcione el tribunal de arbitraje, para lo cual se remitirá la actuación que deberá ser sometida a reparto en el término de cinco (5) días\' (art. 17). La providencia que decide la recusación no es susceptible de ningún recurso. Tratandose del secretario, deciden los árbitros (art. 15).',
    term: { status: 'VERIFICADO', description: 'Hay tres relojes distintos y todos de cinco (5) días del interesado; confundirlos cierra la via. (a) Dudas sobre la información revelada: \'Si dentro de los cinco (5) días siguientes al recibo de la comunicación de aceptación, alguna de las partes manifestare por escrito dudas justificadas acerca de la imparcialidad o independencia del árbitro y su deseo de relevar al árbitro con fundamento en la información suministrada por este, se procederá a su reemplazo en la forma prevista para tal efecto\' (art. 15). (b) Árbitros nombrados por el juez o por un tercero: \'serán recusables dentro de los cinco (5) días siguientes a la comunicación de su aceptación a las partes o de la fecha en que la parte tuvo o debio tener conocimiento de los hechos, cuando se trate de circunstancias sobrevinientes\' (art. 16). (c) Árbitros nombrados por acuerdo de las partes: \'no podrán ser recusados sino por motivos sobrevenidos con posterioridad a su designación, y dentro de los cinco (5) días siguientes a aquel en que la parte tuvo conocimiento de los hechos\' (art. 16). Los cinco días que tiene el árbitro para pronunciarse (art. 17) son suyos, no del recusante. No recusar oportunamente compromete la causal 3 de anulación, que además exige reposición previa contra el auto de asunción de competencia (art. 41 inciso final).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y del árbitro o secretario recusado', mandatory: true, basis: 'Art. 16' },
      { n: 2, name: 'Causal invocada, con indicación de la norma que la consagra', mandatory: true, basis: 'Art. 16' },
      { n: 3, name: 'Hechos que la configuran y fecha en que se conocieron', mandatory: true, basis: 'Art. 16' },
      { n: 4, name: 'Pruebas que se acompañan', mandatory: true, basis: 'Art. 16' },
      { n: 5, name: 'Petición de relevo y de reemplazo', mandatory: true, basis: 'Art. 17' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/solicitud-de-designacion-de-arbitro-por-el-juez-civil-del-circuito',
    exactName: 'Solicitud de designación de árbitro por el juez civil del circuito',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 14 nums. 1 a 4 (integración del tribunal, requerimientos previos de cinco días y designación judicial por sorteo en el arbitraje institucional); art. 53 (designación judicial del árbitro ad hoc)',
    competentAuthority: 'Juez civil del circuito. En el arbitraje institucional \'designará de plano, por sorteo, principales y suplentes, de la lista de árbitros del centro en donde se haya radicado la demanda, al cual informará de su actuación\' (art. 14 num. 4). En el arbitraje ad hoc, el juez civil del circuito competente \'procederá al nombramiento del árbitro ad hoc, dentro de los cinco (5) días siguientes al recibo de la solicitud, mediante auto que no es susceptible de recurso alguno\' (art. 53).',
    term: { status: 'VERIFICADO', description: 'La solicitud judicial solo procede agotados los requerimientos previos, cada uno de cinco (5) días. En el arbitraje institucional: \'Si las partes no han designado los árbitros debiendo hacerlo, o delegaron la designación, el director del centro de arbitraje requerirá por el medio que considere más expedito y eficaz a las partes o al delegado, según el caso, para que en el término de cinco (5) días hagan la designación\' (art. 14 num. 2), y solo \'en defecto de la designación por las partes o por el delegado, el juez civil del circuito, a solicitud de cualquiera de las partes, designará de plano\' (art. 14 num. 4). En el arbitraje ad hoc, quien acude al juez debe acompañar \'prueba sumaria de haber agotado el trámite anterior\', esto es, de haber formulado la solicitud a la otra parte y de que esta \'no colabora o guarda silencio\' (art. 53). Los cinco días de que dispone el juez ad hoc para nombrar son del despacho, no del solicitante. El silencio del designado ante la citación se entiende como declinación (art. 14 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes y del pacto arbitral', mandatory: true, basis: 'Art. 53' },
      { n: 2, name: 'Relato del requerimiento previo y de su resultado', mandatory: true, basis: 'Arts. 14 num. 2 y 53' },
      { n: 3, name: 'Prueba sumaria del agotamiento del trámite previo', mandatory: true, basis: 'Art. 53' },
      { n: 4, name: 'Indicación del centro de arbitraje donde se radicó la demanda, si el arbitraje es institucional', mandatory: true, basis: 'Art. 14 num. 4' },
      { n: 5, name: 'Petición de designación por sorteo de principales y suplentes', mandatory: true, basis: 'Art. 14 num. 4' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/solicitud-de-arbitraje-social',
    exactName: 'Solicitud de arbitraje social',
    branch: 'ARBITRAJE',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 117 (Sección Cuarta, arbitraje social: gratuidad, cuantía de hasta 40 smlmv, árbitro único, funciones secretariales a cargo del centro y procedimientos especiales breves y sumarios autorizados por el Ministerio de Justicia y del Derecho)',
    competentAuthority: 'Centro de arbitraje, que debe promover jornadas de arbitraje social y que \'cumplirá las funciones secretariales\'. Decide un árbitro único escogido por las partes de la lista de árbitros voluntarios del centro; \'cuando el arbitraje no pueda adelantarse por los árbitros de la referida lista, el centro sorteará de la lista general de árbitros del centro\' (art. 117).',
    term: { status: 'NO_VERIFICADO', description: 'SIN PLAZO EN LA LEY, Y SE COMPROBÓ LEYENDO EL ARTÍCULO 117 COMPLETO: no fija término alguno para solicitarlo ni para tramitarlo. LOS PLAZOS DE ESTE ARBITRAJE NO VIVEN EN LA LEY SINO EN EL REGLAMENTO DEL CENTRO, y ahí hay que ir a buscarlos: el arbitraje social «podrá prestarse a través de PROCEDIMIENTOS ESPECIALES, AUTORIZADOS POR EL MINISTERIO DE JUSTICIA Y DEL DERECHO, BREVES Y SUMARIOS». Antes de asesorar sobre términos hay que pedir el reglamento del centro concreto. LO QUE SÍ FIJA LA LEY, y define si el caso cabe: es gratuito, para controversias «DE HASTA CUARENTA SALARIOS MÍNIMOS LEGALES MENSUALES VIGENTES (40 smlmv), sin perjuicio de que cada centro pueda prestar el servicio por cuantías superiores»; «las partes NO REQUIEREN DE APODERADO»; se lleva por un solo árbitro escogido de la lista de voluntarios del centro; y «en ningún caso recibirán honorarios profesionales». El centro cumple las funciones secretariales.' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes', mandatory: true, basis: 'Art. 117' },
      { n: 2, name: 'Pretensiones, con indicación de la cuantía dentro del límite de 40 smlmv', mandatory: true, basis: 'Art. 117' },
      { n: 3, name: 'Hechos', mandatory: true, basis: 'Art. 117' },
      { n: 4, name: 'Invocación del pacto arbitral o del acuerdo de sometimiento', mandatory: true, basis: 'Art. 3' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 117' },
      { n: 6, name: 'Escogencia del árbitro de la lista de árbitros voluntarios del centro', mandatory: false, basis: 'Art. 117' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012_pr002.html'
  },
  {
    id: 'arbitraje/laudo-arbitral',
    exactName: 'Laudo arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 1 (el laudo es la sentencia que profiere el tribunal de arbitraje, y clases de laudo); art. 10 (término de duración del proceso y prórroga); art. 11 (suspensiones y tope de 120 días); art. 33 (audiencias de alegatos y de laudo); art. 38 (adopción y firma); art. 39 (aclaración, corrección y adición); art. 47 (registro y archivo); art. 41 num. 6 y art. 48 (consecuencias del vencimiento del término)',
    competentAuthority: 'Tribunal arbitral nacional. El laudo se acuerda por mayoría de votos y es firmado por todos los árbitros, incluso por quien hubiere salvado el voto, y \'la falta de firma de alguno de los árbitros no afecta la validez del laudo\' (art. 38). De su ejecución conoce la justicia ordinaria o la contencioso administrativa, según el caso (art. 43 inciso final).',
    term: { status: 'VERIFICADO', description: 'Seis (6) meses prorrogables hasta por seis (6) meses más, y el cómputo arranca en un punto preciso. Art. 10: \'Si en el pacto arbitral no se señalare término para la duración del proceso, este será de seis (6) meses, contados a partir de la finalización de la primera audiencia de trámite. Dentro del término de duración del proceso, deberá proferirse y notificarse, incluso, la providencia que resuelve la solicitud de aclaración, corrección o adición. Dicho término podrá prorrogarse una o varias veces, sin que el total de las prórrogas exceda de seis (6) meses, a solicitud de las partes o de sus apoderados con facultad expresa para ello.\' El art. 30 confirma el punto de partida: \'Concluida la audiencia, comenzará a contarse el término de duración del proceso.\' Los días de suspensión e interrupción se adicionan, pero \'las partes o sus apoderados no podrán solicitar la suspensión del proceso por un tiempo que, sumado, exceda de ciento veinte (120) días\' (art. 11), y no hay suspensión por prejudicialidad. Vencido el término el tribunal cesa en sus funciones (art. 35 num. 4), el laudo tardio es anulable por la causal 6 (art. 41) y \'cuando el tribunal cese en sus funciones por expiración del término fijado para el proceso o su prórroga sin haber expedido el laudo, los árbitros y el secretario perderan el derecho a recibir sus honorarios, quedando incluso obligados a restituir a las partes lo que ya se les hubiere pagado o consignado\' (art. 48). En tribunales en que intervenga una entidad pública o quien desempeñe funciones administrativas y la controversia derive de un contrato estatal, \'el laudo deberá proferirse en derecho\' (art. 1 inciso 4).' },
    requiredSections: [
      { n: 1, name: 'Identificación del tribunal, de las partes y del pacto arbitral', mandatory: true, basis: 'Art. 1' },
      { n: 2, name: 'Antecedentes y actuación procesal, con constancia del término transcurrido', mandatory: true, basis: 'Arts. 10 y 30' },
      { n: 3, name: 'Presupuestos procesales y competencia del tribunal', mandatory: true, basis: 'Art. 30' },
      { n: 4, name: 'Hechos probados y valoración de las pruebas', mandatory: true, basis: 'Art. 31' },
      { n: 5, name: 'Consideraciones en derecho, en equidad o técnicas, según la naturaleza del laudo', mandatory: true, basis: 'Art. 1' },
      { n: 6, name: 'Parte resolutiva, con condenas y costas', mandatory: true, basis: 'Art. 33' },
      { n: 7, name: 'Orden de inscripción en el registro correspondiente y de archivo del expediente en el centro de arbitraje', mandatory: true, basis: 'Art. 47' },
      { n: 8, name: 'Firma de todos los árbitros, incluso de quien salve el voto', mandatory: true, basis: 'Art. 38' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/auto-que-resuelve-sobre-la-competencia-del-tribunal-arbitral',
    exactName: 'Auto que resuelve sobre la competencia del tribunal arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 30 (primera audiencia de trámite y decisión sobre la propia competencia); art. 29 (prevalencia de la decisión); art. 41 inciso final (efecto sobre las causales 1, 2 y 3 de anulación)',
    competentAuthority: 'El tribunal arbitral en pleno, con la asistencia de todos sus miembros, en la primera audiencia de trámite (art. 30)',
    term: { status: 'VERIFICADO', description: 'La primera audiencia de trámite se celebra \'una vez consignada la totalidad de los honorarios y gastos\' (art. 30), no antes. El auto \'solo es susceptible de recurso de reposición\'. Si el tribunal decide que no es competente para conocer de ninguna de las pretensiones de la demanda y la reconvención, se extinguen los efectos del pacto arbitral para el caso concreto y se devuelven a las partes la porción de gastos no utilizada y los honorarios recibidos; en ese evento, y este es el reloj de la PARTE y no del tribunal, \'el demandante tendrá un término de veinte (20) días hábiles para instaurar la demanda ante el juez competente\' si quiere conservar los efectos derivados de la presentación de la demanda ante el centro de arbitraje. Si el tribunal se declara competente por mayoría de votos, \'el árbitro que haya salvado voto, cesará inmediatamente en sus funciones y será reemplazado en la forma prevista en esta ley\'. En el mismo auto el tribunal resuelve sobre las pruebas, y concluida la audiencia empieza a correr el término de duración del proceso (art. 30).' },
    requiredSections: [
      { n: 1, name: 'Constancia de la consignación total de honorarios y gastos', mandatory: true, basis: 'Art. 30' },
      { n: 2, name: 'Constancia de asistencia de todos los miembros del tribunal', mandatory: true, basis: 'Art. 30' },
      { n: 3, name: 'Análisis del pacto arbitral y de su alcance frente a cada pretensión', mandatory: true, basis: 'Art. 30' },
      { n: 4, name: 'Decisión sobre la propia competencia', mandatory: true, basis: 'Art. 30' },
      { n: 5, name: 'Advertencia sobre la procedencia del recurso de reposición y, en caso de incompetencia, del término de veinte días hábiles para acudir al juez', mandatory: true, basis: 'Art. 30' },
      { n: 6, name: 'Decisión sobre las pruebas pedidas por las partes y las que de oficio se estimen necesarias', mandatory: true, basis: 'Art. 30' },
      { n: 7, name: 'Constancia de iniciación del cómputo del término de duración del proceso', mandatory: true, basis: 'Art. 30' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/auto-de-fijacion-de-honorarios-y-gastos-del-tribunal-arbitral',
    exactName: 'Auto de fijación de honorarios y gastos del tribunal arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 25 (oportunidad y base de la fijación); art. 26 (límites de 1.000 smlmv por árbitro, 500 smlmv cuando no puede determinarse la cuantía, incremento de hasta el cincuenta por ciento si es árbitro único y tope de la mitad para el secretario); art. 27 (oportunidad para consignar y consecuencias); art. 28 (distribución y liquidación final)',
    competentAuthority: 'El tribunal arbitral, en la misma audiencia de conciliación, fracasada esta en todo o en parte (art. 25). El depósito se hace a nombre del presidente del tribunal, quien abre para su manejo una cuenta especial en una entidad vigilada por la Superintendencia Financiera (art. 27).',
    term: { status: 'VERIFICADO', description: 'El auto se dicta en la misma audiencia de conciliación y es \'susceptible de recurso de reposición, que será resuelto inmediatamente\' (art. 25). El reloj que sigue es de las PARTES y extingue el pacto: \'En firme la regulación de honorarios y gastos, cada parte consignará, dentro de los diez (10) días siguientes, lo que a ella corresponda\'; si una consigna y la otra no, \'aquella podrá hacerlo por esta dentro de los cinco (5) días siguientes\'; y \'vencidos los términos previstos para realizar las consignaciones sin que estas se hubieren efectuado, el tribunal mediante auto declarará concluidas sus funciones y extinguidos los efectos del pacto arbitral para el caso\' (art. 27). Cuando una parte se encuentre integrada por varios sujetos \'no se podrá fraccionar el pago de los honorarios y gastos del tribunal y habrá solidaridad entre sus integrantes\'. A cargo de la parte incumplida corren intereses de mora a la tasa más alta autorizada desde el vencimiento del plazo para consignar.' },
    requiredSections: [
      { n: 1, name: 'Constancia del fracaso total o parcial de la conciliación', mandatory: true, basis: 'Art. 25' },
      { n: 2, name: 'Determinación de la cuantía de las pretensiones, tomando la mayor si hay reconvención', mandatory: true, basis: 'Art. 25' },
      { n: 3, name: 'Honorarios de cada árbitro, dentro de los límites legales', mandatory: true, basis: 'Art. 26' },
      { n: 4, name: 'Honorarios del secretario, que no pueden exceder de la mitad de los de un árbitro', mandatory: true, basis: 'Art. 26' },
      { n: 5, name: 'Gastos administrativos del centro y partida de gastos', mandatory: true, basis: 'Art. 26' },
      { n: 6, name: 'Proporción a cargo de cada parte y advertencia del término de diez días para consignar', mandatory: true, basis: 'Art. 27' },
      { n: 7, name: 'Advertencia sobre la procedencia inmediata del recurso de reposición', mandatory: true, basis: 'Art. 25' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/acta-de-instalacion-del-tribunal-arbitral',
    exactName: 'Acta de instalación del tribunal arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 20 (instalación, entrega del expediente, elección de presidente, designación de secretario y decisión sobre la admisión, inadmisión o rechazo de la demanda); art. 9 (calidades del secretario); art. 49 (aviso a la Procuraduría General de la Nación y a la Agencia Nacional de Defensa Jurídica del Estado cuando intervenga una entidad pública)',
    competentAuthority: 'Tribunal arbitral, en audiencia para la cual el centro de arbitraje fija día y hora (art. 20)',
    term: { status: 'VERIFICADO', description: 'En la audiencia de instalación el centro entrega el expediente a los árbitros, el tribunal elige presidente y designa secretario, \'quien deberá manifestar por escrito su aceptación dentro de los cinco (5) días siguientes, y será posesionado una vez agotado el trámite de información o de reemplazo\'. El árbitro que no concurra \'podrá presentar excusa justificada de su inasistencia dentro de los tres (3) días siguientes\'; si no la presenta o, presentada, no concurre en la nueva fecha, se procede a su reemplazo. En la misma acta se resuelve sobre la admisión, la inadmisión y el rechazo de la demanda; el tribunal \'rechazará de plano la demanda cuando no se acompañe prueba de la existencia de pacto arbitral, salvo que el demandante invoque su existencia para los efectos probatorios previstos en el parágrafo del artículo 3o\', y en caso de rechazo el reloj pasa al DEMANDANTE, que tendrá veinte (20) días hábiles para instaurar la demanda ante el juez competente si quiere conservar los efectos de la presentación. El poder para representar a una parte en esta audiencia incluye la facultad de notificarse de todas las determinaciones que el tribunal adopte en ella, \'sin que se pueda pactar lo contrario\' (art. 20).' },
    requiredSections: [
      { n: 1, name: 'Fecha, hora y lugar de la audiencia y constancia de asistencia de los árbitros', mandatory: true, basis: 'Art. 20' },
      { n: 2, name: 'Constancia de entrega del expediente por el centro de arbitraje', mandatory: true, basis: 'Art. 20' },
      { n: 3, name: 'Elección de presidente del tribunal', mandatory: true, basis: 'Art. 20' },
      { n: 4, name: 'Designación de secretario y término para su aceptación', mandatory: true, basis: 'Arts. 9 y 20' },
      { n: 5, name: 'Fijación de la sede y del lugar de funcionamiento del tribunal', mandatory: true, basis: 'Art. 20' },
      { n: 6, name: 'Decisión sobre admisión, inadmisión o rechazo de la demanda', mandatory: true, basis: 'Art. 20' },
      { n: 7, name: 'Aviso a la Procuraduría General de la Nación y a la Agencia Nacional de Defensa Jurídica del Estado, cuando intervenga entidad pública', mandatory: false, basis: 'Art. 49' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/auto-que-decreta-medidas-cautelares-en-proceso-arbitral',
    exactName: 'Auto que decreta medidas cautelares en proceso arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 32 (medidas cautelares nominadas e innominadas, comisión, caución, alcance, duración y caducidad automática)',
    competentAuthority: 'Tribunal arbitral. Puede comisionar al juez civil municipal o del circuito del lugar donde deba practicarse la medida y, cuando sea parte una entidad pública o quien desempeñe funciones administrativas, también al juez administrativo (art. 32).',
    term: { status: 'VERIFICADO', description: 'El auto debe fijar el alcance y la DURACIÓN de la medida: \'El tribunal establecerá su alcance, determinará su duración y podrá disponer, de oficio o a petición de parte, la modificación, sustitución o cese de la medida cautelar adoptada\' (art. 32). Para las innominadas debe exigir caución equivalente al veinte por ciento (20%) del valor de las pretensiones estimadas en la demanda, que puede aumentar o disminuir cuando lo considere razonable, o fijar en monto superior al decretar la medida. Y el reloj que corre después del laudo, y que el tribunal suele dejar sin resolver: \'Si el tribunal omitiere el levantamiento de las medidas cautelares, la medida caducará automáticamente transcurridos tres (3) meses desde la ejecutoria del laudo o de la providencia que decida definitivamente el recurso de anulación. El registrador o a quien le corresponda, a solicitud de parte, procederá a cancelarla.\'' },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida solicitada y de los bienes o conductas afectados', mandatory: true, basis: 'Art. 32' },
      { n: 2, name: 'Apreciación de la legitimación o interés para actuar de las partes', mandatory: true, basis: 'Art. 32' },
      { n: 3, name: 'Verificación de la existencia de la amenaza o la vulneración del derecho', mandatory: true, basis: 'Art. 32' },
      { n: 4, name: 'Análisis de apariencia de buen derecho, necesidad, efectividad y proporcionalidad', mandatory: true, basis: 'Art. 32' },
      { n: 5, name: 'Fijación de la caución y de su monto', mandatory: true, basis: 'Art. 32' },
      { n: 6, name: 'Alcance y duración de la medida', mandatory: true, basis: 'Art. 32' },
      { n: 7, name: 'Comisión al juez del lugar de práctica, si procede', mandatory: false, basis: 'Art. 32' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/auto-de-cesacion-de-funciones-del-tribunal-arbitral',
    exactName: 'Auto de cesación de funciones del tribunal arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 35 (causales de cesación de funciones); art. 27 inciso final (cesación por falta de consignación y extinción de los efectos del pacto arbitral); art. 36 (extinción por no adhesión del litisconsorte y término de veinte días hábiles); art. 28 inciso 2 (liquidación final de gastos); art. 48 (pérdida y reembolso de honorarios); art. 47 (archivo del expediente)',
    competentAuthority: 'Tribunal arbitral',
    term: { status: 'VERIFICADO', description: 'El tribunal cesa en sus funciones (art. 35) cuando no se haga oportunamente la consignación de gastos y honorarios; por voluntad de las partes; cuando el litisconsorte necesario que no suscribio el pacto arbitral no sea notificado o no adhiera oportunamente; por la expiración del término fijado para el proceso o el de su prórroga; por la ejecutoria del laudo o de la providencia que resuelva sobre su aclaración, corrección o adición; y por la interposición del recurso de anulación, sin menoscabo de la competencia del tribunal para la sustentación del recurso. Cuando la causa es la falta de adhesión al pacto, el reloj que salva el derecho es de la PARTE: \'En estos eventos, no se considerará interrumpida la prescripción y operará la caducidad, salvo que se promueva el respectivo proceso ante el juez dentro de los veinte días (20) hábiles siguientes a la ejecutoria de la providencia referida en este inciso\' (art. 36). Cesadas las funciones, \'terminado el proceso o decidido el recurso de anulación, el presidente hará la liquidación final de gastos y, con la correspondiente cuenta razonada, devolverá el saldo a las partes\' (art. 28). Si la cesación obedece a la expiración del término sin laudo, los árbitros y el secretario pierden el derecho a sus honorarios y deben restituir lo recibido (art. 48).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y de las partes', mandatory: true, basis: null },
      { n: 2, name: 'Causal de cesación de funciones invocada', mandatory: true, basis: 'Art. 35' },
      { n: 3, name: 'Declaración sobre la extinción de los efectos del pacto arbitral para el caso, cuando proceda', mandatory: true, basis: 'Arts. 27 y 36' },
      { n: 4, name: 'Advertencia del término de veinte días hábiles para promover el proceso ante el juez, cuando proceda', mandatory: true, basis: 'Art. 36' },
      { n: 5, name: 'Orden de reintegro o devolución de honorarios y gastos', mandatory: true, basis: 'Arts. 27, 28 y 48' },
      { n: 6, name: 'Orden de archivo del expediente en el centro de arbitraje', mandatory: true, basis: 'Art. 47' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/sentencia-que-resuelve-el-recurso-de-anulacion-de-laudo-arbitral',
    exactName: 'Sentencia que resuelve el recurso de anulación de laudo arbitral',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 42 (rechazo de plano, término para sentencia, no suspensión del cumplimiento y límites de la decisión); art. 43 (efectos de la sentencia de anulación); art. 44 (interrupción de la prescripción); art. 46 (competencia); art. 48 inciso final (reembolso de honorarios por los árbitros)',
    competentAuthority: 'Sala Civil del Tribunal Superior de Distrito Judicial del lugar en donde hubiese funcionado el tribunal de arbitraje (art. 46 inciso 1). Cuando en el arbitraje intervenga una entidad pública o quien desempeñe funciones administrativas, la Sección Tercera de la Sala de lo Contencioso Administrativo del Consejo de Estado (art. 46 inciso 3). No es la Corte Suprema de Justicia: a su Sala Civil le corresponde el recurso de REVISIÓN de laudos (art. 46 inciso 2), no la anulación.',
    term: { status: 'VERIFICADO', description: 'Tres (3) meses, y son del despacho. Art. 42: \'Admitido el recurso, el expediente pasará al despacho para sentencia, que deberá proferirse dentro de los tres (3) meses siguientes. En ella se liquidarán las condenas y costas a que hubiere lugar.\' La sentencia \'no se pronunciará sobre el fondo de la controversia, ni calificara o modificará los criterios, motivaciones, valoraciones probatorias o interpretaciones expuestas por el tribunal arbitral al adoptar el laudo\'. Efectos (art. 43): si prospera alguna de las causales 1 a 7 \'se declarará la nulidad del laudo\'; en los demás casos \'este se corregirá o adicionará\'; anulado por las causales 1 o 2, \'el expediente se remitirá al juez que corresponda para que continue el proceso a partir del decreto de pruebas\'; anulado por las causales 3 a 7, el interesado podrá convocar un nuevo tribunal arbitral. En este último caso el plazo siguiente es de la PARTE y no del juez: la prescripción se considera interrumpida y no opera la caducidad \'siempre que la parte interesada presente la solicitud de convocatoria de tribunal arbitral dentro de los tres (3) meses siguientes a la ejecutoria de la sentencia\' (art. 44). Si el recurso no prospera se condena en costas al recurrente, salvo que lo haya presentado el Ministerio Público.' },
    requiredSections: [
      { n: 1, name: 'Identificación del laudo recurrido, del tribunal arbitral y de las partes', mandatory: true, basis: 'Art. 40' },
      { n: 2, name: 'Antecedentes y causales invocadas', mandatory: true, basis: 'Art. 41' },
      { n: 3, name: 'Verificación de oportunidad, sustentación y correspondencia de las causales', mandatory: true, basis: 'Art. 42' },
      { n: 4, name: 'Análisis de cada causal, sin pronunciarse sobre el fondo de la controversia', mandatory: true, basis: 'Art. 42' },
      { n: 5, name: 'Decisión de anular, corregir o adicionar el laudo', mandatory: true, basis: 'Art. 43' },
      { n: 6, name: 'Órdenes de remisión al juez o de restituciones, según la causal', mandatory: true, basis: 'Art. 43' },
      { n: 7, name: 'Liquidación de condenas y costas', mandatory: true, basis: 'Arts. 42 y 43' },
      { n: 8, name: 'Orden de reembolso de la segunda mitad de los honorarios por los árbitros, si prospera por las causales 3 a 5 o 7', mandatory: false, basis: 'Art. 48' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012_pr001.html'
  },
  {
    id: 'arbitraje/certificacion-para-el-cobro-ejecutivo-de-honorarios-y-gastos-arbitrales-no-reembolsados',
    exactName: 'Certificación para el cobro ejecutivo de honorarios y gastos arbitrales no reembolsados',
    branch: 'ARBITRAJE',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, art. 27 (consignación, reembolso, título ejecutivo, momento en que puede expedirse la certificación e intereses de mora)',
    competentAuthority: 'La expide el presidente del tribunal arbitral con la firma del secretario. La ejecución se adelanta por la via ejecutiva ante la justicia ordinaria (art. 27).',
    term: { status: 'VERIFICADO', description: 'La certificación no puede expedirse en cualquier momento: \'La certificación solamente podrá ser expedida cuando haya cobrado firmeza la providencia mediante la cual el tribunal se declare competente\' (art. 27). El presupuesto es que una parte haya consignado por la otra dentro de los cinco (5) días siguientes al vencimiento de los diez (10) días de consignación y que no se haya producido el reembolso; entonces \'la acreedora podrá demandar su pago por la via ejecutiva ante la justicia ordinaria. Para tal efecto le bastará presentar la correspondiente certificación expedida por el presidente del tribunal con la firma del secretario. En la ejecución no se podrá alegar excepción diferente a la de pago.\' Si no media ejecución, \'las expensas pendientes de reembolso se tendrán en cuenta en el laudo para lo que hubiere lugar\'. A cargo de la parte incumplida se causan intereses de mora a la tasa más alta autorizada, \'desde el vencimiento del plazo para consignar y hasta el momento en que cancele la totalidad de las sumas debidas\'.' },
    requiredSections: [
      { n: 1, name: 'Identificación del tribunal arbitral, del proceso y de las partes', mandatory: true, basis: 'Art. 27' },
      { n: 2, name: 'Constancia de firmeza de la providencia que declaró la competencia del tribunal', mandatory: true, basis: 'Art. 27' },
      { n: 3, name: 'Monto que correspondía consignar a la parte incumplida', mandatory: true, basis: 'Art. 27' },
      { n: 4, name: 'Constancia de la consignación hecha por la parte acreedora y de la falta de reembolso', mandatory: true, basis: 'Art. 27' },
      { n: 5, name: 'Fecha de vencimiento del plazo para consignar, como punto de partida de los intereses de mora', mandatory: true, basis: 'Art. 27' },
      { n: 6, name: 'Firma del presidente del tribunal y del secretario', mandatory: true, basis: 'Art. 27' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/constancia-secretarial-del-termino-transcurrido-del-proceso-arbitral',
    exactName: 'Constancia secretarial del término transcurrido del proceso arbitral',
    branch: 'ARBITRAJE',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1563 de 2012, art. 10 inciso 3 (\'Al comenzar cada audiencia el secretario informará el término transcurrido del proceso\'); art. 11 (suspensiones e interrupciones que se adicionan y tope de 120 días); art. 30 inciso final (inicio del cómputo); art. 41 num. 6 y art. 48 (consecuencias del vencimiento)',
    competentAuthority: 'Secretario del tribunal arbitral',
    term: { status: 'VERIFICADO', description: 'La constancia se rinde AL COMENZAR CADA AUDIENCIA, sin excepción: \'Al comenzar cada audiencia el secretario informará el término transcurrido del proceso\' (art. 10 inciso 3). El cómputo arranca al concluir la primera audiencia de trámite (art. 30) y el término es de seis (6) meses si el pacto no señala otro, prorrogable hasta por seis (6) meses más (art. 10). Al término \'se adicionarán los días de suspensión, así como los de interrupción por causas legales\', pero \'las partes o sus apoderados no podrán solicitar la suspensión del proceso por un tiempo que, sumado, exceda de ciento veinte (120) días\' (art. 11). Esta constancia es la única fuente por la que la parte sabe cuanto le queda al tribunal: si el laudo, o la providencia que resuelve su aclaración, corrección o adición, se profiere después del vencimiento, el laudo es anulable por la causal 6 del art. 41, y los árbitros y el secretario pierden sus honorarios y deben restituirlos (art. 48).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral y de la audiencia', mandatory: true, basis: 'Art. 10' },
      { n: 2, name: 'Fecha de finalización de la primera audiencia de trámite', mandatory: true, basis: 'Art. 30' },
      { n: 3, name: 'Días transcurridos del término legal o pactado', mandatory: true, basis: 'Art. 10' },
      { n: 4, name: 'Relación de suspensiones e interrupciones, con su cómputo acumulado y el tope de 120 días', mandatory: true, basis: 'Art. 11' },
      { n: 5, name: 'Fecha de vencimiento del término y de las prórrogas concedidas', mandatory: true, basis: 'Art. 10' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  },
  {
    id: 'arbitraje/traslado-secretarial-del-recurso-de-anulacion-de-laudo-arbitral',
    exactName: 'Traslado secretarial del recurso de anulación de laudo arbitral',
    branch: 'ARBITRAJE',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1563 de 2012, art. 40 (traslado por secretaría sin auto que lo ordene y remisión del expediente); art. 35 num. 6 (la interposición hace cesar las funciones del tribunal, sin menoscabo de su competencia para la sustentación del recurso)',
    competentAuthority: 'Secretaría del tribunal arbitral. El expediente se envia a la autoridad judicial competente para conocer del recurso: Sala Civil del Tribunal Superior del lugar donde funcionó el tribunal, o Sección Tercera del Consejo de Estado si intervino una entidad pública (art. 46).',
    term: { status: 'VERIFICADO', description: 'Quince (15) días de traslado a la otra parte, que corren SIN AUTO QUE LOS ORDENE, y cinco (5) días para la remisión. Art. 40: \'Por secretaría del tribunal se correrá traslado a la otra parte por quince (15) días sin necesidad de auto que lo ordene. Vencido aquel, dentro de los cinco (5) días siguientes, el secretario del tribunal enviará los escritos presentados junto con el expediente a la autoridad judicial competente para conocer del recurso.\' Que el traslado corra sin auto es lo que vuelve peligroso este término para el no recurrente: nadie le notificará su apertura. Los quince días son de la parte no recurrente; los cinco días de envio son de la secretaría.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso arbitral, del laudo y del recurrente', mandatory: true, basis: 'Art. 40' },
      { n: 2, name: 'Fecha de interposición del recurso y causales invocadas', mandatory: true, basis: 'Art. 40' },
      { n: 3, name: 'Fecha de iniciación y de vencimiento del traslado de quince días', mandatory: true, basis: 'Art. 40' },
      { n: 4, name: 'Constancia de los escritos presentados durante el traslado', mandatory: true, basis: 'Art. 40' },
      { n: 5, name: 'Constancia de remisión del expediente a la autoridad judicial competente', mandatory: true, basis: 'Art. 40' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1563_2012.html'
  }
  ]
};
