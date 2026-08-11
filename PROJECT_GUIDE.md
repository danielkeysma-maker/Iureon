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

## 📏 CONTRATO DE MÓDULOS (reemplaza la antigua regla de 500 líneas)

> 🚨 **REGLA DE ORO DE MANTENIBILIDAD**: la métrica no es el tamaño del archivo, sino el acoplamiento. Un archivo de 400 líneas aislado se mantiene solo; uno de 200 que alcanza el interior de otro módulo, no. `scripts/check-module-boundaries.sh` valida estas cuatro reglas en CI:

**1. Los tipos de dominio viven en `<módulo>/types.ts`, nunca dentro de un componente.**
Ningún módulo debe importar un tipo desde el archivo de un componente ajeno. Componer un componente de otro módulo sí está permitido: eso es React normal.

**2. Solo la capa de API llama a `fetch`.**
Los componentes usan `<módulo>/services/*.api.ts`, que a su vez usa `config/httpClient.ts`. Ningún componente conoce una URL ni el header `x-firm-id`.

**3. El cliente de Supabase se crea una sola vez**, en `backend/src/config/supabase.config.ts`.

**4. Los controladores no hablan con Supabase.**
El acceso a datos vive en el servicio del módulo. Rutas → controlador → servicio.

### Anatomía de un módulo

```
frontend/src/modules/<dominio>/
├── types.ts             # contrato del dominio — lo único que otros módulos importan
├── components/          # UI
├── hooks/               # estado y orquestación
└── services/*.api.ts    # acceso al backend

backend/src/modules/<dominio>/
├── types.ts             # contrato del dominio
├── <x>.routes.ts        # cableado de rutas
├── <x>.controller.ts    # HTTP: valida entrada, formatea salida
└── <x>.service.ts       # lógica de negocio y acceso a datos
```

El tenant activo llega por `TenantContext`; ningún componente lo recibe por props ni lo hardcodea.

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
