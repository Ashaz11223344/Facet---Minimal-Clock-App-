/**
 * FACET — Interaction, Custom Morphism Dropdowns, Custom Theme Creator & Rule Enforcer
 * Binds custom theme dropdowns, "Customize..." color palette modal with real-time mini live preview,
 * Background FX canvas selector, font switcher, desktop vs website rules, and JSON file saving/loading.
 */

document.addEventListener('DOMContentLoaded', () => {
  const clockContainer = document.getElementById('clock-container');
  const toolbar = document.getElementById('toolbar');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');
  const modeLabel = document.getElementById('mode-label');

  const customStyleSelect = document.getElementById('custom-style-select');
  const customSubvariantSelect = document.getElementById('custom-subvariant-select');
  const customBgFxSelect = document.getElementById('custom-bg-fx-select');
  const customFontSelectCustom = document.getElementById('custom-font-select-custom');

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fsExpandIcon = document.getElementById('fs-expand-icon');
  const fsCompressIcon = document.getElementById('fs-compress-icon');

  const hideUiBtn = document.getElementById('hide-ui-btn');
  const toastContainer = document.getElementById('toast-container');

  const bottomTrigger = document.getElementById('bottom-trigger');
  const triggerPcIcon = document.getElementById('trigger-pc-icon');
  const triggerInfoIcon = document.getElementById('trigger-info-icon');

  const downloadModal = document.getElementById('download-modal');
  const downloadModalClose = document.getElementById('download-modal-close');
  const confirmDownloadBtn = document.getElementById('confirm-download-btn');
  const cancelDownloadBtn = document.getElementById('cancel-download-btn');

  const customColorModal = document.getElementById('custom-color-modal');
  const customModalClose = document.getElementById('custom-modal-close');
  const miniPreviewStage = document.getElementById('mini-preview-stage');
  const palettePersistenceNote = document.getElementById('palette-persistence-note');
  const customBgColor = document.getElementById('custom-bg-color');
  const customBgHex = document.getElementById('custom-bg-hex');
  const customFgColor = document.getElementById('custom-fg-color');
  const customFgHex = document.getElementById('custom-fg-hex');
  const customAccentColor = document.getElementById('custom-accent-color');
  const customAccentHex = document.getElementById('custom-accent-hex');
  const customGlowColor = document.getElementById('custom-glow-color');
  const customGlowHex = document.getElementById('custom-glow-hex');
  const saveCustomColorBtn = document.getElementById('save-custom-color-btn');
  const loadCustomColorBtn = document.getElementById('load-custom-color-btn');
  const resetCustomColorBtn = document.getElementById('reset-custom-color-btn');
  const paletteFileInput = document.getElementById('palette-file-input');

  const infoModal = document.getElementById('info-modal');
  const infoClose = document.getElementById('info-close');

  let idleTimer = null;
  let toastTimer = null;
  let miniPreviewTimer = null;
  const IDLE_TIMEOUT_MS = 3500;

  // Detect Desktop App environment vs Web App environment per Rule 1 & 2 & Palette saving rule
  const isDesktopApp = !!(window.process && window.process.versions && window.process.versions.electron) || window.navigator.userAgent.toLowerCase().includes('electron');

  if (isDesktopApp) {
    if (triggerPcIcon) triggerPcIcon.classList.add('hidden');
    if (triggerInfoIcon) triggerInfoIcon.classList.remove('hidden');
    if (bottomTrigger) {
      bottomTrigger.setAttribute('title', 'Shortcuts (?)');
      bottomTrigger.setAttribute('aria-label', 'Keyboard Shortcuts');
    }
    if (palettePersistenceNote) {
      palettePersistenceNote.textContent = 'Save & load custom palette JSON files directly on your computer.';
    }
    if (saveCustomColorBtn) saveCustomColorBtn.textContent = 'Save Palette File';
    if (loadCustomColorBtn) loadCustomColorBtn.classList.remove('hidden');
  } else {
    if (triggerPcIcon) triggerPcIcon.classList.remove('hidden');
    if (triggerInfoIcon) triggerInfoIcon.classList.add('hidden');
    if (bottomTrigger) {
      bottomTrigger.setAttribute('title', 'Download for PC');
      bottomTrigger.setAttribute('aria-label', 'Download PC Application');
    }
    if (palettePersistenceNote) {
      palettePersistenceNote.textContent = 'Custom colors apply to active session. Closing website will reset palette.';
    }
    if (saveCustomColorBtn) saveCustomColorBtn.textContent = 'Apply Custom Palette';
    if (loadCustomColorBtn) loadCustomColorBtn.classList.add('hidden');
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATION SYSTEM
  // --------------------------------------------------------------------------
  function showToast(message) {
    if (!toastContainer) return;

    if (toastTimer) clearTimeout(toastTimer);

    toastContainer.innerHTML = `
      <span class="toast-icon">ℹ</span>
      <span>${message}</span>
    `;

    toastContainer.classList.remove('hidden', 'toast-hide');

    toastTimer = setTimeout(() => {
      toastContainer.classList.add('toast-hide');
      setTimeout(() => {
        toastContainer.classList.add('hidden');
      }, 400);
    }, 3500);
  }

  // --------------------------------------------------------------------------
  // HIDE UI CONTROLS & RESTORE LOGIC
  // --------------------------------------------------------------------------
  function hideUI() {
    toolbar.classList.add('manual-hidden');
    if (bottomTrigger) bottomTrigger.classList.add('manual-hidden');
    closeAllCustomSelects();
    showToast('UI hidden. Press Esc to restore controls');
  }

  function restoreUI() {
    toolbar.classList.remove('manual-hidden', 'idle-hidden');
    if (bottomTrigger) bottomTrigger.classList.remove('manual-hidden', 'idle-hidden');
    resetIdleTimer();
  }

  if (hideUiBtn) {
    hideUiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideUI();
    });
  }

  // --------------------------------------------------------------------------
  // INACTIVITY AUTO-HIDE CONTROLS
  // --------------------------------------------------------------------------
  function resetIdleTimer() {
    if (toolbar.classList.contains('manual-hidden')) return;

    toolbar.classList.remove('idle-hidden');
    if (bottomTrigger) bottomTrigger.classList.remove('idle-hidden');

    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      const modalOpen = (infoModal && !infoModal.classList.contains('hidden')) ||
                        (downloadModal && !downloadModal.classList.contains('hidden')) ||
                        (customColorModal && !customColorModal.classList.contains('hidden'));
      if (isFullscreenActive() || modalOpen) {
        toolbar.classList.add('idle-hidden');
        if (bottomTrigger) bottomTrigger.classList.add('idle-hidden');
        closeAllCustomSelects();
      }
    }, IDLE_TIMEOUT_MS);
  }

  window.addEventListener('mousemove', resetIdleTimer);
  window.addEventListener('touchstart', resetIdleTimer);
  window.addEventListener('scroll', resetIdleTimer);

  // --------------------------------------------------------------------------
  // CUSTOM SELECT DROPDOWN LOGIC
  // --------------------------------------------------------------------------
  function closeAllCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(cs => {
      cs.classList.remove('open');
      const menu = cs.querySelector('.cs-options');
      if (menu) menu.classList.add('hidden');
    });
  }

  function setupCustomSelect(containerEl, onSelectCallback) {
    if (!containerEl) return;
    const trigger = containerEl.querySelector('.cs-trigger');
    const optionsMenu = containerEl.querySelector('.cs-options');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = containerEl.classList.contains('open');
      closeAllCustomSelects();
      if (!isOpen) {
        containerEl.classList.add('open');
        optionsMenu.classList.remove('hidden');
      }
    });

    optionsMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.cs-option');
      if (item) {
        e.stopPropagation();
        if (item.dataset.action === 'customize') {
          openCustomColorModal();
        } else {
          const val = item.dataset.value;
          const parsedVal = isNaN(val) ? val : parseInt(val, 10);
          onSelectCallback(parsedVal, item);
        }
        closeAllCustomSelects();
      }
    });
  }

  document.addEventListener('click', () => {
    closeAllCustomSelects();
  });

  // --------------------------------------------------------------------------
  // DYNAMIC TOOLBAR & MORPHISM DATASET SYNC
  // --------------------------------------------------------------------------
  function syncToolbarUI() {
    const state = window.ClockEngine.getState();
    const catalog = window.THEME_CATALOG[state.mode];
    const currentVariation = catalog[state.variationIndex % catalog.length];

    let morphismType = 'classic';
    if (currentVariation.id.includes('7') || currentVariation.name.toLowerCase().includes('glass')) morphismType = 'glass';
    else if (currentVariation.id.includes('8') || currentVariation.name.toLowerCase().includes('clay')) morphismType = 'clay';
    else if (currentVariation.id.includes('9') || currentVariation.name.toLowerCase().includes('neumorphism')) morphismType = 'neumorphism';
    else if (currentVariation.id.includes('10') || currentVariation.name.toLowerCase().includes('brutalism')) morphismType = 'brutalism';
    
    document.body.dataset.morphism = morphismType;

    if (modeLabel) {
      modeLabel.textContent = state.mode === 'analog' ? 'Analog' : 'Digital';
    }

    if (customStyleSelect) {
      const triggerVal = customStyleSelect.querySelector('.cs-value');
      const optionsMenu = customStyleSelect.querySelector('.cs-options');
      if (triggerVal) triggerVal.textContent = currentVariation.name;

      if (optionsMenu) {
        optionsMenu.innerHTML = '';
        catalog.forEach((item, idx) => {
          const li = document.createElement('li');
          li.className = `cs-option ${idx === state.variationIndex ? 'selected' : ''}`;
          li.dataset.value = idx;
          li.textContent = item.name;
          optionsMenu.appendChild(li);
        });
      }
    }

    if (customSubvariantSelect) {
      const triggerVal = customSubvariantSelect.querySelector('.cs-value');
      const optionsMenu = customSubvariantSelect.querySelector('.cs-options');

      const subVariants = currentVariation.subVariants || [
        { name: 'Light' },
        { name: 'Dark' },
        { name: state.mode === 'analog' ? 'Sepia' : 'Amber CRT' }
      ];

      const activeSub = state.customPalette
        ? { name: 'Custom Palette' }
        : subVariants[state.subVariantIndex % subVariants.length] || { name: 'Palette' };

      if (triggerVal) triggerVal.textContent = activeSub.name;

      if (optionsMenu) {
        optionsMenu.innerHTML = '';
        subVariants.forEach((sub, idx) => {
          const li = document.createElement('li');
          li.className = `cs-option ${!state.customPalette && idx === state.subVariantIndex ? 'selected' : ''}`;
          li.dataset.value = idx;
          li.textContent = sub.name;
          optionsMenu.appendChild(li);
        });

        // Add Customize... Special Option with SVG Icon
        const custLi = document.createElement('li');
        custLi.className = `cs-option customize-opt ${state.customPalette ? 'selected' : ''}`;
        custLi.dataset.action = 'customize';
        custLi.innerHTML = `
          <svg class="cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Customize Colors...</span>
        `;
        optionsMenu.appendChild(custLi);
      }
    }

    // Sync Background FX and Font custom dropdown triggers
    if (customBgFxSelect) {
      const triggerVal = customBgFxSelect.querySelector('.cs-value');
      const fxMap = { mesh: 'Gradient Mesh', aurora: 'Interactive Aurora', starfield: 'Starfield Particles', off: 'Off (Solid)' };
      if (triggerVal) triggerVal.textContent = fxMap[state.bgFx] || 'Gradient Mesh';

      customBgFxSelect.querySelectorAll('.cs-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === state.bgFx);
      });
    }

    if (customFontSelectCustom) {
      const triggerVal = customFontSelectCustom.querySelector('.cs-value');
      const fontMap = { sans: 'Sans-Serif (Inter)', mono: 'Monospace (Space Mono)', clay: 'Puffy 3D (Nunito)', retro: 'Retro 7-Segment (VT323)' };
      if (triggerVal) triggerVal.textContent = fontMap[state.fontFamily] || 'Sans-Serif (Inter)';

      customFontSelectCustom.querySelectorAll('.cs-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === state.fontFamily);
      });
    }

    updateMiniPreview();
  }

  window.ClockEngine.onStateChange(syncToolbarUI);

  setupCustomSelect(customStyleSelect, (val) => {
    window.ClockEngine.setVariationIndex(val);
  });

  setupCustomSelect(customSubvariantSelect, (val) => {
    window.ClockEngine.setSubVariantIndex(val);
  });

  setupCustomSelect(customBgFxSelect, (val) => {
    window.ClockEngine.setBgFx(val);
  });

  setupCustomSelect(customFontSelectCustom, (val) => {
    window.ClockEngine.setFontFamily(val);
  });

  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.ClockEngine.toggleMode();
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen();
    });
  }

  // --------------------------------------------------------------------------
  // FULLSCREEN HANDLER
  // --------------------------------------------------------------------------
  function isFullscreenActive() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function toggleFullscreen() {
    const docEl = document.documentElement;
    const isFS = isFullscreenActive();

    if (!isFS) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.warn(err));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.warn(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
    document.addEventListener(evt, () => {
      const isFS = isFullscreenActive();
      if (isFS) {
        fsExpandIcon.classList.add('hidden');
        fsCompressIcon.classList.remove('hidden');
        toolbar.classList.add('idle-hidden');
        if (bottomTrigger) bottomTrigger.classList.add('idle-hidden');
      } else {
        fsExpandIcon.classList.remove('hidden');
        fsCompressIcon.classList.add('hidden');
        toolbar.classList.remove('idle-hidden');
        if (bottomTrigger) bottomTrigger.classList.remove('idle-hidden');
      }
    });
  });

  // --------------------------------------------------------------------------
  // CUSTOM COLOR PALETTE CREATOR & REAL-TIME MINI LIVE PREVIEW
  // --------------------------------------------------------------------------
  function updateMiniPreview() {
    if (!miniPreviewStage || !customColorModal || customColorModal.classList.contains('hidden')) return;

    const now = new Date();
    const state = window.ClockEngine.getState();
    const catalog = window.THEME_CATALOG[state.mode];
    const variation = catalog[state.variationIndex % catalog.length];
    const palette = window.ClockEngine.getActivePalette();

    if (state.mode === 'analog') {
      miniPreviewStage.innerHTML = window.ClockRenderers.renderAnalog(now, variation, palette);
    } else {
      miniPreviewStage.innerHTML = window.ClockRenderers.renderDigital(now, variation, palette);
    }
  }

  function openCustomColorModal() {
    const palette = window.ClockEngine.getActivePalette();
    const state = window.ClockEngine.getState();

    function normalizeHex(colorStr) {
      if (!colorStr || colorStr === 'transparent') return '#000000';
      if (colorStr.startsWith('#')) return colorStr.substring(0, 7);
      return '#3b82f6';
    }

    if (customBgColor) customBgColor.value = normalizeHex(palette.bg);
    if (customBgHex) customBgHex.value = normalizeHex(palette.bg);
    if (customFgColor) customFgColor.value = normalizeHex(palette.fg);
    if (customFgHex) customFgHex.value = normalizeHex(palette.fg);
    if (customAccentColor) customAccentColor.value = normalizeHex(palette.accent || palette.fg);
    if (customAccentHex) customAccentHex.value = normalizeHex(palette.accent || palette.fg);
    if (customGlowColor) customGlowColor.value = normalizeHex(palette.glow);
    if (customGlowHex) customGlowHex.value = normalizeHex(palette.glow);

    if (customColorModal) {
      customColorModal.classList.remove('hidden');
      customColorModal.setAttribute('aria-hidden', 'false');
    }

    updateMiniPreview();
    if (miniPreviewTimer) clearInterval(miniPreviewTimer);
    miniPreviewTimer = setInterval(updateMiniPreview, 1000);
  }

  function closeCustomColorModal() {
    if (customColorModal) {
      customColorModal.classList.add('hidden');
      customColorModal.setAttribute('aria-hidden', 'true');
    }
    if (miniPreviewTimer) {
      clearInterval(miniPreviewTimer);
      miniPreviewTimer = null;
    }
  }

  function applyLiveColorPreview() {
    const customPalette = {
      bg: customBgColor.value,
      fg: customFgColor.value,
      accent: customAccentColor.value,
      glow: customGlowColor.value
    };
    window.ClockEngine.setCustomPalette(customPalette);
    updateMiniPreview();
  }

  function syncColorPickers(pickerEl, hexEl) {
    pickerEl.addEventListener('input', () => {
      hexEl.value = pickerEl.value;
      applyLiveColorPreview();
    });
    hexEl.addEventListener('input', () => {
      if (/^#[0-9A-F]{6}$/i.test(hexEl.value)) {
        pickerEl.value = hexEl.value;
        applyLiveColorPreview();
      }
    });
  }

  if (customBgColor && customBgHex) syncColorPickers(customBgColor, customBgHex);
  if (customFgColor && customFgHex) syncColorPickers(customFgColor, customFgHex);
  if (customAccentColor && customAccentHex) syncColorPickers(customAccentColor, customAccentHex);
  if (customGlowColor && customGlowHex) syncColorPickers(customGlowColor, customGlowHex);

  if (saveCustomColorBtn) {
    saveCustomColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyLiveColorPreview();

      if (isDesktopApp) {
        // Desktop App: Export JSON Palette File
        const state = window.ClockEngine.getState();
        const paletteData = {
          facet: 'palette',
          version: '1.0',
          bg: customBgColor.value,
          fg: customFgColor.value,
          accent: customAccentColor.value,
          glow: customGlowColor.value,
          bgFx: state.bgFx,
          fontFamily: state.fontFamily
        };
        const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facet-palette-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        closeCustomColorModal();
        showToast('Saved custom palette JSON file!');
      } else {
        closeCustomColorModal();
        showToast('Custom palette applied for active session!');
      }
    });
  }

  if (loadCustomColorBtn && paletteFileInput) {
    loadCustomColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      paletteFileInput.click();
    });

    paletteFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.bg && data.fg) {
            if (customBgColor) { customBgColor.value = data.bg; customBgHex.value = data.bg; }
            if (customFgColor) { customFgColor.value = data.fg; customFgHex.value = data.fg; }
            if (customAccentColor) { customAccentColor.value = data.accent || data.fg; customAccentHex.value = data.accent || data.fg; }
            if (customGlowColor) { customGlowColor.value = data.glow || '#000000'; customGlowHex.value = data.glow || '#000000'; }

            if (data.bgFx) window.ClockEngine.setBgFx(data.bgFx);
            if (data.fontFamily) window.ClockEngine.setFontFamily(data.fontFamily);

            applyLiveColorPreview();
            closeCustomColorModal();
            showToast('Loaded custom palette file successfully!');
          } else {
            showToast('Invalid palette JSON file format.');
          }
        } catch (err) {
          showToast('Failed to parse JSON palette file.');
        }
        paletteFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  if (resetCustomColorBtn) {
    resetCustomColorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.ClockEngine.resetCustomPalette();
      openCustomColorModal();
      showToast('Reset to default preset palette.');
    });
  }

  if (customModalClose) customModalClose.addEventListener('click', closeCustomColorModal);
  if (customColorModal) {
    customColorModal.addEventListener('click', (e) => {
      if (e.target === customColorModal) closeCustomColorModal();
    });
  }

  // --------------------------------------------------------------------------
  // PC APPLICATION DOWNLOAD LOGIC (Web vs Desktop Rule Enforcer)
  // --------------------------------------------------------------------------
  function openDownloadModal() {
    if (downloadModal) {
      downloadModal.classList.remove('hidden');
      downloadModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeDownloadModal() {
    if (downloadModal) {
      downloadModal.classList.add('hidden');
      downloadModal.setAttribute('aria-hidden', 'true');
    }
  }

  function executePcDownload() {
    closeDownloadModal();
    const link = document.createElement('a');
    link.href = 'roots/assets/bin/Facet Clock Setup 1.0.0.exe';
    link.download = 'Facet Clock Setup 1.0.0.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloading Facet Clock Setup for PC...');
  }

  if (bottomTrigger) {
    bottomTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isDesktopApp) {
        toggleInfoModal();
      } else {
        openDownloadModal();
      }
    });
  }

  if (confirmDownloadBtn) {
    confirmDownloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      executePcDownload();
    });
  }

  if (cancelDownloadBtn) cancelDownloadBtn.addEventListener('click', closeDownloadModal);
  if (downloadModalClose) downloadModalClose.addEventListener('click', closeDownloadModal);
  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) closeDownloadModal();
    });
  }

  // --------------------------------------------------------------------------
  // STAGE CLICK & DOUBLE CLICK
  // --------------------------------------------------------------------------
  let clickTimeout = null;

  clockContainer.addEventListener('click', (e) => {
    const modalOpen = (infoModal && !infoModal.classList.contains('hidden')) ||
                      (downloadModal && !downloadModal.classList.contains('hidden')) ||
                      (customColorModal && !customColorModal.classList.contains('hidden'));
    if (modalOpen) return;

    if (clickTimeout === null) {
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
        window.ClockEngine.toggleMode();
      }, 250);
    }
  });

  clockContainer.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      clickTimeout = null;
    }
    toggleFullscreen();
  });

  // --------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS & ESCAPE UI RESTORATION
  // --------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        window.ClockEngine.cycleVariation(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        window.ClockEngine.cycleVariation(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        window.ClockEngine.cycleSubVariant(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        window.ClockEngine.cycleSubVariant(1);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        window.ClockEngine.resetState();
        break;
      case '?':
      case '/':
        e.preventDefault();
        toggleInfoModal();
        break;
      case 'Escape':
        restoreUI();
        closeInfoModal();
        closeDownloadModal();
        closeCustomColorModal();
        closeAllCustomSelects();
        break;
    }
  });

  // --------------------------------------------------------------------------
  // TOUCH SWIPE GESTURES
  // --------------------------------------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  clockContainer.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  clockContainer.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const elapsedTime = Date.now() - touchStartTime;

    const minDistance = 40;
    const maxTime = 500;

    if (elapsedTime <= maxTime) {
      if (Math.abs(deltaX) >= minDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          window.ClockEngine.cycleVariation(-1);
        } else {
          window.ClockEngine.cycleVariation(1);
        }
      } else if (Math.abs(deltaY) >= minDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          window.ClockEngine.cycleSubVariant(1);
        } else {
          window.ClockEngine.cycleSubVariant(-1);
        }
      }
    }
  }, { passive: true });

  // --------------------------------------------------------------------------
  // INFO MODAL CONTROLS
  // --------------------------------------------------------------------------
  function toggleInfoModal() {
    if (infoModal.classList.contains('hidden')) {
      openInfoModal();
    } else {
      closeInfoModal();
    }
  }

  function openInfoModal() {
    if (infoModal) {
      infoModal.classList.remove('hidden');
      infoModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeInfoModal() {
    if (infoModal) {
      infoModal.classList.add('hidden');
      infoModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (infoClose) infoClose.addEventListener('click', closeInfoModal);
  if (infoModal) {
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) closeInfoModal();
    });
  }

  syncToolbarUI();
  resetIdleTimer();
});
