/**
 * OpenCitation Electron Main Process
 * Desktop application wrapper for the PWA
 */

import { app, BrowserWindow, Menu, shell, ipcMain, nativeTheme, Notification } from 'electron';
import * as path from 'path';
import * as url from 'url';

const isDev = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 3000;

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
    shell.openExternal(url);
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

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
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
              { type: 'separator' as const },
              { role: 'toggleDevTools' as const },
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
              { type: 'separator' as const },
              { role: 'front' as const },
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
            shell.openExternal('https://github.com/opencitation/opencitation#readme');
          },
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/opencitation/opencitation/issues');
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
      label: app.name,
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

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
function setupIPC(): void {
  // Get system theme
  ipcMain.handle('get-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  // Set native theme
  ipcMain.on('set-theme', (_, theme: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = theme;
  });

  // Show notification
  ipcMain.on('show-notification', (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body, icon: path.join(__dirname, '../public/icon.png') }).show();
    }
  });

  // Get app info
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.name,
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    };
  });

  // Get online status
  ipcMain.handle('get-online-status', () => {
    return require('electron').net.isOnline();
  });

  // Check for updates (placeholder)
  ipcMain.handle('check-for-updates', async () => {
    // Implement auto-updater logic here
    return { updateAvailable: false };
  });

  // Open external link
  ipcMain.on('open-external', (_, url: string) => {
    shell.openExternal(url);
  });

  // Minimize window
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize();
  });

  // Maximize window
  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  // Close window
  ipcMain.on('close-window', () => {
    mainWindow?.close();
  });

  // Is window maximized
  ipcMain.handle('is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });
}

// App lifecycle
app.on('ready', () => {
  setupIPC();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Handle deep links (e.g., opencitation://share/xyz)
app.setAsDefaultProtocolClient('opencitation');

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
    mainWindow.show();
  }
});

// Security: Disable navigation to external sites
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (
      parsedUrl.origin !== `http://localhost:${PORT}` &&
      parsedUrl.protocol !== 'file:'
    ) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});
