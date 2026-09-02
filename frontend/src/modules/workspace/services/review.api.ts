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

export interface InformeDeRevision {
  resumen: string;
  fortalezas: string[];
  debilidades: string[];
  seccionesFaltantes: string[];
  erroresDeAplicacion: ErrorDeAplicacion[];
  recomendaciones: string[];
}

export interface RespuestaDeRevision {
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
  fileName?: string;
  contentBase64?: string;
  texto?: string;
}

export const reviewApi = {
  revisar: (body: PeticionDeRevision) =>
    httpClient.post<RespuestaDeRevision>('/api/agent/review-document', { body })
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
