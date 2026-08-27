import type { BranchCatalog } from '../types';

/**
 * PROPIEDAD_INTELECTUAL catalogue.
 *
 * Generated from research/actuaciones-propiedad-intelectual.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const PROPIEDAD_INTELECTUAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'PROPIEDAD_INTELECTUAL',
    verifiedAt: '2026-08-26',
    sourceOfTruth: 'Decision Andina 486 de 2000 (regimen comun de propiedad industrial) y Decision Andina 351 de 1993 (derecho de autor y derechos conexos), normas supranacionales de aplicacion directa que prevalecen sobre la ley interna; Ley 23 de 1982 reformada por piezas por la Ley 1915 de 2018, cuyo art. 37 solo derogo sus arts. 58 a 71 y el 243; y CGP art. 24 para la competencia jurisdiccional de la SIC y de la Direccion Nacional de Derecho de Autor. Al derogar el art. 243 de la Ley 23, la Ley 1915 dejo sin objeto el art. 390 num. 5 del CGP: la infraccion de derecho de autor se tramita hoy por el verbal del art. 368. La interpretacion prejudicial del Tribunal Andino es facultativa si la sentencia admite recursos y obligatoria en unica o ultima instancia.',
    gaps: [
    'PROPIEDAD_INTELECTUAL: INTERPRETACION PREJUDICIAL ANTE EL TJCA - NO se cataloga aqui. La ficha «Solicitud de interpretacion prejudicial al Tribunal de Justicia de la Comunidad Andina» YA EXISTE en actuaciones-internacional.json con base en el Tratado de Creacion y la Decision 500. Duplicarla produciria dos fichas con el mismo exact_name y el motor de redaccion escogeria una al azar. Lo verificado sobre su obligatoriedad quedo consignado en el campo vigencia, y la ficha de nulidad del registro la trae como seccion opcional.',
    'PROPIEDAD_INTELECTUAL: ACCION POR COMPETENCIA DESLEAL VINCULADA A LA PROPIEDAD INDUSTRIAL (Decision 486, arts. 258 a 269) - NO se cataloga. La ficha «Demanda por competencia desleal» YA EXISTE en actuaciones-superintendencias.json con base en la Ley 256 de 1996 y el art. 24 del CGP, y la tramita la Delegatura para Asuntos Jurisdiccionales de la SIC (Decreto 4886 de 2011, art. 21 nums. 5 a 8). Seria un exact_name duplicado.',
    'PROPIEDAD_INTELECTUAL: DELITOS CONTRA LOS DERECHOS DE AUTOR Y LA PROPIEDAD INDUSTRIAL (Codigo Penal arts. 270 a 272, este ultimo modificado por el art. 33 de la Ley 1915 de 2018, y art. 306) - corresponden a la rama PENAL, segun la instruccion del brief. La Decision 486, art. 257, y la Decision 351, art. 57 lit. d, solo obligan a los Paises Miembros a establecer sanciones penales; no describen un escrito.',
    'PROPIEDAD_INTELECTUAL: SOLICITUD DE INDEMNIZACIONES PREESTABLECIDAS (Ley 1915 de 2018, art. 32) - no es un escrito autonomo sino una ELECCION que el titular hace dentro de la demanda por infraccion. Quedo como seccion opcional de esa ficha en vez de generar una ficha propia.',
    'PROPIEDAD_INTELECTUAL: RESOLUCION QUE RESUELVE LA OPOSICION, separada de la que concede o niega el registro - NO existe como acto autonomo. El art. 150 de la Decision 486 es explicito: «en caso se hubiesen presentado oposiciones, la oficina nacional competente se pronunciara sobre estas Y sobre la concesion o denegatoria del registro de la marca MEDIANTE RESOLUCION». Es un solo acto y se catalogo como uno solo; separarlo habria creado una ficha para un documento que no se profiere.',
    'PROPIEDAD_INTELECTUAL: RECURSO DE REPOSICION ANTE LA SIC EN PROPIEDAD INDUSTRIAL - NO se cataloga porque NO PROCEDE. El Decreto 4886 de 2011, art. 19 paragrafo y art. 20 paragrafo, dispone que contra las decisiones que ponen fin a las actuaciones de las Direcciones de Signos Distintivos y de Nuevas Creaciones «solo procede el recurso de apelacion». Catalogar la reposicion habria puesto al abogado a gastar su unico plazo de diez dias en un escrito improcedente.',
    'PROPIEDAD_INTELECTUAL: DISENOS INDUSTRIALES (Decision 486, arts. 113 a 133), MODELOS DE UTILIDAD (arts. 81 a 85), ESQUEMAS DE TRAZADO DE CIRCUITOS INTEGRADOS (arts. 86 a 112), LEMAS Y NOMBRES COMERCIALES (arts. 175 a 200), DENOMINACIONES DE ORIGEN (arts. 201 a 223), SECRETOS EMPRESARIALES (arts. 260 a 266) y LICENCIAS OBLIGATORIAS DE PATENTE (arts. 61 a 69) - la Decision 486 los regula y estan vigentes, pero no se catalogaron en esta pasada por volumen. Sus tramites siguen en lo esencial el esquema de la marca o de la patente, con plazos propios que NO deben suponerse iguales: hay que leerlos antes de escribir la ficha.',
    'PROPIEDAD_INTELECTUAL: NULIDAD DE LA PATENTE (Decision 486, art. 75) - verificado que existe y que la nulidad absoluta se decreta «de oficio o a solicitud de cualquier persona y en cualquier momento», con causales taxativas de la a) a la h). No se catalogo porque arrastra la MISMA duda de competencia interna senalada para la nulidad del registro de marca, y catalogarla con autoridad dudosa habria duplicado el defecto en lugar de contenerlo.',
    'PROPIEDAD_INTELECTUAL: DERECHOS DE OBTENTOR DE VARIEDADES VEGETALES ante el ICA (Ley 1564 de 2012, art. 24 num. 3 lit. c; Decision Andina 345 de 1993) - la competencia jurisdiccional esta verificada en el art. 24 del CGP, pero la Decision 345 no se leyo en esta pasada y no se catalogo ninguna ficha.',
    'PROPIEDAD_INTELECTUAL: ACTUACIONES DE SECRETARIA - ninguna se catalogo. Ni la Decision 486, ni la Decision 351, ni el Decreto 4886 de 2011 describen actos de secretaria con contenido y plazo propios en estas actuaciones; inventarlos habria sido peor que declarar el hueco.',
    'PROPIEDAD_INTELECTUAL, verificado el esta pasada: QUE RIGE HOY. La propiedad industrial en Colombia NO se rige por ley interna sino por la DECISION ANDINA 486 DE 2000 (Regimen Comun sobre Propiedad Industrial), norma supranacional de aplicacion directa y preferente sobre la ley interna, vigente desde el 1 de diciembre de 2000 (art. 274) y con 280 articulos. Se leyo integra en el PDF oficial del Tribunal de Justicia de la Comunidad Andina (https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf, 280 articulos contados) y se contrasto con el PDF oficial de la Secretaria General de la CAN (https://www.comunidadandina.org/StaticFiles/DocOf/DEC486.pdf): textos identicos. El propio art. 276 confirma el caracter residual del derecho interno: «Los asuntos sobre Propiedad Industrial no comprendidos en la presente Decision, seran regulados por las normas internas de los Paises Miembros». El derecho de autor se rige por la DECISION ANDINA 351 DE 1993 (61 articulos, leida en https://www.tribunalandino.org.ec/decisiones/normativa/DEC351.pdf) y, en lo interno, por la LEY 23 DE 1982, la LEY 44 DE 1993 y la LEY 1915 DE 2018. Se usan como source_url los espejos de tribunalandino.org.ec porque ese es el dominio que la lista blanca de catalog.check.ts reconoce; comunidadandina.org no esta en ella. LA LEY 1915 DE 2018 NO SUSTITUYO LA LEY 23 DE 1982: LA REFORMO POR PIEZAS. Verificado en el texto oficial (https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87419). Su art. 37 dice literalmente: «La presente ley rige a part'
    ]
  },
  actuaciones: [
  {
    id: 'propiedad_intelectual/solicitud-de-registro-de-marca',
    exactName: 'Solicitud de registro de marca',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 138 (contenido de la solicitud), 139 (petitorio), 140 (fecha de presentación), 144 (examen de forma y plazo para subsanar), 145 (publicación); Decreto 4886 de 2011, art. 19 num. 1 (dependencia que decide)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos (oficina nacional competente, Decisión 486 art. 273; Decreto 4886 de 2011, art. 19 num. 1)',
    term: { status: 'VERIFICADO', description: 'La solicitud no tiene plazo de presentación. EL RELOJ DEL SOLICITANTE es el de subsanación: la oficina examina la forma «dentro de los 15 días contados a partir de la fecha de presentación», y si falta algún requisito «notificará al solicitante para que complete dichos requisitos dentro del plazo de sesenta días siguientes a la fecha de notificación» (Decisión 486, art. 144); vencido ese término sin completarlos, la solicitud se considera abandonada y pierde su prelación. Los 15 días son el reloj de la SIC, no el del cliente. Si se invoca prioridad, el plazo es de 12 meses para patente o modelo de utilidad y de 6 meses para diseño industrial o marca, contados desde la primera solicitud (art. 10). Concedido el registro, dura 10 años renovables (art. 152).' },
    requiredSections: [
      { n: 1, name: 'Designación de la Superintendencia de Industria y Comercio — Dirección de Signos Distintivos', mandatory: true, basis: 'Decisión 486, art. 138' },
      { n: 2, name: 'Requerimiento expreso de registro de marca', mandatory: true, basis: 'Decisión 486, art. 139 lit. a' },
      { n: 3, name: 'Nombre, dirección, nacionalidad o domicilio del solicitante y lugar de constitución si es persona jurídica', mandatory: true, basis: 'Decisión 486, art. 139 lits. b y c' },
      { n: 4, name: 'Nombre y dirección del representante legal o apoderado, si lo hay', mandatory: false, basis: 'Decisión 486, art. 139 lit. d' },
      { n: 5, name: 'Indicación o reproducción del signo que se pretende registrar', mandatory: true, basis: 'Decisión 486, arts. 138 lit. b y 139 lit. e' },
      { n: 6, name: 'Indicación expresa de los productos o servicios y de la clase de la Clasificación de Niza (una sola clase por solicitud)', mandatory: true, basis: 'Decisión 486, arts. 138, 139 lits. f y g, y 151' },
      { n: 7, name: 'Poderes, cuando fueren necesarios', mandatory: false, basis: 'Decisión 486, art. 138 lit. c' },
      { n: 8, name: 'Autorizaciones exigidas en los casos de los arts. 135 y 136, cuando fuere aplicable', mandatory: false, basis: 'Decisión 486, art. 138 lit. e' },
      { n: 9, name: 'Comprobante de pago de las tasas establecidas', mandatory: true, basis: 'Decisión 486, art. 138 lit. d' },
      { n: 10, name: 'Firma del solicitante o de su representante legal', mandatory: true, basis: 'Decisión 486, art. 139 lit. h' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/oposicion-al-registro-de-marca',
    exactName: 'Oposición al registro de marca',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 146 (plazo y legitimación), 147 (interés legítimo andino), 149 (causales de inadmisión), 150 (decisión)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos',
    term: { status: 'VERIFICADO', description: 'TREINTA (30) DÍAS siguientes a la fecha de la publicación de la solicitud, por una sola vez: «Dentro del plazo de treinta días siguientes a la fecha de la publicación, quien tenga legítimo interés, podrá presentar, por una sola vez, oposición fundamentada que pueda desvirtuar el registro de la marca» (art. 146). A solicitud de parte se concede, por una sola vez, un plazo adicional de treinta (30) días para presentar las pruebas que sustenten la oposición. La oposición extemporánea no se admite a trámite (art. 149 lit. b), como tampoco la que no pague las tasas (lit. c). No proceden oposiciones contra la solicitud presentada dentro de los seis meses posteriores al vencimiento del plazo de gracia del art. 153 si se basan en marcas que hubieren coexistido con la solicitada (art. 146, inciso final).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la Superintendencia de Industria y Comercio — Dirección de Signos Distintivos', mandatory: true, basis: 'Decisión 486, art. 146' },
      { n: 2, name: 'Datos esenciales del opositor y de la solicitud contra la cual se interpone', mandatory: true, basis: 'Decisión 486, art. 149 lit. a' },
      { n: 3, name: 'Acreditación del legítimo interés', mandatory: true, basis: 'Decisión 486, arts. 146 y 147' },
      { n: 4, name: 'Fundamentación: causales de irregistrabilidad invocadas (arts. 135 y 136)', mandatory: true, basis: 'Decisión 486, art. 146' },
      { n: 5, name: 'Cotejo entre los signos y entre los productos o servicios', mandatory: true, basis: 'Decisión 486, art. 136' },
      { n: 6, name: 'Pruebas que sustentan la oposición, o anuncio de presentarlas en el plazo adicional', mandatory: true, basis: 'Decisión 486, art. 146' },
      { n: 7, name: 'Comprobante de pago de la tasa de tramitación', mandatory: true, basis: 'Decisión 486, art. 149 lit. c' },
      { n: 8, name: 'Petición de denegación del registro', mandatory: true, basis: 'Decisión 486, art. 150' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/contestacion-a-la-oposicion-al-registro-de-marca',
    exactName: 'Contestación a la oposición al registro de marca',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 148 (traslado y plazo), 150 (examen de registrabilidad y decisión)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos',
    term: { status: 'VERIFICADO', description: 'TREINTA (30) DÍAS siguientes a la notificación de la oposición: «Si se hubiere presentado oposición, la oficina nacional competente notificará al solicitante para que dentro de los treinta días siguientes haga valer sus argumentaciones y presente pruebas, si lo estima conveniente» (art. 148). A solicitud de parte se otorga, por una sola vez, un plazo adicional de treinta (30) días para presentar las pruebas que sustenten la contestación. Éste es el reloj del solicitante de la marca; el examen de registrabilidad sólo se hace vencido ese plazo (art. 150).' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente y de la oposición contestada', mandatory: true, basis: 'Decisión 486, art. 148' },
      { n: 2, name: 'Pronunciamiento sobre cada causal de irregistrabilidad alegada', mandatory: true, basis: 'Decisión 486, art. 148' },
      { n: 3, name: 'Argumentación sobre la distintividad del signo y la inexistencia de riesgo de confusión', mandatory: true, basis: 'Decisión 486, arts. 134 a 136' },
      { n: 4, name: 'Pruebas, o petición del plazo adicional de treinta días para presentarlas', mandatory: false, basis: 'Decisión 486, art. 148' },
      { n: 5, name: 'Cuando proceda, solicitud de cancelación por no uso de la marca opositora como defensa', mandatory: false, basis: 'Decisión 486, art. 165' },
      { n: 6, name: 'Petición de que se declare infundada la oposición y se conceda el registro', mandatory: true, basis: 'Decisión 486, art. 150' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/recurso-de-apelacion-contra-la-resolucion-en-materia-de-propiedad-industrial',
    exactName: 'Recurso de apelación contra la resolución en materia de propiedad industrial',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1437 de 2011 (CPACA), arts. 74 num. 2 (procedencia), 76 (oportunidad de diez días y carácter obligatorio para acceder a la jurisdicción), 77 (requisitos), 79 y 80 (trámite y decisión); Decreto 4886 de 2011, art. 19 parágrafo y art. 20 parágrafo (contra las decisiones de las Direcciones de Signos Distintivos y de Nuevas Creaciones SOLO procede apelación), art. 18 num. 10 (quién la resuelve)',
    competentAuthority: 'Se interpone ante el Director de Signos Distintivos o el Director de Nuevas Creaciones de la Superintendencia de Industria y Comercio, que profirió la decisión, y lo resuelve el Superintendente Delegado para la Propiedad Industrial (Decreto 4886 de 2011, art. 18 num. 10; Ley 1437 de 2011, art. 76)',
    term: { status: 'VERIFICADO', description: 'DIEZ (10) DÍAS siguientes a la notificación personal o a la notificación por aviso: «Los recursos de reposición y apelación deberán interponerse por escrito en la diligencia de notificación personal, o dentro de los diez (10) días siguientes a ella, o a la notificación por aviso, o al vencimiento del término de publicación, según el caso» (Ley 1437 de 2011, art. 76). CUIDADO CON DOS COSAS. (1) Contra las resoluciones de propiedad industrial NO procede el recurso de reposición: «Contra las decisiones que ponen fin a las actuaciones adelantadas por la Dirección de Signos Distintivos solo procede el recurso de apelación» (Decreto 4886 de 2011, art. 19 parágrafo), y en idénticos términos el art. 20 parágrafo para la Dirección de Nuevas Creaciones. (2) La apelación no es facultativa a efectos prácticos: «El recurso de apelación podrá interponerse directamente, o como subsidiario del de reposición y cuando proceda será obligatorio para acceder a la jurisdicción» (Ley 1437 de 2011, art. 76). Omitirla cierra la vía contencioso administrativa. El recurso debe sustentarse «con expresión concreta de los motivos de inconformidad» (art. 77 num. 2), so pena de rechazo.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la resolución recurrida, su fecha y su notificación', mandatory: true, basis: 'Ley 1437 de 2011, art. 77' },
      { n: 2, name: 'Interposición dentro del plazo legal por el interesado, representante o apoderado abogado en ejercicio', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 1' },
      { n: 3, name: 'Sustentación con expresión concreta de los motivos de inconformidad', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 2' },
      { n: 4, name: 'Solicitud y aporte de las pruebas que se pretende hacer valer', mandatory: false, basis: 'Ley 1437 de 2011, art. 77 num. 3' },
      { n: 5, name: 'Nombre, dirección y dirección electrónica del recurrente', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 4' },
      { n: 6, name: 'Petición de revocatoria o modificación del acto', mandatory: true, basis: 'Ley 1437 de 2011, art. 74 num. 2' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr001.html'
  },
  {
    id: 'propiedad_intelectual/solicitud-de-renovacion-del-registro-de-marca',
    exactName: 'Solicitud de renovación del registro de marca',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 152 (duración de diez años), 153 (plazo de renovación y plazo de gracia), 174 (caducidad de pleno derecho)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos (Decreto 4886 de 2011, art. 19 num. 1)',
    term: { status: 'VERIFICADO', description: 'El registro dura DIEZ (10) AÑOS contados desde su concesión, renovables por períodos sucesivos de diez años (art. 152). EL RELOJ DEL TITULAR: la renovación debe pedirse «dentro de los seis meses anteriores a la expiración del registro», y existe además un PLAZO DE GRACIA DE SEIS (6) MESES contados desde la fecha de vencimiento, durante el cual el registro mantiene plena vigencia y puede renovarse pagando el recargo (art. 153). La sanción por dejar correr ambos plazos no es una multa: «El registro de la marca caducará de pleno derecho si el titular o quien tuviera legítimo interés no solicita la renovación dentro del término legal, incluido el período de gracia» (art. 174); también caduca por falta de pago de las tasas. Para renovar no se exige prueba de uso y la renovación es automática en los mismos términos del registro original (art. 153).' },
    requiredSections: [
      { n: 1, name: 'Identificación del registro cuya renovación se solicita y de su titular', mandatory: true, basis: 'Decisión 486, art. 153' },
      { n: 2, name: 'Acreditación de la calidad de titular o del legítimo interés', mandatory: true, basis: 'Decisión 486, art. 153' },
      { n: 3, name: 'Indicación de si se renueva íntegramente o se reducen o limitan los productos o servicios', mandatory: false, basis: 'Decisión 486, art. 153' },
      { n: 4, name: 'Comprobantes de pago de las tasas y, si se está en el plazo de gracia, del recargo', mandatory: true, basis: 'Decisión 486, art. 153' },
      { n: 5, name: 'Firma del solicitante o de su apoderado', mandatory: true, basis: 'Decisión 486, art. 139 lit. h' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/accion-de-cancelacion-del-registro-de-marca-por-no-uso',
    exactName: 'Acción de cancelación del registro de marca por no uso',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 165 (causal, plazo de tres años y período de carencia), 166 (qué se entiende por uso), 167 (carga de la prueba), 168 (derecho preferente), 170 (traslado al titular y decisión)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos (oficina nacional competente, Decisión 486 art. 273)',
    term: { status: 'VERIFICADO', description: 'DOS RELOJES DISTINTOS, y confundirlos pierde la solicitud. (1) EL DEL SOLICITANTE DE LA CANCELACIÓN: procede «cuando sin motivo justificado la marca no se hubiese utilizado en al menos uno de los Países Miembros, por su titular, por un licenciatario o por otra persona autorizada para ello durante los tres años consecutivos precedentes a la fecha en que se inicie la acción de cancelación», y además «no podrá iniciarse la acción de cancelación antes de transcurridos tres años contados a partir de la fecha de notificación de la resolución que agote el procedimiento de registro de la marca respectiva en la vía administrativa» (art. 165). Es decir: tres años de no uso hacia atrás, y un período de carencia de tres años desde la firmeza del registro. (2) EL DEL TITULAR DEMANDADO: recibida la solicitud, la oficina «notificará al titular de la marca registrada para que dentro del plazo de sesenta días HÁBILES contados a partir de la notificación, haga valer los alegatos y las pruebas que estime convenientes» (art. 170). La carga de la prueba del uso corresponde al titular (art. 167). La cancelación también puede pedirse como defensa dentro de un procedimiento de oposición fundado en la marca no usada (art. 165).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la Superintendencia de Industria y Comercio — Dirección de Signos Distintivos', mandatory: true, basis: 'Decisión 486, art. 165' },
      { n: 2, name: 'Identificación del registro cuya cancelación se solicita y de su titular', mandatory: true, basis: 'Decisión 486, art. 165' },
      { n: 3, name: 'Acreditación del interés del solicitante', mandatory: true, basis: 'Decisión 486, art. 165' },
      { n: 4, name: 'Afirmación del no uso durante los tres años consecutivos precedentes y verificación de que transcurrieron tres años desde la firmeza del registro', mandatory: true, basis: 'Decisión 486, art. 165' },
      { n: 5, name: 'Indicación de si la cancelación se pide total o parcialmente respecto de ciertos productos o servicios', mandatory: false, basis: 'Decisión 486, art. 165' },
      { n: 6, name: 'Pruebas del no uso disponibles, sin perjuicio de que la carga probatoria del uso recae en el titular', mandatory: false, basis: 'Decisión 486, art. 167' },
      { n: 7, name: 'Comprobante de pago de la tasa', mandatory: true, basis: 'Decisión 486, art. 277' },
      { n: 8, name: 'Petición de cancelación y, si procede, de reconocimiento del derecho preferente al registro', mandatory: true, basis: 'Decisión 486, arts. 165 y 168' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/demanda-de-nulidad-del-registro-de-marca',
    exactName: 'Demanda de nulidad del registro de marca',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, art. 172 (nulidad absoluta y relativa, y prescripción de la relativa) y art. 273 (autoridad nacional competente); Ley 1437 de 2011 (CPACA), arts. 137, 138, 149 y 162',
    competentAuthority: 'Jurisdicción de lo contencioso administrativo — Consejo de Estado, Sección Primera (autoridad nacional competente designada por la legislación interna, Decisión 486 art. 273). VER LA ADVERTENCIA DE _meta_unverified SOBRE ESTA COMPETENCIA ANTES DE RADICAR.',
    term: { status: 'NO_VERIFICADO', description: 'DOS ACCIONES CON RELOJES OPUESTOS. (1) Nulidad ABSOLUTA, cuando el registro se concedió contra el art. 134 primer párrafo o el art. 135: «La autoridad nacional competente decretará de oficio o a solicitud de cualquier persona y EN CUALQUIER MOMENTO, la nulidad absoluta de un registro de marca» (art. 172). No prescribe. (2) Nulidad RELATIVA, cuando se concedió contra el art. 136 o el registro se obtuvo de mala fe: «Esta acción prescribirá a los CINCO AÑOS contados desde la fecha de concesión del registro impugnado» (art. 172). Ése es el reloj que mata el derecho del cliente y se cuenta desde la concesión, no desde que se supo del registro. Las acciones de nulidad no afectan las que correspondan por daños y perjuicios conforme a la legislación interna, y no puede declararse la nulidad por causales que hubiesen dejado de ser aplicables al tiempo de resolverse (art. 172).' },
    requiredSections: [
      { n: 1, name: 'Designación del Consejo de Estado, Sección Primera', mandatory: true, basis: 'Decisión 486, art. 273; Ley 1437 de 2011, art. 162' },
      { n: 2, name: 'Identificación de las partes y del acto administrativo de concesión demandado', mandatory: true, basis: 'Ley 1437 de 2011, art. 162' },
      { n: 3, name: 'Pretensiones: nulidad absoluta o relativa del registro y, en su caso, restablecimiento del derecho', mandatory: true, basis: 'Decisión 486, art. 172' },
      { n: 4, name: 'Hechos y fundamentos: causal del art. 135 (absoluta) o del art. 136 o mala fe (relativa)', mandatory: true, basis: 'Decisión 486, art. 172' },
      { n: 5, name: 'Verificación de la prescripción de cinco años cuando se invoca nulidad relativa', mandatory: true, basis: 'Decisión 486, art. 172' },
      { n: 6, name: 'Normas violadas y concepto de la violación', mandatory: true, basis: 'Ley 1437 de 2011, art. 162 num. 4' },
      { n: 7, name: 'Pruebas y anexos, incluido el certificado del registro impugnado', mandatory: true, basis: 'Ley 1437 de 2011, art. 166' },
      { n: 8, name: 'Solicitud de que se disponga la interpretación prejudicial del Tribunal de Justicia de la Comunidad Andina', mandatory: false, basis: 'Estatuto del TJCA aprobado por la Decisión 500, art. 123' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/solicitud-de-patente-de-invencion',
    exactName: 'Solicitud de patente de invención',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 26 (contenido), 27 (petitorio), 28 (descripción), 33 (fecha de presentación), 38 y 39 (examen de forma y plazo para subsanar), 40 (publicación a los dieciocho meses), 44 (petición del examen de patentabilidad so pena de abandono), 45 (respuesta al examen), 48 (decisión), 50 (duración de veinte años)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Nuevas Creaciones (oficina nacional competente, Decisión 486 art. 273; Decreto 4886 de 2011, art. 20 num. 1)',
    term: { status: 'VERIFICADO', description: 'EL PLAZO QUE MATA LA SOLICITUD NO ES EL DE PRESENTACIÓN, SINO EL DEL EXAMEN: «Dentro del plazo de SEIS MESES contados desde la publicación de la solicitud, independientemente que se hubieren presentado oposiciones, el solicitante deberá pedir que se examine si la invención es patentable. [...] Si transcurriera dicho plazo sin que el solicitante hubiera pedido que se realice el examen, LA SOLICITUD CAERÁ EN ABANDONO» (art. 44). Los demás relojes del solicitante: DOS MESES desde la notificación para completar los requisitos de forma, prorrogables por una sola vez por un período igual sin pérdida de prioridad (art. 39); SESENTA (60) DÍAS desde la notificación para responder cuando la oficina encuentre que la invención no es patentable, prorrogables por una sola vez por treinta (30) días adicionales, y si no se responde o subsisten los impedimentos «la oficina nacional competente denegará la patente» (art. 45); tres (3) meses para aportar documentos de solicitudes extranjeras cuando se requieran (art. 46). Relojes que NO son del solicitante: los 30 días de la oficina para el examen de forma (art. 38) y los dieciocho (18) meses tras los cuales el expediente se hace público y se ordena la publicación (art. 40). Concedida, la patente dura VEINTE (20) AÑOS contados desde la fecha de presentación de la solicitud, no desde la concesión (art. 50).' },
    requiredSections: [
      { n: 1, name: 'Designación de la Superintendencia de Industria y Comercio — Dirección de Nuevas Creaciones', mandatory: true, basis: 'Decisión 486, art. 26' },
      { n: 2, name: 'Petitorio', mandatory: true, basis: 'Decisión 486, arts. 26 lit. a y 27' },
      { n: 3, name: 'Descripción de la invención, clara y completa, con sector tecnológico, técnica anterior y modo de ejecución', mandatory: true, basis: 'Decisión 486, arts. 26 lit. b y 28' },
      { n: 4, name: 'Una o más reivindicaciones', mandatory: true, basis: 'Decisión 486, art. 26 lit. c' },
      { n: 5, name: 'Dibujos, cuando fueren necesarios para comprender la invención', mandatory: false, basis: 'Decisión 486, art. 26 lit. d' },
      { n: 6, name: 'Resumen', mandatory: true, basis: 'Decisión 486, art. 26 lit. e' },
      { n: 7, name: 'Poderes, cuando fueren necesarios', mandatory: false, basis: 'Decisión 486, art. 26 lit. f' },
      { n: 8, name: 'Comprobante de pago de las tasas establecidas', mandatory: true, basis: 'Decisión 486, art. 26 lit. g' },
      { n: 9, name: 'Copia del contrato de acceso, cuando la invención se obtuvo o desarrolló a partir de recursos genéticos o sus productos derivados', mandatory: false, basis: 'Decisión 486, art. 26 lit. h' },
      { n: 10, name: 'Copia del documento de licencia o autorización de uso de conocimientos tradicionales, cuando proceda', mandatory: false, basis: 'Decisión 486, art. 26 lit. i' },
      { n: 11, name: 'Certificado de depósito del material biológico, cuando proceda', mandatory: false, basis: 'Decisión 486, art. 26 lit. j' },
      { n: 12, name: 'Documento de cesión del derecho a la patente del inventor al solicitante, cuando proceda', mandatory: false, basis: 'Decisión 486, art. 26 lit. k' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/oposicion-a-la-solicitud-de-patente',
    exactName: 'Oposición a la solicitud de patente',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 42 (plazo de sesenta días y plazo adicional), 43 (traslado al solicitante), 44 y 45 (examen de patentabilidad), 14 a 21 (requisitos de patentabilidad y exclusiones)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Nuevas Creaciones',
    term: { status: 'VERIFICADO', description: 'SESENTA (60) DÍAS siguientes a la fecha de la publicación de la solicitud, por una sola vez: «Dentro del plazo de sesenta días siguientes a la fecha de la publicación, quien tenga legítimo interés, podrá presentar por una sola vez, oposición fundamentada que pueda desvirtuar la patentabilidad de la invención» (art. 42). A solicitud de parte, la oficina otorga por una sola vez un plazo adicional de sesenta (60) días para SUSTENTAR la oposición. Adviértase que «Las oposiciones temerarias podrán ser sancionadas si así lo disponen las normas nacionales» (art. 42, inciso final). El plazo de sesenta días que el art. 43 concede al solicitante para hacer valer sus argumentaciones es el reloj de la contraparte, no el del opositor.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la Superintendencia de Industria y Comercio — Dirección de Nuevas Creaciones', mandatory: true, basis: 'Decisión 486, art. 42' },
      { n: 2, name: 'Identificación del opositor y de la solicitud de patente publicada', mandatory: true, basis: 'Decisión 486, art. 42' },
      { n: 3, name: 'Acreditación del legítimo interés', mandatory: true, basis: 'Decisión 486, art. 42' },
      { n: 4, name: 'Fundamentación: falta de novedad, de nivel inventivo o de aplicación industrial, o exclusión de patentabilidad', mandatory: true, basis: 'Decisión 486, arts. 14 a 21 y 42' },
      { n: 5, name: 'Estado de la técnica invocado, con documentos y fechas', mandatory: true, basis: 'Decisión 486, art. 16' },
      { n: 6, name: 'Pruebas, o anuncio de sustentación en el plazo adicional de sesenta días', mandatory: true, basis: 'Decisión 486, art. 42' },
      { n: 7, name: 'Petición de denegación de la patente', mandatory: true, basis: 'Decisión 486, art. 48' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/demanda-por-infraccion-de-derechos-de-propiedad-industrial',
    exactName: 'Demanda por infracción de derechos de propiedad industrial',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 238 (legitimación y acción), 239 (daños por uso previo a la concesión), 241 (medidas que puede ordenar la autoridad), 243 (criterios de la indemnización), 244 (prescripción); Ley 1564 de 2012 (CGP), art. 24 num. 3 lit. a) y parágrafos 1 y 3, y art. 368',
    competentAuthority: 'A prevención: la Superintendencia de Industria y Comercio, en ejercicio de funciones jurisdiccionales, «en los procesos de infracción de derechos de propiedad industrial» (Ley 1564 de 2012, art. 24 num. 3 lit. a), o el juez civil competente. El parágrafo 1 del art. 24 dispone que estas funciones «generan competencia a prevención y, por ende, no excluyen la competencia otorgada por la ley a las autoridades judiciales».',
    term: { status: 'VERIFICADO', description: 'PRESCRIPCIÓN CON DOS TÉRMINOS, Y CORRE EL QUE VENZA PRIMERO: «La acción por infracción prescribirá a los DOS AÑOS contados desde la fecha en que el titular tuvo conocimiento de la infracción o en todo caso, a los CINCO AÑOS contados desde que se cometió la infracción por última vez» (Decisión 486, art. 244). Ése es el reloj del cliente. El titular de una patente puede además reclamar daños y perjuicios por el uso no autorizado ocurrido entre la publicación de la solicitud y la concesión (art. 239). El proceso se tramita «a través de las mismas vías procesales previstas en la ley para los jueces» (Ley 1564 de 2012, art. 24 parágrafo 3) y, al no tener trámite especial, se sujeta al proceso verbal (art. 368) salvo que por la cuantía corresponda el verbal sumario. Advertencia sobre la vía de impugnación: «Las providencias que profieran las autoridades administrativas en ejercicio de funciones jurisdiccionales no son impugnables ante la jurisdicción contencioso administrativa» (art. 24 parágrafo 3); la apelación la resuelve la autoridad judicial superior funcional del juez que hubiese sido competente.' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad: Superintendencia de Industria y Comercio en ejercicio de funciones jurisdiccionales, o juez civil', mandatory: true, basis: 'Ley 1564 de 2012, art. 24 num. 3 lit. a' },
      { n: 2, name: 'Identificación de las partes y acreditación de la titularidad del derecho infringido', mandatory: true, basis: 'Decisión 486, art. 238' },
      { n: 3, name: 'Certificado de registro de la marca o título de la patente y prueba de su vigencia', mandatory: true, basis: 'Decisión 486, arts. 50 y 154' },
      { n: 4, name: 'Hechos que constituyen la infracción, o los actos que manifiestan su inminencia', mandatory: true, basis: 'Decisión 486, art. 238' },
      { n: 5, name: 'Pretensiones: cese de los actos, indemnización, retiro de los circuitos comerciales, prohibición de importación o exportación, destrucción y publicación de la sentencia', mandatory: true, basis: 'Decisión 486, art. 241' },
      { n: 6, name: 'Criterios de la indemnización: daño emergente y lucro cesante, beneficios del infractor o precio de una licencia contractual', mandatory: false, basis: 'Decisión 486, art. 243' },
      { n: 7, name: 'Verificación expresa de que la acción no ha prescrito conforme al art. 244', mandatory: true, basis: 'Decisión 486, art. 244' },
      { n: 8, name: 'Solicitud de medidas cautelares, si se piden con la demanda', mandatory: false, basis: 'Decisión 486, art. 245' },
      { n: 9, name: 'Pruebas y anexos', mandatory: true, basis: 'Ley 1564 de 2012, art. 84' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/solicitud-de-medidas-cautelares-por-infraccion-de-derechos-de-propiedad-industrial',
    exactName: 'Solicitud de medidas cautelares por infracción de derechos de propiedad industrial',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 245 (oportunidad), 246 (catálogo de medidas), 247 (requisitos y caución), 248 (notificación posterior, revisión y caducidad de la medida), 249 (bienes sobre los que recaen)',
    competentAuthority: 'La misma autoridad que conoce o conocerá de la acción por infracción: la Superintendencia de Industria y Comercio en ejercicio de funciones jurisdiccionales, o el juez civil (Ley 1564 de 2012, art. 24 num. 3 lit. a y parágrafo 1)',
    term: { status: 'VERIFICADO', description: 'Las medidas «podrán pedirse antes de iniciar la acción, conjuntamente con ella o con posterioridad a su inicio» (art. 245). EL RELOJ QUE DESTRUYE LA MEDIDA: «Salvo norma interna en contrario, toda medida cautelar ejecutada sin intervención de la otra parte quedará SIN EFECTO DE PLENO DERECHO si la acción de infracción no se iniciara dentro de los DIEZ DÍAS siguientes contados desde la ejecución de la medida» (art. 248). Ése es el plazo del solicitante y se cuenta desde la EJECUCIÓN, no desde la notificación ni desde el decreto. Además, quien pide la medida debe acreditar su legitimación, la existencia del derecho infringido y presentar pruebas que permitan presumir razonablemente la comisión de la infracción o su inminencia, y la autoridad puede exigirle caución o garantía suficiente antes de ordenarla (art. 247). Ejecutada sin audiencia de la otra parte, se notifica a la parte afectada inmediatamente después de la ejecución, y ésta puede recurrir para que se revise (art. 248).' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante y acreditación de su legitimación para actuar', mandatory: true, basis: 'Decisión 486, art. 247' },
      { n: 2, name: 'Acreditación de la existencia y vigencia del derecho de propiedad industrial infringido', mandatory: true, basis: 'Decisión 486, art. 247' },
      { n: 3, name: 'Pruebas que permitan presumir razonablemente la comisión de la infracción o su inminencia', mandatory: true, basis: 'Decisión 486, art. 247' },
      { n: 4, name: 'Descripción suficientemente detallada y precisa de los productos presuntamente infractores', mandatory: true, basis: 'Decisión 486, art. 247' },
      { n: 5, name: 'Medidas concretas que se piden: cese inmediato, retiro de circuitos comerciales, suspensión de importación o exportación, garantía del presunto infractor o cierre temporal del establecimiento', mandatory: true, basis: 'Decisión 486, art. 246' },
      { n: 6, name: 'Ofrecimiento de caución o garantía', mandatory: false, basis: 'Decisión 486, art. 247' },
      { n: 7, name: 'Manifestación de que la acción por infracción se iniciará dentro de los diez días siguientes a la ejecución, cuando la medida se pida antes de la demanda', mandatory: true, basis: 'Decisión 486, art. 248' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/solicitud-de-medidas-en-frontera-por-infraccion-de-marca',
    exactName: 'Solicitud de medidas en frontera por infracción de marca',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 250 (solicitud de suspensión de la operación aduanera), 251 (inspección de las mercancías retenidas), 252 (orden o denegación de la suspensión y su notificación), 253 (levantamiento por no iniciar la acción), 254 (recurso del afectado), 255 (destino de las mercancías), 256 (exclusión de pequeñas cantidades sin carácter comercial)',
    competentAuthority: 'Autoridad aduanera nacional, ante la cual se pide suspender la operación de importación o exportación (Decisión 486, art. 250, que remite a «las condiciones y garantías que establezcan las normas internas del País Miembro»); la acción por infracción se inicia ante la Superintendencia de Industria y Comercio o el juez civil (Ley 1564 de 2012, art. 24 num. 3 lit. a). VER LA ADVERTENCIA DE _meta_unverified SOBRE LA NORMA INTERNA.',
    term: { status: 'NO_VERIFICADO', description: 'EL RELOJ DEL TITULAR ES DE DIEZ DÍAS HÁBILES Y SU VENCIMIENTO LIBERA LA MERCANCÍA: «Transcurridos DIEZ DÍAS HÁBILES contados desde la fecha de notificación de la suspensión de la operación aduanera sin que el demandante hubiere iniciado la acción por infracción, o sin que la autoridad nacional competente hubiere prolongado la suspensión, la medida se levantará y se procederá al despacho de las mercancías retenidas» (art. 253). Se cuenta desde la NOTIFICACIÓN de la suspensión, no desde la solicitud. Legitimación: «El titular de un registro de marca, que tuviera motivos fundados para suponer que se va a realizar la importación o la exportación de productos que infringen ese registro, podrá solicitar a la autoridad nacional competente suspender esa operación aduanera» (art. 250). Iniciada la acción, la parte contra quien obró la medida puede recurrir, y la autoridad puede modificar, revocar o confirmar la suspensión (art. 254). Quedan excluidas las cantidades pequeñas sin carácter comercial que formen parte del equipaje personal de los viajeros o se envíen en pequeñas partidas (art. 256).' },
    requiredSections: [
      { n: 1, name: 'Identificación del titular del registro de marca y acreditación de su titularidad', mandatory: true, basis: 'Decisión 486, art. 250' },
      { n: 2, name: 'Exposición de los motivos fundados para suponer la importación o exportación infractora', mandatory: true, basis: 'Decisión 486, art. 250' },
      { n: 3, name: 'Información necesaria y descripción suficientemente detallada y precisa de los productos, para que puedan ser reconocidos', mandatory: true, basis: 'Decisión 486, art. 250' },
      { n: 4, name: 'Petición expresa de suspensión de la operación aduanera', mandatory: true, basis: 'Decisión 486, art. 250' },
      { n: 5, name: 'Constitución de las garantías que exijan las normas internas', mandatory: true, basis: 'Decisión 486, art. 250' },
      { n: 6, name: 'Solicitud de participar en la inspección de las mercancías retenidas', mandatory: false, basis: 'Decisión 486, art. 251' },
      { n: 7, name: 'Compromiso de iniciar la acción por infracción dentro de los diez días hábiles siguientes a la notificación de la suspensión', mandatory: true, basis: 'Decisión 486, art. 253' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/solicitud-de-registro-de-obra-ante-la-direccion-nacional-de-derecho-de-autor',
    exactName: 'Solicitud de registro de obra ante la Dirección Nacional de Derecho de Autor',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 44 de 1993, arts. 3 (qué se inscribe), 4 (objeto del registro, modificado por el art. 28 de la Ley 1915 de 2018), 5 (forma), 6 (inscripción como condición de publicidad y oponibilidad), 8 (obra inédita) y 9 (el Gobierno fija requisitos y procedimiento); Decisión Andina 351 de 1993, arts. 52 y 53 (ausencia de formalidades y carácter declarativo del registro); Ley 23 de 1982, art. 183 (enajenación en escritura pública o documento privado reconocido)',
    competentAuthority: 'Unidad Administrativa Especial Dirección Nacional de Derecho de Autor — Registro Nacional del Derecho de Autor (Ley 44 de 1993, arts. 3 y 9)',
    term: { status: 'NO_VERIFICADO', description: 'NO HAY PLAZO Y EL REGISTRO NO CREA EL DERECHO. «La protección que se otorga a las obras literarias y artísticas [...] no estará subordinada a ningún tipo de formalidad. En consecuencia, la omisión del registro no impide el goce o el ejercicio de los derechos reconocidos en la presente Decisión» (Decisión 351, art. 52), y «El registro es declarativo y no constitutivo de derechos. Sin perjuicio de ello, la inscripción en el registro presume ciertos los hechos y actos que en ella consten, salvo prueba en contrario» (art. 53). LO QUE SÍ TIENE CONSECUENCIA JURÍDICA ES LA INSCRIPCIÓN DE LOS ACTOS DE TRANSFERENCIA: «Todo acto en virtud del cual se enajene el Derecho de Autor, o los Derechos Conexos así como cualquier otro acto o contrato vinculado con estos derechos, deberá ser inscrito en el Registro Nacional del Derecho de Autor como condición de publicidad y oponibilidad ante terceros» (Ley 44 de 1993, art. 6). Sin inscripción, la cesión no es oponible a terceros. Distinto y con plazo propio es el DEPÓSITO LEGAL, que corresponde al editor y al productor y debe cumplirse «dentro de los 60 días hábiles siguientes a su publicación, transmisión pública, reproducción o importación», con sanción de un salario mínimo legal diario vigente por cada día de retraso, sin superar 10 salarios mínimos mensuales por ejemplar (Ley 44 de 1993, art. 7, modificado por el art. 28 de la Ley 1915 de 2018). El plazo que tiene la Dirección Nacional de Derecho de Autor para resolver la inscripción está en el reglamento y NO se verificó: ver _meta_unverified.' },
    requiredSections: [
      { n: 1, name: 'Designación de la Unidad Administrativa Especial Dirección Nacional de Derecho de Autor', mandatory: true, basis: 'Ley 44 de 1993, art. 3' },
      { n: 2, name: 'Identificación del solicitante y, en su caso, del apoderado', mandatory: true, basis: 'Ley 44 de 1993, art. 3' },
      { n: 3, name: 'Identificación del autor o autores y del titular de los derechos patrimoniales', mandatory: true, basis: 'Ley 23 de 1982, art. 10 parágrafo, adicionado por el art. 1 de la Ley 1915 de 2018' },
      { n: 4, name: 'Título, clase de obra y descripción o resumen del contenido', mandatory: true, basis: 'Ley 44 de 1993, art. 3' },
      { n: 5, name: 'Indicación de si la obra es inédita o divulgada, con fecha y lugar de divulgación', mandatory: true, basis: 'Ley 44 de 1993, art. 8' },
      { n: 6, name: 'Ejemplar o soporte de la obra que se acompaña', mandatory: true, basis: 'Ley 44 de 1993, art. 5' },
      { n: 7, name: 'Cuando se inscribe un acto de enajenación, el documento de transferencia en escritura pública o documento privado reconocido ante notario', mandatory: false, basis: 'Ley 23 de 1982, art. 183; Ley 44 de 1993, art. 6' },
      { n: 8, name: 'Firma del solicitante', mandatory: true, basis: 'Ley 44 de 1993, art. 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=3429'
  },
  {
    id: 'propiedad_intelectual/demanda-por-infraccion-de-derecho-de-autor-y-derechos-conexos',
    exactName: 'Demanda por infracción de derecho de autor y derechos conexos',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 23 de 1982, art. 242 (las cuestiones se resuelven por la justicia ordinaria) y art. 244 (secuestro preventivo); Ley 1915 de 2018, arts. 29 (procedimiento ante la jurisdicción), 30 (solicitud de información al infractor), 31 (destrucción de implementos y mercancía infractora), 32 (indemnizaciones preestablecidas) y 37 (vigencia y derogatorias); Decisión Andina 351 de 1993, arts. 55 a 57; Ley 1564 de 2012 (CGP), art. 24 num. 3 lit. b) y parágrafos 1 y 3, y arts. 368 y 390',
    competentAuthority: 'A prevención: la Dirección Nacional de Derecho de Autor, en ejercicio de funciones jurisdiccionales, «en los procesos relacionados con los derechos de autor y conexos» —literal declarado CONDICIONALMENTE EXEQUIBLE— (Ley 1564 de 2012, art. 24 num. 3 lit. b), o el juez civil competente. Las funciones jurisdiccionales de las autoridades administrativas «generan competencia a prevención y, por ende, no excluyen la competencia otorgada por la ley a las autoridades judiciales» (art. 24 parágrafo 1).',
    term: { status: 'NO_VERIFICADO', description: 'CUIDADO CON EL TRÁMITE, PORQUE LA REMISIÓN DEL CGP QUEDÓ SIN OBJETO. El art. 390 num. 5 del CGP somete al proceso verbal sumario «Los relacionados con los derechos de autor previstos en el artículo 243 de la Ley 23 de 1982», pero ese art. 243 fue DEROGADO expresamente: «La presente ley rige a partir de la fecha de su publicación y deroga los artículos 58 a 71 y 243 de la Ley 23 de 1982, así como las disposiciones que le sean contrarias» (Ley 1915 de 2018, art. 37). En consecuencia la demanda por infracción, al no tener trámite especial, se sujeta al proceso verbal (CGP art. 368), salvo que por la cuantía corresponda el verbal sumario, que es de única instancia (art. 390 parágrafo 1). Presunciones a favor del demandante: se presume, salvo prueba en contrario, que es titular la persona bajo cuyo nombre o seudónimo se divulgó la obra, y que la obra está protegida (Ley 23 de 1982, art. 10 parágrafo, adicionado por el art. 1 de la Ley 1915 de 2018), y quien adquirió los derechos por acto o contrato «serán consideradas como titulares de derechos ante cualquier jurisdicción» (art. 182 parágrafo 2, adicionado por el art. 10 de la Ley 1915 de 2018). NI LA LEY 23 DE 1982, NI LA LEY 44 DE 1993, NI LA LEY 1915 DE 2018, NI LA DECISIÓN 351 FIJAN UN TÉRMINO DE PRESCRIPCIÓN DE ESTA ACCIÓN: ver _meta_unverified. No debe suponerse aplicable el de dos y cinco años del art. 244 de la Decisión 486, que rige la propiedad industrial. Las providencias que la Dirección Nacional de Derecho de Autor profiera en ejercicio de funciones jurisdiccionales «no son impugnables ante la jurisdicción contencioso administrativa» (CGP art. 24 parágrafo 3).' },
    requiredSections: [
      { n: 1, name: 'Designación de la autoridad: Dirección Nacional de Derecho de Autor en ejercicio de funciones jurisdiccionales, o juez civil', mandatory: true, basis: 'Ley 1564 de 2012, art. 24 num. 3 lit. b' },
      { n: 2, name: 'Identificación de las partes y acreditación de la titularidad de los derechos patrimoniales', mandatory: true, basis: 'Ley 23 de 1982, art. 182 parágrafo 2, adicionado por el art. 10 de la Ley 1915 de 2018' },
      { n: 3, name: 'Identificación de la obra, interpretación, fonograma o emisión, y de su protección', mandatory: true, basis: 'Ley 23 de 1982, art. 10 parágrafo, adicionado por el art. 1 de la Ley 1915 de 2018' },
      { n: 4, name: 'Hechos que constituyen la infracción: reproducción, comunicación pública, distribución, importación, alquiler o transformación no autorizadas', mandatory: true, basis: 'Ley 23 de 1982, art. 12, modificado por el art. 3 de la Ley 1915 de 2018' },
      { n: 5, name: 'En su caso, elusión de medidas tecnológicas efectivas o supresión o alteración de la información sobre gestión de derechos', mandatory: false, basis: 'Ley 1915 de 2018, art. 12' },
      { n: 6, name: 'Pretensiones: cese de la actividad ilícita, indemnización, costas y retiro definitivo de los canales comerciales', mandatory: true, basis: 'Decisión 351, art. 57' },
      { n: 7, name: 'Elección expresa entre el sistema de indemnizaciones preestablecidas y las reglas generales sobre prueba del perjuicio', mandatory: false, basis: 'Ley 1915 de 2018, art. 32' },
      { n: 8, name: 'Petición de destrucción de materiales e implementos y de la mercancía infractora', mandatory: false, basis: 'Ley 1915 de 2018, art. 31' },
      { n: 9, name: 'Petición de que se ordene al infractor proporcionar información sobre los involucrados y los canales de distribución', mandatory: false, basis: 'Ley 1915 de 2018, art. 30' },
      { n: 10, name: 'Solicitud de medidas cautelares', mandatory: false, basis: 'Decisión 351, art. 56; Ley 23 de 1982, art. 244' },
      { n: 11, name: 'Pruebas y anexos', mandatory: true, basis: 'Ley 1564 de 2012, art. 84' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87419'
  },
  {
    id: 'propiedad_intelectual/resolucion-que-decide-la-solicitud-de-registro-de-marca-y-las-oposiciones',
    exactName: 'Resolución que decide la solicitud de registro de marca y las oposiciones',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decisión Andina 486 de 2000, art. 150 (examen de registrabilidad y decisión mediante resolución), arts. 134 a 136 (requisitos y causales de irregistrabilidad), art. 149 (inadmisión de oposiciones), art. 152 (duración); Decreto 4886 de 2011, art. 19 num. 1 y parágrafo; Ley 1437 de 2011, arts. 42 y 76',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos',
    term: { status: 'VERIFICADO', description: 'ES UNA SOLA RESOLUCIÓN, NO DOS: «Vencido el plazo establecido en el artículo 148, o si no se hubiesen presentado oposiciones, la oficina nacional competente procederá a realizar el examen de registrabilidad. En caso se hubiesen presentado oposiciones, la oficina nacional competente se pronunciará sobre éstas y sobre la concesión o denegatoria del registro de la marca mediante resolución» (Decisión 486, art. 150). La Decisión 486 no fija plazo a la oficina para proferirla. Concedido, el registro dura diez (10) años contados desde su concesión (art. 152). Contra la resolución SOLO procede el recurso de apelación —no reposición—, que se interpone dentro de los diez (10) días siguientes a la notificación y lo resuelve el Superintendente Delegado para la Propiedad Industrial (Decreto 4886 de 2011, art. 19 parágrafo y art. 18 num. 10; Ley 1437 de 2011, art. 76).' },
    requiredSections: [
      { n: 1, name: 'Encabezado: identificación de la Dirección, número y fecha de la resolución y del expediente', mandatory: true, basis: 'Ley 1437 de 2011, art. 42' },
      { n: 2, name: 'Identificación del solicitante, del signo, de los productos o servicios y de la clase', mandatory: true, basis: 'Decisión 486, art. 139' },
      { n: 3, name: 'Antecedentes: presentación, examen de forma, publicación y oposiciones presentadas', mandatory: true, basis: 'Decisión 486, arts. 144 a 148' },
      { n: 4, name: 'Pronunciamiento expreso sobre cada oposición, incluida su admisibilidad', mandatory: true, basis: 'Decisión 486, arts. 149 y 150' },
      { n: 5, name: 'Examen de registrabilidad: causales absolutas del art. 135 y relativas del art. 136', mandatory: true, basis: 'Decisión 486, arts. 135, 136 y 150' },
      { n: 6, name: 'Decisión de conceder o denegar el registro', mandatory: true, basis: 'Decisión 486, art. 150' },
      { n: 7, name: 'Indicación de que la duración es de diez años desde la concesión y de la carga de renovar', mandatory: false, basis: 'Decisión 486, arts. 152 y 153' },
      { n: 8, name: 'Indicación de los recursos que proceden, la autoridad ante quien se interponen y el plazo', mandatory: true, basis: 'Ley 1437 de 2011, arts. 42 y 76; Decreto 4886 de 2011, art. 19 parágrafo' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/resolucion-que-concede-o-niega-la-patente-de-invencion',
    exactName: 'Resolución que concede o niega la patente de invención',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 45 (notificación al solicitante y denegación por falta de respuesta), 46 (informes de expertos), 48 (contenido de la decisión), 50 (duración de veinte años), 51 (alcance de la protección); Decreto 4886 de 2011, art. 20 y su parágrafo; Ley 1437 de 2011, arts. 42 y 76',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Nuevas Creaciones',
    term: { status: 'VERIFICADO', description: '«Si el examen definitivo fuere favorable, se otorgará el título de la patente. Si fuere parcialmente favorable, se otorgará el título solamente para las reivindicaciones aceptadas. Si fuere desfavorable se denegará» (Decisión 486, art. 48). La denegación también procede si el solicitante no responde la notificación del art. 45 dentro de los sesenta (60) días, prorrogables por treinta (30), o si subsisten los impedimentos. La patente concedida «tendrá un plazo de duración de veinte años contado a partir de la fecha de presentación de la respectiva solicitud en el País Miembro» (art. 50): se cuenta desde la presentación, no desde la concesión, y omitirlo en la resolución induce a error sobre la vigencia real. Contra la resolución SOLO procede apelación ante el Superintendente Delegado para la Propiedad Industrial, dentro de los diez (10) días siguientes a la notificación (Decreto 4886 de 2011, art. 20 parágrafo y art. 18 num. 10; Ley 1437 de 2011, art. 76).' },
    requiredSections: [
      { n: 1, name: 'Encabezado: identificación de la Dirección, número y fecha de la resolución y del expediente', mandatory: true, basis: 'Ley 1437 de 2011, art. 42' },
      { n: 2, name: 'Identificación del solicitante, del inventor y del título de la invención', mandatory: true, basis: 'Decisión 486, arts. 26 y 27' },
      { n: 3, name: 'Antecedentes: presentación, examen de forma, publicación, oposiciones y petición del examen de patentabilidad', mandatory: true, basis: 'Decisión 486, arts. 38 a 44' },
      { n: 4, name: 'Pronunciamiento sobre las oposiciones presentadas', mandatory: true, basis: 'Decisión 486, arts. 42 y 43' },
      { n: 5, name: 'Examen de patentabilidad: novedad, nivel inventivo y aplicación industrial, y exclusiones', mandatory: true, basis: 'Decisión 486, arts. 14 a 21 y 45' },
      { n: 6, name: 'Decisión: concesión total, concesión parcial respecto de las reivindicaciones aceptadas, o denegación', mandatory: true, basis: 'Decisión 486, art. 48' },
      { n: 7, name: 'Reivindicaciones aceptadas y alcance de la protección conferida', mandatory: true, basis: 'Decisión 486, arts. 48 y 51' },
      { n: 8, name: 'Indicación de que la duración es de veinte años contados desde la fecha de presentación de la solicitud', mandatory: true, basis: 'Decisión 486, art. 50' },
      { n: 9, name: 'Indicación de los recursos que proceden, la autoridad y el plazo', mandatory: true, basis: 'Ley 1437 de 2011, arts. 42 y 76; Decreto 4886 de 2011, art. 20 parágrafo' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/resolucion-que-decide-la-cancelacion-del-registro-de-marca-por-no-uso',
    exactName: 'Resolución que decide la cancelación del registro de marca por no uso',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 165 (causal y plazos), 166 (qué se entiende por uso), 167 (carga de la prueba del uso), 168 (derecho preferente), 170 (traslado al titular y decisión mediante resolución)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Dirección de Signos Distintivos',
    term: { status: 'VERIFICADO', description: '«Recibida una solicitud de cancelación, la oficina nacional competente notificará al titular de la marca registrada para que dentro del plazo de sesenta días hábiles contados a partir de la notificación, haga valer los alegatos y las pruebas que estime convenientes. Vencidos los plazos a los que se refiere este artículo, la oficina nacional competente decidirá sobre la cancelación o no del registro de la marca, lo cual notificará a las partes, mediante resolución» (art. 170). La Decisión no fija plazo a la oficina para decidir. La carga de la prueba del uso corresponde al titular (art. 167), y no hay cancelación cuando el uso difiere de la forma registrada sólo en detalles o elementos que no alteran su carácter distintivo (art. 166). Quien obtuvo la cancelación tiene derecho preferente al registro (art. 168). Contra la resolución SOLO procede apelación, dentro de los diez (10) días siguientes a la notificación (Decreto 4886 de 2011, art. 19 parágrafo; Ley 1437 de 2011, art. 76).' },
    requiredSections: [
      { n: 1, name: 'Encabezado: identificación de la Dirección, número y fecha de la resolución y del expediente', mandatory: true, basis: 'Ley 1437 de 2011, art. 42' },
      { n: 2, name: 'Identificación del solicitante de la cancelación, del titular y del registro', mandatory: true, basis: 'Decisión 486, art. 165' },
      { n: 3, name: 'Antecedentes: solicitud, notificación al titular y alegatos y pruebas presentados', mandatory: true, basis: 'Decisión 486, art. 170' },
      { n: 4, name: 'Verificación del período de carencia de tres años desde la firmeza del registro', mandatory: true, basis: 'Decisión 486, art. 165' },
      { n: 5, name: 'Valoración de la prueba del uso aportada por el titular en al menos un País Miembro', mandatory: true, basis: 'Decisión 486, arts. 166 y 167' },
      { n: 6, name: 'Decisión de cancelar total o parcialmente, o de negar la cancelación', mandatory: true, basis: 'Decisión 486, arts. 165 y 170' },
      { n: 7, name: 'Pronunciamiento sobre el derecho preferente, cuando proceda', mandatory: false, basis: 'Decisión 486, art. 168' },
      { n: 8, name: 'Indicación de los recursos que proceden, la autoridad y el plazo', mandatory: true, basis: 'Ley 1437 de 2011, arts. 42 y 76; Decreto 4886 de 2011, art. 19 parágrafo' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/resolucion-que-resuelve-el-recurso-de-apelacion-en-materia-de-propiedad-industrial',
    exactName: 'Resolución que resuelve el recurso de apelación en materia de propiedad industrial',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 4886 de 2011, art. 18 num. 10 (competencia del Superintendente Delegado para la Propiedad Industrial); Ley 1437 de 2011 (CPACA), arts. 79 (trámite en efecto suspensivo y pruebas), 80 (decisión motivada que resuelve todas las peticiones), 42 (contenido de la decisión) y 87 (firmeza del acto)',
    competentAuthority: 'Superintendencia de Industria y Comercio — Despacho del Superintendente Delegado para la Propiedad Industrial, a quien corresponde «Decidir los recursos de reposición y las solicitudes de revocatoria directa que se interpongan contra los actos que expida en primera instancia, así como los de apelación que se interpongan contra los actos expedidos por los Directores a su cargo» (Decreto 4886 de 2011, art. 18 num. 10)',
    term: { status: 'VERIFICADO', description: '«Los recursos se tramitarán en el efecto suspensivo. Los recursos de reposición y de apelación deberán resolverse de plano, a no ser que al interponerlos se haya solicitado la práctica de pruebas, o que el funcionario que ha de decidir el recurso considere necesario decretarlas de oficio» (Ley 1437 de 2011, art. 79). Cuando haya que practicar pruebas se señala un término no mayor de treinta (30) días, prorrogable por una sola vez sin que con la prórroga exceda de treinta días; si interviene más de una parte y se presentan pruebas con el recurso, se da traslado a las demás por cinco (5) días (art. 79). «Vencido el período probatorio, si a ello hubiere lugar, y sin necesidad de acto que así lo declare, deberá proferirse la decisión motivada que resuelva el recurso. La decisión resolverá todas las peticiones que hayan sido oportunamente planteadas y las que surjan con motivo del recurso» (art. 80). Con esta resolución se agota la vía administrativa y queda abierta la acción ante la jurisdicción de lo contencioso administrativo.' },
    requiredSections: [
      { n: 1, name: 'Encabezado: identificación del Despacho, número y fecha de la resolución y del expediente', mandatory: true, basis: 'Ley 1437 de 2011, art. 42' },
      { n: 2, name: 'Identificación del recurrente, del acto recurrido y de la fecha de su notificación', mandatory: true, basis: 'Ley 1437 de 2011, art. 77' },
      { n: 3, name: 'Verificación de la oportunidad y de los requisitos del recurso', mandatory: true, basis: 'Ley 1437 de 2011, arts. 76 y 77' },
      { n: 4, name: 'Síntesis de los motivos de inconformidad', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 2' },
      { n: 5, name: 'Pronunciamiento sobre las pruebas practicadas, cuando se decretaron', mandatory: false, basis: 'Ley 1437 de 2011, art. 79' },
      { n: 6, name: 'Consideraciones sobre cada uno de los cargos y sobre las peticiones surgidas con motivo del recurso', mandatory: true, basis: 'Ley 1437 de 2011, art. 80' },
      { n: 7, name: 'Decisión: confirmar, aclarar, modificar, adicionar o revocar el acto recurrido', mandatory: true, basis: 'Ley 1437 de 2011, arts. 74 y 80' },
      { n: 8, name: 'Constancia de que contra la decisión no procede recurso alguno y de que queda agotada la vía administrativa', mandatory: true, basis: 'Ley 1437 de 2011, art. 87' }
    ],
    sourceUrl: 'http://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011_pr001.html'
  },
  {
    id: 'propiedad_intelectual/sentencia-de-infraccion-de-derechos-de-propiedad-industrial',
    exactName: 'Sentencia de infracción de derechos de propiedad industrial',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 238 (acción), 240 (carga de la prueba en patentes de procedimiento), 241 (medidas que se pueden ordenar), 243 (criterios de la indemnización), 244 (prescripción); Ley 1564 de 2012 (CGP), art. 24 num. 3 lit. a) y parágrafos 1 y 3, art. 280 (contenido de la sentencia) y art. 365 (costas)',
    competentAuthority: 'Superintendencia de Industria y Comercio en ejercicio de funciones jurisdiccionales, o juez civil competente (Ley 1564 de 2012, art. 24 num. 3 lit. a y parágrafo 1)',
    term: { status: 'VERIFICADO', description: 'El catálogo de lo que la sentencia puede ordenar está tasado en el art. 241 de la Decisión 486: cese de los actos que constituyen la infracción, indemnización de daños y perjuicios, retiro de los circuitos comerciales de los productos y de los materiales y medios que sirvieran predominantemente para cometerla, prohibición de su importación o exportación, adjudicación en propiedad imputable al importe de la indemnización, medidas necesarias para evitar la continuación o la repetición, destrucción y publicación de la sentencia a costa del infractor. La indemnización se calcula «teniendo en cuenta, entre otros, los criterios siguientes: a) el daño emergente y el lucro cesante [...]; b) el monto de los beneficios obtenidos por el infractor [...]; o, c) el precio que el infractor habría pagado por concepto de una licencia contractual» (art. 243). La sentencia debe pronunciarse sobre la prescripción del art. 244 cuando se proponga. Advertencia sobre la impugnación: las apelaciones de las providencias que la Superintendencia profiera en primera instancia «se resolverán por la autoridad judicial superior funcional del juez que hubiese sido competente en caso de haberse tramitado la primera instancia ante un juez», y cuando el juez habría conocido en única instancia el asunto se tramita en única instancia; esas providencias «no son impugnables ante la jurisdicción contencioso administrativa» (CGP art. 24 parágrafo 3).' },
    requiredSections: [
      { n: 1, name: 'Encabezado: autoridad, radicado, partes y fecha', mandatory: true, basis: 'Ley 1564 de 2012, art. 280' },
      { n: 2, name: 'Síntesis de la demanda, de la contestación y de las excepciones propuestas', mandatory: true, basis: 'Ley 1564 de 2012, art. 280' },
      { n: 3, name: 'Pronunciamiento sobre la titularidad y la vigencia del derecho de propiedad industrial invocado', mandatory: true, basis: 'Decisión 486, arts. 50, 152 y 238' },
      { n: 4, name: 'Pronunciamiento sobre la excepción de prescripción de la acción por infracción', mandatory: true, basis: 'Decisión 486, art. 244' },
      { n: 5, name: 'Valoración probatoria y determinación de los actos infractores', mandatory: true, basis: 'Decisión 486, arts. 52, 155 y 238' },
      { n: 6, name: 'Órdenes de cese, retiro de los circuitos comerciales, prohibición de importación o exportación, adjudicación, destrucción y publicación', mandatory: true, basis: 'Decisión 486, art. 241' },
      { n: 7, name: 'Liquidación de la indemnización con arreglo a los criterios del art. 243', mandatory: true, basis: 'Decisión 486, art. 243' },
      { n: 8, name: 'Condena en costas', mandatory: true, basis: 'Ley 1564 de 2012, art. 365' },
      { n: 9, name: 'Recursos que proceden y autoridad que los resuelve', mandatory: true, basis: 'Ley 1564 de 2012, art. 24 parágrafo 3' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/auto-que-decreta-medidas-cautelares-por-infraccion-de-derechos-de-propiedad-industrial',
    exactName: 'Auto que decreta medidas cautelares por infracción de derechos de propiedad industrial',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decisión Andina 486 de 2000, arts. 245 (oportunidad), 246 (catálogo de medidas), 247 (requisitos y caución), 248 (notificación posterior, revisión y caducidad por no iniciar la acción en diez días), 249 (bienes sobre los que recaen)',
    competentAuthority: 'Superintendencia de Industria y Comercio en ejercicio de funciones jurisdiccionales, o juez civil competente (Ley 1564 de 2012, art. 24 num. 3 lit. a)',
    term: { status: 'VERIFICADO', description: '«Una medida cautelar sólo se ordenará cuando quien la pida acredite su legitimación para actuar, la existencia del derecho infringido y presente pruebas que permitan presumir razonablemente la comisión de la infracción o su inminencia. La autoridad nacional competente podrá requerir que quien pida la medida otorgue caución o garantía suficientes antes de ordenarla» (art. 247). EL AUTO DEBE ADVERTIR EL PLAZO QUE DESTRUYE LA MEDIDA: «Salvo norma interna en contrario, toda medida cautelar ejecutada sin intervención de la otra parte quedará sin efecto de pleno derecho si la acción de infracción no se iniciara dentro de los diez días siguientes contados desde la ejecución de la medida» (art. 248). Ejecutada sin audiencia de la otra parte, «ella se notificará a la parte afectada inmediatamente después de la ejecución», y ésta «podrá recurrir ante la autoridad nacional competente para que revise la medida ejecutada», que puede ser modificada, revocada o confirmada (art. 248). Las medidas recaen sobre los productos resultantes de la presunta infracción y sobre los materiales o medios que sirvieran principalmente para cometerla (art. 249).' },
    requiredSections: [
      { n: 1, name: 'Encabezado: autoridad, radicado, partes y fecha', mandatory: true, basis: 'Ley 1564 de 2012, art. 279' },
      { n: 2, name: 'Verificación de la legitimación del solicitante y de la existencia del derecho invocado', mandatory: true, basis: 'Decisión 486, art. 247' },
      { n: 3, name: 'Valoración de las pruebas que permiten presumir razonablemente la infracción o su inminencia', mandatory: true, basis: 'Decisión 486, art. 247' },
      { n: 4, name: 'Identificación precisa de los productos, materiales o medios sobre los que recae la medida', mandatory: true, basis: 'Decisión 486, arts. 247 y 249' },
      { n: 5, name: 'Medidas que se decretan, dentro del catálogo del art. 246', mandatory: true, basis: 'Decisión 486, art. 246' },
      { n: 6, name: 'Fijación de la caución o garantía y de su monto', mandatory: false, basis: 'Decisión 486, art. 247' },
      { n: 7, name: 'Advertencia de que la medida ejecutada sin intervención de la otra parte quedará sin efecto de pleno derecho si la acción no se inicia dentro de los diez días siguientes a su ejecución', mandatory: true, basis: 'Decisión 486, art. 248' },
      { n: 8, name: 'Orden de notificar a la parte afectada inmediatamente después de la ejecución, con indicación del recurso de revisión de la medida', mandatory: true, basis: 'Decisión 486, art. 248' }
    ],
    sourceUrl: 'https://www.tribunalandino.org.ec/decisiones/normativa/DEC486.pdf'
  },
  {
    id: 'propiedad_intelectual/sentencia-de-infraccion-de-derecho-de-autor-y-derechos-conexos',
    exactName: 'Sentencia de infracción de derecho de autor y derechos conexos',
    branch: 'PROPIEDAD_INTELECTUAL',
    role: 'DESPACHO',
    legalBasis: 'Decisión Andina 351 de 1993, arts. 55 (debido proceso), 56 (medidas cautelares) y 57 (reparación, costas y retiro de los canales comerciales); Ley 1915 de 2018, arts. 29 (procedimiento ante la jurisdicción), 30 (orden de proporcionar información), 31 (destrucción de implementos y mercancía infractora) y 32 (indemnizaciones preestablecidas); Ley 1564 de 2012 (CGP), art. 24 num. 3 lit. b) y parágrafo 3, art. 280 y art. 365',
    competentAuthority: 'Dirección Nacional de Derecho de Autor en ejercicio de funciones jurisdiccionales —literal declarado CONDICIONALMENTE EXEQUIBLE— o juez civil competente (Ley 1564 de 2012, art. 24 num. 3 lit. b y parágrafo 1)',
    term: { status: 'VERIFICADO', description: 'Lo que la sentencia puede ordenar: «a) El pago al titular del derecho infringido de una reparación o indemnización adecuada en compensación por los daños y perjuicios sufridos con motivo de la violación de su derecho; b) Que el infractor asuma el pago de las costas del proceso en que haya incurrido el titular del derecho infringido; c) El retiro definitivo de los canales comerciales, de los ejemplares que constituyan infracción del derecho; d) Las sanciones penales equivalentes a aquellas que se aplican a delitos de similar magnitud» (Decisión 351, art. 57). Además, «En el caso de mercancías consideradas infractoras, el juez deberá ordenar su destrucción, a cargo de quien resulte condenado en el proceso, a menos que el titular de derecho consienta en que se disponga de ellas de otra forma», y en ningún caso puede permitirse su exportación salvo circunstancias excepcionales (Ley 1915 de 2018, art. 31). LA ELECCIÓN DEL RÉGIMEN INDEMNIZATORIO ES DEL DEMANDANTE, NO DEL DESPACHO: la indemnización «podrá sujetarse al sistema de indemnizaciones preestablecidas o a las reglas generales sobre prueba de la indemnización de perjuicios, a elección del titular del derecho infringido» (Ley 1915 de 2018, art. 32). Las providencias dictadas en ejercicio de funciones jurisdiccionales «no son impugnables ante la jurisdicción contencioso administrativa» (CGP art. 24 parágrafo 3).' },
    requiredSections: [
      { n: 1, name: 'Encabezado: autoridad, radicado, partes y fecha', mandatory: true, basis: 'Ley 1564 de 2012, art. 280' },
      { n: 2, name: 'Síntesis de la demanda, de la contestación y de las excepciones propuestas', mandatory: true, basis: 'Ley 1564 de 2012, art. 280' },
      { n: 3, name: 'Pronunciamiento sobre la titularidad de los derechos y sobre la protección de la obra, con aplicación de las presunciones legales', mandatory: true, basis: 'Ley 23 de 1982, arts. 10 parágrafo y 182 parágrafo 2, adicionados por los arts. 1 y 10 de la Ley 1915 de 2018' },
      { n: 4, name: 'Determinación de los actos de explotación no autorizados', mandatory: true, basis: 'Ley 23 de 1982, art. 12, modificado por el art. 3 de la Ley 1915 de 2018' },
      { n: 5, name: 'Pronunciamiento sobre las limitaciones y excepciones invocadas', mandatory: false, basis: 'Ley 1915 de 2018, art. 16' },
      { n: 6, name: 'Orden de cese e indemnización, con indicación del régimen elegido por el titular', mandatory: true, basis: 'Decisión 351, art. 57; Ley 1915 de 2018, art. 32' },
      { n: 7, name: 'Orden de retiro definitivo de los canales comerciales y de destrucción de mercancías e implementos infractores', mandatory: true, basis: 'Decisión 351, art. 57; Ley 1915 de 2018, art. 31' },
      { n: 8, name: 'Condena en costas', mandatory: true, basis: 'Decisión 351, art. 57 lit. b; Ley 1564 de 2012, art. 365' },
      { n: 9, name: 'Recursos que proceden y autoridad que los resuelve', mandatory: true, basis: 'Ley 1564 de 2012, art. 24 parágrafo 3' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87419'
  }
  ]
};
