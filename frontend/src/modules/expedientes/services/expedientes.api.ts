import { httpClient } from '../../../config/httpClient';
import type {
  ActorDelExpediente,
  Expediente,
  ExpedienteConDetalle,
  LadoEnElExpediente,
  PapelEnElExpediente,
  PreguntasDelExpediente
} from '../types';

interface Respuesta {
  success: boolean;
  message?: string;
}

/**
 * FALLA HABLANDO. Misma regla que la agenda: lo que el servidor rechaza sale
 * con su razón en español. Aquí el caso concreto que importa es el saldo — el
 * interrogatorio cuesta— y un «no se pudo» genérico dejaría al abogado sin
 * saber si el problema es su plan, su saldo o el motor.
 */
const revisar = <T extends Respuesta>(data: T, fallo: string): T => {
  if (!data.success) throw new Error(data.message ?? fallo);
  return data;
};

/** Lo que se puede atar a un expediente. Espejo de `TABLA_DE_PIEZA`. */
export type TipoDePieza = 'transcripcion' | 'revision' | 'borrador' | 'termino' | 'orientacion';

/** Un documento ya indexado dentro del expediente. */
export interface DocumentoIndexado {
  documentId: string;
  titulo: string;
  fragmentos: number;
  indexadoEl: string;
}

/** Una pieza de la firma que se puede traer a un expediente. */
export interface Candidato {
  tipo: TipoDePieza;
  id: string;
  titulo: string;
  cuando: string;
  /** A qué expediente pertenece hoy. `null` si está libre. */
  expedienteId: string | null;
}

export const expedientesApi = {
  async listar(): Promise<Expediente[]> {
    const data = await httpClient.get<Respuesta & { expedientes: Expediente[] }>('/api/expedientes');
    return revisar(data, 'No se pudieron cargar los expedientes.').expedientes;
  },

  /** Lo que la firma ya tiene y se puede traer. De la FIRMA, no de un expediente. */
  async candidatos(): Promise<Candidato[]> {
    const data = await httpClient.get<Respuesta & { candidatos: Candidato[] }>(
      '/api/expedientes/candidatos'
    );
    return revisar(data, 'No se pudo cargar lo que hay para traer.').candidatos;
  },

  async obtener(id: string): Promise<ExpedienteConDetalle> {
    const data = await httpClient.get<Respuesta & { expediente: ExpedienteConDetalle }>(
      `/api/expedientes/${id}`
    );
    return revisar(data, 'No se pudo cargar el expediente.').expediente;
  },

  async crear(body: {
    caratula: string;
    radicado?: string;
    despacho?: string;
    rama?: string;
    clienteId?: string | null;
    contraparte?: string;
    notas?: string;
  }): Promise<Expediente> {
    const data = await httpClient.post<Respuesta & { expediente: Expediente }>('/api/expedientes', { body });
    return revisar(data, 'No se pudo crear el expediente.').expediente;
  },

  async actualizar(id: string, body: Record<string, unknown>): Promise<Expediente> {
    const data = await httpClient.patch<Respuesta & { expediente: Expediente }>(`/api/expedientes/${id}`, {
      body
    });
    return revisar(data, 'No se pudo guardar el expediente.').expediente;
  },

  async borrar(id: string): Promise<string> {
    const data = await httpClient.delete<Respuesta>(`/api/expedientes/${id}`);
    return revisar(data, 'No se pudo borrar el expediente.').message ?? '';
  },

  async agregarActor(
    expedienteId: string,
    body: {
      nombre: string;
      papel: PapelEnElExpediente;
      lado: LadoEnElExpediente;
      sobreQue?: string;
      identificacion?: string;
      notas?: string;
    }
  ): Promise<ActorDelExpediente> {
    const data = await httpClient.post<Respuesta & { actor: ActorDelExpediente }>(
      `/api/expedientes/${expedienteId}/actores`,
      { body }
    );
    return revisar(data, 'No se pudo agregar a esa persona.').actor;
  },

  async borrarActor(expedienteId: string, actorId: string): Promise<void> {
    const data = await httpClient.delete<Respuesta>(
      `/api/expedientes/${expedienteId}/actores/${actorId}`
    );
    revisar(data, 'No se pudo quitar a esa persona.');
  },

  /** Ata o desata una pieza. `expedienteId: null` desata. */
  async atar(tipo: TipoDePieza, piezaId: string, expedienteId: string | null): Promise<void> {
    const data = await httpClient.patch<Respuesta>('/api/expedientes/atar', {
      body: { tipo, piezaId, expedienteId }
    });
    revisar(data, 'No se pudo atar al expediente.');
  },

  /**
   * Indexa un documento largo dentro del expediente.
   *
   * Va el TEXTO, no el archivo: un PDF de 300 páginas no cabe bajo el tope de
   * cuerpo de Vercel, y el navegador ya sabe extraerlo. Medido con el Código
   * General del Proceso entero: 0,73 MB de texto contra un tope de 4,5 MB.
   */
  async indexar(
    expedienteId: string,
    body: { titulo: string; texto: string; claveB2?: string }
  ): Promise<{ resultado: { totalChunksCreated: number; status: string }; buscable: boolean }> {
    const data = await httpClient.post<
      Respuesta & { resultado: { totalChunksCreated: number; status: string }; buscable: boolean }
    >(`/api/expedientes/${expedienteId}/indexar`, { body });
    return revisar(data, 'No se pudo indexar el documento.');
  },

  /** Lo que el expediente tiene indexado, con cuántos fragmentos cada documento. */
  async documentos(expedienteId: string): Promise<DocumentoIndexado[]> {
    const data = await httpClient.get<Respuesta & { documentos: DocumentoIndexado[] }>(
      `/api/expedientes/${expedienteId}/documentos`
    );
    return revisar(data, 'No se pudieron cargar los documentos del expediente.').documentos;
  },

  async quitarDocumento(expedienteId: string, documentId: string): Promise<void> {
    const data = await httpClient.delete<Respuesta>(
      `/api/expedientes/${expedienteId}/documentos/${documentId}`
    );
    revisar(data, 'No se pudo quitar el documento.');
  },

  /** Prepara el interrogatorio. CUESTA SALDO: la pantalla lo dice antes de llamar. */
  async preguntas(
    expedienteId: string,
    body: { actorIds: string[]; quiereProbar?: string; audiencia?: string }
  ): Promise<{ preguntas: PreguntasDelExpediente; cobradoCop: number; saldoCop: number }> {
    const data = await httpClient.post<
      Respuesta & { preguntas: PreguntasDelExpediente; cobradoCop: number; saldoCop: number }
    >(`/api/expedientes/${expedienteId}/preguntas`, { body });
    return revisar(data, 'No se pudo preparar el interrogatorio.');
  }
};
