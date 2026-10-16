// How-to guide. Most of it is written in index.html; the parts shared by every in-game
// help page (wiring outputs, common inputs) are filled in from the addon text.

import { sharedHelp } from '../data/catalog.js';
import { helpToHtml } from '../format.js';

const scroller = document.querySelector('#guide-screen .screen-content-scroll');

export function initGuide() {
    document.getElementById('guide-output-steps').innerHTML = helpToHtml(sharedHelp.outputSteps);
    document.getElementById('guide-common-inputs').innerHTML = helpToHtml(sharedHelp.commonInputs);

    document.querySelectorAll('[data-guide-jump]').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById(`guide-${button.dataset.guideJump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// Route: #/guide[/section]
export function showGuide([section] = []) {
    const target = section ? document.getElementById(`guide-${section}`) : null;
    if (target) {
        target.scrollIntoView({ block: 'start' });
        scroller.dataset.keepScroll = 'true';
    }
    return 'Guide';
}
