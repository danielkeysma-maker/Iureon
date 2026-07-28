# Iureon - Especificación Técnica del Proyecto

## 📌 Visión del Sistema
Iureon es la plataforma B2B SaaS de Inteligencia Artificial y Ecosistema Judicial líder para Colombia, diseñada para la generación de providencias judiciales, tutelas, recursos de apelación y contestaciones con máxima dogmática jurídica.

## 🏗️ Arquitectura del Software

### 1. Autenticación & Multi-Tenancy
- **Portal de Login**: `LoginPortalView.tsx`
- **Gestión de Firmas & Usuarios**: `TenantUserManagementModal.tsx`
- **Aviso de Seguridad & Advertencias**: `ActionConfirmationModal.tsx`
- **SuperUsuario Global**: `ingdanielma@gmail.com`
- **Modelo Económico**: Recarga de Créditos Procesales (COP $) sin cuotas de suscripción fijas ficticias (`FirmCreditsRechargeModal.tsx`).

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
