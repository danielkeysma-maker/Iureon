import React, { createContext, useContext, useMemo } from 'react';
import type { PlanDeFirma } from './types';

/**
 * The firm's plan, readable from any screen without threading a prop.
 *
 * WHY A CONTEXT. Read-only mode touches a dozen leaf components — the «Redactar
 * escrito» button on the drafts list, «Subir audio» on hearings, the recorder
 * on interviews — that sit three or four levels below `App`. Passing
 * `soloLectura` down through every intermediate props interface would change
 * files whose only interest in the plan is forwarding it. Here a leaf asks
 * `usePlanSoloLectura()` and the intermediates stay untouched.
 *
 * WHY THE DEFAULT IS "NOT READ-ONLY". `null` plan means the server did not
 * answer (or the migration is missing), and the screen must not lock a firm out
 * on its own guess: the backend refuses every write with 402 when the plan is
 * truly expired, so a screen that offers a button it should not costs one
 * visible error, whereas a screen that hides a button it should show costs a
 * firm its work with no explanation.
 */
interface PlanContextValue {
  plan: PlanDeFirma | null;
  /** True only when the server said VENCIDO. */
  soloLectura: boolean;
  /** Opens the plan dialog: from there a partner renews, a lawyer reads. */
  abrirPlan: () => void;
  /** Whether the current session can pay — decides «Renovar plan» vs «Ver plan». */
  puedePagar: boolean;
}

const PlanContext = createContext<PlanContextValue>({
  plan: null,
  soloLectura: false,
  abrirPlan: () => {},
  puedePagar: false
});

interface PlanProviderProps {
  plan: PlanDeFirma | null;
  puedePagar: boolean;
  abrirPlan: () => void;
  children: React.ReactNode;
}

export const PlanProvider: React.FC<PlanProviderProps> = ({ plan, puedePagar, abrirPlan, children }) => {
  const value = useMemo<PlanContextValue>(
    () => ({ plan, soloLectura: plan?.estado === 'VENCIDO', abrirPlan, puedePagar }),
    [plan, abrirPlan, puedePagar]
  );
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = (): PlanContextValue => useContext(PlanContext);

/** The single boolean most leaves need: hide or disable what creates work. */
export const usePlanSoloLectura = (): boolean => useContext(PlanContext).soloLectura;
