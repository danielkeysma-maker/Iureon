import { httpClient } from '../../config/httpClient';
import type {
  EstadoDeAcceso,
  SupportAccess,
  SupportAccessView
} from '../support/support.api';

/**
 * The operator console's client.
 *
 * Every call is answered only for a session whose token carries SUPER_ADMIN,
 * and the server checks that — this file cannot grant anything. It is the
 * screen for a power that already exists, not the power itself.
 */

export interface FirmSummary {
  id: string;
  name: string;
  /** Opcional: hay litigantes y despachos sin NIT. */
  nit: string | null;
  planTier: string;
  /** El plan. Los cuatro en null = cortesía legacy: sin plan asignado, sin restricción. */
  plan: 'ESENCIAL' | 'PREMIUM' | 'FIRMA' | null;
  planPeriod: 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA' | null;
  planValidUntil: string | null;
  planMaxUsers: number | null;
  status: string;
  creditsBalance: number;
  createdAt: string;
  /** Volume, never contents: how many, never what they say. */
  users: number;
  transcriptions: number;
  /** Lo cobrado en los últimos 30 días — vuelve el saldo legible en días. */
  consumo30dCop: number;
  catalogoCuradas: number;
  catalogoTotal: number;
}

/** Una cuenta de la firma: quien es y cuanto gasto, nunca en que. */
export interface ActuacionMasCurada {
  actuacionId: string;
  /** `null` cuando la firma curo algo que este paquete ya no trae. */
  exactName: string | null;
  firmas: number;
}

export interface CatalogoMaestro {
  actuacionesBase: number;
  conTerminoVerificado: number;
  sinVerificar: number;
  noCaduca: number;
  transversales: number;
  ramas: number;
  reparticion: {
    porRama: Array<{ branch: string; total: number }>;
    porRol: Array<{ role: string; total: number }>;
  };
  /** Siempre `null`: el modelo no registra derogatorias. No se adivina. */
  conNormaDerogada: null;
  firmasQueCuraron: number;
  verificacionesDeFirmas: number;
  masCuradas: ActuacionMasCurada[];
  propuestasDeFirmas: [];
  cambiosPorPublicar: [];
}

export interface FirmUserDetail {
  id: string;
  email: string;
  role: string;
  /** Cobrado este mes calendario. Cero significa que no redacto nada. */
  consumoMesCop: number;
  /** `null` en una cuenta que nunca entro — no es un cero, es una ausencia. */
  ultimoAcceso: string | null;
  creadoEl: string;
  desactivado: boolean;
}

/** Una entrada del registro de operacion, que los socios de la firma tambien ven. */
export interface OperationLogEntry {
  id: string;
  userEmail: string;
  action: string;
  resource: string;
  timestamp: string;
}

export interface FirmDetail extends FirmSummary {
  /**
   * Dias que dura el saldo al ritmo de los ultimos 30 dias.
   *
   * `null` cuando no se consumio nada en esos 30 dias: no hay ritmo, luego no
   * hay dias, e inventarlos seria justo lo que este codigo rechaza.
   */
  diasDeSaldo: number | null;
  usuariosActivos14d: number;
  usuarios: FirmUserDetail[];
  registroDeOperacion: OperationLogEntry[];
}

export const adminApi = {
  listFirms: () =>
    httpClient.get<{ firms: FirmSummary[] }>('/api/admin/firms').then((r) => r.firms),

  /**
   * Una firma, entera. El endpoint existia desde hace tiempo y NADIE lo
   * llamaba, que es por lo que la ficha 7b no podia existir.
   */
  /*
   * Acceso de soporte (8a), lado operacion. `solicitarSoporte` NO abre nada:
   * crea una pregunta que solo un socio de la firma puede responder, y el
   * servidor rechaza una segunda solicitud mientras la primera siga sin
   * respuesta. Por eso el nombre dice «solicitar» y no «acceder».
   */
  solicitarSoporte: (
    firmId: string,
    input: { motive: string; scope: string; durationMinutes: number }
  ) =>
    httpClient
      .post<{ acceso: SupportAccess }>(`/api/admin/firms/${firmId}/support-access`, { body: input })
      .then((r) => r.acceso),

  soporteDeFirma: (firmId: string) =>
    httpClient.get<{
      estado: EstadoDeAcceso;
      historial: SupportAccess[];
      lecturas: SupportAccessView[];
    }>(`/api/admin/firms/${firmId}/support-access`),

  /*
   * El catalogo maestro (8b). Lo que vuelve de la curaduria de las firmas son
   * CUENTAS, nunca contenido: el servidor no selecciona una sola columna de
   * texto escrito por un abogado de otra firma. Ver `catalogMaster.service.ts`.
   */
  catalogMaster: () =>
    httpClient
      .get<{ maestro: CatalogoMaestro }>('/api/admin/catalog-master')
      .then((r) => r.maestro),

  firmDetail: (firmId: string) =>
    httpClient.get<{ firm: FirmDetail }>(`/api/admin/firms/${firmId}`).then((r) => r.firm),

  createFirm: (input: {
    firmName: string;
    nit: string;
    adminEmail: string;
    adminPassword: string;
    initialCredits?: number;
  }) => httpClient.post<{ firm: FirmSummary }>('/api/admin/firms', { body: input }),

  /*
   * `reason` NO ES OPCIONAL EN EL SERVIDOR: `requireReason` rechaza la recarga
   * sin motivo antes de tocar dinero. Este cliente lo omitia, asi que la
   * recarga desde la consola fallaba siempre con el error del servidor. El
   * motivo va a la auditoria de la firma con el correo del operador.
   */
  addCredits: (firmId: string, amount: number, reason: string) =>
    httpClient.post<{ creditsBalance: number }>(`/api/admin/firms/${firmId}/credits`, {
      body: { amount, reason }
    }),

  updateFirm: (firmId: string, changes: { planTier?: string; status?: string; name?: string }) =>
    httpClient.patch<{ success: boolean }>(`/api/admin/firms/${firmId}`, { body: changes }),

  /*
   * Fija plan, periodo y vencimiento a mano, con motivo escrito. Así se
   * extiende una prueba, se concede una cortesía o se mueve una firma de plan
   * tras una llamada. Queda en la auditoría de la firma como PLAN_ACTUALIZADO.
   */
  updateFirmPlan: (
    firmId: string,
    input: {
      plan: 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
      period: 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';
      validUntil: string | null;
      motivo: string;
    }
  ) =>
    httpClient.patch<{ success: boolean }>(`/api/admin/firms/${firmId}/plan`, { body: input }),

  /** Cuts the firm's access now (plan_valid_until = now); the plan form reactivates it. */
  suspenderFirma: (firmId: string, motivo: string) =>
    httpClient.post<{ success: boolean }>(`/api/admin/firms/${firmId}/suspender`, { body: { motivo } }),

  addUser: (firmId: string, input: { email: string; password: string; role: 'FIRM_ADMIN' | 'LAWYER' }) =>
    httpClient.post<{ user: { id: string; email: string } }>(`/api/admin/firms/${firmId}/users`, {
      body: input
    }),

  /*
   * Contraseña puesta a mano, para soporte: no hay correo de recuperación. El
   * servidor comprueba que la cuenta sea de esa firma, y lo anota en la
   * auditoría de la firma nombrando la cuenta, nunca la contraseña.
   */
  restablecerContrasena: (firmId: string, userId: string, contrasena: string) =>
    httpClient.post<{ email: string }>(`/api/admin/firms/${firmId}/users/${userId}/password`, {
      body: { contrasena }
    }),

  /*
   * Borra la firma con TODO lo suyo. `confirmacion` es el nombre exacto de la
   * firma, tecleado; el servidor rechaza el nombre distinto, la firma del
   * propio operador y el motivo corto. Las `advertencias` son pasos que no se
   * completaron (archivos en B2, alguna cuenta) y piden una mano.
   */
  eliminarFirma: (firmId: string, input: { motivo: string; confirmacion: string }) =>
    httpClient.delete<{
      eliminada: boolean;
      tablas: Array<{ tabla: string; filas: number }>;
      usuariosEliminados: number;
      advertencias: string[];
    }>(`/api/admin/firms/${firmId}`, { body: input })
};
