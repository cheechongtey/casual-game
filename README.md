# Roguelite Action

A browser-based roguelite action game in a 3/4 oblique view, built with TypeScript, Phaser 4, and Vite. Planning lives in `openspec/`.

The current build is the core loop skeleton: a player you can move and aim inside one walled room.

## Controls

- **W A S D**: move
- **Mouse**: aim

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
  sim/    game rules in plain TypeScript: state, step, collision, rng, room validation
  data/   room definitions and tuning constants
  input/  device state -> InputIntent
  view/   Phaser scene, projection, drawing, camera
  main.ts Phaser game config and boot
tests/    Vitest tests, run in Node with no browser
```

The dependency rule is one-way: `view` and `input` may import from `sim` and `data`; `sim` imports only from `data`.

`src/sim` must not import Phaser, touch browser globals, or use unseeded randomness or wall-clock time. `tests/sim-core.test.ts` enforces this, which keeps gameplay deterministic and testable without a browser.

## Coordinates

- World space is flat: `x` to the right, `y` toward the bottom of the screen, `z` height above ground.
- Angles are radians from the positive x axis, so up-screen is a negative angle.
- `src/view/projection.ts` is the only place world coordinates become screen coordinates, and the only place they are converted back.
- The simulation advances in fixed steps of 1/60 second, whatever the display frame rate.
