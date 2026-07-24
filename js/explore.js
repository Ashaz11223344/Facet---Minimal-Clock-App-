/**
 * FACET — Explore Tab Engine & Color Palette Manager (Desktop)
 * Parses .facet color palette data, handles real-time debounced search, category filtering,
 * recents management (top 5), favorites persistence, live analog/digital clock preview modal,
 * and one-click palette application.
 */

window.ExploreEngine = (function () {
  let palettes = [];
  let recents = [];
  let favorites = [];
  let currentAppliedId = null;

  let searchQuery = '';
  let selectedCategory = 'all';
  let activeTab = 'explore'; // 'explore' | 'favorites'

  let activePreviewPalette = null;
  let previewMode = 'analog'; // 'analog' | 'digital'
  let previewTimer = null;

  let searchDebounceTimer = null;

  let customPalettes = [];
  let pendingImportPalette = null;

  const STORAGE_KEYS = {
    CURRENT_PALETTE: 'clock_current_palette',
    RECENTS: 'clock_palette_recents',
    SEARCH_HISTORY: 'clock_palette_search_history',
    FAVORITES: 'clock_favorite_palettes',
    FAVORITES_COUNT: 'clock_favorites_count',
    CUSTOM_PALETTES: 'clock_custom_palettes'
  };

  // --------------------------------------------------------------------------
  // DATA LOADING & INITIALIZATION (.facet format parsing)
  // --------------------------------------------------------------------------
  async function loadFacetData() {
    const candidatePaths = [
      'public/data/palettes.facet',
      'palettes.facet',
      'color-themes.facet',
      'public/data/color-themes.facet'
    ];

    for (const path of candidatePaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.palettes) && data.palettes.length > 0) {
            palettes = data.palettes;
            console.log(`ExploreEngine: Successfully loaded ${palettes.length} palettes from ${path}`);
            return true;
          }
        }
      } catch (err) {
        // try next path
      }
    }

    console.warn('ExploreEngine: Could not fetch external .facet file, initializing default dataset fallback.');
    palettes = generateFallbackPalettes();
    return false;
  }

  function generateFallbackPalettes() {
    return [
      {
        id: 'palette_001_aether_glow',
        name: 'Aether Glow',
        description: 'Ethereal backdrop blur layout with Violet, Fuchsia, and Cyan accents.',
        tags: ['ethereal', 'glassmorphic', 'violet', 'fuchsia', 'cyan'],
        colors: { primary: '#8b5cf6', secondary: '#d946ef', accent: '#06b6d4', background: '#090514', surface: '#160e2a', tertiary: '#160e2a' },
        hexCodes: ['#8b5cf6', '#d946ef', '#06b6d4', '#090514', '#160e2a'],
        rgbCodes: ['rgb(139, 92, 246)', 'rgb(217, 70, 239)', 'rgb(6, 182, 212)', 'rgb(9, 5, 20)', 'rgb(22, 14, 42)'],
        createdDate: '2026-07-24',
        usageCount: 1490,
        designer: 'Internal Design Team',
        category: 'ethereal'
      },
      {
        id: 'palette_013_neo_tokyo',
        name: 'Neo Tokyo',
        description: 'High-contrast Cyberpunk aesthetic with Neon Magenta and Cyan Laser.',
        tags: ['cyberpunk', 'dark', 'magenta', 'cyan', 'neon'],
        colors: { primary: '#ff007f', secondary: '#00f0ff', accent: '#9d4edd', background: '#05050d', surface: '#120c1f', tertiary: '#9d4edd' },
        hexCodes: ['#ff007f', '#00f0ff', '#9d4edd', '#05050d', '#120c1f'],
        rgbCodes: ['rgb(255, 0, 127)', 'rgb(0, 240, 255)', 'rgb(157, 78, 221)', 'rgb(5, 5, 13)', 'rgb(18, 12, 31)'],
        createdDate: '2026-07-24',
        usageCount: 1370,
        designer: 'Internal Design Team',
        category: 'cyberpunk'
      }
    ];
  }

  // --------------------------------------------------------------------------
  // LOCAL STORAGE & PERSISTENCE (RECENTS & FAVORITES)
  // --------------------------------------------------------------------------
  function loadStoredState() {
    try {
      // Recents
      const recentsRaw = localStorage.getItem(STORAGE_KEYS.RECENTS);
      if (recentsRaw) {
        recents = JSON.parse(recentsRaw);
        if (!Array.isArray(recents)) recents = [];
      }

      // Favorites
      const favoritesRaw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (favoritesRaw) {
        const parsedFavs = JSON.parse(favoritesRaw);
        if (Array.isArray(parsedFavs)) {
          favorites = parsedFavs;
        } else if (parsedFavs && Array.isArray(parsedFavs.favorites)) {
          favorites = parsedFavs.favorites;
        } else {
          favorites = [];
        }
      }

      // Current applied palette
      const currentRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_PALETTE);
      if (currentRaw) {
        const currentObj = JSON.parse(currentRaw);
        if (currentObj && currentObj.paletteId) {
          currentAppliedId = currentObj.paletteId;
          if (currentObj.palette) {
            applyPaletteToClockEngine(currentObj.palette, false);
          }
        }
      }
      // Custom imported palettes
      const customRaw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PALETTES);
      if (customRaw) {
        const parsedCustom = JSON.parse(customRaw);
        if (Array.isArray(parsedCustom)) {
          customPalettes = parsedCustom;
          // Merge custom palettes into master palettes array
          customPalettes.forEach(cp => {
            if (!palettes.some(p => p.id === cp.id)) {
              palettes.unshift(cp);
            }
          });
        }
      }
    } catch (e) {
      console.warn('ExploreEngine: Error reading localStorage:', e);
    }
    updateFavoritesUI();
    renderCustomPalettesGrid();
  }

  function saveFavoritesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify({
        favorites: favorites,
        updatedAt: Date.now()
      }));
      localStorage.setItem(STORAGE_KEYS.FAVORITES_COUNT, favorites.length.toString());
    } catch (e) {
      console.warn('ExploreEngine: Failed to save favorites to localStorage', e);
    }
    updateFavoritesUI();
  }

  function addRecentPalette(palette) {
    if (!palette || !palette.id) return;
    recents = recents.filter(item => item.id !== palette.id);
    recents.unshift(palette);
    if (recents.length > 5) {
      recents = recents.slice(0, 5);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(recents));
    } catch (e) {
      console.warn('ExploreEngine: Failed to save recents to localStorage', e);
    }
  }

  function saveCurrentAppliedPalette(palette) {
    if (!palette) return;
    currentAppliedId = palette.id;
    try {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_PALETTE,
        JSON.stringify({
          paletteId: palette.id,
          appliedAt: Date.now(),
          palette: palette
        })
      );
    } catch (e) {
      console.warn('ExploreEngine: Failed to save current palette', e);
    }
  }

  // --------------------------------------------------------------------------
  // FAVORITES FEATURE LOGIC
  // --------------------------------------------------------------------------
  function isFavorite(paletteId) {
    return favorites.includes(paletteId);
  }

  function toggleFavorite(paletteId) {
    const palette = palettes.find(p => p.id === paletteId);
    const paletteName = palette ? palette.name : 'Palette';

    if (isFavorite(paletteId)) {
      favorites = favorites.filter(id => id !== paletteId);
      saveFavoritesToStorage();
      renderExploreView();
      if (typeof showToast === 'function') {
        showToast(`Removed "${paletteName}" from Favorites`);
      }
    } else {
      if (favorites.length >= 50) {
        if (typeof showToast === 'function') {
          showToast('Maximum 50 favorites reached. Remove one to add another.');
        }
        return;
      }
      favorites.push(paletteId);
      saveFavoritesToStorage();
      renderExploreView();
      if (typeof showToast === 'function') {
        showToast(`Added "${paletteName}" to Favorites ❤️`);
      }
    }
  }

  function clearAllFavorites() {
    favorites = [];
    saveFavoritesToStorage();
    renderExploreView();
    if (typeof showToast === 'function') {
      showToast('All favorites cleared');
    }
  }

  function updateFavoritesUI() {
    const isDesktopApp = !!(window.process && window.process.versions && window.process.versions.electron) || window.navigator.userAgent.toLowerCase().includes('electron');
    const helpBtn = document.getElementById('explore-help-btn');
    const quickBtn = document.getElementById('explore-favorites-quick-btn');
    const tabNav = document.getElementById('explore-tab-nav');

    if (!isDesktopApp) {
      activeTab = 'explore';
      if (helpBtn) helpBtn.classList.add('hidden');
      if (quickBtn) quickBtn.classList.add('hidden');
      if (tabNav) tabNav.classList.add('hidden');
    } else {
      if (helpBtn) helpBtn.classList.remove('hidden');
      if (quickBtn) quickBtn.classList.remove('hidden');
      if (tabNav) tabNav.classList.remove('hidden');
    }

    const count = favorites.length;

    // Header Quick Favorites Button Badge
    const badgeEl = document.getElementById('explore-favorites-badge');
    if (badgeEl) {
      badgeEl.textContent = count;
      if (count > 0) {
        badgeEl.classList.remove('hidden');
      } else {
        badgeEl.classList.add('hidden');
      }
    }

    if (quickBtn) {
      if (activeTab === 'favorites') {
        quickBtn.classList.add('active');
      } else {
        quickBtn.classList.remove('active');
      }
    }

    // Tab Navigation Buttons
    const favTabBtn = document.getElementById('tab-btn-favorites');
    const expTabBtn = document.getElementById('tab-btn-explore');

    if (favTabBtn) {
      favTabBtn.textContent = `FAVORITES (${count})`;
      if (activeTab === 'favorites') favTabBtn.classList.add('active');
      else favTabBtn.classList.remove('active');
    }

    if (expTabBtn) {
      if (activeTab === 'explore') expTabBtn.classList.add('active');
      else expTabBtn.classList.remove('active');
    }

    // View Containers
    const expView = document.getElementById('explore-view-content');
    const favView = document.getElementById('favorites-view-content');

    if (expView && favView) {
      if (!isDesktopApp || activeTab === 'explore') {
        expView.classList.remove('hidden');
        favView.classList.add('hidden');
      } else {
        expView.classList.add('hidden');
        favView.classList.remove('hidden');
      }
    }
  }

  function setActiveTab(tabName) {
    activeTab = tabName;
    updateFavoritesUI();
    renderExploreView();
  }

  // --------------------------------------------------------------------------
  // APPLY PALETTE TO MAIN CLOCK ENGINE
  // --------------------------------------------------------------------------
  function applyPaletteToClockEngine(palette, showToastMessage = true) {
    if (!palette || !palette.colors) return;

    const bg = palette.colors.background || palette.colors.secondary || '#0b0c0e';
    const fg = palette.colors.primary || '#eaeaea';
    const accent = palette.colors.accent || palette.colors.primary || '#ffd152';
    const glow = palette.colors.tertiary || palette.colors.accent || palette.colors.primary || 'transparent';
    const cardBg = palette.colors.surface || 'rgba(255, 255, 255, 0.08)';

    const customPaletteObj = {
      name: palette.name,
      bg: bg,
      fg: fg,
      accent: accent,
      subtle: fg + '66',
      cardBg: cardBg,
      cardBorder: accent + '33',
      glow: glow,
      mesh: 'none',
      crt: false
    };

    if (window.ClockEngine && typeof window.ClockEngine.setCustomPalette === 'function') {
      window.ClockEngine.setCustomPalette(customPaletteObj);
    }

    saveCurrentAppliedPalette(palette);
    addRecentPalette(palette);
    renderExploreView();

    if (showToastMessage && typeof showToast === 'function') {
      showToast(`Applied palette "${palette.name}"`);
    }
  }

  // --------------------------------------------------------------------------
  // UI RENDERERS (EXPLORE GRID, FAVORITES GRID & CARDS)
  // --------------------------------------------------------------------------
  function renderExploreView() {
    const modal = document.getElementById('explore-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    if (activeTab === 'explore') {
      renderRecentsSection();
      renderMainGrid();
    } else {
      renderFavoritesGrid();
    }
  }

  function renderRecentsSection() {
    const recentsSection = document.getElementById('explore-recents-section');
    const recentsGrid = document.getElementById('explore-recents-grid');

    if (!recentsSection || !recentsGrid) return;

    if (!recents || recents.length === 0) {
      recentsSection.classList.add('hidden');
      return;
    }

    recentsSection.classList.remove('hidden');
    recentsGrid.innerHTML = '';

    recents.forEach(palette => {
      const card = createPaletteCardElement(palette, true);
      recentsGrid.appendChild(card);
    });
  }

  function getFilteredPalettes(paletteList) {
    let result = paletteList || palettes;

    if (activeTab === 'explore' && selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory || (p.tags && p.tags.includes(selectedCategory)));
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => {
        const nameMatch = p.name && p.name.toLowerCase().includes(q);
        const descMatch = p.description && p.description.toLowerCase().includes(q);
        const tagMatch = p.tags && p.tags.some(t => t.toLowerCase().includes(q));
        const catMatch = p.category && p.category.toLowerCase().includes(q);
        return nameMatch || descMatch || tagMatch || catMatch;
      });
    }

    return result;
  }

  function renderMainGrid() {
    const grid = document.getElementById('explore-palettes-grid');
    const emptyState = document.getElementById('explore-empty-state');

    if (!grid) return;

    const filtered = getFilteredPalettes(palettes);
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    filtered.forEach(palette => {
      const card = createPaletteCardElement(palette, false);
      grid.appendChild(card);
    });
  }

  function renderFavoritesGrid() {
    const favGrid = document.getElementById('explore-favorites-grid');
    const emptyState = document.getElementById('favorites-empty-state');
    const actionsRow = document.getElementById('favorites-actions-row');

    if (!favGrid) return;

    const favPalettes = palettes.filter(p => favorites.includes(p.id));
    const filteredFavs = getFilteredPalettes(favPalettes);

    favGrid.innerHTML = '';

    if (favorites.length === 0) {
      favGrid.classList.add('hidden');
      if (actionsRow) actionsRow.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (filteredFavs.length === 0) {
      favGrid.classList.add('hidden');
      if (actionsRow) actionsRow.classList.remove('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    favGrid.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (actionsRow) actionsRow.classList.remove('hidden');

    filteredFavs.forEach(palette => {
      const card = createPaletteCardElement(palette, false);
      favGrid.appendChild(card);
    });
  }

  function createPaletteCardElement(palette, isRecent = false) {
    const card = document.createElement('div');
    card.className = 'palette-card';

    if (palette.id === currentAppliedId) {
      card.classList.add('active-applied');
    }

    const isFav = isFavorite(palette.id);
    const isDesktopApp = !!(window.process && window.process.versions && window.process.versions.electron) || window.navigator.userAgent.toLowerCase().includes('electron');

    const colorStrip = [
      palette.colors.primary || '#ffffff',
      palette.colors.secondary || '#cccccc',
      palette.colors.accent || '#888888',
      palette.colors.background || '#000000'
    ];

    const stripHtml = colorStrip.map(hex => `
      <div class="color-strip-bar" style="background-color: ${hex};" title="${hex}"></div>
    `).join('');

    const isAppliedBadge = palette.id === currentAppliedId
      ? `<span class="applied-badge">✓ Active</span>`
      : '';

    const heartBtnHtml = isDesktopApp
      ? `<button class="card-heart-btn ${isFav ? 'favorited' : ''}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}" aria-label="Favorite Palette">
          <svg class="heart-icon-svg" viewBox="0 0 24 24" fill="${isFav ? '#E74C3C' : 'none'}" stroke="${isFav ? '#E74C3C' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>`
      : '';

    card.innerHTML = `
      <div class="card-color-strip">
        ${stripHtml}
        ${heartBtnHtml}
      </div>
      <div class="card-content">
        <div class="card-title-row">
          <h4 class="card-name">${escapeHtml(palette.name)}</h4>
          ${isAppliedBadge}
        </div>
      </div>
    `;

    // Heart Click Event Handler
    const heartBtn = card.querySelector('.card-heart-btn');
    if (heartBtn) {
      heartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        heartBtn.classList.add('heart-bounce');
        setTimeout(() => heartBtn.classList.remove('heart-bounce'), 300);
        toggleFavorite(palette.id);
      });
    }

    card.addEventListener('click', () => {
      openPreviewModal(palette);
    });

    return card;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --------------------------------------------------------------------------
  // PREVIEW MODAL & LIVE CLOCK ENGINE
  // --------------------------------------------------------------------------
  function openPreviewModal(palette) {
    activePreviewPalette = palette;
    const previewModal = document.getElementById('palette-preview-modal');
    if (!previewModal) return;

    const nameEl = document.getElementById('preview-palette-name');
    const descEl = document.getElementById('preview-palette-desc');
    const tagsEl = document.getElementById('preview-tags');
    const swatchesEl = document.getElementById('preview-swatches');

    if (nameEl) nameEl.textContent = palette.name;
    if (descEl) descEl.textContent = palette.description || 'Curated color palette for Facet minimal clock.';

    if (tagsEl) {
      tagsEl.innerHTML = (palette.tags || []).map(t => `<span class="preview-tag-pill">#${escapeHtml(t)}</span>`).join('');
    }

    if (swatchesEl) {
      const swatches = [
        { label: 'Primary (Hands/Numbers)', hex: palette.colors.primary, rgb: hexToRgb(palette.colors.primary) },
        { label: 'Secondary (Background)', hex: palette.colors.secondary || palette.colors.background, rgb: hexToRgb(palette.colors.secondary || palette.colors.background) },
        { label: 'Accent (Highlights)', hex: palette.colors.accent, rgb: hexToRgb(palette.colors.accent) },
        { label: 'Surface (Glass/Card)', hex: palette.colors.surface || palette.colors.tertiary, rgb: hexToRgb(palette.colors.surface || palette.colors.tertiary) }
      ];

      swatchesEl.innerHTML = swatches.map(s => `
        <div class="swatch-item">
          <div class="swatch-color" style="background-color: ${s.hex};"></div>
          <div class="swatch-info">
            <span class="swatch-label">${s.label}</span>
            <span class="swatch-hex">${s.hex}</span>
            <span class="swatch-rgb">${s.rgb}</span>
          </div>
        </div>
      `).join('');
    }

    updatePreviewModeControl();

    previewModal.classList.remove('hidden');
    previewModal.setAttribute('aria-hidden', 'false');

    renderLivePreviewClock();
    if (previewTimer) clearInterval(previewTimer);
    previewTimer = setInterval(renderLivePreviewClock, 1000);
  }

  function closePreviewModal() {
    const previewModal = document.getElementById('palette-preview-modal');
    if (previewModal) {
      previewModal.classList.add('hidden');
      previewModal.setAttribute('aria-hidden', 'true');
    }
    if (previewTimer) {
      clearInterval(previewTimer);
      previewTimer = null;
    }
    activePreviewPalette = null;
  }

  function updatePreviewModeControl() {
    const btnAnalog = document.getElementById('preview-mode-analog');
    const btnDigital = document.getElementById('preview-mode-digital');

    if (btnAnalog && btnDigital) {
      if (previewMode === 'analog') {
        btnAnalog.classList.add('active');
        btnDigital.classList.remove('active');
      } else {
        btnDigital.classList.add('active');
        btnAnalog.classList.remove('active');
      }
    }
  }

  function renderLivePreviewClock() {
    const stage = document.getElementById('preview-stage');
    if (!stage || !activePreviewPalette) return;

    const now = new Date();
    const bg = activePreviewPalette.colors.background || activePreviewPalette.colors.secondary || '#0b0c0e';
    const fg = activePreviewPalette.colors.primary || '#eaeaea';
    const accent = activePreviewPalette.colors.accent || activePreviewPalette.colors.primary || '#ffd152';

    const tempPalette = {
      name: activePreviewPalette.name,
      bg: bg,
      fg: fg,
      accent: accent,
      subtle: fg + '66',
      cardBg: activePreviewPalette.colors.surface || 'rgba(255,255,255,0.1)',
      cardBorder: accent + '33',
      glow: activePreviewPalette.colors.tertiary || accent
    };

    stage.style.backgroundColor = bg;
    stage.style.setProperty('--bg', bg);
    stage.style.setProperty('--fg', fg);
    stage.style.setProperty('--accent', accent);
    stage.style.setProperty('--subtle', fg + '66');

    if (window.ClockRenderers) {
      if (previewMode === 'analog') {
        const dummyVariation = { id: 'a7', name: 'Glassmorphism Analog' };
        stage.innerHTML = window.ClockRenderers.renderAnalog(now, dummyVariation, tempPalette);
      } else {
        const dummyVariation = { id: 'd1', name: 'Minimal Digital' };
        stage.innerHTML = window.ClockRenderers.renderDigital(now, dummyVariation, tempPalette);
      }
    }
  }

  function hexToRgb(hex) {
    if (!hex) return 'rgb(0, 0, 0)';
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
  }

  // --------------------------------------------------------------------------
  // EXPLORE MODAL OPEN / CLOSE LOGIC
  // --------------------------------------------------------------------------
  function openExploreModal() {
    const modal = document.getElementById('explore-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    renderExploreView();

    const searchInput = document.getElementById('explore-search-input');
    if (searchInput) searchInput.focus();
  }

  function closeExploreModal() {
    const modal = document.getElementById('explore-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // --------------------------------------------------------------------------
  // EVENT BINDINGS
  // --------------------------------------------------------------------------
  function bindEvents() {
    // Toolbar Explore Button
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', openExploreModal);
    }

    // Desktop Help (?) Button inside Explore Header
    const helpBtn = document.getElementById('explore-help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        const infoModal = document.getElementById('info-modal');
        if (infoModal) {
          infoModal.classList.remove('hidden');
          infoModal.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // Explore Modal Close
    const modalClose = document.getElementById('explore-modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', closeExploreModal);
    }

    // Quick Favorites Button
    const quickFavBtn = document.getElementById('explore-favorites-quick-btn');
    if (quickFavBtn) {
      quickFavBtn.addEventListener('click', () => {
        if (activeTab === 'explore') {
          setActiveTab('favorites');
        } else {
          setActiveTab('explore');
        }
      });
    }

    // Tab Navigation Buttons
    const tabExploreBtn = document.getElementById('tab-btn-explore');
    const tabFavoritesBtn = document.getElementById('tab-btn-favorites');

    if (tabExploreBtn) {
      tabExploreBtn.addEventListener('click', () => setActiveTab('explore'));
    }
    if (tabFavoritesBtn) {
      tabFavoritesBtn.addEventListener('click', () => setActiveTab('favorites'));
    }

    // Browse All Palettes Button (Empty State Action)
    const browseBtn = document.getElementById('favorites-browse-btn');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => setActiveTab('explore'));
    }

    // Clear All Favorites Modal & Trigger
    const clearAllTrigger = document.getElementById('clear-all-favorites-btn');
    const clearModal = document.getElementById('clear-favorites-modal');
    const clearModalClose = document.getElementById('clear-modal-close');
    const confirmClearBtn = document.getElementById('confirm-clear-favorites-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-favorites-btn');

    if (clearAllTrigger && clearModal) {
      clearAllTrigger.addEventListener('click', () => {
        clearModal.classList.remove('hidden');
        clearModal.setAttribute('aria-hidden', 'false');
      });
    }

    if (clearModalClose && clearModal) {
      clearModalClose.addEventListener('click', () => {
        clearModal.classList.add('hidden');
        clearModal.setAttribute('aria-hidden', 'true');
      });
    }

    if (cancelClearBtn && clearModal) {
      cancelClearBtn.addEventListener('click', () => {
        clearModal.classList.add('hidden');
        clearModal.setAttribute('aria-hidden', 'true');
      });
    }

    if (confirmClearBtn && clearModal) {
      confirmClearBtn.addEventListener('click', () => {
        clearAllFavorites();
        clearModal.classList.add('hidden');
        clearModal.setAttribute('aria-hidden', 'true');
      });
    }

    // Search Input & Debounce
    const searchInput = document.getElementById('explore-search-input');
    const searchClear = document.getElementById('explore-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        searchQuery = val;

        if (searchClear) {
          if (val.length > 0) searchClear.classList.remove('hidden');
          else searchClear.classList.add('hidden');
        }

        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          renderExploreView();
        }, 150);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        searchClear.classList.add('hidden');
        renderExploreView();
      });
    }

    // Empty state clear button
    const emptyClearBtn = document.getElementById('explore-empty-clear-btn');
    if (emptyClearBtn) {
      emptyClearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        selectedCategory = 'all';
        if (searchClear) searchClear.classList.add('hidden');
        updateCategoryPillsUI();
        renderExploreView();
      });
    }

    // Category Filter Pills
    const pillsContainer = document.getElementById('explore-category-pills');
    if (pillsContainer) {
      pillsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (!btn) return;
        selectedCategory = btn.getAttribute('data-cat') || 'all';
        updateCategoryPillsUI();
        renderExploreView();
      });
    }

    // Preview Mode Toggle Buttons (Segmented Control)
    const btnAnalog = document.getElementById('preview-mode-analog');
    const btnDigital = document.getElementById('preview-mode-digital');

    if (btnAnalog) {
      btnAnalog.addEventListener('click', () => {
        previewMode = 'analog';
        updatePreviewModeControl();
        renderLivePreviewClock();
      });
    }

    if (btnDigital) {
      btnDigital.addEventListener('click', () => {
        previewMode = 'digital';
        updatePreviewModeControl();
        renderLivePreviewClock();
      });
    }

    // Preview Modal Actions
    const previewClose = document.getElementById('preview-modal-close');
    const previewBack = document.getElementById('preview-back-btn');
    const previewApply = document.getElementById('preview-apply-btn');

    if (previewClose) previewClose.addEventListener('click', closePreviewModal);
    if (previewBack) previewBack.addEventListener('click', closePreviewModal);

    if (previewApply) {
      previewApply.addEventListener('click', () => {
        if (activePreviewPalette) {
          applyPaletteToClockEngine(activePreviewPalette, true);
          closePreviewModal();
          closeExploreModal();
        }
      });
    }

    // Keyboard Shortcuts (Escape Key)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (clearModal && !clearModal.classList.contains('hidden')) {
          clearModal.classList.add('hidden');
          clearModal.setAttribute('aria-hidden', 'true');
          e.stopPropagation();
          return;
        }

        const previewModal = document.getElementById('palette-preview-modal');
        if (previewModal && !previewModal.classList.contains('hidden')) {
          closePreviewModal();
          e.stopPropagation();
          return;
        }

        const exploreModal = document.getElementById('explore-modal');
        if (exploreModal && !exploreModal.classList.contains('hidden')) {
          closeExploreModal();
          e.stopPropagation();
        }
      }
    });
  }

  function updateCategoryPillsUI() {
    const pills = document.querySelectorAll('#explore-category-pills .pill-btn');
    pills.forEach(p => {
      if (p.getAttribute('data-cat') === selectedCategory) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  function saveCustomPalettes() {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PALETTES, JSON.stringify(customPalettes));
    renderCustomPalettesGrid();
  }

  function renderCustomPalettesGrid() {
    const customSection = document.getElementById('explore-custom-section');
    const customGrid = document.getElementById('explore-custom-grid');
    if (!customSection || !customGrid) return;

    if (customPalettes.length === 0) {
      customSection.classList.add('hidden');
      return;
    }

    customSection.classList.remove('hidden');
    customGrid.innerHTML = '';

    customPalettes.forEach(palette => {
      const card = createPaletteCardElement(palette);
      const titleRow = card.querySelector('.card-title-row');
      if (titleRow) {
        const badge = document.createElement('span');
        badge.className = 'custom-badge';
        badge.textContent = 'CUSTOM';
        titleRow.appendChild(badge);
      }
      customGrid.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // DESKTOP-ONLY: DRAG & DROP PALETTE FILE IMPORTER (.json / .facet)
  // --------------------------------------------------------------------------
  function setupDragDropImporter() {
    const overlay = document.getElementById('desktop-drag-drop-overlay');
    const importModal = document.getElementById('import-palette-modal');
    const importErrorModal = document.getElementById('import-error-modal');
    const isDesktop = !!(window.electronAPI && window.electronAPI.isDesktop) ||
                      !!(window.process && window.process.versions && window.process.versions.electron) ||
                      window.navigator.userAgent.toLowerCase().includes('electron');

    if (!isDesktop || !overlay) return;

    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        overlay.classList.remove('hidden');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        overlay.classList.add('hidden');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      overlay.classList.add('hidden');

      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length > 0) {
        processDroppedFile(files[0]);
      }
    });

    const confirmBtn = document.getElementById('import-confirm-btn');
    const cancelBtn = document.getElementById('import-cancel-btn');
    const errorCloseBtn = document.getElementById('import-error-close-btn');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (pendingImportPalette) {
          const existingIdx = customPalettes.findIndex(p => p.name.toLowerCase() === pendingImportPalette.name.toLowerCase());
          if (existingIdx >= 0) {
            customPalettes[existingIdx] = pendingImportPalette;
          } else {
            customPalettes.unshift(pendingImportPalette);
          }

          const mainIdx = palettes.findIndex(p => p.id === pendingImportPalette.id);
          if (mainIdx >= 0) {
            palettes[mainIdx] = pendingImportPalette;
          } else {
            palettes.unshift(pendingImportPalette);
          }

          saveCustomPalettes();
          closeImportModal();
          applyPaletteToClockEngine(pendingImportPalette);
          showToast(`✓ Imported "${pendingImportPalette.name}" successfully!`);
          openExploreModal();
        }
      });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeImportModal);
    if (errorCloseBtn) errorCloseBtn.addEventListener('click', closeImportErrorModal);
  }

  function closeImportModal() {
    const modal = document.getElementById('import-palette-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    pendingImportPalette = null;
  }

  function closeImportErrorModal() {
    const modal = document.getElementById('import-error-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function showImportError(title, message, bullets) {
    const modal = document.getElementById('import-error-modal');
    const titleEl = document.getElementById('import-error-title');
    const msgEl = document.getElementById('import-error-msg');
    const bulletsEl = document.getElementById('import-error-details');

    if (!modal) return;

    if (titleEl) titleEl.textContent = title || 'Import Failed';
    if (msgEl) msgEl.textContent = message || 'Invalid file format.';

    if (bulletsEl) {
      if (Array.isArray(bullets) && bullets.length > 0) {
        bulletsEl.innerHTML = bullets.map(b => `<p>• ${b}</p>`).join('');
        bulletsEl.classList.remove('hidden');
      } else {
        bulletsEl.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  async function processDroppedFile(file) {
    const filename = file.name || '';
    const ext = filename.split('.').pop().toLowerCase();

    if (ext !== 'json' && ext !== 'facet') {
      showImportError(
        'File Not Supported',
        `We couldn't import "${filename}".`,
        ['Supported formats: .json and .facet palette files']
      );
      return;
    }

    if (file.size > 1024 * 1024) {
      showImportError(
        'File Too Large',
        `The file "${filename}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
        ['Maximum allowed file size is 1.0 MB']
      );
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validation = validatePaletteSchema(data);

      if (!validation.valid) {
        showImportError('Invalid Palette Format', `The file "${filename}" is missing required palette fields.`, validation.errors);
        return;
      }

      const paletteObj = normalizeImportedPalette(data, filename);
      pendingImportPalette = paletteObj;

      showImportConfirmationModal(paletteObj, filename);
    } catch (err) {
      showImportError('Couldn\'t Read File', `Failed to parse JSON content in "${filename}".`, ['Ensure file contains valid, uncorrupted JSON formatting']);
    }
  }

  function validatePaletteSchema(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['File does not contain a JSON object'] };
    }

    const name = data.name || data.paletteName || data.title;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Missing required "name" field');
    }

    const colorsObj = data.colors || data.hexCodes || data.colorStrip;
    if (!colorsObj) {
      errors.push('Missing required "colors" object or "hexCodes" array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function normalizeImportedPalette(data, filename) {
    const name = data.name || data.paletteName || data.title || 'Custom Palette';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = data.id || `palette_custom_${Date.now()}_${slug}`;

    let hexCodes = [];
    if (Array.isArray(data.hexCodes)) {
      hexCodes = data.hexCodes;
    } else if (Array.isArray(data.colorStrip)) {
      hexCodes = data.colorStrip;
    } else if (data.colors && typeof data.colors === 'object') {
      hexCodes = Object.values(data.colors).filter(v => typeof v === 'string' && v.startsWith('#'));
    }

    if (hexCodes.length < 4) {
      const fill = ['#16B399', '#3498DB', '#9B59B6', '#1A1A24'];
      while (hexCodes.length < 4) hexCodes.push(fill[hexCodes.length % fill.length]);
    }

    const colors = {
      primary: hexCodes[0] || '#16B399',
      secondary: hexCodes[1] || '#3498DB',
      accent: hexCodes[2] || '#9B59B6',
      tertiary: hexCodes[3] || '#1A1A24',
      bg: data.colors ? (data.colors.bg || '#090B10') : '#090B10',
      fg: data.colors ? (data.colors.fg || '#FFFFFF') : '#FFFFFF'
    };

    return {
      id,
      name,
      description: data.description || `Custom imported palette from ${filename}`,
      colors,
      hexCodes: hexCodes.slice(0, 4),
      rgbCodes: hexCodes.slice(0, 4).map(hexToRgbString),
      createdDate: new Date().toISOString().split('T')[0],
      usageCount: 1,
      designer: data.designer || 'User Imported',
      category: 'custom',
      isCustom: true,
      sourceFile: filename
    };
  }

  function hexToRgbString(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return `rgb(${r}, ${g}, ${b})`;
  }

  function showImportConfirmationModal(palette, filename) {
    const modal = document.getElementById('import-palette-modal');
    const previewContainer = document.getElementById('import-preview-colors');
    const nameVal = document.getElementById('import-name-val');
    const descVal = document.getElementById('import-desc-val');
    const descRow = document.getElementById('import-desc-row');
    const fileVal = document.getElementById('import-file-val');
    const colorsCount = document.getElementById('import-colors-count');
    const warningBox = document.getElementById('import-warning-box');

    if (!modal) return;

    if (previewContainer) {
      previewContainer.innerHTML = palette.hexCodes.map(hex =>
        `<div class="color-strip-bar" style="background: ${hex};"></div>`
      ).join('');
    }

    if (nameVal) nameVal.textContent = palette.name;
    if (fileVal) fileVal.textContent = filename;
    if (colorsCount) colorsCount.textContent = `${palette.hexCodes.length} (Primary, Secondary, Accent, Tertiary)`;

    if (palette.description && descVal && descRow) {
      descVal.textContent = palette.description;
      descRow.classList.remove('hidden');
    } else if (descRow) {
      descRow.classList.add('hidden');
    }

    const exists = customPalettes.some(p => p.name.toLowerCase() === palette.name.toLowerCase());
    if (warningBox) {
      if (exists) warningBox.classList.remove('hidden');
      else warningBox.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION ENTRYPOINT
  // --------------------------------------------------------------------------
  async function init() {
    await loadFacetData();
    loadStoredState();
    bindEvents();
    setupDragDropImporter();
  }

  return {
    init,
    openExploreModal,
    closeExploreModal,
    applyPalette: applyPaletteToClockEngine,
    toggleFavorite,
    isFavorite,
    getPalettes: () => palettes,
    getRecents: () => recents,
    getFavorites: () => favorites,
    getCustomPalettes: () => customPalettes
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.ExploreEngine.init();
});
