/**
 * Electron API Type Declarations
 * Available in window.electronAPI when running in Electron
 */

interface ElectronAPI {
  // Theme
  getTheme: () => Promise<'light' | 'dark'>;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  onThemeChange: (callback: (theme: 'light' | 'dark') => void) => () => void;

  // Notifications
  showNotification: (title: string, body: string) => void;

  // App info
  getAppInfo: () => Promise<{
    name: string;
    version: string;
    platform: string;
    arch: string;
    electron: string;
    chrome: string;
    node: string;
  }>;

  // Online status
  getOnlineStatus: () => Promise<boolean>;

  // Updates
  checkForUpdates: () => Promise<{ updateAvailable: boolean }>;

  // External links
  openExternal: (url: string) => void;

  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;

  // Navigation events
  onNavigate: (callback: (path: string) => void) => () => void;

  // Deep links
  onDeepLink: (callback: (url: string) => void) => () => void;

  // App events
  onCreateList: (callback: () => void) => () => void;
  onImport: (callback: () => void) => () => void;
  onExport: (callback: () => void) => () => void;
  onShowAbout: (callback: () => void) => () => void;

  // Platform check
  isElectron: boolean;
  platform: NodeJS.Platform;
}

interface ElectronVersions {
  node: string;
  chrome: string;
  electron: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    versions?: ElectronVersions;
  }
}

export {};
