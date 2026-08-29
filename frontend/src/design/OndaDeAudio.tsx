import React from 'react';

/**
 * La onda de audio, con niveles MEDIDOS. Artboards 1g y 4d.
 *
 * ─── UNA SOLA ONDA PARA GRABAR Y PARA ESCUCHAR ──────────────────────────────
 *
 * Nació dentro del grabador y solo en su piel móvil. Al pedirla también en
 * escritorio y en la reproducción, la opción era copiarla tres veces o sacarla
 * aquí. Se sacó: si las barras de grabar y las de escuchar se dibujaran
 * distinto, el abogado leería dos cosas donde hay una — cuánto sonido hay.
 *
 * ─── MIDE, NO ANIMA ─────────────────────────────────────────────────────────
 *
 * Cada barra es el RMS del dominio del tiempo de un `AnalyserNode`, tomado cada
 * 100ms. No es una animación decorativa que se mueve mientras algo ocurre: si
 * el micrófono está mudo o la pista está en silencio, las barras se aplanan —
 * que es exactamente lo que hay que poder ver antes de confiar en una
 * grabación de dos horas.
 *
 * ─── QUIETA Y EN GRIS CUANDO NO PASA NADA ───────────────────────────────────
 *
 * En pausa, o con el audio detenido, no se mueve y pierde el color. Una onda
 * agitándose mientras no se captura ni se reproduce diría que sí.
 */

interface OndaDeAudioProps {
  /** Últimos niveles, de 0 a 1. El más reciente al final. */
  niveles: readonly number[];
  /** `false` la deja quieta y en gris: no se está capturando ni sonando. */
  activa: boolean;
  /** Rojo mientras se graba; azul de marca al escuchar. */
  tono?: 'grabando' | 'reproduciendo';
  /** Alto en píxeles. 26 en las maquetas móviles; 22 cabe mejor en una fila. */
  alto?: number;
  /** Texto mientras no hay ninguna medida todavía. */
  vacio?: string;
}

/** Cuántas barras recientes llevan color. Las anteriores quedan en gris. */
const RECIENTES = 14;

export const OndaDeAudio: React.FC<OndaDeAudioProps> = ({
  niveles,
  activa,
  tono = 'grabando',
  alto = 26,
  vacio = 'Escuchando…'
}) => (
  <div
    className="flex items-center gap-[2px]"
    style={{ height: alto }}
    aria-hidden="true"
  >
    {niveles.map((nivel, i) => (
      <span
        key={i}
        className={`w-[3px] shrink-0 rounded-[1px] ${
          !activa || i < niveles.length - RECIENTES
            ? 'bg-neutral-line'
            : tono === 'grabando'
            ? 'bg-danger'
            : 'bg-brand-700'
        }`}
        /*
          Mínimo de 4px: una barra de cero altura desaparece y deja huecos que
          se leen como cortes en la grabación. Cuatro píxeles dicen «aquí no
          hubo sonido», que es distinto de «aquí no hubo nada».
        */
        style={{ height: `${Math.max(4, Math.round(nivel * (alto - 2)))}px` }}
      />
    ))}
    {niveles.length === 0 && <span className="font-mono text-[11px] text-ink-400">{vacio}</span>}
  </div>
);

/**
 * Mide el nivel de una fuente de audio y devuelve las últimas 25 muestras.
 *
 * ─── POR QUÉ 25 Y CADA 100ms ────────────────────────────────────────────────
 *
 * Veinticinco barras de 3px con 2px de separación son los ~125px que la maqueta
 * reserva. Y más de diez muestras por segundo no se distinguen a ese tamaño:
 * solo gastan batería en un teléfono que además está grabando.
 *
 * Devuelve también el par `conectar`/`soltar` porque el `AudioContext` hay que
 * cerrarlo — uno vivo sigue consumiendo, y en un teléfono eso es batería por
 * nada.
 */
export const useNivelesDeAudio = () => {
  const [niveles, setNiveles] = React.useState<number[]>([]);
  const ctxRef = React.useRef<AudioContext | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const soltar = React.useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setNiveles([]);
  }, []);

  /**
   * `fuente` es un `MediaStream` (micrófono) o un `HTMLAudioElement` (pista).
   *
   * Con un elemento de audio hay que RECONECTAR la salida al destino: al
   * enrutarlo por el analizador, el sonido deja de llegar a los altavoces si
   * no se vuelve a conectar. Se descubre en cuanto se prueba — se ve la onda
   * y no se oye nada.
   */
  const conectar = React.useCallback((fuente: MediaStream | HTMLAudioElement) => {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const nodo =
      fuente instanceof MediaStream
        ? ctx.createMediaStreamSource(fuente)
        : ctx.createMediaElementSource(fuente);

    const analizador = ctx.createAnalyser();
    analizador.fftSize = 256;
    nodo.connect(analizador);
    if (!(fuente instanceof MediaStream)) analizador.connect(ctx.destination);

    ctxRef.current = ctx;

    const datos = new Uint8Array(analizador.frequencyBinCount);
    let ultima = 0;

    const medir = (t: number) => {
      rafRef.current = requestAnimationFrame(medir);
      if (t - ultima < 100) return;
      ultima = t;

      analizador.getByteTimeDomainData(datos);
      /* RMS sobre la onda centrada en 128: la desviación ES el volumen. */
      let suma = 0;
      for (const v of datos) suma += (v - 128) ** 2;
      const rms = Math.sqrt(suma / datos.length) / 128;

      setNiveles((previos) => [...previos, Math.min(1, rms * 3)].slice(-25));
    };

    rafRef.current = requestAnimationFrame(medir);
  }, []);

  React.useEffect(() => soltar, [soltar]);

  return { niveles, conectar, soltar };
};
