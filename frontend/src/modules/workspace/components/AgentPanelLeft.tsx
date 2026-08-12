import React, { useEffect, useState } from 'react';
import { Sparkles, Database, Cpu, Send, Scale, Building, Paperclip, FileText, X, UploadCloud, RefreshCw } from 'lucide-react';
import { AgentConsoleStream } from '../../agent/components/AgentConsoleStream';
import { ActuacionInfoPanel } from '../../catalog/components/ActuacionInfoPanel';
import { useActuacion } from '../../catalog/hooks/useActuacion';
import { useBranchActuaciones } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranches } from '../../catalog/hooks/useCatalogBranches';
import { branchLabel } from '../../catalog/branchLabels';
import { LEGACY_DOCUMENT_OPTIONS } from '../data/legacyDocumentOptions';
import type { AgentLog } from '../../agent/types';
import type { ActuacionRole } from '../../catalog/types';

/**
 * Who signs the document being drafted.
 *
 * There is no separate tab for the sustanciador or the profesional
 * universitario: both project the providencia the judge signs, so it is one
 * document, not two. Secretaría gets its own tab because its acts — estados,
 * constancias, traslados, emplazamientos — are signed by the secretary.
 */
const ROLE_TABS: { role: ActuacionRole; label: string; hint: string }[] = [
  { role: 'LITIGANTE', label: 'Firma / Litigante', hint: 'Escritos de parte' },
  {
    role: 'DESPACHO',
    label: 'Juez / Despacho',
    hint: 'Providencias: autos y sentencias. Las proyecta el sustanciador y las firma el juez.'
  },
  {
    role: 'SECRETARIA',
    label: 'Secretaría',
    hint: 'Actos que firma el secretario: estados, constancias, traslados, emplazamientos, oficios.'
  }
];

/** What the button promises to produce, per role. */
const SUBMIT_LABEL: Record<ActuacionRole, string> = {
  LITIGANTE: 'Generar Borrador',
  DESPACHO: 'Generar Providencia',
  SECRETARIA: 'Generar Constancia'
};

export interface CaseStudyFile {
  id: string;
  name: string;
  size: string;
  type: 'PRECEDENTE_CONCEDIDO' | 'PRECEDENTE_NEGADO' | 'DOCUMENTO_ESTUDIO';
}

interface AgentPanelLeftProps {
  documentType: string;
  setDocumentType: (type: string) => void;
  /** Owned by the workflow: the catalogue needs it to resolve a filing name. */
  legalBranch: string;
  setLegalBranch: (branch: string) => void;
  legalPrompt: string;
  setLegalPrompt: (prompt: string) => void;
  isProcessing: boolean;
  handleSendPrompt: (e: React.FormEvent) => void;
  logs: AgentLog[];
  activeDraftText?: string | null;
  onClearActiveDraft?: () => void;
}

export const AgentPanelLeft: React.FC<AgentPanelLeftProps> = ({
  documentType,
  setDocumentType,
  legalBranch,
  setLegalBranch,
  legalPrompt,
  setLegalPrompt,
  isProcessing,
  handleSendPrompt,
  logs,
  activeDraftText,
  onClearActiveDraft
}) => {
  const actuacion = useActuacion(documentType, legalBranch);
  const [userRole, setUserRole] = useState<ActuacionRole>('LITIGANTE');
  const [importedFiles, setImportedFiles] = useState<CaseStudyFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);


  const catalogued = useBranchActuaciones(legalBranch, userRole);
  const catalogBranches = useCatalogBranches();

  // Catalogued branches first, then any legacy-only branch that still has
  // hand-written document types. Built from the API so the selector can never
  // again fall behind the catalogue.
  const branchOptions = [
    ...catalogBranches,
    ...Object.keys(LEGACY_DOCUMENT_OPTIONS).filter((b) => !catalogBranches.includes(b as never))
  ];

  // The legacy lists only ever had two roles, so secretarial work has no
  // fallback: it exists in the catalogue or it does not exist at all.
  const legacyFor = (branch: string, role: ActuacionRole): string[] => {
    if (role === 'SECRETARIA') return [];
    const entry = LEGACY_DOCUMENT_OPTIONS[branch] || LEGACY_DOCUMENT_OPTIONS['CONSTITUCIONAL'];
    return role === 'LITIGANTE' ? entry.litigante : entry.despacho;
  };

  // The catalogue wins wherever it has entries. Its names are the ones the
  // drafting engine can attach a verified article and deadline to; the legacy
  // strings only ever produce a generic template, so they serve the branches
  // not catalogued yet and nothing else.
  const isCatalogued = catalogued.length > 0;
  const currentOptions = isCatalogued ? catalogued : legacyFor(legalBranch, userRole);

  // Keep the selection valid: when the branch or role changes the previous
  // document type usually belongs to neither list, and a selector showing a
  // value it does not contain silently sends the old one to the engine.
  useEffect(() => {
    if (currentOptions.length > 0 && !currentOptions.includes(documentType)) {
      setDocumentType(currentOptions[0]);
    }
  }, [currentOptions, documentType, setDocumentType]);

  const handleBranchChange = (branch: string) => {
    setLegalBranch(branch);
  };

  const handleRoleChange = (role: ActuacionRole) => {
    setUserRole(role);
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
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.role}
                onClick={() => handleRoleChange(tab.role)}
                title={tab.hint}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  userRole === tab.role
                    ? 'bg-blue-950 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branchLabel(branch)}
              </option>
            ))}
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

        {/* Whether this branch has verified procedural knowledge behind it.
            Said plainly: an uncatalogued branch still drafts, but the norm and
            the deadline come from the model, not from a checked source. */}
        {!isCatalogued && (
          <p className="text-[10px] text-amber-700 leading-snug flex items-start gap-1">
            <span aria-hidden="true">⚠</span>
            <span>
              Esta rama aún no tiene catálogo verificado. El borrador se redactará sin norma ni
              término confirmados; verifícalos antes de radicar.
            </span>
          </p>
        )}
      </div>

      {actuacion && <ActuacionInfoPanel actuacion={actuacion} />}

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
          {/* Active Draft Indicator */}
          {activeDraftText && (
            <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-[11px] text-blue-900 font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Modo Continuación — Borrador cargado ({(activeDraftText.length / 1000).toFixed(1)}k caracteres)</span>
              </div>
              <button
                type="button"
                onClick={onClearActiveDraft}
                className="text-blue-400 hover:text-blue-700 transition-colors"
                title="Descartar borrador base"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative flex-1">
            <textarea
              value={legalPrompt}
              onChange={(e) => setLegalPrompt(e.target.value)}
              placeholder={activeDraftText
                ? 'Instrucciones sobre el borrador cargado: continuar, corregir, ampliar pretensiones, agregar jurisprudencia...'
                : `Describa los hechos y la pretensión para ${documentType.toLowerCase()}...`
              }
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
                  {activeDraftText ? <RefreshCw className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{activeDraftText ? 'Continuar / Corregir' : SUBMIT_LABEL[userRole]}</span>
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
