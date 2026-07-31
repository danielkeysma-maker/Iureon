import { useState, useEffect, useCallback } from 'react';
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
import { LoginPortalView } from './modules/tenant/components/LoginPortalView';
import { FirmCreditsRechargeModal } from './modules/tenant/components/FirmCreditsRechargeModal';
import { API_BASE_URL } from './config/api.config';

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

  const [mainView, setMainView] = useState<'workspace' | 'search' | 'tools' | 'audit'>('workspace');

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
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftEntry[]>([]);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);

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
  const draftsStorageKey = `iureon_saved_drafts_${activeFirm.id}_${currentUserEmail}`;

  // ═══ Cargar borradores desde API (Supabase) o localStorage fallback ═══
  const loadDraftsFromSource = useCallback(async () => {
    if (!activeFirm.id || !currentUserEmail) {
      setSavedDrafts([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/drafts?userEmail=${encodeURIComponent(currentUserEmail)}`, {
        headers: { 'x-firm-id': activeFirm.id }
      });
      const json = await res.json();
      if (json.success && json.drafts?.length > 0) {
        const mapped: SavedDraftEntry[] = json.drafts.map((d: any) => ({
          id: d.id,
          savedAt: new Date(d.updated_at || d.saved_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          draft: {
            title: d.title,
            documentType: d.document_type,
            legalText: d.legal_text,
            jurisprudenciaCitada: d.jurisprudencia_citada || [],
            excepcionesFormuladas: d.excepciones_formuladas || [],
            tokensConsumed: d.tokens_consumed || 0
          }
        }));
        setSavedDrafts(mapped);
        return;
      }
    } catch {
      // API no disponible — usar localStorage
    }

    try {
      const stored = localStorage.getItem(draftsStorageKey);
      setSavedDrafts(stored ? JSON.parse(stored) : []);
    } catch {
      setSavedDrafts([]);
    }
  }, [activeFirm.id, currentUserEmail, draftsStorageKey]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDraftsFromSource();
    }
  }, [isAuthenticated, activeFirm.id, currentUserEmail, loadDraftsFromSource]);

  // ═══ Guardar/Actualizar borrador ═══
  const handleSaveDraft = async (updatedText: string) => {
    if (!workflow.generatedDraft) return;

    const draftData = { ...workflow.generatedDraft, legalText: updatedText };

    // Si hay un borrador cargado, actualizar en vez de crear nuevo
    if (loadedDraftId) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/drafts/${loadedDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-firm-id': activeFirm.id },
          body: JSON.stringify({
            title: draftData.title,
            legalText: draftData.legalText,
            jurisprudenciaCitada: draftData.jurisprudenciaCitada,
            excepcionesFormuladas: draftData.excepcionesFormuladas
          })
        });
        const json = await res.json();
        if (json.success) {
          await loadDraftsFromSource();
          alert('✅ Borrador actualizado exitosamente.');
          return;
        }
      } catch {
        // Fallback a localStorage
      }

      // Fallback localStorage — actualizar el existente
      const updatedList = savedDrafts.map((d) =>
        d.id === loadedDraftId
          ? { ...d, savedAt: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), draft: draftData }
          : d
      );
      setSavedDrafts(updatedList);
      try { localStorage.setItem(draftsStorageKey, JSON.stringify(updatedList)); } catch {}
      alert('✅ Borrador actualizado (almacenamiento local).');
      return;
    }

    // Crear borrador nuevo
    try {
      const res = await fetch(`${API_BASE_URL}/api/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-firm-id': activeFirm.id },
        body: JSON.stringify({
          userEmail: currentUserEmail,
          title: draftData.title,
          documentType: draftData.documentType,
          legalText: draftData.legalText,
          jurisprudenciaCitada: draftData.jurisprudenciaCitada,
          excepcionesFormuladas: draftData.excepcionesFormuladas,
          tokensConsumed: draftData.tokensConsumed
        })
      });
      const json = await res.json();
      if (json.success && json.draft) {
        await loadDraftsFromSource();
        alert('✅ Borrador guardado en la nube. Podrás abrirlo y editarlo en cualquier momento.');
        return;
      }
    } catch {
      // Fallback a localStorage
    }

    // Fallback localStorage — crear nuevo
    const newEntry: SavedDraftEntry = {
      id: `draft-${Date.now()}`,
      savedAt: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      draft: draftData
    };
    const updatedList = [newEntry, ...savedDrafts];
    setSavedDrafts(updatedList);
    try { localStorage.setItem(draftsStorageKey, JSON.stringify(updatedList)); } catch {}
    alert('✅ Borrador guardado (almacenamiento local). Podrás abrirlo y editarlo en cualquier momento.');
  };

  // ═══ Eliminar borrador ═══
  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/drafts/${id}`, {
        method: 'DELETE',
        headers: { 'x-firm-id': activeFirm.id }
      });
      const json = await res.json();
      if (json.success) {
        await loadDraftsFromSource();
        return;
      }
    } catch {
      // Fallback a localStorage
    }

    const updatedList = savedDrafts.filter((d) => d.id !== id);
    setSavedDrafts(updatedList);
    try { localStorage.setItem(draftsStorageKey, JSON.stringify(updatedList)); } catch {}
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
      <FirmCreditsRechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        firm={activeFirm}
        onRechargeSuccess={handleRechargeSuccess}
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
        onOpenRechargeModal={() => setIsRechargeModalOpen(true)}
        isSuperUser={currentUserEmail === 'ingdanielma@gmail.com'}
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

          {mainView === 'search' && <SearchView />}
          {mainView === 'tools' && <ToolsView />}
          {mainView === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
  );
}

export default App;
