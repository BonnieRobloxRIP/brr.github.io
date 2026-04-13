document.addEventListener('DOMContentLoaded', () => {
  // --- UI ELEMENTS
  const searchInput = document.getElementById('searchInput');
  const catalogFilter = document.getElementById('catalogFilter');

  // --- VISUAL EFFECTS ELEMENTS
  const rareScreen = document.getElementById('rare-screen');
  const rareTitle = document.getElementById('rare-title');
  const rareText = document.getElementById('rare-text');
  const rareSubtext = document.getElementById('rare-subtext');
  const preRareOverlay = document.getElementById('pre-rare-overlay');
  const flickerOverlay = document.getElementById('flicker-overlay');
  const glitchClone = document.getElementById('glitch-clone');

  // --- THEME PICKER ELEMENTS
  const themePicker = document.getElementById('theme-picker');
  const themeOptions = Array.from(document.querySelectorAll('.theme-option'));
  const themeConfirmBtn = document.getElementById('theme-confirm-btn');
  const themeCancelBtn = document.getElementById('theme-cancel-btn');
  const themeSettingsBtn = document.getElementById('theme-btn');
  const bootOverlay = document.getElementById('boot-overlay');
  const bootStatus = document.getElementById('boot-status');
  const MISSING_TEXTURE_PATH = 'assets/missing_texture.png';
  const connectionInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const lowEndDeviceHints = {
    saveData: Boolean(connectionInfo?.saveData),
    lowMemory: Number(navigator.deviceMemory || 0) > 0 && Number(navigator.deviceMemory || 0) <= 2,
    lowCpu: Number(navigator.hardwareConcurrency || 0) > 0 && Number(navigator.hardwareConcurrency || 0) <= 4
  };
  const isLowEndDevice = lowEndDeviceHints.saveData || lowEndDeviceHints.lowMemory || lowEndDeviceHints.lowCpu;
  const THEME_STORAGE_KEY = 'bse_theme';
  const THEME_PICKER_VERSION_KEY = 'bse_theme_picker_version';
  const THEME_PICKER_VERSION = 'v2';
  const allowedThemes = new Set(['light', 'dark', 'blackmesa', 'xen']);

  let appBootIsReady = false;
  let hasBootRevealRun = false;
  let bootRevealTimestamp = 0;
  let themePickerCanDismiss = false;
  let themeBeforePicker = null;

  function setBootStatus(message) {
    if (!bootStatus || !message) return;
    bootStatus.textContent = message;
  }

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function waitForNextPaint() {
    return new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  function tryRevealApp() {
    if (hasBootRevealRun || !appBootIsReady) return;
    hasBootRevealRun = true;

    waitForNextPaint().then(() => {
      bootRevealTimestamp = Date.now();
      document.body.classList.add('app-ready');
      document.body.classList.remove('app-booting');

      if (flickerOverlay) {
        flickerOverlay.style.opacity = '0';
      }

      if (bootOverlay) {
        bootOverlay.setAttribute('aria-busy', 'false');
      }

      window.setTimeout(() => {
        const hasTheme = Boolean(getStoredTheme());
        const shouldShowThemePicker = !hasTheme || !hasSeenCurrentThemePicker();

        if (shouldShowThemePicker) {
          openThemePicker(false);
        }
      }, 160);
    });
  }

  function markAppBootReady() {
    appBootIsReady = true;
    tryRevealApp();
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewportQuery = window.matchMedia('(max-width: 900px)');
  const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

  function getEffectProfile() {
    const reduceMotion = reducedMotionQuery.matches;
    const isMobileLike = mobileViewportQuery.matches || coarsePointerQuery.matches;
    const lowPowerMode = isLowEndDevice || reduceMotion;

    return {
      reduceMotion,
      isMobileLike,
      lowPowerMode,
      spriteCount: lowPowerMode ? (isMobileLike ? 4 : 6) : (isMobileLike ? 10 : 20),
      zoomFactor: lowPowerMode ? (isMobileLike ? 7 : 8) : (isMobileLike ? 8 : 10),
      glitchIntensity: lowPowerMode ? 1 : (isMobileLike ? 4 : 6),
      maxGlitchBars: lowPowerMode ? 5 : (isMobileLike ? 12 : 18),
      flickerDelayMin: lowPowerMode ? 4200 : (isMobileLike ? 2600 : 1600),
      flickerDelayRange: lowPowerMode ? 6200 : (isMobileLike ? 5200 : 3800),
      flickerOpacityMin: lowPowerMode ? 0.03 : (isMobileLike ? 0.07 : 0.1),
      flickerOpacityRange: lowPowerMode ? 0.09 : (isMobileLike ? 0.2 : 0.32),
      staticMin: lowPowerMode ? 0.02 : (isMobileLike ? 0.04 : 0.06),
      staticRange: lowPowerMode ? 0.05 : (isMobileLike ? 0.12 : 0.16),
      staticIntervalMs: lowPowerMode ? 1800 : (isMobileLike ? 1200 : 900),
      disableRareScreen: lowPowerMode
    };
  }

  function attachMediaQueryListener(query, callback) {
    if (!query) return;

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', callback);
      return;
    }

    if (typeof query.addListener === 'function') {
      query.addListener(callback);
    }
  }

  let effectProfile = getEffectProfile();

  function syncEffectProfile() {
    effectProfile = getEffectProfile();
    document.body.classList.toggle('mobile-viewport', effectProfile.isMobileLike);
    document.body.classList.toggle('reduced-motion', effectProfile.reduceMotion);
  }

  attachMediaQueryListener(reducedMotionQuery, syncEffectProfile);
  attachMediaQueryListener(mobileViewportQuery, syncEffectProfile);
  attachMediaQueryListener(coarsePointerQuery, syncEffectProfile);
  syncEffectProfile();

  // --- THEME SYSTEM
  function normalizeThemeKey(theme) {
    if (theme === 'egg') return 'blackmesa';
    return allowedThemes.has(theme) ? theme : 'dark';
  }

  function getStoredTheme() {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      return saved ? normalizeThemeKey(saved) : null;
    } catch (e) {
      return null;
    }
  }

  function hasSeenCurrentThemePicker() {
    try {
      return window.localStorage.getItem(THEME_PICKER_VERSION_KEY) === THEME_PICKER_VERSION;
    } catch (e) {
      return false;
    }
  }

  function markThemePickerSeen() {
    try {
      window.localStorage.setItem(THEME_PICKER_VERSION_KEY, THEME_PICKER_VERSION);
    } catch (e) {
      // Ignore storage restrictions in private/incognito contexts.
    }
  }

  function setThemeSelectionState(theme) {
    themeOptions.forEach(option => {
      option.classList.toggle('selected', option.dataset.theme === theme);
      option.setAttribute('aria-pressed', option.dataset.theme === theme ? 'true' : 'false');
    });
  }

  function applyTheme(theme, persist = false) {
    const selectedTheme = normalizeThemeKey(theme);
    document.body.setAttribute('data-theme', selectedTheme);
    setThemeSelectionState(selectedTheme);

    if (persist) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
      } catch (e) {
        // Ignore storage failures (private mode / strict browser settings).
      }
    }
  }

  function openThemePicker(canDismiss) {
    if (!themePicker) return;
    themeBeforePicker = document.body.getAttribute('data-theme') || 'dark';
    themePickerCanDismiss = Boolean(canDismiss);
    themePicker.dataset.dismissible = themePickerCanDismiss ? 'true' : 'false';
    themePicker.classList.add('active');
  }

  function closeThemePicker() {
    if (!themePicker) return;
    themePicker.classList.remove('active');
  }

  function initThemePicker() {
    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || 'dark';

    applyTheme(initialTheme, false);

    if (!themePicker) return;
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const previewTheme = option.dataset.theme;
        applyTheme(previewTheme, false);
      });
    });

    if (themeConfirmBtn) {
      themeConfirmBtn.addEventListener('click', () => {
        const pickedTheme = document.body.getAttribute('data-theme') || 'dark';
        applyTheme(pickedTheme, true);
        markThemePickerSeen();
        closeThemePicker();
      });
    }

    if (themeCancelBtn) {
      themeCancelBtn.addEventListener('click', () => {
        if (themeBeforePicker) {
          applyTheme(themeBeforePicker, false);
        }
        markThemePickerSeen();
        closeThemePicker();
      });
    }

    if (themePicker) {
      themePicker.addEventListener('click', (event) => {
        if (event.target === themePicker && themePickerCanDismiss) {
          closeThemePicker();
        }
      });
    }

    if (themeSettingsBtn) {
      themeSettingsBtn.addEventListener('click', () => {
        applyTheme(document.body.getAttribute('data-theme') || initialTheme, false);
        openThemePicker(true);
      });
    }

    window.openThemePicker = () => openThemePicker(true);
  }

  initThemePicker();


  // --- SCREEN NAVIGATION SYSTEM
  window.navigateTo = function (screenId, title = null) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    if (conditionsTopBtn) {
      conditionsTopBtn.classList.toggle('visible', screenId === 'conditions-screen');
    }

    // Handle Global Navigation Buttons
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      homeBtn.classList.toggle('hidden', screenId === 'main-menu');
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.classList.toggle('hidden', screenId !== 'detail-screen');
    }

    // Update Placeholder Title if needed
    if (screenId === 'placeholder-screen' && title) {
      document.getElementById('placeholder-title').textContent = title;
    }
  };

  window.goBack = function () {
    const activeScreenId = document.querySelector('.screen.active')?.id || '';
    if (activeScreenId === 'detail-screen') {
      window.navigateTo(detailBackScreen);
      if (detailBackScreen === 'conditions-screen' && conditionsScroll) {
        conditionsScroll.scrollTop = conditionsScrollRestoreTop;
      }
    }
  };

  window.goHome = function () {
    window.navigateTo('main-menu');
  };

  window.scrollConditionsToTop = function () {
    if (!conditionsScroll) return;
    conditionsScroll.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const blockGrid = document.getElementById('blockGrid');
  const toolsSubtitle = document.getElementById('tools-subtitle');
  const catalogCount = document.getElementById('catalog-count');
  const catalogEmpty = document.getElementById('catalog-empty');
  const conditionsCount = document.getElementById('conditions-count');
  const conditionsCategoryNav = document.getElementById('conditions-category-nav');
  const conditionSearchInput = document.getElementById('conditionSearchInput');
  const conditionsContent = document.getElementById('conditions-content');
  const conditionsEmpty = document.getElementById('conditions-empty');
  const conditionsScroll = document.querySelector('#conditions-screen .screen-content-scroll');
  const conditionsTopBtn = document.getElementById('conditions-top-btn');
  const detailHeaderTitle = document.getElementById('detail-header-title');
  const detailInfoContent = document.getElementById('detail-info-content');
  const detailOutputsContent = document.getElementById('detail-outputs-content');
  const detailInputsContent = document.getElementById('detail-inputs-content');
  const detailTabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const detailTabContainer = document.querySelector('.tab-container');
  const detailTabContents = {
    info: document.getElementById('tab-info'),
    outputs: document.getElementById('tab-outputs'),
    inputs: document.getElementById('tab-inputs')
  };

  const catalogSource = window.BSECatalog || {
    entries: [],
    outputTemplate: [],
    existingOutputTemplate: [],
    inputTemplate: [],
    iconMap: {}
  };

  const blockCatalog = Array.isArray(catalogSource.entries) ? catalogSource.entries : [];
  const conditionReference = Array.isArray(catalogSource.conditionReference) ? catalogSource.conditionReference : [];
  const menuLabels = {
    all: 'All Blocks',
    tools: 'Tools & Blocks',
    logic: 'Logic Blocks',
    game: 'Game & Mode Blocks'
  };

  const emptyMessages = {
    all: 'There are no public entries loaded yet.',
    tools: 'There are no tools or blocks here yet. More are coming soon.',
    logic: 'There are no logic blocks here yet. More are coming soon.',
    game: 'There are no game blocks here yet. More are coming soon.'
  };

  let currentMenuGroup = 'tools';
  let currentSearchTerm = '';
  let searchDebounceTimeoutId = null;
  let currentConditionSearchTerm = '';
  let conditionSearchDebounceTimeoutId = null;
  let detailBackScreen = 'tools-screen';
  let conditionsScrollRestoreTop = 0;

  function normalizeText(value) {
    return `${value ?? ''}`.toLowerCase();
  }

  function escapeHtml(value) {
    return `${value ?? ''}`
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const categoryFallbackIcons = {
    Tools: 'assets/brr_trigger.png',
    Logic: 'assets/missing_texture.png',
    Game: 'assets/missing_texture.png',
    Environment: 'assets/missing_texture.png',
    Internal: 'assets/missing_texture.png'
  };

  function getFallbackIcon(entry) {
    return categoryFallbackIcons[entry?.category] || MISSING_TEXTURE_PATH;
  }

  function resolveIconPath(entry) {
    const mapped = catalogSource?.iconMap?.[entry.id];
    if (typeof mapped === 'string' && mapped.trim()) return mapped;
    if (typeof entry?.id === 'string' && entry.id.trim()) return `assets/${entry.id}.png`;
    return MISSING_TEXTURE_PATH;
  }

  function normalizeImagePath(pathValue) {
    return `${pathValue || ''}`.trim().toLowerCase();
  }

  function getImageFallbackPath(imageElement) {
    const explicitFallback = `${imageElement?.dataset?.fallback || ''}`.trim();
    return explicitFallback || MISSING_TEXTURE_PATH;
  }

  function bindGlobalImageFallbacks() {
    document.addEventListener('error', event => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;

      const fallbackPath = getImageFallbackPath(target);
      if (!fallbackPath) return;

      const currentSrc = normalizeImagePath(target.currentSrc || target.src);
      const fallbackNormalized = normalizeImagePath(fallbackPath);

      if (currentSrc === fallbackNormalized) return;
      target.dataset.fallback = fallbackPath;
      target.src = fallbackPath;
    }, true);
  }

  bindGlobalImageFallbacks();

  function setToolsSubtitle(menuGroup) {
    if (!toolsSubtitle) return;
    toolsSubtitle.textContent = menuLabels[menuGroup] || menuLabels.tools;
  }

  const searchableCatalogTextById = new Map(
    blockCatalog.map(entry => {
      const haystack = [
        entry.name,
        entry.id,
        entry.category,
        entry.summary,
        entry.usage,
        entry.example,
        ...(Array.isArray(entry.classInfo) ? entry.classInfo : [])
      ].map(normalizeText).join(' ');

      return [entry.id, haystack];
    })
  );

  function getFilteredCatalog() {
    return blockCatalog
      .filter(entry => {
        if (currentMenuGroup === 'all') return true;
        return entry.menuGroup === currentMenuGroup;
      })
      .filter(entry => {
        if (!currentSearchTerm) return true;

        const haystack = searchableCatalogTextById.get(entry.id) || '';

        return haystack.includes(currentSearchTerm);
      });
  }

  function getConditionCapableBlocks(blockIds) {
    if (!Array.isArray(blockIds) || blockIds.length === 0) return [];

    const normalizedIds = new Set(blockIds.map(id => `${id || ''}`.trim()));
    return blockCatalog.filter(entry => normalizedIds.has(entry.id));
  }

  function getFilteredConditions() {
    if (!currentConditionSearchTerm) return conditionReference;

    return conditionReference.filter(condition => {
      const haystack = [
        condition.key,
        condition.description,
        condition.params,
        condition.example,
        ...(Array.isArray(condition.blocks) ? condition.blocks : [])
      ].map(normalizeText).join(' ');

      return haystack.includes(currentConditionSearchTerm);
    });
  }

  function getConditionCategory(conditionKey) {
    const key = `${conditionKey || ''}`;

    if (key === 'noCondition') return 'General';
    if (key.startsWith('ifWeather') || key.startsWith('ifTime')) return 'Weather & Time';
    if (key.startsWith('ifBlock')) return 'Block & Area';
    if (key.startsWith('ifItemDurability')) return 'Items';
    if (key.includes('Score')) return 'Score';
    if (key.startsWith('ifPlayer')) return 'Player';
    if (key.startsWith('ifEntity')) return 'Entity';

    return 'Other';
  }

  function groupConditionsByCategory(conditions) {
    const categoryOrder = ['General', 'Player', 'Entity', 'Score', 'Block & Area', 'Weather & Time', 'Items', 'Other'];
    const buckets = new Map(categoryOrder.map(category => [category, []]));

    conditions.forEach(condition => {
      const category = getConditionCategory(condition.key);
      if (!buckets.has(category)) buckets.set(category, []);
      buckets.get(category).push(condition);
    });

    return Array.from(buckets.entries())
      .filter(([, entries]) => entries.length > 0)
      .sort((a, b) => {
        const ai = categoryOrder.indexOf(a[0]);
        const bi = categoryOrder.indexOf(b[0]);
        return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
      });
  }

  function renderCatalog() {
    if (!blockGrid) return;
    blockGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const filtered = getFilteredCatalog();
    if (catalogCount) {
      catalogCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'Block' : 'Blocks'}`;
    }

    if (catalogEmpty) {
      catalogEmpty.style.display = filtered.length === 0 ? 'block' : 'none';
      catalogEmpty.textContent = currentSearchTerm
        ? 'No blocks match your current search.'
        : (emptyMessages[currentMenuGroup] || emptyMessages.all);
    }

    filtered.forEach(entry => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'block-card';

      const icon = resolveIconPath(entry);
      const fallbackIcon = getFallbackIcon(entry);
      card.innerHTML = `
        <div class="card-top">
          <img src="${escapeHtml(icon)}" data-fallback="${escapeHtml(fallbackIcon)}" class="card-img" alt="${escapeHtml(entry.name)} icon" loading="lazy" decoding="async">
        </div>
        <div class="card-category">${escapeHtml(entry.category || 'Tools')}</div>
        <div class="card-title">${escapeHtml(entry.name)}</div>
        <div class="card-summary">${escapeHtml(entry.summary || 'No summary available.')}</div>
      `;

      card.addEventListener('click', () => window.openDetailView(entry.id));
      fragment.appendChild(card);
    });

    blockGrid.appendChild(fragment);
  }

  function renderConditionsPage() {
    if (!conditionsContent) return;
    conditionsContent.innerHTML = '';

    const filtered = getFilteredConditions();
    const fragment = document.createDocumentFragment();

    if (conditionsCount) {
      conditionsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'condition' : 'conditions'}`;
    }

    if (conditionsEmpty) {
      conditionsEmpty.style.display = filtered.length === 0 ? 'block' : 'none';
      conditionsEmpty.textContent = currentConditionSearchTerm
        ? 'No conditions match your current search.'
        : 'No condition reference entries are currently loaded.';
    }

    const grouped = groupConditionsByCategory(filtered);

    if (conditionsCategoryNav) {
      conditionsCategoryNav.innerHTML = '';
    }

    grouped.forEach(([categoryName, conditions]) => {
      const categorySection = document.createElement('section');
      categorySection.className = 'condition-category';
      const categoryId = `condition-category-${normalizeText(categoryName).replace(/[^a-z0-9]+/g, '-')}`;
      categorySection.id = categoryId;

      const categoryHeader = document.createElement('div');
      categoryHeader.className = 'condition-category-header';
      categoryHeader.innerHTML = `
        <span class="condition-category-title">${escapeHtml(categoryName)}</span>
        <span class="condition-category-count">${conditions.length} ${conditions.length === 1 ? 'condition' : 'conditions'}</span>
      `;
      categorySection.appendChild(categoryHeader);

      if (conditionsCategoryNav) {
        const jumpButton = document.createElement('button');
        jumpButton.type = 'button';
        jumpButton.className = 'conditions-jump-btn';
        jumpButton.textContent = categoryName;
        jumpButton.addEventListener('click', () => {
          const target = document.getElementById(categoryId);
          if (!target) return;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        conditionsCategoryNav.appendChild(jumpButton);
      }

      conditions.forEach(condition => {
        const usageBlocks = getConditionCapableBlocks(condition.blocks);
        const usageBlocksHtml = usageBlocks.length > 0
          ? usageBlocks.map(entry => {
            const icon = resolveIconPath(entry);
            const fallbackIcon = getFallbackIcon(entry);

            return `
              <button type="button" class="condition-block-card condition-block-btn" data-block-id="${escapeHtml(entry.id)}" aria-label="Open ${escapeHtml(entry.name)} details">
                <img src="${escapeHtml(icon)}" data-fallback="${escapeHtml(fallbackIcon)}" alt="${escapeHtml(entry.name)} icon" loading="lazy" decoding="async">
                <div class="condition-block-meta">
                  <div class="condition-block-name">${escapeHtml(entry.name)}</div>
                  <div class="condition-block-id">${escapeHtml(entry.id)}</div>
                </div>
              </button>
            `;
          }).join('')
          : '<p class="detail-muted">No compatible blocks were mapped for this condition.</p>';

        const conditionItem = document.createElement('details');
        conditionItem.className = 'condition-entry';
        conditionItem.innerHTML = `
          <summary>
            <span class="condition-key">${escapeHtml(condition.key || 'Unknown Condition')}</span>
            <span class="condition-params">${escapeHtml(condition.params || 'No parameters')}</span>
          </summary>
          <div class="condition-content">
            <h3 class="section-title">What It Does</h3>
            <p class="detail-muted">${escapeHtml(condition.description || 'No description provided.')}</p>

            <h3 class="section-title">Example Usage</h3>
            <p class="detail-muted">${escapeHtml(condition.example || 'No example provided.')}</p>

            <details>
              <summary>Blocks That Can Use This Condition (${usageBlocks.length})</summary>
              <div class="details-inner">
                <div class="condition-blocks-grid">${usageBlocksHtml}</div>
              </div>
            </details>
          </div>
        `;

        categorySection.appendChild(conditionItem);
      });

      fragment.appendChild(categorySection);
    });

    conditionsContent.appendChild(fragment);

    conditionsContent.querySelectorAll('.condition-block-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const blockId = event.currentTarget?.dataset?.blockId;
        if (!blockId) return;

        conditionsScrollRestoreTop = conditionsScroll?.scrollTop || 0;
        window.openDetailView(blockId, {
          originScreen: 'conditions-screen',
          restoreScrollTop: conditionsScrollRestoreTop
        });
      });
    });
  }

  function buildListHtml(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '<p class="detail-muted">No entries available for this section.</p>';
    }

    return `<ul class="detail-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  }

  function buildDetailInfo(entry) {
    const icon = resolveIconPath(entry);
    const fallbackIcon = getFallbackIcon(entry);
    const notes = Array.isArray(entry.notes) ? entry.notes : [];

    const classInfoSection = entry?.classInfoConfigurable === false
      ? '<p class="detail-muted">This block is not configurable in the addon. No class-info fields are available.</p>'
      : buildListHtml(entry.classInfo);

    return `
      <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px;">
        <div class="card-top" style="width: 96px; min-width: 96px; min-height: 96px;">
          <img src="${escapeHtml(icon)}" data-fallback="${escapeHtml(fallbackIcon)}" alt="${escapeHtml(entry.name)} icon" class="card-img">
        </div>
        <div class="desc-box" style="flex-grow:1; margin-bottom:0;">${escapeHtml(entry.summary || '')}</div>
      </div>

      <div class="detail-meta-row">
        <span class="detail-chip">Category: ${escapeHtml(entry.category || 'Tools')}</span>
        <span class="detail-chip">ID: ${escapeHtml(entry.id)}</span>
      </div>

      <h3 class="section-title">Usage</h3>
      <p class="detail-muted">${escapeHtml(entry.usage || 'No usage notes available.')}</p>

      <h3 class="section-title">Example</h3>
      <p class="detail-muted">${escapeHtml(entry.example || 'No example available.')}</p>

      <h3 class="section-title">Class Info Fields</h3>
      ${classInfoSection}

      ${notes.length > 0 ? `<h3 class="section-title">Notes</h3>${buildListHtml(notes)}` : ''}
    `;
  }

  function buildOutputsHtml() {
    return `
      <p class="detail-muted">Outputs define what this block sends to other blocks after conditions/events run.</p>
      ${buildListHtml(catalogSource.outputTemplate)}
    `;
  }

  function buildOutputsHtmlForEntry(entry) {
    if (entry?.supportsOutputs === false) {
      return `
        <p class="detail-muted">This block does not emit outputs by design.</p>
      `;
    }

    if (Array.isArray(entry?.outputTemplate) && entry.outputTemplate.length > 0) {
      return `
        <p class="detail-muted">Outputs define what this block sends to other blocks after conditions/events run.</p>
        ${buildListHtml(entry.outputTemplate)}
      `;
    }

    return buildOutputsHtml();
  }

  function buildInputsHtml() {
    return `
      <p class="detail-muted">Inputs are incoming links from other blocks and are read-only in your docs.</p>
      ${buildListHtml(catalogSource.inputTemplate)}
    `;
  }

  function buildInputsHtmlForEntry(entry) {
    if (Array.isArray(entry?.inputTemplate) && entry.inputTemplate.length > 0) {
      return `
        <p class="detail-muted">Inputs are incoming links from other blocks and are read-only in your docs.</p>
        ${buildListHtml(entry.inputTemplate)}
      `;
    }

    return buildInputsHtml();
  }

  function isDetailTabVisible(tabName) {
    const button = detailTabButtons.find(btn => btn.dataset.tab === tabName);
    return Boolean(button) && button.style.display !== 'none';
  }

  function getFirstVisibleDetailTab() {
    const firstVisible = detailTabButtons.find(btn => btn.style.display !== 'none');
    return firstVisible?.dataset?.tab || 'info';
  }

  function setDetailTabVisibility(tabName, visible) {
    const button = detailTabButtons.find(btn => btn.dataset.tab === tabName);
    const content = detailTabContents[tabName];

    if (button) button.style.display = visible ? '' : 'none';
    if (content) content.style.display = visible ? content.style.display : 'none';
  }

  function updateDetailTabs(entry) {
    const supportsInfo = entry?.showInfoTab !== false;
    const supportsOutputs = entry?.supportsOutputs !== false;
    const supportsInputs = entry?.supportsInputs !== false;
    setDetailTabVisibility('outputs', supportsOutputs);
    setDetailTabVisibility('info', supportsInfo);
    setDetailTabVisibility('inputs', supportsInputs);

    if (detailTabContainer) {
      const visibleCount = detailTabButtons.filter(btn => btn.style.display !== 'none').length;
      detailTabContainer.style.display = visibleCount > 0 ? '' : 'none';
    }
  }

  window.openDetailView = function (blockId, options = {}) {
    const entry = blockCatalog.find(block => block.id === blockId);
    if (!entry) return;

    detailBackScreen = options.originScreen || 'tools-screen';
    if (detailBackScreen === 'conditions-screen') {
      conditionsScrollRestoreTop = Number.isFinite(options.restoreScrollTop)
        ? options.restoreScrollTop
        : (conditionsScroll?.scrollTop || 0);
    }

    updateDetailTabs(entry);

    if (detailHeaderTitle) detailHeaderTitle.innerText = entry.name;
    if (detailInfoContent) detailInfoContent.innerHTML = buildDetailInfo(entry);
    if (detailOutputsContent) detailOutputsContent.innerHTML = buildOutputsHtmlForEntry(entry);
    if (detailInputsContent) detailInputsContent.innerHTML = buildInputsHtmlForEntry(entry);

    switchTab(getFirstVisibleDetailTab());
    navigateTo('detail-screen');
  };

  window.switchTab = function (tabName) {
    if (!isDetailTabVisible(tabName)) {
      tabName = getFirstVisibleDetailTab();
    }

    document.querySelectorAll('.tab-content').forEach(el => {
      el.style.display = 'none';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) activeContent.style.display = 'block';

    const activeTab = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
  };

  window.openCategory = function (menuGroup = 'tools') {
    currentMenuGroup = menuGroup;
    currentSearchTerm = '';

    if (searchInput) searchInput.value = '';
    if (catalogFilter) catalogFilter.value = menuGroup;

    setToolsSubtitle(menuGroup);
    renderCatalog();
    navigateTo('tools-screen');
  };

  window.openConditionsPage = function () {
    currentConditionSearchTerm = '';

    if (conditionSearchInput) {
      conditionSearchInput.value = '';
    }

    renderConditionsPage();
    navigateTo('conditions-screen');
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const nextValue = normalizeText(e.target.value).trim();

      if (searchDebounceTimeoutId) {
        window.clearTimeout(searchDebounceTimeoutId);
      }

      searchDebounceTimeoutId = window.setTimeout(() => {
        currentSearchTerm = nextValue;
        renderCatalog();
      }, 70);
    });
  }

  if (catalogFilter) {
    catalogFilter.addEventListener('change', (event) => {
      currentMenuGroup = event.target.value || 'all';
      setToolsSubtitle(currentMenuGroup);
      renderCatalog();
    });
  }

  if (conditionSearchInput) {
    conditionSearchInput.addEventListener('input', (event) => {
      const nextValue = normalizeText(event.target.value).trim();

      if (conditionSearchDebounceTimeoutId) {
        window.clearTimeout(conditionSearchDebounceTimeoutId);
      }

      conditionSearchDebounceTimeoutId = window.setTimeout(() => {
        currentConditionSearchTerm = nextValue;
        renderConditionsPage();
      }, 70);
    });
  }

  function collectBootImagePaths() {
    const imagePaths = new Set([
      MISSING_TEXTURE_PATH,
      'assets/brr_trigger.png',
      'assets/home.png',
      'assets/power_button.png',
      'assets/bonnie_tech_logo.png',
      'assets/bse_icon_small.png',
      'assets/discord.png',
      'assets/youtube.png',
      'assets/paypal.png'
    ]);

    for (const entry of blockCatalog) {
      imagePaths.add(resolveIconPath(entry));
      imagePaths.add(getFallbackIcon(entry));
    }

    return [...imagePaths].filter(Boolean);
  }

  function preloadImage(src) {
    return new Promise(resolve => {
      const image = new Image();

      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;

      if (image.complete) {
        resolve(true);
      }
    });
  }

  async function preloadBootAssets() {
    const imagePaths = collectBootImagePaths();
    const imagePreloads = imagePaths.map(preloadImage);
    const fontsReadyPromise = document.fonts?.ready
      ? Promise.resolve(document.fonts.ready).catch(() => undefined)
      : Promise.resolve();

    await Promise.race([
      Promise.allSettled([...imagePreloads, fontsReadyPromise]),
      wait(4200)
    ]);
  }

  async function runBootSequence(backgroundReadyPromise) {
    async function runBootStage(message, work, minimumStageDurationMs) {
      const stageStartedAt = Date.now();
      setBootStatus(message);
      await waitForNextPaint();

      if (work) {
        await work;
      }

      const elapsed = Date.now() - stageStartedAt;
      if (elapsed < minimumStageDurationMs) {
        await wait(minimumStageDurationMs - elapsed);
      }
    }

    try {
      await runBootStage('Building catalog...', null, 700);
      await runBootStage('Preloading assets...', preloadBootAssets(), 850);
      await runBootStage('Warming background...', Promise.race([backgroundReadyPromise, wait(2200)]), 750);
      await runBootStage('Finalizing interface...', (async () => {
        await waitForNextPaint();
        await waitForNextPaint();
      })(), 650);
    } catch (e) {
      console.warn('Boot sequence fallback:', e);
    } finally {
      markAppBootReady();
    }
  }

  setToolsSubtitle(currentMenuGroup);
  if (catalogFilter) catalogFilter.value = currentMenuGroup;
  renderCatalog();

  // --- BACKGROUND SYSTEM
  function initBackgroundSystem() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return Promise.resolve();
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve();

    let resolveBackgroundReady;
    const backgroundReadyPromise = new Promise(resolve => {
      resolveBackgroundReady = resolve;
    });

    let hasBackgroundStarted = false;
    let zoomFactor = effectProfile.zoomFactor;
    let spriteCount = effectProfile.spriteCount;
    const sprites = [];
    const loadedImages = [];
    let imagesLoadedCount = 0;
    let animationFrameId = 0;
    let lastFrameTimestamp = 0;

    function notifyBackgroundReady() {
      if (hasBackgroundStarted) return;
      hasBackgroundStarted = true;
      resolveBackgroundReady();
    }

    function resizeCanvas() {
      syncEffectProfile();
      zoomFactor = effectProfile.zoomFactor;
      spriteCount = effectProfile.spriteCount;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
      rebalanceSprites();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const spriteNames = ['sprite1', 'sprite2', 'sprite3', 'sprite4', 'sprite5', 'sprite6', 'sprite7', 'sprite8', 'sprite9', 'sprite10', 'sprite11', 'sprite12', 'sprite13', 'sprite14', 'sprite15'];

    if (spriteNames.length === 0) {
      notifyBackgroundReady();
      return backgroundReadyPromise;
    }

    spriteNames.forEach(name => {
      const img = new Image();
      img.src = `assets/${name}.png`;
      img.onload = () => { loadedImages.push(img); if (++imagesLoadedCount === spriteNames.length) startSystem(); };
      img.onerror = () => { if (++imagesLoadedCount === spriteNames.length) startSystem(); };
    });

    let systemStarted = false;
    function startSystem() {
      if (systemStarted) return;
      systemStarted = true;

      for (let i = 0; i < spriteCount; i++) {
        createSafeSprite(false);
      }
      animationFrameId = requestAnimationFrame(animate);
      notifyBackgroundReady();
    }

    function rebalanceSprites() {
      if (!loadedImages.length) return;

      if (sprites.length < spriteCount) {
        for (let i = sprites.length; i < spriteCount; i++) {
          createSafeSprite(true);
        }
        return;
      }

      if (sprites.length > spriteCount) {
        sprites.length = spriteCount;
      }
    }

    function checkCollision(x, y, w, h, excludeIndex = -1) {
      const buffer = 50; // Extra space to keep them separated
      for (let i = 0; i < sprites.length; i++) {
        if (i === excludeIndex) continue;
        const s = sprites[i];
        const sW = s.width * zoomFactor;
        const sH = s.height * zoomFactor;
        const curW = w * zoomFactor;
        const curH = h * zoomFactor;

        if (x < s.x + sW + buffer &&
          x + curW + buffer > s.x &&
          y < s.y + sH + buffer &&
          y + curH + buffer > s.y) {
          return true;
        }
      }
      return false;
    }

    function createSafeSprite(atEdge = false) {
      if (loadedImages.length === 0) return;
      const img = loadedImages[Math.floor(Math.random() * loadedImages.length)];
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      let x, y, placed = false, attempts = 0;

      while (!placed && attempts < 150) {
        if (atEdge) {
          // Spawn at bottom or left
          if (Math.random() > 0.5) {
            x = Math.random() * canvas.width;
            y = canvas.height + (h * zoomFactor);
          } else {
            x = -(w * zoomFactor) - 50;
            y = Math.random() * canvas.height;
          }
        } else {
          x = Math.random() * canvas.width;
          y = Math.random() * canvas.height;
        }

        if (!checkCollision(x, y, w, h)) {
          const moveSpeed = effectProfile.reduceMotion ? 0.24 : (effectProfile.isMobileLike ? 0.36 : 0.5);
          sprites.push({ x, y, width: w, height: h, img, speedX: moveSpeed, speedY: moveSpeed });
          placed = true;
        }
        attempts++;
      }
    }

    function animate(timestamp = 0) {
      if (document.hidden) {
        lastFrameTimestamp = timestamp;
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      if (!lastFrameTimestamp) {
        lastFrameTimestamp = timestamp;
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const rawFrameDelta = timestamp - lastFrameTimestamp;
      const clampedFrameDelta = Math.min(Math.max(rawFrameDelta, 8), 48);
      const motionScale = clampedFrameDelta / 16.6667;

      lastFrameTimestamp = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < sprites.length; i++) {
        let s = sprites[i];

        s.x += s.speedX * motionScale;
        s.y -= s.speedY * motionScale;

        const sW = s.width * zoomFactor;
        const sH = s.height * zoomFactor;

        ctx.drawImage(s.img, s.x, s.y, s.width * zoomFactor, s.height * zoomFactor);

        if (s.y + sH < -20 || s.x > canvas.width + 20) {
          let newX, newY, found = false, wrapAttempts = 0;

          while (!found && wrapAttempts < 50) {
            // Pick a new edge to spawn from
            if (Math.random() > 0.5) {
              newX = Math.random() * canvas.width;
              newY = canvas.height + 50;
            } else {
              newX = -sW - 50;
              newY = Math.random() * canvas.height;
            }

            // Only move it if the new spot is empty
            if (!checkCollision(newX, newY, s.width, s.height, i)) {
              s.x = newX;
              s.y = newY;
              found = true;
            }
            wrapAttempts++;
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener('beforeunload', () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    });

    return backgroundReadyPromise;
  }
  const backgroundReadyPromise = initBackgroundSystem();
  runBootSequence(backgroundReadyPromise);

  // --- BACKGROUND SCANLINE EFFECT
  // Random Scanline Opacity (32% to 72%)
  function cycleScanlines() {
    const scanlineDiv = document.querySelector('.scanlines');
    if (!scanlineDiv) return;

    const minOpacity = effectProfile.reduceMotion ? 0.18 : 0.32;
    const maxOpacity = effectProfile.reduceMotion ? 0.42 : 0.72;
    const randomOpacity = (Math.random() * (maxOpacity - minOpacity)) + minOpacity;
    scanlineDiv.style.opacity = randomOpacity;

    setTimeout(cycleScanlines, effectProfile.reduceMotion ? 7000 : 5000);
  }
  // Start the cycle
  cycleScanlines();

  function pickNonRepeatingMessage(poolKey, messages) {
    if (!Array.isArray(messages) || messages.length === 0) return '';

    const storageKey = `bse_last_message_${poolKey}`;
    let lastIndex = Number.NaN;

    try {
      lastIndex = Number.parseInt(window.localStorage.getItem(storageKey), 10);
    } catch (e) {
      lastIndex = Number.NaN;
    }

    let nextIndex = Math.floor(Math.random() * messages.length);

    if (messages.length > 1 && Number.isInteger(lastIndex) && nextIndex === lastIndex) {
      nextIndex = (nextIndex + 1 + Math.floor(Math.random() * (messages.length - 1))) % messages.length;
    }

    try {
      window.localStorage.setItem(storageKey, `${nextIndex}`);
    } catch (e) {
      // Ignore storage restrictions in private/incognito contexts.
    }

    return messages[nextIndex];
  }

  function updateWelcomeMessage() {
    const welcomeHeader = document.querySelector('.welcome-header');
    const welcomeText = document.querySelector('.welcome-text');

    if (!welcomeHeader || !welcomeText) return;

    const hour = new Date().getHours();
    let greeting = 'WELCOME';
    let timeBucket = 'default';

    const messagePools = {
      morning: [
        'Early bird gets the logic block.',
        'Coffee first, outputs second.',
        'Fresh session, clean wiring.',
        'Morning build pass initiated.',
        'Sunlight outside, scripts inside.',
        'Perfect time to organize your block names.',
        'Rise and map, creator.',
        'Morning mode: stable and productive.',
        'Good morning, engineer of chaos.',
        'The map is loading before breakfast.',
        'Quick sanity test, then full creative mode.',
        'Start small, ship big by nightfall.'
      ],
      afternoon: [
        'Midday momentum is online.',
        'Hydrate before debugging conditions.',
        'Time for one more map system pass.',
        'Afternoon check: outputs still linked?',
        'Keep stacking clean block chains.',
        'A good hour for polishing details.',
        'Lunch is over, logic is forever.',
        'Afternoon build session engaged.',
        'Great hour to test edge cases.',
        'Map flow audit in progress.',
        'Every saved output counts right now.',
        'Perfect time to tune gameplay pacing.'
      ],
      evening: [
        'Evening shift: cinematic mode.',
        'Prime time for map polish.',
        'Keep the ambience, keep the vibe.',
        'Good hour for gameplay balancing.',
        'Evening calm, stable systems.',
        'One more test run before late night.',
        'Great time to wire final outputs.',
        'Winding down or gearing up?',
        'The night is young and your logic is cleaner.',
        'Visual pass plus bug pass sounds about right.',
        'Tonight is for clean design and cleaner code.',
        'Edge-case hunting begins at sunset.'
      ],
      night: [
        'Still awake, still building.',
        'Night mode: static, scanlines, and focus.',
        'Late-night creators are built different.',
        'The map is quiet but your scripts are not.',
        'One more tweak before bed... probably.',
        'You and the debug log, again.',
        'Night shift in progress.',
        'Bed is calling, but so is iteration 37.',
        'Insomniac engineering online.',
        'The blocks are sleeping, but your ideas are not.',
        'Another reload, another breakthrough.',
        'Sleep timer: delayed by creative mode.',
        'nap time evades you',
        'is sleep afraid?',
        'how much longer?',
        "it's bed time my dudes",
        'i am seriously thinking you like this place',
        'we enjoy your time here but the bed needs you'
      ],
      default: [
        "Access the database for Bonnie's Source Engine."
      ]
    };

    if (hour >= 5 && hour < 12) {
      greeting = 'GOOD MORNING';
      timeBucket = 'morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'GOOD AFTERNOON';
      timeBucket = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'GOOD EVENING';
      timeBucket = 'evening';
    } else {
      greeting = 'GOOD NIGHT';
      timeBucket = 'night';
    }

    welcomeHeader.textContent = greeting;
    const randomMsg = pickNonRepeatingMessage(timeBucket, messagePools[timeBucket] || messagePools.default);
    welcomeText.innerHTML = `${randomMsg}<br><br>Select a category on the left to begin browsing block definitions, logic gates, and entity properties.`;
  }

  updateWelcomeMessage();

  window.triggerPowerOff = function () {
    window.close();
  };


  // --- GLITCHES & EFFECTS
  let glitchIntensity = effectProfile.glitchIntensity;
  const glitchBars = [];
  let maxGlitchBars = effectProfile.maxGlitchBars;
  let flickerTimeoutId = null;
  let flickerStarted = false;
  let staticNoiseTimeoutId = null;
  let rareScreenIntervalId = null;

  function createGlitchBarsPool() {
    if (!glitchClone) return;

    syncEffectProfile();
    glitchIntensity = effectProfile.glitchIntensity;
    maxGlitchBars = effectProfile.maxGlitchBars;

    glitchClone.innerHTML = '';
    glitchBars.length = 0;
    for (let i = 0; i < maxGlitchBars; i++) {
      const bar = document.createElement('div');
      bar.className = 'glitch-bar';
      glitchClone.appendChild(bar);
      glitchBars.push(bar);
    }
  }

  function flashGlitchBar(bar) {
    if (!bar) return;

    const top = Math.random() * 100;
    const height = 2 + Math.random() * (8 + glitchIntensity * 2);
    const width = 65 + Math.random() * 35;
    const left = Math.random() * 10 - 5;
    const shift = (Math.random() - 0.5) * (10 + glitchIntensity * 6);
    const opacity = 0.2 + Math.random() * 0.45;
    const tintA = Math.random() > 0.5 ? 'rgba(255, 92, 92, 0.55)' : 'rgba(98, 174, 255, 0.55)';

    bar.style.top = `${top}%`;
    bar.style.left = `${left}%`;
    bar.style.height = `${height}px`;
    bar.style.width = `${width}%`;
    bar.style.opacity = `${opacity}`;
    bar.style.transform = `translate3d(${shift}px, 0, 0)`;
    bar.style.background = `linear-gradient(90deg, ${tintA}, rgba(255, 255, 255, 0.1), transparent)`;

    window.setTimeout(() => {
      bar.style.opacity = '0';
      bar.style.transform = 'translate3d(0, 0, 0)';
    }, 45 + Math.random() * 110);
  }

  function triggerShredderGlitch() {
    if (!glitchBars.length) return;

    const burstCount = 2 + Math.floor(Math.random() * (3 + glitchIntensity));
    for (let i = 0; i < burstCount; i++) {
      const bar = glitchBars[Math.floor(Math.random() * glitchBars.length)];
      flashGlitchBar(bar);
    }

    document.body.classList.add('glitch-hit');
    window.setTimeout(() => {
      document.body.classList.remove('glitch-hit');
    }, 90);
  }

  createGlitchBarsPool();

  function refreshRuntimeProfile() {
    const previousBars = maxGlitchBars;

    syncEffectProfile();

    if (effectProfile.maxGlitchBars !== previousBars) {
      createGlitchBarsPool();
    }

    scheduleRareScreen();
  }

  window.addEventListener('resize', refreshRuntimeProfile);
  attachMediaQueryListener(reducedMotionQuery, refreshRuntimeProfile);
  attachMediaQueryListener(mobileViewportQuery, refreshRuntimeProfile);
  attachMediaQueryListener(coarsePointerQuery, refreshRuntimeProfile);

  function scheduleFlicker() {
    const randomDelay = Math.random() * effectProfile.flickerDelayRange + effectProfile.flickerDelayMin;

    flickerTimeoutId = window.setTimeout(() => {
      if (!flickerStarted) return;

      const isBootCooldown = bootRevealTimestamp > 0 && (Date.now() - bootRevealTimestamp) < 4200;

      if (!isBootCooldown && !document.hidden && flickerOverlay && !effectProfile.reduceMotion) {
        const opacity = Math.random() * effectProfile.flickerOpacityRange + effectProfile.flickerOpacityMin;
        flickerOverlay.style.opacity = `${opacity}`;
        window.setTimeout(() => {
          flickerOverlay.style.opacity = '0';
        }, 55);
      }

      const glitchChance = effectProfile.reduceMotion ? 0.28 : (effectProfile.isMobileLike ? 0.55 : 0.75);
      if (!isBootCooldown && !document.hidden && Math.random() < glitchChance) {
        triggerShredderGlitch();
      }

      scheduleFlicker();
    }, randomDelay);
  }

  function startFlickerAfterBoot() {
    if (flickerStarted) return;

    if (hasBootRevealRun) {
      flickerStarted = true;
      window.setTimeout(scheduleFlicker, 1200);
      return;
    }

    const waitForBootReveal = window.setInterval(() => {
      if (!hasBootRevealRun) return;
      window.clearInterval(waitForBootReveal);
      flickerStarted = true;
      window.setTimeout(scheduleFlicker, 1200);
    }, 80);
  }

  startFlickerAfterBoot();

  function scheduleRareScreen() {
    if (rareScreenIntervalId) {
      window.clearInterval(rareScreenIntervalId);
      rareScreenIntervalId = null;
    }

    if (effectProfile.disableRareScreen) {
      return;
    }

    const intervalMs = effectProfile.isMobileLike ? 130000 : 100000;
    rareScreenIntervalId = window.setInterval(() => {
      if (!document.hidden) {
        triggerRareScreen();
      }
    }, intervalMs);
  }

  scheduleRareScreen();

  window.addEventListener('beforeunload', () => {
    if (flickerTimeoutId) {
      window.clearTimeout(flickerTimeoutId);
    }

    if (rareScreenIntervalId) {
      window.clearInterval(rareScreenIntervalId);
    }
  });

  const rareMessageCatalog = {
    alwaysSequence: [
      'brr function destabalizing',
      'System restored',
      'Control Panel Error'
    ],
    namedIncidentMessages: [
      'Resonance cascade',
      'Taco Item',
      'Purple Retard',
      'Life Linked',
      'Aliens Attacked',
      'brr_message_here',
      'Yellow Rabbit',
      'Signal Desynchronizing',
      'Renderer Handshake Failed'
    ],
    primaryErrorReports: [
      'event_run.mcfunction failure',
      'mispelled mcfunction file',
      'missing registries',
      'wrong format_version',
      '[redacted] - brr tech',
      'subspaced',
      'max has a lemon',
      'they stole the redstone again',
      'dino found a way to traverse space and time',
      'failed to prevent pvp at spawn area',
      "there's nothing wrong in ba sing se",
      "there's nothing wrong, relax",
      'i got life linked to bonnie again, brb',
      'Fallback Channel Corrupted'
    ],
    additionalErrors: [
      'event_run tps slowdown',
      '20ms slowdown',
      'lobby.mcfunction failure'
    ],
    criticalFakeoutMessages: [
      'Diagnostic Memory Spill',
      'Kernel Collapse Imminent',
      'Emergency Halt Requested'
    ],
    recoveryMessages: [
      'Fixing Error States',
      'Rebooting Interface'
    ],
    recoveryDetails: [
      'Rebuilding visual pipeline and cache index...',
      'Applying safe profile and restoring controls...'
    ],
    // Reserved for future theme-specific incidents/recovery copy.
    themeSpecific: {
      light: { namedIncidentMessages: [], recoveryMessages: [] },
      dark: { namedIncidentMessages: [], recoveryMessages: [] },
      blackmesa: { namedIncidentMessages: [], recoveryMessages: [] },
      xen: { namedIncidentMessages: [], recoveryMessages: [] }
    }
  };

  function pickRandomMessage(poolKey, messages) {
    return pickNonRepeatingMessage(poolKey, messages);
  }

  function getThemeAwarePool(basePool, currentTheme, poolName) {
    const themeOverrides = rareMessageCatalog.themeSpecific[currentTheme]?.[poolName];
    if (!Array.isArray(themeOverrides) || themeOverrides.length === 0) {
      return basePool;
    }

    return [...basePool, ...themeOverrides];
  }

  function buildRareSteps() {
    const currentTheme = normalizeThemeKey(document.body.getAttribute('data-theme') || 'dark');

    const incidentPool = getThemeAwarePool(rareMessageCatalog.namedIncidentMessages, currentTheme, 'namedIncidentMessages');

    const incidentMessage = pickRandomMessage('rare_incident', incidentPool);
    const primaryReport = pickRandomMessage('rare_primary', rareMessageCatalog.primaryErrorReports);

    return [
      {
        title: 'Error',
        text: primaryReport,
        detail: `Incident marker: ${incidentMessage}`
      }
    ];
  }

  function buildPreRareBoxes() {
    if (!preRareOverlay) return [];

    preRareOverlay.innerHTML = '';
    const boxes = [];
    const targetCount = effectProfile.isMobileLike ? 90 : 130;

    for (let i = 0; i < targetCount; i++) {
      const box = document.createElement('div');
      box.className = 'pre-rare-box';

      const widthPx = 28 + Math.floor(Math.random() * (effectProfile.isMobileLike ? 180 : 240));
      const heightPx = 14 + Math.floor(Math.random() * (effectProfile.isMobileLike ? 120 : 170));
      const maxLeft = Math.max(0, window.innerWidth - widthPx);
      const maxTop = Math.max(0, window.innerHeight - heightPx);
      const leftPx = Math.floor(Math.random() * (maxLeft + 1));
      const topPx = Math.floor(Math.random() * (maxTop + 1));

      box.style.width = `${widthPx}px`;
      box.style.height = `${heightPx}px`;
      box.style.left = `${leftPx}px`;
      box.style.top = `${topPx}px`;

      preRareOverlay.appendChild(box);
      boxes.push(box);
    }

    return boxes;
  }

  function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildPreRareFragments(screenElement) {
    if (!preRareOverlay || !screenElement) return [];

    const fragments = [];
    const fragmentCount = effectProfile.isMobileLike ? 3 : 5;

    for (let i = 0; i < fragmentCount; i++) {
      const widthPx = Math.floor(window.innerWidth * (0.2 + Math.random() * 0.24));
      const heightPx = Math.floor(window.innerHeight * (0.12 + Math.random() * 0.2));
      const maxLeft = Math.max(0, window.innerWidth - widthPx);
      const maxTop = Math.max(0, window.innerHeight - heightPx);
      const leftPx = Math.floor(Math.random() * (maxLeft + 1));
      const topPx = Math.floor(Math.random() * (maxTop + 1));

      const fragment = document.createElement('div');
      fragment.className = 'pre-rare-fragment';
      fragment.style.width = `${widthPx}px`;
      fragment.style.height = `${heightPx}px`;
      fragment.style.left = `${leftPx}px`;
      fragment.style.top = `${topPx}px`;

      const content = document.createElement('div');
      content.className = 'pre-rare-fragment-content';
      const clone = screenElement.cloneNode(true);
      clone.classList.add('active');
      clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      clone.querySelectorAll('[onclick],[onerror],[onload]').forEach(node => {
        node.removeAttribute('onclick');
        node.removeAttribute('onerror');
        node.removeAttribute('onload');
      });
      clone.style.pointerEvents = 'none';
      clone.style.position = 'absolute';
      clone.style.left = `${-leftPx + (Math.random() > 0.5 ? 14 : -14)}px`;
      clone.style.top = `${-topPx + (Math.random() > 0.5 ? 10 : -10)}px`;
      clone.style.width = `${window.innerWidth}px`;
      clone.style.height = `${window.innerHeight}px`;
      content.appendChild(clone);
      fragment.appendChild(content);
      preRareOverlay.appendChild(fragment);
      fragments.push(fragment);
    }

    return fragments;
  }


  function triggerRareScreen() {
    if (!rareScreen) return;
    if (effectProfile.disableRareScreen) return;
    if (document.body.classList.contains('rare-distorting')) return;

    document.body.classList.add('rare-distorting');
    document.body.classList.add('pre-rare-distort');
    document.documentElement.style.setProperty('--pre-rare-progress', '0');
    document.documentElement.style.setProperty('--pre-rare-shift-x', '0px');
    document.documentElement.style.setProperty('--pre-rare-shift-y', '0px');
    rareScreen.classList.remove('active');
    rareScreen.classList.remove('pre-glitch');
    if (preRareOverlay) {
      preRareOverlay.classList.remove('full-cover');
      preRareOverlay.classList.add('active');
    }

    const screenElement = document.querySelector('.screen.active');
    const globalNav = document.getElementById('global-nav');
    const footer = document.querySelector('.footer');
    const versionTag = document.getElementById('version-tag');

    if (screenElement) screenElement.style.pointerEvents = 'none';
    if (globalNav) globalNav.style.pointerEvents = 'none';
    if (footer) footer.style.pointerEvents = 'none';
    if (versionTag) versionTag.style.pointerEvents = 'none';

    const rareSteps = buildRareSteps();
    const preBuildDurationMs = 2100 + Math.floor(Math.random() * 900);
    const preBuildStartedAt = Date.now();

    let rareStepIndex = 0;
    function renderRareStep(step) {
      if (!step) return;
      if (rareTitle) rareTitle.textContent = step.title;
      if (rareText) rareText.textContent = step.text;
      if (rareSubtext) rareSubtext.textContent = step.detail;
    }

    const preBoxes = buildPreRareBoxes();
    const preFragments = buildPreRareFragments(screenElement);
    const revealables = shuffleArray([...preBoxes, ...preFragments]);
    let revealCursor = 0;

    const preGlitchBursts = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < preGlitchBursts; i++) {
      window.setTimeout(() => {
        triggerShredderGlitch();
      }, 36 * i);
    }

    const preBuildTimer = window.setInterval(() => {
      const elapsed = Date.now() - preBuildStartedAt;
      const progress = Math.min(1, elapsed / preBuildDurationMs);
      document.documentElement.style.setProperty('--pre-rare-progress', `${progress.toFixed(3)}`);

      const shiftAmplitude = 1 + progress * (effectProfile.isMobileLike ? 10 : 16);
      const shiftX = ((Math.random() - 0.5) * shiftAmplitude).toFixed(2);
      const shiftY = ((Math.random() - 0.5) * shiftAmplitude).toFixed(2);
      document.documentElement.style.setProperty('--pre-rare-shift-x', `${shiftX}px`);
      document.documentElement.style.setProperty('--pre-rare-shift-y', `${shiftY}px`);

      const remaining = revealables.length - revealCursor;
      if (remaining <= 0) return;

      const burstCeiling = (effectProfile.isMobileLike ? 4 : 6) + Math.floor(progress * (effectProfile.isMobileLike ? 8 : 16));
      const burst = 1 + Math.floor(Math.random() * Math.max(2, burstCeiling));
      const revealNow = Math.min(remaining, burst);
      for (let i = 0; i < revealNow; i++) {
        revealables[revealCursor + i]?.classList.add('active');
      }
      revealCursor += revealNow;

      const glitchChance = 0.22 + (progress * 0.72);
      if (Math.random() < glitchChance) {
        triggerShredderGlitch();
      }
    }, effectProfile.isMobileLike ? 46 : 38);

    let messageTimer = null;
    const fullCoverHoldMs = 220;
    window.setTimeout(() => {
      window.clearInterval(preBuildTimer);
      revealables.forEach(node => node.classList.add('active'));
      document.documentElement.style.setProperty('--pre-rare-progress', '1');
      if (preRareOverlay) {
        preRareOverlay.classList.add('full-cover');
      }

      window.setTimeout(() => {
        if (preRareOverlay) {
          preRareOverlay.classList.remove('active');
          preRareOverlay.classList.remove('full-cover');
          preRareOverlay.innerHTML = '';
        }

        document.body.classList.remove('pre-rare-distort');
        document.documentElement.style.setProperty('--pre-rare-progress', '0');
        document.documentElement.style.setProperty('--pre-rare-shift-x', '0px');
        document.documentElement.style.setProperty('--pre-rare-shift-y', '0px');

        rareScreen.classList.add('active');

        renderRareStep(rareSteps[0]);
        if (rareSteps.length > 1) {
          messageTimer = window.setInterval(() => {
            rareStepIndex += 1;
            if (rareStepIndex >= rareSteps.length) {
              window.clearInterval(messageTimer);
              return;
            }
            renderRareStep(rareSteps[rareStepIndex]);
          }, 540);
        }
      }, fullCoverHoldMs);
    }, preBuildDurationMs);

    const distortionTimer = window.setInterval(() => {
      const hueShift = Math.floor((Math.random() - 0.5) * 34);
      document.documentElement.style.setProperty('--rare-shift-x', '0px');
      document.documentElement.style.setProperty('--rare-shift-y', '0px');
      document.documentElement.style.setProperty('--rare-hue-shift', `${hueShift}deg`);
    }, 70);

    window.setTimeout(() => {
      window.clearInterval(preBuildTimer);
      window.clearInterval(distortionTimer);
      if (messageTimer) {
        window.clearInterval(messageTimer);
      }
      document.body.classList.remove('rare-distorting');
      document.body.classList.remove('pre-rare-distort');
      document.documentElement.style.setProperty('--pre-rare-progress', '0');
      document.documentElement.style.setProperty('--pre-rare-shift-x', '0px');
      document.documentElement.style.setProperty('--pre-rare-shift-y', '0px');
      rareScreen.classList.remove('active');
      rareScreen.classList.remove('pre-glitch');
      document.documentElement.style.setProperty('--rare-shift-x', '0px');
      document.documentElement.style.setProperty('--rare-shift-y', '0px');
      document.documentElement.style.setProperty('--rare-hue-shift', '0deg');

      if (preRareOverlay) {
        preRareOverlay.classList.remove('active');
        preRareOverlay.classList.remove('full-cover');
        preRareOverlay.innerHTML = '';
      }

      if (rareTitle) rareTitle.textContent = 'System Error';
      if (rareText) rareText.textContent = 'Signal Desynchronizing';
      if (rareSubtext) rareSubtext.textContent = 'Collecting fault context...';

      if (screenElement) screenElement.style.pointerEvents = '';
      if (globalNav) globalNav.style.pointerEvents = '';
      if (footer) footer.style.pointerEvents = '';
      if (versionTag) versionTag.style.pointerEvents = '';
    }, preBuildDurationMs + fullCoverHoldMs + 3200);
  }
});