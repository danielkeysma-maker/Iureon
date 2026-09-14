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
 * SOLO LECTURA SIN LÍMITE DE DÍAS, y se dice. Es la gracia de la firma que pagó
 * alguna vez: no se le borra nada ni se le cierra la puerta con el tiempo. La
 * prueba que terminó sin pagar no llega a esta franja: la cáscara le muestra su
 * propia pantalla de bloqueo.
 *
 * WHY IT CANNOT BE DISMISSED. Same reasoning as the support-access band: a
 * closed notice is forgotten, and a lawyer who spends an hour correcting a
 * transcript that will not save is the failure this prevents.
 *
 * CARA DERIVADA: la misma franja de `PlanExpiryBanner`, sobre el fondo de peligro.
 */
const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

export const PlanVencidoBar: React.FC = () => {
  const { plan, soloLectura, abrirPlan, puedePagar } = usePlan();
  if (!soloLectura || !plan) return null;

  const fecha = plan.validUntil ? ` el ${fechaLarga(plan.validUntil)}` : '';
  const texto = puedePagar
    ? 'Solo lectura, sin límite de días: puede leer y descargar lo que ya tiene. Renueve el plan para volver a trabajar.'
    : 'Solo lectura, sin límite de días: puede leer y descargar lo que ya tiene. Para volver a trabajar, pida a un administrador de su firma que lo renueve.';

  return (
    <div role="status" className="cara-nueva cn-plan-franja cn-plan-franja--peligro">
      <Lock className="cn-plan-franja-icono" aria-hidden="true" />
      <p className="cn-plan-franja-texto">
        <b>Plan vencido{fecha}.</b> {texto}
      </p>
      <button type="button" onClick={abrirPlan} className="cn-plan-franja-boton">
        {puedePagar ? 'Renovar plan' : 'Ver plan'}
      </button>
    </div>
  );
};
