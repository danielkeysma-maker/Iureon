import React, { useState } from 'react';
import { X, Sparkles, Check, BookOpen, BrainCircuit } from 'lucide-react';

interface SuggestionOption {
  phrase: string;
  description: string;
  isLearnedFromFirm: boolean;
}

interface JargonSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onApplyReplacement: (replacement: string) => void;
}

export const JargonSuggestionModal: React.FC<JargonSuggestionModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  onApplyReplacement
}) => {
  const [suggestions] = useState<SuggestionOption[]>([
    {
      phrase: 'desestimar de plano',
      description: 'Término procesal de alta técnica jurídica en procesal civil/laboral',
      isLearnedFromFirm: true
    },
    {
      phrase: 'declarar la improcedencia formal',
      description: 'Sugerencia doctrinal estándar para excepciones y acciones',
      isLearnedFromFirm: false
    },
    {
      phrase: 'resolver de pleno derecho',
      description: 'Terminación obligacional de plena vigencia',
      isLearnedFromFirm: false
    }
  ]);

  const [customWord, setCustomWord] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 border border-blue-950 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Asistente de Jerga &amp; Vocabulario Jurídico Inteligente
              </h3>
              <p className="text-[11px] text-slate-500 font-body">
                Combina términos aprendidos de tu firma y sugerencias avanzadas de la IA.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Word Indicator */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-body">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between font-mono">
            <div className="flex items-center gap-2 text-slate-700">
              <BookOpen className="w-4 h-4 text-blue-900" />
              <span className="text-slate-500">Texto Seleccionado:</span>
              <span className="font-bold text-slate-900">"{selectedText || 'rechazar'}"</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-bold">
              3 OPCIONES
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">Sugerencias de Jerga Recomendadas:</label>
            <div className="space-y-2">
              {suggestions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onApplyReplacement(opt.phrase);
                    onClose();
                  }}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-900 rounded-lg transition-colors cursor-pointer flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs font-mono group-hover:text-blue-900">
                        {opt.phrase}
                      </span>
                      {opt.isLearnedFromFirm ? (
                        <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <BrainCircuit className="w-2.5 h-2.5 text-emerald-700" />
                          Aprendido de tu Firma
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded">
                          Sugerencia IA Avanzada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-body">{opt.description}</p>
                  </div>

                  <button className="px-2.5 py-1 bg-slate-100 group-hover:bg-blue-900 group-hover:text-white text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0">
                    <Check className="w-3 h-3" />
                    <span>Aplicar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Term Addition */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">Escribir Jerga o Frase Personalizada:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customWord}
                onChange={(e) => setCustomWord(e.target.value)}
                placeholder="Ej: Desestimar por falta de legitimación en la causa"
                className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 text-xs font-sans focus:outline-none focus:border-blue-900"
              />
              <button
                type="button"
                disabled={!customWord.trim()}
                onClick={() => {
                  onApplyReplacement(customWord);
                  onClose();
                }}
                className="px-3 py-2 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white rounded font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                Sustituir &amp; Enseñar a la IA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
