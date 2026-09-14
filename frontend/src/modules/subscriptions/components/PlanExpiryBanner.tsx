import React from 'react';
import { CalendarClock } from 'lucide-react';
import { avisoDelPlan } from '../planEnPantalla';
import type { PlanDeFirma } from '../types';

/**
 * «Su plan vence el …», across the whole application, for the partners.
 *
 * WHO SEES IT. Only FIRM_ADMIN and SUPER_ADMIN: they are the ones who can pay,
 * and telling a lawyer who cannot act on it produces a question to the partner
 * instead of a payment. Seven days before expiry.
 *
 * WHY IT CANNOT BE DISMISSED. Same reasoning as the support-access band: a
 * notice that can be closed is closed, and a firm that loses service on a
 * Monday because a banner was dismissed on Friday is the failure this exists
 * to prevent. It pushes the content down instead of floating over it.
 *
 * LA FRASE ES LA MISMA DE «PLAN Y SALDO» (`avisoDelPlan`), y no por economía.
 * Esta franja decía que la prueba gratuita, al terminar, «pasa a solo
 * lectura»: era falso desde el 14 de septiembre de 2026 —la prueba que termina
 * sin pagar pierde todo el acceso— y nadie lo vio porque la frase vivía
 * escrita aquí aparte. Una sola fuente, con su check, no se desincroniza.
 *
 * CARA DERIVADA: la franja de ámbar de los avisos que no se cierran, con la
 * escala de la cara nueva (15 px, botón de 44).
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
   * would stack two bars saying the same thing to the partner.
   */
  if (plan.estado !== 'POR_VENCER') return null;
  const aviso = avisoDelPlan(plan, fechaLarga);
  if (!aviso) return null;

  return (
    <div role="status" className="cara-nueva cn-plan-franja">
      <CalendarClock className="cn-plan-franja-icono" aria-hidden="true" />
      <p className="cn-plan-franja-texto">
        <b>{aviso.titulo}.</b> {aviso.texto}
      </p>
      <button type="button" onClick={onAbrirPlan} className="cn-plan-franja-boton">
        Ver el plan
      </button>
    </div>
  );
};
