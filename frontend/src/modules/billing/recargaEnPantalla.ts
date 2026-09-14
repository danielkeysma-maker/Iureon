import type { Recharge } from './billing.api';

/**
 * La recarga de saldo, en funciones puras: lo que la pantalla dice de cada
 * estado del pago y de cada monto, sin React, para que un check lo pruebe.
 *
 * ─── LAS CIFRAS NO SE ESCRIBEN AQUÍ ─────────────────────────────────────────
 *
 * El mínimo y el costo medio por escrito llegan del servidor en cada lectura
 * del saldo. Los montos sugeridos se derivan del mínimo (1×, 2× y 5×): si el
 * servidor mueve el mínimo, las tres opciones se mueven con él, en vez de
 * ofrecer una opción que el servidor rechaza con BELOW_MINIMUM.
 */

export const pesos = (valor: number): string => {
  const abs = Math.round(Math.abs(valor)).toLocaleString('es-CO');
  return valor < 0 ? `−$${abs}` : `$${abs}`;
};

/** Tres montos a partir del mínimo del servidor. Sin mínimo leído, ninguno. */
export const montosSugeridos = (minimo: number): number[] =>
  minimo > 0 ? [minimo, minimo * 2, minimo * 5] : [];

/**
 * Cuántos escritos compra un monto al costo medio que calculó el servidor.
 * `null` cuando no hay costo medio: dividir por cero no es un número de escritos.
 */
export const escritosQueAlcanzan = (monto: number, costoMedio: number): number | null =>
  costoMedio > 0 ? Math.floor(monto / costoMedio) : null;

/** Solo dígitos: un separador de miles tecleado a mano cambia la cifra al leerla, y es plata. */
export const leerMonto = (texto: string): number => Number(texto.replace(/[^\d]/g, '')) || 0;

/* ─── LOS ESTADOS DEL PAGO ─────────────────────────────────────────────────── */

/**
 * Los estados son los que el servidor escribe en `payment_intents`: PENDING al
 * crear la intención, y lo que diga el evento de Wompi después (APPROVED,
 * DECLINED, VOIDED, ERROR). NO HAY «VENCIDO»: el servidor no vence intenciones,
 * así que la pantalla no inventa ese estado.
 */
export type EstadoDeRecarga = 'esperando' | 'aprobada' | 'rechazada' | 'anulada' | 'fallida';

export const estadoDeRecarga = (status: string): EstadoDeRecarga => {
  switch (status) {
    case 'PENDING':
      return 'esperando';
    case 'APPROVED':
      return 'aprobada';
    case 'DECLINED':
      return 'rechazada';
    case 'VOIDED':
      return 'anulada';
    // ERROR y cualquier estado que el servidor aprenda después: nunca se pinta como aprobado.
    default:
      return 'fallida';
  }
};

/**
 * Lo que se dice de cada estado. «Los errores dicen si se cobró o no» (README
 * §3): un rechazo de Wompi no cobra; una anulación o un error solo permiten
 * afirmar lo que consta aquí, que el saldo no entró.
 *
 * LA ESPERA NO PIDE DEJAR LA VENTANA ABIERTA. El artboard decía «No cierre esta
 * ventana», y es falso en este sistema: el saldo lo acredita el servidor cuando
 * Wompi llama al webhook, esté o no la pestaña abierta. Pedirlo asustaría a
 * quien cerró el teléfono creyendo haber perdido el pago.
 */
export const textoDelEstado = (estado: EstadoDeRecarga): { titulo: string; detalle: string } => {
  switch (estado) {
    case 'esperando':
      return {
        titulo: 'Esperando la confirmación del pago',
        detalle:
          'Si Wompi aprueba el pago, el saldo entra solo, aunque cierre esta ventana. Si salió de la pasarela sin pagar, este intento no le cobra nada.'
      };
    case 'aprobada':
      return { titulo: 'Saldo recargado', detalle: 'Wompi aprobó el pago y el saldo ya entró.' };
    case 'rechazada':
      return {
        titulo: 'El pago fue rechazado',
        detalle: 'Wompi no aprobó la transacción y no se le cobró nada. Puede intentar con otro medio de pago.'
      };
    case 'anulada':
      return { titulo: 'El pago fue anulado', detalle: 'Wompi anuló la transacción y el saldo no se acreditó.' };
    case 'fallida':
      return { titulo: 'El pago no se completó', detalle: 'La pasarela reportó un error y el saldo no se acreditó.' };
  }
};

export const buscarIntento = (recargas: Recharge[], referencia: string): Recharge | null =>
  recargas.find((r) => r.reference === referencia) ?? null;

/* ─── LA REFERENCIA, RECORDADA EN LA PESTAÑA ───────────────────────────────── */

/**
 * AL VOLVER DE WOMPI LA APLICACIÓN ARRANCA DE CERO. El checkout es otra página:
 * la pestaña se va y regresa por la dirección de retorno, sin estado de React.
 * La referencia se guarda en `sessionStorage` ANTES de saltar —vive lo que viva
 * la pestaña y no la ve otra— y así, al volver, Saldo se abre solo sobre ESE
 * intento. No se guarda en `localStorage`: un intento abandonado hace una
 * semana no debe abrir Saldo cada vez que se entra.
 */
export const CLAVE_RECARGA_EN_CURSO = 'iureon.recargaEnCurso';

type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const almacenDeLaPestana = (): Almacen | null => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

/* Un almacenamiento bloqueado (ventana privada, vista previa) no puede romper el pago. */
export const guardarRecargaEnCurso = (referencia: string, almacen: Almacen | null = almacenDeLaPestana()): void => {
  try {
    almacen?.setItem(CLAVE_RECARGA_EN_CURSO, referencia);
  } catch {
    /* sin memoria de pestaña: la recarga sigue, solo no se reabre sola al volver */
  }
};

export const leerRecargaEnCurso = (almacen: Almacen | null = almacenDeLaPestana()): string | null => {
  try {
    return almacen?.getItem(CLAVE_RECARGA_EN_CURSO) || null;
  } catch {
    return null;
  }
};

export const olvidarRecargaEnCurso = (almacen: Almacen | null = almacenDeLaPestana()): void => {
  try {
    almacen?.removeItem(CLAVE_RECARGA_EN_CURSO);
  } catch {
    /* nada que olvidar */
  }
};

/** Para el estado inicial de App: ¿esta pestaña vuelve de un pago? */
export const hayRecargaPorConfirmar = (): boolean => leerRecargaEnCurso() !== null;
