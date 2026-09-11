import { NextFunction, Request, Response } from 'express';
import { verificarToken } from './auth.service';

/**
 * Resolves the tenant from the CALLER'S TOKEN, never from a header they wrote.
 *
 * WHAT THIS REPLACES. `tenantMiddleware` read `x-firm-id` and believed it. The
 * database isolation was real — every query filters by firm — but the filter
 * ran on a value the browser chose, so reading another firm's hearings required
 * knowing their id and nothing else. No password, no session, no account.
 *
 * The firm now comes out of a signature Supabase verifies, from the half of the
 * metadata only the service role can write. A client can forge the header all
 * it likes; nothing reads it any more.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'MISSING_SESSION',
      message: 'Inicia sesión para continuar.'
    });
    return;
  }

  const verificacion = await verificarToken(header.slice('Bearer '.length).trim());

  /*
   * ─── «NO PUDE COMPROBARLO» NO ES «NO SIRVE», Y LA DIFERENCIA ES 503 ───────
   *
   * Antes los dos casos salían por el mismo 401, y el navegador trata
   * cualquier 401 como sesión perdida: borra la sesión guardada y devuelve al
   * login. De modo que un tropiezo de red, un 5xx de Supabase o un arranque en
   * frío lento echaban al abogado en mitad del trabajo, con su token intacto.
   *
   * Y pasa mucho más de lo que parece: la aplicación sondea el saldo cada 20 s
   * y soporte cada 30 s, así que verifica el token unas cinco veces por minuto
   * mientras la pestaña esté abierta. Basta con que UNA de esas trescientas
   * verificaciones por hora falle por causas ajenas.
   *
   * 503 le dice al cliente lo correcto —vuelva a intentar— y conserva la
   * sesión, que es la única respuesta honesta cuando no se comprobó nada.
   */
  if (verificacion.estado === 'NO_DISPONIBLE') {
    console.warn(`[AUTH] No se pudo verificar la sesión: ${verificacion.motivo}`);
    res.status(503).json({
      success: false,
      error: 'AUTH_NO_DISPONIBLE',
      message: 'No se pudo comprobar su sesión en este momento. Vuelva a intentarlo.'
    });
    return;
  }

  if (verificacion.estado === 'INVALIDO') {
    /*
     * SE REGISTRA EL MOTIVO, Y NO SE RESPONDE. Sin rastro en el servidor, un
     * cierre de sesión inesperado no se puede investigar: no hay forma de
     * saber si el token expiró, si venía falseado o si la cuenta perdió su
     * firma. Va al registro, donde lo lee quien opera; al cliente sigue
     * llegando una sola frase.
     */
    console.warn(`[AUTH] Sesión rechazada: ${verificacion.motivo}`);
    // One answer for an expired token, a forged one, and an account with no
    // firm. The client's move is the same in all three — sign in again — and
    // distinguishing them tells a prober which tokens are merely stale.
    res.status(401).json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'La sesión no es válida o expiró. Vuelve a iniciar sesión.'
    });
    return;
  }

  req.firmId = verificacion.user.firmId;
  req.user = verificacion.user;

  next();
};

/**
 * Attaches the caller's firm WHEN they have a valid session, and lets everyone
 * else through.
 *
 * For the routes that serve shared product knowledge — the actuación catalogue,
 * the jurisprudence corpus — which must answer a visitor with no firm at all,
 * but overlay a firm's own curation for a lawyer who has one.
 *
 * It exists because the catalogue read that overlay from `x-firm-id` on a route
 * mounted before any middleware: an unauthenticated caller could name someone
 * else's firm and read their curation. The overlay is tenant data, so the only
 * safe source is a verified token.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;

  /* Sin token es un visitante, y el catálogo de fábrica es su respuesta correcta. */
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const verificacion = await verificarToken(header.slice('Bearer '.length).trim());

  /*
   * AQUÍ TAMBIÉN SE DISTINGUE, Y NO ES SIMETRÍA POR SIMETRÍA.
   *
   * Quien manda un token TIENE sesión; si no se pudo comprobar, seguir como si
   * fuera un visitante le serviría el catálogo de fábrica SIN la curaduría de
   * su firma — es decir, el término que un abogado de la casa ya corrigió,
   * mostrado como si nadie lo hubiera tocado, y sin decirlo en ninguna parte.
   *
   * Eso es peor que un error: es la ficha vieja con cara de verificada. 503 y
   * que vuelva a intentar.
   */
  if (verificacion.estado === 'NO_DISPONIBLE') {
    console.warn(`[AUTH] No se pudo verificar la sesión (ruta pública): ${verificacion.motivo}`);
    res.status(503).json({
      success: false,
      error: 'AUTH_NO_DISPONIBLE',
      message: 'No se pudo comprobar su sesión en este momento. Vuelva a intentarlo.'
    });
    return;
  }

  /*
   * Un token INVÁLIDO no corta el paso: esta ruta atiende a visitantes, y el
   * catálogo de fábrica es exactamente lo que le toca a quien no tiene sesión
   * válida. Cortar aquí convertiría una ruta pública en una privada.
   */
  if (verificacion.estado === 'VALIDO') {
    req.firmId = verificacion.user.firmId;
    req.user = verificacion.user;
  }

  next();
};
