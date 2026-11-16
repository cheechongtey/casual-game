# Design

## Context

The repository contains only the OpenSpec scaffold; there is no source code, package manifest, or build setup. See proposal.md for motivation and scope, and the five spec deltas for required behavior.

Constraints that shape the approach:

- Later changes (combat, enemy AI, upgrades) need deterministic, headless-testable gameplay logic.
- Art is placeholder shapes now and free asset packs later, so nothing in gameplay may depend on sprite frames or a fixed number of facing directions.
- The view is 3/4 oblique. A move to true isometric later should not require touching gameplay code.
- Phaser 4.2.1 is the current release. Its ecosystem of plugins and examples is thinner than Phaser 3's.

## Goals / Non-Goals

**Goals:**

- A simulation layer that imports nothing from Phaser and runs under Vitest in Node.
- One place where world coordinates become screen coordinates, and one place where they are converted back.
- Interfaces (entity state, input intent, room definition) that later changes extend without restructuring.
- A build that starts with one command and shows a controllable player in a walled room.

**Non-Goals:**

- A general entity-component-system framework.
- A level editor pipeline. Rooms are hand-written data for now.
- Cross-browser bit-identical determinism. Same-build, same-machine reproducibility is the target.
- Any asset loading pipeline beyond what Phaser needs to boot.

## Decisions

### 1. Three layers with a one-way dependency

```
src/
  sim/      plain TypeScript: state, step function, collision, rng, room validation
  data/     room definitions and tuning constants
  input/    device state -> InputIntent (needs the inverse projection)
  view/     Phaser scene, projection, drawing, camera
  main.ts   Phaser game config and boot
```

`view` and `input` may import from `sim` and `data`; `sim` imports only from `data`. A Vitest test scans `src/sim` and fails if any file imports `phaser`, references `window` or `document`, or calls `Math.random` or `Date.now`.

- **Why**: this boundary is what makes the simulation testable and the renderer replaceable. A test enforces it without adding a linter dependency.
- **Alternative, logic inside Phaser game objects**: faster to start, but gameplay then needs a browser to test and becomes tied to scene lifecycle.
- **Alternative, ESLint `no-restricted-imports`**: equivalent protection, but adds a toolchain this change does not otherwise need.

### 2. Plain objects and system functions, not an ECS library

Simulation state is one object: `{ tick, rng, room, entities }`. An entity is a plain object with `id`, `kind`, `pos`, `prevPos`, `z`, `facing`, and `radius`. `step(state, intent)` calls system functions in a fixed order: copy `pos` to `prevPos`, apply movement, resolve collision, increment `tick`.

- **Why**: the slice will have tens of entities, so an ECS library's performance model buys nothing, and plain objects are easier to inspect in tests.
- **Alternative, bitecs**: worth reconsidering only if entity counts reach the thousands.

### 3. Fixed timestep driven by an accumulator

The Phaser scene's `update(time, delta)` adds `delta` to an accumulator, runs `step` while the accumulator holds at least 1/60 s (at most 5 times), drops any remainder beyond the cap, and passes `alpha = accumulator / stepDuration` to the view for interpolation.

- **Why**: frame-rate-independent results, and combat timings in later changes can be authored in ticks.
- **Alternative, variable delta**: simpler, but makes collision and later attack windows depend on frame rate and breaks determinism.

### 4. Own collision instead of Arcade Physics

The player is a circle; walls are axis-aligned rectangles. Each step moves the circle, then resolves overlaps by pushing it out along the shortest vector from the closest point on each rectangle, repeated up to 3 passes, then clamps it to the room bounds. Sliding and corner rounding fall out of this without special cases. Step distance (about 4 units at 260 units/s) is well below the player radius (16), so no swept test is needed.

- **Why**: Arcade Physics lives inside Phaser, so using it would put gameplay state in the view layer and remove headless testing.
- **Alternative, Arcade Physics for walls only**: less code now, but splits the source of truth for position between two systems.
- **Trade-off**: fast projectiles in a later change will need a swept or sub-stepped test.

### 5. Seeded generator owned by the simulation state

A small 32-bit generator (mulberry32) lives in the state and is the only source of randomness in `sim`. Movement does not use it yet; it is included now because determinism is specified here and retrofitting a generator is error-prone.

### 6. Coordinates, angles, and the projection

- World space is flat: `x` to the right, `y` increasing toward the bottom of the screen, `z` height above ground. One world unit is one screen pixel horizontally at zoom 1.
- Angles are radians from the positive x axis, computed with `atan2(dy, dx)` in world space. "Up-screen" is negative `y`.
- `project(x, y, z) = (x, y * DEPTH_RATIO - z)` with `DEPTH_RATIO = 0.6`. `unprojectGround(sx, sy) = (sx, sy / DEPTH_RATIO)`.
- Both functions live in one view module. Input uses `unprojectGround` on the cursor's camera-space position so the aim angle is correct in world space.

- **Why**: a single function pair is the seam for a later isometric projection.
- **Alternative, draw top-down and scale the camera vertically**: also squashes sprites and text, and cannot express height.

### 7. Drawing and depth order

- Ground and shadows sit on fixed low depths. Walls and entities use Phaser depth equal to their ground `y` (for a wall, the `y` of its front edge), so the engine's own sort produces the required order.
- A wall is drawn with Phaser `Graphics` as a top face (projected footprint lifted by a constant wall height) plus a darker front face.
- The player is a filled circle with a short line showing facing, plus an ellipse shadow.
- The camera follows the player's projected ground point and is bounded to the projected room rectangle. A room smaller than the viewport is centered.
- The game renders at 1280x720 and scales to fit the window.

### 8. Rooms as typed data with a validator

A room is a TypeScript object: `{ id, width, height, walls: Rect[], spawn: Vec2 }`. `loadRoom` in `sim` validates it and throws an error naming the offending wall or the spawn point.

- **Why**: one room does not justify an editor pipeline, and typed data gives compile-time checks.
- **Alternative, LDtk or Tiled now**: appropriate once the room-flow change needs many rooms; the validator and the `Room` type stay as the import target.

### 9. Input sampled once per display frame

An input module tracks key state from Phaser keyboard events and the pointer position, clears keys on window blur, and produces one `InputIntent { moveX, moveY, aim }` per display frame. That same intent is passed to every simulation step run in the frame.

- **Why**: device events arrive per frame, not per tick. A single intent type is also the hook for recording and replaying inputs in tests, and for a gamepad mapping later.

### 10. Tuning values

Defaults, kept together in `data/tuning.ts`: move speed 260 units/s, player radius 16, depth ratio 0.6, wall height 48. These are starting points and can change without affecting the specs.

## Risks / Trade-offs

- [Phaser 4 APIs differ from what the tasks assume] → The view layer is small and isolated; check each Phaser call against the 4.2.1 documentation while implementing. If a blocker appears, Phaser 3.90 is a drop-in fallback for this amount of view code.
- [Floating-point results differ between browsers, so replays are not portable] → Determinism is specified per build and machine. Movement uses only addition, multiplication, and `sqrt`, which are exactly specified; `atan2` is used only for aim, which comes from input.
- [The layering feels heavy for a single moving circle] → Accepted. The cost is paid once here so combat and AI can be tested headlessly from their first task.
- [Depth sorting by a single `y` breaks for long diagonal or very tall objects] → Rooms use axis-aligned walls only. Revisit if later art needs large irregular props.
- [Interpolation shows the player up to one tick behind the simulation] → About 16 ms, the normal cost of a fixed timestep. Facing is not interpolated; the view draws the latest simulated facing angle.

## Open Questions

- Which editor (LDtk or Tiled) to adopt for room authoring. Deferred to the room-flow change.
- Whether mouse aim should later be complemented by a gamepad mapping. It does not affect this change because the simulation only sees `InputIntent`.
