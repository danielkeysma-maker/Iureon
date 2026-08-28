# Dónde retomar — corte por límite de sesión, 28 ago 2026

Escrito al alcanzarse el límite de uso. **Nada se perdió**, pero hay trabajo a
medias guardado fuera de `main`. Este archivo dice exactamente qué hay, dónde
está y cómo seguir.

## Estado del repositorio: SANO

`main` está en `6c08a16`, compila y pasa todo:

```
backend:  npx tsc --noEmit   → 0
backend:  npm test           → 20/20
frontend: npm run build      → 0
```

El trabajo incompleto **no está en `main`**. Está en un stash, porque el
controlador de admin quedó con cinco errores de tipo y dejarlo en el árbol de
trabajo habría roto el build de quien siguiera.

```bash
git stash list
# stash@{0}: WIP 7b backend (servicio hecho, controlador roto) + help/ a medias
git stash show -p stash@{0}    # ver qué trae, sin aplicarlo
git stash pop                   # recuperarlo cuando se vaya a terminar
```

Se borró también `cpnu.html`, una descarga que dejó tirada un agente de
investigación en la raíz del repo.

---

## 1. Lo que SÍ quedó terminado y subido hoy

| Commit | Qué |
|---|---|
| `92bc6c3` | Ficha de apelación ambiental (catálogo: 651 → 652); la tutela ya declara que los diez días son del juez; `check:relojes` en la suite |
| `df1603c` | Párrafos de providencia justificados en el Buscador; hueco de apelación ambiental declarado cerrado |
| `185317b` | **Umbral 0,60 en el Buscador** y la salida al registro oficial deja de exigir cero resultados |
| `6c08a16` | El descubrimiento que no encuentra, no está configurado o falla ya lo dice en pantalla |

Verificado en producción con el sello `v. 185317b`: la consulta «servidumbre de
tránsito predio enclavado», que antes devolvía un accidente de tránsito al 46 %
como si fuera hallazgo, ahora dice «sin coincidencias» y sale a buscar fuera.

---

## 2. Trabajo a medias en el stash

### 2.1 Backend de la ficha de firma (7b) — servicio HECHO, controlador ROTO

`backend/src/modules/admin/admin.service.ts` (+293 líneas). Lo que alcanzó a
construirse y parece bien encaminado:

- `FIRM_COLUMNS`, `FirmRow`, `toSummary()` — extracción de la forma de la fila
- `firmVolumes(scope?)` — los conteos (usuarios, transcripciones, curadas) en
  una sola función compartida entre la lista y la ficha, que era el encargo
- `EMPTY_VOLUMES` — el caso sin datos, sin inventar ceros falsos
- `OPERATION_ACTIONS` — el conjunto de acciones que cuentan como «de operación»
  para el registro bilateral
- Un tipo de usuario de firma con `consumoMesCop`, `ultimoAcceso`, `creadoEl`

`backend/src/modules/admin/admin.controller.ts` quedó a mitad de camino. **Cinco
errores de tipo**, todos por la misma causa: el servicio cambió de firma para
recibir `reason` y el controlador todavía llama con la firma vieja.

```
admin.controller.ts(73,27)  TS2554: Expected 3 arguments, but got 2
admin.controller.ts(80,103) TS2554: Expected 0 arguments, but got 1
admin.controller.ts(101,11) TS2554: Expected 3 arguments, but got 2
admin.controller.ts(127,49) TS2345: falta 'reason' en el objeto de alta de usuario
admin.controller.ts(137,25) TS2339: 'email' no existe en el tipo devuelto
```

**Para terminarlo:** `git stash pop`, alinear las cinco llamadas del controlador
con las firmas nuevas del servicio, añadir los casos a
`backend/src/modules/admin/__checks__/admin.check.ts` y correr
`npx tsc --noEmit && npm run check:rutas && npm test`.

**Falta todavía, del encargo original:** la ruta `GET /api/admin/firms/:firmId`
registrada en `admin.routes.ts`, y la validación de que `reason` sea un motivo
de verdad (rechazar con 400 lo que tenga menos de 10 caracteres útiles).

### 2.2 Pantallas 9a Manual y 9b Soporte — apenas empezadas

`frontend/src/modules/help/` tiene solo `types.ts` y `content/manual.ts`. No hay
componentes, no está registrada como vista y **nadie la importa**, así que no
rompe nada. Prácticamente hay que empezar de nuevo.

Recordatorio para quien la retome: registrar una pantalla exige tocar **cuatro**
sitios o el encabezado se rompe — `tenant/types.ts` (`MainView`),
`tenant/navigation.ts` (`NAV_MODULES` y `NAV_GROUPS`), `App.tsx` (el bloque
condicional y `MAIN_VIEWS`), y comprobar que `SidebarLeft`/`HeaderTop` los lean
del registro.

---

## 3. Investigaciones que murieron sin entregar

**Ninguna alcanzó a devolver resultados.** Hay que relanzarlas enteras; no queda
nada aprovechable de ellas.

| Investigación | Encargo |
|---|---|
| Embargos y ejecutivo (CGP) | Censo de embargo, secuestro, remate, avalúo, oposición, liquidación del crédito |
| Garantías mobiliarias (Ley 1676 de 2013) | Censo del régimen completo; verificar si el Decreto 1835 de 2015 sigue vivo o lo absorbió el Decreto Único 1074 |
| Censo de regímenes ausentes | 16 frentes (seguridad social, títulos valores, arrendamiento, propiedad horizontal, consumidor, extinción de dominio, restitución de tierras, consulta previa, registro, cobro coactivo…) |
| Fuentes CSJ-Disciplina y Tribunales | ¿Hay API o solo raspado en `jurisprudencia.ramajudicial.gov.co/WebRelatoria/`? Comisión Nacional de Disciplina Judicial |

Detalle útil que alcanzó a reportar la de fuentes antes de morir: **las descargas
de 55 MB agotan el tiempo de espera**. Al relanzarla, que use segundo plano y más
margen.

**Coste estimado del relanzamiento:** unos 100 mil tokens por investigación.
Conviene lanzarlas de a dos o tres, no las siete a la vez — así fue como se
agotó la sesión.

---

## 4. Hallazgo confirmado que motivó el censo

El catálogo tiene **cero fichas** con estas palabras:

```
embargo · secuestro · remate · desembargo · caución · depositario
prenda · garantía mobiliaria · avalúo
```

Existe «Solicitud de medidas cautelares» genérica (13 fichas) y el proceso
ejecutivo (8), pero **todo el ciclo del embargo falta**: pedirlo, limitarlo,
levantarlo, el avalúo, el remate, la adjudicación, la entrega. Y las garantías
mobiliarias son un régimen entero ausente.

Comprobado contando sobre `backend/src/modules/catalog/data/*.ts`, no de memoria.

---

## 5. Pendientes anteriores que siguen abiertos

- **La API de la Corte Suprema no responde.** `cortesuprema.gov.co` da 200, pero
  `consultaprovidenciasbk.cortesuprema.gov.co/api` se queda 60 s sin conectar y
  `npm run check:csj` salta su parte de red por tiempo agotado. Falta saber si es
  caída pasajera o bloqueo a tráfico que no venga de un navegador.
- **Consejo de Estado aparece en el selector del Buscador sin fuente detrás.**
  Su API pide llave que no es de autoservicio. Hay un derecho de petición
  redactado y sin enviar (Ley 1755, 15 días hábiles). Mientras tanto, la opción
  promete algo que no da.
- **Consejo Superior de la Judicatura y Tribunales Superiores**: no existen en el
  código. Ni servicio, ni tipo, ni selector.
- **Una ficha con el reloj por revisar**: FAMILIA_ADMINISTRATIVA, «Solicitud de
  restablecimiento de derechos ante el defensor o comisario de familia» abre con
  los seis meses que tiene la autoridad. Falta leer la Ley 1098 para saber si
  corre algún plazo contra el solicitante. Lo señala `npm run check:relojes`.
- **Cinco fichas con término vacío**: NOTARIAL 1, AGRARIO 3, DISCIPLINARIO 1.
- **Rol SECRETARIA prácticamente inexistente**: 16 fichas en total, y 20 de las
  22 ramas en cero. Solo CIVIL (14) y ARBITRAJE (2).
- **212 advertencias de cobertura** en `_meta.gaps`, y **11 de las 22 ramas** las
  encabezan con una nota que dice que su lista es anterior a la verificación
  masiva del 2026-08-14 y que varias quedaron cerradas. Hay que depurarlas: hoy
  la pantalla llama «lo que este catálogo NO cubre» a una lista con entradas
  caducas.
- **Pendientes del usuario, no del código**: recargar OpenRouter (US$0,93, no
  alcanza para un borrador); revocar la llave `temporal-cors` de B2; enviar el
  derecho de petición al Consejo de Estado.
