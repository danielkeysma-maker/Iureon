import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { config } from '../../config/env.config';
import { correrAvisosDelDia } from './avisosDelDia.service';

/**
 * LA RUTA QUE SOLO PUEDE INVOCAR LA PLATAFORMA.
 *
 * ─── CÓMO SE PROTEGE, Y POR QUÉ ASÍ ─────────────────────────────────────────
 *
 * No había convención de trabajos programados en este proyecto: esta es la
 * primera ruta que no la llama una persona con sesión sino Vercel. Se adopta la
 * convención del propio proveedor, porque es la única que él sabe cumplir sin
 * escribir código: definida la variable `CRON_SECRET`, Vercel invoca los
 * caminos declarados en `crons` de `vercel.json` con la cabecera
 * `Authorization: Bearer <CRON_SECRET>`. Aquí se comprueba esa cabecera.
 *
 * Va montada ANTES del middleware de sesión: la plataforma no tiene token de
 * Supabase ni firma, igual que el webhook de Wompi. Su autenticación es el
 * secreto y nada más, así que el secreto ES la cerradura.
 *
 * SIN SECRETO CONFIGURADO RESPONDE 503 Y NO CORRE. Dejarla abierta cuando falta
 * la variable convertiría un olvido en un endpoint público capaz de disparar
 * avisos al teléfono de todas las firmas, respondiendo 200 y sin ruido alguno.
 *
 * La comparación es en tiempo constante: `===` sobre cadenas termina en cuanto
 * difieren, y ese tiempo es información sobre el secreto.
 *
 * ─── POR QUÉ RESPONDE 200 AUNQUE ALGO FALLE ─────────────────────────────────
 *
 * El resumen viaja en el cuerpo. Un error de una firma no debe abortar la
 * pasada de las demás —`correrAvisosDelDia` sigue de largo y lo registra— y un
 * 500 solo conseguiría que la plataforma reintente la pasada entera, que ya es
 * idempotente pero no gratis.
 */

const secretoCorrecto = (req: Request): boolean => {
  const cabecera = req.headers.authorization ?? '';
  const esperado = `Bearer ${config.cron.secret}`;
  const a = Buffer.from(cabecera);
  const b = Buffer.from(esperado);
  // `timingSafeEqual` exige la misma longitud; una distinta ya es un fallo.
  return a.length === b.length && timingSafeEqual(a, b);
};

export const avisosDelDiaController = async (req: Request, res: Response): Promise<void> => {
  if (!config.cron.enabled) {
    res.status(503).json({
      success: false,
      error: 'CRON_DISABLED',
      message: 'El trabajo diario no está configurado: falta CRON_SECRET en el servidor.'
    });
    return;
  }

  if (!secretoCorrecto(req)) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'No autorizado.' });
    return;
  }

  try {
    /*
     * TODO CON `await` ANTES DE RESPONDER. Una función serverless se congela al
     * enviar la respuesta: lanzar la pasada «en segundo plano» y contestar en
     * el acto equivale, en producción, a no mandar ningún aviso.
     */
    const resumen = await correrAvisosDelDia();
    res.json({ success: true, result: resumen });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error inesperado.';
    console.error('[AGENDA][CRON] La pasada diaria falló:', mensaje);
    res.status(200).json({ success: false, error: 'SWEEP_FAILED', message: mensaje });
  }
};
