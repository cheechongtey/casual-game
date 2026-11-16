# Proposal

## Why

The game is one room in which chasers respawn forever, so a fight never ends and nothing leads anywhere. The vertical slice needs a run: rooms that can be cleared, an exit that opens, and a sequence of rooms with something at stake between them. Upgrades (`boon-system`) and the hub (`meta-progression`) both need that run to exist first.

## What Changes

- A room has a phase: **fighting** while any enemy is alive, **cleared** once all are defeated.
- A room definition gains a list of **exits**. An exit is a zone on the room's edge that blocks movement while fighting and opens when the room is cleared. Rooms in this change have one exit; the list exists so a later change can add path choice without rewriting room data.
- Walking into an open exit ends the room and moves the player to the next room of the run.
- A **run** is a fixed sequence of three combat rooms containing chasers only (4, 5 and 6 as first guesses). Each room holds one group of enemies, present when the player enters. There are no waves inside a room.
- Player health carries from room to room with no healing. Everything else about the player resets at the door.
- Clearing the third room and leaving it shows a **run complete** message; a fresh press starts a new run.
- **BREAKING** Defeat restarts the run from its first room with a new seed, instead of restarting the same room with the same seed.
- **BREAKING** Chasers no longer reappear after defeat. Training dummies still do.
- The current starting room becomes a **test room** outside the run, opened with a URL parameter, so combat can still be tuned against dummies.
- The HUD shows which room of the run the player is in.
- A run seed can be fixed with a URL parameter so a run can be reproduced.
- Rooms stay hand-written data. This settles the editor question the roadmap assigned to this change: no LDtk or Tiled for now.

Not in this change: waves within a room, reward rooms, boss rooms, path choice between two exits, healing, the hub, new enemy types, and a drawn entrance door. Each belongs to a later change.

## Capabilities

### New Capabilities

- `room-clearing`: the fighting and cleared phases of a room, exits that are closed while fighting and open when cleared, and leaving a room through an open exit.
- `run-sequence`: a run as an ordered sequence of rooms, what carries from one room to the next, how a run ends, and the test room that sits outside the run.

### Modified Capabilities

- `rooms`: a room definition includes a list of exits; exits are validated; the starting-room scenarios are replaced by scenarios for the test room and the run's rooms.
- `enemy-behavior`: the requirement that chasers reappear after defeat is removed; a defeated chaser stays defeated.
- `player-defeat`: restarting after defeat starts a new run from the first room, or the test room again when playing in the test room.
- `game-simulation`: the determinism requirement accounts for the health the player enters a room with; room-cleared and exit-reached are reported as step events.
- `world-rendering`: exits are drawn, and a closed exit looks different from an open one.
- `hud`: a room progress display and a run complete message are added; the defeat message scenario refers to a new run.

## Impact

- **Simulation** (`src/sim`): `types.ts` and `state.ts` gain the room phase, the exit-reached stop, and a way to enter a room with carried health; `room.ts` validates exits; `collision.ts` treats closed exits as solid; `damage.ts` and `data/enemies.ts` lose chaser respawn. A new run module holds the sequence position, the run seed and carried health.
- **Data** (`src/data`): `room.ts` gains exits; three new room files and a run sequence are added; `rooms/start.ts` becomes the test room.
- **View** (`src/view/GameScene.ts`, `hud.ts`): the scene is built from the run's current room, restarts on leaving a room, draws exits, shows room progress and the run complete message, and reads the URL parameters.
- **Tests**: `tests/helpers.ts` room builder gains exits; tests that rely on chaser respawn change; new tests for room clearing, exits and the run.
- **Docs**: `roadmap.md`, `game-design.md`, `architecture.md`, `decisions.md`, `development.md`, `enemies.md`.
- No new dependencies.
