import React from 'react';
import { X, Scale, Calendar, User, FileText, CheckCircle, BookOpen } from 'lucide-react';

export interface ProvidenciaDetail {
  numeroProvidencia: string;
  corporacion: string;
  tipoSentencia: string;
  rama: string;
  magistradoPonente: string;
  ano: number;
  hechosClave: string;
  ratioDecidendi: string;
  resuelveOutcome: string;
  fullText: string;
}

interface FullProvidenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  providencia: ProvidenciaDetail | null;
}

export const FullProvidenciaModal: React.FC<FullProvidenciaModalProps> = ({
  isOpen,
  onClose,
  providencia
}) => {
  if (!isOpen || !providencia) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/60 rounded-lg text-blue-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                {providencia.corporacion} • {providencia.rama}
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">
                {providencia.numeroProvidencia}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Ponente: <strong className="text-slate-800">{providencia.magistradoPonente}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Año: <strong className="text-slate-800">{providencia.ano}</strong>
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
              TIPO {providencia.tipoSentencia}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
              providencia.resuelveOutcome === 'CONCEDIDO' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              <CheckCircle className="w-3 h-3" />
              {providencia.resuelveOutcome}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
          
          {/* Key Facts Summary */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              Sustento Fáctico & Hechos Clave
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">{providencia.hechosClave}</p>
          </div>

          {/* Ratio Decidendi */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              Ratio Decidendi (Precedente Obligatorio)
            </h4>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">{providencia.ratioDecidendi}</p>
          </div>

          {/* Full Text Paper View */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Texto Oficial de la Providencia</span>
              <span className="text-[10px] text-slate-400 font-mono">Relatoría Judicial Colombiana</span>
            </div>

            <div className="font-serif text-sm leading-relaxed text-slate-900 whitespace-pre-wrap space-y-4">
              {providencia.fullText}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">Corpus Jurídico RAG • IUREON Colombia</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${providencia.numeroProvidencia}\n${providencia.ratioDecidendi}\n\n${providencia.fullText}`);
                alert('Sentencia copiada al portapapeles');
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Copiar Sentencia
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
