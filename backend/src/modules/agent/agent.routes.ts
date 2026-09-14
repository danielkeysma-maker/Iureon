import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import { streamAgentDraftController } from './agent.controller';
import {
  deleteReviewController,
  getReviewController,
  getStorageConsentController,
  listReviewsController,
  reReviewController,
  reviewChatController,
  reviewDocumentController,
  saveWorkingTextController,
  setStorageConsentController
} from './review/documentReview.controller';
import { escritoChatController } from './review/escritoChat.controller';

const router = Router();

// Orquestador RAG SSE
router.post('/agent/stream-draft', bloquearSiPlanVencido, streamAgentDraftController);
/* Revisar un escrito ya redactado: informe, no borrador. Cobra como REVISION. */
router.post('/agent/review-document', bloquearSiPlanVencido, reviewDocumentController as any);
/* Los informes guardados de la firma: se releen dias despues, cuando se corrige el escrito. */
router.get('/agent/reviews', listReviewsController as any);
/* La autorizacion de la firma va ANTES de /:id para que «settings» no se lea como un id. */
router.get('/agent/reviews/settings/guardado', getStorageConsentController as any);
router.post('/agent/reviews/settings/guardado', bloquearSiPlanVencido, setStorageConsentController as any);
router.get('/agent/reviews/:id', getReviewController as any);
router.delete('/agent/reviews/:id', bloquearSiPlanVencido, deleteReviewController as any);
/* El taller: texto de trabajo, conversacion y nueva revision sobre el texto corregido. */
router.put('/agent/reviews/:id/texto', bloquearSiPlanVencido, saveWorkingTextController as any);
router.post('/agent/reviews/:id/chat', bloquearSiPlanVencido, reviewChatController as any);
router.post('/agent/reviews/:id/rerevisar', bloquearSiPlanVencido, reReviewController as any);
/* La guia conversa sobre un escrito generado en Redaccion: sin informe ni id; el navegador manda texto e historial. */
router.post('/agent/escrito/chat', bloquearSiPlanVencido, escritoChatController as any);

/*
 * AQUÍ ESTUVIERON TRES RUTAS DE «APRENDIZAJE» Y NINGUNA HACÍA LO QUE DECÍA.
 * `/agent/style-profile` devolvía un perfil inventado («18 ediciones
 * analizadas»), `/agent/learn-edits` solo escribía una línea en la consola y
 * `/agent/suggest-terminology` fabricaba frases con apariencia jurídica que
 * ninguna firma había escrito. Se retiraron el 14 de septiembre de 2026, junto
 * con su servicio y su controlador. «Enseñar estilo» y «Sugerir jerga» se
 * construyen de nuevo sobre `estilo_lecciones` (supabase/migration-estilo-de-la-firma.sql),
 * y `check:sin-aprendizaje-falso` impide que las rutas o las frases vuelvan.
 */

export const agentRoutes = router;
