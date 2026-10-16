// Loaded as a classic script before the app, so it still runs if the app's modules fail to load
// (for example after syncing an addon file that no longer works in a browser). Instead of a loading
// screen that never ends, the error is shown on it.
(() => {
    function showFailure(message) {
        if (!document.body.classList.contains('app-booting')) return;
        const status = document.getElementById('boot-status');
        if (status) status.textContent = `Failed to start: ${message}`;
    }

    window.addEventListener('error', event => {
        if (event instanceof ErrorEvent) showFailure(event.message);
        else if (event.target instanceof HTMLScriptElement) showFailure(`could not load ${event.target.src}`);
    }, true);

    window.addEventListener('unhandledrejection', event => showFailure(`${event.reason}`));
})();
