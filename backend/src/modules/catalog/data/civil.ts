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
    legalBasis: 'Ley 1564 de 2012, art. 590; art. 306 (por remision del art. 590 par. 2); cf. art. 599 para el regimen ejecutivo',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_CADUCA', description: 'SE PIDE DESDE LA PRESENTACION DE LA DEMANDA Y NO CADUCA, PERO ESTA FICHA ES SOLO LA DEL PROCESO DECLARATIVO (art. 590). Si el proceso es EJECUTIVO, el regimen es otro y esta en la ficha «Solicitud de embargo y secuestro de bienes del ejecutado» (art. 599): alli el ejecutante NO presta caucion, y la del 10% la presta el ejecutado como contracautela. Aplicar aqui el 20% a un ejecutivo es cobrarle al cliente una garantia que la ley no le exige. REGIMEN DECLARATIVO: «En los procesos declarativos las medidas cautelares pueden pedirse por el demandante desde la presentacion de la demanda» (art. 590 num. 1), sin fecha limite: la solicitud no caduca. CARGA DEL CLIENTE: caucion equivalente al VEINTE POR CIENTO (20%) del valor de las pretensiones estimadas, salvo para los embargos y secuestros posteriores a sentencia favorable de primera instancia (art. 590 num. 2). EL RELOJ QUE MATA LA CAUTELA ES POSTERIOR Y ES DEL CLIENTE: TREINTA (30) DIAS. Por el paragrafo segundo del art. 590, las medidas de los literales b) y c) se levantan si el demandante no promueve la ejecucion dentro del termino del art. 306, esto es, dentro de los treinta (30) dias siguientes a la ejecutoria de la sentencia o a la notificacion del auto de obedecimiento a lo resuelto por el superior. Se gana el pleito y, por dejar pasar el mes, los bienes cautelados quedan libres justo cuando iban a servir.' },
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
    term: { status: 'VERIFICADO', description: 'TRES (3) DÍAS SIGUIENTES A LA NOTIFICACIÓN DEL AUTO, RELOJ DEL CLIENTE (art. 331). REQUISITO QUE HACE PERDER EL RECURSO DENTRO DEL MISMO PLAZO: el escrito debe DIRIGIRSE AL MAGISTRADO SUSTANCIADOR y EXPRESAR LAS RAZONES DE LA INCONFORMIDAD. Una súplica sin motivación no está debidamente formulada, y el plazo no se detiene mientras se corrige. CONTRA QUÉ PROCEDE, que es lo que decide si vale la pena redactarla: «contra los autos que por su naturaleza serían apelables, dictados por el Magistrado sustanciador en el curso de la segunda o única instancia, o durante el trámite de la apelación de un auto. También procede contra el auto que resuelve sobre la admisión del recurso de apelación o casación y contra los autos que en el trámite de los recursos extraordinarios de casación o revisión profiera el magistrado sustanciador y que por su naturaleza hubieran sido susceptibles de apelación» (art. 331). LÍMITE EXPRESO: «NO PROCEDE contra los autos mediante los cuales se resuelva la apelación o queja.» QUÉ SIGUE: vencido el traslado, el expediente pasa al magistrado que sigue en turno al que dictó la providencia, y contra lo decidido NO PROCEDE RECURSO (art. 332).' },
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
    term: { status: 'VERIFICADO', description: 'CINCO (5) DÍAS SIGUIENTES A LA NOTIFICACIÓN DE LA SENTENCIA, RELOJ DEL CLIENTE Y PRECLUSIVO. «El recurso podrá interponerse dentro de los cinco (5) días siguientes a la notificación de la sentencia» (art. 337). EL PLAZO SE CORRE SI SE PIDIÓ ACLARACIÓN: «Sin embargo, cuando se haya pedido oportunamente ADICIÓN, CORRECCIÓN O ACLARACIÓN, o estas se hicieren de oficio, EL TÉRMINO SE CONTARÁ DESDE EL DÍA SIGUIENTE AL DE LA NOTIFICACIÓN DE LA PROVIDENCIA RESPECTIVA.» Antes de dar por vencida la casación hay que verificar si alguien pidió aclaración — incluida la contraparte. BARRERA DE LEGITIMACIÓN QUE SE DECIDE MUCHO ANTES DE ESOS CINCO DÍAS, y es la que deja sin casación a quien llegó a tiempo: «NO PODRÁ INTERPONER EL RECURSO QUIEN NO APELÓ de la sentencia de primer grado, cuando la proferida por el tribunal hubiere sido EXCLUSIVAMENTE CONFIRMATORIA de aquella» (art. 337). Quien no apeló en primera instancia ya no tiene casación contra la sentencia confirmatoria, por oportuno que sea el escrito. La decisión de apelar en primera instancia es, por eso, una decisión sobre la casación.' },
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
    term: { status: 'VERIFICADO', description: 'TREINTA (30) DÍAS DE TRASLADO COMÚN DESDE EL AUTO QUE ADMITE EL RECURSO, RELOJ DEL CLIENTE: «Admitido el recurso, en el mismo auto se ordenará dar TRASLADO COMÚN POR TREINTA (30) DÍAS para que los recurrentes presenten las demandas de casación» (art. 343). Vencidos sin presentarla, se declara desierto el recurso. LA REGLA QUE MÁS RECURSOS HACE DESERTAR, porque contradice lo que todo el mundo asume: el término «NO SE INTERRUMPIRÁ POR EL CAMBIO DE APODERADO, NI POR SU RENUNCIA O LA SUSTITUCIÓN DEL PODER» (art. 343). El reloj corre contra el recurrente aunque cambie de abogado dentro del traslado — y cambiar de abogado en casación es justamente lo más común, porque no todos los litigantes la ejercen. El apoderado que recibe el poder a mitad del traslado no recibe treinta días: recibe los que queden.' },
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
    term: { status: 'VERIFICADO', description: 'DOS (2) AÑOS DESDE LA EJECUTORIA DE LA SENTENCIA para las causales 1, 6, 8 y 9; y para la causal 7, desde que el perjudicado conoce la sentencia, SIN EXCEDER CINCO (5) AÑOS (art. 356). Reloj del cliente, y de caducidad. REGLA A FAVOR DEL RECURRENTE QUE PUEDE SALVAR UN CASO APARENTEMENTE VENCIDO: cuando la sentencia debe inscribirse en un registro público, los términos de dos (2) y cinco (5) años «SÓLO COMENZARÁN A CORRER A PARTIR DE LA FECHA DE LA INSCRIPCIÓN». En materia inmobiliaria y societaria esa fecha suele ser muy posterior a la ejecutoria. LAS CAUSALES PENALES —2, 3, 4 y 5: documentos declarados falsos, falso testimonio, dictamen de perito condenado, violencia o cohecho— TIENEN EL MISMO PLAZO DE DOS (2) AÑOS desde la ejecutoria, y ahí está la trampa: si el proceso penal no ha terminado, se suspende la sentencia de revisión hasta la ejecutoria del fallo penal, sin que esa suspensión pueda exceder de dos (2) años. **EL RECURSO DEBE INTERPONERSE DENTRO DE LOS DOS AÑOS AUNQUE EL PROCESO PENAL SIGA EN CURSO**: lo que se suspende es la sentencia de revisión, no el término para pedirla. Esperar el fallo penal para presentarlo hace perder el término.' },
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
    transversal: true,
    term: { status: 'VERIFICADO', description: 'DENTRO DEL TÉRMINO DE EJECUTORIA — TRES (3) DÍAS SI LA PROVIDENCIA SE DICTÓ FUERA DE AUDIENCIA. RELOJ DEL CLIENTE Y VENTANA ESTRECHA. «La aclaración procederá de oficio o A PETICIÓN DE PARTE FORMULADA DENTRO DEL TÉRMINO DE EJECUTORIA de la providencia» (art. 285), y esa ejecutoria se cumple tres (3) días después de notificada cuando la providencia se dictó fuera de audiencia (art. 302). LO QUE SE PUEDE ACLARAR ES ESTRECHO Y HAY QUE MEDIRLO ANTES DE PEDIR: «La sentencia NO ES REVOCABLE NI REFORMABLE por el juez que la pronunció. Sin embargo, podrá ser aclarada […] cuando contenga CONCEPTOS O FRASES QUE OFREZCAN VERDADERO MOTIVO DE DUDA, siempre que estén contenidas EN LA PARTE RESOLUTIVA de la sentencia o INFLUYAN EN ELLA.» Una aclaración que en realidad pide cambiar lo decidido se niega, y el tiempo ya se gastó. Procede igual respecto de los autos. EFECTO QUE DESPLAZA LA EJECUTORIA, Y ES LA RAZÓN PRINCIPAL PARA CONOCER ESTA FICHA: pedida la aclaración, la providencia «SOLO QUEDARÁ EJECUTORIADA UNA VEZ RESUELTA LA SOLICITUD» (art. 302 inc. 2), de modo que los términos para recurrir no corren mientras esté pendiente. Y el art. 285 lo remata: «La providencia que resuelva sobre la aclaración NO ADMITE RECURSOS, pero DENTRO DE SU EJECUTORIA PODRÁN INTERPONERSE LOS QUE PROCEDAN CONTRA LA PROVIDENCIA OBJETO DE ACLARACIÓN» — la apelación y la casación se cuentan de nuevo desde ahí. Concordante, el art. 337 hace correr los cinco (5) días de la casación desde la notificación del auto que resuelve la aclaración. LA CARA PELIGROSA DEL MISMO EFECTO: si es la CONTRAPARTE quien pide la aclaración, el término que uno creía vencido sigue vivo; y quien cuenta tres días fijos desde la notificación puede radicar tarde creyendo que llegó a tiempo. Antes de dar por firme una providencia hay que verificar si alguien pidió aclaración o adición.' },
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
    transversal: true,
    term: { status: 'VERIFICADO', description: 'DENTRO DEL TÉRMINO DE EJECUTORIA, RELOJ DEL CLIENTE, Y ES LA ÚNICA FORMA DE RECUPERAR UNA PRETENSIÓN QUE EL JUEZ SIMPLEMENTE NO RESOLVIÓ. «Cuando la sentencia OMITA RESOLVER SOBRE CUALQUIERA DE LOS EXTREMOS DE LA LITIS o sobre cualquier otro punto que de conformidad con la ley debía ser objeto de pronunciamiento, DEBERÁ ADICIONARSE por medio de sentencia complementaria, DENTRO DE LA EJECUTORIA, de oficio o a solicitud de parte presentada en la misma oportunidad» (art. 287). CUÁNTO DURA ESA EJECUTORIA, QUE ES LO QUE EL ARTÍCULO NO DICE: las providencias dictadas FUERA DE AUDIENCIA quedan ejecutoriadas TRES (3) DÍAS después de notificadas; las dictadas EN AUDIENCIA quedan ejecutoriadas una vez notificadas cuando no se impugnan o no admiten recursos (art. 302), de modo que ahí la adición DEBE PEDIRSE EN EL ACTO. Dejar pasar esos días equivale a renunciar a lo no resuelto. LA VÍA DE SEGUNDA INSTANCIA EXIGE HABER APELADO, y esa condición se pierde de vista: «El juez de segunda instancia DEBERÁ COMPLEMENTAR la sentencia del inferior SIEMPRE QUE LA PARTE PERJUDICADA CON LA OMISIÓN HAYA APELADO; pero si dejó de resolver la demanda de reconvención o la de un proceso acumulado, LE DEVOLVERÁ EL EXPEDIENTE para que dicte sentencia complementaria.» Quien no apeló no puede pedir arriba lo que no pidió abajo. LOS AUTOS TIENEN REGLA PROPIA Y MÁS ESTRECHA: «Los autos SOLO PODRÁN ADICIONARSE DE OFICIO dentro del término de su ejecutoria, o a solicitud de parte presentada en el mismo término.» EFECTO SOBRE LOS DEMÁS PLAZOS: la solicitud desplaza la ejecutoria — la providencia «solo quedará ejecutoriada una vez resuelta la solicitud» (art. 302 inc. 2) — y «DENTRO DEL TÉRMINO DE EJECUTORIA DE LA PROVIDENCIA QUE RESUELVA SOBRE LA COMPLEMENTACIÓN PODRÁ RECURRIRSE TAMBIÉN LA PROVIDENCIA PRINCIPAL» (art. 287): la apelación de la sentencia vuelve a abrirse.' },
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
    term: { status: 'VERIFICADO', description: 'CINCO (5) DÍAS PARA SUBSANAR, SO PENA DE RECHAZO, Y EL RELOJ ES DEL DEMANDANTE (art. 90). LA CONDUCTA ÚTIL ES SUBSANAR, NO RECURRIR, y confundirlo cuesta los cinco días: el auto que declara inadmisible la demanda es «NO SUSCEPTIBLE DE RECURSOS» (art. 90). Quien gasta el término en una reposición no la obtiene y además llega tarde a corregir. LO QUE SÍ ES APELABLE ES EL RECHAZO, y esa apelación arrastra lo anterior: comprende el auto que negó la admisión, se concede en el EFECTO SUSPENSIVO y se resuelve DE PLANO (art. 90). LÍMITE DE LA INADMISIÓN: solo procede por las SIETE CAUSALES TAXATIVAS del art. 90. Una inadmisión fundada en algo distinto se ataca, pero por la vía del rechazo, no contra el inadmisorio.' },
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
    legalBasis: 'Ley 1564 de 2012, arts. 588, 590 y 595 num. 1',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'EL ARTICULO 590 NO FIJA PLAZO PARA PROFERIR EL AUTO, PERO EL 588 SI, Y ESE DIA ES DEL DESPACHO, NO DE LA PARTE: «Cuando la solicitud de medidas cautelares se haga por fuera de audiencia, el juez resolvera, a mas tardar, al dia siguiente del reparto o a la presentacion de la solicitud» (art. 588). Publicarlo como si fuera un termino del abogado seria invertir de quien es el reloj. CONTENIDO QUE DEBE LLEVAR EL AUTO cuando decreta secuestro: «En el auto que lo decrete se senalara fecha y hora para la diligencia y se designara secuestre que debera concurrir a ella, so pena de multa de diez (10) a veinte (20) salarios minimos mensuales» (art. 595 num. 1). CAUCION: el veinte por ciento (20%) de las pretensiones estimadas en el declarativo (art. 590 num. 2), salvo los embargos y secuestros posteriores a sentencia favorable de primera instancia. En el EJECUTIVO no hay caucion del ejecutante (art. 599). LEVANTAMIENTO POR INACTIVIDAD, RELOJ DE LA PARTE: las medidas de los literales b) y c) del num. 1 se levantan si el demandante no promueve la ejecucion dentro de los treinta (30) dias del art. 306 (art. 590 par. 2).' },
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
    term: { status: 'VERIFICADO', description: 'TRES (3) DÍAS PARA LAS PROVIDENCIAS DICTADAS FUERA DE AUDIENCIA, PERO CON DOS HIPÓTESIS QUE MUEVEN ESA FECHA Y CON ELLA TODOS LOS PLAZOS QUE CUELGAN DE ELLA — apelación, casación, caducidad, ejecución. REGLA GENERAL: «Las providencias proferidas en audiencia adquieren ejecutoria UNA VEZ NOTIFICADAS, cuando no sean impugnadas o no admitan recursos» (art. 302 inc. 1). PRIMERA HIPÓTESIS QUE DESPLAZA LA EJECUTORIA, y es la que más se olvida: «cuando se pida ACLARACIÓN O COMPLEMENTACIÓN de una providencia, SOLO QUEDARÁ EJECUTORIADA UNA VEZ RESUELTA LA SOLICITUD» (inc. 2). Una petición de aclaración de la contraparte corre la ejecutoria hacia adelante sin que nadie lo anuncie, y quien contó tres días fijos desde la notificación cree vencido un término que sigue vivo — o al revés, da por vivo uno que ya venció. SEGUNDA HIPÓTESIS: la providencia dictada fuera de audiencia contra la que SÍ se interpusieron recursos NO queda ejecutoriada a los tres días. «Las que sean proferidas por fuera de audiencia quedan ejecutoriadas TRES (3) DÍAS DESPUÉS DE NOTIFICADAS, cuando carecen de recursos o han vencido los términos sin haberse interpuesto los recursos que fueren procedentes, O CUANDO QUEDA EJECUTORIADA LA PROVIDENCIA QUE RESUELVA LOS INTERPUESTOS» (inc. 3). DE QUIÉN ES EL RELOJ: la constancia en sí es un acto de secretaría sin plazo propio. Lo que importa es que ES EL DISPARADOR DE LOS RELOJES DEL CLIENTE — de la ejecutoria arrancan los términos de aclaración, adición, apelación y casación, y en lo contencioso la caducidad del medio de control. Fecharla mal no produce un error de un día: produce un recurso extemporáneo.' },
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
    term: { status: 'VERIFICADO', description: 'EL ESTADO DURA UN SOLO DÍA, Y ESE DÍA ES EL QUE ECHA A ANDAR LOS RELOJES DEL ABOGADO. «El estado SE FIJARÁ en un lugar visible de la Secretaría, AL COMENZAR LA PRIMERA HORA HÁBIL del respectivo día, y SE DESFIJARÁ al finalizar la última hora hábil del mismo» (art. 295). CUÁNDO SE INSERTA, que es lo que fija el arranque del cómputo: «La inserción en el estado SE HARÁ AL DÍA SIGUIENTE A LA FECHA DE LA PROVIDENCIA». HOY EL ESTADO ES VIRTUAL, y quien siga esperando la cartelera física no se entera: por el art. 9 de la Ley 2213 de 2022 —legislación permanente— las notificaciones por estado se fijan VIRTUALMENTE, con INSERCIÓN DE LA PROVIDENCIA, sin necesidad de imprimirlas, sin firma del secretario y sin constancia al pie. Los ejemplares se conservan en línea para consulta permanente. El propio art. 295 ya lo anticipaba en su parágrafo: «Cuando se cuente con los recursos técnicos los estados se publicarán por mensaje de datos, caso en el cual no deberán imprimirse ni firmarse por el Secretario.» EXCEPCIONES QUE NO SE INSERTAN en el estado electrónico, y hay que consultarlas en el expediente: las providencias que decretan medidas cautelares, las que mencionan menores y las sujetas a reserva legal. CONDICIÓN QUE PUEDE INVALIDAR LA NOTIFICACIÓN: «Cuando se habiliten sistemas de información de la gestión judicial, LA NOTIFICACIÓN POR ESTADO SOLO PODRÁ HACERSE CON POSTERIORIDAD A LA INCORPORACIÓN DE LA INFORMACIÓN EN DICHO SISTEMA» (art. 295). DE QUIÉN ES EL RELOJ: la fijación es carga de la secretaría y no tiene plazo que corra contra la parte. Pero DEL DÍA DEL ESTADO arrancan los términos del abogado —tres días de reposición en el CGP, diez en el CPACA—, y por eso el estado se revisa a diario: es un día de exhibición, no un aviso que espere.' },
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
    term: { status: 'VERIFICADO', description: 'CINCO (5) DÍAS SI ES EN EL MISMO MUNICIPIO DEL JUZGADO, DIEZ (10) DÍAS SI ES EN MUNICIPIO DISTINTO Y TREINTA (30) DÍAS SI ES EN EL EXTERIOR, contados desde la entrega de la comunicación en el lugar de destino. RELOJ DEL CITADO: si no comparece, procede la notificación por aviso (art. 291). VÍA ALTERNATIVA VIGENTE, CON OTRO CALENDARIO Y SIN CITACIÓN PREVIA: por el art. 8 de la Ley 2213 de 2022 —legislación permanente— la notificación personal también puede hacerse enviando la providencia COMO MENSAJE DE DATOS a la dirección electrónica que suministre el interesado, SIN CITACIÓN NI AVISO PREVIOS. En ese caso «la notificación personal se entenderá realizada una vez transcurridos DOS (2) DÍAS HÁBILES siguientes al envío del mensaje y los términos empezarán a contarse CUANDO EL INICIADOR RECEPCIONE ACUSE DE RECIBO o se pueda por otro medio constatar el acceso del destinatario al mensaje». Son dos fechas distintas y hay que separarlas al contar. CARGA DE QUIEN NOTIFICA POR ESA VÍA: afirmar BAJO JURAMENTO que la dirección corresponde a la persona por notificar, informar cómo la obtuvo y allegar las evidencias. Se aplica cualquiera sea la naturaleza de la actuación, incluidas las pruebas extraprocesales y los procesos declarativos, monitorios y ejecutivos. RELOJ DEL NOTIFICADO QUE DISCREPE: para alegar la nulidad debe manifestar bajo juramento que no se enteró, además de cumplir los arts. 132 a 138 del CGP.' },
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
    term: { status: 'VERIFICADO', description: 'SURTIDA AL FINALIZAR EL DÍA SIGUIENTE AL DE LA ENTREGA DEL AVISO en el lugar de destino (art. 292). De ahí, y no de la entrega, arrancan los términos del notificado. REQUISITO DE VALIDEZ QUE HACE ATACABLE LA NOTIFICACIÓN SI SE OMITE: cuando se trata del AUTO ADMISORIO DE LA DEMANDA o del MANDAMIENTO EJECUTIVO, el aviso debe ir acompañado de COPIA INFORMAL DE LA PROVIDENCIA que se notifica (art. 292). Sin ese anexo el término no queda bien surtido, y eso se descubre tarde — cuando la contraparte alega la nulidad. VÍA ALTERNATIVA VIGENTE: por el art. 8 de la Ley 2213 de 2022 la notificación personal puede hacerse enviando la providencia como mensaje de datos SIN NECESIDAD DE AVISO PREVIO, y se entiende realizada a los DOS (2) DÍAS HÁBILES siguientes al envío, contándose los términos desde el acuse de recibo o desde que se constate el acceso del destinatario.' },
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
    term: { status: 'VERIFICADO', description: 'EL MEMORIAL ES OPORTUNO SI SE RECIBE ANTES DEL CIERRE DEL DESPACHO DEL DÍA EN QUE VENCE EL TÉRMINO. RELOJ DE LA PARTE, y se mide por la hora, no por el día. REGLA QUE PUEDE SALVAR UN TÉRMINO QUE PARECE VENCIDO: cuando el memorial se radica en centros administrativos, de apoyo, secretarías conjuntas, centros de radicación o similares con destino a un despacho determinado, «LA PRESENTACIÓN SE ENTENDERÁ REALIZADA EL DÍA EN QUE FUE RADICADO EL MEMORIAL EN ALGUNA DE ESTAS DEPENDENCIAS» (art. 109 parágrafo) — no el día en que llega al juzgado. El sello del centro de radicación vale, aunque el expediente reciba el escrito dos días después. CARGA DE LA SECRETARÍA CON TÉRMINOS COMUNES: cuando se ejercen recursos o facultades con términos comunes, el secretario DEBE ESPERAR a que el término transcurra respecto de TODAS las partes antes de ingresar el expediente al despacho (art. 109). FORMA: los memoriales pueden presentarse y las comunicaciones transmitirse POR CUALQUIER MEDIO IDÓNEO, y las autoridades judiciales deben llevar control de los mensajes recibidos con FECHA Y HORA de recepción — que es la prueba de la oportunidad.' },
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
  },
  {
    id: 'civil/oposicion-a-la-ejecucion-especial-de-la-garantia-mobiliaria',
    exactName: 'Oposición a la ejecución especial de la garantía mobiliaria',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 66 (causales taxativas) y 67 (trámite); Decreto 1074 de 2015, arts. 2.2.2.4.2.11, 2.2.2.4.2.12 y 2.2.2.4.2.13',
    competentAuthority: 'Se radica ante el notario o la cámara de comercio que adelanta la ejecución, pero la resuelve la autoridad jurisdiccional: el juez civil competente o la Superintendencia de Sociedades cuando el garante sea sociedad sometida a su vigilancia (Ley 1676 de 2013, art. 57), o el árbitro si hay pacto arbitral',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS, RELOJ DEL DEUDOR, Y ES EL ÚNICO QUE LE DESTRUYE EL DERECHO. «La oposición se deberá formular por escrito en un plazo máximo de diez (10) días contados a partir del día siguiente al recibo de la comunicación, ante el notario o la Cámara de Comercio según corresponda, ACOMPAÑANDO LA TOTALIDAD DE LAS PRUEBAS que pretenda hacer valer» (art. 67 num. 1). No basta oponerse: hay que llegar con toda la prueba. LAS CAUSALES SON TAXATIVAS (art. 66): extinción de la garantía acreditada con certificación del registro; extinción de la obligación, o que no sea exigible por plazo o condición suspensiva; falsedad de la firma o alteración del texto; y error en la determinación de la cantidad exigible. CUALQUIER OTRA DEFENSA LLEGA TARDE AUNQUE SE GANE, y esto es lo que hay que explicarle al cliente antes de decidir: las demás se ventilan en un declarativo posterior, y el parágrafo del art. 66 advierte que «La adjudicación o realización del bien en el proceso de ejecución especial de la garantía NO SE VERÁN AFECTADAS por el resultado de este trámite posterior». Se gana el pleito y el bien ya no está. LOS DEMÁS RELOJES DEL INCIDENTE, que no son del deudor: el acreedor tiene cinco (5) días para pronunciarse sobre la oposición (art. 2.2.2.4.2.11), la entidad tres (3) para remitir el expediente (art. 2.2.2.4.2.12), y el juez cita en tres (3) días y celebra audiencia en cinco (5) (art. 67 num. 1). Y VUELVE A CORRER CONTRA EL EJECUTADO AL FINAL: «Si los ejecutados no concurren y no justifican su inasistencia dentro de los tres (3) días siguientes», se ordena continuar la ejecución.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la ejecución especial a la que se opone y de la comunicación recibida, con su fecha', mandatory: true, basis: 'Ley 1676 de 2013, art. 67 num. 1' },
      { n: 2, name: 'Constancia de presentación dentro de los diez (10) días siguientes al recibo de la comunicación', mandatory: true, basis: 'Ley 1676 de 2013, art. 67 num. 1' },
      { n: 3, name: 'Invocación expresa de una de las cuatro causales del artículo 66, que son taxativas', mandatory: true, basis: 'Ley 1676 de 2013, art. 66' },
      { n: 4, name: 'Aporte de la TOTALIDAD de las pruebas que se pretende hacer valer', mandatory: true, basis: 'Ley 1676 de 2013, art. 67 num. 1' },
      { n: 5, name: 'Certificación del registro que acredite la extinción de la garantía, cuando esa sea la causal', mandatory: false, basis: 'Ley 1676 de 2013, art. 66' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'civil/demanda-de-ejecucion-judicial-de-la-garantia-mobiliaria',
    exactName: 'Demanda de ejecución judicial de la garantía mobiliaria',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 57 (autoridad competente), 58, 61 (trámite y excepciones) y 12 (título ejecutivo); Código General del Proceso, arts. 467 y 468',
    competentAuthority: 'El juez civil competente, y a prevención la Superintendencia de Sociedades «solo en el evento en que el garante sea una sociedad sometida a su vigilancia» (Ley 1676 de 2013, art. 57)',
    term: { status: 'VERIFICADO', description: 'EL REQUISITO PREVIO QUE HUNDE LA DEMANDA SI FALTA, Y NO ES UN ANEXO SINO UNA INSCRIPCIÓN: «Deberá inscribirse el formulario registral de ejecución en el registro de garantías mobiliarias […] COMO EXIGENCIA PREVIA PARA EL TRÁMITE DEL PROCESO» (art. 61 num. 1). Y EL TÍTULO EJECUTIVO ES ESE FORMULARIO, NO EL CONTRATO (art. 12) — presentar el contrato como título es el error de forma más caro de este régimen. RELOJ DEL EJECUTADO: diez (10) días para las defensas, «El ejecutado podrá, en el término de diez (10) días, plantear las siguientes defensas» (CGP art. 467 num. 3); por la vía del art. 61 num. 2 las excepciones son las cuatro tasadas, no las del ejecutivo común. RELOJ DEL ACREEDOR: «el acreedor deberá consignar la diferencia a órdenes del juzgado respectivo dentro de los tres (3) días siguientes al vencimiento del plazo para presentar oposición» (CGP art. 467 num. 5). RELOJ DE AMBOS SOBRE EL AVALÚO DESACTUALIZADO: tres (3) días para objetarlo «so pena de ser rechazada de plano» (art. 61 num. 7). CADUCIDAD DE LOS ANEXOS: los certificados deben tener «una fecha de expedición no superior a un (1) mes» (CGP art. 467). ADVERTENCIA DE VIGENCIA: el último inciso del art. 50 de la Ley 1676 remite a la «liquidación por adjudicación», figura DEROGADA por el art. 21 de la Ley 2437 de 2024, que suprimió los arts. 37 y 38 de la Ley 1116 de 2006; hoy se lee como liquidación judicial o liquidación judicial simplificada.' },
    requiredSections: [
      { n: 1, name: 'Constancia de la inscripción previa del formulario registral de ejecución', mandatory: true, basis: 'Ley 1676 de 2013, art. 61 num. 1' },
      { n: 2, name: 'El formulario registral de ejecución como título ejecutivo, no el contrato de garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 12' },
      { n: 3, name: 'Identificación del garante, del acreedor y de la obligación incumplida', mandatory: true, basis: 'Ley 1676 de 2013, art. 61' },
      { n: 4, name: 'Descripción de los bienes en garantía y su avalúo', mandatory: true, basis: 'Ley 1676 de 2013, art. 61 num. 7' },
      { n: 5, name: 'Certificados del registro con fecha de expedición no superior a un (1) mes', mandatory: true, basis: 'Código General del Proceso, art. 467' },
      { n: 6, name: 'Petición de adjudicación o de realización especial del bien', mandatory: true, basis: 'Código General del Proceso, arts. 467 y 468' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'civil/requerimiento-al-deudor-para-acordar-la-ejecucion-especial-de-la-garantia-mobiliaria',
    exactName: 'Requerimiento al deudor para acordar la ejecución especial de la garantía mobiliaria',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 58 parágrafo; Decreto 1074 de 2015, art. 2.2.2.4.2.7',
    competentAuthority: 'No se radica ante autoridad: es una comunicación escrita directa del acreedor al deudor',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS, Y EL RELOJ ES DEL DEUDOR, PERO SU VENCIMIENTO NO LO PERJUDICA — LO MANDA AL JUEZ. «El acreedor a quien se le haya incumplido cualquiera de las obligaciones garantizadas, podrá hacer requerimiento escrito al deudor, para que dentro del término de diez (10) días acuerde con él la procedencia de la ejecución especial de la garantía mobiliaria. DE NO HACERLO OPERARÁ EL MECANISMO DE EJECUCIÓN JUDICIAL» (art. 58 par.). Es el paso previo obligado cuando la ejecución especial no se pactó en el contrato: sin este requerimiento no se puede acudir al notario ni a la cámara de comercio.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la obligación garantizada y de su incumplimiento', mandatory: true, basis: 'Ley 1676 de 2013, art. 58' },
      { n: 2, name: 'Propuesta expresa de acudir a la ejecución especial de la garantía', mandatory: true, basis: 'Ley 1676 de 2013, art. 58 par.' },
      { n: 3, name: 'Concesión del término de diez (10) días para que el deudor acuerde', mandatory: true, basis: 'Ley 1676 de 2013, art. 58 par.' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'civil/solicitud-de-aprehension-y-entrega-del-bien-dado-en-garantia-mobiliaria',
    exactName: 'Solicitud de aprehensión y entrega del bien dado en garantía mobiliaria',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, arts. 60 parágrafo 2, 68 y 75; Decreto 1074 de 2015, arts. 2.2.2.4.2.3 num. 2 y 2.2.2.4.2.70',
    competentAuthority: 'La autoridad jurisdiccional competente la ordena; la practica el funcionario comisionado o la autoridad de policía, «quien no podrá admitir oposición» (Ley 1676 de 2013, art. 68)',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO PARA PEDIRLA, PERO CON UN PREVIO QUE HAY QUE DEJAR CORRER: CINCO (5) DÍAS DEL GARANTE. «Si pasados cinco (5) días contados a partir de la solicitud el garante no hace entrega voluntaria del bien […] este último podrá solicitar a la autoridad jurisdiccional competente la aprehensión y entrega» (Decreto 1074 de 2015, art. 2.2.2.4.2.3 num. 2). Se libra «con la simple petición del acreedor garantizado» y la diligencia NO admite oposición: quien quiera oponerse debía hacerlo en la ejecución, dentro de sus diez días.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la garantía inscrita y de la ejecución en curso', mandatory: true, basis: 'Ley 1676 de 2013, art. 68' },
      { n: 2, name: 'Constancia de la solicitud de entrega voluntaria y del transcurso de los cinco (5) días', mandatory: true, basis: 'Decreto 1074 de 2015, art. 2.2.2.4.2.3 num. 2' },
      { n: 3, name: 'Descripción e individualización del bien cuya aprehensión se pide', mandatory: true, basis: 'Ley 1676 de 2013, art. 68' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'civil/solicitud-de-terminacion-de-la-ejecucion-de-la-garantia-mobiliaria-por-pago',
    exactName: 'Solicitud de terminación de la ejecución de la garantía mobiliaria por pago',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 72',
    competentAuthority: 'La autoridad que adelanta la ejecución: el notario, la cámara de comercio o el juez, según la vía por la que se tramite',
    term: { status: 'VERIFICADO', description: 'NO HAY PLAZO EN DÍAS: EL RELOJ ES UN HECHO, Y POR ESO HAY QUE VIGILARLO Y NO CONTARLO. «En cualquier momento ANTES DE QUE EL ACREEDOR GARANTIZADO DISPONGA DE LOS BIENES dados en garantía, el garante o deudor, así como cualquier otra persona interesada, tendrá derecho a solicitar la terminación de la ejecución, pagando el monto total adeudado al acreedor garantizado, así como los gastos incurridos en el procedimiento de ejecución» (art. 72). La puerta no se cierra en una fecha sino cuando el bien se dispone, así que el aviso al cliente no es «le quedan tantos días» sino «esto se acaba el día que rematen o adjudiquen». LEGITIMACIÓN AMPLIA: la puede pedir el deudor, el garante o cualquier interesado, lo que permite que un tercero pague para salvar el bien.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la ejecución en curso y de los bienes comprometidos', mandatory: true, basis: 'Ley 1676 de 2013, art. 72' },
      { n: 2, name: 'Prueba del pago del monto total adeudado al acreedor garantizado', mandatory: true, basis: 'Ley 1676 de 2013, art. 72' },
      { n: 3, name: 'Prueba del pago de los gastos incurridos en el procedimiento de ejecución', mandatory: true, basis: 'Ley 1676 de 2013, art. 72' },
      { n: 4, name: 'Acreditación del interés, cuando quien paga no es el deudor ni el garante', mandatory: false, basis: 'Ley 1676 de 2013, art. 72' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'civil/demanda-por-ejercicio-abusivo-de-los-derechos-del-acreedor-garantizado',
    exactName: 'Demanda por ejercicio abusivo de los derechos del acreedor garantizado',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1676 de 2013, art. 73; Decreto 1074 de 2015, art. 2.2.2.4.2.18',
    competentAuthority: 'El juez civil competente',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO ESPECIAL EN LA LEY 1676. Es la vía del deudor cuando el acreedor ejecuta de forma abusiva —por bienes que exceden la deuda, o sin respetar el procedimiento—, y no está sujeta a las causales taxativas de la oposición del art. 66. ADVERTENCIA QUE HAY QUE DAR ANTES DE ELEGIR ESTA VÍA: no suspende ni revierte la ejecución. Si el bien ya se adjudicó o realizó, esta demanda persigue la indemnización, no la restitución.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la garantía y del procedimiento de ejecución adelantado', mandatory: true, basis: 'Ley 1676 de 2013, art. 73' },
      { n: 2, name: 'Hechos que configuran el ejercicio abusivo del derecho del acreedor', mandatory: true, basis: 'Ley 1676 de 2013, art. 73' },
      { n: 3, name: 'Pretensión indemnizatoria con la estimación razonada del perjuicio', mandatory: true, basis: 'Ley 1676 de 2013, art. 73' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=54297'
  },
  {
    id: 'civil/solicitud-de-embargo-y-secuestro-de-bienes-del-ejecutado',
    exactName: 'Solicitud de embargo y secuestro de bienes del ejecutado',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 599 (oportunidad y contracautela), art. 593 (formas de practicar el embargo según el bien), art. 595 (diligencia de secuestro) y art. 588 (plazo del juez para resolver)',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'NO_CADUCA', description: 'NO CADUCA, Y EL RELOJ QUE APARECE EN EL ARTÍCULO VECINO NO ES DEL CLIENTE. Para el ejecutante no hay plazo: «Desde la presentación de la demanda el ejecutante podrá solicitar el embargo y secuestro de bienes del ejecutado» (art. 599). CUIDADO CON CONFUNDIRLO CON EL PLAZO DEL JUEZ: el art. 588 dispone que «Cuando la solicitud de medidas cautelares se haga por fuera de audiencia, el juez resolverá, a más tardar, al día siguiente del reparto o a la presentación de la solicitud» — ese día es del despacho para decidir, no un término que el abogado deba cumplir. LO QUE SÍ PUEDE COSTARLE AL EJECUTANTE: si el ejecutado propone excepciones de mérito o un tercero resulta afectado, pueden pedir que el ejecutante preste caución hasta por el 10% del valor de la ejecución, y entonces sí corre un plazo suyo de quince (15) días «so pena de levantamiento» (art. 599 inc. 5) — ver la ficha de contracautela.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso ejecutivo y del mandamiento de pago', mandatory: true, basis: 'Código General del Proceso, art. 599' },
      { n: 2, name: 'Individualización de los bienes cuyo embargo se pide, con los datos que exige su forma de registro', mandatory: true, basis: 'Código General del Proceso, art. 593' },
      { n: 3, name: 'Indicación de la forma de perfeccionar el embargo según la clase de bien: registro, oficio al banco, al pagador o a la sociedad', mandatory: true, basis: 'Código General del Proceso, art. 593' },
      { n: 4, name: 'Solicitud de secuestro y designación de secuestre, cuando el bien lo admite', mandatory: false, basis: 'Código General del Proceso, art. 595' },
      { n: 5, name: 'Manifestación de que los bienes no están comprendidos en las causales de inembargabilidad', mandatory: false, basis: 'Código General del Proceso, art. 594' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/insistencia-en-perseguir-los-derechos-del-ejecutado-tras-el-levantamiento-del-secuestro',
    exactName: 'Insistencia en perseguir los derechos del ejecutado tras el levantamiento del secuestro',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 596 num. 3; art. 596 num. 2 (remisión al trámite de la oposición del art. 309)',
    competentAuthority: 'El juez que conoce del proceso ejecutivo, o el comisionado ante quien se practicó la diligencia',
    term: { status: 'VERIFICADO', description: 'TRES (3) DÍAS, RELOJ DEL CLIENTE, Y ES DE LOS QUE MÁS EMBARGOS PIERDE POR DESCONOCIMIENTO. Prosperada la oposición de un tercero, el embargo se cae solo si el ejecutante se queda callado: «dentro de los tres (3) días siguientes a la ejecutoria del auto favorable al opositor, que levante el secuestro, o se abstenga de practicarlo en razón de la oposición, podrá el interesado expresar que INSISTE en perseguir los derechos que tenga el demandado en ellos, caso en el cual se practicará el correspondiente avalúo; DE LO CONTRARIO SE LEVANTARÁ EL EMBARGO» (art. 596 num. 3). Son tres días desde la ejecutoria, no desde la diligencia, y no hay quien lo recuerde: el auto favorece al opositor y el expediente sigue su curso. QUÉ SE CONSERVA AL INSISTIR: no el bien, sino los derechos que el ejecutado tenga sobre él, que se avalúan y se persiguen.' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto que resolvió la oposición y de la fecha de su ejecutoria', mandatory: true, basis: 'Código General del Proceso, art. 596 num. 3' },
      { n: 2, name: 'Manifestación expresa de que se INSISTE en perseguir los derechos del ejecutado sobre el bien', mandatory: true, basis: 'Código General del Proceso, art. 596 num. 3' },
      { n: 3, name: 'Constancia de presentación dentro de los tres (3) días siguientes a la ejecutoria', mandatory: true, basis: 'Código General del Proceso, art. 596 num. 3' },
      { n: 4, name: 'Solicitud de que se practique el avalúo de esos derechos', mandatory: true, basis: 'Código General del Proceso, art. 596 num. 3' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/solicitud-de-ejecucion-a-continuacion-de-la-sentencia',
    exactName: 'Solicitud de ejecución a continuación de la sentencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 306 (ejecución a continuación); art. 597 num. 6 (levantamiento de las cautelas por no pedirla); art. 590 parágrafo 2',
    competentAuthority: 'El mismo juez que profirió la sentencia, a continuación del proceso declarativo',
    term: { status: 'VERIFICADO', description: 'TREINTA (30) DÍAS, RELOJ DEL CLIENTE, Y ES EL PLAZO QUE MÁS MEDIDAS CAUTELARES MATA EN COLOMBIA. Ganada la sentencia, quien no pide la ejecución dentro del mes pierde dos cosas a la vez. LA PRIMERA, LA NOTIFICACIÓN FÁCIL: «Si la solicitud de la ejecución se formula dentro de los treinta (30) días siguientes a la ejecutoria de la sentencia, o a la notificación del auto de obedecimiento a lo resuelto por el superior, según fuere el caso, el mandamiento ejecutivo se notificará por estado. DE SER FORMULADA CON POSTERIORIDAD, la notificación del mandamiento ejecutivo al ejecutado deberá realizarse PERSONALMENTE» (art. 306). LA SEGUNDA, Y ES LA GRAVE, LAS CAUTELAS: el art. 597 num. 6 ordena levantar el embargo y el secuestro «Si el demandante en proceso declarativo no formula la solicitud de que trata el inciso primero del artículo 306 dentro de los treinta (30) días siguientes a la ejecutoria de la sentencia que contenga la condena». Es decir: se gana el pleito, se deja pasar el mes, y los bienes que llevaban años embargados quedan libres justo cuando iban a servir.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia que contiene la condena y de la fecha de su ejecutoria', mandatory: true, basis: 'Código General del Proceso, art. 306' },
      { n: 2, name: 'Constancia de presentación dentro de los treinta (30) días siguientes a la ejecutoria', mandatory: true, basis: 'Código General del Proceso, arts. 306 y 597 num. 6' },
      { n: 3, name: 'Liquidación de la obligación que se pretende ejecutar, conforme a la condena', mandatory: true, basis: 'Código General del Proceso, art. 306' },
      { n: 4, name: 'Petición de que se mantengan las medidas cautelares practicadas en el declarativo', mandatory: false, basis: 'Código General del Proceso, art. 597 num. 6' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html'
  },
  {
    id: 'civil/incidente-de-levantamiento-del-secuestro-por-el-tercero-poseedor',
    exactName: 'Incidente de levantamiento del secuestro por el tercero poseedor',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 597 num. 8',
    competentAuthority: 'El juez del conocimiento',
    term: { status: 'VERIFICADO', description: 'VEINTE (20) DÍAS SI ESTUVO AUSENTE, CINCO (5) SI ESTUVO PRESENTE SIN ABOGADO. RELOJ DEL CLIENTE, Y CON MULTA SI PIERDE. «Si un tercero poseedor que no estuvo presente en la diligencia de secuestro solicita al juez del conocimiento, dentro de los VEINTE (20) DÍAS siguientes a la práctica de la diligencia, si lo hizo el juez de conocimiento, o a la notificación del auto que ordena agregar el despacho comisorio, que se declare que tenía la posesión material del bien al tiempo en que aquella se practicó, y obtiene decisión favorable» se levanta el secuestro. Y para quien sí estuvo: «También podrá promover el incidente el tercero poseedor que haya estado presente en la diligencia SIN LA REPRESENTACIÓN DE APODERADO JUDICIAL, pero el término para hacerlo será de CINCO (5) DÍAS». EL RIESGO DE PERDERLO ESTÁ ESCRITO: «Si el incidente se decide desfavorablemente a quien lo promueve, se impondrá a este una multa de cinco (5) a veinte (20) salarios mínimos mensuales». Es una defensa con costo, y hay que advertírselo al cliente antes de promoverla.' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la calidad de tercero poseedor material al tiempo de la diligencia', mandatory: true, basis: 'Código General del Proceso, art. 597 num. 8' },
      { n: 2, name: 'Constancia de que no estuvo presente en la diligencia, o de que estuvo sin apoderado judicial', mandatory: true, basis: 'Código General del Proceso, art. 597 num. 8' },
      { n: 3, name: 'Presentación dentro de los veinte (20) días, o de los cinco (5) según el caso', mandatory: true, basis: 'Código General del Proceso, art. 597 num. 8' },
      { n: 4, name: 'Pruebas de la posesión material anterior al secuestro', mandatory: true, basis: 'Código General del Proceso, art. 597 num. 8' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/comparecencia-del-acreedor-con-garantia-real-citado-al-proceso-ejecutivo',
    exactName: 'Comparecencia del acreedor con garantía real citado al proceso ejecutivo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 462',
    competentAuthority: 'El juez que conoce del proceso ejecutivo al que se cita al acreedor',
    term: { status: 'VERIFICADO', description: 'VEINTE (20) DÍAS DESDE LA NOTIFICACIÓN PERSONAL, RELOJ DEL CLIENTE Y PRECLUSIVO. Citado el acreedor con garantía real, sus créditos «se harán exigibles si no lo fueren», y debe hacerlos valer «ante el mismo juez, bien sea en proceso separado o en el que se les cita, DENTRO DE LOS VEINTE (20) DÍAS SIGUIENTES A SU NOTIFICACIÓN PERSONAL» (art. 462). LO QUE SE PIERDE AL DEJARLO VENCER ES LA ELECCIÓN DEL FORO, NO EL CRÉDITO: «Si vencido el término […] el acreedor notificado no hubiere instaurado alguna de las demandas ejecutivas, SÓLO PODRÁ HACER VALER SUS DERECHOS EN EL PROCESO AL QUE FUE CITADO». Es decir, queda atado al proceso ajeno, con su ritmo y su avalúo, sin poder abrir el suyo.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso al que fue citado y de la fecha de su notificación personal', mandatory: true, basis: 'Código General del Proceso, art. 462' },
      { n: 2, name: 'Título ejecutivo y prueba de la garantía real que se hace valer', mandatory: true, basis: 'Código General del Proceso, art. 462' },
      { n: 3, name: 'Constancia de presentación dentro de los veinte (20) días siguientes a la notificación personal', mandatory: true, basis: 'Código General del Proceso, art. 462' },
      { n: 4, name: 'Manifestación de si se acude en proceso separado o dentro del proceso al que fue citado', mandatory: true, basis: 'Código General del Proceso, art. 462' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/consignacion-del-saldo-del-precio-del-remate',
    exactName: 'Consignación del saldo del precio del remate',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 453; art. 451 (postura y depósito previo del 40%)',
    competentAuthority: 'El juzgado de conocimiento, a cuyas órdenes se consigna',
    term: { status: 'VERIFICADO', description: 'CINCO (5) DÍAS, RELOJ DEL REMATANTE, FATAL Y CON MULTA. «El rematante deberá consignar el saldo del precio dentro de los CINCO (5) DÍAS siguientes a la diligencia a órdenes del juzgado de conocimiento, descontada la suma que depositó para hacer postura, y presentar el recibo de pago del impuesto de remate si existiere el impuesto» (art. 453). LO QUE CUESTA DEJARLO VENCER ESTÁ EN EL MISMO ARTÍCULO: «Vencido el término sin que se hubiere hecho la consignación y el pago del impuesto, el juez IMPROBARÁ EL REMATE y decretará la PÉRDIDA DE LA MITAD DE LA SUMA DEPOSITADA para hacer postura, a título de multa». Se pierde el bien y la mitad del 40% consignado para pujar.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la diligencia de remate y del bien adjudicado', mandatory: true, basis: 'Código General del Proceso, art. 453' },
      { n: 2, name: 'Título de consignación del saldo, descontado el depósito previo del cuarenta por ciento (40%)', mandatory: true, basis: 'Código General del Proceso, arts. 451 y 453' },
      { n: 3, name: 'Recibo de pago del impuesto de remate, si existiere', mandatory: true, basis: 'Código General del Proceso, art. 453' },
      { n: 4, name: 'Constancia de presentación dentro de los cinco (5) días siguientes a la diligencia', mandatory: true, basis: 'Código General del Proceso, art. 453' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/presentacion-del-avaluo-de-los-bienes-embargados',
    exactName: 'Presentación del avalúo de los bienes embargados',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 444 num. 1',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'VEINTE (20) DÍAS, RELOJ DEL CLIENTE, Y LO QUE SE PIERDE NO ES EL AVALÚO SINO LA CONTRADICCIÓN. «Las partes podrán presentar el avalúo dentro de los VEINTE (20) DÍAS siguientes a la ejecutoria de la sentencia o del auto que ordena seguir adelante la ejecución» (art. 444 num. 1). Dejarlo vencer tiene una consecuencia doble escrita en el mismo numeral: «Si no se allega oportunamente el avalúo, el juez designará el perito evaluador […] tampoco habrá lugar a objeciones». Es decir, avalúa un perito que el ejecutante no escogió y el ejecutado se queda sin poder objetarlo. En un ejecutivo con inmueble, ese silencio de veinte días fija la base del remate.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia o del auto que ordena seguir adelante la ejecución, con su fecha de ejecutoria', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 1' },
      { n: 2, name: 'Individualización de cada bien embargado que se avalúa', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 1' },
      { n: 3, name: 'Dictamen de avalúo con la calidad del perito y su fundamentación', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 1' },
      { n: 4, name: 'Constancia de presentación dentro de los veinte (20) días siguientes a la ejecutoria', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 1' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/observaciones-al-avaluo-de-los-bienes-embargados',
    exactName: 'Observaciones al avalúo de los bienes embargados',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 444 num. 2',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS DE TRASLADO, RELOJ DEL CLIENTE. «Del avalúo se correrá traslado por DIEZ (10) DÍAS mediante auto, para que los interesados presenten sus observaciones» (art. 444 num. 2). SI SE APORTA UN AVALÚO DIFERENTE, EL SEGUNDO RELOJ ES MÁS CORTO: de ese avalúo distinto se corre traslado por TRES (3) DÍAS. ADVERTENCIA QUE HAY QUE DARLE AL CLIENTE ANTES: quien no presentó su avalúo dentro de los veinte (20) días del num. 1 y dejó que lo designara el juez NO TIENE ESTA OPORTUNIDAD — «tampoco habrá lugar a objeciones». El traslado solo existe para quien llegó a tiempo antes.' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto que corrió traslado del avalúo y de su fecha', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 2' },
      { n: 2, name: 'Observaciones concretas al avalúo, bien por bien', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 2' },
      { n: 3, name: 'Avalúo diferente que se aporta, si es el caso', mandatory: false, basis: 'Código General del Proceso, art. 444 num. 2' },
      { n: 4, name: 'Constancia de presentación dentro de los diez (10) días del traslado', mandatory: true, basis: 'Código General del Proceso, art. 444 num. 2' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/liquidacion-del-credito-y-de-las-costas-en-proceso-ejecutivo',
    exactName: 'Liquidación del crédito y de las costas en proceso ejecutivo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 446 num. 1',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN LA NORMA: NO HAY DÍAS QUE CONTAR, SINO UNA CONDICIÓN DE OPORTUNIDAD. La liquidación se presenta ejecutoriada la sentencia o el auto que ordena seguir adelante la ejecución, o desde que quede en firme la providencia que resuelva sobre las excepciones. Nada extingue el derecho a presentarla, pero mientras no exista liquidación en firme no se puede señalar fecha de remate ni pagar. EL RELOJ APARECE DESPUÉS, Y ES CORTO: presentada la liquidación, quien quiera objetarla tiene tres (3) días y una carga de forma — ver la ficha de objeción.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia que ordena seguir adelante la ejecución', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 1' },
      { n: 2, name: 'Estado de cuenta con capital, intereses y su tasa, discriminado por períodos', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 1' },
      { n: 3, name: 'Liquidación de las costas y de las agencias en derecho', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 1' },
      { n: 4, name: 'Abonos y pagos parciales imputados', mandatory: false, basis: 'Código General del Proceso, art. 446 num. 1' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/objecion-a-la-liquidacion-del-credito',
    exactName: 'Objeción a la liquidación del crédito',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 446 num. 2',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'TRES (3) DÍAS, RELOJ DEL CLIENTE, Y CON UNA CARGA DE FORMA QUE SE RECHAZA DE PLANO SI FALTA. El objetante «SÓLO podrá formular objeciones relativas al estado de cuenta, para cuyo trámite deberá acompañar, SO PENA DE RECHAZO, una liquidación alternativa en la que se precisen los errores puntuales» (art. 446 num. 2). Dos consecuencias que hay que advertir antes de redactar: PRIMERA, no sirve objetar en abstracto ni discutir de nuevo la obligación — la objeción que no señala el error puntual y no trae su propia cuenta se rechaza sin estudiarla. SEGUNDA, el ámbito está cerrado al estado de cuenta: lo que debió alegarse como excepción ya precluyó.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la liquidación objetada y de la fecha del traslado', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 2' },
      { n: 2, name: 'Señalamiento puntual de cada error del estado de cuenta', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 2' },
      { n: 3, name: 'Liquidación alternativa que se acompaña, so pena de rechazo', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 2' },
      { n: 4, name: 'Constancia de presentación dentro de los tres (3) días del traslado', mandatory: true, basis: 'Código General del Proceso, art. 446 num. 2' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/solicitud-de-senalamiento-de-fecha-para-el-remate',
    exactName: 'Solicitud de señalamiento de fecha para el remate',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 448',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO, PERO CON TRES CONDICIONES QUE DEBEN ESTAR CUMPLIDAS ANTES: los bienes deben estar EMBARGADOS, SECUESTRADOS Y AVALUADOS, y la liquidación del crédito en firme. Pedir el remate sin alguna de las tres solo produce un auto que niega y pierde meses. LO QUE FIJA EL JUEZ Y CONVIENE ANTICIPARLE AL CLIENTE: «fijará la base de la licitación, que será el SETENTA POR CIENTO (70%) DEL AVALÚO de los bienes» — de ahí que el avalúo de los veinte días del art. 444 sea la pieza que decide cuánto se recupera.' },
    requiredSections: [
      { n: 1, name: 'Identificación de los bienes embargados, secuestrados y avaluados que se pide rematar', mandatory: true, basis: 'Código General del Proceso, art. 448' },
      { n: 2, name: 'Constancia de que el avalúo y la liquidación del crédito están en firme', mandatory: true, basis: 'Código General del Proceso, arts. 444, 446 y 448' },
      { n: 3, name: 'Indicación del valor del avalúo, del que se derivará la base del setenta por ciento (70%)', mandatory: true, basis: 'Código General del Proceso, art. 448' },
      { n: 4, name: 'Solicitud de comisión para el remate ante notario, cámara de comercio o martillo, si se pide', mandatory: false, basis: 'Código General del Proceso, art. 454' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/postura-para-el-remate-con-deposito-previo',
    exactName: 'Postura para el remate con depósito previo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 451',
    competentAuthority: 'El juzgado de conocimiento, o el notario, la cámara de comercio o el martillo comisionado para el remate',
    term: { status: 'VERIFICADO', description: 'CINCO (5) DÍAS ANTERIORES AL REMATE, RELOJ DEL CLIENTE Y HACIA ATRÁS: se cuenta desde la fecha de la diligencia, no desde una notificación, que es lo que lo hace fácil de perder. «Todo el que pretenda hacer postura en la subasta deberá consignar previamente en dinero, a órdenes del juzgado, el CUARENTA POR CIENTO (40%) DEL AVALÚO […] y podrá hacer postura DENTRO DE LOS CINCO (5) DÍAS ANTERIORES AL REMATE» (art. 451). EXCEPCIÓN QUE SE USA TODOS LOS DÍAS: el ejecutante único «podrá rematar por cuenta de su crédito los bienes materia de la subasta, SIN NECESIDAD DE CONSIGNAR PORCENTAJE», siempre que el crédito lo permita. La postura se presenta en sobre cerrado.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la diligencia de remate y de los bienes sobre los que se puja', mandatory: true, basis: 'Código General del Proceso, art. 451' },
      { n: 2, name: 'Título de consignación del cuarenta por ciento (40%) del avalúo, o invocación de la excepción del ejecutante único', mandatory: true, basis: 'Código General del Proceso, art. 451' },
      { n: 3, name: 'Valor ofrecido, que no puede ser inferior a la base de la licitación', mandatory: true, basis: 'Código General del Proceso, arts. 448 y 451' },
      { n: 4, name: 'Presentación en sobre cerrado dentro de los cinco (5) días anteriores al remate', mandatory: true, basis: 'Código General del Proceso, art. 451' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/alegacion-de-nulidad-o-irregularidades-del-remate',
    exactName: 'Alegación de nulidad o irregularidades del remate',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 452 inc. 3; art. 455',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'HASTA ANTES DE LA ADJUDICACIÓN. NO SON DÍAS: ES UN HITO, Y PASADO NO HAY SEGUNDA OPORTUNIDAD NI PARA EL VICIO MÁS GRAVE. «Las irregularidades que puedan afectar la validez del remate se considerarán SANEADAS si no son alegadas ANTES DE LA ADJUDICACIÓN. Las solicitudes de nulidad que se formulen DESPUÉS DE ESTA, NO SERÁN OÍDAS». Esto obliga a revisar la diligencia mientras ocurre —publicación, base, posturas, capacidad del postor— porque el saneamiento opera solo, sin que nadie lo declare. La aprobación del remate por el juez tiene su propio plazo de cinco (5) días, pero ESE RELOJ ES DEL JUZGADO, no del abogado, y su incumplimiento es falta disciplinaria gravísima del funcionario, no una carga de la parte.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la diligencia de remate y del momento procesal en que se alega', mandatory: true, basis: 'Código General del Proceso, art. 452' },
      { n: 2, name: 'Descripción concreta de la irregularidad que afecta la validez del remate', mandatory: true, basis: 'Código General del Proceso, art. 452 inc. 3' },
      { n: 3, name: 'Constancia de que se alega ANTES de la adjudicación', mandatory: true, basis: 'Código General del Proceso, art. 452 inc. 3' },
      { n: 4, name: 'Pruebas de la irregularidad alegada', mandatory: true, basis: 'Código General del Proceso, art. 452' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/solicitud-de-contracautela-al-ejecutante-en-proceso-ejecutivo',
    exactName: 'Solicitud de contracautela al ejecutante en proceso ejecutivo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 599 inc. 5',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO PARA PEDIRLA, PERO ABRE UN RELOJ DE QUINCE (15) DÍAS QUE CORRE CONTRA EL EJECUTANTE, NO CONTRA QUIEN LA PIDE. Propuestas excepciones de mérito, o afectado un tercero, puede exigirse que el ejecutante preste caución hasta por el diez por ciento (10%) del valor actual de la ejecución para responder por los perjuicios de las cautelas. «La caución deberá prestarse DENTRO DE LOS QUINCE (15) DÍAS SIGUIENTES A LA NOTIFICACIÓN DEL AUTO QUE LA ORDENE», so pena de levantamiento de las medidas. DOS EXCEPCIONES QUE HAY QUE VERIFICAR ANTES DE REDACTAR, porque hacen inútil la solicitud: no se exige caución a las entidades vigiladas por la Superintendencia Financiera ni a las de derecho público.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso ejecutivo y de las medidas cautelares practicadas', mandatory: true, basis: 'Código General del Proceso, art. 599' },
      { n: 2, name: 'Acreditación de haber propuesto excepciones de mérito, o de la afectación como tercero', mandatory: true, basis: 'Código General del Proceso, art. 599 inc. 5' },
      { n: 3, name: 'Valor actual de la ejecución y cuantificación del diez por ciento (10%) que se pide', mandatory: true, basis: 'Código General del Proceso, art. 599 inc. 5' },
      { n: 4, name: 'Manifestación de que el ejecutante no es entidad vigilada por la Superintendencia Financiera ni de derecho público', mandatory: true, basis: 'Código General del Proceso, art. 599 inc. 5' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/solicitud-de-reduccion-de-embargos',
    exactName: 'Solicitud de reducción de embargos',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 600',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'LA OPORTUNIDAD SE CIERRA CON UN HITO, NO CON DÍAS: SE PIDE ANTES DE QUE SE FIJE FECHA PARA EL REMATE. Procede cuando los bienes embargados exceden notoriamente lo necesario para el pago del crédito y las costas. UNA VEZ REQUERIDO EL EJECUTANTE, EL RELOJ ES SUYO: cuenta con cinco (5) días para pronunciarse sobre cuáles bienes deben quedar afectados. Es la defensa del ejecutado a quien le embargaron tres inmuebles por una obligación que uno solo cubre, y pierde sentido apenas señalada la fecha de subasta.' },
    requiredSections: [
      { n: 1, name: 'Identificación de todos los bienes embargados y de su avalúo o valor estimado', mandatory: true, basis: 'Código General del Proceso, art. 600' },
      { n: 2, name: 'Valor actual del crédito y de las costas, para demostrar el exceso notorio', mandatory: true, basis: 'Código General del Proceso, art. 600' },
      { n: 3, name: 'Indicación de los bienes cuyo desembargo se solicita y de los que deben quedar afectados', mandatory: true, basis: 'Código General del Proceso, art. 600' },
      { n: 4, name: 'Constancia de que aún no se ha señalado fecha para el remate', mandatory: true, basis: 'Código General del Proceso, art. 600' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/solicitud-de-beneficio-de-competencia',
    exactName: 'Solicitud de beneficio de competencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 445',
    competentAuthority: 'El juez que conoce del proceso ejecutivo',
    term: { status: 'VERIFICADO', description: 'DURANTE LA EJECUTORIA DEL AUTO QUE CORRE TRASLADO DEL AVALÚO, ES DECIR TRES (3) DÍAS, Y EL RELOJ ES DEL EJECUTADO. Es una ventana angosta y única: pedido antes no hay avalúo sobre el cual medir el patrimonio, y pedido después ya precluyó. CARGA PROBATORIA QUE DEFINE EL ÉXITO: el ejecutado debe demostrar que los bienes avaluados son su ÚNICO patrimonio, de modo que la solicitud sin prueba de esa condición se niega. Es la defensa de última hora del deudor persona natural cuyo remate lo dejaría sin nada para subsistir.' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto que corrió traslado del avalúo y de su fecha', mandatory: true, basis: 'Código General del Proceso, art. 445' },
      { n: 2, name: 'Prueba de que los bienes avaluados constituyen el único patrimonio del ejecutado', mandatory: true, basis: 'Código General del Proceso, art. 445' },
      { n: 3, name: 'Indicación de lo indispensable para la subsistencia del ejecutado', mandatory: true, basis: 'Código General del Proceso, art. 445' },
      { n: 4, name: 'Constancia de presentación dentro de la ejecutoria del auto de traslado', mandatory: true, basis: 'Código General del Proceso, art. 445' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/solicitud-de-acumulacion-de-demandas-ejecutivas',
    exactName: 'Solicitud de acumulación de demandas ejecutivas',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 463; art. 464 (acumulación de procesos)',
    competentAuthority: 'El juez que conoce del proceso ejecutivo al que se acumula',
    term: { status: 'VERIFICADO', description: 'HASTA ANTES DEL AUTO QUE FIJE LA PRIMERA FECHA PARA EL REMATE. NO SON DÍAS SINO UN HITO DEL EXPEDIENTE AJENO, así que se vigila el proceso al que se quiere entrar, no el propio. Los acreedores emplazados que comparecen tienen a su vez cinco (5) días. LÍMITE QUE HAY QUE VERIFICAR ANTES DE REDACTAR, porque hace inadmisible la solicitud: «No son acumulables procesos ejecutivos seguidos ante jueces de distintas especialidades» (art. 464) — un ejecutivo laboral no se acumula a uno civil, por más que el deudor y el bien sean los mismos.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso ejecutivo al que se pretende acumular y de su estado', mandatory: true, basis: 'Código General del Proceso, art. 463' },
      { n: 2, name: 'Título ejecutivo que se hace valer', mandatory: true, basis: 'Código General del Proceso, art. 463' },
      { n: 3, name: 'Constancia de que aún no se ha proferido el auto que fija la primera fecha de remate', mandatory: true, basis: 'Código General del Proceso, art. 463' },
      { n: 4, name: 'Manifestación de que ambos procesos corresponden a jueces de la misma especialidad', mandatory: true, basis: 'Código General del Proceso, art. 464' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/levantamiento-de-embargo-por-inembargabilidad-de-recursos-publicos',
    exactName: 'Levantamiento de embargo por inembargabilidad de recursos públicos',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 594 parágrafo; art. 597 num. 11',
    competentAuthority: 'El juez que decretó la medida, y el destinatario del oficio de embargo',
    term: { status: 'VERIFICADO', description: 'TRES (3) DÍAS HÁBILES, Y EL RELOJ NO ES DEL ABOGADO SINO DEL DESTINATARIO DEL OFICIO: SU SILENCIO REVOCA LA MEDIDA SOLO. «Si pasados TRES (3) DÍAS HÁBILES el destinatario no recibe oficio alguno, SE ENTENDERÁ REVOCADA LA MEDIDA CAUTELAR.» Por eso la actuación útil no es esperar el auto sino acreditar la naturaleza de los recursos. LEGITIMACIÓN ESPECIAL Y AMPLIA, que conviene aprovechar: pueden pedirlo el Procurador General, el ministro del ramo, el alcalde, el gobernador o la Agencia Nacional de Defensa Jurídica del Estado, además de la entidad afectada. ADVERTENCIA DE VIGENCIA: la compilación oficial marca el art. 594 como declarado condicionalmente exequible; el fallo respectivo no se abrió al verificar esta ficha.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la cuenta o del recurso embargado y del oficio que lo ordenó', mandatory: true, basis: 'Código General del Proceso, art. 593' },
      { n: 2, name: 'Acreditación de que los recursos son inembargables, con el numeral del art. 594 aplicable', mandatory: true, basis: 'Código General del Proceso, art. 594' },
      { n: 3, name: 'Certificación de la naturaleza de los recursos expedida por la entidad competente', mandatory: true, basis: 'Código General del Proceso, art. 594 par.' },
      { n: 4, name: 'Calidad en que se actúa, cuando se invoca la legitimación especial del parágrafo', mandatory: false, basis: 'Código General del Proceso, art. 594 par.' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/solicitud-de-embargo-de-remanentes-y-de-bienes-desembargados',
    exactName: 'Solicitud de embargo de remanentes y de bienes desembargados',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 466',
    competentAuthority: 'El juez del proceso donde ya existe el embargo, que comunica al juez que decreta el de remanentes',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN LA NORMA, PERO LLEGAR TARDE NO SE MIDE EN DÍAS SINO EN ORDEN DE TURNO. Es la herramienta del acreedor que encuentra el bien ya embargado por otro: se persigue lo que sobre del remate ajeno y lo que se desembargue. LO QUE DEBE ADVERTIRSE AL CLIENTE: el remanente es eventual — si el primer remate no alcanza a cubrir el crédito anterior, no queda nada, y el embargo de remanentes no da prelación alguna sobre el crédito que ya estaba.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y del juzgado donde los bienes ya están embargados', mandatory: true, basis: 'Código General del Proceso, art. 466' },
      { n: 2, name: 'Individualización de los bienes cuyo remanente se persigue', mandatory: true, basis: 'Código General del Proceso, art. 466' },
      { n: 3, name: 'Solicitud de que se comunique el embargo de remanentes al juez del proceso anterior', mandatory: true, basis: 'Código General del Proceso, art. 466' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/recurso-de-reposicion-en-concurrencia-de-embargos-de-distintas-especialidades',
    exactName: 'Recurso de reposición en concurrencia de embargos de distintas especialidades',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 465',
    competentAuthority: 'El juez que recibió el oficio de embargo concurrente',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS DESDE EL RECIBO DEL OFICIO, RELOJ DEL CLIENTE. Cuando concurren embargos decretados por jueces de distintas especialidades sobre el mismo bien, la parte que discute la prelación o el destino del bien cuenta con diez (10) días contados desde el recibo del oficio para reponer. Es un plazo que corre desde un acto de comunicación entre despachos y no desde una notificación al abogado, y por eso se pierde: hay que vigilar el expediente, no el estado.' },
    requiredSections: [
      { n: 1, name: 'Identificación de los procesos concurrentes y de los jueces de cada especialidad', mandatory: true, basis: 'Código General del Proceso, art. 465' },
      { n: 2, name: 'Fecha de recibo del oficio, de la que corren los diez (10) días', mandatory: true, basis: 'Código General del Proceso, art. 465' },
      { n: 3, name: 'Razones de la reposición sobre la prelación o el destino del bien', mandatory: true, basis: 'Código General del Proceso, art. 465' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/levantamiento-de-cautelas-por-no-promover-la-liquidacion-de-la-sociedad-conyugal-o-patrimonial',
    exactName: 'Levantamiento de cautelas por no promover la liquidación de la sociedad conyugal o patrimonial',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 598 num. 3',
    competentAuthority: 'El juez de familia que conoció del proceso, aun de oficio',
    term: { status: 'VERIFICADO', description: 'DOS (2) MESES, RELOJ DEL CLIENTE, Y SE VENCE EN EL MOMENTO EN QUE LA GENTE CREE QUE YA GANÓ. «Si dentro de los DOS (2) MESES siguientes a la ejecutoria de la sentencia que disuelva la sociedad conyugal o patrimonial, NO SE HUBIERE PROMOVIDO LA LIQUIDACIÓN de esta, SE LEVANTARÁN AUN DE OFICIO las medidas cautelares» (art. 598 num. 3). Disuelta la sociedad, el cónyuge respira y deja pasar el trámite; a los dos meses los bienes que se cautelaron para asegurar su parte quedan libres y disponibles para el otro. El juez lo hace SIN QUE NADIE SE LO PIDA, así que no hay contraparte a quien culpar ni auto que recurrir por sorpresa.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia que disolvió la sociedad conyugal o patrimonial y de su ejecutoria', mandatory: true, basis: 'Código General del Proceso, art. 598 num. 3' },
      { n: 2, name: 'Individualización de las medidas cautelares vigentes sobre los bienes sociales', mandatory: true, basis: 'Código General del Proceso, art. 598' },
      { n: 3, name: 'Constancia de si se promovió o no la liquidación dentro de los dos (2) meses', mandatory: true, basis: 'Código General del Proceso, art. 598 num. 3' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr015.html'
  },
  {
    id: 'civil/promesa-de-compraventa-de-inmueble',
    exactName: 'Promesa de compraventa de inmueble',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, art. 1611, subrogado por el art. 89 de la Ley 153 de 1887',
    competentAuthority: 'Ninguna. Es un documento privado: no requiere escritura pública ni intervención de notario o juez',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO LEGAL PARA CELEBRARLA, PERO CON CUATRO REQUISITOS DE VALIDEZ QUE SE EXIGEN JUNTOS, Y SI FALTA UNO LA PROMESA NO VALE NADA. La norma no dice «es anulable»: dice que «NO PRODUCE OBLIGACIÓN ALGUNA». «La promesa de celebrar un contrato no produce obligación alguna, salvo que concurran las circunstancias siguientes: 1a.) Que la promesa conste POR ESCRITO. 2a.) Que el contrato a que la promesa se refiere no sea de aquellos que las leyes declaran ineficaces por no concurrir los requisitos que establece el artículo 1502 del Código Civil. 3a.) Que la promesa contenga un PLAZO O CONDICIÓN QUE FIJE LA ÉPOCA en que ha de celebrarse el contrato. 4a.) Que se DETERMINE DE TAL SUERTE EL CONTRATO, que para perfeccionarlo solo falte la tradición de la cosa o las formalidades legales.» EL RELOJ DEL CLIENTE NACE DEL REQUISITO TERCERO Y LO FIJAN LAS PARTES, NO LA LEY: la promesa sin fecha ni condición es inválida, y la que sí la trae impone una carga de calendario que hay que llevar al cliente. Redactar mal ese plazo es la causa más común de que una promesa se caiga entera.' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes y del inmueble prometido, con su matrícula inmobiliaria', mandatory: true, basis: 'Código Civil, art. 1611 num. 4' },
      { n: 2, name: 'Plazo o condición que fije la época en que ha de celebrarse el contrato prometido', mandatory: true, basis: 'Código Civil, art. 1611 num. 3' },
      { n: 3, name: 'Determinación del contrato prometido de modo que solo falte la tradición o las formalidades legales', mandatory: true, basis: 'Código Civil, art. 1611 num. 4' },
      { n: 4, name: 'Precio, forma de pago y notaría en que se otorgará la escritura', mandatory: true, basis: 'Código Civil, art. 1611 num. 4' },
      { n: 5, name: 'Arras o cláusula penal, si se pactan, con expresión de su naturaleza', mandatory: false, basis: 'Código Civil, arts. 1859 a 1861' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'
  },
  {
    id: 'civil/demanda-ejecutiva-para-que-se-suscriba-la-escritura-publica-prometida',
    exactName: 'Demanda ejecutiva para que se suscriba la escritura pública prometida',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, arts. 434 y 436; Código Civil, art. 1610 num. 1',
    competentAuthority: 'El juez civil, que otorga la escritura en nombre del ejecutado si este no la suscribe',
    term: { status: 'VERIFICADO', description: 'EL PLAZO DE TRES (3) DÍAS QUE TRAE EL ARTÍCULO ES DEL DEUDOR, NO DEL CLIENTE, Y CONFUNDIRLO ES EL ERROR TÍPICO: «el mandamiento ejecutivo […] comprenderá la prevención al demandado de que EN CASO DE NO SUSCRIBIR la escritura o el documento en el término de tres (3) días, contados a partir de la notificación del mandamiento, EL JUEZ PROCEDERÁ A HACERLO EN SU NOMBRE» (art. 434). EL RELOJ DEL CLIENTE ES LA PRESCRIPCIÓN EJECUTIVA: CINCO (5) AÑOS desde que la obligación se hizo exigible (Código Civil, art. 2536, modificado por el art. 8 de la Ley 791 de 2002). REQUISITO QUE HUNDE DEMANDAS Y HAY QUE CUMPLIR ANTES DE RADICAR: «para que pueda dictarse mandamiento ejecutivo será necesario que EL BIEN OBJETO DE LA ESCRITURA SE HAYA EMBARGADO COMO MEDIDA PREVIA y que se presente CERTIFICADO QUE ACREDITE LA PROPIEDAD». Es decir, primero la cautela, después la ejecución. Y el otorgamiento por el juez «no podrá llevarse a efecto sino una vez ejecutoriada la providencia que ordene seguir adelante la ejecución» (art. 436).' },
    requiredSections: [
      { n: 1, name: 'Promesa de compraventa que sirve de título ejecutivo, con sus cuatro requisitos de validez acreditados', mandatory: true, basis: 'Código Civil, art. 1611; Código General del Proceso, art. 422' },
      { n: 2, name: 'Solicitud de embargo previo del bien objeto de la escritura', mandatory: true, basis: 'Código General del Proceso, art. 434' },
      { n: 3, name: 'Certificado que acredite la propiedad del ejecutado sobre el inmueble', mandatory: true, basis: 'Código General del Proceso, art. 434' },
      { n: 4, name: 'Petición de que el juez otorgue la escritura en nombre del ejecutado si no la suscribe en tres (3) días', mandatory: true, basis: 'Código General del Proceso, arts. 434 y 436' },
      { n: 5, name: 'Perjuicios moratorios que se demanden', mandatory: false, basis: 'Código General del Proceso, art. 434' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr016.html'
  },
  {
    id: 'civil/demanda-de-resolucion-de-la-promesa-de-compraventa-por-incumplimiento',
    exactName: 'Demanda de resolución de la promesa de compraventa por incumplimiento',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, art. 1546 (condición resolutoria tácita) y arts. 1613 a 1616 (perjuicios); art. 2536, modificado por el art. 8 de la Ley 791 de 2002',
    competentAuthority: 'El juez civil, por el trámite del proceso verbal',
    term: { status: 'VERIFICADO', description: 'NO HAY CADUCIDAD. EL RELOJ DEL CLIENTE ES LA PRESCRIPCIÓN ORDINARIA DE DIEZ (10) AÑOS: «La acción ejecutiva se prescribe por cinco (5) años. Y la ordinaria por diez (10)» (art. 2536, modificado por la Ley 791 de 2002). LA ELECCIÓN QUE DEFINE EL PLEITO Y HAY QUE HACER AL REDACTAR: «En los contratos bilaterales va envuelta la condición resolutoria en caso de no cumplirse por uno de los contratantes lo pactado» (art. 1546), y el acreedor puede pedir a su arbitrio la RESOLUCIÓN o el CUMPLIMIENTO, en ambos casos con indemnización de perjuicios. Pedir la resolución deshace el negocio y obliga a restituciones mutuas; pedir el cumplimiento va por la vía ejecutiva del art. 434 del CGP y conserva el inmueble. No son acumulables sin subsidiariedad.' },
    requiredSections: [
      { n: 1, name: 'Promesa de compraventa y prueba de su validez', mandatory: true, basis: 'Código Civil, art. 1611' },
      { n: 2, name: 'Acreditación del incumplimiento del demandado y del cumplimiento propio', mandatory: true, basis: 'Código Civil, art. 1546' },
      { n: 3, name: 'Pretensión de resolución, o de cumplimiento como subsidiaria', mandatory: true, basis: 'Código Civil, art. 1546' },
      { n: 4, name: 'Liquidación de los perjuicios, o invocación de la cláusula penal pactada', mandatory: true, basis: 'Código Civil, arts. 1613 a 1616' },
      { n: 5, name: 'Restituciones mutuas que se solicitan', mandatory: true, basis: 'Código Civil, art. 1546' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'
  },
  {
    id: 'civil/retractacion-por-arras-y-reclamacion-de-arras-dobladas',
    exactName: 'Retractación por arras y reclamación de arras dobladas',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, arts. 1859, 1860 y 1861',
    competentAuthority: 'Extrajudicial en primer término; el juez civil si se discute la naturaleza de las arras o su devolución',
    term: { status: 'VERIFICADO', description: 'DOS (2) MESES, RELOJ DEL CLIENTE, Y ADEMÁS SE EXTINGUE POR HECHOS, NO SOLO POR EL PASO DEL TIEMPO: «Si los contratantes no hubieren fijado plazo dentro del cual puedan retractarse, perdiendo las arras, NO HABRÁ LUGAR A LA RETRACTACIÓN DESPUÉS DE LOS DOS MESES subsiguientes a la convención, NI DESPUÉS DE OTORGADA ESCRITURA PÚBLICA de la venta O DE PRINCIPIADA LA ENTREGA» (art. 1860). Entregar las llaves cierra la puerta igual que el calendario. LA DISTINCIÓN QUE DECIDE EL CASO ANTES DE MIRAR EL PLAZO: si las arras se dieron «como parte del precio, o como señal de quedar convenidos los contratantes, QUEDARÁ PERFECTA LA VENTA» (art. 1861) — y entonces no hay retractación posible, sino un contrato perfeccionado que solo se deshace por resolución. Redactar la promesa sin decir de qué clase son las arras es lo que produce este pleito.' },
    requiredSections: [
      { n: 1, name: 'Cláusula de arras y calificación de su naturaleza: de retractación o parte del precio', mandatory: true, basis: 'Código Civil, arts. 1859 y 1861' },
      { n: 2, name: 'Fecha de la convención, de la que corren los dos (2) meses', mandatory: true, basis: 'Código Civil, art. 1860' },
      { n: 3, name: 'Constancia de que no se ha otorgado escritura pública ni principiado la entrega', mandatory: true, basis: 'Código Civil, art. 1860' },
      { n: 4, name: 'Manifestación de retractación, o reclamación de las arras dobladas según quién se retracte', mandatory: true, basis: 'Código Civil, art. 1859' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'
  },
  {
    id: 'civil/demanda-de-rescision-por-lesion-enorme',
    exactName: 'Demanda de rescisión por lesión enorme',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, arts. 1946, 1947, 1949 (subrogado por el art. 32 de la Ley 57 de 1887), 1950, 1951 y 1954',
    competentAuthority: 'El juez civil',
    term: { status: 'VERIFICADO', description: 'CUATRO (4) AÑOS DE CADUCIDAD, RELOJ DEL CLIENTE, Y SE CUENTAN DESDE LA FECHA DEL CONTRATO — NO DESDE QUE EL CLIENTE DESCUBRE QUE LE PAGARON DE MENOS, QUE ES CUANDO SUELE CONSULTAR. «La acción rescisoria por lesión enorme EXPIRA EN CUATRO AÑOS, CONTADOS DESDE LA FECHA DE CONTRATO» (art. 1954). UMBRAL QUE HAY QUE MEDIR ANTES DE DEMANDAR: «El vendedor sufre lesión enorme cuando el precio que recibe es INFERIOR A LA MITAD DEL JUSTO PRECIO de la cosa que vende; y el comprador a su vez sufre lesión enorme, cuando el justo precio de la cosa que compra es inferior a la mitad del precio que paga por ella» (art. 1947). TRES FILTROS DE IMPROCEDENCIA QUE HAY QUE VERIFICAR PRIMERO, porque hacen inútil la demanda: no procede «en las ventas de bienes muebles, ni en las que se hubieren hecho por ministerio de la justicia» (art. 1949); se pierde si el comprador ya enajenó la cosa (art. 1951); y la renuncia anticipada a la acción no vale (art. 1950).' },
    requiredSections: [
      { n: 1, name: 'Escritura de compraventa y fecha del contrato, de la que corren los cuatro (4) años', mandatory: true, basis: 'Código Civil, art. 1954' },
      { n: 2, name: 'Avalúo que acredite el justo precio al tiempo del contrato y demuestre el umbral de la mitad', mandatory: true, basis: 'Código Civil, art. 1947' },
      { n: 3, name: 'Constancia de que el bien es inmueble y de que la venta no se hizo por ministerio de la justicia', mandatory: true, basis: 'Código Civil, art. 1949' },
      { n: 4, name: 'Certificado de tradición que acredite que el comprador no ha enajenado la cosa', mandatory: true, basis: 'Código Civil, art. 1951' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'
  },
  {
    id: 'civil/demanda-de-saneamiento-por-vicios-redhibitorios',
    exactName: 'Demanda de saneamiento por vicios redhibitorios',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, arts. 1914, 1915, 1923 y 1926',
    competentAuthority: 'El juez civil',
    term: { status: 'VERIFICADO', description: 'CUATRO PLAZOS DISTINTOS, TODOS RELOJ DEL CLIENTE, Y LO QUE DECIDE CUÁL APLICA ES QUÉ SE PIDE Y SOBRE QUÉ BIEN. PARA DESHACER LA VENTA (acción redhibitoria): «La acción redhibitoria durará SEIS MESES respecto de las cosas MUEBLES y UN AÑO respecto de los BIENES RAÍCES, en todos los casos en que las leyes especiales o las estipulaciones de los contratantes no hubieren ampliado o restringido este plazo. EL TIEMPO SE CONTARÁ DESDE LA ENTREGA REAL» (art. 1923). PARA REBAJAR EL PRECIO Y QUEDARSE CON EL BIEN: «La acción para pedir rebaja del precio […] PRESCRIBE EN UN AÑO para los bienes MUEBLES y en DIEZ Y OCHO MESES para los bienes RAÍCES» (art. 1926). EN INMUEBLES, ENTONCES: un año para rescindir y dieciocho meses para rebajar, contados desde la entrega real y no desde que apareció el vicio. Un cliente que descubre la humedad al año y medio ya solo tiene la rebaja, y por poco tiempo. LAS PARTES PUEDEN HABER AMPLIADO O RESTRINGIDO ESOS PLAZOS EN EL CONTRATO: hay que leer la escritura antes de contar.' },
    requiredSections: [
      { n: 1, name: 'Fecha de la entrega real del bien, de la que corren todos los plazos', mandatory: true, basis: 'Código Civil, art. 1923' },
      { n: 2, name: 'Descripción del vicio y prueba de que era oculto, grave y anterior a la venta', mandatory: true, basis: 'Código Civil, art. 1915' },
      { n: 3, name: 'Elección de la acción: rescisión de la venta o rebaja del precio, con el plazo que corresponde', mandatory: true, basis: 'Código Civil, arts. 1923 y 1926' },
      { n: 4, name: 'Revisión de la escritura para verificar si las partes ampliaron o restringieron el plazo', mandatory: true, basis: 'Código Civil, art. 1923' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'
  },
  {
    id: 'civil/demanda-de-saneamiento-por-eviccion',
    exactName: 'Demanda de saneamiento por evicción',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código Civil, arts. 1893 y 1913; art. 2536, modificado por el art. 8 de la Ley 791 de 2002',
    competentAuthority: 'El juez civil',
    term: { status: 'VERIFICADO', description: 'CUATRO (4) AÑOS PARA EL SANEAMIENTO, PERO LA SOLA RESTITUCIÓN DEL PRECIO VA POR DIEZ (10), Y ESA DIFERENCIA SALVA CASOS QUE PARECEN VENCIDOS. «La acción de saneamiento por evicción PRESCRIBE EN CUATRO AÑOS; mas por lo tocante a LA SOLA RESTITUCIÓN DEL PRECIO, prescribe según las reglas generales» (art. 1913) — es decir, por la prescripción ordinaria de diez (10) años del art. 2536. Al cliente que llega a los cinco años se le acabó la indemnización de perjuicios, pero no necesariamente la devolución de lo que pagó. QUÉ COMPRENDE LA OBLIGACIÓN: «amparar al comprador en el dominio y posesión pacífica de la cosa vendida, y responder de los defectos ocultos de ésta, llamados vicios redhibitorios» (art. 1893). CARGA PROCESAL QUE SE PIERDE POR OMISIÓN: el comprador demandado por un tercero debe DENUNCIAR EL PLEITO al vendedor dentro del proceso; no hacerlo compromete el saneamiento.' },
    requiredSections: [
      { n: 1, name: 'Título de adquisición y prueba de la turbación o privación del dominio por un tercero', mandatory: true, basis: 'Código Civil, art. 1893' },
      { n: 2, name: 'Constancia de la denuncia del pleito al vendedor, cuando la evicción se discute en otro proceso', mandatory: true, basis: 'Código Civil, art. 1899' },
      { n: 3, name: 'Pretensión: restitución del precio y, si el plazo lo permite, indemnización de perjuicios', mandatory: true, basis: 'Código Civil, art. 1913' },
      { n: 4, name: 'Cómputo del plazo aplicable según lo que se reclama', mandatory: true, basis: 'Código Civil, arts. 1913 y 2536' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html'
  },
  {
    id: 'civil/impugnacion-de-decisiones-de-la-asamblea-de-copropietarios',
    exactName: 'Impugnación de decisiones de la asamblea de copropietarios',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 675 de 2001, art. 49 (legitimación y causal); Código General del Proceso, art. 382 (el término)',
    competentAuthority: 'El juez civil, por el trámite del proceso verbal. NO es el comité de convivencia, que carece de poder decisorio, ni la alcaldía',
    term: { status: 'VERIFICADO', description: 'DOS (2) MESES DE CADUCIDAD, RELOJ DEL CLIENTE, Y EL PLAZO YA NO VIVE EN LA LEY 675 — QUIEN LO BUSQUE ALLÍ CITA NORMA MUERTA. El inciso del art. 49 que lo fijaba fue DEROGADO por el literal c) del art. 626 de la Ley 1564 de 2012, con vigencia desde el 1 de enero de 2014; se comprobó en el texto oficial. Hoy el término lo da el CGP: «La demanda de impugnación de actos o decisiones de asambleas, juntas directivas, juntas de socios o de cualquier otro órgano directivo de personas jurídicas de derecho privado, SOLO PODRÁ PROPONERSE, SO PENA DE CADUCIDAD, DENTRO DE LOS DOS (2) MESES siguientes a la fecha del acto respectivo y deberá dirigirse contra la entidad. Si se tratare de acuerdos o actos SUJETOS A REGISTRO, el término se contará DESDE LA FECHA DE LA INSCRIPCIÓN» (art. 382). ESA SEGUNDA REGLA CAMBIA EL CÓMPUTO EN LAS REFORMAS DE REGLAMENTO, que sí se registran. LEGITIMACIÓN TASADA: «El administrador, el Revisor Fiscal y los propietarios de bienes privados» (Ley 675, art. 49) — un arrendatario no está legitimado. Puede pedirse suspensión provisional del acto impugnado, prestando caución (art. 382 inc. 2).' },
    requiredSections: [
      { n: 1, name: 'Acta de la asamblea y fecha del acto, o fecha de su inscripción si es acto sujeto a registro', mandatory: true, basis: 'Código General del Proceso, art. 382' },
      { n: 2, name: 'Acreditación de la legitimación: administrador, revisor fiscal o propietario de bien privado', mandatory: true, basis: 'Ley 675 de 2001, art. 49' },
      { n: 3, name: 'Señalamiento de la prescripción legal o del reglamento que la decisión desconoce', mandatory: true, basis: 'Ley 675 de 2001, art. 49' },
      { n: 4, name: 'Demanda dirigida contra la persona jurídica de la copropiedad', mandatory: true, basis: 'Código General del Proceso, art. 382' },
      { n: 5, name: 'Solicitud de suspensión provisional del acto, con ofrecimiento de caución', mandatory: false, basis: 'Código General del Proceso, art. 382 inc. 2' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0675_2001_pr001.html'
  },
  {
    id: 'civil/demanda-ejecutiva-de-cobro-de-cuotas-de-administracion',
    exactName: 'Demanda ejecutiva de cobro de cuotas de administración',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 675 de 2001, art. 48 (título ejecutivo) y art. 30 (intereses); Código General del Proceso, art. 422; Código Civil, art. 2536, modificado por el art. 8 de la Ley 791 de 2002',
    competentAuthority: 'El juez civil municipal o del circuito, según la cuantía',
    term: { status: 'VERIFICADO', description: 'SIN CADUCIDAD. EL RELOJ DEL CLIENTE ES LA PRESCRIPCIÓN EJECUTIVA DE CINCO (5) AÑOS, y corre CUOTA POR CUOTA desde que cada una se hizo exigible (Código Civil, art. 2536, modificado por la Ley 791 de 2002): una copropiedad que deja dormir la cartera pierde las cuotas más viejas mientras las nuevas siguen vivas. EL TÍTULO ES TASADO Y NO ADMITE ADORNOS: «el título ejecutivo contentivo de la obligación QUE SERÁ SOLAMENTE EL CERTIFICADO EXPEDIDO POR EL ADMINISTRADOR SIN NINGÚN REQUISITO NI PROCEDIMIENTO ADICIONAL» (art. 48). NO HAY REQUISITO DE PROCEDIBILIDAD, y conviene saberlo porque muchas copropiedades pierden meses en conciliaciones inútiles: «La acción ejecutiva a que se refiere este artículo, NO ESTARÁ SUPEDITADA AL AGOTAMIENTO PREVIO DE LOS MECANISMOS PARA LA SOLUCIÓN DE CONFLICTOS previstos en la presente ley.»' },
    requiredSections: [
      { n: 1, name: 'Certificado de deuda expedido por el administrador, que es el título ejecutivo', mandatory: true, basis: 'Ley 675 de 2001, art. 48' },
      { n: 2, name: 'Certificado de existencia y representación legal de la persona jurídica de la copropiedad', mandatory: true, basis: 'Ley 675 de 2001, art. 48' },
      { n: 3, name: 'Liquidación de las cuotas adeudadas por período, con verificación de que ninguna pasó de cinco (5) años', mandatory: true, basis: 'Código Civil, art. 2536' },
      { n: 4, name: 'Certificado de los intereses causados', mandatory: true, basis: 'Ley 675 de 2001, art. 30' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0675_2001_pr001.html'
  },
  {
    id: 'civil/impugnacion-de-sancion-por-incumplimiento-del-reglamento-de-propiedad-horizontal',
    exactName: 'Impugnación de sanción por incumplimiento del reglamento de propiedad horizontal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 675 de 2001, arts. 59, 60 y 62',
    competentAuthority: 'El juez civil. La sanción, en cambio, la impone la asamblea general o el consejo de administración cuando el reglamento le atribuyó esa facultad — órganos privados, no autoridad pública',
    term: { status: 'VERIFICADO', description: 'UN (1) MES, RELOJ DEL CLIENTE, Y SIGUE VIGENTE PESE A QUE EL ARTÍCULO APARECE PARCIALMENTE TACHADO. «La impugnación SÓLO PODRÁ INTENTARSE DENTRO DEL MES SIGUIENTE a la fecha de la comunicación de la respectiva sanción» (art. 62). ALCANCE EXACTO DE LA DEROGATORIA, COMPROBADO EN EL TEXTO OFICIAL: el literal c) del art. 626 de la Ley 1564 de 2012 tachó ÚNICAMENTE la frase que remitía al procedimiento del art. 194 del Código de Comercio; la oración del plazo quedó fuera del tachado y conserva su vigencia. Quien lea la nota de derogatoria por encima puede creer que el artículo entero murió y dejar pasar el mes. LO QUE HAY QUE REVISAR PARA ATACAR LA SANCIÓN: «Para su imposición se respetarán los procedimientos contemplados en el reglamento de propiedad horizontal, consultando el DEBIDO PROCESO, el derecho de defensa y contradicción e impugnación» (art. 60), además de la proporcionalidad y la valoración de la intencionalidad. TOPES LEGALES QUE SUELEN EXCEDERSE: las multas sucesivas «no podrán ser superiores, cada una, a DOS (2) VECES el valor de las expensas necesarias mensuales […] que, en todo caso, SUMADAS NO PODRÁN EXCEDER DE DIEZ (10) VECES las expensas necesarias mensuales a cargo del infractor» (art. 59), y está prohibido restringir el uso de bienes comunes esenciales.' },
    requiredSections: [
      { n: 1, name: 'Comunicación de la sanción y su fecha, de la que corre el mes', mandatory: true, basis: 'Ley 675 de 2001, art. 62' },
      { n: 2, name: 'Reglamento de propiedad horizontal y verificación de que atribuye la facultad sancionatoria al órgano que la ejerció', mandatory: true, basis: 'Ley 675 de 2001, art. 60' },
      { n: 3, name: 'Señalamiento de las garantías del debido proceso que se desconocieron', mandatory: true, basis: 'Ley 675 de 2001, art. 60' },
      { n: 4, name: 'Verificación de los topes de la multa y de la prohibición de restringir bienes comunes esenciales', mandatory: true, basis: 'Ley 675 de 2001, art. 59' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0675_2001_pr001.html'
  },
  {
    id: 'civil/reforma-del-reglamento-de-propiedad-horizontal',
    exactName: 'Reforma del reglamento de propiedad horizontal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 675 de 2001, art. 46 num. 5 y su parágrafo, y art. 45; Código General del Proceso, art. 382 (caducidad de la impugnación)',
    competentAuthority: 'La asamblea general de copropietarios aprueba; el notario protocoliza la escritura y la Oficina de Registro de Instrumentos Públicos la inscribe',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO PARA REFORMARLO, PERO EL RELOJ QUE IMPORTA ES EL DE QUIEN QUIERA ATACARLA: DOS (2) MESES DE CADUCIDAD QUE CORREN DESDE LA INSCRIPCIÓN, NO DESDE LA ASAMBLEA, POR SER ACTO SUJETO A REGISTRO (Código General del Proceso, art. 382). Al redactar hay que advertirlo a ambos lados: la copropiedad no queda tranquila el día de la asamblea sino dos meses después de registrar. MAYORÍA CALIFICADA: «las siguientes decisiones requerirán mayoría calificada del SETENTA POR CIENTO (70%) de los coeficientes de copropiedad que integran el edificio o conjunto: […] 5. Reforma a los estatutos y reglamento» (art. 46). TOPE QUE ANULA LOS REGLAMENTOS MÁS EXIGENTES: «Para ninguna decisión, salvo la relativa a la extinción de la propiedad horizontal, se podrá exigir una mayoría superior al setenta por ciento (70%) […] LAS MAYORÍAS SUPERIORES PREVISTAS EN LOS REGLAMENTOS SE ENTENDERÁN POR NO ESCRITAS», y «Las decisiones que se adopten en contravención a lo prescrito en este artículo, SERÁN ABSOLUTAMENTE NULAS» (art. 45). RESTRICCIÓN DE FORMA QUE INVALIDA LA REFORMA: estas decisiones no pueden tomarse en reuniones no presenciales ni de segunda convocatoria, salvo que se obtenga la mayoría legal (art. 46 par.).' },
    requiredSections: [
      { n: 1, name: 'Convocatoria y acta que acrediten la mayoría del setenta por ciento (70%) de los coeficientes', mandatory: true, basis: 'Ley 675 de 2001, art. 46 num. 5' },
      { n: 2, name: 'Constancia de que la reunión fue presencial y de primera convocatoria, o de que se obtuvo la mayoría legal', mandatory: true, basis: 'Ley 675 de 2001, art. 46 par.' },
      { n: 3, name: 'Texto de la reforma, sin exigencias de mayoría superiores al setenta por ciento (70%)', mandatory: true, basis: 'Ley 675 de 2001, art. 45' },
      { n: 4, name: 'Escritura pública de protocolización y su inscripción en la Oficina de Registro de Instrumentos Públicos', mandatory: true, basis: 'Ley 675 de 2001, art. 46' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0675_2001_pr001.html'
  },
  {
    id: 'civil/preaviso-de-terminacion-del-arrendamiento-de-vivienda-por-el-arrendador',
    exactName: 'Preaviso de terminación del arrendamiento de vivienda por el arrendador',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 820 de 2003, art. 22 num. 8 (al vencimiento, con causal) y num. 7 en concordancia con el art. 23 (durante prórrogas, con indemnización)',
    competentAuthority: 'Ninguna autoridad recibe el preaviso: se dirige al arrendatario a través de SERVICIO POSTAL AUTORIZADO. La indemnización del num. 7 se consigna a órdenes de la autoridad competente que señale el Gobierno Nacional',
    term: { status: 'VERIFICADO', description: 'TRES (3) MESES, RELOJ DEL ARRENDADOR, Y ES FATAL: PERDERLO REGALA UN PERÍODO COMPLETO DEL CONTRATO. «previo aviso escrito al arrendatario a través del SERVICIO POSTAL AUTORIZADO con una antelación NO MENOR A TRES (3) MESES a la referida fecha de vencimiento», y la consecuencia está escrita: «DE NO MEDIAR CONSTANCIA POR ESCRITO DEL PREAVISO, EL CONTRATO DE ARRENDAMIENTO SE ENTENDERÁ RENOVADO AUTOMÁTICAMENTE por un término igual al inicialmente pactado» (art. 22 num. 8). LA CONSTANCIA ES PRUEBA, NO FORMALISMO: el correo electrónico o el mensaje de texto no sustituyen el servicio postal autorizado, y sin esa constancia el preaviso no existe. CARGA ADICIONAL EN LAS CAUSALES DE LOS LITERALES a), b) y c) — necesitar el inmueble para vivienda propia, para demolerlo o para entregarlo a un nuevo arrendatario: debe acompañarse CAUCIÓN EQUIVALENTE A SEIS (6) MESES DE CANON, y la causal invocada debe cumplirse DENTRO DE LOS SEIS (6) MESES SIGUIENTES A LA RESTITUCIÓN, so pena de responder. TERMINACIÓN DURANTE LA PRÓRROGA, SIN CAUSAL: el mismo preaviso de tres meses más «el pago de una INDEMNIZACIÓN EQUIVALENTE AL PRECIO DE TRES (3) MESES de arrendamiento» (art. 22 num. 7).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato, de su fecha de vencimiento y del período que corre', mandatory: true, basis: 'Ley 820 de 2003, art. 22' },
      { n: 2, name: 'Causal invocada, o manifestación de que se termina durante la prórroga con indemnización', mandatory: true, basis: 'Ley 820 de 2003, art. 22 num. 7 y 8' },
      { n: 3, name: 'Constancia de envío por servicio postal autorizado con tres (3) meses de antelación', mandatory: true, basis: 'Ley 820 de 2003, art. 22 num. 8' },
      { n: 4, name: 'Caución de seis (6) meses de canon, en las causales de los literales a), b) y c)', mandatory: false, basis: 'Ley 820 de 2003, art. 22 num. 8' },
      { n: 5, name: 'Consignación de la indemnización de tres (3) meses, cuando se termina durante la prórroga', mandatory: false, basis: 'Ley 820 de 2003, arts. 22 num. 7 y 23' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html'
  },
  {
    id: 'civil/preaviso-de-terminacion-del-arrendamiento-de-vivienda-por-el-arrendatario',
    exactName: 'Preaviso de terminación del arrendamiento de vivienda por el arrendatario',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 820 de 2003, art. 24 num. 4 y num. 5, en concordancia con el art. 25',
    competentAuthority: 'Ninguna: se dirige al arrendador a través de SERVICIO POSTAL AUTORIZADO',
    term: { status: 'VERIFICADO', description: 'TRES (3) MESES EN AMBOS CASOS, RELOJ DEL ARRENDATARIO, Y LA DIFERENCIA DE DINERO ENTRE AVISAR A TIEMPO O NO DEPENDE SOLO DE CUÁNDO SE AVISA. AL VENCIMIENTO, SIN PAGAR NADA: «siempre y cuando dé previo aviso escrito al arrendador a través del servicio postal autorizado, con una antelación NO MENOR DE TRES (3) MESES a la referida fecha de vencimiento. En este caso el arrendatario NO ESTARÁ OBLIGADO A INVOCAR CAUSAL ALGUNA diferente a la de su plena voluntad, NI DEBERÁ INDEMNIZAR AL ARRENDADOR» (art. 24 num. 5). DURANTE EL TÉRMINO, PAGANDO: la terminación unilateral anticipada del num. 4 exige el mismo preaviso y una indemnización. ESTA ES LA FICHA QUE MÁS DINERO LE AHORRA A UN CLIENTE: el inquilino que quiere irse y consulta con tres meses de anticipación no paga nada; el que consulta con uno, paga indemnización por una diferencia de calendario que nadie le explicó.' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato y de su fecha de vencimiento', mandatory: true, basis: 'Ley 820 de 2003, art. 24' },
      { n: 2, name: 'Manifestación de terminación por la plena voluntad del arrendatario, sin invocar causal', mandatory: true, basis: 'Ley 820 de 2003, art. 24 num. 5' },
      { n: 3, name: 'Constancia de envío por servicio postal autorizado con tres (3) meses de antelación', mandatory: true, basis: 'Ley 820 de 2003, art. 24 num. 5' },
      { n: 4, name: 'Ofrecimiento de la indemnización, solo si la terminación es anticipada dentro del término', mandatory: false, basis: 'Ley 820 de 2003, arts. 24 num. 4 y 25' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html'
  },
  {
    id: 'civil/consignacion-extrajudicial-del-canon-de-arrendamiento',
    exactName: 'Consignación extrajudicial del canon de arrendamiento',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 820 de 2003, art. 10; art. 22 num. 1 (mora como causal de restitución)',
    competentAuthority: 'No es autoridad judicial: la entidad autorizada por el Gobierno Nacional del lugar de ubicación del inmueble, que en la práctica es el Banco Agrario',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES DEL ARRENDATARIO, AMBOS DE CINCO (5) DÍAS Y AMBOS FATALES. PARA CONSIGNAR: «consignando las respectivas sumas a favor del arrendador en las entidades autorizadas por el Gobierno Nacional, del lugar de ubicación del inmueble, DENTRO DE LOS CINCO (5) DÍAS HÁBILES SIGUIENTES AL VENCIMIENTO DEL PLAZO O PERÍODO PACTADO» (art. 10). PARA AVISAR: otros cinco (5) días para comunicarlo al arrendador entregándole el duplicado del título. LA CONSECUENCIA ESTÁ ESCRITA Y ES LA MÁS CARA QUE PUEDE COMETER UN INQUILINO: «El incumplimiento de lo aquí previsto HARÁ INCURRIR AL ARRENDATARIO EN MORA EN EL PAGO DEL CANON de arrendamiento.» Es decir, consignar tarde o consignar bien y no avisar produce mora, y la mora es la causal de restitución del art. 22 num. 1: el arrendatario que pagó puede perder el inmueble por no haber avisado.' },
    requiredSections: [
      { n: 1, name: 'Constancia de la negativa del arrendador a recibir el canon', mandatory: true, basis: 'Ley 820 de 2003, art. 10' },
      { n: 2, name: 'Título de consignación en la entidad autorizada del lugar del inmueble, dentro de los cinco (5) días hábiles', mandatory: true, basis: 'Ley 820 de 2003, art. 10' },
      { n: 3, name: 'Comunicación al arrendador con el duplicado del título, dentro de los cinco (5) días siguientes', mandatory: true, basis: 'Ley 820 de 2003, art. 10' },
      { n: 4, name: 'Constancia de envío de esa comunicación, como prueba frente a la causal de mora', mandatory: true, basis: 'Ley 820 de 2003, arts. 10 y 22 num. 1' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html'
  },
  {
    id: 'civil/comunicacion-de-reajuste-del-canon-de-arrendamiento',
    exactName: 'Comunicación de reajuste del canon de arrendamiento',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 820 de 2003, art. 20 (reajuste y notificación) y art. 18 (tope del precio)',
    competentAuthority: 'Ninguna: se comunica al arrendatario por servicio postal autorizado o por el medio de notificación pactado',
    term: { status: 'VERIFICADO', description: 'CADA DOCE (12) MESES DE EJECUCIÓN BAJO UN MISMO PRECIO, RELOJ DEL ARRENDADOR, Y NO NOTIFICAR NO SOLO RETRASA EL AUMENTO: LO HACE INOPONIBLE. «Cada DOCE (12) MESES de ejecución del contrato bajo un mismo precio, el arrendador podrá incrementar el canon hasta en una proporción que NO SEA SUPERIOR AL CIENTO POR CIENTO (100%) DEL INCREMENTO QUE HAYA TENIDO EL ÍNDICE DE PRECIOS AL CONSUMIDOR en el año calendario inmediatamente anterior», y «deberá informarle al arrendatario el monto del incremento y la fecha en que se hará efectivo […] SO PENA DE SER INOPONIBLE AL ARRENDATARIO» (art. 20). El arrendador que sube el canon sin comunicarlo no puede cobrar la diferencia ni fundar en ella una mora. TOPE SUSTANTIVO QUE HAY QUE VERIFICAR ANTES DE FIJAR EL PRECIO: el canon «no podrá exceder el UNO POR CIENTO (1%) DEL VALOR COMERCIAL DEL INMUEBLE», y «La estimación comercial […] no podrá exceder el equivalente a DOS (2) VECES EL AVALÚO CATASTRAL VIGENTE» (art. 18).' },
    requiredSections: [
      { n: 1, name: 'Identificación del contrato y constancia de los doce (12) meses de ejecución bajo el mismo precio', mandatory: true, basis: 'Ley 820 de 2003, art. 20' },
      { n: 2, name: 'Monto del incremento, con el índice de precios al consumidor del año calendario anterior', mandatory: true, basis: 'Ley 820 de 2003, art. 20' },
      { n: 3, name: 'Fecha en que se hará efectivo el incremento', mandatory: true, basis: 'Ley 820 de 2003, art. 20' },
      { n: 4, name: 'Constancia de la comunicación, sin la cual el incremento es inoponible', mandatory: true, basis: 'Ley 820 de 2003, art. 20' },
      { n: 5, name: 'Verificación de que el canon resultante no excede el uno por ciento (1%) del valor comercial', mandatory: true, basis: 'Ley 820 de 2003, art. 18' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html'
  },
  {
    id: 'civil/terminacion-del-arrendamiento-por-subarriendo-o-cesion-no-autorizados',
    exactName: 'Terminación del arrendamiento por subarriendo o cesión no autorizados',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 820 de 2003, arts. 17 y 22 num. 3',
    competentAuthority: 'Ninguna para la terminación, que se comunica por escrito al arrendatario; el juez civil si se pide la restitución',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO EN LA NORMA PARA EJERCERLA, PERO CON UNA EXIGENCIA DE FORMA QUE NO SE PUEDE OMITIR: LA COMUNICACIÓN ESCRITA. «El arrendatario no tiene la facultad de ceder el arriendo ni de subarrendar, a menos que medie autorización expresa del arrendador. En caso de contravención, el arrendador podrá dar por terminado el contrato de arrendamiento y exigir la entrega del inmueble o celebrar un nuevo contrato con los usuarios reales, caso en el cual el contrato anterior quedará sin efectos, SITUACIONES ÉSTAS QUE SE COMUNICARÁN POR ESCRITO AL ARRENDATARIO» (art. 17). EFECTO PROCESAL QUE CONVIENE AL ARRENDADOR Y QUE HAY QUE INVOCAR: «Cuando la cesión del contrato NO LE HAYA SIDO NOTIFICADA AL ARRENDADOR, el cesionario NO SERÁ CONSIDERADO DENTRO DEL PROCESO NI COMO PARTE NI COMO INTERVINIENTE LITISCONSORCIAL» — el subarrendatario clandestino no puede oponerse a la restitución.' },
    requiredSections: [
      { n: 1, name: 'Prueba del subarriendo o de la cesión y de que no medió autorización expresa', mandatory: true, basis: 'Ley 820 de 2003, art. 17' },
      { n: 2, name: 'Comunicación escrita al arrendatario dando por terminado el contrato', mandatory: true, basis: 'Ley 820 de 2003, art. 17' },
      { n: 3, name: 'Opción que se ejerce: exigir la entrega o celebrar nuevo contrato con los usuarios reales', mandatory: true, basis: 'Ley 820 de 2003, art. 17' },
      { n: 4, name: 'Invocación de que el cesionario no notificado no es parte ni interviniente en el proceso', mandatory: false, basis: 'Ley 820 de 2003, art. 17' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html'
  },
  {
    id: 'civil/poder-especial-para-actuacion-judicial',
    exactName: 'Poder especial para actuación judicial',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2213 de 2022, art. 5; Código General del Proceso, arts. 74, 75 y 77',
    competentAuthority: 'Ninguna: no requiere presentación personal, reconocimiento ni intervención de notario. Se aporta al despacho donde se actúa',
    transversal: true,
    term: { status: 'VERIFICADO', description: 'NO TIENE PLAZO, Y SIN EMBARGO ES EL DOCUMENTO QUE MÁS VECES FIRMA UNA FIRMA AL MES: SIN ÉL NO HAY ACTUACIÓN POSIBLE. FORMA VIGENTE, QUE SIGUE SORPRENDIENDO A QUIEN ARRASTRA LA COSTUMBRE ANTIGUA: «Los poderes especiales para cualquier actuación judicial se podrán conferir MEDIANTE MENSAJE DE DATOS, SIN FIRMA MANUSCRITA O DIGITAL, CON LA SOLA ANTEFIRMA, se presumirán auténticos y NO REQUERIRÁN DE NINGUNA PRESENTACIÓN PERSONAL O RECONOCIMIENTO» (Ley 2213 de 2022, art. 5). Ya no hay que mandar al cliente a la notaría. DOS REQUISITOS DE ESE MISMO ARTÍCULO QUE SÍ SE PIERDEN POR OMISIÓN: «En el poder se indicará expresamente LA DIRECCIÓN DE CORREO ELECTRÓNICO DEL APODERADO QUE DEBERÁ COINCIDIR CON LA INSCRITA EN EL REGISTRO NACIONAL DE ABOGADOS», y «Los poderes otorgados por personas inscritas en el registro mercantil DEBERÁN SER REMITIDOS DESDE LA DIRECCIÓN DE CORREO ELECTRÓNICO INSCRITA para recibir notificaciones judiciales» — el poder de una sociedad enviado desde el correo personal del gerente no cumple. GENERAL CONTRA ESPECIAL: «Los poderes generales para toda clase de procesos SOLO PODRÁN CONFERIRSE POR ESCRITURA PÚBLICA. El poder especial para uno o varios procesos podrá conferirse por documento privado. En los poderes especiales LOS ASUNTOS DEBERÁN ESTAR DETERMINADOS Y CLARAMENTE IDENTIFICADOS» (CGP art. 74), y «El poder especial para un proceso PREVALECE SOBRE EL GENERAL conferido por la misma parte» (art. 75). ALCANCE POR DEFECTO, QUE EVITA PEDIR PODERES DE MÁS: salvo estipulación en contrario el poder para litigar cubre medidas y pruebas extraprocesales, todo el trámite, los recursos ordinarios, la casación y la anulación, las actuaciones posteriores a la sentencia en el mismo expediente y el cobro ejecutivo de las condenas (art. 77). LO QUE SÍ EXIGE FACULTAD EXPRESA es lo que dispone del derecho — conciliar, transigir, desistir, recibir, sustituir — y licitar en un remate.' },
    requiredSections: [
      { n: 1, name: 'Identificación del poderdante y, si es persona jurídica, de su representante legal', mandatory: true, basis: 'Código General del Proceso, art. 74' },
      { n: 2, name: 'Identificación del apoderado con su tarjeta profesional', mandatory: true, basis: 'Código General del Proceso, art. 74' },
      { n: 3, name: 'Asunto determinado y claramente identificado sobre el que se confiere', mandatory: true, basis: 'Código General del Proceso, art. 74' },
      { n: 4, name: 'Correo electrónico del apoderado, que debe coincidir con el del Registro Nacional de Abogados', mandatory: true, basis: 'Ley 2213 de 2022, art. 5' },
      { n: 5, name: 'Facultades expresas para conciliar, transigir, desistir, recibir y sustituir, si se otorgan', mandatory: false, basis: 'Código General del Proceso, art. 77' },
      { n: 6, name: 'Antefirma del poderdante y envío desde el correo inscrito, si el poderdante figura en el registro mercantil', mandatory: true, basis: 'Ley 2213 de 2022, art. 5' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_2213_2022.html'
  },
  {
    id: 'civil/sustitucion-revocacion-o-renuncia-del-poder',
    exactName: 'Sustitución, revocación o renuncia del poder',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, arts. 75 y 76',
    competentAuthority: 'El despacho donde cursa el proceso, por radicación en secretaría',
    transversal: true,
    term: { status: 'VERIFICADO', description: 'DOS RELOJES, Y LOS DOS SON DEL ABOGADO, NO DEL CLIENTE — POR ESO ESTA FICHA ES DE RESPONSABILIDAD PROPIA. RENUNCIA, CINCO (5) DÍAS: «La renuncia NO PONE TÉRMINO AL PODER SINO CINCO (5) DÍAS DESPUÉS de presentado el memorial de renuncia en el juzgado, ACOMPAÑADO DE LA COMUNICACIÓN ENVIADA AL PODERDANTE en tal sentido» (art. 76). Es decir: quien renuncia sigue siendo apoderado cinco días más, y si no adjunta la prueba de haber avisado al cliente, no empieza a correr nada. Un término que venza en esa ventana es suyo. HONORARIOS TRAS LA REVOCATORIA, TREINTA (30) DÍAS Y ES PRECLUSIVO EN CUANTO AL FORO: «Dentro de los TREINTA (30) DÍAS siguientes a la notificación de dicha providencia, el apoderado a quien se le haya revocado el poder podrá pedir al juez que se regulen sus honorarios mediante incidente […] VENCIDO EL TÉRMINO INDICADO, LA REGULACIÓN DE LOS HONORARIOS PODRÁ DEMANDARSE ANTE EL JUEZ LABORAL» — no se pierde el derecho, se pierde el trámite barato dentro del propio proceso y toca abrir uno nuevo. El mismo derecho lo tienen los herederos y el cónyuge sobreviviente del apoderado fallecido. CUÁNDO TERMINA EL PODER: «con la radicación en secretaría del escrito en virtud del cual se revoque o se designe otro apoderado, a menos que el nuevo poder se hubiese otorgado para recursos o gestiones determinadas». LO QUE NO LO TERMINA, y evita pánicos: la muerte del mandante o la extinción de la persona jurídica no ponen fin al mandato si ya se presentó la demanda, ni la cesación de funciones de quien lo confirió como representante. REGLA QUE INVALIDA ACTUACIONES: «En ningún caso podrá actuar simultáneamente más de un apoderado judicial de una misma persona» (art. 75). Quien sustituye puede reasumir en cualquier momento, y con ello queda revocada la sustitución.' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y del poder que se sustituye, revoca o renuncia', mandatory: true, basis: 'Código General del Proceso, art. 76' },
      { n: 2, name: 'Comunicación enviada al poderdante, que debe acompañar el memorial de renuncia', mandatory: true, basis: 'Código General del Proceso, art. 76' },
      { n: 3, name: 'Constancia del estado del proceso y de los términos en curso durante los cinco (5) días', mandatory: true, basis: 'Código General del Proceso, art. 76' },
      { n: 4, name: 'Identificación del sustituto con su tarjeta profesional, cuando se sustituye', mandatory: false, basis: 'Código General del Proceso, art. 75' },
      { n: 5, name: 'Solicitud de regulación de honorarios dentro de los treinta (30) días, cuando hubo revocatoria', mandatory: false, basis: 'Código General del Proceso, art. 76' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr003.html'
  },
  {
    id: 'civil/solicitud-de-conciliacion-extrajudicial-en-derecho-en-materia-civil',
    exactName: 'Solicitud de conciliación extrajudicial en derecho en materia civil',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2220 de 2022 (Estatuto de Conciliación), arts. 67, 68 y 70',
    competentAuthority: 'Centro de conciliación autorizado, conciliador inscrito o notario. No es autoridad judicial',
    term: { status: 'VERIFICADO', description: 'NO TIENE PLAZO PARA PRESENTARSE, PERO SIN SU CONSTANCIA LA DEMANDA SE RECHAZA: ES REQUISITO DE PROCEDIBILIDAD. «la conciliación extrajudicial en derecho como requisito de procedibilidad DEBERÁ INTENTARSE ANTES DE ACUDIR a la especialidad jurisdiccional civil EN LOS PROCESOS DECLARATIVOS» (art. 68). CUATRO EXCEPCIONES QUE HAY QUE VERIFICAR ANTES DE PERDER TRES MESES, porque en ellas se va directo al juez: los procesos DIVISORIOS, los de EXPROPIACIÓN, los MONITORIOS «que se adelanten en cualquier jurisdicción», y aquellos «en donde se demande o sea obligatoria la citación de INDETERMINADOS» (art. 68). TRES EXCEPCIONES MÁS, en los parágrafos del art. 67: cuando el demandante declare bajo juramento que no conoce el domicilio, la habitación ni el trabajo del demandado o este esté ausente y sin paradero conocido; cuando quien demande sea una entidad pública; y —la que más sirve y menos se usa— «En todo proceso y ante cualquier jurisdicción, CUANDO SE SOLICITE LA PRÁCTICA DE MEDIDAS CAUTELARES SE PODRÁ ACUDIR DIRECTAMENTE AL JUEZ, sin necesidad de agotar la conciliación prejudicial». EL RELOJ QUE DESBLOQUEA AL CLIENTE ES DE TRES (3) MESES Y CORRE CONTRA EL CENTRO, NO CONTRA ÉL: el requisito se entiende cumplido «Cuando vencido el término de TRES (3) MESES a partir de la presentación de la solicitud […] la audiencia no se hubiere celebrado por cualquier causa; en este último evento se podrá acudir directamente a la Jurisdicción Ordinaria CON LA SOLA PRESENTACIÓN DE LA SOLICITUD» (art. 70). También se cumple si hubo audiencia sin acuerdo, o si una parte no compareció. ADVERTENCIA DE VIGENCIA: esta ley derogó íntegramente la Ley 640 de 2001; citar la 640 hoy es citar norma muerta.' },
    requiredSections: [
      { n: 1, name: 'Identificación de las partes y de sus canales de notificación', mandatory: true, basis: 'Ley 2220 de 2022, art. 67' },
      { n: 2, name: 'Hechos y pretensiones que se someten a conciliación, con su cuantía', mandatory: true, basis: 'Ley 2220 de 2022, art. 68' },
      { n: 3, name: 'Verificación de que el asunto es conciliable y no está en las excepciones del art. 68', mandatory: true, basis: 'Ley 2220 de 2022, art. 68' },
      { n: 4, name: 'Pruebas que se aportan para respaldar la pretensión', mandatory: true, basis: 'Ley 2220 de 2022, art. 67' },
      { n: 5, name: 'Constancia de presentación, de la que corren los tres (3) meses que habilitan acudir al juez', mandatory: true, basis: 'Ley 2220 de 2022, art. 70' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_2220_2022_pr001.html'
  },
  {
    id: 'civil/objecion-a-la-liquidacion-de-costas-y-agencias-en-derecho',
    exactName: 'Objeción a la liquidación de costas y agencias en derecho',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 366',
    competentAuthority: 'El juzgado que conoció del proceso en primera o única instancia, donde la liquidación se hace de manera concentrada',
    term: { status: 'VERIFICADO', description: 'NO SE ATACA POR INCIDENTE NI POR MEMORIAL SUELTO, Y ESE ES EL ERROR QUE DEJA LAS COSTAS EN FIRME: «La liquidación de las expensas y el monto de las agencias en derecho SOLO PODRÁN CONTROVERTIRSE MEDIANTE LOS RECURSOS DE REPOSICIÓN Y APELACIÓN CONTRA EL AUTO QUE APRUEBE LA LIQUIDACIÓN de costas. La apelación se concederá en el efecto diferido, pero si no existiere actuación pendiente, se concederá en el suspensivo» (art. 366 num. 5). El reloj es entonces el de la ejecutoria de ese auto, y quien deja pasar la reposición pierde la discusión entera. CUÁNDO SE LIQUIDA: «inmediatamente quede ejecutoriada la providencia que le ponga fin al proceso o notificado el auto de obedecimiento a lo dispuesto por el superior», y la hace el secretario para que el juez la apruebe o la rehaga (num. 1). QUÉ DEBE ENTRAR Y SUELE QUEDARSE POR FUERA: la totalidad de las condenas de todos los autos que resolvieron recursos, de los incidentes, de las sentencias de ambas instancias y de la casación (num. 2); los honorarios de auxiliares, los gastos comprobados y útiles, y las agencias en derecho «AUNQUE SE LITIGUE SIN APODERADO» (num. 3). Los honorarios de peritos contratados directamente por las partes entran si están comprobados y el juez los encuentra razonables; si exceden los parámetros del Consejo Superior de la Judicatura, el juez los regula. AGENCIAS EN DERECHO: se aplican las tarifas del Consejo Superior de la Judicatura, y cuando fijan mínimo o rango el juez pondera «la naturaleza, calidad y duración de la gestión realizada», sin exceder el máximo (num. 4). Es el último dinero de todo proceso ganado y se pierde por no revisar una cuenta.' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto que aprobó la liquidación y de su notificación', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 5' },
      { n: 2, name: 'Señalamiento de las condenas de recursos, incidentes y ambas instancias que se omitieron', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 2' },
      { n: 3, name: 'Gastos comprobados y útiles que deben incluirse, con sus soportes', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 3' },
      { n: 4, name: 'Confrontación de las agencias en derecho con las tarifas del Consejo Superior de la Judicatura', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 4' },
      { n: 5, name: 'Recurso de reposición y, en subsidio, apelación — única vía para controvertirla', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 5' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr012.html'
  },
  {
    id: 'civil/cumplimiento-de-la-carga-procesal-para-evitar-el-desistimiento-tacito',
    exactName: 'Cumplimiento de la carga procesal para evitar el desistimiento tácito',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 317',
    competentAuthority: 'El juez que conoce del proceso, que puede decretarlo de oficio',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES DEL CLIENTE, Y EL SEGUNDO NO AVISA. TREINTA (30) DÍAS TRAS EL REQUERIMIENTO: cuando para continuar el trámite se requiera una carga procesal de la parte que lo promovió, «el juez le ordenará cumplirlo DENTRO DE LOS TREINTA (30) DÍAS SIGUIENTES mediante providencia QUE SE NOTIFICARÁ POR ESTADO. Vencido dicho término sin que quien haya promovido el trámite respectivo cumpla la carga […] el juez TENDRÁ POR DESISTIDA TÁCITAMENTE la respectiva actuación y así lo declarará en providencia en la que ADEMÁS IMPONDRÁ CONDENA EN COSTAS» (num. 1). Se notifica por estado, no personalmente. UN (1) AÑO DE INACTIVIDAD, SIN REQUERIMIENTO PREVIO, Y ES EL QUE MATA PROCESOS ENTEROS EN SILENCIO: «Cuando un proceso o actuación de cualquier naturaleza, en cualquiera de sus etapas, permanezca inactivo en la secretaría del despacho, porque no se solicita o realiza ninguna actuación durante el plazo de UN (1) AÑO en primera o única instancia, contados desde el día siguiente a la última notificación o desde la última diligencia o actuación, a petición de parte o DE OFICIO, se decretará la terminación por desistimiento tácito SIN NECESIDAD DE REQUERIMIENTO PREVIO» (num. 2). En este caso no hay condena en costas. LO QUE SE PIERDE, y por eso importa en un ejecutivo con bienes: «Decretado el desistimiento tácito quedará terminado el proceso o la actuación correspondiente y SE ORDENARÁ EL LEVANTAMIENTO DE LAS MEDIDAS CAUTELARES PRACTICADAS» (lit. d). TRES REGLAS QUE SALVAN EL CASO: no se cuenta el tiempo de suspensión acordada por las partes (lit. a); si hay sentencia ejecutoriada a favor del demandante o auto que ordena seguir adelante la ejecución, el plazo es de DOS (2) AÑOS (lit. b); y «CUALQUIER ACTUACIÓN, de oficio o a petición de parte, DE CUALQUIER NATURALEZA, INTERRUMPIRÁ los términos» (lit. c) — un memorial cualquiera reinicia el año. La providencia que lo decreta es apelable en el efecto suspensivo.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la carga procesal ordenada y de la fecha del estado que la notificó', mandatory: true, basis: 'Código General del Proceso, art. 317 num. 1' },
      { n: 2, name: 'Cumplimiento de la carga dentro de los treinta (30) días', mandatory: true, basis: 'Código General del Proceso, art. 317 num. 1' },
      { n: 3, name: 'Cómputo de la inactividad desde la última notificación o actuación, descontando las suspensiones acordadas', mandatory: true, basis: 'Código General del Proceso, art. 317 num. 2 y lit. a' },
      { n: 4, name: 'Verificación de si aplica el plazo de dos (2) años por existir sentencia o auto de seguir adelante', mandatory: false, basis: 'Código General del Proceso, art. 317 lit. b' },
      { n: 5, name: 'Recurso de apelación contra la providencia que lo decrete, en el efecto suspensivo', mandatory: false, basis: 'Código General del Proceso, art. 317 lit. e' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html'
  },
  {
    id: 'civil/demanda-de-proceso-monitorio',
    exactName: 'Demanda de proceso monitorio',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, arts. 419, 420 y 421; art. 25 (cuantía); Ley 2220 de 2022, art. 68 (exceptuado de conciliación previa)',
    competentAuthority: 'El juez civil municipal, por ser asunto de mínima cuantía',
    term: { status: 'VERIFICADO', description: 'SIN PLAZO PROPIO PARA PRESENTARLA, MÁS ALLÁ DE LA PRESCRIPCIÓN DE LA OBLIGACIÓN DE FONDO. «Quien pretenda el pago de una obligación en dinero, de naturaleza contractual, determinada y exigible QUE SEA DE MÍNIMA CUANTÍA, podrá promover proceso monitorio» (art. 419), declarado exequible sin condicionamiento por las sentencias C-726 de 2014 y C-159 de 2016. VENTAJA QUE HAY QUE APROVECHAR: el art. 68 de la Ley 2220 de 2022 exceptúa a los monitorios del requisito de conciliación previa — se radica directo y se ahorran tres meses. LÍMITE DE CUANTÍA, CON UNA ADVERTENCIA DE 2026: son de mínima cuantía las pretensiones que no excedan CUARENTA (40) SALARIOS MÍNIMOS, y «El salario mínimo legal mensual a que se refiere este artículo, SERÁ EL VIGENTE AL MOMENTO DE LA PRESENTACIÓN DE LA DEMANDA» (art. 25). EL SALARIO MÍNIMO ESTÁ HOY EN DISPUTA JUDICIAL: el Decreto 1469 de 2025 fue suspendido provisionalmente por el Consejo de Estado y el Decreto 0159 del 19 de febrero de 2026 lo fijó TRANSITORIAMENTE «hasta que se dicte sentencia», de modo que el tope de la mínima cuantía puede moverse — hay que confirmar la cifra vigente el día de la radicación y no darla por sabida. REQUISITO SIN EL CUAL EL PROCESO NO AVANZA NUNCA: el requerimiento de pago «SE NOTIFICARÁ PERSONALMENTE AL DEUDOR», y el parágrafo del art. 421 excluye el emplazamiento y el curador ad litem — si no se logra la notificación personal, no hay a quién nombrarle curador y el asunto queda paralizado. Conviene verificar la dirección antes de radicar.' },
    requiredSections: [
      { n: 1, name: 'Afirmación de que la obligación es contractual, en dinero, determinada y exigible', mandatory: true, basis: 'Código General del Proceso, art. 419' },
      { n: 2, name: 'Cuantía, verificada contra el salario mínimo vigente el día de la presentación', mandatory: true, basis: 'Código General del Proceso, art. 25' },
      { n: 3, name: 'Manifestación expresa de que el pago no se ha recibido y de la forma como se contrajo la obligación', mandatory: true, basis: 'Código General del Proceso, art. 420' },
      { n: 4, name: 'Documentos de la obligación que se aportan, o afirmación de que no existen', mandatory: true, basis: 'Código General del Proceso, art. 420' },
      { n: 5, name: 'Dirección para la notificación personal del deudor, sin la cual el proceso no avanza', mandatory: true, basis: 'Código General del Proceso, art. 421 par.' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr014.html'
  },
  {
    id: 'civil/contestacion-del-requerimiento-de-pago-en-el-proceso-monitorio',
    exactName: 'Contestación del requerimiento de pago en el proceso monitorio',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 421',
    competentAuthority: 'El juez civil municipal que libró el requerimiento',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS, RELOJ DEL DEUDOR, Y ES EL MÁS LETAL DEL CGP PORQUE EL SILENCIO NO PRODUCE UNA CONDENA CUALQUIERA SINO UNA COSA JUZGADA SIN RECURSOS. «el juez ordenará requerir al deudor para que EN EL PLAZO DE DIEZ (10) DÍAS pague o exponga en la contestación de la demanda las razones concretas que le sirven de sustento para negar total o parcialmente la deuda reclamada. El auto que contiene el requerimiento de pago NO ADMITE RECURSOS y se notificará personalmente al deudor, con la advertencia de que si no paga o no justifica su renuencia, SE DICTARÁ SENTENCIA QUE TAMPOCO ADMITE RECURSOS Y CONSTITUYE COSA JUZGADA, en la cual se le condenará al pago del monto reclamado, de los intereses causados y de los que se causen hasta la cancelación de la deuda» (art. 421). NO BASTA NEGAR: hay que exponer RAZONES CONCRETAS. Una contestación genérica equivale a no contestar. RIESGO DE OPONERSE SIN FUNDAMENTO, que hay que advertirle al cliente antes de redactar: si se opone y resulta condenado, paga MULTA DEL DIEZ POR CIENTO (10%) del valor de la deuda; y si es absuelto, esa multa la paga el acreedor. QUÉ SIGUE AL SILENCIO: la ejecución continúa en el mismo expediente por el trámite del art. 306, sin necesidad de demanda ejecutiva nueva.' },
    requiredSections: [
      { n: 1, name: 'Identificación del requerimiento de pago y de la fecha de su notificación personal', mandatory: true, basis: 'Código General del Proceso, art. 421' },
      { n: 2, name: 'Razones concretas por las que se niega total o parcialmente la deuda', mandatory: true, basis: 'Código General del Proceso, art. 421' },
      { n: 3, name: 'Pruebas que sustentan cada razón invocada', mandatory: true, basis: 'Código General del Proceso, art. 421' },
      { n: 4, name: 'Constancia de presentación dentro de los diez (10) días', mandatory: true, basis: 'Código General del Proceso, art. 421' },
      { n: 5, name: 'Advertencia al cliente del riesgo de multa del diez por ciento (10%) si la oposición no prospera', mandatory: true, basis: 'Código General del Proceso, art. 421' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr014.html'
  },
  {
    id: 'civil/demanda-ejecutiva-con-base-en-titulo-valor',
    exactName: 'Demanda ejecutiva con base en título valor',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 621, 789, 790, 791, 792 y 793; Código General del Proceso, art. 422',
    competentAuthority: 'El juez civil municipal o del circuito, según la cuantía',
    term: { status: 'VERIFICADO', description: 'TRES PLAZOS DISTINTOS, TODOS DEL CLIENTE, Y CUÁL APLICA DEPENDE DE CONTRA QUIÉN SE COBRA — NO DE QUÉ TÍTULO SE TIENE. CONTRA EL OBLIGADO DIRECTO (el girador del pagaré, el aceptante de la letra): «La acción cambiaria directa PRESCRIBE EN TRES AÑOS a partir del día del vencimiento» (art. 789). CONTRA LOS OBLIGADOS DE REGRESO (endosantes y avalistas), y aquí ya no son tres años sino uno: «La acción cambiaria de regreso del último tenedor PRESCRIBIRÁ EN UN AÑO contado desde la fecha del protesto o, si el título fuere sin protesto, DESDE LA FECHA DEL VENCIMIENTO; y, en su caso, desde que concluyan los plazos de presentación» (art. 790). ENTRE OBLIGADOS: «La acción del obligado del regreso contra los demás obligados anteriores PRESCRIBE EN SEIS MESES, contados a partir de la fecha del pago voluntario o de la fecha en que se le notifique la demanda» (art. 791). LA TRAMPA PROCESAL QUE ARRUINA COBROS CONTRA VARIOS DEUDORES: «Las causas que interrumpen la prescripción respecto de uno de los deudores cambiarios NO LA INTERRUMPE RESPECTO DE LOS OTROS, salvo el caso de los signatarios en un mismo grado» (art. 792). Demandar a tiempo al girador no salva la acción contra el avalista: hay que interrumpir contra cada uno. VENTAJA PROCESAL QUE AHORRA UN TRÁMITE ENTERO: «El cobro de un título-valor dará lugar al procedimiento ejecutivo, SIN NECESIDAD DE RECONOCIMIENTO DE FIRMAS» (art. 793).' },
    requiredSections: [
      { n: 1, name: 'Título valor original, con la mención del derecho y la firma de quien lo crea', mandatory: true, basis: 'Código de Comercio, art. 621' },
      { n: 2, name: 'Determinación de contra quién se cobra: obligado directo, de regreso o anterior', mandatory: true, basis: 'Código de Comercio, arts. 789 a 791' },
      { n: 3, name: 'Cómputo del plazo que corresponde a esa acción, con la fecha desde la que corre', mandatory: true, basis: 'Código de Comercio, arts. 789 a 791' },
      { n: 4, name: 'Interrupción de la prescripción frente a CADA deudor que se pretenda vincular', mandatory: true, basis: 'Código de Comercio, art. 792' },
      { n: 5, name: 'Liquidación del capital, los intereses y su tasa', mandatory: true, basis: 'Código General del Proceso, art. 422' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr024.html'
  },
  {
    id: 'civil/presentacion-del-cheque-para-su-pago-y-constancia-de-rechazo',
    exactName: 'Presentación del cheque para su pago y constancia de rechazo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, arts. 718, 727, 729, 730 y 731',
    competentAuthority: 'El banco librado o la cámara de compensación. NO es autoridad judicial: la anotación del rechazo es un acto bancario, y sin embargo produce efectos procesales',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES INDEPENDIENTES MATAN LA MISMA ACCIÓN, Y HAY QUE VIGILAR LOS DOS. PRIMERO, LA PRESENTACIÓN, cuyo incumplimiento produce CADUCIDAD: «Los cheques deberán presentarse para su pago: 1) Dentro de los QUINCE DÍAS a partir de su fecha, si fueren pagaderos en el mismo lugar de su expedición; 2) Dentro de UN MES, si fueren pagaderos en el mismo país de su expedición, pero en lugar distinto al de ésta; 3) Dentro de TRES MESES, si fueren expedidos en un país latinoamericano y pagaderos en algún otro país de América Latina, y 4) Dentro de CUATRO MESES, si fueren expedidos en algún país latinoamericano para ser pagados fuera de América Latina» (art. 718). La acción contra el librador y sus avalistas «CADUCA por no haber sido presentado y protestado el cheque en tiempo, SI durante todo el plazo de presentación el librador tuvo fondos suficientes en poder del librado y, por causa no imputable al librador, el cheque dejó de pagarse» (art. 729) — la caducidad no opera si nunca hubo fondos. SEGUNDO, LA PRESCRIPCIÓN, que corre aunque se haya presentado a tiempo: «Las acciones cambiarias derivadas del cheque prescriben: Las del último tenedor, en SEIS MESES, contados desde la presentación; las de los endosantes y avalistas, en el mismo término, contado desde el día siguiente a aquel en que paguen el cheque» (art. 730). SEIS MESES, NO TRES AÑOS: quien traslade al cheque el plazo del pagaré llega tarde. LO QUE SUSTITUYE AL PROTESTO Y HAY QUE PEDIRLE AL BANCO EN EL ACTO: «La anotación que el librado o la cámara de compensación ponga en el cheque, de haber sido presentado en tiempo y no pagado total o parcialmente, SURTIRÁ LOS EFECTOS DEL PROTESTO» (art. 727). Sin esa anotación no hay prueba del rechazo. SANCIÓN ADICIONAL QUE SE RECLAMA EN LA MISMA DEMANDA: el art. 731 impone al librador el veinte por ciento (20%) del importe del cheque, declarado exequible por la sentencia C-451 de 2002.' },
    requiredSections: [
      { n: 1, name: 'Cheque original con la anotación de rechazo del banco librado o de la cámara de compensación', mandatory: true, basis: 'Código de Comercio, art. 727' },
      { n: 2, name: 'Constancia de que se presentó dentro del plazo que corresponde al lugar de expedición y de pago', mandatory: true, basis: 'Código de Comercio, art. 718' },
      { n: 3, name: 'Cómputo de los seis (6) meses de prescripción desde la presentación', mandatory: true, basis: 'Código de Comercio, art. 730' },
      { n: 4, name: 'Pronunciamiento sobre si el librador tuvo fondos, que decide si opera la caducidad', mandatory: true, basis: 'Código de Comercio, art. 729' },
      { n: 5, name: 'Reclamación de la sanción del veinte por ciento (20%) a cargo del librador', mandatory: false, basis: 'Código de Comercio, art. 731' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr022.html'
  },
  {
    id: 'civil/accion-de-enriquecimiento-sin-causa-por-caducidad-o-prescripcion-del-titulo-valor',
    exactName: 'Acción de enriquecimiento sin causa por caducidad o prescripción del título valor',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código de Comercio, art. 882',
    competentAuthority: 'El juez civil',
    term: { status: 'VERIFICADO', description: 'UN (1) AÑO, RELOJ DEL CLIENTE, Y ES LA ÚLTIMA PUERTA DESPUÉS DE UN DESASTRE QUE POCA GENTE VE VENIR: DEJAR PRESCRIBIR EL TÍTULO NO SOLO MATA EL COBRO CAMBIARIO, MATA TAMBIÉN LA DEUDA QUE LO ORIGINÓ. «La entrega de letras, cheques, pagarés y demás títulos-valores de contenido crediticio, POR UNA OBLIGACIÓN ANTERIOR, valdrá como pago de ésta si no se estipula otra cosa; pero llevará implícita la condición resolutoria del pago, en caso de que el instrumento sea rechazado o no sea descargado de cualquier manera. […] SI EL ACREEDOR DEJA CADUCAR O PRESCRIBIR EL INSTRUMENTO, LA OBLIGACIÓN ORIGINARIA O FUNDAMENTAL SE EXTINGUIRÁ ASÍ MISMO; no obstante, tendrá acción contra quien se haya enriquecido sin causa a consecuencia de la caducidad o prescripción. ESTA ACCIÓN PRESCRIBIRÁ EN UN AÑO» (art. 882). En términos prácticos: el acreedor que recibió un pagaré por una factura y lo dejó vencer no puede volver a cobrar la factura — se extinguió con el título. Solo le queda el enriquecimiento sin causa, y por doce meses. LO QUE HAY QUE HACER MIENTRAS EL TÍTULO VIVE, y está en el mismo artículo: cumplida la condición resolutoria, «el acreedor podrá hacer efectivo el pago de la obligación originaria o fundamental, DEVOLVIENDO EL INSTRUMENTO o dando caución, a satisfacción del juez, de indemnizar al deudor los perjuicios que pueda causarle la no devolución del mismo». Es decir, la obligación de fondo sí se puede cobrar, pero devolviendo el título — no conservando ambos.' },
    requiredSections: [
      { n: 1, name: 'Título valor caducado o prescrito y prueba de la fecha en que ocurrió', mandatory: true, basis: 'Código de Comercio, art. 882' },
      { n: 2, name: 'Acreditación de la obligación anterior por la cual se entregó el título', mandatory: true, basis: 'Código de Comercio, art. 882' },
      { n: 3, name: 'Demostración del enriquecimiento del demandado y del empobrecimiento correlativo', mandatory: true, basis: 'Código de Comercio, art. 882' },
      { n: 4, name: 'Constancia de presentación dentro del año siguiente a la caducidad o prescripción', mandatory: true, basis: 'Código de Comercio, art. 882' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr027.html'
  },
  {
    id: 'civil/solicitud-de-correccion-de-errores-aritmeticos-y-de-transcripcion-en-providencia',
    exactName: 'Solicitud de corrección de errores aritméticos y de transcripción en providencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Código General del Proceso, art. 286',
    competentAuthority: 'El mismo juez que dictó la providencia',
    transversal: true,
    term: { status: 'NO_CADUCA', description: 'EN CUALQUIER TIEMPO, Y ES LA EXCEPCIÓN QUE SALVA CONDENAS MAL SUMADAS CUANDO YA TODO PARECÍA PERDIDO. «Toda providencia en que se haya incurrido en ERROR PURAMENTE ARITMÉTICO puede ser corregida por el juez que la dictó EN CUALQUIER TIEMPO, de oficio o a solicitud de parte, mediante auto» (art. 286). No hay ejecutoria que la cierre ni término que la extinga: a diferencia de la aclaración y la adición, que viven dentro de los tres días, esta no caduca. ALCANCE MÁS AMPLIO DE LO QUE SUGIERE EL TÍTULO, y por eso conviene leerlo entero: «Lo dispuesto en los incisos anteriores SE APLICA A LOS CASOS DE ERROR POR OMISIÓN O CAMBIO DE PALABRAS O ALTERACIÓN DE ESTAS, siempre que estén contenidas en la parte resolutiva o influyan en ella.» Cubre el nombre mal escrito, la cédula cambiada, la matrícula inmobiliaria equivocada — errores que hacen inejecutable una sentencia ganada. LÍMITE QUE DEFINE SI PROCEDE: el error debe ser de cálculo o de transcripción, no de criterio. Pedir por esta vía que se cambie lo decidido es que la nieguen. NOTIFICACIÓN DISTINTA CUANDO EL PROCESO YA TERMINÓ: «Si la corrección se hiciere luego de terminado el proceso, el auto SE NOTIFICARÁ POR AVISO» — hay que prever esa forma para que la corrección produzca efectos frente a la otra parte.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia y transcripción del aparte errado', mandatory: true, basis: 'Código General del Proceso, art. 286' },
      { n: 2, name: 'Demostración de que el error es aritmético, de omisión o de cambio de palabras, no de criterio', mandatory: true, basis: 'Código General del Proceso, art. 286' },
      { n: 3, name: 'Acreditación de que el error está en la parte resolutiva o influye en ella', mandatory: true, basis: 'Código General del Proceso, art. 286' },
      { n: 4, name: 'Texto corregido que se propone', mandatory: true, basis: 'Código General del Proceso, art. 286' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr009.html'
  },
  {
    id: 'civil/auto-que-resuelve-el-recurso-de-reposicion',
    exactName: 'Auto que resuelve el recurso de reposición',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Código General del Proceso, arts. 318 y 319',
    competentAuthority: 'El mismo juez que dictó el auto recurrido; el magistrado sustanciador o la Sala de Casación Civil en su caso',
    transversal: true,
    term: { status: 'VERIFICADO', description: 'TRES (3) DÍAS PARA INTERPONERLO SI EL AUTO SE DICTÓ FUERA DE AUDIENCIA, Y VERBALMENTE E INMEDIATO SI SE DICTÓ EN ELLA. RELOJ DEL RECURRENTE: «deberá interponerse CON EXPRESIÓN DE LAS RAZONES QUE LO SUSTENTEN, en forma verbal INMEDIATAMENTE se pronuncie el auto. Cuando el auto se pronuncie fuera de audiencia el recurso deberá interponerse por escrito dentro de los TRES (3) DÍAS siguientes al de la notificación del auto» (art. 318). Sin razones no está interpuesto. CONTRA QUÉ NO PROCEDE, y saberlo evita gastar el término: «no procede contra los autos que resuelvan un recurso de APELACIÓN, una SÚPLICA o una QUEJA». Y «Los autos que dicten las salas de decisión NO TIENEN REPOSICIÓN; podrá pedirse su aclaración o complementación dentro del término de su ejecutoria». EL AUTO QUE LA DECIDE CIERRA LA DISCUSIÓN, con una sola salida: «no es susceptible de ningún recurso, SALVO QUE CONTENGA PUNTOS NO DECIDIDOS EN EL ANTERIOR, caso en el cual podrán interponerse los recursos pertinentes respecto de los puntos nuevos» (art. 318). LA REGLA QUE SALVA AL QUE SE EQUIVOCA DE RECURSO, y casi nadie invoca: «Cuando el recurrente impugne una providencia judicial MEDIANTE UN RECURSO IMPROCEDENTE, el juez DEBERÁ tramitar la impugnación POR LAS REGLAS DEL RECURSO QUE RESULTARE PROCEDENTE, siempre que haya sido INTERPUESTO OPORTUNAMENTE» (art. 318 par.). Lo que no perdona es la extemporaneidad; el nombre equivocado, sí. TRÁMITE: «se decidirá en la audiencia, previo traslado en ella a la parte contraria» (art. 319); fuera de audiencia, el traslado corre en secretaría por tres días sin auto (art. 110).' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto recurrido y de su fecha de notificación', mandatory: true, basis: 'Código General del Proceso, art. 318' },
      { n: 2, name: 'Pronunciamiento sobre cada razón expuesta por el recurrente', mandatory: true, basis: 'Código General del Proceso, art. 318' },
      { n: 3, name: 'Decisión de reformar, revocar o mantener el auto, con su motivación', mandatory: true, basis: 'Código General del Proceso, art. 318' },
      { n: 4, name: 'Advertencia de que no admite recursos, salvo respecto de puntos nuevos', mandatory: true, basis: 'Código General del Proceso, art. 318' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html'
  },
  {
    id: 'civil/auto-que-concede-o-deniega-la-apelacion-y-fija-su-efecto',
    exactName: 'Auto que concede o deniega la apelación y fija su efecto',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Código General del Proceso, arts. 321, 322, 323 y 324',
    competentAuthority: 'El juez de primera instancia, que concede y remite; el superior, que la admite o inadmite',
    transversal: true,
    term: { status: 'VERIFICADO', description: 'DECIDE DOS COSAS QUE CAMBIAN EL PROCESO ENTERO: SI HAY SEGUNDA INSTANCIA Y SI LA PRIMERA SE EJECUTA MIENTRAS TANTO. QUÉ ES APELABLE, Y LA LISTA ES CERRADA (art. 321): las sentencias de primera instancia salvo las dictadas en equidad; y estos autos — «1. El que rechace la demanda, su reforma o la contestación a cualquiera de ellas. 2. El que niegue la intervención de sucesores procesales o de terceros. 3. El que NIEGUE el decreto o la práctica de pruebas. 4. El que niegue total o parcialmente el mandamiento de pago y el que rechace de plano las excepciones de mérito en el proceso ejecutivo. 5. El que rechace de plano un incidente y el que lo resuelva. 6. El que niegue el trámite de una nulidad procesal y el que la resuelva. 7. El que por cualquier causa LE PONGA FIN AL PROCESO. 8. El que resuelva sobre una MEDIDA CAUTELAR, o fije el monto de la caución para decretarla, impedirla o levantarla. 9. El que resuelva sobre la OPOSICIÓN A LA ENTREGA de bienes, y el que la rechace de plano. 10. Los demás expresamente señalados en este código.» El que DECRETA pruebas no es apelable; solo el que las niega. EL EFECTO ES LO QUE DECIDE SI EL CLIENTE PAGA AHORA O DESPUÉS: suspensivo detiene el cumplimiento; devolutivo lo deja seguir. Fijarlo mal es apelable por vía de reposición, y advertirlo tarde es no advertirlo. SI NO SE CONCEDE, SE RECHAZA O SE DECLARA DESIERTA, LA VÍA ES LA QUEJA — no insistir ante el mismo juez. RELOJ DE LA SECRETARÍA, CON SANCIÓN, QUE CONVIENE INVOCAR CUANDO EL EXPEDIENTE NO SUBE: «El secretario deberá remitir el expediente o la reproducción al superior DENTRO DEL TÉRMINO MÁXIMO DE CINCO (5) DÍAS», y «EL INCUMPLIMIENTO DE ESTE DEBER SE CONSIDERARÁ FALTA GRAVÍSIMA» (art. 324). Si el juez conserva competencia, el recurrente debe suministrar las expensas de las copias en CINCO (5) DÍAS SO PENA DE DESIERTO — ese sí es reloj del cliente.' },
    requiredSections: [
      { n: 1, name: 'Verificación de que la providencia está en la lista cerrada de apelables del art. 321', mandatory: true, basis: 'Código General del Proceso, art. 321' },
      { n: 2, name: 'Constancia de que el recurso fue interpuesto y sustentado en tiempo', mandatory: true, basis: 'Código General del Proceso, art. 322' },
      { n: 3, name: 'Efecto en que se concede: suspensivo, devolutivo o diferido, con su fundamento', mandatory: true, basis: 'Código General del Proceso, art. 323' },
      { n: 4, name: 'Orden de remisión del expediente o de las copias al superior', mandatory: true, basis: 'Código General del Proceso, art. 324' },
      { n: 5, name: 'Requerimiento de expensas al recurrente, con los cinco (5) días so pena de desierto', mandatory: false, basis: 'Código General del Proceso, art. 324' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr011.html'
  },
  {
    id: 'civil/auto-que-decreta-el-desistimiento-tacito',
    exactName: 'Auto que decreta el desistimiento tácito',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Código General del Proceso, art. 317',
    competentAuthority: 'El juez que conoce del proceso, que puede decretarlo DE OFICIO',
    term: { status: 'VERIFICADO', description: 'ES LA PROVIDENCIA QUE MATA EL PROCESO DEL CLIENTE POR INACTIVIDAD, Y EN SU SEGUNDA MODALIDAD NO AVISA ANTES. PRIMERA MODALIDAD — TREINTA (30) DÍAS TRAS REQUERIMIENTO: cuando para continuar el trámite se requiere una carga procesal de quien lo promovió, el juez ordena cumplirla «dentro de los treinta (30) días siguientes mediante providencia QUE SE NOTIFICARÁ POR ESTADO», y vencidos sin cumplirla tiene por desistida la actuación «en providencia en la que ADEMÁS IMPONDRÁ CONDENA EN COSTAS» (num. 1). SEGUNDA MODALIDAD — UN (1) AÑO DE INACTIVIDAD, SIN REQUERIMIENTO PREVIO Y DE OFICIO: cuando el proceso «permanezca inactivo en la secretaría del despacho, porque no se solicita o realiza ninguna actuación durante el plazo de UN (1) AÑO en primera o única instancia, contados desde el día siguiente a la última notificación o desde la última diligencia o actuación, a petición de parte o DE OFICIO, se decretará la terminación por desistimiento tácito SIN NECESIDAD DE REQUERIMIENTO PREVIO» (num. 2). Aquí no hay condena en costas. LO QUE ARRASTRA, Y ES LO QUE DUELE EN UN EJECUTIVO CON BIENES: «Decretado el desistimiento tácito quedará terminado el proceso y SE ORDENARÁ EL LEVANTAMIENTO DE LAS MEDIDAS CAUTELARES PRACTICADAS» (lit. d). TRES REGLAS QUE SALVAN EL CASO: no se cuenta el tiempo de suspensión acordada por las partes (lit. a); si hay sentencia ejecutoriada a favor del demandante o auto que ordena seguir adelante la ejecución, el plazo es de DOS (2) AÑOS (lit. b); y «CUALQUIER ACTUACIÓN, de oficio o a petición de parte, DE CUALQUIER NATURALEZA, INTERRUMPIRÁ los términos» (lit. c) — un memorial cualquiera reinicia el año. QUÉ PASA DESPUÉS, Y ES DONDE ESTÁ EL VERDADERO CASTIGO: hay SEIS (6) MESES desde la ejecutoria para volver a demandar, y son ineficaces los efectos de la demanda anterior sobre la interrupción de la prescripción y la inoperancia de la caducidad (lit. f). A LA SEGUNDA VEZ SE EXTINGUE EL DERECHO PRETENDIDO (lit. g). RECURSOS: se notifica por estado y es apelable en el efecto SUSPENSIVO si lo decreta, DEVOLUTIVO si lo niega (lit. e).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la modalidad: incumplimiento de carga tras requerimiento, o inactividad de un año', mandatory: true, basis: 'Código General del Proceso, art. 317 nums. 1 y 2' },
      { n: 2, name: 'Cómputo de la inactividad desde la última notificación o actuación, descontando suspensiones acordadas', mandatory: true, basis: 'Código General del Proceso, art. 317 lit. a' },
      { n: 3, name: 'Verificación de si aplica el plazo de dos (2) años por existir sentencia o auto de seguir adelante', mandatory: true, basis: 'Código General del Proceso, art. 317 lit. b' },
      { n: 4, name: 'Orden de levantamiento de las medidas cautelares practicadas', mandatory: true, basis: 'Código General del Proceso, art. 317 lit. d' },
      { n: 5, name: 'Condena en costas, solo en la modalidad de incumplimiento de carga', mandatory: false, basis: 'Código General del Proceso, art. 317 num. 1' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr010.html'
  },
  {
    id: 'civil/auto-que-aprueba-la-liquidacion-de-costas',
    exactName: 'Auto que aprueba la liquidación de costas',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Código General del Proceso, art. 366',
    competentAuthority: 'El juez que conoció del proceso en primera o única instancia, donde la liquidación se hace de manera concentrada',
    term: { status: 'VERIFICADO', description: 'SE DICTA «INMEDIATAMENTE QUEDE EJECUTORIADA LA PROVIDENCIA QUE LE PONGA FIN AL PROCESO o notificado el auto de obedecimiento a lo dispuesto por el superior» (art. 366). No hay plazo en días para el juez, pero sí un hito que lo dispara. QUIÉN HACE QUÉ: «El SECRETARIO hará la liquidación y corresponderá AL JUEZ aprobarla o rehacerla» (num. 1). ESTE AUTO ES LA ÚNICA PUERTA PARA DISCUTIR LAS COSTAS, y ahí está el reloj del cliente: «La liquidación de las expensas y el monto de las agencias en derecho SOLO PODRÁN CONTROVERTIRSE MEDIANTE LOS RECURSOS DE REPOSICIÓN Y APELACIÓN CONTRA EL AUTO QUE APRUEBE LA LIQUIDACIÓN» (num. 5). La apelación va en efecto DIFERIDO, o suspensivo si no hay actuación pendiente. Un incidente o un memorial suelto no sirven. QUÉ DEBE ENTRAR Y SUELE QUEDARSE POR FUERA: «la TOTALIDAD de las condenas que se hayan impuesto en los autos que hayan resuelto los recursos, en los incidentes y trámites que los sustituyan, en las sentencias de AMBAS INSTANCIAS y en el recurso extraordinario de casación» (num. 2); los honorarios de auxiliares, los gastos comprobados y útiles, y las agencias en derecho «AUNQUE SE LITIGUE SIN APODERADO» (num. 3). Los honorarios de peritos contratados directamente por las partes entran si están comprobados y el juez los encuentra razonables; si exceden los parámetros del Consejo Superior de la Judicatura, el juez los regula. AGENCIAS EN DERECHO: se aplican las tarifas del Consejo Superior de la Judicatura, y cuando fijan un mínimo o un rango el juez pondera «la naturaleza, calidad y duración de la gestión realizada», SIN EXCEDER EL MÁXIMO (num. 4).' },
    requiredSections: [
      { n: 1, name: 'Liquidación elaborada por el secretario, que el juez aprueba o rehace', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 1' },
      { n: 2, name: 'Inclusión de todas las condenas de recursos, incidentes y ambas instancias', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 2' },
      { n: 3, name: 'Honorarios de auxiliares y gastos comprobados y útiles, con sus soportes', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 3' },
      { n: 4, name: 'Agencias en derecho conforme a las tarifas del Consejo Superior de la Judicatura, sin exceder el máximo', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 4' },
      { n: 5, name: 'Advertencia de que solo se controvierte por reposición y apelación contra este auto', mandatory: true, basis: 'Código General del Proceso, art. 366 num. 5' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012_pr012.html'
  }
  ]
};
