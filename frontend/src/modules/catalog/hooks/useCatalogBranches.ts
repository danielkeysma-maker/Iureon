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
 * Returns an empty array while loading and on failure, so the caller keeps its
 * own fallback rather than showing an empty selector.
 */
export const useCatalogBranches = (): LegalBranch[] => {
  const [branches, setBranches] = useState<LegalBranch[]>([]);

  useEffect(() => {
    let cancelled = false;

    catalogApi
      .list()
      .then((result) => {
        if (!cancelled) setBranches(result.branches);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return branches;
};
