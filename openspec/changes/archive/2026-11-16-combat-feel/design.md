# Design

## Context

The skeleton is in place: a Phaser-free simulation in `src/sim` stepped at a fixed 60 Hz, a single `Entity` type (the player), `InputIntent { moveX, moveY, aim }`, circle-versus-rectangle collision, and a view that reads the simulation and never writes it. A test fails the build if `src/sim` imports Phaser, touches browser globals, or uses unseeded randomness. See proposal.md for motivation and scope and the spec deltas for required behavior.

Constraints carried over:

- Gameplay must stay deterministic and testable in Node.
- Art is placeholder shapes, so every piece of combat feedback must be drawable from simulation data alone.
- The boon system will later change weapon and dash values at run time, so they cannot be hard-coded into logic.

## Goals / Non-Goals

**Goals:**

- All combat timing expressed in simulation steps and held as data.
- Combat rules reusable by enemies later: damage, knockback, and events must not assume the attacker is the player.
- Feedback (arc, flash, shake, trail) driven only by exposed state and step events.

**Non-Goals:**

- A general ability or effect framework. One weapon and one dash, written directly.
- Enemy attacks, enemy AI, or hit reactions beyond knockback.
- Damage numbers, particles, sound, or sprite animation.
- A modifier stack for stats. Values are read from data; the boon change will decide how they are modified.

## Decisions

### 1. Player action as a small state machine in the simulation state

`SimState` gains `player: PlayerCombat`:

```
action:        { kind: 'idle' }
             | { kind: 'attack', index: 0|1|2, phase: 'windup'|'active'|'recovery',
                 ticksLeft, dir, hitIds: number[] }
             | { kind: 'dash', ticksLeft, dirX, dirY }
comboIndex, comboTicksLeft     which attack comes next, and for how long
dashCooldown                   steps until a dash may start
attackBuffer, dashBuffer       steps a remembered press stays valid
attackWasHeld, dashWasHeld     for detecting a new press
```

- **Why**: one tagged union makes illegal combinations (attacking while dashing) unrepresentable, and it is plain data, so the determinism test covers it.
- **Alternative, separate boolean flags and timers**: fewer types, but every rule needs guards against combinations that should not exist.
- **Alternative, a generic state-machine library**: unnecessary for three states.

### 2. Weapons and combat values are data

`data/weapons.ts` defines the weapon as an array of three attack definitions; `data/tuning.ts` gains the dash, buffer, dummy, and knockback values. Durations are in steps.

| Attack | Windup | Active | Recovery | Damage | Knockback | Range | Angle | Lunge | Hitstop |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 8 | 20 | 380 | 72 | 110 | 10 | 3 |
| 2 | 4 | 3 | 8 | 20 | 380 | 72 | 110 | 10 | 3 |
| 3 | 7 | 4 | 14 | 40 | 720 | 84 | 150 | 18 | 6 |

| Value | Default |
|---|---|
| Combo window | 20 steps |
| Input buffer | 8 steps |
| Move speed while attacking | 0.3 of normal |
| Dash distance, duration | 170 units, 10 steps |
| Dash cooldown | 24 steps |
| Knockback decay | velocity x 0.85 per step, stops below 5 units/s |
| Player health | 100 |
| Dummy health, radius, respawn | 200, 20 units, 120 steps |

These are starting points for tuning and are not fixed by the specs, which refer to them as configured values.

### 3. Intent carries held state; the simulation detects presses

`InputIntent` gains `attack: boolean` and `dash: boolean`, meaning "held". The simulation compares against the previous step to find a new press and sets the matching buffer.

The input layer latches: once a button goes down, it reports held until at least one simulation step has consumed that intent, even if the button was released in between. The frame loop tells the input layer how many steps ran so it can clear the latch.

- **Why**: every step in a display frame receives the same intent. If the intent carried "pressed this frame", a two-step frame would register two presses and could start two combo attacks from one click. Held state is idempotent across repeated steps, and edge detection inside the simulation is deterministic and replayable.
- **Alternative, press events in the intent**: needs the loop to clear them after the first step, which makes the intent differ between steps of one frame and contradicts the existing input spec.

### 4. Step order

```
1. clear events; copy pos to prevPos
2. read intent: detect presses, set buffers          (runs even during hitstop)
3. if hitstop > 0: decrement, count the tick, stop
4. count down cooldowns, combo window, buffers, respawn timers
5. player: try dash -> try attack -> advance the current action -> move
6. resolve hits for an attack in its active phase
7. integrate knockback for every entity
8. separate the player from solid entities (skipped while dashing)
9. count the tick
```

Dash is tried before attack, so pressing both on one step dashes. Buffers count down in step 4, so they do not expire during hitstop.

### 5. Hitstop is a global pause inside the simulation

`SimState.hitstop` counts remaining frozen steps. A landed hit sets it to the larger of its current value and the attack's hitstop.

- **Why**: with one player, a global pause is indistinguishable from freezing attacker and target, and it is a single early return. Because it lives in the simulation, it shifts all later timing identically on every run.
- **Alternative, view-only freeze**: the picture would lag the simulation and inputs during the freeze would land at the wrong time.
- **Alternative, per-entity freeze**: needed once several fights overlap on screen. Revisit in the enemy change if a global freeze feels wrong with many enemies.

### 6. Sector-versus-circle hit test without angles

For a sector with apex `p`, unit direction `u`, range `R`, and half-angle `h`, and a target circle `(c, r)`:

1. If `|c - p| > R + r`, no hit.
2. If `|c - p| <= r`, hit (the apex is inside the target).
3. If `dot(u, (c - p) / |c - p|) >= cos(h)`, hit.
4. Otherwise hit when the distance from `c` to either straight edge of the sector is at most `r`.

`cos(h)` and the two edge directions are computed once when the attack starts. The same `p`, `u`, `R`, and `h` are exposed for the view to draw.

- **Why**: comparing dot products avoids `atan2` and angle wrapping in the per-target test.
- **Alternative, circle-versus-circle hitbox offset in front of the player**: simpler, but does not match a drawn arc at the edges, and readable telegraphs matter more once enemies use the same test.

### 7. Damage goes through one function

`applyHit(state, sourcePos, targetId, { damage, knockback, hitstop })` is the only way health changes. It ignores defeated and invulnerable targets, subtracts health, sets knockback velocity directly away from `sourcePos`, raises hitstop, and emits `hit` and, at zero health, `defeated`. The player's attacks call it; tests call it directly to check dash invulnerability, since nothing in the game damages the player yet.

- **Why**: a single entry point is where the boon change will later attach damage modifiers and on-hit effects.

### 8. Entity changes

`Entity` gains `kind: 'player' | 'dummy'`, `vel` (knockback velocity), `health` and `maxHealth`, `defeated`, `invulnerable`, `solid`, and for dummies `home` and `respawnTicks`. A defeated dummy stays in the entity list with `defeated: true`, so ids are stable for the view, and is restored at `home` when its timer ends.

Knockback moves an entity through the existing `resolveCircle`, so walls and bounds are handled by code that is already tested.

### 9. Dash movement is sub-stepped

A dash covers 17 units per step, more than the player radius of 16. Each step's dash movement is split into segments no longer than half the radius, resolving wall collision after each.

- **Why**: the existing resolver pushes a circle out through the nearest face, which is only correct when the circle has not travelled past the middle of a wall in one move.
- **Alternative, swept circle-versus-rectangle test**: exact for any speed, but more code than three resolver calls per step. Worth doing when fast projectiles arrive.

### 10. Events are returned, not stored

`step` returns the array of events for that step. `advanceFrame` concatenates the arrays of all steps it runs and returns them with the interpolation alpha. Events are not part of `SimState`.

- **Why**: keeping them out of the state keeps the determinism comparison about gameplay state only, and the view cannot miss an event when two steps run in one frame.
- **Trade-off**: `advanceFrame` changes its return type from a number to `{ alpha, events, steps }`, and the scene and its tests are updated accordingly.

### 11. Feedback in the view

- **Swing arc**: a `Graphics` fan built by projecting points along the sector's arc with `project`, so it is the true ground shape under the oblique view. Faint during windup, bright during active.
- **Hit flash**: a per-entity timer in the view, started by a `hit` event.
- **Screen shake**: the view owns a decaying offset. Each frame it first centers the camera on the player with no offset, samples input, steps the simulation, then draws with the offset added. Aim is therefore always computed from an unshaken camera.
- **Dash trail**: a small pool of fading circles dropped at the player's interpolated position while dashing.
- **Health bar**: two rectangles above an entity, shown only when damaged and not defeated.
- **Dummy**: a circle of a different color with a shadow, depth-sorted by ground `y` like the player.

- **Alternative for shake, Phaser's built-in camera shake**: less code, but it is not documented whether it affects pointer-to-world conversion, and the spec requires that aim is unaffected.

## Risks / Trade-offs

- [The default numbers do not feel good] → Expected. They are data in two files; the starting room places dummies beside the spawn point so tuning is immediate. Budget time for tuning after the tasks are done.
- [Global hitstop also freezes knockback of earlier targets and the dash cooldown] → Accepted for a single-target setup; noted under Decision 5 for the enemy change.
- [Held-to-repeat attacks make it easy to overshoot into the finisher's long recovery] → Dash cancels any phase, which is the intended escape. Revisit after playtesting.
- [Existing tests construct `InputIntent` and `Room` literals] → Add a small test helper that fills the new fields, and update the literals in the same task that changes the types.
- [`advanceFrame` latch bookkeeping couples the loop to the input layer] → The loop only returns the step count; the input layer decides what to clear. The simulation stays unaware of latching.
- [Solid dummies can trap the player against a wall] → The player is moved out of dummies after wall resolution, then walls are resolved once more. Dashing passes through, so there is always a way out.

## Open Questions

- Whether a buffered attack should also be allowed to interrupt late recovery (a cancel window), or only start when recovery ends. This change implements the latter; it is a tuning decision to revisit after playing.
- Whether hitstop should be per-entity once several enemies are on screen. Deferred to the enemy change.
