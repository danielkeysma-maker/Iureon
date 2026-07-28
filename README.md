# Iureon - Plataforma LegalTech B2B SaaS Multi-Tenant (Colombia)

> ⚖️ **Motor de Búsqueda Web de Precedentes en Vivo (Casos Concedidos vs. Negados) & Hermenéutica Profesional**.
> 🚨 **Regla de Escalabilidad**: Todos los archivos del código se mantienen estrictamente por debajo del umbral de **500 líneas de código**.
> ⏱️ **Regla de Navegación Directa por el Usuario**: El asistente de IA no ejecutará herramientas de navegador automático sobre el entorno local ni páginas web. Únicamente el usuario realizará la navegación y pruebas en vivo para ahorrar tiempo y maximizar la agilidad del desarrollo.

## 🌟 Módulos y Capacidades del Sistema:
1. **Motor de Hermenéutica Profesional**: Sustentación dogmática basada en *Analogía Legis* y *Principios Generales del Derecho* cuando no haya precedente idéntico, **cero invención**.
2. **Buscador en Vivo de Precedentes Web**: Clasificación de casos parecidos en internet entre 🟢 **Concedidos** y 🔴 **Negados**.
3. **Derecho Internacional & Comunitario Andino**: Corte IDH, Pacto de San José, Control de Convencionalidad, Exequátur CSJ, CIADI y TJCA.
4. **Soporte Completo para Todas las Ramas del Derecho Colombiano** con actuaciones y plantillas jurídicas especializadas.
5. **Editor Interactivo de Proyecciones en Vivo** con sugeridor inteligente de jerga procesal y vocabulario.
6. **Motor de Aprendizaje por Firma**: Analiza las correcciones del abogado y adopta su jerga para futuras providencias.
7. **Orquestación RAG Multi-Motor** (Gemini 3.6 Flash -> GPT Router -> Claude Opus 5).
8. **Ingestión e Indexación RAG** (`pgvector` 1536d en Supabase).
9. **Bóveda de Archivos Aislada** (Backblaze B2 por `firm_id`).
10. **Evaluador Prospectivo de Providencias** (Concedidos vs. Negados, factores de riesgo).
11. **Calculadora de Términos Procesales Judiciales** (CGP & CPTSS Días Hábiles).
12. **Calculadora de Liquidaciones Laborales & Agencias en Derecho** (Art. 64 CST & CSJ).
13. **Auditoría & Trazabilidad B2B Compliance** (Registros inmutables por abogado).
14. **Exportador Multi-Tenant Word (.docx) & PDF (.pdf)** con membrete dinámico.
15. **Despliegue con Docker Compose** (`docker-compose.yml`, Dockerfiles en Node.js y Nginx).

Consulta la arquitectura detallada en:
👉 **[PROJECT_GUIDE.md](file:///c:/Iureon/PROJECT_GUIDE.md)**
