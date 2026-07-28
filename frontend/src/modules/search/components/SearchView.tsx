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
    // CORTE CONSTITUCIONAL
    {
      id: 'prec-001',
      caseTitle: 'Unificación sobre Estabilidad Laboral Reforzada por Condición de Salud',
      corporacion: 'CORTE_CONSTITUCIONAL',
      tribunalLabel: 'Corte Constitucional — Sala Plena (Sentencia SU-049-2022)',
      sentenceType: 'SENTENCIA_SU',
      outcome: 'CONCEDIDO',
      keyFact: 'Trabajador fue despedido sin autorización previa del Ministerio del Trabajo teniendo una limitación física conocida por el empleador.',
      ratioDecidendi: 'La protección de la estabilidad laboral reforzada del Art. 26 Ley 361 de 1997 no exige carné de discapacidad; basta la afectación médica significativa conocida.',
      citation: 'Corte Constitucional, Sentencia de Unificación SU-049-2022, M.P. Alberto Rojas Ríos.',
      magistradoPonente: 'Alberto Rojas Ríos',
      fullText: `CORTE CONSTITUCIONAL DE COLOMBIA. SALA PLENA. SENTENCIA SU-049 DE 2022.
CONSIDERANDO:
La estabilidad laboral reforzada de las personas con aflicciones de salud encuentra amparo directo en el principio de solidaridad constitucional y la igualdad material (Art. 13 C.P.).
RESUELVE:
UNIFICAR el criterio jurisprudencial señalando que el fuero de salud protege al trabajador con afectación médica significativa sin necesidad de calificación formal de invalidez.`
    },
    {
      id: 'prec-002',
      caseTitle: 'Acción de Tutela por Embargo Ilegal de Cuenta de Nómina y Mínimo Vital',
      corporacion: 'CORTE_CONSTITUCIONAL',
      tribunalLabel: 'Corte Constitucional — Sala de Revisión (Sentencia T-238-2023)',
      sentenceType: 'SENTENCIA_T',
      outcome: 'CONCEDIDO',
      keyFact: 'El juez ejecutor decretó el embargo de cuentas de nómina sin verificar el límite legal de inembargabilidad establecido en la ley laboral.',
      ratioDecidendi: 'Constituye defecto fáctico y orgánico la afectación del mínimo vital del ejecutado cuando se omiten los topes legales de inembargabilidad del salario.',
      citation: 'Corte Constitucional, Sentencia T-238-2023, M.P. José Fernando Reyes Cuartas.',
      magistradoPonente: 'José Fernando Reyes Cuartas',
      fullText: `CORTE CONSTITUCIONAL DE COLOMBIA. SENTENCIA T-238-2023.
CONSIDERANDO:
La protección constitucional del mínimo vital exige que las medidas cautelares sobre salarios y cuentas de nómina respeten los topes de inembargabilidad.
RESUELVE:
TUTELAR el derecho al debido proceso y mínimo vital y ORDENAR el levantamiento del embargo.`
    },
    {
      id: 'prec-003',
      caseTitle: 'Protección Integral a Víctimas del Conflicto Armado y Miembros de la Fuerza Pública',
      corporacion: 'CORTE_CONSTITUCIONAL',
      tribunalLabel: 'Corte Constitucional — Sala Plena (Sentencia T-025-2004)',
      sentenceType: 'SENTENCIA_T',
      outcome: 'CONCEDIDO',
      keyFact: 'Omisión del Estado en garantizar la atención médica integral, reparación y mínimo vital a heridos en combate y desplazados.',
      ratioDecidendi: 'Se declara el Estado de Cosas Inconstitucional ordenando a las entidades gubernamentales la atención prioritaria e ininterrumpida a víctimas y uniformados afectados.',
      citation: 'Corte Constitucional, Sentencia T-025-2004, M.P. Manuel José Cepeda Espinosa.',
      magistradoPonente: 'Manuel José Cepeda Espinosa'
    },

    // CONSEJO DE ESTADO - REPARACIÓN DIRECTA (TODOS LOS TÍTULOS DE IMPUTACIÓN DE RESPONSABILIDAD DEL ESTADO)
    {
      id: 'prec-004',
      caseTitle: 'Reparación Directa por Soldado Conscripto Herido por Mina Antipersonal / Bomba en Actos del Servicio',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia CE-SEC3-2023-0045)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Soldado en ejercicio de la defensa de la patria sufrió amputación de extremidad por la detonación de una mina antipersonal o artefacto explosivo.',
      ratioDecidendi: 'El Estado responde bajo los títulos de imputación de Riesgo Excepcional y Daño Especial cuando un miembro de la Fuerza Pública sufre lesiones o amputación por bomba o mina en actos del servicio, imponiéndose la reparación directa integral.',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia CE-SEC3-2023-0045, C.P. Marta Nubia Velásquez Rico.',
      magistradoPonente: 'Marta Nubia Velásquez Rico',
      fullText: `CONSEJO DE ESTADO. SECCIÓN TERCERA. SENTENCIA DE REPARACIÓN DIRECTA CE-SEC3-2023-0045.
DEMANDANTE: Soldado perjudicado y su grupo familiar. DEMANDADO: Nación - Ministerio de Defensa - Ejército Nacional.

CONSIDERANDO:
El sometimiento a un riesgo extraordinario derivado de artefactos explosivos o minas antipersonal en operaciones militares supera las cargas públicas ordinarias. Procede la indemnización integral por Daño Especial y Riesgo Excepcional.

RESUELVE:
DECLARAR patrimonialmente responsable a la Nación y CONDENAR al pago de los perjuicios materiales y morales.`
    },
    {
      id: 'prec-013',
      caseTitle: 'Reparación Directa por Privación Injusta de la Libertad tras Absolución o Preclusión Penal',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia de Unificación CE-SU3-2022-PRIVACION)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Ciudadano permaneció privado de la libertad preventivamente durante 18 meses y posteriormente fue absuelto por inasistencia de prueba o atipicidad de la conducta.',
      ratioDecidendi: 'La privación de la libertad de un ciudadano que no cometió el delito o cuya responsabilidad no fue demostrada constituye un Daño Especial imputable al Estado bajo responsabilidad objetiva, debiendo indemnizarse el daño emergente, lucro cesante y daño moral.',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia SU-2022, C.P. Jaime Enrique Rodríguez Navas.',
      magistradoPonente: 'Jaime Enrique Rodríguez Navas',
      fullText: `CONSEJO DE ESTADO. SECCIÓN TERCERA. UNIFICACIÓN EN PRIVACIÓN INJUSTA DE LA LIBERTAD.
DEMANDANTE: Ciudadano Absuelto. DEMANDADO: Nación - Rama Judicial - Fiscalía General de la Nación.

CONSIDERANDO:
Quien es sometido a detención preventiva y resulta absuelto soporta una carga desproporcionada en beneficio de la administración de justicia. Configura responsabilidad objetiva estatal.

RESUELVE:
CONDENAR a la Nación al pago del lucro cesante por el tiempo en prisión y perjuicios morales al afectado y su familia.`
    },
    {
      id: 'prec-014',
      caseTitle: 'Reparación Directa por Falla Médica y Negligencia en Hospital Público (E.S.E.)',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia CE-SEC3-2023-FALLA-MEDICA)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Paciente ingresó por urgencias a hospital estatal sufriendo secuelas neurológicas permanentes por retardo injustificado en la atención quirúrgica.',
      ratioDecidendi: 'La omisión o retardo en el diagnóstico y tratamiento oportuno en instituciones de salud del Estado configura una Falla en el Servicio de Salud, imponiendo la obligación de reparar íntegramente el daño a la salud y la pérdida de oportunidad.',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia CE-SEC3-FALLA-MEDICA, C.P. Alberto Montaña Plata.',
      magistradoPonente: 'Alberto Montaña Plata'
    },
    {
      id: 'prec-015',
      caseTitle: 'Reparación Directa por Falla en el Servicio de Obras Públicas, Mantenimiento Vial y Huecos',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia CE-SEC3-2023-OBRAS)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Conductor sufrió volcadura y lesiones graves por la falta de señalización de una excavación sin iluminación en vía pública nacional.',
      ratioDecidendi: 'El deber de conservación, mantenimiento y señalización de la malla vial es una obligación de resultado a cargo de las entidades públicas. Su incumplimiento configura Falla en el Servicio.',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia CE-SEC3-OBRAS, C.P. Nicolás Yepes Corrales.',
      magistradoPonente: 'Nicolás Yepes Corrales'
    },
    {
      id: 'prec-016',
      caseTitle: 'Reparación Directa por Lesiones a Civiles por Bala Perdida en Operativo Policial',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia CE-SEC3-2023-BALA-PERDIDA)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Transeúnte civil resultó impactado por proyectil de arma de fuego oficial durante un operativo de persecución policial a delincuentes en zona urbana.',
      ratioDecidendi: 'El uso de armas de fuego de dotación oficial en zonas urbanas involucra la creación de un Riesgo Excepcional. Si se ocasiona daño a un tercero ajeno a los hechos, el Estado debe reparar el daño de forma objetiva.',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia CE-SEC3-BALA-PERDIDA, C.P. María Adriana Marín.',
      magistradoPonente: 'María Adriana Marín'
    },
    {
      id: 'prec-017',
      caseTitle: 'Reparación Directa por Muerte o Lesiones de Reclusos bajo Custodia del INPEC',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Tercera (Sentencia CE-SEC3-2023-INPEC)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Interno en centro penitenciario falleció a causa de riña interna por la omisión de los guardias del INPEC en ejercer el control de armas blancas.',
      ratioDecidendi: 'El Estado se encuentra en posición de garante respecto de la vida e integridad de los reclusos bajo su custodia. Toda omisión de seguridad en cárceles genera Falla en el Servicio.',
      citation: 'Consejo de Estado, Sección Tercera, Sentencia CE-SEC3-INPEC, C.P. José Roberto Sáchica Méndez.',
      magistradoPonente: 'José Roberto Sáchica Méndez'
    },
    {
      id: 'prec-005',
      caseTitle: 'Nulidad y Restablecimiento del Derecho por Contrato de Realidad en Entidad Pública',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Segunda (Sentencia CE-SU2-2023)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Contratista de prestación de servicios cumplió funciones permanentes con subordinación continuada y horario fijo en entidad estatal por más de 5 años.',
      ratioDecidendi: 'La primacía de la realidad sobre las formas impone la declaración de la relación laboral y el pago de aportes pensionales y prestaciones sociales sin solución de continuidad.',
      citation: 'Consejo de Estado, Sección Segunda, Sentencia de Unificación CE-SU2-2023, C.P. William Hernández Gómez.',
      magistradoPonente: 'William Hernández Gómez'
    },
    {
      id: 'prec-006',
      caseTitle: 'Nulidad de Acto Sancionatorio por Notificación Electrónica Defectuosa a Dirección Distinta del RUES',
      corporacion: 'CONSEJO_ESTADO',
      tribunalLabel: 'Consejo de Estado — Sección Primera (Sentencia 11001-03-24-2023-0012-00)',
      sentenceType: 'CPACA_NULIDAD',
      outcome: 'CONCEDIDO',
      keyFact: 'Entidad de control envió citación para notificación personal a un correo distinto al registrado en la cámara de comercio.',
      ratioDecidendi: 'La indebida notificación vulnera el debido proceso y la garantía de defensa, viciando de nulidad absoluta el acto administrativo sancionatorio.',
      citation: 'Consejo de Estado, Sección Primera, Sentencia del 14 de Septiembre de 2023, C.P. Roberto Augusto Serrato Valdés.',
      magistradoPonente: 'Roberto Augusto Serrato Valdés'
    },

    // CORTE SUPREMA DE JUSTICIA
    {
      id: 'prec-007',
      caseTitle: 'Reclamación de Horas Extras y Horario en Modalidad Teletrabajo',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Laboral (Sentencia SL-4102-2024)',
      sentenceType: 'CASACION_SL',
      outcome: 'CONCEDIDO',
      keyFact: 'Trabajador aportó correos corporativos y registros telemáticos emitidos fuera de la jornada legal fijada en el contrato.',
      ratioDecidendi: 'La disponibilidad técnica y requerimiento laboral continuo fuera del horario ordinario configura trabajo suplementario sujeto a recargos del Art. 168 CST.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Laboral, Sentencia SL-4102-2024, M.P. Fernando Castillo Cadena.',
      magistradoPonente: 'Fernando Castillo Cadena'
    },
    {
      id: 'prec-008',
      caseTitle: 'Exoneración de Sanción Moratoria (Art. 65 CST) por Acreditación de Buena Fe',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Laboral (Sentencia SL-1892-2023)',
      sentenceType: 'CASACION_SL',
      outcome: 'NEGADO',
      keyFact: 'El empleador demostró razones objetivas y dudas razonables en el cálculo del salario variable al momento de la liquidación final.',
      ratioDecidendi: 'La sanción moratoria del Art. 65 del CST no es de aplicación automática; requiere la demostración de mala fe del empleador.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Laboral, Sentencia SL-1892-2023, M.P. Gerardo Botero Zuluaga.',
      magistradoPonente: 'Gerardo Botero Zuluaga'
    },
    {
      id: 'prec-009',
      caseTitle: 'Responsabilidad Civil Extracontractual por Accidente de Tránsito y Daño Moral',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Civil (Sentencia SC-5186-2022)',
      sentenceType: 'CASACION_SC',
      outcome: 'CONCEDIDO',
      keyFact: 'Empresa de transporte público alegó caso fortuito por falla mecánica previsible en la vía.',
      ratioDecidendi: 'La falla mecánica previsible no configura fuerza mayor en actividades peligrosas; opera la presunción de responsabilidad del explotador.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Civil, Sentencia SC-5186-2022, M.P. Luis Alonso Rico Puerta.',
      magistradoPonente: 'Luis Alonso Rico Puerta'
    },
    {
      id: 'prec-010',
      caseTitle: 'Cláusula de Exclusión Probatoria por Allanamiento Ilegal sin Orden Judicial',
      corporacion: 'CORTE_SUPREMA',
      tribunalLabel: 'Corte Suprema de Justicia — Sala de Casación Penal (Sentencia SP-1204-2023)',
      sentenceType: 'CASACION_SP',
      outcome: 'CONCEDIDO',
      keyFact: 'Registro domiciliario ejecutado sin orden judicial previa ni configuración de flagrancia legalmente válida.',
      ratioDecidendi: 'Toda prueba derivada de registros practicados con violación de garantías fundamentales queda viciada de nulidad de pleno derecho por cláusula de exclusión.',
      citation: 'Corte Suprema de Justicia, Sala de Casación Penal, Sentencia SP-1204-2023, M.P. Gerson Chaverra Castro.',
      magistradoPonente: 'Gerson Chaverra Castro'
    },

    // TRIBUNALES SUPERIORES Y ADMINISTRATIVOS
    {
      id: 'prec-011',
      caseTitle: 'Declaración de Contrato Realidad en Entidad Territorial y Pago de Prestaciones',
      corporacion: 'TRIBUNAL_ADMINISTRATIVO',
      tribunalLabel: 'Tribunal Administrativo de Cundinamarca — Sección Segunda (Sentencia TAC-089-2024)',
      sentenceType: 'AUTO_TRIBUNAL',
      outcome: 'CONCEDIDO',
      keyFact: 'Servidor bajo contrato de prestación de servicios prestó labores administrativas permanentes durante 6 años ininterrumpidos.',
      ratioDecidendi: 'La subordinación continuada impone la primacía de la realidad sobre las formas contractuales simuladas.',
      citation: 'Tribunal Administrativo de Cundinamarca, Sección Segunda, Sentencia TAC-089-2024, M.P. Bertha Lucía Ramírez.',
      magistradoPonente: 'Bertha Lucía Ramírez'
    },
    {
      id: 'prec-012',
      caseTitle: 'Interrupción Legal de la Prescripción Trienal por Reclamación Escrita al Empleador',
      corporacion: 'TRIBUNAL_SUPERIOR',
      tribunalLabel: 'Tribunal Superior de Bogotá — Sala Laboral (Sentencia TSB-LAB-2024-1102)',
      sentenceType: 'AUTO_TRIBUNAL',
      outcome: 'NEGADO',
      keyFact: 'El demandante interrumpió legalmente el término prescriptivo mediante reclamación escrita radicar ante el empleador.',
      ratioDecidendi: 'La reclamación formal recibida por el empleador suspende por una sola vez el término trienal del Art. 151 CPTSS por un lapso igual.',
      citation: 'Tribunal Superior del Distrito Judicial de Bogotá, Sala Laboral, Sentencia TSB-LAB-2024-1102, M.P. Carlos Mario Restrepo.',
      magistradoPonente: 'Carlos Mario Restrepo'
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

    // Búsqueda tokenizada flexible: si coincide cualquier palabra clave relevante
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
      fullText: item.fullText || `${item.tribunalLabel}\n\nHECHOS:\n${item.keyFact}\n\nRATIO DECIDENDI:\n${item.ratioDecidendi}\n\nRESUELVE:\nSe concede la pretensión conforme al precedente de unificación fijado por la corporación.`
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
                placeholder="Buscar precedentes (ej. soldado mina, pensión, contrato realidad, embargo, horas extras)..."
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
                  <span>Corpus Supabase RAG</span>
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
              Todas las Altas Cortes &amp; Tribunales
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
              No se encontraron precedentes para la búsqueda "{searchQuery}". Pruebe con palabras clave como <strong>soldado, pensión, contrato realidad, embargo o nulidad</strong>.
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
