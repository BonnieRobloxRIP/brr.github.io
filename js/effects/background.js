// Floating pixel sprites drifting up and to the right behind the UI.

import { onProfileChange, profile } from '../device.js';

const SPRITE_COUNT = 15;
const SPACING = 50;

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

const images = [];
const sprites = [];
let frameId = 0;
let lastTimestamp = 0;

function loadImages() {
    return Promise.all(Array.from({ length: SPRITE_COUNT }, (_, index) => new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            images.push(image);
            resolve();
        };
        image.onerror = resolve;
        image.src = `assets/sprites/sprite${index + 1}.png`;
    })));
}

function overlaps(x, y, image, ignore) {
    const zoom = profile.zoomFactor;
    const width = image.naturalWidth * zoom;
    const height = image.naturalHeight * zoom;

    return sprites.some(sprite => sprite !== ignore
        && x < sprite.x + sprite.img.naturalWidth * zoom + SPACING
        && x + width + SPACING > sprite.x
        && y < sprite.y + sprite.img.naturalHeight * zoom + SPACING
        && y + height + SPACING > sprite.y);
}

// A spot off the bottom or left edge, so the sprite drifts into view.
function edgeSpot(image) {
    if (Math.random() > 0.5) {
        return { x: Math.random() * canvas.width, y: canvas.height + image.naturalHeight * profile.zoomFactor };
    }
    return { x: -image.naturalWidth * profile.zoomFactor - SPACING, y: Math.random() * canvas.height };
}

function addSprite(atEdge) {
    const img = images[Math.floor(Math.random() * images.length)];
    for (let attempt = 0; attempt < 150; attempt++) {
        const spot = atEdge ? edgeSpot(img) : { x: Math.random() * canvas.width, y: Math.random() * canvas.height };
        if (!overlaps(spot.x, spot.y, img)) {
            sprites.push({ ...spot, img });
            return;
        }
    }
}

function rebalance() {
    if (images.length === 0) return;
    while (sprites.length < profile.spriteCount) addSprite(true);
    sprites.length = Math.min(sprites.length, profile.spriteCount);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}

function animate(timestamp) {
    // Scale movement by frame time so speed is the same at any refresh rate.
    const delta = lastTimestamp ? Math.min(Math.max(timestamp - lastTimestamp, 8), 48) : 16.6667;
    const step = profile.spriteSpeed * (delta / 16.6667);
    const zoom = profile.zoomFactor;
    lastTimestamp = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const sprite of sprites) {
        sprite.x += step;
        sprite.y -= step;

        const width = sprite.img.naturalWidth * zoom;
        const height = sprite.img.naturalHeight * zoom;
        ctx.drawImage(sprite.img, Math.round(sprite.x), Math.round(sprite.y), width, height);

        if (sprite.y + height < -20 || sprite.x > canvas.width + 20) {
            for (let attempt = 0; attempt < 50; attempt++) {
                const spot = edgeSpot(sprite.img);
                if (!overlaps(spot.x, spot.y, sprite.img, sprite)) {
                    Object.assign(sprite, spot);
                    break;
                }
            }
        }
    }

    frameId = window.requestAnimationFrame(animate);
}

function start() {
    if (frameId || images.length === 0) return;
    lastTimestamp = 0;
    frameId = window.requestAnimationFrame(animate);
}

function stop() {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
}

// Resolves once the first frame is scheduled (or immediately if the sprites fail to load).
export async function startBackground() {
    if (!ctx) return;

    resize();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize, 100);
    });

    await loadImages();
    for (let i = 0; i < profile.spriteCount; i++) addSprite(false);

    onProfileChange(rebalance);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
}
