import { supabase } from '../../config/supabase.config';
import { auditService } from '../audit/audit.service';

/**
 * Chat de soporte dentro de la aplicación.
 *
 * ─── QUIÉN HABLA CON QUIÉN ──────────────────────────────────────────────────
 *
 * Dos interlocutores, no dos personas: la FIRMA (cualquiera de sus abogados,
 * cada uno firmando con su correo) y el OPERADOR de la plataforma. Por eso los
 * contadores de no leídos viven en la conversación, uno por lado, y no en una
 * tabla de lecturas por usuario. Un abogado que abre el hilo lo marca leído
 * para toda la firma, que es lo que una bandeja compartida significa.
 *
 * ─── LA FIRMA SE LEE DEL TOKEN; EL OPERADOR, DE LA FILA ─────────────────────
 *
 * Las funciones del lado de la firma reciben `firmId` y filtran por él: una
 * conversación de otra firma responde 404, no 403, porque para esa firma no
 * existe. Las del operador NO reciben firma —cruza todas—: buscan la fila por
 * id y toman `firm_id` de ella, de modo que la auditoría de su respuesta queda
 * en la firma correcta sin que el cliente la declare.
 *
 * ─── LO QUE NO ES ───────────────────────────────────────────────────────────
 *
 * No hay presencia («En línea»), ni cola de prioridad, ni tiempo de respuesta
 * medido. Es una bandeja que se sondea cada medio minuto. Lo que sí queda, y
 * es lo que el canal de WhatsApp nunca dio, es el registro dentro de la cuenta
 * de la firma y en su auditoría.
 */

export type LadoDelChat = 'FIRMA' | 'OPERADOR';
export type EstadoConversacion = 'ABIERTA' | 'CERRADA';

const ASUNTO_MIN = 3;
const ASUNTO_MAX = 140;
const CUERPO_MAX = 4000;
/** Lo que la bandeja muestra sin abrir el hilo. */
const VISTA_PREVIA = 140;

export interface Conversacion {
  id: string;
  firmId: string;
  openedByEmail: string;
  subject: string;
  status: EstadoConversacion;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastAuthor: LadoDelChat | null;
  unreadForFirm: number;
  unreadForOperator: number;
  closedAt: string | null;
  closedByEmail: string | null;
}

/** La misma conversación, con el nombre de la firma para la bandeja del operador. */
export interface ConversacionConFirma extends Conversacion {
  firmName: string;
}

export interface Mensaje {
  id: string;
  conversationId: string;
  authorEmail: string;
  authorSide: LadoDelChat;
  body: string;
  createdAt: string;
}

export class SupportChatError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'SupportChatError';
  }
}

const requireClient = () => {
  if (!supabase) {
    throw new SupportChatError('DB_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

interface ConversacionRow {
  id: string;
  firm_id: string;
  opened_by_email: string;
  subject: string;
  status: EstadoConversacion;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_author: LadoDelChat | null;
  unread_for_firm: number;
  unread_for_operator: number;
  closed_at: string | null;
  closed_by_email: string | null;
}

interface MensajeRow {
  id: string;
  conversation_id: string;
  author_email: string;
  author_side: LadoDelChat;
  body: string;
  created_at: string;
}

const aConversacion = (r: ConversacionRow): Conversacion => ({
  id: r.id,
  firmId: r.firm_id,
  openedByEmail: r.opened_by_email,
  subject: r.subject,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  lastMessageAt: r.last_message_at,
  lastMessagePreview: r.last_message_preview,
  lastAuthor: r.last_author,
  unreadForFirm: r.unread_for_firm,
  unreadForOperator: r.unread_for_operator,
  closedAt: r.closed_at,
  closedByEmail: r.closed_by_email
});

const aMensaje = (r: MensajeRow): Mensaje => ({
  id: r.id,
  conversationId: r.conversation_id,
  authorEmail: r.author_email,
  authorSide: r.author_side,
  body: r.body,
  createdAt: r.created_at
});

/** Recorta y valida el asunto. Los límites son los de la tabla, dichos en español antes de llegar a ella. */
const asuntoValido = (subject: string): string => {
  const asunto = subject.trim().replace(/\s+/g, ' ');
  if (asunto.length < ASUNTO_MIN) {
    throw new SupportChatError(
      'SUBJECT_TOO_SHORT',
      `Escriba un asunto de al menos ${ASUNTO_MIN} caracteres: es lo que soporte lee antes de abrir la conversación.`,
      400
    );
  }
  if (asunto.length > ASUNTO_MAX) {
    throw new SupportChatError(
      'SUBJECT_TOO_LONG',
      `El asunto no puede superar los ${ASUNTO_MAX} caracteres. El detalle va en el mensaje.`,
      400
    );
  }
  return asunto;
};

const cuerpoValido = (body: string): string => {
  const cuerpo = body.trim();
  if (cuerpo.length === 0) {
    throw new SupportChatError('BODY_REQUIRED', 'El mensaje está vacío.', 400);
  }
  if (cuerpo.length > CUERPO_MAX) {
    throw new SupportChatError(
      'BODY_TOO_LONG',
      `El mensaje no puede superar los ${CUERPO_MAX} caracteres. Si necesita más, divídalo en varios.`,
      400
    );
  }
  return cuerpo;
};

const vistaPrevia = (cuerpo: string): string => {
  const plano = cuerpo.replace(/\s+/g, ' ').trim();
  return plano.length > VISTA_PREVIA ? `${plano.slice(0, VISTA_PREVIA - 1)}…` : plano;
};

/**
 * Lee una conversación. Con `firmId`, solo si es de esa firma; sin él, la que
 * sea —esa forma la usa únicamente el operador—.
 */
const conversacionPorId = async (
  conversationId: string,
  firmId?: string
): Promise<ConversacionRow> => {
  const client = requireClient();

  let consulta = client.from('support_conversations').select('*').eq('id', conversationId);
  if (firmId) consulta = consulta.eq('firm_id', firmId);

  const { data, error } = await consulta.maybeSingle();
  if (error) throw new SupportChatError('READ_FAILED', error.message, 500);
  if (!data) {
    throw new SupportChatError('CONVERSATION_NOT_FOUND', 'La conversación no existe.', 404);
  }
  return data as ConversacionRow;
};

// ───────────────────────────────── LADO FIRMA ────────────────────────────────

/** Las conversaciones de la firma, la más reciente primero. */
export const listarConversacionesDeFirma = async (input: {
  firmId: string;
}): Promise<Conversacion[]> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_conversations')
    .select('*')
    .eq('firm_id', input.firmId)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) throw new SupportChatError('READ_FAILED', error.message, 500);
  return (data ?? []).map((r) => aConversacion(r as ConversacionRow));
};

/**
 * Abre una conversación con su primer mensaje.
 *
 * Son dos inserciones sin transacción: si la segunda falla, la conversación
 * se borra para no dejar un hilo vacío que el operador vería sin nada que
 * responder. Es la reparación honesta que cabe sin una función en la base.
 */
export const abrirConversacion = async (input: {
  firmId: string;
  userEmail: string;
  subject: string;
  body: string;
  ipAddress?: string | null;
}): Promise<{ conversacion: Conversacion; mensaje: Mensaje }> => {
  const client = requireClient();
  const asunto = asuntoValido(input.subject);
  const cuerpo = cuerpoValido(input.body);
  const ahora = new Date().toISOString();

  const { data: conv, error: errorConv } = await client
    .from('support_conversations')
    .insert({
      firm_id: input.firmId,
      opened_by_email: input.userEmail,
      subject: asunto,
      status: 'ABIERTA',
      created_at: ahora,
      updated_at: ahora,
      last_message_at: ahora,
      last_message_preview: vistaPrevia(cuerpo),
      last_author: 'FIRMA',
      unread_for_firm: 0,
      unread_for_operator: 1
    })
    .select('*')
    .single();

  if (errorConv || !conv) {
    throw new SupportChatError(
      'OPEN_FAILED',
      errorConv?.message ?? 'No se pudo abrir la conversación.',
      500
    );
  }
  const fila = conv as ConversacionRow;

  const { data: msg, error: errorMsg } = await client
    .from('support_messages')
    .insert({
      conversation_id: fila.id,
      firm_id: input.firmId,
      author_email: input.userEmail,
      author_side: 'FIRMA',
      body: cuerpo,
      created_at: ahora
    })
    .select('*')
    .single();

  if (errorMsg || !msg) {
    await client.from('support_conversations').delete().eq('id', fila.id);
    throw new SupportChatError(
      'OPEN_FAILED',
      errorMsg?.message ?? 'No se pudo guardar el primer mensaje.',
      500
    );
  }

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.userEmail,
    action: 'SUPPORT_CHAT_MESSAGE',
    resource: `Soporte: ${asunto}`,
    ipAddress: input.ipAddress ?? null
  });

  return { conversacion: aConversacion(fila), mensaje: aMensaje(msg as MensajeRow) };
};

/** Una conversación de la firma con su hilo completo, en orden cronológico. */
export const mensajesDeConversacion = async (input: {
  firmId: string;
  conversationId: string;
}): Promise<{ conversacion: Conversacion; mensajes: Mensaje[] }> => {
  const fila = await conversacionPorId(input.conversationId, input.firmId);
  const mensajes = await mensajesDelHilo(fila.id);
  return { conversacion: aConversacion(fila), mensajes };
};

const mensajesDelHilo = async (conversationId: string): Promise<Mensaje[]> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);

  if (error) throw new SupportChatError('READ_FAILED', error.message, 500);
  return (data ?? []).map((r) => aMensaje(r as MensajeRow));
};

/**
 * Escribe en un hilo, desde cualquiera de los dos lados.
 *
 * Con `firmId` se exige que el hilo sea de esa firma (lado firma). Sin él, el
 * hilo se busca por id y la firma sale de la fila (lado operador). Un mensaje
 * de la FIRMA en una conversación CERRADA la reabre: cerrar es decir «por
 * ahora está resuelto», no bloquear la puerta, y obligar a abrir otra
 * conversación para decir «volvió a pasar» rompería el hilo justo donde
 * importa leerlo entero.
 */
export const enviarMensaje = async (input: {
  firmId?: string;
  conversationId: string;
  userEmail: string;
  side: LadoDelChat;
  body: string;
  ipAddress?: string | null;
}): Promise<{ conversacion: Conversacion; mensaje: Mensaje }> => {
  const client = requireClient();
  const cuerpo = cuerpoValido(input.body);
  const fila = await conversacionPorId(input.conversationId, input.firmId);

  if (fila.status === 'CERRADA' && input.side === 'OPERADOR') {
    throw new SupportChatError(
      'CONVERSATION_CLOSED',
      'La conversación está cerrada. Si la firma vuelve a escribir, se reabre sola.',
      409
    );
  }

  const ahora = new Date().toISOString();

  const { data: msg, error: errorMsg } = await client
    .from('support_messages')
    .insert({
      conversation_id: fila.id,
      firm_id: fila.firm_id,
      author_email: input.userEmail,
      author_side: input.side,
      body: cuerpo,
      created_at: ahora
    })
    .select('*')
    .single();

  if (errorMsg || !msg) {
    throw new SupportChatError('SEND_FAILED', errorMsg?.message ?? 'No se pudo enviar el mensaje.', 500);
  }

  const reabre = fila.status === 'CERRADA' && input.side === 'FIRMA';
  const cambios: Partial<ConversacionRow> = {
    updated_at: ahora,
    last_message_at: ahora,
    last_message_preview: vistaPrevia(cuerpo),
    last_author: input.side,
    ...(input.side === 'FIRMA'
      ? { unread_for_operator: fila.unread_for_operator + 1 }
      : { unread_for_firm: fila.unread_for_firm + 1 }),
    ...(reabre ? { status: 'ABIERTA' as const, closed_at: null, closed_by_email: null } : {})
  };

  const { data: conv, error: errorConv } = await client
    .from('support_conversations')
    .update(cambios)
    .eq('id', fila.id)
    .select('*')
    .single();

  if (errorConv || !conv) {
    throw new SupportChatError(
      'SEND_FAILED',
      errorConv?.message ?? 'El mensaje se guardó pero la conversación no se pudo actualizar.',
      500
    );
  }

  await auditService.record({
    firmId: fila.firm_id,
    userEmail: input.userEmail,
    action: 'SUPPORT_CHAT_MESSAGE',
    resource: `${input.side === 'OPERADOR' ? 'Soporte respondió' : reabre ? 'Soporte reabierta' : 'Soporte'}: ${fila.subject}`,
    ipAddress: input.ipAddress ?? null
  });

  return { conversacion: aConversacion(conv as ConversacionRow), mensaje: aMensaje(msg as MensajeRow) };
};

/**
 * Pone a cero el contador del lado que abrió el hilo. No se audita: leer no
 * es un hecho sobre el que la firma necesite rendir cuentas.
 */
export const marcarLeida = async (input: {
  firmId?: string;
  conversationId: string;
  side: LadoDelChat;
}): Promise<void> => {
  const client = requireClient();
  const columna = input.side === 'FIRMA' ? 'unread_for_firm' : 'unread_for_operator';

  let consulta = client
    .from('support_conversations')
    .update({ [columna]: 0 })
    .eq('id', input.conversationId);
  if (input.firmId) consulta = consulta.eq('firm_id', input.firmId);

  const { error } = await consulta;
  if (error) throw new SupportChatError('MARK_READ_FAILED', error.message, 500);
};

/** Cuántas respuestas de soporte tiene la firma sin abrir, sumando todos sus hilos. */
export const noLeidosDeFirma = async (input: { firmId: string }): Promise<number> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_conversations')
    .select('unread_for_firm')
    .eq('firm_id', input.firmId)
    .gt('unread_for_firm', 0);

  if (error) throw new SupportChatError('READ_FAILED', error.message, 500);
  return (data ?? []).reduce((total, r) => total + Number((r as { unread_for_firm: number }).unread_for_firm), 0);
};

// ─────────────────────────────── LADO OPERADOR ───────────────────────────────

export interface BandejaDelOperador {
  conversaciones: ConversacionConFirma[];
  totales: { abiertas: number; sinLeer: number };
}

/**
 * Todas las conversaciones de todas las firmas: abiertas primero, y dentro de
 * cada grupo la más reciente arriba. El nombre de la firma se resuelve con una
 * segunda lectura en vez de un JOIN porque `firms` se identifica por
 * `firm_id` (texto) y no por su clave primaria, y PostgREST no infiere esa
 * relación sin una clave foránea declarada.
 */
export const bandejaDelOperador = async (): Promise<BandejaDelOperador> => {
  const client = requireClient();

  const { data, error } = await client
    .from('support_conversations')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(300);

  if (error) throw new SupportChatError('READ_FAILED', error.message, 500);
  const filas = (data ?? []) as ConversacionRow[];

  const firmIds = Array.from(new Set(filas.map((f) => f.firm_id)));
  const nombres = new Map<string, string>();
  if (firmIds.length > 0) {
    const { data: firmas, error: errorFirmas } = await client
      .from('firms')
      .select('firm_id, name')
      .in('firm_id', firmIds);
    if (errorFirmas) throw new SupportChatError('READ_FAILED', errorFirmas.message, 500);
    for (const f of (firmas ?? []) as Array<{ firm_id: string; name: string }>) {
      nombres.set(f.firm_id, f.name);
    }
  }

  const conversaciones = filas
    .map((r) => ({ ...aConversacion(r), firmName: nombres.get(r.firm_id) ?? r.firm_id }))
    // `updated_at desc` ya viene de la base; aquí solo se separan abiertas y cerradas.
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'ABIERTA' ? -1 : 1));

  return {
    conversaciones,
    totales: {
      abiertas: conversaciones.filter((c) => c.status === 'ABIERTA').length,
      sinLeer: conversaciones.reduce((t, c) => t + c.unreadForOperator, 0)
    }
  };
};

/** El operador abre un hilo de cualquier firma. La firma sale de la fila. */
export const conversacionParaOperador = async (input: {
  conversationId: string;
}): Promise<{ conversacion: ConversacionConFirma; mensajes: Mensaje[] }> => {
  const client = requireClient();
  const fila = await conversacionPorId(input.conversationId);

  const { data: firma } = await client
    .from('firms')
    .select('name')
    .eq('firm_id', fila.firm_id)
    .maybeSingle();

  const mensajes = await mensajesDelHilo(fila.id);
  return {
    conversacion: {
      ...aConversacion(fila),
      firmName: (firma as { name: string } | null)?.name ?? fila.firm_id
    },
    mensajes
  };
};

/**
 * Solo el operador cierra. Cerrar no borra ni bloquea: la firma puede seguir
 * escribiendo, y si lo hace el hilo se reabre. La auditoría va a la firma del
 * hilo, con el correo del operador, para que ella lea quién dio por resuelto qué.
 */
export const cerrarConversacion = async (input: {
  conversationId: string;
  userEmail: string;
  ipAddress?: string | null;
}): Promise<Conversacion> => {
  const client = requireClient();
  const fila = await conversacionPorId(input.conversationId);

  if (fila.status === 'CERRADA') {
    throw new SupportChatError('ALREADY_CLOSED', 'La conversación ya estaba cerrada.', 409);
  }

  const ahora = new Date().toISOString();
  const { data, error } = await client
    .from('support_conversations')
    .update({
      status: 'CERRADA',
      closed_at: ahora,
      closed_by_email: input.userEmail,
      updated_at: ahora
    })
    .eq('id', fila.id)
    .eq('status', 'ABIERTA')
    .select('*')
    .single();

  if (error || !data) {
    throw new SupportChatError('CLOSE_FAILED', 'No se pudo cerrar la conversación.', 409);
  }

  await auditService.record({
    firmId: fila.firm_id,
    userEmail: input.userEmail,
    action: 'SUPPORT_CHAT_MESSAGE',
    resource: `Soporte cerrada: ${fila.subject}`,
    ipAddress: input.ipAddress ?? null
  });

  return aConversacion(data as ConversacionRow);
};
