/**
 * PWA Utilities
 * Service worker registration, install prompt, and PWA state management
 */

export interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PWAListener = (state: PWAState) => void;

class PWAManager {
  private state: PWAState = {
    isInstalled: false,
    isInstallable: false,
    isOffline: false,
    isUpdateAvailable: false,
    swRegistration: null,
  };
  private listeners: Set<PWAListener> = new Set();
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') return;

    // Check if already installed (standalone mode)
    this.state.isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Check initial offline status
    this.state.isOffline = !navigator.onLine;

    // Listen for online/offline
    window.addEventListener('online', () => {
      this.updateState({ isOffline: false });
    });

    window.addEventListener('offline', () => {
      this.updateState({ isOffline: true });
    });

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.updateState({ isInstallable: true });
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.updateState({ isInstalled: true, isInstallable: false });
    });

    // Register service worker
    await this.registerServiceWorker();

    this.initialized = true;
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.updateState({ swRegistration: registration });

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateState({ isUpdateAvailable: true });
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      console.log('[PWA] Service worker registered');
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type } = event.data || {};

    switch (type) {
      case 'SYNC_TRIGGERED':
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('pwa-sync-triggered'));
        break;

      case 'CACHE_UPDATED':
        window.dispatchEvent(new CustomEvent('pwa-cache-updated'));
        break;
    }
  }

  private updateState(partial: Partial<PWAState>) {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  subscribe(listener: PWAListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  getState(): PWAState {
    return { ...this.state };
  }

  // Trigger install prompt
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        this.deferredPrompt = null;
        this.updateState({ isInstallable: false });
        return true;
      } else {
        console.log('[PWA] User dismissed install');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }

  // Apply service worker update
  async applyUpdate(): Promise<void> {
    const { swRegistration } = this.state;
    if (!swRegistration?.waiting) return;

    // Tell waiting SW to take over
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page when new SW takes over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // Skip waiting and activate new service worker
  skipWaiting(): void {
    const { swRegistration } = this.state;
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Clear all caches
  async clearCache(): Promise<void> {
    const { swRegistration } = this.state;
    if (!swRegistration?.active) return;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = () => resolve();
      swRegistration.active!.postMessage({ type: 'CLEAR_CACHE' }, [messageChannel.port2]);
    });
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    const { swRegistration } = this.state;
    if (!swRegistration?.active) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.size || 0);
      };
      swRegistration.active!.postMessage({ type: 'GET_CACHE_SIZE' }, [messageChannel.port2]);
    });
  }

  // Precache a specific page
  async precachePage(url: string): Promise<void> {
    const { swRegistration } = this.state;
    if (!swRegistration?.active) return;

    swRegistration.active.postMessage({
      type: 'PRECACHE_PAGE',
      payload: { url },
    });
  }

  // Check for updates manually
  async checkForUpdates(): Promise<void> {
    const { swRegistration } = this.state;
    if (swRegistration) {
      await swRegistration.update();
    }
  }

  // Register for background sync
  async registerBackgroundSync(tag: string): Promise<boolean> {
    const { swRegistration } = this.state;
    if (!swRegistration || !('sync' in swRegistration)) {
      return false;
    }

    try {
      await (swRegistration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const pwaManager = new PWAManager();

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if PWA features are supported
export function isPWASupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

// Check if running in standalone mode (installed as PWA)
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Check if running in Electron
export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;

  return !!(window as Window & { electronAPI?: unknown }).electronAPI ||
    navigator.userAgent.toLowerCase().includes('electron');
}

// Get platform info
export function getPlatform(): 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/win/.test(platform)) return 'windows';
  if (/mac/.test(platform)) return 'macos';
  if (/linux/.test(platform)) return 'linux';

  return 'unknown';
}
