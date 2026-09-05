import React, { useEffect, useRef, useState } from 'react';
import { IureonMark } from '../tenant/components/IureonMark';

/**
 * Pull-to-refresh, for the phone and the installed app.
 *
 * A browser tab has a reload button; the installed app has none, and the
 * phone's own gesture is disabled the moment a page is a standalone app or
 * scrolls inside its own containers, which this one does. So the gesture is
 * rebuilt here, and only here: touch devices (`pointer: coarse`), a drag that
 * starts with nothing scrolled, no dialog open.
 *
 * It must never steal a scroll. Before following a finger it walks up from the
 * touched element and bails if any scrollable ancestor is not at its top —
 * the drag then belongs to that list. Listeners are passive until the drag is
 * actually being followed; only then is `touchmove` cancelled, so the page
 * does not rubber-band underneath the indicator.
 *
 * Reloading is safe because the module and the screen inside it come back
 * from sessionStorage (`pantallaRecordada.ts`). Threshold 72px; below it the
 * indicator snaps back and nothing happens. With reduced motion there is no
 * spin, only the mark and the words.
 */

const UMBRAL = 72;
const TOPE = 110;

const ancestroDesplazado = (inicio: Element | null): boolean => {
  let el: Element | null = inicio;
  while (el && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      const { overflowY } = getComputedStyle(el);
      const desplaza = overflowY === 'auto' || overflowY === 'scroll';
      if (desplaza && el.scrollTop > 0) return true;
    }
    el = el.parentElement;
  }
  return window.scrollY > 0;
};

const hayDialogoAbierto = (): boolean =>
  document.querySelector('[role="dialog"], dialog[open]') !== null;

export const TirarParaActualizar: React.FC = () => {
  const [tactil, setTactil] = useState(false);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [actualizando, setActualizando] = useState(false);
  const [sinMovimiento, setSinMovimiento] = useState(false);
  /* The active gesture lives in refs: touch handlers fire far too often for state. */
  const gesto = useRef<{ y0: number; siguiendo: boolean } | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)');
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sincronizar = () => {
      setTactil(coarse.matches);
      setSinMovimiento(reducido.matches);
    };
    sincronizar();
    coarse.addEventListener('change', sincronizar);
    reducido.addEventListener('change', sincronizar);
    return () => {
      coarse.removeEventListener('change', sincronizar);
      reducido.removeEventListener('change', sincronizar);
    };
  }, []);

  useEffect(() => {
    if (!tactil) return;

    const alEmpezar = (e: TouchEvent) => {
      if (actualizando || e.touches.length !== 1) return;
      if (hayDialogoAbierto()) return;
      if (ancestroDesplazado(e.target as Element | null)) return;
      gesto.current = { y0: e.touches[0].clientY, siguiendo: false };
    };

    const alMover = (e: TouchEvent) => {
      const g = gesto.current;
      if (!g) return;
      const dy = e.touches[0].clientY - g.y0;
      if (!g.siguiendo) {
        /* A drag upwards, or a sideways swipe, is not this gesture. */
        if (dy < 8) {
          if (dy < 0) gesto.current = null;
          return;
        }
        g.siguiendo = true;
      }
      if (e.cancelable) e.preventDefault();
      /* Resistance: the indicator moves less than the finger the further it goes. */
      setDesplazamiento(Math.min(TOPE, dy * 0.55));
    };

    const alSoltar = () => {
      const g = gesto.current;
      gesto.current = null;
      if (!g?.siguiendo) return;
      setDesplazamiento((actual) => {
        if (actual >= UMBRAL) {
          setActualizando(true);
          window.setTimeout(() => window.location.reload(), 350);
          return UMBRAL;
        }
        return 0;
      });
    };

    /*
     * `touchmove` cannot be passive: cancelling it is how the page is kept
     * still under the indicator. The other two never cancel anything.
     */
    document.addEventListener('touchstart', alEmpezar, { passive: true });
    document.addEventListener('touchmove', alMover, { passive: false });
    document.addEventListener('touchend', alSoltar, { passive: true });
    document.addEventListener('touchcancel', alSoltar, { passive: true });
    return () => {
      document.removeEventListener('touchstart', alEmpezar);
      document.removeEventListener('touchmove', alMover);
      document.removeEventListener('touchend', alSoltar);
      document.removeEventListener('touchcancel', alSoltar);
    };
  }, [tactil, actualizando]);

  if (!tactil) return null;
  const visible = desplazamiento > 0 || actualizando;
  if (!visible) return null;

  const progreso = Math.min(1, desplazamiento / UMBRAL);
  const listo = progreso >= 1;
  const gira = !sinMovimiento && (actualizando || listo);

  return (
    <>
    <style>{`
      @keyframes iureon-girar { to { transform: rotate(360deg); } }
      @keyframes iureon-latir { 50% { transform: scale(1.12); } }
    `}</style>
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center lg:hidden"
      style={{
        transform: `translateY(${desplazamiento - 56}px)`,
        transition: gesto.current?.siguiendo ? 'none' : 'transform 220ms ease-out',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-line-200 bg-surface px-3 py-1.5 shadow-md">
        <span
          className="flex h-6 w-6 items-center justify-center"
          style={{
            transform: gira || sinMovimiento ? undefined : `rotate(${progreso * 180}deg)`,
            animation: gira
              ? 'iureon-girar 900ms linear infinite'
              : !sinMovimiento && desplazamiento > 0
              ? 'iureon-latir 1200ms ease-in-out infinite'
              : undefined
          }}
        >
          <IureonMark size={22} />
        </span>
        <span className="text-[12px] font-medium text-ink-700">
          {actualizando ? 'Actualizando…' : listo ? 'Suelte para actualizar' : 'Tire para actualizar'}
        </span>
      </div>
    </div>
    </>
  );
};
