import type { AgendaPendiente, UnidadDelContador } from './pendiente';
import type { OrigenDeLaFecha, TipoDeDias } from './types';

/**
 * DEL CONTADOR DE TÉRMINOS A LA AGENDA, SIN REACT.
 *
 * Tres decisiones que pueden equivocarse en silencio y por eso viven aquí,
 * puras y con su check (`npm run check:agenda-contador`):
 *
 * 1. QUÉ SE LLEVA. Los datos que produjeron la cuenta —notificación, cantidad,
 *    clase de término, jurisdicción— y lo que el abogado dijo que se vence.
 *    Nunca una ficha del catálogo: el contador no contó contra ninguna.
 *
 * 2. CÓMO NACE EL FORMULARIO. Con esos datos puestos, para revisarlos, no para
 *    guardarlos sin mirar. Y sin buscar una ficha por el nombre escrito: el
 *    formulario lo hace con lo que trae un borrador, pero aquí convertiría
 *    «Contestación de la demanda» en la ficha del catálogo y cambiaría el plazo
 *    que el abogado contó por el de la ficha, sin que él lo pidiera.
 *
 * 3. CÓMO QUEDARÁ MARCADO. Lo mismo que decide el servidor al guardar: solo la
 *    ficha legible del catálogo verifica. Un plazo escrito, o una fecha a mano,
 *    queda sin verificar — que es siempre el caso del contador.
 */

export interface CuentaDelContador {
  notifiedDate: string;
  termInDays: number;
  termUnit: UnidadDelContador;
  jurisdictionType: string;
  dueDate: string;
  /** «Qué se vence», si el abogado lo escribió en el contador. */
  descripcion?: string;
}

export const pendienteDesdeElContador = (c: CuentaDelContador): AgendaPendiente => {
  const descripcion = (c.descripcion ?? '').trim();
  return {
    origen: 'CONTADOR',
    asunto: descripcion,
    cliente: null,
    radicado: null,
    actuacionId: null,
    actuacionNombre: descripcion || null,
    /* La jurisdicción del contador es la rama: decide la Semana Santa en penal, igual en los dos motores. */
    rama: c.jurisdictionType || null,
    expedienteId: null,
    plazo: {
      fechaNotificacion: c.notifiedDate,
      cantidad: c.termInDays,
      unidad: c.termUnit,
      venceSegunElContador: c.dueDate
    }
  };
};

export interface ValoresInicialesDeLaAgenda {
  asunto: string;
  cliente: string;
  radicado: string;
  expedienteId: string;
  rama: string;
  actuacionId: string;
  nombreSinCatalogar: string;
  fechaNotificacion: string;
  dias: string;
  tipoDias: TipoDeDias;
  fechaManual: string;
  /** Si el formulario puede atar la actuación a una ficha por su nombre exacto. */
  resolverActuacionPorNombre: boolean;
}

export const esPlazoEnDias = (unidad: UnidadDelContador): boolean =>
  unidad === 'DIAS_HABILES' || unidad === 'DIAS_CALENDARIO';

export const valoresInicialesDelFormulario = (
  pendiente: AgendaPendiente | null,
  hoy: string
): ValoresInicialesDeLaAgenda => {
  const plazo = pendiente?.plazo ?? null;
  const enDias = plazo !== null && esPlazoEnDias(plazo.unidad);
  return {
    asunto: pendiente?.asunto ?? '',
    cliente: pendiente?.cliente ?? '',
    radicado: pendiente?.radicado ?? '',
    expedienteId: pendiente?.expedienteId ?? '',
    rama: pendiente?.rama ?? '',
    actuacionId: pendiente?.actuacionId ?? '',
    nombreSinCatalogar: pendiente?.actuacionId ? '' : (pendiente?.actuacionNombre ?? ''),
    fechaNotificacion: plazo?.fechaNotificacion ?? hoy,
    dias: plazo !== null && enDias ? String(plazo.cantidad) : '',
    tipoDias: plazo?.unidad === 'DIAS_CALENDARIO' ? 'CALENDARIO' : 'HABILES',
    /* Meses o años: la agenda no los cuenta; la fecha del contador llega escrita, a la vista. */
    fechaManual: plazo !== null && !enDias ? plazo.venceSegunElContador : '',
    resolverActuacionPorNombre: pendiente?.origen !== 'CONTADOR'
  };
};

/**
 * Cómo quedará marcada la entrada. Espejo de `resolverVencimiento` en el
 * servidor (agenda.service.ts): (a) ficha legible → verificada; (b) plazo
 * escrito → calculada, sin verificar; (c) fecha a mano → manual, sin verificar.
 */
export const comoQuedaraElTermino = (e: {
  actuacionId: string | null;
  lecturaLegible: boolean;
  dias: number;
  fechaManual: string;
}): { verificado: boolean; origen: OrigenDeLaFecha | null } => {
  if (e.actuacionId && e.lecturaLegible) return { verificado: true, origen: 'CALCULADA' };
  if (Number.isFinite(e.dias) && e.dias > 0) return { verificado: false, origen: 'CALCULADA' };
  if (e.fechaManual) return { verificado: false, origen: 'MANUAL' };
  return { verificado: false, origen: null };
};

/**
 * EL CONTADOR Y LA AGENDA TIENEN QUE LLEGAR A LA MISMA FECHA. Si con los mismos
 * datos no llegan —la rama cambiada a penal, por ejemplo—, se dice en vez de
 * guardar en silencio una fecha distinta de la que el abogado vio. Si el
 * abogado ya cambió los datos, la diferencia es suya y no se avisa.
 */
export const avisoDeDiscrepancia = (
  pendiente: AgendaPendiente | null,
  actual: { fechaNotificacion: string; dias: string; tipoDias: TipoDeDias; fechaPrevista: string | null }
): string | null => {
  const plazo = pendiente?.plazo;
  if (!plazo || !esPlazoEnDias(plazo.unidad) || !actual.fechaPrevista) return null;
  const mismosDatos =
    actual.fechaNotificacion === plazo.fechaNotificacion &&
    Number(actual.dias) === plazo.cantidad &&
    actual.tipoDias === (plazo.unidad === 'DIAS_CALENDARIO' ? 'CALENDARIO' : 'HABILES');
  if (!mismosDatos || actual.fechaPrevista === plazo.venceSegunElContador) return null;
  return `El contador dio el ${plazo.venceSegunElContador} y la agenda calcula el ${actual.fechaPrevista} con los mismos datos. Revise la rama elegida —en penal la Semana Santa cuenta distinto— antes de guardar.`;
};
