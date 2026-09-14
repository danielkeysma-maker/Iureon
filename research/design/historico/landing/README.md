# IUREON — Landing pública · Handoff para Claude Code

Dos direcciones de diseño de la landing pública de Iureon (escritorio 1280 + móvil 375 cada una) y una hoja de componentes. Todo es HTML estático con estilos inline: cópielo tal cual a su stack (React/Next, Astro, Vue) y extraiga los tokens a CSS variables o Tailwind.

## Archivos
- `direccion-a-profundo.html` — Dirección A: hero en dos columnas con la app inclinada, bandas claras, Premium elevada con borde oro.
- `direccion-b-bento.html` — Dirección B: hero centrado con la app a ancho completo, retícula bento de módulos, Premium en tarjeta oscura, cifras en cinta.
- `componentes.html` — botones (estados), chips de estado, interruptor, tarjetas de plan y de módulo.
- `SPEC.md` — tokens, tipografía, reglas de contenido y comportamiento.

Cada HTML incluye un pequeño script para el interruptor Mensual/Anual (`.seg[data-billing]`, `[data-price]`, `[data-per]`). Las `:hover` de las tarjetas se eliminaron del markup estático; están descritas en SPEC.md.

## Orden de secciones (ambas direcciones)
1. Nav · 2. Hero (titular + app) · 3. Cifras (858 · 28 · 4 · IVA) · 4. Qué hace (6 módulos) · 5. Tres motores, un solo escrito · 6. Tres estados de una afirmación · 7. Planes · 8. Seguridad y datos · 9. Cómo empieza una firma · 10. Se instala como app · 11. CTA final · 12. Pie.

## Cómo se sirve
- `index.html` (esta carpeta) es la página construida a partir de la Dirección A con las cifras en cinta, la retícula bento de módulos y la píldora de navegación de la Dirección B. Los dos archivos de dirección y `componentes.html` se conservan como fuente de diseño.
- Vercel sirve primero el sistema de archivos, así que `https://iureon-app.vercel.app/landing/` entrega este `index.html` antes de que la reescritura de `vercel.json` mande todo a la aplicación. La carpeta va en minúscula: en Vercel las rutas distinguen mayúsculas.
- Puerta en `src/App.tsx`: sin sesión, en `/` y sin `?entrar`, `?ir` ni `?vista`, la aplicación hace `window.location.replace('/landing/')`. Con `?entrar=1` se pinta el inicio de sesión como siempre; `?vista=1` sigue siendo la vista previa local.
- Enlaces de la portada: «Iniciar sesión» → `/?entrar=1`; «Contratar Esencial | Premium | Firma» → `/?entrar=1&plan=ESENCIAL|PREMIUM|FIRMA` (el plan se guarda en `sessionStorage` como `iureon.plan-elegido` y abre la pantalla de planes una vez tras entrar); «Manual» → `/?entrar=1&ir=manual`; «Política de tratamiento de datos» → `/?entrar=1&ir=privacidad`; «Escríbanos a soporte» → `https://wa.me/573011750316`; «Contratar» sin plan y «Ver planes» → `#planes`.
- El inicio de sesión tiene el enlace «← Volver a la página principal» → `/landing/index.html`.
