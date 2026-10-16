// The rare screen: every so often the page "breaks" into black boxes and shards, then shows a fake
// error for a few seconds before everything returns to normal.

import { onProfileChange, profile } from '../device.js';
import { pickNonRepeating } from '../storage.js';
import { triggerGlitch } from './glitch.js';

const INCIDENT_MESSAGES = [
    'Resonance cascade',
    'Taco Item',
    'Purple Retard',
    'Life Linked',
    'Aliens Attacked',
    'brr_message_here',
    'Yellow Rabbit',
    'Signal Desynchronizing',
    'Renderer Handshake Failed'
];

const ERROR_REPORTS = [
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
];

const FULL_COVER_MS = 220;
const ERROR_SHOWN_MS = 3200;

// Random wait before each rare screen, in seconds. The first comes at about the same time as it
// always did; each later one waits longer, up to the last range, which then repeats.
const DELAY_RANGES_S = [
    [80, 120],
    [240, 420],
    [480, 840],
    [900, 1500]
];

const root = document.documentElement;
const body = document.body;
const rareScreen = document.getElementById('rare-screen');
const overlay = document.getElementById('pre-rare-overlay');

let timerId = 0;
let shownCount = 0;

function setVars(vars) {
    Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
}

function randomBox(maxWidth, maxHeight, minWidth, minHeight) {
    const width = minWidth + Math.floor(Math.random() * maxWidth);
    const height = minHeight + Math.floor(Math.random() * maxHeight);
    return {
        width,
        height,
        left: Math.floor(Math.random() * (Math.max(0, window.innerWidth - width) + 1)),
        top: Math.floor(Math.random() * (Math.max(0, window.innerHeight - height) + 1))
    };
}

function place(element, box) {
    element.style.width = `${box.width}px`;
    element.style.height = `${box.height}px`;
    element.style.left = `${box.left}px`;
    element.style.top = `${box.top}px`;
}

// Black rectangles that pile up over the page.
function buildBoxes() {
    const mobile = profile.isMobileLike;
    return Array.from({ length: mobile ? 90 : 130 }, () => {
        const box = document.createElement('div');
        box.className = 'pre-rare-box';
        place(box, randomBox(mobile ? 180 : 240, mobile ? 120 : 170, 28, 14));
        overlay.appendChild(box);
        return box;
    });
}

// Shards: offset copies of the current page.
function buildFragments(screen) {
    if (!screen) return [];

    return Array.from({ length: profile.isMobileLike ? 3 : 5 }, () => {
        const box = randomBox(window.innerWidth * 0.24, window.innerHeight * 0.2, window.innerWidth * 0.2, window.innerHeight * 0.12);
        const fragment = document.createElement('div');
        fragment.className = 'pre-rare-fragment';
        place(fragment, box);

        const clone = screen.cloneNode(true);
        clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        clone.removeAttribute('id');
        clone.style.left = `${-box.left + (Math.random() > 0.5 ? 14 : -14)}px`;
        clone.style.top = `${-box.top + (Math.random() > 0.5 ? 10 : -10)}px`;
        clone.style.width = `${window.innerWidth}px`;
        clone.style.height = `${window.innerHeight}px`;

        fragment.appendChild(clone);
        overlay.appendChild(fragment);
        return fragment;
    });
}

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function clearOverlay() {
    overlay.classList.remove('active', 'full-cover');
    overlay.replaceChildren();
}

function triggerRareScreen() {
    if (body.classList.contains('rare-distorting')) return;

    const mobile = profile.isMobileLike;
    const buildUpMs = 2100 + Math.floor(Math.random() * 900);
    const startedAt = Date.now();

    body.classList.add('rare-distorting', 'pre-rare-distort');
    setVars({ '--pre-rare-progress': '0', '--pre-rare-shift-x': '0px', '--pre-rare-shift-y': '0px' });
    overlay.classList.add('active');

    const pieces = shuffle([...buildBoxes(), ...buildFragments(document.querySelector('.screen.active'))]);
    let revealed = 0;

    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        window.setTimeout(triggerGlitch, 36 * i);
    }

    // Build-up: shake harder and reveal more pieces as progress goes from 0 to 1.
    const buildUpTimer = window.setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / buildUpMs);
        const shake = 1 + progress * (mobile ? 10 : 16);
        setVars({
            '--pre-rare-progress': progress.toFixed(3),
            '--pre-rare-shift-x': `${((Math.random() - 0.5) * shake).toFixed(2)}px`,
            '--pre-rare-shift-y': `${((Math.random() - 0.5) * shake).toFixed(2)}px`
        });

        const ceiling = (mobile ? 4 : 6) + Math.floor(progress * (mobile ? 8 : 16));
        const count = Math.min(pieces.length - revealed, 1 + Math.floor(Math.random() * Math.max(2, ceiling)));
        for (let i = 0; i < count; i++) pieces[revealed + i].classList.add('active');
        revealed += count;

        if (Math.random() < 0.22 + progress * 0.72) triggerGlitch();
    }, mobile ? 46 : 38);

    const hueTimer = window.setInterval(() => {
        setVars({ '--rare-hue-shift': `${Math.floor((Math.random() - 0.5) * 34)}deg` });
    }, 70);

    // Screen goes fully black, then the error appears.
    window.setTimeout(() => {
        window.clearInterval(buildUpTimer);
        pieces.forEach(piece => piece.classList.add('active'));
        setVars({ '--pre-rare-progress': '1' });
        overlay.classList.add('full-cover');

        window.setTimeout(() => {
            clearOverlay();
            body.classList.remove('pre-rare-distort');
            setVars({ '--pre-rare-progress': '0', '--pre-rare-shift-x': '0px', '--pre-rare-shift-y': '0px' });

            document.getElementById('rare-title').textContent = 'Error';
            document.getElementById('rare-text').textContent = pickNonRepeating('rare_primary', ERROR_REPORTS);
            document.getElementById('rare-subtext').textContent = `Incident marker: ${pickNonRepeating('rare_incident', INCIDENT_MESSAGES)}`;
            rareScreen.classList.add('active');
        }, FULL_COVER_MS);
    }, buildUpMs);

    // Back to normal.
    window.setTimeout(() => {
        window.clearInterval(buildUpTimer);
        window.clearInterval(hueTimer);
        clearOverlay();
        body.classList.remove('rare-distorting', 'pre-rare-distort');
        rareScreen.classList.remove('active');
        setVars({
            '--pre-rare-progress': '0',
            '--pre-rare-shift-x': '0px',
            '--pre-rare-shift-y': '0px',
            '--rare-hue-shift': '0deg'
        });
    }, buildUpMs + FULL_COVER_MS + ERROR_SHOWN_MS);
}

function nextDelayMs() {
    const [min, max] = DELAY_RANGES_S[Math.min(shownCount, DELAY_RANGES_S.length - 1)];
    return (min + Math.random() * (max - min)) * 1000 * profile.rareScreenDelayScale;
}

function fire() {
    // Wait for the page to be visible again rather than playing it unseen.
    if (document.hidden) {
        document.addEventListener('visibilitychange', fire, { once: true });
        return;
    }
    triggerRareScreen();
    shownCount++;
    schedule();
}

function schedule() {
    window.clearTimeout(timerId);
    document.removeEventListener('visibilitychange', fire);
    if (profile.rareScreenEnabled) timerId = window.setTimeout(fire, nextDelayMs());
}

export function startRareScreen() {
    schedule();
    onProfileChange(schedule);
}
