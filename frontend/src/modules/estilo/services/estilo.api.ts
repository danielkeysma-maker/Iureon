import { httpClient } from '../../../config/httpClient';
import type { ContenidoDeLeccion, FuenteDeLeccion, ItemDescartado, LecturaDelFormato, MetaDeLeccion, PerfilDeEstilo } from '../types';

/*
 * QUIEN MIRA EL PERFIL SE ENTERA CUANDO CAMBIA. El paso 3 del asistente lee el
 * perfil al elegir rol y rama; si el socio enseña un formato desde el borrador
 * y vuelve al asistente, el paso tiene que decir «1 escrito» y no seguir
 * diciendo que la firma no ha enseñado nada.
 */
const oyentes = new Set<() => void>();
export const alCambiarElEstilo = (oyente: () => void): (() => void) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};
const avisar = (): void => oyentes.forEach((o) => o());

export const estiloApi = {
  /** El perfil que se aplicaría a un escrito de ese rol y esa rama (con respaldo al general del rol). */
  async perfil(rol: string, rama: string | null): Promise<PerfilDeEstilo> {
    const r = await httpClient.get<{ success: boolean } & PerfilDeEstilo>(
      `/api/estilo?rol=${encodeURIComponent(rol)}${rama ? `&rama=${encodeURIComponent(rama)}` : ''}`
    );
    return r;
  },

  /** «Leer el formato». Cobra; no guarda nada. */
  async leer(input: { texto: string; rol: string; rama: string | null; documentType: string }): Promise<LecturaDelFormato> {
    return httpClient.post<{ success: boolean } & LecturaDelFormato>('/api/estilo/leer', { body: input });
  },

  /** «Guardar el formato» con lo que el socio dejó marcado. El servidor lo vuelve a sanear. */
  async guardar(input: {
    contenido: ContenidoDeLeccion;
    rol: string;
    rama: string | null;
    documentType: string;
    fuente: FuenteDeLeccion;
  }): Promise<{ leccion: MetaDeLeccion; descartados: ItemDescartado[]; leccionesEnElAlcance: number }> {
    const r = await httpClient.post<{ success: boolean; leccion: MetaDeLeccion; descartados: ItemDescartado[]; leccionesEnElAlcance: number }>(
      '/api/estilo/lecciones',
      { body: input }
    );
    avisar();
    return r;
  },

  async retirar(id: string): Promise<void> {
    await httpClient.delete(`/api/estilo/lecciones/${encodeURIComponent(id)}`);
    avisar();
  }
};
