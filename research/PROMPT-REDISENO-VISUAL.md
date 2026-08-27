# Prompt para Claude Design — rediseño visual completo de Iureon

> Copia todo lo que está bajo la línea y pégalo en Claude Design.
> Los archivos citados están en `C:\Iureon\frontend\src`.

---

Necesito rediseñar la interfaz completa de **Iureon**, un SaaS B2B colombiano de LegalTech. No es un cambio de paleta: la aplicación creció por módulos y hoy se ve desordenada, sin jerarquía y sin sistema. Quiero un sistema visual entero, y las pantallas resueltas dentro de él.

## Quién la usa, y en qué estado

Un abogado litigante colombiano, casi siempre bajo presión de un término procesal que se vence. Muchos son juniors. Trabajan en portátil, en un despacho, entre audiencias. **No están explorando la app: están tratando de sacar un escrito antes de una hora concreta.**

Dos consecuencias de diseño:

1. Cada elemento que no ayuda a producir el escrito compite con el que sí.
2. La app afirma cosas sobre el derecho —términos de caducidad, artículos, autoridad competente— y **cuando algo no está verificado tiene que verse distinto**, sin volverse una alarma que se aprenda a ignorar.

## Qué hace el producto

Redacta escritos jurídicos con un pipeline de tres modelos de IA, apoyado en un catálogo propio de **651 actuaciones procesales verificadas contra el texto oficial de la norma** (artículo, término de caducidad, autoridad competente, secciones obligatorias), un corpus de jurisprudencia y acceso en vivo a los registros de la Corte Constitucional y la Corte Suprema. También transcribe audiencias con separación de interlocutores.

## Estado actual: qué hay y qué está mal

**Stack:** React + Tailwind CSS + `lucide-react`. Sin librería de componentes. Un solo tema claro. Paleta actual sobre `blue-950` y grises `slate`.

**No hay sistema.** Los tamaños de texto van de `text-[10px]` a `text-[13px]` elegidos uno por uno; los bordes son `slate-100`, `slate-200` y `slate-200/80` sin criterio; los radios mezclan `rounded-lg`, `rounded-xl` y `rounded-md` en el mismo bloque. **Empieza por definir el sistema —escala tipográfica, espaciado, color, radios, elevación— y después resuelve las pantallas con él.**

### Las nueve secciones (barra lateral, hoy sin agrupar)

| Sección | Qué es |
|---|---|
| **Redacción** | El taller: panel de control + lienzo del documento |
| **Orientación** | Describe hechos en lenguaje corriente, recibe actuaciones sugeridas |
| **Audiencias** | Transcripción con separación de interlocutores |
| **Entrevistas** | Transcripción de entrevistas a clientes |
| **Búsqueda** | Jurisprudencia y doctrina sobre el corpus |
| **Catálogo** | La firma verifica un término una vez y aplica a todos sus escritos |
| **Herramientas** | Calculadoras y utilidades procesales |
| **Auditoría** | Registro de lo que hizo la firma |
| **Privacidad** | Registro de subencargados del tratamiento de datos |

Nueve elementos planos, sin jerarquía, y no todos se usan con la misma frecuencia: Redacción y Orientación son diarias; Privacidad y Auditoría se consultan una vez al mes.

### El problema más agudo: el panel de redacción

`modules/workspace/components/AgentPanelLeft.tsx` — columna izquierda de ancho fijo que apila, todo con el mismo peso visual:

| Control | Qué es |
|---|---|
| Selector de **rol** (3 pestañas) | Firma/Litigante · Juez/Despacho · Secretaría |
| Selector de **rama** | 22 opciones (Civil, Laboral, Penal, Administrativo…) |
| Selector de **tipo de documento** | Hasta ~90 opciones según la rama |
| Dos avisos | Rama sin catálogo · actuación sin catalogar |
| Área de instrucción | El textarea donde el abogado describe el caso |
| Adjuntar archivos | Zona punteada |
| Botón de generar | **La acción principal** |

Todos los `<label>` usan 12px y el mismo gris; los tres selectores tienen ancho idéntico. **La acción principal y una configuración que se toca una vez pesan lo mismo.** La pregunta a responder es cómo separar *"configurar de qué se trata este escrito"* (se toca al empezar) de *"decirle qué hacer"* (donde vive el trabajo).

## Lo que quiero que produzcas

**Primero, el sistema:**

1. **Escala tipográfica** — cuántos tamaños, cuáles, para qué sirve cada uno.
2. **Paleta** — neutros, color de marca, y los tres colores semánticos (ver abajo). Con contraste AA verificado.
3. **Espaciado, radios y elevación** — una escala corta, no doce valores.
4. **Los componentes base**: botón (primario/secundario/fantasma), campo de texto, selector, pestaña, tarjeta, aviso, chip de estado, tabla, estado vacío, estado de carga.

**Después, las pantallas, en 1440px.** Son quince más un patrón de modal; si es demasiado para una sola entrega, priorízalas en este orden y dilo: el taller de redacción, el modal, la barra lateral y Orientación son las que más devuelven.

5. **El taller de redacción**: panel de control + lienzo del documento, resolviendo la saturación superior.
6. **Orientación** (`modules/catalog/components/TriageView.tsx`): el abogado escribe hechos y recibe hasta 6 actuaciones sugeridas, cada una con su término, su artículo y su autoridad. Incluye el estado "el catálogo no reconoce nada", que es una respuesta legítima y no un error.
7. **La barra lateral con las nueve secciones**, agrupadas de forma que se entienda sin leerlas todas.
8. **Transcripción de audiencia**: lista de intervenciones con interlocutor, texto editable, y reproductor para verificar mientras se corrige.
9. **Búsqueda de jurisprudencia**: resultados con providencia, corporación, magistrado ponente y fragmento; debe distinguirse lo **curado** (que un abogado leyó) de lo llegado por descubrimiento automático.
10. **Catálogo / curaduría**: la ficha de una actuación con su norma, término, autoridad y secciones obligatorias, y el flujo de verificarla.
11. **Entrevista al cliente** (`modules/clients/components/InterviewView.tsx`) — **no es la pantalla de audiencias con otro título.** Una audiencia llega como archivo que el juzgado publicó; una entrevista pasa en la oficina, ahora, con una persona sentada al frente: empieza por quién es, se GRABA en vivo en vez de subirse, y de ella sale un caso que se toma o se declina. Necesita: selector de cliente, grabador en vivo con su estado, la transcripción con roles editables, y el puente a redacción.

12. **Auditoría** (`modules/audit/components/AuditView.tsx`) — el registro de lo que hizo la firma. Es una tabla densa que se consulta cuando algo ya pasó, así que necesita filtros que sirvan y una densidad alta. No es un tablero de métricas.

13. **Privacidad y seguridad** (`modules/privacy/components/SubprocessorsView.tsx`) — el registro de subencargados. **Es un diferenciador comercial, no una página legal escondida.** Bajo la Ley 1581 de 2012 la firma es *responsable* de los datos de sus clientes e Iureon su *encargado*, así que cada proveedor listado es un SUBENCARGADO DE LA FIRMA. Un abogado a quien su cliente le pregunte "¿quién más ha visto mi contrato?" no puede responder "un proveedor tecnológico". La lista se **deriva de la configuración real del sistema**, así que no puede quedar desactualizada — y eso hay que poder decirlo en la pantalla. Diséñala para que se pueda mostrar en una reunión de ventas.

14. **Herramientas** (`modules/tools/components/ToolsView.tsx`) — calculadoras y utilidades procesales. Hoy es una cuadrícula sin criterio. Necesita una forma que aguante crecer sin volverse un cajón de sastre.

15. **Login** (`LoginPortalView.tsx`) — es la primera impresión del producto.

16. **Saldo y recarga**: saldo en pesos, historial y recarga mínima de $100.000 COP.

17. **EL PATRÓN DE MODAL, que es donde más se nota el desorden.** Hay **siete** modales sin un patrón común: liquidación laboral, suscripción de la firma, cálculo de términos procesales, cargar archivos, sugerencia de jerga, borradores guardados y detalle de auditoría. Cada uno resuelve su cabecera, su cierre y sus botones a su manera. **Diseña UN modal** —cabecera, cuerpo, pie de acciones, comportamiento con contenido largo, tamaños S/M/L— y muestra dos de los siete resueltos con él. Ese solo cambio arregla buena parte de la sensación de desorden.

## El corazón del producto: tres estados de una afirmación jurídica

Esto no es decoración. Es la diferencia entre un dato comprobado y una suposición del modelo, y **es la razón por la que el producto vale algo**:

- **Verificado** — término y artículo comprobados contra la norma oficial, con enlace a la fuente.
- **No verificado** — nadie lo comprobó. El abogado **no debe darlo por cierto**.
- **No caduca** — no hay término. Distinto de no saberlo, y confundirlos es grave.

Deben distinguirse **sin depender solo del color** (hay usuarios con daltonismo, y estos avisos son sobre plazos que vencen). Tienen que verse en una ficha, en una lista y en línea dentro de un párrafo.

## La marca ya existe — no la rediseñes

Hay un sistema de marca generado desde una sola geometría, en `frontend/public/brand/`: isotipo, wordmark, imagotipos horizontal y vertical, versiones para fondo claro y oscuro, y monocromo. Colores de marca **`#14294A` (azul marino)** y **`#C8A046` (oro)**, con hueso `#F4F1EA` y carbón `#141821`.

**Úsalos.** El eslogan "SMART JUSTICE" y el año fundacional existen en piezas aparte, deliberadamente: no van en la marca que se usa dentro de la aplicación, porque a veinte píxeles de alto un renglón de eslogan es una franja gris que no comunica nada.

Lo que sí quiero de ti es **cómo se integra esa marca en la interfaz**: qué versión va en la cabecera, a qué tamaño, con cuánto aire alrededor.

## Restricciones reales, no negociables

- **React + Tailwind.** Entrega clases de Tailwind utilizables, no CSS suelto.
- **Iconos de `lucide-react`** únicamente.
- **Sin librería de componentes** (nada de shadcn, MUI, Chakra). El proyecto no tiene dependencias de UI y quiero que siga así.
- **Densidad alta, no espaciosa.** El abogado necesita ver el documento y los controles a la vez. Un rediseño que respire mucho y obligue a hacer scroll empeora el producto.
- **Debe leerse como herramienta profesional seria.** Es software que produce documentos que se radican ante un juez.
- **Español de Colombia**, registro neutro y profesional. Sin jerga regional.

## Lo que NO quiero

- Que la urgencia se traduzca en rojos y alarmas. La app debe transmitir **calma competente**, no ansiedad.
- Ilustraciones, mascotas, degradados decorativos, ni "espacio para respirar" que empuje el trabajo fuera de la pantalla.
- Tratar los avisos de verificación como decoración.
- Modo oscuro por ahora. Un solo tema, bien resuelto.

## Cómo quiero la entrega

Para cada pantalla: el artboard, y debajo **una frase por decisión no obvia** — por qué ese elemento quedó donde quedó. Voy a llevar esto a código y necesito el criterio, no solo el resultado.

Si algo de lo que pido te parece equivocado, dilo y propón la alternativa. Prefiero discutir el criterio ahora que descubrirlo implementando.
