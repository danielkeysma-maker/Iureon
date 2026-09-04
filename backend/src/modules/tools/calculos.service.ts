/**
 * Pure calculations for the Herramientas tools: indexation, default interest
 * and competence by amount. No database, no network; every constant comes
 * from `fuentes.ts` and every answer carries the sources it used.
 *
 * ─── REFUSE RATHER THAN GUESS ───────────────────────────────────────────────
 *
 * A year without a verified SMLMV, a commercial-interest request without the
 * certified rate, an IPC pair the lawyer did not enter: each throws with the
 * reason in Spanish. The controller turns that into a 400 the screen shows.
 * The other option — a "reasonable" default — is the fabricated fallback this
 * codebase already removed twice from these very calculators.
 */
import {
  FUENTE_CC_1617,
  FUENTE_CCO_884,
  FUENTE_CGP_25_26,
  FUENTE_CGP_COMPETENCIA,
  FUENTE_CP_305,
  FUENTE_CPT_2025,
  FUENTE_IBC_PAGINA,
  FUENTE_IPC_PAGINA,
  FUENTE_LEY_510_111,
  IBC_ULTIMO_VERIFICADO,
  SMLMV_POR_ANIO,
  smlmvDe,
  type Fuente
} from './fuentes';

const esFinito = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const redondear2 = (n: number): number => Math.round(n * 100) / 100;

// ─── Indexación por IPC ─────────────────────────────────────────────────────

export interface IndexacionInput {
  valor: number;
  ipcInicial: number;
  ipcFinal: number;
  etiquetaInicial?: string;
  etiquetaFinal?: string;
}

export interface IndexacionResult {
  valor: number;
  ipcInicial: number;
  ipcFinal: number;
  factor: number;
  valorIndexado: number;
  formula: string;
  advertencias: string[];
  fuentes: Fuente[];
}

export const indexarPorIpc = (input: IndexacionInput): IndexacionResult => {
  const { valor, ipcInicial, ipcFinal } = input;
  if (!esFinito(valor) || valor <= 0) throw new Error('El valor histórico debe ser un número mayor que cero.');
  if (!esFinito(ipcInicial) || ipcInicial <= 0 || !esFinito(ipcFinal) || ipcFinal <= 0) {
    throw new Error(
      'Se necesitan los dos índices IPC (inicial y final) tomados de la página del DANE; el servidor no los tiene cargados y no los estima.'
    );
  }

  const factor = ipcFinal / ipcInicial;
  const valorIndexado = Math.round(valor * factor);
  const ini = input.etiquetaInicial ? ` (${input.etiquetaInicial})` : '';
  const fin = input.etiquetaFinal ? ` (${input.etiquetaFinal})` : '';

  const advertencias = [
    'Los índices fueron ingresados por usted: el resultado es tan exacto como esos dos valores. Use el IPC total nacional, base diciembre de 2018 = 100, del mismo cuadro del DANE para ambos meses.'
  ];
  if (factor < 1) {
    advertencias.push('El IPC final es menor que el inicial: el valor indexado queda por debajo del histórico. Verifique que no invirtió los índices.');
  }

  return {
    valor,
    ipcInicial,
    ipcFinal,
    factor,
    valorIndexado,
    formula: `${valor.toLocaleString('es-CO')} × (${ipcFinal}${fin} ÷ ${ipcInicial}${ini}) = ${valorIndexado.toLocaleString('es-CO')}`,
    advertencias,
    fuentes: [FUENTE_IPC_PAGINA]
  };
};

// ─── Intereses de mora ──────────────────────────────────────────────────────

export type ModoInteres = 'COMERCIAL' | 'CIVIL' | 'PACTADA';

export interface InteresesInput {
  capital: number;
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  modo: ModoInteres;
  ibcEA?: number;
  tasaPactadaEA?: number;
}

export interface InteresesResult {
  capital: number;
  desde: string;
  hasta: string;
  dias: number;
  modo: ModoInteres;
  tasaAnualEA: number;
  tasaDiaria: number;
  interes: number;
  total: number;
  topeUsuraEA: number | null;
  excedeUsura: boolean;
  formula: string;
  supuestos: string[];
  advertencias: string[];
  fuentes: Fuente[];
}

/** C.Co. art. 884: mora comercial = 1.5 × interés bancario corriente. */
export const moraComercialDesdeIbc = (ibcEA: number): number => redondear2(ibcEA * 1.5);

/** Interés legal civil, C.C. art. 1617 regla 1a: seis por ciento anual. */
export const INTERES_LEGAL_CIVIL_EA = 6;

const esFechaIso = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export const diasCalendarioEntre = (desde: string, hasta: string): number => {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${hasta}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
};

export const liquidarIntereses = (input: InteresesInput): InteresesResult => {
  const { capital, desde, hasta, modo } = input;
  if (!esFinito(capital) || capital <= 0) throw new Error('El capital debe ser un número mayor que cero.');
  if (!esFechaIso(desde) || !esFechaIso(hasta)) throw new Error('Las fechas deben tener el formato AAAA-MM-DD.');
  const dias = diasCalendarioEntre(desde, hasta);
  if (dias <= 0) throw new Error('La fecha de corte debe ser posterior a la fecha de exigibilidad.');

  const fuentes: Fuente[] = [];
  const advertencias: string[] = [];
  let tasaAnualEA: number;
  let topeUsuraEA: number | null = null;

  const exigirIbc = (): number => {
    if (!esFinito(input.ibcEA) || input.ibcEA <= 0) {
      throw new Error(
        'Falta el interés bancario corriente certificado para el periodo (% E.A.). La tasa cambia cada mes y el servidor no la asume: tómela de la certificación de la Superintendencia Financiera.'
      );
    }
    fuentes.push(FUENTE_IBC_PAGINA);
    if (IBC_ULTIMO_VERIFICADO && input.ibcEA === IBC_ULTIMO_VERIFICADO.tasaEA) {
      fuentes.push(IBC_ULTIMO_VERIFICADO.fuente);
      const primerMes = desde.slice(0, 7);
      const ultimoMes = hasta.slice(0, 7);
      if (primerMes !== IBC_ULTIMO_VERIFICADO.mes || ultimoMes !== IBC_ULTIMO_VERIFICADO.mes) {
        advertencias.push(
          `La tasa aplicada es la certificada para ${IBC_ULTIMO_VERIFICADO.mes}; el periodo liquidado cubre otros meses, cada uno con su propia certificación. Una liquidación exacta aplica la tasa de cada mes por separado.`
        );
      }
    } else {
      advertencias.push('El interés bancario corriente fue ingresado por usted; conserve la certificación del periodo como soporte.');
    }
    return input.ibcEA;
  };

  if (modo === 'COMERCIAL') {
    const ibc = exigirIbc();
    tasaAnualEA = moraComercialDesdeIbc(ibc);
    topeUsuraEA = tasaAnualEA;
    fuentes.push(FUENTE_CCO_884, FUENTE_LEY_510_111, FUENTE_CP_305);
  } else if (modo === 'CIVIL') {
    tasaAnualEA = INTERES_LEGAL_CIVIL_EA;
    fuentes.push(FUENTE_CC_1617);
  } else if (modo === 'PACTADA') {
    if (!esFinito(input.tasaPactadaEA) || input.tasaPactadaEA <= 0) throw new Error('Falta la tasa pactada (% E.A.).');
    const ibc = exigirIbc();
    tasaAnualEA = input.tasaPactadaEA;
    topeUsuraEA = moraComercialDesdeIbc(ibc);
    fuentes.push(FUENTE_CP_305, FUENTE_CCO_884);
  } else {
    throw new Error('Modo de interés no reconocido. Use COMERCIAL, CIVIL o PACTADA.');
  }

  const excedeUsura = topeUsuraEA !== null && tasaAnualEA > topeUsuraEA;
  if (excedeUsura) {
    advertencias.push(
      'La tasa supera el tope de usura (1,5 × interés bancario corriente): el cálculo se muestra con la tasa pactada para que se vea el exceso, pero cobrarlo constituye usura y el acreedor pierde los intereses (C.Co. art. 884).'
    );
  }

  /*
   * Simple interest over calendar days, 365-day year, no capitalisation. The
   * certified rate is efectivo anual; dividing it linearly by 365 is the
   * customary judicial liquidation convention and is stated as an assumption
   * rather than hidden. C.C. art. 1617 regla 3a forbids anatocism by default.
   */
  const tasaDiaria = tasaAnualEA / 100 / 365;
  const interes = Math.round(capital * tasaDiaria * dias);
  const total = capital + interes;

  return {
    capital,
    desde,
    hasta,
    dias,
    modo,
    tasaAnualEA,
    tasaDiaria,
    interes,
    total,
    topeUsuraEA,
    excedeUsura,
    formula: `${capital.toLocaleString('es-CO')} × (${tasaAnualEA} % ÷ 365) × ${dias} días = ${interes.toLocaleString('es-CO')}`,
    supuestos: [
      'Interés simple sobre días calendario transcurridos entre las dos fechas (la fecha inicial no cuenta; la final sí).',
      'Año de 365 días; la tasa anual se prorratea linealmente por día, sin capitalizar intereses.',
      modo === 'COMERCIAL'
        ? 'Tasa = 1,5 × interés bancario corriente certificado (C.Co. art. 884, modificado por Ley 510 de 1999 art. 111).'
        : modo === 'CIVIL'
          ? 'Tasa = interés legal civil del 6 % anual (C.C. art. 1617).'
          : 'Tasa = la pactada por las partes, contrastada con el tope de usura (1,5 × IBC; C.P. art. 305).'
    ],
    advertencias,
    fuentes
  };
};

// ─── Competencia por cuantía ────────────────────────────────────────────────

export type Jurisdiccion = 'CIVIL' | 'LABORAL';

export interface CuantiaInput {
  pretension: number;
  anio: number;
  jurisdiccion: Jurisdiccion;
}

export interface CuantiaResult {
  pretension: number;
  anio: number;
  jurisdiccion: Jurisdiccion;
  smlmv: number;
  decreto: string;
  enSmlmv: number;
  categoria: string;
  juez: string;
  instancia: string;
  regla: string;
  limites: Array<{ categoria: string; hasta: number | null; hastaPesos: number | null }>;
  advertencias: string[];
  fuentes: Fuente[];
}

/** CGP art. 25 thresholds, in SMLMV. */
export const CUANTIA_CGP = { minimaHasta: 40, menorHasta: 150 } as const;
/** Ley 2452 de 2025 art. 13 threshold, in SMLMV. */
export const CUANTIA_LABORAL_2025 = { minimaHasta: 40 } as const;
/** Ley 2452 de 2025 art. 330: vigente un año después de su publicación (2 April 2025). */
export const VIGENCIA_CPT_2025 = '2026-04-02';

export const determinarCuantia = (input: CuantiaInput): CuantiaResult => {
  const { pretension, anio, jurisdiccion } = input;
  if (!esFinito(pretension) || pretension <= 0) throw new Error('La pretensión debe ser un número mayor que cero.');
  const fila = smlmvDe(anio);
  if (!fila) {
    const anios = SMLMV_POR_ANIO.map((s) => s.anio);
    throw new Error(
      `No hay salario mínimo verificado para ${anio}. Años disponibles: ${anios[0]} a ${anios[anios.length - 1]}. Para otro año, agregue el decreto correspondiente con su fuente oficial.`
    );
  }

  const enSmlmv = pretension / fila.smlmv;
  const advertencias = [...fila.advertencias];
  const fuentes: Fuente[] = [...fila.fuentes];

  if (jurisdiccion === 'CIVIL') {
    fuentes.push(FUENTE_CGP_25_26, FUENTE_CGP_COMPETENCIA);
    const limites = [
      { categoria: 'Mínima cuantía', hasta: CUANTIA_CGP.minimaHasta, hastaPesos: CUANTIA_CGP.minimaHasta * fila.smlmv },
      { categoria: 'Menor cuantía', hasta: CUANTIA_CGP.menorHasta, hastaPesos: CUANTIA_CGP.menorHasta * fila.smlmv },
      { categoria: 'Mayor cuantía', hasta: null, hastaPesos: null }
    ];
    // Art. 25: mínima "que no excedan" 40; menor "que excedan 40 sin exceder 150"; mayor "que excedan 150".
    let categoria: string;
    let juez: string;
    let instancia: string;
    if (enSmlmv <= CUANTIA_CGP.minimaHasta) {
      categoria = 'Mínima cuantía';
      juez = 'Juez civil municipal';
      instancia = 'Única instancia (CGP art. 17 num. 1)';
    } else if (enSmlmv <= CUANTIA_CGP.menorHasta) {
      categoria = 'Menor cuantía';
      juez = 'Juez civil municipal';
      instancia = 'Primera instancia (CGP art. 18 num. 1)';
    } else {
      categoria = 'Mayor cuantía';
      juez = 'Juez civil del circuito';
      instancia = 'Primera instancia (CGP art. 20 num. 1)';
    }
    advertencias.push(
      'La cuantía se determina por el valor de todas las pretensiones al tiempo de la demanda, sin frutos, intereses, multas ni perjuicios accesorios posteriores (CGP art. 26 num. 1). Reglas especiales para deslinde, pertenencia, divisorios y otros (art. 26 nums. 2 a 9).'
    );
    return {
      pretension,
      anio,
      jurisdiccion,
      smlmv: fila.smlmv,
      decreto: fila.decretoSmlmv,
      enSmlmv,
      categoria,
      juez,
      instancia,
      regla: 'CGP art. 25: mínima ≤ 40 SMLMV · menor > 40 y ≤ 150 · mayor > 150, con el SMLMV vigente al presentar la demanda.',
      limites,
      advertencias,
      fuentes
    };
  }

  // LABORAL — only the regime in force since 2 April 2026 is verified here.
  if (anio < 2026) {
    throw new Error(
      `Para demandas laborales presentadas antes del ${VIGENCIA_CPT_2025} regía el CPTSS anterior (Decreto Ley 2158 de 1948, art. 12), cuyo texto no está verificado en esta herramienta. Se calcula solo el régimen de la Ley 2452 de 2025.`
    );
  }
  fuentes.push(FUENTE_CPT_2025);
  advertencias.push(
    `Régimen de la Ley 2452 de 2025, vigente desde el ${VIGENCIA_CPT_2025} (art. 330). Los procesos iniciados antes se rigen por el código anterior. Ya no existe la única instancia laboral por cuantía: ambas categorías se conocen en primera instancia.`
  );
  const limites = [
    { categoria: 'Mínima cuantía', hasta: CUANTIA_LABORAL_2025.minimaHasta, hastaPesos: CUANTIA_LABORAL_2025.minimaHasta * fila.smlmv },
    { categoria: 'Mayor cuantía', hasta: null, hastaPesos: null }
  ];
  const esMinima = enSmlmv <= CUANTIA_LABORAL_2025.minimaHasta;
  return {
    pretension,
    anio,
    jurisdiccion,
    smlmv: fila.smlmv,
    decreto: fila.decretoSmlmv,
    enSmlmv,
    categoria: esMinima ? 'Mínima cuantía' : 'Mayor cuantía',
    juez: esMinima ? 'Juez laboral municipal' : 'Juez laboral del circuito',
    instancia: 'Primera instancia (Ley 2452 de 2025, art. 13)',
    regla: 'Ley 2452 de 2025 art. 13: mínima cuantía hasta 40 SMLMV, mayor cuantía por encima; pretensiones al presentar la demanda.',
    limites,
    advertencias,
    fuentes
  };
};
