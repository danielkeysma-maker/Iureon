# Iureon - Especificación Técnica del Proyecto

## 📌 Visión del Sistema
Iureon es la plataforma B2B SaaS de Inteligencia Artificial y Ecosistema Judicial líder para Colombia, diseñada para la generación de providencias judiciales, tutelas, recursos de apelación y contestaciones con máxima dogmática jurídica.

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

### 2. Pipeline de Inteligencia Artificial (OpenRouter API)
- `google/gemini-3.6-flash`: Análisis de expedientes PDF y extracción de hechos.
- `openai/gpt-5.6-sol`: Razonamiento y estructuración dogmática.
- `anthropic/claude-opus-5`: Redacción solemne y formal de providencias.

### 3. Redacción & Workspace
- **Panel de Agentes**: `AgentPanelLeft.tsx`
- **Lienzo de Documento & PDF**: `DocumentCanvasRight.tsx` / `PdfViewerCanvas.tsx`
- **Pantalla Central**: Alternancia entre vista dividida y modo editor ampliado.
- **Borradores Guardados**: `SavedDraftsModal.tsx`

### 4. Búsqueda & RAG de Jurisprudencia
- Ingestión de sentencias de las Altas Cortes en Colombia (Corte Constitucional, Corte Suprema de Justicia, Consejo de Estado).
- Clasificación de precedentes en Concedidos y Negados.

### 5. Herramientas de Cálculo
- Liquidaciones laborales (CST).
- Intereses de mora y cánones.
- Términos procesales en días hábiles (CGP / CPTSS).
