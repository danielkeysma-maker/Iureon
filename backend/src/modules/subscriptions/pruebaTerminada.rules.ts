import { DIAS_DE_PRUEBA_GRATUITA } from '../trial/trial.rules';

/**
 * Lo que una firma con la prueba gratuita TERMINADA todavía puede pedir, sin
 * I/O, para que `acceso.check.ts` lo pruebe sin base de datos.
 *
 * LA LISTA ES EXACTA Y CORTA A PROPÓSITO. El titular decidió el 14 de
 * septiembre de 2026 que una prueba que terminó sin pagar pierde todo el
 * acceso: le queda la sesión (entrar y renovar el token son rutas públicas,
 * montadas antes de `authMiddleware`, así que no pasan por aquí), saber quién
 * es (`/auth/me`), leer su plan y comprar uno. El webhook que confirma el pago
 * es de Wompi y también es público. Cualquier ruta que se agregue mañana queda
 * CERRADA para esta firma sin que nadie tenga que acordarse — que es
 * exactamente lo que la promesa de la prueba («nada») exige.
 */
/*
 * Y BORRAR SUS DATOS, AUNQUE NO PUEDA USAR NADA MÁS. Decisión del titular, el
 * mismo 14 de septiembre: la firma que perdió la prueba sin pagar conserva una
 * sola cosa además de comprar, que es borrar lo suyo. No es una concesión: bajo
 * la Ley 1581 de 2012 el titular de los datos tiene derecho a pedir su
 * supresión, y cerrarle la puerta de borrado a quien ya no puede entrar sería
 * retener sus datos contra su voluntad. Las dos rutas vuelven a pedir la
 * contraseña en el servidor, y borrar la firma exige además su nombre exacto,
 * así que abrirlas no abre un borrado sin confirmar.
 */
export const RUTAS_ABIERTAS_CON_PRUEBA_TERMINADA: readonly string[] = [
  'GET /api/auth/me',
  'GET /api/subscription/plan',
  'POST /api/subscription/checkout',
  'DELETE /api/auth/me',
  'DELETE /api/firms/me'
];

/**
 * Si la petición está en la lista. Se compara método y camino completo; la
 * barra final se ignora porque Express enruta `/api/auth/me/` igual que
 * `/api/auth/me`, y cerrar una y abrir la otra sería una puerta lateral al
 * revés: la firma quedaría sin poder leer su plan por una barra.
 */
export const rutaAbiertaConPruebaTerminada = (metodo: string, camino: string): boolean => {
  const limpio = camino.length > 1 ? camino.replace(/\/+$/, '') : camino;
  return RUTAS_ABIERTAS_CON_PRUEBA_TERMINADA.includes(`${metodo.toUpperCase()} ${limpio}`);
};

/** La frase del 403. Los días salen de la constante de la prueba, nunca escritos a mano. */
export const MENSAJE_PRUEBA_TERMINADA =
  `La prueba gratuita de ${DIAS_DE_PRUEBA_GRATUITA} días terminó. ` +
  'El trabajo de la firma se conserva y no se ha borrado nada; para volver a entrar, contrate un plan en «Plan de la firma».';
