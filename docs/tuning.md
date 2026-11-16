# Tuning

Every number that shapes how the game feels is data. Change a value, save, and the dev server reloads.

Durations are in simulation steps (60 per second). Distances are in world units, which are screen pixels horizontally. Speeds are in world units per second.

## Attacks: `src/data/weapons.ts`

`WEAPON` is an array of three attack definitions, performed in order.

| Field | Meaning | Attacks 1 and 2 | Finisher |
|---|---|---|---|
| `windup` | Steps before the attack can hit | 4 | 7 |
| `active` | Steps during which it can hit | 3 | 4 |
| `recovery` | Steps before the player can act again | 8 | 14 |
| `damage` | Health removed | 20 | 40 |
| `knockback` | Speed given to the target | 380 | 720 |
| `range` | Radius of the hit arc | 72 | 84 |
| `angle` | Full opening angle of the arc | 110° | 150° |
| `lunge` | Distance moved forward during the active phase | 10 | 18 |
| `hitstop` | Steps the game pauses on a hit | 3 | 6 |

Adding a fourth entry makes the combo four attacks long; the code reads the array's length.

## Everything else: `src/data/tuning.ts`

### Movement

| Value | Default | Meaning |
|---|---|---|
| `moveSpeed` | 260 | Player speed |
| `playerRadius` | 16 | Player collision radius |
| `attackMoveFraction` | 0.3 | Share of move speed available while attacking |

### Combo and input

| Value | Default | Meaning |
|---|---|---|
| `comboWindow` | 20 | Steps after an attack ends in which the next one continues the combo |
| `inputBuffer` | 8 | Steps an early attack or dash press is remembered |
| `aimDeadzone` | 1 | Cursor distance from the player below which aim keeps its last angle |

### Dash

| Value | Default | Meaning |
|---|---|---|
| `dashDistance` | 170 | Distance covered |
| `dashDuration` | 10 | Steps the dash lasts |
| `dashCooldown` | 24 | Steps after a dash ends before another can start |

### Damage

| Value | Default | Meaning |
|---|---|---|
| `playerHealth` | 100 | Player maximum health |
| `knockbackDecay` | 0.85 | Knockback speed is multiplied by this each step |
| `knockbackStopSpeed` | 5 | Knockback ends below this speed |

### Training dummies

| Value | Default | Meaning |
|---|---|---|
| `dummyHealth` | 200 | Maximum health |
| `dummyRadius` | 20 | Collision radius |
| `dummyRespawn` | 120 | Steps after defeat before reappearing |

### View and timing

| Value | Default | Meaning |
|---|---|---|
| `depthRatio` | 0.6 | Vertical compression of depth in the oblique view |
| `wallHeight` | 48 | Drawn height of walls |
| `viewWidth`, `viewHeight` | 1280, 720 | Game resolution |
| `stepRate` | 60 | Simulation steps per second |
| `maxStepsPerFrame` | 5 | Most steps run in one display frame |

Changing `stepRate` changes the length of a step, so every duration in steps changes with it. Leave it alone unless you intend to re-tune everything.

## Feedback: top of `src/view/GameScene.ts`

These affect only what is drawn, never the simulation.

| Constant | Default | Meaning |
|---|---|---|
| `FLASH_SECONDS` | 0.12 | How long a hit target stays white |
| `SHAKE_PER_HITSTOP_STEP` | 2.2 | Shake pixels per step of hitstop |
| `SHAKE_DECAY_PER_SECOND` | 14 | How fast shake fades |
| `TRAIL_SECONDS` | 0.25 | How long a dash trail ghost lasts |
| `TRAIL_POOL` | 16 | Most trail ghosts on screen |
| `COLORS` | | Every placeholder color |

## What to change for a given feel

| If it feels... | Try |
|---|---|
| Sluggish to start an attack | Lower `windup` |
| Punishing after a swing | Lower `recovery`, or rely on dash cancel |
| Hard to keep a combo going | Raise `comboWindow` |
| Like presses are being ignored | Raise `inputBuffer` |
| Weightless on impact | Raise `hitstop`, `knockback`, or `SHAKE_PER_HITSTOP_STEP` |
| Stuttery on impact | Lower `hitstop` |
| Hard to reach targets | Raise `range`, `angle`, or `lunge` |
| Like you slide on ice while attacking | Lower `attackMoveFraction` |
| Dash too short or too slow | Raise `dashDistance`; lower `dashDuration` for speed |
| Dash too spammable | Raise `dashCooldown` |
| Targets fly too far | Lower `knockback`, or lower `knockbackDecay` so they stop sooner |

## A way to tune

1. Run `npm run dev` and stand next to the dummies by the spawn point.
2. Change one value at a time.
3. Watch the debug overlay: it shows the current action, the phase and steps left, the next combo attack, the dash cooldown, and hitstop.
4. Run `npm test` before committing. Most tests read values from the data files, so they follow your changes. Some place a target at a fixed distance that assumes roughly the default ranges, so a large change to `range` or the radii can fail a test without anything being wrong.

## Constraints to keep in mind

- **Fast movement and thin walls.** Dash and knockback are split into small segments so they cannot pass through walls. Ordinary movement is not, so keep the distance moved per step (`moveSpeed / 60`, about 4.3) well under `playerRadius`.
- **Hitstop is global.** It pauses everything, including the dash cooldown and other targets' knockback. Long hitstop values will feel worse once there are many enemies.
- **Buffer versus recovery.** If `inputBuffer` is longer than an attack's `recovery`, a press during the active phase will still chain. That may or may not be what you want.
