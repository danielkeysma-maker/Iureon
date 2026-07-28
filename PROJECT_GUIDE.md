# Iureon - Plataforma LegalTech B2B SaaS Multi-Tenant (Colombia)
> **Manual de Arquitectura, Modularización y Guía de Escalabilidad para Desarrolladores**

---

## ⏱️ REGLA DE OPERACIÓN: NAVEGACIÓN DIRECTA EXCLUSIVA POR EL USUARIO

> ⚡ **DIRECTIVA DE EFICIENCIA**: El asistente de IA **no ejecutará subagentes ni herramientas de navegador automático** sobre el servidor local ni ninguna otra página web. Únicamente el usuario realizará la navegación, pruebas e interacciones directas en el navegador (`http://localhost:5173`) para optimizar tiempos y acelerar el desarrollo.

---

## 🌐 MOTOR DE BÚSQUEDA WEB EN VIVO & HERMENÉUTICA PROCESAL PROFESIONAL (CASOS CONCEDIDOS VS. NEGADOS)

> ⚖️ **SUSTENTACIÓN PROCESAL PROFESIONAL & BÚSQUEDA WEB**:
> 1. **Subsustanciación Doctrinal Profesional**: Cuando no existe una sentencia idéntica o jurisprudencia específica para un punto en debate, el motor **NUNCA inventa una cita ni alucina**. Aplica hermenéutica jurídica profesional: *Analogía Legis*, *Principios Generales del Derecho (Debido Proceso Art. 29 C.P., Buena Fe Art. 83 C.P., Equidad)* e *Interpretación Sistemática del Articulado*.
> 2. **Buscador RAG Web de Precedentes en Vivo**: Conexión indexada a internet para buscar casos similares de la Rama Judicial, clasificando el resultado en:
>    - 🟢 **Derecho Concedido**: Hechos clave y ratio decidendi donde la Corte otorgó la pretensión.
>    - 🔴 **Derecho Negado**: Motivos procesales por los cuales se desestimó la pretensión (para evitar errores del abogado).

---

## 🛠️ GUÍA PASO A PASO PARA EL USUARIO: DESCARGA E INGESTIÓN DE CÓDIGOS Y SENTENCIAS DE UNIFICACIÓN

> 👤 **GUÍA SENCILLA NO-CODE / PASO A PASO**:
> ```bash
> python backend/src/scripts/download_legal_corpus.py
> python backend/src/scripts/ingest_legal_corpus.py
> ```

---

## ⚖️ COBERTURA TOTAL DE TODAS LAS RAMAS DEL DERECHO COLOMBIANO E INTERNACIONAL

> 🏛️ Cobertura en Laboral, Civil, Administrativo (CPACA), Penal (Ley 906), Familia, Constitucional, Pequeñas Causas, Tributario (DIAN), Societario (SIC) y Derecho Internacional (Corte IDH / TJCA).

---

## 📏 REGLA ARQUITECTÓNICA OBLIGATORIA: UMBRAL DE 500 LÍNEAS DE CÓDIGO

> 🚨 **REGLA DE ORO DE ESCALABILIDAD**: Ningún archivo fuente (.ts, .tsx, .js, .css) en `backend/` o `frontend/` puede superar el **límite de 500 líneas de código**.

---

## ⚡ Guía de Inicio Rápido

### Backend (`backend/`)
```bash
cd c:/Iureon/backend
npm run dev        # Servidor Express en puerto 4000
```

### Frontend (`frontend/`)
```bash
cd c:/Iureon/frontend
npm run dev        # Servidor Vite en puerto 5173
```
