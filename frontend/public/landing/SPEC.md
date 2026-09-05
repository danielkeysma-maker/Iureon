# SPEC — IUREON landing

## Tokens
- Azul marino (fondo oscuro, texto de marca): #14294A · variante más oscura (pie/nav B): #0e1f3a · halo: #1f4372 / #24508a
- Azul acción (botón primario, enlaces): #17456B
- Oro (acento, CTA sobre oscuro, badges): #C8A046 · hover #d6b05a · oro texto sobre claro: #7a5f1c
- Crema (superficie cálida, texto sobre oscuro): #F4F1EA · Gris página: #F7F8FA · Blanco: #fff
- Tinta: #101822 · Texto secundario: #4a5563 · Deshabilitado: #98a1ac
- Bordes: rgba(16,24,34,.08) sobre claro; rgba(244,241,234,.12–.25) sobre oscuro
- Estados: Verificado bg #E6F4EA / texto #1E6B3A / subrayado #2E8B57 · No caduca bg #E7EEF5 / texto #17456B · Sin verificar bg #FDF3DC / texto #7A4E00 / borde punteado #C8850A

## Tipografía
- UI: Plus Jakarta Sans 400/500/600/700/800 (Satoshi si se licencia). Titulares 800, letter-spacing −.03 a −.04em.
- Documento jurídico (mockups de escritos, cita): Source Serif 4; itálica en «Usted decide.» de la Dirección B.
- Escalas escritorio: h1 58 (A) / 72 (B) · h2 40–44 · cuerpo 15–17 · nota legal 13.5. Móvil: h1 36–40 · h2 26–30 · cuerpo 14–15.

## Componentes
- Botones: radio 999, alto 48–50 (escritorio) / mínimo 44 (móvil). Primario #17456B → hover #14294A y translateY(−1px). Secundario contorno 1.5px #17456B → hover relleno. Oro sobre oscuro. Foco: outline 3px #C8A046 offset 3px.
- Tarjetas: radio 16–22, borde 1px .08; hover translateY(−4px) + sombra 0 24px 48px −24px rgba(20,41,74,.25) + borde oro .45. Transición .25s.
- Chips: radio 999, 12–13px 700. «Sin verificar» siempre con borde punteado.
- Interruptor Mensual/Anual: cambia precios en toda la página. Mensual: Esencial $85.000, Premium $120.000, Firma $250.000 (/mes). Anual: $850.000 / $1.200.000 / $2.500.000 (/año) — 2 meses gratis.
- Sección «Tres motores»: fondo crema #F4F1EA; tres tarjetas encadenadas con flechas de oro; la tercera (Claude) en azul marino. En móvil se apilan con flecha vertical.

## Reglas de contenido (no negociables)
- Sin logotipos oficiales de Google, OpenAI ni Anthropic: solo nombres en texto (Gemini, GPT, Claude) o iconos genéricos.
- Sin cifras de velocidad, precisión ni porcentajes de IA.
- Nunca decir que la plataforma «entrena» modelos o «aprende» de los escritos; lo que existe es «Enseñar estilo» (guarda formato y jerga de la firma).
- Sin testimonios ni logos de clientes. Precios siempre «con IVA incluido». Pago por Wompi, sin tarjeta guardada.
- Tratamiento formal («usted»).

## Comportamiento sugerido en implementación
- Nav fija; en B, píldora con backdrop-filter.
- Aparición suave al hacer scroll (opacity + translateY 16px, 400ms) en tarjetas; respetar prefers-reduced-motion.
- La app del hero en A: rotateY(−7deg) rotateX(3deg) → 0 en hover.
- Móvil: CTAs a ancho completo, alto 48–50; menú hamburguesa (área 44×44).
