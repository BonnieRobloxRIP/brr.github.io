// localStorage that never throws: it can be blocked in private mode or by strict browser settings.

export function readStorage(key) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeStorage(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Nothing to do; the value just won't be remembered.
    }
}

// Picks a random message, avoiding the one picked last time for the same pool (even across visits).
export function pickNonRepeating(poolKey, messages) {
    if (messages.length === 0) return '';

    const storageKey = `bse_last_message_${poolKey}`;
    const lastIndex = Number.parseInt(readStorage(storageKey), 10);
    let index = Math.floor(Math.random() * messages.length);

    if (messages.length > 1 && index === lastIndex) {
        index = (index + 1 + Math.floor(Math.random() * (messages.length - 1))) % messages.length;
    }

    writeStorage(storageKey, `${index}`);
    return messages[index];
}
