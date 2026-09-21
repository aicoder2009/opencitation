/**
 * Sync Queue Manager
 * Handles synchronization of offline operations when back online
 */

import { offlineStore, SyncQueueItem } from './offline-store';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}

export interface SyncManagerState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

type SyncListener = (state: SyncManagerState) => void;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private state: SyncManagerState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  };
  private syncInProgress = false;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Update initial state
    this.state.isOnline = navigator.onLine;
    await this.updatePendingCount();

    // Try to sync if we're online and have pending items
    if (this.state.isOnline && this.state.pendingCount > 0) {
      this.sync();
    }

    this.initialized = true;
  }

  private handleOnline = async () => {
    this.updateState({ isOnline: true });
    // Automatically sync when coming back online
    await this.sync();
  };

  private handleOffline = () => {
    this.updateState({ isOnline: false });
  };

  private updateState(partial: Partial<SyncManagerState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  getState(): SyncManagerState {
    return { ...this.state };
  }

  async updatePendingCount(): Promise<number> {
    try {
      const count = await offlineStore.getSyncQueueCount();
      this.updateState({ pendingCount: count });
      return count;
    } catch {
      return 0;
    }
  }

  // Queue operations for sync
  async queueCreate(entity: SyncQueueItem['entity'], entityId: string, data: Record<string, unknown>, parentId?: string): Promise<void> {
    await offlineStore.addToSyncQueue({
      type: 'create',
      entity,
      entityId,
      data,
      parentId,
    });
    await this.updatePendingCount();
  }

  async queueUpdate(entity: SyncQueueItem['entity'], entityId: string, data: Record<string, unknown>, parentId?: string): Promise<void> {
    await offlineStore.addToSyncQueue({
      type: 'update',
      entity,
      entityId,
      data,
      parentId,
    });
    await this.updatePendingCount();
  }

  async queueDelete(entity: SyncQueueItem['entity'], entityId: string, parentId?: string): Promise<void> {
    await offlineStore.addToSyncQueue({
      type: 'delete',
      entity,
      entityId,
      parentId,
    });
    await this.updatePendingCount();
  }

  // Process sync queue
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress || !this.state.isOnline) {
      return { success: false, synced: 0, failed: 0, errors: [] };
    }

    this.syncInProgress = true;
    this.updateState({ isSyncing: true, lastError: null });

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const queue = await offlineStore.getSyncQueue();

      // Optimize PWA synchronization using a staged parallel approach.
      // We group operations by entity type to preserve parent-child referential integrity (projects -> lists -> citations).
      // Within each stage, we group by unique entity IDs to avoid concurrent updates to the same entity.
      // Expected impact: Drastically reduces the time spent syncing offline queues when coming back online.

      const stages = [
        queue.filter(i => i.entity === 'project'),
        queue.filter(i => i.entity === 'list'),
        queue.filter(i => i.entity === 'citation'),
        queue.filter(i => !['project', 'list', 'citation'].includes(i.entity))
      ];

      for (const stage of stages) {
        if (stage.length === 0) continue;

        // Group by entityId to ensure we process mutations for the exact same entity sequentially
        const byEntityId = new Map<string, typeof stage>();
        for (const item of stage) {
          const arr = byEntityId.get(item.entityId) || [];
          arr.push(item);
          byEntityId.set(item.entityId, arr);
        }

        // Each unique entity ID can be processed concurrently
        await Promise.all(
          Array.from(byEntityId.values()).map(async (itemsForEntity) => {
            // Process the items for this specific entity sequentially (create -> update -> delete)
            for (const item of itemsForEntity) {
              try {
                await this.processQueueItem(item);
                await offlineStore.removeSyncQueueItem(item.id);
                result.synced++;

                // Mark the entity as synced
                await this.markEntitySynced(item);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                if (item.retryCount < MAX_RETRIES) {
                  // Update retry count and try again later
                  await offlineStore.updateSyncQueueItem({
                    ...item,
                    retryCount: item.retryCount + 1,
                    lastError: errorMessage,
                  });
                } else {
                  // Max retries reached, mark as failed
                  result.failed++;
                  result.errors.push({ itemId: item.id, error: errorMessage });
                }
              }
            }
          })
        );
      }

      this.updateState({
        lastSyncAt: new Date().toISOString(),
        isSyncing: false,
      });
      await this.updatePendingCount();

      result.success = result.failed === 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.updateState({ lastError: errorMessage, isSyncing: false });
      result.success = false;
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    const { type, entity, entityId, data, parentId } = item;

    // Build API endpoint
    let endpoint = '';
    let method = '';
    let body: string | undefined;

    switch (entity) {
      case 'list':
        if (type === 'create') {
          endpoint = '/api/lists';
          method = 'POST';
          body = JSON.stringify(data);
        } else if (type === 'update') {
          endpoint = `/api/lists/${entityId}`;
          method = 'PUT';
          body = JSON.stringify(data);
        } else if (type === 'delete') {
          endpoint = `/api/lists/${entityId}`;
          method = 'DELETE';
        }
        break;

      case 'citation':
        if (type === 'create') {
          endpoint = `/api/lists/${parentId}/citations`;
          method = 'POST';
          body = JSON.stringify(data);
        } else if (type === 'update') {
          endpoint = `/api/lists/${parentId}/citations/${entityId}`;
          method = 'PUT';
          body = JSON.stringify(data);
        } else if (type === 'delete') {
          endpoint = `/api/lists/${parentId}/citations/${entityId}`;
          method = 'DELETE';
        }
        break;

      case 'project':
        if (type === 'create') {
          endpoint = '/api/projects';
          method = 'POST';
          body = JSON.stringify(data);
        } else if (type === 'update') {
          endpoint = `/api/projects/${entityId}`;
          method = 'PUT';
          body = JSON.stringify(data);
        } else if (type === 'delete') {
          endpoint = `/api/projects/${entityId}`;
          method = 'DELETE';
        }
        break;
    }

    if (!endpoint || !method) {
      throw new Error(`Invalid sync operation: ${type} ${entity}`);
    }

    // Make the API request with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Failed after retries');
  }

  private async markEntitySynced(item: SyncQueueItem): Promise<void> {
    const { entity, entityId } = item;

    switch (entity) {
      case 'list':
        await offlineStore.markListSynced(entityId);
        break;
      case 'citation':
        await offlineStore.markCitationSynced(entityId);
        break;
      case 'project':
        await offlineStore.markProjectSynced(entityId);
        break;
    }
  }

  // Force retry all failed items
  async retryFailed(): Promise<void> {
    const queue = await offlineStore.getSyncQueue();
    for (const item of queue) {
      if (item.retryCount >= MAX_RETRIES) {
        await offlineStore.updateSyncQueueItem({
          ...item,
          retryCount: 0,
          lastError: undefined,
        });
      }
    }
    await this.sync();
  }

  // Clear all pending sync items
  async clearQueue(): Promise<void> {
    await offlineStore.clearSyncQueue();
    await this.updatePendingCount();
  }

  destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// React hook for sync state
export function useSyncManager() {
  if (typeof window === 'undefined') {
    return {
      state: {
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        lastSyncAt: null,
        lastError: null,
      },
      sync: () => Promise.resolve({ success: true, synced: 0, failed: 0, errors: [] }),
      retryFailed: () => Promise.resolve(),
      clearQueue: () => Promise.resolve(),
    };
  }

  return {
    state: syncManager.getState(),
    sync: () => syncManager.sync(),
    retryFailed: () => syncManager.retryFailed(),
    clearQueue: () => syncManager.clearQueue(),
  };
}
