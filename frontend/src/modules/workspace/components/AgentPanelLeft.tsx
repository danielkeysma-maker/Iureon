import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Landmark,
  Paperclip,
  RefreshCw,
  Scale,
  UploadCloud,
  X
} from 'lucide-react';
import { AgentConsoleStream } from '../../agent/components/AgentConsoleStream';
import { WorkshopConfigBar } from './WorkshopConfigBar';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import type { AgentLog } from '../../agent/types';
import type { ActuacionRole } from '../../catalog/types';

/**
 * "Qué debe hacer este escrito" — la columna izquierda, ya sin la configuración.
 *
 * LA SEPARACIÓN SE RESUELVE POR EJE. Antes este panel apilaba el rol, la rama,
 * el tipo de documento, dos avisos, la ficha de la actuación, los adjuntos, la
 * instrucción y el botón de generar, todo con el mismo peso visual y los tres
 * selectores del mismo ancho: la acción principal y una configuración que se
 * toca UNA VEZ pesaban igual.
 *
 * Ahora "de qué se trata" vive arriba, en la barra de 42px, y esta columna es
 * entera para el trabajo: qué quiere que diga el escrito, con qué lo respalda, y
 * generar.
 */

/** El verbo del botón cambia con quién firma. Un juez no "demanda". */
const SUBMIT_LABEL: Record<ActuacionRole, string> = {
  LITIGANTE: 'Generar escrito',
  DESPACHO: 'Proyectar providencia',
  SECRETARIA: 'Generar acto'
};

/** Un archivo que el abogado adjuntó. Se lista; su contenido no viaja. */
interface ArchivoAdjunto {
  id: string;
  name: string;
  size: string;
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
  const [userRole, setUserRole] = useState<ActuacionRole>('LITIGANTE');
  const [importedFiles, setImportedFiles] = useState<ArchivoAdjunto[]>([]);

  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;

  /*
   * El rol sigue a la actuación, UNA SOLA VEZ por actuación nueva.
   *
   * Orientación propone sobre el catálogo entero y el 41% es de despacho o
   * secretaría; sin esto, elegir allí un acto administrativo aterrizaba en un
   * panel que no lo tenía en su lista. Y con la marca el selector sigue siendo
   * del abogado: sin ella el efecto lo devolvía a su sitio en cada render y el
   * filtro de rol quedaba inservible.
   */
  const rolSincronizadoPara = React.useRef<string | null>(null);

  useEffect(() => {
    if (lookup.estado !== 'ENCONTRADA' || !actuacion) return;
    if (rolSincronizadoPara.current === actuacion.exactName) return;
    rolSincronizadoPara.current = actuacion.exactName;
    if (actuacion.role !== userRole) setUserRole(actuacion.role);
  }, [lookup.estado, actuacion, userRole]);

  /**
   * Adjuntar archivos.
   *
   * LO QUE ESTO NO HACE, DICHO EN LA PANTALLA. Los archivos se listan y su
   * contenido NO llega al redactor: `importedFiles` es estado local y el cuerpo
   * de la petición lleva tipo, rama y prompt. Un abogado que adjunta las
   * sentencias en que se apoya su escrito las veía listadas y ninguna llegaba.
   *
   * Antes, además, cada ficha mostraba "Concedido" o "Negado" según si el NOMBRE
   * del archivo contenía "conced" o "nega": llamar a un archivo
   * `borrador_concedido.pdf` hacía que el producto afirmara cómo falló un juez.
   */
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportedFiles((prev) => [
      ...prev,
      ...Array.from(files).map((f, idx) => ({
        id: `file-${Date.now()}-${idx}`,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`
      }))
    ]);
  };

  const removeFile = (id: string) => setImportedFiles((prev) => prev.filter((f) => f.id !== id));

  const generar = (e: React.FormEvent) => {
    if (!legalPrompt.trim() || isProcessing) return;
    handleSendPrompt(e);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkshopConfigBar
        userRole={userRole}
        setUserRole={setUserRole}
        legalBranch={legalBranch}
        setLegalBranch={setLegalBranch}
        documentType={documentType}
        setDocumentType={setDocumentType}
      />

      <section className="flex min-h-0 w-full flex-col border-r border-line-200 bg-surface lg:w-[364px] xl:w-[400px]">
        <form onSubmit={generar} className="flex min-h-0 flex-1 flex-col p-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-subtitle text-ink-900">Qué debe hacer este escrito</h2>
            <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-400">⌘↵ generar</span>
          </div>
          <p className="mt-1 text-meta leading-[1.5] text-ink-500">
            Hechos, pretensiones, lo que quiere que sostenga. En lenguaje corriente.
          </p>

          {activeDraftText && (
            <div className="notice mt-3">
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700" />
              <span className="flex-1">
                Continuando un borrador de{' '}
                <b className="font-mono font-semibold">
                  {(activeDraftText.length / 1000).toFixed(1)}k
                </b>{' '}
                caracteres.
              </span>
              <button
                type="button"
                onClick={onClearActiveDraft}
                title="Descartar el borrador base"
                className="shrink-0 text-ink-400 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <textarea
            value={legalPrompt}
            onChange={(e) => setLegalPrompt(e.target.value)}
            onKeyDown={(e) => {
              // ⌘↵ / Ctrl+↵ genera. Se anuncia arriba, así que tiene que existir.
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generar(e);
            }}
            placeholder={
              activeDraftText
                ? 'Qué corregir, continuar o ampliar del borrador cargado…'
                : `Describa los hechos y la pretensión para ${documentType.toLowerCase()}…`
            }
            className="field-area mt-2.5 min-h-[140px] flex-1 resize-none"
          />

          <p className="mt-1 text-right font-mono text-[11px] text-ink-400">
            {legalPrompt.trim().length.toLocaleString('es-CO')} caracteres
          </p>

          {/* ─── ADJUNTOS ────────────────────────────────────────────────── */}
          <div className="mt-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-control border border-dashed border-line-200 bg-canvas py-2.5 hover:bg-brand-50">
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelection}
                className="hidden"
              />
              <UploadCloud className="h-4 w-4 text-ink-400" />
              <span className="flex items-center gap-1 text-meta font-medium text-ink-500">
                <Paperclip className="h-3 w-3" />
                Adjuntar sentencias o pruebas
              </span>
            </label>

            {/*
              Dice lo que la función hace de verdad. Listaba archivos dando a
              entender que el borrador los usaría, que es la forma más silenciosa
              de estar equivocado.
            */}
            <p className="notice-unverified mt-1.5">
              Por ahora solo se listan: su contenido todavía no se envía al redactor.
            </p>

            {importedFiles.length > 0 && (
              <ul className="mt-1.5 max-h-24 space-y-1 overflow-y-auto">
                {importedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 rounded-control bg-canvas px-2 py-1.5 text-meta"
                  >
                    <FileText className="h-3 w-3 shrink-0 text-ink-400" />
                    <span className="min-w-0 flex-1 truncate text-ink-700">{file.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-400">{file.size}</span>
                    {/*
                      Las etiquetas "Concedido"/"Negado" no están. Nada aquí ha
                      leído la sentencia, así que nada aquí puede decir cómo se
                      falló.
                    */}
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="shrink-0 text-ink-400 hover:text-danger"
                      aria-label={`Quitar ${file.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ─── FUNDAMENTOS QUE VA A USAR ─────────────────────────────────
              Lo que el escrito tendrá detrás, dicho ANTES de generar. Es lo que
              distingue este producto de una respuesta genérica, y hasta ahora
              solo se sabía leyendo la consola mientras corría. */}
          <div className="mt-3 rounded-card border border-line-200">
            <p className="border-b border-line-100 px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Fundamentos que va a usar
            </p>
            <ul className="divide-y divide-line-100">
              <Fundamento
                icono={Scale}
                titulo="Catálogo"
                detalle={
                  lookup.estado === 'ENCONTRADA' && actuacion
                    ? `${actuacion.requiredSections.length} secciones exigidas`
                    : lookup.estado === 'CARGANDO'
                    ? 'consultando…'
                    : 'sin ficha verificada'
                }
                atenuado={lookup.estado === 'SIN_CATALOGAR'}
              />
              <Fundamento
                icono={BookOpen}
                titulo="Jurisprudencia"
                detalle="del corpus curado, si hay precedente"
              />
              <Fundamento
                icono={Landmark}
                titulo="Registros en vivo"
                detalle="Corte Constitucional y Suprema"
              />
            </ul>
          </div>

          {/*
            EL AVISO QUE MÁS IMPORTA, y por eso va pegado al botón y no arriba.
            Una actuación que no resuelve hace que el motor caiga a plantilla
            libre y el modelo escriba la norma y el término DE MEMORIA — que es
            exactamente lo que el catálogo existe para impedir.

            Solo en SIN_CATALOGAR: mientras carga no se dice nada, porque una
            advertencia que parpadea enseña a ignorar todas las demás.
          */}
          {lookup.estado === 'SIN_CATALOGAR' && (
            <p className="notice-unverified mt-3">
              <span>
                <b className="font-semibold">“{documentType}”</b> no está en el catálogo verificado.
                El borrador usará la norma y el término que el modelo recuerde, no los comprobados.
              </span>
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 border-t border-line-100 pt-3">
            <p className="text-meta leading-[1.4] text-ink-500">
              3 modelos · el saldo se descuenta al terminar
            </p>
            <button
              type="submit"
              disabled={!legalPrompt.trim() || isProcessing}
              className="btn-primary ml-auto shrink-0"
            >
              {isProcessing
                ? 'Generando…'
                : activeDraftText
                ? 'Continuar el borrador'
                : SUBMIT_LABEL[userRole]}
            </button>
          </div>
        </form>

        <AgentConsoleStream logs={logs} isProcessing={isProcessing} />
      </section>
    </div>
  );
};

/** Una fuente que el escrito va a usar, con su estado. */
const Fundamento: React.FC<{
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  detalle: string;
  atenuado?: boolean;
}> = ({ icono: Icono, titulo, detalle, atenuado }) => (
  <li className="flex items-center gap-2 px-3 py-2">
    <Icono className={`h-3.5 w-3.5 shrink-0 ${atenuado ? 'text-unverified' : 'text-ink-400'}`} />
    <span className="text-meta font-medium text-ink-900">{titulo}</span>
    <span className={`ml-auto truncate text-meta ${atenuado ? 'text-unverified' : 'text-ink-500'}`}>
      {detalle}
    </span>
  </li>
);
