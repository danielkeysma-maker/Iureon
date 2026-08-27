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

  /*
   * Por defecto, los de la FIRMA.
   *
   * Filtraba siempre por usuario, y eso escondía el trabajo de la firma de sí
   * misma: dos socios del mismo caso no veían los borradores del otro. `?alcance
   * =MIOS` conserva la vista personal para quien la quiera.
   */
  const alcance = req.query.alcance === 'MIOS' ? 'MIOS' : 'FIRMA';
  const drafts = await draftsService.listDrafts(firmId, userEmail, alcance);
  res.json({ success: true, drafts });
};

/**
 * POST /api/drafts — Crea un borrador nuevo
 */
export const createDraftController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId || '';
  const {
    title,
    documentType,
    legalText,
    jurisprudenciaCitada,
    excepcionesFormuladas,
    tokensConsumed,
    legalBranch,
    venceEl,
    cliente,
    despacho,
    radicado
  } = req.body;
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
    tokens_consumed: tokensConsumed || 0,
    legal_branch: legalBranch ?? null,
    /*
     * La fecha de vencimiento la pone quien lleva el caso, no el sistema. El
     * catálogo tiene el término como TEXTO —«dentro de los diez (10) días
     * siguientes a la presentación»— y de ahí no sale una fecha sin saber
     * cuándo empezó a correr. Inventarla sería inventar un plazo.
     */
    vence_el: venceEl ?? null,
    cliente: cliente ?? null,
    despacho: despacho ?? null,
    radicado: radicado ?? null,
    estado: 'BORRADOR',
    radicado_el: null,
    version: 1
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
  const {
    title,
    legalText,
    jurisprudenciaCitada,
    excepcionesFormuladas,
    venceEl,
    legalBranch,
    cliente,
    despacho,
    radicado,
    estado
  } = req.body;

  /*
   * Solo lo que llegó. Un `undefined` en Supabase borraría el valor, así que
   * mandar el objeto completo convertiría "corregir el cliente" en "vaciar la
   * fecha de vencimiento" — perdiendo el término del escrito en silencio.
   */
  const cambios: Record<string, unknown> = {};
  if (title !== undefined) cambios.title = title;
  if (legalText !== undefined) cambios.legal_text = legalText;
  if (jurisprudenciaCitada !== undefined) cambios.jurisprudencia_citada = jurisprudenciaCitada;
  if (excepcionesFormuladas !== undefined) cambios.excepciones_formuladas = excepcionesFormuladas;
  if (venceEl !== undefined) cambios.vence_el = venceEl;
  /*
   * La rama SÍ se corrige. `createDraft` la acepta y este controlador no la
   * aceptaba, así que un escrito guardado bajo la rama equivocada se quedaba
   * ahí para siempre: la pantalla de borradores filtra por rama, y ese escrito
   * desaparecía del filtro correcto sin que nada fallara.
   */
  if (legalBranch !== undefined) cambios.legal_branch = legalBranch;
  if (cliente !== undefined) cambios.cliente = cliente;
  if (despacho !== undefined) cambios.despacho = despacho;
  if (radicado !== undefined) cambios.radicado = radicado;
  if (estado !== undefined) cambios.estado = estado;

  try {
    const updated = await draftsService.updateDraft(draftId, firmId, cambios);

    if (!updated) {
      res.json({ success: false, useLocalFallback: true });
      return;
    }

    res.json({ success: true, draft: updated });
  } catch (error) {
    /*
     * 409 y el mensaje de la base tal cual.
     *
     * El único error esperado aquí es intentar editar un escrito ya radicado, y
     * el disparador lo dice en español con su fecha. Traducirlo a "no se pudo
     * guardar" le esconde al abogado la única información que necesita: que ese
     * escrito ya está en el juzgado y es una copia inmutable.
     */
    res.status(409).json({
      success: false,
      error: 'ESCRITO_RADICADO',
      message: (error as Error).message
    });
  }
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
