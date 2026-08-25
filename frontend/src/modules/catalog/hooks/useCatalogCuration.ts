import { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../services/catalog.api';
import type { Actuacion, CatalogMeta, CurationStatus, LegalBranch, VerificationInput } from '../types';

/**
 * State for the curation screen.
 *
 * The list is reloaded from the API after every write rather than patched
 * locally: the server decides what the merged actuación looks like, and a
 * client-side guess could show a term the backend rejected or normalised.
 */
export const useCatalogCuration = () => {

  const [actuaciones, setActuaciones] = useState<Actuacion[]>([]);
  const [branches, setBranches] = useState<LegalBranch[]>([]);
  const [meta, setMeta] = useState<CatalogMeta[]>([]);
  const [curation, setCuration] = useState<CurationStatus>('OK');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [branchFilter, setBranchFilter] = useState<LegalBranch | 'TODAS'>('TODAS');
  const [query, setQuery] = useState('');
  const [onlyUnverified, setOnlyUnverified] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await catalogApi.list();
      setActuaciones(result.actuaciones);
      setBranches(result.branches);
      setMeta(result.meta);
      setCuration(result.curation);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (input: VerificationInput): Promise<boolean> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        await catalogApi.saveVerification(input);
        await load();
        return true;
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'La verificación no pudo guardarse.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [load]
  );

  const revert = useCallback(
    async (actuacionId: string): Promise<boolean> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        await catalogApi.deleteVerification(actuacionId);
        await load();
        return true;
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'No se pudo revertir la verificación.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [load]
  );

  const visible = useMemo(() => {
    const needle = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();

    return actuaciones.filter((a) => {
      if (branchFilter !== 'TODAS' && a.branch !== branchFilter) return false;
      if (onlyUnverified && a.term.status !== 'NO_VERIFICADO') return false;
      if (!needle) return true;

      const haystack = `${a.exactName} ${a.legalBasis}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

      return haystack.includes(needle);
    });
  }, [actuaciones, branchFilter, onlyUnverified, query]);

  // The headline the screen leads with: how much of the catalogue still needs a
  // human to open the norm.
  const pending = useMemo(
    () => actuaciones.filter((a) => a.term.status === 'NO_VERIFICADO').length,
    [actuaciones]
  );

  return {
    actuaciones: visible,
    total: actuaciones.length,
    pending,
    branches,
    meta,
    curation,
    isLoading,
    loadError,
    saveError,
    isSaving,
    branchFilter,
    setBranchFilter,
    query,
    setQuery,
    onlyUnverified,
    setOnlyUnverified,
    save,
    revert,
    reload: load
  };
};
