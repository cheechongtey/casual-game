# Development

## Setup

Requires Node.js.

```bash
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server with hot reload |
| `npm test` | Runs all tests once, in Node |
| `npm run typecheck` | Type-checks `src` and `tests` without emitting |
| `npm run build` | Builds the production bundle into `dist/` |
| `npm run preview` | Serves the production bundle locally |

Before committing, run typecheck, tests, and build.

## Stack

| Tool | Role | Note |
|---|---|---|
| Phaser | Rendering, input events, game loop | Pinned to exactly 4.2.1 |
| TypeScript | Language | Strict mode; unused locals and parameters are errors |
| Vite | Dev server and bundler | |
| Vitest | Tests | Runs in Node, no browser environment |

No Phaser plugins are used. Phaser's physics is not used either; collision is in `src/sim`.

## Testing

Tests live in `tests/` and run with no browser. That works because the simulation, the projection, and the input-mapping functions are plain TypeScript.

| File | Covers |
|---|---|
| `sim-core.test.ts` | Seeded generator, headless running, the simulation boundary rule |
| `state.test.ts` | Starting entity state, step events, combat state exposed to the view |
| `loop.test.ts` | Fixed timestep, catch-up cap, one intent per frame |
| `rooms.test.ts` | Room validation, dummy/enemy placements and starting room |
| `enemy-movement.test.ts` | Noticing, pursuit, detours, separation and respawn |
| `enemy-attacks.test.ts` | Phases, hits, hitstop, scheduling, cooldown, stagger and telegraphs |
| `player-defeat.test.ts` | Final-hit events and complete gameplay freeze after defeat |
| `hud.test.ts` | Restart acceptance, identical reset state, telegraph opacity and health fill |
| `enemy-determinism.test.ts` | Recorded input with detours and enemy hits |
| `movement.test.ts` | Movement, wall collision, determinism |
| `melee.test.ts` | Hit area, attack phases, combo, buffering, lunge |
| `dash.test.ts` | Dash movement, cooldown, cancelling, invulnerability |
| `damage.test.ts` | Health, defeat, knockback, hitstop |
| `solids.test.ts` | Dummies blocking the player, dashing through them, respawn, determinism with combat input |
| `view-input.test.ts` | Projection, camera bounds, arc points, key and aim mapping, press latching |

### Test helpers

`tests/helpers.ts` keeps tests short:

| Helper | Use |
|---|---|
| `intent({ ... })` | An `InputIntent` with every other field set to no input |
| `room(walls, spawn, dummies, enemies)` | A 1000 x 1000 test room |
| `run(sim, intent, steps)` | Step with one intent; returns all events |
| `runEach(sim, steps, n => intent)` | Step with a different intent per step; returns events by step number |
| `stepsWith(perStep, type)` | The step numbers at which an event type occurred |
| `entity(sim, id)` | Look up an entity or throw |
| `distanceToRect(point, rect)` | For asserting a circle does not overlap a wall |

Always build intents with `intent()`. When a field is added to `InputIntent`, tests that use the helper keep compiling.

### What is not covered by tests

Anything that needs Phaser: `GameScene` and `DeviceInput`. Check those in the browser. Keep logic out of them where possible; the pattern so far is a pure function in `view/` or `input/` with a test, and a thin Phaser wrapper that calls it.

## Checking things in the browser

The debug overlay in the top left shows the tick, frame rate, player position and facing, the current action with its phase and steps left, the next combo attack, the dash cooldown, player hitstop, and the number of enemies in windup or active against the limit.

In the dev server only, the running scene is available in the browser console as `__scene`. For example, `__scene.sim` is the live simulation state. It is not present in production builds.

## How to add things

### A tunable value

Add it to `src/data/tuning.ts` with a comment giving its unit, read it from `TUNING` in the code, and add a row to [tuning.md](tuning.md).

### An attack in the combo

Add an entry to `WEAPON` in `src/data/weapons.ts`. The combo length is the array length. The finisher is whichever entry is last; the view colors its arc differently.

### A room

1. Create a file in `src/data/rooms/` exporting a `Room`: `id`, `width`, `height`, `walls`, `spawn`, `dummies`, `enemies`.
2. Walls are rectangles with `x`, `y` at the corner nearest the origin, and must lie inside the bounds.
3. `loadRoom` rejects a room whose spawn point, dummy or enemy placements overlap a wall, the room edge, or each other, and names the offender in the error.

Only one room is loaded today: `GameScene` imports `startRoom` directly. Choosing between rooms is part of the room-flow change on the [roadmap](roadmap.md).

### A simulation event

1. Add a variant to `SimEvent` in `src/sim/types.ts`.
2. Push it onto the `events` array where it happens.
3. React to it in `GameScene.handleEvents` if the view should.

### An input

1. Add a field to `InputIntent` and to `NO_INPUT` in `src/sim/types.ts`. For a button, the field means "held".
2. Produce it in `DeviceInput.sample`. Use a `ButtonLatch` for buttons so brief presses are not lost, and release it in `releaseAll`.
3. Read it in the simulation. Detect a new press by comparing with the previous step, as `readPresses` does.

### A kind of entity

1. Add the kind to `EntityKind` in `src/sim/types.ts`.
2. Create it in `createSim` using `createEntity`.
3. Draw it in `GameScene.drawEntity`.

Anything with `maxHealth` above zero can be hit by the player's attacks with no further work.

### A rule of play

Put it in `src/sim`. Write the test first; a rule that cannot be tested in Node is usually a sign it is reaching into the view. Then update [combat.md](combat.md) or add a doc for the new system.

## Working with OpenSpec

Work is planned and recorded as OpenSpec changes.

```
openspec/
  config.yaml
  specs/<capability>/spec.md       what the game must do, by capability
  changes/<name>/                  a change in progress
    proposal.md                    why, and what is in scope
    specs/<capability>/spec.md     requirement deltas
    design.md                      how, with alternatives considered
    tasks.md                       checklist, each task with its verification
  changes/archive/<date>-<name>/   finished changes
```

The usual path:

| Step | Skill | Result |
|---|---|---|
| Think it through | `openspec-explore` | No files; a clearer idea |
| Plan | `openspec-propose` | A change with proposal, specs, design, tasks |
| Build | `openspec-apply-change` | Code and tests; tasks ticked off |
| Finish | `openspec-archive-change` | Change archived; its requirements merged into `openspec/specs/` |

Useful commands:

```bash
openspec list
```

```bash
openspec list --specs
```

```bash
openspec validate --specs --strict
```

When archiving, sync the change's spec deltas into `openspec/specs/` so the main specs keep describing the game as built.

## Conventions

- **Steps, not seconds.** Gameplay durations are whole numbers of simulation steps.
- **World space for rules, screen space for drawing.** Only `view/projection.ts` converts between them.
- **Data over constants in logic.** A number someone might tune goes in `data/`.
- **One entry point for a kind of change.** Health changes only in `applyHit`; coordinates convert only in `projection.ts`.
- **Comments say why.** Units and non-obvious reasons, not a restatement of the code.

The starting room places four chasers at (1050, 200), (1150, 200), (1250, 200), and (1350, 200). All begin beyond their 420-unit notice range, on open ground above the pillars and away from the lower-left L-shaped corner. The group can be approached together; dummies near spawn remain available for tuning.
