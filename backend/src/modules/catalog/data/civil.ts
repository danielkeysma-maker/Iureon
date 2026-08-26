import type { BranchCatalog } from '../types';

/**
 * CIVIL catalogue.
 *
 * Generated from research/actuaciones-civil.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const CIVIL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'CIVIL',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Ley 1564 de 2012 (Código General del Proceso), texto vigente. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma; los no verificados quedan declarados como tales y la aplicación se abstiene de afirmarlos.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'Recurso de queja: los artículos 352 y 353 fijan el trámite pero el término de interposición no se pudo leer en la fuente consultada. Queda sin verificar.',
    'Restitución de inmueble arrendado (art. 384): el traslado sigue las reglas del proceso verbal o verbal sumario según la cuantía, de modo que el término depende del trámite y no se afirma aquí.',
    'Procesos de sucesión, liquidación de sociedad conyugal e insolvencia de persona natural: catalogados en su estructura, con términos sin verificar.',
    'ACTUACIONES DE SECRETARIA. Las entradas con rol SECRETARIA provienen del CGP y aplican, por remision, a las ramas que siguen ese codigo. Estan catalogadas aqui y no duplicadas en cada rama. EL SUSTANCIADOR NO TIENE ROL PROPIO: proyecta la providencia que el juez firma, de modo que es un solo documento con dos manos, no dos documentos. El PROFESIONAL UNIVERSITARIO cumple funciones de sustanciacion y por la misma razon tampoco constituye un rol aparte. El CITADOR apoya la entrega de citaciones y avisos y no proyecta providencias; su producto documental, la planilla de entrega, figura bajo SECRETARIA porque la expide la secretaria.',
    'Los términos de la jurisdicción agraria y de los procesos de familia tramitados por el CGP no están incluidos; corresponden a las ramas FAMILIA y AGRARIA aún no catalogadas.',
    'Todos los términos del CGP se cuentan en días hábiles salvo disposición en contrario (art. 118). El catálogo transcribe el plazo de la norma, no su cómputo en un caso concreto.'
    ]
  },
  actuaciones: [
  {
    id: 'civil/demanda-de-proceso-declarativo-verbal',
    exactName: 'Demanda de proceso declarativo verbal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82 y 368 a 373',
    competentAuthority: 'Juez civil del circuito o municipal, según la cuantía y la naturaleza del asunto (arts. 17 a 20)',
    term: { status: 'VERIFICADO', description: 'Admitida la demanda se corre traslado al demandado por veinte (20) días para contestarla (art. 369).' },
    requiredSections: [
      { n: 1, name: 'Designación del juez a quien se dirige', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Nombre y domicilio de las partes y de sus representantes', mandatory: true, basis: 'Art. 82 num. 2' },
      { n: 3, name: 'Pretensiones expresadas con precisión y claridad', mandatory: true, basis: 'Art. 82 num. 4' },
      { n: 4, name: 'Hechos que sirven de fundamento, debidamente determinados, clasificados y numerados', mandatory: true, basis: 'Art. 82 num. 5' },
      { n: 5, name: 'Petición de las pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 82 num. 6' },
      { n: 6, name: 'Juramento estimatorio, cuando se pretenda el reconocimiento de una indemnización, compensación o frutos', mandatory: false, basis: 'Arts. 82 num. 7 y 206' },
      { n: 7, name: 'Fundamentos de derecho', mandatory: true, basis: 'Art. 82 num. 8' },
      { n: 8, name: 'Cuantía del proceso, cuando su estimación sea necesaria para determinar la competencia', mandatory: false, basis: 'Art. 82 num. 9' },
      { n: 9, name: 'Lugar, dirección física y electrónica para notificaciones de las partes y sus apoderados', mandatory: true, basis: 'Art. 82 num. 10' },
      { n: 10, name: 'Anexos: poder, prueba de la existencia y representación, y documentos que se pretenda hacer valer', mandatory: true, basis: 'Art. 84' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr012.html#369'
  },
  {
    id: 'civil/demanda-de-proceso-verbal-sumario',
    exactName: 'Demanda de proceso verbal sumario',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82, 390 y 391',
    competentAuthority: 'Juez civil municipal en única instancia (art. 390)',
    term: { status: 'VERIFICADO', description: 'El término para contestar la demanda será de diez (10) días (art. 391). El proceso verbal sumario es de única instancia (art. 390 parágrafo 1): la sentencia no es apelable, de modo que el demandante no dispone de un segundo grado y todo debe jugarse en la única audiencia. Reloj del demandante: si el demandado propone excepciones de mérito, el demandante tiene tres (3) días de traslado para pedir pruebas sobre ellas (art. 391); vencidos, pierde esa oportunidad probatoria.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez a quien se dirige', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Nombre y domicilio de las partes y de sus representantes', mandatory: true, basis: 'Art. 82 num. 2' },
      { n: 3, name: 'Pretensiones expresadas con precisión y claridad', mandatory: true, basis: 'Art. 82 num. 4' },
      { n: 4, name: 'Hechos determinados, clasificados y numerados', mandatory: true, basis: 'Art. 82 num. 5' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' },
      { n: 6, name: 'Fundamentos de derecho', mandatory: true, basis: 'Art. 82 num. 8' },
      { n: 7, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 82 num. 10' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr013.html#391'
  },
  {
    id: 'civil/demanda-ejecutiva-singular',
    exactName: 'Demanda ejecutiva singular',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82, 422 y 430',
    competentAuthority: 'Juez civil del circuito o municipal, según la cuantía',
    term: { status: 'NO_CADUCA', description: 'Ni el art. 82 (requisitos de la demanda), ni el art. 422 (título ejecutivo), ni el art. 430 (mandamiento ejecutivo) fijan plazo para presentar la demanda ejecutiva singular: no opera caducidad para su presentación, pues la oportunidad depende de la exigibilidad y de la prescripción de la obligación sustancial (art. 422 exige obligación expresa, clara y exigible). El único término que la norma sí fija es incidental: revocado el mandamiento de pago por ausencia de los requisitos del título, el demandante puede presentar demanda declarativa dentro de los cinco (5) días siguientes a la ejecutoria de ese auto, dentro del mismo expediente (art. 430, inc. 3).' },
    requiredSections: [
      { n: 1, name: 'Designación del juez a quien se dirige', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Identificación de ejecutante y ejecutado', mandatory: true, basis: 'Art. 82 num. 2' },
      { n: 3, name: 'Pretensión ejecutiva: capital, intereses y costas', mandatory: true, basis: 'Arts. 82 num. 4 y 430' },
      { n: 4, name: 'Hechos que fundamentan la obligación', mandatory: true, basis: 'Art. 82 num. 5' },
      { n: 5, name: 'Título ejecutivo que preste mérito: obligación clara, expresa y exigible', mandatory: true, basis: 'Art. 422' },
      { n: 6, name: 'Solicitud de librar mandamiento de pago', mandatory: true, basis: 'Art. 430' },
      { n: 7, name: 'Solicitud de medidas cautelares', mandatory: false, basis: 'Art. 599' },
      { n: 8, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 82 num. 10' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/demanda-ejecutiva-con-garantia-real',
    exactName: 'Demanda ejecutiva con garantía real',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 422, 430 y 468',
    competentAuthority: 'Juez civil del circuito o municipal, según la cuantía',
    term: { status: 'VERIFICADO', description: 'El certificado del registrador que se anexa a la demanda no puede haber sido expedido con antelación superior a un (1) mes (art. 468 num. 1). Los acreedores hipotecarios o prendarios citados disponen de diez (10) días contados desde su respectiva notificación para hacer valer sus créditos, y el curador ad litem que se designe dispone de diez (10) días desde su notificación para presentar la demanda (art. 468 num. 4). El proceso ejecutivo de los acreedores que no concurrieron debe iniciarse dentro de los treinta (30) días siguientes al pago, vencidos los cuales el saldo se entrega al ejecutado (art. 468 num. 4). El término del ejecutado para proponer excepciones de mérito no lo fija el artículo 468 sino el artículo 442 num. 1: diez (10) días siguientes a la notificación del mandamiento ejecutivo.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Identificación de las partes', mandatory: true, basis: 'Art. 82 num. 2' },
      { n: 3, name: 'Pretensión de pago con cargo al bien gravado', mandatory: true, basis: 'Art. 468' },
      { n: 4, name: 'Título ejecutivo y prueba de la garantía hipotecaria o prendaria', mandatory: true, basis: 'Art. 468' },
      { n: 5, name: 'Certificado de tradición del inmueble o del registro de la garantía mobiliaria', mandatory: true, basis: 'Art. 468' },
      { n: 6, name: 'Solicitud de embargo y secuestro del bien gravado', mandatory: false, basis: 'Art. 468' },
      { n: 7, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 82 num. 10' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/subsanacion-de-demanda-inadmitida',
    exactName: 'Subsanación de demanda inadmitida',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 90',
    competentAuthority: 'El mismo juez que inadmitió la demanda',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días para subsanar los defectos señalados, so pena de rechazo (art. 90).' },
    requiredSections: [
      { n: 1, name: 'Referencia al auto inadmisorio y a cada defecto señalado', mandatory: true, basis: 'Art. 90' },
      { n: 2, name: 'Corrección puntual de cada defecto, en el orden indicado por el juez', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Anexos que se echaron de menos', mandatory: false, basis: 'Art. 84' },
      { n: 4, name: 'Solicitud de admisión de la demanda subsanada', mandatory: true, basis: 'Art. 90' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html#90'
  },
  {
    id: 'civil/reforma-de-la-demanda',
    exactName: 'Reforma de la demanda',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 93',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El demandante puede corregir, aclarar o reformar la demanda en cualquier momento, desde su presentación y hasta antes del señalamiento de la audiencia inicial, y la reforma procede por una sola vez (art. 93, incs. 1 y 2). Si la reforma es posterior a la notificación del demandado, el auto que la admite se notifica por estado y se corre traslado al demandado o su apoderado por la mitad del término inicial, que corre pasados tres (3) días desde la notificación; a los nuevos demandados se les notifica personalmente y se les corre traslado en la forma y por el término de la demanda inicial (art. 93, num. 4).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y de la demanda que se reforma', mandatory: true, basis: 'Art. 93' },
      { n: 2, name: 'Escrito integrado de la demanda con las modificaciones', mandatory: true, basis: 'Art. 93' },
      { n: 3, name: 'Indicación de las partes, hechos o pretensiones modificadas', mandatory: true, basis: 'Art. 93' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/contestacion-de-la-demanda-en-proceso-verbal',
    exactName: 'Contestación de la demanda en proceso verbal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 96 y 369',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Veinte (20) días de traslado contados desde la notificación del auto admisorio (art. 369).' },
    requiredSections: [
      { n: 1, name: 'Pronunciamiento expreso y concreto sobre las pretensiones', mandatory: true, basis: 'Art. 96 num. 2' },
      { n: 2, name: 'Pronunciamiento sobre cada uno de los hechos, aceptándolos o negándolos', mandatory: true, basis: 'Art. 96 num. 2' },
      { n: 3, name: 'Excepciones de mérito con los hechos que las sustentan', mandatory: false, basis: 'Art. 96 num. 3' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 96 num. 4' },
      { n: 5, name: 'Objeción razonada al juramento estimatorio', mandatory: false, basis: 'Art. 206' },
      { n: 6, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 96 num. 5' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr012.html#369'
  },
  {
    id: 'civil/contestacion-de-la-demanda-en-proceso-verbal-sumario',
    exactName: 'Contestación de la demanda en proceso verbal sumario',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 96 y 391',
    competentAuthority: 'Juez civil municipal en única instancia',
    term: { status: 'VERIFICADO', description: 'Diez (10) días para contestar la demanda (art. 391). Reloj del demandado, distinto del de la contestación: en verbal sumario las excepciones previas NO se proponen en la contestación sino mediante recurso de reposición contra el auto admisorio, que debe interponerse dentro de los tres (3) días siguientes a su notificación (art. 318). Quien las incluya solo en la contestación las pierde. Si prospera alguna que no termine el proceso, el juez puede conceder al demandante cinco (5) días para subsanar, so pena de revocar el auto admisorio (art. 391).' },
    requiredSections: [
      { n: 1, name: 'Pronunciamiento sobre las pretensiones', mandatory: true, basis: 'Art. 96 num. 2' },
      { n: 2, name: 'Pronunciamiento sobre cada hecho', mandatory: true, basis: 'Art. 96 num. 2' },
      { n: 3, name: 'Excepciones de mérito', mandatory: false, basis: 'Art. 96 num. 3' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 96 num. 4' },
      { n: 5, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 96 num. 5' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr013.html#391'
  },
  {
    id: 'civil/excepciones-previas',
    exactName: 'Excepciones previas',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 100 y 101',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Las excepciones previas deben proponerse dentro del término de traslado de la demanda, en escrito separado que exprese las razones y hechos en que se fundamentan y al que deben acompañarse todas las pruebas en poder del demandado (arts. 100, inc. 1, y 101, inc. 1). Del escrito se corre traslado al demandante por tres (3) días conforme al art. 110 (art. 101, num. 1). Dentro del traslado de la reforma de la demanda el demandado puede proponer nuevas excepciones previas siempre que se originen en dicha reforma (art. 101, num. 3).' },
    requiredSections: [
      { n: 1, name: 'Enunciación de la causal invocada entre las taxativas del art. 100', mandatory: true, basis: 'Art. 100' },
      { n: 2, name: 'Hechos en que se funda cada excepción', mandatory: true, basis: 'Art. 101' },
      { n: 3, name: 'Pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 101' },
      { n: 4, name: 'Petición de que se declare probada la excepción', mandatory: true, basis: 'Art. 101' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/excepciones-de-merito-en-proceso-ejecutivo',
    exactName: 'Excepciones de mérito en proceso ejecutivo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 442',
    competentAuthority: 'El juez que libró el mandamiento de pago',
    term: { status: 'VERIFICADO', description: 'Diez (10) días siguientes a la notificación del mandamiento ejecutivo para proponer excepciones de mérito (art. 442 num. 1). Reloj del ejecutado, distinto de los diez (10) días: el beneficio de excusión y los hechos que configuren excepciones previas se alegan por reposición contra el mandamiento de pago, dentro de los tres (3) días siguientes a su notificación (arts. 442 num. 3 y 318); no caben como excepciones de mérito. Además, cuando se cobra una providencia judicial, una conciliación o una transacción aprobada por quien ejerza función jurisdiccional, solo pueden alegarse las excepciones de pago, compensación, confusión, novación, remisión, prescripción o transacción basadas en hechos POSTERIORES a esa providencia, más la nulidad por indebida representación o falta de notificación o emplazamiento y la pérdida de la cosa debida (art. 442 num. 2). Reloj del ejecutante: si prospera una excepción previa que no termina el proceso, dispone de cinco (5) días para subsanar o aportar los documentos omitidos, so pena de que se revoque la orden de pago con condena en costas y perjuicios (art. 442 num. 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso ejecutivo y del mandamiento de pago', mandatory: true, basis: 'Art. 442' },
      { n: 2, name: 'Enunciación de cada excepción de mérito', mandatory: true, basis: 'Art. 442 num. 1' },
      { n: 3, name: 'Hechos en que se fundamentan las excepciones', mandatory: true, basis: 'Art. 442 num. 1' },
      { n: 4, name: 'Pruebas que se acompañan o se solicitan', mandatory: true, basis: 'Art. 442 num. 1' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html#442'
  },
  {
    id: 'civil/demanda-de-reconvencion',
    exactName: 'Demanda de reconvención',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82 y 371',
    competentAuthority: 'El juez que conoce de la demanda principal',
    term: { status: 'VERIFICADO', description: 'La reconvención debe proponerse durante el término del traslado de la demanda (art. 371), que en el proceso verbal es de veinte (20) días (art. 369). Vencido el término del traslado de la demanda inicial a todos los demandados, se corre traslado de la reconvención al demandante por el mismo término de la inicial (art. 371).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Demostración de que el juez es competente para conocer de la reconvención', mandatory: true, basis: 'Art. 371' },
      { n: 3, name: 'Pretensiones propias del demandado contra el demandante', mandatory: true, basis: 'Art. 371' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/llamamiento-en-garantia',
    exactName: 'Llamamiento en garantía',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 64 a 66',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El llamamiento en garantía debe pedirse en la demanda o dentro del término para contestarla (art. 64). Admitido, se ordena notificar personalmente al convocado y correrle traslado del escrito por el término de la demanda inicial; si la notificación no se logra dentro de los seis (6) meses siguientes, el llamamiento será ineficaz (art. 66, inc. 1).' },
    requiredSections: [
      { n: 1, name: 'Nombre y domicilio del llamado y de su representante', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Hechos en que se basa el llamamiento y fundamentos de derecho', mandatory: true, basis: 'Art. 66' },
      { n: 3, name: 'Dirección para notificar al llamado', mandatory: true, basis: 'Art. 66' },
      { n: 4, name: 'Prueba siquiera sumaria del derecho legal o contractual invocado', mandatory: true, basis: 'Art. 64' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/solicitud-de-medidas-cautelares',
    exactName: 'Solicitud de medidas cautelares',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 590',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_CADUCA', description: 'En los procesos declarativos las medidas cautelares pueden pedirse por el demandante desde la presentación de la demanda (art. 590, num. 1); la norma no señala fecha límite para solicitarlas: no opera caducidad de la solicitud. El demandante debe prestar caución equivalente al veinte por ciento (20%) del valor de las pretensiones estimadas, salvo para embargos y secuestros posteriores a sentencia favorable de primera instancia (art. 590, num. 2). Por remisión expresa del parágrafo segundo del art. 590, las medidas de los literales b) y c) se levantarán si el demandante no promueve la ejecución dentro del término del art. 306, esto es, dentro de los treinta (30) días siguientes a la ejecutoria de la sentencia o a la notificación del auto de obedecimiento a lo resuelto por el superior.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida solicitada', mandatory: true, basis: 'Art. 590' },
      { n: 2, name: 'Apariencia de buen derecho e interés para obrar', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 3, name: 'Necesidad, efectividad y proporcionalidad de la medida', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 4, name: 'Identificación de los bienes sobre los que recae', mandatory: true, basis: 'Art. 590' },
      { n: 5, name: 'Ofrecimiento de caución', mandatory: false, basis: 'Art. 590 par.' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/recurso-de-reposicion',
    exactName: 'Recurso de reposición',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 318 y 319',
    competentAuthority: 'El mismo juez o magistrado que dictó el auto',
    term: { status: 'VERIFICADO', description: 'Tres (3) días siguientes al de la notificación del auto, cuando se pronuncie fuera de audiencia (art. 318). La ficha solo publica el plazo de los autos dictados fuera de audiencia. Reloj del recurrente en audiencia: el recurso debe interponerse "en forma verbal inmediatamente se pronuncie el auto" y con expresión de las razones que lo sustenten (art. 318); no hay tres días, se pierde en el acto. Reloj de la contraparte: cuando el recurso se formula por escrito, se resuelve previo traslado por tres (3) días (art. 319). Los autos de las salas de decisión no tienen reposición; solo cabe pedir aclaración o complementación dentro del término de su ejecutoria (art. 318).' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto recurrido y su fecha de notificación', mandatory: true, basis: 'Art. 318' },
      { n: 2, name: 'Expresión de las razones de inconformidad', mandatory: true, basis: 'Art. 318' },
      { n: 3, name: 'Petición de que se reforme o revoque el auto', mandatory: true, basis: 'Art. 318' },
      { n: 4, name: 'Apelación subsidiaria, cuando el auto sea apelable', mandatory: false, basis: 'Art. 322' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html#318'
  },
  {
    id: 'civil/recurso-de-apelacion',
    exactName: 'Recurso de apelación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 320 a 322',
    competentAuthority: 'Se interpone ante el juez que dictó la providencia; lo resuelve el superior',
    term: { status: 'VERIFICADO', description: 'Providencia dictada EN audiencia: el recurso se interpone en forma verbal inmediatamente después de pronunciada (art. 322 num. 1); no hay plazo posterior. Providencia dictada FUERA de audiencia: se interpone ante el juez que la dictó, en el acto de su notificación personal, o por escrito dentro de los tres (3) días siguientes a su notificación por estado (art. 322 num. 1). Sustentación: tratándose de AUTOS, se sustenta ante el juez que dictó la providencia dentro de los tres (3) días siguientes a su notificación o a la del auto que niega la reposición, so pena de que se declare desierto (art. 322 num. 3). Tratándose de SENTENCIAS, dentro de ese mismo plazo de tres (3) días solo deben precisarse los reparos concretos; la sustentación propiamente dicha se surte después ante el superior, y este declarará desierto el recurso que no sea sustentado (art. 322 num. 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia apelada', mandatory: true, basis: 'Art. 322' },
      { n: 2, name: 'Manifestación expresa de interponer el recurso de apelación', mandatory: true, basis: 'Art. 322' },
      { n: 3, name: 'Sustentación: reparos concretos contra la providencia', mandatory: true, basis: 'Art. 322' },
      { n: 4, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 322' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html#322'
  },
  {
    id: 'civil/recurso-de-suplica',
    exactName: 'Recurso de súplica',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 331',
    competentAuthority: 'Los demás magistrados de la sala, con exclusión del sustanciador',
    term: { status: 'VERIFICADO', description: 'Tres (3) días siguientes a la notificación del auto (art. 331). Requisito que la ficha omite y que hace perder el recurso dentro del mismo plazo: el escrito debe dirigirse al magistrado sustanciador y expresar las razones de la inconformidad (art. 331); una súplica sin motivación no está debidamente formulada. Límite de procedencia: no procede contra los autos que resuelven la apelación o la queja (art. 331). Vencido el traslado, el expediente pasa al magistrado que sigue en turno al que dictó la providencia, y contra lo decidido no procede recurso (art. 332).' },
    requiredSections: [
      { n: 1, name: 'Escrito dirigido al magistrado sustanciador', mandatory: true, basis: 'Art. 331' },
      { n: 2, name: 'Identificación del auto suplicado', mandatory: true, basis: 'Art. 331' },
      { n: 3, name: 'Razones de inconformidad', mandatory: true, basis: 'Art. 331' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html#331'
  },
  {
    id: 'civil/recurso-de-queja',
    exactName: 'Recurso de queja',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 352 y 353',
    competentAuthority: 'El superior del juez que denegó la apelación o la casación',
    term: { status: 'VERIFICADO', description: 'El recurso de queja debe interponerse en subsidio del de reposición contra el auto que denegó la apelación o la casación (art. 353, inc. 1); el término es por tanto el de la reposición: verbalmente e inmediatamente si el auto se profiere en audiencia, o por escrito dentro de los tres (3) días siguientes al de la notificación cuando se profiere fuera de audiencia (art. 318, inc. 3). Cuando la denegación sea consecuencia de la reposición interpuesta por la parte contraria, la queja se interpone directamente dentro de la ejecutoria de ese auto (art. 353, inc. 1; la ejecutoria de las providencias dictadas fuera de audiencia se produce tres (3) días después de notificadas, art. 302, inc. 3). Remitidas las copias al superior, el escrito se mantiene tres (3) días en secretaría a disposición de la otra parte y surtido el traslado se decide (art. 353, inc. 3).' },
    requiredSections: [
      { n: 1, name: 'Reposición previa contra el auto que denegó el recurso', mandatory: true, basis: 'Art. 353' },
      { n: 2, name: 'Interposición subsidiaria de la queja', mandatory: true, basis: 'Art. 353' },
      { n: 3, name: 'Razones por las cuales el recurso denegado era procedente', mandatory: true, basis: 'Art. 352' },
      { n: 4, name: 'Copias necesarias para el trámite ante el superior', mandatory: true, basis: 'Art. 353' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/interposicion-del-recurso-extraordinario-de-casacion',
    exactName: 'Interposición del recurso extraordinario de casación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 336 y 337',
    competentAuthority: 'Se interpone ante el tribunal; lo resuelve la Sala de Casación Civil de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días siguientes a la notificación de la sentencia. Si se pidió adición, corrección o aclaración, el término corre desde el día siguiente al de la notificación de la providencia respectiva (art. 337). Barrera de legitimación que la ficha omite y que se decide mucho antes de los cinco (5) días: "No podrá interponer el recurso quien no apeló de la sentencia de primer grado, cuando la proferida por el tribunal hubiere sido exclusivamente confirmatoria de aquella" (art. 337). Quien no apeló en primera instancia ya no tiene casación contra la sentencia confirmatoria, por oportuno que sea el escrito.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia recurrida', mandatory: true, basis: 'Art. 337' },
      { n: 2, name: 'Manifestación de interponer el recurso de casación', mandatory: true, basis: 'Art. 337' },
      { n: 3, name: 'Acreditación del interés para recurrir', mandatory: true, basis: 'Art. 337' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html#337'
  },
  {
    id: 'civil/demanda-de-casacion',
    exactName: 'Demanda de casación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 343 y 344',
    competentAuthority: 'Sala de Casación Civil de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días de traslado común, contados desde el auto que admite el recurso; vencidos sin presentarla, se declara desierto el recurso (art. 343). Regla que la ficha omite y que es la que más recursos hace desertar: el término de treinta (30) días "no se interrumpirá por el cambio de apoderado, ni por su renuncia o la sustitución del poder" (art. 343). El reloj corre contra el recurrente aunque cambie de abogado dentro del traslado.' },
    requiredSections: [
      { n: 1, name: 'Designación de las partes', mandatory: true, basis: 'Art. 344' },
      { n: 2, name: 'Síntesis del proceso y de los hechos materia del litigio', mandatory: true, basis: 'Art. 344' },
      { n: 3, name: 'Formulación de los cargos, separada y numeradamente', mandatory: true, basis: 'Art. 344' },
      { n: 4, name: 'Causal de casación invocada para cada cargo', mandatory: true, basis: 'Arts. 336 y 344' },
      { n: 5, name: 'Normas de derecho sustancial que se estiman violadas', mandatory: true, basis: 'Art. 344' },
      { n: 6, name: 'Demostración del cargo', mandatory: true, basis: 'Art. 344' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html#343'
  },
  {
    id: 'civil/recurso-extraordinario-de-revision',
    exactName: 'Recurso extraordinario de revisión',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 354 a 356',
    competentAuthority: 'La Corte Suprema de Justicia o el tribunal superior, según quién dictó la sentencia (art. 354)',
    term: { status: 'VERIFICADO', description: 'Dos (2) años siguientes a la ejecutoria de la sentencia para las causales 1, 6, 8 y 9. Para la causal 7 el término corre desde que el perjudicado conoce la sentencia, sin exceder cinco (5) años (art. 356). Dos reglas del art. 356 que la ficha omite y que mueven la fecha en que caduca el recurso. Primera, a favor del recurrente: cuando la sentencia debe inscribirse en un registro público, los términos de dos (2) y cinco (5) años "sólo comenzarán a correr a partir de la fecha de la inscripción". Segunda: para las causales 2, 3, 4 y 5 (documentos declarados falsos, falso testimonio, dictamen de perito condenado, violencia o cohecho) rige el mismo término de dos (2) años contados desde la ejecutoria de la sentencia, y si el proceso penal no ha terminado se suspende la sentencia de revisión hasta la ejecutoria del fallo penal, sin que esa suspensión pueda exceder de dos (2) años. El recurso debe interponerse dentro de los dos años aunque el proceso penal siga en curso: esperar el fallo penal para presentarlo hace perder el término.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia impugnada y de las partes', mandatory: true, basis: 'Art. 355' },
      { n: 2, name: 'Causal de revisión invocada entre las nueve del art. 355', mandatory: true, basis: 'Art. 355' },
      { n: 3, name: 'Hechos que configuran la causal', mandatory: true, basis: 'Art. 355' },
      { n: 4, name: 'Pruebas que se acompañan o se solicitan', mandatory: true, basis: 'Art. 355' },
      { n: 5, name: 'Caución para responder por perjuicios, cuando la ley la exija', mandatory: false, basis: 'Art. 357' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr012.html#356'
  },
  {
    id: 'civil/solicitud-de-aclaracion-de-providencia',
    exactName: 'Solicitud de aclaración de providencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 285',
    competentAuthority: 'El mismo juez que profirió la providencia',
    term: { status: 'VERIFICADO', description: 'Dentro del término de ejecutoria de la providencia (art. 285). La ejecutoria de las providencias dictadas fuera de audiencia se cumple tres (3) días después de notificadas (art. 302). Efecto de la solicitud sobre los demás plazos, que la ficha omite: pedida la aclaración, la providencia "solo quedará ejecutoriada una vez resuelta la solicitud" (art. 302), de modo que los términos para recurrir no corren mientras esté pendiente. Correlativamente, el art. 337 hace contar los cinco (5) días de casación desde la notificación de la providencia que resuelve la aclaración. Límite material: la aclaración solo procede sobre conceptos o frases que ofrezcan verdadero motivo de duda "siempre que estén contenidas en la parte resolutiva de la sentencia o influyan en ella" (art. 285); pedirla sobre la parte motiva no suspende nada porque será rechazada. La providencia que resuelve la aclaración no admite recursos, pero dentro de su ejecutoria pueden interponerse los que procedan contra la providencia aclarada.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia y de su notificación', mandatory: true, basis: 'Art. 285' },
      { n: 2, name: 'Señalamiento del concepto o frase que ofrece verdadero motivo de duda', mandatory: true, basis: 'Art. 285' },
      { n: 3, name: 'Demostración de que está en la parte resolutiva o influye en ella', mandatory: true, basis: 'Art. 285' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr009.html#285'
  },
  {
    id: 'civil/solicitud-de-adicion-de-providencia',
    exactName: 'Solicitud de adición de providencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 287',
    competentAuthority: 'El mismo juez que profirió la providencia',
    term: { status: 'VERIFICADO', description: 'Dentro del término de ejecutoria de la providencia (art. 287). La ficha remite al "término de ejecutoria" sin decir cuánto dura: las providencias dictadas fuera de audiencia quedan ejecutoriadas tres (3) días después de notificadas (art. 302), y las dictadas en audiencia quedan ejecutoriadas una vez notificadas cuando no se impugnan o no admiten recursos, de modo que la adición debe pedirse en el acto. La misma regla y el mismo plazo se aplican a los autos (art. 287). Efecto que la ficha omite: dentro del término de ejecutoria de la providencia que resuelve la complementación puede recurrirse también la providencia principal (art. 287), y el art. 322 num. 2 permite apelar la principal dentro de la ejecutoria de la complementaria o de la que niega la adición.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia', mandatory: true, basis: 'Art. 287' },
      { n: 2, name: 'Señalamiento del extremo de la litis o punto omitido', mandatory: true, basis: 'Art. 287' },
      { n: 3, name: 'Petición de sentencia o auto complementario', mandatory: true, basis: 'Art. 287' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr009.html#287'
  },
  {
    id: 'civil/solicitud-de-correccion-de-errores-aritmeticos',
    exactName: 'Solicitud de corrección de errores aritméticos',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 286',
    competentAuthority: 'El mismo juez que profirió la providencia',
    term: { status: 'NO_CADUCA', description: 'Toda providencia en que se haya incurrido en error puramente aritmético puede ser corregida por el juez que la dictó en cualquier tiempo, de oficio o a solicitud de parte, mediante auto (art. 286, inc. 1): la solicitud no caduca. Si la corrección se hace luego de terminado el proceso, el auto se notifica por aviso (art. 286, inc. 2). La misma regla se aplica al error por omisión, cambio o alteración de palabras contenidas en la parte resolutiva o que influyan en ella (art. 286, inc. 3).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia', mandatory: true, basis: 'Art. 286' },
      { n: 2, name: 'Señalamiento del error puramente aritmético, de nombre o de cita', mandatory: true, basis: 'Art. 286' },
      { n: 3, name: 'Indicación del texto correcto', mandatory: true, basis: 'Art. 286' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/solicitud-de-nulidad-procesal',
    exactName: 'Solicitud de nulidad procesal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 133 a 138',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Las nulidades pueden alegarse en cualquiera de las instancias antes de que se dicte sentencia, o con posterioridad a esta si ocurrieren en ella (art. 134, inc. 1); las de indebida representación, falta de notificación o emplazamiento en legal forma, o la originada en la sentencia contra la que no procede recurso, pueden alegarse además en la diligencia de entrega, como excepción en la ejecución de la sentencia o mediante recurso de revisión, y en el proceso ejecutivo incluso después de la orden de seguir adelante la ejecución mientras no haya terminado (art. 134, incs. 2 y 3). Puesta la nulidad en conocimiento de la parte afectada, si dentro de los tres (3) días siguientes al de la notificación no la alega, queda saneada (art. 137, texto corregido por el art. 4 del Decreto 1736 de 2012). La nulidad originada en la interrupción o suspensión del proceso se sanea si no se alega dentro de los cinco (5) días siguientes a la fecha en que cese la causa (art. 136, num. 3).' },
    requiredSections: [
      { n: 1, name: 'Causal de nulidad invocada entre las taxativas del art. 133', mandatory: true, basis: 'Art. 133' },
      { n: 2, name: 'Hechos en que se fundamenta', mandatory: true, basis: 'Art. 135' },
      { n: 3, name: 'Acreditación del interés para proponerla y de que no se saneó', mandatory: true, basis: 'Arts. 135 y 136' },
      { n: 4, name: 'Pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 135' },
      { n: 5, name: 'Petición de invalidez de lo actuado y de rehacer la actuación', mandatory: true, basis: 'Art. 138' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/demanda-de-declaracion-de-pertenencia',
    exactName: 'Demanda de declaración de pertenencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 375',
    competentAuthority: 'Juez civil del circuito o municipal del lugar de ubicación del inmueble',
    term: { status: 'VERIFICADO', description: 'Un (1) mes para contestar, contado desde la inclusión del proceso en el Registro Nacional de Procesos de Pertenencia (art. 375). El mes que publica la ficha es el reloj de los EMPLAZADOS (personas indeterminadas y demandados de dirección ignorada), no el de todos los demandados. El demandado cierto —el titular de derecho real que figura en el certificado del registrador y contra quien debe dirigirse la demanda (art. 375 num. 5)— se rige por el traslado del proceso verbal: veinte (20) días (art. 369). Reloj de un tercero, no del cliente: el registrador de instrumentos públicos debe responder la petición del certificado dentro de quince (15) días (art. 375 num. 5), plazo que hay que anticipar al preparar la demanda. Reloj propio del demandado que alega la prescripción por vía de excepción: debe cumplir los numerales 5, 6 y 7, y si a los treinta (30) días del vencimiento del traslado de la demanda no ha cumplido lo de los numerales 6 y 7, el proceso sigue su curso pero en la sentencia no podrá declararse la pertenencia (art. 375 parágrafo 1).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación precisa del bien: linderos, cabida y ubicación', mandatory: true, basis: 'Art. 375' },
      { n: 3, name: 'Hechos de la posesión: acto de aprehensión, tiempo y ánimo de señor y dueño', mandatory: true, basis: 'Art. 375' },
      { n: 4, name: 'Certificado del registrador sobre titulares de derechos reales principales', mandatory: true, basis: 'Art. 375' },
      { n: 5, name: 'Demanda dirigida contra el titular inscrito, y citación del acreedor hipotecario o prendario', mandatory: true, basis: 'Art. 375' },
      { n: 6, name: 'Fotografías del inmueble y compromiso de instalar la valla informativa', mandatory: true, basis: 'Art. 375' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr013.html#375'
  },
  {
    id: 'civil/demanda-de-restitucion-de-inmueble-arrendado',
    exactName: 'Demanda de restitución de inmueble arrendado',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 384',
    competentAuthority: 'Juez civil municipal o del circuito del lugar del inmueble',
    term: { status: 'VERIFICADO', description: 'Se tramita como proceso verbal: admitida la demanda se corre traslado al demandado por veinte (20) días (arts. 368 y 369), y si no se opone dentro de ese término el juez profiere sentencia ordenando la restitución (art. 384 num. 3). Cuando la única causal invocada es la mora en el pago del canon, el proceso es de única instancia (art. 384 num. 9). Reloj del demandante, antes de demandar: desde el 30 de diciembre de 2022 la conciliación extrajudicial SÍ es requisito de procedibilidad, porque el art. 146 de la Ley 2220 de 2022 derogó el inciso del art. 384 num. 6 que eximía de agotarla; demandar sin agotarla lleva a inadmisión (art. 90 num. 7). Reloj del demandado: si la demanda se funda en falta de pago, no será oído hasta que consigne a órdenes del juzgado el valor total de los cánones y demás conceptos adeudados, o presente los recibos de pago de los tres (3) últimos períodos, y debe seguir consignando los cánones que se causen durante el proceso en ambas instancias (art. 384 num. 4). Reloj del demandante tras la sentencia: las medidas cautelares se levantan si no promueve la ejecución en el mismo expediente dentro de los treinta (30) días siguientes a la ejecutoria de la sentencia, o del auto que aprueba las costas, o de la notificación del auto que ordena obedecer lo dispuesto por el superior (art. 384 num. 7).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Prueba del contrato de arrendamiento', mandatory: true, basis: 'Art. 384' },
      { n: 3, name: 'Causal de restitución invocada', mandatory: true, basis: 'Art. 384' },
      { n: 4, name: 'Cuando la causal es la mora: manifestación bajo juramento sobre los cánones adeudados', mandatory: true, basis: 'Art. 384 num. 2' },
      { n: 5, name: 'Solicitud de embargo y secuestro, cuando proceda', mandatory: false, basis: 'Art. 384' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr013.html#384'
  },
  {
    id: 'civil/demanda-de-rendicion-provocada-de-cuentas',
    exactName: 'Demanda de rendición provocada de cuentas',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 379',
    competentAuthority: 'Juez civil municipal o del circuito, según la cuantía',
    term: { status: 'VERIFICADO', description: 'El artículo 379 no fija por sí mismo el término de traslado de la demanda: remite al “término del traslado de la demanda”, dentro del cual el demandado debe oponerse a rendir las cuentas u objetar la estimación (art. 379 num. 2). De las cuentas rendidas se da traslado al demandante por el término de diez (10) días (art. 379 num. 5); si en la sentencia se ordena la rendición, el juez señala un término prudencial para presentarlas y, si el demandado no las presenta, se ordena pagar lo estimado en la demanda (art. 379 nums. 4 y 6).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Indicación de la obligación de rendir cuentas y su fuente', mandatory: true, basis: 'Art. 379' },
      { n: 3, name: 'Período respecto del cual se piden las cuentas', mandatory: true, basis: 'Art. 379' },
      { n: 4, name: 'Estimación razonada de lo que se considere debido', mandatory: false, basis: 'Art. 379' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/demanda-de-pago-por-consignacion',
    exactName: 'Demanda de pago por consignación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 381',
    competentAuthority: 'Juez civil municipal o del circuito, según la cuantía',
    term: { status: 'VERIFICADO', description: 'Si el demandado no se opone, el demandante debe depositar a órdenes del juzgado lo ofrecido dentro de los cinco (5) días siguientes al vencimiento del término del traslado (art. 381 num. 2). Si al contestar la demanda el demandado se opone a recibir el pago, el juez ordena por auto que no admite recurso que la consignación se haga en el término de cinco (5) días (art. 381 num. 3). Vencido el plazo sin efectuarse la consignación, el juez niega las pretensiones mediante sentencia que no admite apelación (art. 381 num. 2).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación de la obligación cuyo pago se ofrece', mandatory: true, basis: 'Art. 381' },
      { n: 3, name: 'Prueba de la oferta de pago o de la negativa del acreedor a recibirlo', mandatory: true, basis: 'Art. 381' },
      { n: 4, name: 'Constancia de consignación a órdenes del juzgado', mandatory: true, basis: 'Art. 381' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/demanda-de-impugnacion-de-actos-de-asambleas-juntas-directivas-o-de-socios',
    exactName: 'Demanda de impugnación de actos de asambleas, juntas directivas o de socios',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 382',
    competentAuthority: 'Juez civil del circuito del domicilio de la persona jurídica',
    term: { status: 'VERIFICADO', description: 'La demanda solo puede proponerse, so pena de caducidad, dentro de los dos (2) meses siguientes a la fecha del acto respectivo; si se trata de acuerdos o actos sujetos a registro, el término se cuenta desde la fecha de la inscripción (art. 382).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación del acto impugnado y de la reunión en que se adoptó', mandatory: true, basis: 'Art. 382' },
      { n: 3, name: 'Causal de nulidad o ineficacia invocada', mandatory: true, basis: 'Art. 382' },
      { n: 4, name: 'Copia del acta correspondiente', mandatory: true, basis: 'Art. 382' },
      { n: 5, name: 'Solicitud de suspensión del acto impugnado', mandatory: false, basis: 'Art. 382' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/demanda-divisoria',
    exactName: 'Demanda divisoria',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 406 a 411',
    competentAuthority: 'Juez civil municipal o del circuito del lugar del bien',
    term: { status: 'VERIFICADO', description: 'En el auto admisorio de la demanda se ordena correr traslado al demandado por diez (10) días (art. 409). Los motivos que configuren excepciones previas deben alegarse mediante recurso de reposición contra el auto admisorio (art. 409).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Prueba de la titularidad de la cuota sobre el bien común', mandatory: true, basis: 'Art. 406' },
      { n: 3, name: 'Identificación del bien y de todos los comuneros', mandatory: true, basis: 'Art. 406' },
      { n: 4, name: 'Petición de división material o de venta', mandatory: true, basis: 'Art. 406' },
      { n: 5, name: 'Certificado de tradición del inmueble', mandatory: true, basis: 'Art. 406' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/demanda-de-deslinde-y-amojonamiento',
    exactName: 'Demanda de deslinde y amojonamiento',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 400 a 405',
    competentAuthority: 'Juez civil municipal del lugar de ubicación del inmueble',
    term: { status: 'VERIFICADO', description: 'De la demanda de deslinde y amojonamiento se corre traslado al demandado por tres (3) días (art. 402). Los hechos que constituyen excepciones previas, la cosa juzgada y la transacción solo pueden alegarse como fundamento del recurso de reposición contra el auto admisorio de la demanda (art. 402).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación de los predios y de la línea divisoria discutida', mandatory: true, basis: 'Art. 400' },
      { n: 3, name: 'Títulos de propiedad de los predios', mandatory: true, basis: 'Art. 400' },
      { n: 4, name: 'Certificados de tradición', mandatory: true, basis: 'Art. 400' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/demanda-de-expropiacion',
    exactName: 'Demanda de expropiación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 399',
    competentAuthority: 'Juez civil del circuito del lugar del bien',
    term: { status: 'VERIFICADO', description: 'La demanda de expropiación debe presentarse dentro de los tres (3) meses siguientes a la fecha en la cual quede en firme la resolución que ordena la expropiación, so pena de que dicha resolución y sus inscripciones pierdan fuerza ejecutoria sin necesidad de pronunciamiento judicial o administrativo alguno (art. 399 num. 2). De la demanda se corre traslado al demandado por el término de tres (3) días, sin que pueda proponer excepciones de ninguna clase (art. 399 num. 5).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Copia del acto administrativo que decretó la expropiación', mandatory: true, basis: 'Art. 399' },
      { n: 3, name: 'Identificación del bien y de los titulares de derechos reales', mandatory: true, basis: 'Art. 399' },
      { n: 4, name: 'Avalúo del bien', mandatory: true, basis: 'Art. 399' },
      { n: 5, name: 'Solicitud de entrega anticipada, cuando proceda', mandatory: false, basis: 'Art. 399' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/demanda-de-proceso-de-sucesion',
    exactName: 'Demanda de proceso de sucesión',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 488 y siguientes',
    competentAuthority: 'Juez de familia o civil del último domicilio del causante',
    term: { status: 'NO_CADUCA', description: 'La apertura del proceso de sucesión puede pedirse desde el fallecimiento del causante y el artículo 488 no fija término alguno para presentar la demanda: no caduca. Los acreedores pueden hacer valer sus créditos dentro del proceso hasta que termine la diligencia de inventario (art. 491 num. 2), y el reconocimiento de herederos, legatarios, cesionarios, cónyuge o compañero permanente puede pedirse desde que se declare abierto el proceso y hasta antes de la ejecutoria de la sentencia aprobatoria de la última partición o adjudicación (art. 491 num. 3).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Registro civil de defunción del causante', mandatory: true, basis: 'Art. 489' },
      { n: 3, name: 'Prueba del estado civil que legitima al solicitante', mandatory: true, basis: 'Art. 489' },
      { n: 4, name: 'Inventario de los bienes relictos', mandatory: true, basis: 'Art. 501' },
      { n: 5, name: 'Testamento, cuando la sucesión sea testada', mandatory: false, basis: 'Art. 489' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/solicitud-de-amparo-de-pobreza',
    exactName: 'Solicitud de amparo de pobreza',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 151 a 158',
    competentAuthority: 'El juez que conoce o conocerá del proceso',
    term: { status: 'VERIFICADO', description: 'El amparo de pobreza puede solicitarse por el presunto demandante antes de la presentación de la demanda, o por cualquiera de las partes durante el curso del proceso (art. 152, inc. 1): la norma no fija un plazo perentorio de solicitud. Los términos que sí establece son: tres (3) días siguientes a la comunicación de la designación para que el apoderado designado acepte o presente prueba del motivo de rechazo, y tres (3) días para manifestar impedimento (art. 154, incs. 3 y 5); treinta (30) días siguientes a la aceptación del apoderado designado para presentar la demanda, si se quiere conservar el efecto interruptivo de la prescripción e impeditivo de la caducidad que produce la solicitud presentada antes de la demanda, cumpliendo el art. 94 (art. 154, inc. 6); y traslado de tres (3) días a la parte contraria para resolver la solicitud de terminación del amparo (art. 158).' },
    requiredSections: [
      { n: 1, name: 'Afirmación bajo juramento de que no se está en capacidad de atender los gastos del proceso', mandatory: true, basis: 'Art. 152' },
      { n: 2, name: 'Indicación del proceso en que se solicita', mandatory: true, basis: 'Art. 152' },
      { n: 3, name: 'Petición de designación de apoderado, cuando se requiera', mandatory: false, basis: 'Art. 154' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/solicitud-de-prueba-extraprocesal',
    exactName: 'Solicitud de prueba extraprocesal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 183 a 190',
    competentAuthority: 'Juez civil municipal, o notario en los casos permitidos',
    term: { status: 'VERIFICADO', description: 'Las pruebas extraprocesales se practican con observancia de las reglas de citación y práctica del código; cuando se soliciten con citación de la contraparte, la notificación personal a esta debe hacerse, conforme a los arts. 291 y 292, con no menos de cinco (5) días de antelación a la fecha de la respectiva diligencia (art. 183, inc. 2). El art. 183 no fija plazo para presentar la solicitud. En la declaración sobre documentos, el citado que no concurra dispone de los tres (3) días siguientes a la fecha señalada para probar siquiera sumariamente que su inasistencia obedeció a causa justificada, caso en el cual el juez señala nueva fecha por una sola vez (art. 185, inc. 6).' },
    requiredSections: [
      { n: 1, name: 'Identificación de quien solicita y de la persona contra quien se pretende hacer valer', mandatory: true, basis: 'Art. 184' },
      { n: 2, name: 'Indicación de la prueba que se pide practicar', mandatory: true, basis: 'Art. 183' },
      { n: 3, name: 'Objeto o finalidad de la prueba', mandatory: true, basis: 'Art. 183' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/desistimiento-de-las-pretensiones',
    exactName: 'Desistimiento de las pretensiones',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 314',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El demandante puede desistir de las pretensiones mientras no se haya pronunciado sentencia que ponga fin al proceso (art. 314, inc. 1). Presentado ante el superior por haber interpuesto el demandante apelación de la sentencia o casación, se entiende que comprende el desistimiento del recurso. El artículo no fija plazo en días: el límite temporal es la sentencia que pone fin al proceso.' },
    requiredSections: [
      { n: 1, name: 'Manifestación expresa e incondicional de desistir', mandatory: true, basis: 'Art. 314' },
      { n: 2, name: 'Identificación de las pretensiones de las que se desiste', mandatory: true, basis: 'Art. 314' },
      { n: 3, name: 'Facultad expresa del apoderado para desistir', mandatory: true, basis: 'Art. 77' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/solicitud-de-acumulacion-de-procesos',
    exactName: 'Solicitud de acumulación de procesos',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 148 y 149',
    competentAuthority: 'El juez que conoce del proceso más antiguo',
    term: { status: 'VERIFICADO', description: 'En los procesos declarativos las acumulaciones de procesos y de demandas proceden hasta antes de señalarse fecha y hora para la audiencia inicial (art. 148, num. 3, inc. 1). Decretada la acumulación, cuando el demandado ya esté notificado, este puede solicitar en la secretaría que se le suministre la reproducción de la demanda y sus anexos dentro de los tres (3) días siguientes, vencidos los cuales comienza a correr el término de ejecutoria y el de traslado de la demanda que estaba pendiente de notificación (art. 148, num. 3). La acumulación de demandas y de procesos ejecutivos se rige por los arts. 463 y 464 por remisión expresa del art. 148, num. 3, inc. final.' },
    requiredSections: [
      { n: 1, name: 'Identificación de los procesos cuya acumulación se pide', mandatory: true, basis: 'Art. 148' },
      { n: 2, name: 'Causal de acumulación invocada', mandatory: true, basis: 'Art. 148' },
      { n: 3, name: 'Prueba de la existencia y estado de los procesos', mandatory: true, basis: 'Art. 149' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/auto-admisorio-de-la-demanda',
    exactName: 'Auto admisorio de la demanda',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 90 y 369',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Admitida la demanda en proceso verbal, se corre traslado al demandado por veinte (20) días (art. 369). Los veinte (20) días son el reloj del DEMANDADO. Reloj del JUZGADO, que la ficha calla y que le sirve al demandante para reclamar: dentro de los treinta (30) días siguientes a la presentación de la demanda debe notificársele el auto admisorio, el mandamiento de pago o el auto de rechazo; si vence sin notificarse, el plazo de duración del proceso del art. 121 se computa desde el día siguiente a la presentación de la demanda (art. 90). Carga del demandado dentro del mismo traslado: aportar los documentos que estén en su poder y que el demandante haya solicitado, según se le ordene en el auto admisorio (art. 90).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los requisitos de la demanda y de sus anexos', mandatory: true, basis: 'Arts. 82 y 84' },
      { n: 2, name: 'Declaración de admisión', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Orden de traslado al demandado con indicación del término', mandatory: true, basis: 'Art. 369' },
      { n: 4, name: 'Orden de notificación personal', mandatory: true, basis: 'Art. 291' },
      { n: 5, name: 'Pronunciamiento sobre las medidas cautelares solicitadas', mandatory: false, basis: 'Art. 590' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html#90'
  },
  {
    id: 'civil/auto-inadmisorio-de-la-demanda',
    exactName: 'Auto inadmisorio de la demanda',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 90',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Se concede al demandante un término de cinco (5) días para subsanar, so pena de rechazo (art. 90). Regla que la ficha omite y que hace perder los cinco (5) días a quien intenta recurrir: el auto que declara inadmisible la demanda es "no susceptible de recursos" (art. 90). La única conducta útil es subsanar dentro del término. Solo el auto de RECHAZO es apelable, y ese recurso comprende el que negó la admisión; la apelación se concede en el efecto suspensivo y se resuelve de plano (art. 90). La inadmisión solo procede por las siete causales taxativas del art. 90.' },
    requiredSections: [
      { n: 1, name: 'Señalamiento preciso de cada defecto, entre las causales taxativas del art. 90', mandatory: true, basis: 'Art. 90' },
      { n: 2, name: 'Concesión del término de cinco (5) días para subsanar', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Advertencia de rechazo en caso de no subsanarse', mandatory: true, basis: 'Art. 90' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html#90'
  },
  {
    id: 'civil/auto-de-rechazo-de-la-demanda',
    exactName: 'Auto de rechazo de la demanda',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 90',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Dentro de los treinta (30) días siguientes a la fecha de presentación de la demanda debe notificarse al demandante el auto admisorio, el mandamiento de pago o el auto que la rechace; vencido ese plazo sin notificación, el término del artículo 121 se computa desde el día siguiente a la presentación (art. 90). El rechazo procede por falta de jurisdicción o de competencia, por estar vencido el término de caducidad para instaurar la demanda, o por no haberse subsanado dentro de los cinco (5) días concedidos en el auto inadmisorio (art. 90).' },
    requiredSections: [
      { n: 1, name: 'Motivo del rechazo: falta de jurisdicción, competencia, caducidad o no subsanación', mandatory: true, basis: 'Art. 90' },
      { n: 2, name: 'Orden de devolución de los anexos sin necesidad de desglose', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Orden de remisión al juez competente, cuando el rechazo obedezca a falta de jurisdicción o competencia', mandatory: false, basis: 'Art. 90' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/mandamiento-de-pago',
    exactName: 'Mandamiento de pago',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 422, 430 y 442',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'VERIFICADO', description: 'Notificado el mandamiento ejecutivo, el ejecutado dispone de diez (10) días para proponer excepciones de mérito (art. 442 num. 1). Los diez (10) días son el reloj del EJECUTADO. Reloj del EJECUTANTE, que la ficha calla y que es el que puede extinguir su crédito: si por reposición se revoca el mandamiento de pago por ausencia de los requisitos del título, tiene cinco (5) días desde la ejecutoria de ese auto para presentar demanda declarativa en el mismo expediente; solo presentándola en tiempo conserva la interrupción de la prescripción y la inoperancia de la caducidad generadas por el proceso ejecutivo (art. 430). Vencido el plazo, la demanda solo puede formularse en proceso separado, sin ese efecto conservativo. Regla de preclusión para el ejecutado: los requisitos formales del título solo pueden discutirse por reposición contra el mandamiento; no podrán reconocerse ni declararse después en la sentencia ni en el auto que ordena seguir adelante la ejecución (art. 430).' },
    requiredSections: [
      { n: 1, name: 'Verificación de que el título presta mérito ejecutivo: obligación clara, expresa y exigible', mandatory: true, basis: 'Art. 422' },
      { n: 2, name: 'Orden de pago con determinación de capital, intereses y plazo', mandatory: true, basis: 'Art. 430' },
      { n: 3, name: 'Advertencia del término para proponer excepciones', mandatory: true, basis: 'Art. 442' },
      { n: 4, name: 'Pronunciamiento sobre las medidas cautelares solicitadas', mandatory: false, basis: 'Art. 599' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html#430'
  },
  {
    id: 'civil/auto-que-resuelve-excepciones-previas',
    exactName: 'Auto que resuelve excepciones previas',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 101',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Del escrito que contiene las excepciones previas se corre traslado al demandante por el término de tres (3) días conforme al artículo 110 (art. 101 num. 1). El juez decide las excepciones previas que no requieran práctica de pruebas antes de la audiencia inicial; cuando se requiera practicar pruebas, cita a la audiencia inicial y en ella las practica y resuelve las excepciones (art. 101 num. 2).' },
    requiredSections: [
      { n: 1, name: 'Identificación de cada excepción propuesta', mandatory: true, basis: 'Art. 101' },
      { n: 2, name: 'Análisis probatorio de los hechos que las fundan', mandatory: true, basis: 'Art. 101' },
      { n: 3, name: 'Decisión sobre cada excepción y sus efectos', mandatory: true, basis: 'Art. 101' },
      { n: 4, name: 'Concesión de término para subsanar, cuando el defecto sea subsanable', mandatory: false, basis: 'Art. 101' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/auto-que-decreta-medidas-cautelares',
    exactName: 'Auto que decreta medidas cautelares',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 590',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El artículo 590 no fija plazo para proferir el auto que decreta la medida. La caución previa equivale al veinte por ciento (20%) del valor de las pretensiones estimadas en la demanda, salvo los embargos y secuestros posteriores a sentencia favorable de primera instancia (art. 590 num. 2). Las medidas de los literales b) y c) del numeral 1 se levantan si el demandante no promueve la ejecución dentro del término a que se refiere el artículo 306 (art. 590 par. 2), esto es, dentro de los treinta (30) días siguientes a la ejecutoria de la sentencia o a la notificación del auto de obedecimiento a lo resuelto por el superior (art. 306).' },
    requiredSections: [
      { n: 1, name: 'Apreciación de la apariencia de buen derecho y del interés para obrar', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 2, name: 'Juicio de necesidad, efectividad y proporcionalidad de la medida', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 3, name: 'Determinación de la medida y de los bienes sobre los que recae', mandatory: true, basis: 'Art. 590' },
      { n: 4, name: 'Fijación de la caución, cuando proceda', mandatory: false, basis: 'Art. 590 par.' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/sentencia-de-primera-instancia-en-proceso-declarativo',
    exactName: 'Sentencia de primera instancia en proceso declarativo',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 121, 278 a 280 y 373',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'No podrá transcurrir un lapso superior a un (1) año para dictar sentencia de primera o única instancia, contado desde la notificación del auto admisorio al demandado (art. 121). El año del art. 121 es el reloj del JUEZ, no del cliente: su vencimiento le hace perder automáticamente competencia y lo obliga a remitir el expediente al que le sigue en turno, que dispone de hasta seis (6) meses; además el juez puede prorrogarlo por una sola vez hasta por seis (6) meses más mediante auto que no admite recurso. Reloj del CLIENTE frente a esta sentencia: si se profiere oralmente en audiencia, la apelación se interpone verbalmente en el acto y los reparos concretos se precisan en ese momento o dentro de los tres (3) días siguientes a la finalización de la audiencia; si se dicta por fuera de audiencia, dentro de los tres (3) días siguientes a su notificación (arts. 322 y 373). Si solo se anuncia el sentido del fallo, la decisión escrita debe emitirse dentro de los diez (10) días siguientes (art. 373 num. 5).' },
    requiredSections: [
      { n: 1, name: 'Síntesis de la demanda y de su contestación', mandatory: true, basis: 'Art. 280' },
      { n: 2, name: 'Motivación: examen crítico de las pruebas y razonamientos legales', mandatory: true, basis: 'Art. 280' },
      { n: 3, name: 'Decisión expresa y clara sobre cada pretensión', mandatory: true, basis: 'Art. 281' },
      { n: 4, name: 'Resolución sobre las excepciones de mérito propuestas', mandatory: true, basis: 'Art. 282' },
      { n: 5, name: 'Congruencia con los hechos y pretensiones', mandatory: true, basis: 'Art. 281' },
      { n: 6, name: 'Condena en costas', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr004.html#121'
  },
  {
    id: 'civil/sentencia-de-segunda-instancia',
    exactName: 'Sentencia de segunda instancia',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 280, 328 y 121',
    competentAuthority: 'Tribunal superior o juez civil del circuito, según el caso',
    term: { status: 'VERIFICADO', description: 'El plazo para resolver la segunda instancia no podrá ser superior a seis (6) meses, contados desde la recepción del expediente en la secretaría (art. 121). Los seis (6) meses del art. 121 son el reloj del TRIBUNAL, no del cliente, y son prorrogables por una sola vez hasta por seis (6) meses más mediante auto que no admite recurso. Reloj del CLIENTE frente a la sentencia de segunda instancia: cinco (5) días para interponer el recurso extraordinario de casación, contados desde su notificación, o desde el día siguiente a la notificación de la providencia que resuelva la adición, corrección o aclaración pedida oportunamente (art. 337); y no puede interponerlo quien no apeló en primera instancia si la sentencia del tribunal fue exclusivamente confirmatoria.' },
    requiredSections: [
      { n: 1, name: 'Delimitación de la competencia del superior a los reparos formulados por el apelante', mandatory: true, basis: 'Art. 328' },
      { n: 2, name: 'Síntesis del proceso y de la sentencia apelada', mandatory: true, basis: 'Art. 280' },
      { n: 3, name: 'Motivación sobre cada reparo', mandatory: true, basis: 'Arts. 280 y 328' },
      { n: 4, name: 'Decisión: confirma, revoca o modifica', mandatory: true, basis: 'Art. 328' },
      { n: 5, name: 'Condena en costas de la instancia', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr004.html#121'
  },
  {
    id: 'civil/auto-que-ordena-seguir-adelante-la-ejecucion',
    exactName: 'Auto que ordena seguir adelante la ejecución',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 440',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'NO_CADUCA', description: 'El artículo 440 no señala plazo al juez para proferir este auto: no opera caducidad. Se dicta cuando el ejecutado no propone excepciones oportunamente, esto es, vencidos los diez (10) días siguientes a la notificación del mandamiento ejecutivo (art. 442 num. 1, al que remite la expresión “oportunamente” del art. 440). Cumplida la obligación dentro del término señalado en el mandamiento, el ejecutado puede pedir la exoneración de costas dentro de los tres (3) días siguientes a la notificación del auto que las impone (art. 440).' },
    requiredSections: [
      { n: 1, name: 'Constatación de que no se propusieron excepciones o de que fueron desestimadas', mandatory: true, basis: 'Art. 440' },
      { n: 2, name: 'Orden de seguir adelante la ejecución en la forma pedida', mandatory: true, basis: 'Art. 440' },
      { n: 3, name: 'Orden de practicar la liquidación del crédito', mandatory: true, basis: 'Arts. 440 y 446' },
      { n: 4, name: 'Orden de avalúo y remate de los bienes embargados', mandatory: true, basis: 'Art. 440' },
      { n: 5, name: 'Condena en costas', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/liquidacion-del-credito',
    exactName: 'Liquidación del crédito',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 446',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'VERIFICADO', description: 'Ejecutoriado el auto que ordena seguir adelante la ejecución, o notificada la sentencia que resuelve las excepciones cuando no sea totalmente favorable al ejecutado, cualquiera de las partes puede presentar la liquidación del crédito (art. 446, num. 1). De la liquidación presentada se corre traslado a la otra parte, en la forma prevista en el art. 110, por el término de tres (3) días, dentro del cual solo pueden formularse objeciones relativas al estado de cuenta, acompañando so pena de rechazo una liquidación alternativa (art. 446, num. 2). Vencido el traslado el juez decide por auto (art. 446, num. 3).' },
    requiredSections: [
      { n: 1, name: 'Especificación del capital y de los intereses causados', mandatory: true, basis: 'Art. 446' },
      { n: 2, name: 'Indicación de la tasa aplicada y del período liquidado', mandatory: true, basis: 'Art. 446' },
      { n: 3, name: 'Traslado a la parte contraria para objeciones', mandatory: true, basis: 'Art. 446' },
      { n: 4, name: 'Aprobación o modificación de la liquidación', mandatory: true, basis: 'Art. 446' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/auto-que-declara-la-nulidad-procesal',
    exactName: 'Auto que declara la nulidad procesal',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 137 y 138',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Puesta en conocimiento la nulidad no saneada, la parte afectada dispone de tres (3) días siguientes al de la notificación para alegarla; si no lo hace la nulidad queda saneada y el proceso continúa su curso, y solo si la alega el juez la declara (art. 137). Los artículos 137 y 138 no fijan plazo al juez para proferir el auto que declara la nulidad.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la causal de nulidad configurada', mandatory: true, basis: 'Art. 133' },
      { n: 2, name: 'Verificación de que la nulidad no fue saneada', mandatory: true, basis: 'Art. 136' },
      { n: 3, name: 'Determinación de la actuación afectada y de la que conserva validez', mandatory: true, basis: 'Art. 138' },
      { n: 4, name: 'Orden de rehacer la actuación anulada', mandatory: true, basis: 'Art. 138' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/constancia-de-ejecutoria',
    exactName: 'Constancia de ejecutoria',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 302',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'VERIFICADO', description: 'Las providencias proferidas en audiencia quedan ejecutoriadas una vez notificadas cuando no se impugnan o no admiten recursos; las dictadas fuera de audiencia, tres (3) dias despues de notificadas (art. 302). Falta el inciso 2 del art. 302, que desplaza la fecha de ejecutoria y con ella todos los plazos que dependen de ella: "cuando se pida aclaración o complementación de una providencia, solo quedará ejecutoriada una vez resuelta la solicitud". Falta también la tercera hipótesis del inciso final: la providencia dictada fuera de audiencia contra la que sí se interpusieron recursos no queda ejecutoriada a los tres días, sino cuando quede ejecutoriada la providencia que los resuelva. Contar tres días fijos desde la notificación en esos casos anticipa mal la ejecutoria y, con ella, el vencimiento de los términos de aclaración, adición, apelación y casación.' },
    requiredSections: [
      { n: 1, name: 'Identificacion del proceso y de la providencia', mandatory: true, basis: 'Art. 302' },
      { n: 2, name: 'Fecha y forma de su notificacion', mandatory: true, basis: 'Art. 302' },
      { n: 3, name: 'Constancia de que no se interpusieron recursos, o de que los interpuestos quedaron resueltos', mandatory: true, basis: 'Art. 302' },
      { n: 4, name: 'Fecha exacta en que quedo ejecutoriada', mandatory: true, basis: 'Art. 302' },
      { n: 5, name: 'Firma del secretario', mandatory: true, basis: 'Art. 302' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html#302'
  },
  {
    id: 'civil/estado-para-notificacion-de-providencias',
    exactName: 'Estado para notificacion de providencias',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 295',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'VERIFICADO', description: 'El estado se fija en lugar visible de la secretaria al comenzar la primera hora habil del respectivo dia y se desfija al finalizar la ultima hora habil del mismo dia (art. 295). Reforma vigente que la ficha no advierte: por el art. 9 de la Ley 2213 de 2022 —legislación permanente— las notificaciones por estado se fijan VIRTUALMENTE, con inserción de la providencia, sin necesidad de imprimirlas ni de que el secretario las firme ni deje constancia al pie; se exceptúan las providencias que decretan medidas cautelares, mencionan menores o están sujetas a reserva legal, que no se insertan en el estado electrónico. Los ejemplares de los estados virtuales se conservan en línea para consulta permanente. Dato que fija el arranque del cómputo y que la ficha omite: la inserción en el estado se hace "al día siguiente a la fecha de la providencia" (art. 295), y cuando se hayan habilitado sistemas de información de la gestión judicial la notificación por estado solo puede hacerse después de incorporar la información en dicho sistema.' },
    requiredSections: [
      { n: 1, name: 'Clase de proceso', mandatory: true, basis: 'Art. 295' },
      { n: 2, name: 'Nombres de las partes interesadas', mandatory: true, basis: 'Art. 295' },
      { n: 3, name: 'Fecha de la providencia que se notifica', mandatory: true, basis: 'Art. 295' },
      { n: 4, name: 'Fecha del estado y firma del secretario', mandatory: true, basis: 'Art. 295' },
      { n: 5, name: 'Publicacion por mensaje de datos cuando se disponga de los recursos tecnicos, sin impresion ni firma fisica', mandatory: false, basis: 'Art. 295' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html#295'
  },
  {
    id: 'civil/citacion-para-notificacion-personal',
    exactName: 'Citacion para notificacion personal',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 291',
    competentAuthority: 'Secretaria del juzgado; su entrega la apoya el citador',
    term: { status: 'VERIFICADO', description: 'El citado debe comparecer dentro de los cinco (5) dias siguientes a la entrega de la comunicacion en el lugar de destino si es en el mismo municipio del juzgado; diez (10) dias si es en municipio distinto; y treinta (30) dias si es en el exterior. Si no comparece, procede la notificacion por aviso (art. 291). Vía alternativa vigente que la ficha no contempla y que corre con otro calendario: por el art. 8 de la Ley 2213 de 2022 —legislación permanente— la notificación personal también puede hacerse enviando la providencia como mensaje de datos a la dirección electrónica que suministre el interesado, SIN citación ni aviso previos. En ese caso la notificación se entiende realizada una vez transcurridos DOS (2) DÍAS HÁBILES siguientes al envío del mensaje, y los términos empiezan a contarse cuando el iniciador reciba acuse de recibo o se constate por otro medio el acceso del destinatario. El interesado afirma bajo juramento que la dirección corresponde a la persona por notificar, informa cómo la obtuvo y allega las evidencias. Se aplica cualquiera sea la naturaleza de la actuación, incluidas las pruebas extraprocesales y los procesos declarativos, monitorios y ejecutivos. Reloj del notificado que discrepe: para alegar nulidad debe manifestar bajo juramento que no se enteró, además de cumplir los arts. 132 a 138 del CGP.' },
    requiredSections: [
      { n: 1, name: 'Identificacion del destinatario y de su direccion', mandatory: true, basis: 'Art. 291' },
      { n: 2, name: 'Informacion sobre la existencia del proceso, su naturaleza y la fecha de la providencia', mandatory: true, basis: 'Art. 291' },
      { n: 3, name: 'Termino para comparecer segun la ubicacion del destinatario', mandatory: true, basis: 'Art. 291' },
      { n: 4, name: 'Envio por servicio postal autorizado', mandatory: true, basis: 'Art. 291' },
      { n: 5, name: 'Constancia de entrega expedida por la empresa postal, para el expediente', mandatory: true, basis: 'Art. 291' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html#291'
  },
  {
    id: 'civil/aviso-de-notificacion',
    exactName: 'Aviso de notificacion',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 292',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'VERIFICADO', description: 'La notificacion por aviso se considera surtida al finalizar el dia siguiente al de la entrega del aviso en el lugar de destino (art. 292). Requisito de validez que la ficha omite: cuando se trata de auto admisorio de la demanda o de mandamiento ejecutivo, el aviso debe ir acompañado de copia informal de la providencia que se notifica (art. 292); sin ese anexo la notificación es atacable y el término no queda bien surtido. Vía alternativa vigente: por el art. 8 de la Ley 2213 de 2022 la notificación personal puede hacerse enviando la providencia como mensaje de datos sin necesidad de aviso previo, y se entiende realizada a los DOS (2) DÍAS HÁBILES siguientes al envío del mensaje, contándose los términos desde el acuse de recibo o desde que se constate el acceso del destinatario.' },
    requiredSections: [
      { n: 1, name: 'Fecha del aviso y fecha de la providencia que se notifica', mandatory: true, basis: 'Art. 292' },
      { n: 2, name: 'Juzgado, naturaleza del proceso y nombres de las partes', mandatory: true, basis: 'Art. 292' },
      { n: 3, name: 'Advertencia sobre los efectos de la notificacion', mandatory: true, basis: 'Art. 292' },
      { n: 4, name: 'Copia informal de la providencia, cuando se trate del auto admisorio o del mandamiento ejecutivo', mandatory: true, basis: 'Art. 292' },
      { n: 5, name: 'Comprobante de entrega de la empresa postal y copia sellada del aviso, incorporados al expediente', mandatory: true, basis: 'Art. 292' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html#292'
  },
  {
    id: 'civil/emplazamiento-y-remision-al-registro-nacional-de-personas-emplazadas',
    exactName: 'Emplazamiento y remision al Registro Nacional de Personas Emplazadas',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 108',
    competentAuthority: 'Secretaria del juzgado; el Registro lo administra el Consejo Superior de la Judicatura',
    term: { status: 'VERIFICADO', description: 'El emplazamiento se surte únicamente mediante la inclusión de la información en el Registro Nacional de Personas Emplazadas, sin necesidad de publicación en un medio escrito ni en otro medio masivo de comunicación (Ley 2213 de 2022, art. 10, legislación permanente). Se entiende surtido quince (15) días después de publicada la información en dicho registro (art. 108 CGP). Surtido el emplazamiento se procede a la designación de curador ad lítem, si a ello hubiere lugar. El Consejo Superior de la Judicatura administra el registro y debe permitir la consulta de la información por lo menos durante un (1) año contado desde la publicación del emplazamiento.' },
    requiredSections: [
      { n: 1, name: 'Nombre del sujeto emplazado', mandatory: true, basis: 'Art. 108' },
      { n: 2, name: 'Nombres de las partes, clase de proceso y juzgado que lo requiere', mandatory: true, basis: 'Art. 108' },
      { n: 3, name: 'Constancia de publicacion por una sola vez en medio escrito o de comunicacion masiva', mandatory: true, basis: 'Art. 108' },
      { n: 4, name: 'Remision de la informacion al Registro Nacional de Personas Emplazadas', mandatory: true, basis: 'Art. 108' },
      { n: 5, name: 'Computo de los quince (15) dias desde la publicacion en el Registro', mandatory: true, basis: 'Art. 108' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html#108'
  },
  {
    id: 'civil/constancia-de-traslado-en-secretaria',
    exactName: 'Constancia de traslado en secretaria',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 110',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'VERIFICADO', description: 'El traslado que deba surtirse fuera de audiencia se cumple en secretaria por tres (3) dias, sin necesidad de auto ni constancia en el expediente; se incluye en una lista que permanece a disposicion en la secretaria por un (1) dia, y el termino corre desde el dia siguiente (art. 110). Reforma vigente que cambia el cómputo: por el art. 9 de la Ley 2213 de 2022 —legislación permanente— los traslados que deban surtirse por fuera de audiencia pueden surtirse virtualmente, y su parágrafo dispone que cuando una parte acredite haber enviado el escrito a los demás sujetos procesales por canal digital "se prescindirá del traslado por Secretaría, el cual se entenderá realizado a los DOS (2) DÍAS HÁBILES siguientes al del envío del mensaje", empezando a correr el término respectivo cuando el iniciador reciba acuse de recibo o se constate el acceso del destinatario. En esa hipótesis no hay lista en secretaría ni el día de disposición del art. 110: quien espere la lista para empezar a contar llega tarde.' },
    requiredSections: [
      { n: 1, name: 'Identificacion del proceso y del escrito o memorial que se traslada', mandatory: true, basis: 'Art. 110' },
      { n: 2, name: 'Inclusion en la lista de traslados de la secretaria', mandatory: true, basis: 'Art. 110' },
      { n: 3, name: 'Fecha de inclusion y fecha de inicio del termino', mandatory: true, basis: 'Art. 110' },
      { n: 4, name: 'Advertencia: no requiere auto que lo ordene ni constancia en el expediente', mandatory: true, basis: 'Art. 110' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html#110'
  },
  {
    id: 'civil/constancia-secretarial-de-recibo-de-memorial',
    exactName: 'Constancia secretarial de recibo de memorial',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 109',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'VERIFICADO', description: 'El memorial es oportuno si se recibe antes del cierre del despacho del dia en que vence el termino. Cuando se ejercen recursos o facultades con terminos comunes, el secretario debe esperar a que el termino transcurra respecto de todas las partes (art. 109). Regla que la ficha omite y que puede salvar un término vencido: cuando el memorial se radica en centros administrativos, de apoyo, secretarías conjuntas, centros de radicación o similares con destino a un despacho determinado, "la presentación se entenderá realizada el día en que fue radicado el memorial en alguna de estas dependencias" (art. 109 parágrafo), no el día en que llega al juzgado. Los memoriales pueden presentarse y las comunicaciones transmitirse por cualquier medio idóneo, y las autoridades judiciales deben llevar control de los mensajes recibidos con fecha y hora de recepción.' },
    requiredSections: [
      { n: 1, name: 'Fecha y hora exactas de presentacion del memorial o comunicacion', mandatory: true, basis: 'Art. 109' },
      { n: 2, name: 'Identificacion de quien lo presenta y del proceso', mandatory: true, basis: 'Art. 109' },
      { n: 3, name: 'Constancia de agregacion al expediente respectivo', mandatory: true, basis: 'Art. 109' },
      { n: 4, name: 'Pronunciamiento sobre la oportunidad frente al vencimiento del termino', mandatory: true, basis: 'Art. 109' },
      { n: 5, name: 'Constancia del medio de presentacion, incluido el mensaje de datos', mandatory: true, basis: 'Art. 109' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html#109'
  },
  {
    id: 'civil/informe-secretarial',
    exactName: 'Informe secretarial',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, arts. 109 y 110',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'VERIFICADO', description: 'El art. 109 no fija un plazo en días sino un deber de inmediatez: el secretario hace constar la fecha y hora de presentación de los memoriales y comunicaciones que reciba, los agrega al expediente y los ingresa inmediatamente al despacho solo cuando el juez deba pronunciarse sobre ellos fuera de audiencia; cuando se trate del ejercicio de un recurso o de una facultad con término común, el secretario debe esperar a que este transcurra respecto de todas las partes antes de ingresar el expediente al despacho. Los memoriales se entienden presentados oportunamente si son recibidos antes del cierre del despacho del día en que vence el término (art. 109, incs. 1 y 4).' },
    requiredSections: [
      { n: 1, name: 'Identificacion del proceso y de la actuacion sobre la que se informa', mandatory: true, basis: null },
      { n: 2, name: 'Relacion cronologica de lo ocurrido en secretaria', mandatory: true, basis: null },
      { n: 3, name: 'Computo de los terminos transcurridos', mandatory: true, basis: 'Art. 118' },
      { n: 4, name: 'Constancia de lo que procede, para que el despacho resuelva', mandatory: true, basis: null },
      { n: 5, name: 'Firma del secretario', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/certificacion-de-terminos-procesales',
    exactName: 'Certificacion de terminos procesales',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, arts. 117 y 118',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'NO_CADUCA', description: 'Los artículos 117 y 118 no fijan término para expedir la certificación secretarial de términos: no opera caducidad. A falta de término legal para un acto, el juez señala el que estime necesario y puede prorrogarlo por una sola vez si la solicitud se formula antes del vencimiento (art. 117). En los términos de días no se cuentan los de vacancia judicial ni aquellos en que el juzgado permanezca cerrado (art. 118).' },
    requiredSections: [
      { n: 1, name: 'Identificacion del termino que se certifica y de la norma que lo fija', mandatory: true, basis: 'Art. 117' },
      { n: 2, name: 'Fecha desde la cual empezo a correr', mandatory: true, basis: 'Art. 118' },
      { n: 3, name: 'Dias habiles transcurridos y dias no habiles descontados', mandatory: true, basis: 'Art. 118' },
      { n: 4, name: 'Fecha exacta de vencimiento', mandatory: true, basis: 'Art. 118' },
      { n: 5, name: 'Firma del secretario', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/oficio-de-comunicacion-judicial',
    exactName: 'Oficio de comunicacion judicial',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, arts. 111 y 112',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'NO_CADUCA', description: 'El art. 111 no fija plazo para librar ni para remitir los oficios y despachos: no opera caducidad. La norma impone un estándar de celeridad —los tribunales y jueces se entienden con las autoridades y los particulares por medio de despachos y oficios que se envían «por el medio más rápido y con las debidas seguridades», pueden remitirse a través de mensajes de datos y son firmados únicamente por el secretario (art. 111, inc. 1).' },
    requiredSections: [
      { n: 1, name: 'Autoridad o entidad destinataria', mandatory: true, basis: null },
      { n: 2, name: 'Identificacion del proceso, de las partes y del radicado', mandatory: true, basis: null },
      { n: 3, name: 'Providencia que ordena librar el oficio', mandatory: true, basis: null },
      { n: 4, name: 'Orden o solicitud concreta que se comunica', mandatory: true, basis: null },
      { n: 5, name: 'Termino concedido para su cumplimiento y firma del secretario', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/despacho-comisorio',
    exactName: 'Despacho comisorio',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, arts. 38 y 39',
    competentAuthority: 'Secretaria del juzgado comitente; lo cumple el juez comisionado',
    term: { status: 'VERIFICADO', description: 'El art. 39 no fija un plazo legal único: cuando la comisión tenga por objeto la práctica de pruebas, el comitente señala en la providencia el término para su realización, teniendo en cuenta lo dispuesto en el art. 121 (un (1) año para la primera o única instancia y seis (6) meses para la segunda); en los demás casos el comisionado fija el día más próximo posible y la hora de iniciación, en auto que se notifica por estado. Concluida la comisión el despacho se devuelve de inmediato al comitente. El comisionado que incumpla el término señalado o retarde injustificadamente la comisión es sancionado con multa de cinco (5) a diez (10) smlmv impuesta por el comitente (art. 39, incs. 3 a 5).' },
    requiredSections: [
      { n: 1, name: 'Identificacion del juez comitente y del comisionado', mandatory: true, basis: 'Art. 38' },
      { n: 2, name: 'Providencia que ordena la comision', mandatory: true, basis: 'Art. 38' },
      { n: 3, name: 'Diligencia concreta que se comisiona y sus limites', mandatory: true, basis: 'Art. 39' },
      { n: 4, name: 'Anexos y copias necesarios para la practica', mandatory: true, basis: 'Art. 39' },
      { n: 5, name: 'Termino para su cumplimiento y devolucion', mandatory: true, basis: 'Art. 39' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  },
  {
    id: 'civil/constancia-de-desglose-de-documentos',
    exactName: 'Constancia de desglose de documentos',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, art. 116',
    competentAuthority: 'Secretaria del juzgado',
    term: { status: 'NO_CADUCA', description: 'El artículo 116 no fija término para el desglose ni para su constancia: no opera caducidad. El desglose procede por orden del juez una vez precluida la oportunidad para tachar los documentos de falsos o desestimada la tacha, y en el expediente se deja una reproducción del documento desglosado (art. 116 num. 4).' },
    requiredSections: [
      { n: 1, name: 'Identificacion de los documentos que se desglosan y de sus folios', mandatory: true, basis: 'Art. 116' },
      { n: 2, name: 'Providencia que autoriza el desglose', mandatory: true, basis: 'Art. 116' },
      { n: 3, name: 'Constancia que reemplaza los documentos retirados en el expediente', mandatory: true, basis: 'Art. 116' },
      { n: 4, name: 'Identificacion de quien los recibe y fecha de entrega', mandatory: true, basis: 'Art. 116' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/constancia-de-remision-del-expediente-al-superior',
    exactName: 'Constancia de remision del expediente al superior',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, arts. 324 y 325',
    competentAuthority: 'Secretaria del juzgado de primera instancia',
    term: { status: 'VERIFICADO', description: 'El secretario debe remitir el expediente o su reproducción al superior dentro del término máximo de cinco (5) días, contados a partir del momento previsto en el inciso primero del artículo 324 o del día siguiente a aquel en que el recurrente pague el valor de la reproducción; el incumplimiento de este deber se considera falta gravísima (art. 324). El recurrente debe suministrar las expensas de las copias en el término de cinco (5) días, so pena de que el recurso se declare desierto, y el secretario debe expedirlas dentro de los tres (3) días siguientes (art. 324).' },
    requiredSections: [
      { n: 1, name: 'Identificacion del proceso y del recurso concedido', mandatory: true, basis: 'Art. 324' },
      { n: 2, name: 'Providencia que concede el recurso y el efecto en que se concede', mandatory: true, basis: 'Art. 323' },
      { n: 3, name: 'Constancia de ejecutoria de esa providencia', mandatory: true, basis: 'Art. 302' },
      { n: 4, name: 'Relacion de las piezas remitidas al superior', mandatory: true, basis: 'Art. 324' },
      { n: 5, name: 'Fecha de remision y firma del secretario', mandatory: true, basis: 'Art. 324' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma_pdf.php?i=48425'
  },
  {
    id: 'civil/planilla-de-entrega-de-comunicaciones-judiciales',
    exactName: 'Planilla de entrega de comunicaciones judiciales',
    branch: 'CIVIL',
    role: 'SECRETARIA',
    legalBasis: 'Ley 1564 de 2012, arts. 291 y 292; manual de funciones del citador, Consejo Superior de la Judicatura',
    competentAuthority: 'Empresa de servicio postal autorizada por el Ministerio de Tecnologías de la Información y las Comunicaciones, que coteja, sella y expide la constancia de entrega incorporada al expediente (art. 291 num. 3). Solo por excepción la notificación la practica un empleado del juzgado, cuando en el lugar no haya empresa de servicio postal autorizada o el juez lo estime aconsejable (art. 291 parágrafo 1).',
    term: { status: 'VERIFICADO', description: 'De la fecha de entrega registrada en la planilla dependen los terminos de comparecencia del art. 291 y la fecha en que se entiende surtida la notificacion por aviso del art. 292. De la fecha de entrega dependen los términos de comparecencia del art. 291 y la fecha en que se entiende surtida la notificación por aviso del art. 292, pero existe hoy una vía que prescinde de la entrega física: por el art. 8 de la Ley 2213 de 2022 la notificación personal puede hacerse enviando la providencia como mensaje de datos, sin citación ni aviso, y se entiende realizada a los DOS (2) DÍAS HÁBILES siguientes al envío, contándose los términos desde el acuse de recibo o desde que se constate el acceso del destinatario. Regla adicional del art. 291 num. 4: si en el lugar de destino rehúsan recibir la comunicación, la empresa postal la deja allí y emite constancia, y "para todos los efectos legales, la comunicación se entenderá entregada", de modo que el término de comparecencia corre igual.' },
    requiredSections: [
      { n: 1, name: 'Relacion de las comunicaciones, citaciones y avisos entregados', mandatory: true, basis: 'Art. 291' },
      { n: 2, name: 'Destinatario y direccion de cada entrega', mandatory: true, basis: 'Art. 291' },
      { n: 3, name: 'Fecha y hora de entrega o de devolucion', mandatory: true, basis: 'Art. 292' },
      { n: 4, name: 'Constancia de recibido o causal de no entrega', mandatory: true, basis: 'Art. 291' },
      { n: 5, name: 'Incorporacion de la constancia al expediente', mandatory: true, basis: 'Art. 292' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html#291'
  },
  {
    id: 'civil/sentencia-de-declaracion-de-pertenencia',
    exactName: 'Sentencia de declaración de pertenencia',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 375',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El art. 375 no fija plazo para proferir la sentencia de pertenencia. Los términos que la norma sí establece son: quince (15) días para que el registrador de instrumentos públicos expida el certificado de titulares de derechos reales (num. 5, inc. 2); inscripción del contenido de la valla o del aviso en el Registro Nacional de Procesos de Pertenencia por el término de un (1) mes, dentro del cual pueden contestar la demanda las personas emplazadas, tomando quienes concurran después el proceso en el estado en que se encuentre (num. 7, inc. final); y, cuando la prescripción adquisitiva se alegue por vía de excepción, treinta (30) días desde el vencimiento del traslado de la demanda para cumplir los numerales 6 y 7, so pena de que en la sentencia no pueda declararse la pertenencia (parágrafo 1°). La valla o el aviso deben permanecer instalados hasta la audiencia de instrucción y juzgamiento (num. 7).' },
    requiredSections: [
      { n: 1, name: 'Verificación del cumplimiento de la publicidad: valla, emplazamiento y registro del proceso', mandatory: true, basis: 'Art. 375' },
      { n: 2, name: 'Análisis de los elementos de la posesión: aprehensión, ánimo de señor y dueño y tiempo', mandatory: true, basis: 'Art. 375' },
      { n: 3, name: 'Identificación del bien con sus linderos y cabida', mandatory: true, basis: 'Art. 375' },
      { n: 4, name: 'Orden de inscripción en el registro de instrumentos públicos', mandatory: true, basis: 'Art. 375' }
    ],
    sourceUrl: 'https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=48425'
  }
  ]
};
