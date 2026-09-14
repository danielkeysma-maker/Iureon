import type { Request, Response } from 'express';
import { BillingError } from '../billing/billing.service';
import type { UsuarioDelEstilo } from './estilo.casos';
import { casosDeEstilo } from './estilo.service';
import { ErrorDeEstilo } from './types';

/**
 * Controladores del estilo de la firma. Traducen HTTP y nada más: el permiso,
 * el cobro, el saneamiento y la auditoría viven en `estilo.casos.ts`, donde
 * `check:estilo-prompt` los prueba.
 *
 * La firma y el rol salen SIEMPRE del token verificado (`req.firmId`,
 * `req.user`), nunca del cuerpo: si el navegador pudiera decir de qué firma es
 * o qué rol tiene, enseñar a toda la firma sería de cualquiera.
 */

const usuarioDe = (req: Request, res: Response): UsuarioDelEstilo | null => {
  if (!req.firmId) {
    res.status(401).json({ success: false, error: 'NO_FIRM', message: 'La sesión no tiene firma.' });
    return null;
  }
  return { firmId: req.firmId, email: req.user?.email ?? 'desconocido', role: req.user?.role ?? null };
};

const fallar = (res: Response, err: unknown): void => {
  if (err instanceof ErrorDeEstilo) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message, descartados: err.descartados ?? [] });
    return;
  }
  if (err instanceof BillingError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message, balance: err.balance });
    return;
  }
  console.error('[ESTILO]', err);
  res.status(500).json({ success: false, error: 'ESTILO_FALLIDO', message: 'No se pudo completar la operación con el formato de la firma.' });
};

const cadenas = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 20) : undefined;

export const perfilDeEstiloController = async (req: Request, res: Response): Promise<void> => {
  const usuario = usuarioDe(req, res);
  if (!usuario) return;
  try {
    const perfil = await casosDeEstilo.perfil({ usuario, rol: req.query.rol, rama: req.query.rama });
    res.json({ success: true, ...perfil });
  } catch (err) {
    fallar(res, err);
  }
};

export const leerFormatoController = async (req: Request, res: Response): Promise<void> => {
  const usuario = usuarioDe(req, res);
  if (!usuario) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const datos = (body.datosDelCaso ?? {}) as Record<string, unknown>;
  try {
    const lectura = await casosDeEstilo.leerFormato({
      usuario,
      texto: body.texto,
      rol: body.rol,
      rama: body.rama,
      documentType: body.documentType,
      datosDelCaso: { partes: cadenas(datos.partes), despachos: cadenas(datos.despachos), radicados: cadenas(datos.radicados) }
    });
    res.json({ success: true, ...lectura });
  } catch (err) {
    fallar(res, err);
  }
};

export const guardarLeccionController = async (req: Request, res: Response): Promise<void> => {
  const usuario = usuarioDe(req, res);
  if (!usuario) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  try {
    const guardada = await casosDeEstilo.guardarLeccion({
      usuario,
      contenido: body.contenido,
      rol: body.rol,
      rama: body.rama,
      fuente: body.fuente,
      documentType: body.documentType
    });
    res.status(201).json({ success: true, ...guardada });
  } catch (err) {
    fallar(res, err);
  }
};

export const retirarLeccionController = async (req: Request, res: Response): Promise<void> => {
  const usuario = usuarioDe(req, res);
  if (!usuario) return;
  try {
    const retirada = await casosDeEstilo.retirarLeccion({ usuario, id: req.params.id });
    res.json({ success: true, ...retirada });
  } catch (err) {
    fallar(res, err);
  }
};
