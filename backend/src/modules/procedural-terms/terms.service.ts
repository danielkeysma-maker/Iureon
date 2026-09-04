import { contarDiasHabiles, fuentesDelCalendario, type OpcionesCalendario } from '../tools/calendario.service';
import type { Fuente } from '../tools/fuentes';

export interface TermCalculationRequest {
  notifiedDate: string; // YYYY-MM-DD
  termInDays: number; // Ej: 3 días (Apelación), 10 días (Contestación ordinaria), 10 días (Tutela)
  jurisdictionType: 'LABORAL' | 'CIVIL' | 'CONSTITUCIONAL' | 'ADMINISTRATIVO' | 'PENAL';
  firmId: string;
}

export interface TermCalculationResult {
  notifiedDate: string;
  startDate: string; // Día siguiente al de la notificación (Art. 118 CGP)
  dueDate: string;   // Fecha límite de vencimiento a las 5:00 PM
  dueTime: string;
  totalBusinessDays: number;
  excludedDays: {
    date: string;
    reason: string;
  }[];
  normativeReference: string;
  fuentes: Fuente[];
}

export class ProceduralTermsService {
  /**
   * Calcula el término procesal en días hábiles conforme al Art. 118 del CGP.
   *
   * ─── THE CALENDAR IS SHARED, NOT COPIED ─────────────────────────────────
   *
   * This service used to own a hand-typed list of 2026 holidays and a hard
   * coverage guard. The list had seventeen entries where the statute yields
   * eighteen (San Pedro y San Pablo was missing), so a term crossing the last
   * week of June 2026 came out one business day short — with the face of a
   * finished computation. The holidays now come from
   * `tools/calendario.service`, computed from Ley 51 de 1983 (and Ley 2578 de
   * 2026 from that year), with the vacancia judicial of Decreto 1660 de 1978
   * applied as CGP art. 118 orders. One decision point for "is this a business
   * day", used by both the terms counter and the calendar tool.
   *
   * ─── ALL IN UTC, AND IT IS NOT A STYLE CHOICE ────────────────────────────
   *
   * `new Date('2026-08-14')` is midnight UTC. Deriving the date string in UTC
   * and the weekday in local time made the two halves of the loop speak of
   * different days in Colombia (UTC−5): notified Friday 14 August 2026 with a
   * 5-day term, it returned the 21st instead of the 24th. The shared service
   * does every step in UTC.
   *
   * ─── PENAL: SEMANA SANTA IS NOT VACANCIA ────────────────────────────────
   *
   * Decreto 1660 de 1978 art. 107 lit. a) keeps despachos penales open Monday
   * to Wednesday of Semana Santa, so for PENAL those days count.
   */
  public calculateJudicialTerm(req: TermCalculationRequest): TermCalculationResult {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.notifiedDate) || Number.isNaN(Date.parse(req.notifiedDate))) {
      throw new Error('La fecha de notificación debe tener el formato AAAA-MM-DD.');
    }
    if (!Number.isInteger(req.termInDays) || req.termInDays <= 0 || req.termInDays > 3650) {
      throw new Error('El término debe ser un número entero de días hábiles entre 1 y 3650.');
    }

    const opciones: OpcionesCalendario = {
      descontarVacancia: true,
      semanaSantaCompleta: req.jurisdictionType !== 'PENAL'
    };
    const conteo = contarDiasHabiles(req.notifiedDate, req.termInDays, opciones);

    return {
      notifiedDate: req.notifiedDate,
      startDate: conteo.fechaInicio,
      dueDate: conteo.fechaFin,
      dueTime: '17:00 (5:00 PM - Cierre de Barandilla Virtual)',
      totalBusinessDays: req.termInDays,
      excludedDays: conteo.excluidos.map((d) => ({ date: d.fecha, reason: d.motivo })),
      normativeReference:
        req.jurisdictionType === 'LABORAL'
          ? 'Art. 118 Código General del Proceso (CGP), por remisión del Código Procesal del Trabajo'
          : 'Art. 118 Código General del Proceso (CGP)',
      fuentes: fuentesDelCalendario(Number(conteo.fechaFin.slice(0, 4)))
    };
  }
}
