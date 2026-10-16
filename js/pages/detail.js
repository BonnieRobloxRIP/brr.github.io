// One block's page: the in-game Help tabs (Info, Usage, Examples), its settings and its outputs/inputs.

import { blocksById, categories, sharedHelp } from '../data/catalog.js';
import { escapeHtml, helpToHtml } from '../format.js';
import { replace } from '../router.js';

const TABS = ['info', 'usage', 'examples', 'settings', 'io'];

const title = document.getElementById('detail-title');
const hero = document.getElementById('detail-hero');
const tabButtons = Array.from(document.querySelectorAll('#detail-tabs .tab-btn'));
const panels = new Map(TABS.map(tab => [tab, document.getElementById(`detail-panel-${tab}`)]));

const categoryLabels = new Map(categories.map(category => [category.id, category.label]));

let currentBlock = null;

// SECTION: Panels
function renderHero(block) {
    const conditionLink = block.conditionFields.length > 0
        ? '<a class="detail-chip" href="#/conditions">Uses conditions</a>'
        : '';

    return `
        <div class="icon-frame"><img src="${escapeHtml(block.icon)}" alt=""></div>
        <div class="detail-hero-text">
            <div class="desc-box">${escapeHtml(block.summary)}</div>
            <div class="chip-row">
                <a class="detail-chip" href="#/blocks/${block.category}">${escapeHtml(categoryLabels.get(block.category))}</a>
                <span class="detail-chip" title="Name used by /brr:block_fill and /brr:find">${escapeHtml(block.id)}</span>
                ${block.isBrush
                    ? '<a class="detail-chip" href="#/guide/placing" title="Touching blocks of this type form one entity with shared settings">Brush</a>'
                    : '<a class="detail-chip" href="#/guide/placing" title="Every block is its own entity">Point entity</a>'}
                ${conditionLink}
            </div>
        </div>
    `;
}

function renderInfo(block) {
    return `<div class="help-text">${helpToHtml(block.help.info)}</div>`;
}

function renderUsage(block) {
    const wiring = block.hasForm
        ? '<p class="detail-muted">Outputs are set up the same way on every block: see <a href="#/guide/outputs">Connecting blocks</a> in the guide.</p>'
        : '';
    return `<div class="help-text">${helpToHtml(block.help.usage)}</div>${wiring}`;
}

function renderExamples(block) {
    return `<div class="help-text">${helpToHtml(block.help.examples)}</div>`;
}

function fieldNotes(field) {
    if (field.control) return 'Form control, not saved as a setting.';
    if (field.conditionList) return '<a href="#/conditions">Any condition from the Condition Reference</a>. Fill in only the values it needs.';

    const notes = [];
    if (field.options?.length) notes.push(`Options: ${field.options.map(escapeHtml).join(', ')}`);
    if (field.hint && field.hint !== field.default) notes.push(escapeHtml(field.hint));
    return notes.join('<br>');
}

function renderSettings(block) {
    if (!block.hasForm) {
        return '<p class="detail-muted">This block has no settings form.</p>';
    }

    const tables = block.settings.map(tab => `
        <h3 class="section-title">${escapeHtml(tab.label)} tab</h3>
        ${tab.note ? `<p class="detail-muted">${escapeHtml(tab.note)}</p>` : ''}
        <table class="settings-table">
            <thead><tr><th>Setting</th><th>Type</th><th>Default</th><th>Notes</th></tr></thead>
            <tbody>
                ${tab.fields.map(field => `
                    <tr class="${field.control ? 'field-control' : ''}">
                        <td>${escapeHtml(field.label)}</td>
                        <td class="field-kind">${escapeHtml(field.kind)}</td>
                        <td>${field.control ? '' : escapeHtml(field.default || '(blank)')}</td>
                        <td>${fieldNotes(field)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `).join('');

    return `
        <p class="detail-muted">Open the form by using the block in Creative mode. These are the tabs specific to this block; every form also has <a href="#/guide/forms">Output, Saved, Input and Help tabs</a>.</p>
        ${tables}
    `;
}

function chips(names, extraClass = '') {
    return `<ul class="chip-list">${names.map(name => `<li class="io-chip ${extraClass}">${escapeHtml(name)}</li>`).join('')}</ul>`;
}

function renderIo(block) {
    const outputs = block.outputs.length > 0
        ? chips(block.outputs)
        : '<p class="detail-muted">This block has no outputs of its own.</p>';
    const inputs = block.inputs.length > 0
        ? chips(block.inputs)
        : '<p class="detail-muted">This block has no inputs of its own.</p>';
    const noForm = block.hasForm
        ? ''
        : '<p class="detail-muted">This block has no settings form, so outputs cannot be added to it in game.</p>';

    return `
        ${noForm}
        <h3 class="section-title">Outputs</h3>
        <p class="detail-muted">Events this block fires. Connect them to other blocks in the Output tab of its form.</p>
        ${outputs}
        <p class="detail-muted">Also fires:</p>
        ${chips(block.userOutputs, 'common')}
        <p class="detail-muted">OnUser1-4 fire when the block receives FireUser1-4, which is handy for chaining.</p>

        <h3 class="section-title">Inputs</h3>
        <p class="detail-muted">Actions other blocks can tell this block to do.</p>
        ${inputs}
        <p class="detail-muted">Plus the <a href="#/guide/inputs">inputs every block accepts</a>:</p>
        ${chips(sharedHelp.commonInputNames, 'common')}
    `;
}

const RENDERERS = {
    info: renderInfo,
    usage: renderUsage,
    examples: renderExamples,
    settings: renderSettings,
    io: renderIo
};

// SECTION: Tabs
function selectTab(tab) {
    tabButtons.forEach(button => {
        const selected = button.dataset.tab === tab;
        button.setAttribute('aria-selected', `${selected}`);
        button.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel, name) => {
        panel.hidden = name !== tab;
    });
}

export function initDetail() {
    tabButtons.forEach(button => button.addEventListener('click', () => {
        if (!currentBlock) return;
        selectTab(button.dataset.tab);
        replace(`#/block/${currentBlock.id}/${button.dataset.tab}`);
    }));
}

// Route: #/block/<id>[/tab]
export function showBlock([id, tab] = []) {
    const block = blocksById.get(id);
    if (!block) return false;

    if (block !== currentBlock) {
        currentBlock = block;
        title.textContent = block.name;
        hero.innerHTML = renderHero(block);
        panels.forEach((panel, name) => {
            panel.innerHTML = RENDERERS[name](block);
        });
    }

    selectTab(TABS.includes(tab) ? tab : 'info');
    return block.name;
}

export function getBlockParent([id] = []) {
    const block = blocksById.get(id);
    return block ? `#/blocks/${block.category}` : '#/blocks';
}
