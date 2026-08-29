import React from 'react';
import { AlertTriangle, Mic, Square, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  /** Called with the finished recording, ready to transcribe. */
  onRecorded: (file: File) => void;
  disabled?: boolean;
  /**
   * La piel. UNA sola grabadora con dos presentaciones, nunca dos grabadoras.
   *
   * `MediaRecorder`, los permisos del micrófono, el formato y el cronómetro son
   * la parte delicada de este módulo: una segunda copia para el teléfono
   * significaría dos sitios donde arreglar el día que un navegador cambie de
   * códec. La móvil (4d) solo cambia el TAMAÑO y la disposición — el
   * cronómetro pasa a ser el elemento más grande de la pantalla, porque el
   * teléfono es la grabadora real y de pie eso es lo único que se mira.
   */
  variante?: 'escritorio' | 'movil';
}

/**
 * Records the interview from the app, because that is where the interview
 * happens.
 *
 * WHY UPLOADING WAS THE WRONG SHAPE HERE. A hearing arrives as a file: the
 * court records it, publishes it, and the lawyer downloads it afterwards. An
 * interview has no such file — the lawyer is sitting across from the client
 * right now. Asking them to record on their phone, transfer it to the computer
 * and upload it puts three steps and a cable between the conversation and the
 * transcript, and the transcript is the point.
 *
 * WHY WEBM AND NOT SOMETHING TIDIER. It is what `MediaRecorder` produces
 * natively in Chrome and Edge, and it is already in the accepted extensions —
 * so this needed nothing on the server. Re-encoding in the browser would cost
 * a library and minutes of CPU on a two-hour conversation to produce a file the
 * provider accepts either way.
 *
 * WHY THE RECORDING NEVER LEAVES THE BROWSER UNTIL IT IS SENT. The chunks live
 * in memory; nothing is written to disk and nothing is uploaded until the
 * lawyer presses transcribe. Stopping and discarding leaves nothing behind.
 */

const formatElapsed = (seconds: number): string => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

/** The first container this browser will actually record. */
const pickMimeType = (): string | undefined => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecorded,
  disabled,
  variante = 'escritorio'
}) => {
  const [grabando, setGrabando] = React.useState(false);
  const [segundos, setSegundos] = React.useState(0);
  const [error, setError] = React.useState('');
  const [listo, setListo] = React.useState<{ file: File; url: string } | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  /*
   * The microphone is released when this unmounts, and the preview URL revoked.
   *
   * A stream left open keeps the browser's recording indicator lit after the
   * lawyer has moved on, which for a device that just listened to privileged
   * conversation is not a cosmetic detail.
   */
  React.useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (listo) URL.revokeObjectURL(listo.url);
    },
    [listo]
  );

  React.useEffect(() => {
    if (!grabando) return;

    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [grabando]);

  const empezar = async () => {
    setError('');

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite grabar. Puedes subir un archivo de audio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Speech in a room, not music: these make two people at a desk far
          // more separable than raw capture does.
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const tipo = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: tipo });
        const extension = tipo.includes('mp4') ? 'mp4' : 'webm';

        const marca = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        const file = new File([blob], `entrevista_${marca}.${extension}`, { type: tipo });

        setListo({ file, url: URL.createObjectURL(blob) });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      // A timeslice so a long interview does not sit as one growing buffer the
      // browser may drop if the tab is backgrounded.
      recorder.start(5000);
      recorderRef.current = recorder;
      setSegundos(0);
      setGrabando(true);
    } catch {
      // The browser does not say why in a way worth repeating; what the lawyer
      // needs is the way forward.
      setError(
        'No se pudo acceder al micrófono. Revisa el permiso del navegador, o sube un archivo de audio.'
      );
    }
  };

  const detener = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setGrabando(false);
  };

  const descartar = () => {
    if (listo) URL.revokeObjectURL(listo.url);
    setListo(null);
    setSegundos(0);
  };

  if (listo) {
    return (
      <div className="border border-line-200 rounded-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink-900">Grabación lista</p>
            <p className="text-[11px] text-ink-500">
              {formatElapsed(segundos)} · escúchala antes de transcribir
            </p>
          </div>

          <button
            type="button"
            onClick={descartar}
            className="text-[11px] text-ink-500 hover:text-danger flex items-center gap-1 shrink-0"
          >
            <Trash2 className="w-3 h-3" />
            Descartar
          </button>
        </div>

        <audio src={listo.url} controls className="w-full h-9" />

        <button
          type="button"
          onClick={() => onRecorded(listo.file)}
          disabled={disabled}
          className="w-full py-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-control text-[11px] font-semibold"
        >
          Transcribir esta entrevista
        </button>
      </div>
    );
  }

  return (
    <div className="border border-line-200 rounded-card p-4 space-y-3">
      {error && (
        <div className="bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-control p-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-unverified shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-900">{error}</p>
        </div>
      )}

      {grabando && variante === 'movil' ? (
        /*
          LA BANDA DE 4d, CITADA: padding 10px 12px, fondo #FBEDEB —el rojo del
          sistema al 8%—, borde #E5C6C2, radio 8; punto de 9px, «GRABANDO» en
          mono versales con tracking .07em, y el cronómetro en `600 16px MONO`
          alineado a la derecha. Es el dato más grande de la pantalla.
        */
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-[8px] border border-[rgb(var(--danger-line))] bg-[rgb(var(--danger)/0.08)] px-3 py-2.5">
            <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-danger" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-danger">
              Grabando
            </span>
            <span className="ml-auto font-mono text-[16px] font-semibold text-ink-900">
              {formatElapsed(segundos)}
            </span>
          </div>

          <button
            type="button"
            onClick={detener}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-danger text-[13.5px] font-semibold text-white"
          >
            <Square className="h-4 w-4 fill-current" />
            Detener y transcribir
          </button>

          <p className="text-center font-mono text-[11px] text-ink-400">
            Sigue grabando con la pantalla apagada
          </p>
        </div>
      ) : !grabando && variante === 'movil' ? (
        <button
          type="button"
          onClick={() => void empezar()}
          disabled={disabled}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-brand-700 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          <Mic className="h-4 w-4 text-on-brand" />
          Grabar la entrevista
        </button>
      ) : grabando ? (
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--danger)/0.06)]0 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-danger" />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink-900 font-mono">{formatElapsed(segundos)}</p>
            <p className="text-[11px] text-ink-500">Grabando la entrevista…</p>
          </div>

          <button
            type="button"
            onClick={detener}
            className="px-3 py-1.5 bg-danger hover:brightness-110 text-white rounded-control text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
          >
            <Square className="w-3 h-3 fill-current" />
            Detener
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void empezar()}
          disabled={disabled}
          className="w-full py-3 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-card text-xs font-bold flex items-center justify-center gap-2"
        >
          <Mic className="w-4 h-4 text-on-brand" />
          Grabar la entrevista
        </button>
      )}

      <p className="text-[11px] text-ink-500">
        Se graba en este navegador y no sale de aquí hasta que pulses transcribir. Avisa al cliente
        antes de empezar.
      </p>
    </div>
  );
};
