import React, { useState } from 'react';
import { Search, Globe, Scale, ThumbsUp, ThumbsDown, Copy, Check, Filter } from 'lucide-react';

export interface PrecedentItem {
  id: string;
  caseTitle: string;
  corporacion: 'CORTE_CONSTITUCIONAL' | 'CORTE_SUPREMA' | 'CONSEJO_ESTADO' | 'TRIBUNAL_SUPERIOR' | 'TRIBUNAL_ADMINISTRATIVO';
  tribunalLabel: string;
  sentenceType: 'SENTENCIA_T' | 'SENTENCIA_C' | 'SENTENCIA_SU' | 'CASACION_SL' | 'CASACION_SC' | 'CASACION_SP' | 'CPACA_NULIDAD' | 'AUTO_TRIBUNAL';
  outcome: 'CONCEDIDO' | 'NEGADO';
  keyFact: string;
  ratioDecidendi: string;
  citation: string;
}

export const SearchView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'web_precedents' | 'search'>('web_precedents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorp, setSelectedCorp] = useState<string>('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const precedentsData: PrecedentItem[] = [
    {
      id: 'prec-001',
      caseTitle: 'Reclamación de Horas Extras y Horario en Modalidad Teletrabajo',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Laboral (Sentencia SL-4102-2024)',
      sentenceType: 'CASACION_SL',
      outcome: 'CONCEDIDO',
      keyFact: 'Trabajador aportó correos corporativos y registros telemáticos emitidos fuera de la jornada legal fijada en el contrato laboral.',
      ratioDecidendi: 'La disponibilidad técnica y requerimiento laboral continuo fuera del horario ordinario configura trabajo suplementario sujeto a recargos del Art. 168 CST.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Laboral, Sentencia SL-4102-2024, M.P. Fernando Castillo Cadena.'
    },
    {
      id: 'prec-002',
      caseTitle: 'Acción de Tutela contra Providencia Judicial por Vía de Hecho en Proceso Ejecutivo',
      corporacion: 'CORTE_CONSTITUCIONAL',
      tribunalLabel: 'Corte Constitucional — Sala de Revisión (Sentencia T-238-2023)',
      sentenceType: 'SENTENCIA_T',
      outcome: 'CONCEDIDO',
      keyFact: 'El juez ejecutor decretó el embargo de cuentas de nómina sin verificar el límite legal de inembargabilidad establecido en la ley.',
      ratioDecidendi: 'Constituye defecto fáctico y orgánico la afectación del mínimo vital del ejecutado cuando se omiten los topes legales de inembargabilidad del salario.',
      citation: 'Corte Constitucional, Sentencia T-238-2023, M.P. José Fernando Reyes Cuartas.'
    },
    {
      id: 'prec-003',
      caseTitle: 'Unificación sobre Estabilidad Laboral Reforzada por Condición de Salud',
      corporacion: 'CORTE_CONSTITUCIONAL',
      tribunalLabel: 'Corte Constitucional — Sala Plena (Sentencia de Unificación SU-049-2022)',
      sentenceType: 'SENTENCIA_SU',
      outcome: 'CONCEDIDO',
      keyFact: 'Trabajador fue despedido sin autorización del Ministerio del Trabajo teniendo una limitación física conocida por el empleador.',
      ratioDecidendi: 'La protección de la estabilidad laboral reforzada del Art. 26 Ley 361 de 1997 no exige carné de discapacidad; basta la afectación de salud conocida.',
      citation: 'Corte Constitucional, Sentencia de Unificación SU-049-2022, M.P. Alberto Rojas Ríos.'
    },
    {
      id: 'prec-004',
      caseTitle: 'Sanción Moratoria por No Pago de Cesantías (Art. 65 CST) — Exoneración por Buena Fe',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Laboral (Sentencia SL-1892-2023)',
      sentenceType: 'CASACION_SL',
      outcome: 'NEGADO',
      keyFact: 'El empleador acreditó dudas razonables en el cálculo del salario variable al momento de la liquidación final.',
      ratioDecidendi: 'La sanción moratoria del Art. 65 del CST no es de aplicación automática; requiere la demostración de mala fe por parte del empleador.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Laboral, Sentencia SL-1892-2023, M.P. Gerardo Botero Zuluaga.'
    },
    {
      id: 'prec-005',
      caseTitle: 'Nulidad y Restablecimiento del Derecho por Defectuosa Notificación del Acto Sancionatorio',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Primera (Sentencia 11001-03-24-2023-0012-00)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Entidad de control envió citación para notificación personal a una dirección distinta a la registrada en el RUES.',
      ratioDecidendi: 'La indebida notificación vulnera el debido proceso y la garantía de defensa, acarreando la nulidad absoluta del acto administrativo sancionatorio.',
      citation: 'Consejo de Estado, Sección Primera, Sentencia del 14 de Septiembre de 2023, C.P. Roberto Augusto Serrato Valdés.'
    },
    {
      id: 'prec-006',
      caseTitle: 'Exclusión de Prueba Ilícita por Violación de Garantías Constitucionales en Proceso Penal',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Penal (Sentencia SP-1204-2023)',
      sentenceType: 'CASACION_SP',
      outcome: 'CONCEDIDO',
      keyFact: 'Allanamiento y registro ejecutado sin orden judicial previa ni configuración de flagrancia legalmente válida.',
      ratioDecidendi: 'Toda prueba derivada de registros domiciliarios practicados con violación de garantías fundamentales queda viciada de nulidad de pleno derecho por cláusula de exclusión.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Penal, Sentencia SP-1204-2023, M.P. Gerson Chaverra Castro.'
    },
    {
      id: 'prec-007',
      caseTitle: 'Responsabilidad Civil Extracontractual por Accidente de Tránsito y Daño Moral',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Civil (Sentencia SC-5186-2022)',
      sentenceType: 'CASACION_SC',
      outcome: 'CONCEDIDO',
      keyFact: 'Empresa de transporte público alegó fuerza mayor por falla mecánica no imputable al conductor.',
      ratioDecidendi: 'El fallo mecánico previsible no configura fuerza mayor o caso fortuito en actividades peligrosas; opera la presunción de responsabilidad del explotador.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Civil, Sentencia SC-5186-2022, M.P. Luis Alonso Rico Puerta.'
    },
    {
      id: 'prec-008',
      caseTitle: 'Declaración de Contrato de Realidad en Entidad Pública por Vinculación Continua',
      corporacion: 'TRIBUNAL_ADMINISTRATIVO',
      tribunalLabel: 'Tribunal Administrativo de Cundinamarca — Sección Segunda (Sentencia TAC-089-2024)',
      sentenceType: 'AUTO_TRIBUNAL',
      outcome: 'CONCEDIDO',
      keyFact: 'Contratista de prestación de servicios prestó labores administrativas subordinadas bajo horarios fijos durante 6 años ininterrumpidos.',
      ratioDecidendi: 'La primacía de la realidad sobre las formas impone el reconocimiento de la relación laboral y las prestaciones sociales independientemente de la denominación del contrato.',
      citation: 'Tribunal Administrativo de Cundinamarca, Sección Segunda, Sentencia TAC-089-2024, M.P. Bertha Lucía Ramírez.'
    },
    {
      id: 'prec-009',
      caseTitle: 'Recurso de Apelación en Excepción de Prescripción Trienal en Demanda Ordinaria Laboral',
      corporacion: 'TRIBUNAL_SUPERIOR',
      tribunalLabel: 'Tribunal Superior de Bogotá — Sala Laboral (Sentencia TSB-LAB-2024-1102)',
      sentenceType: 'AUTO_TRIBUNAL',
      outcome: 'NEGADO',
      keyFact: 'El demandante interrumpió legalmente el término prescriptivo mediante reclamación escrita radicada directamente ante el empleador.',
      ratioDecidendi: 'La reclamación formal recibida por el empleador suspende por una sola vez el término trienal de prescripción del Art. 151 CPTSS por un lapso igual.',
      citation: 'Tribunal Superior del Distrito Judicial de Bogotá, Sala Laboral, Sentencia TSB-LAB-2024-1102.'
    }
  ];

  const filteredPrecedents = precedentsData.filter((item) => {
    const matchesCorp = selectedCorp === 'TODAS' || item.corporacion === selectedCorp;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tribunalLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyFact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ratioDecidendi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.citation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCorp && matchesQuery;
  });

  const handleCopyCitation = (id: string, citation: string) => {
    navigator.clipboard.writeText(citation);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 bg-slate-50/50 p-6 lg:p-8 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Header Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar precedentes, sentencias T/C/SU, casaciones o normas..."
                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 text-[13px] font-sans focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-[12px]">
                <button
                  onClick={() => setActiveTab('web_precedents')}
                  className={`px-3 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                    activeTab === 'web_precedents' ? 'bg-blue-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Casos RAG</span>
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-3 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                    activeTab === 'search' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-blue-900" />
                  <span>Relatorías Hito</span>
                </button>
              </div>
            </div>
          </div>

          {/* Jurisdictional Scope Selector */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[12px] flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Corporación:
            </span>
            <button
              onClick={() => setSelectedCorp('TODAS')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedCorp === 'TODAS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Todas (Cortes &amp; Tribunales)
            </button>
            <button
              onClick={() => setSelectedCorp('CORTE_CONSTITUCIONAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedCorp === 'CORTE_CONSTITUCIONAL' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Corte Constitucional (T, C, SU)
            </button>
            <button
              onClick={() => setSelectedCorp('CORTE_SUPREMA')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedCorp === 'CORTE_SUPREMA' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Corte Suprema (SL, SC, SP)
            </button>
            <button
              onClick={() => setSelectedCorp('CONSEJO_ESTADO')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedCorp === 'CONSEJO_ESTADO' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Consejo de Estado
            </button>
            <button
              onClick={() => setSelectedCorp('TRIBUNAL_SUPERIOR')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedCorp === 'TRIBUNAL_SUPERIOR' ? 'bg-blue-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Tribunales Superiores &amp; Adm.
            </button>
          </div>
        </div>

        {/* Precedents List */}
        <div className="space-y-3">
          {filteredPrecedents.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-400 text-[13px]">
              No se encontraron precedentes para la búsqueda o filtro seleccionado.
            </div>
          ) : (
            filteredPrecedents.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {item.outcome === 'CONCEDIDO' ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 text-[13px] leading-tight">{item.caseTitle}</h3>
                      <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">{item.tribunalLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.sentenceType.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.outcome === 'CONCEDIDO' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {item.outcome}
                    </span>
                  </div>
                </div>

                <div className="text-[12px] text-slate-600 space-y-1.5 leading-relaxed bg-slate-50 p-3.5 rounded-lg">
                  <p><span className="font-semibold text-slate-800">Hecho clave:</span> {item.keyFact}</p>
                  <p><span className="font-semibold text-slate-800">Ratio decidendi:</span> {item.ratioDecidendi}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium font-mono truncate max-w-[340px]" title={item.citation}>
                    {item.citation}
                  </span>
                  <button
                    onClick={() => handleCopyCitation(item.id, item.citation)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0"
                  >
                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedId === item.id ? 'Copiado' : 'Copiar cita'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
