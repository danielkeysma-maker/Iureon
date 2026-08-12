import type { BranchCatalog } from '../types';

/**
 * TRANSITO catalogue.
 *
 * Generated from research/actuaciones-transito.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const TRANSITO_CATALOG: BranchCatalog = {
  meta: {
    branch: 'TRANSITO',
    verifiedAt: '2026-08-12',
    sourceOfTruth: 'Ley 769 de 2002 (Código Nacional de Tránsito Terrestre) con sus modificaciones, entre ellas la Ley 1383 de 2010, el Decreto Ley 019 de 2012 y la Ley 2251 de 2022 (Ley Julián Esteban). Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'NO CONFUNDIR CADUCIDAD CON PRESCRIPCIÓN. Son dos términos distintos que operan en momentos distintos. La ACCIÓN por contravención CADUCA AL AÑO contado desde la ocurrencia de los hechos (art. 161): pasado ese año la autoridad ya no puede imponer la sanción. La SANCIÓN ya impuesta PRESCRIBE EN TRES AÑOS desde la ocurrencia del hecho (art. 159), término que se interrumpe con la notificación del mandamiento de pago. Alegar la figura equivocada pierde una defensa válida.',
    'SILENCIO POSITIVO EN LOS RECURSOS. El art. 161 dispone que los recursos deben decidirse dentro del año siguiente a su interposición y que, de no resolverse, se entienden fallados A FAVOR DEL RECURRENTE. Es una defensa que se pierde por no alegarla.',
    'Términos del cobro coactivo de multas de tránsito: se rigen por el procedimiento del Estatuto Tributario por remisión, y no se verificaron aquí. La rama TRIBUTARIO cubre ese procedimiento.',
    'Los organismos de tránsito municipales y departamentales expiden reglamentaciones propias sobre trámites, tarifas y patios. Este catálogo cubre la ley nacional, no esas reglamentaciones.',
    'La responsabilidad civil por accidente de tránsito se tramita ante la jurisdicción ordinaria por el proceso verbal; sus términos están en la rama CIVIL. Las lesiones y el homicidio culposo corresponden a la rama PENAL.',
    'Términos de la reclamación ante aseguradoras por el SOAT: se rigen por el Estatuto Orgánico del Sistema Financiero y no se verificaron.'
    ]
  },
  actuaciones: [
  {
    id: 'transito/comparecencia-y-descargos-ante-orden-de-comparendo',
    exactName: 'Comparecencia y descargos ante orden de comparendo',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, arts. 135 y 136',
    competentAuthority: 'Organismo de tránsito competente del lugar de la infracción',
    term: { status: 'VERIFICADO', description: 'El inculpado debe comparecer dentro de los cinco (5) días hábiles siguientes a la orden de comparendo. Si no comparece sin causa justificada, la autoridad procede a resolver después de treinta (30) días calendario de ocurrida la presunta infracción (arts. 135 y 136).' },
    requiredSections: [
      { n: 1, name: 'Identificación del inculpado, del vehículo y del comparendo impugnado', mandatory: true, basis: 'Art. 135' },
      { n: 2, name: 'Manifestación de no aceptación de la comisión de la infracción', mandatory: true, basis: 'Art. 136' },
      { n: 3, name: 'Hechos y razones de la defensa', mandatory: true, basis: 'Art. 135' },
      { n: 4, name: 'Solicitud de pruebas para que se decreten y practiquen en la audiencia', mandatory: true, basis: 'Art. 135' },
      { n: 5, name: 'Designación de apoderado, cuando se ejerza esa facultad', mandatory: false, basis: 'Art. 135' },
      { n: 6, name: 'Dirección para notificaciones', mandatory: true, basis: 'Art. 135' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/135.htm'
  },
  {
    id: 'transito/solicitud-de-reduccion-de-la-multa-de-transito',
    exactName: 'Solicitud de reducción de la multa de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 136',
    competentAuthority: 'Organismo de tránsito competente',
    term: { status: 'VERIFICADO', description: 'Cincuenta por ciento (50%) del valor de la multa si se paga dentro de los cinco (5) días siguientes, y setenta y cinco por ciento (75%) si se paga dentro de los veinte (20) días; en ambos casos es obligatorio asistir al curso sobre normas de tránsito. Vencidos esos plazos se paga el cien por ciento (100%) más intereses moratorios (art. 136).' },
    requiredSections: [
      { n: 1, name: 'Identificación del comparendo y de la infracción', mandatory: true, basis: 'Art. 136' },
      { n: 2, name: 'Aceptación expresa de la comisión de la infracción', mandatory: true, basis: 'Art. 136' },
      { n: 3, name: 'Constancia de inscripción o asistencia al curso sobre normas de tránsito', mandatory: true, basis: 'Art. 136' },
      { n: 4, name: 'Liquidación del porcentaje aplicable según la fecha de pago', mandatory: true, basis: 'Art. 136' },
      { n: 5, name: 'Advertencia: aceptar la infracción cierra la posibilidad de controvertirla', mandatory: true, basis: 'Art. 136' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/136.htm'
  },
  {
    id: 'transito/recurso-de-reposicion-contra-resolucion-de-transito',
    exactName: 'Recurso de reposición contra resolución de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 142',
    competentAuthority: 'El mismo funcionario que profirió la providencia',
    term: { status: 'VERIFICADO', description: 'Se interpone y sustenta en la propia audiencia en que se pronuncie la providencia (art. 142). La autoridad debe decidir el recurso dentro del año siguiente a su interposición; de no hacerlo, se entiende fallado a favor del recurrente (art. 161).' },
    requiredSections: [
      { n: 1, name: 'Interposición oral en la audiencia, inmediatamente después de la providencia', mandatory: true, basis: 'Art. 142' },
      { n: 2, name: 'Sustentación de las razones de inconformidad', mandatory: true, basis: 'Art. 142' },
      { n: 3, name: 'Petición de revocatoria o modificación', mandatory: true, basis: 'Art. 142' },
      { n: 4, name: 'Apelación subsidiaria, cuando la resolución ponga fin a la primera instancia', mandatory: false, basis: 'Art. 142' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/142.htm'
  },
  {
    id: 'transito/recurso-de-apelacion-en-materia-de-transito',
    exactName: 'Recurso de apelación en materia de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 142',
    competentAuthority: 'El superior del funcionario que profirió la resolución',
    term: { status: 'VERIFICADO', description: 'Procede únicamente contra las resoluciones que ponen fin a la primera instancia y se interpone oralmente en la audiencia en que se profiera la decisión (art. 142). Debe decidirse dentro del año siguiente a su interposición, so pena de entenderse fallado a favor del recurrente (art. 161).' },
    requiredSections: [
      { n: 1, name: 'Acreditación de que la resolución pone fin a la primera instancia', mandatory: true, basis: 'Art. 142' },
      { n: 2, name: 'Interposición oral en la audiencia', mandatory: true, basis: 'Art. 142' },
      { n: 3, name: 'Sustentación de los reparos', mandatory: true, basis: 'Art. 142' },
      { n: 4, name: 'Petición de revocatoria de la sanción', mandatory: true, basis: 'Art. 142' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/142.htm'
  },
  {
    id: 'transito/solicitud-de-caducidad-de-la-accion-contravencional-de-transito',
    exactName: 'Solicitud de caducidad de la acción contravencional de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 161',
    competentAuthority: 'Organismo de tránsito competente',
    term: { status: 'VERIFICADO', description: 'La acción por contravención de las normas de tránsito caduca al año (1), contado a partir de la ocurrencia de los hechos que dieron origen a ella (art. 161). Es distinta de la prescripción de la sanción del art. 159, que es de tres (3) años.' },
    requiredSections: [
      { n: 1, name: 'Identificación del comparendo y de la fecha de ocurrencia de los hechos', mandatory: true, basis: 'Art. 161' },
      { n: 2, name: 'Cómputo del año transcurrido desde esa fecha', mandatory: true, basis: 'Art. 161' },
      { n: 3, name: 'Constancia de que no se resolvió sobre la sanción dentro del término', mandatory: true, basis: 'Art. 161' },
      { n: 4, name: 'Petición de declaratoria de caducidad y archivo', mandatory: true, basis: 'Art. 161' },
      { n: 5, name: 'Advertencia: no confundir con la prescripción trienal del art. 159', mandatory: true, basis: 'Art. 159' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/161.htm'
  },
  {
    id: 'transito/solicitud-de-prescripcion-de-la-sancion-de-transito',
    exactName: 'Solicitud de prescripción de la sanción de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 159',
    competentAuthority: 'Organismo de tránsito competente',
    term: { status: 'VERIFICADO', description: 'Tres (3) años contados a partir de la ocurrencia del hecho. El término se interrumpe con la notificación del mandamiento de pago. La prescripción debe declararse de oficio y las autoridades no pueden iniciar cobro coactivo cuando ya se configuró (art. 159).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sanción y de la fecha de ocurrencia del hecho', mandatory: true, basis: 'Art. 159' },
      { n: 2, name: 'Cómputo de los tres (3) años', mandatory: true, basis: 'Art. 159' },
      { n: 3, name: 'Constancia de que no se notificó mandamiento de pago dentro del término', mandatory: true, basis: 'Art. 159' },
      { n: 4, name: 'Petición de declaratoria de prescripción y de cesación del cobro', mandatory: true, basis: 'Art. 159' },
      { n: 5, name: 'Solicitud de retiro del registro en el RUNT y en el SIMIT', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/159.htm'
  },
  {
    id: 'transito/solicitud-de-silencio-administrativo-positivo-por-recurso-no-resuelto',
    exactName: 'Solicitud de silencio administrativo positivo por recurso no resuelto',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 161',
    competentAuthority: 'Organismo de tránsito competente',
    term: { status: 'VERIFICADO', description: 'Los recursos deben decidirse dentro del año siguiente a su interposición; de no resolverse en ese tiempo, se entienden fallados a favor del recurrente (art. 161).' },
    requiredSections: [
      { n: 1, name: 'Identificación del recurso interpuesto y de su fecha', mandatory: true, basis: 'Art. 161' },
      { n: 2, name: 'Cómputo del año transcurrido sin decisión', mandatory: true, basis: 'Art. 161' },
      { n: 3, name: 'Constancia de que no se notificó decisión alguna', mandatory: true, basis: 'Art. 161' },
      { n: 4, name: 'Petición de reconocimiento del fallo favorable al recurrente', mandatory: true, basis: 'Art. 161' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/161.htm'
  },
  {
    id: 'transito/solicitud-de-nulidad-del-comparendo-por-indebida-notificacion',
    exactName: 'Solicitud de nulidad del comparendo por indebida notificación',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 135; Ley 1437 de 2011, art. 137',
    competentAuthority: 'Organismo de tránsito competente; en sede judicial, la jurisdicción contencioso administrativa',
    term: { status: 'VERIFICADO', description: 'La copia del comparendo debe enviarse por correo dentro de los tres (3) días hábiles siguientes al propietario del vehículo, a la empresa vinculada y a la Superintendencia de Puertos y Transporte; la autoridad debe entregarla al funcionario competente dentro de las doce (12) horas siguientes (art. 135).' },
    requiredSections: [
      { n: 1, name: 'Identificación del comparendo y de la fecha de su expedición', mandatory: true, basis: 'Art. 135' },
      { n: 2, name: 'Demostración del incumplimiento del término de notificación', mandatory: true, basis: 'Art. 135' },
      { n: 3, name: 'Afectación concreta del derecho de defensa', mandatory: true, basis: null },
      { n: 4, name: 'Petición de nulidad de lo actuado', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/135.htm'
  },
  {
    id: 'transito/impugnacion-de-comparendo-por-deteccion-electronica',
    exactName: 'Impugnación de comparendo por detección electrónica',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, arts. 129, 135 y 136',
    competentAuthority: 'Organismo de tránsito competente',
    term: { status: 'VERIFICADO', description: 'Rige el mismo término de comparecencia de cinco (5) días hábiles del art. 135 y el régimen de descuentos del art. 136.' },
    requiredSections: [
      { n: 1, name: 'Identificación del fotocomparendo, del vehículo y de la fecha', mandatory: true, basis: 'Art. 129' },
      { n: 2, name: 'Cuestionamiento de la validez de la prueba electrónica o de su calibración', mandatory: false, basis: 'Art. 129' },
      { n: 3, name: 'Demostración de que el conductor no era el propietario, cuando aplique', mandatory: false, basis: 'Art. 129' },
      { n: 4, name: 'Solicitud de pruebas', mandatory: true, basis: 'Art. 135' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/135.htm'
  },
  {
    id: 'transito/solicitud-de-revocatoria-directa-de-comparendo',
    exactName: 'Solicitud de revocatoria directa de comparendo',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011, arts. 93 a 97; Ley 769 de 2002',
    competentAuthority: 'Organismo de tránsito que profirió el acto o su superior',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del acto cuya revocatoria se solicita', mandatory: true, basis: 'Ley 1437 de 2011, art. 93' },
      { n: 2, name: 'Causal invocada: oposición a la Constitución o la ley, afectación del interés público o agravio injustificado', mandatory: true, basis: 'Ley 1437 de 2011, art. 93' },
      { n: 3, name: 'Acreditación de que no se interpusieron los recursos de la vía gubernativa', mandatory: true, basis: 'Ley 1437 de 2011, art. 94' },
      { n: 4, name: 'Hechos y pruebas que sustentan la solicitud', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/142.htm'
  },
  {
    id: 'transito/solicitud-de-acuerdo-de-pago-de-multas-de-transito',
    exactName: 'Solicitud de acuerdo de pago de multas de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 159',
    competentAuthority: 'Organismo de tránsito competente',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Relación de las multas cuyo acuerdo se solicita', mandatory: true, basis: 'Art. 159' },
      { n: 2, name: 'Verificación previa de que ninguna esté prescrita', mandatory: true, basis: 'Art. 159' },
      { n: 3, name: 'Plazo y forma de amortización propuestos', mandatory: true, basis: null },
      { n: 4, name: 'Advertencia: suscribir el acuerdo reconoce la deuda e interrumpe la prescripción', mandatory: true, basis: 'Art. 159' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/159.htm'
  },
  {
    id: 'transito/acta-de-conciliacion-por-danos-materiales-en-accidente-de-transito',
    exactName: 'Acta de conciliación por daños materiales en accidente de tránsito',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, art. 143, modificado por la Ley 2251 de 2022',
    competentAuthority: 'Centros de conciliación legalmente constituidos, o directamente las aseguradoras',
    term: { status: 'VERIFICADO', description: 'Cuando el accidente causa solo daños materiales y no hay lesiones personales, no interviene la autoridad de tránsito. El acta de conciliación suscrita por las partes y la autoridad tiene fuerza de cosa juzgada, y en todo caso debe hacerse el retiro inmediato de los vehículos (art. 143).' },
    requiredSections: [
      { n: 1, name: 'Identificación de los conductores, con licencia de conducción y licencia de tránsito', mandatory: true, basis: 'Art. 143' },
      { n: 2, name: 'Domicilio, residencia y números telefónicos de cada parte', mandatory: true, basis: 'Art. 143' },
      { n: 3, name: 'Información sobre las pólizas de seguro vigentes', mandatory: true, basis: 'Art. 143' },
      { n: 4, name: 'Descripción de los daños materiales causados', mandatory: true, basis: 'Art. 143' },
      { n: 5, name: 'Acuerdo indemnizatorio y forma de pago', mandatory: true, basis: 'Art. 143' },
      { n: 6, name: 'Constancia del retiro inmediato de los vehículos', mandatory: true, basis: 'Art. 143' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/143.htm'
  },
  {
    id: 'transito/solicitud-de-levantamiento-de-inmovilizacion-de-vehiculo',
    exactName: 'Solicitud de levantamiento de inmovilización de vehículo',
    branch: 'TRANSITO',
    role: 'LITIGANTE',
    legalBasis: 'Ley 769 de 2002, arts. 125 y 127',
    competentAuthority: 'Organismo de tránsito que ordenó la inmovilización',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del vehículo y del acta de inmovilización', mandatory: true, basis: 'Art. 125' },
      { n: 2, name: 'Acreditación de la subsanación de la causa que la originó', mandatory: true, basis: 'Art. 125' },
      { n: 3, name: 'Prueba de la propiedad o de la tenencia legítima', mandatory: true, basis: null },
      { n: 4, name: 'Constancia de pago de los costos de grúa y parqueadero', mandatory: true, basis: 'Art. 127' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/125.htm'
  },
  {
    id: 'transito/orden-de-comparendo',
    exactName: 'Orden de comparendo',
    branch: 'TRANSITO',
    role: 'DESPACHO',
    legalBasis: 'Ley 769 de 2002, arts. 135 y 137',
    competentAuthority: 'Agente o autoridad de tránsito',
    term: { status: 'VERIFICADO', description: 'La autoridad debe entregar la copia de la orden al funcionario competente dentro de las doce (12) horas siguientes, so pena de mala conducta; y enviarla por correo al propietario del vehículo, a la empresa vinculada y a la Superintendencia de Puertos y Transporte dentro de los tres (3) días hábiles siguientes (art. 135).' },
    requiredSections: [
      { n: 1, name: 'Identificación del presunto contraventor y del vehículo', mandatory: true, basis: 'Art. 135' },
      { n: 2, name: 'Descripción de la infracción y norma infringida', mandatory: true, basis: 'Art. 135' },
      { n: 3, name: 'Lugar, fecha y hora de la infracción', mandatory: true, basis: 'Art. 135' },
      { n: 4, name: 'Espacio para consignar la dirección del inculpado o del testigo', mandatory: true, basis: 'Art. 135' },
      { n: 5, name: 'Indicación del término de cinco (5) días hábiles para comparecer', mandatory: true, basis: 'Art. 135' },
      { n: 6, name: 'Información sobre los descuentos del art. 136 y el curso obligatorio', mandatory: true, basis: 'Art. 136' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/135.htm'
  },
  {
    id: 'transito/resolucion-que-impone-sancion-de-transito',
    exactName: 'Resolución que impone sanción de tránsito',
    branch: 'TRANSITO',
    role: 'DESPACHO',
    legalBasis: 'Ley 769 de 2002, arts. 136, 137 y 161',
    competentAuthority: 'Autoridad de tránsito competente',
    term: { status: 'VERIFICADO', description: 'Si el inculpado no comparece sin causa justificada dentro de los cinco (5) días hábiles, la autoridad resuelve después de treinta (30) días calendario de ocurrida la presunta infracción (art. 136). En todo caso la acción caduca al año contado desde los hechos (art. 161).' },
    requiredSections: [
      { n: 1, name: 'Verificación de que la acción no ha caducado', mandatory: true, basis: 'Art. 161' },
      { n: 2, name: 'Identificación del contraventor, del vehículo y del comparendo', mandatory: true, basis: 'Art. 135' },
      { n: 3, name: 'Análisis de los descargos y de las pruebas practicadas en audiencia', mandatory: true, basis: 'Art. 135' },
      { n: 4, name: 'Norma infringida y sanción aplicable', mandatory: true, basis: 'Art. 131' },
      { n: 5, name: 'Liquidación de la multa en salarios mínimos diarios legales vigentes', mandatory: true, basis: 'Art. 131' },
      { n: 6, name: 'Indicación de los recursos de reposición y apelación', mandatory: true, basis: 'Art. 142' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/136.htm'
  },
  {
    id: 'transito/resolucion-que-resuelve-recurso-en-materia-de-transito',
    exactName: 'Resolución que resuelve recurso en materia de tránsito',
    branch: 'TRANSITO',
    role: 'DESPACHO',
    legalBasis: 'Ley 769 de 2002, arts. 142 y 161',
    competentAuthority: 'El funcionario que profirió la providencia, o su superior en apelación',
    term: { status: 'VERIFICADO', description: 'Debe decidirse dentro del año siguiente a la interposición del recurso; de no hacerlo, el recurso se entiende fallado a favor del recurrente (art. 161).' },
    requiredSections: [
      { n: 1, name: 'Verificación del cumplimiento del término de un (1) año', mandatory: true, basis: 'Art. 161' },
      { n: 2, name: 'Pronunciamiento sobre cada razón de inconformidad', mandatory: true, basis: 'Art. 142' },
      { n: 3, name: 'Valoración de las pruebas practicadas', mandatory: true, basis: 'Art. 135' },
      { n: 4, name: 'Decisión: confirma, modifica o revoca la sanción', mandatory: true, basis: 'Art. 142' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/161.htm'
  },
  {
    id: 'transito/auto-que-declara-la-prescripcion-de-la-sancion-de-transito',
    exactName: 'Auto que declara la prescripción de la sanción de tránsito',
    branch: 'TRANSITO',
    role: 'DESPACHO',
    legalBasis: 'Ley 769 de 2002, art. 159',
    competentAuthority: 'Autoridad de tránsito competente',
    term: { status: 'VERIFICADO', description: 'La prescripción de tres (3) años debe declararse DE OFICIO; las autoridades no pueden iniciar cobro coactivo respecto de sanciones cuya prescripción ya se configuró (art. 159).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la sanción y de la fecha de ocurrencia del hecho', mandatory: true, basis: 'Art. 159' },
      { n: 2, name: 'Verificación de que no se notificó mandamiento de pago dentro del trienio', mandatory: true, basis: 'Art. 159' },
      { n: 3, name: 'Declaratoria de prescripción de oficio', mandatory: true, basis: 'Art. 159' },
      { n: 4, name: 'Orden de retiro del registro en el RUNT y en el SIMIT', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/159.htm'
  },
  {
    id: 'transito/mandamiento-de-pago-de-multas-de-transito',
    exactName: 'Mandamiento de pago de multas de tránsito',
    branch: 'TRANSITO',
    role: 'DESPACHO',
    legalBasis: 'Ley 769 de 2002, art. 159; Estatuto Tributario, arts. 823 y siguientes por remisión',
    competentAuthority: 'Organismo de tránsito con funciones de cobro coactivo',
    term: { status: 'VERIFICADO', description: 'Su notificación interrumpe el término de prescripción de tres (3) años del art. 159.' },
    requiredSections: [
      { n: 1, name: 'Verificación previa de que la sanción no ha prescrito', mandatory: true, basis: 'Art. 159' },
      { n: 2, name: 'Identificación del título ejecutivo: resolución sancionatoria en firme', mandatory: true, basis: 'Art. 159' },
      { n: 3, name: 'Liquidación del capital y de los intereses moratorios', mandatory: true, basis: 'Art. 136' },
      { n: 4, name: 'Orden de pago y término para proponer excepciones', mandatory: true, basis: 'E.T. art. 830' },
      { n: 5, name: 'Constancia de notificación, que es la que interrumpe la prescripción', mandatory: true, basis: 'Art. 159' }
    ],
    sourceUrl: 'https://leyes.co/codigo_nacional_de_transito_terrestre/159.htm'
  }
  ]
};
