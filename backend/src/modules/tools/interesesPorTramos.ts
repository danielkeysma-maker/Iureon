/**
 * Intereses de mora por tramos de tasa certificada. Función pura: sin base de
 * datos y sin red; las tasas salen de `tasasCertificadas.ts` y cada respuesta
 * lleva las fuentes que usó.
 *
 * ─── LO QUE REEMPLAZA ───────────────────────────────────────────────────────
 *
 * La liquidación anterior tomaba UNA tasa —la última certificada, prellenada, o
 * la que el abogado escribiera— y la aplicaba a todo el periodo con interés
 * simple: capital × (tasa E.A. ÷ 365) × días. Tenía dos defectos, y el segundo
 * no se veía:
 *
 * 1. Una mora de dos años se liquidaba con la tasa de este mes. La ley manda la
 *    del periodo: el C.P. art. 305 habla del interés bancario corriente «que
 *    para el período correspondiente estén cobrando los bancos», y el Decreto
 *    2555 de 2010, art. 11.2.5.1.3, del «certificado ... para el respectivo
 *    período».
 * 2. Dividir una tasa EFECTIVA anual entre 365 no es su equivalente diario. La
 *    Superintendencia lo dice sin matices en el Concepto 2006022407-002 de
 *    2006: «una tasa efectiva anual nunca se puede dividir por ningún
 *    denominador, por cuanto se trata de una función exponencial». En 30 días
 *    al 29,24 % E.A. la división lineal da 2,40 % sobre el capital; la tasa
 *    equivalente, 2,13 %. La diferencia, llevada a efectivo anual, supera la
 *    usura del periodo: una liquidación «a la tasa máxima» cobraba por encima
 *    del máximo, que es justo la conducta que el art. 884 castiga con la
 *    pérdida de todos los intereses.
 *
 * ─── LA REGLA ───────────────────────────────────────────────────────────────
 *
 * - Días: calendario, desde el día siguiente a la exigibilidad hasta la fecha
 *   de corte inclusive (días = corte − exigibilidad).
 * - Tramos: cada certificación en que caen días de mora es un tramo con su
 *   propia tasa.
 * - Tasa del tramo (E.A.): COMERCIAL, 1,5 × IBC del periodo = usura (C.Co. art.
 *   884; C.P. art. 305); PACTADA, la pactada sin pasar la usura del periodo.
 * - Factor del tramo: (1 + tasa E.A.)^(días del tramo ÷ días del año) − 1. El
 *   año es de 365 o 366 días «según los casos» (C.C. art. 67); con esa base un
 *   año entero liquidado da exactamente la tasa efectiva anual y nunca más. Los
 *   periodos certificados terminan a fin de mes o de trimestre, así que ningún
 *   tramo cruza de un año a otro.
 * - Sin capitalizar: cada tramo se liquida sobre el capital (C.C. art. 1617,
 *   regla 3a; C.Co. art. 886).
 * - CIVIL: el 6 % anual del C.C. art. 1617 es una tasa legal, no un efectivo
 *   certificado; se prorratea por días del año, partida por años calendario
 *   para que el divisor sea el de cada año.
 *
 * ─── EL RANGO ───────────────────────────────────────────────────────────────
 *
 * Un día de mora anterior a la primera certificación cargada se niega: no hay
 * tasa leída para él. Un corte posterior a la última se liquida hasta la última
 * y la respuesta lo dice; nunca se estira la tasa de un mes a los siguientes.
 */
import { FUENTE_CC_1617, FUENTE_CCO_884, FUENTE_CP_305, FUENTE_IBC_PAGINA, FUENTE_LEY_510_111, type Fuente } from './fuentes';
import {
  CERTIFICACIONES_IBC,
  CONSULTADO_EL,
  FUENTE_CC_67,
  FUENTE_DECRETO_2555_IBC,
  FUENTE_EQUIVALENCIA_EA,
  FUENTE_HISTORICO_TIBC,
  FUENTE_HISTORICO_USURA,
  MODALIDAD_CERTIFICADA,
  PRIMER_DIA_CERTIFICADO,
  ULTIMO_DIA_CERTIFICADO,
  type CertificacionIbc
} from './tasasCertificadas';

export type ModoInteres = 'COMERCIAL' | 'CIVIL' | 'PACTADA';

export interface InteresesInput {
  capital: number;
  /** Fecha de exigibilidad, AAAA-MM-DD. No cuenta como día de mora. */
  desde: string;
  /** Fecha de corte, AAAA-MM-DD. Cuenta. */
  hasta: string;
  modo: ModoInteres;
  /** % E.A. Solo en PACTADA. */
  tasaPactadaEA?: number;
}

export interface TramoDeInteres {
  desde: string;
  hasta: string;
  dias: number;
  diasDelAnio: number;
  /** % E.A. aplicada al tramo. */
  tasaEA: number;
  interesBancarioCorrienteEA: number | null;
  usuraEA: number | null;
  /** Solo PACTADA: la pactada superaba la usura del periodo y se aplicó el tope. */
  excedeUsura: boolean;
  interes: number;
  resolucion: string | null;
  url: string | null;
  nota?: string;
}

export interface InteresesResult {
  capital: number;
  desde: string;
  hasta: string;
  /** Último día liquidado: `hasta`, o la última certificación cargada si es anterior. */
  corte: string;
  dias: number;
  modo: ModoInteres;
  tasaPactadaEA: number | null;
  tramos: TramoDeInteres[];
  interes: number;
  total: number;
  excedeUsura: boolean;
  formula: string;
  supuestos: string[];
  advertencias: string[];
  fuentes: Fuente[];
  certificadas: { modalidad: string; desde: string; hasta: string; consultadoEl: string };
}

/** Interés legal civil, C.C. art. 1617 regla 1a: seis por ciento anual. */
export const INTERES_LEGAL_CIVIL_EA = 6;

// ─── Fechas ─────────────────────────────────────────────────────────────────

const DIA_MS = 86_400_000;
const ms = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);
const iso = (t: number): string => new Date(t).toISOString().slice(0, 10);
const masDias = (fecha: string, n: number): string => iso(ms(fecha) + n * DIA_MS);

/** Una fecha AAAA-MM-DD que existe en el calendario (rechaza el 30 de febrero). */
const esFechaIso = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(ms(s)) && iso(ms(s)) === s;

export const diasCalendarioEntre = (desde: string, hasta: string): number => Math.round((ms(hasta) - ms(desde)) / DIA_MS);

export const diasDelAnio = (anio: number): number => ((anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0 ? 366 : 365);

/** (1 + EA)^(días ÷ días del año) − 1, con la tasa en porcentaje. */
export const factorEfectivo = (tasaEA: number, dias: number, diasAnio: number): number => Math.pow(1 + tasaEA / 100, dias / diasAnio) - 1;

const esFinito = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const pesos = (n: number): string => `$${n.toLocaleString('es-CO')}`;
const porcentaje = (n: number): string => `${n.toLocaleString('es-CO', { maximumFractionDigits: 3 })} %`;

// ─── Tramos ─────────────────────────────────────────────────────────────────

export interface TramoCertificado {
  desde: string;
  hasta: string;
  dias: number;
  fila: CertificacionIbc;
}

/**
 * Parte los días de mora (desde exclusivo, hasta inclusivo) en las
 * certificaciones que tocan. Niega si el primer día de mora no está cubierto;
 * si el corte pasa de la última certificación, corta ahí y lo informa.
 */
export const partirEnTramos = (
  desde: string,
  hasta: string,
  tabla: readonly CertificacionIbc[] = CERTIFICACIONES_IBC
): { tramos: TramoCertificado[]; corte: string; recortado: boolean } => {
  const primera = tabla[0].desde;
  const ultima = tabla[tabla.length - 1].hasta;
  const primerDia = masDias(desde, 1);
  if (primerDia < primera) {
    throw new Error(
      `Las tasas certificadas cargadas empiezan el ${primera}, y la mora que pide liquidar empieza el ${primerDia}. Para días anteriores no hay tasa leída en la Superintendencia Financiera y la herramienta no la estima.`
    );
  }
  if (primerDia > ultima) {
    throw new Error(
      `La última certificación cargada termina el ${ultima}, y la mora que pide liquidar empieza el ${primerDia}. Para esos días no hay certificación cargada y la herramienta no extiende la última tasa.`
    );
  }
  const corte = hasta < ultima ? hasta : ultima;
  const tramos: TramoCertificado[] = [];
  for (const fila of tabla) {
    if (fila.hasta < primerDia || fila.desde > corte) continue;
    const tDesde = fila.desde > primerDia ? fila.desde : primerDia;
    const tHasta = fila.hasta < corte ? fila.hasta : corte;
    tramos.push({ desde: tDesde, hasta: tHasta, dias: diasCalendarioEntre(tDesde, tHasta) + 1, fila });
  }
  return { tramos, corte, recortado: hasta > ultima };
};

/** Días de mora partidos por años calendario, para el interés legal civil. */
const partirPorAnios = (desde: string, hasta: string): Array<{ desde: string; hasta: string; dias: number; anio: number }> => {
  const tramos: Array<{ desde: string; hasta: string; dias: number; anio: number }> = [];
  let inicio = masDias(desde, 1);
  while (inicio <= hasta) {
    const anio = Number(inicio.slice(0, 4));
    const finDeAnio = `${anio}-12-31`;
    const fin = finDeAnio < hasta ? finDeAnio : hasta;
    tramos.push({ desde: inicio, hasta: fin, dias: diasCalendarioEntre(inicio, fin) + 1, anio });
    inicio = masDias(fin, 1);
  }
  return tramos;
};

// ─── Liquidación ────────────────────────────────────────────────────────────

const SUPUESTO_DIAS = 'Días calendario: la fecha de exigibilidad no cuenta; la de corte sí.';
const SUPUESTO_SIN_CAPITALIZAR =
  'Sin capitalizar: cada tramo se liquida sobre el capital; los intereses no producen intereses (C.C. art. 1617, regla 3a; C.Co. art. 886).';

export const liquidarIntereses = (input: InteresesInput): InteresesResult => {
  const { capital, desde, hasta, modo } = input;
  if (!esFinito(capital) || capital <= 0) throw new Error('El capital debe ser un número mayor que cero.');
  if (!esFechaIso(desde) || !esFechaIso(hasta)) throw new Error('Las fechas deben tener el formato AAAA-MM-DD y existir en el calendario.');
  if (diasCalendarioEntre(desde, hasta) <= 0) throw new Error('La fecha de corte debe ser posterior a la fecha de exigibilidad.');
  if (modo !== 'COMERCIAL' && modo !== 'CIVIL' && modo !== 'PACTADA') {
    throw new Error('Modo de interés no reconocido. Use COMERCIAL, CIVIL o PACTADA.');
  }

  const certificadas = { modalidad: MODALIDAD_CERTIFICADA, desde: PRIMER_DIA_CERTIFICADO, hasta: ULTIMO_DIA_CERTIFICADO, consultadoEl: CONSULTADO_EL };

  if (modo === 'CIVIL') {
    const tramos: TramoDeInteres[] = partirPorAnios(desde, hasta).map((t) => {
      const anual = diasDelAnio(t.anio);
      return {
        desde: t.desde,
        hasta: t.hasta,
        dias: t.dias,
        diasDelAnio: anual,
        tasaEA: INTERES_LEGAL_CIVIL_EA,
        interesBancarioCorrienteEA: null,
        usuraEA: null,
        excedeUsura: false,
        interes: Math.round((capital * (INTERES_LEGAL_CIVIL_EA / 100) * t.dias) / anual),
        resolucion: null,
        url: null
      };
    });
    const interes = tramos.reduce((s, t) => s + t.interes, 0);
    return {
      capital,
      desde,
      hasta,
      corte: hasta,
      dias: diasCalendarioEntre(desde, hasta),
      modo,
      tasaPactadaEA: null,
      tramos,
      interes,
      total: capital + interes,
      excedeUsura: false,
      formula: `${pesos(capital)} × 6 % × días ÷ días del año, por año calendario = ${pesos(interes)}`,
      supuestos: [
        SUPUESTO_DIAS,
        'Interés legal civil del 6 % anual (C.C. art. 1617). Es una tasa legal fija, no un efectivo anual certificado: se prorratea por los días de cada año (365 o 366, C.C. art. 67).',
        SUPUESTO_SIN_CAPITALIZAR
      ],
      advertencias: [],
      fuentes: [FUENTE_CC_1617, FUENTE_CC_67],
      certificadas
    };
  }

  let pactada: number | null = null;
  if (modo === 'PACTADA') {
    if (!esFinito(input.tasaPactadaEA) || input.tasaPactadaEA <= 0) throw new Error('Falta la tasa pactada (% E.A.).');
    pactada = input.tasaPactadaEA;
  }

  const { tramos: partes, corte, recortado } = partirEnTramos(desde, hasta);
  const tramos: TramoDeInteres[] = partes.map((p) => {
    const anual = diasDelAnio(Number(p.desde.slice(0, 4)));
    const excede = pactada !== null && pactada > p.fila.usuraEA;
    const tasaEA = pactada !== null && !excede ? pactada : p.fila.usuraEA;
    return {
      desde: p.desde,
      hasta: p.hasta,
      dias: p.dias,
      diasDelAnio: anual,
      tasaEA,
      interesBancarioCorrienteEA: p.fila.interesBancarioCorrienteEA,
      usuraEA: p.fila.usuraEA,
      excedeUsura: excede,
      interes: Math.round(capital * factorEfectivo(tasaEA, p.dias, anual)),
      resolucion: p.fila.resolucion,
      url: p.fila.url,
      ...(p.fila.nota ? { nota: p.fila.nota } : {})
    };
  });
  const interes = tramos.reduce((s, t) => s + t.interes, 0);
  const excedidos = tramos.filter((t) => t.excedeUsura);

  const advertencias: string[] = [];
  if (recortado) {
    advertencias.push(
      `La liquidación se detiene el ${corte} y no llega al ${hasta}: no hay certificación cargada después de esa fecha (tasas consultadas el ${CONSULTADO_EL}). Los días posteriores no se liquidan con una tasa que no se ha leído.`
    );
  }
  if (excedidos.length > 0) {
    advertencias.push(
      `En ${excedidos.length === 1 ? 'un tramo' : `${excedidos.length} tramos`} la tasa pactada (${porcentaje(pactada ?? 0)} E.A.) supera la usura del periodo y se liquidó al tope. Cobrar por encima es usura (C.P. art. 305), y cuando el interés sobrepasa el límite el acreedor pierde todos los intereses (C.Co. art. 884, con la salvedad del art. 72 de la Ley 45 de 1990). La cifra muestra lo máximo que el tope permite, no lo que quedaría exigible tras esa sanción.`
    );
  }

  // Una resolución leída en su propio documento se cita además del histórico.
  const resoluciones: Fuente[] = [];
  for (const t of tramos) {
    if (t.url && t.url !== FUENTE_HISTORICO_TIBC.url && !resoluciones.some((f) => f.url === t.url)) {
      resoluciones.push({
        nombre: `${t.resolucion} · interés bancario corriente, ${MODALIDAD_CERTIFICADA}`,
        norma: `Superintendencia Financiera de Colombia, ${t.resolucion}, art. 1`,
        url: t.url,
        consultadoEl: CONSULTADO_EL
      });
    }
  }

  return {
    capital,
    desde,
    hasta,
    corte,
    dias: diasCalendarioEntre(desde, corte),
    modo,
    tasaPactadaEA: pactada,
    tramos,
    interes,
    total: capital + interes,
    excedeUsura: excedidos.length > 0,
    formula: `Σ ${pesos(capital)} × ((1 + tasa E.A. del tramo)^(días ÷ días del año) − 1), en ${tramos.length} ${tramos.length === 1 ? 'tramo' : 'tramos'} = ${pesos(interes)}`,
    supuestos: [
      SUPUESTO_DIAS,
      'Cada tramo aplica la tasa del periodo de certificación en que caen sus días, no la de hoy (C.P. art. 305: «para el período correspondiente»; Decreto 2555 de 2010, art. 11.2.5.1.3).',
      modo === 'COMERCIAL'
        ? 'Tasa del tramo = 1,5 × interés bancario corriente del periodo, que es a la vez el tope de usura (C.Co. art. 884, modificado por la Ley 510 de 1999, art. 111; C.P. art. 305).'
        : 'Tasa del tramo = la pactada, sin pasar la usura del periodo (1,5 × interés bancario corriente; C.P. art. 305).',
      'Conversión: factor del tramo = (1 + tasa E.A.)^(días del tramo ÷ días del año) − 1. Una tasa efectiva anual no se divide linealmente (Superintendencia Financiera, Concepto 2006022407-002 de 2006); el año es de 365 o 366 días (C.C. art. 67).',
      SUPUESTO_SIN_CAPITALIZAR,
      `Modalidad: ${MODALIDAD_CERTIFICADA}, la que el Decreto 2555 de 2010 (art. 11.2.5.1.3) manda usar para obligaciones que no nacen de una operación activa de crédito. Si la deuda es un microcrédito o un crédito productivo, rige la tasa de esa modalidad y esta liquidación no aplica.`
    ],
    advertencias,
    fuentes: [
      FUENTE_HISTORICO_TIBC,
      FUENTE_HISTORICO_USURA,
      ...resoluciones,
      FUENTE_IBC_PAGINA,
      FUENTE_DECRETO_2555_IBC,
      FUENTE_CCO_884,
      FUENTE_LEY_510_111,
      FUENTE_CP_305,
      FUENTE_EQUIVALENCIA_EA,
      FUENTE_CC_67
    ],
    certificadas
  };
};
