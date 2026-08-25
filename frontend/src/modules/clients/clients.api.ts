import { httpClient } from '../../config/httpClient';

/**
 * Client files and the interviews attached to them.
 *
 * The firm is never sent: the session token carries it. A client's cédula and
 * the account of what they told their lawyer are the most private material this
 * product holds, so the tenant on the request is not the browser's to name.
 */

export interface Client {
  id: string;
  fullName: string;
  documentId: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  interviews: number;
}

export interface InterviewSuggestion {
  /** The client's own words that produced this, so it can be judged. */
  fromClient: string;
  providencia: string | null;
  corporacion: string | null;
  ponente: string | null;
  sourceUrl: string | null;
  excerpt: string;
  similarity: number;
}

export const clientsApi = {
  list: () => httpClient.get<{ clients: Client[] }>('/api/clients').then((r) => r.clients),

  create: (input: {
    fullName: string;
    documentId: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => httpClient.post<{ client: Client }>('/api/clients', { body: input }).then((r) => r.client),

  update: (id: string, changes: { fullName?: string; email?: string; phone?: string; notes?: string }) =>
    httpClient.patch<{ client: Client }>(`/api/clients/${id}`, { body: changes }).then((r) => r.client),

  remove: (id: string) => httpClient.delete<{ success: boolean }>(`/api/clients/${id}`),

  /** Attaches an interview to a client. `null` detaches it. */
  linkInterview: (transcriptionId: string, clientId: string | null) =>
    httpClient.patch<{ success: boolean }>('/api/clients/link', {
      body: { transcriptionId, clientId }
    }),

  insights: (transcriptionId: string) =>
    httpClient.get<{ suggestions: InterviewSuggestion[]; reason?: string }>(
      `/api/clients/interviews/${transcriptionId}/insights`
    )
};
