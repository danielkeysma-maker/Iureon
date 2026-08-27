import React, { useEffect, useMemo, useState } from 'react';
import { httpClient, setSessionLostHandler } from './config/httpClient';
import { billingApi } from './modules/billing/billing.api';
import { BalancePanel } from './modules/billing/components/BalancePanel';
import { clearSession, readSession, saveSession, type Session } from './modules/auth/session';
import { SidebarLeft } from './modules/tenant/components/SidebarLeft';
import { HeaderTop } from './modules/tenant/components/HeaderTop';
import type { LawFirmTenant } from './modules/tenant/types';
import { TenantProvider } from './modules/tenant/TenantContext';
import { AgentPanelLeft } from './modules/workspace/components/AgentPanelLeft';
import { DocumentCanvasRight } from './modules/workspace/components/DocumentCanvasRight';
import { SearchView } from './modules/search/components/SearchView';
import { TranscriptionView } from './modules/transcription/components/TranscriptionView';
import { InterviewView } from './modules/clients/components/InterviewView';
import { CatalogCurationView } from './modules/catalog/components/CatalogCurationView';
import { ToolsView } from './modules/tools/components/ToolsView';
import { AuditView } from './modules/audit/components/AuditView';
import { SubprocessorsView } from './modules/privacy/components/SubprocessorsView';
import { TriageView } from './modules/catalog/components/TriageView';
import { FirmBrandingModal } from './modules/tenant/components/FirmBrandingModal';
import { FirmSubscriptionModal } from './modules/subscriptions/components/FirmSubscriptionModal';
import type { FirmSubscriptionInfo } from './modules/subscriptions/types';
import { DEFAULT_FIRM_BRANDING, DocumentExportService } from './modules/documents/services/documentExport.service';
import type { FirmBrandingConfig } from './modules/documents/services/documentExport.service';
import { useLegalAgentWorkflow } from './modules/workspace/hooks/useLegalAgentWorkflow';

import { SavedDraftsModal } from './modules/documents/components/SavedDraftsModal';
import type { SavedDraftEntry } from './modules/documents/types';
import { useSavedDrafts } from './modules/documents/hooks/useSavedDrafts';

import { TenantUserManagementModal } from './modules/tenant/components/TenantUserManagementModal';
import { LoginPortalView } from './modules/tenant/components/LoginPortalView';
import type { MainView } from './modules/tenant/types';

/** Every module the shell can show, for validating what was stored. */
const MAIN_VIEWS: MainView[] = [
  'workspace',
  'audiencias',
  'entrevistas',
  'search',
  'catalogo',
  'tools',
  'audit',
  'privacidad',
  'orientacion'
];


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
  const [session, setSession] = useState(() => readSession());
  const isAuthenticated = Boolean(session);
  const currentUserEmail = session?.user.email ?? '';

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
  const workflow = useLegalAgentWorkflow();

  /*
   * A firm is created from the OPERATOR CONSOLE, which issues its first account
   * at the same time. Self-registration was removed: it let anyone open a
   * tenant and use the product without becoming a client. These three handlers used to
   * create, edit and delete tenants in localStorage, which is why the registry
   * table was empty and why a firm vanished with the browser.
   *
   * Editing the firm on screen still works, and stays local until there is an
   * endpoint to persist it; deleting a tenant a session is bound to would only
   * strand that session, so it is no longer offered here.
   */
  const handleUpdateFirm = (updatedFirm: LawFirmTenant) => {
    if (activeFirm.id === updatedFirm.id) setActiveFirm(updatedFirm);
  };

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
    setLoadedDraftId,
    saveDraft,
    deleteDraft
  } = useSavedDrafts(activeFirm.id, currentUserEmail, isAuthenticated);

  const handleSaveDraft = async (updatedText: string) => {
    if (!workflow.generatedDraft) return;
    alert(await saveDraft({ ...workflow.generatedDraft, legalText: updatedText }));
  };

  // ═══ Cargar borrador para edición ═══
  const handleLoadDraft = (entry: SavedDraftEntry) => {
    workflow.setGeneratedDraft(entry.draft);
    workflow.setActiveDraftText(entry.draft.legalText);
    workflow.setDocumentType(entry.draft.documentType);
    workflow.setRightView('draft');
    setLoadedDraftId(entry.id);
    setIsSavedDraftsModalOpen(false);
  };

  const handleExportWord = () => {
    if (workflow.generatedDraft) {
      DocumentExportService.exportToWordDocx(workflow.generatedDraft.title, workflow.generatedDraft.legalText, firmBranding);
    }
  };

  const handleExportPdf = () => {
    if (workflow.generatedDraft) {
      DocumentExportService.exportToPdf(workflow.generatedDraft.title, workflow.generatedDraft.legalText, firmBranding);
    }
  };

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
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <FirmBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        branding={firmBranding}
        onSaveBranding={(updated) => setFirmBranding(updated)}
      />
      <FirmSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        info={sampleSubscriptionInfo}
      />
      <SavedDraftsModal
        isOpen={isSavedDraftsModalOpen}
        onClose={() => setIsSavedDraftsModalOpen(false)}
        savedDrafts={savedDrafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={deleteDraft}
      />
      <BalancePanel
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        firmName={activeFirm.name}
      />

      <TenantUserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        firms={registeredFirms}
        activeFirm={activeFirm}
        onSelectFirm={(f) => setActiveFirm(f)}
        onUpdateFirm={handleUpdateFirm}
      />

      {/* ENTERPRISE LEFT SIDEBAR — hidden in focus mode so the editor owns the screen */}
      {!workflow.isFocusMode && (
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
        isSuperUser={currentUserEmail === 'ingdanielma@gmail.com'}
      />
      )}

      {/* RIGHT MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <HeaderTop
          mainView={mainView}
          rightView={workflow.rightView}
          setRightView={workflow.setRightView}
          copied={workflow.copied}
          onCopyText={workflow.handleCopyText}
          onExportWord={handleExportWord}
          onExportPdf={handleExportPdf}
          isFocusMode={workflow.isFocusMode}
          onToggleFocusMode={() => workflow.setIsFocusMode(!workflow.isFocusMode)}
          onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex overflow-hidden">
          {mainView === 'workspace' && (
            <>
              {!workflow.isFocusMode && (
                <AgentPanelLeft
                  documentType={workflow.documentType}
                  setDocumentType={workflow.setDocumentType}
                  legalBranch={workflow.legalBranch}
                  setLegalBranch={workflow.setLegalBranch}
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
            </>
          )}

          {mainView === 'audiencias' && <TranscriptionView kind="AUDIENCIA" />}
          {mainView === 'entrevistas' && <InterviewView />}
          {mainView === 'search' && <SearchView />}
          {mainView === 'catalogo' && <CatalogCurationView />}
          {mainView === 'tools' && <ToolsView />}
          {mainView === 'audit' && <AuditView />}
          {mainView === 'privacidad' && <SubprocessorsView />}
          {mainView === 'orientacion' && (
            <TriageView
              setMainView={setMainView}
              /*
               * Una sugerencia se convierte en borrador sin volver a escribir su
               * nombre. El nombre catalogado es el contrato con el motor de
               * redacción: cualquier otra cadena resuelve a una plantilla
               * genérica, así que se pasa tal cual vino del catálogo.
               */
              onDraft={(nombre, rama) => {
                workflow.setLegalBranch(rama);
                workflow.setDocumentType(nombre);
                setMainView('workspace');
              }}
            />
          )}
        </main>
      </div>
    </div>
    </TenantProvider>
  );
}

export default App;
