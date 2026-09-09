import type { Actuacion } from '../catalog/types';
import type { ProcedenciaDelBorrador } from './types';

/**
 * La ficha del catálogo, congelada como procedencia de un borrador.
 *
 * Es la misma foto que el motor adjunta al redactar (`resolverProcedencia` en
 * el servidor), tomada aquí porque el borrador no lo redactó el motor: nació
 * de un escrito que se corrigió en el taller de revisión y se llevó a
 * Redacción. La franja de procedencia lee esta forma y no otra, así que el
 * mapeo sigue campo por campo al del servidor.
 */
export const procedenciaDesdeActuacion = (actuacion: Actuacion): ProcedenciaDelBorrador => ({
  actuacionId: actuacion.id,
  exactName: actuacion.exactName,
  legalBasis: actuacion.legalBasis,
  sourceUrl: actuacion.sourceUrl,
  competentAuthority: actuacion.competentAuthority,
  termStatus: actuacion.term.status,
  termDescription: actuacion.term.description,
  curadaPorLaFirma: Boolean(actuacion.verification),
  definidaPorLaFirma: Boolean(actuacion.firmDefined),
  curadaPor: actuacion.verification?.verifiedBy ?? null,
  seccionesSinArticulo: actuacion.requiredSections.filter((s) => !s.basis).length,
  seccionesTotales: actuacion.requiredSections.length
});

/**
 * El título con que el escrito revisado se guarda como borrador: el nombre del
 * archivo sin extensión cuando lo hay, y si no, la actuación. «escrito» es el
 * nombre de relleno que el diálogo pone al texto pegado; no nombra nada.
 */
export const tituloParaElBorrador = (fileName: string, documentType: string): string => {
  const base = fileName.trim().replace(/\.[A-Za-z0-9]{1,5}$/, '').trim();
  if (base && base.toLowerCase() !== 'escrito') return base;
  return documentType;
};
