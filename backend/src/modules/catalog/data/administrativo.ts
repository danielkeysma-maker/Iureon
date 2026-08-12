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
    'No se verificaron actuaciones de notificación (arts. 66-73, 197-205) ni el régimen de firmeza (art. 87).'
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
    term: { status: 'NO_VERIFICADO', description: null },
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
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/demanda-de-proteccion-de-los-derechos-e-intereses-colectivos',
    exactName: 'Demanda de protección de los derechos e intereses colectivos',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 144 (medio de control); art. 161 num. 4 (requisito de procedibilidad: reclamación previa prevista en el art. 144)',
    competentAuthority: 'Jurisdicción de lo Contencioso Administrativo',
    term: { status: 'NO_VERIFICADO', description: null },
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
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del superior del funcionario que dictó la decisión', mandatory: true, basis: 'art. 74 num. 3 — se interpone directamente ante el superior' },
      { n: 2, name: 'Identificación del recurrente', mandatory: false, basis: 'art. 77 num. 1' },
      { n: 3, name: 'Hechos: interposición del recurso de apelación y su rechazo', mandatory: true, basis: 'art. 74 num. 3' },
      { n: 4, name: 'Sustentación de la procedencia de la apelación rechazada', mandatory: true, basis: 'art. 77 num. 2' },
      { n: 5, name: 'Copia de la providencia que negó el recurso de apelación', mandatory: true, basis: 'art. 74 num. 3, inciso final — debe acompañarse al escrito' },
      { n: 6, name: 'Nombre y dirección del recurrente y dirección electrónica', mandatory: true, basis: 'art. 77 num. 4' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del Consejo de Estado', mandatory: false, basis: 'art. 269' },
      { n: 2, name: 'Actuación a través de apoderado', mandatory: true, basis: 'art. 269, inciso 1 («el interesado, a través de apoderado»)' },
      { n: 3, name: 'Escrito razonado que evidencie que se encuentra en similar situación de hecho y de derecho del demandante al cual se le reconoció el derecho en la sentencia de unificación invocada', mandatory: true, basis: 'art. 269, inciso 1' },
      { n: 4, name: 'Referencia de la sentencia de unificación invocada (que sea de unificación y que reconozca un derecho)', mandatory: true, basis: 'art. 269, causales de rechazo de plano nums. 3 y 4' },
      { n: 5, name: 'Copia de la actuación surtida ante la autoridad competente', mandatory: true, basis: 'art. 269, inciso 2' },
      { n: 6, name: 'Manifestación bajo la gravedad del juramento —que se entiende prestado con la sola presentación de la solicitud— de que no se ha acudido a la jurisdicción de lo contencioso administrativo para obtener el reconocimiento del derecho pretendido', mandatory: true, basis: 'art. 269, inciso 2' },
      { n: 7, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del agente del Ministerio Público (Procurador Judicial Delegado ante la Jurisdicción de lo Contencioso Administrativo)', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del convocante y del convocado (entidad pública)', mandatory: false, basis: null },
      { n: 3, name: 'Hechos', mandatory: false, basis: null },
      { n: 4, name: 'Pretensiones conciliables (relativas a nulidad y restablecimiento del derecho, reparación directa o controversias contractuales)', mandatory: true, basis: 'art. 161 num. 1 — sólo respecto de esas pretensiones el trámite es requisito de procedibilidad' },
      { n: 5, name: 'Fórmula de arreglo y estimación razonada de la cuantía', mandatory: false, basis: null },
      { n: 6, name: 'Pruebas y anexos', mandatory: false, basis: null },
      { n: 7, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/escrito-de-constitucion-en-renuencia-requisito-de-procedibilidad-de-la-accion-de-cumplimiento',
    exactName: 'Escrito de constitución en renuencia (requisito de procedibilidad de la acción de cumplimiento)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 161 num. 3, que remite al art. 8 de la Ley 393 de 1997',
    competentAuthority: 'La autoridad obligada al cumplimiento de la norma con fuerza material de ley o del acto administrativo',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad obligada', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del solicitante', mandatory: false, basis: null },
      { n: 3, name: 'Identificación precisa de la norma con fuerza material de ley o del acto administrativo cuyo cumplimiento se reclama', mandatory: true, basis: 'art. 161 num. 3 en concordancia con el art. 146' },
      { n: 4, name: 'Requerimiento expreso de cumplimiento', mandatory: true, basis: 'art. 161 num. 3' },
      { n: 5, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/reclamacion-previa-para-la-proteccion-de-derechos-e-intereses-colectivos-requisito-de-procedibilidad',
    exactName: 'Reclamación previa para la protección de derechos e intereses colectivos (requisito de procedibilidad)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 161 num. 4, que remite al art. 144 del mismo Código',
    competentAuthority: 'La autoridad presuntamente responsable de la amenaza o vulneración del derecho o interés colectivo',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del reclamante', mandatory: false, basis: null },
      { n: 3, name: 'Identificación del derecho o interés colectivo amenazado o vulnerado', mandatory: true, basis: 'art. 161 num. 4 en concordancia con el art. 144' },
      { n: 4, name: 'Hechos de la amenaza o vulneración', mandatory: false, basis: null },
      { n: 5, name: 'Petición de adopción de las medidas necesarias', mandatory: true, basis: 'art. 144' },
      { n: 6, name: 'Notificaciones', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/escritura-publica-para-invocar-el-silencio-administrativo-positivo',
    exactName: 'Escritura pública para invocar el silencio administrativo positivo',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 85 (procedimiento para invocar el silencio administrativo positivo), en concordancia con el art. 84',
    competentAuthority: 'Notaría (protocolización) y la autoridad ante la cual se hace valer el acto ficto positivo',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del interesado', mandatory: false, basis: null },
      { n: 2, name: 'Copia de la petición presentada y prueba de su radicación', mandatory: true, basis: 'art. 85' },
      { n: 3, name: 'Declaración jurada de no haberse notificado la decisión dentro del término previsto', mandatory: true, basis: 'art. 85' },
      { n: 4, name: 'Invocación de la disposición legal especial que consagra el silencio positivo para el caso', mandatory: true, basis: 'art. 84 — el silencio positivo sólo opera en los casos expresamente previstos en disposiciones legales especiales' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-de-apelacion-contra-sentencias-y-autos-judicial',
    exactName: 'Recurso de apelación contra sentencias y autos (judicial)',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 243',
    competentAuthority: 'El superior funcional del juez de primera instancia (Tribunal Administrativo o Consejo de Estado)',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del juez de primera instancia y del superior', mandatory: false, basis: null },
      { n: 2, name: 'Identificación de la providencia apelada', mandatory: true, basis: 'art. 243' },
      { n: 3, name: 'Sustentación y reparos concretos contra la providencia', mandatory: true, basis: null },
      { n: 4, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-de-suplica',
    exactName: 'Recurso de súplica',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 246',
    competentAuthority: 'Los demás magistrados de la Sala o Sección, distintos del ponente que dictó el auto',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación de la Sala o Sección', mandatory: false, basis: null },
      { n: 2, name: 'Identificación del auto del magistrado ponente que se suplica', mandatory: true, basis: 'art. 246' },
      { n: 3, name: 'Sustentación', mandatory: true, basis: null },
      { n: 4, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-extraordinario-de-revision',
    exactName: 'Recurso extraordinario de revisión',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, art. 248 (procedencia)',
    competentAuthority: 'Consejo de Estado o Tribunal Administrativo, según la corporación que dictó la sentencia ejecutoriada',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación de la corporación competente', mandatory: false, basis: null },
      { n: 2, name: 'Identificación de la sentencia ejecutoriada objeto del recurso', mandatory: true, basis: 'art. 248 — procede contra sentencias ejecutoriadas dictadas por las secciones y subsecciones' },
      { n: 3, name: 'Causal de revisión invocada y su sustentación', mandatory: true, basis: null },
      { n: 4, name: 'Pruebas', mandatory: false, basis: null },
      { n: 5, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/recurso-extraordinario-de-unificacion-de-jurisprudencia',
    exactName: 'Recurso extraordinario de unificación de jurisprudencia',
    branch: 'ADMINISTRATIVO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, arts. 256 (fines) y 257 (procedencia)',
    competentAuthority: 'Consejo de Estado',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del Consejo de Estado', mandatory: false, basis: null },
      { n: 2, name: 'Identificación de la sentencia dictada en única o en segunda instancia objeto del recurso', mandatory: true, basis: 'art. 257' },
      { n: 3, name: 'Identificación de la sentencia de unificación jurisprudencial contrariada', mandatory: true, basis: 'art. 256 — el fin del recurso es asegurar la unidad de la interpretación del derecho' },
      { n: 4, name: 'Sustentación', mandatory: true, basis: null },
      { n: 5, name: 'Petición', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    legalBasis: 'Ley 1437 de 2011, art. 84 (silencio positivo); art. 85 (procedimiento para invocarlo)',
    competentAuthority: 'La autoridad ante la cual se presentó la petición',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'No aplica: se trata de un acto ficto, sin texto escrito', mandatory: false, basis: 'art. 84' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida de carácter general objeto de control', mandatory: true, basis: 'art. 136' },
      { n: 2, name: 'Verificación de que fue dictada en ejercicio de la función administrativa y como desarrollo de los decretos legislativos durante los Estados de Excepción', mandatory: true, basis: 'art. 136 — es el presupuesto del control' },
      { n: 3, name: 'Competencia (territorial o nacional)', mandatory: true, basis: 'art. 136' },
      { n: 4, name: 'Consideraciones y confrontación con el decreto legislativo y el ordenamiento superior', mandatory: true, basis: null },
      { n: 5, name: 'Decisión', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Alegatos de conclusión de las partes', mandatory: true, basis: 'art. 182' },
      { n: 2, name: 'Concepto del Ministerio Público', mandatory: false, basis: null },
      { n: 3, name: 'Sentencia', mandatory: true, basis: 'art. 182' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
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
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la solicitud de extensión', mandatory: false, basis: 'art. 269' },
      { n: 2, name: 'Causal de rechazo de plano invocada', mandatory: true, basis: 'art. 269: (1) el peticionario ya acudió a la Jurisdicción de lo Contencioso Administrativo para obtener el reconocimiento del derecho pretendido; (2) se presentó extemporáneamente; (3) se pide extender una sentencia que no es de unificación; (4) la sentencia de unificación invocada no es de aquellas que reconocen un derecho' },
      { n: 3, name: 'Decisión de rechazo', mandatory: true, basis: 'art. 269' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/auto-que-decreta-levanta-modifica-o-revoca-la-medida-cautelar',
    exactName: 'Auto que decreta, levanta, modifica o revoca la medida cautelar',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, arts. 229, 230, 231, 234 y 235',
    competentAuthority: 'Juez o Magistrado Ponente',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la solicitud y del proceso', mandatory: false, basis: null },
      { n: 2, name: 'Verificación de los requisitos del art. 231', mandatory: true, basis: 'art. 231' },
      { n: 3, name: 'Para la suspensión provisional: confrontación del acto demandado con las normas superiores invocadas como violadas o estudio de las pruebas allegadas con la solicitud', mandatory: true, basis: 'art. 231, inciso 1' },
      { n: 4, name: 'Juicio de ponderación de intereses (en los demás casos)', mandatory: true, basis: 'art. 231 num. 3' },
      { n: 5, name: 'Decisión y contenido de la medida (preventiva, conservativa, anticipativa o de suspensión)', mandatory: true, basis: 'art. 230' },
      { n: 6, name: 'Señalamiento de la caución', mandatory: true, basis: 'art. 234, inciso 2' },
      { n: 7, name: 'Recursos que proceden', mandatory: false, basis: 'art. 234, inciso 1' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  },
  {
    id: 'administrativo/sentencia-de-unificacion-jurisprudencial',
    exactName: 'Sentencia de unificación jurisprudencial',
    branch: 'ADMINISTRATIVO',
    role: 'DESPACHO',
    legalBasis: 'Ley 1437 de 2011, art. 270',
    competentAuthority: 'Consejo de Estado',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y de las partes', mandatory: false, basis: null },
      { n: 2, name: 'Antecedentes', mandatory: false, basis: null },
      { n: 3, name: 'Consideraciones y regla de unificación', mandatory: true, basis: 'art. 270' },
      { n: 4, name: 'Decisión', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=41249'
  }
  ]
};
