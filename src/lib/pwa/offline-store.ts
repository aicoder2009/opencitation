/**
 * IndexedDB Offline Store
 * Client-side persistence for offline PWA functionality
 */

const DB_NAME = 'opencitation-offline';
const DB_VERSION = 1;

// Store names
const STORES = {
  LISTS: 'lists',
  CITATIONS: 'citations',
  PROJECTS: 'projects',
  SYNC_QUEUE: 'sync_queue',
  CACHE_META: 'cache_meta',
} as const;

export interface OfflineList {
  id: string;
  name: string;
  projectId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _offline?: boolean;
  _synced?: boolean;
}

export interface OfflineCitation {
  id: string;
  listId: string;
  fields: Record<string, unknown>;
  style: string;
  formattedText: string;
  formattedHtml: string;
  createdAt: string;
  updatedAt: string;
  _offline?: boolean;
  _synced?: boolean;
}

export interface OfflineProject {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _offline?: boolean;
  _synced?: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'list' | 'citation' | 'project';
  entityId: string;
  parentId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface CacheMeta {
  key: string;
  lastUpdated: string;
  expiresAt?: string;
}

class OfflineStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Lists store
        if (!db.objectStoreNames.contains(STORES.LISTS)) {
          const listsStore = db.createObjectStore(STORES.LISTS, { keyPath: 'id' });
          listsStore.createIndex('userId', 'userId', { unique: false });
          listsStore.createIndex('projectId', 'projectId', { unique: false });
          listsStore.createIndex('_synced', '_synced', { unique: false });
        }

        // Citations store
        if (!db.objectStoreNames.contains(STORES.CITATIONS)) {
          const citationsStore = db.createObjectStore(STORES.CITATIONS, { keyPath: 'id' });
          citationsStore.createIndex('listId', 'listId', { unique: false });
          citationsStore.createIndex('_synced', '_synced', { unique: false });
        }

        // Projects store
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectsStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
          projectsStore.createIndex('userId', 'userId', { unique: false });
          projectsStore.createIndex('_synced', '_synced', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('entity', 'entity', { unique: false });
          syncStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Cache meta store
        if (!db.objectStoreNames.contains(STORES.CACHE_META)) {
          db.createObjectStore(STORES.CACHE_META, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic CRUD operations
  private async put<T>(storeName: string, item: T): Promise<T> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
    const store = await this.getStore(storeName, 'readonly');
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Lists operations
  async saveList(list: OfflineList): Promise<OfflineList> {
    return this.put(STORES.LISTS, { ...list, _synced: false });
  }

  async getList(id: string): Promise<OfflineList | undefined> {
    return this.get(STORES.LISTS, id);
  }

  async getAllLists(): Promise<OfflineList[]> {
    return this.getAll(STORES.LISTS);
  }

  async getListsByUser(userId: string): Promise<OfflineList[]> {
    return this.getAllByIndex(STORES.LISTS, 'userId', userId);
  }

  async getListsByProject(projectId: string): Promise<OfflineList[]> {
    return this.getAllByIndex(STORES.LISTS, 'projectId', projectId);
  }

  async deleteList(id: string): Promise<void> {
    return this.delete(STORES.LISTS, id);
  }

  async markListSynced(id: string): Promise<void> {
    const list = await this.getList(id);
    if (list) {
      await this.put(STORES.LISTS, { ...list, _synced: true, _offline: false });
    }
  }

  // Citations operations
  async saveCitation(citation: OfflineCitation): Promise<OfflineCitation> {
    return this.put(STORES.CITATIONS, { ...citation, _synced: false });
  }

  async getCitation(id: string): Promise<OfflineCitation | undefined> {
    return this.get(STORES.CITATIONS, id);
  }

  async getAllCitations(): Promise<OfflineCitation[]> {
    return this.getAll(STORES.CITATIONS);
  }

  async getCitationsByList(listId: string): Promise<OfflineCitation[]> {
    return this.getAllByIndex(STORES.CITATIONS, 'listId', listId);
  }

  async deleteCitation(id: string): Promise<void> {
    return this.delete(STORES.CITATIONS, id);
  }

  async markCitationSynced(id: string): Promise<void> {
    const citation = await this.getCitation(id);
    if (citation) {
      await this.put(STORES.CITATIONS, { ...citation, _synced: true, _offline: false });
    }
  }

  // Projects operations
  async saveProject(project: OfflineProject): Promise<OfflineProject> {
    return this.put(STORES.PROJECTS, { ...project, _synced: false });
  }

  async getProject(id: string): Promise<OfflineProject | undefined> {
    return this.get(STORES.PROJECTS, id);
  }

  async getAllProjects(): Promise<OfflineProject[]> {
    return this.getAll(STORES.PROJECTS);
  }

  async getProjectsByUser(userId: string): Promise<OfflineProject[]> {
    return this.getAllByIndex(STORES.PROJECTS, 'userId', userId);
  }

  async deleteProject(id: string): Promise<void> {
    return this.delete(STORES.PROJECTS, id);
  }

  async markProjectSynced(id: string): Promise<void> {
    const project = await this.getProject(id);
    if (project) {
      await this.put(STORES.PROJECTS, { ...project, _synced: true, _offline: false });
    }
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<SyncQueueItem> {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    return this.put(STORES.SYNC_QUEUE, syncItem);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const items = await this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getSyncQueueByEntity(entity: SyncQueueItem['entity']): Promise<SyncQueueItem[]> {
    return this.getAllByIndex(STORES.SYNC_QUEUE, 'entity', entity);
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<SyncQueueItem> {
    return this.put(STORES.SYNC_QUEUE, item);
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    return this.delete(STORES.SYNC_QUEUE, id);
  }

  async clearSyncQueue(): Promise<void> {
    return this.clear(STORES.SYNC_QUEUE);
  }

  async getSyncQueueCount(): Promise<number> {
    const items = await this.getSyncQueue();
    return items.length;
  }

  // Cache metadata operations
  async setCacheMeta(key: string, expiresIn?: number): Promise<CacheMeta> {
    const meta: CacheMeta = {
      key,
      lastUpdated: new Date().toISOString(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : undefined,
    };
    return this.put(STORES.CACHE_META, meta);
  }

  async getCacheMeta(key: string): Promise<CacheMeta | undefined> {
    return this.get(STORES.CACHE_META, key);
  }

  async isCacheValid(key: string): Promise<boolean> {
    const meta = await this.getCacheMeta(key);
    if (!meta) return false;
    if (!meta.expiresAt) return true;
    return new Date(meta.expiresAt) > new Date();
  }

  // Utility methods
  async getUnsyncedCount(): Promise<{ lists: number; citations: number; projects: number; total: number }> {
    const [lists, citations, projects] = await Promise.all([
      this.getAllByIndex<OfflineList>(STORES.LISTS, '_synced', false),
      this.getAllByIndex<OfflineCitation>(STORES.CITATIONS, '_synced', false),
      this.getAllByIndex<OfflineProject>(STORES.PROJECTS, '_synced', false),
    ]);
    return {
      lists: lists.length,
      citations: citations.length,
      projects: projects.length,
      total: lists.length + citations.length + projects.length,
    };
  }

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.clear(STORES.LISTS),
      this.clear(STORES.CITATIONS),
      this.clear(STORES.PROJECTS),
      this.clear(STORES.SYNC_QUEUE),
      this.clear(STORES.CACHE_META),
    ]);
  }

  // Bulk operations for syncing
  async bulkSaveLists(lists: OfflineList[]): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(STORES.LISTS, 'readwrite');
    const store = transaction.objectStore(STORES.LISTS);

    for (const list of lists) {
      store.put({ ...list, _synced: true });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async bulkSaveCitations(citations: OfflineCitation[]): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(STORES.CITATIONS, 'readwrite');
    const store = transaction.objectStore(STORES.CITATIONS);

    for (const citation of citations) {
      store.put({ ...citation, _synced: true });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async bulkSaveProjects(projects: OfflineProject[]): Promise<void> {
    const db = await this.init();
    const transaction = db.transaction(STORES.PROJECTS, 'readwrite');
    const store = transaction.objectStore(STORES.PROJECTS);

    for (const project of projects) {
      store.put({ ...project, _synced: true });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Singleton instance
export const offlineStore = new OfflineStore();
