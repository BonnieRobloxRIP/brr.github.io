// Condition reference: every condition usable by triggers, logic_branch and logic_case.

import { conditionReference } from '../data/catalog.js';
import { escapeHtml, formatLine, helpToHtml, plural } from '../format.js';

const content = document.getElementById('conditions-content');
const nav = document.getElementById('conditions-category-nav');
const intro = document.getElementById('conditions-intro');
const search = document.getElementById('condition-search');
const count = document.getElementById('conditions-count');
const empty = document.getElementById('conditions-empty');
const scroller = document.querySelector('#conditions-screen .screen-content-scroll');

const sections = [];
let searchTimer = 0;

function slug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// "<entity:selector> <int>" -> which Condition value field each part goes into.
function renderValueFields(syntax) {
    const values = syntax.match(/<[^>]*>/g) ?? [];
    if (values.length === 0 || values[0] === '<no data>') {
        return '<p class="detail-muted">Leave every Condition value blank.</p>';
    }
    return `<dl class="term-list">${values.map((value, index) => `
        <dt>Value ${index + 1}</dt><dd>${escapeHtml(value)}</dd>
    `).join('')}</dl>`;
}

function renderUsedBy() {
    return `<div class="block-link-grid">${conditionReference.usedBy.map(({ block, fields }) => `
        <a class="block-link" href="#/block/${block.id}/settings">
            <img src="${escapeHtml(block.icon)}" alt="" loading="lazy">
            <span>
                <span class="block-link-name">${escapeHtml(block.name)}</span><br>
                <span class="block-link-field">${fields.map(field => escapeHtml(field.label)).join(', ')}</span>
            </span>
        </a>
    `).join('')}</div>`;
}

function renderCondition(condition) {
    const item = document.createElement('details');
    item.className = 'condition-entry';
    item.id = `condition-${condition.key}`;
    item.innerHTML = `
        <summary>
            <span class="condition-key">${escapeHtml(condition.key)}</span>
            <span class="condition-syntax">${escapeHtml(condition.syntax)}</span>
        </summary>
        <div class="condition-content">
            ${condition.description ? `<h3 class="section-title">What it checks</h3><p class="detail-muted">${escapeHtml(condition.description)}</p>` : ''}
            <h3 class="section-title">Values</h3>
            ${renderValueFields(condition.syntax)}
            ${condition.example ? `<h3 class="section-title">Example</h3><p class="detail-muted">${formatLine(condition.example)}</p>` : ''}
        </div>
    `;
    return item;
}

function applySearch() {
    const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;

    for (const section of sections) {
        let sectionShown = 0;
        for (const { condition, element } of section.items) {
            const visible = terms.every(term => condition.searchText.includes(term));
            element.hidden = !visible;
            if (visible) sectionShown++;
        }
        section.element.hidden = sectionShown === 0;
        section.jump.hidden = sectionShown === 0;
        section.count.textContent = plural(sectionShown, 'condition');
        shown += sectionShown;
    }

    count.textContent = plural(shown, 'condition');
    empty.hidden = shown > 0;
}

export function initConditions() {
    intro.innerHTML = `
        <div class="help-text">${helpToHtml(conditionReference.intro)}</div>
        <p class="detail-muted">On Logic Branch and Logic Case, a player condition passes if any player in that dimension passes it. With no players in the dimension, no condition passes.</p>
        <p class="detail-muted">These blocks can use conditions:</p>
        ${renderUsedBy()}
    `;

    for (const group of conditionReference.groups) {
        const element = document.createElement('section');
        element.className = 'condition-category';
        element.id = `condition-group-${slug(group.title)}`;
        element.innerHTML = `
            <div class="condition-category-header">
                <span class="condition-category-title">${escapeHtml(group.title)}</span>
                <span class="condition-category-count"></span>
            </div>
            ${group.note ? `<p class="condition-category-note">${escapeHtml(group.note)}</p>` : ''}
        `;

        const items = group.conditions.map(condition => {
            const item = renderCondition(condition);
            element.appendChild(item);
            return { condition, element: item };
        });

        const jump = document.createElement('button');
        jump.type = 'button';
        jump.className = 'pixel-btn small';
        jump.textContent = group.title;
        jump.addEventListener('click', () => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));

        nav.appendChild(jump);
        content.appendChild(element);
        sections.push({ element, jump, items, count: element.querySelector('.condition-category-count') });
    }

    search.addEventListener('input', () => {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(applySearch, 70);
    });
    applySearch();
}

// Route: #/conditions[/key] opens and scrolls to one condition.
export function showConditions([key] = []) {
    const target = key ? document.getElementById(`condition-${key}`) : null;
    if (target) {
        search.value = '';
        applySearch();
        target.open = true;
        target.scrollIntoView({ block: 'start' });
        scroller.dataset.keepScroll = 'true';
    }
    return 'Condition Reference';
}
