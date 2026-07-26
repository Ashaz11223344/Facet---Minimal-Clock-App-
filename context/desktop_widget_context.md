# 🪟 Windows Desktop Widgets Integration — Comprehensive Technical & UI Specification

> **Environment Scope**: **Desktop Application ONLY (`.is-desktop-app`)**  
> **Status**: Fully Implemented & Deployed  
> **Repository**: `Facet - Clock Website`

---

## 📌 1. EXECUTIVE OVERVIEW

The **Windows Desktop Widgets Integration** empowers desktop users of Facet Clock to pin real-time, customizable clock widgets directly onto their Windows desktop. Pinned widgets operate as standalone, frameless, transparent, always-on-top floating windows powered by Electron.

### Key Capabilities:
- **In-App Widget Manager**: Accessible via a dedicated header toolbar icon (`widgets` symbol).
- **Aspect Ratio Presets**: Support for 4 distinct widget size ratios:
  1. **1:1 Square** (300×300px) — Compact, versatile corner widget.
  2. **3:2 Landscape** (450×300px) — Wide display format.
  3. **2:3 Portrait** (300×450px) — Vertical tall format.
  4. **16:9 Widescreen** (480×270px) — Cinema ultra-wide display.
- **Interactive Live Preview**: Real-time canvas/SVG preview before pinning.
- **Deep Customization**: Clock Mode (Analog/Digital/Both), Show Seconds toggle, 12h/24h Display Format, Color Palette selection, Opacity slider (10%–100%), and Desktop Position Lock.
- **Persistent State**: Automatic storage and restoration across application restarts via `localStorage`.

---

## 🎨 2. USER INTERFACE (UI) & MODAL ARCHITECTURE

The feature introduces three main glassmorphic modal overlays plus a floating desktop widget window template.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FACET CLOCK HEADER                               │
│  [Style] [Variant] [FX] [Font]                   [Full] [Eye] [Mini] [Widgets]│
└─────────────────────────────────────────────────────────────────────────────┘
                                                                           │
                                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DESKTOP WIDGETS MANAGER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Available Widgets ]      [ My Widgets (1) ]      [ Settings ]           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⏰ Facet Clock Widget                                  [ Ready to Pin ] │ │
│ │ Beautiful analog & digital clock widget with custom colors & opacity.   │ │
│ │ Category: Productivity                                                  │ │
│ │                                    [ Preview ]   [ + Pin to Desktop ]   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Header Trigger Button (`#widget-manager-btn`)
- **Icon**: Google Material Symbols Outlined (`widgets`).
- **Location**: Top-right header control bar (next to Mini Mode button).
- **Visibility**: Rendered strictly when `isDesktopApp` is true; hidden on Web (`.is-web-app .desktop-only-shortcut`).

### 2.2 Modal 1: Widget Manager (`#widget-manager-modal`)
Contains a glassmorphic card with tab navigation:
- **Tab 1: Available Widgets** (`#tab-available`)
  - Displays the "Facet Clock Widget" card with description, category badge, **[Preview]**, and **[+ Pin to Desktop]** action buttons.
- **Tab 2: My Widgets** (`#tab-my-widgets`)
  - Lists all currently pinned desktop widgets.
  - Each item displays widget icon, size ratio tag, active mode, **[Settings]** button, and **[Remove]** button.
- **Tab 3: Settings** (`#tab-settings`)
  - Global widget behavior toggles: Auto-update sync, System transparency, and Desktop position memory.

### 2.3 Modal 2: Widget Preview & Size Selection (`#widget-preview-modal`)
- **Aspect Ratio Selector Pills**: Interactive buttons for `1:1`, `3:2`, `2:3`, and `16:9`.
- **Live Preview Stage** (`#preview-stage-wrapper`): An animated live preview container matching the chosen aspect ratio dimensions, rendering an active clock face in real-time.
- **Actions**: **[Back]** returns to Widget Manager; **[+ Pin This Widget]** instantiates the desktop window.

### 2.4 Modal 3: Widget Customizer (`#widget-customizer-modal`)
Provides live customization for any pinned widget:
- **Display Settings**:
  - *Clock Mode*: `Analog Clock`, `Digital Clock`, or `Both`.
  - *Show Seconds*: Checkbox toggle.
  - *Display Format*: `24-Hour (14:30:00)` or `12-Hour (02:30:00 PM)`.
- **Color & Style**:
  - *Color Palette*: Dropdown selecting active app theme or explicit color palettes from `FacetThemes`.
  - *Opacity Slider*: Range input from 10% to 100% with live percentage read-out.
- **Size & Position**:
  - *Size Preset*: Dropdown switching aspect ratios on the fly.
  - *Lock Desktop Position*: Checkbox preventing accidental window dragging.

### 2.5 Standalone Floating Desktop Widget Window (`widget.html`)
- **Body**: Frameless (`frame: false`), transparent (`transparent: true`), always-on-top (`alwaysOnTop: true`), taskbar-bypassing (`skipTaskbar: true`).
- **Drag Region**: CSS `-webkit-app-region: drag` enables smooth click-and-drag positioning anywhere on Windows desktop.

---

## 🛠️ 3. TECHNICAL IMPLEMENTATION & FILE STRUCTURE

```
Facet - Clock Website/
├── main.js                 # Electron Main Process (IPC Window Manager)
├── preload.js              # Preload Script (ContextBridge IPC API)
├── index.html              # Main App UI & Widget Modals HTML
├── widget.html             # Standalone Widget Window Template
├── styles.css              # Glassmorphic Modal & Aspect Ratio Styles
├── js/
│   ├── widgets.js          # WidgetManager Controller Class
│   ├── controls.js         # App Controls & Environment Class Toggler
│   ├── clock.js            # Core Clock Engine
│   ├── renderers.js        # Analog/Digital SVG & Text Renderers
│   └── themes.js           # Palette & Theme System
└── rules                   # Environment Scope Rules File
```

### 3.1 Electron Main Process (`main.js`)
Manages standalone widget BrowserWindow lifecycle using `Map<widgetId, BrowserWindow>`:

```javascript
// IPC Handlers in main.js
const widgetWindows = new Map();

ipcMain.on('pin-widget', (event, widgetConfig) => {
  const { id, width = 300, height = 300, x, y } = widgetConfig;
  
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

  widgetWin.loadFile('widget.html', { query: { id } });
  widgetWindows.set(id, widgetWin);
});

ipcMain.on('unpin-widget', (event, widgetId) => {
  if (widgetWindows.has(widgetId)) {
    const win = widgetWindows.get(widgetId);
    if (win && !win.isDestroyed()) win.close();
    widgetWindows.delete(widgetId);
  }
});

ipcMain.on('update-widget-config', (event, { id, customization, size }) => {
  if (widgetWindows.has(id)) {
    const win = widgetWindows.get(id);
    if (win && !win.isDestroyed()) {
      win.webContents.send('widget-config-updated', { customization, size });
      if (size) win.setSize(Math.round(size.width), Math.round(size.height), true);
      if (customization && typeof customization.opacity === 'number') {
        win.setOpacity(Math.max(0.1, Math.min(1.0, customization.opacity)));
      }
    }
  }
});
```

### 3.2 Preload IPC Bridge (`preload.js`)
Exposes safe IPC bridge functions to `window.electronAPI`:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  pinWidget: (config) => ipcRenderer.send('pin-widget', config),
  unpinWidget: (id) => ipcRenderer.send('unpin-widget', id),
  updateWidgetConfig: (payload) => ipcRenderer.send('update-widget-config', payload),
  getPinnedWidgetIds: () => ipcRenderer.invoke('get-pinned-widget-ids'),
  onWidgetConfigUpdated: (cb) => ipcRenderer.on('widget-config-updated', (e, data) => cb(data))
});
```

### 3.3 Widget Controller (`js/widgets.js`)
Encapsulates DOM caching, event binding, tab navigation, preview aspect updates, customizer synchronization, and `localStorage` persistence under the `WidgetManager` class.

---

## 💾 4. DATA PERSISTENCE MODEL (`localStorage`)

All widget configurations are saved in the browser/Electron `localStorage`:

### Key 1: `clock_pinned_widgets`
Stores an array of pinned widget objects:
```json
[
  {
    "id": "facet-clock-1721826000000",
    "type": "facet-clock",
    "pinned": true,
    "pinnedAt": 1721826000000,
    "width": 300,
    "height": 300,
    "customization": {
      "size": "1:1",
      "clockMode": "analog",
      "showSeconds": true,
      "displayFormat": "24-hour",
      "palette": "default",
      "opacity": 1.0,
      "locked": false
    }
  }
]
```

### Key 2: `clock_widget_settings`
Stores global preferences (auto-update interval, system transparency toggle, desktop position memory).

---

## 🔄 5. DATA & IPC FLOW DIAGRAM

```
 [ User Action ]
       │
       ▼
 [ WidgetManager in js/widgets.js ]
       │
       ├── 1. Save config to localStorage ("clock_pinned_widgets")
       │
       ├── 2. Invoke window.electronAPI.pinWidget(config)
       │         │
       │         ▼ (IPC Send 'pin-widget')
       │   [ Electron Main Process (main.js) ]
       │         │
       │         ▼ Creates BrowserWindow
       │   [ Standalone Window: widget.html?id=... ]
       │         │
       │         ▼ Loads config from localStorage & renders Clock
       │
       └── 3. User Edits Settings in Customizer
                 │
                 ▼
           window.electronAPI.updateWidgetConfig(...)
                 │
                 ▼ (IPC Send 'update-widget-config')
           Electron Main updates opacity, size & sends 'widget-config-updated'
                 │
                 ▼
           widget.html re-renders clock live in real-time
```

---

## 🔒 6. ENVIRONMENT SCOPING & RULES

Per **Rule 7** in [`rules`](file:///d:/Facet%20-%20Clock%20Website/rules):

- **Desktop Application (`.is-desktop-app`)**:
  - Full access to Widget Manager icon, Available/My Widgets/Settings modals, live preview, customizer, and Electron desktop pinning.
- **Website Version (`.is-web-app`)**:
  - Widget Manager button, preview modals, and customizers are **100% hidden and disabled** (`.is-web-app .desktop-only-shortcut { display: none !important; }`).
