import React from 'react';
import { Lock } from 'lucide-react';
import { usePlan } from '../PlanContext';
import type { Modulo } from '../types';

/**
 * Covers a whole module while the plan is expired, or when the firm cannot use it.
 *
 * WHY COVER AND NOT UNMOUNT. The module stays rendered underneath, dimmed and
 * inert, so the lawyer still sees what the screen IS — the workshop, the
 * catalogue, the calculators — and understands that it is waiting for a
 * payment, not gone. Replacing it with an empty panel would read as a missing
 * feature, which is the one thing a firm deciding whether to renew should not
 * conclude.
 *
 * WHY `pointer-events-none` PLUS `inert`. The pointer rule stops clicks; `inert`
 * also takes the covered controls out of the tab order and out of the
 * accessibility tree, so a keyboard user cannot reach a «Generar» the mouse
 * cannot. The server refuses the write anyway (402); this only spares the trip.
 *
 * Which modules get covered is decided where they are mounted (`App.tsx`), not
 * here: lists of existing work — drafts, reviews, hearings, interviews — stay
 * open for reading and exporting and only lose their creation buttons.
 *
 * LA CARA DEL AVISO ES DERIVADA: ningún artboard dibuja un módulo cubierto.
 * Toma la anatomía de las confirmaciones de `public/handoff/app-dialogos-y-estados.html`
 * —panel de 20 px, título de 18, texto de 15 y botón de 44— para que se lea
 * como parte de la misma aplicación y no como un error del navegador.
 */
interface ModuloBloqueadoProps {
  /** One sentence on what the lawyer can still do instead, in this module's terms. */
  quePuede: string;
  /**
   * The server-side module behind this screen. When given, the cover also
   * closes a module the firm cannot use — not in the plan, or switched off for
   * this firm by the operator — should the view be reached anyway (a stale
   * tab, a deep link). The sidebar already hides it; this is the honest wall
   * behind the hidden door, with the right remedy on it.
   */
  modulo?: Modulo;
  children: React.ReactNode;
}

type Cierre = 'VENCIDO' | 'DESACTIVADO' | 'NO_EN_PLAN' | null;

export const ModuloBloqueado: React.FC<ModuloBloqueadoProps> = ({ quePuede, modulo, children }) => {
  const { plan, soloLectura, abrirPlan, puedePagar } = usePlan();

  const cierre: Cierre = soloLectura
    ? 'VENCIDO'
    : modulo && plan && !plan.modulosPermitidos.includes(modulo)
      ? plan.modulosDesactivados.includes(modulo)
        ? 'DESACTIVADO'
        : 'NO_EN_PLAN'
      : null;

  if (!cierre) return <>{children}</>;

  /*
   * Three closures, three remedies. A module the OPERATOR switched off is not
   * reopened by any payment, so that wall must not offer «Renovar plan»: it
   * says Soporte and nothing else, or the partner buys Premium for nothing.
   */
  const titulo =
    cierre === 'VENCIDO'
      ? 'Este módulo requiere un plan vigente'
      : cierre === 'DESACTIVADO'
        ? 'Este módulo no está habilitado para su firma'
        : 'Este módulo no está incluido en su plan';
  const texto =
    cierre === 'VENCIDO'
      ? quePuede
      : cierre === 'DESACTIVADO'
        ? 'Escríbanos por Soporte para activarlo.'
        : 'Para usarlo, pase la firma a un plan que lo incluya desde «Plan de la firma».';

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div className="pointer-events-none flex min-h-0 min-w-0 flex-1 select-none opacity-60" aria-hidden="true" inert>
        {children}
      </div>
      <div className="cara-nueva cn-plan-cierre-velo absolute inset-0 z-20 flex items-center justify-center p-4">
        <div
          role="alertdialog"
          aria-labelledby="modulo-bloqueado-titulo"
          /* Radio de 20 px (14 sep 2026): es un diálogo de alerta y va con el radio común de los diálogos. */
          className="cn-plan-cierre flex w-full max-w-sm flex-col items-center rounded-[20px]"
        >
          <span className="cn-plan-cierre-icono">
            <Lock aria-hidden="true" />
          </span>
          <h2 id="modulo-bloqueado-titulo" className="cn-plan-cierre-titulo">
            {titulo}
          </h2>
          <p className="cn-plan-cierre-texto">{texto}</p>
          {cierre !== 'DESACTIVADO' && (
            <button type="button" onClick={abrirPlan} className="cn-plan-boton cn-plan-boton--primario">
              {cierre === 'VENCIDO' ? (puedePagar ? 'Renovar plan' : 'Ver plan') : 'Ver planes'}
            </button>
          )}
          {cierre === 'VENCIDO' && !puedePagar && (
            <p className="cn-plan-cierre-nota">Solo un administrador de su firma puede renovarlo.</p>
          )}
        </div>
      </div>
    </div>
  );
};
