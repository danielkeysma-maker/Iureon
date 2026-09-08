import React from 'react';
import { X } from 'lucide-react';
import type { Direccion, VisitaGuiada as EstadoDeVisita } from './useVisitaGuiada';

/**
 * The overlay of the guided tour: a dimmed screen with one lit element and a
 * card beside it. No library — a spotlight is a box whose shadow covers the
 * rest of the screen, and everything else is measuring.
 *
 * ─── MEASURING, NOT ASSUMING ────────────────────────────────────────────────
 *
 * The stop names its element by `data-visita`; this component waits for it to
 * appear (the module was just opened and may still be mounting), scrolls it
 * into view, then measures. Desktop and phone layouts are both in the DOM and
 * hidden by CSS, so «the element» is the first candidate with a non-empty box.
 * A stop with no visible candidate after a short wait is skipped in the
 * direction the reader was moving — never shown pointing at the void.
 *
 * ─── THE CARD ───────────────────────────────────────────────────────────────
 *
 * On a wide screen it sits below the element when there is room, above it
 * otherwise, and to its right when neither fits. On the phone it docks at the
 * bottom, above the safe area, whatever the element: a card that chased the
 * element around a 375px screen would cover it.
 *
 * Keyboard: Esc leaves, ← → move. The «Siguiente» button takes focus on every
 * stop so the card is reachable without a mouse.
 */

interface Caja {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGEN = 6;
const ANCHO_TARJETA = 340;
const ALTO_ESTIMADO = 230;
const INTENTOS = 90; // ≈1.5 s at 60 fps: enough for a module to mount, short enough to feel like a skip.

const esVisible = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

const buscarObjetivo = (objetivos: readonly string[]): HTMLElement | null => {
  for (const id of objetivos) {
    const candidatos = document.querySelectorAll<HTMLElement>(`[data-visita="${id}"]`);
    for (const c of candidatos) if (esVisible(c)) return c;
  }
  return null;
};

const medir = (el: HTMLElement): Caja => {
  const r = el.getBoundingClientRect();
  return {
    top: Math.max(0, r.top - MARGEN),
    left: Math.max(0, r.left - MARGEN),
    width: Math.min(window.innerWidth, r.width + MARGEN * 2),
    height: Math.min(window.innerHeight, r.height + MARGEN * 2)
  };
};

const useEsEscritorio = (): boolean => {
  const consulta = React.useMemo(() => window.matchMedia('(min-width: 1024px)'), []);
  const [ancho, setAncho] = React.useState(consulta.matches);
  React.useEffect(() => {
    const alCambiar = (e: MediaQueryListEvent) => setAncho(e.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, [consulta]);
  return ancho;
};

/** Where the card goes on a wide screen, given the lit box. */
const posicionDeTarjeta = (caja: Caja): React.CSSProperties => {
  const alto = window.innerHeight;
  const anchoVentana = window.innerWidth;
  const left = Math.min(Math.max(12, caja.left), anchoVentana - ANCHO_TARJETA - 12);

  if (caja.top + caja.height + 16 + ALTO_ESTIMADO < alto) {
    return { top: caja.top + caja.height + 16, left };
  }
  if (caja.top - 16 - ALTO_ESTIMADO > 0) {
    return { top: caja.top - 16 - ALTO_ESTIMADO, left };
  }
  const derecha = caja.left + caja.width + 16;
  const leftLateral =
    derecha + ANCHO_TARJETA < anchoVentana ? derecha : Math.max(12, caja.left - ANCHO_TARJETA - 16);
  return { top: Math.min(Math.max(12, caja.top), alto - ALTO_ESTIMADO - 12), left: leftLateral };
};

export const VisitaGuiada: React.FC<{ visita: EstadoDeVisita }> = ({ visita }) => {
  const { paso, numero, total, siguiente, anterior, saltar, salir } = visita;
  const [caja, setCaja] = React.useState<Caja | null>(null);
  const escritorio = useEsEscritorio();
  const direccion = React.useRef<Direccion>(1);
  const botonSiguiente = React.useRef<HTMLButtonElement>(null);
  const objetivo = React.useRef<HTMLElement | null>(null);

  /* Find the element, scroll it into view, measure; or skip. */
  React.useEffect(() => {
    if (!paso) {
      setCaja(null);
      objetivo.current = null;
      return;
    }
    let intentos = 0;
    let cuadro = 0;
    let cancelado = false;

    const intentar = () => {
      if (cancelado) return;
      const el = buscarObjetivo(paso.objetivos);
      if (el) {
        objetivo.current = el;
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        // One more frame so the scroll has settled before measuring.
        cuadro = window.requestAnimationFrame(() => {
          if (!cancelado) setCaja(medir(el));
        });
        return;
      }
      intentos += 1;
      if (intentos >= INTENTOS) {
        saltar(direccion.current);
        return;
      }
      cuadro = window.requestAnimationFrame(intentar);
    };
    setCaja(null);
    cuadro = window.requestAnimationFrame(intentar);

    return () => {
      cancelado = true;
      window.cancelAnimationFrame(cuadro);
    };
    // `saltar` changes identity with the index; the effect must run per stop only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  /* Re-measure on resize and on any scroll: the lit box must follow the element. */
  React.useEffect(() => {
    if (!paso) return;
    const remedir = () => {
      const el = objetivo.current;
      if (el && esVisible(el)) setCaja(medir(el));
    };
    window.addEventListener('resize', remedir);
    document.addEventListener('scroll', remedir, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', remedir);
      document.removeEventListener('scroll', remedir, { capture: true });
    };
  }, [paso]);

  const irSiguiente = React.useCallback(() => {
    direccion.current = 1;
    siguiente();
  }, [siguiente]);
  const irAnterior = React.useCallback(() => {
    direccion.current = -1;
    anterior();
  }, [anterior]);

  React.useEffect(() => {
    if (!paso) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        salir();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        irSiguiente();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        irAnterior();
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [paso, salir, irSiguiente, irAnterior]);

  React.useEffect(() => {
    if (caja) botonSiguiente.current?.focus();
  }, [caja]);

  if (!paso || !caja) return null;

  const ultimo = numero === total;
  const estiloTarjeta: React.CSSProperties = escritorio
    ? { position: 'fixed', width: ANCHO_TARJETA, ...posicionDeTarjeta(caja) }
    : {
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(12px + env(safe-area-inset-bottom))'
      };

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {/* The spotlight: its shadow is the dimming. It takes no clicks so the card below is the only control. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-[8px] border-2 border-brand-700 transition-[top,left,width,height] duration-200"
        style={{
          top: caja.top,
          left: caja.left,
          width: caja.width,
          height: caja.height,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)'
        }}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="visita-titulo"
        className="surface-raised flex flex-col gap-2.5 p-4"
        style={estiloTarjeta}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Visita guiada · {numero} de {total}
            </p>
            <h2 id="visita-titulo" className="mt-0.5 text-subtitle text-ink-900">
              {paso.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={salir}
            aria-label="Salir de la visita"
            title="Salir (Esc)"
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-500 hover:bg-canvas hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-ui leading-[1.55] text-ink-700 [text-wrap:pretty]">{paso.texto}</p>

        <div className="mt-1 flex items-center gap-2">
          <button type="button" onClick={salir} className="btn-ghost btn-sm">
            Salir
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={irAnterior}
              disabled={numero <= 1}
              className="btn-neutral btn-sm"
            >
              Anterior
            </button>
            <button
              ref={botonSiguiente}
              type="button"
              onClick={irSiguiente}
              className="btn-primary btn-sm"
            >
              {ultimo ? 'Terminar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
