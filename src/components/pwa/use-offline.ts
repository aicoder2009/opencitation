'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncManagerState } from '@/lib/pwa/sync-manager';
import { pwaManager, PWAState } from '@/lib/pwa/pwa-utils';
import { offlineStore, OfflineList, OfflineCitation, OfflineProject } from '@/lib/pwa/offline-store';

/**
 * Hook for sync manager state
 */
export function useSyncState() {
  const [state, setState] = useState<SyncManagerState>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  });

  useEffect(() => {
    syncManager.init();
    const unsubscribe = syncManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const sync = useCallback(() => syncManager.sync(), []);
  const retryFailed = useCallback(() => syncManager.retryFailed(), []);
  const clearQueue = useCallback(() => syncManager.clearQueue(), []);

  return {
    ...state,
    sync,
    retryFailed,
    clearQueue,
  };
}

/**
 * Hook for PWA state
 */
export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOffline: false,
    isUpdateAvailable: false,
    swRegistration: null,
  });

  useEffect(() => {
    pwaManager.init();
    const unsubscribe = pwaManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const install = useCallback(() => pwaManager.promptInstall(), []);
  const update = useCallback(() => pwaManager.applyUpdate(), []);
  const clearCache = useCallback(() => pwaManager.clearCache(), []);
  const getCacheSize = useCallback(() => pwaManager.getCacheSize(), []);

  return {
    ...state,
    install,
    update,
    clearCache,
    getCacheSize,
  };
}

/**
 * Hook for online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for offline-capable lists
 */
export function useOfflineLists(userId?: string) {
  const [lists, setLists] = useState<OfflineList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Fetch from API
        const response = await fetch('/api/lists');
        if (response.ok) {
          const data = await response.json();
          // Save to offline store
          await offlineStore.bulkSaveLists(data.lists);
          setLists(data.lists);
        } else {
          throw new Error('Failed to fetch lists');
        }
      } else {
        // Fetch from offline store
        const offlineLists = userId
          ? await offlineStore.getListsByUser(userId)
          : await offlineStore.getAllLists();
        setLists(offlineLists);
      }
    } catch (err) {
      // Fallback to offline store on error
      const offlineLists = userId
        ? await offlineStore.getListsByUser(userId)
        : await offlineStore.getAllLists();
      setLists(offlineLists);

      if (isOnline) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lists');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, userId]);

  const createList = useCallback(
    async (name: string, projectId?: string) => {
      const now = new Date().toISOString();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newList: OfflineList = {
        id: tempId,
        name,
        projectId,
        userId: userId || 'local',
        createdAt: now,
        updatedAt: now,
        _offline: !isOnline,
        _synced: false,
      };

      // Save locally first
      await offlineStore.saveList(newList);
      setLists((prev) => [...prev, newList]);

      if (isOnline) {
        try {
          const response = await fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, projectId }),
          });

          if (response.ok) {
            const data = await response.json();
            // Update with real ID
            await offlineStore.deleteList(tempId);
            await offlineStore.saveList({ ...data.list, _synced: true });
            setLists((prev) =>
              prev.map((l) => (l.id === tempId ? { ...data.list, _synced: true } : l))
            );
            return data.list;
          }
        } catch {
          // Queue for sync
          await syncManager.queueCreate('list', tempId, { name, projectId });
        }
      } else {
        // Queue for sync when back online
        await syncManager.queueCreate('list', tempId, { name, projectId });
      }

      return newList;
    },
    [isOnline, userId]
  );

  const deleteList = useCallback(
    async (id: string) => {
      // Remove locally first
      await offlineStore.deleteList(id);
      setLists((prev) => prev.filter((l) => l.id !== id));

      if (isOnline && !id.startsWith('temp_')) {
        try {
          await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        } catch {
          await syncManager.queueDelete('list', id);
        }
      } else if (!id.startsWith('temp_')) {
        await syncManager.queueDelete('list', id);
      }
    },
    [isOnline]
  );

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return {
    lists,
    loading,
    error,
    refresh: fetchLists,
    createList,
    deleteList,
    isOnline,
  };
}

/**
 * Hook for offline-capable citations
 */
export function useOfflineCitations(listId: string) {
  const [citations, setCitations] = useState<OfflineCitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const fetchCitations = useCallback(async () => {
    if (!listId) return;

    setLoading(true);
    setError(null);

    try {
      if (isOnline && !listId.startsWith('temp_')) {
        const response = await fetch(`/api/lists/${listId}/citations`);
        if (response.ok) {
          const data = await response.json();
          await offlineStore.bulkSaveCitations(data.citations);
          setCitations(data.citations);
        } else {
          throw new Error('Failed to fetch citations');
        }
      } else {
        const offlineCitations = await offlineStore.getCitationsByList(listId);
        setCitations(offlineCitations);
      }
    } catch (err) {
      const offlineCitations = await offlineStore.getCitationsByList(listId);
      setCitations(offlineCitations);

      if (isOnline) {
        setError(err instanceof Error ? err.message : 'Failed to fetch citations');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, listId]);

  const addCitation = useCallback(
    async (citationData: Omit<OfflineCitation, 'id' | 'listId' | 'createdAt' | 'updatedAt' | '_offline' | '_synced'>) => {
      const now = new Date().toISOString();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newCitation: OfflineCitation = {
        ...citationData,
        id: tempId,
        listId,
        createdAt: now,
        updatedAt: now,
        _offline: !isOnline,
        _synced: false,
      };

      await offlineStore.saveCitation(newCitation);
      setCitations((prev) => [...prev, newCitation]);

      if (isOnline && !listId.startsWith('temp_')) {
        try {
          const response = await fetch(`/api/lists/${listId}/citations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(citationData),
          });

          if (response.ok) {
            const data = await response.json();
            await offlineStore.deleteCitation(tempId);
            await offlineStore.saveCitation({ ...data.citation, _synced: true });
            setCitations((prev) =>
              prev.map((c) => (c.id === tempId ? { ...data.citation, _synced: true } : c))
            );
            return data.citation;
          }
        } catch {
          await syncManager.queueCreate('citation', tempId, citationData, listId);
        }
      } else {
        await syncManager.queueCreate('citation', tempId, citationData, listId);
      }

      return newCitation;
    },
    [isOnline, listId]
  );

  const deleteCitation = useCallback(
    async (id: string) => {
      await offlineStore.deleteCitation(id);
      setCitations((prev) => prev.filter((c) => c.id !== id));

      if (isOnline && !id.startsWith('temp_') && !listId.startsWith('temp_')) {
        try {
          await fetch(`/api/lists/${listId}/citations/${id}`, { method: 'DELETE' });
        } catch {
          await syncManager.queueDelete('citation', id, listId);
        }
      } else if (!id.startsWith('temp_')) {
        await syncManager.queueDelete('citation', id, listId);
      }
    },
    [isOnline, listId]
  );

  useEffect(() => {
    fetchCitations();
  }, [fetchCitations]);

  return {
    citations,
    loading,
    error,
    refresh: fetchCitations,
    addCitation,
    deleteCitation,
    isOnline,
  };
}

/**
 * Hook for offline-capable projects
 */
export function useOfflineProjects(userId?: string) {
  const [projects, setProjects] = useState<OfflineProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          await offlineStore.bulkSaveProjects(data.projects);
          setProjects(data.projects);
        } else {
          throw new Error('Failed to fetch projects');
        }
      } else {
        const offlineProjects = userId
          ? await offlineStore.getProjectsByUser(userId)
          : await offlineStore.getAllProjects();
        setProjects(offlineProjects);
      }
    } catch (err) {
      const offlineProjects = userId
        ? await offlineStore.getProjectsByUser(userId)
        : await offlineStore.getAllProjects();
      setProjects(offlineProjects);

      if (isOnline) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, userId]);

  const createProject = useCallback(
    async (name: string, description?: string) => {
      const now = new Date().toISOString();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newProject: OfflineProject = {
        id: tempId,
        name,
        description,
        userId: userId || 'local',
        createdAt: now,
        updatedAt: now,
        _offline: !isOnline,
        _synced: false,
      };

      await offlineStore.saveProject(newProject);
      setProjects((prev) => [...prev, newProject]);

      if (isOnline) {
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description }),
          });

          if (response.ok) {
            const data = await response.json();
            await offlineStore.deleteProject(tempId);
            await offlineStore.saveProject({ ...data.project, _synced: true });
            setProjects((prev) =>
              prev.map((p) => (p.id === tempId ? { ...data.project, _synced: true } : p))
            );
            return data.project;
          }
        } catch {
          await syncManager.queueCreate('project', tempId, { name, description });
        }
      } else {
        await syncManager.queueCreate('project', tempId, { name, description });
      }

      return newProject;
    },
    [isOnline, userId]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await offlineStore.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));

      if (isOnline && !id.startsWith('temp_')) {
        try {
          await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        } catch {
          await syncManager.queueDelete('project', id);
        }
      } else if (!id.startsWith('temp_')) {
        await syncManager.queueDelete('project', id);
      }
    },
    [isOnline]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    createProject,
    deleteProject,
    isOnline,
  };
}
