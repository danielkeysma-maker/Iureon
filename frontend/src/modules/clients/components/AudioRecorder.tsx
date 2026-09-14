import React from 'react';
import { Pause, Play, Square } from 'lucide-react';

import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { cronometro } from '../entrevistaEnPantalla';
import { OndaDeAudio } from '../../../design/OndaDeAudio';
import { AudioPreview } from '../../transcription/components/AudioPreview';

export type EstadoDeGrabadora = 'inactiva' | 'grabando' | 'lista';

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
   * códec. La móvil solo cambia el TAMAÑO y la disposición.
   */
  variante?: 'escritorio' | 'movil';
  /**
   * Empieza sola al montarse. El escritorio la monta DESPUÉS de «Empezar a
   * grabar» en el diálogo de nueva entrevista, y pedir un segundo clic en la
   * pantalla de grabación sería preguntar dos veces lo mismo. Solo arranca si
   * no está deshabilitada: la autorización sigue mandando.
   */
  iniciarAlMontar?: boolean;
  /** La línea bajo el cronómetro: con quién y a qué hora se autorizó. */
  linea?: React.ReactNode;
  /** Para que la pantalla sepa si salir perdería una grabación. */
  onEstado?: (estado: EstadoDeGrabadora) => void;
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
 *
 * LA CARA NUEVA (maqueta `app-audiencias-entrevistas.html:107`): la BANDA de
 * arriba con el cronómetro grande, el estado y los dos controles — pausar y
 * terminar. Lo que la maqueta pone debajo (el guion, el panel lateral) es de la
 * pantalla, no de la grabadora.
 */

/** The first container this browser will actually record. */
const pickMimeType = (): string | undefined => {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecorded,
  disabled,
  variante = 'escritorio',
  iniciarAlMontar = false,
  linea,
  onEstado
}) => {
  /*
   * Con el plan vencido no se graba: el transcrito nuevo lo rechazaria el
   * servidor (402) DESPUES de una hora de entrevista, que es el peor momento.
   */
  const soloLectura = usePlanSoloLectura();
  const deshabilitado = Boolean(disabled) || soloLectura;
  const [grabando, setGrabando] = React.useState(false);
  const [segundos, setSegundos] = React.useState(0);
  const [error, setError] = React.useState('');
  const [listo, setListo] = React.useState<{ file: File; url: string } | null>(null);
  const [pausado, setPausado] = React.useState(false);
  /*
   * NIVELES MEDIDOS DE VERDAD, no una animacion.
   *
   * Se dijo antes que la onda no se podia pintar porque `MediaRecorder`
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
  const yaInicio = React.useRef(false);

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

  React.useEffect(() => {
    onEstado?.(listo ? 'lista' : grabando ? 'grabando' : 'inactiva');
  }, [listo, grabando, onEstado]);

  const empezar = async () => {
    setError('');

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador no permite grabar. Puede subir un archivo de audio.');
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
       * instantaneo. Se guardan las ultimas 25 muestras y se toma una cada
       * 100ms — mas seguido no se distingue y gasta bateria en un telefono que
       * ademas esta grabando.
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
      setError('No se pudo acceder al micrófono. Revise el permiso del navegador, o suba un archivo de audio.');
    }
  };

  /*
   * EL ARRANQUE AUTOMÁTICO, UNA SOLA VEZ. La ref sobrevive al doble montaje de
   * `StrictMode` en desarrollo; sin ella se pedirían dos micrófonos y el
   * primero quedaría grabando sin nadie que lo detenga.
   */
  React.useEffect(() => {
    if (!iniciarAlMontar || deshabilitado || yaInicio.current) return;
    yaInicio.current = true;
    void empezar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detener = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setGrabando(false);
    setPausado(false);
  };

  /*
   * PAUSAR Y REANUDAR PRODUCEN UN SOLO ARCHIVO.
   *
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

  const movil = variante === 'movil';
  const base = `cn-ent-banda ${movil ? 'cn-ent-banda--movil' : ''}`;
  const aviso = error ? <p className="cn-ent-aviso cn-ent-aviso--aviso cn-ent-banda-ancho">{error}</p> : null;
  const soloLecturaAviso = soloLectura ? (
    <p className="cn-ent-nota cn-ent-banda-ancho">
      Con el plan vencido no se graban entrevistas nuevas: el servidor no guardaría el transcrito.
    </p>
  ) : null;

  /* ─── LISTA: escucharla antes de mandarla a transcribir ─────────────────── */
  if (listo) {
    return (
      <div className={`${base} cn-ent-banda--lista`}>
        <div className="cn-ent-banda-texto">
          <p className="cn-ent-banda-titulo">
            Grabación lista · <span className="cn-ent-mono">{cronometro(segundos)}</span>
          </p>
          <p className="cn-ent-banda-linea">
            Escúchela antes de transcribir: es el último momento para repetirla sin volver a citar al cliente.
          </p>
        </div>
        {/*
          ESCUCHAR ANTES DE MANDAR A TRANSCRIBIR, con la misma onda de la
          grabacion. Una pista muda se reproduce igual que una buena y la barra
          avanza en las dos — la onda es lo unico que distingue las dos cosas.
        */}
        <div className="cn-ent-banda-ancho">
          <AudioPreview file={listo.file} />
        </div>
        <div className="cn-ent-banda-acciones">
          <button type="button" onClick={descartar} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton">
            Descartar
          </button>
          <button
            type="button"
            onClick={() => onRecorded(listo.file)}
            disabled={deshabilitado}
            className={`cn-ini-boton cn-ini-boton--primario cn-ent-boton ${movil ? 'cn-ent-boton--alto' : ''}`}
          >
            Transcribir esta entrevista
          </button>
        </div>
        {soloLecturaAviso}
      </div>
    );
  }

  /* ─── GRABANDO o EN PAUSA ───────────────────────────────────────────────── */
  if (grabando) {
    return (
      <div className={`${base} ${pausado ? 'cn-ent-banda--pausa' : 'cn-ent-banda--grabando'}`}>
        <span className={`cn-ent-punto ${pausado ? 'cn-ent-punto--pausa' : ''}`} aria-hidden="true" />
        <div className="cn-ent-banda-texto">
          <p className="cn-ent-banda-fila" aria-live="polite">
            <span className="cn-ent-cronometro">{cronometro(segundos)}</span>
            <span className="cn-ent-banda-estado">{pausado ? 'En pausa · el tiempo no corre' : 'Grabando'}</span>
          </p>
          {linea && <p className="cn-ent-banda-linea">{linea}</p>}
        </div>
        <div className="cn-ent-banda-acciones">
          <button
            type="button"
            onClick={alternarPausa}
            className={`cn-ini-boton cn-ini-boton--blanco cn-ent-boton ${movil ? 'cn-ent-boton--alto' : ''}`}
          >
            {pausado ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            {pausado ? 'Reanudar' : 'Pausar'}
          </button>
          <button
            type="button"
            onClick={detener}
            className={`cn-ini-boton cn-ent-boton cn-ent-boton--tinta ${movil ? 'cn-ent-boton--alto' : ''}`}
          >
            <Square size={14} aria-hidden="true" />
            Terminar
          </button>
        </div>
        {/*
          EN PAUSA LA ONDA SE QUEDA QUIETA Y EN GRIS, que es lo unico honesto:
          una onda moviendose mientras no se graba diria que sigue capturando.
        */}
        <div className="cn-ent-banda-ancho cn-ent-onda">
          <OndaDeAudio niveles={niveles} activa={!pausado} tono="grabando" alto={movil ? 26 : 22} />
        </div>
      </div>
    );
  }

  /* ─── ANTES DE EMPEZAR ──────────────────────────────────────────────────── */
  return (
    <div className={`${base} cn-ent-banda--inactiva`}>
      <div className="cn-ent-banda-texto">
        <p className="cn-ent-banda-titulo">Lista para grabar</p>
        <p className="cn-ent-banda-linea">
          {linea ?? 'Se graba en este navegador y no sale de aquí hasta que pulse transcribir.'}
        </p>
      </div>
      <div className="cn-ent-banda-acciones">
        <button
          type="button"
          onClick={() => void empezar()}
          disabled={deshabilitado}
          className={`cn-ini-boton cn-ini-boton--primario cn-ent-boton ${movil ? 'cn-ent-boton--alto cn-ent-boton--ancho' : ''}`}
        >
          {error ? 'Intentar de nuevo' : movil ? 'Grabar la entrevista' : 'Empezar a grabar'}
        </button>
      </div>
      {aviso}
      {soloLecturaAviso}
    </div>
  );
};
