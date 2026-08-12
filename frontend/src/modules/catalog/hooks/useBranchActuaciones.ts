import { useEffect, useState } from 'react';
import { useTenant } from '../../tenant/TenantContext';
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
 * Returns an empty array while loading, for an uncatalogued branch, and on
 * failure — the caller then keeps its own fallback list rather than showing an
 * empty selector.
 */
export const useBranchActuaciones = (branch: string, role: ActuacionRole): string[] => {
  const { firmId } = useTenant();
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Cleared up front: offering another branch's filings would be worse than
    // offering none.
    setNames([]);

    catalogApi
      .list(firmId, { branch: branch as LegalBranch, role })
      .then((result) => {
        if (!cancelled) setNames(result.actuaciones.map((a) => a.exactName));
      })
      .catch(() => {
        if (!cancelled) setNames([]);
      });

    return () => {
      cancelled = true;
    };
  }, [firmId, branch, role]);

  return names;
};
