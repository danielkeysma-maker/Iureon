import React from 'react';
import { textoDelArchivo } from '../workspace/services/textoDelArchivo';

/**
 * Adjuntar el documento que llegó, en vez de volver a contarlo por escrito.
 *
 * ─── POR QUÉ ────────────────────────────────────────────────────────────────
 *
 * Lo que el abogado tiene delante casi nunca son «hechos»: es un oficio, una
 * demanda o una notificación que ya los cuenta. Obligarlo a resumirlos a mano
 * antes de que el catálogo pueda proponer algo es pedirle el trabajo dos veces,
 * y el resumen siempre pierde justo el dato que define la vía —la fecha de
 * notificación, la autoridad, la cuantía—.
 *
 * La lectura ocurre en el navegador (`textoDelArchivo`), así que adjuntar no
 * sube nada ni cuesta nada: quien solo escribe hechos no paga por esto.
 *
 * ─── POR QUÉ UN GANCHO COMPARTIDO Y NO DOS COPIAS ───────────────────────────
 *
 * Escritorio y móvil pintan cosas distintas —uno arrastra, el otro escoge— pero
 * la regla de qué pasa con el texto es la MISMA, y es la parte que se puede
 * romper: añadir sin sustituir, no borrar nada cuando el archivo no se deja
 * leer, y poder deshacer. Duplicarla garantizaba que las dos pantallas se
 * separaran a la primera corrección.
 *
 * ─── LA REGLA, DICHA ────────────────────────────────────────────────────────
 *
 * El texto del archivo se AÑADE debajo de lo que ya estaba escrito, separado
 * por un renglón en blanco. Nunca sustituye: lo que la persona escribió con sus
 * palabras suele ser lo que el documento no dice.
 *
 * «Quitar» deshace ese último adjunto —devuelve el cuadro a como estaba justo
 * antes de adjuntarlo— y por eso se guarda el texto previo, no se recorta el
 * final: el cuadro sigue siendo editable y el abogado pudo tocarlo en medio.
 */

/** Lo que sabe leer `textoDelArchivo`; ofrecer más solo produce rechazos. */
export const ARCHIVOS_DE_HECHOS = '.pdf,.docx,.txt,.md';

/** Lo que se le muestra al abogado del archivo ya leído. */
export interface HechosAdjuntados {
  nombre: string;
  caracteres: number;
  /** El documento era más largo que el techo del lector: se leyó el comienzo. */
  recortado: boolean;
}

export interface AdjuntoDeHechos {
  /** Mientras lee. Un PDF de cuarenta páginas tarda un par de segundos. */
  leyendo: boolean;
  adjunto: HechosAdjuntados | null;
  /** Por qué no se pudo leer, redactado por el servicio para el abogado. */
  motivo: string;
  leer: (archivo: File | null | undefined) => Promise<void>;
  quitar: () => void;
}

export const useHechosDesdeArchivo = (
  setHechos: React.Dispatch<React.SetStateAction<string>>
): AdjuntoDeHechos => {
  const [leyendo, setLeyendo] = React.useState(false);
  const [adjunto, setAdjunto] = React.useState<HechosAdjuntados | null>(null);
  const [motivo, setMotivo] = React.useState('');
  /* El cuadro tal como estaba antes del último adjunto: es lo que devuelve «quitar». */
  const previo = React.useRef('');

  const leer = React.useCallback(
    async (archivo: File | null | undefined) => {
      if (!archivo || leyendo) return;
      setLeyendo(true);
      setMotivo('');
      try {
        const lectura = await textoDelArchivo(archivo);
        if (!lectura.ok) {
          /*
           * NO SE TOCA EL CUADRO. Un escaneo ilegible no puede costarle al
           * abogado lo que ya había escrito; el motivo se muestra y ya.
           */
          setMotivo(lectura.motivo);
          return;
        }
        setHechos((actual) => {
          previo.current = actual;
          return actual.trim() ? `${actual.trimEnd()}\n\n${lectura.texto}` : lectura.texto;
        });
        setAdjunto({
          nombre: archivo.name,
          caracteres: lectura.caracteres,
          recortado: lectura.recortado
        });
      } finally {
        setLeyendo(false);
      }
    },
    [leyendo, setHechos]
  );

  const quitar = React.useCallback(() => {
    setHechos(previo.current);
    setAdjunto(null);
    setMotivo('');
  }, [setHechos]);

  return { leyendo, adjunto, motivo, leer, quitar };
};
