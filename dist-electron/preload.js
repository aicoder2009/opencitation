"use strict";
/**
 * OpenCitation Electron Preload Script
 * Exposes secure APIs to the renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Helper to create event listener with cleanup
function createEventListener(channel, callback) {
    const handler = (_event, data) => callback(data);
    electron_1.ipcRenderer.on(channel, handler);
    return () => {
        electron_1.ipcRenderer.removeListener(channel, handler);
    };
}
// Expose secure API to renderer
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Theme
    getTheme: () => electron_1.ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => {
        electron_1.ipcRenderer.send('set-theme', theme);
    },
    onThemeChange: (callback) => {
        return createEventListener('theme-changed', callback);
    },
    // Notifications
    showNotification: (title, body) => {
        electron_1.ipcRenderer.send('show-notification', { title, body });
    },
    // App info
    getAppInfo: () => electron_1.ipcRenderer.invoke('get-app-info'),
    // Online status
    getOnlineStatus: () => electron_1.ipcRenderer.invoke('get-online-status'),
    // Updates
    checkForUpdates: () => electron_1.ipcRenderer.invoke('check-for-updates'),
    // External links
    openExternal: (url) => {
        electron_1.ipcRenderer.send('open-external', url);
    },
    // Window controls
    minimizeWindow: () => electron_1.ipcRenderer.send('minimize-window'),
    maximizeWindow: () => electron_1.ipcRenderer.send('maximize-window'),
    closeWindow: () => electron_1.ipcRenderer.send('close-window'),
    isMaximized: () => electron_1.ipcRenderer.invoke('is-maximized'),
    // Navigation events from menu
    onNavigate: (callback) => {
        return createEventListener('navigate', callback);
    },
    // Deep links
    onDeepLink: (callback) => {
        return createEventListener('deep-link', callback);
    },
    // App events
    onCreateList: (callback) => {
        return createEventListener('create-list', callback);
    },
    onImport: (callback) => {
        return createEventListener('import', callback);
    },
    onExport: (callback) => {
        return createEventListener('export', callback);
    },
    onShowAbout: (callback) => {
        return createEventListener('show-about', callback);
    },
    // Platform check
    isElectron: true,
    platform: process.platform,
});
// Expose version info for debugging
electron_1.contextBridge.exposeInMainWorld('versions', {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
});
