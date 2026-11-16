# Proposal

## Why

The skeleton has a player who can move and aim but cannot do anything. Whether this game is worth building depends on how attacking and dashing feel, and that can be tuned now against a stationary target, before enemy behavior adds a second source of problems.

## What Changes

- Add a three-hit melee combo with windup, active, and recovery phases, a locked attack direction, a short forward lunge, and reduced movement while attacking.
- Add a dash: a fast fixed-distance burst with a cooldown that passes through other entities, cancels an attack in progress, and makes the player invulnerable while it lasts.
- Add input buffering so attack and dash presses made slightly early are honored.
- Add health, damage, knockback, and hitstop, with hits detected by an arc-shaped area in front of the player.
- Add a training dummy that takes damage and knockback, is defeated at zero health, and reappears shortly after.
- Add room placements so a room definition can say where training dummies stand.
- Add combat feedback to the view: a drawn swing arc that matches the hit area, hit flash, screen shake, a dash trail, and health bars.
- Extend input with left mouse button to attack and Space to dash.
- The simulation reports the gameplay events of each step so the view can react without reading private state.

Out of scope: enemies that move or attack, any source of damage to the player, a special attack, upgrades, a player health display, audio, and sprite art. Dash invulnerability is specified and tested here, but nothing in the game can damage the player until the enemy change.

## Capabilities

### New Capabilities

- `melee-combat`: The player's melee attacks: phases, the combo sequence, attack direction, hit area, and attack input buffering.
- `dash`: The player's dash: distance, direction, cooldown, invulnerability, and how it interacts with walls, entities, and attacks.
- `health-and-damage`: Health, damage, defeat, knockback, hitstop, and invulnerability for any entity that can be hit.
- `training-dummy`: A stationary target for tuning combat that takes hits, is defeated, and reappears.

### Modified Capabilities

- `player-input`: The per-step intent gains attack and dash state; adds the mouse and keyboard bindings for them and a guarantee that brief presses are not lost.
- `player-movement`: Normal movement and facing now yield to attacks and dashes, and other solid entities block the player.
- `rooms`: A room definition can place training dummies, and invalid placements are rejected.
- `game-simulation`: The simulation reports the gameplay events that occurred in each step.
- `world-rendering`: Adds drawing of attacks, dashes, hit feedback, screen shake, and health bars.

## Impact

- **Code**: Extends `src/sim` (entity state, step order, new attack, dash, and damage logic), `src/data` (weapon and combat tuning, room placements), `src/input` (two new bindings and press latching), and `src/view` (effects and health bars). `InputIntent`, `Room`, and `Entity` gain fields, so existing tests that construct them need updating.
- **Dependencies**: None added.
- **Later changes**: Enemy AI will reuse health, damage, knockback, and the event stream. The boon system will modify the weapon and dash values introduced here, so they are kept as data.
