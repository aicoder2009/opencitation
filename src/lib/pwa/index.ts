/**
 * PWA Module Exports
 */

export { offlineStore } from './offline-store';
export type {
  OfflineList,
  OfflineCitation,
  OfflineProject,
  SyncQueueItem,
  CacheMeta,
} from './offline-store';

export { syncManager, useSyncManager } from './sync-manager';
export type { SyncStatus, SyncResult, SyncManagerState } from './sync-manager';

export {
  pwaManager,
  formatBytes,
  isPWASupported,
  isStandalone,
  isElectron,
  getPlatform,
} from './pwa-utils';
export type { PWAState, BeforeInstallPromptEvent } from './pwa-utils';
