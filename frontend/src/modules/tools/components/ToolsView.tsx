import React, { useState } from 'react';
import { Calendar, DollarSign, ArrowRight, BookOpen, Search, BookMarked, Sparkles } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';

interface GlossaryTerm {
  term: string;
  category: 'CONSTITUCIONAL' | 'CIVIL_CGP' | 'LABORAL_CST' | 'ADMINISTRATIVO_CPACA' | 'PENAL' | 'FAMILIA_COMERCIAL';
  definition: string;
  legalBasis: string;
  exampleUsage: string;
}

const EXTENSIVE_LEGAL_GLOSSARY: GlossaryTerm[] = [
  // CONSTITUCIONAL
  {
    term: 'Ratio Decidendi',
    category: 'CONSTITUCIONAL',
    definition: 'Fundamento jurídico directo y esencial en que se apoya la parte resolutiva de una sentencia. Constituye el precedente judicial obligatorio para jueces e inspectores.',
    legalBasis: 'Precedente obligatorio de la Corte Constitucional (Sentencia C-037 de 1996 & SU-049 de 2017)',
    exampleUsage: 'La Ratio Decidendi de la Sentencia SU-049 de 2017 extiende la estabilidad ocupacional reforzada a quienes no tienen calificación de pérdida de capacidad laboral.'
  },
  {
    term: 'Obiter Dictum',
    category: 'CONSTITUCIONAL',
    definition: 'Consideraciones o dichos de paso formulados por el juez que no son indispensables para sustentar la decisión final, pero sirven como guía doctrinal.',
    legalBasis: 'Jurisprudencia Constitucional de Unificación',
    exampleUsage: 'Dicha apreciación sobre la buena fe empresarial constituye un mero Obiter Dictum en la providencia.'
  },
  {
    term: 'Bloque de Constitucionalidad',
    category: 'CONSTITUCIONAL',
    definition: 'Conjunto de normas y tratados internacionales sobre derechos humanos ratificados por Colombia (como la Convención Americana) que tienen rango constitucional normativo.',
    legalBasis: 'Artículo 93 de la Constitución Política de Colombia',
    exampleUsage: 'Se invocó el Bloque de Constitucionalidad para aplicar el Convenio 87 de la OIT sobre libertad sindical.'
  },
  {
    term: 'Acción de Tutela',
    category: 'CONSTITUCIONAL',
    definition: 'Mecanismo preferente y sumario para la protección inmediata de los derechos fundamentales de las personas cuando sean vulnerados o amenazados por autoridades o particulares.',
    legalBasis: 'Artículo 86 de la Constitución Política & Decreto 2591 de 1991',
    exampleUsage: 'Se interpuso Acción de Tutela por vulneración del derecho fundamental al debido proceso administrativo.'
  },
  {
    term: 'Habeas Data',
    category: 'CONSTITUCIONAL',
    definition: 'Derecho fundamental que faculta a toda persona para conocer, actualizar y rectificar las informaciones recolectadas sobre ella en bases de datos públicas y privadas.',
    legalBasis: 'Artículo 15 de la Constitución Política & Ley Estatutaria 1266 de 2008',
    exampleUsage: 'La tutela tuteló el derecho al Habeas Data ordenando eliminar el reporte negativo caducado en DataCrédito.'
  },
  {
    term: 'Excepción de Inconstitucionalidad',
    category: 'CONSTITUCIONAL',
    definition: 'Inaplicación de una norma legal en un caso concreto cuando esta resulte manifiestamente contraria a la Constitución Política.',
    legalBasis: 'Artículo 4° de la Constitución Política de Colombia',
    exampleUsage: 'El Despacho inaplicó el acuerdo municipal por vía de Excepción de Inconstitucionalidad.'
  },
  {
    term: 'Control de Convencionalidad',
    category: 'CONSTITUCIONAL',
    definition: 'Obligación de los jueces colombianos de verificar que las leyes locales no violen los tratados de la Convención Americana de Derechos Humanos.',
    legalBasis: 'Jurisprudencia de la Corte IDH & Corte Constitucional (Sentencia C-327/16)',
    exampleUsage: 'Se aplicó el Control de Convencionalidad conforme a la jurisprudencia binding de la Corte IDH.'
  },

  // CIVIL Y CGP
  {
    term: 'Excepción de Mérito',
    category: 'CIVIL_CGP',
    definition: 'Medio de defensa con el cual el demandado ataca el fondo de la pretensión alegando hechos extintivos, impeditivos o modificatorios de la obligación.',
    legalBasis: 'Artículo 282 del Código General del Proceso (Ley 1564 de 2012)',
    exampleUsage: 'Formulo la Excepción de Mérito de Pago Total y Prescripción de la obligación ejecutada.'
  },
  {
    term: 'Auto Admisorio de la Demanda',
    category: 'CIVIL_CGP',
    definition: 'Providencia judicial interlocutoria que admite formalmente a trámite la demanda por reunir la totalidad de los requisitos procesales.',
    legalBasis: 'Artículos 82, 84 y 90 del Código General del Proceso',
    exampleUsage: 'El Juzgado profirió Auto Admisorio disponiendo la notificación personal de la parte demandada.'
  },
  {
    term: 'Auto Inadmisorio de la Demanda',
    category: 'CIVIL_CGP',
    definition: 'Providencia judicial mediante la cual el juez señala los defectos subsanables de la demanda y concede cinco (5) días hábiles para subsanar.',
    legalBasis: 'Artículo 90 del Código General del Proceso',
    exampleUsage: 'La demanda fue inadmitida por no acreditar la conciliación como requisito de procedibilidad.'
  },
  {
    term: 'Requisito de Procedibilidad',
    category: 'CIVIL_CGP',
    definition: 'Trámite previo y obligatorio exige la ley (como la conciliación extrajudicial) antes de incoar la demanda ante la jurisdicción ordinaria.',
    legalBasis: 'Ley 2220 de 2022 & Artículo 90 Numeral 7° del CGP',
    exampleUsage: 'Se aportó el acta de no acuerdo como cumplimiento del Requisito de Procedibilidad.'
  },
  {
    term: 'Juramento Estimatorio',
    category: 'CIVIL_CGP',
    definition: 'Requisito formal de la demanda en el cual la parte estima bajo la gravedad del juramento el monto de los perjuicios, frutos o mejoras solicitadas.',
    legalBasis: 'Artículo 206 del Código General del Proceso',
    exampleUsage: 'El demandado objetó el Juramento Estimatorio por estimarlo notoriamente desproporcionado.'
  },
  {
    term: 'Litisconsorcio Necesario',
    category: 'CIVIL_CGP',
    definition: 'Situación procesal en que la relación jurídica sustancial es indivisible, exigiendo la vinculación obligatoria de todos los sujetos al proceso.',
    legalBasis: 'Artículo 61 del Código General del Proceso',
    exampleUsage: 'Se vinculó al acreedor hipotecario en calidad de litisconsorte necesario.'
  },
  {
    term: 'Despacho Comisorio',
    category: 'CIVIL_CGP',
    definition: 'Comisión dictada por un juez a otra autoridad (o inspector) para practicar diligencias fuera de la sede de su despacho, como secuestros o entregas.',
    legalBasis: 'Artículos 37 a 41 del Código General del Proceso',
    exampleUsage: 'Se libró Despacho Comisorio a la Alcaldía Local para practicar la inspección judicial.'
  },
  {
    term: 'Litispendencia',
    category: 'CIVIL_CGP',
    definition: 'Excepción previa que impide tramitar un segundo proceso sobre las mismas partes, objeto y causa cuando ya existe un juicio en curso.',
    legalBasis: 'Artículo 100 Numeral 8° del Código General del Proceso',
    exampleUsage: 'Se propuso la excepción previa de Litispendencia por existir proceso idéntico en el Juzgado 4°.'
  },

  // LABORAL Y CST
  {
    term: 'Prescripción Trienal Laboral',
    category: 'LABORAL_CST',
    definition: 'Extinción de los derechos y acreencias sociales por no reclamarse durante tres (3) años contados desde que la obligación se hizo exigible.',
    legalBasis: 'Artículo 151 del Código Procesal del Trabajo y de la Seguridad Social',
    exampleUsage: 'La reclamación de recargos del año 2020 se encuentra afectada por Prescripción Trienal.'
  },
  {
    term: 'Contrato de Realidad',
    category: 'LABORAL_CST',
    definition: 'Principio constitucional en virtud del cual prima la prestación personal y subordinada del servicio sobre la forma formal del contrato comercial de prestación de servicios.',
    legalBasis: 'Artículo 53 de la Constitución Política & Art. 24 del CST',
    exampleUsage: 'Se demandó la declaración de Contrato de Realidad al acreditarse subordinación continuada.'
  },
  {
    term: 'Fuero de Salud (Estabilidad Laboral Reforzada)',
    category: 'LABORAL_CST',
    definition: 'Protección legal que prohíbe el despido sin autorización previa del Ministerio del Trabajo a trabajadores con afectaciones de salud significativas.',
    legalBasis: 'Artículo 26 de la Ley 361 de 1997 & Sentencia SU-049 de 2017',
    exampleUsage: 'El trabajador se encontraba amparado por Fuero de Salud al momento de la carta de despido.'
  },
  {
    term: 'Sanción Moratoria (Art. 65 CST)',
    category: 'LABORAL_CST',
    definition: 'Indemnización equivalente a un día de salario por cada día de retardo en el pago de salarios y prestaciones a la terminación del contrato, sujeta a buena/mala fe.',
    legalBasis: 'Artículo 65 del Código Sustantivo del Trabajo & Casación CSJ SL-1892-2023',
    exampleUsage: 'Se solicita la condena a la Sanción Moratoria del Art. 65 por omisión injustificada del empleador.'
  },
  {
    term: 'Indexación Salarial',
    category: 'LABORAL_CST',
    definition: 'Actualización del valor monetario de las acreencias laborales adeudadas aplicando la variación del IPC para restituir la pérdida de poder adquisitivo.',
    legalBasis: 'Jurisprudencia de la Sala Laboral de la Corte Suprema de Justicia',
    exampleUsage: 'Se solicitó ordenar la Indexación Salarial sobre las cesantías adeudadas.'
  },
  {
    term: 'Fuero de Maternidad',
    category: 'LABORAL_CST',
    definition: 'Garantía inalienable que prohíbe la terminación unilateral del contrato de trabajo durante el embarazo y las 18 semanas posteriores al parto.',
    legalBasis: 'Artículo 239 del Código Sustantivo del Trabajo & Ley 2114 de 2021',
    exampleUsage: 'El despido efectuado violó el Fuero de Maternidad, acarreando la ineficacia inmediata.'
  },

  // ADMINISTRATIVO Y CPACA
  {
    term: 'Nulidad y Restablecimiento del Derecho',
    category: 'ADMINISTRATIVO_CPACA',
    definition: 'Medio de control jurisdiccional encaminado a declarar la invalidez de un acto administrativo individual y obtener el resarcimiento del daño sufrido.',
    legalBasis: 'Artículo 138 del Código de Procedimiento Administrativo y de lo Contencioso Administrativo (Ley 1437 de 2011)',
    exampleUsage: 'Se instauró medio de control de Nulidad y Restablecimiento del Derecho contra la resolución sancionatoria.'
  },
  {
    term: 'Silencio Administrativo Positivo',
    category: 'ADMINISTRATIVO_CPACA',
    definition: 'Ficción jurídica por la cual la omisión de resolver una petición dentro del término legal se entiende resuelta de manera favorable al peticionario en los casos señalados expresamente por la ley.',
    legalBasis: 'Artículo 84 del CPACA',
    exampleUsage: 'Operó el Silencio Administrativo Positivo al no resolverse el recurso de apelación en dos meses.'
  },
  {
    term: 'Agotamiento de la Vía Administrativa',
    category: 'ADMINISTRATIVO_CPACA',
    definition: 'Requisito previo consistente en interponer y resolver los recursos obligatorios (como el de reposición y apelación) contra los actos administrativos antes de acudir a la jurisdicción contenciosa.',
    legalBasis: 'Artículo 161 Numeral 2° del CPACA',
    exampleUsage: 'Quedó agotada la Vía Administrativa con la notificación de la resolución que desató la apelación.'
  },
  {
    term: 'Caducidad del Medio de Control',
    category: 'ADMINISTRATIVO_CPACA',
    definition: 'Pérdida del derecho a accionar ante la jurisdicción contencioso administrativa por haber transcurrido los plazos legales establecidos (ej. 4 meses en Nulidad y Restablecimiento).',
    legalBasis: 'Artículo 164 del CPACA',
    exampleUsage: 'El medio de control fue rechazado por haber operado la Caducidad de los cuatro meses.'
  },

  // PENAL Y LEY 906
  {
    term: 'Cláusula de Exclusión Probatoria',
    category: 'PENAL',
    definition: 'Sanción constitucional de nulidad de pleno derecho que invalida toda prueba obtenida con violación de los derechos y garantías fundamentales del procesado.',
    legalBasis: 'Artículo 29 de la Constitución Política & Art. 23 de la Ley 906 de 2004',
    exampleUsage: 'El juzgador decretó la Cláusula de Exclusión Probatoria respecto del registro fotográfico ilegal.'
  },
  {
    term: 'Principio de Oportunidad',
    category: 'PENAL',
    definition: 'Facultad de la Fiscalía General de la Nación para suspender, interrumpir o renunciar a la persecución penal en casos donde se cumplan los presupuestos de política criminal legalmente señalados.',
    legalBasis: 'Artículo 323 de la Ley 906 de 2004',
    exampleUsage: 'La Fiscalía otorgó la suspensión a prueba del proceso mediante el Principio de Oportunidad.'
  },
  {
    term: 'Presunción de Inocencia',
    category: 'PENAL',
    definition: 'Garantía fundamental de todo procesado de ser considerado e interrogado como inocente hasta tanto no exista sentencia condenatoria ejecutoriada en su contra.',
    legalBasis: 'Artículo 29 C.P. & Artículo 7° de la Ley 906 de 2004',
    exampleUsage: 'La ausencia de prueba fehaciente exige mantener incólume la Presunción de Inocencia.'
  },

  // FAMILIA Y COMERCIAL
  {
    term: 'Patria Potestad',
    category: 'FAMILIA_COMERCIAL',
    definition: 'Conjunto de derechos y deberes que la ley reconoce a los padres sobre los hijos menores no emancipados para su representación legal, administración de bienes y protección.',
    legalBasis: 'Artículo 288 del Código Civil Colombiano',
    exampleUsage: 'Se demandó la privación de la Patria Potestad por abandono injustificado del menor.'
  },
  {
    term: 'Fijación de Cuota Alimentaria',
    category: 'FAMILIA_COMERCIAL',
    definition: 'Proceso de familia para establecer el monto proporcional que debe suministrar el alimentante para cubrir congruamente la subsistencia, estudio y salud de los hijos.',
    legalBasis: 'Artículos 411 y ss. del Código Civil & Código de la Infancia y la Adolescencia (Ley 1098 de 2006)',
    exampleUsage: 'Se radicó demanda de Fijación de Cuota Alimentaria con medida cautelar de embargo de salario.'
  },
  {
    term: 'Título Ejecutivo',
    category: 'FAMILIA_COMERCIAL',
    definition: 'Documento donde consta una obligación clara, expresa y actualmente exigible que proviene del deudor o de una providencia judicial, respaldando el proceso de cobro ejecutivo.',
    legalBasis: 'Artículo 422 del Código General del Proceso',
    exampleUsage: 'El pagaré presentado reúne los requisitos legales de Título Ejecutivo.'
  }
];

export const ToolsView: React.FC = () => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  const filteredGlossary = EXTENSIVE_LEGAL_GLOSSARY.filter((item) => {
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
              <h2 className="text-base font-bold text-white">Glosario Jurídico Colombiano Integral ({EXTENSIVE_LEGAL_GLOSSARY.length} Términos)</h2>
            </div>
            <p className="text-xs text-blue-200">
              Diccionario exhaustivo de términos procesales, jurisprudencia y conceptos dogmáticos por rama procesal
            </p>
          </div>

          {/* Search bar inside glossary */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar término, código o norma..."
              className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-blue-200 focus:outline-none focus:bg-white/20"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs flex-wrap">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'CONSTITUCIONAL', label: 'Constitucional' },
            { id: 'CIVIL_CGP', label: 'Civil & CGP' },
            { id: 'LABORAL_CST', label: 'Laboral & CST' },
            { id: 'ADMINISTRATIVO_CPACA', label: 'Administrativo CPACA' },
            { id: 'PENAL', label: 'Penal Ley 906' },
            { id: 'FAMILIA_COMERCIAL', label: 'Familia & Comercial' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
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
              <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-2.5 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-900 shrink-0" />
                    <span>{item.term}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase shrink-0">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {item.definition}
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                    <Sparkles className="w-3 h-3 text-blue-700 shrink-0" />
                    <span>Base Legal &amp; Precedente: {item.legalBasis}</span>
                  </div>
                  <p className="text-slate-600 italic">Ejemplo en escrito procesal: "{item.exampleUsage}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
