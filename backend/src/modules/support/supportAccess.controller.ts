import { Request, Response } from 'express';
import {
  SupportAccessError,
  anotarLectura,
  decidirAcceso,
  estadoDeAcceso,
  historialDeAccesos,
  lecturasDeAcceso,
  revocarAcceso,
  solicitarAcceso
} from './supportAccess.service';

/**
 * Acceso de soporte. Artboard 8a.
 *
 * ─── EL REPARTO DE PODERES SE IMPONE AQUÍ, NO EN EL SERVICIO ────────────────
 *
 * El servicio sabe hacer las transiciones; no sabe quién tiene derecho a
 * pedirlas. Eso vive en esta capa por una razón práctica: los dos lados de la
 * conversación llegan por rutas distintas y con autenticaciones distintas.
 *
 *   PIDE      · operación, bajo `/api/admin`, ya filtrada por `requireSuperAdmin`.
 *               La firma llega en la URL porque no es la suya.
 *   DECIDE    · un socio de la firma, bajo `/api`, con `req.firmId` de su token.
 *               La firma NUNCA llega por parámetro: se lee del token, o el
 *               navegador escogería a qué firma le autoriza el acceso.
 *
 * Quién puede decidir lo resuelve `socioDeLaFirma`, y ahí está escrito por qué
 * exigir el rol del socio basta para dejar fuera a quien pidió el acceso.
 */

/**
 * Un parámetro de ruta, como el texto que es.
 *
 * Express los tipa `string | string[]` porque una ruta puede repetir el mismo
 * nombre. Estas no lo hacen, pero forzar el tipo con un aserto dejaría pasar el
 * día en que alguien escriba una que sí: se toma el primero y se estrecha de
 * verdad, que cuesta una línea.
 */
const param = (valor: string | string[] | undefined): string =>
  Array.isArray(valor) ? (valor[0] ?? '') : (valor ?? '');

const responder = (res: Response, error: unknown): void => {
  if (error instanceof SupportAccessError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  const mensaje = error instanceof Error ? error.message : 'Error inesperado.';
  res.status(500).json({ error: 'SUPPORT_ACCESS_ERROR', message: mensaje });
};

/** Solo un socio de la firma decide. Ni operación, ni un abogado sin poder. */
const socioDeLaFirma = (req: Request, res: Response): string | null => {
  const firmId = req.firmId;
  if (!firmId || !req.user) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere sesión autenticada.' });
    return null;
  }
  /*
   * Exigir FIRM_ADMIN deja fuera al superadministrador de paso, y ese efecto es
   * el importante: su token trae firma activa, así que pasaría el filtro del
   * inquilino y podría autorizar su propia solicitud. El consentimiento que
   * quien pide puede darse a sí mismo no es consentimiento.
   */
  if (req.user.role !== 'FIRM_ADMIN') {
    res.status(403).json({
      error: 'ONLY_FIRM_ADMIN',
      message:
        'Solo un socio administrador de la firma puede autorizar, negar o revocar el acceso de soporte.'
    });
    return null;
  }
  return firmId;
};

// ─────────────────────────────── LADO OPERACIÓN ──────────────────────────────

/** `POST /api/admin/firms/:firmId/support-access` — pedir. No concede nada. */
export const solicitarAccesoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = param(req.params.firmId);
    const { motive, scope, durationMinutes } = req.body ?? {};

    const acceso = await solicitarAcceso({
      firmId,
      requestedBy: req.user?.email ?? 'operación',
      motive: typeof motive === 'string' ? motive : '',
      scope: typeof scope === 'string' ? scope : '',
      durationMinutes: Number(durationMinutes)
    });

    res.status(201).json({ success: true, acceso });
  } catch (error) {
    responder(res, error);
  }
};

/**
 * `GET /api/admin/firms/:firmId/support-access` — lo que operación puede saber.
 *
 * Devuelve el historial y, si hay sesión viva, lo que ella misma ha abierto. No
 * hay nada que ocultarle a operación aquí: es su propio rastro, y verlo del
 * mismo modo que lo ve la firma evita la sorpresa de que el cliente sepa algo
 * que quien entró no sabía que quedaba escrito.
 */
export const historialAccesoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = param(req.params.firmId);
    const [estado, historial] = await Promise.all([
      estadoDeAcceso(firmId),
      historialDeAccesos(firmId)
    ]);

    const lecturas = estado.activo ? await lecturasDeAcceso(estado.activo.id, firmId) : [];

    res.json({ success: true, estado, historial, lecturas });
  } catch (error) {
    responder(res, error);
  }
};

/**
 * `POST /api/admin/firms/:firmId/support-access/view` — anotar una pantalla.
 *
 * Lo llama el propio servidor de operación al abrir material de la firma, y
 * FALLA si no hay acceso vivo: si esta comprobación no estuviera, el registro
 * sería el único freno y un registro no impide nada.
 */
export const anotarLecturaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = param(req.params.firmId);
    const { resource } = req.body ?? {};

    const estado = await estadoDeAcceso(firmId);
    if (!estado.activo) {
      res.status(403).json({
        error: 'NO_ACTIVE_ACCESS',
        message: 'No hay un acceso de soporte vigente para esta firma.'
      });
      return;
    }

    await anotarLectura({
      accessId: estado.activo.id,
      firmId,
      resource: typeof resource === 'string' && resource.trim() ? resource.trim() : 'sin detallar',
      viewerEmail: req.user?.email ?? 'operación'
    });

    res.json({ success: true });
  } catch (error) {
    responder(res, error);
  }
};

// ───────────────────────────────── LADO FIRMA ────────────────────────────────

/**
 * `GET /api/support-access` — lo que la firma ve.
 *
 * Lo consulta cada carga de la aplicación para decidir si pinta la franja
 * ámbar. Va sin filtro de rol: la franja la tiene que ver TODO el que trabaje
 * en la firma, no solo quien puede revocar. Un acceso que solo conoce el socio
 * no es visible, es confidencial.
 */
export const estadoAccesoFirmaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId;
    if (!firmId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Se requiere sesión autenticada.' });
      return;
    }

    const estado = await estadoDeAcceso(firmId);
    const lecturas = estado.activo ? await lecturasDeAcceso(estado.activo.id, firmId) : [];

    res.json({ success: true, estado, lecturas });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/support-access/:accessId/decision` — el socio autoriza o niega. */
export const decidirAccesoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = socioDeLaFirma(req, res);
    if (!firmId) return;

    const acceso = await decidirAcceso({
      accessId: param(req.params.accessId),
      firmId,
      decidedBy: req.user?.email ?? '',
      autoriza: req.body?.autoriza === true
    });

    res.json({ success: true, acceso });
  } catch (error) {
    responder(res, error);
  }
};

/** `POST /api/support-access/:accessId/revoke` — cortar antes de tiempo. */
export const revocarAccesoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = socioDeLaFirma(req, res);
    if (!firmId) return;

    const acceso = await revocarAcceso({
      accessId: param(req.params.accessId),
      firmId,
      revokedBy: req.user?.email ?? ''
    });

    res.json({ success: true, acceso });
  } catch (error) {
    responder(res, error);
  }
};
