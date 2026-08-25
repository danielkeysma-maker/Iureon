import { Request, Response } from 'express';
import { DraftsService } from './drafts.service';

const draftsService = new DraftsService();

/**
 * GET /api/drafts — Lista los borradores de la firma + usuario
 */
export const listDraftsController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId || '';
  // From the verified session, not the query string: naming somebody else's
  // address must not list their drafts.
  const userEmail = req.user?.email ?? '';

  if (!userEmail) {
    res.status(400).json({ error: 'MISSING_USER_EMAIL', message: 'Se requiere el parámetro userEmail.' });
    return;
  }

  const drafts = await draftsService.listDrafts(firmId, userEmail);
  res.json({ success: true, drafts });
};

/**
 * POST /api/drafts — Crea un borrador nuevo
 */
export const createDraftController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId || '';
  const { title, documentType, legalText, jurisprudenciaCitada, excepcionesFormuladas, tokensConsumed } = req.body;
  // The author is whoever the token says, never whoever the body claims.
  const userEmail = req.user?.email ?? '';

  if (!userEmail || !title || !legalText) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'Se requieren userEmail, title y legalText.' });
    return;
  }

  const draft = await draftsService.createDraft({
    firm_id: firmId,
    user_email: userEmail,
    title,
    document_type: documentType || 'Documento Procesal',
    legal_text: legalText,
    jurisprudencia_citada: jurisprudenciaCitada || [],
    excepciones_formuladas: excepcionesFormuladas || [],
    tokens_consumed: tokensConsumed || 0
  });

  if (!draft) {
    // Supabase no disponible — frontend debe usar localStorage como fallback
    res.json({ success: false, useLocalFallback: true });
    return;
  }

  res.json({ success: true, draft });
};

/**
 * PUT /api/drafts/:id — Actualiza un borrador existente
 */
export const updateDraftController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId || '';
  const draftId = req.params.id as string;
  const { title, legalText, jurisprudenciaCitada, excepcionesFormuladas } = req.body;

  const updated = await draftsService.updateDraft(draftId, firmId, {
    title,
    legal_text: legalText,
    jurisprudencia_citada: jurisprudenciaCitada,
    excepciones_formuladas: excepcionesFormuladas
  });

  if (!updated) {
    res.json({ success: false, useLocalFallback: true });
    return;
  }

  res.json({ success: true, draft: updated });
};

/**
 * DELETE /api/drafts/:id — Elimina un borrador
 */
export const deleteDraftController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId || '';
  const draftId = req.params.id as string;

  const deleted = await draftsService.deleteDraft(draftId, firmId);

  if (!deleted) {
    res.json({ success: false, useLocalFallback: true });
    return;
  }

  res.json({ success: true });
};
