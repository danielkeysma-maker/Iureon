import React from 'react';
import { AlertTriangle, Mic, Pause, Play, Square, Trash2 } from 'lucide-react';

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

import { OndaDeAudio } from '../../../design/OndaDeAudio';
import { AudioPreview } from '../../transcription/components/AudioPreview';

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecorded,
  disabled,
  variante = 'escritorio'
}) => {
  const [grabando, setGrabando] = React.useState(false);
  const [segundos, setSegundos] = React.useState(0);
  const [error, setError] = React.useState('');
  const [listo, setListo] = React.useState<{ file: File; url: string } | null>(null);
  const [pausado, setPausado] = React.useState(false);
  /*
   * NIVELES MEDIDOS DE VERDAD, no una animacion.
   *
   * Se dijo antes que la onda de 4d no se podia pintar porque `MediaRecorder`
   * entrega trozos de audio y no amplitud. Eso es cierto de `MediaRecorder` y
   * FALSO del navegador: el mismo `MediaStream` se conecta a un `AnalyserNode`
   * de Web Audio, que devuelve el dominio del tiempo y de ahi sale el volumen
   * real (RMS). La onda mide; no adorna.
   */
  const [niveles, setNiveles] = React.useState<number[]>([]);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const rafRef = React.useRef<number | null>(null);

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

  /*
   * EL CRONOMETRO SE DETIENE EN PAUSA. Si siguiera corriendo, el numero dejaria
   * de ser la duracion de la grabacion y pasaria a ser el tiempo transcurrido
   * desde que se empezo — dos cosas distintas, y la que importa para un acta es
   * la primera.
   */
  React.useEffect(() => {
    if (!grabando || pausado) return;

    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [grabando, pausado]);

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

      /*
       * EL MEDIDOR DE NIVEL, sobre el MISMO stream que graba. `AnalyserNode`
       * con `fftSize` pequeño basta: no hace falta espectro, solo el volumen
       * instantaneo. Se guardan las ultimas 25 muestras porque son las que
       * caben en los 26px de alto que pide 4d, y se toma una cada 100ms — mas
       * seguido no se distingue y gasta bateria en un telefono que ademas esta
       * grabando.
       */
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioCtx) {
        const ctx = new AudioCtx();
        const fuente = ctx.createMediaStreamSource(stream);
        const analizador = ctx.createAnalyser();
        analizador.fftSize = 256;
        fuente.connect(analizador);
        audioCtxRef.current = ctx;
        analyserRef.current = analizador;

        const datos = new Uint8Array(analizador.frequencyBinCount);
        let ultima = 0;

        const medir = (t: number) => {
          rafRef.current = requestAnimationFrame(medir);
          if (t - ultima < 100) return;
          ultima = t;

          analizador.getByteTimeDomainData(datos);
          /* RMS sobre la onda centrada en 128: la desviacion ES el volumen. */
          let suma = 0;
          for (const v of datos) suma += (v - 128) ** 2;
          const rms = Math.sqrt(suma / datos.length) / 128;

          setNiveles((previos) => [...previos, Math.min(1, rms * 3)].slice(-25));
        };

        rafRef.current = requestAnimationFrame(medir);
      }

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
        /* El medidor se suelta con el microfono: un `AudioContext` vivo sigue
           consumiendo, y en un telefono eso es bateria por nada. */
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        void audioCtxRef.current?.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
        setNiveles([]);
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
    setPausado(false);
  };

  /*
   * PAUSAR Y REANUDAR PRODUCEN UN SOLO ARCHIVO.
   *
   * Se dijo antes que no se podia porque «detener y reanudar produce dos
   * archivos que nadie une». Eso describe `stop()` + `start()`, no `pause()`:
   * `MediaRecorder.pause()` SUSPENDE la misma grabacion y `resume()` la
   * continua sobre los mismos trozos, asi que `onstop` sigue armando un unico
   * blob. La entrevista no se parte.
   *
   * El microfono se deja ABIERTO durante la pausa a proposito: cerrarlo pediria
   * permiso otra vez al reanudar en algunos navegadores, y una entrevista que
   * se interrumpe para pedir permiso ya no es una pausa.
   */
  const alternarPausa = () => {
    const r = recorderRef.current;
    if (!r) return;

    if (r.state === 'recording') {
      r.pause();
      setPausado(true);
    } else if (r.state === 'paused') {
      r.resume();
      setPausado(false);
    }
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

        {/*
          ESCUCHAR ANTES DE MANDAR A TRANSCRIBIR, con la misma onda de la
          grabacion. Aqui importa mas que en ningun otro sitio: es el ULTIMO
          momento en que se puede repetir la entrevista sin volver a citar al
          cliente. Una pista muda se reproduce igual que una buena y la barra
          avanza en las dos — la onda es lo unico que distingue las dos cosas
          antes de gastar la transcripcion.
        */}
        <AudioPreview file={listo.file} />

        <button
          type="button"
          onClick={() => onRecorded(listo.file)}
          disabled={disabled}
          className="w-full py-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-on-brand rounded-control text-[11px] font-semibold"
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
            <span
              className={`h-[9px] w-[9px] shrink-0 rounded-full ${
                pausado ? 'bg-ink-400' : 'bg-danger'
              }`}
            />
            <span
              className={`font-mono text-[11px] font-semibold uppercase tracking-[0.07em] ${
                pausado ? 'text-ink-500' : 'text-danger'
              }`}
            >
              {pausado ? 'En pausa' : 'Grabando'}
            </span>
            <span className="ml-auto font-mono text-[16px] font-semibold text-ink-900">
              {formatElapsed(segundos)}
            </span>
          </div>

          {/*
            LA ONDA DE 4d: `height:26px`, barras de 3px con 2px de separacion,
            las pasadas en gris `#CFD6E0` —el token `neutral-line`— y las
            recientes en rojo. Cada barra es una medida REAL de volumen (RMS del
            `AnalyserNode`), tomada cada 100ms.

            EN PAUSA SE QUEDA QUIETA Y EN GRIS, que es lo unico honesto: una onda
            moviendose mientras no se graba diria que sigue capturando.
          */}
          <OndaDeAudio niveles={niveles} activa={!pausado} tono="grabando" alto={26} />

          {/*
            LOS TRES CONTROLES DE 4d: el circulo rojo de 52px que detiene,
            «Pausar» y «Cerrar y usar». Aqui los dos primeros — cerrar pertenece
            a la pantalla, que es la que sabe si hay transcrito.
          */}
          <div className="flex gap-[9px]">
            <button
              type="button"
              onClick={detener}
              aria-label="Detener y transcribir"
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-danger text-white"
            >
              <Square className="h-[18px] w-[18px] fill-current" />
            </button>
            <button
              type="button"
              onClick={alternarPausa}
              className="h-[52px] flex-1 rounded-[8px] border border-line-200 bg-canvas text-[13.5px] font-medium text-ink-700"
            >
              {pausado ? 'Reanudar' : 'Pausar'}
            </button>
          </div>

          <p className="text-center font-mono text-[11px] text-ink-400">
            Sigue grabando con la pantalla apagada
          </p>
        </div>
      ) : !grabando && variante === 'movil' ? (
        <button
          type="button"
          onClick={() => void empezar()}
          disabled={disabled}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[8px] bg-brand-700 text-[13.5px] font-semibold text-on-brand disabled:opacity-50"
        >
          <Mic className="h-4 w-4 text-on-brand" />
          Grabar la entrevista
        </button>
      ) : grabando ? (
        /*
          LA ONDA Y LA PAUSA TAMBIEN EN ESCRITORIO. Estaban solo en la piel
          movil, y no habia razon: el abogado que graba desde el portatil
          necesita las mismas dos cosas — ver si el microfono esta captando algo
          antes de confiarle dos horas, y poder parar cuando el cliente atiende
          el telefono. El punto que parpadeaba decia «esto esta corriendo», no
          «esto esta oyendo», que es otra cosa.
        */
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <span
              className={`h-[9px] w-[9px] shrink-0 rounded-full ${
                pausado ? 'bg-ink-400' : 'bg-danger'
              }`}
            />

            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold text-ink-900">{formatElapsed(segundos)}</p>
              <p className="text-[11px] text-ink-500">
                {pausado ? 'En pausa · el tiempo no corre' : 'Grabando la entrevista…'}
              </p>
            </div>

            <button
              type="button"
              onClick={alternarPausa}
              className="btn-neutral btn-sm shrink-0"
            >
              {pausado ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {pausado ? 'Reanudar' : 'Pausar'}
            </button>

            <button
              type="button"
              onClick={detener}
              className="flex shrink-0 items-center gap-1.5 rounded-control bg-danger px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
            >
              <Square className="h-3 w-3 fill-current" />
              Detener
            </button>
          </div>

          <OndaDeAudio niveles={niveles} activa={!pausado} tono="grabando" alto={22} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void empezar()}
          disabled={disabled}
          className="w-full py-3 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-on-brand rounded-card text-xs font-bold flex items-center justify-center gap-2"
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
