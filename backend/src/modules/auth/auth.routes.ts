import { Router } from 'express';
import { bloquearSiPlanVencido } from '../subscriptions/planVigente.middleware';
import {
  actualizarMiNombreController,
  addUserController,
  eliminarMiUsuarioController,
  listUsersController,
  loginController,
  meController,
  refreshController,
  setUserActiveController,
  setUserRoleController,
} from './auth.controller';
import { recuperarController, restablecerController } from './recuperacion.controller';

/**
 * The two endpoints that must live BEFORE the session middleware, because a
 * caller who has no session yet cannot pass it: signing in, and trading an
 * expired access token for a fresh one.
 *
 * REGISTRATION IS NOT AMONG THEM ANY MORE. A public register-firm endpoint let
 * anyone create a tenant and use the product without becoming a client. Firms
 * are opened by the operator, who knows what was agreed and charged.
 *
 * Kept in their own router so the ordering is a fact of the file rather than a
 * comment in index.ts that a later edit can quietly break.
 */
const publicRouter = Router();

publicRouter.post('/auth/login', loginController as any);
publicRouter.post('/auth/refresh', refreshController as any);
/*
 * Recuperar la contraseña por correo: pedir el enlace y canjearlo. Públicas por
 * la misma razón que entrar — quien las usa no tiene sesión—. Sus límites y su
 * respuesta neutral viven en `recuperacion.rules.ts`.
 */
publicRouter.post('/auth/recuperar', recuperarController as any);
publicRouter.post('/auth/restablecer', restablecerController as any);

export const authPublicRoutes = publicRouter;

/** Everything that needs to know who is asking. */
const router = Router();

router.get('/auth/me', meController as any);
// Sin bloquearSiPlanVencido: poner su nombre no es usar el producto, y una
// firma con el plan vencido sigue teniendo derecho a corregir quién es quién.
router.patch('/auth/me', actualizarMiNombreController as any);
// Without bloquearSiPlanVencido: leaving must work exactly when the plan ran out.
router.delete('/auth/me', eliminarMiUsuarioController as any);
router.get('/auth/users', listUsersController as any);
router.post('/auth/users', bloquearSiPlanVencido, addUserController as any);
router.patch('/auth/users/:id/estado', setUserActiveController as any);
router.patch('/auth/users/:id/rol', setUserRoleController as any);

export const authRoutes = router;
