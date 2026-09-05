import { supabase } from '../../config/supabase.config';

/**
 * The audit trail. It records what actually happened.
 *
 * WHAT THIS REPLACES. This service used to RETURN THREE HARDCODED ENTRIES —
 * invented lawyers ("Dr. Julián Delgado"), invented IP addresses, invented
 * exports of an expediente that never existed — while `audit_logs` sat empty in
 * the schema. A firm opening the audit screen was shown a story. That is the
 * same defect as a fabricated ruling or a fabricated vector, and worse in kind:
 * an audit trail exists precisely to be believed when something goes wrong.
 *
 * WHY IT MATTERS MORE NOW. A super administrator can act across firms — create
 * them, recharge them, change their plan. Powers like that are only acceptable
 * if every use leaves a mark somebody else can read. Building them on top of a
 * log that invents its own contents would have been the opposite of oversight.
 *
 * WHY WRITES NEVER THROW. An action must not fail because its record failed;
 * the lawyer's draft is the work, the log is the account of it. A failed write
 * is reported to the server console so the gap is visible rather than silent.
 */

export type AuditAction =
  | 'FIRM_CREATED'
  | 'FIRM_UPDATED'
  | 'FIRM_CREDITS_ADDED'
  | 'FIRM_CREDITS_ADJUSTED'
  | 'DOCUMENT_REVIEWED'
  | 'DOCUMENT_REREVIEWED'
  | 'REVIEW_CHAT'
  | 'REVIEW_TEXT_STORAGE_AUTHORIZED'
  | 'FIRM_STATUS_CHANGED'
  | 'USER_CREATED'
  /** A firm opened itself through the public 7-day trial of Esencial. */
  | 'TRIAL_STARTED'
  /** A firm created itself from the public page to BUY a plan; born expired until the first payment. */
  | 'REGISTRO_PARA_COMPRA'
  | 'SUPERADMIN_LISTED_FIRMS'
  | 'DRAFT_GENERATED'
  | 'TRANSCRIPTION_CREATED'
  | 'TRANSCRIPTION_DELETED'
  | 'CATALOG_TERM_VERIFIED'
  | 'INTERVIEW_DECIDED'
  | 'ACTA_LISTA'
  /*
   * Acceso de soporte (8a). Las cinco van al rastro DE LA FIRMA, no al de
   * operación: es su material el que alguien quiere leer. `VIEWED` se escribe
   * desde el servidor en cada lectura autorizada, y es lo que sobrevive a la
   * sesión: el panel «qué ha abierto» se apaga con ella, la auditoría no.
   */
  | 'SUPPORT_ACCESS_REQUESTED'
  | 'SUPPORT_ACCESS_AUTHORIZED'
  | 'SUPPORT_ACCESS_DENIED'
  | 'SUPPORT_ACCESS_REVOKED'
  | 'SUPPORT_ACCESS_VIEWED'
  /*
   * Chat de soporte. Una sola acción para abrir, escribir, responder y
   * cerrar: lo que distingue cada hecho va en `resource`, y todas quedan en
   * el rastro DE LA FIRMA, también las que escribe el operador. Una firma
   * tiene que poder leer que operación le respondió, y cuándo.
   */
  | 'SUPPORT_CHAT_MESSAGE'
  /*
   * Plan de la firma. `PLAN_PAGADO` lo escribe el webhook de Wompi al aplicar
   * un pago aprobado, con el correo de quien inició el pago; `PLAN_ACTUALIZADO`
   * lo escribe la consola de operación cuando fija plan, periodo o vencimiento
   * a mano, con el motivo. Ambos van al rastro DE LA FIRMA.
   */
  | 'PLAN_PAGADO'
  | 'PLAN_ACTUALIZADO'
  /** The operator cut access now: `plan_valid_until = now`, so the firm reads VENCIDO from this second. */
  | 'PLAN_SUSPENDIDO'
  /*
   * Avisos por Web Push. Activar o desactivar los avisos en un dispositivo
   * queda en el rastro de la firma: es una decisión sobre por dónde sale
   * información de la firma (títulos de borradores, asuntos de soporte).
   */
  | 'PUSH_SUBSCRIBED'
  | 'PUSH_UNSUBSCRIBED'
  /*
   * Correo saliente. Se escribe SOLO cuando el envío fue aceptado por el
   * servidor de correo, nunca al intentarlo: una firma que pregunta «¿me
   * mandaron la confirmación?» tiene que poder leer la respuesta verdadera en
   * su propio rastro. `resource` dice qué se confirmó y con qué referencia.
   */
  | 'EMAIL_SENT';

export interface AuditLogEntry {
  id: string;
  firmId: string;
  userEmail: string;
  action: AuditAction | string;
  resource: string;
  ipAddress: string | null;
  timestamp: string;
}

interface AuditRow {
  id: string;
  firm_id: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string | null;
  created_at: string;
}

const toEntry = (row: AuditRow): AuditLogEntry => ({
  id: row.id,
  firmId: row.firm_id,
  userEmail: row.user_email,
  action: row.action,
  resource: row.resource,
  ipAddress: row.ip_address,
  timestamp: row.created_at
});

export class AuditService {
  /**
   * Records one action.
   *
   * `firmId` is the firm the action AFFECTS, which for a super administrator is
   * not their own: recharging a client's balance belongs in that client's
   * trail, where the client can see it, not only in the operator's.
   */
  async record(input: {
    firmId: string;
    userEmail: string;
    action: AuditAction;
    resource: string;
    ipAddress?: string | null;
  }): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('audit_logs').insert({
      firm_id: input.firmId,
      user_email: input.userEmail,
      action: input.action,
      resource: input.resource,
      ip_address: input.ipAddress ?? null
    });

    if (error) {
      console.error('[AUDIT] No se pudo registrar la acción:', input.action, error.message);
    }
  }

  /**
   * The firm's own trail, newest first.
   *
   * Returns an empty list when nothing has been recorded yet, which is the
   * honest answer for a firm that has not acted — and the answer the previous
   * version refused to give.
   */
  async getAuditLogs(firmId: string, limit = 100): Promise<AuditLogEntry[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AUDIT] No se pudo leer la auditoría:', error.message);
      return [];
    }

    return ((data ?? []) as AuditRow[]).map(toEntry);
  }
}

export const auditService = new AuditService();
