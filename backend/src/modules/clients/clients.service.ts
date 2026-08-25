import { supabase } from '../../config/supabase.config';

/**
 * The firm's clients, and the interviews recorded with them.
 *
 * WHY A CLIENT IS ITS OWN RECORD. An interview transcript answers what was
 * said; it does not answer who said it to whom, and a firm needs that to find
 * the conversation again months later when the case moves. The cédula is the
 * natural key because it is what identifies a person before the Colombian
 * State — unique PER FIRM and never globally, since two firms may serve the
 * same citizen and neither should learn of the other.
 *
 * WHY AN INTERVIEW IS NOT ITS OWN TABLE. It is a transcription of kind
 * ENTREVISTA with a client attached. A parallel table would have duplicated
 * segments, voices, roles and every correction made to them — and an interview
 * and a hearing are the same thing recorded in two different rooms. What
 * separates them is whose it is.
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
  /** How many interviews are on file. Volume, not contents. */
  interviews?: number;
}

interface ClientRow {
  id: string;
  full_name: string;
  document_id: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export class ClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'ClientError';
    this.code = code;
    this.status = status;
  }
}

const toClient = (row: ClientRow): Client => ({
  id: row.id,
  fullName: row.full_name,
  documentId: row.document_id,
  email: row.email,
  phone: row.phone,
  notes: row.notes,
  createdBy: row.created_by,
  createdAt: row.created_at
});

const requireClient = () => {
  if (!supabase) {
    throw new ClientError('DB_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

/**
 * Colombian identity documents are digits, sometimes written with dots.
 *
 * Stored without them so "1.102.811.692" and "1102811692" are the same person:
 * otherwise the uniqueness index would happily hold both, and a firm would end
 * up with two files for one client and the interview in the wrong one.
 */
const normalizeDocument = (value: string): string => value.replace(/[.\s-]/g, '').trim();

export const listClients = async (firmId: string): Promise<Client[]> => {
  const db = requireClient();

  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CLIENTS] No se pudieron listar:', error.message);
    throw new ClientError('LIST_FAILED', 'No se pudieron cargar los clientes.', 502);
  }

  const clients = ((data ?? []) as ClientRow[]).map(toClient);

  // One query for the whole firm rather than one per client: a firm with sixty
  // clients would otherwise make sixty round trips to render one list.
  const { data: transcritos } = await db
    .from('transcriptions')
    .select('client_id')
    .eq('firm_id', firmId)
    .not('client_id', 'is', null);

  const porCliente = new Map<string, number>();
  for (const row of (transcritos ?? []) as { client_id: string }[]) {
    porCliente.set(row.client_id, (porCliente.get(row.client_id) ?? 0) + 1);
  }

  return clients.map((client) => ({ ...client, interviews: porCliente.get(client.id) ?? 0 }));
};

/*
 * Named `registerClient` and not `createClient` on purpose: supabase-js exports
 * a `createClient` that builds a database connection, and the boundary check
 * greps for exactly that call outside config/. A name that trips a guard is a
 * name that will one day hide a real violation behind a known false alarm.
 */
export const registerClient = async (
  firmId: string,
  userEmail: string,
  input: { fullName: string; documentId: string; email?: string; phone?: string; notes?: string }
): Promise<Client> => {
  const db = requireClient();

  const fullName = input.fullName.trim();
  const documentId = normalizeDocument(input.documentId ?? '');

  if (!fullName || !documentId) {
    throw new ClientError('INVALID_CLIENT', 'Se requieren el nombre completo y el documento.');
  }

  const { data: existing } = await db
    .from('clients')
    .select('id, full_name')
    .eq('firm_id', firmId)
    .eq('document_id', documentId)
    .maybeSingle();

  if (existing) {
    // Named, because "ya existe" without saying who sends the lawyer hunting
    // through a list for a client they may have registered months ago.
    throw new ClientError(
      'CLIENT_EXISTS',
      `Ya tienes un cliente con ese documento: ${(existing as { full_name: string }).full_name}.`,
      409
    );
  }

  const { data, error } = await db
    .from('clients')
    .insert({
      firm_id: firmId,
      full_name: fullName,
      document_id: documentId,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: userEmail
    })
    .select()
    .single();

  if (error) {
    console.error('[CLIENTS] No se pudo crear:', error.message);
    throw new ClientError('CREATE_FAILED', 'No se pudo registrar el cliente.', 502);
  }

  return toClient(data as ClientRow);
};

export const updateClient = async (
  firmId: string,
  id: string,
  changes: { fullName?: string; email?: string; phone?: string; notes?: string }
): Promise<Client> => {
  const db = requireClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (changes.fullName?.trim()) patch.full_name = changes.fullName.trim();
  if (changes.email !== undefined) patch.email = changes.email.trim() || null;
  if (changes.phone !== undefined) patch.phone = changes.phone.trim() || null;
  if (changes.notes !== undefined) patch.notes = changes.notes.trim() || null;

  /*
   * The document is deliberately not editable.
   *
   * It is the key the firm finds this person by, and changing it silently
   * rewrites who the interviews on file belong to. A client registered under
   * the wrong cédula is a new client and a deletion, both of which are visible.
   */
  if (Object.keys(patch).length === 1) {
    throw new ClientError('NOTHING_TO_UPDATE', 'No hay nada que cambiar.');
  }

  const { data, error } = await db
    .from('clients')
    .update(patch)
    .eq('firm_id', firmId)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new ClientError('NOT_FOUND', 'No se encontró ese cliente.', 404);
  }

  return toClient(data as ClientRow);
};

/**
 * Removes a client's file.
 *
 * Their interviews survive, detached — see ON DELETE SET NULL in the migration.
 * Deleting the record of what was said because a contact card was deleted would
 * destroy the work, and the transcript screen has its own deletion for when
 * that is actually what somebody wants.
 */
export const deleteClient = async (firmId: string, id: string): Promise<boolean> => {
  const db = requireClient();

  const { data, error } = await db
    .from('clients')
    .delete()
    .eq('firm_id', firmId)
    .eq('id', id)
    .select('id');

  if (error) {
    console.error('[CLIENTS] No se pudo borrar:', error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
};

/**
 * Attaches an interview to a client, or detaches it with null.
 *
 * Both sides are checked against the caller's firm: a transcript id and a
 * client id are both guessable strings, and linking across tenants would be a
 * way to learn that somebody else's record exists.
 */
/**
 * The interview's segments, for computing suggestions over them.
 *
 * Here rather than in the controller because a controller that queries the
 * database is a controller nobody can reuse and a query nobody can test — the
 * module contract this project checks on every commit.
 */
export const interviewSegments = async (
  firmId: string,
  transcriptionId: string
): Promise<unknown[] | null> => {
  const db = requireClient();

  const { data, error } = await db
    .from('transcriptions')
    .select('segments')
    .eq('firm_id', firmId)
    .eq('id', transcriptionId)
    .maybeSingle();

  if (error || !data) return null;

  return ((data as { segments: unknown[] }).segments ?? []) as unknown[];
};

export const linkTranscription = async (
  firmId: string,
  transcriptionId: string,
  clientId: string | null
): Promise<boolean> => {
  const db = requireClient();

  if (clientId) {
    const { data: client } = await db
      .from('clients')
      .select('id')
      .eq('firm_id', firmId)
      .eq('id', clientId)
      .maybeSingle();

    if (!client) {
      throw new ClientError('NOT_FOUND', 'No se encontró ese cliente.', 404);
    }
  }

  const { data, error } = await db
    .from('transcriptions')
    .update({ client_id: clientId, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('id', transcriptionId)
    .select('id');

  if (error) {
    console.error('[CLIENTS] No se pudo vincular la entrevista:', error.message);
    return false;
  }

  return (data?.length ?? 0) > 0;
};
