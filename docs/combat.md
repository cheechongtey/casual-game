# Combat

How attacking, dashing, and damage behave in the current build. Numbers shown are the defaults; where they live and how to change them is in [tuning.md](tuning.md).

All timing is counted in simulation steps. One step is 1/60 second.

## Controls

| Input | Action |
|---|---|
| W A S D | Move |
| Mouse | Aim |
| Left mouse button | Attack; hold to keep attacking |
| Space | Dash; one dash per press |

## The player's action

The player is always in exactly one state:

```
                 attack held or buffered
        +------------------------------------+
        |                                    v
     +------+                        +----------------+
     | idle | <--- recovery ends --- |     attack     |
     +------+                        | windup -> active -> recovery
        ^  |                         +----------------+
        |  | dash pressed                    |
        |  v                                 | dash pressed (any phase)
     +------+                                |
     | dash | <------------------------------+
     +------+
        |
        +--- dash ends --> idle, cooldown starts
```

- Dash is checked before attack, so pressing both on the same step dashes.
- An attack cannot start during a dash. A press made during a dash is buffered.

## Attacks

### Phases

Each attack runs through three phases in order:

| Phase | What happens |
|---|---|
| Windup | Nothing can be hit. The arc is drawn faintly as a telegraph. |
| Active | The attack can hit. The player lunges forward. The arc is drawn bright. |
| Recovery | Nothing can be hit. The player cannot start another attack yet. |

### The combo

| Attack | Windup | Active | Recovery | Total | Damage | Range | Arc |
|---|---|---|---|---|---|---|---|
| 1 | 4 | 3 | 8 | 15 steps (0.25 s) | 20 | 72 | 110° |
| 2 | 4 | 3 | 8 | 15 steps (0.25 s) | 20 | 72 | 110° |
| 3 (finisher) | 7 | 4 | 14 | 25 steps (0.42 s) | 40 | 84 | 150° |

- After an attack ends, the next attack continues the combo if it starts within the combo window (20 steps). Otherwise the combo restarts at attack 1.
- After the finisher the combo always restarts.
- Holding the attack button chains attacks with no extra presses.
- A full combo deals 80 damage.

### Direction

An attack's direction is the aim angle on the step it starts. It stays fixed until the attack ends, and the player's facing is locked to it. Moving the mouse mid-swing changes nothing until the next attack.

### Hit area

The hit area is a circular sector on the ground: apex at the player's position, centered on the attack direction, with the attack's range and angle.

```
              . - ~ ~ - .
          . '             ' .
        /                     \        range
       |          hit          |
        \         area        /
          ' .             . '
              ' - . _ . - '
                   \ | /
                    \|/   angle
                     o  player
```

A target is hit when its circle overlaps the sector. A target whose center is outside the angle but whose edge crosses into the sector is still hit.

The arc drawn on screen is the projection of this same sector, so what you see is what can hit.

### One hit per attack

Each attack damages a given target at most once, however long the target stays inside the arc.

### Movement while attacking

- Move input still works at 30% of normal speed.
- During the active phase the player also lunges forward along the attack direction: 10 units for attacks 1 and 2, 18 for the finisher.
- Both are stopped by walls.

## Dash

| Property | Default |
|---|---|
| Distance | 170 units |
| Duration | 10 steps (0.17 s) |
| Cooldown | 24 steps (0.4 s), counted from the end of the dash |

- **Direction:** the move direction held when the dash starts, or the facing direction if none is held. It cannot be steered once started.
- **Trigger:** a new press. Holding Space does not dash again.
- **Walls:** a dash stops at walls and slides along them. It cannot pass through a wall of any thickness.
- **Entities:** a dash passes through dummies. If it ends inside one, the player is pushed out on the next step.
- **Invulnerability:** the player cannot be damaged from the step a dash starts until it ends. Nothing in the game damages the player yet, so this is only exercised by tests.

### Dash cancel

A dash can start during any phase of an attack. Doing so ends the attack at once, with no further hits, and restarts the combo at attack 1. This is the way out of the finisher's long recovery.

## Input buffering

A press made slightly too early is remembered for 8 steps.

- **Attack:** a press during an attack or dash starts the next attack as soon as one can start, provided that is within 8 steps.
- **Dash:** a press during the cooldown starts a dash when the cooldown ends, provided that is within 8 steps.

A buffered attack waits for recovery to end. It cannot interrupt recovery.

## Damage

Every hit goes through one function, `applyHit`. A hit against a defeated or invulnerable target does nothing at all.

### Health and defeat

- An entity starts at full health. Health never goes below zero.
- At zero the entity is defeated. It is no longer drawn, cannot be hit or pushed, and stops blocking the player.

### Knockback

A hit pushes the target directly away from the attacker. The push decays each step until the target stops.

| Attack | Knockback speed | Rough distance pushed |
|---|---|---|
| 1 and 2 | 380 units/s | about 40 units |
| 3 (finisher) | 720 units/s | about 80 units |

A pushed target stops at walls and the room edge.

### Hitstop

When a hit lands, the whole simulation pauses: 3 steps for attacks 1 and 2, 6 for the finisher. During the pause nothing moves and no timer advances. Presses made during it are still buffered.

A miss causes no pause.

## Training dummies

- 200 health, radius 20.
- Stand where the room definition places them. The starting room has three beside the spawn point.
- Never move on their own and never attack.
- Solid: the player cannot walk through them, and walking into one does not move it.
- Reappear at their placement with full health 120 steps (2 s) after defeat. If the player is standing there, the player is pushed out.

## Feedback

| What you see | Driven by |
|---|---|
| Faint arc, then bright arc | The attack's phase; the finisher's arc is orange |
| Target flashes white | A `hit` event; lasts 0.12 s |
| Screen shake | A `hit` event; strength scales with the hit's hitstop |
| Health bar | Shown above an entity only while it is damaged |
| Light tint and fading trail | The player is dashing |
| Debug overlay (top left) | Tick, position, facing, action, combo, cooldown, hitstop |
