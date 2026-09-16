import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { exigirFuncion, responderPlanError } from '../subscriptions/plan.service';
import { ExpedienteError, obtenerExpediente } from './expedientes.service';
import {
  borrarInterrogatorio,
  listarInterrogatorios,
  obtenerInterrogatorio
} from './interrogatorios.service';

/**
 * LO QUE YA SE PAGÓ SE ABRE SIN VOLVER A PAGAR.
 *
 * Estas tres rutas —listar, abrir y eliminar— NO llaman a ningún motor y NO
 * tocan el saldo. Es la mitad de la promesa: preparar el interrogatorio cuesta
 * una vez, y desde entonces está en el expediente para quien lo necesite.
 *
 * ─── SE EXIGE LA MISMA FUNCIÓN QUE PARA PREPARARLO, Y NO ES SIMETRÍA BOBA ──
 *
 * `EXPEDIENTES.PREGUNTAS_AUDIENCIA` es la función que el operador puede apagar
 * dejando Expedientes encendido. Si leer lo guardado no la exigiera, apagarla
 * dejaría la pantalla a medias: la firma seguiría abriendo, exportando e
 * imprimiendo interrogatorios, y solo dejaría de poder preparar otros nuevos.
 * Se exige también aquí para que apagar la función signifique lo que dice.
 *
 * ─── EL EXPEDIENTE SE ABRE ANTES QUE SUS TANDAS ────────────────────────────
 *
 * `obtenerExpediente` comprueba que el caso exista Y sea de esta firma, y
 * responde 404 si no. Sin ese paso, pedir las tandas de un expediente ajeno
 * devolvería una lista vacía —un 200 que dice «este caso no tiene ninguno»—
 * en vez de decir que ese caso no es de quien pregunta.
 */

const fallar = (res: Response, err: unknown, mensaje: string): void => {
  if (responderPlanError(res, err)) return;
  if (err instanceof ExpedienteError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error('[EXPEDIENTES/INTERROGATORIOS] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'INTERROGATORIOS_FAILED', message: mensaje });
};

/** GET /api/expedientes/:id/interrogatorios */
export const listarInterrogatoriosController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  try {
    await exigirFuncion(firmId, 'EXPEDIENTES.PREGUNTAS_AUDIENCIA');
    const expediente = await obtenerExpediente(firmId, String(req.params.id));
    const interrogatorios = await listarInterrogatorios(firmId, expediente.id);
    res.json({ success: true, interrogatorios });
  } catch (err) {
    fallar(res, err, 'No se pudieron leer los interrogatorios preparados.');
  }
};

/** GET /api/expedientes/:id/interrogatorios/:interrogatorioId */
export const abrirInterrogatorioController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  try {
    await exigirFuncion(firmId, 'EXPEDIENTES.PREGUNTAS_AUDIENCIA');
    const expediente = await obtenerExpediente(firmId, String(req.params.id));
    const interrogatorio = await obtenerInterrogatorio(
      firmId,
      expediente.id,
      String(req.params.interrogatorioId)
    );
    res.json({ success: true, interrogatorio });
  } catch (err) {
    fallar(res, err, 'No se pudo abrir el interrogatorio.');
  }
};

/** DELETE /api/expedientes/:id/interrogatorios/:interrogatorioId */
export const borrarInterrogatorioController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  try {
    await exigirFuncion(firmId, 'EXPEDIENTES.PREGUNTAS_AUDIENCIA');
    const expediente = await obtenerExpediente(firmId, String(req.params.id));
    const borrado = await borrarInterrogatorio({
      firmId,
      expedienteId: expediente.id,
      id: String(req.params.interrogatorioId),
      email: req.user?.email,
      role: req.user?.role
    });

    /*
     * ─── EL BORRADO DEJA RASTRO, Y LA CREACIÓN TAMBIÉN ─────────────────────
     *
     * Un interrogatorio es material privilegiado del cliente, lo pagó la firma
     * y no hay papelera. Quien vuelva a buscarlo y no lo encuentre tiene
     * derecho a saber quién lo retiró; y el socio que responde por lo que la
     * firma guarda, a ver que alguien retiró trabajo ajeno.
     *
     * VA DESPUÉS DE QUE EL BORRADO TUVO ÉXITO: un rastro que se escriba antes
     * afirma un hecho que puede no haber ocurrido. Y ANTES DE RESPONDER,
     * porque una función serverless se congela al responder.
     *
     * AL RASTRO VAN LA CARÁTULA, CUÁNTA GENTE Y QUIÉN LO HABÍA PREPARADO —que
     * es lo que hace falta para entender la pérdida— y NADA del contenido: ni
     * las preguntas, ni las respuestas probables, ni las citas del expediente.
     * Borrarlo de la tabla y copiarlo al registro no sería borrarlo.
     */
    await auditService.record({
      firmId,
      userEmail: req.user?.email ?? 'desconocido',
      action: 'EXPEDIENTE_INTERROGATORIO_DELETED',
      resource: `${expediente.caratula} · ${borrado.personas.length} persona(s) · lo preparó ${borrado.creadoPor}`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({ success: true });
  } catch (err) {
    fallar(res, err, 'No se pudo eliminar el interrogatorio.');
  }
};
