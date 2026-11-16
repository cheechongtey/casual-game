# Architecture

The game is split into a simulation that knows nothing about rendering and a view that draws it. Everything else follows from keeping that split strict.

## Layers

```
src/
  data/    plain values: tuning constants, weapon definitions, room definitions
  sim/     the rules of the game, in plain TypeScript
  input/   keyboard and mouse -> InputIntent
  view/    Phaser scene: projection, drawing, camera, effects
  main.ts  Phaser game config and boot
tests/     Vitest tests, run in Node with no browser
```

Dependencies point one way:

```
   main.ts
      |
      v
    view  ------>  input
      |              |
      +------+-------+
             v
            sim
             |
             v
            data
```

- `sim` imports only from `data`.
- `input` and `view` may import from `sim` and `data`. `input` also uses the view's projection to turn the cursor into a ground point.
- Nothing imports from `view` except `main.ts` and `input`.

### The simulation boundary

`src/sim` must not import Phaser, reference `window` or `document`, call `Math.random` or `Date.now`, or import from `view` or `input`. A test in `tests/sim-core.test.ts` scans the folder and fails if any file does.

This is what makes gameplay testable without a browser and reproducible from a seed. If you find yourself wanting to break the rule, the thing you are writing probably belongs in `view` or `input`.

## What lives where

| File | Responsibility |
|---|---|
| `data/tuning.ts` | Every tunable number that is not per-attack |
| `data/enemies.ts` | Chaser stats and attack definition |
| `data/weapons.ts` | The three attacks of the combo |
| `data/room.ts`, `data/rooms/start.ts` | The `Room` type and the one room |
| `sim/types.ts` | `InputIntent`, `Entity`, `PlayerCombat`, `SimState`, `SimEvent` |
| `sim/state.ts` | `createSim`, `step`, and what the view reads (`getPlayer`, `attackArea`, `enemyAttackAreas`) |
| `sim/loop.ts` | Fixed-timestep clock and `advanceFrame` |
| `sim/player.ts` | The player's action state machine: attack, dash, movement, separation |
| `sim/enemy.ts` | Chaser states, steering, attack scheduling, hits and separation |
| `sim/damage.ts` | `applyHit`, knockback, respawn |
| `sim/sector.ts` | The arc-shaped hit test |
| `sim/collision.ts` | Circle against walls and room bounds |
| `sim/room.ts` | Room validation |
| `sim/rng.ts` | Seeded random number generator |
| `input/intent.ts` | Pure functions: keys to move direction, cursor to aim angle |
| `input/latch.ts` | Pure functions: making sure a brief press is not lost |
| `input/DeviceInput.ts` | Phaser keyboard and pointer wiring |
| `view/projection.ts` | World to screen and back |
| `view/camera.ts` | Camera bounds for a room |
| `view/arc.ts` | Points along an attack's arc, for drawing |
| `view/GameScene.ts` | The Phaser scene: frame loop, drawing, effects |

## State

The whole game is one plain object, `SimState`:

```
SimState
  tick        steps taken so far
  rng         seeded generator state
  room        validated copy of the room definition
  entities    the player, dummies and chasers
  playerId    which entity is the player
  player      PlayerCombat: current action, combo, cooldowns, buffers
```

Entities are plain objects of one type, `Entity`, with a `kind` of `player`, `dummy` or `chaser`. Each entity holds its own `hitstop` counter and `respawnDelay`. Its nullable `ai` stores chaser behaviour, cooldown, wait duration and detour. There is no entity-component framework; systems are ordinary functions that take the state.

The player's action is a tagged union, so the player is always exactly one of idle, attacking (in windup, active, or recovery), or dashing. See [combat.md](combat.md).

## One display frame

`GameScene.update` runs once per display frame:

```
1. center the camera on the player, with no shake
2. sample input        -> one InputIntent for this frame
3. advanceFrame        -> runs 0 to 5 simulation steps with that intent
                          returns { alpha, events, steps }
4. tell input how many steps ran (clears latched presses)
5. react to events     (hit flash, screen shake)
6. age effects         (flash, shake, dash trail)
7. draw, interpolating positions by alpha, then apply shake to the camera
```

Aim is sampled in step 2, before any shake is applied, so screen shake never moves the aim.

### Fixed timestep

The simulation always advances in steps of 1/60 second. `advanceClock` adds the frame's elapsed time to an accumulator and reports how many whole steps are due. At most 5 steps run per frame; time beyond that is thrown away, so a long stall does not cause a burst of catch-up.

`alpha` is how far the frame falls between the last step and the next. The view draws each entity between its `prevPos` and `pos` by that fraction, which keeps motion smooth at any refresh rate.

Every step in a frame receives the same intent. That is why the intent carries *held* state and not *pressed* events: a press reported twice would start two attacks from one click.

## One simulation step

`step(state, intent)` in `sim/state.ts`:

```
1. if the player is defeated: count the tick, return
2. copy every entity's pos to prevPos
3. read presses and buffer them (including during hitstop)
4. decrement per-entity hitstop; freeze those paused at step start
5. count down unfrozen respawn timers and restore expired entities
6. unfrozen player: timers, action, facing, dash/attack, movement, buffers
7. unfrozen enemies: advance states; grant attacks by wait/id; pursue or lunge
8. resolve the unfrozen player's hits, then unfrozen enemies' hits on the player
9. integrate unfrozen knockback
10. separate enemies from fixed entities and each other, resolve walls;
    then separate the player (unless dashing or frozen)
11. count the tick
```

`step` returns the events that happened in it. Events are not stored in the state.

## Events

The simulation tells the view what happened through `SimEvent`:

| Event | When |
|---|---|
| `attackStart` | An attack begins its windup |
| `dashStart` | A dash begins |
| `hit` | A hit lands; carries target, damage, position, and hitstop |
| `defeated` | An entity's health reaches zero |

`advanceFrame` collects the events of every step it runs, so the view cannot miss one when two steps fall in a single frame. The view uses events for one-off feedback and reads state for everything continuous.

## Coordinates and projection

```
world (simulation)                 screen (view)

   +-----> x                         +-----> x
   |                                 |
   v y   (depth, toward viewer)      v y = world y * 0.6 - z

   z = height above ground
```

- World space is flat. `x` runs right, `y` runs toward the bottom of the screen, `z` is height.
- One world unit is one screen pixel horizontally.
- Angles are radians from the positive x axis. Because `y` grows downward, up-screen is a negative angle.
- `project(x, y, z)` returns `(x, y * depthRatio - z)`. `unprojectGround(sx, sy)` reverses it for a point on the ground.

`view/projection.ts` is the only place either conversion happens. All gameplay maths, including hit areas and aim, is done in world space. Swapping to a different projection later means changing that one file and the art.

### Draw order

| Layer | Depth |
|---|---|
| Floor and grid | -3 |
| Shadows | -2 |
| Attack arc | -1 |
| Walls and entities | their ground `y` (a wall uses its front edge) |
| Health bars | 999,999 |
| Debug overlay | 1,000,000 |

Sorting walls and entities by ground `y` is what makes the player disappear behind a wall and appear in front of it.

## Determinism

Given the same seed, room, and sequence of intents, the simulation produces the same state at every step. Tests replay recorded input and compare full state and event sequences.

The guarantee is per build and per machine. Some maths functions (`Math.hypot`, `Math.cos`, `Math.sin`) can differ in their last bits between JavaScript engines, so replays are not promised to match across browsers.

## Collision

- All entities are circles. Walls are axis-aligned rectangles.
- `resolveCircle` pushes a circle out of each wall along the shortest vector, up to three passes, then clamps it to the room. Sliding along walls and rounding corners fall out of this with no special cases.
- That method is only right while a circle has not crossed the middle of a wall in one move. Fast movement (the dash, knockback) goes through `moveCircle`, which splits the move into segments of at most half the radius.
- The player is pushed out of solid entities after movement; the other entity never moves from contact. While dashing this is skipped, so a dash passes through.
