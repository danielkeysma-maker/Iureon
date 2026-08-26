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
    term: { status: 'VERIFICADO', description: 'Cinco (5) días para subsanar los defectos relacionados por el juez, so pena de rechazo (art. 66). Añadir: el auto que inadmite NO admite recurso alguno (art. 66), de modo que subsanar dentro de los cinco (5) días es la única vía y no hay reposición que suspenda ese plazo. Si el demandante no subsana en tiempo, la demanda se rechaza; el auto de rechazo SÍ es apelable (art. 228, num. 1) y esa apelación se rige por el art. 230: oralmente en la audiencia en que se profiera, o por escrito dentro de los tres (3) días siguientes si se notifica fuera de audiencia, término dentro del cual además debe sustentarse. Los cinco (5) días de subsanación y los tres (3) días de apelación del rechazo son relojes del cliente; el código no fija plazo al juez para resolver sobre la subsanación.' },
    requiredSections: [
      { n: 1, name: 'Referencia al auto inadmisorio y a cada defecto relacionado', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Corrección puntual de cada defecto', mandatory: true, basis: 'Art. 66' },
      { n: 3, name: 'Anexos legales que se echaron de menos', mandatory: true, basis: 'Art. 66' },
      { n: 4, name: 'Solicitud de admisión de la demanda subsanada', mandatory: true, basis: 'Art. 66' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr001.html#66'
  },
  {
    id: 'laboral/contestacion-de-la-demanda-laboral',
    exactName: 'Contestación de la demanda laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 69 y 255',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Diez (10) días de traslado común para contestar, so pena de nulidad (art. 255). El plazo NO se cuenta «desde la notificación del auto admisorio»: el art. 255 dispone que el traslado se entiende surtido con el envío del auto admisorio como mensaje de datos a la dirección electrónica o canal digital suministrado, junto con la copia de la demanda y sus anexos. Ese envío es el hito de conteo y es reloj del cliente. Añadir el segundo plazo del cliente: si la contestación no reúne los requisitos del art. 69 o le faltan los anexos distintos de las pruebas, el juez señala los defectos y concede cinco (5) días para subsanarla; si no se subsana, la demanda se tiene por NO contestada, con la consecuencia del num. 3 del art. 69 (los hechos sobre los que no hubo pronunciamiento concreto se tienen por probados, salvo que requieran prueba solemne). Añadir también que la falta de contestación produce ese mismo efecto (art. 69, par. 2).' },
    requiredSections: [
      { n: 1, name: 'Nombre del demandado, domicilio, dirección física, correo electrónico y canal digital', mandatory: true, basis: 'Art. 69 num. 1' },
      { n: 2, name: 'Pronunciamiento expreso sobre cada pretensión', mandatory: true, basis: 'Art. 69 num. 2' },
      { n: 3, name: 'Pronunciamiento sobre los hechos: cuáles se admiten, cuáles se niegan y cuáles no constan, con su explicación', mandatory: true, basis: 'Art. 69 num. 3' },
      { n: 4, name: 'Hechos, fundamentos y razones de derecho de la defensa', mandatory: true, basis: 'Art. 69 num. 4' },
      { n: 5, name: 'Solicitud de pruebas, específica y detallada', mandatory: true, basis: 'Art. 69 num. 5' },
      { n: 6, name: 'Excepciones que se pretenda hacer valer, debidamente fundamentadas', mandatory: true, basis: 'Art. 69 num. 6' },
      { n: 7, name: 'Anexos: poder, documentos probatorios y prueba de existencia legal si es persona jurídica', mandatory: true, basis: 'Art. 69' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr006.html#255'
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
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr001.html#74'
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
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr005.html#227'
  },
  {
    id: 'laboral/recurso-de-apelacion-laboral',
    exactName: 'Recurso de apelación laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 228 a 230',
    competentAuthority: 'Se interpone ante el juez que profirió la providencia; lo resuelve la sala laboral del tribunal superior',
    term: { status: 'VERIFICADO', description: 'Oralmente en la audiencia en que se profiera la providencia, o por escrito dentro de los tres (3) días siguientes cuando se notifique fuera de audiencia. Tratándose de sentencia, la sustentación se presenta por escrito dentro de los cinco (5) días siguientes (art. 230). Añadir dos cargas del cliente que la ficha omite. Primera: la sustentación debe expresar las razones jurídicas y fácticas de la inconformidad; si no se sustenta, o se sustenta fuera de término, el juez de primera instancia declara DESIERTO el recurso (art. 230, par. 2) — no basta con interponerlo en tiempo. Segunda: quien no apeló puede ADHERIR a la apelación del contrario en lo que la providencia le sea desfavorable, y debe presentarla y sustentarla ante el juez que profirió la providencia dentro del término que este tiene para resolver sobre la concesión, esto es, los tres (3) días siguientes al vencimiento del traslado a los no recurrentes (art. 230, par. 1 y art. 230 inc. final); la adhesión queda sin efecto si el apelante principal desiste. Añadir también que, una vez sustentado el recurso, se corre traslado por secretaría a las partes no recurrentes por el mismo término.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la providencia apelada', mandatory: true, basis: 'Art. 230' },
      { n: 2, name: 'Manifestación expresa de interponer la apelación', mandatory: true, basis: 'Art. 230' },
      { n: 3, name: 'Sustentación: reparos concretos contra la providencia', mandatory: true, basis: 'Art. 230' },
      { n: 4, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 230' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr005.html#230'
  },
  {
    id: 'laboral/recurso-de-queja-laboral',
    exactName: 'Recurso de queja laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, art. 232',
    competentAuthority: 'El superior funcional de quien denegó el recurso o lo concedió en el efecto que no correspondía: la sala laboral del tribunal superior cuando se denegó la apelación, y la Sala de Casación Laboral de la Corte Suprema de Justicia cuando se denegó la casación o la anulación (art. 232).',
    term: { status: 'VERIFICADO', description: 'Debe interponerse y sustentarse en el acto cuando el auto que niega la apelación se profiera en audiencia; si se profiere fuera de audiencia, dentro de los tres (3) días siguientes (art. 232). Añadir el ámbito ampliado del recurso, que el nuevo código extiende frente al código de 1948: la queja procede no solo cuando se deniega la apelación o se concede en el efecto que no corresponde, sino también cuando se DENIEGA EL RECURSO DE CASACIÓN Y EL DE ANULACIÓN (art. 232). Añadir además el traslado a la contraparte: interpuesta la queja, el escrito permanece en secretaría por tres (3) días a disposición de la otra parte para que manifieste lo que estime oportuno, y surtido ese traslado se decide el recurso; esos tres (3) días son el reloj de la contraparte, distinto de los tres (3) días de interposición que corren para el recurrente.' },
    requiredSections: [
      { n: 1, name: 'Identificación del auto que denegó o concedió indebidamente la apelación', mandatory: true, basis: 'Art. 232' },
      { n: 2, name: 'Razones por las cuales el recurso denegado era procedente', mandatory: true, basis: 'Art. 232' },
      { n: 3, name: 'Sustentación en el acto o dentro del término, según corresponda', mandatory: true, basis: 'Art. 232' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr005.html#232'
  },
  {
    id: 'laboral/interposicion-del-recurso-de-casacion-laboral',
    exactName: 'Interposición del recurso de casación laboral',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 239 y 243',
    competentAuthority: 'Se interpone ante el tribunal; lo resuelve la Sala de Casación Laboral de la Corte Suprema de Justicia',
    term: { status: 'VERIFICADO', description: 'Cinco (5) días siguientes a la notificación de la sentencia de segunda instancia (art. 243). Añadir el segundo plazo del cliente, que es el que le cuesta el recurso: concedido el recurso en el efecto devolutivo, el tribunal corre traslado por VEINTE (20) DÍAS para presentar la demanda de casación; si no se sustenta oportunamente, el tribunal lo DECLARA DESIERTO y devuelve la actuación al juzgado de origen (art. 243). Añadir el requisito de procedencia del art. 239: solo son susceptibles de casación las sentencias de segunda instancia de los tribunales en procesos declarativos —ordinarios y especiales— cuando el valor actual de la decisión desfavorable al recurrente exceda de ciento cincuenta (150) SMLMV; por debajo de ese interés la vía es la selección de la sentencia (art. 240), que no está en manos de la parte. Añadir, como carga eventual del cliente, que si al interponer el recurso pide la suspensión del cumplimiento de la sentencia debe ofrecer caución y constituirla dentro de los diez (10) días siguientes a la notificación del auto que la fija, so pena de que la sentencia recurrida pueda ejecutarse.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia de segunda instancia recurrida', mandatory: true, basis: 'Art. 243' },
      { n: 2, name: 'Manifestación de interponer el recurso de casación', mandatory: true, basis: 'Art. 243' },
      { n: 3, name: 'Acreditación de que la sentencia es susceptible del recurso', mandatory: true, basis: 'Art. 239' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr006.html#243'
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
    competentAuthority: 'La solicitud de selección la eleva el tribunal superior que profirió la sentencia de segunda instancia, de oficio; la decide la Sala de Casación Laboral de la Corte Suprema de Justicia por mayoría de sus integrantes, que además puede seleccionar de oficio (art. 239, inc. 3, y art. 240). La parte no es titular de la solicitud.',
    term: { status: 'VERIFICADO', description: 'Los quince (15) días NO son un plazo de la parte. El art. 240 los pone en cabeza del TRIBUNAL SUPERIOR, único legitimado para elevar la solicitud: dentro de los quince (15) días siguientes a la ejecutoria de la sentencia de segunda instancia el tribunal eleva la solicitud motivada a la Sala de Casación Laboral, previa comunicación a las partes para que se pronuncien. La SALA DE CASACIÓN LABORAL debe aprobarla por mayoría de sus integrantes en un término de veinte (20) días, y contra esa decisión no procede recurso alguno. La parte no tiene término propio de solicitud: su única carga es pronunciarse cuando el tribunal le comunique la solicitud, y esa es la oportunidad que el abogado debe vigilar. El art. 239, inciso 3, admite además la selección OFICIOSA por la propia Sala de Casación Laboral, caso en el cual tampoco media solicitud de parte.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sentencia de segunda instancia', mandatory: true, basis: 'Art. 240' },
      { n: 2, name: 'Criterio de selección que se invoca', mandatory: true, basis: 'Art. 240' },
      { n: 3, name: 'Razones que justifican la selección', mandatory: true, basis: 'Art. 240' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr006.html#240'
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
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr006.html#236'
  },
  {
    id: 'laboral/demanda-de-reintegro-por-fuero-sindical',
    exactName: 'Demanda de reintegro por fuero sindical',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 293, 294 y 298',
    competentAuthority: 'Juez laboral del circuito',
    term: { status: 'VERIFICADO', description: 'Plazo del cliente, que extingue la acción: UN (1) AÑO para que el trabajador aforado demande el amparo del fuero sindical, contado desde la fecha del despido, el traslado o la desmejora (art. 298). Durante el trámite de la reclamación previa de empleados públicos y trabajadores oficiales se suspende el término prescriptivo; culminado ese trámite —o presentada la reclamación escrita, tratándose de trabajadores particulares— el año «comenzará a contarse nuevamente». Plazos del despacho y de la contraparte, ya admitida la demanda (art. 294): traslado común de cinco (5) días para contestar por escrito; la demanda puede reformarse por una sola vez hasta dentro de los tres (3) días siguientes al vencimiento de ese traslado, con igual término para contestar la reforma; y la audiencia pública debe celebrarse a más tardar dentro de los diez (10) días siguientes al vencimiento del término para contestar. Añadir la carga probatoria de admisibilidad: el fuero se acredita con copia del certificado de inscripción de la junta directiva o comité ejecutivo, o con copia de la comunicación al empleador (art. 293). Añadir también que el auto admisorio debe notificarse personalmente a la organización sindical de la cual hace parte el aforado (art. 294) y que no tiene efecto alguno la conciliación celebrada sin anuencia del sindicato (art. 294, par.).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de la condición de aforado del trabajador', mandatory: true, basis: 'Art. 293' },
      { n: 2, name: 'Hechos del despido, traslado o desmejora sin autorización judicial', mandatory: true, basis: 'Art. 293' },
      { n: 3, name: 'Pretensión de reintegro y pago de salarios dejados de percibir', mandatory: true, basis: 'Art. 293' },
      { n: 4, name: 'Vinculación del sindicato al proceso', mandatory: true, basis: 'Art. 299' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 293' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr007.html#298'
  },
  {
    id: 'laboral/demanda-de-levantamiento-de-fuero-sindical',
    exactName: 'Demanda de levantamiento de fuero sindical',
    branch: 'LABORAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2452 de 2025, arts. 292, 294 y 298',
    competentAuthority: 'Juez laboral del circuito',
    term: { status: 'VERIFICADO', description: 'Plazo del cliente, que extingue la acción: UN (1) AÑO (art. 298) para que el empleador promueva el permiso judicial para despedir, trasladar o desmejorar al trabajador aforado, contado desde la fecha en que tuvo conocimiento del hecho que se invoca como justa causa, o desde que se agotó el procedimiento convencional o reglamentario correspondiente, según el caso. La demanda «deberá expresar la justa causa invocada» (art. 292). Plazos del despacho y de la contraparte (art. 294): traslado común de cinco (5) días para contestar por escrito; reforma por una sola vez hasta dentro de los tres (3) días siguientes al vencimiento del traslado, con igual término para contestarla; audiencia pública a más tardar dentro de los diez (10) días siguientes al vencimiento del término para contestar. Añadir que el auto admisorio debe notificarse personalmente a la organización sindical de la cual hace parte el aforado, que puede coadyuvarlo y ejercer los actos procesales permitidos al trabajador (arts. 294 y 299), y que no produce efecto la conciliación celebrada sin anuencia del sindicato (art. 294, par.).' },
    requiredSections: [
      { n: 1, name: 'Identificación del trabajador aforado y de su condición', mandatory: true, basis: 'Art. 292' },
      { n: 2, name: 'Justa causa que se invoca para el despido, traslado o desmejora', mandatory: true, basis: 'Art. 292' },
      { n: 3, name: 'Pretensión de autorización judicial', mandatory: true, basis: 'Art. 292' },
      { n: 4, name: 'Vinculación del sindicato', mandatory: true, basis: 'Art. 299' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 292' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr007.html#298'
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
    term: { status: 'VERIFICADO', description: 'Las acciones que emanan de las leyes sociales prescriben en tres (3) años, contados desde que la respectiva obligación se hizo exigible, salvo las prescripciones especiales del código (art. 317). Añadir cuál es la prescripción especial que desplaza a la trienal, porque el art. 317 la anuncia sin nombrarla: en los procesos de fuero sindical el término es de UN (1) AÑO (art. 298), contado para el trabajador desde el despido, traslado o desmejora, y para el empleador desde que conoció el hecho invocado como justa causa o desde que se agotó el procedimiento convencional o reglamentario. Aplicar los tres (3) años del art. 317 a un asunto de fuero sindical hace perder la acción. Añadir también la causal del art. 318 que impide contar la interrupción: cuando el proceso termine por nulidad que comprenda la notificación del auto admisorio y la causa sea atribuible al demandante, y que en el auto que declare la nulidad se indicará expresamente su efecto sobre la interrupción o no de la prescripción.' },
    requiredSections: [
      { n: 1, name: 'Identificación de las pretensiones alcanzadas por la prescripción', mandatory: true, basis: 'Art. 317' },
      { n: 2, name: 'Fecha en que cada obligación se hizo exigible', mandatory: true, basis: 'Art. 317' },
      { n: 3, name: 'Cómputo del trienio', mandatory: true, basis: 'Art. 317' },
      { n: 4, name: 'Pronunciamiento sobre actos interruptivos o suspensivos alegados', mandatory: true, basis: 'Arts. 318 a 323' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr008.html#317'
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
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr002.html#93'
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
    term: { status: 'VERIFICADO', description: 'Admitida la demanda, se corre traslado al demandado por término común de diez (10) días (art. 255). Añadir la carga que el auto admisorio impone al demandado y que corre dentro del mismo traslado de diez (10) días: el juez le ordena aportar, DURANTE el traslado, los documentos que estén en su poder y hayan sido solicitados por el actor, cuando los considere pertinentes y conducentes (art. 66); si se trata de las pruebas extraprocesales en su poder y de los registros que por ley o reglamento esté obligado a llevar el empleador, no aportarlos hace que se tengan por ciertos los hechos que con ellos pretendía probar el demandante (art. 69, par. 1, num. 3). Añadir que el traslado se entiende surtido con el envío del auto admisorio como mensaje de datos junto con la copia de la demanda y sus anexos, y que omitir el traslado al Agente del Ministerio Público o a la Agencia Nacional de Defensa Jurídica del Estado, cuando proceda, está sancionado con nulidad (art. 255).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los requisitos legales de la demanda', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Integración de la litis con quienes se advierta necesario', mandatory: true, basis: 'Art. 255' },
      { n: 3, name: 'Orden de traslado con indicación del término', mandatory: true, basis: 'Art. 255' },
      { n: 4, name: 'Orden de notificación por mensaje de datos al canal digital informado', mandatory: true, basis: 'Art. 255' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr006.html#255'
  },
  {
    id: 'laboral/auto-inadmisorio-de-la-demanda-laboral',
    exactName: 'Auto inadmisorio de la demanda laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, art. 66',
    competentAuthority: 'El juez que conoce del proceso',
    term: { status: 'VERIFICADO', description: 'Se concede al demandante un término de cinco (5) días para subsanar, so pena de rechazo (art. 66). Añadir que el auto que inadmite no es susceptible de recurso alguno (art. 66): dentro de los cinco (5) días solo cabe subsanar. Añadir que las causales de inadmisión son taxativas y son siete, entre ellas no indicar el canal digital o la dirección física de notificación —salvo que el demandante manifieste no tenerlos o desconocerlos— y haberse cumplido el término de caducidad para iniciar la acción. Añadir que el rechazo in limine procede por falta de jurisdicción o de competencia, caso en el cual el mismo auto ordena la remisión al juez que se considere competente. Añadir, como salida cuando se pierde el plazo, que el auto de rechazo sí es apelable (art. 228, num. 1) conforme al art. 230: oralmente en la audiencia, o por escrito dentro de los tres (3) días siguientes si se notifica fuera de audiencia, con sustentación dentro del mismo término.' },
    requiredSections: [
      { n: 1, name: 'Relación precisa y clara de los defectos de que adolece la demanda', mandatory: true, basis: 'Art. 66' },
      { n: 2, name: 'Concesión del término de cinco (5) días para subsanar', mandatory: true, basis: 'Art. 66' },
      { n: 3, name: 'Advertencia de rechazo si no se subsana', mandatory: true, basis: 'Art. 66' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr001.html#66'
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
    term: { status: 'VERIFICADO', description: 'Del escrito que contiene las excepciones previas se corre traslado al demandante por tres (3) días (art. 74). Añadir de quién es cada reloj y cuál es el recurso. Los tres (3) días son del DEMANDANTE, para pronunciarse sobre las excepciones y, si es del caso, subsanar los defectos anotados. El juez no tiene plazo en días: decide antes de la audiencia inicial las que no requieran pruebas, y resuelve en la audiencia concentrada aquellas que sí las requieran. El auto que decide sobre las excepciones previas ES APELABLE, salvo cuando declare la falta de jurisdicción y competencia (art. 228, num. 13), y esa apelación se rige por el art. 230: oralmente en la audiencia en que se profiera, con sustentación en la misma audiencia por tratarse de auto, o por escrito dentro de los tres (3) días siguientes si se notifica fuera de audiencia. Añadir los efectos: si prospera la de falta de jurisdicción o competencia se remite el expediente al juez que corresponda y lo actuado conserva validez; si prospera la de compromiso o cláusula compromisoria se termina el proceso y se devuelve la demanda; si prospera la de trámite inadecuado, el juez ordena darle el que legalmente corresponda.' },
    requiredSections: [
      { n: 1, name: 'Identificación de cada excepción propuesta', mandatory: true, basis: 'Art. 74' },
      { n: 2, name: 'Análisis probatorio de los hechos que las fundan', mandatory: true, basis: 'Art. 74' },
      { n: 3, name: 'Decisión sobre cada excepción y sus efectos', mandatory: true, basis: 'Art. 74' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr001.html#74'
  },
  {
    id: 'laboral/auto-que-concede-el-recurso-de-apelacion-laboral',
    exactName: 'Auto que concede el recurso de apelación laboral',
    branch: 'LABORAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 2452 de 2025, arts. 229 y 230',
    competentAuthority: 'El juez que profirió la providencia apelada',
    term: { status: 'VERIFICADO', description: 'Ambos plazos son del despacho, no del cliente. Los tres (3) días para decidir sobre la concesión del recurso y su efecto NO corren desde la interposición: corren desde el VENCIMIENTO DEL TRASLADO a las partes no recurrentes, traslado que se surte por secretaría una vez sustentado el recurso y por el mismo término de la sustentación (conjuntamente si son varios los recurrentes). El secretario remite la actuación al superior dentro del término máximo de cinco (5) días contados a partir de la ejecutoria del auto que concede el recurso. Añadir los relojes del cliente que dependen de este auto. Primero: quien no apeló puede ADHERIR a la apelación, y debe presentarla y sustentarla ante el juez que profirió la providencia dentro del término que este tiene para resolver sobre la concesión —los tres (3) días—, adhesión que queda sin efecto si el apelante principal desiste (art. 230, par. 1). Segundo: si el juez deniega la apelación o la concede en un efecto que no corresponde, procede el recurso de QUEJA, que debe interponerse y sustentarse en el acto si el auto se profiere en audiencia, o dentro de los tres (3) días siguientes si se emite fuera de audiencia (art. 232). Añadir los efectos del art. 229: las sentencias se apelan en el efecto suspensivo y los autos en el devolutivo, salvo que la providencia impida la continuación del proceso o implique su terminación; y que el auto que concede la apelación parcial debe indicar cuáles decisiones quedan ejecutoriadas.' },
    requiredSections: [
      { n: 1, name: 'Verificación de la oportunidad y sustentación del recurso', mandatory: true, basis: 'Art. 230' },
      { n: 2, name: 'Determinación del efecto: suspensivo para sentencias, devolutivo para autos', mandatory: true, basis: 'Art. 229' },
      { n: 3, name: 'Orden de remisión al superior', mandatory: true, basis: 'Art. 230' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr005.html#230'
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
    term: { status: 'VERIFICADO', description: 'Si no es posible dictar sentencia inmediatamente, se cita a nueva audiencia dentro de los dos (2) días siguientes (art. 294). Añadir el plazo del cliente frente a la sentencia, que la ficha omite por completo: la sentencia de fuero sindical es APELABLE en el efecto suspensivo (art. 297), y la oportunidad para recurrirla se rige por el art. 230 —oralmente en la audiencia en que se profiera, con sustentación por escrito dentro de los cinco (5) días siguientes por tratarse de sentencia, o por escrito dentro de los tres (3) días siguientes si se notifica fuera de audiencia—, so pena de que el juez de primera instancia la declare desierta. Precisar que los dos (2) días para la nueva audiencia y los cinco (5) días del art. 297 son relojes del despacho: los primeros del juez que no pudo fallar de inmediato, los segundos del tribunal, que decide de plano dentro de los cinco (5) días siguientes al recibido del expediente. Añadir el contenido del fallo (art. 296): en la acción del trabajador, comprobado el despido sin sujeción a las normas del fuero, se ordena el reintegro y se condena al empleador a pagar, sin solución de continuidad, salarios, prestaciones y demás emolumentos dejados de percibir.' },
    requiredSections: [
      { n: 1, name: 'Verificación de la condición de aforado', mandatory: true, basis: 'Art. 293' },
      { n: 2, name: 'Verificación de la vinculación del sindicato al proceso', mandatory: true, basis: 'Art. 299' },
      { n: 3, name: 'Análisis de la justa causa invocada, cuando se pide levantamiento', mandatory: true, basis: 'Art. 292' },
      { n: 4, name: 'Decisión: autoriza, niega, o dispone el reintegro con salarios dejados de percibir', mandatory: true, basis: 'Arts. 292 y 293' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_2452_2025_pr007.html#297'
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
