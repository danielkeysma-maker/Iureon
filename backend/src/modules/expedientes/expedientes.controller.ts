import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { exigirModulo, responderPlanError } from '../subscriptions/plan.service';
import {
  ExpedienteError,
  actualizarExpediente,
  agregarActor,
  atarPieza,
  borrarActor,
  borrarExpediente,
  crearExpediente,
  listarExpedientes,
  obtenerExpediente
} from './expedientes.service';
import { TIPOS_DE_PIEZA, type DatosDeActor, type TipoDePieza } from './types';
import { candidatosDeLaFirma, documentosDelExpediente, quitarDocumento } from './candidatos.service';
import { vectorSearchService } from '../search/vectorSearch.service';
import {
  borrarCarpeta,
  carpetasDelExpediente,
  contenidoDeCarpeta,
  crearCarpeta,
  moverCarpeta,
  moverDocumento
} from './carpetas.service';

/**
 * Los expedientes de la firma. Ver `types.ts` para el porqué del módulo.
 *
 * ─── EL PLAN SE EXIGE AQUÍ Y NO EN EL ROUTER ───────────────────────────────
 *
 * `exigirModulo` va en cada controlador, como en los demás módulos, y no como
 * un `router.use`: montado en el router dispararía al ENTRAR, y entonces una
 * firma sin el módulo recibiría 403 incluso en las rutas de lectura que quizá
 * un día queramos dejar abiertas. Es la misma razón por la que `adminRoutes`
 * vive en su propio prefijo.
 */

const fallar = (res: Response, err: unknown, mensaje: string): void => {
  if (responderPlanError(res, err)) return;
  if (err instanceof ExpedienteError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error('[EXPEDIENTES] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'EXPEDIENTES_FAILED', message: mensaje });
};

const cadena = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** GET /api/expedientes */
export const listarExpedientesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    res.json({ success: true, expedientes: await listarExpedientes(firmId) });
  } catch (err) {
    fallar(res, err, 'No se pudieron cargar los expedientes.');
  }
};

/** GET /api/expedientes/:id — con sus actores y las cuentas de lo que tiene atado. */
export const obtenerExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    res.json({ success: true, expediente: await obtenerExpediente(firmId, String(req.params.id)) });
  } catch (err) {
    fallar(res, err, 'No se pudo cargar el expediente.');
  }
};

/** POST /api/expedientes */
export const crearExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    const userEmail = req.user?.email ?? 'desconocido';

    const expediente = await crearExpediente(firmId, userEmail, {
      caratula: String(req.body?.caratula ?? ''),
      radicado: cadena(req.body?.radicado),
      despacho: cadena(req.body?.despacho),
      rama: cadena(req.body?.rama),
      clienteId: cadena(req.body?.clienteId),
      contraparte: cadena(req.body?.contraparte),
      notas: cadena(req.body?.notas)
    });

    /*
     * A LA AUDITORÍA VA LA CARÁTULA Y NO LAS NOTAS. El recurso nombra el asunto
     * —que es lo que hace útil el registro— y deja fuera lo que el abogado
     * escribió sobre él, que es del cliente. Mismo criterio que la revisión,
     * que registra el nombre del archivo y nunca su contenido.
     */
    await auditService.record({
      firmId,
      userEmail,
      action: 'EXPEDIENTE_CREATED',
      resource: expediente.caratula,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.status(201).json({ success: true, expediente });
  } catch (err) {
    fallar(res, err, 'No se pudo crear el expediente.');
  }
};

/** PATCH /api/expedientes/:id */
export const actualizarExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');

    /*
     * Solo viaja lo que el cliente MANDÓ. `undefined` significa «no lo toques»
     * y `null` significa «bórralo», y esa diferencia importa: sin ella, una
     * pantalla que edita solo la carátula borraría el radicado por no
     * enviarlo.
     */
    const datos: Record<string, unknown> = {};
    for (const campo of ['caratula', 'radicado', 'despacho', 'rama', 'clienteId', 'contraparte', 'notas', 'estado']) {
      if (campo in (req.body ?? {})) datos[campo] = req.body[campo];
    }

    const expediente = await actualizarExpediente(firmId, String(req.params.id), datos);
    res.json({ success: true, expediente });
  } catch (err) {
    fallar(res, err, 'No se pudo guardar el expediente.');
  }
};

/** DELETE /api/expedientes/:id — borra la carpeta, NO lo que había dentro. */
export const borrarExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    const userEmail = req.user?.email ?? 'desconocido';

    /* Se lee antes de borrar para que la auditoría pueda nombrar el asunto. */
    const antes = await obtenerExpediente(firmId, String(req.params.id));
    await borrarExpediente(firmId, String(req.params.id));

    await auditService.record({
      firmId,
      userEmail,
      action: 'EXPEDIENTE_DELETED',
      resource: antes.caratula,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({
      success: true,
      /*
       * SE DICE QUE LO DE DENTRO SIGUE AHÍ. Borrar una carpeta que contenía
       * cinco revisiones pagadas y no decir nada se lee como si se hubieran
       * ido con ella.
       */
      message: 'Se borró el expediente. Lo que tenía atado —entrevistas, revisiones, borradores y términos— sigue en su sitio, sin expediente.'
    });
  } catch (err) {
    fallar(res, err, 'No se pudo borrar el expediente.');
  }
};

// ─── ACTORES ────────────────────────────────────────────────────────────────

/** POST /api/expedientes/:id/actores */
export const agregarActorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');

    const datos: DatosDeActor = {
      nombre: String(req.body?.nombre ?? ''),
      papel: cadena(req.body?.papel) as DatosDeActor['papel'],
      lado: cadena(req.body?.lado) as DatosDeActor['lado'],
      sobreQue: cadena(req.body?.sobreQue),
      identificacion: cadena(req.body?.identificacion),
      notas: cadena(req.body?.notas),
      clienteId: cadena(req.body?.clienteId)
    };

    const actor = await agregarActor(firmId, String(req.params.id), datos);
    res.status(201).json({ success: true, actor });
  } catch (err) {
    fallar(res, err, 'No se pudo agregar a esa persona.');
  }
};

/** DELETE /api/expedientes/:id/actores/:actorId */
export const borrarActorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    await borrarActor(firmId, String(req.params.id), String(req.params.actorId));
    res.json({ success: true });
  } catch (err) {
    fallar(res, err, 'No se pudo quitar a esa persona.');
  }
};

// ─── ATAR Y DESATAR ─────────────────────────────────────────────────────────

/**
 * PATCH /api/expedientes/atar   { tipo, piezaId, expedienteId | null }
 *
 * UNA SOLA PUERTA PARA LAS CINCO TABLAS, y va declarada ANTES de `/:id` en el
 * router: con Express, `/expedientes/atar` casaría con `/expedientes/:id` y el
 * `atar` se leería como un identificador. Es la misma precaución que ya toma
 * `clients.routes.ts` con `/clients/link`.
 */
export const atarPiezaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');

    const tipo = String(req.body?.tipo ?? '') as TipoDePieza;
    const piezaId = String(req.body?.piezaId ?? '');
    /* `null` explícito es DESATAR, y por eso no se convierte a cadena. */
    const expedienteId = req.body?.expedienteId === null ? null : cadena(req.body?.expedienteId) ?? null;

    if (!TIPOS_DE_PIEZA.includes(tipo)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_TIPO',
        message: `Eso no se puede atar a un expediente. Se pueden atar: ${TIPOS_DE_PIEZA.join(', ')}.`
      });
      return;
    }
    if (!piezaId) {
      res.status(400).json({ success: false, error: 'MISSING_PIEZA', message: 'Falta decir qué se ata.' });
      return;
    }

    await atarPieza(firmId, tipo, piezaId, expedienteId);
    res.json({ success: true, atado: expedienteId !== null });
  } catch (err) {
    fallar(res, err, 'No se pudo atar al expediente.');
  }
};

/**
 * GET /api/expedientes/candidatos — lo que la firma ya tiene y se puede traer.
 *
 * Va SIN `:id` a propósito: la lista es de la firma, no de un expediente. El
 * expediente al que se ata lo elige después el propio gesto de atar, y
 * colgarla de un id obligaría a recargarla al cambiar de carpeta para obtener
 * exactamente la misma respuesta.
 */
export const candidatosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    res.json({ success: true, candidatos: await candidatosDeLaFirma(firmId) });
  } catch (err) {
    fallar(res, err, 'No se pudo cargar lo que hay para traer.');
  }
};

/**
 * GET /api/expedientes/:id/documentos — lo que el expediente tiene indexado.
 *
 * Un expediente que se llena en el tiempo necesita mostrar lo que ya tiene: sin
 * esta lista, a la tercera semana nadie recuerda si el poder ya se subió, y
 * volver a subirlo duplica sus fragmentos y hace que la búsqueda devuelva el
 * mismo párrafo dos veces.
 */
export const documentosDelExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    /* Comprueba de paso que el expediente sea de la firma. */
    const expediente = await obtenerExpediente(firmId, String(req.params.id));
    res.json({ success: true, documentos: await documentosDelExpediente(firmId, expediente.id) });
  } catch (err) {
    fallar(res, err, 'No se pudieron cargar los documentos del expediente.');
  }
};

/** DELETE /api/expedientes/:id/documentos/:documentId */
export const quitarDocumentoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    const userEmail = req.user?.email ?? 'desconocido';
    await exigirModulo(firmId, 'EXPEDIENTES');
    const expediente = await obtenerExpediente(firmId, String(req.params.id));
    const quitados = await quitarDocumento(firmId, expediente.id, String(req.params.documentId));

    await auditService.record({
      firmId,
      userEmail,
      action: 'EXPEDIENTE_INDEXED',
      resource: `${expediente.caratula} · documento retirado · ${quitados} fragmentos`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({ success: true, fragmentos: quitados });
  } catch (err) {
    fallar(res, err, 'No se pudo quitar el documento.');
  }
};

/**
 * GET /api/expedientes/:id/buscar?q=… — buscar DENTRO del expediente.
 *
 * ─── POR QUÉ ESTA PUERTA VALE MÁS QUE UNA CARPETA ──────────────────────────
 *
 * Un expediente de trescientas páginas no se navega: se pregunta. Escribir
 * «entrega del inmueble» y ver los tres pasajes que hablan de eso, con el
 * documento del que salieron al lado, es lo que un índice de carpetas no puede
 * dar por muchos niveles que tenga.
 *
 * ─── NO CUESTA SALDO, Y POR ESO NO SE COBRA ────────────────────────────────
 *
 * Buscar es un embedding de la consulta —unas pocas palabras— contra un índice
 * que ya está pagado. No llama a ningún modelo de lenguaje. Cobrar por esto
 * sería cobrar por leer lo que el abogado ya subió.
 *
 * ─── ACOTADO AL CASO, Y SIN EL CORPUS PÚBLICO ──────────────────────────────
 *
 * El corpus de jurisprudencia entra en las búsquedas del interrogatorio
 * —porque la ley es de todos los casos— pero NO aquí: quien busca dentro de su
 * expediente quiere sus papeles, y devolverle una sentencia de la Corte
 * mezclada con ellos convierte «buscar en mi caso» en otro buscador de
 * jurisprudencia, que ya existe en su propio módulo.
 */
export const buscarEnExpedienteController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    const expediente = await obtenerExpediente(firmId, String(req.params.id));

    const q = String(req.query.q ?? '').trim();
    if (q.length < 3) {
      res.status(400).json({
        success: false,
        error: 'CONSULTA_CORTA',
        message: 'Escriba al menos tres letras de lo que busca.'
      });
      return;
    }

    const hallado = await vectorSearchService.search(firmId, q, 12, expediente.id);

    /*
     * Fuera el corpus compartido. La RPC lo deja entrar siempre —y hace bien,
     * porque el interrogatorio lo necesita— así que el filtro va aquí, donde se
     * sabe que la pregunta es «qué dice MI expediente».
     */
    const delCaso = hallado.matches.filter((m) => m.firmId === firmId);

    res.json({
      success: true,
      /*
       * El estado viaja tal cual. `NO_PROVIDER` o `NO_INDEX` no son «sin
       * resultados»: son «no se pudo buscar», y confundirlos deja al abogado
       * creyendo que su expediente no dice nada de lo que preguntó.
       */
      estado: hallado.status,
      razon: hallado.reason ?? null,
      pasajes: delCaso.map((m) => ({
        documento: m.fileName ?? m.documentId,
        texto: m.contentChunk,
        similitud: m.similarity
      }))
    });
  } catch (err) {
    fallar(res, err, 'No se pudo buscar en el expediente.');
  }
};

// ─── CARPETAS ───────────────────────────────────────────────────────────────

/** GET /api/expedientes/:id/carpetas — planas; el árbol lo arma la pantalla. */
export const carpetasController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    res.json({ success: true, carpetas: await carpetasDelExpediente(firmId, String(req.params.id)) });
  } catch (err) {
    fallar(res, err, 'No se pudieron cargar las carpetas.');
  }
};

/** POST /api/expedientes/:id/carpetas   { nombre, padreId? } */
export const crearCarpetaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    const carpeta = await crearCarpeta(
      firmId,
      String(req.params.id),
      req.user?.email ?? 'desconocido',
      String(req.body?.nombre ?? ''),
      cadena(req.body?.padreId) ?? null
    );
    res.status(201).json({ success: true, carpeta });
  } catch (err) {
    fallar(res, err, 'No se pudo crear la carpeta.');
  }
};

/** PATCH /api/expedientes/:id/carpetas/:carpetaId   { nombre?, padreId? } */
export const moverCarpetaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');

    /* `undefined` es «no lo toques» y `null` es «llévala a la raíz». */
    const cambios: { nombre?: string; padreId?: string | null } = {};
    if ('nombre' in (req.body ?? {})) cambios.nombre = String(req.body.nombre ?? '');
    if ('padreId' in (req.body ?? {})) {
      cambios.padreId = req.body.padreId === null ? null : cadena(req.body.padreId) ?? null;
    }

    const carpeta = await moverCarpeta(firmId, String(req.params.id), String(req.params.carpetaId), cambios);
    res.json({ success: true, carpeta });
  } catch (err) {
    fallar(res, err, 'No se pudo guardar la carpeta.');
  }
};

/** DELETE /api/expedientes/:id/carpetas/:carpetaId */
export const borrarCarpetaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    const ido = await borrarCarpeta(firmId, String(req.params.id), String(req.params.carpetaId));

    /*
     * SE DICE EXACTAMENTE QUÉ SE FUE, con números. La pantalla ya lo advirtió
     * antes de borrar; esto es la constancia de lo que efectivamente ocurrió,
     * que no siempre coincide con lo que se advirtió —alguien pudo mover algo
     * entre una cosa y la otra—.
     */
    const partes = [
      ido.subcarpetas > 0 ? `${ido.subcarpetas} subcarpeta(s)` : null,
      ido.documentos > 0 ? `${ido.documentos} documento(s) indexado(s)` : null
    ].filter(Boolean);

    res.json({
      success: true,
      contenido: ido,
      message:
        partes.length > 0
          ? `Se borró la carpeta con ${partes.join(' y ')}.`
          : 'Se borró la carpeta, que estaba vacía.'
    });
  } catch (err) {
    fallar(res, err, 'No se pudo borrar la carpeta.');
  }
};

/** PATCH /api/expedientes/:id/documentos/:documentId/carpeta   { carpetaId | null } */
export const moverDocumentoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    const destino = req.body?.carpetaId === null ? null : cadena(req.body?.carpetaId) ?? null;
    await moverDocumento(firmId, String(req.params.id), String(req.params.documentId), destino);
    res.json({ success: true });
  } catch (err) {
    fallar(res, err, 'No se pudo mover el documento.');
  }
};

/**
 * GET /api/expedientes/:id/carpetas/:carpetaId/contenido
 *
 * Qué se llevaría por delante borrar esta carpeta. Lo pide el diálogo de
 * confirmación ANTES de borrar: una advertencia que dice «se borrará todo lo
 * que contiene» sin decir cuánto es no advierte nada — el abogado no sabe si
 * son dos archivos o trescientas páginas indexadas.
 */
export const contenidoDeCarpetaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const firmId = req.firmId as string;
    await exigirModulo(firmId, 'EXPEDIENTES');
    res.json({
      success: true,
      contenido: await contenidoDeCarpeta(firmId, String(req.params.id), String(req.params.carpetaId))
    });
  } catch (err) {
    fallar(res, err, 'No se pudo consultar el contenido de la carpeta.');
  }
};
