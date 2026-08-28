# Health Home Solution Group — Heroes 1a / 1b / 1c

Tres variantes de pantalla principal. Ninguna usa foto de producto.
HTML plano, sin dependencias ni build: abrir el archivo en el navegador.

| Archivo | Dirección | Mecánica |
|---|---|---|
| `hero-1a.html` | La lectura manda | Consola de medición que cuenta hasta la lectura real al entrar en viewport |
| `hero-1b.html` | Antes / después | Comparador arrastrable (pointer + touch + `input[type=range]` accesible) |
| `hero-1c.html` | El hero pregunta | Checklist de 6 señales; a partir de 3 el marcador cambia copy, color y CTA |

## Secciones

| Archivo | Sección | Mecánica |
|---|---|---|
| `seccion-05-productos-5c.html` | 05 · Productos | Acordeón a pantalla completa: tres columnas con título vertical; la activa se expande. Hover/click/teclado en desktop, acordeón vertical en móvil. Reemplaza las tres bandas ancladas de Agua / Soltice / Hogar. |

Los renders de producto son `<span>` placeholder marcados con `panel__media--empty`; hay un comentario HTML en cada uno con el `<img>` a sustituir.

## Sistema

**Paleta (cerrada — no añadir colores).** Declarada como custom properties en `:root` de cada archivo:

```
--ink   #07293D   fondo oscuro, titulares
--blue  #0A4D82   azul de marca
--cyan  #1F8AC9   acento frío, hover
--green #5EA843   CTA
--lime  #7EC265   acento sobre oscuro, estado activo
--paper #F3F7FA   fondo claro
--muted #5C6B78   texto secundario
--body  #1A2530   texto principal
```

**Tipografía.** Display: Satoshi 900 (Fontshare), tracking de −0.035 a −0.05em según tamaño. UI y cuerpo: Inter 400/500/600/700. Titulares con `clamp()`; nunca por debajo de 40px en desktop.

**Movimiento.** Easing único: `cubic-bezier(.16,1,.3,1)`. Hover de CTA: `translateY(-2px)`. Todos los archivos respetan `prefers-reduced-motion`.

**Radios.** Botones y píldoras `99px`; tarjetas `18px`; paneles `20–24px`.

## Datos a reemplazar

- `hero-1a.html` → objeto `TARGET` en el script (ppm, cloro, pH) y el texto "últimas 128 casas". Son los valores reales de la operación.
- Teléfono y enlace de WhatsApp: hoy `(787) 000-0000` / `wa.me/17870000000`.
- Anclas `#evaluacion`, `#agua`, `#solar`, `#hogar`, `#catalogo` apuntan a las secciones de la landing completa.

## Notas de integración

- Cada archivo es solo el hero: la landing completa (problema, verticales, bandas de producto, proceso anclado, catálogo horizontal, formulario de dos pasos) vive aparte.
- Los tres heroes son intercambiables: mismo nav, mismos tokens, misma altura (`100svh`).
- `hero-1c.html`: las señales marcadas deben viajar con el lead. El punto de enganche está comentado en el script (`picked.map(...)`).
