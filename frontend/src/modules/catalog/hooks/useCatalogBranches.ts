import { useEffect, useState } from 'react';
import { catalogApi } from '../services/catalog.api';
import type { LegalBranch } from '../types';

/**
 * The branches the catalogue actually covers, straight from the API.
 *
 * Deliberately not a constant in the component: the hand-written selector had
 * drifted to ten branches while the catalogue held thirteen, leaving tránsito,
 * notarial, contratación and superintendencias unreachable from the workspace.
 * Reading the list from the source makes that drift impossible.
 *
 * Works with no firm selected — the shipped catalogue is product knowledge.
 *
 * WHY IT REPORTS A STATE. It used to answer `[]` while loading AND on failure,
 * two facts flattened into one value, so the caller — which shows "Cargando…"
 * on an empty list — spun forever on a branch request that had already failed,
 * with a footer reading "0 ramas". The same defect this codebase already fixed
 * in `useBranchActuacionesState` and in `useActuacion`: a hook that cannot say
 * "I failed" forces every caller to guess, and they all guess "still loading".
 */
export type CatalogBranches =
  | { estado: 'CARGANDO'; ramas: [] }
  | { estado: 'LISTA'; ramas: LegalBranch[] }
  /** The catalogue could not be reached. Distinct from "it answered with none". */
  | { estado: 'ERROR'; ramas: [] };

export const useCatalogBranchesState = (): CatalogBranches => {
  const [estado, setEstado] = useState<CatalogBranches>({ estado: 'CARGANDO', ramas: [] });

  useEffect(() => {
    let cancelled = false;

    catalogApi
      .list()
      .then((result) => {
        if (!cancelled) setEstado({ estado: 'LISTA', ramas: result.branches });
      })
      .catch(() => {
        if (!cancelled) setEstado({ estado: 'ERROR', ramas: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return estado;
};

/** The plain list, for callers that only need the values. */
export const useCatalogBranches = (): LegalBranch[] => useCatalogBranchesState().ramas;
