import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ClipboardCheck, FileText, Image as ImageIcon, Paperclip, RefreshCw, UploadCloud, X } from 'lucide-react';
import { AgentConsoleStream } from '../../agent/components/AgentConsoleStream';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import { usePerfilDeEstilo } from '../../estilo/hooks/usePerfilDeEstilo';
import { lineaDelPaso3, TEXTO_INTERRUPTOR } from '../../estilo/estiloEnPantalla';
import type { AgentLog } from '../../agent/types';
import type { ActuacionRole } from '../../catalog/types';
import { RevisarEscritoDialog } from './RevisarEscritoDialog';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import { Dialog } from '../../../design/Dialog';
import { VisorDeArchivo } from './VisorDeArchivo';
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
 * «Redactar un escrito»: el asistente de Redacción antes de que exista el
 * borrador. Artboard «Redactar un escrito» (líneas 676–755) de
 * `public/handoff/app-redaccion-revision.html`.
 *
 * ─── DE COLUMNA A ASISTENTE ─────────────────────────────────────────────────
 *
 * Esto era la columna izquierda de 364 px junto a un lienzo vacío: la
 * configuración arriba, el cuadro a la izquierda y un papel en blanco que decía
 * «Aún no hay borrador». El titular vio en producción que la cara nueva solo
 * había recoloreado ese esquema. El artboard pide otra cosa: UNA columna
 * centrada con pasos numerados, porque antes de generar no hay nada que mirar a
 * la derecha, y el papel aparece cuando existe.
 *
 * Los pasos son los que el producto tiene: qué va a presentar (caso y cascada),
 * los hechos y las pruebas, y —solo si la firma lo configuró— su formato. El
 * botón y su precio cierran la columna.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «Usará los 3 documentos del caso · Elegir». Los documentos del expediente
 *   llegan al motor solos al atar el caso; no hay un selector de cuáles, y
 *   pintarlo sería ofrecer una elección que no se aplica.
 * · El interruptor del artboard habla de lo que «usted» enseñó. Existe desde el
 *   14 de septiembre de 2026, pero dice «su firma»: enseña el socio
 *   administrador, no necesariamente quien redacta. Solo aparece cuando la firma
 *   enseñó un formato para ese rol; si no, una línea lo dice y no hay nada que
 *   apagar.
 * · «Cuesta $2.000 de su saldo». $2.000 es el PISO: se cobra el mayor entre el
 *   piso y lo que el escrito midió (`priceFor` en el servidor).
 * · «Armar el borrador». El verbo sigue a quién firma, como antes.
 */

/** El verbo del botón cambia con quién firma. Un juez no "demanda". */
const SUBMIT_LABEL: Record<ActuacionRole, string> = {
  LITIGANTE: 'Generar escrito',
  DESPACHO: 'Proyectar providencia',
  SECRETARIA: 'Generar acto'
};

/*
 * EL PISO DEL ESCRITO, en pesos. Es `PRICE_COP.BORRADOR` del servidor
 * (`billing.service.ts`), y el cobro real es `max(piso, costo medido)`: por eso
 * la frase dice «desde» y que un escrito largo cuesta lo que mida. Si el piso
 * cambia allá, esta frase miente hasta que alguien la cambie aquí.
 */
const PRECIO_DESDE = 'Desde $2.000 de su saldo; un escrito largo cuesta lo que mida.';

/** Qué se le dice al abogado por cada estado de un adjunto. */
const ETIQUETA_ESTADO: Record<EstadoDeAdjunto, string> = {
  listo: 'se leerá al generar',
  leyendo: 'leyendo…',
  enviado: 'enviado',
  error: 'no se pudo leer'
};

interface AgentPanelLeftProps {
  /* Solo de lectura: quien los CAMBIA es la cascada del paso 1. */
  documentType: string;
  legalBranch: string;
  /* El rol vive arriba: lo comparten la cascada, este botón y el lienzo. */
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
  /**
   * Lo decide App: con un borrador a la vista el asistente se OCULTA, no se
   * desmonta. Así conserva los adjuntos elegidos, lo escrito y las reglas de la
   * cascada, que siguen vigilando la rama.
   */
  oculto?: boolean;
  /** Tras una operacion que cobra (la revision), para que la barra lateral relea el saldo. */
  onSaldoCambiado?: () => void;
  /** Abrir el taller de revision con el escrito y su informe. */
  onAbrirTaller?: (datos: DatosDelTaller) => void;
  /**
   * Lleva a Redacción la actuación que el abogado escogió tras leer un
   * documento recibido. Opcional: sin ella el botón no se ofrece.
   */
  onRedactar?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
  /** La cascada de quién firma, rama y actuación (una pintura por tamaño). */
  cascada: React.ReactNode;
  /** «De qué caso»; ausente si la firma no tiene expedientes. */
  caso?: React.ReactNode;
  /** Si la firma configuró Membrete: es lo único de «cómo escribe su firma» que viaja al motor. */
  formatoDeFirmaConfigurado?: boolean;
  onAbrirMembrete?: () => void;
  /** «Usar el formato y la jerga que su firma enseñó», para este borrador. */
  usarEstilo?: boolean;
  setUsarEstilo?: (usar: boolean) => void;
  /** Un borrador abierto en esta pestaña al que se puede volver. */
  borradorAbierto?: { titulo: string; onVolver: () => void } | null;
}

/** Un paso numerado del asistente. */
const Paso: React.FC<{ n: number; titulo: string; children: React.ReactNode }> = ({ n, titulo, children }) => (
  <section className="cn-red-paso">
    <div className="cn-red-paso-cabeza">
      <span className="cn-red-paso-n" aria-hidden>
        {n}
      </span>
      <h2 className="cn-red-paso-titulo">{titulo}</h2>
    </div>
    <div className="cn-red-paso-cuerpo">{children}</div>
  </section>
);

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
  oculto = false,
  onSaldoCambiado,
  onAbrirTaller,
  onRedactar,
  cascada,
  caso,
  formatoDeFirmaConfigurado = false,
  onAbrirMembrete,
  usarEstilo = true,
  setUsarEstilo,
  borradorAbierto = null
}) => {
  const [importedFiles, setImportedFiles] = useState<ArchivoAdjunto[]>([]);
  /** Por qué el último archivo elegido no entró a la lista; se borra al elegir otro. */
  const [avisoAdjuntos, setAvisoAdjuntos] = useState<string | null>(null);
  /** Mientras se reducen fotos, se leen y se suben: el botón espera. */
  const [preparandoAdjuntos, setPreparandoAdjuntos] = useState(false);
  /* El operador puede apagar los adjuntos para una firma: el botón queda gris con el aviso y el servidor rechaza los archivos con 403. */
  const adjuntosHabilitados = useFuncionHabilitada('REDACCION.ADJUNTOS');
  /*
   * EL ADJUNTO QUE SE ESTÁ MIRANDO. Para verlo no hace falta guardarlo: el
   * `File` está aquí, en el navegador, y se pinta desde memoria.
   */
  const [adjuntoAbierto, setAdjuntoAbierto] = React.useState<File | null>(null);
  /** «Revisar un escrito»: el tercer uso del módulo, junto a redactar y corregir. */
  const [revisarAbierto, setRevisarAbierto] = useState(false);

  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;

  /*
   * EL FORMATO ENSEÑADO SE BUSCA COMO LO BUSCARÁ EL SERVIDOR: con el rol de la
   * ficha cuando la actuación resuelve y, si no, con el del taller; y con la rama
   * del paso 1, con respaldo al general del rol. Mientras carga o si la consulta
   * falla no se dice nada del estilo: «su firma no ha enseñado» sería afirmar lo
   * que no se comprobó.
   */
  const rolDelEstilo = actuacion?.role ?? userRole;
  const perfilDeEstilo = usePerfilDeEstilo(rolDelEstilo, legalBranch || null);
  const lineaDeEstilo =
    perfilDeEstilo.estado === 'LISTO'
      ? lineaDelPaso3({ lecciones: perfilDeEstilo.respuesta.perfil.lecciones, rama: perfilDeEstilo.respuesta.rama }, rolDelEstilo)
      : null;

  /*
   * El rol sigue a la actuación, UNA SOLA VEZ por actuación nueva.
   *
   * La marca es EL TIPO DE DOCUMENTO, no la actuación resuelta: cambiar de RAMA
   * re-resuelve el mismo tipo como otra actuación, y el rol que el abogado
   * acababa de poner volvía solo a Litigante. Y nace con el tipo INICIAL, no en
   * null: solo un CAMBIO de tipo es intención.
   */
  const rolSincronizadoPara = React.useRef<string | null>(documentType);

  useEffect(() => {
    if (lookup.estado !== 'ENCONTRADA' || !actuacion) return;
    if (rolSincronizadoPara.current === documentType) return;
    rolSincronizadoPara.current = documentType;
    if (actuacion.role !== userRole) setUserRole(actuacion.role);
  }, [lookup.estado, actuacion, userRole, documentType]);

  /*
   * LA CONSOLA APARECE DEBAJO DEL BOTÓN AL GENERAR, y se trae a la vista.
   *
   * Se decidió debajo y no en lugar del formulario: el formulario conserva a la
   * vista la actuación y el caso con los que se está redactando, y si el motor
   * falla el aviso queda pegado al botón que se vuelve a pulsar. Mientras corre,
   * los controles están apagados, así que nada de lo que se ve puede cambiar.
   */
  const consolaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isProcessing) consolaRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isProcessing]);

  /**
   * Adjuntar archivos. AHORA SÍ SE LEEN: al generar, cada archivo se convierte
   * en base64 o sube a B2 (`prepararAdjuntos`) y el servidor lo lee antes de
   * llamar a los motores. Los límites se aplican AL ELEGIR: enterarse al pulsar
   * «Generar», con la instrucción ya escrita, es el peor momento.
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
   * SIN ACTUACION NO SE GENERA. El tipo es el contrato con el catálogo: es lo
   * que resuelve el artículo, la autoridad y el término verificado.
   */
  const faltaActuacion = !documentType;

  /*
   * Generar: primero los adjuntos, después la petición. `preventDefault` va
   * ANTES de la espera; los que fallan al prepararse se quedan en la lista
   * marcados con su motivo; los enviados se retiran al terminar.
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

  const hayConsola = isProcessing || logs.length > 0;

  return (
    <section className={`cn-red-panel min-h-0 w-full min-w-0 flex-1 flex-col ${oculto ? 'hidden' : 'flex'}`}>
      <form onSubmit={generar} className="cn-red-form flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="cn-red-asistente">
          <header className="cn-red-asistente-cabeza">
            <h1 className="cn-red-h1">Redactar un escrito</h1>
            {/*
              LA BAJADA DICE LO QUE LA ELECCIÓN TRAE DE VERDAD: la estructura de la
              ficha siempre, y el término con su artículo cuando la ficha los tiene
              verificados. «Usted lo revisa y lo firma» del artboard es cierto pero
              no orienta el primer paso.
            */}
            <p className="cn-red-bajada">
              Primero qué va a presentar: esa elección trae la estructura del escrito y, cuando la ficha lo tiene verificado, el término con su
              artículo.
            </p>
            {borradorAbierto && (
              <p className="cn-red-volver">
                <span className="cn-red-volver-texto">
                  Tiene abierto <b className="cn-red-cifra">«{borradorAbierto.titulo}»</b>; sigue guardado.
                </span>
                <button type="button" onClick={borradorAbierto.onVolver} className="cn-red-volver-boton">
                  Volver al borrador
                  <ArrowRight className="cn-red-volver-svg" strokeWidth={1.8} aria-hidden />
                </button>
              </p>
            )}
          </header>

          <Paso n={1} titulo="Qué va a presentar">
            {caso}
            {cascada}
          </Paso>

          <Paso n={2} titulo="Los hechos y las pruebas">
            {activeDraftText && (
              <div className="cn-red-continuando">
                <RefreshCw className="cn-red-continuando-icono" strokeWidth={1.8} aria-hidden />
                <span className="cn-red-continuando-texto">
                  Continuando un borrador de <b className="cn-red-cifra">{(activeDraftText.length / 1000).toFixed(1)}k</b> caracteres.
                </span>
                <button
                  type="button"
                  onClick={onClearActiveDraft}
                  title="Descartar el borrador base"
                  aria-label="Descartar el borrador base"
                  className="cn-red-icono-boton"
                >
                  <X className="cn-red-icono-boton-svg" strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            )}

            <label className="cn-red-rotulo" htmlFor="que-debe-hacer-este-escrito">
              Qué debe hacer este escrito
            </label>
            <textarea
              id="que-debe-hacer-este-escrito"
              value={legalPrompt}
              onChange={(e) => setLegalPrompt(e.target.value)}
              disabled={isProcessing}
              onKeyDown={(e) => {
                // ⌘↵ / Ctrl+↵ genera. Se anuncia junto al botón, así que tiene que existir.
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void generar(e);
              }}
              placeholder={
                activeDraftText
                  ? 'Qué corregir, continuar o ampliar del borrador cargado…'
                  : 'Cuente el caso como se lo contó el cliente: hechos, pretensiones, lo que quiere que sostenga. No hace falta lenguaje jurídico.'
              }
              className="cn-red-hechos"
            />
            <p className="cn-red-contador">{legalPrompt.trim().length.toLocaleString('es-CO')} caracteres</p>

            {/*
              LA ZONA DE ADJUNTAR NO LLEVA GUION: en la cara nueva el guion dice
              «sin verificar», y un recuadro vacío con esa marca afirmaba algo que
              no es.
            */}
            <div className="cn-red-bloque">
              <label
                title={adjuntosHabilitados ? undefined : AVISO_FUNCION_DESHABILITADA}
                className={`cn-red-adjuntar ${adjuntosHabilitados ? '' : 'cn-red-adjuntar--apagado'}`}
              >
                <input
                  type="file"
                  multiple
                  accept={EXTENSIONES_ACEPTADAS}
                  onChange={handleFileSelection}
                  disabled={preparandoAdjuntos || isProcessing || !adjuntosHabilitados}
                  className="hidden"
                />
                <UploadCloud className="cn-red-adjuntar-icono" strokeWidth={1.6} aria-hidden />
                <span className="cn-red-adjuntar-texto">
                  <Paperclip className="cn-red-adjuntar-clip" strokeWidth={1.8} aria-hidden />
                  Adjuntar sentencias, pruebas o fotos
                </span>
              </label>

              {/* Dice lo que la función hace de verdad: un aviso que promete de menos hace teclear lo que ya está en el adjunto. */}
              <p className="cn-red-ayuda">
                Se leen PDF, Word, texto e imágenes (fotos de comparendos, oficios, cédulas). Lo que se extraiga se usa en el escrito y queda
                marcado como dato del adjunto. Hasta {MAX_ADJUNTOS} archivos y {formatoMb(MAX_BYTES_TOTAL).replace('.0', '')} en total.
              </p>

              {!adjuntosHabilitados && <p className="cn-red-aviso">{AVISO_FUNCION_DESHABILITADA}</p>}
              {avisoAdjuntos && <p className="cn-red-aviso">{avisoAdjuntos}</p>}

              {importedFiles.length > 0 && (
                <ul className="cn-red-adjuntos">
                  {importedFiles.map((file) => (
                    <li key={file.id} className="cn-red-adjunto" title={file.detalle}>
                      {file.esImagen ? (
                        <ImageIcon className="cn-red-adjunto-icono" strokeWidth={1.6} aria-hidden />
                      ) : (
                        <FileText className="cn-red-adjunto-icono" strokeWidth={1.6} aria-hidden />
                      )}
                      <button
                        type="button"
                        onClick={() => setAdjuntoAbierto(file.file)}
                        className="cn-red-adjunto-nombre"
                        title="Ver el documento tal como es, antes de generar"
                      >
                        {file.name}
                      </button>
                      {/* Un archivo que no se leyó no es una acción destructiva: ámbar, no el rojo de eliminar. */}
                      <span
                        className={`cn-red-adjunto-estado ${
                          file.estado === 'error' ? 'cn-red-adjunto-estado--error' : file.estado === 'enviado' ? 'cn-red-adjunto-estado--ok' : ''
                        }`}
                      >
                        {file.estado === 'leyendo' && file.detalle ? file.detalle : ETIQUETA_ESTADO[file.estado]}
                        {file.estado === 'listo' ? ` · ${file.size}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        disabled={preparandoAdjuntos}
                        className="cn-red-icono-boton cn-red-icono-boton--quitar"
                        aria-label={`Quitar ${file.name}`}
                      >
                        <X className="cn-red-icono-boton-svg" strokeWidth={1.8} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ─── REVISAR UN DOCUMENTO ────────────────────────────────────────
                Aquí el archivo también se lee, pero no para redactar sino para
                revisar: el escrito del propio abogado, contra la ficha de la
                actuación elegida; o un documento que le llegó, para entender qué
                resolvió y por dónde se ataca. */}
            <button type="button" onClick={() => setRevisarAbierto(true)} className="cn-red-revisar">
              <ClipboardCheck className="cn-red-revisar-icono" strokeWidth={1.8} aria-hidden />
              <span className="cn-red-revisar-textos">
                <span className="cn-red-revisar-titulo">Revisar un documento: suyo o recibido</span>
                <span className="cn-red-revisar-texto">
                  Su tutela, demanda o recurso, para saber qué está bien y qué corregir; o el auto, la sentencia o el oficio que le llegó, para
                  saber qué resolvió y por dónde se ataca. Informe, no borrador.
                </span>
              </span>
            </button>
            <RevisarEscritoDialog
              abierto={revisarAbierto}
              onCerrar={() => setRevisarAbierto(false)}
              documentType={documentType}
              legalBranch={legalBranch}
              precioCop={2000}
              userRole={userRole}
              onSaldoCambiado={onSaldoCambiado}
              onAbrirTaller={onAbrirTaller}
              onRedactar={onRedactar}
            />
          </Paso>

          {/*
            «CÓMO ESCRIBE SU FIRMA», SOLO CON LO QUE VIAJA. Dos cosas viajan al
            motor: el formato de Membrete, si la firma lo configuró, y el formato
            que la firma enseñó para ese rol. El interruptor existe solo cuando hay
            formato enseñado —apagarlo vale para este borrador—; sin él, una línea
            dice que se redacta con el formato por defecto. Sin ninguna de las dos
            cosas que decir, el paso no se pinta.
          */}
          {(formatoDeFirmaConfigurado || lineaDeEstilo) && (
            <Paso n={3} titulo="Cómo escribe su firma">
              {formatoDeFirmaConfigurado && (
              <p className="cn-red-estilo">
                <span className="cn-red-estilo-texto">Usará el formato de escrito de su firma (Membrete).</span>
                {onAbrirMembrete && (
                  <button type="button" onClick={onAbrirMembrete} className="cn-red-estilo-boton">
                    Ver Membrete
                  </button>
                )}
              </p>
              )}
              {lineaDeEstilo?.tipo === 'CON_PERFIL' && (
                <label className="cn-est-interruptor">
                  <input
                    type="checkbox"
                    role="switch"
                    className="cn-est-interruptor-control"
                    checked={usarEstilo}
                    onChange={(e) => setUsarEstilo?.(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <span className="cn-est-interruptor-textos">
                    <span className="cn-est-interruptor-titulo">{TEXTO_INTERRUPTOR}</span>
                    <span className="cn-est-interruptor-detalle">{lineaDeEstilo.detalle}</span>
                    {!usarEstilo && (
                      <span className="cn-est-interruptor-detalle">Solo para este borrador: el siguiente vuelve a usarlo.</span>
                    )}
                  </span>
                </label>
              )}
              {lineaDeEstilo?.tipo === 'SIN_PERFIL' && <p className="cn-est-sin-perfil">{lineaDeEstilo.texto}</p>}
            </Paso>
          )}

          {/*
            EL AVISO QUE MÁS IMPORTA va pegado al botón. Una actuación que no
            resuelve hace que el modelo escriba la norma y el término DE MEMORIA.
            Solo en SIN_CATALOGAR: mientras carga no se dice nada.
          */}
          {lookup.estado === 'SIN_CATALOGAR' && documentType && (
            <p className="cn-red-aviso cn-red-aviso--sin">
              <span>
                <b className="cn-red-cifra">“{documentType}”</b> no está en el catálogo verificado. El borrador usará la norma y el término que el
                modelo recuerde, no los comprobados.
              </span>
            </p>
          )}

          {/*
            EN MÓVIL EL PRIMARIO VA ANCLADO ABAJO, de 48 px y con el precio debajo:
            el pulgar llega al borde inferior. En escritorio la nota va a la
            izquierda y el botón a la derecha, que es el orden de lectura de una fila.
          */}
          <div className="cn-red-pie">
            <div className="cn-red-pie-textos">
              {faltaActuacion && (
                <p className="cn-red-pie-nota">Elija la actuación arriba: es la que trae el artículo y el término verificados.</p>
              )}
              <p className="cn-red-pie-precio">{PRECIO_DESDE}</p>
            </div>
            <button
              type="submit"
              disabled={!legalPrompt.trim() || isProcessing || preparandoAdjuntos || faltaActuacion}
              title={faltaActuacion ? 'Elija la actuación en el paso 1' : 'También con ⌘↵ o Ctrl+↵'}
              className="cn-red-generar"
            >
              {preparandoAdjuntos ? 'Preparando adjuntos…' : isProcessing ? 'Generando…' : activeDraftText ? 'Continuar el borrador' : SUBMIT_LABEL[userRole]}
            </button>
          </div>

          {hayConsola && (
            <div ref={consolaRef} className="cn-red-consola-caja">
              <AgentConsoleStream logs={logs} isProcessing={isProcessing} />
            </div>
          )}
        </div>
      </form>

      {/*
        EL ADJUNTO, TAL COMO ES. Se pinta desde el archivo en memoria: sin red y
        sin almacenamiento.
      */}
      <Dialog
        abierto={adjuntoAbierto !== null}
        onCerrar={() => setAdjuntoAbierto(null)}
        titulo={adjuntoAbierto?.name ?? 'Documento adjunto'}
        subtitulo="El archivo tal como es, antes de generar el escrito"
        tamano="L"
      >
        {adjuntoAbierto && <VisorDeArchivo fuente={{ de: 'sesion', file: adjuntoAbierto }} />}
      </Dialog>
    </section>
  );
};
