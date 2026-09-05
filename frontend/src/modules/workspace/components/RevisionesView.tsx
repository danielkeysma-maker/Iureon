import React from 'react';
import { ClipboardCheck, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { reviewApi, type ConsentimientoDeGuardado, type RevisionGuardada } from '../services/review.api';
import type { DatosDelTaller } from './TallerDeRevision';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';

/**
 * Revisiones: la lista de escritos revisados de la firma, para abrir cada uno
 * en el taller. Es el módulo «Revisiones» de la barra; la revisión nueva se
 * pide desde Redacción, donde está la actuación elegida.
 *
 * Una revisión se abre en el taller solo si su texto se conservó (la firma lo
 * autorizó). Si no, se dice y se ofrece lo que sí hay: el informe.
 */

interface RevisionesViewProps {
  /** Socio administrador de la firma (o superusuario): puede autorizar que se conserven los escritos. */
  esAdminDeFirma: boolean;
  onAbrirTaller: (datos: DatosDelTaller) => void;
  onIrARedaccion: () => void;
}

export const RevisionesView: React.FC<RevisionesViewProps> = ({ esAdminDeFirma, onAbrirTaller, onIrARedaccion }) => {
  /* Con el plan vencido los informes se abren y se leen; revisar uno nuevo no se ofrece. */
  const soloLectura = usePlanSoloLectura();
  const [lista, setLista] = React.useState<RevisionGuardada[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [abriendo, setAbriendo] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
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

  const abrir = async (r: RevisionGuardada) => {
    setAbriendo(r.id);
    setError('');
    try {
      const c = await reviewApi.obtener(r.id);
      const texto = c.textoTrabajo ?? c.textoOriginal;
      if (!texto) {
        setError(
          `El texto de «${c.fileName}» no se conservó porque la firma no había autorizado guardar escritos cuando se revisó. El informe sigue disponible en Redacción → Revisar un escrito → Revisiones anteriores. Para trabajarlo en el taller, vuelva a subir el archivo.`
        );
        return;
      }
      const consentimiento = await reviewApi.consentimiento().catch(() => ({ guarda: false, por: null, el: null }));
      onAbrirTaller({
        revisionId: c.id,
        documentType: c.documentType,
        fileName: c.fileName,
        cliente: c.cliente,
        texto,
        informe: c.informe,
        informeLibre: c.informeLibre,
        conFicha: c.conFicha,
        guardaTexto: consentimiento.guarda,
        conversacion: c.conversacion,
        anotaciones: c.anotaciones ?? [],
        versiones: c.versiones ?? []
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir la revisión.');
    } finally {
      setAbriendo(null);
    }
  };

  const eliminar = async (r: RevisionGuardada) => {
    try {
      await reviewApi.eliminar(r.id);
      setLista((xs) => xs.filter((x) => x.id !== r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar.');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold text-ink-900">Revisiones</h1>
            <p className="mt-0.5 max-w-[60ch] text-[13px] leading-snug text-ink-500">
              Los escritos que su firma ha revisado. Abra uno para seguir corrigiéndolo en el taller, con los pasajes marcados y el revisor al
              lado. Para revisar un escrito nuevo, vaya a Redacción, elija la actuación y use «Revisar un escrito ya redactado».
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={cargar} className="btn-neutral btn-sm">
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            {!soloLectura && (
            <button type="button" onClick={onIrARedaccion} className="btn-primary btn-sm">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Revisar un escrito nuevo
            </button>
            )}
          </div>
        </div>

        {consentimiento && (
          <div
            className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-card border px-3 py-2 text-[12.5px] leading-snug ${
              consentimiento.guarda ? 'border-line-200 bg-surface text-ink-700' : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <ShieldCheck className={`h-4 w-4 shrink-0 ${consentimiento.guarda ? 'text-verified' : 'text-amber-700'}`} />
            <span className="min-w-0 flex-1">
              {consentimiento.guarda ? (
                <>
                  <span className="font-semibold">La firma conserva los escritos revisados</span>, sus marcas y la conversación con la guía
                  {consentimiento.por ? `, autorizado por ${consentimiento.por}` : ''}
                  {consentimiento.el ? ` el ${new Date(consentimiento.el).toLocaleDateString('es-CO', { dateStyle: 'long' })}` : ''}.
                </>
              ) : (
                <>
                  <span className="font-semibold">La firma no ha autorizado conservar los escritos revisados.</span> Sin esa autorización, el texto, las
                  marcas y la conversación viven solo en la pestaña; el informe sí se guarda.{' '}
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
                          texto: <>Desde ahora los escritos nuevos no se conservarán. Los ya guardados no se borran.</>,
                          etiqueta: 'Retirar',
                          peligro: true,
                          onConfirmar: () => cambiarAutorizacion(false)
                        }
                      : {
                          titulo: 'Autorizar que la firma conserve sus escritos',
                          texto: (
                            <>
                              Iureon conservará el texto de los escritos que su firma revise, sus marcas y la conversación con la guía, para retomar el
                              trabajo otro día. Aplica a <span className="font-semibold">toda la firma</span> y queda en la auditoría con su correo. Puede
                              retirarla después.
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
          <p className="mt-6 text-[13px] text-ink-500">Todavía no hay revisiones. La primera se pide desde Redacción.</p>
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
                onClick={() =>
                  setConfirmacion({
                    titulo: 'Eliminar la revisión',
                    texto: (
                      <>
                        Se eliminan el informe de «{r.fileName}», el texto de trabajo y la conversación con el revisor. No se puede recuperar.
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
