const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 260,
    minHeight: 260,
    title: 'Facet — Minimal Clock',
    icon: path.join(__dirname, 'logo.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#0b0c0e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

ipcMain.on('set-always-on-top', (event, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(!!flag, 'screen-saver');
  }
});

ipcMain.on('set-window-opacity', (event, val) => {
  if (mainWindow && typeof val === 'number') {
    const opacity = Math.max(0.1, Math.min(1.0, val));
    mainWindow.setOpacity(opacity);
  }
});

ipcMain.on('set-window-size', (event, { width, height }) => {
  if (mainWindow && width && height) {
    mainWindow.setSize(width, height, true);
  }
});

ipcMain.on('set-aspect-ratio', (event, ratio) => {
  if (mainWindow && typeof ratio === 'number') {
    mainWindow.setAspectRatio(ratio);
  }
});

ipcMain.on('set-fullscreen', (event, flag) => {
  if (mainWindow) {
    mainWindow.setFullScreen(!!flag);
  }
});

ipcMain.handle('is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.on('set-window-position', (event, { x, y }) => {
  if (mainWindow && typeof x === 'number' && typeof y === 'number') {
    mainWindow.setPosition(x, y, true);
  }
});

ipcMain.handle('get-window-bounds', () => {
  return mainWindow ? mainWindow.getBounds() : { width: 1280, height: 800, x: 0, y: 0 };
});

// --- Desktop Widgets Integration ---
const widgetWindows = new Map();

ipcMain.on('pin-widget', (event, widgetConfig) => {
  if (!widgetConfig || !widgetConfig.id) return;
  
  if (widgetWindows.has(widgetConfig.id)) {
    const existing = widgetWindows.get(widgetConfig.id);
    if (existing && !existing.isDestroyed()) {
      existing.show();
      existing.focus();
      return;
    }
  }

  const { width = 300, height = 300, x, y, customization } = widgetConfig;
  
  const widgetWin = new BrowserWindow({
    width: Math.round(width),
    height: Math.round(height),
    x: typeof x === 'number' ? Math.round(x) : undefined,
    y: typeof y === 'number' ? Math.round(y) : undefined,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  widgetWin.loadFile('widget.html', { query: { id: widgetConfig.id } });
  
  widgetWin.on('closed', () => {
    widgetWindows.delete(widgetConfig.id);
  });

  widgetWindows.set(widgetConfig.id, widgetWin);
});

ipcMain.on('unpin-widget', (event, widgetId) => {
  if (widgetWindows.has(widgetId)) {
    const win = widgetWindows.get(widgetId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    widgetWindows.delete(widgetId);
  }
});

ipcMain.on('update-widget-config', (event, { id, customization, size, position }) => {
  if (widgetWindows.has(id)) {
    const win = widgetWindows.get(id);
    if (win && !win.isDestroyed()) {
      win.webContents.send('widget-config-updated', { customization, size, position });
      if (size && size.width && size.height) {
        win.setSize(Math.round(size.width), Math.round(size.height), true);
      }
      if (customization && typeof customization.opacity === 'number') {
        win.setOpacity(Math.max(0.1, Math.min(1.0, customization.opacity)));
      }
    }
  }
});

ipcMain.handle('get-pinned-widget-ids', () => {
  return Array.from(widgetWindows.keys());
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

