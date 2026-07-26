# 🎯 FACET CLOCK WIDGET ENHANCEMENT PROMPT

## PROBLEM STATEMENT

**Current Issues:**
1. Closing Facet Clock application forcibly closes all pinned desktop widgets
2. Widgets have no independent lifecycle — they're tightly coupled to the main app window
3. Widget UI is dense and not minimal enough for a desktop widget context
4. Widgets don't auto-restore after system restart or app restart
5. No visual feedback for widget state persistence

**Desired Outcome:**
- Widgets persist independently after app close
- Widgets auto-restore on Facet startup
- Minimal, cute, beautiful widget UI that feels at home on Windows desktop
- Zero-friction widget lifecycle management

---

## 🏗️ ARCHITECTURE CHANGES

### Issue 1: Widget Lifecycle Independence

**Current Architecture (WRONG):**
```
Main App Window (index.html)
    ├── Widget Manager Modals
    └── IPC Sends → Electron Main → Creates Widget Windows
            ↓
        Widgets LIVE as long as Main App Lives
        (Close Main App = Close ALL Widgets)
```

**New Architecture (CORRECT):**
```
System Startup
    ↓
Electron Main Process (main.js) STARTS
    ├── Checks localStorage for "clock_pinned_widgets"
    ├── Restores ALL pinned widget windows (independent)
    └── THEN launches Main App Window (optional)
    
Main App Window
    └── Can close without affecting Widget Windows
    
Desktop Widgets (widget.html instances)
    ├── Live in Electron Main's widgetWindows Map
    ├── Render independently with their own update loops
    └── Survive Main App closure
```

### Issue 2: Auto-Startup & Recovery

**Implementation Path:**

1. **On First Widget Pin** → Store widget config + flag in `localStorage`:
   ```json
   {
     "clock_widget_autostart_enabled": true,
     "clock_pinned_widgets": [{ ... widget configs ... }]
   }
   ```

2. **On App Startup** → Check Electron startup flags:
   - If app was **pinning a widget** → restore widget first, then show Main Window
   - If app was **closed with widgets active** → restore widgets silently on next launch
   - If app was **launched normally** → launch Main App + check for orphaned widgets

3. **Widget Window Independence**:
   - Each widget window runs its own clock update loop (not synced to Main App)
   - Each widget has its own `localStorage` access via preload bridge
   - Widgets can update independently if Main App crashes

---

## 🎨 MINIMAL & CUTE UI REDESIGN

### Design Philosophy
- **Zero Chrome**: No title bars, borders, or visual containers
- **Glassmorphism**: Subtle frosted glass effect with 95% opacity
- **Micro-interactions**: Smooth fade-in on spawn, hover lift effect
- **Typography**: System font stack only (no web fonts)
- **Color Harmony**: Match Windows 11 acrylic theme when possible

### Widget Preview Modal → Cleaner

**Current State (too busy):**
```
┌─────────────────────────┐
│ WIDGET PREVIEW & SIZE   │  ← Heavy header
│ ┌─ 1:1 ─┬─ 3:2 ─┬─ 2:3 ┤  ← Pill buttons look clunky
│ │ Live Preview Stage    │
│ │ [animated clock]      │
│ ├───────────────────────┤
│ │ [Back] [Pin This]     │  ← Redundant buttons
│ └─────────────────────────┘
```

**New Minimal State:**
```
┌──────────────────────────┐
│ ⏱️ Choose your widget size
│
│ ◻️     🟫     🟪     🟩
│ 1:1   3:2   2:3    16:9
│
│ ┌────────────────────────┐
│ │  [LIVE PREVIEW]        │
│ │  🕐 (animated clock)   │
│ └────────────────────────┘
│
│      ✨ PIN TO DESKTOP
└──────────────────────────┘
```

**CSS Changes:**
- Remove card shadows; use `backdrop-filter: blur(10px)` only
- Aspect ratio buttons: Just Unicode clock emoji + label, no background fill
- Center everything; use `gap: 1.5rem` for breathing room
- Back button: Remove entirely; click outside modal to close

### Widget Manager Modal → Streamlined

**Current State:**
```
┌──────────────────────────┐
│ DESKTOP WIDGETS MANAGER  │  ← Unnecessary title
│ [Tab 1] [Tab 2] [Tab 3]  │  ← 3 tabs = cognitive load
│ ┌──────────────────────┐
│ │ Facet Clock Widget   │
│ │ Beautiful analog...  │  ← Long description
│ │ [Preview] [Pin]      │
│ └──────────────────────┘
└──────────────────────────┘
```

**New Minimal State:**
```
┌──────────────────────────┐
│ ⏱️ My Widgets (1)
│
│ 🕐 Facet Clock
│ 1:1 Square · Analog · 100%
│ [⚙️ Settings]  [✕ Remove]
│
│ ✨ Pin a New Widget
└──────────────────────────┘
```

**Single Tab Approach:**
- Merge "Available Widgets" + "My Widgets" into one view
- "Available Widgets" = just the one Facet Clock option at the bottom
- "Settings" = global toggle card at top (not a tab)

### Widget Customizer Modal → Compact

**Current State:**
```
┌──────────────────────────────┐
│ ⚙️ WIDGET CUSTOMIZER
│ Display Settings
│   Clock Mode: [dropdown]
│   Show Seconds: [checkbox]
│   Display Format: [dropdown]
│ Color & Style
│   Color Palette: [dropdown]
│   Opacity: [slider]
│ Size & Position
│   Size Preset: [dropdown]
│   Lock Position: [checkbox]
│ [Apply] [Cancel]
└──────────────────────────────┘
```

**New Minimal State:**
```
┌──────────────────────────┐
│ ⚙️ Customize Widget
│
│ Clock Mode
│ ◉ Analog  ○ Digital  ○ Both
│
│ Format: ◉ 24h  ○ 12h
│ Seconds: ☑ On   Color: [picker dot]
│
│ Opacity: ▮▮▮▮▮▮▮░ 85%
│
│ Size: ◻️ 1:1      🔒 Lock Position
│
│            [Apply]
└──────────────────────────┘
```

**Rationale:**
- Radio buttons instead of dropdowns (fewer clicks)
- Color picker = single dot/circle click instead of palette dropdown
- Opacity slider with percentage read-out inline
- Remove "Size Preset" dropdown; lock it (users can resize the window directly)

---

## 🔧 TECHNICAL IMPLEMENTATION SPECS

### 1. Electron Main Process Enhancement (`main.js`)

**Add: Widget Persistence Layer**

```javascript
// At top of main.js
const WIDGET_STARTUP_DELAY = 500; // ms

// New function: Restore widgets from localStorage on startup
function restoreWidgetsFromStorage() {
  try {
    // Need to access mainWindow's localStorage; use mainWindow.webContents.executeJavaScript()
    // OR: Store widget data in a separate JSON file in userData directory
    
    const userData = app.getPath('userData');
    const widgetDataPath = path.join(userData, 'clock-widgets.json');
    
    if (fs.existsSync(widgetDataPath)) {
      const widgetData = JSON.parse(fs.readFileSync(widgetDataPath, 'utf-8'));
      const pinnedWidgets = widgetData.clock_pinned_widgets || [];
      
      pinnedWidgets.forEach((config, index) => {
        setTimeout(() => {
          createWidgetWindow(config);
        }, WIDGET_STARTUP_DELAY * index); // Stagger widget creation by 500ms each
      });
      
      return pinnedWidgets.length;
    }
  } catch (error) {
    console.error('Failed to restore widgets:', error);
  }
  return 0;
}

// Modify app.on('ready') to restore widgets BEFORE showing main window
app.on('ready', () => {
  const restoredCount = restoreWidgetsFromStorage();
  console.log(`Restored ${restoredCount} widgets from storage`);
  
  // Then create main window
  createWindow();
});

// New function: Refactored widget creation (reusable)
function createWidgetWindow(config) {
  const {
    id,
    width = 300,
    height = 300,
    x = undefined,
    y = undefined,
    customization = {}
  } = config;
  
  if (widgetWindows.has(id)) {
    console.warn(`Widget ${id} already exists; skipping creation`);
    return;
  }
  
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
    show: false, // Don't show immediately; wait for preload to set up
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  
  widgetWin.loadFile('widget.html', {
    query: {
      id,
      width,
      height,
      customization: JSON.stringify(customization)
    }
  });
  
  // Fade in effect: start at 0% opacity, animate to final opacity
  widgetWin.setOpacity(0);
  widgetWin.show();
  let currentOpacity = 0;
  const targetOpacity = customization.opacity || 1.0;
  const fadeInterval = setInterval(() => {
    currentOpacity = Math.min(currentOpacity + 0.1, targetOpacity);
    widgetWin.setOpacity(currentOpacity);
    if (currentOpacity >= targetOpacity) clearInterval(fadeInterval);
  }, 30);
  
  // Track window position on move (for restore on startup)
  widgetWin.on('move', debounce(() => {
    const [x, y] = widgetWin.getPosition();
    const [width, height] = widgetWin.getSize();
    updateWidgetPositionInStorage(id, { x, y, width, height });
  }, 500));
  
  widgetWin.on('closed', () => {
    widgetWindows.delete(id);
  });
  
  widgetWindows.set(id, widgetWin);
}

// New function: Save widget position/size to persistent storage
function updateWidgetPositionInStorage(widgetId, positionData) {
  try {
    const userData = app.getPath('userData');
    const widgetDataPath = path.join(userData, 'clock-widgets.json');
    
    let widgetData = {};
    if (fs.existsSync(widgetDataPath)) {
      widgetData = JSON.parse(fs.readFileSync(widgetDataPath, 'utf-8'));
    }
    
    const pinnedWidgets = widgetData.clock_pinned_widgets || [];
    const widgetIndex = pinnedWidgets.findIndex(w => w.id === widgetId);
    
    if (widgetIndex >= 0) {
      pinnedWidgets[widgetIndex] = {
        ...pinnedWidgets[widgetIndex],
        ...positionData
      };
      
      widgetData.clock_pinned_widgets = pinnedWidgets;
      fs.writeFileSync(widgetDataPath, JSON.stringify(widgetData, null, 2));
    }
  } catch (error) {
    console.error('Failed to save widget position:', error);
  }
}

// Utility: Simple debounce
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

### 2. IPC Handlers Enhancement

**Modify: 'pin-widget' IPC handler**

```javascript
ipcMain.on('pin-widget', (event, widgetConfig) => {
  // Assign unique ID if not present
  if (!widgetConfig.id) {
    widgetConfig.id = `facet-clock-${Date.now()}`;
  }
  
  // Create widget window
  createWidgetWindow(widgetConfig);
  
  // Persist to file storage (NOT just localStorage)
  try {
    const userData = app.getPath('userData');
    const widgetDataPath = path.join(userData, 'clock-widgets.json');
    
    let widgetData = {};
    if (fs.existsSync(widgetDataPath)) {
      widgetData = JSON.parse(fs.readFileSync(widgetDataPath, 'utf-8'));
    }
    
    const pinnedWidgets = widgetData.clock_pinned_widgets || [];
    pinnedWidgets.push(widgetConfig);
    
    widgetData.clock_pinned_widgets = pinnedWidgets;
    fs.writeFileSync(widgetDataPath, JSON.stringify(widgetData, null, 2));
  } catch (error) {
    console.error('Failed to persist widget:', error);
  }
  
  event.reply('pin-widget-success', { id: widgetConfig.id });
});

ipcMain.on('unpin-widget', (event, widgetId) => {
  // Close window
  if (widgetWindows.has(widgetId)) {
    const win = widgetWindows.get(widgetId);
    if (win && !win.isDestroyed()) win.close();
    widgetWindows.delete(widgetId);
  }
  
  // Remove from persistent storage
  try {
    const userData = app.getPath('userData');
    const widgetDataPath = path.join(userData, 'clock-widgets.json');
    
    if (fs.existsSync(widgetDataPath)) {
      let widgetData = JSON.parse(fs.readFileSync(widgetDataPath, 'utf-8'));
      const pinnedWidgets = widgetData.clock_pinned_widgets || [];
      
      widgetData.clock_pinned_widgets = pinnedWidgets.filter(w => w.id !== widgetId);
      fs.writeFileSync(widgetDataPath, JSON.stringify(widgetData, null, 2));
    }
  } catch (error) {
    console.error('Failed to remove widget from storage:', error);
  }
});
```

### 3. Widget HTML (`widget.html`) — Minimal & Beautiful

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facet Clock Widget</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      -webkit-app-region: drag; /* Allow drag anywhere */
    }

    #widget-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      padding: 20px;
    }

    /* Analog Clock */
    #clock-analog {
      width: 100%;
      height: 100%;
      max-width: 280px;
      max-height: 280px;
    }

    /* Digital Clock */
    #clock-digital {
      font-size: 3rem;
      font-weight: 200;
      letter-spacing: 0.1em;
      color: rgba(0, 0, 0, 0.9);
      font-variant-numeric: tabular-nums;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    /* Hover effect for repositioning hint */
    body:hover {
      cursor: grab;
    }

    body:active {
      cursor: grabbing;
    }

    /* Smooth fade-in animation on widget spawn */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    #widget-container {
      animation: fadeIn 0.5s ease-out;
    }
  </style>
</head>
<body>
  <div id="widget-container">
    <svg id="clock-analog" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"></svg>
    <div id="clock-digital" style="display: none;"></div>
  </div>

  <script src="js/clock.js"></script>
  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const widgetId = urlParams.get('id');
    const customizationStr = urlParams.get('customization');
    const customization = customizationStr ? JSON.parse(decodeURIComponent(customizationStr)) : {};

    // Initialize clock on widget
    const clockMode = customization.clockMode || 'analog';
    const showSeconds = customization.showSeconds !== false;
    const displayFormat = customization.displayFormat || '24-hour';
    const opacity = customization.opacity || 1.0;

    // Set opacity
    document.body.style.opacity = opacity;

    // Render clock
    const clock = new Clock({
      mode: clockMode,
      showSeconds,
      displayFormat
    });

    // Listen for config updates from main process
    if (window.electronAPI && window.electronAPI.onWidgetConfigUpdated) {
      window.electronAPI.onWidgetConfigUpdated((data) => {
        // Update clock configuration live
        clock.update(data.customization);
        if (data.size) {
          // Window resize handled by Electron; we just re-render
          clock.render();
        }
      });
    }

    // Render immediately
    clock.render();
  </script>
</body>
</html>
```

### 4. Widget Manager Controller (`js/widgets.js`) — Simplified

**Remove tab-based navigation; use single unified view:**

```javascript
class WidgetManager {
  constructor() {
    this.containerEl = document.getElementById('widget-manager-modal');
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const pinnedWidgets = this.getPinnedWidgets();

    this.containerEl.innerHTML = `
      <div class="modal-content modal-minimal">
        <h3>⏱️ My Widgets ${pinnedWidgets.length > 0 ? `(${pinnedWidgets.length})` : ''}</h3>

        <div class="widget-list">
          ${pinnedWidgets.map(w => `
            <div class="widget-item" data-id="${w.id}">
              <div class="widget-info">
                <span class="widget-icon">🕐</span>
                <span class="widget-label">Facet Clock</span>
                <span class="widget-meta">${w.customization.size || '1:1'} · ${w.customization.clockMode || 'Analog'} · ${Math.round(w.customization.opacity * 100)}%</span>
              </div>
              <div class="widget-actions">
                <button class="btn-settings" data-id="${w.id}">⚙️</button>
                <button class="btn-remove" data-id="${w.id}">✕</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="action-bar">
          <button id="btn-add-widget" class="btn-primary">✨ Pin a New Widget</button>
        </div>

        <div class="global-settings">
          <label>
            <input type="checkbox" id="toggle-autostart" checked>
            Auto-restore widgets on startup
          </label>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.containerEl.addEventListener('click', (e) => {
      if (e.target.id === 'btn-add-widget') this.showSizeSelector();
      if (e.target.classList.contains('btn-settings')) this.showCustomizer(e.target.dataset.id);
      if (e.target.classList.contains('btn-remove')) this.removeWidget(e.target.dataset.id);
    });
  }

  getPinnedWidgets() {
    try {
      const stored = localStorage.getItem('clock_pinned_widgets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  showSizeSelector() {
    // Launch widget preview modal (minimal version)
  }

  showCustomizer(widgetId) {
    // Launch widget customizer modal (minimal version)
  }

  async removeWidget(widgetId) {
    if (window.electronAPI) {
      window.electronAPI.unpinWidget(widgetId);
    }
    this.render();
  }
}
```

---

## 🎯 CSS STYLING FOR MINIMAL AESTHETIC

```css
/* Modal Container */
.modal-minimal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 2rem;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.modal-minimal h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

/* Widget Item */
.widget-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
  margin-bottom: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.widget-item:hover {
  background: rgba(0, 0, 0, 0.04);
  transform: translateX(2px);
}

.widget-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.widget-icon {
  font-size: 1.5rem;
}

.widget-label {
  font-weight: 500;
  color: #1a1a1a;
}

.widget-meta {
  font-size: 0.85rem;
  color: #888;
}

.widget-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-settings, .btn-remove {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-settings:hover {
  background: rgba(0, 0, 0, 0.08);
}

.btn-remove:hover {
  background: rgba(255, 0, 0, 0.1);
  color: #d32f2f;
}

/* Action Button */
.btn-primary {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Global Settings */
.global-settings {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.9rem;
  color: #666;
}

.global-settings label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.global-settings input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Refactor `main.js` with widget persistence layer
- [ ] Add file-based widget storage (`clock-widgets.json` in userData)
- [ ] Implement `restoreWidgetsFromStorage()` function
- [ ] Update `app.on('ready')` to restore widgets before showing main window
- [ ] Enhance IPC handlers for persistent storage
- [ ] Redesign `widget.html` with minimal glassmorphic UI
- [ ] Add fade-in animation on widget spawn
- [ ] Simplify `js/widgets.js` to single unified view
- [ ] Update modal CSS for minimal aesthetic
- [ ] Test widget persistence after app close/restart
- [ ] Test widget position restoration across system restarts
- [ ] Add debounce for position/size updates to prevent excessive file writes
- [ ] Test multi-widget scenarios (2, 3, 4+ widgets simultaneously)
- [ ] Verify widgets restore in correct positions on restart

---

## 🚀 EXPECTED USER EXPERIENCE

**Scenario 1: Pin Widget → Close App → Restart System**
1. User pins a 1:1 Analog widget at (100, 200)
2. Closes Facet Clock app
3. Restarts Windows
4. Launches Facet Clock
5. ✅ Widget appears at (100, 200) automatically
6. ✅ Main app loads in background

**Scenario 2: Multiple Widgets → Customize → Close App**
1. User pins 3 widgets (1:1, 3:2, 2:3)
2. Customizes opacity, clock mode on each
3. Closes Facet Clock
4. Launches Facet Clock again
5. ✅ All 3 widgets appear with saved customizations
6. ✅ Each widget's opacity, mode, position preserved

**Scenario 3: Widget Settings via Customizer**
1. User right-clicks widget (or uses settings modal)
2. Changes "Analog" → "Both" mode
3. Adjusts opacity to 80%
4. ✅ Widget updates live
5. ✅ Settings persist to file storage

---

## 🎨 VISUAL GUIDELINES

- **Colors**: Stick to system theme (Windows 11 light/dark mode)
- **Typography**: Use system font stack only; no web fonts
- **Spacing**: `1rem` = base unit; use multiples for consistency
- **Shadows**: Minimal; blur-based only (no hard shadows)
- **Animations**: Fade, slide, scale only; all ≤ 300ms duration
- **Icons**: Unicode emoji or Material Symbols only
- **Borders**: 1px, subtle opacity (rgba with 0.1-0.3 alpha)

---

## 🔍 TESTING REQUIREMENTS

1. **Persistence Tests:**
   - Pin widget → close app → restart → verify widget exists
   - Modify widget settings → close app → verify settings persist
   - Pin multiple widgets → restart → verify all restore in correct positions

2. **Lifecycle Tests:**
   - Pin widget → close app → main window should NOT control widget lifecycle
   - Multiple widgets → close one widget via customizer → verify others unaffected
   - Restart system → widgets auto-launch even if app is not running

3. **UI/UX Tests:**
   - Widgets fade in smoothly on spawn
   - Hover cursor changes to "grab"
   - Settings modal is minimal and responsive
   - No flicker or visual glitches during customization

4. **Edge Cases:**
   - Corrupted `clock-widgets.json` → gracefully fallback
   - No widgets pinned → show empty state with "Pin a New Widget" button
   - Window resize → clock scales proportionally without distortion