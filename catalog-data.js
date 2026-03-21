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
    tool_invisible: "assets/brr_invisible.png",
    tool_blocklight: "assets/brr_blockLight.png",
    game_nametag: "assets/game_nametag.png"
  };

  const entries = [
    {
      id: "tool_trigger",
      name: "Trigger Tool",
      category: "Tools",
      menuGroup: "tools",
      summary: "Detects entities or players and conditionally executes commands.",
      usage: "Use this for touch or logic triggers with condition checks and outputs.",
      example: "Run an action only when a tagged player enters a trigger zone.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "tool_areaportal",
      name: "Area Portal Tool",
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
      category: "Tools",
      menuGroup: "tools",
      summary: "Defines world spawn and optional player spawn behavior.",
      usage: "Use this to set the map spawn setup.",
      example: "Set lobby spawn and optionally apply it to players too.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "info_target_areaportal",
      name: "Info Target AreaPortal",
      category: "Tools",
      menuGroup: "tools",
      summary: "Named destination marker for area portal links.",
      usage: "Create named anchors that area portals can target.",
      example: "Make destination Arena_A and send multiple portals to it.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "tool_playerclip",
      name: "Player Clip Tool",
      category: "Tools",
      menuGroup: "tools",
      summary: "Blocks players while allowing configured exceptions.",
      usage: "Use gamemode, operator, or selector-based exclusions.",
      example: "Allow only creative builders to pass through a blocked zone.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "tool_invisible",
      name: "Tool Invisible",
      category: "Tools",
      menuGroup: "tools",
      summary: "Invisible collision helper block.",
      usage: "Use for invisible pass or collision utility behavior.",
      example: "Build invisible boundaries for map flow.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "tool_blocklight",
      name: "Tool Blocklight",
      category: "Tools",
      menuGroup: "tools",
      summary: "Invisible utility block used for light-support placement.",
      usage: "Acts as a hidden support block with blocklight behavior.",
      example: "Create lit invisible helper regions.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "game_nametag",
      name: "game_nametag",
      category: "Game",
      menuGroup: "game",
      summary: "Creates custom nametag labels used in usernames and chat prefixes.",
      usage: "Configure custom label behavior for chat and nametag presentation.",
      example: "Show a lobby or event label beside a player's name.",
      classInfo: [...defaultClassInfo]
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
