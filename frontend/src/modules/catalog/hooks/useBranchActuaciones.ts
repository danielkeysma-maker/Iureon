import { useEffect, useState } from 'react';
import { catalogApi } from '../services/catalog.api';
import type { ActuacionRole, LegalBranch } from '../types';

/**
 * The catalogued filing names for one branch and role, to offer as the
 * document-type options.
 *
 * These names matter beyond labelling: they are the ones the drafting engine
 * can resolve to a verified article and deadline. A hand-written label that
 * merely sounds similar resolves to nothing, and the draft falls back to a
 * generic template with no norm behind it.
 *
 * WHY THIS REPORTS A STATE AND NOT JUST A LIST. It used to return `[]` while
 * loading, for an uncatalogued branch, and on failure alike — three different
 * facts flattened into one value. The caller read the empty list as "this
 * branch is not catalogued", fell back to its hand-written options, and reset
 * the selected document type to the first of them. So a filing chosen in
 * Orientación was silently replaced during the fraction of a second the
 * catalogue took to arrive, and the lawyer landed in the workspace with a
 * document type nobody picked.
 *
 * Reporting CARGANDO separately is what lets the caller wait instead of guess.
 * It is the same defect this codebase already removed from `useActuacion`,
 * where `null` meant both "loading" and "not in the catalogue".
 */
export type BranchActuaciones =
  | { estado: 'CARGANDO'; nombres: [] }
  /** The catalogue answered with entries for this branch and role. */
  | { estado: 'LISTA'; nombres: string[] }
  /** It answered, and there are none — or it could not be reached. */
  | { estado: 'VACIA'; nombres: [] };

export const useBranchActuacionesState = (
  branch: string,
  role: ActuacionRole
): BranchActuaciones => {
  const [estado, setEstado] = useState<BranchActuaciones>({ estado: 'CARGANDO', nombres: [] });

  useEffect(() => {
    let cancelled = false;

    // Back to CARGANDO up front: offering another branch's filings would be
    // worse than offering none, and claiming this branch is empty before
    // asking would be worse than either.
    setEstado({ estado: 'CARGANDO', nombres: [] });

    catalogApi
      .list({ branch: branch as LegalBranch, role })
      .then((result) => {
        if (cancelled) return;
        const nombres = result.actuaciones.map((a) => a.exactName);
        setEstado(nombres.length > 0 ? { estado: 'LISTA', nombres } : { estado: 'VACIA', nombres: [] });
      })
      .catch(() => {
        // Un fallo se reporta como vacía y no como carga eterna: el panel tiene
        // su lista de respaldo y el abogado tiene que poder seguir trabajando.
        if (!cancelled) setEstado({ estado: 'VACIA', nombres: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [branch, role]);

  return estado;
};

/** The names alone, for callers that do not need to tell loading from empty. */
export const useBranchActuaciones = (branch: string, role: ActuacionRole): string[] =>
  useBranchActuacionesState(branch, role).nombres;
