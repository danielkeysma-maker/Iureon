# Iureon - Plataforma LegalTech & Ecosistema Judicial Colombia

> ⚖️ **Plataforma B2B Multi-Tenant de Inteligencia Artificial para Firmas de Abogados y Despachos Judiciales en Colombia**.

---

## 🌟 Arquitectura y Características Principales

1. **🔒 Entorno de Producción 100% Limpio (Sin Datos Ficticios / Zero Mock Data)**:
   - Toda firma cliente o usuario abogado nacerá únicamente cuando se registre de forma real en la plataforma (0 firmas mock por defecto).
   - Seguridad **Supabase Auth & Multi-Tenant RLS** (*Row Level Security*).

2. **🚀 Protocolo Estricto de Despliegue con Git**:
   - Todo cambio o nueva característica debe empaquetarse y desplegarse inmediatamente a producción mediante repositorio Git (`git push origin main`).

3. **🏢 Aprovisionamiento Estricto & Flexibilidad para Particulares**:
   - Para abogados vinculados a firmas (`LAWYER` / `FIRM_ADMIN`), se exige la creación previa de la Firma Cliente.
   - Para **Abogados Particulares / Independientes** (`INDEPENDENT_LAWYER`), se permite el registro directo sin requerir firma (`👤 Sin Firma - Abogado Particular`).

4. **✏️🗑️ Edición y Eliminación Completa de Firmas y Usuarios**:
   - Módulo interactivo `TenantUserManagementModal.tsx` con gestión completa (CRUD) para actualizar datos o revocar accesos de firmas y abogados.

5. **⚠️ Modales de Advertencia y Confirmación Previa (`ActionConfirmationModal.tsx`)**:
   - Sistema global de seguridad que exige confirmación explícita mediante modal para:
     - Registro y actualización de Firmas Cliente.
     - Registro, modificación y eliminación de Cuentas de Usuarios Abogados.
     - Cierre de Sesión de la Plataforma (Logout).

6. **👤👑 Contextos de Usuario Desvinculados de Firma**:
   - **Abogado Particular**: Visualizado con el badge `👤 Sin Firma (Abogado Particular)` en tablas y `SidebarLeft.tsx`.
   - **SuperUsuario Global**: Cuenta de administración global (`ingdanielma@gmail.com`) desvinculada de firmas (`👑 SuperUsuario Global - Acceso Total`).

7. **💳 Modelo Económico de Recargas de Créditos Procesales (Pay-As-You-Go)**:
   - Sin planes de suscripción mensuales ni cuotas ficticias.
   - Manejo de **Saldo en Cuenta (COP $)** con módulo interactivo `FirmCreditsRechargeModal.tsx` para recargas inmediatas vía Wompi / PSE / Nequi / Tarjeta.

8. **🔑 Portal de Inicio de Sesión Multi-Tenant (`LoginPortalView.tsx`)**:
   - Autenticación limpia con resolución automática del rol y la firma según las credenciales del usuario.

9. **🤖 Pipeline de Inteligencia Artificial de 3 Motores (OpenRouter API)**:
   - ⚡ **Fase 1**: `google/gemini-3.6-flash` → Ingesta masiva y estructuración de hechos del expediente.
   - 🧠 **Fase 2**: `openai/gpt-5.6-sol` → Formulación dogmática, problemas jurídicos y excepciones.
   - ✍️ **Fase 3**: `anthropic/claude-opus-5` → Redacción solemne e íntegra de la providencia (120s timeout, sin límite de tokens).
   - **Estructura como Guía**: Las estructuras por tipo son una referencia flexible; Opus 5 decide la mejor estructura según su criterio jurídico.

10. **📋 10 Ramas del Derecho × 2 Roles = Cobertura Total**:
    - Constitucional, Laboral, Civil, Administrativo, Penal, Familia, Pequeñas Causas, Tributario, Societario, Internacional.
    - Cada rama tiene documentos específicos para Firma Litigante y para Juzgado/Despacho.

11. **🔄 Continuación y Corrección desde Borradores Guardados**:
    - Cargar un borrador guardado como base para que la IA continúe, corrija, amplíe o proyecte el documento.
    - Banner "Modo Continuación" en el panel izquierdo con placeholder e indicador visual.
    - Botón dinámico: "Generar Borrador" ↔ "Continuar / Corregir".

12. **📄 Visor de Documento (Vista Previa de Impresión)**:
    - El borrador generado se muestra en formato de hoja de papel con fuente Times New Roman.
    - Zoom (60%–150%), paginación, botón de impresión directa, toggle texto plano.

13. **🗖 Modo Pantalla Central (Editor Ampliado)**:
    - Expansión del lienzo al 100% de la pantalla para redacción libre de distracciones.

14. **📁 Bóveda de Borradores Guardados (`SavedDraftsModal.tsx`)**:
    - Persistencia local y en nube de borradores con fechas y metadatos.
    - Carga de borradores como base para continuación con IA.

15. **🎓 Enseñar Estilo (Aprendizaje de Formato)**:
    - Los usuarios pueden guardar el formato de un documento editado para que futuras generaciones lo sigan.

16. **📖 Glosario Jurídico Procesal de Colombia**:
    - Diccionario dogmático interactivo en tiempo real.

17. **🧮 Herramientas de Cálculo Procesal**:
    - Liquidación de intereses moratorios, prestaciones laborales, actualización de cánones e indemnizaciones.

18. **📄 Exportador Multi-Tenant Word (.docx) & PDF (.pdf)** con membrete dinámico de la firma.

---

## 🚀 Inicio Rápido en Desarrollo

```bash
# Servidor Backend
cd backend
npm run dev

# Servidor Frontend
cd frontend
npm run dev
```
