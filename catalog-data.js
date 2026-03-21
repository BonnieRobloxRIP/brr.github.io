window.BSECatalog = (() => {
  const defaultClassInfo = [
    "Name: <string> — unique name used by links, outputs, and references.",
    "Start Disabled: <boolean> — when true, this block is inactive until enabled."
  ];

  const outputTemplate = [
    "Output Name: <string> — identifier for this output entry.",
    "Output Type: <dropdown> — usually onTrue / onFalse / onTouch (or block-specific events).",
    "Output Target: <dropdown> — another named block to receive this output.",
    "Target Class Info: <dropdown> — class-info field on the target block to edit.",
    "Target Info Value: <string|boolean|number> — value to assign to the chosen target field.",
    "Delay (in ticks): <int> — wait time before this output is applied."
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
    tool_playerclip: "assets/brr_playerClip.png",
    tool_npcclip: "assets/brr_nodraw.png",
    tool_invisible: "assets/brr_invisible.png",
    tool_blocklight: "assets/brr_blockLight.png",
    info_playerspawn: "assets/info_playerspawn.png",
    info_playerspawn_block: "assets/info_playerspawn.png",
    info_target_areaportal: "assets/info_target_areaportal.png",
    info_target_areaportal_block: "assets/info_target_areaportal.png",
    skybox_brush: "assets/brr_skybox.png",
    skybox_projector: "assets/brr_skybox.png",
    func_train: "assets/func_train.png",
    func_train_entity: "assets/func_train_mer.png",
    game_nametag: "assets/game_round_win.png",
    fnaf_ai: "assets/scripted_sentence.png",
    fnaf_ai_manager: "assets/logic_script.png",
    fnaf_camera: "assets/scripted_sentence.png",
    fnaf_power_manager: "assets/math_counter.png",
    data: "assets/brr_nodraw.png",
    data_collision: "assets/brr_nodrawPortable.png",
    data_blocklight: "assets/brr_blockLight.png",
    gluon_gun: "assets/scripted_sentence.png",
    dino_speecher: "assets/scripted_sentence.png",
    conditions_tools: "assets/logic_case.png",
    condition_executer: "assets/logic_script.png",
    chat_system: "assets/game_round_win.png",
    block_particles: "assets/env_particles.png",
    gluon_beam_visual: "assets/env_particles.png",
    dev_measuregeneric01: "assets/dev_measuregeneric01.png",
    dev_measuregeneric02: "assets/dev_measuregeneric02.png",
    dev_measuregeneric03: "assets/dev_measuregeneric03.png",
    dev_measuregeneric04: "assets/dev_measuregeneric04.png",
    dev_measurewall01a: "assets/dev_measurewall01a.png",
    dev_measurewall01b: "assets/dev_measurewall01b.png",
    dev_measurewall01c: "assets/dev_measurewall01c.png",
    dev_measurewall01d: "assets/dev_measurewall01d.png"
  };

  function inferMenuGroup(id, category) {
    if (category === "Environment") return "brushes";
    if (
      id.startsWith("game_") ||
      id.startsWith("team_") ||
      id.startsWith("tf_") ||
      id.startsWith("fnaf_") ||
      ["assault_point", "assault_rally", "bullseye", "tanktrain_ai", "tanktrain_aitarget", "npc_maker", "scripted_sentence"].includes(id)
    ) {
      return "game";
    }

    if (
      id.startsWith("logic_") ||
      id.startsWith("choreo_") ||
      id.startsWith("point_") ||
      id.startsWith("math_") ||
      id.startsWith("entity_spawn_") ||
      ["multi_manager", "trigger_relay", "filter_damage_type"].includes(id)
    ) {
      return "logic";
    }

    return "tools";
  }

  const draftBlocksRaw = [
    ["logic_auto", "Logic", "Runs all connected outputs on world load.", "A welcome UI or start game menu."],
    ["logic_branch", "Logic", "Tests a Boolean and fires one of two output paths.", "Check if a lever is on or off."],
    ["logic_case", "Logic", "Compares an input against up to 16 values.", "Check if a specific colored wool block was placed."],
    ["logic_compare", "Logic", "Compares two numbers and fires onLessThan/onEqualTo style outputs.", "Check if a score exactly matches a target value."],
    ["logic_coop_manager", "Logic", "Tracks multiplayer status and shared state.", "Tag players with game to track who is alive."],
    ["logic_measure_movement", "Logic", "Copies movement from one object/entity to another.", "Make an armor stand follow a player like a pet."],
    ["logic_random_outputs", "Logic", "Randomly fires one connected output.", "Pick a random scoreboard value flow."],
    ["logic_relay", "Logic", "Relays one trigger into multiple target triggers.", "Split a redstone-like signal into several actions."],
    ["logic_script", "Logic", "Entry point for advanced scripted behavior.", "Use script APIs for custom logic."],
    ["logic_timer", "Logic", "Fires outputs at fixed or random intervals.", "Reset a timer scoreboard every 200 ticks."],
    ["choreo_manager", "Logic", "Manages ordered playback of scenes/events.", "Advance dialogue scenes as score steps increase."],
    ["choreo_scene", "Logic", "Represents one scene with dialogue, animation, and movement.", "Trigger NPC lines + animations from player choices."],
    ["entity_spawn_manager", "Logic", "Controls how entities are spawned over time.", "Automate summon behavior."],
    ["entity_spawn_point", "Logic", "Defines spawn positions for managed spawns.", "Summon entities at specific coordinates."],
    ["env_entity_maker", "Environment", "Works with point_template to spawn entity sets.", "Load grouped mobs/structures using template data."],
    ["env_shake", "Environment", "Applies camera shake style effects.", "Equivalent of /camerashake behavior."],
    ["env_shooter", "Environment", "Launches props/debris projectiles.", "Dispenser-like object launching."],
    ["env_sun", "Environment", "Controls sun visual behavior.", "Drive sky look via resource/time controls."],
    ["filter_damage_type", "Logic", "Filters damage events by source/type.", "React only to fire or fall damage."],
    ["game_forcerespawn", "Game", "Resets players/map state without killing players.", "Teleport everyone + restore arena."],
    ["game_round_win", "Game", "Handles round win/loss state.", "Award coins when a player/team wins."],
    ["game_text_tf", "Game", "Displays game text to players.", "Use title/tellraw style messages."],
    ["math_remap", "Logic", "Scales one numeric range into another.", "Convert 1-10 into 100-1000 style values."],
    ["point_clientcommand", "Logic", "Runs command behavior on/for specific clients.", "Play sound or open UI for one player."],
    ["point_proximity_sensor", "Logic", "Detects player/entity distance/radius.", "Selector radius checks like r=_."],
    ["point_servercommand", "Logic", "Executes server/world-level commands.", "Run world-altering commands like difficulty changes."],
    ["point_template", "Logic", "Stores entity/block state templates for respawn.", "Recreate tagged entities or custom loot blocks."],
    ["tanktrain_ai", "Game", "AI movement logic toward a target path/entity.", "Armor stand moving toward player/target."],
    ["tanktrain_aitarget", "Game", "Defines the target used by tanktrain_ai.", "Tag an entity as the AI destination."],
    ["team_control_point_master", "Game", "Determines final winner after round thresholds.", "When Team Red hits win cap, trigger match end."],
    ["team_control_point_round", "Game", "Controls round start/win hooks and round setup.", "Open gates, clear inventories, set timers."],
    ["team_round_timer", "Game", "Match/round countdown manager.", "Blast-mode style timer logic."],
    ["team_train_watcher", "Game", "Tracks payload/train progress and updates UI.", "Convert distance moved into progress percent."],
    ["tf_gamerules", "Game", "Applies mode-specific game rule toggles.", "Disable friendly fire with gamerule settings."],
    ["tf_logic_cp_timer", "Game", "Adds extra time when checkpoints are reached.", "Add +60 seconds on capture."],
    ["tf_logic_hybrid_ctf_cp", "Game", "Hybrid mode flow that swaps rules mid-match.", "Switch from control point to CTF objective."],
    ["tf_logic_koth", "Game", "King-of-the-hill timer ownership logic.", "Decrease Team A timer only when point owned."],
    ["tf_logic_multiple_escort", "Game", "Dual escort objective logic for both teams.", "Both teams push payloads; first to end wins."],
    ["multi_manager", "Logic", "Runs multiple outputs at timed offsets.", "Bomb-fuse style delayed chain events."],
    ["npc_maker", "Game", "Spawner that keeps a desired NPC count.", "If zombies in zone < 5, summon one."],
    ["env_spark", "Environment", "Creates electric spark visual + sound effect.", "Particle + click sound for sparking machines."],
    ["env_fire", "Environment", "Creates/manages fire hazards and duration.", "Set fire blocks or on-fire effects."],
    ["env_particles", "Environment", "General visual particle emitter block.", "Smoke, steam, and custom particle effects."],
    ["ambient_generic", "Environment", "Plays sounds globally or at positions.", "Background music or localized explosion audio."],
    ["assault_point", "Game", "Objective point NPCs move toward and attack.", "Direct mobs to an invisible objective marker."],
    ["assault_rally", "Game", "Staging area before coordinated NPC assault.", "Hold mobs, then release all at once."],
    ["bullseye", "Game", "Invisible target point for aiming/hostility.", "Use armor stand as a combat focus target."],
    ["env_explosion", "Environment", "Triggers explosion force + FX.", "Instant TNT/ender crystal style blast."],
    ["scripted_sentence", "Game", "Plays one scripted voice/dialogue line.", "NPC interaction line delivery."],
    ["math_counter", "Logic", "Counter that increments/decrements with thresholds.", "Open door when counter reaches 10."],
    ["game_end", "Game", "Ends the match and transitions players out.", "Send all players to end-room scoreboard."],
    ["trigger_relay", "Logic", "Toggleable middleman that gates signals.", "Allow/block trigger flow on demand."],
    ["info_landmark", "Tools", "Reference anchor point for alignment/placement.", "Structure load alignment pivot."],
    ["info_playerspawn", "Tools", "Defines where players/world respawn.", "Set spawnpoint coordinates or block-based spawn."]
  ];

  const draftBlocks = draftBlocksRaw.map(([id, category, usage, example]) => ({
    id,
    name: id,
    category,
    menuGroup: inferMenuGroup(id, category),
    usage,
    example,
    summary: usage,
    classInfo: [...defaultClassInfo],
    notes: ["From your logic block draft list."]
  }));

  const coreBlocks = [
    {
      id: "tool_trigger",
      name: "Trigger Tool",
      category: "Tools",
      menuGroup: "tools",
      summary: "Detects entities/players and conditionally executes commands.",
      usage: "Used as a touch/logic trigger with condition checks and optional command execution.",
      example: "Only run a command when a player with a required tag enters the trigger.",
      classInfo: [
        ...defaultClassInfo,
        "Execute on condition: <dropdown> — chooses which condition to evaluate.",
        "Condition value 1: <string|number|boolean> — first parameter for selected condition.",
        "Condition value 2: <string|number|boolean> — second parameter when required.",
        "Condition value 3: <string|number|boolean> — third parameter when required.",
        "Run Command: <command> — command to run when condition succeeds."
      ],
      notes: [
        "Supports a large condition list (player/entity/block/time/weather/item durability).",
        "noCondition runs without extra values; invalid extra values can throw errors.",
        "/op and /deop are intentionally blocked in runtime logic."
      ]
    },
    {
      id: "tool_areaportal",
      name: "Area Portal Tool",
      category: "Tools",
      menuGroup: "tools",
      summary: "Teleports selected entities from the portal area to a coordinate or target portal block.",
      usage: "Choose a selector and either Destination coordinates or DestinationBlock link.",
      example: "Teleport players entering a lobby portal to the game arena spawn.",
      classInfo: [
        ...defaultClassInfo,
        "Selector: <selector> — entity filter to teleport (default: minecraft:player).",
        "Destination: <pos XYZ> — manual destination coordinates.",
        "DestinationBlock: <dropdown> — link to named info_target_areaportal block."
      ],
      notes: [
        "Use either Destination OR DestinationBlock (not both).",
        "If both are set, destination-link conflicts should be treated as invalid."
      ]
    },
    {
      id: "info_playerspawn",
      name: "Info Playerspawn",
      category: "Tools",
      menuGroup: "tools",
      summary: "Sets world and optional player spawn behavior.",
      usage: "Use this block to define world spawn at block or via explicit coordinates.",
      example: "Set world spawn to the lobby and optionally set player spawnpoint there too.",
      classInfo: [
        ...defaultClassInfo,
        "World spawn at block: <boolean> — true uses this block position as world spawn.",
        "World spawn: <pos XYZ> — custom world spawn coordinates when toggle is false.",
        "Set Player Spawn Point: <boolean> — also set each player's personal spawn."
      ]
    },
    {
      id: "info_playerspawn_block",
      name: "Info Playerspawn Block",
      category: "Tools",
      menuGroup: "tools",
      summary: "Placed block form used in-world for playerspawn registration.",
      usage: "Runtime block counterpart of info_playerspawn, used as the physical placed block entry.",
      example: "Place it in-map so scripts can detect and sync the world/player spawn source.",
      classInfo: [
        ...defaultClassInfo,
        "worldSpawnAtBlock: <boolean> — use this block position for world spawn.",
        "worldSpawn: <pos XYZ> — custom world spawn coordinates.",
        "Set Player Spawn Point: <boolean> — also updates player spawnpoint."
      ],
      notes: [
        "Added to mirror BP block IDs exactly for full in-game parity."
      ]
    },
    {
      id: "info_target_areaportal",
      name: "Info Target AreaPortal",
      category: "Tools",
      menuGroup: "tools",
      summary: "Named destination anchor for Area Portal links.",
      usage: "Register a named target that Area Portal blocks can teleport to.",
      example: "Create named destination 'Arena_A' and link several portals to it.",
      classInfo: [
        ...defaultClassInfo
      ],
      notes: [
        "Disabling this target should make linked portals effectively lose their destination link."
      ]
    },
    {
      id: "info_target_areaportal_block",
      name: "Info Target AreaPortal Block",
      category: "Tools",
      menuGroup: "tools",
      summary: "Placed block form used as a named destination marker for area portals.",
      usage: "Runtime block counterpart of info_target_areaportal used by block-id based systems.",
      example: "Portal destinations can reference this placed block ID in scripts and registry scans.",
      classInfo: [
        ...defaultClassInfo
      ],
      notes: [
        "Added to mirror BP block IDs exactly for full in-game parity."
      ]
    },
    {
      id: "tool_playerclip",
      name: "Player Clip Tool",
      category: "Tools",
      menuGroup: "tools",
      summary: "Blocks players while allowing entity-specific exceptions.",
      usage: "Define operator/gamemode/selector-based exclusion rules for who can pass.",
      example: "Let creative mode builders pass while survival players are blocked.",
      classInfo: [
        ...defaultClassInfo,
        "Exclude Operators: <boolean> — allow operators to bypass collision.",
        "Exclude Gamemode: <dropdown> — allow one gamemode to bypass.",
        "Exclude Selector: <selector> — advanced selector-based bypass rule."
      ],
      notes: [
        "Your design doc also includes additional saved exclusion functions and texture permutations.",
        "Current implemented script supports operator/gamemode/selector exclusions."
      ]
    },
    {
      id: "tool_npcclip",
      name: "NPC Clip Tool",
      category: "Tools",
      menuGroup: "tools",
      summary: "Blocks non-player entities with optional selector exceptions.",
      usage: "Define entity selectors that should be excluded from clipping behavior.",
      example: "Block all mobs in a hallway except tagged guide entities.",
      classInfo: [
        ...defaultClassInfo,
        "Exclude Selector: <selector> — entities matching this selector are excluded."
      ]
    },
    {
      id: "skybox_brush",
      name: "3D Skybox Brush",
      category: "Brushes",
      menuGroup: "brushes",
      summary: "Projects skybox illusion inside enclosed brush volume.",
      usage: "Use with a linked skybox projector to define projection behavior.",
      example: "Build a hollow cube and project distant scenery inside it.",
      classInfo: [
        ...defaultClassInfo,
        "Inside The World: <boolean> — projector mode vs generated illusion mode.",
        "Projection Block: <dropdown> — linked 3D skybox projector by name."
      ]
    },
    {
      id: "skybox_projector",
      name: "3D Skybox Projector",
      category: "Brushes",
      menuGroup: "brushes",
      summary: "Pivot/controller block for 3D skybox projection.",
      usage: "Acts as projection origin and scale controller.",
      example: "Offset and scale projected build to feel far away.",
      classInfo: [
        ...defaultClassInfo,
        "Projection Off-set: <pos XYZ> — shift projection origin.",
        "Projection Scale: <number> — scale projection (supports decimals)."
      ]
    },
    {
      id: "func_train",
      name: "func_train",
      category: "Tools",
      menuGroup: "tools",
      summary: "Path node block used to build train/payload tracks.",
      usage: "Create a named chain of numbered nodes for a func_train_entity.",
      example: "Nodes 0 → 1 → 2 with speed changes and stop delays at checkpoints.",
      classInfo: [
        ...defaultClassInfo,
        "Entity off-set: <pos XYZ> — adjusts entity pivot on this node.",
        "Is Starting Node: <boolean> — marks first node in track.",
        "Is The Last Node: <boolean> — marks terminal node in track.",
        "Node Number: <int> — unique order index in this track name.",
        "Next Path Node: <int> — next node number (blank if last).",
        "Previous Path Node: <int> — previous node number (blank if first).",
        "Entity Inhabits Speed: <boolean> — node overrides entity speed.",
        "Set Entity Speed: <number> — speed value used at this node.",
        "Delay Before Next Path: <int> — stop duration in ticks before continuing."
      ],
      notes: [
        "Track links require matching track name across nodes.",
        "Visual link lines appear between connected nodes when visible mode is active."
      ]
    },
    {
      id: "func_train_entity",
      name: "func_train_entity",
      category: "Tools",
      menuGroup: "tools",
      summary: "Dynamic multi-block entity that rides func_train tracks.",
      usage: "Assign to a named track and optionally allow player-driven movement.",
      example: "Create a moving platform players can ride with start/move/stop sounds.",
      classInfo: [
        ...defaultClassInfo,
        "Train Track: <dropdown> — selected func_train track name.",
        "Allow Player Control: <boolean> — player can drive movement on track.",
        "Entity Makes Sound While Moving: <boolean> — enables movement sound fields.",
        "Start Moving Sound: <sound:id> — played on movement start.",
        "Moving Sound: <sound:id> — looped while moving.",
        "Stop Moving Sound: <sound:id> — played when movement stops."
      ]
    },
    {
      id: "game_nametag",
      name: "game_nametag",
      category: "Game",
      menuGroup: "game",
      summary: "Creates custom nametag labels used in usernames/chat prefixes.",
      usage: "Set prefix/suffix behavior and optional tag-based condition checks.",
      example: "Show [Lobby] in chat and username unless player has game tag.",
      classInfo: [
        ...defaultClassInfo,
        "Works In Usernames: <boolean> — apply tag to username prefix/suffix.",
        "Works In Chat: <boolean> — apply tag to chat display name.",
        "Suffix: <boolean> — render tag on right side.",
        "Prefix: <boolean> — render tag on left side.",
        "Nametag: <string> — label text.",
        "Nametag order: <int> — lower appears earlier in stacked tags.",
        "Condition: <dropdown> — none / ifPlayerDoesNotHaveTagUse / ifPlayerHasTagUse.",
        "Condition Value: <string> — tag used by selected condition."
      ],
      notes: [
        "Saving this block updates tag behavior for all players.",
        "Disabling it removes the generated tag behavior."
      ]
    },
    {
      id: "fnaf_ai",
      name: "fnaf_ai",
      category: "Game",
      menuGroup: "game",
      summary: "Registers one FNAF-style character and its AI aggressiveness.",
      usage: "Define character name, AI level, path manager, and model selector.",
      example: "Register Bonnie at AI level 12 using a specific manager path.",
      classInfo: [
        ...defaultClassInfo,
        "Character Name: <string> — registered animatronic identifier.",
        "AI Level: <int 0-20> — aggression level.",
        "AI Path: <fnaf_ai_manager> — selected manager path.",
        "Character Model: <selector> — entity used as character appearance."
      ]
    },
    {
      id: "fnaf_ai_manager",
      name: "fnaf_ai_manager",
      category: "Game",
      menuGroup: "game",
      summary: "Controls movement progression of registered FNAF characters.",
      usage: "Stores camera path chain, office position, and office cooldown.",
      example: "Character moves Camera1→Camera2→Office Position then attacks after cooldown.",
      classInfo: [
        ...defaultClassInfo,
        "Save Character Data?: <boolean> — saves one character route payload.",
        "Character: <registered name> — selected character.",
        "Can Character Backtrack?: <boolean> — allows reverse movement.",
        "Starting Camera: <fnaf_camera> — spawn/return camera.",
        "Camera 1..20: <fnaf_camera> — linear progression cameras.",
        "Office Position: <office-enabled fnaf_camera> — pre-attack position.",
        "Office cooldown: <int> — delay before office attack trigger."
      ]
    },
    {
      id: "fnaf_camera",
      name: "fnaf_camera",
      category: "Game",
      menuGroup: "game",
      summary: "Defines camera positions and per-character transform/animation/sound data.",
      usage: "Used by fnaf_ai_manager routes and camera interaction systems.",
      example: "Teleport character to camera position with animation + arrival sound.",
      classInfo: [
        ...defaultClassInfo,
        "Camera facing direction: <pos XYZ> — where player view points when camera selected.",
        "Save Character Data?: <boolean> — save one character camera payload.",
        "Character: <registered name> — selected character.",
        "Camera ID: <int 0-22> — role index (start/cameras/office/gameover).",
        "Character position: <pos XYZ> — teleport position at this camera.",
        "Character facing direction: <pos XYZ> — optional facing direction.",
        "Character animation: <animation:id> — optional custom animation.",
        "Character animation replay: <int> — replay cooldown ticks.",
        "Character sound: <sound:id> — sound on arrival/leave."
      ]
    },
    {
      id: "fnaf_power_manager",
      name: "fnaf_power_manager",
      category: "Game",
      menuGroup: "game",
      summary: "Imitates FNAF power level and usage drain.",
      usage: "Tracks remaining power and drain amount per usage tick.",
      example: "Start at 100 power and drain 0.01 per tick per active usage.",
      classInfo: [
        ...defaultClassInfo,
        "Power Level: <int> — starting power amount (default 100).",
        "Power Drainage per usage: <number> — drain per tick (default 0.01)."
      ]
    },
    {
      id: "tool_invisible",
      name: "Tool Invisible",
      category: "Tools",
      menuGroup: "tools",
      summary: "Base invisible collision helper block.",
      usage: "Used as invisible pass/collision utility in map logic setups.",
      example: "Build invisible boundaries that can be toggled on/off.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "tool_blocklight",
      name: "Tool Blocklight",
      category: "Tools",
      menuGroup: "tools",
      summary: "Invisible utility block used for light-support placement.",
      usage: "Acts as hidden support block with blocklight behavior.",
      example: "Create lit invisible helper regions in custom maps.",
      classInfo: [...defaultClassInfo]
    },
    {
      id: "data",
      name: "data",
      category: "Internal",
      menuGroup: "tools",
      summary: "Internal placeholder state block used by visibility/collision logic.",
      usage: "Swapped in by scripts for hidden inactive placeholder behavior.",
      example: "Used when tool blocks are globally hidden or disabled.",
      classInfo: ["Internal runtime block, not typically user-configured."]
    },
    {
      id: "data_collision",
      name: "data_collision",
      category: "Internal",
      menuGroup: "tools",
      summary: "Internal collision-enabled placeholder block.",
      usage: "Applied by scripts when hidden blocks should still collide.",
      example: "Used for invisible collision/clip behavior at runtime.",
      classInfo: ["Internal runtime block, not typically user-configured."]
    },
    {
      id: "data_blocklight",
      name: "data_blocklight",
      category: "Internal",
      menuGroup: "tools",
      summary: "Internal placeholder for hidden light-support logic.",
      usage: "Used by scripts for hidden lighting helper states.",
      example: "Runtime replacement for light-support tool blocks.",
      classInfo: ["Internal runtime block, not typically user-configured."]
    },
    {
      id: "gluon_gun",
      name: "Gluon Gun",
      category: "Tools",
      menuGroup: "tools",
      summary: "Beam weapon item that fires pulsed/continuous energy with particle visuals and hit detection.",
      usage: "Equip and use to fire a short pulse or sustained beam depending on hold duration.",
      example: "Use quick taps for pulse damage or hold to keep pressure on moving targets.",
      classInfo: [
        "Identifier: brr:gluon_gun — BP item used by runtime handler.",
        "Item Category: equipment / itemGroup.name.tools.",
        "Use Animation: bow — use_duration 72000 and movement_modifier 1.",
        "Max Stack Size: 1 — single weapon instance per slot.",
        "Allow Off Hand: false — mainhand-focused behavior.",
        "Beam Runtime: max distance ~36 blocks, hit radius ~0.8, fallback particles supported."
      ],
      notes: [
        "Handled by scripts/handler/gluon_gun.js and scripts/handler/gluon_beam_visual.js.",
        "Uses custom particles brr:gluon_beam_core and brr:gluon_beam_arc with spark fallback."
      ]
    },
    {
      id: "dino_speecher",
      name: "Dino Speecher",
      category: "Tools",
      menuGroup: "tools",
      summary: "Utility equipment item registered by the BP item pack.",
      usage: "Spawn/use as a configured equipment item in maps or test worlds.",
      example: "Give to creators/admins as a specialized utility tool item.",
      classInfo: [
        "Identifier: brr:dino_speecher.",
        "Item Category: equipment / brr:itemGroup.name.tools.",
        "Icon: brr_dino_speecher from RP item textures."
      ],
      notes: [
        "Present in BP/items for parity with the source project.",
        "No additional runtime script logic was found in the attached BP scripts."
      ]
    },
    {
      id: "conditions_tools",
      name: "conditions_tools",
      category: "Logic",
      menuGroup: "logic",
      summary: "Condition catalog used by trigger UIs to present valid condition IDs.",
      usage: "Feeds execute-condition dropdowns for player, entity, score, block, time, weather, and durability checks.",
      example: "Select ifPlayerHasTag / ifScoreIs / ifBlockAreaHas and provide matching values.",
      classInfo: [
        "Source file: scripts/tool_ui/conditions_tools.js.",
        "Contains noCondition plus player/entity/score/block/time/weather/item durability checks.",
        "Designed to match evaluator support in condition_executer runtime."
      ],
      notes: [
        "Keeping this list synchronized prevents invalid condition IDs in saved block data."
      ]
    },
    {
      id: "condition_executer",
      name: "condition_executer",
      category: "Logic",
      menuGroup: "logic",
      summary: "Runtime evaluator that validates and executes trigger conditions with scoreboard/entity/world context.",
      usage: "Reads executeCondition and up to three condition values from block data, then returns pass/fail.",
      example: "Validate ifPlayerHasInInventory with item ID + count before firing trigger outputs.",
      classInfo: [
        "Source file: scripts/handler/condition_executer.js.",
        "Entry points: evaluateCondition(blockData, player, world) and validateConditionRequirements(...).",
        "Supports selectors, positional ranges, health checks, scoreboard participant lookups, platform groups, and weather/time checks.",
        "Tracks recent damage windows for ifPlayerDamaged / ifEntityDamaged style conditions."
      ]
    },
    {
      id: "chat_system",
      name: "chat_system",
      category: "Game",
      menuGroup: "game",
      summary: "Custom chat and nametag formatting runtime with emoji substitution and rank/tag formatting.",
      usage: "Formats outgoing messages and username/chat prefixes based on tags, ranks, and dynamic properties.",
      example: "Apply [Dev] / [VIP] style rank tags and replace :emoji: tokens in real-time chat.",
      classInfo: [
        "Source file: scripts/handler/chat_system.js.",
        "Exposes sendRankedMessage, chatRank, and nametag rank helpers.",
        "Reads brr_nametag dynamic property for prefix/suffix behavior in chat/usernames."
      ],
      notes: [
        "Includes a large custom emoji table and rank-tag utilities for social/gameplay contexts."
      ]
    },
    {
      id: "block_particles",
      name: "block_particles",
      category: "Environment",
      menuGroup: "brushes",
      summary: "Particle helper runtime for visualizing tool-related blocks and map feedback.",
      usage: "Spawns contextual particles around registered tool blocks to improve mapmaker visibility.",
      example: "Display particles on playerspawn/target helpers while configuring maps.",
      classInfo: [
        "Source file: scripts/handler/block_particles.js.",
        "Tied into main runtime loop and tool visibility states.",
        "Uses RP particle definitions under RP/particles/tools/."
      ]
    },
    {
      id: "gluon_beam_visual",
      name: "gluon_beam_visual",
      category: "Environment",
      menuGroup: "brushes",
      summary: "Beam particle renderer used by the gluon gun runtime.",
      usage: "Builds beam basis vectors and strand wobble offsets, then spawns core/arc particles with fallback handling.",
      example: "Render a multi-strand energy beam between origin and impact with capped particle budget.",
      classInfo: [
        "Source file: scripts/handler/gluon_beam_visual.js.",
        "Exports renderGluonBeamVisual(config).",
        "Config includes step, strands, ampNear/ampFar, and maxParticles for performance control."
      ]
    },
    {
      id: "dev_measuregeneric01",
      name: "dev_measuregeneric01",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer measure/debug block variant.",
      usage: "Used for scale/layout measuring while building maps.",
      example: "Temporary mapping marker while prototyping spaces.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measuregeneric02",
      name: "dev_measuregeneric02",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer measure/debug block variant.",
      usage: "Used for scale/layout measuring while building maps.",
      example: "Temporary mapping marker while prototyping spaces.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measuregeneric03",
      name: "dev_measuregeneric03",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer measure/debug block variant.",
      usage: "Used for scale/layout measuring while building maps.",
      example: "Temporary mapping marker while prototyping spaces.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measuregeneric04",
      name: "dev_measuregeneric04",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer measure/debug block variant.",
      usage: "Used for scale/layout measuring while building maps.",
      example: "Temporary mapping marker while prototyping spaces.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measurewall01a",
      name: "dev_measurewall01a",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer wall-measure/debug texture block.",
      usage: "Used as map greybox measurement aid.",
      example: "Check wall dimensions while blocking out rooms.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measurewall01b",
      name: "dev_measurewall01b",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer wall-measure/debug texture block.",
      usage: "Used as map greybox measurement aid.",
      example: "Check wall dimensions while blocking out rooms.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measurewall01c",
      name: "dev_measurewall01c",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer wall-measure/debug texture block.",
      usage: "Used as map greybox measurement aid.",
      example: "Check wall dimensions while blocking out rooms.",
      classInfo: ["Developer utility block."]
    },
    {
      id: "dev_measurewall01d",
      name: "dev_measurewall01d",
      category: "Internal",
      menuGroup: "tools",
      summary: "Developer wall-measure/debug texture block.",
      usage: "Used as map greybox measurement aid.",
      example: "Check wall dimensions while blocking out rooms.",
      classInfo: ["Developer utility block."]
    }
  ];

  const deduped = [...coreBlocks, ...draftBlocks].reduce((acc, entry) => {
    if (!acc.some(e => e.id === entry.id)) acc.push(entry);
    return acc;
  }, []);

  return {
    entries: deduped,
    defaultClassInfo,
    outputTemplate,
    existingOutputTemplate,
    inputTemplate,
    iconMap
  };
})();
