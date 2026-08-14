import type { BranchCatalog } from '../types';

/**
 * INTERNACIONAL catalogue.
 *
 * Generated from research/actuaciones-internacional.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const INTERNACIONAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'INTERNACIONAL',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Ley 1564 de 2012 (CGP), arts. 605 a 607, sobre exequátur; Ley 1563 de 2012 (Estatuto de Arbitraje Nacional e Internacional); Ley 906 de 2004, arts. 490 a 514, sobre extradición; Convención Americana sobre Derechos Humanos y Reglamento de la CIDH; Convenio de La Haya de 1961 sobre apostilla. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'UN LAUDO INTERNACIONAL CON SEDE EN COLOMBIA NO NECESITA RECONOCIMIENTO. El art. 111 de la Ley 1563 de 2012 dispone que los arbitrajes internacionales cuya sede sea Colombia se consideran NACIONALES y sus laudos pueden ejecutarse directamente, sin reconocimiento previo. Sólo los laudos EXTRANJEROS requieren reconocimiento judicial previo. Pedir reconocimiento de un laudo que no lo necesita cuesta meses de trámite innecesario; omitirlo cuando sí se requiere hace inejecutable el laudo. La sede del arbitraje es el dato que decide.',
    'EXEQUÁTUR Y RECONOCIMIENTO DE LAUDO SON TRÁMITES DISTINTOS. El exequátur de sentencias extranjeras se surte ante la Sala de Casación Civil de la Corte Suprema de Justicia (art. 607 CGP); el reconocimiento de laudos extranjeros sigue el trámite propio del art. 115 de la Ley 1563 de 2012, con términos diferentes. No son intercambiables.',
    'El plazo de seis (6) meses para acudir a la CIDH se cuenta desde la notificación de la decisión final que agota los recursos internos, y existen excepciones al agotamiento. Determinar cuál es esa decisión final en un caso concreto es una cuestión de fondo que este catálogo no resuelve.',
    'Términos del Tribunal de Justicia de la Comunidad Andina para la interpretación prejudicial y para la acción de incumplimiento: no verificados.',
    'Términos de las cartas rogatorias y de la asistencia judicial internacional: dependen del tratado bilateral o multilateral aplicable a cada país y no se verificaron.',
    'Los tratados de libre comercio, el arbitraje de inversión (CIADI) y la contratación internacional privada no están cubiertos.',
    'La restitución internacional de menores está catalogada en la rama FAMILIA (art. 22 num. 23 del CGP).'
    ]
  },
  actuaciones: [
  {
    id: 'internacional/demanda-de-exequatur-de-sentencia-extranjera',
    exactName: 'Demanda de exequátur de sentencia extranjera',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 605, 606 y 607',
    competentAuthority: 'Sala de Casación Civil de la Corte Suprema de Justicia (art. 607)',
    term: { status: 'VERIFICADO', description: 'Presentada la demanda y admitida, se corre traslado por cinco (5) días a la parte afectada por la sentencia y al procurador delegado que corresponda (art. 607).' },
    requiredSections: [
      { n: 1, name: 'Copia de la sentencia extranjera debidamente legalizada y ejecutoriada conforme a la ley de su país de origen', mandatory: true, basis: 'Art. 606 num. 3' },
      { n: 2, name: 'Demostración de que no versa sobre derechos reales constituidos en bienes situados en Colombia', mandatory: true, basis: 'Art. 606 num. 1' },
      { n: 3, name: 'Demostración de que no se opone al orden público colombiano, salvo en lo procedimental', mandatory: true, basis: 'Art. 606 num. 2' },
      { n: 4, name: 'Demostración de que el asunto no es de competencia exclusiva de los jueces colombianos', mandatory: true, basis: 'Art. 606 num. 4' },
      { n: 5, name: 'Constancia de que no existe proceso en curso ni sentencia ejecutoriada en Colombia sobre el mismo asunto', mandatory: true, basis: 'Art. 606 num. 5' },
      { n: 6, name: 'Prueba de que el demandado fue debidamente citado y pudo contradecir, en procesos contenciosos', mandatory: true, basis: 'Art. 606 num. 6' },
      { n: 7, name: 'Petición de las pruebas que se pretenda hacer valer', mandatory: true, basis: 'Art. 607 num. 1' },
      { n: 8, name: 'Acreditación de la reciprocidad diplomática o legislativa con el país de origen', mandatory: true, basis: 'Art. 605' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/607.htm'
  },
  {
    id: 'internacional/solicitud-de-reconocimiento-de-laudo-arbitral-extranjero',
    exactName: 'Solicitud de reconocimiento de laudo arbitral extranjero',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, arts. 111, 112 y 115',
    competentAuthority: 'Autoridad judicial competente conforme al art. 115',
    term: { status: 'VERIFICADO', description: 'Admitida la solicitud, se notifica a las otras partes para que se pronuncien dentro de diez (10) días. Vencido el traslado y sin trámite adicional, la autoridad judicial decide dentro de los veinte (20) días siguientes (art. 115).' },
    requiredSections: [
      { n: 1, name: 'Laudo original o copia de él', mandatory: true, basis: 'Art. 111' },
      { n: 2, name: 'Traducción al español, cuando la autoridad judicial la solicite', mandatory: false, basis: 'Art. 111' },
      { n: 3, name: 'Acreditación de que el laudo es EXTRANJERO, es decir que la sede del arbitraje no fue Colombia', mandatory: true, basis: 'Art. 111' },
      { n: 4, name: 'Identificación de las partes y del acuerdo de arbitraje', mandatory: true, basis: 'Art. 111' },
      { n: 5, name: 'Pronunciamiento sobre la ausencia de causales de denegación del reconocimiento', mandatory: true, basis: 'Art. 112' }
    ],
    sourceUrl: 'https://leyes.co/estatuto_de_arbitraje_nacional_e_internacional/115.htm'
  },
  {
    id: 'internacional/solicitud-de-ejecucion-de-laudo-internacional-con-sede-en-colombia',
    exactName: 'Solicitud de ejecución de laudo internacional con sede en Colombia',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, art. 111',
    competentAuthority: 'Juez de ejecución competente según las reglas generales',
    term: { status: 'VERIFICADO', description: 'Los arbitrajes internacionales cuya sede sea Colombia se consideran nacionales y sus laudos pueden ejecutarse DIRECTAMENTE, sin necesidad de reconocimiento previo (art. 111).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de que la sede del arbitraje fue Colombia', mandatory: true, basis: 'Art. 111' },
      { n: 2, name: 'Laudo original o copia, con constancia de su notificación', mandatory: true, basis: 'Art. 111' },
      { n: 3, name: 'Constancia de que no se requiere reconocimiento previo', mandatory: true, basis: 'Art. 111' },
      { n: 4, name: 'Pretensión ejecutiva con la liquidación de lo adeudado', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/estatuto_de_arbitraje_nacional_e_internacional/111.htm'
  },
  {
    id: 'internacional/recurso-de-anulacion-de-laudo-arbitral-internacional',
    exactName: 'Recurso de anulación de laudo arbitral internacional',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, arts. 108 y 109',
    competentAuthority: 'Sala Civil del Tribunal Superior del Distrito Judicial de la sede del tribunal arbitral',
    term: { status: 'VERIFICADO', description: 'Dentro del mes siguiente a la notificación del laudo o, en su caso, a la notificación del laudo adicional o de la providencia que resuelva sobre su corrección o aclaración. La interposición NO suspende la ejecución del laudo, y contra la decisión que resuelve la anulación no procede recurso alguno (art. 109).' },
    requiredSections: [
      { n: 1, name: 'Identificación del laudo y de la fecha exacta de su notificación', mandatory: true, basis: 'Art. 109' },
      { n: 2, name: 'Causal de anulación invocada entre las taxativas', mandatory: true, basis: 'Art. 108' },
      { n: 3, name: 'Hechos y pruebas que la configuran', mandatory: true, basis: 'Art. 108' },
      { n: 4, name: 'Advertencia de que el recurso no suspende la ejecución del laudo', mandatory: true, basis: 'Art. 109' },
      { n: 5, name: 'Petición de anulación total o parcial', mandatory: true, basis: 'Art. 109' }
    ],
    sourceUrl: 'https://leyes.co/estatuto_de_arbitraje_nacional_e_internacional/109.htm'
  },
  {
    id: 'internacional/demanda-arbitral-internacional',
    exactName: 'Demanda arbitral internacional',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, arts. 62 y siguientes',
    competentAuthority: 'Tribunal arbitral constituido conforme al acuerdo de arbitraje',
    term: { status: 'VERIFICADO', description: 'La ley no fija un término legal para presentar la demanda: conforme al artículo 96 de la Ley 1563 de 2012 (Demanda y contestación), esta debe presentarse "dentro del plazo convenido por las partes o determinado por el tribunal arbitral", indicando los hechos en que se funda, los puntos controvertidos y el objeto de ella. La actuación arbitral se entiende iniciada, salvo pacto en contrario, en la fecha en que el demandado recibe la solicitud de someter la controversia a arbitraje (art. 94). Salvo acuerdo en contrario, en el curso de las actuaciones cualquiera de las partes puede modificar o ampliar su demanda o contestación, a menos que el tribunal considere improcedente esa alteración por la tardanza con que se hizo (art. 96, inciso final). La no presentación de la demanda en ese plazo, sin causa suficiente, obliga al tribunal a dar por terminada la actuación (art. 98 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Acuerdo de arbitraje y demostración del carácter internacional del arbitraje', mandatory: true, basis: 'Art. 62' },
      { n: 2, name: 'Identificación de las partes y de su domicilio', mandatory: true, basis: null },
      { n: 3, name: 'Determinación de la sede del arbitraje y de la ley aplicable al fondo', mandatory: true, basis: 'Art. 101' },
      { n: 4, name: 'Hechos y pretensiones', mandatory: true, basis: null },
      { n: 5, name: 'Pruebas que se aportan y se solicitan', mandatory: true, basis: null },
      { n: 6, name: 'Designación de árbitro conforme al acuerdo', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=48366'
  },
  {
    id: 'internacional/solicitud-de-medidas-cautelares-en-arbitraje-internacional',
    exactName: 'Solicitud de medidas cautelares en arbitraje internacional',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1563 de 2012, arts. 80 y siguientes',
    competentAuthority: 'Tribunal arbitral o autoridad judicial de apoyo',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: la Ley 1563 de 2012 no sujeta la solicitud a término alguno. Ante el tribunal arbitral, "salvo acuerdo en contrario de las partes, el tribunal arbitral podrá, a instancia de cualquiera de ellas, decretar medidas cautelares", entendidas como toda medida temporal adoptada "en cualquier momento previo a la emisión del laudo" que dirima definitivamente la controversia (art. 80). Ante la autoridad judicial, la medida puede pedirse "con anterioridad a las actuaciones arbitrales o durante el transcurso de las mismas" (art. 71) y, tratándose de arbitraje internacional, "con anterioridad a la iniciación del trámite arbitral o en el curso del mismo, e independientemente de que el proceso se adelante en Colombia o en el exterior" (art. 90). Las condiciones para el decreto de la medida están en el art. 81, no en el art. 80.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida solicitada', mandatory: true, basis: 'Art. 80' },
      { n: 2, name: 'Demostración del daño no resarcible adecuadamente mediante indemnización', mandatory: true, basis: 'Art. 80' },
      { n: 3, name: 'Probabilidad razonable de prosperidad de la pretensión', mandatory: true, basis: 'Art. 80' },
      { n: 4, name: 'Ofrecimiento de garantía', mandatory: false, basis: 'Art. 80' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=48366'
  },
  {
    id: 'internacional/memorial-de-defensa-en-tramite-de-extradicion',
    exactName: 'Memorial de defensa en trámite de extradición',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, arts. 490 a 500',
    competentAuthority: 'Sala de Casación Penal de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Recibido el expediente, se corre traslado a la persona requerida o a su defensor por el término de diez (10) días para solicitar pruebas. Vencido, la actuación se abre a pruebas por diez (10) días más el término de distancia. Practicadas, el proceso queda en secretaría cinco (5) días para alegar (art. 500).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la persona requerida y del Estado requirente', mandatory: true, basis: 'Art. 490' },
      { n: 2, name: 'Verificación de la validez formal de la documentación aportada', mandatory: true, basis: 'Art. 502' },
      { n: 3, name: 'Verificación de la identidad plena del solicitado', mandatory: true, basis: 'Art. 502' },
      { n: 4, name: 'Análisis del principio de doble incriminación', mandatory: true, basis: 'Art. 502' },
      { n: 5, name: 'Equivalencia de la providencia proferida en el extranjero con la resolución de acusación', mandatory: true, basis: 'Art. 502' },
      { n: 6, name: 'Solicitud de pruebas dentro del traslado de diez (10) días', mandatory: true, basis: 'Art. 500' },
      { n: 7, name: 'Alegato de conclusión dentro de los cinco (5) días de secretaría', mandatory: true, basis: 'Art. 500' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/500.htm'
  },
  {
    id: 'internacional/renuncia-al-procedimiento-de-extradicion',
    exactName: 'Renuncia al procedimiento de extradición',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 906 de 2004, art. 500 par.',
    competentAuthority: 'Sala de Casación Penal de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'La persona requerida, con asistencia de su defensor y del Ministerio Público, puede renunciar al procedimiento ordinario y solicitar directamente el concepto; la Sala debe responder dentro de veinte (20) días si se cumplen los requisitos (art. 500).' },
    requiredSections: [
      { n: 1, name: 'Manifestación libre, voluntaria e informada de renunciar al procedimiento', mandatory: true, basis: 'Art. 500' },
      { n: 2, name: 'Constancia de la asistencia del defensor y del Ministerio Público', mandatory: true, basis: 'Art. 500' },
      { n: 3, name: 'Solicitud expresa de que se emita concepto de inmediato', mandatory: true, basis: 'Art. 500' },
      { n: 4, name: 'Verificación previa de que se cumplen los requisitos legales', mandatory: true, basis: 'Art. 500' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/500.htm'
  },
  {
    id: 'internacional/peticion-individual-ante-la-comision-interamericana-de-derechos-humanos',
    exactName: 'Petición individual ante la Comisión Interamericana de Derechos Humanos',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Convención Americana sobre Derechos Humanos, arts. 44 a 46; Reglamento de la CIDH',
    competentAuthority: 'Comisión Interamericana de Derechos Humanos',
    term: { status: 'VERIFICADO', description: 'Debe presentarse dentro de los seis (6) meses siguientes a la fecha en que la presunta víctima fue notificada de la decisión final que agota los recursos internos (art. 46 CADH).' },
    requiredSections: [
      { n: 1, name: 'Identificación del peticionario y de la presunta víctima', mandatory: true, basis: 'CADH art. 46' },
      { n: 2, name: 'Relato de los hechos que configuran la violación', mandatory: true, basis: 'CADH art. 46' },
      { n: 3, name: 'Derechos de la Convención que se alegan vulnerados', mandatory: true, basis: 'CADH art. 44' },
      { n: 4, name: 'Demostración del agotamiento de los recursos internos, o de una de sus excepciones', mandatory: true, basis: 'CADH art. 46' },
      { n: 5, name: 'Fecha de notificación de la decisión final, para acreditar el plazo de seis (6) meses', mandatory: true, basis: 'CADH art. 46' },
      { n: 6, name: 'Constancia de que la materia no está pendiente ante otro procedimiento internacional', mandatory: true, basis: 'CADH art. 46' }
    ],
    sourceUrl: 'https://www.oas.org/es/cidh/mandato/documentos-basicos/convencion-americana-derechos-humanos.pdf'
  },
  {
    id: 'internacional/solicitud-de-medidas-cautelares-ante-la-comision-interamericana',
    exactName: 'Solicitud de medidas cautelares ante la Comisión Interamericana',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Reglamento de la CIDH, art. 25',
    competentAuthority: 'Comisión Interamericana de Derechos Humanos',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: el artículo 25 del Reglamento de la CIDH no fija plazo alguno para presentar la solicitud. La Comisión puede actuar "a iniciativa propia o a solicitud de parte", y las medidas, "ya sea que guarden o no conexidad con una petición o caso, se relacionarán con situaciones de gravedad y urgencia que presenten un riesgo de daño irreparable" (art. 25.1). El plazo de seis (6) meses del art. 46 CADH rige la petición individual, no la solicitud de medidas cautelares. Los requisitos de contenido están en el art. 25.4 y el plazo de vigencia, cuando aplique, lo fija la propia resolución de otorgamiento (art. 25.7 lit. d).' },
    requiredSections: [
      { n: 1, name: 'Identificación de los beneficiarios propuestos', mandatory: true, basis: 'Reglamento CIDH, art. 25' },
      { n: 2, name: 'Demostración de la gravedad de la situación', mandatory: true, basis: 'Reglamento CIDH, art. 25' },
      { n: 3, name: 'Demostración de la urgencia', mandatory: true, basis: 'Reglamento CIDH, art. 25' },
      { n: 4, name: 'Riesgo de daño irreparable', mandatory: true, basis: 'Reglamento CIDH, art. 25' },
      { n: 5, name: 'Medidas concretas que se solicitan al Estado', mandatory: true, basis: 'Reglamento CIDH, art. 25' }
    ],
    sourceUrl: 'https://www.oas.org/es/cidh/jsForm/?File=%2Fes%2Fcidh%2Fmandato%2Fbasicos%2Freglamentocidh.asp'
  },
  {
    id: 'internacional/solicitud-de-interpretacion-prejudicial-al-tribunal-de-justicia-de-la-comunidad-andina',
    exactName: 'Solicitud de interpretación prejudicial al Tribunal de Justicia de la Comunidad Andina',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Tratado de Creación del Tribunal de Justicia de la Comunidad Andina; Decisión 500',
    competentAuthority: 'Tribunal de Justicia de la Comunidad Andina, a solicitud del juez nacional',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad para formular la consulta: el Estatuto del Tribunal (Decisión 500 de 2001) no señala término para elevarla. En la consulta facultativa, el juez nacional puede solicitarla mientras la sentencia sea susceptible de recursos en derecho interno, y si llega la oportunidad de fallar sin haber recibido la interpretación "el juez deberá decidir el proceso" (art. 122). En la consulta obligatoria (sentencia de única o última instancia no susceptible de recursos), el juez "deberá suspender el procedimiento y solicitar directamente y mediante simple oficio, la interpretación del Tribunal" (art. 123), y el proceso interno queda suspendido hasta que se reciba la interpretación (art. 124). El término propiamente dicho es el del Tribunal: "Dentro del término de treinta días siguientes al de la admisión de la solicitud por el Tribunal, éste dictará sentencia" (art. 126).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso nacional en curso', mandatory: true, basis: null },
      { n: 2, name: 'Normas del ordenamiento jurídico andino cuya interpretación se solicita', mandatory: true, basis: null },
      { n: 3, name: 'Explicación de por qué son aplicables al caso', mandatory: true, basis: null },
      { n: 4, name: 'Informe sucinto de los hechos que el juez considere relevantes', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/transparencia/normatividad/EstatutoTJCA_ant.pdf'
  },
  {
    id: 'internacional/carta-rogatoria-para-cooperacion-judicial-internacional',
    exactName: 'Carta rogatoria para cooperación judicial internacional',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 40; convenios bilaterales y multilaterales aplicables',
    competentAuthority: 'Se tramita por conducto del Ministerio de Relaciones Exteriores',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y de la autoridad judicial requirente', mandatory: true, basis: 'Art. 40' },
      { n: 2, name: 'Diligencia concreta cuya práctica se solicita', mandatory: true, basis: 'Art. 40' },
      { n: 3, name: 'Identificación de las personas involucradas y su ubicación en el Estado requerido', mandatory: true, basis: 'Art. 40' },
      { n: 4, name: 'Traducción oficial al idioma del Estado requerido', mandatory: true, basis: null },
      { n: 5, name: 'Indicación del convenio o del principio de reciprocidad invocado', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/607.htm'
  },
  {
    id: 'internacional/solicitud-de-apostilla-o-legalizacion-de-documento',
    exactName: 'Solicitud de apostilla o legalización de documento',
    branch: 'INTERNACIONAL',
    role: 'LITIGANTE',
    legalBasis: 'Convenio de La Haya de 1961, aprobado por Ley 455 de 1998; Ley 1564 de 2012, art. 251',
    competentAuthority: 'Ministerio de Relaciones Exteriores',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: el Convenio de La Haya de 5 de octubre de 1961, en vigor para Colombia desde el 30 de enero de 2001 (aprobado por Ley 455 de 1998), no fija plazo para pedir la apostilla ni término de vencimiento de esta. Su artículo 5 dispone que "la Apostilla se expedirá a petición del signatario o de cualquier portador del documento", y el artículo 3 la señala como única formalidad exigible para certificar la autenticidad de la firma. Tampoco el artículo 251 del CGP fija término: se limita a exigir que los documentos públicos otorgados en el extranjero se aporten apostillados conforme a los tratados ratificados por Colombia y, si el país de origen no es parte, autenticados por el cónsul o agente diplomático colombiano. La apostilla es requisito de valor probatorio del documento, no acto sujeto a plazo procesal.' },
    requiredSections: [
      { n: 1, name: 'Documento público original o copia auténtica', mandatory: true, basis: 'Ley 455 de 1998' },
      { n: 2, name: 'Verificación de que el país de destino es parte del Convenio de La Haya; si no lo es, procede legalización consular', mandatory: true, basis: 'Ley 455 de 1998' },
      { n: 3, name: 'Identificación del solicitante y del país de destino', mandatory: true, basis: null },
      { n: 4, name: 'Traducción oficial cuando el documento vaya a surtir efectos en otro idioma', mandatory: false, basis: 'Art. 251 CGP' }
    ],
    sourceUrl: 'https://www.hcch.net/es/instruments/conventions/full-text/?cid=41'
  },
  {
    id: 'internacional/sentencia-de-exequatur',
    exactName: 'Sentencia de exequátur',
    branch: 'INTERNACIONAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 606 y 607',
    competentAuthority: 'Sala de Casación Civil de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Vencido el traslado de cinco (5) días se decretan y practican las pruebas, se convoca a audiencia y se dicta sentencia (art. 607).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los siete requisitos del artículo 606', mandatory: true, basis: 'Art. 606' },
      { n: 2, name: 'Constancia del traslado a la parte afectada y al procurador delegado', mandatory: true, basis: 'Art. 607 num. 3' },
      { n: 3, name: 'Valoración de las pruebas decretadas y practicadas', mandatory: true, basis: 'Art. 607 num. 4' },
      { n: 4, name: 'Decisión de conceder o negar el exequátur', mandatory: true, basis: 'Art. 607' },
      { n: 5, name: 'Indicación de que, concedido, la ejecución corresponde al juez competente por las reglas generales', mandatory: true, basis: 'Art. 607 num. 5' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/607.htm'
  },
  {
    id: 'internacional/providencia-de-reconocimiento-de-laudo-extranjero',
    exactName: 'Providencia de reconocimiento de laudo extranjero',
    branch: 'INTERNACIONAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, arts. 112 y 115',
    competentAuthority: 'Autoridad judicial competente',
    term: { status: 'VERIFICADO', description: 'Vencido el traslado de diez (10) días a las otras partes, y sin trámite adicional, la autoridad judicial decide dentro de los veinte (20) días siguientes (art. 115).' },
    requiredSections: [
      { n: 1, name: 'Verificación de la documentación exigida por el artículo 111', mandatory: true, basis: 'Art. 111' },
      { n: 2, name: 'Constancia del traslado por diez (10) días', mandatory: true, basis: 'Art. 115' },
      { n: 3, name: 'Análisis de las causales de denegación del reconocimiento', mandatory: true, basis: 'Art. 112' },
      { n: 4, name: 'Decisión de reconocer o denegar, dentro de los veinte (20) días', mandatory: true, basis: 'Art. 115' }
    ],
    sourceUrl: 'https://leyes.co/estatuto_de_arbitraje_nacional_e_internacional/115.htm'
  },
  {
    id: 'internacional/concepto-sobre-extradicion',
    exactName: 'Concepto sobre extradición',
    branch: 'INTERNACIONAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 906 de 2004, arts. 500 a 502',
    competentAuthority: 'Sala de Casación Penal de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Se emite tras el traslado de diez (10) días, el período probatorio de diez (10) días más el término de distancia y los cinco (5) días de alegatos. Si la persona requerida renuncia al procedimiento, el concepto debe emitirse dentro de los veinte (20) días siguientes (art. 500).' },
    requiredSections: [
      { n: 1, name: 'Validez formal de la documentación presentada por el Estado requirente', mandatory: true, basis: 'Art. 502' },
      { n: 2, name: 'Plena identidad de la persona solicitada', mandatory: true, basis: 'Art. 502' },
      { n: 3, name: 'Principio de doble incriminación', mandatory: true, basis: 'Art. 502' },
      { n: 4, name: 'Equivalencia de la providencia extranjera con la resolución de acusación', mandatory: true, basis: 'Art. 502' },
      { n: 5, name: 'Cumplimiento de lo previsto en los tratados públicos aplicables', mandatory: true, basis: 'Art. 502' },
      { n: 6, name: 'Condicionamientos al Gobierno sobre garantías del solicitado', mandatory: true, basis: 'Art. 494' }
    ],
    sourceUrl: 'https://leyes.co/codigo_de_procedimiento_penal/500.htm'
  },
  {
    id: 'internacional/laudo-arbitral-internacional',
    exactName: 'Laudo arbitral internacional',
    branch: 'INTERNACIONAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1563 de 2012, arts. 104 a 107',
    competentAuthority: 'Tribunal arbitral internacional',
    term: { status: 'VERIFICADO', description: 'Notificado el laudo, corre el mes del artículo 109 para interponer el recurso de anulación.' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes, del acuerdo de arbitraje y de la sede', mandatory: true, basis: 'Art. 104' },
      { n: 2, name: 'Motivación en que se funda la decisión', mandatory: true, basis: 'Art. 104' },
      { n: 3, name: 'Determinación de la ley aplicable al fondo de la controversia', mandatory: true, basis: 'Art. 101' },
      { n: 4, name: 'Decisión sobre cada pretensión y sobre las costas', mandatory: true, basis: 'Art. 104' },
      { n: 5, name: 'Fecha y firma de los árbitros', mandatory: true, basis: 'Art. 104' },
      { n: 6, name: 'Advertencia: si la sede fue Colombia, el laudo es nacional y se ejecuta sin reconocimiento previo', mandatory: true, basis: 'Art. 111' }
    ],
    sourceUrl: 'https://leyes.co/estatuto_de_arbitraje_nacional_e_internacional/111.htm'
  }
  ]
};
