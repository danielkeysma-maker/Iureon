# El ancho en el teléfono: por qué se corta, cómo se mide, con qué se arregla

Esta nota existe porque el mismo defecto volvió tres veces. No es una guía de
estilo: es la causa concreta, la forma de comprobarla y los cuatro remedios que
la cierran.

## La causa

Casi ningún corte a la derecha es «falta de responsive». Es siempre lo mismo:

**Un ítem flex nace con `min-width: auto`, así que se niega a bajar del ancho
mínimo de su contenido.** Cuando ese mínimo es mayor que la pantalla, la columna
mide de más y el `overflow-hidden` de un contenedor de arriba —en esta
aplicación, `<main>` y la columna de trabajo de `App.tsx`— se come lo que sobra.

Por eso `document.documentElement.scrollWidth` **sigue diciendo 360**: la página
no desborda, el contenido se pierde. Un desbordamiento se ve; esto no.

Ese mínimo lo fija algo concreto y distinto en cada pantalla. Los siete que ya
aparecieron aquí:

1. **`truncate`** — su ancho mínimo es la frase entera, no el ancho con puntos
   suspensivos. Un rótulo truncado de 679px impone 679px a su columna.
2. **Un ancho fijo en píxeles con `shrink-0`** — `w-[340px]` dentro de una hoja
   de 320.
3. **Una fila que no encoge** — chips de rama, pestañas con relleno propio.
   Cinco pestañas de `px-3` suman 390px y en 360 la última queda fuera.
4. **Una sola palabra larga sin espacios** — un correo, un radicado, una URL.
   `break-words` no basta cuando el ancho mínimo del ítem flex es el que manda;
   hace falta `[overflow-wrap:anywhere]`. Se hereda: declararlo en la raíz de un
   panel cubre todos sus párrafos, listas y citas de una vez.
5. **Dos columnas de escritorio sin apilar** — lista + detalle en una fila que
   nunca cambia de dirección.
6. **Una `<table>`** — y esta no la arregla ningún `min-w-0`, porque una celda
   no es un ítem flex: el algoritmo de tabla reparte el ancho a partir del
   mínimo de cada columna y no baja de ahí. Cinco columnas cuya primera lleva
   un correo de firma piden 803px; dentro de una columna de 277 la mitad de
   cada renglón cae fuera y la página no desborda. Se resuelve como la 8d:
   tarjeta en el teléfono, fila en escritorio.
7. **`shrink-0` sobre un contenido de ancho ilimitado** — `shrink-0` es
   correcto para un icono, una fecha o un chip, y es una trampa para un correo
   o un radicado: el ítem se queda con todo lo que su texto pide y estrangula
   a sus hermanos. Un registro de auditoría llegó a dejar el hecho en 47px de
   ancho porque el correo del operador, a su lado, no encogía.

## Cómo se mide (en el navegador, no de vista)

La captura de pantalla miente: el panel muestra menos ancho del que emula. Se
mide con código, **a 320, 360 y 393**. Lo que cabe en 375 puede no caber en 360.

```js
const W = innerWidth;
// Un antepasado con desplazamiento horizontal propio, o un `truncate`, recorta
// a propósito: lo suyo no es un corte, es su diseño.
const legitimo = (e) => {
  let p = e.parentElement;
  while (p) {
    const c = typeof p.className === 'string' ? p.className : '';
    if (/overflow-x-(auto|scroll)|overflow-(auto|scroll)/.test(c) && p.scrollWidth > p.clientWidth + 1) return true;
    if (getComputedStyle(p).textOverflow === 'ellipsis' || /(^|\s)(truncate|line-clamp-\d)(\s|$)/.test(c)) return true;
    p = p.parentElement;
  }
  return false;
};
const malos = [...document.querySelectorAll('body *')].filter((e) => {
  const r = e.getBoundingClientRect();
  return (r.width || r.height) && r.right > W + 1 && !legitimo(e);
});
// Los que no contienen a otro infractor son las hojas: ahí está la causa.
malos.filter((e) => !malos.some((o) => o !== e && e.contains(o)));
```

### Y hay un segundo corte que ese barrido NO ve

`getBoundingClientRect()` mide la **caja**, no el **texto**. Una palabra sin
espacios —un radicado de 23 dígitos, un correo, una URL— se pinta fuera de su
caja sin agrandarla: la caja mide 262px y el renglón llega a 742 en una pantalla
de 320. Ese fue el corte que se reportó en Seguridad, y ningún barrido de cajas
lo encuentra. Se mide con `scrollWidth` contra `clientWidth`:

```js
const derrame = [...document.querySelectorAll('body *')].filter((e) => {
  if (getComputedStyle(e).overflowX !== 'visible') return false; // recorta a propósito
  return e.clientWidth && e.scrollWidth > e.clientWidth + 1 && !legitimo(e);
});
```

**Los dos barridos se corren siempre juntos.** Uno solo deja pasar la mitad.

### Y no se mide una pantalla vacía

`?vista=1` entra sin credenciales, pero su token es basura: la API contesta 401
y las listas salen vacías. Una lista vacía no se corta nunca, así que medirla
así es declararla sana sin haberla visto. Dos pantallas —la consola de operación
y la gestión de usuarios de la firma— pasaron una auditoría entera por eso.

Para medirlas de verdad hacen falta dos cosas, y las dos viven fuera del árbol:
un servidor local en el puerto 4000 que conteste lo que `VITE_API_URL` espera,
con contenido de tamaño real —correos de firma de sesenta caracteres, NIT,
radicados—, y la sesión escrita a mano en `localStorage` bajo `iureon_session`
con el rol que abre la pantalla (`SUPER_ADMIN` para la consola). Nada de eso
puede quedar en el repositorio: se comprueba con `git status` al terminar.

Y para saber **quién** impone el mínimo, se sube por los padres del infractor
leyendo `getBoundingClientRect().width` y `getComputedStyle(n).minWidth`: el
culpable es el primer antepasado con `min-width: auto` cuyo ancho ya excede la
pantalla.

## Los remedios

- **`min-w-0` EN CADA NIVEL** de la cadena de ítems flex —la envoltura de
  `App.tsx`, la raíz del componente, la fila interna y cada columna—. Ponerlo en
  uno solo no sirve: manda el nivel que quede sin acotar.
- **`[overflow-wrap:anywhere]`** para correos, radicados y URLs.
- **Envoltura con desplazamiento propio** (`overflow-x-auto` + `shrink-0` en los
  hijos) cuando la fila no puede encoger sin perder el rótulo: una pestaña
  medio borrada es peor que una pestaña a la que hay que deslizarse.
- **Variantes `sm:` / `md:` / `lg:`** para lo que solo tiene sentido en grande:
  `flex-col sm:flex-row`, `w-full sm:w-[340px]`, `px-3 sm:px-5`. El escritorio
  no debe cambiar; se comprueba a 1440 midiendo lo mismo.

## Lo que NO cuenta como corte

Un elemento cuyo antepasado más cercano que recorta es un `truncate` o un
contenedor con desplazamiento propio: ahí el recorte es la intención. Tampoco
los adornos absolutos con `pointer-events-none` que se salen de su propia
tarjeta con `overflow-hidden`. Confundirlos con defectos convierte el barrido en
ruido y enseña a ignorarlo.
