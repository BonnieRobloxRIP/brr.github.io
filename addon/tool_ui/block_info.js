import { getClassInputs, getClassOutputs } from "../engine/classes.js";

// SECTION: Block Info Pages
// Shown by the Help tabs of every engine block form: Examples, Usage and Info (plus Conditions on
// blocks that use the condition list). Use \n for line breaks and § colour codes.
// The Info page ends with the block's outputs and inputs, read from engine/classes.js so the help
// always matches what the engine actually does.

const H = text => `§e${text}§r`;
const lines = (...rows) => rows.join("\n");
const steps = (...rows) => rows.join("\n\n");

// SECTION: Shared Text
const OUTPUT_STEPS = [
    `${H("Outputs:")} open the Output tab. Pick My output (when to fire), Target entity and Target input (what to do).`,
    "Target entity can be a named entity or a special target: !self (this entity), !activator (the player or mob that caused it), !caller (the entity that sent the input) or !player (the nearest player).",
    "Parameter is handed to the input. Delay is in seconds. Times to fire: -1 = every time, 1 = only once.",
    "Enable Add this output and Submit. Saved lists and deletes outputs; Input shows who targets this entity. Saving resets fire counts."
];

const COMMON_INPUTS_TEXT = lines(
    `${H("Inputs every entity accepts:")}`,
    "Enable / Disable / Toggle - switch it on or off.",
    "FireUser1-4 - fires its own OnUser1-4 output (for chaining).",
    "AddOutput - parameter 'key value' changes one setting, e.g. 'runCommand say hi'.",
    "RunCommand - parameter is a command, run in this entity's dimension."
);

const NAME_TIP = "Give it a Name if other entities should target it. Names are not case-sensitive, several entities may share one, and a target ending in * matches every name starting with that text.";

const FILTER_USE = "To use it, pick this filter in the Filter field of a trigger or area portal: only players and mobs that pass it can set the trigger off or use the portal. Any entity can also send it TestActivator.";

const FILTER_TEST = "TestActivator checks the !activator of the incoming event and fires OnPass or OnFail with it.";

const BRUSH_TIP = "This is a brush: tool blocks of the same type that touch each other form one entity and share one set of settings. Editing any block edits the whole brush.";

function describe(typeId, description) {
    return lines(
        description,
        "",
        `${H("Outputs:")} ${getClassOutputs(typeId).join(", ")}`,
        `${H("Inputs:")} ${getClassInputs(typeId).join(", ")}`,
        "",
        COMMON_INPUTS_TEXT
    );
}

// SECTION: Condition Reference
// The syntax list for the Execute on condition dropdown, written for players (from "the block system").
const CONDITION_GROUPS = [
    ["Player conditions", [
        ["noCondition", "<no data>", "it does not need a condition to run, just the player to touch this block. (default option)"],
        ["ifPlayerHasTag", "<string>", "if the player has a tag"],
        ["ifPlayerDoesNotHaveTag", "<string>", "if the player does not have this tag"],
        ["ifPlayerScoreIsHigher", "<scoreobjective:name> <int>", "if the player's score is higher than this value"],
        ["ifPlayerScoreIsLower", "<scoreobjective:name> <int>", "if the player's score is lower than this value"],
        ["ifPlayerScoreIs", "<scoreobjective:name> <int>", "if the player's score is exactly that value"],
        ["ifPlayerHasNoScore", "<scoreobjective:name>", "if the player has no score in this objective"],
        ["ifPlayerHasScore", "<scoreobjective:name>", "if the player has a score in this objective"],
        ["ifPlayerHasInInventory", "<minecraft:item/blockID> <item:count(optional)>", "if the player has any or a specific amount of this thing in their inventory. If count is blank it checks if you have any of it on you."],
        ["ifPlayerDoesNotHaveInInventory", "<minecraft:item/blockID> <item:count>", "if the player does not have any or a specific amount of this thing in their inventory"],
        ["ifPlayerHealthIsHigher", "<int>", "if the player's health is higher than this value"],
        ["ifPlayerHealthIsLower", "<int>", "if the player's health is lower than this value"],
        ["ifPlayerHealthIsFull", "<no data>", "if the player's health is full"],
        ["ifPlayerIsDead", "<no data>", "if the player is dead"],
        ["ifPlayerIsAlive", "<no data>", "if the player is alive (cool)"],
        ["ifPlayerIsAt", "<pos:XYZ1> <pos:XYZ2>", "if the player is located anywhere inside this check area. XYZ is written exactly as in a command, for instance: 0 64 -184 (the 3 coordinates in the same value field, separated by spaces)"],
        ["ifPlayerIsNotAt", "<pos:XYZ1> <pos:XYZ2>", "if the player is NOT located inside this check area"],
        ["ifPlayerDamaged", "<no data>", "if the player received damage"],
        ["ifPlayerDamagedFromSource", "<damage:source>", "a damage type from the /damage command. If the player was hit by this specific damage type"],
        ["ifPlayerNameIs", "<string>", "if the player's username is this one"],
        ["ifPlayerNameIsNot", "<string>", "if the player's username is not that one"],
        ["ifPlayerIsSneaking", "<no data>", "if the player is sneaking inside this block"],
        ["ifPlayerIsSwimming", "<no data>", "if the player is crawling/swimming inside this block"],
        ["ifPlayerIsRiding", "<entity:selector>", "if the player is riding this entity. Leave blank if you only want to detect if they're riding something"],
        ["ifPlayerIsWearing", "<minecraft:item/blockID> <slot>", "if the player has this armor/block equipped. Slot: head, chest, legs, feet, offhand or mainhand"],
        ["ifPlayerIsOnConsole", "<no data>", "if the player is playing on a console"],
        ["ifPlayerIsOnMobile", "<no data>", "if the player is playing on a phone or tablet"],
        ["ifPlayerisOnDesktop", "<no data>", "if the player is playing on a computer"]
    ]],
    ["Score conditions", [
        ["ifScoreIsHigher", "<scoreobjective:name> <entity:name> <int>", "if this score is higher than that value"],
        ["ifScoreIsLower", "<scoreobjective:name> <entity:name> <int>", "if this score is lower than that value"],
        ["ifScoreIs", "<scoreobjective:name> <entity:name> <int>", "if this score is exactly that value"],
        ["ifScoreIsNot", "<scoreobjective:name> <entity:name> <int>", "if this score is not exactly that value"]
    ]],
    ["Entity conditions (none of these work on players, even though a player is an entity)", [
        ["ifEntityHasTag", "<entity:selector> <string>", ""],
        ["ifEntityDoesNotHaveTag", "<entity:selector> <string>", ""],
        ["ifEntityHasName", "<entity:selector> <string>", ""],
        ["ifEntityDoesNotHaveName", "<entity:selector> <string>", ""],
        ["ifEntityNameIsNot", "<entity:selector> <string>", ""],
        ["ifEntityScoreIsHigher", "<entity:selector> <scoreobjective:name> <int>", ""],
        ["ifEntityScoreIsLower", "<entity:selector> <scoreobjective:name> <int>", ""],
        ["ifEntityScoreIs", "<entity:selector> <scoreobjective:name> <int>", ""],
        ["ifEntityHasNoScore", "<entity:selector> <scoreobjective:name>", ""],
        ["ifEntityHasScore", "<entity:selector> <scoreobjective:name>", ""],
        ["ifEntityHealthIsHigher", "<entity:selector> <int>", ""],
        ["ifEntityHealthIsLower", "<entity:selector> <int>", ""],
        ["ifEntityHealthIsFull", "<entity:selector>", ""],
        ["ifEntityIsDead", "<entity:selector>", ""],
        ["ifEntityIsAlive", "<entity:selector>", ""],
        ["ifEntityHasInInventory", "<entity:selector> <minecraft:item/blockID> <item:count(optional)>", ""],
        ["ifEntityDoesNotHaveInInventory", "<entity:selector> <minecraft:item/blockID>", ""],
        ["ifEntityExists", "<entity:selector> <radius:int(optional)>", "if this entity exists in the world, or within this many blocks of the player"],
        ["ifEntityDoesNotExist", "<entity:selector> <radius:int(optional)>", "if this entity does not exist in the world, or within this many blocks of the player"],
        ["ifEntityIsAt", "<entity:selector> <pos:XYZ1> <pos:XYZ2>", ""],
        ["ifEntityIsNotAt", "<entity:selector> <pos:XYZ1> <pos:XYZ2>", ""],
        ["ifEntityDamaged", "<entity:selector>", ""],
        ["ifEntityDamagedFromSource", "<entity:selector> <damage:source>", ""]
    ]],
    ["Block conditions", [
        ["ifBlockIs", "<pos:XYZ> <minecraft:blockID>", "if the chosen coordinates are that block"],
        ["ifBlockIsNot", "<pos:XYZ> <minecraft:blockID>", "if the chosen coordinates are not that block"],
        ["ifBlockHas", "<pos:XYZ> <minecraft:blockID> <minecraft:item/blockID>", "if the block has storage and it contains the given item/block"],
        ["ifBlockDoesNotHave", "<pos:XYZ> <minecraft:blockID> <minecraft:item/blockID>", "if the block has storage and it DOES NOT HAVE the given item/block"],
        ["ifBlocksAre", "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>", "if that area is entirely made of that block"],
        ["ifBlockAreaHas", "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>", "if that area has any amount of that block"],
        ["ifBlocksAreNot", "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>", "if the blocks in that area are not entirely that one"],
        ["ifBlockAreaDoesNotHave", "<pos:XYZ1> <pos:XYZ2> <minecraft:blockID>", "if the blocks in that area do not contain any of that block"]
    ]],
    ["World conditions", [
        ["ifTimeIs", "<int1> <int2>", "if the world time is within those values"],
        ["ifTimeIsNot", "<int1> <int2>", "if the world time is not within those values"],
        ["ifWeatherIs", "<clear/rain/thunder>", "if the current weather is one of those"],
        ["ifWeatherIsNot", "<clear/rain/thunder>", "if the current weather is not one of those"]
    ]],
    ["Item conditions", [
        ["ifItemDurabilityIs", "<minecraft:selector> <minecraft:itemID> <int>", "if the given item inside that entity/player's inventory has exactly that much durability"],
        ["ifItemDurabilityFull", "<minecraft:selector> <minecraft:itemID>", "if that item's durability inside that entity/player's inventory is full"],
        ["ifItemDurabilityIsHigher", "<minecraft:selector> <minecraft:itemID> <int>", "if that item's durability inside that entity/player's inventory is higher than this number"],
        ["ifItemDurabilityIsLower", "<minecraft:selector> <minecraft:itemID> <int>", "if that item's durability inside that entity/player's inventory is lower than this number"]
    ]]
];

const CONDITIONS_TEXT = steps(
    lines(
        `${H("How to read this:")} each <value> goes into its own Condition value field, in order: the first into Condition value 1, the second into Condition value 2, the third into Condition value 3. Leave the fields a condition does not use blank.`,
        "<no data> means you put nothing in any value field; the condition already knows what to check. Filling one in will show an error.",
        "Player conditions are checked for the player touching this block (like @s)."
    ),
    ...CONDITION_GROUPS.map(([title, conditions]) => lines(
        H(title),
        ...conditions.map(([name, syntax, note]) => `§b${name}§r ${syntax}${note ? `\n§7  ${note}§r` : ""}`)
    ))
);

// SECTION: Pages
export const BLOCK_INFO = {
    "brr:tool_trigger": {
        examples: lines(
            "- OnStartTouch > door_relay > FireUser1: start a chain when a player walks in.",
            "- OnEndTouchAll > lights > Disable: turn things off once the last player has left.",
            "- OnStartTouch > !activator > RunCommand, parameter 'effect @s speed 5 1': act on whoever touched it.",
            "- OnStartTouch > !self > Disable, Times to fire 1: a one-shot trigger.",
            "- Condition ifPlayerHasTag 'red' + Run command 'effect @s regeneration 1 1': heal only the red team while they stand inside."
        ),
        usage: steps(
            "Build the trigger volume out of trigger blocks. Touching trigger blocks become one trigger.",
            NAME_TIP,
            "Choose Execute on condition and fill only the Condition values it needs (see the Conditions tab). Only players passing the condition count as touching the trigger.",
            "Filter (optional) picks a named filter_class / filter_name / filter_multiple; only players passing it can set the trigger off.",
            "Run command is optional. It runs as every touching player, repeatedly, for as long as they stay inside.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:tool_trigger", lines(
            "The trigger watches players inside its volume.",
            BRUSH_TIP,
            "OnStartTouch / OnEndTouch fire for each player entering / leaving (that player is the !activator). OnStartTouchAll fires when the first player enters, OnEndTouchAll when the last one leaves.",
            "While disabled it ignores everyone."
        )),
        conditions: CONDITIONS_TEXT
    },

    "brr:tool_areaportal": {
        examples: lines(
            "- Selector minecraft:player + Destination block 'lobby_spawn': a doorway back to the lobby.",
            "- Selector @a[tag=finished]: only players with the finished tag are sent through.",
            "- Selector minecraft:zombie: a mob-only portal.",
            "- OnStartTouch > !activator > RunCommand 'playsound mob.endermen.portal @s': a sound for whoever went through."
        ),
        usage: steps(
            "Build the portal volume out of area portal blocks. Touching blocks become one portal.",
            "Selector decides who is teleported: minecraft:player (default), a mob id such as minecraft:zombie, a player name, or a selector such as @a[tag=bread] or @e[type=cow].",
            "Filter (optional) picks a named filter; only players and mobs passing it (and the Selector) are teleported.",
            "Choose where they go: either a Destination block (a named info_target_areaportal, which can also set the facing direction) or Destination coordinates written like '0 64 -184'. If both are set, the Destination block wins.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:tool_areaportal", lines(
            "The area portal teleports everything matching its selector that stands inside it.",
            BRUSH_TIP,
            "OnStartTouch fires for each teleported player or mob, which is the !activator."
        ))
    },

    "brr:tool_invisible": {
        examples: lines(
            "- An invisible wall around the edge of a map.",
            "- A hidden bridge: Start disabled on, then Enable it from a trigger so it appears under the players.",
            "- A logic_timer sending Toggle every few seconds: a wall that blinks in and out."
        ),
        usage: steps(
            "Place invisible blocks where players and mobs must not pass. Touching blocks become one wall.",
            NAME_TIP,
            "Start disabled makes it passable until something sends it Enable.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:tool_invisible", lines(
            "An invisible, solid wall that blocks everyone.",
            BRUSH_TIP,
            "While disabled it lets everything through."
        ))
    },

    "brr:tool_playerclip": {
        examples: lines(
            "- Keep players out of a decoration area while mobs still walk in it.",
            "- Exclude selector @a[tag=lobby,tag=!game]: lobby players may pass, players in game may not.",
            "- Exclude gamemode creative: builders walk through, everyone else is stopped.",
            "- Disable it from a trigger once a puzzle is solved to open the way."
        ),
        usage: steps(
            "Place player clip blocks where players must not pass. Touching blocks become one clip.",
            "Exclude operators (on by default) lets operators through. Exclude gamemode lets one game mode through. Exclude selector lets every player matching it through.",
            NAME_TIP,
            ...OUTPUT_STEPS
        ),
        info: describe("brr:tool_playerclip", lines(
            "An invisible wall for players only: mobs pass freely. Players who walk into it are pushed back to where they last stood outside it.",
            BRUSH_TIP,
            "While disabled everyone passes."
        ))
    },

    "brr:tool_npcclip": {
        examples: lines(
            "- Keep mobs inside a pen while players walk in and out freely.",
            "- Exclude selector @e[type=villager]: villagers may pass, every other mob is stopped.",
            "- Exclude selector @e[tag=boss]: only tagged mobs may cross."
        ),
        usage: steps(
            "Place npc clip blocks where mobs must not pass. Touching blocks become one clip.",
            "Exclude selector lets matching mobs through (leave it blank to stop all mobs).",
            NAME_TIP,
            ...OUTPUT_STEPS
        ),
        info: describe("brr:tool_npcclip", lines(
            "An invisible wall for mobs only: players pass freely. It turns solid next to walking mobs and pushes mobs that get inside back out.",
            BRUSH_TIP,
            "While disabled every mob passes."
        ))
    },

    "brr:info_playerspawn_block": {
        examples: lines(
            "- World spawn at block on: the world spawn becomes this block's position.",
            "- World spawn at block off + World spawn coordinates '0 64 0': spawn somewhere else.",
            "- Set player spawn point on + selector @a[tag=checkpoint1]: a checkpoint for players who reached it.",
            "- Two spawns, one Start disabled: Disable one and Enable the other from a trigger to move the spawn.",
            "- Teleport on join off: players who leave and come back carry on where they logged out, but still respawn here after dying."
        ),
        usage: steps(
            "Place the block where players should spawn.",
            "World spawn at block (on by default) uses this block's position. Turn it off to use World spawn coordinates instead, written like '0 64 -184'.",
            "Set player spawn point gives each player matching Spawn point selector (default @a) a personal spawn point instead of moving the world spawn.",
            "Teleport on join (on by default) brings players to the spawn every time they join or rejoin the world. Turn it off to leave them where they logged out. Respawning after death is not affected. It does nothing while Set player spawn point is on, because then nobody is teleported.",
            "Only one info_playerspawn may be enabled at a time; with more than one enabled, none of them apply.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:info_playerspawn_block", lines(
            "Decides where players spawn. Players who respawn are placed there, and so are players who join unless Teleport on join is off.",
            "While disabled it has no effect."
        ))
    },

    "brr:info_target_areaportal_block": {
        examples: lines(
            "- Name it 'lobby_spawn' and choose it as an area portal's Destination block.",
            "- Facing direction '0 64 20': arriving players look towards that point.",
            "- Several portals may share one destination."
        ),
        usage: steps(
            "Place it where teleported players should arrive and give it a Name; area portals list it under Destination block.",
            "Facing direction is optional: the coordinates of a point players should look at when they arrive, written like '0 64 -184'.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:info_target_areaportal_block", lines(
            "The arrival point for area portals."
        ))
    },

    "brr:game_nametag_block": {
        examples: lines(
            "- Nametag 'VIP', Prefix on, Selectors @a[tag=vip]: [VIP] before every VIP's name.",
            "- Nametag 'AFK', Suffix on, Works in chat off: shown above heads only.",
            "- Two nametag blocks with Nametag order 0 and 1 to control which tag comes first."
        ),
        usage: steps(
            "Write the Nametag text. Emoji codes from the chat system work here too.",
            "Selectors (default @a) chooses which players get it, e.g. @a[tag=game,tag=!lobby].",
            "Works in usernames shows it above heads; Works in chat shows it in chat. Prefix puts it before the name, Suffix after; both puts it on both sides.",
            "Nametag order sorts several tags: 0 comes first, then 1, and so on.",
            "Disabling or breaking the block removes the tag from everyone.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:game_nametag_block", lines(
            "Adds a tag like [VIP] to the names of the players matching its selector, in chat and/or above their heads."
        ))
    },

    "brr:ambient_generic_block": {
        examples: lines(
            "- Sound ID ambient.weather.rain, Loop on, Loop length 100, Start silent off: rain that plays from the start.",
            "- A trigger: OnStartTouch > alarm > PlaySound, and OnEndTouchAll > alarm > StopSound.",
            "- Sound ID random.levelup, Play everywhere on: a sound every player hears, wherever they are.",
            "- A math_counter: OutValue > music > Pitch: the pitch follows the counter's value."
        ),
        usage: steps(
            "Sound ID is any sound from the game or a resource pack, e.g. random.orb, mob.zombie.say or ambient.weather.thunder.",
            "Volume: 1 is normal and is heard about 16 blocks away; higher values are heard further. Pitch: 1 is normal, 0.5 is an octave lower, 2 an octave higher.",
            "Loop replays the sound for as long as it is playing. Bedrock cannot tell how long a sound is, so set Loop length to the sound's length in ticks (20 ticks = 1 second).",
            "Start silent (on by default) keeps it quiet until it receives PlaySound. With Start silent off it starts by itself when the world loads.",
            "Play everywhere plays the sound for every player in this dimension at their own position, so distance does not matter.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:ambient_generic_block", lines(
            "Plays a sound from this block when it is told to, once or looping.",
            "PlaySound starts it (a looped sound keeps playing until StopSound). StopSound stops it. ToggleSound switches between the two.",
            "Volume and Pitch set the volume / pitch to the parameter, used from the next time it plays.",
            "StopSound stops that sound for everyone, including other ambient_generics playing the same Sound ID.",
            "While disabled it stays silent."
        ))
    },

    "brr:logic_auto_block": {
        examples: lines(
            "- OnMapSpawn > intro_relay > FireUser1: start the map's intro when the world loads.",
            "- An automation with On world load + Run command 'weather clear': clear weather on every start.",
            "- An automation with Run periodically + Tick delay 200 + Run command 'say Remember to hydrate': repeat every 10 seconds."
        ),
        usage: steps(
            "OnMapSpawn fires once every time the world (or the add-on) loads; connect outputs to it to set the map up.",
            "Automations (Auto tab, up to 16): each one runs a command and/or one of this block's saved outputs by its label (Run output).",
            "On world load runs it once when the world loads. Run periodically repeats it every Tick delay ticks (20 ticks = 1 second). Run once stops it after the first run. Run once and Run periodically can't both be on.",
            "Add automation adds the one you filled in. Saved lists and deletes them.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_auto_block", lines(
            "Fires outputs automatically when the world loads, and runs timed automations.",
            "OnAutoFire fires every time any automation runs.",
            "While disabled nothing fires."
        ))
    },

    "brr:logic_branch_block": {
        examples: lines(
            "- Output test ifScoreIs 'game_state' 'status' '1': OnTrue > doors > Enable, OnFalse > doors > Disable.",
            "- Output test ifTimeIs '13000' '23000': turn street lights on at night.",
            "- A trigger sending Test to the branch: check the condition only when someone walks in."
        ),
        usage: steps(
            "Choose the Output test (a condition) and fill only the Condition values it needs; the trigger tool's Conditions help page lists the syntax for every condition.",
            "The branch checks it continuously and fires OnTrue or OnFalse whenever the result changes. Run interval (ticks) also re-fires the current result every that many ticks (0 = only on change). Run once stops it after the first fire.",
            "Player conditions pass if any player in this dimension passes them.",
            "Actions tab: commands and saved outputs (by label) to run when the result is true or false.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_branch_block", lines(
            "Tests a condition and fires OnTrue or OnFalse, like an if/else.",
            "Test checks the condition right away and fires the result, even if it did not change.",
            "While disabled it does not check."
        ))
    },

    "brr:logic_case_block": {
        examples: lines(
            "- Case 1 ifScoreIs 'round' 'game' '1', case 2 ifScoreIs 'round' 'game' '2': OnCase01 / OnCase02 set up each round.",
            "- Case 1 ifWeatherIs 'rain', case 2 ifWeatherIs 'thunder', OnDefault for clear weather."
        ),
        usage: steps(
            "Cases tab (up to 16): give each case a condition and its Case values (same syntax as the trigger tool's Conditions help page), plus an optional command and saved output (by label). Add case adds it.",
            "Cases are checked in order and the first one that passes wins. When the winning case changes, its command and output run and OnCase01-16 fires (the number of that case). When no case passes any more, OnDefault fires.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_case_block", lines(
            "Picks the first passing case out of up to 16, like a switch statement.",
            "While disabled it does not check."
        ))
    },

    "brr:logic_compare_block": {
        examples: lines(
            "- Objective 'kills', entity 'Steve', Comparing for OnGreaterThan, value 9: fire when Steve gets 10 kills.",
            "- Objective 'timer', entity 'game' (a fake player), OnEqualTo 0: end the round when the countdown hits 0."
        ),
        usage: steps(
            "Compare tab (up to 16): Scoreboard objective, Scoreboard entity (a player name or fake player as it appears in the scoreboard), the Initial value to compare with, and Comparing for: OnLessThan, OnEqualTo, OnNotEqualTo or OnGreaterThan.",
            "Each comparison fires the output of the same name, runs its command and saved output (by label) when it becomes true. It fires again only after becoming false and true again.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_compare_block", lines(
            "Watches scoreboard values and fires when a comparison becomes true.",
            "While disabled it does not check."
        ))
    },

    "brr:logic_coop_manager_block": {
        examples: lines(
            "- Player A selector @a[tag=red], Player B selector @a[tag=blue]: OnChangeToAllTrue fires once both teams have a player.",
            "- No selectors: two buttons send SetStateATrue and SetStateBTrue; OnChangeToAllTrue opens the door once both are pressed."
        ),
        usage: steps(
            "State A and state B are each true or false. With a Player selector filled in, that state is true while any player in this dimension matches it.",
            "Without a selector the state comes from the Player A/B state toggles and from the SetState/ToggleState inputs.",
            "OnChangeToAllTrue / AllFalse fire when both states become true / false. OnChangeToAnyTrue / AnyFalse fire when at least one becomes true / false.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_coop_manager_block", lines(
            "Combines two true/false states, for example two players or two teams who both have to do something.",
            "While disabled it does not check."
        ))
    },

    "brr:logic_random_outputs_block": {
        examples: lines(
            "- Range 3, Randomness interval 100: every 5 seconds fire OnTrigger1, 2 or 3 at random.",
            "- Run on input on + a trigger sending PickRandom: a random event each time someone walks in.",
            "- Slot 2 command 'give @p diamond': a random reward."
        ),
        usage: steps(
            "Random chance range (1-10) sets how many outcomes there are. Each pick chooses one of them and fires OnTrigger1-10 for it.",
            "It picks on its own every Randomness interval ticks (20 ticks = 1 second). Run once picks only once. Run on input stops automatic picks: it then only picks when it receives PickRandom. Rerun selection never picks the same outcome twice in a row.",
            "Slots tab: give each outcome a command and/or a saved output (by label), choose the slot under Edit slot and enable Save this slot.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_random_outputs_block", lines(
            "Fires one random output out of up to 10.",
            "PickRandom picks immediately.",
            "While disabled it does not pick."
        ))
    },

    "brr:logic_timer_block": {
        examples: lines(
            "- Timer 20 + OnTimer > lamp > Toggle: a light that blinks every second.",
            "- Start disabled + a trigger sending Enable: start a countdown when a player arrives; OnTimer > !self > Disable makes it fire once.",
            "- RefireTime with parameter '100' from another entity: slow the timer to every 5 seconds."
        ),
        usage: steps(
            "Timer is the time between fires, in ticks (20 ticks = 1 second). Each fire runs Run command, the saved output named in Run output, and OnTimer.",
            "The timer starts disabled: turn Start disabled off, or send it Enable. Enabling restarts the countdown.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_timer_block", lines(
            "Fires OnTimer over and over at a fixed interval.",
            "RefireTime sets a new Timer value (parameter, in ticks). ResetTimer restarts the countdown. FireTimer fires right now.",
            "While disabled it does not count."
        ))
    },

    "brr:logic_relay_block": {
        examples: lines(
            "- OnTrigger > lights > Disable, OnTrigger > alarm > PlaySound, OnTrigger > door_relay > Trigger (delay 3): one sequence, started from any number of triggers.",
            "- Only trigger once: a story moment that never repeats. Send it Enable to re-arm it.",
            "- A trigger sending Trigger in co-op: the second player walking in does not restart a sequence that is still playing.",
            "- Disable the relay to cut a whole chain at once, e.g. alarms stop after the power is cut. CancelPending stops a sequence halfway."
        ),
        usage: steps(
            "Send it Trigger from another entity's output. It runs Run command and fires every OnTrigger output.",
            "Until all of its OnTrigger outputs have fired (including delayed ones), it ignores Trigger. Turn on Allow fast retrigger to let every Trigger through, or send EnableRefire to let the next one through.",
            "Only trigger once disables the relay after it fires; send Enable to re-arm it.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:logic_relay_block", lines(
            "Forwards one input to many outputs, so a sequence is set up in one place and started from anywhere. Disabling it breaks the chain.",
            "Trigger fires OnTrigger. CancelPending drops its outputs that have not fired yet. EnableRefire lets the next Trigger through while it is still waiting.",
            "OnSpawn fires once when the world loads.",
            "While disabled it ignores Trigger; outputs it already queued still fire."
        ))
    },

    "brr:filter_class_block": {
        examples: lines(
            "- Entity type minecraft:player: a trigger with this filter reacts to players only.",
            "- Entity type zombie + Negated: everything except zombies passes.",
            "- An area portal with Selector @e and this filter (Entity type cow): a portal only cows can use."
        ),
        usage: steps(
            "Entity type is the mob's id, e.g. minecraft:zombie. Without a namespace minecraft: is assumed, so 'zombie' and 'player' work too.",
            "Negated flips the result: everything that is NOT that type passes.",
            FILTER_USE,
            ...OUTPUT_STEPS
        ),
        info: describe("brr:filter_class_block", lines(
            "Lets through only players or mobs of one entity type.",
            FILTER_TEST,
            "While disabled it lets everything through."
        ))
    },

    "brr:filter_name_block": {
        examples: lines(
            "- Activator name Steve: a trigger only Steve can set off.",
            "- Activator name Guard* on mobs named Guard1, Guard2...: the guards pass, every other mob does not.",
            "- Activator name Steve + Negated: everyone except Steve."
        ),
        usage: steps(
            "Activator name is a player's username or the name tag of a mob. It is not case-sensitive, and a name ending in * matches every name starting with that text.",
            "Negated flips the result: everyone whose name does NOT match passes.",
            FILTER_USE,
            ...OUTPUT_STEPS
        ),
        info: describe("brr:filter_name_block", lines(
            "Lets through only players or mobs with a certain name.",
            FILTER_TEST,
            "While disabled it lets everything through."
        ))
    },

    "brr:filter_multiple_block": {
        examples: lines(
            "- Filter type AND with filter_class 'is_player' and filter_name 'is_steve': only the player Steve passes.",
            "- Filter type OR with two filter_class filters (zombie, skeleton): either kind of mob passes.",
            "- Negated + OR: everything except the listed kinds passes."
        ),
        usage: steps(
            "First create and name the filters you want to combine (filter_class, filter_name or other filter_multiples).",
            "Filters tab (up to 5): pick a filter and enable Add filter. Saved lists and deletes them.",
            "Filter type AND passes only when every listed filter passes; OR passes when any of them does. Negated flips the result.",
            FILTER_USE,
            ...OUTPUT_STEPS
        ),
        info: describe("brr:filter_multiple_block", lines(
            "Combines up to 5 other filters into one.",
            "Listed filters that are disabled let everything through; listed names that no longer exist are skipped.",
            FILTER_TEST,
            "While disabled it lets everything through."
        ))
    },

    "brr:math_counter_block": {
        examples: lines(
            "- Each button sends Add with parameter 1; Maximum 3 + OnHitMax > door > Enable: open the door after 3 presses.",
            "- Initial value 10, Minimum 0, Maximum 10: a trigger sends Subtract 1 on every touch, OnHitMin ends the game.",
            "- Score tab: objective 'kills', holder 'counter': '/scoreboard players test counter kills 5' works in command blocks.",
            "- OutValue > music > Pitch: send the new value to another entity (leave Parameter blank)."
        ),
        usage: steps(
            "Initial value is the number it starts with (again every time you save the form).",
            "Minimum and Maximum limit the value. With both at 0 there are no limits.",
            "Change the value with the inputs Add, Subtract, Multiply, Divide (parameter = the amount) or SetValue (parameter = the new value).",
            "Outputs that carry the value (OutValue, OnGetValue) send it as the target's parameter when the connection's Parameter is left blank.",
            "Score tab (optional): Scoreboard objective and Score holder mirror the value into a scoreboard so commands can use it. The objective is created if it doesn't exist; the holder defaults to this entity's Name. Scores are whole numbers, so the value is rounded there.",
            ...OUTPUT_STEPS
        ),
        info: describe("brr:math_counter_block", lines(
            "Stores a number that other entities can change and react to. Its value is saved with the world.",
            "OutValue fires with the new value after every change. OnHitMax / OnHitMin fire when the value reaches a limit; OnChangedFromMax / OnChangedFromMin when it moves away from it again. GetValue fires OnGetValue with the current value.",
            "SetValueNoFire changes the value without firing anything. SetHitMin / SetHitMax change a limit and fire if the value now sits on it; SetMinValueNoFire / SetMaxValueNoFire change a limit silently.",
            "While disabled it ignores everything except GetValue."
        ))
    }
};

const EMPTY = { examples: "", usage: "", info: "", conditions: "" };

export function getBlockInfoSection(typeId, section) {
    const text = `${(BLOCK_INFO[typeId] ?? EMPTY)[section] ?? ""}`.trim();
    return text || "§8(not written yet)§r";
}
