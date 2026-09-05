import React from 'react';
import { Lock } from 'lucide-react';
import { usePlan } from '../PlanContext';

/**
 * «Plan vencido: solo lectura», across the whole application, for EVERY role.
 *
 * WHY EVERYONE SEES IT. `PlanExpiryBanner` warns the partners before expiry,
 * because they are the ones who pay. Once the plan has expired the situation
 * changes for the lawyer too: their «Guardar» answers 402 and their «Subir
 * audio» is gone, and a screen that behaves like that without saying why reads
 * as broken. So the bar names the cause to everyone, and the button adapts —
 * a partner renews, a lawyer is told whom to ask.
 *
 * WHY IT CANNOT BE DISMISSED. Same reasoning as the support-access band: a
 * closed notice is forgotten, and a lawyer who spends an hour correcting a
 * transcript that will not save is the failure this prevents. It pushes the
 * content down instead of floating over it.
 */
const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export const PlanVencidoBar: React.FC = () => {
  const { plan, soloLectura, abrirPlan, puedePagar } = usePlan();
  if (!soloLectura || !plan) return null;

  const fecha = plan.validUntil ? ` el ${fechaLarga(plan.validUntil)}` : '';
  const texto = puedePagar
    ? `Plan vencido${fecha}. Solo lectura: puede leer y descargar lo que ya tiene. Renueve el plan para volver a trabajar.`
    : `Plan vencido${fecha}. Solo lectura: puede leer y descargar lo que ya tiene. Para volver a trabajar, pida a un administrador de su firma que lo renueve.`;

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-4 py-2 text-[12.5px] text-danger"
    >
      <Lock className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 text-justify leading-snug [text-wrap:pretty]">{texto}</p>
      <button
        type="button"
        onClick={abrirPlan}
        className="shrink-0 rounded-control border border-current px-2.5 py-1 text-[12px] font-semibold hover:bg-white/40"
      >
        {puedePagar ? 'Renovar plan' : 'Ver plan'}
      </button>
    </div>
  );
};
