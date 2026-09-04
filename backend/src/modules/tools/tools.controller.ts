import { Request, Response } from 'express';
import { determinarCuantia, indexarPorIpc, liquidarIntereses } from './calculos.service';
import { calendarioDe } from './calendario.service';
import { FUENTE_IBC_PAGINA, FUENTE_IPC_PAGINA, IBC_ULTIMO_VERIFICADO, SMLMV_POR_ANIO } from './fuentes';

/**
 * A refused computation is a 400 with the Spanish reason, never a 500: the
 * service throws on purpose when a constant is missing or an input is
 * unusable, and the screen shows that message verbatim.
 */
const responder = (res: Response, calcular: () => unknown): void => {
  try {
    res.json({ success: true, result: calcular() });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'TOOLS_CALCULATION_REFUSED',
      message: error instanceof Error ? error.message : 'No se pudo calcular.'
    });
  }
};

const numero = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

export const parametrosController = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    result: {
      smlmv: SMLMV_POR_ANIO,
      ibc: IBC_ULTIMO_VERIFICADO,
      enlaces: { ibc: FUENTE_IBC_PAGINA, ipc: FUENTE_IPC_PAGINA }
    }
  });
};

export const indexacionController = (req: Request, res: Response): void => {
  const { valor, ipcInicial, ipcFinal, etiquetaInicial, etiquetaFinal } = req.body ?? {};
  responder(res, () =>
    indexarPorIpc({
      valor: numero(valor) as number,
      ipcInicial: numero(ipcInicial) as number,
      ipcFinal: numero(ipcFinal) as number,
      etiquetaInicial: typeof etiquetaInicial === 'string' ? etiquetaInicial.slice(0, 60) : undefined,
      etiquetaFinal: typeof etiquetaFinal === 'string' ? etiquetaFinal.slice(0, 60) : undefined
    })
  );
};

export const interesesController = (req: Request, res: Response): void => {
  const { capital, desde, hasta, modo, ibcEA, tasaPactadaEA } = req.body ?? {};
  responder(res, () =>
    liquidarIntereses({
      capital: numero(capital) as number,
      desde: String(desde ?? ''),
      hasta: String(hasta ?? ''),
      modo,
      ibcEA: numero(ibcEA),
      tasaPactadaEA: numero(tasaPactadaEA)
    })
  );
};

export const cuantiaController = (req: Request, res: Response): void => {
  const { pretension, anio, jurisdiccion } = req.body ?? {};
  responder(res, () =>
    determinarCuantia({
      pretension: numero(pretension) as number,
      anio: Number(anio),
      jurisdiccion: jurisdiccion === 'LABORAL' ? 'LABORAL' : 'CIVIL'
    })
  );
};

export const calendarioController = (req: Request, res: Response): void => {
  const anio = Number(req.query.anio ?? new Date().getUTCFullYear());
  // `semanaSanta=0` switches the Semana Santa vacancia off (penal matters); default on.
  const semanaSantaCompleta = req.query.semanaSanta === undefined ? true : req.query.semanaSanta !== '0';
  responder(res, () => calendarioDe(anio, { semanaSantaCompleta }));
};
