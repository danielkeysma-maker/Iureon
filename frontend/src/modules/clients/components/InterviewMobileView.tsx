import React from 'react';
import { Check, FileText } from 'lucide-react';
import { AudioRecorder } from './AudioRecorder';
import { ClientPicker } from './ClientPicker';
import type { Client } from '../clients.api';
import { RAZON_AUTORIZACION, TEXTO_AUTORIZACION, useAutorizacionDeGrabacion } from '../useAutorizacionDeGrabacion';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { clientsApi } from '../clients.api';
import { CerrarEntrevistaDialog } from './CerrarEntrevistaDialog';
import { GUION_BASE, cubiertasEnEntrevistasPrevias, estadoDelGuion, preguntasCubiertas } from '../guionDeEntrevista';
import { buildSpeakerNames } from '../../transcription/speakerNames';
import { ROLE_LABELS } from '../../transcription/types';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import { horaEnPalabras, puedeEmpezarAGrabar } from '../entrevistaEnPantalla';

/**
 * La entrevista en el teléfono (por debajo de `lg`).
 *
 * ─── POR QUÉ ESTE MÓDULO ES EL QUE MÁS GANA EN EL TELÉFONO ──────────────────
 *
 * **El teléfono ES la grabadora real**. Una audiencia llega como archivo que
 * alguien sube después; una entrevista ocurre con el cliente enfrente, y el
 * aparato que está sobre la mesa es este. Por eso el cronómetro es el elemento
 * más grande de la pantalla.
 *
 * ─── UNA SOLA GRABADORA Y UN SOLO CONSENTIMIENTO ────────────────────────────
 *
 * `MediaRecorder`, los permisos del micrófono y el cronómetro viven en
 * `AudioRecorder`, que aquí se pide con `variante="movil"`: cambia el tamaño y
 * la disposición, nunca la lógica. La autorización viene de
 * `useAutorizacionDeGrabacion` y la regla de cuándo se puede grabar de
 * `puedeEmpezarAGrabar`, las dos compartidas con el escritorio. Dos copias de
 * un consentimiento se desincronizan sin hacer ruido.
 *
 * ─── DE DÓNDE SALE LA FORMA ─────────────────────────────────────────────────
 *
 * La maqueta no dibuja la entrevista en 375 px. La pantalla es DERIVADA: la
 * cabecera de 56 px y el pie con el primario anclado abajo salen del detalle
 * móvil de audiencia (`app-audiencias-entrevistas.html:535`); la casilla de
 * autorización, de «Nueva entrevista» (:89); la banda de grabación, de :108; y
 * el cierre, de la hoja inferior del sistema de diálogos
 * (`app-dialogos-y-estados.html:310`), que el diálogo compartido ya dibuja.
 *
 * ─── LO QUE NO ESTÁ, con la razón ───────────────────────────────────────────
 *
 * · Asignar roles, dividir o corregir intervenciones: son ajustes finos sobre
 *   una transcripción larga y se hacen en la pantalla grande. La pantalla lo
 *   dice al pie del transcrito.
 * · La lista de entrevistas guardadas: el teléfono se usa para grabar la que
 *   está ocurriendo; volver sobre las anteriores es trabajo de escritorio.
 */

interface InterviewMobileViewProps {
  onDraft?: (hechos: string) => void;
}

const minuto = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const InterviewMobileView: React.FC<InterviewMobileViewProps> = () => {
  const {
    hasFirm,
    isAvailable,
    isUploading,
    uploadProgress,
    isTranscribing,
    result,
    error,
    transcribe,
    transcriptionId,
    stored,
    reset
  } = useTranscription('ENTREVISTA');
  const { autorizado, autorizadoEl, marcar } = useAutorizacionDeGrabacion();

  /*
   * CON QUIEN ES LA ENTREVISTA. La ficha del consultante es la CABECERA de la
   * pantalla, y el acta (14b) imprime «Consultante: nombre — C.C. documento»
   * con su linea de firma. Se guarda la FICHA y no solo el id: el acta
   * necesita el nombre y el documento, y volver a pedirlos por id seria un
   * viaje de red por algo que ya esta en memoria.
   */
  const [clienteId, setClienteId] = React.useState<string | null>(null);
  const [cliente, setCliente] = React.useState<Client | null>(null);

  const trabajando = isUploading || isTranscribing;
  const permiso = puedeEmpezarAGrabar({
    hayFirma: hasFirm,
    autorizado,
    exigeCliente: true,
    hayCliente: Boolean(clienteId)
  });

  const empezar = (file: File) => {
    /*
     * El segundo parametro es `contextPrompt`, NO el cliente. Pasar el id por
     * ahi lo mandaria al proveedor como contexto de transcripcion —
     * vocabulario inventado que empeora el transcrito.
     */
    void transcribe(file, undefined, autorizadoEl ?? undefined);
  };

  /*
   * SE ATA EL CLIENTE EN CUANTO HAY TRANSCRITO AL QUE ATARLO. La eleccion se
   * hace ANTES de grabar y el transcrito nace despues; falla en silencio a
   * proposito: el transcrito ya esta a salvo y el vinculo se puede rehacer.
   */
  React.useEffect(() => {
    if (!transcriptionId || !clienteId) return;
    void clientsApi.linkInterview(transcriptionId, clienteId).catch(() => {});
  }, [transcriptionId, clienteId]);

  const [cerrarAbierto, setCerrarAbierto] = React.useState(false);

  /*
   * EL GUION, SOLO DESPUES DE TRANSCRIBIR. El telefono ES la grabadora, sobre la
   * mesa, y nadie lee una lista mientras graba. Lo que si importa es la
   * comprobacion al terminar, antes de que el cliente se levante de la mesa.
   */
  const cubiertasHoy = React.useMemo(() => preguntasCubiertas(result?.segments ?? []), [result]);
  const previas = React.useMemo(
    () =>
      clienteId
        ? stored
            .filter((i) => i.client_id === clienteId && i.id !== transcriptionId)
            .map((i) => ({ id: i.id, transcribedAt: i.transcribed_at ?? null, segments: i.segments ?? [] }))
        : [],
    [stored, clienteId, transcriptionId]
  );
  /* La lista es una función de Entrevistas que el operador puede apagar: el rótulo queda, con el aviso en vez de las preguntas. */
  const guionHabilitado = useFuncionHabilitada('ENTREVISTAS.GUION');
  const estadosGuion = React.useMemo(
    () => estadoDelGuion(cubiertasHoy, cubiertasEnEntrevistasPrevias(previas)),
    [cubiertasHoy, previas]
  );
  const fechaCorta = (iso: string | null): string =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : 'una entrevista anterior';

  /* EL ACTA CON DATOS REALES Y SIN RED, igual que en escritorio. */
  const armarActa = () => {
    if (!transcriptionId) return undefined;
    const fila = stored.find((i) => i.id === transcriptionId);
    return {
      autorizadoEl: fila?.autorizo_grabacion_el ?? null,
      revisadaPor: fila?.revisada_por ?? null,
      actaLista: fila?.estado_revision === 'ACTA_LISTA',
      hechosClave: fila?.resumen?.hechos,
      decision: fila?.decision,
      decisionMotivo: fila?.decision_motivo ?? null,
      consultante: cliente ? { nombre: cliente.fullName, documento: cliente.documentId } : null
    };
  };

  const exportar = (formato: 'word' | 'pdf') => {
    if (!result) return;
    void import('../../transcription/transcriptExport').then((m) =>
      formato === 'word'
        ? m.exportTranscriptToWord(result, cliente?.fullName || 'entrevista', armarActa())
        : m.exportTranscriptToPdf(result, cliente?.fullName || 'entrevista', armarActa())
    );
  };

  const otra = () => {
    marcar(false);
    reset();
  };

  /*
   * `=== false`: `null` es «todavía no se sabe». Con la negación simple la
   * pantalla parpadeaba «no está configurado» en cada visita durante el viaje
   * de ida y vuelta, que es justo el defecto que el escritorio ya había
   * corregido.
   */
  if (isAvailable === false) {
    return (
      <div data-visita="vista-entrevistas" className="cara-nueva cn-ent cn-ent-movil">
        <div className="cn-ent-movil-cuerpo">
          <div className="cn-ent-vacio cn-ent-vacio--aviso">
            <p className="cn-ent-vacio-titulo">El motor de transcripción no está configurado</p>
            <p className="cn-ent-vacio-texto">Sin él no se puede grabar ni transcribir una entrevista.</p>
          </div>
        </div>
      </div>
    );
  }

  const hora = horaEnPalabras(autorizadoEl);
  const nombres = result ? buildSpeakerNames(result.segments, ROLE_LABELS) : {};

  return (
    <div data-visita="vista-entrevistas" className="cara-nueva cn-ent cn-ent-movil">
      <header className="cn-ent-movil-cabeza">
        {cliente ? (
          <div className="cn-ent-movil-persona">
            <span className="cn-ent-avatar" aria-hidden="true">
              {cliente.fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()}
            </span>
            <div className="cn-ent-movil-persona-textos">
              <p className="cn-ent-movil-nombre">{cliente.fullName}</p>
              <p className="cn-ent-nota">
                <span className="cn-ent-mono">C.C. {cliente.documentId}</span>
                {cliente.interviews === 0 ? ' · cliente nuevo' : ` · ${cliente.interviews} entrevistas`}
              </p>
            </div>
            {!result && !trabajando && (
              <button
                type="button"
                onClick={() => {
                  setClienteId(null);
                  setCliente(null);
                }}
                className="cn-ini-boton cn-ini-boton--texto cn-ent-boton"
              >
                Cambiar
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="cn-ent-movil-titulo">¿Con quién es la entrevista?</p>
            <ClientPicker
              value={clienteId}
              onChange={(id, ficha) => {
                setClienteId(id);
                setCliente(ficha);
              }}
            />
          </>
        )}
      </header>

      <div className="cn-ent-movil-cuerpo">
        {!result && (
          <>
            {/*
              LA AUTORIZACION VA PRIMERO Y BLOQUEA. No es una casilla de tramite:
              sin ella el grabador esta deshabilitado y el audio no se envia. En
              ámbar mientras no este marcada — el lenguaje del producto para
              «esto todavía no está».
            */}
            <label className={`cn-ent-autorizacion ${autorizado ? 'cn-ent-autorizacion--hecha' : 'cn-ent-autorizacion--pendiente'}`}>
              <span className="cn-ent-casilla">
                <input type="checkbox" checked={autorizado} onChange={(e) => marcar(e.target.checked)} disabled={trabajando} />
                <Check size={14} strokeWidth={3} aria-hidden="true" />
              </span>
              <span className="cn-ent-autorizacion-texto">
                <span className="cn-ent-autorizacion-titulo">{TEXTO_AUTORIZACION}</span>
                <span className="cn-ent-autorizacion-razon">{RAZON_AUTORIZACION}</span>
                {hora && (
                  <span className="cn-ent-autorizacion-hora">
                    Registrada a las <span className="cn-ent-mono">{hora}</span>
                  </span>
                )}
              </span>
            </label>

            {!permiso.puede && permiso.razon && !trabajando && <p className="cn-ent-nota">{permiso.razon}</p>}

            <div hidden={trabajando}>
              <AudioRecorder
                variante="movil"
                onRecorded={empezar}
                disabled={!permiso.puede || trabajando}
              />
            </div>
          </>
        )}

        {trabajando && (
          <div className="cn-ent-banda cn-ent-banda--movil cn-ent-banda--trabajando" aria-live="polite">
            <span className="cn-ent-giro" aria-hidden="true" />
            <div className="cn-ent-banda-texto">
              <p className="cn-ent-banda-titulo">
                {isUploading
                  ? uploadProgress > 0
                    ? `Subiendo la grabación · ${uploadProgress} %`
                    : 'Subiendo la grabación…'
                  : 'Transcribiendo…'}
              </p>
              <p className="cn-ent-banda-linea">No cierre la aplicación hasta que termine.</p>
            </div>
          </div>
        )}

        {error && <p className="cn-ent-aviso cn-ent-aviso--peligro">{error}</p>}

        {/*
          LAS INTERVENCIONES: interlocutor y minuto arriba, texto debajo, ancho
          completo y SIN TARJETA — en 375 px tres columnas dejan cuatro palabras
          por renglón, y si todo está enmarcado el marco no señala nada.
        */}
        {result && (
          <section className="cn-ent-seccion" aria-label="Transcrito">
            <ol className="cn-ent-intervenciones">
              {result.segments.map((s, i) => (
                <li key={i} className="cn-ent-intervencion">
                  <p className="cn-ent-intervencion-cabeza">
                    <span className="cn-ent-intervencion-quien">{nombres[s.speakerLabel] ?? s.speakerLabel}</span>
                    {/*
                      `null` cuando el proveedor no marco tiempo: se deja el
                      hueco en vez de escribir 00:00, que situaria la
                      intervencion en un minuto donde no ocurrio.
                    */}
                    {s.startSeconds !== null && <span className="cn-ent-mono cn-ent-nota">{minuto(s.startSeconds)}</span>}
                  </p>
                  <p className="cn-ent-intervencion-texto">{s.text}</p>
                </li>
              ))}
            </ol>
            <p className="cn-ent-nota">
              Asignar roles, dividir intervenciones y corregir el texto se hacen en la pantalla grande: son ajustes
              finos sobre una transcripción larga.
            </p>
          </section>
        )}

        {result && (
          <section className="cn-ent-seccion" aria-labelledby="cn-ent-guion-movil">
            <h2 id="cn-ent-guion-movil" className="cn-ent-h2">
              Lo que no puede quedar sin preguntar
            </h2>
            {!guionHabilitado ? (
              <p className="cn-ent-aviso cn-ent-aviso--info">{AVISO_FUNCION_DESHABILITADA}</p>
            ) : (
              <ul className="cn-ent-guion">
                {GUION_BASE.map((p) => {
                  const estado = estadosGuion.get(p.id) ?? { estado: 'pendiente' as const };
                  const clase =
                    estado.estado === 'hoy'
                      ? 'cn-ent-pregunta--hoy'
                      : estado.estado === 'antes'
                        ? 'cn-ent-pregunta--antes'
                        : 'cn-ent-pregunta--falta';
                  return (
                    <li key={p.id} className={`cn-ent-pregunta ${clase}`}>
                      <span className="cn-ent-pregunta-marca" aria-hidden="true">
                        {estado.estado !== 'pendiente' && <Check size={16} strokeWidth={2.4} />}
                      </span>
                      <span className="cn-ent-pregunta-cuerpo">
                        <span className="cn-ent-pregunta-texto">{p.texto}</span>
                        {estado.estado === 'hoy' && <span className="cn-ent-pregunta-nota">Quedó dicha en la conversación.</span>}
                        {estado.estado === 'antes' && (
                          <span className="cn-ent-pregunta-nota">
                            Ya se habló de esto en la entrevista del {fechaCorta(estado.origen.transcribedAt)}.
                          </span>
                        )}
                        {estado.estado === 'pendiente' && (
                          <span className="cn-ent-pregunta-nota">
                            {p.loQueCuesta ? `Sin cubrir · ${p.loQueCuesta}` : 'Sin cubrir'}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      {/*
        EL PIE, SOLO CUANDO HAY TRANSCRITO. Un pie fijo con Word, PDF y «cerrar»
        sobre una pantalla que todavía no ha grabado nada son tres botones que
        no pueden hacer nada — y ocupando el sitio más alcanzable de la pantalla.
      */}
      {result && (
        <div className="cn-ent-movil-pie">
          <div className="cn-ent-movil-pie-fila">
            <button type="button" onClick={() => exportar('word')} className="cn-ini-boton cn-ini-boton--suave cn-ent-boton cn-ent-boton--alto">
              <FileText size={16} aria-hidden="true" />
              Acta en Word
            </button>
            <button type="button" onClick={() => exportar('pdf')} className="cn-ini-boton cn-ini-boton--suave cn-ent-boton cn-ent-boton--alto">
              <FileText size={16} aria-hidden="true" />
              PDF
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCerrarAbierto(true)}
            disabled={!transcriptionId}
            className="cn-ini-boton cn-ini-boton--primario cn-ent-boton cn-ent-boton--alto cn-ent-boton--ancho"
          >
            Cerrar y usar
          </button>
          <button type="button" onClick={otra} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton cn-ent-boton--ancho">
            Otra entrevista
          </button>
        </div>
      )}

      {transcriptionId && (
        <CerrarEntrevistaDialog
          abierto={cerrarAbierto}
          onCerrar={() => setCerrarAbierto(false)}
          transcriptionId={transcriptionId}
          titulo={cliente?.fullName ?? 'Entrevista'}
          onDecidido={() => setCerrarAbierto(false)}
        />
      )}
    </div>
  );
};
