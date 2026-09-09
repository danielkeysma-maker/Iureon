import { Request, Response } from 'express';
import {
  borrar,
  calcularFechaLimite,
  consultarPlazo,
  crear,
  editar,
  listar
} from './agenda.service';
import { AgendaError, type EstadoDeEntrada, type TipoDeDias } from './types';

/** El correo y la firma salen del token verificado, nunca del cuerpo. */
const identidad = (req: Request): { firmId: string; userEmail: string } => {
  const firmId = req.firmId;
  const userEmail = req.user?.email;
  if (!firmId || !userEmail) {
    throw new AgendaError('UNAUTHORIZED', 'Se requiere una sesión válida.', 401);
  }
  return { firmId, userEmail };
};

const ip = (req: Request): string | null =>
  (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? null;

const responder = (res: Response, error: unknown): void => {
  if (error instanceof AgendaError) {
    res.status(error.status).json({ success: false, error: error.code, message: error.message });
    return;
  }
  const mensaje = error instanceof Error ? error.message : 'Error inesperado en la agenda.';
  console.error('[AGENDA]', mensaje);
  res.status(500).json({ success: false, error: 'AGENDA_ERROR', message: mensaje });
};

export const listarAgendaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firmId } = identidad(req);
    const estado = typeof req.query.estado === 'string' ? (req.query.estado as EstadoDeEntrada | 'TODAS') : 'TODAS';
    const entradas = await listar(firmId, { estado });
    res.json({ success: true, result: entradas });
  } catch (error) {
    responder(res, error);
  }
};

/**
 * Qué dice el catálogo del plazo de una actuación, ANTES de guardar nada.
 *
 * La pantalla lo pregunta al elegir la actuación para saber qué ofrecer: el
 * cálculo automático cuando la ficha deja leer un plazo inequívoco, o el
 * término literal y la razón de la negativa cuando no. Es una lectura del
 * catálogo con la curaduría de la firma aplicada, así que no toca el plan.
 */
export const plazoDeActuacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firmId } = identidad(req);
    const actuacionId = typeof req.query.actuacionId === 'string' ? req.query.actuacionId : '';
    if (!actuacionId) {
      res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Falta la actuación.' });
      return;
    }
    res.json({ success: true, result: await consultarPlazo(firmId, actuacionId) });
  } catch (error) {
    responder(res, error);
  }
};

/**
 * La vista previa del vencimiento: qué fecha da ese plazo desde esa
 * notificación, y qué días se descontaron. No guarda nada.
 *
 * Existe para que el abogado vea la cuenta antes de aceptarla — es el mismo
 * principio del contador de términos, que muestra qué descontó y por qué en vez
 * de entregar una fecha desnuda.
 */
export const previsualizarVencimientoController = async (req: Request, res: Response): Promise<void> => {
  try {
    identidad(req);
    const { fechaNotificacion, dias, tipoDias, rama } = req.body ?? {};
    const resultado = calcularFechaLimite(
      String(fechaNotificacion ?? ''),
      Number(dias),
      (tipoDias === 'CALENDARIO' ? 'CALENDARIO' : 'HABILES') as TipoDeDias,
      typeof rama === 'string' && rama ? rama : null
    );
    res.json({ success: true, result: resultado });
  } catch (error) {
    responder(res, error);
  }
};

export const crearEnAgendaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firmId, userEmail } = identidad(req);
    const entrada = await crear({ firmId, userEmail, datos: req.body ?? {}, ipAddress: ip(req) });
    res.status(201).json({ success: true, result: entrada });
  } catch (error) {
    responder(res, error);
  }
};

export const editarEnAgendaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firmId, userEmail } = identidad(req);
    const entrada = await editar({ firmId, userEmail, id: String(req.params.id), datos: req.body ?? {} });
    res.json({ success: true, result: entrada });
  } catch (error) {
    responder(res, error);
  }
};

export const borrarDeAgendaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firmId, userEmail } = identidad(req);
    await borrar({ firmId, userEmail, id: String(req.params.id), ipAddress: ip(req) });
    res.json({ success: true });
  } catch (error) {
    responder(res, error);
  }
};
