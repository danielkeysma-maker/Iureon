/**
 * LO QUE UN BORRADOR, UNA REVISIÓN O EL CONTADOR DE TÉRMINOS LE PASAN A LA
 * AGENDA AL PULSAR «PONER EN LA AGENDA».
 *
 * ─── POR QUÉ NO ES UN PROP QUE ATRAVIESE MEDIA APLICACIÓN ───────────────────
 *
 * El origen —Borradores, Revisiones, el contador— y el destino —la agenda, que
 * vive dentro de Herramientas— no se conocen y no tienen por qué. Hacer viajar
 * estos campos como props obligaría a `App.tsx` a sostener un estado más y a
 * las pantallas de origen a saber dónde vive la agenda. Se pasa por
 * `sessionStorage`, igual que la pantalla recordada de cada módulo.
 *
 * ─── SE CONSUME UNA VEZ Y SE OLVIDA ─────────────────────────────────────────
 *
 * `tomar()` lee y borra en el mismo movimiento. Si se quedara, el formulario
 * volvería a nacer con el borrador de la semana pasada cada vez que alguien
 * abre la agenda, y el abogado guardaría un vencimiento del caso equivocado
 * sin darse cuenta de dónde salió.
 *
 * ─── DE UN BORRADOR O UNA REVISIÓN: IDENTIFICADORES, NUNCA UN PLAZO ─────────
 *
 * Aquí viaja QUÉ actuación y de qué caso, no cuánto dura su término: el plazo
 * lo lee el servidor de la ficha del catálogo al guardar. Mandar un plazo desde
 * el navegador sería dejar que el cliente escoja su propio vencimiento.
 *
 * ─── DEL CONTADOR: EL PLAZO QUE EL ABOGADO ESCRIBIÓ, Y POR ESO SIN VERIFICAR ─
 *
 * El contador no cuenta contra una ficha: cuenta los días que el abogado le
 * escribe. Llevar ESOS datos —la fecha de notificación, la cantidad y la clase
 * de término— no es escoger un vencimiento a espaldas del catálogo, porque no
 * hay catálogo detrás; es no obligarlo a escribirlos dos veces. Nunca viaja un
 * `actuacionId`, así que el servidor no puede marcar la entrada verificada, y
 * la fecha se vuelve a calcular allá con el mismo motor. La única fecha que
 * viaja es la de un término de meses o de años, que la agenda no cuenta: llega
 * como fecha escrita a mano, a la vista del abogado, y queda sin verificar.
 */

const CLAVE = 'iureon.agenda.pendiente';

/** Las clases de término del contador; los mismos nombres que su API. */
export type UnidadDelContador = 'DIAS_HABILES' | 'DIAS_CALENDARIO' | 'MESES' | 'ANIOS';

export interface PlazoDelContador {
  fechaNotificacion: string;
  cantidad: number;
  unidad: UnidadDelContador;
  /** La fecha que dio el contador, para comprobar que la agenda llega a la misma. */
  venceSegunElContador: string;
}

export interface AgendaPendiente {
  /** De dónde vino, para poder decirlo en el formulario. */
  origen: 'BORRADOR' | 'REVISION' | 'CONTADOR';
  /** El asunto propuesto: cliente y despacho, el título del escrito o lo que se vence. */
  asunto: string;
  cliente?: string | null;
  radicado?: string | null;
  /** El id de la ficha del catálogo, cuando el escrito se redactó contra una. */
  actuacionId?: string | null;
  actuacionNombre?: string | null;
  rama?: string | null;
  /**
   * EL CASO, HEREDADO DEL ORIGEN.
   *
   * Un vencimiento que sale de una revisión atada a un expediente pertenece a
   * ese mismo caso: preguntarlo otra vez sería pedir un dato que la fila de
   * origen ya trae. Viaja vacío cuando el origen no lo sabe, y entonces el
   * formulario lo pregunta como cualquier otro campo.
   *
   * Es un IDENTIFICADOR: el servidor comprueba que el expediente sea de la
   * firma antes de guardar nada.
   */
  expedienteId?: string | null;
  /** Solo del contador: lo que el abogado le escribió. Ver la cabecera. */
  plazo?: PlazoDelContador | null;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UNIDADES: readonly UnidadDelContador[] = ['DIAS_HABILES', 'DIAS_CALENDARIO', 'MESES', 'ANIOS'];

/** Un plazo leído del almacenamiento se valida entero, o no viaja. */
export const plazoValido = (valor: unknown): PlazoDelContador | null => {
  if (!valor || typeof valor !== 'object') return null;
  const p = valor as Partial<PlazoDelContador>;
  if (typeof p.fechaNotificacion !== 'string' || !ISO.test(p.fechaNotificacion)) return null;
  if (typeof p.venceSegunElContador !== 'string' || !ISO.test(p.venceSegunElContador)) return null;
  if (typeof p.cantidad !== 'number' || !Number.isInteger(p.cantidad) || p.cantidad <= 0) return null;
  if (!UNIDADES.includes(p.unidad as UnidadDelContador)) return null;
  return {
    fechaNotificacion: p.fechaNotificacion,
    cantidad: p.cantidad,
    unidad: p.unidad as UnidadDelContador,
    venceSegunElContador: p.venceSegunElContador
  };
};

export const dejarPendiente = (pendiente: AgendaPendiente): void => {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(pendiente));
  } catch {
    /* Modo privado o almacenamiento apagado: la agenda se abre igual, vacía. */
  }
};

export const tomarPendiente = (): AgendaPendiente | null => {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    sessionStorage.removeItem(CLAVE);
    if (!crudo) return null;
    const valor = JSON.parse(crudo) as Partial<AgendaPendiente>;
    if (!valor || typeof valor.asunto !== 'string') return null;
    const origen = valor.origen === 'REVISION' || valor.origen === 'CONTADOR' ? valor.origen : 'BORRADOR';
    return {
      origen,
      asunto: valor.asunto,
      cliente: valor.cliente ?? null,
      radicado: valor.radicado ?? null,
      /* Del contador nunca llega una ficha: si llegara, no se cree. */
      actuacionId: origen === 'CONTADOR' ? null : (valor.actuacionId ?? null),
      actuacionNombre: valor.actuacionNombre ?? null,
      rama: valor.rama ?? null,
      expedienteId: valor.expedienteId ?? null,
      plazo: origen === 'CONTADOR' ? plazoValido(valor.plazo) : null
    };
  } catch {
    return null;
  }
};

/** Sin consumirlo: para que Herramientas sepa que debe abrir la agenda al entrar. */
export const hayPendiente = (): boolean => {
  try {
    return sessionStorage.getItem(CLAVE) !== null;
  } catch {
    return false;
  }
};
