import type { ManualArticle, ManualEntry, ManualGroup } from '../types';

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
 * ─── WHAT THE 9a ARTBOARD ASKED FOR AND IS NOT HERE ─────────────────────────
 *
 * · Reading state (the ✓ per article, the "6/13" progress bar, "Marcar leído").
 *   The artboard's own note explains why it matters — a partner needs to know
 *   whether the new lawyer read the verification article before being given
 *   curation rights. That is a per-user record on the server, and there is no
 *   table, no endpoint and no route for it. Faking it in localStorage would
 *   answer the partner's question with something only that browser knows, on
 *   the one screen whose entire subject is not trusting unverified claims.
 *   The index declares the gap instead.
 *
 * · "¿Le resolvió la duda?" (Sí / No) at the foot of each article. Two buttons
 *   that record nothing are a survey nobody reads.
 *
 * · Article 07, "Reformular con la jerga de su firma". There is no rewrite
 *   feature. What DOES exist is the firm's format travelling into the drafting
 *   prompt, and that is article 13. The slot is used for something real and
 *   daily instead: saving a draft and watching its deadline.
 *
 * Reading time is computed from the words actually written below, so it cannot
 * drift away from the text the way a hand-typed "3 min" does.
 */

const A_QUE_HACE: ManualArticle = {
  id: 'que-hace',
  titulo: 'Qué hace y qué no hace Iureon',
  entradilla:
    'Lo primero que conviene tener claro, porque decide cuándo puede confiar en la pantalla y cuándo tiene que abrir la norma.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Iureon redacta el primer borrador de un escrito, transcribe grabaciones de audiencia y entrevista, y guarda el catálogo de actuaciones con sus términos y sus fuentes. El trabajo que le ahorra es el de armar la estructura y de recordar el plazo; el que no le quita es el de decidir.'
    },
    {
      kind: 'parrafo',
      texto:
        'La aplicación guarda el conocimiento procesal para que usted no tenga que volver a comprobar cada documento. Esa promesa solo se sostiene si lo que está guardado fue comprobado alguna vez por alguien: por eso cada término aparece con su estado a la vista, y por eso hay una pantalla entera dedicada a curarlos.'
    },
    { kind: 'subtitulo', texto: 'Lo que sí hace' },
    {
      kind: 'lista',
      items: [
        'Redacta un escrito completo a partir de los hechos que usted describa, con la estructura de la actuación que elija del catálogo.',
        'Resuelve el nombre de la actuación contra el catálogo verificado y le dice qué término rige, con el artículo que lo fija.',
        'Transcribe una grabación separando quién habla, y le deja corregir el texto, dividir una intervención y reasignar una voz.',
        'Busca jurisprudencia en el corpus curado y, cuando ese corpus calla, consulta las relatorías oficiales de la Corte Constitucional, la Corte Suprema, el Consejo de Estado y la Comisión Nacional de Disciplina Judicial. Si el asunto es de un tribunal o un juzgado, no vive en ninguna de ellas y el escrito lo dice.',
        'Exporta a Word y a PDF con el membrete, la tipografía y la numeración que su firma haya configurado.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que no hace' },
    {
      kind: 'lista',
      items: [
        'No radica nada. Ningún escrito sale de Iureon hacia un juzgado.',
        'No decide la estrategia del caso ni escoge las pretensiones por usted.',
        'No garantiza que un dato que nadie verificó sea correcto. Cuando no lo está, lo dice en la propia línea del escrito.',
        'No lee los archivos que usted adjunta en el taller de redacción: por ahora solo se listan, y la pantalla lo advierte donde se adjuntan.',
        'No conserva el audio de sus grabaciones. Se borra del almacenamiento en la misma petición que devuelve el transcrito.'
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
    {
      kind: 'pasos',
      pasos: [
        'Abra Redacción en la barra de la izquierda. Si todavía no sabe qué actuación necesita, entre primero por Orientación y describa los hechos: allí el catálogo le propone actuaciones y de una de ellas puede saltar directo al taller.',
        'Escoja la rama del derecho y luego la actuación. La lista de actuaciones se arma desde el catálogo de la rama que escogió, así que cambiar de rama cambia la lista.',
        'En «Qué debe hacer este escrito» describa los hechos y la pretensión en lenguaje corriente. No hace falta redactar: hace falta contar.',
        'Genere. Puede hacerlo con el botón o con ⌘↵ (Ctrl+↵ en Windows). El escrito aparece a la derecha a medida que se produce.',
        'Lea el escrito con la barra de estado a la vista: ahí está el contador de afirmaciones sin verificar.',
        'Guarde el borrador si va a seguir mañana, o expórtelo a Word o a PDF si va a radicar.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Elegir la actuación del catálogo no es un formalismo. El nombre catalogado es lo que conecta el escrito con un artículo y un término comprobados; cualquier otro texto produce una estructura genérica sin norma detrás.'
    },
    {
      kind: 'nota',
      titulo: 'Si la rama no está catalogada',
      texto:
        'Algunas ramas todavía no tienen actuaciones catalogadas y ofrecen una lista antigua de tipos de documento. La pantalla lo advierte: en esos casos ninguna norma verificada respalda la estructura, y el término lo tiene que comprobar usted.'
    }
  ]
};

const A_TRES_ESTADOS: ManualArticle = {
  id: 'tres-estados',
  titulo: 'Los tres estados de una afirmación',
  entradilla:
    'Todo término, artículo y autoridad que aparece en un escrito está en uno de tres estados. Distinguirlos de un vistazo es lo único imprescindible para usar Iureon con seguridad.',
  bloques: [
    { kind: 'estados' },
    { kind: 'subtitulo', texto: 'Cómo se ve en el escrito' },
    { kind: 'ejemplo' },
    {
      kind: 'nota',
      titulo: 'Regla práctica',
      texto:
        'Si va a radicar hoy, mire primero el contador de «sin verificar» en la barra del escrito. Si dice 0, no hay nada que comprobar.'
    },
    {
      kind: 'parrafo',
      texto:
        'La diferencia entre «no caduca» y «sin verificar» es la que más se confunde y la que más cuesta. La primera es un hecho comprobado sin cifra: la norma no fija término, como ocurre con la acción de tutela. La segunda es la ausencia de comprobación. Las dos se ven distintas a propósito, y ninguna de las dos es un dato faltante que la aplicación se haya olvidado de traer.'
    }
  ]
};

const A_VERIFICAR: ManualArticle = {
  id: 'verificar',
  titulo: 'Verificar contra la norma',
  entradilla:
    'Qué significa exactamente verificar una ficha, y por qué se hace una sola vez para toda la firma.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Verificar es abrir el texto oficial de la norma, comprobar que el término y la autoridad que la ficha publica son los que ese artículo fija, y firmar esa comprobación con su nombre y la fecha. Queda guardado para la firma entera: el siguiente escrito de cualquier compañero ya sale con el término verificado.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Entre a Catálogo y busque la actuación por su nombre, o llegue a ella desde el escrito donde apareció sin verificar.',
        'Abra la fuente oficial que la ficha cita y localice el artículo.',
        'Compruebe tres cosas por separado: el término, el artículo que lo fija y la autoridad ante la que se surte.',
        'Si las tres coinciden, registre la verificación. Si alguna no coincide, corríjala en el mismo formulario antes de firmar.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Pregúntese siempre de quién es el reloj. El error más frecuente y más caro de este oficio no es un plazo mal copiado: es publicar el plazo de la contraparte o del juzgado y callar el que extingue el derecho de su cliente. La ficha se ve exacta y la cita es real.'
    },
    {
      kind: 'lista',
      items: [
        'Que una norma esté vigente no significa que esté resuelta: un decreto de emergencia obliga hoy y puede caer con efectos hacia atrás.',
        'Una fuente oficial también puede estar desactualizada. Confirme que el artículo que está leyendo trae la reforma que espera, en vez de confiar en el dominio.',
        'Un resultado de buscador no es fuente de derecho. Mezcla proyectos de ley, normas extranjeras y derecho vigente en una sola lista.'
      ]
    }
  ]
};

const A_INSTRUCCION: ManualArticle = {
  id: 'instruccion',
  titulo: 'Escribir la instrucción',
  entradilla: 'Qué conviene poner en el cuadro de texto, y qué no vale la pena escribir ahí.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'El cuadro «Qué debe hacer este escrito» espera hechos, no redacción. Escriba lo que pasó, en qué orden, quién es quién, qué pide y contra quién. La estructura del escrito no sale de ahí: sale de la actuación que usted escogió en el catálogo.'
    },
    { kind: 'subtitulo', texto: 'Lo que sí cambia el resultado' },
    {
      kind: 'lista',
      items: [
        'Fechas concretas. Son las que sostienen el cómputo del término y las que el escrito va a citar.',
        'Nombres y calidades de las partes, y el radicado si el proceso ya existe.',
        'La pretensión, dicha como pretensión: qué quiere que el juez ordene.',
        'Los hechos que le incomodan. Un borrador que no los conoce los omite, y esa omisión la descubre la contraparte.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que no hace falta' },
    {
      kind: 'lista',
      items: [
        'Fórmulas de encabezado, invocaciones y despedidas: las pone el escrito.',
        'Pedir un tono o un formato. La tipografía, el membrete y la numeración vienen de la configuración de su firma.',
        'Citar la norma de memoria. Si el catálogo la tiene verificada, entra por sí sola; si no la tiene, citarla de memoria es exactamente lo que hay que evitar.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Los archivos que adjunte en el taller todavía no se leen: se listan y nada más. Si un hecho está en un anexo y no en el cuadro de texto, el escrito no lo va a conocer.'
    },
    {
      kind: 'nota',
      titulo: 'Continuar un borrador',
      texto:
        'Si carga un borrador guardado, el cuadro deja de pedir hechos y pasa a pedir qué corregir, continuar o ampliar. La pantalla se lo dice arriba del cuadro, con el tamaño del borrador que está continuando.'
    }
  ]
};

const A_EXPORTAR: ManualArticle = {
  id: 'exportar',
  titulo: 'Revisar y exportar a Word o PDF',
  entradilla: 'Qué mirar antes de exportar, y qué diferencia hay entre los dos formatos.',
  bloques: [
    {
      kind: 'pasos',
      pasos: [
        'Lea el escrito completo. Es un borrador, y la lectura es corta precisamente porque el estado de cada afirmación está marcado.',
        'Revise el contador de afirmaciones sin verificar. Cada una es una decisión suya: verificarla, cambiarla o asumirla.',
        'Compruebe los datos que solo usted conoce: nombres, radicado, cuantía, direcciones de notificación.',
        'Exporte. El Word sirve para seguir editando; el PDF, para radicar o para archivar como quedó.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'Los dos formatos salen con el membrete, la tipografía, el interlineado y la numeración de hechos y de títulos que su firma tenga configurados, y el PDF numera las páginas con el total real. El membrete imprime solo lo que su firma escribió en Membrete: sin NIT no aparece la palabra NIT, sin correo no hay correo. Si no ha configurado nada, el escrito lleva únicamente el nombre de la firma y su NIT si lo tiene. El documento no lleva ninguna marca de Iureon: lo que se radica es de su firma.'
    },
    {
      kind: 'aviso',
      texto:
        'El archivo se fabrica dentro de la pestaña que usted tiene abierta, con el código que esa pestaña cargó. Si lleva días sin recargar, compare el sello de versión del pie de la barra lateral con el que espera antes de dar por bueno un export raro.'
    }
  ]
};

const A_BORRADORES: ManualArticle = {
  id: 'borradores',
  titulo: 'Guardar un borrador y vigilar su término',
  entradilla:
    'Un borrador jurídico no es un archivo que espera: es un plazo que corre. Por eso tiene puerta propia.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Desde el taller puede guardar el escrito en curso. Borradores, en la barra de la izquierda, los reúne todos con el término de la actuación a la que pertenecen, para que saber qué vence esta semana no obligue a entrar a redactar.'
    },
    {
      kind: 'lista',
      items: [
        'Un borrador guardado se puede volver a abrir en el taller y continuar: el cuadro de instrucción pasa a pedir qué corregir o ampliar.',
        'El término que se muestra es el de la actuación catalogada. Si esa ficha no está verificada, el borrador lo hereda y lo dice.',
        'Cada borrador queda a nombre de quien lo creó, que sale de su sesión y no de un campo que se pueda escribir.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'El escrito guarda el estado del momento',
      texto:
        'Un escrito generado antes de que alguien verificara la ficha conserva el estado que tenía ese día. Si después se verifica el término y usted quiere verlo verificado en el documento, hay que volver a generarlo.'
    }
  ]
};

const A_ENTREVISTA: ManualArticle = {
  id: 'entrevista',
  titulo: 'Entrevistar a un cliente',
  entradilla:
    'Cómo queda registrada una entrevista, qué se le pregunta antes de grabar y qué se hace con lo grabado.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Una entrevista es una transcripción atada a un cliente. El cliente se identifica por su cédula, que es única dentro de su firma y no se puede cambiar después: es la llave por la que la firma vuelve a encontrar a esa persona.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Registre al cliente o búsquelo por su cédula.',
        'Tenga a la vista «Lo que no puede quedarse sin preguntar»: cuatro preguntas cuya respuesta define un término o cierra una prueba —la fecha exacta del hecho, cuándo lo notificaron, si hubo recurso o reclamación antes, y qué documentos tiene hoy—. Debajo de cada una dice qué se pierde si no se pregunta.',
        'Antes de grabar, la pantalla le pide constancia de que el cliente autorizó la grabación. Es un paso bloqueante y está ahí a propósito: la voz es un dato biométrico y la hora del clic queda registrada.',
        'Grabe desde el navegador —con pausa y con la onda del micrófono a la vista— o suba un archivo. El audio va del navegador al almacenamiento sin pasar por nuestros servidores, y se borra apenas se devuelve el transcrito.',
        'Corrija el transcrito: edite palabras mal oídas, divida una intervención donde hablan dos personas, reasigne una intervención a otra voz e identifique cada voz con su rol.',
        'Al terminar de transcribir, las cuatro preguntas se tachan solas con lo que quedó dicho. Es una ayuda de memoria, no una comprobación: que una quede tachada no garantiza que la respuesta sirva, y que quede sin tachar no significa que no se habló del tema.',
        'Cierre la entrevista con una decisión. Si declina el caso, la decisión exige un motivo.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'La segunda entrevista con el mismo cliente',
      texto:
        'Si el cliente ya tuvo una entrevista, el guion marca aparte —en azul y con la fecha— lo que quedó respondido en ella: «ya se habló de esto en la entrevista del 5 de agosto». Es distinto del tachado de hoy a propósito: una respuesta de hace tres semanas se relee, no se da por hecha. Lo que el cliente vuelva a decir hoy se tacha como de hoy.'
    },
    {
      kind: 'parrafo',
      texto:
        'A partir de lo que dijo el cliente —no de la entrevista entera, que es en su mayoría el abogado— la pantalla sugiere jurisprudencia del corpus. Si el corpus no cubre el tema, calla y lo explica en vez de ofrecer providencias apenas parecidas. No hay doctrina: son providencias, y la pantalla también lo dice.'
    },
    {
      kind: 'parrafo',
      texto:
        'En el teléfono la entrevista se graba con la misma grabadora y el mismo consentimiento; el cronómetro es lo más grande de la pantalla y la grabación sigue con la pantalla apagada. El guion aparece al terminar de transcribir, no mientras se graba: el teléfono es la grabadora, y nadie lee una lista en el aparato que está grabando.'
    }
  ]
};

const A_AUDIENCIA: ManualArticle = {
  id: 'audiencia',
  titulo: 'Subir el audio de una audiencia',
  entradilla: 'Las cuatro herramientas de corrección, y cuál usar según qué salió mal.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Suba la grabación desde Audiencias. Mientras el archivo viaja al almacenamiento el botón muestra el porcentaje enviado, y después dice «Transcribiendo»: son dos esperas distintas y las dos se ven. La transcripción separa a los interlocutores y le propone un rol para cada voz cuando encuentra en el propio audio la frase que lo justifica —quien reparte la palabra es el juez, el juramento marca al testigo—, siempre citando el minuto y la frase. Nunca asigna sola: si no hay señal clara, la voz queda como desconocida.'
    },
    {
      kind: 'parrafo',
      texto:
        'Los fragmentos que el motor oyó con poca seguridad quedan marcados en el propio texto, solo en el tramo afectado: el resto de la intervención sí es fiable y no se marca. Una audiencia queda «Por revisar» hasta que alguien la lea y la marque como acta lista; esa marca es de una persona, no del motor.'
    },
    { kind: 'subtitulo', texto: 'Qué herramienta usar' },
    {
      kind: 'lista',
      items: [
        'Editar — una palabra mal transcrita. Corrija el texto en pantalla; la corrección se guarda.',
        'Dividir — dos personas quedaron en un mismo renglón. Parte la intervención en el cursor y le pregunta de quién es la mitad cortada.',
        'Otra voz — la intervención completa está atribuida a quien no es. Se la entrega a otra voz, y el rol viaja con el destino.',
        'Asignar rol — la voz está bien separada pero mal identificada. Nombra al interlocutor en todas sus intervenciones.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Cuando dos personas hablan encima, la separación de voces no las distingue y ambas caen en un mismo bloque. No es una configuración: hay que cortar primero con Dividir y después asignar. Si la aplicación le avisa que bajo una misma voz aparecen dos nombres, es exactamente este caso.'
    },
    {
      kind: 'parrafo',
      texto:
        'El transcrito se guarda apenas responde el proveedor, así que cerrar la pestaña no pierde nada ni obliga a repetir el gasto. El audio no se guarda: puede escucharlo mientras corrige desde la copia que quedó en su navegador, y esa copia dura lo que dure la pestaña.'
    },
    {
      kind: 'nota',
      titulo: 'Vocabulario jurídico',
      texto:
        'El modelo va preparado para oír términos del oficio, y aun así se equivoca. Los errores peligrosos son los que suenan bien: «desembarco» por desembargo, «con recámaras» por Confecámaras. Por eso el transcrito se edita y la grabación se puede volver a oír.'
    },
    {
      kind: 'subtitulo',
      texto: 'El resumen y los hechos relevantes'
    },
    {
      kind: 'parrafo',
      texto:
        'Sobre una audiencia o una entrevista transcrita puede pedir el resumen: unas frases sobre qué se trató y una lista de hechos dichos, cada uno con el minuto y quién lo dijo. Extrae lo que se dijo, no conclusiones jurídicas, y si el transcrito no trae hechos relevantes lo dice en vez de inventarlos. Se genera una vez y queda guardado; reabrirla mañana no lo vuelve a generar. Cuesta $50 del saldo cada vez que se genera o se regenera; transcribir no cuesta.'
    }
  ]
};

const A_CURADURIA: ManualArticle = {
  id: 'curaduria',
  titulo: 'Curar el catálogo de la firma',
  entradilla: 'Cómo una comprobación hecha una vez deja de repetirse en cada escrito.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'El catálogo llega con las actuaciones y los términos que trae el producto. Encima de eso, cada firma guarda su propia curaduría: cuando un abogado verifica un término, esa verificación vale para su firma y para todos los escritos que vengan después.'
    },
    {
      kind: 'parrafo',
      texto:
        'La curaduría se hace dentro del producto, no editando código. Esa es la diferencia entre validar cada documento —el trabajo que la aplicación existe para eliminar— y validar el conocimiento una sola vez.'
    },
    {
      kind: 'lista',
      items: [
        'Un mismo nombre de actuación puede existir en dos ramas con términos distintos. Por eso la rama siempre viaja con la búsqueda, y una etiqueta ambigua se rechaza en vez de resolverse a la primera coincidencia.',
        'Hay actuaciones transversales, como el derecho de petición, que aparecen en todas las ramas siendo una sola ficha. Corregirla la corrige en todas partes.',
        'Verificar exige la fuente. Un término sin fuente no se puede registrar como verificado.'
      ]
    },
    {
      kind: 'todavia-no',
      texto:
        'La historia de curaduría por actuación —quién verificó qué y cuándo, en una línea de tiempo— todavía no existe. Hoy se ve el estado actual y quién firmó la última verificación, no el recorrido completo.'
    }
  ]
};

const A_PLANES: ManualArticle = {
  id: 'planes-y-pago',
  titulo: 'Planes y pago de la suscripción',
  entradilla: 'Qué incluye cada plan, cuánto cuesta, cómo se paga y qué pasa cuando vence.',
  bloques: [
    { kind: 'subtitulo', texto: 'Dos planes' },
    {
      kind: 'lista',
      items: [
        'Esencial: $70.000 al mes o $700.000 al año. Un usuario. Incluye Redacción, Borradores, Revisiones, Buscador, Catálogo, Herramientas, Manual, Soporte y Membrete. No incluye Audiencias, Entrevistas ni Orientación.',
        'Premium: $100.000 al mes o $1.000.000 al año. Hasta cinco usuarios. Incluye todos los módulos.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'Los precios incluyen IVA. El plan anual son doce meses por el precio de diez. El consumo de inteligencia artificial —escritos, revisiones, resúmenes, orientaciones pasado el cupo gratuito— no está incluido en el plan: se descuenta del saldo de recargas, como se explica en «Roles y saldo». Son dos cosas distintas: el plan es el derecho a usar la aplicación; el saldo, lo que cada operación consume.'
    },
    { kind: 'subtitulo', texto: 'Cómo se paga' },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Plan de la firma» desde la barra lateral (junto a Saldo) o, en el teléfono, desde «Más».',
        'Elija el plan y el periodo: «Pagar · 1 mes» o «Pagar · 12 meses».',
        'La aplicación lo lleva a la pasarela de Wompi con el valor ya fijado; pague con PSE, tarjeta o los medios que ofrezca.',
        'Cuando la pasarela confirma, el plan se extiende solo y el pago queda en la tabla «Pagos del plan».'
      ]
    },
    {
      kind: 'nota',
      titulo: 'Pagar antes de vencer no pierde días',
      texto:
        'Cada pago suma su periodo a la fecha vigente. Si el plan vence el 20 y paga un mes el 10, queda vigente hasta el 20 del mes siguiente. Si cambia de plan al pagar, el plan nuevo rige desde ese pago; no hay prorrateo. No se guarda tarjeta ni se cobra automáticamente: cada periodo se paga con un checkout nuevo, y solo un administrador de la firma puede hacerlo.'
    },
    { kind: 'subtitulo', texto: 'Qué pasa al vencer' },
    {
      kind: 'parrafo',
      texto:
        'Siete días antes, los administradores ven una franja arriba de la aplicación con la fecha. Al vencer, la firma queda en solo lectura: todos pueden entrar, leer, exportar y pagar; ninguna operación de inteligencia artificial se ejecuta y no se crean transcripciones nuevas. El saldo de recargas no se pierde. Al pagar, todo vuelve en el acto.'
    },
    {
      kind: 'aviso',
      texto:
        'En el plan Esencial, Audiencias, Entrevistas y Orientación no aparecen en la barra, y crear una segunda cuenta responde que el plan admite una sola. Pasar a Premium habilita las tres pantallas y hasta cinco cuentas desde el momento del pago.'
    }
  ]
};

const A_ROLES_SALDO: ManualArticle = {
  id: 'roles-saldo',
  titulo: 'Roles y saldo',
  entradilla: 'Quién puede hacer qué dentro de la firma, y cómo se consume y se recarga el saldo.',
  bloques: [
    { kind: 'subtitulo', texto: 'Roles' },
    {
      kind: 'parrafo',
      texto:
        'Un rol no es una etiqueta: se impone en el servidor, en cada petición. La administración de la firma —dar de alta compañeros, cambiar roles, recargar— corresponde al administrador; redactar, transcribir y consultar, a todos.'
    },
    { kind: 'subtitulo', texto: 'Saldo' },
    {
      kind: 'parrafo',
      texto:
        'Consumen saldo los escritos generados, las orientaciones que pasen del cupo diario gratuito y el resumen de una audiencia o entrevista ($50 por resumen). Transcribir no consume saldo. El saldo se reserva antes de llamar al modelo, no se cobra después: si no alcanza, se lo dicen antes de empezar, y si el trabajo falla, la reserva se devuelve. El saldo también fija cuánto puede extenderse un escrito, para que nunca reciba uno cortado por una regla que no conocía.'
    },
    {
      kind: 'parrafo',
      texto:
        'La pantalla de Saldo muestra el disponible, el consumo del mes —escritos, transcripciones y orientaciones— y, con el consumo real de su firma, aproximadamente cuántos escritos alcanza. Las recargas se hacen desde ahí: elija el monto y «Pagar» lo lleva a la pasarela de Wompi, donde paga con PSE, tarjeta o los medios que ofrezca; el saldo se acredita cuando la pasarela confirma y el movimiento queda en la misma pantalla. En el teléfono, Saldo está en «Más», abajo a la derecha.'
    },
    {
      kind: 'parrafo',
      texto:
        'Debajo de la recarga está el extracto del período: elija el mes y verá el saldo inicial, las entradas, las salidas por concepto —escritos, resúmenes, orientaciones— y el saldo final, sumados por el servidor sobre el mismo libro que la tabla de movimientos. «Imprimir comprobante» abre la impresión del navegador; en el teléfono, elija «Guardar como PDF». El comprobante lleva el nombre y el NIT de la firma, el período y el detalle línea por línea. Cada consumo aparece con el título del escrito o de la grabación que lo causó y con el correo de quien lo pidió.'
    },
    {
      kind: 'nota',
      titulo: 'El comprobante no es una factura',
      texto:
        'En Colombia la factura de venta es un documento que la DIAN valida antes de entregarse. El comprobante del extracto es informativo y lo dice en su pie: sirve para saber en qué se fue el saldo y para conciliar con contabilidad, pero no sustituye la factura electrónica de la recarga, que se emite por separado.'
    },
    {
      kind: 'nota',
      titulo: 'Recargas que no pasan por la pasarela',
      texto:
        'Si Iureon le acredita saldo directamente —una compensación por un borrador fallido, por ejemplo—, esa recarga la hace el operador desde su consola, con un motivo escrito que queda en la auditoría de su firma con el correo de quien la hizo. Es la única forma en que el saldo se mueve sin que su firma pague.'
    },
    {
      kind: 'todavia-no',
      texto:
        'La factura electrónica de cada recarga no se emite todavía desde la aplicación. Cuando se emita, saldrá por un proveedor tecnológico autorizado por la DIAN y llegará al correo de facturación de la firma; hasta entonces, el comprobante del extracto es el único documento que la aplicación produce, y no es factura.'
    },
    {
      kind: 'todavia-no',
      texto:
        'Los topes de gasto por usuario no existen todavía. Un tope que la interfaz muestre pero el servidor no imponga no es un tope, así que hasta que se imponga en cada petición, el control es el saldo de la firma.'
    }
  ]
};

const A_REVISAR: ManualArticle = {
  id: 'revisar-escrito',
  titulo: 'Revisar un escrito ya redactado',
  entradilla: 'Suba la tutela, la demanda o el recurso que ya escribió y pregunte qué está bien, qué está mal y qué corregir.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'En Redacción, debajo de los adjuntos, está «Revisar un escrito ya redactado». Elija primero la actuación arriba —la revisión objetiva se hace contra su ficha verificada—, suba el archivo en PDF, Word o texto —hasta 15 MB, con anexos—, o pegue el texto, y escriba lo que quiere saber. La respuesta es un informe: juicio global, secciones que la norma exige y faltan, fortalezas, debilidades, errores de aplicación con su corrección, citas textuales del escrito con la frase que las reemplazaría —copiadas tal cual, para encontrarlas con buscar, y con el reemplazo listo para pegar— y recomendaciones. No reescribe su escrito completo.'
    },
    {
      kind: 'parrafo',
      texto:
        'El informe separa dos planos y lo dice en cada punto: lo que exige la norma, que sale de la ficha del catálogo y se cita con artículo, y lo que es criterio profesional del revisor, que usted pesa. No cita sentencias: cuando un punto necesite precedente, lo señala para que usted lo verifique. Cuesta lo mismo que un borrador y se descuenta del saldo de la firma; si el revisor no responde, no se cobra.'
    },
    {
      kind: 'subtitulo',
      texto: 'El taller: corregir el escrito con el revisor al lado'
    },
    {
      kind: 'parrafo',
      texto:
        'Con el informe en pantalla, «Abrir en el taller» muestra el escrito con los pasajes citados tachados: toque uno y verá por qué falla y el reemplazo propuesto, con un botón «Aplicar». En «Editar» corrige el texto a mano. A la derecha está el revisor: pregúntele o pídale redacciones —«reescribe la pretensión tercera como subsidiaria», «¿cómo va después de mis cambios?»—; cada mensaje lleva el texto tal como está en ese momento, cuesta $300 y, si propone cambiar un pasaje, trae su botón «Aplicar». «Volver a revisar» emite un informe nuevo sobre el texto corregido ($2.000). El texto corregido se descarga en Word o PDF con el membrete de la firma. También se llega al taller desde el módulo «Revisiones» de la barra lateral. Y desde Redacción: el botón «Taller» sobre cualquier escrito generado abre el mismo taller con la guía, sin informe previo; ahí la conversación y las marcas se guardan con el borrador. En el taller puede seleccionar texto para resaltarlo en amarillo, verde, azul o rosa, o tacharlo; las marcas se anclan a las palabras y sobreviven a las ediciones, y con doble clic se quitan. Cuando la guía responde, los pasajes de los que habla se subrayan en azul. Sus marcas de colores viajan con cada mensaje, así que puede pedirle «revisa lo que resalté en amarillo» o «quita lo tachado» y la guía sabe a qué se refiere. El taller tiene pantalla completa, permite plegar la guía para leer a todo lo ancho, y guarda versiones del texto: una antes de cada revisión nueva y de cada consulta si el texto cambió, y otra cuando pulse «Guardar versión». En la pestaña Versiones se compara cualquiera con el texto actual —lo quitado en rojo, lo añadido en verde— y se restaura si la de antes era mejor. Se conservan las últimas quince. También puede dejar comentarios sobre un pasaje: selecciónelo, elija «Comentar» y escriba la nota; queda marcado con línea punteada y aparece en la pestaña Comentarios para retomarlo después. Los comentarios viajan a la guía con cada mensaje, así que puede escribirle «mira mi comentario sobre la jurisprudencia» y ella responde a esa nota; y si un comentario la corrige, lo tiene en cuenta o explica por qué no. El papel del taller se lee como el de Redacción: párrafos justificados, títulos en negrita —las líneas en mayúscula sostenida y las negritas del borrador— y una barra de desplazamiento visible al costado derecho para ir de una vez al final. Desde Redacción, el botón «Taller» está arriba del papel, junto a «Editar», y también al pie. En el taller, en el borrador de Redacción y en los transcritos de Audiencias y Entrevistas hay un control «A −  +» para agrandar o reducir la letra en pantalla al instante, del 85 % al 200 %; tocar el porcentaje vuelve al tamaño normal. Es solo para leer: no cambia el tamaño del documento, que sigue siendo el de Membrete en el PDF y el Word, y cada pantalla recuerda el suyo en ese navegador.'
    },
    {
      kind: 'nota',
      titulo: 'Si la guía niega una sentencia que sí existe',
      texto:
        'Cada vez que usted nombra una sentencia de la Corte Constitucional en el chat o en un comentario —por su tipo, número y año, como la escribe siempre—, la aplicación la consulta en el índice oficial de la Corte antes de que la guía responda, y le entrega el resultado con la fuente y un extracto del texto oficial. Ese resultado manda sobre la memoria del modelo: si la guía había dicho que no existía, debe reconocerlo y corregir con base en el extracto. Si el índice no la tiene, la guía se lo dice así, con la fuente, y le sugiere revisar número y año; si el índice no respondió, lo dice y no la da ni por existente ni por inexistente. Las providencias de la Corte Suprema, del Consejo de Estado y de tribunales no se verifican por esta vía: la guía debe pedirle la fuente o el radicado en vez de afirmar o negar que existan.'
    },
    {
      kind: 'nota',
      titulo: 'Retomar otro día requiere autorización de la firma',
      texto:
        'El texto de trabajo y la conversación se conservan en el servidor solo si un socio administrador lo autoriza, una vez, para toda la firma; queda en la auditoría con su correo. Sin esa autorización el taller funciona igual, pero al cerrar la pestaña se pierden el texto y la conversación —el informe sí queda— y la cinta de arriba lo advierte. La autorización se da desde esa misma cinta o desde la cabecera del módulo «Revisiones», donde siempre se ve si está dada, quién la dio y cuándo, y donde también se puede retirar.'
    },
    {
      kind: 'nota',
      titulo: 'El informe se guarda; el escrito, si la firma lo autoriza',
      texto:
        'El informe queda guardado para su firma y aparece en «Revisiones anteriores» dentro del mismo diálogo, con el cliente o proceso que usted indique al pedirla, la actuación, el archivo, la fecha y hora y el abogado que la pidió; ábralo cuando vuelva a corregir el escrito o elimínelo. Cada informe se puede descargar en PDF y en Word con la misma estructura de la pantalla y la letra de la firma, o copiar como texto. El escrito revisado se conserva únicamente si la firma autorizó el taller; si no, se lee, se revisa y se descarta en la misma petición. En la auditoría de la firma queda que se revisó un escrito de tal actuación, nunca su contenido.'
    },
    {
      kind: 'aviso',
      texto:
        'Un PDF escaneado es una imagen y no trae texto: la aplicación se lo dirá y tendrá que pegar el texto. Se lee el documento completo hasta 300.000 caracteres, unas 75 páginas; solo si el escrito es más largo el informe declara que fue recortado.'
    }
  ]
};

const A_DATOS_CLIENTE: ManualArticle = {
  id: 'datos-cliente',
  titulo: 'Qué responder si su cliente pregunta por sus datos',
  entradilla: 'La posición jurídica de cada quien, dicha en el orden en que se pregunta.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Su firma es la responsable del tratamiento de los datos de su cliente. Iureon es su encargado. Los proveedores que Iureon usa para prestar el servicio son, por eso, subencargados de su firma, y usted tiene derecho a saber cuáles son y qué recibe cada uno.'
    },
    {
      kind: 'parrafo',
      texto:
        'Esa lista está en la pantalla de Privacidad, y no la mantiene nadie a mano: se deriva de la configuración que está corriendo. Por cada proveedor responde las cuatro preguntas que un abogado hace, en el mismo orden: qué recibe, dónde se procesa, con qué base sale del país y cuánto lo conserva.'
    },
    {
      kind: 'lista',
      items: [
        'El audio de una audiencia no se conserva: se borra del almacenamiento en la misma petición que devuelve el transcrito.',
        'El transcrito sí se guarda, dentro de su firma, y solo su firma lo ve.',
        'La consola de operación de Iureon gestiona firmas, planes y saldos, y no puede abrir un transcrito, un borrador ni un expediente.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'WhatsApp queda fuera de ese acuerdo. No envíe por ahí datos de sus clientes ni documentos del caso, aunque escriba a soporte.'
    },
    {
      kind: 'nota',
      titulo: 'El chat de soporte dentro de la aplicación',
      texto:
        'En «Soporte» puede abrir una conversación que queda guardada en su cuenta y que responde el operador de la plataforma en horario laboral, sin tiempo de respuesta garantizado. Lo ven todos los abogados de su firma y cada mensaje queda en su auditoría. La regla es la misma que para WhatsApp: describa el problema, no pegue datos de clientes ni documentos del caso. El operador no ve su material por escribirle; si necesita verlo, se lo pedirá por el acceso de soporte, que autoriza un socio.'
    }
  ]
};

const A_FORMATO: ManualArticle = {
  id: 'formato',
  titulo: 'Formato, membrete y tipografía',
  entradilla: 'Cómo se configura la marca de la firma y hasta dónde llega su efecto.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'En la configuración de la firma —«Membrete», en la barra lateral— se guardan el nombre, el NIT, la dirección, el teléfono, el correo, la tarjeta profesional, el logo y la imagen de firma, además de la tipografía, el tamaño, el interlineado y la forma de numerar hechos y títulos. Lo que se elija ahí se ve en el escrito en pantalla y sale igual en el Word y el PDF: la letra no se cambia escrito por escrito, porque es de la firma, no del documento. Hay nueve letras: las clásicas de juzgado —Times New Roman, Arial, Calibri, Tahoma— y cuatro libres —Plus Jakarta Sans, Manrope, Public Sans y Satoshi—. Las libres van incrustadas en el PDF y se ven igual en todas partes; en Word dependen de que quien abra el archivo las tenga instaladas. Las clásicas están en todo equipo con Office, y en el PDF salen con su equivalente estándar, Times o Helvetica, porque no se pueden incrustar sin licencia.'
    },
    {
      kind: 'parrafo',
      texto:
        'Ese formato no se aplica solo al exportar: viaja al motor de redacción como instrucción, así que el escrito nace ya con la numeración y los títulos que su firma usa, en vez de quedar maquillado al final.'
    },
    {
      kind: 'lista',
      items: [
        'El membrete con el logo, la tipografía elegida, la fecha y la paginación real salen en el PDF del escrito.',
        'El acta de audiencia usa su propio formato de acta y también sale en Word y en PDF.',
        'Ni el Word ni el PDF llevan marca de Iureon.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'Si el documento no sale con su membrete',
      texto:
        'Compruebe primero que la marca esté guardada, y después el sello de versión del pie de la barra lateral: una pestaña que lleva días abierta exporta con el código que cargó ese día.'
    }
  ]
};

const A_MOVIL: ManualArticle = {
  id: 'movil',
  titulo: 'Iureon en el teléfono',
  entradilla:
    'Cada módulo tiene su pantalla pensada para el teléfono. No es la de computador apretada: es otra, con lo que se hace de pie.',
  bloques: [
    {
      kind: 'parrafo',
      texto:
        'Abajo hay una barra con cuatro puertas: Redactar, Audiencias, Entrevistas y Más. Arriba, el nombre del módulo y sus acciones. Todo lo demás —Buscador, Catálogo, Borradores, Manual, Soporte, Ajustes y Saldo— está en «Más», agrupado con los mismos verbos de la barra lateral del computador, para que no haya que aprender dos mapas del mismo producto.'
    },
    {
      kind: 'lista',
      items: [
        'Redactar: el taller en pestañas —instrucción, configuración y escrito— y el visor con la barra de revisión. La orientación por hechos también está, con el mismo salto al taller.',
        'Entrevistas: la grabadora ocupa la pantalla, con pausa y con la onda. El guion de las cuatro preguntas aparece al terminar de transcribir.',
        'Audiencias: se sube el archivo, se ve el porcentaje mientras viaja, y el transcrito se lee con cada intervención a ancho completo. Asignar roles, dividir y corregir se hacen en el computador: de pie se revisa, no se edita.',
        'Catálogo: se busca por nombre y cada ficha se abre completa, con su término, su fuente y su estado.',
        'Los diálogos suben desde abajo, como una hoja, y se cierran deslizando o con el velo.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Grabar una entrevista con la pantalla apagada funciona, pero cerrar la aplicación no: la grabación vive en la pestaña. Si va a grabar más de unos minutos, deje el teléfono con la aplicación al frente.'
    }
  ]
};

/** The index, grouped by task and by role — not by module. */
export const MANUAL: readonly ManualGroup[] = [
  {
    titulo: 'Primeros 20 minutos',
    articulos: [A_QUE_HACE, A_PRIMER_ESCRITO, A_TRES_ESTADOS, A_VERIFICAR, A_MOVIL]
  },
  { titulo: 'Redactar', articulos: [A_INSTRUCCION, A_REVISAR, A_EXPORTAR, A_BORRADORES] },
  { titulo: 'Grabar', articulos: [A_ENTREVISTA, A_AUDIENCIA] },
  {
    titulo: 'Para socios',
    articulos: [A_CURADURIA, A_ROLES_SALDO, A_PLANES, A_DATOS_CLIENTE, A_FORMATO]
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
    else if (b.kind === 'todavia-no') partes.push(b.texto);
    else if (b.kind === 'nota') partes.push(b.titulo, b.texto);
    else if (b.kind === 'pasos') partes.push(...b.pasos);
    else if (b.kind === 'lista') partes.push(...b.items);
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
