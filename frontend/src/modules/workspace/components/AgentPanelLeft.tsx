import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Image as ImageIcon,
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
import { RevisarEscritoDialog } from './RevisarEscritoDialog';
import type { DatosDelTaller } from './TallerDeRevision';
import {
  EXTENSIONES_ACEPTADAS,
  MAX_ADJUNTOS,
  MAX_BYTES_TOTAL,
  admitirArchivo,
  adjuntosPendientes,
  esArchivoImagen,
  formatoMb,
  prepararAdjuntos,
  type ArchivoAdjunto,
  type EstadoDeAdjunto
} from '../services/adjuntos';

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

/** Qué se le dice al abogado por cada estado de un adjunto. */
const ETIQUETA_ESTADO: Record<EstadoDeAdjunto, string> = {
  listo: 'se leerá al generar',
  leyendo: 'leyendo…',
  enviado: 'enviado',
  error: 'no se pudo leer'
};

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
  /** Async para poder esperar la generación y limpiar los adjuntos al terminar. */
  handleSendPrompt: (e: React.FormEvent) => void | Promise<void>;
  logs: AgentLog[];
  activeDraftText?: string | null;
  onClearActiveDraft?: () => void;
  /** Lo decide App: en movil solo se ve un panel a la vez. */
  ocultoEnMovil?: boolean;
  /** Tras una operacion que cobra (la revision), para que la barra lateral relea el saldo. */
  onSaldoCambiado?: () => void;
  /** Abrir el taller de revision con el escrito y su informe. */
  onAbrirTaller?: (datos: DatosDelTaller) => void;
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
  onClearActiveDraft,
  ocultoEnMovil = false,
  onSaldoCambiado,
  onAbrirTaller
}) => {
  const [importedFiles, setImportedFiles] = useState<ArchivoAdjunto[]>([]);
  /** Por qué el último archivo elegido no entró a la lista; se borra al elegir otro. */
  const [avisoAdjuntos, setAvisoAdjuntos] = useState<string | null>(null);
  /** Mientras se reducen fotos, se leen y se suben: el botón espera. */
  const [preparandoAdjuntos, setPreparandoAdjuntos] = useState(false);
  /** «Revisar un escrito»: el tercer uso del módulo, junto a redactar y corregir. */
  const [revisarAbierto, setRevisarAbierto] = useState(false);

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
  /*
   * La marca es EL TIPO DE DOCUMENTO, no la actuacion resuelta — y esa
   * diferencia fue una regresion real: cambiar de RAMA re-resuelve el mismo
   * tipo como otra actuacion (otro exactName), el guard dejaba pasar, y el rol
   * que el abogado acababa de poner en Secretaria volvia solo a Litigante.
   * El tipo solo cambia cuando alguien lo elige (aqui u Orientacion): esa es
   * la unica senal que justifica mover el rol.
   */
  /*
   * Nace con el tipo INICIAL, no en null — segunda vuelta de la misma
   * regresion: con null, el tipo por defecto ("Contestacion de Demanda") no
   * resuelve en la rama inicial, y al cambiar a una rama donde SI existe
   * resolvia "por primera vez" y disparaba el sync — devolviendo el rol que
   * el abogado acababa de elegir. Solo un CAMBIO de tipo es intencion.
   */
  const rolSincronizadoPara = React.useRef<string | null>(documentType);

  useEffect(() => {
    if (lookup.estado !== 'ENCONTRADA' || !actuacion) return;
    if (rolSincronizadoPara.current === documentType) return;
    rolSincronizadoPara.current = documentType;
    if (actuacion.role !== userRole) setUserRole(actuacion.role);
  }, [lookup.estado, actuacion, userRole, documentType]);

  /**
   * Adjuntar archivos.
   *
   * AHORA SÍ SE LEEN. Durante meses los archivos se listaban y su contenido no
   * llegaba al redactor — `importedFiles` era estado local y la petición
   * llevaba solo tipo, rama y prompt —, así que un comparendo adjunto salía en
   * el escrito como [•]. Hoy, al generar, cada archivo se convierte en base64
   * o sube a B2 (`prepararAdjuntos`) y el servidor lo lee antes de llamar a
   * los motores. El estado por archivo se ve en la lista.
   *
   * Los límites se aplican AL ELEGIR: enterarse al pulsar «Generar», con la
   * instrucción ya escrita, es el peor momento.
   *
   * Antes, además, cada ficha mostraba "Concedido" o "Negado" según si el NOMBRE
   * del archivo contenía "conced" o "nega": llamar a un archivo
   * `borrador_concedido.pdf` hacía que el producto afirmara cómo falló un juez.
   */
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Fuera del actualizador de estado: un aviso es efecto, y el actualizador
    // puede correr dos veces en desarrollo.
    let aviso: string | null = null;
    const lista = [...importedFiles];
    for (const [idx, f] of Array.from(files).entries()) {
      const admision = admitirArchivo(f, lista);
      if (!admision.ok) {
        aviso = `${f.name}: ${admision.motivo}`;
        continue;
      }
      lista.push({
        id: `file-${Date.now()}-${idx}`,
        file: f,
        name: f.name,
        size: formatoMb(f.size),
        esImagen: esArchivoImagen(f),
        estado: 'listo'
      });
    }
    setAvisoAdjuntos(aviso);
    setImportedFiles(lista);
    // Permite volver a elegir el mismo archivo tras quitarlo.
    e.target.value = '';
  };

  const removeFile = (id: string) => setImportedFiles((prev) => prev.filter((f) => f.id !== id));

  const marcarEstado = (id: string, estado: EstadoDeAdjunto, detalle?: string) =>
    setImportedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, estado, detalle } : f)));

  /*
   * Solo las OBLIGATORIAS. El catálogo distingue las que la norma exige de las
   * que son costumbre, y decir "9 secciones" contando ambas infla el dato justo
   * donde el abogado lo usa para saber si su escrito está completo.
   */
  const obligatorias = actuacion?.requiredSections.filter((sec) => sec.mandatory).length ?? 0;

  /*
   * SIN ACTUACION NO SE GENERA.
   *
   * El tipo es el contrato con el catalogo: es lo que resuelve el articulo, la
   * autoridad y el termino verificado. Permitir generar sin el produce un
   * escrito con la norma que el modelo recuerde, que es justo lo que el
   * catalogo existe para impedir — y el abogado no tiene como distinguirlo del
   * bueno una vez esta escrito.
   */
  const faltaActuacion = !documentType;

  /*
   * Generar: primero los adjuntos, después la petición.
   *
   * `preventDefault` va ANTES de la espera: el hook también lo llama, pero
   * para cuando las fotos estén reducidas y subidas el formulario ya habría
   * recargado la página. Los que fallan al prepararse se quedan en la lista
   * marcados con su motivo; los enviados se retiran al terminar, para que la
   * siguiente generación no los repita sin que el abogado lo pida.
   */
  const generar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalPrompt.trim() || isProcessing || preparandoAdjuntos || faltaActuacion) return;

    const pendientes = importedFiles.filter((f) => f.estado !== 'error');
    if (pendientes.length > 0) {
      setPreparandoAdjuntos(true);
      try {
        adjuntosPendientes.set(await prepararAdjuntos(pendientes, marcarEstado));
      } finally {
        setPreparandoAdjuntos(false);
      }
    }

    try {
      await handleSendPrompt(e);
    } finally {
      setImportedFiles((prev) => prev.filter((f) => f.estado === 'error'));
    }
  };

  return (
    /*
      EL TALLER SE PARTE EN MOVIL (4d): «la instruccion es la pantalla, y el
      documento generado se abre despues como pantalla propia». Aqui esa
      decision solo se OBEDECE — quien la toma es App, que sabe si ya hay
      borrador. El `hidden lg:flex` va en la propia seccion y no en un
      envoltorio para no perder `w-full lg:w-[364px]`, que es lo que le da su
      ancho en cada tamaño.
    */
    <section
      className={`min-h-0 w-full min-w-0 shrink-0 flex-col border-r border-line-200 bg-surface lg:w-[364px] xl:w-[400px] ${
        ocultoEnMovil ? 'hidden lg:flex' : 'flex'
      }`}
    >
        {/*
          `overflow-y-auto`: en una pantalla baja el formulario se desplaza en
          vez de derramarse sobre la consola. Antes ambos eran `flex-1` y se
          pisaban.
        */}
        <form onSubmit={generar} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-subtitle text-ink-900">Qué debe hacer este escrito</h2>
            {/* Un atajo de teclado en un telefono es ruido: no hay teclado que lo tenga. */}
            <span className="ml-auto hidden shrink-0 font-mono text-[11px] text-ink-400 lg:inline">
              ⌘↵ generar
            </span>
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
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void generar(e);
            }}
            placeholder={
              activeDraftText
                ? 'Qué corregir, continuar o ampliar del borrador cargado…'
                : documentType
                ? `Describa los hechos y la pretensión para ${documentType.toLowerCase()}…`
                : 'Describa los hechos y la pretensión de este escrito…'
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
                accept={EXTENSIONES_ACEPTADAS}
                onChange={handleFileSelection}
                disabled={preparandoAdjuntos || isProcessing}
                className="hidden"
              />
              <UploadCloud className="h-4 w-4 text-ink-400" />
              <span className="flex items-center gap-1 text-meta font-medium text-ink-500">
                <Paperclip className="h-3 w-3" />
                Adjuntar sentencias, pruebas o fotos
              </span>
            </label>

            {/*
              Dice lo que la función hace de verdad, igual que antes decía lo
              que NO hacía. Un aviso que promete de más es la forma más
              silenciosa de estar equivocado; uno que promete de menos, la más
              cara: el abogado teclea lo que ya está en el adjunto.
            */}
            <p className="mt-1.5 text-[11px] leading-[1.45] text-ink-500 [text-wrap:pretty]">
              Se leen PDF, Word, texto e imágenes (fotos de comparendos, oficios, cédulas). Lo que se
              extraiga se usa en el escrito y queda marcado como dato del adjunto. Hasta {MAX_ADJUNTOS}{' '}
              archivos y {formatoMb(MAX_BYTES_TOTAL).replace('.0', '')} en total.
            </p>

            {avisoAdjuntos && <p className="notice-unverified mt-1.5">{avisoAdjuntos}</p>}

            {importedFiles.length > 0 && (
              <ul className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
                {importedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 rounded-control bg-canvas px-2 py-1.5 text-meta"
                    title={file.detalle}
                  >
                    {file.esImagen ? (
                      <ImageIcon className="h-3 w-3 shrink-0 text-ink-400" />
                    ) : (
                      <FileText className="h-3 w-3 shrink-0 text-ink-400" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-ink-700">{file.name}</span>
                    {/*
                      El estado, por archivo: «leyendo…» mientras se reduce o
                      sube, «enviado» cuando viaja, «no se pudo leer» con el
                      motivo en el title. Sin esto, tres fotos de 8 MB son un
                      botón mudo durante veinte segundos.
                    */}
                    <span
                      className={`shrink-0 font-mono text-[10px] ${
                        file.estado === 'error'
                          ? 'text-danger'
                          : file.estado === 'enviado'
                          ? 'text-verified'
                          : 'text-ink-400'
                      }`}
                    >
                      {file.estado === 'leyendo' && file.detalle ? file.detalle : ETIQUETA_ESTADO[file.estado]}
                      {file.estado === 'listo' ? ` · ${file.size}` : ''}
                    </span>
                    {/*
                      Las etiquetas "Concedido"/"Negado" no están. Nada aquí ha
                      leído la sentencia, así que nada aquí puede decir cómo se
                      falló.
                    */}
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      disabled={preparandoAdjuntos}
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

          {/* ─── REVISAR UN ESCRITO YA REDACTADO ─────────────────────────────
              Aquí el archivo también se lee, pero no para redactar sino para
              revisar: el abogado trae su
              tutela y pregunta qué falla. Es un informe contra la ficha de la
              actuación elegida arriba, y el documento no se guarda. */}
          <button
            type="button"
            onClick={() => setRevisarAbierto(true)}
            className="mt-3 flex w-full items-center gap-2.5 rounded-control border border-[rgb(var(--brand-line))] bg-brand-50 px-3 py-2.5 text-left shadow-[inset_3px_0_0_rgb(var(--brand-700))] hover:border-brand-700 hover:bg-brand-50/70"
          >
            <ClipboardCheck className="h-4 w-4 shrink-0 text-brand-700" />
            <span className="min-w-0 flex-1">
              <span className="block text-ui font-medium text-ink-900">Revisar un escrito ya redactado</span>
              <span className="block text-[11px] leading-snug text-ink-500">
                Suba su tutela, demanda o recurso y pregunte qué está bien, qué está mal y qué corregir. Informe, no borrador.
              </span>
            </span>
          </button>
          <RevisarEscritoDialog
            abierto={revisarAbierto}
            onCerrar={() => setRevisarAbierto(false)}
            documentType={documentType}
            legalBranch={legalBranch}
            precioCop={2000}
            onSaldoCambiado={onSaldoCambiado}
            onAbrirTaller={onAbrirTaller}
          />

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
                      <p
                        className="mt-0.5 line-clamp-2 text-justify text-meta leading-[1.45] text-ink-500 [text-wrap:pretty]"
                        title={actuacion.legalBasis}
                      >
                        {actuacion.legalBasis}
                      </p>
                    </div>
                  </div>

                  {/*
                    DOS RENGLONES, CON EL NOMBRE ARRIBA — la misma lección que
                    el Combobox ya había aprendido y que aquí faltaba aplicar.

                    Estaban en UNA fila: número · nombre · «oblig.» · fundamento,
                    y el fundamento llevaba `shrink-0`. Los fundamentos de este
                    catálogo no son «art. 14»: son frases enteras —«Decreto 2591
                    de 1991, art. 14 (no es indispensable citar norma)»—, así que
                    con `shrink-0` no cedían un píxel. Medido en producción sobre
                    la acción de tutela: el panel mide 399 px y su contenido
                    llegaba a 1047; un fundamento ocupaba 900 px él solo y
                    aplastaba el nombre de la sección a 74 px, que es como se
                    leía «Identificación / y residencia / del / solicitante» en
                    columna, con la cita cortada contra el borde.

                    Ahora el nombre manda y ocupa el ancho; el fundamento va
                    debajo, truncado con su `title` para leerlo completo.
                  */}
                  <ol className="mt-2 space-y-1.5 pl-5">
                    {actuacion.requiredSections.map((sec) => (
                      <li key={sec.n} className="flex min-w-0 items-baseline gap-1.5 text-meta">
                        <span className="shrink-0 font-mono text-[10px] text-ink-400">{sec.n}.</span>
                        {/*
                          JUSTIFICADO, como el escrito que va a producir. Los
                          nombres de sección de este catálogo son frases —«Los
                          nombres y apellidos completos del solicitante y de su
                          representante y/o apoderado, si es el caso, con
                          indicación de su documento de identidad»— y en una
                          columna de 300 px ocupan tres y cuatro renglones: en
                          bandera dejaban un borde derecho dentado que se lee
                          como lista de notas sueltas y no como la estructura
                          de un documento.

                          `text-wrap:pretty` evita la palabra huérfana en el
                          último renglón, que es lo que en columna estrecha
                          hace fea la justificación.
                        */}
                        <span className="min-w-0 flex-1 text-justify [text-wrap:pretty]">
                          <span className={sec.mandatory ? 'text-ink-900' : 'text-ink-500'}>
                            {sec.name}
                          </span>
                          {/*
                            El catálogo distingue lo que la norma EXIGE de lo que
                            es costumbre, y esa diferencia decide si omitir una
                            sección es un defecto o una elección de redacción.
                          */}
                          {sec.mandatory && (
                            <span className="ml-1.5 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.08em] text-verified">
                              oblig.
                            </span>
                          )}
                          {sec.basis && (
                            <span
                              className="mt-0.5 block truncate font-mono text-[10px] text-ink-400"
                              title={sec.basis}
                            >
                              {sec.basis}
                            </span>
                          )}
                        </span>
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
          {lookup.estado === 'SIN_CATALOGAR' && documentType && (
            <p className="notice-unverified mt-3">
              <span>
                <b className="font-semibold">“{documentType}”</b> no está en el catálogo verificado.
                El borrador usará la norma y el término que el modelo recuerde, no los comprobados.
              </span>
            </p>
          )}

          {/*
            EN MOVIL EL PRIMARIO VA PRIMERO, DE 48px Y A TODO EL ANCHO, con la
            nota DEBAJO (4d). En escritorio la nota va a la izquierda y el boton
            a la derecha, que es el orden de lectura de una fila. Invertirlo por
            tamaño no es capricho: en un telefono el pulgar llega al borde
            inferior, y una nota de dos renglones empujando el boton hacia abajo
            lo saca del alcance.
          */}
          <div className="mt-3 flex flex-col-reverse gap-2 border-t border-line-100 pt-3 lg:flex-row lg:items-center lg:gap-3">
            <p className="text-meta leading-[1.4] text-ink-500">
              {faltaActuacion
                ? 'Elija la actuación arriba: es la que trae el artículo y el término verificados.'
                : '3 modelos · el saldo se descuenta al terminar'}
            </p>
            <button
              type="submit"
              disabled={!legalPrompt.trim() || isProcessing || preparandoAdjuntos || faltaActuacion}
              title={faltaActuacion ? 'Elija la actuación en la barra de arriba' : undefined}
              className="btn-primary h-12 w-full shrink-0 lg:ml-auto lg:h-auto lg:w-auto"
            >
              {preparandoAdjuntos
                ? 'Preparando adjuntos…'
                : isProcessing
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
      {/*
        Justificado y con `title`: son párrafos —un término del catálogo puede
        ser «Dentro de los diez (10) días siguientes a la presentación de la
        solicitud el juez proferirá el fallo…»— y el recorte a tres renglones
        esconde el resto, así que el texto completo vive en el `title`.
      */}
      <p
        className="mt-0.5 line-clamp-3 text-justify text-meta leading-[1.45] text-ink-500 [text-wrap:pretty]"
        title={detalle}
      >
        {detalle}
      </p>
    </div>
  </li>
);
