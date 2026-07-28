# Iureon - Plataforma LegalTech & Ecosistema Judicial Colombia

> ⚖️ **Plataforma B2B Multi-Tenant de Inteligencia Artificial para Firmas de Abogados y Despachos Judiciales en Colombia**.

---

## 🌟 Arquitectura y Características Principales

1. **🔒 Entorno de Producción 100% Limpio (Sin Datos Ficticios / Zero Mock Data)**:
   - Toda firma cliente, usuario abogado o despacho judicial nacerá únicamente cuando se registre en el sistema.
   - Seguridad **Supabase Auth & Multi-Tenant RLS** (*Row Level Security*).

2. **💳 Modelo Económico de Recargas de Créditos Procesales (Pay-As-You-Go)**:
   - Sin planes de suscripción mensuales ni cuotas ficticias.
   - Manejo de **Saldo en Cuenta (COP $)** con módulo interactivo `FirmCreditsRechargeModal.tsx` para recargas inmediatas vía Wompi / PSE / Nequi / Tarjeta.

3. **👑 SuperUsuario Global & Acceso Total al Workspace**:
   - Cuenta de administración global (`ingdanielma@gmail.com`) con permisos completos.
   - Acceso total a la Redacción de Providencias y Demandas, Buscador RAG de Sentencias, Herramientas de Cálculo y Auditoría.

4. **⚠️ Modales de Advertencia y Confirmación Previa (`ActionConfirmationModal.tsx`)**:
   - Modal de seguridad que exige confirmación explícita antes de editar, eliminar o registrar datos sensibles de firmas o usuarios.

5. **🔑 Portal de Inicio de Sesión Multi-Tenant (`LoginPortalView.tsx`)**:
   - Autenticación limpia con resolución automática del rol y la firma según las credenciales del usuario.

6. **🤖 Pipeline de Inteligencia Artificial de 3 Motores**:
   - ⚡ **Fase 1: Gemini 3.6 Flash**: Ingesta masiva y estructuración de hechos del expediente.
   - 🧠 **Fase 2: GPT-5.6 Sol**: Formulación dogmática, problemas jurídicos y excepciones.
   - ✍️ **Fase 3: Claude Opus 5**: Redacción solemne y formal del escrito procesal.

7. **🗖 Modo Pantalla Central (Editor Ampliado)**:
   - Expansión del lienzo al 100% de la pantalla para redacción libre de distracciones.

8. **📁 Bóveda de Borradores Guardados (`SavedDraftsModal.tsx`)**:
   - Persistencia local y en nube de borradores con fechas y metadatos.

9. **📖 Glosario Jurídico Procesal de Colombia**:
   - Diccionario dogmático interactivo en tiempo real.

10. **🧮 Herramientas de Cálculo Procesal**:
    - Liquidación de intereses moratorios, prestaciones laborales, actualización de cánones e indemnizaciones.

11. **📄 Exportador Multi-Tenant Word (.docx) & PDF (.pdf)** con membrete dinámico de la firma.

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
