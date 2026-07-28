import React, { useState } from 'react';
import { X, Search, BookOpen, Scale, Check, Copy, Globe, ThumbsUp, ThumbsDown } from 'lucide-react';

interface LegalSearchGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCitation?: (citation: string) => void;
}

export const LegalSearchGlossaryModal: React.FC<LegalSearchGlossaryModalProps> = ({
  isOpen,
  onClose,
  onInsertCitation
}) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'search' | 'web_precedents'>('web_precedents');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const glossaryItems = [
    {
      id: 'glo-001',
      term: 'Prescripción Trienal Laboral',
      category: 'LABORAL',
      definition: 'Extinción del derecho de acción por el transcurso de tres (3) años continuos contados desde que la obligación se hizo exigible.',
      normative: 'Art. 151 CPTSS & Art. 488 CST',
      citation: 'Conforme a la prescripción trienal laboral estipulada en el artículo 151 del CPTSS...'
    },
    {
      id: 'glo-002',
      term: 'Control de Convencionalidad',
      category: 'INTERNACIONAL',
      definition: 'Mecanismo mediante el cual los jueces nacionales verifican la conformidad de las leyes internas con la Convención Americana sobre Derechos Humanos.',
      normative: 'Pacto de San José & Art. 93 C.P.',
      citation: 'Solicito al juez aplicar el control de convencionalidad difuso de oficio...'
    }
  ];

  const searchResults = [
    {
      id: 'leg-001',
      type: 'SENTENCIA',
      title: 'Interrupción de Prescripción Laboral exige Reclamo Escrito',
      corporation: 'Corte Suprema de Justicia - Sala Laboral',
      reference: 'Sentencia SL-4102-2023',
      summary: 'La Sala aclara que las reclamaciones verbales no interrumpen el término prescriptivo de 3 años del artículo 151 del CPTSS.',
      citation: 'Corte Suprema de Justicia, Sala Laboral, Sentencia SL-4102-2023.'
    }
  ];

  const webPrecedents = [
    {
      id: 'web-001',
      caseTitle: 'Reclamación de Horas Extras en Modalidad Teletrabajo',
      tribunal: 'Corte Suprema de Justicia - Sala Laboral (2024)',
      outcome: 'CONCEDIDO',
      keyFact: 'Trabajador acreditó correos y chats fuera de la jornada ordinaria fijada en el contrato.',
      ratioDecidendi: 'La disponibilidad permanente fuera de la jornada constituye trabajo suplementario con recargo legal.',
      citation: 'Corte Suprema de Justicia, Sala Laboral, Sentencia 2024 (Reconocimiento Horas Extras Teletrabajo).'
    },
    {
      id: 'web-002',
      caseTitle: 'Cobro de Sanción Moratoria por Retardo en Pago de Salarios (Art. 65 CST)',
      tribunal: 'Corte Suprema de Justicia - Sala Laboral (2023)',
      outcome: 'NEGADO',
      keyFact: 'El empleador demostró buena fe al retener los valores en razón a dudas razonables sobre la liquidación.',
      ratioDecidendi: 'La sanción moratoria no opera de forma automática e inexorable; requiere probar mala fe del empleador.',
      citation: 'Corte Suprema de Justicia, Sala Laboral, Sentencia SL-2023 (Exoneración Sanción Moratoria por Buena Fe).'
    },
    {
      id: 'web-003',
      caseTitle: 'Nulidad de Sanción Administrativa por Indebida Notificación',
      tribunal: 'Consejo de Estado - Sección Primera (2023)',
      outcome: 'CONCEDIDO',
      keyFact: 'La entidad pública notificó el acto sancionatorio a una dirección no registrada en el RUES.',
      ratioDecidendi: 'La falla en el procedimiento de notificación vulnera de nulidad el acto por violación del debido proceso.',
      citation: 'Consejo de Estado, Sección Primera, Sentencia 2023 (Nulidad por Notificación Defectuosa).'
    }
  ];

  if (!isOpen) return null;

  const handleCopyCitation = (id: string, citation: string) => {
    navigator.clipboard.writeText(citation);
    setCopiedId(id);
    if (onInsertCitation) {
      onInsertCitation(citation);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 border border-blue-950 flex items-center justify-center text-white">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Buscador RAG de Leyes &amp; Precedentes Web (Concedidos vs. Negados)
              </h3>
              <p className="text-[11px] text-slate-500 font-body">
                Indexación en vivo de sentencias, doctrina y análisis de casos amparados y desestimados.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs & Search Input */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('web_precedents')}
                className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'web_precedents'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Casos Web (Concedidos / Negados)</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'search'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5 text-blue-900" />
                <span>Sentencias Hito &amp; Leyes</span>
              </button>

              <button
                onClick={() => setActiveTab('glossary')}
                className={`px-3 py-1.5 rounded-md transition-all text-xs font-bold flex items-center gap-1.5 ${
                  activeTab === 'glossary'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-900" />
                <span>Glosario</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en la web precedentes similares por tema o hechos clave..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 text-xs font-sans focus:outline-none focus:border-blue-900"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs font-body flex-1 bg-slate-50/50">
          {activeTab === 'web_precedents' ? (
            <div className="space-y-3">
              {webPrecedents.map((item) => (
                <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.outcome === 'CONCEDIDO' ? (
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-emerald-700" />
                          DERECHO CONCEDIDO
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3 text-rose-700" />
                          DERECHO NEGADO
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 text-xs font-sans">{item.caseTitle}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      {item.tribunal}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p><span className="font-bold text-slate-800">Hecho Relevante:</span> {item.keyFact}</p>
                    <p><span className="font-bold text-slate-800">Ratio Decidendi:</span> {item.ratioDecidendi}</p>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleCopyCitation(item.id, item.citation)}
                      className="px-3 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Citado' : 'Citar Precedente Web'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'search' ? (
            <div className="space-y-3">
              {searchResults.map((item) => (
                <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs font-sans">{item.title}</h4>
                  <p className="text-[11px] text-slate-600">{item.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {glossaryItems.map((item) => (
                <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs font-sans">{item.term}</h4>
                  <p className="text-[11px] text-slate-600">{item.definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
