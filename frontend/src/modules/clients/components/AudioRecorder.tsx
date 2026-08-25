import React from 'react';
import { AlertTriangle, Mic, Square, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  /** Called with the finished recording, ready to transcribe. */
  onRecorded: (file: File) => void;
  disabled?: boolean;
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

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecorded, disabled }) => {
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
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900">Grabación lista</p>
            <p className="text-[11px] text-slate-500">
              {formatElapsed(segundos)} · escúchala antes de transcribir
            </p>
          </div>

          <button
            type="button"
            onClick={descartar}
            className="text-[11px] text-slate-500 hover:text-rose-700 flex items-center gap-1 shrink-0"
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
          className="w-full py-2 bg-blue-950 hover:bg-blue-900 disabled:bg-slate-400 text-white rounded-lg text-[11px] font-semibold"
        >
          Transcribir esta entrevista
        </button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900">{error}</p>
        </div>
      )}

      {grabando ? (
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 font-mono">{formatElapsed(segundos)}</p>
            <p className="text-[11px] text-slate-500">Grabando la entrevista…</p>
          </div>

          <button
            type="button"
            onClick={detener}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
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
          className="w-full py-3 bg-blue-950 hover:bg-blue-900 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <Mic className="w-4 h-4 text-blue-200" />
          Grabar la entrevista
        </button>
      )}

      <p className="text-[11px] text-slate-500">
        Se graba en este navegador y no sale de aquí hasta que pulses transcribir. Avisa al cliente
        antes de empezar.
      </p>
    </div>
  );
};
