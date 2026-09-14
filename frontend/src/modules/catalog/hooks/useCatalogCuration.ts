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
  /*
   * LO QUE ESTA RAMA ALCANZA POR REMISION, y por que va en un estado aparte.
   *
   * La lista grande se pide UNA vez y sin rama, y sin rama el servidor no
   * presta nada: una ficha prestada solo existe en el contexto de la rama que
   * la toma. Asi que cuando el socio filtra por una rama concreta se pide esa
   * rama, y de la respuesta se toma solo lo que trae sobre.
   *
   * No se sustituye la lista grande por la de la rama porque las dos cifras del
   * encabezado —cuantas actuaciones hay y cuantas faltan por verificar— son del
   * catalogo entero, y cambiarlas al filtrar diria que el catalogo encogio.
   */
  const [remitidas, setRemitidas] = useState<Actuacion[]>([]);
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

  useEffect(() => {
    if (branchFilter === 'TODAS') {
      setRemitidas([]);
      return;
    }

    let vigente = true;

    void catalogApi
      .list({ branch: branchFilter })
      .then((result) => {
        if (vigente) setRemitidas(result.actuaciones.filter((a) => a.porRemision));
      })
      /*
       * Un fallo aqui no tumba la pantalla ni se anuncia: lo prestado es lo
       * ultimo de la lista, y quedarse sin ello deja el catalogo de la rama
       * exactamente como estaba antes de que esto existiera. Anunciar un error
       * sobre el apendice de la lista haria dudar de las fichas propias, que si
       * se cargaron.
       */
      .catch(() => {
        if (vigente) setRemitidas([]);
      });

    return () => {
      vigente = false;
    };
  }, [branchFilter, actuaciones]);

  const save = useCallback(
    async (input: VerificationInput): Promise<boolean> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        await catalogApi.saveVerification(input);
        await load();
        /*
         * Y se relee lo prestado, que la lista grande no trae: sin esto, el
         * socio verificaria el plazo de la reposicion para familia y la fila
         * seguiria diciendo «sin verificar» hasta que cambiara de rama.
         */
        if (branchFilter !== 'TODAS') {
          const result = await catalogApi.list({ branch: branchFilter });
          setRemitidas(result.actuaciones.filter((a) => a.porRemision));
        }
        return true;
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'La verificación no pudo guardarse.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [branchFilter, load]
  );

  const revert = useCallback(
    async (actuacionId: string, rama?: LegalBranch | null): Promise<boolean> => {
      setIsSaving(true);
      setSaveError(null);

      try {
        await catalogApi.deleteVerification(actuacionId, rama);
        await load();
        if (branchFilter !== 'TODAS') {
          const result = await catalogApi.list({ branch: branchFilter });
          setRemitidas(result.actuaciones.filter((a) => a.porRemision));
        }
        return true;
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'No se pudo revertir la verificación.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [branchFilter, load]
  );

  /*
   * DOS LISTAS Y NO UNA: la que respeta rama y búsqueda (`enElFiltro`) y la
   * que además aplica «solo sin verificar» (`visible`). El chip de ese filtro
   * lleva su cuenta al lado, y esa cuenta tiene que salir de la primera: si
   * saliera de la segunda diría siempre el total de lo que ya se está viendo, y
   * si saliera del catálogo entero prometería cientos donde la rama elegida
   * tiene tres.
   */
  const { visible, enElFiltro } = useMemo(() => {
    const needle = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();

    const coincide = (a: Actuacion): boolean => {
      if (!needle) return true;

      const haystack = `${a.exactName} ${a.legalBasis}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

      return haystack.includes(needle);
    };

    const propias = actuaciones.filter(
      (a) => (branchFilter === 'TODAS' || a.branch === branchFilter) && coincide(a)
    );

    /*
     * LO PRESTADO VA AL FINAL, igual que en el selector y por lo mismo: lo
     * primero que se ofrece tiene que ser lo que esta verificado PARA ESTA
     * RAMA.
     */
    const filtradas = [...propias, ...remitidas.filter(coincide)];
    return {
      enElFiltro: filtradas,
      visible: onlyUnverified ? filtradas.filter((a) => a.term.status === 'NO_VERIFICADO') : filtradas
    };
  }, [actuaciones, branchFilter, onlyUnverified, query, remitidas]);

  const pendientesEnElFiltro = useMemo(
    () => enElFiltro.filter((a) => a.term.status === 'NO_VERIFICADO').length,
    [enElFiltro]
  );

  // The headline the screen leads with: how much of the catalogue still needs a
  // human to open the norm.
  const pending = useMemo(
    () => actuaciones.filter((a) => a.term.status === 'NO_VERIFICADO').length,
    [actuaciones]
  );

  return {
    actuaciones: visible,
    /** El catálogo entero, sin filtros: de aquí sale el censo del encabezado. */
    todas: actuaciones,
    total: actuaciones.length,
    pending,
    pendientesEnElFiltro,
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
