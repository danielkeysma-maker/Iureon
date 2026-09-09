import React, { createContext, useContext, useMemo } from 'react';
import type { LawFirmTenant } from './types';

interface TenantContextValue {
  activeFirm: LawFirmTenant;
  currentUserEmail: string;
  /**
   * El nombre que la persona guardó, o '' si todavía no puso ninguno.
   *
   * Vacío NO se rellena con nada derivado del correo: quien lo necesite para
   * saludar decide qué hacer con el hueco, y la barra prefiere no escribir un
   * nombre que nadie eligió.
   */
  currentUserName: string;
  /** Lo llama Ajustes tras guardar, para que la barra y el saludo cambien ya. */
  setCurrentUserName: (nombre: string) => void;
  /**
   * The firm this session belongs to.
   *
   * It no longer travels to the server — the token carries it — so this is for
   * the screen alone: labels, per-firm cache keys, and knowing whether there is
   * a tenant at all. It comes from the signed session, so it cannot be edited
   * into someone else's.
   */
  firmId: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  activeFirm: LawFirmTenant;
  currentUserEmail: string;
  currentUserName: string;
  setCurrentUserName: (nombre: string) => void;
  children: React.ReactNode;
}

/**
 * Makes the active tenant available to any component that calls the backend,
 * so feature modules no longer have to receive it through prop chains they
 * otherwise have no use for.
 */
export const TenantProvider: React.FC<TenantProviderProps> = ({
  activeFirm,
  currentUserEmail,
  currentUserName,
  setCurrentUserName,
  children
}) => {
  const value = useMemo(
    () => ({ activeFirm, currentUserEmail, currentUserName, setCurrentUserName, firmId: activeFirm.id }),
    [activeFirm, currentUserEmail, currentUserName, setCurrentUserName]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider.');
  }

  return context;
};
