// Block list: every engine block as a card, filtered by category and search.

import { blocks, categories } from '../data/catalog.js';
import { escapeHtml, plural } from '../format.js';
import { replace } from '../router.js';

const grid = document.getElementById('block-grid');
const filter = document.getElementById('catalog-filter');
const search = document.getElementById('catalog-search');
const subtitle = document.getElementById('catalog-subtitle');
const count = document.getElementById('catalog-count');
const empty = document.getElementById('catalog-empty');

const categoryLabels = new Map(categories.map(category => [category.id, category.label]));
const cards = new Map();

let currentCategory = 'all';
let searchTimer = 0;

function buildCard(block) {
    const card = document.createElement('a');
    card.className = 'block-card';
    card.href = `#/block/${block.id}`;
    card.innerHTML = `
        <div class="icon-frame">
            <img src="${escapeHtml(block.icon)}" alt="" loading="lazy" decoding="async">
        </div>
        <div class="card-category">${escapeHtml(categoryLabels.get(block.category))}</div>
        <div class="card-title">${escapeHtml(block.name)}</div>
        <div class="card-id">${escapeHtml(block.id)}</div>
        <div class="card-summary">${escapeHtml(block.summary)}</div>
    `;
    return card;
}

function applyFilters() {
    const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;

    for (const block of blocks) {
        const visible = (currentCategory === 'all' || block.category === currentCategory)
            && terms.every(term => block.searchText.includes(term));
        cards.get(block.id).hidden = !visible;
        if (visible) shown++;
    }

    count.textContent = plural(shown, 'Block');
    empty.hidden = shown > 0;
    empty.textContent = terms.length > 0 ? 'No blocks match your search.' : 'There are no blocks in this category yet.';
}

function setCategory(categoryId) {
    currentCategory = categoryLabels.has(categoryId) ? categoryId : 'all';
    filter.value = currentCategory;
    subtitle.textContent = currentCategory === 'all' ? 'All Blocks' : categoryLabels.get(currentCategory);
    applyFilters();
    return subtitle.textContent;
}

export function initCatalog() {
    filter.innerHTML = [
        '<option value="all">All Blocks</option>',
        ...categories.map(category => `<option value="${category.id}">${escapeHtml(category.label)}</option>`)
    ].join('');

    const fragment = document.createDocumentFragment();
    for (const block of blocks) {
        const card = buildCard(block);
        cards.set(block.id, card);
        fragment.appendChild(card);
    }
    grid.appendChild(fragment);

    filter.addEventListener('change', () => {
        setCategory(filter.value);
        replace(currentCategory === 'all' ? '#/blocks' : `#/blocks/${currentCategory}`);
    });

    search.addEventListener('input', () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(applyFilters, 70);
    });
}

// Route: #/blocks[/category]. Switching category clears the search; coming back to the same list keeps it.
export function showCatalog([categoryId = 'all'] = []) {
    if (categoryId !== currentCategory) search.value = '';
    return setCategory(categoryId);
}

export function getCategoryCounts() {
    const counts = new Map(categories.map(category => [category.id, 0]));
    blocks.forEach(block => counts.set(block.category, (counts.get(block.category) ?? 0) + 1));
    return counts;
}
