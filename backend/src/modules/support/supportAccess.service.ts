import { supabase } from '../../config/supabase.config';
import { auditService } from '../audit/audit.service';

/**
 * Acceso de soporte: se pide, no se toma. Artboard 8a.
 *
 * ─── EL PROBLEMA QUE RESUELVE, Y POR QUÉ NO SE RESUELVE ABRIENDO EL ACCESO ──
 *
 * Operación no puede leer nada del material de una firma, y eso es correcto: es
 * la promesa que Privacidad le hace al cliente. Pero deja sin salida un caso
 * real —la firma reporta que un término aparece sin verificar en un escrito ya
 * generado, y soporte no puede reproducirlo sin verlo—. La respuesta no es
 * abrir la puerta: es hacerla PEDIBLE, TEMPORAL, VISIBLE y REVOCABLE, y poner
 * la llave en manos de un socio de la firma.
 *
 * ─── LA REGLA QUE SOSTIENE TODO LO DEMÁS ────────────────────────────────────
 *
 * `accesoActivo` es la ÚNICA función que decide si soporte puede leer, y calcula
 * la vigencia en cada llamada. No existe una columna `activo` que alguien deba
 * apagar, ni un trabajo programado que marque las vencidas: si ese trabajo no
 * corriera, el acceso sobreviviría a su plazo y nadie se enteraría. Aquí, si
 * todo lo demás se cae, el acceso se cierra solo.
 *
 * ─── QUIÉN DECIDE NO ES QUIEN PIDE ──────────────────────────────────────────
 *
 * Pide una cuenta de operación; autoriza un socio de la firma. El servicio no
 * comprueba ese reparto —lo imponen las rutas—, pero sí registra AMBOS nombres
 * en cada transición, de modo que un acceso sin autorizante identificable es
 * imposible de escribir: lo impide una restricción de la tabla.
 *
 * ─── LO QUE FALTA, DECLARADO ────────────────────────────────────────────────
 *
 * El artboard promete un RESUMEN POR CORREO al terminar, «se conserve o no la
 * incidencia», y razona que la garantía no puede depender de que alguien
 * estuviera mirando. Este proyecto no tiene infraestructura de correo, así que
 * ese resumen NO se envía. Lo que sí queda, y es su equivalente consultable, es
 * el registro completo en la auditoría de la firma más la lista de pantallas
 * abiertas, que sobrevive a la sesión. Se dice aquí para que nadie suponga que
 * el correo salió.
 */

export type SupportAccessStatus = 'PENDING' | 'AUTHORIZED' | 'DENIED';

/** Las tres del artboard. Un plazo que se escribe a mano no es un plazo máximo. */
export const DURACIONES_PERMITIDAS = [60, 240, 1440] as const;
export type DuracionPermitida = (typeof DURACIONES_PERMITIDAS)[number];

/** El motivo lo lee un socio antes de decidir: por debajo de esto no es un motivo. */
const MOTIVO_MINIMO = 30;

export interface SupportAccess {
  id: string;
  firmId: string;
  requestedBy: string;
  requestedAt: string;
  motive: string;
  scope: string;
  durationMinutes: number;
  status: SupportAccessStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
}

export interface SupportAccessView {
  id: string;
  resource: string;
  viewedAt: string;
}

/** Lo que la barra superior necesita para pintarse, y nada más. */
export interface EstadoDeAcceso {
  activo: SupportAccess | null;
  /** Minutos que faltan. `null` cuando no hay acceso activo. */
  minutosRestantes: number | null;
  pendiente: SupportAccess | null;
}

export class SupportAccessError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'SupportAccessError';
  }
}

const requireClient = () => {
  if (!supabase) {
    throw new SupportAccessError(
      'DB_UNAVAILABLE',
      'La base de datos no está configurada.',
      503
    );
  }
  return supabase;
};

interface Row {
  id: string;
  firm_id: string;
  requested_by: string;
  requested_at: string;
  motive: string;
  scope: string;
  duration_minutes: number;
  status: SupportAccessStatus;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
}

const aModelo = (r: Row): SupportAccess => ({
  id: r.id,
  firmId: r.firm_id,
  requestedBy: r.requested_by,
  requestedAt: r.requested_at,
  motive: r.motive,
  scope: r.scope,
  durationMinutes: r.duration_minutes,
  status: r.status,
  decidedBy: r.decided_by,
  decidedAt: r.decided_at,
  expiresAt: r.expires_at,
  revokedAt: r.revoked_at,
  revokedBy: r.revoked_by
});

/**
 * ¿Puede soporte leer esta firma AHORA MISMO?
 *
 * Es la única puerta. Cualquier lectura de material de la firma por parte de
 * operación tiene que pasar por aquí, y la vigencia se calcula en el momento:
 * autorizada, no revocada y con la expiración en el futuro. Las tres, siempre.
 */
export const accesoActivo = async (firmId: string): Promise<SupportAccess | null> => {
  const client = requireClient();
  const ahora = new Date().toISOString();

  const { data, error } = await client
    .from('support_access')
    .select('*')
    .eq('firm_id', firmId)
    .eq('status', 'AUTHORIZED')
    .is('revoked_at', null)
    .gt('expires_at', ahora)
    .order('decided_at', { ascending: false })
    .limit(1);

  if (error) throw new SupportAccessError('READ_FAILED', error.message, 500);
  const fila = (data ?? [])[0] as Row | undefined;
  return fila ? aModelo(fila) : null;
};

/** Lo que la aplicación consulta al cargar: la franja ámbar y la tarjeta del socio. */
export const estadoDeAcceso = async (firmId: string): Promise<EstadoDeAcceso> => {
  const client = requireClient();

  const activo = await accesoActivo(firmId);

  const { data, error } = await client
    .from('support_access')
    .select('*')
    .eq('firm_id', firmId)
    .eq('status', 'PENDING')
    .limit(1);

  if (error) throw new SupportAccessError('READ_FAILED', error.message, 500);
  const filaPendiente = (data ?? [])[0] as Row | undefined;

  return {
    activo,
    minutosRestantes: activo?.expiresAt
      ? Math.max(0, Math.ceil((new Date(activo.expiresAt).getTime() - Date.now()) / 60000))
      : null,
    pendiente: filaPendiente ? aModelo(filaPendiente) : null
  };
};

/**
 * Operación pide acceso. No concede nada: crea una pregunta.
 *
 * La tabla impone que solo haya UNA solicitud pendiente por firma. Sin esa
 * restricción, operación podría inundar a los socios hasta que alguna se
 * autorizara por cansancio, y el consentimiento dejaría de serlo.
 */
export const solicitarAcceso = async (input: {
  firmId: string;
  requestedBy: string;
  motive: string;
  scope: string;
  durationMinutes: number;
}): Promise<SupportAccess> => {
  const client = requireClient();

  const motive = input.motive.trim();
  if (motive.length < MOTIVO_MINIMO) {
    throw new SupportAccessError(
      'MOTIVE_TOO_SHORT',
      `El motivo lo lee un socio antes de decidir: escriba al menos ${MOTIVO_MINIMO} caracteres explicando qué necesita ver y por qué.`,
      400
    );
  }

  const scope = input.scope.trim();
  if (scope.length < 3) {
    throw new SupportAccessError('SCOPE_REQUIRED', 'Declare qué alcance pide.', 400);
  }

  if (!DURACIONES_PERMITIDAS.includes(input.durationMinutes as DuracionPermitida)) {
    throw new SupportAccessError(
      'DURATION_NOT_ALLOWED',
      'La duración solo puede ser de 1 hora, 4 horas o 24 horas.',
      400
    );
  }

  const { data, error } = await client
    .from('support_access')
    .insert({
      firm_id: input.firmId,
      requested_by: input.requestedBy,
      motive,
      scope,
      duration_minutes: input.durationMinutes
    })
    .select('*')
    .single();

  if (error) {
    // El índice único de «una pendiente por firma».
    if (error.code === '23505') {
      throw new SupportAccessError(
        'ALREADY_PENDING',
        'Esta firma ya tiene una solicitud de acceso sin responder.',
        409
      );
    }
    throw new SupportAccessError('REQUEST_FAILED', error.message, 500);
  }

  const acceso = aModelo(data as Row);

  // Va a la auditoría DE LA FIRMA, no a la de operación: es su cuenta la que
  // alguien quiere leer, y el registro tiene que vivir donde ella lo lee.
  await auditService.record({
    firmId: input.firmId,
    userEmail: input.requestedBy,
    action: 'SUPPORT_ACCESS_REQUESTED',
    resource: `${scope} · ${input.durationMinutes} min · motivo: ${motive}`
  });

  return acceso;
};

/**
 * Un socio decide. Autorizar calcula la expiración aquí, en el servidor.
 *
 * El cliente nunca envía `expiresAt`: si lo enviara, autorizar una hora y
 * recibir veinticuatro dependería de la buena fe de quien llama.
 */
export const decidirAcceso = async (input: {
  accessId: string;
  firmId: string;
  decidedBy: string;
  autoriza: boolean;
}): Promise<SupportAccess> => {
  const client = requireClient();

  const { data: previa, error: errorLectura } = await client
    .from('support_access')
    .select('*')
    .eq('id', input.accessId)
    .eq('firm_id', input.firmId)
    .single();

  if (errorLectura || !previa) {
    throw new SupportAccessError('NOT_FOUND', 'La solicitud no existe.', 404);
  }
  if ((previa as Row).status !== 'PENDING') {
    throw new SupportAccessError('ALREADY_DECIDED', 'Esa solicitud ya fue decidida.', 409);
  }

  const ahora = new Date();
  const fila = previa as Row;

  const cambios = input.autoriza
    ? {
        status: 'AUTHORIZED' as const,
        decided_by: input.decidedBy,
        decided_at: ahora.toISOString(),
        expires_at: new Date(ahora.getTime() + fila.duration_minutes * 60000).toISOString()
      }
    : {
        status: 'DENIED' as const,
        decided_by: input.decidedBy,
        decided_at: ahora.toISOString()
      };

  const { data, error } = await client
    .from('support_access')
    .update(cambios)
    // La condición de estado va en el UPDATE y no solo en la lectura de arriba:
    // entre leer y escribir, otro socio pudo haber decidido lo contrario.
    .eq('id', input.accessId)
    .eq('status', 'PENDING')
    .select('*')
    .single();

  if (error || !data) {
    throw new SupportAccessError('DECISION_FAILED', 'No se pudo registrar la decisión.', 409);
  }

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.decidedBy,
    action: input.autoriza ? 'SUPPORT_ACCESS_AUTHORIZED' : 'SUPPORT_ACCESS_DENIED',
    resource: input.autoriza
      ? `${fila.scope} · ${fila.duration_minutes} min · solicitado por ${fila.requested_by}`
      : `Negado a ${fila.requested_by} · ${fila.scope}`
  });

  return aModelo(data as Row);
};

/**
 * La firma corta el acceso antes de tiempo.
 *
 * Se conserva como hecho distinto de la caducidad: saber que la firma revocó a
 * los doce minutos dice algo que un vencimiento no dice.
 */
export const revocarAcceso = async (input: {
  accessId: string;
  firmId: string;
  revokedBy: string;
}): Promise<SupportAccess> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_access')
    .update({ revoked_at: new Date().toISOString(), revoked_by: input.revokedBy })
    .eq('id', input.accessId)
    .eq('firm_id', input.firmId)
    .eq('status', 'AUTHORIZED')
    .is('revoked_at', null)
    .select('*')
    .single();

  if (error || !data) {
    throw new SupportAccessError(
      'NOT_REVOCABLE',
      'No hay un acceso activo que revocar.',
      409
    );
  }

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.revokedBy,
    action: 'SUPPORT_ACCESS_REVOKED',
    resource: `Acceso de ${(data as Row).requested_by} revocado por la firma`
  });

  return aModelo(data as Row);
};

/**
 * Anota una pantalla abierta durante la sesión.
 *
 * Lo escribe el SERVIDOR en cada lectura autorizada, nunca el cliente: un
 * registro que el observado no controla y el observador tampoco. Si esto se
 * escribiera desde el frontend de operación, bastaría con no llamarlo.
 */
export const anotarLectura = async (input: {
  accessId: string;
  firmId: string;
  resource: string;
  viewerEmail: string;
}): Promise<void> => {
  const client = requireClient();

  await client.from('support_access_views').insert({
    access_id: input.accessId,
    firm_id: input.firmId,
    resource: input.resource
  });

  // También a la auditoría de la firma: el panel en vivo desaparece al cerrar la
  // sesión de soporte, y la auditoría es lo que queda para consultarlo mañana.
  await auditService.record({
    firmId: input.firmId,
    userEmail: input.viewerEmail,
    action: 'SUPPORT_ACCESS_VIEWED',
    resource: input.resource
  });
};

/** Lo que soporte ha abierto en una sesión, para el panel «en vivo». */
export const lecturasDeAcceso = async (
  accessId: string,
  firmId: string
): Promise<SupportAccessView[]> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_access_views')
    .select('id, resource, viewed_at')
    .eq('access_id', accessId)
    .eq('firm_id', firmId)
    .order('viewed_at', { ascending: false })
    .limit(100);

  if (error) throw new SupportAccessError('READ_FAILED', error.message, 500);

  return (data ?? []).map((r: { id: string; resource: string; viewed_at: string }) => ({
    id: r.id,
    resource: r.resource,
    viewedAt: r.viewed_at
  }));
};

/** El historial completo de una firma, para su ficha de operación y su auditoría. */
export const historialDeAccesos = async (firmId: string): Promise<SupportAccess[]> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_access')
    .select('*')
    .eq('firm_id', firmId)
    .order('requested_at', { ascending: false })
    .limit(50);

  if (error) throw new SupportAccessError('READ_FAILED', error.message, 500);
  return (data ?? []).map((r) => aModelo(r as Row));
};
