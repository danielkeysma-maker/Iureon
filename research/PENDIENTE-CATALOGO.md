# Catálogo — qué falta y qué ya está verificado sin catalogar

Estado al **28 de agosto de 2026**. Catálogo en `main`: **731 fichas, 23 ramas**,
commit `d5cf563`. Verde: `check:catalog`, `check:relojes`, tsc de backend y
frontend, suite 21/21.

Este documento existe para que nada de lo verificado se pierda si la sesión se
corta. **Todo lo que sigue está comprobado sobre fuente oficial y solo falta
escribirlo como ficha** — salvo donde diga explícitamente NO VERIFICADO.

---

## 1. LISTO PARA CATALOGAR — verbatim ya extraído del texto oficial

### 1.1 Títulos valores (rama CIVIL)

Leídos en `secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr024.html`
(arts. 780-814), `_pr022` (717-751) y `_pr027` (879-909). Nótese que el Senado
sirve el Código de Comercio en bloques y **solo responde por HTTP, no HTTPS**.

**Los tres relojes de la acción cambiaria, todos del cliente:**

- Art. 789: «La acción cambiaria directa prescribe en **tres años** a partir del
  día del vencimiento.»
- Art. 790: «La acción cambiaria de regreso del último tenedor prescribirá en
  **un año** contado desde la fecha del protesto o, si el título fuere sin
  protesto, desde la fecha del vencimiento; y, en su caso, desde que concluyan
  los plazos de presentación.»
- Art. 791: «La acción del obligado del regreso contra los demás obligados
  anteriores prescribe en **seis meses**, contados a partir de la fecha del pago
  voluntario o de la fecha en que se le notifique la demanda.»
- Art. 792, y es la trampa procesal: «Las causas que interrumpen la prescripción
  respecto de uno de los deudores cambiarios **no la interrumpe respecto de los
  otros**, salvo el caso de los signatarios en un mismo grado.»
- Art. 793: «El cobro de un título-valor dará lugar al procedimiento ejecutivo,
  **sin necesidad de reconocimiento de firmas**.»

**La ficha más valiosa del frente, art. 882 — dejar prescribir el título mata
también la obligación de fondo:**

> «Si el acreedor deja caducar o prescribir el instrumento, **la obligación
> originaria o fundamental se extinguirá así mismo**; no obstante, tendrá acción
> contra quien se haya enriquecido sin causa a consecuencia de la caducidad o
> prescripción. **Esta acción prescribirá en un año.**»

**Cheque — dos relojes independientes matan la misma acción:**

- Art. 718: presentación para el pago — **15 días** si es en el mismo lugar de
  expedición; **un mes** en el mismo país, lugar distinto; **tres meses** entre
  países latinoamericanos; **cuatro meses** fuera de América Latina.
- Art. 727: «La anotación que el librado o la cámara de compensación ponga en el
  cheque, de haber sido presentado en tiempo y no pagado total o parcialmente,
  **surtirá los efectos del protesto**.»
- Art. 729: caducidad de la acción contra el librador y sus avalistas por no
  presentar y protestar en tiempo, **si durante todo el plazo el librador tuvo
  fondos suficientes** y el cheque dejó de pagarse por causa no imputable a él.
- Art. 730: «Las acciones cambiarias derivadas del cheque prescriben: Las del
  último tenedor, en **seis meses**, contados desde la presentación; las de los
  endosantes y avalistas, en el mismo término, contado desde el día siguiente a
  aquel en que paguen el cheque.»
- Art. 731: sanción del 20% al librador. Exequible, C-451 de 2002.

**Protesto de la letra (autoridad NOTARIAL, no judicial)** — arts. 697, 698, 703
y 707 del C.Co., en el bloque `_pr023`. **PENDIENTE DE EXTRAER EL VERBATIM**: el
`grep` sobre ese bloque no devolvió salida en el último intento y hay que
repetirlo. Lo reportado por el censo, sin confirmar por mí:
- Art. 697: el protesto solo es necesario si se insertó la cláusula «con
  protesto» en el anverso y con caracteres visibles.
- Art. 698: se practica con intervención de notario y **su omisión produce la
  caducidad de las acciones de regreso**.
- Art. 703: **15 días comunes** siguientes al vencimiento.
- Art. 707: aviso a los signatarios dentro de los **5 días comunes** siguientes
  al protesto; omitirlo hace responsable al tenedor hasta por el importe.

### 1.2 Proceso monitorio (rama CIVIL)

CGP arts. 419, 420 y 421; cuantía por el art. 25. **NO modificado por la Ley 2213
de 2022**; la única corrección es la de los numerales 7 y 8 del art. 420 por el
Decreto 1736 de 2012. Art. 419 exequible por C-726 de 2014 y C-159 de 2016, sin
condicionamiento.

- Art. 419: «Quien pretenda el pago de una obligación en dinero, de naturaleza
  contractual, determinada y exigible **que sea de mínima cuantía**, podrá
  promover proceso monitorio.»
- Art. 25: mínima cuantía es hasta **40 SMLMV**, «El salario mínimo legal mensual
  a que se refiere este artículo, será el vigente al momento de la presentación
  de la demanda».
  **ADVERTENCIA DE 2026 que la ficha debe traer:** el SMLMV está judicialmente en
  disputa — el Decreto 1469 de 2025 fue suspendido provisionalmente por el
  Consejo de Estado y el Decreto 0159 del 19 de febrero de 2026 lo fijó
  **transitoriamente** en $1.750.905 «hasta que se dicte sentencia».
- Art. 421, **el reloj más letal del CGP y es del deudor**: «el juez ordenará
  requerir al deudor para que **en el plazo de diez (10) días** pague o exponga
  en la contestación de la demanda las razones concretas que le sirven de
  sustento para negar total o parcialmente la deuda reclamada. El auto que
  contiene el requerimiento de pago no admite recursos **y se notificará
  personalmente al deudor**, con la advertencia de que si no paga o no justifica
  su renuencia, **se dictará sentencia que tampoco admite recursos y constituye
  cosa juzgada**.»
  Dos consecuencias que la ficha debe advertir: **no hay emplazamiento ni curador
  ad litem** (parágrafo), así que sin notificación personal el proceso no avanza;
  y quien se opone infundadamente y es condenado paga **multa del 10%** de la
  deuda — si es absuelto, la multa es para el acreedor.

Fichas a crear: demanda monitoria y contestación/oposición (LITIGANTE), auto de
requerimiento y sentencia monitoria (DESPACHO).

### 1.3 Cobro coactivo genérico (rama ADMINISTRATIVO)

Hoy el catálogo solo tiene dos fichas, ambas en **TRIBUTARIO** y con autoridad
«funcionario ejecutor de la DIAN». Eso deja huérfano el cobro coactivo de toda
entidad pública no tributaria —municipios, ICBF, Colpensiones, universidades
públicas— que por el **art. 5 de la Ley 1066 de 2006** sigue el mismo
procedimiento del Estatuto Tributario. Recomendación del censo: **crear las
fichas nuevas en ADMINISTRATIVO y dejar intactas las dos de TRIBUTARIO**; son dos
puertas de entrada al mismo procedimiento, y el litigante busca por la puerta.

| Actuación | Rol | Norma | Reloj |
|---|---|---|---|
| Citación para notificación personal del mandamiento | DESPACHO | ET 826 | **10 días del particular** para comparecer |
| Pago o excepciones contra el mandamiento | LITIGANTE | ET 830 | **15 días del particular, preclusivo**; vencido, va directo al art. 836 sin recurso |
| Resolución que decide las excepciones | DESPACHO | ET 832, 833 | 1 mes de la entidad. **El ET no prevé silencio positivo** |
| Reposición contra la resolución que rechaza excepciones | LITIGANTE | ET 834 (mod. art. 80 Ley 6 de 1992) | «**únicamente el recurso de reposición** […] **dentro del mes siguiente a su notificación**» — mes del particular, preclusivo |
| Resolución que ordena seguir adelante la ejecución | DESPACHO | ET 836 | «Contra esta resolución **no procede recurso alguno**» |
| Medidas cautelares en el coactivo | DESPACHO | ET 837, 837-1, 838 | Previas o simultáneas al mandamiento. Límite: el doble de la deuda más intereses |
| Solicitud de facilidad de pago | LITIGANTE | ET 814 (incs. 1-2 mod. art. 81 Ley 2277 de 2022) | Hasta 5 años con garantía, 1 sin ella. **Trampa: interrumpe la prescripción del art. 818 y le regala 5 años nuevos a la administración** |
| Solicitud de prescripción de la acción de cobro | LITIGANTE | ET 817 (mod. art. 53 Ley 1739 de 2014) | **5 años, reloj de la entidad a favor del deudor.** De oficio o a petición, sin plazo para el particular. También es excepción, ET 831 num. 6 |
| Nulidad y restablecimiento contra actos del coactivo | LITIGANTE | CPACA art. 101 | «Sólo serán demandables […] los que **deciden las excepciones a favor del deudor**, los que **ordenan llevar adelante la ejecución** y los que **liquiden el crédito**» |

**Plazo que NO existe y conviene declararlo:** ninguna norma fija término a la
entidad para *iniciar* el cobro coactivo. El art. 842 del ET fue derogado por el
art. 140 de la Ley 6ª de 1992. El único límite es la prescripción del art. 817.

### 1.4 Registral e inmobiliario

- **Corrección de folio de matrícula** (Ley 1579 de 2012, art. 59) — dos
  regímenes opuestos y esa distinción es la ficha: el error material
  «podrá[…] corregirse **en cualquier tiempo**»; el error que modifica la
  situación jurídica ya publicitada «**solo podrá[…] ser corregido mediante
  actuación administrativa**» bajo el CPACA. El plazo de 5 días hábiles del art.
  27 es **de la ORIP**, no del cliente.
- **Disparador del plazo de los recursos, y casi nadie lo cataloga** — Ley 1579,
  art. 24: «Los actos de inscripción o registro se entenderán notificados el día
  en que se efectúe la correspondiente anotación.»
- **Traspaso de vehículo** (Ley 769 de 2002, art. 47) — dos relojes que hay que
  separar: **60 días hábiles del cliente** para inscribir desde la adquisición, y
  **15 días del organismo de tránsito** para reportar al RNA. Mientras no se
  inscriba **no hay tradición** y el vendedor sigue respondiendo como propietario
  inscrito. Rama sugerida: TRANSITO.
- **Levantamiento de la afectación a vivienda familiar** (Ley 258 de 1996, arts.
  4, 9 y 10) — notario si hay acuerdo de ambos cónyuges, juez de familia por
  verbal sumario si lo pide uno solo. **No prescribe.**
- **Cancelación del patrimonio de familia** (Ley 70 de 1931, arts. 23 y 29) —
  **no prescribe**; con menores exige curador. El art. 29 trae una extinción
  automática que merece ficha aparte: «Cuando todos los comuneros lleguen a la
  mayoridad se extingue el patrimonio de familia.»

### 1.5 Seguridad social — segundo lote

Ya está la rama con 13 fichas. Falta, todo verificado por el censo:

- Auxilio funerario (Ley 100 art. 51): entre **5 y 10 SMLMV**. Reloj del cliente:
  prescripción trienal desde la muerte.
- Mesada adicional (Ley 100 art. 50) y intereses moratorios sobre mesadas (art.
  141, «la tasa máxima de interés moratorio vigente en el momento en que se
  efectúe el pago»).
- Corrección de historia laboral. **NO VERIFICADO**: no existe norma con rango
  legal que fije plazo especial; si lo hay, está en circular de Colpensiones.
- Reporte del accidente de trabajo (FURAT) — Decreto-ley 1295 de 1994, art. 62:
  **2 días hábiles, y el reloj es del EMPLEADOR, no del trabajador.** Su
  incumplimiento sanciona al empleador y **no extingue el derecho prestacional
  del trabajador**; decirlo así evita el error clásico.
- Reporte de accidente grave o mortal al Mintrabajo — Decreto 1072 art.
  2.2.4.1.7, **2 días hábiles**.
- Investigación del accidente mortal — Decreto 1072 art. 2.2.4.1.6.
- Cesantías del sector público (Ley 1071 de 2006, arts. 4 y 5): **15 días
  hábiles** de la entidad para la resolución y **45 hábiles** para pagar, con
  «**un día de salario por cada día de retardo**».
- Cesantías del sector privado (Ley 50 de 1990, art. 99 num. 3): consignación
  **antes del 15 de febrero**, con un día de salario por cada día de retardo.
  Reloj del trabajador: 3 años del CST art. 488, **modificado por el art. 62 de
  la Ley 2466 de 2025**.
- Conciliación ante la Supersalud (Ley 1122 de 2007, art. 38, vigente y no
  modificado por las Leyes 1438 ni 1949): «Los acuerdos conciliatorios tendrán
  efecto de cosa juzgada y el acta […] prestará mérito ejecutivo.» Rama
  SUPERINTENDENCIAS.
- Demanda de ineficacia del traslado de régimen — rama LABORAL, porque va ante
  juez laboral. **Es construcción jurisprudencial, no legal**, y la ficha debe
  decirlo: SL1688-2019 y SL1689-2019 sostienen que **la acción es
  imprescriptible, pero las mesadas no**: se puede ganar la ineficacia veinte
  años después y perder todo lo anterior a los 3 años previos a la reclamación.

---

## 2. CORRECCIONES DE VIGENCIA COMPROBADAS ESTA SESIÓN

1. **El plazo para impugnar decisiones de asamblea ya no vive en la Ley 675.** Su
   art. 49 inciso 2 fue derogado por el art. 626 lit. c) de la Ley 1564 de 2012,
   con vigencia desde el 1 de enero de 2014. Hoy son los **2 meses de caducidad
   del art. 382 del CGP**, que además se cuentan **desde la inscripción** si el
   acto está sujeto a registro. Citar el art. 49 como fuente del plazo es citar
   norma muerta. *Ya catalogado correctamente.*
2. **En el art. 62 de la Ley 675 el tachado envuelve SOLO la remisión al art. 194
   del Código de Comercio**: el mes para impugnar la sanción **sobrevive**. Se
   comprobó en el HTML crudo del Senado, donde las etiquetas `<S>` abren después
   de la oración del plazo. Leer la nota de derogatoria por encima hace creer que
   el artículo entero murió. *Ya catalogado correctamente.*
3. **Reforma pensional, con fecha cierta.** La Ley 2381 de 2024 estuvo suspendida
   por el Auto 841 de 2025 (salvo el par. transitorio del art. 12 y el art. 76).
   La Sala Plena decidió el expediente **D-15989 el 25 de agosto de 2026**:
   exequible la mayoría del articulado, con las normas exequibles rigiendo
   **desde el 1 de abril de 2027**, y cerca de diez disposiciones devueltas a la
   Cámara. Hoy rige Ley 100 + 797 + 860. **Las 13 fichas de SEGURIDAD_SOCIAL
   declaran ese horizonte y deben revisarse antes de esa fecha.**
   La ventana extraordinaria de traslado del art. 76 **venció el 16 de julio de
   2026** — catalogarla sin decirlo sería publicar una puerta tapiada.
4. **Ley 2452 de 2025 (CPTSS), vigencia comprobada en su propio art. 330:**
   «entrará en vigencia un (1) año después de su publicación», publicada el 2 de
   abril de 2025 → rige desde el **2 de abril de 2026**. Y su régimen de
   transición: «Todos los procesos iniciados con anterioridad a la vigencia de
   este código se continuarán tramitando por las normas procesales anteriores.»
   Su art. 331 derogó el Decreto Ley 2158 de 1948, la Ley 712 de 2001, la Ley
   1149 de 2007 y el art. 622 del CGP.
5. **La reclamación administrativa laboral YA NO es requisito de
   procedibilidad** — Ley 2452 art. 11, verbatim: «sin que en ningún caso sea
   requisito de procedibilidad». Sigue siendo la actuación que abre todo caso
   pensional, pero por otra razón: **interrumpe la prescripción** (art. 319 lit.
   b) y **fija la competencia territorial** a elección del demandante (art. 12).
6. **Supersalud jurisdiccional: no son 10 días para fallar.** Ese término de la
   Ley 1438 de 2011 fue sustituido por el art. 6 de la Ley 1949 de 2019: hoy son
   **20 días** (literales a, c, d, e), **60** (literal b) y **120** (literal f),
   y la apelación **3 días** ante la Sala Laboral del Tribunal del domicilio del
   apelante. Desapareció el literal g). Las tres fichas actuales del catálogo ya
   están correctas. La Ley 2294 de 2023 **no** alteró esas competencias.

---

## 3. FALSA ALARMA DESCARTADA

Un censo reportó que las fichas «Recurso de reposición contra acto de registro» y
«Recurso de apelación contra acto de registro» estaban **mal ubicadas** en
NOTARIAL. **Se verificó y su contenido ya es correcto**: autoridad Registrador de
Instrumentos Públicos y Director del Registro —no notario—, base Ley 1579 art. 60
+ CPACA art. 76, término de 10 días. Solo la etiqueta de rama es discutible, y
moverlas cambiaría el `actuacion_id`, que es la llave primaria de
`catalog_verifications`: huerfanaría cualquier verificación que una firma
hubiera hecho. **No se movieron, y no conviene moverlas sin migración.**

---

## 4. DEUDA ANTERIOR QUE SIGUE ABIERTA

- 20 fichas publicadas como `NO_VERIFICADO`.
- 212 advertencias en `_meta.gaps`; 11 ramas con entradas obsoletas.
- 111 URLs de leyes.co por re-verificar artículo por artículo. 107 de 111 apuntan
  al artículo correcto, así que el defecto es de procedencia, no de contenido.
- `check:relojes` marca 1 ficha para revisar con la norma al lado:
  FAMILIA_ADMINISTRATIVA, «Solicitud de restablecimiento de derechos ante el
  defensor o comisario de familia».
- Rol SECRETARIA: 16 fichas, y 20 ramas en cero.

---

## 5. CÓMO SE REGISTRA UNA RAMA NUEVA

Son cuatro sitios, y `merge-actuaciones.py` los imprime solo al detectar una rama
desconocida:

1. `backend/scripts/build-catalog.py` → tupla en `BRANCHES`
2. `backend/src/modules/catalog/types.ts` → unión `LegalBranch`
3. `frontend/src/modules/catalog/branchLabels.ts` → `BRANCH_LABELS`
4. `FILE_FOR_BRANCH` en **`merge-actuaciones.py` Y `apply-verification.py`**

Luego `python backend/scripts/build-catalog.py`.

---

## 6. NOTAS DE ENTORNO QUE AHORRAN HORAS

- `curl` contra dominios `.gov.co` **necesita `--ssl-no-revoke`** en este Windows
  o falla con `CRYPT_E_REVOKED`. Varios WAF además rechazan el user-agent por
  defecto: usar uno de navegador.
- **`secretariasenado.gov.co` solo responde por HTTP.** Por HTTPS da
  `ECONNREFUSED`, y `WebFetch` fuerza HTTPS, así que siempre falla ahí. Con
  `http://` responde perfecto.
- El Senado sirve los códigos **en bloques** (`_pr001`, `_pr024`…). Antes de
  concluir que un artículo no existe, hay que averiguar en qué bloque vive.
- Las **notas de vigencia y jurisprudencia no están en el HTML plano**: viven en
  `/basedoc/js/<norma>_prNNN.js`. Y el tachado de derogatorias son etiquetas
  `<S>`: **al desnudar el HTML se pierde qué parte fue derogada**, que es
  exactamente el error que casi mata el plazo del art. 62 de la Ley 675.
- El **Gestor Normativo de Función Pública sirve la Ley 100 en su texto
  ORIGINAL**: su art. 33 dice «1.000 semanas» y su art. 46 «26 semanas», ambos
  modificados por la Ley 797 de 2003. Hay que ir a la ley modificatoria.
- Lanzar **dos o tres agentes, nunca siete**: siete agotaron el límite de sesión
  y ninguna investigación entregó.

---

## 7. BARRIDO DE HUECOS (28 ago 2026) — el diagnóstico de fondo

Se hizo al revés de los censos anteriores: sin lista de temas, partiendo del
trabajo de un mes de firma y contrastándolo contra las 731 fichas. El resultado
no fue una lista de temas sueltos sino un diagnóstico:

> **El catálogo está construido desde los códigos de procedimiento hacia afuera,
> y la mitad del trabajo de una firma colombiana no vive en un código de
> procedimiento.**

Por eso los censos anteriores no lo veían: buscaban dentro de códigos.

### 7.1 El hueco número uno, y es vergonzoso de lo obvio

**No existe UNA SOLA ficha con la palabra «poder».** Ni poder especial, ni
general, ni sustitución, ni renuncia. Es el documento que una firma firma más
veces al mes que cualquier otro, y sin él no hay actuación posible.
Norma verificada: **Ley 2213 de 2022, art. 5**. La renuncia va por el **CGP art.
76** *(no releído)* y su reloj es del abogado: no lo desliga hasta cinco días
después de notificado el poderdante.

### 7.2 Los desbalances estructurales

- **LABORAL: 37 fichas y las 37 son litigio.** Cero preventivo. Faltan contrato
  de trabajo, carta de terminación con justa causa, citación y acta de descargos,
  liquidación de prestaciones, reglamento interno, pliego de peticiones, huelga.
  Un despido mal documentado es el caso que después se pierde.
- **PENAL: 27 fichas y la víctima solo tiene tres puertas** (denuncia, querella,
  incidente de reparación). Entre la denuncia y la sentencia no puede hacer nada.
  Y la ejecución de penas no existe: el catálogo termina en la sentencia y el
  proceso no.
- **FAMILIA: 53 fichas que saben declarar derechos y no ejecutarlos.** Sabe fijar
  la cuota alimentaria; no sabe cobrarla.
- **SOCIETARIO: 32 fichas de litigio y garantías mobiliarias**, sin la vida
  ordinaria de una sociedad (constitución, actas, reformas, nombramientos,
  disolución, registro en cámara).
- **CIVIL: la más grande y con el ciclo procesal incompleto por dentro** —
  costas (art. 366), desistimiento tácito (art. 317), transacción y conciliación
  judicial (art. 312), sucesión procesal (arts. 159-161), contradicción del
  dictamen, tachas, oposición a la entrega, inventarios y partición.
- **El Ministerio de Trabajo no aparece ni una vez en las 731 fichas.**

### 7.3 Ramas que faltan enteras, por costo de no tenerlas

1. **Responsabilidad fiscal (Contraloría)** — Ley 610 de 2000 + Ley 1474 de 2011.
   Normas verificadas. **Reloj del presunto responsable: 10 días** desde la
   notificación del auto de imputación (art. 50). Y ojo: la caducidad de 5 años
   del art. 9 es **el reloj de la Contraloría**, no del cliente — el defecto que
   este proyecto ya conoce, esperando a ser cometido otra vez.
2. **Contratos y minutas de derecho privado** — el catálogo tiene exactamente
   tres contratos. Es la mitad no litigiosa del oficio.
3. **Restitución de tierras y víctimas** (Ley 1448 de 2011, prorrogada por la Ley
   2078 de 2021) — jurisdicción propia. *Vigencia no reverificada.*
4. **Extinción de dominio** (Ley 1708 de 2014). *Articulado no verificado.*
5. **Ejecución de penas** — puede vivir dentro de PENAL.
6. **Urbanismo y licencias** (curadores urbanos, Decreto 1077 de 2015). *No
   verificado.*
7. **Sanitaria / INVIMA.**

Descartadas por frecuencia baja frente al costo: JEP, minero-energético,
Supertransporte.

### 7.4 Normas nuevas que hay que traer ANTES de catalogar

Dos reformas recientes que harían salir mal cualquier ficha escrita de memoria:

- **Ley 2209 de 2022, art. 1**, que modificó el art. 18 de la Ley 1010 de 2006:
  la caducidad del acoso laboral es de **TRES AÑOS**, no de seis meses. El propio
  agente iba a escribir «6 meses» y se corrigió al leer el texto. Es el error
  clásico del dominio: artículo correcto, ley correcta, **número viejo**.
- **Ley 2466 de 2025, art. 7**, que reescribió el **CST art. 115** (descargos).
- **Ley 2220 de 2022** (Estatuto de Conciliación), arts. 67, 68 y 69: la
  conciliación extrajudicial civil y de familia es requisito de procedibilidad, y
  el catálogo solo tiene la contencioso-administrativa. Nota verificada del **art.
  67 par. 1: en laboral NO es requisito de procedibilidad**. El art. 68 exceptúa
  al monitorio.
- **CST art. 240, modificado por el art. 2 de la Ley 2141 de 2021**: permiso del
  Inspector de Trabajo para despedir en embarazo o lactancia, 18 semanas posparto.
  Sin autorización el despido es ineficaz.

### 7.5 Falsas alarmas que el barrido descartó

Sirven de prueba de que sí revisó, y de que no hay que volver a mirarlas: amparo
de pobreza (está en CIVIL y en ARBITRAJE), prueba extraprocesal, caducidad de la
querella penal, caducidad del incidente de reparación, prescripción trienal
laboral, arrendamiento no litigioso (las cinco fichas nuevas), **todo el
ejecutivo por dentro** —«el mejor tramo del catálogo»—, la derogatoria de la Ley
640 por la Ley 2220 (ya declarada), la Ley 2492 de 2025 en POLICIVO (ya usa
«Inspectores de Convivencia y Paz»), la interdicción (correctamente ausente, con
los apoyos en su lugar) y las garantías mobiliarias.

### 7.6 Ramas que el barrido declaró completas

POLICIVO —«el mejor tratamiento del reloj de todo el catálogo»—, CONSTITUCIONAL,
TRANSITO, ADUANERO, AMBIENTAL, DISCIPLINARIO, AGRARIO, FAMILIA_ADMINISTRATIVA, y
ADMINISTRATIVO salvo responsabilidad fiscal, que en rigor es rama aparte.

---

## 8. SALDO DE VERIFICACIÓN AL 28 DE AGOSTO DE 2026 (medido, no recordado)

Dos correcciones a lo que este mismo documento traía como deuda abierta:

**Las 111 URLs de leyes.co YA NO EXISTEN.** Se contaron las 752 fichas una por
una y **ninguna** cita una fuente no oficial. El reparto real de dominios es:
`secretariasenado.gov.co` 396, `funcionpublica.gov.co` 295,
`alcaldiabogota.gov.co` 21, `tribunalandino.org.ec` 17 (Comunidad Andina, que es
su fuente propia), y el resto en normogramas oficiales de Colpensiones, ICBF,
Supersalud, DIAN, la Corte Constitucional, la OEA y la Conferencia de La Haya.
**Esa deuda está cerrada.**

**Los `_meta.gaps` tampoco son 212 advertencias vivas.** Varias listas traen su
propia nota de que son anteriores a la verificación masiva del 14 de agosto y que
lo vigente vive en `_meta.unverified`. Hay que leerlos como historia, no como
pendientes, salvo los que declaran una materia entera sin catalogar — y esos sí
importan: TRIBUTARIO declara que no leyó verbatim el Estatuto, CONSTITUCIONAL que
no leyó los arts. 86, 87, 88 y 241 de la Constitución, y AGRARIO que la
jurisdicción agraria como tal no produjo ni una ficha.

### Lo que SÍ queda: 20 fichas publicadas como NO_VERIFICADO

Se publican con la advertencia visible, que es lo correcto, pero son el saldo
real. Están concentradas y por eso son cerrables:

- **ADUANERO (5)** — Solicitud de revisión ante el Comité de Revisión de
  Aprehensiones · Solicitud de declaratoria de silencio administrativo positivo
  aduanero · Declaración de legalización con pago de rescate · Solicitud de
  rescate de mercancía en abandono legal · Declaración de corrección de la
  declaración de importación.
- **AMBIENTAL (4)** — Solicitud de levantamiento de medida preventiva ambiental ·
  Solicitud de aprovechamiento forestal · Solicitud de reconocimiento como
  tercero interviniente en la actuación administrativa ambiental · Resolución que
  otorga o niega el aprovechamiento forestal.
- **PROPIEDAD_INTELECTUAL (4)** — Demanda de nulidad del registro de marca ·
  Solicitud de medidas en frontera por infracción de marca · Solicitud de
  registro de obra ante la DNDA · Demanda por infracción de derecho de autor y
  derechos conexos.
- **AGRARIO (3)** — Demanda de resolución de controversias sobre la adjudicación ·
  Solicitud de acumulación de procesos al Procedimiento Único · Solicitud de
  conciliación en el marco del Procedimiento Único.
- **Una cada una** — ARBITRAJE: Solicitud de arbitraje social. DISCIPLINARIO:
  Auto de fijación del juzgamiento a seguir. NOTARIAL: Escritura pública de
  cancelación o sustitución voluntaria del patrimonio de familia inembargable.
  POLICIVO: Solicitud de asunción de competencia especial por el gobernador.

Las mismas seis de esa lista tienen además el campo `term` vacío, no solo
declarado sin verificar: las tres de AGRARIO, la de ARBITRAJE, la de
DISCIPLINARIO y la de NOTARIAL.

### El hueco de ROL, medido

| Rol | Fichas |
|---|---|
| LITIGANTE | 483 |
| DESPACHO | 251 |
| **SECRETARIA** | **18** |

Las 18 de SECRETARIA son **16 en CIVIL y 2 en ARBITRAJE. Veintiuna ramas en
cero.** No todas deben tener secretaría judicial —en las ramas administrativas la
figura equivalente es la secretaría general o la notificación de la entidad—,
pero veintiuna en cero no es una decisión, es un vacío.

### El hueco de POSICIÓN, comprobado en una rama y probablemente general

CONSTITUCIONAL tiene 35 fichas: la tutela, la transitoria, la que va contra
providencia, la medida provisional, la impugnación, el desacato y la insistencia
—**todas del accionante**— más los 15 autos y sentencias del juez.
**No hay una sola ficha para CONTESTAR una tutela**, ni para responder el
incidente de desacato, ni para el informe de cumplimiento de la entidad
accionada. El cliente al que le ponen la tutela no tiene nada, y responder
tutelas es de los documentos que más produce una firma colombiana.

### Brave, comprobado

`npm run check:discovery` pasa entero con la llave real: el descubrimiento
responde, toda sentencia propuesta llega con su texto descargado y con su ponente
y fecha del registro oficial, y una cita inventada no entra al corpus. **Lo que
no está comprobado es la producción**: sin una petición autenticada no se puede
distinguir si la llave quedó en el proyecto `iureon` (backend) o en `iureon-app`
(frontend), que nunca la lee. El 401 de la raíz no sirve como prueba: el
middleware de sesión responde igual para una ruta real y una inexistente.
