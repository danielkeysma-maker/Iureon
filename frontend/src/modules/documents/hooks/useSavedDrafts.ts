import { useCallback, useEffect, useState } from 'react';
import { draftsApi, type DatosDeExpedienteAlCrear } from '../services/drafts.api';
import type { GeneratedDraft, SavedDraftEntry } from '../types';

const LEGACY_GLOBAL_KEY = 'iureon_saved_drafts';

const storageKeyFor = (firmId: string, userEmail: string): string =>
  `iureon_saved_drafts_${firmId || 'superuser'}_${userEmail}`;

const now = (): string =>
  new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const readLocal = (key: string): SavedDraftEntry[] => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as SavedDraftEntry[]) : [];
  } catch {
    return [];
  }
};

const writeLocal = (key: string, drafts: SavedDraftEntry[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(drafts));
  } catch {
    // Storage full or unavailable; the in-memory list stays authoritative.
  }
};

/**
 * Migrates drafts saved under the old un-scoped key into the per-firm,
 * per-user key. Runs once: the legacy key is removed on success.
 */
const migrateLegacyDrafts = (key: string, current: SavedDraftEntry[]): SavedDraftEntry[] => {
  const legacy = localStorage.getItem(LEGACY_GLOBAL_KEY);
  if (!legacy) return current;

  try {
    const legacyDrafts = JSON.parse(legacy) as SavedDraftEntry[];
    if (legacyDrafts.length === 0) return current;

    const existingIds = new Set(current.map((d) => d.id));
    const incoming = legacyDrafts.filter((d) => !existingIds.has(d.id));
    const merged = [...incoming, ...current];

    writeLocal(key, merged);
    localStorage.removeItem(LEGACY_GLOBAL_KEY);
    console.log(`[DRAFTS] Migrados ${incoming.length} borradores de clave global a ${key}`);

    return merged;
  } catch {
    return current;
  }
};

/**
 * Saved drafts for the active tenant and user.
 *
 * Supabase is the source of truth when reachable; otherwise everything falls
 * back to a firm-and-user scoped localStorage key. A backend outage must never
 * cost a lawyer their draft, so failures degrade silently instead of throwing.
 */
export const useSavedDrafts = (firmId: string, userEmail: string, enabled: boolean) => {
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftEntry[]>([]);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);

  const storageKey = storageKeyFor(firmId, userEmail);

  const reload = useCallback(async () => {
    if (!userEmail) {
      setSavedDrafts([]);
      return;
    }

    if (firmId) {
      const remote = await draftsApi.list();
      if (remote) {
        setSavedDrafts(remote);
        return;
      }
    }

    setSavedDrafts(migrateLegacyDrafts(storageKey, readLocal(storageKey)));
  }, [firmId, userEmail, storageKey]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  /**
   * EL BORRADOR SE GUARDA AL GENERARSE, sin botón. Antes solo existía en la
   * pestaña hasta que alguien pulsaba «Guardar»: recargar o cambiar de módulo
   * perdía un escrito que ya se había cobrado. Devuelve el id del borrador
   * creado —en la nube o, sin API, en este navegador— para que los guardados
   * siguientes lo ACTUALICEN y nunca dupliquen.
   */
  const guardarAlGenerar = useCallback(
    async (draft: GeneratedDraft, extras: DatosDeExpedienteAlCrear = {}): Promise<string | null> => {
      if (!userEmail) return null;
      const id = firmId ? await draftsApi.create(draft, extras) : null;
      if (id) {
        await reload();
        return id;
      }
      const entry: SavedDraftEntry = {
        id: `draft-${Date.now()}`,
        savedAt: now(),
        draft,
        legalBranch: extras.legalBranch ?? null,
        cliente: extras.cliente ?? null
      };
      const updated = [entry, ...savedDrafts];
      setSavedDrafts(updated);
      writeLocal(storageKey, updated);
      return entry.id;
    },
    [userEmail, firmId, savedDrafts, storageKey, reload]
  );

  /** Returns the message to show the user in the app's notice. */
  const saveDraft = useCallback(
    async (draft: GeneratedDraft): Promise<string> => {
      if (loadedDraftId) {
        if (await draftsApi.update(loadedDraftId, draft)) {
          await reload();
          return 'Borrador actualizado en la nube de su firma.';
        }

        const updated = savedDrafts.map((d) =>
          d.id === loadedDraftId ? { ...d, savedAt: now(), draft } : d
        );
        setSavedDrafts(updated);
        writeLocal(storageKey, updated);
        return 'Borrador actualizado en este navegador; la nube no respondió.';
      }

      if (await draftsApi.create(draft)) {
        await reload();
        return 'Borrador guardado en la nube de su firma. Puede abrirlo y editarlo cuando quiera desde «Borradores».';
      }

      const entry: SavedDraftEntry = { id: `draft-${Date.now()}`, savedAt: now(), draft };
      const updated = [entry, ...savedDrafts];
      setSavedDrafts(updated);
      writeLocal(storageKey, updated);
      return 'Borrador guardado en este navegador; la nube no respondió. Podrá abrirlo desde «Borradores» en este equipo.';
    },
    [userEmail, loadedDraftId, savedDrafts, storageKey, reload]
  );

  const deleteDraft = useCallback(
    async (id: string): Promise<void> => {
      if (await draftsApi.remove(id)) {
        await reload();
        return;
      }

      const updated = savedDrafts.filter((d) => d.id !== id);
      setSavedDrafts(updated);
      writeLocal(storageKey, updated);
    },
    [savedDrafts, storageKey, reload]
  );

  /**
   * Los datos del expediente: proceso, término, estado.
   *
   * VA APARTE DE `saveDraft` A PROPÓSITO. Guardar el escrito sube la versión —
   * v4 es la cuarta redacción— y corregir el nombre del cliente no es redactar
   * de nuevo. Si compartieran camino, el número de versión dejaría de servir
   * para lo único que sirve: que dos abogados sepan cuál es el escrito bueno.
   *
   * Sin backend, el cambio se queda en local. No se pierde, pero tampoco lo ve
   * el resto de la firma, y por eso el llamador recibe el aviso.
   */
  const updateMetadata = useCallback(
    async (
      id: string,
      campos: Partial<
        Pick<SavedDraftEntry, 'venceEl' | 'cliente' | 'despacho' | 'radicado' | 'legalBranch' | 'estado'>
      >
    ): Promise<boolean> => {
      if (await draftsApi.patch(id, campos)) {
        await reload();
        return true;
      }

      const updated = savedDrafts.map((d) => (d.id === id ? { ...d, ...campos } : d));
      setSavedDrafts(updated);
      writeLocal(storageKey, updated);
      return false;
    },
    [savedDrafts, storageKey, reload]
  );

  return {
    savedDrafts,
    loadedDraftId,
    setLoadedDraftId,
    reload,
    saveDraft,
    guardarAlGenerar,
    deleteDraft,
    updateMetadata
  };
};
