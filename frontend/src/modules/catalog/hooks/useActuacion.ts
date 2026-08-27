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
/**
 * El estado de la resolución, no solo su resultado.
 *
 * `null` significaba dos cosas distintas — "todavía no sé" y "no existe" — y
 * quien las confunde pinta una advertencia mientras carga. Ese defecto exacto
 * ya ocurrió en la vista de entrevistas: el aviso de motor no configurado
 * aparecía y desaparecía en cada visita, y una advertencia que parpadea es peor
 * que ninguna, porque el abogado ve que algo va mal y no le queda nada que
 * hacer con eso.
 */
export type ActuacionLookup =
  | { estado: 'CARGANDO'; actuacion: null }
  | { estado: 'ENCONTRADA'; actuacion: Actuacion }
  | { estado: 'SIN_CATALOGAR'; actuacion: null };

export const useActuacionLookup = (documentType: string, branch?: string): ActuacionLookup => {
  const [lookup, setLookup] = useState<ActuacionLookup>({ estado: 'CARGANDO', actuacion: null });

  useEffect(() => {
    let cancelled = false;

    // Clear immediately: showing the previous filing's deadline against a newly
    // chosen document type would be actively misleading.
    setLookup({ estado: 'CARGANDO', actuacion: null });

    catalogApi.resolve(documentType, branch).then((found) => {
      if (cancelled) return;
      setLookup(
        found
          ? { estado: 'ENCONTRADA', actuacion: found }
          : { estado: 'SIN_CATALOGAR', actuacion: null }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [documentType, branch]);

  return lookup;
};

/**
 * Solo la actuación, para quien no necesita distinguir cargando de ausente.
 *
 * Se conserva porque la mayoría de los consumidores solo quiere pintar la ficha
 * cuando la hay. Quien vaya a ADVERTIR algo debe usar `useActuacionLookup`: una
 * advertencia disparada por un null que todavía es 'cargando' parpadea en cada
 * cambio de selector.
 */
export const useActuacion = (documentType: string, branch?: string): Actuacion | null =>
  useActuacionLookup(documentType, branch).actuacion;
