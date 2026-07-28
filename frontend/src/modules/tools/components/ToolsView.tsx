import React, { useState } from 'react';
import { Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';

export const ToolsView: React.FC = () => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const tools = [
    {
      id: 'terms',
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-800',
      title: 'Calculadora de Términos Procesales',
      description: 'Computa días hábiles procesales descontando vacantes judiciales, feriados y semanas santas conforme al CGP y CPTSS.',
      action: () => setIsTermsModalOpen(true),
      buttonLabel: 'Abrir calculadora',
      buttonClass: 'bg-blue-950 hover:bg-blue-900'
    },
    {
      id: 'settlement',
      icon: DollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      title: 'Liquidación de Acreencias Laborales',
      description: 'Calcula indemnizaciones por despido sin justa causa (Art. 64 CST), sanciones moratorias (Art. 65 CST) y agencias en derecho.',
      action: () => setIsSettlementModalOpen(true),
      buttonLabel: 'Abrir liquidación',
      buttonClass: 'bg-emerald-800 hover:bg-emerald-700'
    }
  ];

  return (
    <div className="flex-1 bg-slate-50/50 p-6 lg:p-8 overflow-y-auto font-sans">
      <ProceduralTermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <LaborSettlementModal isOpen={isSettlementModalOpen} onClose={() => setIsSettlementModalOpen(false)} />

      <div className="max-w-4xl mx-auto space-y-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.id} className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-5 hover:border-slate-300 transition-colors group">
              <div className={`w-12 h-12 rounded-xl ${tool.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${tool.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-slate-900">{tool.title}</h3>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{tool.description}</p>
              </div>
              <button
                onClick={tool.action}
                className={`px-4 py-2.5 ${tool.buttonClass} text-white font-semibold rounded-xl text-[12px] flex items-center gap-2 transition-colors flex-shrink-0`}
              >
                <span>{tool.buttonLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
