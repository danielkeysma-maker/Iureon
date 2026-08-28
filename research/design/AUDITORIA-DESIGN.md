# Auditoría: lo construido contra los artboards de Claude Design

Fecha: 27 ago 2026. Compara cada artboard (44 del sistema + 8 del bundle
Audiencias/Entrevistas) contra el código en `frontend/src`.

**Estados**: FIEL (reconstruida según el artboard; las omisiones son de datos
que el backend no produce y están declaradas) · PARCIAL (parte del layout del
artboard, parte del viejo) · SOLO PALETA (tokens aplicados, layout viejo) ·
VIEJA (diseño anterior intacto) · NO EXISTE (Design la inventó; no hay nada).

---

## Fundamentos y sistema (hechos)

| Artboard | Estado | Notas |
|---|---|---|
| 1a Fundamentos | **FIEL** | `tokens.css`, `components.css`, tailwind. |
| 1b Tres estados | **FIEL** | chips verified / unverified (punteado) / neutral. |
| 1c Componentes base | **FIEL** | botones, campos, chips, tabla, avisos. |
| 1d Barra lateral | **FIEL** | 4 grupos con verbos + riel; badges solo con datos reales. |
| 3a Sistema de diálogos | **FIEL** | `Dialog.tsx`: 3 zonas, S/M/L, Esc anunciado, foco al invocador. |
| 4a Modo oscuro | **FIEL** | por tema del dispositivo, tokens `--dark-*`. Revisar las «cinco reglas que no se invierten» una a una. |
| 4b/4c Oscuro escritorio/diálogos | **FIEL por herencia** | salen de los tokens; revisar visualmente. |

## Módulos principales

| Artboard | Estado | Falta de LAYOUT | Falta de BACKEND |
|---|---|---|---|
| 1e Taller de redacción | **FIEL** | revisar detalles menores contra el artboard | — |
| 1f Orientación | **PARCIAL** | bloque «Lo que el catálogo leyó» (chips de lectura), límite visual de 6 actuaciones, estado «no reconozco nada» como pantalla propia | — (el triage ya devuelve las señales) |
| 1g Audiencia · detalle | **PARCIAL** | tres columnas estrictas (tiempo·voz·texto), reproductor anclado abajo, acciones solo bajo la intervención en edición, panel lateral de interlocutores con conteos | revisión por intervención; confianza por fragmento |
| 1h Buscador | **PARCIAL** | filtros año / sala / «solo curadas»; conteos por bloque | curaduría de jurisprudencia por la firma (nota del curador, «citada en N escritos», postura contraria) |
| 1i Catálogo | **PARCIAL** | tres bloques iguales arriba (término/norma/autoridad, cada uno con su estado); «No aplica» al mismo nivel que «Marcar verificada» | historia de curaduría (tabla de eventos con nombre y hora); «usada en N escritos» |
| 1j Login | **REVISAR** | paleta limpia; contrastar mensaje y garantías contra el artboard | — |
| 1k Saldo y recarga | **VIEJA** | pantalla completa del artboard: saldo, «≈ N escritos al consumo del último mes», consumo del mes, costo medio | los datos ya existen (billing summary + movements) |
| 2a Entrevista | **FIEL** (flujo) | guion sugerido, prueba de micrófono, «tomar notas sin grabar» | transcripción en vivo; autorizaciones persistidas (columna + hora); guion que se tacha |
| 2b Auditoría | **VIEJA** | tabla densa con filtros (usuario/acción/resultado/fechas), vistas guardadas | CSV firmado; ¿el registro cubre todas las acciones? |
| 2c Privacidad | **VIEJA** | orden por sensibilidad, «derivado del sistema», certificado PDF | endpoint subprocessors ya existe; falta certificado y «avisarme de cambios» |
| 2d Herramientas | **VIEJA** | lista por tarea (no cuadrícula), buscador, «usadas esta semana» | registro de uso por usuario |
| 5a Visor completo | **PARCIAL** | — (lo construible está: exportación con opciones, marcar listo, 816px) | marcado por afirmación (barra ámbar), paginación real, miniaturas |
| 5b Liquidación laboral | **VIEJA** | rediseño como diálogo tipo 3 (M) con fundamento por concepto | exportar Excel; «insertar en el escrito» |
| 10a/10b Borradores | **FIEL** | — | versiones (texto de cada una); «sin verificar» por escrito |
| 11a/11b Audiencias lista/subir | **FIEL** | — | fracción 32/58; costo estimado por duración; expediente digital |
| 12a/12b Entrevistas lista/flujo | **FIEL** | — | recordatorio a 3 días; actuación posible en la fila (triage sobre transcripción) |

## Diálogos y ajustes

| Artboard | Estado | Notas |
|---|---|---|
| 3b Glosario | **SOLO PALETA** | Design lo cambia de raíz: 418 términos **leídos del catálogo verificado**, cada ficha con su norma. Hoy es una lista escrita a mano. Backend: derivar del catálogo. **TOMAR** — es la versión honesta. |
| 3c Sugerencia de jerga | **VIEJA** | Design agrega «como escribe su firma, aprendido de N escritos» — `learning.teachStyle` ya guarda estilo; falta exponerlo aquí. |
| 3d Marca de la firma | **VIEJA** | rediseñar como formulario L con previsualización sobre papel real. Los campos ya existen. |
| 6a Apariencia | **FIEL** | tema / fuente / densidad con vista previa, prefs en backend. |
| 6b Ajustes · Documento y formato | **PARCIAL** | falta la estructura «Suyos / De la firma» y la sección de tipografía del escrito sobre papel. |
| 6c Gestión de la firma | **VIEJA (modal)** | Design la hace pantalla: usuarios, invitaciones, roles (quién cura, quién gasta saldo). Backend de roles existe en parte. |

## Lo que Design inventó y no existe (evaluación)

| Artboard | Qué es | Veredicto propuesto |
|---|---|---|
| 7a/7b Consola de operación | Firmas con salud de catálogo y saldo como columnas; ficha con lo que operación **no** puede ver | **TOMAR** — es la pantalla del superusuario; runway y billing ya existen en backend. |
| 8a Acceso de soporte | Autorización explícita, alcance, 1 hora, aviso permanente, revocación | **TOMAR con calma** — excelente práctica y argumento de venta, pero exige backend serio (permisos temporales auditados). No improvisar. |
| 8b Catálogo maestro | Publicación a las firmas sin pisar lo curado | El **modelo** ya es real (catálogo compartido + curaduría por firma). La pantalla de operación: EVALUAR después de 7a. |
| 9a Manual de uso | Por tarea real, con estado de lectura | **EVALUAR** — valioso, pero es contenido más que software; puede empezar como estático. |
| 9b Soporte | Chat en la app + WhatsApp con expectativas distintas | **EVALUAR** — el chat en la app exige infraestructura de mensajería o un tercero. WhatsApp es un enlace: eso sí es inmediato. |
| 4d/4e/5c/5d/8d/9d/10c/11c/12c Móvil | Estructura repensada, no encogida | **TOMAR al final**, cuando el escritorio esté fiel: rehacer pantallas dos veces es pagarlas dos veces. |

---

## Orden de trabajo propuesto

1. **VIEJAS con datos ya existentes** (pura reconstrucción): 1k Saldo · 2c Privacidad · 2d Herramientas · 2b Auditoría · 3d Marca · 5b Liquidación · 6c Gestión de la firma (a pantalla).
2. **PARCIALES a fiel** (layout): 1i Catálogo (tres bloques + No aplica) · 1h Buscador (filtros + conteos) · 1f Orientación · 1g Audiencia detalle (tres columnas + reproductor anclado) · 6b Ajustes.
3. **Backend que habilita lo omitido**: historia de curaduría · revisión por intervención · autorizaciones de entrevista persistidas · glosario derivado del catálogo · curaduría de jurisprudencia por firma.
4. **Nuevas grandes**: 7a/7b consola de operación · 8a acceso de soporte · 9a/9b.
5. **Móvil**, todo junto, al final.
