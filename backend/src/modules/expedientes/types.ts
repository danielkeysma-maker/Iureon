/**
 * EL EXPEDIENTE: un asunto del despacho, y la primera cosa de esta plataforma
 * que puede señalar a todas las demás.
 *
 * ─── LO QUE HABÍA ANTES, Y POR QUÉ NO ALCANZABA ────────────────────────────
 *
 * La plataforma tenía TRES formas de decir «este caso», y ninguna sabía de las
 * otras dos: una llave real (`transcriptions.client_id`), un `cliente` de texto
 * libre en revisiones, borradores y agenda, y un `radicado` de texto libre en
 * borradores y agenda. El mismo asunto podía ser «Mosquera» en un borrador,
 * «Mosquera vs. ACME» en la agenda y un UUID en una entrevista.
 *
 * La consecuencia no era de orden sino de producto: el motor recibía cada
 * petición huérfana, y el abogado volvía a escribir el contexto que ya había
 * escrito tres veces. Las preguntas de audiencia lo declaran en su propio
 * prompt — «no conoces el expediente, las pruebas, a las partes ni a los
 * testigos»— y ésa es exactamente la frase que este módulo existe para borrar.
 *
 * ─── AGRUPA, NO REEMPLAZA ──────────────────────────────────────────────────
 *
 * Los campos de texto libre siguen donde están, diciendo lo que decían.
 * `expediente_id` nace NULO en todas partes y lo pone el abogado, una fila a la
 * vez: adivinar a qué expediente pertenece un borrador de hace tres meses es
 * justo lo que esta casa no puede hacer sola —dos que digan «Mosquera» pueden
 * ser dos casos del mismo cliente— y atarlo mal le daría al motor contexto
 * ajeno sin que nadie lo note.
 */

/** Los estados de un asunto. ARCHIVADO es «no lo quiero ver», no «se borró». */
export type EstadoDeExpediente = 'ACTIVO' | 'SUSPENDIDO' | 'TERMINADO' | 'ARCHIVADO';

export const ESTADOS_DE_EXPEDIENTE: readonly EstadoDeExpediente[] = [
  'ACTIVO',
  'SUSPENDIDO',
  'TERMINADO',
  'ARCHIVADO'
];

/**
 * QUÉ ES alguien en el proceso.
 *
 * ─── ESTA LISTA NO SE INVENTÓ AQUÍ, Y ÉSE ES EL PUNTO ──────────────────────
 *
 * Es la misma que `SpeakerRole` en `modules/transcription/types.ts`: veintidós
 * papeles curados para audiencias colombianas, en uso desde hace meses. La
 * primera versión de este archivo tenía seis inventados —PARTE, APODERADO,
 * TESTIGO, PERITO, AUTORIDAD, OTRO— y se cambió antes de que existiera una
 * sola fila.
 *
 * Dos listas para lo mismo es un defecto que este repositorio ya conoce:
 * envejecen por separado y un día dicen cosas distintas. Y aquí se perdía algo
 * concreto además: con el MISMO vocabulario, un testigo del expediente se
 * puede EMPAREJAR POR ROL con la voz que declaró en la audiencia grabada de
 * ese mismo expediente. Con dos, no.
 *
 * Lo que la lista curada trae y la inventada borraba: las cinco etapas penales
 * separadas —cuál aplica depende de la audiencia y eso lo sabe el abogado—, la
 * víctima y su representante, el apoderado de cada lado por separado, y la
 * diferencia entre fiscal, Ministerio Público y Defensoría.
 *
 * `DESCONOCIDO` existe por la misma razón que en el transcrito: un actor que
 * todavía no se sabe qué es se registra igual, y ponerle un papel a dedo sería
 * inventar. Es el default cuando no se dice.
 */
export type PapelEnElExpediente =
  // El estrado
  | 'JUEZ'
  | 'SECRETARIO'
  // Parte acusadora y control estatal
  | 'FISCAL'
  | 'MINISTERIO_PUBLICO'
  | 'DEFENSOR_PUEBLO'
  // Defensa penal y la persona procesada, por etapas
  | 'DEFENSOR'
  | 'INDICIADO'
  | 'IMPUTADO'
  | 'ACUSADO'
  | 'PROCESADO'
  | 'CONDENADO'
  // Víctimas
  | 'VICTIMA'
  | 'REPRESENTANTE_VICTIMAS'
  // Civil, laboral y administrativo
  | 'APODERADO_DEMANDANTE'
  | 'APODERADO_DEMANDADO'
  | 'DEMANDANTE'
  | 'DEMANDADO'
  // Prueba
  | 'TESTIGO'
  | 'PERITO'
  | 'INTERPRETE'
  | 'DESCONOCIDO';

export const PAPELES: readonly PapelEnElExpediente[] = [
  'JUEZ',
  'SECRETARIO',
  'FISCAL',
  'MINISTERIO_PUBLICO',
  'DEFENSOR_PUEBLO',
  'DEFENSOR',
  'INDICIADO',
  'IMPUTADO',
  'ACUSADO',
  'PROCESADO',
  'CONDENADO',
  'VICTIMA',
  'REPRESENTANTE_VICTIMAS',
  'APODERADO_DEMANDANTE',
  'APODERADO_DEMANDADO',
  'DEMANDANTE',
  'DEMANDADO',
  'TESTIGO',
  'PERITO',
  'INTERPRETE',
  'DESCONOCIDO'
];

/**
 * A QUIÉN SE LE PREGUNTA, que no es lo mismo que quién está en el expediente.
 *
 * Se interroga a las partes —demandante, demandado y la persona procesada en
 * cualquiera de sus cinco etapas—, a la víctima, a los testigos y al perito
 * (por la contradicción del dictamen). No se interroga al juez, al secretario,
 * a los apoderados, al intérprete ni a los intervinientes de control: están en
 * el expediente porque hay que saber quiénes son, no porque se les pregunte.
 *
 * VIVE EN CÓDIGO Y NO EN LA BASE a propósito. Es una regla de producto y se
 * puede afinar sin migrar una tabla; y el día que un abogado quiera preparar
 * preguntas para alguien que aquí no está, el arreglo es una línea y no un
 * ALTER sobre datos de firmas reales.
 */
export const PAPELES_INTERROGABLES: readonly PapelEnElExpediente[] = [
  'DEMANDANTE',
  'DEMANDADO',
  'INDICIADO',
  'IMPUTADO',
  'ACUSADO',
  'PROCESADO',
  'CONDENADO',
  'VICTIMA',
  'TESTIGO',
  'PERITO'
];

export const seLePregunta = (papel: PapelEnElExpediente): boolean =>
  PAPELES_INTERROGABLES.includes(papel);

/**
 * DE QUÉ LADO está, que es lo que decide la técnica.
 *
 * Al propio se le interroga —preguntas abiertas, que cuente— y al ajeno se le
 * contrainterroga —cerradas, que confirme o se contradiga—. NEUTRAL existe
 * porque el perito de oficio, el juez y el Ministerio Público no son de nadie,
 * y meterlos en cualquiera de los dos bandos produciría la técnica equivocada.
 */
export type LadoEnElExpediente = 'PROPIO' | 'CONTRARIO' | 'NEUTRAL';

export const LADOS: readonly LadoEnElExpediente[] = ['PROPIO', 'CONTRARIO', 'NEUTRAL'];

export interface ActorDelExpediente {
  id: string;
  expedienteId: string;
  nombre: string;
  papel: PapelEnElExpediente;
  lado: LadoEnElExpediente;
  /** Sobre qué puede declarar. Es lo que convierte una lista de nombres en preguntas útiles. */
  sobreQue: string | null;
  identificacion: string | null;
  notas: string | null;
  /** Cuando el actor ES cliente de la firma: por aquí se llega a sus entrevistas. */
  clienteId: string | null;
  createdAt: string;
}

export interface Expediente {
  id: string;
  caratula: string;
  radicado: string | null;
  despacho: string | null;
  rama: string | null;
  clienteId: string | null;
  /** El nombre del cliente, resuelto al listar. No se guarda aquí: se lee de `clients`. */
  clienteNombre: string | null;
  contraparte: string | null;
  estado: EstadoDeExpediente;
  notas: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Cuántos actores tiene. Volumen, no contenido: la lista no los trae. */
  actores?: number;
}

/** El expediente con todo lo que cuelga de él. Es lo que devuelve el detalle. */
export interface ExpedienteConDetalle extends Expediente {
  listaDeActores: ActorDelExpediente[];
  /**
   * LO QUE YA HAY EN EL CASO, en cuentas y no en contenido.
   *
   * La pantalla del expediente necesita saber que existen tres entrevistas y
   * dos revisiones para poder ofrecerlas; traerlas enteras aquí haría de este
   * endpoint el más pesado de la plataforma para pintar unos números.
   */
  piezas: {
    entrevistas: number;
    audiencias: number;
    revisiones: number;
    borradores: number;
    terminos: number;
    orientaciones: number;
  };
}

export interface DatosDeExpediente {
  caratula: string;
  radicado?: string | null;
  despacho?: string | null;
  rama?: string | null;
  clienteId?: string | null;
  contraparte?: string | null;
  estado?: EstadoDeExpediente;
  notas?: string | null;
}

export interface DatosDeActor {
  nombre: string;
  /** Ausente cuando todavía no se sabe: entra como DESCONOCIDO, no se adivina. */
  papel?: PapelEnElExpediente;
  lado?: LadoEnElExpediente;
  sobreQue?: string | null;
  identificacion?: string | null;
  notas?: string | null;
  clienteId?: string | null;
}

/**
 * LAS COSAS QUE SE PUEDEN ATAR A UN EXPEDIENTE, y su tabla.
 *
 * Se enumeran en un solo sitio porque el endpoint de atar es UNO —igual que
 * `PATCH /clients/link`, que ya resolvió este problema para las entrevistas— y
 * porque una lista suelta por archivo se desincroniza. El nombre que viaja por
 * la API es el de la izquierda; la tabla nunca sale al cliente.
 */
export const TABLA_DE_PIEZA = {
  transcripcion: 'transcriptions',
  revision: 'document_reviews',
  borrador: 'saved_drafts',
  termino: 'agenda_terminos',
  orientacion: 'orientaciones'
} as const;

export type TipoDePieza = keyof typeof TABLA_DE_PIEZA;

export const TIPOS_DE_PIEZA = Object.keys(TABLA_DE_PIEZA) as TipoDePieza[];
