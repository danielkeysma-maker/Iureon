import { httpClient } from '../../../config/httpClient';

/** Un usuario de la firma, como lo responde el servidor. */
export interface UsuarioDeFirma {
  id: string;
  email: string;
  role: 'FIRM_ADMIN' | 'LAWYER' | 'SUPER_ADMIN';
  creadoEl: string;
  /** null si nunca ha entrado — información, no un hueco. */
  ultimoAcceso: string | null;
  desactivado: boolean;
  /** Lo cobrado este mes a este usuario, en pesos. */
  consumoMesCop: number;
}

/**
 * Gestión de usuarios de la firma. TODO REAL: la versión anterior guardaba la
 * lista en localStorage y el «invitar» del backend fabricaba un usuario sin
 * escribir nada — «invitado exitosamente» sobre una cuenta que no existía.
 */
export const firmUsersApi = {
  async list(): Promise<UsuarioDeFirma[]> {
    const r = await httpClient.get<{ success: boolean; users?: UsuarioDeFirma[]; message?: string }>(
      '/api/auth/users'
    );
    if (!r.success || !r.users) throw new Error(r.message ?? 'No se pudieron listar los usuarios.');
    return r.users;
  },

  /** Crea la cuenta de verdad, con contraseña. El rol nunca puede ser SUPER_ADMIN. */
  async crear(email: string, password: string, role: 'FIRM_ADMIN' | 'LAWYER'): Promise<void> {
    const r = await httpClient.post<{ success: boolean; message?: string }>('/api/auth/users', {
      body: { email, password, role }
    });
    if (!r.success) throw new Error(r.message ?? 'No se pudo crear la cuenta.');
  },

  /** Desactivar no borra nada: escritos, verificaciones y rastro permanecen. */
  async setActivo(id: string, activo: boolean): Promise<void> {
    const r = await httpClient.patch<{ success: boolean; message?: string }>(
      `/api/auth/users/${id}/estado`,
      { body: { activo } }
    );
    if (!r.success) throw new Error(r.message ?? 'No se pudo cambiar el estado.');
  },

  async setRol(id: string, role: 'FIRM_ADMIN' | 'LAWYER'): Promise<void> {
    const r = await httpClient.patch<{ success: boolean; message?: string }>(
      `/api/auth/users/${id}/rol`,
      { body: { role } }
    );
    if (!r.success) throw new Error(r.message ?? 'No se pudo cambiar el rol.');
  }
};
