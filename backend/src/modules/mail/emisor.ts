/**
 * Quién emite la cuenta de cobro de la suscripción — copia del servidor.
 *
 * GEMELO DE `frontend/src/modules/subscriptions/emisor.ts`. Los dos archivos
 * deben cambiar JUNTOS: el navegador genera la cuenta de cobro que la firma
 * descarga desde la pantalla de plan, y el servidor genera la misma cuenta para
 * adjuntarla al correo de confirmación. Si difieren, el contador de la firma
 * recibe dos documentos con el mismo número y distinto emisor, que es peor que
 * no recibir ninguno.
 *
 * Vive en una constante y no en la base porque es un dato del operador de la
 * plataforma, no de la firma cliente: cambia cuando cambia el titular, no
 * cuando cambia un usuario. Los valores los entregó el titular el 4 de
 * septiembre de 2026.
 */
export const EMISOR = {
  nombreComercial: 'Iureon',
  titular: 'Daniel David Madera Arroyo',
  documento: 'C.C. 1102811692 de Sincelejo, Sucre',
  nit: '1102811692-8',
  ciudad: 'Sincelejo, Sucre',
  correo: 'ingdanielma@gmail.com'
} as const;
