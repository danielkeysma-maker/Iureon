import {
  contarDiasCalendario,
  contarDiasHabiles,
  contarMesesOAnios,
  fuentesDelCalendario,
  type OpcionesCalendario
} from '../tools/calendario.service';
import type { Fuente } from '../tools/fuentes';

/**
 * La clase de término que se cuenta. Sin campo, `DIAS_HABILES`: es lo que el
 * contador hizo siempre, y un cliente que no conoce el campo recibe la misma
 * respuesta que antes.
 */
export type TermUnit = 'DIAS_HABILES' | 'DIAS_CALENDARIO' | 'MESES' | 'ANIOS';

export const TERM_UNIT_LABELS: Record<TermUnit, string> = {
  DIAS_HABILES: 'Días hábiles',
  DIAS_CALENDARIO: 'Días calendario',
  MESES: 'Meses',
  ANIOS: 'Años'
};

export interface TermCalculationRequest {
  notifiedDate: string; // YYYY-MM-DD
  /** La cantidad del término: días, meses o años según `termUnit`. */
  termInDays: number;
  jurisdictionType: 'LABORAL' | 'CIVIL' | 'CONSTITUCIONAL' | 'ADMINISTRATIVO' | 'PENAL';
  firmId: string;
  termUnit?: TermUnit | null;
}

export interface TermCalculationResult {
  notifiedDate: string;
  startDate: string; // Día siguiente al de la notificación (Art. 118 CGP)
  dueDate: string;   // Fecha límite de vencimiento a las 5:00 PM
  dueTime: string;
  /** Días hábiles contados; 0 cuando el término no se cuenta en días hábiles. */
  totalBusinessDays: number;
  /** Días descontados (solo en días hábiles). */
  excludedDays: {
    date: string;
    reason: string;
  }[];
  normativeReference: string;
  fuentes: Fuente[];
  termUnit: TermUnit;
  termAmount: number;
  /** Rótulo del modo, tal como lo lee el abogado en el desglose. */
  modeLabel: string;
  /** Días no hábiles que se CONTARON (días calendario): no se descontaron. */
  countedNonBusinessDays: { date: string; reason: string }[];
  /** Meses o años: la fecha antes de extenderla al primer día hábil. */
  nominalDueDate: string | null;
  /** Meses o años: los días inhábiles saltados para llegar al hábil. */
  extensionDays: { date: string; reason: string }[];
  /** Días calendario: por qué el vencimiento cae en un día no hábil, si cae. */
  dueOnNonBusinessDay: string | null;
  /** Lo que el abogado tiene que saber del modo usado, en frases. */
  notes: string[];
}

export const normalizeTermUnit = (valor: unknown): TermUnit => {
  if (valor === undefined || valor === null || valor === '') return 'DIAS_HABILES';
  if (valor === 'DIAS_HABILES' || valor === 'DIAS_CALENDARIO' || valor === 'MESES' || valor === 'ANIOS') return valor;
  throw new Error('La clase de término debe ser DIAS_HABILES, DIAS_CALENDARIO, MESES o ANIOS.');
};

const aFilas = (dias: Array<{ fecha: string; motivo: string }>): { date: string; reason: string }[] =>
  dias.map((d) => ({ date: d.fecha, reason: d.motivo }));

export class ProceduralTermsService {
  /**
   * Calcula el término procesal conforme al Art. 118 del CGP.
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
   *
   * ─── CUATRO CLASES DE TÉRMINO, CADA UNA CON LO QUE LA NORMA DICE ─────────
   *
   * Días hábiles: lo de siempre. Meses y años: la regla del art. 118, inc.
   * penúltimo, leída en el texto oficial —mismo día del mes o año, último día si
   * no lo tiene, y extensión al primer día hábil—. Días calendario: se cuenta
   * cada día y el vencimiento NO se mueve, porque el art. 118 no da esa regla
   * para ellos; el resultado lo dice y le pide al abogado verificarlo en la norma
   * que fija el término.
   */
  public calculateJudicialTerm(req: TermCalculationRequest): TermCalculationResult {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.notifiedDate) || Number.isNaN(Date.parse(req.notifiedDate))) {
      throw new Error('La fecha de notificación debe tener el formato AAAA-MM-DD.');
    }
    const unidad = normalizeTermUnit(req.termUnit);
    const cantidad = req.termInDays;

    if ((unidad === 'DIAS_HABILES' || unidad === 'DIAS_CALENDARIO') && (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 3650)) {
      throw new Error(
        unidad === 'DIAS_HABILES'
          ? 'El término debe ser un número entero de días hábiles entre 1 y 3650.'
          : 'El término debe ser un número entero de días calendario entre 1 y 3650.'
      );
    }

    const opciones: OpcionesCalendario = {
      descontarVacancia: true,
      semanaSantaCompleta: req.jurisdictionType !== 'PENAL'
    };
    const remision = req.jurisdictionType === 'LABORAL' ? ', por remisión del Código Procesal del Trabajo' : '';

    const base = {
      notifiedDate: req.notifiedDate,
      dueTime: '17:00 (5:00 PM - Cierre de Barandilla Virtual)',
      termUnit: unidad,
      termAmount: cantidad,
      modeLabel: TERM_UNIT_LABELS[unidad]
    };

    if (unidad === 'DIAS_HABILES') {
      const conteo = contarDiasHabiles(req.notifiedDate, cantidad, opciones);
      return {
        ...base,
        startDate: conteo.fechaInicio,
        dueDate: conteo.fechaFin,
        totalBusinessDays: cantidad,
        excludedDays: aFilas(conteo.excluidos),
        normativeReference: `Art. 118 Código General del Proceso (CGP)${remision}`,
        fuentes: fuentesDelCalendario(Number(conteo.fechaFin.slice(0, 4))),
        countedNonBusinessDays: [],
        nominalDueDate: null,
        extensionDays: [],
        dueOnNonBusinessDay: null,
        notes: []
      };
    }

    if (unidad === 'DIAS_CALENDARIO') {
      const conteo = contarDiasCalendario(req.notifiedDate, cantidad, opciones);
      const notes = [
        'Días calendario: se contó cada día desde el día siguiente a la notificación. No se descontaron sábados, domingos, festivos ni vacancia judicial.'
      ];
      if (conteo.venceEnNoHabil) {
        notes.push(
          `El vencimiento cae en un día no hábil (${conteo.venceEnNoHabil}). El art. 118 del CGP extiende al primer día hábil siguiente solo los términos de meses o de años; para los de días calendario no lo dice. La fecha no se movió: verifique en la norma que fija este término qué ocurre en ese caso.`
        );
      }
      return {
        ...base,
        startDate: conteo.fechaInicio,
        dueDate: conteo.fechaFin,
        totalBusinessDays: 0,
        excludedDays: [],
        normativeReference: `Art. 118 Código General del Proceso (CGP), inicio del cómputo${remision}`,
        fuentes: fuentesDelCalendario(Number(conteo.fechaFin.slice(0, 4))),
        countedNonBusinessDays: aFilas(conteo.noHabilesContados),
        nominalDueDate: null,
        extensionDays: [],
        dueOnNonBusinessDay: conteo.venceEnNoHabil,
        notes
      };
    }

    const conteo = contarMesesOAnios(req.notifiedDate, cantidad, unidad, opciones);
    const notes = [
      'Término de meses o de años (CGP art. 118): vence el mismo día del mes o año correspondiente en que empezó a correr; si ese mes no tiene ese día, el último día del mes; si el vencimiento cae en día inhábil, se extiende al primer día hábil siguiente.'
    ];
    if (conteo.alUltimoDiaDelMes) {
      notes.push(`El mes de llegada no tiene el día ${Number(conteo.fechaInicio.slice(8))}: se tomó su último día, el ${conteo.fechaNominal}.`);
    }
    if (conteo.prorroga.length > 0) {
      notes.push(`El ${conteo.fechaNominal} no es hábil: el vencimiento se extendió al ${conteo.fechaFin}.`);
    }
    return {
      ...base,
      startDate: conteo.fechaInicio,
      dueDate: conteo.fechaFin,
      totalBusinessDays: 0,
      excludedDays: [],
      normativeReference: `Art. 118 Código General del Proceso (CGP), términos de meses o de años${remision}`,
      fuentes: fuentesDelCalendario(Number(conteo.fechaFin.slice(0, 4))),
      countedNonBusinessDays: [],
      nominalDueDate: conteo.fechaNominal,
      extensionDays: aFilas(conteo.prorroga),
      dueOnNonBusinessDay: null,
      notes
    };
  }
}
