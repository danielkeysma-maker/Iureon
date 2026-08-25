import { Request, Response } from 'express';
import {
  ClientError,
  registerClient,
  deleteClient,
  interviewSegments,
  linkTranscription,
  listClients,
  updateClient
} from './clients.service';
import { suggestForInterview } from './interviewInsights.service';
import type { TranscriptSegment } from '../transcription/types';

const fail = (res: Response, err: unknown, fallback: string): void => {
  if (err instanceof ClientError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }

  console.error('[CLIENTS] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'CLIENTS_FAILED', message: fallback });
};

/** GET /api/clients — the firm's clients, newest first. */
export const listClientsController = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, clients: await listClients(req.firmId as string) });
  } catch (err) {
    fail(res, err, 'No se pudieron cargar los clientes.');
  }
};

/** POST /api/clients */
export const createClientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await registerClient(req.firmId as string, req.user?.email ?? 'desconocido', {
      fullName: String(req.body.fullName ?? ''),
      documentId: String(req.body.documentId ?? ''),
      email: typeof req.body.email === 'string' ? req.body.email : undefined,
      phone: typeof req.body.phone === 'string' ? req.body.phone : undefined,
      notes: typeof req.body.notes === 'string' ? req.body.notes : undefined
    });

    res.status(201).json({ success: true, client });
  } catch (err) {
    fail(res, err, 'No se pudo registrar el cliente.');
  }
};

/** PATCH /api/clients/:id — everything except the document; see the service. */
export const updateClientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await updateClient(req.firmId as string, String(req.params.id), {
      fullName: typeof req.body.fullName === 'string' ? req.body.fullName : undefined,
      email: typeof req.body.email === 'string' ? req.body.email : undefined,
      phone: typeof req.body.phone === 'string' ? req.body.phone : undefined,
      notes: typeof req.body.notes === 'string' ? req.body.notes : undefined
    });

    res.json({ success: true, client });
  } catch (err) {
    fail(res, err, 'No se pudo actualizar el cliente.');
  }
};

/** DELETE /api/clients/:id — the file goes, the interviews stay. */
export const deleteClientController = async (req: Request, res: Response): Promise<void> => {
  const removed = await deleteClient(req.firmId as string, String(req.params.id));

  if (!removed) {
    res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró ese cliente.' });
    return;
  }

  res.json({ success: true });
};

/** PATCH /api/clients/link — attaches an interview to a client, or detaches it. */
export const linkTranscriptionController = async (req: Request, res: Response): Promise<void> => {
  const transcriptionId = String(req.body.transcriptionId ?? '');
  const clientId = req.body.clientId === null ? null : String(req.body.clientId ?? '');

  if (!transcriptionId) {
    res.status(400).json({ success: false, error: 'MISSING_ID', message: 'Se requiere "transcriptionId".' });
    return;
  }

  try {
    const linked = await linkTranscription(req.firmId as string, transcriptionId, clientId || null);

    if (!linked) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró esa entrevista.' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    fail(res, err, 'No se pudo vincular la entrevista.');
  }
};

/**
 * GET /api/clients/interviews/:transcriptionId/insights
 *
 * Jurisprudence the corpus offers for what the CLIENT said. Read on demand
 * rather than computed at transcription time: the suggestions depend on which
 * voice was marked as the client, and that happens after the transcript exists.
 */
export const interviewInsightsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const segments = await interviewSegments(
      req.firmId as string,
      String(req.params.transcriptionId)
    );

    if (!segments) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'No se encontró esa entrevista.' });
      return;
    }

    res.json({ success: true, ...(await suggestForInterview(segments as TranscriptSegment[])) });
  } catch (err) {
    fail(res, err, 'No se pudieron obtener sugerencias.');
  }
};
