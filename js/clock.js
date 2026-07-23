/**
 * FACET — Core Clock Engine
 * Drives the high-precision 60fps / 1s clock render loop, theme application,
 * mesh background updates, and state change subscriptions.
 */

window.ClockEngine = (function() {
  let currentState = {
    mode: 'analog',          // 'analog' | 'digital'
    variationIndex: 6,       // Default to A7 (Glassmorphism Analog)
    subVariantIndex: 0       // 0, 1, 2
  };

  let animFrameId = null;
  let lastSec = -1;
  let stateChangeCallbacks = [];

  function onStateChange(cb) {
    if (typeof cb === 'function') {
      stateChangeCallbacks.push(cb);
    }
  }

  function notifyStateChange() {
    stateChangeCallbacks.forEach(cb => {
      try { cb(currentState); } catch (e) { console.error('State callback error:', e); }
    });
  }

  function loadSavedState() {
    try {
      const saved = localStorage.getItem('facet_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode && typeof parsed.variationIndex === 'number' && typeof parsed.subVariantIndex === 'number') {
          currentState = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved Facet state:', e);
    }
  }

  function saveCurrentState() {
    try {
      localStorage.setItem('facet_state', JSON.stringify(currentState));
    } catch (e) {
      console.warn('Failed to save Facet state:', e);
    }
  }

  function getActiveVariation() {
    const catalog = window.THEME_CATALOG[currentState.mode];
    return catalog[currentState.variationIndex % catalog.length];
  }

  function getActivePalette() {
    const variation = getActiveVariation();
    if (variation.subVariants && variation.subVariants[currentState.subVariantIndex]) {
      return variation.subVariants[currentState.subVariantIndex];
    }
    const palKeys = ['light', 'dark', currentState.mode === 'analog' ? 'sepia' : 'crt'];
    const key = palKeys[currentState.subVariantIndex] || 'dark';
    return window.THEME_CATALOG.defaultPalettes[key];
  }

  function applyCssTokens() {
    const palette = getActivePalette();
    const variation = getActiveVariation();
    const root = document.documentElement;

    root.style.setProperty('--bg', palette.bg);
    root.style.setProperty('--fg', palette.fg);
    root.style.setProperty('--accent', palette.accent || palette.fg);
    root.style.setProperty('--subtle', palette.subtle || 'rgba(255,255,255,0.4)');
    root.style.setProperty('--card-bg', palette.cardBg || 'rgba(255,255,255,0.1)');
    root.style.setProperty('--card-border', palette.cardBorder || 'rgba(255,255,255,0.2)');
    root.style.setProperty('--shadow-outer-dark', palette.shadowOuterDark || 'rgba(0,0,0,0.5)');
    root.style.setProperty('--shadow-outer-light', palette.shadowOuterLight || 'rgba(255,255,255,0.05)');
    root.style.setProperty('--shadow-inner-dark', palette.shadowInnerDark || 'rgba(0,0,0,0.6)');
    root.style.setProperty('--shadow-inner-light', palette.shadowInnerLight || 'rgba(255,255,255,0.08)');
    root.style.setProperty('--glow-color', palette.glow || 'transparent');

    // Animated Mesh Background
    const bgMesh = document.getElementById('bg-mesh');
    if (bgMesh) {
      if (palette.mesh && palette.mesh !== 'none') {
        root.style.setProperty('--mesh-bg', palette.mesh);
        bgMesh.style.opacity = '0.6';
      } else {
        bgMesh.style.opacity = '0';
      }
    }

    // CRT Scanlines Overlay
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
      if (palette.crt) {
        crtOverlay.classList.remove('hidden');
      } else {
        crtOverlay.classList.add('hidden');
      }
    }

    // Update Theme Badge Text in Info Modal
    const badge = document.getElementById('theme-badge');
    if (badge) {
      badge.textContent = `${variation.name} — ${palette.name}`;
    }
  }

  function renderFrame() {
    const now = new Date();
    const stage = document.getElementById('clock-stage');
    const srTime = document.getElementById('sr-time');

    if (stage) {
      const variation = getActiveVariation();
      const palette = getActivePalette();

      if (currentState.mode === 'analog') {
        stage.innerHTML = window.ClockRenderers.renderAnalog(now, variation, palette);
      } else {
        stage.innerHTML = window.ClockRenderers.renderDigital(now, variation, palette);
      }
    }

    const currentSec = now.getSeconds();
    if (currentSec !== lastSec && srTime) {
      lastSec = currentSec;
      srTime.textContent = now.toLocaleTimeString();
    }

    animFrameId = requestAnimationFrame(renderFrame);
  }

  function start() {
    loadSavedState();
    applyCssTokens();

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderFrame);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(renderFrame);
      }
    });
  }

  // Mutators — Preserving Theme & Sub-variant Selections on Mode Toggle
  function toggleMode() {
    triggerCrossFade(() => {
      currentState.mode = currentState.mode === 'analog' ? 'digital' : 'analog';
      // PRESERVE variationIndex & subVariantIndex!
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setVariationIndex(idx) {
    triggerCrossFade(() => {
      const count = window.THEME_CATALOG[currentState.mode].length;
      currentState.variationIndex = (idx + count) % count;
      // PRESERVE active subVariantIndex!
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setSubVariantIndex(idx) {
    triggerCrossFade(() => {
      currentState.subVariantIndex = (idx + 3) % 3;
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function cycleVariation(direction = 1) {
    setVariationIndex(currentState.variationIndex + direction);
  }

  function cycleSubVariant(direction = 1) {
    setSubVariantIndex(currentState.subVariantIndex + direction);
  }

  function resetState() {
    triggerCrossFade(() => {
      currentState = { mode: 'analog', variationIndex: 6, subVariantIndex: 0 };
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setDirectState(mode, variationIndex, subVariantIndex) {
    triggerCrossFade(() => {
      currentState = { mode, variationIndex, subVariantIndex };
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function triggerCrossFade(callback) {
    const stage = document.getElementById('clock-stage');
    if (stage) {
      stage.classList.add('fade-out');
      setTimeout(() => {
        callback();
        stage.classList.remove('fade-out');
      }, 150);
    } else {
      callback();
    }
  }

  return {
    start,
    toggleMode,
    setVariationIndex,
    setSubVariantIndex,
    cycleVariation,
    cycleSubVariant,
    resetState,
    setDirectState,
    onStateChange,
    getState: () => ({ ...currentState })
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.ClockEngine.start();
});
