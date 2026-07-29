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
- **Modelo Económico**: Recarga de Créditos Procesales (COP $) sin cuotas de suscripción fijas ficticias (`FirmCreditsRechargeModal.tsx`).
- **Despliegue Obligatorio vía Git**: Todo cambio realizado en la plataforma debe empaquetarse y desplegarse inmediatamente a producción usando Git (`git add .`, `git commit`, `git push origin main`).

### 2. Pipeline de Inteligencia Artificial (OpenRouter API) — 3 Motores Exactos
- **Fase 1 – Ingesta Fáctica**: `google/gemini-3.6-flash` — Análisis de expedientes PDF y extracción de hechos.
- **Fase 2 – Estructura Dogmática**: `openai/gpt-5.6-sol` — Razonamiento y estructuración procesal.
- **Fase 3 – Redacción Solemne**: `anthropic/claude-opus-5` — Redacción íntegra del documento según la actuación, rama y tipo seleccionado (120s timeout, sin límite de tokens).
- **Estructura como Guía (no camisa de fuerza)**: Las estructuras por tipo son una guía de referencia; Opus 5 decide la mejor estructura según su criterio jurídico. Solo se exige no omitir la sección de petición/pretensiones/resuelve.
- **Regla de redacción**: Opus genera EXCLUSIVAMENTE el documento jurídico solicitado, sin meta-comentarios ni advertencias.
- **Fallback Local**: Si OpenRouter no responde, se genera una plantilla solemne estática colombiana.

### 3. Tipos de Actuaciones por Rama del Derecho
- **10 Ramas**: Constitucional, Laboral, Civil, Administrativo, Penal, Familia, Pequeñas Causas, Tributario, Societario, Internacional.
- **2 Roles de actuación**: Firma Litigante (demandas, recursos, contestaciones) y Juzgado/Despacho (proyecciones de sentencia, autos).
- **Derecho de Petición (Ley 1755/2015)**: Disponible en TODAS las ramas del derecho como actuación del litigante.
- **El documento generado se adapta al tipo de actuación, la rama y el tipo seleccionado.**

### 4. Redacción & Workspace
- **Panel de Agentes**: `AgentPanelLeft.tsx` — Selección de rama, rol, tipo de documento y prompt.
- **Lienzo de Documento & PDF**: `DocumentCanvasRight.tsx` / `PdfViewerCanvas.tsx`
- **Visor de Documento (PdfViewerCanvas)**: Muestra el borrador generado en formato de vista previa de impresión con:
  - Fuente Times New Roman (estilo judicial)
  - Zoom (60% – 150%)
  - Paginación por páginas simuladas
  - Botón de impresión directa
  - Toggle entre vista documento y texto plano
- **Barra de acciones sticky**: "Guardar Borrador", "Mis Borradores", "Pantalla Central" siempre visibles.
- **Borradores Guardados**: `SavedDraftsModal.tsx`

### 5. Continuación y Corrección desde Borradores Guardados
- **Flujo**: El usuario carga un borrador guardado → el panel izquierdo muestra un banner azul "Modo Continuación" → el usuario escribe instrucciones (ej: "ampliar pretensiones", "corregir hechos", "agregar jurisprudencia") → los 3 motores procesan usando el borrador como base → Opus entrega el documento completo corregido/ampliado.
- **Backend**: `existingDraft` se pasa por el pipeline hasta Opus, que lo recibe como "BORRADOR EXISTENTE" en el system prompt.
- **UI**: El botón cambia de "Generar Borrador" a "Continuar / Corregir" cuando hay un borrador activo. El placeholder del textarea cambia a instrucciones de continuación.

### 6. Búsqueda & RAG de Jurisprudencia
- Jurisprudencia de TODAS las Cortes de Colombia:
  - **Corte Constitucional**: Sentencias de tutela (T-), constitucionalidad (C-), unificación (SU-).
  - **Corte Suprema de Justicia**: Salas Civil (SC-), Laboral (SL-), Penal (SP-).
  - **Consejo de Estado**: Secciones Primera a Cuarta (CE-SEC1 a CE-SEC4), unificación (CE-SU).
  - **Tribunales Superiores**: Bogotá, Cundinamarca, Valle del Cauca, etc.
- Clasificación: Sentencias **concedidas**, **negadas**, de **sala**, de **revisión** y de **unificación**.
- Detección inteligente de temas especiales: tránsito/movilidad, comparendos, fotomultas, reparación directa, etc.

### 7. Enseñar Estilo (Aprendizaje de Formato)
- **"Enseñar estilo"**: Si la firma edita un documento y pulsa el botón, ese formato personalizado (`customFormat`) se guarda y prevalece sobre la guía de referencia en futuras generaciones.
- **Backend**: `customFormatInstruction` se inyecta en el system prompt con prioridad sobre la estructura por defecto.

### 8. Herramientas de Cálculo
- Liquidaciones laborales (CST).
- Intereses de mora y cánones.
- Términos procesales en días hábiles (CGP / CPTSS).
