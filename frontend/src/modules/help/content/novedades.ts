/**
 * Novedades: what changed in the application, and when.
 *
 * ─── EVERY ENTRY HERE IS SOMETHING THAT SHIPPED ─────────────────────────────
 *
 * The list is derived from the repository history, not from a roadmap. An
 * entry describes what changed FOR THE LAWYER — what they can do now that
 * they could not, or what stopped going wrong — never how it was built.
 * ONLY WHAT A LAWYER SEES. This list is for the people who use the app, not
 * for the people who build it: no deploys, no CI, no guards, no operator-only
 * consoles, no internal data fixes. If an entry cannot be understood from the
 * screen, it does not belong here — the owner asked for exactly this on
 * 2026-09-05 after reading entries about "producción".
 * NOR ANYTHING COMMERCIAL OR ABOUT GETTING IN: no prices, no new plan tiers,
 * no free trials, no sign-up or landing page, no registration rules. Whoever
 * reads this list is already inside and already pays; only improvements to
 * how the application works belong here (owner, 2026-09-05, second pass).
 *
 * Same-day fix-ups a user would not notice (wording of a commit, CI guards,
 * build markers) are left out, and several commits on one feature become a
 * single entry. Nothing below describes a capability that does not exist.
 *
 * Newest first. The UI groups by date; `modulo` feeds the filter chips.
 */

export interface Novedad {
  /** ISO date, YYYY-MM-DD. The day the change reached the application. */
  fecha: string;
  titulo: string;
  /** One or two sentences, for a lawyer: what changed for them. */
  detalle: string;
  /** Where in the application it lives: 'Taller', 'Revisiones', 'Soporte', … */
  modulo: string;
  tipo: 'nuevo' | 'mejora' | 'correccion';
}

/** The pseudo-article id under which the manual index opens this list. */
export const NOVEDADES_ID = 'novedades';

export const NOVEDADES: readonly Novedad[] = [
  {
    fecha: '2026-09-11',
    titulo: 'El informe de un documento recibido ya sabe a quién representa usted',
    detalle:
      'Al leer un documento que le llegó, el diálogo pregunta ahora «A quién representa en este proceso»: al demandante, al demandado, a la víctima o a la persona procesada en su etapa. No es obligatorio y arranca sin declarar. Con la respuesta, cada carga sale con su dueño: la que el documento le impone a la otra parte aparece marcada «Esta carga no es suya», con el destinatario que el propio documento nombra, y deja de pedirle que vaya a contar días por ella. Antes el informe decía «Qué LE exige y para cuándo» sin saber qué parte era usted, así que un auto que ordena al demandante subsanar en cinco días se lo publicaba igual al apoderado del demandado. Sin declarar posición, el rótulo pasa a «Qué exige el documento y para cuándo» y no se atribuye nada: la aplicación prefiere callar antes que suponerle un lado. Solo habla cuando el documento nombra a una sola parte; con «las partes», con los dos bandos a la vez o en una reconvención —donde los papeles se invierten— se queda en silencio. Lo mismo sale en el Word y en el PDF.',
    modulo: 'Revisiones',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-10',
    titulo: 'El interrogatorio se prepara desde el expediente, persona por persona',
    detalle:
      'La pestaña «Audiencia» del taller de revisión ya no está: el interrogatorio se prepara ahora en «Expedientes», dentro del asunto. En vez de tres listas fijas —a la contraparte, a mis testigos, a los testigos de la contraparte— escoge usted a quién va a interrogar, hasta cuatro por tanda, y recibe una lista por cada nombre, con la técnica que le corresponde escrita encima: abiertas a los suyos, cerradas a los de enfrente, y al perito por el método y no por lo que vio. Cada pregunta trae para qué sirve y, cuando nace de un pasaje, la cita literal. El interrogatorio se copia, se descarga en Word para seguir trabajándolo y en PDF para llevarlo impreso a la audiencia, con la letra de su membrete.',
    modulo: 'Expedientes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Suba el auto que le llegó y sepa qué le exige, para cuándo y por dónde se ataca',
    detalle:
      'El diálogo de revisión empieza ahora preguntando «Qué trae», con dos botones: «Un escrito mío, que voy a presentar» y «Un documento que recibí». Con el segundo no hay que decir qué actuación es —desaparece ese bloque entero y el botón se enciende con solo el documento— y lo que recibe no es una corrección sino una lectura: qué es el documento, qué decide u ordena, qué le exige y para cuándo con las palabras del propio documento entre comillas, qué queda pendiente, lo que el documento no dice, y hasta tres flancos «por dónde se ataca», cada uno con su cita y con el criterio del revisor rotulado aparte. Cuando el documento no anuncia plazo para una carga, la pantalla lo dice en ámbar en vez de ponerle uno de memoria, y lo mismo sale en el Word y en el PDF. La lectura se descarga en «Word» y «PDF» al pie del diálogo y vuelve a leerse después en la pestaña «Informe» del taller.',
    modulo: 'Revisiones',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Del documento que recibió a Redacción, con el escrito ya empezado',
    detalle:
      'Al pie de esa lectura está «¿Y con qué lo ataco?». «Llevar los flancos a la guía de actuaciones» los manda a la guía con la cita literal del documento, la norma que el documento invoca transcrita y el texto completo debajo; escogida una candidata aparece «Redactar esta actuación», que abre «Qué pedirle al motor» con instrucciones ya escritas —la primera junta el encargo de la ficha con los flancos y sus citas— y «Llevar a Redacción» abre el taller con la actuación puesta y el cuadro «Qué debe hacer este escrito» en dos mitades rotuladas: la instrucción arriba y «HECHOS» debajo. Esas instrucciones ya escritas existen cuando el catálogo devuelve la ficha de la actuación; si es una actuación propia de la firma, sin catalogar, la pantalla lo dice, los flancos viajan a Redacción dentro de los HECHOS y el cuadro va sin encargo. Ese pie está ahora también en el taller, que es donde se vuelve a leer el informe días después; hasta hoy ahí no había por dónde seguir.',
    modulo: 'Revisiones',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Pedir una revisión desde «Revisiones», sin pasar por Redacción',
    detalle:
      'La cabecera del módulo tiene ahora tres botones: «Actualizar», «Ir a Redacción» y «Revisar un escrito», que abre el diálogo ahí mismo. Y dentro del diálogo, la rama y la actuación se eligen sin salir: escoja la rama, adjunte el archivo y pulse entonces «Que la guía diga qué actuación es» —lee el archivo en su propio navegador, no lo sube y no cuesta nada— para que el catálogo proponga candidatas con su término, su artículo y su autoridad. La rama se sigue eligiendo a mano y es obligatoria: sin ella el botón está apagado, porque el catálogo propone dentro de una rama y nunca a ciegas; lo que la guía propone es la actuación. Hasta hoy el botón de esa cabecera prometía revisar y solo navegaba a Redacción, donde había que declarar la actuación antes de tener el archivo delante, que es justo lo que no sabe quien recibe un escrito ajeno.',
    modulo: 'Revisiones',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-09',
    titulo: 'En Orientación puede adjuntar el oficio en vez de volver a contarlo',
    detalle:
      'Bajo el cuadro de los hechos hay ahora dónde soltar el documento: en el computador, «Arrastre aquí el oficio, la demanda o la notificación» o escoger el archivo; en el teléfono, un renglón que abre el selector. Se leen PDF de hasta 40 páginas, Word y texto plano, en su propio navegador: no se sube nada y no cuesta nada. El texto cae añadido al final de lo que ya escribió, separado por un renglón en blanco, y nunca lo sustituye; el cuadro sigue siendo editable, así que usted ve y recorta exactamente lo que va a viajar, y «Quitar» deshace el adjunto. Si el archivo no se deja leer, lo escrito queda intacto y la pantalla dice el motivo.',
    modulo: 'Orientación',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Al escoger la actuación propuesta, se le ofrece ya escrito qué pedirle al motor',
    detalle:
      'En las fichas cuyo término ya está verificado, «Redactar esta» ya no salta a Redacción: abre debajo de esa misma tarjeta el panel «Qué pedirle al motor», con hasta tres instrucciones listas —«Con las secciones y la autoridad», «Con la norma y el término» y «Solo el encargo»—, escogibles y editables. Cada línea jurídica es cita literal de un campo de la ficha, y el término solo entra cuando está verificado. Al pulsar «Llevar a Redacción», el cuadro «Qué debe hacer este escrito» llega en dos mitades rotuladas: la instrucción arriba y «HECHOS» debajo con su relato. En las fichas cuyo término está sin verificar no hay panel: en el computador el botón es «Verificar y catalogar» y en el teléfono la tarjeta no ofrece botón, porque primero se comprueba el término. Antes viajaban los hechos y nada más, y usted llegaba a ese cuadro con su propio relato dentro y sin saber qué pedir.',
    modulo: 'Orientación',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Redactar cuando no sabe cómo se llama la actuación',
    detalle:
      'El desplegable «Actuación» tiene una salida más: «No sé cómo se llama: describir qué debe lograr…». Escriba en sus palabras qué debe conseguir el escrito, vea antes de guardar exactamente cómo va a quedar en la lista, y pulse «Guardar y redactar». Queda como actuación de su firma, marcada «título de trabajo · no es el nombre de una figura». El escrito que sale no se bautiza recurso, tutela, incidente ni nulidad: se encabeza diciendo qué se pide y ante quién, con las palabras de su objetivo, y declara que su término no está verificado y debe comprobarse antes de radicar. La franja sobre el papel lo repite: «Este escrito se redactó sin nombre de actuación». La salida anterior le exigía justamente lo que no tenía —un nombre— y empujaba a inventar una denominación jurídica. En «Catálogo» puede escribirle después el término y la fuente que le faltan.',
    modulo: 'Redacción',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Cuando el catálogo no reconoce nada en su rama, se puede buscar en todo el catálogo',
    detalle:
      'En el cuadro «Que la guía proponga la actuación» hay ahora una casilla «No sé la rama: buscar en todo el catálogo», y tras un «no reconozco nada» aparece además el botón «Puede que la rama no sea esa: buscar en todo el catálogo», que repite la consulta en el acto sin volver a escribir los hechos. La búsqueda corre sobre las veintiocho ramas y cada candidata dice de cuál viene. Se le advierte antes lo que cuesta la espera: entre diez y quince segundos, contra un par. Hasta hoy, escoger la rama equivocada hacía que la plataforma dijera que no había actuación para esos hechos sobre una actuación que sí estaba catalogada. La búsqueda la encuentra y dice de qué rama viene, pero escogerla todavía no cambia la «Rama» de la barra: hay que cambiarla usted arriba y elegir después la actuación en la lista. Si no lo hace, en el computador el selector vuelve a «Elegir actuación…» y en el teléfono el nombre se queda puesto pero el escrito se resuelve contra la rama de arriba y sale sin ficha.',
    modulo: 'Redacción',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-09',
    titulo: 'El escrito llega completo, y si el motor no lo entrega la pantalla lo dice',
    detalle:
      'La redacción vuelve a terminar y a entregar el escrito de la actuación que usted eligió, con sus títulos de sección en negrita. Cuando el motor no alcanzaba a entregarlo pasaban dos cosas peores que un error: la aplicación devolvía una plantilla genérica que no era la actuación pedida y sin negritas, y la pantalla se quedaba esperando indefinidamente. Ya no fabrica ningún escrito de repuesto y ya no se queda colgada: el aviso aparece en rojo en la consola «Ejecución», la espera se cierra y la reserva del saldo vuelve a la cuenta.',
    modulo: 'Redacción',
    tipo: 'correccion'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Ya no se pierden letras al escribir dentro de un diálogo',
    detalle:
      'Con un diálogo abierto —el de revisar, el de una calculadora, el del membrete, el de cerrar una entrevista, el de la agenda de términos— el cursor se salía solo del cuadro de texto cada veinte segundos, y también cada vez que usted volvía a la ventana del navegador después de cambiar de aplicación: las teclas siguientes no entraban en ninguna parte y la palabra quedaba partida. Ya no ocurre en ninguno. «Esc» sigue cerrando, y al cerrar de verdad el foco sigue volviendo al botón que abrió el diálogo.',
    modulo: 'Toda la aplicación',
    tipo: 'correccion'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Los recursos del CGP ya se ven en las ramas que el CGP gobierna',
    detalle:
      'En familia, societario, insolvencia, propiedad intelectual, contratos y constitucional aparecen ahora, al final de la lista de actuaciones, la reposición, la apelación, la queja, la súplica, la nulidad procesal, el desistimiento, la aclaración, la corrección, la adición, el amparo de pobreza, la acumulación y el poder. Hasta hoy solo eran alcanzables desde la rama civil, así que al revisar un escrito de esas ramas no había ficha contra la cual revisarlo. Llegan marcadas «por remisión del CGP · plazo sin verificar en esta rama» y sin afirmar plazo: su término está comprobado en lo civil y nadie lo ha comprobado para la rama de usted. En «Catálogo», quien cura puede verificarlo para su rama sin que eso cambie la ficha civil.',
    modulo: 'Catálogo',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Del taller de revisión a Redacción, sin copiar y pegar',
    detalle:
      'En el taller de una revisión, junto a «Word» y «PDF», hay ahora «Llevar a Redacción». Guarda el texto tal como lo tiene en el taller como un borrador nuevo de la firma —con la actuación y la rama de la revisión y el nombre del archivo como título— y abre Redacción con él cargado, como si lo hubiera abierto desde «Borradores». Es una copia: la revisión, su informe y su conversación quedan intactos en «Revisiones». Hasta ahora, para seguir trabajando un escrito revisado como borrador había que copiar el texto y pegarlo a mano.',
    modulo: 'Revisiones',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Los cálculos también se descargan en PDF, para imprimirlos',
    detalle:
      'Junto a «Exportar a Excel», cada calculadora tiene ahora «Exportar a PDF». Los dos archivos salen del mismo cálculo, así que dicen lo mismo: las cifras, el detalle fila por fila y las fuentes con su norma, su dirección y la fecha en que se consultaron. El Excel sirve para seguir trabajando el número; el PDF, para imprimirlo y anexarlo al expediente, y sale con la letra y el tamaño de su membrete, en carta y con los márgenes de siempre. Si la tabla del detalle pasa de una hoja, la cabecera se repite arriba y ninguna fila queda partida a la mitad.',
    modulo: 'Herramientas',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-09',
    titulo: 'La agenda de términos de su firma, con aviso al teléfono',
    detalle:
      'En Herramientas, la tarjeta «Agenda de términos» reúne lo que se le vence: el calendario del año con sus vencimientos encima, la lista de lo que viene con los días que faltan, y el formulario para añadir uno. Usted registra el asunto, elige la actuación del catálogo y pone la fecha de notificación; la fecha límite la calcula la aplicación con el mismo motor del contador de términos, descontando festivos y vacancia, y le muestra qué descontó. Cuando la ficha describe más de un plazo o nadie ha comprobado su término, se lo dice, le enseña el término tal como lo escribe la ficha y le pide el número de días; la entrada queda marcada «sin verificar» en vez de dar por buena una fecha que nadie comprobó. Los avisos llegan cinco días antes, dos días antes y el día del vencimiento, a toda la firma o solo al responsable que usted indique. Desde «Borradores» y «Revisiones», «Poner en la agenda» abre el formulario con el caso y la actuación ya elegidas.',
    modulo: 'Herramientas',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Herramientas se ve como una retícula de tarjetas, con filtros y la fuente de cada cálculo a la vista',
    detalle:
      'Las siete utilidades dejan de ser renglones de una lista: cada una tiene su tarjeta numerada, con un dibujo que anticipa lo que calcula, la frase de qué hace y, al pie, la norma de la que sale su cifra, el estado de esa fuente y la insignia «Excel» donde la exportación existe —el glosario no la lleva porque no calcula nada—. Arriba puede filtrar entre «Términos», «Dinero» y «Referencia», o seguir buscando por nombre o por lo que necesita calcular. En el teléfono la primera tarjeta va completa y las demás quedan como filas con su miniatura.',
    modulo: 'Herramientas',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-09',
    titulo: 'Al cambiar de plan, la pantalla le dice antes de pagar desde cuándo corre el nuevo',
    detalle:
      'En «Plan de la firma», si elige un plan distinto del que tiene y todavía le quedan días, la tarjeta lo advierte debajo del botón: el plan nuevo empieza su ciclo el día del pago y los días que le quedan del actual no se acreditan. Ahí mismo se le recuerda que, si prefiere conservar su fecha de vencimiento, puede escribirnos por Soporte antes de pagar. Renovar el plan que ya tiene —también al pasar de mensual a anual— sigue sumando el periodo a la fecha vigente, sin perder un día.',
    modulo: 'Plan',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-08',
    titulo: 'Su nombre, escrito por usted y no deducido de su correo',
    detalle:
      'En «Ajustes · Su cuenta» hay un campo «Su nombre»: escríbalo y quedará guardado en su cuenta. Aparece bajo la palabra «Iureon» en la barra lateral, en el saludo de Inicio y junto a su correo en la lista de usuarios de la firma. Hasta ahora la aplicación lo deducía de la parte anterior a la arroba, que rara vez acertaba; el correo sigue siendo con lo que entra y no se sustituye en ninguna parte.',
    modulo: 'Ajustes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-08',
    titulo: 'En Redacción, la guía puede proponerle la actuación —y si ninguna sirve, usted la escribe',
    detalle:
      'El desplegable «Tipo de documento» abre ahora con «Que la guía proponga la actuación»: sobre los hechos que ya escribió, le propone actuaciones de la rama elegida con la razón de cada una y su término, artículo y autoridad a la vista, para que decida usted. Y al final de la lista, «Ninguna de estas: escribir el nombre…» le deja añadir la actuación que le falta: queda elegida en el acto y disponible en esa rama para toda su firma, marcada «sin norma verificada» hasta que alguien escriba su término y su fuente en «Catálogo».',
    modulo: 'Redacción',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-08',
    titulo: 'Work Sans, nueva letra para la interfaz y para el escrito',
    detalle:
      'En «Ajustes · Apariencia» puede elegir Work Sans como letra de la aplicación; IBM Plex Sans sigue siendo la de por defecto. En «Membrete» también está disponible como letra del escrito: se ve en pantalla, sale en el Word y va incrustada en el PDF, con negrita e itálica propias.',
    modulo: 'Ajustes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-08',
    titulo: 'El menú lateral, rediseñado: índice numerado y panel claro',
    detalle:
      'En el computador, la barra de la izquierda pasa a ser un panel claro con los módulos numerados como un índice —01 Redacción, 02 Borradores…— y el activo en tinta con su número en dorado. La tarjeta de saldo muestra el plan y su vencimiento, y «Colapsar», al pie, reduce el panel a fichas con el icono de cada módulo; el botón cambia de sentido para volver a desplegarlo. En el teléfono nada cambia.',
    modulo: 'Inicio',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-08',
    titulo: 'Preguntas para la audiencia a partir del escrito revisado',
    detalle:
      'En el taller de una revisión, la pestaña «Audiencia» pide a la guía tres listas de preguntas sobre el escrito tal como está: a la contraparte, a sus testigos y a los testigos de la contraparte. Usted indica su posición —Demandante, Demandado u otra— y, si quiere, qué busca probar y el tipo de audiencia. Cada pregunta trae para qué sirve y el pasaje del escrito del que nace; se copian o se descargan en Word, y el último juego queda con la revisión.',
    modulo: 'Taller',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-08',
    titulo: 'El taller guarda solo: texto, conversación, comentarios y versiones',
    detalle:
      'Con la autorización de la firma, todo lo que hace en el taller se guarda dos segundos después de cada cambio y también al cerrar u ocultar la pestaña; la cinta dice «Guardando…» o «Guardado hace un momento». Al volver a abrir la revisión está todo como lo dejó. La primera vez que un socio administrador revisa un escrito, la aplicación pregunta antes si conservar el escrito y su trabajo o solo el informe. En Redacción, el escrito generado queda guardado como borrador en el acto, y «Guardar» avisa en la misma pantalla en vez de con un cuadro del navegador.',
    modulo: 'Taller',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-08',
    titulo: 'Pantalla de Inicio y visita guiada por la plataforma',
    detalle:
      'Al entrar, y al pulsar el logo, aparece «Inicio»: el saludo con la fecha, tres accesos a redactar, revisar y transcribir, sus últimos borradores y revisiones para continuar donde iba, el plan con su vencimiento y el saldo, y las tres novedades más recientes. Desde ahí, y desde el índice del manual, «Visita guiada» recorre cada módulo en dos minutos señalándolo en pantalla y diciendo para qué sirve; la primera vez en este navegador, Inicio la ofrece. También en el teléfono, donde «Inicio» es la primera pestaña de la barra inferior.',
    modulo: 'Inicio',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-05',
    titulo: 'Recargar deja la pantalla exactamente donde estaba, y el logo lleva al inicio',
    detalle:
      'Al recargar la página vuelve el borrador que tenía abierto, el taller de la revisión, la audiencia o entrevista que estaba leyendo, la calculadora y el artículo del manual —no solo el módulo—. El logo de Iureon, en la barra lateral y en la cabecera del teléfono, lleva al inicio y cierra lo que estuviera abierto en los demás módulos. En el teléfono y en la aplicación instalada, tirar hacia abajo desde el borde superior recarga la pantalla.',
    modulo: 'Móvil',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-05',
    titulo: 'Puede eliminar su usuario o su firma desde Ajustes',
    detalle:
      'En Ajustes → «Su cuenta», al final, está la «Zona de riesgo». «Eliminar mi usuario» borra su acceso y deja sus escritos, revisiones y transcritos en la firma; el socio administrador tiene además «Eliminar la firma y todos sus datos», que borra escritos, revisiones, transcripciones, clientes, pagos, usuarios y saldo. Las dos piden la contraseña, la segunda también el nombre exacto de la firma, y ninguna se deshace. Funcionan aunque el plan esté vencido.',
    modulo: 'Ajustes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-05',
    titulo: 'Los adjuntos ya se leen y sus datos entran al escrito',
    detalle:
      'Los PDF, Word, textos e imágenes que adjunte en Redacción —la foto de un comparendo, un oficio, una cédula— se leen antes de redactar, y sus números, fechas, lugares, nombres y valores entran al escrito en vez de quedar como [•]. La consola de ejecución dice qué se leyó de cada archivo; si un dato del adjunto contradice lo que usted escribió, prevalece lo suyo y la diferencia queda anotada. Hasta 8 archivos y 20 MB por escrito.',
    modulo: 'Redacción',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-05',
    titulo: 'Con el plan vencido la aplicación queda en solo lectura',
    detalle:
      'Todos ven una franja roja arriba; Redacción, Orientación, Buscador, Catálogo, Herramientas, Audiencias y Entrevistas se cubren con un aviso, y las listas de borradores y revisiones siguen abiertas para leer y exportar, sin botones de crear. Al renovar, todo vuelve en el acto.',
    modulo: 'Planes',
    tipo: 'mejora'
  },
  /* ── 5 de septiembre de 2026 ─────────────────────────────────────────── */
  {
    fecha: '2026-09-05',
    titulo: 'El escrito revisado conserva sus párrafos y sus títulos van en negrita',
    detalle:
      'Los escritos que se suben a revisión llegan ahora con sus saltos de párrafo, así que hechos, pretensiones y fundamentos se leen separados en el taller y en el informe. Los ya revisados recuperan su estructura al abrirse. Van en negrita los encabezados de sección, las etiquetas como «ACCIONANTE:», los ordinales, los nombres en mayúscula, las cédulas y las fechas en letras.',
    modulo: 'Revisiones',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-05',
    titulo: 'La respuesta de la guía muestra sus puntos con títulos en negrita',
    detalle:
      'Cuando la guía responde por puntos numerados o con letras, el número y el título de cada punto van en negrita, y las negritas que ella marca se ven como tales. Los párrafos van justificados.',
    modulo: 'Taller',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Cuenta de cobro en PDF y confirmación por correo de cada pago',
    detalle:
      'En «Pagos del plan», cada pago tiene el botón «Cuenta de cobro» que descarga el soporte en PDF. Quien paga una recarga o un plan recibe además un correo de confirmación, con la cuenta de cobro adjunta en el caso del plan.',
    modulo: 'Planes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Ajustes completo: atajos, avisos, su cuenta y plan',
    detalle:
      'Las cuatro entradas que decían «pronto» ya abren algo real: la lista de atajos de teclado, la activación de avisos e instalación de la app en este dispositivo, los datos de su cuenta con el cierre de sesión, y el plan vigente de la firma.',
    modulo: 'Ajustes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'El taller usa la letra del membrete y el menú lateral cabe sin desplazarse',
    detalle:
      'El papel del taller de revisiones y de borradores se lee con la tipografía, el cuerpo y el interlineado configurados en Membrete, igual que el visor y el PDF. El menú lateral se compactó para caber completo en pantallas bajas, y el logo se ve nítido sobre el azul.',
    modulo: 'Taller',
    tipo: 'mejora'
  },
  /* ── 4 de septiembre de 2026 ─────────────────────────────────────────── */
  {
    fecha: '2026-09-04',
    titulo: 'Cuatro calculadoras nuevas, con su fuente oficial y exportación a Excel',
    detalle:
      'Herramientas suma indexación por IPC, intereses de mora (comercial, civil o pactada con aviso de usura), competencia por cuantía y calendario judicial. Cada una muestra la fórmula y la norma que la sustenta, y todas exportan a Excel con hojas de resultado, detalle y fuentes.',
    modulo: 'Herramientas',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'El contador de términos calcula los festivos desde la ley, para cualquier año',
    detalle:
      'La tabla de festivos escrita a mano tenía 17 en vez de 19 y omitía San Pedro y San Pablo. Ahora los días hábiles se calculan a partir de la norma que los fija, incluida la vacancia judicial y el festivo nuevo de 2026.',
    modulo: 'Herramientas',
    tipo: 'correccion'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Iureon se instala en el teléfono y en el computador, y avisa por notificaciones',
    detalle:
      'Desde «Avisos» puede instalar la aplicación en Android, iPhone o PC como una app propia y activar notificaciones en ese dispositivo. En iPhone se explican los pasos de Safari, porque el sistema no ofrece instalación directa.',
    modulo: 'Móvil',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Planes Esencial y Premium, mensuales o anuales',
    detalle:
      'La firma contrata su plan desde «Plan», en el pie de la barra lateral, y paga con el mismo checkout de Wompi de las recargas. El plan anual son doce meses por el precio de diez, y es independiente del saldo de IA.',
    modulo: 'Planes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Chat de soporte dentro de la aplicación',
    detalle:
      'Desde Soporte abre una conversación con asunto y mensaje, y sigue el hilo ahí mismo. La atiende el operador de la plataforma, y cada respuesta queda en la auditoría de su firma. No se promete tiempo de respuesta.',
    modulo: 'Soporte',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Tamaño de letra ajustable en el taller, el borrador y los transcritos',
    detalle:
      'Un control «A − / 100 % / A +» agranda o reduce el texto en pantalla, del 85 % al 200 %, y cada pantalla recuerda su tamaño. Es tamaño de lectura: el PDF y el Word salen con el formato de Membrete, sin cambios.',
    modulo: 'Redacción',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-04',
    titulo: 'La guía del taller comprueba en la Corte las sentencias que usted nombra',
    detalle:
      'Cada cita constitucional que usted escriba en el chat o en un comentario se consulta en el índice oficial de la Corte Constitucional antes de que la guía responda. Así la discusión deja de ser memoria contra memoria.',
    modulo: 'Taller',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Cada artículo del manual dice dónde se hace, con pasos numerados y avisos por color',
    detalle:
      'Los 18 artículos abren con la ruta de pantallas y botones, traen pasos en orden y avisos diferenciados por color. Se corrigieron seis frases que describían botones o contadores que no existen, y se añadió el artículo del chat de soporte.',
    modulo: 'Manual',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-04',
    titulo: 'Audiencias y Entrevistas usan más ancho de la pantalla',
    detalle:
      'El contenido dejaba espacio vacío a los lados, sobre todo con la barra lateral plegada. Ahora aprovecha pantallas grandes; en las angostas no cambia nada.',
    modulo: 'Audiencias',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-04',
    titulo: 'En el teléfono la lista de audiencias ya no se corta a la derecha',
    detalle:
      'El nombre de la audiencia se encogía hasta desaparecer y el estado salía cortado. Cada fila va ahora en dos renglones: nombre y menú arriba, cifras y estado abajo.',
    modulo: 'Audiencias',
    tipo: 'correccion'
  },

  /* ── 3 de septiembre de 2026 ─────────────────────────────────────────── */
  {
    fecha: '2026-09-03',
    titulo: 'El taller: corregir un escrito con el revisor al lado',
    detalle:
      'Después de un informe de revisión, o desde el botón «Taller» sobre cualquier borrador de Redacción, abre el escrito con los pasajes objetados tachados, edítelo y converse con la guía sobre el texto tal como está. «Volver a revisar» emite un informe nuevo sobre el texto corregido.',
    modulo: 'Taller',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-03',
    titulo: 'Resaltador de colores, comentarios sobre pasajes y versiones comparables',
    detalle:
      'Seleccione un pasaje para resaltarlo en amarillo, verde, azul o rosa, tacharlo o dejarle un comentario anclado. La guía lee sus marcas y sus comentarios, y el escrito guarda versiones que se comparan palabra por palabra con el texto actual.',
    modulo: 'Taller',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-03',
    titulo: 'El texto del taller se guarda con autorización expresa de la firma',
    detalle:
      'Un socio administrador autoriza una vez, y desde entonces el texto de trabajo y la conversación se guardan junto al informe. Sin autorización viven solo en la sesión y la pantalla lo dice. El estado de esa autorización se ve siempre en Revisiones.',
    modulo: 'Revisiones',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-03',
    titulo: 'El papel del taller se lee como el de Redacción',
    detalle:
      'Hoja centrada de ancho fijo, pantalla completa, barra de desplazamiento siempre visible, párrafos justificados y los títulos del escrito en negrita. El botón «Taller» aparece también arriba del papel, junto a «Editar».',
    modulo: 'Taller',
    tipo: 'mejora'
  },

  /* ── 2 de septiembre de 2026 ─────────────────────────────────────────── */
  {
    fecha: '2026-09-02',
    titulo: 'Revisar un escrito ya redactado contra la ficha de la actuación',
    detalle:
      'Suba la tutela, la demanda o el recurso que ya escribió (PDF, Word o texto pegado) y pregunte qué está bien, qué está mal y qué corregir. El informe trae juicio global, secciones que la norma exige y faltan, fortalezas, debilidades, errores con su corrección y las frases objetadas citadas literalmente con un reemplazo propuesto.',
    modulo: 'Revisiones',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-02',
    titulo: 'Los informes de revisión se guardan y se descargan en PDF y Word',
    detalle:
      'Cada informe queda en «Revisiones anteriores» con la actuación, el archivo, el cliente o proceso, la fecha y quien lo pidió, y se descarga con la letra de la firma. El texto del escrito revisado no se conserva: se lee una vez y se descarta.',
    modulo: 'Revisiones',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-02',
    titulo: 'La revisión acepta escritos de hasta 15 MB y 300.000 caracteres',
    detalle:
      'Una tutela con anexos escaneados ya cabe; el envío muestra su porcentaje. Si el informe no se puede entregar, no se cobra. El botón «Revisar» explica qué le falta cuando está apagado, por ejemplo elegir la actuación.',
    modulo: 'Revisiones',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-02',
    titulo: 'Nueve tipografías para el escrito, y el PDF sale con la que la firma eligió',
    detalle:
      'Se suman Tahoma, Plus Jakarta Sans, Manrope, Public Sans y Satoshi. La pantalla, el Word y el PDF obedecen la misma configuración de Membrete; antes el lienzo mostraba siempre la misma letra y el PDF ignoraba la elección.',
    modulo: 'Membrete',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-02',
    titulo: 'El membrete imprime solo lo que la firma escribió',
    detalle:
      'Una firma que no había llenado Membrete exportaba escritos con un encabezado de maqueta («Rama Judicial», un correo inventado). Ahora, sin configuración, el escrito lleva únicamente el nombre de la firma y su NIT si lo tiene.',
    modulo: 'Membrete',
    tipo: 'correccion'
  },
  {
    fecha: '2026-09-02',
    titulo: 'Extracto mensual del saldo con comprobante imprimible',
    detalle:
      'En el panel de Saldo elija un mes y vea saldo inicial, entradas, salidas por concepto y saldo final, con la revisión de escritos contada aparte. El comprobante dice en su pie que no es factura de venta.',
    modulo: 'Saldo',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-02',
    titulo: 'La cifra de saldo de la barra lateral se actualiza sola',
    detalle:
      'El saldo es de la firma, no de su sesión: se relee cada veinte segundos mientras la pestaña está visible y después de cada revisión. Ya no hace falta refrescar para ver lo que gastó otro abogado.',
    modulo: 'Saldo',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-02',
    titulo: 'Satoshi, séptima tipografía de interfaz',
    detalle: 'Se elige en Ajustes, como las demás, y solo la descarga quien la selecciona.',
    modulo: 'Ajustes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-09-02',
    titulo: 'En el teléfono, las preguntas de «Antes de escribir» abren su artículo',
    detalle:
      'En Soporte móvil los atajos eran texto plano; ahora llevan directo al artículo del manual que responde cada pregunta.',
    modulo: 'Soporte',
    tipo: 'correccion'
  },

  /* ── 1 de septiembre de 2026 ─────────────────────────────────────────── */
  {
    fecha: '2026-09-01',
    titulo: 'La segunda entrevista sabe qué respondió la primera',
    detalle:
      'Cuando una persona vuelve, el guion sugerido parte de lo que ya se cubrió en la entrevista anterior en vez de tratar cada reunión como la primera. En el teléfono el guion aparece al terminar de transcribir, no mientras se graba.',
    modulo: 'Entrevistas',
    tipo: 'mejora'
  },
  {
    fecha: '2026-09-01',
    titulo: 'Recargar saldo abre Wompi directamente',
    detalle:
      'El salto al pago navega a Wompi en vez de enviar un formulario oculto, y deja un enlace de respaldo por si el navegador bloquea la redirección. La recarga ya no depende de un cuadro del navegador.',
    modulo: 'Saldo',
    tipo: 'correccion'
  },
  {
    fecha: '2026-09-01',
    titulo: 'Rama de Urbanismo en el catálogo',
    detalle:
      'Seis actuaciones nuevas, y con ellas ninguna rama del catálogo queda vacía.',
    modulo: 'Catálogo',
    tipo: 'nuevo'
  },

  /* ── 29 de agosto de 2026 ────────────────────────────────────────────── */
  {
    fecha: '2026-08-29',
    titulo: 'La aplicación se rediseñó para el teléfono',
    detalle:
      'Barra inferior con «Redactar», «Orientar», «Grabar» y «Más»; el taller en dos pantallas; borradores como lista por vencimiento; catálogo, buscador, orientación, entrevistas, audiencias, manual, soporte, ajustes y auditoría con pantallas propias, y los diálogos como hojas ancladas abajo.',
    modulo: 'Móvil',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-29',
    titulo: 'El Consejo de Estado entra al descubrimiento de jurisprudencia',
    detalle:
      'Cuando el corpus no alcanza, el buscador consulta en paralelo la Corte Constitucional, la Corte Suprema y el Consejo de Estado, ordenado por relevancia. El texto es el extracto de la relatoría y así se rotula.',
    modulo: 'Buscador',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-29',
    titulo: 'La subida de una grabación muestra su porcentaje, y borrar es inmediato',
    detalle:
      '«Enviando la grabación…» no se movía y parecía un cuelgue; ahora se ve el avance. Eliminar una audiencia tardaba en proporción a su duración y ya no.',
    modulo: 'Audiencias',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-29',
    titulo: 'La baja confianza se marca solo en el fragmento dudoso, y el acta tiene variantes',
    detalle:
      'Antes se subrayaba la intervención entera; ahora solo las palabras que el motor dudó. El acta se exporta con o sin minutos, completa o solo con las intervenciones marcadas como clave.',
    modulo: 'Audiencias',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-29',
    titulo: 'La onda de audio al grabar y al escuchar, y pausa también en escritorio',
    detalle:
      'La onda mide el sonido real: con el micrófono mudo se aplana. Al reproducir una audiencia o entrevista se ve dónde el micrófono captó algo, con controles propios de escuchar, pausar y detener.',
    modulo: 'Audiencias',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-29',
    titulo: 'Ficha del cliente, guion sugerido y hechos clave en la entrevista',
    detalle:
      'La entrevista empieza por quién está al frente, con su contacto y tratamiento de datos; el guion se tacha con lo que se dijo y avisa qué cuesta no preguntar algo. Puede marcar como hecho clave una intervención, y el acta se exporta aun durante la grabación.',
    modulo: 'Entrevistas',
    tipo: 'nuevo'
  },

  /* ── 28 de agosto de 2026 ────────────────────────────────────────────── */
  {
    fecha: '2026-08-28',
    titulo: 'Manual de uso y Soporte, dentro de la aplicación',
    detalle:
      'El manual está escrito por tarea, viaja con la aplicación y se puede leer aunque nada más cargue. Soporte explica cada vía de contacto y qué esperar de ella.',
    modulo: 'Manual',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-28',
    titulo: 'El catálogo pasa de 674 a 794 actuaciones',
    detalle:
      'Entran garantías mobiliarias, embargos y remate, promesa, propiedad horizontal, arrendamiento, cobro coactivo, títulos valores, poder, conciliación previa, costas, desistimiento tácito, monitorio, providencias penales e internacionales, insolvencia y societario, ARL y Junta Nacional, entre otras.',
    modulo: 'Catálogo',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-28',
    titulo: 'La Comisión Nacional de Disciplina Judicial, por su relatoría propia',
    detalle:
      'Cuando el corpus no alcanza, el buscador consulta también la relatoría disciplinaria, con su procedencia declarada en cada resultado. Si el descubrimiento no encuentra nada o falla, la pantalla lo dice en vez de quedarse muda.',
    modulo: 'Buscador',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-28',
    titulo: 'Orientación ordena por el término más corto y lleva a catalogar lo que falta',
    detalle:
      'De los hechos a la actuación: los resultados se ordenan por el plazo que vence primero, la tarjeta sin verificar lleva a curarla, y cuando no hay coincidencia se ofrecen tres salidas en vez de una pantalla vacía.',
    modulo: 'Orientación',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-28',
    titulo: 'La curaduría muestra las secciones obligatorias de cada ficha',
    detalle:
      'Existían en las fichas y la pantalla no las mostraba. Ahora se ven y se revisan junto al término y la fuente.',
    modulo: 'Catálogo',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-28',
    titulo: 'Los PDF del escrito y de las actas adoptan el diseño de la firma',
    detalle:
      'El escrito sale con membrete y logo, tipografía, interlineado y paginación reales; las actas de entrevista y de audiencia tienen cada una su papel, con intervinientes, advertencia y desarrollo por minuto. Exportar no llama al modelo ni a la red.',
    modulo: 'Exportar',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-28',
    titulo: 'El formato de la firma ya no borra las secciones obligatorias del escrito',
    detalle:
      'La rama llega completa al motor de redacción, el rol elegido no se devuelve al cambiar de rama, y el formato configurado en Membrete deja de eliminar secciones que la norma exige.',
    modulo: 'Redacción',
    tipo: 'correccion'
  },

  /* ── 27 de agosto de 2026 ────────────────────────────────────────────── */
  {
    fecha: '2026-08-27',
    titulo: 'Membrete de la firma: logo, datos y formato que viajan hasta el escrito',
    detalle:
      'El membrete es de la firma, no de cada escrito. El Word y el PDF obedecen el tamaño y el interlineado configurados, y el formato llega al motor que redacta.',
    modulo: 'Membrete',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Gestión de usuarios de la firma y consumo por abogado',
    detalle:
      'Los socios administran las cuentas de su firma, ven cuánto consume cada abogado y deciden quién puede verificar términos. Verificar pasa a ser un permiso de socios.',
    modulo: 'Ajustes',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-27',
    titulo: 'La auditoría registra los actos reales de la firma y no se puede alterar',
    detalle:
      'Generar, exportar, verificar, recargar y las demás acciones quedan escritas con quién y cuándo, y la base impide modificarlas. Se consulta desde «Seguridad».',
    modulo: 'Seguridad',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Resumen y hechos relevantes de cada transcripción, anclados a su minuto y su voz',
    detalle:
      'Al abrir una audiencia o entrevista transcrita puede pedir el resumen y los hechos; cada hecho lleva el minuto y quién lo dijo. Las intervenciones se marcan como leídas y la fracción revisada es real.',
    modulo: 'Audiencias',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Subir audio dice qué va a pasar y cuánto cuesta; la entrevista no graba sin autorización',
    detalle:
      'Las listas de audiencias y entrevistas se ordenan por lo que falta hacer. La entrevista pide la autorización del cliente antes de grabar, la deja con hora, y cierra en una decisión sobre el caso.',
    modulo: 'Entrevistas',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Lo curado y lo automático son dos bloques en el buscador',
    detalle:
      'La jurisprudencia verificada por la firma y la hallada por descubrimiento se muestran separadas, y citar lo que no se ha leído cuesta un clic más. La Corte Suprema entra al corpus con casación civil, laboral y penal.',
    modulo: 'Buscador',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Orientación desde los hechos, con historial',
    detalle:
      'Para el abogado que tiene hechos y no sabe qué actuación procede: describa el caso y reciba las actuaciones posibles con su término. Cada consulta queda en un historial que sirve para la siguiente.',
    modulo: 'Orientación',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Los hechos que usted ya contó llegan al borrador',
    detalle:
      'Lo escrito en Orientación o en la entrevista alimenta la redacción sin volver a escribirlo. Cuando el corpus no tiene precedente, el borrador busca en el registro oficial de la Corte.',
    modulo: 'Redacción',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-27',
    titulo: 'Herramientas ordenadas por tarea, y las calculadoras dejan de inventar',
    detalle:
      'La lista se organiza por lo que usted necesita hacer. Ninguna calculadora rellena una fecha o una cifra que no tenga; si falta un dato, lo pide.',
    modulo: 'Herramientas',
    tipo: 'mejora'
  },
  {
    fecha: '2026-08-27',
    titulo: 'El saldo se traduce a escritos, y el registro de subencargados se puede proyectar',
    detalle:
      'El panel de Saldo dice cuántos escritos alcanza el saldo actual. Privacidad lista los proveedores que tocan sus datos, derivado de lo que realmente está en uso, en un formato que se puede mostrar a un cliente.',
    modulo: 'Saldo',
    tipo: 'nuevo'
  },

  /* ── 26 de agosto de 2026 ────────────────────────────────────────────── */
  {
    fecha: '2026-08-26',
    titulo: 'Once ramas nuevas en el catálogo: 21 ramas y 615 actuaciones',
    detalle:
      'Entran arbitraje, insolvencia, ambiental, propiedad intelectual, policivo, disciplinario, aduanero, agrario, familia administrativa y el derecho de petición; notarial duplica sus fichas y el lado del despacho en familia pasa de 6 a 27.',
    modulo: 'Catálogo',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-26',
    titulo: 'Recarga de saldo por Wompi',
    detalle:
      'La firma recarga desde el panel de Saldo con un mínimo de $100.000, y el saldo se acredita cuando Wompi confirma el pago.',
    modulo: 'Saldo',
    tipo: 'nuevo'
  },

  /* ── 25 de agosto de 2026 ────────────────────────────────────────────── */
  {
    fecha: '2026-08-25',
    titulo: 'Cada firma paga lo que consume, con reserva antes del trabajo',
    detalle:
      'Se mide el consumo real de cada escrito y transcripción. El saldo se reserva antes de empezar y se liquida al terminar; un documento largo cuesta lo que cuesta, con un precio piso, y si falla se devuelve.',
    modulo: 'Saldo',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-25',
    titulo: 'Entrevistas con pantalla propia: graba en la aplicación',
    detalle:
      'La entrevista deja de compartir la pantalla de audiencias. Dice con quién fue, graba desde el navegador o acepta un archivo, y sugiere qué ofrece el corpus para ese caso.',
    modulo: 'Entrevistas',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-25',
    titulo: 'El transcrito se exporta a Word y PDF, y cada voz lleva nombre y rol',
    detalle:
      'Nombre cada voz a partir de lo que dijo de sí misma, con su rol procesal al lado; las propuestas se conservan al reabrir. La firma ve qué transcripciones tiene almacenadas y puede borrarlas.',
    modulo: 'Audiencias',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-25',
    titulo: 'Cada pestaña recuerda su módulo',
    detalle:
      'Una visita nueva empieza al principio; recargar una pestaña la deja donde estaba.',
    modulo: 'Ajustes',
    tipo: 'correccion'
  },

  /* ── 18 de agosto de 2026 ────────────────────────────────────────────── */
  {
    fecha: '2026-08-18',
    titulo: 'Transcripción de audiencias que separa quién habla',
    detalle:
      'La grabación se transcribe con vocabulario jurídico colombiano, separando voces y con una intervención por turno. Puede nombrar cada voz, oír el audio y corregir palabras, cortar una intervención que mezcla dos voces y mover una intervención completa a otra voz.',
    modulo: 'Audiencias',
    tipo: 'nuevo'
  },
  {
    fecha: '2026-08-18',
    titulo: 'El audio se borra antes de responder, y el transcrito se conserva',
    detalle:
      'La grabación sube directo al almacenamiento y se elimina en la misma petición que devuelve el texto. El transcrito queda guardado: cerrar la pestaña no cuesta nada.',
    modulo: 'Audiencias',
    tipo: 'mejora'
  },

  /* ── 15 de agosto de 2026 ────────────────────────────────────────────── */
];

/** The ISO date of the newest entry: what a reader "has seen" once they open the list. */
export const FECHA_MAS_RECIENTE: string = NOVEDADES.reduce(
  (max, n) => (n.fecha > max ? n.fecha : max),
  ''
);

/** Modules in order of first appearance (newest first), for the filter row. */
export const MODULOS_NOVEDADES: readonly string[] = NOVEDADES.reduce<string[]>((acc, n) => {
  if (!acc.includes(n.modulo)) acc.push(n.modulo);
  return acc;
}, []);

export const ETIQUETA_TIPO: Record<Novedad['tipo'], string> = {
  nuevo: 'Nuevo',
  mejora: 'Mejora',
  correccion: 'Corrección'
};

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
];

/** '2026-09-04' → '4 de septiembre de 2026'. No Date parsing: nothing to shift by a timezone. */
export const fechaLarga = (iso: string): string => {
  const [a, m, d] = iso.split('-').map(Number);
  const mes = MESES[(m ?? 1) - 1] ?? '';
  return `${d} de ${mes} de ${a}`;
};

/** Groups entries by date, preserving the newest-first order of the source. */
export const agruparPorFecha = (
  entradas: readonly Novedad[]
): readonly { fecha: string; entradas: Novedad[] }[] => {
  const grupos: { fecha: string; entradas: Novedad[] }[] = [];
  for (const n of entradas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === n.fecha) ultimo.entradas.push(n);
    else grupos.push({ fecha: n.fecha, entradas: [n] });
  }
  return grupos;
};

/** How many entries are newer than the date the reader last saw. `null` = never opened. */
export const contarNuevas = (vistasHasta: string | null): number =>
  vistasHasta ? NOVEDADES.filter((n) => n.fecha > vistasHasta).length : NOVEDADES.length;
