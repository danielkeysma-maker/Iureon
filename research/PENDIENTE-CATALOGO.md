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

1. ~~**Responsabilidad fiscal (Contraloría)**~~ **CATALOGADA el 29 de agosto:
   rama `RESPONSABILIDAD_FISCAL`, 16 fichas (10 LITIGANTE, 6 DESPACHO).** Lo que
   destapó leerla: el Decreto Ley 403 de 2020 reescribió el procedimiento
   —caducidad de diez años, segunda instancia de sesenta días, versión libre por
   escrito, exclusión por costo-beneficio— y **todo eso (arts. 124-148) es
   INEXEQUIBLE por la C-090 de 2022**. Rige la Ley 610 original: cinco años,
   diez días, veinte días hábiles, consulta de un mes. Primera pista: el Senado
   marca los artículos pero no publica la sentencia; la trajo Función Pública.
   Segunda: C-140/20, que la memoria proponía como la sentencia, versa sobre el
   Acto Legislativo, no sobre el decreto — se descartó leyendo su resuelve. Y la
   C-619 de 2002 tachó la «culpa leve»: el estándar es dolo o culpa grave. Queda
   fuera y declarado en `gaps`: cobro coactivo (vive en ADMINISTRATIVO), la
   conciliación como requisito de procedibilidad contra el fallo (no verificada)
   y los beneficios por colaboración (inexequibles).
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

> **Actualización del 29 de agosto: quedan 2, y las dos por ausencia real de
> norma.** ADUANERO cerró entero: tres fichas estaban leídas verbatim en
> `normograma.dian.gov.co` y declaradas sin verificar SOLO por el dominio —el
> código ya lo aceptaba, la doctrina no lo listaba; el usuario decidió y la
> doctrina se alineó—; la cuarta remitía al art. 164 del CPACA, que se leyó en
> el Senado: cuatro meses (num. 2 lit. d). Siguen abiertas POLICIVO (el art.
> 203 de la Ley 1801 remite a un reglamento que no existe) y PROPIEDAD_INTELECTUAL
> (ninguna de las cuatro normas de derecho de autor fija la prescripción de la
> acción civil). Ninguna de las dos se cierra leyendo más: se cierran cuando
> exista la norma.


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

---

## 9. LOS CUATRO VERIFICADORES NORMATIVOS (28 ago 2026) — material listo para catalogar

Cuatro agentes leyeron sobre texto oficial del Senado, en crudo, y devolvieron
articulado verificado. **Esto no es un censo: es materia prima ya comprobada.**
Todo lo de abajo está leído verbatim salvo donde diga NO VERIFICADO.

### 9.1 CORRECCIONES QUE TOCAN FICHAS EXISTENTES — hacer primero

1. **NOTARIAL no debe tener rol SECRETARIA, y hay artículo para sostenerlo.** Se
   buscó la raíz «secretari» en todo el Decreto 960 de 1970 y en el Título 6 de
   la Parte 2 del Decreto 1069 de 2015: **ningún resultado es una secretaría
   notarial** — son la Secretaría de la Superintendencia, el Secretario Técnico
   del Consejo Superior de la Carrera Notarial y secretarías de hacienda. El
   emisor de todo acto es **el notario, con firma autógrafa**: D960 art. 3 (sus
   catorce funciones, todas suyas), art. 6 («Corresponde al Notario la redacción
   de los instrumentos»), art. 8 (autonomía), art. 9 (responde de la regularidad
   formal), art. 85 («Terminará con la firma autógrafa del Notario»), art. 86 (la
   corrección «volverá a firmarse por el Notario, sin lo cual ésta no tendrá
   ningún valor») y D1069 art. 2.2.6.1.2.5.1 («Las diligencias de autenticación
   serán suscritas por el notario con firma autógrafa en último lugar»). Los
   dependientes existen como personal (D960 art. 14 num. 14 y art. 217), no como
   órgano con actos propios. **El catálogo ya lo resolvió bien: sus 30 fichas
   notariales están bajo DESPACHO. No crear SECRETARIA aquí.**
2. **POLICIVO tampoco.** Misma búsqueda en las cinco particiones de la Ley 1801:
   ningún resultado es secretaría del inspector. La razón es estructural — el
   art. 223 num. 3 lit. d) cierra con «La decisión quedará notificada en
   estrados» y los recursos «se solicitarán, concederán y sustentarán dentro de
   la misma audiencia». Sin notificación posterior no hay secretaría que la
   practique.
3. **NO CITAR EL DECRETO 2148 DE 1983.** Está derogado por el art. 3.1.1 del
   Decreto 1069 de 2015 («Derogatoria Integral») y **compilado** en el Libro 2,
   Parte 2, Título 6. Y antes de citar un artículo compilado hay que verificar si
   el **Decreto 541 de 2023** lo suprimió: al menos 2.2.6.1.1.1, 2.2.6.1.1.6 y
   2.2.6.1.2.1.8 lo fueron. El **Decreto 960 de 1970 sí sigue vigente**: es
   decreto-ley, no norma reglamentaria, y queda fuera de esa derogatoria.
4. **Tutela — el plazo de dos días NO es de remisión a la Corte.** Son tres
   relojes distintos y confundirlos es el error típico: **1 día** para enviar a
   la Corte el fallo **no impugnado** (art. 31 inc. 2); **2 días** para remitir
   **al superior** cuando sí se impugnó (art. 32 inc. 1); **10 días desde la
   ejecutoria de segunda instancia** para remitir a la Corte (art. 32 inc. 2). El
   art. 33 **no tiene plazo de remisión**: tiene los de la Corte (30 días de
   selección, 3 meses de decisión).
5. **Tutela — reparto:** no citar el Decreto 306 de 1992 art. 8, derogado por el
   art. 6 del Decreto 1382 de 2000. Va el **D1069 art. 2.2.3.1.2.1 y ss.**, con
   las modificaciones de los Decretos 1983 de 2017, 333 de 2021 y 799 de 2025.
6. **Arbitraje — artículos mal atribuidos.** Los arts. 7, 17, 22, 23 y 33 de la
   Ley 1563 **no** regulan al secretario. Los que sí: 8 inc. 2, 9, 10 inc. 3, 15,
   16, 19, 20 inc. 4, 26/27, 28 y 40. Y el art. 47 no regula una «entrega del
   expediente por el secretario»: **el laudo ordena el archivo en el centro**, y
   las copias y desgloses posteriores son actos **del centro**, no del secretario,
   que ya cesó (art. 35).
7. **PENAL — tres fichas de DESPACHO son actos de la FISCALÍA**, no del juez:
   «Escrito de acusación», «Formulación de imputación» y «Solicitud de medida de
   aseguramiento». El fiscal es parte. Un defensor que hoy pida «Formulación de
   imputación» recibe el escrito de su contraparte. O se crea rol FISCALIA o van
   a LITIGANTE. **Y el «archivo de las diligencias» del art. 79 tampoco es auto
   del despacho: lo dispone la Fiscalía.**
8. **PENAL — no existe notificación por estado, ni edicto de sentencia, ni
   artículo de ejecutoria en la Ley 906.** Barrido completo de los 13 bloques.
   Esos tres son **Ley 600 de 2000** (arts. 179, 180 y 187). La ejecutoria en
   acusatorio se integra por el **art. 25** (remisión al CPC, hoy CGP). Si el
   catálogo tiene «estado» o «ejecutoria a los 3 días» en penal acusatorio, está
   mal. **No inventar un artículo de ejecutoria en la Ley 906.**
9. **PENAL — no existe «auto que decreta pruebas de refutación».** El art. 362
   solo fija el orden de presentación. El auto de pruebas es el **357**; la
   exclusión, el **359**; y el **361 prohíbe la prueba de oficio**.
10. **PENAL — art. 317 vigente = art. 6 de la Ley 2477 de 2025** (60/120/150
    días), y el art. 332 num. 1 y su parágrafo = art. 10 de la misma ley.
    Verificar qué texto está cargado.
11. **Contradicción normativa real que hay que declarar, no resolver:** el art.
    318 dice que contra la decisión sobre revocatoria o sustitución de la medida
    de aseguramiento «no procede recurso alguno», y el art. 177 la lista como
    apelable en efecto devolutivo.
12. **INSOLVENCIA — el régimen es CGP, no CPACA** (Ley 1116 art. 124 + CGP art.
    24 par. 3: «Las providencias que profieran las autoridades administrativas en
    ejercicio de funciones jurisdiccionales NO son impugnables ante la
    jurisdicción contencioso administrativa»). La misma Superintendencia opera
    bajo dos regímenes según el sombrero: administrativo o jurisdiccional.

### 9.2 CGP — actos de secretaría, verificados uno a uno

**Hallazgo negativo que vale una ficha:** el CGP **no tiene artículo de
«funciones del secretario»** y la expresión **«informe secretarial» no aparece ni
una vez** en sus 627 artículos. El art. 42 num. 11 la desincentiva: deber del
juez de «**abstenerse de solicitarle por auto informe** sobre hechos que consten
en el expediente». Esa figura vive en la Ley 270 de 1996, NO VERIFICADA.

| Art. | Acto | Plazo y reloj |
|---|---|---|
| 89 | Recibe la demanda y deja **constancia de fecha** | secretaría |
| 109 | Constancia de fecha y hora de memoriales; **con término común debe esperar a que venza para todas las partes** | secretaría |
| 110 | **Traslado en secretaría: 3 días, «no requerirá auto ni constancia»**; la lista se mantiene **1 día** y corre desde el siguiente | **parte** |
| 111 | «Los oficios y despachos serán firmados **únicamente por el secretario**» | secretaría |
| 114 num. 1 | Copias **a petición verbal, sin auto** | secretaría |
| 114 num. 4 | Pago de la reproducción: **5 días so pena de declarar desierto el recurso** | **parte — extingue el derecho** |
| 115 | **Certificaciones sin auto**: existencia, estado y **ejecutoria** | secretaría |
| 116 | Desgloses por orden del juez; las **constancias** las pone el secretario | mixto |
| 118 inc. 5 | Mientras corre término no ingresa el expediente al despacho, salvo urgencia **previa consulta verbal con constancia** | secretaría |
| 122 | Anotación de fecha y hora del mensaje de datos | secretaría |
| 107 num. 6 | **El acta la firma el JUEZ**; el **duplicado de las grabaciones queda bajo custodia del secretario** | — |
| 120 | **Lista visible** de procesos al despacho para sentencia | secretaría |
| 120 | Fuera de audiencia: **autos 10 días, sentencias 40 días** | **juez** |
| 121 | **1 año** primera instancia, **6 meses** segunda; vencido, **pierde competencia automáticamente** | **juez, con sanción** |
| 324 | **«El secretario deberá remitir el expediente al superior dentro del término máximo de cinco (5) días» — «El incumplimiento de este deber se considerará falta gravísima»** | **secretaría, con sanción** |
| 323 inc. final | Si no hubo apelación, «el secretario comunicará **inmediatamente** este hecho al superior **sin necesidad de auto**» | secretaría |
| 108 | Emplazamiento: surtido **15 días después** de publicada la información en el Registro Nacional de Personas Emplazadas | **emplazado** |
| 146 | Impedimentos y recusaciones **de los secretarios**: mismas causales salvo nums. 2 y 12 del art. 141; **no suspende el proceso** | — |

**Ejecutoria del art. 302 dispara, comprobado:** los **30 días** del art. 306 para
pedir la ejecución con notificación por estado; los **6 meses** del art. 317 lit.
f) para volver a demandar tras desistimiento tácito, **con ineficacia de la
interrupción de la prescripción**; los **30 días** del art. 384 num. 7 antes de
que se levanten las cautelares; los **20 días** del art. 444 num. 1 para el
avalúo. Y el **estado** dispara los 3 días de reposición y apelación.

**Ley 2213 de 2022 — art. 11:** «Los **secretarios** … remitirán las
comunicaciones … **mediante mensaje de datos** … las cuales **se presumen
auténticas** siempre que provengan del correo electrónico oficial».

**NO VERIFICADO y declarado:** «Banco Agrario» tiene **cero ocurrencias** en el
CGP; la custodia y entrega material de títulos judiciales no está en este código
(está en la Ley 270 y acuerdos del CSJ). El **préstamo de expediente no existe**:
el art. 124 **prohíbe el retiro** mientras el proceso está en trámite.

### 9.3 CPACA — lo que falta y su verbatim

Ya se catalogaron cinco fichas (notificación electrónica, estado electrónico,
notificación de sentencia, constancia de firmeza y remisión al superior). Queda:

- **Art. 201A, artículo NUEVO** (art. 51 de la Ley 2080): «Los traslados deberán
  hacerse de la misma forma en que se fijan los estados», y se **prescinde del
  traslado por secretaría** si la parte acreditó el envío digital, entendiéndose
  realizado a los **2 días hábiles**.
- **Traslados con su plazo y dueño:** demanda **30 días** (art. 172); excepciones
  **3 días** (art. 175 par. 2); medida cautelar **5 días independientes del de
  contestación** (art. 233) — la trampa clásica; sustentación de apelación de
  autos **3 días** (2 en electoral) con traslado **sin auto** (art. 244 num. 3);
  súplica **3 días** (art. 246 lit. c); alegatos de primera instancia **10 días**
  (art. 181); alegatos de segunda **10 días solo si hubo pruebas** (art. 247 num.
  5); traslado al Procurador **10 días improrrogables sin auto** (art. 184 num. 6).
- **Autos que faltan, con artículo:** inadmisorio (170, **10 días de corrección,
  susceptible de reposición**); rechazo (169, apelable, sin traslado); decreta
  pruebas (180 num. 10 y 212-213, **audiencia de pruebas dentro de 40 días**; el
  que niega pruebas es apelable por 243 num. 7, el que las decreta de oficio no);
  excepciones previas (175 par. 2 y 180 num. 6, por remisión a CGP 100-102); fija
  audiencia inicial (180 num. 1, **dentro del mes**, aplazamiento a 10 días y
  **en ningún caso otro aplazamiento**, «**se notificará por estado y NO será
  susceptible de recursos**»); medida cautelar de urgencia (234, **sin previa
  notificación**); medidas cautelares ordinarias (233, **10 días para decidir**,
  y **la medida solo se hace efectiva desde la ejecutoria del auto que acepta la
  caución**); suspensión provisional (230 num. 3, 231, **232: no requiere
  caución**); súplica (246); nulidad (207-210, **control de legalidad que
  precluye la alegación en etapas siguientes**).
- **Art. 243A** — catálogo de **17 providencias sin recursos ordinarios**. Pieza
  clave para no ofrecerle al cliente un recurso improcedente.
- **NO EXISTE el grado jurisdiccional de consulta en lo contencioso
  administrativo.** Barrido completo: las apariciones de «consulta» son la Sala
  de Consulta y Servicio Civil, la consulta previa administrativa, la consulta de
  expedientes, y el **art. 47A** (consulta de la suspensión provisional del
  servidor en el sancionatorio fiscal: **3 días** del ciudadano para alegar, **10
  días** del superior para decidir, y **en sede de consulta no puede agravarse**).
- **Procedimiento administrativo, arts. 66-73:** citación **5 días** desde la
  expedición (68); aviso si no se logra la personal a los **5 días**, surtido «al
  finalizar el día siguiente al de la entrega» (69); actos de registro
  notificados **el día de la anotación** (70); art. 72 — sin los requisitos «**no
  se tiene por hecha la notificación ni produce efectos legales la decisión**»,
  salvo conducta concluyente; silencio negativo **3 meses** (83).
- **El CPACA no nombra funcionario para notificar en sede administrativa.** Habla
  de «las autoridades» o «la autoridad que expidió el acto». La atribución a la
  Secretaría General es reparto interno por manual de funciones, **no norma del
  CPACA** — modelarlo como cargo delegado, no como rol legal.

### 9.4 LABORAL — Ley 2452 de 2025, y el problema de las dos numeraciones

**El catálogo necesita las dos numeraciones conviviendo, no una sustitución**:
el art. 330 mantiene el CPTSS para los procesos iniciados antes del 2 de abril de
2026.

- **Art. 208 — el estado ya NO lo firma el secretario:** «Las notificaciones por
  estado se fijarán **virtualmente**, con inserción de la providencia, y **no será
  necesario imprimirlos, ni firmarlos por el secretario, ni dejar constancia con
  firma al pie**». No se insertan cautelares, menores ni reserva legal.
  **Cualquier plantilla de «estado firmado por el secretario» es de la ley
  derogada.**
- **Art. 82 — el traslado fuera de audiencia es de 3 días, corre por estado y
  «no requerirá auto ni constancia en el expediente».** Si el catálogo tiene
  «auto que corre traslado» como actuación laboral genérica, sobra.
- **Art. 84 — aquí SÍ hay norma expresa de constancia de ejecutoria**, a
  diferencia del penal: el secretario la expide «**sin necesidad de auto que las
  ordene**», y el art. 83.2 la exige para usar la copia como título ejecutivo.
- **Art. 214 — ejecutoria:** inmediata en audiencia; **3 días** fuera de
  audiencia; y **suspendida mientras no se resuelva la aclaración o adición**.
- **Art. 230 — remisión al superior: «El secretario deberá remitir la actuación
  al superior dentro del término máximo de cinco (5) días contados a partir de la
  ejecutoria del auto que concede el recurso.»** No existe equivalente en la Ley
  906.
- **Art. 231 — la consulta laboral ya no es solo a favor del trabajador:** son
  **siete supuestos**, incluidas las sentencias meramente declarativas, las que
  niegan honorarios y los fallos inhibitorios. Y su parágrafo: «**Mientras no se
  surta el grado jurisdiccional de consulta, la providencia NO QUEDARÁ
  EJECUTORIADA.**» Omitirla es **causal de nulidad** (art. 92.8).
- **VACÍO VERIFICADO: la Ley 2452 no fija plazo de remisión al superior en el
  grado de consulta.** Los 5 días del art. 230 cuelgan de «la ejecutoria del auto
  que **concede el recurso**», y en consulta no hay recurso ni auto que lo
  conceda. **Registrarlo como vacío, no rellenarlo por analogía.**
- **Art. 258 A — inasistencia a la audiencia inicial:** se presumen ciertos los
  hechos susceptibles de confesión de la contraparte; si no admiten confesión,
  **indicio grave**; apoderado ausente sin justificación, **multa de 1 SMLMV**.

### 9.5 TUTELA, POPULAR Y CUMPLIMIENTO — relojes verificados

- **D2591 art. 30:** el fallo se notifica «**a más tardar al día siguiente** de
  haber sido proferido» — reloj del despacho. **Art. 31: 3 días para impugnar,
  reloj del ciudadano y preclusivo**, y el art. 15 recuerda que «los plazos son
  perentorios o improrrogables». La **constancia de notificación del fallo es el
  disparador más importante de la rama**: sin ella el término no es computable.
- **Art. 27 — cumplimiento en cascada:** **48 horas** sin cumplir y el juez se
  dirige al superior; «**pasadas otras cuarenta y ocho horas**» abre proceso
  contra el superior y adopta las medidas directamente. **Art. 29 num. 5:** el
  plazo de cumplimiento que fije el fallo «**en ningún caso podrá exceder de 48
  horas**» — reloj del accionado.
- **Art. 52 — desacato:** arresto hasta **6 meses** y multa hasta **20 SMLMV**;
  consulta al superior que decide en **3 días, en efecto DEVOLUTIVO** (en acción
  de cumplimiento, art. 29 de la Ley 393, la consulta es **subsidiaria de la
  apelación y en efecto SUSPENSIVO** — no confundirlas).
- **Tutelas masivas (D1069 art. 2.2.3.1.3.2):** recibido el informe de
  contestación que revela tutelas anteriores, el juez remite **dentro de las 24
  horas**.
- **Ley 472 art. 21 — el aviso a la comunidad es FACULTATIVO y sin plazo:** «a
  los miembros de la comunidad **se les podrá informar** a través de un medio
  masivo … o de cualquier mecanismo eficaz». No es edicto obligatorio.
- **Ley 472 art. 37:** la apelación se resuelve «dentro de los **20 días**
  contados a partir de la radicación del expediente en la **SECRETARÍA** del
  Tribunal» — la ley sí nombra a la secretaría, y la radicación es la constancia
  que dispara el plazo del superior.
- **Ley 472 art. 80:** todo juez «**deberá enviar una copia de la demanda, del
  auto admisorio y del fallo definitivo**» al Registro Público de la Defensoría.
- **Acción de grupo:** **20 días desde la publicación de la sentencia** para
  acogerse (art. 55) y **5 días desde el vencimiento del traslado** para
  excluirse (art. 56) — vencido, queda vinculado. Publicación del extracto
  «**dentro del mes siguiente a su ejecutoria**» (art. 65 num. 4).
- **Ley 393 art. 27:** remisión al superior «**a más tardar al día siguiente**»
  — 1 día, contra los 2 de tutela. El superior falla en **10 días** (en tutela,
  20).

### 9.6 ARBITRAJE — el secretario del tribunal

- **Art. 9:** debe ser **abogado**, sin parentesco ni relación con los árbitros, y
  **escogido de la lista del centro**. **Art. 8 inc. 2:** no puede estar en más de
  **cinco** tribunales con entidad pública.
- **Art. 20 inc. 4:** acepta por escrito **dentro de 5 días** — reloj suyo, y el
  silencio equivale a declinación (art. 14 num. 1).
- **Art. 15:** informa coincidencias de los **dos últimos años**; las partes
  tienen **5 días** para dudas; **si se establece que no reveló, «por ese solo
  hecho quedará impedido»**; deber de revelación continuo «sin demora».
- **Art. 10 inc. 3 — acto propio y obligatorio:** «**Al comenzar cada audiencia
  el secretario informará el término transcurrido del proceso.**»
- **Art. 40 — dos actos de secretaría:** «**Por secretaría del tribunal se
  correrá traslado a la otra parte por quince (15) días sin necesidad de auto que
  lo ordene**», y vencido, «**dentro de los cinco (5) días siguientes, el
  secretario del tribunal enviará los escritos … a la autoridad judicial
  competente**».
- **Art. 41 — carga previa que extingue causales:** las causales 1, 2 y 3 de
  anulación **solo pueden invocarse si se hicieron valer por reposición contra el
  auto de asunción de competencia**; y la 6 no puede alegarla quien no la hizo
  valer oportunamente.
- **Art. 44:** anulado por causales 3 a 7, hay **3 meses desde la ejecutoria**
  para reconvocar, so pena de que **opere la caducidad**.

### 9.7 INSOLVENCIA — la categoría legal que sustituye a la secretaría

**Ley 1116 art. 8 inc. 2**, y es la norma más útil de la rama: los actos de
trámite que no deben controvertirse — «expedición de copias, archivo y desglose
de documentos, comunicación al promotor o liquidador de su designación» — «**no
requerirán la expedición de providencia judicial** … y para su perfeccionamiento
**bastará con el hecho de dejar constancia en el expediente de lo actuado, lo
cual tampoco requerirá notificación**».

- **Art. 19 num. 3 y 4:** el promotor presenta el proyecto en **20 días a 2
  meses** so pena de remoción; traslado de **10 días** a los acreedores para
  objetar, disparado por el vencimiento anterior.
- **Art. 26 — sanción que no extingue pero posterga:** el acreedor que no objetó
  «**solo podrá hacer[las] efectivas persiguiendo los bienes que queden una vez
  cumplido el acuerdo**». Salvedad: las acreencias omitidas **a sabiendas** dan
  acción solidaria **en cualquier momento** contra administradores, contadores y
  revisores.
- **Art. 29 — cuatro relojes encadenados:** traslado **5 días** para objetar;
  «de manera inmediata» traslado de **3 días** al acreedor objetado; **10 días**
  para conciliar; lo no conciliado va a audiencia. «**La única prueba admisible
  para el trámite de objeciones será la documental.**» **El deudor no puede
  objetar** lo que él mismo incluyó.
- **Art. 19 num. 11:** fijación en las oficinas del juez del concurso, **5 días**,
  del aviso de inicio — el único acto de publicidad con plazo numérico.
- **Art. 20:** para alegar la nulidad de lo actuado en contravención «**bastará
  aportar copia del certificado de la Cámara de Comercio en el que conste la
  inscripción del aviso de inicio**».
- **Persona natural no comerciante — Ley 2445 de 2025 reformó el título:** el
  emisor es el **CONCILIADOR**, no un secretario ni un juez (CGP art. 533). Art.
  548: **1 día** desde que recibe la información actualizada para comunicar a
  todos los acreedores. Art. 545: basta «copia de la **certificación que expida
  el conciliador**» para alegar la nulidad.

### 9.8 POLICIVO — todos los plazos del art. 223

**5 días** para citar a audiencia (autoridad) · **20 minutos** de argumentos por
parte · **5 días** de pruebas · **24 horas** de antelación del aviso de inspección
· **recursos dentro de la misma audiencia — el plazo más preclusivo de la rama**
· **2 días** para remitir al superior (autoridad) · **2 días** para sustentar ante
el superior (ciudadano, **extingue la apelación**) · **8 días** para resolver
(superior) · **5 días** para cumplir desde la ejecutoria (infractor).
Apelación **devolutiva**, salvo **suspensiva en infracciones urbanísticas**.

**Art. 223A (Ley 2197 de 2022) — regla contraintuitiva:** hay **3 días hábiles**
para objetar el comparendo, y vencidos «**no podrá iniciarse el proceso verbal
abreviado, por cuanto se pierde la oportunidad legal**» — el vencimiento **cierra**
el proceso en vez de abrirlo. A los **5 días** de expedida la orden la multa
queda en firme y puede cobrarse coactivamente.

### 9.9 NO VERIFICADO, declarado por los agentes

Ley 2080 de 2021 en su articulado autónomo (las atribuciones vienen de las marcas
del propio CPACA) · las «Notas del Editor» del art. 203 del CPACA · CGP arts.
291-301 y 110 en detalle · art. 612 del CGP (plazo de la ANDJE) · art. 323 del
CPC (forma del edicto) · Decisión Andina 486 art. 170 (funcionpublica devolvió
403) · el CPTSS derogado, que sigue rigiendo los procesos abiertos antes del 2 de
abril de 2026 · Ley 270 de 1996 · estructura interna de la Supersociedades ·
trámite y término del recurso de revisión arbitral · Ley 1801 arts. 205-222 ·
procedimiento penal abreviado de la Ley 1826 de 2017.

---

## 10. Acceso de soporte (8a) — lo entregado y lo declarado — 28 de agosto de 2026

**Entregado.** `supabase/migration-acceso-de-soporte.sql`, el servicio, el
controlador y las rutas de ambos lados; en el frontend la franja permanente, el
diálogo de decisión del socio y el formulario de solicitud de operación, con su
botón en la ficha de firma (7b′, que hasta hoy figuraba como omisión razonada).

**Lo que el artboard pide y NO está, con la razón:**

> «El resumen final por correo llega siempre, incluso si la firma nunca abrió el
> panel: la garantía no puede depender de que alguien estuviera mirando.»

**No hay infraestructura de correo saliente en este backend.** No hay proveedor
configurado, ni plantillas, ni cola. Ese correo NO se envía, y decirlo importa
más que la ausencia misma: una garantía que se supone entregada es peor que una
declarada pendiente, porque nadie la echa de menos.

Lo que sí queda hoy, y es su equivalente consultable:

- las cinco acciones (`SUPPORT_ACCESS_REQUESTED`, `AUTHORIZED`, `DENIED`,
  `REVOKED`, `VIEWED`) en la auditoría **de la firma**, no en la de operación;
- cada pantalla abierta, con su hora, escrita **por el servidor** en
  `support_access_views` — el cliente de operación no puede omitirla;
- todo ello sobrevive a la sesión, que es justo lo que el panel en vivo no hace.

Cerrar el hueco de verdad exige un proveedor de correo transaccional. Es trabajo
de infraestructura, no de esta pantalla.

**Segunda omisión, menor:** el artboard menciona una vista de incidencias
asociada a la sesión de soporte. No existe modelo de incidencias en el producto,
así que no se pintó nada.

---

## 11. ~~EN COLA~~ RESUELTO el 29 de agosto — el descubrimiento pregunta a dos cortes

> **Cerrado.** `discoverCsjRulings` **ya existía** —con sus cuatro colecciones y
> su lectura oficial— y el descubrimiento simplemente no lo llamaba. Se conectó.
> Probado contra la consulta que lo destapó: «servidumbre de tránsito» devuelve
> hoy `STL429-2023` de la Corte Suprema, donde antes devolvía cero.
>
> Las dos corporaciones se consultan **en paralelo** —son servidores
> independientes—, **una que falle no tumba a la otra**, y **sin llave de Brave
> todavía se puede preguntar a la Suprema**, porque tiene buscador propio: antes
> el descubrimiento entero dependía de una llave que solo hace falta para la
> constitucional.
>
> **Sigue fuera lo contencioso administrativo**: el Consejo de Estado no tiene
> lector oficial en este producto. El aviso de la pantalla ya lo dice con esas
> palabras, en vez de la frase vieja —«probablemente no vive en esa relatoría»—
> que dejó de ser cierta al conectar la segunda corte.

### Lo que se diagnosticó en su momento

Verificado en producción el 28 de agosto con la consulta «servidumbre de
tránsito»: **Brave funciona** —devolvió 6 candidatas— y el verificador oficial
las descartó todas, correctamente, porque ninguna existe en la relatoría de la
Corte Constitucional.

El límite está en tres capas de `backend/src/modules/jurisprudence/discovery.service.ts`:

| Línea | Qué fija |
|---|---|
| 51 | `OFFICIAL_HOST = 'corteconstitucional.gov.co'` |
| 69 | la consulta se restringe a `site:<ese host>/relatoria` |
| 108 | el regex de citas solo reconoce `SU`, `C` y `T` |

Consecuencia: **casación civil, laboral y penal, y todo lo contencioso
administrativo, quedan fuera del descubrimiento.** El aviso de la pantalla ya lo
confiesa; el hueco es real y no es un defecto de implementación — el módulo se
construyó contra una sola corporación porque `fetchOfficialRuling` solo sabe
confirmar contra ese registro.

Ampliarlo significa **un verificador por corporación**. La pieza difícil ya
existe para la Corte Suprema: su API GraphQL funciona y la usa `check:csj`. El
Consejo de Estado está sin probar.

---

## 12. Catálogo maestro (8b) — lo entregado y las tres omisiones razonadas

**Entregado.** `GET /api/admin/catalog-master` (bajo `requireSuperAdmin`) y
`CatalogMasterDialog`, abierto desde la cabecera de la consola de operación —
no desde una ficha de firma, porque el maestro no es un dato DE una firma.

Muestra el censo real del maestro (total, ramas, transversales, verificadas, no
caducan, sin verificar), el reparto por rama y por rol, y **el alcance de la
curaduría de las firmas en CUENTAS**: cuántas firmas corrigieron algo, cuántas
verificaciones hay, y las doce actuaciones que más firmas han corregido — que es
una señal sobre el maestro, no sobre las firmas.

**La línea de 2c se impone por la forma de la consulta, no por un aviso.** El
servicio selecciona exactamente dos columnas de `catalog_verifications`:
`firm_id` y `actuacion_id`. Ni `term_description`, ni `legal_basis`, ni `note`.
Operación puede saber CUÁNTAS firmas tocaron una actuación; nunca QUÉ
escribieron. Lo que no se lee no se puede filtrar por descuido.

### Lo que el artboard pide y NO está, con la razón

1. **«Norma derogada · 38».** El tipo `Actuacion` **no tiene campo de
   derogatoria**. Ninguna ficha declara si su norma sigue viva, así que la cifra
   no se puede calcular. Estimarla leyendo el texto del `legalBasis` daría un
   número que se lee igual que uno medido. Se devuelve `null` y la pantalla dice
   que no se sabe.
2. **«Publicar cambios» y la propagación a las firmas.** El maestro es un
   **artefacto de compilación**: `research/actuaciones-*.json` → `build-catalog.py`
   → `data/*.ts` → paquete. No hay tabla que escribir en caliente, así que un
   botón «Publicar» no propagaría nada — y el propio artboard llama a esa acción
   la más peligrosa de toda la consola. Un botón peligroso que no hace nada
   enseña a pulsarlo. **Cerrarlo de verdad es mover el maestro a base de datos**,
   no añadir un endpoint.
3. **«Propuestas de las firmas · 27».** No hay tabla ni flujo: hoy una firma no
   puede ofrecer una actuación al maestro. La lista está **vacía por inexistente,
   no por estar en cero**, y la diferencia importa.

### La regla que gobernará la publicación cuando exista

Queda escrita en el componente para que quien la construya no la redescubra:

- Una derogatoria **no borra** la verificación de la firma: la reetiqueta como
  «verificada contra norma derogada» y muestra el artículo equivalente al lado.
  Es la misma solución del glosario (3b), aplicada al por mayor.
- Su recíproca: publicar **nunca** marca como verificada una ficha que la firma
  no verificó. Si el maestro pudiera conceder verificaciones, el sello dejaría de
  significar «alguien de esta firma lo leyó».

---

## 13. Catálogo / curaduría (1i) — las secciones que existían y nadie veía

**El hallazgo.** Las 794 fichas traen sus **secciones obligatorias**: 4.685 en
total, **4.352 con artículo confirmado y 333 sin él**. El motor SÍ las usa —son
las que le exige al escrito al redactarlo— y la pantalla de curaduría **no
mostraba ninguna**. Un requisito que la aplicación impone y el abogado no puede
leer es un requisito que no puede discutir, y las 333 sin artículo son
justamente las que convendría discutir.

**Entregado.** `ActuacionDetail.tsx`, montado en el panel de la 1i (que pasa de
380 a 460 px y se vuelve desplazable):

- **Los tres bloques del artboard, cada uno con SU estado**: término, norma y
  autoridad. Una ficha puede estar verificada en el término y coja en la
  autoridad, y un único sello arriba escondía justo la mitad que falta — y la
  autoridad es la que manda al abogado a radicar ante quien no es.
- **La tabla de secciones**, con número, nombre, fundamento y estado
  (`CON ARTÍCULO` / `SIN ARTÍCULO`), y el aviso de que a la sección sin artículo
  se le sigue exigiendo el requisito: lo que falta es la cita, no la exigencia.
- El enlace al texto oficial de la norma y la curación de la firma con su autor
  y su fecha.

### Lo que el artboard pide y NO está, con la razón

1. **Verificar una sección concreta** («Verificar sección 04», con casilla y
   «No aplica»). `catalog_verifications` guarda **una fila por firma y
   actuación** —es su llave primaria— y **no tiene columnas por sección**. El
   panel se podría pintar hoy y no habría dónde guardar el resultado: el curador
   leería el artículo, marcaría la casilla, y al recargar seguiría sin
   verificar. Eso es peor que no ofrecerlo. **Exige columnas nuevas, no un
   componente.**
2. **Historia de curaduría** con varias entradas. Por la misma llave primaria
   solo sobrevive la ÚLTIMA curación: no hay historia que listar. Se muestra el
   estado actual y se dice que una curación reemplaza a la anterior.
3. **«Usada en 11 escritos»** y **«Actuación 214 de 651»**. La primera exige
   relacionar borradores con actuaciones, cosa que hoy no se guarda; la segunda,
   un índice estable dentro del filtro. Ninguna cambia lo que el abogado puede
   verificar.
4. **«Texto oficial recuperado»** de la norma. La recuperación oficial existe
   para JURISPRUDENCIA, no para normas — traer el artículo de una ley exige otro
   verificador. El enlace a la fuente sí está, que es lo comprobable hoy.

**Nota sobre «No aplica».** El artboard lo quiere al mismo nivel que «Marcar
verificada» para que no se registre como sin verificar por comodidad. Eso **ya
se cumplía**: `VerificationForm` ofrece `NO_CADUCA` como una de tres opciones
del mismo peso, no como un enlace al margen. No se tocó.

---

## 14. Visor (5a) y Buscador (1h) — lo medido el 28 de agosto

### 1h Buscador: YA ERA FIEL. La llamé parcial leyendo el documento viejo.

`SearchView.tsx` ya cumple lo esencial del artboard: curado y automático son
**dos bloques con encabezado propio**, el segundo en menor contraste, con filete
de cita punteado y **sin botón de citar** —citar algo que nadie leyó cuesta un
clic más—; la providencia va en mono y de primero; el fragmento en serif con
filete izquierdo. **Cuarta vez que `AUDITORIA-DESIGN.md` me hace planear sobre
una pantalla que ya estaba hecha.**

Corrección a una señal que yo mismo anoté en el skill: «las pantallas fieles
citan su artboard en el docblock» es **más débil de lo que dije** —`SearchView`
es fiel y no lo cita—. La ausencia de la cita no prueba nada; solo su presencia
es informativa.

Lo que a 1h le falta de verdad, y no se puede pintar hoy: la anotación humana
(«anotada por D. Cárdenas · su nota») y «citada en 4 escritos» — `CorpusPrecedent`
no tiene campo de anotador ni relación con borradores; y la etiqueta «podría ir
en contra de su tesis», que exige comparar la providencia con la tesis del
escrito.

### 5a Visor: entregada la barra de revisión, con la verdad que sí existe

**El hueco de fondo.** El motor resolvía la ficha del catálogo para instruir al
modelo y **la descartaba al responder**. El abogado recibía un escrito que
afirma un plazo sin poder saber de dónde salió, si alguien lo verificó, o si su
propia firma lo corrigió.

**Entregado.** `resolverProcedencia` en `catalogGuidance.ts` adjunta al borrador
la ficha contra la que se redactó —artículo, fuente, autoridad, estado del
término, si la firma la curó y cuántas secciones obligatorias carecen de
artículo—, y `DraftProvenanceBar` la muestra **arriba del papel**, porque una
advertencia bajo seis páginas la lee quien ya decidió.

Tres estados, y **el silencio es uno**: ámbar si el término no está comprobado,
si faltan artículos de sección o si la actuación no está catalogada; verde
discreto si la firma la curó; **nada** cuando no hay qué advertir — una barra que
casi siempre dice «todo bien» se vuelve marco y deja de leerse el día que dice
otra cosa. Un borrador guardado antes de esto trae `undefined` y **tampoco
advierte**: no sabemos que le falte respaldo, sabemos que no lo registramos.

### Lo que 5a pide y NO está, con la razón

1. **«Este borrador contiene 2 afirmaciones sin verificar»** con salto «1/2».
   **Ese conteo no existe**: nadie analiza el texto generado frase por frase
   para clasificar afirmaciones. Una cifra inventada en la pantalla donde se
   decide firmar sería la peor falsa alarma — la que enseña a ignorar todas las
   demás. Se dice lo que sí se sabe: contra qué ficha se redactó y cómo está.
2. **Miniaturas con barra ámbar en el margen** de la página con problemas.
   Mismo dato faltante: sin afirmaciones localizadas, no hay página que marcar.
3. **Casillas de exportación** (membrete, anotar el margen, hoja de fuentes).
   La exportación no acepta variantes hoy; ofrecerlas sería pintar interruptores
   que no mueven nada.

---

## 15. Móvil (4d) — el cascarón, y lo que falta por módulo

**El punto de partida medido:** 44 utilidades responsivas en toda la aplicación.
Era de escritorio, y la barra lateral son 224px fijos — más de la mitad del
ancho de un teléfono de 390px.

**Entregado: el cascarón.** El artboard lo pide en su título —«la estructura
repensada, no encogida»— y eso empieza por la navegación:

- Bajo `lg`, la barra lateral **desaparece** (`hidden lg:flex`; con `lg:block`
  el `<aside>` perdería su columna) y la reemplaza `MobileTabBar`: cuatro
  destinos —**Redactar, Orientar, Grabar, Más**— de 44px mínimo, con el área
  segura del sistema reservada para no quedar bajo la franja del gesto.
- `MobileMoreSheet` es una hoja inferior con los diez módulos restantes,
  **agrupados con los mismos verbos del escritorio** — reagruparlos crearía dos
  mapas mentales del mismo producto. No hereda el pliegue de «Administrar»: un
  pliegue dentro de un cajón cerrado son dos toques para llegar a Ajustes.
- **«Grabar» es Entrevistas, no Audiencias**, y la razón la da el artboard: «la
  entrevista es el módulo que más gana en móvil: el teléfono es la grabadora
  real». La mecánica lo confirma — una audiencia se SUBE como archivo de 50 MB,
  cosa que nadie hace desde un juzgado; una entrevista se graba con el cliente
  enfrente. Audiencias queda primera en «Más».
- **El radicado se oculta bajo `sm`**: veintitrés dígitos que no se encogen,
  junto a un bloque de acciones que tampoco, empujaban la cabecera fuera de la
  pantalla a 375px.

**Verificado:** compila; el login renderiza correctamente a 375×812 sin desborde
horizontal. **NO verificado visualmente:** todo lo que hay detrás del login —no
se introducen credenciales—, así que el cascarón necesita una mirada humana en
un teléfono real.

### Lo que falta, por módulo

El cascarón no es el móvil. Cada artboard móvil pide una estructura propia:

1. **4d · el taller de dos columnas se parte.** «En móvil la instrucción es la
   pantalla, y el documento generado se abre después como pantalla propia», con
   la configuración comprimida en dos chips que muestran término y fecha de
   vencimiento en 390px, y el primario de 48px fijo sobre la barra con el costo
   debajo.
2. **4d · orientación** pierde la retícula de dos columnas y gana altura; el
   estado se repite como ícono junto al título, porque en pantalla pequeña el
   filete de 3px se pierde.
3. **4d · entrevista**: el cronómetro como elemento más grande de la pantalla y
   el aviso de que sigue grabando con la pantalla apagada.
4. **4d · transcripción**: abandona las tres columnas — interlocutor y hora
   arriba, texto debajo, ancho completo; solo la fila en edición lleva tarjeta.
5. **5c / 5d** catálogo, búsqueda y saldo, con el glosario como hoja inferior.
6. **8d** ajustes, gestión de usuarios y consola de operación.
7. **9d** manual, elección de vía y chat.
8. **10c** borradores.
9. **4e / 5d / 8d / 9d / 10c** en tema oscuro.

---

## 16. CI llevaba doce commits en rojo, y no era el CI — 29 de agosto de 2026

**Lo que se vio:** `npm run check` en local decía 22/22 en verde en cada commit,
y GitHub Actions fallaba en todos. Doce seguidos, desde el 28 de agosto por la
noche. Siempre el mismo paso: `Facts triage cannot invent an actuación`.

**Lo que era:** un defecto real, determinista y reproducible en local. Nada de
red, nada de infraestructura.

### El defecto

`findByDocumentType` es la puerta por la que pasa cada nombre que el modelo
propone. Empezó a resolver una actuación **inventada**:

| | |
|---|---|
| pedido (inventado) | «Demanda de saneamiento por vicios ocultos **anticipada del arrendador**» |
| resolvía a | «Demanda de saneamiento por vicios redhibitorios» |
| que es | **CIVIL · compraventa**, Código Civil arts. 1914 a 1926 |
| con término | VERIFICADO — 6 meses/1 año para rescindir, 1 año/18 meses para rebajar, **desde la ENTREGA REAL** |

Un nombre de **arrendamiento** aterrizando en una ficha de **compraventa**, con
su término verificado. El motor le habría entregado esa ficha al modelo como
derecho aplicable y el escrito habría afirmado un plazo que no aplica al caso.
**Publicar el reloj de otro, con sello de verificado** — el defecto que este
proyecto lleva documentado como el peor de todos.

### La causa

El puntaje penalizaba `0.5` por cada palabra que **sobra en la ficha** y **nada**
por las que sobran en la petición. Compartían tres palabras —demanda,
saneamiento, vicios— y eso bastaba. «Arrendador», que es justo la palabra que
cambia el caso, no costaba nada. Apareció al crecer el catálogo de 651 a 794.

### El arreglo: un lado tiene que contener al otro

Se rechaza el candidato cuando la ficha trae palabras que el solicitante nunca
dijo **Y** el solicitante trae palabras que la ficha no tiene. No son la misma
actuación con adorno: son dos actuaciones que comparten vocabulario.

**No endurece el emparejador para todos**, que era la tentación que este módulo
ya tenía advertida por escrito. Los dos casos buenos siguen pasando porque en
ambos la petición nombra la ficha ENTERA y le añade adorno («Demanda de
reconvención anticipada», «Acción de tutela urgente prioritaria»), y la consulta
corta sigue pasando porque la ficha contiene todo lo pedido.

**Medido:** 794/794 nombres exactos siguen resolviendo; las consultas sueltas de
la interfaz aterrizan igual.

### Por qué estuvo doce commits escondido

`triage.check.ts` mezclaba **cuatro garantías deterministas** con
**observaciones que llaman al modelo**. Como su segunda mitad sale a la red, el
archivo entero está declarado en `CON_RED` de `run-all-checks.mjs`, y la suite
local omite los de red por defecto. Así que omitía también las garantías —las
que no llaman a nadie— y en local siempre se veía 22/22.

**Un archivo que mezcla una garantía determinista con una observación de red
hereda la clasificación de la parte más frágil, y la garantía deja de correr
donde más falta hace: antes de empujar.**

Se separó en `resolucion.check.ts` (`npm run check:resolucion`), sin red, que
corre en la suite ordinaria. `triage.check.ts` conserva lo que sí depende de que
un proveedor conteste.

---

## 17. «Las pantallas se ven recortadas» — la causa era una sola pieza compartida

**El síntoma reportado:** en el teléfono, el login se ve bien y **todas las
demás pantallas salen recortadas**.

**La causa NO estaba en cada vista.** Estaba en `HeaderTop`, la única pieza que
todas montan y el login no: su bloque derecho son **ocho controles `shrink-0`**
—pestañas, Word, PDF, copiar, concentración, marcar listo, firmas, salir— en una
fila que no envuelve. A 375px mide más que la pantalla, empujaba la cabecera
fuera del ancho, y como la raíz es `overflow-hidden`, **todo quedaba cortado**.

Que el login se viera bien era la pista: es la única pantalla sin cabecera.

**El arreglo:** `min-w-0 shrink overflow-x-auto` en el bloque, con
`lg:shrink-0 lg:overflow-x-visible` para no tocar el escritorio. `min-w-0` es
lo que permite ceder ancho —sin él, `shrink-0` en los hijos hace que el
contenedor imponga su tamaño al padre— y `overflow-x-auto` contiene el sobrante
DENTRO del bloque en vez de repartirlo por la página. Ninguna acción se esconde.

**Limitación conocida de ese arreglo:** el menú de exportación es un desplegable
`absolute` dentro de ese bloque, y un contenedor con `overflow-x-auto` recorta
lo que se sale de él. En móvil ese menú quedará cortado hasta que las acciones
se muden a donde 4d las quiere. Se prefiere eso a que la aplicación entera siga
recortada, pero es una regresión real y por eso queda escrita.

### Lo demás que se ajustó en esta pasada

| Vista | Qué rompía | Qué se hizo |
|---|---|---|
| **Catálogo (1i/5c)** | panel de ficha de 460px al lado de la lista | en móvil son **dos pantallas**: abrir una actuación reemplaza la lista, con «Volver al catálogo». Sin estado nuevo — usa el mismo `openActuacion` que abre el panel en escritorio |
| **Ajustes (8d)** | índice de 212px + contenido en dos columnas | se apila bajo `lg`; el índice va primero, que es el orden natural |
| **Orientación (1f/4d)** | `p-6` (48px de los 375), cabecera con `ml-auto`, columna de 190px en el historial | margen 16 en móvil, cabecera que envuelve, la sugerencia baja a su propio renglón |

**Medido y NO tocado por estar ya bien:** `SearchView` (caja `flex-col md:flex-row`,
filtros con `flex-wrap`), `SavedDraftsView` (cabecera de columnas ya
`hidden md:flex`, filas con `flex-wrap`), `ToolsView`, `TranscriptionView`,
`InterviewView` (todas con `flex-wrap` en su cabecera).

### Lo que sigue faltando: la estructura propia de cada módulo

Contener el desborde **no es rediseñar para móvil**, y el artboard pide lo
segundo. Sigue pendiente lo listado en la sección 15, y con prioridad:

1. **4d · redacción**: el primario de 48px fijo sobre la barra de pestañas con
   el costo debajo, y la configuración comprimida en **dos chips** con término y
   fecha de vencimiento — no la barra desplazándose que hay hoy.
2. **4d · transcripción**: abandonar las tres columnas — interlocutor y hora
   arriba, texto debajo, ancho completo; solo la fila en edición con tarjeta.
3. **4d · entrevista**: el cronómetro como elemento más grande de la pantalla y
   el aviso de que sigue grabando con la pantalla apagada.
4. **10c · borradores**: hoy las columnas envuelven sin rótulo; el artboard
   quiere filas pensadas para el pulgar.
5. Los temas oscuros móviles (4e, 5d, 8d, 9d, 10c).

---

## 18. Revisión de lo declarado: qué era construible y qué no — 29 de agosto

El usuario fijó el criterio: **lo que falta se construye y se conecta**, no se
declara ausente. Al aplicarlo a todo lo que yo había declarado, tres cosas
resultaron construibles y **dos de mis razones eran directamente falsas**.

### Construido

| Declarado como ausente | Qué era en realidad |
|---|---|
| **La onda de sonido** (4d) | «`MediaRecorder` no expone amplitud» es cierto de `MediaRecorder` y **falso del navegador**: el mismo `MediaStream` va a un `AnalyserNode` y el RMS del dominio del tiempo ES el volumen. **Ahora mide.** |
| **«Pausar»** (4d) | «Produce dos archivos que nadie une» describe `stop()`+`start()`, **no `pause()`**: suspende la misma grabación y `resume()` la continúa. **Un solo blob.** |
| **«2 sin verificar» por borrador** (10c) | Existía desde 5a pero **se perdía al guardar**: la tabla mapea columnas explícitas y `procedencia` se caía. Nueva columna `jsonb`. |

**El error de las dos primeras tiene forma reconocible y conviene recordarla:
confundir el límite de una API con el límite de la plataforma.** Antes de
declarar que algo no se puede, preguntarse si lo que no puede es esa pieza o el
navegador.

### La procedencia congelada

`saved_drafts.procedencia` es una **foto**, no una referencia viva. Si la firma
corrige mañana el término de esa actuación, el escrito ya redactado siguió
afirmando lo que afirmó: guardar el `actuacion_id` y releer el catálogo
mostraría un plazo que ese texto nunca dijo.

**`NULL` significa «no se registró», NO «sin respaldo».** Los borradores
anteriores a la columna quedan así y la interfaz **no los advierte**: no sabemos
que les falte respaldo, sabemos que no lo anotamos. Confundirlo llenaría la
lista de alarmas falsas sobre escritos que quizá estaban perfectamente bien.

### Sigue sin poderse, y ahora con la razón examinada

- **«VENCE · 3 may 2025»** en Orientación y en la barra del taller. No es un
  límite de API: falta el DATO de cuándo empezó a correr el término, y solo lo
  sabe quien lleva el caso. Construirlo significaría pedírselo — un campo más
  antes de orientar, que es lo contrario de lo que 1f quiere.
- **«6 de 13 leídos»** en el manual. Es una tabla por usuario en el servidor.
  **Sí es construible**, y queda como trabajo con nombre propio: migración,
  endpoint y marca por artículo.
- **La barra de progreso del saldo.** Falta el denominador: el saldo no tiene
  techo ni cupo declarado. Habría que definir qué mide antes de dibujarla.
- **El chat en la app** (9d) y **la transcripción en vivo** (4d): infraestructura
  de mensajería y de streaming que este producto no tiene.

### Tema oscuro

Comprobado en el navegador a 375×812 con `prefers-color-scheme: dark`:
**funciona**, y funciona porque los colores de las maquetas se mapearon a tokens
en vez de copiarse en hexadecimal. Se corrigieron cuatro `text-white` sobre
marca por `text-on-brand` —el token que sí se invierte—: dos nuevos y dos que
estaban desde antes en `AudioRecorder`, fuera de la regla que `.btn-primary` ya
aplicaba.

---

## 19. 5c buscador, 8d ajustes y el estado de lectura de 9a/9d — 29 de agosto

### Buscador móvil (5c)

`SearchMobileView`, con las medidas del HTML. Conserva lo que decide 1h y que en
390px pesa **más**, no menos: curado y automático son **dos bloques con
encabezado propio** —rótulo y filete en azul de marca el primero, en gris el
segundo—, la cita va en serif con **filete sólido** cuando alguien la leyó y
**punteado** cuando la trajo el registro, y el bloque automático **no tiene botón
de citar**. Hay menos espacio para matices y más tentación de tocar el primer
botón que aparezca.

Los filtros se recogen en una hoja con su contador, y **el contador cuenta
filtros reales aplicados**, no el «· 2» fijo de la maqueta.

Declarado y no hecho, con la razón: «Anotada por D. Cárdenas» —`CorpusPrecedent`
no tiene campo de anotador; **es construible**, una tabla de anotaciones por
firma— y «podría ir en contra de su tesis», que exige comparar la providencia con
la tesis del escrito, y ni el corpus ni la búsqueda saben cuál es.

### Ajustes (8d)

`AppearanceSection` **ya cumplía** la estructura de 8d: filas apiladas en móvil,
borde de 1.5px al elegir, el radio de 19px y la muestra «Ag 0123 Il1». Solo hacía
falta retirar el título duplicado —la cabecera móvil ya lo pone— y usar el
subtítulo para la SECCIÓN abierta, que es lo que hace la maqueta.

### El estado de lectura del manual (9a/9d) — CONSTRUIDO

Estaba declarado ausente con la razón correcta —«es un dato por usuario en el
servidor y no existe»—, pero eso describía el estado, no un límite.

- `supabase/migration-lectura-del-manual.sql`: tabla `manual_reads` con llave
  `(firm_id, user_email, article_id)` y RLS por firma.
- **Sin columna `leido`.** La fila existe o no existe: un booleano permitiría
  `leido = false`, que es un estado sin significado — nadie marca un artículo
  como no leído, lo desmarca, y eso es borrar la fila.
- La firma va en la llave aunque el correo ya sea único: es lo que permite al
  socio preguntar «qué ha leído MI gente» sin ver la de otra firma.
- `useManualReads` lo comparte entre las dos pantallas. Es **optimista pero no
  mentiroso**: la marca se pinta al instante y **se revierte si el envío falla**,
  porque una marca que se queda puesta sin guardarse es la afirmación falsa que
  este registro existe para evitar — y la descubriría el socio, no quien la puso.
- **Marcar va al FINAL del artículo**, no en el índice: ofrecerla junto al título
  invita a marcarlo sin abrirlo.
- La pantalla dice, con esas palabras, que **marca que usted lo leyó — no que el
  sistema haya comprobado que lo entendió**. El producto no mide comprensión y no
  debe insinuar que lo hace: un socio que confunda «marcado» con «sabe» tomaría
  la decisión de curaduría sobre una garantía que nadie dio.

**REQUIERE CORRER `supabase/migration-lectura-del-manual.sql`.**

---

## 20. Entrevista (2a) y Audiencia (1g) en ESCRITORIO — la brecha, medida

El usuario preguntó por qué esas dos pantallas no calcan su artboard. **No las
verifiqué nunca**: se construyeron antes de adoptar el método de abrir el HTML, y
nunca volví sobre ellas. Medido ahora, de ocho elementos de 2a **cero** estaban.

### 1g Audiencia — lo cerrado en esta pasada

| 1g pide | Estado |
|---|---|
| Panel **«Interlocutores»** con conteo por voz | **HECHO.** El número orienta la asignación de roles: en una audiencia de cuatro actores, la voz con dos intervenciones suele ser el secretario y la de veintitrés quien preside |
| **«32 de 58 intervenciones revisadas»** | **HECHO.** El dato existía —`revisada` con su endpoint y su reversión— y no había panel que lo mostrara: se podía marcar una fila y no saber cuántas llevaba |
| **«6 fragmentos con audio poco claro»** e `[ininteligible]` | **HECHO, y el dato no había que inventarlo**: Deepgram devuelve `confidence` por intervención y se descartaba — ni siquiera estaba declarada en el tipo de su respuesta |
| Reproductor anclado | **PENDIENTE** |

**Decisiones que la implementación obligó a tomar:**

- **Al unir turnos, la confianza se queda con la PEOR.** Promediar escondería el
  trozo que no se entendió detrás de dos que sí: una intervención unida es tan
  fiable como su parte más dudosa, porque es esa la que hay que volver a
  escuchar antes de citarla.
- **El umbral es 0,75 y es una elección, no un hallazgo.**
- **Lo poco claro se SUBRAYA, no se tiñe.** Teñir de ámbar volvería difícil de
  leer justo lo que hay que leer con más cuidado.
- **Ausente ≠ poco clara.** Los transcritos anteriores no traen confianza, y
  advertirlos sería inventarles un problema.

### 2a Entrevista — CERRADA el 29 de agosto

Todo lo de abajo se construyó **sin quitar nada** de lo que ya funcionaba: el
detector de voces fusionadas, las propuestas de nombre, dividir y reasignar, la
lista de guardadas y el diálogo de decisión siguen intactos.

| 2a pedía | Cómo quedó |
|---|---|
| «1 · Quién está al frente» | **HECHO**, con la ficha del cliente: contacto, correo y relación. «Cliente nuevo» es un hecho CONTADO, no una etiqueta |
| Tratamiento de datos en la ficha, no en un modal | **HECHO**, con enlace a subencargados: *«la pregunta ¿quién más ve esto? aparece en la sala, no después»* |
| **Guion sugerido** que tacha lo cubierto en vivo | **HECHO**, con `check:guion` — la prueba atrapó que «día» y «dia» contaban dos, que es el error caro |
| **«Marcar como hecho clave»** | **HECHO.** Distinto de los «hechos» del resumen: esos los extrae un modelo, este lo marca quien estuvo en la sala |
| Acta exportable **mientras se graba** | **HECHO.** Estaba tras `result`, así que justo cuando alguien declina el caso no había nada que sacar |
| Estado del micrófono y los cinco estados del grabador | **PENDIENTE** |

**La distinción que obligó a tomar «hecho clave»:** revisada dice «la leí y está
bien transcrita»; clave dice «esto decide el caso». Se puede revisar una frase
intrascendente y marcar como clave una que todavía haya que corregir. Por eso usa
la estrella y el ámbar — **no es un estado de verificación**, y pintarla en verde
la confundiría con lo comprobado.

**Y la constancia sin transcrito lleva `model: 'sin transcribir'`**, para que
nadie lea el acta creyendo que un motor la produjo.

### 2a — el detalle original de la brecha

- Los pasos son **«1 · Quién está al frente»** y **«2 · Voces en la sala»**; hoy
  dicen otra cosa.
- **Ficha del cliente** con contacto, ciudad y relación —«cliente nuevo · sin
  caso abierto»—, más **«Firmó tratamiento de datos»** con enlace a
  subencargados. La nota lo razona: *«la pregunta ¿quién más ve esto? aparece en
  la sala, no después»*.
- **Guion sugerido** que tacha lo cubierto en vivo. Su nota es la más fuerte del
  artboard: *«es la única forma de que el abogado no salga de la reunión sin la
  fecha que define el término»*.
- **«Marcar como hecho clave»** por intervención.
- **Acta exportable desde el encabezado mientras se graba**: *«el abogado que
  declina el caso igual necesita dejar constancia de lo conversado»*.
- **Pie con tres salidas, y declinar es una de ellas** — existe como
  `CerrarEntrevistaDialog`, falta contrastarlo.
- Estado del micrófono y los cinco estados del grabador declarados.

### Nota sobre la segunda entrevista

Al explicar el guion escribí que «evita una segunda entrevista». **Está mal
dicho, y el producto lo desmiente**: `Client.interviews` CUENTA cuántas lleva
cada persona y el servidor las agrupa por `client_id`. Varias entrevistas al
mismo cliente no solo son posibles: están contadas y a la vista.

Lo que dice el artboard es otra cosa, y es la que importa: *«que el abogado no
salga de la reunión SIN LA FECHA QUE DEFINE EL TÉRMINO»*. El problema no es
volver a hablar con el cliente —eso pasa siempre— sino **cuál dato falta**. Si
falta el teléfono, se llama. Si falta la fecha de notificación, nadie se entera
hasta ir a redactar, y para entonces el término lleva días corriendo.

**Pendiente que esto destapa:** si las entrevistas de un mismo cliente ya se
cuentan, **el guion de la segunda debería saber qué se respondió en la primera**.
Preguntar dos veces la misma fecha no es solo torpe: le dice al cliente que no se
le prestó atención. No existe hoy.


---

## 21. El Consejo de Estado, y el descubrimiento cerrado — 29 de agosto

Las tres altas corporaciones responden ya al descubrimiento por tema. El aviso
de la pantalla ha cambiado **dos veces**, y las dos porque declaraba un hueco que
se fue cerrando: primero «probablemente no vive en esa relatoría», luego «lo
contencioso administrativo queda fuera».

### La puerta buena no era el formulario

SAMAI es ASP.NET WebForms: su buscador exige `__VIEWSTATE` y `__EVENTVALIDATION`
**validados contra la cookie de sesión** — el primer intento devolvió
`Validation of viewstate MAC failed`. Mantener una secuencia GET-tokens + POST se
rompería en cada despliegue del Consejo.

Pero la página de resultados publica un **enlace permanente** con la consulta en
la URL, pensado para compartir búsquedas:

    ResultadoBuscadorProvidenciasTituladas.aspx?BusquedaDictionary={…json…}

GET, sin cookies ni tokens, mismos 40 radicados que el formulario, **y es el que
el Consejo mismo ofrece copiar** — la interfaz con menos razones para cambiar.

### El defecto que destapó VERIFICAR, no leer

Al comprobar que los enlaces resolvieran:

    cita publicada:  20001-23-39-003-2014-00294-01
    proceso real:    05001233100020090151903

Se tomaba **el primer radicado que apareciera en el bloque**, y el extracto de la
relatoría **cita otras providencias — es su oficio**. La ficha salía con la cita
de una y el enlace de otra. **Una cita que apunta a otra sentencia es
indistinguible de una correcta hasta que alguien la abre**, y para entonces está
en un escrito radicado.

Se lee del campo `Núm. del proceso`, y `check:consejo` lo cruza contra el `guid`
de su propia URL — el único cruce que no se satisface por casualidad.

### Otras tres decisiones

- **Orden por relevancia, no por fecha.** Con `FechaProvidencia desc` —lo que
  copia la página— «servidumbre de tránsito» devolvía una nulidad electoral: la
  más reciente que mencionaba las palabras, no la que trata del asunto.
- **El texto es el EXTRACTO de la relatoría, no la providencia entera**, y así se
  rotula: entregarlo como texto íntegro invitaría a citar «la sentencia dice»
  sobre un resumen. El fallo completo está a un salto, en la página del proceso.
- **`CONSEJO_ESTADO`, sin «DE»**, porque es la etiqueta que el corpus ya usa.
  Otro nombre partiría la misma corporación en dos y el filtro mostraría la
  mitad de sus providencias según de dónde hubieran entrado.

### Lo que sigue fuera, y ahora sí es todo

Tribunales y juzgados: sus providencias no viven en ninguna de las tres
relatorías. El aviso lo dice con esas palabras.
