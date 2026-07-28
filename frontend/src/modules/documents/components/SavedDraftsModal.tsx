import React from 'react';
import { X, FolderOpen, Clock, Trash2, ArrowUpRight, Scale } from 'lucide-react';
import type { GeneratedDraft } from './LegalDraftViewer';

export interface SavedDraftEntry {
  id: string;
  savedAt: string;
  draft: GeneratedDraft;
}

interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDrafts: SavedDraftEntry[];
  onLoadDraft: (entry: SavedDraftEntry) => void;
  onDeleteDraft: (id: string) => void;
}

export const SavedDraftsModal: React.FC<SavedDraftsModalProps> = ({
  isOpen,
  onClose,
  savedDrafts,
  onLoadDraft,
  onDeleteDraft
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-950 text-white p-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/80 rounded-lg text-blue-200">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Bóveda de Borradores Guardados
              </h2>
              <p className="text-xs text-blue-200">
                Historial de providencias y escritos procesales de tu firma
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white hover:bg-blue-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {savedDrafts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
              <Scale className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800 mb-1">No tienes borradores guardados aún</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cuando generes una providencia o escrito en el lienzo de trabajo, haz clic en el botón <strong>" Guardar Borrador"</strong> para editarlo o revisarlo días después.
              </p>
            </div>
          ) : (
            savedDrafts.map((entry) => {
              const wordCount = entry.draft.legalText.split(/\s+/).filter(Boolean).length;
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded uppercase">
                        {entry.draft.documentType}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.savedAt}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate">
                      {entry.draft.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {entry.draft.legalText.substring(0, 140)}...
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>{wordCount} palabras</span>
                      <span>•</span>
                      <span>{entry.draft.jurisprudenciaCitada.length} sentencias citadas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        onLoadDraft(entry);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir en Editor</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDraft(entry.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar borrador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex justify-between items-center text-xs text-slate-500">
          <span>{savedDrafts.length} borradores guardados en la firma</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
