import type { CatalogVerificationInput, TermStatus } from './types';

/**
 * Validation for in-product curation of the catalogue.
 *
 * This is the safety core of the feature. The whole value of the catalogue is
 * that a term shown to a lawyer was checked against the norm, so the write path
 * must make an unchecked claim impossible to record:
 *
 *  - claiming a term (VERIFICADO / NO_CADUCA) requires both the wording and the
 *    source it was read from — an assertion without a source is not a
 *    verification;
 *  - NO_VERIFICADO must carry no wording at all, because describing a deadline
 *    you did not verify is exactly the failure this module exists to prevent;
 *  - verifiedBy is mandatory, since every claim has to be attributable.
 */

export interface ValidationFailure {
  code: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: CatalogVerificationInput }
  | { ok: false; error: ValidationFailure };

const TERM_STATUSES: TermStatus[] = ['VERIFICADO', 'NO_CADUCA', 'NO_VERIFICADO'];

const MAX_DESCRIPTION = 600;
const MAX_NOTE = 1000;
const MAX_NAME = 120;

const fail = (code: string, message: string): ValidationResult => ({
  ok: false,
  error: { code, message }
});

/** Trims and collapses whitespace; returns null for anything blank. */
const clean = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Only http(s) is accepted. The source is rendered as a clickable link in the
 * curation panel, so allowing arbitrary schemes would turn a legal citation
 * field into a script injection point.
 */
const cleanUrl = (value: unknown): string | null => {
  const raw = clean(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export const validateVerificationInput = (body: unknown, actuacionId: string): ValidationResult => {
  if (!body || typeof body !== 'object') {
    return fail('INVALID_BODY', 'Se requiere un cuerpo JSON con la verificación.');
  }

  const raw = body as Record<string, unknown>;

  const id = clean(actuacionId);
  if (!id) {
    return fail('MISSING_ACTUACION_ID', 'Se requiere el id de la actuación.');
  }

  const termStatus = clean(raw.termStatus) as TermStatus | null;
  if (!termStatus || !TERM_STATUSES.includes(termStatus)) {
    return fail(
      'INVALID_TERM_STATUS',
      `termStatus debe ser uno de: ${TERM_STATUSES.join(', ')}.`
    );
  }

  const verifiedBy = clean(raw.verifiedBy);
  if (!verifiedBy) {
    return fail(
      'MISSING_VERIFIED_BY',
      'Se requiere verifiedBy: toda afirmación sobre un término debe quedar atribuida a quien la verificó.'
    );
  }
  if (verifiedBy.length > MAX_NAME) {
    return fail('VERIFIED_BY_TOO_LONG', `verifiedBy no puede superar ${MAX_NAME} caracteres.`);
  }

  const termDescription = clean(raw.termDescription);
  const sourceUrl = cleanUrl(raw.sourceUrl);
  const legalBasis = clean(raw.legalBasis);
  const note = clean(raw.note);

  if (termStatus === 'NO_VERIFICADO') {
    // Retracting a verification. Any wording here would survive as a described
    // term that nobody checked, which is the dangerous state.
    if (termDescription) {
      return fail(
        'UNVERIFIED_WITH_DESCRIPTION',
        'Una actuación marcada NO_VERIFICADO no puede llevar descripción de término. Si conoces el término, verifícalo contra la norma y márcalo VERIFICADO.'
      );
    }
  } else {
    if (!termDescription) {
      return fail(
        'MISSING_TERM_DESCRIPTION',
        'Se requiere termDescription con el texto del término tal como lo fija la norma.'
      );
    }
    if (termDescription.length > MAX_DESCRIPTION) {
      return fail(
        'TERM_DESCRIPTION_TOO_LONG',
        `termDescription no puede superar ${MAX_DESCRIPTION} caracteres.`
      );
    }
    if (!sourceUrl) {
      return fail(
        'MISSING_SOURCE_URL',
        'Se requiere sourceUrl (http/https) apuntando al texto de la norma. Sin fuente no es una verificación.'
      );
    }
  }

  if (note && note.length > MAX_NOTE) {
    return fail('NOTE_TOO_LONG', `note no puede superar ${MAX_NOTE} caracteres.`);
  }

  return {
    ok: true,
    value: {
      actuacionId: id,
      termStatus,
      termDescription: termStatus === 'NO_VERIFICADO' ? null : termDescription,
      legalBasis,
      sourceUrl,
      note,
      verifiedBy
    }
  };
};
