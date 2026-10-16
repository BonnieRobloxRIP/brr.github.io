// Decides how heavy the visual effects may be, based on the device and the user's motion settings.

const queries = {
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
    mobileViewport: window.matchMedia('(max-width: 900px)'),
    coarsePointer: window.matchMedia('(pointer: coarse)')
};

const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const memory = Number(navigator.deviceMemory || 0);
const cores = Number(navigator.hardwareConcurrency || 0);
const isLowEndDevice = Boolean(connection?.saveData) || (memory > 0 && memory <= 2) || (cores > 0 && cores <= 2);

export const isElectron = navigator.userAgent.includes('Electron');

function computeProfile() {
    const reduceMotion = queries.reduceMotion.matches;
    const isMobileLike = queries.mobileViewport.matches || queries.coarsePointer.matches;
    const lowPower = isLowEndDevice || reduceMotion;
    const pick = (low, mobile, desktop) => (lowPower ? low : (isMobileLike ? mobile : desktop));

    return {
        reduceMotion,
        isMobileLike,
        spriteCount: lowPower ? (isMobileLike ? 4 : 6) : (isMobileLike ? 10 : 20),
        zoomFactor: lowPower ? (isMobileLike ? 7 : 8) : (isMobileLike ? 8 : 10),
        spriteSpeed: reduceMotion ? 0.24 : (isMobileLike ? 0.36 : 0.5),
        glitchIntensity: pick(1, 4, 6),
        maxGlitchBars: pick(5, 12, 18),
        glitchChance: reduceMotion ? 0.28 : (isMobileLike ? 0.55 : 0.75),
        flickerDelayMin: pick(4200, 2600, 1600),
        flickerDelayRange: pick(6200, 5200, 3800),
        flickerOpacityMin: pick(0.03, 0.07, 0.1),
        flickerOpacityRange: pick(0.09, 0.2, 0.32),
        rareScreenEnabled: !lowPower,
        // Mobile waits a bit longer between rare screens.
        rareScreenDelayScale: isMobileLike ? 1.3 : 1
    };
}

const listeners = new Set();

// Read profile.<setting> at the moment it is needed; it is replaced when the device changes.
export let profile = computeProfile();

export function onProfileChange(listener) {
    listeners.add(listener);
}

function refresh() {
    profile = computeProfile();
    document.body.classList.toggle('mobile-viewport', profile.isMobileLike);
    document.body.classList.toggle('reduced-motion', profile.reduceMotion);
    listeners.forEach(listener => listener(profile));
}

Object.values(queries).forEach(query => query.addEventListener('change', refresh));
document.body.classList.toggle('mobile-viewport', profile.isMobileLike);
document.body.classList.toggle('reduced-motion', profile.reduceMotion);
