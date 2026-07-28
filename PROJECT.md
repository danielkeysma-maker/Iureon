# PROJECT.md - Registro Integral de Arquitectura y Estado de Iureon

## 📋 Resumen del Proyecto
**IUREON** es una plataforma LegalTech B2B SaaS Multi-Tenant diseñada para abogados, firmas jurídicas y despachos judiciales en Colombia. Combina inteligencia artificial generativa con orquestación RAG, base de datos vectorial (`pgvector` en Supabase), boveda de documentos cifrados (Backblaze B2) y herramientas de gestión procesal.

---

## 🏛️ Pipeline de IA de 3 Motores Insignia
El sistema utiliza una arquitectura de orquestación en cascada a través de OpenRouter (`openrouter.ai`):
1. **Fase 1: Gemini 3.6 Flash** (`google/gemini-3.6-flash`): Lectura e ingesta masiva de expedientes y hechos.
2. **Fase 2: GPT-5.6 Sol** (`openai/gpt-5.6-sol`): Estructuración dogmática y formulación de excepciones procesales.
3. **Fase 3: Claude Opus 5** (`anthropic/claude-opus-5`): Redacción formal, solemne e íntegra del escrito procesal.

---

## 🛠️ Componentes y Módulos Recientes Implementados

### 1. 🗖 Modo Editor Pantalla Central y Membrete con Logo
- **Archivos**: `App.tsx`, `HeaderTop.tsx`, `LegalDraftViewer.tsx`, `FirmBrandingModal.tsx`, `documentExport.service.ts`.
- **Descripción**: Permite colapsar el panel de prompts y expandir el lienzo de edición al 100% del ancho del workspace. Incluye modal de membrete corporativo con carga de logo de la firma en formatos `.png`, `.jpg` y `.svg`.

### 2. 📁 Bóveda de Borradores Guardados
- **Archivos**: `SavedDraftsModal.tsx`, `App.tsx`, `LegalDraftViewer.tsx`.
- **Descripción**: Sistema de almacenamiento persistente (`localStorage` & Supabase) que permite a los abogados guardar sus borradores corregidos y reabrirlos en cualquier momento.

### 3. 📖 Glosario Jurídico Procesal Colombiano Integral
- **Archivos**: `ToolsView.tsx`.
- **Descripción**: Diccionario interactivo en tiempo real con buscador y filtro por ramas del derecho (Constitucional, Civil/CGP, Laboral/CST, Administrativo/CPACA, Penal/Ley 906, Familia y Comercial) con más de 30 conceptos procesales de la legislación colombiana.

### 4. 📜 Buscador Universal & Visor de Sentencias Completas
- **Archivos**: `SearchView.tsx`, `FullProvidenciaModal.tsx`, `openrouter.service.ts`.
- **Descripción**: Buscador multititulo con normalización de tildes para todas las corporaciones (Corte Constitucional, CSJ, Consejo de Estado y Tribunales). Incluye cobertura completa del espectro de **Reparación Directa** (Mina Antipersonal, Privación Injusta de la Libertad, Falla Médica, Obras Públicas, Balas Perdidas, Custodia INPEC).

### 5. 📄 Visor PDF Dinámico e Interactivo (Sin Datos Ficticios)
- **Archivos**: `PdfViewerCanvas.tsx`.
- **Descripción**: Visor de folios procesales con controles de zoom (75%-150%), navegación de páginas e inspección de texto OCR extraído. Estado inicial limpio sin datos mock.

### 6. 🚜 Ingestión Masiva de Jurisprudencia
- **Archivos**: `mass_ingest_jurisprudence.ts`, `scrapers.ts`, `jurisprudenceIngestion.service.ts`.
- **Descripción**: Framework de trabajadores en segundo plano para extraer e ingestar providencias de la Corte Constitucional, Corte Suprema, Consejo de Estado y Tribunales en Supabase `SYSTEM_CORPUS`.

---

## 🚨 Reglas de Arquitectura e Invariantes
- **Umbral de 500 Líneas**: Ningún archivo del proyecto puede superar las 500 líneas de código.
- **Sin Datos Ficticios Genéricos**: Nombres como "Mario Alberto Pérez" o "Julián Delgado" están prohibidos. Toda la plataforma utiliza marcadores solemnes de la Rama Judicial (`APODERADO JUDICIAL`, `DEMANDANTE`, `DEMANDADO`) o la información real ingresada por el usuario.
- **Motores Invariables Fijos**: El pipeline utiliza exclusivamente los slugs oficiales `google/gemini-3.6-flash`, `openai/gpt-5.6-sol` y `anthropic/claude-opus-5`.
