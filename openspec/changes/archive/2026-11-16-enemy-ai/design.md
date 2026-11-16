# Design

## Context

The simulation in `src/sim` holds one `Entity` type (kinds `player` and `dummy`), a `PlayerCombat` state machine for the player, and a single `SimState.hitstop` counter that pauses everything. `applyHit` is the only place health changes; it already takes a source position and an optional source id. The player's attack tests a sector against entity circles in `sim/sector.ts`. `step` returns its events; the view reads state and reacts to events. Rooms place dummies through `Room.dummies`, and `loadRoom` validates them. See proposal.md for motivation and scope, and the spec deltas for required behavior.

Three choices were made with the user before planning: this change contains the chaser only; hitstop pauses only the attacker and the target; defeat stops play and a key press restarts the room.

Constraints carried over:

- `src/sim` stays free of Phaser, browser globals, and unseeded randomness, and stays deterministic.
- All timing is in simulation steps and all tunable values are data.
- Every attack is drawn as the shape it will hit.

## Goals / Non-Goals

**Goals:**

- Enemy behavior that the shooter and charger can sit beside without reshaping what is built here.
- Enemy attacks that reuse the sector test, `applyHit`, and the event stream unchanged in meaning.
- Per-entity hitstop that leaves a one-on-one hit feeling the same as today.

**Non-Goals:**

- A general behavior-tree or utility-AI framework. One enemy kind, written directly as a small state machine.
- Pathfinding or a navigation grid. Steering handles a single convex wall; concave layouts are not handled.
- A scene or screen manager. Defeat is an overlay on the one scene.
- Any change to the player's attack, dash, or input intent.

## Decisions

### 1. Enemy behavior state lives on the entity as a tagged union

`Entity` gains `kind: 'chaser'` and `ai`, which is `null` for the player and dummies:

```
ai: {
  kind: 'chaser'
  state: { kind: 'idle' }
       | { kind: 'pursue' }
       | { kind: 'attack', phase: 'windup'|'active'|'recovery', ticksLeft, dir, hasHit }
       | { kind: 'stagger', ticksLeft }
  cooldown   steps until it may attack again
  waited     steps spent ready to attack but held back by the attacker limit
  detour     null | { side: -1 | 1, ticksLeft }
  lastSide   the side of its most recent detour
}
```

- **Why**: there are many enemies, so their state belongs with each one, and a tagged union rules out combinations such as attacking while staggered, as it does for the player. It is plain data, so the determinism test covers it.
- **Alternative, a map from entity id to state on `SimState`** (how `PlayerCombat` is held): keeps `Entity` smaller, but every system that walks enemies needs two lookups and the two can drift apart on respawn.
- **Alternative, a separate `Enemy` type and list**: `applyHit`, knockback, separation, and drawing all walk one entity list today; a second list means every one of them walks two.

Behavior code goes in a new `src/sim/enemy.ts`. A second enemy kind adds a variant to `ai` and a function beside the chaser's.

### 2. Enemy values are data

New `src/data/enemies.ts` holds one definition per enemy kind. The attack reuses the `AttackDef` shape from `data/weapons.ts`, so enemy and player attacks are read by the same code.

| Chaser value | Default |
|---|---|
| Health, radius | 60, 16 units |
| Speed | 150 units/s |
| Notice range | 420 units |
| Attack distance (center to center) | 56 units |
| Attack windup, active, recovery | 24, 3, 30 steps |
| Attack damage, knockback, hitstop | 10, 260 units/s, 4 steps |
| Attack range, angle, lunge | 64 units, 90 degrees, 16 units |
| Attack cooldown | 50 steps |
| Stagger | 20 steps |
| Respawn delay | 180 steps |

`data/tuning.ts` gains the attacker limit (2) and the restart delay (0.5 seconds, a view value).

With these numbers a player who walks straight back at full speed during the 0.4-second windup escapes the swing, and one who is mid-attack does not. They are starting points; the specs refer to them as configured values.

### 3. Hitstop moves from the simulation to each entity

`SimState.hitstop` is removed. `Entity` gains `hitstop`, the number of steps it stays paused. `applyHit` raises the target's counter and, when a source id is given, the source's, to at least the hit's hitstop.

At the start of a step each entity with `hitstop > 0` has it decremented and is treated as frozen for that step: its behavior, timers, movement, knockback, and separation are skipped. Presses are still read while the player is frozen. A frozen entity can still be hit.

- **Why**: chosen with the user. With several enemies, a global pause on every hit, including every enemy hit on the player, stutters the whole screen.
- **What stays the same**: when the player hits one target, both pause for the same steps as before, so the existing hitstop tests keep their timing and change only where they read the counter.
- **Alternative, global pause for the player's hits only**: keeps the punch of a full freeze but lets enemy hits pass with no weight, and still stops a crowd dead on every swing.

### 4. Step order

```
 1. copy pos to prevPos
 2. read presses from the intent                      (always)
 3. if the player is defeated: count the tick, stop
 4. count down hitstop; entities still paused are frozen this step
 5. count down respawn timers; restore entities whose timer ends
 6. player, unless frozen: timers, action, movement   (unchanged inside)
 7. enemies, unless frozen or defeated:
      a. advance each one's state: attack phase, stagger, cooldown, noticing
      b. grant attacks to those ready, longest wait first, up to the limit
      c. move those pursuing; lunge those in the active phase
 8. hits: the player's active attack against targets,
          then each enemy's active attack against the player
 9. integrate knockback for entities that are not frozen
10. separation: enemies out of the player, dummies, and each other, then walls;
                then the player out of solid entities (unless dashing or frozen)
11. count the tick
```

Step 7 is three passes over the enemies so that a place freed in pass (a) can be granted in pass (b) on the same step, and so that who attacks does not depend on entity order.

### 5. Steering is seek plus a sideways detour when blocked

A pursuing chaser steers straight at the player and moves through the existing `resolveCircle`, which already slides it along walls. It is blocked when a step moves it less than half the intended distance. When blocked it starts a detour: for 30 steps it steers 75 degrees to one side of the direction to the player, which slides it along the wall's face. When the detour ends it seeks again; if still blocked it detours to the same side. If a detour itself makes no progress, the side flips.

The first side is the one the wall is already sliding it toward, or, when it hits the wall square on, a draw from the simulation's seeded generator.

- **Why**: rooms are open floors with rectangular walls. This goes around any single rectangle and costs a few lines and no map data.
- **Alternative, grid pathfinding (A\*)**: correct for any layout, but needs a navigation grid built from each room and path smoothing, for rooms that do not need it yet. Revisit when a room layout defeats the detour.
- **Alternative, steering by feeler rays**: smoother, but needs ray-versus-rectangle tests and tuning for corners; the detour reuses collision that is already tested.

### 6. Separation is a positional push, not a steering force

After movement, each enemy is pushed out of the player and of dummies (only the enemy moves), overlapping enemy pairs are pushed apart half each, and walls are resolved again. Two passes. Then the existing player separation runs unchanged.

- **Why**: a positional rule guarantees the result the spec asks for and is the same technique already used for the player against dummies.
- **Consequence**: an enemy's own movement never moves the player. A knocked-back enemy can still end up inside the player, and the existing rule then moves the player out, as with dummies.
- **Alternative, a repulsion force blended into steering**: gives looser crowds but allows overlap under pressure and adds a value to tune.

### 7. The attacker limit is counted, not stored

Each step, pass (b) counts enemies in windup or active and grants attacks to ready enemies while the count is below the limit. Ready means pursuing, within attack distance, and cooldown elapsed. Ready enemies that are refused add one to `waited`; the grant order is `waited` descending, then entity id.

- **Why**: nothing to keep in sync. An attacker that is interrupted or defeated frees its place by no longer being counted.
- **Alternative, attack tokens held by enemies**: needs every way an attack can end to hand the token back.

Recovery does not count toward the limit, so the next enemy starts as the previous swing ends.

### 8. Enemy attacks reuse the sector test and `applyHit`

In step 8 an enemy in its active phase builds its sector with `makeSector` and tests the player's circle. On overlap it calls `applyHit` with its own position and id, and marks the attack as having hit. Only the player is tested, which is what keeps enemies from hurting each other.

Dash invulnerability needs no new code: `applyHit` already ignores invulnerable targets.

An enemy hit knocks the player back and pauses the player for the hit's hitstop, but does not end the player's attack or dash.

### 9. Stagger is a state, entered from `applyHit`'s caller

When a hit lands on an entity with `ai`, its state becomes `stagger` with the configured duration, whatever it was doing. A new hit restarts the duration. Stagger counts down only while the entity is not frozen, so it starts after the hitstop. When it ends the state becomes `pursue`, which is also how a hit makes an idle chaser notice the player.

- **Why here and not inside `applyHit`**: `applyHit` stays about health, knockback, hitstop, and events. The reaction to being hit is behavior and belongs to the enemy module, which exposes one function that `applyHit` calls for targets with `ai`.

### 10. Respawn delay is per entity

`Entity` gains `respawnDelay`, set at creation: the dummy value for dummies, the definition's value for chasers, 0 for the player. `applyHit` uses it in place of the dummy constant. Restoring an entity also resets its `ai` to idle and its hitstop to 0.

### 11. Defeat is an early return; restart rebuilds the scene

`applyHit` already marks an entity defeated at zero health and reports `defeated`. `step` returns early while the player is defeated, counting the tick only.

The view notices the player's `defeated` flag, starts a timer in display seconds, and shows the message. `DeviceInput` reports whether any new key or mouse press arrived this frame. Once the timer exceeds the restart delay, such a press calls Phaser's scene restart, which runs `create` again and builds a fresh simulation with `createSim`.

- **Why display seconds for the delay**: the simulation is stopped, so there are no steps to count.
- **Why any new press**: presses are discrete events; a button held since before the delay produces none, which gives the spec's "held through the delay" behavior with no extra state.
- **Why scene restart**: every view object is created in `create` and input listeners are already removed on shutdown, so nothing new has to be torn down by hand.
- **Alternative, a `resetSim` that mutates state in place**: the view would also have to reset its per-entity graphics, effects, and timers one by one.

The same seed is reused, so a restart begins identically.

### 12. What the view reads and draws

- `enemyAttackAreas(state)` returns, for each attacking enemy, its id, phase, windup progress from 0 to 1, apex, direction, range, and angle. The player's `attackArea` is unchanged.
- **Telegraph**: the same projected fan as the player's arc, in red. Opacity comes from a pure function of phase and progress so it can be tested: low at the start of windup, rising to the end, full in the active phase, nothing in recovery.
- **Chaser**: a red body with a pointed facing marker, with a shadow, depth-sorted by ground `y`. Hit flash, health bar, and hiding when defeated come from the existing per-entity drawing.
- **Health display**: a bar and "current / max" text in the lower left, with scroll factor 0 so camera movement and shake do not move it. The fill width comes from a pure function.
- **Defeat message**: a dimming rectangle and centered text, also at scroll factor 0. A second line appears when the restart delay has passed.
- The floating health bar skips the player.
- The debug overlay shows the player's own hitstop and the number of enemies currently attacking.

Pure helpers go in `src/view` with tests; `GameScene` and `DeviceInput` stay thin and are checked in the browser, as today.

## Risks / Trade-offs

- [Per-entity hitstop changes a feel that was just approved] → The player and the target still pause together for the same steps, so hitting a dummy should look the same. Check against dummies before tuning chasers.
- [The detour fails in concave layouts, such as the L-shaped corner in the starting room] → Accepted. Chaser placements avoid it. Pathfinding is deferred until a room needs it.
- [No invulnerability after being hit, so two chasers can land hits back to back] → The attacker limit and cooldowns space attacks out. Watch in playtesting; see Open Questions.
- [Stagger lets the player lock down one chaser for a whole combo] → Intended for the basic enemy. Pressure comes from numbers and the attacker limit.
- [Pairwise separation can leave a small overlap in a crowd pressed against a wall for a step or two] → The spec requires enemies not to come to rest overlapping; two passes per step settle within a few steps.
- [Chasers reappear forever, so the room can never be cleared] → Right for a test bed. Room flow replaces it with waves.
- [Tests and docs describe global hitstop] → The tasks that change hitstop update the affected tests and docs in the same group.
- [Everything stopping at the moment of defeat hides whether a second hit was coming] → Accepted for now; the frozen picture shows what landed the final hit.

## Open Questions

- Whether the player should be briefly invulnerable after taking a hit. Not built here; decide after playing against a group.
- Whether an enemy hit should interrupt the player's attack. Not built here; it would make chasers far more dangerous and is a tuning decision.
- Whether walls should block noticing. Notice is by distance only; it matters once rooms have enclosed areas.
- Whether a restart should use a new seed. It only affects detour tie-breaks today.
