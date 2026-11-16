# Roguelite Action

A browser-based roguelite action game in a 3/4 oblique view, built with TypeScript, Phaser 4, and Vite. Planning lives in `openspec/`.

The current build is a combat test bed: a player who can move, aim, attack in a three-hit combo, and dash inside one walled room with training dummies.

## Controls

- **W A S D**: move
- **Mouse**: aim
- **Left mouse button**: attack (hold to keep attacking)
- **Space**: dash

## Scripts

Requires Node.js.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build
```

```bash
npm run preview
```

## Layers

```
src/
  sim/    game rules in plain TypeScript: state, step, collision, rng, room validation,
          player actions (attack, dash), damage, knockback, hit-area test
  data/   room definitions, tuning constants, and weapons.ts (the combo's attack values)
  input/  device state -> InputIntent, with press latching so brief clicks are not lost
  view/   Phaser scene, projection, drawing, camera, combat feedback
  main.ts Phaser game config and boot
tests/    Vitest tests, run in Node with no browser
```

Combat values are data: each attack's phase durations, damage, knockback, hit range and angle, lunge, and hitstop live in `src/data/weapons.ts`; dash, buffering, knockback decay, and dummy values live in `src/data/tuning.ts`.

`step` returns the gameplay events of that step (`attackStart`, `dashStart`, `hit`, `defeated`), and `advanceFrame` returns `{ alpha, events, steps }` with the events of every step run in the frame. Events are not part of the simulation state. The view reacts to events (hit flash, screen shake) and otherwise only reads state; the input layer uses `steps` to clear latched presses.

The dependency rule is one-way: `view` and `input` may import from `sim` and `data`; `sim` imports only from `data`.

`src/sim` must not import Phaser, touch browser globals, or use unseeded randomness or wall-clock time. `tests/sim-core.test.ts` enforces this, which keeps gameplay deterministic and testable without a browser.

## Coordinates

- World space is flat: `x` to the right, `y` toward the bottom of the screen, `z` height above ground.
- Angles are radians from the positive x axis, so up-screen is a negative angle.
- `src/view/projection.ts` is the only place world coordinates become screen coordinates, and the only place they are converted back.
- The simulation advances in fixed steps of 1/60 second, whatever the display frame rate.
- All combat timing (attack phases, combo window, input buffer, dash duration and cooldown, hitstop, respawn) is counted in simulation steps.
- `InputIntent.attack` and `InputIntent.dash` mean "held"; the simulation detects new presses itself by comparing with the previous step.
