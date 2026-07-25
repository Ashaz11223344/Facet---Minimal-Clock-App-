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
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  pinWidget: (config) => ipcRenderer.send('pin-widget', config),
  unpinWidget: (id) => ipcRenderer.send('unpin-widget', id),
  updateWidgetConfig: (payload) => ipcRenderer.send('update-widget-config', payload),
  getPinnedWidgetIds: () => ipcRenderer.invoke('get-pinned-widget-ids'),
  onWidgetConfigUpdated: (callback) => ipcRenderer.on('widget-config-updated', (event, data) => callback(data))
});

