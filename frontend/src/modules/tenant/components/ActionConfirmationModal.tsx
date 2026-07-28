import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar Acción',
  confirmVariant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-rose-700 hover:bg-rose-800 text-white',
    primary: 'bg-blue-950 hover:bg-blue-900 text-white',
    success: 'bg-emerald-700 hover:bg-emerald-800 text-white'
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[60] p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-6 space-y-4 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
            confirmVariant === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-900'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-all shadow-xs ${variantStyles[confirmVariant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
