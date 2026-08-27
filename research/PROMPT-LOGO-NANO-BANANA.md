# Prompt para Nano Banana (Gemini) — logo de Iureon

## Antes de usarlo: qué esperar y qué no

**Nano Banana genera imágenes, no vectores.** Lo que vas a recibir es un PNG, no un SVG. Para un logo eso importa:

- Sirve para **explorar concepto y forma** — es su mejor uso, y es rápido.
- **No sirve como archivo final.** Un logo tiene que verse nítido a 32px en la pestaña del navegador y a un metro en un pendón, y eso solo lo da un vector.
- El camino realista: generas varias opciones, escoges una, y esa se **vectoriza** — a mano en Figma o Illustrator, o pidiéndome que la reconstruya como SVG a partir de la imagen.
- **Cuidado con el texto.** Los generadores de imagen escriben mal las letras. Pide la marca **sin texto** y la palabra "Iureon" se compone aparte con una tipografía real.

Genera **cuatro tandas separadas**, una por concepto. Una sola petición pidiendo "opciones" devuelve variaciones de la misma idea.

---

## Contexto de marca (léelo antes de elegir concepto)

**Iureon** es un SaaS colombiano que redacta escritos jurídicos con IA, apoyado en un catálogo de actuaciones procesales verificadas contra el texto oficial de la norma. Su promesa no es "más rápido": es **que lo que afirma sobre el derecho está comprobado**.

El nombre viene de *iure* (latín: *de derecho*, lo que es conforme a la ley) más una terminación que suena a sistema.

Lo que la marca debe transmitir, en orden: **rigor · confianza · precisión**. No: innovación disruptiva, velocidad, magia.

El público son abogados litigantes colombianos. Un logo que parezca startup de criptomonedas les resta credibilidad; uno que parezca bufete de 1950 resta lo contrario. El punto está en el medio: **instrumento de precisión**.

---

## Prompt base (va en las cuatro tandas)

> Professional vector-style logo mark for "Iureon", a Colombian legal-technology company. Flat design, geometric, precise. Single mark on a plain white background, centered, generous margin, no text, no letters, no words. Solid colors only — no gradients, no glows, no drop shadows, no 3D, no bevels. Clean crisp edges suitable for later vectorization. The mark must remain legible when reduced to 32×32 pixels. Serious and trustworthy, the visual register of a precision instrument, not of a consumer app. Deep navy blue and warm off-white, with at most one accent color.

Añade a ese texto **uno** de los cuatro bloques siguientes.

---

### Tanda 1 — La balanza, pero abstraída

> The concept is judicial balance, radically abstracted: not a literal scales-of-justice illustration, but two geometric masses in visible equilibrium, reduced to the fewest possible shapes. Think of a mathematical or architectural sign of balance rather than a courtroom prop. Avoid gavels, columns, pillars, blindfolds and any classical Greco-Roman ornament.

*Por qué:* la balanza es el símbolo jurídico universal y en Colombia se lee de inmediato. El riesgo es el cliché — de ahí la abstracción radical.

---

### Tanda 2 — La marca de verificación

> The concept is verification: a mark that reads as "this has been checked against the source". A geometric seal, a stamp, or a check contained within a disciplined shape. It should feel like an official endorsement rather than a user-interface tick. Avoid literal rubber-stamp textures, ribbons, badges with laurel wreaths, and anything that looks like a supermarket quality label.

*Por qué:* es la promesa real del producto — no que redacta, sino que lo verificado está verificado. Es el concepto más honesto de los cuatro.

---

### Tanda 3 — La letra I como monograma

> The concept is a monogram built from the letter I of Iureon, treated as pure geometry: a single strong vertical element that also suggests a column of a document, a margin rule, or the spine of a legal file. Extremely reduced — three or four shapes at most. It must not look like a lowercase L, a number 1, or an exclamation mark.

*Por qué:* un monograma envejece bien y funciona a cualquier tamaño. La advertencia sobre la l/1 es real: es el fallo típico de las marcas con I.

---

### Tanda 4 — El artículo, la unidad del derecho

> The concept is the article: the numbered paragraph that is the atomic unit of written law. Abstract horizontal text lines organized with visible structure, or a paragraph mark reduced to geometry. It should suggest an ordered legal text rather than a generic document icon. Avoid page-with-folded-corner icons, folders and clipboard shapes.

*Por qué:* todo el producto gira sobre el artículo — la ficha, la verificación, la cita. Es el concepto más específico y el que menos se parece a otras marcas legaltech.

---

## Variantes que hay que pedir después de elegir

Con la opción escogida, genera:

1. **Versión de un solo color** en negro sólido sobre blanco. Si no funciona en monocromo, no funciona: va a ir en un sello, en un fax de juzgado y en un membrete impreso.
2. **Versión invertida**, blanco sólido sobre azul marino.
3. **Recorte cuadrado ajustado**, para favicon y avatar.

## Cómo evaluar lo que salga

Cuatro preguntas, en este orden:

1. **¿Se distingue a 32 píxeles?** Redúcelo y míralo. Casi todo falla aquí.
2. **¿Funciona en negro plano?** Si depende del color, no es un logo.
3. **¿Se puede dibujar de memoria?** Si no, tiene demasiadas formas.
4. **¿Podría ser de otra empresa cualquiera?** Si sí, es genérico y no vale la pena.

## Lo que hay hoy, para que sepas de dónde partes

El favicon actual (`frontend/public/favicon.svg`) es **un rayo morado genérico** con desenfoques y elipses de relleno — no es una marca de Iureon, es un ícono prestado. Cualquiera de las cuatro tandas es mejor punto de partida que eso.
