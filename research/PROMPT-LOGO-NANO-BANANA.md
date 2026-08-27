# Logo de Iureon — prompt para Nano Banana y ruta a SVG

## Cómo se usa este documento

1. Lees el **contexto de marca**.
2. Corres las **cuatro tandas de exploración** en Nano Banana. Escoges UNA dirección.
3. Con esa dirección, generas las **variantes de color** (claro y oscuro).
4. Pasas todo a **SVG** con el procedimiento de la última sección.
5. Del SVG salen las **doce piezas finales** por exportación, no por generación.

**El orden importa.** Generar las doce piezas en Nano Banana daría doce dibujos parecidos pero distintos, y una marca cuyas versiones no coinciden entre sí no es una marca. Se genera **una** forma, se vectoriza **una** vez, y de ahí salen todas.

---

## Contexto de marca

**Iureon** es un SaaS colombiano que redacta escritos jurídicos con IA, apoyado en un catálogo de actuaciones procesales verificadas contra el texto oficial de la norma. Su promesa no es "más rápido": es **que lo que afirma sobre el derecho está comprobado**.

El nombre viene de *iure* (latín: *de derecho*, conforme a la ley) más una terminación que suena a sistema.

Debe transmitir, en orden: **rigor · confianza · precisión**. No: innovación disruptiva, velocidad, magia.

El público son abogados litigantes colombianos. Un logo que parezca startup de cripto les resta credibilidad; uno que parezca bufete de 1950 resta lo contrario. El punto medio es **instrumento de precisión**.

**Lo que hay hoy:** el favicon (`frontend/public/favicon.svg`) es **un rayo morado genérico** con desenfoques y elipses de relleno. No es una marca de Iureon: es un ícono prestado.

---

## Paso 1 — Prompt base (va en las cuatro tandas)

> Professional vector-style logo mark for "Iureon", a Colombian legal-technology company. Flat design, geometric, precise. Single mark on a plain white background, centered, generous margin, no text, no letters, no words. Solid colors only — no gradients, no glows, no drop shadows, no 3D, no bevels, no texture. Clean crisp edges suitable for later vectorization. The mark must remain legible when reduced to 32×32 pixels. Serious and trustworthy, the visual register of a precision instrument, not of a consumer app. Deep navy blue and warm off-white, with at most one accent color.

Añade **uno** de los cuatro bloques siguientes. Corre las tandas por separado: una sola petición pidiendo "varias opciones" devuelve variaciones de la misma idea.

### Tanda 1 — La balanza, abstraída

> The concept is judicial balance, radically abstracted: not a literal scales-of-justice illustration, but two geometric masses in visible equilibrium, reduced to the fewest possible shapes. Think of a mathematical or architectural sign of balance rather than a courtroom prop. Avoid gavels, columns, pillars, blindfolds and any classical Greco-Roman ornament.

*Por qué:* la balanza se lee de inmediato en Colombia. El riesgo es el cliché — de ahí la abstracción radical.

### Tanda 2 — La marca de verificación

> The concept is verification: a mark that reads as "this has been checked against the source". A geometric seal, a stamp, or a check contained within a disciplined shape. It should feel like an official endorsement rather than a user-interface tick. Avoid literal rubber-stamp textures, ribbons, badges with laurel wreaths, and anything resembling a supermarket quality label.

*Por qué:* es la promesa real del producto — no que redacta, sino que lo verificado está verificado.

### Tanda 3 — Monograma de la I

> The concept is a monogram built from the letter I of Iureon, treated as pure geometry: a single strong vertical element that also suggests a column of a document, a margin rule, or the spine of a legal file. Extremely reduced — three or four shapes at most. It must not look like a lowercase L, a number 1, or an exclamation mark.

*Por qué:* un monograma envejece bien y funciona a cualquier tamaño. La advertencia sobre la l/1 es el fallo típico de las marcas con I.

### Tanda 4 — El artículo, unidad del derecho

> The concept is the article: the numbered paragraph that is the atomic unit of written law. Abstract horizontal text lines organized with visible structure, or a paragraph mark reduced to geometry. It should suggest an ordered legal text rather than a generic document icon. Avoid page-with-folded-corner icons, folders and clipboard shapes.

*Por qué:* todo el producto gira sobre el artículo. Es el concepto más específico y el que menos se parece a otras marcas legaltech.

---

## Paso 2 — Variantes de color, con la dirección ya escogida

**Modo claro y modo oscuro no son la misma marca invertida.** Un trazo fino que se lee sobre blanco desaparece sobre negro, y un azul que funciona sobre blanco vibra sobre fondo oscuro. Hay que pedir las dos y ajustar la segunda.

> Same mark, exact same geometry and proportions, no changes to the shapes. Version A: for light backgrounds — deep navy fill on a plain white background. Version B: for dark backgrounds — the mark rendered in warm off-white on a deep charcoal background, with stroke weights slightly increased so thin elements do not disappear at small sizes. Version C: single flat black on white, no color at all.

**La versión C es la prueba de fuego.** Si la marca depende del color, no es una marca: va a ir en un sello, en un fax de juzgado y en un membrete impreso a una tinta.

---

## Paso 3 — Prompt para el wordmark (opcional)

El wordmark **no debe generarse con IA**: los generadores de imagen escriben mal las letras y una "Iureon" con la R torcida arruina la marca. Se compone con una tipografía real.

Recomendación para una legaltech seria: una grotesca con carácter (Inter, Söhne, Neue Haas) o una serif contemporánea si se quiere más autoridad (Freight, Tiempos). Ajustar el interletrado a mano y, si acaso, intervenir **una** letra.

Si aun así quieres explorar forma tipográfica en Nano Banana, úsalo solo como referencia visual y **nunca como archivo final**.

---

## Las doce piezas finales

Todas salen del **mismo SVG maestro**, exportadas. No se generan por separado.

### Nomenclatura, para que no haya confusión

| Término | Qué es |
|---|---|
| **Isotipo** | El símbolo solo, sin texto |
| **Logotipo / wordmark** | El nombre "Iureon" en tipografía, sin símbolo |
| **Imagotipo** | Símbolo + texto **separables** (uno al lado del otro, o apilados) |
| **Isologo** | Símbolo + texto **fundidos**, inseparables |

Los "lockups" horizontal y vertical que pediste son **imagotipos**. Si además quieres una versión fundida, esa es el isologo.

### La lista

| # | Pieza | Fondo | Formato | Uso |
|---|---|---|---|---|
| 1 | **Favicon** | claro | SVG + PNG 16/32/48 | Pestaña del navegador |
| 2 | **Favicon** | oscuro | SVG | Navegador en modo oscuro |
| 3 | **Ícono de app móvil** | — | PNG 1024×1024 | App Store / Play Store |
| 4 | **Isotipo** | claro | SVG | Avatares, marcas de agua |
| 5 | **Isotipo** | oscuro | SVG | Lo mismo, sobre fondo oscuro |
| 6 | **Wordmark** | claro | SVG | Cuando el símbolo ya está presente |
| 7 | **Wordmark** | oscuro | SVG | Lo mismo |
| 8 | **Imagotipo horizontal** | claro | SVG | Cabecera de la app, membrete |
| 9 | **Imagotipo horizontal** | oscuro | SVG | Lo mismo |
| 10 | **Imagotipo vertical** | claro | SVG | Espacios estrechos, sellos |
| 11 | **Imagotipo vertical** | oscuro | SVG | Lo mismo |
| 12 | **Monocromo negro** | claro | SVG | Impresión a una tinta, sellos, fax |

**Detalle técnico que ahorra trabajo:** para el favicon puedes tener **un solo SVG** que responda al modo del sistema, con `<style>@media (prefers-color-scheme: dark){...}</style>` dentro del propio archivo. Chrome y Firefox lo respetan. Aun así conviene tener las dos versiones sueltas, porque hay sitios que no soportan SVG.

**El ícono de app móvil no es el favicon ampliado.** iOS recorta las esquinas y aplica su propia máscara; Android puede pedir icono adaptativo con capas separadas. El símbolo debe ir con margen interno generoso o queda mutilado.

---

## Paso 4 — De PNG a SVG: cómo se hace realmente

Nano Banana entrega **PNG**. Un logo necesita SVG. Hay tres caminos y **no valen lo mismo**.

### Camino A — Reconstrucción a mano (el bueno)

Se abre el PNG como referencia en Figma, Illustrator o Inkscape, y **se vuelve a dibujar encima** con formas reales: círculos que son círculos, rectas que son rectas, curvas con los nodos que corresponden.

- **Resultado:** el mejor posible. Diez o veinte nodos, geometría exacta, escalable a cualquier tamaño.
- **Costo:** una o dos horas si la marca es geométrica, que es justo lo que estos prompts piden.
- **Es lo que hace un diseñador.** El PNG es el boceto, no la pieza.

**Puedo hacer esto por ti:** me pasas el PNG que escojas y lo reconstruyo como SVG escrito a mano, con las formas nombradas y las proporciones limpias. Para una marca geométrica plana funciona bien, y queda un archivo que se entiende y se edita.

### Camino B — Vectorización automática (aceptable como punto de partida)

- **Inkscape** (gratis): `Trayecto → Vectorizar mapa de bits`. Para una marca plana usa *Colores*, 2 a 4 pasadas, y sube el suavizado.
- **Illustrator**: `Calco de imagen → Logotipo en blanco y negro`, luego `Expandir`.
- **En línea**: vectorizer.ai, SVGcode.

**El problema, y es real:** el trazado automático sigue el borde suavizado del PNG, así que un círculo perfecto sale como una curva de cuatrocientos nodos ligeramente ondulada. Se ve bien a tamaño grande y **se deshace a 32px**, que es exactamente donde el favicon vive. Sirve para verlo rápido, no para publicar.

Si vas por aquí: genera el PNG **lo más grande posible** (2048px o más) y con el fondo perfectamente blanco. Cuanto más limpio el original, menos ruido en el trazado.

### Camino C — Pedirle el SVG a un modelo de texto (no a Nano Banana)

Los modelos de imagen no producen SVG, pero **los de texto sí escriben código SVG**. Le describes la forma —o le pasas el PNG— y devuelve el archivo. Para geometría simple da resultados limpios porque escribe `<circle>` y `<path>` de verdad, no un calco.

Es el Camino A hecho con otra herramienta, y para estos cuatro conceptos es viable.

### Cómo verificar el SVG antes de darlo por bueno

1. **Ábrelo a 32×32.** Si se ensucia, no sirve. Casi todo falla aquí.
2. **Cuenta los nodos.** Una marca geométrica limpia tiene decenas, no cientos. Si tiene cientos, es un calco automático.
3. **Míralo en negro plano.** Si depende del color, no es un logo.
4. **Ábrelo en un editor de texto.** Debe leerse: formas nombradas, coordenadas redondas, sin filtros ni máscaras. El favicon actual de Iureon tiene dieciséis desenfoques gaussianos — eso es un dibujo exportado, no una marca.
5. **Dibújalo de memoria.** Si no puedes, tiene demasiadas formas.
