import type { ManualArticle, ManualBlock, ManualEntry, ManualGroup } from '../types';

/**
 * The manual, written once, in the code.
 *
 * ─── EVERY SENTENCE HERE IS CHECKED AGAINST THE PRODUCT ─────────────────────
 *
 * A manual is the one place where a plausible sentence is more dangerous than
 * a missing one: the reader has no way to tell an accurate instruction from an
 * invented one, and they will follow both. So nothing below describes a screen,
 * a button or a guarantee that does not exist today. Where the design asked for
 * something the product cannot do yet, the article SAYS SO — that is the
 * `todavia-no` block, and it is content, not an apology.
 *
 * ─── HOW AN ARTICLE IS SHAPED ───────────────────────────────────────────────
 *
 * · It opens with a `ruta`: the breadcrumb of screens and buttons where the
 *   task happens. Every chip is a label copied from the component that draws
 *   it (sidebar `navigation.ts`, the mobile tab bar, the button itself).
 * · A short paragraph says what the thing IS.
 * · `pasos` say what to click, in order, naming the real buttons in «».
 * · Then one `consejo` (a habit that shortens the task) and, where a mistake
 *   costs a deadline or money, one `aviso`.
 *
 * ─── REWRITTEN ON 2026-09-14 AGAINST THE CURRENT SCREENS ────────────────────
 *
 * Every module was re-read label by label after the redesign shipped. The
 * passages that had gone stale, so nobody reintroduces them:
 * · Membrete never had «Razón social», «Pie de página», «Firma escaneada», SVG
 *   logos or a «Guardar y aplicar» button. The button is «Guardar el membrete».
 * · Recharging is not an administrator's act: the server lets any user of the
 *   firm recharge. The dialog button is «Ir a pagar», with three amounts.
 * · The phone bar has five doors (Inicio included), the active module is gold,
 *   and «Avisos» is a switch, not «Activar»/«Desactivar» buttons.
 * · The term agenda shows one month at a time; there is no year calendar.
 * · Late-payment interest is computed by rate periods with the certified rates
 *   loaded in the tool; the rate is not typed by hand.
 * · The Buscador toggle is «Solo lo que alguien leyó» and its two blocks are
 *   «Lo que una persona leyó» and «Encontrado automáticamente».
 * · Expedientes became «casos» with tabs, search by cédula/NIT, stored files
 *   and a row menu; «Otra voz» became «Es de otra persona» in Audiencias.
 * · The free Orientación allowance is 10 a day per firm (`TOPE_DIARIO`).
 * · A finished 7-day trial loses access entirely; it is not read-only.
 *
 * The three-states block in `PaginaDelManual.tsx` still says «Verificarlo toma
 * unos dos minutos», an unmeasured figure. That file belongs to another change
 * in flight and is left for it.
 *
 * `manualVigente.check.ts` holds a curated list of labels this file names and
 * asserts each one still exists in the component that renders it.
 *
 * Reading time is computed from the words actually written below, so it cannot
 * drift away from the text the way a hand-typed "3 min" does.
 */

const A_INICIO: ManualArticle = {
  id: 'inicio',
  titulo: 'La pantalla de Inicio y la visita guiada',
  entradilla:
    'Dónde se entra, qué hay en ella, cómo se recorre la aplicación la primera vez y cómo se vuelve a Inicio desde cualquier módulo.',
  bloques: [
    { kind: 'ruta', camino: ['Inicio', '«Por dónde empiezo»', '«Empezar la visita»'] },
    {
      kind: 'parrafo',
      texto:
        'Inicio es la primera pantalla al entrar y la que abre el logo de Iureon. Reúne, en este orden, lo que vence, lo que dejó abierto, el plan y el saldo de la firma, las puertas para empezar y lo que cambió en la aplicación.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Arriba está el saludo con «Redactar» y «Revisar un escrito». Debajo, «Lo que vence»: los términos pendientes más próximos de la agenda de la firma, los vencidos primero, cada uno con cuánto falta. Si un término no está verificado, su recuadro dice «Término sin verificar». Desde cada uno puede pulsar «Empezar el borrador», «Ver en Expedientes» o «Ver en la agenda», y al pie «Ver la agenda completa». Si no hay nada pendiente, la pantalla lo dice en una línea.',
        '«Continuar donde iba» junta sus borradores y revisiones más recientes; «Seguir» o «Ver» los abre donde los dejó.',
        '«Su plan» muestra el plan de la firma y su estado, con «Ver plan». El saldo aparece en pesos disponibles, con «Recargar saldo».',
        '«Por dónde empiezo» ofrece cinco puertas nombradas por lo que usted tiene delante: «Me llegó un documento», «Tengo los hechos y no el nombre», «Ya sé qué voy a presentar», «Tengo un caso con muchos papeles» y «Grabé una audiencia». Si su plan no incluye el módulo, la tarjeta dice «No incluido en su plan»; si la operación no lo habilitó para su firma, «No disponible para su firma».',
        '«Novedades» trae los cambios más recientes de la aplicación, y «Ver todas» abre la lista completa.',
        'Recargar la página no le cambia de pantalla: la pestaña vuelve al módulo y a lo que tenía abierto. Una pestaña nueva empieza en Inicio.'
      ]
    },
    { kind: 'subtitulo', texto: 'La visita guiada' },
    {
      kind: 'pasos',
      pasos: [
        'La primera vez que entra desde un navegador, Inicio le pregunta si quiere una visita guiada: «Empezar» la abre y «Ahora no» la deja para después. También se abre desde «¿Primera vez aquí?» en Inicio y desde el índice del manual.',
        'La visita empieza con una pantalla de entrada, «Le muestro dónde está cada cosa», que anuncia cuánto dura. Esa duración se calcula con el texto que la visita va a mostrar. Está dividida en cinco capítulos con nombre: «Empezar y producir escritos», «Registrar lo que pasó», «Consultar la norma», «Su cuenta y el saldo» y «Dónde pedir ayuda». Pulse «Empezar la visita» o, si prefiere leer, «Prefiero leer el manual».',
        'En cada parada, la pantalla ilumina el lugar del que se habla y muestra en qué capítulo y en qué parada va. Avance con «Siguiente», retroceda con «Anterior» o use las flechas del teclado; «Salir» o Esc la cierran. En el teléfono, la explicación sube como una hoja desde abajo.',
        'Al final, «Eso es lo que hay que saber para empezar» le ofrece tres puertas bajo «Por dónde empezar», solo a módulos que su plan incluye, además de «Ir a Inicio» y «Volver a verla». La visita no se ofrece sola una segunda vez en el mismo navegador.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Pulse el logo cuando se pierda: lo lleva a Inicio sin descartar el escrito que tenga abierto en Redacción.'
    }
  ]
};

const A_QUE_HACE: ManualArticle = {
  id: 'que-hace',
  titulo: 'Qué hace y qué no hace Iureon',
  entradilla:
    'Lo primero que conviene tener claro, porque decide cuándo puede confiar en la pantalla y cuándo tiene que abrir la norma.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', 'Producir · Registrar · Consultar · Aprender · Administrar'] },
    {
      kind: 'parrafo',
      texto:
        'Iureon redacta el primer borrador de un escrito, revisa escritos y documentos recibidos, organiza los casos, transcribe audiencias y entrevistas, y guarda el catálogo de actuaciones con sus términos y sus fuentes. Le ahorra armar la estructura y recordar el plazo. La decisión sigue siendo suya.'
    },
    {
      kind: 'parrafo',
      texto:
        'La aplicación guarda el conocimiento procesal para que usted no tenga que comprobar cada documento. Eso solo funciona si alguien comprobó alguna vez lo guardado. Por eso cada término muestra su estado y hay una pantalla dedicada a curarlos.'
    },
    { kind: 'subtitulo', texto: 'Cómo está organizada la barra lateral' },
    {
      kind: 'pasos',
      pasos: [
        '«Inicio», arriba: la pantalla de entrada.',
        'Producir: «Orientación» (de los hechos a la actuación), «Redacción» (donde se genera un escrito), «Expedientes» (los casos y sus documentos), «Borradores» (los escritos guardados con su término) y «Revisiones» (escritos suyos revisados y documentos recibidos).',
        'Registrar: «Audiencias» y «Entrevistas», las dos pantallas que transcriben una grabación.',
        'Consultar: «Buscador» de jurisprudencia, «Catálogo» de actuaciones y «Herramientas».',
        'Aprender: este «Manual de uso» y «Soporte».',
        'Administrar: «Seguridad», que abre la pantalla «Auditoría» de la firma; «Privacidad», con los proveedores que tocan sus datos; y «Ajustes».',
        'El módulo abierto se marca en dorado. «Colapsar», al pie, reduce la barra a iconos y su navegador recuerda cómo la dejó.',
        'En el pie están el saldo con «Recargar», la fila del plan de la firma, «Membrete», «Avisos» y el sello de versión, que abre las novedades. El saldo se gasta al usar la inteligencia artificial; el plan es el derecho a usar la aplicación. Son dos pagos distintos.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que sí hace' },
    {
      kind: 'lista',
      items: [
        'Redacta un escrito completo a partir de los hechos que usted describa, con la estructura de la actuación que elija del catálogo.',
        'Resuelve el nombre de la actuación contra el catálogo y le dice qué término rige, con el artículo que lo fija y su estado.',
        'Lee un auto, una sentencia, un oficio o una notificación que usted recibió, y le dice qué decide, qué le exige y para cuándo, citando el propio documento.',
        'Transcribe una grabación separando quién habla, y le permite corregir el texto, dividir una intervención y pasarla a otra persona.',
        'Busca jurisprudencia, separa lo que una persona leyó de lo que se encontró automáticamente y le muestra la diferencia.',
        'Exporta a Word y a PDF con el membrete y el formato de su firma.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que no hace' },
    {
      kind: 'lista',
      items: [
        'No radica nada. Ningún escrito sale de Iureon hacia un juzgado, y «Marcar como listo» no radica ni firma.',
        'No decide la estrategia del caso ni escoge las pretensiones por usted.',
        'No garantiza un dato que nadie verificó. Cuando el término no está comprobado, lo advierte.',
        'No conserva el audio de sus grabaciones. Se borra del almacenamiento apenas termina la transcripción.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'La regla que resume todo',
      texto:
        'Un escrito de Iureon es un borrador hasta que un abogado lo lee. La aplicación existe para que esa lectura sea corta, no para que no ocurra.'
    }
  ]
};

const A_PRIMER_ESCRITO: ManualArticle = {
  id: 'primer-escrito',
  titulo: 'Su primer escrito, paso a paso',
  entradilla: 'De la pantalla en blanco a un documento exportado, sin pasos de más.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', '«Qué va a presentar»', '«Los hechos y las pruebas»', '«Generar escrito»'] },
    {
      kind: 'parrafo',
      texto:
        'Redacción abre como una sola columna, «Redactar un escrito», con pasos numerados: «Qué va a presentar», «Los hechos y las pruebas» y, cuando su firma configuró Membrete o enseñó un formato, «Cómo escribe su firma». El papel aparece cuando el escrito existe.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Si todavía no sabe qué actuación necesita, empiece en «Orientación». Está explicado en «De los hechos a la actuación».',
        'En «Qué va a presentar», escoja primero «De qué caso» si el escrito pertenece a un expediente. Si la rama que elige no coincide con la del caso, un aviso lo dice y ofrece usar la del caso. Luego escoja «Quién firma» («Firma / Litigante», «Juez / Despacho» o «Secretaría»), la «Rama» y la «Actuación». La lista de actuaciones sale del catálogo de esa rama. Al elegir una, los selectores se pliegan en una tarjeta con su estado y su término; «Cambiar» los vuelve a abrir.',
        'Si la actuación no aparece, abra «¿No está en la lista?». Tiene tres opciones: «No sé cuál es: que la guía la proponga», «No está en la lista: la escribo yo» y «Redactar sin actuación».',
        '«No sé cuál es: que la guía la proponga» abre un cuadro con los hechos. Pulse «Pedir la orientación» y la guía propondrá actuaciones de esa rama con su término, su artículo y su autoridad. Si duda de la rama, marque «No sé la rama: buscar en todo el catálogo». Nada se aplica solo: usted pulsa «Elegir esta».',
        '«No está en la lista: la escribo yo» sirve cuando usted sabe cómo se llama la actuación. Escríbala en «Cómo la llama» y pulse «Guardar y elegirla». Quedará en la lista de la rama para toda su firma, sin norma verificada.',
        '«Redactar sin actuación» sirve cuando tampoco sabe el nombre. Escriba en «¿Qué debe lograr este escrito?» entre 15 y 107 caracteres, revise «Quedará en la lista como» y pulse «Guardar y redactar». Queda como «Sin nombre — …», y el escrito declara que su término no está verificado.',
        'En «Los hechos y las pruebas», cuente en «Qué debe hacer este escrito» los hechos y la pretensión en lenguaje corriente. Con «Adjuntar sentencias, pruebas o fotos» puede sumar hasta 8 archivos y 20 MB.',
        'Si aparece «Cómo escribe su firma», revise el interruptor «Usar el formato y la jerga que su firma enseñó». Apagarlo afecta solo ese borrador.',
        'Pulse «Generar escrito» o use ⌘↵ en Mac y Ctrl+↵ en Windows. El botón dice «Proyectar providencia» si firma un juez y «Generar acto» si firma la secretaría. Junto a él se lee «Desde $2.000 de su saldo; un escrito largo cuesta lo que mida.». Mientras se genera, la consola «Ejecución» muestra el avance. Si el motor falla, el aviso sale ahí mismo y la reserva de saldo vuelve a la cuenta.',
        'Lea el escrito. Arriba del papel está la barra del borrador con «Word», «PDF» y «Copiar». A la derecha, «Lo que respalda este escrito» muestra la norma, la autoridad, el término, «Ver la norma» y las secciones que pide la ficha, cada una «encontrada» o «no se encontró el rótulo», con «Ir al párrafo».',
        'El escrito se guarda como borrador de la firma al generarse. Si lo corrige en el papel, pulse «Guardar» en «Trabajar el escrito».'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Antes de generar, mire el estado de la tarjeta de la actuación. Si el término no está verificado, un socio administrador puede verificarlo en «Catálogo» antes: así el escrito sale con el término comprobado y no hay que regenerarlo.'
    },
    {
      kind: 'aviso',
      texto:
        'Elegir la actuación del catálogo importa. El nombre catalogado conecta el escrito con un artículo y un término; cualquier otro texto produce una estructura sin norma verificada detrás.'
    },
    {
      kind: 'nota',
      titulo: 'Si la rama no está catalogada',
      texto:
        'Algunas ramas todavía no tienen actuaciones catalogadas. La pantalla lo advierte con «Esta rama aún no tiene catálogo verificado»: en esos casos ninguna norma verificada respalda la estructura, y el término lo tiene que comprobar usted.'
    }
  ]
};

const A_TRES_ESTADOS: ManualArticle = {
  id: 'tres-estados',
  titulo: 'Los tres estados de una afirmación',
  entradilla:
    'Todo término del catálogo está en uno de tres estados. Distinguirlos de un vistazo es lo único imprescindible para usar Iureon con seguridad.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', 'Lo que respalda este escrito', 'Catálogo', 'Ficha de la actuación'] },
    { kind: 'estados' },
    { kind: 'subtitulo', texto: 'Cómo se ve' },
    { kind: 'ejemplo' },
    { kind: 'subtitulo', texto: 'Dónde mirar el estado antes de radicar' },
    {
      kind: 'pasos',
      pasos: [
        'En Redacción, con el escrito generado, mire la franja de procedencia bajo la barra del borrador. Dice contra qué ficha se redactó y si alguien de su firma la curó. Es ámbar cuando el término no está comprobado o la actuación no está en el catálogo, y no aparece cuando no hay nada que advertir.',
        'A la derecha del papel, «Lo que respalda este escrito» muestra el estado de la ficha y las secciones que pide. Que un rótulo esté «encontrada» significa que su nombre aparece en el texto, no que la sección esté bien escrita.',
        'Para el detalle, abra «Catálogo», busque la actuación y lea sus tres bloques: término, norma y autoridad, cada uno con su estado.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Cuando la ficha diga «sin verificar», no lo resuelva solo en el escrito: verifique la ficha en Catálogo. El arreglo a mano sirve para ese documento; la verificación sirve para todos los siguientes.'
    },
    {
      kind: 'parrafo',
      texto:
        '«No caduca» y «sin verificar» se confunden con frecuencia, y el error es caro. «No caduca» es un hecho comprobado: la norma no fija término, como en la acción de tutela. «Sin verificar» significa que nadie lo ha comprobado. Por eso se ven distintos.'
    },
    {
      kind: 'todavia-no',
      texto:
        'El papel no marca las afirmaciones una por una ni cuenta cuántas quedan sin verificar: nadie analiza el borrador frase por frase. Lo que se marca es el estado de la ficha contra la que se redactó.'
    }
  ]
};

const A_VERIFICAR: ManualArticle = {
  id: 'verificar',
  titulo: 'Verificar contra la norma',
  entradilla:
    'Qué significa exactamente verificar una ficha, quién puede hacerlo y por qué se hace una sola vez para toda la firma.',
  bloques: [
    { kind: 'ruta', camino: ['Catálogo', 'Ficha de la actuación', '«Guardar verificación»'] },
    {
      kind: 'parrafo',
      texto:
        'Verificar es abrir el texto oficial de la norma, comprobar que el término y la autoridad de la ficha son los que fija el artículo, y firmar esa comprobación con su nombre. Vale para toda la firma: los siguientes escritos de cualquier compañero ya salen con el término verificado. El servidor solo permite guardar la verificación a un socio administrador.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Catálogo» y escriba en «Buscar una actuación» el nombre o la norma. Puede acotar por rama; arranca en «Todas».',
        'Pulse la actuación. Se abre la ficha con sus tres bloques y, debajo, «Curaduría de su firma». Si nadie la ha comprobado, «Verificar el término» abre el formulario.',
        'Abra la fuente oficial con «Ver el texto oficial de la norma» y localice el artículo. Compruebe por separado el término, el artículo que lo fija y la autoridad.',
        'En «Estado del término» elija «Tiene término», «No caduca» o «Sin verificar».',
        'Si tiene término, escríbalo en «Término, como lo dice la norma», pegue la dirección en «Fuente donde lo verificó» (obligatoria), cite el artículo en «Fundamento normativo» y ponga su nombre en «Quién verifica». La «Nota interna» es opcional.',
        'Pulse «Guardar verificación». Si se equivocó, «Revertir al catálogo base» descarta la verificación de la firma.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Verifique primero las actuaciones que su firma redacta cada semana: son las que dejan listos más escritos de una vez.'
    },
    {
      kind: 'aviso',
      texto:
        'Pregúntese siempre de quién es el reloj. El error más caro no es copiar mal un plazo: es publicar el plazo de la contraparte o del juzgado y omitir el que extingue el derecho de su cliente. La ficha se ve exacta y la cita es real.'
    },
    {
      kind: 'lista',
      items: [
        'Que una norma esté vigente no significa que su validez esté resuelta: un decreto de emergencia obliga hoy y puede caer con efectos hacia atrás.',
        'Una fuente oficial también puede estar desactualizada. Confirme que el artículo que lee trae la reforma que espera.',
        'Un resultado de buscador no es fuente de derecho: puede mezclar proyectos de ley, normas extranjeras y derecho vigente.'
      ]
    }
  ]
};

const A_ORIENTACION: ManualArticle = {
  id: 'orientacion',
  titulo: 'De los hechos a la actuación',
  entradilla:
    'Cuando tiene el caso y no sabe qué actuación procede: cuente los hechos o adjunte el documento que le llegó, y el catálogo le propone actuaciones con su término.',
  bloques: [
    { kind: 'ruta', camino: ['Orientación', '«Los hechos, como se los contaría a un colega»', '«Orientar»', '«Redactar esta»'] },
    {
      kind: 'parrafo',
      texto:
        'Orientación es para quien tiene los hechos y no sabe cómo se llama la actuación. Se cuenta el caso, se pulsa «Orientar» y el catálogo devuelve candidatas con su término, su norma y su autoridad. En el teléfono, la pestaña de abajo se llama «Orientar». Orientación está en los planes Premium y Firma.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Orientación» y cuente el caso en «Los hechos, como se los contaría a un colega». Si el asunto ya es un expediente, puede elegirlo para que la orientación quede contada dentro del caso.',
        'Si el caso le llegó por escrito, adjúntelo. En el computador, arrástrelo a «Arrastre aquí el oficio, la demanda o la notificación» o use «o escoja el archivo». En el teléfono, toque «Adjuntar el oficio o la demanda (PDF, Word o texto)». El archivo se lee en su navegador y su texto se añade al final del cuadro, que puede editar. «Quitar» deshace el adjunto.',
        'Si el documento anuncia un plazo, la pantalla lo avisa antes de orientar: «Este documento anuncia un término». Orientación no lee ese plazo, así que ofrece «Leerlo primero: qué le exige y para cuándo», que lo lleva a Revisiones. El aviso no le impide orientar.',
        'Pulse «Orientar». Las candidatas salen ordenadas por término más corto, con «Lo que el catálogo leyó» de sus hechos. Si falta precisión, la pantalla puede sugerir «Completar los hechos».',
        'En la candidata que elija, pulse «Redactar esta». Debajo se abre «Qué pedirle al motor», con propuestas de instrucción armadas con la ficha y sus hechos. Escoja una, edítela o siga sin ninguna.',
        'Pulse «Llevar a Redacción». Llegan la actuación, su rama y el cuadro de instrucción ya escrito.'
      ]
    },
    { kind: 'subtitulo', texto: 'Cupo, precio y lo que el catálogo no tiene' },
    {
      kind: 'lista',
      items: [
        'Cada firma tiene 10 orientaciones gratis al día. Después, cada una descuenta $150 del saldo. Cuando quedan pocas, la pantalla dice cuántas le quedan hoy, y cuando se acaban muestra «Cupo gratuito de hoy agotado».',
        'Si una candidata tiene el término sin verificar, en el computador el botón es «Verificar y catalogar», que lleva al Catálogo; primero se comprueba el término y después se redacta.',
        'Si el catálogo no reconoce ninguna actuación, lo dice: «El catálogo no reconoce una actuación para estos hechos». Puede completar los hechos, buscar en jurisprudencia o «Redactar sin catálogo», con la advertencia de que nada del escrito quedará verificado.',
        'Cada orientación queda guardada para toda la firma. Desde el historial puede buscarla por los hechos y «Reutilizar» para otro cliente. Las consultas que terminaron «Sin actuación en catálogo» se agrupan y cuentan: muestran lo que a la firma le falta curar.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Adjunte el oficio en vez de resumirlo. Un resumen de memoria pierde justo el dato que define la vía, como la fecha de notificación.'
    },
    {
      kind: 'aviso',
      texto:
        'Orientar no decide. La calificación jurídica del caso es suya, y la pantalla lo recuerda debajo de las candidatas.'
    }
  ]
};

const A_INSTRUCCION: ManualArticle = {
  id: 'instruccion',
  titulo: 'Escribir la instrucción',
  entradilla: 'Qué conviene poner en el cuadro de texto, y qué no vale la pena escribir ahí.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', '«Qué debe hacer este escrito»'] },
    {
      kind: 'parrafo',
      texto:
        'El cuadro «Qué debe hacer este escrito» espera hechos, no redacción: qué pasó, en qué orden, quién es quién, qué pide y contra quién. La estructura del escrito sale de la actuación que usted escogió en «Qué va a presentar».'
    },
    {
      kind: 'pasos',
      pasos: [
        'Empiece por las fechas concretas. Sostienen el cómputo del término y el escrito las va a citar.',
        'Siga con las partes: nombres, calidades y, si el proceso ya existe, el radicado y el despacho.',
        'Diga qué quiere que el juez ordene.',
        'Incluya también los hechos que le incomodan. Si el borrador no los conoce, los omite, y la contraparte sí los va a conocer.',
        'Genere con «Generar escrito» o con ⌘↵ / Ctrl+↵. Si hace falta ajustar, vuelva al cuadro y genere de nuevo, o corrija a mano con «Editar» sobre el papel.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que no hace falta' },
    {
      kind: 'lista',
      items: [
        'Fórmulas de encabezado, invocaciones y despedidas: las pone el escrito.',
        'Pedir un formato. La letra, el membrete y la numeración vienen de «Membrete», y la forma de escribir de la firma, de lo que su firma enseñó en «Estilo de la firma».',
        'Citar la norma de memoria. Si el catálogo la tiene, entra sola; si no la tiene, citarla de memoria es justo lo que hay que evitar.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'No vuelva a teclear lo que ya está transcrito. En una audiencia, «Usar en redacción» lleva lo dicho a este cuadro; en una entrevista, «Tomar el caso» abre la redacción con lo que narró la persona.'
    },
    {
      kind: 'nota',
      titulo: 'Los adjuntos se leen',
      texto:
        'Con «Adjuntar sentencias, pruebas o fotos» puede subir PDF, Word, texto e imágenes, hasta 8 archivos y 20 MB. Al generar, se lee cada archivo y sus datos entran al escrito; lo que el adjunto no trae sale como [•]. La consola «Ejecución» dice qué se leyó de cada archivo y qué no. Un PDF escaneado sin texto no se puede leer. Los archivos no se guardan.'
    },
    {
      kind: 'nota',
      titulo: 'Cuando el cuadro llega ya escrito',
      texto:
        'Si entró por «Orientación» o por «¿Y con qué lo ataco?» de un documento recibido, el cuadro llega con la instrucción arriba y los hechos debajo. Es texto normal: puede recortarlo, completarlo o borrarlo antes de generar.'
    },
    {
      kind: 'nota',
      titulo: 'Continuar un borrador',
      texto:
        'Si abre un borrador guardado, el cuadro pasa a pedir qué corregir, continuar o ampliar, y el botón dice «Continuar el borrador».'
    }
  ]
};

const A_EXPORTAR: ManualArticle = {
  id: 'exportar',
  titulo: 'Trabajar, revisar y exportar el escrito',
  entradilla: 'La barra del borrador, lo que respalda el escrito, cómo se enseña el formato de la firma y cómo se exporta.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', 'Barra del borrador', '«Word» · «PDF» · «Copiar»'] },
    {
      kind: 'parrafo',
      texto:
        'Con el escrito generado, la barra de arriba del papel tiene «Word», «PDF», «Copiar», las opciones de exportación, el modo concentración y «Marcar como listo». A la derecha, «Trabajar el escrito» reúne «Taller», «Mis borradores», «Guardar», «Enseñar este formato» y «Sugerir jerga».'
    },
    {
      kind: 'pasos',
      pasos: [
        'Lea el escrito completo. Mire la franja de procedencia y «Lo que respalda este escrito» para confirmar si el término está comprobado.',
        'Compruebe los datos que solo usted conoce: nombres, radicado, cuantía y direcciones. Para corregirlos, pulse «Editar» sobre el papel y luego «Ver» para volver al formato. Si cambió algo, pulse «Guardar».',
        'Abra las opciones de exportación para decidir si sale con «Membrete de la firma» y, cuando el escrito trae fuentes, si anexa la hoja de fuentes citadas.',
        'Pulse «Word» para seguir editando en su procesador o «PDF» para radicar o archivar.',
        'Cuando el texto esté terminado, «Marcar como listo» cambia el estado del borrador a Listo. No lo radica ni lo firma.'
      ]
    },
    { kind: 'subtitulo', texto: 'Enseñar el formato y la jerga de la firma' },
    {
      kind: 'lista',
      items: [
        '«Enseñar este formato» toma el escrito como modelo de cómo escribe su firma para ese rol de firmante. Solo un socio administrador puede hacerlo. «Leer el formato · $100» descuenta $100 del saldo y muestra «Esto es lo que se guardaría», con «Qué se guarda» y «Qué no se guarda». Nada queda guardado hasta que pulse «Guardar el formato»; «Cancelar» descarta la lectura. Desde entonces se usa en los próximos borradores.',
        'Lo enseñado se ve y se quita en «Ajustes», «Estilo de la firma».',
        '«Sugerir jerga» busca en el borrador las palabras que su firma prefiere decir de otra forma y propone el reemplazo. Es gratis y no usa el modelo. No toca normas, sentencias, texto entre comillas ni marcadores entre corchetes. Puede reemplazar una aparición o todas.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'Word y PDF salen con el membrete y el formato de su firma. El membrete imprime solo los datos que su firma escribió. El documento no lleva ninguna marca de Iureon.'
    },
    {
      kind: 'consejo',
      texto:
        'Exporte a Word mientras alguien de la firma siga corrigiendo, y a PDF solo la versión que se radica.'
    },
    {
      kind: 'aviso',
      texto:
        'El archivo se genera en la pestaña abierta, con el código que esa pestaña cargó. Si lleva días sin recargarla y el archivo sale raro, compare el sello de versión del pie de la barra lateral.'
    }
  ]
};

const A_BORRADORES: ManualArticle = {
  id: 'borradores',
  titulo: 'Guardar un borrador y vigilar su término',
  entradilla:
    'Un borrador jurídico no es un archivo que espera: es un plazo que corre. Por eso tiene su propia pantalla.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', '«Guardar»', 'Borradores'] },
    {
      kind: 'parrafo',
      texto:
        '«Borradores» reúne los escritos de la firma con el término de su actuación, para ver qué vence sin entrar a redactar. Un escrito se guarda solo al generarse.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Borradores». La tabla muestra escrito, término, versión, estado y última edición. Por defecto aparecen los que están sin radicar; puede cambiar el estado, filtrar por rama, buscar y usar «Limpiar».',
        'Abra el menú de una fila: «Abrir» lo lleva al papel; «Datos del proceso» guarda cliente, despacho, radicado y fecha de vencimiento; «Poner en la agenda» abre la agenda con el caso y la actuación ya elegidos; «Duplicar» crea una copia; «Marcar radicado» lo saca de los pendientes; «Eliminar» pide confirmación.',
        'Un borrador tiene cuatro estados: Borrador, Revisar, Listo y Radicado. «Marcar como listo» en Redacción lo deja en Listo.',
        'Para pedirle al motor que corrija o amplíe un borrador, ábralo y vuelva al asistente: el botón dice «Continuar el borrador». «Mis borradores», en «Trabajar el escrito», abre la misma lista sin salir de Redacción.',
        '«Exportar lista» descarga la tabla y «Redactar escrito» abre Redacción.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Marque «Radicado» el mismo día que radica. Un borrador radicado solo se consulta y se duplica, nunca se continúa, y deja de aparecer entre los pendientes.'
    },
    {
      kind: 'lista',
      items: [
        'El término que se muestra es el de la actuación catalogada. Si la ficha no está verificada, el borrador lo advierte.',
        'Si activó los avisos, le llega uno cuando otro abogado de su firma crea o edita un borrador (véase «Iureon en el teléfono»).'
      ]
    },
    {
      kind: 'nota',
      titulo: 'El escrito guarda el estado del momento',
      texto:
        'Un escrito generado antes de que alguien verificara la ficha conserva el estado de ese día. Para verlo con el término verificado, hay que generarlo de nuevo.'
    }
  ]
};

const A_ENTREVISTA: ManualArticle = {
  id: 'entrevista',
  titulo: 'Entrevistar a un cliente',
  entradilla:
    'Cómo se registra una entrevista, qué debe preguntar antes de grabar y cómo termina en una decisión.',
  bloques: [
    { kind: 'ruta', camino: ['Entrevistas', '«Nueva entrevista»', '«Empezar a grabar»', '«¿Toma el caso?»'] },
    {
      kind: 'parrafo',
      texto:
        'Una entrevista es una transcripción asociada a quien consulta. Grabar y transcribir no consumen saldo. La grabación no se guarda: se borra del almacenamiento apenas termina de transcribirse, y el texto queda guardado en su firma. Entrevistas está en los planes Premium y Firma.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Entrevistas» y pulse «Nueva entrevista». En «Quién consulta» elija el cliente o créelo con «Nuevo cliente» (nombre completo y cédula; correo y celular son opcionales).',
        'Marque «Le informé que la entrevista se graba y lo autorizó». Sin esa casilla, la grabación no se envía a transcribir: la voz es un dato biométrico, y la hora queda registrada.',
        'Pulse «Empezar a grabar». Puede «Pausar» y «Reanudar». Al terminar, escuche la grabación y pulse «Transcribir esta entrevista», o «Descartar» para repetirla. Si ya tiene el audio, use «Subir un archivo».',
        'Tenga delante «Lo que no puede quedar sin preguntar». Al transcribirse, las preguntas respondidas se tachan solas. Es una ayuda de memoria, no una comprobación.',
        'Corrija el transcrito con las mismas herramientas de una audiencia (véase «Subir el audio de una audiencia»).',
        'Responda «¿Toma el caso?». «Tomar el caso» registra quién lo tomó y abre la redacción con lo que narró la persona. «Declinar con motivo» exige escribir el motivo. «Decidir después» la deja esperando decisión, con los días de espera en la lista. «Reabrir la decisión» la vuelve a abrir.',
        'Exporte el acta en Word desde el detalle, o «Exportar la constancia» si necesita la constancia de la reunión.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'La segunda entrevista con el mismo cliente',
      texto:
        'Si el cliente ya tuvo entrevistas, el guion marca aparte, con la fecha, las preguntas que se respondieron en ellas. Una respuesta de hace semanas conviene releerla.'
    },
    {
      kind: 'parrafo',
      texto:
        '«Jurisprudencia relacionada» busca en el corpus a partir de lo que dijo el cliente, no de sus preguntas. Si nada se parece lo suficiente, lo dice. Son sugerencias por cercanía de lenguaje, no dictámenes de aplicabilidad.'
    },
    {
      kind: 'aviso',
      texto:
        'En el teléfono, la grabación vive en la aplicación abierta. Si la cierra antes de transcribir, se pierde. Dividir intervenciones y corregir el texto se hace en la pantalla grande.'
    }
  ]
};

const A_AUDIENCIA: ManualArticle = {
  id: 'audiencia',
  titulo: 'Subir el audio de una audiencia',
  entradilla: 'Cómo se transcribe, qué herramienta usar según el error y cuándo el acta está lista.',
  bloques: [
    { kind: 'ruta', camino: ['Audiencias', '«Subir una grabación»', '«Transcribir y separar las voces»', '«Marcar acta lista»'] },
    {
      kind: 'parrafo',
      texto:
        'La transcripción separa las voces y puede proponer el rol de cada una. Transcribir no consume saldo. La grabación no se guarda: se borra del almacenamiento apenas termina, y el texto queda en su firma. Audiencias está en los planes Premium y Firma.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Audiencias» y pulse «Subir una grabación». Suelte el audio o el video, o use «Elegir la grabación». En «Proceso al que pertenece» (opcional) escriba partes, juzgado y radicado, para que los nombres se transcriban mejor. Si elige el caso, la audiencia queda contada en él.',
        'Pulse «Transcribir y separar las voces». La pantalla muestra el envío de la grabación y luego la transcripción.',
        'En «Quién habla», ponga nombre y rol a cada voz una sola vez: se aplica a todo el transcrito.',
        'Las intervenciones con poca certeza se ven subrayadas con onda y llevan su porcentaje. «Ir a la primera» lo lleva a ellas. Vuélvalas a escuchar antes de citarlas.',
        'Corrija con la herramienta que corresponda (abajo). Cada corrección se guarda para toda la firma.',
        'Use «Marcar revisada» en lo que ya leyó y «Marcar hecho clave» en lo que decide el caso.',
        'Cuando la haya leído completa, pulse «Marcar acta lista» en la lista. Una transcripción no es un acta: esa marca solo la pone una persona. La lista separa «Pendientes de revisar» y «Acta lista».',
        '«Exportar acta» ofrece el acta con minutos o solo los hechos clave. «Usar en redacción» lleva lo dicho al taller.'
      ]
    },
    { kind: 'subtitulo', texto: 'Qué herramienta usar' },
    {
      kind: 'lista',
      items: [
        '«Corregir el texto»: una palabra mal transcrita.',
        '«Dividir»: dos personas quedaron en una misma intervención. Haga clic donde empieza a hablar la otra y elija de quién es lo que sigue.',
        '«Es de otra persona»: la intervención completa está atribuida a quien no es. Solo cambia esa intervención, y el rol lo toma la voz de destino.',
        'Nombre y rol en «Quién habla»: la voz está bien separada pero mal identificada.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Corrija con la grabación sonando: «Escuchar la grabación» la reproduce desde la copia de su navegador mientras no cierre la pestaña.'
    },
    {
      kind: 'aviso',
      texto:
        'Cuando dos personas hablan a la vez, la separación de voces puede juntarlas en una misma intervención. No se arregla con configuración: hay que usar «Dividir» y después asignar. Si la pantalla avisa que bajo una misma voz aparecen dos nombres, es este caso.'
    },
    { kind: 'subtitulo', texto: 'El resumen y los hechos relevantes' },
    {
      kind: 'parrafo',
      texto:
        'En «Resumen y hechos relevantes», «Generar el resumen» produce unas frases sobre lo tratado y los hechos dichos, con el minuto. Resume lo que se dijo y no toma decisiones. Queda guardado. Cada vez que pulsa «Generar el resumen» o «Regenerar» se descuentan $50 del saldo.'
    },
    {
      kind: 'nota',
      titulo: 'Vocabulario jurídico',
      texto:
        'El motor está preparado para términos del oficio y aun así se equivoca. Los errores peligrosos son los que suenan bien, como «desembarco» por desembargo. Por eso el transcrito se corrige y la grabación se puede volver a oír.'
    }
  ]
};

const A_CURADURIA: ManualArticle = {
  id: 'curaduria',
  titulo: 'Curar el catálogo de la firma',
  entradilla: 'Cómo una comprobación hecha una vez deja de repetirse en cada escrito.',
  bloques: [
    { kind: 'ruta', camino: ['Catálogo', 'Ficha', '«Curaduría de su firma»'] },
    {
      kind: 'parrafo',
      texto:
        'El catálogo llega con las actuaciones y los términos del producto. Encima, cada firma guarda su propia curaduría: cuando un socio administrador verifica un término, vale para la firma y para todos los escritos siguientes. Se valida el conocimiento una vez, no cada documento.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Decidan quién cura. Verificar deja constancia de quién lo hizo; el servidor lo permite a los socios administradores.',
        'En «Catálogo», filtre por las ramas de la firma y recorra las actuaciones sin término verificado. La columna «Estado» lo dice sin abrirlas.',
        'Abra cada ficha y lea sus tres bloques. Puede tener verificado el término y no la autoridad, y la autoridad decide ante quién se radica.',
        'Revise «Secciones obligatorias del escrito»: son las que el motor le exige al escrito. Una sección «sin artículo confirmado» se sigue exigiendo; lo que falta es la cita que la respalda.',
        'Complete la verificación como se explica en «Verificar contra la norma».',
        'En «Seguridad» (pantalla «Auditoría») queda cada verificación con quién y cuándo.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Cuando una actuación exista con el mismo nombre en dos ramas (reposición, apelación, queja y súplica tienen plazos distintos en el CGP y en el CPACA), cure las dos fichas. La aplicación busca siempre con la rama.'
    },
    {
      kind: 'lista',
      items: [
        'Las actuaciones transversales, como el derecho de petición, son una sola ficha visible en todas las ramas. Corregirla la corrige en todas.',
        'Algunas fichas llegan a su rama por remisión del CGP con el plazo sin verificar en esa rama. Verificarlas en su rama no cambia la ficha de la rama de origen.',
        'Las actuaciones que su firma añadió aparecen como «Añadida por su firma». Un socio puede verificarles el término o usar «Retirar de la lista de la firma».',
        'Verificar exige la fuente. Sin fuente no se registra.',
        '«Revertir al catálogo base» descarta la curación de la firma.'
      ]
    },
    {
      kind: 'todavia-no',
      texto:
        'No hay historial de curaduría. El catálogo guarda una fila por actuación y firma, así que cada curación reemplaza la anterior. Tampoco se pueden confirmar secciones una por una: la curaduría se registra por actuación.'
    }
  ]
};

const A_PLANES: ManualArticle = {
  id: 'planes-y-pago',
  titulo: 'Planes, prueba y pago de la suscripción',
  entradilla: 'Qué incluye cada plan, cuánto cuesta, cómo funciona la prueba, cómo se paga y qué pasa cuando vence.',
  bloques: [
    { kind: 'ruta', camino: ['Ajustes', '«Plan y saldo»', '«Renovar o cambiar de plan»'] },
    { kind: 'subtitulo', texto: 'Tres planes' },
    {
      kind: 'lista',
      items: [
        'Esencial: $85.000 al mes o $850.000 al año. Un usuario. Incluye Redacción, Expedientes, Borradores, Revisiones, Buscador, Catálogo, Herramientas, Manual, Soporte y Membrete. No incluye Audiencias, Entrevistas ni Orientación.',
        'Premium: $120.000 al mes o $1.200.000 al año. Hasta cinco usuarios. Suma Audiencias, Entrevistas y Orientación.',
        'Firma: $250.000 al mes o $2.500.000 al año. Hasta quince usuarios. Todos los módulos.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'En el plan anual, el año cuesta lo mismo que diez meses. El plan no incluye el consumo de inteligencia artificial: escritos, revisiones, resúmenes y orientaciones fuera del cupo gratuito se descuentan del saldo (véase «Saldo, recarga y usuarios de la firma»).'
    },
    { kind: 'subtitulo', texto: 'Cómo se paga' },
    {
      kind: 'pasos',
      pasos: [
        'Abra el plan desde la fila del plan en el pie de la barra lateral («Ver el plan»), desde «Ver plan» en Inicio o desde «Ajustes» → «Plan y saldo». En el teléfono, «Más» → «Plan de la firma».',
        'El diálogo se titula «Renovar o cambiar de plan», o «Elegir un plan» si la firma todavía no tiene uno. Arriba dice qué plan tiene hoy. Cambie entre mensual y anual.',
        'Pulse el botón de la tarjeta: «Renovar», «Pasar a» o «Contratar», con el nombre del plan y el periodo. Se abre Wompi con el valor fijado.',
        'Cuando el pago se confirma, el plan queda activo y el pago aparece en «Pagos del plan», con «Cuenta de cobro» para descargar el soporte en PDF.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'Solo un socio administrador paga el plan',
      texto:
        'El servidor solo acepta el pago del plan de un socio administrador. A los demás, la tarjeta les dice «Solo un socio administrador puede pagar el plan.». No se guarda la tarjeta ni hay cobro automático: cada periodo se paga de nuevo.'
    },
    { kind: 'subtitulo', texto: 'Renovar no es lo mismo que cambiar' },
    {
      kind: 'lista',
      items: [
        'Renovar el plan vigente suma el periodo nuevo a la fecha de vencimiento. No pierde ningún día pagado.',
        'Pasar a otro plan empieza el día del pago. Los días que quedaban del plan anterior no se acreditan ni se devuelven, y la tarjeta lo advierte antes de abrir la pasarela.',
        'Si quiere cambiar de plan conservando su fecha de vencimiento, escríbanos por Soporte antes de pagar.'
      ]
    },
    { kind: 'subtitulo', texto: 'Estados del plan' },
    {
      kind: 'lista',
      items: [
        'Activo, y «por vencer» durante los siete días anteriores al vencimiento, con una franja de aviso.',
        'Vencido: la aplicación queda en solo lectura. Se pueden abrir, leer y exportar borradores e informes, y usar el Manual, Soporte, Ajustes y la pantalla del plan, pero no crear ni modificar trabajo. El saldo no se pierde. Al pagar, todo vuelve de inmediato.',
        'Cortesía: un plan que asigna la operación de Iureon.',
        'Prueba: siete días de Esencial.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'La prueba gratuita de Esencial',
      texto:
        'Una firma puede abrir una prueba de Esencial de siete días: «Un usuario, sin tarjeta y sin cobro al terminar.». Hay una sola prueba por correo. La prueba es solo de Esencial, y el saldo de inteligencia artificial empieza en cero. Al terminar la prueba, la firma pierde el acceso; no queda en solo lectura. La pantalla «Los 7 días de prueba se acabaron» ofrece «Ver planes y contratar» y «Salir». Contratar la reactiva.'
    },
    {
      kind: 'nota',
      titulo: 'La cuenta de cobro no es factura',
      texto:
        'La «Cuenta de cobro» de cada pago es un soporte en PDF, no una factura electrónica de la DIAN, y el documento lo dice.'
    },
    {
      kind: 'nota',
      titulo: 'Módulos no habilitados para su firma',
      texto:
        'Además del plan, la operación de Iureon puede dejar sin habilitar un módulo o una función para una firma. En ese caso, el módulo no aparece en la barra y su tarjeta de Inicio dice «No disponible para su firma». Escriba por Soporte.'
    }
  ]
};

const A_ROLES_SALDO: ManualArticle = {
  id: 'roles-saldo',
  titulo: 'Saldo, recarga y usuarios de la firma',
  entradilla: 'Quién puede hacer qué dentro de la firma, qué consume saldo, cómo se recarga y cómo se recupera la cuenta.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', '«Recargar»', '«Recargar saldo»', '«Ir a pagar»'] },
    { kind: 'subtitulo', texto: 'Roles' },
    {
      kind: 'parrafo',
      texto:
        'Hay dos roles, «Socio administrador» y «Abogado», y el servidor los aplica en cada petición. Solo un socio administrador puede agregar usuarios y cambiar roles, pagar el plan, verificar términos del catálogo, enseñar el formato de la firma, autorizar que se conserven los escritos revisados, decidir el acceso de soporte y eliminar la firma. Todos pueden redactar, revisar, transcribir, consultar y recargar saldo.'
    },
    { kind: 'subtitulo', texto: 'Su firma: agregar abogados' },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Ajustes» → «Usuarios». La pantalla se titula «Su firma».',
        'Pulse «Agregar un abogado», complete los datos y pulse «Crear el usuario». El plan limita cuántos usuarios puede tener la firma.',
        'En cada usuario, «Hacer socio» o «Pasar a abogado» cambian su rol.'
      ]
    },
    { kind: 'subtitulo', texto: 'Qué consume saldo' },
    {
      kind: 'lista',
      items: [
        'Cada escrito generado: desde $2.000; un escrito largo cuesta lo que mida.',
        'Cada revisión, de un escrito suyo o de un documento recibido, y cada «Volver a revisar»: desde $2.000.',
        'Cada mensaje a la guía del taller: $300.',
        'Cada resumen de audiencia o entrevista: $50.',
        'Cada orientación después de las 10 gratis del día: $150.',
        'Leer un formato para enseñarlo: $100.',
        'No consumen saldo: transcribir, buscar jurisprudencia, las herramientas, «Sugerir jerga», crear casos y escribir a soporte.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'El saldo se reserva antes de llamar al modelo. Si no alcanza, se lo dicen antes de empezar, y si el trabajo falla, la reserva vuelve. El saldo no vence y lo comparten todos los usuarios de la firma.'
    },
    { kind: 'subtitulo', texto: 'Cómo se recarga' },
    {
      kind: 'pasos',
      pasos: [
        'Pulse «Recargar» en el pie de la barra lateral o «Recargar saldo» en Inicio. En el teléfono, «Más» → «Saldo y recarga». Cualquier usuario de la firma puede recargar.',
        'En «Recargar saldo», elija $100.000, $200.000 o $500.000, o escriba otro monto. El mínimo es $100.000.',
        'Pulse «Ir a pagar». Se abre Wompi para pagar con PSE, tarjeta u otro medio disponible.',
        'Cuando el pago se confirma, el saldo se acredita y aparece en «Movimientos».',
        'El panel del saldo muestra «Disponible ahora», para cuántos escritos alcanza aproximadamente, lo cobrado este mes y el costo medio por escrito. Un socio ve además quién consumió.',
        'Para conciliar, abra «Extracto», elija el mes y pulse «Imprimir comprobante». El comprobante es informativo, no una factura.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Recargue un monto grande de una vez en lugar de varios pequeños: la pasarela cobra una parte fija por transacción.'
    },
    {
      kind: 'nota',
      titulo: 'Saldo que no pasa por la pasarela',
      texto:
        'Si Iureon le acredita saldo directamente, por ejemplo como compensación, lo hace la operación con un motivo escrito que queda en la auditoría de su firma.'
    },
    { kind: 'subtitulo', texto: 'Su cuenta y su contraseña' },
    {
      kind: 'pasos',
      pasos: [
        'En «Ajustes» → «Su cuenta» puede escribir «Su nombre» y pulsar «Guardar». El correo no se puede cambiar.',
        'La contraseña no se cambia desde Ajustes. En la pantalla de entrada, pulse «¿Olvidó su contraseña?», escriba su correo y pulse «Enviarme el enlace». La pantalla responde «Si ese correo tiene cuenta, ya salió el enlace», exista o no la cuenta.',
        'En el correo, pulse «Elegir una contraseña nueva». El enlace vale 30 minutos y sirve una sola vez. Escriba la contraseña nueva, de al menos diez caracteres, y pulse «Guardar la contraseña». Se cierran todas las sesiones abiertas con esa cuenta.',
        'Si el correo no llega, revise el correo no deseado. Se pueden pedir hasta tres enlaces cada media hora.'
      ]
    },
    { kind: 'subtitulo', texto: 'Borrar su acceso o la firma' },
    {
      kind: 'pasos',
      pasos: [
        'En «Ajustes» → «Su cuenta», al final, está la zona de riesgo. Solo aparece en el computador.',
        '«Borrar mi acceso» elimina solo su usuario. Sus escritos son trabajo de la firma y se quedan en ella.',
        '«Eliminar la firma y todos sus datos» solo lo ve un socio administrador. Pide confirmación y borra escritos, revisiones, transcripciones, clientes, pagos, usuarios y saldo.',
        'Ninguna de las dos acciones se puede deshacer. Antes, exporte lo que quiera conservar.'
      ]
    },
    {
      kind: 'todavia-no',
      texto:
        'No existen topes de gasto por usuario ni factura electrónica de las recargas. El control del gasto es el saldo de la firma.'
    }
  ]
};

const A_REVISAR: ManualArticle = {
  id: 'revisar-escrito',
  titulo: 'Revisar un escrito ya redactado',
  entradilla:
    'Suba la tutela, la demanda o el recurso que ya escribió, reciba un informe y corríjalo en el taller con la guía al lado.',
  bloques: [
    { kind: 'ruta', camino: ['Revisiones', '«Revisar un documento»', '«Un escrito mío, que voy a presentar»', '«Abrir en el taller»'] },
    {
      kind: 'parrafo',
      texto:
        'La revisión es un informe, no un borrador. Separa dos cosas: «Lo que exige la norma», que sale de la ficha verificada de la actuación, y «Criterio del revisor», que es valoración profesional y usted decide. No cita sentencias: cuando un punto necesite precedente, lo señala.'
    },
    { kind: 'subtitulo', texto: 'Pedir el informe' },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Revisiones» y pulse «Revisar un documento». También está en Redacción, como «Revisar un documento: suyo o recibido».',
        'En «Qué trae», elija «Un escrito mío, que voy a presentar».',
        'Use «Subir PDF, Word o texto» (hasta 15 MB, con anexos) o pegue el texto. En «Cliente o proceso» indique de qué asunto se trata.',
        'En «Qué actuación es», elija la rama y la actuación. Si no sabe cuál es, pulse «Que la guía diga qué actuación es»: lee el archivo en su navegador, no cuesta nada y propone candidatas. Primero debe elegir la rama.',
        '«Qué quiere saber» es opcional y solo orienta el énfasis.',
        'Pulse el botón de revisar, que muestra «Desde $2.000 de su saldo». Si el revisor no responde, no se cobra.',
        'La primera vez, la aplicación pregunta «¿Conservar el escrito y su trabajo?». «Sí, conservar» guarda el archivo como lo subió, la conversación, los comentarios y las versiones. «Solo el informe» guarda solo el informe. Se decide una vez para toda la firma, lo decide un socio administrador y se puede cambiar en «Revisiones» con «Retirar autorización».'
      ]
    },
    { kind: 'subtitulo', texto: 'Leer el informe' },
    {
      kind: 'lista',
      items: [
        'Secciones: «Resumen», «Lo que exige la norma», «Errores de aplicación», «Correcciones textuales» (con «Dice el escrito», «El problema» y «Reemplazo propuesto») y «Criterio del revisor».',
        'Una banda de comprobación automática contrasta artículos y citas con las fuentes oficiales y, cuando algo requiere atención, «Ir al punto» lo lleva al pasaje.',
        'En el taller, la barra del informe tiene «Leer en grande», que lo abre a pantalla completa, y las descargas en «Word» y «PDF».',
        'Si la actuación es una de las que añadió su firma, el informe advierte que no hay ficha verificada detrás.'
      ]
    },
    { kind: 'subtitulo', texto: 'Corregir en el taller' },
    {
      kind: 'pasos',
      pasos: [
        'Pulse «Abrir en el taller», o abra la fila en «Revisiones».',
        'El papel tiene tres vistas: «Con marcas», «Editar» y «Original», que muestra el archivo tal como se subió, con su diagramación y sus tablas.',
        'Toque un pasaje señalado: verá «Por qué», el «Reemplazo propuesto» y «Aplicar reemplazo».',
        'Seleccione texto para resaltarlo, tacharlo o «Comentar». Sus marcas y comentarios viajan con cada mensaje a la guía. «Limpiar» quita sus marcas.',
        'Los paneles de la derecha son «Guía», «Comentarios», «Informe» y «Versiones». En «Guía», cada mensaje cuesta $300.',
        '«Guardar versión» deja un punto de retorno. En «Versiones» puede compararla con el texto actual y usar «Restaurar esta versión». Ninguna versión se sobrescribe: restaurar también crea una versión.',
        'Con la autorización de la firma, el taller se guarda solo y la cinta de arriba dice «Guardando…» o «Guardado hace un momento». Sin autorización, se pierde al cerrar la pestaña, y el informe sí queda.',
        '«Volver a revisar» emite un informe nuevo sobre el texto actual, desde $2.000. «Llevar a Redacción» guarda el texto como un borrador nuevo de la firma, sin tocar la revisión.',
        '«Ocultar guía» deja el papel a todo lo ancho y «Pantalla completa» quita el resto de la aplicación.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Si la guía propone una candidata de otra rama, cambie la rama en el diálogo y vuelva a elegir la actuación antes de revisar. Si no, el informe puede salir sin ficha verificada y quedar cobrado igual.'
    },
    {
      kind: 'nota',
      titulo: 'Qué queda guardado',
      texto:
        'El informe queda guardado para su firma. El escrito y su trabajo en el taller se conservan solo si la firma lo autorizó. En la auditoría queda que se revisó un escrito, nunca su contenido.'
    }
  ]
};

const A_DOCUMENTO_RECIBIDO: ManualArticle = {
  id: 'documento-recibido',
  titulo: 'Leer un documento que recibió',
  entradilla:
    'Un auto, una sentencia, un oficio o una notificación: qué dice, qué le exige, para cuándo y por dónde se ataca, sin decir antes qué actuación es.',
  bloques: [
    { kind: 'ruta', camino: ['Revisiones', '«Revisar un documento»', '«Un documento que recibí»', '«¿Y con qué lo ataco?»'] },
    {
      kind: 'parrafo',
      texto:
        'En este modo el documento no es suyo: no se corrige, se entiende. El informe solo afirma lo que está escrito en el documento y lo cita. No agrega artículos, plazos ni autoridades de memoria, y ninguna ficha del catálogo respalda esas líneas.'
    },
    { kind: 'subtitulo', texto: 'Pedir la lectura' },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Revisiones» y pulse «Revisar un documento». En «Qué trae», elija «Un documento que recibí». No tiene que elegir actuación.',
        'Suba el archivo o pegue el texto completo en «El documento que recibió».',
        'En «A quién representa en este proceso», indique su posición. Si el caso ya tiene cliente registrado, se completa solo. Con esa información, el informe separa las cargas suyas de las de la otra parte.',
        '«Qué quiere saber» es opcional. Pulse revisar: se descuenta desde $2.000 del saldo.'
      ]
    },
    { kind: 'subtitulo', texto: 'Qué trae el informe' },
    {
      kind: 'lista',
      items: [
        '«Según el propio documento»: quién lo profirió, el radicado y la fecha, solo si el texto los trae.',
        '«Qué decide u ordena».',
        '«Qué le exige y para cuándo», o «Qué exige el documento y para cuándo» si no indicó su posición. Cada carga lleva la cita en «Dice el documento». Una carga ajena sale marcada «Esta carga no es suya.».',
        '«Qué queda pendiente, según el documento».',
        '«Por dónde se ataca»: los flancos, cada uno con su cita y con la «Lectura del revisor» aparte.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Si el documento no anuncia plazo para una carga, el informe no inventa uno: dice que el documento no lo anuncia. El término verificado con su artículo está en el catálogo.'
    },
    { kind: 'subtitulo', texto: 'De los flancos a Redacción' },
    {
      kind: 'pasos',
      pasos: [
        'Al pie está «¿Y con qué lo ataco?», o «¿Y qué puedo hacer?» si no hubo flancos. Elija la rama o marque «No sé la rama: buscar en todo el catálogo.» y pulse «Llevar los flancos a la guía de actuaciones».',
        'Escoja una candidata y pulse «Redactar esta actuación». Se abre «Qué pedirle al motor» con instrucciones que puede editar.',
        'Pulse «Llevar a Redacción». Si prefiere escribir usted el nombre, use «Escribir el nombre de la actuación».'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'En la lista de «Revisiones», estas filas se rotulan «Documento recibido». Desde la fila, «Poner en la agenda de términos» abre la agenda para que elija usted la actuación.'
    }
  ]
};

const A_BUSCADOR: ManualArticle = {
  id: 'buscador',
  titulo: 'Buscar jurisprudencia',
  entradilla:
    'Providencias que una persona leyó y providencias encontradas automáticamente, separadas en pantalla.',
  bloques: [
    { kind: 'ruta', camino: ['Buscador', '«Escriba el problema jurídico o nombre una sentencia»'] },
    {
      kind: 'parrafo',
      texto:
        'El Buscador responde con providencias reales, no con un resumen escrito por un modelo. Busca por significado: describa el problema jurídico o nombre una sentencia. Buscar no consume saldo.'
    },
    { kind: 'subtitulo', texto: 'Acotar la consulta' },
    {
      kind: 'lista',
      items: [
        '«Corporación» filtra entre Corte Constitucional, Corte Suprema de Justicia, Consejo de Estado y Comisión Nacional de Disciplina Judicial.',
        '«Año» acota por año.',
        '«Solo lo que alguien leyó» oculta lo encontrado automáticamente.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo leído y lo automático no son lo mismo' },
    {
      kind: 'parrafo',
      texto:
        'Los resultados llegan en dos bloques: «Lo que una persona leyó» y «Encontrado automáticamente». Cada tarjeta dice si se leyó antes de indexarse o está «Sin leer», y trae «Leer en la fuente oficial». «Copiar la cita» solo aparece en las que alguien leyó.'
    },
    {
      kind: 'aviso',
      texto:
        'El orden de los resultados es por parecido con su consulta, no por autoridad. Que una providencia salga primero no la hace más importante. Antes de citar un resultado automático, ábralo en la fuente oficial y compruebe que dice lo que usted necesita.'
    },
    {
      kind: 'parrafo',
      texto:
        'Si no hay resultados, la pantalla distingue si nada se parece lo suficiente o si el corpus no pudo responder. En el segundo caso, el problema no es su consulta.'
    }
  ]
};

const A_EXPEDIENTE: ManualArticle = {
  id: 'expediente',
  titulo: 'Reunir el expediente de un caso',
  entradilla:
    'Un caso por carpeta: quién es quién, qué documentos hay y cómo encontrar un párrafo sin recordar en qué archivo estaba.',
  bloques: [
    { kind: 'ruta', camino: ['Expedientes', '«Nuevo caso»', '«Agregar un documento»'] },
    {
      kind: 'parrafo',
      texto:
        'Un caso es el asunto, no el cliente ni el documento: un cliente puede tener varios. Se crea con el nombre que usted le da y se completa con el tiempo. Crear un caso no consume saldo.'
    },
    { kind: 'subtitulo', texto: 'La lista de casos' },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Expedientes». Hay tres pestañas: «Esta semana» (lo que tiene términos próximos o vencidos en la agenda), «Activos» y «Cerrados» (terminados o archivados). Si hay algo esta semana, la lista abre ahí.',
        'En «Activos» y «Cerrados», los casos se agrupan por cliente y, dentro de cada cliente, por rama.',
        'En «Nombre, cédula o radicado» puede buscar por nombre del cliente, del caso, del despacho, de la contraparte o de una persona registrada; por cédula o NIT, desde el primer dígito; o por radicado. Enter abre el caso si queda uno solo.',
        'Los filtros «Año», «Mes» y «Rama» se combinan con la búsqueda. Para filtrar por mes, elija primero el año. «Limpiar filtros» los quita.',
        'Pulse «Nuevo caso». Solo «Nombre del asunto» es obligatorio: use el nombre con el que lo va a buscar. El radicado puede venir después.'
      ]
    },
    { kind: 'subtitulo', texto: 'La ficha del caso' },
    {
      kind: 'pasos',
      pasos: [
        'Arriba están los datos del caso: radicado, rama, despacho, su cliente y contraparte, con «Editar». Si el caso tiene un término en la agenda, la franja «Término del caso» lo muestra con «Abrir la agenda».',
        '«Estado del caso» cambia entre Activo, Suspendido, Terminado y Archivado. Se guarda al elegirlo.',
        'El menú «Más opciones» tiene «Editar datos del caso», «Traer algo de otro módulo», «Agregar un documento» y la opción de borrar el caso. En «Editar datos del caso», cambie solo lo necesario y pulse «Guardar los cambios». Editar no consume saldo.',
        'El caso tiene dos pestañas, «Documentos» y «Personas». Al lado, «Lo que hay en el caso» resume su contenido.',
        '«Traer algo de otro módulo» asocia al caso entrevistas, audiencias, revisiones, borradores, términos u orientaciones que ya existen. Si una pieza ya está en otro caso, la fila avisa: «Ya está en otro expediente. Traerla aquí la mueve.».'
      ]
    },
    { kind: 'subtitulo', texto: 'Documentos y carpetas' },
    {
      kind: 'pasos',
      pasos: [
        'Pulse «Agregar documento», escoja el archivo y ponga el nombre con el que lo va a reconocer. Se guarda el archivo y se lee su texto para buscar dentro de él. Al terminar, la pantalla dice en cuántos fragmentos quedó y que ya se puede buscar.',
        '«Nueva carpeta» crea una carpeta donde está. «Filtrar por nombre» acota la vista.',
        'Cada carpeta y cada documento tiene un menú en su fila, que también se abre con clic derecho. Una carpeta: «Abrir», «Renombrar», «Mover» y «Eliminar carpeta». Un documento: «Abrir», «Renombrar», «Mover a otra carpeta» y «Quitar del caso».',
        'Al abrir un documento puede leerlo, usar «Descargar», «Mover» o «Quitar del caso».',
        'Ordenar en carpetas no oculta nada: la búsqueda y el interrogatorio leen todo el caso.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Un PDF escaneado o una foto no traen texto. Ese archivo no se agrega ni queda buscable, y no se cobra nada. Pida el PDF original con texto o use «Reemplazar el archivo».'
    },
    {
      kind: 'aviso',
      texto:
        'Eliminar una carpeta borra también sus subcarpetas y documentos, y antes de hacerlo la pantalla muestra lo que contiene. Borrar un caso borra sus carpetas, las personas registradas y sus documentos. Las entrevistas, revisiones, borradores y términos siguen existiendo, sin caso. Ninguna de las dos acciones se puede deshacer.'
    },
    { kind: 'subtitulo', texto: 'Buscar dentro del caso' },
    {
      kind: 'parrafo',
      texto:
        '«Buscar dentro del caso» busca por significado, no por palabra exacta: «no entregó el inmueble» encuentra un pasaje que dice «se abstuvo de restituir el bien». No consume saldo. Si un documento no está agregado, la búsqueda no lo ve.'
    },
    { kind: 'subtitulo', texto: 'Quién es quién' },
    {
      kind: 'parrafo',
      texto:
        'En la pestaña «Personas», «Quién es quién» registra partes, testigos y peritos: nombre, «Qué es en el proceso», «De qué lado» («De mi lado», «De la contraparte» o «De ninguno») y «Sobre qué declara». El lado define cómo se pregunta: al propio se le interroga y al de enfrente se le contrainterroga.'
    },
    {
      kind: 'consejo',
      texto:
        'Registre el lado con cuidado. Si registra a una contraparte como propia, recibirá preguntas abiertas para contar su versión, justo lo contrario de lo que conviene en audiencia.'
    }
  ]
};

const A_PREGUNTAS_AUDIENCIA: ManualArticle = {
  id: 'preguntas-audiencia',
  titulo: 'Preparar el interrogatorio de la audiencia',
  entradilla:
    'Desde el caso, escoja a quién va a interrogar y reciba una lista de preguntas por persona, con la técnica que le corresponde.',
  bloques: [
    { kind: 'ruta', camino: ['Expedientes', 'Abra el caso', '«Personas»', '«Preparar el interrogatorio»'] },
    {
      kind: 'parrafo',
      texto:
        'El interrogatorio se prepara para una persona concreta. La técnica sale de lo que usted registró en «Quién es quién»: preguntas abiertas para su propio testigo, cerradas para contrainterrogar al de la contraparte, y para el perito, preguntas sobre su calificación, su método y los datos que usó.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Registre a las personas en «Quién es quién». Al juez, al secretario, a los apoderados y al intérprete no se les pregunta.',
        'En «Preparar el interrogatorio», marque «A quién» va a interrogar.',
        'Si quiere, complete «Qué quiere probar» y «Tipo de audiencia».',
        'Pulse preparar. Se descuenta saldo de la firma una vez por tanda: desde $2.000, más $1.000 por cada persona adicional. El botón dice la cifra antes de que usted lo pulse.',
        'Lea cada lista con la técnica indicada arriba. Cada pregunta dice qué busca establecer, qué va a contestar probablemente esa persona, con qué repreguntar si lo contesta y —cuando el caso tiene documentos leídos— la cita con que se la contradice.',
        'La tanda queda guardada en el expediente. Abrirla de nuevo no vuelve a cobrar.',
        'Llévese el interrogatorio con «Word» para seguir trabajándolo.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'Son sugerencias',
      texto:
        'Las preguntas salen de lo que usted registró en el caso. No afirman hechos que ese material no traiga ni citan normas o sentencias. Formularlas es decisión suya.'
    }
  ]
};

const A_DATOS_CLIENTE: ManualArticle = {
  id: 'datos-cliente',
  titulo: 'Privacidad, auditoría y qué responder a su cliente',
  entradilla: 'Quién es responsable de los datos, quién los procesa y cómo demostrar quién hizo qué.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', 'Administrar', '«Privacidad»', '«Seguridad»'] },
    {
      kind: 'parrafo',
      texto:
        'Su firma es la responsable del tratamiento de los datos de su cliente e Iureon es su encargado. Los proveedores que Iureon usa son subencargados de su firma, y usted tiene derecho a saber cuáles son.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Privacidad». La pantalla «Privacidad y seguridad» lista los subencargados activos: qué recibe cada uno, dónde se procesa y cuánto tiempo lo conserva. «Descargar la lista (CSV)» le da la lista para entregar.',
        'Lea «Quién toca el contenido de sus casos» y «Quién no toca el contenido». La operación de Iureon gestiona firmas, planes y saldos, pero no abre transcritos, borradores ni expedientes.',
        'Si el cliente pregunta por su grabación, responda con «Lo que nunca ocurre» y «Lo que sí se conserva»: el audio se borra al transcribirse y el texto queda en su firma.',
        'Para demostrar quién hizo qué, abra «Seguridad» en la barra lateral. La pantalla se llama «Auditoría». Busque en «Por documento, actuación o usuario», filtre por usuario y periodo o use las vistas frecuentes.',
        'La tabla muestra fecha y hora, usuario, acción y origen. Carga por partes: dice cuántos registros leyó del total y ofrece leer más.',
        '«Descargar CSV» exporta las filas con un resumen SHA-256, para comprobar después que el archivo no se modificó.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'El acceso de soporte',
      texto:
        'Si soporte necesita ver material de su firma, lo pide por la aplicación: «Soporte pide ver material de su firma». Solo un socio administrador decide, por 1, 4 o 24 horas, con «Autorizar» o «No autorizar». No autorizar no afecta el servicio. Mientras dura, una franja lo recuerda y el acceso se puede retirar en cualquier momento.'
    },
    {
      kind: 'aviso',
      texto:
        'WhatsApp está fuera del acuerdo de tratamiento de datos. No envíe por ahí datos de sus clientes ni documentos del caso. Tampoco los pegue en el chat de soporte: describa el problema, no el caso.'
    }
  ]
};

const A_SOPORTE: ManualArticle = {
  id: 'soporte',
  titulo: 'Pedir ayuda a soporte',
  entradilla: 'Un chat dentro de la aplicación, atendido por el operador de la plataforma, y qué se puede esperar de él.',
  bloques: [
    { kind: 'ruta', camino: ['Soporte', '«Nueva conversación»', '«Abrir conversación»'] },
    {
      kind: 'parrafo',
      texto:
        'Soporte es un chat guardado en su cuenta. Lo atiende el operador de la plataforma en horario laboral, sin tiempo de respuesta garantizado. Escribir a soporte no consume saldo. La pantalla muestra sus conversaciones y las de su firma.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Soporte» en la barra lateral, bajo «Aprender». En el teléfono está en «Más».',
        'Antes de escribir, revise los atajos de «Antes de escribir»: llevan a los artículos que resuelven las dudas más frecuentes.',
        'Pulse «Nueva conversación». En «Qué pasó», elija el motivo y escriba el «Asunto» y el «Mensaje». Si tiene un término que vence hoy o mañana, dígalo en la primera línea.',
        'Pulse «Abrir conversación». Aparece en «Sus conversaciones con soporte» como «Abierta». Cuando el operador la cierra, dice «Cerrada»; si usted vuelve a escribir, se reabre.',
        'Cuando hay respuesta, la conversación dice «Soporte respondió» y cuántos mensajes tiene sin leer. Enter envía y Shift+Enter salta de línea.',
        'Desde cualquier artículo del manual, «Escribir a soporte» lo trae aquí.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Diga la pantalla y el botón exactos, qué esperaba y qué ocurrió. El operador no ve su pantalla. Agregue el sello de versión del pie de la barra lateral.'
    },
    {
      kind: 'aviso',
      texto:
        'El chat no admite adjuntos. No pegue datos de sus clientes ni documentos del caso. Si soporte necesita ver algo, lo pide por el acceso de soporte, que decide un socio administrador.'
    },
    {
      kind: 'nota',
      titulo: 'WhatsApp',
      texto:
        'Si hay un número de WhatsApp configurado, aparece al pie de la pantalla. Lo que se responda por WhatsApp no queda registrado en la aplicación. Si no hay número configurado, la pantalla lo dice.'
    }
  ]
};

const A_FORMATO: ManualArticle = {
  id: 'formato',
  titulo: 'Membrete, formato y estilo de la firma',
  entradilla: 'Cómo se configuran los datos y el formato de la firma, y hasta dónde llega su efecto.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', '«Membrete»', '«Guardar el membrete»'] },
    {
      kind: 'parrafo',
      texto:
        'El membrete y el formato son de la firma y valen para todos sus documentos. Lo que guarde en Membrete se ve en el escrito en pantalla y sale igual en Word y PDF.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Membrete» desde el pie de la barra lateral o desde «Ajustes».',
        'En «Datos de la firma», complete el nombre de la firma, el NIT, la dirección, el teléfono y el correo de notificaciones judiciales. El logotipo es opcional y puede ser PNG o JPG; use «Elegir» o «Reemplazar».',
        'En «Formato del escrito», elija la letra entre diez, el tamaño (de 10 a 14), el interlineado (1,0, 1,5 o 2,0), la numeración de hechos («1. 2. 3.» o «PRIMERO.») y los títulos de sección («I. Romanos», «1. Arábigos» o «Sin numerar»).',
        'En «Bloque de firma», escriba la «T.P. del abogado que firma».',
        'Pulse «Guardar el membrete». Desde entonces, el formato se aplica a los escritos generados.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Si los escritos van a un despacho que los recibe en Word, elija una letra clásica (Times New Roman, Arial o Calibri): se ve igual en su equipo y en el del juzgado.'
    },
    { kind: 'subtitulo', texto: 'Estilo de la firma' },
    {
      kind: 'lista',
      items: [
        'En «Ajustes» → «Estilo de la firma» se ve lo que su firma enseñó para cada rol de firmante. Un socio administrador puede «Quitar» un formato enseñado.',
        'Un formato se enseña desde Redacción, con «Enseñar este formato» sobre un escrito (véase «Trabajar, revisar y exportar el escrito»).',
        'En Redacción, «Cómo escribe su firma» deja apagar el formato y la jerga enseñados para un solo borrador.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'Si el documento no sale con su membrete',
      texto:
        'Compruebe que guardó el membrete, que «Membrete de la firma» esté marcado en las opciones de exportación de Redacción y que su pestaña no tenga una versión vieja: compare el sello de versión del pie de la barra lateral.'
    }
  ]
};

const A_MOVIL: ManualArticle = {
  id: 'movil',
  titulo: 'Iureon en el teléfono, avisos y cierre de sesión',
  entradilla:
    'Cómo se usa en el teléfono, cómo instalarla como aplicación, qué avisos llegan y qué pasa al cerrar la sesión.',
  bloques: [
    { kind: 'ruta', camino: ['Barra inferior', '«Inicio» · «Redactar» · «Orientar» · «Grabar» · «Más»'] },
    {
      kind: 'parrafo',
      texto:
        'En el teléfono, la barra inferior tiene cinco botones: «Inicio», «Redactar», «Orientar», «Grabar» y «Más». «Más» abre «Todo lo demás»: bajo «Cuenta», «Saldo y recarga» y «Plan de la firma»; bajo «En este dispositivo», los avisos y la instalación; y el resto de módulos, agrupados como en la barra lateral del computador.'
    },
    {
      kind: 'lista',
      items: [
        'Redactar: el asistente en dos pestañas, «Instrucción» y «Documento». El menú «Acciones» incluye «Marcar como listo», copiar el texto y exportar a Word o PDF.',
        'Orientar: igual que en el computador, pero el documento se adjunta con un renglón y no arrastrándolo. Las candidatas con término sin verificar no muestran botón; verifíquelas desde «Catálogo».',
        'Grabar: la grabadora ocupa la pantalla. Corregir el transcrito se hace en la pantalla grande.',
        'Los diálogos suben desde abajo. Para actualizar, deslice hacia abajo desde arriba de la pantalla.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'La grabación vive en la aplicación abierta. Si la cierra antes de transcribir, se pierde.'
    },
    { kind: 'subtitulo', texto: 'Instalarla como aplicación' },
    {
      kind: 'pasos',
      pasos: [
        'Android con Chrome: en «Más», bajo «En este dispositivo», toque «Instalar Iureon en este dispositivo». También puede usar el menú de Chrome.',
        'iPhone o iPad con Safari: toque «Compartir» y luego «Añadir a pantalla de inicio». Abra Iureon desde el icono nuevo.',
        'Computador: en «Ajustes» → «Instalar la aplicación», o con el icono de instalar de la barra de direcciones.'
      ]
    },
    { kind: 'subtitulo', texto: 'Avisos' },
    {
      kind: 'pasos',
      pasos: [
        'En el computador, pulse «Avisos» en el pie de la barra lateral o abra «Ajustes» → «Avisos». En el teléfono, abra «Más».',
        'Encienda el interruptor «Avisos en este dispositivo» y conceda el permiso del navegador.',
        'Pulse «Enviar una prueba» para confirmar que llegan.',
        'Repita en cada dispositivo: los avisos se activan dispositivo por dispositivo.'
      ]
    },
    {
      kind: 'lista',
      items: [
        'Términos de la agenda: cinco días antes, dos días antes y el día del vencimiento.',
        'Cuando soporte responde una conversación de su firma.',
        'Cuando otro abogado de su firma crea un borrador, y cuando lo edita: como mucho un aviso cada diez minutos por escrito.',
        'Lo que usted mismo hace no le llega a sus dispositivos.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'En iPhone y iPad, los avisos solo llegan si Iureon está añadida a la pantalla de inicio y se abre desde ahí.'
    },
    { kind: 'subtitulo', texto: 'Cerrar la sesión' },
    {
      kind: 'parrafo',
      texto:
        '«Cerrar sesión» pregunta «¿Cerrar la sesión en este dispositivo?». Solo se cierra la sesión de ese navegador; en sus otros dispositivos sigue abierta. Su trabajo no se pierde: borradores, revisiones, casos y transcritos quedan guardados en la firma. «Seguir trabajando» cancela.'
    }
  ]
};

const A_HERRAMIENTAS: ManualArticle = {
  id: 'herramientas',
  titulo: 'Herramientas de cálculo y agenda de términos',
  entradilla:
    'Qué calcula cada herramienta, de dónde salen sus cifras y cómo se vigila un vencimiento.',
  bloques: [
    { kind: 'ruta', camino: ['Herramientas', '«Contador de términos»', '«Poner en la agenda»'] },
    {
      kind: 'parrafo',
      texto:
        'Herramientas reúne siete utilidades: «Contador de términos», «Intereses de mora», «Indexación por IPC», «Competencia por cuantía», «Liquidación de prestaciones», «Agenda de términos» y «Glosario jurídico». Cada una abre a pantalla completa con su regla a la vista. Ninguna consume saldo. Para encontrar una, escriba en «Por nombre o por lo que necesita calcular».'
    },
    { kind: 'subtitulo', texto: 'Contador de términos' },
    {
      kind: 'pasos',
      pasos: [
        'Escriba «Desde qué fecha» y el número del término.',
        'Elija la «Clase de término»: días hábiles, días calendario, meses o años, según el artículo 118 del CGP, que la herramienta cita.',
        'Elija la «Jurisdicción». Arranca en Laboral, y ofrece también Civil, Constitucional y Penal. Si quiere, escriba «Qué se vence».',
        'Pulse «Contar». El resultado explica qué días descontó y por qué, y cómo llegó a la fecha.',
        'Para vigilar el vencimiento, pulse «Poner en la agenda». También puede copiar el resultado o exportarlo a Excel o PDF.'
      ]
    },
    { kind: 'subtitulo', texto: 'Agenda de términos' },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Agenda de términos». Tiene tres pestañas: «Lo que viene», «El calendario» y «Añadir».',
        '«El calendario» muestra un mes a la vez, con sus vencimientos, y se recorre mes a mes. Los festivos y la vacancia del año están en «Festivos y vacancia del año», donde también está la casilla de Semana Santa.',
        'En «Añadir», escriba el asunto, elija la rama y la actuación y ponga la fecha de notificación. Si la ficha fija su término sin ambigüedad, la fecha se calcula sola. Si no, la aplicación se lo advierte y le pide los días, o la fecha si el término no se cuenta en días. Elija en «A quién se le avisa».',
        'En «Lo que viene», cada entrada dice cuántos días faltan. «Cumplida» la retira y «Borrar» la elimina después de confirmar.',
        'Puede exportar la agenda a PDF y a un archivo .ics para su calendario, con la opción de incluir los cumplidos.',
        'Desde «Borradores», «Poner en la agenda» abre la agenda con el caso y la actuación elegidos; desde «Revisiones», «Poner en la agenda de términos».'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Los avisos de vencimiento llegan cinco días antes, dos días antes y el día, y solo a los dispositivos donde activó los avisos. No llegan por correo. La aplicación nunca deduce un plazo que la ficha no fija: si no puede leerlo, se lo pregunta.'
    },
    { kind: 'subtitulo', texto: 'Intereses de mora' },
    {
      kind: 'lista',
      items: [
        'Tres modos: «Mora comercial», a 1,5 veces el interés bancario corriente de cada periodo (art. 884 del Código de Comercio); «Interés legal civil», al 6 % anual (art. 1617 del Código Civil); y «Tasa pactada», que no puede superar la usura (art. 305 del Código Penal).',
        'El día «Desde» no se cuenta y el día «Hasta» sí.',
        'La herramienta trae cargadas las tasas certificadas por la Superintendencia Financiera, con su rango y el enlace «Ver certificaciones». No tiene que escribir la tasa.',
        'Cuando el periodo cruza varios meses, la liquidación se hace por tramos, cada uno con su tasa, y se muestra en la tabla «Por tramos de tasa». Cada tramo convierte la tasa efectiva anual a los días que dura, sin capitalizar los intereses.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que usted escribe' },
    {
      kind: 'parrafo',
      texto:
        'El IPC no se carga solo. Tome el índice inicial y el final de la página del DANE enlazada en «Indexación por IPC» y escríbalos; la fórmula aparece con sus números. «Competencia por cuantía» trabaja con los salarios mínimos de 2020 a 2026; para otro año, la herramienta no calcula.'
    },
    {
      kind: 'consejo',
      texto:
        'Guarde el Excel o el PDF exportado junto al escrito que usa la cifra. Las fuentes con su norma y su fecha responden a la pregunta «¿de dónde sacó ese número?».'
    }
  ]
};

/** The index, grouped by task and by role — not by module. */
export const MANUAL: readonly ManualGroup[] = [
  {
    titulo: 'Primeros 20 minutos',
    articulos: [A_INICIO, A_QUE_HACE, A_PRIMER_ESCRITO, A_TRES_ESTADOS, A_VERIFICAR, A_MOVIL]
  },
  {
    titulo: 'Redactar',
    articulos: [A_ORIENTACION, A_INSTRUCCION, A_REVISAR, A_DOCUMENTO_RECIBIDO, A_EXPORTAR, A_BORRADORES]
  },
  /*
   * «Preparar el interrogatorio» vive aquí y no en «Redactar»: su ruta empieza
   * en «Expedientes», y nadie que prepare una audiencia lo busca bajo el verbo
   * de otra tarea.
   */
  { titulo: 'Organizar el caso', articulos: [A_EXPEDIENTE, A_PREGUNTAS_AUDIENCIA] },
  { titulo: 'Consultar', articulos: [A_BUSCADOR] },
  { titulo: 'Calcular', articulos: [A_HERRAMIENTAS] },
  { titulo: 'Grabar', articulos: [A_ENTREVISTA, A_AUDIENCIA] },
  {
    titulo: 'Para socios',
    articulos: [A_CURADURIA, A_ROLES_SALDO, A_PLANES, A_DATOS_CLIENTE, A_SOPORTE, A_FORMATO]
  }
];

/** Flat reading order, with the position each article shows in its header. */
export const ENTRADAS: readonly ManualEntry[] = MANUAL.flatMap((grupo) =>
  grupo.articulos.map((articulo) => ({ articulo, grupo: grupo.titulo, numero: 0 }))
).map((e, i) => ({ ...e, numero: i + 1 }));

export const TOTAL_ARTICULOS = ENTRADAS.length;

/** Every word an article renders, for search and for the reading estimate. */
export const textoPlano = (articulo: ManualArticle): string => {
  const partes: string[] = [articulo.titulo, articulo.entradilla];

  for (const b of articulo.bloques) {
    if (b.kind === 'parrafo' || b.kind === 'subtitulo' || b.kind === 'aviso') partes.push(b.texto);
    else if (b.kind === 'todavia-no' || b.kind === 'consejo') partes.push(b.texto);
    else if (b.kind === 'nota') partes.push(b.titulo, b.texto);
    else if (b.kind === 'pasos') partes.push(...b.pasos);
    else if (b.kind === 'lista') partes.push(...b.items);
    else if (b.kind === 'ruta') partes.push(...b.camino);
  }

  return partes.join(' ');
};

/**
 * Minutes to read, from the words actually written — never below one.
 *
 * Two hundred words a minute is the conventional figure for careful prose. It
 * is an estimate and it is labelled as one; what matters is that it cannot
 * drift away from the text the way a hand-typed "3 min" does the first time
 * someone edits the article and forgets the header.
 */
export const minutosDeLectura = (articulo: ManualArticle): number =>
  Math.max(1, Math.round(textoPlano(articulo).split(/\s+/).length / 200));

export const MINUTOS_TOTALES = ENTRADAS.reduce(
  (suma, e) => suma + minutosDeLectura(e.articulo),
  0
);

/** Case- and accent-insensitive match over the article's whole text. */
const normalizar = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export const buscar = (consulta: string): readonly ManualEntry[] => {
  const q = normalizar(consulta.trim());
  if (!q) return ENTRADAS;
  return ENTRADAS.filter((e) => normalizar(textoPlano(e.articulo)).includes(q));
};

export const entradaPorId = (id: string): ManualEntry | undefined =>
  ENTRADAS.find((e) => e.articulo.id === id);

/**
 * Splits the opening `ruta` off an article, when it has one.
 *
 * Both views draw that route inside the header, next to the title, and then
 * render the rest of the blocks — the route is context for the whole article,
 * not its first paragraph. A `ruta` that appears later in the body (a second
 * location inside the same article) is left where it is and drawn inline.
 */
export const separarRuta = (
  articulo: ManualArticle
): { ruta: readonly string[] | null; cuerpo: readonly ManualBlock[] } => {
  const [primero, ...resto] = articulo.bloques;
  if (primero && primero.kind === 'ruta') return { ruta: primero.camino, cuerpo: resto };
  return { ruta: null, cuerpo: articulo.bloques };
};
