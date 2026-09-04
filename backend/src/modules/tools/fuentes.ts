/**
 * Every constant the Herramientas calculators use, with its official source.
 *
 * ─── THE RULE ───────────────────────────────────────────────────────────────
 *
 * No figure enters a computation without a norm, an official URL and the date
 * someone read it there. The catalogue learned this the hard way (six of nine
 * entries with an unverifiable source had the wrong deadline); a calculator
 * that multiplies by a remembered salario mínimo fails the same way, with a
 * peso sign in front. Each entry below was read on the page it links on the
 * date it states. Secondary sites (blogs, accounting portals, leyes.co) are not
 * accepted here, and a value that could not be read on an official page is
 * simply absent — the service then refuses that year or that mode and says why.
 *
 * ─── HOW TO EXTEND ──────────────────────────────────────────────────────────
 *
 * A new year's SMLMV: read the decree on funcionpublica.gov.co (Gestor
 * Normativo) or dapre.presidencia.gov.co and add the row with its URL and the
 * date. Never copy a value from a news item. The IBC: it changes monthly, so
 * only the latest value actually verified on superfinanciera.gov.co lives
 * here, labelled with its month; the tool asks the lawyer for any other period.
 */

export interface Fuente {
  nombre: string;
  norma: string;
  url: string;
  /** YYYY-MM-DD the value was read on that URL. */
  consultadoEl: string;
}

const FP = 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=';
const DAPRE = 'https://dapre.presidencia.gov.co/normativa/normativa/';

// ─── Salario mínimo y auxilio de transporte ─────────────────────────────────

export interface SmlmvAnual {
  anio: number;
  smlmv: number;
  auxilioTransporte: number;
  decretoSmlmv: string;
  decretoAuxilio: string;
  fuentes: Fuente[];
  /** Situations the lawyer must know before relying on the figure. */
  advertencias: string[];
}

export const SMLMV_POR_ANIO: readonly SmlmvAnual[] = [
  {
    anio: 2020,
    smlmv: 877_803,
    auxilioTransporte: 102_854,
    decretoSmlmv: 'Decreto 2360 de 2019',
    decretoAuxilio: 'Decreto 2361 de 2019',
    fuentes: [
      { nombre: 'SMLMV 2020', norma: 'Decreto 2360 de 2019, art. 1', url: `${FP}104493`, consultadoEl: '2026-09-04' },
      { nombre: 'Auxilio de transporte 2020', norma: 'Decreto 2361 de 2019, art. 1', url: `${FP}104512`, consultadoEl: '2026-09-04' }
    ],
    advertencias: []
  },
  {
    anio: 2021,
    smlmv: 908_526,
    auxilioTransporte: 106_454,
    decretoSmlmv: 'Decreto 1785 de 2020',
    decretoAuxilio: 'Decreto 1786 de 2020',
    fuentes: [
      { nombre: 'SMLMV 2021', norma: 'Decreto 1785 de 2020, art. 1', url: `${FP}154126`, consultadoEl: '2026-09-04' },
      { nombre: 'Auxilio de transporte 2021', norma: 'Decreto 1786 de 2020, art. 1', url: `${FP}154127`, consultadoEl: '2026-09-04' }
    ],
    advertencias: []
  },
  {
    anio: 2022,
    smlmv: 1_000_000,
    auxilioTransporte: 117_172,
    decretoSmlmv: 'Decreto 1724 de 2021',
    decretoAuxilio: 'Decreto 1725 de 2021',
    fuentes: [
      { nombre: 'SMLMV 2022', norma: 'Decreto 1724 de 2021, art. 1', url: `${FP}174267`, consultadoEl: '2026-09-04' },
      { nombre: 'Auxilio de transporte 2022', norma: 'Decreto 1725 de 2021, art. 1', url: `${FP}174268`, consultadoEl: '2026-09-04' }
    ],
    advertencias: []
  },
  {
    anio: 2023,
    smlmv: 1_160_000,
    auxilioTransporte: 140_606,
    decretoSmlmv: 'Decreto 2613 de 2022',
    decretoAuxilio: 'Decreto 2614 de 2022',
    fuentes: [
      { nombre: 'SMLMV 2023', norma: 'Decreto 2613 de 2022, art. 1', url: `${FP}200172`, consultadoEl: '2026-09-04' },
      { nombre: 'Auxilio de transporte 2023', norma: 'Decreto 2614 de 2022, art. 1', url: `${FP}200173`, consultadoEl: '2026-09-04' }
    ],
    advertencias: []
  },
  {
    anio: 2024,
    smlmv: 1_300_000,
    auxilioTransporte: 162_000,
    decretoSmlmv: 'Decreto 2292 de 2023',
    decretoAuxilio: 'Decreto 2293 de 2023',
    fuentes: [
      { nombre: 'SMLMV 2024', norma: 'Decreto 2292 de 2023, art. 1', url: `${FP}227530`, consultadoEl: '2026-09-04' },
      { nombre: 'Auxilio de transporte 2024', norma: 'Decreto 2293 de 2023, art. 1', url: `${FP}227490`, consultadoEl: '2026-09-04' }
    ],
    advertencias: []
  },
  {
    anio: 2025,
    smlmv: 1_423_500,
    auxilioTransporte: 200_000,
    decretoSmlmv: 'Decreto 1572 de 2024',
    decretoAuxilio: 'Decreto 1573 de 2024',
    fuentes: [
      { nombre: 'SMLMV 2025', norma: 'Decreto 1572 de 2024, art. 1', url: `${FP}257156`, consultadoEl: '2026-09-04' },
      { nombre: 'Auxilio de transporte 2025', norma: 'Decreto 1573 de 2024, art. 1', url: `${FP}256836`, consultadoEl: '2026-09-04' }
    ],
    advertencias: []
  },
  {
    /*
     * 2026 IS NOT SETTLED. Decreto 1469 de 2025 fixed $1.750.905; the Consejo
     * de Estado suspended it provisionally (auto of 12 Feb 2026) and Decreto
     * 0159 de 2026 re-fixed the SAME amount "transitoriamente" until judgment.
     * The figure is the same under both, so the arithmetic is safe; the
     * warning travels with the result because the legal footing can still move.
     */
    anio: 2026,
    smlmv: 1_750_905,
    auxilioTransporte: 249_095,
    decretoSmlmv: 'Decreto 1469 de 2025 (suspendido provisionalmente) y Decreto 0159 de 2026 (transitorio, mismo valor)',
    decretoAuxilio: 'Decreto 1470 de 2025',
    fuentes: [
      {
        nombre: 'SMLMV 2026 (decreto original)',
        norma: 'Decreto 1469 de 2025, art. 1',
        url: `${DAPRE}DECRETO%201469%20DEL%2029%20DE%20DICIEMBRE%20DE%202025.pdf`,
        consultadoEl: '2026-09-04'
      },
      {
        nombre: 'SMLMV 2026 (fijación transitoria tras la suspensión)',
        norma: 'Decreto 0159 de 2026, art. 1',
        url: `${DAPRE}DECRETO%20No.%200159%20DEL%2019%20DE%20FEBRERO%20DE%202026.pdf`,
        consultadoEl: '2026-09-04'
      },
      {
        nombre: 'Auxilio de transporte 2026',
        norma: 'Decreto 1470 de 2025, art. 1',
        url: `${DAPRE}DECRETO%201470%20DEL%2029%20DE%20DICIEMBRE%20DE%202025.pdf`,
        consultadoEl: '2026-09-04'
      }
    ],
    advertencias: [
      'El Decreto 1469 de 2025 está suspendido provisionalmente por el Consejo de Estado; el Decreto 0159 de 2026 fija transitoriamente el mismo valor ($1.750.905) hasta que haya sentencia. Verifique si existe decisión de fondo posterior al 4 de septiembre de 2026.'
    ]
  }
];

export const smlmvDe = (anio: number): SmlmvAnual | null => SMLMV_POR_ANIO.find((s) => s.anio === anio) ?? null;

// ─── Interés bancario corriente ─────────────────────────────────────────────

export interface IbcVerificado {
  /** % efectivo anual. */
  tasaEA: number;
  modalidad: string;
  /** YYYY-MM the certification applies to. */
  mes: string;
  resolucion: string;
  fuente: Fuente;
}

/** Stable landing page where the monthly certification is published. */
export const FUENTE_IBC_PAGINA: Fuente = {
  nombre: 'Certificaciones mensuales del interés bancario corriente (comunicados por mes)',
  norma: 'Superintendencia Financiera de Colombia · resoluciones mensuales',
  url: 'https://www.superfinanciera.gov.co/publicaciones/10829/sala-de-prensacomunicados-de-prensa-interes-bancario-corriente-10829/',
  consultadoEl: '2026-09-04'
};

/**
 * Only the most recent value read on the Superfinanciera resolution itself.
 * `null` would mean no monthly certification could be read there on the stated
 * date, and the tool then asks for the rate instead of assuming one. The value
 * is read from the PDF of the resolución, art. 1: "Certificar en un 19.49%
 * efectivo anual el interés bancario corriente para la modalidad de crédito de
 * consumo y ordinario" (1–30 September 2026).
 */
export const IBC_ULTIMO_VERIFICADO: IbcVerificado | null = {
  tasaEA: 19.49,
  modalidad: 'crédito de consumo y ordinario',
  mes: '2026-09',
  resolucion: 'Resolución 1260 de 2026 (31 de agosto de 2026)',
  fuente: {
    nombre: 'Interés bancario corriente · consumo y ordinario · septiembre de 2026 · 19,49 % E.A.',
    norma: 'Superintendencia Financiera, Resolución 1260 de 2026, art. 1',
    url: 'https://www.superfinanciera.gov.co/loader.php?lServicio=Tools2&lTipo=descargas&lFuncion=descargar&idFile=1083363',
    consultadoEl: '2026-09-04'
  }
};

// ─── IPC ────────────────────────────────────────────────────────────────────

/**
 * Why the IPC is typed by the lawyer: the DANE publishes the index series as
 * an xlsx whose URL embeds the month (files/operaciones/IPC/jul2026/...), and
 * the previous month's path stops resolving; Banco de la República's SUAMECA
 * is an Angular shell whose REST contract is undocumented and answered 500 on
 * 2026-09-04. Neither is a URL a serverless backend can trust monthly. The
 * landing page below is stable and is what the tool links.
 */
export const FUENTE_IPC_PAGINA: Fuente = {
  nombre: 'Índice de Precios al Consumidor (IPC) · índices, serie de empalme, base diciembre 2018 = 100',
  norma: 'DANE · anexo «Índices – series de empalme»',
  url: 'https://www.dane.gov.co/index.php/estadisticas-por-tema/precios-y-costos/indice-de-precios-al-consumidor-ipc',
  consultadoEl: '2026-09-04'
};

// ─── Normas ─────────────────────────────────────────────────────────────────

const CGP_URL = `${FP}48425`;

export const FUENTE_CGP_25_26: Fuente = {
  nombre: 'Cuantías mínima (≤ 40 SMLMV), menor (> 40 y ≤ 150) y mayor (> 150); SMLMV vigente al presentar la demanda',
  norma: 'Ley 1564 de 2012 (CGP), arts. 25 y 26',
  url: CGP_URL,
  consultadoEl: '2026-09-04'
};

export const FUENTE_CGP_COMPETENCIA: Fuente = {
  nombre: 'Juez civil municipal en única instancia (mínima), en primera instancia (menor); juez civil del circuito (mayor)',
  norma: 'Ley 1564 de 2012 (CGP), arts. 17 num. 1, 18 num. 1 y 20 num. 1',
  url: CGP_URL,
  consultadoEl: '2026-09-04'
};

export const FUENTE_CPT_2025: Fuente = {
  nombre: 'Laboral: jueces laborales municipales hasta 40 SMLMV, del circuito por encima; pretensiones al presentar la demanda',
  norma: 'Ley 2452 de 2025 (Código Procesal del Trabajo y de la Seguridad Social), art. 13; vigente desde el 2 de abril de 2026 (art. 330)',
  url: `${FP}259639`,
  consultadoEl: '2026-09-04'
};

export const FUENTE_CGP_118: Fuente = {
  nombre: 'Los términos en días no cuentan la vacancia judicial ni los días en que el juzgado permanezca cerrado',
  norma: 'Ley 1564 de 2012 (CGP), art. 118',
  url: CGP_URL,
  consultadoEl: '2026-09-04'
};

export const FUENTE_LEY_51: Fuente = {
  nombre: 'Días festivos nacionales; los señalados se trasladan al lunes siguiente cuando no caen en lunes',
  norma: 'Ley 51 de 1983, art. 1',
  url: `${FP}4954`,
  consultadoEl: '2026-09-04'
};

export const FUENTE_LEY_2578: Fuente = {
  nombre: 'Nuevo festivo nacional: Nuestra Señora del Rosario de Chiquinquirá (9 de julio), con la regla de traslado de la Ley 51 de 1983',
  norma: 'Ley 2578 de 2026, arts. 6 y 7 (rige desde su promulgación, Diario Oficial 53.510 del 2 de junio de 2026)',
  url: 'https://sidn.ramajudicial.gov.co/SIDN//NORMATIVA/TEXTOS_COMPLETOS/7_LEYES/LEYES%202026/Ley%202578%20de%202026.pdf',
  consultadoEl: '2026-09-04'
};

export const FUENTE_VACANCIA: Fuente = {
  nombre: 'Vacancia judicial: Semana Santa (salvo despachos penales) y del 20 de diciembre al 10 de enero, inclusive',
  norma: 'Decreto 1660 de 1978, art. 107, literales a) y b)',
  url: 'https://sidn.ramajudicial.gov.co/SIDN/NORMATIVA/TEXTOS_COMPLETOS/5_DECRETOS/DECRETOS%201978/Decreto%201660%20de%201978.pdf',
  consultadoEl: '2026-09-04'
};

export const FUENTE_CCO_884: Fuente = {
  nombre: 'Interés moratorio comercial: una y media veces el bancario corriente; el exceso se pierde',
  norma: 'Código de Comercio, art. 884 (modificado por Ley 510 de 1999, art. 111)',
  url: `${FP}41102`,
  consultadoEl: '2026-09-04'
};

export const FUENTE_CC_1617: Fuente = {
  nombre: 'Interés legal civil: «El interés legal se fija en seis por ciento anual»',
  norma: 'Código Civil (Ley 84 de 1873), art. 1617, regla 1a',
  // Secretaría del Senado answers over plain HTTP only; the Función Pública
  // gestor does not publish the Código Civil.
  url: 'http://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr049.html',
  consultadoEl: '2026-09-04'
};

export const FUENTE_CP_305: Fuente = {
  nombre: 'Usura: cobrar interés que exceda en la mitad el bancario corriente certificado',
  norma: 'Ley 599 de 2000 (Código Penal), art. 305',
  url: `${FP}6388`,
  consultadoEl: '2026-09-04'
};

export const FUENTE_LEY_510_111: Fuente = {
  nombre: 'Modificación del art. 884 del Código de Comercio (1,5 × interés bancario corriente)',
  norma: 'Ley 510 de 1999, art. 111',
  url: `${FP}9916`,
  consultadoEl: '2026-09-04'
};
