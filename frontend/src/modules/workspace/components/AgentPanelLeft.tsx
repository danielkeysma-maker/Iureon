import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Landmark,
  Paperclip,
  RefreshCw,
  Scale,
  UploadCloud,
  X
} from 'lucide-react';
import { AgentConsoleStream } from '../../agent/components/AgentConsoleStream';
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
  /* Solo de lectura: quien los CAMBIA es la barra de configuración de arriba. */
  documentType: string;
  legalBranch: string;
  /*
   * El rol vive ARRIBA, no aquí.
   *
   * La barra de configuración abarca el ancho completo —sobre el panel y sobre
   * el documento—, así que el rol lo comparten los dos y no puede ser estado
   * privado de esta columna.
   */
  userRole: ActuacionRole;
  setUserRole: (role: ActuacionRole) => void;
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
  legalBranch,
  userRole,
  setUserRole,
  legalPrompt,
  setLegalPrompt,
  isProcessing,
  handleSendPrompt,
  logs,
  activeDraftText,
  onClearActiveDraft
}) => {
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

  /*
   * Solo las OBLIGATORIAS. El catálogo distingue las que la norma exige de las
   * que son costumbre, y decir "9 secciones" contando ambas infla el dato justo
   * donde el abogado lo usa para saber si su escrito está completo.
   */
  const obligatorias = actuacion?.requiredSections.filter((sec) => sec.mandatory).length ?? 0;

  const generar = (e: React.FormEvent) => {
    if (!legalPrompt.trim() || isProcessing) return;
    handleSendPrompt(e);
  };

  return (
    <section className="flex min-h-0 w-full shrink-0 flex-col border-r border-line-200 bg-surface lg:w-[364px] xl:w-[400px]">
        {/*
          `overflow-y-auto`: en una pantalla baja el formulario se desplaza en
          vez de derramarse sobre la consola. Antes ambos eran `flex-1` y se
          pisaban.
        */}
        <form onSubmit={generar} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
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
              LO QUE HAY DETRÁS DEL ESCRITO, CON DATOS Y NO CON FRASES.

              La primera versión decía "del corpus curado, si hay precedente" y
              "Corte Constitucional y Suprema" — descripciones de capacidad, no
              información. Un abogado las leía y no sabía nada nuevo: ocupaban
              sitio afirmando que el producto tiene funciones.

              Ahora cada línea trae un dato comprobable de ESTE escrito, y la que
              no lo tenga no se pinta. */}
          {lookup.estado === 'ENCONTRADA' && actuacion && (
            <div className="mt-3 rounded-card border border-line-200">
              <p className="flex items-baseline gap-2 border-b border-line-100 px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Con qué se va a redactar
                <span className="ml-auto normal-case tracking-normal text-verified">
                  {obligatorias} obligatorias
                </span>
              </p>
              <ul className="divide-y divide-line-100">
                {/*
                  LAS SECCIONES, POR NOMBRE.
                  
                  Decía solo "4 secciones obligatorias", y ese número no le sirve
                  a nadie: lo que el abogado necesita saber antes de generar es
                  CUÁLES — hechos, pretensiones, fundamentos, notificaciones —
                  porque es lo que va a revisar cuando el escrito salga. El dato
                  estaba en la ficha y se estaba contando en vez de mostrando.
                */}
                <li className="px-3 py-2">
                  <div className="flex items-start gap-2">
                    <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <div className="min-w-0">
                      <p className="text-meta font-medium text-ink-900">
                        Estructura exigida por la norma
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-meta leading-[1.45] text-ink-500">
                        {actuacion.legalBasis}
                      </p>
                    </div>
                  </div>

                  <ol className="mt-2 space-y-1 pl-5">
                    {actuacion.requiredSections.map((sec) => (
                      <li key={sec.n} className="flex items-baseline gap-1.5 text-meta">
                        <span className="shrink-0 font-mono text-[10px] text-ink-400">{sec.n}.</span>
                        <span className={sec.mandatory ? 'text-ink-900' : 'text-ink-500'}>
                          {sec.name}
                        </span>
                        {/*
                          El catálogo distingue lo que la norma EXIGE de lo que
                          es costumbre, y esa diferencia decide si omitir una
                          sección es un defecto o una elección de redacción.
                        */}
                        {sec.mandatory && (
                          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-verified">
                            oblig.
                          </span>
                        )}
                        {sec.basis && (
                          <span
                            className="ml-auto shrink-0 truncate font-mono text-[10px] text-ink-400"
                            title={sec.basis}
                          >
                            {sec.basis}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </li>

                {actuacion.competentAuthority && (
                  <Fundamento
                    icono={Landmark}
                    titulo="Ante"
                    detalle={actuacion.competentAuthority}
                  />
                )}

                {actuacion.term.status !== 'NO_VERIFICADO' && (
                  <Fundamento
                    icono={BookOpen}
                    titulo={actuacion.term.status === 'NO_CADUCA' ? 'No caduca' : 'Término'}
                    detalle={actuacion.term.description ?? ''}
                  />
                )}
              </ul>

              {actuacion.sourceUrl && (
                <a
                  href={actuacion.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 border-t border-line-100 px-3 py-2 text-meta text-brand-700 hover:underline"
                >
                  Ver la norma
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

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
  );
};

/** Una fuente que el escrito va a usar, con su estado. */
/**
 * Una fuente del escrito, en dos renglones.
 *
 * En uno solo no cabe: `legalBasis` y `term.description` de este catálogo son
 * párrafos con artículos y salvedades, no etiquetas. Puestos a la derecha de un
 * título aplastaban el título a cero — el mismo defecto que tuvo la lista de
 * actuaciones. Aquí el detalle va debajo y con tres líneas de tope.
 */
const Fundamento: React.FC<{
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  detalle: string;
}> = ({ icono: Icono, titulo, detalle }) => (
  <li className="flex items-start gap-2 px-3 py-2">
    <Icono className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
    <div className="min-w-0">
      <p className="text-meta font-medium text-ink-900">{titulo}</p>
      <p className="mt-0.5 line-clamp-3 text-meta leading-[1.45] text-ink-500">{detalle}</p>
    </div>
  </li>
);
