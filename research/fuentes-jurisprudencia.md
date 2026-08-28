# Fuentes de jurisprudencia: qué es alcanzable y qué no — 28 ago 2026

Investigación con peticiones reales, no de memoria. Cada veredicto abajo se
apoya en una petición cuya respuesta se cita.

## Corrección a un diagnóstico anterior: la Corte Suprema NUNCA estuvo caída

El 28 de agosto se reportó aquí que «la API de la Corte Suprema no responde» y se
dejó abierta la duda de si era caída o bloqueo. **Era falso.** Comprobado:

```
POST https://consultaprovidenciasbk.cortesuprema.gov.co/api
  → HTTP 200 en 0,17 s · {"data":{"__typename":"Query"}}

npm run check:csj → ALL CHECKS PASSED, incluida la parte de red:
  ok  una providencia real se encuentra — FOUND
  ok  y llega con su texto completo descargado — 15553 caracteres
  ok  con su ponente y su sala — Dr. Omar De Jesus Restrepo Ochoa | Sala LABORAL
```

**Lo que fallaba era la herramienta de diagnóstico, no el servicio.** Dos causas,
las dos del entorno y las dos con remedio:

- **`curl` en este Windows falla contra `.gov.co` con `CRYPT_E_REVOKED`** —
  verificación de revocación de certificado. Requiere `--ssl-no-revoke`.
- **El WAF de `ramajudicial.gov.co` devuelve 403 al User-Agent por defecto de
  `python-urllib`.** Con `Mozilla/5.0 … Chrome/126` devuelve 200.

Lección para no repetirlo: **antes de declarar caída una fuente oficial, probar
con User-Agent de navegador y con la verificación de revocación desactivada.**
Afirmar una ausencia exige decir dónde y cómo se buscó.

---

## Mapa de `jurisprudencia.ramajudicial.gov.co/WebRelatoria/`

17 rutas probadas:

| Ruta | HTTP | Título |
|---|---|---|
| `/csj/index.xhtml` | **500** | — (ver abajo) |
| `/ce/index.xhtml` | 200 | Consejo de Estado |
| `/gen/index.xhtml` | 200 | Comisión Nacional de Género |
| `/cnsj/index.xhtml` | 200 | **Consejo Superior de la Judicatura** |
| `/cndj/index.xhtml` | 200 | **Comisión Nacional de Disciplina Judicial** |
| `/cc/index.xhtml` | 200 | Corte Constitucional |
| `/trib/index.xhtml` | 200 | **Tribunales Administrativos** |
| `/tsdj/` `/tribunal/` `/ta/` `/tsj/` `/tribunales/` `/tribadmin/` `/tsup/` `/tribsup/` `/distrito/` | 404 | — |

**El 500 de `/csj/` es un bug del servidor, no un bloqueo**, reproducible tres
veces:

> `Error Parsing /csj/index.xhtml: Error Traced[line: 29] The element type
> "meta" must be terminated by the matching end-tag "</meta>"` —
> `javax.faces.view.facelets.FaceletException`

La relatoría de la Corte Suprema en WebRelatoria está caída por **un `<meta>` sin
cerrar**. No nos afecta: nuestra vía es la API GraphQL, que funciona.

---

## 1. Comisión Nacional de Disciplina Judicial — **LA FUENTE A CONSTRUIR**

**VEREDICTO: ACCESIBLE POR API, SIN LLAVE.** La mejor fuente hallada, y no está
en WebRelatoria sino en relatoría propia: `https://relatoria.cndj.gov.co/`
(ASP.NET Core sobre IIS 10).

Tres endpoints, sacados del JavaScript de su propia página:

**Búsqueda** — `POST /Resultados?handler=RecibirBusqueda`
```
Content-Type: application/json
RequestVerificationToken: <del input __RequestVerificationToken de la portada>
{"Type":"general","BusquedaGeneral_Texto":"abogado"}
→ 200 {"success":true}   (guarda en sesión; luego GET /Resultados da el HTML)
```

**Detalle** — `POST /Resultados?handler=RecibirDataResumen`
```
{"Proceso":"11001250200020240149901","NumeroFicha":"1"}
→ 200 {"archivo":"F11001250200020240149901ADJUNTA20260416123802", ...}
```

**El PDF** — derivado del campo `archivo`, patrón tomado del propio JS:
`https://relatoria.cndj.gov.co/docs_relatoria/{archivo}.pdf`
Verificado **en frío, sin cookie ni referer**: `HTTP 200 · application/pdf ·
875.870 bytes · %PDF-1.7`. Confirmado con otros dos (577 KB y 528 KB).

**Volumen medido por streaming:** «abogado» → **14.125 registros**; «disciplinario»
→ **17.733 registros**. Cada fila trae ponente, radicación, decisión completa,
número único y ficha. **Tasa de documentos: 12 de 12** en muestra aleatoria.

**Rendimiento:** 8 llamadas seguidas en **1,04 s (~130 ms cada una)**, sin
throttling detectable. Ingerir ~18.000 fichas ≈ 40 minutos.

**Riesgos que hay que respetar al construirlo:**
- `GET /Resultados` **no pagina**: devuelve el corpus entero en una página de
  55-67 MB. **Hay que consumirlo en streaming** — esto es exactamente lo que mató
  el primer intento de investigación.
- Consultas vacías o de 1-2 caracteres devuelven 0. El corpus solo se alcanza por
  término frecuente y **no se halló forma de enumerarlo completo**:
  `BusquedaAvanzada` con `PorAnhoRadicacion:"2023"` da 0; el campo espera
  año+número de radicado (`201700244`), no un año suelto.
- El token antiforgery y la cookie de sesión hay que renovarlos.
- Hay datos corruptos: un registro trae `"a115fechprov":"7202-04-08"` (año 7202).
- `robots.txt` → 404 en ambos dominios.

---

## 2. Consejo Superior de la Judicatura (Sala Disciplinaria, hasta 2020)

**VEREDICTO: ACCESIBLE SOLO RASPANDO** — JSF/PrimeFaces 5.0 con estado de sesión.

El filtro «Corporaciones» de `/gen/index.xhtml` tiene cinco casillas: `CSJ`, `CE`,
`CC`, **`CNSJ`**, **`CNDJ`**. Un POST ajax real devuelve conteo por corporación:
«Consejo Superior de la Judicatura: 358» para 2010-2020.

**El documento sí se obtiene**, y por una vía cómoda: el botón de descarga
devuelve un `<eval>` con `FileReferenceServlet?corp=gen&ext=html&file=675`, que es
**GET plano, sin sesión ni llave**. Verificado en frío: `corp=cnsj&file=4305` →
200, 86.706 bytes, y el texto es una providencia real («CONSEJO SUPERIOR DE LA
JUDICATURA / Sala Jurisdiccional Disciplinaria / … Magistrada Ponente: Dra.
LEONOR PERDOMO PERDOMO»).

**Riesgo grave — cobertura documental parcial.** De 9 combinaciones probadas,
varias devuelven **HTTP 200 con 0 bytes** (no 404). Hay que tratar `size == 0`
como «sin documento» explícitamente. Y **los ids no son secuenciales**: se
muestreó `file=` en 1, 1.000, 5.000, 10.000, 50.000, 100.000, 200.000, 400.000 y
1.000.000, y casi todos dan 0 bytes. No se puede enumerar por incremento; hay que
pasar por la búsqueda.

**Ojo: la ruta `/cndj/` de WebRelatoria NO sirve** — devuelve fichas pero
`FileReferenceServlet` da 0 bytes en los tres `corp`. El texto de la CNDJ solo
está en `relatoria.cndj.gov.co`.

---

## 3. Tribunales Administrativos — **NO EXISTE FUENTE ÚTIL**

La interfaz existe y es **centralizada**: `/trib/index.xhtml`, HTTP 200, con
desplegable de **12 tribunales** (Antioquia, Atlántico, Boyacá, Caldas, Cauca,
Cundinamarca, Magdalena, Norte de Santander, Quindío, Santander, Valle del Cauca,
Meta) y campos de tema, texto completo, NUIP, radicación, ponente, fechas,
demandante, demandado, fuente formal y norma demandada.

**Se ejecutaron 7 búsquedas POST reales** —por tribunal, sin tribunal, con y sin
fechas, y por texto (`nulidad`, `contrato`)— y **las siete devolvieron lo mismo**:

> `rowCount:0` · `Resultado: 0 / 0` · «No se encontraron resultados, verifique los
> términos de consulta»

**Un buscador funcional sobre una base sin registros.**

---

## 4. Tribunales Superiores de Distrito Judicial — expediente sí, providencia no

No hay relatoría: las 9 rutas candidatas dan 404.

Lo que sí hay es la **API de consulta de procesos, sin llave**, cuya base salió
del bundle `js/app.fe99da99.js`:
**`https://consultaprocesos.ramajudicial.gov.co:448/api/v2`** (puerto **448**).

```
GET /Procesos/Consulta/NumeroRadicacion?numero=<23 dígitos>&SoloActivos=false&pagina=1
GET /Procesos/Consulta/NombreRazonSocial?nombre=&tipoPersona=&codificacionDespacho=&pagina=
GET /Proceso/Detalle/{id} · /Proceso/Actuaciones/{id} · /Proceso/Documentos/{id}
```

Responde 200 JSON sin autenticación, y cubre tribunales de tres distritos
(Sala Civil de Bogotá, Civil de Medellín, Penal de Bogotá). `codificacionDespacho`
sirve para enumerar.

**Pero el documento no está.** `/Proceso/Documentos/79516582` → **404**. Y en una
muestra de **8 procesos de tribunal con 112 actuaciones: `conDocumentos:true` en
0 de 112**. Las actuaciones traen la etiqueta pero no el texto:

```json
{"fechaActuacion":"2026-08-21","actuacion":"Auto que confirma auto",
 "anotacion":null,"conDocumentos":false}
```

Dice que el tribunal confirmó un auto; **no da el auto**. Sirve como fuente de
**estado procesal**, no de jurisprudencia.

---

## 5. datos.gov.co — nada de estas corporaciones

Catálogo Socrata consultado: `tribunal superior` → 0 · `disciplina judicial` → 0 ·
`sancion abogado` → 0 · `consejo superior judicatura` → 3, todos administrativos ·
`providencias` → 108, casi todo ruido.

**El único dataset real de providencias es de la JEP**, no de lo pedido:
`du48-9apm` → **30.387 filas**, y enlaza al PDF directo
(`relatoria.jep.gov.co//documentos/providencias/…`), con nombre, fecha, tipo,
radicado, despacho, asunto y macrocaso. **Listo para usar si algún día se quiere
JEP.**

---

## Recomendación

**Construir la CNDJ, y solo la CNDJ, por ahora.** API JSON sin llave, ~130 ms por
llamada, PDF directo sin sesión, ≥17.733 providencias disciplinarias sobre
abogados y funcionarios — que es exactamente lo que un litigante cita. El único
trabajo real es consumir `/Resultados` en streaming.

El CSJ Sala Disciplinaria (pre-2021) complementa históricamente, pero es raspado
frágil con cobertura parcial.

**Los tribunales, de ambos tipos, no tienen fuente pública de providencias.
Prometerlos en el producto sería prometer algo que hoy no existe** — y en el
selector del Buscador ya hay una opción así, Consejo de Estado, que conviene
marcar como no disponible mientras no haya llave.

## Lo que NO se comprobó

1. El total real de `/cnsj/` y `/cndj/` en WebRelatoria: el POST mínimo renderizó
   la tabla sin paginador. Los conteos citados salen de `/gen/` filtrada, y
   **subestiman el corpus real**.
2. El total de la relatoría CNDJ: 17.733 es el máximo alcanzado con un término;
   el corpus real es ≥ esa cifra.
3. Si existe algún proceso de tribunal con `conDocumentos:true`. La muestra fue de
   8 procesos, toda de Sala Civil de Bogotá.
4. Los endpoints `DocumentosActuacion` y `Sujetos`: extraídos del JS, no
   ejecutados.
5. Límites de tasa bajo carga sostenida. Sí se observó que **WebRelatoria devuelve
   504 con dos peticiones concurrentes**: es frágil, hay que serializar.
6. Si el 500 de `/csj/` es permanente o intermitente: tres intentos en una hora,
   siempre 500.
