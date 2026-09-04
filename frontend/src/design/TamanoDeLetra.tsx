import React from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Tamaño de letra de LECTURA, ajustable en la misma pantalla.
 *
 * No es el tamaño del documento —ese vive en Membrete y sale así en el PDF y
 * el Word—: es cuánto se agranda el texto en pantalla para leerlo, en un
 * teléfono o con la vista cansada. Por eso es un factor sobre el tamaño base
 * de cada pantalla, se aplica al instante y se recuerda por pantalla en este
 * navegador, sin tocar la configuración de la firma.
 */

const PASOS = [0.85, 1, 1.15, 1.3, 1.5, 1.75, 2] as const;
const CLAVE = (pantalla: string) => `iureon.letra.${pantalla}`;

const leer = (pantalla: string): number => {
  try {
    const v = Number(localStorage.getItem(CLAVE(pantalla)));
    return PASOS.includes(v as (typeof PASOS)[number]) ? v : 1;
  } catch {
    return 1;
  }
};

export interface TamanoDeLetra {
  /** Multiplicador sobre el tamaño base de la pantalla. 1 = como viene. */
  factor: number;
  aumentar: () => void;
  disminuir: () => void;
  restablecer: () => void;
  puedeAumentar: boolean;
  puedeDisminuir: boolean;
  /** Tamaño en px listo para `style`, a partir del base de la pantalla. */
  px: (base: number) => number;
}

export const useTamanoDeLetra = (pantalla: string): TamanoDeLetra => {
  const [factor, setFactor] = React.useState<number>(() => leer(pantalla));
  const fijar = (f: number) => {
    setFactor(f);
    try {
      localStorage.setItem(CLAVE(pantalla), String(f));
    } catch {
      /* sin almacenamiento, el tamaño dura lo que dure la pestaña */
    }
  };
  const i = PASOS.indexOf(factor as (typeof PASOS)[number]);
  return {
    factor,
    aumentar: () => fijar(PASOS[Math.min(PASOS.length - 1, i + 1)]),
    disminuir: () => fijar(PASOS[Math.max(0, i - 1)]),
    restablecer: () => fijar(1),
    puedeAumentar: i < PASOS.length - 1,
    puedeDisminuir: i > 0,
    px: (base) => Math.round(base * factor * 10) / 10
  };
};

/** El control: A− · 100 % · A+. Tocar el porcentaje vuelve al tamaño normal. */
export const ControlDeLetra: React.FC<{ letra: TamanoDeLetra; className?: string }> = ({ letra, className = '' }) => (
  <span className={`inline-flex items-center rounded-control border border-line-200 bg-surface ${className}`} title="Tamaño de letra en pantalla. No cambia el documento exportado.">
    <button type="button" onClick={letra.disminuir} disabled={!letra.puedeDisminuir} className="flex h-[26px] w-[26px] items-center justify-center text-ink-700 hover:bg-canvas disabled:opacity-40" aria-label="Letra más pequeña">
      <Minus className="h-3 w-3" />
    </button>
    <button type="button" onClick={letra.restablecer} className="min-w-[44px] px-1 font-mono text-[11px] tabular-nums text-ink-700 hover:bg-canvas" title="Volver al tamaño normal">
      A {Math.round(letra.factor * 100)}%
    </button>
    <button type="button" onClick={letra.aumentar} disabled={!letra.puedeAumentar} className="flex h-[26px] w-[26px] items-center justify-center text-ink-700 hover:bg-canvas disabled:opacity-40" aria-label="Letra más grande">
      <Plus className="h-3 w-3" />
    </button>
  </span>
);
