import React from 'react';
import { CalendarClock, ClipboardCheck, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { reviewApi, type ConsentimientoDeGuardado, type RevisionGuardada } from '../services/review.api';
import type { DatosDelTaller } from './TallerDeRevision';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { dejarPendiente } from '../../agenda/pendiente';
import { RevisarEscritoDialog } from './RevisarEscritoDialog';
import type { ActuacionRole } from '../../catalog/types';

/**
 * Revisiones: la lista de escritos revisados de la firma, para abrir cada uno
 * en el taller. Es el módulo «Revisiones» de la barra.
 *
 * ─── LA REVISIÓN NUEVA SE PIDE AQUÍ ─────────────────────────────────────────
 *
 * Ya no hay que pasar por Redacción. Este comentario decía lo contrario, y esa
 * era la descripción fiel de un defecto de uso: quien quería revisar un escrito
 * acababa en el panel de redacción sin entender por qué —no va a redactar
 * nada— y, peor, tenía que elegir la actuación ANTES de poder subir el
 * archivo, cuando lo normal al recibir un escrito ajeno es no saber cómo se
 * llama en el catálogo.
 *
 * El botón de Redacción se queda donde estaba —quien ya tiene la actuación
 * elegida ahí no pierde nada—; este es el camino corto, y el diálogo que abre
 * trae su propia rama, su propia actuación y la guía que la propone leyendo el
 * archivo. La petición sigue viajando con una actuación real escogida por una
 * persona: el servidor la exige y aquí no se inventa ninguna.
 *
 * Una revisión se abre en el taller solo si su texto se conservó (la firma lo
 * autorizó). Si no, se dice y se ofrece lo que sí hay: el informe.
 */

interface RevisionesViewProps {
  /** Socio administrador de la firma (o superusuario): puede autorizar que se conserven los escritos. */
  esAdminDeFirma: boolean;
  onAbrirTaller: (datos: DatosDelTaller) => void;
  /**
   * Lleva a Redacción la actuación que el abogado escogió en el catálogo tras
   * leer un documento recibido, con sus hechos y la instrucción que editó.
   * Opcional: sin ella el botón no se ofrece, en vez de ofrecerlo muerto.
   */
  onRedactar?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
  onIrARedaccion: () => void;
  /** Quién firma, para poder crear una actuación propia desde el diálogo de revisión. */
  userRole: ActuacionRole;
  /** Lo que cuesta una revisión. Lo fija quien monta la pantalla, no esta lista. */
  precioRevisionCop: number;
  /** El saldo se reporta tras el cobro; nunca se deriva aquí. */
  onSaldoCambiado: () => void;
  /**
   * «Poner en la agenda» prepara el caso y lleva a Herramientas, donde vive la
   * agenda de terminos. Una revision guarda el NOMBRE de la actuacion y su
   * rama, no el id de la ficha, asi que la agenda la resuelve por nombre dentro
   * de esa rama — el mismo contrato del catalogo — y si no la encuentra deja
   * que el abogado la elija en vez de suponerla.
   */
  onIrAHerramientas: () => void;
}

export const RevisionesView: React.FC<RevisionesViewProps> = ({
  esAdminDeFirma,
  onAbrirTaller,
  onRedactar,
  onIrARedaccion,
  onIrAHerramientas,
  userRole,
  precioRevisionCop,
  onSaldoCambiado
}) => {
  /* Con el plan vencido los informes se abren y se leen; revisar uno nuevo no se ofrece. */
  const soloLectura = usePlanSoloLectura();
  const [lista, setLista] = React.useState<RevisionGuardada[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [abriendo, setAbriendo] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  /* El diálogo de revisión, abierto desde aquí: sin actuación heredada, la elige él. */
  const [revisarAbierto, setRevisarAbierto] = React.useState(false);
  /*
   * LA AUTORIZACION, A LA VISTA. El usuario vio el aviso ambar en el taller y
   * no encontro donde autorizar: el boton solo aparecia dentro del taller y
   * solo al socio administrador. Aqui, en la cabecera del modulo, se ve el
   * estado siempre y el boton para quien puede darla.
   */
  const [consentimiento, setConsentimiento] = React.useState<ConsentimientoDeGuardado | null>(null);
  const [errorConsentimiento, setErrorConsentimiento] = React.useState('');

  const cargar = React.useCallback(() => {
    setCargando(true);
    reviewApi
      .listar()
      .then(setLista)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.'))
      .finally(() => setCargando(false));
  }, []);

  React.useEffect(() => {
    cargar();
    reviewApi
      .consentimiento()
      .then(setConsentimiento)
      .catch(() => setConsentimiento({ guarda: false, por: null, el: null }));
  }, [cargar]);

  const cambiarAutorizacion = async (autorizar: boolean) => {
    setErrorConsentimiento('');
    try {
      setConsentimiento(await reviewApi.autorizarGuardado(autorizar));
    } catch (e) {
      setErrorConsentimiento(e instanceof Error ? e.message : 'No se pudo guardar la autorización.');
    }
  };

  /*
   * `silencioso` is the reload path: the review that was open comes back
   * without a word, and if it cannot (text not kept, row gone) the list stays,
   * with no error for something the lawyer did not just click.
   */
  const abrir = async (r: RevisionGuardada, silencioso = false) => {
    setAbriendo(r.id);
    setError('');
    try {
      const c = await reviewApi.obtener(r.id);
      const texto = c.textoTrabajo ?? c.textoOriginal;
      if (!texto) {
        if (silencioso) {
          recordar(PANTALLAS.tallerRevision, null);
          return;
        }
        setError(
          `El texto de «${c.fileName}» no se conservó porque la firma no había autorizado guardar escritos cuando se revisó. El informe sigue disponible en «Revisar un documento» —el botón de esta cabecera, o el de Redacción— dentro de «Revisiones anteriores de la firma». Para trabajarlo en el taller, vuelva a subir el archivo.`
        );
        return;
      }
      const consentimiento = await reviewApi.consentimiento().catch(() => ({ guarda: false, por: null, el: null }));
      onAbrirTaller({
        revisionId: c.id,
        documentType: c.documentType,
        legalBranch: c.legalBranch,
        fileName: c.fileName,
        cliente: c.cliente,
        texto,
        informe: c.informe,
        /* El del documento recibido tiene otra forma y otra columna en la respuesta; sin él el taller decía «no tiene informe». */
        informeRecibido: c.informeRecibido,
        informeLibre: c.informeLibre,
        conFicha: c.conFicha,
        /*
         * LO QUE LA CABECERA DEL INFORME DESCARGADO NECESITA. Este es el
         * camino por el que el abogado vuelve días después —la fila abre el
         * taller directamente—, así que si estos datos no viajan por aquí, el
         * Word y el PDF salen sin fecha, sin quien pidió la revisión y sin
         * decir que el escrito se recortó.
         */
        modo: c.modo,
        caracteres: c.caracteres,
        truncado: c.truncado,
        fechaDelInforme: new Date(c.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }),
        revisadoPor: c.userEmail,
        guardaTexto: consentimiento.guarda,
        conversacion: c.conversacion,
        anotaciones: c.anotaciones ?? [],
        versiones: c.versiones ?? []
      });
    } catch (e) {
      if (silencioso) recordar(PANTALLAS.tallerRevision, null);
      else setError(e instanceof Error ? e.message : 'No se pudo abrir la revisión.');
    } finally {
      setAbriendo(null);
    }
  };

  /*
   * After a reload, the review whose taller was open is opened again — once
   * the list is here, once per mount, and only if it is still in the list.
   * Closing the taller forgets the id before this view comes back, so it does
   * not reopen what was just closed.
   */
  const restaurada = React.useRef(false);
  React.useEffect(() => {
    if (restaurada.current || lista.length === 0) return;
    restaurada.current = true;
    const id = recordado(PANTALLAS.tallerRevision);
    if (!id) return;
    const r = lista.find((x) => x.id === id);
    if (r) void abrir(r, true);
    else recordar(PANTALLAS.tallerRevision, null);
    // `abrir` closes over props that do not change between list loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista]);

  const eliminar = async (r: RevisionGuardada) => {
    try {
      await reviewApi.eliminar(r.id);
      setLista((xs) => xs.filter((x) => x.id !== r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
  };

  return (
    <div data-visita="vista-taller" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-ink-900">Revisiones</h1>
            <p className="mt-0.5 max-w-[60ch] text-[13px] leading-snug text-ink-500">
              Los escritos que su firma ha revisado. Abra uno para seguir corrigiéndolo en el taller, con los pasajes marcados y el revisor al
              lado; cuando el texto esté como lo quiere, «Llevar a Redacción» lo guarda como borrador de la firma y lo abre allí, sin tocar la
              revisión. Para revisar uno nuevo no hace falta salir de aquí ni saber de antemano qué actuación es: súbalo y, si no lo sabe,
              pídale a la guía que la proponga con el término y el artículo a la vista.
            </p>
          </div>
          {/*
            LA FILA DE BOTONES ENVUELVE en el teléfono: son dos etiquetas largas
            y `btn-sm` no encoge su texto, así que en 320px la segunda quedaría
            fuera de la pantalla sin que la página llegara a desbordarse.
          */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={cargar} className="btn-neutral btn-sm">
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            {/*
              CON EL PLAN VENCIDO NO SE OFRECE NINGUNO DE LOS DOS: revisar cuesta
              saldo, y ofrecer un botón que va a fallar es peor que no tenerlo.
            */}
            {!soloLectura && (
              <>
                <button type="button" onClick={onIrARedaccion} className="btn-neutral btn-sm">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Ir a Redacción
                </button>
                <button type="button" onClick={() => setRevisarAbierto(true)} className="btn-primary btn-sm">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Revisar un documento
                </button>
              </>
            )}
          </div>
        </div>

        {/*
          EL DIÁLOGO CUELGA DEL MÓDULO, no de Redacción. `eligeActuacion` es lo
          que lo vuelve autosuficiente: sin él esperaría la actuación de una
          barra de configuración que aquí no existe, y el botón de revisar se
          quedaría apagado para siempre.
        */}
        {!soloLectura && (
          <RevisarEscritoDialog
            abierto={revisarAbierto}
            onCerrar={() => setRevisarAbierto(false)}
            documentType=""
            legalBranch=""
            eligeActuacion
            userRole={userRole}
            precioCop={precioRevisionCop}
            onSaldoCambiado={onSaldoCambiado}
            /* De la lectura de un documento recibido a Redacción, sin copiar y pegar nada. */
            onRedactar={onRedactar}
            onAbrirTaller={(datos) => {
              setRevisarAbierto(false);
              onAbrirTaller(datos);
            }}
          />
        )}

        {consentimiento && (
          <div
            className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-card border px-3 py-2 text-[12.5px] leading-snug ${
              consentimiento.guarda ? 'border-line-200 bg-surface text-ink-700' : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <ShieldCheck className={`h-4 w-4 shrink-0 ${consentimiento.guarda ? 'text-verified' : 'text-amber-700'}`} />
            {/*
              EN EL TELÉFONO EL AVISO SE QUEDABA CON 66px. La fila envuelve,
              pero este párrafo es `flex-1` con base 0: no reclama ancho, así
              que el botón «Autorizar guardado» —que no encoge— se llevaba la
              línea entera y el texto se pintaba en una columna de 66px que se
              salía por la derecha. En el teléfono ocupa el ancho completo y el
              botón baja solo; desde `sm:` vuelve a compartir la línea.
            */}
            <span className="w-full [overflow-wrap:anywhere] sm:w-auto sm:min-w-0 sm:flex-1">
              {consentimiento.guarda ? (
                <>
                  <span className="font-semibold">La firma conserva los escritos revisados</span>, el archivo tal como se subió, sus marcas y la
                  conversación con la guía
                  {consentimiento.por ? `, autorizado por ${consentimiento.por}` : ''}
                  {consentimiento.el ? ` el ${new Date(consentimiento.el).toLocaleDateString('es-CO', { dateStyle: 'long' })}` : ''}.
                </>
              ) : (
                <>
                  <span className="font-semibold">La firma no ha autorizado conservar los escritos revisados.</span> Sin esa autorización, el texto, el
                  archivo original, las marcas y la conversación viven solo en la pestaña; el informe sí se guarda.{' '}
                  {esAdminDeFirma ? 'Como socio administrador, puede autorizarlo aquí para toda la firma.' : 'Solo un socio administrador de la firma puede autorizarlo.'}
                </>
              )}
              {errorConsentimiento && <span className="text-danger"> {errorConsentimiento}</span>}
            </span>
            {esAdminDeFirma && (
              <button
                type="button"
                onClick={() =>
                  setConfirmacion(
                    consentimiento.guarda
                      ? {
                          titulo: 'Retirar la autorización',
                          texto: <>Desde ahora los escritos nuevos no se conservarán, ni su archivo original. Los ya guardados no se borran.</>,
                          etiqueta: 'Retirar',
                          peligro: true,
                          onConfirmar: () => cambiarAutorizacion(false)
                        }
                      : {
                          titulo: 'Autorizar que la firma conserve sus escritos',
                          texto: (
                            <>
                              Iureon conservará el texto de los escritos que su firma revise, el archivo tal como se subió —para verlo con su
                              diagramación—, sus marcas y la conversación con la guía, para retomar el trabajo otro día. Aplica a{' '}
                              <span className="font-semibold">toda la firma</span> y queda en la auditoría con su correo. Puede retirarla después.
                            </>
                          ),
                          etiqueta: 'Autorizar',
                          onConfirmar: () => cambiarAutorizacion(true)
                        }
                  )
                }
                className={consentimiento.guarda ? 'btn-neutral btn-sm' : 'btn-primary btn-sm'}
              >
                {consentimiento.guarda ? 'Retirar autorización' : 'Autorizar guardado'}
              </button>
            )}
          </div>
        )}

        {error && <p className="mt-4 rounded-control border border-line-200 bg-surface px-3 py-2 text-[12.5px] leading-snug text-danger">{error}</p>}

        {!cargando && lista.length === 0 && !error && (
          <p className="mt-6 text-[13px] text-ink-500">
            Todavía no hay revisiones. Empiece con «Revisar un documento» —un escrito suyo o uno que le llegó—: suba el archivo y, si no sabe qué
            actuación es, deje que la guía se lo proponga.
          </p>
        )}

        <ul className="mt-4 divide-y divide-line-100 overflow-hidden rounded-card border border-line-200 bg-surface">
          {lista.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => void abrir(r)} disabled={abriendo !== null} className="min-w-0 flex-1 text-left" title="Abrir en el taller">
                <span className="block truncate text-ui text-ink-900">
                  {r.cliente ? <span className="font-medium">{r.cliente}</span> : <span className="text-ink-400">Sin cliente indicado</span>}
                  <span className="text-ink-400"> · {r.documentType}</span>
                </span>
                <span className="block truncate text-[11.5px] text-ink-500">
                  {r.fileName} ·{' '}
                  {new Date(r.createdAt).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} ·
                  revisión pedida por {r.userEmail}
                  {abriendo === r.id ? ' · abriendo…' : ''}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  /*
                   * DE UN DOCUMENTO RECIBIDO NO VIAJA NINGÚN NOMBRE DE
                   * ACTUACIÓN. Ahí `documentType` es la etiqueta del producto
                   * —«Documento recibido»—, no una actuación: prellenar la
                   * agenda con ella crearía un vencimiento a nombre de algo que
                   * el catálogo no conoce. La actuación la elige el abogado en
                   * el formulario, o se la propone la guía desde el informe.
                   */
                  const recibido = r.modo === 'DOCUMENTO_RECIBIDO';
                  dejarPendiente({
                    origen: 'REVISION',
                    asunto: r.cliente || r.fileName,
                    cliente: r.cliente || null,
                    radicado: null,
                    actuacionId: null,
                    actuacionNombre: recibido ? null : r.documentType,
                    rama: recibido ? null : r.legalBranch
                  });
                  onIrAHerramientas();
                }}
                className="shrink-0 text-ink-400 hover:text-ink-900"
                title="Poner en la agenda de términos"
                aria-label={`Poner en la agenda el término de ${r.fileName}`}
              >
                <CalendarClock className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmacion({
                    titulo: 'Eliminar la revisión',
                    texto: (
                      <>
                        Se eliminan el informe de «{r.fileName}», el texto de trabajo, la conversación con el revisor y el archivo original, si se
                        conservó. No se puede recuperar.
                      </>
                    ),
                    etiqueta: 'Eliminar',
                    peligro: true,
                    onConfirmar: () => eliminar(r)
                  })
                }
                className="shrink-0 text-ink-400 hover:text-danger"
                aria-label={`Eliminar la revisión de ${r.fileName}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </div>
  );
};
