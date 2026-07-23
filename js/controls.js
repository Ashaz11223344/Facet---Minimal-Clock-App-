/**
 * FACET — Interaction, Custom Morphism Dropdowns, Toast System & Download PC App Controls
 * Binds custom theme dropdowns, Hide UI button, PC Download trigger, Toast system,
 * vendor-prefixed Fullscreen API, touch gestures, keyboard shortcuts, and auto-hiding UI.
 */

document.addEventListener('DOMContentLoaded', () => {
  const clockContainer = document.getElementById('clock-container');
  const toolbar = document.getElementById('toolbar');
  const modeToggleBtn = document.getElementById('mode-toggle-btn');
  const modeLabel = document.getElementById('mode-label');

  const customStyleSelect = document.getElementById('custom-style-select');
  const customSubvariantSelect = document.getElementById('custom-subvariant-select');

  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const fsExpandIcon = document.getElementById('fs-expand-icon');
  const fsCompressIcon = document.getElementById('fs-compress-icon');

  const hideUiBtn = document.getElementById('hide-ui-btn');
  const toastContainer = document.getElementById('toast-container');

  const downloadTrigger = document.getElementById('download-trigger');
  const downloadModal = document.getElementById('download-modal');
  const downloadModalClose = document.getElementById('download-modal-close');
  const confirmDownloadBtn = document.getElementById('confirm-download-btn');
  const cancelDownloadBtn = document.getElementById('cancel-download-btn');

  const infoModal = document.getElementById('info-modal');
  const infoClose = document.getElementById('info-close');

  let idleTimer = null;
  let toastTimer = null;
  const IDLE_TIMEOUT_MS = 3500;

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
    if (downloadTrigger) downloadTrigger.classList.add('manual-hidden');
    closeAllCustomSelects();
    showToast('UI hidden. Press Esc to restore controls');
  }

  function restoreUI() {
    toolbar.classList.remove('manual-hidden', 'idle-hidden');
    if (downloadTrigger) downloadTrigger.classList.remove('manual-hidden', 'idle-hidden');
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
    // Do not restore if manually hidden by the Hide UI button
    if (toolbar.classList.contains('manual-hidden')) return;

    toolbar.classList.remove('idle-hidden');
    if (downloadTrigger) downloadTrigger.classList.remove('idle-hidden');

    if (idleTimer) clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      const modalOpen = (infoModal && !infoModal.classList.contains('hidden')) || (downloadModal && !downloadModal.classList.contains('hidden'));
      if (isFullscreenActive() || modalOpen) {
        toolbar.classList.add('idle-hidden');
        if (downloadTrigger) downloadTrigger.classList.add('idle-hidden');
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
        const val = parseInt(item.dataset.value, 10);
        onSelectCallback(val);
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

      const activeSub = subVariants[state.subVariantIndex % subVariants.length] || { name: 'Palette' };
      if (triggerVal) triggerVal.textContent = activeSub.name;

      if (optionsMenu) {
        optionsMenu.innerHTML = '';
        subVariants.forEach((sub, idx) => {
          const li = document.createElement('li');
          li.className = `cs-option ${idx === state.subVariantIndex ? 'selected' : ''}`;
          li.dataset.value = idx;
          li.textContent = sub.name;
          optionsMenu.appendChild(li);
        });
      }
    }
  }

  window.ClockEngine.onStateChange(syncToolbarUI);

  setupCustomSelect(customStyleSelect, (val) => {
    window.ClockEngine.setVariationIndex(val);
  });

  setupCustomSelect(customSubvariantSelect, (val) => {
    window.ClockEngine.setSubVariantIndex(val);
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
        if (downloadTrigger) downloadTrigger.classList.add('idle-hidden');
      } else {
        fsExpandIcon.classList.remove('hidden');
        fsCompressIcon.classList.add('hidden');
        toolbar.classList.remove('idle-hidden');
        if (downloadTrigger) downloadTrigger.classList.remove('idle-hidden');
      }
    });
  });

  // --------------------------------------------------------------------------
  // PC APPLICATION DOWNLOAD LOGIC
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

  if (downloadTrigger) {
    downloadTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openDownloadModal();
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
    const modalOpen = (infoModal && !infoModal.classList.contains('hidden')) || (downloadModal && !downloadModal.classList.contains('hidden'));
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
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

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
