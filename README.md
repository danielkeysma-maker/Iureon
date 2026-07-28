# Iureon - Plataforma LegalTech B2B SaaS Multi-Tenant (Colombia)

> ⚖️ **Motor de Búsqueda Web de Precedentes en Vivo (Casos Concedidos vs. Negados), Hermenéutica Profesional & Redacción de Providencias**.
> 🚨 **Regla de Escalabilidad**: Todos los archivos del código se mantienen estrictamente por debajo del umbral de **500 líneas de código**.
> ⏱️ **Regla de Navegación Directa por el Usuario**: El asistente de IA no ejecutará herramientas de navegador automático sobre el entorno local ni páginas web. Únicamente el usuario realizará la navegación y pruebas en vivo para ahorrar tiempo y maximizar la agilidad del desarrollo.

---

## 🌟 Módulos y Capacidades Principales del Sistema:

1. **Pipeline de IA de 3 Motores Insignia**:
   - ⚡ **Fase 1: Gemini 3.6 Flash** (`google/gemini-3.6-flash`): Ingesta masiva y análisis de hechos del expediente.
   - 🧠 **Fase 2: GPT-5.6 Sol** (`openai/gpt-5.6-sol`): Estructuración dogmática y formulación de excepciones.
   - ✍️ **Fase 3: Claude Opus 5** (`anthropic/claude-opus-5`): Redacción solemne y formal de la providencia final.

2. **🗖 Modo Pantalla Central (Editor Ampliado)**:
   - Permite expandir el lienzo de trabajo al 100% del ancho del sistema para leer, escribir y editar sin distracciones.

3. **📁 Bóveda de Borradores Guardados (`SavedDraftsModal.tsx`)**:
   - Guarda providencias y escritos procesales editados de la firma para ser reabiertos y corregidos días o semanas después.

4. **📖 Glosario Jurídico Procesal de Colombia**:
   - Diccionario interactivo en tiempo real con más de 30 términos dogmáticos (*Ratio Decidendi, Obiter Dictum, Excepción de Mérito, Habeas Data, Prescripción Trienal, etc.*) y sus bases legales.

5. **📜 Visor de Sentencias Completas (`FullProvidenciaModal.tsx`)**:
   - Permite cliquear cualquier cita jurisprudencial para abrir el texto completo de la sentencia, Magistrado Ponente, Hechos y Resuelve.

6. **📄 Visor PDF Dinámico e Interactivo (`PdfViewerCanvas.tsx`)**:
   - Controles de zoom (75%-150%), navegación por número de folio e inspección de texto extraído por OCR.

7. **🚜 Ingestión Masiva de Jurisprudencia Colombiana**:
   - Pipeline automatizado en `backend/src/modules/ingestion/mass_ingest_jurisprudence.ts` y scrapers en segundo plano para alimentar la base de conocimiento vectorial de la Corte Constitucional (T, C, SU), Corte Suprema (SL, SC, SP), Consejo de Estado y Tribunales.

8. **Motor de Hermenéutica Profesional**: Sustentación dogmática basada en *Analogía Legis* y *Principios Generales del Derecho*, **cero invención**.

9. **Buscador en Vivo de Precedentes Web**: Clasificación entre 🟢 **Concedidos** y 🔴 **Negados**.

10. **Calculadora de Términos Procesales Judiciales** (CGP & CPTSS Días Hábiles).

11. **Calculadora de Liquidaciones Laborales & Agencias en Derecho** (Art. 64 CST & CSJ).

12. **Exportador Multi-Tenant Word (.docx) & PDF (.pdf)** con membrete dinámico.

---

Consulta la arquitectura detallada en:
👉 **[PROJECT_GUIDE.md](file:///c:/Iureon/PROJECT_GUIDE.md)** y **[PROJECT.md](file:///c:/Iureon/PROJECT.md)**
