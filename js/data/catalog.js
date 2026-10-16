// Builds the encyclopedia's data from the addon's own files (copied into addon/ by
// tools/sync-addon.ps1) plus the site-only additions in this folder.

import { BLOCK_INFO } from '../../addon/tool_ui/block_info.js';
import { BLOCK_FORMS, buildTabs } from '../../addon/tool_ui/block_forms.js';
import { conditionTools } from '../../addon/tool_ui/conditions_tools.js';
import {
    BRUSH,
    COMMON_INPUTS,
    SPECIAL_TARGETS,
    getClassOutputs,
    getEntityClass,
    getEntityClassIds
} from '../../addon/engine/classes.js';
import { BLOCK_META, CATEGORIES } from './block-meta.js';
import { CONDITION_EXTRAS } from './condition-extras.js';
import { stripCodes } from '../format.js';

export const MISSING_TEXTURE = 'assets/ui/missing_texture.png';

// The in-game Usage page of every block ends with the same steps for wiring outputs, and the Info
// page ends with the block's outputs/inputs and the inputs every block accepts. Block pages show
// those parts in their own tab, and the guide shows the shared text once.
const OUTPUTS_HEADING = '§eOutputs:';
const COMMON_INPUTS_HEADING = '§eInputs every entity accepts:';

// Form tabs that are the same on every block; the guide explains them.
const SHARED_FORM_TABS = new Set(['output', 'saved', 'input', 'help']);

// Stand-ins for dropdowns whose options depend on the world, e.g. the filters you have named.
const FORM_CONTEXT = {
    outputNames: ['a saved output (by label)'],
    filterTargets: ['a named filter block'],
    areaPortalTargets: ['a named info_target_areaportal'],
    outputTypes: [],
    targetOptions: [],
    inputOptions: []
};

// The addon's own short names, as used by /brr:block_fill: brr:logic_relay_block -> logic_relay.
export function getShortId(typeId) {
    return typeId.replace(/^brr:/, '').replace(/_block$/, '');
}

function cutAt(text, marker) {
    const value = `${text ?? ''}`;
    const index = value.indexOf(marker);
    return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index)];
}

function firstSentence(text) {
    const line = stripCodes(text).trim().split('\n')[0] ?? '';
    return line.split(/(?<=\.)\s/)[0];
}

// SECTION: Settings
const KIND_LABELS = { text: 'Text', toggle: 'On / Off', drop: 'Choice' };

function describeField(field, descriptor) {
    const result = {
        label: field.label,
        kind: KIND_LABELS[field.kind] ?? field.kind,
        hint: field.placeholder ?? '',
        // Fields like "Add case" or "Edit slot" are form controls, not saved settings.
        control: field.key.startsWith('__'),
        default: ''
    };

    try {
        if (field.kind === 'drop') {
            const options = field.options(FORM_CONTEXT) ?? [];
            result.conditionList = options === conditionTools;
            result.options = result.conditionList ? [] : options;
            result.default = options[field.read({}, FORM_CONTEXT)] ?? '';
        } else if (field.kind === 'toggle') {
            result.default = field.read({}, FORM_CONTEXT) ? 'On' : 'Off';
        } else if (field.key === 'name') {
            // The form invents a name like "trigger4821" when left blank.
            result.default = `${descriptor.prefix} + a random number`;
        } else {
            result.default = `${field.read({}, FORM_CONTEXT) ?? ''}`;
        }
    } catch (error) {
        console.warn(`Could not read field ${field.key}:`, error);
    }

    return result;
}

function getSettingTabs(typeId) {
    const descriptor = BLOCK_FORMS[typeId];
    if (!descriptor) return [];

    return buildTabs(descriptor)
        .filter(tab => !SHARED_FORM_TABS.has(tab.id))
        .map(tab => {
            let note = '';
            if (tab.id === 'list') note = `Holds up to ${descriptor.list.max} ${descriptor.list.noun}s. Fill the fields, turn on "Add ${descriptor.list.noun}" and submit; the Saved tab lists and deletes them.`;
            if (tab.id === 'slots') note = `${descriptor.slots.count} ${descriptor.slots.noun}s, edited one at a time.`;
            return {
                label: tab.label,
                note,
                fields: tab.fields.map(field => describeField(field, descriptor))
            };
        });
}

// SECTION: Blocks
const metaOrder = Object.keys(BLOCK_META);
const categoryIds = new Set(CATEGORIES.map(category => category.id));

function buildBlock(typeId) {
    const meta = BLOCK_META[typeId] ?? {};
    const entityClass = getEntityClass(typeId);
    const page = BLOCK_INFO[typeId] ?? meta.help ?? {};
    const shortId = getShortId(typeId);

    const [info] = cutAt(page.info, `\n\n${OUTPUTS_HEADING}`);
    const [usage] = cutAt(page.usage, OUTPUTS_HEADING);
    const settings = getSettingTabs(typeId);
    const classOutputs = entityClass?.outputs ?? [];
    const outputs = getClassOutputs(typeId);

    const block = {
        typeId,
        id: shortId,
        name: meta.name ?? shortId,
        category: categoryIds.has(meta.category) ? meta.category : 'other',
        icon: `assets/blocks/${shortId}.png`,
        isBrush: entityClass?.kind === BRUSH,
        hasForm: Boolean(BLOCK_FORMS[typeId]),
        summary: firstSentence(info) || 'No description yet.',
        help: { info, usage, examples: `${page.examples ?? ''}` },
        settings,
        conditionFields: settings.flatMap(tab => tab.fields
            .filter(field => field.conditionList)
            .map(field => ({ tab: tab.label, label: field.label }))),
        outputs: classOutputs,
        userOutputs: outputs.filter(output => !classOutputs.includes(output)),
        inputs: entityClass?.inputs ?? []
    };

    block.searchText = [
        block.name,
        typeId,
        block.summary,
        stripCodes(Object.values(block.help).join(' ')),
        ...settings.flatMap(tab => tab.fields.map(field => field.label)),
        ...outputs,
        ...block.inputs
    ].join(' ').toLowerCase();

    return block;
}

function sortKey(typeId) {
    const index = metaOrder.indexOf(typeId);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export const blocks = getEntityClassIds()
    .sort((a, b) => sortKey(a) - sortKey(b))
    .map(buildBlock);

export const blocksById = new Map(blocks.map(block => [block.id, block]));

export const categories = blocks.some(block => block.category === 'other')
    ? [...CATEGORIES, { id: 'other', label: 'Other Blocks', icon: MISSING_TEXTURE }]
    : [...CATEGORIES];

// SECTION: Shared Help (shown once in the guide)
function findShared(section, heading) {
    for (const page of Object.values(BLOCK_INFO)) {
        const [, shared] = cutAt(page[section], heading);
        if (shared) return shared.trim();
    }
    return '';
}

export const sharedHelp = {
    outputSteps: findShared('usage', OUTPUTS_HEADING),
    commonInputs: findShared('info', COMMON_INPUTS_HEADING),
    commonInputNames: [...COMMON_INPUTS],
    specialTargets: [...SPECIAL_TARGETS]
};

// SECTION: Conditions
// Parsed from the Conditions help page: an intro, then one block per group made of
// "§b<name>§r <syntax>" lines, each optionally followed by a "§7  <note>" line.
function parseConditionHelp(text) {
    const intro = [];
    const groups = [];

    for (const section of `${text ?? ''}`.split(/\n{2,}/)) {
        const lines = section.split('\n');
        const conditions = [];

        for (const line of lines.slice(1)) {
            const match = /^§b(\w+)§r\s*(.*)$/.exec(line);
            if (match) {
                conditions.push({ key: match[1], syntax: stripCodes(match[2]).trim(), note: '' });
            } else if (conditions.length > 0) {
                const last = conditions[conditions.length - 1];
                last.note = `${last.note} ${stripCodes(line).trim()}`.trim();
            }
        }

        if (conditions.length === 0) {
            intro.push(section);
            continue;
        }

        const heading = stripCodes(lines[0]).trim();
        const [, title, note] = /^(.*?)\s*(?:\((.*)\))?$/.exec(heading);
        groups.push({ title, note: note ?? '', conditions });
    }

    return { intro: intro.join('\n\n'), groups };
}

function buildConditionReference() {
    const helpText = Object.values(BLOCK_INFO).find(page => page.conditions)?.conditions ?? '';
    const { intro, groups } = parseConditionHelp(helpText);

    // Conditions the dropdown offers but the help page does not describe (yet).
    const described = new Set(groups.flatMap(group => group.conditions.map(condition => condition.key)));
    const undescribed = conditionTools.filter(key => !described.has(key));
    if (undescribed.length > 0) {
        groups.push({
            title: 'Other conditions',
            note: 'Not described in the addon yet.',
            conditions: undescribed.map(key => ({ key, syntax: '', note: '' }))
        });
    }

    for (const group of groups) {
        for (const condition of group.conditions) {
            const extra = CONDITION_EXTRAS[condition.key] ?? {};
            condition.description = condition.note || extra.description || '';
            condition.example = extra.example ?? '';
            condition.searchText = [condition.key, condition.syntax, condition.description, condition.example, group.title]
                .join(' ')
                .toLowerCase();
        }
    }

    return {
        intro,
        groups,
        usedBy: blocks
            .filter(block => block.conditionFields.length > 0)
            .map(block => ({ block, fields: block.conditionFields }))
    };
}

export const conditionReference = buildConditionReference();
