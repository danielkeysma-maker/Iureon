/**
 * La agenda de términos de la firma: qué se vence, cuándo, y de quién es.
 *
 * NO ES UN CALENDARIO. El calendario judicial dice qué días son hábiles en
 * Colombia y es idéntico para todo el mundo. Esto dice «el 24 de septiembre se
 * vence la contestación de Mosquera y quedan cuatro días», y es de una sola
 * firma.
 */

/** Cómo se llegó a la fecha límite. */
export type OrigenDeLaFecha = 'CALCULADA' | 'MANUAL';

/** Días hábiles (CGP art. 118) o días de calendario. */
export type TipoDeDias = 'HABILES' | 'CALENDARIO';

export type EstadoDeEntrada = 'PENDIENTE' | 'CUMPLIDA' | 'ARCHIVADA';

/** Los tres momentos en que la firma recibe el aviso. */
export type HitoDeAviso = 5 | 2 | 0;

export interface EntradaDeAgenda {
  id: string;
  firmId: string;
  asunto: string;
  radicado: string | null;
  cliente: string | null;
  actuacionId: string | null;
  actuacionNombre: string;
  rama: string | null;
  fechaNotificacion: string;
  fechaLimite: string;
  diasTermino: number | null;
  tipoDias: TipoDeDias | null;
  /** Verdadero solo si el plazo salió de una ficha con término VERIFICADO. */
  terminoVerificado: boolean;
  origenFecha: OrigenDeLaFecha;
  /** La frase de la ficha de la que se leyó el plazo, si se leyó de una. */
  terminoEvidencia: string | null;
  responsable: string | null;
  estado: EstadoDeEntrada;
  cumplidaEl: string | null;
  notas: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Qué avisos ya salieron, para que la pantalla no prometa uno que ya pasó. */
  avisosEnviados: HitoDeAviso[];
}

/**
 * Lo que el navegador manda para crear o editar una entrada.
 *
 * NO HAY `fechaLimite` CUANDO EL PLAZO SE CALCULA, y esa ausencia es el diseño:
 * el servidor la calcula con el motor de términos a partir de la fecha de
 * notificación y del plazo. Aceptarla del navegador sería dejar que el cliente
 * escogiera su propio vencimiento — y una fecha límite equivocada aquí no
 * produce un error, produce un término perdido en silencio.
 */
export interface EntradaNueva {
  asunto: string;
  radicado?: string | null;
  cliente?: string | null;
  actuacionId?: string | null;
  /** Obligatorio cuando no hay `actuacionId`: la actuación que la firma escribió. */
  actuacionNombre?: string | null;
  rama?: string | null;
  fechaNotificacion: string;
  /**
   * Días del término. Solo cuando el abogado lo escribe porque la ficha no lo
   * fija de forma inequívoca; con una ficha legible, el servidor lo lee de ella
   * y lo que llegue aquí se ignora.
   */
  diasTermino?: number | null;
  tipoDias?: TipoDeDias | null;
  /**
   * La fecha límite escrita a mano. SOLO se acepta cuando no hay plazo que
   * contar — ficha sin catalogar, término no verificado o que no se deja leer
   * en días —. Con plazo legible el servidor la calcula e ignora esta.
   */
  fechaLimiteManual?: string | null;
  responsable?: string | null;
  notas?: string | null;
  /**
   * DE QUE CASO ES ESTE TERMINO.
   *
   * La columna `agenda_terminos.expediente_id` existia desde la migracion de
   * expedientes y solo la escribia «Traer al expediente» — despues y a mano.
   * Un vencimiento pertenece a un caso POR NATURALEZA, asi que puede nacer
   * atado; y cuando llega desde una revision que ya sabe su expediente, se
   * hereda sin preguntar nada.
   *
   * El servicio comprueba que sea de la firma: llega del cuerpo de una
   * peticion.
   */
  expedienteId?: string | null;
}

/** Los campos que una edición puede mover. */
export interface EntradaEditada extends Partial<EntradaNueva> {
  estado?: EstadoDeEntrada;
}

export class AgendaError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'AgendaError';
  }
}
