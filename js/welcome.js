// Main menu greeting: changes with the time of day, with a random line from that time's pool.

import { pickNonRepeating } from './storage.js';

const MESSAGES = {
    morning: [
        'Early bird gets the logic block.',
        'Coffee first, outputs second.',
        'Fresh session, clean wiring.',
        'Morning build pass initiated.',
        'Sunlight outside, scripts inside.',
        'Perfect time to organize your block names.',
        'Rise and map, creator.',
        'Morning mode: stable and productive.',
        'Good morning, engineer of chaos.',
        'The map is loading before breakfast.',
        'Quick sanity test, then full creative mode.',
        'Start small, ship big by nightfall.'
    ],
    afternoon: [
        'Midday momentum is online.',
        'Hydrate before debugging conditions.',
        'Time for one more map system pass.',
        'Afternoon check: outputs still linked?',
        'Keep stacking clean block chains.',
        'A good hour for polishing details.',
        'Lunch is over, logic is forever.',
        'Afternoon build session engaged.',
        'Great hour to test edge cases.',
        'Map flow audit in progress.',
        'Every saved output counts right now.',
        'Perfect time to tune gameplay pacing.'
    ],
    evening: [
        'Evening shift: cinematic mode.',
        'Prime time for map polish.',
        'Keep the ambience, keep the vibe.',
        'Good hour for gameplay balancing.',
        'Evening calm, stable systems.',
        'One more test run before late night.',
        'Great time to wire final outputs.',
        'Winding down or gearing up?',
        'The night is young and your logic is cleaner.',
        'Visual pass plus bug pass sounds about right.',
        'Tonight is for clean design and cleaner code.',
        'Edge-case hunting begins at sunset.'
    ],
    night: [
        'Still awake, still building.',
        'Night mode: static, scanlines, and focus.',
        'Late-night creators are built different.',
        'The map is quiet but your scripts are not.',
        'One more tweak before bed... probably.',
        'You and the debug log, again.',
        'Night shift in progress.',
        'Bed is calling, but so is iteration 37.',
        'Insomniac engineering online.',
        'The blocks are sleeping, but your ideas are not.',
        'Another reload, another breakthrough.',
        'Sleep timer: delayed by creative mode.',
        'nap time evades you',
        'is sleep afraid?',
        'how much longer?',
        "it's bed time my dudes",
        'i am seriously thinking you like this place',
        'we enjoy your time here but the bed needs you'
    ]
};

function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return ['GOOD MORNING', 'morning'];
    if (hour >= 12 && hour < 17) return ['GOOD AFTERNOON', 'afternoon'];
    if (hour >= 17 && hour < 21) return ['GOOD EVENING', 'evening'];
    return ['GOOD NIGHT', 'night'];
}

export function showWelcomeMessage() {
    const [greeting, pool] = getTimeOfDay(new Date().getHours());
    document.getElementById('welcome-header').textContent = greeting;
    document.getElementById('welcome-message').textContent = pickNonRepeating(pool, MESSAGES[pool]);
}
