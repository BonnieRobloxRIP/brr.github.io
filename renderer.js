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

  function updateWelcomeMessage() {
    const welcomeHeader = document.querySelector('.welcome-header');
    const welcomeText = document.querySelector('.welcome-text');

    if (!welcomeHeader || !welcomeText) return;

    const hour = new Date().getHours();
    let greeting = "WELCOME";
    let subMessages = ["Access the database for Bonnie's Source Engine."];

    // 1. Determine Time of Day
    if (hour >= 5 && hour < 12) {
      greeting = "GOOD MORNING";
      subMessages = [
        "Early bird gets the worm.",
        "Coffee first, logic gates later.",
        "The sun is up, why are you inside?"
      ];
    } else if (hour >= 12 && hour < 17) {
      greeting = "GOOD AFTERNOON";
      subMessages = [
        "Mid-day productivity spike?",
        "Don't forget to hydrate.",
        "Lunch break is over."
      ];
    } else if (hour >= 17 && hour < 21) {
      greeting = "GOOD EVENING?";
      subMessages = [
        "Winding down or gearing up?",
        "The night is young.",
        "Perfect time for coding."
      ];
    } else {
      // Night / Late Night (9PM - 5AM)
      greeting = "GOOD NIGHT";
      subMessages = [
        "nap time evades you",
        "is sleep afraid?",
        "how much longer?",
        "it's bed time my dudes",
        "i am seriously thinking you like this place",
        "we enjoy your time here but the bed needs you"
      ];
    }

    // 2. Set Text
    welcomeHeader.textContent = greeting;
    const randomMsg = subMessages[Math.floor(Math.random() * subMessages.length)];
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
  let glitchIntensity = 10; // 1 = mild, 10 = severe (USER CAN EDIT THIS)

  // Helper to grab a snapshot of the screen (simulated by cloning innerHTML)
  // Note: True screen capture in DOM is hard, we simulate by cloning the active screen text
  // For the "shred" effect, we will create strips that offset the content.

  function triggerShredderGlitch() {
    const activeScreen = document.querySelector('.screen.active') || document.body;

    // Number of slices based on intensity (e.g., intensity 5 = ~15 slices)
    const sliceCount = Math.floor(Math.random() * glitchIntensity * 3) + 2;

    for (let i = 0; i < sliceCount; i++) {
      createGlitchSlice(activeScreen);
    }
  }

  function createGlitchSlice(sourceElement) {
    // 1. Create the container "slice" (the viewport)
    const slice = document.createElement('div');
    slice.classList.add('glitch-slice');

    // Random Position & Size
    // Height is usually small (lines) but occasionally large (chunks)
    const isBigChunk = Math.random() < (glitchIntensity * 0.05); // Higher intensity = more big chunks
    const height = isBigChunk ? (Math.random() * 100 + 20) : (Math.random() * 10 + 2); // 2px-10px or 20px-120px
    const width = Math.random() * 40 + 60; // 60% - 100% width
    const top = Math.random() * 100;
    const left = (Math.random() * 20) - 10; // Slight Horizontal shift (-10% to 10%)

    slice.style.height = height + 'px';
    slice.style.width = width + '%';
    slice.style.top = top + '%';
    slice.style.left = left + '%';

    // Create a clone of the source and offset it negatively
    const contentClone = sourceElement.cloneNode(true);
    contentClone.classList.add('glitch-slice-content');

    // Remove IDs to avoid duplicates
    contentClone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    // If the slice is at Top: 100px, we move content Up: -100px + (random offset)
    const offsetX = (Math.random() - 0.5) * 50 * glitchIntensity; // Horizontal shake
    const offsetY = -top * (window.innerHeight / 100) + ((Math.random() - 0.5) * 10); // Match vertical position + slight jitter

    contentClone.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    contentClone.style.width = document.body.clientWidth + 'px'; // Force full width match

    // Append
    slice.appendChild(contentClone);
    document.body.appendChild(slice);

    if (Math.random() > 0.5) {
      slice.style.backgroundColor = 'black';
      contentClone.style.opacity = '0'; // Hide content, just show black bar
    } else {
      slice.style.backgroundColor = 'transparent'; // Show displaced content
    }

    // 4. Cleanup
    setTimeout(() => {
      slice.remove();
    }, Math.random() * 100 + 50); // Lasts 50-150ms
  }

  // --- FLICKER & AMBIANCE
  function triggerFlicker() {
    const randomDelay = Math.random() * 4000 + 2000;

    setTimeout(() => {
      const opacity = Math.random() * 0.4 + 0.1;
      if (flickerOverlay) {
        flickerOverlay.style.opacity = opacity;
        setTimeout(() => { flickerOverlay.style.opacity = 0; }, 50);
      }

      // Increased chance to glitch (80% chance when flickering)
      if (Math.random() > 0.2) {
        triggerShredderGlitch();
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

  // --- STARTUP VIDEO LOGIC ---
  const video = document.getElementById('startup-video');
  const startupScreen = document.getElementById('startup-screen'); // Old white line screen

  if (video) {
    // Hide old screen immediately
    if (startupScreen) startupScreen.style.display = 'none';

    video.style.display = 'block';

    // Play video
    video.play().catch(e => {
      console.warn("Video autoplay blocked:", e);
      video.style.display = 'none'; // Fallback
    });

    video.onended = () => {
      video.style.display = 'none'; // Hide when done
    };

    // Safety timeout (5.5s) in case video stalls
    setTimeout(() => {
      if (video.style.display !== 'none') video.style.display = 'none';
    }, 5500);
  }
});
