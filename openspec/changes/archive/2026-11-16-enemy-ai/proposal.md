# Proposal

## Why

Combat has been tuned against targets that stand still and never hit back, so nothing yet tests whether dodging, positioning, and the dash's invulnerability matter. Adding one enemy that pursues and attacks, and letting the player be hurt and defeated, turns the combat test bed into a fight and is the base every later enemy type builds on.

## What Changes

- Add the chaser: a melee enemy that stands idle until the player comes near, pursues the player around walls, and attacks with a telegraphed arc that goes through windup, active, and recovery phases.
- Enemy attacks damage the player, using the same hit-area test and the same damage function as the player's attacks. This is the first source of damage to the player.
- Limit how many enemies may attack at once, and give each enemy a cooldown between attacks.
- A hit interrupts a chaser's attack and staggers it briefly.
- Enemies keep apart from each other and do not push the player around.
- A room definition can place enemies, and invalid placements are rejected. The starting room gains chasers placed away from the spawn point, so the dummies beside it stay usable for tuning.
- **BREAKING** (behavior): hitstop no longer pauses the whole simulation. Only the attacker and the target of a hit pause; everything else keeps moving.
- The player is defeated at zero health. Play stops, a message is shown, and pressing any key or mouse button after a short delay restarts the room.
- Add a player health display fixed on screen, and stop drawing a floating health bar over the player.
- Draw chasers and their attack telegraphs, the telegraph being the same shape the attack will hit.

Out of scope: the shooter, the charger, and the mini-boss; projectiles; waves, locked doors, and clearing a room; pathfinding around concave wall layouts; line of sight; invulnerability after being hit; enemy hits interrupting the player's attacks; a hub, currency, or anything kept between attempts; sound.

## Capabilities

### New Capabilities

- `enemy-behavior`: How enemies act: noticing the player, pursuit and steering, keeping apart, attack telegraphs and phases, the limit on simultaneous attackers, being interrupted by hits, and reappearing after defeat. Starts with the chaser.
- `player-defeat`: What happens when the player's health reaches zero: play stops, and the room can be restarted.
- `hud`: On-screen information that is not part of the world: the player health display and the defeat message.

### Modified Capabilities

- `health-and-damage`: Hitstop pauses only the attacker and the target of a hit instead of the whole simulation.
- `rooms`: A room definition can place enemies; placements that overlap walls, the room edge, the spawn point, dummies, or each other are rejected; the starting room contains chasers.
- `game-simulation`: The state readable by the view also covers each enemy's behavior state and its attack's area and windup progress.
- `world-rendering`: Adds drawing of chasers and enemy attack telegraphs; the swing arc requirement is worded for the player's attack only; the floating health bar no longer applies to the player.

## Impact

- **Code**: New `src/data/enemies.ts` and a new enemy module in `src/sim`. Changes to `src/sim` step order, `applyHit`, `Entity` (new kind, behavior state, per-entity hitstop), `Room` (enemy placements), `src/input` (detecting any press for restart), and `src/view` (chasers, telegraphs, health display, defeat message, restart).
- **Tests**: Tests that read the global `hitstop` counter change to the per-entity one. Room literals and the `room()` test helper gain the enemy placements field.
- **Docs**: `docs/combat.md`, `tuning.md`, `architecture.md`, `decisions.md`, `roadmap.md`, `game-design.md`, and `development.md` describe behavior this change alters (global hitstop, entity kinds, step order, what damages the player).
- **Dependencies**: None added.
- **Later changes**: The shooter and charger will add behavior kinds beside the chaser. Room flow will replace enemies reappearing with waves. Meta progression will replace restart-in-place with a return to the hub.
