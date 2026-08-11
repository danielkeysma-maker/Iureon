import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Scale, Sparkles, CheckCircle2, BrainCircuit, Maximize2, Minimize2, Save, FolderOpen, Eye, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { JargonSuggestionModal } from './JargonSuggestionModal';
import { markdownBoldToHtml } from '../services/documentExport.service';
import DOMPurify from 'dompurify';

export type { GeneratedDraft } from '../types';
import type { GeneratedDraft } from '../types';
import { useTenant } from '../../tenant/TenantContext';
import { learningApi } from '../../agent/services/learning.api';


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
  const { firmId } = useTenant();
  const [editableText, setEditableText] = useState(draft.legalText);
  const [selectedText, setSelectedText] = useState('');
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [isStyleSaved, setIsStyleSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  // Título limpio: quitar artículos, leyes entre paréntesis, EXP-xxxx
  const cleanTitle = useMemo(() => {
    return draft.title
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/_(Art\..*?)(?=_|$)/g, '')
      .replace(/_EXP-[\w-]+/g, '')
      .replace(/^(Redacción_de_|Proyección_de_|Elaboración_de_|Formulación_de_)/i, '')
      .replace(/_/g, ' ')
      .trim();
  }, [draft.title]);

  // Generar HTML sanitizado con negritas reales para el modo vista
  const renderedHtml = useMemo(() => {
    const raw = markdownBoldToHtml(editableText);
    // Convertir saltos de línea a <br> y preservar párrafos
    const withBreaks = raw
      .split('\n\n').map(p => `<p style="margin-bottom:12px;text-align:justify;">${p.replace(/\n/g, '<br/>')}</p>`).join('');
    return DOMPurify.sanitize(withBreaks);
  }, [editableText]);

  useEffect(() => {
    setEditableText(draft.legalText);
  }, [draft.legalText]);

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
      await learningApi.teachStyle(firmId, draft.legalText, editableText);
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

      {/* Metadata + Actions bar — STICKY para que siempre sea visible */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-3 shadow-sm sticky top-0 z-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-blue-900 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-slate-900 truncate">{cleanTitle}</h3>
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
      </div>

      {/* Editable Folio Paper Canvas */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-12 shadow-sm relative border-t-4 border-t-blue-900 max-w-full overflow-hidden">
        <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center flex-wrap gap-2">
          <span className="uppercase font-semibold tracking-wide text-slate-800 text-[11px]">República de Colombia — Rama Judicial</span>
          <span className="font-mono text-[10px] text-slate-400">Edición interactiva</span>
        </div>

        {isEditMode ? (
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
            rows={24}
            className="w-full bg-transparent border-0 focus:outline-none font-legal text-sm sm:text-base leading-relaxed text-slate-900 resize-y selection:bg-blue-100 whitespace-pre-wrap break-words max-w-full overflow-x-hidden min-h-[550px]"
          />
        ) : (
          <div
            className="font-legal text-sm sm:text-base leading-relaxed text-slate-900 whitespace-pre-wrap break-words max-w-full min-h-[550px] prose prose-slate max-w-none"
            onMouseUp={handleSelection}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}

        {/* Toggle Edición / Vista */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all shadow-sm ${
              isEditMode
                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
            title={isEditMode ? 'Cambiar a vista formateada' : 'Cambiar a modo edición'}
          >
            {isEditMode ? <Eye className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            <span>{isEditMode ? 'Vista Documento' : 'Editar Texto'}</span>
          </button>
        </div>
      </div>

      {/* Jurisprudencia & Excepciones — Panel colapsable debajo del documento */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setIsMetadataOpen(!isMetadataOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-blue-800" />
            <span className="text-[11px] font-semibold text-slate-700">
              Jurisprudencia aplicada ({draft.jurisprudenciaCitada.length}) &amp; Excepciones ({draft.excepcionesFormuladas.length})
            </span>
          </div>
          {isMetadataOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {isMetadataOpen && (
          <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 block">Jurisprudencia</span>
              <ul className="space-y-0.5 text-[11px] text-slate-700">
                {draft.jurisprudenciaCitada.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-700 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1 block">Excepciones procesales</span>
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
        )}
      </div>
    </div>
  );
};
