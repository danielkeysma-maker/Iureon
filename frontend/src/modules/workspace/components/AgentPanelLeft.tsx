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
  /**
   * Lleva a Redacción la actuación que el abogado escogió en el catálogo tras
   * leer un documento recibido, con sus hechos y la instrucción que editó.
   * Opcional: sin ella el botón no se ofrece, en vez de ofrecerlo muerto.
   */
  onRedactar?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
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
  onAbrirTaller,
  onRedactar
}) => {
  const [importedFiles, setImportedFiles] = useState<ArchivoAdjunto[]>([]);
  /** Por qué el último archivo elegido no entró a la lista; se borra al elegir otro. */
  const [avisoAdjuntos, setAvisoAdjuntos] = useState<string | null>(null);
  /** Mientras se reducen fotos, se leen y se suben: el botón espera. */
  const [preparandoAdjuntos, setPreparandoAdjuntos] = useState(false);
  /* El operador puede apagar los adjuntos para una firma: el botón queda gris con el aviso y el servidor rechaza los archivos con 403. */
  const adjuntosHabilitados = useFuncionHabilitada('REDACCION.ADJUNTOS');
  /*
   * ─── EL ADJUNTO QUE SE ESTA MIRANDO ───────────────────────────────────────
   *
   * La fila del adjunto mostraba nombre, estado y tamano, y nada mas: al
   * pulsarla no pasaba nada. El abogado adjuntaba un auto y no tenia forma de
   * comprobar que habia escogido el archivo correcto — solo lo sabria despues,
   * leyendo un borrador redactado sobre otra cosa.
   *
   * Y para VERLO no hace falta guardarlo: el `File` esta aqui, en el
   * navegador. Se pinta desde memoria, sin red y sin almacenamiento, asi que
   * esto no toca la doctrina del pasillo — el archivo se sigue borrando de B2
   * en cuanto el servidor lee su texto.
   */
  const [adjuntoAbierto, setAdjuntoAbierto] = React.useState<File | null>(null);
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
      className={`cn-red-panel min-h-0 w-full min-w-0 shrink-0 flex-col lg:w-[364px] xl:w-[400px] ${
        ocultoEnMovil ? 'hidden lg:flex' : 'flex'
      }`}
    >
        {/*
          `overflow-y-auto`: en una pantalla baja el formulario se desplaza en
          vez de derramarse sobre la consola. Antes ambos eran `flex-1` y se
          pisaban.
        */}
        <form onSubmit={generar} className="cn-red-form flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="cn-red-cabeza">
            <h2 className="cn-red-h2">Qué debe hacer este escrito</h2>
            {/* Un atajo de teclado en un telefono es ruido: no hay teclado que lo tenga. */}
            <span className="cn-red-atajo hidden lg:inline">⌘↵ generar</span>
          </div>
          <p className="cn-red-bajada">
            Hechos, pretensiones, lo que quiere que sostenga. En lenguaje corriente.
          </p>

          {activeDraftText && (
            <div className="cn-red-continuando">
              <RefreshCw className="cn-red-continuando-icono" strokeWidth={1.8} aria-hidden />
              <span className="cn-red-continuando-texto">
                Continuando un borrador de{' '}
                <b className="cn-red-cifra">{(activeDraftText.length / 1000).toFixed(1)}k</b>{' '}
                caracteres.
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
            className="cn-red-hechos"
          />

          <p className="cn-red-contador">
            {legalPrompt.trim().length.toLocaleString('es-CO')} caracteres
          </p>

          {/* ─── ADJUNTOS ────────────────────────────────────────────────── */}
          {/*
            LA ZONA DE ADJUNTAR YA NO LLEVA GUION. Era discontinua por costumbre
            de «zona de soltar», y en la cara nueva el guion dice «sin
            verificar»: un recuadro vacío con esa marca afirmaba algo que no es.
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

            {/*
              Dice lo que la función hace de verdad, igual que antes decía lo
              que NO hacía. Un aviso que promete de más es la forma más
              silenciosa de estar equivocado; uno que promete de menos, la más
              cara: el abogado teclea lo que ya está en el adjunto.
            */}
            <p className="cn-red-ayuda">
              Se leen PDF, Word, texto e imágenes (fotos de comparendos, oficios, cédulas). Lo que se
              extraiga se usa en el escrito y queda marcado como dato del adjunto. Hasta {MAX_ADJUNTOS}{' '}
              archivos y {formatoMb(MAX_BYTES_TOTAL).replace('.0', '')} en total.
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
                    {/*
                      El estado, por archivo: «leyendo…» mientras se reduce o
                      sube, «enviado» cuando viaja, «no se pudo leer» con el
                      motivo en el title. Sin esto, tres fotos de 8 MB son un
                      botón mudo durante veinte segundos.
                    */}
                    {/* Un archivo que no se leyó no es una acción destructiva: ámbar, no el rojo de eliminar. */}
                    <span
                      className={`cn-red-adjunto-estado ${
                        file.estado === 'error'
                          ? 'cn-red-adjunto-estado--error'
                          : file.estado === 'enviado'
                          ? 'cn-red-adjunto-estado--ok'
                          : ''
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
              revisar. Y son DOS COSAS, no una: el escrito del propio abogado,
              que se contrasta con la ficha de la actuación elegida arriba; o
              un documento que le llegó —un auto, una sentencia, un oficio—,
              que se lee para entender qué resolvió y por dónde se ataca.
              La puerta decía solo lo primero, así que el segundo modo existía
              detrás de un rótulo que lo negaba. */}
          <button
            type="button"
            onClick={() => setRevisarAbierto(true)}
            className="cn-red-revisar"
          >
            <ClipboardCheck className="cn-red-revisar-icono" strokeWidth={1.8} aria-hidden />
            <span className="cn-red-revisar-textos">
              <span className="cn-red-revisar-titulo">Revisar un documento: suyo o recibido</span>
              <span className="cn-red-revisar-texto">
                Su tutela, demanda o recurso, para saber qué está bien, qué está mal y qué corregir; o el auto, la sentencia o el oficio que le
                llegó, para saber qué resolvió y por dónde se ataca. Informe, no borrador.
              </span>
            </span>
          </button>
          <RevisarEscritoDialog
            abierto={revisarAbierto}
            onCerrar={() => setRevisarAbierto(false)}
            documentType={documentType}
            legalBranch={legalBranch}
            precioCop={2000}
            /*
              EL ROL Y EL SALTO A REDACCIÓN VIAJAN TAMBIÉN DESDE AQUÍ. El rol,
              para poder escribir una actuación propia de la firma sin salir del
              informe; el salto, porque leer un auto desde Redacción y no poder
              redactar la respuesta es el mismo callejón sin salida que se
              reportó en «Revisiones».
            */
            userRole={userRole}
            onSaldoCambiado={onSaldoCambiado}
            onAbrirTaller={onAbrirTaller}
            onRedactar={onRedactar}
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
            <div className="cn-red-ficha">
              <p className="cn-red-ficha-cabeza">
                Con qué se va a redactar
                <span className="cn-red-ficha-cuenta">{obligatorias} obligatorias</span>
              </p>
              <ul className="cn-red-ficha-lista">
                {/*
                  LAS SECCIONES, POR NOMBRE.
                  
                  Decía solo "4 secciones obligatorias", y ese número no le sirve
                  a nadie: lo que el abogado necesita saber antes de generar es
                  CUÁLES — hechos, pretensiones, fundamentos, notificaciones —
                  porque es lo que va a revisar cuando el escrito salga. El dato
                  estaba en la ficha y se estaba contando en vez de mostrando.
                */}
                <li className="cn-red-ficha-fila">
                  <div className="cn-red-ficha-par">
                    <Scale className="cn-red-ficha-icono" strokeWidth={1.6} aria-hidden />
                    <div className="cn-red-ficha-textos">
                      <p className="cn-red-ficha-titulo">
                        Estructura exigida por la norma
                      </p>
                      <p
                        className="cn-red-ficha-texto line-clamp-2"
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
                  <ol className="cn-red-secciones">
                    {actuacion.requiredSections.map((sec) => (
                      <li key={sec.n} className="cn-red-seccion">
                        <span className="cn-red-seccion-n">{sec.n}.</span>
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
                        <span className="cn-red-seccion-cuerpo">
                          <span className={sec.mandatory ? 'cn-red-seccion-nombre' : 'cn-red-seccion-nombre cn-red-seccion-nombre--costumbre'}>
                            {sec.name}
                          </span>
                          {/*
                            El catálogo distingue lo que la norma EXIGE de lo que
                            es costumbre, y esa diferencia decide si omitir una
                            sección es un defecto o una elección de redacción.
                          */}
                          {sec.mandatory && (
                            <span className="cn-red-oblig">oblig.</span>
                          )}
                          {/* El fundamento de la sección sí es citable: va en mono. */}
                          {sec.basis && (
                            <span className="cn-red-seccion-base" title={sec.basis}>
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
                  className="cn-red-ficha-enlace"
                >
                  Ver la norma
                  <ExternalLink className="cn-red-ficha-enlace-icono" strokeWidth={1.8} aria-hidden />
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
            <p className="cn-red-aviso cn-red-aviso--sin">
              <span>
                <b className="cn-red-cifra">“{documentType}”</b> no está en el catálogo verificado.
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
          <div className="cn-red-pie">
            <p className="cn-red-pie-nota">
              {faltaActuacion
                ? 'Elija la actuación arriba: es la que trae el artículo y el término verificados.'
                : '3 modelos · el saldo se descuenta al terminar'}
            </p>
            <button
              type="submit"
              disabled={!legalPrompt.trim() || isProcessing || preparandoAdjuntos || faltaActuacion}
              title={faltaActuacion ? 'Elija la actuación en la barra de arriba' : undefined}
              className="cn-red-generar"
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

      {/*
        EL ADJUNTO, TAL COMO ES. Se pinta desde el archivo en memoria: sin red,
        sin almacenamiento y sin tocar la doctrina del pasillo — lo que sube a
        B2 se sigue borrando en cuanto el servidor lee su texto. Para mirar el
        documento nunca hizo falta guardarlo.
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
  <li className="cn-red-ficha-fila cn-red-ficha-par">
    <Icono className="cn-red-ficha-icono" />
    <div className="cn-red-ficha-textos">
      <p className="cn-red-ficha-titulo">{titulo}</p>
      {/*
        Justificado y con `title`: son párrafos —un término del catálogo puede
        ser «Dentro de los diez (10) días siguientes a la presentación de la
        solicitud el juez proferirá el fallo…»— y el recorte a tres renglones
        esconde el resto, así que el texto completo vive en el `title`.
      */}
      <p className="cn-red-ficha-texto line-clamp-3" title={detalle}>
        {detalle}
      </p>
    </div>
  </li>
);
