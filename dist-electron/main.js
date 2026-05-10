"use strict";
/**
 * OpenCitation Electron Main Process
 * Desktop application wrapper for the PWA
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const isDev = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 3000;
let mainWindow = null;
let isQuitting = false;
// Single instance lock
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'OpenCitation',
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false,
        },
        show: false,
        backgroundColor: '#f9f9f9',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });
    // Load the app
    const startUrl = isDev
        ? `http://localhost:${PORT}`
        : url.format({
            pathname: path.join(__dirname, '../out/index.html'),
            protocol: 'file:',
            slashes: true,
        });
    mainWindow.loadURL(startUrl);
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        if (isDev) {
            mainWindow?.webContents.openDevTools();
        }
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    // Handle close
    mainWindow.on('close', (event) => {
        if (!isQuitting && process.platform === 'darwin') {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Create menu
    createMenu();
}
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Citation',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/cite');
                    },
                },
                {
                    label: 'New List',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => {
                        mainWindow?.webContents.send('create-list');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Import...',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        mainWindow?.webContents.send('import');
                    },
                },
                {
                    label: 'Export...',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow?.webContents.send('export');
                    },
                },
                { type: 'separator' },
                process.platform === 'darwin'
                    ? { role: 'close' }
                    : { role: 'quit' },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
                ...(isDev
                    ? [
                        { type: 'separator' },
                        { role: 'toggleDevTools' },
                    ]
                    : []),
            ],
        },
        {
            label: 'Go',
            submenu: [
                {
                    label: 'Home',
                    accelerator: 'CmdOrCtrl+H',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/');
                    },
                },
                {
                    label: 'Cite',
                    accelerator: 'CmdOrCtrl+1',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/cite');
                    },
                },
                {
                    label: 'My Lists',
                    accelerator: 'CmdOrCtrl+2',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/lists');
                    },
                },
                {
                    label: 'Projects',
                    accelerator: 'CmdOrCtrl+3',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/projects');
                    },
                },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(process.platform === 'darwin'
                    ? [
                        { type: 'separator' },
                        { role: 'front' },
                    ]
                    : []),
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: () => {
                        electron_1.shell.openExternal('https://github.com/opencitation/opencitation#readme');
                    },
                },
                {
                    label: 'Report Issue',
                    click: () => {
                        electron_1.shell.openExternal('https://github.com/opencitation/opencitation/issues');
                    },
                },
                { type: 'separator' },
                {
                    label: 'About OpenCitation',
                    click: () => {
                        mainWindow?.webContents.send('show-about');
                    },
                },
            ],
        },
    ];
    // macOS app menu
    if (process.platform === 'darwin') {
        template.unshift({
            label: electron_1.app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                {
                    label: 'Preferences...',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/settings');
                    },
                },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        });
    }
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
// IPC Handlers
function setupIPC() {
    // Get system theme
    electron_1.ipcMain.handle('get-theme', () => {
        return electron_1.nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });
    // Set native theme
    electron_1.ipcMain.on('set-theme', (_, theme) => {
        electron_1.nativeTheme.themeSource = theme;
    });
    // Show notification
    electron_1.ipcMain.on('show-notification', (_, { title, body }) => {
        if (electron_1.Notification.isSupported()) {
            new electron_1.Notification({ title, body, icon: path.join(__dirname, '../public/icon.png') }).show();
        }
    });
    // Get app info
    electron_1.ipcMain.handle('get-app-info', () => {
        return {
            name: electron_1.app.name,
            version: electron_1.app.getVersion(),
            platform: process.platform,
            arch: process.arch,
            electron: process.versions.electron,
            chrome: process.versions.chrome,
            node: process.versions.node,
        };
    });
    // Get online status
    electron_1.ipcMain.handle('get-online-status', () => {
        return require('electron').net.isOnline();
    });
    // Check for updates (placeholder)
    electron_1.ipcMain.handle('check-for-updates', async () => {
        // Implement auto-updater logic here
        return { updateAvailable: false };
    });
    // Open external link
    electron_1.ipcMain.on('open-external', (_, url) => {
        electron_1.shell.openExternal(url);
    });
    // Minimize window
    electron_1.ipcMain.on('minimize-window', () => {
        mainWindow?.minimize();
    });
    // Maximize window
    electron_1.ipcMain.on('maximize-window', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    // Close window
    electron_1.ipcMain.on('close-window', () => {
        mainWindow?.close();
    });
    // Is window maximized
    electron_1.ipcMain.handle('is-maximized', () => {
        return mainWindow?.isMaximized() ?? false;
    });
}
// App lifecycle
electron_1.app.on('ready', () => {
    setupIPC();
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    else {
        mainWindow?.show();
    }
});
electron_1.app.on('before-quit', () => {
    isQuitting = true;
});
// Handle deep links (e.g., opencitation://share/xyz)
electron_1.app.setAsDefaultProtocolClient('opencitation');
electron_1.app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
        mainWindow.webContents.send('deep-link', url);
        mainWindow.show();
    }
});
// Security: Disable navigation to external sites
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== `http://localhost:${PORT}` &&
            parsedUrl.protocol !== 'file:') {
            event.preventDefault();
            electron_1.shell.openExternal(navigationUrl);
        }
    });
});
