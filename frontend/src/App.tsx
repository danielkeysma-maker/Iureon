import React, { useEffect, useMemo, useState } from 'react';
import { httpClient, setSessionLostHandler } from './config/httpClient';
import { billingApi } from './modules/billing/billing.api';
import { BalancePanel } from './modules/billing/components/BalancePanel';
import { clearSession, readSession, saveSession, type Session } from './modules/auth/session';
import { sesionDeVistaPreviaLocal } from './modules/auth/vistaPreviaLocal';
import { SidebarLeft } from './modules/tenant/components/SidebarLeft';
import { MobileTabBar } from './modules/tenant/components/MobileTabBar';
import { MobileHeader } from './modules/tenant/components/MobileHeader';
import { MobileWorkshopTabs, type VistaTaller } from './modules/workspace/components/MobileWorkshopTabs';
import { WorkshopConfigMobile } from './modules/workspace/components/WorkshopConfigMobile';
import { MobileMoreSheet } from './modules/tenant/components/MobileMoreSheet';
import { SupportAccessBanner } from './modules/support/components/SupportAccessBanner';
import { SupportAccessDecisionDialog } from './modules/support/components/SupportAccessDecisionDialog';
import type { SupportAccess } from './modules/support/support.api';
import { HeaderTop } from './modules/tenant/components/HeaderTop';
import type { LawFirmTenant } from './modules/tenant/types';
import { TenantProvider } from './modules/tenant/TenantContext';
import { AgentPanelLeft } from './modules/workspace/components/AgentPanelLeft';
import { DocumentCanvasRight } from './modules/workspace/components/DocumentCanvasRight';
import { SearchView } from './modules/search/components/SearchView';
import { TranscriptionView } from './modules/transcription/components/TranscriptionView';
import { InterviewView } from './modules/clients/components/InterviewView';
import { InterviewMobileView } from './modules/clients/components/InterviewMobileView';
import { CatalogCurationView } from './modules/catalog/components/CatalogCurationView';
import { CatalogMobileView } from './modules/catalog/components/CatalogMobileView';
import { TriageMobileView } from './modules/catalog/components/TriageMobileView';
import { ToolsView } from './modules/tools/components/ToolsView';
import { AuditView } from './modules/audit/components/AuditView';
import { SubprocessorsView } from './modules/privacy/components/SubprocessorsView';
import { ManualView } from './modules/help/components/ManualView';
import { ManualMobileView } from './modules/help/components/ManualMobileView';
import { SupportView } from './modules/help/components/SupportView';
import { SupportMobileView } from './modules/help/components/SupportMobileView';
import { TriageView } from './modules/catalog/components/TriageView';
import { SettingsView } from './modules/settings/components/SettingsView';
import { WorkshopConfigBar } from './modules/workspace/components/WorkshopConfigBar';
import type { ActuacionRole } from './modules/catalog/types';
import { FirmBrandingModal } from './modules/tenant/components/FirmBrandingModal';
import { brandingApi, formatoComoInstruccion, setMarcaActual, type FirmBranding } from './modules/tenant/services/branding.api';
import { FirmSubscriptionModal } from './modules/subscriptions/components/FirmSubscriptionModal';
import type { FirmSubscriptionInfo } from './modules/subscriptions/types';
import { DEFAULT_FIRM_BRANDING, DocumentExportService } from './modules/documents/services/documentExport.service';
import type { FirmBrandingConfig } from './modules/documents/services/documentExport.service';
import { useLegalAgentWorkflow } from './modules/workspace/hooks/useLegalAgentWorkflow';

import { SavedDraftsModal } from './modules/documents/components/SavedDraftsModal';
import { SavedDraftsView } from './modules/documents/components/SavedDraftsView';
import { SavedDraftsMobileView } from './modules/documents/components/SavedDraftsMobileView';
import type { SavedDraftEntry } from './modules/documents/types';
import { useSavedDrafts } from './modules/documents/hooks/useSavedDrafts';

import { OperatorConsoleDialog } from './modules/admin/components/OperatorConsoleDialog';
import { FirmUsersDialog } from './modules/tenant/components/FirmUsersDialog';
import { LoginPortalView } from './modules/tenant/components/LoginPortalView';
import type { MainView } from './modules/tenant/types';
import { NAV_MODULES } from './modules/tenant/navigation';

/**
 * Los módulos que la aplicación puede mostrar, para validar el que quedó
 * guardado. SE DERIVA DEL REGISTRO, no se escribe a mano.
 *
 * Era una lista literal y ya se había desincronizado: tenía once de los trece
 * módulos: faltaban `borradores` y `ajustes`. Como esta lista es la que decide
 * si se restaura el módulo guardado en `sessionStorage`, quien recargaba la
 * página estando en Borradores o en Ajustes era devuelto en silencio al taller
 * de redacción — y recargar es justo el reflejo de alguien a quien la pantalla
 * le falló.
 *
 * Derivarla de `NAV_MODULES` hace imposible que vuelva a pasar: un módulo nuevo
 * entra al registro para poder pintarse en la barra lateral, así que ya no hay
 * un segundo sitio del que alguien pueda olvidarse.
 */
const MAIN_VIEWS: MainView[] = NAV_MODULES.map((m) => m.id);


const EMPTY_FIRM_PLACEHOLDER: LawFirmTenant = {
  id: '',
  name: 'Sin Firma Registrada',
  nit: 'REGISTRA TU FIRMA',
  creditsBalance: 0,
  status: 'active'
};

/**
 * The firm as the session reports it, before the registry row is fetched.
 *
 * Enough to render the shell without waiting on a round trip, and honest about
 * what it does not know yet: the name and NIT arrive from /api/auth/me.
 */
const firmFromSession = (session: { user: { firmId: string } } | null): LawFirmTenant =>
  session
    ? { id: session.user.firmId, name: 'Cargando…', nit: '', creditsBalance: 0, status: 'active' }
    : EMPTY_FIRM_PLACEHOLDER;

export function App() {
  /*
   * THE SESSION IS THE SOURCE OF TRUTH, AND IT IS SIGNED.
   *
   * Authentication used to be the string "true" in localStorage, and the firm
   * an object the registration form wrote next to it. Both were the browser's
   * to edit, and the server believed the firm it was told — so reading another
   * firm's hearings needed nothing but their id. The firms were never persisted
   * either: the registry table was empty and clearing site data destroyed the
   * tenant while its transcripts stayed in the database, unreachable.
   *
   * Now the browser holds a token it cannot forge. Everything below reads the
   * firm out of it.
   */
  /*
   * `?vista=1` en desarrollo entra sin credenciales para MIRAR EL DISEÑO. Vite
   * sustituye `import.meta.env.DEV` por `false` al compilar, asi que en el
   * paquete publicado esa rama no existe. Ver `vistaPreviaLocal.ts`.
   */
  const [session, setSession] = useState(() => sesionDeVistaPreviaLocal() ?? readSession());
  const isAuthenticated = Boolean(session);
  const currentUserEmail = session?.user.email ?? '';
  /*
   * Quien opera la plataforma se decide por el ROL que impone el servidor,
   * no por un correo escrito aqui. Esta comprobacion es solo de interfaz:
   * el backend vuelve a imponer el rol en cada endpoint, asi que editar el
   * bundle no concede ningun poder — solo cambia lo que se pinta.
   */
  const esSuperusuario = session?.user.role === 'SUPER_ADMIN';
  const esSocio = session?.user.role === 'FIRM_ADMIN';
  /*
   * La solicitud que el socio esta leyendo. La guarda `App` y no la franja
   * porque el dialogo tiene que sobrevivir a que la franja cambie de estado:
   * al autorizar, la solicitud deja de estar pendiente y la franja se repinta,
   * y un dialogo montado dentro de ella desapareceria a media transicion.
   */
  const [solicitudAbierta, setSolicitudAbierta] = useState<SupportAccess | null>(null);
  const [masAbierto, setMasAbierto] = useState(false);

  /*
   * EL TALLER PARTIDO EN MOVIL (4d). En escritorio los dos paneles conviven;
   * en 390px conviven mal —el de instruccion ya ocupa `w-full`, asi que el
   * lienzo se quedaba sin ancho—. Aqui se elige cual de los dos se ve, y esta
   * decision NO afecta al escritorio: las clases son `hidden lg:flex`.
   */
  const [vistaTaller, setVistaTaller] = useState<VistaTaller>('instruccion');

  /*
   * De una sugerencia al taller, con los hechos ya escritos. LO USAN LAS DOS
   * ORIENTACIONES —la de escritorio y la de movil— y por eso vive aqui: dos
   * copias de esta funcion se desincronizarian el dia que cambie que se lleva
   * al taller, y el sintoma seria que en el telefono el escrito sale sin los
   * hechos. El nombre viaja TAL CUAL vino del catalogo: es el contrato con el
   * motor de redaccion.
   *
   * VACIO SIGNIFICA «NO LO SE», Y SE RESPETA. La salida «Redactar sin catalogo»
   * del 1f' llega sin nombre ni rama porque el catalogo no reconocio nada;
   * pisar la rama con una cadena vacia dejaria el selector sin valor y la lista
   * de actuaciones sin poder cargarse. Se conserva la que haya.
   */
  const irARedactar = (nombre: string, rama: string, hechos: string) => {
    if (rama) workflow.setLegalBranch(rama);
    workflow.setDocumentType(nombre);
    if (hechos) workflow.setLegalPrompt(hechos);
    setMainView('workspace');
  };
  const [refrescoSoporte, setRefrescoSoporte] = useState(0);

  /*
   * The module survives a RELOAD, and only a reload.
   *
   * Refreshing while reading a two-hour transcript used to throw the lawyer back
   * to the drafting workspace — the one screen they were not looking at — and a
   * reload is exactly what somebody does when a page misbehaves, so the app
   * punished the reflex it had provoked.
   *
   * But opening the application afresh should open it at the beginning. Those
   * are different intentions and `sessionStorage` is exactly the line between
   * them: it belongs to the tab, so it survives F5 and is empty in a new tab or
   * after the browser is closed. `localStorage` cannot tell the two apart —
   * it would have carried yesterday's module into tomorrow's first visit.
   *
   * The stored value is checked against the modules that exist, because a
   * renamed one would otherwise render an empty shell with no way back.
   */
  const [mainView, setMainViewState] = useState<MainView>(() => {
    try {
      // Left behind by the first version of this, which used localStorage and
      // therefore followed the user into every new tab.
      localStorage.removeItem('iureon_main_view');

      const guardado = sessionStorage.getItem('iureon_main_view');
      return guardado && MAIN_VIEWS.includes(guardado as MainView)
        ? (guardado as MainView)
        : 'workspace';
    } catch {
      return 'workspace';
    }
  });

  /*
   * The manual article Soporte handed over, so the reader lands on the answer
   * instead of on the index and a second search.
   */
  const [manualArticulo, setManualArticulo] = useState<string | undefined>(undefined);

  const setMainView = (view: MainView): void => {
    setMainViewState(view);
    try {
      sessionStorage.setItem('iureon_main_view', view);
    } catch {
      /* The module still changes for this session; only the memory is lost. */
    }
  };

  /*
   * The firm's registry row, and the way back to the login screen.
   *
   * A refresh token can be spent or revoked between visits, and the screens
   * below are all tenant-scoped: without this the app would render a full
   * workspace whose every button answers 401. The handler lives in httpClient
   * so any call can trigger the return, not just this one.
   */
  useEffect(() => {
    setSessionLostHandler(() => {
      setSession(null);
      setActiveFirm(EMPTY_FIRM_PLACEHOLDER);
    });

    return () => setSessionLostHandler(null);
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    httpClient
      .get<{ firm: { id: string; name: string; nit: string; creditsBalance: number } | null }>(
        '/api/auth/me'
      )
      .then(({ firm }) => {
        if (cancelled || !firm) return;
        setActiveFirm({
          id: firm.id,
          name: firm.name,
          nit: firm.nit ?? '',
          creditsBalance: firm.creditsBalance ?? 0,
          status: 'active'
        });
      })
      .catch(() => {
        /* httpClient already returns to login on a rejected session. */
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const [activeFirm, setActiveFirm] = useState<LawFirmTenant>(() => firmFromSession(readSession()));
  const registeredFirms = useMemo(() => (session ? [activeFirm] : []), [session, activeFirm]);
  const [isFirmDropdownOpen, setIsFirmDropdownOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  const [isSavedDraftsModalOpen, setIsSavedDraftsModalOpen] = useState(false);

  const [firmBranding, setFirmBranding] = useState<FirmBrandingConfig>(DEFAULT_FIRM_BRANDING);
  /*
   * La marca DE LA FIRMA, del servidor. Vivia solo en el estado de React: se
   * perdia al recargar y cada abogado veia una marca distinta. Se carga al
   * autenticar y el modal la guarda en la firma para todos.
   */
  const [marcaDeFirma, setMarcaDeFirma] = useState<FirmBranding | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    brandingApi
      .get()
      .then(({ branding, configurada }) => {
        if (configurada) aplicarMarca(branding);
      })
      .catch(() => {
        /* Sin marca guardada se exporta con el formato por defecto: nada se rompe. */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /* La marca nueva alimenta a la vieja estructura de exportacion sin romperla. */
  const aplicarMarca = (b: FirmBranding) => {
    setMarcaDeFirma(b);
    setMarcaActual(b);
    setFirmBranding((prev) => ({
      ...prev,
      firmName: b.firmName || prev.firmName,
      firmNit: b.firmNit || prev.firmNit,
      firmAddress: b.firmAddress || prev.firmAddress,
      firmPhone: b.firmPhone || prev.firmPhone,
      firmEmail: b.firmEmail || prev.firmEmail,
      fontFamily: b.fontFamily as FirmBrandingConfig['fontFamily'],
      logoUrl: b.logoUrl ?? undefined,
      // El documento exportado obedece a la marca: tamano e interlineado ya no
      // estan quemados en el servicio de exportacion.
      fontSizePt: b.fontSizePt,
      lineSpacing: b.lineSpacing
    }));
  };
  const workflow = useLegalAgentWorkflow(marcaDeFirma ? formatoComoInstruccion(marcaDeFirma) : undefined);

  /*
   * Quién firma el escrito.
   *
   * Vive aquí y no dentro del panel porque la barra de configuración abarca el
   * ancho completo —sobre el panel Y sobre el documento— y el panel necesita el
   * mismo valor para el verbo del botón y para seguir a la actuación elegida.
   */
  const [userRole, setUserRole] = useState<ActuacionRole>('LITIGANTE');

  /*
   * A firm is created from the OPERATOR CONSOLE, which issues its first account
   * at the same time. Self-registration was removed: it let anyone open a tenant
   * and use the product without becoming a client. Three handlers here used to
   * create, edit and delete tenants IN LOCALSTORAGE, which is why the registry
   * table stayed empty and why a firm vanished with the browser.
   *
   * The last of the three —the local edit— went with the obsolete shell that
   * was its only caller. It never persisted anything, so keeping it would have
   * meant showing an edit that the next reload undoes. Editing a firm returns
   * when there is an endpoint that writes it.
   */

  /*
   * THE DEDUCTION IS THE SERVER'S, AND IT USED TO BE A LIE HERE.
   *
   * This subtracted a constant from React state after every draft and called
   * `handleUpdateFirm`, which only sets local state — so the balance on screen
   * drifted from the database on the first reload, and a firm at zero could
   * draft for ever. The charge now happens where the money is actually spent:
   * the drafting endpoint refuses before calling any model if the balance is
   * short, and debits atomically once the document exists.
   *
   * What is left here is reading back what the server decided.
   *
   * ABOVE THE EARLY RETURN, AND THAT IS NOT A STYLE CHOICE. These two hooks sat
   * below `if (!isAuthenticated) return <LoginPortalView/>`, so a logged-out
   * render ran two hooks fewer than a logged-in one. React counts hooks by
   * position: the render right after a successful login asks for two that were
   * never there, which is the "Rendered more hooks than during the previous
   * render" crash — on the first screen after signing in. Hoisted here they run
   * on every render, and the `!session` guard inside makes the logged-out case
   * a no-op instead of a request.
   */
  const refreshBalance = React.useCallback(async () => {
    if (!session) return;

    try {
      const { summary } = await billingApi.summary();
      setActiveFirm((actual) => ({ ...actual, creditsBalance: summary.balance }));
    } catch {
      /* The balance simply does not update; it is never invented. */
    }
  }, [session]);

  // Read on entry, and again after every operation that spends: the balance is
  // reported, never derived.
  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  // ═══ Clave de localStorage scoped por firma+usuario ═══
  const {
    savedDrafts,
    loadedDraftId,
    setLoadedDraftId,
    saveDraft,
    deleteDraft,
    updateMetadata
  } = useSavedDrafts(activeFirm.id, currentUserEmail, isAuthenticated);

  /*
   * «El documento generado se abre despues como pantalla propia» (4d). Salta al
   * aparecer un borrador, no en cada render: la dependencia es el TITULO y no
   * el objeto, porque el objeto se recrea al editar el texto y devolveria al
   * abogado al documento cada vez que corrige la instruccion.
   */
  const tituloGenerado = workflow.generatedDraft?.title ?? null;
  useEffect(() => {
    if (tituloGenerado) setVistaTaller('documento');
  }, [tituloGenerado]);

  const handleSaveDraft = async (updatedText: string) => {
    if (!workflow.generatedDraft) return;
    alert(await saveDraft({ ...workflow.generatedDraft, legalText: updatedText }));
  };

  // ═══ Cargar borrador para edición ═══
  const handleLoadDraft = (entry: SavedDraftEntry) => {
    workflow.setGeneratedDraft(entry.draft);
    workflow.setActiveDraftText(entry.draft.legalText);
    /*
     * LA RAMA VIAJA CON EL TIPO, y antes no lo hacía.
     *
     * Se restauraba solo `documentType` y la rama se quedaba en la que hubiera
     * elegida, así que un borrador de familia abierto con la rama en civil
     * emparejaba su actuación con una rama donde no existe: la barra lo
     * declaraba sin catalogar y continuar el borrador lo redactaba sin norma
     * verificada. La fila ya traía `legalBranch` desde el servidor.
     */
    if (entry.legalBranch) workflow.setLegalBranch(entry.legalBranch);
    workflow.setDocumentType(entry.draft.documentType);
    workflow.setRightView('draft');
    setLoadedDraftId(entry.id);
    setIsSavedDraftsModalOpen(false);
  };

  /*
   * Las opciones vienen de la barra superior, donde se deciden por escrito.
   * `conFuentes` se traduce aqui a la lista real: el header decide SI se anexa,
   * y este es quien tiene el borrador con la jurisprudencia citada.
   */
  const opcionesDeExportacion = (opts?: { conMembrete: boolean; conFuentes: boolean }) => ({
    conMembrete: opts?.conMembrete ?? true,
    fuentes:
      opts?.conFuentes && workflow.generatedDraft?.jurisprudenciaCitada.length
        ? workflow.generatedDraft.jurisprudenciaCitada
        : undefined
  });

  const handleExportWord = (opts?: { conMembrete: boolean; conFuentes: boolean }) => {
    if (workflow.generatedDraft) {
      DocumentExportService.exportToWordDocx(
        workflow.generatedDraft.title,
        workflow.generatedDraft.legalText,
        firmBranding,
        opcionesDeExportacion(opts)
      );
    }
  };

  const handleExportPdf = (opts?: { conMembrete: boolean; conFuentes: boolean }) => {
    if (workflow.generatedDraft) {
      DocumentExportService.exportToPdf(
        workflow.generatedDraft.title,
        workflow.generatedDraft.legalText,
        firmBranding,
        opcionesDeExportacion(opts)
      );
    }
  };

  /* El borrador guardado que esta abierto en el panel, si hay uno. */
  const borradorAbierto = savedDrafts.find((d) => d.id === loadedDraftId) ?? null;

  const sampleSubscriptionInfo: FirmSubscriptionInfo = {
    firmName: activeFirm.name,
    planTier: 'SALDO_RECARGA' as any,
    subscriptionStatus: 'active',
    monthlyTokensUsed: 1420500,
    monthlyTokensLimit: 5000000,
    activeUsersCount: 1,
    maxUsersAllowed: 10,
    renewalDate: '2026-08-20',
    usersList: [
      { id: 'usr-001', name: 'Administrador de Firma', email: currentUserEmail, role: 'SOCIO_ADMIN', status: 'active' }
    ]
  };

  const handleLoginSuccess = (fresh: Session) => {
    setSession(saveSession(fresh));
    setActiveFirm(firmFromSession(fresh));
  };

  if (!isAuthenticated) {
    return <LoginPortalView onLoginSuccess={handleLoginSuccess} />;
  }

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setActiveFirm(EMPTY_FIRM_PLACEHOLDER);
  };

  /*
   * The recharge modal is gone, and it had to be.
   *
   * It waited 800ms on a setTimeout and then announced "Recarga de $500.000 COP
   * acreditada exitosamente" — no payment, no server call, no money. Every other
   * invention removed from this codebase was a fabricated fact; that one was a
   * fabricated receipt, shown to the person paying.
   *
   * Credit is added by the operator once a payment is confirmed, and the panel
   * that replaces this says so. Automating it needs a Colombian payment gateway,
   * which needs merchant credentials nobody can invent either.
   */

  return (
    <TenantProvider activeFirm={activeFirm} currentUserEmail={currentUserEmail}>
    {/*
      LA FRANJA DE SOPORTE CRUZA TODA LA APLICACION, y por eso la raiz pasa a
      ser una columna: dentro del contenedor horizontal quedaria a un lado del
      menu o encima del area de trabajo, y el artboard pide una banda que nadie
      pueda dejar fuera de su campo de vision. Empuja el contenido en vez de
      flotar sobre el — lo que tapa se aprende a ignorar.
    */}
    {/*
      ALTURA: `h-screen` ES 100vh, Y EN UN TELEFONO 100vh NO ES LA PANTALLA.
      Los navegadores moviles miden 100vh contra la ventana SIN la barra de
      direcciones, asi que la aplicacion queda mas alta que el area visible y
      todo lo anclado abajo —la barra de navegacion— cae fuera de la pantalla.
      Ese es el defecto que se reporto como «no se ve ningun menu»: la barra
      existia, se pintaba, y estaba debajo del borde inferior.

      `100dvh` mide el viewport DINAMICO, el que de verdad se ve en cada momento.

      Y VA SOLO, SIN `h-screen` DE RESPALDO. Se intento dejar los dos y se midio
      el CSS compilado: Tailwind emite `.h-screen` DESPUES de `.h-[100dvh]`, asi
      que el respaldo ganaba la cascada y anulaba el arreglo — el orden dentro
      del atributo no decide nada. Un respaldo que pisa a lo que respalda es
      peor que ninguno, porque parece que el defecto sigue sin causa.
    */}
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100 font-sans">
      {isAuthenticated && (
        <SupportAccessBanner
          key={refrescoSoporte}
          puedeDecidir={Boolean(esSocio)}
          onAbrirSolicitud={setSolicitudAbierta}
        />
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <FirmBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        onSaved={aplicarMarca}
      />
      <FirmSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        info={sampleSubscriptionInfo}
      />
      {/*
        `procesoActual` sale del borrador abierto en el panel, no de un campo
        que el abogado tenga que llenar. Con un escrito nuevo sin guardar
        todavía no hay proceso, y el filtro «Este proceso» no se ofrece — en
        vez de abrirse sobre una lista vacía sin explicación.
      */}
      <SavedDraftsModal
        isOpen={isSavedDraftsModalOpen}
        onClose={() => setIsSavedDraftsModalOpen(false)}
        savedDrafts={savedDrafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={deleteDraft}
        userEmail={currentUserEmail}
        procesoActual={savedDrafts.find((d) => d.id === loadedDraftId)?.cliente ?? null}
      />
      <BalancePanel
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        firmNit={activeFirm.nit}
        firmName={activeFirm.name}
      />

      {/*
        Dos gestiones distintas, y quien las separa es EL ROL DE LA SESION, no
        un correo escrito en el bundle. El SOCIO administra SU firma (6c:
        usuarios reales de Supabase Auth, consumo del mes, roles con imposicion
        en el servidor). El SUPERUSUARIO recibe la consola de operacion (7a:
        las firmas de la plataforma, sus planes y sus saldos), que antes vivia
        escondida como una pestana dentro de un cascaron obsoleto.
      */}
      {esSuperusuario ? (
        <OperatorConsoleDialog
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
        />
      ) : (
        <FirmUsersDialog
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
          firmName={activeFirm.name}
          firmNit={activeFirm.nit}
        />
      )}

      {/* ENTERPRISE LEFT SIDEBAR — hidden in focus mode so the editor owns the screen */}
      {/*
        LA BARRA LATERAL ES DE ESCRITORIO. En 390px, 224px de menu se comen mas
        de la mitad del ancho, asi que bajo `lg` desaparece y la navegacion pasa
        a la barra inferior — cuatro destinos y «Mas», segun 4d. No se encoge:
        se reemplaza. `hidden lg:flex` y no `lg:block` porque el <aside> es un
        contenedor flex en columna; con `block` sus hijos perderian la columna.
      */}
      {!workflow.isFocusMode && (
      <div className="hidden lg:flex">
      <SidebarLeft
        mainView={mainView}
        setMainView={setMainView}
        activeFirm={activeFirm}
        setActiveFirm={setActiveFirm}
        sampleFirms={registeredFirms}
        isFirmDropdownOpen={isFirmDropdownOpen}
        setIsFirmDropdownOpen={setIsFirmDropdownOpen}
        onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        onOpenRechargeModal={() => setIsRechargeModalOpen(true)}
        isSuperUser={esSuperusuario}
      />
      </div>
      )}

      {/* RIGHT MAIN WORKSPACE AREA */}
      {/*
        `min-w-0` NO ES DECORACION: es lo que impide que esta columna herede el
        ancho de su contenido. Un item flex tiene `min-width: auto` por defecto,
        asi que se niega a bajar del ancho minimo de sus hijos — la cabecera y
        la barra de configuracion del taller piden 533px, y la columna se hacia
        de 533 dentro de una pantalla de 375. La pagina NO desbordaba
        (`scrollWidth` seguia en 375): el `overflow-hidden` de la raiz cortaba
        los 158px sobrantes, y eso es lo que se veia como «se corta».
        Medido en el navegador a 375x812, no deducido.
      */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden h-full">
        {/*
          DOS CABECERAS, UNA POR TAMAÑO. La de escritorio pone el titulo del
          escrito y ocho acciones en fila; 4d pone el NOMBRE DEL MODULO con el
          caso debajo y un solo boton de menu, porque en el telefono no hay
          barra lateral que diga donde esta uno. Sus acciones viven en una hoja,
          que ademas cierra la regresion del desplegable recortado.
        */}
        <MobileHeader
          mainView={mainView}
          /*
            EL SUBTITULO ES EL CONTEXTO DE CADA MODULO, como en 4d: «Mosquera
            vs. Colpensiones» bajo Redactar, «4 actuaciones posibles» bajo
            Orientacion. Lo que la pantalla ya no repite abajo.
          */
          subtitulo={
            mainView === 'workspace'
              ? workflow.generatedDraft?.title || borradorAbierto?.cliente || workflow.documentType
              : mainView === 'borradores'
              ? `${savedDrafts.length} ${savedDrafts.length === 1 ? 'escrito' : 'escritos'}`
              : null
          }
          enTaller={mainView === 'workspace'}
          copied={workflow.copied}
          onCopyText={workflow.handleCopyText}
          onExportWord={handleExportWord}
          onExportPdf={handleExportPdf}
          estadoDelBorrador={borradorAbierto?.estado ?? null}
          onMarcarListo={
            borradorAbierto
              ? () => void updateMetadata(borradorAbierto.id, { estado: 'LISTO' })
              : undefined
          }
          onAbrirGestion={() => setIsUserManagementModalOpen(true)}
          onLogout={handleLogout}
        />

        <div className="hidden lg:block">
        <HeaderTop
          mainView={mainView}
          // El nombre del escrito, no una miga de pan. Sin borrador todavía se
          // muestra el tipo de actuación: es lo que alguien necesita al volver a
          // una pestaña abierta desde ayer.
          tituloDelEscrito={workflow.generatedDraft?.title || workflow.documentType}
          rightView={workflow.rightView}
          setRightView={workflow.setRightView}
          copied={workflow.copied}
          onCopyText={workflow.handleCopyText}
          onExportWord={handleExportWord}
          onExportPdf={handleExportPdf}
          hayFuentes={(workflow.generatedDraft?.jurisprudenciaCitada.length ?? 0) > 0}
          estadoDelBorrador={borradorAbierto?.estado ?? null}
          onMarcarListo={
            borradorAbierto
              ? () => void updateMetadata(borradorAbierto.id, { estado: 'LISTO' })
              : undefined
          }
          isFocusMode={workflow.isFocusMode}
          onToggleFocusMode={() => workflow.setIsFocusMode(!workflow.isFocusMode)}
          onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
          onLogout={handleLogout}
        />
        </div>

        <main className="flex min-w-0 flex-1 overflow-hidden">
          {mainView === 'workspace' && (
            /*
              LA BARRA ABARCA EL ANCHO COMPLETO, sobre el panel y sobre el
              documento. Estaba metida dentro del panel izquierdo, así que su
              contenedor se llevaba todo el ancho disponible y dejaba el lienzo
              del documento reducido a una franja en blanco.
            */
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {/*
                DOS BARRAS DE CONFIGURACION, UNA POR TAMAÑO. La de escritorio son
                tres selectores en fila; en 375px quedaban en «Fi… > … > El…» y
                configurar dejaba de ser posible sin adivinar. 4d comprime la
                configuracion en dos chips y pone en su lugar LA CONSECUENCIA:
                la actuacion elegida con su termino, que es lo unico que hay que
                poder leer antes de escribir.
              */}
              <div className="hidden lg:block">
                <WorkshopConfigBar
                  userRole={userRole}
                  setUserRole={setUserRole}
                  legalBranch={workflow.legalBranch}
                  setLegalBranch={workflow.setLegalBranch}
                  documentType={workflow.documentType}
                  setDocumentType={workflow.setDocumentType}
                />
              </div>
              <div className="lg:hidden">
                <WorkshopConfigMobile
                  userRole={userRole}
                  setUserRole={setUserRole}
                  legalBranch={workflow.legalBranch}
                  setLegalBranch={workflow.setLegalBranch}
                  documentType={workflow.documentType}
                  setDocumentType={workflow.setDocumentType}
                />
              </div>

              {!workflow.isFocusMode && (
                <MobileWorkshopTabs
                  vista={vistaTaller}
                  onCambiar={setVistaTaller}
                  hayBorrador={Boolean(workflow.generatedDraft)}
                />
              )}

              <div className="flex min-h-0 min-w-0 flex-1">
              {!workflow.isFocusMode && (
                <AgentPanelLeft
                  ocultoEnMovil={vistaTaller !== 'instruccion'}
                  userRole={userRole}
                  setUserRole={setUserRole}
                  documentType={workflow.documentType}
                  legalBranch={workflow.legalBranch}
                  legalPrompt={workflow.legalPrompt}
                  setLegalPrompt={workflow.setLegalPrompt}
                  isProcessing={workflow.isProcessing}
                  handleSendPrompt={async (e) => {
                    await workflow.handleSendPrompt(e);
                    void refreshBalance();
                    setLoadedDraftId(null);
                  }}
                  logs={workflow.logs}
                  activeDraftText={workflow.activeDraftText}
                  onClearActiveDraft={() => workflow.setActiveDraftText(null)}
                />
              )}

              <DocumentCanvasRight
                ocultoEnMovil={!workflow.isFocusMode && vistaTaller !== 'documento'}
                documentType={workflow.documentType}
                legalBranch={workflow.legalBranch}
                rightView={workflow.rightView}
                setRightView={workflow.setRightView}
                generatedDraft={workflow.generatedDraft}
                                copied={workflow.copied}
                onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
                onCopyText={workflow.handleCopyText}
                onExportWord={handleExportWord}
                onExportPdf={handleExportPdf}
                isFocusMode={workflow.isFocusMode}
                onToggleFocusMode={() => workflow.setIsFocusMode(!workflow.isFocusMode)}
                onSaveDraft={handleSaveDraft}
                onOpenSavedDraftsModal={() => setIsSavedDraftsModalOpen(true)}
              />
              </div>
            </div>
          )}

          {/*
            10c es otra pantalla, no la tabla estrechada: sus cinco columnas
            suman mas de 500px y en 375 quedan cinco datos sueltos sin rotulo.
            La movil pone el termino y cuanto falta arriba a la derecha —lo que
            decide si hay que abrir el escrito ahora— y baja version y estado a
            una linea gris. El agrupamiento y el calculo de dias son COMPARTIDOS
            (`draftTerms`): la forma cambia, el reloj no.
          */}
          {mainView === 'borradores' && (
            <div className="flex min-h-0 flex-1 lg:hidden">
              <SavedDraftsMobileView
                savedDrafts={savedDrafts}
                onAbrir={(entrada) => {
                  handleLoadDraft(entrada);
                  setMainView('workspace');
                }}
                onRedactar={() => setMainView('workspace')}
              />
            </div>
          )}

          {mainView === 'borradores' && (
            <div className="hidden min-h-0 flex-1 lg:flex">
            <SavedDraftsView
              savedDrafts={savedDrafts}
              onAbrir={(entrada) => {
                handleLoadDraft(entrada);
                setMainView('workspace');
              }}
              onEliminar={deleteDraft}
              onDuplicar={(entrada) => {
                /*
                  Duplicar es la unica forma de continuar a partir de un escrito
                  radicado: el original queda intacto en el expediente y la copia
                  nace como borrador nuevo. Va sin `id`, asi que el panel la
                  guardara como otro escrito y no sobre el sellado.
                */
                handleLoadDraft({
                  ...entrada,
                  id: '',
                  estado: 'BORRADOR',
                  radicadoEl: null,
                  radicado: null,
                  version: 1,
                  draft: { ...entrada.draft, title: `${entrada.draft.title} (copia)` }
                });
                setMainView('workspace');
              }}
              onGuardarDatos={updateMetadata}
              onRedactar={() => setMainView('workspace')}
            />
            </div>
          )}

          {mainView === 'audiencias' && (
            <TranscriptionView
              kind="AUDIENCIA"
              /*
                La transcripcion viaja como HECHOS al panel de redaccion — el
                mismo camino que ya recorren los hechos de Orientacion. Lo dicho
                en audiencia es el material del proximo escrito.
              */
              onUsarEnRedaccion={(texto) => {
                workflow.setLegalPrompt(texto);
                setMainView('workspace');
              }}
            />
          )}
          {/*
            EL MODULO QUE MAS GANA EN MOVIL, y lo dice el artboard: «el telefono
            es la grabadora real». Una audiencia llega como archivo de 50 MB que
            alguien sube despues; una entrevista ocurre con el cliente enfrente,
            y el aparato sobre la mesa es este. Por eso el cronometro es el
            elemento mas grande y por eso se avisa que sigue grabando con la
            pantalla apagada. La grabadora y el consentimiento son COMPARTIDOS.
          */}
          {mainView === 'entrevistas' && (
            <div className="flex min-h-0 flex-1 lg:hidden">
              <InterviewMobileView />
            </div>
          )}

          {mainView === 'entrevistas' && (
            <div className="hidden min-h-0 flex-1 lg:flex">
            <InterviewView
              /*
               * De escuchar a escribir sin volver a teclear.
               *
               * Los hechos ya están dichos y transcritos. Solo viaja lo que
               * NARRÓ la persona: mandar la entrevista completa haría que el
               * extractor trabajara sobre las preguntas del abogado.
               *
               * No se toca el tipo de documento: cuál es la actuación sigue
               * siendo decisión del abogado, y suponerla por él sería
               * calificar el caso desde una transcripción.
               */
              onDraft={(hechos) => {
                workflow.setLegalPrompt(hechos);
                setMainView('workspace');
              }}
            />
            </div>
          )}
          {mainView === 'search' && <SearchView />}
          {/*
            DOS PANTALLAS DISTINTAS, NO UNA RESPONSIVA. Claude Design penso el
            catalogo movil (5c) desde cero: la tarjeta lleva el termino en
            grande y el articulo debajo, porque en el telefono no existe el
            panel lateral donde el escritorio los muestra. Encoger la 1i habria
            dado una lista de nombres sin plazo — lo contrario de lo que se
            viene a consultar.
          */}
          {mainView === 'catalogo' && (
            <>
              <div className="hidden min-h-0 flex-1 lg:flex">
                <CatalogCurationView />
              </div>
              <div className="flex min-h-0 flex-1 lg:hidden">
                <CatalogMobileView />
              </div>
            </>
          )}
          {mainView === 'tools' && <ToolsView />}
          {mainView === 'audit' && <AuditView />}
          {mainView === 'privacidad' && <SubprocessorsView />}
          {/*
            9d rehace el manual para el telefono: indice agrupado con filete,
            tarjeta por articulo con su numero y sus minutos, y el articulo como
            pantalla propia. Los BLOQUES los pinta el mismo `Bloque` de la vista
            grande — un manual que en el telefono pierda sus pasos numerados
            seria el mismo texto diciendo dos cosas segun el aparato.
          */}
          {mainView === 'manual' && (
            <div className="flex min-h-0 flex-1 lg:hidden">
              <ManualMobileView onSoporte={() => setMainView('soporte')} />
            </div>
          )}

          {mainView === 'manual' && (
            <div className="hidden min-h-0 flex-1 lg:flex">
            <ManualView
              articuloInicial={manualArticulo}
              onSoporte={() => setMainView('soporte')}
            />
            </div>
          )}
          {/*
            9d llama a esto «dos vias con expectativas distintas, no dos botones
            iguales»: cada canal con su tiempo de respuesta y su filete de
            color. Con una diferencia que la maqueta no podia prever — el chat
            en la app NO EXISTE, asi que su tarjeta se pinta como declaracion y
            no como boton. En el telefono importa mas: un boton grande y comodo
            que no responde se pulsa dos veces antes de sospechar.
          */}
          {mainView === 'soporte' && (
            <div className="flex min-h-0 flex-1 lg:hidden">
              <SupportMobileView
                firma={activeFirm.name}
                correo={currentUserEmail}
                onManual={() => setMainView('manual')}
              />
            </div>
          )}

          {mainView === 'soporte' && (
            <div className="hidden min-h-0 flex-1 lg:flex">
            <SupportView
              firma={activeFirm.name}
              correo={currentUserEmail}
              onManual={(id) => {
                setManualArticulo(id);
                setMainView('manual');
              }}
            />
            </div>
          )}
          {mainView === 'ajustes' && <SettingsView />}
          {mainView === 'orientacion' && (
            <>
            {/*
              4d rehace Orientacion para el telefono: las tarjetas pierden la
              reticula, ganan altura, el estado se repite como ICONO junto al
              titulo y como BORDE IZQUIERDO de 3px —en 375px un filete de color
              solo no se lee—, y solo la primera verificada lleva el primario.
              El historial se queda en escritorio: de pie se orienta el caso que
              se tiene delante, no se revisa lo de la semana pasada.
            */}
            <div className="flex min-h-0 flex-1 lg:hidden">
              <TriageMobileView onDraft={irARedactar} />
            </div>
            <div className="hidden min-h-0 flex-1 lg:flex">
            <TriageView
              setMainView={setMainView}
              /*
               * Una sugerencia se convierte en borrador sin volver a escribir su
               * nombre. El nombre catalogado es el contrato con el motor de
               * redacción: cualquier otra cadena resuelve a una plantilla
               * genérica, así que se pasa tal cual vino del catálogo.
               */
              onDraft={irARedactar}
            />
            </div>
            </>
          )}
        </main>

        {/*
          LA BARRA INFERIOR VIVE EN LA COLUMNA DE TRABAJO, no en la raiz: asi
          queda debajo del contenido y encima del area segura del sistema, sin
          flotar sobre el escrito. En modo concentracion desaparece, igual que
          la barra lateral — el documento se queda con la pantalla.
        */}
        {!workflow.isFocusMode && (
          <MobileTabBar
            mainView={mainView}
            setMainView={(v) => {
              setMasAbierto(false);
              setMainView(v);
            }}
            onAbrirMas={() => setMasAbierto((v) => !v)}
            masAbierto={masAbierto}
          />
        )}
      </div>
      </div>

      <MobileMoreSheet
        abierto={masAbierto}
        mainView={mainView}
        onElegir={setMainView}
        onCerrar={() => setMasAbierto(false)}
      />

      <SupportAccessDecisionDialog
        solicitud={solicitudAbierta}
        onCerrar={() => setSolicitudAbierta(null)}
        onDecidido={() => setRefrescoSoporte((n) => n + 1)}
      />
    </div>
    </TenantProvider>
  );
}

export default App;
