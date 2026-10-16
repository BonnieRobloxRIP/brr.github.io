// Site-only information about each engine block. Everything else (help text, settings, outputs and
// inputs) is read from the addon files in addon/, so it stays in sync with the game.
//
// When the addon gets a new block: run tools/sync-addon.ps1, then add the block here.
// Blocks missing from this list still show up, under "Other", named after their id.

export const CATEGORIES = [
    { id: 'tools', label: 'Tool Blocks', icon: 'assets/blocks/tool_trigger.png' },
    { id: 'logic', label: 'Logic Blocks', icon: 'assets/blocks/logic_case.png' },
    { id: 'info', label: 'Info Blocks', icon: 'assets/blocks/info_playerspawn.png' },
    { id: 'game', label: 'Game Blocks', icon: 'assets/blocks/game_nametag.png' }
];

// Listed in the same order as the addon's creative inventory.
export const BLOCK_META = {
    'brr:tool_trigger': { name: 'Trigger', category: 'tools' },
    'brr:tool_areaportal': { name: 'Area Portal', category: 'tools' },
    'brr:tool_invisible': { name: 'Invisible', category: 'tools' },
    'brr:tool_playerclip': { name: 'Player Clip', category: 'tools' },
    'brr:tool_npcclip': { name: 'NPC Clip', category: 'tools' },
    'brr:tool_blocklight': {
        name: 'Blocklight',
        category: 'tools',
        // The addon has no form or help page for this block, so its text lives here.
        help: {
            info: [
                'Blocks light without being seen. When nobody is holding the Blocklight tool, its blocks turn into invisible blocks that stop all light (light dampening 15) but can be walked through.',
                'This is a brush: tool blocks of the same type that touch each other form one entity.',
                'It has no settings form.'
            ].join('\n'),
            usage: [
                'Place blocklight blocks wherever unwanted light leaks into your map: inside walls, ceilings and gaps between decorations.',
                'Hold the Blocklight tool to see where you placed them, or turn on /brr engine_blocks_always_visible true.'
            ].join('\n\n'),
            examples: [
                '- Fill the gaps behind a decorative wall so skylight stops leaking into an indoor room.',
                '- Line the ceiling of a cave area to keep it dark during the day.'
            ].join('\n')
        }
    },

    'brr:logic_auto_block': { name: 'Logic Auto', category: 'logic' },
    'brr:logic_branch_block': { name: 'Logic Branch', category: 'logic' },
    'brr:logic_case_block': { name: 'Logic Case', category: 'logic' },
    'brr:logic_compare_block': { name: 'Logic Compare', category: 'logic' },
    'brr:logic_coop_manager_block': { name: 'Logic Coop Manager', category: 'logic' },
    'brr:logic_random_outputs_block': { name: 'Logic Random Outputs', category: 'logic' },
    'brr:logic_relay_block': { name: 'Logic Relay', category: 'logic' },
    'brr:logic_timer_block': { name: 'Logic Timer', category: 'logic' },
    'brr:filter_class_block': { name: 'Filter Class', category: 'logic' },
    'brr:filter_name_block': { name: 'Filter Name', category: 'logic' },
    'brr:filter_multiple_block': { name: 'Filter Multiple', category: 'logic' },
    'brr:math_counter_block': { name: 'Math Counter', category: 'logic' },

    'brr:info_playerspawn_block': { name: 'Info Playerspawn', category: 'info' },
    'brr:info_target_areaportal_block': { name: 'Info Target AreaPortal', category: 'info' },

    'brr:game_nametag_block': { name: 'Game Nametag', category: 'game' },
    'brr:ambient_generic_block': { name: 'Ambient Generic', category: 'game' }
};
