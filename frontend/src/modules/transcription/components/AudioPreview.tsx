import React, { useEffect, useState } from 'react';
import { Headphones, Pause, Play, Square } from 'lucide-react';
import { OndaDeAudio, useNivelesDeAudio } from '../../../design/OndaDeAudio';

interface AudioPreviewProps {
  /** The file the lawyer selected. Never re-downloaded from storage. */
  file: File | null;
  /**
   * Anclado: barra delgada para vivir fija al pie del transcript. El abogado
   * comprueba una palabra dudosa contra el audio SIN perder la fila que lee —
   * un reproductor que se va con el scroll obliga a elegir entre oir y leer.
   */
  anclado?: boolean;
}

/**
 * Plays the recording being reviewed, straight from the browser's own copy.
 *
 * WHY FROM THE LOCAL FILE. The recording is deleted from storage the moment it
 * is transcribed — that is the whole reason the upload detour was acceptable —
 * so there is nothing to fetch back. But the browser still holds the File the
 * lawyer picked, and an object URL turns it into audio at no cost: no request,
 * no storage, no change to what the server keeps.
 *
 * It follows that playback lasts exactly as long as the tab does. That matches
 * what it is for — checking a word against what was actually said while reading
 * the transcript — and the component says so rather than letting someone
 * discover it after a reload.
 */
export const AudioPreview: React.FC<AudioPreviewProps> = ({ file, anclado = false }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    // Revoked on unmount: an object URL pins the whole file in memory, and a
    // two-hour hearing is not something to leak by leaving the tab open.
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  /*
   * LA ONDA TAMBIEN AL ESCUCHAR (1g y 2a). El navegador ya trae controles, pero
   * no dicen si HAY SONIDO: una pista muda se reproduce igual que una buena, y
   * la barra avanza en las dos. Quien vuelve a escuchar una audiencia lo hace
   * porque duda de una palabra — necesita ver dónde el micrófono captó algo.
   *
   * Se mide sobre el propio `<audio>` con `createMediaElementSource`, la misma
   * técnica que el grabador usa sobre el micrófono. Al enrutarlo por el
   * analizador hay que RECONECTAR la salida al destino: sin eso se ve la onda y
   * no se oye nada — lo hace `useNivelesDeAudio`.
   */
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = React.useState(false);
  const { niveles, conectar, soltar } = useNivelesDeAudio();
  const conectadoRef = React.useRef(false);

  const alternar = () => {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      /*
       * `createMediaElementSource` solo se puede llamar UNA VEZ por elemento:
       * la segunda lanza. Por eso el guardia — y por eso se conecta al primer
       * play y no al montar, cuando el navegador todavía puede bloquear el
       * contexto por falta de gesto del usuario.
       */
      if (!conectadoRef.current) {
        conectar(el);
        conectadoRef.current = true;
      }
      void el.play();
    } else {
      el.pause();
    }
  };

  const detener = () => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setSonando(false);
    soltar();
    /* El contexto se cerró: el elemento necesita uno nuevo la próxima vez. */
    conectadoRef.current = false;
  };

  if (!url) return null;

  if (anclado) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-card border border-line-200 bg-surface px-3 py-2 shadow-e2"
        title="Se reproduce desde este navegador; la grabación se borra del servidor al transcribirse y dura lo que esta pestaña."
      >
        <Headphones className="h-3.5 w-3.5 shrink-0 text-ink-400" />

        <button type="button" onClick={alternar} className="btn-neutral btn-sm shrink-0">
          {sonando ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {sonando ? 'Pausar' : 'Escuchar'}
        </button>
        <button type="button" onClick={detener} className="btn-ghost btn-sm shrink-0">
          <Square className="h-3 w-3" />
          Detener
        </button>

        <OndaDeAudio
          niveles={niveles}
          activa={sonando}
          tono="reproduciendo"
          alto={22}
          vacio="Sin reproducir"
        />

        {/*
          EL REPRODUCTOR NATIVO SE QUEDA, con su barra de posición: los botones
          de arriba resuelven escuchar, pausar y detener, pero saltar al minuto
          14 sigue siendo suyo. Sustituirlo entero obligaría a reconstruir la
          barra, el volumen y la velocidad — y la velocidad es justo lo que usa
          quien transcribe a mano.
        */}
        <audio
          ref={audioRef}
          controls
          src={url}
          className="h-8 min-w-0 flex-1"
          preload="metadata"
          onPlay={() => setSonando(true)}
          onPause={() => setSonando(false)}
          onEnded={() => setSonando(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line-200 rounded-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Headphones className="w-3.5 h-3.5 text-ink-400" />
        <span className="text-[11px] font-semibold text-ink-700">Escuchar la grabación</span>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={alternar} className="btn-neutral btn-sm shrink-0">
          {sonando ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {sonando ? 'Pausar' : 'Escuchar'}
        </button>
        <button type="button" onClick={detener} className="btn-ghost btn-sm shrink-0">
          <Square className="h-3 w-3" />
          Detener
        </button>
        <OndaDeAudio
          niveles={niveles}
          activa={sonando}
          tono="reproduciendo"
          alto={22}
          vacio="Sin reproducir"
        />
      </div>

      <audio
        ref={audioRef}
        controls
        src={url}
        className="h-9 w-full"
        preload="metadata"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
      />

      <p className="text-[10.5px] text-ink-500 leading-snug">
        Se reproduce desde este navegador, no desde el servidor: la grabación se borra del
        almacenamiento al terminar de transcribirse. Estará disponible mientras no cierres esta
        pestaña.
      </p>
    </div>
  );
};
