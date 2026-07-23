/**
 * FACET — Core Clock Engine with Custom Palette, Background FX Canvas & Font Switching
 * Drives 60fps clock render loop, Background FX engine (Aurora & Starfield Particles),
 * font selection, live color updates, and state change notifications.
 */

window.ClockEngine = (function() {
  let currentState = {
    mode: 'analog',          // 'analog' | 'digital'
    variationIndex: 6,       // Default to A7 (Glassmorphism Analog)
    subVariantIndex: 0,      // 0, 1, 2
    bgFx: 'mesh',            // 'mesh' | 'aurora' | 'starfield' | 'off'
    fontFamily: 'sans',      // 'sans' | 'mono' | 'clay' | 'retro'
    customPalette: null      // { bg, fg, accent, glow }
  };

  let animFrameId = null;
  let fxAnimFrameId = null;
  let lastSec = -1;
  let stateChangeCallbacks = [];

  // Starfield Particles Data
  let stars = [];
  const STAR_COUNT = 65;

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
          currentState = { ...currentState, ...parsed };
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
    if (currentState.customPalette) {
      return {
        name: 'Custom Palette',
        bg: currentState.customPalette.bg,
        fg: currentState.customPalette.fg,
        accent: currentState.customPalette.accent,
        glow: currentState.customPalette.glow,
        cardBg: 'rgba(255,255,255,0.08)',
        cardBorder: 'rgba(255,255,255,0.2)'
      };
    }

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

    // Font Family Selection
    let fontStack = 'var(--font-sans)';
    if (currentState.fontFamily === 'mono') fontStack = 'var(--font-mono)';
    else if (currentState.fontFamily === 'clay') fontStack = 'var(--font-clay)';
    else if (currentState.fontFamily === 'retro') fontStack = 'var(--font-retro)';
    root.style.setProperty('--clock-font', fontStack);

    // Animated Mesh Background
    const bgMesh = document.getElementById('bg-mesh');
    if (bgMesh) {
      if (currentState.bgFx === 'mesh' && palette.mesh && palette.mesh !== 'none') {
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

    // Update Theme Badge Text in Info Modal & Custom Modal
    const badge = document.getElementById('theme-badge');
    if (badge) {
      badge.textContent = `${variation.name} — ${palette.name}`;
    }

    const customNote = document.getElementById('custom-morphism-note');
    if (customNote) {
      customNote.textContent = `Changing colors for ${variation.name}. Design system styling remains active.`;
    }
  }

  // --------------------------------------------------------------------------
  // BACKGROUND FX CANVAS ENGINE (Aurora & Starfield Particles)
  // --------------------------------------------------------------------------
  function initStars(width, height) {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.4 + 0.1
      });
    }
  }

  let auraPhase = 0;

  function renderBgFx() {
    const canvas = document.getElementById('bg-fx-canvas');
    if (!canvas) return;

    if (currentState.bgFx === 'off' || currentState.bgFx === 'mesh') {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fxAnimFrameId = requestAnimationFrame(renderBgFx);
      return;
    }

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas.width, canvas.height);
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const palette = getActivePalette();
    const accent = palette.accent || '#3b82f6';

    if (currentState.bgFx === 'aurora') {
      auraPhase += 0.008;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, accent + '22');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.4 + Math.sin(auraPhase) * 40);
      ctx.bezierCurveTo(
        canvas.width * 0.3, canvas.height * 0.2 + Math.cos(auraPhase * 0.8) * 50,
        canvas.width * 0.7, canvas.height * 0.7 + Math.sin(auraPhase * 1.2) * 50,
        canvas.width, canvas.height * 0.5 + Math.cos(auraPhase) * 40
      );
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
    } else if (currentState.bgFx === 'starfield') {
      ctx.fillStyle = accent;
      stars.forEach(star => {
        star.y -= star.speed;
        if (star.y < 0) star.y = canvas.height;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    }

    fxAnimFrameId = requestAnimationFrame(renderBgFx);
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

    if (fxAnimFrameId) cancelAnimationFrame(fxAnimFrameId);
    fxAnimFrameId = requestAnimationFrame(renderBgFx);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        animFrameId = requestAnimationFrame(renderFrame);
      }
    });
  }

  // Mutators
  function toggleMode() {
    triggerCrossFade(() => {
      currentState.mode = currentState.mode === 'analog' ? 'digital' : 'analog';
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setVariationIndex(idx) {
    triggerCrossFade(() => {
      const count = window.THEME_CATALOG[currentState.mode].length;
      currentState.variationIndex = (idx + count) % count;
      currentState.customPalette = null; // Reset custom colors when switching variations
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setSubVariantIndex(idx) {
    triggerCrossFade(() => {
      currentState.subVariantIndex = (idx + 3) % 3;
      currentState.customPalette = null; // Reset custom colors when switching preset palettes
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setCustomPalette(paletteObj) {
    currentState.customPalette = paletteObj;
    saveCurrentState();
    applyCssTokens();
    notifyStateChange();
  }

  function resetCustomPalette() {
    currentState.customPalette = null;
    saveCurrentState();
    applyCssTokens();
    notifyStateChange();
  }

  function setBgFx(fx) {
    currentState.bgFx = fx;
    saveCurrentState();
    applyCssTokens();
    notifyStateChange();
  }

  function setFontFamily(font) {
    currentState.fontFamily = font;
    saveCurrentState();
    applyCssTokens();
    notifyStateChange();
  }

  function cycleVariation(direction = 1) {
    setVariationIndex(currentState.variationIndex + direction);
  }

  function cycleSubVariant(direction = 1) {
    setSubVariantIndex(currentState.subVariantIndex + direction);
  }

  function resetState() {
    triggerCrossFade(() => {
      currentState = {
        mode: 'analog',
        variationIndex: 6,
        subVariantIndex: 0,
        bgFx: 'mesh',
        fontFamily: 'sans',
        customPalette: null
      };
      saveCurrentState();
      applyCssTokens();
      notifyStateChange();
    });
  }

  function setDirectState(mode, variationIndex, subVariantIndex) {
    triggerCrossFade(() => {
      currentState = { ...currentState, mode, variationIndex, subVariantIndex };
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
    setCustomPalette,
    resetCustomPalette,
    setBgFx,
    setFontFamily,
    cycleVariation,
    cycleSubVariant,
    resetState,
    setDirectState,
    onStateChange,
    getState: () => ({ ...currentState }),
    getActivePalette
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.ClockEngine.start();
});
