/**
 * Facet Clock - Windows Desktop Widgets Manager (Desktop Application ONLY)
 */

(function () {
  'use strict';

  class WidgetManager {
    constructor() {
      this.isDesktop = !!(window.electronAPI && window.electronAPI.isDesktop);
      this.selectedRatio = '1:1';
      this.selectedWidth = 300;
      this.selectedHeight = 300;
      this.activeCustomizingId = null;

      // Storage keys
      this.PINNED_KEY = 'clock_pinned_widgets';
      this.SETTINGS_KEY = 'clock_widget_settings';
      this.FAVORITES_KEY = 'clock_widget_favorites';

      this.init();
    }

    init() {
      this.cacheElements();
      this.bindEvents();
      this.updatePinnedBadge();
    }

    cacheElements() {
      // Header button
      this.btnManager = document.getElementById('widget-manager-btn');

      // Modals
      this.modalManager = document.getElementById('widget-manager-modal');
      this.btnCloseManager = document.getElementById('widget-manager-close');
      this.modalPreview = document.getElementById('widget-preview-modal');
      this.btnClosePreview = document.getElementById('widget-preview-close');
      this.modalCustomizer = document.getElementById('widget-customizer-modal');
      this.btnCloseCustomizer = document.getElementById('widget-customizer-close');

      // Tabs
      this.tabBtns = document.querySelectorAll('.widget-tab-btn');
      this.tabPanels = document.querySelectorAll('.widget-tab-panel');
      this.badgeCount = document.getElementById('pinned-widgets-count');

      // Available Tab Actions
      this.btnPreview = document.getElementById('btn-preview-facet-clock');
      this.btnPinDirect = document.getElementById('btn-pin-facet-clock');

      // Preview Modal Elements
      this.sizePillBtns = document.querySelectorAll('.size-pill-btn');
      this.previewBox = document.getElementById('widget-preview-box');
      this.previewClockRender = document.getElementById('preview-clock-render');
      this.btnPreviewBack = document.getElementById('btn-preview-back');
      this.btnConfirmPin = document.getElementById('btn-confirm-pin');

      // My Widgets List
      this.pinnedListContainer = document.getElementById('pinned-widgets-list');

      // Customizer Controls
      this.custMode = document.getElementById('w-cust-mode');
      this.custSeconds = document.getElementById('w-cust-seconds');
      this.custFormat = document.getElementById('w-cust-format');
      this.custPalette = document.getElementById('w-cust-palette');
      this.custOpacity = document.getElementById('w-cust-opacity');
      this.opacityValText = document.getElementById('w-opacity-val');
      this.custSize = document.getElementById('w-cust-size');
      this.custLockPos = document.getElementById('w-cust-lockpos');
      this.btnCustReset = document.getElementById('btn-cust-reset');
      this.btnCustApply = document.getElementById('btn-cust-apply');
    }

    bindEvents() {
      if (this.btnManager) {
        this.btnManager.addEventListener('click', () => this.openManagerModal());
      }

      if (this.btnCloseManager) {
        this.btnCloseManager.addEventListener('click', () => this.closeManagerModal());
      }

      if (this.btnClosePreview) {
        this.btnClosePreview.addEventListener('click', () => this.closePreviewModal());
      }

      if (this.btnCloseCustomizer) {
        this.btnCloseCustomizer.addEventListener('click', () => this.closeCustomizerModal());
      }

      // Tab Switching
      this.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tabName = btn.getAttribute('data-tab');
          this.switchTab(tabName);
        });
      });

      // Actions from Available Tab
      if (this.btnPreview) {
        this.btnPreview.addEventListener('click', () => this.openPreviewModal());
      }

      if (this.btnPinDirect) {
        this.btnPinDirect.addEventListener('click', () => this.pinWidgetFromPreset());
      }

      // Size Pill Selector in Preview Modal
      this.sizePillBtns.forEach(pill => {
        pill.addEventListener('click', () => {
          this.sizePillBtns.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');

          this.selectedRatio = pill.getAttribute('data-ratio');
          this.selectedWidth = parseInt(pill.getAttribute('data-w'), 10);
          this.selectedHeight = parseInt(pill.getAttribute('data-h'), 10);

          this.updatePreviewAspectStyle();
        });
      });

      if (this.btnPreviewBack) {
        this.btnPreviewBack.addEventListener('click', () => {
          this.closePreviewModal();
          this.openManagerModal();
        });
      }

      if (this.btnConfirmPin) {
        this.btnConfirmPin.addEventListener('click', () => this.pinWidgetFromPreset());
      }

      // Customizer slider text sync
      if (this.custOpacity && this.opacityValText) {
        this.custOpacity.addEventListener('input', (e) => {
          this.opacityValText.textContent = `${e.target.value}%`;
        });
      }

      if (this.btnCustApply) {
        this.btnCustApply.addEventListener('click', () => this.saveCustomizerChanges());
      }

      if (this.btnCustReset) {
        this.btnCustReset.addEventListener('click', () => this.resetCustomizerDefaults());
      }
    }

    openManagerModal() {
      if (this.modalManager) {
        this.modalManager.classList.remove('hidden');
        this.modalManager.setAttribute('aria-hidden', 'false');
        this.switchTab('available');
      }
    }

    closeManagerModal() {
      if (this.modalManager) {
        this.modalManager.classList.add('hidden');
        this.modalManager.setAttribute('aria-hidden', 'true');
      }
    }

    switchTab(tabName) {
      this.tabBtns.forEach(btn => {
        const isMatch = btn.getAttribute('data-tab') === tabName;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      this.tabPanels.forEach(panel => {
        const isMatch = panel.id === `tab-${tabName}`;
        panel.classList.toggle('hidden', !isMatch);
        panel.classList.toggle('active', isMatch);
      });

      if (tabName === 'my-widgets') {
        this.renderMyWidgetsList();
      }
    }

    openPreviewModal() {
      this.closeManagerModal();
      if (this.modalPreview) {
        this.modalPreview.classList.remove('hidden');
        this.modalPreview.setAttribute('aria-hidden', 'false');
        this.updatePreviewAspectStyle();
        this.renderLiveClockPreview();
      }
    }

    closePreviewModal() {
      if (this.modalPreview) {
        this.modalPreview.classList.add('hidden');
        this.modalPreview.setAttribute('aria-hidden', 'true');
      }
    }

    updatePreviewAspectStyle() {
      if (!this.previewBox) return;
      this.previewBox.className = `widget-preview-box size-${this.selectedRatio.replace(':', '-')}`;
      this.previewBox.style.width = `${this.selectedWidth}px`;
      this.previewBox.style.height = `${this.selectedHeight}px`;
    }

    renderLiveClockPreview() {
      if (!this.previewClockRender) return;
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');

      this.previewClockRender.innerHTML = `
        <div class="preview-clock-display">
          <div class="preview-analog-face">
            <svg viewBox="0 0 100 100" class="mini-clock-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              <line x1="50" y1="50" x2="50" y2="25" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <line x1="50" y1="50" x2="70" y2="50" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="preview-digital-text">${hrs}:${mins}:${secs}</div>
        </div>
      `;
    }

    getPinnedWidgets() {
      try {
        const raw = localStorage.getItem(this.PINNED_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    savePinnedWidgets(list) {
      try {
        localStorage.setItem(this.PINNED_KEY, JSON.stringify(list));
        this.updatePinnedBadge();
      } catch (e) {
        console.error('Failed saving pinned widgets', e);
      }
    }

    updatePinnedBadge() {
      const list = this.getPinnedWidgets();
      if (this.badgeCount) {
        this.badgeCount.textContent = list.length;
      }
    }

    pinWidgetFromPreset() {
      const widgetId = `facet-clock-${Date.now()}`;
      const newWidget = {
        id: widgetId,
        type: 'facet-clock',
        pinned: true,
        pinnedAt: Date.now(),
        width: this.selectedWidth,
        height: this.selectedHeight,
        customization: {
          size: this.selectedRatio,
          clockMode: 'analog',
          showSeconds: true,
          displayFormat: '24-hour',
          palette: 'default',
          opacity: 1.0,
          locked: false
        }
      };

      const pinned = this.getPinnedWidgets();
      pinned.push(newWidget);
      this.savePinnedWidgets(pinned);

      // Call Electron IPC to open floating frameless widget window
      if (window.electronAPI && window.electronAPI.pinWidget) {
        window.electronAPI.pinWidget(newWidget);
      }

      this.closePreviewModal();
      this.openManagerModal();
      this.switchTab('my-widgets');
    }

    renderMyWidgetsList() {
      if (!this.pinnedListContainer) return;
      const list = this.getPinnedWidgets();

      if (list.length === 0) {
        this.pinnedListContainer.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">📌</span>
            <p>No widgets pinned yet. Select a widget from Available Widgets to pin to your desktop.</p>
          </div>
        `;
        return;
      }

      let html = '';
      list.forEach(w => {
        html += `
          <div class="pinned-widget-item" data-id="${w.id}">
            <div class="pinned-item-info">
              <span class="pinned-icon">⏰</span>
              <div class="pinned-details">
                <strong class="pinned-title">Facet Clock</strong>
                <span class="pinned-meta">Size: ${w.customization.size} | Mode: ${w.customization.clockMode}</span>
              </div>
            </div>
            <div class="pinned-actions">
              <button class="action-btn secondary-btn btn-cust-item" data-id="${w.id}">Settings</button>
              <button class="action-btn danger-btn btn-remove-item" data-id="${w.id}">Remove</button>
            </div>
          </div>
        `;
      });

      this.pinnedListContainer.innerHTML = html;

      // Event listeners for Settings & Remove inside list
      this.pinnedListContainer.querySelectorAll('.btn-cust-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.openCustomizerModal(id);
        });
      });

      this.pinnedListContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.removeWidget(id);
        });
      });
    }

    openCustomizerModal(widgetId) {
      this.activeCustomizingId = widgetId;
      const list = this.getPinnedWidgets();
      const target = list.find(w => w.id === widgetId);
      if (!target) return;

      this.closeManagerModal();

      // Populate customizer controls
      const cust = target.customization;
      if (this.custMode) this.custMode.value = cust.clockMode || 'analog';
      if (this.custSeconds) this.custSeconds.checked = cust.showSeconds !== false;
      if (this.custFormat) this.custFormat.value = cust.displayFormat || '24-hour';
      if (this.custOpacity) {
        const opPct = Math.round((cust.opacity || 1.0) * 100);
        this.custOpacity.value = opPct;
        if (this.opacityValText) this.opacityValText.textContent = `${opPct}%`;
      }
      if (this.custSize) this.custSize.value = cust.size || '1:1';
      if (this.custLockPos) this.custLockPos.checked = !!cust.locked;

      // Populate Palette dropdown
      this.populatePaletteDropdown(cust.palette);

      if (this.modalCustomizer) {
        this.modalCustomizer.classList.remove('hidden');
        this.modalCustomizer.setAttribute('aria-hidden', 'false');
      }
    }

    populatePaletteDropdown(selectedKey) {
      if (!this.custPalette) return;
      let options = `<option value="default">Default Active Theme</option>`;

      if (window.FacetThemes && Array.isArray(window.FacetThemes.palettes)) {
        window.FacetThemes.palettes.forEach(p => {
          const isSel = p.id === selectedKey ? 'selected' : '';
          options += `<option value="${p.id}" ${isSel}>${p.name}</option>`;
        });
      }
      this.custPalette.innerHTML = options;
    }

    closeCustomizerModal() {
      if (this.modalCustomizer) {
        this.modalCustomizer.classList.add('hidden');
        this.modalCustomizer.setAttribute('aria-hidden', 'true');
      }
      this.openManagerModal();
      this.switchTab('my-widgets');
    }

    saveCustomizerChanges() {
      if (!this.activeCustomizingId) return;

      const list = this.getPinnedWidgets();
      const idx = list.findIndex(w => w.id === this.activeCustomizingId);
      if (idx === -1) return;

      const newRatio = this.custSize ? this.custSize.value : '1:1';
      let w = 300, h = 300;
      if (newRatio === '3:2') { w = 450; h = 300; }
      else if (newRatio === '2:3') { w = 300; h = 450; }
      else if (newRatio === '16:9') { w = 480; h = 270; }

      const opVal = this.custOpacity ? parseFloat(this.custOpacity.value) / 100 : 1.0;

      list[idx].width = w;
      list[idx].height = h;
      list[idx].customization = {
        size: newRatio,
        clockMode: this.custMode ? this.custMode.value : 'analog',
        showSeconds: this.custSeconds ? this.custSeconds.checked : true,
        displayFormat: this.custFormat ? this.custFormat.value : '24-hour',
        palette: this.custPalette ? this.custPalette.value : 'default',
        opacity: opVal,
        locked: this.custLockPos ? this.custLockPos.checked : false
      };

      this.savePinnedWidgets(list);

      // Send live update to Electron window
      if (window.electronAPI && window.electronAPI.updateWidgetConfig) {
        window.electronAPI.updateWidgetConfig({
          id: this.activeCustomizingId,
          customization: list[idx].customization,
          size: { width: w, height: h }
        });
      }

      this.closeCustomizerModal();
    }

    resetCustomizerDefaults() {
      if (this.custMode) this.custMode.value = 'analog';
      if (this.custSeconds) this.custSeconds.checked = true;
      if (this.custFormat) this.custFormat.value = '24-hour';
      if (this.custOpacity) {
        this.custOpacity.value = 100;
        if (this.opacityValText) this.opacityValText.textContent = '100%';
      }
      if (this.custSize) this.custSize.value = '1:1';
      if (this.custLockPos) this.custLockPos.checked = false;
    }

    removeWidget(id) {
      let list = this.getPinnedWidgets();
      list = list.filter(w => w.id !== id);
      this.savePinnedWidgets(list);

      if (window.electronAPI && window.electronAPI.unpinWidget) {
        window.electronAPI.unpinWidget(id);
      }

      this.renderMyWidgetsList();
    }
  }

  // Initialize Desktop Widget Manager when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    window.facetWidgetManager = new WidgetManager();
  });
})();
