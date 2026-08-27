/** Top-level sections of the workspace, as listed in the sidebar. */
export type MainView =
  | 'workspace'
  | 'audiencias'
  | 'entrevistas'
  | 'search'
  | 'catalogo'
  | 'tools'
  | 'audit'
  | 'privacidad'
  | 'orientacion';

/** A client law firm: the tenant every request and record is scoped to. */
export interface LawFirmTenant {
  id: string;
  name: string;
  nit: string;
  creditsBalance: number; // Saldo disponible de recargas en COP ($)
  status: 'active' | 'trial';
}

export type FirmUserRole = 'SUPER_ADMIN' | 'FIRM_ADMIN' | 'LAWYER' | 'INDEPENDENT_LAWYER';

export interface FirmUser {
  id: string;
  firmId: string;
  fullName: string;
  email: string;
  role: FirmUserRole;
  status: 'active' | 'pending';
  createdAt: string;
}

/** Tenant sentinels for users who belong to no client firm. */
export const NO_FIRM = {
  SUPER_ADMIN: 'N/A',
  INDEPENDENT: 'INDEPENDENT'
} as const;

/** Only firm-bound roles require a client firm to exist before creation. */
export const roleRequiresFirm = (role: FirmUserRole): boolean =>
  role === 'LAWYER' || role === 'FIRM_ADMIN';

/** Resolves which tenant a user belongs to, given their role and selection. */
export const resolveFirmId = (role: FirmUserRole, selectedFirmId: string): string => {
  if (role === 'SUPER_ADMIN') return NO_FIRM.SUPER_ADMIN;
  if (role === 'INDEPENDENT_LAWYER') return NO_FIRM.INDEPENDENT;
  return selectedFirmId;
};
