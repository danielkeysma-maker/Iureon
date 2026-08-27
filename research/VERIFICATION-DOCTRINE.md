# Cómo se verifica una ficha del catálogo

Reglas para quien —persona o agente— compruebe una actuación contra la norma.
Un plazo equivocado le hace perder un caso a un abogado; nada de esto es estilo.

Esta doctrina no se escribió por adelantado. Cada regla está aquí porque su
ausencia produjo un defecto concreto, y el defecto se nombra.

---

## 1. Fuentes

Solo oficiales, en este orden:

1. `secretariasenado.gov.co/senado/basedoc/...`
2. `funcionpublica.gov.co/eva/gestornormativo/norma.php?i=...`
3. `suin-juriscol.gov.co`
4. `corteconstitucional.gov.co` (sentencias)
5. Diario Oficial o Presidencia, para normas recientes
6. El depositario del tratado (`oas.org`, `hcch.net`, `tribunalandino.org.ec`)

Prohibido como fuente: leyes.co, actualicese.com, blogs, páginas de despachos,
resúmenes de IA, y cualquier sitio que no publique el texto de la norma.

`catalog.check.ts` sostiene esta lista como lista blanca. Un dominio nuevo se
agrega a mano: prohibir leyes.co dejaría entrar al siguiente espejo.

**Por qué importa tanto.** 103 fichas se apoyaban en leyes.co y un blog contable.
Al leerlas contra el texto oficial, **76 estaban mal**. La procedencia nunca fue
un metadato impreciso: una fuente que no sostiene la entrada significa que el
término **nunca se verificó**, solo lo parecía.

---

## 2. No inventes nada

Si no pudiste leer el artículo en fuente oficial, el veredicto es `ILEGIBLE`,
con las URLs que probaste y qué respondieron.

Un hueco declarado vale. Un plazo recordado de memoria destruye el catálogo,
porque es indistinguible de uno comprobado hasta que alguien pierde un término.

Nunca completes con lo que "sabes".

---

## 3. Una fuente oficial también puede estar desactualizada

### Y "la fuente está truncada" suele ser tu lector, no la fuente

**Corregido el 2026-08-26, y era una regla escrita de este proyecto.** Estaba
anotado que `funcionpublica` truncaba la Ley 906 cerca del art. 100 y publicaba
el Código de Comercio solo hasta el art. 159. **Es falso.** Bajando el HTML crudo
—1,2 MB— aparece el Código de Comercio completo hasta el art. 2199, con 1742
artículos, incluidos el 191, el 218 y el 447. Comprobado directamente.

Lo que truncaba era el lector de la herramienta de fetch. Dos pasadas anteriores
declararon fichas ilegibles por eso, y diez huecos que parecían cerrados se
cerraron el día que alguien descargó el archivo entero.

**Antes de dar una norma por ilegible, descarga el HTML crudo y cuenta los
artículos.** Una ausencia afirmada exige decir dónde se buscó — y "la
herramienta no me lo mostró" no es "la fuente no lo tiene".

### Lo que sí está comprobado

- `funcionpublica` sirve el art. 159 **original** de la Ley 769 de 2002, no el
  reformado por el Decreto Ley 019 de 2012 art. 206. Ese sí es un problema de
  contenido, no de lectura.
- **LAS NOTAS DE VIGENCIA VIVEN EN UN JS APARTE, y ya son tres sitios.**
  `secretariasenado` las sirve en `basedoc/js/<norma>.js`; la Compilación
  Jurídica de la DIAN en `compilacion/docs/js/<nombre>.js`, invocado por
  `insRow1()`. Sin descargar ese archivo el texto **no muestra reformas,
  adiciones, reconsideraciones, revocatorias ni nulidades** — y se lee como si
  estuviera intacto. Así se encontraron cuatro reformas vigentes que ninguna
  ficha del CGP registraba, y así se supo que dos conceptos de la DIAN tienen
  apartes anulados por el Consejo de Estado. **Ante un sitio oficial, mira si
  hay un JS hermano antes de dar el texto por completo.**

Prefiere oficial, pero confirma que el texto traiga la reforma que esperas.

---

## 4. Verifica que la NORMA siga vigente, no solo el artículo

Los códigos procesales colombianos se reemplazan y renumeran completos. La
Ley 2452 de 2025 sustituyó el CPTSS entero y rige desde el 2 de abril de 2026,
con transición **por proceso**.

Y una norma puede sobrevivir al trámite que describe: tránsito publicaba el
texto original del art. 143 —un acta con fuerza de cosa juzgada— que el art. 16
de la Ley 2251 de 2022 eliminó.

---

## 5. Un resultado de búsqueda no es fuente de derecho

Las búsquedas mezclan **proyectos** de reforma, leyes extranjeras y derecho
vigente en una sola lista. En julio de 2026 varios sitios daban por suprimida la
audiencia de imputación: era uno de catorce proyectos entregados al Gobierno.
Otros dos resultados sobre "reforma penal 2026" eran de España y de República
Dominicana.

Confirma siempre contra el texto del artículo vigente.

---

## 6. ¿DE QUIÉN ES EL RELOJ?

**La regla más importante de este documento, y la que más defectos explica.**

De 76 fichas defectuosas, **59 tenían esta forma exacta**: el plazo publicado era
correcto y pertenecía a otro. El del juzgado, el de la contraparte, el de la
autoridad. El que extingue el derecho del cliente no aparecía.

Es el peor defecto posible porque no parece un defecto: la ficha es exacta, la
cita es real, y el abogado lee un plazo cómodo mientras el suyo corre.

Casos reales de este catálogo:

| Ficha | Publicaba | Callaba |
|---|---|---|
| Sentencia penal condenatoria | 150 días, art. 317 (libertad del procesado) | 15 días del art. 447 |
| Reintegro por fuero sindical | traslado de 5 días del juzgado | prescripción de **1 año**, art. 298 |
| Respuesta al pliego de cargos | 2 años de la DIAN | **1 mes** del contribuyente |
| Concepto sobre extradición | (se detenía ahí) | 15 días del Gobierno, art. 503 |
| Casación laboral | 5 días para interponer | 20 días para sustentar, so pena de deserción |
| Devolución de saldo a favor | 50/30 días de la DIAN | 2 años del art. 854 |

**Al verificar, pregunta siempre: ¿este plazo obliga a mi cliente, o a alguien
más?** Si el artículo trae los dos, la ficha debe traer los dos **y decir cuál es
cuál**. Si el reloj del cliente vive en otro artículo, ve a buscarlo: en el
pliego de cargos no estaba en el artículo citado, sino disperso en cada norma
sancionatoria.

Un término que omite el plazo que mata el derecho **no es un término correcto**.

---

## 7. La autoridad competente es parte del plazo

Un término exacto radicado ante el despacho equivocado se pierde igual.

Ocho fichas de arbitraje y societario nombraban mal o de forma genérica la
autoridad. La anulación de laudo internacional mandaba al Tribunal Superior, que
es la regla del arbitraje **nacional**; el art. 68 la manda a la Sala de Casación
Civil de la Corte Suprema, o al Consejo de Estado si es parte una entidad
pública. Un mes de plazo, sin segunda oportunidad.

"Autoridad judicial competente" no es una dirección: es la pregunta sin
responder.

---

## 8. Cita verbatim, siempre

Todo veredicto lleva la frase literal del artículo que lo sostiene, entre
comillas. Sin cita literal, es `ILEGIBLE`.

---

## Veredictos

| Veredicto | Cuándo |
|---|---|
| `CORRECTO` | El artículo existe, está vigente y dice lo que la ficha dice. |
| `INCOMPLETO` | El término es exacto pero omite un plazo, un recurso o una regla que el cliente necesita. **Ver la regla 6.** |
| `TERMINO_ERRADO` | El artículo se leyó y dice otra cosa. |
| `ARTICULO_ERRADO` | El `legal_basis` cita un artículo que no regula esto. |
| `NORMA_DEROGADA` | La norma o el artículo ya no rige. |
| `ILEGIBLE` | No se pudo leer en fuente oficial. |

**`INCOMPLETO` existe porque su ausencia costó caro.** Con solo
`CORRECTO`/`ERRADO`, una ficha exacta que omite el reloj del cliente se clasifica
como correcta, y la corrección termina en un campo de prosa donde ningún
aplicador la lee. Tres fichas de arbitraje mandaban al juez equivocado con
veredicto `CORRECTO`.

---

## Cómo se entrega una verificación

Un archivo `out-<norma>.json` por norma, con un objeto por ficha:

```json
{
  "id": "<id literal de la entrada>",
  "veredicto": "INCOMPLETO",
  "cita_verbatim": "frase literal del artículo, entre comillas",
  "articulo_correcto": "solo si cambia",
  "termino_correcto": "reemplaza la descripción del término",
  "termino_faltante": "se AÑADE a la descripción",
  "autoridad_correcta": "solo si cambia",
  "source_url_oficial": "URL oficial",
  "nota": "breve"
}
```

Se aplica con `python backend/scripts/apply-verification.py <dir>` y luego
`python backend/scripts/build-catalog.py`.

**Regla dura del aplicador: todo veredicto distinto de `CORRECTO` e `ILEGIBLE`
debe traer `cita_verbatim` Y al menos un campo de corrección estructurado.**
Prosa no es parche; un parche que solo se explica a sí mismo se rechaza, y con él
el archivo entero. Una clave que no corresponde a ninguna ficha es FATAL y no se
escribe nada.

---

## Un agente por NORMA, no por ficha

43 fichas del CGP comparten un código. Traerlo una vez sirve para las 43.

Esta pasada verificó 103 fichas con 8 agentes, no con 103.

---

## Y el check puede codificar el defecto que vigila

`catalog.check.ts` exigía de la ficha de laudo internacional la frase
*"sin necesidad de reconocimiento previo"*, y la obtenía —porque la ficha se
detenía justo donde el art. 111 deja de ser cómodo: su cláusula final exige el
reconocimiento cuando se renunció a la anulación.

Escrito desde la ficha en vez de desde el artículo, el check **certificó la
omisión durante todo el tiempo que existió**.

Al escribir un check sobre una ficha, ve al artículo.

---

## Una rama nueva declara su norma, no su razonamiento

`source_of_truth` es el encabezado que el abogado lee al abrir la rama. Debe
nombrar la norma que rige, en una o dos frases.

AGRARIO y ADUANERO se publicaron con un encabezado que empezaba "PASO 0 —":
siete mil caracteres del razonamiento del agente. El intento de arreglarlo
tomando el primer párrafo tampoco sirvió, porque el primer párrafo de un
razonamiento sigue siendo razonamiento.

`merge-actuaciones.py` ya no lo deduce: exige `fuente_de_verdad` y
`verified_at`, o rechaza el archivo. El razonamiento completo se conserva en
`gaps`, que es donde sirve.

---

## Una URL oficial puede no servir el documento

Nueve conceptos del Consejo de Estado llegaron con URL de `samai.consejodeestado.gov.co`,
dominio oficial y correcto. Descargada, esa URL devuelve **1.998 caracteres de**
**navegación**: menú, «Cargando...» y un iframe vacío. El texto lo carga
JavaScript después, así que el enlace por sí solo no lo sirve.

Quien investigó lo leyó renderizado y de buena fe. La diferencia entre «lo vi
en esa página» y «esa URL entrega el texto» no se nota hasta que alguien
descarga el enlace.

Por eso la ingesta de conceptos **descarga cada documento y comprueba que la
cita literal esté ahí**. Sin esa guarda se habrían indexado nueve filas del
menú de SAMAI bajo nombres de conceptos del Consejo de Estado — el mismo
defecto que el tag-stripper corriendo sobre un binario: ruido con apariencia
de texto.

**Antes de dar una URL como fuente, descárgala y cuenta los caracteres de
texto útil.** Si son dos mil y aparece «Cargando», es el cascarón.

### Y la guarda atrapa transcripciones, no solo enlaces rotos

De 62 conceptos, tres fallaron con la URL correcta y el documento entero
descargado. La causa no era la fuente: la relatoría del Consejo de Estado abre
sus extractos con la inicial entre corchetes —`[E]l régimen de inhabilidades`—
y quien transcribió normalizó el corchete.

La cita era correcta en sustancia y distinta en la letra. Comprobar contra la
fuente detecta eso, que ninguna revisión humana habría notado.

**Transcribe carácter por carácter.** Corchetes, elipsis, mayúsculas iniciales
y comillas son parte de la cita.

### Un endpoint que sirve el documento pero caduca no es citable

El botón «Ver documento» de SAMAI llama a `VerProvidencia.aspx?tokenDocumento=`
con un JWT que **expira en pocas horas**. Sirve el texto, y aun así no vale
como fuente: una ficha cuya URL muere el mismo día es una ficha sin fuente
mañana. El patrón que sí sirve es la página de resultados filtrada por número
de proceso, que entrega la titulación completa en HTML plano.
