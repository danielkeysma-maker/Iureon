import { catalogService } from '../catalog/catalog.service';
import type { Actuacion, LegalBranch } from '../catalog/types';

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
export const buildCatalogGuidance = (
  documentType: string,
  branch?: LegalBranch
): string | null => renderCatalogGuidance(catalogService.findByDocumentType(documentType, branch));

/**
 * Guidance for one firm: the shipped catalogue with that firm's own verified
 * corrections overlaid. This is what closes the loop — a term confirmed once in
 * the curation screen reaches every later draft without a code change.
 */
export const buildCatalogGuidanceForFirm = async (
  firmId: string,
  documentType: string,
  branch?: LegalBranch
): Promise<string | null> => {
  const { actuacion } = await catalogService.resolveForFirm(firmId, documentType, branch);
  return renderCatalogGuidance(actuacion);
};

export const findCatalogedActuacion = (documentType: string): Actuacion | null =>
  catalogService.findByDocumentType(documentType);

/**
 * La procedencia del borrador: contra qué ficha del catálogo se redactó.
 *
 * ─── POR QUÉ VIAJA CON EL BORRADOR Y NO SE QUEDA EN EL PROMPT ───────────────
 *
 * El motor ya resolvía la actuación para instruir al modelo y la DESCARTABA al
 * responder. El abogado recibía un escrito que afirma un plazo sin poder saber
 * de dónde salió, ni si alguien lo verificó, ni si su firma lo corrigió. El
 * artboard 5a pide revisar «lo sin verificar» ANTES de exportar, y esto es lo
 * único que el producto sabe de verdad sobre ese punto: no cuántas frases del
 * texto están sin respaldo —eso no se mide—, sino si la ficha que gobierna el
 * escrito tiene su término comprobado y su fuente.
 *
 * Decir eso es exacto. Contar «2 afirmaciones sin verificar» sobre un texto que
 * nadie analizó sería una cifra inventada en la pantalla donde se decide firmar.
 */
export interface ProcedenciaDelBorrador {
  actuacionId: string;
  exactName: string;
  legalBasis: string;
  sourceUrl: string | null;
  competentAuthority: string | null;
  termStatus: Actuacion['term']['status'];
  termDescription: string | null;
  /** La firma corrigió o confirmó esta ficha en su pantalla de curaduría. */
  curadaPorLaFirma: boolean;
  curadaPor: string | null;
  /** Secciones que el escrito debe traer y cuyo artículo no está confirmado. */
  seccionesSinArticulo: number;
  seccionesTotales: number;
}

export const resolverProcedencia = async (
  firmId: string | null | undefined,
  documentType: string,
  branch?: LegalBranch
): Promise<ProcedenciaDelBorrador | null> => {
  const { actuacion } = await catalogService.resolveForFirm(firmId, documentType, branch);
  if (!actuacion) return null;

  return {
    actuacionId: actuacion.id,
    exactName: actuacion.exactName,
    legalBasis: actuacion.legalBasis,
    sourceUrl: actuacion.sourceUrl,
    competentAuthority: actuacion.competentAuthority,
    termStatus: actuacion.term.status,
    termDescription: actuacion.term.description,
    curadaPorLaFirma: Boolean(actuacion.verification),
    curadaPor: actuacion.verification?.verifiedBy ?? null,
    seccionesSinArticulo: actuacion.requiredSections.filter((s) => !s.basis).length,
    seccionesTotales: actuacion.requiredSections.length
  };
};
