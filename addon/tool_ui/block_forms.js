import { conditionTools } from "./conditions_tools.js";
import { getClassOutputs } from "../engine/classes.js";

// SECTION: Field Constructors
// Every block UI is described here and nowhere else. `RP/ui/blocks/*.json` is generated from
// this file (see tools/generate_block_ui.mjs), so script control order and JSON UI
// `collection_index` values can never drift apart again.
//
// Layout rule used by the generator: `text`/`label` fields render in the left column,
// `drop`/`toggle` fields render in the right column, both in declaration order.

const text = (key, label, placeholder, read) => ({ kind: "text", key, label, placeholder, read });
const toggle = (key, label, read) => ({ kind: "toggle", key, label, read });
const drop = (key, label, options, read, write) => ({ kind: "drop", key, label, options, read, write });
const info = (key, label, read) => ({ kind: "label", key, label, read });

const str = (key, fallback = "") => (data) => `${data?.[key] ?? fallback}`;
const bool = (key, fallback = false) => (data) => {
    const value = data?.[key];
    return value === undefined || value === null ? fallback : Boolean(value);
};

const NAME_FIELD = (prefix) => text("name", "Name", "Unique block name", (data) =>
    `${data?.name ?? ""}` || `${prefix}${Math.round(Math.random() * 10000)}`
);
const START_DISABLED = toggle("startDisabled", "Start disabled", bool("startDisabled", false));

const CONDITION_FIELD = (key, label) => drop(
    key,
    label,
    () => conditionTools,
    (data) => Math.max(0, conditionTools.indexOf(data?.[key] || "noCondition")),
    (index) => conditionTools[index] ?? "noCondition"
);

const NONE_OPTION = "(None)";

export function isBlockedCommandText(command) {
    const normalized = `${command ?? ""}`.trim().replace(/^\/+/, "").trim().toLowerCase();
    return /^(minecraft:)?(op|deop)(\s|$)/.test(normalized);
}

const runOutputOptions = (ctx) => [NONE_OPTION, ...ctx.outputNames];
const runOutputRead = (key) => (data, ctx) => Math.max(0, runOutputOptions(ctx).indexOf(data?.[key] || NONE_OPTION));
const runOutputWrite = (index, ctx) => {
    const options = runOutputOptions(ctx);
    return index > 0 ? (options[index] ?? "") : "";
};
const RUN_OUTPUT = (key, label) => drop(key, label, runOutputOptions, runOutputRead(key), runOutputWrite);

// Picks a named filter_class / filter_name / filter_multiple entity.
const filterOptions = (ctx) => [NONE_OPTION, ...ctx.filterTargets];
const FILTER_FIELD = (key, label) => drop(
    key,
    label,
    filterOptions,
    (data, ctx) => Math.max(0, filterOptions(ctx).indexOf(data?.[key] || NONE_OPTION)),
    (index, ctx) => (index > 0 ? (filterOptions(ctx)[index] ?? "") : "")
);
const NEGATED = toggle("negated", "Negated", bool("negated", false));

// SECTION: Shared Tabs
// Source-style connection: <My output> -> <Target entity>.<Target input>(<Parameter>) after <Delay>,
// at most <Times to fire> times.
export const OUTPUT_TAB_FIELDS = [
    text("__outputLabel", "Output label", "Auto-generated if blank", () => ""),
    text("__outputParam", "Parameter", "Input parameter (optional)", () => ""),
    text("__outputDelay", "Delay (seconds)", "0", () => "0"),
    text("__outputTimes", "Times to fire", "-1 = every time", () => "-1"),
    drop("__outputType", "My output", (ctx) => ctx.outputTypes, () => 0),
    drop("__outputTarget", "Target entity", (ctx) => ctx.targetOptions, () => 0),
    drop("__outputInput", "Target input", (ctx) => ctx.inputOptions, () => 0),
    toggle("__outputAdd", "Add this output", () => false)
];

export const SAVED_TAB_OUTPUT_FIELDS = [
    info("__savedOutputs", "Existing outputs", (data, ctx) => ctx.outputSummary),
    drop("__deleteOutput", "Delete output", (ctx) => [NONE_OPTION, ...ctx.outputNames], () => 0),
    toggle("__deleteOutputConfirm", "Delete selected output", () => false)
];

export const INPUT_TAB_FIELDS = [
    info("__savedInputs", "Incoming inputs", (data, ctx) => ctx.inputSummary)
];

// Help shows these fields in separate Examples / Usage / Info tabs, without a script round trip.
// Keep their order stable: navigation does not submit or rebuild the editable form.
export const HELP_TAB_FIELDS = [
    info("__helpExamples", "Examples", (data, ctx) => ctx.helpExamples),
    info("__helpUsage", "Usage", (data, ctx) => ctx.helpUsage),
    info("__helpInfo", "Info", (data, ctx) => ctx.helpInfo)
];

// Extra Help page for forms whose descriptor sets `conditionsHelp`: the condition syntax list.
export const CONDITIONS_HELP_FIELD = info("__helpConditions", "Conditions", (data, ctx) => ctx.helpConditions);

export const SAVED_TAB_ENTRY_FIELDS = [
    info("__savedEntries", "Existing entries", (data, ctx) => ctx.entrySummary),
    drop("__deleteEntry", "Delete entry", (ctx) => [NONE_OPTION, ...ctx.entryLabels], () => 0),
    toggle("__deleteEntryConfirm", "Delete selected entry", () => false)
];

// SECTION: Block Descriptors
export const BLOCK_FORMS = {
    "brr:tool_trigger": {
        title: "Trigger Tool",
        namespace: "tool_trigger",
        prefix: "trigger",
        conditionsHelp: true,
        validate: (data) => (isBlockedCommandText(data.runCommand)
            ? "Blocked command: /op and /deop cannot be run from engine blocks."
            : ""),
        classFields: [
            NAME_FIELD("trigger"),
            text("conditionValue1", "Condition value 1", "Leave blank if unused", str("conditionValue1")),
            text("conditionValue2", "Condition value 2", "Leave blank if unused", str("conditionValue2")),
            text("conditionValue3", "Condition value 3", "Leave blank if unused", str("conditionValue3")),
            text("runCommand", "Run command", "Command to execute", str("runCommand")),
            CONDITION_FIELD("executeCondition", "Execute on condition"),
            FILTER_FIELD("filter", "Filter"),
            START_DISABLED
        ]
    },

    "brr:tool_areaportal": {
        title: "Area Portal Tool",
        namespace: "tool_areaportal",
        prefix: "areaportal",
        validate: (data) => {
            // A destination block wins; keeping both set is what used to send players to the wrong place.
            if (data.destinationBlock) data.destination = "";
            return (data.destination || data.destinationBlock)
                ? ""
                : "Set either a Destination or a Destination block.";
        },
        classFields: [
            NAME_FIELD("areaportal"),
            text("selector", "Selector", "minecraft:player", (data) => `${data?.selector ?? ""}` || "minecraft:player"),
            text("destination", "Destination", "Pos: XYZ (blank when using a target block)", str("destination")),
            drop(
                "destinationBlock",
                "Destination block",
                (ctx) => [NONE_OPTION, ...ctx.areaPortalTargets],
                (data, ctx) => Math.max(0, [NONE_OPTION, ...ctx.areaPortalTargets].indexOf(data?.destinationBlock || NONE_OPTION)),
                (index, ctx) => (index > 0 ? (ctx.areaPortalTargets[index - 1] ?? "") : "")
            ),
            FILTER_FIELD("filter", "Filter"),
            START_DISABLED
        ]
    },

    "brr:tool_invisible": {
        title: "Tool Invisible",
        namespace: "tool_invisible",
        prefix: "invisible",
        classFields: [NAME_FIELD("invisible"), START_DISABLED]
    },

    "brr:tool_playerclip": {
        title: "Tool Playerclip",
        namespace: "tool_playerclip",
        prefix: "playerclip",
        classFields: [
            NAME_FIELD("playerclip"),
            text("excludeSelector", "Exclude selector", "@a[tag=lobby,tag=!game]", str("excludeSelector")),
            drop(
                "excludeGamemode",
                "Exclude gamemode",
                () => ["none", "survival", "creative", "adventure", "spectator"],
                (data) => Math.max(0, ["none", "survival", "creative", "adventure", "spectator"]
                    .indexOf(`${data?.excludeGamemode ?? "none"}`.trim().toLowerCase())),
                (index) => ["none", "survival", "creative", "adventure", "spectator"][index] ?? "none"
            ),
            START_DISABLED,
            toggle("excludeOperators", "Exclude operators", bool("excludeOperators", true))
        ]
    },

    "brr:tool_npcclip": {
        title: "Tool Npcclip",
        namespace: "tool_npcclip",
        prefix: "npcclip",
        classFields: [
            NAME_FIELD("npcclip"),
            text("excludeSelector", "Exclude selector", "@e[type=zombie]", str("excludeSelector")),
            START_DISABLED
        ]
    },

    "brr:info_playerspawn_block": {
        title: "Info Playerspawn Block",
        namespace: "info_playerspawn",
        prefix: "playerspawn",
        classFields: [
            NAME_FIELD("playerspawn"),
            text("worldSpawn", "World spawn coordinates", "Pos: XYZ (e.g. 0 64 0)", str("worldSpawn")),
            text("selectors", "Spawn point selector", "@a", (data) => `${data?.selectors ?? ""}` || "@a"),
            START_DISABLED,
            toggle("worldSpawnAtBlock", "World spawn at block", bool("worldSpawnAtBlock", true)),
            toggle("setsPlayerSpawnPoint", "Set player spawn point", bool("setsPlayerSpawnPoint", false)),
            toggle("teleportOnJoin", "Teleport on join", bool("teleportOnJoin", true))
        ]
    },

    "brr:info_target_areaportal_block": {
        title: "Info Target AreaPortal Block",
        namespace: "info_target_areaportal",
        prefix: "target_areaportal",
        classFields: [
            NAME_FIELD("target_areaportal"),
            text("targetFacingDirection", "Facing direction", "Pos: XYZ (optional)", str("targetFacingDirection")),
            START_DISABLED
        ]
    },

    "brr:game_nametag_block": {
        title: "Game Nametag Block",
        namespace: "game_nametag",
        prefix: "game_nametag",
        classFields: [
            NAME_FIELD("game_nametag"),
            text("nametag", "Nametag", "Tag shown around the username", str("nametag")),
            text("nametagOrder", "Nametag order", "0", (data) => `${data?.nametagOrder ?? 0}`),
            text("selectors", "Selectors", "@a", (data) => `${data?.selectors ?? ""}` || "@a"),
            START_DISABLED,
            toggle("worksInUsernames", "Works in usernames", bool("worksInUsernames", true)),
            toggle("worksInChat", "Works in chat", bool("worksInChat", true)),
            toggle("prefix", "Prefix", bool("prefix", true)),
            toggle("suffix", "Suffix", bool("suffix", false))
        ]
    },

    "brr:ambient_generic_block": {
        title: "Ambient Generic",
        namespace: "ambient_generic",
        prefix: "ambient",
        validate: (data) => {
            if (!/^[a-z0-9_.:-]+$/i.test(`${data.soundId ?? ""}`)) return "Sound ID is required, e.g. random.orb or ambient.weather.rain.";
            if (!(Number.parseFloat(data.volume) >= 0)) return "Volume must be a number, 0 or more.";
            if (!(Number.parseFloat(data.pitch) > 0)) return "Pitch must be a number above 0.";
            if (data.loop && !(Number.parseInt(data.loopLength, 10) >= 1)) return "Loop length must be at least 1 tick.";
            return "";
        },
        classFields: [
            NAME_FIELD("ambient"),
            text("soundId", "Sound ID", "random.orb", str("soundId")),
            text("volume", "Volume", "1 = heard ~16 blocks away", (data) => `${data?.volume ?? 1}`),
            text("pitch", "Pitch", "1 = normal", (data) => `${data?.pitch ?? 1}`),
            text("loopLength", "Loop length (ticks)", "Length of the sound", (data) => `${data?.loopLength ?? 40}`),
            START_DISABLED,
            toggle("loop", "Loop", bool("loop", false)),
            toggle("startSilent", "Start silent", bool("startSilent", true)),
            toggle("playEverywhere", "Play everywhere", bool("playEverywhere", false))
        ]
    },

    "brr:logic_auto_block": {
        title: "Logic Auto",
        namespace: "logic_auto",
        prefix: "logic_auto",
        classFields: [NAME_FIELD("logic_auto"), START_DISABLED],
        list: {
            key: "automations",
            noun: "automation",
            tabLabel: "Auto",
            max: 16,
            summary: (entry, index) =>
                `${index + 1}. out:${entry?.runOutput || "-"} cmd:${entry?.runCommand || "-"} `
                + `load:${entry?.onWorldLoad ? "y" : "n"} once:${entry?.runOnce ? "y" : "n"} `
                + `loop:${entry?.runPeriodically ? "y" : "n"} delay:${entry?.tickDelay ?? 20}`,
            fields: [
                text("runCommand", "Run command", "Command to execute (optional)", () => ""),
                text("tickDelay", "Tick delay", "20", () => "20"),
                RUN_OUTPUT("runOutput", "Run output"),
                toggle("onWorldLoad", "On world load", () => true),
                toggle("runOnce", "Run once", () => false),
                toggle("runPeriodically", "Run periodically", () => false)
            ],
            validate: (entry) => {
                if (entry.runOnce && entry.runPeriodically) {
                    return "Run once and Run periodically are mutually exclusive.";
                }
                return "";
            }
        }
    },

    "brr:logic_branch_block": {
        title: "Logic Branch",
        namespace: "logic_branch",
        prefix: "logic_branch",
        classFields: [
            NAME_FIELD("logic_branch"),
            text("conditionValue1", "Condition value 1", "Leave blank if unused", str("conditionValue1")),
            text("conditionValue2", "Condition value 2", "Leave blank if unused", str("conditionValue2")),
            text("conditionValue3", "Condition value 3", "Leave blank if unused", str("conditionValue3")),
            text("runInterval", "Run interval (ticks)", "0 = only on change", (data) => `${data?.runInterval ?? 0}`),
            CONDITION_FIELD("executeCondition", "Output test"),
            START_DISABLED,
            toggle("runOnce", "Run once", bool("runOnce", false))
        ],
        extraTab: {
            id: "actions",
            label: "Actions",
            fields: [
                text("ifTrueRunCommand", "If true run command", "Command (optional)", str("ifTrueRunCommand")),
                text("ifFalseRunCommand", "If false run command", "Command (optional)", str("ifFalseRunCommand")),
                RUN_OUTPUT("ifTrueRunOutput", "If true run output"),
                RUN_OUTPUT("ifFalseRunOutput", "If false run output")
            ]
        }
    },

    "brr:logic_case_block": {
        title: "Logic Case",
        namespace: "logic_case",
        prefix: "logic_case",
        classFields: [NAME_FIELD("logic_case"), START_DISABLED],
        list: {
            key: "cases",
            noun: "case",
            tabLabel: "Cases",
            max: 16,
            summary: (entry, index) =>
                `${index + 1}. ${entry?.condition || "noCondition"} `
                + `(${entry?.conditionValue1 || "-"}, ${entry?.conditionValue2 || "-"}, ${entry?.conditionValue3 || "-"}) `
                + `out:${entry?.runOutput || "-"} cmd:${entry?.runCommand || "-"}`,
            fields: [
                text("conditionValue1", "Case value 1", "Leave blank if unused", () => ""),
                text("conditionValue2", "Case value 2", "Leave blank if unused", () => ""),
                text("conditionValue3", "Case value 3", "Leave blank if unused", () => ""),
                text("runCommand", "Run command", "Command (optional)", () => ""),
                CONDITION_FIELD("condition", "Case condition"),
                RUN_OUTPUT("runOutput", "Run output")
            ]
        }
    },

    "brr:logic_compare_block": {
        title: "Logic Compare",
        namespace: "logic_compare",
        prefix: "logic_compare",
        classFields: [NAME_FIELD("logic_compare"), START_DISABLED],
        list: {
            key: "comparisons",
            noun: "comparison",
            tabLabel: "Compare",
            max: 16,
            summary: (entry, index) =>
                `${index + 1}. ${entry?.objective || "-"} / ${entry?.entity || "-"} `
                + `${entry?.comparingFor || "-"} ${entry?.initialValue ?? 0} `
                + `out:${entry?.runOutput || "-"} cmd:${entry?.runCommand || "-"}`,
            fields: [
                text("objective", "Scoreboard objective", "objective name", () => ""),
                text("entity", "Scoreboard entity", "selector or fake player", () => ""),
                text("initialValue", "Initial value", "0", () => "0"),
                text("runCommand", "Run command", "Command (optional)", () => ""),
                drop(
                    "comparingFor",
                    "Comparing for",
                    () => ["OnLessThan", "OnEqualTo", "OnNotEqualTo", "OnGreaterThan"],
                    () => 1,
                    (index) => ["OnLessThan", "OnEqualTo", "OnNotEqualTo", "OnGreaterThan"][index] ?? "OnEqualTo"
                ),
                RUN_OUTPUT("runOutput", "Run output")
            ],
            validate: (entry) => (entry.objective ? "" : "Scoreboard objective is required.")
        }
    },

    "brr:logic_coop_manager_block": {
        title: "Logic Coop Manager",
        namespace: "logic_coop_manager",
        prefix: "logic_coop",
        classFields: [
            NAME_FIELD("logic_coop"),
            text("playerASelector", "Player A selector", "@a[tag=playerA]", str("playerASelector")),
            text("playerBSelector", "Player B selector", "@a[tag=playerB]", str("playerBSelector")),
            START_DISABLED,
            toggle("playerAState", "Player A state", bool("playerAState", false)),
            toggle("playerBState", "Player B state", bool("playerBState", false))
        ]
    },

    "brr:logic_random_outputs_block": {
        title: "Logic Random Outputs",
        namespace: "logic_random_outputs",
        prefix: "logic_random",
        classFields: [
            NAME_FIELD("logic_random"),
            text("randomChanceRange", "Random chance range (1-10)", "2", (data) => `${data?.randomChanceRange ?? 2}`),
            text("randomnessInterval", "Randomness interval (ticks)", "20", (data) => `${data?.randomnessInterval ?? 20}`),
            START_DISABLED,
            toggle("runOnce", "Run once", bool("runOnce", false)),
            toggle("runOnInput", "Run on input", bool("runOnInput", false)),
            toggle("rerunSelection", "Rerun selection", bool("rerunSelection", false))
        ],
        validate: (data) => {
            const range = Number.parseInt(`${data.randomChanceRange}`, 10);
            if (!Number.isFinite(range) || range < 1 || range > 10) {
                return "Random chance range must be between 1 and 10.";
            }
            if (data.runOnce && !data.runOnInput && Number.parseInt(`${data.randomnessInterval}`, 10) > 0) {
                return "Run once and Randomness interval are mutually exclusive while Run on input is off.";
            }
            return "";
        },
        slots: {
            key: "randomSlots",
            count: 10,
            noun: "slot",
            tabLabel: "Slots",
            fields: [
                text("runCommand", "Slot fire command", "Command (optional)", () => ""),
                drop("__slotIndex", "Edit slot", () => [
                    "Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5",
                    "Slot 6", "Slot 7", "Slot 8", "Slot 9", "Slot 10"
                ], () => 0),
                RUN_OUTPUT("runOutput", "Slot fire output"),
                toggle("__slotSave", "Save this slot", () => false)
            ]
        }
    },

    "brr:logic_timer_block": {
        title: "Logic Timer",
        namespace: "logic_timer",
        prefix: "logic_timer",
        validate: (data) => (Number.parseInt(`${data.timer}`, 10) >= 1 ? "" : "Timer must be at least 1 tick."),
        classFields: [
            NAME_FIELD("logic_timer"),
            text("timer", "Timer (ticks)", "20", (data) => `${data?.timer ?? 20}`),
            text("runCommand", "Run command", "Command (optional)", str("runCommand")),
            RUN_OUTPUT("runOutput", "Run output"),
            toggle("startDisabled", "Start disabled", bool("startDisabled", true))
        ]
    },

    "brr:logic_relay_block": {
        title: "Logic Relay",
        namespace: "logic_relay",
        prefix: "logic_relay",
        classFields: [
            NAME_FIELD("logic_relay"),
            text("runCommand", "Run command", "Command (optional)", str("runCommand")),
            START_DISABLED,
            toggle("triggerOnce", "Only trigger once", bool("triggerOnce", false)),
            toggle("fastRetrigger", "Allow fast retrigger", bool("fastRetrigger", false))
        ]
    },

    "brr:filter_class_block": {
        title: "Filter Class",
        namespace: "filter_class",
        prefix: "filter_class",
        validate: (data) => (data.filterClass ? "" : "Entity type is required, e.g. minecraft:zombie or player."),
        classFields: [
            NAME_FIELD("filter_class"),
            text("filterClass", "Entity type", "minecraft:zombie", str("filterClass")),
            START_DISABLED,
            NEGATED
        ]
    },

    "brr:filter_name_block": {
        title: "Filter Name",
        namespace: "filter_name",
        prefix: "filter_name",
        validate: (data) => (data.filterName ? "" : "Activator name is required: a player name or a mob's name tag."),
        classFields: [
            NAME_FIELD("filter_name"),
            text("filterName", "Activator name", "Player name or name tag", str("filterName")),
            START_DISABLED,
            NEGATED
        ]
    },

    "brr:filter_multiple_block": {
        title: "Filter Multiple",
        namespace: "filter_multiple",
        prefix: "filter_multiple",
        classFields: [
            NAME_FIELD("filter_multiple"),
            drop(
                "filterType",
                "Filter type",
                () => ["AND", "OR"],
                (data) => (`${data?.filterType ?? "AND"}`.toUpperCase() === "OR" ? 1 : 0),
                (index) => (index === 1 ? "OR" : "AND")
            ),
            START_DISABLED,
            NEGATED
        ],
        list: {
            key: "filters",
            noun: "filter",
            tabLabel: "Filters",
            max: 5,
            summary: (entry, index) => `${index + 1}. ${entry?.filter || "-"}`,
            fields: [
                drop("filter", "Filter", (ctx) => ctx.filterTargets, () => 0)
            ],
            validate: (entry) => (entry.filter ? "" : "Name a filter_class / filter_name / filter_multiple block first, then pick it here.")
        }
    },

    "brr:math_counter_block": {
        title: "Math Counter",
        namespace: "math_counter",
        prefix: "math_counter",
        validate: (data) => {
            for (const [key, label] of [["startValue", "Initial value"], ["min", "Minimum"], ["max", "Maximum"]]) {
                if (!Number.isFinite(Number.parseFloat(data[key]))) return `${label} must be a number.`;
            }
            if (Number.parseFloat(data.min) > Number.parseFloat(data.max)) return "Minimum cannot be larger than Maximum.";
            if (data.scoreObjective && !data.scoreHolder && !data.name) return "Set a Score holder (or a Name) to mirror the value into a scoreboard.";
            return "";
        },
        classFields: [
            NAME_FIELD("math_counter"),
            text("startValue", "Initial value", "0", (data) => `${data?.startValue ?? 0}`),
            text("min", "Minimum", "Min and Max both 0 = no limits", (data) => `${data?.min ?? 0}`),
            text("max", "Maximum", "Min and Max both 0 = no limits", (data) => `${data?.max ?? 0}`),
            START_DISABLED
        ],
        extraTab: {
            id: "scoreboard",
            label: "Score",
            fields: [
                text("scoreObjective", "Scoreboard objective", "Optional: mirror the value here", str("scoreObjective")),
                text("scoreHolder", "Score holder", "Fake player (default: Name)", str("scoreHolder"))
            ]
        }
    }
};

// Each form offers exactly the outputs its entity class can fire.
for (const [typeId, descriptor] of Object.entries(BLOCK_FORMS)) {
    descriptor.outputTypes = getClassOutputs(typeId);
}

// SECTION: Tab Assembly
// Produces the exact ordered field list the script form emits and the JSON UI binds to.
export function buildTabs(descriptor) {
    const tabs = [{ id: "class", label: "Class", fields: [...descriptor.classFields] }];

    if (descriptor.list) {
        tabs.push({
            id: "list",
            label: descriptor.list.tabLabel,
            fields: [...descriptor.list.fields, toggle("__listAdd", `Add ${descriptor.list.noun}`, () => false)]
        });
    }

    if (descriptor.slots) {
        tabs.push({ id: "slots", label: descriptor.slots.tabLabel, fields: [...descriptor.slots.fields] });
    }

    if (descriptor.extraTab) {
        tabs.push({ id: descriptor.extraTab.id, label: descriptor.extraTab.label, fields: descriptor.extraTab.fields });
    }

    tabs.push({ id: "output", label: "Output", fields: OUTPUT_TAB_FIELDS });

    const savedFields = [...SAVED_TAB_OUTPUT_FIELDS];
    if (descriptor.list) savedFields.push(...SAVED_TAB_ENTRY_FIELDS);
    if (descriptor.slots) savedFields.push(info("__savedSlots", "Random slots", (data, ctx) => ctx.entrySummary));
    tabs.push({ id: "saved", label: "Saved", fields: savedFields });

    tabs.push({ id: "input", label: "Input", fields: INPUT_TAB_FIELDS });
    tabs.push({
        id: "help",
        label: "Help",
        hidden: true,
        fields: descriptor.conditionsHelp ? [...HELP_TAB_FIELDS, CONDITIONS_HELP_FIELD] : HELP_TAB_FIELDS
    });

    return tabs;
}

export { NONE_OPTION };
