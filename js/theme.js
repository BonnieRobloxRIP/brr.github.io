// Theme picker. Shown on first visit (and when THEME_PICKER_VERSION changes); the gear button reopens it.

import { readStorage, writeStorage } from './storage.js';

const THEME_STORAGE_KEY = 'bse_theme';
const THEME_PICKER_VERSION_KEY = 'bse_theme_picker_version';
const THEME_PICKER_VERSION = 'v2';
const THEMES = new Set(['light', 'dark', 'blackmesa', 'xen']);

const picker = document.getElementById('theme-picker');
const options = Array.from(picker.querySelectorAll('.theme-option'));

let themeBeforePicker = 'dark';

function normalizeTheme(theme) {
    if (theme === 'egg') return 'blackmesa';
    return THEMES.has(theme) ? theme : 'dark';
}

export function getCurrentTheme() {
    return document.body.dataset.theme || 'dark';
}

function applyTheme(theme, persist = false) {
    const selected = normalizeTheme(theme);
    document.body.dataset.theme = selected;
    options.forEach(option => option.setAttribute('aria-pressed', `${option.dataset.theme === selected}`));
    if (persist) writeStorage(THEME_STORAGE_KEY, selected);
}

function openPicker(canDismiss) {
    themeBeforePicker = getCurrentTheme();
    picker.dataset.dismissible = `${canDismiss}`;
    picker.hidden = false;
}

function closePicker(theme, persist) {
    applyTheme(theme, persist);
    writeStorage(THEME_PICKER_VERSION_KEY, THEME_PICKER_VERSION);
    picker.hidden = true;
}

// Call once the app is visible: asks new visitors to pick a theme.
export function promptForThemeIfNeeded() {
    const hasTheme = Boolean(readStorage(THEME_STORAGE_KEY));
    if (!hasTheme || readStorage(THEME_PICKER_VERSION_KEY) !== THEME_PICKER_VERSION) {
        openPicker(false);
    }
}

export function initTheme() {
    const stored = readStorage(THEME_STORAGE_KEY);
    applyTheme(stored ? normalizeTheme(stored) : 'dark');

    options.forEach(option => option.addEventListener('click', () => applyTheme(option.dataset.theme)));
    document.getElementById('theme-confirm-btn').addEventListener('click', () => closePicker(getCurrentTheme(), true));
    document.getElementById('theme-cancel-btn').addEventListener('click', () => closePicker(themeBeforePicker, false));
    document.getElementById('theme-btn').addEventListener('click', () => openPicker(true));

    picker.addEventListener('click', event => {
        if (event.target === picker && picker.dataset.dismissible === 'true') {
            closePicker(themeBeforePicker, false);
        }
    });
}
