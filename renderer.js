document.addEventListener('DOMContentLoaded', () => {
  // --- UI ELEMENTS
  const modalOverlay = document.getElementById('modalOverlay');
  const modalWindow = document.getElementById('modalWindow');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModal');
  const searchInput = document.getElementById('searchInput');
  const modalHeader = document.getElementById('modalHeader');
  const container = document.getElementById('sprite-container');

  // --- AUDIO & EFFECTS ELEMENTS
  const staticOverlay = document.getElementById('staticOverlay');
  const staticSound = document.getElementById('staticSound');
  const rareSound = document.getElementById('rareSound');
  const rareScreen = document.getElementById('rare-screen');
  const flickerOverlay = document.getElementById('flicker-overlay');
  const glitchClone = document.getElementById('glitch-clone');

  // --- EASTER EGG ELEMENTS
  const footerTrigger = document.getElementById('footer-trigger');
  const versionTag = document.getElementById('version-tag');

  // Accessibility
  if (modalOverlay) {
    modalOverlay.setAttribute('aria-hidden', 'true');
    modalWindow.setAttribute('role', 'dialog');
    modalWindow.setAttribute('aria-modal', 'true');
  }

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
    if (screenId === 'main-menu') {
      homeBtn.classList.add('hidden'); // Hide Home button on main menu
    } else {
      homeBtn.classList.remove('hidden'); // Show on all other screens
    }

    // Update Placeholder Title if needed
    if (screenId === 'placeholder-screen' && title) {
      document.getElementById('placeholder-title').textContent = title;
    }
  };

  // Data store for simple example content
  const toolData = {
    'ui_basics': "Detailed information about System Basics. Describes how the UI interacts with the user.",
    'func_train': "Detailed information about Func Train. Used for creating moving platforms that follow path_tracks."
  };

  window.openDetailView = function (name, imgSrc, dataKey) {
    // Set Header
    document.getElementById('detail-header-title').innerText = name;

    // Set Info Content
    const infoContainer = document.getElementById('detail-info-content');
    const description = toolData[dataKey] || "No specific class info available.";

    infoContainer.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px;">
            <img src="${imgSrc}" style="image-rendering: pixelated; width: 64px; height: 64px; border: 2px solid #000; background: rgba(0,0,0,0.3);">
            <div class="desc-box" style="flex-grow: 1;">${description}</div>
        </div>
    `;

    // Reset Tabs
    switchTab('info');

    // Navigate
    navigateTo('detail-screen');
  };

  window.switchTab = function (tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show active
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('onclick').includes(tabName)) {
        btn.classList.add('active');
      }
    });
  };

  // --- BACKGROUND SYSTEM
  function initBackgroundSystem() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const zoomFactor = 10;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const spriteNames = ['sprite1', 'sprite2', 'sprite3', 'sprite4', 'sprite5', 'sprite6', 'sprite7', 'sprite8', 'sprite9', 'sprite10', 'sprite11', 'sprite12', 'sprite13', 'sprite14', 'sprite15'];
    const spriteCount = 20;
    const sprites = [];
    const loadedImages = [];
    let imagesLoadedCount = 0;

    spriteNames.forEach(name => {
      const img = new Image();
      img.src = `assets/${name}.png`;
      img.onload = () => { loadedImages.push(img); if (++imagesLoadedCount === spriteNames.length) startSystem(); };
      img.onerror = () => { if (++imagesLoadedCount === spriteNames.length) startSystem(); };
    });

    function startSystem() {
      for (let i = 0; i < spriteCount; i++) {
        createSafeSprite(false);
      }
      animate();
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
          sprites.push({ x, y, width: w, height: h, img, speedX: 0.5, speedY: 0.5 });
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
  }
  initBackgroundSystem();

  // --- BACKGROUND SCANLINE EFFECT
  // Random Scanline Opacity (32% to 72%)
  function cycleScanlines() {
    const scanlineDiv = document.querySelector('.scanlines');
    if (!scanlineDiv) return;

    // Random percentage between 0.32 and 0.72
    const randomOpacity = (Math.random() * (0.72 - 0.32)) + 0.32;
    scanlineDiv.style.opacity = randomOpacity;

    setTimeout(cycleScanlines, 5000);
  }
  // Start the cycle
  cycleScanlines();

  // --- EASTER EGG
  let eggStep = 0;
  if (footerTrigger && versionTag) {
    footerTrigger.addEventListener('click', () => {
      eggStep = 1;
    });

    versionTag.addEventListener('click', () => {
      if (eggStep === 1) {
        document.body.classList.add('egg-active'); // Toggle the class
        eggStep = 0;


        setTimeout(() => {
          document.body.classList.remove('egg-active');
        }, 5000);

      }
    });
  }

  window.triggerPowerOff = function () {
    // Placeholder for MP4 logic
    alert("System Shutdown Sequence Initiated... [MP4 Placeholder]");
    window.close();
  };


  // --- GLITCHES & EFFECTS
  function triggerChunkGlitch() {
    if (!glitchClone) return;

    // Capture the current visible screen for the glitch
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;

    glitchClone.innerHTML = activeScreen.innerHTML;
    glitchClone.style.display = 'block';

    const top = Math.random() * 80;
    const height = Math.random() * 20 + 5;
    const bottom = 100 - (top + height);

    glitchClone.style.clipPath = `inset(${top}% 0 ${bottom}% 0)`;

    const moveX = (Math.random() - 0.5) * 40;
    const moveY = (Math.random() - 0.5) * 10;
    glitchClone.style.transform = `translate(${moveX}px, ${moveY}px)`;

    setTimeout(() => {
      glitchClone.style.display = 'none';
      glitchClone.innerHTML = '';
    }, Math.random() * 150 + 50);
  }


  // --- FLICKER & AMBIANCE
  function triggerFlicker() {
    const randomDelay = Math.random() * 9000 + 1000;

    setTimeout(() => {
      const opacity = Math.random() * 0.4 + 0.1;
      if (flickerOverlay) {
        flickerOverlay.style.opacity = opacity;
        setTimeout(() => { flickerOverlay.style.opacity = 0; }, 50);
        setTimeout(() => { flickerOverlay.style.opacity = opacity * 1.5; }, 100);
        setTimeout(() => { flickerOverlay.style.opacity = 0; }, 200);
      }

      if (Math.random() > 0.6) {
        triggerChunkGlitch();
      }

      triggerFlicker();
    }, randomDelay);
  }
  triggerFlicker();

  setInterval(() => {
    const noiseLevel = 0.08 + (Math.random() * 0.12);
    if (staticOverlay) staticOverlay.style.opacity = noiseLevel;
    if (staticSound) staticSound.volume = Math.max(0, Math.min(1, noiseLevel));
  }, 500);


  // --- RARE SCREEN
  setInterval(() => {
    triggerRareScreen();
  }, 100000);

  function triggerRareScreen() {
    if (!rareScreen) return;

    document.body.classList.add('no-scroll');
    rareScreen.classList.add('active');

    if (rareSound) {
      rareSound.currentTime = 0;
      rareSound.volume = 0.5;
      safePlay(rareSound);
    }

    setTimeout(() => {
      rareScreen.classList.remove('active');
      document.body.classList.remove('no-scroll');
      if (rareSound) {
        rareSound.pause();
        rareSound.currentTime = 0;
      }
    }, 2000);
  }

  // --- STANDARD UI LOGIC

  // Card Click
  document.querySelectorAll('.block-card').forEach(card => {
    const img = card.querySelector('.card-img');
    const title = card.querySelector('.card-title')?.innerText?.trim();
    if (img && (!img.alt || img.alt === '')) img.alt = title ? `${title} icon` : 'Block icon';
    card.addEventListener('click', () => openModal(card));
  });

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll('.block-card').forEach(card => {
        const title = card.querySelector('.card-title')?.innerText?.toLowerCase() || '';
        card.style.display = title.includes(term) ? 'block' : 'none';
      });
    });
  }

  // Modal Open
  window.openModal = function (cardElement) {
    const title = cardElement.querySelector('.card-title')?.innerText || 'Details';
    const imgElem = cardElement.querySelector('.card-img');
    const imgSrc = imgElem ? imgElem.src : '';
    const detailsHTML = cardElement.querySelector('.details-content')?.innerHTML || '';

    modalTitle.innerText = title;
    modalBody.innerHTML = `<img src="${imgSrc}" alt="${title} icon" class="modal-big-img">${detailsHTML}`;

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    if (closeModalBtn) closeModalBtn.focus();
    document.addEventListener('keydown', handleKeyDown);
  };

  // Modal Close
  function closeModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleKeyDown);
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function handleKeyDown(e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
  }

  // Modal Drag Logic
  let isDragging = false;
  let startX, startY, offsetX = 0, offsetY = 0;

  if (modalHeader) {
    modalHeader.addEventListener('pointerdown', (e) => {
      if (e.target === closeModalBtn || closeModalBtn.contains(e.target)) return;
      isDragging = true;
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
      modalHeader.setPointerCapture(e.pointerId);
    });

    document.addEventListener('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        const style = window.getComputedStyle(modalWindow);
        const matrix = new WebKitCSSMatrix(style.transform);
        offsetX = matrix.m41;
        offsetY = matrix.m42;
      }
    });

    document.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.clientX - startX;
      const y = e.clientY - startY;
      modalWindow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  // Startup Line cleanup
  const startupLine = document.querySelector('.startup-line');
  if (startupLine) {
    startupLine.addEventListener('animationend', () => {
      const screen = document.getElementById('startup-screen');
      if (screen && screen.parentNode) screen.parentNode.removeChild(screen);
    });
    setTimeout(() => {
      const screen = document.getElementById('startup-screen');
      if (screen && screen.parentNode) screen.parentNode.removeChild(screen);
    }, 3000);
  }
});