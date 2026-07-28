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

9. **🤖 Pipeline de Inteligencia Artificial de 3 Motores**:
   - ⚡ **Fase 1: Gemini 3.6 Flash**: Ingesta masiva y estructuración de hechos del expediente.
   - 🧠 **Fase 2: GPT-5.6 Sol**: Formulación dogmática, problemas jurídicos y excepciones.
   - ✍️ **Fase 3: Claude Opus 5**: Redacción solemne y formal del escrito procesal.

10. **🗖 Modo Pantalla Central (Editor Ampliado)**:
    - Expansión del lienzo al 100% de la pantalla para redacción libre de distracciones.

11. **📁 Bóveda de Borradores Guardados (`SavedDraftsModal.tsx`)**:
    - Persistencia local y en nube de borradores con fechas y metadatos.

12. **📖 Glosario Jurídico Procesal de Colombia**:
    - Diccionario dogmático interactivo en tiempo real.

13. **🧮 Herramientas de Cálculo Procesal**:
    - Liquidación de intereses moratorios, prestaciones laborales, actualización de cánones e indemnizaciones.

14. **📄 Exportador Multi-Tenant Word (.docx) & PDF (.pdf)** con membrete dinámico de la firma.

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
