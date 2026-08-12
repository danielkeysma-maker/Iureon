import { catalogService } from '../catalog/catalog.service';
import type { Actuacion } from '../catalog/types';

/**
 * Turns a catalogued actuación into the block Claude drafts against.
 *
 * The point of the catalogue is that the model no longer supplies procedural
 * facts from memory. When an actuación is known, the article, the competent
 * authority and the mandatory sections are handed to it verbatim, and it is
 * told not to invent any others.
 */

const formatSections = (actuacion: Actuacion): string =>
  actuacion.requiredSections
    .map((section) => {
      const flag = section.mandatory ? ' [OBLIGATORIA]' : '';
      const basis = section.basis ? ` (${section.basis})` : '';
      return `${section.n}. ${section.name}${flag}${basis}`;
    })
    .join('\n');

const formatTerm = (actuacion: Actuacion): string => {
  switch (actuacion.term.status) {
    case 'NO_CADUCA':
      return `TÉRMINO: ${actuacion.term.description}`;
    case 'VERIFICADO':
      return `TÉRMINO DE CADUCIDAD: ${actuacion.term.description}`;
    default:
      // Never let the model fill this in. An invented deadline is worse than
      // an acknowledged gap, because the lawyer would act on it.
      return 'TÉRMINO: no verificado en el catálogo. NO afirmes ningún término ni caducidad para esta actuación; si es relevante, indica que debe verificarse en la norma aplicable.';
  }
};

/**
 * Renders the guidance block for an already-resolved actuación, or null when
 * none was catalogued — in which case the caller keeps its previous reference
 * structure.
 *
 * Pure on purpose: resolution (which may consult the firm's own verifications
 * over the network) happens in the caller, so this stays synchronously testable.
 */
export const renderCatalogGuidance = (actuacion: Actuacion | null): string | null => {
  if (!actuacion) return null;

  const curated = actuacion.verification
    ? `\nORIGEN DEL DATO: verificado por la firma (${actuacion.verification.verifiedBy}). Prevalece sobre el catálogo base.`
    : '';

  const authority = actuacion.competentAuthority
    ? `\nAUTORIDAD COMPETENTE: ${actuacion.competentAuthority}`
    : '';

  return `CATÁLOGO PROCESAL VERIFICADO — "${actuacion.exactName}"

Los siguientes datos fueron verificados contra el texto de la norma. Úsalos como fuente autorizada y NO los contradigas ni los sustituyas por lo que recuerdes.

FUNDAMENTO NORMATIVO: ${actuacion.legalBasis}${authority}${curated}
${formatTerm(actuacion)}

ESTRUCTURA EXIGIDA POR LA NORMA (las marcadas [OBLIGATORIA] no pueden omitirse):
${formatSections(actuacion)}

REGLA DE CITACIÓN: cita únicamente los artículos indicados arriba y aquellos que conozcas con certeza. Si necesitas un requisito que no aparece en esta lista, descríbelo sin inventar el número de artículo.`;
};

/** Shipped-catalogue guidance, with no firm curation applied. */
export const buildCatalogGuidance = (documentType: string): string | null =>
  renderCatalogGuidance(catalogService.findByDocumentType(documentType));

/**
 * Guidance for one firm: the shipped catalogue with that firm's own verified
 * corrections overlaid. This is what closes the loop — a term confirmed once in
 * the curation screen reaches every later draft without a code change.
 */
export const buildCatalogGuidanceForFirm = async (
  firmId: string,
  documentType: string
): Promise<string | null> => {
  const { actuacion } = await catalogService.resolveForFirm(firmId, documentType);
  return renderCatalogGuidance(actuacion);
};

export const findCatalogedActuacion = (documentType: string): Actuacion | null =>
  catalogService.findByDocumentType(documentType);
