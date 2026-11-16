# Design

## Context

See `proposal.md` for motivation. The facts that shape the approach:

- `createSim(seed, room)` builds a whole simulation for one room. `SimState` has no notion of a room phase, an exit, or a run.
- Collision (`resolveCircle`, `moveCircle`) takes the room and reads `room.walls` and the bounds. Chaser steering reads the same walls.
- Every non-player entity has `home` and `respawnDelay`; `updateRespawns` restores chasers after `CHASER.respawnDelay` steps.
- `GameScene.create()` draws floor and walls once from a hard-coded `startRoom` and `SEED = 1`. Defeat calls `scene.restart()`, which already rebuilds simulation, graphics, effects and input together.
- `step` already has a "stop everything" path for a defeated player.
- A test enforces that `src/sim` imports no Phaser, touches no browser globals, and uses no unseeded randomness.

## Goals / Non-Goals

**Goals:**

- A room that can be cleared and left, and three of them chained into a run, all testable headless.
- One explicit place that lists what crosses a door.
- Room data that will not need rewriting when path choice arrives.

**Non-Goals:**

- Run-time spawning, waves, or spawn telegraphs.
- Transition effects between rooms. The change is an immediate scene restart.
- Drawing an entrance door, or matching the exit of one room to the spawn of the next.
- Room types. Every room in the sequence is a combat room, so no type field is added yet.
- Pathfinding. New rooms follow the existing rule of avoiding concave wall shapes.

## Decisions

### 1. A run object above the simulation, one simulation per room

```
  Run { seed, roomIndex, playerHealth, status }      src/sim/run.ts, pure
     |
     +-- enterRoom(run)  -> createSim(roomSeed, room, { playerHealth })
     +-- leaveRoom(run, sim) -> copies health out, advances roomIndex or sets status 'complete'
```

- **Why:** carry-over is explicit. Only what `leaveRoom` copies out and `enterRoom` passes in survives a door, so dash cooldown, combo, buffers, knockback and hitstop reset for free. Boons later become another field on `Run`.
- **Turned down:** one `SimState` for the whole run that swaps room and entities in place. Every system would have to tolerate the room changing between steps, the view would need a new redraw path, and anything nobody remembered to reset would leak across rooms.
- **Where:** in `src/sim` so the no-Phaser, no-unseeded-randomness test covers it. The run module never chooses a seed; it is given one.
- **Consequence:** the `game-simulation` determinism requirement stays per room. A whole-run replay test chains simulations through the run module.

### 2. Room seeds are derived from the run seed and the room index

- `roomSeed = mix(runSeed, roomIndex)` with a fixed integer mix (for example `(runSeed ^ Math.imul(roomIndex + 1, 0x9E3779B1)) >>> 0`).
- **Why:** each room's randomness is independent of how many random values the previous room drew, so a change to one room's tuning does not shift the next room's behavior.
- **Turned down:** passing the generator's state from room to room. It couples rooms and makes a single room impossible to replay alone.

### 3. Room phase is a field of `SimState`: `'fighting' | 'cleared' | 'left'`

- Set at creation: `'cleared'` when the room has no enemy placements, otherwise `'fighting'`.
- Checked at the end of `step`, after separation:
  1. If fighting and every entity with `ai` is defeated: set `'cleared'`, open the exits, push `roomCleared`.
  2. If cleared and the player's centre is inside an exit: set `'left'`, push `exitReached` with the exit's index.
- `step` returns early when the phase is `'left'`, exactly as it does for a defeated player.
- **Why "entities with `ai`":** it is the existing distinction between enemies and dummies, and future enemy kinds get it automatically.
- **Why a `'left'` phase:** up to five steps run per display frame. Without it the steps after `exitReached` would keep simulating a room the player has left, and could report the event again.
- **Why the centre, not circle overlap:** leaving should be deliberate. With overlap, a player standing beside the exit when the last enemy dies could leave by drifting one unit.

### 4. Exits are rectangles in a list, solid while fighting

- `Room.exits: Rect[]`. One entry per room in this change; the test room has none.
- `SimState` gains `solids: Rect[]`, built at creation as `room.walls` plus the exits when the room starts fighting. Collision and chaser steering read `state.solids` instead of `room.walls`. On clearing, `solids` is rebuilt without the exits.
- The exit-reached event carries the index into `room.exits`. The run ignores it today; path choice will read it.
- **Why a list now:** agreed during exploration. A second exit later is data plus a branching sequence, with no migration of room files.
- **Why solid rectangles rather than a separate "door" collision rule:** the resolver, dash sub-stepping, knockback and steering already handle rectangles correctly. A closed exit is a wall that goes away.
- **Turned down:** an exit as a gap in the bounds that the player walks out through. The bounds clamp in `resolveCircle` would need exceptions, and the camera bounds assume a full rectangle.
- **Validation** (in `loadRoom`, with the exit's index in the message): at least the player's diameter in both dimensions, inside the bounds, touching a bounds edge, clear of walls and other exits, clear of the spawn circle and every dummy and enemy placement. Existing placement checks are untouched.
- `createRun` additionally rejects a sequence containing a room with no exits, since such a room could never be left.

### 5. Entering health is an optional argument to `createSim`

- `createSim(seed, room, enter?: { playerHealth?: number })`. Omitted means maximum health, so every existing caller and test is unchanged.
- A value of zero or less, or above the maximum, throws. The run can never produce one (a defeated player cannot reach an exit), so an invalid value is a programming error worth surfacing.

### 6. Chaser respawn is removed, not switched off

- `CHASER.respawnDelay` is deleted, and chasers are created with `home: null`. `updateRespawns` already skips entities without a home, so dummies keep working with no new branch.
- **Trade-off accepted:** in the test room, defeated chasers stay defeated until the page is reloaded. A per-room respawn flag would restore the old tuning loop but adds a second enemy lifecycle to specify and test. Revisit if tuning in the test room becomes painful.

### 7. The scene is built from scene data; the view owns seeds and the URL

- `GameScene.init(data)` receives either a `Run` or a marker for the test room. On first boot, with no data, it reads the page address: `?room=test` selects the test room, `?seed=<integer>` fixes the first run's seed, otherwise the seed is chosen with `Math.random` in the view.
- On `exitReached`: call `leaveRoom`. If the run is still playing, `scene.restart({ run })`. If it is complete, stay in the scene with the simulation stopped and show the run complete overlay.
- Defeat and run complete share one "ended" path: the same shade, the same restart delay, the same fresh-press rule from `acceptsRestart`, and both start a new run with a newly chosen seed. In the test room the defeat path restarts the test room.
- **Why scene restart per room:** it is the mechanism defeat already uses and it is known to clean up input listeners and graphics. A room change is the same amount of rebuilding.
- **Why the seed is chosen in the view:** the simulation may not use unseeded randomness. The debug overlay shows the run seed so a run can be reproduced with `?seed=`.

### 8. Rooms stay hand-written TypeScript

- Three new files under `src/data/rooms/`, and `src/data/run.ts` exporting the ordered sequence. `rooms/start.ts` is renamed to the test room.
- **Why:** three layouts do not justify an editor, its export format, or a loader. `room-editor-pipeline` remains a candidate change for when hand-written data becomes the bottleneck.
- First-guess content: rooms smaller than the test room, with 4, 5 and 6 chasers placed beyond notice range (420) of the spawn point, and the exit on the edge farthest from the spawn point.

## Risks / Trade-offs

- **Difficulty is unknown.** Fifteen chasers at 10 damage per hit against 100 health with no healing may be too hard or too easy. → Chaser counts are data in three files; tune by playing. If no setting feels right, healing is a design question to raise, not something to add silently.
- **Existing tests may see a new event.** Any test that defeats every chaser in its room now also receives `roomCleared`. → Tests that assert exact event lists are updated in the same task that adds the event; `tests/helpers.ts` `room()` gains an `exits` parameter defaulting to none.
- **A knocked-back entity resting against a closed exit when it opens.** → Only the player can be alive at that moment, and the player is never inside the rectangle while it is solid, so nothing is left overlapping.
- **Steering around an exit.** A closed exit is one more rectangle for the sideways detour. → Exits sit on the edge, away from the middle of the room, and room layouts keep them clear of wall corners so no concave pocket forms.
- **Scene restart flashes between rooms.** → Accepted for now; a transition belongs to the interface work in milestone 4.
- **The scene still has no automated tests.** → The run, room phase, exits and validation are all in `src/sim` and tested there; the scene's part is checked by hand with named browser checks in the tasks.

## Migration Plan

No saved data or deployed users exist. The change lands in one branch; rollback is reverting it. Specs for the removed chaser respawn and the renamed defeat requirement are updated when the change is archived.

## Open Questions

- Should the exit be reachable only after a short pause once the room is cleared, so the last hit's feedback is not cut off by leaving? Decide by playing; it would be a tuning value and one extra condition, with no change to the approach.
- Is the room progress display better beside the health bar or at the top of the screen? Decide in the browser.
