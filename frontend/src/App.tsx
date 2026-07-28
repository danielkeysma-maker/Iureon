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

const SAMPLE_FIRMS: LawFirmTenant[] = [
  { id: '8f9b2c34-torres-asociados', name: 'Torres & Asociados S.A.S.', nit: '900.892.102-4', plan: 'PRO_FIRM', status: 'active' },
  { id: '1a2b3c4d-gomez-consultores', name: 'Gómez & Abogados Consultores', nit: '800.112.443-1', plan: 'ENTERPRISE', status: 'active' },
  { id: '9z8y7x6w-valencia-legal', name: 'Valencia & Cárdenas LegalTech', nit: '901.554.981-9', plan: 'STARTER', status: 'active' }
];

export function App() {
  const [mainView, setMainView] = useState<'workspace' | 'search' | 'tools' | 'audit'>('workspace');
  const [activeFirm, setActiveFirm] = useState<LawFirmTenant>(SAMPLE_FIRMS[0]);
  const [isFirmDropdownOpen, setIsFirmDropdownOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const [firmBranding, setFirmBranding] = useState<FirmBrandingConfig>(DEFAULT_FIRM_BRANDING);
  const workflow = useLegalAgentWorkflow();

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
    activeUsersCount: 4,
    maxUsersAllowed: 10,
    renewalDate: '2026-08-20',
    usersList: [
      { id: 'usr-001', name: 'Dr. Julián Delgado', email: 'jdelgado@torresasociados.co', role: 'SOCIO_ADMIN', status: 'active' }
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

      {/* ENTERPRISE LEFT SIDEBAR */}
      <SidebarLeft
        mainView={mainView}
        setMainView={setMainView}
        activeFirm={activeFirm}
        setActiveFirm={setActiveFirm}
        sampleFirms={SAMPLE_FIRMS}
        isFirmDropdownOpen={isFirmDropdownOpen}
        setIsFirmDropdownOpen={setIsFirmDropdownOpen}
        onOpenBrandingModal={() => setIsBrandingModalOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
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
