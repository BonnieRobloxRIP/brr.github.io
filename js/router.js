// Hash routes, so every page has a link (#/block/logic_relay) and the browser's back button works.
//   #/                       main menu
//   #/blocks[/category]      block list
//   #/block/<id>[/tab]       one block
//   #/guide[/section]        how-to guide
//   #/conditions[/key]       condition reference

const SITE_TITLE = "Bonnie's Source Engine Encyclopedia";

const routes = new Map();
const scrollPositions = new Map();
// Hashes visited in this session, to tell "back" apart from following a link.
const visited = [];

let current = null;

const homeBtn = document.getElementById('home-btn');
const backBtn = document.getElementById('back-btn');
const scrollTopBtn = document.getElementById('scroll-top-btn');

// render(params) shows the page and returns a page title, or false when params are invalid.
// parent(params) is where Back goes when there is no history to go back to.
export function defineRoute(name, { screenId, render, parent = () => '#/', showScrollTop = false }) {
    const screen = document.getElementById(screenId);
    routes.set(name, {
        screen,
        scroller: screen.querySelector('.screen-content-scroll'),
        render,
        parent,
        showScrollTop
    });
}

function parse(hash) {
    const [name = '', ...params] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    return { name: name || 'menu', params };
}

function currentHash() {
    return window.location.hash || '#/';
}

export function go(hash) {
    if (currentHash() === hash) render();
    else window.location.hash = hash;
}

// Changes the address without adding a history entry (e.g. switching tabs on a block page).
export function replace(hash) {
    window.history.replaceState(null, '', hash);
    visited[visited.length - 1] = hash;
}

function goBack() {
    if (visited.length > 1) {
        window.history.back();
        return;
    }
    const { name, params } = parse(currentHash());
    const target = routes.get(name)?.parent(params) ?? '#/';
    replace(target);
    render();
}

function render() {
    const hash = currentHash();
    const isBack = visited.length > 1 && visited[visited.length - 2] === hash;

    if (current?.route.scroller) scrollPositions.set(current.hash, current.route.scroller.scrollTop);
    if (isBack) visited.pop();
    else if (visited[visited.length - 1] !== hash) visited.push(hash);

    const { name, params } = parse(hash);
    const route = routes.get(name) ?? routes.get('menu');

    routes.forEach(other => other.screen.classList.toggle('active', other === route));
    const title = route.render(params);
    if (title === false) {
        replace(route.parent(params));
        render();
        return;
    }

    current = { hash, route };
    document.title = title ? `${title} - ${SITE_TITLE}` : SITE_TITLE;
    homeBtn.hidden = name === 'menu';
    backBtn.hidden = name === 'menu';
    scrollTopBtn.hidden = !route.showScrollTop;

    // A page that scrolled to a specific spot itself (e.g. one condition) sets data-keep-scroll.
    if (route.scroller && !route.scroller.dataset.keepScroll) {
        route.scroller.scrollTop = isBack ? (scrollPositions.get(hash) ?? 0) : 0;
    }
    delete route.scroller?.dataset.keepScroll;
}

export function startRouter() {
    window.addEventListener('hashchange', render);
    homeBtn.addEventListener('click', () => go('#/'));
    backBtn.addEventListener('click', goBack);
    scrollTopBtn.addEventListener('click', () => {
        current?.route.scroller?.scrollTo({ top: 0, behavior: 'smooth' });
    });
    render();
}
