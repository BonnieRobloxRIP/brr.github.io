window.BSECatalog = (() => {
  const defaultClassInfo = [
    "Name: <string> - unique name used by links, outputs, and references.",
    "Start Disabled: <boolean> - when true, this block is inactive until enabled."
  ];

  const outputTemplate = [
    "Output Name: <string> - identifier for this output entry.",
    "Output Type: <dropdown> - usually onTrue / onFalse / onTouch (or block-specific events).",
    "Output Target: <dropdown> - another named block to receive this output.",
    "Target Class Info: <dropdown> - class-info field on the target block to edit.",
    "Target Info Value: <string|boolean|number> - value to assign to the chosen target field.",
    "Delay (in ticks): <int> - wait time before this output is applied."
  ];

  const existingOutputTemplate = [
    "Existing Outputs lists every saved output for this block.",
    "Toggle delete for any output you want removed, then save.",
    "Output names are used so you can identify/remove the right link quickly."
  ];

  const inputTemplate = [
    "Inputs are read-only links from other blocks that target this block.",
    "Each entry typically shows source block name + source output name.",
    "If this block has no name yet, it cannot be targeted by outputs."
  ];

  const iconMap = {
    tool_trigger: "assets/brr_trigger.png",
    tool_areaportal: "assets/brr_areaPortal.png",
    info_playerspawn: "assets/info_playerspawn.png",
    info_target_areaportal: "assets/info_target_areaportal.png",
    tool_playerclip: "assets/brr_playerClip.png",
    tool_npcclip: "assets/brr_npcClip.png",
    tool_invisible: "assets/brr_invisible.png",
    tool_blocklight: "assets/brr_blockLight.png",
    game_nametag: "assets/game_nametag.png"
  };

  const entries = [
    {
      id: "tool_trigger",
      name: "Trigger",
      category: "Tools",
      menuGroup: "tools",
      summary: "Runs conditional trigger logic when players are inside the block and can fire onTrue/onFalse outputs.",
      usage: "Set condition type + values and optional command, then wire outputs to named target blocks.",
      example: "If a player in the trigger passes the condition, run command and fire onTrue outputs.",
      outputTemplate: [
        "Output Name: <string> - identifier for this output entry.",
        "Output Type: <onTrue|onFalse> - event fired by trigger condition result.",
        "Output Target: <named block> - block name to receive this output.",
        "Target Class Info: <dropdown> - target property to update.",
        "Target Info Value: <string|boolean|number> - value to assign to the target property.",
        "Delay (in ticks): <int> - wait time before this output is applied."
      ],
      classInfo: [
        "Name: <string> - unique name used by outputs and references.",
        "Start Disabled: <boolean> - when true, trigger logic is inactive.",
        "Execute on Condition: <condition key> - selected condition used for evaluation.",
        "Condition Value 1: <string> - first condition value (depends on chosen condition).",
        "Condition Value 2: <string> - second condition value (optional).",
        "Condition Value 3: <string> - third condition value (optional).",
        "Run Command: <string> - command executed on onTrue when condition passes."
      ]
    },
    {
      id: "tool_areaportal",
      name: "Area Portal",
      category: "Tools",
      menuGroup: "tools",
      summary: "Teleports selected entities to coordinates or a named target.",
      usage: "Pick a selector and either a destination position or destination target block.",
      example: "Teleport players from a lobby portal into a map entrance.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "info_playerspawn",
      name: "Info Playerspawn",
      category: "Logic",
      menuGroup: "logic",
      summary: "Defines spawn behavior for the map using world spawn and optional per-player spawn points.",
      usage: "Use one active playerspawn block at a time. Set world spawn at block or coordinates, then optionally set player spawn points too.",
      example: "Set your lobby as global spawn and optionally force each player spawnpoint to that location.",
      classInfo: [
        ...defaultClassInfo,
        "World Spawn At Block: <boolean> - true uses this block location as world spawn.",
        "World Spawn: <x y z> - coordinate string used when World Spawn At Block is false.",
        "Set Player Spawn Point: <boolean> - when true, updates player spawn points to this location."
      ]
    },
    {
      id: "info_target_areaportal",
      name: "Info Target AreaPortal",
      category: "Logic",
      menuGroup: "logic",
      summary: "Named destination marker block used by Area Portal destination-block routing.",
      usage: "Give it a unique name, then set Area Portal destination block to that name.",
      example: "Name this block Arena_Entry and route several area portals to it.",
      classInfo: [
        ...defaultClassInfo,
        "Facing Direction: <string> - optional orientation metadata for destination behavior."
      ]
    },
    {
      id: "tool_playerclip",
      name: "Player Clip",
      category: "Tools",
      menuGroup: "tools",
      summary: "Blocks players while allowing configured exceptions.",
      usage: "Use gamemode, operator, or selector-based exclusions.",
      example: "Allow only creative builders to pass through a blocked zone.",
      supportsOutputs: false,
      classInfo: [
        ...defaultClassInfo,
        "Exclude Operators: <boolean> - operators can pass through when true.",
        "Exclude Gamemode: <none|survival|creative|adventure|spectator> - players in this gamemode are ignored.",
        "Exclude Selector: <selector|string> - matching players are ignored by clip behavior."
      ]
    },
    {
      id: "tool_npcclip",
      name: "NPC Clip",
      category: "Tools",
      menuGroup: "tools",
      summary: "Repels non-player entities from the clip volume while leaving players unaffected.",
      usage: "Use Name, Start disabled, and optional Exclude Selector to allow specific NPC/entity targets through.",
      example: "Keep hostile mobs out of a safe zone except entities matched by the exclude selector.",
      supportsOutputs: false,
      classInfo: [
        "Name: <string> - unique name used by links and references.",
        "Start Disabled: <boolean> - when true, repel/collision behavior is inactive.",
        "Exclude Selector: <selector|string> - matching entities are ignored by NPC clip behavior."
      ]
    },
    {
      id: "tool_invisible",
      name: "Tool Invisible",
      category: "Tools",
      menuGroup: "tools",
      summary: "Invisible collision helper block that can be toggled active/inactive.",
      usage: "Use to create invisible collision boundaries controlled by Start Disabled.",
      example: "Build invisible boundaries for map flow.",
      supportsOutputs: false,
      classInfo: [...defaultClassInfo]
    },
    {
      id: "tool_blocklight",
      name: "Blocklight",
      category: "Tools",
      menuGroup: "tools",
      summary: "Hidden light-dampening block used to stop light leaks (light dampening 15).",
      usage: "Place as a utility helper. This block has no configurable class-info fields in the addon UI.",
      example: "Use inside walls/ceilings to block unwanted light bleed.",
      supportsOutputs: false,
      supportsInputs: false,
      classInfoConfigurable: false,
      classInfo: []
    },
    {
      id: "game_nametag",
      name: "Game Nametag",
      category: "Game",
      menuGroup: "game",
      summary: "Applies ordered nametag tags to selected players for username and/or chat display.",
      usage: "Configure prefix/suffix toggles, target selector, tag text, and order, then optionally wire outputs.",
      example: "Add a [Lobby] prefix in usernames and chat for players matched by @a[tag=lobby].",
      classInfo: [
        "Name: <string> - unique name used by outputs and references.",
        "Start Disabled: <boolean> - when true, this nametag block is inactive.",
        "Works in Usernames: <boolean> - apply tag to player display names.",
        "Works in Chat: <boolean> - apply tag to chat prefix/suffix formatting.",
        "Suffix: <boolean> - places tag after name/chat when enabled.",
        "Prefix: <boolean> - places tag before name/chat when enabled.",
        "Nametag: <string> - tag text to render.",
        "Nametag Order: <int> - lower values are applied first.",
        "Selectors: <selector> - targets players (default @a)."
      ]
    }
  ];

  return {
    entries,
    defaultClassInfo,
    outputTemplate,
    existingOutputTemplate,
    inputTemplate,
    iconMap
  };
})();
