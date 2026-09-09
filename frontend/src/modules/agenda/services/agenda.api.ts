import { httpClient } from '../../../config/httpClient';
import type {
  EntradaDeAgenda,
  EntradaNueva,
  EstadoDeEntrada,
  PlazoDeActuacion,
  TipoDeDias,
  VencimientoPrevisto
} from '../types';

interface Respuesta<T> {
  success: boolean;
  result?: T;
  message?: string;
}

/**
 * FALLA HABLANDO. Misma regla que las demás calculadoras: lo que el servidor
 * rechaza —una ficha cuyo término no se deja leer, una fecha límite anterior a
 * la notificación— sale con su razón en español. Aquí importa más que en
 * ninguna otra pantalla: una agenda que se traga un error deja al abogado
 * creyendo que su vencimiento está vigilado.
 */
const desempacar = <T>(data: Respuesta<T>, fallo: string): T => {
  if (data.success && data.result !== undefined) return data.result;
  throw new Error(data.message ?? fallo);
};

export const agendaApi = {
  async listar(estado: EstadoDeEntrada | 'TODAS' = 'TODAS'): Promise<EntradaDeAgenda[]> {
    return desempacar(
      await httpClient.get<Respuesta<EntradaDeAgenda[]>>(`/api/agenda?estado=${estado}`),
      'No se pudo leer la agenda de términos.'
    );
  },

  /** Qué dice el catálogo del plazo de una actuación, antes de guardar nada. */
  async plazoDe(actuacionId: string): Promise<PlazoDeActuacion> {
    return desempacar(
      await httpClient.get<Respuesta<PlazoDeActuacion>>(
        `/api/agenda/plazo?actuacionId=${encodeURIComponent(actuacionId)}`
      ),
      'No se pudo consultar el término de esa actuación.'
    );
  },

  /**
   * La cuenta, antes de guardarla. El cálculo lo hace SIEMPRE el servidor: aquí
   * no se suma un solo día, ni siquiera para adelantar la cifra en pantalla.
   * Un vencimiento calculado en dos sitios es un vencimiento que un día se
   * contradice, y el que se ve no es el que avisa.
   */
  async previsualizar(body: {
    fechaNotificacion: string;
    dias: number;
    tipoDias: TipoDeDias;
    rama: string | null;
  }): Promise<VencimientoPrevisto> {
    return desempacar(
      await httpClient.post<Respuesta<VencimientoPrevisto>>('/api/agenda/previsualizar', { body }),
      'No se pudo calcular la fecha límite.'
    );
  },

  async crear(body: EntradaNueva): Promise<EntradaDeAgenda> {
    return desempacar(
      await httpClient.post<Respuesta<EntradaDeAgenda>>('/api/agenda', { body }),
      'No se pudo guardar la entrada en la agenda.'
    );
  },

  async editar(id: string, body: Partial<EntradaNueva> & { estado?: EstadoDeEntrada }): Promise<EntradaDeAgenda> {
    return desempacar(
      await httpClient.patch<Respuesta<EntradaDeAgenda>>(`/api/agenda/${id}`, { body }),
      'No se pudo actualizar la entrada.'
    );
  },

  async borrar(id: string): Promise<void> {
    const data = await httpClient.delete<Respuesta<never>>(`/api/agenda/${id}`);
    if (!data.success) throw new Error(data.message ?? 'No se pudo borrar la entrada.');
  }
};
