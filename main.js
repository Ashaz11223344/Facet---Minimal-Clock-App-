const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const widgetWindows = new Map();

function getWidgetStoragePath() {
  return path.join(app.getPath('userData'), 'clock-widgets.json');
}

function readWidgetStorage() {
  try {
    const p = getWidgetStoragePath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed reading widget storage:', e);
  }
  return { clock_pinned_widgets: [] };
}

function writeWidgetStorage(data) {
  try {
    fs.writeFileSync(getWidgetStoragePath(), JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed writing widget storage:', e);
  }
}

function updateWidgetPositionInStorage(id, { x, y, width, height }) {
  const data = readWidgetStorage();
  const list = data.clock_pinned_widgets || [];
  const idx = list.findIndex(w => w.id === id);
  if (idx !== -1) {
    if (typeof x === 'number') list[idx].x = x;
    if (typeof y === 'number') list[idx].y = y;
    if (typeof width === 'number') list[idx].width = width;
    if (typeof height === 'number') list[idx].height = height;
    data.clock_pinned_widgets = list;
    writeWidgetStorage(data);
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function createWidgetWindow(config) {
  if (!config || !config.id) return null;

  if (widgetWindows.has(config.id)) {
    const existing = widgetWindows.get(config.id);
    if (existing && !existing.isDestroyed()) {
      existing.show();
      existing.focus();
      return existing;
    }
  }

  const { width = 300, height = 300, x, y, customization = {} } = config;

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

  widgetWin.loadFile('widget.html', { query: { id: config.id } });

  // Fade in animation on spawn
  const targetOpacity = typeof customization.opacity === 'number' ? customization.opacity : 1.0;
  widgetWin.setOpacity(0.01);
  let curOpacity = 0.01;
  const fadeTimer = setInterval(() => {
    curOpacity = Math.min(curOpacity + 0.1, targetOpacity);
    if (!widgetWin.isDestroyed()) {
      widgetWin.setOpacity(curOpacity);
    }
    if (curOpacity >= targetOpacity) clearInterval(fadeTimer);
  }, 25);

  // Position and size persistence tracking
  const saveBounds = debounce(() => {
    if (widgetWin.isDestroyed()) return;
    const [wx, wy] = widgetWin.getPosition();
    const [ww, wh] = widgetWin.getSize();
    updateWidgetPositionInStorage(config.id, { x: wx, y: wy, width: ww, height: wh });
  }, 400);

  widgetWin.on('move', saveBounds);
  widgetWin.on('resize', saveBounds);

  widgetWin.on('closed', () => {
    widgetWindows.delete(config.id);
  });

  widgetWindows.set(config.id, widgetWin);
  return widgetWin;
}

function restoreWidgetsFromStorage() {
  const data = readWidgetStorage();
  const list = data.clock_pinned_widgets || [];
  list.forEach((cfg, idx) => {
    setTimeout(() => {
      createWidgetWindow(cfg);
    }, idx * 250);
  });
  return list.length;
}

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

// --- Desktop Widgets Integration IPC ---

ipcMain.on('pin-widget', (event, widgetConfig) => {
  if (!widgetConfig) return;
  if (!widgetConfig.id) widgetConfig.id = `facet-clock-${Date.now()}`;

  createWidgetWindow(widgetConfig);

  // Persist to file storage
  const data = readWidgetStorage();
  const list = data.clock_pinned_widgets || [];
  const idx = list.findIndex(w => w.id === widgetConfig.id);
  if (idx !== -1) {
    list[idx] = widgetConfig;
  } else {
    list.push(widgetConfig);
  }
  data.clock_pinned_widgets = list;
  writeWidgetStorage(data);
});

ipcMain.on('unpin-widget', (event, widgetId) => {
  if (widgetWindows.has(widgetId)) {
    const win = widgetWindows.get(widgetId);
    if (win && !win.isDestroyed()) {
      win.close();
    }
    widgetWindows.delete(widgetId);
  }

  // Remove from file storage
  const data = readWidgetStorage();
  data.clock_pinned_widgets = (data.clock_pinned_widgets || []).filter(w => w.id !== widgetId);
  writeWidgetStorage(data);
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

  // Save to file storage
  const data = readWidgetStorage();
  const list = data.clock_pinned_widgets || [];
  const idx = list.findIndex(w => w.id === id);
  if (idx !== -1) {
    if (customization) list[idx].customization = customization;
    if (size) {
      list[idx].width = size.width;
      list[idx].height = size.height;
    }
    if (position) {
      list[idx].x = position.x;
      list[idx].y = position.y;
    }
    data.clock_pinned_widgets = list;
    writeWidgetStorage(data);
  }
});

ipcMain.handle('get-pinned-widget-ids', () => {
  return Array.from(widgetWindows.keys());
});

app.whenReady().then(() => {
  restoreWidgetsFromStorage();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Desktop Widget Lifecycle Independence: Only quit if no active floating widgets remain
app.on('window-all-closed', () => {
  if (widgetWindows.size === 0 && process.platform !== 'darwin') {
    app.quit();
  }
});


