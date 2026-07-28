import React, { useState } from 'react';
import { Sparkles, Database, Cpu, Send, Scale, Building, Paperclip, FileText, X, UploadCloud } from 'lucide-react';
import { AgentConsoleStream } from '../../agent/components/AgentConsoleStream';
import type { AgentLog } from '../../agent/components/AgentConsoleStream';

export interface CaseStudyFile {
  id: string;
  name: string;
  size: string;
  type: 'PRECEDENTE_CONCEDIDO' | 'PRECEDENTE_NEGADO' | 'DOCUMENTO_ESTUDIO';
}

interface AgentPanelLeftProps {
  documentType: string;
  setDocumentType: (type: string) => void;
  legalPrompt: string;
  setLegalPrompt: (prompt: string) => void;
  isProcessing: boolean;
  handleSendPrompt: (e: React.FormEvent) => void;
  logs: AgentLog[];
}

export const AgentPanelLeft: React.FC<AgentPanelLeftProps> = ({
  documentType,
  setDocumentType,
  legalPrompt,
  setLegalPrompt,
  isProcessing,
  handleSendPrompt,
  logs
}) => {
  const [legalBranch, setLegalBranch] = useState<string>('CONSTITUCIONAL');
  const [userRole, setUserRole] = useState<'FIRMA_LITIGANTE' | 'JUZGADO_DESPACHO'>('FIRMA_LITIGANTE');
  const [importedFiles, setImportedFiles] = useState<CaseStudyFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const branchDocumentOptions: Record<string, { litigante: string[]; despacho: string[] }> = {
    'CONSTITUCIONAL': {
      litigante: [
        'Redacción de Acción de Tutela',
        'Impugnación de Sentencia de Tutela',
        'Acción de Tutela por Vía de Hecho Judicial',
        'Acción Popular / Acción de Grupo',
        'Acción de Cumplimiento'
      ],
      despacho: [
        'Contestación / Informe de Respuesta a Tutela (Juzgado/Entidad)',
        'Proyección de Sentencia de Tutela (Concede / Niega)',
        'Proyección de Auto Admisorio & Medida Cautelar',
        'Proyección de Auto Resolutorio de Impugnación'
      ]
    },
    'LABORAL': {
      litigante: [
        'Contestación de Demanda Laboral',
        'Sustentación de Recurso de Apelación',
        'Contestación a Recurso de Apelación de la Contraparte',
        'Recurso de Casación Laboral',
        'Formulación de Excepción de Prescripción Trienal'
      ],
      despacho: [
        'Proyección de Sentencia Laboral de Primera Instancia',
        'Proyección de Auto Interlocutorio / Resuelve Excepciones',
        'Proyección de Auto Admisorio de Demanda Laboral'
      ]
    },
    'CIVIL': {
      litigante: [
        'Contestación de Demanda Civil',
        'Recurso de Reposición y en Subsidio Apelación',
        'Contestación a Recurso de Apelación Civil',
        'Demanda Ejecutiva & Liquidación de Crédito'
      ],
      despacho: [
        'Proyección de Sentencia Civil Ordinaria / Verbal',
        'Proyección de Auto Resolutorio de Recurso de Reposición',
        'Proyección de Auto Mandamiento de Pago'
      ]
    },
    'ADMINISTRATIVO': {
      litigante: [
        'Demanda de Nulidad y Restablecimiento del Derecho',
        'Contestación de Demanda Contencioso Administrativa',
        'Respuesta / Contestación a Medida Cautelar',
        'Recurso de Apelación CPACA'
      ],
      despacho: [
        'Proyección de Sentencia Contencioso Administrativa',
        'Proyección de Auto de Medida Cautelar',
        'Proyección de Auto Resolutorio de Recurso'
      ]
    },
    'PENAL': {
      litigante: [
        'Sustentación de Apelación Penal (Ley 906)',
        'Contestación / Memorial de Inhabilidad o Libertad',
        'Petición de HÁBEAS CORPUS',
        'Solicitud de Preclusión de la Defensa'
      ],
      despacho: [
        'Proyección de Auto de Preclusión / Control de Garantías',
        'Proyección de Sentencia Penal de Primera Instancia',
        'Proyección de Auto de Medida de Aseguramiento'
      ]
    },
    'FAMILIA': {
      litigante: [
        'Demanda de Fijación / Exoneración de Alimentos',
        'Contestación de Demanda de Alimentos o Custodia',
        'Divorcio por Mutuo Acuerdo / Demanda de Divorcio',
        'Impugnación / Reconocimiento de Paternidad'
      ],
      despacho: [
        'Proyección de Sentencia de Familia (Alimentos/Divorcio)',
        'Proyección de Auto de Medidas Cautelares de Familia'
      ]
    },
    'PEQUEÑAS_CAUSAS': {
      litigante: [
        'Demanda Verbal Sumaria de Mínima Cuantía',
        'Contestación a Demanda de Pequeñas Causas',
        'Restitución de Inmueble Arrendado'
      ],
      despacho: [
        'Proyección de Sentencia de Única Instancia (Pequeñas Causas)',
        'Proyección de Auto Lanzamiento de Inmueble'
      ]
    },
    'TRIBUTARIO': {
      litigante: [
        'Recurso de Reconsideración ante la DIAN',
        'Contestación a Liquidación Oficial DIAN',
        'Demanda de Nulidad y Restablecimiento Tributario'
      ],
      despacho: [
        'Proyección de Sentencia Nulidad Tributaria',
        'Proyección de Auto Resuelve Excepción Coactiva'
      ]
    },
    'SOCIETARIO': {
      litigante: [
        'Demanda por Competencia Desleal (SIC)',
        'Impugnación de Actas Asamblearias (SuperSociedades)',
        'Contestación a Demanda Societaria'
      ],
      despacho: [
        'Proyección de Sentencia Societaria (SuperSociedades / SIC)',
        'Proyección de Auto de Insolvencia Ley 1116'
      ]
    },
    'INTERNACIONAL': {
      litigante: [
        'Petición / Demanda ante la Corte IDH (OEA)',
        'Solicitud de Exequátur ante la CSJ',
        'Arbitraje Comercial Internacional (CIADI)'
      ],
      despacho: [
        'Informe del Estado / Despacho ante la Corte IDH',
        'Proyección de Sentencia de Exequátur (CSJ)'
      ]
    }
  };

  const currentBranchObj = branchDocumentOptions[legalBranch] || branchDocumentOptions['CONSTITUCIONAL'];
  const currentOptions = userRole === 'FIRMA_LITIGANTE' ? currentBranchObj.litigante : currentBranchObj.despacho;

  const handleBranchChange = (branch: string) => {
    setLegalBranch(branch);
    const targetObj = branchDocumentOptions[branch] || branchDocumentOptions['CONSTITUCIONAL'];
    const opts = userRole === 'FIRMA_LITIGANTE' ? targetObj.litigante : targetObj.despacho;
    setDocumentType(opts[0]);
  };

  const handleRoleChange = (role: 'FIRMA_LITIGANTE' | 'JUZGADO_DESPACHO') => {
    setUserRole(role);
    const targetObj = branchDocumentOptions[legalBranch] || branchDocumentOptions['CONSTITUCIONAL'];
    const opts = role === 'FIRMA_LITIGANTE' ? targetObj.litigante : targetObj.despacho;
    setDocumentType(opts[0]);
  };

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingFile(true);
    setTimeout(() => {
      const newFiles: CaseStudyFile[] = Array.from(files).map((f, idx) => ({
        id: `file-${Date.now()}-${idx}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.name.toLowerCase().includes('conced')
          ? 'PRECEDENTE_CONCEDIDO'
          : f.name.toLowerCase().includes('nega')
          ? 'PRECEDENTE_NEGADO'
          : 'DOCUMENTO_ESTUDIO'
      }));
      setImportedFiles((prev) => [...prev, ...newFiles]);
      setIsUploadingFile(false);
    }, 600);
  };

  const removeFile = (id: string) => {
    setImportedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <section className="w-full lg:w-[480px] xl:w-[520px] border-r border-slate-200/80 bg-white flex flex-col h-full font-sans">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-900" />
        <h2 className="text-[13px] font-bold text-slate-900">Orquestador IA</h2>
      </div>

      {/* Configuration Section */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-3">
        {/* Role toggle */}
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            Actuación
          </label>
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg">
            <button
              onClick={() => handleRoleChange('FIRMA_LITIGANTE')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                userRole === 'FIRMA_LITIGANTE' ? 'bg-blue-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Firma / Litigante
            </button>
            <button
              onClick={() => handleRoleChange('JUZGADO_DESPACHO')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                userRole === 'JUZGADO_DESPACHO' ? 'bg-blue-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Juzgado / Despacho
            </button>
          </div>
        </div>

        {/* Branch selector */}
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            Rama
          </label>
          <select
            value={legalBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="bg-white border border-slate-200/80 text-slate-800 font-medium text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40"
          >
            <option value="CONSTITUCIONAL">Constitucional &amp; Tutelas</option>
            <option value="LABORAL">Laboral &amp; Seguridad Social</option>
            <option value="CIVIL">Civil &amp; Comercial (CGP)</option>
            <option value="ADMINISTRATIVO">Contencioso Administrativo (CPACA)</option>
            <option value="PENAL">Penal &amp; Acusatorio (Ley 906)</option>
            <option value="FAMILIA">Familia &amp; Sucesiones</option>
            <option value="INTERNACIONAL">Derecho Internacional &amp; Andino</option>
            <option value="PEQUEÑAS_CAUSAS">Pequeñas Causas (Mínima Cuantía)</option>
            <option value="TRIBUTARIO">Tributario &amp; DIAN</option>
            <option value="SOCIETARIO">Societario &amp; Competencia (SIC)</option>
          </select>
        </div>

        {/* Document type selector */}
        <div className="flex items-center justify-between">
          <label className="text-[12px] text-slate-500 font-medium">Tipo</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="bg-white border border-slate-200/80 text-slate-800 font-medium text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40 max-w-[300px] truncate"
          >
            {currentOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* File Importer */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            Precedentes adjuntos
          </span>
          {importedFiles.length > 0 && (
            <span className="text-[10px] font-mono text-slate-400">{importedFiles.length} archivo{importedFiles.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-dashed border-slate-300 rounded-xl cursor-pointer transition-colors">
          <input type="file" multiple accept=".pdf,.docx,.doc,.txt" onChange={handleFileUploadMock} className="hidden" />
          <UploadCloud className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] font-medium text-slate-500">
            {isUploadingFile ? 'Cargando...' : 'Adjuntar sentencias o pruebas'}
          </span>
        </label>

        {importedFiles.length > 0 && (
          <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto">
            {importedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between py-1.5 px-2.5 bg-slate-50 rounded-lg text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{file.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">({file.size})</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {file.type === 'PRECEDENTE_CONCEDIDO' ? (
                    <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Concedido</span>
                  ) : file.type === 'PRECEDENTE_NEGADO' ? (
                    <span className="text-[9px] font-mono bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-semibold">Negado</span>
                  ) : (
                    <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Estudio</span>
                  )}
                  <button type="button" onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Area */}
      <div className="px-4 py-3 flex-1 flex flex-col min-h-0">
        <form onSubmit={handleSendPrompt} className="flex flex-col gap-3 flex-1">
          <div className="relative flex-1">
            <textarea
              value={legalPrompt}
              onChange={(e) => setLegalPrompt(e.target.value)}
              placeholder={`Describa los hechos y la pretensión para ${documentType.toLowerCase()}...`}
              rows={4}
              className="w-full h-full bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate max-w-[280px]" title="Corte Constitucional (T, C, SU) • Corte Suprema (SL, SC, SP) • Consejo de Estado • Tribunales">
              <Database className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">Cortes, Consejo de Estado &amp; Tribunales</span>
            </div>
            <button
              type="submit"
              disabled={!legalPrompt.trim() || isProcessing}
              className="px-4 py-2 bg-blue-950 hover:bg-blue-900 disabled:opacity-40 text-white rounded-xl font-semibold text-[12px] flex items-center gap-2 transition-colors shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generar {userRole === 'JUZGADO_DESPACHO' ? 'Providencia' : 'Borrador'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Console */}
      <AgentConsoleStream logs={logs} isProcessing={isProcessing} />
    </section>
  );
};
