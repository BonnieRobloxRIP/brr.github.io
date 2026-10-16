// Entry point: builds the pages, then reveals the app once the important assets have loaded.

import { blocks, categories, MISSING_TEXTURE } from './data/catalog.js';
import { isElectron } from './device.js';
import { initTheme, promptForThemeIfNeeded } from './theme.js';
import { defineRoute, startRouter } from './router.js';
import { getCategoryCounts, initCatalog, showCatalog } from './pages/catalog.js';
import { getBlockParent, initDetail, showBlock } from './pages/detail.js';
import { initConditions, showConditions } from './pages/conditions.js';
import { initGuide, showGuide } from './pages/guide.js';
import { showWelcomeMessage } from './welcome.js';
import { startBackground } from './effects/background.js';
import { startGlitchEffects } from './effects/glitch.js';
import { startRareScreen } from './effects/rare-screen.js';
import { escapeHtml } from './format.js';

// Keep in sync with "version" in package.json.
const APP_VERSION = 'v0.2.0';

const bootStatus = document.getElementById('boot-status');

function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}

// Any image that fails to load shows the missing texture instead.
function useMissingTextureFallback() {
    document.addEventListener('error', event => {
        const image = event.target;
        if (image instanceof HTMLImageElement && !image.src.endsWith(MISSING_TEXTURE)) {
            image.src = MISSING_TEXTURE;
        }
    }, true);
}

function buildMenu() {
    const counts = getCategoryCounts();
    const links = [
        { href: '#/blocks', icon: 'assets/blocks/info_playerspawn.png', label: 'All Blocks', count: blocks.length },
        ...categories.map(category => ({
            href: `#/blocks/${category.id}`,
            icon: category.icon,
            label: category.label,
            count: counts.get(category.id) ?? 0
        }))
    ];

    document.getElementById('menu-categories').innerHTML = links.map(link => `
        <a class="main-menu-btn" href="${link.href}">
            <img src="${escapeHtml(link.icon)}" class="btn-icon" alt="">
            <span>${escapeHtml(link.label)}</span>
            <span class="btn-count">${link.count}</span>
        </a>
    `).join('');
}

function setUpNav() {
    document.getElementById('version-tag').textContent = APP_VERSION;

    // Closing the window only works in the desktop app.
    const powerBtn = document.getElementById('power-btn');
    powerBtn.hidden = !isElectron;
    powerBtn.addEventListener('click', () => window.close());
}

function preloadImages() {
    const paths = new Set([
        MISSING_TEXTURE,
        ...Array.from(document.images, image => image.getAttribute('src')),
        ...blocks.map(block => block.icon)
    ]);

    return Promise.all([...paths].filter(Boolean).map(src => new Promise(resolve => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = resolve;
        image.src = src;
    })));
}

async function boot() {
    const backgroundReady = startBackground();

    bootStatus.textContent = 'Preloading assets...';
    await Promise.race([Promise.all([preloadImages(), document.fonts?.ready]), wait(3000)]);

    bootStatus.textContent = 'Warming background...';
    await Promise.race([backgroundReady, wait(1500)]);

    // Let the first frames paint before fading in (animation frames never come in a background tab).
    await Promise.race([new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))), wait(100)]);
    document.body.classList.replace('app-booting', 'app-ready');
    document.getElementById('boot-overlay').setAttribute('aria-busy', 'false');

    startGlitchEffects();
    startRareScreen();
    window.setTimeout(promptForThemeIfNeeded, 160);
}

useMissingTextureFallback();
initTheme();
setUpNav();
buildMenu();
showWelcomeMessage();
initCatalog();
initDetail();
initConditions();
initGuide();

defineRoute('menu', { screenId: 'main-menu', render: () => '' });
defineRoute('blocks', { screenId: 'catalog-screen', render: showCatalog });
defineRoute('block', { screenId: 'detail-screen', render: showBlock, parent: getBlockParent });
defineRoute('guide', { screenId: 'guide-screen', render: showGuide, showScrollTop: true });
defineRoute('conditions', { screenId: 'conditions-screen', render: showConditions, showScrollTop: true });
startRouter();

boot();
