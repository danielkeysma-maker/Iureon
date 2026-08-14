import type { BranchCatalog } from '../types';

/**
 * LABORAL catalogue.
 *
 * Generated from research/actuaciones-laboral.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const LABORAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'LABORAL',
    verifiedAt: '2026-08-14',
    sourceOfTruth: 'Ley 2452 de 2025, nuevo Código Procesal del Trabajo y de la Seguridad Social. Publicada en el Diario Oficial el 2 de abril de 2025 y VIGENTE DESDE EL 2 DE ABRIL DE 2026, en reemplazo del Decreto Ley 2158 de 1948. Los términos marcados como verificados fueron leídos artículo por artículo en el texto del código nuevo.',
    gaps: [
    'NOTA (2026-08-14): la lista siguiente es anterior a la verificacion masiva de esta fecha. Varios de esos huecos quedaron cerrados; los vigentes estan en _meta.unverified con su razon. Ver research/VERIFICATION-2026-08-14.md.',
    'RÉGIMEN DE TRANSICIÓN — ADVERTENCIA CENTRAL DE ESTA RAMA. La Ley 2452 de 2025 rige desde el 2 de abril de 2026, pero los procesos iniciados antes de esa fecha continúan tramitándose por el Decreto Ley 2158 de 1948 y sus reformas. Los términos de este catálogo son los del código NUEVO. Antes de aplicar cualquiera, confirme la fecha de inicio del proceso: si es anterior al 2 de abril de 2026, rige el código anterior y la numeración de artículos es distinta.',
    'La numeración del código cambió por completo frente al Decreto 2158 de 1948. Las citas de artículos que circulan en formatos, minutas y jurisprudencia anterior a abril de 2026 corresponden al código derogado y no coinciden con este catálogo.',
    'Término para presentar la demanda de casación: el art. 244 fija sus requisitos pero no el plazo. Queda sin verificar.',
    'Prescripción de las acciones de fuero sindical: no se ubicó el artículo del código nuevo que la fija. Queda sin verificar; bajo el código anterior era de dos (2) meses.',
    'Términos del proceso ejecutivo laboral (arts. 265 a 285): la estructura está catalogada, los términos no se verificaron.',
    'Los procesos de única instancia fueron eliminados por el código nuevo; la doble instancia es la regla general.'
    ]
  },
  actuaciones: [
  {
    id: 'laboral/demanda-laboral-ordinaria',
    exactName: 'Demanda laboral ordinaria',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 65 y 66',
    competentAuthority: 'Juez laboral del circuito o juez municipal de pequeñas causas laborales, según la cuantía',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad para presentar la demanda ordinaria laboral: la Ley 2452 de 2025 no fija plazo de caducidad para acudir a la jurisdicción. El art. 61 (Forma y requisitos de la demanda) regula únicamente su contenido, y el art. 66 num. 7 contempla la caducidad como causal de inadmisión solo "cuando se haya cumplido el término de caducidad para iniciar la acción", es decir, cuando una ley especial la establezca. El límite temporal ordinario es la prescripción trienal del art. 317: las acciones que emanen de las leyes sociales prescriben en tres (3) años contados desde que la respectiva obligación se hizo exigible, salvo prescripciones especiales del código.' },
    requiredSections: [
      { n: 1, name: 'Designación del juez a quien se dirige', mandatory: true, basis: null },
      { n: 2, name: 'Identificación de las partes: nombre, domicilio, dirección física, correo electrónico y canal digital', mandatory: true, basis: null },
      { n: 3, name: 'Pretensiones expresadas con precisión y claridad', mandatory: true, basis: null },
      { n: 4, name: 'Hechos que sirven de fundamento, determinados y numerados', mandatory: true, basis: null },
      { n: 5, name: 'Fundamentos y razones de derecho', mandatory: true, basis: null },
      { n: 6, name: 'Petición de pruebas, específica y detallada', mandatory: true, basis: null },
      { n: 7, name: 'Cuantía, cuando sea necesaria para determinar la competencia', mandatory: false, basis: null },
      { n: 8, name: 'Anexos: poder, prueba de existencia y representación, y documentos probatorios', mandatory: true, basis: 'Art. 66' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/subsanacion-de-demanda-laboral-inadmitida',
    exactName: 'Subsanación de demanda laboral inadmitida',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 66',
    competentAuthority: 'El mismo juez que inadmitió la demanda',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días para subsanar los defectos relacionados por el juez, so pena de rechazo (art. 66).' },
    requiredSections: [
      { n: 1, name: 'Referencia al auto inadmisorio y a cada defecto relacionado', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Corrección puntual de cada defecto', mandatory: true, basis: 'Art. 66' },
      { n: 3, name: 'Anexos legales que se echaron de menos', mandatory: true, basis: 'Art. 66' },
      { n: 4, name: 'Solicitud de admisión de la demanda subsanada', mandatory: true, basis: 'Art. 66' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/66.htm'
  },
  {
    id: 'laboral/contestacion-de-la-demanda-laboral',
    exactName: 'Contestación de la demanda laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 69 y 255',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Diez (10) días de traslado común, contados desde la notificación del auto admisorio (art. 255).' },
    requiredSections: [
      { n: 1, name: 'Nombre del demandado, domicilio, dirección física, correo electrónico y canal digital', mandatory: true, basis: 'Art. 69 num. 1' },
      { n: 2, name: 'Pronunciamiento expreso sobre cada pretensión', mandatory: true, basis: 'Art. 69 num. 2' },
      { n: 3, name: 'Pronunciamiento sobre los hechos: cuáles se admiten, cuáles se niegan y cuáles no constan, con su explicación', mandatory: true, basis: 'Art. 69 num. 3' },
      { n: 4, name: 'Hechos, fundamentos y razones de derecho de la defensa', mandatory: true, basis: 'Art. 69 num. 4' },
      { n: 5, name: 'Solicitud de pruebas, específica y detallada', mandatory: true, basis: 'Art. 69 num. 5' },
      { n: 6, name: 'Excepciones que se pretenda hacer valer, debidamente fundamentadas', mandatory: true, basis: 'Art. 69 num. 6' },
      { n: 7, name: 'Anexos: poder, documentos probatorios y prueba de existencia legal si es persona jurídica', mandatory: true, basis: 'Art. 69' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/69.htm'
  },
  {
    id: 'laboral/excepciones-previas-en-proceso-laboral',
    exactName: 'Excepciones previas en proceso laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 74',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Se formulan dentro del término del traslado de la demanda, en el mismo escrito de la contestación. Del escrito que las contenga se corre traslado al demandante por tres (3) días (art. 74).' },
    requiredSections: [
      { n: 1, name: 'Formulación dentro del mismo escrito de contestación', mandatory: true, basis: 'Art. 74' },
      { n: 2, name: 'Enunciación de cada excepción previa', mandatory: true, basis: 'Art. 74' },
      { n: 3, name: 'Hechos en que se fundamenta', mandatory: true, basis: 'Art. 74' },
      { n: 4, name: 'Pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 74' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/74.htm'
  },
  {
    id: 'laboral/demanda-de-reconvencion-laboral',
    exactName: 'Demanda de reconvención laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 256 y 257',
    competentAuthority: 'El juez que conoce de la demanda principal',
    term: { status: 'VERIFICADO', description: 'Se propone al contestar la demanda, esto es, dentro del término común de diez (10) días de traslado del auto admisorio (arts. 256 y 255). Se formula en escrito separado del de la contestación y, admitida, de ella se corre traslado común al reconvenido, al agente del Ministerio Público y a los integrados a la litis por el mismo término de la demanda inicial —diez (10) días— sustanciándose en adelante bajo un mismo trámite y decidiéndose en una misma sentencia (art. 257).' },
    requiredSections: [
      { n: 1, name: 'Requisitos generales de la demanda', mandatory: true, basis: 'Art. 257' },
      { n: 2, name: 'Acreditación de que el juez es competente para conocer de la reconvención', mandatory: true, basis: 'Art. 256' },
      { n: 3, name: 'Pretensiones propias del demandado contra el demandante', mandatory: true, basis: 'Art. 257' },
      { n: 4, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 257' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/recurso-de-reposicion-laboral',
    exactName: 'Recurso de reposición laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 227',
    competentAuthority: 'El mismo juez o sala que profirió el auto interlocutorio',
    term: { status: 'VERIFICADO', description: 'Si el auto se profiere en audiencia, debe interponerse, sustentarse y resolverse en la misma audiencia. Si se profiere fuera de audiencia, debe interponerse y sustentarse dentro de los tres (3) días siguientes a su notificación por estado electrónico (art. 227).' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto interlocutorio recurrido', mandatory: true, basis: 'Art. 227' },
      { n: 2, name: 'Sustentación: razones de inconformidad', mandatory: true, basis: 'Art. 227' },
      { n: 3, name: 'Petición de reforma o revocatoria', mandatory: true, basis: 'Art. 227' },
      { n: 4, name: 'Apelación subsidiaria, cuando el auto sea apelable', mandatory: false, basis: 'Art. 228' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/227.htm'
  },
  {
    id: 'laboral/recurso-de-apelacion-laboral',
    exactName: 'Recurso de apelación laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 228 a 230',
    competentAuthority: 'Se interpone ante el juez que profirió la providencia; lo resuelve la sala laboral del tribunal superior',
    term: { status: 'VERIFICADO', description: 'Oralmente en la audiencia en que se profiera la providencia, o por escrito dentro de los tres (3) días siguientes cuando se notifique fuera de audiencia. Tratándose de sentencia, la sustentación se presenta por escrito dentro de los cinco (5) días siguientes (art. 230).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia apelada', mandatory: true, basis: 'Art. 230' },
      { n: 2, name: 'Manifestación expresa de interponer la apelación', mandatory: true, basis: 'Art. 230' },
      { n: 3, name: 'Sustentación: reparos concretos contra la providencia', mandatory: true, basis: 'Art. 230' },
      { n: 4, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 230' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/230.htm'
  },
  {
    id: 'laboral/recurso-de-queja-laboral',
    exactName: 'Recurso de queja laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 232',
    competentAuthority: 'El superior del juez que denegó o concedió indebidamente la apelación',
    term: { status: 'VERIFICADO', description: 'Debe interponerse y sustentarse en el acto cuando el auto que niega la apelación se profiera en audiencia; si se profiere fuera de audiencia, dentro de los tres (3) días siguientes (art. 232).' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto que denegó o concedió indebidamente la apelación', mandatory: true, basis: 'Art. 232' },
      { n: 2, name: 'Razones por las cuales el recurso denegado era procedente', mandatory: true, basis: 'Art. 232' },
      { n: 3, name: 'Sustentación en el acto o dentro del término, según corresponda', mandatory: true, basis: 'Art. 232' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/232.htm'
  },
  {
    id: 'laboral/interposicion-del-recurso-de-casacion-laboral',
    exactName: 'Interposición del recurso de casación laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 239 y 243',
    competentAuthority: 'Se interpone ante el tribunal; lo resuelve la Sala de Casación Laboral de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días siguientes a la notificación de la sentencia de segunda instancia (art. 243).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia de segunda instancia recurrida', mandatory: true, basis: 'Art. 243' },
      { n: 2, name: 'Manifestación de interponer el recurso de casación', mandatory: true, basis: 'Art. 243' },
      { n: 3, name: 'Acreditación de que la sentencia es susceptible del recurso', mandatory: true, basis: 'Art. 239' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/243.htm'
  },
  {
    id: 'laboral/demanda-de-casacion-laboral',
    exactName: 'Demanda de casación laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 244',
    competentAuthority: 'Sala de Casación Laboral de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Veinte (20) días de traslado para sustentar el recurso, contados desde que el tribunal lo concede en el efecto devolutivo (art. 243, inc. 2). Presentada la demanda de casación en término, el tribunal remite la actuación a la Sala de Casación Laboral; si no se sustenta oportunamente, el recurso se declara desierto y la actuación vuelve al juzgado de origen (art. 243, inc. 3). Admitido y calificada la demanda, la Sala corre traslado al opositor por quince (15) días (art. 247). El art. 244 fija únicamente los requisitos de contenido de la demanda de casación, no su plazo.' },
    requiredSections: [
      { n: 1, name: 'Designación de las partes', mandatory: true, basis: 'Art. 244 num. 1' },
      { n: 2, name: 'Síntesis de los hechos del caso', mandatory: true, basis: 'Art. 244' },
      { n: 3, name: 'Identificación de la sentencia impugnada', mandatory: true, basis: 'Art. 244' },
      { n: 4, name: 'Alcance de la impugnación', mandatory: true, basis: 'Art. 244' },
      { n: 5, name: 'Causal de casación invocada y normas de derecho sustancial violadas', mandatory: true, basis: 'Art. 244' },
      { n: 6, name: 'Cargos concretos con las razones que los sustentan', mandatory: true, basis: 'Art. 244' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/solicitud-de-seleccion-de-sentencia-ante-la-sala-de-casacion-laboral',
    exactName: 'Solicitud de selección de sentencia ante la Sala de Casación Laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 240',
    competentAuthority: 'Sala de Casación Laboral de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Quince (15) días siguientes a la ejecutoria de la sentencia de segunda instancia. La Sala decide sobre la selección en un término de veinte (20) días (art. 240).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia de segunda instancia', mandatory: true, basis: 'Art. 240' },
      { n: 2, name: 'Criterio de selección que se invoca', mandatory: true, basis: 'Art. 240' },
      { n: 3, name: 'Razones que justifican la selección', mandatory: true, basis: 'Art. 240' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/240.htm'
  },
  {
    id: 'laboral/recurso-extraordinario-de-revision-laboral',
    exactName: 'Recurso extraordinario de revisión laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 233 a 236',
    competentAuthority: 'El superior funcional del juez que profirió la decisión; si la profirió la Sala de Casación Laboral, esa misma corporación (art. 234)',
    term: { status: 'VERIFICADO', description: 'Cinco (5) años siguientes a la ejecutoria de la sentencia laboral, o de la conciliación o transacción, según el caso (art. 236).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia, conciliación o transacción impugnada', mandatory: true, basis: 'Art. 233' },
      { n: 2, name: 'Causal de revisión invocada', mandatory: true, basis: 'Art. 233' },
      { n: 3, name: 'Hechos que configuran la causal', mandatory: true, basis: 'Art. 233' },
      { n: 4, name: 'Pruebas que se acompañan o se solicitan', mandatory: true, basis: 'Art. 233' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/236.htm'
  },
  {
    id: 'laboral/demanda-de-reintegro-por-fuero-sindical',
    exactName: 'Demanda de reintegro por fuero sindical',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 293 y 294',
    competentAuthority: 'Juez laboral del circuito',
    term: { status: 'VERIFICADO', description: 'Admitida la demanda se da traslado por término común de cinco (5) días para contestarla por escrito. La audiencia pública debe celebrarse a más tardar dentro de los diez (10) días siguientes al vencimiento de ese término (art. 294).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la condición de aforado del trabajador', mandatory: true, basis: 'Art. 293' },
      { n: 2, name: 'Hechos del despido, traslado o desmejora sin autorización judicial', mandatory: true, basis: 'Art. 293' },
      { n: 3, name: 'Pretensión de reintegro y pago de salarios dejados de percibir', mandatory: true, basis: 'Art. 293' },
      { n: 4, name: 'Vinculación del sindicato al proceso', mandatory: true, basis: 'Art. 299' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 293' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/294.htm'
  },
  {
    id: 'laboral/demanda-de-levantamiento-de-fuero-sindical',
    exactName: 'Demanda de levantamiento de fuero sindical',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 292 y 294',
    competentAuthority: 'Juez laboral del circuito',
    term: { status: 'VERIFICADO', description: 'Traslado común de cinco (5) días para contestar por escrito; audiencia pública a más tardar dentro de los diez (10) días siguientes (art. 294).' },
    requiredSections: [
      { n: 1, name: 'Identificación del trabajador aforado y de su condición', mandatory: true, basis: 'Art. 292' },
      { n: 2, name: 'Justa causa que se invoca para el despido, traslado o desmejora', mandatory: true, basis: 'Art. 292' },
      { n: 3, name: 'Pretensión de autorización judicial', mandatory: true, basis: 'Art. 292' },
      { n: 4, name: 'Vinculación del sindicato', mandatory: true, basis: 'Art. 299' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 292' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/292.htm'
  },
  {
    id: 'laboral/demanda-ejecutiva-laboral',
    exactName: 'Demanda ejecutiva laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 265 y siguientes',
    competentAuthority: 'Juez laboral del circuito, o el que conoció del proceso cuando se ejecuta su propia sentencia',
    term: { status: 'VERIFICADO', description: 'El plazo para solicitar la ejecución es igual al fijado en las leyes sustantivas para el ejercicio de la acción tendiente al reconocimiento del derecho cuya ejecución se pretende, y dicho plazo es de prescripción para todos los efectos (art. 274). Tratándose de acciones que emanan de las leyes sociales, ese plazo es de tres (3) años contados desde que la obligación se hizo exigible (art. 317). Las medidas cautelares pueden solicitarse desde la presentación de la demanda ejecutiva (art. 271).' },
    requiredSections: [
      { n: 1, name: 'Identificación del ejecutante y del ejecutado', mandatory: true, basis: null },
      { n: 2, name: 'Título ejecutivo laboral: obligación clara, expresa y exigible', mandatory: true, basis: 'Art. 265' },
      { n: 3, name: 'Pretensión ejecutiva: capital, intereses y costas', mandatory: true, basis: null },
      { n: 4, name: 'Solicitud de librar mandamiento de pago', mandatory: true, basis: null },
      { n: 5, name: 'Solicitud de medidas cautelares', mandatory: false, basis: 'Art. 315' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/formulacion-de-la-excepcion-de-prescripcion-trienal',
    exactName: 'Formulación de la excepción de prescripción trienal',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 317',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Las acciones que emanan de las leyes sociales prescriben en tres (3) años, contados desde que la respectiva obligación se hizo exigible, salvo las prescripciones especiales del código (art. 317).' },
    requiredSections: [
      { n: 1, name: 'Identificación de las pretensiones alcanzadas por la prescripción', mandatory: true, basis: 'Art. 317' },
      { n: 2, name: 'Fecha en que cada obligación se hizo exigible', mandatory: true, basis: 'Art. 317' },
      { n: 3, name: 'Cómputo del trienio', mandatory: true, basis: 'Art. 317' },
      { n: 4, name: 'Pronunciamiento sobre actos interruptivos o suspensivos alegados', mandatory: true, basis: 'Arts. 318 a 323' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/317.htm'
  },
  {
    id: 'laboral/solicitud-de-medidas-cautelares-en-proceso-laboral',
    exactName: 'Solicitud de medidas cautelares en proceso laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 291 y 315',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'En los procesos declarativos —ordinarios y especiales de fuero— pueden solicitarse desde la presentación de la demanda, por escrito motivado y con las pruebas respectivas (arts. 315 y 316). La medida se decreta mediante auto dentro de los cinco (5) días siguientes a la radicación de la solicitud, previa caución de hasta el diez por ciento (10%) del valor de las pretensiones estimadas (art. 316). Proferida sentencia de primera instancia favorable al demandante, a petición de este el juez ordena el embargo y secuestro de los bienes dentro de los treinta (30) días siguientes a la petición (art. 315 num. 1). Contra la providencia que resuelva sobre medidas cautelares procede apelación en el efecto devolutivo (arts. 316 y 228 num. 9).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida solicitada', mandatory: true, basis: 'Art. 315' },
      { n: 2, name: 'Justificación de su necesidad', mandatory: true, basis: 'Art. 315' },
      { n: 3, name: 'Identificación de los bienes sobre los que recae', mandatory: true, basis: 'Art. 315' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/solicitud-de-nulidad-procesal-laboral',
    exactName: 'Solicitud de nulidad procesal laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 93',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Puede alegarse en cualquier instancia antes de la sentencia, o con posterioridad si ocurre en ella; también como excepción durante la ejecución de sentencias (art. 93).' },
    requiredSections: [
      { n: 1, name: 'Causal de nulidad invocada', mandatory: true, basis: 'Art. 93' },
      { n: 2, name: 'Hechos en que se fundamenta', mandatory: true, basis: 'Art. 93' },
      { n: 3, name: 'Pruebas que se pretende hacer valer', mandatory: true, basis: 'Art. 93' },
      { n: 4, name: 'Petición de invalidez de lo actuado', mandatory: true, basis: 'Art. 93' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/93.htm'
  },
  {
    id: 'laboral/solicitud-de-acumulacion-de-pretensiones-laborales',
    exactName: 'Solicitud de acumulación de pretensiones laborales',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 62',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: el art. 62 no fija plazo autónomo. La acumulación se formula en la misma demanda ("El demandante podrá acumular en una misma demanda varias pretensiones contra el demandado, aunque no sean conexas"), siempre que el juez sea competente para todas sin atender la cuantía, que no se excluyan entre sí salvo que se propongan como principales y subsidiarias, y que todas puedan tramitarse por el mismo procedimiento. Cuando la acumulación no cumpla los demás requisitos pero sí los tres numerales del inciso primero, el defecto se considera subsanado si no se propone oportunamente la respectiva excepción previa (art. 62, inc. final), oportunidad que es la del traslado de la demanda (art. 74).' },
    requiredSections: [
      { n: 1, name: 'Enunciación de las pretensiones que se acumulan', mandatory: true, basis: 'Art. 62' },
      { n: 2, name: 'Acreditación de competencia del juez para todas ellas', mandatory: true, basis: 'Art. 62' },
      { n: 3, name: 'Acreditación de compatibilidad y de identidad de procedimiento', mandatory: true, basis: 'Art. 62' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/demanda-de-reconocimiento-de-pension-ante-la-jurisdiccion-laboral',
    exactName: 'Demanda de reconocimiento de pensión ante la jurisdicción laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 65 y 66; Ley 100 de 1993',
    competentAuthority: 'Juez laboral del circuito',
    term: { status: 'NO_CADUCA', description: 'No opera caducidad: la Ley 2452 de 2025 no fija plazo de caducidad para demandar el reconocimiento de una prestación pensional ante la jurisdicción laboral; el art. 66 num. 7 solo contempla la caducidad como causal de inadmisión cuando una ley especial la haya establecido. El límite temporal es la prescripción trienal del art. 317: las acciones que emanan de las leyes sociales prescriben en tres (3) años desde que la respectiva obligación se hizo exigible, salvo las prescripciones especiales del código. La presentación de la demanda interrumpe el término de prescripción (art. 318), y también lo interrumpe el simple reclamo escrito del acreedor (art. 319).' },
    requiredSections: [
      { n: 1, name: 'Identificación del afiliado y de la administradora demandada', mandatory: true, basis: null },
      { n: 2, name: 'Historia laboral y semanas cotizadas', mandatory: true, basis: null },
      { n: 3, name: 'Acto de negación de la prestación y su fecha', mandatory: true, basis: null },
      { n: 4, name: 'Régimen pensional aplicable y su fundamento', mandatory: true, basis: null },
      { n: 5, name: 'Pretensiones: reconocimiento, retroactivo e intereses moratorios', mandatory: true, basis: null },
      { n: 6, name: 'Petición de pruebas', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/auto-admisorio-de-la-demanda-laboral',
    exactName: 'Auto admisorio de la demanda laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 66 y 255',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Admitida la demanda, se corre traslado al demandado por término común de diez (10) días (art. 255).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los requisitos legales de la demanda', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Integración de la litis con quienes se advierta necesario', mandatory: true, basis: 'Art. 255' },
      { n: 3, name: 'Orden de traslado con indicación del término', mandatory: true, basis: 'Art. 255' },
      { n: 4, name: 'Orden de notificación por mensaje de datos al canal digital informado', mandatory: true, basis: 'Art. 255' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/255.htm'
  },
  {
    id: 'laboral/auto-inadmisorio-de-la-demanda-laboral',
    exactName: 'Auto inadmisorio de la demanda laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, art. 66',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Se concede al demandante un término de cinco (5) días para subsanar, so pena de rechazo (art. 66).' },
    requiredSections: [
      { n: 1, name: 'Relación precisa y clara de los defectos de que adolece la demanda', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Concesión del término de cinco (5) días para subsanar', mandatory: true, basis: 'Art. 66' },
      { n: 3, name: 'Advertencia de rechazo si no se subsana', mandatory: true, basis: 'Art. 66' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/66.htm'
  },
  {
    id: 'laboral/auto-de-rechazo-in-limine-de-la-demanda-laboral',
    exactName: 'Auto de rechazo in limine de la demanda laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, art. 66',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El art. 66 no fija término al juez para proferirlo: dispone que "el juez rechazará in limine o de plano la demanda, cuando carezca de jurisdicción o de competencia; en el mismo auto dispondrá la remisión al que considere competente". El término relevante es el de impugnación: el auto que rechaza la demanda es apelable (art. 228 num. 1) y el recurso se interpone y sustenta por escrito dentro de los tres (3) días siguientes cuando la providencia se notifica fuera de audiencia, u oralmente en la audiencia en que se profiera (art. 230). El rechazo por no subsanación opera vencidos los cinco (5) días concedidos en el auto inadmisorio (art. 66, inc. 2).' },
    requiredSections: [
      { n: 1, name: 'Motivo del rechazo: falta de jurisdicción o de competencia', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Orden de remisión al juez competente cuando proceda', mandatory: true, basis: 'Art. 66' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/auto-que-resuelve-excepciones-previas-laborales',
    exactName: 'Auto que resuelve excepciones previas laborales',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, art. 74',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Del escrito que contiene las excepciones previas se corre traslado al demandante por tres (3) días (art. 74).' },
    requiredSections: [
      { n: 1, name: 'Identificación de cada excepción propuesta', mandatory: true, basis: 'Art. 74' },
      { n: 2, name: 'Análisis probatorio de los hechos que las fundan', mandatory: true, basis: 'Art. 74' },
      { n: 3, name: 'Decisión sobre cada excepción y sus efectos', mandatory: true, basis: 'Art. 74' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/74.htm'
  },
  {
    id: 'laboral/auto-que-concede-el-recurso-de-apelacion-laboral',
    exactName: 'Auto que concede el recurso de apelación laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 229 y 230',
    competentAuthority: 'El juez que profirió la providencia apelada',
    term: { status: 'VERIFICADO', description: 'El juez decide sobre la concesión dentro de los tres (3) días siguientes; el secretario remite el expediente al superior dentro de los cinco (5) días contados desde la ejecutoria del auto que lo concede (art. 230).' },
    requiredSections: [
      { n: 1, name: 'Verificación de la oportunidad y sustentación del recurso', mandatory: true, basis: 'Art. 230' },
      { n: 2, name: 'Determinación del efecto: suspensivo para sentencias, devolutivo para autos', mandatory: true, basis: 'Art. 229' },
      { n: 3, name: 'Orden de remisión al superior', mandatory: true, basis: 'Art. 230' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/229.htm'
  },
  {
    id: 'laboral/sentencia-laboral-de-primera-instancia',
    exactName: 'Sentencia laboral de primera instancia',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 65 y siguientes',
    competentAuthority: 'Juez laboral del circuito o juez municipal de pequeñas causas laborales',
    term: { status: 'VERIFICADO', description: 'Se profiere oralmente en la audiencia de trámite y juzgamiento, cerrado el debate probatorio y oídas las alegaciones, aunque las partes o sus apoderados no hayan asistido o se hubieren retirado; el juez puede decretar un receso de hasta una (1) hora para proferir la decisión oral (art. 259). Excepcionalmente, cuando no disponga de medios electrónicos de registro o la complejidad del caso lo amerite, el juez puede abstenerse de dictarla oralmente: anuncia el sentido del fallo con una breve exposición de sus fundamentos y emite la decisión escrita dentro de los diez (10) días siguientes (art. 259, inc. 5). En procesos ordinarios las audiencias son dos y en ningún caso pueden celebrarse más de dos (arts. 124 y 125). El juez debe dictar sentencia anticipada, total o parcial, en los casos del art. 260.' },
    requiredSections: [
      { n: 1, name: 'Síntesis de la demanda y de su contestación', mandatory: true, basis: null },
      { n: 2, name: 'Motivación: examen crítico de las pruebas', mandatory: true, basis: null },
      { n: 3, name: 'Decisión expresa sobre cada pretensión', mandatory: true, basis: null },
      { n: 4, name: 'Resolución sobre las excepciones propuestas, incluida la prescripción', mandatory: true, basis: 'Art. 317' },
      { n: 5, name: 'Condena en costas', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/sentencia-laboral-de-segunda-instancia',
    exactName: 'Sentencia laboral de segunda instancia',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 228 a 231',
    competentAuthority: 'Sala laboral del tribunal superior del distrito judicial',
    term: { status: 'VERIFICADO', description: 'Recibido el proceso, si no se requiere decreto y práctica de pruebas se corre traslado de cinco (5) días a las partes para alegar de conclusión, vencido el cual se dicta sentencia por escrito; si hay pruebas que practicar, se fija fecha, se reciben en la misma audiencia los alegatos de conclusión y luego se dicta por escrito la sentencia (art. 261 nums. 1 y 2). Cuando se trate de la apelación de un auto, el recurso se resuelve por escrito dentro de los cinco (5) días siguientes (art. 261 num. 3). El art. 261 no fija término al tribunal para proferir la sentencia de segunda instancia; el único plazo que allí se establece es el traslado de cinco (5) días para alegar. La decisión se limita a los puntos concretos planteados por el recurrente, salvo derechos mínimos irrenunciables (art. 228).' },
    requiredSections: [
      { n: 1, name: 'Delimitación a los reparos formulados por el apelante', mandatory: true, basis: 'Art. 230' },
      { n: 2, name: 'Síntesis del proceso y de la sentencia apelada', mandatory: true, basis: null },
      { n: 3, name: 'Motivación sobre cada reparo', mandatory: true, basis: 'Art. 230' },
      { n: 4, name: 'Decisión: confirma, revoca o modifica', mandatory: true, basis: null },
      { n: 5, name: 'Condena en costas de la instancia', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/sentencia-de-fuero-sindical',
    exactName: 'Sentencia de fuero sindical',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 292 a 299',
    competentAuthority: 'Juez laboral del circuito',
    term: { status: 'VERIFICADO', description: 'Si no es posible dictar sentencia inmediatamente, se cita a nueva audiencia dentro de los dos (2) días siguientes (art. 294).' },
    requiredSections: [
      { n: 1, name: 'Verificación de la condición de aforado', mandatory: true, basis: 'Art. 293' },
      { n: 2, name: 'Verificación de la vinculación del sindicato al proceso', mandatory: true, basis: 'Art. 299' },
      { n: 3, name: 'Análisis de la justa causa invocada, cuando se pide levantamiento', mandatory: true, basis: 'Art. 292' },
      { n: 4, name: 'Decisión: autoriza, niega, o dispone el reintegro con salarios dejados de percibir', mandatory: true, basis: 'Arts. 292 y 293' }
    ],
    sourceUrl: 'https://leyes.co/codigo_procesal_del_trabajo_y_de_la_seguridad_social/294.htm'
  },
  {
    id: 'laboral/mandamiento-de-pago-laboral',
    exactName: 'Mandamiento de pago laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 265 y siguientes',
    competentAuthority: 'El juez de la ejecución',
    term: { status: 'VERIFICADO', description: 'El juez ordena el pago de cantidades líquidas de dinero con sus intereses comerciales en el término de cinco (5) días contados a partir de la ejecutoria de la decisión, plazo dentro del cual el demandado debe cumplir la obligación o formular las excepciones que considere pertinentes (art. 273, inc. 1). El ejecutado puede proponer excepciones dentro de los cinco (5) días siguientes a la notificación del mandamiento ejecutivo, y vencido ese término se señala audiencia para resolverlas dentro de los cinco (5) días siguientes (art. 275 num. 1). Las cuestiones sobre requisitos formales del título, las excepciones previas y el beneficio de excusión solo pueden alegarse por reposición; de prosperar, el ejecutante tiene cinco (5) días para subsanar o aportar los documentos omitidos, so pena de revocatoria de la orden de pago (art. 273, inc. 4). El auto que niegue total o parcialmente el mandamiento de pago es apelable (art. 228 num. 7).' },
    requiredSections: [
      { n: 1, name: 'Verificación de que el título presta mérito ejecutivo', mandatory: true, basis: 'Art. 265' },
      { n: 2, name: 'Orden de pago con determinación de capital e intereses', mandatory: true, basis: null },
      { n: 3, name: 'Advertencia del término para proponer excepciones', mandatory: true, basis: null },
      { n: 4, name: 'Pronunciamiento sobre las medidas cautelares solicitadas', mandatory: false, basis: 'Art. 315' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  },
  {
    id: 'laboral/auto-que-declara-la-nulidad-procesal-laboral',
    exactName: 'Auto que declara la nulidad procesal laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, art. 93',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'El art. 93 no fija término al juez para proferirlo: dispone que "el juez resolverá la solicitud de nulidad previo traslado, decreto y práctica de las pruebas que fueren necesarias". La oportunidad para alegar la nulidad es en cualquiera de las instancias antes de que se dicte sentencia, o con posterioridad a esta si ocurriere en ella; la nulidad por indebida representación, falta de notificación o emplazamiento en legal forma, o la originada en sentencia contra la cual no proceda recurso, puede además alegarse como excepción en la ejecución de la sentencia, en la diligencia de entrega o incluso con posterioridad a la orden de seguir adelante con la ejecución, mientras el proceso no haya terminado por pago total o por otra causa legal (art. 93). El auto que decida o rechace una nulidad procesal es apelable (art. 228 num. 5), dentro de los tres (3) días siguientes si se notifica fuera de audiencia (art. 230).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la causal configurada', mandatory: true, basis: 'Art. 93' },
      { n: 2, name: 'Determinación de la actuación afectada y de la que conserva validez', mandatory: true, basis: 'Art. 93' },
      { n: 3, name: 'Orden de rehacer la actuación anulada', mandatory: true, basis: 'Art. 93' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=259639'
  }
  ]
};
