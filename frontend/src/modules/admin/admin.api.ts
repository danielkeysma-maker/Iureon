import { ApiError, httpClient } from '../../config/httpClient';
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
  /** Lo que operación le restó a esta firma por encima del plan. Vacío = el plan manda entero. */
  modulosDesactivados: readonly string[];
  /** Las funciones apagadas dentro de módulos que siguen encendidos. Misma columna, ids `<MODULO>.<FUNCION>`. */
  funcionesDesactivadas: readonly string[];
  /** En el plan Y no restado: lo que la firma ve de verdad. */
  modulosPermitidos: readonly string[];
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
  /** El catálogo de funciones conmutables, con nombre y descripción: lo trae el servidor, aquí no hay copia. */
  funciones: readonly FuncionConmutable[];
}

/** Un sub-servicio que el operador puede apagar dentro de un módulo encendido. Espejo de `FuncionDefinition` del servidor. */
export interface FuncionConmutable {
  id: string;
  modulo: string;
  nombre: string;
  descripcion: string;
}

/**
 * Lo que `GET /api/admin/mail/status` contesta, tal cual.
 *
 * `user` LLEGA YA ENMASCARADA (`d***@dominio`): el servidor la recorta en
 * `enmascarar()` antes de responder, y aquí no se reconstruye ni se pide
 * completa. Reconocer la cuenta basta para saber si el correo sale de donde
 * debe; publicarla entera no aporta nada y expone la casilla del titular.
 *
 * El endpoint NO dice por qué proveedor sale (Resend o Gmail): `estadoDelCorreo`
 * en el servidor solo devuelve estos tres campos. No se adivina por la forma de
 * la dirección — un `@gmail.com` puede estar saliendo por Resend igual.
 */
export interface EstadoDelCorreo {
  enabled: boolean;
  /** `null` cuando no hay correo configurado: no hay cuenta que nombrar. */
  user: string | null;
  /** El nombre que ve el destinatario junto a la dirección. */
  fromName: string;
}

/** Lo que devuelve `correoDePrueba` en el servidor, con 200 o con 502. */
export interface ResultadoDeCorreoDePrueba {
  enviado: boolean;
  /** Lo que dijo el proveedor cuando rechazó. Ausente cuando salió. */
  error?: string;
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

  /*
   * Módulos por firma: el plan es la base y aquí se resta. Se manda la lista
   * COMPLETA de lo que queda apagado, no un delta; el servidor rechaza un id
   * que no esté en el catálogo (INVALID_MODULE) y devuelve la ficha releída.
   */
  ajustarModulos: (firmId: string, input: { desactivados: string[]; motivo?: string }) =>
    httpClient.patch<{ success: boolean; modulosDesactivados: string[]; firm: FirmDetail }>(
      `/api/admin/firms/${firmId}/modulos`,
      { body: input }
    ),

  /** Cuts the firm's access now (plan_valid_until = now); the plan form reactivates it. */
  suspenderFirma: (firmId: string, motivo: string) =>
    httpClient.post<{ success: boolean }>(`/api/admin/firms/${firmId}/suspender`, { body: { motivo } }),

  /** `nombre` es opcional: quien da de alta no siempre sabe cómo lo escribe la persona. */
  addUser: (
    firmId: string,
    input: { email: string; password: string; role: 'FIRM_ADMIN' | 'LAWYER'; nombre?: string }
  ) =>
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
    }>(`/api/admin/firms/${firmId}`, { body: input }),

  /*
   * Las dos rutas de correo saliente. Existían desde hace tiempo en el servidor
   * y NADIE las llamaba: un endpoint que existe no prueba que alguien lo
   * invoque, y mientras tanto la única forma de saber si el correo salía era
   * provocar un pago real.
   */
  estadoDelCorreo: () =>
    httpClient.get<{ success: boolean } & EstadoDelCorreo>('/api/admin/mail/status'),

  /**
   * Manda el mensaje de prueba AL PROPIO OPERADOR: el servidor toma el
   * destinatario del token y no del cuerpo, así que aquí no hay nada que
   * enviar ni dirección que escoger.
   *
   * DEVUELVE EL RECHAZO EN VEZ DE LANZARLO. El endpoint contesta 502 con
   * `{ enviado: false, error: '<lo que dijo el proveedor>' }`, y ese cuerpo no
   * trae `message`: `httpClient` construye entonces un `ApiError` cuyo texto es
   * «POST … failed with 502» y deja el error de verdad en `code`. Si esto
   * lanzara tal cual, la tarjeta enseñaría el código de estado en lugar de la
   * respuesta del proveedor, que es exactamente lo que el operador necesita
   * leer para arreglarlo. Un envío rechazado es un RESULTADO del envío; el 401
   * y el 403 siguen lanzando, porque esos sí son otra cosa.
   */
  enviarCorreoDePrueba: async (): Promise<ResultadoDeCorreoDePrueba> => {
    try {
      return await httpClient.post<{ success: boolean } & ResultadoDeCorreoDePrueba>(
        '/api/admin/mail/test'
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) {
        return { enviado: false, error: err.code ?? err.message };
      }
      throw err;
    }
  }
};
