import type { BranchCatalog } from '../types';

/**
 * AMBIENTAL catalogue.
 *
 * Generated from research/actuaciones-ambiental.json, whose entries were verified against the
 * official text of the governing norms. Do not hand-edit: regenerate with
 * `python backend/scripts/build-catalog.py` so data and provenance never drift.
 *
 * Coverage is partial by design and the gaps are declared below rather than
 * hidden, because a silent gap in procedural deadlines is the dangerous kind.
 */
export const AMBIENTAL_CATALOG: BranchCatalog = {
  meta: {
    branch: 'AMBIENTAL',
    verifiedAt: '2026-08-26',
    sourceOfTruth: 'Ley 1333 de 2009, procedimiento sancionatorio ambiental, reformada de raiz por la Ley 2387 de 2024. El art. 8 de esa reforma introdujo la etapa de alegatos de conclusion con traslado de diez dias del CPACA art. 48, en un articulo suelto que NO quedo incorporado al texto de la Ley 1333: es invisible para quien lee la ley compilada. El nuevo paragrafo del art. 10 fija un tope de cinco anos de duracion del procedimiento, prorrogable por otro tanto, junto a la caducidad de veinte anos. La presuncion de culpa o dolo del paragrafo del art. 1 y del paragrafo 1 del art. 5 sigue vigente: la C-595 de 2010 la declaro exequible y la Ley 2387 la reexpidio con el mismo texto. La reglamentacion va por el Decreto 1076 de 2015, cuyo art. 3.1.1 derogo integralmente los decretos 2041 de 2014, 3930 de 2010, 1791 de 1996 y 330 de 2007, entre otros, que siguen circulando como si vivieran.',
    gaps: [
    'AMBIENTAL: Acción popular para la protección del derecho colectivo al ambiente sano (Ley 472 de 1998): NO se catalogó. Ya está en CONSTITUCIONAL como \'Acción popular\', con su \'Auto admisorio de la acción popular\' y su \'Sentencia de acción popular\', y en ADMINISTRATIVO como \'Demanda de protección de los derechos e intereses colectivos\'. Duplicarla produciría exact_name ambiguo.',
    'AMBIENTAL: Demanda de nulidad y demanda de nulidad y restablecimiento del derecho contra el acto sancionatorio ambiental o contra el acto que otorga, modifica o cancela una licencia o permiso (Ley 99 de 1993, art. 73): NO se catalogó. La conducencia de la acción de nulidad es la única regla ambiental especial; el escrito, sus requisitos y su caducidad son los del CPACA y ya están en ADMINISTRATIVO como \'Demanda de nulidad simple (medio de control de nulidad)\' y \'Demanda de nulidad y restablecimiento del derecho\'.',
    'AMBIENTAL: el recurso de apelacion contra el acto sancionatorio ambiental YA TIENE FICHA PROPIA desde el 2026-08-28 ("Recurso de apelacion contra la resolucion sancionatoria ambiental"). Antes se remitia a la ficha generica de ADMINISTRATIVO, y esa remision escondia lo que aqui decide el caso: la Ley 1333 art. 30 solo lo concede "siempre que exista superior jerarquico", y no lo hay contra el Director de una CAR (Ley 99 de 1993, art. 23), contra el Director de la ANLA (Decreto 3573 de 2011, art. 9 num. 8) ni contra alcaldes y gobernadores (CPACA art. 74 num. 2). Si lo hay cuando la sancion se impuso por delegacion en un funcionario subalterno, y ahi la apelacion "sera obligatorio para acceder a la jurisdiccion" (CPACA art. 76).',
    'AMBIENTAL: Solicitud de revocación directa del acto sancionatorio ambiental: NO se catalogó. No hay regla ambiental especial; es la ficha de ADMINISTRATIVO \'Solicitud de revocación directa de actos administrativos\'.',
    'AMBIENTAL: Denuncia o querella por delitos contra los recursos naturales y el medio ambiente (Código Penal, Título XI): NO se cataloga en esta rama. Corresponde a PENAL. La Ley 1333, art. 21, ordena a la autoridad ambiental poner los hechos en conocimiento de la autoridad penal y dispone que el proceso penal no suspende el sancionatorio ambiental.',
    'AMBIENTAL: \'Objeción\' o recurso contra la medida preventiva ambiental: NO EXISTE COMO ACTUACION Y NO SE CATALOGO. El art. 32 de la Ley 1333 de 2009 dispone que contra las medidas preventivas \'no procede recurso alguno\'. Catalogar un recurso inexistente habría hecho perder tiempo y la única vía real -la solicitud de levantamiento del art. 35- sí quedó catalogada.',
    'AMBIENTAL: Cobro coactivo de la multa ambiental (Ley 1333, art. 42, modificado por la Ley 2387 de 2024, art. 7): NO se catalogó. El acto presta mérito ejecutivo y el cobro se surte por el procedimiento de jurisdicción coactiva del CPACA y del Estatuto Tributario, que no es materia ambiental propia.',
    'AMBIENTAL: Actuaciones de secretaría: no se catalogó ninguna ficha con role SECRETARÍA. La publicación en el boletín ambiental y la fijación del edicto de audiencia pública (Ley 99 de 1993, arts. 70 y 71; Decreto 1076 de 2015, art. 2.2.2.4.1.7) están reguladas como ordenes contenidas en los actos del despacho, y las normas no configuran un escrito autonomo de secretaría con contenido propio verificable.',
    'AMBIENTAL: Solicitud de sustracción de área de reserva forestal y solicitud de levantamiento de veda: no se catalogaron en esta pasada. Son trámites ambientales reales y con norma propia (Decreto 1076 de 2015, Título 2, Capítulo 2, y resoluciones del MinAmbiente), pero su procedimiento y términos no se leyeron íntegramente en fuente oficial en esta verificación y no se incluyeron para no publicar plazos sin comprobar.',
    'AMBIENTAL: Concesión de aguas, permiso de emisiones atmosféricas, permiso de recolección de especímenes y registro de plantaciones forestales: no se catalogaron en esta pasada, por la misma razón. Están compilados en el Decreto 1076 de 2015 y son candidatos naturales para una segunda pasada de esta rama.',
    'AMBIENTAL, verificado el esta pasada: PASO 0 - LA RAMA SE JUSTIFICA. (1) EL PROCEDIMIENTO EXISTE HOY, PERO NO COMO SE LE CITA HABITUALMENTE. La Ley 1333 de 2009 sigue rigiendo el procedimiento sancionatorio ambiental, pero fue reformada de raíz por la LEY 2387 DE 2024 (25 de julio de 2024), que modificó los arts. 1, 2, 3, 5, 6, 9, 20, 24, 27, 36, 37, 40, 42 y 49; adicionó los arts. 3A, 9A y 18A y un parágrafo al art. 10; y -en un artículo suelto que NO quedó incorporado al texto de la Ley 1333, su art. 8- introdujo la etapa de ALEGATOS DE CONCLUSIÓN del art. 48 de la Ley 1437 de 2011. Toda ficha construida sobre el texto original de la Ley 1333 está desactualizada. Verificado en https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html (arts. 1 a 46), https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009_pr001.html (arts. 47 a 66) y en el texto de la Ley 2387 de 2024 en https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=246696 . La Ley 99 de 1993 sigue vigente y sostiene el SINA, la competencia de las corporaciones y de la ANLA, el licenciamiento (arts. 49 a 62) y la participación ciudadana ambiental (arts. 69 a 74); verificada en https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=297 . Sus arts. 83 a 86 fueron subrogados por el art. 66 de la Ley 1333 de 2009. ADVERTENCIA DE FUENTE (doctrina, regla 3): funcionpublica pública los arts. 57 y 58 de la Ley 99 en su texto ORIGINAL, con nota de que fueron modificados por los arts. 223 y 224 de la Ley 1450 de 2011 y 1'
    ]
  },
  actuaciones: [
  {
    id: 'ambiental/descargos-en-el-procedimiento-sancionatorio-ambiental',
    exactName: 'Descargos en el procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1333 de 2009, art. 25 (término y contenido de los descargos); art. 24, modificado por la Ley 2387 de 2024, art. 16 (contra el pliego de cargos no procede recurso alguno); art. 1 par. y art. 5 par. 1, modificados por la Ley 2387 de 2024, arts. 2 y 6 (presunción de culpa o dolo y carga de la prueba del investigado)',
    competentAuthority: 'La autoridad ambiental que formuló los cargos: ANLA, Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana (Ley 99 de 1993, arts. 55 y 66), establecimiento público ambiental (Ley 768 de 2002, art. 13), Parques Nacionales Naturales o Ministerio de Ambiente y Desarrollo Sostenible (Ley 1333 de 2009, art. 1)',
    term: { status: 'VERIFICADO', description: 'EL RELOJ DEL CLIENTE SON DIEZ (10) DÍAS HÁBILES, y es el único de esta etapa: art. 25, «Dentro de los diez días hábiles siguientes a la notificación del pliego de cargos al presunto infractor este, directamente o mediante apoderado debidamente constituido, podrá presentar descargos por escrito y aportar o solicitar la práctica de las pruebas que estime pertinentes y que sean conducentes». No hay prorroga y las pruebas se piden AQUÍ o no se piden. No se debe esperar a un recurso contra el pliego: el art. 24, modificado por la Ley 2387 de 2024 art. 16, cierra esa puerta - «Contra el acto administrativo que formula cargos no procede recurso alguno». Los 80 días del art. 27 para decidir son plazo de la autoridad, no del investigado. Y la carga probatoria es del cliente: el art. 5 par. 1 dispone que «En las infracciones ambientales se presume la culpa o dolo del infractor, quien tendrá a su cargo desvirtuarla», presunción declarada EXEQUIBLE por la Corte Constitucional en la Sentencia C-595 de 2010.' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente sancionatorio, del acto de formulación de cargos y de su fecha de notificación', mandatory: true, basis: 'Art. 25' },
      { n: 2, name: 'Identificación del presunto infractor y, en su caso, poder al apoderado', mandatory: true, basis: 'Art. 25' },
      { n: 3, name: 'Constancia de oportunidad: cómputo de los diez (10) días hábiles desde la notificación del pliego', mandatory: true, basis: 'Art. 25' },
      { n: 4, name: 'Pronunciamiento sobre cada uno de los cargos formulados y sobre las normas ambientales que se estiman violadas', mandatory: true, basis: 'Art. 24' },
      { n: 5, name: 'Hechos y prueba dirigidos a desvirtuar la presunción de culpa o dolo', mandatory: true, basis: 'Art. 1 par. y art. 5 par. 1' },
      { n: 6, name: 'Causales de cesación del procedimiento que se invoquen', mandatory: false, basis: 'Art. 9' },
      { n: 7, name: 'Circunstancias atenuantes de responsabilidad', mandatory: false, basis: 'Art. 6' },
      { n: 8, name: 'Pruebas que se aportan con los descargos', mandatory: false, basis: 'Art. 25' },
      { n: 9, name: 'Pruebas cuya práctica se solicita, con indicación de conducencia, pertinencia y necesidad', mandatory: false, basis: 'Arts. 25 y 26' },
      { n: 10, name: 'Petición concreta de exoneración o de cesación del procedimiento', mandatory: true, basis: 'Arts. 9 y 27' },
      { n: 11, name: 'Notificaciones', mandatory: true, basis: 'Art. 19' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/solicitud-de-practica-de-pruebas-en-el-procedimiento-sancionatorio-ambiental',
    exactName: 'Solicitud de práctica de pruebas en el procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1333 de 2009, art. 25 (oportunidad para solicitarlas y costo a cargo del solicitante); art. 26 (decreto y práctica de pruebas y recurso contra su negativa); Ley 1437 de 2011, art. 76 (término del recurso de reposición)',
    competentAuthority: 'La autoridad ambiental que adelanta el procedimiento sancionatorio (Ley 1333 de 2009, art. 1)',
    term: { status: 'VERIFICADO', description: 'LA OPORTUNIDAD DEL CLIENTE ES LA MISMA DE LOS DESCARGOS: diez (10) días hábiles desde la notificación del pliego de cargos (art. 25), que autoriza al investigado a «aportar o solicitar la práctica de las pruebas que estime pertinentes y que sean conducentes». Vencido ese término la iniciativa pasa a la autoridad: el art. 26 dispone que «Vencido el término indicado en el artículo anterior, la autoridad ambiental ordenará la práctica de las pruebas que hubieren sido solicitadas de acuerdo con los criterios de conducencia, pertinencia y necesidad», y que «Las pruebas ordenadas se practicarán en un término de treinta (30) días, el cual podrá prorrogarse por una sola vez y hasta por 60 días» - esos 30 y 60 días son plazo de la autoridad. Dos advertencias con consecuencia económica y procesal: el par. del art. 25 pone los gastos a cargo de quien pide la prueba, y contra el auto que NIEGA la prueba procede reposición, que debe interponerse dentro de los diez (10) días siguientes a la notificación (Ley 1437 de 2011, art. 76).' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente y del acto de formulación de cargos', mandatory: true, basis: 'Art. 25' },
      { n: 2, name: 'Constancia de presentación dentro de los diez (10) días hábiles del traslado de cargos', mandatory: true, basis: 'Art. 25' },
      { n: 3, name: 'Enunciación de cada prueba solicitada', mandatory: true, basis: 'Art. 25' },
      { n: 4, name: 'Justificación de conducencia, pertinencia y necesidad de cada prueba', mandatory: true, basis: 'Art. 26' },
      { n: 5, name: 'Hecho concreto que cada prueba pretende demostrar frente a los cargos', mandatory: true, basis: 'Art. 26' },
      { n: 6, name: 'Manifestación sobre la asunción de los gastos de la prueba', mandatory: true, basis: 'Art. 25 par.' },
      { n: 7, name: 'Pruebas documentales que se aportan', mandatory: false, basis: 'Art. 25' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/alegatos-de-conclusion-en-el-procedimiento-sancionatorio-ambiental',
    exactName: 'Alegatos de conclusión en el procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 2387 de 2024, art. 8 (incorpora al procedimiento sancionatorio ambiental la etapa de alegatos de conclusión); Ley 1437 de 2011, art. 48 (traslado y término); Ley 1333 de 2009, art. 26 (periodo probatorio) y art. 27, modificado por la Ley 2387 de 2024, art. 9',
    competentAuthority: 'La autoridad ambiental que adelanta el procedimiento sancionatorio (Ley 1333 de 2009, art. 1)',
    term: { status: 'VERIFICADO', description: 'ETAPA NUEVA Y FÁCIL DE PERDER: no está en el texto de la Ley 1333 sino en un artículo suelto de la ley reformatoria. La Ley 2387 de 2024, art. 8, dispone que «el procedimiento sancionatorio ambiental previsto en la Ley 1333 de 2009 tendrá la etapa de alegatos de conclusión de que trata el artículo 48 de la Ley 1437 de 2011», y que «Los alegatos de conclusión procederán únicamente cuando se hayan practicado pruebas en el periodo probatorio previsto en el artículo 26 de la Ley 1333 de 2009». EL RELOJ DEL CLIENTE ES DE DIEZ (10) DÍAS: Ley 1437 de 2011, art. 48, «Vencido el periodo probatorio se dará traslado al investigado por diez (10) días para que presente los alegatos respectivos». Si no se practicaron pruebas no hay alegatos, y el término de 80 días del art. 27 corre desde el vencimiento del plazo de descargos.' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente y del auto que corrió traslado para alegar', mandatory: true, basis: 'Ley 1437 de 2011, art. 48' },
      { n: 2, name: 'Constancia de que se practicaron pruebas en el periodo probatorio', mandatory: true, basis: 'Ley 2387 de 2024, art. 8' },
      { n: 3, name: 'Constancia de presentación dentro de los diez (10) días del traslado', mandatory: true, basis: 'Ley 1437 de 2011, art. 48' },
      { n: 4, name: 'Síntesis de los cargos formulados', mandatory: true, basis: 'Ley 1333 de 2009, art. 24' },
      { n: 5, name: 'Valoración de cada prueba practicada y su incidencia en cada cargo', mandatory: true, basis: 'Ley 1333 de 2009, art. 26' },
      { n: 6, name: 'Argumentación dirigida a desvirtuar la presunción de culpa o dolo', mandatory: true, basis: 'Ley 1333 de 2009, art. 5 par. 1' },
      { n: 7, name: 'Atenuantes y ausencia de agravantes', mandatory: false, basis: 'Ley 1333 de 2009, arts. 6 y 7' },
      { n: 8, name: 'Petición de exoneración', mandatory: true, basis: 'Ley 1333 de 2009, art. 27' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=246696'
  },
  {
    id: 'ambiental/recurso-de-reposicion-contra-la-resolucion-sancionatoria-ambiental',
    exactName: 'Recurso de reposición contra la resolución sancionatoria ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1333 de 2009, art. 30 (recursos contra el acto que pone fin a la investigación sancionatoria ambiental); Ley 1437 de 2011, arts. 76 (oportunidad) y 77 (requisitos); Ley 1333 de 2009, art. 28 (notificación) y art. 42, modificado por la Ley 2387 de 2024, art. 7 (mérito ejecutivo)',
    competentAuthority: 'El mismo funcionario de la autoridad ambiental que profirió la resolución sancionatoria; la apelación, ante su superior jerárquico cuando exista (Ley 1333 de 2009, art. 30)',
    term: { status: 'VERIFICADO', description: 'EL RELOJ DEL CLIENTE ES DE DIEZ (10) DÍAS. La Ley 1333 no fija plazo propio: su art. 30 remite - «Contra el acto administrativo que ponga fin a una investigación sancionatoria ambiental procede el recurso de reposición y siempre que exista superior jerárquico, el de apelación, los cuales deberán ser interpuestos en los términos y condiciones señalados en el Código Contencioso Administrativo». Ese término hoy es el del art. 76 de la Ley 1437 de 2011: «Los recursos de reposición y apelación deberán interponerse por escrito en la diligencia de notificación personal, o dentro de los diez (10) días siguientes a ella, o a la notificación por aviso, o al vencimiento del término de publicación, según el caso». Dos advertencias: muchas autoridades ambientales carecen de superior jerárquico, de modo que la reposición es la única instancia y agota la vía administrativa; y la apelación, cuando procede, «será obligatorio para acceder a la jurisdicción» (art. 76). En firme el acto, si impone sanción pecuniaria presta mérito ejecutivo y se cobra por jurisdicción coactiva (art. 42).' },
    requiredSections: [
      { n: 1, name: 'Identificación de la resolución recurrida, de su fecha y forma de notificación', mandatory: true, basis: 'Ley 1333 de 2009, art. 28' },
      { n: 2, name: 'Constancia de interposición dentro de los diez (10) días siguientes a la notificación', mandatory: true, basis: 'Ley 1437 de 2011, art. 76' },
      { n: 3, name: 'Sustentación con expresión concreta de los motivos de inconformidad', mandatory: true, basis: 'Ley 1437 de 2011, art. 77' },
      { n: 4, name: 'Cuestionamiento de la declaratoria de responsabilidad y de la valoración probatoria', mandatory: true, basis: 'Ley 1333 de 2009, arts. 26 y 27' },
      { n: 5, name: 'Cuestionamiento de la proporcionalidad entre la sanción y las medidas compensatorias', mandatory: false, basis: 'Ley 1333 de 2009, art. 31' },
      { n: 6, name: 'Cuestionamiento de la tasación de la multa y de los criterios de graduación', mandatory: false, basis: 'Ley 1333 de 2009, arts. 40 y 43' },
      { n: 7, name: 'Interposición subsidiaria de la apelación cuando exista superior jerárquico', mandatory: false, basis: 'Ley 1333 de 2009, art. 30' },
      { n: 8, name: 'Nombre y dirección del recurrente y relación de pruebas que se aportan', mandatory: true, basis: 'Ley 1437 de 2011, art. 77' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/solicitud-de-levantamiento-de-medida-preventiva-ambiental',
    exactName: 'Solicitud de levantamiento de medida preventiva ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1333 de 2009, art. 35 (levantamiento de oficio o a petición de parte); art. 32 (carácter de las medidas preventivas y ausencia de recursos); art. 36 par. 2, modificado por la Ley 2387 de 2024, art. 19; art. 34 (costos); art. 16 (levantamiento por falta de mérito)',
    competentAuthority: 'La autoridad ambiental que impuso la medida preventiva, o la autoridad ambiental competente a la que se trasladaron las actuaciones cuando la medida se impuso a prevención (Ley 1333 de 2009, arts. 2 y 13 par. 2)',
    term: { status: 'NO_VERIFICADO', description: 'NO HAY RECURSO CONTRA LA MEDIDA PREVENTIVA, Y ESTA ES LA ÚNICA VÍA: el art. 32 dispone que las medidas preventivas «son de ejecución inmediata, tienen carácter preventivo y transitorio, surten efectos inmediatos, contra ellas no procede recurso alguno y se aplicarán sin perjuicio de las sanciones a que hubiere lugar». Quien busque reposición pierde el tiempo. El camino es el art. 35: «Las medidas preventivas se levantarán de oficio o a petición de parte, cuando se compruebe que han desaparecido las causas que las originaron». La ley no fija plazo para pedirlo ni para resolverlo: la petición procede en cualquier tiempo mientras la medida subsista, y el par. 2 del art. 36 fija su límite máximo - la medida se levanta «una vez se cumplan las condiciones impuestas para tal efecto, en los términos que dispone el artículo 35 de la presente ley, o hasta la expedición de la decisión que ponga fin al procedimiento; la cual se pronunciará sobre su levantamiento». Advertencia patrimonial del art. 34: «En caso del levantamiento de la medida, los costos deberán ser cancelados antes de poder devolver el bien o reiniciar o reabrir la obra». Y si la medida se impuso antes de abrir investigación, el art. 16 obliga a la autoridad a evaluar el mérito en un término no mayor a 10 días y a levantarla si no lo encuentra.' },
    requiredSections: [
      { n: 1, name: 'Identificación del acto administrativo que impuso la medida preventiva y del expediente', mandatory: true, basis: 'Art. 13' },
      { n: 2, name: 'Identificación del solicitante y acreditación de su interés sobre el bien, obra o actividad afectada', mandatory: true, basis: 'Art. 35' },
      { n: 3, name: 'Descripción de las causas que originaron la medida, según su motivación', mandatory: true, basis: 'Art. 13' },
      { n: 4, name: 'Prueba de que dichas causas desaparecieron o de que se cumplieron las condiciones impuestas', mandatory: true, basis: 'Arts. 35 y 36 par. 2' },
      { n: 5, name: 'Constancia de pago de los costos causados por la medida, cuando se pida la devolución del bien o la reapertura', mandatory: true, basis: 'Art. 34' },
      { n: 6, name: 'Petición concreta de levantamiento y, en su caso, de devolución de bienes', mandatory: true, basis: 'Art. 35' },
      { n: 7, name: 'Advertencia sobre la improcedencia de recursos contra la medida preventiva', mandatory: false, basis: 'Art. 32' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/solicitud-de-suspension-y-terminacion-anticipada-del-procedimiento-sancionatorio-ambiental-por-correccion-o-compensacion',
    exactName: 'Solicitud de suspensión y terminación anticipada del procedimiento sancionatorio ambiental por corrección o compensación',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1333 de 2009, art. 18A, adicionado por la Ley 2387 de 2024, art. 10; art. 10 par., adicionado por la Ley 2387 de 2024, art. 18 (suspensión de la caducidad); art. 57 (RUIA)',
    competentAuthority: 'La autoridad ambiental competente que adelanta el procedimiento sancionatorio (Ley 1333 de 2009, art. 1)',
    term: { status: 'VERIFICADO', description: 'OPORTUNIDAD DEL CLIENTE: «desde la iniciación del procedimiento sancionatorio cuando sea el caso y hasta antes de emitir la decisión que define la responsabilidad del presunto infractor» (art. 18A). Después de la resolución sancionatoria ya no procede. RELOJ PROPIO QUE SE PIERDE CON FACILIDAD: «una vez declarada la suspensión del procedimiento sancionatorio ambiental, el presunto infractor deberá presentar dentro de los siguientes cinco (5) días hábiles ante la autoridad ambiental competente, una garantía de cumplimiento». Plazos de la autoridad, no del cliente: un (1) mes para evaluar la propuesta (par. 1) y suspensión máxima de dos (2) años prorrogable hasta por la mitad. Contra la negativa procede reposición, «el cual será decidido en un plazo de diez (10) días» (par. 1). Causal de rechazo que debe verificarse antes de radicar: el beneficio «no podrá aplicarse a presuntos infractores que hayan accedido al mismo dentro de los cinco (5) años anteriores contados desde la firmeza del acto administrativo que declare la terminación del procedimiento» (par. 4). Durante la suspensión no corre la caducidad del art. 10.' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente sancionatorio y del estado del procedimiento', mandatory: true, basis: 'Art. 18A' },
      { n: 2, name: 'Constancia de que aún no se ha proferido la decisión que define la responsabilidad', mandatory: true, basis: 'Art. 18A' },
      { n: 3, name: 'Descripción de la afectación o daño ambiental ocasionado', mandatory: true, basis: 'Art. 18A' },
      { n: 4, name: 'Propuesta de medidas de corrección y/o compensación técnicamente soportadas y viables', mandatory: true, basis: 'Art. 18A' },
      { n: 5, name: 'Cronograma de ejecución directa de las medidas por el presunto infractor', mandatory: true, basis: 'Art. 18A' },
      { n: 6, name: 'Ofrecimiento de la garantía de cumplimiento a favor de la autoridad ambiental', mandatory: true, basis: 'Art. 18A' },
      { n: 7, name: 'Declaración de no haber accedido al beneficio en los cinco (5) años anteriores', mandatory: true, basis: 'Art. 18A par. 4' },
      { n: 8, name: 'Aceptación del cobro de los costos del procedimiento y del control y seguimiento', mandatory: true, basis: 'Art. 18A' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=246696'
  },
  {
    id: 'ambiental/solicitud-de-licencia-ambiental',
    exactName: 'Solicitud de licencia ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.2.3.6.2 (solicitud y requisitos, que compiló el art. 24 del Decreto 2041 de 2014); art. 2.2.2.3.6.3 (trámite de evaluación); arts. 2.2.2.3.2.2 y 2.2.2.3.2.3 (competencia); Ley 99 de 1993, arts. 49, 50 y 51',
    competentAuthority: 'La Autoridad Nacional de Licencias Ambientales - ANLA, de manera privativa en los proyectos del art. 2.2.2.3.2.2 del Decreto 1076 de 2015; o la Corporación Autónoma Regional, de Desarrollo Sostenible, Gran Centro Urbano o autoridad ambiental de la Ley 768 de 2002 con jurisdicción en el área, en los proyectos del art. 2.2.2.3.2.3',
    term: { status: 'VERIFICADO', description: 'EL RELOJ QUE MATA EL TRÁMITE ES DEL SOLICITANTE, NO DE LA AUTORIDAD: art. 2.2.2.3.6.3 num. 2, «El peticionario contará con un término de un (1) mes para allegar la información requerida; este término podrá ser prorrogado por la autoridad ambiental competente de manera excepcional, hasta antes del vencimiento del plazo y por un término igual, previa solicitud del interesado». La prorroga debe pedirse ANTES del vencimiento. La sanción es la muerte del expediente: num. 3, «En el evento que el solicitante no allegue la información en los términos establecidos en el numeral anterior, la autoridad ambiental ordenará el archivo de la solicitud de licencia ambiental y la devolución de la totalidad de la documentación aportada». La información adicional se pide UNA SOLA VEZ, en una reunión, y «solo podrá ser aportada por una única vez»; lo que se allegue de más no se considera. Plazos de la autoridad: acto de inicio inmediato, visita dentro de 20 días hábiles, 10 días hábiles para la reunión, 10 días hábiles para pedir conceptos a otras entidades y máximo 30 días hábiles para otorgar o negar (num. 5). La audiencia pública y el trámite de consulta previa suspenden esos términos (pars. 3 y 8). Contra la resolución proceden los recursos de la Ley 1437 de 2011: reposición dentro de los diez (10) días siguientes a la notificación (art. 76).' },
    requiredSections: [
      { n: 1, name: 'Formulario Único de Licencia Ambiental', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 1' },
      { n: 2, name: 'Estudio de Impacto Ambiental conforme a los términos de referencia y al Manual de Evaluación de Estudios Ambientales', mandatory: true, basis: 'Arts. 2.2.2.3.6.2 y 2.2.2.3.6.3 num. 2' },
      { n: 3, name: 'Planos que soporten el EIA en el Modelo de Almacenamiento Geográfico vigente', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 2' },
      { n: 4, name: 'Costo estimado de inversión y operación del proyecto', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 3' },
      { n: 5, name: 'Poder debidamente otorgado cuando se actue por apoderado', mandatory: false, basis: 'Art. 2.2.2.3.6.2 num. 4' },
      { n: 6, name: 'Constancia de pago o autoliquidación del servicio de evaluación', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 5' },
      { n: 7, name: 'Documento de identificación o certificado de existencia y representación legal', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 6' },
      { n: 8, name: 'Certificado del Ministerio del Interior sobre presencia de comunidades étnicas y territorios colectivos', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 7' },
      { n: 9, name: 'Radicación ante el ICANH del documento exigido por la Ley 1185 de 2008', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 8' },
      { n: 10, name: 'Formato de verificación preliminar de la documentación', mandatory: true, basis: 'Art. 2.2.2.3.6.2 num. 9' },
      { n: 11, name: 'Protocolización de la consulta previa o pronunciamiento de la DANCP sobre su no procedencia', mandatory: true, basis: 'Art. 2.2.2.3.6.3 par. 8' },
      { n: 12, name: 'Título minero o contrato de hidrocarburos, según el sector', mandatory: false, basis: 'Art. 2.2.2.3.6.2 par. 1' },
      { n: 13, name: 'Constancia de radicación de copia del EIA ante la autoridad ambiental regional, en casos de competencia de la ANLA', mandatory: false, basis: 'Art. 2.2.2.3.6.2 par. 2' },
      { n: 14, name: 'Pronunciamiento previo sobre la exigibilidad del Diagnóstico Ambiental de Alternativas, o el DAA surtido', mandatory: false, basis: 'Art. 2.2.2.3.6.2' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/solicitud-de-modificacion-de-licencia-ambiental',
    exactName: 'Solicitud de modificación de licencia ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.2.3.7.1 (causales de modificación); art. 2.2.2.3.7.2 (requisitos, que compiló el art. 30 del Decreto 2041 de 2014); art. 2.2.2.3.8.1 (trámite)',
    competentAuthority: 'La misma autoridad ambiental que otorgó la licencia: ANLA o la Corporación Autónoma Regional, de Desarrollo Sostenible o Gran Centro Urbano competente (Decreto 1076 de 2015, arts. 2.2.2.3.2.2 y 2.2.2.3.2.3)',
    term: { status: 'VERIFICADO', description: 'MISMO RELOJ DEL SOLICITANTE Y MISMA SANCIÓN: art. 2.2.2.3.8.1 num. 2, «El peticionario contará con un término de un (1) mes para allegar la información requerida; este término podrá ser prorrogado por la autoridad ambiental de manera excepcional, hasta antes del vencimiento del plazo y por un término igual, previa solicitud del interesado»; y num. 3, «Cuando el solicitante no allegue la información en los términos establecidos en el numeral anterior, la autoridad ambiental ordenará el archivo de la solicitud de modificación y la devolución de la totalidad de la documentación aportada». La información adicional se pide una sola vez y se aporta una sola vez. Plazos de la autoridad, más cortos que en la licencia inicial: visita dentro de 15 días hábiles, 5 días hábiles para la reunión, hasta 10 días hábiles para pedir conceptos y máximo 20 días hábiles para decidir (num. 5). Contra la decisión proceden los recursos de la Ley 1437 de 2011: reposición dentro de los diez (10) días siguientes a la notificación (art. 76).' },
    requiredSections: [
      { n: 1, name: 'Solicitud suscrita por el titular de la licencia o por su representante legal o apoderado', mandatory: true, basis: 'Art. 2.2.2.3.7.2 num. 1' },
      { n: 2, name: 'Identificación de la licencia ambiental que se pretende modificar', mandatory: true, basis: 'Art. 2.2.2.3.7.1' },
      { n: 3, name: 'Causal de modificación invocada', mandatory: true, basis: 'Art. 2.2.2.3.7.1' },
      { n: 4, name: 'Descripción de las obras o actividades objeto de modificación, con planos y mapas de localización', mandatory: true, basis: 'Art. 2.2.2.3.7.2 num. 2' },
      { n: 5, name: 'Costo de la modificación y su justificación', mandatory: true, basis: 'Art. 2.2.2.3.7.2 num. 2' },
      { n: 6, name: 'Complemento del estudio de impacto ambiental con los nuevos impactos y el ajuste al plan de manejo ambiental', mandatory: true, basis: 'Art. 2.2.2.3.7.2 num. 3' },
      { n: 7, name: 'Constancia de pago o autoliquidación del servicio de evaluación', mandatory: true, basis: 'Art. 2.2.2.3.7.2 num. 4' },
      { n: 8, name: 'Constancia de radicación del complemento del EIA ante la autoridad ambiental regional, en casos de competencia de la ANLA', mandatory: false, basis: 'Art. 2.2.2.3.7.2 num. 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/solicitud-de-permiso-de-vertimientos',
    exactName: 'Solicitud de permiso de vertimientos',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.3.3.5.1 (requerimiento del permiso); art. 2.2.3.3.5.2 (requisitos, que compiló el art. 42 del Decreto 3930 de 2010, modificado por el Decreto 50 de 2018); art. 2.2.3.3.5.3 (evaluación ambiental del vertimiento); art. 2.2.3.3.5.4 (plan de gestión del riesgo); art. 2.2.3.3.5.5 (procedimiento)',
    competentAuthority: 'La autoridad ambiental competente en el área del vertimiento: Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana o de la Ley 768 de 2002, o la ANLA cuando el permiso se tramita dentro de una licencia ambiental de su competencia (Decreto 1076 de 2015, arts. 2.2.3.3.5.5 y 2.2.2.3.2.2)',
    term: { status: 'VERIFICADO', description: 'EL RELOJ DEL CLIENTE SON DIEZ (10) DÍAS HÁBILES PARA COMPLETAR LA DOCUMENTACIÓN: art. 2.2.3.3.5.5 num. 1, «la autoridad ambiental competente contará con diez (10) días hábiles para verificar que la documentación esté completa, la cual incluye el pago por concepto del servicio de evaluación. En caso que la documentación esté incompleta, se requerirá al interesado para que la allegue en el término de diez (10) días hábiles, contados a partir del envío de la comunicación». Y EL SEGUNDO RELOJ DEL CLIENTE ES MÁS CORTO QUE EL ORDINARIO: contra la resolución que otorga o niega el permiso «procederá el recurso de reposición dentro de los cinco (5) días hábiles siguientes a la fecha de notificación de la misma» (num. 7) - cinco días hábiles, no los diez del art. 76 de la Ley 1437 de 2011. Plazos de la autoridad: 30 días hábiles para el estudio y las visitas, 8 días hábiles para el informe técnico y máximo 20 días hábiles para decidir desde el auto de trámite que declara reunida la información.' },
    requiredSections: [
      { n: 1, name: 'Nombre, dirección e identificación del solicitante y razón social si es persona jurídica', mandatory: true, basis: 'Art. 2.2.3.3.5.2 num. 1' },
      { n: 2, name: 'Poder y certificado de existencia y representación legal cuando corresponda', mandatory: false, basis: 'Art. 2.2.3.3.5.2 nums. 2 y 3' },
      { n: 3, name: 'Autorización del propietario o poseedor y prueba de la propiedad, posesión o tenencia del inmueble', mandatory: true, basis: 'Art. 2.2.3.3.5.2 nums. 4 y 5' },
      { n: 4, name: 'Nombre y localización del predio, proyecto, obra o actividad, y costo del proyecto', mandatory: true, basis: 'Art. 2.2.3.3.5.2 nums. 6 y 7' },
      { n: 5, name: 'Fuente de abastecimiento y fuente receptora, con la cuenca o unidad ambiental a la que pertenecen', mandatory: true, basis: 'Art. 2.2.3.3.5.2 nums. 8 y 11' },
      { n: 6, name: 'Características de las actividades que generan el vertimiento y plano georreferenciado de las descargas', mandatory: true, basis: 'Art. 2.2.3.3.5.2 nums. 9 y 10' },
      { n: 7, name: 'Caudal, frecuencia, tiempo y tipo de flujo de la descarga', mandatory: true, basis: 'Art. 2.2.3.3.5.2 nums. 12 a 15' },
      { n: 8, name: 'Caracterización actual o estado final previsto del vertimiento', mandatory: true, basis: 'Art. 2.2.3.3.5.2 num. 16' },
      { n: 9, name: 'Memorias técnicas, diseños y planos del sistema de tratamiento y sus condiciones de eficiencia', mandatory: true, basis: 'Art. 2.2.3.3.5.2 num. 17' },
      { n: 10, name: 'Concepto sobre uso del suelo expedido por la autoridad municipal competente', mandatory: true, basis: 'Art. 2.2.3.3.5.2 num. 18' },
      { n: 11, name: 'Evaluación ambiental del vertimiento, salvo vertimientos a alcantarillado público', mandatory: true, basis: 'Arts. 2.2.3.3.5.2 num. 19 y 2.2.3.3.5.3' },
      { n: 12, name: 'Plan de gestión del riesgo para el manejo del vertimiento', mandatory: true, basis: 'Arts. 2.2.3.3.5.2 num. 20 y 2.2.3.3.5.4' },
      { n: 13, name: 'Constancia de pago del servicio de evaluación', mandatory: true, basis: 'Art. 2.2.3.3.5.2 num. 21' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/solicitud-de-aprovechamiento-forestal',
    exactName: 'Solicitud de aprovechamiento forestal',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.1.1.3.1 (clases de aprovechamiento); art. 2.2.1.1.4.1 (requisitos en terrenos de dominio público, que compiló el art. 6 del Decreto 1791 de 1996); art. 2.2.1.1.5.2 (aprovechamiento único); arts. 2.2.1.1.7.6 y 2.2.1.1.7.7 (proceso); art. 2.2.1.1.7.8 (contenido de la resolución); arts. 2.2.1.1.9.1 a 2.2.1.1.9.4 (árboles aislados)',
    competentAuthority: 'La Corporación Autónoma Regional o de Desarrollo Sostenible con jurisdicción en el área; tratandose de árboles aislados en centros urbanos, también la autoridad ambiental urbana o la autoridad municipal según el caso (Decreto 1076 de 2015, arts. 2.2.1.1.7.6 y 2.2.1.1.9.4)',
    term: { status: 'NO_VERIFICADO', description: 'SIN TÉRMINO LEGAL DE DECISIÓN: el Decreto 1076 de 2015 describe el trámite pero NO fija plazo para resolver la solicitud de aprovechamiento forestal. El art. 2.2.1.1.7.6 se limita a decir que «una vez recibido el plan de manejo forestal o el plan de aprovechamiento, respectivamente, las Corporaciones procederán a evaluar su contenido, efectuar las visitas de campo, emitir el concepto y expedir la resolución motivada». Los treinta (30) días hábiles del art. 2.2.1.1.16.4 pertenecen al permiso de jardines botánicos y NO se aplican aquí. Reloj del titular una vez otorgado: el par. del art. 2.2.1.1.7.10 considera abandono «la suspensión de actividades por un término igual o superior a noventa (90) días calendario, salvo razones de caso fortuito o fuerza mayor, oportunamente comunicadas por escrito», y el abandono da lugar a liquidación definitiva y, si hay obligaciones incumplidas, a procedimiento sancionatorio (art. 2.2.1.1.7.9). Los aprovechamientos de árboles caídos, muertos o con problemas sanitarios tienen trámite prioritario (art. 2.2.1.1.9.1) y la tala de emergencia en centros urbanos se tramita «de inmediato» (art. 2.2.1.1.9.3).' },
    requiredSections: [
      { n: 1, name: 'Solicitud formal con identificación del interesado', mandatory: true, basis: 'Art. 2.2.1.1.4.1 lit. a' },
      { n: 2, name: 'Clase de aprovechamiento que se solicita: único, persistente o doméstico', mandatory: true, basis: 'Art. 2.2.1.1.3.1' },
      { n: 3, name: 'Ubicación e identificación del predio y prueba de la propiedad, posesión o tenencia, o autorización del propietario', mandatory: true, basis: 'Art. 2.2.1.1.9.2' },
      { n: 4, name: 'Acreditación de capacidad para garantizar el manejo silvicultural y la eficiencia en el aprovechamiento y la transformación', mandatory: true, basis: 'Art. 2.2.1.1.4.1 lit. b' },
      { n: 5, name: 'Plan de manejo forestal o plan de aprovechamiento, según la clase solicitada', mandatory: true, basis: 'Arts. 2.2.1.1.4.1 lit. c y 2.2.1.1.7.6' },
      { n: 6, name: 'Inventario de las especies, número de individuos, volúmenes y diámetros a aprovechar', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. d' },
      { n: 7, name: 'Medidas de mitigación, compensación y restauración propuestas', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. g' },
      { n: 8, name: 'Acto de sustracción del área de reserva forestal o levantamiento de veda, cuando se requiera', mandatory: false, basis: 'Art. 2.2.1.1.17' },
      { n: 9, name: 'Justificación de la prioridad o de la emergencia, tratandose de árboles aislados', mandatory: false, basis: 'Arts. 2.2.1.1.9.1 y 2.2.1.1.9.3' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/solicitud-de-audiencia-publica-ambiental',
    exactName: 'Solicitud de audiencia pública ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 99 de 1993, art. 72; Decreto 1076 de 2015, arts. 2.2.2.4.1.3 (oportunidad), 2.2.2.4.1.5 (solicitud, que compiló el art. 5 del Decreto 330 de 2007), 2.2.2.4.1.6 (evaluación), 2.2.2.4.1.7 (convocatoria) y 2.2.2.4.1.10 (inscripciones)',
    competentAuthority: 'La autoridad ambiental competente para otorgar, modificar o cancelar la licencia o permiso: ANLA, Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana o Ministerio de Ambiente y Desarrollo Sostenible (Ley 99 de 1993, art. 72; Decreto 1076 de 2015, art. 2.2.2.4.1.5)',
    term: { status: 'VERIFICADO', description: 'LEGITIMACIÓN TASADA: la solicitud solo puede provenir del Procurador General o el Delegado para Asuntos Ambientales y Agrarios, el Defensor del Pueblo, el Ministro de Ambiente, los directores generales de las demás autoridades ambientales, los gobernadores, los alcaldes «o por lo menos cien (100) personas o tres (3) entidades sin animo de lucro» (Ley 99 de 1993, art. 72; Decreto 1076 de 2015, art. 2.2.2.4.1.5). OPORTUNIDAD DEL SOLICITANTE: solo a partir de la entrega de los estudios ambientales y de la información adicional, y «hasta antes de la expedición del acto administrativo mediante el cual se resuelve sobre la pertinencia o no de otorgar la autorización ambiental a que haya lugar» (art. 2.2.2.4.1.5). EL RELOJ QUE SE PIERDE CON MÁS FRECUENCIA ES EL DE LA INSCRIPCIÓN PARA INTERVENIR, Y NO ESTÁ EN LA LEY 99: «Las personas interesadas en intervenir en la audiencia pública, podrán realizar su inscripción a partir de la fijación del edicto al que se refiere el presente decreto y hasta con tres (3) días hábiles de antelación a la fecha de su celebración», anexando siempre un escrito relacionado con el objeto de la audiencia (art. 2.2.2.4.1.10). Plazos de la autoridad: 15 días hábiles para pronunciarse sobre la pertinencia (art. 2.2.2.4.1.6) y edicto con al menos 30 días hábiles de anticipación, fijado durante 10 días hábiles (art. 2.2.2.4.1.7). La convocatoria suspende los términos para decidir de fondo.' },
    requiredSections: [
      { n: 1, name: 'Nombre e identificación de los solicitantes y su domicilio', mandatory: true, basis: 'Art. 2.2.2.4.1.5' },
      { n: 2, name: 'Acreditación de la legitimación: cien (100) personas, tres (3) entidades sin animo de lucro o autoridad habilitada', mandatory: true, basis: 'Ley 99 de 1993, art. 72' },
      { n: 3, name: 'Identificación del proyecto, obra o actividad y del expediente de licencia o permiso', mandatory: true, basis: 'Art. 2.2.2.4.1.5' },
      { n: 4, name: 'Motivación de la solicitud', mandatory: true, basis: 'Art. 2.2.2.4.1.5' },
      { n: 5, name: 'Constancia de que ya se entregaron los estudios ambientales y la información adicional', mandatory: true, basis: 'Art. 2.2.2.4.1.5' },
      { n: 6, name: 'Constancia de que aún no se ha expedido el acto que resuelve sobre la autorización ambiental', mandatory: true, basis: 'Art. 2.2.2.4.1.5' },
      { n: 7, name: 'Solicitud de inscripción como ponente y escrito relacionado con el objeto de la audiencia', mandatory: false, basis: 'Art. 2.2.2.4.1.10' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/solicitud-de-reconocimiento-como-tercero-interviniente-en-la-actuacion-administrativa-ambiental',
    exactName: 'Solicitud de reconocimiento como tercero interviniente en la actuación administrativa ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 99 de 1993, art. 69 (derecho a intervenir sin demostrar interés jurídico) y art. 70 (trámite de las peticiones de intervención); Ley 1333 de 2009, art. 20, modificado por la Ley 2387 de 2024, art. 24 (intervenciones en el procedimiento sancionatorio); Decreto 1076 de 2015, art. 2.2.2.3.6.3 par. 7',
    competentAuthority: 'La autoridad ambiental que adelanta la actuación: ANLA, Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana, Parques Nacionales Naturales o Ministerio de Ambiente y Desarrollo Sostenible',
    term: { status: 'NO_VERIFICADO', description: 'SIN CARGA DE INTERÉS Y SIN TÉRMINO PRECLUSIVO: el art. 69 de la Ley 99 de 1993 dispone que «Cualquier persona natural o jurídica o privada, sin necesidad de demostrar interés jurídico alguno, podrá intervenir en las actuaciones administrativas iniciadas para la expedición, modificación o cancelación de permisos o licencias de actividades que afecten o puedan afectar el medio ambiente o para la imposición o revocación de sanciones por el incumplimiento de las normas y regulaciones ambientales». El art. 70 obliga a la autoridad a tener «como interesado a cualquier persona que así lo manifieste con su correspondiente identificación y dirección domiciliaria». La ley no fija plazo, pero la intervención debe presentarse mientras la actuación esté en curso: reconocido el tercero antes de la citación a la reunión de información adicional, la autoridad debe comunicarle el acta (Decreto 1076 de 2015, art. 2.2.2.3.6.3 par. 7). En el procedimiento sancionatorio, el art. 20 de la Ley 1333 permite intervenir «para aportar pruebas o auxiliar al funcionario competente», y su par. 2 dispone que si el interviniente presenta recursos en la oportunidad procesal pertinente, la autoridad «entenderá que se trata de una solicitud de intervención y dará trámite al recurso respectivo».' },
    requiredSections: [
      { n: 1, name: 'Identificación completa del interviniente y dirección domiciliaria', mandatory: true, basis: 'Ley 99 de 1993, art. 70' },
      { n: 2, name: 'Identificación del expediente y de la actuación administrativa ambiental en curso', mandatory: true, basis: 'Ley 99 de 1993, art. 69' },
      { n: 3, name: 'Manifestación expresa de intervenir como tercero, sin necesidad de acreditar interés jurídico', mandatory: true, basis: 'Ley 99 de 1993, art. 69' },
      { n: 4, name: 'Objeto de la intervención y pronunciamiento sobre el proyecto, obra, actividad o infracción', mandatory: true, basis: 'Ley 1333 de 2009, art. 20' },
      { n: 5, name: 'Pruebas que se aportan o cuya práctica se solicita', mandatory: false, basis: 'Ley 1333 de 2009, art. 20' },
      { n: 6, name: 'Petición de notificación de las decisiones que pongan término a la actuación', mandatory: true, basis: 'Ley 99 de 1993, art. 71' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=297'
  },
  {
    id: 'ambiental/peticion-de-informacion-ambiental-sobre-elementos-contaminantes',
    exactName: 'Petición de información ambiental sobre elementos contaminantes',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 99 de 1993, art. 74; Ley 23 de 1973, art. 16',
    competentAuthority: 'La autoridad, entidad o persona a la que se dirija la petición en relación con los elementos susceptibles de producir contaminación; en materia de recursos destinados a la preservación del medio ambiente, la entidad que los administra (Ley 99 de 1993, art. 74)',
    term: { status: 'VERIFICADO', description: 'TÉRMINO PROPIO, DISTINTO DEL DERECHO DE PETICIÓN GENERAL: el art. 74 de la Ley 99 de 1993 dispone que «Toda persona natural o jurídica tiene derecho a formular directamente petición de información en relación con los elementos susceptibles de producir contaminación y los peligros que el uso de dichos elementos pueda ocasionar a la salud humana de conformidad con el artículo 16 de la Ley 23 de 1973. Dicha petición debe ser respondida en 10 días hábiles». El mismo artículo habilita a pedir información «sobre el monto y utilización de los recursos financieros, que están destinados a la preservación del medio ambiente». El plazo del art. 74 se cuenta en días HÁBILES por disposición expresa de la norma.' },
    requiredSections: [
      { n: 1, name: 'Identificación del peticionario y dirección para notificaciones', mandatory: true, basis: 'Ley 99 de 1993, art. 74' },
      { n: 2, name: 'Identificación de la entidad o persona destinataria', mandatory: true, basis: 'Ley 99 de 1993, art. 74' },
      { n: 3, name: 'Descripción de los elementos susceptibles de producir contaminación sobre los que se pide información', mandatory: true, basis: 'Ley 99 de 1993, art. 74' },
      { n: 4, name: 'Objeto concreto de la información solicitada, incluidos los peligros para la salud humana', mandatory: true, basis: 'Ley 99 de 1993, art. 74' },
      { n: 5, name: 'Cuando corresponda, solicitud sobre el monto y utilización de los recursos destinados a la preservación del medio ambiente', mandatory: false, basis: 'Ley 99 de 1993, art. 74' },
      { n: 6, name: 'Indicación del término de diez (10) días hábiles para responder', mandatory: true, basis: 'Ley 99 de 1993, art. 74' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=297'
  },
  {
    id: 'ambiental/auto-que-ordena-indagacion-preliminar-ambiental',
    exactName: 'Auto que ordena indagación preliminar ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 17; art. 22 (verificación de los hechos); art. 10 (caducidad)',
    competentAuthority: 'La autoridad ambiental competente: ANLA, Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana, establecimiento público ambiental, Parques Nacionales Naturales o Ministerio de Ambiente y Desarrollo Sostenible (Ley 1333 de 2009, art. 1)',
    term: { status: 'VERIFICADO', description: 'SEIS (6) MESES MÁXIMO Y SOLO DOS SALIDAS: art. 17, «El término de la indagación preliminar será máximo de seis (6) meses y culminará con el archivo definitivo o auto de apertura de la investigación». Su finalidad es «verificar la ocurrencia de la conducta, determinar si es constitutiva de infracción ambiental o si se ha actuado al amparo de una causal de eximentes de responsabilidad». Límite objetivo del auto: «La indagación preliminar no podrá extenderse a hechos distintos del que fue objeto de denuncia, queja o iniciación oficiosa y los que le sean conexos». Estos seis meses corren dentro del término de caducidad de veinte (20) años del art. 10, que no se suspende por la indagación.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la denuncia, queja o de la iniciación oficiosa', mandatory: true, basis: 'Art. 17' },
      { n: 2, name: 'Delimitación de los hechos objeto de indagación y de los conexos', mandatory: true, basis: 'Art. 17' },
      { n: 3, name: 'Objeto de la indagación: ocurrencia de la conducta, carácter de infracción y eximentes', mandatory: true, basis: 'Art. 17' },
      { n: 4, name: 'Diligencias y verificaciones que se ordenan', mandatory: true, basis: 'Art. 22' },
      { n: 5, name: 'Identificación del presunto infractor cuando se conozca', mandatory: false, basis: 'Art. 18' },
      { n: 6, name: 'Advertencia del término máximo de seis (6) meses y de su culminación con archivo o apertura', mandatory: true, basis: 'Art. 17' },
      { n: 7, name: 'Orden de notificación', mandatory: true, basis: 'Art. 19' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/auto-de-apertura-de-investigacion-sancionatoria-ambiental',
    exactName: 'Auto de apertura de investigación sancionatoria ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 18 (iniciación del procedimiento sancionatorio); art. 10 y su par., adicionado por la Ley 2387 de 2024, art. 18 (caducidad y duración máxima); art. 19 (notificaciones); art. 16 (continuidad de la actuación tras medida preventiva); art. 21 (remisión a otras autoridades)',
    competentAuthority: 'La autoridad ambiental competente para otorgar la licencia, permiso, concesión o autorización, o la que tenga jurisdicción donde ocurrió la infracción cuando el proyecto no esté sometido a instrumento de control (Ley 1333 de 2009, art. 2 par. 1)',
    term: { status: 'VERIFICADO', description: 'RELOJ DE LA AUTORIDAD QUE HOY TIENE TOPE: la acción «caduca a los 20 años de haber sucedido el hecho u omisión generadora de la infracción. Si se tratará de un hecho u omisión sucesivos, el término empezará a correr desde el último día en que se haya generado el hecho o la omisión. Mientras las condiciones de violación de las normas o generadoras del daño persistan, podrá la acción interponerse en cualquier tiempo» (art. 10). La Ley 2387 de 2024, art. 18, añadió un límite que antes no existía: «Una vez iniciado el procedimiento sancionatorio ambiental, dentro del término de caducidad previsto en el presente artículo, el procedimiento no podrá extenderse más allá de cinco (5) años», prorrogables «hasta por otro término igual» mediante resolución motivada por complejidad del caso o del acervo probatorio. El procedimiento se adelanta «de oficio, a petición de parte o como consecuencia de haberse impuesto una medida preventiva», mediante acto motivado que se notifica personalmente; «En casos de flagrancia o confesión se procederá a recibir descargos» (art. 18). Si la apertura sigue a una medida preventiva, el art. 16 da diez (10) días para evaluar si existe mérito.' },
    requiredSections: [
      { n: 1, name: 'Identificación del presunto infractor', mandatory: true, basis: 'Art. 18' },
      { n: 2, name: 'Relación de los hechos u omisiones constitutivos de posible infracción ambiental', mandatory: true, basis: 'Art. 18' },
      { n: 3, name: 'Origen de la actuación: oficiosa, petición de parte o medida preventiva impuesta', mandatory: true, basis: 'Art. 18' },
      { n: 4, name: 'Fundamento de la competencia de la autoridad ambiental', mandatory: true, basis: 'Art. 2 par. 1' },
      { n: 5, name: 'Verificación de que no ha operado la caducidad de veinte (20) años', mandatory: true, basis: 'Art. 10' },
      { n: 6, name: 'Advertencia del término máximo de cinco (5) años de duración del procedimiento', mandatory: true, basis: 'Art. 10 par.' },
      { n: 7, name: 'Diligencias de verificación de los hechos que se ordenan', mandatory: false, basis: 'Art. 22' },
      { n: 8, name: 'Orden de notificación personal y de publicación', mandatory: true, basis: 'Arts. 19 y 29' },
      { n: 9, name: 'Orden de remisión a otras autoridades si los hechos son constitutivos de delito o falta disciplinaria', mandatory: false, basis: 'Art. 21' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/auto-de-formulacion-de-cargos-en-el-procedimiento-sancionatorio-ambiental',
    exactName: 'Auto de formulación de cargos en el procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 24, modificado por la Ley 2387 de 2024, art. 16; art. 25 (traslado para descargos); art. 7 (agravantes) y art. 6, modificado por la Ley 2387 de 2024, art. 13 (atenuantes); art. 23 (preclusión de la cesación)',
    competentAuthority: 'La autoridad ambiental competente que adelanta el procedimiento sancionatorio (Ley 1333 de 2009, arts. 1 y 2 par. 1)',
    term: { status: 'VERIFICADO', description: 'ACTO QUE ABRE EL ÚNICO RELOJ DEL INVESTIGADO Y NO ADMITE RECURSO: art. 24, «Cuando exista mérito para continuar con la investigación, la autoridad ambiental competente, mediante acto administrativo debidamente motivado, procederá a formular cargos contra el presunto infractor de la normatividad ambiental o causante del daño ambiental. En el pliego de cargos deben estar expresamente consagradas las acciones u omisiones que constituyen la infracción e individualizadas las normas ambientales que se estiman violadas o el daño causado»; y cierra: «Contra el acto administrativo que formula cargos no procede recurso alguno». La reforma de 2024 agregó una carga de motivación: «en caso de que haya riesgo o afectación ambiental, estas circunstancias se deberán indicar en la motivación del pliego de cargos, así como indicar y explicar los tipos de agravantes». Notificado el pliego corren los diez (10) días hábiles de descargos del art. 25. Después de este auto ya no procede la cesación del procedimiento, salvo fallecimiento del infractor (art. 23).' },
    requiredSections: [
      { n: 1, name: 'Identificación individualizada del presunto infractor', mandatory: true, basis: 'Art. 24' },
      { n: 2, name: 'Enunciación expresa de las acciones u omisiones que constituyen la infracción', mandatory: true, basis: 'Art. 24' },
      { n: 3, name: 'Individualización de las normas ambientales que se estiman violadas o del daño causado', mandatory: true, basis: 'Art. 24' },
      { n: 4, name: 'Motivación del riesgo o la afectación ambiental cuando exista', mandatory: true, basis: 'Art. 24' },
      { n: 5, name: 'Indicación y explicación de los tipos de agravantes', mandatory: true, basis: 'Arts. 24 y 7' },
      { n: 6, name: 'Pruebas en que se fundan los cargos', mandatory: true, basis: 'Art. 22' },
      { n: 7, name: 'Traslado por diez (10) días hábiles para presentar descargos y solicitar pruebas', mandatory: true, basis: 'Art. 25' },
      { n: 8, name: 'Advertencia de que contra el pliego de cargos no procede recurso alguno', mandatory: true, basis: 'Art. 24' },
      { n: 9, name: 'Orden de notificación', mandatory: true, basis: 'Arts. 19 y 24' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/auto-que-decreta-pruebas-en-el-procedimiento-sancionatorio-ambiental',
    exactName: 'Auto que decreta pruebas en el procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 26; art. 25 par. (gastos a cargo de quien solicita la prueba); Ley 2387 de 2024, art. 8 y Ley 1437 de 2011, art. 48 (alegatos posteriores); Ley 1437 de 2011, art. 76 (término del recurso de reposición)',
    competentAuthority: 'La autoridad ambiental competente que adelanta el procedimiento sancionatorio, que puede comisionar a otras autoridades la práctica de las pruebas (Ley 1333 de 2009, art. 26 par.)',
    term: { status: 'VERIFICADO', description: 'PLAZO DE LA AUTORIDAD, CON UN RELOJ DEL INVESTIGADO ESCONDIDO EN EL PARÁGRAFO: art. 26, «Las pruebas ordenadas se practicarán en un término de treinta (30) días, el cual podrá prorrogarse por una sola vez y hasta por 60 días, soportado en un concepto técnico que establezca la necesidad de un plazo mayor para la ejecución de las pruebas». El auto se profiere «Vencido el término indicado en el artículo anterior», es decir, vencidos los diez (10) días hábiles de descargos, y decreta las pruebas pedidas «de acuerdo con los criterios de conducencia, pertinencia y necesidad», además de las que ordene de oficio. El reloj del investigado aparece cuando el auto niega una prueba: «Contra el acto administrativo que niegue la práctica de pruebas solicitadas, procede el recurso de reposición», que debe interponerse dentro de los diez (10) días siguientes a la notificación (Ley 1437 de 2011, art. 76). Practicadas las pruebas se abre el traslado de diez (10) días para alegatos de conclusión (Ley 2387 de 2024, art. 8; Ley 1437 de 2011, art. 48).' },
    requiredSections: [
      { n: 1, name: 'Identificación del expediente y constancia del vencimiento del término de descargos', mandatory: true, basis: 'Art. 26' },
      { n: 2, name: 'Relación de las pruebas solicitadas por el investigado y decisión sobre cada una', mandatory: true, basis: 'Art. 26' },
      { n: 3, name: 'Motivación de conducencia, pertinencia y necesidad de las pruebas decretadas', mandatory: true, basis: 'Art. 26' },
      { n: 4, name: 'Motivación expresa del rechazo de las pruebas que se nieguen', mandatory: true, basis: 'Art. 26 par.' },
      { n: 5, name: 'Pruebas decretadas de oficio', mandatory: false, basis: 'Art. 26' },
      { n: 6, name: 'Fijación del término de treinta (30) días para la práctica y, si procede, de la prórroga con concepto técnico', mandatory: true, basis: 'Art. 26' },
      { n: 7, name: 'Comisión a otras autoridades para la práctica de pruebas, si procede', mandatory: false, basis: 'Art. 26 par.' },
      { n: 8, name: 'Advertencia de los gastos a cargo de quien solicitó la prueba', mandatory: true, basis: 'Art. 25 par.' },
      { n: 9, name: 'Indicación de la procedencia del recurso de reposición contra la negativa de pruebas', mandatory: true, basis: 'Art. 26 par.' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/resolucion-que-declara-la-responsabilidad-e-impone-sancion-ambiental',
    exactName: 'Resolución que declara la responsabilidad e impone sanción ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 27, modificado por la Ley 2387 de 2024, art. 9; art. 40, modificado por la Ley 2387 de 2024, art. 17 (sanciones); art. 31 (medidas compensatorias); art. 28 (notificación); art. 29 (publicidad); art. 30 (recursos); art. 42, modificado por la Ley 2387 de 2024, art. 7 (mérito ejecutivo); arts. 57 y 59 (RUIA)',
    competentAuthority: 'La autoridad ambiental competente para otorgar la licencia, permiso, concesión o autorización, o la que tenga jurisdicción donde ocurrió la infracción cuando el proyecto no esté sometido a instrumento de control (Ley 1333 de 2009, art. 2 par. 1)',
    term: { status: 'VERIFICADO', description: 'OCHENTA (80) DÍAS DE LA AUTORIDAD, CONTADOS DESDE DOS MOMENTOS DISTINTOS SEGÚN HAYA HABIDO O NO PRUEBAS: art. 27, «Dentro de los ochenta (80) días siguientes al vencimiento del término para presentar descargos o alegatos de conclusión, según sea el caso, la autoridad ambiental mediante acto administrativo motivado, declarará la responsabilidad del infractor e impondrá las sanciones y las medidas de Corrección y de compensación a las que haya lugar para la reparación del daño causado si fuere el caso». Su incumplimiento no anula la decisión: el par. solo obliga a informar a la Procuraduría General de la Nación. EL RELOJ DEL SANCIONADO NACE CON LA NOTIFICACIÓN Y ES DE DIEZ (10) DÍAS para interponer reposición y, si hay superior jerárquico, apelación (art. 30; Ley 1437 de 2011, art. 76). El acto debe publicarse conforme al art. 71 de la Ley 99 de 1993 (art. 29), reportarse al RUIA (art. 59) y, si impone sanción pecuniaria, presta mérito ejecutivo y se cobra por jurisdicción coactiva (art. 42). La sanción no exime de las medidas compensatorias y ambas «deberán guardar una estricta proporcionalidad» (art. 31).' },
    requiredSections: [
      { n: 1, name: 'Identificación del infractor y del expediente sancionatorio', mandatory: true, basis: 'Art. 27' },
      { n: 2, name: 'Constancia del vencimiento del término de descargos o de alegatos de conclusión y del cómputo de los ochenta (80) días', mandatory: true, basis: 'Art. 27' },
      { n: 3, name: 'Análisis de cada cargo formulado y valoración de las pruebas practicadas', mandatory: true, basis: 'Arts. 24, 26 y 27' },
      { n: 4, name: 'Pronunciamiento sobre la presunción de culpa o dolo y sobre si el investigado la desvirtuó', mandatory: true, basis: 'Arts. 1 par. y 5 par. 1' },
      { n: 5, name: 'Declaratoria de responsabilidad o exoneración motivada', mandatory: true, basis: 'Art. 27' },
      { n: 6, name: 'Sanciones principales y accesorias impuestas y criterios de graduación', mandatory: true, basis: 'Art. 40' },
      { n: 7, name: 'Circunstancias agravantes y atenuantes valoradas', mandatory: true, basis: 'Arts. 6 y 7' },
      { n: 8, name: 'Medidas de corrección y de compensación para la reparación del daño, con estricta proporcionalidad', mandatory: true, basis: 'Arts. 27 y 31' },
      { n: 9, name: 'Pronunciamiento sobre el levantamiento o mantenimiento de las medidas preventivas', mandatory: true, basis: 'Art. 36 par. 2' },
      { n: 10, name: 'Indicación de los recursos que proceden y del término de diez (10) días', mandatory: true, basis: 'Art. 30; Ley 1437 de 2011, art. 76' },
      { n: 11, name: 'Orden de notificación al interesado y a los terceros intervinientes reconocidos', mandatory: true, basis: 'Art. 28' },
      { n: 12, name: 'Orden de publicación conforme al artículo 71 de la Ley 99 de 1993', mandatory: true, basis: 'Art. 29' },
      { n: 13, name: 'Orden de reporte al Registro Único de Infractores Ambientales - RUIA', mandatory: true, basis: 'Arts. 57 y 59' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/acto-administrativo-que-impone-medida-preventiva-ambiental',
    exactName: 'Acto administrativo que impone medida preventiva ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 13 (procedimiento para la imposición de medidas preventivas); art. 12 (objeto); art. 32 (carácter e improcedencia de recursos); art. 36, modificado por la Ley 2387 de 2024, art. 19 (tipos); art. 34 (costos); arts. 15 y 16 (flagrancia y continuidad de la actuación); art. 2, modificado por la Ley 2387 de 2024, art. 5 (facultad a prevención)',
    competentAuthority: 'La autoridad ambiental competente y, a prevención, el Ministerio de Ambiente, Parques Nacionales Naturales, las corporaciones autónomas regionales y de desarrollo sostenible, la ANLA, las entidades territoriales, los demás centros urbanos y las delegaciones de asuntos ambientales de la Armada Nacional, el Ejército Nacional, la Fuerza Aérea Colombiana y la Policía Nacional (Ley 1333 de 2009, art. 2)',
    term: { status: 'VERIFICADO', description: 'EFECTOS INMEDIATOS Y SIN RECURSOS: art. 32, las medidas preventivas «son de ejecución inmediata, tienen carácter preventivo y transitorio, surten efectos inmediatos, contra ellas no procede recurso alguno y se aplicarán sin perjuicio de las sanciones a que hubiere lugar». Se imponen «mediante acto administrativo motivado» una vez comprobada su necesidad (art. 13). RELOJES DE LA AUTORIDAD: cuando la medida se impone a prevención por autoridad distinta de la ambiental competente, esta «deberá dar traslado de las actuaciones a la autoridad ambiental competente, dentro de los cinco (5) días hábiles siguientes a la imposición de la misma» (art. 2; art. 13 par. 2); en flagrancia el acta debe legalizarse mediante acto administrativo «en un término no mayor a tres días» (art. 15), y legalizada la medida se debe evaluar «en un término no mayor a 10 días» si existe mérito para iniciar el procedimiento sancionatorio, so pena de levantarla (art. 16). Los costos de la medida corren por cuenta del infractor (arts. 34 y 36 par. 1).' },
    requiredSections: [
      { n: 1, name: 'Identificación del destinatario de la medida y del proyecto, obra o actividad', mandatory: true, basis: 'Art. 13' },
      { n: 2, name: 'Motivación sobre la comprobación del hecho y la necesidad de la medida', mandatory: true, basis: 'Art. 13' },
      { n: 3, name: 'Tipo de medida preventiva impuesta conforme al artículo 36', mandatory: true, basis: 'Art. 36' },
      { n: 4, name: 'Objeto de la medida: prevenir, impedir o evitar la ocurrencia del hecho o actividad', mandatory: true, basis: 'Art. 12' },
      { n: 5, name: 'Condiciones, alcance y forma de ejecución de la medida', mandatory: true, basis: 'Art. 13' },
      { n: 6, name: 'Advertencia de ejecución inmediata y de que no procede recurso alguno', mandatory: true, basis: 'Art. 32' },
      { n: 7, name: 'Advertencia de que los costos corren por cuenta del infractor', mandatory: true, basis: 'Arts. 34 y 36 par. 1' },
      { n: 8, name: 'Comisión a autoridades administrativas o de la Fuerza Pública para su ejecución, si procede', mandatory: false, basis: 'Art. 13 par. 1' },
      { n: 9, name: 'Orden de traslado a la autoridad ambiental competente dentro de los cinco (5) días hábiles, cuando se impone a prevención', mandatory: true, basis: 'Arts. 2 y 13 par. 2' },
      { n: 10, name: 'Puesta a disposición de los especímenes o bienes en caso de decomiso o aprehensión preventiva', mandatory: false, basis: 'Arts. 13 par. 3 y 38' },
      { n: 11, name: 'Orden de notificación', mandatory: true, basis: 'Art. 19' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/acto-administrativo-que-levanta-la-medida-preventiva-ambiental',
    exactName: 'Acto administrativo que levanta la medida preventiva ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 35; art. 36 par. 2, modificado por la Ley 2387 de 2024, art. 19; art. 16 (levantamiento por falta de mérito); art. 34 (costos previos a la devolución); art. 41 (prohibición de devolución de especímenes de explotaciones ilegales)',
    competentAuthority: 'La autoridad ambiental que impuso la medida preventiva o aquella a la que se trasladaron las actuaciones (Ley 1333 de 2009, arts. 2 y 13 par. 2)',
    term: { status: 'VERIFICADO', description: 'TRES CAUSALES Y UN LÍMITE TEMPORAL. Art. 35: «Las medidas preventivas se levantarán de oficio o a petición de parte, cuando se compruebe que han desaparecido las causas que las originaron». Art. 16: legalizada la medida y evaluado en un término no mayor a 10 días que no existe mérito para iniciar el procedimiento sancionatorio, «se procederá a levantar la medida preventiva». Art. 36 par. 2: la medida se levanta cuando se cumplan las condiciones impuestas «o hasta la expedición de la decisión que ponga fin al procedimiento; la cual se pronunciará sobre su levantamiento», de modo que la resolución sancionatoria debe pronunciarse expresamente sobre ella. DOS LÍMITES A LA DEVOLUCIÓN: el art. 34 exige que «los costos deberán ser cancelados antes de poder devolver el bien o reiniciar o reabrir la obra», y el art. 41 prohibe en todo caso devolver fauna, flora u otros recursos «resultado de explotaciones ilegales», salvo el caso del numeral 6 del artículo 52.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la medida preventiva impuesta y del acto que la impuso', mandatory: true, basis: 'Art. 13' },
      { n: 2, name: 'Causal del levantamiento: desaparición de las causas, cumplimiento de condiciones o falta de mérito', mandatory: true, basis: 'Arts. 35, 36 par. 2 y 16' },
      { n: 3, name: 'Verificación técnica que sustenta la desaparición de las causas o el cumplimiento', mandatory: true, basis: 'Art. 35' },
      { n: 4, name: 'Orden de devolución de bienes o de reapertura de la obra o actividad', mandatory: true, basis: 'Art. 34' },
      { n: 5, name: 'Constancia del pago de los costos causados por la medida', mandatory: true, basis: 'Art. 34' },
      { n: 6, name: 'Verificación de que no se trata de recursos procedentes de explotaciones ilegales', mandatory: true, basis: 'Art. 41' },
      { n: 7, name: 'Orden de notificación', mandatory: true, basis: 'Art. 19' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/auto-de-cesacion-del-procedimiento-sancionatorio-ambiental',
    exactName: 'Auto de cesación del procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 23; art. 9, modificado por la Ley 2387 de 2024, art. 14 (causales); art. 9A, adicionado por la Ley 2387 de 2024, art. 15; Ley 99 de 1993, art. 71 (publicidad); Ley 1437 de 2011, art. 76',
    competentAuthority: 'La autoridad ambiental competente que adelanta el procedimiento sancionatorio (Ley 1333 de 2009, arts. 1 y 2 par. 1)',
    term: { status: 'VERIFICADO', description: 'OPORTUNIDAD PRECLUSIVA QUE SE PIERDE CON EL PLIEGO DE CARGOS: art. 23, «La cesación de procedimiento solo puede declararse antes del auto de formulación de cargos, excepto en el caso de fallecimiento del infractor». Procede «Cuando aparezca plenamente demostrada alguna de las causales señaladas en el artículo 9o», que hoy son: muerte del investigado o liquidación definitiva de la persona jurídica; que el hecho investigado no sea constitutivo de infracción ambiental; que la conducta no sea imputable al presunto infractor; y que la actividad este legalmente amparada y/o autorizada. Las causales 1 y 4 «operan sin perjuicio de continuar el procedimiento frente a los otros investigados si los hubiere» (art. 9 par.). El auto «deberá ser publicado en los términos del artículo 71 de la ley 99 de 1993 y contra el procede el recurso de reposición», hoy dentro de los diez (10) días siguientes a la notificación (Ley 1437 de 2011, art. 76).' },
    requiredSections: [
      { n: 1, name: 'Identificación del investigado y del expediente', mandatory: true, basis: 'Art. 23' },
      { n: 2, name: 'Constancia de que aún no se ha proferido el auto de formulación de cargos, o de fallecimiento del infractor', mandatory: true, basis: 'Art. 23' },
      { n: 3, name: 'Causal de cesación invocada y prueba plena que la demuestra', mandatory: true, basis: 'Arts. 9 y 23' },
      { n: 4, name: 'Pronunciamiento sobre la continuación del procedimiento frente a los demás investigados', mandatory: true, basis: 'Art. 9 par.' },
      { n: 5, name: 'Orden de cesar todo procedimiento contra el presunto infractor', mandatory: true, basis: 'Art. 23' },
      { n: 6, name: 'Pronunciamiento sobre el levantamiento de las medidas preventivas vigentes', mandatory: true, basis: 'Arts. 35 y 36 par. 2' },
      { n: 7, name: 'Orden de notificación al presunto infractor', mandatory: true, basis: 'Art. 23' },
      { n: 8, name: 'Orden de publicación conforme al artículo 71 de la Ley 99 de 1993', mandatory: true, basis: 'Art. 23' },
      { n: 9, name: 'Indicación de la procedencia del recurso de reposición', mandatory: true, basis: 'Art. 23' }
    ],
    sourceUrl: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1333_2009.html'
  },
  {
    id: 'ambiental/acto-administrativo-que-declara-la-terminacion-anticipada-del-procedimiento-sancionatorio-ambiental',
    exactName: 'Acto administrativo que declara la terminación anticipada del procedimiento sancionatorio ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 1333 de 2009, art. 18A, adicionado por la Ley 2387 de 2024, art. 10; art. 57 (RUIA); art. 36 par. 2',
    competentAuthority: 'La autoridad ambiental competente que adelanta el procedimiento sancionatorio (Ley 1333 de 2009, arts. 1 y 2 par. 1)',
    term: { status: 'VERIFICADO', description: 'SE PROFIERE DESPUÉS DE LA VERIFICACIÓN, NO DE LA PROMESA: art. 18A, «Culminada la implementación de las medidas, si la autoridad ambiental ha verificado mediante seguimiento y control ambiental que se corrigieron y/o compensaron las afectaciones o daños ambientales causados con la infracción investigada, declarará la terminación anticipada del procedimiento sancionatorio ambiental y ordenará la inscripción de dicha decisión en los registros que disponga la autoridad ambiental, con la advertencia de no ser un antecedente». La suspensión previa es «máxima de dos (2) años y se podrá prorrogar hasta por la mitad del tiempo establecido inicialmente»; durante ella «no correrá el término de la caducidad previsto en el artículo 10». La decisión se inscribe en el apéndice especial del RUIA (par. 3) y bloquea el beneficio para el mismo infractor por cinco (5) años desde la firmeza (par. 4). Si el infractor incumple las medidas aprobadas, «se levantará la suspensión del procedimiento sancionatorio» (par. 2).' },
    requiredSections: [
      { n: 1, name: 'Identificación del investigado y del expediente sancionatorio', mandatory: true, basis: 'Art. 18A' },
      { n: 2, name: 'Referencia al acto que declaró la suspensión y a la garantía de cumplimiento constituida', mandatory: true, basis: 'Art. 18A' },
      { n: 3, name: 'Descripción de las medidas de corrección y/o compensación ejecutadas', mandatory: true, basis: 'Art. 18A' },
      { n: 4, name: 'Resultado del seguimiento y control ambiental que verifica la corrección o compensación del daño', mandatory: true, basis: 'Art. 18A' },
      { n: 5, name: 'Declaratoria de terminación anticipada del procedimiento', mandatory: true, basis: 'Art. 18A' },
      { n: 6, name: 'Orden de inscripción en el apéndice especial del RUIA, con la advertencia de no constituir antecedente', mandatory: true, basis: 'Art. 18A y par. 3' },
      { n: 7, name: 'Liquidación de los costos del procedimiento y del servicio de evaluación, control y seguimiento', mandatory: false, basis: 'Art. 18A' },
      { n: 8, name: 'Pronunciamiento sobre el levantamiento de las medidas preventivas', mandatory: true, basis: 'Art. 36 par. 2' },
      { n: 9, name: 'Orden de notificación', mandatory: true, basis: 'Art. 19' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=246696'
  },
  {
    id: 'ambiental/auto-de-inicio-de-tramite-ambiental',
    exactName: 'Auto de inicio de trámite ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Ley 99 de 1993, art. 70; Decreto 1076 de 2015, art. 2.2.2.3.6.3 num. 1 (licencia ambiental); art. 2.2.2.3.8.1 num. 1 (modificación); art. 2.2.3.3.5.5 nums. 1 y 2 (permiso de vertimientos); art. 2.2.1.1.7.11 (actuaciones forestales)',
    competentAuthority: 'La autoridad ambiental ante la que se radicó la solicitud: ANLA, Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana o de la Ley 768 de 2002, o Ministerio de Ambiente y Desarrollo Sostenible',
    term: { status: 'VERIFICADO', description: 'SE EXPIDE DE INMEDIATO Y ES EL ACTO QUE ABRE LA PARTICIPACIÓN DE TERCEROS: en licencias y en su modificación, «A partir de la fecha de radicación, de la solicitud con el lleno de los requisitos exigidos, la autoridad ambiental competente de manera inmediata procederá a expedir el acto administrativo de inicio de trámite de licencia ambiental que será comunicado en los términos de la Ley 1437 de 2011 y se publicará en el boletín de la autoridad ambiental competente en los términos del artículo 70 de la Ley 99 de 1993» (Decreto 1076 de 2015, arts. 2.2.2.3.6.3 num. 1 y 2.2.2.3.8.1 num. 1). En vertimientos hay un paso previo: la autoridad tiene diez (10) días hábiles para verificar que la documentación esté completa y solo «Cuando la información esté completa, se expedirá el auto de iniciación de trámite» (art. 2.2.3.3.5.5 nums. 1 y 2). El art. 70 de la Ley 99 de 1993 obliga a tener «como interesado a cualquier persona que así lo manifieste con su correspondiente identificación y dirección domiciliaria». En materia forestal, «Todo acto de inicio o ponga término a una actuación administrativa relacionada con el tema de los bosques de la flora silvestre, será notificado y publicado en la forma prevista en los Artículos 70 y 71 de la Ley 99 de 1993», con copia a las alcaldías (art. 2.2.1.1.7.11).' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante y del proyecto, obra o actividad', mandatory: true, basis: 'Ley 99 de 1993, art. 70' },
      { n: 2, name: 'Identificación de la autorización ambiental solicitada y del expediente asignado', mandatory: true, basis: 'Decreto 1076 de 2015, art. 2.2.2.3.6.3 num. 1' },
      { n: 3, name: 'Constancia de radicación con el lleno de los requisitos exigidos', mandatory: true, basis: 'Decreto 1076 de 2015, arts. 2.2.2.3.6.3 num. 1 y 2.2.3.3.5.5 num. 1' },
      { n: 4, name: 'Orden de avocar conocimiento e iniciar la evaluación', mandatory: true, basis: 'Decreto 1076 de 2015, art. 2.2.2.3.6.3 num. 2' },
      { n: 5, name: 'Reconocimiento de terceros intervinientes que lo hayan solicitado', mandatory: false, basis: 'Ley 99 de 1993, arts. 69 y 70' },
      { n: 6, name: 'Orden de comunicación conforme a la Ley 1437 de 2011', mandatory: true, basis: 'Decreto 1076 de 2015, art. 2.2.2.3.6.3 num. 1' },
      { n: 7, name: 'Orden de publicación en el boletín de la autoridad ambiental', mandatory: true, basis: 'Ley 99 de 1993, art. 70' },
      { n: 8, name: 'Orden de envío de copia a las alcaldías correspondientes, en actuaciones forestales', mandatory: false, basis: 'Decreto 1076 de 2015, art. 2.2.1.1.7.11' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/resolucion-que-otorga-o-niega-la-licencia-ambiental',
    exactName: 'Resolución que otorga o niega la licencia ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.2.3.6.3 nums. 5 y 6 (decisión y recursos) y pars. 3, 5 y 8; arts. 2.2.2.3.2.2 y 2.2.2.3.2.3 (competencia); Ley 99 de 1993, arts. 50, 51, 59 y 71; Ley 1437 de 2011, art. 76',
    competentAuthority: 'La Autoridad Nacional de Licencias Ambientales - ANLA en los proyectos del art. 2.2.2.3.2.2 del Decreto 1076 de 2015; la Corporación Autónoma Regional, de Desarrollo Sostenible, Gran Centro Urbano o autoridad ambiental de la Ley 768 de 2002 en los del art. 2.2.2.3.2.3',
    term: { status: 'VERIFICADO', description: 'TREINTA (30) DÍAS HÁBILES DE LA AUTORIDAD: art. 2.2.2.3.6.3 num. 5, «Vencido el término anterior la autoridad ambiental contará con un término máximo de treinta (30) días hábiles, para expedir el acto administrativo que declare reunida toda la información requerida así como para expedir la resolución que otorga o niega la licencia ambiental. Tal decisión deberá ser notificada de conformidad con lo dispuesto en la Ley 1437 de 2011 y publicada en el boletín de la autoridad ambiental en los términos del artículo 71 de la Ley 99 de 1993». EL RELOJ DEL INTERESADO NACE CON LA NOTIFICACIÓN Y ES DE DIEZ (10) DÍAS: el num. 6 remite a los recursos de la Ley 1437 de 2011, cuyo art. 76 fija ese plazo. Dos frenos legales antes de decidir: no puede aplicarse el num. 5 mientras no se allegue la sustracción de reserva forestal o el levantamiento de veda (par. 5), y los términos se suspenden por audiencia pública ambiental (par. 3) y por el trámite de consulta previa (par. 8). A solicitud del peticionario la licencia incluye los permisos, concesiones y autorizaciones necesarios (Ley 99 de 1993, art. 59).' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante, del proyecto y del expediente', mandatory: true, basis: 'Art. 2.2.2.3.6.3' },
      { n: 2, name: 'Fundamento de la competencia de la autoridad ambiental', mandatory: true, basis: 'Arts. 2.2.2.3.2.2 y 2.2.2.3.2.3' },
      { n: 3, name: 'Acto que declara reunida toda la información requerida', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 5' },
      { n: 4, name: 'Evaluación del estudio de impacto ambiental y concepto técnico', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 2' },
      { n: 5, name: 'Pronunciamiento sobre los conceptos de otras entidades y sobre las intervenciones de terceros', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 4 y par. 7' },
      { n: 6, name: 'Constancia de la sustracción de reserva forestal o del levantamiento de veda, cuando se requiera', mandatory: false, basis: 'Art. 2.2.2.3.6.3 par. 5' },
      { n: 7, name: 'Constancia de la protocolización de la consulta previa o de su no procedencia', mandatory: true, basis: 'Art. 2.2.2.3.6.3 par. 8' },
      { n: 8, name: 'Decisión motivada de otorgamiento o negación de la licencia', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 5' },
      { n: 9, name: 'Plan de manejo ambiental y obligaciones de prevención, mitigación, corrección y compensación', mandatory: true, basis: 'Ley 99 de 1993, art. 50' },
      { n: 10, name: 'Permisos, concesiones y autorizaciones que se incluyen en la licencia', mandatory: false, basis: 'Ley 99 de 1993, art. 59' },
      { n: 11, name: 'Indicación de los recursos que proceden y del término de diez (10) días', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 6; Ley 1437 de 2011, art. 76' },
      { n: 12, name: 'Orden de notificación y de publicación en el boletín conforme al artículo 71 de la Ley 99 de 1993', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 5' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/acto-administrativo-que-ordena-el-archivo-de-la-solicitud-de-licencia-ambiental',
    exactName: 'Acto administrativo que ordena el archivo de la solicitud de licencia ambiental',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.2.3.6.3 nums. 2 y 3 y par. 4; art. 2.2.2.3.8.1 num. 3 (modificación); Ley 1437 de 2011, arts. 74 y 76',
    competentAuthority: 'La autoridad ambiental que adelanta el trámite: ANLA o la Corporación Autónoma Regional, de Desarrollo Sostenible o Gran Centro Urbano competente (Decreto 1076 de 2015, arts. 2.2.2.3.2.2 y 2.2.2.3.2.3)',
    term: { status: 'VERIFICADO', description: 'SE PROFIERE CUANDO VENCE EL RELOJ DEL SOLICITANTE: art. 2.2.2.3.6.3 num. 3, «En el evento que el solicitante no allegue la información en los términos establecidos en el numeral anterior, la autoridad ambiental ordenará el archivo de la solicitud de licencia ambiental y la devolución de la totalidad de la documentación aportada, mediante acto administrativo motivado que se notificará en los términos de la ley». El término incumplido es el del num. 2: un (1) mes para allegar la información adicional, prorrogable por un término igual solo si la prorroga se pide antes del vencimiento. La misma consecuencia opera en la modificación (art. 2.2.2.3.8.1 num. 3). Hipótesis distinta y de efecto equivalente: cuando el estudio de impacto ambiental no cumple los requisitos mínimos del Manual de Evaluación de Estudios Ambientales, la autoridad «dará por terminado el trámite y el solicitante podrá presentar una nueva solicitud» (par. 4). Contra el acto proceden los recursos de la Ley 1437 de 2011, dentro de los diez (10) días siguientes a la notificación (art. 76).' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante, del proyecto y del expediente', mandatory: true, basis: 'Art. 2.2.2.3.6.3' },
      { n: 2, name: 'Referencia al requerimiento de información adicional efectuado en la reunión y al acta correspondiente', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 2' },
      { n: 3, name: 'Cómputo del término de un (1) mes y de la prorroga, si se concedió', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 2' },
      { n: 4, name: 'Constancia de que la información no se allegó, se allegó extemporáneamente o de forma distinta a la requerida', mandatory: true, basis: 'Art. 2.2.2.3.6.3 nums. 2 y 3' },
      { n: 5, name: 'Orden de archivo de la solicitud', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 3' },
      { n: 6, name: 'Orden de devolución de la totalidad de la documentación aportada', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 3' },
      { n: 7, name: 'Indicación de los recursos que proceden', mandatory: true, basis: 'Ley 1437 de 2011, arts. 74 y 76' },
      { n: 8, name: 'Orden de notificación', mandatory: true, basis: 'Art. 2.2.2.3.6.3 num. 3' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/resolucion-que-otorga-o-niega-el-permiso-de-vertimientos',
    exactName: 'Resolución que otorga o niega el permiso de vertimientos',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 1076 de 2015, art. 2.2.3.3.5.5 nums. 5, 6 y 7 y par. 1; art. 2.2.3.3.5.6 (estudio de la solicitud); art. 2.2.3.3.5.7 (otorgamiento); art. 2.2.3.3.5.8 (contenido del permiso); art. 2.2.3.3.5.10 (renovación); Ley 99 de 1993, arts. 70 y 71',
    competentAuthority: 'La autoridad ambiental competente en el área del vertimiento: Corporación Autónoma Regional o de Desarrollo Sostenible, autoridad ambiental urbana o de la Ley 768 de 2002, o la ANLA cuando el permiso se otorga dentro de una licencia ambiental de su competencia',
    term: { status: 'VERIFICADO', description: 'VEINTE (20) DÍAS HÁBILES DE LA AUTORIDAD, PERO CINCO (5) DÍAS HÁBILES DEL ADMINISTRADO: art. 2.2.3.3.5.5 num. 6, «La autoridad ambiental competente decidirá mediante resolución si otorga o niega el permiso de vertimiento, en un término no mayor a veinte (20) días hábiles, contados a partir de la expedición del auto de trámite». Y el num. 7 acorta el recurso frente a la regla general del art. 76 de la Ley 1437 de 2011: «Contra la resolución mediante la cual se otorga o se niega el permiso de vertimientos, procederá el recurso de reposición dentro de los cinco (5) días hábiles siguientes a la fecha de notificación de la misma». Quien cuente diez días pierde el recurso. Antes de decidir, la autoridad dispone de 30 días hábiles para el estudio y las visitas técnicas y de 8 días hábiles para el informe técnico (nums. 3 y 4). La publicidad se rige por los arts. 70 y 71 de la Ley 99 de 1993 (par. 1).' },
    requiredSections: [
      { n: 1, name: 'Identificación del solicitante, del predio y del expediente', mandatory: true, basis: 'Art. 2.2.3.3.5.5' },
      { n: 2, name: 'Referencia al auto de iniciación de trámite y al auto que declara reunida la información', mandatory: true, basis: 'Art. 2.2.3.3.5.5 nums. 2 y 5' },
      { n: 3, name: 'Informe técnico resultante del estudio de la solicitud y de las visitas', mandatory: true, basis: 'Arts. 2.2.3.3.5.5 num. 4 y 2.2.3.3.5.6' },
      { n: 4, name: 'Decisión motivada de otorgamiento o negación del permiso', mandatory: true, basis: 'Arts. 2.2.3.3.5.5 num. 6 y 2.2.3.3.5.7' },
      { n: 5, name: 'Nombre del titular, fuente receptora, caudal, concentración y carga máxima permisible del vertimiento', mandatory: true, basis: 'Art. 2.2.3.3.5.8' },
      { n: 6, name: 'Obligaciones del permisionario, sistema de tratamiento aprobado y plan de gestión del riesgo', mandatory: true, basis: 'Art. 2.2.3.3.5.8' },
      { n: 7, name: 'Término de vigencia del permiso y condiciones de renovación', mandatory: true, basis: 'Arts. 2.2.3.3.5.8 y 2.2.3.3.5.10' },
      { n: 8, name: 'Indicación del recurso de reposición y del término de cinco (5) días hábiles', mandatory: true, basis: 'Art. 2.2.3.3.5.5 num. 7' },
      { n: 9, name: 'Orden de notificación y de publicación conforme a los artículos 70 y 71 de la Ley 99 de 1993', mandatory: true, basis: 'Art. 2.2.3.3.5.5 par. 1' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/resolucion-que-otorga-o-niega-el-aprovechamiento-forestal',
    exactName: 'Resolución que otorga o niega el aprovechamiento forestal',
    branch: 'AMBIENTAL',
    role: 'DESPACHO',
    legalBasis: 'Decreto 1076 de 2015, arts. 2.2.1.1.7.6 y 2.2.1.1.7.7 (proceso); art. 2.2.1.1.7.8 (contenido de la resolución, que compiló el art. 30 del Decreto 1791 de 1996); art. 2.2.1.1.7.9 (seguimiento semestral); art. 2.2.1.1.7.10 (terminación y abandono); art. 2.2.1.1.7.11 (publicidad); art. 2.2.1.1.7.12 (vigencia); arts. 2.2.1.1.9.3 y 2.2.1.1.9.4 (árboles aislados)',
    competentAuthority: 'La Corporación Autónoma Regional o de Desarrollo Sostenible con jurisdicción en el área; tratandose de árboles aislados en centros urbanos, la autoridad ambiental urbana o la autoridad municipal según el caso (Decreto 1076 de 2015, arts. 2.2.1.1.7.6 y 2.2.1.1.9.4)',
    term: { status: 'NO_VERIFICADO', description: 'SIN TÉRMINO LEGAL PARA DECIDIR: el art. 2.2.1.1.7.6 solo describe la secuencia - «una vez recibido el plan de manejo forestal o el plan de aprovechamiento, respectivamente, las Corporaciones procederán a evaluar su contenido, efectuar las visitas de campo, emitir el concepto y expedir la resolución motivada». Los treinta (30) días hábiles del art. 2.2.1.1.16.4 corresponden al permiso de jardines botánicos y no rigen aquí. Excepciones de celeridad: trámite prioritario para árboles caídos, muertos o con problemas sanitarios (art. 2.2.1.1.9.1) y trámite «de inmediato» para la tala de emergencia en centros urbanos (art. 2.2.1.1.9.3). RELOJES POSTERIORES QUE OBLIGAN A LA AUTORIDAD Y AL TITULAR: la Corporación debe revisar el aprovechamiento «por lo menos semestralmente» y, si hay incumplimiento, «se iniciará el procedimiento sancionatorio correspondiente, mediante acto administrativo motivado» (art. 2.2.1.1.7.9); y se considera abandono la suspensión de actividades por noventa (90) días calendario o más (art. 2.2.1.1.7.10 par.). El aprovechamiento doméstico se otorga «mediante comunicación escrita» y no por resolución (art. 2.2.1.1.7.7).' },
    requiredSections: [
      { n: 1, name: 'Nombre e identificación del usuario', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. a' },
      { n: 2, name: 'Ubicación geográfica del predio con determinación de linderos', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. b' },
      { n: 3, name: 'Extensión de la superficie a aprovechar', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. c' },
      { n: 4, name: 'Especies, número de individuos, volúmenes, peso o cantidad y diámetros de corta', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. d' },
      { n: 5, name: 'Sistemas de aprovechamiento y manejo derivados de los estudios aprobados', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. e' },
      { n: 6, name: 'Obligaciones a las que queda sujeto el titular', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. f' },
      { n: 7, name: 'Medidas de mitigación, compensación y restauración y, en su caso, obligación de reponer las especies taladas', mandatory: true, basis: 'Arts. 2.2.1.1.7.8 lit. g y 2.2.1.1.9.4' },
      { n: 8, name: 'Derechos y tasas', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. h' },
      { n: 9, name: 'Vigencia del aprovechamiento', mandatory: true, basis: 'Arts. 2.2.1.1.7.8 lit. i y 2.2.1.1.7.12' },
      { n: 10, name: 'Obligación de presentar informes semestrales', mandatory: true, basis: 'Art. 2.2.1.1.7.8 lit. j' },
      { n: 11, name: 'Orden de notificación y publicación conforme a los artículos 70 y 71 de la Ley 99 de 1993 y envío de copia a las alcaldías', mandatory: true, basis: 'Art. 2.2.1.1.7.11' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=78153'
  },
  {
    id: 'ambiental/recurso-de-apelacion-contra-la-resolucion-sancionatoria-ambiental',
    exactName: 'Recurso de apelación contra la resolución sancionatoria ambiental',
    branch: 'AMBIENTAL',
    role: 'LITIGANTE',
    legalBasis: 'Ley 1333 de 2009, art. 30 (procede «siempre que exista superior jerárquico»); Ley 1437 de 2011, art. 74 num. 2 (ante el inmediato superior administrativo o funcional, y sus exclusiones), art. 76 (oportunidad, forma y carácter obligatorio para acceder a la jurisdicción) y art. 74 num. 3 (queja); Ley 99 de 1993, art. 23 (naturaleza de las CAR); Decreto 3573 de 2011, arts. 1 y 9 num. 8 (ANLA)',
    competentAuthority: 'El inmediato superior administrativo o funcional de quien profirió la sanción. En la práctica ambiental esto ocurre cuando la sanción la impuso un funcionario POR DELEGACIÓN — por ejemplo un subdirector de la CAR o de la ANLA —, y el superior es el Director General. NO hay superior jerárquico, y por tanto no procede apelación, contra la decisión del Director General de una CAR (ente corporativo con personería jurídica propia, Ley 99 de 1993, art. 23), contra la del Director de la ANLA (que solo resuelve reposición, Decreto 3573 de 2011, art. 9 num. 8), ni contra la del alcalde o gobernador, excluidos por el art. 74 num. 2 del CPACA.',
    term: { status: 'VERIFICADO', description: 'EL RELOJ DEL CLIENTE ES DE DIEZ (10) DÍAS, LOS MISMOS DE LA REPOSICIÓN, Y AQUÍ PERDERLO CUESTA EL PROCESO ENTERO. Ley 1437 de 2011, art. 76: «Los recursos de reposición y apelación deberán interponerse por escrito en la diligencia de notificación personal, o dentro de los diez (10) días siguientes a ella, o a la notificación por aviso, o al vencimiento del término de publicación, según el caso». LO QUE HACE DISTINTO A ESTE RECURSO: el mismo art. 76 remata — «El recurso de apelación podrá interponerse directamente, o como subsidiario del de reposición y cuando proceda será obligatorio para acceder a la jurisdicción. Los recursos de reposición y de queja no serán obligatorios». Es decir: donde la apelación PROCEDE, el sancionado que solo repuso NO agota la vía administrativa y pierde el acceso a la jurisdicción contencioso administrativa. ANTES DE CONFIAR EN ESTE RECURSO HAY QUE MIRAR QUIÉN FIRMÓ: la Ley 1333 de 2009, art. 30, solo lo concede «siempre que exista superior jerárquico», y la mayoría de las resoluciones sancionatorias ambientales las firma quien no lo tiene. SI SE LO RECHAZAN, EL RELOJ ES DE CINCO (5) DÍAS: el recurso de queja procede «cuando se rechace el de apelación» y «de este recurso se podrá hacer uso dentro de los cinco (5) días siguientes a la notificación de la decisión» (art. 74 num. 3). VIGENCIA COMPROBADA: la Ley 2387 de 2024 modificó los arts. 1, 2, 3, 5, 6, 7, 9, 10, 20, 24, 27, 36, 37, 40, 42 y 49 de la Ley 1333 y adicionó los 3A, 9A, 18A y 52A; NO tocó el art. 30, de modo que el régimen de recursos quedó intacto.' },
    requiredSections: [
      { n: 1, name: 'Identificación de la resolución apelada, de su fecha, de la autoridad que la profirió y de la forma en que fue notificada', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 1' },
      { n: 2, name: 'Constancia de que quien profirió la sanción tiene superior jerárquico, con indicación de la delegación o del acto de estructura que lo acredita', mandatory: true, basis: 'Ley 1333 de 2009, art. 30; Ley 1437 de 2011, art. 74 num. 2' },
      { n: 3, name: 'Interposición dentro de los diez (10) días siguientes a la notificación, en forma directa o como subsidiaria de la reposición', mandatory: true, basis: 'Ley 1437 de 2011, art. 76' },
      { n: 4, name: 'Sustentación con expresión concreta de los motivos de inconformidad', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 2' },
      { n: 5, name: 'Nombre y dirección del recurrente para notificaciones', mandatory: true, basis: 'Ley 1437 de 2011, art. 77 num. 3' },
      { n: 6, name: 'Relación de las pruebas que se pretende hacer valer', mandatory: false, basis: 'Ley 1437 de 2011, art. 77 num. 4' },
      { n: 7, name: 'Petición de que se revoque o modifique la sanción y, en subsidio, la de graduarla conforme a los criterios de atenuación', mandatory: true, basis: 'Ley 1437 de 2011, art. 74 num. 2; Ley 1333 de 2009, art. 40' }
    ],
    sourceUrl: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=36879'
  }
  ]
};
