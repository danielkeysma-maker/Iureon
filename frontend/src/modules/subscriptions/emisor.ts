/**
 * Quién emite la cuenta de cobro de la suscripción.
 *
 * Es un dato del operador de la plataforma, no de la firma cliente, y por eso
 * vive en una constante y no en la base: cambia cuando cambia el titular, no
 * cuando cambia un usuario. Los valores los entregó el titular el 4 de
 * septiembre de 2026; si alguno cambia, se cambia aquí y aplica a todas las
 * cuentas de cobro que se generen desde ese momento (las ya descargadas no se
 * reescriben, porque un documento entregado no se edita).
 */
export const EMISOR = {
  nombreComercial: 'Iureon',
  titular: 'Daniel David Madera Arroyo',
  documento: 'C.C. 1102811692 de Sincelejo, Sucre',
  nit: '1102811692-8',
  ciudad: 'Sincelejo, Sucre',
  correo: 'ingdanielma@gmail.com'
} as const;
