document.addEventListener('DOMContentLoaded', () => {
  // --- UI ELEMENTS
  const searchInput = document.getElementById('searchInput');

  // --- AUDIO & EFFECTS ELEMENTS
  const staticSound = document.getElementById('staticSound');
  const rareSound = document.getElementById('rareSound');
  const rareScreen = document.getElementById('rare-screen');
  const flickerOverlay = document.getElementById('flicker-overlay');
  const glitchClone = document.getElementById('glitch-clone');

  // --- EASTER EGG ELEMENTS
  const footerTrigger = document.getElementById('footer-trigger');
  const versionTag = document.getElementById('version-tag');
  const bootOverlay = document.getElementById('boot-overlay');
  const bootStatus = document.getElementById('boot-status');

  let appBootIsReady = false;
  let splashHasFinished = false;
  let hasBootRevealRun = false;

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
    if (hasBootRevealRun || !appBootIsReady || !splashHasFinished) return;
    hasBootRevealRun = true;

    waitForNextPaint().then(() => {
      document.body.classList.add('app-ready');
      document.body.classList.remove('app-booting');

      if (bootOverlay) {
        bootOverlay.setAttribute('aria-busy', 'false');
      }
    });
  }

  function markAppBootReady() {
    appBootIsReady = true;
    tryRevealApp();
  }

  function markSplashFinished() {
    splashHasFinished = true;
    tryRevealApp();
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewportQuery = window.matchMedia('(max-width: 900px)');
  const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

  function getEffectProfile() {
    const reduceMotion = reducedMotionQuery.matches;
    const isMobileLike = mobileViewportQuery.matches || coarsePointerQuery.matches;

    return {
      reduceMotion,
      isMobileLike,
      spriteCount: reduceMotion ? 7 : (isMobileLike ? 10 : 20),
      zoomFactor: isMobileLike ? 8 : 10,
      glitchIntensity: reduceMotion ? 2 : (isMobileLike ? 4 : 6),
      maxGlitchBars: reduceMotion ? 8 : (isMobileLike ? 12 : 18),
      flickerDelayMin: reduceMotion ? 3600 : (isMobileLike ? 2600 : 1600),
      flickerDelayRange: reduceMotion ? 5200 : (isMobileLike ? 5200 : 3800),
      flickerOpacityMin: reduceMotion ? 0.04 : (isMobileLike ? 0.07 : 0.1),
      flickerOpacityRange: reduceMotion ? 0.12 : (isMobileLike ? 0.2 : 0.32),
      staticMin: reduceMotion ? 0.03 : (isMobileLike ? 0.04 : 0.06),
      staticRange: reduceMotion ? 0.08 : (isMobileLike ? 0.12 : 0.16),
      staticIntervalMs: reduceMotion ? 1400 : (isMobileLike ? 1200 : 900)
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

  // --- AUDIO
  function safePlay(audioElem) {
    if (!audioElem) return;
    if (audioElem.readyState >= 1 || (audioElem.currentSrc && audioElem.currentSrc !== '')) {
      const playPromise = audioElem.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn(`Audio play suppressed for ${audioElem.id}:`, e.message);
        });
      }
    }
  }

  // Initialize Static Loop
  try {
    if (staticSound) {
      staticSound.volume = 0.05;
      const p = staticSound.play();
      if (p !== undefined) {
        p.catch(() => {
          document.addEventListener('click', () => safePlay(staticSound), { once: true });
        });
      }
    }
  } catch (e) { console.warn(e); }


  // --- SCREEN NAVIGATION SYSTEM
  window.navigateTo = function (screenId, title = null) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    // Handle Global Navigation Buttons
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
      if (screenId === 'main-menu') {
        homeBtn.classList.add('hidden'); // Hide Home button on main menu
      } else {
        homeBtn.classList.remove('hidden'); // Show on all other screens
      }
    }

    // Update Placeholder Title if needed
    if (screenId === 'placeholder-screen' && title) {
      document.getElementById('placeholder-title').textContent = title;
    }
  };

  const blockGrid = document.getElementById('blockGrid');
  const toolsSubtitle = document.getElementById('tools-subtitle');
  const catalogCount = document.getElementById('catalog-count');
  const catalogEmpty = document.getElementById('catalog-empty');
  const detailHeaderTitle = document.getElementById('detail-header-title');
  const detailInfoContent = document.getElementById('detail-info-content');
  const detailOutputsContent = document.getElementById('detail-outputs-content');
  const detailExistingContent = document.getElementById('detail-existing-content');
  const detailInputsContent = document.getElementById('detail-inputs-content');

  const catalogSource = window.BSECatalog || {
    entries: [],
    outputTemplate: [],
    existingOutputTemplate: [],
    inputTemplate: [],
    iconMap: {}
  };

  const blockCatalog = Array.isArray(catalogSource.entries) ? catalogSource.entries : [];
  const menuLabels = {
    tools: 'Tools & Blocks',
    brushes: 'Brushes & Environment',
    logic: 'Logic Blocks',
    game: 'Game & Mode Blocks'
  };

  let currentMenuGroup = 'tools';
  let currentSearchTerm = '';
  let searchDebounceTimeoutId = null;

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
    Brushes: 'assets/brr_skybox.png',
    Logic: 'assets/logic_auto.png',
    Game: 'assets/game_round_win.png',
    Environment: 'assets/env_particles.png',
    Internal: 'assets/brr_nodraw.png'
  };

  function getFallbackIcon(entry) {
    return categoryFallbackIcons[entry?.category] || 'assets/brr_trigger.png';
  }

  function resolveIconPath(entry) {
    const mapped = catalogSource?.iconMap?.[entry.id];
    if (mapped) return mapped;
    return `assets/${entry.id}.png`;
  }

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
      .filter(entry => (currentMenuGroup === 'tools' ? true : entry.menuGroup === currentMenuGroup))
      .filter(entry => {
        if (!currentSearchTerm) return true;

        const haystack = searchableCatalogTextById.get(entry.id) || '';

        return haystack.includes(currentSearchTerm);
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
    }

    filtered.forEach(entry => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'block-card';

      const icon = resolveIconPath(entry);
      const fallbackIcon = getFallbackIcon(entry);
      card.innerHTML = `
        <div class="card-top">
          <img src="${escapeHtml(icon)}" data-fallback="${escapeHtml(fallbackIcon)}" class="card-img" alt="${escapeHtml(entry.name)} icon" loading="lazy" decoding="async" onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.onerror=null;}">
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

    return `
      <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px;">
        <div class="card-top" style="width: 96px; min-width: 96px; min-height: 96px;">
          <img src="${escapeHtml(icon)}" data-fallback="${escapeHtml(fallbackIcon)}" alt="${escapeHtml(entry.name)} icon" class="card-img" onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.onerror=null;}">
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
      ${buildListHtml(entry.classInfo)}

      ${notes.length > 0 ? `<h3 class="section-title">Notes</h3>${buildListHtml(notes)}` : ''}
    `;
  }

  function buildOutputsHtml() {
    return `
      <p class="detail-muted">Outputs define what this block sends to other blocks after conditions/events run.</p>
      ${buildListHtml(catalogSource.outputTemplate)}
    `;
  }

  function buildExistingOutputsHtml() {
    return `
      <p class="detail-muted">This tab is for managing already-saved outputs on the selected block.</p>
      ${buildListHtml(catalogSource.existingOutputTemplate)}
    `;
  }

  function buildInputsHtml() {
    return `
      <p class="detail-muted">Inputs are incoming links from other blocks and are read-only in your docs.</p>
      ${buildListHtml(catalogSource.inputTemplate)}
    `;
  }

  window.openDetailView = function (blockId) {
    const entry = blockCatalog.find(block => block.id === blockId);
    if (!entry) return;

    if (detailHeaderTitle) detailHeaderTitle.innerText = entry.name;
    if (detailInfoContent) detailInfoContent.innerHTML = buildDetailInfo(entry);
    if (detailOutputsContent) detailOutputsContent.innerHTML = buildOutputsHtml();
    if (detailExistingContent) detailExistingContent.innerHTML = buildExistingOutputsHtml();
    if (detailInputsContent) detailInputsContent.innerHTML = buildInputsHtml();

    switchTab('info');
    navigateTo('detail-screen');
  };

  window.switchTab = function (tabName) {
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

    setToolsSubtitle(menuGroup);
    renderCatalog();
    navigateTo('tools-screen');
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

  function collectBootImagePaths() {
    const imagePaths = new Set([
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
    try {
      setBootStatus('Building catalog...');
      await waitForNextPaint();

      setBootStatus('Preloading assets...');
      await preloadBootAssets();

      setBootStatus('Warming background...');
      await Promise.race([backgroundReadyPromise, wait(2200)]);

      setBootStatus('Finalizing interface...');
      await waitForNextPaint();
      await waitForNextPaint();
    } catch (e) {
      console.warn('Boot sequence fallback:', e);
    } finally {
      markAppBootReady();
    }
  }

  setToolsSubtitle(currentMenuGroup);
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
      animate();
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

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < sprites.length; i++) {
        let s = sprites[i];

        s.x += s.speedX;
        s.y -= s.speedY;

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
      requestAnimationFrame(animate);
    }

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

  // --- EASTER EGG
  let eggStep = 0;
  if (footerTrigger && versionTag) {
    footerTrigger.addEventListener('click', () => {
      eggStep = 1;
    });

    versionTag.addEventListener('click', () => {
      if (eggStep === 1) {
        document.body.classList.add('egg-active');
        eggStep = 0;

        // Disable global filter
        document.documentElement.style.filter = 'none';

        // --- FLICKER EFFECT SEQUENCE ---
        // Wait 4 seconds, then start flickering
        setTimeout(() => {
          let flickerCount = 0;
          const maxFlickers = 6; // How many times it blinks

          const flickerInterval = setInterval(() => {
            // Toggle class
            document.body.classList.toggle('egg-active');

            // Toggle filter
            if (document.body.classList.contains('egg-active')) {
              document.documentElement.style.filter = 'none';
            } else {
              document.documentElement.style.filter = ''; // Reset to CSS default
            }

            flickerCount++;
            if (flickerCount >= maxFlickers) {
              clearInterval(flickerInterval);
              // Ensure it ends OFF
              document.body.classList.remove('egg-active');
              document.documentElement.style.filter = '';
            }
          }, 200); // Blink every 200ms
        }, 4000); // Start flickering after 4 seconds
      }
    });
  }

  window.triggerPowerOff = function () {
    // Placeholder for MP4 logic
    alert("System Shutdown Sequence Initiated... [MP4 Placeholder]");
    window.close();
  };


  // --- GLITCHES & EFFECTS
  let glitchIntensity = effectProfile.glitchIntensity;
  const glitchBars = [];
  let maxGlitchBars = effectProfile.maxGlitchBars;
  let flickerTimeoutId = null;
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
    const previousMobileState = effectProfile.isMobileLike;

    syncEffectProfile();

    if (effectProfile.maxGlitchBars !== previousBars) {
      createGlitchBarsPool();
    }

    if (effectProfile.isMobileLike !== previousMobileState) {
      scheduleRareScreen();
    }
  }

  window.addEventListener('resize', refreshRuntimeProfile);
  attachMediaQueryListener(reducedMotionQuery, refreshRuntimeProfile);
  attachMediaQueryListener(mobileViewportQuery, refreshRuntimeProfile);
  attachMediaQueryListener(coarsePointerQuery, refreshRuntimeProfile);

  function scheduleFlicker() {
    const randomDelay = Math.random() * effectProfile.flickerDelayRange + effectProfile.flickerDelayMin;

    flickerTimeoutId = window.setTimeout(() => {
      if (!document.hidden && flickerOverlay && !effectProfile.reduceMotion) {
        const opacity = Math.random() * effectProfile.flickerOpacityRange + effectProfile.flickerOpacityMin;
        flickerOverlay.style.opacity = `${opacity}`;
        window.setTimeout(() => {
          flickerOverlay.style.opacity = '0';
        }, 55);
      }

      const glitchChance = effectProfile.reduceMotion ? 0.28 : (effectProfile.isMobileLike ? 0.55 : 0.75);
      if (!document.hidden && Math.random() < glitchChance) {
        triggerShredderGlitch();
      }

      scheduleFlicker();
    }, randomDelay);
  }
  scheduleFlicker();

  function updateStaticNoise() {
    if (document.hidden) {
      if (staticSound) staticSound.volume = 0;
      return;
    }

    const noiseLevel = effectProfile.staticMin + (Math.random() * effectProfile.staticRange);

    if (staticSound) {
      staticSound.volume = Math.max(0, Math.min(0.2, noiseLevel * 0.55));
    }
  }

  function scheduleStaticNoise() {
    updateStaticNoise();
    staticNoiseTimeoutId = window.setTimeout(scheduleStaticNoise, effectProfile.staticIntervalMs);
  }

  scheduleStaticNoise();

  function scheduleRareScreen() {
    if (rareScreenIntervalId) {
      window.clearInterval(rareScreenIntervalId);
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

    if (staticNoiseTimeoutId) {
      window.clearTimeout(staticNoiseTimeoutId);
    }

    if (rareScreenIntervalId) {
      window.clearInterval(rareScreenIntervalId);
    }
  });


  // --- RARE SCREEN
  function triggerRareScreen() {
    if (!rareScreen) return;

    // 1. Audio & Tunnel Effect
    if (rareSound) {
      rareSound.currentTime = 0;
      rareSound.volume = 0.5;
      safePlay(rareSound);
    }

    // Add tunnel class to body or a wrapper
    document.body.classList.add('tunnel-effect');

    // 2. Start Black Bars
    setTimeout(() => {
      let barCount = 0;
      const maxBars = 40;
      const interval = setInterval(() => {
        const bar = document.createElement('div');
        bar.classList.add('black-bar');
        bar.style.width = (Math.random() * 60 + 40) + '%';
        bar.style.height = (Math.random() * 15 + 5) + '%';
        bar.style.top = (Math.random() * 100) + '%';
        bar.style.left = (Math.random() * 100 - 20) + '%';
        document.body.appendChild(bar);

        barCount++;
        if (barCount >= maxBars) {
          clearInterval(interval);
          finalizeRareScreen();
        }
      }, 80); // Fast spawn
    }, 2000); // Start bars after 2s of tunneling

    function finalizeRareScreen() {
      // Create full cover
      const fullCover = document.createElement('div');
      fullCover.classList.add('black-bar');
      fullCover.style.inset = '0';
      fullCover.style.width = '100%';
      fullCover.style.height = '100%';
      document.body.appendChild(fullCover);

      // Stop tunnel effect so "Please Stand By" is flat
      document.body.classList.remove('tunnel-effect');
      document.body.style.transform = 'none';

      // Show Rare Screen (Z-Index is fixed in CSS now)
      rareScreen.classList.add('active');

      // Reset after 3 seconds
      setTimeout(() => {
        rareScreen.classList.remove('active');

        // Remove all bars
        document.querySelectorAll('.black-bar').forEach(b => b.remove());

        // Clean transforms
        document.body.style.transform = '';

      }, 3000);
    }
  }

  // --- STARTUP VIDEO LOGIC ---
  const video = document.getElementById('startup-video');
  const startupScreen = document.getElementById('startup-screen'); // Old white line screen

  function finalizeStartupSplash() {
    if (video) {
      video.style.display = 'none';
    }
    markSplashFinished();
  }

  if (video) {
    // Hide old screen immediately
    if (startupScreen) startupScreen.style.display = 'none';

    video.style.display = 'block';

    // Play video
    video.play().catch(e => {
      console.warn("Video autoplay blocked:", e);
      finalizeStartupSplash();
    });

    video.onended = () => {
      finalizeStartupSplash();
    };

    // Safety timeout (5.5s) in case video stalls
    setTimeout(() => {
      if (video.style.display !== 'none') finalizeStartupSplash();
    }, 5500);
  } else {
    markSplashFinished();
  }
});
