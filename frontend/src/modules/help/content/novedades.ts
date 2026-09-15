import type { Novedad } from '../types';

export type { Novedad } from '../types';

/**
 * Novedades: lo que cambió en la aplicación, y cuándo.
 *
 * ─── CADA ENTRADA ES ALGO QUE YA ESTÁ EN LA APLICACIÓN ──────────────────────
 *
 * La fuente es la historia del repositorio y el código de hoy, no una hoja de
 * ruta: cada entrada se comprobó contra el mensaje de su cambio Y contra el
 * componente que lo pinta. Se escribe para quien usa la aplicación: qué puede
 * hacer ahora o qué dejó de salir mal, nunca cómo se construyó. Nada de
 * despliegues, guardas, verificaciones internas ni cifras de la casa.
 *
 * Tampoco nada comercial ni de entrada (precios, planes nuevos, pruebas
 * gratuitas, registro, portada): quien lee esta lista ya está adentro
 * (decisión del propietario, 2026-09-05). Por eso no hay entrada de «Entrar»
 * con la cara nueva ni de las tarjetas de planes de la portada.
 *
 * Lo que un cambio posterior deshizo no se publica como vigente: la pestaña
 * «Audiencia» del taller (8 de septiembre) se mudó al expediente el 10, y solo
 * queda la entrada del 10. Varios cambios sobre una misma función son una sola
 * entrada.
 *
 * Lo del 14 de septiembre que todavía no tiene su propio registro en el
 * repositorio —Privacidad, Seguridad y Auditoría con la cara nueva y la
 * auditoría por páginas, y el filtro por rama de Expedientes— se incluyó
 * después de comprobar que existe y funciona en el código de ese día.
 *
 * Reglas que impone `check:novedades`: de lo más reciente a lo más antiguo,
 * ninguna fecha futura, módulos por id de navegación, «Cómo usarlo» solo hacia
 * artículos del manual que existen, «qué cambió» en dos a cuatro oraciones y
 * sin jerga interna. `soloOperacion` marca lo que solo ve el operador.
 */

export const NOVEDADES: readonly Novedad[] = [
  /* ── 14 de septiembre de 2026 ──────────────────────────────────────────── */
  {
    id: 'redaccion-tres-pasos',
    fecha: '2026-09-14',
    modulos: ['workspace'],
    titulo: 'Redactar un escrito, en tres pasos',
    queCambio:
      'Redacción se ordena en tres pasos: de qué caso es y quién firma, la rama, y la actuación. Al elegir la actuación queda a la vista su artículo, si su término está verificado y el término completo, con «Cambiar» al lado. Cuando lo suyo no está en la lista, las salidas tienen nombres claros: que la guía la proponga, escribirla usted o redactar sin actuación.',
    tipo: 'mejora',
    comoUsarlo: 'primer-escrito'
  },
  {
    id: 'borrador-lo-que-respalda',
    fecha: '2026-09-14',
    modulos: ['workspace', 'borradores'],
    titulo: 'El borrador muestra lo que respalda el escrito',
    queCambio:
      'Sobre el papel hay una barra propia con el caso, el título, el estado de guardado, Word, PDF y Copiar, y «Marcar como listo». Al lado, la columna «Lo que respalda este escrito» lista las secciones que exige la ficha y lleva al párrafo de cada una.',
    tipo: 'mejora',
    comoUsarlo: 'exportar'
  },
  {
    id: 'estilo-ensenar-formato',
    fecha: '2026-09-14',
    modulos: ['workspace', 'ajustes'],
    titulo: 'Estilo de la firma: enseñar un formato y aplicarlo al redactar',
    queCambio:
      'El socio administrador puede enseñar la forma de un borrador aprobado con «Enseñar este formato», y antes de guardar ve qué se conserva y qué se descarta. Nunca se guardan el texto del escrito, las citas, los plazos ni las pretensiones, y los datos personales se retiran antes de leerlo. Al redactar, el tercer paso trae el interruptor para aplicar ese estilo, y la ficha y la norma siguen mandando sobre él. En Ajustes se ve lo enseñado y se puede quitar.',
    tipo: 'nuevo',
    comoUsarlo: 'formato'
  },
  {
    id: 'estilo-jerga',
    fecha: '2026-09-14',
    modulos: ['workspace'],
    titulo: '«Sugerir jerga» señala las palabras que su firma dice de otra forma',
    queCambio:
      'El panel «Jerga de su firma» marca en el borrador las palabras que la firma prefiere decir distinto, según lo que el socio enseñó, y propone el reemplazo. Nunca toca citas, artículos, texto entre comillas, corchetes ni negritas. No consume saldo, y si la firma no ha enseñado ningún formato la pantalla lo dice.',
    tipo: 'nuevo',
    comoUsarlo: 'formato'
  },
  {
    id: 'expedientes-buscar-caso',
    fecha: '2026-09-14',
    modulos: ['expedientes'],
    titulo: 'Encontrar un caso por cédula, nombre, radicado, año o mes',
    queCambio:
      'El buscador de Expedientes encuentra el caso por la cédula o el NIT del cliente, por el nombre de cualquier persona del caso y por el radicado. Se puede acotar por año y mes de registro, y cuando no es evidente por qué salió un caso, la fila dice «Coincide con».',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'expedientes-lista-por-cliente',
    fecha: '2026-09-14',
    modulos: ['expedientes'],
    titulo: 'Los casos, ordenados por cliente y por rama',
    queCambio:
      'La lista agrupa los casos por cliente y por rama, con un filtro de rama que solo ofrece las ramas que la pestaña tiene. Las pestañas «Esta semana», «Activos» y «Cerrados» muestran el próximo término de cada caso en palabras, en ámbar si vence en tres días o ya venció. Si la agenda no se pudo leer, la pantalla lo dice en vez de mostrar que no vence nada.',
    tipo: 'mejora',
    comoUsarlo: 'expediente'
  },
  {
    id: 'expedientes-carpetas-menu',
    fecha: '2026-09-14',
    modulos: ['expedientes'],
    titulo: 'Carpetas y documentos con menú: abrir, renombrar, mover y eliminar',
    queCambio:
      'Cada carpeta y cada documento tiene su menú, también con clic derecho, para abrir, renombrar, mover, quitar o eliminar. Las carpetas se ven en tarjetas, en árbol o en tabla, y el documento se lee a pantalla completa. Mover un documento solo se permite dentro del mismo caso, y eliminar pide confirmación diciendo qué se borra.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'editar-datos-del-caso',
    fecha: '2026-09-14',
    modulos: ['expedientes'],
    titulo: 'Editar los datos de un caso ya creado',
    queCambio:
      'Desde el menú del caso, «Editar datos del caso» corrige el nombre, el radicado, el despacho, la rama, la contraparte y las notas. Solo se guarda lo que usted cambió, y un radicado con forma inusual se advierte sin impedir guardarlo. Si cierra con cambios sin guardar, la aplicación pregunta antes.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'revision-comprobacion-automatica',
    fecha: '2026-09-14',
    modulos: ['taller'],
    titulo: 'El informe separa la comprobación automática de lo que dice el revisor',
    queCambio:
      'La comprobación de vigencia y de lo que cada artículo dice aparece en un bloque propio, «Comprobación automática», con una marca bajo cada punto afectado, en el diálogo, el taller y el PDF. «Aplicar reemplazo» ya no pega advertencias dentro del escrito. Y ninguna versión del texto del taller se descarta.',
    tipo: 'mejora',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'revision-leer-en-grande',
    fecha: '2026-09-14',
    modulos: ['taller'],
    titulo: '«Leer en grande» abre el informe a lo ancho',
    queCambio:
      'Desde el taller, «Leer en grande» abre el informe en un diálogo amplio en el computador y a pantalla completa en el teléfono. La lectura ya no depende del ancho de la columna del taller.',
    tipo: 'nuevo',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'audiencias-entrevistas-cara',
    fecha: '2026-09-14',
    modulos: ['audiencias', 'entrevistas'],
    titulo: 'Audiencias y Entrevistas con la nueva cara',
    queCambio:
      'Audiencias trae la lista, la subida con el tamaño y los formatos que de verdad acepta, el transcrito con «Quién habla» y los diálogos de corregir, mover y dividir. Entrevistas pide la autorización de grabar antes de todo y cierra con la decisión de tomar o no el caso. Si la transcripción falla, la grabación de la entrevista no se pierde.',
    tipo: 'mejora',
    comoUsarlo: 'audiencia'
  },
  {
    id: 'orientacion-borradores-revisiones-cara',
    fecha: '2026-09-14',
    modulos: ['orientacion', 'borradores', 'taller'],
    titulo: 'Orientación, Borradores y Revisiones con la nueva cara',
    queCambio:
      'Las tres pantallas adoptan el diseño nuevo sin cambiar lo que hacen. En Orientación, la candidata cuyo término no está verificado se distingue por su borde punteado. Borradores y Revisiones muestran cada fila con su estado y los mismos filtros de siempre.',
    tipo: 'mejora',
    comoUsarlo: 'orientacion'
  },
  {
    id: 'herramientas-agenda-exportar',
    fecha: '2026-09-14',
    modulos: ['tools'],
    titulo: 'La agenda por mes, en PDF y en su calendario',
    queCambio:
      'Cada herramienta abre en pantalla completa y la agenda de términos se ve por mes. La agenda se exporta en PDF con el membrete de la firma, para imprimir, y en un archivo .ics que se importa en Google Calendar u Outlook.',
    tipo: 'nuevo',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'contador-clase-de-termino',
    fecha: '2026-09-14',
    modulos: ['tools'],
    titulo: 'El contador de términos cuenta en días hábiles, calendario, meses o años',
    queCambio:
      'El contador pregunta qué clase de término es: días hábiles, que sigue siendo lo que viene marcado, días calendario, meses o años. Con el resultado a la vista, «Poner en la agenda» lo guarda sin volver a escribirlo.',
    tipo: 'nuevo',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'intereses-por-tramos',
    fecha: '2026-09-14',
    modulos: ['tools'],
    titulo: 'Los intereses de mora cobraban de más: ahora se liquidan por tramos',
    queCambio:
      'La calculadora dividía la tasa efectiva anual entre 365 y eso daba intereses mayores a los debidos. Ahora liquida tramo por tramo con las tasas certificadas por la Superintendencia Financiera, cada una con su resolución y su enlace, en la tabla «Por tramos de tasa». Si el periodo pedido pasa de la última tasa cargada, la pantalla lo advierte.',
    tipo: 'correccion',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'manual-soporte-visita',
    fecha: '2026-09-14',
    modulos: ['manual', 'soporte', 'inicio'],
    titulo: 'La visita guiada, por capítulos y con su duración',
    queCambio:
      'La visita guiada tiene cinco capítulos con nombre y la duración calculada de lo que realmente dice, y señala en pantalla lo que explica. En el teléfono sube como hoja desde abajo. El Manual y Soporte adoptan la nueva cara.',
    tipo: 'mejora',
    comoUsarlo: 'soporte'
  },
  {
    id: 'recuperar-contrasena',
    fecha: '2026-09-14',
    modulos: ['ajustes'],
    titulo: 'Recuperar la contraseña por correo',
    queCambio:
      'En la pantalla de entrada, «Olvidó su contraseña» envía un enlace al correo para elegir una nueva. Al guardarla se cierran todas las sesiones abiertas de esa cuenta, y un enlace vencido o ya usado lo dice claramente.',
    tipo: 'nuevo'
  },
  {
    id: 'ingreso-causa-real',
    fecha: '2026-09-14',
    modulos: ['inicio'],
    titulo: 'Entrar ya no dice «contraseña incorrecta» cuando el problema es otro',
    queCambio:
      'Cuando el servicio de acceso tardaba en responder, la pantalla de entrada mostraba «Correo o contraseña incorrectos» aunque la contraseña fuera correcta. Ahora distingue la contraseña errada, el exceso de intentos y el servicio no disponible. La aplicación también carga más rápido porque no verifica la sesión en cada paso.',
    tipo: 'correccion'
  },
  {
    id: 'borrar-firma-completo',
    fecha: '2026-09-14',
    modulos: ['ajustes'],
    titulo: 'Eliminar la firma vuelve a funcionar, con todos sus datos',
    queCambio:
      'Eliminar la firma desde la zona de riesgo fallaba y no borraba nada. Ahora borra también expedientes, personas, carpetas, agenda y actuaciones propias, y conserva solo el registro de auditoría, que no se puede alterar.',
    tipo: 'correccion'
  },
  {
    id: 'cerrar-sesion-pregunta',
    fecha: '2026-09-14',
    modulos: ['ajustes'],
    titulo: 'Cerrar sesión pregunta antes, desde cualquier sitio',
    queCambio:
      'En el teléfono y en Ajustes la sesión se cerraba sin preguntar. Ahora el mismo diálogo de confirmación aparece en la cabecera, en el teléfono y en Ajustes.',
    tipo: 'correccion'
  },
  {
    id: 'ajustes-plan-saldo',
    fecha: '2026-09-14',
    modulos: ['ajustes'],
    titulo: 'Ajustes con índice, y la recarga dice el estado real del pago',
    queCambio:
      'Ajustes se ordena en un índice de secciones: su cuenta, apariencia, plan y saldo, avisos, instalar, atajos y zona de riesgo. Al volver de Wompi, la recarga consulta el estado real del pago cada pocos segundos: pendiente, aprobado, rechazado o anulado. El extracto del saldo también se descarga en CSV.',
    tipo: 'mejora',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'su-firma-usuarios',
    fecha: '2026-09-14',
    modulos: ['ajustes'],
    titulo: 'Su firma: agregar, cambiar de rol, retirar y reactivar usuarios',
    queCambio:
      'La gestión de usuarios pide confirmación antes de cambiar un rol o retirar a alguien, y permite reactivarlo. Cuando el plan no tiene más puestos, la pantalla lo dice con «No quedan puestos».',
    tipo: 'mejora',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'membrete-vista-previa',
    fecha: '2026-09-14',
    modulos: ['ajustes'],
    titulo: 'La vista previa del membrete es la que se imprime',
    queCambio:
      'La vista previa de Membrete muestra exactamente las líneas que salen en el Word y en el PDF. Se retiraron la firma escaneada y los logos en SVG, que se podían subir pero no llegaban a los documentos, y si el logo se descarta la pantalla avisa.',
    tipo: 'correccion',
    comoUsarlo: 'formato'
  },
  {
    id: 'buscador-catalogo-cara',
    fecha: '2026-09-14',
    modulos: ['search', 'catalogo'],
    titulo: 'Buscador y Catálogo con la nueva cara, y dos correcciones de la curaduría',
    queCambio:
      'El Buscador mantiene separados lo curado por la firma y lo hallado automáticamente. En Catálogo, deshacer una verificación en una rama ya no borra la de otra rama. Y una ficha ya no aparece como verificada solo por tener enlace a su fuente.',
    tipo: 'correccion',
    comoUsarlo: 'buscador'
  },
  {
    id: 'privacidad-seguridad-auditoria',
    fecha: '2026-09-14',
    modulos: ['audit', 'privacidad'],
    titulo: 'Seguridad y Privacidad con la nueva cara, y la auditoría completa por páginas',
    queCambio:
      'La auditoría ya no se queda en las primeras filas: se recorre por páginas con «Cargar más» y el pie dice cuántos eventos quedan. Cada acción se escribe en palabras y no en códigos, igual en el computador y en el teléfono. Privacidad adopta el diseño nuevo con los proveedores que tratan los datos de la firma.',
    tipo: 'mejora'
  },
  {
    id: 'iconos-de-modulo',
    fecha: '2026-09-14',
    modulos: ['inicio'],
    titulo: 'Cada módulo tiene el mismo ícono en el teléfono y en el computador',
    queCambio:
      'Redacción era una hoja en el teléfono y unas chispas en el computador, y Orientación una bombilla allá y una brújula acá. Ahora el panel lateral, la barra inferior, la hoja «Más» y las puertas de Inicio usan el mismo ícono para cada módulo.',
    tipo: 'correccion'
  },
  {
    id: 'menu-y-lista-sin-recorte',
    fecha: '2026-09-14',
    modulos: ['inicio', 'workspace'],
    titulo: 'El pie del menú lateral y la lista de actuaciones ya no se cortan',
    queCambio:
      'Un nombre de plan largo empujaba el saldo, «Recargar» y Membrete fuera del panel lateral; ahora se acorta con el nombre completo al pasar el cursor. La lista de actuaciones se ajusta al espacio real de la ventana y se abre hacia arriba cuando abajo no cabe. Los diálogos ya no pasan del alto de la ventana.',
    tipo: 'correccion'
  },
  {
    id: 'consola-operacion-cara',
    fecha: '2026-09-14',
    modulos: ['audit'],
    titulo: 'Consola de operación con la nueva cara',
    queCambio:
      'Las firmas se ordenan por riesgo y la ficha de cada una reúne plan, recarga, acceso de soporte, bandeja y catálogo maestro. Cambiar el plan exige confirmación y un motivo de al menos diez caracteres. Una cifra que no se pudo leer dice «no se pudo leer» en vez de cero.',
    tipo: 'mejora',
    soloOperacion: true
  },

  /* ── 13 de septiembre de 2026 ──────────────────────────────────────────── */
  {
    id: 'inicio-tres-niveles',
    fecha: '2026-09-13',
    modulos: ['inicio'],
    titulo: 'Inicio empieza por lo que vence',
    queCambio:
      'Primero van los términos pendientes de la agenda, los vencidos antes y nunca escondidos, con el botón para empezar el borrador o ver el caso. Después, lo que dejó abierto, el plan y el saldo, y al final las puertas para empezar. Si la agenda no responde, Inicio lo dice y no afirma que no haya términos pendientes.',
    tipo: 'mejora',
    comoUsarlo: 'inicio'
  },
  {
    id: 'panel-lateral-numerales',
    fecha: '2026-09-13',
    modulos: ['inicio'],
    titulo: 'El panel lateral con numerales fijos',
    queCambio:
      'El panel lateral y las barras del teléfono adoptan la nueva cara. Cada módulo conserva su número aunque el plan oculte otro: antes, sin Orientación, Expedientes pasaba del 05 al 04.',
    tipo: 'mejora'
  },
  {
    id: 'expedientes-titulos',
    fecha: '2026-09-13',
    modulos: ['expedientes'],
    titulo: 'Los títulos de Expedientes vuelven a verse como títulos',
    queCambio:
      'El nombre del módulo, la carátula del caso y ocho encabezados de sección salían al tamaño del texto corrido. Ahora tienen la misma jerarquía que en los demás módulos.',
    tipo: 'correccion'
  },
  {
    id: 'consola-cuenta-todo',
    fecha: '2026-09-13',
    modulos: ['audit'],
    titulo: 'La consola de operación cuenta todas las filas',
    queCambio:
      'Pasadas mil filas, los transcritos, el consumo de 30 días y el catálogo curado de cada firma salían por debajo de la cifra real. Ahora se cuentan completos, y también los usuarios de cada firma.',
    tipo: 'correccion',
    soloOperacion: true
  },

  /* ── 12 de septiembre de 2026 ──────────────────────────────────────────── */
  {
    id: 'expediente-llega-a-redaccion',
    fecha: '2026-09-12',
    modulos: ['expedientes', 'workspace', 'taller'],
    titulo: 'Lo que el expediente tiene indexado llega a Redacción y a la revisión',
    queCambio:
      'Si la demanda, el auto y la contestación ya están en el expediente, Redacción los usa al escribir un escrito de ese caso. Ya no hay que volver a teclear el radicado, el juzgado ni los nombres de las partes. La revisión también coteja el escrito contra ese material.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'expediente-ver-documento',
    fecha: '2026-09-12',
    modulos: ['expedientes'],
    titulo: 'El documento del expediente se ve dentro, en su página exacta',
    queCambio:
      'El expediente guarda el archivo original y lo muestra en la aplicación, con paginación y texto que se puede seleccionar y copiar. Desde ahí se descarga, y al quitarlo se borra de verdad.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'revision-glosa',
    fecha: '2026-09-12',
    modulos: ['taller'],
    titulo: 'La revisión detecta un artículo vigente explicado al revés',
    queCambio:
      'El informe comprueba lo que el escrito dice que dice cada artículo contra el texto oficial. Así aparece, por ejemplo, el artículo de las obligaciones del arrendador descrito como si fueran las del arrendatario.',
    tipo: 'mejora',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'adjunto-ver-antes',
    fecha: '2026-09-12',
    modulos: ['workspace'],
    titulo: 'El adjunto de Redacción se puede ver antes de generar',
    queCambio:
      'Al pulsar un archivo adjunto se abre el documento, no solo su nombre y tamaño. Así se comprueba que se escogió el archivo correcto antes de pagar un borrador redactado sobre otra cosa.',
    tipo: 'nuevo'
  },
  {
    id: 'transcrito-orientacion-atados',
    fecha: '2026-09-12',
    modulos: ['audiencias', 'entrevistas', 'orientacion', 'expedientes'],
    titulo: 'Transcritos y orientaciones también nacen atados a su caso',
    queCambio:
      'Al transcribir o al orientar se escoge el caso con el mismo selector que usan las demás pantallas. Lo que nace atado aparece en su expediente sin tener que traerlo después a mano.',
    tipo: 'mejora',
    comoUsarlo: 'expediente'
  },

  /* ── 11 de septiembre de 2026 ──────────────────────────────────────────── */
  {
    id: 'de-que-caso',
    fecha: '2026-09-11',
    modulos: ['workspace', 'borradores', 'taller', 'tools'],
    titulo: '«De qué caso» en Redacción: revisiones, borradores y términos nacen atados',
    queCambio:
      'La barra de Redacción pregunta de qué caso es el escrito, y el borrador queda en su expediente desde el primer momento. La revisión, el término de la agenda y el borrador que sale de una revisión heredan también su caso. El expediente le dice además a la revisión a quién representa usted.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'inicio-puertas',
    fecha: '2026-09-11',
    modulos: ['inicio', 'orientacion', 'expedientes'],
    titulo: 'Inicio pregunta por lo que usted tiene delante',
    queCambio:
      'Las puertas de Inicio dicen «Me llegó un documento», «Tengo los hechos y no el nombre», «Ya sé qué voy a presentar», «Tengo un caso con muchos papeles» y «Grabé una audiencia». Orientación y Expedientes entran por fin a la pantalla de entrada. Las puertas que el plan no incluye se atenúan con su aviso.',
    tipo: 'mejora',
    comoUsarlo: 'inicio'
  },
  {
    id: 'orientacion-plazo-anunciado',
    fecha: '2026-09-11',
    modulos: ['orientacion'],
    titulo: 'Si el documento adjunto en Orientación anuncia un plazo, se lo decimos',
    queCambio:
      'Cuando el oficio o el auto adjuntado anuncia un término, la pantalla lo dice en ámbar y cita la frase del propio documento. El botón «Leerlo primero» lo lleva a Revisiones ya leído, sin volver a adjuntarlo. El aviso calla cuando no está seguro, porque un aviso que sale siempre deja de leerse.',
    tipo: 'mejora',
    comoUsarlo: 'orientacion'
  },
  {
    id: 'documento-recibido-posicion',
    fecha: '2026-09-11',
    modulos: ['taller'],
    titulo: 'El informe de un documento recibido sabe a quién representa usted',
    queCambio:
      'Al leer un documento que le llegó puede declarar a quién representa en el proceso. Con esa respuesta, la carga que el documento le impone a la otra parte aparece marcada «Esta carga no es suya». Sin declarar, el informe no le atribuye nada a nadie, y lo mismo sale en el Word y en el PDF.',
    tipo: 'mejora',
    comoUsarlo: 'documento-recibido'
  },
  {
    id: 'expedientes-carpetas-anidadas',
    fecha: '2026-09-11',
    modulos: ['expedientes'],
    titulo: 'Carpetas dentro de carpetas en el expediente',
    queCambio:
      'Las carpetas se anidan y cada documento vive en una sola. Ordenarlas no cambia lo que encuentra la búsqueda ni lo que lee el interrogatorio, que siempre recorre el expediente entero. Borrar una carpeta se lleva lo de dentro, y ahora se pregunta antes.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'expedientes-buscar-dentro',
    fecha: '2026-09-11',
    modulos: ['expedientes'],
    titulo: 'Buscar dentro del expediente por lo que decía, sin costo',
    queCambio:
      'Escriba lo que recuerda, por ejemplo «entrega del inmueble», y vea los pasajes que hablan de eso con el documento del que salieron. La búsqueda es por significado y no consume saldo.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'expedientes-cliente',
    fecha: '2026-09-11',
    modulos: ['expedientes', 'entrevistas'],
    titulo: 'El expediente se ata a su cliente y dice qué tiene indexado',
    queCambio:
      'Al crear el expediente se escoge el cliente, y con eso el caso queda unido a sus entrevistas. La pantalla muestra además qué documentos están indexados y cuáles no.',
    tipo: 'mejora',
    comoUsarlo: 'expediente'
  },
  {
    id: 'sesion-se-cerraba',
    fecha: '2026-09-11',
    modulos: ['inicio'],
    titulo: 'La sesión ya no se cierra sola',
    queCambio:
      'Cuando el servicio de acceso tardaba en responder, la aplicación lo tomaba como una sesión inválida y devolvía a la pantalla de entrada. Ahora solo cierra la sesión cuando de verdad dejó de servir.',
    tipo: 'correccion'
  },
  {
    id: 'manual-expedientes-buscador',
    fecha: '2026-09-11',
    modulos: ['manual', 'expedientes', 'search'],
    titulo: 'Expedientes y Buscador tienen su artículo en el manual',
    queCambio:
      'El manual gana «Reunir el expediente de un caso» y «Buscar jurisprudencia», que no tenían artículo propio. Suma además los grupos «Organizar el caso» y «Consultar».',
    tipo: 'mejora',
    comoUsarlo: 'expediente'
  },

  /* ── 10 de septiembre de 2026 ──────────────────────────────────────────── */
  {
    id: 'expediente-caso',
    fecha: '2026-09-10',
    modulos: ['expedientes'],
    titulo: 'Expedientes: el caso, quién está en él y sus trescientas páginas',
    queCambio:
      'El expediente reúne el asunto, las personas del caso con su papel y los documentos. Se pueden indexar expedientes largos para buscar dentro de ellos, y traer al caso las revisiones, borradores, términos y transcritos que la firma ya tenía.',
    tipo: 'nuevo',
    comoUsarlo: 'expediente'
  },
  {
    id: 'interrogatorio-expediente',
    fecha: '2026-09-10',
    modulos: ['expedientes', 'taller'],
    titulo: 'El interrogatorio se prepara desde el expediente, persona por persona',
    queCambio:
      'La pestaña «Audiencia» del taller se mudó a Expedientes. Usted escoge a quién va a interrogar, hasta cuatro por tanda, y recibe una lista por persona con la técnica que corresponde. Cada pregunta dice para qué sirve y cita el pasaje del que nace, y el interrogatorio se descarga en Word y en PDF.',
    tipo: 'nuevo',
    comoUsarlo: 'preguntas-audiencia'
  },
  {
    id: 'revision-curaduria-firma',
    fecha: '2026-09-10',
    modulos: ['taller', 'catalogo'],
    titulo: 'Lo que su firma verificó en el Catálogo llega a la revisión',
    queCambio:
      'Un término verificado por la firma ya moldeaba sus borradores pero no sus revisiones. Ahora la revisión, el taller y el chat sobre el escrito usan también lo curado por su firma.',
    tipo: 'correccion',
    comoUsarlo: 'curaduria'
  },
  {
    id: 'normas-citadas-verificadas',
    fecha: '2026-09-10',
    modulos: ['workspace', 'taller'],
    titulo: 'Las normas que cita el escrito se comprueban contra el texto oficial',
    queCambio:
      'Redacción y Revisiones comprueban la vigencia de cada artículo citado contra la fuente oficial, incluido el caso del artículo vigente cuyo texto la Corte condicionó. El revisor ya no puede recomendar un artículo derogado sin que el informe lo advierta.',
    tipo: 'mejora',
    comoUsarlo: 'tres-estados'
  },
  {
    id: 'informe-desde-el-taller',
    fecha: '2026-09-10',
    modulos: ['taller'],
    titulo: 'El informe se descarga también desde el taller',
    queCambio:
      'Quien vuelve días después a una revisión encuentra Word y PDF en la pestaña «Informe» del taller. Antes solo existían dentro del diálogo de la primera lectura.',
    tipo: 'mejora',
    comoUsarlo: 'revisar-escrito'
  },

  /* ── 9 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'documento-recibido',
    fecha: '2026-09-09',
    modulos: ['taller'],
    titulo: 'Suba el auto que le llegó y sepa qué le exige, para cuándo y por dónde se ataca',
    queCambio:
      'El diálogo de revisión pregunta qué trae: un escrito suyo o un documento que recibió. Con el segundo no hay que decir qué actuación es, y recibe una lectura: qué decide, qué exige y para cuándo con las palabras del documento, y hasta tres flancos de ataque con su cita. Cuando el documento no anuncia plazo, la pantalla lo dice en ámbar en vez de ponerle uno de memoria.',
    tipo: 'nuevo',
    comoUsarlo: 'documento-recibido'
  },
  {
    id: 'flancos-a-redaccion',
    fecha: '2026-09-09',
    modulos: ['taller', 'catalogo', 'workspace'],
    titulo: 'Del documento recibido a Redacción, con el escrito ya empezado',
    queCambio:
      'Los flancos de la lectura viajan a la guía de actuaciones con su cita literal. Escogida la actuación, Redacción abre con ella puesta y el encargo escrito, con los hechos debajo.',
    tipo: 'nuevo',
    comoUsarlo: 'documento-recibido'
  },
  {
    id: 'revisar-desde-revisiones',
    fecha: '2026-09-09',
    modulos: ['taller'],
    titulo: 'Pedir una revisión desde Revisiones, y que la guía diga qué actuación es',
    queCambio:
      'La cabecera de Revisiones tiene «Revisar un escrito», que abre el diálogo ahí mismo. Escoja la rama, adjunte el archivo y la guía propone la actuación con su término, artículo y autoridad. El archivo se lee en su navegador para esa propuesta, sin subirlo y sin costo.',
    tipo: 'mejora',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'orientacion-adjuntar',
    fecha: '2026-09-09',
    modulos: ['orientacion'],
    titulo: 'En Orientación puede adjuntar el oficio en vez de volver a contarlo',
    queCambio:
      'Bajo el cuadro de los hechos se suelta el PDF, el Word o el texto, y su contenido se añade al final de lo que ya escribió. Se lee en su navegador, no se sube y no cuesta nada. Usted ve y recorta lo que va a viajar, y «Quitar» deshace el adjunto.',
    tipo: 'nuevo',
    comoUsarlo: 'orientacion'
  },
  {
    id: 'instruccion-sugerida',
    fecha: '2026-09-09',
    modulos: ['orientacion', 'workspace'],
    titulo: 'La actuación propuesta llega a Redacción con la instrucción escrita',
    queCambio:
      'En las fichas con término verificado, «Redactar esta» ofrece hasta tres instrucciones listas y editables, hechas con citas literales de la ficha. Al llevarla a Redacción, el cuadro llega con la instrucción arriba y los hechos debajo.',
    tipo: 'nuevo',
    comoUsarlo: 'instruccion'
  },
  {
    id: 'redactar-sin-nombre',
    fecha: '2026-09-09',
    modulos: ['workspace', 'catalogo'],
    titulo: 'Redactar cuando no sabe cómo se llama la actuación',
    queCambio:
      'Describa en sus palabras qué debe lograr el escrito y queda como actuación de su firma, marcada como título de trabajo. El escrito no se bautiza con una figura que nadie eligió y declara que su término no está verificado. En Catálogo puede escribirle después el término y la fuente.',
    tipo: 'nuevo'
  },
  {
    id: 'buscar-en-todo-el-catalogo',
    fecha: '2026-09-09',
    modulos: ['workspace', 'catalogo'],
    titulo: 'Si nada coincide en su rama, se puede buscar en todo el catálogo',
    queCambio:
      'La guía puede repetir la consulta sobre todas las ramas sin volver a escribir los hechos, y cada candidata dice de qué rama viene. La espera es más larga, y se avisa antes.',
    tipo: 'mejora'
  },
  {
    id: 'escrito-completo',
    fecha: '2026-09-09',
    modulos: ['workspace'],
    titulo: 'El escrito llega completo, y si no se puede entregar la pantalla lo dice',
    queCambio:
      'Cuando la redacción no alcanzaba a terminar, la aplicación entregaba una plantilla genérica o se quedaba esperando sin fin. Ahora no fabrica ningún escrito de repuesto, avisa en rojo y devuelve la reserva del saldo.',
    tipo: 'correccion'
  },
  {
    id: 'dialogos-sin-perder-letras',
    fecha: '2026-09-09',
    modulos: ['workspace', 'taller', 'tools'],
    titulo: 'Ya no se pierden letras al escribir dentro de un diálogo',
    queCambio:
      'Con un diálogo abierto, el cursor se salía solo del cuadro de texto cada veinte segundos y al volver a la ventana. Ya no ocurre en ninguno, y «Esc» sigue cerrando.',
    tipo: 'correccion'
  },
  {
    id: 'recursos-por-remision',
    fecha: '2026-09-09',
    modulos: ['catalogo', 'workspace'],
    titulo: 'Los recursos del CGP se ofrecen en las ramas que se remiten a él',
    queCambio:
      'Reposición, apelación, nulidad procesal, desistimiento y los demás aparecen al final de la lista en familia, societario, insolvencia, propiedad intelectual, contratos y constitucional. Llegan marcados «por remisión» y sin afirmar plazo, porque su término solo está comprobado en lo civil. Quien cura puede verificarlo para su rama sin tocar la ficha civil.',
    tipo: 'nuevo',
    comoUsarlo: 'curaduria'
  },
  {
    id: 'taller-original-y-redaccion',
    fecha: '2026-09-09',
    modulos: ['taller', 'workspace'],
    titulo: 'El taller muestra el archivo original y lleva el texto a Redacción',
    queCambio:
      'El modo «Original» muestra el archivo tal como se subió, con su diagramación, y se puede resaltar y comentar sobre él. «Llevar a Redacción» guarda una copia del texto del taller como borrador y lo abre, sin tocar la revisión.',
    tipo: 'nuevo',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'taller-en-el-telefono',
    fecha: '2026-09-09',
    modulos: ['taller'],
    titulo: 'Resaltar y comentar también desde el teléfono',
    queCambio:
      'En pantalla estrecha la barra de resaltar vive abajo, junto al pulgar, y convive con el menú del sistema. El comentario sube como hoja con sitio para el teclado.',
    tipo: 'mejora'
  },
  {
    id: 'agenda-de-terminos',
    fecha: '2026-09-09',
    modulos: ['tools', 'borradores', 'taller'],
    titulo: 'La agenda de términos de su firma, con aviso al teléfono',
    queCambio:
      'Usted registra el asunto, la actuación y la fecha de notificación, y la aplicación calcula el vencimiento descontando festivos y vacancia. Si la ficha no tiene el término comprobado, le pide los días y marca la entrada «sin verificar». Los avisos llegan cinco días antes, dos días antes y el día del vencimiento, y desde Borradores y Revisiones «Poner en la agenda» abre el formulario ya lleno.',
    tipo: 'nuevo',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'calculos-en-pdf',
    fecha: '2026-09-09',
    modulos: ['tools'],
    titulo: 'Los cálculos también se descargan en PDF, para imprimirlos',
    queCambio:
      'Junto a «Exportar a Excel», cada calculadora tiene «Exportar a PDF», con las cifras, el detalle y las fuentes. Sale con la letra de su membrete y sin filas partidas entre hojas.',
    tipo: 'mejora',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'herramientas-tarjetas',
    fecha: '2026-09-09',
    modulos: ['tools'],
    titulo: 'Herramientas en tarjetas, con filtros y la fuente de cada cálculo',
    queCambio:
      'Cada utilidad tiene su tarjeta con lo que calcula y, al pie, la norma de la que sale su cifra. Arriba se filtra entre «Términos», «Dinero» y «Referencia».',
    tipo: 'mejora',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'cambio-de-plan-aviso',
    fecha: '2026-09-09',
    modulos: ['ajustes'],
    titulo: 'Al cambiar de plan, la pantalla dice antes desde cuándo corre el nuevo',
    queCambio:
      'Si elige un plan distinto y todavía le quedan días, la tarjeta advierte que el nuevo empieza el día del pago. Renovar el mismo plan sigue sumando el periodo a la fecha vigente.',
    tipo: 'mejora',
    comoUsarlo: 'planes-y-pago'
  },
  {
    id: 'correos-con-constancia',
    fecha: '2026-09-09',
    modulos: ['ajustes'],
    titulo: 'Constancia por correo al borrar datos',
    queCambio:
      'Al eliminar una firma queda constancia escrita por correo. La cuenta de cobro se adjunta también en las recargas, no solo en el plan.',
    tipo: 'nuevo'
  },

  /* ── 8 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'su-nombre',
    fecha: '2026-09-08',
    modulos: ['ajustes', 'inicio'],
    titulo: 'Su nombre, escrito por usted y no deducido de su correo',
    queCambio:
      'En Ajustes, «Su nombre» queda guardado en su cuenta. Aparece en la barra lateral, en el saludo de Inicio y en la lista de usuarios de la firma.',
    tipo: 'nuevo'
  },
  {
    id: 'guia-propone-actuacion',
    fecha: '2026-09-08',
    modulos: ['workspace'],
    titulo: 'La guía propone la actuación, y si ninguna sirve usted la escribe',
    queCambio:
      'Sobre los hechos que ya escribió, la guía propone actuaciones de la rama con su razón, su término, su artículo y su autoridad. Si falta la suya, la escribe y queda disponible para toda la firma, marcada «sin norma verificada».',
    tipo: 'nuevo'
  },
  {
    id: 'work-sans',
    fecha: '2026-09-08',
    modulos: ['ajustes'],
    titulo: 'Work Sans, nueva letra para la interfaz y para el escrito',
    queCambio:
      'En Apariencia puede elegir Work Sans como letra de la aplicación. En Membrete también está disponible para el escrito, en pantalla, en el Word y en el PDF.',
    tipo: 'nuevo',
    comoUsarlo: 'formato'
  },
  {
    id: 'taller-guarda-solo',
    fecha: '2026-09-08',
    modulos: ['taller', 'workspace'],
    titulo: 'El taller guarda solo: texto, conversación, comentarios y versiones',
    queCambio:
      'Con la autorización de la firma, el taller se guarda dos segundos después de cada cambio y al cerrar la pestaña. En Redacción, el escrito generado queda guardado como borrador en el acto.',
    tipo: 'mejora',
    comoUsarlo: 'borradores'
  },
  {
    id: 'inicio-y-visita',
    fecha: '2026-09-08',
    modulos: ['inicio'],
    titulo: 'Pantalla de Inicio y visita guiada por la plataforma',
    queCambio:
      'Al entrar aparece Inicio, con lo último que dejó abierto, el plan, el saldo y las novedades. Desde ahí la visita guiada recorre cada módulo señalándolo en pantalla.',
    tipo: 'nuevo',
    comoUsarlo: 'inicio'
  },
  {
    id: 'modulos-por-firma',
    fecha: '2026-09-08',
    modulos: ['audit'],
    titulo: 'Módulos y funciones por firma',
    queCambio:
      'El operador puede apagar o encender cada módulo de una firma por encima de su plan, y funciones sueltas dentro de un módulo. La firma ve la puerta cerrada con su aviso en vez de un error.',
    tipo: 'nuevo',
    soloOperacion: true
  },

  /* ── 5 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'recargar-conserva-pantalla',
    fecha: '2026-09-05',
    modulos: ['inicio'],
    titulo: 'Recargar deja la pantalla donde estaba, y el logo lleva al inicio',
    queCambio:
      'Al recargar vuelve el borrador, la revisión, la audiencia o el artículo que tenía abierto. El logo lleva al inicio, y en el teléfono tirar hacia abajo recarga la pantalla.',
    tipo: 'mejora',
    comoUsarlo: 'movil'
  },
  {
    id: 'eliminar-usuario-o-firma',
    fecha: '2026-09-05',
    modulos: ['ajustes'],
    titulo: 'Puede eliminar su usuario o su firma desde Ajustes',
    queCambio:
      'En «Su cuenta», la zona de riesgo permite eliminar su usuario, que deja su trabajo en la firma. El socio administrador puede además eliminar la firma y todos sus datos, con contraseña y el nombre exacto de la firma, y ninguna de las dos se deshace.',
    tipo: 'nuevo'
  },
  {
    id: 'adjuntos-leidos',
    fecha: '2026-09-05',
    modulos: ['workspace'],
    titulo: 'Los adjuntos se leen y sus datos entran al escrito',
    queCambio:
      'Los PDF, Word, textos e imágenes que adjunte en Redacción se leen antes de redactar, y sus fechas, nombres y valores entran al escrito. Si un dato del adjunto contradice lo que usted escribió, prevalece lo suyo y la diferencia queda anotada.',
    tipo: 'nuevo'
  },
  {
    id: 'plan-vencido-solo-lectura',
    fecha: '2026-09-05',
    modulos: ['inicio', 'borradores', 'taller'],
    titulo: 'Con el plan vencido la aplicación queda en solo lectura',
    queCambio:
      'Una franja roja lo avisa y los módulos que crean trabajo se cubren con un aviso. Borradores y revisiones siguen abiertos para leer y exportar, y al renovar todo vuelve en el acto.',
    tipo: 'mejora'
  },
  {
    id: 'escrito-revisado-parrafos',
    fecha: '2026-09-05',
    modulos: ['taller'],
    titulo: 'El escrito revisado conserva sus párrafos y sus títulos en negrita',
    queCambio:
      'Los escritos subidos a revisión llegan con sus saltos de párrafo, y los ya revisados recuperan su estructura. Van en negrita los encabezados, las etiquetas, los ordinales y los nombres en mayúscula, también en las respuestas de la guía.',
    tipo: 'mejora'
  },

  /* ── 4 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'cuenta-de-cobro',
    fecha: '2026-09-04',
    modulos: ['ajustes'],
    titulo: 'Cuenta de cobro en PDF y confirmación por correo de cada pago',
    queCambio:
      'Cada pago del plan tiene su botón «Cuenta de cobro» en PDF. Quien paga recibe además un correo de confirmación.',
    tipo: 'nuevo',
    comoUsarlo: 'planes-y-pago'
  },
  {
    id: 'ajustes-completo',
    fecha: '2026-09-04',
    modulos: ['ajustes'],
    titulo: 'Ajustes completo: atajos, avisos, su cuenta y plan',
    queCambio:
      'Las entradas que decían «pronto» ya abren algo real. Están la lista de atajos de teclado, los avisos de este dispositivo, los datos de su cuenta y el plan de la firma.',
    tipo: 'nuevo'
  },
  {
    id: 'calculadoras-nuevas',
    fecha: '2026-09-04',
    modulos: ['tools'],
    titulo: 'Cuatro calculadoras nuevas, con su fuente oficial y exportación a Excel',
    queCambio:
      'Llegan indexación por IPC, intereses de mora, competencia por cuantía y calendario judicial. Cada una muestra la fórmula y la norma que la sustenta, y exporta a Excel.',
    tipo: 'nuevo',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'festivos-desde-la-ley',
    fecha: '2026-09-04',
    modulos: ['tools'],
    titulo: 'El contador de términos calcula los festivos desde la ley',
    queCambio:
      'La tabla de festivos escrita a mano tenía 17 en vez de 19 y omitía San Pedro y San Pablo. Ahora los días hábiles se calculan desde la norma, con la vacancia judicial incluida.',
    tipo: 'correccion',
    comoUsarlo: 'herramientas'
  },
  {
    id: 'instalar-y-avisos',
    fecha: '2026-09-04',
    modulos: ['ajustes', 'inicio'],
    titulo: 'Iureon se instala en el teléfono y en el computador, y avisa',
    queCambio:
      'Desde «Avisos» se instala la aplicación en Android, iPhone o PC y se activan las notificaciones de ese dispositivo. En iPhone se explican los pasos de Safari.',
    tipo: 'nuevo',
    comoUsarlo: 'movil'
  },
  {
    id: 'chat-de-soporte',
    fecha: '2026-09-04',
    modulos: ['soporte'],
    titulo: 'Chat de soporte dentro de la aplicación',
    queCambio:
      'Desde Soporte se abre una conversación con asunto y mensaje, y el hilo sigue ahí mismo. La atiende el operador de la plataforma, sin tiempo de respuesta prometido.',
    tipo: 'nuevo',
    comoUsarlo: 'soporte'
  },
  {
    id: 'tamano-de-letra',
    fecha: '2026-09-04',
    modulos: ['workspace', 'taller', 'audiencias'],
    titulo: 'Tamaño de letra ajustable en el taller, el borrador y los transcritos',
    queCambio:
      'Un control agranda o reduce el texto en pantalla del 85 % al 200 %, y cada pantalla recuerda su tamaño. El PDF y el Word salen con el formato del membrete, sin cambios.',
    tipo: 'nuevo'
  },
  {
    id: 'guia-verifica-sentencias',
    fecha: '2026-09-04',
    modulos: ['taller'],
    titulo: 'La guía del taller comprueba en la Corte las sentencias que usted nombra',
    queCambio:
      'Cada cita constitucional que escriba en el chat o en un comentario se consulta en el índice oficial de la Corte antes de que la guía responda. La discusión deja de ser memoria contra memoria.',
    tipo: 'mejora'
  },
  {
    id: 'manual-con-rutas',
    fecha: '2026-09-04',
    modulos: ['manual'],
    titulo: 'Cada artículo del manual dice dónde se hace, con pasos numerados',
    queCambio:
      'Los artículos abren con la ruta de pantallas y botones y traen pasos en orden y avisos por color. Se corrigieron frases que describían botones que no existían.',
    tipo: 'mejora'
  },
  {
    id: 'audiencias-mas-ancho',
    fecha: '2026-09-04',
    modulos: ['audiencias', 'entrevistas'],
    titulo: 'Audiencias y Entrevistas aprovechan la pantalla, y la lista no se corta',
    queCambio:
      'El contenido ya no deja espacio vacío a los lados en pantallas grandes. En el teléfono, cada fila de la lista de audiencias va en dos renglones en vez de cortarse a la derecha.',
    tipo: 'correccion'
  },

  /* ── 3 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'taller',
    fecha: '2026-09-03',
    modulos: ['taller', 'workspace'],
    titulo: 'El taller: corregir un escrito con el revisor al lado',
    queCambio:
      'Después de un informe, o desde «Taller» sobre un borrador, se abre el escrito con los pasajes objetados tachados para editarlo y conversar con la guía. «Volver a revisar» emite un informe nuevo sobre el texto corregido.',
    tipo: 'nuevo',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'resaltador-comentarios-versiones',
    fecha: '2026-09-03',
    modulos: ['taller'],
    titulo: 'Resaltador de colores, comentarios sobre pasajes y versiones comparables',
    queCambio:
      'Un pasaje se resalta, se tacha o recibe un comentario anclado, y la guía lee esas marcas. El escrito guarda versiones que se comparan palabra por palabra con el texto actual.',
    tipo: 'nuevo'
  },
  {
    id: 'autorizacion-de-guardado',
    fecha: '2026-09-03',
    modulos: ['taller'],
    titulo: 'El texto del taller se guarda con autorización expresa de la firma',
    queCambio:
      'Un socio administrador autoriza una vez, y desde entonces el texto y la conversación se guardan junto al informe. Sin autorización viven solo en la sesión, y la pantalla lo dice.',
    tipo: 'nuevo'
  },

  /* ── 2 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'revisar-un-escrito',
    fecha: '2026-09-02',
    modulos: ['taller'],
    titulo: 'Revisar un escrito ya redactado contra la ficha de la actuación',
    queCambio:
      'Suba la tutela, la demanda o el recurso que ya escribió y reciba un informe con lo que falta, lo que sobra y qué corregir. Las frases objetadas se citan literalmente con un reemplazo propuesto, y el informe queda guardado y se descarga en PDF y Word.',
    tipo: 'nuevo',
    comoUsarlo: 'revisar-escrito'
  },
  {
    id: 'revision-15-mb',
    fecha: '2026-09-02',
    modulos: ['taller'],
    titulo: 'La revisión acepta escritos de hasta 15 MB',
    queCambio:
      'Una tutela con anexos escaneados ya cabe, y el envío muestra su porcentaje. Si el informe no se puede entregar, no se cobra.',
    tipo: 'mejora'
  },
  {
    id: 'tipografias-del-escrito',
    fecha: '2026-09-02',
    modulos: ['ajustes'],
    titulo: 'Más tipografías para el escrito, y el PDF sale con la elegida',
    queCambio:
      'Se suman Tahoma, Plus Jakarta Sans, Manrope, Public Sans y Satoshi. La pantalla, el Word y el PDF obedecen la misma configuración del membrete.',
    tipo: 'mejora',
    comoUsarlo: 'formato'
  },
  {
    id: 'membrete-solo-lo-escrito',
    fecha: '2026-09-02',
    modulos: ['ajustes'],
    titulo: 'El membrete imprime solo lo que la firma escribió',
    queCambio:
      'Una firma sin membrete configurado exportaba un encabezado de muestra con datos inventados. Ahora el escrito lleva únicamente el nombre de la firma y su NIT si lo tiene.',
    tipo: 'correccion',
    comoUsarlo: 'formato'
  },
  {
    id: 'extracto-del-saldo',
    fecha: '2026-09-02',
    modulos: ['ajustes'],
    titulo: 'Extracto mensual del saldo, y la cifra de la barra se actualiza sola',
    queCambio:
      'En Saldo se elige un mes y se ven entradas, salidas por concepto y saldo final, con un comprobante imprimible. La cifra de la barra lateral se relee sola, sin importar qué abogado gastó.',
    tipo: 'nuevo',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'soporte-movil-articulos',
    fecha: '2026-09-02',
    modulos: ['soporte'],
    titulo: 'En el teléfono, las preguntas de Soporte abren su artículo',
    queCambio:
      'Los atajos de «Antes de escribir» eran texto plano en el teléfono. Ahora llevan directo al artículo del manual que responde cada pregunta.',
    tipo: 'correccion',
    comoUsarlo: 'soporte'
  },

  /* ── 1 de septiembre de 2026 ───────────────────────────────────────────── */
  {
    id: 'segunda-entrevista',
    fecha: '2026-09-01',
    modulos: ['entrevistas'],
    titulo: 'La segunda entrevista sabe qué respondió la primera',
    queCambio:
      'Cuando una persona vuelve, el guion marca lo que ya se cubrió en entrevistas anteriores. En el teléfono el guion aparece al terminar de transcribir.',
    tipo: 'mejora',
    comoUsarlo: 'entrevista'
  },
  {
    id: 'recargar-abre-wompi',
    fecha: '2026-09-01',
    modulos: ['ajustes'],
    titulo: 'Recargar saldo abre Wompi directamente',
    queCambio:
      'El paso al pago navega a Wompi en vez de enviar un formulario oculto. Si el navegador bloquea la redirección, queda un enlace de respaldo.',
    tipo: 'correccion',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'rama-urbanismo',
    fecha: '2026-09-01',
    modulos: ['catalogo'],
    titulo: 'Rama de Urbanismo en el catálogo',
    queCambio: 'Llegan seis actuaciones de licencias y sanciones urbanísticas. Con ellas ninguna rama del catálogo queda vacía.',
    tipo: 'nuevo'
  },

  /* ── Agosto de 2026 ────────────────────────────────────────────────────── */
  {
    id: 'rediseno-telefono',
    fecha: '2026-08-29',
    modulos: ['inicio'],
    titulo: 'La aplicación se rediseñó para el teléfono',
    queCambio:
      'Hay barra inferior con los módulos de uso diario y «Más» para el resto. Cada módulo tiene su pantalla de teléfono, y los diálogos suben como hojas desde abajo.',
    tipo: 'nuevo',
    comoUsarlo: 'movil'
  },
  {
    id: 'consejo-de-estado',
    fecha: '2026-08-29',
    modulos: ['search'],
    titulo: 'El Consejo de Estado entra al descubrimiento de jurisprudencia',
    queCambio:
      'Cuando el corpus no alcanza, el Buscador consulta la Corte Constitucional, la Corte Suprema y el Consejo de Estado. El texto es el extracto de la relatoría y así se rotula.',
    tipo: 'nuevo',
    comoUsarlo: 'buscador'
  },
  {
    id: 'grabaciones-avance-y-onda',
    fecha: '2026-08-29',
    modulos: ['audiencias', 'entrevistas'],
    titulo: 'La subida muestra su avance, y la onda de audio mide el sonido real',
    queCambio:
      'Enviar una grabación muestra el porcentaje y borrar una audiencia es inmediato. La baja confianza se marca solo en las palabras dudosas, y el acta se exporta con o sin minutos.',
    tipo: 'mejora',
    comoUsarlo: 'audiencia'
  },
  {
    id: 'ficha-del-cliente',
    fecha: '2026-08-29',
    modulos: ['entrevistas'],
    titulo: 'Ficha del cliente, guion sugerido y hechos clave en la entrevista',
    queCambio:
      'La entrevista empieza por quién está al frente, con su contacto y el tratamiento de datos. El guion se tacha con lo que se dijo, y una intervención se puede marcar como hecho clave.',
    tipo: 'nuevo',
    comoUsarlo: 'datos-cliente'
  },
  {
    id: 'manual-y-soporte',
    fecha: '2026-08-28',
    modulos: ['manual', 'soporte'],
    titulo: 'Manual de uso y Soporte, dentro de la aplicación',
    queCambio:
      'El manual está escrito por tarea y se lee aunque nada más cargue. Soporte explica cada vía de contacto y qué esperar de ella.',
    tipo: 'nuevo'
  },
  {
    id: 'catalogo-794',
    fecha: '2026-08-28',
    modulos: ['catalogo'],
    titulo: 'El catálogo pasa de 674 a 794 actuaciones',
    queCambio:
      'Entran garantías mobiliarias, embargos y remate, propiedad horizontal, arrendamiento, cobro coactivo, títulos valores y conciliación, entre otras. Cada ficha llega con su norma y su fuente.',
    tipo: 'nuevo'
  },
  {
    id: 'orientacion-orden-y-secciones',
    fecha: '2026-08-28',
    modulos: ['orientacion', 'catalogo'],
    titulo: 'Orientación ordena por el término más corto, y la curaduría muestra las secciones',
    queCambio:
      'Los resultados de Orientación se ordenan por el plazo que vence primero. En Catálogo se ven las secciones obligatorias de cada ficha, junto al término y la fuente.',
    tipo: 'mejora',
    comoUsarlo: 'curaduria'
  },
  {
    id: 'pdf-con-diseno-de-la-firma',
    fecha: '2026-08-28',
    modulos: ['workspace', 'audiencias', 'entrevistas'],
    titulo: 'Los PDF del escrito y de las actas adoptan el diseño de la firma',
    queCambio:
      'El escrito sale con membrete, logo, tipografía y paginación reales. Las actas de entrevista y de audiencia tienen cada una su papel, con intervinientes y desarrollo por minuto.',
    tipo: 'mejora',
    comoUsarlo: 'exportar'
  },
  {
    id: 'formato-no-borra-secciones',
    fecha: '2026-08-28',
    modulos: ['workspace'],
    titulo: 'El formato de la firma ya no borra secciones obligatorias del escrito',
    queCambio:
      'El formato configurado en Membrete eliminaba secciones que la norma exige. Ahora se conservan, y el rol elegido ya no se pierde al cambiar de rama.',
    tipo: 'correccion'
  },
  {
    id: 'usuarios-y-auditoria',
    fecha: '2026-08-27',
    modulos: ['ajustes', 'audit'],
    titulo: 'Usuarios de la firma, consumo por abogado y auditoría inalterable',
    queCambio:
      'Los socios administran las cuentas, ven cuánto consume cada abogado y deciden quién verifica términos. Generar, exportar, verificar y recargar quedan escritos con quién y cuándo, y ese registro no se puede modificar.',
    tipo: 'nuevo',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'membrete-de-la-firma',
    fecha: '2026-08-27',
    modulos: ['ajustes', 'workspace'],
    titulo: 'Membrete de la firma: logo, datos y formato hasta el escrito',
    queCambio:
      'El membrete es de la firma, no de cada escrito. El Word y el PDF obedecen el tamaño y el interlineado configurados.',
    tipo: 'nuevo',
    comoUsarlo: 'formato'
  },
  {
    id: 'resumen-de-transcripcion',
    fecha: '2026-08-27',
    modulos: ['audiencias', 'entrevistas'],
    titulo: 'Resumen y hechos de cada transcripción, anclados a su minuto y su voz',
    queCambio:
      'Al abrir una transcripción se pueden pedir el resumen y los hechos, cada uno con su minuto y quién lo dijo. La entrevista pide la autorización del cliente antes de grabar y cierra en una decisión sobre el caso.',
    tipo: 'nuevo',
    comoUsarlo: 'entrevista'
  },
  {
    id: 'buscador-dos-bloques',
    fecha: '2026-08-27',
    modulos: ['search'],
    titulo: 'Lo curado y lo automático son dos bloques en el Buscador',
    queCambio:
      'La jurisprudencia verificada por la firma y la hallada automáticamente se muestran separadas. La Corte Suprema entra con casación civil, laboral y penal.',
    tipo: 'mejora',
    comoUsarlo: 'buscador'
  },
  {
    id: 'orientacion-desde-los-hechos',
    fecha: '2026-08-27',
    modulos: ['orientacion', 'workspace'],
    titulo: 'Orientación desde los hechos, con historial',
    queCambio:
      'Describa el caso y reciba las actuaciones posibles con su término. Cada consulta queda en un historial, y los hechos contados llegan al borrador sin volver a escribirlos.',
    tipo: 'nuevo',
    comoUsarlo: 'orientacion'
  },
  {
    id: 'calculadoras-no-inventan',
    fecha: '2026-08-27',
    modulos: ['tools'],
    titulo: 'Las calculadoras dejan de inventar cifras',
    queCambio:
      'Ninguna calculadora rellena una fecha o una cifra que no tenga. Si falta un dato, lo pide.',
    tipo: 'correccion'
  },
  {
    id: 'saldo-en-escritos-y-proveedores',
    fecha: '2026-08-27',
    modulos: ['ajustes', 'privacidad'],
    titulo: 'El saldo se traduce a escritos, y Privacidad lista los proveedores',
    queCambio:
      'El panel de Saldo dice cuántos escritos alcanza el saldo actual. Privacidad lista los proveedores que tocan los datos de la firma, en un formato que se puede mostrar a un cliente.',
    tipo: 'nuevo',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'once-ramas',
    fecha: '2026-08-26',
    modulos: ['catalogo'],
    titulo: 'Once ramas nuevas en el catálogo',
    queCambio:
      'Entran arbitraje, insolvencia, ambiental, propiedad intelectual, policivo, disciplinario, aduanero, agrario, familia administrativa y el derecho de petición. El lado del despacho en familia pasa de 6 a 27 actuaciones.',
    tipo: 'nuevo'
  },
  {
    id: 'recarga-por-wompi',
    fecha: '2026-08-26',
    modulos: ['ajustes'],
    titulo: 'Recarga de saldo por Wompi',
    queCambio: 'La firma recarga desde el panel de Saldo. El saldo se acredita cuando Wompi confirma el pago.',
    tipo: 'nuevo',
    comoUsarlo: 'roles-saldo'
  },
  {
    id: 'entrevistas-pantalla-propia',
    fecha: '2026-08-25',
    modulos: ['entrevistas'],
    titulo: 'Entrevistas con pantalla propia: graba en la aplicación',
    queCambio:
      'La entrevista deja de compartir la pantalla de audiencias. Dice con quién fue, graba desde el navegador o acepta un archivo.',
    tipo: 'nuevo',
    comoUsarlo: 'entrevista'
  },
  {
    id: 'transcrito-exporta',
    fecha: '2026-08-25',
    modulos: ['audiencias'],
    titulo: 'El transcrito se exporta a Word y PDF, y cada voz lleva nombre y rol',
    queCambio:
      'Cada voz se nombra con su rol procesal al lado, y las propuestas se conservan al reabrir. La firma ve qué transcripciones tiene almacenadas y puede borrarlas.',
    tipo: 'nuevo',
    comoUsarlo: 'audiencia'
  },
  {
    id: 'transcripcion-por-voces',
    fecha: '2026-08-18',
    modulos: ['audiencias'],
    titulo: 'Transcripción de audiencias que separa quién habla',
    queCambio:
      'La grabación se transcribe con vocabulario jurídico colombiano, separando voces con una intervención por turno. Se puede nombrar cada voz, oír el audio, corregir palabras, dividir una intervención y moverla a otra voz. La grabación se borra al transcribir y el transcrito queda guardado.',
    tipo: 'nuevo',
    comoUsarlo: 'audiencia'
  }
];
