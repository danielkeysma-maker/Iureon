import type { BranchCatalog } from '../types';

/**
 * FAMILIA catalogue.
 *
 * Generated from research/actuaciones-familia.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const FAMILIA_CATALOG: BranchCatalog = {
  meta: {
    branch: 'FAMILIA',
    verifiedAt: '2026-08-12',
    sourceOfTruth: 'Ley 1564 de 2012 (Código General del Proceso), que rige el procedimiento de familia; Ley 1996 de 2019 sobre capacidad legal plena de las personas con discapacidad; Ley 1098 de 2006 (Código de la Infancia y la Adolescencia). No existe un código procesal de familia separado. Los términos marcados como verificados fueron leídos artículo por artículo en el texto de la norma.',
    gaps: [
    'LA INTERDICCIÓN ESTÁ PROHIBIDA Y EL CGP TODAVÍA LA MENCIONA. El art. 53 de la Ley 1996 de 2019 dispone: \'Queda prohibido iniciar procesos de interdicción o inhabilitación, o solicitar la sentencia de interdicción o inhabilitación para dar inicio a cualquier trámite público o privado\'. Su art. 61 derogó los numerales 5 y 6 del art. 22 del CGP. Pese a ello, el texto publicado del art. 577 del CGP sigue listando \'interdicción y rehabilitación\' entre los asuntos de jurisdicción voluntaria. Ese numeral NO puede usarse: la figura que reemplaza a la interdicción es la adjudicación judicial de apoyos. Este catálogo no ofrece la interdicción como actuación.',
    'Término del proceso administrativo de restablecimiento de derechos (art. 100 Ley 1098 de 2006, reformado por la Ley 1878 de 2018): no se pudo leer en las fuentes consultadas. Queda sin verificar.',
    'Medidas de protección por violencia intrafamiliar (Ley 294 de 1996 y Ley 1257 de 2008): la estructura está catalogada, los términos no se verificaron. Se tramitan ante comisaría de familia y no ante juez.',
    'Términos de la restitución internacional de menores (Convenio de La Haya de 1980): no verificados.',
    'El divorcio y la separación por mutuo consentimiento también pueden tramitarse ante notario (Ley 962 de 2005, Decreto 4436 de 2005). Este catálogo cubre la vía judicial; la notarial corresponde a la rama NOTARIAL, aún no catalogada.',
    'Los procesos de sucesión están catalogados en la rama CIVIL; ante juez de familia corresponden los de mayor cuantía (art. 22 num. 9 CGP).'
    ]
  },
  actuaciones: [
  {
    id: 'familia/demanda-de-divorcio-contencioso',
    exactName: 'Demanda de divorcio contencioso',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 1, 82, 369 y 388; Código Civil, art. 154',
    competentAuthority: 'Juez de familia en primera instancia (art. 22 num. 1)',
    term: { status: 'VERIFICADO', description: 'Al ser un proceso verbal, admitida la demanda se corre traslado al demandado por veinte (20) días para contestarla (art. 369).' },
    requiredSections: [
      { n: 1, name: 'Designación del juez de familia', mandatory: true, basis: 'Art. 82 num. 1' },
      { n: 2, name: 'Identificación de los cónyuges; solo ellos son partes en el proceso', mandatory: true, basis: 'Art. 388' },
      { n: 3, name: 'Registro civil de matrimonio', mandatory: true, basis: 'Art. 84' },
      { n: 4, name: 'Registros civiles de nacimiento de los hijos', mandatory: false, basis: 'Art. 84' },
      { n: 5, name: 'Causal de divorcio invocada y hechos que la configuran', mandatory: true, basis: 'C.C. art. 154' },
      { n: 6, name: 'Pretensiones sobre alimentos, custodia y visitas de los hijos menores', mandatory: false, basis: null },
      { n: 7, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' },
      { n: 8, name: 'Lugar y dirección para notificaciones', mandatory: true, basis: 'Art. 82 num. 10' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/388.htm'
  },
  {
    id: 'familia/solicitud-de-divorcio-por-mutuo-consentimiento',
    exactName: 'Solicitud de divorcio por mutuo consentimiento',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 577 num. 10 y 578',
    competentAuthority: 'Juez de familia, por el trámite de jurisdicción voluntaria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Solicitud conjunta de ambos cónyuges', mandatory: true, basis: 'Art. 577 num. 10' },
      { n: 2, name: 'Registro civil de matrimonio', mandatory: true, basis: null },
      { n: 3, name: 'Acuerdo sobre alimentos, custodia, visitas y patria potestad de los hijos menores', mandatory: true, basis: null },
      { n: 4, name: 'Acuerdo sobre la sociedad conyugal', mandatory: false, basis: null },
      { n: 5, name: 'Poder conferido por ambos cónyuges', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/demanda-de-cesacion-de-efectos-civiles-de-matrimonio-religioso',
    exactName: 'Demanda de cesación de efectos civiles de matrimonio religioso',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 1, 369 y 388',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'VERIFICADO', description: 'Proceso verbal: traslado de veinte (20) días para contestar (art. 369).' },
    requiredSections: [
      { n: 1, name: 'Identificación de los cónyuges', mandatory: true, basis: 'Art. 388' },
      { n: 2, name: 'Registro civil de matrimonio religioso', mandatory: true, basis: null },
      { n: 3, name: 'Causal invocada y hechos que la configuran', mandatory: true, basis: 'C.C. art. 154' },
      { n: 4, name: 'Pretensión de cesación de los efectos civiles', mandatory: true, basis: 'Art. 22 num. 1' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/388.htm'
  },
  {
    id: 'familia/demanda-de-separacion-de-cuerpos',
    exactName: 'Demanda de separación de cuerpos',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 1 y 388 par.',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'VERIFICADO', description: 'Al proceso de separación de cuerpos, de matrimonio civil o religioso, se aplican las mismas reglas del divorcio (art. 388 par.).' },
    requiredSections: [
      { n: 1, name: 'Identificación de los cónyuges', mandatory: true, basis: 'Art. 388' },
      { n: 2, name: 'Registro civil de matrimonio', mandatory: true, basis: null },
      { n: 3, name: 'Causal de separación y hechos que la configuran', mandatory: true, basis: null },
      { n: 4, name: 'Pretensiones sobre los hijos menores', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/388.htm'
  },
  {
    id: 'familia/demanda-de-separacion-de-bienes',
    exactName: 'Demanda de separación de bienes',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 1',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los cónyuges o compañeros permanentes', mandatory: true, basis: null },
      { n: 2, name: 'Prueba del matrimonio o de la unión marital de hecho', mandatory: true, basis: null },
      { n: 3, name: 'Causal invocada', mandatory: true, basis: null },
      { n: 4, name: 'Relación de los bienes sociales', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/demanda-de-liquidacion-de-sociedad-conyugal-o-patrimonial',
    exactName: 'Demanda de liquidación de sociedad conyugal o patrimonial',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 3',
    competentAuthority: 'Juez de familia, cuando la causa es distinta de la muerte de los cónyuges o compañeros',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Prueba de la disolución de la sociedad conyugal o patrimonial', mandatory: true, basis: 'Art. 22 num. 3' },
      { n: 2, name: 'Inventario y avalúo de los bienes sociales', mandatory: true, basis: null },
      { n: 3, name: 'Relación de deudas y recompensas', mandatory: true, basis: null },
      { n: 4, name: 'Propuesta de partición o adjudicación', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/demanda-de-declaracion-de-union-marital-de-hecho',
    exactName: 'Demanda de declaración de unión marital de hecho',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 20; Ley 54 de 1990',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los compañeros permanentes', mandatory: true, basis: null },
      { n: 2, name: 'Hechos que acreditan la comunidad de vida permanente y singular', mandatory: true, basis: null },
      { n: 3, name: 'Fecha de inicio y, si aplica, de terminación de la unión', mandatory: true, basis: null },
      { n: 4, name: 'Pretensión de declaración de la unión y, en su caso, de la sociedad patrimonial', mandatory: true, basis: 'Art. 22 num. 20' },
      { n: 5, name: 'Petición de pruebas, incluida la testimonial', mandatory: true, basis: 'Art. 82 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/demanda-de-alimentos-a-favor-de-mayor-de-edad',
    exactName: 'Demanda de alimentos a favor de mayor de edad',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 397',
    competentAuthority: 'Juez de familia o juez civil municipal, según el caso',
    term: { status: 'VERIFICADO', description: 'El juez ordena alimentos provisionales desde la presentación de la demanda cuando el demandante acredite con prueba sumaria la capacidad económica del demandado; si la cuantía supera un salario mínimo, debe acreditarse además el monto de las necesidades del alimentario (art. 397).' },
    requiredSections: [
      { n: 1, name: 'Identificación del alimentario y del alimentante', mandatory: true, basis: 'Art. 397' },
      { n: 2, name: 'Prueba del parentesco o del título que genera la obligación', mandatory: true, basis: null },
      { n: 3, name: 'Prueba sumaria de la capacidad económica del demandado', mandatory: true, basis: 'Art. 397' },
      { n: 4, name: 'Cuantificación de las necesidades del alimentario', mandatory: true, basis: 'Art. 397' },
      { n: 5, name: 'Solicitud expresa de alimentos provisionales', mandatory: false, basis: 'Art. 397' },
      { n: 6, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/397.htm'
  },
  {
    id: 'familia/demanda-de-alimentos-a-favor-de-nino-nina-o-adolescente',
    exactName: 'Demanda de alimentos a favor de niño, niña o adolescente',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1098 de 2006, arts. 111 y siguientes; Ley 1564 de 2012, art. 397',
    competentAuthority: 'Juez de familia o defensor de familia, según la vía',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del niño, niña o adolescente y de quien lo representa', mandatory: true, basis: null },
      { n: 2, name: 'Registro civil de nacimiento', mandatory: true, basis: null },
      { n: 3, name: 'Prueba de la capacidad económica del alimentante', mandatory: true, basis: 'Art. 397' },
      { n: 4, name: 'Cuantificación de las necesidades del menor', mandatory: true, basis: null },
      { n: 5, name: 'Solicitud de alimentos provisionales', mandatory: false, basis: 'Art. 397' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/397.htm'
  },
  {
    id: 'familia/solicitud-de-aumento-disminucion-o-exoneracion-de-alimentos',
    exactName: 'Solicitud de aumento, disminución o exoneración de alimentos',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 397',
    competentAuthority: 'El mismo juez que conoció del proceso de alimentos',
    term: { status: 'VERIFICADO', description: 'Se tramita ante el mismo juez y en el mismo expediente (art. 397).' },
    requiredSections: [
      { n: 1, name: 'Identificación del proceso de alimentos anterior', mandatory: true, basis: 'Art. 397' },
      { n: 2, name: 'Hechos nuevos que justifican la modificación', mandatory: true, basis: 'Art. 397' },
      { n: 3, name: 'Prueba del cambio en la capacidad económica o en las necesidades', mandatory: true, basis: 'Art. 397' },
      { n: 4, name: 'Pretensión concreta de aumento, disminución o exoneración', mandatory: true, basis: 'Art. 397' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/397.htm'
  },
  {
    id: 'familia/demanda-de-investigacion-de-la-paternidad-o-la-maternidad',
    exactName: 'Demanda de investigación de la paternidad o la maternidad',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 2 y 386; Ley 721 de 2001',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Hechos, causales y petición de pruebas conforme a los requisitos de la demanda', mandatory: true, basis: 'Art. 386 num. 1' },
      { n: 2, name: 'Registro civil de nacimiento del hijo', mandatory: true, basis: null },
      { n: 3, name: 'Solicitud de prueba con marcadores genéticos de ADN', mandatory: true, basis: 'Art. 386 num. 2' },
      { n: 4, name: 'Advertencia de que la renuencia del demandado hace presumir cierta la paternidad alegada', mandatory: true, basis: 'Art. 386 num. 2' },
      { n: 5, name: 'Solicitud de alimentos provisionales desde la admisión', mandatory: false, basis: 'Art. 386 num. 5' },
      { n: 6, name: 'Solicitud de medidas sobre custodia, visitas y alimentos en el mismo proceso', mandatory: false, basis: 'Art. 386 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/386.htm'
  },
  {
    id: 'familia/demanda-de-impugnacion-de-la-paternidad-o-la-maternidad',
    exactName: 'Demanda de impugnación de la paternidad o la maternidad',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 2 y 386; Ley 721 de 2001',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del vínculo que se impugna y su inscripción', mandatory: true, basis: 'Art. 386' },
      { n: 2, name: 'Hechos y causal de impugnación', mandatory: true, basis: 'Art. 386 num. 1' },
      { n: 3, name: 'Solicitud de prueba con marcadores genéticos de ADN, indispensable cuando se impugna la de un menor', mandatory: true, basis: 'Art. 386 nums. 2 y 3' },
      { n: 4, name: 'Petición de pruebas adicionales', mandatory: true, basis: 'Art. 386 num. 1' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/386.htm'
  },
  {
    id: 'familia/demanda-de-perdida-o-suspension-de-la-patria-potestad',
    exactName: 'Demanda de pérdida o suspensión de la patria potestad',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 4; Código Civil, arts. 310 y 315',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del menor y de sus padres', mandatory: true, basis: null },
      { n: 2, name: 'Registro civil de nacimiento', mandatory: true, basis: null },
      { n: 3, name: 'Causal legal invocada y hechos que la configuran', mandatory: true, basis: 'C.C. arts. 310 y 315' },
      { n: 4, name: 'Pretensión de pérdida, suspensión o rehabilitación', mandatory: true, basis: 'Art. 22 num. 4' },
      { n: 5, name: 'Petición de pruebas', mandatory: true, basis: 'Art. 82 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/demanda-de-custodia-y-cuidado-personal',
    exactName: 'Demanda de custodia y cuidado personal',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1098 de 2006, arts. 23 y 82; Ley 1564 de 2012, art. 386 num. 6',
    competentAuthority: 'Juez de familia o defensor de familia, según la vía',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del menor y de ambos padres', mandatory: true, basis: null },
      { n: 2, name: 'Registro civil de nacimiento', mandatory: true, basis: null },
      { n: 3, name: 'Situación actual de cuidado y hechos que justifican el cambio', mandatory: true, basis: null },
      { n: 4, name: 'Argumentación sobre el interés superior del menor', mandatory: true, basis: 'Ley 1098 de 2006, art. 8' },
      { n: 5, name: 'Pretensiones sobre custodia, visitas y alimentos', mandatory: true, basis: 'Art. 386 num. 6' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/386.htm'
  },
  {
    id: 'familia/demanda-de-regulacion-de-visitas',
    exactName: 'Demanda de regulación de visitas',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1098 de 2006, art. 23; Ley 1564 de 2012, art. 386 num. 6',
    competentAuthority: 'Juez de familia o defensor de familia, según la vía',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del menor y de las partes', mandatory: true, basis: null },
      { n: 2, name: 'Régimen de visitas que se solicita, con días y horarios', mandatory: true, basis: null },
      { n: 3, name: 'Hechos que justifican la regulación', mandatory: true, basis: null },
      { n: 4, name: 'Argumentación sobre el interés superior del menor', mandatory: true, basis: 'Ley 1098 de 2006, art. 8' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/386.htm'
  },
  {
    id: 'familia/solicitud-de-adjudicacion-judicial-de-apoyos',
    exactName: 'Solicitud de adjudicación judicial de apoyos',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1996 de 2019, arts. 32 y 38',
    competentAuthority: 'Juez de familia (art. 32). Se tramita por proceso verbal sumario cuando la promueve persona distinta del titular del acto jurídico (art. 38)',
    term: { status: 'VERIFICADO', description: 'Recibida la valoración de apoyos, el juez corre traslado de ella dentro de los cinco (5) días siguientes, y las partes disponen de diez (10) días para pronunciarse (art. 38).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la persona titular del acto jurídico y de quien promueve', mandatory: true, basis: 'Art. 38' },
      { n: 2, name: 'Demostración de que la persona está absolutamente imposibilitada para manifestar su voluntad y preferencias por cualquier medio', mandatory: true, basis: 'Art. 38' },
      { n: 3, name: 'Demostración de que esa situación impide el ejercicio de la capacidad legal y genera vulneración de derechos por terceros', mandatory: true, basis: 'Art. 38' },
      { n: 4, name: 'Solicitud de valoración de apoyos', mandatory: true, basis: 'Art. 38' },
      { n: 5, name: 'Garantía de participación de la persona en el proceso, salvo imposibilidad absoluta', mandatory: true, basis: 'Art. 38' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=99712'
  },
  {
    id: 'familia/solicitud-de-licencia-para-enajenar-o-gravar-bienes-de-representados',
    exactName: 'Solicitud de licencia para enajenar o gravar bienes de representados',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 577 num. 1',
    competentAuthority: 'Juez de familia, por el trámite de jurisdicción voluntaria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del representado y del representante', mandatory: true, basis: 'Art. 577 num. 1' },
      { n: 2, name: 'Identificación del bien que se pretende enajenar o gravar', mandatory: true, basis: null },
      { n: 3, name: 'Justificación de la necesidad o utilidad del acto', mandatory: true, basis: null },
      { n: 4, name: 'Avalúo del bien', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/solicitud-de-declaracion-de-ausencia',
    exactName: 'Solicitud de declaración de ausencia',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 21 y 577 num. 4',
    competentAuthority: 'Juez de familia, por el trámite de jurisdicción voluntaria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del ausente y de quien solicita', mandatory: true, basis: 'Art. 577 num. 4' },
      { n: 2, name: 'Hechos de la desaparición y última noticia', mandatory: true, basis: null },
      { n: 3, name: 'Interés del solicitante', mandatory: true, basis: null },
      { n: 4, name: 'Solicitud de designación de curador de bienes', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/solicitud-de-declaracion-de-muerte-presunta-por-desaparecimiento',
    exactName: 'Solicitud de declaración de muerte presunta por desaparecimiento',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 21 y 577 num. 5; Código Civil, art. 97',
    competentAuthority: 'Juez de familia, por el trámite de jurisdicción voluntaria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del desaparecido', mandatory: true, basis: 'Art. 577 num. 5' },
      { n: 2, name: 'Fecha de las últimas noticias y hechos del desaparecimiento', mandatory: true, basis: 'C.C. art. 97' },
      { n: 3, name: 'Prueba de las diligencias adelantadas para hallarlo', mandatory: true, basis: null },
      { n: 4, name: 'Solicitud de emplazamiento', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/solicitud-de-autorizacion-para-adopcion',
    exactName: 'Solicitud de autorización para adopción',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 8 y 577 num. 7; Ley 1098 de 2006, arts. 61 y siguientes',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los adoptantes y del adoptable', mandatory: true, basis: 'Art. 22 num. 8' },
      { n: 2, name: 'Resolución de adoptabilidad o consentimiento para la adopción', mandatory: true, basis: 'Ley 1098 de 2006' },
      { n: 3, name: 'Concepto favorable del ICBF o de la institución autorizada', mandatory: true, basis: 'Ley 1098 de 2006' },
      { n: 4, name: 'Prueba de la idoneidad física, mental, moral y social de los adoptantes', mandatory: true, basis: 'Ley 1098 de 2006' },
      { n: 5, name: 'Argumentación sobre el interés superior del menor', mandatory: true, basis: 'Ley 1098 de 2006, art. 8' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/solicitud-de-correccion-o-sustitucion-de-partidas-del-estado-civil',
    exactName: 'Solicitud de corrección o sustitución de partidas del estado civil',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 577 num. 11',
    competentAuthority: 'Juez de familia, por el trámite de jurisdicción voluntaria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del registro que se corrige o sustituye', mandatory: true, basis: 'Art. 577 num. 11' },
      { n: 2, name: 'Error o inexactitud que se pretende corregir', mandatory: true, basis: 'Art. 577 num. 11' },
      { n: 3, name: 'Prueba documental del dato correcto', mandatory: true, basis: null },
      { n: 4, name: 'Solicitud de orden a la autoridad de registro', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/solicitud-de-declaracion-de-reconocimiento-del-hijo-de-crianza',
    exactName: 'Solicitud de declaración de reconocimiento del hijo de crianza',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 577 num. 13',
    competentAuthority: 'Juez de familia, por el trámite de jurisdicción voluntaria',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del hijo de crianza y de la familia de crianza', mandatory: true, basis: 'Art. 577 num. 13' },
      { n: 2, name: 'Hechos que acreditan la relación de crianza: solidaridad, afecto, respeto y protección', mandatory: true, basis: null },
      { n: 3, name: 'Tiempo de duración de la relación', mandatory: true, basis: null },
      { n: 4, name: 'Petición de pruebas, incluida la testimonial', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/577.htm'
  },
  {
    id: 'familia/demanda-de-restitucion-internacional-de-menores',
    exactName: 'Demanda de restitución internacional de menores',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 23; Convenio de La Haya de 1980, aprobado por Ley 173 de 1994',
    competentAuthority: 'Juez de familia en primera instancia (art. 22 num. 23)',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del menor y de quien ejerce la custodia', mandatory: true, basis: 'Art. 22 num. 23' },
      { n: 2, name: 'Prueba de la residencia habitual del menor antes del traslado', mandatory: true, basis: null },
      { n: 3, name: 'Hechos del traslado o retención ilícita', mandatory: true, basis: null },
      { n: 4, name: 'Título que acredita el derecho de custodia según la ley de la residencia habitual', mandatory: true, basis: null },
      { n: 5, name: 'Pretensión de restitución inmediata', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/demanda-de-peticion-de-herencia',
    exactName: 'Demanda de petición de herencia',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 12',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación del causante y del solicitante', mandatory: true, basis: 'Art. 22 num. 12' },
      { n: 2, name: 'Prueba del vínculo que confiere la vocación hereditaria', mandatory: true, basis: null },
      { n: 3, name: 'Identificación de quienes ocupan la herencia', mandatory: true, basis: null },
      { n: 4, name: 'Pretensión de reconocimiento de la calidad de heredero y restitución de bienes', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/demanda-de-nulidad-de-capitulaciones-matrimoniales',
    exactName: 'Demanda de nulidad de capitulaciones matrimoniales',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1564 de 2012, art. 22 num. 14',
    competentAuthority: 'Juez de familia en primera instancia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de los otorgantes y de la escritura de capitulaciones', mandatory: true, basis: 'Art. 22 num. 14' },
      { n: 2, name: 'Causal de nulidad invocada', mandatory: true, basis: null },
      { n: 3, name: 'Hechos que la configuran', mandatory: true, basis: null },
      { n: 4, name: 'Copia de la escritura pública', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  },
  {
    id: 'familia/solicitud-de-medida-de-proteccion-por-violencia-intrafamiliar',
    exactName: 'Solicitud de medida de protección por violencia intrafamiliar',
    branch: 'FAMILIA',
    role: 'LITIGANTE',
    legalBasis: 'Ley 294 de 1996; Ley 575 de 2000; Ley 1257 de 2008',
    competentAuthority: 'Comisaría de familia del lugar de los hechos; el juez de familia conoce por reparto donde no haya comisaría',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Identificación de la víctima y del agresor', mandatory: true, basis: null },
      { n: 2, name: 'Relación familiar o de convivencia entre ambos', mandatory: true, basis: null },
      { n: 3, name: 'Relato de los hechos de violencia, con fechas', mandatory: true, basis: null },
      { n: 4, name: 'Medidas de protección que se solicitan', mandatory: true, basis: null },
      { n: 5, name: 'Pruebas disponibles: dictámenes, denuncias, testimonios', mandatory: false, basis: null }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=22106'
  },
  {
    id: 'familia/auto-admisorio-de-demanda-de-familia',
    exactName: 'Auto admisorio de demanda de familia',
    branch: 'FAMILIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 90 y 369',
    competentAuthority: 'Juez de familia',
    term: { status: 'VERIFICADO', description: 'En proceso verbal, admitida la demanda se corre traslado al demandado por veinte (20) días (art. 369).' },
    requiredSections: [
      { n: 1, name: 'Verificación de los requisitos de la demanda y de sus anexos', mandatory: true, basis: 'Arts. 82 y 84' },
      { n: 2, name: 'Declaración de admisión', mandatory: true, basis: 'Art. 90' },
      { n: 3, name: 'Orden de traslado con indicación del término', mandatory: true, basis: 'Art. 369' },
      { n: 4, name: 'Pronunciamiento sobre alimentos provisionales y medidas sobre los hijos', mandatory: false, basis: 'Arts. 386 y 397' },
      { n: 5, name: 'Orden de vinculación del defensor de familia cuando haya menores', mandatory: false, basis: 'Ley 1098 de 2006' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/90.htm'
  },
  {
    id: 'familia/auto-que-decreta-alimentos-provisionales',
    exactName: 'Auto que decreta alimentos provisionales',
    branch: 'FAMILIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 386 num. 5 y 397',
    competentAuthority: 'Juez de familia',
    term: { status: 'VERIFICADO', description: 'En el proceso de alimentos, se decretan desde la presentación de la demanda con prueba sumaria de la capacidad económica del demandado; en investigación de paternidad, desde la admisión cuando haya fundamento razonable (arts. 397 y 386 num. 5).' },
    requiredSections: [
      { n: 1, name: 'Valoración de la prueba sumaria de capacidad económica', mandatory: true, basis: 'Art. 397' },
      { n: 2, name: 'Valoración de las necesidades acreditadas del alimentario', mandatory: true, basis: 'Art. 397' },
      { n: 3, name: 'Fijación del monto y de la periodicidad', mandatory: true, basis: 'Art. 397' },
      { n: 4, name: 'Orden de pago y forma de cumplimiento', mandatory: true, basis: 'Art. 397' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/397.htm'
  },
  {
    id: 'familia/sentencia-de-divorcio',
    exactName: 'Sentencia de divorcio',
    branch: 'FAMILIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 280 y 388',
    competentAuthority: 'Juez de familia',
    term: { status: 'VERIFICADO', description: 'El juez dicta sentencia de plano cuando los cónyuges llegan a un acuerdo; la muerte de uno de ellos o la reconciliación ponen fin al proceso (art. 388).' },
    requiredSections: [
      { n: 1, name: 'Síntesis de la demanda y de la contestación', mandatory: true, basis: 'Art. 280' },
      { n: 2, name: 'Análisis de la causal invocada y de las pruebas', mandatory: true, basis: 'Art. 280' },
      { n: 3, name: 'Decisión sobre el vínculo matrimonial', mandatory: true, basis: 'Art. 388' },
      { n: 4, name: 'Disposiciones sobre alimentos, custodia y visitas de los hijos menores', mandatory: true, basis: null },
      { n: 5, name: 'Disolución de la sociedad conyugal', mandatory: true, basis: null },
      { n: 6, name: 'Orden de envío de copia al funcionario del estado civil para su inscripción', mandatory: true, basis: 'Art. 388' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/388.htm'
  },
  {
    id: 'familia/sentencia-de-investigacion-de-la-paternidad',
    exactName: 'Sentencia de investigación de la paternidad',
    branch: 'FAMILIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, art. 386',
    competentAuthority: 'Juez de familia',
    term: { status: 'VERIFICADO', description: 'Se dicta de plano cuando no hay oposición, o cuando la prueba genética favorece al demandante y no se solicitó un nuevo dictamen (art. 386 num. 4).' },
    requiredSections: [
      { n: 1, name: 'Valoración del dictamen con marcadores genéticos de ADN', mandatory: true, basis: 'Art. 386 num. 2' },
      { n: 2, name: 'Pronunciamiento sobre la renuencia del demandado, si la hubo', mandatory: true, basis: 'Art. 386 num. 2' },
      { n: 3, name: 'Declaración de la paternidad o maternidad', mandatory: true, basis: 'Art. 386' },
      { n: 4, name: 'Disposiciones sobre alimentos, custodia y visitas', mandatory: false, basis: 'Art. 386 num. 6' },
      { n: 5, name: 'Orden de inscripción en el registro civil', mandatory: true, basis: null }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/386.htm'
  },
  {
    id: 'familia/sentencia-de-adjudicacion-judicial-de-apoyos',
    exactName: 'Sentencia de adjudicación judicial de apoyos',
    branch: 'FAMILIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1996 de 2019, arts. 32 y 38',
    competentAuthority: 'Juez de familia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Constancia de la participación de la persona titular, o de la imposibilidad absoluta de comunicarse', mandatory: true, basis: 'Art. 38' },
      { n: 2, name: 'Valoración de apoyos y su traslado a las partes', mandatory: true, basis: 'Art. 38' },
      { n: 3, name: 'Determinación de los apoyos adjudicados y de los actos jurídicos que comprenden', mandatory: true, basis: 'Art. 38' },
      { n: 4, name: 'Salvaguardias y duración de la medida', mandatory: true, basis: null },
      { n: 5, name: 'Prohibición de declarar interdicción o inhabilitación', mandatory: true, basis: 'Art. 53' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=99712'
  },
  {
    id: 'familia/sentencia-de-declaracion-de-union-marital-de-hecho',
    exactName: 'Sentencia de declaración de unión marital de hecho',
    branch: 'FAMILIA',
    role: 'DESPACHO',
    legalBasis: 'Ley 1564 de 2012, arts. 22 num. 20 y 280; Ley 54 de 1990',
    competentAuthority: 'Juez de familia',
    term: { status: 'NO_VERIFICADO', description: null },
    requiredSections: [
      { n: 1, name: 'Análisis de la comunidad de vida permanente y singular', mandatory: true, basis: null },
      { n: 2, name: 'Determinación de las fechas de inicio y terminación de la unión', mandatory: true, basis: null },
      { n: 3, name: 'Declaración de la unión marital de hecho', mandatory: true, basis: 'Art. 22 num. 20' },
      { n: 4, name: 'Pronunciamiento sobre la sociedad patrimonial entre compañeros', mandatory: true, basis: 'Ley 54 de 1990' },
      { n: 5, name: 'Condena en costas', mandatory: true, basis: 'Art. 365' }
    ],
    sourceUrl: 'https://leyes.co/codigo_general_del_proceso/22.htm'
  }
  ]
};
