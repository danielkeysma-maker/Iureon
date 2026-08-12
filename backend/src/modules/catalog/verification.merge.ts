import type { Actuacion, CatalogVerification } from './types';

/**
 * Overlays a firm's curation on the shipped catalogue.
 *
 * Pure and total: given the same base entry and verification it always yields
 * the same actuación, and it never drops an entry the firm has not touched.
 *
 * Only the term, the article and the source can be overridden. Section
 * requirements come from the norm's own text and are not editable in-product
 * yet — a firm cannot silently remove a mandatory section from a filing.
 */

export const applyVerification = (
  base: Actuacion,
  verification: CatalogVerification
): Actuacion => ({
  ...base,
  legalBasis: verification.legalBasis ?? base.legalBasis,
  sourceUrl: verification.sourceUrl ?? base.sourceUrl,
  term: verification.term,
  verification: {
    verifiedBy: verification.verifiedBy,
    verifiedAt: verification.verifiedAt,
    note: verification.note,
    // Kept so the panel can show what the shipped catalogue said before the
    // firm changed it. An override with no visible "before" is unreviewable.
    replaced: base.term
  }
});

export const applyVerifications = (
  actuaciones: Actuacion[],
  verifications: CatalogVerification[]
): Actuacion[] => {
  if (verifications.length === 0) return actuaciones;

  const byId = new Map(verifications.map((v) => [v.actuacionId, v]));

  return actuaciones.map((actuacion) => {
    const found = byId.get(actuacion.id);
    return found ? applyVerification(actuacion, found) : actuacion;
  });
};
