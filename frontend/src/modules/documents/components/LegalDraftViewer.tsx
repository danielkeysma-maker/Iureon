import React, { useState } from 'react';
import { API_BASE_URL } from '../../../config/api.config';
import { FileText, Scale, ShieldAlert, Sparkles, CheckCircle2, BrainCircuit, FileType, Download } from 'lucide-react';
import { JargonSuggestionModal } from './JargonSuggestionModal';

export interface GeneratedDraft {
  title: string;
  documentType: string;
  jurisprudenciaCitada: string[];
  excepcionesFormuladas: string[];
  legalText: string;
  tokensConsumed: number;
}

interface LegalDraftViewerProps {
  draft: GeneratedDraft;
  onExportPdf?: () => void;
  onExportWord?: () => void;
}

export const LegalDraftViewer: React.FC<LegalDraftViewerProps> = ({
  draft,
  onExportPdf,
  onExportWord
}) => {
  const [editableText, setEditableText] = useState(draft.legalText);
  const [selectedText, setSelectedText] = useState('');
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [isStyleSaved, setIsStyleSaved] = useState(false);

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleApplyReplacement = (replacement: string) => {
    if (!selectedText) {
      setEditableText((prev) => `${prev}\n\n${replacement}`);
      return;
    }
    setEditableText((prev) => prev.replace(selectedText, replacement));
  };

  const handleSaveAndTeachStyle = async () => {
    setIsStyleSaved(true);
    try {
      await fetch(`${API_BASE_URL}/api/agent/learn-edits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firm-id': '8f9b2c34-torres-asociados'
        },
        body: JSON.stringify({
          originalText: draft.legalText,
          editedText: editableText
        })
      });
    } catch (err) {
      console.warn('Fallback learn edits simulation:', err);
    } finally {
      setTimeout(() => setIsStyleSaved(false), 3000);
    }
  };

  const wordCount = editableText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5 font-sans">
      <JargonSuggestionModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        selectedText={selectedText || 'rechazar'}
        onApplyReplacement={handleApplyReplacement}
      />

      {/* Metadata + Actions bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-blue-900" />
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">{draft.title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{wordCount} palabras • Edición en vivo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsJargonModalOpen(true)}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-blue-700" />
              <span>Sugerir jerga</span>
            </button>

            <button
              onClick={handleSaveAndTeachStyle}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              {isStyleSaved ? (
                <><CheckCircle2 className="w-3 h-3" /><span>Aprendido</span></>
              ) : (
                <><BrainCircuit className="w-3 h-3" /><span>Enseñar estilo</span></>
              )}
            </button>

            {onExportWord && (
              <button
                onClick={onExportWord}
                className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3" /><span>Word</span>
              </button>
            )}
            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileType className="w-3 h-3" /><span>PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Citations & Exceptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
              <Scale className="w-3 h-3 text-slate-400" />
              Jurisprudencia aplicada
            </span>
            <ul className="space-y-0.5 text-[11px] text-slate-700">
              {draft.jurisprudenciaCitada.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-700 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-3 h-3 text-slate-400" />
              Excepciones procesales
            </span>
            <ul className="space-y-0.5 text-[11px] text-slate-700">
              {draft.excepcionesFormuladas.map((ex, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Editable Folio */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 sm:p-12 shadow-sm relative border-t-2 border-t-blue-900">
        <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
          <span className="uppercase font-semibold tracking-wide text-slate-800 text-[11px]">República de Colombia — Rama Judicial</span>
          <span className="font-mono text-[10px] text-slate-400">Edición interactiva</span>
        </div>

        <textarea
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          rows={22}
          className="w-full bg-transparent border-0 focus:outline-none font-legal text-sm md:text-base leading-relaxed text-slate-900 resize-none selection:bg-blue-100"
        />
      </div>
    </div>
  );
};
