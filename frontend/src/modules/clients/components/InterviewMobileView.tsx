import React from 'react';
import { AudioRecorder } from './AudioRecorder';
import { ClientPicker } from './ClientPicker';
import type { Client } from '../clients.api';
import {
  RAZON_AUTORIZACION,
  TEXTO_AUTORIZACION,
  useAutorizacionDeGrabacion
} from '../useAutorizacionDeGrabacion';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { clientsApi } from '../clients.api';
import { CerrarEntrevistaDialog } from './CerrarEntrevistaDialog';
import { IconoDocumento, IconoSinVerificar } from '../../../design/ArtboardIcons';


/**
 * La entrevista en móvil. Artboard 4d, tercera pantalla.
 *
 * ─── POR QUÉ ESTE MÓDULO ES EL QUE MÁS GANA EN EL TELÉFONO ──────────────────
 *
 * Lo dice la nota del artboard y es cierto: **el teléfono ES la grabadora
 * real**. Una audiencia llega como archivo de cincuenta megas que alguien sube
 * después; una entrevista ocurre con el cliente enfrente, y el aparato que está
 * sobre la mesa es este. Por eso el cronómetro es el elemento más grande de la
 * pantalla y por eso se avisa que sigue grabando con la pantalla apagada — dos
 * cosas que en el escritorio no hacen falta.
 *
 * ─── UNA SOLA GRABADORA Y UN SOLO CONSENTIMIENTO ────────────────────────────
 *
 * `MediaRecorder`, los permisos del micrófono y el cronómetro viven en
 * `AudioRecorder`, que aquí se pide con `variante="movil"`: cambia el tamaño y
 * la disposición, nunca la lógica. Y la autorización de grabación viene de
 * `useAutorizacionDeGrabacion`, compartida con la pantalla de escritorio.
 *
 * Eso segundo no es aseo: la voz es un dato biométrico (Ley 1581 de 2012) y la
 * hora del clic viaja a `transcriptions.autorizo_grabacion_el` como constancia
 * demostrable. Dos copias del consentimiento se desincronizan sin hacer ruido
 * —una sella la hora, la otra la olvida— y el día que alguien la pida existiría
 * solo para la mitad de las entrevistas.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · La ONDA DE SONIDO (barras de 3px, gris lo pasado y rojo lo actual). Es un
 *   medidor de nivel, y este grabador no expone el volumen: `MediaRecorder`
 *   entrega trozos de audio, no amplitud. Pintar barras animadas al azar sería
 *   un adorno que finge medir algo — en la pantalla donde lo que importa es
 *   saber si de verdad está grabando. El punto rojo y el cronómetro corriendo
 *   dicen la verdad; una onda inventada diría más y sabría menos.
 * · «Pausar». `MediaRecorder` tiene `pause()`, pero el resto del canal no:
 *   detener y reanudar produce dos archivos que hoy nadie une, y el segundo
 *   llegaría sin la primera mitad de la entrevista.
 * · «Asignar Voz 3 → familiar» sobre la intervención en curso. La asignación de
 *   roles existe y funciona, pero DESPUÉS de transcribir: durante la grabación
 *   no hay intervenciones todavía, porque la transcripción ocurre al terminar.
 *   La maqueta dibuja un producto que transcribe en vivo, y este no lo hace.
 */

interface InterviewMobileViewProps {
  onDraft?: (hechos: string) => void;
}

export const InterviewMobileView: React.FC<InterviewMobileViewProps> = () => {
  const {
    hasFirm,
    isAvailable,
    isUploading,
    isTranscribing,
    result,
    error,
    transcribe,
    transcriptionId,
    stored
  } = useTranscription('ENTREVISTA');
  const { autorizado, autorizadoEl, marcar } = useAutorizacionDeGrabacion();

  /*
   * CON QUIEN ES LA ENTREVISTA. Faltaba, y no era un detalle: 4d pone la ficha
   * del consultante como CABECERA de la pantalla —avatar con iniciales, nombre
   * y cedula—, y el acta (14b) imprime «Consultante: nombre — C.C. documento»
   * con su linea de firma. Una entrevista sin consultante se archiva sin poder
   * encontrarla despues por la persona, que es como se busca.
   *
   * Se guarda la FICHA y no solo el id, por la misma razon que en escritorio:
   * el acta necesita el nombre y el documento, y volver a pedirlos por id seria
   * un viaje de red por algo que ya esta en memoria.
   */
  const [clienteId, setClienteId] = React.useState<string | null>(null);
  const [cliente, setCliente] = React.useState<Client | null>(null);

  const empezar = (file: File) => {
    /*
     * El segundo parametro es `contextPrompt`, NO el cliente. Se paso el id por
     * ahi durante un momento y habria viajado al proveedor como contexto de
     * transcripcion — vocabulario inventado que empeora el transcrito. El
     * cliente se asocia como en escritorio, despues de transcribir.
     */
    void transcribe(file, undefined, autorizadoEl ?? undefined);
  };

  /*
   * SE ATA EL CLIENTE EN CUANTO HAY TRANSCRITO AL QUE ATARLO. La eleccion se
   * hace ANTES de grabar y el transcrito nace despues; sin este efecto, lo que
   * el abogado escogio se perderia entre los dos momentos. Es el mismo enlace
   * que hace la pantalla de escritorio, y falla en silencio a proposito: el
   * transcrito ya esta a salvo y el vinculo se puede rehacer.
   */
  React.useEffect(() => {
    if (!transcriptionId || !clienteId) return;
    void clientsApi.linkInterview(transcriptionId, clienteId).catch(() => {});
  }, [transcriptionId, clienteId]);

  const [cerrarAbierto, setCerrarAbierto] = React.useState(false);
  const trabajando = isUploading || isTranscribing;

  /*
   * EL ACTA CON DATOS REALES Y SIN RED, igual que en escritorio: todo sale de
   * la fila que la lista ya tiene en memoria — la hora de autorizacion, quien
   * reviso, el resumen y el consultante—. Exportar no debe pagar el arranque en
   * frio de una funcion por datos que ya estan aqui.
   */
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

  if (!isAvailable) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas p-4">
        <p className="flex items-start gap-2 rounded-[8px] border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-3.5 py-3 text-[12.5px] leading-snug text-unverified">
          <IconoSinVerificar className="mt-0.5 h-4 w-4 shrink-0" />
          El motor de transcripción no está configurado en el servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      {/*
        LA CABECERA DE 4d, CITADA: `padding:10px 16px 12px`, avatar de 34px
        circular sobre `#EAF0F5` con las iniciales en mono 600 12px `#17456B`,
        nombre `600 14px` y cedula `400 11px` MONO `#667487`. Todos esos colores
        son tokens: brand-50, brand-700, ink-900, ink-500.
      */}
      <header className="shrink-0 border-b border-line-200 bg-surface px-4 pb-3 pt-2.5">
        {cliente ? (
          <div className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand-50 font-mono text-[12px] font-semibold text-brand-700">
              {cliente.fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold leading-tight text-ink-900">
                {cliente.fullName}
              </p>
              <p className="truncate font-mono text-[11px] leading-tight text-ink-500">
                C.C. {cliente.documentId}
                {cliente.interviews === 0 ? ' · cliente nuevo' : ` · ${cliente.interviews} entrevistas`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setClienteId(null);
                setCliente(null);
              }}
              className="shrink-0 text-[12px] font-medium text-brand-700"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[13px] font-semibold text-ink-900">
              ¿Con quién es la entrevista?
            </p>
            <ClientPicker
              value={clienteId}
              onChange={(id, ficha) => {
                setClienteId(id);
                setCliente(ficha);
              }}
            />
            <p className="mt-2 text-justify text-[11.5px] leading-snug text-ink-500 [text-wrap:pretty]">
              Para encontrar esta conversación por la persona, no por el nombre del archivo. El
              acta imprime su nombre y su cédula.
            </p>
          </>
        )}
      </header>

      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        {/*
          LA AUTORIZACION VA PRIMERO Y BLOQUEA. No es una casilla de tramite: sin
          ella el grabador esta deshabilitado y el audio no se envia. Se pinta en
          ambar mientras no este marcada — el mismo lenguaje que el resto del
          producto usa para «esto todavia no esta comprobado».
        */}
        <label
          className={`flex cursor-pointer items-start gap-2.5 rounded-[8px] border px-3.5 py-3 ${
            autorizado
              ? 'border-line-200 bg-surface'
              : 'border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))]'
          }`}
        >
          <input
            type="checkbox"
            checked={autorizado}
            onChange={(e) => marcar(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold leading-snug text-ink-900">
              {TEXTO_AUTORIZACION}
            </span>
            <span className="mt-1 block text-justify text-[11.5px] leading-snug text-ink-500 [text-wrap:pretty]">
              {RAZON_AUTORIZACION}
            </span>
            {autorizadoEl && (
              <span className="mt-1 block font-mono text-[11px] text-verified">
                Registrada a las{' '}
                {new Date(autorizadoEl).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </span>
        </label>

        <AudioRecorder
          variante="movil"
          onRecorded={empezar}
          disabled={!hasFirm || !autorizado || !clienteId || trabajando}
        />

        {!hasFirm && (
          <p className="text-[12px] leading-snug text-ink-500">
            Sin una firma activa no se puede guardar la entrevista.
          </p>
        )}

        {trabajando && (
          <p className="rounded-[8px] border border-line-200 bg-surface px-3.5 py-3 text-[12.5px] text-ink-700">
            {isUploading ? 'Subiendo la grabación…' : 'Transcribiendo…'} No cierre la aplicación.
          </p>
        )}

        {error && (
          <p className="rounded-[8px] border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-3.5 py-3 text-[12.5px] leading-snug text-danger">
            {error}
          </p>
        )}

        {/*
          LAS INTERVENCIONES, EN EL FORMATO DE 4d: interlocutor y hora arriba,
          texto debajo, ancho completo. La de escritorio usa tres columnas y en
          375px eso deja el texto en una franja de cuatro palabras por renglon.
        */}
        {/*
          SIN TARJETA. La nota de 4d es explicita: «la unica fila con tarjeta y
          borde es la que se esta editando». Encuadrar todas las intervenciones
          convierte la transcripcion en una lista de fichas y le quita al borde
          su significado — si todo esta enmarcado, el marco no señala nada. Aqui
          no hay edicion en curso, asi que ninguna la lleva.
        */}
        {result?.segments?.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-[2px] bg-brand-700" />
              <span className="text-[12px] font-semibold text-ink-900">
                {s.speakerName ?? s.speakerLabel}
              </span>
              {/*
                mm:ss desde el inicio de la grabacion. `null` cuando el proveedor
                no marco tiempo: se deja el hueco en vez de escribir 00:00, que
                situaria la intervencion en un minuto donde no ocurrio.
              */}
              {s.startSeconds !== null && (
                <span className="ml-auto font-mono text-[11px] text-ink-400">
                  {String(Math.floor(s.startSeconds / 60)).padStart(2, '0')}:
                  {String(Math.floor(s.startSeconds % 60)).padStart(2, '0')}
                </span>
              )}
            </div>
            <p className="mt-1 text-justify text-[13.5px] leading-[1.65] text-ink-900 [text-wrap:pretty]">
              {s.text}
            </p>
          </div>
        ))}

        {result && (
          <p className="text-justify text-[11.5px] leading-snug text-ink-500 [text-wrap:pretty]">
            Asignar roles, dividir intervenciones y corregir el texto se hacen en la pantalla
            grande: son ajustes finos sobre una transcripción larga, y de pie se revisa, no se
            edita.
          </p>
        )}
      </div>

      {/*
        EL PIE DE 4d, TRASPLANTADO: `background:#fff; border-top:1px solid
        #E3E7EC; padding:12px 16px`. Primero la fila del ACTA —rótulo en mono
        versales y los dos formatos como botones de 44px del mismo peso, porque
        el .docx se sigue editando y el PDF se anexa—, y debajo «Cerrar y usar»
        de 52px.

        Solo aparece CUANDO HAY TRANSCRITO. Un pie fijo con Word, PDF y «cerrar»
        sobre una pantalla que todavía no ha grabado nada son tres botones que
        no pueden hacer nada — y ocupando el borde inferior, que es el sitio más
        alcanzable de la pantalla.
      */}
      {result && (
        <div className="shrink-0 border-t border-line-200 bg-surface px-4 pb-3.5 pt-3">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Acta
            </span>
            <button
              type="button"
              onClick={() => exportar('word')}
              className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[6px] border border-brand-line bg-surface text-[13px] font-medium text-brand-700"
            >
              <IconoDocumento className="h-3.5 w-3.5" />
              Word
            </button>
            <button
              type="button"
              onClick={() => exportar('pdf')}
              className="flex h-11 flex-1 items-center justify-center gap-[7px] rounded-[6px] border border-brand-line bg-surface text-[13px] font-medium text-brand-700"
            >
              <IconoDocumento className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCerrarAbierto(true)}
            disabled={!transcriptionId}
            className="h-[52px] w-full rounded-[8px] bg-brand-700 text-[13.5px] font-semibold text-white disabled:opacity-50"
          >
            Cerrar y usar
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
