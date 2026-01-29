/**
 * OpenCitation Electron Preload Script
 * Exposes secure APIs to the renderer process
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Type definitions for the exposed API
export interface ElectronAPI {
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

// Helper to create event listener with cleanup
function createEventListener<T>(
  channel: string,
  callback: (data: T) => void
): () => void {
  const handler = (_event: IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

// Expose secure API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    ipcRenderer.send('set-theme', theme);
  },
  onThemeChange: (callback: (theme: 'light' | 'dark') => void) => {
    return createEventListener('theme-changed', callback);
  },

  // Notifications
  showNotification: (title: string, body: string) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Online status
  getOnlineStatus: () => ipcRenderer.invoke('get-online-status'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // External links
  openExternal: (url: string) => {
    ipcRenderer.send('open-external', url);
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // Navigation events from menu
  onNavigate: (callback: (path: string) => void) => {
    return createEventListener('navigate', callback);
  },

  // Deep links
  onDeepLink: (callback: (url: string) => void) => {
    return createEventListener('deep-link', callback);
  },

  // App events
  onCreateList: (callback: () => void) => {
    return createEventListener('create-list', callback);
  },
  onImport: (callback: () => void) => {
    return createEventListener('import', callback);
  },
  onExport: (callback: () => void) => {
    return createEventListener('export', callback);
  },
  onShowAbout: (callback: () => void) => {
    return createEventListener('show-about', callback);
  },

  // Platform check
  isElectron: true,
  platform: process.platform,
} as ElectronAPI);

// Expose version info for debugging
contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
});
