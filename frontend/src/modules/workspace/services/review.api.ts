import type { PapelEnElExpediente } from '../../expedientes/types';
import { httpClient } from '../../../config/httpClient';

/**
 * Revisar un escrito ya redactado. Un informe, no un borrador.
 *
 * El archivo viaja en base64 dentro del JSON: un escrito pesa kilobytes, y
 * así no hay almacenamiento intermedio — el servidor lo lee, lo revisa y lo
 * descarta en la misma petición. Nada del documento se guarda.
 */

export interface ErrorDeAplicacion {
  donde: string;
  problema: string;
  correccion: string;
}

export interface CorreccionTextual {
  /** Palabras exactas del escrito, para encontrarlas con buscar. */
  cita: string;
  problema: string;
  /** La redacción propuesta, lista para pegar. */
  reemplazo: string;
}

export interface InformeDeRevision {
  resumen: string;
  fortalezas: string[];
  debilidades: string[];
  seccionesFaltantes: string[];
  erroresDeAplicacion: ErrorDeAplicacion[];
  /** Puede faltar en informes guardados antes de que existiera. */
  correccionesTextuales?: CorreccionTextual[];
  recomendaciones: string[];
}

/* ─── LOS DOS MODOS DE REVISIÓN ─────────────────────────────────────────────
 *
 * `ESCRITO_PROPIO` es el de siempre: el escrito que el abogado va a presentar,
 * revisado contra la ficha verificada de su actuación.
 *
 * `DOCUMENTO_RECIBIDO` lee un papel que llegó —un auto, una sentencia, un
 * oficio, una notificación—. No pide actuación, porque quien acaba de recibir
 * un auto no sabe cómo se llama en el catálogo y no le hace falta saberlo. Sin
 * actuación no hay ficha, así que su informe SOLO afirma lo que el propio
 * documento dice y lo dice citándolo; el «¿y qué puedo hacer?» lo responden la
 * guía de actuaciones y la agenda de términos, que sí están verificadas.
 */
export type ModoDeRevision = 'ESCRITO_PROPIO' | 'DOCUMENTO_RECIBIDO';

/** Una carga que el documento le impone al abogado, con el plazo que él mismo anuncia. */
export interface CargaDelDocumento {
  carga: string;
  /**
   * El término TAL COMO LO ANUNCIA EL DOCUMENTO. Vacío cuando el documento no
   * anuncia ninguno, y entonces la pantalla dice que no lo anuncia: aquí no se
   * rellena con un plazo recordado, que es indistinguible de uno leído hasta
   * que el abogado lo pierde.
   */
  plazo: string;
  /** Las palabras exactas del documento que imponen la carga y el plazo. */
  cita: string;
  /**
   * A quien se la impone el documento, con las palabras del documento. Vacio
   * cuando no identifica destinatario. Falta en informes anteriores al campo.
   */
  aQuien?: string;
  /**
   * El veredicto, y LO PONE EL SERVIDOR comparando `aQuien` con la posicion
   * declarada. El motor no opina sobre esto. Falta en informes anteriores al
   * campo, y entonces la pantalla no atribuye nada.
   */
  deQuienEs?: 'SUYA' | 'DE_OTRO' | 'NO_SE_SABE';
}

/* ─── POR DÓNDE SE ATACA ────────────────────────────────────────────────────
 *
 * Entender el auto es la mitad; la otra es atacarlo. Como aquí NO HAY FICHA
 * detrás de nada, el único anclaje posible es el propio documento: cada punto
 * llega con las palabras del papel al lado, y el servidor descarta los que no
 * las traen. Por eso la pantalla no tiene que decidir en qué creer — lo que
 * llega, se pinta — pero sí tiene que SEPARAR A LA VISTA la cita de la lectura
 * del revisor, igual que el informe del escrito propio separa lo que exige la
 * norma de lo que opina quien revisa.
 */
export type ClaseDeAtaque = 'NO_SE_SOSTIENE' | 'TENSION_CON_LA_NORMA' | 'NO_RESUELVE' | 'SIN_APOYO_CITADO';

export interface PuntoDeAtaque {
  clase: ClaseDeAtaque;
  /** Palabras exactas del documento. Sin ellas el punto no habría llegado hasta aquí. */
  cita: string;
  /** El artículo tal como el documento lo nombra. Vacío si el documento no transcribe qué ordena. */
  norma: string;
  /** Lo que el DOCUMENTO dice que esa norma ordena, copiado de él. Vacío si no lo transcribe. */
  citaDeLaNorma: string;
  /** La lectura del revisor. No es del documento y se pinta como lo que es. */
  lectura: string;
}

export interface InformeDeDocumentoRecibido {
  queEs: string;
  quienLoProfirio: string;
  radicado: string;
  fecha: string;
  decide: string[];
  cargas: CargaDelDocumento[];
  loQueSigue: string[];
  /** Lo que el documento calla y el abogado esperaría: se declara, no se rellena. */
  noLoDiceElDocumento: string[];
  /** Falta en los informes guardados antes de que la sección existiera. */
  porDondeSeAtaca?: PuntoDeAtaque[];
  /**
   * A quién representaba el abogado cuando pidió este informe. Se guarda con
   * el informe y no se recalcula: uno abierto tres semanas después tiene que
   * atribuir las cargas igual que el día que se leyó.
   */
  posicion?: PapelEnElExpediente | null;
}

/** El archivo tal como se subió, cuando se conservó en el almacenamiento de la firma. */
export interface ArchivoOriginalGuardado {
  /** Clave en B2, bajo el prefijo de la firma. Sola no abre nada: hace falta una URL firmada. */
  clave: string;
  /** MIME con que se subió: decide con qué visor se abre. */
  tipo: string;
  bytes: number;
}

export interface RespuestaDeRevision {
  /** Id del informe guardado; null si no se pudo guardar. */
  id?: string | null;
  guardada?: boolean;
  /** El archivo original, si se conservó; null cuando no. */
  archivoOriginal?: ArchivoOriginalGuardado | null;
  /** El texto del escrito tal como se revisó: el taller lo necesita para tachar y editar. */
  texto?: string;
  /** Si la firma autorizó conservar el texto y la conversación en el servidor. */
  guardaTexto?: boolean;
  /** Cuál de los dos modos leyó el documento. Falta en respuestas de servidores anteriores a los dos modos. */
  modo?: ModoDeRevision;
  informe: InformeDeRevision | null;
  /** El informe del documento recibido; null en el modo propio. */
  informeRecibido?: InformeDeDocumentoRecibido | null;
  /** Cuando el revisor no devolvió JSON legible: su texto tal cual. */
  informeLibre: string | null;
  /** Si la actuación tenía ficha verificada y la revisión objetiva se apoyó en ella. */
  conFicha: boolean;
  truncado: boolean;
  caracteres: number;
  cobradoCop: number;
  saldoCop: number;
}

export interface PeticionDeRevision {
  /** Sin él manda `ESCRITO_PROPIO`, que es como se comportaba antes de existir. */
  modo?: ModoDeRevision;
  /** Obligatorio en el modo propio; el servidor lo ignora en el recibido. */
  documentType: string;
  legalBranch?: string;
  pregunta: string;
  /** Cliente o proceso del escrito, texto libre; queda en la lista de revisiones. */
  cliente?: string;
  fileName?: string;
  /** Hasta ~3,5 MB: el archivo viaja dentro del JSON. */
  contentBase64?: string;
  /** Más grande: se subió directo al almacenamiento y viaja solo la clave. */
  storageKey?: string;
  texto?: string;
  /**
   * Conservar el archivo tal como se subió para verlo después con su
   * diagramación. Solo tiene efecto con `storageKey` y con la autorización de
   * la firma: el servidor comprueba las dos cosas.
   */
  conservarOriginal?: boolean;
  /** MIME que declaró el navegador; decide con qué visor se abre el original. */
  contentType?: string;
  /**
   * A quién representa el abogado en este proceso. Solo tiene sentido en el
   * modo recibido: sin ella el informe no atribuye ninguna carga.
   */
  posicion?: PapelEnElExpediente;
  /**
   * De qué caso es la revisión. El servidor comprueba que el expediente sea
   * de la firma ANTES de reservar saldo, y responde 404 si no lo es.
   */
  expedienteId?: string;
}

export interface RevisionGuardada {
  id: string;
  /**
   * El caso al que pertenece, o null si nacio suelta. Lo hereda «Poner en la
   * agenda»: un vencimiento que sale de una revision atada es del mismo caso.
   */
  expedienteId?: string | null;
  documentType: string;
  legalBranch: string | null;
  fileName: string;
  cliente: string;
  pregunta: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  /** Cuál de los dos modos leyó el documento; el servidor lo deduce del informe guardado y de la etiqueta. */
  modo: ModoDeRevision;
  informe: InformeDeRevision | null;
  informeRecibido: InformeDeDocumentoRecibido | null;
  informeLibre: string | null;
  cobradoCop: number;
  userEmail: string;
  createdAt: string;
  /** El taller: solo si la firma autorizó conservar escritos. */
  textoOriginal: string | null;
  textoTrabajo: string | null;
  conversacion: TurnoDelTaller[];
  anotaciones: Anotacion[];
  versiones: VersionDelTexto[];
  /** El archivo tal como se subió, si se conservó. Falta en la lista sin cuerpos. */
  archivoOriginal?: ArchivoOriginalGuardado | null;
}

export interface EdicionPropuesta {
  cita: string;
  reemplazo: string;
}

export interface TurnoDelTaller {
  rol: 'abogado' | 'revisor';
  texto: string;
  ediciones?: EdicionPropuesta[];
  /** Pasajes del texto de los que habla la respuesta, para resaltarlos. */
  referencias?: string[];
  fecha: string;
}

/** Una instantánea del texto en el taller. */
export interface VersionDelTexto {
  fecha: string;
  motivo: string;
  texto: string;
  resumen?: string;
}

/** Un resaltado, tachado o comentario del abogado, anclado al texto citado. */
export interface Anotacion {
  cita: string;
  color: 'amarillo' | 'verde' | 'azul' | 'rosa' | 'tachado' | 'comentario';
  /** Solo en comentarios: la nota sobre ese pasaje. Viaja a la guía con cada mensaje. */
  nota?: string;
  fecha?: string;
}

export interface RespuestaDelChat {
  respuesta: string;
  ediciones: EdicionPropuesta[];
  referencias: string[];
  turnos: TurnoDelTaller[];
  guardado: boolean;
  cobradoCop: number;
  saldoCop: number;
}

export interface RespuestaDeNuevaRevision {
  informe: InformeDeRevision | null;
  informeLibre: string | null;
  conFicha: boolean;
  truncado: boolean;
  caracteres: number;
  guardado: boolean;
  cobradoCop: number;
  saldoCop: number;
}

export interface ConsentimientoDeGuardado {
  guarda: boolean;
  por: string | null;
  el: string | null;
}

/**
 * Lo que el servidor dice del archivo original de una revisión. Las dos formas
 * son respuestas correctas: que el archivo no se conservara no es un fallo.
 */
export type RespuestaDelOriginal =
  | {
      disponible: true;
      /** URL firmada de quince minutos contra el almacenamiento. No se guarda. */
      url: string;
      nombre: string;
      tipo: string;
      bytes: number;
      expiraEnSegundos: number;
    }
  | {
      disponible: false;
      /** Si la firma autorizó conservar escritos: decide si volver a subirlo lo guarda o solo lo abre. */
      puedeConservarlo: boolean;
      motivo: string;
    };

export const reviewApi = {
  revisar: (body: PeticionDeRevision) =>
    httpClient.post<RespuestaDeRevision>('/api/agent/review-document', { body }),

  /** Los informes guardados de la firma, sin cuerpos. */
  listar: () => httpClient.get<{ revisiones: RevisionGuardada[] }>('/api/agent/reviews').then((r) => r.revisiones),

  obtener: (id: string) =>
    httpClient.get<{ revision: RevisionGuardada }>(`/api/agent/reviews/${encodeURIComponent(id)}`).then((r) => r.revision),

  eliminar: (id: string) => httpClient.delete<{ success: boolean }>(`/api/agent/reviews/${encodeURIComponent(id)}`),

  /* ─── El taller ─────────────────────────────────────────────────────────── */

  /** Autoguardado del taller: texto, marcas, versiones y la conversación entera. */
  guardarTexto: (id: string, texto: string, anotaciones?: Anotacion[], versiones?: VersionDelTexto[], conversacion?: TurnoDelTaller[]) =>
    httpClient.put<{ guardado: boolean; motivo?: string }>(`/api/agent/reviews/${encodeURIComponent(id)}/texto`, { body: { texto, anotaciones, versiones, conversacion } }),

  /**
   * El último guardado, cuando la pestaña se oculta o se cierra. Sale con
   * keepalive para sobrevivir a la página; como el navegador limita ese cuerpo
   * a unos 64 KB, las versiones se dejan fuera si no caben — ya viajaron en el
   * guardado con retardo — y el texto y la conversación van siempre.
   */
  guardarTextoAlSalir: (id: string, texto: string, anotaciones: Anotacion[], versiones: VersionDelTexto[], conversacion: TurnoDelTaller[]) => {
    const cuerpo = cuerpoQueCabeEnKeepalive({ texto, anotaciones, versiones, conversacion });
    return httpClient
      .put<{ guardado: boolean }>(`/api/agent/reviews/${encodeURIComponent(id)}/texto`, { body: cuerpo, keepalive: true })
      .then((r) => r.guardado)
      .catch(() => false);
  },

  /** La guía conversa sobre un escrito de Redacción: sin informe ni id. */
  chatSobreEscrito: (body: { documentType: string; legalBranch?: string; titulo: string; mensaje: string; textoActual: string; historial: TurnoDelTaller[]; anotaciones?: Anotacion[] }) =>
    httpClient.post<RespuestaDelChat>('/api/agent/escrito/chat', { body }),

  chat: (id: string, body: { mensaje: string; textoActual: string; historial: TurnoDelTaller[]; anotaciones?: Anotacion[] }) =>
    httpClient.post<RespuestaDelChat>(`/api/agent/reviews/${encodeURIComponent(id)}/chat`, { body }),

  rerevisar: (id: string, textoActual: string) =>
    httpClient.post<RespuestaDeNuevaRevision>(`/api/agent/reviews/${encodeURIComponent(id)}/rerevisar`, { body: { textoActual } }),

  /* ─── El archivo original ───────────────────────────────────────────────── */

  /**
   * Dónde está el archivo tal como se subió, para el visor fiel.
   *
   * Responde igual cuando NO está: `disponible: false` con el motivo escrito,
   * porque «no se conservó» es un estado del producto y la pestaña tiene que
   * explicarlo. La URL viene firmada y caduca a los quince minutos, así que se
   * pide cada vez que se abre el visor y nunca se guarda.
   */
  originalDeRevision: (id: string) =>
    httpClient.get<RespuestaDelOriginal>(`/api/documents/revisiones/${encodeURIComponent(id)}/original`),

  /** Ata a la revisión un archivo que el navegador ya subió al almacenamiento. */
  adjuntarOriginal: (id: string, body: { storageKey: string; tipo: string; bytes: number }) =>
    httpClient.put<{ tipo: string; bytes: number }>(`/api/documents/revisiones/${encodeURIComponent(id)}/original`, { body }),

  /** Retira el archivo del almacenamiento sin tocar el informe ni el taller. */
  retirarOriginal: (id: string) =>
    httpClient.delete<{ borrado: boolean }>(`/api/documents/revisiones/${encodeURIComponent(id)}/original`),

  consentimiento: () => httpClient.get<ConsentimientoDeGuardado>('/api/agent/reviews/settings/guardado'),

  autorizarGuardado: (autorizar: boolean) =>
    httpClient.post<ConsentimientoDeGuardado>('/api/agent/reviews/settings/guardado', { body: { autorizar } })
};

/** Bytes aproximados de un cuerpo JSON; el límite keepalive del navegador es 64 KB. */
const LIMITE_KEEPALIVE = 60_000;
export const cuerpoQueCabeEnKeepalive = <T extends { versiones?: unknown; anotaciones?: unknown; conversacion?: unknown }>(cuerpo: T): T => {
  const pesa = (c: unknown) => new Blob([JSON.stringify(c)]).size;
  if (pesa(cuerpo) <= LIMITE_KEEPALIVE) return cuerpo;
  const sinVersiones = { ...cuerpo, versiones: undefined };
  if (pesa(sinVersiones) <= LIMITE_KEEPALIVE) return sinVersiones;
  /* La conversación ya la guardó el servidor turno a turno; el texto es lo que no puede faltar. */
  return { ...sinVersiones, conversacion: undefined };
};

/** El archivo como base64 puro, sin el prefijo data:. */
export const archivoABase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = String(reader.result ?? '');
      resolve(resultado.slice(resultado.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
