import type { Actuacion, CatalogVerification } from './types';

/**
 * La clave de una curaduria: la ficha Y la rama en la que se verifico.
 *
 * Hizo falta cuando una misma ficha empezo a aparecer en varias ramas por
 * remision. `civil/recurso-de-reposicion` es una sola ficha; verificar su
 * plazo para FAMILIA no puede mover el que ya esta verificado para lo civil.
 * Una curaduria sin rama (`null`) es la de la rama propia de la ficha, que es
 * como se guardo todo hasta ahora.
 */
const clave = (actuacionId: string, rama: string | null): string =>
  `${actuacionId}@@${rama ?? ''}`;

const claveDe = (actuacion: Actuacion): string =>
  clave(actuacion.id, actuacion.porRemision?.paraRama ?? null);

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

/**
 * El fundamento que queda cuando la firma cura una ficha prestada.
 *
 * La ficha prestada llega con una coletilla que dice «no afirme que este plazo
 * es el de esta rama». En cuanto la firma verifica el plazo PARA esta rama esa
 * frase deja de ser cierta y pasa a ser un estorbo: el motor recibiria a la vez
 * un termino verificado y la orden de no afirmarlo. Se cambia por la que si es
 * cierta — de donde llega la ficha, y quien comprobo el plazo aqui.
 */
const fundamentoCurado = (base: Actuacion, verification: CatalogVerification): string => {
  const propuesto = verification.legalBasis ?? null;
  const sobre = base.porRemision;

  if (!sobre) return propuesto ?? base.legalBasis;
  if (propuesto) return propuesto;
  if (verification.term.status === 'NO_VERIFICADO') return base.legalBasis;

  return `${sobre.legalBasisEnLaRamaFuente} — llega a ${sobre.paraRama} por remisión (${sobre.base}); el plazo para esta rama lo verificó su firma.`;
};

export const applyVerification = (
  base: Actuacion,
  verification: CatalogVerification
): Actuacion => ({
  ...base,
  legalBasis: fundamentoCurado(base, verification),
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

  const byId = new Map(verifications.map((v) => [clave(v.actuacionId, v.rama), v]));

  return actuaciones.map((actuacion) => {
    const found = byId.get(claveDe(actuacion));
    return found ? applyVerification(actuacion, found) : actuacion;
  });
};
