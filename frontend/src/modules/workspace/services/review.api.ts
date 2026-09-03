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
}

export const reviewApi = {
  revisar: (body: PeticionDeRevision) =>
    httpClient.post<RespuestaDeRevision>('/api/agent/review-document', { body }),

  /** Los informes guardados de la firma, sin cuerpos. */
  listar: () => httpClient.get<{ revisiones: RevisionGuardada[] }>('/api/agent/reviews').then((r) => r.revisiones),

  obtener: (id: string) =>
    httpClient.get<{ revision: RevisionGuardada }>(`/api/agent/reviews/${encodeURIComponent(id)}`).then((r) => r.revision),

  eliminar: (id: string) => httpClient.delete<{ success: boolean }>(`/api/agent/reviews/${encodeURIComponent(id)}`)
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
