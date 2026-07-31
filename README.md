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
   - **Costo por borrador**: $2.000 COP por cada generación de documento con IA. Se descuenta automáticamente del saldo de la firma.
   - **Saldo en tiempo real**: El sidebar izquierdo muestra el saldo actual sin fallbacks ficticios.

8. **🔑 Portal de Inicio de Sesión Multi-Tenant (`LoginPortalView.tsx`)**:
   - Autenticación limpia con resolución automática del rol y la firma según las credenciales del usuario.

9. **🤖 Pipeline de Inteligencia Artificial de 3 Motores (OpenRouter API)**:
   - ⚡ **Fase 1 — Gemini 3.6 Flash** (max 1024 tokens): Extracción concisa de hechos, partes procesales y pretensiones. En modo continuación: identifica solo los cambios solicitados (max 768 tokens).
   - 🧠 **Fase 2 — GPT-5.6 Sol** (max 1536 tokens): Esquema dogmático procesal: problema jurídico, excepciones, normas clave y estrategia de sustentación. En modo continuación: solo esquema de correcciones (max 1024 tokens).
   - ✍️ **Fase 3 — Claude Opus 5** (sin límite de tokens, 120s timeout): Redacción solemne del documento jurídico completo. Recibe el esquema de GPT como guía estructural. En modo continuación: toma el borrador existente como base y aplica las correcciones.
   - **Eficiencia de tokens**: Cada motor gasta solo los tokens necesarios para su tarea específica. Gemini y GPT no redactan; Claude no extrae hechos.

10. **📋 10 Ramas del Derecho × 2 Roles = Cobertura Total**:
    - Constitucional, Laboral, Civil, Administrativo, Penal, Familia, Pequeñas Causas, Tributario, Societario, Internacional.
    - Cada rama tiene documentos específicos para Firma Litigante y para Juzgado/Despacho.

11. **🔄 Continuación y Corrección desde Borradores Guardados**:
    - Cargar un borrador guardado como base para que la IA continúe, corrija, amplíe o proyecte el documento.
    - Los 3 motores adaptan sus prompts al modo continuación (no reprocesaran desde cero).
    - Banner "Modo Continuación" en el panel izquierdo con placeholder e indicador visual.
    - Botón dinámico: "Generar Borrador" ↔ "Continuar / Corregir".

12. **💾 Persistencia de Borradores (Supabase + localStorage)**:
    - **API**: Tabla `saved_drafts` en Supabase con RLS multi-tenant por `firm_id`.
    - **Fallback**: localStorage con clave scoped `iureon_saved_drafts_{firmId}_{email}`.
    - **Migración automática**: Borradores de la clave global antigua se migran automáticamente al nuevo scope.
    - Actualizar borrador existente en vez de crear duplicados.
    - Botón "Mis Borradores Guardados" accesible desde la vista vacía del canvas.

13. **📄 Visor de Documento con Negritas Reales**:
    - **Vista Documento**: Renderiza `**texto**` como negritas reales HTML (sin asteriscos visibles).
    - **Modo Edición**: Toggle para editar el texto raw con asteriscos markdown.
    - **Visor PDF**: Renderiza negritas reales en la vista previa de impresión.
    - **Impresión**: Negritas reales en el documento impreso.
    - Zoom (60%–150%), paginación, toggle texto plano.

14. **📄 Exportación Word (.docx) & PDF (.pdf) con Negritas Reales**:
    - Parseo inteligente de `**texto**` → negritas reales en Word (TextRun bold) y PDF (font bold).
    - Limpieza automática de `##` headings y `---` separadores markdown.
    - Membrete dinámico de la firma cliente.

15. **🗖 Modo Pantalla Central (Editor Ampliado)**:
    - Expansión del lienzo al 100% de la pantalla para redacción libre de distracciones.

16. **🎓 Enseñar Estilo (Aprendizaje de Formato)**:
    - Los usuarios pueden guardar el formato de un documento editado para que futuras generaciones lo sigan.

17. **📖 Glosario Jurídico Procesal de Colombia**:
    - Diccionario dogmático interactivo en tiempo real.

18. **🧮 Herramientas de Cálculo Procesal**:
    - Liquidación de intereses moratorios, prestaciones laborales, actualización de cánones e indemnizaciones.

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
