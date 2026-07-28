import React, { useState } from 'react';
import { API_BASE_URL } from '../../../config/api.config';
import { FileText, Scale, ShieldAlert, Sparkles, CheckCircle2, BrainCircuit, Maximize2, Minimize2, Save, FolderOpen } from 'lucide-react';
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
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSaveDraft?: (updatedText: string) => void;
  onOpenSavedDraftsModal?: () => void;
}

export const LegalDraftViewer: React.FC<LegalDraftViewerProps> = ({
  draft,
  isFocusMode,
  onToggleFocusMode,
  onSaveDraft,
  onOpenSavedDraftsModal
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
    <div className={`${isFocusMode ? 'max-w-6xl' : 'max-w-4xl'} mx-auto space-y-5 font-sans transition-all duration-300`}>
      <JargonSuggestionModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        selectedText={selectedText || 'rechazar'}
        onApplyReplacement={handleApplyReplacement}
      />

      {/* Metadata + Actions bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-blue-900 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-slate-900 truncate">{draft.title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{wordCount} palabras • Edición en vivo</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

            {onSaveDraft && (
              <button
                onClick={() => onSaveDraft(editableText)}
                className="px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                title="Guardar borrador en el historial de la firma"
              >
                <Save className="w-3 h-3" />
                <span>Guardar Borrador</span>
              </button>
            )}

            {onOpenSavedDraftsModal && (
              <button
                onClick={onOpenSavedDraftsModal}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                title="Ver lista de borradores guardados"
              >
                <FolderOpen className="w-3 h-3 text-slate-600" />
                <span>Mis Borradores</span>
              </button>
            )}

            {onToggleFocusMode && (
              <button
                onClick={onToggleFocusMode}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                  isFocusMode
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-indigo-900 hover:bg-indigo-950 text-white'
                }`}
                title={isFocusMode ? 'Restaurar vista dividida' : 'Expandir editor a Pantalla Central'}
              >
                {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFocusMode ? 'Vista Dividida' : 'Pantalla Central'}</span>
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

      {/* Editable Folio Paper Canvas */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-12 shadow-sm relative border-t-4 border-t-blue-900 max-w-full overflow-hidden">
        <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center flex-wrap gap-2">
          <span className="uppercase font-semibold tracking-wide text-slate-800 text-[11px]">República de Colombia — Rama Judicial</span>
          <span className="font-mono text-[10px] text-slate-400">Edición interactiva</span>
        </div>

        <textarea
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          rows={24}
          className="w-full bg-transparent border-0 focus:outline-none font-legal text-sm sm:text-base leading-relaxed text-slate-900 resize-y selection:bg-blue-100 whitespace-pre-wrap break-words max-w-full overflow-x-hidden min-h-[550px]"
        />
      </div>
    </div>
  );
};
