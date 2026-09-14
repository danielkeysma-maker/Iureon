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
  FUENTE_CGP_25_26,
  FUENTE_CGP_COMPETENCIA,
  FUENTE_CPT_2025,
  FUENTE_IPC_PAGINA,
  SMLMV_POR_ANIO,
  smlmvDe,
  type Fuente
} from './fuentes';

const esFinito = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

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

/*
 * La liquidación vive en `interesesPorTramos.ts`: cada periodo de mora con la
 * tasa que la Superintendencia Financiera certificó para ese periodo, en vez de
 * una sola tasa escrita por el abogado para todo el lapso, y con la conversión
 * exponencial de la tasa efectiva anual en vez de la división entre 365. Se
 * reexporta aquí para que el controlador siga importando del servicio de
 * cálculos.
 */
export {
  INTERES_LEGAL_CIVIL_EA,
  diasCalendarioEntre,
  liquidarIntereses,
  type InteresesInput,
  type InteresesResult,
  type ModoInteres
} from './interesesPorTramos';

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
