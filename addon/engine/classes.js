// SECTION: Entity Class Table
// Single source of truth for every engine entity class: whether it is a brush (a volume made of
// tool blocks that auto-merge into one entity) or a point entity (one block), and which outputs
// and inputs it exposes to the I/O system. Forms, the I/O dispatcher and runtime systems all read
// from here, so a class only has to be described once.

export const BRUSH = "brush";
export const POINT = "point";

export const PLACEHOLDER_BLOCK_TYPES = new Set([
    "brr:data",
    "brr:data_collision",
    "brr:data_blocklight",
    "minecraft:client_request_placeholder_block"
]);

const USER_OUTPUTS = ["OnUser1", "OnUser2", "OnUser3", "OnUser4"];

// Inputs every engine entity accepts. Handlers live in engine/io.js.
export const COMMON_INPUTS = [
    "Enable",
    "Disable",
    "Toggle",
    "FireUser1",
    "FireUser2",
    "FireUser3",
    "FireUser4",
    "AddOutput",
    "RunCommand"
];

// Inputs accepted by Minecraft entities reached through !activator / !player.
export const ACTOR_INPUTS = ["RunCommand"];

// Special target names, resolved when the event fires (as in Source).
export const SPECIAL_TARGETS = ["!self", "!activator", "!caller", "!player"];

const range = (count, make) => Array.from({ length: count }, (_, index) => make(index + 1));

const ENTITY_CLASSES = {
    "brr:tool_trigger": {
        kind: BRUSH,
        outputs: ["OnStartTouch", "OnEndTouch", "OnStartTouchAll", "OnEndTouchAll"],
        inputs: []
    },
    "brr:tool_areaportal": {
        kind: BRUSH,
        outputs: ["OnStartTouch"],
        inputs: []
    },
    "brr:tool_invisible": { kind: BRUSH, outputs: [], inputs: [] },
    "brr:tool_playerclip": { kind: BRUSH, outputs: [], inputs: [], defaults: { excludeOperators: true } },
    "brr:tool_npcclip": { kind: BRUSH, outputs: [], inputs: [] },
    "brr:tool_blocklight": { kind: BRUSH, outputs: [], inputs: [] },

    "brr:info_playerspawn_block": {
        kind: POINT,
        outputs: [],
        inputs: [],
        particle: "brr:info_playerspawn",
        defaults: { teleportOnJoin: true }
    },
    "brr:info_target_areaportal_block": { kind: POINT, outputs: [], inputs: [], particle: "brr:info_target_areaportal" },
    "brr:game_nametag_block": { kind: POINT, outputs: [], inputs: [], particle: "brr:game_nametag" },
    "brr:ambient_generic_block": {
        kind: POINT,
        outputs: [],
        inputs: ["PlaySound", "StopSound", "ToggleSound", "Volume", "Pitch"],
        particle: "brr:ambient_generic",
        defaults: { volume: "1", pitch: "1", loop: false, loopLength: "40", startSilent: true, playEverywhere: false }
    },

    "brr:filter_class_block": {
        kind: POINT,
        outputs: ["OnPass", "OnFail"],
        inputs: ["TestActivator"],
        particle: "brr:filter_class",
        defaults: { negated: false }
    },
    "brr:filter_name_block": {
        kind: POINT,
        outputs: ["OnPass", "OnFail"],
        inputs: ["TestActivator"],
        particle: "brr:filter_name",
        defaults: { negated: false }
    },
    "brr:filter_multiple_block": {
        kind: POINT,
        outputs: ["OnPass", "OnFail"],
        inputs: ["TestActivator"],
        particle: "brr:filter_multiple",
        defaults: { filterType: "AND", negated: false, filters: [] }
    },
    "brr:math_counter_block": {
        kind: POINT,
        outputs: ["OutValue", "OnHitMin", "OnHitMax", "OnChangedFromMin", "OnChangedFromMax", "OnGetValue"],
        inputs: [
            "Add", "Subtract", "Multiply", "Divide", "SetValue", "SetValueNoFire", "GetValue",
            "SetHitMin", "SetHitMax", "SetMinValueNoFire", "SetMaxValueNoFire"
        ],
        particle: "brr:math_counter",
        defaults: { startValue: "0", min: "0", max: "0" }
    },

    "brr:logic_auto_block": {
        kind: POINT,
        outputs: ["OnMapSpawn", "OnAutoFire"],
        inputs: [],
        particle: "brr:logic_auto"
    },
    "brr:logic_branch_block": {
        kind: POINT,
        outputs: ["OnTrue", "OnFalse"],
        inputs: ["Test"],
        particle: "brr:logic_branch"
    },
    "brr:logic_case_block": {
        kind: POINT,
        outputs: [...range(16, n => `OnCase${String(n).padStart(2, "0")}`), "OnDefault"],
        inputs: [],
        particle: "brr:logic_case"
    },
    "brr:logic_compare_block": {
        kind: POINT,
        outputs: ["OnLessThan", "OnEqualTo", "OnNotEqualTo", "OnGreaterThan"],
        inputs: [],
        particle: "brr:logic_compare"
    },
    "brr:logic_coop_manager_block": {
        kind: POINT,
        outputs: ["OnChangeToAllTrue", "OnChangeToAnyTrue", "OnChangeToAllFalse", "OnChangeToAnyFalse"],
        inputs: ["SetStateATrue", "SetStateAFalse", "ToggleStateA", "SetStateBTrue", "SetStateBFalse", "ToggleStateB"],
        particle: "brr:logic_coop_manager"
    },
    "brr:logic_random_outputs_block": {
        kind: POINT,
        outputs: range(10, n => `OnTrigger${n}`),
        inputs: ["PickRandom"],
        particle: "brr:logic_random_outputs"
    },
    "brr:logic_relay_block": {
        kind: POINT,
        outputs: ["OnTrigger", "OnSpawn"],
        inputs: ["Trigger", "CancelPending", "EnableRefire"],
        particle: "brr:logic_relay",
        defaults: { triggerOnce: false, fastRetrigger: false }
    },
    "brr:logic_timer_block": {
        kind: POINT,
        outputs: ["OnTimer"],
        inputs: ["RefireTime", "ResetTimer", "FireTimer"],
        particle: "brr:logic_timer",
        defaults: { startDisabled: true }
    }
};

// SECTION: Class Queries
export function getEntityClass(typeId) {
    return ENTITY_CLASSES[typeId];
}

export function isEntityClass(typeId) {
    return Object.prototype.hasOwnProperty.call(ENTITY_CLASSES, typeId);
}

export function isBrushClass(typeId) {
    return ENTITY_CLASSES[typeId]?.kind === BRUSH;
}

export function getEntityClassIds() {
    return Object.keys(ENTITY_CLASSES);
}

export function getClassOutputs(typeId) {
    return [...(ENTITY_CLASSES[typeId]?.outputs ?? []), ...USER_OUTPUTS];
}

export function getClassInputs(typeId) {
    return [...COMMON_INPUTS, ...(ENTITY_CLASSES[typeId]?.inputs ?? [])];
}

export function classAcceptsInput(typeId, inputName) {
    const wanted = `${inputName ?? ""}`.toLowerCase();
    return getClassInputs(typeId).some(input => input.toLowerCase() === wanted);
}

// Every input any class accepts, common inputs first, for the form's input dropdown.
export function getAllInputNames() {
    const names = [...COMMON_INPUTS];
    for (const entityClass of Object.values(ENTITY_CLASSES)) {
        for (const input of entityClass.inputs) {
            if (!names.includes(input)) names.push(input);
        }
    }
    return names;
}

// Deep copy, so defaults such as arrays are never shared between entities.
export function getClassDefaults(typeId) {
    return JSON.parse(JSON.stringify({ startDisabled: false, ...(ENTITY_CLASSES[typeId]?.defaults ?? {}) }));
}

export function getClassParticle(typeId) {
    return ENTITY_CLASSES[typeId]?.particle;
}
