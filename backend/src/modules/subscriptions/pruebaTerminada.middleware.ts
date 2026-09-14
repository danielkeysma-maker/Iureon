import type { NextFunction, Request, Response } from 'express';
import { accesoDeFirma } from './plan.service';
import { MENSAJE_PRUEBA_TERMINADA, rutaAbiertaConPruebaTerminada } from './pruebaTerminada.rules';

/**
 * Cierra TODA la API a una firma cuya prueba gratuita terminó sin pagar,
 * salvo la lista de `pruebaTerminada.rules.ts`.
 *
 * POR QUÉ ES GLOBAL CON UNA LISTA DE PERMITIDAS, CUANDO `bloquearSiPlanVencido`
 * ES RUTA POR RUTA. Las dos promesas son inversas. A la firma que PAGÓ y se
 * venció se le promete «puede leer todo lo que tiene»: ahí lo cerrado es la
 * excepción, y una guarda global cerraría por defecto la próxima ruta de
 * lectura que alguien agregue. A la PRUEBA que terminó el titular le promete
 * «nada» (decisión del 14 de septiembre de 2026): ahí lo abierto es la
 * excepción, y una guarda ruta por ruta dejaría ABIERTA por defecto cada ruta
 * nueva que alguien olvide marcar. Cada guarda pone el valor por defecto del
 * lado de su promesa.
 *
 * POR QUÉ FALLA ABIERTA. Si no hay firma en la petición, si quien llama es el
 * superusuario, si la fila del plan no se lee (`leerPlan` la trata como
 * CORTESÍA), si la consulta de pagos falla (`firmaPagoAlgunaVez` devuelve
 * `null` y `accesoDeLaFirma` lo lee como pagada) o si cualquier otra cosa lanza
 * aquí, la petición SIGUE. Un apagón nunca puede dejar por fuera a un cliente
 * que paga: la misma doctrina de `planVigente.middleware.ts`.
 *
 * POR QUÉ 403 Y NO 402. A la firma no se le cobra por leer lo suyo: la puerta
 * está cerrada, y la pantalla convierte `PRUEBA_TERMINADA` en la de bloqueo,
 * cuya única salida es contratar.
 */
export const bloquearPruebaTerminada = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const firmId = req.firmId;
  if (!firmId || req.user?.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  if (rutaAbiertaConPruebaTerminada(req.method, `${req.baseUrl}${req.path}`)) {
    next();
    return;
  }

  try {
    if ((await accesoDeFirma(firmId)) === 'PRUEBA_TERMINADA') {
      res.status(403).json({ success: false, error: 'PRUEBA_TERMINADA', message: MENSAJE_PRUEBA_TERMINADA });
      return;
    }
  } catch (err) {
    console.error(
      '[PLAN] No se pudo comprobar si la prueba terminó; la petición sigue:',
      err instanceof Error ? err.message : err
    );
  }

  next();
};
