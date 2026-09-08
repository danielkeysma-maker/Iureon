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

export interface RespuestaDeRevision {
  /** Id del informe guardado; null si no se pudo guardar. */
  id?: string | null;
  guardada?: boolean;
  /** El texto del escrito tal como se revisó: el taller lo necesita para tachar y editar. */
  texto?: string;
  /** Si la firma autorizó conservar el texto y la conversación en el servidor. */
  guardaTexto?: boolean;
  informe: InformeDeRevision | null;
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
}

export interface RevisionGuardada {
  id: string;
  documentType: string;
  legalBranch: string | null;
  fileName: string;
  cliente: string;
  pregunta: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  informe: InformeDeRevision | null;
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
  /** El último juego de preguntas para la audiencia; null si nunca se pidió. Falta en la lista sin cuerpos. */
  preguntasAudiencia?: PreguntasAudienciaGuardadas | null;
}

/* ─── Preguntas para la audiencia ──────────────────────────────────────────── */

export interface PreguntaDeAudiencia {
  pregunta: string;
  /** Una línea: qué busca establecer o desvirtuar. */
  paraQue: string;
  /** Pasaje literal del escrito del que nace, si lo hay. */
  delEscrito?: string;
}

/** Las tres listas del JSON; el «enfoque» es texto y no entra aquí. */
export type SeccionDePreguntas = 'contraparte' | 'misTestigos' | 'testigosContraparte';

export interface PreguntasParaLaAudiencia {
  /** Qué exige probar esta actuación y en qué audiencia se pregunta; una o dos frases del modelo. */
  enfoque?: string;
  contraparte: PreguntaDeAudiencia[];
  misTestigos: PreguntaDeAudiencia[];
  testigosContraparte: PreguntaDeAudiencia[];
}

export interface ParametrosDePreguntas {
  /** «Demandante», «Demandado» o texto libre: «Ministerio Público», «tercero». */
  posicion: string;
  quiereProbar?: string;
  audiencia?: string;
}

export interface PreguntasAudienciaGuardadas {
  parametros: ParametrosDePreguntas;
  preguntas: PreguntasParaLaAudiencia;
  generadoEl: string;
  por: string;
}

export interface RespuestaDePreguntas extends PreguntasAudienciaGuardadas {
  guardado: boolean;
  cobradoCop: number;
  saldoCop: number;
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

  /** Tres listas de preguntas para la audiencia a partir del escrito. Cobra como una consulta. */
  preguntasParaAudiencia: (id: string, body: ParametrosDePreguntas & { textoActual: string }) =>
    httpClient.post<RespuestaDePreguntas>(`/api/agent/reviews/${encodeURIComponent(id)}/preguntas`, { body }),

  rerevisar: (id: string, textoActual: string) =>
    httpClient.post<RespuestaDeNuevaRevision>(`/api/agent/reviews/${encodeURIComponent(id)}/rerevisar`, { body: { textoActual } }),

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
