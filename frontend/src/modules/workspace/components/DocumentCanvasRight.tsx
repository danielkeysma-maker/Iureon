import React from 'react';
import { PdfViewerCanvas } from '../../documents/components/PdfViewerCanvas';
import { LegalDraftViewer } from '../../documents/components/LegalDraftViewer';
import type { GeneratedDraft } from '../../documents/components/LegalDraftViewer';
import { PrecedentsAnalyticsCard } from '../../precedents/components/PrecedentsAnalyticsCard';
import type { CaseProvidenciaEvaluationData } from '../../precedents/components/PrecedentsAnalyticsCard';

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
}

export const DocumentCanvasRight: React.FC<DocumentCanvasRightProps> = ({
  rightView,
  generatedDraft,
  analyticsData,
  onExportWord,
  onExportPdf,
  isFocusMode,
  onToggleFocusMode
}) => {
  return (
    <section className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden font-sans">
      {/* Main Canvas View Area */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100/70">
        {rightView === 'analytics' ? (
          <PrecedentsAnalyticsCard data={analyticsData} />
        ) : rightView === 'draft' && generatedDraft ? (
          <LegalDraftViewer
            draft={generatedDraft}
            onExportPdf={onExportPdf}
            onExportWord={onExportWord}
            isFocusMode={isFocusMode}
            onToggleFocusMode={onToggleFocusMode}
          />
        ) : (
          <PdfViewerCanvas />
        )}
      </div>
    </section>
  );
};
