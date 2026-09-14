import { randomUUID } from 'node:crypto';
import { ENGINE, callOpenRouterWithUsage, type CallUsage } from '../agent/openrouter.client';
import { auditService } from '../audit/audit.service';
import { recordUsage, refundReservation, reserveForOperation, settleOperation } from '../billing/billing.service';
import { catalogService } from '../catalog/catalog.service';
import type { LegalBranch } from '../catalog/types';
import { alcanceParaRedactar, crearCasosDeEstilo, type Alcance } from './estilo.casos';
import { estiloStore } from './estilo.store';
import { ROLES_DEL_ESTILO, type EstiloAplicado, type RolDelEstilo } from './types';

/**
 * Las dependencias reales del estilo de la firma. La lógica vive en
 * `estilo.casos.ts`; aquí solo se conecta con la base, el cobro, la auditoría,
 * el catálogo y el motor.
 */

const ramasValidas = (): string[] => catalogService.listBranches();

/**
 * Rol y rama de un escrito. Cuando la actuación resuelve en el catálogo, mandan
 * los de la FICHA; si no, los que diga el taller, validados. Una rama que no
 * existe no se convierte en «general»: se rechaza, porque guardar un formato
 * en un alcance que nadie pidió es guardarlo donde nadie lo encontrará.
 */
const resolverAlcance = async (
  firmId: string,
  input: { documentType?: unknown; rol?: unknown; rama?: unknown }
): Promise<Alcance | null> => {
  const ramas = ramasValidas();
  const ramaPedida = typeof input.rama === 'string' && input.rama.trim() ? input.rama.trim() : null;
  if (ramaPedida && !ramas.includes(ramaPedida)) return null;

  let rol: RolDelEstilo | null = ROLES_DEL_ESTILO.includes(input.rol as RolDelEstilo) ? (input.rol as RolDelEstilo) : null;
  let rama = ramaPedida;

  if (typeof input.documentType === 'string' && input.documentType.trim()) {
    const { actuacion } = await catalogService.resolveForFirm(firmId, input.documentType.trim(), (rama ?? undefined) as LegalBranch | undefined);
    if (actuacion) {
      rol = actuacion.role;
      rama = actuacion.branch;
    }
  }
  return rol ? { rol, rama } : null;
};

export const casosDeEstilo = crearCasosDeEstilo({
  store: estiloStore,
  cobro: {
    reservar: ({ firmId, userEmail }) => reserveForOperation({ firmId, userEmail, operation: 'ESTILO' }),
    registrarUso: ({ firmId, userEmail, operationId, usage }) =>
      recordUsage({ firmId, userEmail, operation: 'ESTILO', operationId, usage: (usage as CallUsage | null) ?? null }),
    liquidar: ({ firmId, userEmail, operationId, reserved, description }) =>
      settleOperation({ firmId, userEmail, operation: 'ESTILO', operationId, reserved, description }),
    devolver: ({ firmId, userEmail, reason }) => refundReservation({ firmId, userEmail, operation: 'ESTILO', reason })
  },
  auditoria: { registrar: (input) => auditService.record(input) },
  leerConModelo: async (sistema, usuario) => {
    const r = await callOpenRouterWithUsage(
      ENGINE.GEMINI,
      sistema,
      usuario,
      /* Una lección cabe de sobra; el tope alto es para que el razonamiento obligatorio del motor no corte el JSON. */
      6000,
      0,
      { json: true, reasoningEffort: 'minimal', timeoutMs: 45_000 }
    );
    return { text: r.text, usage: r.usage };
  },
  resolverAlcance,
  nuevoId: () => randomUUID()
});

/**
 * El estilo para un escrito que se va a redactar, o null.
 *
 * Nunca lanza y nunca lee el estilo del navegador: del cuerpo de la petición
 * solo llegan el interruptor y el rol del taller. El texto sale de la base.
 */
export const estiloParaRedactar = async (input: {
  firmId: string;
  documentType: string;
  legalBranch?: string;
  usarEstilo: boolean;
  rolDelTaller?: string;
}): Promise<{ bloque: string; aplicado: EstiloAplicado } | null> => {
  if (!input.usarEstilo) return null;
  try {
    const ramas = ramasValidas();
    const rama = input.legalBranch && ramas.includes(input.legalBranch) ? (input.legalBranch as LegalBranch) : undefined;
    const { actuacion } = await catalogService.resolveForFirm(input.firmId, input.documentType, rama);
    const alcance = alcanceParaRedactar({
      usarEstilo: true,
      rolDeLaFicha: actuacion?.role ?? null,
      ramaDeLaFicha: actuacion?.branch ?? null,
      rolDelTaller: input.rolDelTaller,
      legalBranch: input.legalBranch,
      ramasValidas: ramas
    });
    if (!alcance) return null;
    return await casosDeEstilo.paraRedactar({ firmId: input.firmId, ...alcance });
  } catch (err) {
    console.error('[ESTILO] No se pudo resolver el estilo del escrito:', (err as Error).message);
    return null;
  }
};
