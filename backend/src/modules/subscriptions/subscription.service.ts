export interface FirmProfile {
  firmId: string;
  firmName: string;
  nit: string;
  planTier: 'STARTER' | 'PRO_FIRM' | 'ENTERPRISE';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  activeUsersCount: number;
  maxUsersAllowed: number;
  renewalDate: string;
}

export interface FirmUser {
  id: string;
  firmId: string;
  name: string;
  email: string;
  role: 'SOCIO_ADMIN' | 'ASOCIADO' | 'PARALEGAL';
  status: 'active' | 'invited';
  createdAt: string;
}

export class SubscriptionService {
  /**
   * Obtiene el perfil completo de la firma cliente y el estado de su suscripción SaaS
   */
  public async getFirmProfile(firmId: string): Promise<FirmProfile> {
    return {
      firmId,
      firmName: 'Torres & Asociados S.A.S.',
      nit: '900.892.102-4',
      planTier: 'PRO_FIRM',
      subscriptionStatus: 'active',
      monthlyTokensUsed: 1420500,
      monthlyTokensLimit: 5000000,
      activeUsersCount: 4,
      maxUsersAllowed: 10,
      renewalDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  /**
   * Lista los abogados y colaboradores registrados en la firma activa
   */
  public async getFirmUsers(firmId: string): Promise<FirmUser[]> {
    return [
      {
        id: 'usr-001',
        firmId,
        name: 'Dr. Julián Delgado',
        email: 'jdelgado@torresasociados.co',
        role: 'SOCIO_ADMIN',
        status: 'active',
        createdAt: '2026-01-15'
      },
      {
        id: 'usr-002',
        firmId,
        name: 'Dra. María Camila Osorio',
        email: 'mcosorio@torresasociados.co',
        role: 'ASOCIADO',
        status: 'active',
        createdAt: '2026-02-01'
      },
      {
        id: 'usr-003',
        firmId,
        name: 'Dr. Andrés Restrepo',
        email: 'arestrepo@torresasociados.co',
        role: 'ASOCIADO',
        status: 'active',
        createdAt: '2026-03-10'
      },
      {
        id: 'usr-004',
        firmId,
        name: 'Laura Gómez',
        email: 'lgomez@torresasociados.co',
        role: 'PARALEGAL',
        status: 'active',
        createdAt: '2026-04-05'
      }
    ];
  }

  /**
   * Invita a un nuevo abogado al espacio de trabajo de la firma
   */
  public async inviteUserToFirm(firmId: string, name: string, email: string, role: 'SOCIO_ADMIN' | 'ASOCIADO' | 'PARALEGAL'): Promise<FirmUser> {
    return {
      id: `usr-${Date.now().toString().slice(-4)}`,
      firmId,
      name,
      email,
      role,
      status: 'invited',
      createdAt: new Date().toISOString().split('T')[0]
    };
  }
}
