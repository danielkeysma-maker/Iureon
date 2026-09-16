/**
 * LO QUE CUESTA PREPARAR UN INTERROGATORIO, tal como lo cobra el servidor.
 *
 * ─── POR QUÉ LA CIFRA VIVE AQUÍ Y NO SOLO EN EL BACKEND ────────────────────
 *
 * El precio hay que decirlo ANTES de pulsar, y el servidor solo lo informa
 * DESPUÉS de cobrar (`precioCop` viaja en la respuesta). Pedir una llamada más
 * para pintar un renglón sería cambiar una copia por una espera. La copia se
 * paga con una guarda: el check de este módulo lee `PRICE_COP.INTERROGATORIO` y
 * `SUPLEMENTO_POR_PERSONA` del backend y falla si estas dos constantes se
 * separan de ellos, así que mover el precio en el servidor y olvidar la
 * pantalla —el defecto clásico, un botón que promete un precio viejo— no pasa
 * de la batería.
 */

/** Piso de la tanda, con una sola persona. */
export const PISO_INTERROGATORIO_COP = 2000;
/** Lo que suma cada persona DESPUÉS de la primera. */
export const SUPLEMENTO_POR_PERSONA_COP = 1000;

/**
 * El piso de una tanda de `personas`. Cero personas no es una tanda: se
 * devuelve el piso a secas, que es lo que la pantalla anuncia como tarifa.
 */
export const pisoDeLaTanda = (personas: number): number =>
  PISO_INTERROGATORIO_COP + SUPLEMENTO_POR_PERSONA_COP * Math.max(0, personas - 1);
