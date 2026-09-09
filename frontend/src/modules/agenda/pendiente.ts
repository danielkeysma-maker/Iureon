/**
 * LO QUE UN BORRADOR O UNA REVISIÓN LE PASAN A LA AGENDA AL PULSAR
 * «PONER EN LA AGENDA».
 *
 * ─── POR QUÉ NO ES UN PROP QUE ATRAVIESE MEDIA APLICACIÓN ───────────────────
 *
 * El origen —Borradores, Revisiones— y el destino —la agenda, que vive dentro
 * de Herramientas— no se conocen y no tienen por qué. Hacer viajar estos cuatro
 * campos como props obligaría a `App.tsx` a sostener un estado más y a las dos
 * pantallas de origen a saber dónde vive la agenda. Se pasa por
 * `sessionStorage`, igual que la pantalla recordada de cada módulo.
 *
 * ─── SE CONSUME UNA VEZ Y SE OLVIDA ─────────────────────────────────────────
 *
 * `tomar()` lee y borra en el mismo movimiento. Si se quedara, el formulario
 * volvería a nacer con el borrador de la semana pasada cada vez que alguien
 * abre la agenda, y el abogado guardaría un vencimiento del caso equivocado
 * sin darse cuenta de dónde salió.
 *
 * ─── IDENTIFICADORES Y ETIQUETAS, NUNCA UN PLAZO NI UNA FECHA ───────────────
 *
 * Aquí viaja QUÉ actuación y de qué caso, no cuánto dura su término: el plazo
 * lo lee el servidor de la ficha del catálogo al guardar. Mandar un plazo desde
 * el navegador sería dejar que el cliente escoja su propio vencimiento.
 */

const CLAVE = 'iureon.agenda.pendiente';

export interface AgendaPendiente {
  /** De dónde vino, para poder decirlo en el formulario. */
  origen: 'BORRADOR' | 'REVISION';
  /** El asunto propuesto: cliente y despacho, o el título del escrito. */
  asunto: string;
  cliente?: string | null;
  radicado?: string | null;
  /** El id de la ficha del catálogo, cuando el escrito se redactó contra una. */
  actuacionId?: string | null;
  actuacionNombre?: string | null;
  rama?: string | null;
}

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
    return {
      origen: valor.origen === 'REVISION' ? 'REVISION' : 'BORRADOR',
      asunto: valor.asunto,
      cliente: valor.cliente ?? null,
      radicado: valor.radicado ?? null,
      actuacionId: valor.actuacionId ?? null,
      actuacionNombre: valor.actuacionNombre ?? null,
      rama: valor.rama ?? null
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
