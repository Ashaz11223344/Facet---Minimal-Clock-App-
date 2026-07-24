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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
