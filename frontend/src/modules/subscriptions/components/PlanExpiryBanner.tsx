import React from 'react';
import { CalendarClock } from 'lucide-react';
import type { PlanDeFirma } from '../types';

/**
 * «Su plan vence el …», across the whole application, for the partners.
 *
 * WHO SEES IT. Only FIRM_ADMIN and SUPER_ADMIN: they are the ones who can pay,
 * and telling a lawyer who cannot act on it produces a question to the partner
 * instead of a payment. Seven days before expiry and after it.
 *
 * WHY IT CANNOT BE DISMISSED. Same reasoning as the support-access band: a
 * notice that can be closed is closed, and a firm that goes read-only on a
 * Monday because a banner was dismissed on Friday is the failure this exists
 * to prevent. It pushes the content down instead of floating over it.
 *
 * Amber while there is still time (the same surface the product uses for
 * "unverified"), danger once expired.
 */
interface PlanExpiryBannerProps {
  plan: PlanDeFirma | null;
  puedeVer: boolean;
  onAbrirPlan: () => void;
}

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export const PlanExpiryBanner: React.FC<PlanExpiryBannerProps> = ({ plan, puedeVer, onAbrirPlan }) => {
  if (!puedeVer || !plan || !plan.validUntil) return null;
  /*
   * Once expired, `PlanVencidoBar` takes over for every role; painting both
   * would stack two red bars saying the same thing to the partner.
   */
  if (plan.estado !== 'POR_VENCER') return null;

  const dias = plan.diasRestantes ?? 0;

  const texto = `Su plan vence el ${fechaLarga(plan.validUntil)}${
    dias === 1 ? ' (mañana)' : dias > 1 ? ` (en ${dias} días)` : ''
  }. Pagar antes suma el periodo a la fecha vigente: no se pierde ningún día.`;

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-4 py-2 text-[12.5px] text-unverified"
    >
      <CalendarClock className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 text-justify leading-snug [text-wrap:pretty]">{texto}</p>
      <button
        type="button"
        onClick={onAbrirPlan}
        className="shrink-0 rounded-control border border-current px-2.5 py-1 text-[12px] font-semibold hover:bg-white/40"
      >
        Ver el plan
      </button>
    </div>
  );
};
