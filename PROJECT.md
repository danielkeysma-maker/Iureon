# Iureon - Especificación Técnica del Proyecto

## 📌 Visión del Sistema
Iureon es la plataforma B2B SaaS de Inteligencia Artificial y Ecosistema Judicial líder para Colombia, diseñada para la generación de providencias judiciales, tutelas, derechos de petición, recursos de apelación, contestaciones y toda actuación procesal con máxima dogmática jurídica.

## 🏗️ Arquitectura del Software

### 1. Autenticación, Multi-Tenancy & Producción Limpia
- **Portal de Login**: `LoginPortalView.tsx`
- **Entorno Cero Datos Ficticios (Zero Mock Data)**: La plataforma inicia con 0 firmas ficticias. Toda firma o usuario nace únicamente cuando se registra de forma explícita.
- **Aprovisionamiento Flexible de Usuarios**:
  - **Abogados de Firma**: Requieren la creación previa de una Firma Cliente (`FIRM_ADMIN` / `LAWYER`).
  - **Abogados Particulares**: Pueden registrarse de forma independiente sin estar vinculados a ninguna firma (`INDEPENDENT_LAWYER` / `firmId: 'INDEPENDENT'`).
  - **SuperUsuario Global**: Acceso global de administración desvinculado de firmas (`SUPER_ADMIN` / `firmId: 'N/A'`).
- **Gestión de Firmas & Usuarios**: `TenantUserManagementModal.tsx` con capacidades completas de creación, edición y eliminación de firmas y cuentas de usuario.
- **Visualización Contextual en Barra Lateral (`SidebarLeft.tsx`)**:
  - `👑 SuperUsuario Global (Acceso Total - Sin Firma)`
  - `👤 Abogado Particular (Sin Firma - Uso Personal)`
  - `🏢 Firma Cliente (NIT ...)`
- **Protección por Modales de Confirmación**: Todas las operaciones destructivas o de edición (crear/editar/eliminar firmas y usuarios, así como el Cierre de Sesión) están protegidas por `ActionConfirmationModal.tsx`.
- **Despliegue Obligatorio vía Git**: Todo cambio realizado en la plataforma debe empaquetarse y desplegarse inmediatamente a producción usando Git (`git add .`, `git commit`, `git push origin main`).

### 2. Modelo Económico de Créditos
- **Sin suscripciones**: Modelo pay-as-you-go con recarga de créditos en COP $.
- **Costo por borrador**: $2.000 COP por cada generación de documento con IA. Se descuenta automáticamente del saldo.
- **Saldo en tiempo real**: `SidebarLeft.tsx` muestra el saldo actual de la firma sin fallbacks ficticios (`?? 0` en vez de `|| 500000`).
- **Recarga**: `FirmCreditsRechargeModal.tsx` (integración futura con Wompi / PSE / Nequi / Tarjeta).
- **Persistencia**: El saldo se actualiza en React state y localStorage por firma.

### 3. Pipeline de Inteligencia Artificial (OpenRouter API) — 3 Motores

Cada motor gasta SOLO los tokens de su tarea. No hay redundancia.

#### Modo Nuevo (sin borrador):
| Motor | Tarea | max_tokens |
|---|---|---|
| **Gemini 3.6 Flash** | Extraer hechos, partes y pretensiones en lista concisa | 1024 |
| **GPT-5.6 Sol** | Esquema dogmático: problema jurídico, excepciones, normas, estrategia | 1536 |
| **Claude Opus 5** | Redactar documento jurídico COMPLETO y solemne | Sin límite |

#### Modo Continuación (con borrador cargado):
| Motor | Tarea | max_tokens |
|---|---|---|
| **Gemini 3.6 Flash** | Identificar SOLO qué cambiar (máx. 5 puntos) | 768 |
| **GPT-5.6 Sol** | Esquema de CORRECCIONES (no completo) | 1024 |
| **Claude Opus 5** | Aplicar correcciones al borrador existente | Sin límite |

- **Regla de formato para Claude**: NO usar `##` headings markdown ni `---` separadores. Usar `**negritas**` ÚNICAMENTE para: títulos de secciones, numerales resolutivos (PRIMERO:, SEGUNDO:), nombres propios y verbos clave (CONCEDER, NEGAR, TUTELAR, ORDENAR).
- **Estructura como Guía**: Las estructuras por tipo son una guía de referencia; Opus 5 decide la mejor estructura según su criterio jurídico.
- **Cadena de datos**: Gemini → GPT recibe output de Gemini → Claude recibe output de Gemini + esquema de GPT.
- **Fallback Local**: Si OpenRouter no responde, se genera una plantilla solemne estática colombiana.

### 4. Tipos de Actuaciones por Rama del Derecho
- **10 Ramas**: Constitucional, Laboral, Civil, Administrativo, Penal, Familia, Pequeñas Causas, Tributario, Societario, Internacional.
- **2 Roles de actuación**: Firma Litigante (demandas, recursos, contestaciones) y Juzgado/Despacho (proyecciones de sentencia, autos).
- **Derecho de Petición (Ley 1755/2015)**: Disponible en TODAS las ramas del derecho como actuación del litigante.
- **El documento generado se adapta al tipo de actuación, la rama y el tipo seleccionado.**

### 5. Redacción & Workspace
- **Panel de Agentes**: `AgentPanelLeft.tsx` — Selección de rama, rol, tipo de documento y prompt.
- **Lienzo de Documento & PDF**: `DocumentCanvasRight.tsx` / `PdfViewerCanvas.tsx`
- **Título limpio en todos los visores**: Se eliminan automáticamente `(Art. 23 C.P. / Ley 1755...)`, `_EXP-2026-904`, `Redacción_de_`. Ejemplo: `Derecho De Petición`.
- **Visor de Documento (PdfViewerCanvas)**:
  - Título limpio (sin artículos de ley ni códigos de expediente).
  - Renderiza `**negritas**` como negritas reales HTML.
  - Limpia `##` headings y `---` separadores markdown.
  - Fuente Times New Roman (estilo judicial).
  - Zoom (60% – 150%), paginación, impresión directa, toggle texto plano.
- **Editor de Borrador (LegalDraftViewer)**:
  - Título limpio en la barra superior.
  - **Modo Vista** (por defecto): Renderiza negritas reales con `dangerouslySetInnerHTML` + DOMPurify.
  - **Modo Edición**: Toggle a textarea para editar el raw markdown.
  - **Jurisprudencia colapsable**: Panel debajo del documento (cerrado por defecto). Click para expandir sentencias + excepciones. No ocupa espacio de pantalla.
- **Barra de acciones sticky**: "Guardar Borrador", "Mis Borradores", "Pantalla Central" siempre visibles.

### 6. Persistencia de Borradores (Multi-Tenant)
- **API Backend**: Tabla `saved_drafts` en Supabase con RLS por `firm_id`.
  - Endpoints: `GET/POST/PUT/DELETE /api/drafts`
  - Middleware: `x-firm-id` header para aislamiento multi-tenant.
- **localStorage fallback**: Clave scoped `iureon_saved_drafts_{firmId}_{email}`.
- **Migración automática**: Borradores de la clave global antigua (`iureon_saved_drafts`) se migran al nuevo scope al primer login.
- **Actualizar vs. Duplicar**: Si abres un borrador guardado y lo editas, "Guardar" actualiza el mismo (PUT) en vez de crear nuevo (POST).
- **Botón "Mis Borradores Guardados"**: Accesible desde la vista vacía del canvas sin necesidad de tener borrador activo.

### 7. Continuación y Corrección desde Borradores Guardados
- **Flujo**: El usuario carga un borrador guardado → el panel izquierdo muestra un banner azul "Modo Continuación" → el usuario escribe instrucciones (ej: "ampliar pretensiones", "corregir hechos", "agregar jurisprudencia") → los 3 motores procesan con prompts adaptativos al modo continuación → Opus entrega el documento completo corregido/ampliado.
- **Los 3 motores adaptan sus prompts**: Gemini identifica cambios (no re-extrae todo), GPT genera esquema de correcciones (no esquema completo), Claude aplica correcciones al borrador existente.
- **UI**: El botón cambia de "Generar Borrador" a "Continuar / Corregir" cuando hay un borrador activo.

### 8. Exportación con Nomenclatura Limpia y Negritas Reales
- **Nombre de archivo**: `TipoActuacion_NombreParte_Fecha` (ej: `Derecho_De_Peticion_Juan_Perez_31-Jul-2026.pdf`).
- **Extracción automática del nombre**: Se extrae el demandante/accionante del output de Gemini (Fase 1).
- **Limpieza del tipo de documento**: Se eliminan artículos de ley `(Art. 23 C.P.)`, prefijos `Redacción de`, artículos iniciales `La`/`El`.
- **Word (.docx)**: `**texto**` → `TextRun({ bold: true })`. Cada línea se parsea en segmentos bold/normal.
- **PDF (.pdf)**: `**texto**` → `doc.setFont('helvetica', 'bold')`. Renderizado segmento a segmento.
- **Impresión**: `**texto**` → `<strong>` HTML en la ventana de impresión.
- **Limpieza automática**: `##` headings → texto plano, `---` → eliminados.
- Membrete dinámico de la firma cliente en header/footer.

### 9. Búsqueda & RAG de Jurisprudencia
- Jurisprudencia de TODAS las Cortes de Colombia:
  - **Corte Constitucional**: Sentencias de tutela (T-), constitucionalidad (C-), unificación (SU-).
  - **Corte Suprema de Justicia**: Salas Civil (SC-), Laboral (SL-), Penal (SP-).
  - **Consejo de Estado**: Secciones Primera a Cuarta (CE-SEC1 a CE-SEC4), unificación (CE-SU).
  - **Tribunales Superiores**: Bogotá, Cundinamarca, Valle del Cauca, etc.
- Clasificación: Sentencias **concedidas**, **negadas**, de **sala**, de **revisión** y de **unificación**.
- Detección inteligente de temas especiales: tránsito/movilidad, comparendos, fotomultas, reparación directa, etc.

### 10. Enseñar Estilo (Aprendizaje de Formato)
- **"Enseñar estilo"**: Si la firma edita un documento y pulsa el botón, ese formato personalizado (`customFormat`) se guarda y prevalece sobre la guía de referencia en futuras generaciones.
- **Backend**: `customFormatInstruction` se inyecta en el system prompt con prioridad sobre la estructura por defecto.

### 11. Herramientas de Cálculo
- Liquidaciones laborales (CST).
- Intereses de mora y cánones.
- Términos procesales en días hábiles (CGP / CPTSS).
