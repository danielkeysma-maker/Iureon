import React from 'react';
import { AudioRecorder } from './AudioRecorder';
import {
  RAZON_AUTORIZACION,
  TEXTO_AUTORIZACION,
  useAutorizacionDeGrabacion
} from '../useAutorizacionDeGrabacion';
import { useTranscription } from '../../transcription/hooks/useTranscription';
import { IconoSinVerificar } from '../../../design/ArtboardIcons';

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
  const { hasFirm, isAvailable, isUploading, isTranscribing, result, error, transcribe } =
    useTranscription('ENTREVISTA');
  const { autorizado, autorizadoEl, marcar } = useAutorizacionDeGrabacion();

  const empezar = (file: File) => {
    void transcribe(file, undefined, autorizadoEl ?? undefined);
  };

  const trabajando = isUploading || isTranscribing;

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
          disabled={!hasFirm || !autorizado || trabajando}
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
        {result?.segments?.map((s, i) => (
          <div key={i} className="rounded-[8px] border border-line-200 bg-surface px-3 py-2.5">
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
    </div>
  );
};
