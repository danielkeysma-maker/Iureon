import { httpClient } from '../../config/httpClient';

/**
 * The operator console's client.
 *
 * Every call is answered only for a session whose token carries SUPER_ADMIN,
 * and the server checks that — this file cannot grant anything. It is the
 * screen for a power that already exists, not the power itself.
 */

export interface FirmSummary {
  id: string;
  name: string;
  nit: string;
  planTier: string;
  status: string;
  creditsBalance: number;
  createdAt: string;
  /** Volume, never contents: how many, never what they say. */
  users: number;
  transcriptions: number;
}

export const adminApi = {
  listFirms: () =>
    httpClient.get<{ firms: FirmSummary[] }>('/api/admin/firms').then((r) => r.firms),

  createFirm: (input: {
    firmName: string;
    nit: string;
    adminEmail: string;
    adminPassword: string;
    initialCredits?: number;
  }) => httpClient.post<{ firm: FirmSummary }>('/api/admin/firms', { body: input }),

  addCredits: (firmId: string, amount: number) =>
    httpClient.post<{ creditsBalance: number }>(`/api/admin/firms/${firmId}/credits`, {
      body: { amount }
    }),

  updateFirm: (firmId: string, changes: { planTier?: string; status?: string; name?: string }) =>
    httpClient.patch<{ success: boolean }>(`/api/admin/firms/${firmId}`, { body: changes }),

  addUser: (firmId: string, input: { email: string; password: string; role: 'FIRM_ADMIN' | 'LAWYER' }) =>
    httpClient.post<{ user: { id: string; email: string } }>(`/api/admin/firms/${firmId}/users`, {
      body: input
    })
};
