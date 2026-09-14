import { Request, Response } from 'express';
import { determinarCuantia, indexarPorIpc, liquidarIntereses } from './calculos.service';
import { calendarioDe } from './calendario.service';
import { FUENTE_IBC_PAGINA, FUENTE_IPC_PAGINA, SMLMV_POR_ANIO } from './fuentes';
import {
  CERTIFICACIONES_IBC,
  CONSULTADO_EL,
  MODALIDAD_CERTIFICADA,
  PRIMER_DIA_CERTIFICADO,
  ULTIMO_DIA_CERTIFICADO
} from './tasasCertificadas';

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

/*
 * `ibc` conserva la forma que ya leían las pantallas —la última certificación—,
 * pero ahora sale de la misma tabla con que se liquida y no de una constante
 * escrita aparte: dos copias de la misma tasa terminan diciendo cosas distintas
 * el mes en que alguien actualiza solo una. `certificaciones` anuncia el rango
 * cargado para que la pantalla lo diga antes de calcular.
 */
const ultima = CERTIFICACIONES_IBC[CERTIFICACIONES_IBC.length - 1];

export const parametrosController = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    result: {
      smlmv: SMLMV_POR_ANIO,
      ibc: {
        tasaEA: ultima.interesBancarioCorrienteEA,
        modalidad: MODALIDAD_CERTIFICADA,
        mes: ultima.desde.slice(0, 7),
        resolucion: `${ultima.resolucion} (${ultima.fechaResolucion})`,
        fuente: {
          nombre: `Interés bancario corriente · ${MODALIDAD_CERTIFICADA} · ${ultima.desde} a ${ultima.hasta}`,
          norma: `Superintendencia Financiera, ${ultima.resolucion}, art. 1`,
          url: ultima.url,
          consultadoEl: ultima.consultadoEl
        }
      },
      certificaciones: {
        modalidad: MODALIDAD_CERTIFICADA,
        desde: PRIMER_DIA_CERTIFICADO,
        hasta: ULTIMO_DIA_CERTIFICADO,
        consultadoEl: CONSULTADO_EL
      },
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

/*
 * `ibcEA` ya no se lee: la tasa de cada tramo sale de la tabla certificada. Un
 * cliente viejo que todavía lo mande recibe la misma liquidación que uno nuevo.
 */
export const interesesController = (req: Request, res: Response): void => {
  const { capital, desde, hasta, modo, tasaPactadaEA } = req.body ?? {};
  responder(res, () =>
    liquidarIntereses({
      capital: numero(capital) as number,
      desde: String(desde ?? ''),
      hasta: String(hasta ?? ''),
      modo,
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
