import React, { createContext, useContext, useMemo } from 'react';
import type { LawFirmTenant } from './types';

interface TenantContextValue {
  activeFirm: LawFirmTenant;
  currentUserEmail: string;
  /** Tenant id for the x-firm-id header. Empty until a firm is selected. */
  firmId: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  activeFirm: LawFirmTenant;
  currentUserEmail: string;
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
  children
}) => {
  const value = useMemo(
    () => ({ activeFirm, currentUserEmail, firmId: activeFirm.id }),
    [activeFirm, currentUserEmail]
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
