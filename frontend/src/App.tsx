import { useState } from 'react';
import { SidebarLeft } from './modules/tenant/components/SidebarLeft';
import { HeaderTop } from './modules/tenant/components/HeaderTop';
import type { LawFirmTenant } from './modules/tenant/types';
import { TenantProvider } from './modules/tenant/TenantContext';
import { AgentPanelLeft } from './modules/workspace/components/AgentPanelLeft';
import { DocumentCanvasRight } from './modules/workspace/components/DocumentCanvasRight';
import { SearchView } from './modules/search/components/SearchView';
import { TranscriptionView } from './modules/transcription/components/TranscriptionView';
import { CatalogCurationView } from './modules/catalog/components/CatalogCurationView';
import { ToolsView } from './modules/tools/components/ToolsView';
import { AuditView } from './modules/audit/components/AuditView';
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
import { FirmCreditsRechargeModal } from './modules/tenant/components/FirmCreditsRechargeModal';
import type { MainView } from './modules/tenant/types';

const COST_PER_DRAFT_COP = 2000;

const INITIAL_REGISTERED_FIRMS: LawFirmTenant[] = [];

const EMPTY_FIRM_PLACEHOLDER: LawFirmTenant = {
  id: '',
  name: 'Sin Firma Registrada',
  nit: 'REGISTRA TU FIRMA',
  creditsBalance: 0,
  status: 'active'
};

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('iureon_is_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('iureon_current_user_email') || 'ingdanielma@gmail.com';
    } catch {
      return 'ingdanielma@gmail.com';
    }
  });

  const [mainView, setMainView] = useState<MainView>('workspace');

  const [registeredFirms, setRegisteredFirms] = useState<LawFirmTenant[]>(() => {
    try {
      const stored = localStorage.getItem('iureon_registered_firms');
      if (!stored) return INITIAL_REGISTERED_FIRMS;
      const parsed: LawFirmTenant[] = JSON.parse(stored);
      // Clean out any legacy mock firm data from localStorage
      const clean = parsed.filter(f => f.id !== 'firm-default-01' && f.name !== 'FIRMA / DESPACHO ACTIVO' && !f.name.includes('FIRMA APODERADA'));
      return clean;
    } catch {
      return INITIAL_REGISTERED_FIRMS;
    }
  });

  const [activeFirm, setActiveFirm] = useState<LawFirmTenant>(registeredFirms[0] || EMPTY_FIRM_PLACEHOLDER);
  const [isFirmDropdownOpen, setIsFirmDropdownOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  const [isSavedDraftsModalOpen, setIsSavedDraftsModalOpen] = useState(false);

  const [firmBranding, setFirmBranding] = useState<FirmBrandingConfig>(DEFAULT_FIRM_BRANDING);
  const workflow = useLegalAgentWorkflow(activeFirm.id);

  const handleCreateFirm = (newFirm: LawFirmTenant) => {
    const updated = [newFirm, ...registeredFirms];
    setRegisteredFirms(updated);
    setActiveFirm(newFirm);
    try {
      localStorage.setItem('iureon_registered_firms', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save firm fail:', err);
    }
  };

  const handleUpdateFirm = (updatedFirm: LawFirmTenant) => {
    const updated = registeredFirms.map((f) => (f.id === updatedFirm.id ? updatedFirm : f));
    setRegisteredFirms(updated);
    if (activeFirm.id === updatedFirm.id) setActiveFirm(updatedFirm);
    try {
      localStorage.setItem('iureon_registered_firms', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage update firm fail:', err);
    }
  };

  const handleDeleteFirm = (firmId: string) => {
    const updated = registeredFirms.filter((f) => f.id !== firmId);
    setRegisteredFirms(updated);
    if (updated.length > 0) setActiveFirm(updated[0]);
    try {
      localStorage.setItem('iureon_registered_firms', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage delete firm fail:', err);
    }
  };

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

  const handleLoginSuccess = (userEmail: string, firm: LawFirmTenant) => {
    setIsAuthenticated(true);
    setCurrentUserEmail(userEmail);
    setActiveFirm(firm);
    try {
      localStorage.setItem('iureon_is_authenticated', 'true');
      localStorage.setItem('iureon_current_user_email', userEmail);
    } catch (err) {
      console.warn('LocalStorage save auth fail:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPortalView
        onLoginSuccess={handleLoginSuccess}
        registeredFirms={registeredFirms}
      />
    );
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('iureon_is_authenticated');
    } catch (err) {
      console.warn('LocalStorage logout fail:', err);
    }
  };

  const handleRechargeSuccess = (addedAmount: number) => {
    const updatedFirm = { ...activeFirm, creditsBalance: (activeFirm.creditsBalance ?? 0) + addedAmount };
    setActiveFirm(updatedFirm);
    handleUpdateFirm(updatedFirm);
  };

  // Descontar $2.000 COP por cada borrador generado
  const handleDeductCredits = () => {
    const newBalance = Math.max(0, (activeFirm.creditsBalance ?? 0) - COST_PER_DRAFT_COP);
    const updatedFirm = { ...activeFirm, creditsBalance: newBalance };
    setActiveFirm(updatedFirm);
    handleUpdateFirm(updatedFirm);
  };

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
      <TenantUserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        firms={registeredFirms}
        activeFirm={activeFirm}
        onSelectFirm={(f) => setActiveFirm(f)}
        onCreateFirm={handleCreateFirm}
        onUpdateFirm={handleUpdateFirm}
        onDeleteFirm={handleDeleteFirm}
      />
      <FirmCreditsRechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        firm={activeFirm}
        onRechargeSuccess={handleRechargeSuccess}
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
                    handleDeductCredits();
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
                analyticsData={workflow.analyticsData}
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
          {mainView === 'search' && <SearchView />}
          {mainView === 'catalogo' && <CatalogCurationView />}
          {mainView === 'tools' && <ToolsView />}
          {mainView === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
    </TenantProvider>
  );
}

export default App;
