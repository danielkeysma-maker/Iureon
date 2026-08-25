import { useEffect, useState } from 'react';
import { catalogApi } from '../services/catalog.api';
import type { Actuacion } from '../types';

/**
 * Resolves the selected document type to a catalogued actuación.
 *
 * Returns null while loading and when nothing matches, so the caller renders
 * nothing rather than a placeholder claiming an absence of requirements.
 *
 * The branch is not optional in practice: several filing names exist in more
 * than one branch with different deadlines, and the backend refuses to resolve
 * them without it rather than pick one.
 */
export const useActuacion = (documentType: string, branch?: string): Actuacion | null => {
  const [actuacion, setActuacion] = useState<Actuacion | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Clear immediately: showing the previous filing's deadline against a newly
    // chosen document type would be actively misleading.
    setActuacion(null);

    catalogApi.resolve(documentType, branch).then((found) => {
      if (!cancelled) setActuacion(found);
    });

    return () => {
      cancelled = true;
    };
  }, [documentType, branch]);

  return actuacion;
};
