import { useCallback, useEffect, useState } from 'react';
import { draftsApi } from '../services/drafts.api';
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

  /** Returns the message to show the user, mirroring the previous alerts. */
  const saveDraft = useCallback(
    async (draft: GeneratedDraft): Promise<string> => {
      if (loadedDraftId) {
        if (await draftsApi.update(loadedDraftId, draft)) {
          await reload();
          return '✅ Borrador actualizado exitosamente.';
        }

        const updated = savedDrafts.map((d) =>
          d.id === loadedDraftId ? { ...d, savedAt: now(), draft } : d
        );
        setSavedDrafts(updated);
        writeLocal(storageKey, updated);
        return '✅ Borrador actualizado (almacenamiento local).';
      }

      if (await draftsApi.create(draft)) {
        await reload();
        return '✅ Borrador guardado en la nube. Podrás abrirlo y editarlo en cualquier momento.';
      }

      const entry: SavedDraftEntry = { id: `draft-${Date.now()}`, savedAt: now(), draft };
      const updated = [entry, ...savedDrafts];
      setSavedDrafts(updated);
      writeLocal(storageKey, updated);
      return '✅ Borrador guardado (almacenamiento local). Podrás abrirlo y editarlo en cualquier momento.';
    },
    [firmId, userEmail, loadedDraftId, savedDrafts, storageKey, reload]
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
    [firmId, savedDrafts, storageKey, reload]
  );

  return { savedDrafts, loadedDraftId, setLoadedDraftId, reload, saveDraft, deleteDraft };
};
