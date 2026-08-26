import type { BranchCatalog } from '../types';

/**
 * ADMINISTRATIVO catalogue.
 *
 * Generated from research/actuaciones-administrativo-tributario-transito.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const ADMINISTRATIVO_CATALOG: BranchCatalog = {
  meta: {
    branch: 'ADMINISTRATIVO',
    verifiedAt: '2026-08-11',
    sourceOfTruth: 'Texto completo de la Ley 1437 de 2011 (CPACA) descargado y leído verbatim desde el Gestor Normativo de la Función Pública (norma_pdf.php?i=41249), extraído a texto plano y verificado artículo por artículo.',
    gaps: [
    'TRIBUTARIO: ninguna actuación verificada. Falta leer verbatim el Estatuto Tributario (arts. 588, 589, 637, 638, 640, 685, 697, 703, 705, 707, 708, 709, 710-713, 715-717, 720, 722, 732, 736-738, 779, 782, 814, 817, 826, 830-836, 837-839, 850, 854, 855) y confirmar renumeraciones por Ley 1819/2016, 2010/2019, 2155/2021 y 2277/2022.',
    'TRANSITO: ninguna actuación verificada. Falta leer verbatim la Ley 769 de 2002 (arts. 26, 125, 132, 135, 136, 137, 142, 159), la Ley 1383 de 2010, la Ley 1843 de 2017 (fotomultas, arts. 8 y 10) y la Sentencia C-038 de 2020 de la Corte Constitucional para determinar qué cayó exactamente sobre la solidaridad del propietario.',
    'ADMINISTRATIVO — términos no verificados: plazo de traslado para contestar la demanda (art. 172 y ss.); plazos de los recursos judiciales de apelación (art. 244), súplica (art. 246), revisión (art. 251) y unificación (art. 260); término de caducidad de la pérdida de investidura; término del medio de control de protección de derechos e intereses colectivos; requisitos y trámite de la conciliación extrajudicial en la Ley 640 de 2001; texto completo de la Ley 1755 de 2015 (derecho de petición, arts. 13-33) — NO se verificó ninguno de sus artículos, por lo que el derecho de petición NO se incluyó en este archivo.',
    'ADMINISTRATIVO — required_sections: sólo están verificados verbatim los de la demanda (art. 162), anexos (art. 166), recursos en vía gubernativa (art. 77), contestación (art. 175, numerales 1-5 leídos), petición de extensión ante la autoridad (art. 102) y solicitud de extensión ante el Consejo de Estado (art. 269). Las demás entradas llevan required_sections derivadas de esos mismos artículos por remisión, no de un artículo propio.',
    'No se verificaron actuaciones de notificación (arts. 66-73, 197-205) ni el régimen de firmeza (art. 87).',
    'DERECHO DE PETICION - no catalogada: Acción de tutela por violación del derecho de petición. No se cataloga porque la Ley 1755 de 2015 no la regula: ninguno de los arts. 13 a 33 la menciona ni fija término para acudir a ella. Su régimen está en el art. 86 de la Constitución Política y en el Decreto 2591 de 1991, que no se verificaron en esta consulta. ADVERTENCIA DE RELOJ: los términos de 15, 10 y 30 días del art. 14 son de la AUTORIDAD para responder; su vencimiento habilita el reclamo del peticionario, pero el plazo del peticionario para tutelar no está en esta norma y no puede deducirse de ella.',
    'DERECHO DE PETICION - no catalogada: Petición ante empresas de servicios públicos domiciliarios (término especial). El art. 33 extiende a esas empresas las disposiciones sobre derecho de petición «sin perjuicio de lo dispuesto en leyes especiales», y el art. 14 abre con «Salvo norma legal especial». El régimen de peticiones, quejas y recursos de los servicios públicos domiciliarios está en la Ley 142 de 1994, que no se verificó en esta consulta. La ficha catalogada refleja únicamente el término supletivo de la Ley 1755 de 2015; el término especial de la Ley 142 queda sin verificar y debe confirmarse en su propia norma antes de usarse.',
    'DERECHO DE PETICION - no catalogada: Recurso de reposición contra el acto que decreta el desistimiento tácito. El art. 17 inc. 4 dispone que contra ese acto «únicamente procede recurso de reposición», pero NO fija su término: el plazo para interponerlo lo señala el art. 76 de la Ley 1437 de 2011, que no forma parte del Título II sustituido por la Ley 1755 de 2015 y no se leyó en esta consulta. Por eso no se cataloga como ficha autónoma con término; corresponde a la ficha general de recursos del CPACA en la rama ADMINISTRATIVO.',
    'DERECHO DE PETICION (Ley 1755 de 2015), verificado el 2026-08-26: VIGENTE. La Ley Estatutaria 1755 de 30 de junio de 2015, por su art. 1, sustituyó el Título II —Derecho de Petición, Capítulos I, II y III, artículos 13 a 33— de la Parte Primera de la Ley 1437 de 2011 (CPACA). Su art. 2 dispone que «rige a partir de la fecha de su promulgación y deroga las disposiciones que le sean contrarias». El texto íntegro de los arts. 13 a 33 se leyó en el Gestor Normativo de la Función Pública (norma.php?i=65334). CONTROL PREVIO — SENTENCIA C-951 DE 2014: se leyó la parte resolutiva completa en corteconstitucional.gov.co/relatoria/2014/C-951-14.htm. La Corte declaró EXEQUIBLE el proyecto de ley estatutaria (núm. 65 de 2012 Senado, 227 de 2012 Cámara) por haber sido expedido conforme al procedimiento constitucional, y exequible su título; declaró EXEQUIBLES sin condicionamiento los arts. 14, 17, 18, 19, 20, 21, 23, 25, 27, 28, 29, 30 y 33 (numeral tercero) —de modo que el art. 14, que fija TODOS los términos catalogados aquí, quedó exequible puro y simple—; art. 13 EXEQUIBLE con excepción de la expresión «en relación a (sic) las entidades dedicadas a su protección o formación», declarada exequible «siempre y cuando no excluya la posibilidad de que los menores de edad presenten directamente peticiones dirigidas a otras entidades para el pleno ejercicio de sus derechos fundamentales» (numeral cuarto); art. 15: INEXEQUIBLES las expresiones «ante el funcionario competente» del inciso primero y «o ante el servidor público competente» del parágrafo 3, y EXEQ'
    ]
  },
  actuaciones: [
  {
    id: 'administrativo/demanda-de-nulidad-simple-medio-de-control-de-nulidad',
    exactName: 'Demanda de nulidad simple (medio de control de nulidad)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 137 (medio de control); art. 164 num. 1 lit. a) (oportunidad); arts. 162, 163 y 166 (contenido y anexos)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo (Consejo de Estado, Tribunal Administrativo o Juzgado Administrativo, según reglas de competencia de los arts. 149, 151 y 155)',
    term: { status: 'NO_CADUCA', description: 'En cualquier tiempo (art. 164 num. 1 lit. a). No opera caducidad.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162 encabezado' },
      { n: 2, name: 'Designación de las partes y de sus representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones (expresadas con precisión y claridad, formuladas por separado)', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización precisa del acto administrativo acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Hechos y omisiones (determinados, clasificados y numerados)', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 7, name: 'Pruebas (petición y aporte de las documentales en poder del demandante)', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Estimación razonada de la cuantía (cuando sea necesaria para determinar la competencia)', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 9, name: 'Notificaciones: lugar, dirección y canal digital', mandatory: false, basis: 'art. 162 num. 7 (mod. Ley 2080 de 2021, art. 35)' },
      { n: 10, name: 'Constancia de envío electrónico de la demanda y sus anexos al demandado', mandatory: true, basis: 'art. 162 num. 8 (adicionado Ley 2080 de 2021, art. 35): sin su acreditación se inadmite la demanda' },
      { n: 11, name: 'Anexos (copia del acto acusado con constancias, pruebas, poder, copias para traslado)', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-nulidad-y-restablecimiento-del-derecho',
    exactName: 'Demanda de nulidad y restablecimiento del derecho',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 138 (medio de control); art. 164 num. 2 lit. d) (caducidad); art. 161 num. 1 y num. 2 (requisitos de procedibilidad); arts. 162, 163 y 166',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo (Juzgado Administrativo, Tribunal Administrativo o Consejo de Estado, según cuantía y materia)',
    term: { status: 'VERIFICADO', description: 'Cuatro (4) meses contados a partir del día siguiente al de la comunicación, notificación, ejecución o publicación del acto administrativo, según el caso, salvo las excepciones establecidas en otras disposiciones legales (art. 164 num. 2 lit. d)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162 encabezado' },
      { n: 2, name: 'Designación de las partes y de sus representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones de nulidad y de restablecimiento del derecho (enunciadas clara y separadamente)', mandatory: true, basis: 'art. 162 num. 2 y art. 163 inciso 2' },
      { n: 4, name: 'Individualización precisa del acto acusado y de los actos que resolvieron los recursos', mandatory: true, basis: 'art. 163 inciso 1' },
      { n: 5, name: 'Hechos y omisiones (determinados, clasificados y numerados)', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Estimación razonada de la cuantía', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 9, name: 'Requisitos de procedibilidad (constancia de conciliación extrajudicial y agotamiento de los recursos obligatorios)', mandatory: true, basis: 'art. 161 nums. 1 y 2' },
      { n: 10, name: 'Notificaciones: lugar, dirección y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 11, name: 'Constancia de envío electrónico de la demanda y sus anexos al demandado', mandatory: true, basis: 'art. 162 num. 8' },
      { n: 12, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-nulidad-o-de-nulidad-y-restablecimiento-del-derecho-contra-actos-previos-a-la-celebracion-del-contrato-actos-precontractuales',
    exactName: 'Demanda de nulidad o de nulidad y restablecimiento del derecho contra actos previos a la celebración del contrato (actos precontractuales)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 2 lit. c); en concordancia con arts. 137, 138 y 141',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'Cuatro (4) meses contados a partir del día siguiente a su comunicación, notificación, ejecución o publicación, según el caso (art. 164 num. 2 lit. c)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización del acto precontractual acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Estimación razonada de la cuantía', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 9, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 10, name: 'Constancia de envío electrónico al demandado', mandatory: true, basis: 'art. 162 num. 8' },
      { n: 11, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-nulidad-electoral',
    exactName: 'Demanda de nulidad electoral',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 139 (medio de control); art. 164 num. 2 lit. a) (caducidad)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo (Sección Quinta del Consejo de Estado o Tribunal Administrativo, según la elección o nombramiento)',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días. Si la elección se declara en audiencia pública, se cuenta a partir del día siguiente; en los demás casos de elección y en los de nombramientos, a partir del día siguiente al de su publicación efectuada conforme al inciso 1 del art. 65. En elecciones o nombramientos que requieren confirmación, a partir del día siguiente a la confirmación (art. 164 num. 2 lit. a)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones de nulidad del acto de elección o nombramiento', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización del acto de elección o nombramiento acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 9, name: 'Constancia de envío electrónico al demandado', mandatory: true, basis: 'art. 162 num. 8' },
      { n: 10, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-reparacion-directa',
    exactName: 'Demanda de reparación directa',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 140 (medio de control, en los términos del art. 90 de la Constitución Política); art. 164 num. 2 lit. i) (caducidad); art. 161 num. 1 (conciliación extrajudicial como requisito de procedibilidad)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo (Juzgado o Tribunal Administrativo según cuantía)',
    term: { status: 'VERIFICADO', description: 'Dos (2) años contados a partir del día siguiente al de la ocurrencia de la acción u omisión causante del daño, o de cuando el demandante tuvo o debió tener conocimiento del mismo si fue en fecha posterior y siempre que pruebe la imposibilidad de haberlo conocido en la fecha de su ocurrencia (art. 164 num. 2 lit. i). Regla especial: tratándose del delito de desaparición forzada, el término se cuenta a partir de la fecha en que aparezca la víctima o, en su defecto, desde la ejecutoria del fallo definitivo adoptado en el proceso penal, sin perjuicio de que la demanda pueda intentarse desde el momento de los hechos (art. 164 num. 2 lit. i, inciso 2)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones (declaración de responsabilidad y condena indemnizatoria)', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Hechos y omisiones (determinados, clasificados y numerados)', mandatory: true, basis: 'art. 162 num. 3 — es la sección determinante al no existir acto administrativo que impugnar' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: false, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas (incluidos los dictámenes periciales para probar el derecho)', mandatory: false, basis: 'art. 162 num. 5 y art. 166 num. 2' },
      { n: 7, name: 'Estimación razonada de la cuantía', mandatory: true, basis: 'art. 162 num. 6 — determina la competencia' },
      { n: 8, name: 'Requisito de procedibilidad: constancia de conciliación extrajudicial', mandatory: true, basis: 'art. 161 num. 1 (mod. Ley 2080 de 2021, art. 34)' },
      { n: 9, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 10, name: 'Constancia de envío electrónico al demandado', mandatory: true, basis: 'art. 162 num. 8' },
      { n: 11, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-controversias-contractuales',
    exactName: 'Demanda de controversias contractuales',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 141 (medio de control); art. 164 num. 2 lit. j) (caducidad); art. 161 num. 1 (conciliación extrajudicial como requisito de procedibilidad)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'Dos (2) años contados a partir del día siguiente a la ocurrencia de los motivos de hecho o de derecho que sirvan de fundamento. Si se pretende la nulidad absoluta o relativa del contrato, dos (2) años desde el día siguiente al de su perfeccionamiento; en todo caso puede demandarse la nulidad absoluta mientras el contrato esté vigente. Reglas especiales de conteo (art. 164 num. 2 lit. j): (i) ejecución instantánea, desde el día siguiente a cuando se cumplió o debió cumplirse el objeto; (ii) contratos que no requieren liquidación, desde el día siguiente a la terminación por cualquier causa; (iii) liquidación de común acuerdo, desde el día siguiente a la firma del acta; (iv) liquidación unilateral, desde el día siguiente a la ejecutoria del acto que la apruebe; (v) si no se logra por mutuo acuerdo ni se practica unilateralmente, una vez cumplido el término de dos (2) meses contados desde el vencimiento del plazo convenido para hacerlo bilateralmente o, en su defecto, del término de los cuatro (4) meses siguientes a la terminación del contrato o a la expedición del acto que lo ordene o del acuerdo que la disponga' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes (representación contractual conforme al art. 159)', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones (existencia, nulidad, incumplimiento, revisión, restablecimiento, condena)', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Hechos y omisiones', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas y dictámenes periciales', mandatory: false, basis: 'art. 162 num. 5 y art. 166 num. 2' },
      { n: 7, name: 'Estimación razonada de la cuantía', mandatory: true, basis: 'art. 162 num. 6' },
      { n: 8, name: 'Requisito de procedibilidad: constancia de conciliación extrajudicial', mandatory: true, basis: 'art. 161 num. 1' },
      { n: 9, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 10, name: 'Constancia de envío electrónico al demandado', mandatory: true, basis: 'art. 162 num. 8' },
      { n: 11, name: 'Anexos (incluido el contrato y sus modificaciones)', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-repeticion',
    exactName: 'Demanda de repetición',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 142 (medio de control); art. 164 num. 2 lit. l), modificado por el art. 43 de la Ley 2195 de 2022 (caducidad); art. 161 num. 5 (requisito de procedibilidad: pago previo); art. 166 num. 1 (prueba del pago total)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo. La demanda la presenta la entidad pública condenada contra el agente estatal.',
    term: { status: 'VERIFICADO', description: 'Cinco (5) años contados a partir del día siguiente de la fecha del pago, o, a más tardar, desde el vencimiento del plazo con que cuenta la administración para el pago de condenas conforme a este Código (art. 164 num. 2 lit. l), modificado por el art. 43 de la Ley 2195 de 2022)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones de repetición', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Hechos (condena, conciliación u otra forma de terminación del conflicto y pago efectuado)', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 5, name: 'Fundamentos de derecho (dolo o culpa grave del agente)', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Prueba del pago total de la obligación', mandatory: true, basis: 'art. 166 num. 1 y art. 161 num. 5 — sin ella no procede la demanda' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Estimación razonada de la cuantía', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 9, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 10, name: 'Constancia de envío electrónico al demandado', mandatory: true, basis: 'art. 162 num. 8' },
      { n: 11, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/solicitud-de-perdida-de-investidura',
    exactName: 'Solicitud de pérdida de investidura',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 143',
    competentAuthority: 'Consejo de Estado (congresistas) y Tribunal Administrativo (diputados, concejales y ediles), conforme a las reglas de competencia del Código. Legitimación: la Mesa Directiva de la Cámara, Asamblea, Concejo o junta administradora local correspondiente, o cualquier ciudadano.',
    term: { status: 'VERIFICADO', description: 'La solicitud debe presentarse dentro de los cinco (5) años contados a partir del día siguiente al de la ocurrencia del hecho generador de la causal de pérdida de investidura, so pena de que opere la caducidad (Ley 1881 de 2018, art. 6). El art. 143 del CPACA no fija término alguno. Términos internos del trámite: la Sala Especial de Decisión dispone de veinte (20) días hábiles desde la presentación de la solicitud para dictar sentencia de primera instancia y la Sala Plena de igual plazo para decidir la apelación (art. 3); el recurso de apelación debe interponerse y sustentarse dentro de los diez (10) días siguientes a la notificación de la sentencia (art. 14 num. 1); el recurso extraordinario especial de revisión procede dentro de los dos (2) años siguientes a la ejecutoria (art. 19). La Ley 1881 de 2018 derogó la Ley 144 de 1994 (art. 24) y se aplica, en lo que sea compatible, a los procesos de pérdida de investidura de concejales y diputados (art. 22).' },
    requiredSections: [
      { n: 1, name: 'Designación de la corporación judicial competente', mandatory: false, basis: 'art. 162 por remisión' },
      { n: 2, name: 'Identificación del solicitante y del congresista, diputado, concejal o edil demandado', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensión de pérdida de investidura', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 5, name: 'Causal constitucional invocada y su fundamentación', mandatory: true, basis: 'art. 143 — las causas son las establecidas en la Constitución' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1881_2018.html'
  },
  {
    id: 'administrativo/demanda-de-proteccion-de-los-derechos-e-intereses-colectivos',
    exactName: 'Demanda de protección de los derechos e intereses colectivos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 144 (medio de control); art. 161 num. 4 (requisito de procedibilidad: reclamación previa prevista en el art. 144)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: la acción popular podrá promoverse durante el tiempo que subsista la amenaza o peligro al derecho e interés colectivo (Ley 472 de 1998, art. 11, aplicable por remisión del art. 164 num. 1 lit. f) del CPACA a los demás casos expresamente establecidos en la ley). En el texto oficial vigente aparece tachado como INEXEQUIBLE el aparte que fijaba un término de cinco (5) años, contados desde la acción u omisión que produjo la alteración, cuando la acción se dirigiera a volver las cosas a su estado anterior; ese plazo NO puede oponerse hoy. Requisito previo: reclamación ante la autoridad conforme al art. 144 del CPACA.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones de protección del derecho o interés colectivo', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: false, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Prueba de la reclamación previa ante la autoridad (requisito de procedibilidad)', mandatory: true, basis: 'art. 161 num. 4 en concordancia con el art. 144' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 9, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0472_1998.html'
  },
  {
    id: 'administrativo/demanda-de-reparacion-de-los-perjuicios-causados-a-un-grupo-accion-de-grupo',
    exactName: 'Demanda de reparación de los perjuicios causados a un grupo (acción de grupo)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 145 (medio de control); art. 164 num. 2 lit. h) (caducidad)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'Dos (2) años siguientes a la fecha en que se causó el daño. Si el daño causado al grupo proviene de un acto administrativo y se pretende su nulidad, la demanda con tal solicitud deberá presentarse dentro del término de cuatro (4) meses contados a partir del día siguiente al de la comunicación, notificación, ejecución o publicación del acto administrativo (art. 164 num. 2 lit. h)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes (número plural o conjunto de personas)', mandatory: false, basis: 'art. 162 num. 1 y art. 145' },
      { n: 3, name: 'Pretensiones (declaratoria de responsabilidad, reconocimiento y pago de la indemnización)', mandatory: true, basis: 'art. 162 num. 2 y art. 164 num. 2 lit. h' },
      { n: 4, name: 'Hechos y condiciones uniformes del grupo', mandatory: true, basis: 'art. 162 num. 3' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: false, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Estimación razonada de la cuantía', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 8, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 9, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-cumplimiento-de-normas-con-fuerza-material-de-ley-o-de-actos-administrativos-accion-de-cumplimiento',
    exactName: 'Demanda de cumplimiento de normas con fuerza material de ley o de actos administrativos (acción de cumplimiento)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 146 (medio de control); art. 164 num. 1 lit. e) (oportunidad); art. 161 num. 3 (requisito de procedibilidad: constitución en renuencia en los términos del art. 8 de la Ley 393 de 1997)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'NO_CADUCA', description: 'En cualquier tiempo, siempre que el acto administrativo cuyo cumplimiento se solicita no haya perdido fuerza ejecutoria (art. 164 num. 1 lit. e). No opera caducidad.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensión de cumplimiento', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Identificación de la norma con fuerza material de ley o del acto administrativo incumplido', mandatory: true, basis: 'art. 146' },
      { n: 5, name: 'Hechos del incumplimiento', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Prueba de la constitución en renuencia', mandatory: true, basis: 'art. 161 num. 3 en concordancia con el art. 8 de la Ley 393 de 1997' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 9, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/solicitud-de-nulidad-por-inconstitucionalidad',
    exactName: 'Solicitud de nulidad por inconstitucionalidad',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 135',
    competentAuthority: 'Consejo de Estado',
    term: { status: 'VERIFICADO', description: 'En cualquier tiempo (art. 135: «Los ciudadanos podrán, en cualquier tiempo, solicitar por sí, o por medio de representante...»)' },
    requiredSections: [
      { n: 1, name: 'Designación del Consejo de Estado', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Identificación del ciudadano solicitante o de su representante', mandatory: false, basis: 'art. 135 y art. 162 num. 1' },
      { n: 3, name: 'Pretensión de nulidad por inconstitucionalidad', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización precisa del decreto o acto acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Normas constitucionales violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-nulidad-de-cartas-de-naturaleza-y-de-resoluciones-de-autorizacion-de-inscripcion-de-nacionales',
    exactName: 'Demanda de nulidad de cartas de naturaleza y de resoluciones de autorización de inscripción de nacionales',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 2 lit. b)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'Diez (10) años contados a partir de la fecha de expedición del acto (art. 164 num. 2 lit. b)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensión de nulidad', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización de la carta de naturaleza o resolución acusada', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-nulidad-o-de-nulidad-y-restablecimiento-del-derecho-contra-actos-administrativos-de-adjudicacion-de-baldios',
    exactName: 'Demanda de nulidad o de nulidad y restablecimiento del derecho contra actos administrativos de adjudicación de baldíos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 2 lit. e)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo. Acto expedido por la autoridad agraria correspondiente.',
    term: { status: 'VERIFICADO', description: 'Dos (2) años siguientes a su ejecutoria o desde su publicación en el Diario Oficial, según el caso. Para los terceros, el término se cuenta a partir del día siguiente de la inscripción del acto en la respectiva Oficina de Instrumentos Públicos (art. 164 num. 2 lit. e)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización del acto de adjudicación acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-revision-de-actos-de-extincion-del-dominio-agrario-o-de-los-que-deciden-de-fondo-procedimientos-de-clarificacion-deslinde-y-recuperacion-de-baldios',
    exactName: 'Demanda de revisión de actos de extinción del dominio agrario o de los que deciden de fondo procedimientos de clarificación, deslinde y recuperación de baldíos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 2 lit. f)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'Quince (15) días siguientes al de la ejecutoria del acto. Para los terceros, el término de caducidad es de treinta (30) días contados a partir del día siguiente al de la inscripción del acto en la correspondiente Oficina de Instrumentos Públicos (art. 164 num. 2 lit. f)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensión de revisión', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización del acto acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-ejecutiva-con-titulos-derivados-del-contrato-estatal-de-decisiones-judiciales-de-la-jurisdiccion-de-lo-contencioso-administrativo-o-de-laudos-arbitrales-contractuales-estatales',
    exactName: 'Demanda ejecutiva con títulos derivados del contrato estatal, de decisiones judiciales de la Jurisdicción de lo Contencioso Administrativo o de laudos arbitrales contractuales estatales',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 2 lit. k)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'Cinco (5) años contados a partir de la exigibilidad de la obligación contenida en el título (art. 164 num. 2 lit. k)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensión ejecutiva (mandamiento de pago)', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Título ejecutivo y prueba de la exigibilidad de la obligación', mandatory: true, basis: 'art. 164 num. 2 lit. k y art. 166 num. 2' },
      { n: 5, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Estimación razonada de la cuantía', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-contra-actos-producto-del-silencio-administrativo',
    exactName: 'Demanda contra actos producto del silencio administrativo',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 1 lit. d); art. 161 num. 2 (el silencio negativo frente a la primera petición permite demandar directamente el acto presunto); art. 166 num. 1 (prueba del silencio)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'NO_CADUCA', description: 'En cualquier tiempo (art. 164 num. 1 lit. d). No opera caducidad.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Identificación del acto presunto y de la petición que lo originó', mandatory: true, basis: 'art. 163 y art. 161 num. 2' },
      { n: 5, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 7, name: 'Pruebas que demuestren el silencio administrativo', mandatory: true, basis: 'art. 166 num. 1' },
      { n: 8, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 9, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-contra-actos-que-reconocen-o-niegan-total-o-parcialmente-prestaciones-periodicas',
    exactName: 'Demanda contra actos que reconocen o niegan total o parcialmente prestaciones periódicas',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 1 lit. c)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'VERIFICADO', description: 'En cualquier tiempo. Sin embargo, no habrá lugar a recuperar las prestaciones pagadas a particulares de buena fe (art. 164 num. 1 lit. c)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones de nulidad y restablecimiento', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Individualización del acto acusado', mandatory: true, basis: 'art. 163' },
      { n: 5, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 7, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 8, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 9, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-cuyo-objeto-lo-constituyan-bienes-estatales-imprescriptibles-e-inenajenables',
    exactName: 'Demanda cuyo objeto lo constituyan bienes estatales imprescriptibles e inenajenables',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 1 lit. b)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'NO_CADUCA', description: 'En cualquier tiempo (art. 164 num. 1 lit. b). No opera caducidad.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensiones', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Hechos', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 5, name: 'Fundamentos de derecho', mandatory: true, basis: 'art. 162 num. 4' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: 'art. 162 num. 5' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-expropiacion-de-inmueble-agrario',
    exactName: 'Demanda de expropiación de inmueble agrario',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 164 num. 2 lit. g)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo. La demanda la presenta la autoridad competente.',
    term: { status: 'VERIFICADO', description: 'Dos (2) meses contados a partir del día siguiente al de la ejecutoria del acto administrativo que ordene adelantar dicha actuación (art. 164 num. 2 lit. g)' },
    requiredSections: [
      { n: 1, name: 'Designación del juez competente', mandatory: false, basis: 'art. 162' },
      { n: 2, name: 'Partes y representantes', mandatory: false, basis: 'art. 162 num. 1' },
      { n: 3, name: 'Pretensión de expropiación', mandatory: true, basis: 'art. 162 num. 2' },
      { n: 4, name: 'Acto administrativo ejecutoriado que ordena adelantar la actuación', mandatory: true, basis: 'art. 164 num. 2 lit. g y art. 166 num. 1' },
      { n: 5, name: 'Hechos e identificación del inmueble', mandatory: false, basis: 'art. 162 num. 3' },
      { n: 6, name: 'Estimación razonada de la cuantía', mandatory: false, basis: 'art. 162 num. 6' },
      { n: 7, name: 'Notificaciones y canal digital', mandatory: false, basis: 'art. 162 num. 7' },
      { n: 8, name: 'Anexos', mandatory: false, basis: 'art. 166' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-de-reposicion-via-gubernativa',
    exactName: 'Recurso de reposición (vía gubernativa)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 74 num. 1 (procedencia); art. 76 (oportunidad y presentación); art. 77 (requisitos)',
    competentAuthority: 'La misma autoridad que expidió la decisión, para que la aclare, modifique, adicione o revoque (art. 74 num. 1)',
    term: { status: 'VERIFICADO', description: 'Por escrito en la diligencia de notificación personal, o dentro de los diez (10) días siguientes a ella, o a la notificación por aviso, o al vencimiento del término de publicación, según el caso. Contra los actos presuntos puede interponerse en cualquier tiempo, salvo que se haya acudido ante el juez (art. 76)' },
    requiredSections: [
      { n: 1, name: 'Designación del funcionario que dictó la decisión', mandatory: false, basis: 'art. 76 inciso 2' },
      { n: 2, name: 'Identificación del recurrente, su representante o apoderado debidamente constituido, e interposición dentro del plazo legal', mandatory: true, basis: 'art. 77 num. 1' },
      { n: 3, name: 'Identificación del acto administrativo recurrido y de su notificación', mandatory: false, basis: 'art. 76' },
      { n: 4, name: 'Sustentación con expresión concreta de los motivos de inconformidad', mandatory: true, basis: 'art. 77 num. 2 — es el requisito sustancial del recurso' },
      { n: 5, name: 'Solicitud y aporte de las pruebas que se pretende hacer valer', mandatory: false, basis: 'art. 77 num. 3' },
      { n: 6, name: 'Petición (aclarar, modificar, adicionar o revocar)', mandatory: true, basis: 'art. 74 num. 1' },
      { n: 7, name: 'Nombre y dirección del recurrente, y dirección electrónica si desea ser notificado por ese medio', mandatory: true, basis: 'art. 77 num. 4' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-de-apelacion-via-gubernativa',
    exactName: 'Recurso de apelación (vía gubernativa)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 74 num. 2 (procedencia); art. 76 (oportunidad y presentación); art. 77 (requisitos); art. 161 num. 2 (agotamiento como requisito de procedibilidad)',
    competentAuthority: 'El inmediato superior administrativo o funcional de quien expidió la decisión (art. 74 num. 2)',
    term: { status: 'VERIFICADO', description: 'Por escrito en la diligencia de notificación personal, o dentro de los diez (10) días siguientes a ella, o a la notificación por aviso, o al vencimiento del término de publicación, según el caso. Contra los actos presuntos puede interponerse en cualquier tiempo, salvo que se haya acudido ante el juez (art. 76)' },
    requiredSections: [
      { n: 1, name: 'Designación del funcionario que dictó la decisión (ante quien se presenta) y del superior que debe resolver', mandatory: false, basis: 'art. 76 inciso 2' },
      { n: 2, name: 'Identificación del recurrente, su representante o apoderado debidamente constituido, e interposición dentro del plazo legal', mandatory: true, basis: 'art. 77 num. 1' },
      { n: 3, name: 'Identificación del acto administrativo recurrido', mandatory: false, basis: 'art. 76' },
      { n: 4, name: 'Sustentación con expresión concreta de los motivos de inconformidad', mandatory: true, basis: 'art. 77 num. 2' },
      { n: 5, name: 'Solicitud y aporte de pruebas', mandatory: false, basis: 'art. 77 num. 3' },
      { n: 6, name: 'Petición', mandatory: true, basis: 'art. 74 num. 2' },
      { n: 7, name: 'Nombre y dirección del recurrente y dirección electrónica', mandatory: true, basis: 'art. 77 num. 4' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-de-queja-via-gubernativa',
    exactName: 'Recurso de queja (vía gubernativa)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 74 num. 3; art. 77 (requisitos)',
    competentAuthority: 'El superior del funcionario que dictó la decisión, ante quien puede interponerse directamente (art. 74 num. 3)',
    term: { status: 'VERIFICADO', description: 'De este recurso se podrá hacer uso dentro de los cinco (5) días siguientes a la notificación de la decisión (art. 74 num. 3, inciso 3). Procede cuando se rechace el recurso de apelación, es facultativo y puede interponerse directamente ante el superior del funcionario que dictó la decisión, mediante escrito al que deberá acompañarse copia de la providencia que haya negado el recurso (art. 74 num. 3, incisos 1 a 3). Recibido el escrito, el superior ordenará inmediatamente la remisión del expediente y decidirá lo que sea del caso.' },
    requiredSections: [
      { n: 1, name: 'Designación del superior del funcionario que dictó la decisión', mandatory: true, basis: 'art. 74 num. 3 — se interpone directamente ante el superior' },
      { n: 2, name: 'Identificación del recurrente', mandatory: false, basis: 'art. 77 num. 1' },
      { n: 3, name: 'Hechos: interposición del recurso de apelación y su rechazo', mandatory: true, basis: 'art. 74 num. 3' },
      { n: 4, name: 'Sustentación de la procedencia de la apelación rechazada', mandatory: true, basis: 'art. 77 num. 2' },
      { n: 5, name: 'Copia de la providencia que negó el recurso de apelación', mandatory: true, basis: 'art. 74 num. 3, inciso final — debe acompañarse al escrito' },
      { n: 6, name: 'Nombre y dirección del recurrente y dirección electrónica', mandatory: true, basis: 'art. 77 num. 4' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr001.html'
  },
  {
    id: 'administrativo/solicitud-de-revocacion-directa-de-actos-administrativos',
    exactName: 'Solicitud de revocación directa de actos administrativos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, arts. 93 (causales), 94 (improcedencia) y 95 (oportunidad)',
    competentAuthority: 'Las mismas autoridades que hayan expedido el acto administrativo o sus inmediatos superiores (art. 93)',
    term: { status: 'VERIFICADO', description: 'Puede solicitarse aun cuando se haya acudido ante la Jurisdicción de lo Contencioso Administrativo, siempre que no se haya notificado auto admisorio de la demanda (art. 95, inciso 1). La autoridad debe resolver dentro de los dos (2) meses siguientes a la presentación de la solicitud (art. 95, inciso 2).' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad que expidió el acto o de su inmediato superior', mandatory: false, basis: 'art. 93' },
      { n: 2, name: 'Identificación del solicitante o su apoderado', mandatory: false, basis: null },
      { n: 3, name: 'Individualización del acto administrativo cuya revocación se solicita', mandatory: true, basis: 'art. 93' },
      { n: 4, name: 'Causal de revocación invocada y su sustentación', mandatory: true, basis: 'art. 93 (causales)' },
      { n: 5, name: 'Manifestación de que no se ha notificado auto admisorio de demanda', mandatory: true, basis: 'art. 95, inciso 1' },
      { n: 6, name: 'Pruebas', mandatory: false, basis: null },
      { n: 7, name: 'Petición y notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/peticion-de-extension-de-la-jurisprudencia-del-consejo-de-estado-a-terceros-ante-la-autoridad-administrativa',
    exactName: 'Petición de extensión de la jurisprudencia del Consejo de Estado a terceros ante la autoridad administrativa',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 102',
    competentAuthority: 'La autoridad legalmente competente para reconocer el derecho (art. 102, inciso 2)',
    term: { status: 'VERIFICADO', description: 'La petición sólo procede siempre que la pretensión judicial no haya caducado (art. 102, inciso 2). La autoridad debe decidir dentro de los treinta (30) días siguientes a la recepción de la petición (art. 102).' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad legalmente competente para reconocer el derecho', mandatory: true, basis: 'art. 102, inciso 2' },
      { n: 2, name: 'Requisitos generales de toda petición (identificación del peticionario, objeto, razones, dirección)', mandatory: false, basis: 'art. 102, inciso 2 («además de los requisitos generales»)' },
      { n: 3, name: 'Justificación razonada que evidencie que el peticionario se encuentra en la misma situación de hecho y de derecho en la que se encontraba el demandante al cual se le reconoció el derecho en la sentencia de unificación invocada', mandatory: true, basis: 'art. 102 num. 1 — es el núcleo de la petición' },
      { n: 4, name: 'Las pruebas que tenga en su poder, enunciando las que reposen en los archivos de la entidad, así como las que haría valer si hubiere necesidad de ir a un proceso', mandatory: true, basis: 'art. 102 num. 2' },
      { n: 5, name: 'La referencia de la sentencia de unificación que invoca a su favor', mandatory: true, basis: 'art. 102 num. 3' },
      { n: 6, name: 'Indicación de si se formuló una petición anterior con el mismo propósito sin haber solicitado la extensión de la jurisprudencia', mandatory: false, basis: 'art. 102, inciso 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/solicitud-de-extension-de-la-jurisprudencia-del-consejo-de-estado-a-terceros-ante-el-consejo-de-estado',
    exactName: 'Solicitud de extensión de la jurisprudencia del Consejo de Estado a terceros (ante el Consejo de Estado)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 269, en concordancia con el art. 102',
    competentAuthority: 'Consejo de Estado. Procede si se negó la extensión de los efectos de una sentencia de unificación o si la autoridad guardó silencio en los términos del art. 102.',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días siguientes a la negativa total o parcial de la petición de extensión, o al silencio de la autoridad sobre ella, para acudir ante el Consejo de Estado en los términos del art. 269 (art. 102, modificado por el art. 17 de la Ley 2080 de 2021). La solicitud de extensión ante la autoridad suspende los términos para presentar la demanda, que se reanudan al vencimiento de ese plazo de treinta (30) días cuando el interesado decide no acudir al Consejo de Estado (art. 102, incisos finales). Si el escrito no cumple los requisitos se inadmite para corregirlo dentro de los diez (10) días siguientes, so pena de rechazo (art. 269, inciso 3); la presentación extemporánea es causal de rechazo de plano (art. 269, causal 2).' },
    requiredSections: [
      { n: 1, name: 'Designación del Consejo de Estado', mandatory: false, basis: 'art. 269' },
      { n: 2, name: 'Actuación a través de apoderado', mandatory: true, basis: 'art. 269, inciso 1 («el interesado, a través de apoderado»)' },
      { n: 3, name: 'Escrito razonado que evidencie que se encuentra en similar situación de hecho y de derecho del demandante al cual se le reconoció el derecho en la sentencia de unificación invocada', mandatory: true, basis: 'art. 269, inciso 1' },
      { n: 4, name: 'Referencia de la sentencia de unificación invocada (que sea de unificación y que reconozca un derecho)', mandatory: true, basis: 'art. 269, causales de rechazo de plano nums. 3 y 4' },
      { n: 5, name: 'Copia de la actuación surtida ante la autoridad competente', mandatory: true, basis: 'art. 269, inciso 2' },
      { n: 6, name: 'Manifestación bajo la gravedad del juramento —que se entiende prestado con la sola presentación de la solicitud— de que no se ha acudido a la jurisdicción de lo contencioso administrativo para obtener el reconocimiento del derecho pretendido', mandatory: true, basis: 'art. 269, inciso 2' },
      { n: 7, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr002.html'
  },
  {
    id: 'administrativo/solicitud-de-medidas-cautelares',
    exactName: 'Solicitud de medidas cautelares',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, arts. 229 (procedencia), 230 (contenido y alcance), 231 (requisitos) y 235 (levantamiento, modificación y revocatoria)',
    competentAuthority: 'El Juez o Magistrado Ponente que conoce del proceso declarativo',
    term: { status: 'VERIFICADO', description: 'Procede desde antes de ser notificado el auto admisorio de la demanda y en cualquier estado del proceso (art. 229). No hay término de caducidad propio.' },
    requiredSections: [
      { n: 1, name: 'Designación del Juez o Magistrado Ponente', mandatory: false, basis: 'art. 229' },
      { n: 2, name: 'Identificación del solicitante y del proceso', mandatory: false, basis: null },
      { n: 3, name: 'Medida cautelar solicitada (preventiva, conservativa, anticipativa o de suspensión)', mandatory: true, basis: 'art. 230' },
      { n: 4, name: 'Para la suspensión provisional: confrontación del acto demandado con las normas superiores invocadas como violadas, o análisis de las pruebas allegadas con la solicitud', mandatory: true, basis: 'art. 231, inciso 1 — la violación debe surgir de esa confrontación' },
      { n: 5, name: 'Prueba siquiera sumaria de los perjuicios, cuando además se pretenda el restablecimiento del derecho y la indemnización', mandatory: true, basis: 'art. 231, inciso 1, parte final' },
      { n: 6, name: 'En los demás casos: demanda razonablemente fundada en derecho', mandatory: true, basis: 'art. 231 num. 1' },
      { n: 7, name: 'En los demás casos: demostración siquiera sumaria de la titularidad del derecho o derechos invocados', mandatory: true, basis: 'art. 231 num. 2' },
      { n: 8, name: 'En los demás casos: documentos, informaciones, argumentos y justificaciones que permitan concluir, mediante juicio de ponderación de intereses, que resultaría más gravoso para el interés público negar la medida que concederla', mandatory: true, basis: 'art. 231 num. 3' },
      { n: 9, name: 'En los demás casos: acreditación de una de las condiciones adicionales del numeral 4', mandatory: true, basis: 'art. 231 num. 4' },
      { n: 10, name: 'Ofrecimiento de caución', mandatory: false, basis: 'art. 234 (referencia a la caución señalada en el auto que decreta la medida)' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/solicitud-de-medida-cautelar-de-urgencia',
    exactName: 'Solicitud de medida cautelar de urgencia',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 234, en concordancia con los arts. 229 a 231',
    competentAuthority: 'El Juez o Magistrado Ponente, quien puede adoptarla desde la presentación de la solicitud y sin previa notificación a la otra parte',
    term: { status: 'VERIFICADO', description: 'Desde la presentación de la solicitud (art. 234). Sin término de caducidad.' },
    requiredSections: [
      { n: 1, name: 'Designación del Juez o Magistrado Ponente', mandatory: false, basis: 'art. 234' },
      { n: 2, name: 'Identificación del solicitante y del proceso', mandatory: false, basis: null },
      { n: 3, name: 'Medida cautelar solicitada', mandatory: true, basis: 'art. 230' },
      { n: 4, name: 'Cumplimiento de los requisitos para la adopción de la medida cautelar', mandatory: true, basis: 'art. 234 («cumplidos los requisitos para su adopción»), remitiendo al art. 231' },
      { n: 5, name: 'Sustentación de la URGENCIA: evidencia de que por ella no es posible agotar el trámite previsto en el artículo anterior', mandatory: true, basis: 'art. 234 — es el elemento diferenciador y determinante' },
      { n: 6, name: 'Ofrecimiento de caución', mandatory: true, basis: 'art. 234, inciso 2 — la medida se cumple previa constitución de la caución señalada en el auto que la decrete' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/contestacion-de-la-demanda',
    exactName: 'Contestación de la demanda',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 175',
    competentAuthority: 'Juez o Magistrado Ponente que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Durante el término de traslado de la demanda (art. 175, encabezado). El número de días del traslado no fue verificado.' },
    requiredSections: [
      { n: 1, name: 'Nombre del demandado, su domicilio y el de su representante o apoderado, en caso de no comparecer por sí mismo', mandatory: false, basis: 'art. 175 num. 1' },
      { n: 2, name: 'Pronunciamiento sobre las pretensiones y los hechos de la demanda', mandatory: true, basis: 'art. 175 num. 2 — su omisión tiene efectos probatorios sobre los hechos' },
      { n: 3, name: 'Las excepciones', mandatory: true, basis: 'art. 175 num. 3' },
      { n: 4, name: 'Relación de las pruebas que se acompañan y petición de aquellas cuya práctica se solicite; en todo caso el demandado deberá aportar con la contestación todas las pruebas que tenga en su poder y que pretenda hacer valer', mandatory: true, basis: 'art. 175 num. 4' },
      { n: 5, name: 'Los dictámenes periciales que considere necesarios para oponerse a las pretensiones', mandatory: false, basis: 'art. 175 num. 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/solicitud-de-conciliacion-extrajudicial-requisito-de-procedibilidad',
    exactName: 'Solicitud de conciliación extrajudicial (requisito de procedibilidad)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 161 num. 1 (modificado por el art. 34 de la Ley 2080 de 2021)',
    competentAuthority: 'Ministerio Público — Procuraduría General de la Nación (agentes del Ministerio Público ante la Jurisdicción de lo Contencioso Administrativo)',
    term: { status: 'VERIFICADO', description: 'El trámite se rige hoy por la Ley 2220 de 2022 (Estatuto de Conciliación), que derogó íntegramente la Ley 640 de 2001 (art. 146). El agente del Ministerio Público admite la solicitud dentro de los diez (10) días siguientes a su recibo o a su subsanación y fija la audiencia, que deberá realizarse dentro de los treinta (30) días siguientes a la notificación del auto admisorio (art. 106 num. 1). El requisito de procedibilidad se entiende surtido, entre otros eventos, cuando vencido el término de tres (3) meses contados desde la presentación de la solicitud —o su prórroga— la audiencia no se hubiere celebrado por cualquier causa, caso en el cual se puede acudir directamente a la Jurisdicción de lo Contencioso Administrativo con la sola presentación de la solicitud (art. 94 num. 3). La presentación de la petición de convocatoria suspende el término de caducidad del medio de control hasta la ejecutoria de la providencia que imprueba el acuerdo, la expedición de las constancias o el vencimiento de los tres (3) meses, lo primero que ocurra; durante la prórroga pactada por las partes NO opera la suspensión (art. 96 y su parágrafo).' },
    requiredSections: [
      { n: 1, name: 'Designación del agente del Ministerio Público (Procurador Judicial Delegado ante la Jurisdicción de lo Contencioso Administrativo)', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del convocante y del convocado (entidad pública)', mandatory: false, basis: null },
      { n: 3, name: 'Hechos', mandatory: false, basis: null },
      { n: 4, name: 'Pretensiones conciliables (relativas a nulidad y restablecimiento del derecho, reparación directa o controversias contractuales)', mandatory: true, basis: 'art. 161 num. 1 — sólo respecto de esas pretensiones el trámite es requisito de procedibilidad' },
      { n: 5, name: 'Fórmula de arreglo y estimación razonada de la cuantía', mandatory: false, basis: null },
      { n: 6, name: 'Pruebas y anexos', mandatory: false, basis: null },
      { n: 7, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2220_2022_pr002.html'
  },
  {
    id: 'administrativo/escrito-de-constitucion-en-renuencia-requisito-de-procedibilidad-de-la-accion-de-cumplimiento',
    exactName: 'Escrito de constitución en renuencia (requisito de procedibilidad de la acción de cumplimiento)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 161 num. 3, que remite al art. 8 de la Ley 393 de 1997',
    competentAuthority: 'La autoridad obligada al cumplimiento de la norma con fuerza material de ley o del acto administrativo',
    term: { status: 'VERIFICADO', description: 'La renuencia se constituye cuando el accionante ha reclamado previamente el cumplimiento del deber legal o administrativo y la autoridad se ha ratificado en su incumplimiento o no ha contestado dentro de los diez (10) días siguientes a la presentación de la solicitud (Ley 393 de 1997, art. 8, inciso 2, al que remite expresamente el art. 161 num. 3 del CPACA). Excepcionalmente puede prescindirse del requisito cuando cumplirlo a cabalidad genere el inminente peligro de sufrir un perjuicio irremediable, lo que deberá sustentarse en la demanda (la expresión «para el accionante» figura tachada como INEXEQUIBLE en el texto oficial).' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad obligada', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del solicitante', mandatory: false, basis: null },
      { n: 3, name: 'Identificación precisa de la norma con fuerza material de ley o del acto administrativo cuyo cumplimiento se reclama', mandatory: true, basis: 'art. 161 num. 3 en concordancia con el art. 146' },
      { n: 4, name: 'Requerimiento expreso de cumplimiento', mandatory: true, basis: 'art. 161 num. 3' },
      { n: 5, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_0393_1997.html'
  },
  {
    id: 'administrativo/reclamacion-previa-para-la-proteccion-de-derechos-e-intereses-colectivos-requisito-de-procedibilidad',
    exactName: 'Reclamación previa para la protección de derechos e intereses colectivos (requisito de procedibilidad)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 161 num. 4, que remite al art. 144 del mismo Código',
    competentAuthority: 'La autoridad presuntamente responsable de la amenaza o vulneración del derecho o interés colectivo',
    term: { status: 'VERIFICADO', description: 'Antes de presentar la demanda el interesado debe solicitar a la autoridad o al particular en ejercicio de funciones administrativas que adopte las medidas necesarias de protección; si la autoridad no atiende dicha reclamación dentro de los quince (15) días siguientes a la presentación de la solicitud o se niega a ello, podrá acudirse ante el juez (art. 144, inciso 3, al que remite el art. 161 num. 4). Excepcionalmente se podrá prescindir de este requisito cuando exista inminente peligro de ocurrir un perjuicio irremediable en contra de los derechos e intereses colectivos, situación que deberá sustentarse en la demanda.' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del reclamante', mandatory: false, basis: null },
      { n: 3, name: 'Identificación del derecho o interés colectivo amenazado o vulnerado', mandatory: true, basis: 'art. 161 num. 4 en concordancia con el art. 144' },
      { n: 4, name: 'Hechos de la amenaza o vulneración', mandatory: false, basis: null },
      { n: 5, name: 'Petición de adopción de las medidas necesarias', mandatory: true, basis: 'art. 144' },
      { n: 6, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr003.html'
  },
  {
    id: 'administrativo/escritura-publica-para-invocar-el-silencio-administrativo-positivo',
    exactName: 'Escritura pública para invocar el silencio administrativo positivo',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 85 (procedimiento para invocar el silencio administrativo positivo), en concordancia con el art. 84',
    competentAuthority: 'Notaría (protocolización) y la autoridad ante la cual se hace valer el acto ficto positivo',
    term: { status: 'NO_CADUCA', description: 'El art. 85 no fija plazo alguno para otorgar la escritura: no opera caducidad para protocolizar una vez configurado el silencio positivo. El interesado protocoliza la constancia o copia de que trata el art. 15 junto con una declaración jurada de no haberle sido notificada la decisión dentro del término previsto; la escritura y sus copias auténticas producen todos los efectos legales de la decisión favorable que se pidió y es deber de todas las personas y autoridades reconocerla así; para efectos de la protocolización se entiende que los documentos carecen de valor económico (art. 85). El plazo tras el cual se entiende producida la decisión positiva presunta lo fija cada disposición legal especial y se cuenta a partir del día en que se presentó la petición o recurso (art. 84); el acto positivo presunto puede ser objeto de revocación directa (art. 84, inciso 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación del interesado', mandatory: false, basis: null },
      { n: 2, name: 'Copia de la petición presentada y prueba de su radicación', mandatory: true, basis: 'art. 85' },
      { n: 3, name: 'Declaración jurada de no haberse notificado la decisión dentro del término previsto', mandatory: true, basis: 'art. 85' },
      { n: 4, name: 'Invocación de la disposición legal especial que consagra el silencio positivo para el caso', mandatory: true, basis: 'art. 84 — el silencio positivo sólo opera en los casos expresamente previstos en disposiciones legales especiales' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr002.html'
  },
  {
    id: 'administrativo/recurso-de-apelacion-contra-sentencias-y-autos-judicial',
    exactName: 'Recurso de apelación contra sentencias y autos (judicial)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 243',
    competentAuthority: 'El superior funcional del juez de primera instancia (Tribunal Administrativo o Consejo de Estado)',
    term: { status: 'VERIFICADO', description: 'Contra sentencias de primera instancia: el recurso deberá interponerse y sustentarse ante la autoridad que profirió la providencia dentro de los diez (10) días siguientes a su notificación, término que también aplica a las sentencias dictadas en audiencia (art. 247 num. 1, modificado por el art. 67 de la Ley 2080 de 2021). Contra autos (los enumerados en el art. 243): si el auto se profiere en audiencia, la apelación deberá interponerse y sustentarse oralmente a continuación de su notificación en estrados o de la del auto que niega total o parcialmente la reposición; si el auto se notifica por estado, deberá interponerse y sustentarse por escrito dentro de los tres (3) días siguientes a su notificación, término que en el medio de control electoral es de dos (2) días (art. 244 nums. 2 y 3, modificado por el art. 64 de la Ley 2080 de 2021).' },
    requiredSections: [
      { n: 1, name: 'Designación del juez de primera instancia y del superior', mandatory: false, basis: null },
      { n: 2, name: 'Identificación de la providencia apelada', mandatory: true, basis: 'art. 243' },
      { n: 3, name: 'Sustentación y reparos concretos contra la providencia', mandatory: true, basis: null },
      { n: 4, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr005.html'
  },
  {
    id: 'administrativo/recurso-de-suplica',
    exactName: 'Recurso de súplica',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 246',
    competentAuthority: 'Los demás magistrados de la Sala o Sección, distintos del ponente que dictó el auto',
    term: { status: 'VERIFICADO', description: 'Si el auto del magistrado ponente se profiere en audiencia, el recurso deberá interponerse y sustentarse oralmente a continuación de su notificación en estrados o de la del auto que niega total o parcialmente la reposición; si el auto se notifica por estado, deberá interponerse y sustentarse por escrito dentro de los tres (3) días siguientes a su notificación, término que en el medio de control electoral es de dos (2) días (art. 246, literales b) y c), modificado por el art. 66 de la Ley 2080 de 2021). El escrito se mantiene dos (2) días en secretaría a disposición de los demás sujetos procesales. Si el recurrente no sustenta el recurso, el magistrado ponente se abstendrá de plano de darle trámite (art. 246, literal e).' },
    requiredSections: [
      { n: 1, name: 'Designación de la Sala o Sección', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del auto del magistrado ponente que se suplica', mandatory: true, basis: 'art. 246' },
      { n: 3, name: 'Sustentación', mandatory: true, basis: null },
      { n: 4, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr005.html'
  },
  {
    id: 'administrativo/recurso-extraordinario-de-revision',
    exactName: 'Recurso extraordinario de revisión',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 248 (procedencia)',
    competentAuthority: 'Consejo de Estado o Tribunal Administrativo, según la corporación que dictó la sentencia ejecutoriada',
    term: { status: 'VERIFICADO', description: 'El recurso podrá interponerse dentro del año siguiente a la ejecutoria de la respectiva sentencia (art. 251, inciso 1). En las causales de los numerales 3 y 4 del art. 250, dentro del año siguiente a la ejecutoria de la sentencia penal que así lo declare; en la causal del numeral 7, dentro del año siguiente a la ocurrencia de los motivos que dan lugar al recurso; y en los casos previstos en el art. 20 de la Ley 797 de 2003, dentro de los cinco (5) años siguientes a la ejecutoria de la providencia judicial o, cuando ella no se requiera, dentro del mismo término contado a partir del perfeccionamiento del acuerdo transaccional o conciliatorio (art. 251).' },
    requiredSections: [
      { n: 1, name: 'Designación de la corporación competente', mandatory: false, basis: null },
      { n: 2, name: 'Identificación de la sentencia ejecutoriada objeto del recurso', mandatory: true, basis: 'art. 248 — procede contra sentencias ejecutoriadas dictadas por las secciones y subsecciones' },
      { n: 3, name: 'Causal de revisión invocada y su sustentación', mandatory: true, basis: null },
      { n: 4, name: 'Pruebas', mandatory: false, basis: null },
      { n: 5, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr005.html'
  },
  {
    id: 'administrativo/recurso-extraordinario-de-unificacion-de-jurisprudencia',
    exactName: 'Recurso extraordinario de unificación de jurisprudencia',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, arts. 256 (fines) y 257 (procedencia)',
    competentAuthority: 'Consejo de Estado',
    term: { status: 'VERIFICADO', description: 'El recurso deberá interponerse y sustentarse por escrito ante quien expidió la providencia, a más tardar dentro de los diez (10) días siguientes a su ejecutoria (art. 261, modificado por el art. 72 de la Ley 2080 de 2021). Si se interpuso y sustentó en término, el ponente lo concederá dentro de los cinco (5) días siguientes; de lo contrario lo rechazará o lo declarará desierto.' },
    requiredSections: [
      { n: 1, name: 'Designación del Consejo de Estado', mandatory: false, basis: null },
      { n: 2, name: 'Identificación de la sentencia dictada en única o en segunda instancia objeto del recurso', mandatory: true, basis: 'art. 257' },
      { n: 3, name: 'Identificación de la sentencia de unificación jurisprudencial contrariada', mandatory: true, basis: 'art. 256 — el fin del recurso es asegurar la unidad de la interpretación del derecho' },
      { n: 4, name: 'Sustentación', mandatory: true, basis: null },
      { n: 5, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr006.html'
  },
  {
    id: 'administrativo/acto-administrativo-que-resuelve-el-recurso-de-reposicion-o-de-apelacion-en-via-gubernativa',
    exactName: 'Acto administrativo que resuelve el recurso de reposición o de apelación en vía gubernativa',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 74 (recursos); art. 86 (silencio administrativo en recursos); art. 52, inciso 1, parte final (término para decidir recursos en actuaciones sancionatorias)',
    competentAuthority: 'La autoridad que expidió la decisión (reposición) o su inmediato superior administrativo o funcional (apelación)',
    term: { status: 'VERIFICADO', description: 'Regla general: transcurrido un plazo de dos (2) meses sin que se haya notificado decisión expresa sobre los recursos, se entenderá que la decisión es negativa, salvo lo dispuesto en el artículo 52 (art. 86). Regla especial sancionatoria: los actos que resuelven los recursos deben decidirse, so pena de pérdida de competencia, en un término de un (1) año contado a partir de su debida y oportuna interposición; si no se deciden en ese término se entenderán fallados a favor del recurrente, sin perjuicio de la responsabilidad patrimonial y disciplinaria del funcionario (art. 52).' },
    requiredSections: [
      { n: 1, name: 'Encabezado y numeración del acto (resolución)', mandatory: false, basis: null },
      { n: 2, name: 'Competencia de la autoridad que resuelve', mandatory: true, basis: 'art. 74 nums. 1 y 2' },
      { n: 3, name: 'Antecedentes y actuación surtida', mandatory: false, basis: null },
      { n: 4, name: 'Verificación de la oportunidad y requisitos del recurso', mandatory: true, basis: 'arts. 76 y 77' },
      { n: 5, name: 'Consideraciones: respuesta a los motivos concretos de inconformidad', mandatory: true, basis: 'art. 77 num. 2' },
      { n: 6, name: 'Decisión (confirmar, aclarar, modificar, adicionar o revocar)', mandatory: true, basis: 'art. 74 nums. 1 y 2' },
      { n: 7, name: 'Recursos que proceden y notificación', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/acto-administrativo-sancionatorio',
    exactName: 'Acto administrativo sancionatorio',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 52 (caducidad de la facultad sancionatoria)',
    competentAuthority: 'La autoridad administrativa titular de la potestad sancionatoria',
    term: { status: 'VERIFICADO', description: 'La facultad de imponer sanciones caduca a los tres (3) años de ocurrido el hecho, la conducta u omisión que pudiere ocasionarlas, término dentro del cual el acto administrativo que impone la sanción debe haber sido EXPEDIDO Y NOTIFICADO (art. 52, inciso 1), salvo lo dispuesto en leyes especiales. Si se trata de hecho o conducta continuada, el término se cuenta desde el día siguiente a aquel en que cesó la infracción y/o la ejecución (art. 52, inciso 2). La sanción decretada por acto administrativo PRESCRIBE al cabo de cinco (5) años contados a partir de la fecha de la ejecutoria (art. 52, inciso 3).' },
    requiredSections: [
      { n: 1, name: 'Encabezado y numeración del acto', mandatory: false, basis: null },
      { n: 2, name: 'Competencia', mandatory: true, basis: 'art. 52 («la facultad que tienen las autoridades para imponer sanciones»)' },
      { n: 3, name: 'Antecedentes y actuación administrativa surtida', mandatory: false, basis: null },
      { n: 4, name: 'Análisis de la caducidad de la facultad sancionatoria', mandatory: true, basis: 'art. 52 — el acto debe expedirse y notificarse dentro de los 3 años' },
      { n: 5, name: 'Hechos, cargos y pruebas', mandatory: false, basis: null },
      { n: 6, name: 'Consideraciones y calificación de la conducta', mandatory: true, basis: null },
      { n: 7, name: 'Decisión sancionatoria y dosificación', mandatory: true, basis: null },
      { n: 8, name: 'Recursos que proceden y notificación', mandatory: true, basis: 'art. 74 y art. 161 num. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/acto-administrativo-ficto-o-presunto-por-silencio-administrativo-negativo',
    exactName: 'Acto administrativo ficto o presunto por silencio administrativo negativo',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 83 (silencio negativo); art. 161 num. 2 (el silencio negativo frente a la primera petición permite demandar directamente el acto presunto); art. 164 num. 1 lit. d)',
    competentAuthority: 'La autoridad ante la cual se presentó la petición',
    term: { status: 'VERIFICADO', description: 'Transcurridos tres (3) meses contados a partir de la presentación de una petición sin que se haya notificado decisión que la resuelva, se entenderá que esta es negativa (art. 83, encabezado)' },
    requiredSections: [
      { n: 1, name: 'No aplica: se trata de un acto ficto, sin texto escrito', mandatory: false, basis: 'art. 83' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/acto-administrativo-ficto-positivo-por-silencio-administrativo',
    exactName: 'Acto administrativo ficto positivo por silencio administrativo',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 84 (silencio positivo); art. 85 (protocolización para invocarlo); art. 87 num. 5 (firmeza desde el día siguiente al de la protocolización); art. 97 (la revocación del acto ficto de carácter particular exige el consentimiento previo, expreso y escrito del titular)',
    competentAuthority: 'La autoridad ante la cual se presentó la petición',
    term: { status: 'VERIFICADO', description: 'HUECO CERRADO: la norma NO fija la duración del silencio positivo. El art. 84 del CPACA solo lo admite «en los casos expresamente previstos en disposiciones legales especiales», de modo que la duración la fija cada disposición especial y no puede catalogarse un valor único. Lo que el artículo SÍ fija, y la ficha callaba, es el punto de partida del cómputo: «Los términos para que se entienda producida la decisión positiva presunta comienzan a contarse a partir del día en que se presentó la petición o recurso» (art. 84 inc. 2). RELOJ DEL INTERESADO, que la ficha tampoco traía: producido el silencio, el beneficio no se consolida solo — el art. 85 exige que quien se halle en esas condiciones «protocolizará la constancia o copia de que trata el artículo 15, junto con una declaración jurada de no haberle sido notificada la decisión dentro del término previsto», y solo entonces «la escritura y sus copias auténticas producirán todos los efectos legales de la decisión favorable que se pidió, y es deber de todas las personas y autoridades reconocerla así»; el acto queda en firme «desde el día siguiente al de la protocolización a que alude el artículo 85 para el silencio administrativo positivo» (art. 87 num. 5). RELOJ DE LA AUTORIDAD: el acto positivo presunto es revocable directamente, pero por ser de carácter particular y concreto le ampara el art. 97, que impide revocar un acto «bien sea expreso o ficto» sin el consentimiento previo, expreso y escrito del titular, debiendo la Administración demandarlo si el titular lo niega.' },
    requiredSections: [
      { n: 1, name: 'No aplica: se trata de un acto ficto, sin texto escrito', mandatory: false, basis: 'art. 84' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=41249'
  },
  {
    id: 'administrativo/decision-de-la-autoridad-sobre-la-peticion-de-extension-de-la-jurisprudencia',
    exactName: 'Decisión de la autoridad sobre la petición de extensión de la jurisprudencia',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 102',
    competentAuthority: 'La autoridad legalmente competente para reconocer el derecho',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días siguientes a la recepción de la petición (art. 102)' },
    requiredSections: [
      { n: 1, name: 'Encabezado y numeración del acto', mandatory: false, basis: null },
      { n: 2, name: 'Antecedentes: petición de extensión y sentencia de unificación invocada', mandatory: false, basis: 'art. 102 num. 3' },
      { n: 3, name: 'Consideraciones con fundamento en las disposiciones constitucionales, legales y reglamentarias aplicables, teniendo en cuenta la interpretación hecha en la sentencia de unificación invocada', mandatory: true, basis: 'art. 102, inciso 7' },
      { n: 4, name: 'Verificación del cumplimiento de todos los presupuestos de procedencia', mandatory: true, basis: 'art. 102, inciso 7' },
      { n: 5, name: 'Si niega: razones por las cuales la decisión no puede adoptarse sin período probatorio, enunciando los medios de prueba y sustentando de forma clara lo indispensable que resultan', mandatory: true, basis: 'art. 102, motivo 1 de negativa' },
      { n: 6, name: 'Si niega: razones por las cuales la situación del solicitante es distinta a la resuelta en la sentencia de unificación invocada', mandatory: true, basis: 'art. 102, motivo 2 de negativa' },
      { n: 7, name: 'Decisión y notificación', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/acto-administrativo-de-revocacion-directa',
    exactName: 'Acto administrativo de revocación directa',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, arts. 93, 94 y 95',
    competentAuthority: 'Las mismas autoridades que hayan expedido el acto administrativo o sus inmediatos superiores (art. 93)',
    term: { status: 'VERIFICADO', description: 'Las solicitudes de revocación directa deberán ser resueltas por la autoridad competente dentro de los dos (2) meses siguientes a la presentación de la solicitud (art. 95, inciso 2). La revocación puede cumplirse aun cuando se haya acudido ante la Jurisdicción de lo Contencioso Administrativo, siempre que no se haya notificado auto admisorio de la demanda (art. 95, inciso 1).' },
    requiredSections: [
      { n: 1, name: 'Encabezado y numeración del acto', mandatory: false, basis: null },
      { n: 2, name: 'Competencia (autoridad que expidió el acto o su inmediato superior)', mandatory: true, basis: 'art. 93' },
      { n: 3, name: 'Antecedentes y solicitud', mandatory: false, basis: null },
      { n: 4, name: 'Verificación de la oportunidad (que no se haya notificado auto admisorio de la demanda)', mandatory: true, basis: 'art. 95, inciso 1' },
      { n: 5, name: 'Análisis de la causal de revocación', mandatory: true, basis: 'art. 93' },
      { n: 6, name: 'Análisis de improcedencia cuando corresponda', mandatory: false, basis: 'art. 94' },
      { n: 7, name: 'Decisión y notificación', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/control-inmediato-de-legalidad',
    exactName: 'Control inmediato de legalidad',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 136',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo en el lugar donde se expidan las medidas, si se trata de entidades territoriales, o el Consejo de Estado si emanan de autoridades nacionales, de acuerdo con las reglas de competencia establecidas en el Código (art. 136)',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: el control es oficioso y no se ejerce mediante demanda sujeta a plazo. Las autoridades competentes que expidan las medidas deben enviar los actos administrativos a la autoridad judicial indicada dentro de las cuarenta y ocho (48) horas siguientes a su expedición; si no se efectuare el envío, la autoridad judicial competente aprehenderá de oficio su conocimiento (art. 136, inciso 2). Trámite (art. 185): aviso en secretaría por diez (10) días para la intervención ciudadana; las pruebas que se decreten se practican en el término de diez (10) días; el Ministerio Público rinde concepto dentro de los diez (10) días siguientes; el ponente registra el proyecto de fallo dentro de los quince (15) días siguientes a la entrada al despacho y la Sala Plena adopta el fallo dentro de los veinte (20) días siguientes.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida de carácter general objeto de control', mandatory: true, basis: 'art. 136' },
      { n: 2, name: 'Verificación de que fue dictada en ejercicio de la función administrativa y como desarrollo de los decretos legislativos durante los Estados de Excepción', mandatory: true, basis: 'art. 136 — es el presupuesto del control' },
      { n: 3, name: 'Competencia (territorial o nacional)', mandatory: true, basis: 'art. 136' },
      { n: 4, name: 'Consideraciones y confrontación con el decreto legislativo y el ordenamiento superior', mandatory: true, basis: null },
      { n: 5, name: 'Decisión', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr003.html'
  },
  {
    id: 'administrativo/auto-que-fija-fecha-para-la-audiencia-inicial-y-audiencia-inicial',
    exactName: 'Auto que fija fecha para la audiencia inicial y audiencia inicial',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 180',
    competentAuthority: 'Juez o Magistrado Ponente',
    term: { status: 'VERIFICADO', description: 'Se convoca vencido el término de traslado de la demanda o de la de reconvención, según el caso (art. 180, encabezado). El número de días para su fijación NO fue verificado.' },
    requiredSections: [
      { n: 1, name: 'Fijación de fecha y hora de la audiencia', mandatory: true, basis: 'art. 180' },
      { n: 2, name: 'Saneamiento del proceso', mandatory: false, basis: null },
      { n: 3, name: 'Decisión de excepciones previas', mandatory: false, basis: null },
      { n: 4, name: 'Fijación del litigio', mandatory: false, basis: null },
      { n: 5, name: 'Posibilidad de conciliación', mandatory: false, basis: null },
      { n: 6, name: 'Decreto de pruebas', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/audiencia-de-pruebas',
    exactName: 'Audiencia de pruebas',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 181',
    competentAuthority: 'Juez o Magistrado Ponente, quien dirige la audiencia',
    term: { status: 'VERIFICADO', description: 'En la fecha y hora señaladas para el efecto (art. 181, encabezado)' },
    requiredSections: [
      { n: 1, name: 'Instalación en la fecha y hora señaladas, con la dirección del Juez o Magistrado Ponente', mandatory: true, basis: 'art. 181, encabezado' },
      { n: 2, name: 'Práctica de las pruebas decretadas', mandatory: true, basis: 'art. 181' },
      { n: 3, name: 'Acta y decisiones', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/audiencia-de-alegaciones-y-juzgamiento',
    exactName: 'Audiencia de alegaciones y juzgamiento',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 182',
    competentAuthority: 'Juez o Magistrado Ponente / Sala',
    term: { status: 'VERIFICADO', description: 'En la fecha y hora señaladas se oyen los alegatos hasta por veinte (20) minutos a cada interviniente, en el orden previsto en el art. 182 num. 1. Inmediatamente el juzgador dictará sentencia oral; de no ser posible, informará el sentido de la sentencia en forma oral y la consignará por escrito dentro de los diez (10) días siguientes (art. 182 num. 2, modificado por el art. 41 de la Ley 2080 de 2021). Cuando no fuere posible indicar el sentido de la sentencia, se proferirá por escrito dentro de los treinta (30) días siguientes, dejando constancia en la audiencia del motivo (art. 182 num. 3).' },
    requiredSections: [
      { n: 1, name: 'Alegatos de conclusión de las partes', mandatory: true, basis: 'art. 182' },
      { n: 2, name: 'Concepto del Ministerio Público', mandatory: false, basis: null },
      { n: 3, name: 'Sentencia', mandatory: true, basis: 'art. 182' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr004.html'
  },
  {
    id: 'administrativo/auto-inadmisorio-de-la-solicitud-de-extension-de-jurisprudencia',
    exactName: 'Auto inadmisorio de la solicitud de extensión de jurisprudencia',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 269, inciso 3',
    competentAuthority: 'Consejo de Estado — Magistrado Ponente',
    term: { status: 'VERIFICADO', description: 'Se inadmite para que se corrija dentro del término de los diez (10) días siguientes. En caso de no hacerlo, se rechazará la solicitud de extensión (art. 269, inciso 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la solicitud de extensión', mandatory: false, basis: 'art. 269' },
      { n: 2, name: 'Señalamiento concreto de los requisitos incumplidos', mandatory: true, basis: 'art. 269, inciso 3' },
      { n: 3, name: 'Concesión del término de diez (10) días para corregir y advertencia de rechazo', mandatory: true, basis: 'art. 269, inciso 3' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/auto-de-rechazo-de-plano-de-la-solicitud-de-extension-de-jurisprudencia',
    exactName: 'Auto de rechazo de plano de la solicitud de extensión de jurisprudencia',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 269',
    competentAuthority: 'Consejo de Estado — Magistrado Ponente',
    term: { status: 'NO_CADUCA', description: 'El art. 269 no sujeta a plazo la expedición del auto de rechazo de plano: no opera caducidad ni término legal para proferirlo. El único término expreso del trámite previo es el de la inadmisión: diez (10) días para corregir el escrito, so pena de rechazo de la solicitud (art. 269, inciso 3). Las causales de rechazo de plano son SEIS en el texto vigente (modificado por el art. 77 de la Ley 2080 de 2021): (1) haber acudido ya a la Jurisdicción de lo Contencioso Administrativo para obtener el mismo reconocimiento; (2) presentación extemporánea; (3) pedir la extensión de una sentencia que no sea de unificación; (4) que la sentencia de unificación invocada no sea de aquellas que reconocen un derecho; (5) haber operado la caducidad del medio de control procedente o la prescripción total del derecho reclamado; (6) que no proceda la extensión por no existir o no estar acreditada la similitud entre la situación del peticionario y la sentencia de unificación invocada.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la solicitud de extensión', mandatory: false, basis: 'art. 269' },
      { n: 2, name: 'Causal de rechazo de plano invocada', mandatory: true, basis: 'art. 269: (1) el peticionario ya acudió a la Jurisdicción de lo Contencioso Administrativo para obtener el reconocimiento del derecho pretendido; (2) se presentó extemporáneamente; (3) se pide extender una sentencia que no es de unificación; (4) la sentencia de unificación invocada no es de aquellas que reconocen un derecho' },
      { n: 3, name: 'Decisión de rechazo', mandatory: true, basis: 'art. 269' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr006.html'
  },
  {
    id: 'administrativo/auto-que-decreta-levanta-modifica-o-revoca-la-medida-cautelar',
    exactName: 'Auto que decreta, levanta, modifica o revoca la medida cautelar',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, arts. 229, 230, 231, 234 y 235',
    competentAuthority: 'Juez o Magistrado Ponente',
    term: { status: 'VERIFICADO', description: 'El auto que decida las medidas cautelares deberá proferirse dentro de los diez (10) días siguientes al vencimiento del término de cinco (5) días de que dispone el demandado para pronunciarse sobre la solicitud, y en ese mismo auto el Juez o Magistrado Ponente deberá fijar la caución; la medida sólo podrá hacerse efectiva a partir de la ejecutoria del auto que acepte la caución prestada (art. 233, incisos 2 y 4). Si la medida se solicita en audiencia, se corre traslado en ella y puede ser decretada en la misma audiencia (art. 233, inciso 5). El levantamiento, la modificación o la revocatoria pueden decidirse en cualquier estado del proceso, de oficio o a petición de parte, sin término preclusivo (art. 235, incisos 1 y 2); la parte a favor de quien se otorgó la medida debe informar todo cambio sustancial dentro de los tres (3) días siguientes a su conocimiento (art. 235, inciso 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la solicitud y del proceso', mandatory: false, basis: null },
      { n: 2, name: 'Verificación de los requisitos del art. 231', mandatory: true, basis: 'art. 231' },
      { n: 3, name: 'Para la suspensión provisional: confrontación del acto demandado con las normas superiores invocadas como violadas o estudio de las pruebas allegadas con la solicitud', mandatory: true, basis: 'art. 231, inciso 1' },
      { n: 4, name: 'Juicio de ponderación de intereses (en los demás casos)', mandatory: true, basis: 'art. 231 num. 3' },
      { n: 5, name: 'Decisión y contenido de la medida (preventiva, conservativa, anticipativa o de suspensión)', mandatory: true, basis: 'art. 230' },
      { n: 6, name: 'Señalamiento de la caución', mandatory: true, basis: 'art. 234, inciso 2' },
      { n: 7, name: 'Recursos que proceden', mandatory: false, basis: 'art. 234, inciso 1' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr005.html'
  },
  {
    id: 'administrativo/sentencia-de-unificacion-jurisprudencial',
    exactName: 'Sentencia de unificación jurisprudencial',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 270',
    competentAuthority: 'Consejo de Estado',
    term: { status: 'NO_CADUCA', description: 'El art. 270 (modificado por el art. 78 de la Ley 2080 de 2021) se limita a definir qué providencias se tienen como sentencias de unificación jurisprudencial y no fija término alguno para proferirlas: no opera caducidad ni plazo propio. Rigen los términos generales de la audiencia de alegaciones y juzgamiento: sentencia oral inmediata o, de no ser posible, informe oral del sentido del fallo y consignación por escrito dentro de los diez (10) días siguientes; y, cuando no sea posible indicar el sentido del fallo, sentencia escrita dentro de los treinta (30) días siguientes (art. 182 nums. 2 y 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y de las partes', mandatory: false, basis: null },
      { n: 2, name: 'Antecedentes', mandatory: false, basis: null },
      { n: 3, name: 'Consideraciones y regla de unificación', mandatory: true, basis: 'art. 270' },
      { n: 4, name: 'Decisión', mandatory: true, basis: null }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr006.html'
  },
  {
    id: 'administrativo/peticion-de-interes-general',
    exactName: 'Petición de interés general',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Constitución Política, art. 23; Ley 1755 de 2015, arts. 13, 14 y 16 (sustitutivos de los arts. 13, 14 y 16 de la Ley 1437 de 2011)',
    competentAuthority: 'La autoridad a la que se dirige la petición (Ley 1755 de 2015, art. 16 num. 1)',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD, no del peticionario. El art. 13 reconoce el derecho a presentar peticiones respetuosas «por motivos de interés general o particular, y a obtener pronta resolución completa y de fondo sobre la misma»; no fija plazo alguno al peticionario para presentarla: puede presentarse en cualquier tiempo. El plazo corre contra la autoridad: art. 14, «Salvo norma legal especial y so pena de sanción disciplinaria, toda petición deberá resolverse dentro de los quince (15) días siguientes a su recepción». Excepcionalmente la autoridad puede ampliarlo (art. 14 par.), informando al interesado antes del vencimiento y sin que el nuevo plazo «podrá exceder del doble del inicialmente previsto». Si la autoridad no es competente, los términos «se contarán a partir del día siguiente a la recepción de la Petición por la autoridad competente» (art. 21). Ninguna norma de la Ley 1755 de 2015 fija término al peticionario para insistir ni para acudir a la acción de tutela.' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/peticion-de-interes-particular',
    exactName: 'Petición de interés particular',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Constitución Política, art. 23; Ley 1755 de 2015, arts. 13, 14 y 16',
    competentAuthority: 'La autoridad a la que se dirige la petición (Ley 1755 de 2015, art. 16 num. 1)',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD. El peticionario no tiene plazo: el art. 13 permite pedir «por motivos de interés general o particular» y precisa que mediante el derecho de petición «se podrá solicitar: el reconocimiento de un derecho, la intervención de una entidad o funcionario, la resolución de una situación jurídica, la prestación de un servicio». La autoridad debe resolver «dentro de los quince (15) días siguientes a su recepción» (art. 14 inc. 1), prorrogables excepcionalmente hasta el doble informando al interesado antes del vencimiento (art. 14 par.). ADVERTENCIA: el art. 14 abre con «Salvo norma legal especial», de modo que los trámites con norma propia —pensional, tributario, servicios públicos domiciliarios— pueden tener término distinto, que debe verificarse en su propia norma.' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' },
      { n: 7, name: 'Acreditación de la calidad o del interés particular invocado', mandatory: false, basis: null },
      { n: 8, name: 'Petición concreta de reconocimiento del derecho o de resolución de la situación jurídica', mandatory: true, basis: 'Ley 1755 de 2015, art. 13 inc. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/peticion-de-informacion',
    exactName: 'Petición de información',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, arts. 13, 14 num. 1, 16 y 24',
    competentAuthority: 'La autoridad que posee la información solicitada',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD: diez (10) días. Art. 14 num. 1: «Las peticiones de documentos y de información deberán resolverse dentro de los diez (10) días siguientes a su recepción. Si en ese lapso no se ha dado respuesta al peticionario, se entenderá, para todos los efectos legales, que la respectiva solicitud ha sido aceptada y, por consiguiente, la administración ya no podrá negar la entrega de dichos documentos al peticionario, y como consecuencia las copias se entregarán dentro de los tres (3) días siguientes». Ese silencio es POSITIVO. El plazo es prorrogable excepcionalmente hasta el doble, informando antes de su vencimiento (art. 14 par.). RELOJ DEL PETICIONARIO —distinto y preclusivo—: si la autoridad rechaza la petición invocando reserva legal, la insistencia «deberá interponerse por escrito y sustentado en la diligencia de notificación, o dentro de los diez (10) días siguientes a ella» (art. 26 par.).' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' },
      { n: 7, name: 'Identificación precisa de la información solicitada', mandatory: true, basis: 'Ley 1755 de 2015, art. 13 inc. 2' },
      { n: 8, name: 'Manifestación de la calidad de titular, apoderado o persona autorizada con facultad expresa, cuando la información esté sometida a reserva por los numerales 3, 5, 6, 7 u 8 del art. 24', mandatory: false, basis: 'Ley 1755 de 2015, art. 24 par.; C-951 de 2014, numeral octavo' },
      { n: 9, name: 'Indicación del medio idóneo por el cual se desea recibir la respuesta', mandatory: false, basis: 'Ley 1755 de 2015, art. 15' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/peticion-de-copias-o-de-examen-de-documentos',
    exactName: 'Petición de copias o de examen de documentos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, arts. 13, 14 num. 1, 16, 24 y 29',
    competentAuthority: 'La autoridad en cuyos archivos reposan los documentos',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD: diez (10) días para resolver y tres (3) días para entregar las copias cuando opera el silencio positivo. Art. 14 num. 1: «Las peticiones de documentos y de información deberán resolverse dentro de los diez (10) días siguientes a su recepción [...] y como consecuencia las copias se entregarán dentro de los tres (3) días siguientes». El art. 13 inc. 2 incluye expresamente entre las modalidades «examinar y requerir copias de documentos». Costos, art. 29: «En ningún caso el precio de las copias podrá exceder el valor de la reproducción. Los costos de la expedición de las copias correrán por cuenta del interesado en obtenerlas», y «El valor de la reproducción no podrá ser superior al valor comercial de referencia en el mercado». RELOJ DEL PETICIONARIO: diez (10) días siguientes a la notificación para insistir si se niega por reserva (art. 26 par.).' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' },
      { n: 7, name: 'Identificación de los documentos cuya copia o examen se solicita', mandatory: true, basis: 'Ley 1755 de 2015, art. 13 inc. 2' },
      { n: 8, name: 'Manifestación sobre la asunción del costo de la reproducción', mandatory: false, basis: 'Ley 1755 de 2015, art. 29' },
      { n: 9, name: 'Acreditación de la titularidad o autorización expresa cuando el documento esté sometido a reserva', mandatory: false, basis: 'Ley 1755 de 2015, art. 24 par.' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/peticion-de-consulta',
    exactName: 'Petición de consulta',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, arts. 13, 14 num. 2, 16 y 28',
    competentAuthority: 'La autoridad competente en la materia objeto de consulta',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD: treinta (30) días. Art. 14 num. 2: «Las peticiones mediante las cuales se eleva una consulta a las autoridades en relación con las materias a su cargo deberán resolverse dentro de los treinta (30) días siguientes a su recepción». Prorrogable excepcionalmente hasta el doble, informando antes del vencimiento (art. 14 par.). ADVERTENCIA sustantiva: el concepto que responde la consulta NO obliga. Art. 28: «Salvo disposición legal en contrario, los conceptos emitidos por las autoridades como respuestas a peticiones realizadas en ejercicio del derecho a formular consultas no serán de obligatorio cumplimiento o ejecución». La consulta no suspende ni interrumpe los términos de otras actuaciones.' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' },
      { n: 7, name: 'Formulación concreta de la consulta, sobre materia a cargo de la autoridad consultada', mandatory: true, basis: 'Ley 1755 de 2015, art. 14 num. 2' },
      { n: 8, name: 'Supuesto de hecho sobre el que se consulta', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 9, name: 'Constancia de que el concepto no será de obligatorio cumplimiento o ejecución', mandatory: false, basis: 'Ley 1755 de 2015, art. 28' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/peticion-ante-organizaciones-e-instituciones-privadas-y-ante-particulares',
    exactName: 'Petición ante organizaciones e instituciones privadas y ante particulares',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, arts. 32 y 33 (Capítulo III); Sentencia C-951 de 2014',
    competentAuthority: 'Organizaciones privadas con o sin personería jurídica —sociedades, corporaciones, fundaciones, asociaciones, organizaciones religiosas, cooperativas, instituciones financieras o clubes— (art. 32); Cajas de Compensación Familiar, instituciones del Sistema de Seguridad Social Integral, entidades del sistema financiero y bursátil y empresas que prestan servicios públicos y servicios públicos domiciliarios regidas por el derecho privado (art. 33); y personas naturales frente a las cuales el solicitante se encuentre en situación de indefensión o subordinación, o que ejerzan posición dominante (art. 32 par. 1)',
    term: { status: 'VERIFICADO', description: 'RELOJ DEL DESTINATARIO PRIVADO, remitido a las reglas del Capítulo I. Art. 32 inc. 2: «Salvo norma legal especial, el trámite y resolución de estas peticiones estarán sometidos a los principios y reglas establecidos en el Capítulo I de este título» —esto es, los términos del art. 14: quince (15) días regla general, diez (10) días documentos e información, treinta (30) días consultas—. La Corte Constitucional declaró EXEQUIBLE esa expresión «bajo el entendido de que al derecho de petición ante organizaciones privadas se aplicarán, en lo pertinente, aquellas disposiciones del Capítulo I que sean compatibles con la naturaleza de las funciones que ejercen los particulares» (C-951 de 2014, numeral undécimo). El art. 33 extiende las mismas disposiciones «en lo pertinente» y «sin perjuicio de lo dispuesto en leyes especiales» —en servicios públicos domiciliarios rige la ley especial, que no se verificó aquí—. El art. 32 par. 3 prohíbe a toda entidad privada negarse a recibir y radicar peticiones respetuosas. No hay término a cargo del peticionario.' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' },
      { n: 7, name: 'Identificación de la organización privada, institución o particular destinatario', mandatory: true, basis: 'Ley 1755 de 2015, arts. 32 y 33' },
      { n: 8, name: 'Derecho fundamental cuya garantía se persigue', mandatory: true, basis: 'Ley 1755 de 2015, art. 32 inc. 1' },
      { n: 9, name: 'Cuando se dirija a persona natural, acreditación de la situación de indefensión, subordinación o posición dominante', mandatory: false, basis: 'Ley 1755 de 2015, art. 32 par. 1' },
      { n: 10, name: 'Cuando se dirija a una entidad del art. 33, acreditación de la calidad de usuario', mandatory: false, basis: 'Ley 1755 de 2015, art. 33' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/solicitud-de-atencion-prioritaria-de-la-peticion',
    exactName: 'Solicitud de atención prioritaria de la petición',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, art. 20 (atención prioritaria); art. 14 y su parágrafo (términos de fondo y prórroga que no puede exceder del doble del inicialmente previsto); Ley 1437 de 2011, art. 83 (silencio negativo a los tres meses)',
    competentAuthority: 'La autoridad ante la que cursa la petición',
    term: { status: 'VERIFICADO', description: 'HUECO CERRADO: el art. 20 de la Ley 1755 de 2015 NO fija término alguno — ni al peticionario para pedir la prioridad, ni a la autoridad para decidir sobre ella. «De inmediato» (medidas de urgencia ante peligro inminente para la vida o la integridad) y «preferencialmente» (peticiones de periodistas) no son plazos computables. El plazo de fondo sigue siendo el del art. 14 según la modalidad de la petición, y es RELOJ DE LA AUTORIDAD: «Salvo norma legal especial y so pena de sanción disciplinaria, toda petición deberá resolverse dentro de los quince (15) días siguientes a su recepción»; las de documentos e información dentro de los diez (10) días, con silencio positivo expreso — «Si en ese lapso no se ha dado respuesta al peticionario, se entenderá, para todos los efectos legales, que la respectiva solicitud ha sido aceptada y, por consiguiente, la administración ya no podrá negar la entrega de dichos documentos», entregándose las copias dentro de los tres (3) días siguientes (art. 14 num. 1); las consultas dentro de los treinta (30) días (art. 14 num. 2). El parágrafo del art. 14 permite a la autoridad, informando antes del vencimiento, señalar un plazo razonable «que no podrá exceder del doble del inicialmente previsto». RELOJ DEL PETICIONARIO, que la ficha no publicaba: vencido el término sin respuesta, a los tres (3) meses de presentada la petición opera el silencio negativo del art. 83 del CPACA y desde ahí se abre la vía contenciosa. Artículo 20 declarado EXEQUIBLE, sin condicionamiento (Sentencia C-951 de 2014).' },
    requiredSections: [
      { n: 1, name: 'La designación de la autoridad a la que se dirige', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Los nombres y apellidos completos del solicitante y de su representante y/o apoderado, si es el caso, con indicación de su documento de identidad y de la dirección donde recibirá correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'El objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 3' },
      { n: 4, name: 'Las razones en las que fundamenta su petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 5, name: 'La relación de los documentos que desee presentar para iniciar el trámite', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 6, name: 'La firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' },
      { n: 7, name: 'Identificación del derecho fundamental cuyo reconocimiento se pide', mandatory: true, basis: 'Ley 1755 de 2015, art. 20 inc. 1' },
      { n: 8, name: 'Prueba sumaria de la titularidad del derecho', mandatory: true, basis: 'Ley 1755 de 2015, art. 20 inc. 1' },
      { n: 9, name: 'Prueba sumaria del riesgo del perjuicio irremediable invocado', mandatory: true, basis: 'Ley 1755 de 2015, art. 20 inc. 1' },
      { n: 10, name: 'Invocación del peligro inminente para la vida o la integridad por razones de salud o de seguridad personal, cuando exista', mandatory: false, basis: 'Ley 1755 de 2015, art. 20 inc. 2' },
      { n: 11, name: 'Acreditación de la calidad de periodista, cuando se invoque el trámite preferencial', mandatory: false, basis: 'Ley 1755 de 2015, art. 20 inc. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/desistimiento-expreso-de-la-peticion',
    exactName: 'Desistimiento expreso de la petición',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, art. 18',
    competentAuthority: 'La autoridad ante la que cursa la petición',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO PRECLUSIVO PARA EL PETICIONARIO. Art. 18: «Los interesados podrán desistir en cualquier tiempo de sus peticiones, sin perjuicio de que la respectiva solicitud pueda ser nuevamente presentada con el lleno de los requisitos legales, pero las autoridades podrán continuar de oficio la actuación si la consideran necesaria por razones de interés público; en tal caso expedirán resolución motivada». Es decir: puede desistirse en cualquier tiempo mientras la actuación esté en curso; el desistimiento no extingue el derecho a volver a pedir; y no vincula necesariamente a la autoridad, que puede continuar de oficio mediante resolución motivada. Artículo declarado EXEQUIBLE (C-951 de 2014, numeral tercero de la parte resolutiva).' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad ante la que cursa la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Identificación del peticionario y de su apoderado, con documento de identidad y dirección de correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'Identificación de la petición que se desiste, con su número y fecha de radicación', mandatory: true, basis: 'Ley 1755 de 2015, art. 18' },
      { n: 4, name: 'Manifestación expresa e inequívoca de desistir', mandatory: true, basis: 'Ley 1755 de 2015, art. 18' },
      { n: 5, name: 'Reserva del derecho a presentar nuevamente la solicitud con el lleno de los requisitos legales', mandatory: false, basis: 'Ley 1755 de 2015, art. 18' },
      { n: 6, name: 'Firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/respuesta-al-requerimiento-por-peticion-incompleta-y-solicitud-de-prorroga',
    exactName: 'Respuesta al requerimiento por petición incompleta y solicitud de prórroga',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, art. 17',
    competentAuthority: 'La autoridad que formuló el requerimiento',
    term: { status: 'VERIFICADO', description: 'RELOJ DEL PETICIONARIO, preclusivo —este es el plazo del cliente—. Art. 17: la autoridad «requerirá al peticionario dentro de los diez (10) días siguientes a la fecha de radicación para que la complete en el término máximo de un (1) mes». El peticionario dispone de ese mes. «Se entenderá que el peticionario ha desistido de su solicitud o de la actuación cuando no satisfaga el requerimiento, salvo que antes de vencer el plazo concedido solicite prórroga hasta por un término igual» —la prórroga debe pedirse ANTES del vencimiento y es hasta por un (1) mes más—. «Vencidos los términos establecidos en este artículo, sin que el peticionario haya cumplido el requerimiento, la autoridad decretará el desistimiento y el archivo del expediente, mediante acto administrativo motivado, que se notificará personalmente, contra el cual únicamente procede recurso de reposición». RELOJ DE LA AUTORIDAD: los diez (10) días para requerir, y la reactivación del término para resolver «a partir del día siguiente en que el interesado aporte los documentos o informes requeridos».' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad requirente', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Identificación del peticionario, con documento de identidad y dirección de correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'Identificación del requerimiento, de su fecha de recibo y de la petición radicada', mandatory: true, basis: 'Ley 1755 de 2015, art. 17' },
      { n: 4, name: 'Aporte de los documentos o informes requeridos, o solicitud de prórroga presentada antes de vencer el plazo concedido', mandatory: true, basis: 'Ley 1755 de 2015, art. 17' },
      { n: 5, name: 'Verificación de que la prórroga solicitada no excede un término igual al concedido', mandatory: true, basis: 'Ley 1755 de 2015, art. 17' },
      { n: 6, name: 'Firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/correccion-o-aclaracion-de-peticion-oscura',
    exactName: 'Corrección o aclaración de petición oscura',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, art. 19',
    competentAuthority: 'La autoridad que devolvió la petición',
    term: { status: 'VERIFICADO', description: 'RELOJ DEL PETICIONARIO: diez (10) días. Art. 19: «Toda petición debe ser respetuosa so pena de rechazo. Solo cuando no se comprenda la finalidad u objeto de la petición esta se devolverá al interesado para que la corrija o aclare dentro de los diez (10) días siguientes. En caso de no corregirse o aclararse, se archivará la petición. En ningún caso se devolverán peticiones que se consideren inadecuadas o incompletas». La sanción por dejar vencer el plazo es el archivo. La devolución solo procede por oscuridad: lo incompleto se rige por el art. 17, con término de un (1) mes.' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad que devolvió la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Identificación del peticionario, con documento de identidad y dirección de correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'Identificación de la petición devuelta y de la fecha de la devolución', mandatory: true, basis: 'Ley 1755 de 2015, art. 19' },
      { n: 4, name: 'Aclaración de la finalidad u objeto de la petición', mandatory: true, basis: 'Ley 1755 de 2015, art. 19' },
      { n: 5, name: 'Razones en las que se fundamenta la petición aclarada', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 4' },
      { n: 6, name: 'Firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/recurso-de-insistencia-por-reserva-de-la-informacion-o-de-los-documentos',
    exactName: 'Recurso de insistencia por reserva de la información o de los documentos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1755 de 2015, arts. 25 y 26; Sentencia C-951 de 2014',
    competentAuthority: 'Se interpone ante la autoridad que invoca la reserva; decide en única instancia el Tribunal Administrativo con jurisdicción en el lugar donde se encuentren los documentos —autoridades nacionales, departamentales o del Distrito Capital de Bogotá— o el juez administrativo —autoridades distritales y municipales—; en los municipios en los que no exista juez administrativo, cualquier juez del lugar (C-951 de 2014, numeral noveno)',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES DISTINTOS. (1) DEL PETICIONARIO, preclusivo: art. 26 par., «El recurso de insistencia deberá interponerse por escrito y sustentado en la diligencia de notificación, o dentro de los diez (10) días siguientes a ella». (2) DEL JUEZ: enviada la documentación, el tribunal o el juez administrativo «decidirá dentro de los diez (10) días siguientes», término que se interrumpe cuando pida copias o información adicional, y cuando la autoridad solicite a la sección del Consejo de Estado avocar conocimiento —«Si al cabo de cinco (5) días la sección guarda silencio, o decide no avocar conocimiento, la actuación continuará ante el respectivo tribunal o juzgado administrativo»—. Nota: contra la decisión que rechaza por reserva legal «no procede recurso alguno, salvo lo previsto en el artículo siguiente» (art. 25), y «La restricción por reserva legal no se extenderá a otras piezas del respectivo expediente o actuación que no estén cubiertas por ella».' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad que invocó la reserva, ante la cual se presenta la insistencia', mandatory: true, basis: 'Ley 1755 de 2015, arts. 16 num. 1 y 26' },
      { n: 2, name: 'Identificación del peticionario y de su apoderado, con documento de identidad y dirección de correspondencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'Identificación de la petición de información o de documentos y del acto que la rechazó, con su fecha de notificación', mandatory: true, basis: 'Ley 1755 de 2015, art. 26 par.' },
      { n: 4, name: 'Objeto: que se decida si se niega o se acepta, total o parcialmente, la petición formulada', mandatory: true, basis: 'Ley 1755 de 2015, art. 26' },
      { n: 5, name: 'Sustentación escrita: razones por las que la reserva invocada no cubre la información o los documentos pedidos', mandatory: true, basis: 'Ley 1755 de 2015, arts. 16 num. 4 y 26 par.' },
      { n: 6, name: 'Señalamiento de las piezas del expediente no cubiertas por la reserva', mandatory: false, basis: 'Ley 1755 de 2015, art. 25 inc. 2' },
      { n: 7, name: 'Relación de los documentos que se aportan', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 5' },
      { n: 8, name: 'Firma del peticionario cuando fuere el caso', mandatory: false, basis: 'Ley 1755 de 2015, art. 16 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/respuesta-de-fondo-a-la-peticion',
    exactName: 'Respuesta de fondo a la petición',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, arts. 13, 14, 16 par. 1 y 31',
    competentAuthority: 'La autoridad destinataria de la petición',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD. Art. 14: «Salvo norma legal especial y so pena de sanción disciplinaria, toda petición deberá resolverse dentro de los quince (15) días siguientes a su recepción. Estará sometida a término especial la resolución de las siguientes peticiones: 1. Las peticiones de documentos y de información deberán resolverse dentro de los diez (10) días siguientes a su recepción [...] 2. Las peticiones mediante las cuales se eleva una consulta a las autoridades en relación con las materias a su cargo deberán resolverse dentro de los treinta (30) días siguientes a su recepción». La respuesta debe ser «pronta resolución completa y de fondo» (art. 13 inc. 1). El incumplimiento es falta disciplinaria: art. 31, «La falta de atención a las peticiones y a los términos para resolver, la contravención a las prohibiciones y el desconocimiento de los derechos de las personas de que trata esta Parte Primera del Código, constituirán falta para el servidor público y darán lugar a las sanciones correspondientes de acuerdo con el régimen disciplinario»; la Corte declaró INEXEQUIBLE la expresión «gravísima» que traía el proyecto (C-951 de 2014, numeral décimo).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la petición, de su fecha de radicación y del peticionario', mandatory: true, basis: 'Ley 1755 de 2015, art. 15' },
      { n: 2, name: 'Examen integral de la petición, sin estimarla incompleta por falta de requisitos o documentos que no se encuentren dentro del marco jurídico vigente, que no sean necesarios para resolverla o que se encuentren dentro de sus archivos', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 par. 1' },
      { n: 3, name: 'Pronunciamiento sobre todos los aspectos y pruebas planteados o presentados, más allá del contenido de los formularios', mandatory: true, basis: 'Ley 1755 de 2015, art. 15' },
      { n: 4, name: 'Resolución completa y de fondo sobre lo pedido', mandatory: true, basis: 'Ley 1755 de 2015, art. 13 inc. 1' },
      { n: 5, name: 'Fundamento jurídico de la decisión', mandatory: true, basis: 'Ley 1755 de 2015, art. 13 inc. 1' },
      { n: 6, name: 'Constancia de comunicación o notificación al peticionario en la dirección o medio señalado', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 7, name: 'Tratándose de petición anónima con justificación seria y creíble para mantener la reserva de la identidad, constancia de que se admitió a trámite y se resolvió de fondo', mandatory: false, basis: 'C-951 de 2014, numeral sexto de la parte resolutiva' },
      { n: 8, name: 'Cuando se responda una petición reiterativa ya resuelta, remisión a las respuestas anteriores, salvo derechos imprescriptibles o peticiones negadas por no acreditar requisitos ya subsanados', mandatory: false, basis: 'Ley 1755 de 2015, art. 19 inc. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/comunicacion-de-ampliacion-del-plazo-para-resolver-la-peticion',
    exactName: 'Comunicación de ampliación del plazo para resolver la petición',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, art. 14 par.',
    competentAuthority: 'La autoridad que tramita la petición',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD, con oportunidad preclusiva para ella. Art. 14 par.: «Cuando excepcionalmente no fuere posible resolver la petición en los plazos aquí señalados, la autoridad debe informar esta circunstancia al interesado, antes del vencimiento del término señalado en la ley expresando los motivos de la demora y señalando a la vez el plazo razonable en que se resolverá o dará respuesta, que no podrá exceder del doble del inicialmente previsto». Tres exigencias acumulativas: (i) el aviso debe darse ANTES del vencimiento del término original —después ya no sanea la mora—; (ii) debe expresar los motivos de la demora; (iii) el nuevo plazo no puede exceder del doble del inicial: máximo treinta (30) días en la petición general, veinte (20) en documentos e información y sesenta (60) en consultas. ADVERTENCIA: esta es la ampliación ordinaria del art. 14 par.; NO son los términos ampliados del art. 5 del Decreto Legislativo 491 de 2020, derogado por el art. 2 de la Ley 2207 de 2022.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la petición y de su fecha de radicación', mandatory: true, basis: 'Ley 1755 de 2015, art. 14 par.' },
      { n: 2, name: 'Constancia de que la comunicación se envía antes del vencimiento del término legal', mandatory: true, basis: 'Ley 1755 de 2015, art. 14 par.' },
      { n: 3, name: 'Expresión de los motivos de la demora', mandatory: true, basis: 'Ley 1755 de 2015, art. 14 par.' },
      { n: 4, name: 'Señalamiento del plazo razonable en que se resolverá o dará respuesta, sin exceder el doble del inicialmente previsto', mandatory: true, basis: 'Ley 1755 de 2015, art. 14 par.' },
      { n: 5, name: 'Constancia de envío al interesado', mandatory: true, basis: 'Ley 1755 de 2015, art. 14 par.' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/peticion-entre-autoridades',
    exactName: 'Petición entre autoridades',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, arts. 27 y 30',
    competentAuthority: 'La autoridad requerida',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD REQUERIDA: diez (10) días para información y documentos. Art. 30: «Cuando una autoridad formule una petición de información o de documentos a otra, esta deberá resolverla en un término no mayor de diez (10) días. En los demás casos, resolverá las solicitudes dentro de los plazos previstos en el artículo 14» —quince (15) días como regla general y treinta (30) días en consultas—. Concordancia sustantiva: art. 27, el carácter reservado «no será oponible a las autoridades judiciales, legislativas, ni a las autoridades administrativas que siendo constitucional o legalmente competentes para ello, los soliciten para el debido ejercicio de sus funciones», quedando la autoridad solicitante obligada a asegurar la reserva.' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad requerida', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 1' },
      { n: 2, name: 'Identificación de la autoridad solicitante y del funcionario que suscribe', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 2' },
      { n: 3, name: 'Objeto: información o documentos concretos que se solicitan', mandatory: true, basis: 'Ley 1755 de 2015, arts. 16 num. 3 y 30' },
      { n: 4, name: 'Fundamento de la competencia constitucional o legal y función en cuyo ejercicio se requieren', mandatory: true, basis: 'Ley 1755 de 2015, art. 27' },
      { n: 5, name: 'Compromiso de asegurar la reserva de las informaciones y documentos que se lleguen a conocer', mandatory: true, basis: 'Ley 1755 de 2015, art. 27' },
      { n: 6, name: 'Indicación del término no mayor de diez (10) días para resolver', mandatory: true, basis: 'Ley 1755 de 2015, art. 30' },
      { n: 7, name: 'Firma del funcionario', mandatory: true, basis: 'Ley 1755 de 2015, art. 16 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/requerimiento-por-peticion-incompleta-y-acto-que-decreta-el-desistimiento-tacito',
    exactName: 'Requerimiento por petición incompleta y acto que decreta el desistimiento tácito',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, art. 17',
    competentAuthority: 'La autoridad ante la que se radicó la petición',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES. (1) DE LA AUTORIDAD: debe requerir «dentro de los diez (10) días siguientes a la fecha de radicación» (art. 17 inc. 1). (2) DEL PETICIONARIO: «el término máximo de un (1) mes» para completar, prorrogable «hasta por un término igual» si lo solicita antes de vencer el plazo concedido. Solo «vencidos los términos establecidos en este artículo, sin que el peticionario haya cumplido el requerimiento, la autoridad decretará el desistimiento y el archivo del expediente, mediante acto administrativo motivado, que se notificará personalmente, contra el cual únicamente procede recurso de reposición, sin perjuicio de que la respectiva solicitud pueda ser nuevamente presentada con el lleno de los requisitos legales». Además, «A partir del día siguiente en que el interesado aporte los documentos o informes requeridos, se reactivará el término para resolver la petición». Artículo declarado EXEQUIBLE (C-951 de 2014, numeral tercero).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la petición, del peticionario y de la fecha de radicación', mandatory: true, basis: 'Ley 1755 de 2015, art. 17' },
      { n: 2, name: 'Constancia de que el requerimiento se formuló dentro de los diez (10) días siguientes a la radicación', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 1' },
      { n: 3, name: 'Indicación precisa de lo que falta o de la gestión de trámite a cargo del peticionario, necesaria para adoptar una decisión de fondo', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 1' },
      { n: 4, name: 'Concesión del término máximo de un (1) mes y advertencia de la prórroga hasta por término igual, solicitable antes de su vencimiento', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 3' },
      { n: 5, name: 'En el acto que decreta el desistimiento: motivación y verificación del vencimiento de los términos', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 4' },
      { n: 6, name: 'Orden de archivo del expediente', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 4' },
      { n: 7, name: 'Constancia de notificación personal', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 4' },
      { n: 8, name: 'Indicación de que únicamente procede recurso de reposición y de que la solicitud puede presentarse nuevamente', mandatory: true, basis: 'Ley 1755 de 2015, art. 17 inc. 4' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/remision-de-la-peticion-por-falta-de-competencia',
    exactName: 'Remisión de la petición por falta de competencia',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, art. 21',
    competentAuthority: 'La autoridad que recibió la petición sin ser competente',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD. Art. 21: «Si la autoridad a quien se dirige la petición no es la competente, se informará de inmediato al interesado si este actúa verbalmente, o dentro de los cinco (5) días siguientes al de la recepción, si obró por escrito. Dentro del término señalado remitirá la petición al competente y enviará copia del oficio remisorio al peticionario o en caso de no existir funcionario competente así se lo comunicará». REGLA DE CÓMPUTO decisiva para el peticionario: «Los términos para decidir o responder se contarán a partir del día siguiente a la recepción de la Petición por la autoridad competente» —el plazo del art. 14 no corre desde la radicación inicial ante la autoridad incompetente—.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la petición, del peticionario y de la fecha de recepción', mandatory: true, basis: 'Ley 1755 de 2015, art. 21' },
      { n: 2, name: 'Constancia de la falta de competencia', mandatory: true, basis: 'Ley 1755 de 2015, art. 21' },
      { n: 3, name: 'Información al interesado: de inmediato si actúa verbalmente, o dentro de los cinco (5) días siguientes al de la recepción si obró por escrito', mandatory: true, basis: 'Ley 1755 de 2015, art. 21' },
      { n: 4, name: 'Oficio de remisión a la autoridad competente dentro del mismo término', mandatory: true, basis: 'Ley 1755 de 2015, art. 21' },
      { n: 5, name: 'Envío de copia del oficio remisorio al peticionario, o comunicación de que no existe funcionario competente', mandatory: true, basis: 'Ley 1755 de 2015, art. 21' },
      { n: 6, name: 'Advertencia de que los términos para decidir o responder se cuentan desde el día siguiente a la recepción por la autoridad competente', mandatory: true, basis: 'Ley 1755 de 2015, art. 21' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/decision-que-rechaza-la-peticion-de-informacion-o-de-documentos-por-reserva-legal',
    exactName: 'Decisión que rechaza la petición de información o de documentos por reserva legal',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, arts. 24, 25 y 26',
    competentAuthority: 'La autoridad que custodia la información o los documentos',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD: el art. 25 no fija término propio; la decisión debe adoptarse dentro del término del art. 14 num. 1 aplicable a la petición que rechaza, esto es, «dentro de los diez (10) días siguientes a su recepción» tratándose de documentos e información. Vencido ese plazo sin respuesta opera el silencio POSITIVO del art. 14 num. 1 y «la administración ya no podrá negar la entrega de dichos documentos al peticionario». Contenido obligatorio, art. 25: «Toda decisión que rechace la petición de informaciones o documentos será motivada, indicará en forma precisa las disposiciones legales que impiden la entrega de información o documentos pertinentes y deberá notificarse al peticionario. Contra la decisión que rechace la petición de informaciones o documentos por motivos de reserva legal, no procede recurso alguno, salvo lo previsto en el artículo siguiente». RELOJ DEL PETICIONARIO frente a esta decisión: diez (10) días siguientes a la notificación para insistir (art. 26 par.).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la petición de información o de documentos y de su fecha de radicación', mandatory: true, basis: 'Ley 1755 de 2015, art. 25' },
      { n: 2, name: 'Motivación del rechazo', mandatory: true, basis: 'Ley 1755 de 2015, art. 25' },
      { n: 3, name: 'Indicación precisa de las disposiciones constitucionales o legales que impiden la entrega', mandatory: true, basis: 'Ley 1755 de 2015, arts. 24 y 25' },
      { n: 4, name: 'Delimitación de la reserva: precisión de que no se extiende a otras piezas del respectivo expediente o actuación no cubiertas por ella', mandatory: true, basis: 'Ley 1755 de 2015, art. 25 inc. 2' },
      { n: 5, name: 'Cuando se invoquen los numerales 3, 5, 6, 7 u 8 del art. 24, verificación de si el solicitante es el titular de la información, su apoderado o persona autorizada con facultad expresa', mandatory: true, basis: 'Ley 1755 de 2015, art. 24 par.; C-951 de 2014, numeral octavo' },
      { n: 6, name: 'Constancia de notificación al peticionario', mandatory: true, basis: 'Ley 1755 de 2015, art. 25' },
      { n: 7, name: 'Advertencia de que no procede recurso alguno, salvo el de insistencia del art. 26', mandatory: true, basis: 'Ley 1755 de 2015, arts. 25 y 26' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  },
  {
    id: 'administrativo/respuesta-unica-a-peticiones-analogas-de-mas-de-diez-personas',
    exactName: 'Respuesta única a peticiones análogas de más de diez personas',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1755 de 2015, art. 22; Sentencia C-951 de 2014',
    competentAuthority: 'La autoridad destinataria de las peticiones',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD: el art. 22 no fija término propio; rigen los del art. 14 según la modalidad de cada petición (15 / 10 / 30 días). Art. 22 inc. 2: «Cuando más de diez (10) personas formulen peticiones análogas, de información, de interés general o de consulta, la Administración podrá dar una única respuesta que publicará en un diario de amplia circulación, la pondrá en su página web y entregará copias de la misma a quienes las soliciten». La Corte Constitucional lo declaró EXEQUIBLE «sin perjuicio de que deba enviarse la respuesta a todos los que hayan formulado la petición» (C-951 de 2014, numeral séptimo): la publicación NO releva del envío individual.' },
    requiredSections: [
      { n: 1, name: 'Verificación de que más de diez (10) personas formularon peticiones análogas de información, de interés general o de consulta', mandatory: true, basis: 'Ley 1755 de 2015, art. 22 inc. 2' },
      { n: 2, name: 'Respuesta única, completa y de fondo sobre lo pedido', mandatory: true, basis: 'Ley 1755 de 2015, arts. 13 y 22' },
      { n: 3, name: 'Constancia de publicación en un diario de amplia circulación', mandatory: true, basis: 'Ley 1755 de 2015, art. 22 inc. 2' },
      { n: 4, name: 'Constancia de publicación en la página web de la entidad', mandatory: true, basis: 'Ley 1755 de 2015, art. 22 inc. 2' },
      { n: 5, name: 'Constancia de envío de la respuesta a todos los que hayan formulado la petición', mandatory: true, basis: 'C-951 de 2014, numeral séptimo de la parte resolutiva' },
      { n: 6, name: 'Disponibilidad de copias para quienes las soliciten', mandatory: true, basis: 'Ley 1755 de 2015, art. 22 inc. 2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=65334'
  }
  ]
};
