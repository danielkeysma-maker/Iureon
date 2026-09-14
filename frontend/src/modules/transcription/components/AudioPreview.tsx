import React, { useEffect, useState } from 'react';
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
  /**
   * Salta al segundo pedido y reproduce. `vez` cambia en cada pedido para que
   * dos clics seguidos sobre la misma intervención vuelvan a saltar: con solo
   * los segundos, el segundo clic no cambiaría nada y el efecto no correría.
   */
  saltarA?: { segundos: number; vez: number } | null;
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
 * It follows that playback lasts exactly as long as the tab does, and the
 * component says so rather than letting someone discover it after a reload.
 */
export const AudioPreview: React.FC<AudioPreviewProps> = ({ file, anclado = false, saltarA = null }) => {
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
   * LA ONDA TAMBIEN AL ESCUCHAR. El navegador ya trae controles, pero no dicen
   * si HAY SONIDO: una pista muda se reproduce igual que una buena. Se mide
   * sobre el propio `<audio>` con `createMediaElementSource`; al enrutarlo por
   * el analizador hay que RECONECTAR la salida al destino, o se ve la onda y no
   * se oye nada — lo hace `useNivelesDeAudio`.
   */
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = React.useState(false);
  const { niveles, conectar, soltar } = useNivelesDeAudio();
  const conectadoRef = React.useRef(false);

  const reproducir = (el: HTMLAudioElement) => {
    /*
     * `createMediaElementSource` solo se puede llamar UNA VEZ por elemento: la
     * segunda lanza. Por eso el guardia — y por eso se conecta al primer play y
     * no al montar, cuando el navegador todavía puede bloquear el contexto por
     * falta de gesto del usuario.
     */
    if (!conectadoRef.current) {
      conectar(el);
      conectadoRef.current = true;
    }
    void el.play();
  };

  const alternar = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) reproducir(el);
    else el.pause();
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

  /*
   * «VOLVER A ESCUCHAR DESDE 00:03:08». Salta al inicio de la intervención y
   * suena, sin que el abogado busque el minuto en la barra. Corre dentro de la
   * activación del clic que lo pidió, así que el navegador deja reproducir.
   */
  useEffect(() => {
    const el = audioRef.current;
    if (!saltarA || !el) return;
    el.currentTime = Math.max(0, saltarA.segundos);
    reproducir(el);
    // `reproducir` cambia en cada render; lo que decide el salto es el pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saltarA, url]);

  if (!url) return null;

  if (anclado) {
    return (
      <div className="cn-aud-reproductor">
        <div className="cn-aud-reproductor-botones">
          <button type="button" onClick={alternar} className="cn-ini-boton cn-ini-boton--suave cn-aud-boton">
            {sonando ? 'Pausar' : 'Escuchar'}
          </button>
          <button type="button" onClick={detener} className="cn-ini-boton cn-ini-boton--texto cn-aud-boton">
            Detener
          </button>
        </div>

        <span className="cn-aud-reproductor-onda">
          <OndaDeAudio niveles={niveles} activa={sonando} tono="reproduciendo" alto={22} vacio="Sin reproducir" />
        </span>

        {/*
          EL REPRODUCTOR NATIVO SE QUEDA, con su barra de posición y su
          velocidad: la velocidad es justo lo que usa quien transcribe a mano, y
          reconstruirla no le agrega nada.
        */}
        <audio
          ref={audioRef}
          controls
          src={url}
          className="cn-aud-reproductor-nativo"
          preload="metadata"
          onPlay={() => setSonando(true)}
          onPause={() => setSonando(false)}
          onEnded={() => setSonando(false)}
        />

        <p className="cn-aud-reproductor-nota">
          Desde la copia de este equipo: la grabación no se conserva y esto dura lo que esta pestaña.
        </p>
      </div>
    );
  }

  /*
   * LA VERSIÓN SUELTA, la que la entrevista monta para escuchar antes de mandar
   * a transcribir. Vive dentro de la cara nueva de Entrevistas, así que usa las
   * mismas piezas que la anclada y no la letra de 11 px de la cara anterior.
   */
  return (
    <div className="cn-aud-reproductor cn-aud-reproductor--suelto">
      <p className="cn-aud-reproductor-titulo">Escuchar la grabación</p>

      <div className="cn-aud-reproductor-botones">
        <button type="button" onClick={alternar} className="cn-ini-boton cn-ini-boton--suave cn-aud-boton">
          {sonando ? 'Pausar' : 'Escuchar'}
        </button>
        <button type="button" onClick={detener} className="cn-ini-boton cn-ini-boton--texto cn-aud-boton">
          Detener
        </button>
      </div>

      <span className="cn-aud-reproductor-onda">
        <OndaDeAudio niveles={niveles} activa={sonando} tono="reproduciendo" alto={22} vacio="Sin reproducir" />
      </span>

      <audio
        ref={audioRef}
        controls
        src={url}
        className="cn-aud-reproductor-nativo"
        preload="metadata"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
      />

      <p className="cn-aud-reproductor-nota">
        Se reproduce desde este navegador, no desde el servidor: la grabación se borra del almacenamiento al
        terminar de transcribirse. Estará disponible mientras no cierre esta pestaña.
      </p>
    </div>
  );
};
