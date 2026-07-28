import React from 'react';
import { PdfViewerCanvas } from '../../documents/components/PdfViewerCanvas';
import { LegalDraftViewer } from '../../documents/components/LegalDraftViewer';
import type { GeneratedDraft } from '../../documents/components/LegalDraftViewer';
import { PrecedentsAnalyticsCard } from '../../precedents/components/PrecedentsAnalyticsCard';
import type { CaseProvidenciaEvaluationData } from '../../precedents/components/PrecedentsAnalyticsCard';
import { Sparkles } from 'lucide-react';

interface DocumentCanvasRightProps {
  rightView: 'pdf' | 'draft' | 'analytics';
  setRightView: (view: 'pdf' | 'draft' | 'analytics') => void;
  generatedDraft: GeneratedDraft | null;
  analyticsData: CaseProvidenciaEvaluationData;
  copied: boolean;
  onOpenBrandingModal: () => void;
  onCopyText: () => void;
  onExportWord: () => void;
  onExportPdf: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSaveDraft?: (updatedText: string) => void;
  onOpenSavedDraftsModal?: () => void;
}

export const DocumentCanvasRight: React.FC<DocumentCanvasRightProps> = ({
  rightView,
  generatedDraft,
  analyticsData,
  onExportWord,
  onExportPdf,
  isFocusMode,
  onToggleFocusMode,
  onSaveDraft,
  onOpenSavedDraftsModal
}) => {
  return (
    <section className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden font-sans">
      {/* Main Canvas View Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100/70">
        {rightView === 'analytics' ? (
          <PrecedentsAnalyticsCard data={analyticsData} />
        ) : rightView === 'draft' ? (
          generatedDraft ? (
            <LegalDraftViewer
              draft={generatedDraft}
              onExportPdf={onExportPdf}
              onExportWord={onExportWord}
              isFocusMode={isFocusMode}
              onToggleFocusMode={onToggleFocusMode}
              onSaveDraft={onSaveDraft}
              onOpenSavedDraftsModal={onOpenSavedDraftsModal}
            />
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                  <Sparkles className="w-8 h-8 text-blue-900 animate-pulse" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-slate-900">Borrador IA &amp; Redacción Procesal</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Escriba su indicación o hechos en el orquestador de la izquierda y haga clic en <strong>Generar Borrador</strong> para redactar la providencia.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : (
          <PdfViewerCanvas />
        )}
      </div>
    </section>
  );
};
