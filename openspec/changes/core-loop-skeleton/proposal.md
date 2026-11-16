# Proposal

## Why

The project is an empty repository with a plan for a browser-based roguelite action game. Every later system (combat, enemy AI, room flow, upgrades, meta progression) depends on the same foundation: a deterministic simulation that is independent of the renderer, and a 3/4 oblique view that draws it. Building that foundation first, with nothing but a controllable player in one walled room, proves the architecture before any gameplay is layered on it.

## What Changes

- Set up the project: TypeScript, Vite, Phaser 4 (pinned to an exact version), and Vitest.
- Add a plain-TypeScript simulation layer with no Phaser imports, advanced on a fixed 60 Hz timestep with a seeded random number generator.
- Add an abstract player input intent (move vector, aim angle) fed by keyboard and mouse, so other devices can be mapped later without touching the simulation.
- Add player movement in flat 2D world space: acceleration-free 8-way movement, continuous 360-degree facing toward the aim point, and circle-versus-wall collision with sliding.
- Add a room defined as data (bounds, wall rectangles, player spawn) and load one hand-authored room.
- Add a 3/4 oblique view: a single projection function from world to screen, y-sorted drawing, drop shadows, a follow camera, and placeholder shape graphics.
- Add a headless test harness that runs the simulation without a browser.

Out of scope, each planned as its own later change: attacks and damage, enemies, room transitions and run structure, upgrades, meta progression, audio, sprite art, gamepad and touch input.

## Capabilities

### New Capabilities

- `game-simulation`: The renderer-independent simulation loop: fixed timestep, determinism, seeded randomness, and the boundary between simulation and view.
- `player-input`: Translation of device input into an abstract per-tick intent consumed by the simulation.
- `player-movement`: How the player entity moves, faces, and collides within a room.
- `rooms`: Room definitions as data and how a room is loaded into the simulation.
- `world-rendering`: How simulation state is projected and drawn in the 3/4 oblique view.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- **Code**: Creates the whole source tree; there is no existing code to change.
- **Dependencies**: Adds `phaser` (4.2.1 is the current release), `typescript`, `vite`, and `vitest`. No Phaser plugins.
- **Tooling**: Requires Node.js for the dev server, build, and tests.
- **Later changes**: Combat, enemy AI, room flow, upgrades, and meta progression will build on the simulation and view boundary this change establishes, so its interfaces are the main thing to review.
