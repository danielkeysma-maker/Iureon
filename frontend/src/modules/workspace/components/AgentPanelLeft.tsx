import React, { useEffect, useState } from 'react';
import { Sparkles, Database, Cpu, Send, Scale, Building, Paperclip, FileText, X, UploadCloud, RefreshCw } from 'lucide-react';
import { AgentConsoleStream } from '../../agent/components/AgentConsoleStream';
import { ActuacionInfoPanel } from '../../catalog/components/ActuacionInfoPanel';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { reemplazoDeTipoDeDocumento } from '../documentTypeSelection';
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

/**
 * Shared width for the three controls of the setup rows (Actuación, Rama, Tipo).
 *
 * Each one used to size itself: the role toggle to its labels, the branch select
 * to its longest option, the type select to a max-width. Measured in the browser
 * they landed at 291, 322 and 300 px — right edges aligned, left edges ragged by
 * 31 px. That reads as untidy without a reader being able to name why, and it
 * comes back the moment someone adds a longer branch label. One constant decides
 * it now, so the column stays straight by construction rather than by luck.
 */
const CONTROL_WIDTH = 'w-[300px]';

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
  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;
  const [userRole, setUserRole] = useState<ActuacionRole>('LITIGANTE');
  const [importedFiles, setImportedFiles] = useState<CaseStudyFile[]>([]);


  const catalogo = useBranchActuacionesState(legalBranch, userRole);
  const catalogued = catalogo.nombres;
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

  /*
   * El rol sigue a la actuación, no al revés.
   *
   * Orientación propone sobre el catálogo ENTERO — 651 actuaciones —, y este
   * panel solo ofrece las del rol que tiene seleccionado, que arranca en
   * LITIGANTE. El 41% del catálogo es de despacho o de secretaría, así que
   * proponer "Acto administrativo sancionatorio" y aterrizar en un panel que no
   * lo tiene en su lista lo dejaba fuera y lo reemplazaba por el primero de otra
   * cosa.
   *
   * Se mueve el rol en vez de descartar la actuación porque el abogado ya
   * decidió qué quiere redactar; el selector de rol es un filtro de la
   * herramienta, no una afirmación sobre el caso.
   */
  const rolSincronizadoPara = React.useRef<string | null>(null);

  useEffect(() => {
    if (lookup.estado !== 'ENCONTRADA' || !actuacion) return;

    /*
     * Solo al CAMBIAR de actuación, y esto no es una micro-optimización.
     *
     * Sin la marca, el efecto compara rol y actuación en cada render y devuelve
     * el selector a su sitio: el abogado escoge DESPACHO, el efecto ve que la
     * actuación en curso es de litigante y lo regresa a LITIGANTE de inmediato.
     * El filtro de rol quedaría inservible — cambiar un defecto por otro.
     *
     * Con la marca, el rol se mueve una sola vez, cuando llega una actuación
     * nueva, y a partir de ahí el selector es del abogado otra vez.
     */
    if (rolSincronizadoPara.current === actuacion.exactName) return;
    rolSincronizadoPara.current = actuacion.exactName;

    if (actuacion.role !== userRole) setUserRole(actuacion.role);
  }, [lookup.estado, actuacion, userRole]);

  /*
   * Mantener la selección válida — pero NUNCA mientras el catálogo va en camino.
   *
   * Esto reemplazaba el tipo de documento en la fracción de segundo que tarda la
   * lista en llegar: con `catalogued` todavía vacío, `currentOptions` caía a la
   * lista escrita a mano, que jamás está vacía porque `legacyFor` retrocede a
   * CONSTITUCIONAL. La actuación elegida en Orientación no estaba ahí, así que
   * se perdía antes de que nadie la viera, y el abogado llegaba al taller con un
   * tipo de documento que no escogió.
   *
   * CARGANDO no es VACÍA. Con esa distinción, esperar es posible.
   */
  useEffect(() => {
    const reemplazo = reemplazoDeTipoDeDocumento(catalogo, currentOptions, documentType);
    if (reemplazo) setDocumentType(reemplazo);
  }, [catalogo, currentOptions, documentType, setDocumentType]);

  const handleBranchChange = (branch: string) => {
    setLegalBranch(branch);
  };

  const handleRoleChange = (role: ActuacionRole) => {
    setUserRole(role);
  };

  /**
   * Lists the files the lawyer selected. It does not read or send them.
   *
   * That limit is stated in the UI now, because the previous version hid it
   * behind an appearance of work: a 600ms pause, and then a badge on every file
   * classifying the ruling as **Concedido** or **Negado** — green or red — based
   * on whether its FILENAME contained "conced" or "nega". Naming a file
   * `borrador_concedido.pdf` made the product assert how a court had ruled.
   *
   * The contents never reached the model either: importedFiles is local state,
   * and the draft request body carries documentType, legalBranch and the prompt.
   * A lawyer attaching the rulings their brief should rest on saw them listed
   * and none of it arrived.
   */
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: CaseStudyFile[] = Array.from(files).map((f, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: 'DOCUMENTO_ESTUDIO'
    }));

    setImportedFiles((prev) => [...prev, ...newFiles]);
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
          <div className={`${CONTROL_WIDTH} flex bg-slate-100/80 p-0.5 rounded-lg`}>
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.role}
                onClick={() => handleRoleChange(tab.role)}
                title={tab.hint}
                className={`flex-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
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
            className={`${CONTROL_WIDTH} bg-white border border-slate-200/80 text-slate-800 font-medium text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40 truncate`}
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
          <label className="text-[12px] text-slate-500 font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Tipo
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className={`${CONTROL_WIDTH} bg-white border border-slate-200/80 text-slate-800 font-medium text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-blue-900/40 truncate`}
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

        {/*
          El aviso que faltaba, y que el de arriba ya no alcanza a dar.

          Ese avisa por RAMA, y desde que se catalogaron las 22 no vuelve a
          aparecer nunca. Pero una actuación concreta todavía puede no resolver
          — y entonces el motor de redacción cae a una plantilla de texto libre y
          Claude escribe la norma y el término DE MEMORIA. Eso es exactamente lo
          que el catálogo existe para impedir, y hasta ahora ocurría sin que el
          abogado lo supiera.
          
          Se dispara solo en SIN_CATALOGAR: mientras carga no se dice nada,
          porque una advertencia que parpadea enseña a ignorar todas las demás.
        */}
        {isCatalogued && lookup.estado === 'SIN_CATALOGAR' && (
          <p className="text-[10px] text-amber-700 leading-snug flex items-start gap-1">
            <span aria-hidden="true">⚠</span>
            <span>
              <strong>"{documentType}"</strong> no está en el catálogo verificado. El borrador se
              redactará con la norma y el término que el modelo recuerde, no con los comprobados:
              revísalos antes de radicar, o escoge una actuación de la lista.
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
          <input type="file" multiple accept=".pdf,.docx,.doc,.txt" onChange={handleFileSelection} className="hidden" />
          <UploadCloud className="w-4 h-4 text-slate-400" />
          <span className="text-[12px] font-medium text-slate-500">Adjuntar sentencias o pruebas</span>
        </label>

        {/* Says what the feature does. It listed files while implying the draft
            would use them, which is the quietest way to be wrong. */}
        <p className="mt-1.5 text-[10.5px] text-amber-700 leading-snug">
          Por ahora solo se listan: su contenido todavía no se envía al redactor.
        </p>

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
                  {/* The Concedido/Negado badges are gone. Nothing here has read
                      the ruling, so nothing here can say how it was decided. */}
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
