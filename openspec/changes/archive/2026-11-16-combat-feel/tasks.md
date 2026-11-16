# Tasks

## 1. Data and state

- [x] 1.1 Add `data/weapons.ts` with the three attack definitions and extend `data/tuning.ts` with the combo window, input buffer, attack move fraction, dash, knockback, player health, and dummy values from the design; verify `npm run typecheck` passes
- [x] 1.2 Extend `InputIntent` with `attack` and `dash`, add a test helper that builds an intent with defaults, and update existing tests and `NO_INPUT` to use it; verify `npm test` passes with no behavior change
- [x] 1.3 Extend `Entity` with kind `dummy`, knockback velocity, health, maximum health, defeated, invulnerable, solid, home, and respawn timer, and give the player its configured health; verify existing tests pass and a new test reads the player's starting health
- [x] 1.4 Add the `PlayerCombat` state, the `hitstop` counter, and the event types to the simulation, and change `step` to return its events and `advanceFrame` to return `{ alpha, events, steps }`; verify tests cover a quiet step returning no events and two steps in one frame returning the events of both
- [x] 1.5 Update the README's layer and coordinates sections to describe the weapon data file, the event stream, and the new controls; verify the README matches the code

## 2. Rooms and training dummies

- [x] 2.1 Add `dummies` placements to the `Room` type and to the starting room, with at least two near the spawn point; verify it type-checks
- [x] 2.2 Extend `loadRoom` to reject a placement that overlaps a wall, the bounds edge, the player at the spawn point, or another dummy; verify tests cover each rejection with an error naming the placement, and that the starting room loads
- [x] 2.3 Create one dummy entity per placement in `createSim`; verify tests for a room with two placements and a room with none
- [x] 2.4 Add a test that a dummy left alone for 600 steps keeps its position and health; verify it passes

## 3. Health, damage, knockback, and hitstop

- [x] 3.1 Implement `applyHit` reducing health without going below zero and emitting a `hit` event; verify tests for normal damage and overkill
- [x] 3.2 Mark an entity defeated at zero health, emit `defeated`, and make `applyHit` ignore defeated targets; verify tests for the final blow and for hitting a defeated entity
- [x] 3.3 Set knockback velocity away from the source position and integrate it each step with decay and wall resolution; verify tests for direction, coming to rest, a stronger hit travelling farther, and stopping at a wall without overlap
- [x] 3.4 Implement hitstop as an early return in `step` that still counts the tick and still reads input presses; verify tests that nothing moves or advances for the configured steps, that play resumes on the following step, and that a miss causes no pause
- [x] 3.5 Make `applyHit` ignore invulnerable targets with no damage, knockback, or hitstop; verify a test

## 4. Melee combat

- [x] 4.1 Implement the sector-versus-circle test from the design as a pure function; verify tests for a target ahead, behind, beyond range, clipped by the arc's edge, and containing the apex
- [x] 4.2 Implement starting an attack from held input and advancing it through windup, active, and recovery by step counts; verify tests that damage lands on the first active step and never in windup or recovery
- [x] 4.3 Lock the attack direction and the player's facing at attack start; verify tests that changing aim mid-attack moves neither the hit area nor the facing
- [x] 4.4 Record hit target ids per attack so each target is damaged once; verify a test with a target inside the arc for the whole active phase
- [x] 4.5 Implement the combo index and combo window, restarting after the third attack or when the window expires; verify tests for chaining, expiry, and after the finisher, and that the third attack deals its own damage
- [x] 4.6 Implement the attack press buffer and held-to-repeat; verify tests for a press late in recovery, a press too early, holding through recovery, and a press during hitstop
- [x] 4.7 Implement the lunge over the active phase and the reduced move speed while attacking, both through wall collision; verify tests for lunge distance in the open, lunging into a wall, and move speed during windup

## 5. Dash

- [x] 5.1 Implement starting a dash on a new press with direction from move input or facing, and moving the configured distance over the configured steps while ignoring move input; verify tests for distance, both direction rules, and steering being ignored
- [x] 5.2 Sub-step dash movement in segments of at most half the player radius; verify tests that a dash at a 20-unit-thick wall ends on the near face and that a diagonal dash slides along a wall
- [x] 5.3 Implement the cooldown, press-only triggering, and the dash press buffer; verify tests for holding dash for 3 seconds giving one dash, a press early in cooldown doing nothing, and a press late in cooldown firing when it ends
- [x] 5.4 Let a dash start during any attack phase, ending the attack and resetting the combo, and try dash before attack in the step order; verify tests for cancelling out of windup with no hit and for the next attack being the first of the sequence
- [x] 5.5 Set the player invulnerable for the duration of a dash; verify tests applying damage midway through a dash and on the step after it ends

## 6. Solid entities and respawn

- [x] 6.1 Separate the player from solid, undefeated entities after movement, without moving the other entity, then resolve walls once more; verify tests for walking straight into a dummy, sliding around one, and being pressed between a dummy and a wall without overlapping either
- [x] 6.2 Skip separation while dashing and apply it from the step the dash ends; verify tests for dashing through a dummy and for a dash ending inside one
- [x] 6.3 Restore a defeated dummy at its home with full health after the respawn delay; verify tests for respawn timing and for the player being moved out when standing on the placement
- [x] 6.4 Extend the determinism test with recorded attack and dash input against dummies; verify two runs produce identical state and identical event sequences

## 7. Input

- [x] 7.1 Implement press latching as a pure function of button state and steps consumed; verify tests for a click shorter than a step and a tap during a frame with no step
- [x] 7.2 Bind the left mouse button to attack and Space to dash in the device input, feed the step count from `advanceFrame` back to clear latches, and release both on focus loss; verify in the browser that single clicks always produce an attack and that switching windows while holding the button stops attacking
- [x] 7.3 Prevent the browser's default action for Space and for the context menu over the game; verify in the browser that pressing Space does not scroll the page

## 8. View

- [x] 8.1 Draw each dummy as a distinct placeholder shape with a shadow, depth-sorted by ground position, hidden while defeated; verify in the browser that dummies appear in the starting room, sort correctly against the player, and disappear and reappear around a defeat
- [x] 8.2 Draw the swing arc from the exposed attack direction, range, and angle using `project`, faint in windup and bright in the active phase; verify with a test of the arc point generator that its end points lie on the sector's edges, and in the browser that a dummy touching the drawn arc is hit
- [x] 8.3 Add the hit flash and the health bar, driven by `hit` events and exposed health; verify in the browser that a dummy flashes when hit and its bar reflects remaining health and is hidden at full health
- [x] 8.4 Add screen shake as a view-owned decaying offset applied after input is sampled, scaled by the hit's hitstop; verify in the browser that the facing angle is unchanged during a shake with the cursor still, and that the finisher shakes harder
- [x] 8.5 Add the dash trail and dash tint; verify in the browser that a trail marks the dash path and fades
- [x] 8.6 Show the current action, combo index, and dash cooldown on the debug overlay; verify the values change as expected while playing

## 9. Integration check

- [x] 9.1 Run `npm run typecheck`, `npm test`, and `npm run build`; verify all three succeed
- [x] 9.2 Play the built game with `npm run preview`: complete the three-attack combo on a dummy, defeat it, watch it reappear, dash through it, and cancel an attack with a dash; verify there are no console errors
- [x] 9.3 Confirm the simulation boundary test still passes and that no file in `src/sim` imports from `src/view` or `src/input`; verify with `npm test`
- [x] 9.4 Run `openspec validate combat-feel --strict`; verify it reports no errors
