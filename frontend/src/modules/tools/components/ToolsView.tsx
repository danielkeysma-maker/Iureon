import React, { useState } from 'react';
import { Calendar, DollarSign, ArrowRight, BookOpen, Search, BookMarked, Sparkles } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';

interface GlossaryTerm {
  term: string;
  category: 'CONSTITUCIONAL' | 'CIVIL_CGP' | 'LABORAL_CST' | 'ADMINISTRATIVO_CPACA' | 'PENAL';
  definition: string;
  legalBasis: string;
  exampleUsage: string;
}

const LEGAL_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Ratio Decidendi',
    category: 'CONSTITUCIONAL',
    definition: 'Es la razón directa de la decisión o el fundamento jurídico esencial e inescindible en que se apoya la parte resolutiva de una sentencia.',
    legalBasis: 'Precedente obligatorio de la Corte Constitucional (Sentencia C-037 de 1996)',
    exampleUsage: 'La Ratio Decidendi de la Sentencia SU-049-2022 ampara la estabilidad laboral reforzada por fuero de salud.'
  },
  {
    term: 'Obiter Dictum',
    category: 'CONSTITUCIONAL',
    definition: 'Expresiones, reflexiones o consideraciones de paso formuladas por el juez que no son indispensables para fundamentar la decisión principal.',
    legalBasis: 'Jurisprudencia Constitucional de Unificación',
    exampleUsage: 'Dicha afirmación sobre la responsabilidad previa constituye un simple Obiter Dictum en la providencia.'
  },
  {
    term: 'Excepción de Mérito',
    category: 'CIVIL_CGP',
    definition: 'Medio de defensa presentado por el demandado que ataca directamente la pretensión de la demanda alegando hechos extintivos, impeditivos o modificatorios.',
    legalBasis: 'Artículo 282 del Código General del Proceso (Ley 1564 de 2012)',
    exampleUsage: 'Formulo la excepción de mérito de Prescripción Trienal del crédito laboral reclamado.'
  },
  {
    term: 'Auto Admisorio de la Demanda',
    category: 'CIVIL_CGP',
    definition: 'Providencia judicial interlocutoria que admite formalmente a trámite la demanda por reunir la totalidad de los requisitos formales de ley.',
    legalBasis: 'Artículos 82, 84 y 90 del Código General del Proceso',
    exampleUsage: 'El Despacho dictó Auto Admisorio disponiendo la notificación personal del demandado.'
  },
  {
    term: 'Auto Inadmisorio de la Demanda',
    category: 'CIVIL_CGP',
    definition: 'Providencia judicial mediante la cual el juez señala los defectos subsanables de la demanda y otorga un término de 5 días para subsanar.',
    legalBasis: 'Artículo 90 del Código General del Proceso',
    exampleUsage: 'La demanda fue inadmitida por omitir el requisito de procedibilidad de la conciliación extrajudicial.'
  },
  {
    term: 'Prescripción Trienal Laboral',
    category: 'LABORAL_CST',
    definition: 'Extinción de las acciones y acreencias derivadas de las leyes sociales por el transcurso de tres (3) años contados desde que la obligación se hizo exigible.',
    legalBasis: 'Artículo 151 del Código Procesal del Trabajo y de la Seguridad Social',
    exampleUsage: 'Los recargos nocturnos de hace cuatro años se encuentran afectados por la Prescripción Trienal.'
  },
  {
    term: 'Habeas Data',
    category: 'CONSTITUCIONAL',
    definition: 'Derecho fundamental que faculta a toda persona para conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ella en bancos de datos.',
    legalBasis: 'Artículo 15 de la Constitución Política & Ley Estatutaria 1266 de 2008',
    exampleUsage: 'La acción tuteló el derecho al Habeas Data ordenando la rectificación de la fotomulta injusta.'
  },
  {
    term: 'Requisito de Procedibilidad',
    category: 'CIVIL_CGP',
    definition: 'Trámite previo y obligatorio exige la ley (como la conciliación extrajudicial) antes de acudir ante la jurisdicción ordinaria.',
    legalBasis: 'Ley 2220 de 2022 & Artículo 90 Numeral 7° del CGP',
    exampleUsage: 'Se aportó el acta de conciliación como cumplimiento del requisito de procedibilidad.'
  },
  {
    term: 'Juramento Estimatorio',
    category: 'CIVIL_CGP',
    definition: 'Requisito formal de la demanda para indemnizaciones, frutos o mejoras, donde la parte estima bajo la gravedad del juramento su monto.',
    legalBasis: 'Artículo 206 del Código General del Proceso',
    exampleUsage: 'El demandante debe fundamentar el juramento estimatorio discriminando los conceptos de la indemnización.'
  },
  {
    term: 'Litisconsorcio Necesario',
    category: 'CIVIL_CGP',
    definition: 'Situación procesal en la que la relación jurídica sustancial es una e indivisible, obligando a integrar al proceso a todos los sujetos.',
    legalBasis: 'Artículo 61 del Código General del Proceso',
    exampleUsage: 'Se ordenó la vinculación del co-propietario por configurarse un litisconsorcio necesario.'
  }
];

export const ToolsView: React.FC = () => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  const filteredGlossary = LEGAL_GLOSSARY.filter((item) => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.legalBasis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'TODOS' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="flex-1 bg-slate-50/50 p-6 lg:p-8 overflow-y-auto font-sans space-y-8">
      <ProceduralTermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <LaborSettlementModal isOpen={isSettlementModalOpen} onClose={() => setIsSettlementModalOpen(false)} />

      {/* CALCULATOR TOOLS SECTION */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Herramientas de Cálculo Procesal</h2>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div key={tool.id} className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-5 hover:border-slate-300 transition-colors group shadow-sm">
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

      {/* COMPREHENSIVE LEGAL GLOSSARY SECTION */}
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="bg-blue-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-300" />
              <h2 className="text-base font-bold text-white">Glosario Jurídico Colombiano</h2>
            </div>
            <p className="text-xs text-blue-200">
              Diccionario de términos procesales, conceptos dogmáticos y fundamentos legales
            </p>
          </div>

          {/* Search bar inside glossary */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar término o norma..."
              className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-blue-200 focus:outline-none focus:bg-white/20"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['TODOS', 'CONSTITUCIONAL', 'CIVIL_CGP', 'LABORAL_CST', 'ADMINISTRATIVO_CPACA'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Glossary Terms List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredGlossary.length === 0 ? (
            <div className="text-center py-8 bg-white border border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500">No se encontraron términos para "{searchTerm}".</p>
            </div>
          ) : (
            filteredGlossary.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-2.5 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-900" />
                    <span>{item.term}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {item.definition}
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                    <Sparkles className="w-3 h-3 text-blue-700" />
                    <span>Base Legal: {item.legalBasis}</span>
                  </div>
                  <p className="text-slate-600 italic">Ejemplo en escrito: "{item.exampleUsage}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
