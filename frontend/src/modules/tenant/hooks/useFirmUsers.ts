import { useCallback, useState } from 'react';
import type { FirmUser } from '../types';

const STORAGE_KEY = 'iureon_firm_users';

const readStoredUsers = (): FirmUser[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as FirmUser[]) : [];
  } catch {
    return [];
  }
};

const persist = (users: FirmUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('[TENANT] Could not persist the user list:', err);
  }
};

/**
 * Lawyer accounts, persisted in localStorage.
 *
 * The list starts empty by design: the platform holds no seeded firms or
 * users, so every account here was created explicitly by an administrator.
 */
export const useFirmUsers = () => {
  const [users, setUsers] = useState<FirmUser[]>(readStoredUsers);

  const commit = useCallback((next: FirmUser[]) => {
    setUsers(next);
    persist(next);
  }, []);

  const addUser = useCallback((user: FirmUser) => {
    commit([user, ...readStoredUsers()]);
  }, [commit]);

  const updateUser = useCallback((id: string, changes: Partial<FirmUser>) => {
    commit(readStoredUsers().map((user) => (user.id === id ? { ...user, ...changes } : user)));
  }, [commit]);

  const removeUser = useCallback((id: string) => {
    commit(readStoredUsers().filter((user) => user.id !== id));
  }, [commit]);

  return { users, addUser, updateUser, removeUser };
};
