'use client';

import { useEffect, ReactNode } from 'react';
import { pwaManager } from '@/lib/pwa/pwa-utils';
import { syncManager } from '@/lib/pwa/sync-manager';
import { OfflineIndicator } from './offline-indicator';
import { SafariInstallBanner } from './safari-install-banner';

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Initialize PWA and sync managers
    pwaManager.init();
    syncManager.init();

    // Handle Electron navigation events
    if (typeof window !== 'undefined' && (window as Window & { electronAPI?: { onNavigate?: (cb: (path: string) => void) => () => void } }).electronAPI?.onNavigate) {
      const cleanup = (window as Window & { electronAPI: { onNavigate: (cb: (path: string) => void) => () => void } }).electronAPI.onNavigate((path: string) => {
        window.location.href = path;
      });
      return cleanup;
    }
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator position="bottom" showSyncStatus />
      <SafariInstallBanner />
    </>
  );
}

export default PWAProvider;
