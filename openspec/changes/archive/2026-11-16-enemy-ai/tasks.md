# Tasks

## 1. Data and state

- [x] 1.1 Add `src/data/enemies.ts` with the chaser definition from the design (reusing `AttackDef` for its attack), add the attacker limit and restart delay to `data/tuning.ts`, and add a chaser table and the two new rows to `docs/tuning.md`; verify `npm run typecheck` passes and the doc's values match the files
- [x] 1.2 Extend `Entity` with kind `chaser`, `ai`, `hitstop`, and `respawnDelay`, set them in `createEntity`, and make `applyHit` use `respawnDelay` in place of the dummy constant; verify existing tests pass and a new test reads a dummy's respawn delay and null `ai`
- [x] 1.3 Add `enemies` placements to the `Room` type, give the `room()` test helper a fourth parameter, and add an empty list to the starting room and to room literals in tests; verify `npm test` passes with no behavior change

## 2. Per-entity hitstop

- [x] 2.1 Remove `SimState.hitstop`; make `applyHit` raise the target's `hitstop` and, when a source id is given, the source's; in `step`, count the counters down and skip a frozen player's timers, action, and movement and a frozen entity's knockback, while still reading presses; update the existing hitstop tests to read the entity counters; verify they pass with their step counts unchanged
- [x] 2.2 Add tests that a second dummy already moving from knockback keeps moving while the player and their target are paused, that a hit with no source pauses only its target, and that a paused entity can still be hit; verify they pass
- [x] 2.3 Show the player's own hitstop on the debug overlay, and update the hitstop sections of `docs/combat.md`, `docs/tuning.md` (constraints), `docs/architecture.md` (state and step order), and the hitstop entry in `docs/decisions.md`; verify in the browser that hitting a dummy still pauses the player and the dummy for the same time as before, and that no doc still says the whole simulation pauses

## 3. Rooms and placement

- [x] 3.1 Extend `loadRoom` to reject an enemy placement that overlaps a wall, the bounds edge, the player at the spawn point, a dummy, or another enemy, and to copy placements into the loaded room; verify tests cover each rejection with an error naming the placement
- [x] 3.2 Create one chaser per placement in `createSim`, at full health with `ai` idle; verify tests for a room with two placements and a room with none
- [x] 3.3 Place at least four chasers in the starting room, each beyond its notice range from the spawn point and clear of the L-shaped corner, with at least three close enough together to fight at once; update the room section of `docs/development.md`; verify a test of the starting-room scenario passes and the starting room loads

## 4. Chaser movement

- [x] 4.1 Add `src/sim/enemy.ts` with the idle and pursue states and noticing by distance, called from `step` in the order the design gives; verify tests that a chaser stays put for 600 steps with the player far away, starts moving when the player comes within notice range, and keeps pursuing when the player retreats
- [x] 4.2 Implement pursuit: move toward the player at the configured speed through wall collision, face the player, and stop advancing at the attack distance; verify tests for distance closed in 60 steps, stopping without overlapping the player, and the facing angle
- [x] 4.3 Implement the blocked check and the sideways detour, with the first side taken from the slide direction or the seeded generator; verify tests that a chaser reaches attack distance around a 100 by 100 pillar within 600 steps and around a 300 by 60 wall within 900 steps, never overlapping the wall
- [x] 4.4 Implement enemy separation after movement: out of the player and dummies with only the enemy moving, enemy pairs pushed apart, then walls; verify tests that two chasers converging on a standing player come to rest without overlapping, that a standing player is not moved by an arriving chaser, and that a dummy in the path is neither moved nor overlapped
- [x] 4.5 Reset `ai` to idle and `hitstop` to 0 when an entity is restored after its respawn delay; verify tests that a defeated chaser reappears at its placement with full health after the delay and stays idle until it notices the player again

## 5. Chaser attacks

- [x] 5.1 Implement starting an attack when ready (pursuing, within attack distance, cooldown elapsed) and advancing it through windup, active, and recovery, with no self-movement in windup or recovery and the lunge over the active phase; verify tests for the phase step counts, standing still through windup, and the lunge distance in the open
- [x] 5.2 Lock the attack direction and the chaser's facing when the attack starts; verify tests that a player who sidesteps out of the sector during windup is not hit and that facing stays on the attack direction until the attack ends
- [x] 5.3 Resolve enemy attacks in their active phase against the player only, through `makeSector` and `applyHit` with the enemy as source, once per attack; verify tests that the player takes the configured damage on the first active step and none in windup or recovery, takes it exactly once when staying in the arc, takes none while dashing, and that another chaser and a dummy inside the arc are unharmed
- [x] 5.4 Add tests for what an enemy hit does to the player: the hit event names the player, the player and that enemy are paused for the hit's hitstop and can move again on the following step, the player is knocked away from the enemy, and the player's attack in progress is not ended; verify they pass
- [x] 5.5 Implement the attacker limit as the three-pass enemy update from the design, granting by longest wait and then entity id; verify tests that with four chasers in reach and a limit of 2 no step has more than two in windup or active, and that a waiting chaser starts no later than the step after a place frees up
- [x] 5.6 Implement the attack cooldown, started when an attack ends; verify a test that the next attack starts no sooner than the cooldown after the previous one ended while the player stays in reach
- [x] 5.7 Implement stagger: a hit on an entity with `ai` ends its attack and sets the stagger state, which counts down only while not frozen and ends in pursuit; verify tests for a hit during windup causing no damage to the player, a staggered chaser moving only by knockback and starting no attack, pursuit resuming when stagger ends, an idle chaser hit from beyond notice range pursuing afterwards, an interrupted attacker freeing its place for a waiting one, and a chaser defeated during windup dealing no damage
- [x] 5.8 Add `enemyAttackAreas` exposing each attacking enemy's id, phase, windup progress, apex, direction, range, and angle; verify tests for a chaser halfway through windup and for a pursuing chaser having no area
- [x] 5.9 Add a determinism test with chasers and recorded move, attack, and dash input that exercises enemy hits on the player and a detour; verify two runs produce identical state and identical event sequences
- [x] 5.10 Add `docs/enemies.md` describing the chaser's states, steering, attack, attacker limit, stagger, and respawn, link it from `docs/README.md`, add the enemy module, entity kind, and step order to `docs/architecture.md`, record the steering and attacker-limit choices in `docs/decisions.md`, and add the new test files to the table in `docs/development.md`; verify each doc matches the code

## 6. Defeat and restart

- [x] 6.1 Return early from `step` while the player is defeated, counting the tick only; verify tests that the step of the final hit reports the defeat, that 120 later steps with move, attack, and dash held change no position or health and report no events, and that another chaser's windup does not progress
- [x] 6.2 Add a pure function in `src/view` that says whether a restart press is accepted given the seconds since defeat, and a test that a fresh `createSim` with the same seed and room equals the initial state; verify tests for a press at 0.1 seconds being refused and one after the delay being accepted
- [x] 6.3 Report from `DeviceInput` whether any new key or mouse press arrived this frame, track seconds since defeat in `GameScene`, and restart the scene on an accepted press; verify in the browser that clicking at the moment of defeat does not restart, that a button held through the delay does not restart until pressed anew, that a key and a mouse button each restart after the delay with the player, dummies, and chasers back at their starting places and health, and that no key restarts during play
- [x] 6.4 Update the health row and the death-screen row in `docs/game-design.md`, the damage section of `docs/combat.md` (what damages the player, defeat, restart), and record the scene-restart choice in `docs/decisions.md`; verify each matches the behavior checked in 6.3

## 7. View

- [x] 7.1 Draw each chaser as a red placeholder shape with a facing marker and a shadow, depth-sorted by ground position, using the existing flash, health bar, and hide-when-defeated drawing; verify in the browser that chasers appear in the starting room, turn to face the player, sort correctly against the player, flash when hit, and disappear and reappear around a defeat
- [x] 7.2 Draw enemy telegraphs from `enemyAttackAreas` with `arcPoints` and `project`, in red, with opacity from a pure function of phase and windup progress; verify with a test that the opacity rises through windup, is highest in the active phase, and is zero in recovery, and in the browser that standing just inside the drawn shape is hit and just outside is not
- [x] 7.3 Add the player health display in the lower left with its fill width from a pure function, and stop drawing the floating bar over the player; verify with a test of the fill for full, 70 percent, and zero health, and in the browser that the display reads the right numbers, stays put while the camera follows and shakes, and that no bar appears over a damaged player
- [x] 7.4 Show the defeat message over a dimmed view while the player is defeated, adding the restart line once the delay has passed; verify in the browser that both lines appear at the right times and that neither is shown after a restart
- [x] 7.5 Show the number of enemies currently in windup or active on the debug overlay; verify in the browser that it never exceeds the attacker limit while fighting the group
- [x] 7.6 Update the feedback table in `docs/combat.md`, the view constants in `docs/tuning.md`, the interface and enemy marks in `docs/game-design.md`, the README's description of the current build, and `docs/roadmap.md` (status of this change, the two open questions it settles, known gaps); verify each matches the game as played

## 8. Integration check

- [x] 8.1 Run `npm run typecheck`, `npm test`, and `npm run build`; verify all three succeed
- [x] 8.2 Play the built game with `npm run preview`: tune a combo on a dummy with no chaser interfering, approach the group, watch at most two telegraphs at once, dodge a swing by walking and another by dashing through it, interrupt a windup with a hit, defeat a chaser, be defeated, and restart; verify there are no console errors
- [x] 8.3 Confirm the simulation boundary test still passes and that no file in `src/sim` imports from `src/view` or `src/input`; verify with `npm test`
- [x] 8.4 Run `openspec validate enemy-ai --strict`; verify it reports no errors

## Workflow follow-up

- Archive the change once it has been played and the numbers feel right enough to build on.
- When archiving, sync the spec deltas into `openspec/specs/` so the main specs keep describing the game as built.
