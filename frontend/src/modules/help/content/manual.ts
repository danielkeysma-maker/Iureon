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
 * ─── WHAT THE 9a ARTBOARD ASKED FOR AND IS NOT HERE ─────────────────────────
 *
 * · "¿Le resolvió la duda?" (Sí / No) at the foot of each article. Two buttons
 *   that record nothing are a survey nobody reads.
 *
 * · Article 07, "Reformular con la jerga de su firma". There is no rewrite
 *   feature. What DOES exist is the firm's format travelling into the drafting
 *   prompt, and that is the article on Membrete. The slot is used for something
 *   real and daily instead: saving a draft and watching its deadline.
 *
 * ─── THINGS THE OLD TEXT CLAIMED AND THE PRODUCT DOES NOT DO ────────────────
 *
 * Removed on 2026-09-04 after grepping the components:
 * · "el contador de afirmaciones sin verificar" in the draft's status bar.
 *   No such counter exists (`DocumentCanvasRight`, `DraftProvenanceBar`): the
 *   pipeline does not classify claims one by one. What exists is a chip
 *   «Término sin verificar» / «Sin catalogar», the «Secciones exigidas N/M»
 *   counter and the provenance bar above the paper.
 * · The phone's bottom bar being "Redactar, Audiencias, Entrevistas y Más".
 *   It is «Redactar», «Orientar», «Grabar» and «Más» (`MobileTabBar`).
 * · «Pagar · 1 mes» / «Pagar · 12 meses». The plan modal has a Mensual/Anual
 *   switch and a button that reads «Contratar <plan> mensual» or «Renovar …».
 * · "cada herramienta exporta" Excel. Six do; the glossary does not.
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
    { kind: 'ruta', camino: ['Barra lateral', 'Producir · Registrar · Consultar · Aprender'] },
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
    { kind: 'subtitulo', texto: 'Cómo está organizada la barra lateral' },
    {
      kind: 'pasos',
      pasos: [
        'Producir: «Redacción» (el taller donde se genera un escrito), «Borradores» (los escritos guardados con su término), «Revisiones» (los escritos ya redactados que un revisor corrigió con usted) y «Orientación» (de los hechos a la actuación).',
        'Registrar: «Audiencias» y «Entrevistas», las dos pantallas que transcriben una grabación.',
        'Consultar: «Buscador» de jurisprudencia, «Catálogo» de actuaciones y «Herramientas» de cálculo.',
        'Aprender: este «Manual de uso» y «Soporte». Al inicio del índice del manual, «Novedades» lista qué cambió en la aplicación y cuándo.',
        'Administrar (plegado por defecto): «Seguridad», con la auditoría de la firma; «Privacidad», con los proveedores que tocan sus datos; y «Ajustes».',
        'En el pie de la barra están «Saldo», «Plan», «Membrete» y «Avisos»: son ajustes de la firma y del aparato, no módulos. En «Ajustes», dentro de Administrar, están además «Atajos de teclado», con los que la aplicación escucha; «Avisos», para activar las notificaciones de este dispositivo e instalar la app; «Su cuenta», con su correo, rol y firma y el cierre de sesión; y «Plan y facturación», con el plan vigente y el acceso a la pantalla de planes.'
      ]
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
    { kind: 'ruta', camino: ['Redacción', '«Tipo de documento»', '«Qué debe hacer este escrito»', '«Generar escrito»'] },
    {
      kind: 'parrafo',
      texto:
        'Redacción tiene dos mitades: a la izquierda, lo que usted le pide; a la derecha, el papel donde aparece el escrito. Arriba, una barra fija con tres selectores decide qué clase de documento se va a producir.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Redacción» en la barra lateral. Si todavía no sabe qué actuación necesita, entre primero por «Orientación», describa los hechos y pulse «Orientar»: el catálogo le propone actuaciones y en cada una hay un botón «Redactar esta» que lo trae aquí con la actuación ya elegida.',
        'En la barra de arriba escoja «Quién escribe» —«Firma / Litigante», «Juez / Despacho» o «Secretaría»—, luego la «Rama» y, en «Tipo de documento», la actuación. Esa lista se arma desde el catálogo de la rama que escogió, así que cambiar de rama cambia la lista.',
        'En el cuadro «Qué debe hacer este escrito» cuente los hechos y la pretensión en lenguaje corriente. No hace falta redactar: hace falta contar.',
        'Pulse «Generar escrito» (dice «Proyectar providencia» si escribe un juez y «Generar acto» si escribe la secretaría), o use ⌘↵ en Mac y Ctrl+↵ en Windows. El escrito aparece a la derecha a medida que se produce.',
        'Lea el escrito con la barra de arriba del papel a la vista. Si el término de la actuación no está comprobado o la actuación no está catalogada, ahí aparece una franja ámbar y un chip «Término sin verificar» o «Sin catalogar»; si la firma ya la curó, una marca verde discreta; si no hay nada que advertir, nada.',
        'Pulse «Guardar» al pie del papel si va a seguir mañana, o «Word» o «PDF» en la cabecera si va a radicar.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Antes de generar, mire el término que la barra de arriba muestra junto a la actuación. Si dice «Término sin verificar», puede abrir «Catálogo», verificarlo en dos minutos y volver: el escrito saldrá ya con el término comprobado, en vez de tener que regenerarlo después.'
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
        'Algunas ramas todavía no tienen actuaciones catalogadas y ofrecen una lista antigua de tipos de documento. La pantalla lo advierte con «Esta rama aún no tiene catálogo verificado»: en esos casos ninguna norma verificada respalda la estructura, y el término lo tiene que comprobar usted.'
    }
  ]
};

const A_TRES_ESTADOS: ManualArticle = {
  id: 'tres-estados',
  titulo: 'Los tres estados de una afirmación',
  entradilla:
    'Todo término, artículo y autoridad que aparece en un escrito está en uno de tres estados. Distinguirlos de un vistazo es lo único imprescindible para usar Iureon con seguridad.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', 'Barra sobre el papel', 'Catálogo', 'Ficha de la actuación'] },
    { kind: 'estados' },
    { kind: 'subtitulo', texto: 'Cómo se ve en el escrito' },
    { kind: 'ejemplo' },
    { kind: 'subtitulo', texto: 'Dónde mirar el estado antes de radicar' },
    {
      kind: 'pasos',
      pasos: [
        'En Redacción, con el escrito generado, mire la barra que hay entre la cabecera y el papel: si la actuación tiene término sin comprobar aparece el chip «Término sin verificar»; si no está en el catálogo, «Sin catalogar». Si no hay chip, no hay nada que advertir sobre el término.',
        'En esa misma barra, «Secciones exigidas N/M encontradas» dice cuántas de las secciones que la ficha exige aparecen en el texto. Verde si están todas; ámbar si falta alguna.',
        'Justo arriba del papel, la franja de procedencia dice contra qué ficha se redactó: su artículo, su fuente y si alguien de su firma la curó. Es ámbar cuando falta comprobación y no aparece cuando no hay nada que decir.',
        'Para ver el detalle completo, abra «Catálogo», busque la actuación y lea los tres bloques de la ficha —término, norma y autoridad—, cada uno con su propio estado.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Cuando el chip diga «Término sin verificar», no lo resuelva corrigiendo el escrito a mano: verifique la ficha en Catálogo. El arreglo a mano sirve para ese documento; la verificación sirve para todos los que vengan.'
    },
    {
      kind: 'parrafo',
      texto:
        'La diferencia entre «no caduca» y «sin verificar» es la que más se confunde y la que más cuesta. La primera es un hecho comprobado sin cifra: la norma no fija término, como ocurre con la acción de tutela. La segunda es la ausencia de comprobación. Las dos se ven distintas a propósito, y ninguna de las dos es un dato faltante que la aplicación se haya olvidado de traer.'
    },
    {
      kind: 'todavia-no',
      texto:
        'No existe un contador de afirmaciones sin verificar dentro del texto del escrito. Nadie analiza el borrador frase por frase, y una cifra inventada en la pantalla donde se decide firmar sería la peor falsa alarma. Lo que se marca es lo que sí se sabe: el estado de la ficha contra la que se redactó.'
    }
  ]
};

const A_VERIFICAR: ManualArticle = {
  id: 'verificar',
  titulo: 'Verificar contra la norma',
  entradilla:
    'Qué significa exactamente verificar una ficha, y por qué se hace una sola vez para toda la firma.',
  bloques: [
    { kind: 'ruta', camino: ['Catálogo', 'Ficha de la actuación', '«Guardar verificación»'] },
    {
      kind: 'parrafo',
      texto:
        'Verificar es abrir el texto oficial de la norma, comprobar que el término y la autoridad que la ficha publica son los que ese artículo fija, y firmar esa comprobación con su nombre y la fecha. Queda guardado para la firma entera: el siguiente escrito de cualquier compañero ya sale con el término verificado.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Catálogo» y escriba el nombre de la actuación o de la norma en «Buscar actuación o norma». Puede acotar con el selector de rama, que arranca en «Todas las ramas».',
        'Pulse la actuación. A la derecha se abre la ficha con sus tres bloques —término, norma, autoridad— y debajo el formulario de «Curaduría de su firma».',
        'Abra la fuente oficial que la ficha cita y localice el artículo. Compruebe por separado el término, el artículo que lo fija y la autoridad ante la que se surte.',
        'En el formulario elija una de tres opciones: «Tiene término» si la norma fija un plazo y lo leyó en su texto, «No caduca» si la norma no fija ninguno, o «Sin verificar» si no pudo comprobarlo.',
        'Si tiene término, escríbalo en «Término, como lo dice la norma», pegue la dirección oficial en «Fuente donde lo verificaste», cite el artículo en «Fundamento normativo» y ponga su nombre en «Quién verifica». «Nota interna» es opcional.',
        'Pulse «Guardar verificación». Desde ese momento la ficha aparece como verificada por su firma en todos los escritos. Si se equivocó, «Revertir» descarta la verificación de la firma y vuelve al catálogo base.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Verifique primero las actuaciones que su firma redacta cada semana y déjelas listas: son las que más escritos limpian de un solo golpe. La lista de «Sin verificar» del catálogo es larga; la de las que usted usa, corta.'
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
    { kind: 'ruta', camino: ['Redacción', '«Qué debe hacer este escrito»'] },
    {
      kind: 'parrafo',
      texto:
        'El cuadro «Qué debe hacer este escrito» espera hechos, no redacción. Escriba lo que pasó, en qué orden, quién es quién, qué pide y contra quién. La estructura del escrito no sale de ahí: sale de la actuación que usted escogió en «Tipo de documento».'
    },
    {
      kind: 'pasos',
      pasos: [
        'Empiece por las fechas concretas. Son las que sostienen el cómputo del término y las que el escrito va a citar.',
        'Siga con las partes: nombres, calidades y, si el proceso ya existe, el radicado y el despacho.',
        'Diga la pretensión como pretensión: qué quiere que el juez ordene.',
        'Incluya los hechos que le incomodan. Un borrador que no los conoce los omite, y esa omisión la descubre la contraparte.',
        'Genere con «Generar escrito» o con ⌘↵ / Ctrl+↵. Si el resultado necesita ajustes, vuelva al cuadro, añada lo que faltó y genere de nuevo, o corrija el texto a mano con «Editar» sobre el papel.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que no hace falta' },
    {
      kind: 'lista',
      items: [
        'Fórmulas de encabezado, invocaciones y despedidas: las pone el escrito.',
        'Pedir un tono o un formato. La tipografía, el membrete y la numeración vienen de «Membrete», la configuración de su firma.',
        'Citar la norma de memoria. Si el catálogo la tiene verificada, entra por sí sola; si no la tiene, citarla de memoria es exactamente lo que hay que evitar.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'No vuelva a teclear lo que ya está transcrito: en una audiencia, el botón «Usar en redacción» copia el transcrito a este cuadro; en una entrevista, «Tomar el caso y redactar» lo trae aquí con los hechos del cliente. Lo dicho en la sala es el material del siguiente escrito.'
    },
    {
      kind: 'aviso',
      texto:
        'Los archivos que adjunte con «Adjuntar sentencias o pruebas» todavía no se leen: se listan y nada más, y el propio panel lo dice. Si un hecho está en un anexo y no en el cuadro de texto, el escrito no lo va a conocer.'
    },
    {
      kind: 'nota',
      titulo: 'Continuar un borrador',
      texto:
        'Si abre un borrador guardado desde «Borradores» o desde «Mis borradores», el cuadro deja de pedir hechos y pasa a pedir qué corregir, continuar o ampliar. La pantalla se lo dice arriba del cuadro, con el tamaño del borrador que está continuando.'
    }
  ]
};

const A_EXPORTAR: ManualArticle = {
  id: 'exportar',
  titulo: 'Revisar y exportar a Word o PDF',
  entradilla: 'Qué mirar antes de exportar, y qué diferencia hay entre los dos formatos.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', 'Cabecera', '«Word» · «PDF»'] },
    {
      kind: 'parrafo',
      texto:
        'Los botones de exportar viven en la cabecera de Redacción, a la derecha, cuando la pestaña «Documento» está activa: «Copiar», «Word», «PDF» y una flecha con las opciones de exportación.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Lea el escrito completo. Es un borrador, y la lectura es corta precisamente porque el estado de la ficha está marcado arriba del papel.',
        'Mire la barra sobre el papel: si hay un chip «Término sin verificar» o «Sin catalogar», decida antes de exportar si verifica la ficha en Catálogo, cambia el dato a mano o lo asume.',
        'Compruebe los datos que solo usted conoce: nombres, radicado, cuantía, direcciones de notificación. Para corregirlos, pulse «Editar» en la esquina del papel y luego «Ver» para volver al formato.',
        'Abra la flecha junto a «PDF» si quiere cambiar cómo sale: bajo «Al exportar» está la casilla «Membrete de la firma» y, solo cuando el escrito trae fuentes, la casilla para anexarlas.',
        'Pulse «Word» para seguir editando en su procesador, o «PDF» para radicar o archivar como quedó.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'Los dos formatos salen con el membrete, la tipografía, el interlineado y la numeración de hechos y de títulos que su firma tenga configurados, y el PDF numera las páginas con el total real. El membrete imprime solo lo que su firma escribió en Membrete: sin NIT no aparece la palabra NIT, sin correo no hay correo. Si no ha configurado nada, el escrito lleva únicamente el nombre de la firma y su NIT si lo tiene. El documento no lleva ninguna marca de Iureon: lo que se radica es de su firma.'
    },
    {
      kind: 'consejo',
      texto:
        'Exporte a Word cuando alguien más de la firma vaya a seguir corrigiendo, y a PDF solo la versión que se radica. Así el PDF que queda en el expediente es siempre el texto final y no una versión intermedia.'
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
    { kind: 'ruta', camino: ['Redacción', '«Guardar»', 'Borradores'] },
    {
      kind: 'parrafo',
      texto:
        'Desde el taller puede guardar el escrito en curso. «Borradores», en la barra lateral, los reúne todos con el término de la actuación a la que pertenecen, para que saber qué vence esta semana no obligue a entrar a redactar.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Con el escrito generado, pulse «Guardar» al pie del papel. Queda a nombre de quien lo creó, que sale de su sesión y no de un campo que se pueda escribir.',
        'Abra «Borradores» en la barra lateral. La tabla «Borradores guardados» muestra escrito, término, versión, estado y última edición; puede filtrar con «Buscar por cliente, radicado o actuación» y por rama.',
        'Abra el menú de acciones de una fila: «Abrir» lo lleva de vuelta al taller para continuarlo; «Duplicar» crea una copia; «Marcar radicado» lo saca de los que vencen; «Eliminar» lo borra. Ningún borrador se borra solo.',
        'Complete los datos del proceso en la ficha del borrador —«Cliente o parte», «Despacho», «Radicado», «Vence el»— y su estado: Borrador, Revisar, Listo o Radicado. Son los datos por los que después lo va a encontrar.',
        'Cuando lo abra en el taller, el cuadro de instrucción pasa a pedir qué corregir o ampliar, y «Mis borradores» al pie del papel abre la misma lista sin salir de Redacción.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Marque «Radicado» el mismo día que radica. Un borrador radicado ya no se continúa —solo se consulta y se duplica— y deja de aparecer entre los que vencen, que es lo que hace útil la lista.'
    },
    {
      kind: 'lista',
      items: [
        'El término que se muestra es el de la actuación catalogada. Si esa ficha no está verificada, el borrador lo hereda y lo dice.',
        'Cuando otro abogado de su firma crea o edita un borrador, usted recibe un aviso si activó los avisos en su aparato (véase «Iureon en el teléfono»).'
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
    { kind: 'ruta', camino: ['Entrevistas', '«Cliente de la entrevista»', '«Grabar la entrevista»', '«Cerrar la entrevista»'] },
    {
      kind: 'parrafo',
      texto:
        'Una entrevista es una transcripción atada a un cliente. El cliente se identifica por su cédula, que es única dentro de su firma y no se puede cambiar después: es la llave por la que la firma vuelve a encontrar a esa persona.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Entrevistas». En el panel «Cliente de la entrevista» busque al cliente por su cédula o pulse «Nuevo cliente» y escriba nombre completo y cédula; correo y celular son opcionales.',
        'Tenga a la vista «Lo que no puede quedarse sin preguntar»: cuatro preguntas cuya respuesta define un término o cierra una prueba —la fecha exacta del hecho, cuándo lo notificaron, si hubo recurso o reclamación antes, y qué documentos tiene hoy—. Debajo de cada una dice qué se pierde si no se pregunta.',
        'Marque la casilla «Le informé que la entrevista se graba y lo autorizó». Es un paso bloqueante y está ahí a propósito: la voz es un dato biométrico y la hora del clic queda registrada.',
        'Pulse «Grabar la entrevista». Puede «Pausar» y «Reanudar», y la onda del micrófono se ve mientras graba. Al terminar, pulse el botón de detener y transcribir. Si ya tiene el audio, use «O sube una grabación que ya tengas».',
        'Espere las dos etapas, que se ven por separado: «Enviando la grabación…» y «Transcribiendo…». El audio va del navegador al almacenamiento sin pasar por nuestros servidores, y se borra apenas se devuelve el transcrito.',
        'Corrija el transcrito con las mismas herramientas de una audiencia: haga clic en el texto para editarlo, «Dividir» donde hablan dos personas, «Otra voz» para entregar una intervención completa a quien la dijo, y ponga nombre y rol a cada voz en «Interlocutores».',
        'Al terminar de transcribir, las cuatro preguntas se tachan solas con lo que quedó dicho. Es una ayuda de memoria, no una comprobación: que una quede tachada no garantiza que la respuesta sirva, y que quede sin tachar no significa que no se habló del tema.',
        'Pulse «Cerrar la entrevista» y decida: «Tomar el caso y redactar» lo lleva a Redacción con los hechos; «Declinar el caso» exige elegir un motivo. Confirme.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Registre al cliente antes de que llegue a la oficina. Con la ficha creada, la entrevista empieza en la casilla de autorización y no en un formulario, y la segunda entrevista del mismo cliente ya encuentra su historial.'
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
        'A partir de lo que dijo el cliente —no de la entrevista entera, que es en su mayoría el abogado— la pantalla sugiere «Jurisprudencia relacionada» del corpus. Si el corpus no cubre el tema, calla y lo explica en vez de ofrecer providencias apenas parecidas. No hay doctrina: son providencias, y la pantalla también lo dice.'
    },
    {
      kind: 'aviso',
      texto:
        'Si declina el caso antes de transcribir, «Constancia» exporta el acta de la reunión sin transcrito: dice quién estuvo, cuándo y que autorizó la grabación, y declara que no hay transcrito. Un acta que prometa un transcrito que no existe sería peor que ninguna.'
    }
  ]
};

const A_AUDIENCIA: ManualArticle = {
  id: 'audiencia',
  titulo: 'Subir el audio de una audiencia',
  entradilla: 'Las cuatro herramientas de corrección, y cuál usar según qué salió mal.',
  bloques: [
    { kind: 'ruta', camino: ['Audiencias', '«Subir audio»', '«Transcribir»', '«Interlocutores»'] },
    {
      kind: 'parrafo',
      texto:
        'La transcripción separa a los interlocutores y le propone un rol para cada voz cuando encuentra en el propio audio la frase que lo justifica —quien reparte la palabra es el juez, el juramento marca al testigo—, siempre citando el minuto y la frase. Nunca asigna sola: si no hay señal clara, la voz queda como desconocida.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Audiencias» y pulse «Subir audio». En el diálogo «Subir audio de audiencia» arrastre el archivo o haga clic para buscarlo, y escriba en «Proceso al que pertenece» el juzgado, las partes y el radicado: ese contexto se le entrega al motor antes de oír.',
        'Pulse «Transcribir». Mientras el archivo viaja al almacenamiento el botón muestra el porcentaje enviado, y después dice «Transcribiendo…»: son dos esperas distintas y las dos se ven.',
        'Abra el transcrito desde «Audiencias de la firma». En «Roles sugeridos» revise cada propuesta con su frase y su minuto; en «Interlocutores» ponga nombre y rol a cada voz una sola vez, y el nombre se aplica a todas sus intervenciones.',
        'Corrija con la herramienta que corresponda al error (abajo se explica cuál). Cada corrección se guarda en el servidor al instante.',
        'Marque «Marcar revisada» en las intervenciones que ya leyó y «Marcar hecho clave» en las que deciden el caso: esas son las que entran al acta.',
        'Cuando la haya leído completa, en la lista de audiencias elija «Marcar acta lista». Hasta entonces queda «Por revisar»; esa marca es de una persona, no del motor.',
        'Exporte el acta con «Word» (el que se edita) o «PDF» (el que se anexa al expediente), o pulse «Usar en redacción» para llevar lo dicho como hechos al taller.'
      ]
    },
    { kind: 'subtitulo', texto: 'Qué herramienta usar' },
    {
      kind: 'lista',
      items: [
        'Editar — una palabra mal transcrita. Haga clic en el texto, corríjalo y pulse Enter; Esc descarta.',
        '«Dividir» — dos personas quedaron en un mismo renglón. Parte la intervención donde tiene el cursor y le pregunta de quién es la mitad cortada.',
        '«Otra voz» — la intervención completa está atribuida a quien no es. Se la entrega a otra voz, y el rol viaja con el destino.',
        'Asignar rol en «Interlocutores» — la voz está bien separada pero mal identificada. Nombra al interlocutor en todas sus intervenciones.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Corrija con la grabación sonando: «Escuchar la grabación» reproduce la copia que quedó en su navegador mientras dure la pestaña. Los fragmentos que el motor oyó con poca seguridad quedan marcados en el propio texto, solo en el tramo afectado: empiece por esos.'
    },
    {
      kind: 'aviso',
      texto:
        'Cuando dos personas hablan encima, la separación de voces no las distingue y ambas caen en un mismo bloque. No es una configuración: hay que cortar primero con «Dividir» y después asignar. Si la aplicación le avisa que bajo una misma voz aparecen dos nombres, es exactamente este caso.'
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
    { kind: 'subtitulo', texto: 'El resumen y los hechos relevantes' },
    {
      kind: 'parrafo',
      texto:
        'Sobre una audiencia o una entrevista transcrita, el recuadro «Resumen y hechos relevantes» tiene un botón «Generar»: unas frases sobre qué se trató y una lista de hechos dichos, cada uno con el minuto y quién lo dijo. Extrae lo que se dijo, no conclusiones jurídicas, y si el transcrito no trae hechos relevantes lo dice en vez de inventarlos. Se genera una vez y queda guardado; reabrirla mañana no lo vuelve a generar. Cuesta $50 del saldo cada vez que se pulsa «Generar» o «Regenerar»; transcribir no cuesta.'
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
        'El catálogo llega con las actuaciones y los términos que trae el producto. Encima de eso, cada firma guarda su propia curaduría: cuando un abogado verifica un término, esa verificación vale para su firma y para todos los escritos que vengan después. Se hace dentro del producto, no editando código: esa es la diferencia entre validar cada documento —el trabajo que la aplicación existe para eliminar— y validar el conocimiento una sola vez.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Decida en la firma quién cura. Verificar es firmar con nombre y fecha; conviene que lo hagan quienes van a responder por ese término.',
        'En «Catálogo», filtre por la rama que la firma litiga y recorra las actuaciones marcadas «Sin verificar». El chip de cada fila dice su estado sin abrirla.',
        'Abra cada ficha y lea sus tres bloques. Una ficha puede estar verificada en el término y coja en la autoridad; el bloque de autoridad es el que manda al abogado a radicar ante quien no es.',
        'Complete «Curaduría de su firma» como se explica en «Verificar contra la norma» y pulse «Guardar verificación».',
        'Revise en «Seguridad» la auditoría: cada verificación queda como «Verificó actuación», con quién y cuándo.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Cuando una actuación exista con el mismo nombre en dos ramas —los recursos de reposición, apelación, queja y súplica tienen plazos distintos en el CGP y en el CPACA—, cure las dos fichas: la aplicación siempre busca con la rama y rechaza una etiqueta ambigua en vez de adivinar.'
    },
    {
      kind: 'lista',
      items: [
        'Hay actuaciones transversales, como el derecho de petición, que aparecen en todas las ramas siendo una sola ficha. Corregirla la corrige en todas partes.',
        'Verificar exige la fuente. Un término sin fuente no se puede registrar como verificado.',
        '«Revertir» descarta la curación de la firma y deja la ficha como venía de fábrica.'
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
    { kind: 'ruta', camino: ['Barra lateral', '«Plan»', '«Plan de la firma»', '«Contratar»'] },
    { kind: 'subtitulo', texto: 'Tres planes' },
    {
      kind: 'lista',
      items: [
        'Esencial: $85.000 al mes o $850.000 al año. Un usuario. Incluye Redacción, Borradores, Revisiones, Buscador, Catálogo, Herramientas, Manual, Soporte y Membrete. No incluye Audiencias, Entrevistas ni Orientación.',
        'Premium: $120.000 al mes o $1.200.000 al año. Hasta cinco usuarios. Incluye todos los módulos.',
        'Firma: $250.000 al mes o $2.500.000 al año. Hasta quince usuarios. Incluye todos los módulos.'
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
        'Pulse «Plan» en el pie de la barra lateral, junto a «Saldo». En el teléfono, abra «Más» y, bajo «Cuenta», toque «Plan de la firma».',
        'Arriba, «Plan actual» muestra el plan vigente y hasta cuándo. Debajo, en «Elija el plan», cambie el interruptor entre «Mensual» y «Anual»; el anual lleva la etiqueta «2 meses gratis».',
        'En la tarjeta del plan pulse el botón, que dice «Contratar Esencial mensual», «Renovar Premium anual» o la combinación que haya elegido. Dice «Renovar» cuando es el plan que ya tiene.',
        'La aplicación abre la pasarela de Wompi con el valor ya fijado; pague con PSE, tarjeta o los medios que ofrezca.',
        'Cuando la pasarela confirma, el plan se extiende solo y el pago aparece en la tabla «Pagos del plan», con fecha, plan, periodo cubierto, valor y quién pagó.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Pague antes de la fecha de vencimiento, no después: cada pago suma su periodo a la fecha vigente, así que pagar el 10 un plan que vence el 20 deja el plan hasta el 20 del mes siguiente. No se pierde ni un día.'
    },
    {
      kind: 'nota',
      titulo: 'Solo un administrador paga',
      texto:
        'Si su cuenta no es de administrador, la tarjeta dice «Solo un administrador de la firma puede pagar el plan» en lugar del botón. Si cambia de plan al pagar, el plan nuevo rige desde ese pago; no hay prorrateo. No se guarda tarjeta ni se cobra automáticamente: cada periodo se paga con un checkout nuevo.'
    },
    { kind: 'subtitulo', texto: 'Qué pasa al vencer' },
    {
      kind: 'parrafo',
      texto:
        'Siete días antes, los administradores ven una franja arriba de la aplicación con la fecha. Al vencer, todos los roles ven una franja roja de «solo lectura» y la aplicación deja de crear o modificar trabajo: Redacción, Orientación, Buscador, Catálogo y Herramientas quedan cubiertos con un aviso, y en Borradores, Revisiones, Audiencias y Entrevistas desaparecen los botones de redactar, revisar, subir audio y grabar. El servidor rechaza cualquier guardado, edición o eliminación con el mismo mensaje. Sigue abierto todo lo que ya tiene: entrar, abrir y leer borradores, informes y transcritos, exportarlos a Word y PDF, el Manual, Soporte, Ajustes y la pantalla del plan para pagar. El saldo de recargas no se pierde. Al pagar, todo vuelve en el acto.'
    },
    {
      kind: 'aviso',
      texto:
        'En el plan Esencial, Audiencias, Entrevistas y Orientación no aparecen en la barra, y crear una segunda cuenta responde que el plan admite una sola. Pasar a Premium habilita las tres pantallas y hasta cinco cuentas desde el momento del pago; Firma, las mismas pantallas y hasta quince cuentas.'
    },
    {
      kind: 'nota',
      titulo: 'Cuenta de cobro y correo de confirmación',
      texto:
        'Cada pago del plan queda en «Pagos del plan», dentro de la misma pantalla, con el botón «Cuenta de cobro» que descarga el soporte en PDF: emisor, firma, concepto, periodo cubierto, valor y referencia de Wompi, sin discriminar IVA. No es factura electrónica de la DIAN, y el documento lo dice. Si la plataforma tiene el correo configurado, quien pagó recibe además un correo de confirmación con la cuenta de cobro adjunta; las recargas de saldo también se confirman por correo.'
    }
  ]
};

const A_ROLES_SALDO: ManualArticle = {
  id: 'roles-saldo',
  titulo: 'Roles y saldo',
  entradilla: 'Quién puede hacer qué dentro de la firma, y cómo se consume y se recarga el saldo.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', '«Saldo»', '«Recargar»', '«Pagar»'] },
    { kind: 'subtitulo', texto: 'Roles' },
    {
      kind: 'parrafo',
      texto:
        'Un rol no es una etiqueta: se impone en el servidor, en cada petición. La administración de la firma —dar de alta compañeros, cambiar roles, recargar, pagar el plan, autorizar el guardado del taller— corresponde al administrador; redactar, transcribir y consultar, a todos.'
    },
    { kind: 'subtitulo', texto: 'Qué consume saldo' },
    {
      kind: 'lista',
      items: [
        'Los escritos generados y las revisiones de un escrito ya redactado, con un precio que se muestra en el propio botón.',
        'Cada mensaje a la guía del taller ($300) y cada «Volver a revisar» ($2.000).',
        'El resumen de una audiencia o entrevista ($50 cada vez que se genera o regenera).',
        'Las orientaciones que pasen del cupo diario gratuito de la firma.',
        'Transcribir no consume saldo.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'El saldo se reserva antes de llamar al modelo, no se cobra después: si no alcanza, se lo dicen antes de empezar, y si el trabajo falla, la reserva se devuelve. El saldo también fija cuánto puede extenderse un escrito, para que nunca reciba uno cortado por una regla que no conocía.'
    },
    { kind: 'subtitulo', texto: 'Cómo se recarga' },
    {
      kind: 'pasos',
      pasos: [
        'Pulse «Saldo» en el pie de la barra lateral. En el teléfono, «Más» y luego «Saldo y recarga».',
        'Arriba está el disponible, el consumo del mes —escritos, transcripciones y orientaciones— y, con el consumo real de su firma, aproximadamente cuántos escritos alcanza.',
        'En «Recargar» escriba el monto (el mínimo aparece en el propio campo) y pulse «Pagar». Se abre la pasarela de Wompi, donde paga con PSE, tarjeta o los medios que ofrezca.',
        'Cuando la pasarela confirma, el saldo se acredita y el movimiento aparece en «Movimientos», con fecha, concepto, usuario, valor y saldo resultante.',
        'Para conciliar con contabilidad, baje a «Extracto», elija el mes y pulse «Imprimir comprobante»: se abre la impresión del navegador; en el teléfono, elija «Guardar como PDF».'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Recargue una vez al mes un monto grande en vez de varios pequeños: la pasarela cobra una parte fija por transacción, así que la misma plata rinde más en una recarga que en cinco. La cifra de «≈ N escritos» le dice cuánto le va a durar.'
    },
    {
      kind: 'parrafo',
      texto:
        'El extracto muestra el saldo inicial, las entradas, las salidas por concepto —escritos, resúmenes, orientaciones— y el saldo final, sumados por el servidor sobre el mismo libro que la tabla de movimientos. El comprobante lleva el nombre y el NIT de la firma, el período y el detalle línea por línea. Cada consumo aparece con el título del escrito o de la grabación que lo causó y con el correo de quien lo pidió.'
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
        'Si Iureon le acredita saldo directamente —una compensación por un borrador fallido, por ejemplo—, esa recarga la hace el operador desde su consola, con un motivo escrito que queda en la auditoría de su firma («Acreditó saldo», en «Seguridad») con el correo de quien la hizo. Es la única forma en que el saldo se mueve sin que su firma pague.'
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
  entradilla:
    'Suba la tutela, la demanda o el recurso que ya escribió y pregunte qué está bien, qué está mal y qué corregir. Después, corríjalo en el taller con el revisor al lado.',
  bloques: [
    { kind: 'ruta', camino: ['Redacción', '«Revisar un escrito ya redactado»', '«Abrir en el taller»'] },
    {
      kind: 'parrafo',
      texto:
        'La revisión es un informe, no un borrador: juicio global, secciones que la norma exige y faltan, fortalezas, debilidades, errores de aplicación con su corrección, citas textuales del escrito con la frase que las reemplazaría y recomendaciones. Separa dos planos y lo dice en cada punto: lo que exige la norma, que sale de la ficha del catálogo y se cita con artículo, y lo que es criterio profesional del revisor, que usted pesa. No cita sentencias: cuando un punto necesite precedente, lo señala para que usted lo verifique.'
    },
    { kind: 'subtitulo', texto: 'Pedir el informe' },
    {
      kind: 'pasos',
      pasos: [
        'En «Redacción», elija arriba la actuación en «Tipo de documento»: la revisión objetiva se hace contra su ficha verificada. Sin actuación, el diálogo dice «Falta elegir la actuación».',
        'Debajo de los adjuntos pulse «Revisar un escrito ya redactado».',
        'Use «Subir PDF, Word o texto (hasta 15 MB, con anexos)» o pegue el texto en el cuadro. Indique el cliente o proceso en el campo de referencia y escriba en «Qué quiere saber» lo que le preocupa.',
        'Pulse «Revisar», que muestra el precio. Cuesta lo mismo que un borrador y se descuenta del saldo de la firma; si el revisor no responde, no se cobra.',
        'Lea el informe. Puede descargarlo en «Word» o «PDF» con la letra de la firma, o «Copiar informe» como texto. Queda en «Revisiones anteriores», dentro del mismo diálogo, con el cliente, la actuación, el archivo, la fecha y quién lo pidió.'
      ]
    },
    { kind: 'subtitulo', texto: 'Corregir en el taller' },
    {
      kind: 'pasos',
      pasos: [
        'Con el informe en pantalla pulse «Abrir en el taller». El escrito aparece con los pasajes citados tachados; también se llega desde el módulo «Revisiones» de la barra lateral, y desde Redacción el botón «Taller» sobre cualquier escrito generado abre el mismo taller con la guía, sin informe previo.',
        'Toque un pasaje tachado: verá «Por qué» falla y el «Reemplazo propuesto», con un botón «Aplicar» que lo sustituye en el texto. En «Editar» corrige a mano; «Con marcas» vuelve a la vista marcada.',
        'A la derecha, en la pestaña «Guía», pregunte o pida redacciones —«reescribe la pretensión tercera como subsidiaria», «¿cómo va después de mis cambios?»—. Cada mensaje lleva el texto tal como está en ese momento, cuesta $300 y, si propone cambiar un pasaje, trae su propio «Aplicar».',
        'Seleccione texto para marcarlo: aparecen Amarillo, Verde, Azul, Rosa y Tachar, y el botón «Comentar» para dejar una nota sobre el pasaje. Las marcas se anclan a las palabras y sobreviven a las ediciones; doble clic las quita, y «Limpiar» quita todas las suyas sin tocar los comentarios.',
        'Pulse «Guardar versión» cuando quiera un punto de retorno. La pestaña «Versiones» compara cualquiera con el texto actual —lo quitado en rojo, lo añadido en verde— y la restaura si la de antes era mejor. Se conservan las últimas quince; también se guarda una sola antes de cada revisión nueva y de cada consulta si el texto cambió.',
        'Cuando el texto esté corregido, «Volver a revisar» emite un informe nuevo ($2.000) sobre el texto tal como está. Descargue el resultado con «Word» o «PDF»: sale con el membrete de la firma.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Sus marcas y sus comentarios viajan a la guía con cada mensaje. Resalte en amarillo lo que duda y escríbale «revisa lo que resalté en amarillo», o deje un comentario y pídale «mira mi comentario sobre la jurisprudencia»: responde a esa nota, y si el comentario la corrige, lo tiene en cuenta o explica por qué no.'
    },
    {
      kind: 'lista',
      items: [
        'Cuando la guía responde, los pasajes de los que habla se subrayan en azul.',
        '«Ocultar guía» deja el papel a todo lo ancho y «Pantalla completa» quita el resto de la aplicación; Esc sale.',
        'El control «A − +» del taller, del borrador de Redacción y de los transcritos agranda o reduce la letra en pantalla, del 85 % al 200 %; tocar el porcentaje vuelve al tamaño normal. Es solo para leer: no cambia el tamaño del documento, que sigue siendo el de Membrete en el PDF y el Word, y cada pantalla recuerda el suyo en ese navegador.'
    ]
    },
    {
      kind: 'nota',
      titulo: 'Si la guía niega una sentencia que sí existe',
      texto:
        'Cada vez que usted nombra una sentencia de la Corte Constitucional en el chat o en un comentario —por su tipo, número y año, como la escribe siempre—, la aplicación la consulta en el índice oficial de la Corte antes de que la guía responda, y le entrega el resultado con la fuente y un extracto del texto oficial. Ese resultado manda sobre la memoria del modelo: si la guía había dicho que no existía, debe reconocerlo y corregir con base en el extracto. Si el índice no la tiene, la guía se lo dice así, con la fuente, y le sugiere revisar número y año; si el índice no respondió, lo dice y no la da ni por existente ni por inexistente. Las providencias de la Corte Suprema, del Consejo de Estado y de tribunales no se verifican por esta vía: la guía debe pedirle la fuente o el radicado en vez de afirmar o negar que existan.'
    },
    {
      kind: 'aviso',
      texto:
        'Retomar otro día requiere autorización de la firma. El texto de trabajo y la conversación se conservan en el servidor solo si un socio administrador pulsa «Autorizar guardado para la firma», una vez, para toda la firma; queda en la auditoría con su correo. Sin esa autorización el taller funciona igual, pero al cerrar la pestaña se pierden el texto y la conversación —el informe sí queda— y la cinta de arriba lo advierte. La autorización se da desde esa cinta o desde la cabecera de «Revisiones», donde siempre se ve si está dada, quién la dio y cuándo, y donde «Retirar autorización» la revoca.'
    },
    {
      kind: 'nota',
      titulo: 'Qué queda guardado y qué no',
      texto:
        'El informe queda guardado para su firma. El escrito revisado se conserva únicamente si la firma autorizó el taller; si no, se lee, se revisa y se descarta en la misma petición. En la auditoría de la firma queda que se revisó un escrito de tal actuación, nunca su contenido. Un PDF escaneado es una imagen y no trae texto: la aplicación se lo dirá y tendrá que pegar el texto. Se lee el documento completo hasta 300.000 caracteres, unas 75 páginas; solo si el escrito es más largo el informe declara que fue recortado.'
    }
  ]
};

const A_DATOS_CLIENTE: ManualArticle = {
  id: 'datos-cliente',
  titulo: 'Qué responder si su cliente pregunta por sus datos',
  entradilla: 'La posición jurídica de cada quien, dicha en el orden en que se pregunta.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', 'Administrar', '«Privacidad»'] },
    {
      kind: 'parrafo',
      texto:
        'Su firma es la responsable del tratamiento de los datos de su cliente. Iureon es su encargado. Los proveedores que Iureon usa para prestar el servicio son, por eso, subencargados de su firma, y usted tiene derecho a saber cuáles son y qué recibe cada uno.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Despliegue «Administrar» en la barra lateral y abra «Privacidad». La pantalla se titula «Privacidad y seguridad» y arranca por quién es responsable y quién encargado.',
        'Lea la tabla de subencargados: por cada proveedor dice qué recibe, dónde se procesa y cuánto lo conserva, y debajo la base de transferencia con la que el dato sale del país. Nadie la mantiene a mano: se deriva de la configuración que está corriendo.',
        'Si el cliente pregunta por su grabación, responda con «Lo que nunca ocurre», al pie: el audio no se conserva —se borra del almacenamiento en la misma petición que devuelve el transcrito—, el transcrito sí se guarda dentro de su firma y solo su firma lo ve.',
        'Si pregunta quién más puede leer el caso: la consola de operación de Iureon gestiona firmas, planes y saldos, y no puede abrir un transcrito, un borrador ni un expediente. Si soporte necesita ver algo, lo pide por el acceso de soporte, que un socio autoriza o niega con botones del mismo peso, y «No autorizar» no afecta el servicio.',
        'Para demostrar quién hizo qué, abra «Seguridad»: ahí está la auditoría de la firma, con cada escrito generado, cada transcripción, cada verificación y cada acceso.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Responda a su cliente desde la pantalla, no de memoria: la lista de proveedores puede cambiar con la configuración, y lo que la pantalla muestra hoy es lo que está corriendo hoy.'
    },
    {
      kind: 'aviso',
      texto:
        'WhatsApp queda fuera de ese acuerdo. No envíe por ahí datos de sus clientes ni documentos del caso, aunque escriba a soporte. La misma regla vale para el chat de soporte dentro de la aplicación: describa el problema, no pegue el caso.'
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
        'Soporte es un chat que queda guardado en su cuenta y que responde el operador de la plataforma en horario laboral. No hay tiempo de respuesta garantizado ni cola de prioridad. Lo ven todos los abogados de su firma y cada mensaje queda en su auditoría, no en un canal externo.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Soporte» en la barra lateral, bajo «Aprender». En el teléfono está en «Más».',
        'En «Nueva conversación» escriba el «Asunto» en una línea —qué pasa y en qué pantalla— y el «Mensaje». Si tiene un término que vence hoy o mañana, dígalo en la primera línea.',
        'Pulse «Abrir conversación». Aparece en «Sus conversaciones con soporte» como «Abierta»; cuando el operador la cierre, dirá «Cerrada».',
        'Vuelva a la conversación para leer la respuesta y contestar: Enter envía, Shift+Enter salta de línea. Si activó los avisos en su aparato, la respuesta le llega como notificación.',
        'Desde cualquier artículo de este manual, «Escribir a soporte» lo trae aquí.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Diga en el asunto la pantalla y el botón exactos, y en el mensaje qué esperaba y qué ocurrió. El operador no ve su pantalla ni su material: cuanto más precisa la descripción, menos vueltas.'
    },
    {
      kind: 'aviso',
      texto:
        'No pegue en el chat datos de sus clientes ni documentos del caso. Soporte no ve su material por escribirle; si hace falta verlo, se pide por el acceso de soporte, que autoriza un socio, es de solo lectura, dura un tiempo fijo, deja rastro de cada pantalla abierta y se puede revocar.'
    },
    {
      kind: 'nota',
      titulo: 'WhatsApp',
      texto:
        'Si la firma tiene un número de WhatsApp de soporte configurado, aparece en la misma pantalla como enlace, con el nombre de su firma y el correo de su cuenta ya escritos en el mensaje. Si no hay número configurado, la pantalla lo dice en vez de mostrar un botón que no hace nada. Desde WhatsApp nadie puede entrar a su cuenta: cualquier acceso se autoriza dentro de la aplicación.'
    }
  ]
};

const A_FORMATO: ManualArticle = {
  id: 'formato',
  titulo: 'Formato, membrete y tipografía',
  entradilla: 'Cómo se configura la marca de la firma y hasta dónde llega su efecto.',
  bloques: [
    { kind: 'ruta', camino: ['Barra lateral', '«Membrete»', '«Guardar y aplicar»'] },
    {
      kind: 'parrafo',
      texto:
        'La marca de la firma es una sola y vale para todos los documentos: no se elige letra escrito por escrito, porque la letra es de la firma, no del documento. Lo que se guarde en Membrete se ve en el escrito en pantalla y sale igual en el Word y el PDF.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Pulse «Membrete» en el pie de la barra lateral. Se abre la configuración de la marca con una vista previa del escrito a la derecha, que reacciona a cada cambio.',
        'Suba el logo con «Subir logo» (PNG o SVG con fondo transparente) y complete «Razón social», «NIT», «Pie de página» —la dirección que va al pie del membrete—, «Teléfono», «T.P. del abogado que firma» y «Correo de notificaciones judiciales». Si quiere que la firma escaneada salga en el documento, súbala en «Firma escaneada».',
        'Elija la «Tipografía» entre nueve: las clásicas de juzgado —Times New Roman, Arial, Calibri, Tahoma, Inter— y las libres —Plus Jakarta Sans, Manrope, Public Sans y Satoshi—. Debajo de la lista, la pantalla le dice cómo se comporta cada una en Word y en PDF.',
        'Fije «Tamaño», «Interlineado» (1,0 · 1,5 · 2,0), «Numeración de hechos» («1. 2. 3.» o «PRIMERO.») y «Títulos de sección» («I. Romanos», «1. Arábigos» o «Sin numerar»).',
        'Pulse «Guardar y aplicar». Desde ese momento el formato viaja al motor de redacción como instrucción: el escrito nace ya con la numeración y los títulos que su firma usa, en vez de quedar maquillado al final.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Si sus escritos van a un despacho que los recibe en Word, prefiera una clásica: está en todo equipo con Office y se ve igual en el suyo y en el del juzgado. Las libres van incrustadas en el PDF y se ven igual en todas partes, pero en Word dependen de que quien abra el archivo las tenga instaladas.'
    },
    {
      kind: 'lista',
      items: [
        'Times New Roman sale en el PDF con Times, su equivalente estándar; Arial, Calibri, Tahoma e Inter salen con Helvetica, porque no se pueden incrustar sin licencia.',
        'El membrete con el logo, la tipografía elegida, la fecha y la paginación real salen en el PDF del escrito.',
        'El acta de audiencia usa su propio formato de acta y también sale en Word y en PDF.',
        'Ni el Word ni el PDF llevan marca de Iureon.'
      ]
    },
    {
      kind: 'nota',
      titulo: 'Si el documento no sale con su membrete',
      texto:
        'Compruebe primero que la marca esté guardada, después que la casilla «Membrete de la firma» esté marcada en las opciones de exportación de Redacción, y por último el sello de versión del pie de la barra lateral: una pestaña que lleva días abierta exporta con el código que cargó ese día.'
    }
  ]
};

const A_MOVIL: ManualArticle = {
  id: 'movil',
  titulo: 'Iureon en el teléfono',
  entradilla:
    'Cada módulo tiene su pantalla pensada para el teléfono. No es la de computador apretada: es otra, con lo que se hace de pie.',
  bloques: [
    { kind: 'ruta', camino: ['Barra inferior', '«Redactar» · «Orientar» · «Grabar» · «Más»'] },
    {
      kind: 'parrafo',
      texto:
        'Abajo hay una barra con cuatro puertas: «Redactar», «Orientar», «Grabar» y «Más». Arriba, el nombre del módulo y sus acciones. Todo lo demás —Audiencias, Borradores, Revisiones, Buscador, Catálogo, Herramientas, Manual, Soporte, Ajustes— está en «Más», bajo «Todo lo demás», agrupado con los mismos verbos de la barra lateral del computador, para que no haya que aprender dos mapas del mismo producto. En «Más» están también «Saldo y recarga» y «Plan de la firma», bajo «Cuenta».'
    },
    {
      kind: 'lista',
      items: [
        'Redactar: arriba, la barra de rama y actuación; debajo, el taller en dos pestañas —«Instrucción» y «Documento»— y el visor con la barra de revisión.',
        'Orientar: describa los hechos y pulse «Orientar»; el salto «Redactar esta» es el mismo que en el computador.',
        'Grabar: la grabadora ocupa la pantalla, con pausa y con la onda, y el mismo consentimiento; el cronómetro es lo más grande de la pantalla y la grabación sigue con la pantalla apagada. El guion de las cuatro preguntas aparece al terminar de transcribir, no mientras se graba.',
        'Audiencias: se sube el archivo, se ve el porcentaje mientras viaja, y el transcrito se lee con cada intervención a ancho completo. Las herramientas de corrección son las mismas; de pie se revisa mejor de lo que se edita.',
        'Catálogo: se busca por nombre y cada ficha se abre completa, con su término, su fuente y su estado.',
        'Los diálogos suben desde abajo, como una hoja, y se cierran deslizando o con el velo.'
      ]
    },
    {
      kind: 'aviso',
      texto:
        'Grabar una entrevista con la pantalla apagada funciona, pero cerrar la aplicación no: la grabación vive en la pestaña. Si va a grabar más de unos minutos, deje el teléfono con la aplicación al frente.'
    },
    { kind: 'subtitulo', texto: 'Instalarla como aplicación' },
    {
      kind: 'parrafo',
      texto:
        'Iureon se puede añadir a la pantalla de inicio y abrirse como una aplicación, sin barra de direcciones. No se descarga nada de una tienda: es la misma página, con icono propio. Es requisito para recibir avisos en iPhone y iPad.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Android con Chrome: abra «Más» abajo a la derecha y, bajo «En este dispositivo», toque «Instalar Iureon en este dispositivo». Si el botón no aparece, use el menú de Chrome (⋮) → «Instalar aplicación» o «Añadir a pantalla de inicio».',
        'iPhone o iPad con Safari: la misma sección le muestra los dos toques: «Compartir» (el cuadrado con la flecha) y luego «Añadir a pantalla de inicio». Abra Iureon desde el icono nuevo, no desde Safari.',
        'Computador con Chrome o Edge: el icono de instalar aparece a la derecha de la barra de direcciones; también está en «Avisos», en el pie de la barra lateral.',
        'Una vez instalada, la sección dice «Instalada. Ábrala desde su pantalla de inicio o su escritorio».'
      ]
    },
    { kind: 'subtitulo', texto: 'Avisos en el teléfono y en el computador' },
    {
      kind: 'pasos',
      pasos: [
        'En el teléfono, abra «Más» y, bajo «En este dispositivo», toque «Activar avisos en este dispositivo». En el computador, pulse «Avisos» en el pie de la barra lateral.',
        'El navegador le pedirá permiso una vez. Al concederlo, la pantalla dice «Activados en este dispositivo».',
        'Pulse «Enviar una prueba»: si la notificación llega, el camino entero funciona. «Desactivar» lo cierra en ese aparato.',
        'Repita en cada aparato donde quiera recibirlos: se activan aparato por aparato, y activarlos en el teléfono no los activa en el portátil.'
      ]
    },
    {
      kind: 'parrafo',
      texto:
        'Los avisos llegan como notificaciones del sistema aunque la pestaña esté cerrada. Hoy se avisa de tres cosas, y la propia pantalla lo dice:'
    },
    {
      kind: 'lista',
      items: [
        'Cuando soporte responde a una conversación de su firma.',
        'Cuando otro abogado de su firma crea un borrador.',
        'Cuando otro abogado de su firma edita el texto de un borrador: como mucho un aviso cada diez minutos por escrito, para que una sesión de edición no sean treinta avisos.'
      ]
    },
    {
      kind: 'consejo',
      texto:
        'Active los avisos en el teléfono y no solo en el computador: la respuesta de soporte y el borrador nuevo de un compañero son justo lo que llega cuando usted no está frente al escritorio.'
    },
    {
      kind: 'nota',
      titulo: 'Lo que usted hace no le avisa a usted',
      texto:
        'Su propio borrador y su propio mensaje a soporte no le llegan a sus dispositivos. Y nada más avisa por ahora: ni vencimientos, ni transcripciones terminadas, ni saldo. Cuando algo de eso se añada, aparecerá en esta lista.'
    },
    {
      kind: 'aviso',
      texto:
        'En iPhone y iPad, los avisos solo funcionan si Iureon está añadida a la pantalla de inicio y se abre desde ahí. Desde una pestaña de Safari no llegan, y la pantalla de avisos lo dice.'
    }
  ]
};

const A_HERRAMIENTAS: ManualArticle = {
  id: 'herramientas',
  titulo: 'Herramientas de cálculo',
  entradilla:
    'Qué calcula cada herramienta, de dónde salen sus cifras y cuáles tiene que escribir usted porque ninguna fuente oficial las entrega de forma estable.',
  bloques: [
    { kind: 'ruta', camino: ['Herramientas', 'La herramienta', '«Fuentes»', '«Exportar a Excel»'] },
    {
      kind: 'parrafo',
      texto:
        'Herramientas reúne siete utilidades que no generan un escrito: «Contador de términos», «Calendario judicial», «Liquidación de prestaciones», «Competencia por cuantía», «Intereses de mora», «Indexación por IPC» y el «Glosario jurídico». Todas obedecen la misma regla que el catálogo: ninguna constante entra al cálculo sin su norma, la dirección oficial donde se leyó y la fecha en que se leyó.'
    },
    {
      kind: 'pasos',
      pasos: [
        'Abra «Herramientas» y busque «Por nombre o por lo que necesita calcular», o recorra las tarjetas agrupadas por tarea. Cada tarjeta dice si trae «Fuente declarada» o si algún dato está «Sin verificar».',
        'Abra la herramienta y complete los campos. En el contador de términos escriba la fecha de partida, el número de «Días hábiles» y la jurisdicción —«Civil» o «Penal (atiende lunes a miércoles santos)»— y pulse «Calcular».',
        'Lea el resultado y, debajo, el recuadro «Fuentes»: es la lista de cada norma, cada dirección oficial y cada fecha de lectura que sostiene la cifra.',
        'Si necesita soporte para el expediente o para contabilidad, pulse «Exportar a Excel»: el archivo trae el cálculo y una hoja «Fuentes» con la misma lista. Lo tienen las seis calculadoras; el glosario no, porque no calcula nada.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que el servidor sabe' },
    {
      kind: 'lista',
      items: [
        'Los festivos se calculan de la Ley 51 de 1983 para cualquier año desde 1984 —fechas fijas, las que se trasladan al lunes y las que dependen de la Pascua— y desde 2026 incluyen el 9 de julio de la Ley 2578 de 2026. Cada fila del calendario dice qué regla la produjo.',
        'La vacancia judicial del 20 de diciembre al 10 de enero y la Semana Santa se descuentan porque el Decreto 1660 de 1978 las declara vacancia y el artículo 118 del CGP ordena no contarlas. Los despachos penales atienden de lunes a miércoles santos: elija «Penal» en el contador, o apague la casilla de Semana Santa en el calendario.',
        'El salario mínimo y el auxilio de transporte de 2020 a 2026 están cargados con el decreto de cada año. La competencia por cuantía solo ofrece esos años; para otro año la herramienta se niega en vez de suponer un valor.',
        'La tasa de interés bancario corriente cambia cada mes. El servidor trae únicamente la última certificación verificada, con su mes y su resolución, y la prellena etiquetada.'
      ]
    },
    { kind: 'subtitulo', texto: 'Lo que usted escribe' },
    {
      kind: 'parrafo',
      texto:
        'El índice IPC no se carga solo: el DANE lo publica en un archivo cuya dirección cambia cada mes y que un servidor no puede leer con garantías. Tome el índice inicial y el final de la página oficial enlazada en la herramienta —el total nacional, base diciembre de 2018 igual a 100— y escríbalos; la fórmula que se aplica se muestra con sus números. Lo mismo ocurre con el interés bancario corriente de cualquier mes distinto del prellenado: tómelo de la certificación de la Superintendencia Financiera y consérvela como soporte.'
    },
    {
      kind: 'consejo',
      texto:
        'Guarde el Excel exportado junto al escrito que usa la cifra. La hoja «Fuentes» es la respuesta lista a la pregunta «¿de dónde sacó ese número?», con norma, dirección y fecha, sin tener que reconstruirla meses después.'
    },
    {
      kind: 'nota',
      titulo: 'Los intereses se liquidan de forma simple',
      texto:
        'Interés simple sobre los días calendario entre las dos fechas, año de 365 días, sin capitalizar. En el modo comercial la tasa es 1,5 veces el bancario corriente (art. 884 del Código de Comercio); en el civil, el 6 % anual del artículo 1617 del Código Civil; en el pactado, la que usted indique, contrastada con el tope de usura del artículo 305 del Código Penal. Si un periodo cruza varios meses, la herramienta advierte que una liquidación exacta aplica la tasa certificada de cada mes.'
    },
    {
      kind: 'aviso',
      texto:
        'El salario mínimo de 2026 está fijado por el Decreto 1469 de 2025, suspendido provisionalmente por el Consejo de Estado, y por el Decreto 0159 de 2026, que fija el mismo valor de forma transitoria. La cifra es la misma bajo los dos; el resultado lo advierte para que verifique si hay decisión de fondo posterior.'
    },
    {
      kind: 'todavia-no',
      texto:
        'El cómputo de ejecutoria con traslados no está construido: exige modelar cada recurso con su término y su forma de notificación. La competencia laboral por cuantía se calcula solo con la Ley 2452 de 2025, vigente desde el 2 de abril de 2026; para demandas anteriores la herramienta se niega porque el código anterior no está verificado en ella.'
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
