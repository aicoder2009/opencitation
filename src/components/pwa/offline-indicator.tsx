'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncManager, SyncManagerState } from '@/lib/pwa/sync-manager';
import { pwaManager, PWAState } from '@/lib/pwa/pwa-utils';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showSyncStatus?: boolean;
}

export function OfflineIndicator({
  position = 'bottom',
  showSyncStatus = true,
}: OfflineIndicatorProps) {
  const [syncState, setSyncState] = useState<SyncManagerState>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    lastError: null,
  });

  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOffline: false,
    isUpdateAvailable: false,
    swRegistration: null,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    // Initialize managers
    syncManager.init();
    pwaManager.init();

    // Subscribe to state changes
    const unsubscribeSync = syncManager.subscribe(setSyncState);
    const unsubscribePwa = pwaManager.subscribe((state) => {
      setPwaState(state);
      if (state.isUpdateAvailable) {
        setShowUpdateBanner(true);
      }
    });

    return () => {
      unsubscribeSync();
      unsubscribePwa();
    };
  }, []);

  const handleSync = useCallback(async () => {
    await syncManager.sync();
  }, []);

  const handleUpdate = useCallback(async () => {
    await pwaManager.applyUpdate();
  }, []);

  const handleInstall = useCallback(async () => {
    await pwaManager.promptInstall();
  }, []);

  // Don't show anything if online with no pending items
  if (syncState.isOnline && syncState.pendingCount === 0 && !showUpdateBanner && !pwaState.isInstallable) {
    return null;
  }

  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <>
      {/* Offline/Sync Status Bar */}
      {(!syncState.isOnline || syncState.pendingCount > 0) && (
        <div
          className={`fixed ${positionClasses} left-0 right-0 z-50 transition-all duration-300`}
        >
          <div
            className={`
              ${!syncState.isOnline ? 'bg-amber-500' : 'bg-blue-500'}
              text-white px-4 py-2 shadow-lg
            `}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Icon */}
                {!syncState.isOnline ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                    />
                  </svg>
                ) : syncState.isSyncing ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}

                {/* Status Text */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {!syncState.isOnline
                      ? "You're offline"
                      : syncState.isSyncing
                        ? 'Syncing...'
                        : `${syncState.pendingCount} item${syncState.pendingCount !== 1 ? 's' : ''} pending`}
                  </span>
                  {showSyncStatus && syncState.pendingCount > 0 && !syncState.isSyncing && (
                    <span className="text-xs opacity-80">
                      {!syncState.isOnline
                        ? 'Will sync when back online'
                        : 'Click to sync now'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {syncState.isOnline && syncState.pendingCount > 0 && !syncState.isSyncing && (
                  <button
                    onClick={handleSync}
                    className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded transition-colors"
                  >
                    Sync now
                  </button>
                )}

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="max-w-4xl mx-auto mt-3 pt-3 border-t border-white/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs opacity-70">Status</div>
                    <div className="font-medium">
                      {syncState.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70">Pending</div>
                    <div className="font-medium">{syncState.pendingCount} items</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70">Last Sync</div>
                    <div className="font-medium">
                      {syncState.lastSyncAt
                        ? new Date(syncState.lastSyncAt).toLocaleTimeString()
                        : 'Never'}
                    </div>
                  </div>
                  {syncState.lastError && (
                    <div>
                      <div className="text-xs opacity-70">Last Error</div>
                      <div className="font-medium text-red-200 truncate">
                        {syncState.lastError}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {showUpdateBanner && pwaState.isUpdateAvailable && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="text-sm font-medium">
                A new version of OpenCitation is available!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                className="px-3 py-1 text-sm bg-white text-green-600 font-medium rounded hover:bg-green-50 transition-colors"
              >
                Update now
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Prompt (for non-installed PWA) */}
      {pwaState.isInstallable && !pwaState.isInstalled && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleInstall}
            className="flex items-center gap-2 px-4 py-3 bg-[#3366cc] text-white rounded-lg shadow-lg hover:bg-[#2a4b8d] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="font-medium">Install App</span>
          </button>
        </div>
      )}
    </>
  );
}

export default OfflineIndicator;
