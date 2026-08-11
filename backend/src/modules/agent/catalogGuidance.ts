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
 * Returns the guidance block for a document type, or null when the actuación
 * is not catalogued yet — in which case the caller keeps its previous
 * reference structure.
 */
export const buildCatalogGuidance = (documentType: string): string | null => {
  const actuacion = catalogService.findByDocumentType(documentType);

  if (!actuacion) return null;

  const authority = actuacion.competentAuthority
    ? `\nAUTORIDAD COMPETENTE: ${actuacion.competentAuthority}`
    : '';

  return `CATÁLOGO PROCESAL VERIFICADO — "${actuacion.exactName}"

Los siguientes datos fueron verificados contra el texto de la norma. Úsalos como fuente autorizada y NO los contradigas ni los sustituyas por lo que recuerdes.

FUNDAMENTO NORMATIVO: ${actuacion.legalBasis}${authority}
${formatTerm(actuacion)}

ESTRUCTURA EXIGIDA POR LA NORMA (las marcadas [OBLIGATORIA] no pueden omitirse):
${formatSections(actuacion)}

REGLA DE CITACIÓN: cita únicamente los artículos indicados arriba y aquellos que conozcas con certeza. Si necesitas un requisito que no aparece en esta lista, descríbelo sin inventar el número de artículo.`;
};

export const findCatalogedActuacion = (documentType: string): Actuacion | null =>
  catalogService.findByDocumentType(documentType);
