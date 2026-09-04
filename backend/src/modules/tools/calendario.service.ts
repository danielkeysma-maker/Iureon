/**
 * Judicial calendar: Colombian holidays computed from the law, not typed.
 *
 * ─── WHY COMPUTED AND NOT A TABLE ───────────────────────────────────────────
 *
 * The terms calculator used to carry a hand-typed list of 2026 holidays with a
 * hard coverage guard ("outside 2026 the computation refuses"). That guard was
 * honest, but the table under it was wrong: it had seventeen entries where
 * Ley 51 de 1983 produces eighteen — San Pedro y San Pablo (29 June, a Monday
 * in 2026) was missing, so a term crossing that week would have come out one
 * business day short. A list typed from memory is exactly the kind of source
 * this product refuses everywhere else.
 *
 * Ley 51 de 1983 is deterministic: six fixed dates, seven dates moved to the
 * following Monday, and five dates relative to Easter Sunday (Computus). Every
 * year since 1984 is derivable from the statute itself, so the calendar is
 * computed and the statute is the cited source. The check file asserts the
 * result against the known 2025 and 2026 calendars.
 *
 * ─── A NINETEENTH HOLIDAY SINCE JUNE 2026 ───────────────────────────────────
 *
 * Ley 2578 de 2026 (art. 6, in force from its promulgation on 2 June 2026)
 * declares 9 July — Nuestra Señora del Rosario de Chiquinquirá — a national
 * holiday and applies the Ley 51 transfer rule to it. It was found while
 * verifying this file against the Diario Oficial, not from memory, and the
 * Ministerio de Hacienda's 2026 días-inhábiles calendar already lists it
 * (lunes 13 de julio de 2026). It is emitted only from 2026 onwards.
 *
 * ─── WHAT IS NOT A HOLIDAY BUT IS STILL NOT A BUSINESS DAY ──────────────────
 *
 * Decreto 1660 de 1978 art. 107 defines the días de vacancia of the Rama
 * Jurisdiccional: (a) Sundays, statutory holidays AND the days of Semana Santa
 * — except despachos penales, which work Monday to Wednesday of that week —
 * and (b) 20 December to 10 January inclusive. CGP art. 118 then says terms
 * in days do not count vacancia days. Both are applied as separate, labelled
 * rules so the user sees which days were discounted for which reason, and the
 * Semana Santa one can be switched off for penal matters.
 */
import { FUENTE_CGP_118, FUENTE_LEY_2578, FUENTE_LEY_51, FUENTE_VACANCIA, type Fuente } from './fuentes';

export type ReglaFestivo = 'FIJO' | 'TRASLADO_LUNES' | 'PASCUA';

export interface Festivo {
  fecha: string; // YYYY-MM-DD
  nombre: string;
  regla: ReglaFestivo;
  /** For moved holidays, the calendar date the statute names (e.g. 06 Jan). */
  fechaOriginal?: string;
}

export interface DiaNoHabil {
  fecha: string;
  motivo: string;
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, n: number): Date => {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
};

/**
 * Easter Sunday (Gregorian), Meeus/Jones/Butcher algorithm. Pure arithmetic,
 * valid for every Gregorian year; the check file pins 2025-04-20 and 2026-04-05.
 */
export const domingoDePascua = (anio: number): Date => {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(anio, month, day);
};

/**
 * Ley 51 de 1983 art. 1 inc. 2: the listed holidays, "cuando no caigan en día
 * lunes se trasladarán al lunes siguiente"; a Sunday also moves to Monday.
 */
const alLunesSiguiente = (d: Date): Date => {
  const dow = d.getUTCDay(); // 0 Sunday … 1 Monday
  if (dow === 1) return d;
  return addDays(d, dow === 0 ? 1 : 8 - dow);
};

/** Ley 51 de 1983 has been in force since 1984; earlier years followed other rules. */
export const PRIMER_ANIO_CUBIERTO = 1984;

/** Ley 2578 de 2026 rige desde su promulgación (2 June 2026). */
const PRIMER_ANIO_CHIQUINQUIRA = 2026;

/** The statutory holidays of a given year (18; 19 from 2026), ordered by date. */
export const festivosDe = (anio: number): Festivo[] => {
  if (!Number.isInteger(anio) || anio < PRIMER_ANIO_CUBIERTO || anio > 2200) {
    throw new Error(
      `El calendario se calcula con la Ley 51 de 1983, vigente desde ${PRIMER_ANIO_CUBIERTO}; el año ${anio} está fuera de ese rango.`
    );
  }

  const fijos: Array<[number, number, string]> = [
    [1, 1, 'Año Nuevo'],
    [5, 1, 'Día del Trabajo'],
    [7, 20, 'Independencia Nacional'],
    [8, 7, 'Batalla de Boyacá'],
    [12, 8, 'Inmaculada Concepción'],
    [12, 25, 'Navidad']
  ];

  const trasladables: Array<[number, number, string]> = [
    [1, 6, 'Reyes Magos'],
    [3, 19, 'San José'],
    [6, 29, 'San Pedro y San Pablo'],
    [8, 15, 'Asunción de la Virgen'],
    [10, 12, 'Día de la Raza'],
    [11, 1, 'Todos los Santos'],
    [11, 11, 'Independencia de Cartagena']
  ];
  if (anio >= PRIMER_ANIO_CHIQUINQUIRA) {
    trasladables.push([7, 9, 'Nuestra Señora del Rosario de Chiquinquirá (Ley 2578 de 2026)']);
  }

  const pascua = domingoDePascua(anio);
  /*
   * Ascensión (+39), Corpus Christi (+60) and Sagrado Corazón (+68) are also
   * moved to the following Monday by art. 1 inc. 2; Jueves and Viernes Santo
   * are not.
   */
  const relativosAPascua: Array<[number, string, boolean]> = [
    [-3, 'Jueves Santo', false],
    [-2, 'Viernes Santo', false],
    [39, 'Ascensión del Señor', true],
    [60, 'Corpus Christi', true],
    [68, 'Sagrado Corazón de Jesús', true]
  ];

  const lista: Festivo[] = [];
  for (const [m, d, nombre] of fijos) lista.push({ fecha: iso(utc(anio, m, d)), nombre, regla: 'FIJO' });
  for (const [m, d, nombre] of trasladables) {
    const original = utc(anio, m, d);
    lista.push({ fecha: iso(alLunesSiguiente(original)), nombre, regla: 'TRASLADO_LUNES', fechaOriginal: iso(original) });
  }
  for (const [offset, nombre, seTraslada] of relativosAPascua) {
    const base = addDays(pascua, offset);
    const fecha = seTraslada ? alLunesSiguiente(base) : base;
    lista.push({ fecha: iso(fecha), nombre, regla: 'PASCUA', fechaOriginal: seTraslada ? iso(base) : undefined });
  }

  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
};

/** The Monday–Wednesday before Jueves Santo, for the optional acuerdo toggle. */
export const semanaSantaLunesAMiercoles = (anio: number): string[] => {
  const pascua = domingoDePascua(anio);
  return [-6, -5, -4].map((n) => iso(addDays(pascua, n)));
};

/** Vacancia judicial colectiva: 20 December to 10 January inclusive (Decreto 1660 de 1978 art. 107 lit. b). */
export const enVacanciaJudicial = (fecha: string): boolean => {
  const mmdd = fecha.slice(5);
  return mmdd >= '12-20' || mmdd <= '01-10';
};

export interface OpcionesCalendario {
  /** CGP art. 118 + Decreto 1660/1978 art. 107 lit. b: 20 dic – 10 ene do not count. Default on. */
  descontarVacancia?: boolean;
  /**
   * Decreto 1660/1978 art. 107 lit. a: Semana Santa is vacancia for the Rama
   * Jurisdiccional, except despachos penales (Monday–Wednesday). Default on;
   * switch off for penal matters or when the year's circular says otherwise.
   */
  semanaSantaCompleta?: boolean;
}

/**
 * Why a date is not a business day, or null when it is one. Single decision
 * point shared by the terms calculator and the calendar tool, so both agree.
 */
export const motivoNoHabil = (fecha: string, opciones: OpcionesCalendario = {}): string | null => {
  const d = new Date(`${fecha}T00:00:00Z`);
  const dow = d.getUTCDay();
  if (dow === 0) return 'Domingo (día no hábil)';
  if (dow === 6) return 'Sábado (día no hábil judicial)';

  const anio = d.getUTCFullYear();
  const festivo = festivosDe(anio).find((f) => f.fecha === fecha);
  if (festivo) return `Festivo · ${festivo.nombre}${festivo.nombre.includes('Ley 2578') ? '' : ' (Ley 51 de 1983)'}`;

  if ((opciones.descontarVacancia ?? true) && enVacanciaJudicial(fecha)) {
    return 'Vacancia judicial · 20 dic – 10 ene (Decreto 1660 de 1978 art. 107 lit. b; CGP art. 118)';
  }
  if ((opciones.semanaSantaCompleta ?? true) && semanaSantaLunesAMiercoles(anio).includes(fecha)) {
    return 'Vacancia de Semana Santa · salvo despachos penales (Decreto 1660 de 1978 art. 107 lit. a; CGP art. 118)';
  }
  return null;
};

export interface ConteoHabiles {
  fechaInicio: string;
  fechaFin: string;
  diasHabiles: number;
  excluidos: DiaNoHabil[];
}

/**
 * Count `dias` business days starting the day AFTER `desde` (CGP art. 118: the
 * term runs from the day following notification). Returns the due date.
 */
export const contarDiasHabiles = (desde: string, dias: number, opciones: OpcionesCalendario = {}): ConteoHabiles => {
  if (!Number.isInteger(dias) || dias <= 0) throw new Error('El número de días hábiles debe ser un entero mayor que cero.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || Number.isNaN(Date.parse(desde))) {
    throw new Error('La fecha debe tener el formato AAAA-MM-DD.');
  }
  let cursor = addDays(new Date(`${desde}T00:00:00Z`), 1);
  const fechaInicio = iso(cursor);
  const excluidos: DiaNoHabil[] = [];
  let contados = 0;

  while (contados < dias) {
    const fecha = iso(cursor);
    const motivo = motivoNoHabil(fecha, opciones);
    if (motivo) excluidos.push({ fecha, motivo });
    else contados += 1;
    if (contados < dias) cursor = addDays(cursor, 1);
  }

  return { fechaInicio, fechaFin: iso(cursor), diasHabiles: dias, excluidos };
};

export interface CalendarioAnual {
  anio: number;
  festivos: Festivo[];
  vacancia: { desde: string; hasta: string; descripcion: string };
  semanaSanta: { jueves: string; viernes: string; lunesAMiercoles: string[]; nota: string };
  diasHabilesPorMes: Array<{ mes: number; habiles: number; noHabiles: number }>;
  fuentes: Fuente[];
}

export const calendarioDe = (anio: number, opciones: OpcionesCalendario = {}): CalendarioAnual => {
  const festivos = festivosDe(anio);
  const pascua = domingoDePascua(anio);
  const diasHabilesPorMes: CalendarioAnual['diasHabilesPorMes'] = [];
  for (let mes = 1; mes <= 12; mes++) {
    let habiles = 0;
    let noHabiles = 0;
    const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    for (let d = 1; d <= ultimo; d++) {
      if (motivoNoHabil(iso(utc(anio, mes, d)), opciones)) noHabiles += 1;
      else habiles += 1;
    }
    diasHabilesPorMes.push({ mes, habiles, noHabiles });
  }

  return {
    anio,
    festivos,
    vacancia: {
      desde: `${anio}-12-20`,
      hasta: `${anio + 1}-01-10`,
      descripcion:
        'Vacancia judicial colectiva del 20 de diciembre al 10 de enero, inclusive (Decreto 1660 de 1978, art. 107 lit. b); los términos en días no la cuentan (CGP art. 118). Los juzgados penales municipales y de ejecución de penas siguen atendiendo.'
    },
    semanaSanta: {
      jueves: iso(addDays(pascua, -3)),
      viernes: iso(addDays(pascua, -2)),
      lunesAMiercoles: semanaSantaLunesAMiercoles(anio),
      nota:
        'Jueves y Viernes Santo son festivos de la Ley 51 de 1983. De lunes a miércoles la Semana Santa es vacancia judicial (Decreto 1660 de 1978, art. 107 lit. a), salvo para los despachos penales, que atienden esos días. Verifique la circular del Consejo Superior de la Judicatura del año.'
    },
    diasHabilesPorMes,
    fuentes: anio >= PRIMER_ANIO_CHIQUINQUIRA
      ? [FUENTE_LEY_51, FUENTE_LEY_2578, FUENTE_VACANCIA, FUENTE_CGP_118]
      : [FUENTE_LEY_51, FUENTE_VACANCIA, FUENTE_CGP_118]
  };
};

/** Sources behind any business-day count, for callers that only need the list. */
export const fuentesDelCalendario = (anio: number): Fuente[] => calendarioDe(anio).fuentes;
