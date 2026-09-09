import { Request, Response } from 'express';
import { catalogService } from './catalog.service';
import { auditService } from '../audit/audit.service';
import { firmActuacionStore, FirmActuacionStoreError } from './firmActuaciones.store';
import { actuacionPropiaComoCatalogo, validarActuacionPropia } from './firmActuaciones.validate';
import type { FirmActuacionInput, LegalBranch } from './types';

/**
 * Las actuaciones que la firma añade a una rama cuando el catálogo no trae la
 * suya.
 *
 * ─── POR QUÉ ESTO NO CONTRADICE AL CATÁLOGO ─────────────────────────────────
 *
 * La regla de la casa es que un término afirmado sin comprobar es peor que su
 * ausencia. Esta función no la rompe porque no afirma nada: lo que guarda es un
 * NOMBRE, y todo lo demás —artículo, término, secciones— queda declarado como
 * no verificado en la lista, en la barra de configuración y en las
 * instrucciones que recibe el modelo. La alternativa real, cuando la rama no
 * trae la actuación, no era una ficha mejor: era redactar bajo la ficha
 * equivocada, que sí afirma un plazo, y el equivocado.
 *
 * CREAR NO ES VERIFICAR, y por eso no exige ser socio. Verificar sí lo exige
 * —de eso depende que el sello verde signifique algo— y ese camino sigue
 * siendo el de `saveVerificationController`. Escribir el nombre de la
 * actuación que uno va a redactar es trabajo de litigante.
 */

const requireFirmId = (req: Request, res: Response): string | null => {
  const firmId = req.firmId;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Se requiere una sesión.' });
    return null;
  }

  return firmId;
};

const respondStoreError = (res: Response, error: FirmActuacionStoreError): void => {
  console.error(`[CATALOG] ${error.code}: ${error.message}`);

  if (error.code === 'DUPLICATE_NAME') {
    res.status(409).json({ success: false, error: error.code, message: error.message });
    return;
  }

  res.status(503).json({
    success: false,
    error: error.code,
    message:
      error.code === 'STORE_NOT_CONFIGURED'
        ? error.message
        : 'La actuación no pudo guardarse. Revise la conexión con la base de datos e inténtelo de nuevo.'
  });
};

/** GET /api/catalog/firm-actuaciones — las que esta firma añadió. */
export const listFirmActuacionesController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const load = await firmActuacionStore.listForFirm(firmId);

  res.json({
    success: true,
    /*
     * El estado de la lectura viaja con la lista: «no tiene ninguna» y «no
     * pude leerlas» son hechos distintos, y presentarlos igual haría creer
     * que una actuación añadida ayer se perdió.
     */
    estado: load.status,
    actuaciones: load.actuaciones,
    /* Con la forma del catálogo, que es como las pinta la pantalla. */
    comoCatalogo: load.actuaciones.map(actuacionPropiaComoCatalogo)
  });
};

/**
 * POST /api/catalog/firm-actuaciones   { area, exactName, role?, note? }
 *
 * Responde 409 —no 400— cuando el nombre ya existe o pisa a una publicada: no
 * es una petición mal formada, es un conflicto con lo que ya hay, y la
 * respuesta dice cuál es para que el abogado pueda elegirla.
 */
export const createFirmActuacionController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const body = (req.body ?? {}) as Record<string, unknown>;
  const area = String(body.area ?? '').trim().toUpperCase();

  const input: FirmActuacionInput = {
    area,
    exactName: String(body.exactName ?? ''),
    role: body.role == null ? undefined : String(body.role),
    note: body.note == null ? null : String(body.note),
    createdBy: req.user?.email ?? 'desconocido'
  };

  const load = await firmActuacionStore.listForFirm(firmId);

  /*
   * NO SE VALIDA CONTRA UNA LISTA QUE NO SE PUDO LEER. Si las actuaciones de
   * la firma no cargan, la comprobación de duplicados sería vacía y se
   * escribiría una segunda copia del mismo nombre — que el índice único de la
   * base rechazaría con un mensaje de Postgres. Mejor decirlo aquí.
   */
  if (load.status === 'UNAVAILABLE') {
    res.status(503).json({
      success: false,
      error: 'CATALOGO_PROPIO_NO_DISPONIBLE',
      message: 'No se pudieron leer las actuaciones de su firma, así que no se puede comprobar si esta ya existe. Inténtelo de nuevo.'
    });
    return;
  }

  const validation = validarActuacionPropia(
    input,
    catalogService.listBranches(),
    catalogService.list(area as LegalBranch),
    load.actuaciones
  );

  if (!validation.ok) {
    res
      .status(validation.error.status)
      .json({ success: false, error: validation.error.code, message: validation.error.message });
    return;
  }

  try {
    const creada = await firmActuacionStore.create(firmId, validation.value);

    await auditService.record({
      firmId,
      userEmail: input.createdBy,
      action: 'FIRM_ACTUACION_CREATED',
      resource: `Añadió actuación propia · ${creada.exactName} (${creada.area})`
    });

    res.status(201).json({
      success: true,
      actuacion: creada,
      comoCatalogo: actuacionPropiaComoCatalogo(creada)
    });
  } catch (error) {
    if (error instanceof FirmActuacionStoreError) {
      respondStoreError(res, error);
      return;
    }
    throw error;
  }
};

/**
 * DELETE /api/catalog/firm-actuaciones?id=
 *
 * Borrarla la retira de la lista de la rama; los borradores ya escritos con
 * ella no se tocan, porque el escrito ya existe y su procedencia quedó
 * guardada con él.
 *
 * PUEDE QUIEN LA CREÓ, Y PUEDE UN SOCIO. Retirar de la lista de toda la firma
 * lo que otro añadió es una decisión de la firma, no de cualquiera que pase;
 * pero obligar a un socio para deshacer el propio error de tecleo convertiría
 * cada errata en un trámite.
 */
export const deleteFirmActuacionController = async (req: Request, res: Response): Promise<void> => {
  const firmId = requireFirmId(req, res);
  if (!firmId) return;

  const id = String(req.query.id ?? '').trim();

  if (!id) {
    res.status(400).json({ success: false, error: 'MISSING_ID', message: 'Se requiere el parámetro id.' });
    return;
  }

  const load = await firmActuacionStore.listForFirm(firmId);
  const existente = load.actuaciones.find((a) => a.id === id);

  if (!existente) {
    res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Esa actuación no está entre las que añadió su firma.'
    });
    return;
  }

  const email = req.user?.email ?? 'desconocido';
  const esSocio = req.user?.role === 'FIRM_ADMIN' || req.user?.role === 'SUPER_ADMIN';

  if (!esSocio && existente.createdBy !== email) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: `«${existente.exactName}» la añadió ${existente.createdBy}. Retirarla de la lista de la firma es de los administradores.`
    });
    return;
  }

  try {
    await firmActuacionStore.remove(firmId, id);

    await auditService.record({
      firmId,
      userEmail: email,
      action: 'FIRM_ACTUACION_DELETED',
      resource: `Retiró actuación propia · ${existente.exactName} (${existente.area})`
    });

    res.json({ success: true, id });
  } catch (error) {
    if (error instanceof FirmActuacionStoreError) {
      respondStoreError(res, error);
      return;
    }
    throw error;
  }
};
