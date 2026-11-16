# Tasks

## 1. Exits in room data

- [ ] 1.1 Add `exits: Rect[]` to `Room` in `src/data/room.ts`, give the existing room an empty list, copy exits in `loadRoom`, and add an `exits` parameter defaulting to `[]` to `room()` in `tests/helpers.ts`; verify `npm run typecheck` and `npm test` pass with no test changed in meaning
- [ ] 1.2 Validate exits in `loadRoom` (smaller than the player's diameter, outside the bounds, not touching a bounds edge, overlapping a wall or another exit, overlapping the spawn circle or a dummy or enemy placement), each error naming the exit by index; verify new tests in `tests/rooms.test.ts` cover every scenario of "Invalid exits are rejected" plus a room with two valid exits loading
- [ ] 1.3 Describe exits in the room data section of `docs/architecture.md`; verify the doc matches the `Room` interface

## 2. Chasers stay defeated

- [ ] 2.1 Remove `respawnDelay` from `CHASER`, create chasers with `home: null` and a respawn delay of 0, and leave dummy respawn untouched; verify a new test that a defeated chaser is still defeated after 1200 steps, and that the existing dummy respawn tests in `tests/solids.test.ts` still pass
- [ ] 2.2 Replace the chaser respawn test in `tests/enemy-movement.test.ts` and any other use of `CHASER.respawnDelay`; verify `npm test` passes and a search for `CHASER.respawnDelay` finds nothing
- [ ] 2.3 Update `docs/enemies.md` and the "No room clearing" known gap in `docs/roadmap.md` to say chasers no longer reappear; verify each doc matches the code

## 3. Room phase and exits in the simulation

- [ ] 3.1 Add `phase: 'fighting' | 'cleared' | 'left'` and `solids: Rect[]` to `SimState`, set them in `createSim` (cleared when the room has no enemy placements; solids are walls plus exits while fighting), and switch `resolveCircle`, `moveCircle` and chaser steering to read the solids list; verify existing movement, dash, solids and enemy tests pass unchanged
- [ ] 3.2 Add `roomCleared` and `exitReached` (with exit index) to `SimEvent`, and at the end of `step` clear the room when every entity with `ai` is defeated, rebuilding solids without the exits; verify a new `tests/room-clearing.test.ts` covers the scenarios of "Room phase" and "Clearing is reported once", including dummies not holding a room and a room without enemies starting cleared with no event
- [ ] 3.3 Verify with tests that a closed exit stops a walking and a dashing player, and that after clearing the player's circle can overlap the exit
- [ ] 3.4 Report `exitReached` and set the phase to `'left'` when the room is cleared and the player's centre is inside an exit, and return early from `step` while the phase is `'left'`; verify tests for reaching the exit, overlapping it without the centre inside, the second of two exits being named, and 60 held-input steps after leaving changing nothing and reporting nothing
- [ ] 3.5 Update tests that defeat every chaser in a room and assert exact event lists, so they account for `roomCleared`; verify `npm test` passes
- [ ] 3.6 Add the room phase, solids, the new events and the new end-of-step order to `docs/architecture.md`, and record the exits-as-a-list and solid-rectangle decisions in `docs/decisions.md`; verify each doc matches the code

## 4. Entering a room with given health

- [ ] 4.1 Add the optional `enter` argument to `createSim`, defaulting to maximum health and throwing a descriptive error for a value of zero or less or above the maximum; verify tests in `tests/state.test.ts` for stated health, no stated health, and both invalid values
- [ ] 4.2 Extend the determinism test to replay 600 recorded intents with an entering health of 60; verify the two final states are identical

## 5. The run

- [ ] 5.1 Create `src/sim/run.ts` with the `Run` state, `createRun(seed, sequence)` rejecting a sequence containing a room with no exits, the room seed derivation, `enterRoom`, and `leaveRoom`; verify a new `tests/run.test.ts` covers the missing-exit error, equal room seeds for equal run seeds, different seeds for different rooms, health of 60 carrying into the next room, the player being idle with no dash cooldown after leaving mid-dash, and the status becoming complete after the last room
- [ ] 5.2 Add a whole-run replay test that plays the first two rooms twice from the same run seed with the same recorded inputs and compares final state; verify it passes and that the sim-boundary test still passes with `run.ts` in `src/sim`
- [ ] 5.3 Rename `src/data/rooms/start.ts` to the test room with an empty exit list, add three run rooms with 4, 5 and 6 chasers and one exit each, and add `src/data/run.ts` exporting the ordered sequence; verify tests that every run room loads, has at least one chaser beyond notice range of its spawn point, no dummies and exactly one exit, that the sequence has three rooms and excludes the test room, and that the test room still has its dummies and four chasers
- [ ] 5.4 Add a run section to `docs/architecture.md`, record the run-above-the-simulation, derived-seed and hand-written-rooms decisions in `docs/decisions.md`, and add the new test files to the table in `docs/development.md`; verify each doc matches the code

## 6. View

- [ ] 6.1 Build `GameScene` from scene data (a run or the test room), reading `?room=test` and `?seed=` from the page address on first boot and choosing a seed in the view otherwise; verify in the browser that the plain address starts in run room 1, `?room=test` opens the test room with dummies, and `?seed=42` shows seed 42 in the debug overlay
- [ ] 6.2 Draw each exit from the simulation's exposed state, as a raised barrier distinct from a wall while fighting and a flat ground marking once cleared; verify in the browser that the barrier is visible on entering, changes on the step the last chaser is defeated, and that the test room draws no exit
- [ ] 6.3 On `exitReached`, call `leaveRoom` and restart the scene with the run when it is still playing; verify in the browser that walking into the open exit loads the next room at its spawn point with health unchanged, and that no input listeners or graphics from the previous room remain (no doubled input, no leftover shapes)
- [ ] 6.4 Add the room progress text to the HUD with a pure formatting helper in `src/view/hud.ts`, hidden in the test room; verify a test in `tests/hud.test.ts` for "room 2 of 3" and, in the browser, that it stays fixed under camera movement and shake
- [ ] 6.5 Show the run complete message when the run completes, sharing the shade, restart delay and fresh-press rule with defeat, and make both start a new run with a newly chosen seed (the test room restarts itself); verify in the browser that a held button does not restart, a fresh press after the delay starts room 1 at full health with a different seed, and defeat in room 2 or 3 returns to room 1
- [ ] 6.6 Document the URL parameters and the test room in `docs/development.md`; verify each documented address behaves as written

## 7. Project docs and integration

- [ ] 7.1 Update `docs/roadmap.md` (mark `room-flow`, reword "waves" to say rooms hold one group and waves are deferred, close the room editor question, update known gaps) and `docs/game-design.md` (combat room description, room and run loop status, test room row); verify no remaining statement in either doc contradicts the specs of this change
- [ ] 7.2 Run `npm run typecheck`, `npm test` and `npm run build`; verify all three succeed
- [ ] 7.3 Play three full runs in the browser, and one defeat in each room; verify every run reaches the run complete message, every defeat returns to room 1, and note in `docs/tuning.md` whether 4, 5 and 6 chasers on one health pool feels too hard, too easy or right
