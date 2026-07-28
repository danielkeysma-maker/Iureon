import { useState } from 'react';
import { SidebarLeft } from './modules/tenant/components/SidebarLeft';
import { HeaderTop } from './modules/tenant/components/HeaderTop';
import type { LawFirmTenant } from './modules/tenant/components/Header';
import { AgentPanelLeft } from './modules/workspace/components/AgentPanelLeft';
import { DocumentCanvasRight } from './modules/workspace/components/DocumentCanvasRight';
import { SearchView } from './modules/search/components/SearchView';
import { ToolsView } from './modules/tools/components/ToolsView';
import { AuditView } from './modules/audit/components/AuditView';
import { FirmBrandingModal } from './modules/tenant/components/FirmBrandingModal';
import { FirmSubscriptionModal } from './modules/subscriptions/components/FirmSubscriptionModal';
import type { FirmSubscriptionInfo } from './modules/subscriptions/components/FirmSubscriptionModal';
import { DEFAULT_FIRM_BRANDING, DocumentExportService } from './modules/documents/services/documentExport.service';
import type { FirmBrandingConfig } from './modules/documents/services/documentExport.service';
import { useLegalAgentWorkflow } from './modules/workspace/hooks/useLegalAgentWorkflow';

import { SavedDraftsModal } from './modules/documents/components/SavedDraftsModal';
import type { SavedDraftEntry } from './modules/documents/components/SavedDraftsModal';

import { TenantUserManagementModal } from './modules/tenant/components/TenantUserManagementModal';

const INITIAL_REGISTERED_FIRMS: LawFirmTenant[] = [
  { id: 'firm-default-01', name: 'FIRMA APODERADA / DESPACHO JUDICIAL', nit: 'NIT 900.000.000-0', plan: 'PRO_FIRM', status: 'active' }
];

export function App() {
  const [mainView, setMainView] = useState<'workspace' | 'search' | 'tools' | 'audit'>('workspace');

  const [registeredFirms, setRegisteredFirms] = useState<LawFirmTenant[]>(() => {
    try {
      const stored = localStorage.getItem('iureon_registered_firms');
      return stored ? JSON.parse(stored) : INITIAL_REGISTERED_FIRMS;
    } catch {
      return INITIAL_REGISTERED_FIRMS;
    }
  });

  const [activeFirm, setActiveFirm] = useState<LawFirmTenant>(registeredFirms[0] || INITIAL_REGISTERED_FIRMS[0]);
  const [isFirmDropdownOpen, setIsFirmDropdownOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);

  const [isSavedDraftsModalOpen, setIsSavedDraftsModalOpen] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftEntry[]>(() => {
    try {
      const stored = localStorage.getItem('iureon_saved_drafts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [firmBranding, setFirmBranding] = useState<FirmBrandingConfig>(DEFAULT_FIRM_BRANDING);
  const workflow = useLegalAgentWorkflow();

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

  const handleSaveDraft = (updatedText: string) => {
    if (!workflow.generatedDraft) return;

    const newEntry: SavedDraftEntry = {
      id: `draft-${Date.now()}`,
      savedAt: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      draft: {
        ...workflow.generatedDraft,
        legalText: updatedText
      }
    };

    const updatedList = [newEntry, ...savedDrafts];
    setSavedDrafts(updatedList);
    try {
      localStorage.setItem('iureon_saved_drafts', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage error saving draft:', e);
    }

    alert('✅ Borrador guardado exitosamente en la Bóveda de la Firma. Podrás abrirlo y editarlo en cualquier momento.');
  };

  const handleDeleteDraft = (id: string) => {
    const updatedList = savedDrafts.filter((d) => d.id !== id);
    setSavedDrafts(updatedList);
    try {
      localStorage.setItem('iureon_saved_drafts', JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage error deleting draft:', e);
    }
  };

  const handleLoadDraft = (entry: SavedDraftEntry) => {
    workflow.setGeneratedDraft(entry.draft);
    workflow.setRightView('draft');
    alert(`📂 Borrador "${entry.draft.title}" cargado en el editor.`);
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
    planTier: activeFirm.plan,
    subscriptionStatus: 'active',
    monthlyTokensUsed: 1420500,
    monthlyTokensLimit: 5000000,
    activeUsersCount: 1,
    maxUsersAllowed: 10,
    renewalDate: '2026-08-20',
    usersList: [
      { id: 'usr-001', name: 'Administrador de Firma', email: 'admin@firma.co', role: 'SOCIO_ADMIN', status: 'active' }
    ]
  };

  return (
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
        onDeleteDraft={handleDeleteDraft}
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

      {/* ENTERPRISE LEFT SIDEBAR */}
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
      />

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
        />

        <main className="flex-1 flex overflow-hidden">
          {mainView === 'workspace' && (
            <>
              {!workflow.isFocusMode && (
                <AgentPanelLeft
                  documentType={workflow.documentType}
                  setDocumentType={workflow.setDocumentType}
                  legalPrompt={workflow.legalPrompt}
                  setLegalPrompt={workflow.setLegalPrompt}
                  isProcessing={workflow.isProcessing}
                  handleSendPrompt={workflow.handleSendPrompt}
                  logs={workflow.logs}
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

          {mainView === 'search' && <SearchView />}
          {mainView === 'tools' && <ToolsView />}
          {mainView === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
  );
}

export default App;
