const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),
  setOpacity: (val) => ipcRenderer.send('set-window-opacity', val),
  setWindowSize: (w, h) => ipcRenderer.send('set-window-size', { width: w, height: h }),
  setAspectRatio: (ratio) => ipcRenderer.send('set-aspect-ratio', ratio),
  setFullScreen: (flag) => ipcRenderer.send('set-fullscreen', flag),
  isFullScreen: () => ipcRenderer.invoke('is-fullscreen'),
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y })
});
