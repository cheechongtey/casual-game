# Decisions

The choices that shape the project, each with its reason and what was turned down. Full reasoning is in the `design.md` of the change that made it, under `openspec/changes/archive/`.

Add an entry when a decision would be expensive to reverse or would surprise someone reading the code.

## Stack

### Phaser 4 with TypeScript and Vite

- **Why:** input, audio, scenes, and rendering are included; the web build is small; iteration is fast.
- **Turned down:** PixiJS with a hand-built engine (too much to rebuild), Godot's web export (heavy download, no TypeScript), smaller TypeScript engines (less proven for this kind of game).
- **Cost accepted:** Phaser 4's plugin and tutorial ecosystem is thinner than Phaser 3's. The project uses no plugins and pins an exact version.

### No Phaser physics

- **Why:** Phaser's physics lives inside the renderer. Using it would put gameplay state in the view and make it untestable without a browser.
- **Instead:** circle-versus-rectangle collision in `src/sim`.

## Structure

### Simulation separate from view

- **Why:** combat and, later, enemy behavior and upgrades can be tested in Node, replayed from a seed, and reasoned about without a frame loop.
- **Turned down:** game logic inside Phaser game objects. Faster to start, but it ties rules to scene lifecycle and needs a browser to test.
- **Enforced by:** a test that fails if `src/sim` imports Phaser, touches browser globals, or uses unseeded randomness.

### Plain objects and functions, not an entity-component library

- **Why:** there are tens of entities, not thousands. Plain data is easier to inspect and compare in tests.
- **Revisit if:** entity counts grow by orders of magnitude.

### Fixed 60 Hz timestep

- **Why:** results do not depend on frame rate, and combat timing can be authored as whole numbers of steps.
- **Turned down:** variable time steps, which make collision and attack windows frame-rate dependent.
- **Detail:** at most five steps per display frame; extra time is discarded so a stall cannot cause a burst.

### Events are returned from `step`, not stored in state

- **Why:** the state stays purely about gameplay, so comparing two runs compares only what matters, and the view cannot miss an event when two steps run in one frame.

## View

### 3/4 oblique view, with the simulation flat

- **Why:** it reads as having depth without the costs of diamond-tile isometric: eight-direction art, awkward input mapping, and collision in a skewed space.
- **How:** all rules run in flat world coordinates. One function projects to the screen; one reverses it.
- **Consequence:** a move to true isometric later changes one file and the art.

### Placeholder shapes first

- **Why:** animation is the largest cost in this genre, and feel can be judged without it.
- **Consequence:** facing is a continuous angle, attack timing is data, and attack visuals are drawn arcs. None of it depends on sprite frames.

### The drawn arc is the hit area

- **Why:** what the player sees must be what can hit. The view projects the same sector the simulation tests.
- **Turned down:** a circular hitbox offset in front of the player. Simpler, but it does not match a drawn arc at its edges.

### Screen shake is owned by the view and applied after input is sampled

- **Why:** aim is computed from the camera. If shake moved the camera before sampling, the aim would jitter.

## Input

### The simulation sees an abstract intent

- **Why:** keyboard and mouse are one mapping among several. A gamepad later is a new mapping, not a change to the rules.

### Intent carries "held", and the simulation finds presses

- **Why:** every step in a display frame gets the same intent. A "pressed" flag repeated across two steps would start two attacks from one click. "Held" is safe to repeat, and detecting the press inside the simulation keeps it deterministic.
- **Paired with:** the input layer latching a press until a step has seen it, so a click shorter than a step is never lost.

### Mouse aim, measured in world space

- **Why:** the view compresses the vertical axis, so an angle measured on screen is wrong. The cursor is converted back to a ground point first.

## Combat

### Timing and values are data

- **Why:** tuning is the main work in this genre, and upgrades will later change these values at run time.
- **Where:** `src/data/weapons.ts` and `src/data/tuning.ts`.

### The player's action is one tagged union

- **Why:** idle, attacking, and dashing are mutually exclusive. One value that can only be one of them rules out impossible combinations.

### Dash is tried before attack, and cancels any attack phase

- **Why:** the dash is the escape. It has to work from anywhere, including the finisher's long recovery.
- **Cost accepted:** cancelling restarts the combo.

### Holding attack repeats; dash needs a new press

- **Why:** holding to attack is easier on the hand. A held dash that re-fired on cooldown would make movement unpredictable.

### Hitstop pauses the whole simulation

- **Why:** with one player and one target at a time, a global pause looks the same as freezing just the two involved, and it is a single early return in `step`.
- **Revisit when:** several enemies are fighting at once.

### Health changes in one function

- **Why:** `applyHit` is the single place where damage, knockback, hitstop, defeat, and their events are decided. Upgrades that alter damage will attach there.

### Fast movement is sub-stepped

- **Why:** the wall resolver is only correct while a circle has not crossed the middle of a wall in a single move. A dash moves farther per step than the player's radius.
- **Turned down for now:** an exact swept test. More code than a few resolver calls; likely needed for projectiles.

### Dummies are solid, but a dash passes through

- **Why:** solid targets make positioning matter. Passing through on a dash gives a guaranteed way out when pressed against a wall.

## Process

### One OpenSpec change per system

- **Why:** each change stays small enough to review and to play before the next one starts.
- **Order:** see [roadmap.md](roadmap.md).

### Each task states how it is verified

- **Why:** a task is only done when its behavior is shown to work, by a test or by a named check in the browser.
