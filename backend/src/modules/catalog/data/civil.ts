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
    verifiedAt: '2026-08-12',
    sourceOfTruth: 'Ley 1564 de 2012 (Código General del Proceso), texto vigente. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma; los no verificados quedan declarados como tales y la aplicación se abstiene de afirmarlos.',
    gaps: [
    'Recurso de queja: los artículos 352 y 353 fijan el trámite pero el término de interposición no se pudo leer en la fuente consultada. Queda sin verificar.',
    'Restitución de inmueble arrendado (art. 384): el traslado sigue las reglas del proceso verbal o verbal sumario según la cuantía, de modo que el término depende del trámite y no se afirma aquí.',
    'Procesos de sucesión, liquidación de sociedad conyugal e insolvencia de persona natural: catalogados en su estructura, con términos sin verificar.',
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
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/369.htm'
  },
  {
    id: 'civil/demanda-de-proceso-verbal-sumario',
    exactName: 'Demanda de proceso verbal sumario',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82, 390 y 391',
    competentAuthority: 'Juez civil municipal en única instancia (art. 390)',
    term: { status: 'VERIFICADO', description: 'El término para contestar la demanda será de diez (10) días (art. 391).' },
    requiredSections: [
      { n: 1, name: 'Designación del juez a quien se dirige', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Nombre y domicilio de las partes y de sus representantes', mandatory: true, basis: 'Art. 82 num. 2' },
      { n: 3, name: 'Pretensiones expresadas con precisión y claridad', mandatory: true, basis: 'Art. 82 num. 4' },
      { n: 4, name: 'Hechos determinados, clasificados y numerados', mandatory: true, basis: 'Art. 82 num. 5' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' },
      { n: 6, name: 'Fundamentos de derecho', mandatory: true, basis: 'Art. 82 num. 8' },
      { n: 7, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 82 num. 10' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/391.htm'
  },
  {
    id: 'civil/demanda-ejecutiva-singular',
    exactName: 'Demanda ejecutiva singular',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82, 422 y 430',
    competentAuthority: 'Juez civil del circuito o municipal, según la cuantía',
    term: { status: 'NO_VERIFICADO', description: null },
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
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/430.htm'
  },
  {
    id: 'civil/demanda-ejecutiva-con-garantia-real',
    exactName: 'Demanda ejecutiva con garantía real',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 422, 430 y 468',
    competentAuthority: 'Juez civil del circuito o municipal, según la cuantía',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Designación del juez', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Identificación de las partes', mandatory: true, basis: 'Art. 82 num. 2' },
      { n: 3, name: 'Pretensión de pago con cargo al bien gravado', mandatory: true, basis: 'Art. 468' },
      { n: 4, name: 'Título ejecutivo y prueba de la garantía hipotecaria o prendaria', mandatory: true, basis: 'Art. 468' },
      { n: 5, name: 'Certificado de tradición del inmueble o del registro de la garantía mobiliaria', mandatory: true, basis: 'Art. 468' },
      { n: 6, name: 'Solicitud de embargo y secuestro del bien gravado', mandatory: false, basis: 'Art. 468' },
      { n: 7, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 82 num. 10' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/468.htm'
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
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/90.htm'
  },
  {
    id: 'civil/reforma-de-la-demanda',
    exactName: 'Reforma de la demanda',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 93',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso y de la demanda que se reforma', mandatory: true, basis: 'Art. 93' },
      { n: 2, name: 'Escrito integrado de la demanda con las modificaciones', mandatory: true, basis: 'Art. 93' },
      { n: 3, name: 'Indicación de las partes, hechos o pretensiones modificadas', mandatory: true, basis: 'Art. 93' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/93.htm'
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
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/369.htm'
  },
  {
    id: 'civil/contestacion-de-la-demanda-en-proceso-verbal-sumario',
    exactName: 'Contestación de la demanda en proceso verbal sumario',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 96 y 391',
    competentAuthority: 'Juez civil municipal en única instancia',
    term: { status: 'VERIFICADO', description: 'Diez (10) días para contestar la demanda (art. 391).' },
    requiredSections: [
      { n: 1, name: 'Pronunciamiento sobre las pretensiones', mandatory: true, basis: 'Art. 96 num. 2' },
      { n: 2, name: 'Pronunciamiento sobre cada hecho', mandatory: true, basis: 'Art. 96 num. 2' },
      { n: 3, name: 'Excepciones de mérito', mandatory: false, basis: 'Art. 96 num. 3' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 96 num. 4' },
      { n: 5, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 96 num. 5' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/391.htm'
  },
  {
    id: 'civil/excepciones-previas',
    exactName: 'Excepciones previas',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 100 y 101',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Enunciación de la causal invocada entre las taxativas del art. 100', mandatory: true, basis: 'Art. 100' },
      { n: 2, name: 'Hechos en que se funda cada excepción', mandatory: true, basis: 'Art. 101' },
      { n: 3, name: 'Pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 101' },
      { n: 4, name: 'Petición de que se declare probada la excepción', mandatory: true, basis: 'Art. 101' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/100.htm'
  },
  {
    id: 'civil/excepciones-de-merito-en-proceso-ejecutivo',
    exactName: 'Excepciones de mérito en proceso ejecutivo',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 442',
    competentAuthority: 'El juez que libró el mandamiento de pago',
    term: { status: 'VERIFICADO', description: 'Diez (10) días siguientes a la notificación del mandamiento ejecutivo para proponer excepciones de mérito (art. 442 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso ejecutivo y del mandamiento de pago', mandatory: true, basis: 'Art. 442' },
      { n: 2, name: 'Enunciación de cada excepción de mérito', mandatory: true, basis: 'Art. 442 num. 1' },
      { n: 3, name: 'Hechos en que se fundamentan las excepciones', mandatory: true, basis: 'Art. 442 num. 1' },
      { n: 4, name: 'Pruebas que se acompañan o se solicitan', mandatory: true, basis: 'Art. 442 num. 1' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/442.htm'
  },
  {
    id: 'civil/demanda-de-reconvencion',
    exactName: 'Demanda de reconvención',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 82 y 371',
    competentAuthority: 'El juez que conoce de la demanda principal',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Demostración de que el juez es competente para conocer de la reconvención', mandatory: true, basis: 'Art. 371' },
      { n: 3, name: 'Pretensiones propias del demandado contra el demandante', mandatory: true, basis: 'Art. 371' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/371.htm'
  },
  {
    id: 'civil/llamamiento-en-garantia',
    exactName: 'Llamamiento en garantía',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 64 a 66',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Nombre y domicilio del llamado y de su representante', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Hechos en que se basa el llamamiento y fundamentos de derecho', mandatory: true, basis: 'Art. 66' },
      { n: 3, name: 'Dirección para notificar al llamado', mandatory: true, basis: 'Art. 66' },
      { n: 4, name: 'Prueba siquiera sumaria del derecho legal o contractual invocado', mandatory: true, basis: 'Art. 64' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/64.htm'
  },
  {
    id: 'civil/solicitud-de-medidas-cautelares',
    exactName: 'Solicitud de medidas cautelares',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 590',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida solicitada', mandatory: true, basis: 'Art. 590' },
      { n: 2, name: 'Apariencia de buen derecho e interés para obrar', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 3, name: 'Necesidad, efectividad y proporcionalidad de la medida', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 4, name: 'Identificación de los bienes sobre los que recae', mandatory: true, basis: 'Art. 590' },
      { n: 5, name: 'Ofrecimiento de caución', mandatory: false, basis: 'Art. 590 par.' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/590.htm'
  },
  {
    id: 'civil/recurso-de-reposicion',
    exactName: 'Recurso de reposición',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 318 y 319',
    competentAuthority: 'El mismo juez o magistrado que dictó el auto',
    term: { status: 'VERIFICADO', description: 'Tres (3) días siguientes al de la notificación del auto, cuando se pronuncie fuera de audiencia (art. 318).' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto recurrido y su fecha de notificación', mandatory: true, basis: 'Art. 318' },
      { n: 2, name: 'Expresión de las razones de inconformidad', mandatory: true, basis: 'Art. 318' },
      { n: 3, name: 'Petición de que se reforme o revoque el auto', mandatory: true, basis: 'Art. 318' },
      { n: 4, name: 'Apelación subsidiaria, cuando el auto sea apelable', mandatory: false, basis: 'Art. 322' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/318.htm'
  },
  {
    id: 'civil/recurso-de-apelacion',
    exactName: 'Recurso de apelación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 320 a 322',
    competentAuthority: 'Se interpone ante el juez que dictó la providencia; lo resuelve el superior',
    term: { status: 'VERIFICADO', description: 'Tres (3) días siguientes a la notificación por estado, si la providencia se dictó fuera de audiencia; en audiencia, en el acto de su notificación. La sustentación se surte dentro de los tres (3) días siguientes (art. 322).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia apelada', mandatory: true, basis: 'Art. 322' },
      { n: 2, name: 'Manifestación expresa de interponer el recurso de apelación', mandatory: true, basis: 'Art. 322' },
      { n: 3, name: 'Sustentación: reparos concretos contra la providencia', mandatory: true, basis: 'Art. 322' },
      { n: 4, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 322' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/322.htm'
  },
  {
    id: 'civil/recurso-de-suplica',
    exactName: 'Recurso de súplica',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 331',
    competentAuthority: 'Los demás magistrados de la sala, con exclusión del sustanciador',
    term: { status: 'VERIFICADO', description: 'Tres (3) días siguientes a la notificación del auto (art. 331).' },
    requiredSections: [
      { n: 1, name: 'Escrito dirigido al magistrado sustanciador', mandatory: true, basis: 'Art. 331' },
      { n: 2, name: 'Identificación del auto suplicado', mandatory: true, basis: 'Art. 331' },
      { n: 3, name: 'Razones de inconformidad', mandatory: true, basis: 'Art. 331' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/331.htm'
  },
  {
    id: 'civil/recurso-de-queja',
    exactName: 'Recurso de queja',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 352 y 353',
    competentAuthority: 'El superior del juez que denegó la apelación o la casación',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Reposición previa contra el auto que denegó el recurso', mandatory: true, basis: 'Art. 353' },
      { n: 2, name: 'Interposición subsidiaria de la queja', mandatory: true, basis: 'Art. 353' },
      { n: 3, name: 'Razones por las cuales el recurso denegado era procedente', mandatory: true, basis: 'Art. 352' },
      { n: 4, name: 'Copias necesarias para el trámite ante el superior', mandatory: true, basis: 'Art. 353' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/352.htm'
  },
  {
    id: 'civil/interposicion-del-recurso-extraordinario-de-casacion',
    exactName: 'Interposición del recurso extraordinario de casación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 336 y 337',
    competentAuthority: 'Se interpone ante el tribunal; lo resuelve la Sala de Casación Civil de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días siguientes a la notificación de la sentencia. Si se pidió adición, corrección o aclaración, el término corre desde el día siguiente al de la notificación de la providencia respectiva (art. 337).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia recurrida', mandatory: true, basis: 'Art. 337' },
      { n: 2, name: 'Manifestación de interponer el recurso de casación', mandatory: true, basis: 'Art. 337' },
      { n: 3, name: 'Acreditación del interés para recurrir', mandatory: true, basis: 'Art. 337' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/337.htm'
  },
  {
    id: 'civil/demanda-de-casacion',
    exactName: 'Demanda de casación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 343 y 344',
    competentAuthority: 'Sala de Casación Civil de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Treinta (30) días de traslado común, contados desde el auto que admite el recurso; vencidos sin presentarla, se declara desierto el recurso (art. 343).' },
    requiredSections: [
      { n: 1, name: 'Designación de las partes', mandatory: true, basis: 'Art. 344' },
      { n: 2, name: 'Síntesis del proceso y de los hechos materia del litigio', mandatory: true, basis: 'Art. 344' },
      { n: 3, name: 'Formulación de los cargos, separada y numeradamente', mandatory: true, basis: 'Art. 344' },
      { n: 4, name: 'Causal de casación invocada para cada cargo', mandatory: true, basis: 'Arts. 336 y 344' },
      { n: 5, name: 'Normas de derecho sustancial que se estiman violadas', mandatory: true, basis: 'Art. 344' },
      { n: 6, name: 'Demostración del cargo', mandatory: true, basis: 'Art. 344' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/343.htm'
  },
  {
    id: 'civil/recurso-extraordinario-de-revision',
    exactName: 'Recurso extraordinario de revisión',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 354 a 356',
    competentAuthority: 'La Corte Suprema de Justicia o el tribunal superior, según quién dictó la sentencia (art. 354)',
    term: { status: 'VERIFICADO', description: 'Dos (2) años siguientes a la ejecutoria de la sentencia para las causales 1, 6, 8 y 9. Para la causal 7 el término corre desde que el perjudicado conoce la sentencia, sin exceder cinco (5) años (art. 356).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia impugnada y de las partes', mandatory: true, basis: 'Art. 355' },
      { n: 2, name: 'Causal de revisión invocada entre las nueve del art. 355', mandatory: true, basis: 'Art. 355' },
      { n: 3, name: 'Hechos que configuran la causal', mandatory: true, basis: 'Art. 355' },
      { n: 4, name: 'Pruebas que se acompañan o se solicitan', mandatory: true, basis: 'Art. 355' },
      { n: 5, name: 'Caución para responder por perjuicios, cuando la ley la exija', mandatory: false, basis: 'Art. 357' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/356.htm'
  },
  {
    id: 'civil/solicitud-de-aclaracion-de-providencia',
    exactName: 'Solicitud de aclaración de providencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 285',
    competentAuthority: 'El mismo juez que profirió la providencia',
    term: { status: 'VERIFICADO', description: 'Dentro del término de ejecutoria de la providencia (art. 285). La ejecutoria de las providencias dictadas fuera de audiencia se cumple tres (3) días después de notificadas (art. 302).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia y de su notificación', mandatory: true, basis: 'Art. 285' },
      { n: 2, name: 'Señalamiento del concepto o frase que ofrece verdadero motivo de duda', mandatory: true, basis: 'Art. 285' },
      { n: 3, name: 'Demostración de que está en la parte resolutiva o influye en ella', mandatory: true, basis: 'Art. 285' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/285.htm'
  },
  {
    id: 'civil/solicitud-de-adicion-de-providencia',
    exactName: 'Solicitud de adición de providencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 287',
    competentAuthority: 'El mismo juez que profirió la providencia',
    term: { status: 'VERIFICADO', description: 'Dentro del término de ejecutoria de la providencia (art. 287).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia', mandatory: true, basis: 'Art. 287' },
      { n: 2, name: 'Señalamiento del extremo de la litis o punto omitido', mandatory: true, basis: 'Art. 287' },
      { n: 3, name: 'Petición de sentencia o auto complementario', mandatory: true, basis: 'Art. 287' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/287.htm'
  },
  {
    id: 'civil/solicitud-de-correccion-de-errores-aritmeticos',
    exactName: 'Solicitud de corrección de errores aritméticos',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 286',
    competentAuthority: 'El mismo juez que profirió la providencia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia', mandatory: true, basis: 'Art. 286' },
      { n: 2, name: 'Señalamiento del error puramente aritmético, de nombre o de cita', mandatory: true, basis: 'Art. 286' },
      { n: 3, name: 'Indicación del texto correcto', mandatory: true, basis: 'Art. 286' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/286.htm'
  },
  {
    id: 'civil/solicitud-de-nulidad-procesal',
    exactName: 'Solicitud de nulidad procesal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 133 a 138',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Causal de nulidad invocada entre las taxativas del art. 133', mandatory: true, basis: 'Art. 133' },
      { n: 2, name: 'Hechos en que se fundamenta', mandatory: true, basis: 'Art. 135' },
      { n: 3, name: 'Acreditación del interés para proponerla y de que no se saneó', mandatory: true, basis: 'Arts. 135 y 136' },
      { n: 4, name: 'Pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 135' },
      { n: 5, name: 'Petición de invalidez de lo actuado y de rehacer la actuación', mandatory: true, basis: 'Art. 138' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/133.htm'
  },
  {
    id: 'civil/demanda-de-declaracion-de-pertenencia',
    exactName: 'Demanda de declaración de pertenencia',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 375',
    competentAuthority: 'Juez civil del circuito o municipal del lugar de ubicación del inmueble',
    term: { status: 'VERIFICADO', description: 'Un (1) mes para contestar, contado desde la inclusión del proceso en el Registro Nacional de Procesos de Pertenencia (art. 375).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación precisa del bien: linderos, cabida y ubicación', mandatory: true, basis: 'Art. 375' },
      { n: 3, name: 'Hechos de la posesión: acto de aprehensión, tiempo y ánimo de señor y dueño', mandatory: true, basis: 'Art. 375' },
      { n: 4, name: 'Certificado del registrador sobre titulares de derechos reales principales', mandatory: true, basis: 'Art. 375' },
      { n: 5, name: 'Demanda dirigida contra el titular inscrito, y citación del acreedor hipotecario o prendario', mandatory: true, basis: 'Art. 375' },
      { n: 6, name: 'Fotografías del inmueble y compromiso de instalar la valla informativa', mandatory: true, basis: 'Art. 375' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/375.htm'
  },
  {
    id: 'civil/demanda-de-restitucion-de-inmueble-arrendado',
    exactName: 'Demanda de restitución de inmueble arrendado',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 384',
    competentAuthority: 'Juez civil municipal o del circuito del lugar del inmueble',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Prueba del contrato de arrendamiento', mandatory: true, basis: 'Art. 384' },
      { n: 3, name: 'Causal de restitución invocada', mandatory: true, basis: 'Art. 384' },
      { n: 4, name: 'Cuando la causal es la mora: manifestación bajo juramento sobre los cánones adeudados', mandatory: true, basis: 'Art. 384 num. 2' },
      { n: 5, name: 'Solicitud de embargo y secuestro, cuando proceda', mandatory: false, basis: 'Art. 384' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/384.htm'
  },
  {
    id: 'civil/demanda-de-rendicion-provocada-de-cuentas',
    exactName: 'Demanda de rendición provocada de cuentas',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 379',
    competentAuthority: 'Juez civil municipal o del circuito, según la cuantía',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Indicación de la obligación de rendir cuentas y su fuente', mandatory: true, basis: 'Art. 379' },
      { n: 3, name: 'Período respecto del cual se piden las cuentas', mandatory: true, basis: 'Art. 379' },
      { n: 4, name: 'Estimación razonada de lo que se considere debido', mandatory: false, basis: 'Art. 379' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/379.htm'
  },
  {
    id: 'civil/demanda-de-pago-por-consignacion',
    exactName: 'Demanda de pago por consignación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 381',
    competentAuthority: 'Juez civil municipal o del circuito, según la cuantía',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación de la obligación cuyo pago se ofrece', mandatory: true, basis: 'Art. 381' },
      { n: 3, name: 'Prueba de la oferta de pago o de la negativa del acreedor a recibirlo', mandatory: true, basis: 'Art. 381' },
      { n: 4, name: 'Constancia de consignación a órdenes del juzgado', mandatory: true, basis: 'Art. 381' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/381.htm'
  },
  {
    id: 'civil/demanda-de-impugnacion-de-actos-de-asambleas-juntas-directivas-o-de-socios',
    exactName: 'Demanda de impugnación de actos de asambleas, juntas directivas o de socios',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 382',
    competentAuthority: 'Juez civil del circuito del domicilio de la persona jurídica',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación del acto impugnado y de la reunión en que se adoptó', mandatory: true, basis: 'Art. 382' },
      { n: 3, name: 'Causal de nulidad o ineficacia invocada', mandatory: true, basis: 'Art. 382' },
      { n: 4, name: 'Copia del acta correspondiente', mandatory: true, basis: 'Art. 382' },
      { n: 5, name: 'Solicitud de suspensión del acto impugnado', mandatory: false, basis: 'Art. 382' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/382.htm'
  },
  {
    id: 'civil/demanda-divisoria',
    exactName: 'Demanda divisoria',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 406 a 411',
    competentAuthority: 'Juez civil municipal o del circuito del lugar del bien',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Prueba de la titularidad de la cuota sobre el bien común', mandatory: true, basis: 'Art. 406' },
      { n: 3, name: 'Identificación del bien y de todos los comuneros', mandatory: true, basis: 'Art. 406' },
      { n: 4, name: 'Petición de división material o de venta', mandatory: true, basis: 'Art. 406' },
      { n: 5, name: 'Certificado de tradición del inmueble', mandatory: true, basis: 'Art. 406' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/406.htm'
  },
  {
    id: 'civil/demanda-de-deslinde-y-amojonamiento',
    exactName: 'Demanda de deslinde y amojonamiento',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 400 a 405',
    competentAuthority: 'Juez civil municipal del lugar de ubicación del inmueble',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Identificación de los predios y de la línea divisoria discutida', mandatory: true, basis: 'Art. 400' },
      { n: 3, name: 'Títulos de propiedad de los predios', mandatory: true, basis: 'Art. 400' },
      { n: 4, name: 'Certificados de tradición', mandatory: true, basis: 'Art. 400' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/400.htm'
  },
  {
    id: 'civil/demanda-de-expropiacion',
    exactName: 'Demanda de expropiación',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 399',
    competentAuthority: 'Juez civil del circuito del lugar del bien',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Copia del acto administrativo que decretó la expropiación', mandatory: true, basis: 'Art. 399' },
      { n: 3, name: 'Identificación del bien y de los titulares de derechos reales', mandatory: true, basis: 'Art. 399' },
      { n: 4, name: 'Avalúo del bien', mandatory: true, basis: 'Art. 399' },
      { n: 5, name: 'Solicitud de entrega anticipada, cuando proceda', mandatory: false, basis: 'Art. 399' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/399.htm'
  },
  {
    id: 'civil/demanda-de-proceso-de-sucesion',
    exactName: 'Demanda de proceso de sucesión',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 488 y siguientes',
    competentAuthority: 'Juez de familia o civil del último domicilio del causante',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 82' },
      { n: 2, name: 'Registro civil de defunción del causante', mandatory: true, basis: 'Art. 489' },
      { n: 3, name: 'Prueba del estado civil que legitima al solicitante', mandatory: true, basis: 'Art. 489' },
      { n: 4, name: 'Inventario de los bienes relictos', mandatory: true, basis: 'Art. 501' },
      { n: 5, name: 'Testamento, cuando la sucesión sea testada', mandatory: false, basis: 'Art. 489' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/488.htm'
  },
  {
    id: 'civil/solicitud-de-amparo-de-pobreza',
    exactName: 'Solicitud de amparo de pobreza',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 151 a 158',
    competentAuthority: 'El juez que conoce o conocerá del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Afirmación bajo juramento de que no se está en capacidad de atender los gastos del proceso', mandatory: true, basis: 'Art. 152' },
      { n: 2, name: 'Indicación del proceso en que se solicita', mandatory: true, basis: 'Art. 152' },
      { n: 3, name: 'Petición de designación de apoderado, cuando se requiera', mandatory: false, basis: 'Art. 154' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/151.htm'
  },
  {
    id: 'civil/solicitud-de-prueba-extraprocesal',
    exactName: 'Solicitud de prueba extraprocesal',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 183 a 190',
    competentAuthority: 'Juez civil municipal, o notario en los casos permitidos',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de quien solicita y de la persona contra quien se pretende hacer valer', mandatory: true, basis: 'Art. 184' },
      { n: 2, name: 'Indicación de la prueba que se pide practicar', mandatory: true, basis: 'Art. 183' },
      { n: 3, name: 'Objeto o finalidad de la prueba', mandatory: true, basis: 'Art. 183' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/183.htm'
  },
  {
    id: 'civil/desistimiento-de-las-pretensiones',
    exactName: 'Desistimiento de las pretensiones',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 314',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Manifestación expresa e incondicional de desistir', mandatory: true, basis: 'Art. 314' },
      { n: 2, name: 'Identificación de las pretensiones de las que se desiste', mandatory: true, basis: 'Art. 314' },
      { n: 3, name: 'Facultad expresa del apoderado para desistir', mandatory: true, basis: 'Art. 77' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/314.htm'
  },
  {
    id: 'civil/solicitud-de-acumulacion-de-procesos',
    exactName: 'Solicitud de acumulación de procesos',
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 148 y 149',
    competentAuthority: 'El juez que conoce del proceso más antiguo',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los procesos cuya acumulación se pide', mandatory: true, basis: 'Art. 148' },
      { n: 2, name: 'Causal de acumulación invocada', mandatory: true, basis: 'Art. 148' },
      { n: 3, name: 'Prueba de la existencia y estado de los procesos', mandatory: true, basis: 'Art. 149' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/148.htm'
  },
  {
    id: 'civil/auto-admisorio-de-la-demanda',
    exactName: 'Auto admisorio de la demanda',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 90 y 369',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Admitida la demanda en proceso verbal, se corre traslado al demandado por veinte (20) días (art. 369).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los requisitos de la demanda y de sus anexos', mandatory: true, basis: 'Arts. 82 y 84' },
      { n: 2, name: 'Declaración de admisión', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Orden de traslado al demandado con indicación del término', mandatory: true, basis: 'Art. 369' },
      { n: 4, name: 'Orden de notificación personal', mandatory: true, basis: 'Art. 291' },
      { n: 5, name: 'Pronunciamiento sobre las medidas cautelares solicitadas', mandatory: false, basis: 'Art. 590' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/90.htm'
  },
  {
    id: 'civil/auto-inadmisorio-de-la-demanda',
    exactName: 'Auto inadmisorio de la demanda',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 90',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Se concede al demandante un término de cinco (5) días para subsanar, so pena de rechazo (art. 90).' },
    requiredSections: [
      { n: 1, name: 'Señalamiento preciso de cada defecto, entre las causales taxativas del art. 90', mandatory: true, basis: 'Art. 90' },
      { n: 2, name: 'Concesión del término de cinco (5) días para subsanar', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Advertencia de rechazo en caso de no subsanarse', mandatory: true, basis: 'Art. 90' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/90.htm'
  },
  {
    id: 'civil/auto-de-rechazo-de-la-demanda',
    exactName: 'Auto de rechazo de la demanda',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 90',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Motivo del rechazo: falta de jurisdicción, competencia, caducidad o no subsanación', mandatory: true, basis: 'Art. 90' },
      { n: 2, name: 'Orden de devolución de los anexos sin necesidad de desglose', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Orden de remisión al juez competente, cuando el rechazo obedezca a falta de jurisdicción o competencia', mandatory: false, basis: 'Art. 90' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/90.htm'
  },
  {
    id: 'civil/mandamiento-de-pago',
    exactName: 'Mandamiento de pago',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 422 y 430',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'VERIFICADO', description: 'Notificado el mandamiento ejecutivo, el ejecutado dispone de diez (10) días para proponer excepciones de mérito (art. 442 num. 1).' },
    requiredSections: [
      { n: 1, name: 'Verificación de que el título presta mérito ejecutivo: obligación clara, expresa y exigible', mandatory: true, basis: 'Art. 422' },
      { n: 2, name: 'Orden de pago con determinación de capital, intereses y plazo', mandatory: true, basis: 'Art. 430' },
      { n: 3, name: 'Advertencia del término para proponer excepciones', mandatory: true, basis: 'Art. 442' },
      { n: 4, name: 'Pronunciamiento sobre las medidas cautelares solicitadas', mandatory: false, basis: 'Art. 599' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/430.htm'
  },
  {
    id: 'civil/auto-que-resuelve-excepciones-previas',
    exactName: 'Auto que resuelve excepciones previas',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 101',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de cada excepción propuesta', mandatory: true, basis: 'Art. 101' },
      { n: 2, name: 'Análisis probatorio de los hechos que las fundan', mandatory: true, basis: 'Art. 101' },
      { n: 3, name: 'Decisión sobre cada excepción y sus efectos', mandatory: true, basis: 'Art. 101' },
      { n: 4, name: 'Concesión de término para subsanar, cuando el defecto sea subsanable', mandatory: false, basis: 'Art. 101' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/101.htm'
  },
  {
    id: 'civil/auto-que-decreta-medidas-cautelares',
    exactName: 'Auto que decreta medidas cautelares',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 590',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Apreciación de la apariencia de buen derecho y del interés para obrar', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 2, name: 'Juicio de necesidad, efectividad y proporcionalidad de la medida', mandatory: true, basis: 'Art. 590 lit. c' },
      { n: 3, name: 'Determinación de la medida y de los bienes sobre los que recae', mandatory: true, basis: 'Art. 590' },
      { n: 4, name: 'Fijación de la caución, cuando proceda', mandatory: false, basis: 'Art. 590 par.' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/590.htm'
  },
  {
    id: 'civil/sentencia-de-primera-instancia-en-proceso-declarativo',
    exactName: 'Sentencia de primera instancia en proceso declarativo',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 278 a 280 y 373',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'No podrá transcurrir un lapso superior a un (1) año para dictar sentencia de primera o única instancia, contado desde la notificación del auto admisorio al demandado (art. 121).' },
    requiredSections: [
      { n: 1, name: 'Síntesis de la demanda y de su contestación', mandatory: true, basis: 'Art. 280' },
      { n: 2, name: 'Motivación: examen crítico de las pruebas y razonamientos legales', mandatory: true, basis: 'Art. 280' },
      { n: 3, name: 'Decisión expresa y clara sobre cada pretensión', mandatory: true, basis: 'Art. 281' },
      { n: 4, name: 'Resolución sobre las excepciones de mérito propuestas', mandatory: true, basis: 'Art. 282' },
      { n: 5, name: 'Congruencia con los hechos y pretensiones', mandatory: true, basis: 'Art. 281' },
      { n: 6, name: 'Condena en costas', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/280.htm'
  },
  {
    id: 'civil/sentencia-de-segunda-instancia',
    exactName: 'Sentencia de segunda instancia',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 280, 328 y 121',
    competentAuthority: 'Tribunal superior o juez civil del circuito, según el caso',
    term: { status: 'VERIFICADO', description: 'El plazo para resolver la segunda instancia no podrá ser superior a seis (6) meses, contados desde la recepción del expediente en la secretaría (art. 121).' },
    requiredSections: [
      { n: 1, name: 'Delimitación de la competencia del superior a los reparos formulados por el apelante', mandatory: true, basis: 'Art. 328' },
      { n: 2, name: 'Síntesis del proceso y de la sentencia apelada', mandatory: true, basis: 'Art. 280' },
      { n: 3, name: 'Motivación sobre cada reparo', mandatory: true, basis: 'Arts. 280 y 328' },
      { n: 4, name: 'Decisión: confirma, revoca o modifica', mandatory: true, basis: 'Art. 328' },
      { n: 5, name: 'Condena en costas de la instancia', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/328.htm'
  },
  {
    id: 'civil/auto-que-ordena-seguir-adelante-la-ejecucion',
    exactName: 'Auto que ordena seguir adelante la ejecución',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 440',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Constatación de que no se propusieron excepciones o de que fueron desestimadas', mandatory: true, basis: 'Art. 440' },
      { n: 2, name: 'Orden de seguir adelante la ejecución en la forma pedida', mandatory: true, basis: 'Art. 440' },
      { n: 3, name: 'Orden de practicar la liquidación del crédito', mandatory: true, basis: 'Arts. 440 y 446' },
      { n: 4, name: 'Orden de avalúo y remate de los bienes embargados', mandatory: true, basis: 'Art. 440' },
      { n: 5, name: 'Condena en costas', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/440.htm'
  },
  {
    id: 'civil/liquidacion-del-credito',
    exactName: 'Liquidación del crédito',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 446',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Especificación del capital y de los intereses causados', mandatory: true, basis: 'Art. 446' },
      { n: 2, name: 'Indicación de la tasa aplicada y del período liquidado', mandatory: true, basis: 'Art. 446' },
      { n: 3, name: 'Traslado a la parte contraria para objeciones', mandatory: true, basis: 'Art. 446' },
      { n: 4, name: 'Aprobación o modificación de la liquidación', mandatory: true, basis: 'Art. 446' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/446.htm'
  },
  {
    id: 'civil/auto-que-declara-la-nulidad-procesal',
    exactName: 'Auto que declara la nulidad procesal',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 137 y 138',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la causal de nulidad configurada', mandatory: true, basis: 'Art. 133' },
      { n: 2, name: 'Verificación de que la nulidad no fue saneada', mandatory: true, basis: 'Art. 136' },
      { n: 3, name: 'Determinación de la actuación afectada y de la que conserva validez', mandatory: true, basis: 'Art. 138' },
      { n: 4, name: 'Orden de rehacer la actuación anulada', mandatory: true, basis: 'Art. 138' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/137.htm'
  },
  {
    id: 'civil/sentencia-de-declaracion-de-pertenencia',
    exactName: 'Sentencia de declaración de pertenencia',
    branch: 'CIVIL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 375',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Verificación del cumplimiento de la publicidad: valla, emplazamiento y registro del proceso', mandatory: true, basis: 'Art. 375' },
      { n: 2, name: 'Análisis de los elementos de la posesión: aprehensión, ánimo de señor y dueño y tiempo', mandatory: true, basis: 'Art. 375' },
      { n: 3, name: 'Identificación del bien con sus linderos y cabida', mandatory: true, basis: 'Art. 375' },
      { n: 4, name: 'Orden de inscripción en el registro de instrumentos públicos', mandatory: true, basis: 'Art. 375' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/375.htm'
  }
  ]
};
