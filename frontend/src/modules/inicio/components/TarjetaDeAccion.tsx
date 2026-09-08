import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * One of the three big doors at the top of Inicio.
 *
 * A module the plan does not include is shown DISABLED, not hidden: the
 * lawyer should know the capability exists and that it is the plan, not the
 * application, that keeps it closed. The sidebar hides those modules because
 * a door onto a 403 is worse than none; here the door is drawn closed and
 * says why, which is a different thing.
 */
interface TarjetaDeAccionProps {
  icono: LucideIcon;
  titulo: string;
  queHace: string;
  onClick: () => void;
  /** Present when the firm cannot use the module. */
  noIncluida?: boolean;
  /**
   * Why: «No incluido en su plan» (default) or «No disponible para su firma»
   * when the operator switched it off. Two different remedies — one is a
   * bigger plan, the other is Soporte — so the chip must not merge them.
   */
  motivoNoIncluida?: string;
  visita?: string;
}

export const TarjetaDeAccion: React.FC<TarjetaDeAccionProps> = ({
  icono: Icono,
  titulo,
  queHace,
  onClick,
  noIncluida = false,
  motivoNoIncluida = 'No incluido en su plan',
  visita
}) => (
  <button
    type="button"
    onClick={noIncluida ? undefined : onClick}
    aria-disabled={noIncluida || undefined}
    data-visita={visita}
    className={`card group flex min-h-[112px] flex-col items-start gap-2 p-4 text-left transition-colors ${
      noIncluida
        ? 'cursor-not-allowed opacity-70'
        : 'hover:border-[rgb(var(--brand-line))] hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40'
    }`}
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-50 text-brand-700">
      <Icono className="h-[18px] w-[18px]" strokeWidth={2} />
    </span>
    <span className="flex w-full items-center gap-2">
      <span className="text-subtitle text-ink-900">{titulo}</span>
      {!noIncluida && (
        <ArrowRight className="ml-auto h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700" />
      )}
    </span>
    <span className="text-ui leading-[1.5] text-ink-500">{queHace}</span>
    {noIncluida && <span className="chip-neutral mt-1">{motivoNoIncluida}</span>}
  </button>
);
