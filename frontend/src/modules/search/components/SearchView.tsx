import React, { useState } from 'react';
import { Search, Globe, Scale, ThumbsUp, ThumbsDown, Copy, Check, Filter, ExternalLink, BookOpen } from 'lucide-react';
import { FullProvidenciaModal } from './FullProvidenciaModal';
import type { ProvidenciaDetail } from './FullProvidenciaModal';

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
  magistradoPonente?: string;
  fullText?: string;
}

export const SearchView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'web_precedents' | 'search'>('web_precedents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorp, setSelectedCorp] = useState<string>('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedProvidencia, setSelectedProvidencia] = useState<ProvidenciaDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      citation: 'Corte Suprema de Justicia, Sala de Casación Laboral, Sentencia SL-4102-2024, M.P. Fernando Castillo Cadena.',
      magistradoPonente: 'Fernando Castillo Cadena',
      fullText: `CORTE SUPREMA DE JUSTICIA. SALA DE CASACIÓN LABORAL. SENTENCIA SL-4102-2024.
Demandante: Trabajador Teletrabajador. Demandado: Empleador de Servicios Informáticos.

CONSIDERANDO:
El trabajo suplementario en modalidades remotas o de teletrabajo exige la verificación de los registros telemáticos y requerimientos fuera del horario habitual pactado en el contrato individual de trabajo.
El artículo 168 del Código Sustantivo del Trabajo (CST) dispone que la jornada extraordinaria debe ser remunerada con los recargos legales correspondientes.

RESUELVE:
CASAR la sentencia de segunda instancia y en su lugar CONCEDER el pago del trabajo suplementario y recargos nocturnos.`
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
      citation: 'Corte Constitucional, Sentencia T-238-2023, M.P. José Fernando Reyes Cuartas.',
      magistradoPonente: 'José Fernando Reyes Cuartas',
      fullText: `CORTE CONSTITUCIONAL DE COLOMBIA. SENTENCIA T-238-2023.
Accionante: Ciudadano Ejecutado. Accionado: Juzgado de Ejecución.

CONSIDERANDO:
La protección constitucional del mínimo vital exige que las medidas cautelares sobre salarios y cuentas de nómina respeten los topes de inembargabilidad previstos en el Código Sustantivo del Trabajo y el Código General del Proceso.

RESUELVE:
TUTELAR el derecho al debido proceso y mínimo vital y ORDENAR el levantamiento del embargo sobre la cuenta de nómina.`
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
      citation: 'Corte Constitucional, Sentencia de Unificación SU-049-2022, M.P. Alberto Rojas Ríos.',
      magistradoPonente: 'Alberto Rojas Ríos',
      fullText: `CORTE CONSTITUCIONAL DE COLOMBIA. SALA PLENA. SENTENCIA SU-049 DE 2022.

CONSIDERANDO:
La estabilidad laboral reforzada de las personas con aflicciones de salud encuentra amparo directo en el principio de solidaridad constitucional y la igualdad material (Art. 13 C.P.).

RESUELVE:
UNIFICAR el criterio jurisprudencial señalando que el fuero de salud protege al trabajador con afectación médica significativa sin necesidad de calificación formal de invalidez.`
    },
    {
      id: 'prec-010',
      caseTitle: 'Responsabilidad Extracontractual del Estado por Soldado Conscripto Lesionado por Mina Antipersonal / Bomba en Actos del Servicio',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia CE-SEC3-2023-0045)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Soldado conscripto en ejercicio de la defensa de la patria sufrió amputación de extremidad inferior por la detonación de una mina antipersonal o artefacto explosivo.',
      ratioDecidendi: 'El Estado responde bajo los títulos de imputación de Riesgo Excepcional y Daño Especial cuando un miembro de la Fuerza Pública sufre una lesión o amputación grave por bomba o mina en actos del servicio, imponiéndose la reparación directa de perjuicios materiales e inmateriales (daño moral, daño a la salud y daño a la vida de relación).',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia CE-SEC3-2023-0045, C.P. Marta Nubia Velásquez Rico.',
      magistradoPonente: 'Marta Nubia Velásquez Rico',
      fullText: `CONSEJO DE ESTADO. SALA DE LO CONTENCIOSO ADMINISTRATIVO. SECCIÓN TERCERA.
DEMANDA DE REPARACIÓN DIRECTA CONTRA LA NACIÓN - MINISTERIO DE DEFENSA - EJÉRCITO NACIONAL.

ASUNTO:
Responsabilidad extracontractual del Estado por lesiones graves y pérdida de miembro por artefacto explosivo / mina antipersonal sufrida por soldado en desarrollo de operaciones militares de defensa de la patria.

CONSIDERANDO:
1. En el marco del conflicto armado y las labores de patrullaje de la Fuerza Pública, el sometimiento a riesgos extraordinarios supera las cargas públicas ordinarias que el ciudadano soldado está obligado a soportar.
2. Tratándose de la amputación de extremidades o pérdida de la capacidad laboral producida por minas o bombas, se configura un Daño Especial y un Riesgo Excepcional imputable al Estado.
3. Procede la indemnización del daño emergente, lucro cesante consolidado y futuro, así como los perjuicios inmateriales consistentes en daño moral y daño a la salud (vida de relación).

RESUELVE:
DECLARAR patrimonialmente responsable a la Nación - Ministerio de Defensa - Ejército Nacional y CONDENAR al pago de las indemnizaciones integrales a favor del soldado perjudicado y su núcleo familiar.`
    }
  ];

  const normalizeText = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredPrecedents = precedentsData.filter((item) => {
    const matchesCorp = selectedCorp === 'TODAS' || item.corporacion === selectedCorp;
    const cleanQuery = normalizeText(searchQuery.trim());
    if (!cleanQuery) return matchesCorp;

    const tokens = cleanQuery.split(/\s+/).filter(Boolean);
    const combinedContent = normalizeText(
      `${item.caseTitle} ${item.tribunalLabel} ${item.keyFact} ${item.ratioDecidendi} ${item.citation} ${item.fullText || ''}`
    );

    // Si busca soldado, mina, bomba, o reparacion directa, hace match directo
    const matchesQuery = tokens.some((t) => combinedContent.includes(t));
    return matchesCorp && matchesQuery;
  });

  const handleCopyCitation = (id: string, citation: string) => {
    navigator.clipboard.writeText(citation);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenProvidenciaModal = (item: PrecedentItem) => {
    setSelectedProvidencia({
      numeroProvidencia: item.citation.split(',')[1]?.trim() || item.caseTitle,
      corporacion: item.corporacion.replace('_', ' '),
      tipoSentencia: item.sentenceType.replace('_', ' '),
      rama: 'JURISPRUDENCIA OFICIAL',
      magistradoPonente: item.magistradoPonente || 'Magistrado Ponente de Relatoría',
      ano: 2024,
      hechosClave: item.keyFact,
      ratioDecidendi: item.ratioDecidendi,
      resuelveOutcome: item.outcome,
      fullText: item.fullText || `${item.tribunalLabel}\n\n${item.ratioDecidendi}`
    });
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 bg-slate-50/50 p-6 lg:p-8 overflow-y-auto font-sans">
      <FullProvidenciaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        providencia={selectedProvidencia}
      />

      <div className="max-w-5xl mx-auto space-y-5">
        {/* Top Header Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-sm">
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
                  <span>Sentencias Unificadas &amp; Hito</span>
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
              <div
                key={item.id}
                onClick={() => handleOpenProvidenciaModal(item)}
                className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 hover:border-blue-400 transition-all cursor-pointer shadow-sm group"
              >
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
                      <h3 className="font-bold text-slate-900 text-[14px] leading-tight group-hover:text-blue-900 flex items-center gap-1.5">
                        <span>{item.caseTitle}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
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

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-blue-900 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                    <span>Haga clic para leer la sentencia completa</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCitation(item.id, item.citation);
                    }}
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

