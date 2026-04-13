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
    logic_case: "assets/logic_case.png",
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
      summary: "Teleports entities inside the block using selectors and either coordinate or named-target destinations.",
      usage: "Set Selector, then provide either Destination (x y z) or Destination Block (named info_target_areaportal block).",
      example: "Use @a to move nearby players from a lobby portal to a named arena entry marker.",
      classInfo: [
        "Name: <string> - unique name used by links, outputs, and references.",
        "Start Disabled: <boolean> - when true, portal behavior is inactive.",
        "Selector: <selector|string> - target entities (supports @a, @e, @p, @r, minecraft:player, or entity type IDs).",
        "Destination: <x y z> - direct teleport coordinates used when Destination Block is blank.",
        "Destination Block: <named block> - routes to a matching info_target_areaportal block by name."
      ],
      outputTemplate: [
        "Output Name: <string> - identifier for this output entry.",
        "Output Type: <dropdown> - event type defined by the addon output table.",
        "Output Target: <named block> - destination block to receive this output update.",
        "Target Class Info: <dropdown> - target class-info field that will be modified.",
        "Target Info Value: <string|boolean|number> - value assigned to the chosen target field.",
        "Delay (in ticks): <int> - wait time before applying the output."
      ],
      notes: [
        "At least one destination method is required (Destination or Destination Block).",
        "When Destination Block is selected, Destination coordinates are intentionally cleared.",
        "Named destination lookup targets blocks with type brr:info_target_areaportal_block.",
        "Destination block teleport offset uses center on X/Z (+0.5) and exact block Y.",
        "Selector @s resolves to no entities in this tool context."
      ]
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
      summary: "Named destination marker used by Area Portal destination-block routing.",
      usage: "Give this block a unique Name, then set an Area Portal Destination Block to the same value.",
      example: "Name this block Arena_Entry so multiple portals can route to one consistent spawn marker.",
      supportsOutputs: false,
      classInfo: [
        "Name: <string> - unique marker name used by Area Portal destination lookup.",
        "Start Disabled: <boolean> - when true, linked Area Portals cannot route to this marker.",
        "Facing Direction: <x y z> - optional facing direction used after teleport (leave blank to ignore)."
      ],
      notes: [
        "This block acts as a destination marker and is looked up by exact name match.",
        "Area Portal teleports to marker center on X/Z and marker Y for consistent landing."
      ]
    },
    {
      id: "logic_auto",
      name: "Logic Auto",
      category: "Logic",
      menuGroup: "logic",
      summary: "Runs configured automation actions on world load and can optionally repeat on a tick delay.",
      usage: "Add an automation entry, then choose optional output/command behavior and load/periodic toggles.",
      example: "Run a startup command on world load, or loop an output every 20 ticks.",
      classInfo: [
        ...defaultClassInfo,
        "Add this automation?: <boolean> - saves a new automation entry (maximum 16 per block).",
        "Run output: <dropdown> - optional output from this block's existing outputs.",
        "Run command: <string> - optional command executed by this automation.",
        "On world load: <boolean> - run this automation when the world starts.",
        "Run once?: <boolean> - automation fires one time only.",
        "Run periodically?: <boolean> - automation repeats using Tick delay.",
        "Tick delay: <int> - tick interval used when Run periodically is enabled."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "Run once and Run periodically are mutually exclusive in the block UI."
      ]
    },
    {
      id: "logic_branch",
      name: "Logic Branch",
      category: "Logic",
      menuGroup: "logic",
      summary: "Evaluates a condition and can run separate output/command actions for true and false cases.",
      usage: "Pick an Output test condition, fill needed condition values, then configure true/false actions.",
      example: "If a condition is true, run a command and output; otherwise run an alternate action.",
      classInfo: [
        ...defaultClassInfo,
        "Output test: <dropdown> - condition key from the trigger condition list.",
        "Condition Value 1: <string|boolean|number> - first condition parameter.",
        "Condition Value 2: <string|boolean|number> - second condition parameter (optional).",
        "Condition Value 3: <string|boolean|number> - third condition parameter (optional).",
        "Run once?: <boolean> - executes true/false action one time after change.",
        "Run interval (ticks): <int> - repeat interval for true/false actions (0 = only on change).",
        "If true run output: <dropdown> - optional output to fire when condition is true.",
        "If false run output: <dropdown> - optional output to fire when condition is false.",
        "If true run command: <string> - optional command when condition is true.",
        "If false run command: <string> - optional command when condition is false."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "True/false commands and outputs fire once when the condition state changes unless interval/repeat is configured."
      ]
    },
    {
      id: "logic_case",
      name: "Logic Case",
      category: "Logic",
      menuGroup: "logic",
      summary: "Stores multiple condition cases and runs per-case output/command behavior when a case matches.",
      usage: "Use Add case to save condition entries, each with optional output and command actions.",
      example: "Create different case checks for different score or state conditions.",
      classInfo: [
        ...defaultClassInfo,
        "Add case?: <boolean> - saves a new case entry (maximum 16 per block).",
        "Case condition: <dropdown> - condition key from the trigger condition list.",
        "Case condition value 1: <string|boolean|number> - first case parameter.",
        "Case condition value 2: <string|boolean|number> - second case parameter (optional).",
        "Case condition value 3: <string|boolean|number> - third case parameter (optional).",
        "If case matches run output: <dropdown> - optional output fired by this case.",
        "If case matches run command: <string> - optional command fired by this case."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "Cases can be stacked and are managed in Existing Cases in the in-game UI."
      ]
    },
    {
      id: "logic_compare",
      name: "Logic Compare",
      category: "Logic",
      menuGroup: "logic",
      summary: "Compares scoreboard values using selected comparison modes and runs optional output/command actions.",
      usage: "Add comparison entries with objective/entity/value settings and choose the comparison type.",
      example: "Fire behavior when a tracked score becomes less than, equal to, not equal to, or greater than a set value.",
      classInfo: [
        ...defaultClassInfo,
        "Add comparison?: <boolean> - saves a new comparison entry.",
        "Scoreboard objective: <string> - required scoreboard objective name.",
        "Scoreboard entity: <selector|string> - selector or fake player name to compare.",
        "Scoreboard initial value: <int> - baseline value to compare against.",
        "Comparing for: <OnLessThan|OnEqualTo|OnNotEqualTo|OnGreaterThan> - comparison mode.",
        "Run output: <dropdown> - optional output to fire when comparison matches.",
        "Run command: <string> - optional command to run when comparison matches."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "Comparisons are managed as saved entries in Existing Comparisons."
      ]
    },
    {
      id: "logic_coop_manager",
      name: "Logic Coop Manager",
      category: "Logic",
      menuGroup: "logic",
      summary: "Tracks two player states and exposes cooperative state-change output events.",
      usage: "Set selectors and current states for Player A/B, then wire outputs for state transitions.",
      example: "Trigger events when both tracked players become true or when all become false.",
      classInfo: [
        ...defaultClassInfo,
        "Player A selector: <selector> - selector used for state A.",
        "Player A state: <boolean> - current state value for A.",
        "Player B selector: <selector> - selector used for state B.",
        "Player B state: <boolean> - current state value for B."
      ],
      outputTemplate: [
        "Output Name: <string> - identifier for this output entry.",
        "Output Type: <OnChangeToAllTrue|OnChangeToAnyTrue|OnChangeToAllFalse|OnChangeToAnyFalse> - coop-manager event.",
        "Output Target: <named block> - destination block to receive this output update.",
        "Target Class Info: <dropdown> - target class-info field that will be modified.",
        "Target Info Value: <string|boolean|number> - value assigned to the chosen target field.",
        "Delay (in ticks): <int> - wait time before applying the output."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "This block also accepts special input operations in-engine: SetStateATrue/False, ToggleStateA, SetStateBTrue/False, ToggleStateB."
      ]
    },
    {
      id: "logic_random_outputs",
      name: "Logic Random Outputs",
      category: "Logic",
      menuGroup: "logic",
      summary: "Chooses random slots and runs slot-specific output/command actions based on chance settings.",
      usage: "Configure range/interval toggles, then set per-slot output and command behavior for random values.",
      example: "Pick a random result from 1-10 and execute the matching slot action.",
      classInfo: [
        ...defaultClassInfo,
        "Random Chance Range: <int> - random range from 1 to 10.",
        "Randomness Interval in ticks: <int> - interval between random pulls.",
        "Run once?: <boolean> - run a single random pull.",
        "Run on input?: <boolean> - only run when triggered by input.",
        "Rerun selection?: <boolean> - repick when the same result repeats."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "Random slots provide On Random 1..10 per-slot output/command mappings in the block UI.",
        "Special input supported in-engine: randomChanceTrigger."
      ]
    },
    {
      id: "logic_timer",
      name: "Logic Timer",
      category: "Logic",
      menuGroup: "logic",
      summary: "Runs timer-based output/command actions after a configured tick duration.",
      usage: "Set Timer in ticks, then choose optional Run output and Run command behavior.",
      example: "Fire a timed output every completed timer cycle to drive repeated events.",
      classInfo: [
        "Name: <string> - unique name used by links, outputs, and references.",
        "Start Disabled: <boolean> - true by default so timer blocks do not run immediately.",
        "Timer (ticks): <int> - amount of time before timer fires.",
        "Run output: <dropdown> - optional output from this block's existing outputs.",
        "Run command: <string> - optional command executed when timer fires."
      ],
      notes: [
        "Logic blocks evaluate globally each tick and can be paused with Start Disabled.",
        "Timer must be at least 1 tick in engine validation."
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
      name: "Invisible",
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
      showInfoTab: false,
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

  const entryEnhancements = {
    tool_trigger: {
      usage: "Configure Execute on condition plus needed values, then connect onTrue/onFalse outputs to named blocks for branching behavior.",
      example: "Example workflow: A trigger around a vault door runs ifPlayerHasTag with value trusted, fires onTrue to unlock, and onFalse to keep the door disabled."
    },
    tool_areaportal: {
      usage: "Choose who can be teleported with Selector, then use exactly one destination mode: direct coordinates or a named info_target_areaportal marker.",
      example: "Example workflow: Selector @a[tag=match_ready] and Destination Block Arena_Entry sends only ready players into the arena."
    },
    info_playerspawn: {
      usage: "Defines the map spawn policy. Use block position or explicit coordinates for world spawn, then optionally assign player spawn points to a selector.",
      example: "Example workflow: worldSpawnAtBlock true keeps global spawn at your lobby marker, while Set Player Spawn Point true with selector @a[tag=game] updates only active players.",
      classInfo: [
        ...defaultClassInfo,
        "World Spawn At Block: <boolean> - true uses this block location as world spawn.",
        "World Spawn: <x y z> - coordinate string used when World Spawn At Block is false.",
        "Set Player Spawn Point: <boolean> - when true, updates selected players' spawn points.",
        "Selectors: <selector|string> - applies Set Player Spawn Point only to matching players (default @a)."
      ]
    },
    info_target_areaportal: {
      usage: "Create named teleport anchors for Area Portal blocks. Portals route to this marker by exact Name match.",
      example: "Example workflow: Name this block Arena_Exit, then set any Area Portal Destination Block to Arena_Exit for consistent return teleports."
    },
    logic_auto: {
      usage: "Save automation entries for startup and optional periodic execution. Each entry can run an output, command, or both.",
      example: "Example workflow: On world load runs /scoreboard players set round state 0, then a periodic entry every 20 ticks updates UI state."
    },
    logic_branch: {
      usage: "Continuously evaluates one condition and supports separate true/false outputs and commands with optional interval behavior.",
      example: "Example workflow: ifPlayerHasScore coins true path opens shop outputs; false path shows a tellraw warning command."
    },
    logic_case: {
      usage: "Stores up to 16 saved case checks so different condition/value combinations can trigger different actions.",
      example: "Example workflow: Case 1 checks ifScoreIs team red, Case 2 checks team blue, and each case runs different map logic."
    },
    logic_compare: {
      usage: "Compares a scoreboard target against a baseline value and runs logic when the selected comparison mode matches.",
      example: "Example workflow: Compare objective capture_time for @a[tag=runner] and fire a reward output when OnLessThan 1200 succeeds."
    },
    logic_coop_manager: {
      usage: "Tracks two cooperative states and emits transition outputs when any/all states flip true or false.",
      example: "Example workflow: SetStateATrue from one objective and SetStateBTrue from another, then OnChangeToAllTrue unlocks the final room."
    },
    logic_random_outputs: {
      usage: "Runs random slot actions across a configurable range with optional interval, input-triggered mode, and reroll behavior.",
      example: "Example workflow: Range 1-6 simulates a dice roll where each random slot triggers unique loot or command logic."
    },
    logic_timer: {
      usage: "Fires after a tick duration and can run a linked output and/or command each completed cycle.",
      example: "Example workflow: Timer 200 runs an output that pulses checkpoint lights every 10 seconds."
    },
    tool_playerclip: {
      usage: "Blocks player movement while allowing exception rules through operator, gamemode, and selector filters.",
      example: "Example workflow: Exclude Gamemode creative and Exclude Selector @a[tag=builder] so staff can pass through construction barriers."
    },
    tool_npcclip: {
      usage: "Prevents non-player entities from entering a volume unless they match the optional exclude selector.",
      example: "Example workflow: Use Exclude Selector @e[type=minecraft:villager] so villagers pass while hostile mobs are blocked."
    },
    tool_invisible: {
      usage: "Acts as an invisible utility barrier/collision helper controlled by Start Disabled.",
      example: "Example workflow: Place invisible collision edges along cinematic rails to keep players inside the route."
    },
    tool_blocklight: {
      usage: "Use as a non-configurable utility block to suppress light bleed in enclosed map geometry.",
      example: "Example workflow: Insert Blocklight behind decorative wall gaps to stop skylight leaks in indoor sections."
    },
    game_nametag: {
      usage: "Applies ordered prefix/suffix tags to selected players for usernames and chat formatting.",
      example: "Example workflow: Prefix [Host] with order 0 for @a[tag=host], then Prefix [Lobby] with order 1 for @a[tag=lobby]."
    }
  };

  const enhancedEntries = entries.map((entry) => {
    const patch = entryEnhancements[entry.id];
    return patch ? { ...entry, ...patch } : entry;
  });

  const conditionEnabledBlockIds = ["tool_trigger", "logic_branch", "logic_case"];
  const conditionReference = [
    { key: "noCondition", params: "No values.", description: "Always passes when the block checks it.", example: "Use when touching a trigger alone should fire logic." },
    { key: "ifPlayerNameIs", params: "Value 1: player name.", description: "Passes when the triggering player's name matches exactly.", example: "Run host-only logic with Value 1 set to Bonnie." },
    { key: "ifPlayerNameIsNot", params: "Value 1: player name.", description: "Passes when the triggering player's name does not match.", example: "Block everyone except a tester account." },
    { key: "ifPlayerIsSneaking", params: "No values.", description: "Passes only while the triggering player is sneaking.", example: "Secret interaction requires crouching in a trigger zone." },
    { key: "ifPlayerIsSwimming", params: "No values.", description: "Passes when the triggering player is swimming/crawling.", example: "Start underwater ambience only while swimming." },
    { key: "ifPlayerIsRiding", params: "Optional Value 1: entity selector/type.", description: "Passes when the triggering player is riding an entity.", example: "Open a gate only when players arrive mounted." },
    { key: "ifPlayerIsWearing", params: "Value 1: item id, Value 2: slot alias (optional).", description: "Passes when the player has a specific equipped item.", example: "Require a helmet before entering a hazard room." },
    { key: "ifPlayerHasTag", params: "Value 1: tag name.", description: "Passes if the player has the given tag.", example: "Allow only players tagged game into arena systems." },
    { key: "ifPlayerDoesNotHaveTag", params: "Value 1: tag name.", description: "Passes if the player does not have the given tag.", example: "Send spectators to observer routing." },
    { key: "ifPlayerScoreIsHigher", params: "Value 1: objective, Value 2: number.", description: "Passes when player score is greater than the target value.", example: "Unlock bonus route above score 50." },
    { key: "ifPlayerScoreIsLower", params: "Value 1: objective, Value 2: number.", description: "Passes when player score is lower than the target value.", example: "Show tutorial prompts under score 5." },
    { key: "ifPlayerScoreIs", params: "Value 1: objective, Value 2: number.", description: "Passes when player score equals the target value.", example: "Trigger stage transition exactly at checkpoint 3." },
    { key: "ifPlayerHasNoScore", params: "Value 1: objective.", description: "Passes when no scoreboard value exists for the player.", example: "Initialize profiles for first-time players." },
    { key: "ifPlayerHasScore", params: "Value 1: objective.", description: "Passes when the player already has a value in that objective.", example: "Skip onboarding for returning users." },
    { key: "ifPlayerHasInInventory", params: "Value 1: item id, Value 2: count (optional).", description: "Passes when player inventory contains enough of an item.", example: "Open vault if player carries keycard item." },
    { key: "ifPlayerDoesNotHaveInInventory", params: "Value 1: item id, Value 2: count (optional).", description: "Passes when player inventory is below the required amount.", example: "Show hint when player lacks required ammo." },
    { key: "ifPlayerHealthIsHigher", params: "Value 1: number.", description: "Passes when current player health is above the value.", example: "Allow risky shortcut only above 10 health." },
    { key: "ifPlayerHealthIsLower", params: "Value 1: number.", description: "Passes when current player health is below the value.", example: "Auto-open medical area below 6 health." },
    { key: "ifPlayerHealthIsFull", params: "No values.", description: "Passes when player health is at maximum.", example: "Gate perfection bonus behind full health." },
    { key: "ifPlayerIsOnConsole", params: "No values.", description: "Passes when player platform resolves to a console family.", example: "Use alternate UI flow for console users." },
    { key: "ifPlayerIsOnMobile", params: "No values.", description: "Passes when player platform resolves to mobile.", example: "Apply mobile-friendly objective hints." },
    { key: "ifPlayerisOnDesktop", params: "No values.", description: "Passes when player platform resolves to desktop.", example: "Enable keyboard-focused onboarding prompts." },
    { key: "ifPlayerIsDead", params: "No values.", description: "Passes when player is dead.", example: "Fire death handling relay logic." },
    { key: "ifPlayerIsAlive", params: "No values.", description: "Passes when player is alive.", example: "Only run puzzle interactions while alive." },
    { key: "ifPlayerIsAt", params: "Value 1: XYZ min, Value 2: XYZ max.", description: "Passes when player location is inside the defined area.", example: "Detect players inside a control room volume." },
    { key: "ifPlayerIsNotAt", params: "Value 1: XYZ min, Value 2: XYZ max.", description: "Passes when player is outside the defined area.", example: "Reset puzzle if player leaves zone." },
    { key: "ifPlayerDamaged", params: "No values.", description: "Passes shortly after recent damage is detected on the player.", example: "Trigger panic lighting after damage." },
    { key: "ifPlayerDamagedFromSource", params: "Value 1: damage cause key.", description: "Passes if recent damage cause matches the provided source.", example: "Run fire-specific response logic for lava/fire damage." },
    { key: "ifScoreIsHigher", params: "Value 1: objective, Value 2: participant, Value 3: number.", description: "Compares a named scoreboard participant against a value.", example: "Run overtime logic if TeamA score is above 3." },
    { key: "ifScoreIsLower", params: "Value 1: objective, Value 2: participant, Value 3: number.", description: "Passes when named participant score is below the value.", example: "Keep comeback bonus active below threshold." },
    { key: "ifScoreIs", params: "Value 1: objective, Value 2: participant, Value 3: number.", description: "Passes when named participant score equals the value.", example: "Trigger sudden death exactly at score 10." },
    { key: "ifScoreIsNot", params: "Value 1: objective, Value 2: participant, Value 3: number.", description: "Passes when named participant score differs from the value.", example: "Maintain waiting-room state until score reaches target." },
    { key: "ifEntityHasTag", params: "Value 1: selector, Value 2: tag.", description: "Passes when any resolved entity has the specified tag.", example: "Detect tagged boss entities near arena." },
    { key: "ifEntityDoesNotHaveTag", params: "Value 1: selector, Value 2: tag.", description: "Passes when all resolved entities lack the specified tag.", example: "Progress phase only when no enemy is tagged alive." },
    { key: "ifEntityHasName", params: "Value 1: selector, Value 2: name.", description: "Passes when any resolved entity matches the expected name.", example: "Check if named NPC is currently present." },
    { key: "ifEntityDoesNotHaveName", params: "Value 1: selector, Value 2: name.", description: "Passes when resolved entities do not use that name.", example: "Fallback logic when escort NPC renamed/missing." },
    { key: "ifEntityNameIsNot", params: "Value 1: selector, Value 2: name.", description: "Name-negative entity check variant used by condition dropdown.", example: "Filter out one specific named entity from a group." },
    { key: "ifEntityScoreIsHigher", params: "Value 1: selector, Value 2: objective, Value 3: number.", description: "Passes when any resolved entity score is above the value.", example: "Trigger elite phase when boss rage score rises." },
    { key: "ifEntityScoreIsLower", params: "Value 1: selector, Value 2: objective, Value 3: number.", description: "Passes when any resolved entity score is below the value.", example: "Enable recovery behavior below threshold." },
    { key: "ifEntityScoreIs", params: "Value 1: selector, Value 2: objective, Value 3: number.", description: "Passes when any resolved entity score equals the value.", example: "Fire stage cue exactly at score checkpoint." },
    { key: "ifEntityHasNoScore", params: "Value 1: selector, Value 2: objective.", description: "Passes when resolved entity has no score in objective.", example: "Initialize objective for fresh spawned entities." },
    { key: "ifEntityHasScore", params: "Value 1: selector, Value 2: objective.", description: "Passes when resolved entity has a score in objective.", example: "Skip init for previously tracked mobs." },
    { key: "ifEntityHealthIsHigher", params: "Value 1: selector, Value 2: number.", description: "Passes when entity health is above value.", example: "Switch music while boss is still healthy." },
    { key: "ifEntityHealthIsLower", params: "Value 1: selector, Value 2: number.", description: "Passes when entity health is below value.", example: "Trigger enraged phase below 25 percent health." },
    { key: "ifEntityHealthIsFull", params: "Value 1: selector.", description: "Passes when selected entity health is full.", example: "Run reset routine once fully healed." },
    { key: "ifEntityIsDead", params: "Value 1: selector.", description: "Passes when selected entity is dead.", example: "Advance objective once target is eliminated." },
    { key: "ifEntityIsAlive", params: "Value 1: selector.", description: "Passes when selected entity is alive.", example: "Keep encounter logic active while boss lives." },
    { key: "ifEntityHasInInventory", params: "Value 1: selector, Value 2: item id, Value 3: count optional.", description: "Checks inventory content for resolved entities.", example: "Validate trader has required token item." },
    { key: "ifEntityDoesNotHaveInInventory", params: "Value 1: selector, Value 2: item id, Value 3: count optional.", description: "Passes when resolved entities do not meet item count.", example: "Refill station when worker entity lacks fuel item." },
    { key: "ifEntityExists", params: "Value 1: selector, Value 2: optional radius.", description: "Passes if at least one matching entity exists.", example: "Only run escort stage while payload entity exists." },
    { key: "ifEntityDoesNotExist", params: "Value 1: selector, Value 2: optional radius.", description: "Passes when no matching entity exists.", example: "Respawn logic when no guard entities remain." },
    { key: "ifEntityIsAt", params: "Value 1: selector, Value 2: XYZ min, Value 3: XYZ max.", description: "Passes when matching entities are inside area bounds.", example: "Detect payload entering checkpoint zone." },
    { key: "ifEntityIsNotAt", params: "Value 1: selector, Value 2: XYZ min, Value 3: XYZ max.", description: "Passes when matching entities are outside area bounds.", example: "Close checkpoint when payload leaves zone." },
    { key: "ifEntityDamaged", params: "Value 1: selector.", description: "Passes after recent damage event is tracked for matching entity.", example: "Counter-attack when guardian is hit." },
    { key: "ifEntityDamagedFromSource", params: "Value 1: selector, Value 2: damage cause.", description: "Damage-source filtered entity damage check.", example: "Respond only to projectile damage on target." },
    { key: "ifBlockIs", params: "Value 1: XYZ, Value 2: block id.", description: "Passes when block at position matches block id.", example: "Open route only if control block is redstone_block." },
    { key: "ifBlockIsNot", params: "Value 1: XYZ, Value 2: block id.", description: "Passes when block at position is not that block id.", example: "Fallback if checkpoint marker was removed." },
    { key: "ifBlockHas", params: "Value 1: XYZ, Value 2: container block id, Value 3: item id.", description: "Passes when target container includes the requested item.", example: "Progress puzzle when chest contains key item." },
    { key: "ifBlockDoesNotHave", params: "Value 1: XYZ, Value 2: container block id, Value 3: item id.", description: "Passes when target container lacks the item.", example: "Trigger refill logic when chest is empty." },
    { key: "ifBlocksAre", params: "Value 1: XYZ min, Value 2: XYZ max, Value 3: block id.", description: "Passes when every block in the area matches block id.", example: "Validate full build pattern completion." },
    { key: "ifBlockAreaHas", params: "Value 1: XYZ min, Value 2: XYZ max, Value 3: block id.", description: "Passes when area contains at least one matching block.", example: "Start alarm if area has any fire block." },
    { key: "ifBlocksAreNot", params: "Value 1: XYZ min, Value 2: XYZ max, Value 3: block id.", description: "Passes when area is not entirely the given block type.", example: "Detect partially broken barrier wall." },
    { key: "ifBlockAreaDoesNotHave", params: "Value 1: XYZ min, Value 2: XYZ max, Value 3: block id.", description: "Passes when area contains none of the given block.", example: "Continue event only when all hazards are cleared." },
    { key: "ifTimeIs", params: "Value 1: start time, Value 2: end time.", description: "Passes when world time falls within range.", example: "Night event active between 13000 and 23000." },
    { key: "ifTimeIsNot", params: "Value 1: start time, Value 2: end time.", description: "Passes when world time is outside range.", example: "Disable vampire encounter during daytime." },
    { key: "ifWeatherIs", params: "Value 1: clear, rain, or thunder.", description: "Passes when current weather equals the selected value.", example: "Enable storm siren only during thunder." },
    { key: "ifWeatherIsNot", params: "Value 1: clear, rain, or thunder.", description: "Passes when current weather differs from selected value.", example: "Run dry-weather NPC routine when not raining." },
    { key: "ifItemDurabilityIs", params: "Value 1: selector, Value 2: item id, Value 3: durability number.", description: "Passes when an item durability equals the exact value.", example: "Warn player when tool reaches exact break threshold." },
    { key: "ifItemDurabilityFull", params: "Value 1: selector, Value 2: item id.", description: "Passes when target item durability is full.", example: "Apply bonus only for fully repaired gear." },
    { key: "ifItemDurabilityIsHigher", params: "Value 1: selector, Value 2: item id, Value 3: durability number.", description: "Passes when item durability is higher than value.", example: "Allow advanced action while item is still healthy." },
    { key: "ifItemDurabilityIsLower", params: "Value 1: selector, Value 2: item id, Value 3: durability number.", description: "Passes when item durability is lower than value.", example: "Trigger repair station prompt below durability threshold." }
  ].map((condition) => ({ ...condition, blocks: [...conditionEnabledBlockIds] }));

  return {
    entries: enhancedEntries,
    defaultClassInfo,
    outputTemplate,
    existingOutputTemplate,
    inputTemplate,
    iconMap,
    conditionReference,
    conditionEnabledBlockIds
  };
})();