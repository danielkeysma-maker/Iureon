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
    fecha: '2026-09-05',
    titulo: 'Página pública de Iureon antes del inicio de sesión',
    detalle:
      'Quien llega a la dirección de Iureon sin sesión ve ahora una página que explica los módulos, los planes con su precio y la seguridad de los datos; desde allí se entra a la aplicación o se contrata un plan.',
    modulo: 'Acceso',
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
    titulo: 'Plan Firma: todos los módulos para hasta quince usuarios',
    detalle:
      'Se suma un tercer plan para firmas medianas: Firma, a $250.000 al mes o $2.500.000 al año, con todos los módulos y hasta quince personas. Se contrata desde la misma pantalla de planes.',
    modulo: 'Planes',
    tipo: 'nuevo'
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
    fecha: '2026-09-05',
    titulo: 'Nuevos precios de los planes',
    detalle:
      'Esencial pasa a $85.000 al mes o $850.000 al año; Premium a $120.000 al mes o $1.200.000 al año. El anual sigue siendo doce meses por el precio de diez. Los planes ya pagados conservan su vigencia.',
    modulo: 'Planes',
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
    titulo: 'El NIT es opcional al registrar una firma',
    detalle:
      'Un litigante que factura como persona natural o un despacho que aún no lo tramita ya se puede dar de alta. Solo el nombre es obligatorio; si el NIT viene, sigue siendo único.',
    modulo: 'Operación',
    tipo: 'mejora'
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
