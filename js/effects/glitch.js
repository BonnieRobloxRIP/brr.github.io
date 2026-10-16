// CRT effects: scanline opacity drift, random screen flicker and "shredder" glitch bars.

import { onProfileChange, profile } from '../device.js';

// No flicker for a few seconds after the app appears.
const BOOT_COOLDOWN_MS = 4200;

const scanlines = document.querySelector('.scanlines');
const flickerOverlay = document.getElementById('flicker-overlay');
const glitchLayer = document.getElementById('glitch-clone');

const glitchBars = [];
let startedAt = 0;

function buildGlitchBars() {
    glitchLayer.replaceChildren();
    glitchBars.length = 0;
    for (let i = 0; i < profile.maxGlitchBars; i++) {
        const bar = document.createElement('div');
        bar.className = 'glitch-bar';
        glitchLayer.appendChild(bar);
        glitchBars.push(bar);
    }
}

function flashGlitchBar(bar) {
    const intensity = profile.glitchIntensity;
    const tint = Math.random() > 0.5 ? 'rgba(255, 92, 92, 0.55)' : 'rgba(98, 174, 255, 0.55)';

    bar.style.top = `${Math.random() * 100}%`;
    bar.style.left = `${Math.random() * 10 - 5}%`;
    bar.style.height = `${2 + Math.random() * (8 + intensity * 2)}px`;
    bar.style.width = `${65 + Math.random() * 35}%`;
    bar.style.opacity = `${0.2 + Math.random() * 0.45}`;
    bar.style.transform = `translate3d(${(Math.random() - 0.5) * (10 + intensity * 6)}px, 0, 0)`;
    bar.style.background = `linear-gradient(90deg, ${tint}, rgba(255, 255, 255, 0.1), transparent)`;

    window.setTimeout(() => {
        bar.style.opacity = '0';
        bar.style.transform = 'translate3d(0, 0, 0)';
    }, 45 + Math.random() * 110);
}

export function triggerGlitch() {
    if (glitchBars.length === 0) return;

    const burst = 2 + Math.floor(Math.random() * (3 + profile.glitchIntensity));
    for (let i = 0; i < burst; i++) {
        flashGlitchBar(glitchBars[Math.floor(Math.random() * glitchBars.length)]);
    }

    document.body.classList.add('glitch-hit');
    window.setTimeout(() => document.body.classList.remove('glitch-hit'), 90);
}

function cycleScanlines() {
    const min = profile.reduceMotion ? 0.18 : 0.32;
    const max = profile.reduceMotion ? 0.42 : 0.72;
    scanlines.style.opacity = `${min + Math.random() * (max - min)}`;
    window.setTimeout(cycleScanlines, profile.reduceMotion ? 7000 : 5000);
}

function scheduleFlicker() {
    const delay = profile.flickerDelayMin + Math.random() * profile.flickerDelayRange;

    window.setTimeout(() => {
        const cooling = Date.now() - startedAt < BOOT_COOLDOWN_MS;

        if (!cooling && !document.hidden) {
            if (!profile.reduceMotion) {
                flickerOverlay.style.opacity = `${profile.flickerOpacityMin + Math.random() * profile.flickerOpacityRange}`;
                window.setTimeout(() => {
                    flickerOverlay.style.opacity = '0';
                }, 55);
            }
            if (Math.random() < profile.glitchChance) triggerGlitch();
        }

        scheduleFlicker();
    }, delay);
}

// Call once the app is visible.
export function startGlitchEffects() {
    startedAt = Date.now();
    buildGlitchBars();
    onProfileChange(next => {
        if (next.maxGlitchBars !== glitchBars.length) buildGlitchBars();
    });
    cycleScanlines();
    window.setTimeout(scheduleFlicker, 1200);
}
